// ============================================================
// ShredOS — Phase 2X deterministic verification harness
// Exercises the pure overview builders in src/lib/progress-overview.ts:
//   - one normalized row per exercise (no duplicates, even for a
//     same-exercise-added-twice session)
//   - tracking-mode latest summaries and missing-field omission
//   - no "+0 lbs" ever
//   - status assignment from the existing comparisons
//   - one-session needs-data state
//   - status sort order + recency/name secondary sort
//   - filter behavior and invalid-filter fallback
//   - empty states
//   - recent-session-count cap
//
// Deterministic: fixed literal fixtures, no Date.now(), no I/O.
// Run from the repository root:
//   npx tsx scripts/verify-phase2x.ts
// ============================================================

import {
  buildExerciseProgressOverview,
  sortOverviewRows,
  filterOverviewRows,
  parseTrackingModeFilter,
  RECENT_SESSION_COUNT_CAP,
} from '../src/lib/progress-overview'
import type { RawOverviewSession, RawOverviewSet } from '../src/lib/progress-overview'
import type { TrackingMode, PrimaryMuscle, ExerciseEquipment } from '../src/types/database'

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

function set(partial: Partial<RawOverviewSet>): RawOverviewSet {
  return {
    set_number: 1,
    reps: null,
    weight_kg: null,
    rpe: null,
    is_warmup: false,
    completed: true,
    duration_seconds: null,
    distance_meters: null,
    ...partial,
  }
}

function exercise(
  id: string,
  name: string,
  trackingMode: TrackingMode,
  primaryMuscle: PrimaryMuscle | null = 'chest',
  equipment: ExerciseEquipment | null = 'barbell'
) {
  return { id, name, primary_muscle: primaryMuscle, equipment, tracking_mode: trackingMode, unilateral: false }
}

function session(
  workoutDate: string,
  blocks: Array<{ exerciseId: string; ex: ReturnType<typeof exercise>; sets: RawOverviewSet[] }>
): RawOverviewSession {
  return {
    workout_date: workoutDate,
    workout_exercises: blocks.map((b) => ({
      exercise_id: b.exerciseId,
      exercise: b.ex,
      workout_sets: b.sets,
    })),
  }
}

const KG_135_LBS = 61.235
const KG_140_LBS = 63.503
const KG_25_LBS = 11.34
const MILE_METERS = 1609.34

// ── 1. One normalized row per exercise ───────────────────────────────
console.log('\n1. One row per exercise')
{
  const bench = exercise('ex-bench', 'Bench Press', 'weight_reps')
  const sessions: RawOverviewSession[] = [
    // Same exercise added TWICE within one session → still one "session".
    session('2026-08-04', [
      { exerciseId: 'ex-bench', ex: bench, sets: [set({ reps: 8, weight_kg: KG_135_LBS })] },
      { exerciseId: 'ex-bench', ex: bench, sets: [set({ reps: 5, weight_kg: KG_140_LBS })] },
    ]),
    session('2026-07-29', [
      { exerciseId: 'ex-bench', ex: bench, sets: [set({ reps: 8, weight_kg: KG_135_LBS })] },
    ]),
  ]
  const rows = buildExerciseProgressOverview(sessions)
  check('exercise seen in 2 sessions (once duplicated) yields exactly 1 row', rows.length === 1)
  check('duplicate-in-session still counts as one session', rows[0].recentSessionCount === 2)
  check('latest date comes from the newest session', rows[0].latestWorkoutDate === '2026-08-04')

  const empty = buildExerciseProgressOverview([])
  check('no sessions → empty overview (page shows empty state)', empty.length === 0)

  const noQualifying = buildExerciseProgressOverview([
    session('2026-08-04', [
      { exerciseId: 'ex-bench', ex: bench, sets: [set({ reps: 8, weight_kg: KG_135_LBS, is_warmup: true })] },
    ]),
  ])
  check('warm-up-only session tracks no exercise', noQualifying.length === 0)
}

