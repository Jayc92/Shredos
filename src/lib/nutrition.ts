// ============================================================
// ShredOS — Nutrition Calculator
// ============================================================
// Formula reference:
//   Maintenance = bodyweight (lbs) × activity multiplier
//   Multipliers: sedentary=10, moderately_active=12, very_active=14
//   Protein: 1g/lb bodyweight (or lean mass — sex-aware threshold)
//   Fat min: 0.3g/lb bodyweight
//   Carbs: remaining calories ÷ 4 (after protein + fat calories)
//   Macro calories: protein=4 cal/g, carbs=4 cal/g, fat=9 cal/g
// ============================================================

import {
  ACTIVITY_LEVEL_MULTIPLIERS,
  DEFAULT_DEFICIT,
  FAT_PER_LB,
  LEAN_MASS_PROTEIN_THRESHOLD,
  MIN_CARBS_GUARDRAIL,
  PROTEIN_PER_LB,
} from './constants'
import { leanMassLbs } from './units'
import type { NutritionCalculationInput, NutritionCalculationResult } from '@/types/app'

// ── Sex-aware protein basis decision ─────────────────────────────

/**
 * Determines whether to use lean body mass (rather than total bodyweight)
 * as the basis for protein targets.
 *
 * Thresholds are sex-aware:
 *   Male:   BF% >= 25 → use lean mass
 *   Female: BF% >= 35 → use lean mass
 *   Other / prefer_not_to_say / unknown: stays on bodyweight,
 *     but a note is returned so the user can make an informed choice.
 */
function getProteinBasisInfo(
  sex: string | null | undefined,
  bfPct: number | null | undefined,
  weightLbs: number
): {
  proteinLbs: number
  basis: 'bodyweight' | 'lean_mass'
  leanMassNote: string | null
} {
  if (!bfPct || bfPct <= 0) {
    return { proteinLbs: weightLbs, basis: 'bodyweight', leanMassNote: null }
  }

  const lm = leanMassLbs(weightLbs, bfPct)

  if (sex === 'male' && bfPct >= LEAN_MASS_PROTEIN_THRESHOLD.male) {
    return {
      proteinLbs: lm,
      basis: 'lean_mass',
      leanMassNote: null,
    }
  }

  if (sex === 'female' && bfPct >= LEAN_MASS_PROTEIN_THRESHOLD.female) {
    return {
      proteinLbs: lm,
      basis: 'lean_mass',
      leanMassNote: null,
    }
  }

  // Unknown/prefer_not_to_say: use bodyweight but offer the option
  const unknownNote =
    sex === 'other' || sex === 'prefer_not_to_say' || !sex
      ? `If your body fat is significantly elevated, using lean body mass (~${lm} lbs) as your protein basis may reduce protein to a more realistic target. You can override this manually.`
      : null

  return {
    proteinLbs: weightLbs,
    basis: 'bodyweight',
    leanMassNote: unknownNote,
  }
}

// ── Main calculator ───────────────────────────────────────────────

export function calculateNutritionTargets(
  input: NutritionCalculationInput
): NutritionCalculationResult {
  const warnings: string[] = []

  const mult = ACTIVITY_LEVEL_MULTIPLIERS[input.activityLevel] ?? 12
  const maintenance = Math.round(input.weightLbs * mult)

  // Goal-based deficit/surplus
  let deficit: number
  switch (input.goal) {
    case 'fat_loss':
      deficit = input.deficitOverride ?? DEFAULT_DEFICIT
      break
    case 'muscle_gain':
      deficit = -200 // surplus
      break
    case 'recomposition':
      deficit = 100  // small deficit
      break
    default:
      deficit = 0    // maintenance / strength / running
  }

  const calories = Math.max(1000, maintenance - deficit)

  // Protein: sex-aware lean-mass threshold
  const { proteinLbs, basis, leanMassNote } = getProteinBasisInfo(
    input.sex,
    input.bfPct,
    input.weightLbs
  )
  if (leanMassNote) warnings.push(leanMassNote)

  const protein_g = Math.round(proteinLbs * PROTEIN_PER_LB)
  const fat_g = Math.round(input.weightLbs * FAT_PER_LB)

  const proteinCal = protein_g * 4
  const fatCal = fat_g * 9
  const remainingCal = Math.max(0, calories - proteinCal - fatCal)
  const carbs_g = Math.round(remainingCal / 4)

  // ── Carb guardrail ─────────────────────────────────────────────
  const low_carb_warning = carbs_g < MIN_CARBS_GUARDRAIL

  if (low_carb_warning) {
    warnings.push(
      `Carbs are ${carbs_g}g/day — below the 75g minimum recommended for training ` +
      `adherence and energy. Consider one of the following: ` +
      `(1) reduce your deficit (currently ${deficit} cal), ` +
      `(2) increase your activity level or step target, ` +
      `(3) switch to lean-body-mass protein basis if body fat is elevated, or ` +
      `(4) manually override your targets below.`
    )
  }

  return {
    calories,
    protein_g,
    fat_g,
    carbs_g,
    maintenance_cal: maintenance,
    deficit,
    multiplier_used: mult,
    protein_basis: basis,
    low_carb_warning,
    warnings,
  }
}

// ── Quick macro math display ──────────────────────────────────────

export function macroCalories(proteinG: number, carbsG: number, fatG: number) {
  return {
    proteinCal: proteinG * 4,
    carbsCal: carbsG * 4,
    fatCal: fatG * 9,
    total: proteinG * 4 + carbsG * 4 + fatG * 9,
  }
}

/** Protein % of total calories */
export function proteinPct(proteinG: number, totalCal: number): number {
  return Math.round(((proteinG * 4) / totalCal) * 100)
}
