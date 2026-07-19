// ============================================================
// ShredOS — Progress Summary (Phase 1J)
// Read-only 4-week (28-day) history view. Derives long-term
// consistency and a plain weight-trend readout from existing
// tables via dedicated bounded queries.
//
// Deliberately does NOT reuse fetchWeeklyReview,
// fetchNutritionCoachSummary, or fetchWorkoutWeekStats — all
// three are scoped to the current ISO week and would need to be
// called repeatedly or contorted to cover 4 weeks. A dedicated
// 28-day query set is simpler and keeps this file's role distinct:
// Progress is the long-term read, not a second coaching engine.
//
// No calorie/target recommendations here — that stays on /coach.
// No writes. No schema changes.
// ============================================================

import { subDays, format, parseISO, differenceInCalendarDays } from 'date-fns'
import type { NutritionTarget } from '@/types/database'

const WINDOW_DAYS = 28

// Protein "hit day" threshold — intentionally a local, independent
// constant. Not imported from nutrition-coach.ts: that file's
// thresholds gate calorie/protein *coaching suggestions*, while this
// is a plain historical count with no suggestion attached.
const PROTEIN_HIT_RATIO = 0.9

// Nutrition logging confidence over the 28-day window
const NUTRITION_LOW_DATA_MAX = 9        // 0-9 days logged = low data
const NUTRITION_BUILDING_MAX = 19       // 10-19 days = building consistency
// 20+ days = consistent

// Weight trend — total delta over the window, not a weekly rate.
// Deliberately separate from nutrition-coach's WEIGHT_LOSING/GAINING
// per-week thresholds, which serve a different purpose (weekly
// coaching signal vs. this file's longer-term factual read).
const WEIGHT_STABLE_THRESHOLD_LBS = 1

// ── Types ────────────────────────────────────────────────────────────

export type WeightTrend = 'down' | 'up' | 'stable' | 'insufficient-data'
export type NutritionConfidence = 'low' | 'building' | 'consistent'

export interface WeightProgress {
  weighInCount: number
  firstWeightKg: number | null
  latestWeightKg: number | null
  deltaLbs: number | null
  trend: WeightTrend
}

export interface NutritionProgress {
  loggedDays: number
  avgCaloriesLogged: number | null
  avgProteinLogged: number | null
  proteinHitDays: number | null
  confidence: NutritionConfidence
}

export interface TrainingProgress {
  completedCount: number
  avgPerWeek: number
  mostRecentDate: string | null
  bestWeekCount: number
}

export interface ActivityProgress {
  loggedDays: number
  avgSteps: number | null
  goalDays: number | null
  bestDaySteps: number | null
}

export interface FastingProgress {
  completedCount: number
  totalHours: number
  longestHours: number | null
}

export interface ProgressSummary {
  windowStart: string
  windowEnd: string
  daysCovered: number

  weight: WeightProgress
  nutrition: NutritionProgress
  training: TrainingProgress
  activity: ActivityProgress
  fasting: FastingProgress | null // null entirely when fasting is disabled

  wins: string[]
  userGoal: string | null
  hasAnyData: boolean
}

// ── Pure helpers (no I/O) ─────────────────────────────────────────────

function computeWeightProgress(
  metrics: Array<{ logged_date: string; weight_kg: number }>
): WeightProgress {
  const weighInCount = metrics.length
  if (weighInCount === 0) {
    return {
      weighInCount: 0,
      firstWeightKg: null,
      latestWeightKg: null,
      deltaLbs: null,
      trend: 'insufficient-data',
    }
  }
  // metrics is expected pre-sorted ascending by logged_date
  const firstWeightKg = metrics[0].weight_kg
  const latestWeightKg = metrics[metrics.length - 1].weight_kg

  if (weighInCount < 2) {
    return {
      weighInCount,
      firstWeightKg,
      latestWeightKg,
      deltaLbs: null,
      trend: 'insufficient-data',
    }
  }

  const deltaLbs = Math.round((latestWeightKg - firstWeightKg) * 2.20462 * 10) / 10
  let trend: WeightTrend = 'stable'
  if (Math.abs(deltaLbs) >= WEIGHT_STABLE_THRESHOLD_LBS) {
    trend = deltaLbs < 0 ? 'down' : 'up'
  }

  return { weighInCount, firstWeightKg, latestWeightKg, deltaLbs, trend }
}

