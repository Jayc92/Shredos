// ============================================================
// ForgeFitOS — Today Energy Balance (Phase 5B.3)
// ============================================================
// The first user-facing consumer of the Energy Balance foundation:
// assembles a clean presentation model for the Today widget from
// the 5B.1/5B.2 facts. ALL energy math lives here and below in the
// facts/model libs — the React card receives finished strings and
// numbers and performs no arithmetic.
//
// This is a TRAJECTORY widget, never an eat-back calculator:
//   - calories shown are consumed vs the ACTIVE target (the same
//     numbers the Nutrition card and Food Log show — one source)
//   - no session-calorie totals, no "calories burned today", no
//     "you earned X" (no trusted aggregate expenditure source
//     exists yet; components never sum into one)
//   - daily intake status and multi-week trajectory are SEPARATE
//     fields — today's calories never masquerade as the trend
//   - the inferred maintenance RANGE surfaces only at
//     high confidence; moderate shows a settling note; below that,
//     nothing (never a point estimate, never false precision)
//
// No recommendations: what to CHANGE remains 5B.4's job.
// ============================================================

import { differenceInCalendarDays, format, parseISO, startOfISOWeek, subDays } from 'date-fns'
import { kgToLbs } from '@/lib/units'
import { computeDailyTotals } from '@/lib/food'
import { CALORIE_ON_TRACK_RANGE } from '@/lib/coach-constants'
import { fatLossBand, GAIN_BAND } from '@/lib/goal-adjustments'
import {
  buildDailyNutritionFactsWithContext,
  deriveWeeklyWeightAnchors,
  buildActivityBaseline,
  classifyActivityContext,
} from '@/lib/energy-facts'
import type {
  ActivityContext,
  NutritionTargetVersion,
  WeightTrendFact,
} from '@/lib/energy-facts'
import {
  estimateBaselineTdee,
  buildQualifyingWeeks,
  inferAdaptiveMaintenance,
  INFERENCE_WINDOW_DAYS,
} from '@/lib/energy-model'
import type { AdaptiveMaintenanceEstimate } from '@/lib/energy-model'
import { computeEnergyConfidence } from '@/lib/coach-signals'
import type { EnergyConfidence } from '@/lib/coach-signals'
import type { FoodLog, NutritionTarget, UserProfile } from '@/types/database'

// ── Presentation model ─────────────────────────────────────────────

export type TodayCalorieState = 'no_target' | 'no_food' | 'under' | 'near' | 'over'
export type TodayTrajectoryState = 'not_enough_data' | 'on_track' | 'watching' | 'trend_only'

export interface TodayEnergyBalanceViewModel {
  /** Meaningful intake logged today; null = nothing logged (never a
   *  fabricated zero). */
  caloriesConsumed: number | null
  /** The target effective TODAY (never a historical one here). */
  calorieTarget: number | null
  calorieState: TodayCalorieState
  activityContext: ActivityContext
  trajectoryState: TodayTrajectoryState
  trajectoryLabel: string
  confidenceLevel: EnergyConfidence['level']
  /** The highest-priority missing-evidence message, or null. */
  confidenceMessage: string | null
  /** Only at high adaptive confidence — always a RANGE. */
  maintenanceRange: [number, number] | null
  /** Only at moderate adaptive confidence. */
  maintenanceNote: string | null
}

// ── Confidence copy (structured reasons -> honest sentences) ───────
// Priority order: the first matching reason produces the message.
// Copy is derived from reason codes only — never fabricated prose.

const CONFIDENCE_COPY: Array<[string, string]> = [
  ['insufficient_weight_anchors', 'Need another weekly weigh-in'],
  ['weight_trend_low_confidence', 'Need another weekly weigh-in'],
  ['nutrition_logging_incomplete', 'Mark completed food-log days to improve your estimate'],
  ['recent_target_change', 'Targets changed recently — estimates are resettling'],
  ['no_activity_baseline', 'Log steps or activity to build your baseline'],
]

export function confidenceMessageFor(reasons: string[]): string | null {
  for (const [code, copy] of CONFIDENCE_COPY) {
    if (reasons.includes(code)) return copy
  }
  return null
}

// ── Trajectory (multi-week, goal-aware, DESCRIPTIVE only) ──────────
// Reuses the 3E rate bands verbatim — no parallel engine, no
// proposal: this only names whether the multi-week trend sits inside
// the existing goal band. Goals without a supported band get an
// honest descriptive label instead of a judgment.

