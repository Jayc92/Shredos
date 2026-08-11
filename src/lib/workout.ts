// ============================================================
// ShredOS — Workout Utilities
// ============================================================

import { format, parseISO } from 'date-fns'
import { kgToLbs } from '@/lib/units'
import type { WorkoutSet, TrackingMode, ExerciseEquipment, WorkoutExerciseWithDetails } from '@/types/database'
import type { ProgressSignal } from '@/types/app'
import type { ProgressionTrend } from '@/lib/workout-coach'

// ── Phase 2T: tracking-aware duration/distance display ─────────────
// Local, non-exported conversion constant -- matches the exact same
// precedent already established in SetRow.tsx (Phase 2S): distance is
// stored in meters but displayed in miles, and this constant is kept
// local rather than added to lib/units.ts, which isn't part of this
// phase's audited scope.
const METERS_PER_MILE = 1609.34

/**
 * Formats a set/session duration for display (Phase 2T).
 * Under one hour: M:SS. One hour or more: H:MM:SS.
 * A null, undefined, or non-positive duration returns null -- a zero
 * or missing duration is never presented as a valid result, matching
 * Phase 2S's own completion requirement that duration must be > 0.
 */
export function formatDurationSeconds(seconds: number | null | undefined): string | null {
  if (seconds === null || seconds === undefined || seconds <= 0) return null
  const totalSeconds = Math.round(seconds)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const secs = totalSeconds % 60
  const paddedSecs = String(secs).padStart(2, '0')
  if (hours > 0) {
    const paddedMinutes = String(minutes).padStart(2, '0')
    return `${hours}:${paddedMinutes}:${paddedSecs}`
  }
  return `${minutes}:${paddedSecs}`
}

/**
 * Formats a distance for display (Phase 2T). Stored in meters,
 * displayed in miles at a fixed two decimal places, matching every
 * given example exactly (0.25 mi, 1.00 mi, 3.10 mi). A null or
 * non-positive distance returns null -- callers omit it entirely
 * rather than showing "0.00 mi" or a trailing separator with nothing
 * after it.
 */
export function formatDistanceMeters(meters: number | null | undefined): string | null {
  if (meters === null || meters === undefined || meters <= 0) return null
  const miles = meters / METERS_PER_MILE
  return `${miles.toFixed(2)} mi`
}

/**
 * Formats average pace as minutes-per-mile (Phase 2U). Reuses
 * formatDurationSeconds' exact M:SS / H:MM:SS shape on the computed
 * seconds-per-mile value, so pace and duration always render with the
 * same formatting rules -- no separate pace-specific time formatter.
 * Returns null when either input is missing or non-positive; never
 * divides by zero, never produces NaN/Infinity.
 */
export function formatPaceSecondsPerMile(
  durationSeconds: number | null | undefined,
  distanceMeters: number | null | undefined
): string | null {
  if (durationSeconds === null || durationSeconds === undefined || durationSeconds <= 0) return null
  if (distanceMeters === null || distanceMeters === undefined || distanceMeters <= 0) return null
  const miles = distanceMeters / METERS_PER_MILE
  const paceSecondsPerMile = durationSeconds / miles
  const formatted = formatDurationSeconds(paceSecondsPerMile)
  return formatted ? `${formatted} /mi` : null
}

/**
 * Shared shape for "format one representative set's summary,
 * tracking-mode-aware" (Phase 2T) -- used by both buildPreviousBestSummary
 * (a real WorkoutSet, translated to this shape below) and
 * ExerciseHistoryRows (ExerciseHistoryEntry, already close to this
 * shape). camelCase throughout, matching ExerciseHistoryEntry's own
 * existing convention rather than WorkoutSet's snake_case.
 */
export interface TrackingAwareSetSummaryInput {
  reps: number | null
  weightKg: number | null
  rpe: number | null
  isWarmup?: boolean
  durationSeconds: number | null
  distanceMeters: number | null
}

/**
 * The single formatter behind both "Last: ..." (active workout) and
 * "Recent" history rows -- previously two independent, duplicated
 * implementations (Phase 2B/2C-era), neither of which understood
 * cardio/timed at all. Exact output matches every given Phase 2T
 * example literally:
 *   weight_reps: "10 reps × 135 lbs", "8 reps × 155 lbs · RPE 8",
 *                "WU · 10 reps × 45 lbs"
 *   bodyweight:  "12 reps", "8 reps · +25 lbs", "10 reps · RPE 8",
 *                "WU · 8 reps"
 *   cardio:      "20:00", "32:15 · 3.10 mi"
 *   timed:       "1:30", "2:00 · RPE 7"
 * Deliberately does NOT include "est. 1RM" (the two prior
 * implementations both did) -- no given example shows it, and adding
 * it back as an optional extra would be scope beyond matching the
 * approved examples exactly. Flagged explicitly in the delivery notes
 * as a real, intentional behavior change to this display text.
 */
export function formatTrackingAwareSetSummary(
  set: TrackingAwareSetSummaryInput,
  trackingMode: TrackingMode
): string {
  const prefix = set.isWarmup ? 'WU · ' : ''

  if (trackingMode === 'cardio' || trackingMode === 'timed') {
    const duration = formatDurationSeconds(set.durationSeconds)
    if (!duration) return ''
    const parts = [duration]
    if (trackingMode === 'cardio') {
      const distance = formatDistanceMeters(set.distanceMeters)
      if (distance) parts.push(distance)
      // Phase 2U: pace only ever appears alongside distance -- it's
      // derived from duration+distance together, never shown alone.
      const pace = formatPaceSecondsPerMile(set.durationSeconds, set.distanceMeters)
      if (pace) parts.push(pace)
    } else {
      if (set.rpe !== null) parts.push(`RPE ${set.rpe}`)
    }
    return prefix + parts.join(' · ')
  }

  if (trackingMode === 'bodyweight') {
    if (set.reps === null) return ''
    const parts = [`${set.reps} reps`]
    if (set.weightKg !== null && set.weightKg > 0) {
      parts.push(`+${displayWeight(set.weightKg)} lbs`)
    }
    if (set.rpe !== null) parts.push(`RPE ${set.rpe}`)
    return prefix + parts.join(' · ')
  }

  // weight_reps
  if (!set.weightKg || set.weightKg <= 0) {
    return set.reps !== null ? `${prefix}${set.reps} reps` : ''
  }
  const lbs = displayWeight(set.weightKg)
  const parts: string[] = []
  if (set.reps !== null) parts.push(`${set.reps} reps × ${lbs} lbs`)
  else parts.push(`${lbs} lbs`)
  if (set.rpe !== null) parts.push(`RPE ${set.rpe}`)
  return prefix + parts.join(' · ')
}

// ── Epley 1RM ─────────────────────────────────────────────────────

/**
 * Epley formula: weight × (1 + reps / 30).
 * Valid for weighted sets with 2–12 reps.
 * Returns null for bodyweight, 1-rep (that IS the 1RM), or >12 reps.
 */
export function epley1RM(weightKg: number, reps: number): number | null {
  if (weightKg <= 0 || reps < 2 || reps > 12) return null
  return Math.round(weightKg * (1 + reps / 30) * 10) / 10
}

// ── Set scoring (shared by bestSet + progressSignal) ──────────────

