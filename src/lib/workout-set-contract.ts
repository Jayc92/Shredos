// ============================================================
// ForgeFitOS — the per-tracking-mode WORKOUT SET CONTRACT (W7)
//
// ONE implementation of what each tracking mode accepts, how weight is
// converted, and what a completed set requires — executed by BOTH
// set-writing routes (POST /api/workout-exercises/[id]/sets and
// PATCH /api/workout-sets/[id]) and by the contract verifiers
// (scripts/verify-weight-time-contract.ts). Pure functions: no Next.js,
// no Supabase, no I/O, so the same code that runs in production is what
// the verifiers execute.
//
// Phase 2S originally duplicated these maps in the two route files
// because that phase's approved scope locked to exactly those files. W7
// (docs/weight-time-coordinated-implementation-plan.md §8.2, §8.3, §16
// W7) moves them here so the two routes can no longer drift apart and so
// the weight_time zero/completion semantics are decided in one place.
//
// This module mirrors the DATABASE contract enforced by append_workout_set
// (migration 028): the database remains authoritative for a direct RPC
// caller; the route layer gives the same answers earlier and with
// friendlier messages.
// ============================================================

import { lbsToKg } from '@/lib/units'
import type { TrackingMode } from '@/types/database'

// ── Vocabulary of accepted fields ───────────────────────────────────────

/**
 * Body fields each mode accepts, on top of COMMON_FIELDS. weight_time
 * (Decisions 1, 5): added weight + duration; rpe and is_warmup permitted;
 * reps and distance_meters forbidden.
 */
export const MODE_ALLOWED_FIELDS: Record<TrackingMode, ReadonlySet<string>> = {
  weight_reps: new Set(['reps', 'weight_lbs', 'weight_kg', 'rpe', 'is_warmup']),
  bodyweight:  new Set(['reps', 'weight_lbs', 'weight_kg', 'rpe', 'is_warmup']),
  cardio:      new Set(['duration_seconds', 'distance_meters']),
  timed:       new Set(['duration_seconds', 'rpe']),
  weight_time: new Set(['weight_lbs', 'weight_kg', 'duration_seconds', 'rpe', 'is_warmup']),
}

export const COMMON_FIELDS: ReadonlySet<string> = new Set(['completed', 'notes'])

// tracking-mode-census: allowlist — the modes whose warmup flag the database
// forbids (append_workout_set rejects is_warmup for cardio and timed).
// weight_time is deliberately NOT listed: Decision 5 PERMITS warmups for a
// weighted hold, so its flag passes through like weight_reps/bodyweight.
const WARMUP_FORBIDDEN_MODES: ReadonlySet<TrackingMode> = new Set<TrackingMode>(['cardio', 'timed'])

// ── Shared types ────────────────────────────────────────────────────────

export type SetContractFailure = { ok: false; status: number; error: string }

/** The stored shape of a workout_sets row as the PATCH route reads it. */
export interface ExistingSetRow {
  reps: number | null
  weight_kg: number | null
  rpe: number | null
  is_warmup: boolean
  completed: boolean
  duration_seconds: number | null
  distance_meters: number | null
}

export interface SetInsertPayload {
  completed: boolean
  is_warmup: boolean
  notes: string | null
  reps: number | null
  weight_kg: number | null
  rpe: number | null
  duration_seconds: number | null
  distance_meters: number | null
}

// ── Messages (stable, user-facing) ──────────────────────────────────────

export const UNSUPPORTED_FIELDS_ON_CREATE = "Only fields supported by this exercise's tracking mode can be set."
export const UNSUPPORTED_FIELDS_ON_UPDATE = "Only fields supported by this exercise's tracking mode can be updated."
export const NEGATIVE_WEIGHT_ERROR = 'Weight cannot be negative.'
export const REPS_REQUIRED_ERROR = 'Reps are required to complete this set.'
export const DURATION_REQUIRED_ERROR = 'Duration is required to complete this set.'
export const ADDED_WEIGHT_REQUIRED_ERROR = 'Added weight is required to complete this set (0 is allowed).'
export const NO_VALID_FIELDS_ERROR = 'No valid fields to update.'
export const WORKOUT_COMPLETED_ERROR = 'Completed workouts are read-only. Reopen the workout before editing.'

/** The controlled error token migration 028's history guard raises. */
export const TRACKING_MODE_HISTORY_ERROR_TOKEN = 'tracking_mode_has_workout_history'
/** Speaks of EXTANT sets, not "ever used": the invariant is current rows. */
export const TRACKING_MODE_HISTORY_409_COPY = 'This exercise has logged sets. Delete its draft sets or keep the current tracking mode.'

// ── Field allowlist ─────────────────────────────────────────────────────

