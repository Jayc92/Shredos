// ============================================================
// ShredOS — Database Types
// These mirror the Supabase schema exactly.
// Regenerate with: npx supabase gen types typescript --project-id <ref>
// ============================================================

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type WeighInCadence = 'weekly' | 'biweekly' | 'manual'
export type WeighInTime = 'morning' | 'evening'
export type Sex = 'male' | 'female' | 'other' | 'prefer_not_to_say'
export type TrainingExperience = 'beginner' | 'intermediate' | 'advanced'
export type MainGoal = 'fat_loss' | 'muscle_gain' | 'strength' | 'recomposition' | 'maintenance' | 'running'
export type ActivityLevel = 'sedentary' | 'moderately_active' | 'very_active'
export type FastingType = 'overnight' | 'intermittent' | 'extended' | 'custom'
export type DecisionStatus = 'suggested' | 'accepted' | 'dismissed' | 'applied' | 'reversed'
export type DecisionCreatedBy = 'user' | 'system' | 'coach'
export type ProteinBasis = 'bodyweight' | 'lean_mass'

export interface UserProfile {
  id: string
  user_id: string
  display_name: string
  age: number | null
  sex: Sex | null
  height_cm: number | null
  current_weight_kg: number | null
  goal_weight_kg: number | null
  bf_pct: number | null
  goal_bf_pct: number | null
  training_experience: TrainingExperience | null
  main_goal: MainGoal | null
  activity_level: ActivityLevel | null
  step_goal: number
  dietary_prefs: string[]
  allergies: string[]
  injuries: string | null
  notes: string | null
  preferred_weigh_in_cadence: WeighInCadence
  preferred_weigh_in_day: number // 0=Sun … 6=Sat
  preferred_weigh_in_time: WeighInTime
  fasting_enabled: boolean
  default_fasting_goal_hours: number | null
  fasting_notes: string | null
  onboarding_complete: boolean
  /** UI-3: versioned Today customization document (JSONB). Stored
   *  shape is untrusted — always pass through normalizeDashboardPrefs
   *  before use; '{}' (the column default) normalizes to canonical
   *  defaults. */
  dashboard_prefs: unknown
  created_at: string
  updated_at: string
}

export type UserProfileInsert = Omit<
  UserProfile,
  'id' | 'created_at' | 'updated_at' | 'dashboard_prefs'
> & {
  id?: string
  created_at?: string
  updated_at?: string
  /** Has a database default ('{}'); inserts may omit it. */
  dashboard_prefs?: unknown
}

export type UserProfileUpdate = Partial<Omit<UserProfile, 'id' | 'user_id' | 'created_at'>>

// ── body_metrics ─────────────────────────────────────────────────
export interface BodyMetric {
  id: string
  user_id: string
  logged_date: string // ISO date string 'YYYY-MM-DD'
  weight_kg: number | null
  bf_pct: number | null
  waist_cm: number | null
  chest_cm: number | null
  arms_cm: number | null
  thighs_cm: number | null
  hips_cm: number | null
  rhr: number | null
  sleep_hr: number | null
  energy_1_5: number | null
  hunger_1_5: number | null
  mood_1_5: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type BodyMetricInsert = Omit<BodyMetric, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
}

export type BodyMetricUpdate = Partial<Omit<BodyMetric, 'id' | 'user_id' | 'created_at'>>

// ── nutrition_targets ─────────────────────────────────────────────
export interface NutritionTarget {
  id: string
  user_id: string
  effective_date: string // ISO date string
  calories: number
  protein_g: number
  fat_g: number
  carbs_g: number
  fiber_g: number | null
  water_ml: number | null
  maintenance_cal: number | null
  deficit: number | null
  activity_level: ActivityLevel | null
  multiplier_used: number | null
  protein_basis: ProteinBasis | null
  low_carb_warning: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export type NutritionTargetInsert = Omit<NutritionTarget, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
}

// ── fasting_logs ──────────────────────────────────────────────────
// duration_minutes is NOT stored — calculated in app
export interface FastingLog {
  id: string
  user_id: string
  started_at: string // ISO timestamp
  ended_at: string | null // null = active fast
  fasting_type: FastingType
  goal_hours: number | null
  completed_goal: boolean | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type FastingLogInsert = Omit<FastingLog, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
}

export type FastingLogUpdate = Partial<Omit<FastingLog, 'id' | 'user_id' | 'created_at'>>

