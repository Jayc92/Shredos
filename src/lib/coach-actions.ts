// ============================================================
// ShredOS — Coach Actions (Phase 1I)
// Deterministic, rule-based synthesis of existing coaching
// signals into one primary action + up to 3 secondary actions.
//
// Does NOT re-derive weigh-in/food/protein/workout/calorie rules
// from raw tables. Reads fields already computed by:
//   fetchWeeklyReview()          (Phase 1G/1H)
//   fetchNutritionCoachSummary() (Phase 1F)
// This avoids a second, parallel rule chain that could silently
// drift from the originals (the exact risk flagged in the
// Phase 1G-QA audit around duplicated nutrition-coach constants).
//
// No writes here. "Record this decision" is a separate, explicit
// user action that POSTs to the existing /api/decisions endpoint
// with status: 'suggested' — never auto-accepted or auto-applied.
// ============================================================

import { fetchWeeklyReview } from '@/lib/weekly-review'
import { fetchNutritionCoachSummary } from '@/lib/nutrition-coach'
import type { NutritionTarget, UserProfile, FoodLog } from '@/types/database'

const CUTTING_GOALS = ['fat_loss', 'recomposition'] as const

// ── Types ────────────────────────────────────────────────────────────

export type ActionType =
  | 'log_weigh_in'
  | 'log_food'
  | 'hit_protein'
  | 'log_steps'
  | 'complete_workout'
  | 'keep_calories_steady'
  | 'consider_calorie_decrease'
  | 'consider_calorie_increase' // reserved for a future muscle_gain-focused pass; no builder yet
  | 'maintain_current_plan'
  | 'recovery_focus'

export type ActionCategory = 'weight' | 'nutrition' | 'training' | 'activity' | 'general'

export interface CoachAction {
  type: ActionType
  title: string
  reason: string
  category: ActionCategory
  priority: number
  nextStep: string
  linkHref: string
  linkLabel: string
  isRecordable: boolean
  decisionType: string | null
}

export interface CoachActionsSummary {
  primaryAction: CoachAction | null
  secondaryActions: CoachAction[]
  hasEnoughData: boolean
  userGoal: string | null
  daysElapsed: number
}

// ── Pure action builders ─────────────────────────────────────────────────
// Each function returns a CoachAction or null. Order below matches the
// approved priority list. priority field is the position (1 = highest).

function actionLogWeighIn(weighInsThisWeek: number): CoachAction {
  return {
    type: 'log_weigh_in',
    title: 'Log a weigh-in this week',
    reason: 'No weigh-in logged yet this week, and weight trend matters for your goal.',
    category: 'weight',
    priority: 1,
    nextStep: 'Weigh in tomorrow morning, before eating or drinking.',
    linkHref: '/weigh-in',
    linkLabel: 'Log weigh-in',
    isRecordable: true,
    decisionType: 'coach_log_weigh_in',
  }
}

function actionLogFood(foodLoggedDays: number): CoachAction {
  const zero = foodLoggedDays === 0
  return {
    type: 'log_food',
    title: zero ? 'Start logging food this week' : 'Log food more consistently',
    reason: zero
      ? 'Nothing logged yet this week — without it, calorie and protein guidance can’t be reliable.'
      : `Only ${foodLoggedDays} day${foodLoggedDays !== 1 ? 's' : ''} logged so far — aim for at least 4 for a trustworthy picture.`,
    category: 'nutrition',
    priority: 2,
    nextStep: 'Log today’s meals as you go, even roughly.',
    linkHref: '/food',
    linkLabel: 'Log food',
    isRecordable: true,
    decisionType: 'coach_log_food',
  }
}

function actionHitProtein(): CoachAction {
  return {
    type: 'hit_protein',
    title: 'Prioritize protein this week',
    reason: 'Protein has been running low — it helps preserve muscle while you work toward your goal.',
    category: 'nutrition',
    priority: 3,
    nextStep: 'Add a protein source to your next meal or snack.',
    linkHref: '/food',
    linkLabel: 'Log food',
    isRecordable: true,
    decisionType: 'coach_hit_protein',
  }
}

