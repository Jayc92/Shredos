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
  computeWeeklyExerciseProgress,
  PROGRESSION_LOOKBACK_DAYS,
} from '@/lib/weekly-review'
import type { ReviewWeekBounds } from '@/lib/weekly-review'
import type { RawWeighInLike } from '@/lib/weight-trends'
import type { RawFoodLogLike } from '@/lib/nutrition-trends'
import { CALORIE_ON_TRACK_RANGE, MIN_RELIABLE_LOGGED_DAYS } from '@/lib/coach-constants'
import { MIN_CALORIES_FLOOR } from '@/lib/nutrition-coach'
import { MIN_CARBS_GUARDRAIL } from '@/lib/constants'
import { followThroughOf } from '@/lib/decisions'
// Phase 5B.4: the review consumes the STABLE 5B energy layers instead
// of recreating evidence math — weekly anchors + regression trend
// (Friday-cadence compatible), explicit/heuristic nutrition
// completeness, adaptive-maintenance evidence, user-relative activity
// context — one coherent source of truth.
import {
  deriveWeeklyWeightAnchors,
  computeWeightTrend,
  buildDailyNutritionFactsWithContext,
  buildActivityBaseline,
  classifyActivityContext,
} from '@/lib/energy-facts'
import type {
  ActivityContext,
  DailyNutritionFact,
  WeightTrendConfidence,
} from '@/lib/energy-facts'
import { deriveProteinState } from '@/lib/coach-signals'
import {
  estimateBaselineTdee,
  buildQualifyingWeeks,
  inferAdaptiveMaintenance,
} from '@/lib/energy-model'
import type { AdaptiveMaintenanceEstimate } from '@/lib/energy-model'

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

