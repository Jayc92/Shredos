// ============================================================
// ShredOS — Workout Utilities
// ============================================================

import { format, parseISO } from 'date-fns'
import { kgToLbs } from '@/lib/units'
import type { WorkoutSet, ExerciseType } from '@/types/database'
import type { ProgressSignal } from '@/types/app'
import type { ProgressionTrend } from '@/lib/workout-coach'

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

export function buildPreviousBestSummary(best: WorkoutSet | null): string {
  if (!best) return ''

  // Bodyweight exercise
  if (!best.weight_kg || best.weight_kg === 0) {
    return best.reps ? `${best.reps} reps` : ''
  }

  // Weighted exercise
  const lbs = Math.round(kgToLbs(best.weight_kg))
  const rm   = best.reps ? epley1RM(best.weight_kg, best.reps) : null
  const parts: string[] = []
  if (best.reps) parts.push(`${lbs} lbs × ${best.reps}`)
  else parts.push(`${lbs} lbs`)
  if (rm) parts.push(`est. 1RM ${Math.round(kgToLbs(rm))} lbs`)
  return parts.join(' · ')
}

export function formatPreviousBest(best: WorkoutSet | null): string {
  if (!best) return 'No prior data'
  return buildPreviousBestSummary(best)
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
 * Unchanged mechanism from Phase 2C — same amounts, same equipment
 * switch, same defensive fallback when weight data is unexpectedly
 * missing.
 */
function buildIncreaseSuggestion(
  exerciseType: ExerciseType,
  previousBest: WorkoutSet,
  reps: number,
  suffix: string
): NextTargetSuggestion {
  if (exerciseType === 'cardio' || exerciseType === 'mobility') {
    return {
      action: 'no_suggestion',
      message: 'No strength-progression suggestion for this exercise type.',
    }
  }

  if (exerciseType === 'machine' || exerciseType === 'cable') {
    return {
      action: 'increase',
      message: `Try the next available setting${suffix}`,
    }
  }

  if (exerciseType === 'bodyweight') {
    const nextReps = reps + SUGGESTED_REP_INCREASE
    return {
      action: 'increase',
      message: `Try: ${nextReps} reps${suffix} next time`,
    }
  }

  // barbell, dumbbell, strength (default), and any other type all use
  // the same +5 lbs suggestion.
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
function resolveRepTarget(repRange: RepRange | undefined): ResolvedRepTarget {
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

export function suggestNextTarget(
  previousBest: WorkoutSet | null,
  isUnilateral: boolean,
  exerciseType: ExerciseType,
  trend?: ProgressionTrend,
  repRange?: RepRange
): NextTargetSuggestion {
  if (!previousBest) {
    return {
      action: 'unavailable',
      message: 'Log a working set to start tracking targets.',
    }
  }

  const suffix = isUnilateral ? ' per side' : ''
  // Phase 2C: previously inferred from weight_kg being null/0, which
  // misclassified cardio/mobility exercises (which also have no
  // weight) as bodyweight. Now uses the exercise's actual type.
  const isBodyweight = exerciseType === 'bodyweight'
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
        return buildIncreaseSuggestion(exerciseType, previousBest, reps, suffix)
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
        return buildIncreaseSuggestion(exerciseType, previousBest, reps, suffix)
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
        return buildIncreaseSuggestion(exerciseType, previousBest, reps, suffix)
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
    return buildIncreaseSuggestion(exerciseType, previousBest, reps, suffix)
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

export function formatWorkoutDuration(startTime: string | null, endTime: string | null): string | null {
  if (!startTime) return null
  const end  = endTime ? new Date(endTime) : new Date()
  const mins = Math.round((end.getTime() - new Date(startTime).getTime()) / 60000)
  if (mins < 1)  return null
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
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
