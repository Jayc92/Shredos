// ============================================================
// ShredOS — Exercise Validation (Phase 2P)
// ============================================================
// Pure, server-safe validation and normalization for exercise
// create/update payloads. No framework imports (no NextResponse, no
// Supabase, no React) -- both POST /api/exercises and
// PATCH /api/exercises/[id] call into this module, so the same input
// produces the same accepted/rejected outcome regardless of which
// route it went through. This is the single source of truth for
// "what counts as a valid exercise field value" in this app.
// ============================================================

export const EXERCISE_NAME_MAX_LENGTH = 100
export const EXERCISE_NOTES_MAX_LENGTH = 1000

export const EXERCISE_CATEGORIES = ['compound', 'isolation', 'cardio', 'mobility', 'other'] as const

// ── Phase 5A.6B: canonical muscle taxonomy (25 values) ─────────────
// The approved anatomy vocabulary. The broad values 'back',
// 'shoulders', and 'core' REMAIN canonical: existing exercises using
// them are honestly broad and are never guess-mapped to specifics —
// users refine per exercise when they choose to. Deliberately absent:
// 'thigh' (anatomically ambiguous — quads/hamstrings/adductors are
// the useful groups), 'cardio' (a category/tracking concept, not a
// muscle), and upper/lower chest (exercise-variation concepts, not
// separate muscles). The old 13-value vocabulary is a strict subset.
export const MUSCLE_GROUPS = [
  // upper
  'chest', 'lats', 'upper_back', 'lower_back', 'traps',
  'front_delts', 'side_delts', 'rear_delts',
  'biceps', 'triceps', 'forearms',
  // lower
  'quads', 'hamstrings', 'glutes', 'calves',
  'hip_flexors', 'adductors', 'abductors',
  // core
  'abs', 'obliques',
  // retained broad values
  'back', 'shoulders', 'core',
  // other
  'full_body', 'other',
] as const

/** Friendly display labels for every canonical muscle. */
export const MUSCLE_LABELS: Record<(typeof MUSCLE_GROUPS)[number], string> = {
  chest: 'Chest',
  lats: 'Lats',
  upper_back: 'Upper back',
  lower_back: 'Lower back',
  traps: 'Traps',
  front_delts: 'Front delts',
  side_delts: 'Side delts',
  rear_delts: 'Rear delts',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Forearms',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  calves: 'Calves',
  hip_flexors: 'Hip flexors',
  adductors: 'Adductors',
  abductors: 'Abductors',
  abs: 'Abs',
  obliques: 'Obliques',
  back: 'Back',
  shoulders: 'Shoulders',
  core: 'Core',
  full_body: 'Full body',
  other: 'Other',
}

/** Code-level region grouping for filtering and future analytics —
 *  deliberately NOT a database column. */
export type MuscleRegion = 'upper' | 'lower' | 'core' | 'other'

export const MUSCLE_REGIONS: Record<(typeof MUSCLE_GROUPS)[number], MuscleRegion> = {
  chest: 'upper',
  lats: 'upper',
  upper_back: 'upper',
  lower_back: 'upper',
  traps: 'upper',
  front_delts: 'upper',
  side_delts: 'upper',
  rear_delts: 'upper',
  biceps: 'upper',
  triceps: 'upper',
  forearms: 'upper',
  quads: 'lower',
  hamstrings: 'lower',
  glutes: 'lower',
  calves: 'lower',
  hip_flexors: 'lower',
  adductors: 'lower',
  abductors: 'lower',
  abs: 'core',
  obliques: 'core',
  back: 'upper',
  shoulders: 'upper',
  core: 'core',
  full_body: 'other',
  other: 'other',
}

// Relationship roles. Primary is NOT a relationship role — it lives
// on exercises.primary_muscle (exactly one, structurally). Weights
// are deliberately not stored anywhere: the future Coach defines
// contribution weights centrally so re-tuning never rewrites rows.
export const MUSCLE_ROLES = ['secondary', 'tertiary'] as const
export type MuscleRole = (typeof MUSCLE_ROLES)[number]

export interface MuscleTarget {
  muscle: MuscleGroup
  role: MuscleRole
}
export const EQUIPMENT_TYPES = [
  'barbell', 'dumbbell', 'cable', 'machine',
  'bodyweight', 'resistance_band', 'kettlebell', 'other',
] as const
export const EXERCISE_TYPES = [
  'strength', 'bodyweight', 'machine', 'cable',
  'dumbbell', 'barbell', 'cardio', 'mobility',
] as const