// Phase 5B.4 weigh-in evidence correction: the legacy rule required
// MIN_WEIGH_IN_DAYS (2) weigh-in dates inside EACH completed week,
// which made a deliberate once-weekly Friday cadence permanently
// ineligible. The gate is now LONGITUDINAL: at least this many weekly
// anchors (a single reading is a valid lower-confidence anchor; two
// or more average into a stronger one), with real week spacing and
// no fabricated anchors for missing weeks. Weigh-in frequency inside
// a week only affects anchor quality/confidence — never eligibility.
export const MIN_WEEKLY_ANCHORS_FOR_ADJUSTMENT = 3
/** Anchor window the review considers (matches the 5B.1 default). */
export const ADJUSTMENT_ANCHOR_WINDOW_WEEKS = 8
/** Nutrition days required in the review week (existing coach rule). */
export const MIN_NUTRITION_DAYS = MIN_RELIABLE_LOGGED_DAYS
// Phase 5B.4 nutrition-evidence floor (audit correction): a PERSISTENT
// calorie-target change requires enough completed days to distinguish
// real intake/adherence from sparse logging. Below this floor the
// review returns guidance-only states — never a proposed target — in
// EITHER direction. Five days need not be consecutive (the evidence
// model has no consecutiveness requirement), and this never asks for
// indefinite daily tracking: it applies to the single review week.
export const MIN_COMPLETE_DAYS_FOR_PROPOSAL = 5

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
  // Phase 5B.4: cause-differentiated states. adherence_first — the
  // trend is out of band but intake hasn't consistently followed the
  // CURRENT target, so changing the target number wouldn't reflect
  // behavior; the smallest intervention is adherence guidance.
  // activity_first — a decrease is otherwise supported but activity
  // sits below the user's own baseline; restoring it is the smaller
  // lever than eating less.
  | 'adherence_first'
  | 'activity_first'
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
  // ── Phase 5B.4 evidence (optional with honest defaults so callers
  // and fixtures without the new sources still evaluate — absence
  // means UNKNOWN, never zero/low/negative) ──────────────────────────
  /** Dates the user explicitly marked complete (nutrition_day_status). */
  explicitCompleteDates?: ReadonlySet<string>
  /** Review-week activity vs the user's own baseline; absent = unknown. */
  activityContext?: ActivityContext
  /** Strength progression context from the existing 2X classifier;
   *  absent/ambiguous = unknown, never negative. */
  trainingSignal?: 'improving' | 'stable' | 'declining' | 'unknown'
  /** Stable 5B.2 adaptive-maintenance evidence; informs, never sets. */
  adaptive?: AdaptiveMaintenanceEstimate | null
  /** Behavioral context ONLY — never energy math. */
  fastingContext?: { completedFastsInWindow: number } | null
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
    /** Latest weekly anchor (lbs). */
    currentAverageLbs: number | null
    /** Previous weekly anchor (lbs). */
    priorAverageLbs: number | null
    /** Regression rate, signed % of body weight per week (+ = gain). */
    weeklyChangePct: number | null
    /** Readings inside the latest / previous anchored weeks. */
    loggedDaysCurrent: number
    loggedDaysPrior: number
    band: WeightTrendBand
    /** Phase 5B.4: longitudinal anchor evidence. */
    anchorCount: number
    weeklyRateLb: number | null
    trendConfidence: WeightTrendConfidence
  }
  nutrition: {
    /** Complete days in the review week (explicit + heuristic). */
    loggedDays: number
    averageCalories: number | null
    proteinTargetMetDays: number | null
    proteinTargetEligibleDays: number | null
    /** Phase 5B.4: completeness evidence split. Explicit user-marked
     *  days are preferred evidence; heuristic likely-complete days
     *  are fallback only. */
    explicitCompleteDays: number
    heuristicCompleteDays: number
    adherence: 'on_target' | 'above_target' | 'below_target' | 'insufficient'
    proteinState: 'protein_on_target' | 'protein_close' | 'protein_low' | 'insufficient_nutrition_data'
  }
  bodyFat: { pct: number | null; source: 'recent_metric' | 'profile' | null }
  /** Phase 5B.4 context evidence (unknown when sources are absent). */
  activityContext: ActivityContext
  trainingSignal: 'improving' | 'stable' | 'declining' | 'unknown'
  /** Adaptive-maintenance evidence: status always; the range ONLY at
   *  high confidence (the stable 5B.2/5B.3 exposure rule). Informs
   *  explanations — never sets the target. */
  adaptiveEvidence: {
    status: AdaptiveMaintenanceEstimate['status'] | 'unavailable'
    maintenanceRange: [number, number] | null
  }
  fastingContext: { completedFastsInWindow: number } | null
  currentCalories: number | null
  proposedCalories: number | null
  /** Signed calories (negative = decrease); always ±100 or ±200. */
  adjustmentAmount: number | null
  direction: AdjustmentDirection
  evidenceStrength: 'standard' | 'strong' | null
  guardrails: string[]
  blockingReasons: string[]
  /** Phase 5B.4: restrained non-calorie guidance (adherence, protein,
   *  activity, training) — plain language, never prescriptions of
   *  invented numbers. */
  guidance: string[]
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
      anchorCount: 0,
      weeklyRateLb: null,
      trendConfidence: 'insufficient',
    },
    nutrition: {
      loggedDays: 0,
      averageCalories: null,
      proteinTargetMetDays: null,
      proteinTargetEligibleDays: null,
      explicitCompleteDays: 0,
      heuristicCompleteDays: 0,
      adherence: 'insufficient',
      proteinState: 'insufficient_nutrition_data',
    },
    bodyFat: { pct: null, source: null },
    activityContext: input.activityContext ?? 'unknown',
    trainingSignal: input.trainingSignal ?? 'unknown',
    adaptiveEvidence: {
      status: input.adaptive?.status ?? 'unavailable',
      maintenanceRange:
        input.adaptive?.status === 'high_confidence'
          ? input.adaptive.estimatedMaintenanceRange
          : null,
    },
    fastingContext: input.fastingContext ?? null,
    currentCalories: input.target?.calories ?? null,
    proposedCalories: null,
    adjustmentAmount: null,
    direction: 'hold',
    evidenceStrength: null,
    guardrails: [],
    blockingReasons: [],
    guidance: [],
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

  // ── Descriptive evidence (Phase 5B.4: from the STABLE 5B layers,
  // never re-derived) ─────────────────────────────────────────────────

  // Weekly anchors over the completed-week window: one reading is a
  // valid lower-confidence anchor, multi-reading weeks average into a
  // stronger one, missing weeks are honest gaps (real week spacing,
  // never fabricated anchors, never "missing = zero change").
  const anchors = deriveWeeklyWeightAnchors(
    input.weighInRows, bounds.endDate, ADJUSTMENT_ANCHOR_WINDOW_WEEKS
  )
  const trend = computeWeightTrend(anchors)
  const lastAnchor = anchors[anchors.length - 1] ?? null
  const prevAnchor = anchors[anchors.length - 2] ?? null

  // Nutrition facts over the review week with EXPLICIT completion
  // evidence preferred (nutrition_day_status) and the 5B.1 heuristic
  // as fallback only. The active target is valid for the whole review
  // week (eligibility already requires it to predate the prior week).
  const explicitDates = input.explicitCompleteDates ?? new Set<string>()
  const facts: DailyNutritionFact[] = buildDailyNutritionFactsWithContext(
    input.foodLogRows, bounds.startDate, bounds.endDate,
    {
      targetHistory: [{ effective_date: target.effective_date, calories: target.calories }],
      explicitCompleteDates: explicitDates,
    }
  )
  const explicitCompleteDays = facts.filter(
    (f) => f.completeness === 'explicit_complete'
  ).length
  const heuristicCompleteDays = facts.filter(
    (f) => f.completeness === 'likely_complete'
  ).length
  const completeDays = explicitCompleteDays + heuristicCompleteDays
  const completeFactCalories = facts
    .filter((f) =>
      (f.completeness === 'explicit_complete' || f.completeness === 'likely_complete') &&
      f.calories !== null)
    .map((f) => f.calories as number)
  const averageCalories = completeFactCalories.length > 0
    ? Math.round(completeFactCalories.reduce((s, c) => s + c, 0) / completeFactCalories.length)
    : null

  // Calorie adherence on complete days only — incomplete logs are
  // never treated as confirmed low intake.
  let adherence: GoalAdjustmentReview['nutrition']['adherence'] = 'insufficient'
  if (averageCalories !== null && completeDays >= MIN_NUTRITION_DAYS) {
    const deviation = Math.abs(averageCalories - target.calories) / target.calories
    adherence = deviation <= CALORIE_ON_TRACK_RANGE
      ? 'on_target'
      : averageCalories > target.calories ? 'above_target' : 'below_target'
  }

  // Protein evidence, separate from calories (never collapsed).
  const proteinState = deriveProteinState(facts, target.protein_g)

  // Protein-target adherence days (kept from 3E for display/audit).
  const proteinEligible = facts.filter((f) =>
    (f.completeness === 'explicit_complete' || f.completeness === 'likely_complete') &&
    f.proteinG !== null)
  const proteinTargetEligibleDays =
    target.protein_g > 0 && proteinEligible.length > 0 ? proteinEligible.length : null
  const proteinTargetMetDays =
    proteinTargetEligibleDays !== null
      ? proteinEligible.filter((f) => (f.proteinG as number) >= target.protein_g).length
      : null

  const bodyFat = resolveBodyFatContext(
    input.weighInRows, input.profileBfPct, bounds.endDate
  )

  review.weight = {
    currentAverageLbs: lastAnchor?.anchorLbs ?? null,
    priorAverageLbs: prevAnchor?.anchorLbs ?? null,
    weeklyChangePct: trend.weeklyRatePercent,
    loggedDaysCurrent: lastAnchor?.contributingDates ?? 0,
    loggedDaysPrior: prevAnchor?.contributingDates ?? 0,
    band: 'insufficient_data',
    anchorCount: trend.anchorCount,
    weeklyRateLb: trend.weeklyRateLb,
    trendConfidence: trend.trendConfidence,
  }
  review.nutrition = {
    loggedDays: completeDays,
    averageCalories,
    proteinTargetMetDays,
    proteinTargetEligibleDays,
    explicitCompleteDays,
    heuristicCompleteDays,
    adherence,
    proteinState,
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

  // 6. Weight evidence — Phase 5B.4 LONGITUDINAL gate. The legacy
  // rule (2 weigh-in days inside EACH completed week) is gone from
  // this — the only — live decision path: enough weekly anchors
  // across weeks is what a responsible decision needs, and a
  // once-weekly Friday cadence satisfies it deliberately. Weigh-in
  // frequency inside a week affects only anchor quality; daily
  // weighing is never incentivized.
  if (
    trend.anchorCount < MIN_WEEKLY_ANCHORS_FOR_ADJUSTMENT ||
    trend.weeklyRatePercent === null
  ) {
    review.eligibility = 'insufficient_weight_data'
    review.blockingReasons.push(
      `At least ${MIN_WEEKLY_ANCHORS_FOR_ADJUSTMENT} weekly weigh-in anchors are needed — one weigh-in per week is enough.`
    )
    review.explanation = 'Not enough weekly weigh-ins yet to evaluate the trend responsibly.'
    return review
  }

  // 7. Nutrition coverage — complete days (explicit preferred,
  // heuristic fallback). Partial/missing days never count, so an
  // incomplete week can never masquerade as confirmed low intake.
  if (completeDays < 2) {
    review.eligibility = 'insufficient_nutrition_data'
    review.blockingReasons.push('Almost no complete nutrition days in the review week.')
    review.explanation = 'Insufficient nutrition data to support a target change.'
    return review
  }
  if (completeDays < MIN_COMPLETE_DAYS_FOR_PROPOSAL) {
    review.eligibility = 'improve_logging'
    review.blockingReasons.push(
      `Only ${completeDays} of 7 days had complete nutrition — at least ${MIN_COMPLETE_DAYS_FOR_PROPOSAL} completed days are needed before any target change.`
    )
    review.guidance = [
      'Log your food and mark days as finished — more completed food-log days are needed before a calorie change can be considered.',
    ]
    review.explanation =
      'Holding current targets: not enough completed food-log days to tell real intake from sparse logging. This is a logging-evidence gap, not a judgment about how much you ate.'
    return review
  }

  // 8. Weekly change: the regression rate across anchors (% of body
  // weight per week, + = gain) — one noisy week is absorbed by the
  // fit instead of dominating a two-point comparison.
  const changePct = trend.weeklyRatePercent
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
        completeDays < STRONG_EVIDENCE_NUTRITION_DAYS)
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

  // ── Phase 5B.4 guidance evidence (accumulates on every outcome) ──
  const guidance: string[] = []
  if (proteinState === 'protein_low') {
    guidance.push(
      'Protein has been consistently below target — prioritize protein at each meal. This is separate from total calories.'
    )
  }
  if (review.activityContext === 'low') {
    guidance.push(
      'Activity has been below your own recent baseline — restoring your usual movement is often the smallest useful change.'
    )
  }
  if (review.trainingSignal === 'declining') {
    guidance.push(
      'Recent strength comparisons have been declining — recovery and fueling matter before any deeper deficit.'
    )
  }
  review.guidance = guidance

  if (direction === 'hold') {
    review.eligibility = 'hold'
    review.direction = 'hold'
    review.explanation = `${bandText} Keeping current targets.`
    return review
  }

  // 9b. ADHERENCE FIRST (Phase 5B.4): a target change is only
  // meaningful when intake has actually followed the current target.
  // Off-target intake on complete days -> adherence guidance instead
  // of moving the number; incomplete evidence never reaches here
  // (coverage gates above).
  if (adherence !== 'on_target') {
    review.eligibility = 'adherence_first'
    review.direction = 'hold'
    review.blockingReasons.push(
      adherence === 'above_target'
        ? 'Intake averaged above the current target on complete days.'
        : adherence === 'below_target'
        ? 'Intake averaged below the current target on complete days.'
        : 'Not enough complete days to judge adherence.'
    )
    review.guidance = [
      adherence === 'above_target'
        ? 'Aim to land within about 10% of your current calorie target on most days first — the trend will be re-read once intake matches the plan.'
        : 'Intake has been running under your current target. If that is deliberate, log it consistently; if days are going unlogged, mark completed days so the evidence is trustworthy.',
      ...guidance,
    ]
    review.explanation =
      `${bandText} Holding the target: recent intake hasn't consistently matched the current plan, so changing the number wouldn't change the outcome. The plan is re-evaluated as soon as adherence evidence settles.`
    return review
  }

  // 9c. ACTIVITY FIRST (Phase 5B.4): before eating less, restore the
  // user's OWN baseline movement — the smaller intervention when
  // activity is genuinely low (unknown activity never triggers this;
  // missing data is not low data). Applies to decreases only.
  if (direction === 'decrease' && review.activityContext === 'low') {
    review.eligibility = 'activity_first'
    review.direction = 'hold'
    review.blockingReasons.push(
      'Activity has been below your own recent baseline.'
    )
    review.explanation =
      `${bandText} Holding calories for now: activity has been below your usual baseline, and restoring it is a smaller change than eating less. If the trend still lags after activity returns to normal, a calorie change will be proposed then.`
    return review
  }

  // 10. Step size: smallest justified change; 200 only with strong
  // evidence — which now ALSO requires a trend the anchor model
  // trusts (moderate+) and explicit-quality nutrition days, and is
  // softened back to 100 when protein is low or strength is
  // declining (never an aggressive cut on lean-mass-risk evidence).
  // Phase 5B.4 audit correction: the 5-day floor above means every
  // proposal already has >= 5 complete days, so the LARGER step now
  // demands the PREFERRED evidence quality — five explicitly
  // completed days. Heuristic-only weeks cap at the 100 step
  // (strengthened, never weakened).
  const strongCoverage = explicitCompleteDays >= STRONG_EVIDENCE_NUTRITION_DAYS
  const strong =
    deviationPp >= STRONG_EVIDENCE_DEVIATION_PP &&
    strongCoverage &&
    (trend.trendConfidence === 'moderate' || trend.trendConfidence === 'high')
  const softeners: string[] = []
  if (direction === 'decrease' && proteinState === 'protein_low') {
    softeners.push('protein has been low')
  }
  if (direction === 'decrease' && review.trainingSignal === 'declining') {
    softeners.push('strength comparisons have been declining')
  }
  const step = strong && softeners.length === 0 ? CALORIE_STEP_LARGE : CALORIE_STEP_SMALL
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

  // 12. Eligible proposal. The explanation states what was observed,
  // the supporting evidence, why this is the smallest appropriate
  // step, and when the plan is reassessed — plain language, no
  // internal jargon, no false precision. Adaptive maintenance may
  // INFORM the explanation (a range, only at high confidence, per the
  // stable 5B exposure rule) but never sets the number.
  review.eligibility = 'eligible'
  review.direction = direction
  review.evidenceStrength = strong && softeners.length === 0 ? 'strong' : 'standard'
  review.proposedCalories = proposed
  review.adjustmentAmount = signedAmount
  review.before = { calories: target.calories }
  review.after = { calories: proposed }
  review.guardrails = guardrails
  review.suggestedReviewOn = format(
    addDays(parseISO(input.todayStr), ADJUSTMENT_REVIEW_AFTER_DAYS),
    'yyyy-MM-dd'
  )
  const evidenceText =
    ` Evidence: ${trend.anchorCount} weekly weigh-in anchors and ` +
    `${completeDays} complete nutrition days, with intake on target.`
  const softenedText = softeners.length > 0
    ? ` The step is kept at ${CALORIE_STEP_SMALL} because ${softeners.join(' and ')}.`
    : ''
  const adaptiveText =
    review.adaptiveEvidence.status === 'high_confidence' &&
    review.adaptiveEvidence.maintenanceRange !== null
      ? ` Your observed maintenance is trending around ${review.adaptiveEvidence.maintenanceRange[0].toLocaleString()}–${review.adaptiveEvidence.maintenanceRange[1].toLocaleString()} kcal/day, which is consistent with this change.`
      : ''
  review.explanation =
    `${bandText} A ${step}-calorie ${direction} is the smallest change the evidence supports — review before applying.` +
    evidenceText + softenedText + adaptiveText +
    ` The plan is reassessed after about two weeks of new evidence.`
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

