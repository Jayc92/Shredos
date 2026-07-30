// ============================================================
// ShredOS — App Constants
// ============================================================

// ── Protected routes ─────────────────────────────────────────────
// Add routes here to protect them. Middleware uses this list.
export const PROTECTED_ROUTES = [
  '/dashboard',
  '/onboarding',
  '/profile',
  '/weigh-in',
  '/nutrition',
  '/fasting',
  '/decisions',
  '/food',
  '/workouts',
] as const

export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route))
}

// ── Weigh-in ──────────────────────────────────────────────────────
export const WEIGH_IN_DAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },   // default
  { value: 6, label: 'Saturday' },
] as const

export const WEIGH_IN_CADENCE_LABELS: Record<string, string> = {
  weekly: 'Once per week',
  biweekly: 'Once every two weeks',
  manual: 'Manual (I will decide)',
}

// Minimum weigh-ins needed before making strong recommendations
export const MIN_WEIGH_INS_FOR_CONFIDENCE: Record<string, Record<string, number>> = {
  weekly: { low: 1, medium: 2, high: 4 },
  biweekly: { low: 1, medium: 2, high: 4 },
  manual: { low: 1, medium: 3, high: 6 },
}

// ── Nutrition ─────────────────────────────────────────────────────
export const ACTIVITY_LEVEL_MULTIPLIERS: Record<string, number> = {
  sedentary: 10,
  moderately_active: 12,
  very_active: 14,
}

export const ACTIVITY_LEVEL_LABELS: Record<string, string> = {
  sedentary: 'Sedentary (desk job, little exercise)',
  moderately_active: 'Moderately active (3–4 workouts/week)',
  very_active: 'Very active (5+ workouts/week, active job)',
}

export const DEFAULT_DEFICIT = 450     // calories
export const MIN_CARBS_GUARDRAIL = 75  // grams — warn if below this
export const MIN_CALORIES = 1200       // hard floor for safety warning
export const PROTEIN_PER_LB = 1.0     // grams per lb
export const FAT_PER_LB = 0.3         // grams per lb minimum

// Sex-aware BF% thresholds for lean-mass protein basis
export const LEAN_MASS_PROTEIN_THRESHOLD: Record<string, number> = {
  male: 25,
  female: 35,
}

// ── Fasting ───────────────────────────────────────────────────────
export const FASTING_TYPE_LABELS: Record<string, string> = {
  overnight: 'Overnight',
  intermittent: 'Intermittent',
  extended: 'Extended',
  custom: 'Custom',
}

export const FASTING_GOAL_OPTIONS = [
  { value: '12', label: '12 hours (Overnight)' },
  { value: '14', label: '14 hours' },
  { value: '16', label: '16 hours (Common IF)' },
  { value: '18', label: '18 hours (Extended IF)' },
  { value: '20', label: '20 hours' },
  { value: '24', label: '24 hours (Full day)' },
] as const

// ── Decision log ──────────────────────────────────────────────────
export const DECISION_TYPE_LABELS: Record<string, string> = {
  nutrition_targets_set: 'Nutrition targets set',
  nutrition_targets_updated: 'Nutrition targets updated',
  calorie_adjustment: 'Calorie adjustment',
  step_goal_changed: 'Step goal changed',
  fasting_goal_changed: 'Fasting goal changed',
  weigh_in_cadence_changed: 'Weigh-in schedule changed',
  no_change_low_confidence: 'No change — low data confidence',
  protein_target_change: 'Protein target changed',
  training_adjustment: 'Training adjustment',
}

export const DECISION_STATUS_LABELS: Record<string, string> = {
  suggested: 'Suggested',
  accepted: 'Accepted',
  dismissed: 'Dismissed',
  applied: 'Applied',
  reversed: 'Reversed',
}

// ── Dietary preferences (multi-select in onboarding) ─────────────
export const DIETARY_PREF_OPTIONS = [
  'Vegetarian',
  'Vegan',
  'Gluten-free',
  'Dairy-free',
  'Keto / Low-carb',
  'Paleo',
  'Halal',
  'Kosher',
  'No restrictions',
] as const