// Phase 2R: the user-facing, behavior-driving replacement for
// exercise_type/EXERCISE_TYPES above. EXERCISE_TYPES/ExerciseTypeValue
// are kept only because a legacy exercise_type value must still be
// derived and written for every row (see deriveLegacyExerciseType) --
// callers can no longer supply exercise_type directly through either
// normalize function below.
export const TRACKING_MODES = ['weight_reps', 'bodyweight', 'cardio', 'timed'] as const

export type ExerciseCategory = typeof EXERCISE_CATEGORIES[number]
export type MuscleGroup = typeof MUSCLE_GROUPS[number]
export type EquipmentType = typeof EQUIPMENT_TYPES[number]
export type ExerciseTypeValue = typeof EXERCISE_TYPES[number]
export type TrackingMode = typeof TRACKING_MODES[number]

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string }

function ok<T>(value: T): ValidationResult<T> {
  return { ok: true, value }
}
function fail(error: string): ValidationResult<never> {
  return { ok: false, error }
}

export interface ExerciseCreatePayload {
  name: string
  category: ExerciseCategory | null
  primary_muscle: MuscleGroup
  /** Secondary/tertiary relationship targets (Phase 5A.6B explicit
   *  roles contract, D6). Written to exercise_muscles — the
   *  deprecated secondary_muscles JSONB is never written. */
  muscle_targets: MuscleTarget[]
  equipment: EquipmentType | null
  tracking_mode: TrackingMode
  unilateral: boolean
  notes: string | null
}

export interface ExercisePatchPayload {
  name?: string
  category?: ExerciseCategory | null
  primary_muscle?: MuscleGroup
  muscle_targets?: MuscleTarget[]
  equipment?: EquipmentType | null
  tracking_mode?: TrackingMode
  unilateral?: boolean
  notes?: string | null
  is_active?: boolean
}

// Phase 5A.6B (D6): the API contract moved from the legacy
// secondary_muscles array to explicit muscle_targets roles —
// secondary_muscles is no longer an accepted field on either route.
const CREATE_ALLOWED_FIELDS = new Set([
  'name', 'category', 'primary_muscle', 'muscle_targets',
  'equipment', 'tracking_mode', 'unilateral', 'notes',
])

const PATCH_ALLOWED_FIELDS = new Set([
  'name', 'category', 'primary_muscle', 'muscle_targets',
  'equipment', 'tracking_mode', 'unilateral', 'notes', 'is_active',
])

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isMuscleGroup(value: unknown): value is MuscleGroup {
  return typeof value === 'string' && (MUSCLE_GROUPS as readonly string[]).includes(value)
}

// ── Individual field validators ─────────────────────────────────────
// Each operates on a raw, already-extracted value. The caller (the two
// top-level normalize functions below) decides whether a field was
// supplied at all -- these only validate/normalize the value itself.

function validateName(raw: unknown): ValidationResult<string> {
  if (typeof raw !== 'string') return fail('Exercise name is required.')
  const trimmed = raw.trim()
  if (trimmed.length === 0) return fail('Exercise name is required.')
  if (trimmed.length > EXERCISE_NAME_MAX_LENGTH) {
    return fail(`Exercise name must be ${EXERCISE_NAME_MAX_LENGTH} characters or fewer.`)
  }
  return ok(trimmed)
}

function validateCategory(raw: unknown): ValidationResult<ExerciseCategory | null> {
  if (raw === null || raw === undefined || raw === '') return ok(null)
  if (typeof raw === 'string' && (EXERCISE_CATEGORIES as readonly string[]).includes(raw)) {
    return ok(raw as ExerciseCategory)
  }
  return fail('Invalid exercise category.')
}

function validatePrimaryMuscle(raw: unknown): ValidationResult<MuscleGroup> {
  if (isMuscleGroup(raw)) return ok(raw)
  return fail('Invalid primary muscle.')
}

/**
 * Phase 5A.6B: validates the explicit-roles relationship payload.
 * Every entry must be { muscle, role } with a canonical muscle and a
 * relationship role (secondary/tertiary — 'primary' in the array is
 * rejected: the primary target is a separate field). Collisions are
 * REJECTED, never silently dropped (a deliberate contract change
 * from the 2P secondary_muscles behavior, which skipped/deduped):
 * the same muscle twice (any roles) fails, and a target equal to the
 * primary fails. `primaryMuscle` is the EFFECTIVE primary — POST
 * always has one from the same payload; the PATCH route passes the
 * payload's value or the stored row's, so the primary-collision rule
 * holds even when primary_muscle isn't being changed.
 */
