// ============================================================
// ShredOS — Food Logging Utilities
// ============================================================

import type { FoodLog, NutritionTarget } from '@/types/database'
import type { DailyNutritionTotals, NutritionProgress, MacroProgress } from '@/types/app'

// ── Daily totals ─────────────────────────────────────────────────

/**
 * Sums all food_log entries for a given date.
 * Optional micros (fiber, sugar, sodium) are null if NO entry recorded them.
 */
export function computeDailyTotals(logs: FoodLog[], date: string): DailyNutritionTotals {
  if (logs.length === 0) {
    return {
      date,
      calories: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      fiber_g: null,
      sugar_g: null,
      sodium_mg: null,
      entry_count: 0,
    }
  }

  const r1 = (n: number) => Math.round(n * 10) / 10

  const hasAnyFiber  = logs.some((l) => l.fiber_g  !== null)
  const hasAnySugar  = logs.some((l) => l.sugar_g  !== null)
  const hasAnySodium = logs.some((l) => l.sodium_mg !== null)

  return {
    date,
    calories:  logs.reduce((s, l) => s + (l.calories  ?? 0), 0),
    protein_g: r1(logs.reduce((s, l) => s + Number(l.protein_g ?? 0), 0)),
    carbs_g:   r1(logs.reduce((s, l) => s + Number(l.carbs_g   ?? 0), 0)),
    fat_g:     r1(logs.reduce((s, l) => s + Number(l.fat_g     ?? 0), 0)),
    fiber_g:   hasAnyFiber  ? r1(logs.reduce((s, l) => s + Number(l.fiber_g  ?? 0), 0)) : null,
    sugar_g:   hasAnySugar  ? r1(logs.reduce((s, l) => s + Number(l.sugar_g  ?? 0), 0)) : null,
    sodium_mg: hasAnySodium ? logs.reduce((s, l) => s + (l.sodium_mg ?? 0), 0) : null,
    entry_count: logs.length,
  }
}

// ── Progress calculation ──────────────────────────────────────────

function macroProgress(consumed: number, target: number): MacroProgress {
  const pct = target > 0 ? Math.round((consumed / target) * 100) : 0
  return {
    consumed,
    target,
    pct,
    remaining: Math.round((target - consumed) * 10) / 10,
  }
}

/**
 * Computes progress bars and coaching warnings.
 * nowHour: 0–23 — used for time-gated protein warnings.
 */
export function computeNutritionProgress(
  totals: DailyNutritionTotals,
  target: NutritionTarget,
  nowHour: number
): NutritionProgress {
  const warnings: string[] = []

  const cal  = macroProgress(totals.calories,  target.calories)
  const pro  = macroProgress(totals.protein_g, target.protein_g)
  const carb = macroProgress(totals.carbs_g,   target.carbs_g)
  const fat  = macroProgress(totals.fat_g,     target.fat_g)

  // Calorie warning
  if (cal.pct > 100) {
    warnings.push(
      `Calorie target exceeded by ${Math.abs(cal.remaining)} cal. ` +
      `Calories still determine fat loss — one day over target won't derail progress.`
    )
  }

  // Protein warnings — time-gated
  if (pro.pct < 25 && nowHour >= 21) {
    warnings.push(
      `Protein critically low — only ${totals.protein_g}g of ${target.protein_g}g target. ` +
      `Prioritize a high-protein snack before bed.`
    )
  } else if (pro.pct < 50 && nowHour >= 18) {
    warnings.push(
      `Protein is low with less than 6 hours left today — ` +
      `${totals.protein_g}g of ${target.protein_g}g target. Keep protein high.`
    )
  }

  return { calories: cal, protein_g: pro, carbs_g: carb, fat_g: fat, warnings }
}

// ── Macro cross-check (soft warning) ─────────────────────────────

/**
 * Checks whether the entered calorie value is consistent with the macros.
 * Returns a warning string if the implied calories deviate by more than 50.
 * This is a soft warning — it never blocks saving.
 */
export function macroCrossCheckWarning(
  calories: number,
  proteinG: number,
  carbsG: number,
  fatG: number
): string | null {
  const implied = Math.round(proteinG * 4 + carbsG * 4 + fatG * 9)
  const diff = Math.abs(implied - calories)
  if (diff > 50) {
    return (
      `Macro total (${proteinG}g P + ${carbsG}g C + ${fatG}g F ≈ ${implied} cal) ` +
      `doesn't match entered calories (${calories} cal). ` +
      `Double-check your entries, or save anyway if correct.`
    )
  }
  return null
}

// ── Progress bar color ────────────────────────────────────────────

/** Returns a Tailwind bg color class based on percentage. */
export function progressColor(pct: number, isCalories = false): string {
  if (isCalories) {
    if (pct > 100) return 'bg-red-500'
    if (pct > 90)  return 'bg-amber-500'
    return 'bg-green-500'
  }
  return 'bg-blue-500'
}

/** Returns a Tailwind text color class for the remaining label. */
export function remainingColor(remaining: number): string {
  if (remaining < 0) return 'text-red-400'
  if (remaining < 50) return 'text-amber-400'
  return 'text-muted-foreground'
}

// ── Meal type helpers ─────────────────────────────────────────────

export function mealTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    snack: 'Snack',
    supplement: 'Supplement',
    drink: 'Drink',
  }
  return labels[type] ?? type
}
