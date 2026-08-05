// ============================================================
// ShredOS — Goal-Aware Adjustment Review (Phase 3E)
// Deterministic, evidence-based review of whether the user should
// CONSIDER a small calorie-target change. Proposals only — nothing
// here (or anywhere) changes a target, records a decision, or touches
// the profile automatically; every change requires the explicit
// apply action, which the server re-validates.
//
// The model keeps the product distinctions separate: observed data
// (completed-week averages), interpretation (band classification),
// proposed adjustment (this review), user decision + applied change
// (the API apply path), and later follow-through/outcome (Phase 3D).
//
// Reuse, never re-derive:
//   windows    → 3A latestCompletedWeekStart / reviewWeekBounds
//   weight     → 3A computeWeeklyWeight (2Y same-day dedup inside)
//   nutrition  → 3A computeWeeklyNutrition (2Z normalizer inside)
//   floors     → nutrition-coach's MIN_CALORIES_FLOOR and
//                constants' MIN_CARBS_GUARDRAIL
//   thresholds → weight-trends' MIN_DATES_FOR_AVERAGE and
//                coach-constants' MIN_RELIABLE_LOGGED_DAYS
//
// Language rules (encoded, harness-scanned): no causal claims, no
// medical/metabolic/hormonal wording, no false precision — broad
// bands and round 100/200-calorie steps only.
// ============================================================

import { addDays, format, parseISO, subDays } from 'date-fns'
import { kgToLbs } from '@/lib/units'
import {
  latestCompletedWeekStart,
  reviewWeekBounds,
  computeWeeklyWeight,
  computeWeeklyNutrition,
} from '@/lib/weekly-review'
import type { ReviewWeekBounds } from '@/lib/weekly-review'
import type { RawWeighInLike } from '@/lib/weight-trends'
import { MIN_DATES_FOR_AVERAGE } from '@/lib/weight-trends'
import type { RawFoodLogLike } from '@/lib/nutrition-trends'
import { MIN_RELIABLE_LOGGED_DAYS } from '@/lib/coach-constants'
import { MIN_CALORIES_FLOOR } from '@/lib/nutrition-coach'
import { MIN_CARBS_GUARDRAIL } from '@/lib/constants'
import { followThroughOf } from '@/lib/decisions'

// ── Constants (documented decisions) ─────────────────────────────────

/** Existing decision type reused for applied calorie adjustments. */
export const ADJUSTMENT_DECISION_TYPE = 'calorie_adjustment'
/** Manual override decisions also count as recent target changes. */
export const MANUAL_TARGET_DECISION_TYPE = 'nutrition_targets_updated'

export const CALORIE_STEP_SMALL = 100
export const CALORIE_STEP_LARGE = 200
/** Deviation from the band edge (percentage points of body weight per
 * week) required — together with strong logging — for the 200 step. */
export const STRONG_EVIDENCE_DEVIATION_PP = 0.5
export const STRONG_EVIDENCE_NUTRITION_DAYS = 5

/** Weigh-in dates required in EACH completed week (2Y's shared rule). */
export const MIN_WEIGH_IN_DAYS = MIN_DATES_FOR_AVERAGE
/** Nutrition days required in the review week (existing coach rule). */
export const MIN_NUTRITION_DAYS = MIN_RELIABLE_LOGGED_DAYS

/** Body-fat context: most recent metric within this window wins;
 * profile body fat is the fallback; outside 3–60% is implausible. */
export const BODY_FAT_RECENCY_DAYS = 56
const BODY_FAT_MIN_PLAUSIBLE = 3
const BODY_FAT_MAX_PLAUSIBLE = 60

/** Suggested review date for an applied change: two weeks out —
 * shown to the user BEFORE they approve, never scheduled/notified. */
export const ADJUSTMENT_REVIEW_AFTER_DAYS = 14

/** Maintenance drift tolerance, % of body weight per week. */
const MAINTENANCE_STABLE_PP = 0.35

// ── Types ────────────────────────────────────────────────────────────

