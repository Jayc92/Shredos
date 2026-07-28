import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { startOfISOWeek } from 'date-fns'
import { setScore, epley1RM } from '@/lib/workout'
import type { ExerciseHistoryEntry, PRBaseline } from '@/lib/workout'
import type { WorkoutSet } from '@/types/database'

/**
 * Creates a Supabase client for use in server components, server actions,
 * and API route handlers.
 *
 * Must be called inside an async function (cookies() requires request context).
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options: Record<string, unknown> }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server component: cannot set cookies.
            // The middleware will refresh the session.
          }
        },
      },
    }
  )
}

// ── Convenience query helpers ─────────────────────────────────────

/** Fetch the current user's profile, or null if not found */
export async function fetchUserProfile(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('fetchUserProfile error:', error)
  }

  return data ?? null
}

/** Fetch the most recent N weigh-ins for a user, newest first */
export async function fetchRecentWeighIns(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  limit = 20
) {
  const { data, error } = await supabase
    .from('body_metrics')
    .select('*')
    .eq('user_id', userId)
    .not('weight_kg', 'is', null)
    .order('logged_date', { ascending: false })
    .limit(limit)

  if (error) console.error('fetchRecentWeighIns error:', error)
  return data ?? []
}

/** Fetch the currently active nutrition targets (most recent effective_date <= today) */
export async function fetchCurrentNutritionTarget(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('nutrition_targets')
    .select('*')
    .eq('user_id', userId)
    .lte('effective_date', today)
    .order('effective_date', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('fetchCurrentNutritionTarget error:', error)
  }

  return data ?? null
}

/** Fetch the currently active fast (ended_at IS NULL), or null */
export async function fetchActiveFast(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { data, error } = await supabase
    .from('fasting_logs')
    .select('*')
    .eq('user_id', userId)
    .is('ended_at', null)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('fetchActiveFast error:', error)
  }

  return data ?? null
}

