// ============================================================
// ShredOS — Nutrition Consistency and Weekly Trends (Phase 2Z)
// Pure helpers that turn raw food-log rows into a neutral trend
// summary: one daily total per local calendar date, 7-day logging
// coverage, calorie/protein averages across LOGGED days only, literal
// prior-window comparisons, protein-target adherence against the
// existing nutrition_targets row, and 28-day chart points.
//
// Product rules encoded here (not omissions):
//   - A missing day is a coverage gap, never a zero-calorie day —
//     averages divide by contributing logged days only.
//   - Comparisons are literal display-rounded differences; up/down
//     are directions, never good/bad. No physiological thresholds.
//   - Adherence divides by logged days with protein data, never by 7.
//   - No calorie adjustments, no deficit math, no projections.
//
// Deliberately separate from progress-summary.ts's
// computeNutritionProgress: that is the existing FACTUAL 28-day
// rollup (any row counts as a logged day; protein "hit" uses a 0.9×
// ratio). This module is the 7-day trend system with its own spec'd
// rules (entry must carry a positive macro value; adherence is
// meets-or-exceeds the full target). Neither replaces the other.
//
// Everything except fetchNutritionTrendLogs is a pure function of its
// inputs (no queries, no Date.now(), no mutation), exercised by
// scripts/verify-phase2z.ts.
//
// Date handling reuses the repo's local-date conventions: 'YYYY-MM-DD'
// strings compared lexically, parseISO (local midnight) for labels —
// no UTC drift — and Phase 2Y's sevenDayWindowBounds for the window
// math, which is date-only and domain-neutral.
// ============================================================

import { format, parseISO, subDays } from 'date-fns'
import { sevenDayWindowBounds } from '@/lib/weight-trends'
import type { TrendPoint } from '@/lib/progress-charts'

// ── Constants ────────────────────────────────────────────────────────

export const NUTRITION_CHART_WINDOW_DAYS = 28
/** Logged days required in a window before an average is produced. */
export const MIN_LOGGED_DAYS_FOR_AVERAGE = 2
/**
 * Minimum visible y-ranges for the trend charts (Phase 2W chart's
 * optional minVisibleRange prop, added in Phase 2Y): small day-to-day
 * wiggles shouldn't occupy the entire plot height.
 */
export const CALORIE_CHART_MIN_VISIBLE_RANGE = 200
export const PROTEIN_CHART_MIN_VISIBLE_RANGE_G = 20

// ── Types ────────────────────────────────────────────────────────────

/** The subset of a food_logs row these helpers read. */
export interface RawFoodLogLike {
  logged_date: string
  calories: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
}

/**
 * One local calendar date's aggregated totals. A field is null when
 * NO entry that day carried a finite positive value for it — so a
 * protein-less day can never drag a protein average toward zero.
 */
export interface DailyNutritionTotal {
  date: string
  calories: number | null
  proteinGrams: number | null
  carbohydrateGrams: number | null
  fatGrams: number | null
  entryCount: number
}

export interface NutritionTrendSummary {
  latestLoggedDate: string | null
  currentWindowStart: string | null
  currentWindowEnd: string | null
  /** Human date range, e.g. "Jul 29–Aug 4". */
  currentWindowLabel: string | null

  /** Logged days across ALL provided rows (bounded by the fetch). */
  totalLoggedDays: number
  currentLoggedDays: number
  priorLoggedDays: number

  currentAverageCalories: number | null
  /** Days contributing to the current calorie average. */
  currentCalorieDays: number
  priorAverageCalories: number | null

  currentAverageProteinGrams: number | null
  /** Days contributing to the current protein average. */
  currentProteinDays: number
  priorAverageProteinGrams: number | null

  calorieComparisonLabel: string | null
  proteinComparisonLabel: string | null
  loggingComparisonLabel: string | null

  proteinTargetGrams: number | null
  proteinTargetMetDays: number | null
  proteinTargetEligibleDays: number | null

  /** The latest logged day's totals (for the one-day state). */
  latestDayTotal: DailyNutritionTotal | null

  calorieChartPoints: TrendPoint[]
  proteinChartPoints: TrendPoint[]
}

// ── Internals ────────────────────────────────────────────────────────

/** A usable macro value: finite and non-negative. */
function isUsableValue(v: number | null | undefined): v is number {
  return v !== null && v !== undefined && Number.isFinite(v) && v >= 0
}

