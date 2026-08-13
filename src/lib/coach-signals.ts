// ============================================================
// ForgeFitOS — Coach Signals (Phase 5B.1)
// ============================================================
// Deterministic named states derived from energy facts — the middle
// layer between raw facts and (future 5B.4) recommendations:
//
//   facts (energy-facts) -> SIGNALS (this file) ->
//   [5B.4] recommendations via the EXISTING 3E + decision system
//
// 5B.1 boundary, absolute: nothing here suggests, decides, writes,
// or changes eligibility anywhere. No decision_logs, no
// nutrition_targets, no Coach page changes. Signals name what the
// data says; they never say what the user should do.
//
// The vocabulary is deliberately restrained and machine-stable —
// these strings are the contract the eventual AI layer consumes
// (structured reasons, never an opaque score), so additions are
// design decisions, not drive-by strings.
//
// Thresholds reuse the standing coach constants (protein 0.90/0.80,
// on-track band 0.10, reliable days 4) — one source of truth.
// ============================================================

import {
  PROTEIN_MEETING_THRESHOLD,
  PROTEIN_CLOSE_THRESHOLD,
  CALORIE_ON_TRACK_RANGE,
  MIN_RELIABLE_LOGGED_DAYS,
} from '@/lib/coach-constants'
import { MIN_CARBS_GUARDRAIL } from '@/lib/constants'
import type {
  ActivityBaseline,
  ActivityContext,
  DailyNutritionFact,
  WeightTrendFact,
} from '@/lib/energy-facts'

// ── Named product thresholds ───────────────────────────────────────

/** Likely-complete days required in a 7-day window before intake or
 *  macro averages are trusted (the standing reliable-days rule). */
export const SIGNAL_MIN_COMPLETE_DAYS = MIN_RELIABLE_LOGGED_DAYS
/** Fat reads low below this fraction of target (the 0.3 g/lb floor
 *  lives in the target itself; this flags sustained under-eating of
 *  the already-minimal allocation). */
export const FAT_LOW_FRACTION = 0.8
/** A target change within this many days keeps confidence reduced. */
export const RECENT_TARGET_CHANGE_DAYS = 14

// ── Signal vocabulary ──────────────────────────────────────────────

export type CalorieAdherenceSignal =
  | 'intake_on_target'
  | 'intake_above_target'
  | 'intake_below_target'
  | 'insufficient_nutrition_data'

export type ProteinSignal =
  | 'protein_on_target'
  | 'protein_close'
  | 'protein_low'
  | 'insufficient_nutrition_data'

export type CarbSignal =
  | 'carbs_on_plan'
  | 'carbs_below_minimum'
  | 'insufficient_nutrition_data'

export type FatSignal =
  | 'fat_on_plan'
  | 'fat_low'
  | 'insufficient_nutrition_data'

export type WeightEvidenceSignal =
  | 'weight_trending_down'
  | 'weight_stable'
  | 'weight_trending_up'
  | 'insufficient_weight_data'

export interface EnergySignals {
  calorieAdherence: CalorieAdherenceSignal
  proteinState: ProteinSignal
  carbState: CarbSignal
  fatState: FatSignal
  activityContext: ActivityContext
  weightEvidence: WeightEvidenceSignal
  dataCompleteness: EnergyConfidence
  /** Restrained composite highlights (e.g. the canonical
   *  'calories_on_target_protein_low') — named states only, never
   *  advice. */
  highlights: string[]
}

// ── Confidence (structured reasons, never an opaque score) ─────────

export type ConfidenceLevel = 'low' | 'moderate' | 'high'

export interface EnergyConfidence {
  level: ConfidenceLevel
  reasons: string[]
}

/**
 * Deterministic confidence over the assembled evidence. Reason codes
 * are stable vocabulary:
 *   insufficient_weight_anchors   (< 3 anchors — no trend exists)
 *   weight_trend_low_confidence   (trend exists but noisy/short)
 *   nutrition_logging_incomplete  (< 4 likely-complete days in the
 *                                  last 7)
 *   no_activity_baseline          (not enough recorded step days)
 *   recent_target_change          (target moved within 14 days)
 * Level rule: any structural gap (anchors/nutrition) -> low; any
 * other reason -> moderate; no reasons -> high.
 */
export function computeEnergyConfidence(input: {
  nutritionFacts: DailyNutritionFact[]
  weightTrend: WeightTrendFact
  activityBaseline: ActivityBaseline
  daysSinceTargetChange: number | null
}): EnergyConfidence {
  const reasons: string[] = []

  const recentWindow = input.nutritionFacts.slice(-7)
  const completeDays = recentWindow.filter(
    (f) => f.completeness === 'likely_complete'
  ).length
  if (completeDays < SIGNAL_MIN_COMPLETE_DAYS) {
    reasons.push('nutrition_logging_incomplete')
  }

  if (input.weightTrend.trendConfidence === 'insufficient') {
    reasons.push('insufficient_weight_anchors')
  } else if (input.weightTrend.trendConfidence === 'low') {
    reasons.push('weight_trend_low_confidence')
  }

  if (input.activityBaseline.medianDailySteps === null) {
    reasons.push('no_activity_baseline')
  }

  if (
    input.daysSinceTargetChange !== null &&
    Number.isFinite(input.daysSinceTargetChange) &&
    input.daysSinceTargetChange < RECENT_TARGET_CHANGE_DAYS
  ) {
    reasons.push('recent_target_change')
  }

  const structuralGap =
    reasons.includes('insufficient_weight_anchors') ||
    reasons.includes('nutrition_logging_incomplete')
  const level: ConfidenceLevel =
    structuralGap ? 'low' : reasons.length > 0 ? 'moderate' : 'high'

  return { level, reasons }
}