function computeNutritionProgress(
  foodLogs: Array<{ logged_date: string; calories: number; protein_g: number }>,
  target: NutritionTarget | null
): NutritionProgress {
  const dayTotals: Record<string, { calories: number; protein: number }> = {}
  for (const log of foodLogs) {
    if (!dayTotals[log.logged_date]) {
      dayTotals[log.logged_date] = { calories: 0, protein: 0 }
    }
    dayTotals[log.logged_date].calories += log.calories ?? 0
    dayTotals[log.logged_date].protein += Number(log.protein_g ?? 0)
  }

  const loggedDays = Object.keys(dayTotals).length
  const vals = Object.values(dayTotals)

  const avgCaloriesLogged =
    loggedDays > 0
      ? Math.round(vals.reduce((s, d) => s + d.calories, 0) / loggedDays)
      : null
  const avgProteinLogged =
    loggedDays > 0
      ? Math.round(vals.reduce((s, d) => s + d.protein, 0) / loggedDays)
      : null

  const proteinTarget = target?.protein_g ?? 0
  const proteinHitDays =
    proteinTarget > 0
      ? vals.filter((d) => d.protein >= proteinTarget * PROTEIN_HIT_RATIO).length
      : null

  let confidence: NutritionConfidence = 'low'
  if (loggedDays > NUTRITION_BUILDING_MAX) confidence = 'consistent'
  else if (loggedDays > NUTRITION_LOW_DATA_MAX) confidence = 'building'

  return { loggedDays, avgCaloriesLogged, avgProteinLogged, proteinHitDays, confidence }
}

function computeTrainingProgress(
  sessions: Array<{ workout_date: string; status: string }>,
  todayStr: string
): TrainingProgress {
  const completed = sessions.filter((s) => s.status === 'completed')
  const completedCount = completed.length
  const avgPerWeek = Math.round((completedCount / 4) * 10) / 10

  const mostRecentDate =
    completed.length > 0
      ? completed.reduce(
          (latest, s) => (s.workout_date > latest ? s.workout_date : latest),
          completed[0].workout_date
        )
      : null

  // Four non-overlapping 7-day buckets ending today — no rolling window,
  // no double-counting.
  const today = parseISO(todayStr)
  const buckets = [0, 1, 2, 3].map((i) => {
    const bucketEnd = format(subDays(today, i * 7), 'yyyy-MM-dd')
    const bucketStart = format(subDays(today, i * 7 + 6), 'yyyy-MM-dd')
    return completed.filter(
      (s) => s.workout_date >= bucketStart && s.workout_date <= bucketEnd
    ).length
  })
  const bestWeekCount = Math.max(0, ...buckets)

  return { completedCount, avgPerWeek, mostRecentDate, bestWeekCount }
}

function computeActivityProgress(
  activityLogs: Array<{ logged_date: string; steps: number }>,
  stepGoal: number | null
): ActivityProgress {
  const loggedDays = activityLogs.length
  const avgSteps =
    loggedDays > 0
      ? Math.round(activityLogs.reduce((s, l) => s + l.steps, 0) / loggedDays)
      : null
  const goalDays =
    stepGoal !== null ? activityLogs.filter((l) => l.steps >= stepGoal).length : null
  const bestDaySteps =
    loggedDays > 0 ? Math.max(...activityLogs.map((l) => l.steps)) : null

  return { loggedDays, avgSteps, goalDays, bestDaySteps }
}

function computeFastingProgress(
  fasts: Array<{ duration_minutes: number }>
): FastingProgress {
  const completedCount = fasts.length
  const totalMinutes = fasts.reduce((s, f) => s + (f.duration_minutes ?? 0), 0)
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10
  const longestHours =
    completedCount > 0
      ? Math.round((Math.max(...fasts.map((f) => f.duration_minutes ?? 0)) / 60) * 10) / 10
      : null

  return { completedCount, totalHours, longestHours }
}