/** Fetch recent decision logs, newest first */
export async function fetchRecentDecisions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  limit = 5
) {
  const { data, error } = await supabase
    .from('decision_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) console.error('fetchRecentDecisions error:', error)
  return data ?? []
}

/** Fetch fasting logs from the current week */
export async function fetchFastingLogsThisWeek(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  // Phase 1P: previously computed via manual Date arithmetic
  // (weekStart.getDate() - weekStart.getDay() + 1), which silently
  // returned tomorrow instead of last Monday whenever today was Sunday
  // (getDay() === 0 broke the "+ 1" offset). Now uses the same
  // startOfISOWeek helper weekly-review.ts already uses correctly for
  // the same "this week" concept, so /fasting and /check-in agree on
  // Sundays too. Same single query, same gte-only boundary, same
  // return shape — only the boundary calculation changed.
  const weekStart = startOfISOWeek(new Date())

  const { data, error } = await supabase
    .from('fasting_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('started_at', weekStart.toISOString())
    .order('started_at', { ascending: false })

  if (error) console.error('fetchFastingLogsThisWeek error:', error)
  return data ?? []
}

/** Fetch all food_logs for a specific date */
export async function fetchFoodLogsForDate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  date: string
) {
  const { data, error } = await supabase
    .from('food_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('logged_date', date)
    .order('created_at', { ascending: true })

  if (error) console.error('fetchFoodLogsForDate error:', error)
  return data ?? []
}

/**
 * Fetch recent food_logs for "repeat a recent food" UI (Phase 1N).
 * Bounded by logged_date >= sinceDate and capped at `limit` raw rows,
 * newest-created first. Deduplication down to distinct foods happens
 * in the caller (page.tsx) — this helper returns raw rows only, same
 * as every other fetch* helper in this file.
 */
export async function fetchRecentFoodLogs(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  sinceDate: string,
  limit = 60
) {
  const { data, error } = await supabase
    .from('food_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('logged_date', sinceDate)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) console.error('fetchRecentFoodLogs error:', error)
  return data ?? []
}

/** Fetch all saved meals, autopilot first then by use_count desc */
export async function fetchSavedMeals(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { data, error } = await supabase
    .from('saved_meals')
    .select('*')
    .eq('user_id', userId)
    .order('is_autopilot', { ascending: false })
    .order('use_count', { ascending: false })
    .order('name', { ascending: true })

  if (error) console.error('fetchSavedMeals error:', error)
  return data ?? []
}

// ── Phase 1C — Workout fetch helpers ─────────────────────────────

/** Fetch recent workout sessions for a user, newest first */
export async function fetchRecentSessions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  limit = 20
) {
  const { data, error } = await supabase
    .from('workout_sessions')
    .select(`
      *,
      workout_exercises (
        id, exercise_id, order_index,
        exercise:exercises ( id, name, primary_muscle, unilateral ),
        workout_sets ( id, set_number, reps, weight_kg, completed, is_warmup )
      )
    `)
    .eq('user_id', userId)
    .order('workout_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) console.error('fetchRecentSessions error:', error)
  return data ?? []
}

/** Fetch a single session with all exercises and sets */
export async function fetchSessionWithDetails(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  sessionId: string
) {
  const { data, error } = await supabase
    .from('workout_sessions')
    .select(`
      *,
      routine:workout_routines (id, name),
      workout_exercises (
        *,
        exercise:exercises ( * ),
        workout_sets ( * )
      )
    `)
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single()

  if (error) console.error('fetchSessionWithDetails error:', error)
  if (!data) return null

  // Restore deterministic ordering lost during Phase 1C dedup cleanup
  if (Array.isArray(data.workout_exercises)) {
    data.workout_exercises.sort((a: any, b: any) => a.order_index - b.order_index)
    data.workout_exercises.forEach((we: any) => {
      if (Array.isArray(we.workout_sets)) {
        we.workout_sets.sort((a: any, b: any) => a.set_number - b.set_number)
      }
    })
  }

  return data
}

/** Fetch workout stats for dashboard: last session + this-week count */
export async function fetchWorkoutWeekStats(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const now = new Date()
  const day = now.getDay()
  const diffToMon = day === 0 ? -6 : 1 - day
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() + diffToMon)
  weekStart.setHours(0, 0, 0, 0)
  const weekStartISO = weekStart.toISOString().split('T')[0]

  const { data: thisWeekSessions } = await supabase
    .from('workout_sessions')
    .select('id')
    .eq('user_id', userId)
    .gte('workout_date', weekStartISO)
    .in('status', ['in_progress', 'completed'])

  const { data: lastSessionData } = await supabase
    .from('workout_sessions')
    .select('*, workout_exercises(id)')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('workout_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Count active routines for WorkoutCard display (Phase 1D)
  const { count: routineCount } = await supabase
    .from('workout_routines')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_active', true)

  return {
    sessions_this_week: thisWeekSessions?.length ?? 0,
    last_session: lastSessionData ?? null,
    last_session_exercise_count: (lastSessionData as any)?.workout_exercises?.length ?? 0,
    active_routine_count: routineCount ?? 0,
  }
}

/** Fetch previous bests for exercises in a session (for overload badge) */
export async function fetchPreviousBests(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  exerciseIds: string[],
  currentSessionId: string
) {
  if (exerciseIds.length === 0) return {}

  // Fetch last 15 completed sessions with exercises and sets
  const { data: history } = await supabase
    .from('workout_sessions')
    .select(`
      id, workout_date,
      workout_exercises (
        exercise_id,
        workout_sets ( reps, weight_kg, rpe, is_warmup, completed )
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'completed')
    .neq('id', currentSessionId)
    .order('workout_date', { ascending: false })
    .limit(15)

  const bests: Record<string, any> = {}

  for (const session of history ?? []) {
    for (const we of (session.workout_exercises as Array<{
      exercise_id: string
      workout_sets: Array<{ reps: number|null; weight_kg: number|null; rpe: number|null; is_warmup: boolean; completed: boolean }>
    }>) ?? []) {
      if (!exerciseIds.includes(we.exercise_id)) continue
      if (bests[we.exercise_id]) continue // already found a more recent session

      // Include weighted AND bodyweight sets (null weight_kg counts via reps)
      const working = (we.workout_sets ?? []).filter(
        (s: any) => s.completed && !s.is_warmup && (
          (s.weight_kg !== null && s.weight_kg > 0) || (s.reps !== null && s.reps > 0)
        )
      )
      if (working.length === 0) continue

      // Pick best set — reuses the same scoring workout.ts's bestSet and
      // fetchExerciseHistory use, so "best set" means the same thing
      // everywhere in the app (Phase 2B: previously duplicated this
      // scoring inline).
      const best = working.reduce(
        (b: any, s: any) => (setScore(s as WorkoutSet) > setScore(b as WorkoutSet) ? s : b),
        working[0]
      )

      bests[we.exercise_id] = {
        // Full WorkoutSet-compatible shape
        id: '',
        workout_exercise_id: we.exercise_id,
        set_number: 0,
        weight_kg: best.weight_kg,
        reps: best.reps,
        // Phase 2B fix: previously hardcoded to null regardless of the
        // actual logged RPE, which meant Phase 2A's suggestNextTarget
        // RPE-based branches ("RPE was high", the increase condition
        // requiring RPE <= 8) could never fire in production. rpe is
        // now selected above and returned here for real.
        rpe: best.rpe ?? null,
        completed: true,
        is_warmup: false,
        notes: null,
        created_at: session.workout_date,
      }
    }
  }

  return bests
}

/**
 * Fetch recent exercise history for the workout detail page (Phase 2B).
 * For each given exercise, returns up to 3 most-recent completed
 * sessions' best working set, most-recent-first. Warm-up and incomplete
 * sets are excluded, same rule as fetchPreviousBests above. Reuses the
 * same setScore/epley1RM math workout.ts's bestSet and
 * fetchPreviousBests use, so "best set" means the same thing
 * everywhere in the app.
 *
 * If the same exercise appears more than once within a single session
 * (a rare "added twice to one workout" case), all of that session's
 * qualifying sets for that exercise are merged before picking one best
 * set, so a single session never produces more than one history row.
 */
export async function fetchExerciseHistory(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  exerciseIds: string[],
  currentSessionId: string
): Promise<Record<string, ExerciseHistoryEntry[]>> {
  if (exerciseIds.length === 0) return {}

  const HISTORY_ROWS_PER_EXERCISE = 3

  const { data: history } = await supabase
    .from('workout_sessions')
    .select(`
      id, workout_date,
      workout_exercises (
        exercise_id,
        workout_sets ( reps, weight_kg, rpe, is_warmup, completed )
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'completed')
    .neq('id', currentSessionId)
    .order('workout_date', { ascending: false })
    .limit(15)

  const result: Record<string, ExerciseHistoryEntry[]> = {}
  for (const id of exerciseIds) result[id] = []

  for (const session of history ?? []) {
    // Merge all workout_exercises entries for the same exercise within
    // this one session first, so a repeated exercise still produces
    // exactly one history row for that session, not two.
    const bestInSession: Record<string, any> = {}

    for (const we of (session.workout_exercises as Array<{
      exercise_id: string
      workout_sets: Array<{ reps: number|null; weight_kg: number|null; rpe: number|null; is_warmup: boolean; completed: boolean }>
    }>) ?? []) {
      if (!exerciseIds.includes(we.exercise_id)) continue

      const working = (we.workout_sets ?? []).filter(
        (s: any) => s.completed && !s.is_warmup && (
          (s.weight_kg !== null && s.weight_kg > 0) || (s.reps !== null && s.reps > 0)
        )
      )
      if (working.length === 0) continue

      const localBest = working.reduce(
        (b: any, s: any) => (setScore(s as WorkoutSet) > setScore(b as WorkoutSet) ? s : b),
        working[0]
      )

      const existing = bestInSession[we.exercise_id]
      if (!existing || setScore(localBest as WorkoutSet) > setScore(existing as WorkoutSet)) {
        bestInSession[we.exercise_id] = localBest
      }
    }

    for (const [exerciseId, best] of Object.entries(bestInSession)) {
      if (result[exerciseId].length >= HISTORY_ROWS_PER_EXERCISE) continue

      const b = best as any
      const estimated1RmKg =
        b.weight_kg && b.reps ? epley1RM(b.weight_kg, b.reps) : null

      result[exerciseId].push({
        workoutDate: session.workout_date,
        weightKg: b.weight_kg,
        reps: b.reps,
        rpe: b.rpe ?? null,
        estimated1RmKg,
      })
    }
  }

  return result
}

/**
 * Fetch the true all-time PR baseline for each exercise (Phase 2C).
 * Deliberately does NOT reuse fetchPreviousBests/fetchExerciseHistory
 * above — both are bounded to the last 15 sessions for "recent
 * history" purposes, which is the right choice for those, but wrong
 * for a PR claim, which must be genuinely all-time-correct or it's
 * misleading. This scans ALL of the user's completed sessions, no
 * date or session-count limit. Excludes the current in-progress
 * session, warmups, and incomplete/empty sets — same exclusion rules
 * used everywhere else in this file. Computed entirely in application
 * code (no RPC, no migration), consistent with every other helper
 * here.
 */
export async function fetchExercisePRBaseline(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  exerciseIds: string[],
  currentSessionId: string
): Promise<Record<string, PRBaseline>> {
  if (exerciseIds.length === 0) return {}

  const { data: sessions } = await supabase
    .from('workout_sessions')
    .select(`
      id,
      workout_exercises (
        exercise_id,
        workout_sets ( reps, weight_kg, is_warmup, completed )
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'completed')
    .neq('id', currentSessionId)

  const result: Record<string, PRBaseline> = {}
  for (const id of exerciseIds) {
    result[id] = { maxWeightKg: null, maxEstimated1RmKg: null, maxBodyweightReps: null }
  }

  for (const session of sessions ?? []) {
    for (const we of (session.workout_exercises as Array<{
      exercise_id: string
      workout_sets: Array<{ reps: number|null; weight_kg: number|null; is_warmup: boolean; completed: boolean }>
    }>) ?? []) {
      if (!exerciseIds.includes(we.exercise_id)) continue

      const working = (we.workout_sets ?? []).filter(
        (s: any) => s.completed && !s.is_warmup && (
          (s.weight_kg !== null && s.weight_kg > 0) || (s.reps !== null && s.reps > 0)
        )
      )
      if (working.length === 0) continue

      const baseline = result[we.exercise_id]

      for (const s of working as any[]) {
        if (s.weight_kg && s.weight_kg > 0) {
          if (baseline.maxWeightKg === null || s.weight_kg > baseline.maxWeightKg) {
            baseline.maxWeightKg = s.weight_kg
          }
          const rm = s.reps ? epley1RM(s.weight_kg, s.reps) : null
          if (rm !== null && (baseline.maxEstimated1RmKg === null || rm > baseline.maxEstimated1RmKg)) {
            baseline.maxEstimated1RmKg = rm
          }
        } else if (s.reps && s.reps > 0) {
          if (baseline.maxBodyweightReps === null || s.reps > baseline.maxBodyweightReps) {
            baseline.maxBodyweightReps = s.reps
          }
        }
      }
    }
  }

  return result
}

// ── Phase 1D — routine fetch helpers ─────────────────────────────

export async function fetchRoutines(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { data } = await supabase
    .from('workout_routines')
    .select('*, workout_routine_exercises(id)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function fetchRoutineWithExercises(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  routineId: string
) {
  const { data, error } = await supabase
    .from('workout_routines')
    .select(`
      *,
      workout_routine_exercises (
        *,
        exercise:exercises (*)
      )
    `)
    .eq('id', routineId)
    .eq('user_id', userId)
    .single()

  if (error || !data) return null

  // Deterministic ordering
  if (Array.isArray((data as any).workout_routine_exercises)) {
    (data as any).workout_routine_exercises.sort((a: any, b: any) => a.order_index - b.order_index)
  }

  return data as any
}

export async function fetchRoutineCount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<number> {
  const { count } = await supabase
    .from('workout_routines')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_active', true)
  return count ?? 0
}

// ============================================================
// Phase 1H — daily activity/steps logging
// ============================================================
// NOTE: DailyActivityLog is imported here rather than merged into
// this file's top-level type import because this block was added via
// an additive patch. If server.ts already imports other types from
// '@/types/database' near the top of the file, consider consolidating
// this import into that statement the next time this file is edited.
import type { DailyActivityLog } from '@/types/database'

export async function fetchActivityLogForDate(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  date: string
): Promise<DailyActivityLog | null> {
  const { data } = await supabase
    .from('daily_activity_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('logged_date', date)
    .maybeSingle()
  return data ?? null
}

export async function fetchActivityLogsForRange(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  startDate: string,
  endDate: string
): Promise<DailyActivityLog[]> {
  const { data } = await supabase
    .from('daily_activity_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('logged_date', startDate)
    .lte('logged_date', endDate)
    .order('logged_date', { ascending: false })
  return data ?? []
}

export async function upsertActivityLogForDate(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  date: string,
  steps: number,
  notes?: string | null
): Promise<DailyActivityLog> {
  const { data, error } = await supabase
    .from('daily_activity_logs')
    .upsert(
      {
        user_id: userId,
        logged_date: date,
        steps,
        notes: notes ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,logged_date' }
    )
    .select()
    .single()
  if (error) throw error
  return data
}