/** A meaningful (day-qualifying) macro value: finite and positive. */
function isMeaningfulValue(v: number | null | undefined): v is number {
  return v !== null && v !== undefined && Number.isFinite(v) && v > 0
}

/**
 * A calendar day counts as LOGGED only when at least one entry
 * carries at least one finite positive macro value — an all-zero or
 * all-invalid placeholder row never creates a logged day. (Stricter
 * than computeNutritionProgress's any-row rule by design; documented
 * in the module header.)
 */
function isMeaningfulEntry(row: RawFoodLogLike): boolean {
  return (
    isMeaningfulValue(row.calories) ||
    isMeaningfulValue(row.protein_g) ||
    isMeaningfulValue(row.carbs_g) ||
    isMeaningfulValue(row.fat_g)
  )
}

// ── Daily totals ─────────────────────────────────────────────────────

/**
 * Aggregates raw rows into one total per local calendar date, sorted
 * chronologically (oldest → newest). All entries on the same date are
 * SUMMED (never averaged); a field's total is null when no entry that
 * day had a finite positive value for it, otherwise the sum of its
 * usable (finite, non-negative) values — negative/NaN field values
 * are excluded from sums. Placeholder rows with no meaningful value
 * never create a day. Pure: the input array is not mutated, and
 * stored records are untouched — this grouping exists only for trend
 * calculations.
 */
export function buildDailyNutritionTotals(rows: RawFoodLogLike[]): DailyNutritionTotal[] {
  interface DayAccumulator {
    calories: number
    hasCalories: boolean
    protein: number
    hasProtein: boolean
    carbs: number
    hasCarbs: boolean
    fat: number
    hasFat: boolean
    entryCount: number
  }
  const byDate: Record<string, DayAccumulator> = {}

  for (const row of rows) {
    if (!isMeaningfulEntry(row)) continue

    const acc = (byDate[row.logged_date] ??= {
      calories: 0, hasCalories: false,
      protein: 0, hasProtein: false,
      carbs: 0, hasCarbs: false,
      fat: 0, hasFat: false,
      entryCount: 0,
    })
    acc.entryCount += 1

    if (isUsableValue(row.calories)) {
      acc.calories += row.calories
      if (row.calories > 0) acc.hasCalories = true
    }
    if (isUsableValue(row.protein_g)) {
      acc.protein += row.protein_g
      if (row.protein_g > 0) acc.hasProtein = true
    }
    if (isUsableValue(row.carbs_g)) {
      acc.carbs += row.carbs_g
      if (row.carbs_g > 0) acc.hasCarbs = true
    }
    if (isUsableValue(row.fat_g)) {
      acc.fat += row.fat_g
      if (row.fat_g > 0) acc.hasFat = true
    }
  }

  return Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, acc]) => ({
      date,
      calories: acc.hasCalories ? acc.calories : null,
      proteinGrams: acc.hasProtein ? acc.protein : null,
      carbohydrateGrams: acc.hasCarbs ? acc.carbs : null,
      fatGrams: acc.hasFat ? acc.fat : null,
      entryCount: acc.entryCount,
    }))
}

// ── Averages and comparisons ─────────────────────────────────────────

function daysInWindow(
  totals: DailyNutritionTotal[],
  startDate: string,
  endDate: string
): DailyNutritionTotal[] {
  return totals.filter((d) => d.date >= startDate && d.date <= endDate)
}

/**
 * Whole-number average of one field across the days that actually
 * carry it — never divided by 7, never counting missing days as zero.
 * Requires MIN_LOGGED_DAYS_FOR_AVERAGE contributing days.
 */
export function averageAcrossLoggedDays(
  days: DailyNutritionTotal[],
  field: 'calories' | 'proteinGrams'
): { average: number | null; count: number } {
  const contributing = days.filter((d) => d[field] !== null)
  if (contributing.length < MIN_LOGGED_DAYS_FOR_AVERAGE) {
    return { average: null, count: contributing.length }
  }
  const mean =
    contributing.reduce((sum, d) => sum + (d[field] as number), 0) / contributing.length
  return { average: Math.round(mean), count: contributing.length }
}

/** Literal, display-rounded calorie comparison — spec wording. */
export function describeCalorieComparison(current: number, prior: number): string {
  const diff = Math.round(current) - Math.round(prior)
  if (diff === 0) return 'Average calories were unchanged versus the prior 7 days'
  return diff > 0
    ? `Average calories were up ${diff.toLocaleString()} versus the prior 7 days`
    : `Average calories were down ${Math.abs(diff).toLocaleString()} versus the prior 7 days`
}

