// ============================================================
// ShredOS — Nutrition Coaching Layer  (Phase 1F)
// Derived server-side coaching from existing tables.
// No schema changes. No target writes. Read-only.
// Two bounded Supabase queries per call:
//   food_logs last 14 days + body_metrics last 21 days
// ============================================================

import { differenceInDays, parseISO, subDays, format } from 'date-fns'
import type { NutritionTarget, FoodLog } from '@/types/database'

// ── Thresholds ───────────────────────────────────────────────────────────

// Logged days needed to compute 7-day averages
export const NUTRITION_MIN_LOGGED_DAYS = 4
// Weigh-ins needed for a weight trend signal
const NUTRITION_MIN_WEIGH_INS = 2
// Goals eligible for calorie adjustment suggestions
const CALORIE_SUGGESTION_GOALS = ['fat_loss', 'recomposition'] as const
// Never suggest going below this calorie floor
const MIN_CALORIES_FLOOR = 1200

// Protein thresholds (fraction of daily target)
const PROTEIN_MEETING_THRESHOLD = 0.90  // ≥90% = meeting
const PROTEIN_CLOSE_THRESHOLD   = 0.80  // 80–89% = close, below = low

// Calorie on-track band: ±10% of target
const CALORIE_ON_TRACK_RANGE = 0.10

// Weight trend thresholds (lbs/week)
const WEIGHT_LOSING_THRESHOLD  = -0.1  // ≤ -0.1 lb/wk = losing
const WEIGHT_GAINING_THRESHOLD =  0.2  // ≥ +0.2 lb/wk = gaining

// ── Types ────────────────────────────────────────────────────────────

export type LoggingConfidence = 'high' | 'moderate' | 'low' | 'insufficient'
export type ProteinStatus     = 'meeting' | 'close' | 'low' | 'insufficient-data'
export type CalorieTrend      = 'on-track' | 'below' | 'above' | 'insufficient-data'
export type WeightTrend       = 'losing' | 'holding' | 'gaining' | 'insufficient-data'

export interface NutritionCoachSummary {
  // Today (from already-fetched todayLogs)
  caloriesToday:  number
  proteinToday:   number
  hasLoggedToday: boolean

  // Rolling 7-day window (logged-days-only averages)
  loggedDaysLast7:  number
  avgCaloriesLast7: number | null  // null when < NUTRITION_MIN_LOGGED_DAYS
  avgProteinLast7:  number | null

  loggingConfidence: LoggingConfidence

  // Derived status
  proteinStatus: ProteinStatus
  calorieTrend:  CalorieTrend

  // Weight trend (body_metrics last 21 days)
  weeklyWeightChangeLbs: number | null
  weightTrend:           WeightTrend

  // Coaching output
  primaryNudge:      string | null  // single most-important coaching line (dashboard + food page)
  calorieSuggestion: string | null  // conservative suggestion (food page only)

  hasEnoughData: boolean   // loggedDaysLast7 >= NUTRITION_MIN_LOGGED_DAYS
  userGoal:      string | null
}

// ── Pure helpers (fully testable, no I/O) ──────────────────────────────────

