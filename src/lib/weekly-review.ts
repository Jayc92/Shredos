// ============================================================
// ShredOS — Weekly Review (Phase 1G)
// Current ISO-week check-in derived server-side from existing
// tables. No schema changes. No writes. Read-only.
//
// Adds 3–4 bounded queries on the /check-in page only.
// Zero impact on dashboard load.
// ============================================================

import {
  startOfISOWeek,
  endOfISOWeek,
  differenceInDays,
  parseISO,
  format,
} from 'date-fns'
import type { NutritionTarget } from '@/types/database'

// ── Thresholds ───────────────────────────────────────────────────
// NOTE: these intentionally mirror the constants in nutrition-coach.ts
// (PROTEIN_MEETING_THRESHOLD, PROTEIN_CLOSE_THRESHOLD, CALORIE_ON_TRACK_RANGE,
// CALORIE_SUGGESTION_GOALS). Kept as separate local copies rather than a shared
// import to avoid a cross-module refactor in this pass. If Phase 1F's
// thresholds change, update both files together.
const PROTEIN_MEETING_THRESHOLD = 0.90
const PROTEIN_CLOSE_THRESHOLD   = 0.80
const CALORIE_ON_TRACK_RANGE    = 0.10
const CUTTING_GOALS = ['fat_loss', 'recomposition'] as const

// ── Types ─────────────────────────────────────────────────────────

export type CalorieTrend = 'on-track' | 'above' | 'below' | 'insufficient-data'
export type ProteinStatus = 'meeting' | 'close' | 'low' | 'insufficient-data'

export interface WeeklyReviewSummary {
  weekStart:     string
  weekEnd:       string
  daysElapsed:   number
  daysRemaining: number

  weighInsThisWeek:     number
  latestWeightKg:       number | null
  priorWeightKg:        number | null
  weeklyChangeLbs:      number | null
  weightDataSufficient: boolean

  foodLoggedDays:    number
  avgCaloriesLogged: number | null
  avgProteinLogged:  number | null
  calorieTarget:     number | null
  proteinTarget:     number | null
  calorieTrend:      CalorieTrend
  proteinStatus:     ProteinStatus

  sessionsCompleted:  number
  totalSetsCompleted: number
  sessionDates:       string[]
  hasActiveSession:   boolean

  fastingEnabled:          boolean
  fastsCompletedThisWeek:  number
  avgFastHours:            number | null

  // Phase 1H: activity/steps (informational only, does not affect coaching)
  stepGoal:        number | null
  stepLoggedDays:  number
  avgStepsLogged:  number | null
  stepGoalDaysHit: number | null

  primaryFocus:  string | null
  weekBriefText: string | null

  userGoal:   string | null
  hasAnyData: boolean
}

// ── Pure helpers ─────────────────────────────────────────────────────

function categorizeCalorieTrend(
  avgCal: number | null,
  targetCal: number
): CalorieTrend {
  if (avgCal === null || targetCal <= 0) return 'insufficient-data'
  const ratio = avgCal / targetCal
  if (Math.abs(1 - ratio) <= CALORIE_ON_TRACK_RANGE) return 'on-track'
  if (ratio < 1 - CALORIE_ON_TRACK_RANGE)             return 'below'
  return 'above'
}

function categorizeProteinStatus(
  avgProtein: number | null,
  targetProtein: number
): ProteinStatus {
  if (avgProtein === null || targetProtein <= 0) return 'insufficient-data'
  const ratio = avgProtein / targetProtein
  if (ratio >= PROTEIN_MEETING_THRESHOLD) return 'meeting'
  if (ratio >= PROTEIN_CLOSE_THRESHOLD)   return 'close'
  return 'low'
}

function buildPrimaryFocus(
  daysElapsed: number,
  userGoal: string | null,
  weighInsThisWeek: number,
  foodLoggedDays: number,
  proteinStatus: ProteinStatus,
  sessionsCompleted: number,
  calorieTrend: CalorieTrend,
  stepGoal: number | null,
  stepLoggedDays: number
): string | null {
  if (daysElapsed < 3) return null

  const isCutting = CUTTING_GOALS.includes(
    userGoal as typeof CUTTING_GOALS[number]
  )

  if (isCutting && weighInsThisWeek === 0 && daysElapsed >= 4) {
    return 'Log a weigh-in before the week ends to track progress.'
  }
  if (foodLoggedDays === 0 && daysElapsed >= 3) {
    return 'Start logging food to build your weekly picture.'
  }
  if (foodLoggedDays < 4 && daysElapsed >= 5) {
    return 'Log food at least 4 days this week for reliable coaching insights.'
  }
  if (proteinStatus === 'low' && foodLoggedDays >= 3) {
    return 'Protein has been low this week — aim for a high-protein meal on more days.'
  }
  if (sessionsCompleted === 0 && daysElapsed >= 4) {
    return 'Get at least one workout in to maintain training momentum.'
  }
  if (isCutting && calorieTrend === 'above' && foodLoggedDays >= 4) {
    return 'Calories have been above target this week — aim to stay closer.'
  }
  // Phase 1H: steps are the lowest-priority nudge — only surfaces after
  // every higher-priority weigh-in/food/protein/workout/calorie check passes
  if (stepGoal && stepLoggedDays < 4 && daysElapsed >= 5) {
    return 'Log steps at least 4 days this week for a fuller picture.'
  }
  if (
    sessionsCompleted >= 3 &&
    foodLoggedDays >= 5 &&
    (proteinStatus === 'meeting' || proteinStatus === 'close')
  ) {
    return 'Solid week — keep this consistency going.'
  }
  return null
}