export type AdjustmentEligibility =
  | 'eligible'
  | 'hold'
  | 'insufficient_weight_data'
  | 'insufficient_nutrition_data'
  | 'improve_logging'
  | 'awaiting_review'
  | 'pending_existing_decision'
  | 'recent_target_change'
  | 'unsupported_goal'
  | 'missing_target'
  | 'data_unavailable'

export type WeightTrendBand =
  | 'slower_than_expected'
  | 'within_expected_range'
  | 'faster_than_expected'
  | 'insufficient_data'

export type AdjustmentDirection = 'decrease' | 'increase' | 'hold'

export interface AdjustmentTargetLike {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  effective_date: string
}

export interface AdjustmentDecisionLike {
  decision_type: string
  status: string
  follow_through_status?: string | null
  reviewed_at?: string | null
  created_at: string
}

export interface GoalAdjustmentInput {
  todayStr: string
  goal: string | null
  target: AdjustmentTargetLike | null
  /** body_metrics rows (weight and/or bf), bounded by the fetch. */
  weighInRows: Array<RawWeighInLike & { bf_pct?: number | null }>
  foodLogRows: RawFoodLogLike[]
  profileBfPct: number | null
  recentDecisions: AdjustmentDecisionLike[]
  availability: { weight: boolean; nutrition: boolean; decisions: boolean }
}

export interface GoalAdjustmentReview {
  eligibility: AdjustmentEligibility
  window: {
    startDate: string
    endDate: string
    priorStartDate: string
    priorEndDate: string
    label: string
  }
  goal: string | null
  weight: {
    currentAverageLbs: number | null
    priorAverageLbs: number | null
    /** Signed % of body weight per week (+ = gain), 2 decimals. */
    weeklyChangePct: number | null
    loggedDaysCurrent: number
    loggedDaysPrior: number
    band: WeightTrendBand
  }
  nutrition: {
    loggedDays: number
    averageCalories: number | null
    proteinTargetMetDays: number | null
    proteinTargetEligibleDays: number | null
  }
  bodyFat: { pct: number | null; source: 'recent_metric' | 'profile' | null }
  currentCalories: number | null
  proposedCalories: number | null
  /** Signed calories (negative = decrease); always ±100 or ±200. */
  adjustmentAmount: number | null
  direction: AdjustmentDirection
  evidenceStrength: 'standard' | 'strong' | null
  guardrails: string[]
  blockingReasons: string[]
  explanation: string
  decisionType: typeof ADJUSTMENT_DECISION_TYPE
  before: { calories: number } | null
  after: { calories: number } | null
  suggestedReviewOn: string | null
}

// ── Body-fat context ─────────────────────────────────────────────────

function plausibleBf(v: number | null | undefined): number | null {
  if (v === null || v === undefined || !Number.isFinite(v)) return null
  if (v < BODY_FAT_MIN_PLAUSIBLE || v > BODY_FAT_MAX_PLAUSIBLE) return null
  return v
}

/** Most recent plausible body-fat metric within the recency window,
 * falling back to the profile value; never inferred. */
export function resolveBodyFatContext(
  rows: Array<{ logged_date: string; bf_pct?: number | null }>,
  profileBfPct: number | null,
  windowEndDate: string
): { pct: number | null; source: 'recent_metric' | 'profile' | null } {
  const cutoff = format(
    subDays(parseISO(windowEndDate), BODY_FAT_RECENCY_DAYS),
    'yyyy-MM-dd'
  )
  const candidates = rows
    .filter((r) => r.logged_date >= cutoff && r.logged_date <= windowEndDate)
    .filter((r) => plausibleBf(r.bf_pct) !== null)
    .sort((a, b) => b.logged_date.localeCompare(a.logged_date))
  if (candidates.length > 0) {
    return { pct: plausibleBf(candidates[0].bf_pct), source: 'recent_metric' }
  }
  const fromProfile = plausibleBf(profileBfPct)
  if (fromProfile !== null) return { pct: fromProfile, source: 'profile' }
  return { pct: null, source: null }
}

