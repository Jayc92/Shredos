// ============================================================
// ShredOS — Weekly Review (Phase 1G, extended in Phase 1H)
// Current ISO-week check-in derived server-side from existing
// tables. No schema changes. No writes. Read-only.
//
// Phase 1G: weight, nutrition, training, fasting.
// Phase 1H: added daily_activity_logs query + step metrics
// (informational only — does not affect coaching or hasAnyData).
//
// Adds 4–5 bounded queries on the /check-in page only.
// Zero impact on dashboard load.
// ============================================================

import {
  startOfISOWeek,
  endOfISOWeek,
  differenceInDays,
  parseISO,
  format,
  addDays,
  subDays,
} from 'date-fns'
import type { NutritionTarget } from '@/types/database'
import {
  CUTTING_GOALS,
  PROTEIN_MEETING_THRESHOLD,
  PROTEIN_CLOSE_THRESHOLD,
  CALORIE_ON_TRACK_RANGE,
  MIN_RELIABLE_LOGGED_DAYS,
} from '@/lib/coach-constants'
import {
  dedupeDailyWeights,
  averageWeightLbsInWindow,
  MIN_DATES_FOR_AVERAGE,
} from '@/lib/weight-trends'
import type { RawWeighInLike } from '@/lib/weight-trends'
import {
  buildDailyNutritionTotals,
  averageAcrossLoggedDays,
  MIN_LOGGED_DAYS_FOR_AVERAGE,
} from '@/lib/nutrition-trends'
import type { RawFoodLogLike } from '@/lib/nutrition-trends'
import {
  buildExerciseProgressOverview,
  sortOverviewRows,
} from '@/lib/progress-overview'
import type {
  ExerciseProgressOverviewRow,
  RawOverviewSession,
} from '@/lib/progress-overview'
import { getFastingDuration } from '@/lib/fasting'

// ── Thresholds ───────────────────────────────────────────────────
// Phase 1K: these previously mirrored nutrition-coach.ts's own local
// copies (PROTEIN_MEETING_THRESHOLD, PROTEIN_CLOSE_THRESHOLD,
// CALORIE_ON_TRACK_RANGE, CUTTING_GOALS) as separate literals. Now both
// files import the same values from coach-constants.ts, so there's
// nothing left to keep in sync by hand.

// ── Types ─────────────────────────────────────────────────────────

export type CalorieTrend = 'on-track' | 'above' | 'below' | 'insufficient-data'
export type ProteinStatus = 'meeting' | 'close' | 'low' | 'insufficient-data'

/**
 * Phase 3C: per-domain availability — distinguishes "the query
 * succeeded and the data is genuinely empty/zero" from "the query
 * FAILED and we know nothing". A failed workout query must never be
 * treated as a confirmed zero-workout week (Phase 3B made failures
 * observable; this makes them actionable): coach rules that depend on
 * an unavailable domain are suppressed instead of firing on false
 * zeros.
 */
