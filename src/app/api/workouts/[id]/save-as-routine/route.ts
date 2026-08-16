import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ============================================================
// ForgeFitOS — Save a workout as a routine (UI-5B2)
// POST { name, description? } -> create_routine_from_workout RPC
// (migration 022). The RPC is the integrity authority: ownership,
// eligible source status, three-step source locking, bounds, the
// structure-only copy matrix, and duplicate-name detection all
// commit (or abort) in one transaction. The user comes solely from
// the authenticated session — no client user id is ever accepted,
// and no service role exists anywhere in this app.
// ============================================================

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function mapRpcError(message: string): { status: number; error: string } {
  if (message.includes('not_authenticated')) {
    return { status: 401, error: 'Unauthorized' }
  }
  // Not-owned and nonexistent sources are indistinguishable on
  // purpose — existence is never leaked.
  if (message.includes('not_found')) {
    return { status: 404, error: 'Not found' }
  }
  if (message.includes('invalid_input')) {
    return { status: 400, error: 'Invalid request.' }
  }
  return { status: 500, error: 'Could not save the routine.' }
}

function validateBody(
  body: unknown
): { ok: true; name: string; description: string | null } | { ok: false; error: string } {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { ok: false, error: 'Expected an object body.' }
  }
  const keys = Object.keys(body as Record<string, unknown>)
  if (!keys.every((k) => k === 'name' || k === 'description')) {
    return { ok: false, error: 'Body may contain only name and description.' }
  }
  const raw = body as Record<string, unknown>
  if (typeof raw.name !== 'string') {
    return { ok: false, error: 'A routine name is required.' }
  }
  const name = raw.name.trim()
  if (name.length === 0) return { ok: false, error: 'A routine name is required.' }
  if (name.length > 120) return { ok: false, error: 'Routine name is too long (120 characters max).' }
  if (raw.description !== undefined && typeof raw.description !== 'string') {
    return { ok: false, error: 'Description must be text.' }
  }
  const description = typeof raw.description === 'string' ? raw.description.trim() : ''
  if (description.length > 2000) {
    return { ok: false, error: 'Description is too long (2000 characters max).' }
  }
  return { ok: true, name, description: description.length > 0 ? description : null }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!UUID_RE.test(params.id)) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }
  const validated = validateBody(body)
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 })
  }

  // The single RPC call — the route performs no other reads/writes.
  const { data, error } = await supabase.rpc('create_routine_from_workout', {
    p_workout_session_id: params.id,
    p_name: validated.name,
    p_description: validated.description,
  })
  if (error) {
    const mapped = mapRpcError(error.message ?? '')
    return NextResponse.json({ error: mapped.error }, { status: mapped.status })
  }

  // Expected business outcome returned as data by the RPC.
  if ((data as any)?.error === 'duplicate_name') {
    return NextResponse.json(
      { error: 'A routine with this name already exists.' },
      { status: 409 }
    )
  }

  // Fail CLOSED: a success response must carry the created id.
  const routineId = (data as any)?.routine_id
  if (typeof routineId !== 'string' || !UUID_RE.test(routineId)) {
    return NextResponse.json({ error: 'Could not save the routine.' }, { status: 500 })
  }

  return NextResponse.json({ data: { routine_id: routineId } }, { status: 201 })
}