export function classifyTrajectory(
  goal: string | null,
  bfPct: number | null,
  trend: WeightTrendFact
): { state: TodayTrajectoryState; label: string } {
  if (trend.trendDirection === 'insufficient_data' || trend.weeklyRatePercent === null) {
    return { state: 'not_enough_data', label: 'Not enough data' }
  }
  const changePct = trend.weeklyRatePercent
  if (goal === 'fat_loss') {
    const band = fatLossBand(bfPct)
    const lossPct = -changePct
    return lossPct >= band.minPct && lossPct <= band.maxPct
      ? { state: 'on_track', label: 'On track' }
      : { state: 'watching', label: 'Watching trend' }
  }
  if (goal === 'muscle_gain' || goal === 'strength') {
    return changePct >= GAIN_BAND.minPct && changePct <= GAIN_BAND.maxPct
      ? { state: 'on_track', label: 'On track' }
      : { state: 'watching', label: 'Watching trend' }
  }
  if (goal === 'maintenance') {
    return trend.trendDirection === 'holding'
      ? { state: 'on_track', label: 'On track' }
      : { state: 'watching', label: 'Watching trend' }
  }
  // No supported band (running/recomposition/unknown): describe, never judge.
  const label =
    trend.trendDirection === 'losing' ? 'Trending down'
    : trend.trendDirection === 'gaining' ? 'Trending up'
    : 'Stable'
  return { state: 'trend_only', label }
}

// ── The pure builder ───────────────────────────────────────────────

export function buildTodayEnergyBalance(input: {
  todayCalories: number | null
  targetCalories: number | null
  goal: string | null
  bfPct: number | null
  activityContext: ActivityContext
  adaptive: AdaptiveMaintenanceEstimate
  energyConfidence: EnergyConfidence
}): TodayEnergyBalanceViewModel {
  // Daily intake state — deliberately SEPARATE from trajectory.
  let calorieState: TodayCalorieState
  if (input.targetCalories === null || !Number.isFinite(input.targetCalories) || input.targetCalories <= 0) {
    calorieState = 'no_target'
  } else if (input.todayCalories === null) {
    calorieState = 'no_food'
  } else {
    // Float-exact band-edge formulation (the 5B.1 convention).
    const deviation = Math.abs(input.todayCalories - input.targetCalories) / input.targetCalories
    calorieState = deviation <= CALORIE_ON_TRACK_RANGE
      ? 'near'
      : input.todayCalories > input.targetCalories ? 'over' : 'under'
  }

  const trajectory = classifyTrajectory(input.goal, input.bfPct, input.adaptive.weightTrend)

  return {
    caloriesConsumed: input.todayCalories,
    calorieTarget: input.targetCalories !== null && Number.isFinite(input.targetCalories) && input.targetCalories > 0
      ? input.targetCalories : null,
    calorieState,
    activityContext: input.activityContext,
    trajectoryState: trajectory.state,
    trajectoryLabel: trajectory.label,
    confidenceLevel: input.energyConfidence.level,
    confidenceMessage: confidenceMessageFor(input.energyConfidence.reasons),
    maintenanceRange:
      input.adaptive.status === 'high_confidence'
        ? input.adaptive.estimatedMaintenanceRange
        : null,
    maintenanceNote:
      input.adaptive.status === 'moderate_confidence'
        ? 'Maintenance estimate is still settling'
        : null,
  }
}

// ── Server fetch (bounded, availability-degrading) ─────────────────
// Reuses the dashboard's already-fetched profile/target/today logs.
// Adds five bounded reads (never all-time scans): window food_logs,
// nutrition_day_status, nutrition_targets history, body_metrics
// (9 weeks for anchors), daily activity + sessions (28-day
// baseline). A failed read degrades to empty evidence — the model
// then honestly reports insufficient data rather than erroring
// Today.

