import { displayWeight } from '@/lib/workout'
import type { WorkoutSet } from '@/types/database'

// ============================================================
// ForgeFitOS — Apply-to-remaining client reconciliation (UI-5B1B
// stale-state correction)
//
// Hosted QA proved the RPC/database path correct: after Apply, a
// browser refresh showed the applied values. The defect was purely
// client state — SetRow initializes its inputs from props ONCE
// (useState initializers), and router.refresh() preserves client
// component state, so the fresh server props never reached the
// visible inputs until a full remount.
//
// The correction: the Apply route now returns the authoritative
// post-write rows, and these PURE functions (runtime-proven in the
// harness with the exact hosted scenario) reconcile them into the
// existing component state — no remount, no extra fetch:
//   buildAppliedOverrides  response rows -> per-set-ID value overrides
//   mergeAppliedSets       overrides merged over the server-prop rows
//                          (identity, order, notes, completion state
//                          all come from the prop row)
//   pruneCaughtUpOverrides drops each override once router.refresh()
//                          has landed the same values in props, so a
//                          LATER edit can never be clobbered by a
//                          stale override
//   reconcileSetRowState   per-field diff of the old vs new server
//                          row -> the exact SetRow local-state
//                          updates, formatted identically to the
//                          useState initializers (including the
//                          kg-to-lbs display conversion)
// ============================================================

/** The only fields Apply can ever write — value fields, never identity/state. */
export const APPLY_VALUE_FIELDS =
  ['reps', 'weight_kg', 'rpe', 'duration_seconds', 'distance_meters'] as const
export type ApplyValueField = (typeof APPLY_VALUE_FIELDS)[number]
export type AppliedOverride = Partial<Pick<WorkoutSet, ApplyValueField>>

const METERS_PER_MILE = 1609.34

/**
 * Server response rows (authoritative post-write reads) -> a map of
 * per-set-ID overrides holding ONLY the five value fields. Identity,
 * numbering, completion, warmup, and notes are deliberately not
 * carried — those always come from the existing prop row.
 */
export function buildAppliedOverrides(
  rows: ReadonlyArray<Record<string, unknown>> | undefined | null
): Record<string, AppliedOverride> {
  const overrides: Record<string, AppliedOverride> = {}
  for (const row of rows ?? []) {
    const id = row.id
    if (typeof id !== 'string') continue
    const entry: Record<string, unknown> = {}
    for (const f of APPLY_VALUE_FIELDS) {
      if (f in row) entry[f] = row[f]
    }
    overrides[id] = entry as AppliedOverride
  }
  return overrides
}

/**
 * Merge overrides over the server-prop rows. Rows without an
 * override keep their exact object identity; order is the prop
 * array's order, untouched.
 */
export function mergeAppliedSets<T extends { id: string }>(
  rawSets: ReadonlyArray<T>,
  overrides: Record<string, AppliedOverride>
): T[] {
  return rawSets.map((s) => {
    const o = overrides[s.id]
    return o ? { ...s, ...o } : s
  })
}

/**
 * Overrides bridge EXACTLY the gap between the Apply response and
 * the next server render: `baseline` is the workout_sets prop
 * reference captured at Apply success. Any subsequent server render
 * delivers a new array whose rows already include the committed
 * Apply writes (the response was read post-commit), so the moment
 * the reference changes the overrides are redundant — and keeping
 * them longer would let a stale value clobber an edit the user made
 * after Apply. Identity, not value-matching, so a newer server value
 * always wins.
 */
export interface ApplyReconcileState {
  baseline: unknown
  overrides: Record<string, AppliedOverride>
}

export const EMPTY_APPLY_STATE: ApplyReconcileState = { baseline: null, overrides: {} }

/**
 * Overrides to merge for the current render. `cleared` tells the
 * caller to reset its state — the server props have moved past the
 * baseline, so the response snapshot must never be applied again.
 */
export function resolveActiveOverrides(
  state: ApplyReconcileState,
  currentRawSets: unknown
): { overrides: Record<string, AppliedOverride>; cleared: boolean } {
  const hasOverrides = Object.keys(state.overrides).length > 0
  if (!hasOverrides) return { overrides: state.overrides, cleared: false }
  if (state.baseline !== currentRawSets) return { overrides: {}, cleared: true }
  return { overrides: state.overrides, cleared: false }
}

/** SetRow local-state updates produced by a server-row change. */
export interface SetRowStateUpdates {
  reps?: string
  lbs?: string
  rpe?: string
  durationMin?: string
  durationSec?: string
  distanceMi?: string
  completed?: boolean
  isWarmup?: boolean
  /** Only ever set to true — expanding, never collapsing, the bodyweight added-weight box. */
  addedWeightExpanded?: true
}

/**
 * Field-level diff of the previously synced server row against the
 * new one. Only fields whose SERVER value changed produce an update,
 * so in-progress typing in any other field is never touched. Each
 * formatted value is byte-identical to SetRow's own useState
 * initializer for that field — including displayWeight's kg-to-lbs
 * conversion and the duration/distance rounding.
 */
export function reconcileSetRowState(
  prev: WorkoutSet,
  next: WorkoutSet
): SetRowStateUpdates {
  const updates: SetRowStateUpdates = {}
  if (next.reps !== prev.reps) {
    updates.reps = next.reps !== null ? String(next.reps) : ''
  }
  if (next.weight_kg !== prev.weight_kg) {
    updates.lbs = next.weight_kg !== null ? String(displayWeight(next.weight_kg)) : ''
    if (next.weight_kg !== null) updates.addedWeightExpanded = true
  }
  if (next.rpe !== prev.rpe) {
    updates.rpe = next.rpe !== null ? String(next.rpe) : ''
  }
  if (next.duration_seconds !== prev.duration_seconds) {
    updates.durationMin =
      next.duration_seconds !== null ? String(Math.floor(next.duration_seconds / 60)) : ''
    updates.durationSec =
      next.duration_seconds !== null ? String(next.duration_seconds % 60) : ''
  }
  if (next.distance_meters !== prev.distance_meters) {
    updates.distanceMi = next.distance_meters !== null
      ? String(Math.round((next.distance_meters / METERS_PER_MILE) * 100) / 100)
      : ''
  }
  if (next.completed !== prev.completed) updates.completed = next.completed
  if (next.is_warmup !== prev.is_warmup) updates.isWarmup = next.is_warmup
  return updates
}
