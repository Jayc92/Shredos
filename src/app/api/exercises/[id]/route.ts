import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { normalizeExercisePatchPayload } from '@/lib/exercise-validation'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const result = normalizeExercisePatchPayload(body)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })

  // Phase 2P: fetch the existing row first. This serves two purposes
  // in one query: (1) a deterministic 404 for a missing or another
  // user's exercise, instead of letting a zero-row update surface as
  // an unstructured error; (2) detecting a genuine true -> false
  // is_active transition below, rather than logging a deactivation
  // decision every time a request body merely CONTAINS is_active:false
  // (the prior behavior, which could create duplicate logs on repeated
  // PATCH calls).
  const { data: existing, error: fetchError } = await supabase
    .from('exercises')
    .select('is_active')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })
  if (!existing) return NextResponse.json({ error: 'Exercise not found.' }, { status: 404 })

  const { data, error } = await supabase
    .from('exercises').update(result.value)
    .eq('id', params.id).eq('user_id', user.id)
    .select().single()

  if (error) {
    if (error.code === '23505')
      return NextResponse.json({ error: 'You already have an exercise with this name.' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Decision log only on an actual true -> false transition (Phase 2P
  // correction) -- not merely because this request's payload happens
  // to include is_active: false, which would have logged again on
  // every repeated deactivation attempt against an already-inactive
  // exercise.
  if (existing.is_active === true && result.value.is_active === false && data) {
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
