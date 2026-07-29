import { NextResponse } from 'next/server'

// ============================================================
// ShredOS — Workout Mutation Guards (Phase 2I)
// Shared, fail-closed checks preventing mutation of a completed
// workout's exercises/sets. Every guard queries the database itself
// (not caller-supplied data) so a stale or forged client value can't
// bypass the lock.
//
// Fail-closed: if the status lookup itself errors, the protected
// mutation must NOT proceed — return 500, not null. Only return null
// when the lookup succeeded and the workout is not completed, or when
// the referenced row genuinely doesn't exist (in which case the
// route's own existing ownership/not-found handling takes over, same
// as it already does today).
// ============================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WorkoutGuardResult = NextResponse | null

const LOCKED_MESSAGE = 'Completed workouts are read-only. Reopen the workout before editing.'

function lockedResponse(): NextResponse {
  return NextResponse.json({ error: LOCKED_MESSAGE }, { status: 409 })
}

/**
 * Blocks a mutation if the given session (scoped to userId, matching
 * every other route's existing ownership-filter convention) is
 * completed. Query error -> 500 (fail closed). Row not found (wrong
 * owner or doesn't exist) -> null, letting the calling route's own
 * existing not-found/ownership handling resolve it, exactly as before
 * this phase.
 */
export async function blockIfSessionCompleted(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  sessionId: string,
  userId: string
): Promise<WorkoutGuardResult> {
  const { data, error } = await supabase
    .from('workout_sessions')
    .select('status')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (data?.status === 'completed') {
    return lockedResponse()
  }
  return null
}

/**
 * Blocks a mutation targeting a workout_exercises row if its parent
 * session is completed. workout_exercises has no user_id column of
 * its own — ownership can only be verified at the session level,
 * which is exactly where blockIfSessionCompleted applies it (same
 * pattern the existing RLS policies already use for this table).
 */
export async function blockIfWorkoutExerciseCompleted(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  workoutExerciseId: string,
  userId: string
): Promise<WorkoutGuardResult> {
  const { data: workoutExercise, error } = await supabase
    .from('workout_exercises')
    .select('workout_session_id')
    .eq('id', workoutExerciseId)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!workoutExercise) return null

  return blockIfSessionCompleted(supabase, workoutExercise.workout_session_id, userId)
}

/**
 * Blocks a mutation targeting a workout_sets row if its parent
 * exercise's parent session is completed. Composed through
 * blockIfWorkoutExerciseCompleted rather than a multi-level join, so
 * every hop uses the exact same simple .eq().maybeSingle() query
 * style already proven throughout this codebase's routes.
 */
export async function blockIfWorkoutSetCompleted(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  workoutSetId: string,
  userId: string
): Promise<WorkoutGuardResult> {
  const { data: set, error } = await supabase
    .from('workout_sets')
    .select('workout_exercise_id')
    .eq('id', workoutSetId)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!set) return null

  return blockIfWorkoutExerciseCompleted(supabase, set.workout_exercise_id, userId)
}
