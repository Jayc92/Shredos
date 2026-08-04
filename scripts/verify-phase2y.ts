// ============================================================
// ShredOS — Phase 2Y deterministic verification harness
// Exercises the pure body-weight trend helpers in
// src/lib/weight-trends.ts. Deterministic: fixed literal fixtures,
// no Date.now(), no I/O.
// Run from the repository root:
//   npx tsx scripts/verify-phase2y.ts
// ============================================================

import {
  dedupeDailyWeights,
  buildWeightTrendSummary,
  sevenDayWindowBounds,
  averageWeightLbsInWindow,
  describeAverageChange,
  describeGoalDifference,
  MIN_DATES_FOR_AVERAGE,
} from '../src/lib/weight-trends'
import type { RawWeighInLike } from '../src/lib/weight-trends'

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

const KG = (lbs: number) => lbs / 2.20462

function row(logged_date: string, weightLbs: number | null, created_at?: string): RawWeighInLike {
  return {
    logged_date,
    weight_kg: weightLbs === null ? null : KG(weightLbs),
    created_at: created_at ?? `${logged_date}T07:00:00.000Z`,
  }
}

// ── 1–4. Dedup, sorting, mutation, history ───────────────────────────
console.log('\n1. Dedup and ordering')
{
  const input = [
    row('2026-08-04', 185.0),
    row('2026-08-02', 186.4, '2026-08-02T07:00:00.000Z'),
    row('2026-08-02', 186.0, '2026-08-02T21:30:00.000Z'), // later same-day entry
    row('2026-07-30', 187.2),
  ]
  const snapshot = JSON.stringify(input)
  const daily = dedupeDailyWeights(input)

  check('chronological sorting (oldest → newest)',
    daily.map((p) => p.date).join(',') === '2026-07-30,2026-08-02,2026-08-04')
  check('input array is not mutated', JSON.stringify(input) === snapshot)
  check('same-day duplicates: latest created_at wins (never averaged)',
    daily[1].weightLbs === 186.0 && daily[1].recordedAt === '2026-08-02T21:30:00.000Z')
  check('history stays undeduplicated (input still has both same-day records)',
    input.filter((r) => r.logged_date === '2026-08-02').length === 2)
  check('dedup produces one point per date', daily.length === 3)
}

// ── 5–6. Window boundaries ───────────────────────────────────────────
console.log('\n2. Seven-day window boundaries')
{
  const bounds = sevenDayWindowBounds('2026-08-04')
  check('current window is the 7 calendar days ending on the latest date',
    bounds.currentStart === '2026-07-29' && bounds.currentEnd === '2026-08-04')
  check('prior window is the 7 days immediately preceding',
    bounds.priorStart === '2026-07-22' && bounds.priorEnd === '2026-07-28')

  const daily = dedupeDailyWeights([
    row('2026-08-04', 185.0),
    row('2026-07-29', 186.0), // first day INSIDE current window
    row('2026-07-28', 187.0), // last day of prior window
    row('2026-07-22', 188.0), // first day of prior window
    row('2026-07-21', 189.0), // OUTSIDE both windows
  ])
  const current = averageWeightLbsInWindow(daily, bounds.currentStart, bounds.currentEnd)
  const prior = averageWeightLbsInWindow(daily, bounds.priorStart, bounds.priorEnd)
  check('boundary dates land in the correct windows',
    current.count === 2 && prior.count === 2)
  check('current average with sparse weigh-ins (2 of 7 days)',
    current.averageLbs === 185.5)
  check('prior average with sparse weigh-ins (2 of 7 days)',
    prior.averageLbs === 187.5)
}

// ── 7–9. Averages and minimums ───────────────────────────────────────
console.log('\n3. Average requirements')
{
  const oneDate = buildWeightTrendSummary([row('2026-08-04', 185.0)], null)
  check('fewer than two dates → no current average',
    oneDate.currentAverageLbs === null && oneDate.currentAverageCount === 1)
  check('one-date state still reports the latest weight',
    oneDate.latest !== null && oneDate.latest.weightLbs === 185.0)
  check('one-date state produces a single chart point (page shows empty message)',
    oneDate.chartPoints.length === 1)
  check(`MIN_DATES_FOR_AVERAGE is ${MIN_DATES_FOR_AVERAGE}`, MIN_DATES_FOR_AVERAGE === 2)

  // Two same-day records are ONE distinct date — still no average.
  const sameDayOnly = buildWeightTrendSummary([
    row('2026-08-04', 185.0, '2026-08-04T07:00:00.000Z'),
    row('2026-08-04', 184.6, '2026-08-04T21:00:00.000Z'),
  ], null)
  check('two same-day weigh-ins are one distinct date → no average',
    sameDayOnly.currentAverageLbs === null && sameDayOnly.distinctDateCount === 1)

  const noPrior = buildWeightTrendSummary([
    row('2026-08-04', 185.0),
    row('2026-08-01', 186.0),
  ], null)
  check('current window valid but prior window empty → no comparison',
    noPrior.currentAverageLbs === 185.5 &&
    noPrior.priorAverageLbs === null &&
    noPrior.averageChangeLbs === null &&
    noPrior.averageChangeLabel === null)
}

