// ============================================================
// ForgeFitOS — Energy Facts (Phase 5B.1)
// ============================================================
// Pure, deterministic facts over EXISTING tables — the bottom layer
// of the Energy Balance + Adaptive Coach foundation:
//
//   RAW ROWS -> facts (this file) -> signals (coach-signals) ->
//   [future 5B.4] recommendations -> user decision -> follow-through
//
// Nothing here is persisted, nothing writes, nothing recommends.
// Every function is a pure function of its inputs (no queries, no
// Date.now(), no mutation), so the harness exercises everything at
// runtime with fixtures.
//
// Reuse, never re-derive:
//   nutrition day totals + meaningful entries -> 2Z
//     buildDailyNutritionTotals (all-zero placeholder rows never
//     create logged days; entryCount counts meaningful entries)
//   one-weight-per-local-date dedup -> 2Y dedupeDailyWeights
//   on-track band -> coach-constants CALORIE_ON_TRACK_RANGE
//
// Local-date semantics throughout: 'YYYY-MM-DD' strings compared
// lexically, date-fns parseISO/format (no UTC drift).
// ============================================================

import { addDays, differenceInCalendarDays, format, parseISO, startOfISOWeek, subDays } from 'date-fns'
import { buildDailyNutritionTotals } from '@/lib/nutrition-trends'
import type { RawFoodLogLike } from '@/lib/nutrition-trends'
import { dedupeDailyWeights } from '@/lib/weight-trends'
import type { RawWeighInLike } from '@/lib/weight-trends'
import { CALORIE_ON_TRACK_RANGE } from '@/lib/coach-constants'

// ── Named product thresholds (centralized — no scattered magic) ────
// PROVISIONAL completeness heuristic (approved D5 refinement): this
// classifies "likely" completeness from evidence only. It is NEVER
// authoritative evidence for changing calories, and once 5B.2 ships
// the explicit "Finished logging today" signal (nutrition_day_status,
// migration 019), user-marked completion becomes the preferred
// high-confidence signal — the heuristic remains only as fallback
// context and for historical days that predate the explicit feature.
// A heuristic "likely_complete" is never equivalent to an explicit
// user completion.

export const COMPLETENESS_MIN_CALORIES = 800
export const COMPLETENESS_TARGET_FRACTION = 0.45
export const COMPLETENESS_MIN_ENTRIES = 2

/** Rolling window for the user-relative activity baseline. */
export const ACTIVITY_BASELINE_DAYS = 28
/** Recorded (non-NULL) step days required before a step baseline exists. */
export const ACTIVITY_BASELINE_MIN_STEP_DAYS = 7
// Product thresholds, not physiological truths: context is relative
// to the user's OWN baseline (an 8k-step user's 4k day and a
// 15k-step user's 8k day should both read "low").
export const ACTIVITY_LOW_RATIO = 0.7
export const ACTIVITY_HIGH_RATIO = 1.3

/** Weekly anchors required before a multi-week trend is meaningful. */
export const MIN_ANCHORS_FOR_TREND = 3
// Direction thresholds mirror the 1F nutrition-coach convention
// (losing at -0.1 lb/wk, gaining at +0.2 lb/wk — asymmetric on
// purpose: small downward drift matters sooner while cutting).
export const WEIGHT_TREND_LOSING_LB_PER_WEEK = -0.1
export const WEIGHT_TREND_GAINING_LB_PER_WEEK = 0.2
/** Regression fit gate: mean |residual| at or under this reads as a
 *  consistent trend despite normal water-weight noise. */
export const TREND_GOOD_FIT_MAX_MEAN_RESIDUAL_LB = 0.75

// ── Daily nutrition facts ──────────────────────────────────────────

// Phase 5B.2: 'explicit_complete' joins the vocabulary — the user
// marked the day finished (nutrition_day_status row). The evidence
// hierarchy is explicit_complete > likely_complete > partial >
// missing; a heuristic likely_complete is NEVER equivalent to an
// explicit completion.
export type NutritionDayCompleteness =
  | 'missing' | 'partial' | 'likely_complete' | 'explicit_complete'
export type NutritionDayAdherence = 'under' | 'near' | 'over'

