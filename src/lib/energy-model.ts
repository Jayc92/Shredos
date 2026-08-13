// ============================================================
// ForgeFitOS — Energy Model (Phase 5B.1)
// ============================================================
// Baseline maintenance/TDEE estimation for the energy layer.
//
// The TARGET-SETTING model is untouched: nutrition targets keep
// coming from lib/nutrition.ts's bodyweight x activity multiplier —
// this module never writes nutrition_targets and never changes how
// targets are generated.
//
// The ENERGY-MODEL role (approved D2 refinement): the SAME
// bodyweight-multiplier estimate is the PRIMARY ANCHOR, and
// Mifflin-St Jeor / Katch-McArdle run only as PLAUSIBILITY
// CROSS-CHECKS when the profile actually supports them. Formulas
// are NEVER averaged together — generic-equation agreement cannot
// manufacture precision, so the output is an anchor plus a
// plausibility range plus structured context, not a single number
// posing as measured truth.
//
// Adaptive/observed maintenance inference deliberately does NOT
// live here yet: it is 5B.2's job, after explicit nutrition-day
// completion (migration 019) exists to gate it. Nothing in 5B.1
// exposes an inferred maintenance value that could drive a
// recommendation.
// ============================================================

import { format, parseISO, startOfISOWeek, subDays, addDays } from 'date-fns'
import { ACTIVITY_LEVEL_MULTIPLIERS } from '@/lib/constants'
import { lbsToKg } from '@/lib/units'
import { computeWeightTrend } from '@/lib/energy-facts'
import type {
  DailyNutritionFact,
  WeeklyWeightAnchor,
  WeightTrendFact,
} from '@/lib/energy-facts'
import type { EnergyConfidence } from '@/lib/coach-signals'

// ── Named product constants ────────────────────────────────────────

/** BMR -> TDEE activity factors for the cross-check formulas. These
 *  map the app's three activity levels onto conventional factor
 *  ranges — a product mapping, not a physiological measurement. */
export const MSJ_ACTIVITY_FACTORS: Record<string, number> = {
  sedentary: 1.2,
  moderately_active: 1.45,
  very_active: 1.7,
}

/** Plausibility bounds shared with the 3E body-fat context rules. */
export const BODY_FAT_PLAUSIBLE_MIN = 3
export const BODY_FAT_PLAUSIBLE_MAX = 60

/** Profile plausibility gates for Mifflin-St Jeor inputs (matching
 *  the onboarding CHECK ranges where they exist). */
export const AGE_PLAUSIBLE_MIN = 13
export const AGE_PLAUSIBLE_MAX = 120
export const HEIGHT_CM_PLAUSIBLE_MIN = 100
export const HEIGHT_CM_PLAUSIBLE_MAX = 250

/** Context flag threshold: when the range spans more than this
 *  fraction of the anchor, the estimates genuinely disagree and the
 *  consumer should treat the baseline as soft. */
export const CROSS_CHECK_DIVERGENCE_FRACTION = 0.25

// ── Types ──────────────────────────────────────────────────────────

export type TdeeCrossCheckMethod = 'mifflin_st_jeor' | 'katch_mcardle'

export interface TdeeCrossCheck {
  method: TdeeCrossCheckMethod
  estimate: number
}

export interface BaselineTdeeEstimate {
  /** The bodyweight-multiplier estimate — the product's anchor. */
  primaryEstimate: number
  /** Min/max across the anchor and available cross-checks. NEVER an
   *  average — it answers "is the anchor broadly plausible?" */
  plausibilityRange: { low: number; high: number }
  crossChecks: TdeeCrossCheck[]
  /** Structured context reasons for the eventual AI layer. */
  context: string[]
}

export interface BaselineTdeeInput {
  weightLbs: number
  activityLevel: string
  sex?: string | null
  age?: number | null
  heightCm?: number | null
  bfPct?: number | null
}

// ── Cross-check formulas (pure) ────────────────────────────────────

function plausible(value: number | null | undefined, min: number, max: number): number | null {
  if (value === null || value === undefined || !Number.isFinite(value)) return null
  if (value < min || value > max) return null
  return value
}

/** Mifflin-St Jeor BMR — requires binary-sex constant, plausible age
 *  and height. Returns null (never a guess) when unsupported. */
export function mifflinStJeorBmr(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: 'male' | 'female'
): number {
  const sexConstant = sex === 'male' ? 5 : -161
  return 10 * weightKg + 6.25 * heightCm - 5 * age + sexConstant
}