// ── decision_logs ─────────────────────────────────────────────────
// Phase 3D: manual follow-through and outcome review. All new fields
// are additive (migration 012) with safe defaults; historical rows
// read as not_started / null.
export type FollowThroughStatus = 'not_started' | 'completed' | 'abandoned' | 'not_applicable'
export type DecisionOutcome =
  | 'positive'
  | 'neutral'
  | 'negative'
  | 'mixed'
  | 'unclear'
  | 'needs_more_time'

export interface DecisionLog {
  id: string
  user_id: string
  decision_type: string
  decision_title: string
  decision_summary: string
  reason: string
  data_snapshot: Json | null
  previous_value: Json | null
  new_value: Json | null
  status: DecisionStatus
  created_by: DecisionCreatedBy
  created_at: string
  updated_at: string
  applied_at: string | null
  notes: string | null
  // Phase 3D (migration 012)
  follow_through_status: FollowThroughStatus
  completed_at: string | null
  review_on: string | null // date-only 'YYYY-MM-DD'
  reviewed_at: string | null
  outcome: DecisionOutcome | null
  outcome_notes: string | null
}

export type DecisionLogInsert = Omit<
  DecisionLog,
  | 'id' | 'created_at' | 'updated_at'
  | 'follow_through_status' | 'completed_at' | 'review_on'
  | 'reviewed_at' | 'outcome' | 'outcome_notes'
> & {
  id?: string
  created_at?: string
  updated_at?: string
  // Phase 3D fields are never supplied at creation — the database
  // defaults apply; follow-through begins after a decision exists.
  follow_through_status?: FollowThroughStatus
  completed_at?: string | null
  review_on?: string | null
  reviewed_at?: string | null
  outcome?: DecisionOutcome | null
  outcome_notes?: string | null
}

export type DecisionLogUpdate = Partial<Omit<DecisionLog, 'id' | 'user_id' | 'created_at'>>

// ── saved_meals ───────────────────────────────────────────────────
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'supplement' | 'drink'

export interface SavedMealItem {
  name: string
  serving?: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  food_item_id?: string | null // Phase 2C
}

export interface SavedMeal {
  id: string
  user_id: string
  name: string
  meal_type_default: MealType | null
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number | null
  sugar_g: number | null
  sodium_mg: number | null
  items: SavedMealItem[]
  is_autopilot: boolean
  notes: string | null
  use_count: number
  last_used_at: string | null
  created_at: string
  updated_at: string
}

export type SavedMealInsert = Omit<SavedMeal, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
}

export type SavedMealUpdate = Partial<Omit<SavedMeal, 'id' | 'user_id' | 'created_at'>>

// ── nutrition_day_status (Phase 5B.2, migration 019) ──────────────
// A row means the user EXPLICITLY marked the day's logging complete
// ("Finished logging today"). Absence means unknown — never
// explicitly incomplete. The only status value is 'complete';
// partial/heuristic classifications are derived at read time
// (energy-facts), never stored.
export interface NutritionDayStatus {
  id: string
  user_id: string
  logged_date: string
  status: 'complete'
  created_at: string
  updated_at: string
}

// ── food_logs ─────────────────────────────────────────────────────
export interface FoodLog {
  id: string
  user_id: string
  logged_date: string // ISO date 'YYYY-MM-DD'
  meal_type: MealType
  food_name: string
  serving_description: string | null
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number | null
  sugar_g: number | null
  sodium_mg: number | null
  saved_meal_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type FoodLogInsert = Omit<FoodLog, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
}

export type FoodLogUpdate = Partial<Omit<FoodLog, 'id' | 'user_id' | 'created_at'>>

// ── Phase 1C — workout logging ────────────────────────────────────

// Phase 5A.6B: the canonical 25-value anatomy vocabulary (migration
// 018 widened the CHECK). The broad values back/shoulders/core remain
// valid — existing rows stay honestly broad, never guess-mapped.
export type PrimaryMuscle =
  | 'chest' | 'lats' | 'upper_back' | 'lower_back' | 'traps'
  | 'front_delts' | 'side_delts' | 'rear_delts'
  | 'biceps' | 'triceps' | 'forearms'
  | 'quads' | 'hamstrings' | 'glutes' | 'calves'
  | 'hip_flexors' | 'adductors' | 'abductors'
  | 'abs' | 'obliques'
  | 'back' | 'shoulders' | 'core'
  | 'full_body' | 'other'

