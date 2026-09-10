// ============================================================
// ShredOS — Recent PRs tiles (W10.5-A ruling 6)
//
// The /progress "Recent PRs" card merges two PR models that can never
// overlap: strength PR events (strength-records.ts, whose explicit mode list
// admits weight_reps/bodyweight exercises only) and Weight-time PR events
// (weight-time-records.ts, weight_time exercises only). Because an
// exercise has exactly one tracking mode, no set can be counted by both
// models; the tile keys carry the model name so a collision is
// impossible even in principle.
//
// Merge rule — deterministic and order-preserving: both inputs arrive
// most-recent-first from their own readers (each already capped at its
// reader's RECENT_PR_DISPLAY_CAP of 10). The merge walks both lists by
// workout_date descending; on an equal date the STRENGTH event goes first
// and each list's own internal order is kept, so with zero weight_time
// events the output is exactly the legacy strength list — same order,
// same count, same labels and values (the pre-W8 inline mapping is
// reproduced verbatim in strengthPRTile). The merged list is then capped
// at RECENT_PR_TILE_CAP: because each source is itself capped at 10, the
// union's ten most recent are exact.
//
// Pure — no queries, no dates, no randomness — so
// scripts/verify-weight-time-w10-5-stabilization.ts executes it directly.
// ============================================================

import { kgToLbs } from '@/lib/units'
import { formatDurationSeconds, formatAddedWeightLb } from '@/lib/workout'
import type { PREvent } from '@/lib/strength-records'
import type { WeightTimePREvent } from '@/lib/weight-time-records'

/** The explicit cap of the merged list (each source reader caps at 10 as well). */
export const RECENT_PR_TILE_CAP = 10

export interface RecentPRTile {
  /** Model-prefixed, unique within the merged list. */
  key: string
  model: 'strength' | 'weight_time'
  typeLabel: string
  workoutDate: string
  exerciseName: string
  valueText: string
}

/** The pre-W8 /progress mapping of a strength PR event, verbatim (Phase 2D copy). */
export function strengthPRTile(event: PREvent): RecentPRTile {
  const suffix = event.isUnilateral ? ' per side' : ''
  const typeLabel =
    event.type === 'weight' ? 'Weight PR'
    : event.type === 'estimated_1rm' ? 'Est. 1RM PR'
    : 'Rep PR'
  const valueText =
    event.type === 'weight'
      ? `${Math.round(kgToLbs(event.weightKg as number))} lbs${
          event.reps !== null ? ` × ${event.reps}` : ''
        }${suffix}`
      : event.type === 'estimated_1rm'
      ? `${Math.round(kgToLbs(event.estimated1RmKg as number))} lbs${suffix}`
      : `${event.reps} reps${suffix}`
  return {
    key: `strength:${event.exerciseId}:${event.workoutDate}:${event.type}`,
    model: 'strength',
    typeLabel,
    workoutDate: event.workoutDate,
    exerciseName: event.exerciseName,
    valueText,
  }
}

/** A Weight-time PR event as a tile: both dimensions, the O5 phrase, the per-side suffix. */
export function weightTimePRTile(event: WeightTimePREvent): RecentPRTile {
  return {
    key: `weight_time:${event.setId}`,
    model: 'weight_time',
    typeLabel: 'Weight-time PR',
    workoutDate: event.workoutDate,
    exerciseName: event.exerciseName,
    valueText: `${formatDurationSeconds(event.durationSeconds)} · ${formatAddedWeightLb(event.weightKg)}${event.isUnilateral ? ' per side' : ''}`,
  }
}

/**
 * Deterministic chronological merge of two most-recent-first tile lists.
 * Equal dates: the strength tile first; each list's internal order is
 * preserved (a stable merge, never a re-sort), then the explicit cap.
 */
export function mergeRecentPRTiles(
  strengthTiles: RecentPRTile[],
  weightTimeTiles: RecentPRTile[],
  cap: number = RECENT_PR_TILE_CAP
): RecentPRTile[] {
  const merged: RecentPRTile[] = []
  let strengthIndex = 0
  let weightTimeIndex = 0
  while (strengthIndex < strengthTiles.length || weightTimeIndex < weightTimeTiles.length) {
    const strength = strengthTiles[strengthIndex]
    const weightTime = weightTimeTiles[weightTimeIndex]
    if (weightTime === undefined || (strength !== undefined && strength.workoutDate >= weightTime.workoutDate)) {
      merged.push(strength)
      strengthIndex += 1
    } else {
      merged.push(weightTime)
      weightTimeIndex += 1
    }
  }
  return merged.slice(0, cap)
}

/** The /progress Recent PRs list. */
export function buildRecentPRTiles(strengthEvents: PREvent[], weightTimeEvents: WeightTimePREvent[]): RecentPRTile[] {
  return mergeRecentPRTiles(strengthEvents.map(strengthPRTile), weightTimeEvents.map(weightTimePRTile))
}
