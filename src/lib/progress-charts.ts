// ============================================================
// ShredOS — Progress Chart Adapters (Phase 2W)
// Pure domain adapters that turn the exercise detail page's existing
// fetchExerciseHistory entries (newest-first, one representative set
// per session — the SAME representative-set rules Phases 2T/2U
// established; no second algorithm here) into normalized TrendPoint
// arrays for the generic ExerciseTrendChart component, plus the
// literal first-to-latest text summaries.
//
// Everything in this file is a pure function of its inputs — no
// queries, no Date.now(), no mutation of the caller's arrays. The
// summaries are deliberately literal first-vs-latest differences,
// separate from Phase 2U's 1% improved/same/declined comparison —
// no new thresholds are introduced.
//
// Reuses formatDurationSeconds / formatDistanceMeters /
// formatPaceSecondsPerMile (workout.ts) and kgToLbs (units.ts) for
// every displayed value, so duration, distance, pace, and weight
// render identically here and everywhere else in the app.
// ============================================================

import { format, parseISO } from 'date-fns'
import { kgToLbs } from '@/lib/units'
import {
  formatDurationSeconds,
  formatDistanceMeters,
  formatPaceSecondsPerMile,
} from '@/lib/workout'
import type { ExerciseHistoryEntry } from '@/lib/workout'

// Local, non-exported conversion constant — the exact same precedent
// SetRow.tsx (Phase 2S) and workout.ts (Phase 2T) already establish:
// each file that needs the meters-to-miles conversion keeps the constant
// local rather than widening lib/units.ts. Used only to compute the
// numeric seconds-per-mile pace VALUE for plotting and differencing;
// all pace DISPLAY goes through formatPaceSecondsPerMile.
const METERS_PER_MILE = 1609.34

/** Shown whenever fewer than 2 valid points exist for a trend. */
export const EMPTY_TREND_MESSAGE =
  'Complete this exercise in at least two workouts to see a trend.'

// ── Types ────────────────────────────────────────────────────────────

/**
 * One normalized chart point. The generic chart component consumes
 * ONLY this shape — it never sees exercise/database shapes.
 */
export interface TrendPoint {
  /** ISO 'YYYY-MM-DD' workout date. */
  date: string
  /** Concise axis label, e.g. 'Aug 4' — repo's existing convention. */
  dateLabel: string
  /** Numeric value used for scaling/plotting only. */
  value: number
  /** Already-formatted display value, e.g. '185 lbs', '10:24 /mi'. */
  displayValue: string
  /** Optional extra tooltip context, e.g. 'RPE 7' or '+25 lbs'. */
  secondaryLabel?: string
}

export interface TrendChartData {
  title: string
  /** Chronological, oldest → newest (left → right). Always ≥ 2. */
  points: TrendPoint[]
  /** Literal first-to-latest difference summary. */
  summary: string
  /** Optional orientation note, e.g. 'Lower is faster'. */
  footnote?: string
}

// ── Shared point construction ────────────────────────────────────────

/**
 * Pure chronological transform: fetchExerciseHistory returns entries
 * newest-first; charts render oldest → newest. Copies before
 * reversing so the caller's array (still used for the Phase 2V
 * history list and entries[0]/entries[1] signal) is never mutated.
 */
function chronological(entriesNewestFirst: ExerciseHistoryEntry[]): ExerciseHistoryEntry[] {
  return entriesNewestFirst.slice().reverse()
}

function makePoint(
  date: string,
  value: number,
  displayValue: string,
  secondaryLabel?: string
): TrendPoint {
  return {
    date,
    // parseISO on a date-only string yields LOCAL midnight (the same
    // convention every page in the repo already uses via
    // format(parseISO(...), 'MMM d')) — no UTC-timestamp drift.
    dateLabel: format(parseISO(date), 'MMM d'),
    value,
    displayValue,
    ...(secondaryLabel !== undefined ? { secondaryLabel } : {}),
  }
}

/** A plottable number: finite and strictly positive. */
function isValidValue(v: number | null | undefined): v is number {
  return v !== null && v !== undefined && Number.isFinite(v) && v > 0
}

// ── First-to-latest summaries ────────────────────────────────────────
// All differences are computed on DISPLAY-ROUNDED values, so the
// summary can never disagree with what the chart labels show (e.g.
// "Up 0 lbs" or "improved" on a sub-second pace change is impossible).

export function summarizeWeightTrend(
  firstLbs: number,
  latestLbs: number,
  sessionCount: number
): string {
  const diff = Math.round(latestLbs) - Math.round(firstLbs)
  if (diff > 0) return `Up ${diff} lbs across ${sessionCount} sessions`
  if (diff < 0) return `Down ${Math.abs(diff)} lbs across ${sessionCount} sessions`
  return `No change across ${sessionCount} sessions`
}