function unsupportedFields(trackingMode: TrackingMode, body: Record<string, unknown>): string[] {
  const allowed = MODE_ALLOWED_FIELDS[trackingMode]
  return Object.keys(body).filter((key) => !allowed.has(key) && !COMMON_FIELDS.has(key))
}

// ── Weight conversion ───────────────────────────────────────────────────

/**
 * Resolves the incoming weight to the stored kg value.
 *   undefined  = the request did not supply a weight
 *   null       = no weight (legacy modes: 0 lbs and non-positive values
 *                normalise to null, exactly the pre-W7 contract, because
 *                the database rejects 0 for weight_reps/bodyweight)
 *   number     = the value to store
 *
 * weight_time (Decision 2): ZERO is a legal, intentional added-weight
 * baseline and survives as numeric 0 — never collapsed to null. A
 * negative weight is rejected, not normalised away.
 */
export function resolveIncomingWeightKg(
  trackingMode: TrackingMode,
  body: Record<string, unknown>,
): { ok: true; weightKg: number | null | undefined } | SetContractFailure {
  if (typeof body.weight_lbs === 'number') {
    if (trackingMode === 'weight_time') {
      if (body.weight_lbs < 0) return { ok: false, status: 400, error: NEGATIVE_WEIGHT_ERROR }
      return { ok: true, weightKg: Math.round(lbsToKg(body.weight_lbs) * 100) / 100 }
    }
    return { ok: true, weightKg: body.weight_lbs > 0 ? Math.round(lbsToKg(body.weight_lbs) * 100) / 100 : null }
  }
  if ('weight_kg' in body) {
    const value = body.weight_kg
    if (trackingMode === 'weight_time' && typeof value === 'number' && value < 0) {
      return { ok: false, status: 400, error: NEGATIVE_WEIGHT_ERROR }
    }
    return { ok: true, weightKg: typeof value === 'number' ? value : null }
  }
  return { ok: true, weightKg: undefined }
}

// ── Completion ──────────────────────────────────────────────────────────

interface MergedCompletionState {
  reps: number | null | undefined
  weightKg: number | null | undefined
  durationSeconds: number | null | undefined
  isWarmup: boolean
}

/**
 * Per-mode completion requirements, evaluated against the FINAL state of
 * the row (for PATCH, the request merged onto the stored row). Returns the
 * user-facing error, or null when the set may complete.
 */
export function completionError(trackingMode: TrackingMode, state: MergedCompletionState): string | null {
  const hasReps = typeof state.reps === 'number'
  const hasDuration = typeof state.durationSeconds === 'number' && state.durationSeconds > 0
  switch (trackingMode) {
    case 'bodyweight':
      return !state.isWarmup && !hasReps ? REPS_REQUIRED_ERROR : null
    case 'cardio':
    case 'timed':
      return hasDuration ? null : DURATION_REQUIRED_ERROR
    case 'weight_time':
      // Decision 2: BOTH dimensions, weight 0 legal, null is not zero.
      // Decision 5: a warmup does not waive this.
      if (typeof state.weightKg !== 'number') return ADDED_WEIGHT_REQUIRED_ERROR
      return hasDuration ? null : DURATION_REQUIRED_ERROR
    case 'weight_reps':
      return null
  }
}

// ── POST: build the insert payload ──────────────────────────────────────

/**
 * Validates a create-set body for the exercise's CURRENT mode and builds the
 * explicit, mode-correct payload — every mode-inapplicable field is
 * explicitly null/false, never merely omitted.
 */
export function buildSetInsert(
  trackingMode: TrackingMode,
  body: Record<string, unknown>,
): { ok: true; payload: SetInsertPayload } | SetContractFailure {
  if (unsupportedFields(trackingMode, body).length > 0) {
    return { ok: false, status: 400, error: UNSUPPORTED_FIELDS_ON_CREATE }
  }
  const weight = resolveIncomingWeightKg(trackingMode, body)
  if (!weight.ok) return weight

  // Same truthiness the pre-W7 routes applied (`body.completed ?? false`).
  const completed = Boolean(body.completed ?? false)
  const requestedWarmup = Boolean(body.is_warmup ?? false)
  const isWarmup = WARMUP_FORBIDDEN_MODES.has(trackingMode) ? false : requestedWarmup
  const reps = typeof body.reps === 'number' ? body.reps : null
  const rpe = typeof body.rpe === 'number' ? body.rpe : null
  const durationSeconds = typeof body.duration_seconds === 'number' ? body.duration_seconds : null
  const distanceMeters = typeof body.distance_meters === 'number' ? body.distance_meters : null
  const weightKg = weight.weightKg ?? null

  if (completed) {
    const error = completionError(trackingMode, { reps, weightKg, durationSeconds, isWarmup })
    if (error) return { ok: false, status: 400, error }
  }

  const payload: SetInsertPayload = {
    completed,
    is_warmup: isWarmup,
    notes: (body.notes ?? null) as string | null,
    reps: null,
    weight_kg: null,
    rpe: null,
    duration_seconds: null,
    distance_meters: null,
  }
  switch (trackingMode) {
    case 'weight_reps':
    case 'bodyweight':
      payload.reps = reps
      payload.weight_kg = weightKg
      payload.rpe = rpe
      break
    case 'cardio':
      payload.duration_seconds = durationSeconds
      payload.distance_meters = distanceMeters
      break
    case 'timed':
      payload.duration_seconds = durationSeconds
      payload.rpe = rpe
      break
    case 'weight_time':
      payload.weight_kg = weightKg
      payload.duration_seconds = durationSeconds
      payload.rpe = rpe
      break
  }
  return { ok: true, payload }
}