// ── Expected-rate bands (broad, contextual — never prescriptions) ────

export interface WeeklyRateBand {
  /** % of body weight per week, positive numbers. */
  minPct: number
  maxPct: number
}

/** Fat-loss band by body-fat context. Leaner users get slower bands;
 * unknown body fat uses the moderate default. Sex-aware protein rules
 * remain in nutrition.ts, untouched — body fat here only widens or
 * narrows the tolerable-loss band. */
export function fatLossBand(bfPct: number | null): WeeklyRateBand {
  if (bfPct !== null && bfPct >= 20) return { minPct: 0.5, maxPct: 1.25 }
  if (bfPct !== null && bfPct < 10) return { minPct: 0.25, maxPct: 0.5 }
  return { minPct: 0.5, maxPct: 1.0 }
}

/** Conservative gain band for muscle_gain and strength goals. */
export const GAIN_BAND: WeeklyRateBand = { minPct: 0.1, maxPct: 0.5 }

const SUPPORTED_GOALS = ['fat_loss', 'maintenance', 'muscle_gain', 'strength'] as const

// ── Blocking decisions and cooldown ──────────────────────────────────

/**
 * Blocking rules (documented, deterministic):
 *   - a SUGGESTED calorie_adjustment decision is pending → block
 *   - an ACCEPTED calorie_adjustment with follow-through not started
 *     → block (the user hasn't acted on the last one)
 *   - an APPLIED calorie_adjustment or manual target change created on
 *     or after the prior completed week's Monday and not yet outcome-
 *     reviewed → awaiting_review (the two-completed-weeks cooldown)
 *   - DISMISSED decisions never block; reviewed or older-than-cooldown
 *     decisions never block — nothing blocks forever.
 */
export function findBlockingDecision(
  decisions: AdjustmentDecisionLike[],
  priorWeekStart: string
): { kind: 'pending' | 'awaiting_review'; decision: AdjustmentDecisionLike } | null {
  for (const d of decisions) {
    if (d.decision_type === ADJUSTMENT_DECISION_TYPE) {
      if (d.status === 'suggested') return { kind: 'pending', decision: d }
      if (d.status === 'accepted' && followThroughOf(d as never) === 'not_started') {
        return { kind: 'pending', decision: d }
      }
    }
    if (
      (d.decision_type === ADJUSTMENT_DECISION_TYPE ||
        d.decision_type === MANUAL_TARGET_DECISION_TYPE) &&
      d.status === 'applied' &&
      (d.reviewed_at ?? null) === null &&
      d.created_at.slice(0, 10) >= priorWeekStart
    ) {
      return { kind: 'awaiting_review', decision: d }
    }
  }
  return null
}

// ── The evaluator ────────────────────────────────────────────────────

function emptyReview(
  input: GoalAdjustmentInput,
  bounds: ReviewWeekBounds
): GoalAdjustmentReview {
  return {
    eligibility: 'hold',
    window: {
      startDate: bounds.startDate,
      endDate: bounds.endDate,
      priorStartDate: bounds.priorStartDate,
      priorEndDate: bounds.priorEndDate,
      label: bounds.label,
    },
    goal: input.goal,
    weight: {
      currentAverageLbs: null,
      priorAverageLbs: null,
      weeklyChangePct: null,
      loggedDaysCurrent: 0,
      loggedDaysPrior: 0,
      band: 'insufficient_data',
    },
    nutrition: {
      loggedDays: 0,
      averageCalories: null,
      proteinTargetMetDays: null,
      proteinTargetEligibleDays: null,
    },
    bodyFat: { pct: null, source: null },
    currentCalories: input.target?.calories ?? null,
    proposedCalories: null,
    adjustmentAmount: null,
    direction: 'hold',
    evidenceStrength: null,
    guardrails: [],
    blockingReasons: [],
    explanation: '',
    decisionType: ADJUSTMENT_DECISION_TYPE,
    before: null,
    after: null,
    suggestedReviewOn: null,
  }
}

