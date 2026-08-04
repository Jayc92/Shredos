// ============================================================
// ShredOS — Phase 2W deterministic verification harness
// Exercises the pure chart adapters in src/lib/progress-charts.ts:
//   - chronological ordering (and no input mutation)
//   - metric selection rules per tracking mode
//   - invalid-data filtering (null / zero / negative values)
//   - literal first-to-latest difference summaries
//   - pace direction (lower = faster) and M:SS /mi formatting
//
// Deterministic: fixed literal fixtures, no Date.now(), no I/O.
// Run from the repository root:
//   npx tsx scripts/verify-phase2w.ts
// Exits non-zero on the first failure summary at the end.
// ============================================================

import {
  buildWeightRepsTrend,
  buildBodyweightTrends,
  buildCardioTrends,
  buildTimedTrend,
  summarizeWeightTrend,
  summarizeRepsTrend,
  summarizePaceTrend,
  summarizeDurationTrend,
  summarizeDistanceTrend,
  EMPTY_TREND_MESSAGE,
} from '../src/lib/progress-charts'
import type { ExerciseHistoryEntry } from '../src/lib/workout'

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

function entry(partial: Partial<ExerciseHistoryEntry> & { workoutDate: string }): ExerciseHistoryEntry {
  return {
    weightKg: null,
    reps: null,
    rpe: null,
    estimated1RmKg: null,
    durationSeconds: null,
    distanceMeters: null,
    ...partial,
  }
}

const LBS_PER_KG = 2.20462

// ── 1. Chronological ordering + no mutation ─────────────────────────
console.log('\n1. Chronological ordering')
{
  // Newest-first input, exactly as fetchExerciseHistory returns it.
  const newestFirst = [
    entry({ workoutDate: '2026-08-04', weightKg: 100, reps: 5, estimated1RmKg: 116.7 }),
    entry({ workoutDate: '2026-07-31', weightKg: 97.5, reps: 5, estimated1RmKg: 113.8 }),
    entry({ workoutDate: '2026-07-29', weightKg: 95, reps: 5, estimated1RmKg: 110.8 }),
  ]
  const inputSnapshot = JSON.stringify(newestFirst)
  const trend = buildWeightRepsTrend(newestFirst)

  check('points render oldest → newest',
    trend !== null &&
    trend.points.map((p) => p.date).join(',') === '2026-07-29,2026-07-31,2026-08-04')
  check('original newest-first array is not mutated',
    JSON.stringify(newestFirst) === inputSnapshot)
  check('concise date labels use the MMM d convention',
    trend !== null && trend.points[0].dateLabel === 'Jul 29' &&
    trend.points[2].dateLabel === 'Aug 4')
}