export function validateMuscleTargets(
  raw: unknown,
  primaryMuscle: MuscleGroup | undefined
): ValidationResult<MuscleTarget[]> {
  if (raw === undefined) return ok([])
  if (!Array.isArray(raw)) {
    return fail('Muscle targets must be an array of { muscle, role } entries.')
  }

  const result: MuscleTarget[] = []
  const seen = new Set<string>()
  for (const item of raw) {
    if (!isPlainObject(item)) {
      return fail('Muscle targets must be an array of { muscle, role } entries.')
    }
    const extraKeys = Object.keys(item).filter((k) => k !== 'muscle' && k !== 'role')
    if (extraKeys.length > 0) {
      return fail('Muscle targets accept only muscle and role.')
    }
    if (!isMuscleGroup(item.muscle)) {
      return fail('Unknown muscle in muscle targets.')
    }
    if (item.role === 'primary') {
      return fail('The primary muscle is set separately, not in muscle targets.')
    }
    if (typeof item.role !== 'string' || !(MUSCLE_ROLES as readonly string[]).includes(item.role)) {
      return fail('Muscle target role must be secondary or tertiary.')
    }
    if (primaryMuscle && item.muscle === primaryMuscle) {
      return fail('A muscle target cannot duplicate the primary muscle.')
    }
    if (seen.has(item.muscle)) {
      return fail('The same muscle cannot be targeted twice.')
    }
    seen.add(item.muscle)
    result.push({ muscle: item.muscle, role: item.role as MuscleRole })
  }
  return ok(result)
}

function validateEquipment(raw: unknown): ValidationResult<EquipmentType | null> {
  if (raw === null || raw === undefined || raw === '') return ok(null)
  if (typeof raw === 'string' && (EQUIPMENT_TYPES as readonly string[]).includes(raw)) {
    return ok(raw as EquipmentType)
  }
  return fail('Invalid equipment value.')
}

function validateTrackingMode(raw: unknown): ValidationResult<TrackingMode> {
  if (typeof raw === 'string' && (TRACKING_MODES as readonly string[]).includes(raw)) {
    return ok(raw as TrackingMode)
  }
  return fail('Invalid tracking mode.')
}

/**
 * Derives the legacy exercise_type value from a validated
 * tracking_mode (Phase 2R), so every write still satisfies the
 * exercise_type NOT NULL/CHECK constraint without ever accepting a
 * caller-supplied exercise_type directly. Callers (POST/PATCH routes)
 * apply this themselves when building the actual database write --
 * it is intentionally NOT part of ExerciseCreatePayload/
 * ExercisePatchPayload, since it's a derived legacy-compatibility
 * value, not something the caller validated or supplied.
 */
export function deriveLegacyExerciseType(trackingMode: TrackingMode): ExerciseTypeValue {
  switch (trackingMode) {
    case 'bodyweight': return 'bodyweight'
    case 'cardio': return 'cardio'
    case 'timed': return 'mobility'
    case 'weight_reps': return 'strength'
  }
}

function validateUnilateral(raw: unknown): ValidationResult<boolean> {
  if (typeof raw === 'boolean') return ok(raw)
  return fail('Unilateral must be true or false.')
}

function validateNotes(raw: unknown): ValidationResult<string | null> {
  if (raw === null) return ok(null)
  if (typeof raw !== 'string') return fail('Exercise notes must be text or null.')
  const trimmed = raw.trim()
  if (trimmed.length > EXERCISE_NOTES_MAX_LENGTH) {
    return fail(`Exercise notes must be ${EXERCISE_NOTES_MAX_LENGTH} characters or fewer.`)
  }
  return ok(trimmed.length > 0 ? trimmed : null)
}

function validateIsActive(raw: unknown): ValidationResult<boolean> {
  if (typeof raw === 'boolean') return ok(raw)
  return fail('Active status must be true or false.')
}

// ── Top-level entry points ───────────────────────────────────────────

/**
 * Validates and normalizes a POST /api/exercises body into an explicit,
 * fully-populated create payload. Rejects any field outside the
 * allowed set (ownership/system/lifecycle fields are never accepted
 * here -- the caller inserts user_id/is_system itself, and is_active
 * is intentionally left to the database default).
 */