/** Katch-McArdle BMR — requires plausible body fat (lean mass based,
 *  sex-independent). */
export function katchMcArdleBmr(weightKg: number, bfPct: number): number {
  const leanMassKg = weightKg * (1 - bfPct / 100)
  return 370 + 21.6 * leanMassKg
}

// ── The estimator ──────────────────────────────────────────────────

export function estimateBaselineTdee(input: BaselineTdeeInput): BaselineTdeeEstimate {
  const context: string[] = []
  const crossChecks: TdeeCrossCheck[] = []

  // The anchor: exactly the model nutrition.ts uses for targets
  // (same multiplier table, same 12 fallback).
  const multiplier = ACTIVITY_LEVEL_MULTIPLIERS[input.activityLevel] ?? 12
  const primaryEstimate = Math.round(input.weightLbs * multiplier)
  const activityFactor = MSJ_ACTIVITY_FACTORS[input.activityLevel] ?? MSJ_ACTIVITY_FACTORS.moderately_active

  const weightKg = lbsToKg(input.weightLbs)

  // Mifflin-St Jeor: only with a binary sex constant and plausible
  // age/height — never guessed for other/unknown profiles.
  const age = plausible(input.age, AGE_PLAUSIBLE_MIN, AGE_PLAUSIBLE_MAX)
  const heightCm = plausible(input.heightCm, HEIGHT_CM_PLAUSIBLE_MIN, HEIGHT_CM_PLAUSIBLE_MAX)
  if ((input.sex === 'male' || input.sex === 'female') && age !== null && heightCm !== null) {
    crossChecks.push({
      method: 'mifflin_st_jeor',
      estimate: Math.round(mifflinStJeorBmr(weightKg, heightCm, age, input.sex) * activityFactor),
    })
  } else {
    context.push('mifflin_unavailable_incomplete_profile')
  }

  // Katch-McArdle: only with plausible body fat.
  const bfPct = plausible(input.bfPct, BODY_FAT_PLAUSIBLE_MIN, BODY_FAT_PLAUSIBLE_MAX)
  if (bfPct !== null) {
    crossChecks.push({
      method: 'katch_mcardle',
      estimate: Math.round(katchMcArdleBmr(weightKg, bfPct) * activityFactor),
    })
  } else {
    context.push('katch_unavailable_no_body_fat')
  }

  // Range = spread across anchor + cross-checks. No averaging exists
  // anywhere in this module (pinned): the checks bound plausibility,
  // they never blend into a fake "true TDEE".
  const all = [primaryEstimate, ...crossChecks.map((c) => c.estimate)]
  const low = Math.min(...all)
  const high = Math.max(...all)

  if (crossChecks.length === 0) {
    context.push('no_cross_checks_available')
  } else if (primaryEstimate > 0 && (high - low) / primaryEstimate > CROSS_CHECK_DIVERGENCE_FRACTION) {
    context.push('cross_checks_diverge')
  }

  return {
    primaryEstimate,
    plausibilityRange: { low, high },
    crossChecks,
    context,
  }
}

// ============================================================
// Phase 5B.2 — Adaptive maintenance inference
// ============================================================
// Observed maintenance is inferred from qualified average intake
// plus the observed weekly weight trend:
//
//   maintenance ~= intake - daily energy-storage change
//   daily storage change  = weeklyRateLb x 3500 / 7
//
// 3500 kcal/lb is an explicit APPROXIMATION, never presented as
// measured physiology — the rolling window absorbs its error.
// Losing weight => negative storage change => maintenance > intake.
//
// Evidence discipline:
//   - intake evidence comes from EXPLICITLY completed days first
//     (nutrition_day_status); heuristic likely-complete days are
//     fallback at reduced confidence; partial/missing days are
//     excluded from the mean and NEVER counted as zero calories
//   - weight evidence reuses the 5B.1 weekly-anchor regression
//     (Friday-only cadence fully supported, real week spacing)
//   - workout calories, activity-session calories, steps, and
//     distance NEVER enter this math: observed intake + weight
//     response already captures total system behavior, and adding
//     session components would double-count (the aggregate/
//     component rule)
//
// Adaptation is BOUNDED and fully DERIVED (no adaptive_tdee_state,
// no hidden mutable calibration): the surfaced estimate moves from
// the baseline toward the raw observation by at most 100 kcal per
// qualifying week in the window, clamped to +/-25% of baseline —
// one window can never radically rewrite the model.
// ============================================================

// ── Named inference constants ──────────────────────────────────────

