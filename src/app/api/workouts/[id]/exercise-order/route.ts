import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ============================================================
// ForgeFitOS — Transactional workout exercise reorder (UI-5B1B)
// PUT { ordered_ids: string[] } -> reorder_workout_exercises RPC
// (migration 021). The RPC is the integrity authority: ownership,
// exact-set validation, and the single contiguous order_index UPDATE
// all commit (or abort) in one transaction. Completed workouts are
// allowed because the function can only touch presentation order.
// The user comes solely from the authenticated session — no client
// user id is ever accepted.
// ============================================================

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function mapReorderError(message: string): { status: number; error: string } {
  if (message.includes('not_authenticated')) {
    return { status: 401, error: 'Unauthorized' }
  }
  if (message.includes('not_found')) {
    return { status: 404, error: 'Not found' }
  }
  if (message.includes('stale_exercise_list')) {
    return {
      status: 409,
      error: 'The exercise list changed — refresh and try again.',
    }
  }
  if (message.includes('invalid_input')) {
    return { status: 400, error: 'Invalid exercise order.' }
  }
  return { status: 500, error: 'Could not save the new order.' }
}

function validateOrderedIdsBody(
  body: unknown
): { ok: true; ids: string[] } | { ok: false; error: string } {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { ok: false, error: 'Expected an object body.' }
  }
  const keys = Object.keys(body as Record<string, unknown>)
  if (keys.length !== 1 || keys[0] !== 'ordered_ids') {
    return { ok: false, error: 'Body must contain exactly ordered_ids.' }
  }
  const ids = (body as Record<string, unknown>).ordered_ids
  if (!Array.isArray(ids) || ids.length === 0) {
    return { ok: false, error: 'ordered_ids must be a non-empty array.' }
  }
  if (!ids.every((id) => typeof id === 'string' && UUID_RE.test(id))) {
    return { ok: false, error: 'ordered_ids must contain only ids.' }
  }
  if (new Set(ids).size !== ids.length) {
    return { ok: false, error: 'ordered_ids must not contain duplicates.' }
  }
  return { ok: true, ids: ids as string[] }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }
  const validated = validateOrderedIdsBody(body)
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 })
  }

  const { error } = await supabase.rpc('reorder_workout_exercises', {
    p_session_id: params.id,
    p_ordered_ids: validated.ids,
  })
  if (error) {
    const mapped = mapReorderError(error.message ?? '')
    return NextResponse.json({ error: mapped.error }, { status: mapped.status })
  }
  return NextResponse.json({ data: { reordered: validated.ids.length } })
}
