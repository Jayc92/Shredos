// ============================================================
// ShredOS — Quick Drink Log Presets (Phase 1Q)
//
// Generic, approximate presets for fast quantity-based drink
// logging ("I had 7 Bud Lights" -> one aggregate food_logs row).
// Figures are rough, brand-agnostic estimates only — never
// presented as exact nutrition for a specific product.
//
// No alcohol-specific schema fields. No BAC/safety thresholds.
// No health claims. Drinks logged this way are plain food_logs
// rows with meal_type 'drink' — existing daily totals, nutrition
// coach averages, and dashboard NutritionCard already include
// them with zero code changes, since none of that logic filters
// by meal_type.
// ============================================================

export interface DrinkPreset {
  id: string
  label: string
  /** Human-readable serving description, e.g. "12 oz light beer" */
  servingDescription: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

export const DRINK_PRESETS: DrinkPreset[] = [
  {
    id: 'light_beer',
    label: 'Light beer',
    servingDescription: '12 oz light beer',
    calories: 100,
    protein_g: 0,
    carbs_g: 5,
    fat_g: 0,
  },
  {
    id: 'regular_beer',
    label: 'Regular beer',
    servingDescription: '12 oz regular beer',
    calories: 150,
    protein_g: 0,
    carbs_g: 13,
    fat_g: 0,
  },
  {
    id: 'wine',
    label: 'Wine',
    servingDescription: '5 oz wine',
    calories: 120,
    protein_g: 0,
    carbs_g: 4,
    fat_g: 0,
  },
  {
    id: 'liquor_shot',
    label: 'Liquor shot',
    servingDescription: '1.5 oz liquor shot',
    calories: 100,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
  },
  {
    id: 'mixed_drink',
    label: 'Mixed drink',
    servingDescription: 'mixed drink',
    calories: 200,
    protein_g: 0,
    carbs_g: 20,
    fat_g: 0,
  },
]

export interface QuickDrinkLogPayload {
  logged_date: string
  meal_type: 'drink'
  food_name: string
  serving_description: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

/**
 * Computes the scaled food_logs payload for a preset, quantity, optional
 * custom name, and the currently-selected page date. Pure function, no I/O
 * — the caller is responsible for the actual POST to /api/food-logs.
 */
export function computeDrinkLogPayload(
  preset: DrinkPreset,
  quantity: number,
  customName: string,
  date: string
): QuickDrinkLogPayload {
  const foodName = customName.trim() || preset.label
  const servingDescription = `${quantity} drink${quantity !== 1 ? 's' : ''} (${preset.servingDescription}, est.)`

  return {
    logged_date: date,
    meal_type: 'drink',
    food_name: foodName,
    serving_description: servingDescription,
    calories: Math.round(preset.calories * quantity),
    protein_g: Math.round(preset.protein_g * quantity * 10) / 10,
    carbs_g: Math.round(preset.carbs_g * quantity * 10) / 10,
    fat_g: Math.round(preset.fat_g * quantity * 10) / 10,
  }
}