/**
 * Score a completed set for comparison purposes.
 *   Weighted: Epley estimated 1RM (or raw weight for reps outside 2–12)
 *   Bodyweight (null/0 weight): reps count is the proxy metric
 *
 * This lets Plank/push-up progress (reps) be tracked alongside
 * barbell work without mixing the two into nonsensical comparisons
 * (exercises are compared to themselves, never cross-exercise).
 */
export function setScore(s: WorkoutSet): number {
  if (s.weight_kg && s.weight_kg > 0) {
    const rm = s.reps ? epley1RM(s.weight_kg, s.reps) : null
    return rm ?? s.weight_kg
  }
  // Bodyweight: reps as the proxy metric
  return s.reps ?? 0
}

// ── Best set selection ────────────────────────────────────────────

/**
 * Find the best completed, non-warmup set in a list.
 * Includes both weighted AND bodyweight sets.
 * Warmup and incomplete sets are always excluded.
 */
export function bestSet(sets: WorkoutSet[]): WorkoutSet | null {
  const working = sets.filter(
    (s) => s.completed && !s.is_warmup && (
      (s.weight_kg !== null && s.weight_kg > 0) ||
      (s.reps !== null && s.reps > 0)
    )
  )
  if (working.length === 0) return null
  return working.reduce((best, s) => setScore(s) > setScore(best) ? s : best)
}

// ── Tracking-aware representative set (cardio/timed) ────────────────

/**
 * Selects the representative completed, non-warmup set for a cardio or
 * timed exercise from a list of sets -- typically all sets belonging
 * to ONE session (Phase 2U). Deliberately parallel to bestSet(), never
 * calling setScore or reusing any strength-only comparison.
 *
 * timed: longest duration_seconds wins outright.
 *
 * cardio: if any qualifying set has a valid pace (duration AND
 * distance both present and positive), the best (lowest) pace wins,
 * tie-broken by greater distance, then by longer duration. If NO
 * qualifying set has a valid pace (duration-only cardio, or distance
 * genuinely never logged), falls back to longest duration_seconds --
 * exactly mirroring timed's rule, and Phase 2T's original behavior for
 * this case.
 *
 * A pace-valid set always outranks a pace-invalid one, even if the
 * pace-invalid set has a longer raw duration -- a session's real
 * comparable pace data is more informative than an incomparable raw
 * duration from a different (distance-less) set in the same session.
 */
export function pickRepresentativeCardioSet(
  sets: WorkoutSet[],
  trackingMode: TrackingMode
): WorkoutSet | null {
  const qualifying = sets.filter(
    (s) => s.completed && !s.is_warmup && s.duration_seconds !== null && s.duration_seconds > 0
  )
  if (qualifying.length === 0) return null

  const byLongestDuration = (a: WorkoutSet, b: WorkoutSet) =>
    (b.duration_seconds as number) > (a.duration_seconds as number) ? b : a

  if (trackingMode === 'timed') {
    return qualifying.reduce(byLongestDuration)
  }

  // cardio
  const paceValid = qualifying.filter((s) => s.distance_meters !== null && s.distance_meters > 0)
  if (paceValid.length === 0) {
    return qualifying.reduce(byLongestDuration)
  }

  const paceOf = (s: WorkoutSet) => (s.duration_seconds as number) / ((s.distance_meters as number) / METERS_PER_MILE)

  return paceValid.reduce((best, s) => {
    const paceS = paceOf(s)
    const paceBest = paceOf(best)
    if (paceS < paceBest) return s
    if (paceS > paceBest) return best
    // Tie on pace -> greater distance wins.
    if ((s.distance_meters as number) > (best.distance_meters as number)) return s
    if ((s.distance_meters as number) < (best.distance_meters as number)) return best
    // Tie on pace and distance -> longer duration wins.
    return (s.duration_seconds as number) > (best.duration_seconds as number) ? s : best
  })
}

// ── Progressive overload signal ───────────────────────────────────

export function progressSignal(
  currentBest: WorkoutSet | null,
  previousBest: WorkoutSet | null
): ProgressSignal {
  if (!previousBest) return 'new'
  if (!currentBest)  return 'same'
  const curr = setScore(currentBest)
  const prev = setScore(previousBest)
  if (prev === 0) return 'new'
  if (curr > prev * 1.01) return 'improved'
  if (curr < prev * 0.99) return 'declined'
  return 'same'
}

/**
 * Cardio/timed's parallel to progressSignal() (Phase 2U) -- same
 * 1%-threshold shape and the same 4-value ProgressSignal result, but
 * never calls setScore, since setScore's bodyweight-reps-as-proxy
 * fallback would silently treat every cardio/timed set (which always
 * has null weight_kg AND null reps) as a worthless "0" score,
 * producing a meaningless "same" result every time.
 *
 * timed: duration_seconds only, exact same comparison shape as
 * progressSignal (>1% higher = improved, >1% lower = declined).
 *
 * cardio: if BOTH sets have a valid pace (duration and distance both
 * present), pace is the primary comparison -- LOWER seconds-per-mile
 * is better, so "improved" fires when current pace is at least 1%
 * lower than previous. Within ±1% pace, greater distance breaks the
 * tie; if distance is also within ±1%, the result is 'same'. If
 * EITHER set lacks a valid pace (duration-only cardio, or one session
 * has distance and the other doesn't -- Phase 2U's approved "mixed
 * historical data" case), this deliberately falls back to a plain
 * duration_seconds comparison instead, using the identical shape as
 * the timed branch -- pace is never claimed to have improved or
 * declined when it can't honestly be compared.
 */
export function trackingAwareProgressSignal(
  currentBest: WorkoutSet | null,
  previousBest: WorkoutSet | null,
  trackingMode: TrackingMode
): ProgressSignal {
  if (!previousBest) return 'new'
  if (!currentBest)  return 'same'

  const currHasPace = trackingMode === 'cardio'
    && currentBest.duration_seconds !== null && currentBest.duration_seconds > 0
    && currentBest.distance_meters !== null && currentBest.distance_meters > 0
  const prevHasPace = trackingMode === 'cardio'
    && previousBest.duration_seconds !== null && previousBest.duration_seconds > 0
    && previousBest.distance_meters !== null && previousBest.distance_meters > 0

  if (currHasPace && prevHasPace) {
    const currPace = (currentBest.duration_seconds as number) / ((currentBest.distance_meters as number) / METERS_PER_MILE)
    const prevPace = (previousBest.duration_seconds as number) / ((previousBest.distance_meters as number) / METERS_PER_MILE)
    if (prevPace <= 0) return 'new'
    if (currPace < prevPace * 0.99) return 'improved'
    if (currPace > prevPace * 1.01) return 'declined'
    // Pace within ±1% -> greater distance is the tie-breaker.
    const currDist = currentBest.distance_meters as number
    const prevDist = previousBest.distance_meters as number
    if (currDist > prevDist * 1.01) return 'improved'
    if (currDist < prevDist * 0.99) return 'declined'
    return 'same'
  }

  // Duration-only fallback: duration-only cardio, timed, or mixed
  // pace/no-pace historical data -- same threshold shape throughout.
  const prevDuration = previousBest.duration_seconds
  if (prevDuration === null || prevDuration <= 0) return 'new'
  const currDuration = currentBest.duration_seconds ?? 0
  if (currDuration > prevDuration * 1.01) return 'improved'
  if (currDuration < prevDuration * 0.99) return 'declined'
  return 'same'
}