export const INFERENCE_WINDOW_DAYS = 28
/** Anchored ISO weeks examined inside the primary window. The
 *  window never silently expands until something fits. */
export const MAX_INFERENCE_WEEKS = 4
/** Qualifying weeks required before ANY adaptive estimate surfaces. */
export const MIN_QUALIFYING_WEEKS = 3
/** Complete nutrition days required per qualifying week. */
export const MIN_COMPLETE_DAYS_PER_WEEK = 5
/** The classic approximation, documented as such. */
export const KCAL_PER_LB = 3500
/** Bounded adaptation: max movement per qualifying week of evidence. */
export const ADAPTIVE_STEP_PER_WEEK_KCAL = 100
/** Overall clamp as a fraction of the primary baseline. */
export const ADAPTIVE_CLAMP_FRACTION = 0.25
/** Outlier gate: a week-over-week anchor move beyond this % of body
 *  weight is water/noise/illness, not energy balance — excluded. */
export const OUTLIER_WEEKLY_CHANGE_PCT = 1.5
/** A qualifying week's mean intake below this is implausible logging
 *  masquerading as real intake. */
export const IMPLAUSIBLE_INTAKE_FLOOR = 800
/** User-consumable range bounds round to this. */
export const MAINTENANCE_RANGE_ROUNDING = 50
/** Range half-widths by status — honesty about uncertainty. */
export const RANGE_HALF_WIDTH_KCAL: Record<'observing' | 'moderate_confidence' | 'high_confidence', number> = {
  observing: 200,
  moderate_confidence: 150,
  high_confidence: 100,
}

// ── Qualifying weeks ───────────────────────────────────────────────

export type WeekEvidenceQuality = 'explicit' | 'heuristic' | 'none'

export interface QualifyingEnergyWeek {
  /** Monday of the ISO week. */
  weekStart: string
  weekEnd: string
  /** Mean intake across the week's counted complete days. */
  avgCalories: number | null
  explicitCompleteDays: number
  heuristicCompleteDays: number
  weightAnchor: WeeklyWeightAnchor | null
  /** Distinct historical target calories seen across the week. */
  targetCaloriesSeen: number[]
  /** Which evidence tier fed avgCalories. */
  evidenceQuality: WeekEvidenceQuality
  qualifies: boolean
  excluded: boolean
  exclusionReasons: string[]
}

/**
 * Partitions the trailing MAX_INFERENCE_WEEKS ISO weeks (ending at
 * the week containing endDate) into deterministic, inspectable
 * qualifying-week records. Intake means come from explicit days
 * when the week has enough of them; otherwise explicit + heuristic
 * likely-complete days together as reduced-confidence fallback.
 * Partial/missing days never contribute (and never read as zero).
 */