export async function fetchTodayEnergyBalance(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  todayStr: string,
  target: NutritionTarget | null,
  profile: UserProfile,
  todayFoodLogs: FoodLog[]
): Promise<TodayEnergyBalanceViewModel> {
  const windowStart = format(
    subDays(startOfISOWeek(parseISO(todayStr)), 21), 'yyyy-MM-dd')
  const weighStart = format(subDays(parseISO(todayStr), 62), 'yyyy-MM-dd')
  const activityStart = format(
    subDays(parseISO(todayStr), INFERENCE_WINDOW_DAYS - 1), 'yyyy-MM-dd')

  const [foodRes, statusRes, targetsRes, weighRes, stepsRes, workoutRes, sessionRes] =
    await Promise.all([
      supabase.from('food_logs')
        .select('logged_date, calories, protein_g, carbs_g, fat_g')
        .eq('user_id', userId)
        .gte('logged_date', windowStart).lte('logged_date', todayStr),
      supabase.from('nutrition_day_status')
        .select('logged_date')
        .eq('user_id', userId)
        .gte('logged_date', windowStart).lte('logged_date', todayStr),
      supabase.from('nutrition_targets')
        .select('effective_date, calories')
        .eq('user_id', userId)
        .lte('effective_date', todayStr)
        .order('effective_date', { ascending: false })
        .limit(12),
      supabase.from('body_metrics')
        .select('logged_date, weight_kg, created_at')
        .eq('user_id', userId)
        .gte('logged_date', weighStart).lte('logged_date', todayStr)
        .not('weight_kg', 'is', null),
      supabase.from('daily_activity_logs')
        .select('logged_date, steps')
        .eq('user_id', userId)
        .gte('logged_date', activityStart).lte('logged_date', todayStr),
      supabase.from('workout_sessions')
        .select('workout_date, completed_duration_seconds')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('workout_date', activityStart).lte('workout_date', todayStr),
      supabase.from('activity_sessions')
        .select('activity_date, duration_seconds')
        .eq('user_id', userId)
        .gte('activity_date', activityStart).lte('activity_date', todayStr),
    ])

  for (const [name, res] of [
    ['food_logs', foodRes], ['nutrition_day_status', statusRes],
    ['nutrition_targets', targetsRes], ['body_metrics', weighRes],
    ['daily_activity_logs', stepsRes], ['workout_sessions', workoutRes],
    ['activity_sessions', sessionRes],
  ] as const) {
    if (res.error) console.error(`fetchTodayEnergyBalance (${name}) error:`, res.error)
  }

  // Facts assembly through the 5B.1/5B.2 layers.
  const targetHistory: NutritionTargetVersion[] = targetsRes.data ?? []
  const explicitDates = new Set<string>(
    (statusRes.data ?? []).map((r: { logged_date: string }) => r.logged_date))
  const nutritionFacts = buildDailyNutritionFactsWithContext(
    foodRes.data ?? [], windowStart, todayStr,
    { targetHistory, explicitCompleteDates: explicitDates })
  const anchors = deriveWeeklyWeightAnchors(weighRes.data ?? [], todayStr)

  const stepDays = (stepsRes.data ?? []) as Array<{ logged_date: string; steps: number | null }>
  const sessions = [
    ...((workoutRes.data ?? []) as Array<{ workout_date: string; completed_duration_seconds: number | null }>)
      .filter((w) => w.completed_duration_seconds !== null && w.completed_duration_seconds > 0)
      .map((w) => ({ date: w.workout_date, durationSeconds: w.completed_duration_seconds as number })),
    ...((sessionRes.data ?? []) as Array<{ activity_date: string; duration_seconds: number }>)
      .map((s) => ({ date: s.activity_date, durationSeconds: s.duration_seconds })),
  ]
  const activityBaseline = buildActivityBaseline({ stepDays, sessions }, todayStr)
  const todaySteps = stepDays.find((d) => d.logged_date === todayStr)?.steps ?? null
  const activityContext = classifyActivityContext(todaySteps, activityBaseline.medianDailySteps)

  // Baseline TDEE anchor: latest weigh-in first, profile fallback.
  const latestWeighKg = (weighRes.data ?? [])
    .slice()
    .sort((a: { logged_date: string }, b: { logged_date: string }) =>
      b.logged_date.localeCompare(a.logged_date))[0]?.weight_kg ?? null
  const weightLbs = latestWeighKg !== null
    ? kgToLbs(latestWeighKg)
    : profile.current_weight_kg !== null ? kgToLbs(profile.current_weight_kg) : null
  const baseline = estimateBaselineTdee({
    weightLbs: weightLbs ?? 0,
    activityLevel: profile.activity_level ?? 'moderately_active',
    sex: profile.sex,
    age: profile.age,
    heightCm: profile.height_cm,
    bfPct: profile.bf_pct,
  })

  const daysSinceTargetChange = target
    ? differenceInCalendarDays(parseISO(todayStr), parseISO(target.effective_date))
    : null
  const weeks = buildQualifyingWeeks({ nutritionFacts, anchors, endDate: todayStr })
  const adaptive = inferAdaptiveMaintenance({ baseline, weeks, daysSinceTargetChange })

  const energyConfidence = computeEnergyConfidence({
    nutritionFacts,
    weightTrend: adaptive.weightTrend,
    activityBaseline,
    daysSinceTargetChange,
  })

  // Today's consumed calories: the SAME computation the Nutrition
  // card and Food Log use, so Today never shows two disagreeing
  // numbers. Zero rows -> null (nothing logged), never a fake 0.
  const todayCalories = todayFoodLogs.length > 0
    ? computeDailyTotals(todayFoodLogs, todayStr).calories
    : null

  return buildTodayEnergyBalance({
    todayCalories,
    targetCalories: target?.calories ?? null,
    goal: profile.main_goal,
    bfPct: profile.bf_pct,
    activityContext,
    adaptive,
    energyConfidence,
  })
}
