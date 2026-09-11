// ============================================================
// ShredOS — Recent PRs tiles (W10.5-A ruling 6)
//
// The /progress "Recent PRs" card merges two PR models that can never
// overlap: strength PR events (strength-records.ts, whose explicit mode list
// admits weight_reps/bodyweight exercises only) and Weight-time PR events
// (weight-time-records.ts, weight_time exercises only). Because an
// exercise has exactly one tracking mode, no set can be counted by both
// models, and the model prefix keeps the two namespaces apart.
//
// W12-R1-1 correction. The model prefix rules out a CROSS-MODEL collision
// only — it says nothing about two events of the same model. Within the
// strength model (exerciseId, workoutDate, type) is NOT unique, because
// successive same-workout PRs are an explicitly supported state
// (strength-records.ts processExerciseSession: the running best is updated
// in place, so a second set can be a new record by beating the first one).
// Two such events shared one key, which /progress used as its React key.
// Each strength key therefore now also carries the RECORD METRIC — the
// exact value that made the event a record — which is a true event
// identity: a PR requires STRICTLY exceeding the running best, and the
// running best is then set to that value, so successive events of the same
// exerciseId/workoutDate/type have strictly increasing metrics and can
// never repeat one. The metric is carried UNROUNDED on purpose: two
// successive estimated-1RM PRs can differ by less than a pound, so
// rounding would reintroduce the very collision this fixes.
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
  /**
   * Model-prefixed and unique within the merged list, including across
   * successive same-workout PR events of the same type (W12-R1-1). Used as
   * the React key on /progress and never displayed.
   */
  key: string
  model: 'strength' | 'weight_time'
  typeLabel: string
  workoutDate: string
  exerciseName: string
  valueText: string
}

/**
 * The metric that made THIS event a record, per PR type — the strength
 * model's own event identity (W12-R1-1). Returned raw: never rounded,
 * never formatted, never combined into a score. `null` is unreachable for
 * an event the engine actually emits (a 'weight' PR always carries its
 * weight_kg, an 'estimated_1rm' PR its computed 1RM, a 'bodyweight_reps'
 * PR its reps); the nullable type is PREvent's, not this rule's.
 */
function strengthRecordMetric(event: PREvent): number | null {
  switch (event.type) {
    case 'weight': return event.weightKg
    case 'estimated_1rm': return event.estimated1RmKg
    case 'bodyweight_reps': return event.reps
  }
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
    key: `strength:${event.exerciseId}:${event.workoutDate}:${event.type}:${strengthRecordMetric(event) ?? ''}`,
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