export function summarizeRepsTrend(
  firstReps: number,
  latestReps: number,
  sessionCount: number
): string {
  const diff = Math.round(latestReps) - Math.round(firstReps)
  if (diff > 0) return `Up ${diff} reps across ${sessionCount} sessions`
  if (diff < 0) return `Down ${Math.abs(diff)} reps across ${sessionCount} sessions`
  return `No change across ${sessionCount} sessions`
}

/** Lower seconds-per-mile is faster — "improved" fires on a decrease. */
export function summarizePaceTrend(
  firstSecondsPerMile: number,
  latestSecondsPerMile: number,
  sessionCount: number
): string {
  const diff = Math.round(latestSecondsPerMile) - Math.round(firstSecondsPerMile)
  if (diff === 0) return `Pace was steady across ${sessionCount} sessions`
  // |diff| >= 1 second here, so formatDurationSeconds never returns null.
  const magnitude = formatDurationSeconds(Math.abs(diff)) as string
  return diff < 0
    ? `Pace improved by ${magnitude} /mi across ${sessionCount} sessions`
    : `Pace slowed by ${magnitude} /mi across ${sessionCount} sessions`
}

export function summarizeDurationTrend(
  firstSeconds: number,
  latestSeconds: number,
  sessionCount: number
): string {
  const diff = Math.round(latestSeconds) - Math.round(firstSeconds)
  if (diff === 0) return `Duration was unchanged across ${sessionCount} sessions`
  const magnitude = formatDurationSeconds(Math.abs(diff)) as string
  return diff > 0
    ? `Duration increased by ${magnitude} across ${sessionCount} sessions`
    : `Duration decreased by ${magnitude} across ${sessionCount} sessions`
}

export function summarizeDistanceTrend(
  firstMeters: number,
  latestMeters: number,
  sessionCount: number
): string {
  const diffMeters = latestMeters - firstMeters
  // Reuses formatDistanceMeters for the magnitude so the summary's
  // rounding matches the chart's ("0.00 mi" after display rounding
  // counts as unchanged rather than a phantom change).
  const magnitude = formatDistanceMeters(Math.abs(diffMeters))
  if (!magnitude || magnitude === '0.00 mi') {
    return `Distance was unchanged across ${sessionCount} sessions`
  }
  return diffMeters > 0
    ? `Distance increased by ${magnitude} across ${sessionCount} sessions`
    : `Distance decreased by ${magnitude} across ${sessionCount} sessions`
}

// ── Per-mode chart builders ──────────────────────────────────────────
// Each takes the page's existing newest-first history entries and
// returns fully-built chart data, or null when fewer than 2 valid
// points exist (the page then renders the shared empty state).

/**
 * weight_reps selection rule: estimated 1RM when at least 2 valid
 * estimated-1RM points exist; otherwise best working weight when at
 * least 2 valid weight points exist; otherwise null. Never both in
 * one chart. Display in pounds via the existing kgToLbs conversion.
 */
export function buildWeightRepsTrend(
  entriesNewestFirst: ExerciseHistoryEntry[]
): TrendChartData | null {
  const chrono = chronological(entriesNewestFirst)

  const rmPoints = chrono
    .filter((e) => isValidValue(e.estimated1RmKg))
    .map((e) => {
      const lbs = kgToLbs(e.estimated1RmKg as number)
      return makePoint(e.workoutDate, lbs, `${Math.round(lbs)} lbs`)
    })
  if (rmPoints.length >= 2) {
    return {
      title: 'Estimated 1RM',
      points: rmPoints,
      summary: summarizeWeightTrend(
        rmPoints[0].value,
        rmPoints[rmPoints.length - 1].value,
        rmPoints.length
      ),
    }
  }

  const weightPoints = chrono
    .filter((e) => isValidValue(e.weightKg))
    .map((e) => {
      const lbs = kgToLbs(e.weightKg as number)
      return makePoint(
        e.workoutDate,
        lbs,
        `${Math.round(lbs)} lbs`,
        e.reps !== null ? `× ${e.reps}` : undefined
      )
    })
  if (weightPoints.length >= 2) {
    return {
      title: 'Best working weight',
      points: weightPoints,
      summary: summarizeWeightTrend(
        weightPoints[0].value,
        weightPoints[weightPoints.length - 1].value,
        weightPoints.length
      ),
    }
  }

  return null
}

/**
 * bodyweight: a reps chart, plus a separate conditional added-weight
 * chart (never both metrics on one axis). The added-weight chart only
 * exists when at least 2 entries carry an added weight that rounds to
 * a positive number of pounds — "0 lbs" can never be plotted or
 * labeled. No estimated 1RM, no body mass.
 */