function actionCompleteWorkout(): CoachAction {
  return {
    type: 'complete_workout',
    title: 'Get a workout in this week',
    reason: 'No completed workouts yet this week — training consistency matters for your goal.',
    category: 'training',
    priority: 4,
    nextStep: 'Pick a routine and start today, even a short session.',
    linkHref: '/workouts',
    linkLabel: 'Start a workout',
    isRecordable: true,
    decisionType: 'coach_complete_workout',
  }
}

function actionLogSteps(stepLoggedDays: number): CoachAction {
  return {
    type: 'log_steps',
    title: 'Log steps more consistently',
    reason: `Only ${stepLoggedDays} day${stepLoggedDays !== 1 ? 's' : ''} of steps logged this week — more days give a fuller activity picture.`,
    category: 'activity',
    priority: 5,
    nextStep: 'Log today’s steps once you have a count.',
    linkHref: '/activity',
    linkLabel: 'Log steps',
    isRecordable: true,
    decisionType: 'coach_log_steps',
  }
}

function actionCalorieDecrease(calorieSuggestion: string): CoachAction {
  return {
    type: 'consider_calorie_decrease',
    title: 'Consider a small calorie reduction',
    reason: calorieSuggestion,
    category: 'nutrition',
    priority: 6,
    nextStep: 'Review and optionally adjust your target on the Nutrition page — nothing changes automatically.',
    linkHref: '/nutrition',
    linkLabel: 'Review targets',
    isRecordable: true,
    decisionType: 'coach_calorie_decrease',
  }
}

function actionMaintainPlan(): CoachAction {
  return {
    type: 'maintain_current_plan',
    title: 'Keep your plan as-is',
    reason: 'Your logging, training, and nutrition are on track this week — no changes needed.',
    category: 'general',
    priority: 7,
    nextStep: 'Keep doing what you’re doing.',
    linkHref: '/check-in',
    linkLabel: 'View weekly check-in',
    isRecordable: false,
    decisionType: null,
  }
}

function actionRecoveryFocus(): CoachAction {
  return {
    type: 'recovery_focus',
    title: 'Prioritize recovery this week',
    reason: 'Training volume has been solid — sleep, protein, and easier days help it pay off.',
    category: 'training',
    priority: 7,
    nextStep: 'Consider an easier session or an extra rest day.',
    linkHref: '/workouts',
    linkLabel: 'View workouts',
    isRecordable: false,
    decisionType: null,
  }
}

function actionKeepCaloriesSteady(): CoachAction {
  return {
    type: 'keep_calories_steady',
    title: 'Calories are on track',
    reason: 'Your average this week is within range of your target.',
    category: 'nutrition',
    priority: 6,
    nextStep: 'No change needed — keep logging to confirm the trend.',
    linkHref: '/nutrition',
    linkLabel: 'View targets',
    isRecordable: false,
    decisionType: null,
  }
}

// ── Main synthesis ───────────────────────────────────────────────────────────

/**
 * Builds the ordered action list from already-computed summaries.
 * Pure function — no I/O, fully testable in isolation.
 */