/**
 * Pure, deterministic evaluation over already-fetched rows. Never
 * mutates inputs. Evaluation order (first block wins) is part of the
 * contract and covered by the harness:
 *   data_unavailable → missing_target → unsupported_goal →
 *   recent_target_change → pending/awaiting decisions →
 *   insufficient weight data → nutrition coverage →
 *   band classification → guardrails → proposal.
 */
export function evaluateGoalAdjustment(input: GoalAdjustmentInput): GoalAdjustmentReview {
  const weekStart = latestCompletedWeekStart(input.todayStr)
  const bounds = reviewWeekBounds(weekStart)
  const review = emptyReview(input, bounds)

  // 1. A failed query is never treated as valid zero data.
  if (!input.availability.weight || !input.availability.nutrition || !input.availability.decisions) {
    review.eligibility = 'data_unavailable'
    review.blockingReasons.push('Some data could not be loaded — try again.')
    review.explanation = 'The adjustment review is unavailable right now.'
    return review
  }

  // 2. Authoritative target must exist and be valid.
  const target = input.target
  if (
    !target ||
    !Number.isFinite(target.calories) || target.calories <= 0 ||
    !Number.isFinite(target.protein_g) || target.protein_g < 0 ||
    !Number.isFinite(target.fat_g) || target.fat_g < 0
  ) {
    review.eligibility = 'missing_target'
    review.currentCalories = null
    review.blockingReasons.push('No valid active nutrition target.')
    review.explanation = 'Set nutrition targets before reviewing adjustments.'
    return review
  }

  // Descriptive evidence is computed for every remaining state.
  const weeklyWeight = computeWeeklyWeight(input.weighInRows, bounds)
  const weeklyNutrition = computeWeeklyNutrition(
    input.foodLogRows, bounds, target.protein_g
  )
  const priorWeekWeight = weeklyWeight.priorAverageWeightLbs
  const bodyFat = resolveBodyFatContext(
    input.weighInRows, input.profileBfPct, bounds.endDate
  )
  // Distinct prior-week dates (computeWeeklyWeight reports current-week
  // days; the prior count comes from the same dedup rule).
  const priorDays = (() => {
    const seen = new Set<string>()
    for (const r of input.weighInRows) {
      if (r.weight_kg === null || !Number.isFinite(r.weight_kg) || r.weight_kg <= 0) continue
      if (r.logged_date >= bounds.priorStartDate && r.logged_date <= bounds.priorEndDate) {
        seen.add(r.logged_date)
      }
    }
    return seen.size
  })()

  review.weight = {
    currentAverageLbs: weeklyWeight.averageWeightLbs,
    priorAverageLbs: priorWeekWeight,
    weeklyChangePct: null,
    loggedDaysCurrent: weeklyWeight.loggedDays,
    loggedDaysPrior: priorDays,
    band: 'insufficient_data',
  }
  review.nutrition = {
    loggedDays: weeklyNutrition.loggedDays,
    averageCalories: weeklyNutrition.averageCalories,
    proteinTargetMetDays: weeklyNutrition.proteinTargetMetDays,
    proteinTargetEligibleDays: weeklyNutrition.proteinTargetEligibleDays,
  }
  review.bodyFat = bodyFat

  // 3. Goal support.
  if (!input.goal || !SUPPORTED_GOALS.includes(input.goal as never)) {
    review.eligibility = 'unsupported_goal'
    review.blockingReasons.push('This goal has no supported weekly rate range.')
    review.explanation =
      'Holding current targets — automatic rate ranges are not defined for this goal.'
    return review
  }

  // 4. Two completed weeks required after any target change.
  if (target.effective_date >= bounds.priorStartDate) {
    review.eligibility = 'recent_target_change'
    review.blockingReasons.push(
      'Targets changed recently — allow two completed weeks before the next review.'
    )
    review.explanation = 'Wait longer after the recent target change.'
    return review
  }

  // 5. Unresolved matching decisions.
  const blocking = findBlockingDecision(input.recentDecisions, bounds.priorStartDate)
  if (blocking) {
    review.eligibility =
      blocking.kind === 'pending' ? 'pending_existing_decision' : 'awaiting_review'
    review.blockingReasons.push(
      blocking.kind === 'pending'
        ? 'An existing adjustment decision is still open.'
        : 'A recent target change is awaiting its outcome review.'
    )
    review.explanation =
      blocking.kind === 'pending'
        ? 'Resolve the open adjustment decision before reviewing another change.'
        : 'Review the outcome of the recent change before considering another.'
    return review
  }

  // 6. Weight evidence: both completed weeks need the shared minimum.
  if (
    weeklyWeight.averageWeightLbs === null ||
    priorWeekWeight === null ||
    weeklyWeight.loggedDays < MIN_WEIGH_IN_DAYS ||
    priorDays < MIN_WEIGH_IN_DAYS
  ) {
    review.eligibility = 'insufficient_weight_data'
    review.blockingReasons.push(
      `At least ${MIN_WEIGH_IN_DAYS} weigh-in days are needed in each of the last two completed weeks.`
    )
    review.explanation = 'Insufficient weight data to evaluate the weekly trend.'
    return review
  }

  // 7. Nutrition coverage.
  if (weeklyNutrition.loggedDays < 2) {
    review.eligibility = 'insufficient_nutrition_data'
    review.blockingReasons.push('Almost no nutrition was logged in the review week.')
    review.explanation = 'Insufficient nutrition data to support a target change.'
    return review
  }
  if (weeklyNutrition.loggedDays < MIN_NUTRITION_DAYS) {
    review.eligibility = 'improve_logging'
    review.blockingReasons.push(
      `Nutrition was logged on ${weeklyNutrition.loggedDays} of 7 days — at least ${MIN_NUTRITION_DAYS} are needed.`
    )
    review.explanation =
      'Improve logging consistency before adjusting targets.'
    return review
  }

  // 8. Weekly change, % of body weight (+ = gain). Display rounding
  // to two decimals; prior average is validated non-null above.
  const changePct =
    Math.round(((weeklyWeight.averageWeightLbs - priorWeekWeight) / priorWeekWeight) * 100 * 100) / 100
  review.weight.weeklyChangePct = changePct

  // 9. Band classification + direction per goal.
  let band: WeightTrendBand
  let direction: AdjustmentDirection = 'hold'
  let deviationPp = 0

  if (input.goal === 'fat_loss') {
    const rate = fatLossBand(bodyFat.pct)
    const lossPct = -changePct
    if (lossPct < rate.minPct) {
      band = 'slower_than_expected'
      direction = 'decrease'
      deviationPp = rate.minPct - lossPct
    } else if (lossPct > rate.maxPct) {
      band = 'faster_than_expected'
      direction = 'increase'
      deviationPp = lossPct - rate.maxPct
    } else {
      band = 'within_expected_range'
    }
  } else if (input.goal === 'maintenance') {
    if (Math.abs(changePct) <= MAINTENANCE_STABLE_PP) {
      band = 'within_expected_range'
    } else if (changePct > 0) {
      band = 'faster_than_expected' // drifting up
      direction = 'decrease'
      deviationPp = changePct - MAINTENANCE_STABLE_PP
    } else {
      band = 'slower_than_expected' // drifting down
      direction = 'increase'
      deviationPp = -changePct - MAINTENANCE_STABLE_PP
    }
    // Maintenance reacts only to strong one-direction evidence —
    // small weekly noise holds targets.
    if (
      direction !== 'hold' &&
      (deviationPp < STRONG_EVIDENCE_DEVIATION_PP ||
        weeklyNutrition.loggedDays < STRONG_EVIDENCE_NUTRITION_DAYS)
    ) {
      direction = 'hold'
    }
  } else {
    // muscle_gain / strength — conservative gain band.
    if (changePct < GAIN_BAND.minPct) {
      band = 'slower_than_expected'
      direction = 'increase'
      deviationPp = GAIN_BAND.minPct - changePct
    } else if (changePct > GAIN_BAND.maxPct) {
      band = 'faster_than_expected'
      direction = 'decrease'
      deviationPp = changePct - GAIN_BAND.maxPct
    } else {
      band = 'within_expected_range'
    }
  }
  review.weight.band = band

  const bandText =
    band === 'slower_than_expected'
      ? 'Weight change was slower than the selected goal range.'
      : band === 'faster_than_expected'
      ? 'Weight change was faster than the selected goal range.'
      : 'Weight change was within the selected goal range.'

  if (direction === 'hold') {
    review.eligibility = 'hold'
    review.direction = 'hold'
    review.explanation = `${bandText} Keeping current targets.`
    return review
  }

  // 10. Step size: smallest justified change; 200 only with strong
  // evidence. Values are always round.
  const strong =
    deviationPp >= STRONG_EVIDENCE_DEVIATION_PP &&
    weeklyNutrition.loggedDays >= STRONG_EVIDENCE_NUTRITION_DAYS
  const step = strong ? CALORIE_STEP_LARGE : CALORIE_STEP_SMALL
  const signedAmount = direction === 'decrease' ? -step : step
  const proposed = Math.round(target.calories + signedAmount)

  // 11. Guardrails — a proposal that cannot stay safe is withheld.
  const guardrails: string[] = [
    'Protein target unchanged.',
    'Fat target unchanged.',
  ]
  if (direction === 'decrease') {
    if (proposed < MIN_CALORIES_FLOOR) {
      review.eligibility = 'hold'
      review.direction = 'hold'
      review.blockingReasons.push(
        `A decrease would go below the ${MIN_CALORIES_FLOOR.toLocaleString()}-calorie floor.`
      )
      review.explanation = `${bandText} Current targets are already at the supported minimum.`
      review.guardrails = guardrails
      return review
    }
    const impliedCarbCalories = proposed - (target.protein_g * 4 + target.fat_g * 9)
    if (impliedCarbCalories < MIN_CARBS_GUARDRAIL * 4) {
      review.eligibility = 'hold'
      review.direction = 'hold'
      review.blockingReasons.push(
        `A decrease would leave carbohydrates below the ${MIN_CARBS_GUARDRAIL}g minimum — review macro allocation manually.`
      )
      review.explanation = `${bandText} A smaller calorie budget cannot keep macros within the supported minimums.`
      review.guardrails = guardrails
      return review
    }
    guardrails.push(`Carbohydrates stay at or above the ${MIN_CARBS_GUARDRAIL}g minimum.`)
  }

  // 12. Eligible proposal.
  review.eligibility = 'eligible'
  review.direction = direction
  review.evidenceStrength = strong ? 'strong' : 'standard'
  review.proposedCalories = proposed
  review.adjustmentAmount = signedAmount
  review.before = { calories: target.calories }
  review.after = { calories: proposed }
  review.guardrails = guardrails
  review.suggestedReviewOn = format(
    addDays(parseISO(input.todayStr), ADJUSTMENT_REVIEW_AFTER_DAYS),
    'yyyy-MM-dd'
  )
  review.explanation =
    `${bandText} A small calorie ${direction} may be reasonable — review before applying.`
  return review
}