// ── 2. Tracking-mode summaries + missing-field omission ─────────────
console.log('\n2. Latest summaries')
{
  const rows = buildExerciseProgressOverview([
    session('2026-08-04', [
      {
        exerciseId: 'ex-wr',
        ex: exercise('ex-wr', 'Bench Press', 'weight_reps'),
        sets: [set({ reps: 12, weight_kg: 51.256 })], // 113 lbs
      },
      {
        exerciseId: 'ex-bw',
        ex: exercise('ex-bw', 'Pull-up', 'bodyweight', 'back', 'bodyweight'),
        sets: [set({ reps: 12, weight_kg: KG_25_LBS })],
      },
      {
        exerciseId: 'ex-cardio',
        ex: exercise('ex-cardio', 'Run', 'cardio', 'full_body', null),
        sets: [set({ duration_seconds: 1953, distance_meters: 3.1 * MILE_METERS })],
      },
      {
        exerciseId: 'ex-timed',
        ex: exercise('ex-timed', 'Plank', 'timed', 'core', null),
        sets: [set({ duration_seconds: 400, rpe: 9 })],
      },
      {
        exerciseId: 'ex-cardio2',
        ex: exercise('ex-cardio2', 'Rower', 'cardio', 'full_body', 'machine'),
        sets: [set({ duration_seconds: 1200 })], // duration-only cardio
      },
    ]),
  ])
  const byId = Object.fromEntries(rows.map((r) => [r.exerciseId, r]))

  check('weight_reps summary', byId['ex-wr'].latestSummary === '12 reps × 113 lbs')
  check('weight_reps est. 1RM secondary context',
    byId['ex-wr'].secondarySummary === 'est. 1RM 158 lbs')
  check('bodyweight summary with added weight',
    byId['ex-bw'].latestSummary === '12 reps · +25 lbs')
  check('cardio summary with duration, distance, and pace',
    byId['ex-cardio'].latestSummary === '32:33 · 3.10 mi · 10:30 /mi')
  check('timed summary with RPE', byId['ex-timed'].latestSummary === '6:40 · RPE 9')
  check('duration-only cardio omits distance/pace cleanly (no separators)',
    byId['ex-cardio2'].latestSummary === '20:00')
  check('non-weight_reps rows carry no est. 1RM secondary',
    byId['ex-bw'].secondarySummary === null &&
    byId['ex-cardio'].secondarySummary === null &&
    byId['ex-timed'].secondarySummary === null)
}

// ── 3. No 0 lbs ──────────────────────────────────────────────────────
console.log('\n3. No 0 lbs')
{
  const rows = buildExerciseProgressOverview([
    session('2026-08-04', [
      {
        exerciseId: 'ex-bw',
        ex: exercise('ex-bw', 'Pull-up', 'bodyweight', 'back', 'bodyweight'),
        sets: [set({ reps: 12, weight_kg: 0.1 })], // rounds to 0 lbs
      },
    ]),
  ])
  check('bodyweight added weight rounding to 0 lbs is omitted, not shown',
    rows[0].latestSummary === '12 reps')
  check('no "0 lbs" anywhere in any summary',
    !rows.some((r) => /(^|[^0-9])0 lbs/.test(r.latestSummary)))
}

// ── 4. Status assignment ─────────────────────────────────────────────
console.log('\n4. Status assignment')
{
  const wr = exercise('ex-wr', 'Bench Press', 'weight_reps')
  const bw = exercise('ex-bw', 'Pull-up', 'bodyweight', 'back', 'bodyweight')
  const run = exercise('ex-run', 'Run', 'cardio', 'full_body', null)
  const plank = exercise('ex-plank', 'Plank', 'timed', 'core', null)

  const rows = buildExerciseProgressOverview([
    session('2026-08-04', [
      { exerciseId: 'ex-wr', ex: wr, sets: [set({ reps: 8, weight_kg: KG_140_LBS })] },
      { exerciseId: 'ex-bw', ex: bw, sets: [set({ reps: 14 })] },
      // 10:30/mi pace, previously 10:00/mi → slower → declined
      { exerciseId: 'ex-run', ex: run, sets: [set({ duration_seconds: 1953, distance_meters: 3.1 * MILE_METERS })] },
      // 301s vs 300s → within ±1% → same
      { exerciseId: 'ex-plank', ex: plank, sets: [set({ duration_seconds: 301 })] },
    ]),
    session('2026-07-29', [
      { exerciseId: 'ex-wr', ex: wr, sets: [set({ reps: 8, weight_kg: KG_135_LBS })] },
      { exerciseId: 'ex-bw', ex: bw, sets: [set({ reps: 12 })] },
      { exerciseId: 'ex-run', ex: run, sets: [set({ duration_seconds: 1860, distance_meters: 3.1 * MILE_METERS })] },
      { exerciseId: 'ex-plank', ex: plank, sets: [set({ duration_seconds: 300 })] },
    ]),
  ])
  const byId = Object.fromEntries(rows.map((r) => [r.exerciseId, r]))

  check('weight_reps heavier same-reps latest → improved', byId['ex-wr'].status === 'improved')
  check('bodyweight more reps latest → improved', byId['ex-bw'].status === 'improved')
  check('cardio slower pace latest → declined', byId['ex-run'].status === 'declined')
  check('timed within ±1% → same', byId['ex-plank'].status === 'same')
}