// Phase 5A.6B: secondary/tertiary relationship rows (exercise_muscles,
// migration 018). The primary target is NOT in this table — it stays
// on exercises.primary_muscle (exactly one, structurally). Roles
// only; contribution weights are a future central Coach concern and
// are deliberately not stored.
export type ExerciseMuscleRole = 'secondary' | 'tertiary'

export interface ExerciseMuscle {
  id: string
  user_id: string
  exercise_id: string
  muscle: PrimaryMuscle
  role: ExerciseMuscleRole
  created_at: string
}

export type ExerciseCategory = 'compound' | 'isolation' | 'cardio' | 'mobility' | 'other'

export type ExerciseEquipment =
  | 'barbell' | 'dumbbell' | 'cable' | 'machine'
  | 'bodyweight' | 'resistance_band' | 'kettlebell' | 'other'

export type ExerciseType =
  | 'strength' | 'bodyweight' | 'machine' | 'cable'
  | 'dumbbell' | 'barbell' | 'cardio' | 'mobility'

// Phase 2R: replaces ExerciseType as the source of application/coaching
// behavior. ExerciseType/exercise_type remains on Exercise below for
// legacy DB compatibility only -- it is derived from tracking_mode on
// write, never read for behavior.
export type TrackingMode = 'weight_reps' | 'bodyweight' | 'cardio' | 'timed'

export type WorkoutStatus = 'planned' | 'in_progress' | 'completed' | 'skipped'

export interface Exercise {
  id: string
  user_id: string
  name: string
  category: ExerciseCategory | null
  primary_muscle: PrimaryMuscle
  /** DEPRECATED (5A.6B): rollback insurance only. Backfilled into
   *  exercise_muscles by migration 018; the app never writes it and
   *  never reads it as authoritative. A later cleanup migration drops
   *  it after the join-table model survives a stable checkpoint. */
  secondary_muscles: string[]
  equipment: ExerciseEquipment | null
  exercise_type: ExerciseType
  tracking_mode: TrackingMode
  unilateral: boolean
  notes: string | null
  is_active: boolean
  is_system: boolean
  created_at: string
  updated_at: string
  /** Embedded secondary/tertiary relationship rows, present when the
   *  query selects exercise_muscles (5A.6B). */
  exercise_muscles?: ExerciseMuscle[]
}
export type ExerciseInsert = Omit<Exercise,'id'|'created_at'|'updated_at'> & { id?:string; created_at?:string; updated_at?:string }
export type ExerciseUpdate  = Partial<Omit<Exercise,'id'|'user_id'|'created_at'>>

// Phase 5A.2 (migration 014): capture provenance. 'legacy' = rows
// predating the migration (capture method unknowable — never falsely
// labeled 'live'); 'imported' is reserved, no import behavior exists.
export type WorkoutSource = 'legacy' | 'live' | 'manual' | 'imported'

export interface WorkoutSession {
  id: string
  user_id: string
  workout_date: string
  title: string
  status: WorkoutStatus
  start_time: string | null
  end_time: string | null
  notes: string | null
  routine_id: string | null  // Phase 1D: nullable FK; null = manually started session
  completed_duration_seconds: number | null  // Phase 2J: persisted at first completion, preserved through reopen/recomplete corrections
  calories_burned: number | null  // Phase 5A.2: user-entered, informational only; NULL = not recorded, 0 = explicitly zero
  source: WorkoutSource  // Phase 5A.2: capture provenance (migration 014)
  created_at: string
  updated_at: string
}
// ── activity_sessions ─────────────────────────────────────────────
// Phase 5A.3 (migration 015): intentional activity sessions — the
// third leg of the strict boundary (workout_sessions = strength,
// daily_activity_logs = passive per-day steps). started_at is
// optional; ended_at is deliberately not stored (derivable).
// source has no default and no 'legacy' (new table): every writer
// states provenance; 'live'/'imported' are reserved vocabulary.
export type ActivitySource = 'manual' | 'live' | 'imported'