export function normalizeExerciseCreatePayload(body: unknown): ValidationResult<ExerciseCreatePayload> {
  if (!isPlainObject(body)) return fail('Invalid exercise payload.')

  const unsupported = Object.keys(body).filter((key) => !CREATE_ALLOWED_FIELDS.has(key))
  if (unsupported.length > 0) {
    return fail('Only supported exercise fields can be used to create an exercise.')
  }

  const nameResult = validateName(body.name)
  if (!nameResult.ok) return nameResult

  if (body.primary_muscle === undefined) return fail('Primary muscle is required.')
  const muscleResult = validatePrimaryMuscle(body.primary_muscle)
  if (!muscleResult.ok) return muscleResult

  const categoryResult = validateCategory(body.category)
  if (!categoryResult.ok) return categoryResult

  const targetsResult = validateMuscleTargets(body.muscle_targets, muscleResult.value)
  if (!targetsResult.ok) return targetsResult

  const equipmentResult = validateEquipment(body.equipment)
  if (!equipmentResult.ok) return equipmentResult

  if (body.tracking_mode === undefined) return fail('Tracking mode is required.')
  const trackingModeResult = validateTrackingMode(body.tracking_mode)
  if (!trackingModeResult.ok) return trackingModeResult

  const unilateralResult = body.unilateral === undefined
    ? ok(false)
    : validateUnilateral(body.unilateral)
  if (!unilateralResult.ok) return unilateralResult

  const notesResult = body.notes === undefined
    ? ok<string | null>(null)
    : validateNotes(body.notes)
  if (!notesResult.ok) return notesResult

  return ok({
    name: nameResult.value,
    category: categoryResult.value,
    primary_muscle: muscleResult.value,
    muscle_targets: targetsResult.value,
    equipment: equipmentResult.value,
    tracking_mode: trackingModeResult.value,
    unilateral: unilateralResult.value,
    notes: notesResult.value,
  })
}

/**
 * Validates and normalizes a PATCH /api/exercises/[id] body into a
 * partial payload containing only the fields the caller actually
 * supplied. Rejects any unsupported field (including id, user_id,
 * is_system, created_at, updated_at) and rejects an empty resulting
 * payload.
 */
export function normalizeExercisePatchPayload(body: unknown): ValidationResult<ExercisePatchPayload> {
  if (!isPlainObject(body)) return fail('Invalid exercise payload.')

  const unsupported = Object.keys(body).filter((key) => !PATCH_ALLOWED_FIELDS.has(key))
  if (unsupported.length > 0) {
    return fail('Only supported exercise fields can be updated through this endpoint.')
  }

  const payload: ExercisePatchPayload = {}
  let normalizedPrimaryMuscle: MuscleGroup | undefined

  if ('name' in body) {
    const result = validateName(body.name)
    if (!result.ok) return result
    payload.name = result.value
  }

  if ('primary_muscle' in body) {
    const result = validatePrimaryMuscle(body.primary_muscle)
    if (!result.ok) return result
    payload.primary_muscle = result.value
    normalizedPrimaryMuscle = result.value
  }

  if ('category' in body) {
    const result = validateCategory(body.category)
    if (!result.ok) return result
    payload.category = result.value
  }

  if ('muscle_targets' in body) {
    // Primary-collision enforcement is completed by the PATCH route:
    // when primary_muscle is absent from this payload, the route
    // re-validates the targets against the STORED primary (see
    // validateMuscleTargets docs) — pure validation here can only see
    // what the payload carries.
    const result = validateMuscleTargets(body.muscle_targets, normalizedPrimaryMuscle)
    if (!result.ok) return result
    payload.muscle_targets = result.value
  }

  if ('equipment' in body) {
    const result = validateEquipment(body.equipment)
    if (!result.ok) return result
    payload.equipment = result.value
  }

  if ('tracking_mode' in body) {
    const result = validateTrackingMode(body.tracking_mode)
    if (!result.ok) return result
    payload.tracking_mode = result.value
  }

  if ('unilateral' in body) {
    const result = validateUnilateral(body.unilateral)
    if (!result.ok) return result
    payload.unilateral = result.value
  }

  if ('notes' in body) {
    const result = validateNotes(body.notes)
    if (!result.ok) return result
    payload.notes = result.value
  }

  if ('is_active' in body) {
    const result = validateIsActive(body.is_active)
    if (!result.ok) return result
    payload.is_active = result.value
  }

  if (Object.keys(payload).length === 0) {
    return fail('No valid fields to update.')
  }

  return ok(payload)
}