export interface WeeklyDomainAvailability {
  weight: boolean
  nutrition: boolean
  training: boolean
  activity: boolean
  fasting: boolean
}

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

  /** Phase 3C: which domains' queries actually succeeded. */
  availability: WeeklyDomainAvailability
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
  if (foodLoggedDays < MIN_RELIABLE_LOGGED_DAYS && daysElapsed >= 5) {
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
  if (stepGoal && stepLoggedDays < MIN_RELIABLE_LOGGED_DAYS && daysElapsed >= 5) {
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

// ── Legacy weekly training normalization (Phase 3B repair) ──────────

/** The exact embedded relation shape the legacy sessions query returns. */
export interface LegacyWeeklySessionRow {
  status: string
  workout_date: string
  workout_exercises: Array<{
    workout_sets: Array<{ completed: boolean; is_warmup: boolean }> | null
  }> | null
}

export interface LegacyWeeklyTrainingTotals {
  sessionsCompleted: number
  totalSetsCompleted: number
  sessionDates: string[]
  hasActiveSession: boolean
}

/** The persisted fasting fields these helpers read — fasting_logs has
 * NO duration_minutes column (migration 001 stores started_at +
 * ended_at only; the database types file documents "duration_minutes
 * is NOT stored — calculated in app"). */
export interface RawCompletedFastRow {
  started_at: string
  ended_at: string | null
}

/**
 * Derives completed-fast durations (in minutes) from the persisted
 * timestamps using the app's ONE authoritative convention —
 * getFastingDuration (fasting.ts), the same derivation the fasting
 * page and computeFastingWeekStats already use. Rows without an
 * ended_at (active fasts) and non-positive derived durations
 * (degenerate/invalid records) are excluded. Pure; never mutates.
 */
export function deriveCompletedFastMinutes(rows: RawCompletedFastRow[]): number[] {
  const minutes: number[] = []
  for (const row of rows) {
    if (!row.started_at || !row.ended_at) continue
    const derived = getFastingDuration(row.started_at, row.ended_at).minutes
    if (Number.isFinite(derived) && derived > 0) minutes.push(derived)
  }
  return minutes
}

/**
 * Pure, typed normalization boundary for the legacy weekly training
 * rows (Phase 3B). Before this repair, the query selected a
 * nonexistent workout_sets.status column (the schema column is
 * `completed BOOLEAN`, migration 003), PostgREST rejected the whole
 * embedded query, and the silently-swallowed error left the coach's
 * training data permanently empty.
 *
 * Rules (unchanged semantics, now actually applied to real data):
 *   - completed sessions only for the completed count and set totals
 *   - completed, non-warm-up sets only for the working-set count
 *   - in_progress presence sets hasActiveSession (never counted as
 *     completed); skipped/planned sessions count as nothing
 *   - null embedded relations are tolerated
 * Pure — never mutates the input rows.
 */
export function normalizeLegacyWeeklySessionRows(
  rows: LegacyWeeklySessionRow[]
): LegacyWeeklyTrainingTotals {
  const completedSessions = rows.filter((s) => s.status === 'completed')

  let totalSetsCompleted = 0
  for (const session of completedSessions) {
    for (const we of session.workout_exercises ?? []) {
      for (const set of we.workout_sets ?? []) {
        if (set.completed && !set.is_warmup) totalSetsCompleted++
      }
    }
  }

  return {
    sessionsCompleted: completedSessions.length,
    totalSetsCompleted,
    sessionDates: completedSessions.map((s) => s.workout_date),
    hasActiveSession: rows.some((s) => s.status === 'in_progress'),
  }
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
    // Phase 3C: created_at added so same-day weigh-ins deduplicate via
    // the authoritative Phase 2Y rule (latest record per date).
    supabase
      .from('body_metrics')
      .select('logged_date, weight_kg, created_at')
      .eq('user_id', userId)
      .gte('logged_date', twentyEightDaysAgo)
      .not('weight_kg', 'is', null)
      .order('logged_date', { ascending: false }),

    // Phase 3C: carbs_g/fat_g added so the authoritative Phase 2Z
    // meaningful-entry rule can evaluate every macro.
    supabase
      .from('food_logs')
      .select('logged_date, calories, protein_g, carbs_g, fat_g')
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
          workout_sets ( completed, is_warmup )
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
    // Phase 3B: previously selected a nonexistent duration_minutes
    // column (duration is never persisted — it is derived from the
    // timestamps in app code), which PostgREST rejected outright.
    fastingEnabled
      ? supabase
          .from('fasting_logs')
          .select('started_at, ended_at')
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

  // Phase 3B: query failures previously vanished into `?? []`, which
  // is exactly how the workout_sets.status schema bug went unnoticed —
  // the sessions query was rejected outright and the coach saw an
  // empty training week forever. Failures now log (the repo's
  // fetch-helper convention) while the page stays stable on the same
  // safe empty results; raw errors are never shown to the user.
  if (metricsRes.error)  console.error('fetchWeeklyReview (body_metrics) error:', metricsRes.error)
  if (foodRes.error)     console.error('fetchWeeklyReview (food_logs) error:', foodRes.error)
  if (sessionRes.error)  console.error('fetchWeeklyReview (workout_sessions) error:', sessionRes.error)
  if (fastingRes.error)  console.error('fetchWeeklyReview (fasting_logs) error:', fastingRes.error)
  if (activityRes.error) console.error('fetchWeeklyReview (daily_activity_logs) error:', activityRes.error)

  // Phase 3C: a failed query is "unavailable", never a confirmed zero.
  // (The fasting branch resolves { data: [] } with no error field when
  // fasting is disabled, which correctly reads as available.)
  const availability: WeeklyDomainAvailability = {
    weight: !metricsRes.error,
    nutrition: !foodRes.error,
    training: !sessionRes.error,
    activity: !activityRes.error,
    fasting: !fastingRes.error,
  }

  const allMetrics  = metricsRes.data ?? []
  const foodLogs    = foodRes.data ?? []
  const sessions: LegacyWeeklySessionRow[] = sessionRes.data ?? []
  const fasts       = fastingRes.data ?? []
  const activityLogs: Array<{ logged_date: string; steps: number }> = activityRes.data ?? []

  // ── Weight ───────────────────────────────────────────────────────────────
  // Phase 3C alignment: distinct weigh-in DATES via the authoritative
  // Phase 2Y dedup (latest same-day record wins) — previously raw row
  // counts, which double-counted same-day weigh-ins. The zero-weigh-in
  // coach rule is unaffected (zero rows ⇔ zero dates); only the count's
  // meaning and the latest/prior selection are normalized.
  const dailyWeights = dedupeDailyWeights(allMetrics as RawWeighInLike[])
  const thisWeekDaily = dailyWeights.filter(
    (p) => p.date >= weekStart && p.date <= queryEnd
  )
  const priorDaily = dailyWeights.filter((p) => p.date < weekStart)

  const weighInsThisWeek = thisWeekDaily.length
  const latestWeightKg =
    thisWeekDaily.length > 0 ? thisWeekDaily[thisWeekDaily.length - 1].weightKg : null
  const priorWeightKg =
    priorDaily.length > 0 ? priorDaily[priorDaily.length - 1].weightKg : null

  let weeklyChangeLbs: number | null = null
  if (latestWeightKg !== null && priorWeightKg !== null) {
    weeklyChangeLbs =
      Math.round((latestWeightKg - priorWeightKg) * 2.20462 * 10) / 10
  }

  // ── Nutrition ────────────────────────────────────────────────────────────
  // Phase 3C alignment: daily aggregation via the authoritative Phase
  // 2Z normalizer. Corrections this brings to the coach's inputs:
  //   - all-zero/invalid placeholder rows no longer create logged days
  //   - a day logged without protein data no longer drags the protein
  //     average toward zero (previously `?? 0` sums), so a "protein
  //     low" suggestion can't be manufactured by calorie-only logging
  //   - averages need two contributing days (2Z's shared minimum);
  //     with fewer, the statuses read insufficient-data instead of
  //     pretending one day is a weekly average
  // Rules, thresholds, and wording are unchanged — only these inputs.
  const dailyNutrition = buildDailyNutritionTotals(foodLogs as RawFoodLogLike[])
  const weekNutrition = dailyNutrition.filter(
    (d) => d.date >= weekStart && d.date <= queryEnd
  )
  const foodLoggedDays = weekNutrition.length
  const avgCaloriesLogged = averageAcrossLoggedDays(weekNutrition, 'calories').average
  const avgProteinLogged = averageAcrossLoggedDays(weekNutrition, 'proteinGrams').average

  const calorieTarget = target?.calories  ?? 0
  const proteinTarget = target?.protein_g ?? 0
  const calorieTrend  = categorizeCalorieTrend(avgCaloriesLogged, calorieTarget)
  const proteinStatus = categorizeProteinStatus(avgProteinLogged, proteinTarget)

  // ── Training ─────────────────────────────────────────────────────────────
  // Phase 3B: typed pure normalizer replaces the inline reduction that
  // filtered on the nonexistent workout_sets.status column. Same
  // intended semantics, real schema columns, testable in isolation.
  const { sessionsCompleted, totalSetsCompleted, sessionDates, hasActiveSession } =
    normalizeLegacyWeeklySessionRows(sessions)

  // ── Fasting ──────────────────────────────────────────────────────────────
  // Phase 3B: durations are now derived from started_at/ended_at via
  // the app's authoritative getFastingDuration convention (they were
  // never persisted). Same average math as before; rows whose derived
  // duration is non-positive no longer count as completed fasts.
  const completedFastMinutes = deriveCompletedFastMinutes(fasts as RawCompletedFastRow[])
  const fastsCompletedThisWeek = completedFastMinutes.length
  let avgFastHours: number | null = null
  if (fastsCompletedThisWeek > 0) {
    const totalMins = completedFastMinutes.reduce((s, m) => s + m, 0)
    avgFastHours =
      Math.round((totalMins / fastsCompletedThisWeek / 60) * 10) / 10
  }

  // ── Activity (Phase 1H, informational only) ────────────────────────────
  const stepLoggedDays = activityLogs.length
  let avgStepsLogged: number | null = null
  if (stepLoggedDays > 0) {
    // Authoritative 7-day rule (see averageDailySteps): total across
    // the week / 7, missing days as zero — never / logged days.
    avgStepsLogged = averageDailySteps(
      activityLogs.reduce((s, l) => s + l.steps, 0)
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
    availability,
  }
}

// ============================================================
// Phase 3A — Unified completed-week review
// Everything below is ADDITIVE. fetchWeeklyReview above (the
// current-in-progress-week read) is consumed by coach-actions.ts and
// is deliberately untouched; the /check-in page now renders this
// completed-week review instead, while the coach keeps its existing
// data source.
//
// Synthesis only — every calculation is reused from its owning phase:
//   weight    → dedupeDailyWeights + averageWeightLbsInWindow (2Y)
//   nutrition → buildDailyNutritionTotals + averageAcrossLoggedDays (2Z)
//   exercise  → buildExerciseProgressOverview + sortOverviewRows (2X;
//               the SAME classifier, applied to a bounded query — the
//               latest-vs-previous comparison may include a prior
//               session from before the review week, labeled "Latest
//               comparison" in the UI)
// No new trend formulas, no causal claims, no automatic decisions.
// All helpers below fetchWeeklyReviewSummary's queries are pure and
// exercised by scripts/verify-phase3a.ts.
// ============================================================

// ── Review-window resolution ─────────────────────────────────────────

/**
 * How far back the exercise-progression query looks BEFORE the review
 * week so the existing latest-vs-previous comparison usually has its
 * prior session available (2X's page uses an all-time scan; a weekly
 * review doesn't need one). A prior session older than this bound
 * simply yields "More data needed" — never a wrong judgment.
 */
export const PROGRESSION_LOOKBACK_DAYS = 56

/** Confidence sufficiency thresholds — data completeness only, no
 * physiological meaning. Weight reuses Phase 2Y's two-distinct-dates
 * average minimum; nutrition and activity reuse the existing
 * MIN_RELIABLE_LOGGED_DAYS (4) coach-constants rule; training needs
 * one completed workout. */
export const WEEKLY_SUFFICIENT = {
  weightDays: MIN_DATES_FOR_AVERAGE,
  nutritionDays: MIN_RELIABLE_LOGGED_DAYS,
  trainingWorkouts: 1,
  activityDays: MIN_RELIABLE_LOGGED_DAYS,
} as const

const WEEK_PARAM_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/**
 * The Monday of the most recent COMPLETED ISO week (repo convention:
 * startOfISOWeek, Monday–Sunday). The current in-progress week is
 * never a completed review period — even on Sunday.
 */
export function latestCompletedWeekStart(todayStr: string): string {
  const currentWeekStart = startOfISOWeek(parseISO(todayStr))
  return format(subDays(currentWeekStart, 7), 'yyyy-MM-dd')
}

/**
 * Resolves ?week= to a review Monday. Any parseable date snaps to its
 * own ISO week's Monday; missing, malformed, or future/incomplete
 * weeks safely fall back to the latest completed week.
 */
export function resolveReviewWeekStart(
  todayStr: string,
  weekParam: string | string[] | undefined
): string {
  const latest = latestCompletedWeekStart(todayStr)
  const candidate = Array.isArray(weekParam) ? weekParam[0] : weekParam
  if (!candidate || !WEEK_PARAM_PATTERN.test(candidate)) return latest
  const parsed = parseISO(candidate)
  if (Number.isNaN(parsed.getTime())) return latest
  const snapped = format(startOfISOWeek(parsed), 'yyyy-MM-dd')
  return snapped > latest ? latest : snapped
}

export interface ReviewWeekBounds {
  startDate: string
  endDate: string
  priorStartDate: string
  priorEndDate: string
  label: string
}

/** Same range-label convention the old check-in header used. */
export function formatWeekRangeLabel(startDate: string, endDate: string): string {
  const start = parseISO(startDate)
  const end = parseISO(endDate)
  const sameMonth = format(start, 'yyyy-MM') === format(end, 'yyyy-MM')
  const sameYear = format(start, 'yyyy') === format(end, 'yyyy')
  const startLabel = format(start, sameYear ? 'MMM d' : 'MMM d, yyyy')
  const endLabel = format(end, sameMonth ? 'd' : sameYear ? 'MMM d' : 'MMM d, yyyy')
  return `${startLabel}–${endLabel}`
}

export function reviewWeekBounds(weekStart: string): ReviewWeekBounds {
  const start = parseISO(weekStart)
  const endDate = format(addDays(start, 6), 'yyyy-MM-dd')
  return {
    startDate: weekStart,
    endDate,
    priorStartDate: format(subDays(start, 7), 'yyyy-MM-dd'),
    priorEndDate: format(subDays(start, 1), 'yyyy-MM-dd'),
    label: formatWeekRangeLabel(weekStart, endDate),
  }
}

export interface ReviewWeekNavigation {
  previousWeekStart: string
  /** Null when the next week is not yet a completed week. */
  nextWeekStart: string | null
  latestWeekStart: string
  isLatest: boolean
}

export function reviewWeekNavigation(
  weekStart: string,
  todayStr: string
): ReviewWeekNavigation {
  const latest = latestCompletedWeekStart(todayStr)
  const next = format(addDays(parseISO(weekStart), 7), 'yyyy-MM-dd')
  return {
    previousWeekStart: format(subDays(parseISO(weekStart), 7), 'yyyy-MM-dd'),
    nextWeekStart: next <= latest ? next : null,
    latestWeekStart: latest,
    isLatest: weekStart === latest,
  }
}

// ── Section reducers (all pure) ──────────────────────────────────────

export interface WeeklyWeightSummary {
  latestWeightLbs: number | null
  averageWeightLbs: number | null
  priorAverageWeightLbs: number | null
  loggedDays: number
  comparisonLabel: string | null
}

/**
 * Weekly weight via Phase 2Y's own primitives: one weight per local
 * date (latest same-day record wins — duplicates are never averaged),
 * weekly mean over distinct daily weights, at least two distinct
 * dates per window, display-rounded comparison. Neutral wording only.
 */
export function computeWeeklyWeight(
  rows: RawWeighInLike[],
  bounds: ReviewWeekBounds
): WeeklyWeightSummary {
  const daily = dedupeDailyWeights(rows)
  const inWeek = daily.filter((p) => p.date >= bounds.startDate && p.date <= bounds.endDate)

  const current = averageWeightLbsInWindow(daily, bounds.startDate, bounds.endDate)
  const prior = averageWeightLbsInWindow(daily, bounds.priorStartDate, bounds.priorEndDate)

  let comparisonLabel: string | null = null
  if (current.averageLbs !== null && prior.averageLbs !== null) {
    const diff = Math.round((current.averageLbs - prior.averageLbs) * 10) / 10
    comparisonLabel =
      diff === 0
        ? 'Average weight was unchanged versus the prior week'
        : diff < 0
        ? `Average weight was down ${Math.abs(diff).toFixed(1)} lbs versus the prior week`
        : `Average weight was up ${diff.toFixed(1)} lbs versus the prior week`
  }

  return {
    latestWeightLbs: inWeek.length > 0 ? inWeek[inWeek.length - 1].weightLbs : null,
    averageWeightLbs: current.averageLbs,
    priorAverageWeightLbs: prior.averageLbs,
    loggedDays: inWeek.length,
    comparisonLabel,
  }
}

export interface WeeklyNutritionSummary {
  loggedDays: number
  priorLoggedDays: number
  averageCalories: number | null
  calorieDays: number
  averageProteinGrams: number | null
  proteinDays: number
  proteinTargetMetDays: number | null
  proteinTargetEligibleDays: number | null
  comparisonLabels: string[]
}

/**
 * Weekly nutrition via Phase 2Z's own primitives — logged days from
 * meaningful entries only, averages across contributing days (missing
 * days are never zero-calorie days), adherence against the full
 * existing protein target. Comparisons require both weeks to hold at
 * least two logged days and use display rounding only.
 */
export function computeWeeklyNutrition(
  rows: RawFoodLogLike[],
  bounds: ReviewWeekBounds,
  proteinTargetGrams: number | null
): WeeklyNutritionSummary {
  const totals = buildDailyNutritionTotals(rows)
  const week = totals.filter((d) => d.date >= bounds.startDate && d.date <= bounds.endDate)
  const prior = totals.filter(
    (d) => d.date >= bounds.priorStartDate && d.date <= bounds.priorEndDate
  )

  const cal = averageAcrossLoggedDays(week, 'calories')
  const pro = averageAcrossLoggedDays(week, 'proteinGrams')
  const priorCal = averageAcrossLoggedDays(prior, 'calories')
  const priorPro = averageAcrossLoggedDays(prior, 'proteinGrams')

  const validTarget =
    proteinTargetGrams !== null && Number.isFinite(proteinTargetGrams) && proteinTargetGrams > 0
      ? proteinTargetGrams
      : null
  const eligible = week.filter((d) => d.proteinGrams !== null)
  const proteinTargetEligibleDays =
    validTarget !== null && eligible.length > 0 ? eligible.length : null
  const proteinTargetMetDays =
    validTarget !== null && proteinTargetEligibleDays !== null
      ? eligible.filter((d) => (d.proteinGrams as number) >= validTarget).length
      : null

  const comparisonLabels: string[] = []
  const comparable =
    week.length >= MIN_LOGGED_DAYS_FOR_AVERAGE && prior.length >= MIN_LOGGED_DAYS_FOR_AVERAGE
  if (comparable) {
    if (cal.average !== null && priorCal.average !== null) {
      const diff = Math.round(cal.average) - Math.round(priorCal.average)
      comparisonLabels.push(
        diff === 0
          ? 'Average calories were unchanged versus the prior week'
          : diff > 0
          ? `Average calories were up ${diff.toLocaleString()} versus the prior week`
          : `Average calories were down ${Math.abs(diff).toLocaleString()} versus the prior week`
      )
    }
    if (pro.average !== null && priorPro.average !== null) {
      const diff = Math.round(pro.average) - Math.round(priorPro.average)
      comparisonLabels.push(
        diff === 0
          ? 'Average protein was unchanged versus the prior week'
          : diff > 0
          ? `Average protein was up ${diff}g versus the prior week`
          : `Average protein was down ${Math.abs(diff)}g versus the prior week`
      )
    }
    const dayDiff = week.length - prior.length
    const noun = Math.abs(dayDiff) === 1 ? 'day' : 'days'
    comparisonLabels.push(
      dayDiff === 0
        ? 'Logging coverage was unchanged versus the prior week'
        : dayDiff > 0
        ? `Logging increased by ${dayDiff} ${noun} versus the prior week`
        : `Logging decreased by ${Math.abs(dayDiff)} ${noun} versus the prior week`
    )
  }

  return {
    loggedDays: week.length,
    priorLoggedDays: prior.length,
    averageCalories: cal.average,
    calorieDays: cal.count,
    averageProteinGrams: pro.average,
    proteinDays: pro.count,
    proteinTargetMetDays,
    proteinTargetEligibleDays,
    comparisonLabels,
  }
}

export interface RawWeeklySessionLike {
  workout_date: string
  status: string
  completed_duration_seconds: number | null
  workout_exercises: Array<{
    workout_sets: Array<{ completed: boolean; is_warmup: boolean }>
  }>
}

export interface WeeklyTrainingSummary {
  completedWorkouts: number
  skippedWorkouts: number
  completedWorkingSets: number
  /** Sum across sessions that HAVE a duration; null when none do. */
  completedDurationSeconds: number | null
}

/**
 * Factual weekly training totals: completed sessions only for the
 * workout count; completed non-warm-up sets for the working-set
 * count (workout_sets.completed — the actual schema column);
 * completed_duration_seconds summed across sessions that carry one
 * and omitted (null) when none do — never shown as a fake zero.
 * Skipped counts exist because the schema explicitly tracks
 * status='skipped'. Planned/in-progress sessions count as nothing.
 */
export function computeWeeklyTraining(
  sessions: RawWeeklySessionLike[],
  bounds: ReviewWeekBounds
): WeeklyTrainingSummary {
  const inWeek = sessions.filter(
    (s) => s.workout_date >= bounds.startDate && s.workout_date <= bounds.endDate
  )
  const completed = inWeek.filter((s) => s.status === 'completed')
  const skipped = inWeek.filter((s) => s.status === 'skipped')

  let completedWorkingSets = 0
  for (const session of completed) {
    for (const we of session.workout_exercises ?? []) {
      for (const set of we.workout_sets ?? []) {
        if (set.completed && !set.is_warmup) completedWorkingSets++
      }
    }
  }

  const durations = completed
    .map((s) => s.completed_duration_seconds)
    .filter((d): d is number => d !== null && Number.isFinite(d) && d > 0)

  return {
    completedWorkouts: completed.length,
    skippedWorkouts: skipped.length,
    completedWorkingSets,
    completedDurationSeconds:
      durations.length > 0 ? durations.reduce((sum, d) => sum + d, 0) : null,
  }
}

export interface WeeklyExerciseProgressSummary {
  improving: number
  steady: number
  declining: number
  needsData: number
  notableExercises: ExerciseProgressOverviewRow[]
}

/**
 * Up to three notable results from the already-sorted overview rows:
 * improving first (most recent session first — sortOverviewRows'
 * existing in-group order), then declining; "More data needed" rows
 * appear only when NO judged comparison exists at all. Steady rows
 * are counted but never "notable". Deterministic.
 */
export function selectNotableExercises(
  sortedRows: ExerciseProgressOverviewRow[]
): ExerciseProgressOverviewRow[] {
  const improving = sortedRows.filter((r) => r.status === 'improved')
  const declining = sortedRows.filter((r) => r.status === 'declined')
  const judgedCount = sortedRows.filter((r) => r.status !== 'needs_data').length
  if (judgedCount === 0) {
    return sortedRows.filter((r) => r.status === 'needs_data').slice(0, 3)
  }
  return [...improving, ...declining].slice(0, 3)
}

/**
 * Exercise progression for the review week: Phase 2X's own builder
 * and sorter run over the bounded lookback sessions (newest-first,
 * completed only), then narrowed to exercises whose LATEST qualifying
 * session falls inside the review week. Status stays the existing
 * latest-vs-previous representative-session comparison — the prior
 * session may predate the review week, which the UI labels "Latest
 * comparison". Never recalculated from weekly start/end values.
 */
export function computeWeeklyExerciseProgress(
  lookbackSessionsNewestFirst: RawOverviewSession[],
  bounds: ReviewWeekBounds
): WeeklyExerciseProgressSummary {
  const rows = sortOverviewRows(buildExerciseProgressOverview(lookbackSessionsNewestFirst))
  const inWeek = rows.filter(
    (r) => r.latestWorkoutDate >= bounds.startDate && r.latestWorkoutDate <= bounds.endDate
  )
  return {
    improving: inWeek.filter((r) => r.status === 'improved').length,
    steady: inWeek.filter((r) => r.status === 'same').length,
    declining: inWeek.filter((r) => r.status === 'declined').length,
    needsData: inWeek.filter((r) => r.status === 'needs_data').length,
    notableExercises: selectNotableExercises(inWeek),
  }
}

export interface WeeklyActivitySummary {
  loggedDays: number
  totalSteps: number | null
  averageSteps: number | null
}

// ── Authoritative weekly-step average (Phase 5A.3 QA correction) ──
// average daily steps = total steps across the 7-calendar-day window
// divided by 7, with missing/unlogged days counting as ZERO. The
// previous logged-days-only denominator inflated the average when
// logging was incomplete and made new entries barely move the
// number. Shared by every live weekly-step consumer (/activity and
// both summaries in this lib) so the product has exactly one
// definition; the separate "X/7 days logged" figures remain the
// completeness/confidence signal. Derives ONLY from
// daily_activity_logs — intentional activity_sessions never enter
// step aggregates.

export const STEP_WEEK_DAYS = 7

export function averageDailySteps(totalSteps: number): number {
  return Math.round(totalSteps / STEP_WEEK_DAYS)
}

/**
 * Steps only (the app's supported activity metric). The average is
 * the authoritative 7-day rule above (missing days count as zero);
 * loggedDays stays the coverage signal.
 */
export function computeWeeklyActivity(
  rows: Array<{ logged_date: string; steps: number | null }>,
  bounds: ReviewWeekBounds
): WeeklyActivitySummary {
  const seen = new Set<string>()
  let total = 0
  for (const row of rows) {
    if (row.logged_date < bounds.startDate || row.logged_date > bounds.endDate) continue
    if (row.steps === null || !Number.isFinite(row.steps) || row.steps < 0) continue
    if (seen.has(row.logged_date)) continue
    seen.add(row.logged_date)
    total += row.steps
  }
  const loggedDays = seen.size
  return {
    loggedDays,
    totalSteps: loggedDays > 0 ? total : null,
    averageSteps: loggedDays > 0 ? averageDailySteps(total) : null,
  }
}

export interface WeeklyFastingSummary {
  completedFasts: number
  totalDurationMinutes: number
  longestDurationMinutes: number | null
}

/**
 * Completed fasts only (the caller's query already requires a
 * non-null ended_at inside the review week — the existing ended-at
 * convention — so an active fast can never appear). Invalid or
 * non-positive durations are excluded.
 */
export function computeWeeklyFasting(
  fasts: Array<{ duration_minutes: number | null }>
): WeeklyFastingSummary {
  const valid = fasts
    .map((f) => f.duration_minutes)
    .filter((d): d is number => d !== null && Number.isFinite(d) && d > 0)
  return {
    completedFasts: valid.length,
    totalDurationMinutes: valid.reduce((sum, d) => sum + d, 0),
    longestDurationMinutes: valid.length > 0 ? Math.max(...valid) : null,
  }
}

// ── Confidence ───────────────────────────────────────────────────────

export type WeeklyConfidenceLevel = 'limited' | 'building' | 'strong'

export interface WeeklyConfidenceSummary {
  level: WeeklyConfidenceLevel
  label: string
  detail: string
}

function joinWithAnd(items: string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
}

/**
 * Data-completeness confidence, nothing more: fewer than two
 * sufficient core categories → limited; two or three → building; all
 * four → strong. The detail always names both the available and the
 * incomplete categories — missing data is never hidden, and the
 * user's behavior is never labeled good or bad.
 */
export function computeWeeklyConfidence(input: {
  weightLoggedDays: number
  nutritionLoggedDays: number
  completedWorkouts: number
  activityLoggedDays: number
}): WeeklyConfidenceSummary {
  const sufficiency: Array<{ name: string; sufficient: boolean }> = [
    { name: 'weight', sufficient: input.weightLoggedDays >= WEEKLY_SUFFICIENT.weightDays },
    { name: 'nutrition', sufficient: input.nutritionLoggedDays >= WEEKLY_SUFFICIENT.nutritionDays },
    { name: 'training', sufficient: input.completedWorkouts >= WEEKLY_SUFFICIENT.trainingWorkouts },
    { name: 'activity', sufficient: input.activityLoggedDays >= WEEKLY_SUFFICIENT.activityDays },
  ]
  const available = sufficiency.filter((c) => c.sufficient).map((c) => c.name)
  const incomplete = sufficiency.filter((c) => !c.sufficient).map((c) => c.name)

  const level: WeeklyConfidenceLevel =
    available.length < 2 ? 'limited' : available.length < 4 ? 'building' : 'strong'
  const label =
    level === 'limited' ? 'Limited data' : level === 'building' ? 'Building confidence' : 'Strong data'

  let detail: string
  if (incomplete.length === 0) {
    detail = 'All four categories have sufficient data.'
  } else if (available.length === 0) {
    detail = 'No category has sufficient data yet.'
  } else {
    const availableVerb = available.length === 1 ? 'is' : 'are'
    const incompleteVerb = incomplete.length === 1 ? 'is' : 'are'
    detail = `${joinWithAnd(available)} ${availableVerb} available; ${joinWithAnd(incomplete)} ${incompleteVerb} incomplete.`
  }

  return { level, label, detail }
}

// ── Next-week focus ──────────────────────────────────────────────────

export const WEEKLY_FOCUS_FALLBACK =
  'Keep logging consistently to build a clearer weekly picture.'

/**
 * Deterministic rule-based focus items — no generation, no coaching
 * formulas, no prescriptions. Candidates in priority order (spec):
 *   1. the FIRST missing-data action (category order: nutrition,
 *      weight, training, activity)
 *   2. an existing declining latest comparison
 *   3–5. the remaining nutrition / weigh-in / activity consistency
 *        gaps not already surfaced by rule 1
 *   6. positive continuation when improving comparisons exist
 * Capped at three; a justified-empty week gets the neutral fallback.
 */
export function buildWeeklyFocusItems(input: {
  weightLoggedDays: number
  nutritionLoggedDays: number
  completedWorkouts: number
  activityLoggedDays: number
  decliningExerciseNames: string[]
  improvingCount: number
}): string[] {
  const nutritionItem =
    input.nutritionLoggedDays < WEEKLY_SUFFICIENT.nutritionDays
      ? 'Log nutrition on at least four days to improve weekly confidence.'
      : null
  const weightItem =
    input.weightLoggedDays === 0
      ? 'Log a weigh-in next week to start tracking weekly weight.'
      : input.weightLoggedDays < WEEKLY_SUFFICIENT.weightDays
      ? 'Record a second weigh-in next week so weekly averages can be compared.'
      : null
  const trainingItem =
    input.completedWorkouts < WEEKLY_SUFFICIENT.trainingWorkouts
      ? 'Complete at least one workout next week to keep training data current.'
      : null
  const activityItem =
    input.activityLoggedDays < WEEKLY_SUFFICIENT.activityDays
      ? 'Log steps on at least four days for a fuller activity picture.'
      : null

  const missingDataInOrder = [nutritionItem, weightItem, trainingItem, activityItem].filter(
    (item): item is string => item !== null
  )

  const candidates: string[] = []
  // 1. First missing-data action.
  if (missingDataInOrder.length > 0) candidates.push(missingDataInOrder[0])
  // 2. Existing declining latest comparison.
  if (input.decliningExerciseNames.length > 0) {
    candidates.push(
      `Review ${input.decliningExerciseNames[0]}; its latest comparison was declining.`
    )
  }
  // 3–5. Remaining consistency gaps (skipping the one used by rule 1).
  for (const item of [nutritionItem, weightItem, activityItem]) {
    if (item !== null && !candidates.includes(item)) candidates.push(item)
  }
  // 6. Positive continuation.
  if (input.improvingCount > 0) {
    candidates.push(
      `Keep the current routine; ${input.improvingCount} exercise${
        input.improvingCount !== 1 ? 's' : ''
      } had improving latest comparisons.`
    )
  }

  if (candidates.length === 0) return [WEEKLY_FOCUS_FALLBACK]
  return candidates.slice(0, 3)
}

// ── Assembly ─────────────────────────────────────────────────────────

export interface UnifiedWeeklyReview {
  range: ReviewWeekBounds
  navigation: ReviewWeekNavigation
  confidence: WeeklyConfidenceSummary
  weight: WeeklyWeightSummary
  nutrition: WeeklyNutritionSummary
  training: WeeklyTrainingSummary
  exerciseProgress: WeeklyExerciseProgressSummary
  activity: WeeklyActivitySummary
  /** Null when fasting is disabled for this profile. */
  fasting: WeeklyFastingSummary | null
  focusItems: string[]
  hasAnyData: boolean
}

/**
 * Pure assembly over already-fetched raw rows — fully deterministic,
 * never mutates inputs, never touches authoritative data.
 */
export function assembleWeeklyReview(input: {
  todayStr: string
  weekStart: string
  weighInRows: RawWeighInLike[]
  foodLogRows: RawFoodLogLike[]
  sessionRows: Array<RawWeeklySessionLike & RawOverviewSession>
  activityRows: Array<{ logged_date: string; steps: number | null }>
  fastRows: Array<{ duration_minutes: number | null }>
  proteinTargetGrams: number | null
  fastingEnabled: boolean
}): UnifiedWeeklyReview {
  const range = reviewWeekBounds(input.weekStart)
  const navigation = reviewWeekNavigation(input.weekStart, input.todayStr)

  const weight = computeWeeklyWeight(input.weighInRows, range)
  const nutrition = computeWeeklyNutrition(input.foodLogRows, range, input.proteinTargetGrams)
  const training = computeWeeklyTraining(input.sessionRows, range)
  // Progression consumes completed sessions only — the same rule the
  // 2X builder's own query applies.
  const exerciseProgress = computeWeeklyExerciseProgress(
    input.sessionRows.filter((s) => s.status === 'completed'),
    range
  )
  const activity = computeWeeklyActivity(input.activityRows, range)
  const fasting = input.fastingEnabled ? computeWeeklyFasting(input.fastRows) : null

  const confidence = computeWeeklyConfidence({
    weightLoggedDays: weight.loggedDays,
    nutritionLoggedDays: nutrition.loggedDays,
    completedWorkouts: training.completedWorkouts,
    activityLoggedDays: activity.loggedDays,
  })

  const focusItems = buildWeeklyFocusItems({
    weightLoggedDays: weight.loggedDays,
    nutritionLoggedDays: nutrition.loggedDays,
    completedWorkouts: training.completedWorkouts,
    activityLoggedDays: activity.loggedDays,
    decliningExerciseNames: exerciseProgress.notableExercises
      .filter((r) => r.status === 'declined')
      .map((r) => r.exerciseName),
    improvingCount: exerciseProgress.improving,
  })

  const hasAnyData =
    weight.loggedDays > 0 ||
    nutrition.loggedDays > 0 ||
    training.completedWorkouts > 0 ||
    training.skippedWorkouts > 0 ||
    activity.loggedDays > 0 ||
    (fasting !== null && fasting.completedFasts > 0)

  return {
    range,
    navigation,
    confidence,
    weight,
    nutrition,
    training,
    exerciseProgress,
    activity,
    fasting,
    focusItems,
    hasAnyData,
  }
}

/**
 * The one server fetch path for the completed-week review. Query
 * inventory (all bounded, batched, authenticated — RLS unchanged):
 *   1. body_metrics   [priorStart, weekEnd]  (14 days — week + prior)
 *   2. food_logs      [priorStart, weekEnd]  (14 days)
 *   3. workout_sessions ['completed','skipped'],
 *      [weekStart - PROGRESSION_LOOKBACK_DAYS, weekEnd] — ONE query
 *      serves both training totals (week slice) and exercise
 *      progression (the lookback lets the existing latest-vs-previous
 *      comparison find the prior session; older history degrades to
 *      "More data needed", never a wrong judgment)
 *   4. daily_activity_logs [weekStart, weekEnd]
 *   5. fasting_logs completed (ended_at inside the week) — only when
 *      fasting is enabled
 * Never one query per day/exercise; never an all-time scan.
 */
export async function fetchWeeklyReviewSummary(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  todayStr: string,
  weekParam: string | string[] | undefined,
  target: NutritionTarget | null,
  fastingEnabled: boolean
): Promise<UnifiedWeeklyReview> {
  const weekStart = resolveReviewWeekStart(todayStr, weekParam)
  const bounds = reviewWeekBounds(weekStart)
  const lookbackStart = format(
    subDays(parseISO(weekStart), PROGRESSION_LOOKBACK_DAYS),
    'yyyy-MM-dd'
  )

  const [metricsRes, foodRes, sessionRes, activityRes, fastingRes] = await Promise.all([
    supabase
      .from('body_metrics')
      .select('logged_date, weight_kg, created_at')
      .eq('user_id', userId)
      .gte('logged_date', bounds.priorStartDate)
      .lte('logged_date', bounds.endDate)
      .not('weight_kg', 'is', null),

    supabase
      .from('food_logs')
      .select('logged_date, calories, protein_g, carbs_g, fat_g')
      .eq('user_id', userId)
      .gte('logged_date', bounds.priorStartDate)
      .lte('logged_date', bounds.endDate),

    supabase
      .from('workout_sessions')
      .select(`
        id, workout_date, status, completed_duration_seconds,
        workout_exercises (
          exercise_id,
          exercise:exercises ( id, name, primary_muscle, equipment, tracking_mode, unilateral ),
          workout_sets ( set_number, reps, weight_kg, rpe, is_warmup, completed, duration_seconds, distance_meters )
        )
      `)
      .eq('user_id', userId)
      .in('status', ['completed', 'skipped'])
      .gte('workout_date', lookbackStart)
      .lte('workout_date', bounds.endDate)
      .order('workout_date', { ascending: false })
      .order('created_at', { ascending: false }),

    supabase
      .from('daily_activity_logs')
      .select('logged_date, steps')
      .eq('user_id', userId)
      .gte('logged_date', bounds.startDate)
      .lte('logged_date', bounds.endDate),

    // Phase 3B correction: this query originally selected the
    // nonexistent duration_minutes column (the same schema-mismatch
    // class as the legacy workout_sets.status bug — durations are
    // derived, never persisted). It now selects the real timestamps;
    // the derived minutes are mapped at this fetch boundary so the
    // pure computeWeeklyFasting reducer's contract is unchanged.
    fastingEnabled
      ? supabase
          .from('fasting_logs')
          .select('started_at, ended_at')
          .eq('user_id', userId)
          .not('ended_at', 'is', null)
          .gte('ended_at', `${bounds.startDate}T00:00:00`)
          .lte('ended_at', `${bounds.endDate}T23:59:59.999`)
      : Promise.resolve({ data: [], error: null }),
  ])

  // Phase 3B: failures are observable (repo fetch-helper convention)
  // while the page stays stable on safe empty results.
  if (metricsRes.error)  console.error('fetchWeeklyReviewSummary (body_metrics) error:', metricsRes.error)
  if (foodRes.error)     console.error('fetchWeeklyReviewSummary (food_logs) error:', foodRes.error)
  if (sessionRes.error)  console.error('fetchWeeklyReviewSummary (workout_sessions) error:', sessionRes.error)
  if (activityRes.error) console.error('fetchWeeklyReviewSummary (daily_activity_logs) error:', activityRes.error)
  if (fastingRes.error)  console.error('fetchWeeklyReviewSummary (fasting_logs) error:', fastingRes.error)

  return assembleWeeklyReview({
    todayStr,
    weekStart,
    weighInRows: metricsRes.data ?? [],
    foodLogRows: foodRes.data ?? [],
    sessionRows: sessionRes.data ?? [],
    activityRows: activityRes.data ?? [],
    fastRows: deriveCompletedFastMinutes(
      (fastingRes.data ?? []) as RawCompletedFastRow[]
    ).map((minutes) => ({ duration_minutes: minutes })),
    proteinTargetGrams: target?.protein_g ?? null,
    fastingEnabled,
  })
}