export interface DailyNutritionFact {
  date: string
  calories: number | null
  proteinG: number | null
  carbsG: number | null
  fatG: number | null
  /** Meaningful entries only (2Z rule — placeholder rows excluded). */
  meaningfulEntries: number
  targetCalories: number | null
  completeness: NutritionDayCompleteness
  /** Target-relative context; classified ONLY on complete days
   *  with a target — a partial day's "under" would be meaningless. */
  adherence: NutritionDayAdherence | null
  /** True when the user explicitly marked the day complete (5B.2).
   *  Kept separate from `completeness` so an explicit mark on a day
   *  with no logged intake is visible without fabricating intake. */
  explicitComplete: boolean
}

/** The provisional heuristic (see header): enough calories relative
 *  to the target AND enough meaningful entries to plausibly be a
 *  full day of logging. */
export function classifyNutritionDayCompleteness(
  calories: number | null,
  meaningfulEntries: number,
  targetCalories: number | null
): NutritionDayCompleteness {
  if (calories === null || meaningfulEntries === 0) return 'missing'
  const floor = targetCalories !== null && Number.isFinite(targetCalories) && targetCalories > 0
    ? Math.max(COMPLETENESS_MIN_CALORIES, targetCalories * COMPLETENESS_TARGET_FRACTION)
    : COMPLETENESS_MIN_CALORIES
  if (calories >= floor && meaningfulEntries >= COMPLETENESS_MIN_ENTRIES) {
    return 'likely_complete'
  }
  return 'partial'
}

// ── Historical target resolution (Phase 5B.2) ──────────────────────
// nutrition_targets is versioned by effective_date; the target that
// governed a given day is the LATEST version whose effective_date is
// on or before that day. Today's target is never applied
// retroactively across an inference window, and days before the
// first version have no target context (null — the interpretation
// honestly reflects the missing target, it is never guessed).

export interface NutritionTargetVersion {
  effective_date: string
  calories: number
  protein_g?: number
  fat_g?: number
  carbs_g?: number
}

export function resolveTargetForDate<T extends { effective_date: string }>(
  history: T[],
  date: string
): T | null {
  let best: T | null = null
  for (const version of history) {
    if (version.effective_date > date) continue
    if (best === null || version.effective_date > best.effective_date) {
      best = version
    }
  }
  return best
}

interface BuildFactsContext {
  /** Versioned target history; resolved per day. */
  targetHistory?: NutritionTargetVersion[]
  /** Flat fallback target when no history is supplied (5B.1 path). */
  flatTargetCalories?: number | null
  /** Local dates the user explicitly marked complete (5B.2). */
  explicitCompleteDates?: ReadonlySet<string>
}

function buildFactsCore(
  rows: RawFoodLogLike[],
  startDate: string,
  endDate: string,
  context: BuildFactsContext
): DailyNutritionFact[] {
  const totalsByDate = new Map(
    buildDailyNutritionTotals(rows).map((t) => [t.date, t])
  )
  const explicitDates = context.explicitCompleteDates ?? new Set<string>()
  const facts: DailyNutritionFact[] = []
  let cursor = parseISO(startDate)
  const end = parseISO(endDate)
  while (cursor <= end) {
    const date = format(cursor, 'yyyy-MM-dd')
    const t = totalsByDate.get(date)
    const calories = t?.calories ?? null
    const meaningfulEntries = t?.entryCount ?? 0
    const targetCalories = context.targetHistory !== undefined
      ? resolveTargetForDate(context.targetHistory, date)?.calories ?? null
      : context.flatTargetCalories ?? null
    const explicitComplete = explicitDates.has(date)

    // Hierarchy: an explicit mark upgrades any day that actually has
    // intake to 'explicit_complete'. An explicit mark on a day with
    // NO logged intake stays 'missing' (flagged via explicitComplete)
    // — completion is a declaration about logging, never fabricated
    // calories, and unlogged days are never counted as zero.
    let completeness = classifyNutritionDayCompleteness(
      calories, meaningfulEntries, targetCalories
    )
    if (explicitComplete && calories !== null) {
      completeness = 'explicit_complete'
    }

    let adherence: NutritionDayAdherence | null = null
    if (
      (completeness === 'likely_complete' || completeness === 'explicit_complete') &&
      calories !== null &&
      targetCalories !== null && Number.isFinite(targetCalories) && targetCalories > 0
    ) {
      // |calories - target| / target rather than |1 - ratio|: the
      // subtraction of integers stays float-exact at the band edge
      // (2,200 vs 2,000 is exactly 10%, not 10%+epsilon).
      const deviation = Math.abs(calories - targetCalories) / targetCalories
      adherence =
        deviation <= CALORIE_ON_TRACK_RANGE
          ? 'near'
          : calories > targetCalories ? 'over' : 'under'
    }
    facts.push({
      date,
      calories,
      proteinG: t?.proteinGrams ?? null,
      carbsG: t?.carbohydrateGrams ?? null,
      fatG: t?.fatGrams ?? null,
      meaningfulEntries,
      targetCalories,
      completeness,
      adherence,
      explicitComplete,
    })
    cursor = addDays(cursor, 1)
  }
  return facts
}