export function progressLabel(signal: ProgressSignal): string {
  switch (signal) {
    case 'improved': return '↑ Improved'
    case 'declined': return '↓ Declined'
    case 'same':     return '→ Same'
    case 'new':      return 'New exercise'
  }
}

export function progressColor(signal: ProgressSignal): string {
  switch (signal) {
    case 'improved': return 'bg-green-500/15 text-green-400 border-green-500/20'
    case 'declined': return 'bg-red-500/15 text-red-400 border-red-500/20'
    case 'same':     return 'bg-secondary text-muted-foreground border-border'
    case 'new':      return 'bg-blue-500/15 text-blue-400 border-blue-500/20'
  }
}

// ── Previous best summary string ──────────────────────────────────

export function buildPreviousBestSummary(best: WorkoutSet | null, trackingMode: TrackingMode): string {
  if (!best) return ''
  return formatTrackingAwareSetSummary({
    reps: best.reps,
    weightKg: best.weight_kg,
    rpe: best.rpe,
    isWarmup: best.is_warmup,
    durationSeconds: best.duration_seconds,
    distanceMeters: best.distance_meters,
  }, trackingMode)
}

export function formatPreviousBest(best: WorkoutSet | null, trackingMode: TrackingMode): string {
  if (!best) return 'No prior data'
  return buildPreviousBestSummary(best, trackingMode)
}

// ── Next-target suggestion ─────────────────────────────────────────
// Answers "what should I try to beat next time for this exercise?"
// Reuses the caller's already-filtered previousBest (completed,
// non-warmup — see fetchPreviousBests) and, optionally, the existing
// multi-session trend from workout-coach.ts's fetchExerciseTrends.
// Does not recompute historical bests or decline detection — both are
// consumed as inputs, not rebuilt here.

const RPE_HIGH_THRESHOLD = 9
const LOW_REPS_THRESHOLD = 6
const TOP_OF_RANGE_REPS = 8
const MANAGEABLE_RPE_MAX = 8
const SUGGESTED_WEIGHT_INCREASE_LBS = 5
const SUGGESTED_REP_INCREASE = 1

// Phase 2U: cardio/timed next-target thresholds. Bucket boundaries and
// increase amounts verified numerically against every literal example
// in the approved spec before implementation (5:00->5:30, 20:00->21:00,
// 45:00->47:00 for cardio duration-only; 0:45->0:50, 2:00->2:10,
// 5:54@RPE9->repeat for timed).
const CARDIO_SHORT_THRESHOLD_SEC = 600   // 10 minutes
const CARDIO_LONG_THRESHOLD_SEC = 1800   // 30 minutes
const CARDIO_SHORT_INCREASE_SEC = 30
const CARDIO_MID_INCREASE_SEC = 60
const CARDIO_LONG_INCREASE_SEC = 120

const TIMED_SHORT_THRESHOLD_SEC = 60     // 1 minute
const TIMED_LONG_THRESHOLD_SEC = 300     // 5 minutes
const TIMED_SHORT_INCREASE_SEC = 5
const TIMED_MID_INCREASE_SEC = 10
const TIMED_LONG_INCREASE_SEC = 15
const TIMED_HIGH_RPE_THRESHOLD = 9

// 1.5% pace improvement -- the midpoint of the approved "approximately
// 1-2%" range. Deliberately unused in the displayed message itself
// (see buildCardioPaceSuggestion) to avoid presenting an artificially
// precise target pace; kept here only as documentation of the intent.
const CARDIO_PACE_IMPROVEMENT_TARGET = 0.015

export type NextTargetAction = 'unavailable' | 'increase' | 'repeat' | 'reduce_volume' | 'no_suggestion'

export interface NextTargetSuggestion {
  action: NextTargetAction
  message: string
}

/** A routine-originated rep target snapshot (Phase 2F). Either field may be null/absent. */
export interface RepRange {
  min: number | null
  max: number | null
}

/** Builds a "Repeat: ..." suggestion from the previous best, with an optional reason suffix. */
function buildRepeatSuggestion(
  previousBest: WorkoutSet,
  isBodyweight: boolean,
  suffix: string,
  reason?: string
): NextTargetSuggestion {
  const reps = previousBest.reps ?? null
  const reasonText = reason ? ` — ${reason}` : ''

  if (isBodyweight) {
    return {
      action: 'repeat',
      message: reps !== null
        ? `Repeat: ${reps} reps${suffix}${reasonText}`
        : `Repeat last effort${suffix}${reasonText}`,
    }
  }

  const lbs = previousBest.weight_kg ? Math.round(kgToLbs(previousBest.weight_kg)) : null
  if (lbs !== null && reps !== null) {
    return {
      action: 'repeat',
      message: `Repeat: ${lbs} lbs × ${reps}${suffix}${reasonText}`,
    }
  }
  return {
    action: 'repeat',
    message: `Repeat last effort${suffix}${reasonText}`,
  }
}

/**
 * Equipment-aware "increase" suggestion (Phase 2C, extracted as its own
 * function in Phase 2F since range-aware/single-target/ceiling-only/
 * no-range modes all need to trigger it from different rep thresholds).
 * Phase 2R: now takes trackingMode (replacing exerciseType as the
 * source of coaching behavior) and equipment separately -- the
 * machine/cable "try the next setting" case now reads equipment
 * directly instead of the old exercise_type value that duplicated it.
 */
function buildIncreaseSuggestion(
  trackingMode: TrackingMode,
  equipment: ExerciseEquipment | null,
  previousBest: WorkoutSet,
  reps: number,
  suffix: string
): NextTargetSuggestion {
  if (trackingMode === 'cardio' || trackingMode === 'timed') {
    return {
      action: 'no_suggestion',
      message: 'No strength-progression suggestion for this exercise type.',
    }
  }

  if (equipment === 'machine' || equipment === 'cable') {
    return {
      action: 'increase',
      message: `Try the next available setting${suffix}`,
    }
  }

  if (trackingMode === 'bodyweight') {
    const nextReps = reps + SUGGESTED_REP_INCREASE
    return {
      action: 'increase',
      message: `Try: ${nextReps} reps${suffix} next time`,
    }
  }

  // weight_reps with any other/no equipment all use the same +5 lbs
  // suggestion.
  const lbs = previousBest.weight_kg ? Math.round(kgToLbs(previousBest.weight_kg)) : null
  if (lbs !== null) {
    const nextLbs = lbs + SUGGESTED_WEIGHT_INCREASE_LBS
    return {
      action: 'increase',
      message: `Try: ${nextLbs} lbs × ${reps}${suffix} next time`,
    }
  }

  // Defensive fallback: reached increase-eligibility but weight data is
  // unexpectedly missing for a weighted exercise type. Falls back to a
  // conservative repeat rather than a broken message (matches Phase
  // 2C's original behavior of falling through when lbs was null).
  return buildRepeatSuggestion(previousBest, false, suffix, 'log RPE next time for a sharper suggestion')
}

// ── Cardio/timed next-target suggestions (Phase 2U) ──────────────────
// Deliberately separate from buildIncreaseSuggestion/buildRepeatSuggestion
// above -- no reps, no weight, no RPE-based "was high" strength framing.
// Both builders assume previousBest is non-null; the null case is
// handled once in suggestNextTarget's own cardio/timed branch below.

