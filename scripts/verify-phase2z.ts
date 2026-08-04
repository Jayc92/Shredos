// ============================================================
// ShredOS — Phase 2Z deterministic verification harness
// Exercises the pure nutrition-trend helpers in
// src/lib/nutrition-trends.ts. Deterministic: fixed literal fixtures,
// no Date.now(), no I/O.
// Run from the repository root:
//   npx tsx scripts/verify-phase2z.ts
// ============================================================

import {
  buildDailyNutritionTotals,
  buildNutritionTrendSummary,
  averageAcrossLoggedDays,
  describeCalorieComparison,
  describeProteinComparison,
  describeLoggingComparison,
  MIN_LOGGED_DAYS_FOR_AVERAGE,
} from '../src/lib/nutrition-trends'
import type { RawFoodLogLike } from '../src/lib/nutrition-trends'

let passed = 0
let failed = 0

function check(name: string, condition: boolean, detail?: string) {
  if (condition) {
    passed++
    console.log(`  PASS  ${name}`)
  } else {
    failed++
    console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

function log(
  logged_date: string,
  calories: number | null,
  protein_g: number | null = null,
  carbs_g: number | null = null,
  fat_g: number | null = null
): RawFoodLogLike {
  return { logged_date, calories, protein_g, carbs_g, fat_g }
}

// ── 1–6. Daily grouping ──────────────────────────────────────────────
console.log('\n1. Daily grouping')
{
  const input = [
    log('2026-08-04', 600, 40),
    log('2026-08-04', 800, 50, 60, 20),   // same-day meals are summed
    log('2026-08-02', 1900, 120),
    log('2026-08-03', 0, 0, 0, 0),        // all-zero placeholder → no logged day
    log('2026-08-01', null, null, null, null), // empty entry → no logged day
    log('2026-07-31', -500, Number.NaN),  // invalid values → no logged day
  ]
  const snapshot = JSON.stringify(input)
  const totals = buildDailyNutritionTotals(input)

  check('grouped by local date', totals.length === 2)
  check('multiple entries on one day are summed (never averaged)',
    totals[1].calories === 1400 && totals[1].proteinGrams === 90 && totals[1].entryCount === 2)
  check('input array is not mutated', JSON.stringify(input) === snapshot)
  check('negative/NaN-only entries excluded', !totals.some((d) => d.date === '2026-07-31'))
  check('all-zero placeholder does not create a logged day',
    !totals.some((d) => d.date === '2026-08-03'))
  check('empty entry does not create a logged day',
    !totals.some((d) => d.date === '2026-08-01'))
  check('chronological sorting (oldest → newest)',
    totals.map((d) => d.date).join(',') === '2026-08-02,2026-08-04')
  check('same-day multiple meals count as ONE logged day',
    totals.filter((d) => d.date === '2026-08-04').length === 1)
}

// ── 7–8. Window boundaries ───────────────────────────────────────────
console.log('\n2. Seven-day window boundaries')
{
  // Latest logged date 2026-08-04 → current 07-29..08-04, prior 07-22..07-28.
  const trend = buildNutritionTrendSummary([
    log('2026-08-04', 2000, 120),
    log('2026-07-29', 1800, 110), // first day INSIDE current window
    log('2026-07-28', 2200, 100), // last day of prior window
    log('2026-07-22', 2400, 90),  // first day of prior window
    log('2026-07-21', 9000, 999), // OUTSIDE both windows
  ], null)
  check('current window boundary (7 days ending on latest logged date)',
    trend.currentWindowStart === '2026-07-29' && trend.currentWindowEnd === '2026-08-04' &&
    trend.currentLoggedDays === 2)
  check('prior window boundary (the 7 days immediately preceding)',
    trend.priorLoggedDays === 2)
  check('out-of-window day affects neither window',
    trend.currentAverageCalories === 1900 && trend.priorAverageCalories === 2300)
}

// ── 9–13. Coverage and averages ──────────────────────────────────────
console.log('\n3. Coverage and averages')
{
  // Sparse: 4 logged days out of 7 — average divides by 4, never 7.
  const trend = buildNutritionTrendSummary([
    log('2026-08-04', 1800, 100),
    log('2026-08-03', 2000, 120),
    log('2026-08-01', 2100, 130),
    log('2026-07-30', 1900, 110),
  ], null)
  check('sparse logged-day coverage counts logged days only',
    trend.currentLoggedDays === 4)
  check('missing days are NOT treated as zero-calorie days (divide by 4, not 7)',
    trend.currentAverageCalories === 1950)
  check('average protein divides by logged eligible days only',
    trend.currentAverageProteinGrams === 115)
  check('contributing-day count exposed for "Based on N logged days"',
    trend.currentCalorieDays === 4 && trend.currentProteinDays === 4)

  const oneDay = buildNutritionTrendSummary([log('2026-08-04', 1800, 100)], null)
  check('fewer than two logged days → no averages',
    oneDay.currentAverageCalories === null && oneDay.currentAverageProteinGrams === null)
  check('one-day state still exposes that day\'s totals',
    oneDay.latestDayTotal !== null && oneDay.latestDayTotal.calories === 1800)
  check('one-day state produces a single chart point (page shows empty message)',
    oneDay.calorieChartPoints.length === 1)
  check(`MIN_LOGGED_DAYS_FOR_AVERAGE is ${MIN_LOGGED_DAYS_FOR_AVERAGE}`,
    MIN_LOGGED_DAYS_FOR_AVERAGE === 2)
}

// ── 14–16. Comparisons ───────────────────────────────────────────────
console.log('\n4. Comparison labels')
{
  check('calories up',
    describeCalorieComparison(2070, 1950) === 'Average calories were up 120 versus the prior 7 days')
  check('calories down',
    describeCalorieComparison(1865, 1950) === 'Average calories were down 85 versus the prior 7 days')
  check('calories unchanged',
    describeCalorieComparison(1950.2, 1950.4) === 'Average calories were unchanged versus the prior 7 days')
  check('protein up',
    describeProteinComparison(130, 118) === 'Average protein was up 12g versus the prior 7 days')
  check('protein down',
    describeProteinComparison(110, 118) === 'Average protein was down 8g versus the prior 7 days')
  check('protein unchanged',
    describeProteinComparison(118, 118) === 'Average protein was unchanged versus the prior 7 days')
  check('logging increased (plural)',
    describeLoggingComparison(5, 3) === 'Logging increased by 2 days versus the prior 7 days')
  check('logging decreased (singular day)',
    describeLoggingComparison(4, 5) === 'Logging decreased by 1 day versus the prior 7 days')
  check('logging unchanged',
    describeLoggingComparison(4, 4) === 'Logging coverage was unchanged versus the prior 7 days')

  // Gate: both windows need >= 2 logged days before ANY comparison.
  const gated = buildNutritionTrendSummary([
    log('2026-08-04', 2000, 120),
    log('2026-08-03', 1900, 110),
    log('2026-07-28', 2100, 100), // only ONE prior-window day
  ], null)
  check('insufficient prior window → all comparison labels null',
    gated.calorieComparisonLabel === null &&
    gated.proteinComparisonLabel === null &&
    gated.loggingComparisonLabel === null)
}

// ── 17. Protein-target adherence ─────────────────────────────────────
console.log('\n5. Protein-target adherence')
{
  const rows = [
    log('2026-08-04', 2000, 150), // met (>= 140)
    log('2026-08-03', 1900, 140), // met (exactly at target)
    log('2026-08-02', 1800, 120), // missed
    log('2026-08-01', 1700, null, 200), // logged via carbs, no protein data
  ]
  const withTarget = buildNutritionTrendSummary(rows, 140)
  check('met days count days at or above the FULL target',
    withTarget.proteinTargetMetDays === 2)
  check('eligible days = logged days WITH protein data (missing days are not misses)',
    withTarget.proteinTargetEligibleDays === 3)

  const noTarget = buildNutritionTrendSummary(rows, null)
  check('missing target → adherence omitted', noTarget.proteinTargetMetDays === null &&
    noTarget.proteinTargetEligibleDays === null)
  const zeroTarget = buildNutritionTrendSummary(rows, 0)
  check('non-positive target treated as no target', zeroTarget.proteinTargetMetDays === null)

  const noProteinData = buildNutritionTrendSummary([
    log('2026-08-04', 2000),
    log('2026-08-03', 1900),
  ], 140)
  check('no protein data at all → adherence omitted (never "0 of 0")',
    noProteinData.proteinTargetMetDays === null &&
    noProteinData.proteinTargetEligibleDays === null)

  // Stale-state fix (browser QA): rebuilding the summary with a new
  // target over the SAME logs must recompute adherence — and only
  // adherence — with no input mutation. This is exactly what the
  // /nutrition page does when a saved override updates target state.
  const staleFixLogs = [
    log('2026-08-04', 2000, 95),
    log('2026-08-03', 1900, 80),
    log('2026-08-02', 1800, 70),
  ]
  const logsSnapshot = JSON.stringify(staleFixLogs)
  const at200 = buildNutritionTrendSummary(staleFixLogs, 200)
  const at90 = buildNutritionTrendSummary(staleFixLogs, 90)
  check('target 200g over 3 logged days → 0 of 3 met',
    at200.proteinTargetMetDays === 0 && at200.proteinTargetEligibleDays === 3)
  check('same logs, target changed to 90g → 1 of 3 met',
    at90.proteinTargetMetDays === 1 && at90.proteinTargetEligibleDays === 3)
  check('target change does not mutate the food logs',
    JSON.stringify(staleFixLogs) === logsSnapshot)
  check('target change leaves averages and chart points unchanged',
    at200.currentAverageCalories === at90.currentAverageCalories &&
    at200.currentAverageProteinGrams === at90.currentAverageProteinGrams &&
    JSON.stringify(at200.calorieChartPoints) === JSON.stringify(at90.calorieChartPoints) &&
    JSON.stringify(at200.proteinChartPoints) === JSON.stringify(at90.proteinChartPoints))
}

// ── 18–21. Chart windows ─────────────────────────────────────────────
console.log('\n6. 28-day chart window')
{
  const trend = buildNutritionTrendSummary([
    log('2026-08-04', 2000, 120),
    log('2026-07-08', 2100, 110), // exactly 27 days before latest → IN window
    log('2026-07-07', 2200, 100), // 28 days before latest → OUT of window
  ], null)
  check('chart window includes day latest-27',
    trend.calorieChartPoints.some((p) => p.date === '2026-07-08'))
  check('old entries excluded from chart (latest-28 and older)',
    !trend.calorieChartPoints.some((p) => p.date === '2026-07-07'))
  check('old entries still count toward total logged days',
    trend.totalLoggedDays === 3)
  check('chart points oldest → newest',
    trend.calorieChartPoints.map((p) => p.date).join(',') === '2026-07-08,2026-08-04')
  check('no fake points for missing dates (2 logged days → 2 points)',
    trend.calorieChartPoints.length === 2 && trend.proteinChartPoints.length === 2)
  check('calorie displayValue formatted', trend.calorieChartPoints[0].displayValue === '2,100 cal')
  check('protein displayValue formatted', trend.proteinChartPoints[0].displayValue === '110g')
}

// ── 22, 28, 29. Partial-field data ───────────────────────────────────
console.log('\n7. Partial-field data')
{
  const caloriesOnly = buildNutritionTrendSummary([
    log('2026-08-04', 2000),
    log('2026-08-03', 1800),
  ], 140)
  check('calories but no protein → calorie average without fake 0g protein',
    caloriesOnly.currentAverageCalories === 1900 &&
    caloriesOnly.currentAverageProteinGrams === null &&
    caloriesOnly.proteinChartPoints.length === 0)

  const proteinOnly = buildNutritionTrendSummary([
    log('2026-08-04', null, 120),
    log('2026-08-03', null, 110),
  ], 100)
  check('protein but no calories → protein average without fake 0-calorie average',
    proteinOnly.currentAverageProteinGrams === 115 &&
    proteinOnly.currentAverageCalories === null &&
    proteinOnly.calorieChartPoints.length === 0)
  check('protein-only days still fully eligible for adherence',
    proteinOnly.proteinTargetMetDays === 2 && proteinOnly.proteinTargetEligibleDays === 2)

  const full = buildNutritionTrendSummary([
    log('2026-08-04', 2000, 120),
    log('2026-08-03', 1800, 110),
  ], null)
  check('no zero/NaN/Infinity anywhere in output',
    !JSON.stringify(full).includes('NaN') &&
    !JSON.stringify(full).includes('Infinity') &&
    [full.currentAverageCalories, full.currentAverageProteinGrams,
     ...full.calorieChartPoints.map((p) => p.value),
     ...full.proteinChartPoints.map((p) => p.value)]
      .every((v) => v === null || (Number.isFinite(v) && v > 0)))
}

// ── 23–26. States and labels ─────────────────────────────────────────
console.log('\n8. States and labels')
{
  const empty = buildNutritionTrendSummary([], 140)
  check('no-data state: everything null/empty, no fake zeros',
    empty.latestLoggedDate === null &&
    empty.currentLoggedDays === 0 &&
    empty.currentAverageCalories === null &&
    empty.proteinTargetMetDays === null &&
    empty.calorieChartPoints.length === 0 &&
    empty.currentWindowLabel === null)

  const trend = buildNutritionTrendSummary([
    log('2026-08-04', 2000, 120),
    log('2026-07-29', 1800, 100),
  ], null)
  check('local date labels do not shift (parseISO local, no UTC drift)',
    trend.calorieChartPoints[0].dateLabel === 'Jul 29' &&
    trend.calorieChartPoints[1].dateLabel === 'Aug 4')
  check('current-window date-range label', trend.currentWindowLabel === 'Jul 29–Aug 4')
}

// ── 27. Progress compact-summary behavior ────────────────────────────
console.log('\n9. Progress compact summary')
{
  // The /progress card renders directly from the same summary object:
  // coverage line always; averages/adherence/comparison only when
  // non-null; the two-day message when totalLoggedDays < 2.
  const oneDay = buildNutritionTrendSummary([log('2026-08-04', 1800, 100)], 140)
  // Both cards gate averages/adherence/comparisons behind
  // totalLoggedDays >= MIN_LOGGED_DAYS_FOR_AVERAGE, so the one-day
  // state renders only coverage + the two-day message. The summary
  // itself still reports adherence honestly (0 met of 1 eligible).
  check('compact card one-day state: coverage 1 of 7, no averages, UI gate engaged',
    oneDay.currentLoggedDays === 1 &&
    oneDay.totalLoggedDays < MIN_LOGGED_DAYS_FOR_AVERAGE &&
    oneDay.currentAverageCalories === null &&
    oneDay.proteinTargetMetDays === 0 &&
    oneDay.proteinTargetEligibleDays === 1)

  const comparable = buildNutritionTrendSummary([
    log('2026-08-04', 2070, 130),
    log('2026-08-03', 2070, 130),
    log('2026-07-28', 1950, 118),
    log('2026-07-27', 1950, 118),
  ], 120)
  check('compact card full state: coverage, averages, adherence, comparison all present',
    comparable.currentLoggedDays === 2 &&
    comparable.currentAverageCalories === 2070 &&
    comparable.currentAverageProteinGrams === 130 &&
    comparable.proteinTargetMetDays === 2 &&
    comparable.calorieComparisonLabel === 'Average calories were up 120 versus the prior 7 days' &&
    comparable.loggingComparisonLabel === 'Logging coverage was unchanged versus the prior 7 days')
}

// ── averageAcrossLoggedDays direct edge ──────────────────────────────
console.log('\n10. Average helper edges')
{
  const days = buildDailyNutritionTotals([
    log('2026-08-04', 2000, 120),
    log('2026-08-03', null, 110),
    log('2026-08-02', 1800, null),
  ])
  const cal = averageAcrossLoggedDays(days, 'calories')
  const pro = averageAcrossLoggedDays(days, 'proteinGrams')
  check('field averages count only days carrying that field',
    cal.count === 2 && cal.average === 1900 && pro.count === 2 && pro.average === 115)
}

// ── Result ───────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) {
  process.exit(1)
}