// ── 10. Rounded-average comparison ───────────────────────────────────
console.log('\n4. Average change labels')
{
  check('down', describeAverageChange(184.2, 185.6).label === 'Down 1.4 lbs versus the prior 7 days')
  check('up', describeAverageChange(186.4, 185.6).label === 'Up 0.8 lbs versus the prior 7 days')
  check('equal rounded averages → no meaningful change (display rounding only)',
    describeAverageChange(185.6, 185.6).label === 'No meaningful change versus the prior 7 days')

  // End-to-end: averages emerge from kgToLbs already rounded to 1dp.
  const trend = buildWeightTrendSummary([
    row('2026-08-04', 184.0),
    row('2026-08-02', 184.4),
    row('2026-07-27', 185.8),
    row('2026-07-25', 186.2),
  ], null)
  check('end-to-end change label from windows',
    trend.averageChangeLabel === 'Down 1.8 lbs versus the prior 7 days' &&
    trend.averageChangeLbs === -1.8)
}

// ── 11–13. Latest selection and chart window ─────────────────────────
console.log('\n5. Latest weight and 28-day chart window')
{
  const trend = buildWeightTrendSummary([
    row('2026-08-04', 185.0, '2026-08-04T06:00:00.000Z'),
    row('2026-08-04', 184.8, '2026-08-04T20:00:00.000Z'), // later entry wins
    row('2026-07-08', 190.0), // exactly 27 days before latest → IN chart window
    row('2026-07-07', 191.0), // 28 days before latest → OUT of chart window
  ], null)
  check('latest weight uses the latest same-day record',
    trend.latest !== null && trend.latest.weightLbs === 184.8)
  check('28-day chart window includes day latest-27',
    trend.chartPoints.some((p) => p.date === '2026-07-08'))
  check('28-day chart window excludes day latest-28',
    !trend.chartPoints.some((p) => p.date === '2026-07-07'))
  check('old entries excluded from chart still count toward distinct dates',
    trend.distinctDateCount === 3)
  check('chart points render oldest → newest',
    trend.chartPoints.map((p) => p.date).join(',') === '2026-07-08,2026-08-04')
  check('chart displayValue is one-decimal pounds',
    trend.chartPoints[1].displayValue === '184.8 lbs')
}

// ── 14. Goal difference ──────────────────────────────────────────────
console.log('\n6. Goal-weight context')
{
  check('above goal', describeGoalDifference(198.6, 180.0) === '18.6 lbs above goal')
  check('below goal', describeGoalDifference(175.8, 180.0) === '4.2 lbs below goal')
  check('at goal', describeGoalDifference(180.0, 180.0) === 'At goal')

  const withGoal = buildWeightTrendSummary([row('2026-08-04', 185.2)], KG(180.0))
  check('goal context present when a valid goal exists',
    withGoal.goalWeightLbs === 180.0 && withGoal.goalDifferenceLabel === '5.2 lbs above goal')

  const noGoal = buildWeightTrendSummary([row('2026-08-04', 185.2)], null)
  check('no goal → goal context omitted entirely',
    noGoal.goalWeightLbs === null && noGoal.goalDifferenceLabel === null)

  const invalidGoal = buildWeightTrendSummary([row('2026-08-04', 185.2)], 0)
  check('non-positive goal treated as no goal',
    invalidGoal.goalWeightLbs === null && invalidGoal.goalDifferenceLabel === null)
}

// ── 15–17. Invalid data and degenerate values ────────────────────────
console.log('\n7. Invalid data')
{
  const trend = buildWeightTrendSummary([
    row('2026-08-04', 185.0),
    row('2026-08-03', null), // weight-less row (e.g. waist-only)
    { logged_date: '2026-08-02', weight_kg: 0, created_at: '2026-08-02T07:00:00.000Z' },
    { logged_date: '2026-08-01', weight_kg: -5, created_at: '2026-08-01T07:00:00.000Z' },
    { logged_date: '2026-07-31', weight_kg: Number.NaN, created_at: '2026-07-31T07:00:00.000Z' },
    row('2026-07-30', 186.0),
  ], null)
  check('null/zero/negative/NaN weights are excluded', trend.distinctDateCount === 2)
  check('no NaN/Infinity in any numeric output',
    [trend.currentAverageLbs, trend.averageChangeLbs, ...trend.chartPoints.map((p) => p.value)]
      .every((v) => v === null || Number.isFinite(v)))
  check('no NaN in any label',
    !JSON.stringify(trend).includes('NaN'))

  const identical = buildWeightTrendSummary([
    row('2026-08-04', 185.0),
    row('2026-08-03', 185.0),
    row('2026-08-02', 185.0),
  ], null)
  check('identical weights → finite values and a no-change label (no divide-by-zero)',
    identical.chartPoints.every((p) => Number.isFinite(p.value)) &&
    identical.currentAverageLbs === 185.0)
}

// ── 18. Local-date behavior ──────────────────────────────────────────
console.log('\n8. Local dates')
{
  const trend = buildWeightTrendSummary([row('2026-08-04', 185.0), row('2026-08-01', 186.0)], null)
  check('date-only strings keep their calendar date in labels (no UTC drift)',
    trend.chartPoints[0].dateLabel === 'Aug 1' && trend.chartPoints[1].dateLabel === 'Aug 4')
  check('latest date is the literal logged date', trend.latest!.date === '2026-08-04')
}

// ── 19–20. Empty states ──────────────────────────────────────────────
console.log('\n9. Empty states')
{
  const empty = buildWeightTrendSummary([], null)
  check('no data → null latest, no averages, no chart points, no labels',
    empty.latest === null &&
    empty.distinctDateCount === 0 &&
    empty.currentAverageLbs === null &&
    empty.priorAverageLbs === null &&
    empty.averageChangeLabel === null &&
    empty.chartPoints.length === 0 &&
    empty.goalDifferenceLabel === null)
  check('no fake zeros anywhere in the empty summary',
    empty.currentAverageCount === 0 && !JSON.stringify(empty).includes('"0.0'))
}

// ── Result ───────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) {
  process.exit(1)
}
