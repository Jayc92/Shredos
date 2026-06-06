import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1) // Monday
  weekStart.setHours(0, 0, 0, 0)

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
  return data ?? null
}

/** Fetch today's in_progress or last completed session */
export async function fetchTodaySession(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('workout_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('workout_date', today)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  return data ?? null
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

  return {
    sessions_this_week: thisWeekSessions?.length ?? 0,
    last_session: lastSessionData ?? null,
    last_session_exercise_count: (lastSessionData as any)?.workout_exercises?.length ?? 0,
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
        workout_sets ( reps, weight_kg, is_warmup, completed )
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
      workout_sets: Array<{ reps: number|null; weight_kg: number|null; is_warmup: boolean; completed: boolean }>
    }>) ?? []) {
      if (!exerciseIds.includes(we.exercise_id)) continue
      if (bests[we.exercise_id]) continue // already found a more recent session

      const working = (we.workout_sets ?? []).filter(
        (s) => s.completed && !s.is_warmup
      )
      if (working.length === 0) continue

      // Pick best set by Epley 1RM
      const best = working.reduce((b, s) => {
        const score = s.weight_kg
          ? s.weight_kg * (1 + (s.reps ?? 0) / 30)
          : (s.reps ?? 0)
        const bScore = b.weight_kg
          ? b.weight_kg * (1 + (b.reps ?? 0) / 30)
          : (b.reps ?? 0)
        return score > bScore ? s : b
      }, working[0])

      bests[we.exercise_id] = {
        // Full WorkoutSet-compatible shape
        id: '',
        workout_exercise_id: we.exercise_id,
        set_number: 0,
        weight_kg: best.weight_kg,
        reps: best.reps,
        rpe: null,
        completed: true,
        is_warmup: false,
        notes: null,
        created_at: session.workout_date,
      }
    }
  }

  return bests
}