function buildWeekBriefText(
  sessionsCompleted: number,
  foodLoggedDays: number,
  avgCaloriesLogged: number | null,
  weeklyChangeLbs: number | null
): string | null {
  const parts: string[] = []
  if (sessionsCompleted > 0) {
    parts.push(`${sessionsCompleted} workout${sessionsCompleted !== 1 ? 's' : ''}`)
  }
  if (foodLoggedDays > 0) {
    const calStr = avgCaloriesLogged !== null
      ? ` · ${avgCaloriesLogged.toLocaleString()} cal avg`
      : ''
    parts.push(`${foodLoggedDays}/7 days logged${calStr}`)
  }
  if (weeklyChangeLbs !== null) {
    const abs = Math.abs(weeklyChangeLbs)
    if (weeklyChangeLbs < 0)      parts.push(`weight down ${abs} lb`)
    else if (weeklyChangeLbs > 0) parts.push(`weight up ${abs} lb`)
    else                          parts.push('weight steady')
  }
  return parts.length > 0 ? parts.join(' · ') : null
}

// ── Main export ──────────────────────────────────────────────────────

/**
 * Derives the current ISO-week review from existing tables.
 * target is passed in from the caller to avoid a redundant fetch.
 * Adds 3–4 bounded queries to the /check-in page only.
 */