// ── Apply validation (server-side, pure) ─────────────────────────────

export interface AdjustmentApplyRequest {
  expectedCurrentCalories: number
  proposedCalories: number
  expectedGoal: string
}

export type AdjustmentApplyValidation =
  | { ok: true }
  | { ok: false; error: string; stale: boolean }

const STALE_MESSAGE =
  'The review is out of date — refresh the adjustment review and try again.'

/**
 * Server-side gate for the explicit apply action. The server
 * RECOMPUTES the review from fresh data and only then compares the
 * client's expectations — a client-submitted "eligible" flag is never
 * trusted, stale targets/goals are rejected, and the size limits hold
 * even if the client is compromised.
 */
export function validateAdjustmentApply(
  freshReview: GoalAdjustmentReview,
  request: AdjustmentApplyRequest
): AdjustmentApplyValidation {
  if (
    !Number.isFinite(request.expectedCurrentCalories) ||
    !Number.isFinite(request.proposedCalories) ||
    typeof request.expectedGoal !== 'string'
  ) {
    return { ok: false, error: 'Invalid adjustment request.', stale: false }
  }
  const amount = request.proposedCalories - request.expectedCurrentCalories
  if (
    Math.abs(amount) !== CALORIE_STEP_SMALL &&
    Math.abs(amount) !== CALORIE_STEP_LARGE
  ) {
    return { ok: false, error: 'Adjustments are limited to 100 or 200 calories.', stale: false }
  }
  if (freshReview.eligibility !== 'eligible') {
    return { ok: false, error: STALE_MESSAGE, stale: true }
  }
  if (freshReview.goal !== request.expectedGoal) {
    return { ok: false, error: STALE_MESSAGE, stale: true }
  }
  if (freshReview.currentCalories !== request.expectedCurrentCalories) {
    return { ok: false, error: STALE_MESSAGE, stale: true }
  }
  if (freshReview.proposedCalories !== request.proposedCalories) {
    return { ok: false, error: STALE_MESSAGE, stale: true }
  }
  return { ok: true }
}

