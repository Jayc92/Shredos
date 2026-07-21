// ============================================================
// ShredOS — Weigh-in Utilities
// ============================================================
// No daily pressure. Supports weekly, biweekly, or manual cadence.
// Trend confidence requires 3–4 weigh-ins before strong recommendations.
// ============================================================

import { addDays, addWeeks, nextDay, isAfter, startOfDay } from 'date-fns'
import type { TrendConfidence } from '@/types/app'
import type { WeighInCadence } from '@/types/database'
import { kgToLbs } from '@/lib/units'
import { CUTTING_GOALS } from '@/lib/coach-constants'

// Goals where an upward weight trend is generally the expected/desired
// direction. Kept local to this file rather than added to
// coach-constants.ts — it's a weigh-in-display framing rule, not a
// nutrition-coaching gate like CUTTING_GOALS.
const GAINING_GOALS = ['muscle_gain', 'strength'] as const

// ── Trend confidence ─────────────────────────────────────────────

/**
 * Returns trend confidence based on cadence and number of recorded weigh-ins.
 *
 * Rules:
 *   Weekly:    < 2 → low, < 4 → medium, ≥ 4 → high
 *   Biweekly:  < 2 → low, < 4 → medium, ≥ 4 → high
 *   Manual:    < 3 → low, < 6 → medium, ≥ 6 → high
 *
 * No aggressive recommendations are made below 'high'.
 */
export function getTrendConfidence(
  cadence: WeighInCadence,
  weighInCount: number
): TrendConfidence {
  if (weighInCount === 0) return 'none'

  if (cadence === 'weekly') {
    if (weighInCount < 2) return 'low'
    if (weighInCount < 4) return 'medium'
    return 'high'
  }

  if (cadence === 'biweekly') {
    if (weighInCount < 2) return 'low'
    if (weighInCount < 4) return 'medium'
    return 'high'
  }

  // manual
  if (weighInCount < 3) return 'low'
  if (weighInCount < 6) return 'medium'
  return 'high'
}

/** Human-readable confidence label and coaching note */
export function confidenceLabel(confidence: TrendConfidence): {
  label: string
  color: string
  note: string
} {
  switch (confidence) {
    case 'none':
      return {
        label: 'No data',
        color: 'text-muted-foreground',
        note: 'Log your first weigh-in to start tracking trends.',
      }
    case 'low':
      return {
        label: 'Low confidence',
        color: 'text-amber-400',
        note: 'Need more weigh-ins before making any recommendations. Keep logging.',
      }
    case 'medium':
      return {
        label: 'Building confidence',
        color: 'text-yellow-400',
        note: 'Trend is forming. A few more weigh-ins before strong recommendations.',
      }
    case 'high':
      return {
        label: 'High confidence',
        color: 'text-green-400',
        note: 'Enough data for reliable trend analysis and coaching recommendations.',
      }
  }
}

// ── Next weigh-in date ────────────────────────────────────────────

/**
 * Calculate the next scheduled weigh-in date.
 * Returns null for manual cadence (no scheduled date).
 *
 * For weekly/biweekly: finds the next occurrence of preferredDay
 * that is at least intervalDays from the last weigh-in (or today
 * if no previous weigh-in).
 */
export function getNextWeighInDate(
  cadence: WeighInCadence,
  lastWeighInDate: Date | null,
  preferredDay: number // 0=Sun … 6=Sat
): Date | null {
  if (cadence === 'manual') return null

  const intervalDays = cadence === 'biweekly' ? 14 : 7
  const base = lastWeighInDate ?? new Date()

  // The earliest the next weigh-in can be
  const earliest = addDays(startOfDay(base), intervalDays)

  // Find the next occurrence of preferredDay on or after earliest
  const dayMap: Record<number, Parameters<typeof nextDay>[1]> = {
    0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6,
  }

  const candidate = nextDay(earliest, dayMap[preferredDay])

  // nextDay returns same day if earliest IS that day
  // If candidate is before earliest, add 7 days
  return isAfter(candidate, earliest) || candidate.getTime() === earliest.getTime()
    ? candidate
    : addWeeks(candidate, 1)
}

// ── Weight change display ─────────────────────────────────────────

export interface WeightChange {
  kg: number
  lbs: number
  direction: 'down' | 'up' | 'same'
  label: string   // e.g. "−1.2 lbs"
}

export function computeWeightChange(
  latestKg: number,
  previousKg: number
): WeightChange {
  const changeKg = latestKg - previousKg
  const changeLbs = kgToLbs(changeKg)

  const direction: WeightChange['direction'] =
    Math.abs(changeLbs) < 0.1 ? 'same' : changeKg < 0 ? 'down' : 'up'

  const sign = changeKg < 0 ? '−' : '+'
  const label = direction === 'same' ? '±0 lbs' : `${sign}${Math.abs(changeLbs).toFixed(1)} lbs`

  return { kg: changeKg, lbs: changeLbs, direction, label }
}

// ── Goal-aware framing ───────────────────────────────────────────

export interface WeightChangeFraming {
  color: string   // Tailwind class
  note: string    // short, non-judgmental trend descriptor
}

/**
 * Frames a weight-change direction relative to the user's goal, without
 * "good/bad" language:
 *   - fat_loss / recomposition (CUTTING_GOALS): down = positive framing,
 *     up = cautious framing — preserves the original green/amber choice.
 *   - muscle_gain / strength (GAINING_GOALS): up = positive framing,
 *     down = cautious (not shameful) framing — the inverse of cutting.
 *   - maintenance / running / unknown: neutral regardless of direction.
 *     No color implies a judgment either way.
 */
export function getGoalAwareWeightChangeFraming(
  direction: WeightChange['direction'],
  userGoal: string | null
): WeightChangeFraming {
  const isCutting = CUTTING_GOALS.includes(userGoal as typeof CUTTING_GOALS[number])
  const isGaining = GAINING_GOALS.includes(userGoal as typeof GAINING_GOALS[number])

  const noteFor = (d: WeightChange['direction']): string =>
    d === 'down' ? 'Trending down' : d === 'up' ? 'Trending up' : 'Holding steady'

  if (isCutting) {
    if (direction === 'down') return { color: 'text-green-400', note: noteFor(direction) }
    if (direction === 'up')   return { color: 'text-amber-400', note: noteFor(direction) }
    return { color: 'text-muted-foreground', note: noteFor(direction) }
  }

  if (isGaining) {
    if (direction === 'up')   return { color: 'text-green-400', note: noteFor(direction) }
    if (direction === 'down') return { color: 'text-amber-400', note: noteFor(direction) }
    return { color: 'text-muted-foreground', note: noteFor(direction) }
  }

  // maintenance / running / unknown goal — neutral regardless of direction
  return { color: 'text-muted-foreground', note: noteFor(direction) }
}
