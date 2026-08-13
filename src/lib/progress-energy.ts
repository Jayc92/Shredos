// ============================================================
// ForgeFitOS — Progress Energy & Adherence Trends (Phase 5B.5)
// ============================================================
// Read-only visualization aggregation over the STABLE 5B evidence —
// this file builds view models for the Progress "Energy & adherence"
// section and nothing else. It creates no second energy model:
// completion semantics, weekly anchors, target history, trend
// regression, activity context, goal bands, and adaptive maintenance
// all come from the 5B.1–5B.4 helpers verbatim.
//
// Honesty rules carried through every point:
//   - explicit completion preferred, heuristic fallback only,
//     partial/missing days NEVER enter intake averages
//   - a missing day is never zero calories; a week with no
//     qualifying days is a GAP, not a low point
//   - every qualifying day is compared against the target that was
//     active ON THAT DATE (the per-date resolution the facts builder
//     already performs); the weekly comparison target is the
//     day-weighted average over the SAME qualifying dates as the
//     intake average — never a single week-end resolution applied
//     to earlier days, and never fabricated when no days qualify.
//     The active-at-week-end target is kept as a SEPARATE timeline
//     field and is never used for intake comparison.
//   - one weigh-in per week is a valid (single-quality) anchor;
//     missing weeks stay gaps at real week spacing
//   - session calories never enter any chart math (durations are
//     only used by the activity baseline); there is no total-burn
//     field anywhere in the view model
//   - nothing here mutates data
// ============================================================

import { addDays, format, parseISO, subDays } from 'date-fns'
import { kgToLbs } from '@/lib/units'
import { latestCompletedWeekStart } from '@/lib/weekly-review'
import { MIN_RELIABLE_LOGGED_DAYS } from '@/lib/coach-constants'
import type { RawFoodLogLike } from '@/lib/nutrition-trends'
import type { RawWeighInLike } from '@/lib/weight-trends'
import {
  buildDailyNutritionFactsWithContext,
  resolveTargetForDate,
  deriveWeeklyWeightAnchors,
  computeWeightTrend,
  buildActivityBaseline,
  classifyActivityContext,
} from '@/lib/energy-facts'
import type {
  ActivityContext,
  DailyNutritionFact,
  NutritionTargetVersion,
  WeightTrendFact,
  WeeklyWeightAnchor,
} from '@/lib/energy-facts'
import {
  estimateBaselineTdee,
  buildQualifyingWeeks,
  inferAdaptiveMaintenance,
} from '@/lib/energy-model'
import type { AdaptiveMaintenanceEstimate } from '@/lib/energy-model'
import { classifyTrajectory } from '@/lib/today-energy'
import type { UserProfile, NutritionTarget } from '@/types/database'

// ── Named product constants ────────────────────────────────────────

export const ENERGY_RANGE_OPTIONS = [4, 8, 12] as const
export type EnergyRangeWeeks = (typeof ENERGY_RANGE_OPTIONS)[number]
export const DEFAULT_ENERGY_RANGE_WEEKS: EnergyRangeWeeks = 8
/** Qualifying days per week below which an intake point is marked
 *  low-confidence (the standing reliable-days rule, 4). Zero
 *  qualifying days is a gap, never a point. */
export const WEEK_CONFIDENT_DAYS = MIN_RELIABLE_LOGGED_DAYS

/** ?range= parser: only the supported ranges, default 8. */
export function parseEnergyRange(raw: string | string[] | undefined): EnergyRangeWeeks {
  const candidate = Array.isArray(raw) ? raw[0] : raw
  const n = Number(candidate)
  return (ENERGY_RANGE_OPTIONS as readonly number[]).includes(n)
    ? (n as EnergyRangeWeeks)
    : DEFAULT_ENERGY_RANGE_WEEKS
}

// ── View model ─────────────────────────────────────────────────────

