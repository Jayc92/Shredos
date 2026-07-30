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
export const MUSCLE_GROUPS = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
  'core', 'quads', 'hamstrings', 'glutes', 'calves', 'full_body', 'other',
] as const
export const EQUIPMENT_TYPES = [
  'barbell', 'dumbbell', 'cable', 'machine',
  'bodyweight', 'resistance_band', 'kettlebell', 'other',
] as const
export const EXERCISE_TYPES = [
  'strength', 'bodyweight', 'machine', 'cable',
  'dumbbell', 'barbell', 'cardio', 'mobility',
] as const

export type ExerciseCategory = typeof EXERCISE_CATEGORIES[number]
export type MuscleGroup = typeof MUSCLE_GROUPS[number]
export type EquipmentType = typeof EQUIPMENT_TYPES[number]
export type ExerciseTypeValue = typeof EXERCISE_TYPES[number]

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
  secondary_muscles: MuscleGroup[]
  equipment: EquipmentType | null
  exercise_type: ExerciseTypeValue
  unilateral: boolean
  notes: string | null
}

export interface ExercisePatchPayload {
  name?: string
  category?: ExerciseCategory | null
  primary_muscle?: MuscleGroup
  secondary_muscles?: MuscleGroup[]
  equipment?: EquipmentType | null
  exercise_type?: ExerciseTypeValue
  unilateral?: boolean
  notes?: string | null
  is_active?: boolean
}

const CREATE_ALLOWED_FIELDS = new Set([
  'name', 'category', 'primary_muscle', 'secondary_muscles',
  'equipment', 'exercise_type', 'unilateral', 'notes',
])

const PATCH_ALLOWED_FIELDS = new Set([
  'name', 'category', 'primary_muscle', 'secondary_muscles',
  'equipment', 'exercise_type', 'unilateral', 'notes', 'is_active',
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
 * primaryMuscle is only passed when the SAME normalized payload also
 * includes a primary_muscle value (POST always has one; PATCH only
 * when the caller explicitly sent it alongside secondary_muscles in
 * the same request). When absent, no exclusion is attempted -- this
 * deliberately avoids querying the database just to look up an
 * existing primary_muscle for the sole purpose of excluding it.
 */
function validateSecondaryMuscles(
  raw: unknown,
  primaryMuscle: MuscleGroup | undefined
): ValidationResult<MuscleGroup[]> {
  if (raw === undefined) return ok([])
  if (!Array.isArray(raw)) return fail('Secondary muscles must be an array of valid muscle groups.')

  const result: MuscleGroup[] = []
  for (const item of raw) {
    if (!isMuscleGroup(item)) return fail('Secondary muscles must be an array of valid muscle groups.')
    if (primaryMuscle && item === primaryMuscle) continue // exclude the primary muscle
    if (!result.includes(item)) result.push(item) // dedupe, preserve first-seen order
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

function validateExerciseType(raw: unknown): ValidationResult<ExerciseTypeValue> {
  if (typeof raw === 'string' && (EXERCISE_TYPES as readonly string[]).includes(raw)) {
    return ok(raw as ExerciseTypeValue)
  }
  return fail('Invalid exercise type.')
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

  const secondaryResult = validateSecondaryMuscles(body.secondary_muscles, muscleResult.value)
  if (!secondaryResult.ok) return secondaryResult

  const equipmentResult = validateEquipment(body.equipment)
  if (!equipmentResult.ok) return equipmentResult

  const exerciseTypeResult = body.exercise_type === undefined
    ? ok<ExerciseTypeValue>('strength')
    : validateExerciseType(body.exercise_type)
  if (!exerciseTypeResult.ok) return exerciseTypeResult

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
    secondary_muscles: secondaryResult.value,
    equipment: equipmentResult.value,
    exercise_type: exerciseTypeResult.value,
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

  if ('secondary_muscles' in body) {
    const result = validateSecondaryMuscles(body.secondary_muscles, normalizedPrimaryMuscle)
    if (!result.ok) return result
    payload.secondary_muscles = result.value
  }

  if ('equipment' in body) {
    const result = validateEquipment(body.equipment)
    if (!result.ok) return result
    payload.equipment = result.value
  }

  if ('exercise_type' in body) {
    const result = validateExerciseType(body.exercise_type)
    if (!result.ok) return result
    payload.exercise_type = result.value
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
