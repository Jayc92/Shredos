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

// ── App meta ─────────────────────────────────────────────────────
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'ShredOS'