// ── 2. Metric selection ──────────────────────────────────────────────
console.log('\n2. Metric selection')
{
  const with1Rm = [
    entry({ workoutDate: '2026-08-04', weightKg: 100, reps: 5, estimated1RmKg: 116.7 }),
    entry({ workoutDate: '2026-07-29', weightKg: 95, reps: 5, estimated1RmKg: 110.8 }),
  ]
  check('weight_reps: ≥2 valid 1RM points → Estimated 1RM',
    buildWeightRepsTrend(with1Rm)?.title === 'Estimated 1RM')

  // 1-rep sets: epley1RM returns null (that IS the 1RM) — only one
  // 1RM point exists, but two weight points do → weight fallback.
  const weightOnly = [
    entry({ workoutDate: '2026-08-04', weightKg: 120, reps: 1, estimated1RmKg: null }),
    entry({ workoutDate: '2026-07-29', weightKg: 110, reps: 5, estimated1RmKg: 128.3 }),
  ]
  check('weight_reps: <2 1RM but ≥2 weight points → Best working weight',
    buildWeightRepsTrend(weightOnly)?.title === 'Best working weight')

  check('weight_reps: <2 of everything → null (empty state)',
    buildWeightRepsTrend([entry({ workoutDate: '2026-08-04', weightKg: 100, reps: 5, estimated1RmKg: 116.7 })]) === null)

  const cardioWithPace = [
    entry({ workoutDate: '2026-08-04', durationSeconds: 1800, distanceMeters: 4828.02 }),
    entry({ workoutDate: '2026-07-29', durationSeconds: 1900, distanceMeters: 4828.02 }),
  ]
  const paceTrends = buildCardioTrends(cardioWithPace)
  check('cardio: ≥2 pace points → Pace primary', paceTrends.primary?.title === 'Pace')
  check('cardio: pace primary carries the lower-is-faster footnote',
    paceTrends.primary?.footnote === 'Lower is faster')
  check('cardio: distance rides along as secondary chart',
    paceTrends.secondary?.title === 'Distance')

  const cardioDurationOnly = [
    entry({ workoutDate: '2026-08-04', durationSeconds: 1815 }),
    entry({ workoutDate: '2026-07-31', durationSeconds: 1800, distanceMeters: 4828.02 }),
    entry({ workoutDate: '2026-07-29', durationSeconds: 1700 }),
  ]
  const durationTrends = buildCardioTrends(cardioDurationOnly)
  check('cardio: 1 pace point but ≥2 durations → Duration primary',
    durationTrends.primary?.title === 'Duration')
  check('cardio: <2 distance points → no secondary chart',
    durationTrends.secondary === null)

  check('cardio: <2 of everything → null primary',
    buildCardioTrends([entry({ workoutDate: '2026-08-04', durationSeconds: 1800 })]).primary === null)

  const bw = buildBodyweightTrends([
    entry({ workoutDate: '2026-08-04', reps: 12, weightKg: 11.34 }),
    entry({ workoutDate: '2026-07-31', reps: 11 }),
    entry({ workoutDate: '2026-07-29', reps: 10, weightKg: 11.34 }),
  ])
  check('bodyweight: reps chart selected', bw.reps?.title === 'Reps')
  check('bodyweight: ≥2 positive added-weight entries → separate added-weight chart',
    bw.addedWeight?.title === 'Added weight' && bw.addedWeight.points.length === 2)

  const bwNoAdded = buildBodyweightTrends([
    entry({ workoutDate: '2026-08-04', reps: 12, weightKg: 11.34 }),
    entry({ workoutDate: '2026-07-29', reps: 10 }),
  ])
  check('bodyweight: <2 added-weight entries → no added-weight chart',
    bwNoAdded.addedWeight === null)

  const timed = buildTimedTrend([
    entry({ workoutDate: '2026-08-04', durationSeconds: 135, rpe: 7 }),
    entry({ workoutDate: '2026-07-29', durationSeconds: 120 }),
  ])
  check('timed: duration chart with RPE as tooltip-only secondary label',
    timed?.title === 'Duration' &&
    timed.points[1].secondaryLabel === 'RPE 7' &&
    timed.points[0].secondaryLabel === undefined)
}

// ── 3. Invalid-data filtering ────────────────────────────────────────
console.log('\n3. Invalid-data filtering')
{
  const dirty = [
    entry({ workoutDate: '2026-08-04', durationSeconds: 1800, distanceMeters: 4828.02 }),
    entry({ workoutDate: '2026-08-02', durationSeconds: 0, distanceMeters: 1000 }),   // zero duration
    entry({ workoutDate: '2026-08-01', durationSeconds: null, distanceMeters: null }), // nulls
    entry({ workoutDate: '2026-07-31', durationSeconds: -60, distanceMeters: -5 }),    // negatives
    entry({ workoutDate: '2026-07-29', durationSeconds: 1900, distanceMeters: 4828.02 }),
  ]
  const trends = buildCardioTrends(dirty)
  check('cardio: zero/null/negative entries are excluded from pace points',
    trends.primary?.points.length === 2)
  check('cardio: zero-distance entry never produces a pace point (no divide-by-zero)',
    trends.primary!.points.every((p) => Number.isFinite(p.value) && p.value > 0))

  const dirtyStrength = [
    entry({ workoutDate: '2026-08-04', weightKg: 100, reps: 5, estimated1RmKg: 116.7 }),
    entry({ workoutDate: '2026-08-01', weightKg: 0, reps: 0, estimated1RmKg: null }),
    entry({ workoutDate: '2026-07-29', weightKg: 95, reps: 5, estimated1RmKg: 110.8 }),
  ]
  check('weight_reps: zero-weight entry is excluded',
    buildWeightRepsTrend(dirtyStrength)?.points.length === 2)

  const bwZeroAdded = buildBodyweightTrends([
    entry({ workoutDate: '2026-08-04', reps: 12, weightKg: 0.1 }), // rounds to 0 lbs
    entry({ workoutDate: '2026-07-31', reps: 11, weightKg: 0.1 }),
    entry({ workoutDate: '2026-07-29', reps: 10 }),
  ])
  check('bodyweight: added weight rounding to 0 lbs is never charted',
    bwZeroAdded.addedWeight === null)
  check('bodyweight: 0-lb added weight never appears as a tooltip label',
    bwZeroAdded.reps!.points.every((p) => p.secondaryLabel === undefined))
}