function categorizeLoggingConfidence(days: number): LoggingConfidence {
  if (days >= 6) return 'high'
  if (days >= 4) return 'moderate'
  if (days >= 2) return 'low'
  return 'insufficient'
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

function categorizeWeightTrend(changePerWeekLbs: number | null): WeightTrend {
  if (changePerWeekLbs === null) return 'insufficient-data'
  if (changePerWeekLbs <= WEIGHT_LOSING_THRESHOLD)  return 'losing'
  if (changePerWeekLbs >= WEIGHT_GAINING_THRESHOLD) return 'gaining'
  return 'holding'
}

function buildPrimaryNudge(
  loggingConfidence: LoggingConfidence,
  proteinStatus: ProteinStatus,
  calorieTrend: CalorieTrend,
  hasLoggedToday: boolean,
  userGoal: string | null
): string | null {
  // Priority 1: not enough data
  if (loggingConfidence === 'insufficient') {
    return hasLoggedToday
      ? 'Log a few more days this week to see coaching insights.'
      : "Log today's meals to start building your weekly picture."
  }
  // Priority 2: protein concern
  if (proteinStatus === 'low') {
    return 'Protein has been low this week — aim for a high-protein meal or snack today.'
  }
  if (proteinStatus === 'close') {
    return 'Protein is slightly under target this week — one addition will close it.'
  }
  // Priority 3: calorie signal (goal-aware)
  const isCuttingGoal = userGoal === 'fat_loss' || userGoal === 'recomposition'
  if (isCuttingGoal && calorieTrend === 'above') {
    return 'Calories have been running above target this week.'
  }
  // Priority 4: on-track positive signal
  if (calorieTrend === 'on-track' && proteinStatus === 'meeting') {
    return 'On track this week — calories and protein both looking good.'
  }
  // Priority 5: low logging consistency
  if (loggingConfidence === 'low') {
    return 'Log more consistently to see reliable weekly coaching insights.'
  }
  return null
}

function buildCalorieSuggestion(
  loggingConfidence: LoggingConfidence,
  userGoal: string | null,
  weightTrend: WeightTrend,
  calorieTrend: CalorieTrend,
  avgCaloriesLast7: number | null
): string | null {
  // Gate 1: requires high confidence (6+ logged days)
  if (loggingConfidence !== 'high') return null
  // Gate 2: cutting goal only
  if (!CALORIE_SUGGESTION_GOALS.includes(userGoal as typeof CALORIE_SUGGESTION_GOALS[number])) {
    return null
  }
  // Gate 3: needs an average to base the suggestion on
  if (avgCaloriesLast7 === null) return null
  // Gate 4: no suggestion without reliable weight data (requires 2+ weigh-ins)
  if (weightTrend === 'insufficient-data') return null
  // Gate 5: don’t suggest reduction if already losing
  if (weightTrend === 'losing') return null
  // Gate 6: don’t suggest reduction if already under target
  if (calorieTrend === 'below') return null

  // Safety floor
  const suggested = Math.max(MIN_CALORIES_FLOOR, Math.round(avgCaloriesLast7 - 150))
  if (suggested <= MIN_CALORIES_FLOOR) return null

  const avg = Math.round(avgCaloriesLast7).toLocaleString()
  const sug = suggested.toLocaleString()

  if (weightTrend === 'holding') {
    return (
      `Weight has been holding at an average of ${avg} cal/day. ` +
      `A reduction of 100–200 cal may restart progress — try ${sug} cal/day.`
    )
  }
  if (weightTrend === 'gaining') {
    return (
      `Weight has been trending up while averaging ${avg} cal/day. ` +
      `Consider reducing by 100–200 cal/day.`
    )
  }
  return null
}

// ── Main export ───────────────────────────────────────────────────────────

/**
 * Computes the full nutrition coaching summary.
 *
 * target and todayLogs are passed in from the caller’s existing fetches
 * to avoid redundant Supabase queries. This function adds exactly two
 * bounded queries of its own:
 *   1. food_logs last 14 days (rolling 7-day window with 1-week buffer)
 *   2. body_metrics last 21 days (weight trend)
 */
export async function fetchNutritionCoachSummary(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  todayStr: string,
  target: NutritionTarget | null,
  todayLogs: FoodLog[],
  userGoal: string | null
): Promise<NutritionCoachSummary> {
  const today           = parseISO(todayStr)
  const sevenDaysAgo    = format(subDays(today,  6), 'yyyy-MM-dd')  // today + 6 prior = 7 days
  const fourteenDaysAgo = format(subDays(today, 14), 'yyyy-MM-dd')
  const twentyOneDaysAgo = format(subDays(today, 21), 'yyyy-MM-dd')

  // Run the two new queries in parallel
  const [foodRes, metricsRes] = await Promise.all([
    supabase
      .from('food_logs')
      .select('logged_date, calories, protein_g')
      .eq('user_id', userId)
      .gte('logged_date', fourteenDaysAgo)
      .lte('logged_date', todayStr)
      .order('logged_date', { ascending: false }),
    supabase
      .from('body_metrics')
      .select('logged_date, weight_kg')
      .eq('user_id', userId)
      .gte('logged_date', twentyOneDaysAgo)
      .not('weight_kg', 'is', null)
      .order('logged_date', { ascending: false }),
  ])

  const recentFoodLogs: Array<{ logged_date: string; calories: number; protein_g: number }> =
    foodRes.data ?? []
  const recentMetrics: Array<{ logged_date: string; weight_kg: number }> =
    metricsRes.data ?? []

  // ── Today’s totals (from pre-fetched todayLogs) ──────────────────────────────
  const caloriesToday  = Math.round(todayLogs.reduce((s, l) => s + (l.calories ?? 0), 0))
  const proteinToday   = Math.round(todayLogs.reduce((s, l) => s + Number(l.protein_g ?? 0), 0))
  const hasLoggedToday = todayLogs.length > 0

  // ── 7-day rolling averages (logged-days-only) ─────────────────────────────
  // Group logs by date, sum calories + protein per day
  const dayTotals: Record<string, { calories: number; protein: number }> = {}

  for (const log of recentFoodLogs) {
    // Restrict to the last 7 days only (14-day fetch is a buffer)
    if (log.logged_date < sevenDaysAgo) continue
    if (!dayTotals[log.logged_date]) {
      dayTotals[log.logged_date] = { calories: 0, protein: 0 }
    }
    dayTotals[log.logged_date].calories += log.calories ?? 0
    dayTotals[log.logged_date].protein  += Number(log.protein_g ?? 0)
  }

  const loggedDaysLast7   = Object.keys(dayTotals).length
  const loggingConfidence = categorizeLoggingConfidence(loggedDaysLast7)

  let avgCaloriesLast7: number | null = null
  let avgProteinLast7:  number | null = null

  if (loggedDaysLast7 >= NUTRITION_MIN_LOGGED_DAYS) {
    const vals = Object.values(dayTotals)
    avgCaloriesLast7 = Math.round(vals.reduce((s, d) => s + d.calories, 0) / loggedDaysLast7)
    avgProteinLast7  = Math.round(vals.reduce((s, d) => s + d.protein,  0) / loggedDaysLast7)
  }

  // ── Weight trend ───────────────────────────────────────────────────────────
  let weeklyWeightChangeLbs: number | null = null
  let weightTrend: WeightTrend = 'insufficient-data'

  if (recentMetrics.length >= NUTRITION_MIN_WEIGH_INS) {
    const latest   = recentMetrics[0]
    const earliest = recentMetrics[recentMetrics.length - 1]
    const daysBetween = differenceInDays(
      parseISO(latest.logged_date),
      parseISO(earliest.logged_date)
    )
    if (daysBetween > 0) {
      const totalChangeLbs = (latest.weight_kg - earliest.weight_kg) * 2.20462
      // Normalise to per-week rate
      weeklyWeightChangeLbs = Math.round((totalChangeLbs / daysBetween) * 7 * 10) / 10
      weightTrend = categorizeWeightTrend(weeklyWeightChangeLbs)
    }
  }

  // ── Derived status ──────────────────────────────────────────────────────
  const targetCalories = target?.calories  ?? 0
  const targetProtein  = target?.protein_g ?? 0

  const proteinStatus = categorizeProteinStatus(avgProteinLast7, targetProtein)
  const calorieTrend  = categorizeCalorieTrend(avgCaloriesLast7, targetCalories)
  const hasEnoughData = loggedDaysLast7 >= NUTRITION_MIN_LOGGED_DAYS

  // ── Coaching output ────────────────────────────────────────────────────
  const primaryNudge = buildPrimaryNudge(
    loggingConfidence, proteinStatus, calorieTrend, hasLoggedToday, userGoal
  )
  const calorieSuggestion = hasEnoughData
    ? buildCalorieSuggestion(
        loggingConfidence, userGoal, weightTrend, calorieTrend, avgCaloriesLast7
      )
    : null

  return {
    caloriesToday,
    proteinToday,
    hasLoggedToday,
    loggedDaysLast7,
    avgCaloriesLast7,
    avgProteinLast7,
    loggingConfidence,
    proteinStatus,
    calorieTrend,
    weeklyWeightChangeLbs,
    weightTrend,
    primaryNudge,
    calorieSuggestion,
    hasEnoughData,
    userGoal,
  }
}