function buildWins(
  nutrition: NutritionProgress,
  training: TrainingProgress,
  activity: ActivityProgress,
  weight: WeightProgress,
  fasting: FastingProgress | null
): string[] {
  const wins: string[] = []

  if (nutrition.loggedDays >= 20) {
    wins.push(`Logged food on ${nutrition.loggedDays} of the last 28 days`)
  }
  if (training.completedCount >= 8) {
    wins.push(`Completed ${training.completedCount} workouts in the last 4 weeks`)
  }
  if (activity.goalDays !== null && activity.goalDays >= 10) {
    wins.push(`Hit your step goal on ${activity.goalDays} days`)
  }
  if (weight.weighInCount >= 4) {
    wins.push(`Logged ${weight.weighInCount} weigh-ins`)
  }
  if (fasting && fasting.completedCount >= 3) {
    wins.push(`Completed ${fasting.completedCount} fasts, longest ${fasting.longestHours}h`)
  }
  if (activity.bestDaySteps !== null && activity.bestDaySteps > 0) {
    wins.push(`Best step day: ${activity.bestDaySteps.toLocaleString()} steps`)
  }
  if (training.bestWeekCount >= 3) {
    wins.push(`Most consistent week: ${training.bestWeekCount} workouts`)
  }

  return wins.slice(0, 5)
}

// ── Main export ────────────────────────────────────────────────────────

/**
 * Derives a 4-week (28-day) progress summary from existing tables.
 * Runs 5 bounded queries in parallel, all scoped to the same window
 * and to the authenticated user_id. Read-only — no writes anywhere.
 */
export async function fetchProgressSummary(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  todayStr: string,
  target: NutritionTarget | null,
  userGoal: string | null,
  fastingEnabled: boolean,
  stepGoal: number | null
): Promise<ProgressSummary> {
  const today = parseISO(todayStr)
  const windowStart = format(subDays(today, WINDOW_DAYS - 1), 'yyyy-MM-dd')
  const windowEnd = todayStr
  const daysCovered = differenceInCalendarDays(today, parseISO(windowStart)) + 1

  const [metricsRes, foodRes, sessionRes, activityRes, fastingRes] = await Promise.all([
    supabase
      .from('body_metrics')
      .select('logged_date, weight_kg')
      .eq('user_id', userId)
      .gte('logged_date', windowStart)
      .lte('logged_date', windowEnd)
      .not('weight_kg', 'is', null)
      .order('logged_date', { ascending: true }),

    supabase
      .from('food_logs')
      .select('logged_date, calories, protein_g')
      .eq('user_id', userId)
      .gte('logged_date', windowStart)
      .lte('logged_date', windowEnd),

    supabase
      .from('workout_sessions')
      .select('workout_date, status')
      .eq('user_id', userId)
      .gte('workout_date', windowStart)
      .lte('workout_date', windowEnd)
      .eq('status', 'completed'),

    supabase
      .from('daily_activity_logs')
      .select('logged_date, steps')
      .eq('user_id', userId)
      .gte('logged_date', windowStart)
      .lte('logged_date', windowEnd),

    fastingEnabled
      ? supabase
          .from('fasting_logs')
          .select('duration_minutes, ended_at')
          .eq('user_id', userId)
          .not('ended_at', 'is', null)
          .gte('ended_at', `${windowStart}T00:00:00`)
          .lte('ended_at', `${windowEnd}T23:59:59.999`)
      : Promise.resolve({ data: [] }),
  ])

  const metrics = metricsRes.data ?? []
  const foodLogs = foodRes.data ?? []
  const sessions = sessionRes.data ?? []
  const activityLogs = activityRes.data ?? []
  const fasts = fastingRes.data ?? []

  const weight = computeWeightProgress(metrics)
  const nutrition = computeNutritionProgress(foodLogs, target)
  const training = computeTrainingProgress(sessions, todayStr)
  const activity = computeActivityProgress(activityLogs, stepGoal)
  const fasting = fastingEnabled ? computeFastingProgress(fasts) : null

  const wins = buildWins(nutrition, training, activity, weight, fasting)

  const hasAnyData =
    weight.weighInCount > 0 ||
    nutrition.loggedDays > 0 ||
    training.completedCount > 0 ||
    activity.loggedDays > 0 ||
    (fasting !== null && fasting.completedCount > 0)

  return {
    windowStart,
    windowEnd,
    daysCovered,
    weight,
    nutrition,
    training,
    activity,
    fasting,
    wins,
    userGoal,
    hasAnyData,
  }
}