export interface WeeklyIntakePoint {
  /** Monday of the ISO week (established app convention). */
  weekStart: string
  /** Compact axis label, e.g. "Jul 27". */
  label: string
  /** Mean intake across qualifying complete days; null = gap. */
  averageIntakeCalories: number | null
  /** INTAKE-COMPARISON target: the day-weighted average of the
   *  historically correct per-date targets of the SAME qualifying
   *  days that produced averageIntakeCalories. Null when no days
   *  qualify (a comparison target is never fabricated) or when any
   *  qualifying day predates the first target version. */
  averageTargetCalories: number | null
  /** TARGET-HISTORY timeline only: the version active at the week's
   *  end date. Never used for intake comparison — a mid-week change
   *  means earlier qualifying days were governed by the older
   *  version, which averageTargetCalories accounts for. */
  activeTargetAtWeekEnd: number | null
  qualifyingDays: number
  explicitDays: number
  heuristicDays: number
  /** Distinct target versions among the qualifying days. */
  targetVersionCount: number
  /** More than one version governed this week's qualifying days. */
  hasTargetTransition: boolean
  /** First/last qualifying-day targets for transition disclosure. */
  targetTransition: { fromCalories: number; toCalories: number } | null
  /** 1..3 qualifying days: shown, but visually low-confidence. */
  lowConfidence: boolean
}

export interface WeeklyAnchorPoint {
  weekStart: string
  label: string
  anchorLbs: number
  quality: 'single' | 'multi'
  contributingDates: number
}

export interface ProgressEnergyViewModel {
  rangeWeeks: EnergyRangeWeeks
  rangeLabel: string
  /** Every ISO week in range, oldest → newest (gaps included). */
  intakeWeeks: WeeklyIntakePoint[]
  /** Anchored weeks only — missing weeks are honest gaps the chart
   *  renders as empty slots at real spacing. */
  weightAnchors: WeeklyAnchorPoint[]
  weightTrend: WeightTrendFact
  /** Descriptive band classification via the stable 3E bands. */
  trajectory: { state: string; label: string }
  summary: {
    weightTrajectory: string
    calorieAdherence: string
    loggingCoverage: string
    activity: string
    maintenance: string
  }
  activity: {
    context: ActivityContext
    baselineMedianSteps: number | null
    recentWeekAvgSteps: number | null
  }
  maintenance: {
    status: AdaptiveMaintenanceEstimate['status'] | 'unavailable'
    range: [number, number] | null
    note: string
  }
  /** Deterministic plain-language interpretation — no reason codes,
   *  no new recommendations (the Coach review owns decisions). */
  interpretation: string[]
}

// ── Pure aggregation ───────────────────────────────────────────────

export interface ProgressEnergyInputs {
  todayStr: string
  rangeWeeks: EnergyRangeWeeks
  goal: string | null
  bfPct: number | null
  target: { calories: number; effective_date: string } | null
  foodRows: RawFoodLogLike[]
  targetHistory: NutritionTargetVersion[]
  explicitCompleteDates: ReadonlySet<string>
  weighRows: RawWeighInLike[]
  stepDays: Array<{ logged_date: string; steps: number | null }>
  sessions: Array<{ date: string; durationSeconds: number }>
  adaptive: AdaptiveMaintenanceEstimate | null
}

function isoWeeksInRange(todayStr: string, rangeWeeks: number): string[] {
  const latest = latestCompletedWeekStart(todayStr)
  const weeks: string[] = []
  for (let i = rangeWeeks - 1; i >= 0; i--) {
    weeks.push(format(subDays(parseISO(latest), i * 7), 'yyyy-MM-dd'))
  }
  return weeks
}

function weekLabel(weekStart: string): string {
  return format(parseISO(weekStart), 'MMM d')
}

/** Qualifying = complete (explicit preferred, heuristic fallback)
 *  with recorded calories. Partial/missing days are structurally
 *  absent from this list — they can never drag an average down. */
function qualifyingFacts(facts: DailyNutritionFact[]): DailyNutritionFact[] {
  return facts.filter(
    (f) =>
      (f.completeness === 'explicit_complete' || f.completeness === 'likely_complete') &&
      f.calories !== null
  )
}