// ── Meal types ────────────────────────────────────────────────────
export const MEAL_TYPES = [
  { value: 'breakfast',  label: 'Breakfast' },
  { value: 'lunch',      label: 'Lunch' },
  { value: 'dinner',     label: 'Dinner' },
  { value: 'snack',      label: 'Snack' },
  { value: 'supplement', label: 'Supplement' },
  { value: 'drink',      label: 'Drink' },
] as const

export type MealTypeValue = typeof MEAL_TYPES[number]['value']


// ── Workout ───────────────────────────────────────────────────────
export const PRIMARY_MUSCLES = [
  { value: 'chest',     label: 'Chest' },
  { value: 'back',      label: 'Back' },
  { value: 'shoulders', label: 'Shoulders' },
  { value: 'biceps',    label: 'Biceps' },
  { value: 'triceps',   label: 'Triceps' },
  { value: 'forearms',  label: 'Forearms' },
  { value: 'core',      label: 'Core' },
  { value: 'quads',     label: 'Quads' },
  { value: 'hamstrings',label: 'Hamstrings' },
  { value: 'glutes',    label: 'Glutes' },
  { value: 'calves',    label: 'Calves' },
  { value: 'full_body', label: 'Full body' },
  { value: 'other',     label: 'Other' },
] as const

export const EXERCISE_CATEGORIES = [
  { value: 'compound',  label: 'Compound' },
  { value: 'isolation', label: 'Isolation' },
  { value: 'cardio',    label: 'Cardio' },
  { value: 'mobility',  label: 'Mobility' },
  { value: 'other',     label: 'Other' },
] as const

export const EXERCISE_EQUIPMENT = [
  { value: 'barbell',       label: 'Barbell' },
  { value: 'dumbbell',      label: 'Dumbbell' },
  { value: 'cable',         label: 'Cable' },
  { value: 'machine',       label: 'Machine' },
  { value: 'bodyweight',    label: 'Bodyweight' },
  { value: 'resistance_band',label: 'Band' },
  { value: 'kettlebell',    label: 'Kettlebell' },
  { value: 'other',         label: 'Other' },
] as const

export const EXERCISE_TYPES = [
  { value: 'strength',   label: 'Strength' },
  { value: 'bodyweight', label: 'Bodyweight' },
  { value: 'machine',    label: 'Machine' },
  { value: 'cable',      label: 'Cable' },
  { value: 'dumbbell',   label: 'Dumbbell' },
  { value: 'barbell',    label: 'Barbell' },
  { value: 'cardio',     label: 'Cardio' },
  { value: 'mobility',   label: 'Mobility' },
] as const

// Phase 2R: replaces EXERCISE_TYPES as the user-facing field in
// ExerciseForm.tsx. EXERCISE_TYPES above is left defined (unused by
// the UI now) rather than deleted, since the legacy exercise_type
// column and its enum remain in the schema for compatibility.
export const TRACKING_MODES = [
  { value: 'weight_reps', label: 'Weight & reps' },
  { value: 'bodyweight',  label: 'Bodyweight' },
  { value: 'cardio',      label: 'Cardio' },
  { value: 'timed',       label: 'Timed' },
] as const

export const WORKOUT_STATUS_LABELS: Record<string, string> = {
  planned:     'Planned',
  in_progress: 'In progress',
  completed:   'Completed',
  skipped:     'Skipped',
}



export const APP_NAME = 'ShredOS'

// ── Phase 1D — routine constants ─────────────────────────────────
export const ROUTINE_GOALS = [
  { value: 'strength',     label: 'Strength' },
  { value: 'hypertrophy',  label: 'Hypertrophy' },
  { value: 'endurance',    label: 'Endurance' },
  { value: 'conditioning', label: 'Conditioning' },
  { value: 'mobility',     label: 'Mobility' },
  { value: 'mixed',        label: 'Mixed' },
] as const

export const ROUTINE_MUSCLE_FOCUS = [
  { value: 'chest',     label: 'Chest' },
  { value: 'back',      label: 'Back' },
  { value: 'legs',      label: 'Legs' },
  { value: 'shoulders', label: 'Shoulders' },
  { value: 'arms',      label: 'Arms' },
  { value: 'core',      label: 'Core' },
  { value: 'full_body', label: 'Full body' },
  { value: 'other',     label: 'Other' },
] as const

export const ROUTINE_DIFFICULTIES = [
  { value: 'beginner',     label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced',     label: 'Advanced' },
] as const