/**
 * cardio's next-target message. When the previous set has a valid
 * pace (duration AND distance both present), recommends repeating the
 * SAME distance "slightly faster than" the previous pace -- no new
 * target pace number is computed or displayed, deliberately avoiding
 * the "impossible precision" the approved spec warns against (a
 * 1-2%-faster target pace often rounds to the exact same M:SS as the
 * current pace for typical durations, which would read as a broken,
 * no-op suggestion). This is the one deterministic rule chosen for
 * the duration+distance case, per the spec's own instruction to pick
 * one and document it. Never simultaneously suggests more distance
 * AND more speed.
 *
 * Otherwise (duration-only, i.e. no valid pace on the previous set)
 * falls back to the fixed duration-increase buckets, verified against
 * all 3 given examples (5:00->5:30, 20:00->21:00, 45:00->47:00).
 */
function buildCardioNextTarget(previousBest: WorkoutSet): NextTargetSuggestion {
  const hasPace = previousBest.duration_seconds !== null && previousBest.duration_seconds > 0
    && previousBest.distance_meters !== null && previousBest.distance_meters > 0

  if (hasPace) {
    const distance = formatDistanceMeters(previousBest.distance_meters)
    const pace = formatPaceSecondsPerMile(previousBest.duration_seconds, previousBest.distance_meters)
    // Both guaranteed non-null here -- hasPace already confirmed
    // duration_seconds and distance_meters are both present and positive.
    return {
      action: 'increase',
      message: `Try the same ${distance} slightly faster than ${pace} next time`,
    }
  }

  const prevDuration = previousBest.duration_seconds
  if (prevDuration === null || prevDuration <= 0) {
    return { action: 'unavailable', message: 'Log a completed set to start tracking targets.' }
  }

  let increase: number
  if (prevDuration < CARDIO_SHORT_THRESHOLD_SEC) increase = CARDIO_SHORT_INCREASE_SEC
  else if (prevDuration <= CARDIO_LONG_THRESHOLD_SEC) increase = CARDIO_MID_INCREASE_SEC
  else increase = CARDIO_LONG_INCREASE_SEC

  return {
    action: 'increase',
    message: `Try ${formatDurationSeconds(prevDuration + increase)} next time`,
  }
}

/**
 * timed's next-target message: duration-only, with an RPE modifier.
 * Prior RPE >= 9 recommends repeating the same duration rather than
 * increasing it -- RPE is used as context to adjust the recommendation
 * conservatively, never as the sole basis for an improved/declined
 * classification (that stays entirely inside
 * trackingAwareProgressSignal). A null prior RPE still produces the
 * normal duration-based recommendation. Verified against all 3 given
 * examples (0:45->0:50, 2:00@RPE7->2:10, 5:54@RPE9->repeat 5:54).
 */
function buildTimedNextTarget(previousBest: WorkoutSet): NextTargetSuggestion {
  const prevDuration = previousBest.duration_seconds
  if (prevDuration === null || prevDuration <= 0) {
    return { action: 'unavailable', message: 'Log a completed set to start tracking targets.' }
  }

  const prevRpe = previousBest.rpe
  if (prevRpe !== null && prevRpe >= TIMED_HIGH_RPE_THRESHOLD) {
    return {
      action: 'repeat',
      message: `Repeat ${formatDurationSeconds(prevDuration)} next time`,
    }
  }

  let increase: number
  if (prevDuration < TIMED_SHORT_THRESHOLD_SEC) increase = TIMED_SHORT_INCREASE_SEC
  else if (prevDuration <= TIMED_LONG_THRESHOLD_SEC) increase = TIMED_MID_INCREASE_SEC
  else increase = TIMED_LONG_INCREASE_SEC

  return {
    action: 'increase',
    message: `Try ${formatDurationSeconds(prevDuration + increase)} next time`,
  }
}

type ResolvedRepTargetMode = 'range' | 'single' | 'ceiling_only' | 'none'

interface ResolvedRepTarget {
  mode: ResolvedRepTargetMode
  floor: number | null    // only meaningful in 'range' mode
  ceiling: number | null  // the effective ceiling/target that triggers "increase"
}

/**
 * Normalizes a routine-originated rep range into one of four modes
 * (Phase 2F), per the approved semantics:
 *   - min < max            -> 'range': true floor + true ceiling
 *   - min === max          -> 'single': one exact target
 *   - only max present     -> 'ceiling_only': true ceiling, global
 *                              LOW_REPS_THRESHOLD as the conservative floor
 *   - only min present     -> 'single': min IS the target (does NOT
 *                              borrow the global 8-rep ceiling)
 *   - neither, or min > max (malformed) -> 'none': exact existing
 *                              Phase 2C global-fallback behavior
 */
export function resolveRepTarget(repRange: RepRange | undefined): ResolvedRepTarget {
  const min = repRange?.min ?? null
  const max = repRange?.max ?? null
  const hasMin = min !== null && min > 0
  const hasMax = max !== null && max > 0

  if (hasMin && hasMax) {
    const realMin = min as number
    const realMax = max as number
    if (realMin > realMax) {
      // Malformed data: ignore both, do not attempt to repair or infer intent.
      return { mode: 'none', floor: null, ceiling: null }
    }
    if (realMin === realMax) {
      return { mode: 'single', floor: null, ceiling: realMin }
    }
    return { mode: 'range', floor: realMin, ceiling: realMax }
  }
  if (hasMax) {
    return { mode: 'ceiling_only', floor: null, ceiling: max as number }
  }
  if (hasMin) {
    return { mode: 'single', floor: null, ceiling: min as number }
  }
  return { mode: 'none', floor: null, ceiling: null }
}

// ── Set-level target feedback (Phase 2G) ────────────────────────────
// Per-set, deterministic execution feedback for the ACTIVE workout —
// distinct from and independent of suggestNextTarget's exercise-level
// "what to try next session" recommendation, and independent of
// evaluateSetPRs' all-time PR detection. All three coexist on the same
// set without one overriding another; combining PR + range feedback
// into one display line is the caller's (SetRow's) job, not this
// function's — this function only describes ONE set's execution
// against its programmed target, nothing about records or trends.

export type RangeStatus = 'below_target' | 'in_range' | 'top_of_range' | 'above_target' | 'no_target'
export type EffortStatus = 'manageable' | 'high' | 'missing' | 'not_applicable'

export interface SetTargetFeedback {
  rangeStatus: RangeStatus
  effortStatus: EffortStatus
  /** Empty string when rangeStatus === 'no_target' — caller renders nothing for this portion. */
  label: string
}

/**
 * Evaluates ONE completed, non-warmup set against its exercise's
 * snapshotted rep target (reused from Phase 2F's resolveRepTarget —
 * no duplicated normalization logic). Reps missing, or trackingMode
 * cardio/timed, both mean no target concept applies here (matches
 * suggestNextTarget's existing 'cardio'/'timed' -> no strength-
 * progression treatment) -> 'no_target', empty label.
 *
 * Effort modifier ("RPE high" / "Log RPE") is only appended to the
 * visible label for 'top_of_range'/'above_target' — a set that's
 * clearly below target doesn't need an RPE callout, since the reps
 * shortfall is already the actionable signal.
 *
 * Caller is responsible for combining this with PR feedback (a
 * completely separate, independent signal) into one display line.
 */