// ── Averages over trusted days only ────────────────────────────────
// Every intake/macro signal averages LIKELY-COMPLETE days only — a
// partial day's low calories must never read as adherence, and the
// provisional heuristic behind that classification is context, not
// authoritative evidence (the 5B.2 explicit completion signal will
// take precedence once it exists).

function averageOverCompleteDays(
  facts: DailyNutritionFact[],
  pick: (f: DailyNutritionFact) => number | null
): { average: number | null; days: number } {
  const values = facts
    .filter((f) => f.completeness === 'likely_complete')
    .map(pick)
    .filter((v): v is number => v !== null && Number.isFinite(v))
  if (values.length === 0) return { average: null, days: 0 }
  return {
    average: values.reduce((s, v) => s + v, 0) / values.length,
    days: values.length,
  }
}

// ── Individual signals ─────────────────────────────────────────────

export function deriveCalorieAdherence(
  facts: DailyNutritionFact[],
  targetCalories: number | null
): CalorieAdherenceSignal {
  if (targetCalories === null || !Number.isFinite(targetCalories) || targetCalories <= 0) {
    return 'insufficient_nutrition_data'
  }
  const { average, days } = averageOverCompleteDays(facts, (f) => f.calories)
  if (average === null || days < SIGNAL_MIN_COMPLETE_DAYS) {
    return 'insufficient_nutrition_data'
  }
  // Same float-exact band-edge formulation as energy-facts adherence.
  const deviation = Math.abs(average - targetCalories) / targetCalories
  if (deviation <= CALORIE_ON_TRACK_RANGE) return 'intake_on_target'
  return average > targetCalories ? 'intake_above_target' : 'intake_below_target'
}

export function deriveProteinState(
  facts: DailyNutritionFact[],
  targetProteinG: number | null
): ProteinSignal {
  if (targetProteinG === null || !Number.isFinite(targetProteinG) || targetProteinG <= 0) {
    return 'insufficient_nutrition_data'
  }
  const { average, days } = averageOverCompleteDays(facts, (f) => f.proteinG)
  if (average === null || days < SIGNAL_MIN_COMPLETE_DAYS) {
    return 'insufficient_nutrition_data'
  }
  const ratio = average / targetProteinG
  if (ratio >= PROTEIN_MEETING_THRESHOLD) return 'protein_on_target'
  if (ratio >= PROTEIN_CLOSE_THRESHOLD) return 'protein_close'
  return 'protein_low'
}

export function deriveCarbState(facts: DailyNutritionFact[]): CarbSignal {
  const { average, days } = averageOverCompleteDays(facts, (f) => f.carbsG)
  if (average === null || days < SIGNAL_MIN_COMPLETE_DAYS) {
    return 'insufficient_nutrition_data'
  }
  return average < MIN_CARBS_GUARDRAIL ? 'carbs_below_minimum' : 'carbs_on_plan'
}

export function deriveFatState(
  facts: DailyNutritionFact[],
  targetFatG: number | null
): FatSignal {
  if (targetFatG === null || !Number.isFinite(targetFatG) || targetFatG <= 0) {
    return 'insufficient_nutrition_data'
  }
  const { average, days } = averageOverCompleteDays(facts, (f) => f.fatG)
  if (average === null || days < SIGNAL_MIN_COMPLETE_DAYS) {
    return 'insufficient_nutrition_data'
  }
  return average < targetFatG * FAT_LOW_FRACTION ? 'fat_low' : 'fat_on_plan'
}

export function deriveWeightEvidence(trend: WeightTrendFact): WeightEvidenceSignal {
  switch (trend.trendDirection) {
    case 'losing': return 'weight_trending_down'
    case 'gaining': return 'weight_trending_up'
    case 'holding': return 'weight_stable'
    default: return 'insufficient_weight_data'
  }
}

// ── Assembly ───────────────────────────────────────────────────────

/**
 * Pure assembly of the full signal set. Fasting is deliberately
 * absent: fasting is a behavioral tool with no energy math — it is
 * never counted as expenditure or deficit, and its adherence
 * signals belong to a later Coach phase.
 */
export function deriveEnergySignals(input: {
  nutritionFacts: DailyNutritionFact[]
  targetCalories: number | null
  targetProteinG: number | null
  targetFatG: number | null
  weightTrend: WeightTrendFact
  activityBaseline: ActivityBaseline
  activityContext: ActivityContext
  daysSinceTargetChange: number | null
}): EnergySignals {
  const calorieAdherence = deriveCalorieAdherence(input.nutritionFacts, input.targetCalories)
  const proteinState = deriveProteinState(input.nutritionFacts, input.targetProteinG)
  const carbState = deriveCarbState(input.nutritionFacts)
  const fatState = deriveFatState(input.nutritionFacts, input.targetFatG)
  const weightEvidence = deriveWeightEvidence(input.weightTrend)
  const dataCompleteness = computeEnergyConfidence({
    nutritionFacts: input.nutritionFacts,
    weightTrend: input.weightTrend,
    activityBaseline: input.activityBaseline,
    daysSinceTargetChange: input.daysSinceTargetChange,
  })

  const highlights: string[] = []
  if (calorieAdherence === 'intake_on_target' && proteinState === 'protein_low') {
    highlights.push('calories_on_target_protein_low')
  }
  if (calorieAdherence === 'intake_above_target') {
    highlights.push('intake_above_target')
  }

  return {
    calorieAdherence,
    proteinState,
    carbState,
    fatState,
    activityContext: input.activityContext,
    weightEvidence,
    dataCompleteness,
    highlights,
  }
}