export function buildQualifyingWeeks(input: {
  nutritionFacts: DailyNutritionFact[]
  anchors: WeeklyWeightAnchor[]
  endDate: string
}): QualifyingEnergyWeek[] {
  const factsByDate = new Map(input.nutritionFacts.map((f) => [f.date, f]))
  const anchorsByWeek = new Map(input.anchors.map((a) => [a.weekStart, a]))
  const currentMonday = startOfISOWeek(parseISO(input.endDate))

  const weeks: QualifyingEnergyWeek[] = []
  for (let w = MAX_INFERENCE_WEEKS - 1; w >= 0; w--) {
    const monday = subDays(currentMonday, w * 7)
    const weekStart = format(monday, 'yyyy-MM-dd')
    const weekEnd = format(addDays(monday, 6), 'yyyy-MM-dd')

    const dayFacts: DailyNutritionFact[] = []
    for (let d = 0; d < 7; d++) {
      const fact = factsByDate.get(format(addDays(monday, d), 'yyyy-MM-dd'))
      if (fact) dayFacts.push(fact)
    }
    const explicitDays = dayFacts.filter((f) => f.completeness === 'explicit_complete')
    const heuristicDays = dayFacts.filter((f) => f.completeness === 'likely_complete')

    let counted: DailyNutritionFact[] = []
    let evidenceQuality: WeekEvidenceQuality = 'none'
    if (explicitDays.length >= MIN_COMPLETE_DAYS_PER_WEEK) {
      counted = explicitDays
      evidenceQuality = 'explicit'
    } else if (explicitDays.length + heuristicDays.length >= MIN_COMPLETE_DAYS_PER_WEEK) {
      counted = [...explicitDays, ...heuristicDays]
      evidenceQuality = 'heuristic'
    }

    const calorieValues = counted
      .map((f) => f.calories)
      .filter((c): c is number => c !== null && Number.isFinite(c))
    const avgCalories = calorieValues.length > 0
      ? calorieValues.reduce((s, c) => s + c, 0) / calorieValues.length
      : null

    const targetCaloriesSeen = Array.from(new Set(
      dayFacts
        .map((f) => f.targetCalories)
        .filter((t): t is number => t !== null)
    ))

    const anchor = anchorsByWeek.get(weekStart) ?? null
    const exclusionReasons: string[] = []
    if (evidenceQuality === 'none') exclusionReasons.push('insufficient_nutrition_days')
    if (anchor === null) exclusionReasons.push('no_weight_anchor')
    if (avgCalories !== null && avgCalories < IMPLAUSIBLE_INTAKE_FLOOR) {
      exclusionReasons.push('implausible_low_intake')
    }

    weeks.push({
      weekStart,
      weekEnd,
      avgCalories,
      explicitCompleteDays: explicitDays.length,
      heuristicCompleteDays: heuristicDays.length,
      weightAnchor: anchor,
      targetCaloriesSeen,
      evidenceQuality,
      qualifies: false, // finalized below after outlier pass
      excluded: exclusionReasons.length > 0,
      exclusionReasons,
    })
  }

  // Outlier pass: a week whose anchor moved more than
  // OUTLIER_WEEKLY_CHANGE_PCT of body weight against the PRIOR anchor
  // is excluded (water/noise/illness, not energy balance); the
  // surrounding valid weeks are retained untouched.
  for (let i = 1; i < weeks.length; i++) {
    const prev = weeks[i - 1].weightAnchor
    const curr = weeks[i].weightAnchor
    if (!prev || !curr) continue
    const changePct = Math.abs((curr.anchorLbs - prev.anchorLbs) / prev.anchorLbs) * 100
    if (changePct > OUTLIER_WEEKLY_CHANGE_PCT) {
      weeks[i].excluded = true
      if (!weeks[i].exclusionReasons.includes('extreme_weight_change')) {
        weeks[i].exclusionReasons.push('extreme_weight_change')
      }
    }
  }

  for (const week of weeks) {
    week.qualifies = !week.excluded
  }
  return weeks
}

// ── The adaptive estimate ──────────────────────────────────────────

export type AdaptiveMaintenanceStatus =
  | 'insufficient_data'
  | 'observing'
  | 'moderate_confidence'
  | 'high_confidence'

export interface AdaptiveMaintenanceEstimate {
  status: AdaptiveMaintenanceStatus
  baseline: BaselineTdeeEstimate
  /** Raw inferred maintenance (internal precision); null until
   *  enough qualifying evidence exists. */
  observedMaintenance: number | null
  /** The bounded blend actually surfaced. */
  adaptiveCentral: number | null
  /** User-consumable range (rounded bounds) — ranges, not false
   *  precision. */
  estimatedMaintenanceRange: [number, number] | null
  weeklyRateLb: number | null
  avgQualifiedIntake: number | null
  qualifyingWeeks: QualifyingEnergyWeek[]
  weightTrend: WeightTrendFact
  confidence: EnergyConfidence
  evidence: {
    explicitDays: number
    heuristicDays: number
    anchorsUsed: number
    weeksQualified: number
  }
}

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step
}

/**
 * Pure, fully-derived adaptive inference over qualifying weeks.
 * Deterministic bounded blend: correction toward the raw observation
 * grows with evidence (100 kcal per qualifying week) and is clamped
 * at +/-25% of the primary baseline. No persisted calibration state
 * exists anywhere.
 */
