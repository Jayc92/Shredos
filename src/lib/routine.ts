// ============================================================
// ShredOS — Routine Utilities
// ============================================================

import { format, parseISO } from 'date-fns'
import { kgToLbs } from '@/lib/units'
import type { WorkoutRoutineExercise } from '@/types/database'

// ── Session title ─────────────────────────────────────────────────

/** "Push Day — Jun 9" — used when starting a session from a routine */
export function buildSessionTitle(routineName: string, dateISO: string): string {
  return `${routineName} — ${format(parseISO(dateISO), 'MMM d')}`
}

// ── Rep range formatting ──────────────────────────────────────────

/** "3 × 8–12" or "3 × 10" or "3 sets" depending on what is set */
export function formatRepRange(re: WorkoutRoutineExercise): string {
  const setPart = re.target_sets ? `${re.target_sets} ×` : null
  const repPart = (() => {
    if (re.target_reps_min && re.target_reps_max && re.target_reps_min !== re.target_reps_max) {
      return `${re.target_reps_min}–${re.target_reps_max}`
    }
    const r = re.target_reps_min ?? re.target_reps_max
    return r ? String(r) : null
  })()
  return [setPart, repPart].filter(Boolean).join(' ')
}

// ── Rest time formatting ──────────────────────────────────────────

/** "90s" or "2m" or "2m 30s" */
export function formatRestSeconds(seconds: number | null): string | null {
  if (!seconds || seconds <= 0) return null
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s ? `${m}m ${s}s` : `${m}m`
}

// ── Combined target summary ───────────────────────────────────────

/** "3 × 8–12 · 185 lbs · RPE 7 · 90s rest" */
export function formatRoutineTarget(re: WorkoutRoutineExercise): string {
  const parts: string[] = []
  const reps = formatRepRange(re)
  if (reps) parts.push(reps)
  if (re.target_weight_kg) {
    parts.push(`${Math.round(kgToLbs(re.target_weight_kg))} lbs`)
  }
  if (re.target_rpe) parts.push(`RPE ${re.target_rpe}`)
  const rest = formatRestSeconds(re.rest_seconds)
  if (rest) parts.push(`${rest} rest`)
  return parts.join(' · ')
}

// ── Routine meta label helpers ────────────────────────────────────

export function goalLabel(goal: string | null): string | null {
  if (!goal) return null
  return goal.charAt(0).toUpperCase() + goal.slice(1)
}

export function muscleFocusLabel(focus: string | null): string | null {
  if (!focus) return null
  return focus === 'full_body' ? 'Full body' : focus.charAt(0).toUpperCase() + focus.slice(1)
}