export function evaluateSetTargetFeedback(
  reps: number | null,
  rpe: number | null,
  trackingMode: TrackingMode,
  repRange?: RepRange
): SetTargetFeedback {
  if (trackingMode === 'cardio' || trackingMode === 'timed' || reps === null) {
    return { rangeStatus: 'no_target', effortStatus: 'not_applicable', label: '' }
  }

  const resolved = resolveRepTarget(repRange)
  const effortStatus: EffortStatus =
    rpe === null ? 'missing' : rpe >= RPE_HIGH_THRESHOLD ? 'high' : 'manageable'

  const withEffort = (rangeLabel: string): string =>
    effortStatus === 'high' ? `${rangeLabel} · RPE high`
      : effortStatus === 'missing' ? `${rangeLabel} · Log RPE`
      : rangeLabel // 'manageable' -> no visible modifier

  if (resolved.mode === 'range') {
    const floor = resolved.floor as number
    const ceiling = resolved.ceiling as number
    if (reps < floor) {
      return { rangeStatus: 'below_target', effortStatus, label: `Below ${floor}–${ceiling} target` }
    }
    if (reps === ceiling) {
      return { rangeStatus: 'top_of_range', effortStatus, label: withEffort('Top of range') }
    }
    if (reps > ceiling) {
      return { rangeStatus: 'above_target', effortStatus, label: withEffort(`Above ${floor}–${ceiling} target`) }
    }
    return { rangeStatus: 'in_range', effortStatus, label: 'In range' }
  }

  if (resolved.mode === 'single') {
    const target = resolved.ceiling as number
    if (reps < target) {
      return { rangeStatus: 'below_target', effortStatus, label: `Work toward ${target} reps` }
    }
    if (reps === target) {
      return { rangeStatus: 'top_of_range', effortStatus, label: withEffort('Target reached') }
    }
    return { rangeStatus: 'above_target', effortStatus, label: withEffort(`Above ${target}-rep target`) }
  }

  if (resolved.mode === 'ceiling_only') {
    const ceiling = resolved.ceiling as number
    if (reps < LOW_REPS_THRESHOLD) {
      return { rangeStatus: 'below_target', effortStatus, label: 'Low reps' }
    }
    if (reps === ceiling) {
      return { rangeStatus: 'top_of_range', effortStatus, label: withEffort('Top of range') }
    }
    if (reps > ceiling) {
      return { rangeStatus: 'above_target', effortStatus, label: withEffort(`Above ${ceiling}-rep target`) }
    }
    return { rangeStatus: 'in_range', effortStatus, label: `Work toward ${ceiling} reps` }
  }

  // mode === 'none': no usable routine range (none provided, or malformed min > max)
  return { rangeStatus: 'no_target', effortStatus: 'not_applicable', label: '' }
}

export function suggestNextTarget(
  previousBest: WorkoutSet | null,
  isUnilateral: boolean,
  trackingMode: TrackingMode,
  equipment: ExerciseEquipment | null,
  trend?: ProgressionTrend,
  repRange?: RepRange
): NextTargetSuggestion {
  if (trackingMode === 'cardio' || trackingMode === 'timed') {
    if (!previousBest) {
      return {
        action: 'unavailable',
        message: 'Log a completed set to start tracking targets.',
      }
    }
    return trackingMode === 'cardio'
      ? buildCardioNextTarget(previousBest)
      : buildTimedNextTarget(previousBest)
  }

  if (!previousBest) {
    return {
      action: 'unavailable',
      message: 'Log a working set to start tracking targets.',
    }
  }

  const suffix = isUnilateral ? ' per side' : ''
  // Phase 2C: previously inferred from weight_kg being null/0, which
  // misclassified cardio/mobility exercises (which also have no
  // weight) as bodyweight. Phase 2R: uses the exercise's tracking_mode
  // (the clearer, dedicated replacement for exercise_type) instead.
  const isBodyweight = trackingMode === 'bodyweight'
  const reps = previousBest.reps ?? null
  const rpe = previousBest.rpe ?? null

  // Priority 1-3, unconditional regardless of any routine rep range —
  // unchanged from Phase 2C.
  if (trend === 'stalling') {
    return buildRepeatSuggestion(previousBest, isBodyweight, suffix, 'progress has stalled recently')
  }

  if (rpe !== null && rpe >= RPE_HIGH_THRESHOLD) {
    return buildRepeatSuggestion(previousBest, isBodyweight, suffix, 'RPE was high')
  }

  // Priority 4: routine-aware rep target/range (Phase 2F). Does NOT
  // read workout_exercises.target_reps (the ambiguous collapsed
  // singular value) — only the snapshotted target_reps_min/max the
  // caller passes in as repRange.
  const resolved = resolveRepTarget(repRange)

  if (resolved.mode === 'range') {
    const floor = resolved.floor as number
    const ceiling = resolved.ceiling as number

    if (reps !== null && reps < floor) {
      return buildRepeatSuggestion(previousBest, isBodyweight, suffix, `target range is ${floor}–${ceiling} reps`)
    }
    if (reps !== null && reps >= ceiling) {
      if (rpe !== null && rpe <= MANAGEABLE_RPE_MAX) {
        return buildIncreaseSuggestion(trackingMode, equipment, previousBest, reps, suffix)
      }
      return buildRepeatSuggestion(previousBest, isBodyweight, suffix, 'log RPE next time for a sharper suggestion')
    }
    // floor <= reps < ceiling: genuine progress within the range.
    return buildRepeatSuggestion(previousBest, isBodyweight, suffix, `work toward ${ceiling} reps`)
  }

  if (resolved.mode === 'single') {
    const target = resolved.ceiling as number

    if (reps !== null && reps >= target) {
      if (rpe !== null && rpe <= MANAGEABLE_RPE_MAX) {
        return buildIncreaseSuggestion(trackingMode, equipment, previousBest, reps, suffix)
      }
      return buildRepeatSuggestion(previousBest, isBodyweight, suffix, 'log RPE next time for a sharper suggestion')
    }
    return buildRepeatSuggestion(previousBest, isBodyweight, suffix, `work toward ${target} reps`)
  }

  if (resolved.mode === 'ceiling_only') {
    const ceiling = resolved.ceiling as number

    if (reps !== null && reps < LOW_REPS_THRESHOLD) {
      return buildRepeatSuggestion(previousBest, isBodyweight, suffix, 'reps were low')
    }
    if (reps !== null && reps >= ceiling) {
      if (rpe !== null && rpe <= MANAGEABLE_RPE_MAX) {
        return buildIncreaseSuggestion(trackingMode, equipment, previousBest, reps, suffix)
      }
      return buildRepeatSuggestion(previousBest, isBodyweight, suffix, 'log RPE next time for a sharper suggestion')
    }
    return buildRepeatSuggestion(previousBest, isBodyweight, suffix, `work toward ${ceiling} reps`)
  }

  // mode === 'none': no usable routine range (none provided, or
  // malformed min > max) — exact existing Phase 2C global-fallback
  // behavior, byte-identical.
  if (reps !== null && reps < LOW_REPS_THRESHOLD) {
    return buildRepeatSuggestion(previousBest, isBodyweight, suffix, 'reps were low')
  }

  if (reps !== null && reps >= TOP_OF_RANGE_REPS && rpe !== null && rpe <= MANAGEABLE_RPE_MAX) {
    return buildIncreaseSuggestion(trackingMode, equipment, previousBest, reps, suffix)
  }

  // Ambiguous fallback: RPE missing, or reps in the 6-7 zone with no
  // clear signal either way. Conservative repeat, nudging toward
  // logging RPE for a sharper suggestion next time.
  return buildRepeatSuggestion(
    previousBest,
    isBodyweight,
    suffix,
    'log RPE next time for a sharper suggestion'
  )
}