/** Optional profile context for the 5B.4 evidence layers. Absent
 *  fields degrade to UNKNOWN evidence, never to zero/low. */
export interface AdjustmentProfileContext {
  activityLevel: string | null
  fastingEnabled: boolean
  sex?: string | null
  age?: number | null
  heightCm?: number | null
  currentWeightKg?: number | null
}

/**
 * Bounded queries only, no all-time scans (Phase 5B.4 inventory):
 *   1. body_metrics over [reviewEnd - 55d, reviewEnd] — covers the
 *      8-week anchor window AND the 56-day body-fat recency window
 *   2. food_logs over the 4-ISO-week adaptive window (superset of
 *      the review week)
 *   3. the 10 most recent target-related decisions (blocking/cooldown)
 *   4. nutrition_day_status over the adaptive window (explicit
 *      completion evidence, Phase 5B.2)
 *   5. nutrition_targets history (12 versions) for historical
 *      per-date target resolution inside the adaptive facts
 *   6. daily_activity_logs over 28 days (user-relative baseline +
 *      review-week context)
 *   7. completed workout durations + activity-session durations over
 *      28 days (baseline sessions — DURATIONS only, calories never
 *      queried here)
 *   8. the 2X training query over the progression lookback (strength
 *      context)
 *   9. completed fasts in the review window (behavioral context
 *      only), fasting-enabled profiles only
 * Each core failure flips its availability flag (Phase 3C
 * convention); context failures degrade to unknown evidence.
 */
