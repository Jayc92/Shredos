// ============================================================
// ShredOS — Unit Conversion Utilities
// Internal storage: metric (kg, cm)
// UI display: imperial (lbs, feet/inches)
// ============================================================

const LBS_PER_KG = 2.20462
const CM_PER_INCH = 2.54
const INCHES_PER_FOOT = 12

// ── Weight ───────────────────────────────────────────────────────

/** Convert pounds to kilograms for storage */
export function lbsToKg(lbs: number): number {
  return Math.round((lbs / LBS_PER_KG) * 100) / 100
}

/** Convert kilograms to pounds for display */
export function kgToLbs(kg: number): number {
  return Math.round(kg * LBS_PER_KG * 10) / 10
}

/** Format kg as lbs string for display: "183.4 lbs" */
export function formatWeightLbs(kg: number, decimals = 1): string {
  return `${kgToLbs(kg).toFixed(decimals)} lbs`
}

/** Format kg as lbs change string: "+1.2 lbs" or "-0.8 lbs" */
export function formatWeightChangeLbs(changeKg: number): string {
  const changeLbs = kgToLbs(Math.abs(changeKg))
  const sign = changeKg >= 0 ? '+' : '-'
  return `${sign}${changeLbs.toFixed(1)} lbs`
}

// ── Height ───────────────────────────────────────────────────────

/** Convert feet and inches to centimetres for storage */
export function feetInchesToCm(feet: number, inches: number): number {
  const totalInches = feet * INCHES_PER_FOOT + inches
  return Math.round(totalInches * CM_PER_INCH * 10) / 10
}

/** Convert centimetres to { feet, inches } for display */
export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = cm / CM_PER_INCH
  const feet = Math.floor(totalInches / INCHES_PER_FOOT)
  const inches = Math.round(totalInches % INCHES_PER_FOOT)
  return { feet, inches }
}

/** Format cm as feet/inches string: "6'1\"" */
export function formatHeightImperial(cm: number): string {
  const { feet, inches } = cmToFeetInches(cm)
  return `${feet}'${inches}"`
}

// ── BMI ──────────────────────────────────────────────────────────
// NOTE: BMI is calculated here in the app. It is NOT a generated
// database column because weight (body_metrics) and height
// (user_profiles) live in separate tables.

/**
 * Calculate BMI from weight in kg and height in cm.
 * Returns null if either value is missing.
 */
export function calculateBMI(weightKg: number | null, heightCm: number | null): number | null {
  if (!weightKg || !heightCm || heightCm === 0) return null
  const heightM = heightCm / 100
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10
}

/** Get BMI category label */
export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return 'Underweight'
  if (bmi < 25) return 'Normal weight'
  if (bmi < 30) return 'Overweight'
  return 'Obese'
}

/** BMI disclaimer — always show this alongside BMI */
export const BMI_DISCLAIMER =
  'BMI is a rough population-level marker. It does not account for muscle mass, bone density, or body composition. Use body fat % and measurements as primary physique metrics.'

// ── Body composition ─────────────────────────────────────────────

/** Calculate lean body mass in lbs */
export function leanMassLbs(weightLbs: number, bfPct: number): number {
  return Math.round(weightLbs * (1 - bfPct / 100))
}

/** Calculate lean body mass in kg */
export function leanMassKg(weightKg: number, bfPct: number): number {
  return Math.round(weightKg * (1 - bfPct / 100) * 10) / 10
}

// ── Parse helpers (for form inputs) ──────────────────────────────

/** Parse a string to a float, returning null if invalid */
export function parseFloat2(s: string): number | null {
  const n = parseFloat(s)
  return isNaN(n) ? null : n
}

/** Parse a string to an integer, returning null if invalid */
export function parseInt2(s: string): number | null {
  const n = parseInt(s, 10)
  return isNaN(n) ? null : n
}
