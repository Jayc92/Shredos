// ============================================================
// ShredOS — Workout Utilities
// ============================================================

import { kgToLbs } from '@/lib/units'
import type { WorkoutSet, WorkoutSession } from '@/types/database'
import type { ProgressSignal } from '@/types/app'

// ── Epley 1RM ─────────────────────────────────────────────────────

/**
 * Epley formula: weight × (1 + reps / 30).
 * Returns null for bodyweight sets, reps outside 1–12, or reps=1.
 */
export function epley1RM(weightKg: number, reps: number): number | null {
  if (weightKg <= 0 || reps < 1 || reps > 12) return null
  if (reps === 1) return weightKg
  return Math.round(weightKg * (1 + reps / 30) * 10) / 10
}

// ── Best set selection ────────────────────────────────────────────

export function bestSet(sets: WorkoutSet[]): WorkoutSet | null {
  const working = sets.filter(
    (s) => s.completed && !s.is_warmup && s.weight_kg !== null && s.weight_kg > 0
  )
  if (working.length === 0) return null
  return working.reduce((best, s) => {
    const score = epley1RM(s.weight_kg!, s.reps ?? 0) ?? (s.weight_kg ?? 0)
    const bestScore = epley1RM(best.weight_kg!, best.reps ?? 0) ?? (best.weight_kg ?? 0)
    return score > bestScore ? s : best
  })
}

// ── Progressive overload signal ───────────────────────────────────

export function progressSignal(
  currentBest: WorkoutSet | null,
  previousBest: WorkoutSet | null
): ProgressSignal {
  if (!previousBest) return 'new'
  if (!currentBest) return 'same'
  const curr = epley1RM(currentBest.weight_kg!, currentBest.reps ?? 0) ?? (currentBest.weight_kg ?? 0)
  const prev = epley1RM(previousBest.weight_kg!, previousBest.reps ?? 0) ?? (previousBest.weight_kg ?? 0)
  if (prev === 0) return 'new'
  if (curr > prev * 1.01) return 'improved'
  if (curr < prev * 0.99) return 'declined'
  return 'same'
}

export function progressLabel(signal: ProgressSignal): string {
  switch (signal) {
    case 'improved': return '\u2191 Improved'
    case 'declined': return '\u2193 Declined'
    case 'same':     return '\u2192 Same'
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

export function buildPreviousBestSummary(best: WorkoutSet | null): string {
  if (!best) return ''
  const lbs = best.weight_kg ? Math.round(kgToLbs(best.weight_kg)) : null
  const rm = best.weight_kg && best.reps ? epley1RM(best.weight_kg, best.reps) : null
  const parts: string[] = []
  if (lbs && best.reps) parts.push(`${lbs} lbs x ${best.reps}`)
  else if (lbs) parts.push(`${lbs} lbs`)
  else if (best.reps) parts.push(`${best.reps} reps`)
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
  const end = endTime ? new Date(endTime) : new Date()
  const mins = Math.round((end.getTime() - new Date(startTime).getTime()) / 60000)
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

export function autoTitle(dateISO: string): string {
  const d = new Date(dateISO + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })
}

export function displayWeight(kg: number | null): number | null {
  if (kg === null) return null
  return Math.round(kgToLbs(kg))
}