export async function fetchWeeklyReview(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  todayStr: string,
  target: NutritionTarget | null,
  userGoal: string | null,
  fastingEnabled: boolean,
  stepGoal: number | null
): Promise<WeeklyReviewSummary> {
  const today     = parseISO(todayStr)
  const weekStart = format(startOfISOWeek(today), 'yyyy-MM-dd')
  const weekEnd   = format(endOfISOWeek(today), 'yyyy-MM-dd')
  // Cap at today — avoid querying future days
  const queryEnd    = todayStr < weekEnd ? todayStr : weekEnd
  const daysElapsed   = differenceInDays(today, parseISO(weekStart)) + 1
  const daysRemaining = 7 - daysElapsed

  // 28 days gives this week + 3 prior weeks for weight comparison
  const twentyEightDaysAgo = format(
    new Date(today.getTime() - 28 * 86_400_000),
    'yyyy-MM-dd'
  )

  // ── Run queries in parallel ─────────────────────────────────────────────
  const [metricsRes, foodRes, sessionRes, fastingRes, activityRes] = await Promise.all([
    supabase
      .from('body_metrics')
      .select('logged_date, weight_kg')
      .eq('user_id', userId)
      .gte('logged_date', twentyEightDaysAgo)
      .not('weight_kg', 'is', null)
      .order('logged_date', { ascending: false }),

    supabase
      .from('food_logs')
      .select('logged_date, calories, protein_g')
      .eq('user_id', userId)
      .gte('logged_date', weekStart)
      .lte('logged_date', queryEnd),

    supabase
      .from('workout_sessions')
      .select(`
        id,
        status,
        workout_date,
        workout_exercises (
          workout_sets ( status, is_warmup )
        )
      `)
      .eq('user_id', userId)
      .gte('workout_date', weekStart)
      .lte('workout_date', queryEnd)
      .in('status', ['completed', 'in_progress'])
      .order('workout_date', { ascending: true }),

    // Filtered by ended_at (not started_at) so a fast that starts the prior
    // week and completes this week is counted in the week it finished.
    // ended_at IS NOT NULL already guarantees only completed fasts qualify;
    // an active/incomplete fast has no ended_at and is correctly excluded.
    fastingEnabled
      ? supabase
          .from('fasting_logs')
          .select('started_at, ended_at, duration_minutes')
          .eq('user_id', userId)
          .not('ended_at', 'is', null)
          .gte('ended_at', `${weekStart}T00:00:00`)
          .lte('ended_at', `${queryEnd}T23:59:59.999`)
      : Promise.resolve({ data: [] }),

    // Phase 1H: informational only — does not affect coaching in any way
    supabase
      .from('daily_activity_logs')
      .select('logged_date, steps')
      .eq('user_id', userId)
      .gte('logged_date', weekStart)
      .lte('logged_date', queryEnd),
  ])

  const allMetrics  = metricsRes.data ?? []
  const foodLogs    = foodRes.data ?? []
  const sessions    = sessionRes.data ?? []
  const fasts       = fastingRes.data ?? []
  const activityLogs: Array<{ logged_date: string; steps: number }> = activityRes.data ?? []

  // ── Weight ───────────────────────────────────────────────────────────────
  const thisWeekMetrics = allMetrics.filter(
    (m: any) => m.logged_date >= weekStart && m.logged_date <= queryEnd
  )
  const priorMetrics = allMetrics.filter((m: any) => m.logged_date < weekStart)

  const weighInsThisWeek = thisWeekMetrics.length
  const latestWeightKg   = thisWeekMetrics[0]?.weight_kg ?? null
  const priorWeightKg    = priorMetrics[0]?.weight_kg ?? null

  let weeklyChangeLbs: number | null = null
  if (latestWeightKg !== null && priorWeightKg !== null) {
    weeklyChangeLbs =
      Math.round((latestWeightKg - priorWeightKg) * 2.20462 * 10) / 10
  }

  // ── Nutrition ────────────────────────────────────────────────────────────
  const dayTotals: Record<string, { calories: number; protein: number }> = {}
  for (const log of foodLogs) {
    if (!dayTotals[log.logged_date]) {
      dayTotals[log.logged_date] = { calories: 0, protein: 0 }
    }
    dayTotals[log.logged_date].calories += log.calories ?? 0
    dayTotals[log.logged_date].protein  += Number(log.protein_g ?? 0)
  }

  const foodLoggedDays = Object.keys(dayTotals).length
  let avgCaloriesLogged: number | null = null
  let avgProteinLogged:  number | null = null
  if (foodLoggedDays > 0) {
    const vals = Object.values(dayTotals)
    avgCaloriesLogged = Math.round(
      vals.reduce((s, d) => s + d.calories, 0) / foodLoggedDays
    )
    avgProteinLogged = Math.round(
      vals.reduce((s, d) => s + d.protein, 0) / foodLoggedDays
    )
  }

  const calorieTarget = target?.calories  ?? 0
  const proteinTarget = target?.protein_g ?? 0
  const calorieTrend  = categorizeCalorieTrend(avgCaloriesLogged, calorieTarget)
  const proteinStatus = categorizeProteinStatus(avgProteinLogged, proteinTarget)

  // ── Training ─────────────────────────────────────────────────────────────
  const completedSessions = sessions.filter((s: any) => s.status === 'completed')
  const hasActiveSession  = sessions.some((s: any) => s.status === 'in_progress')
  const sessionsCompleted = completedSessions.length
  const sessionDates: string[] = completedSessions.map((s: any) => s.workout_date)

  let totalSetsCompleted = 0
  for (const session of completedSessions) {
    for (const ex of (session as any).workout_exercises ?? []) {
      for (const set of ex.workout_sets ?? []) {
        if (set.status === 'completed' && !set.is_warmup) {
          totalSetsCompleted++
        }
      }
    }
  }

  // ── Fasting ──────────────────────────────────────────────────────────────
  const fastsCompletedThisWeek = fasts.length
  let avgFastHours: number | null = null
  if (fastsCompletedThisWeek > 0) {
    const totalMins = fasts.reduce(
      (s: number, f: any) => s + (f.duration_minutes ?? 0), 0
    )
    avgFastHours =
      Math.round((totalMins / fastsCompletedThisWeek / 60) * 10) / 10
  }

  // ── Activity (Phase 1H, informational only) ────────────────────────────
  const stepLoggedDays = activityLogs.length
  let avgStepsLogged: number | null = null
  if (stepLoggedDays > 0) {
    avgStepsLogged = Math.round(
      activityLogs.reduce((s, l) => s + l.steps, 0) / stepLoggedDays
    )
  }
  const stepGoalDaysHit = stepGoal
    ? activityLogs.filter((l) => l.steps >= stepGoal).length
    : null

  // ── Coaching output ───────────────────────────────────────────────────────
  const hasAnyData =
    weighInsThisWeek > 0 ||
    foodLoggedDays > 0 ||
    sessionsCompleted > 0 ||
    hasActiveSession ||
    fastsCompletedThisWeek > 0

  const primaryFocus = buildPrimaryFocus(
    daysElapsed, userGoal, weighInsThisWeek, foodLoggedDays,
    proteinStatus, sessionsCompleted, calorieTrend,
    stepGoal, stepLoggedDays
  )
  const weekBriefText = buildWeekBriefText(
    sessionsCompleted, foodLoggedDays, avgCaloriesLogged, weeklyChangeLbs
  )

  return {
    weekStart,
    weekEnd,
    daysElapsed,
    daysRemaining,
    weighInsThisWeek,
    latestWeightKg,
    priorWeightKg,
    weeklyChangeLbs,
    weightDataSufficient: latestWeightKg !== null && priorWeightKg !== null,
    foodLoggedDays,
    avgCaloriesLogged,
    avgProteinLogged,
    calorieTarget: calorieTarget > 0 ? calorieTarget : null,
    proteinTarget:  proteinTarget  > 0 ? proteinTarget  : null,
    calorieTrend,
    proteinStatus,
    sessionsCompleted,
    totalSetsCompleted,
    sessionDates,
    hasActiveSession,
    fastingEnabled,
    fastsCompletedThisWeek,
    avgFastHours,
    stepGoal,
    stepLoggedDays,
    avgStepsLogged,
    stepGoalDaysHit,
    primaryFocus,
    weekBriefText,
    userGoal,
    hasAnyData,
  }
}
