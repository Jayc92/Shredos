import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { findActiveTrainingSession, resolveActiveWorkoutConflict } from '@/lib/supabase/server'
import { buildSessionTitle } from '@/lib/routine'

// Phase 2L: name of the partial unique index (migration 008) enforcing
// one true active training session per user at the database level.
const ACTIVE_WORKOUT_UNIQUE_INDEX = 'workout_sessions_one_active_training_per_user_idx'

/**
 * True only for the exact new-index violation -- SQLSTATE 23505 AND
 * the error message names this specific index. Checking both (not
 * just the code) means an unrelated future unique violation on this
 * table is never misclassified as an active-workout conflict.
 */
function isActiveWorkoutUniqueViolation(error: any): boolean {
  return error?.code === '23505'
    && typeof error?.message === 'string'
    && error.message.includes(ACTIVE_WORKOUT_UNIQUE_INDEX)
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Phase 2K: same active-session conflict check as manual creation.
  // See findActiveTrainingSession's own doc comment for why a
  // reopened correction session doesn't trigger this.
  let activeSession: { id: string } | null
  try {
    activeSession = await findActiveTrainingSession(supabase, user.id)
  } catch {
    return NextResponse.json({ error: 'Could not verify active workout status.' }, { status: 500 })
  }
  if (activeSession) {
    return NextResponse.json(
      { error: 'A workout is already in progress.', active_workout_id: activeSession.id },
      { status: 409 }
    )
  }

  const body = await request.json().catch(() => ({}))
  const workout_date = body.workout_date ?? new Date().toISOString().split('T')[0]

  const { data: routine, error: rErr } = await supabase
    .from('workout_routines')
    .select('*, workout_routine_exercises(*, exercise:exercises(id, name, unilateral))')
    .eq('id', params.id).eq('user_id', user.id).single()

  if (rErr || !routine) return NextResponse.json({ error: 'Routine not found' }, { status: 404 })

  if (!(routine as any).is_active) {
    return NextResponse.json(
      { error: 'This routine is inactive. Reactivate it before starting a workout.' },
      { status: 409 }
    )
  }

  const routineExercises: any[] = ((routine as any).workout_routine_exercises ?? [])
    .slice().sort((a: any, b: any) => a.order_index - b.order_index)

  /** Delete the session so CASCADE removes all child rows. */
  async function cleanup(sid: string) {
    await supabase.from('workout_sessions').delete().eq('id', sid)
  }

  const { data: session, error: sErr } = await supabase
    .from('workout_sessions')
    .insert({
      user_id:    user.id, workout_date,
      title:      buildSessionTitle((routine as any).name, workout_date),
      status:     'in_progress',
      start_time: new Date().toISOString(),
      // Phase 5A.2: live provenance written explicitly (migration
      // 014's default classifies only pre-existing rows as legacy).
      source:     'live',
      routine_id: (routine as any).id,
    })
    .select('id').single()

  if (sErr) {
    // Phase 2L: the app-level pre-check above already covers the
    // common case; this handles the rare race where two requests both
    // passed that check before either insert committed. The unique
    // index (migration 008) is what actually stops the second insert.
    // No cleanup() call needed here -- this violation fires on the
    // session insert itself, before any workout_exercises/workout_sets
    // rows exist for this attempt.
    if (isActiveWorkoutUniqueViolation(sErr)) {
      try {
        const conflictingSession = await resolveActiveWorkoutConflict(supabase, user.id)
        return NextResponse.json(
          { error: 'A workout is already in progress.', active_workout_id: conflictingSession.id },
          { status: 409 }
        )
      } catch {
        return NextResponse.json({ error: 'Could not verify active workout status.' }, { status: 500 })
      }
    }
  }
  if (sErr || !session) return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })

  const sessionId: string = (session as any).id

  if (routineExercises.length > 0) {
    const exerciseRows = routineExercises.map((re: any) => ({
      workout_session_id: sessionId,
      exercise_id:        re.exercise_id,
      order_index:        re.order_index,
      target_sets:        re.target_sets      ?? null,
      target_reps:        re.target_reps_max  ?? re.target_reps_min ?? null,
      target_reps_min:    re.target_reps_min  ?? null,
      target_reps_max:    re.target_reps_max  ?? null,
      target_weight_kg:   re.target_weight_kg ?? null,
    }))

    const { data: createdExercises, error: weErr } = await supabase
      .from('workout_exercises').insert(exerciseRows).select('id, order_index')

    if (weErr || !createdExercises || createdExercises.length === 0) {
      await cleanup(sessionId)
      return NextResponse.json(
        { error: 'Failed to copy exercises — no session was created. Please try again.' },
        { status: 500 }
      )
    }

    const allSets: Array<Record<string, unknown>> = []
    for (const re of routineExercises) {
      if (!re.target_sets || re.target_sets <= 0) continue
      const we = (createdExercises as any[]).find(c => c.order_index === re.order_index)
      if (!we) continue
      for (let i = 0; i < re.target_sets; i++) {
        allSets.push({
          workout_exercise_id: we.id,
          set_number: i + 1,
          weight_kg:  re.target_weight_kg ?? null,
          reps:       null,
          completed:  false,
          is_warmup:  false,
        })
      }
    }

    if (allSets.length > 0) {
      const { error: setsErr } = await supabase.from('workout_sets').insert(allSets)
      if (setsErr) {
        // M1 CORRECTED: set failure is fatal.
        // Delete the session — CASCADE removes copied exercises and any partial sets.
        // Do not return 201. Do not redirect user into an incomplete workout.
        await cleanup(sessionId)
        return NextResponse.json(
          { error: 'Failed to create pre-filled sets — no session was created. Please try again.' },
          { status: 500 }
        )
      }
    }
  }

  return NextResponse.json({ data: { session_id: sessionId } }, { status: 201 })
}
