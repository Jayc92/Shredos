// ============================================================
// ShredOS — Workout Utilities
// ============================================================

import { format, parseISO } from 'date-fns'
import { kgToLbs } from '@/lib/units'
import type { WorkoutSet } from '@/types/database'
import type { ProgressSignal } from '@/types/app'

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
function setScore(s: WorkoutSet): number {
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
