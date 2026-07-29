import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Reverses a workout's completion (Phase 2I). Deliberately a separate,
 * narrow-scope route rather than reusing the generic session PATCH —
 * that route accepts an arbitrary update body with no transition
 * validation, which is exactly why it must itself reject any status
 * change on a completed workout (see the PATCH handler in
 * ../route.ts). This route hardcodes the one legal transition:
 * completed -> in_progress, end_time -> null. Everything else
 * (start_time, workout_date, routine_id, exercises, sets) is left
 * completely untouched by this update.
 */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: session, error: fetchError } = await supabase
    .from('workout_sessions')
    .select('status, completed_duration_seconds')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })
  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (session.status !== 'completed') {
    return NextResponse.json({ error: 'Only completed workouts can be reopened.' }, { status: 409 })
  }

  // Phase 2M: a completed row with no persisted duration (e.g. a
  // legacy row from before Phase 2J's backfill, missing start_time or
  // end_time at the time it was completed) cannot safely become a
  // true-active session -- it would be indistinguishable from a
  // genuine active workout and would illegitimately occupy the Phase
  // 2L one-active-workout slot. Fail closed rather than reopening an
  // ambiguous historical record; do not invent or backfill a duration
  // here.
  if (session.completed_duration_seconds === null) {
    return NextResponse.json(
      { error: 'This workout has no recorded duration and cannot safely enter correction mode.' },
      { status: 409 }
    )
  }

  const { data, error } = await supabase
    .from('workout_sessions')
    .update({ status: 'in_progress', end_time: null })
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
