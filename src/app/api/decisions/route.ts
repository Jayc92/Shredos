import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateDecisionUpdate } from '@/lib/decisions'
import type { DecisionLogInsert } from '@/types/database'

/** POST /api/decisions — create a new decision log entry */
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json() as Partial<DecisionLogInsert>

  const decisionType = body.decision_type ?? 'unknown'
  const createdBy = body.created_by ?? 'system'

  // Phase 1K: prevent duplicate suggested coach decisions of the same
  // type piling up from repeated "Record this decision" clicks. Only
  // applies when created_by === 'coach' — user/system-created decisions
  // are unaffected. Scoped to status === 'suggested' specifically: once
  // a matching decision is accepted or dismissed (status changes away
  // from 'suggested'), this guard stops matching and a fresh suggestion
  // can be recorded again.
  if (createdBy === 'coach') {
    const { data: existing } = await supabase
      .from('decision_logs')
      .select()
      .eq('user_id', user.id)
      .eq('decision_type', decisionType)
      .eq('created_by', 'coach')
      .eq('status', 'suggested')
      .limit(1)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ data: existing, duplicate: true }, { status: 200 })
    }
  }

  const { data, error } = await supabase
    .from('decision_logs')
    .insert({
      user_id: user.id,
      decision_type: decisionType,
      decision_title: body.decision_title ?? '',
      decision_summary: body.decision_summary ?? '',
      reason: body.reason ?? '',
      data_snapshot: body.data_snapshot ?? null,
      previous_value: body.previous_value ?? null,
      new_value: body.new_value ?? null,
      status: body.status ?? 'suggested',
      created_by: createdBy,
      applied_at: body.applied_at ?? null,
      notes: body.notes ?? null,
    })
    .select()
    .single()

  if (error) {
    // Phase 3D: raw database messages stay in server logs, never in
    // the response body.
    console.error('POST /api/decisions error:', error)
    return NextResponse.json({ error: 'Unable to record decision.' }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}

/**
 * PATCH /api/decisions?id=<uuid> — explicit user-driven decision
 * updates (Phase 3D rewrite). Previously this passed arbitrary
 * client-submitted status strings straight to the database (no
 * transition validation; the CHECK constraint's raw error leaked to
 * the client). Now:
 *   1. the decision is loaded first, scoped to the authenticated user
 *      (unknown/foreign ids → a safe 404, indistinguishable by
 *      design),
 *   2. the pure state-model validator (lib/decisions.ts) judges the
 *      patch — allowed transitions only, enum values only, unknown
 *      fields ignored, notes trimmed/length-limited, review dates
 *      strictly date-only,
 *   3. same-value patches are idempotent successes returning the
 *      unchanged row,
 *   4. database failures log server-side and return a generic
 *      message.
 * No automatic writes happen anywhere else — every field persisted
 * here originates from an explicit user action in the UI.
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json() as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { data: existing, error: fetchError } = await supabase
    .from('decision_logs')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id) // RLS also enforces this, but be explicit
    .maybeSingle()

  if (fetchError) {
    console.error('PATCH /api/decisions fetch error:', fetchError)
    return NextResponse.json({ error: 'Unable to update decision.' }, { status: 500 })
  }
  if (!existing) {
    return NextResponse.json({ error: 'Decision not found.' }, { status: 404 })
  }

  const result = validateDecisionUpdate(existing, body, new Date().toISOString())
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  // Idempotent no-op (same values resubmitted): nothing to write.
  if (Object.keys(result.update).length === 0) {
    return NextResponse.json({ data: existing })
  }

  const { data, error } = await supabase
    .from('decision_logs')
    .update(result.update)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    console.error('PATCH /api/decisions update error:', error)
    return NextResponse.json({ error: 'Unable to update decision.' }, { status: 500 })
  }

  return NextResponse.json({ data })
}
