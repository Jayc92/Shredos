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
  created_at: string
  updated_at: string
}

export type UserProfileInsert = Omit<UserProfile, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
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
}

export type DecisionLogInsert = Omit<DecisionLog, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
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

export type PrimaryMuscle =
  | 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps'
  | 'forearms' | 'core' | 'quads' | 'hamstrings'
  | 'glutes' | 'calves' | 'full_body' | 'other'

export type ExerciseCategory = 'compound' | 'isolation' | 'cardio' | 'mobility' | 'other'

export type ExerciseEquipment =
  | 'barbell' | 'dumbbell' | 'cable' | 'machine'
  | 'bodyweight' | 'resistance_band' | 'kettlebell' | 'other'

export type ExerciseType =
  | 'strength' | 'bodyweight' | 'machine' | 'cable'
  | 'dumbbell' | 'barbell' | 'cardio' | 'mobility'

export type WorkoutStatus = 'planned' | 'in_progress' | 'completed' | 'skipped'

export interface Exercise {
  id: string
  user_id: string
  name: string
  category: ExerciseCategory | null
  primary_muscle: PrimaryMuscle
  secondary_muscles: string[]
  equipment: ExerciseEquipment | null
  exercise_type: ExerciseType
  unilateral: boolean
  notes: string | null
  is_active: boolean
  is_system: boolean
  created_at: string
  updated_at: string
}
export type ExerciseInsert = Omit<Exercise,'id'|'created_at'|'updated_at'> & { id?:string; created_at?:string; updated_at?:string }
export type ExerciseUpdate  = Partial<Omit<Exercise,'id'|'user_id'|'created_at'>>

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
  created_at: string
  updated_at: string
}
export type WorkoutSessionInsert = Omit<WorkoutSession,'id'|'created_at'|'updated_at'> & { id?:string; created_at?:string; updated_at?:string }
export type WorkoutSessionUpdate  = Partial<Omit<WorkoutSession,'id'|'user_id'|'created_at'>>

export interface WorkoutExercise {
  id: string
  workout_session_id: string
  exercise_id: string
  order_index: number
  target_sets: number | null
  target_reps: number | null
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
// ============================================================
export interface DailyActivityLog {
  id: string
  user_id: string
  logged_date: string
  steps: number
  notes: string | null
  created_at: string
  updated_at: string
}
