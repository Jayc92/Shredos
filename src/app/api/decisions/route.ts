import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}

/** PATCH /api/decisions?id=<uuid> — update status (accept/dismiss) */
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

  const body = await request.json() as { status: string; notes?: string }

  const updateData: Record<string, unknown> = {
    status: body.status,
  }

  if (body.status === 'accepted' || body.status === 'applied') {
    updateData.applied_at = new Date().toISOString()
  }

  if (body.notes) {
    updateData.notes = body.notes
  }

  const { data, error } = await supabase
    .from('decision_logs')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id) // RLS also enforces this, but be explicit
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