// ── Exercise history (Phase 2B) ───────────────────────────────────
// Display shape for "last N sessions' best set" for one exercise.
// Populated by fetchExerciseHistory (server.ts) — this file only
// defines the shape and provides the scoring/1RM math it reuses.

export interface ExerciseHistoryEntry {
  workoutDate: string          // 'YYYY-MM-DD'
  weightKg: number | null      // null for a pure bodyweight best set
  reps: number | null
  rpe: number | null
  estimated1RmKg: number | null
  // Phase 2T: cardio/timed history.
  durationSeconds: number | null
  distanceMeters: number | null
}

// ── PR detection (Phase 2C) ─────────────────────────────────────────
// Evaluates completed, non-warmup CURRENT-session sets against a true
// all-time historical baseline (from fetchExercisePRBaseline in
// server.ts). Pure function — does not query anything itself. The
// baseline already excludes the current session, warmups, and
// incomplete/empty sets; this function applies the same exclusion to
// the current session's own sets for symmetry.

export interface PRBaseline {
  maxWeightKg: number | null
  maxEstimated1RmKg: number | null
  maxBodyweightReps: number | null
}

export type PRType = 'weight' | 'estimated_1rm' | 'bodyweight_reps' | null

/**
 * Returns a PRType per set id. Sets are evaluated in set_number order,
 * and the running best is updated after each qualifying set — so a
 * second set in the same session can be recognized as a new record
 * even though it's only beating THIS session's first set, not the
 * original historical baseline (e.g. baseline 195 -> set1 200lbs is a
 * PR -> set2 205lbs is ALSO a PR, since it beats the new 200lbs high).
 *
 * A first-ever qualifying value (no prior baseline for that metric —
 * baseline.maxWeightKg/maxEstimated1RmKg/maxBodyweightReps is null)
 * SILENTLY establishes the running best and is never itself reported
 * as a PR — there was nothing to beat yet. Only a later set that
 * exceeds an already-established baseline counts as a PR.
 *
 * Priority when a single weighted set qualifies for more than one PR
 * type simultaneously: weight PR wins over estimated-1RM PR. A set is
 * never both a weighted PR and a bodyweight-rep PR (mutually
 * exclusive based on whether the set has a real weight).
 */
export function evaluateSetPRs(
  currentSets: WorkoutSet[],
  baseline: PRBaseline
): Record<string, PRType> {
  const result: Record<string, PRType> = {}

  let runningMaxWeightKg = baseline.maxWeightKg
  let runningMaxEstimated1RmKg = baseline.maxEstimated1RmKg
  let runningMaxBodyweightReps = baseline.maxBodyweightReps

  const working = currentSets
    .filter((s) => s.completed && !s.is_warmup && (
      (s.weight_kg !== null && s.weight_kg > 0) || (s.reps !== null && s.reps > 0)
    ))
    .slice()
    .sort((a, b) => a.set_number - b.set_number)

  for (const set of working) {
    let prType: PRType = null

    if (set.weight_kg !== null && set.weight_kg > 0) {
      const hadWeightBaseline = runningMaxWeightKg !== null
      if (runningMaxWeightKg === null || set.weight_kg > runningMaxWeightKg) {
        if (hadWeightBaseline) prType = 'weight'
        runningMaxWeightKg = set.weight_kg
      }

      const rm = set.reps ? epley1RM(set.weight_kg, set.reps) : null
      if (rm !== null) {
        const hadRmBaseline = runningMaxEstimated1RmKg !== null
        if (runningMaxEstimated1RmKg === null || rm > runningMaxEstimated1RmKg) {
          if (hadRmBaseline && prType === null) prType = 'estimated_1rm'
          runningMaxEstimated1RmKg = rm
        }
      }
    } else if (set.reps !== null && set.reps > 0) {
      const hadBwBaseline = runningMaxBodyweightReps !== null
      if (runningMaxBodyweightReps === null || set.reps > runningMaxBodyweightReps) {
        if (hadBwBaseline) prType = 'bodyweight_reps'
        runningMaxBodyweightReps = set.reps
      }
    }

    result[set.id] = prType
  }

  return result
}

// ── Workout completion summary (Phase 2H) ────────────────────────────
// Deterministic, recomputed-every-render summary of one completed
// workout session. Reuses evaluateSetPRs (Phase 2C) and
// evaluateSetTargetFeedback (Phase 2G) exactly -- no duplicated PR or
// range-normalization logic. Pure function over already-loaded session
// data: given the same exercises + PR baseline, always produces the
// same summary, so reopening a completed workout later shows identical
// output with no persisted summary blob.

const MAX_HIGHLIGHTS = 3
const MAX_ATTENTION = 3
const MIN_SETS_FOR_AGGREGATE_RULE = 2

export interface WorkoutTargetCounts {
  belowTarget: number
  inRange: number
  topOfRange: number
  aboveTarget: number
  evaluated: number
}

export interface WorkoutEffortSummary {
  averageRpe: number | null
  loggedRpeCount: number
  missingRpeCount: number
  highEffortCount: number
}

export interface ExerciseCompletionSummary {
  workoutExerciseId: string
  exerciseName: string
  // Phase 2T: needed so the "log RPE for better coaching" attention
  // rule below can exclude cardio -- RPE is not a collectible field
  // for cardio (Phase 2S), so every cardio exercise would otherwise
  // trivially satisfy "100% missing RPE" and always trigger this
  // suggestion, even though logging RPE isn't possible for it.
  trackingMode: TrackingMode
  completedWorkingSets: number
  targetCounts: WorkoutTargetCounts
  highEffortCount: number
  missingRpeCount: number
  prSetCount: number
}

export interface WorkoutCompletionSummary {
  exerciseCount: number
  completedExerciseCount: number
  workingSetCount: number
  targetCounts: WorkoutTargetCounts
  effort: WorkoutEffortSummary
  prSetCount: number
  exerciseSummaries: ExerciseCompletionSummary[]
  highlights: string[]
  attention: string[]
}

function emptyTargetCounts(): WorkoutTargetCounts {
  return { belowTarget: 0, inRange: 0, topOfRange: 0, aboveTarget: 0, evaluated: 0 }
}

/**
 * Summarizes one workout session deterministically from data already
 * loaded on the workout detail page (exercises with their nested
 * workout_sets, plus the same PR baseline map already fetched for the
 * active-workout PR badges) -- no new queries.
 *
 * "Completed working set" = completed && !is_warmup, the exact same
 * filter every other Phase 2C/2G caller already uses. An exercise
 * counts as completed when it has at least one completed working set
 * -- this is a session-summary definition only; it does not replace
 * WorkoutExerciseBlock's own "X/Y sets done" display.
 *
 * cardio/mobility exercises and sets with no usable rep-range snapshot
 * both already resolve to rangeStatus 'no_target' inside
 * evaluateSetTargetFeedback -- they still count toward
 * exerciseCount/workingSetCount, but contribute nothing to
 * targetCounts, with zero special-casing needed here.
 */