// ── Server fetch (bounded, availability-aware) ───────────────────────

/**
 * Three bounded queries, no all-time scans:
 *   1. body_metrics over [reviewEnd - 55d, reviewEnd] — the 14-day
 *      weight windows plus the 56-day body-fat recency window in one
 *      read (weight/bf are filtered per-purpose by the evaluator)
 *   2. food_logs over the two completed weeks
 *   3. the 10 most recent target-related decisions (adjustments and
 *      manual changes) for blocking/cooldown checks
 * Each failure flips its availability flag (Phase 3C convention) —
 * failed data suppresses the review rather than posing as zero.
 */
export async function fetchGoalAdjustmentReview(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  todayStr: string,
  goal: string | null,
  profileBfPct: number | null,
  target: AdjustmentTargetLike | null
): Promise<GoalAdjustmentReview> {
  const weekStart = latestCompletedWeekStart(todayStr)
  const bounds = reviewWeekBounds(weekStart)
  const metricsStart = format(
    subDays(parseISO(bounds.endDate), BODY_FAT_RECENCY_DAYS - 1),
    'yyyy-MM-dd'
  )

  const [metricsRes, foodRes, decisionsRes] = await Promise.all([
    supabase
      .from('body_metrics')
      .select('logged_date, weight_kg, bf_pct, created_at')
      .eq('user_id', userId)
      .gte('logged_date', metricsStart)
      .lte('logged_date', bounds.endDate),
    supabase
      .from('food_logs')
      .select('logged_date, calories, protein_g, carbs_g, fat_g')
      .eq('user_id', userId)
      .gte('logged_date', bounds.priorStartDate)
      .lte('logged_date', bounds.endDate),
    supabase
      .from('decision_logs')
      .select('decision_type, status, follow_through_status, reviewed_at, created_at')
      .eq('user_id', userId)
      .in('decision_type', [ADJUSTMENT_DECISION_TYPE, MANUAL_TARGET_DECISION_TYPE])
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  if (metricsRes.error) console.error('fetchGoalAdjustmentReview (body_metrics) error:', metricsRes.error)
  if (foodRes.error) console.error('fetchGoalAdjustmentReview (food_logs) error:', foodRes.error)
  if (decisionsRes.error) console.error('fetchGoalAdjustmentReview (decision_logs) error:', decisionsRes.error)

  return evaluateGoalAdjustment({
    todayStr,
    goal,
    target,
    weighInRows: metricsRes.data ?? [],
    foodLogRows: foodRes.data ?? [],
    profileBfPct,
    recentDecisions: decisionsRes.data ?? [],
    availability: {
      weight: !metricsRes.error,
      nutrition: !foodRes.error,
      decisions: !decisionsRes.error,
    },
  })
}