export interface ActivitySession {
  id: string
  user_id: string
  activity_type: string  // constrained by the migration CHECK; app vocabulary in lib/activity
  activity_date: string  // authoritative local calendar date
  started_at: string | null  // NULL = start time unknown
  duration_seconds: number
  distance_meters: number | null  // canonical meters (011 convention); NULL = not recorded
  calories_burned: number | null  // NULL = not recorded, 0 = explicitly zero
  source: ActivitySource
  notes: string | null
  created_at: string
  updated_at: string
}
export type ActivitySessionInsert = Omit<ActivitySession,'id'|'created_at'|'updated_at'> & { id?:string; created_at?:string; updated_at?:string }
export type ActivitySessionUpdate = Partial<Omit<ActivitySession,'id'|'user_id'|'source'|'created_at'>>

export type WorkoutSessionInsert = Omit<WorkoutSession,'id'|'created_at'|'updated_at'> & { id?:string; created_at?:string; updated_at?:string }
export type WorkoutSessionUpdate  = Partial<Omit<WorkoutSession,'id'|'user_id'|'created_at'>>

export interface WorkoutExercise {
  id: string
  workout_session_id: string
  exercise_id: string
  order_index: number
  target_sets: number | null
  target_reps: number | null
  target_reps_min: number | null  // Phase 2F: snapshotted from the originating routine, if any
  target_reps_max: number | null  // Phase 2F: snapshotted from the originating routine, if any
  target_weight_kg: number | null
  notes: string | null
  created_at: string
  updated_at: string
}
export type WorkoutExerciseInsert = Omit<WorkoutExercise,'id'|'created_at'|'updated_at'> & { id?:string; created_at?:string; updated_at?:string }
export type WorkoutExerciseUpdate  = Partial<Omit<WorkoutExercise,'id'|'workout_session_id'|'created_at'>>

export interface WorkoutSet {
  id: string
  workout_exercise_id: string
  set_number: number
  weight_kg: number | null
  reps: number | null
  rpe: number | null
  completed: boolean
  is_warmup: boolean
  notes: string | null
  // Phase 2S: tracking-aware set entry for cardio/timed exercises.
  duration_seconds: number | null
  distance_meters: number | null
  created_at: string
}
export type WorkoutSetInsert = Omit<WorkoutSet,'id'|'created_at'> & { id?:string; created_at?:string }
export type WorkoutSetUpdate  = Partial<Omit<WorkoutSet,'id'|'workout_exercise_id'|'created_at'>>

// Rich joined types for UI
export type WorkoutExerciseWithDetails = WorkoutExercise & {
  exercise: Exercise
  workout_sets: WorkoutSet[]
}
export type WorkoutSessionWithExercises = WorkoutSession & {
  workout_exercises: WorkoutExerciseWithDetails[]
}

// ── Phase 1D — saved routines ────────────────────────────────────

export type RoutineGoal = 'strength' | 'hypertrophy' | 'endurance' | 'conditioning' | 'mobility' | 'mixed'
export type RoutineMuscleFocus = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core' | 'full_body' | 'other'
export type RoutineDifficulty = 'beginner' | 'intermediate' | 'advanced'

export interface WorkoutRoutine {
  id: string
  user_id: string
  name: string
  description: string | null
  goal: RoutineGoal | null
  primary_muscle_focus: RoutineMuscleFocus | null
  difficulty: RoutineDifficulty | null
  estimated_duration_minutes: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface WorkoutRoutineExercise {
  id: string
  routine_id: string
  exercise_id: string
  order_index: number
  target_sets: number | null
  target_reps_min: number | null
  target_reps_max: number | null
  target_weight_kg: number | null  // stored kg, displayed lbs
  target_rpe: number | null
  rest_seconds: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface WorkoutRoutineExerciseWithDetails extends WorkoutRoutineExercise {
  exercise: Exercise
}

export interface WorkoutRoutineWithExercises extends WorkoutRoutine {
  workout_routine_exercises: WorkoutRoutineExerciseWithDetails[]
}


// ============================================================
// Phase 1H — daily activity/steps logging
// Phase 5A.4 — aggregate daily distance + honestly optional steps.
// For BOTH metrics: NULL = not recorded, 0 = explicitly recorded
// zero. Steps-only, distance-only, both, and zero-steps-plus-
// positive-distance are all valid rows. Intentional
// activity_sessions are component records and never feed these
// aggregates; no steps/distance conversion exists in either
// direction.
// ============================================================
export interface DailyActivityLog {
  id: string
  user_id: string
  logged_date: string
  steps: number | null
  /** Canonical meters (NUMERIC(10,2)); miles are a UI concern. */
  distance_meters: number | null
  notes: string | null
  created_at: string
  updated_at: string
}