export function summarizeWorkout(
  exercises: WorkoutExerciseWithDetails[],
  prBaselineByExerciseId: Record<string, PRBaseline>
): WorkoutCompletionSummary {
  const exerciseCount = exercises.length
  let completedExerciseCount = 0
  let workingSetCount = 0
  const targetCounts = emptyTargetCounts()
  let rpeSum = 0
  let loggedRpeCount = 0
  let missingRpeCount = 0
  let highEffortCount = 0
  let prSetCount = 0

  const exerciseSummaries: ExerciseCompletionSummary[] = []

  for (const we of exercises) {
    const sets = (we.workout_sets ?? []) as WorkoutSet[]
    const workingSets = sets.filter((s) => s.completed && !s.is_warmup)

    if (workingSets.length === 0) continue // not "completed" per this summary's definition

    completedExerciseCount++
    workingSetCount += workingSets.length

    const repRange: RepRange = { min: we.target_reps_min ?? null, max: we.target_reps_max ?? null }
    const baseline: PRBaseline = prBaselineByExerciseId[we.exercise_id] ?? {
      maxWeightKg: null,
      maxEstimated1RmKg: null,
      maxBodyweightReps: null,
    }
    const setPRs = evaluateSetPRs(workingSets, baseline)

    const exTargetCounts = emptyTargetCounts()
    let exHighEffort = 0
    let exMissingRpe = 0
    let exPrSetCount = 0

    for (const s of workingSets) {
      const feedback = evaluateSetTargetFeedback(s.reps, s.rpe, we.exercise.tracking_mode, repRange)
      if (feedback.rangeStatus !== 'no_target') {
        targetCounts.evaluated++
        exTargetCounts.evaluated++
        if (feedback.rangeStatus === 'below_target') { targetCounts.belowTarget++; exTargetCounts.belowTarget++ }
        else if (feedback.rangeStatus === 'in_range') { targetCounts.inRange++; exTargetCounts.inRange++ }
        else if (feedback.rangeStatus === 'top_of_range') { targetCounts.topOfRange++; exTargetCounts.topOfRange++ }
        else if (feedback.rangeStatus === 'above_target') { targetCounts.aboveTarget++; exTargetCounts.aboveTarget++ }
      }

      if (s.rpe !== null) {
        rpeSum += s.rpe
        loggedRpeCount++
        if (s.rpe >= RPE_HIGH_THRESHOLD) { highEffortCount++; exHighEffort++ }
      } else {
        missingRpeCount++
        exMissingRpe++
      }

      if (setPRs[s.id]) { prSetCount++; exPrSetCount++ }
    }

    exerciseSummaries.push({
      workoutExerciseId: we.id,
      exerciseName: we.exercise.name,
      trackingMode: we.exercise.tracking_mode,
      completedWorkingSets: workingSets.length,
      targetCounts: exTargetCounts,
      highEffortCount: exHighEffort,
      missingRpeCount: exMissingRpe,
      prSetCount: exPrSetCount,
    })
  }

  // ── Highlights: at most one per exercise, priority A -> B -> C ──────
  const highlights: string[] = []
  for (const ex of exerciseSummaries) {
    if (highlights.length >= MAX_HIGHLIGHTS) break

    if (ex.prSetCount > 0) {
      highlights.push(`${ex.exerciseName}: ${ex.prSetCount} PR set${ex.prSetCount !== 1 ? 's' : ''}`)
      continue
    }

    const metOrExceeded = ex.targetCounts.inRange + ex.targetCounts.topOfRange + ex.targetCounts.aboveTarget
    if (ex.targetCounts.evaluated >= MIN_SETS_FOR_AGGREGATE_RULE && metOrExceeded === ex.targetCounts.evaluated) {
      highlights.push(`${ex.exerciseName}: all evaluated sets met the target`)
      continue
    }

    const topOrAbove = ex.targetCounts.topOfRange + ex.targetCounts.aboveTarget
    if (topOrAbove >= MIN_SETS_FOR_AGGREGATE_RULE) {
      highlights.push(`${ex.exerciseName}: ${topOrAbove} sets reached or exceeded the top target`)
      continue
    }
  }

  // ── Attention: at most one per exercise, priority A -> B -> C ───────
  const attention: string[] = []
  for (const ex of exerciseSummaries) {
    if (attention.length >= MAX_ATTENTION) break

    if (ex.targetCounts.belowTarget >= MIN_SETS_FOR_AGGREGATE_RULE) {
      attention.push(`${ex.exerciseName}: ${ex.targetCounts.belowTarget} sets below target`)
      continue
    }

    if (ex.highEffortCount >= MIN_SETS_FOR_AGGREGATE_RULE) {
      attention.push(`${ex.exerciseName}: ${ex.highEffortCount} high-effort sets`)
      continue
    }

    // Phase 2T: cardio structurally never has RPE (Phase 2S rejects it),
    // so without this exclusion every cardio exercise would trivially
    // satisfy "100% missing RPE" and always trigger this suggestion --
    // an impossible-to-act-on message for a mode that can't log RPE at
    // all. Timed remains eligible: RPE is optional but real for timed.
    if (
      ex.trackingMode !== 'cardio' &&
      ex.completedWorkingSets > 0 &&
      ex.missingRpeCount === ex.completedWorkingSets
    ) {
      attention.push(`${ex.exerciseName}: log RPE for better coaching`)
      continue
    }
  }

  return {
    exerciseCount,
    completedExerciseCount,
    workingSetCount,
    targetCounts,
    effort: {
      averageRpe: loggedRpeCount > 0 ? Math.round((rpeSum / loggedRpeCount) * 10) / 10 : null,
      loggedRpeCount,
      missingRpeCount,
      highEffortCount,
    },
    prSetCount,
    exerciseSummaries,
    highlights,
    attention,
  }
}

// ── Weekly muscle volume ──────────────────────────────────────────

export function weeklyMuscleVolume(
  sessions: Array<{ workout_exercises: Array<{
    exercise: { primary_muscle: string }
    workout_sets: Array<{ completed: boolean; is_warmup: boolean }>
  }> }>
): Record<string, number> {
  const vol: Record<string, number> = {}
  for (const session of sessions) {
    for (const we of session.workout_exercises ?? []) {
      const muscle = we.exercise?.primary_muscle
      if (!muscle) continue
      const working = (we.workout_sets ?? []).filter((s) => s.completed && !s.is_warmup)
      vol[muscle] = (vol[muscle] ?? 0) + working.length
    }
  }
  return vol
}

// ── Duration + display helpers ────────────────────────────────────

/**
 * Formats a workout's duration for display (Phase 1E, extended Phase
 * 2J). Precedence:
 *   1. completedDurationSeconds, if provided -- the persisted duration
 *      from first completion. Takes priority over everything else,
 *      including a currently-null end_time, so a workout reopened for
 *      correction (Phase 2I clears end_time on reopen) still shows its
 *      original completed duration instead of a live-elapsed value
 *      inflating for as long as the correction sits open.
 *   2. Otherwise, the original start_time -> end_time (or "now" if
 *      end_time is still null, i.e. a genuinely active session)
 *      behavior, unchanged from before Phase 2J.
 */
