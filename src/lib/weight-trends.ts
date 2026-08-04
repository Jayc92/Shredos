// ============================================================
// ShredOS — Body-Weight Trends (Phase 2Y)
// Pure helpers that turn raw weigh-in rows into a noise-reduced
// trend summary: one weight per local calendar date, a current
// 7-day average, a prior 7-day average, a literal rounded-average
// comparison, 28-day chart points, and literal goal-weight context.
//
// Everything here is a pure function of its inputs — no queries, no
// Date.now(), no mutation of the caller's arrays — so
// scripts/verify-phase2y.ts can exercise it deterministically.
//
// Deliberate non-goals (product rules, not omissions): no
// physiological thresholds (the "no meaningful change" call uses
// display rounding only), no good/bad framing of a direction, no
// interpolation across missing days, no projections, no calorie
// advice. Stored records are never consolidated — the one-entry-
// per-date rule exists only inside these calculations; the visible
// history list keeps showing every record.
//
// Date handling follows the repo's existing local-date conventions:
// 'YYYY-MM-DD' strings compared lexically for window bounds, and
// date-fns parseISO (local midnight, no UTC drift) + format for
// labels — the same pattern /weigh-in's 28-day filter already uses.
// Display reuses kgToLbs (which rounds to one decimal) — no
// duplicated conversion math.
// ============================================================

import { format, parseISO, subDays } from 'date-fns'
import { kgToLbs } from '@/lib/units'
import type { TrendPoint } from '@/lib/progress-charts'

// ── Constants ────────────────────────────────────────────────────────

export const AVERAGE_WINDOW_DAYS = 7
export const CHART_WINDOW_DAYS = 28
/** Distinct weigh-in DATES required before an average is produced. */
export const MIN_DATES_FOR_AVERAGE = 2
/**
 * Minimum visible y-range (in lbs) for the weight chart. Audited
 * decision: ExerciseTrendChart scales its domain to the exact data
 * min/max, which is right for strength/pace values but would blow a
 * 0.2 lb wiggle up to full plot height for body weight. The chart
 * gained an OPTIONAL minVisibleRange prop (unused by exercise charts,
 * whose scaling is unchanged); the weight chart passes this value.
 */
export const WEIGHT_CHART_MIN_VISIBLE_RANGE_LBS = 2

// ── Types ────────────────────────────────────────────────────────────

/** The subset of a body_metrics row these helpers read. */
export interface RawWeighInLike {
  logged_date: string
  weight_kg: number | null
  created_at: string
}

export interface DailyWeightPoint {
  /** Local calendar date, 'YYYY-MM-DD'. */
  date: string
  /** created_at of the record that represents this date. */
  recordedAt: string
  weightKg: number
  /** Display pounds — kgToLbs output, already rounded to 1 decimal. */
  weightLbs: number
}

export interface WeightTrendSummary {
  latest: DailyWeightPoint | null
  /** Distinct weigh-in dates across ALL provided rows (not windowed). */
  distinctDateCount: number
  currentAverageLbs: number | null
  /** Weigh-in dates contributing to the current 7-day window. */
  currentAverageCount: number
  priorAverageLbs: number | null
  priorAverageCount: number
  /** Rounded current minus rounded prior; null when either is missing. */
  averageChangeLbs: number | null
  /** Literal label, e.g. "Down 1.4 lbs versus the prior 7 days". */
  averageChangeLabel: string | null
  /** Daily points inside the 28-day chart window, oldest → newest. */
  chartPoints: TrendPoint[]
  goalWeightLbs: number | null
  /** Literal difference, e.g. "4.2 lbs below goal"; null without a goal. */
  goalDifferenceLabel: string | null
}

// ── Internals ────────────────────────────────────────────────────────

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

function isValidWeightKg(v: number | null | undefined): v is number {
  return v !== null && v !== undefined && Number.isFinite(v) && v > 0
}

/** Start date (inclusive) of a window of `days` days ending at endDate. */
function windowStart(endDate: string, days: number): string {
  return format(subDays(parseISO(endDate), days - 1), 'yyyy-MM-dd')
}

// ── Daily dedup ──────────────────────────────────────────────────────

/**
 * One weight per local calendar date: when several weigh-ins share a
 * logged_date, the LATEST-created record wins (never an average of
 * same-day entries). Invalid weights (null, zero, negative,
 * non-finite) are excluded. Returns a new chronologically-sorted
 * array (oldest → newest); the input is never mutated.
 */
export function dedupeDailyWeights(rows: RawWeighInLike[]): DailyWeightPoint[] {
  const byDate: Record<string, RawWeighInLike> = {}

  for (const row of rows) {
    if (!isValidWeightKg(row.weight_kg)) continue
    const existing = byDate[row.logged_date]
    // ISO timestamps compare correctly as strings.
    if (!existing || row.created_at > existing.created_at) {
      byDate[row.logged_date] = row
    }
  }

  return Object.values(byDate)
    .sort((a, b) => a.logged_date.localeCompare(b.logged_date))
    .map((row) => ({
      date: row.logged_date,
      recordedAt: row.created_at,
      weightKg: row.weight_kg as number,
      weightLbs: kgToLbs(row.weight_kg as number),
    }))
}

// ── Averages ─────────────────────────────────────────────────────────

/**
 * Average over the daily points whose date falls inside
 * [startDate, endDate] (both inclusive). Calendar-based: the window
 * may contain fewer points than days; MIN_DATES_FOR_AVERAGE distinct
 * dates are required before an average is produced. Averages raw kg
 * first, then converts once via kgToLbs, so the result carries the
 * same one-decimal display rounding as every other weight in the app.
 */