/**
 * One fact per local calendar day across the INCLUSIVE range —
 * missing days appear explicitly as completeness 'missing' with null
 * values (no fake calories are ever fabricated for a day nobody
 * logged). This 5B.1 entry point applies one flat target across the
 * window; inference paths use buildDailyNutritionFactsWithContext.
 */
export function buildDailyNutritionFacts(
  rows: RawFoodLogLike[],
  startDate: string,
  endDate: string,
  targetCalories: number | null
): DailyNutritionFact[] {
  return buildFactsCore(rows, startDate, endDate, { flatTargetCalories: targetCalories })
}

/**
 * The Phase 5B.2 entry point: per-day HISTORICAL target resolution
 * (the 5B.1 single-target limitation removed) plus explicit
 * completion context. This is the required input for adaptive
 * maintenance inference.
 */
export function buildDailyNutritionFactsWithContext(
  rows: RawFoodLogLike[],
  startDate: string,
  endDate: string,
  context: {
    targetHistory: NutritionTargetVersion[]
    explicitCompleteDates: ReadonlySet<string>
  }
): DailyNutritionFact[] {
  return buildFactsCore(rows, startDate, endDate, context)
}

// ── Weekly weight anchors (Friday-weigh-in compatible) ─────────────
// The model NEVER requires daily (or twice-weekly) weighing: a week
// with a single reading still produces an anchor, just at 'single'
// quality. Weeks with >=2 distinct dates average them ('multi').
// Weeks with no reading produce no anchor — gaps are real, never
// interpolated.

export type AnchorQuality = 'single' | 'multi'

export interface WeeklyWeightAnchor {
  /** Monday of the ISO week, 'YYYY-MM-DD'. */
  weekStart: string
  anchorLbs: number
  contributingDates: number
  quality: AnchorQuality
}

export function deriveWeeklyWeightAnchors(
  rows: RawWeighInLike[],
  endDate: string,
  maxWeeks = 8
): WeeklyWeightAnchor[] {
  const windowStart = format(
    startOfISOWeek(subDays(parseISO(endDate), (maxWeeks - 1) * 7)),
    'yyyy-MM-dd'
  )
  const daily = dedupeDailyWeights(rows).filter(
    (p) => p.date >= windowStart && p.date <= endDate
  )
  const byWeek = new Map<string, number[]>()
  for (const point of daily) {
    const weekStart = format(startOfISOWeek(parseISO(point.date)), 'yyyy-MM-dd')
    const list = byWeek.get(weekStart) ?? []
    list.push(point.weightLbs)
    byWeek.set(weekStart, list)
  }
  return Array.from(byWeek.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([weekStart, weights]) => ({
      weekStart,
      anchorLbs:
        Math.round((weights.reduce((s, w) => s + w, 0) / weights.length) * 100) / 100,
      contributingDates: weights.length,
      quality: (weights.length >= 2 ? 'multi' : 'single') as AnchorQuality,
    }))
}

// ── Multi-anchor trend (least-squares regression) ──────────────────
// Weight is noisy: 190.0 -> 189.0 -> 189.3 -> 188.5 is a REAL
// declining trend even though one interval ticks up. Regression over
// the anchors captures that; per-interval sign agreement is
// deliberately NOT required. Gaps between anchored weeks use real
// week spacing on the x axis, never interpolation.

export type WeightTrendDirection = 'losing' | 'holding' | 'gaining' | 'insufficient_data'
export type WeightTrendConfidence = 'insufficient' | 'low' | 'moderate' | 'high'

export interface WeightTrendFact {
  anchorCount: number
  /** Regression slope in lb per week (+ = gaining), 2dp. */
  weeklyRateLb: number | null
  /** Slope as % of the latest anchor weight per week, 2dp. */
  weeklyRatePercent: number | null
  trendDirection: WeightTrendDirection
  trendConfidence: WeightTrendConfidence
  meanAbsResidualLb: number | null
}