/** Literal, display-rounded protein comparison — spec wording. */
export function describeProteinComparison(current: number, prior: number): string {
  const diff = Math.round(current) - Math.round(prior)
  if (diff === 0) return 'Average protein was unchanged versus the prior 7 days'
  return diff > 0
    ? `Average protein was up ${diff}g versus the prior 7 days`
    : `Average protein was down ${Math.abs(diff)}g versus the prior 7 days`
}

/** Literal logged-day coverage comparison — spec wording. */
export function describeLoggingComparison(currentDays: number, priorDays: number): string {
  const diff = currentDays - priorDays
  if (diff === 0) return 'Logging coverage was unchanged versus the prior 7 days'
  const magnitude = Math.abs(diff)
  const noun = magnitude === 1 ? 'day' : 'days'
  return diff > 0
    ? `Logging increased by ${magnitude} ${noun} versus the prior 7 days`
    : `Logging decreased by ${magnitude} ${noun} versus the prior 7 days`
}

// ── Full summary ─────────────────────────────────────────────────────

/**
 * Builds the complete trend summary both pages consume.
 *
 * Anchor rule (documented decision): all windows end on the LATEST
 * logged date — mirroring Phase 2Y's weight windows — so an older
 * dataset isn't made to look artificially incomplete merely because
 * today is much later. With no logs at all, everything is the empty
 * state; no window is anchored to today.
 *
 * Comparisons require BOTH windows to hold at least two logged days,
 * and the two averages being compared to both exist.
 *
 * proteinTargetGrams comes from the caller's existing authoritative
 * target (nutrition_targets.protein_g); adherence counts current-
 * window logged days whose protein total meets or exceeds it, divided
 * by days WITH protein data only. No target (or no eligible days) →
 * nulls, and the UI omits the line entirely.
 */