export function inferAdaptiveMaintenance(input: {
  baseline: BaselineTdeeEstimate
  weeks: QualifyingEnergyWeek[]
  daysSinceTargetChange: number | null
}): AdaptiveMaintenanceEstimate {
  const qualified = input.weeks.filter((w) => w.qualifies && w.avgCalories !== null)
  const anchors = qualified
    .map((w) => w.weightAnchor)
    .filter((a): a is WeeklyWeightAnchor => a !== null)
  const weightTrend = computeWeightTrend(anchors)

  const evidence = {
    explicitDays: input.weeks.reduce((s, w) => s + w.explicitCompleteDays, 0),
    heuristicDays: input.weeks.reduce((s, w) => s + w.heuristicCompleteDays, 0),
    anchorsUsed: anchors.length,
    weeksQualified: qualified.length,
  }

  const reasons: string[] = []
  if (qualified.length < MIN_QUALIFYING_WEEKS) reasons.push('insufficient_qualifying_weeks')
  if (weightTrend.trendConfidence === 'insufficient') reasons.push('insufficient_weight_anchors')
  const explicitWeeks = qualified.filter((w) => w.evidenceQuality === 'explicit').length
  const heuristicWeeks = qualified.filter((w) => w.evidenceQuality === 'heuristic').length
  if (qualified.length > 0 && heuristicWeeks >= explicitWeeks && heuristicWeeks > 0) {
    reasons.push('mostly_heuristic_nutrition_days')
  }
  if (qualified.length > 0 && explicitWeeks === 0) {
    reasons.push('insufficient_explicit_nutrition_days')
  }
  if (
    input.daysSinceTargetChange !== null &&
    Number.isFinite(input.daysSinceTargetChange) &&
    input.daysSinceTargetChange < 14
  ) {
    reasons.push('recent_target_change')
  }
  if (weightTrend.trendConfidence === 'low') reasons.push('high_weight_variance')
  if (input.weeks.some((w) => w.exclusionReasons.includes('extreme_weight_change'))) {
    reasons.push('outlier_week_excluded')
  }
  if (input.weeks.some((w) => w.targetCaloriesSeen.length > 1)) {
    reasons.push('target_changed_during_window')
  }

  const base: AdaptiveMaintenanceEstimate = {
    status: 'insufficient_data',
    baseline: input.baseline,
    observedMaintenance: null,
    adaptiveCentral: null,
    estimatedMaintenanceRange: null,
    weeklyRateLb: weightTrend.weeklyRateLb,
    avgQualifiedIntake: null,
    qualifyingWeeks: input.weeks,
    weightTrend,
    confidence: {
      level: 'low',
      reasons,
    },
    evidence,
  }

  if (
    qualified.length < MIN_QUALIFYING_WEEKS ||
    weightTrend.weeklyRateLb === null
  ) {
    return base
  }

  // Observed maintenance = qualified intake mean minus the daily
  // energy-storage change implied by the weight trend.
  const avgIntake =
    qualified.reduce((s, w) => s + (w.avgCalories as number), 0) / qualified.length
  const dailyStorageChange = (weightTrend.weeklyRateLb * KCAL_PER_LB) / 7
  const observed = avgIntake - dailyStorageChange

  // Bounded blend toward the observation.
  const rawCorrection = observed - input.baseline.primaryEstimate
  const evidenceBound = ADAPTIVE_STEP_PER_WEEK_KCAL * qualified.length
  const clampBound = input.baseline.primaryEstimate * ADAPTIVE_CLAMP_FRACTION
  const boundedMagnitude = Math.min(Math.abs(rawCorrection), evidenceBound, clampBound)
  const adaptiveCentral = Math.round(
    input.baseline.primaryEstimate + Math.sign(rawCorrection) * boundedMagnitude
  )

  // Status ladder (deterministic):
  //   3 qualifying weeks                       -> observing
  //   4 weeks but soft concerns               -> moderate_confidence
  //   4 weeks, explicit-majority, solid trend -> high_confidence
  let status: AdaptiveMaintenanceStatus = 'observing'
  if (qualified.length >= MAX_INFERENCE_WEEKS) {
    const softConcerns =
      reasons.includes('mostly_heuristic_nutrition_days') ||
      reasons.includes('insufficient_explicit_nutrition_days') ||
      reasons.includes('recent_target_change') ||
      reasons.includes('high_weight_variance') ||
      reasons.includes('target_changed_during_window')
    status = softConcerns ? 'moderate_confidence' : 'high_confidence'
  }

  // status is narrowed to observing/moderate/high on this path.
  const halfWidth = RANGE_HALF_WIDTH_KCAL[status]
  const range: [number, number] = [
    roundTo(adaptiveCentral - halfWidth, MAINTENANCE_RANGE_ROUNDING),
    roundTo(adaptiveCentral + halfWidth, MAINTENANCE_RANGE_ROUNDING),
  ]

  const level: EnergyConfidence['level'] =
    status === 'high_confidence' ? 'high'
    : status === 'moderate_confidence' ? 'moderate'
    : 'low'

  return {
    ...base,
    status,
    observedMaintenance: Math.round(observed),
    adaptiveCentral,
    estimatedMaintenanceRange: range,
    avgQualifiedIntake: Math.round(avgIntake),
    confidence: { level, reasons },
  }
}