export function formatWorkoutDuration(
  startTime: string | null,
  endTime: string | null,
  completedDurationSeconds?: number | null
): string | null {
  if (completedDurationSeconds !== null && completedDurationSeconds !== undefined) {
    const mins = Math.round(completedDurationSeconds / 60)
    if (mins < 1)  return null
    if (mins < 60) return `${mins}m`
    return `${Math.floor(mins / 60)}h ${mins % 60}m`
  }
  if (!startTime) return null
  const end  = endTime ? new Date(endTime) : new Date()
  const mins = Math.round((end.getTime() - new Date(startTime).getTime()) / 60000)
  if (mins < 1)  return null
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

/**
 * Computes a definite duration in seconds between two known ISO
 * timestamps (Phase 2J). Distinct from formatWorkoutDuration -- this
 * is the route-side persistence calculation used exactly once, at
 * first completion, to populate completed_duration_seconds. Always
 * non-negative; never returns null (both inputs are assumed present
 * and valid, unlike the nullable/live-fallback display formatter).
 */
export function computeDurationSeconds(startIso: string, endIso: string): number {
  return Math.max(0, Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 1000))
}

/** Generate a session title from a workout date ISO string using date-fns. */
export function autoTitle(dateISO: string): string {
  // parseISO + format is consistent with the rest of the app (date-fns everywhere)
  return format(parseISO(dateISO), 'EEE, MMM d')
}

/** Convert stored kg to display-friendly integer lbs. */
export function displayWeight(kg: number | null): number | null {
  if (kg === null) return null
  return Math.round(kgToLbs(kg))
}

// ── Phase 5A.2: provenance-aware status label ──────────────────────
// A manual-source in_progress session with a frozen duration is a
// HISTORICAL-ENTRY / correction state, not a workout the user is
// currently performing. The stored status stays 'in_progress' (the
// active-session definition — in_progress AND null duration — is
// untouched); only the user-facing label distinguishes it. The same
// tuple also matches a reopened manual workout, which is why the
// label is the universally truthful 'Editing workout' rather than
// 'Logging past workout'. Shared by SessionHeader and SessionCard so
// the condition lives in exactly one place.

import { WORKOUT_STATUS_LABELS } from '@/lib/constants'

export function workoutStatusLabel(session: {
  status: string
  source?: string | null
  completed_duration_seconds?: number | null
}): string {
  if (
    session.source === 'manual' &&
    session.status === 'in_progress' &&
    session.completed_duration_seconds != null
  ) {
    return 'Editing workout'
  }
  return WORKOUT_STATUS_LABELS[session.status] ?? session.status
}

// ── Phase 5A.2: manual/historical workout validation ───────────────
// Pure, deterministic validation for Log past workout and the manual
// metadata correction PATCH. The date and time inputs are the user's
// LOCAL wall-clock intent: they are combined and parsed exactly once
// with `new Date('YYYY-MM-DDTHH:mm')` (local interpretation) — no 'Z'
// suffix, no timezone-offset arithmetic. workout_date persists the
// entered local calendar date verbatim, so an evening or
// just-before-midnight workout never shifts dates through UTC.

/** Clock-skew tolerance only — not a grace window for future workouts. */
export const MANUAL_WORKOUT_FUTURE_TOLERANCE_MS = 2 * 60 * 1000

/** Generous finite bound for the WORKOUT model specifically (24h).
 *  Phase 5A.3 activity sessions define their own semantics. */
export const MANUAL_WORKOUT_MAX_DURATION_MINUTES = 1440

export type ManualWorkoutMetadataValidation =
  | {
      ok: true
      workoutDate: string
      startedAt: Date
      endedAt: Date
      durationSeconds: number
      caloriesBurned: number | null
    }
  | { ok: false; error: string }

export function validateManualWorkoutMetadata(
  input: {
    workoutDate: unknown
    startTime: unknown
    durationMinutes: unknown
    caloriesBurned?: unknown
  },
  now: Date = new Date()
): ManualWorkoutMetadataValidation {
  const { workoutDate, startTime, durationMinutes, caloriesBurned } = input

  if (typeof workoutDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(workoutDate)) {
    return { ok: false, error: 'Enter a valid workout date.' }
  }
  if (typeof startTime !== 'string' || !/^\d{2}:\d{2}$/.test(startTime)) {
    return { ok: false, error: 'Enter a valid start time.' }
  }
  // Single local parse of the combined date + time (never UTC-shifted).
  const startedAt = new Date(`${workoutDate}T${startTime}`)
  if (isNaN(startedAt.getTime())) {
    return { ok: false, error: 'Enter a valid workout date and start time.' }
  }
  if (startedAt.getTime() > now.getTime() + MANUAL_WORKOUT_FUTURE_TOLERANCE_MS) {
    return { ok: false, error: 'Start time cannot be in the future.' }
  }

  const minutes = Number(durationMinutes)
  if (!Number.isInteger(minutes) || minutes <= 0) {
    return { ok: false, error: 'Duration must be at least 1 minute.' }
  }
  if (minutes > MANUAL_WORKOUT_MAX_DURATION_MINUTES) {
    return { ok: false, error: 'Duration cannot exceed 24 hours.' }
  }

  // NULL = not recorded; 0 = explicitly recorded as zero. An empty
  // field clears back to NULL.
  let calories: number | null = null
  if (caloriesBurned !== undefined && caloriesBurned !== null && caloriesBurned !== '') {
    const n = Number(caloriesBurned)
    if (!Number.isInteger(n) || n < 0) {
      return { ok: false, error: 'Calories must be a whole number of 0 or more.' }
    }
    calories = n
  }

  const durationSeconds = minutes * 60
  const endedAt = new Date(startedAt.getTime() + durationSeconds * 1000)

  return { ok: true, workoutDate, startedAt, endedAt, durationSeconds, caloriesBurned: calories }
}

// ── Phase 5A.2 QA correction: explicit 12-hour time segments ───────
// Safari's segmented native time control can LOOK fully populated
// while one segment is still uncommitted, reporting an empty value —
// so the manual-workout forms use explicit Hour / Minute / AM-PM
// selects instead. These pure helpers convert between the segments
// and the local 24-hour 'HH:mm' contract the shared validation and
// the server already use. No timezone logic here — the composed
// string stays a LOCAL wall-clock value.

/** Compose explicit 12-hour segments into local 'HH:mm'.
 *  Returns null while any segment is missing or out of range — an
 *  incomplete control must never serialize into a misleading value. */
export function composeTime12To24(
  hour12: string,
  minute: string,
  meridiem: string
): string | null {
  if (!hour12 || !minute || !meridiem) return null
  const h = Number(hour12)
  const m = Number(minute)
  if (!Number.isInteger(h) || h < 1 || h > 12) return null
  if (!Number.isInteger(m) || m < 0 || m > 59) return null
  if (meridiem !== 'AM' && meridiem !== 'PM') return null
  // 12 AM -> 00, 12 PM -> 12, 1 PM -> 13, 11 PM -> 23
  let h24 = h % 12
  if (meridiem === 'PM') h24 += 12
  return `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** Split a local 24-hour 'HH:mm' into 12-hour segments for prefill. */
export function splitTime24To12(
  hhmm: string
): { hour12: string; minute: string; meridiem: 'AM' | 'PM' } | null {
  const match = /^(\d{2}):(\d{2})$/.exec(hhmm)
  if (!match) return null
  const h = Number(match[1])
  if (h > 23 || Number(match[2]) > 59) return null
  const meridiem: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return { hour12: String(h12), minute: match[2], meridiem }
}