export function buildNutritionTrendSummary(
  rows: RawFoodLogLike[],
  proteinTargetGrams: number | null
): NutritionTrendSummary {
  const totals = buildDailyNutritionTotals(rows)
  const latest = totals.length > 0 ? totals[totals.length - 1] : null

  const validTarget =
    proteinTargetGrams !== null && Number.isFinite(proteinTargetGrams) && proteinTargetGrams > 0
      ? proteinTargetGrams
      : null

  if (!latest) {
    return {
      latestLoggedDate: null,
      currentWindowStart: null,
      currentWindowEnd: null,
      currentWindowLabel: null,
      totalLoggedDays: 0,
      currentLoggedDays: 0,
      priorLoggedDays: 0,
      currentAverageCalories: null,
      currentCalorieDays: 0,
      priorAverageCalories: null,
      currentAverageProteinGrams: null,
      currentProteinDays: 0,
      priorAverageProteinGrams: null,
      calorieComparisonLabel: null,
      proteinComparisonLabel: null,
      loggingComparisonLabel: null,
      proteinTargetGrams: validTarget,
      proteinTargetMetDays: null,
      proteinTargetEligibleDays: null,
      latestDayTotal: null,
      calorieChartPoints: [],
      proteinChartPoints: [],
    }
  }

  const bounds = sevenDayWindowBounds(latest.date)
  const currentDays = daysInWindow(totals, bounds.currentStart, bounds.currentEnd)
  const priorDays = daysInWindow(totals, bounds.priorStart, bounds.priorEnd)

  const currentCalories = averageAcrossLoggedDays(currentDays, 'calories')
  const priorCalories = averageAcrossLoggedDays(priorDays, 'calories')
  const currentProtein = averageAcrossLoggedDays(currentDays, 'proteinGrams')
  const priorProtein = averageAcrossLoggedDays(priorDays, 'proteinGrams')

  const bothWindowsComparable =
    currentDays.length >= MIN_LOGGED_DAYS_FOR_AVERAGE &&
    priorDays.length >= MIN_LOGGED_DAYS_FOR_AVERAGE

  const calorieComparisonLabel =
    bothWindowsComparable && currentCalories.average !== null && priorCalories.average !== null
      ? describeCalorieComparison(currentCalories.average, priorCalories.average)
      : null
  const proteinComparisonLabel =
    bothWindowsComparable && currentProtein.average !== null && priorProtein.average !== null
      ? describeProteinComparison(currentProtein.average, priorProtein.average)
      : null
  const loggingComparisonLabel = bothWindowsComparable
    ? describeLoggingComparison(currentDays.length, priorDays.length)
    : null

  // Protein-target adherence: eligible = current-window logged days
  // that carry protein data; met = daily protein >= the full target.
  const eligibleDays = currentDays.filter((d) => d.proteinGrams !== null)
  const proteinTargetEligibleDays =
    validTarget !== null && eligibleDays.length > 0 ? eligibleDays.length : null
  const proteinTargetMetDays =
    validTarget !== null && proteinTargetEligibleDays !== null
      ? eligibleDays.filter((d) => (d.proteinGrams as number) >= validTarget).length
      : null

  // 28-day chart windows: one point per logged date carrying that
  // field; missing days are simply absent — never interpolated, never
  // faked as zero. Note (documented): the shared chart spaces points
  // equally by index rather than by true calendar distance; date
  // labels remain the honest actual dates.
  const chartStart = format(
    subDays(parseISO(latest.date), NUTRITION_CHART_WINDOW_DAYS - 1),
    'yyyy-MM-dd'
  )
  const chartDays = totals.filter((d) => d.date >= chartStart)

  const calorieChartPoints: TrendPoint[] = chartDays
    .filter((d) => d.calories !== null)
    .map((d) => ({
      date: d.date,
      dateLabel: format(parseISO(d.date), 'MMM d'),
      value: d.calories as number,
      displayValue: `${Math.round(d.calories as number).toLocaleString()} cal`,
    }))

  const proteinChartPoints: TrendPoint[] = chartDays
    .filter((d) => d.proteinGrams !== null)
    .map((d) => ({
      date: d.date,
      dateLabel: format(parseISO(d.date), 'MMM d'),
      value: d.proteinGrams as number,
      displayValue: `${Math.round(d.proteinGrams as number)}g`,
    }))

  return {
    latestLoggedDate: latest.date,
    currentWindowStart: bounds.currentStart,
    currentWindowEnd: bounds.currentEnd,
    currentWindowLabel: `${format(parseISO(bounds.currentStart), 'MMM d')}–${format(
      parseISO(bounds.currentEnd),
      'MMM d'
    )}`,
    totalLoggedDays: totals.length,
    currentLoggedDays: currentDays.length,
    priorLoggedDays: priorDays.length,
    currentAverageCalories: currentCalories.average,
    currentCalorieDays: currentCalories.count,
    priorAverageCalories: priorCalories.average,
    currentAverageProteinGrams: currentProtein.average,
    currentProteinDays: currentProtein.count,
    priorAverageProteinGrams: priorProtein.average,
    calorieComparisonLabel,
    proteinComparisonLabel,
    loggingComparisonLabel,
    proteinTargetGrams: validTarget,
    proteinTargetMetDays,
    proteinTargetEligibleDays,
    latestDayTotal: latest,
    calorieChartPoints,
    proteinChartPoints,
  }
}

// ── Server fetch helper ──────────────────────────────────────────────

/**
 * Bounded two-step fetch (never unbounded, never one query per day):
 * (1) the single latest logged_date, (2) the rows inside the 28-day
 * chart window ending on it — which fully contains both 7-day
 * comparison windows (max lookback = 27 days), so one ranged query
 * serves summary, comparisons, adherence, and charts. Anchoring the
 * bound to the latest logged date (not today) keeps older datasets
 * fully usable. Uses the caller's authenticated client; RLS applies
 * unchanged.
 */
export async function fetchNutritionTrendLogs(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string
): Promise<RawFoodLogLike[]> {
  const { data: latestRows, error: latestError } = await supabase
    .from('food_logs')
    .select('logged_date')
    .eq('user_id', userId)
    .order('logged_date', { ascending: false })
    .limit(1)

  if (latestError) console.error('fetchNutritionTrendLogs (latest) error:', latestError)
  const latestDate: string | undefined = latestRows?.[0]?.logged_date
  if (!latestDate) return []

  const windowStart = format(
    subDays(parseISO(latestDate), NUTRITION_CHART_WINDOW_DAYS - 1),
    'yyyy-MM-dd'
  )

  const { data: rows, error } = await supabase
    .from('food_logs')
    .select('logged_date, calories, protein_g, carbs_g, fat_g')
    .eq('user_id', userId)
    .gte('logged_date', windowStart)
    .lte('logged_date', latestDate)

  if (error) console.error('fetchNutritionTrendLogs error:', error)
  return rows ?? []
}