// ── PATCH: build the update ─────────────────────────────────────────────

/**
 * Validates an edit against the FINAL merged state and builds an update that
 * contains ONLY the fields this request legitimately supplied for the
 * exercise's CURRENT mode.
 *
 * DATA-INTEGRITY RULE (plan §5.2): this function never nulls a stored
 * dimension — reps, weight_kg, duration_seconds, distance_meters, rpe,
 * is_warmup — because the exercise's tracking mode differs from what the
 * row was logged under. The pre-W7 route "self-healed" such rows on every
 * edit, silently destroying history (a weight_time row's weight would have
 * vanished on the first edit after a switch to timed). Stored history is
 * preserved exactly; mode changes on exercises with sets are refused at the
 * database instead (migration 028's history guard).
 */
export function buildSetPatch(
  trackingMode: TrackingMode,
  existing: ExistingSetRow,
  body: Record<string, unknown>,
): { ok: true; update: Record<string, unknown> } | SetContractFailure {
  if (unsupportedFields(trackingMode, body).length > 0) {
    return { ok: false, status: 400, error: UNSUPPORTED_FIELDS_ON_UPDATE }
  }
  const weight = resolveIncomingWeightKg(trackingMode, body)
  if (!weight.ok) return weight

  const finalReps = 'reps' in body ? (typeof body.reps === 'number' ? body.reps : null) : existing.reps
  const finalWeightKg = weight.weightKg !== undefined ? weight.weightKg : existing.weight_kg
  const finalIsWarmup = typeof body.is_warmup === 'boolean' ? body.is_warmup : existing.is_warmup
  const finalCompleted = typeof body.completed === 'boolean' ? body.completed : existing.completed
  const finalDuration = 'duration_seconds' in body
    ? (typeof body.duration_seconds === 'number' ? body.duration_seconds : null)
    : existing.duration_seconds

  if (finalCompleted) {
    const error = completionError(trackingMode, { reps: finalReps, weightKg: finalWeightKg, durationSeconds: finalDuration, isWarmup: finalIsWarmup })
    if (error) return { ok: false, status: 400, error }
  }

  const update: Record<string, unknown> = {}
  if ('completed' in body) update.completed = body.completed
  if ('notes' in body) update.notes = body.notes
  switch (trackingMode) {
    case 'weight_reps':
    case 'bodyweight':
      if ('reps' in body) update.reps = body.reps
      if (weight.weightKg !== undefined) update.weight_kg = weight.weightKg
      if ('rpe' in body) update.rpe = body.rpe
      if ('is_warmup' in body) update.is_warmup = body.is_warmup
      break
    case 'cardio':
      if ('duration_seconds' in body) update.duration_seconds = body.duration_seconds
      if ('distance_meters' in body) update.distance_meters = body.distance_meters
      break
    case 'timed':
      if ('duration_seconds' in body) update.duration_seconds = body.duration_seconds
      if ('rpe' in body) update.rpe = body.rpe
      break
    case 'weight_time':
      if (weight.weightKg !== undefined) update.weight_kg = weight.weightKg
      if ('duration_seconds' in body) update.duration_seconds = body.duration_seconds
      if ('rpe' in body) update.rpe = body.rpe
      if ('is_warmup' in body) update.is_warmup = body.is_warmup
      break
  }
  if (Object.keys(update).length === 0) {
    return { ok: false, status: 400, error: NO_VALID_FIELDS_ERROR }
  }
  return { ok: true, update }
}

// ── RPC error mapping ───────────────────────────────────────────────────

/**
 * Maps append_workout_set's controlled error tokens to HTTP answers. Returns
 * null for anything else so the caller can answer a generic 500.
 */
export function mapWorkoutSetRpcError(message: string): { status: number; error: string } | null {
  if (message.includes('not_found')) return { status: 404, error: 'Not found' }
  if (message.includes('workout_completed')) return { status: 409, error: WORKOUT_COMPLETED_ERROR }
  if (message.includes('invalid_input')) return { status: 400, error: UNSUPPORTED_FIELDS_ON_CREATE }
  return null
}
