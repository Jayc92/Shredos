import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { localTodayFromCookies } from '@/lib/local-date-server'
import { findActiveTrainingSession, resolveActiveWorkoutConflict } from '@/lib/supabase/server'
import { autoTitle, validateManualWorkoutMetadata } from '@/lib/workout'

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

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const limit = parseInt(request.nextUrl.searchParams.get('limit') ?? '20')
  const { data } = await supabase
    .from('workout_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('workout_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)
  return NextResponse.json({ data })
}

// Phase 5A.2: server-side limits for historical creation metadata --
// same values the [id] route enforces for its own metadata fields.
const WORKOUT_TITLE_MAX_LENGTH = 100
const WORKOUT_NOTES_MAX_LENGTH = 2000

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const earlyBody = await request.json().catch(() => ({}))

  // Phase 5A.2: explicit historical mode — a workout that already
  // happened, entered after the fact. Created directly in the
  // existing correction state (status 'in_progress' WITH the frozen
  // actual duration), so the active-session unique index and the
  // guard below both ignore it: it is editable for exercise/set
  // entry, coexists with a live active workout, and its true
  // duration can never be replaced by data-entry elapsed time. The
  // server derives every trusted field — the client can never set
  // status, source, or completed_duration_seconds directly.
  if (earlyBody.mode === 'historical') {
    const title = typeof earlyBody.title === 'string' ? earlyBody.title.trim() : ''
    if (!title) {
      return NextResponse.json({ error: 'Workout title is required.' }, { status: 400 })
    }
    if (title.length > WORKOUT_TITLE_MAX_LENGTH) {
      return NextResponse.json(
        { error: `Workout title must be ${WORKOUT_TITLE_MAX_LENGTH} characters or fewer.` },
        { status: 400 }
      )
    }
    let notes: string | null = null
    if (typeof earlyBody.notes === 'string') {
      const trimmed = earlyBody.notes.trim()
      if (trimmed.length > WORKOUT_NOTES_MAX_LENGTH) {
        return NextResponse.json(
          { error: `Workout notes must be ${WORKOUT_NOTES_MAX_LENGTH} characters or fewer.` },
          { status: 400 }
        )
      }
      notes = trimmed.length > 0 ? trimmed : null
    }
    const validation = validateManualWorkoutMetadata({
      workoutDate: earlyBody.workoutDate,
      startTime: earlyBody.startTime,
      durationMinutes: earlyBody.durationMinutes,
      caloriesBurned: earlyBody.caloriesBurned,
    })
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    const { workoutDate, startedAt, endedAt, durationSeconds, caloriesBurned } = validation

    const { data, error } = await supabase
      .from('workout_sessions')
      .insert({
        user_id: user.id,
        workout_date: workoutDate,
        title,
        status: 'in_progress',
        start_time: startedAt.toISOString(),
        end_time: endedAt.toISOString(),
        completed_duration_seconds: durationSeconds,
        source: 'manual',
        calories_burned: caloriesBurned,
        notes,
      })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data }, { status: 201 })
  }

  // Phase 2K: block creating a second true active training session.
  // A reopened correction (status='in_progress' but
  // completed_duration_seconds is set) is deliberately excluded by
  // findActiveTrainingSession, so correcting an old workout never
  // blocks starting today's.
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

  const body = earlyBody
  // Prefer client-supplied local date (sent as YYYY-MM-DD in the browser's timezone).
  // Fall back to UTC date only as a safety net — the client should always send this.
  // Local-date fix: the default workout date is the USER'S calendar
  // day (timezone cookie), never the server's UTC day.
  const workout_date = body.workout_date ?? localTodayFromCookies()
  const title = body.title?.trim() || autoTitle(workout_date)
  const { data, error } = await supabase
    .from('workout_sessions')
    .insert({
      user_id: user.id,
      workout_date,
      title,
      status: 'in_progress',
      start_time: new Date().toISOString(),
      // Phase 5A.2: live provenance written explicitly, never left to
      // the migration default (which classifies pre-014 rows 'legacy').
      source: 'live',
      notes: body.notes ?? null,
    })
    .select()
    .single()
  if (error) {
    // Phase 2L: the app-level pre-check above already covers the
    // common case; this handles the rare race where two requests both
    // passed that check before either insert committed. The unique
    // index (migration 008) is what actually stops the second insert.
    if (isActiveWorkoutUniqueViolation(error)) {
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
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ data }, { status: 201 })
}