export async function fetchGoalAdjustmentReview(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  todayStr: string,
  goal: string | null,
  profileBfPct: number | null,
  target: AdjustmentTargetLike | null,
  profileContext?: AdjustmentProfileContext
): Promise<GoalAdjustmentReview> {
  const weekStart = latestCompletedWeekStart(todayStr)
  const bounds = reviewWeekBounds(weekStart)
  const metricsStart = format(
    subDays(parseISO(bounds.endDate), BODY_FAT_RECENCY_DAYS - 1),
    'yyyy-MM-dd'
  )
  // 4 ISO weeks ending at the review week (the 5B.2 adaptive window).
  const adaptiveStart = format(subDays(parseISO(bounds.startDate), 21), 'yyyy-MM-dd')
  const activityStart = format(subDays(parseISO(bounds.endDate), 27), 'yyyy-MM-dd')
  const lookbackStart = format(
    subDays(parseISO(bounds.startDate), PROGRESSION_LOOKBACK_DAYS), 'yyyy-MM-dd')

  const [metricsRes, foodRes, decisionsRes, statusRes, targetsRes,
    stepsRes, workoutDurRes, sessionDurRes, trainingRes, fastingRes] =
    await Promise.all([
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
        .gte('logged_date', adaptiveStart)
        .lte('logged_date', bounds.endDate),
      supabase
        .from('decision_logs')
        .select('decision_type, status, follow_through_status, reviewed_at, created_at')
        .eq('user_id', userId)
        .in('decision_type', [ADJUSTMENT_DECISION_TYPE, MANUAL_TARGET_DECISION_TYPE])
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('nutrition_day_status')
        .select('logged_date')
        .eq('user_id', userId)
        .gte('logged_date', adaptiveStart)
        .lte('logged_date', bounds.endDate),
      supabase
        .from('nutrition_targets')
        .select('effective_date, calories')
        .eq('user_id', userId)
        .lte('effective_date', bounds.endDate)
        .order('effective_date', { ascending: false })
        .limit(12),
      supabase
        .from('daily_activity_logs')
        .select('logged_date, steps')
        .eq('user_id', userId)
        .gte('logged_date', activityStart)
        .lte('logged_date', bounds.endDate),
      supabase
        .from('workout_sessions')
        .select('workout_date, completed_duration_seconds')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('workout_date', activityStart)
        .lte('workout_date', bounds.endDate),
      supabase
        .from('activity_sessions')
        .select('activity_date, duration_seconds')
        .eq('user_id', userId)
        .gte('activity_date', activityStart)
        .lte('activity_date', bounds.endDate),
      supabase
        .from('workout_sessions')
        .select(`
          id, workout_date, status, completed_duration_seconds,
          workout_exercises (
            exercise_id,
            exercise:exercises ( id, name, primary_muscle, equipment, tracking_mode, unilateral ),
            workout_sets ( set_number, reps, weight_kg, rpe, is_warmup, completed, duration_seconds, distance_meters )
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('workout_date', lookbackStart)
        .lte('workout_date', bounds.endDate)
        .order('workout_date', { ascending: false })
        .order('created_at', { ascending: false }),
      profileContext?.fastingEnabled
        ? supabase
            .from('fasting_logs')
            .select('started_at, ended_at')
            .eq('user_id', userId)
            .not('ended_at', 'is', null)
            .gte('ended_at', `${bounds.startDate}T00:00:00`)
            .lte('ended_at', `${bounds.endDate}T23:59:59.999`)
        : Promise.resolve({ data: [], error: null }),
    ])

  if (metricsRes.error) console.error('fetchGoalAdjustmentReview (body_metrics) error:', metricsRes.error)
  if (foodRes.error) console.error('fetchGoalAdjustmentReview (food_logs) error:', foodRes.error)
  if (decisionsRes.error) console.error('fetchGoalAdjustmentReview (decision_logs) error:', decisionsRes.error)
  for (const [name, res] of [
    ['nutrition_day_status', statusRes], ['nutrition_targets', targetsRes],
    ['daily_activity_logs', stepsRes], ['workout_sessions', workoutDurRes],
    ['activity_sessions', sessionDurRes], ['training', trainingRes],
    ['fasting_logs', fastingRes],
  ] as const) {
    if (res.error) console.error(`fetchGoalAdjustmentReview (${name}) error:`, res.error)
  }

  // ── Context evidence assembly (absence -> unknown, never low) ─────
  const explicitCompleteDates = new Set<string>(
    (statusRes.data ?? []).map((r: { logged_date: string }) => r.logged_date))

  // Activity: review-week mean of RECORDED steps vs the user's own
  // 28-day baseline median. NULL steps stay excluded throughout.
  const stepDays = (stepsRes.data ?? []) as Array<{ logged_date: string; steps: number | null }>
  const sessions = [
    ...((workoutDurRes.data ?? []) as Array<{ workout_date: string; completed_duration_seconds: number | null }>)
      .filter((w) => w.completed_duration_seconds !== null && w.completed_duration_seconds > 0)
      .map((w) => ({ date: w.workout_date, durationSeconds: w.completed_duration_seconds as number })),
    ...((sessionDurRes.data ?? []) as Array<{ activity_date: string; duration_seconds: number }>)
      .map((s) => ({ date: s.activity_date, durationSeconds: s.duration_seconds })),
  ]
  const baseline = buildActivityBaseline({ stepDays, sessions }, bounds.endDate)
  const weekRecordedSteps = stepDays
    .filter((d) => d.logged_date >= bounds.startDate && d.logged_date <= bounds.endDate)
    .filter((d) => d.steps !== null && Number.isFinite(d.steps))
    .map((d) => d.steps as number)
  const weekMeanSteps = weekRecordedSteps.length > 0
    ? weekRecordedSteps.reduce((s, v) => s + v, 0) / weekRecordedSteps.length
    : null
  const activityContext = classifyActivityContext(weekMeanSteps, baseline.medianDailySteps)

  // Training: the existing 2X classifier over the review window —
  // sparse/ambiguous stays unknown, never negative.
  const trainingProgress = computeWeeklyExerciseProgress(
    (trainingRes.data ?? []) as never[], bounds)
  const trainingSignal: 'improving' | 'stable' | 'declining' | 'unknown' =
    trainingRes.error ? 'unknown'
    : trainingProgress.declining > 0 && trainingProgress.declining >= trainingProgress.improving
      ? 'declining'
    : trainingProgress.improving > 0 ? 'improving'
    : trainingProgress.steady > 0 ? 'stable'
    : 'unknown'

  // Adaptive maintenance: the stable 5B.2 pipeline over the 4-week
  // window with historical per-date target resolution. Session and
  // step calories NEVER enter this math (intake + weight trend only).
  const targetHistory = (targetsRes.data ?? []) as Array<{ effective_date: string; calories: number }>
  const adaptiveFacts = buildDailyNutritionFactsWithContext(
    foodRes.data ?? [], adaptiveStart, bounds.endDate,
    {
      targetHistory: targetHistory.length > 0
        ? targetHistory
        : target ? [{ effective_date: target.effective_date, calories: target.calories }] : [],
      explicitCompleteDates,
    })
  const adaptiveAnchors = deriveWeeklyWeightAnchors(
    metricsRes.data ?? [], bounds.endDate, ADJUSTMENT_ANCHOR_WINDOW_WEEKS)
  const latestAnchorLbs = adaptiveAnchors[adaptiveAnchors.length - 1]?.anchorLbs ?? null
  const baselineWeightLbs = latestAnchorLbs ??
    (profileContext?.currentWeightKg != null ? kgToLbs(profileContext.currentWeightKg) : null)
  const adaptive = baselineWeightLbs !== null
    ? inferAdaptiveMaintenance({
        baseline: estimateBaselineTdee({
          weightLbs: baselineWeightLbs,
          activityLevel: profileContext?.activityLevel ?? 'moderately_active',
          sex: profileContext?.sex,
          age: profileContext?.age,
          heightCm: profileContext?.heightCm,
          bfPct: profileBfPct,
        }),
        weeks: buildQualifyingWeeks({
          nutritionFacts: adaptiveFacts,
          anchors: adaptiveAnchors,
          endDate: bounds.endDate,
        }),
        daysSinceTargetChange: target
          ? Math.max(0, Math.round(
              (parseISO(todayStr).getTime() - parseISO(target.effective_date).getTime()) / 86_400_000))
          : null,
      })
    : null

  const completedFastsInWindow = (fastingRes.data ?? []).filter(
    (f: { ended_at: string | null }) => f.ended_at !== null).length

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
    explicitCompleteDates,
    activityContext,
    trainingSignal,
    adaptive,
    fastingContext: profileContext?.fastingEnabled
      ? { completedFastsInWindow }
      : null,
  })
}