/**
 * Confidence is structural, not magical (documented product rules):
 *   < 3 anchors                      -> insufficient (no trend at all)
 *   3 anchors                        -> low
 *   >= 4 anchors, noisy fit          -> low
 *   >= 4 anchors, good fit           -> moderate
 *   >= 5 anchors, good fit, and
 *     (>= 2 multi-quality anchors OR >= 6 anchors) -> high
 * A Friday-only weigher (all 'single' anchors) reaches 'high' with
 * six consistent weekly weigh-ins — the model rewards consistency,
 * not weigh-in frequency.
 */
export function computeWeightTrend(anchors: WeeklyWeightAnchor[]): WeightTrendFact {
  const fact: WeightTrendFact = {
    anchorCount: anchors.length,
    weeklyRateLb: null,
    weeklyRatePercent: null,
    trendDirection: 'insufficient_data',
    trendConfidence: 'insufficient',
    meanAbsResidualLb: null,
  }
  if (anchors.length < MIN_ANCHORS_FOR_TREND) return fact

  const sorted = [...anchors].sort((a, b) => a.weekStart.localeCompare(b.weekStart))
  const first = parseISO(sorted[0].weekStart)
  const xs = sorted.map((a) => differenceInCalendarDays(parseISO(a.weekStart), first) / 7)
  const ys = sorted.map((a) => a.anchorLbs)
  const n = xs.length
  const meanX = xs.reduce((s, x) => s + x, 0) / n
  const meanY = ys.reduce((s, y) => s + y, 0) / n
  let sxx = 0
  let sxy = 0
  for (let i = 0; i < n; i++) {
    sxx += (xs[i] - meanX) * (xs[i] - meanX)
    sxy += (xs[i] - meanX) * (ys[i] - meanY)
  }
  if (sxx === 0) return fact
  const slope = sxy / sxx
  const intercept = meanY - slope * meanX
  const residuals = xs.map((x, i) => Math.abs(ys[i] - (intercept + slope * x)))
  const meanAbsResidual = residuals.reduce((s, r) => s + r, 0) / n

  const latest = ys[ys.length - 1]
  fact.weeklyRateLb = Math.round(slope * 100) / 100
  fact.weeklyRatePercent = latest > 0 ? Math.round((slope / latest) * 100 * 100) / 100 : null
  fact.meanAbsResidualLb = Math.round(meanAbsResidual * 100) / 100

  fact.trendDirection =
    fact.weeklyRateLb <= WEIGHT_TREND_LOSING_LB_PER_WEEK
      ? 'losing'
      : fact.weeklyRateLb >= WEIGHT_TREND_GAINING_LB_PER_WEEK
      ? 'gaining'
      : 'holding'

  const goodFit = meanAbsResidual <= TREND_GOOD_FIT_MAX_MEAN_RESIDUAL_LB
  const multiCount = sorted.filter((a) => a.quality === 'multi').length
  if (n === 3) {
    fact.trendConfidence = 'low'
  } else if (!goodFit) {
    fact.trendConfidence = 'low'
  } else if (n >= 5 && (multiCount >= 2 || n >= 6)) {
    fact.trendConfidence = 'high'
  } else {
    fact.trendConfidence = 'moderate'
  }
  return fact
}

// ── User-relative activity baseline ────────────────────────────────
// NULL steps mean "not recorded" and are EXCLUDED from the baseline
// (never coerced to zero — the 5A.4 rule); an explicit 0 is a real
// recorded rest day and counts. Sessions are event records, so a
// week without sessions genuinely means none were recorded and
// counts as 0 minutes.

export interface ActivityBaseline {
  /** Median of recorded step days in the window; null until enough
   *  recorded days exist. */
  medianDailySteps: number | null
  stepDaysCounted: number
  /** Median of the window's weekly intentional+workout minutes. */
  medianWeeklySessionMinutes: number | null
  weeksCounted: number
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 1
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2
}