export function buildCoachActions(
  weeklyReview: Awaited<ReturnType<typeof fetchWeeklyReview>>,
  nutritionCoachSummary: Awaited<ReturnType<typeof fetchNutritionCoachSummary>>,
  userGoal: string | null
): CoachActionsSummary {
  const { daysElapsed } = weeklyReview
  const isCutting = CUTTING_GOALS.includes(userGoal as typeof CUTTING_GOALS[number])

  // Too early in the week to be prescriptive — mirrors weekly-review's own gate
  if (daysElapsed < 3) {
    return {
      primaryAction: null,
      secondaryActions: [],
      hasEnoughData: false,
      userGoal,
      daysElapsed,
    }
  }

  const candidates: CoachAction[] = []

  // 1. Missing weigh-in (cutting goals only, enough week elapsed)
  if (isCutting && weeklyReview.weighInsThisWeek === 0 && daysElapsed >= 4) {
    candidates.push(actionLogWeighIn(weeklyReview.weighInsThisWeek))
  }

  // 2. No / poor food logging
  if (weeklyReview.foodLoggedDays === 0 && daysElapsed >= 3) {
    candidates.push(actionLogFood(weeklyReview.foodLoggedDays))
  } else if (weeklyReview.foodLoggedDays < 4 && daysElapsed >= 5) {
    candidates.push(actionLogFood(weeklyReview.foodLoggedDays))
  }

  // 3. Protein consistently low
  if (weeklyReview.proteinStatus === 'low' && weeklyReview.foodLoggedDays >= 3) {
    candidates.push(actionHitProtein())
  }

  // 4. No workouts this week
  if (weeklyReview.sessionsCompleted === 0 && daysElapsed >= 4) {
    candidates.push(actionCompleteWorkout())
  }

  // 5. Steps consistency (only meaningful if a step goal exists)
  if (
    weeklyReview.stepGoal !== null &&
    weeklyReview.stepLoggedDays < 4 &&
    daysElapsed >= 5
  ) {
    candidates.push(actionLogSteps(weeklyReview.stepLoggedDays))
  }

  // 6. Calorie adjustment — reuses nutrition-coach's own guardrails exactly.
  // nutritionCoachSummary.calorieSuggestion is already gated on: high logging
  // confidence (6+ days), cutting goal only, 2+ weigh-ins via weight trend,
  // not already losing, not already below target, and never below the
  // calorie floor. Coach Actions does not re-check any of these — it only
  // decides whether to surface the existing suggestion.
  if (nutritionCoachSummary.calorieSuggestion) {
    candidates.push(actionCalorieDecrease(nutritionCoachSummary.calorieSuggestion))
  } else if (nutritionCoachSummary.calorieTrend === 'on-track') {
    candidates.push(actionKeepCaloriesSteady())
  }

  // 7. Fallback: maintain plan, or recovery focus for high training volume
  if (candidates.length === 0) {
    if (weeklyReview.sessionsCompleted >= 4) {
      candidates.push(actionRecoveryFocus())
    } else {
      candidates.push(actionMaintainPlan())
    }
  }

  // Sort by priority (ascending = most important first), stable order preserved
  candidates.sort((a, b) => a.priority - b.priority)

  const [primaryAction, ...rest] = candidates
  const secondaryActions = rest.slice(0, 3)

  return {
    primaryAction: primaryAction ?? null,
    secondaryActions,
    hasEnoughData: true,
    userGoal,
    daysElapsed,
  }
}

/**
 * Fetches the two existing coaching summaries and synthesizes them into
 * a Coach Actions summary. Adds ZERO new Supabase queries of its own —
 * all queries happen inside fetchWeeklyReview and fetchNutritionCoachSummary,
 * which are called here exactly as the dashboard and check-in pages already
 * call them.
 */
export async function fetchCoachActions(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  todayStr: string,
  profile: UserProfile,
  target: NutritionTarget | null,
  todayFoodLogs: FoodLog[]
): Promise<CoachActionsSummary> {
  const [weeklyReview, nutritionCoachSummary] = await Promise.all([
    fetchWeeklyReview(
      supabase,
      userId,
      todayStr,
      target,
      profile.main_goal,
      profile.fasting_enabled,
      profile.step_goal
    ),
    fetchNutritionCoachSummary(
      supabase,
      userId,
      todayStr,
      target,
      todayFoodLogs,
      profile.main_goal
    ),
  ])

  return buildCoachActions(weeklyReview, nutritionCoachSummary, profile.main_goal)
}