export function averageWeightLbsInWindow(
  dailyPoints: DailyWeightPoint[],
  startDate: string,
  endDate: string
): { averageLbs: number | null; count: number } {
  const inWindow = dailyPoints.filter((p) => p.date >= startDate && p.date <= endDate)
  if (inWindow.length < MIN_DATES_FOR_AVERAGE) {
    return { averageLbs: null, count: inWindow.length }
  }
  const meanKg = inWindow.reduce((sum, p) => sum + p.weightKg, 0) / inWindow.length
  return { averageLbs: kgToLbs(meanKg), count: inWindow.length }
}

/**
 * The two 7-day comparison windows, both calendar-based and ending at
 * the LATEST weigh-in date (not today): current = the 7 days ending
 * on latestDate; prior = the 7 days immediately before those.
 */
export function sevenDayWindowBounds(latestDate: string): {
  currentStart: string
  currentEnd: string
  priorStart: string
  priorEnd: string
} {
  const currentStart = windowStart(latestDate, AVERAGE_WINDOW_DAYS)
  const priorEnd = format(subDays(parseISO(currentStart), 1), 'yyyy-MM-dd')
  const priorStart = windowStart(priorEnd, AVERAGE_WINDOW_DAYS)
  return { currentStart, currentEnd: latestDate, priorStart, priorEnd }
}

/**
 * Literal rounded-average comparison — display rounding only, no
 * invented physiological threshold: both averages are already rounded
 * to one decimal (kgToLbs), so equal rounded values mean "No
 * meaningful change". Not coaching; direction is never good or bad.
 */
export function describeAverageChange(
  currentAverageLbs: number,
  priorAverageLbs: number
): { changeLbs: number; label: string } {
  const changeLbs = round1(currentAverageLbs - priorAverageLbs)
  if (changeLbs === 0) {
    return { changeLbs: 0, label: 'No meaningful change versus the prior 7 days' }
  }
  const magnitude = Math.abs(changeLbs).toFixed(1)
  return {
    changeLbs,
    label:
      changeLbs < 0
        ? `Down ${magnitude} lbs versus the prior 7 days`
        : `Up ${magnitude} lbs versus the prior 7 days`,
  }
}

// ── Goal context ─────────────────────────────────────────────────────

/**
 * Literal distance from goal on display-rounded values. "Above" and
 * "below" are directions, not judgments — no better/worse framing.
 */
export function describeGoalDifference(
  latestWeightLbs: number,
  goalWeightLbs: number
): string {
  const diff = round1(latestWeightLbs - goalWeightLbs)
  if (diff === 0) return 'At goal'
  const magnitude = Math.abs(diff).toFixed(1)
  return diff > 0 ? `${magnitude} lbs above goal` : `${magnitude} lbs below goal`
}

// ── Full summary ─────────────────────────────────────────────────────

/**
 * Builds the complete trend summary both pages consume. Rows may be
 * in any order and may contain same-day duplicates and non-weight
 * rows — dedupeDailyWeights normalizes them first. All windows end at
 * the latest weigh-in date. The chart window is the most recent
 * CHART_WINDOW_DAYS calendar days; older points are excluded from the
 * chart but still count toward distinctDateCount.
 */
export function buildWeightTrendSummary(
  rows: RawWeighInLike[],
  goalWeightKg: number | null
): WeightTrendSummary {
  const daily = dedupeDailyWeights(rows)
  const latest = daily.length > 0 ? daily[daily.length - 1] : null

  const goalWeightLbs = isValidWeightKg(goalWeightKg) ? kgToLbs(goalWeightKg) : null

  if (!latest) {
    return {
      latest: null,
      distinctDateCount: 0,
      currentAverageLbs: null,
      currentAverageCount: 0,
      priorAverageLbs: null,
      priorAverageCount: 0,
      averageChangeLbs: null,
      averageChangeLabel: null,
      chartPoints: [],
      goalWeightLbs,
      goalDifferenceLabel: null,
    }
  }

  const bounds = sevenDayWindowBounds(latest.date)
  const current = averageWeightLbsInWindow(daily, bounds.currentStart, bounds.currentEnd)
  const prior = averageWeightLbsInWindow(daily, bounds.priorStart, bounds.priorEnd)

  const change =
    current.averageLbs !== null && prior.averageLbs !== null
      ? describeAverageChange(current.averageLbs, prior.averageLbs)
      : null

  const chartStart = windowStart(latest.date, CHART_WINDOW_DAYS)
  const chartPoints: TrendPoint[] = daily
    .filter((p) => p.date >= chartStart)
    .map((p) => ({
      date: p.date,
      dateLabel: format(parseISO(p.date), 'MMM d'),
      value: p.weightLbs,
      displayValue: `${p.weightLbs.toFixed(1)} lbs`,
    }))

  return {
    latest,
    distinctDateCount: daily.length,
    currentAverageLbs: current.averageLbs,
    currentAverageCount: current.count,
    priorAverageLbs: prior.averageLbs,
    priorAverageCount: prior.count,
    averageChangeLbs: change?.changeLbs ?? null,
    averageChangeLabel: change?.label ?? null,
    chartPoints,
    goalWeightLbs,
    goalDifferenceLabel:
      goalWeightLbs !== null ? describeGoalDifference(latest.weightLbs, goalWeightLbs) : null,
  }
}