export function buildActivityBaseline(
  input: {
    /** daily_activity_logs rows (steps NULL = not recorded). */
    stepDays: Array<{ logged_date: string; steps: number | null }>
    /** Completed session durations (workouts + intentional activity). */
    sessions: Array<{ date: string; durationSeconds: number }>
  },
  endDate: string
): ActivityBaseline {
  const windowStart = format(
    subDays(parseISO(endDate), ACTIVITY_BASELINE_DAYS - 1),
    'yyyy-MM-dd'
  )
  const recordedSteps = input.stepDays
    .filter((d) => d.logged_date >= windowStart && d.logged_date <= endDate)
    .filter((d) => d.steps !== null && Number.isFinite(d.steps) && (d.steps as number) >= 0)
    .map((d) => d.steps as number)

  // Weekly session minutes across the window's four 7-day slices
  // (aligned to endDate, newest slice last).
  const weeks = Math.floor(ACTIVITY_BASELINE_DAYS / 7)
  const weeklyMinutes: number[] = []
  for (let w = weeks - 1; w >= 0; w--) {
    const sliceEnd = format(subDays(parseISO(endDate), w * 7), 'yyyy-MM-dd')
    const sliceStart = format(subDays(parseISO(sliceEnd), 6), 'yyyy-MM-dd')
    const seconds = input.sessions
      .filter((s) => s.date >= sliceStart && s.date <= sliceEnd)
      .filter((s) => Number.isFinite(s.durationSeconds) && s.durationSeconds > 0)
      .reduce((sum, s) => sum + s.durationSeconds, 0)
    weeklyMinutes.push(Math.round(seconds / 60))
  }

  return {
    medianDailySteps:
      recordedSteps.length >= ACTIVITY_BASELINE_MIN_STEP_DAYS
        ? Math.round(median(recordedSteps))
        : null,
    stepDaysCounted: recordedSteps.length,
    medianWeeklySessionMinutes:
      weeklyMinutes.length > 0 ? Math.round(median(weeklyMinutes)) : null,
    weeksCounted: weeklyMinutes.length,
  }
}

export type ActivityContext = 'low' | 'normal' | 'high' | 'unknown'

/** Context relative to the user's OWN baseline. Unknown when either
 *  side is unrecorded — "not recorded" is never treated as zero. */
export function classifyActivityContext(
  currentValue: number | null,
  baselineValue: number | null
): ActivityContext {
  if (currentValue === null || !Number.isFinite(currentValue)) return 'unknown'
  if (baselineValue === null || !Number.isFinite(baselineValue)) return 'unknown'
  if (baselineValue <= 0) return currentValue > 0 ? 'high' : 'normal'
  const ratio = currentValue / baselineValue
  if (ratio < ACTIVITY_LOW_RATIO) return 'low'
  if (ratio > ACTIVITY_HIGH_RATIO) return 'high'
  return 'normal'
}

// ── Expenditure: the aggregate/component hierarchy ─────────────────
// THE reconciliation contract, structural from day one:
//   - a trusted AGGREGATE signal (future Apple Health daily active
//     energy) is the authoritative expenditure figure when present
//   - session calories are COMPONENTS that attribute/explain the
//     aggregate — they are NEVER summed on top of it
//   - with no aggregate source (today), the authoritative figure is
//     null; nothing synthesizes expenditure from steps, distance, or
//     session calories
// The canonical example: aggregate 850 with workout 520 + walk 180
// resolves to 850 — never 1,550.

export interface AggregateExpenditure {
  calories: number
  /** Future import vocabulary — no source exists yet in 5B.1. */
  source: 'apple_health' | 'other_import'
}

export interface ExpenditureComponents {
  /** Sum of recorded workout calories; null when none recorded. */
  workoutCalories: number | null
  /** Sum of recorded intentional-activity calories; null when none. */
  activityCalories: number | null
}

export interface DailyExpenditure {
  aggregate: AggregateExpenditure | null
  components: ExpenditureComponents
  /** The ONLY figure allowed to speak for daily expenditure:
   *  aggregate when present, otherwise null. Never a component sum,
   *  never aggregate + components. */
  authoritativeCalories: number | null
}

/** NULL-vs-0 preserved: no recorded values -> null; recorded zeros
 *  sum to an explicit 0. */
export function sumRecordedCalories(values: Array<number | null>): number | null {
  const recorded = values.filter(
    (v): v is number => v !== null && Number.isFinite(v) && v >= 0
  )
  if (recorded.length === 0) return null
  return recorded.reduce((s, v) => s + v, 0)
}

export function resolveDailyExpenditure(
  aggregate: AggregateExpenditure | null,
  components: ExpenditureComponents
): DailyExpenditure {
  return {
    aggregate,
    components,
    authoritativeCalories: aggregate ? aggregate.calories : null,
  }
}