export function buildProgressEnergyTrends(input: ProgressEnergyInputs): ProgressEnergyViewModel {
  const weeks = isoWeeksInRange(input.todayStr, input.rangeWeeks)
  const rangeStart = weeks[0]
  const rangeEnd = format(addDays(parseISO(weeks[weeks.length - 1]), 6), 'yyyy-MM-dd')

  // One facts pass over the whole range — historical targets resolved
  // per date inside the context builder.
  const facts = buildDailyNutritionFactsWithContext(
    input.foodRows, rangeStart, rangeEnd,
    {
      targetHistory: input.targetHistory,
      explicitCompleteDates: input.explicitCompleteDates,
    }
  )
  const factsByWeek = new Map<string, DailyNutritionFact[]>()
  for (const f of facts) {
    const ws = weeks.find((w) => f.date >= w && f.date <= format(addDays(parseISO(w), 6), 'yyyy-MM-dd'))
    if (!ws) continue
    const list = factsByWeek.get(ws) ?? []
    list.push(f)
    factsByWeek.set(ws, list)
  }

  const intakeWeeks: WeeklyIntakePoint[] = weeks.map((weekStart) => {
    const weekEnd = format(addDays(parseISO(weekStart), 6), 'yyyy-MM-dd')
    const weekFacts = factsByWeek.get(weekStart) ?? []
    const qualifying = qualifyingFacts(weekFacts)
    const explicitDays = qualifying.filter((f) => f.completeness === 'explicit_complete').length
    const heuristicDays = qualifying.length - explicitDays
    const averageIntakeCalories = qualifying.length > 0
      ? Math.round(qualifying.reduce((s, f) => s + (f.calories as number), 0) / qualifying.length)
      : null
    // Intake-comparison target: each qualifying day carries the
    // target the facts builder resolved FOR THAT DATE — the weekly
    // comparison is their day-weighted average over exactly the same
    // population as the intake average. Never resolved once at week
    // end; never fabricated when no days qualify.
    const dayTargets = qualifying.map((f) => f.targetCalories)
    const allTargetsKnown = dayTargets.length > 0 && dayTargets.every((t) => t !== null)
    const averageTargetCalories = allTargetsKnown
      ? Math.round(
          (dayTargets as number[]).reduce((s, t) => s + t, 0) / dayTargets.length)
      : null
    const targetVersionCount = new Set(dayTargets.filter((t) => t !== null)).size
    const hasTargetTransition = targetVersionCount > 1
    return {
      weekStart,
      label: weekLabel(weekStart),
      averageIntakeCalories,
      averageTargetCalories,
      // Timeline field only (when each version became effective) —
      // rendered as history, never compared against intake.
      activeTargetAtWeekEnd: resolveTargetForDate(input.targetHistory, weekEnd)?.calories ?? null,
      qualifyingDays: qualifying.length,
      explicitDays,
      heuristicDays,
      targetVersionCount,
      hasTargetTransition,
      targetTransition: hasTargetTransition
        ? {
            fromCalories: qualifying[0].targetCalories as number,
            toCalories: qualifying[qualifying.length - 1].targetCalories as number,
          }
        : null,
      lowConfidence: qualifying.length > 0 && qualifying.length < WEEK_CONFIDENT_DAYS,
    }
  })

  // Weight anchors + trend through the stable helpers (single-reading
  // weeks valid, real spacing, regression only at >= 3 anchors).
  const anchors: WeeklyWeightAnchor[] = deriveWeeklyWeightAnchors(
    input.weighRows, rangeEnd, input.rangeWeeks
  ).filter((a) => a.weekStart >= rangeStart)
  const weightTrend = computeWeightTrend(anchors)
  const weightAnchors: WeeklyAnchorPoint[] = anchors.map((a) => ({
    weekStart: a.weekStart,
    label: weekLabel(a.weekStart),
    anchorLbs: a.anchorLbs,
    quality: a.quality,
    contributingDates: a.contributingDates,
  }))
  const trajectory = classifyTrajectory(input.goal, input.bfPct, weightTrend)

  // Activity: current context relative to the user's OWN baseline.
  const baseline = buildActivityBaseline(
    { stepDays: input.stepDays, sessions: input.sessions }, input.todayStr)
  const lastWeekStart = weeks[weeks.length - 1]
  const lastWeekEnd = format(addDays(parseISO(lastWeekStart), 6), 'yyyy-MM-dd')
  const recentRecorded = input.stepDays
    .filter((d) => d.logged_date >= lastWeekStart && d.logged_date <= lastWeekEnd)
    .filter((d) => d.steps !== null && Number.isFinite(d.steps))
    .map((d) => d.steps as number)
  const recentWeekAvgSteps = recentRecorded.length > 0
    ? Math.round(recentRecorded.reduce((s, v) => s + v, 0) / recentRecorded.length)
    : null
  const activityContext = classifyActivityContext(recentWeekAvgSteps, baseline.medianDailySteps)

  // Maintenance: the CURRENT stable estimate only — no historical
  // series (deriving one as-of past weeks risks future-data leakage;
  // an honest current summary beats a misleading time series).
  const adaptiveStatus = input.adaptive?.status ?? 'unavailable'
  const maintenanceRange =
    input.adaptive?.status === 'high_confidence'
      ? input.adaptive.estimatedMaintenanceRange
      : null
  const maintenanceNote =
    adaptiveStatus === 'high_confidence' && maintenanceRange
      ? `Estimated maintenance: ${maintenanceRange[0].toLocaleString()}–${maintenanceRange[1].toLocaleString()} kcal/day`
      : adaptiveStatus === 'moderate_confidence'
      ? 'Maintenance estimate is still settling'
      : adaptiveStatus === 'observing'
      ? 'Watching your first qualifying weeks'
      : 'Needs more completed food-log days and weekly weigh-ins'

  // ── Summary strip (honest states, never zero-filled) ─────────────
  // Adherence compares the intake average against the day-weighted
  // target average of the SAME qualifying dates — never the current,
  // week-start, or week-end target.
  const latestConfident = [...intakeWeeks].reverse()
    .find((w) => w.averageIntakeCalories !== null && !w.lowConfidence)
  let calorieAdherence = 'Not enough completed days'
  if (latestConfident && latestConfident.averageTargetCalories) {
    const deviation =
      Math.abs(latestConfident.averageIntakeCalories! - latestConfident.averageTargetCalories) /
      latestConfident.averageTargetCalories
    calorieAdherence = deviation <= 0.1
      ? 'Near target'
      : latestConfident.averageIntakeCalories! > latestConfident.averageTargetCalories
      ? 'Above target' : 'Below target'
  }
  const latestWeek = intakeWeeks[intakeWeeks.length - 1]
  const summary = {
    weightTrajectory: weightTrend.weeklyRateLb !== null
      ? `${weightTrend.weeklyRateLb > 0 ? '+' : ''}${weightTrend.weeklyRateLb} lb/week`
      : 'Not enough weigh-ins yet',
    calorieAdherence,
    loggingCoverage: `${latestWeek.qualifyingDays} of 7 days complete`,
    activity:
      activityContext === 'low' ? 'Below your usual level'
      : activityContext === 'normal' ? 'Near your usual level'
      : activityContext === 'high' ? 'Above your usual level'
      : 'Not enough history',
    maintenance:
      adaptiveStatus === 'high_confidence' && maintenanceRange
        ? `${maintenanceRange[0].toLocaleString()}–${maintenanceRange[1].toLocaleString()} kcal/day`
        : adaptiveStatus === 'moderate_confidence' ? 'Still settling'
        : 'Needs more evidence',
  }

  // ── Deterministic interpretation (plain language, no codes, no
  // new recommendations — decisions stay with the Coach review) ─────
  const interpretation: string[] = []
  const confidentWeeks = intakeWeeks.filter(
    (w) => w.averageIntakeCalories !== null && !w.lowConfidence).length
  if (confidentWeeks === 0) {
    interpretation.push(
      'Logging coverage is still sparse, so this view is not treating the apparent intake average as confirmed under-eating — mark days as finished to build reliable adherence evidence.'
    )
  } else if (calorieAdherence === 'Near target') {
    interpretation.push(
      'Your completed food-log days are generally near target.'
    )
  } else if (calorieAdherence !== 'Not enough completed days') {
    interpretation.push(
      `Your completed food-log days have averaged ${calorieAdherence.toLowerCase()} — the trend below shows how that lines up with your weight.`
    )
  }
  if (weightTrend.trendDirection === 'insufficient_data') {
    interpretation.push(
      'Another weekly weigh-in will make the weight trajectory more reliable — one per week is enough.'
    )
  } else if (trajectory.state === 'on_track') {
    interpretation.push(
      'The weekly weight trend is inside the expected range for your goal.'
    )
  } else if (trajectory.state === 'watching') {
    interpretation.push(
      'The weekly weight trend is outside the expected range for your goal — the adjustment review on the Nutrition page weighs whether a change is warranted.'
    )
  }

  return {
    rangeWeeks: input.rangeWeeks,
    rangeLabel: `${weekLabel(rangeStart)} – ${format(parseISO(rangeEnd), 'MMM d')}`,
    intakeWeeks,
    weightAnchors,
    weightTrend,
    trajectory,
    summary,
    activity: {
      context: activityContext,
      baselineMedianSteps: baseline.medianDailySteps,
      recentWeekAvgSteps,
    },
    maintenance: { status: adaptiveStatus, range: maintenanceRange, note: maintenanceNote },
    interpretation,
  }
}