// ── 5. One-session needs-data state ──────────────────────────────────
console.log('\n5. Needs more data')
{
  const rows = buildExerciseProgressOverview([
    session('2026-08-04', [
      {
        exerciseId: 'ex-new',
        ex: exercise('ex-new', 'Front Squat', 'weight_reps', 'quads'),
        sets: [set({ reps: 5, weight_kg: KG_135_LBS })],
      },
    ]),
  ])
  check('exactly one qualifying session → needs_data', rows[0].status === 'needs_data')
  check('one-session count reads 1', rows[0].recentSessionCount === 1)
}

// ── 6. Sort order ────────────────────────────────────────────────────
console.log('\n6. Sorting')
{
  const mk = (
    id: string, name: string, status: 'improved' | 'same' | 'declined' | 'needs_data', date: string
  ) => ({
    exerciseId: id, exerciseName: name, trackingMode: 'weight_reps' as TrackingMode,
    primaryMuscle: null, equipment: null, isUnilateral: false,
    latestWorkoutDate: date, recentSessionCount: 2,
    latestSummary: 'x', secondarySummary: null, status,
  })
  const sorted = sortOverviewRows([
    mk('a', 'Alpha', 'needs_data', '2026-08-04'),
    mk('b', 'Bravo', 'declined', '2026-08-04'),
    mk('c', 'Charlie', 'improved', '2026-07-01'),
    mk('d', 'Delta', 'same', '2026-08-04'),
    mk('e', 'Echo', 'improved', '2026-08-04'),
    mk('f', 'Foxtrot', 'improved', '2026-08-04'),
  ])
  check('status groups order: improving → steady → declining → needs data',
    sorted.map((r) => r.status).join(',') ===
    'improved,improved,improved,same,declined,needs_data')
  check('within a group, most recent session first',
    sorted[0].latestWorkoutDate === '2026-08-04' && sorted[2].exerciseId === 'c')
  check('date ties fall back to name alphabetically',
    sorted[0].exerciseName === 'Echo' && sorted[1].exerciseName === 'Foxtrot')
}

// ── 7. Filters ───────────────────────────────────────────────────────
console.log('\n7. Filters')
{
  const rows = buildExerciseProgressOverview([
    session('2026-08-04', [
      { exerciseId: 'ex-wr', ex: exercise('ex-wr', 'Bench', 'weight_reps'), sets: [set({ reps: 8, weight_kg: KG_135_LBS })] },
      { exerciseId: 'ex-run', ex: exercise('ex-run', 'Run', 'cardio', 'full_body', null), sets: [set({ duration_seconds: 1200 })] },
    ]),
  ])
  check('mode filter keeps only matching rows',
    filterOverviewRows(rows, 'cardio').length === 1 &&
    filterOverviewRows(rows, 'cardio')[0].exerciseId === 'ex-run')
  check('null filter (All) keeps every row', filterOverviewRows(rows, null).length === 2)
  check('filter with no matches → empty list (page shows filter empty state)',
    filterOverviewRows(rows, 'timed').length === 0)

  check('valid param parses', parseTrackingModeFilter('cardio') === 'cardio')
  check('invalid param falls back to All', parseTrackingModeFilter('nonsense') === null)
  check('missing param falls back to All', parseTrackingModeFilter(undefined) === null)
  check('array param uses first value', parseTrackingModeFilter(['timed', 'cardio']) === 'timed')
  check('raw enum-ish junk falls back to All', parseTrackingModeFilter('full_body') === null)
}

// ── 8. Recent-session-count cap ──────────────────────────────────────
console.log('\n8. Session-count cap')
{
  const bench = exercise('ex-bench', 'Bench Press', 'weight_reps')
  const dates = ['2026-08-04', '2026-08-01', '2026-07-28', '2026-07-25', '2026-07-22', '2026-07-19', '2026-07-16']
  const rows = buildExerciseProgressOverview(
    dates.map((d) => session(d, [
      { exerciseId: 'ex-bench', ex: bench, sets: [set({ reps: 8, weight_kg: KG_135_LBS })] },
    ]))
  )
  check(`7 sessions display as the capped "recent" count (${RECENT_SESSION_COUNT_CAP})`,
    rows[0].recentSessionCount === RECENT_SESSION_COUNT_CAP)
}

// ── Result ───────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) {
  process.exit(1)
}
