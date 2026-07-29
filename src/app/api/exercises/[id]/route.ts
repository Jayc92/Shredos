import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  // Phase 2O: notes-specific validation only. Every other field on
  // this route (name, category, primary_muscle, equipment,
  // exercise_type, unilateral, is_active, etc.) is deliberately left
  // exactly as it was -- this route still spreads the rest of the
  // body directly into .update(body), a known pre-existing gap not
  // addressed in this phase. Full whitelist hardening (matching the
  // pattern already applied to workout_sessions in Phases 2M/2N) is
  // deliberately deferred.
  const EXERCISE_NOTES_MAX_LENGTH = 1000
  if ('notes' in body) {
    if (typeof body.notes === 'string') {
      const trimmed = body.notes.trim()
      if (trimmed.length > EXERCISE_NOTES_MAX_LENGTH) {
        return NextResponse.json(
          { error: `Exercise notes must be ${EXERCISE_NOTES_MAX_LENGTH} characters or fewer.` },
          { status: 400 }
        )
      }
      body.notes = trimmed.length > 0 ? trimmed : null
    } else if (body.notes !== null) {
      return NextResponse.json({ error: 'Exercise notes must be text or null.' }, { status: 400 })
    }
  }

  const { data, error } = await supabase
    .from('exercises').update(body)
    .eq('id', params.id).eq('user_id', user.id)
    .select().single()

  if (error) {
    if (error.code === '23505')
      return NextResponse.json({ error: 'You already have an exercise with this name.' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Decision log if deactivating
  if (body.is_active === false && data) {
    // Count sessions in last 30 days that used this exercise
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const { count } = await supabase
      .from('workout_exercises')
      .select('id', { count: 'exact', head: true })
      .eq('exercise_id', params.id)
    const sessionCount = count ?? 0
    if (sessionCount > 0) {
      await supabase.from('decision_logs').insert({
        user_id: user.id,
        decision_type: 'exercise_deactivated',
        decision_title: `${(data as any).name} deactivated`,
        decision_summary: `${(data as any).name} was used in ${sessionCount} session${sessionCount !== 1 ? 's' : ''}.`,
        reason: 'User manually deactivated the exercise from the library.',
        data_snapshot: { exercise_id: params.id, sessions_count: sessionCount },
        new_value: { is_active: false },
        status: 'applied', created_by: 'user',
        applied_at: new Date().toISOString(),
      })
    }
  }

  return NextResponse.json({ data })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check for workout_exercises referencing this exercise
  const { count } = await supabase
    .from('workout_exercises').select('id', { count: 'exact', head: true })
    .eq('exercise_id', params.id)
  if (count && count > 0) {
    return NextResponse.json(
      { error: 'This exercise has workout history. Deactivate it instead of deleting.' },
      { status: 409 }
    )
  }

  const { error } = await supabase
    .from('exercises').delete()
    .eq('id', params.id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