// ── Server fetch (bounded to the range + baseline lookback) ────────

export async function fetchProgressEnergyTrends(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  todayStr: string,
  rangeWeeks: EnergyRangeWeeks,
  target: NutritionTarget | null,
  profile: UserProfile
): Promise<ProgressEnergyViewModel> {
  const weeks = isoWeeksInRange(todayStr, rangeWeeks)
  const rangeStart = weeks[0]
  const rangeEnd = format(addDays(parseISO(weeks[weeks.length - 1]), 6), 'yyyy-MM-dd')
  const activityStart = format(subDays(parseISO(todayStr), 27), 'yyyy-MM-dd')
  // Adaptive window: 4 ISO weeks ending at the latest completed week.
  const adaptiveStart = format(subDays(parseISO(weeks[weeks.length - 1]), 21), 'yyyy-MM-dd')
  const foodStart = adaptiveStart < rangeStart ? adaptiveStart : rangeStart

  const [foodRes, statusRes, targetsRes, weighRes, stepsRes, workoutRes, sessionRes] =
    await Promise.all([
      supabase.from('food_logs')
        .select('logged_date, calories, protein_g, carbs_g, fat_g')
        .eq('user_id', userId)
        .gte('logged_date', foodStart).lte('logged_date', rangeEnd),
      supabase.from('nutrition_day_status')
        .select('logged_date')
        .eq('user_id', userId)
        .gte('logged_date', foodStart).lte('logged_date', rangeEnd),
      supabase.from('nutrition_targets')
        .select('effective_date, calories')
        .eq('user_id', userId)
        .lte('effective_date', rangeEnd)
        .order('effective_date', { ascending: false })
        .limit(24),
      supabase.from('body_metrics')
        .select('logged_date, weight_kg, created_at')
        .eq('user_id', userId)
        .gte('logged_date', rangeStart).lte('logged_date', rangeEnd)
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
    if (res.error) console.error(`fetchProgressEnergyTrends (${name}) error:`, res.error)
  }

  const explicitCompleteDates = new Set<string>(
    (statusRes.data ?? []).map((r: { logged_date: string }) => r.logged_date))
  const targetHistory = (targetsRes.data ?? []) as NutritionTargetVersion[]
  const stepDays = (stepsRes.data ?? []) as Array<{ logged_date: string; steps: number | null }>
  const sessions = [
    ...((workoutRes.data ?? []) as Array<{ workout_date: string; completed_duration_seconds: number | null }>)
      .filter((w) => w.completed_duration_seconds !== null && w.completed_duration_seconds > 0)
      .map((w) => ({ date: w.workout_date, durationSeconds: w.completed_duration_seconds as number })),
    ...((sessionRes.data ?? []) as Array<{ activity_date: string; duration_seconds: number }>)
      .map((s) => ({ date: s.activity_date, durationSeconds: s.duration_seconds })),
  ]

  // Current adaptive maintenance through the stable 5B.2 pipeline.
  const adaptiveFacts = buildDailyNutritionFactsWithContext(
    foodRes.data ?? [], adaptiveStart, rangeEnd,
    { targetHistory, explicitCompleteDates })
  const adaptiveAnchors = deriveWeeklyWeightAnchors(weighRes.data ?? [], rangeEnd, 8)
  const latestAnchorLbs = adaptiveAnchors[adaptiveAnchors.length - 1]?.anchorLbs ?? null
  const baselineWeightLbs = latestAnchorLbs ??
    (profile.current_weight_kg !== null ? kgToLbs(profile.current_weight_kg) : null)
  const adaptive = baselineWeightLbs !== null
    ? inferAdaptiveMaintenance({
        baseline: estimateBaselineTdee({
          weightLbs: baselineWeightLbs,
          activityLevel: profile.activity_level ?? 'moderately_active',
          sex: profile.sex,
          age: profile.age,
          heightCm: profile.height_cm,
          bfPct: profile.bf_pct,
        }),
        weeks: buildQualifyingWeeks({
          nutritionFacts: adaptiveFacts,
          anchors: adaptiveAnchors,
          endDate: rangeEnd,
        }),
        daysSinceTargetChange: target
          ? Math.max(0, Math.round(
              (parseISO(todayStr).getTime() - parseISO(target.effective_date).getTime()) / 86_400_000))
          : null,
      })
    : null

  return buildProgressEnergyTrends({
    todayStr,
    rangeWeeks,
    goal: profile.main_goal,
    bfPct: profile.bf_pct,
    target: target ? { calories: target.calories, effective_date: target.effective_date } : null,
    foodRows: foodRes.data ?? [],
    targetHistory,
    explicitCompleteDates,
    weighRows: weighRes.data ?? [],
    stepDays,
    sessions,
    adaptive,
  })
}
