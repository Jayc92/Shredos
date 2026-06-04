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
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
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