// ── 4. First-to-latest difference summaries ──────────────────────────
console.log('\n4. Difference summaries')
{
  check('weight up', summarizeWeightTrend(177, 185, 4) === 'Up 8 lbs across 4 sessions')
  check('weight down', summarizeWeightTrend(185, 177, 3) === 'Down 8 lbs across 3 sessions')
  check('weight same', summarizeWeightTrend(185.2, 185.4, 2) === 'No change across 2 sessions')
  check('reps up', summarizeRepsTrend(8, 12, 5) === 'Up 4 reps across 5 sessions')
  check('reps down', summarizeRepsTrend(12, 9, 2) === 'Down 3 reps across 2 sessions')
  check('reps same', summarizeRepsTrend(10, 10, 2) === 'No change across 2 sessions')
  check('duration increased',
    summarizeDurationTrend(105, 120, 2) === 'Duration increased by 0:15 across 2 sessions')
  check('duration decreased',
    summarizeDurationTrend(3900, 3600, 4) === 'Duration decreased by 5:00 across 4 sessions')
  check('duration unchanged',
    summarizeDurationTrend(120, 120.3, 2) === 'Duration was unchanged across 2 sessions')
  check('distance increased',
    summarizeDistanceTrend(1609.34, 4988.95, 3) === 'Distance increased by 2.10 mi across 3 sessions')
  check('distance decreased',
    summarizeDistanceTrend(4988.95, 1609.34, 3) === 'Distance decreased by 2.10 mi across 3 sessions')
  check('distance unchanged after display rounding',
    summarizeDistanceTrend(1609.34, 1610.0, 2) === 'Distance was unchanged across 2 sessions')

  // End-to-end: summary uses FIRST vs LATEST chart point, not min/max.
  const trend = buildWeightRepsTrend([
    entry({ workoutDate: '2026-08-04', weightKg: 84.1, reps: 5, estimated1RmKg: 185 / LBS_PER_KG }),
    entry({ workoutDate: '2026-07-31', weightKg: 90, reps: 5, estimated1RmKg: 190 / LBS_PER_KG }), // mid-series max
    entry({ workoutDate: '2026-07-29', weightKg: 80, reps: 5, estimated1RmKg: 177 / LBS_PER_KG }),
  ])
  check('summary is first-vs-latest even when a mid-series point is the max',
    trend?.summary === 'Up 8 lbs across 3 sessions')
}

// ── 5. Pace direction and formatting ─────────────────────────────────
console.log('\n5. Pace direction and formatting')
{
  check('pace improved (lower latest sec/mi = faster)',
    summarizePaceTrend(622, 600, 4) === 'Pace improved by 0:22 /mi across 4 sessions')
  check('pace slowed (higher latest sec/mi)',
    summarizePaceTrend(600, 622, 4) === 'Pace slowed by 0:22 /mi across 4 sessions')
  check('pace steady after display rounding (sub-second drift)',
    summarizePaceTrend(600.2, 600.4, 3) === 'Pace was steady across 3 sessions')
  check('pace difference over an hour uses H:MM:SS',
    summarizePaceTrend(7200, 3540, 2) === 'Pace improved by 1:01:00 /mi across 2 sessions')

  // 30:00 for 3 miles = 10:00 /mi; 28:30 for 3 miles = 9:30 /mi.
  const trends = buildCardioTrends([
    entry({ workoutDate: '2026-08-04', durationSeconds: 1710, distanceMeters: 3 * 1609.34 }),
    entry({ workoutDate: '2026-07-29', durationSeconds: 1800, distanceMeters: 3 * 1609.34 }),
  ])
  check('pace point displayValue is M:SS /mi',
    trends.primary?.points[0].displayValue === '10:00 /mi' &&
    trends.primary?.points[1].displayValue === '9:30 /mi')
  check('pace numeric values plot in seconds-per-mile (600 → 570)',
    Math.round(trends.primary!.points[0].value) === 600 &&
    Math.round(trends.primary!.points[1].value) === 570)
  check('end-to-end pace summary reads improved',
    trends.primary?.summary === 'Pace improved by 0:30 /mi across 2 sessions')
}

// ── Result ───────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) {
  process.exit(1)
}
console.log(`Empty-state copy under test everywhere: "${EMPTY_TREND_MESSAGE}"`)