export function buildBodyweightTrends(entriesNewestFirst: ExerciseHistoryEntry[]): {
  reps: TrendChartData | null
  addedWeight: TrendChartData | null
} {
  const chrono = chronological(entriesNewestFirst)

  const repsPoints = chrono
    .filter((e) => isValidValue(e.reps))
    .map((e) => {
      const addedLbs =
        isValidValue(e.weightKg) && Math.round(kgToLbs(e.weightKg)) > 0
          ? Math.round(kgToLbs(e.weightKg))
          : null
      return makePoint(
        e.workoutDate,
        e.reps as number,
        `${e.reps} reps`,
        addedLbs !== null ? `+${addedLbs} lbs` : undefined
      )
    })
  const reps: TrendChartData | null =
    repsPoints.length >= 2
      ? {
          title: 'Reps',
          points: repsPoints,
          summary: summarizeRepsTrend(
            repsPoints[0].value,
            repsPoints[repsPoints.length - 1].value,
            repsPoints.length
          ),
        }
      : null

  const addedPoints = chrono
    .filter((e) => isValidValue(e.weightKg) && Math.round(kgToLbs(e.weightKg as number)) > 0)
    .map((e) => {
      const lbs = kgToLbs(e.weightKg as number)
      return makePoint(e.workoutDate, lbs, `+${Math.round(lbs)} lbs`)
    })
  const addedWeight: TrendChartData | null =
    addedPoints.length >= 2
      ? {
          title: 'Added weight',
          points: addedPoints,
          summary: summarizeWeightTrend(
            addedPoints[0].value,
            addedPoints[addedPoints.length - 1].value,
            addedPoints.length
          ),
        }
      : null

  return { reps, addedWeight }
}

/**
 * cardio metric priority: pace → duration → distance, never combined
 * on one axis. When pace is the primary chart, distance may ride
 * along as a separate secondary chart (and likewise under a duration
 * primary); distance is the primary only when neither pace nor
 * duration has 2 valid points — defensively coded even though a
 * distance-without-duration set can't currently be completed.
 * Pace values come from the same raw duration_seconds +
 * distance_meters the rest of the app uses; both guards are > 0, so
 * no NaN, Infinity, or divide-by-zero can reach a chart.
 */
export function buildCardioTrends(entriesNewestFirst: ExerciseHistoryEntry[]): {
  primary: TrendChartData | null
  secondary: TrendChartData | null
} {
  const chrono = chronological(entriesNewestFirst)

  const pacePoints = chrono
    .filter((e) => isValidValue(e.durationSeconds) && isValidValue(e.distanceMeters))
    .map((e) => {
      const secondsPerMile =
        (e.durationSeconds as number) / ((e.distanceMeters as number) / METERS_PER_MILE)
      return makePoint(
        e.workoutDate,
        secondsPerMile,
        formatPaceSecondsPerMile(e.durationSeconds, e.distanceMeters) as string,
        formatDistanceMeters(e.distanceMeters) ?? undefined
      )
    })
    .filter((p) => Number.isFinite(p.value))

  const durationPoints = chrono
    .filter((e) => isValidValue(e.durationSeconds))
    .map((e) =>
      makePoint(
        e.workoutDate,
        e.durationSeconds as number,
        formatDurationSeconds(e.durationSeconds) as string
      )
    )

  const distancePoints = chrono
    .filter((e) => isValidValue(e.distanceMeters))
    .map((e) =>
      makePoint(
        e.workoutDate,
        e.distanceMeters as number,
        formatDistanceMeters(e.distanceMeters) as string
      )
    )

  const distanceChart: TrendChartData | null =
    distancePoints.length >= 2
      ? {
          title: 'Distance',
          points: distancePoints,
          summary: summarizeDistanceTrend(
            distancePoints[0].value,
            distancePoints[distancePoints.length - 1].value,
            distancePoints.length
          ),
        }
      : null

  if (pacePoints.length >= 2) {
    return {
      primary: {
        title: 'Pace',
        points: pacePoints,
        summary: summarizePaceTrend(
          pacePoints[0].value,
          pacePoints[pacePoints.length - 1].value,
          pacePoints.length
        ),
        footnote: 'Lower is faster',
      },
      secondary: distanceChart,
    }
  }

  if (durationPoints.length >= 2) {
    return {
      primary: {
        title: 'Duration',
        points: durationPoints,
        summary: summarizeDurationTrend(
          durationPoints[0].value,
          durationPoints[durationPoints.length - 1].value,
          durationPoints.length
        ),
      },
      secondary: distanceChart,
    }
  }

  return { primary: distanceChart, secondary: null }
}

/**
 * timed: duration is the only plotted metric. RPE appears in the
 * tooltip only when present — never plotted, never used to imply
 * progress on its own.
 */
export function buildTimedTrend(
  entriesNewestFirst: ExerciseHistoryEntry[]
): TrendChartData | null {
  const chrono = chronological(entriesNewestFirst)

  const points = chrono
    .filter((e) => isValidValue(e.durationSeconds))
    .map((e) =>
      makePoint(
        e.workoutDate,
        e.durationSeconds as number,
        formatDurationSeconds(e.durationSeconds) as string,
        e.rpe !== null ? `RPE ${e.rpe}` : undefined
      )
    )

  if (points.length < 2) return null

  return {
    title: 'Duration',
    points,
    summary: summarizeDurationTrend(
      points[0].value,
      points[points.length - 1].value,
      points.length
    ),
  }
}
