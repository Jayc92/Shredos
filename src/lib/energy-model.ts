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

import { ACTIVITY_LEVEL_MULTIPLIERS } from '@/lib/constants'
import { lbsToKg } from '@/lib/units'

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
