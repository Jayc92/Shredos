// ============================================================
// ShredOS — App-Level Types
// ============================================================

export type TrendConfidence = 'none' | 'low' | 'medium' | 'high'

export interface NutritionCalculationResult {
  calories: number
  protein_g: number
  fat_g: number
  carbs_g: number
  maintenance_cal: number
  deficit: number           // positive = deficit, negative = surplus
  multiplier_used: number   // 10 / 12 / 14
  protein_basis: 'bodyweight' | 'lean_mass'
  low_carb_warning: boolean
  warnings: string[]        // human-readable warnings for UI
}

export interface NutritionCalculationInput {
  weightLbs: number
  bfPct?: number
  sex?: string | null
  activityLevel: 'sedentary' | 'moderately_active' | 'very_active'
  goal: 'fat_loss' | 'muscle_gain' | 'strength' | 'recomposition' | 'maintenance' | 'running'
  deficitOverride?: number
}

export interface FastingMilestone {
  hours: number
  label: string
  note: string              // educational, not prescriptive
  coachNote: string         // practical coaching language
}

export interface FastingDurationResult {
  minutes: number
  hours: number
  formatted: string         // e.g. "14h 23m"
  milestone: FastingMilestone | null
}

export interface WeighInTrend {
  latestWeightKg: number | null
  latestWeightLbs: number | null
  latestDate: string | null
  previousWeightKg: number | null
  changeKg: number | null
  changeLbs: number | null
  weighInCount: number
  confidence: TrendConfidence
  nextWeighInDate: Date | null
  goalWeightKg: number | null
  goalWeightLbs: number | null
}

export interface FastingWeekStats {
  completedCount: number
  totalCount: number
  avgDurationMinutes: number | null
  avgDurationFormatted: string | null
}

export interface DashboardData {
  profile: import('./database').UserProfile | null
  weighInTrend: WeighInTrend
  currentNutritionTarget: import('./database').NutritionTarget | null
  activeFast: import('./database').FastingLog | null
  latestDecisions: import('./database').DecisionLog[]
  fastingStats: FastingWeekStats
}

// Onboarding form state
export interface OnboardingFormState {
  // Step 1 — Bio
  display_name: string
  age: string
  sex: string
  height_ft: string
  height_in: string
  weight_lbs: string
  goal_weight_lbs: string
  bf_pct: string
  goal_bf_pct: string
  // Step 2 — Goals
  main_goal: string
  training_experience: string
  activity_level: string
  step_goal: string
  // Step 3 — Schedule & preferences
  preferred_weigh_in_cadence: string
  preferred_weigh_in_day: string
  preferred_weigh_in_time: string
  fasting_enabled: boolean
  default_fasting_goal_hours: string
  fasting_notes: string
  dietary_prefs: string[]
  injuries: string
  // Step 4 — Nutrition (review only, deficit override)
  deficit_override: string
}
