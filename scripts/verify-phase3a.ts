// ============================================================
// ShredOS — Phase 3A deterministic verification harness
// Exercises the pure completed-week review helpers in
// src/lib/weekly-review.ts (the Phase 3A additive section — the
// legacy fetchWeeklyReview used by the coach is untouched and not
// under test here). Deterministic: fixed fixtures, no Date.now(),
// no I/O.
// Run from the repository root:
//   npx tsx scripts/verify-phase3a.ts
// ============================================================

import {
  latestCompletedWeekStart,
  resolveReviewWeekStart,
  reviewWeekBounds,
  reviewWeekNavigation,
  formatWeekRangeLabel,
  computeWeeklyWeight,
  computeWeeklyNutrition,
  computeWeeklyTraining,
  computeWeeklyExerciseProgress,
  selectNotableExercises,
  computeWeeklyActivity,
  computeWeeklyFasting,
  computeWeeklyConfidence,
  buildWeeklyFocusItems,
  assembleWeeklyReview,
  WEEKLY_FOCUS_FALLBACK,
  WEEKLY_SUFFICIENT,
} from '../src/lib/weekly-review'
import type { RawWeeklySessionLike } from '../src/lib/weekly-review'
import type { RawOverviewSession, ExerciseProgressOverviewRow } from '../src/lib/progress-overview'
import type { TrackingMode } from '../src/types/database'

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

// Fixed clock: Tuesday 2026-08-04. Latest completed ISO week is
// Mon 2026-07-27 .. Sun 2026-08-02; the prior week is 07-20..07-26.
const TODAY = '2026-08-04'
const WEEK = '2026-07-27'
const KG = (lbs: number) => lbs / 2.20462

const weighIn = (d: string, lbs: number, at = `${d}T07:00:00.000Z`) => ({
  logged_date: d, weight_kg: KG(lbs), created_at: at,
})
const food = (d: string, cal: number | null, pro: number | null = null) => ({
  logged_date: d, calories: cal, protein_g: pro, carbs_g: null, fat_g: null,
})
const bounds = reviewWeekBounds(WEEK)

function session(
  date: string,
  status: string,
  duration: number | null,
  exercises: Array<{
    id: string; name: string; mode: TrackingMode
    sets: Array<{ completed?: boolean; warmup?: boolean; reps?: number | null; kg?: number | null; dur?: number | null }>
  }>
): RawWeeklySessionLike & RawOverviewSession {
  return {
    workout_date: date,
    status,
    completed_duration_seconds: duration,
    workout_exercises: exercises.map((e) => ({
      exercise_id: e.id,
      exercise: { id: e.id, name: e.name, primary_muscle: 'chest', equipment: 'barbell', tracking_mode: e.mode, unilateral: false },
      workout_sets: e.sets.map((s, i) => ({
        set_number: i + 1,
        reps: s.reps ?? null,
        weight_kg: s.kg ?? null,
        rpe: null,
        is_warmup: s.warmup ?? false,
        completed: s.completed ?? true,
        duration_seconds: s.dur ?? null,
        distance_meters: null,
      })),
    })),
  }
}

// ── 1–5, 42–43. Window resolution and navigation ─────────────────────
console.log('\n1. Review window and navigation')
{
  check('latest completed week is the prior ISO Monday',
    latestCompletedWeekStart(TODAY) === '2026-07-27')
  check('review-week boundaries (Mon–Sun)',
    bounds.startDate === '2026-07-27' && bounds.endDate === '2026-08-02')
  check('prior-week boundaries',
    bounds.priorStartDate === '2026-07-20' && bounds.priorEndDate === '2026-07-26')
  check('sunday of an in-progress week is still not a completed week',
    latestCompletedWeekStart('2026-08-09') === '2026-07-27')
  check('valid param snaps any date to its ISO Monday',
    resolveReviewWeekStart(TODAY, '2026-07-22') === '2026-07-20')
  check('invalid week param falls back to latest completed',
    resolveReviewWeekStart(TODAY, 'garbage') === '2026-07-27' &&
    resolveReviewWeekStart(TODAY, undefined) === '2026-07-27' &&
    resolveReviewWeekStart(TODAY, '2026-13-99') === '2026-07-27')
  check('future/incomplete week prevented',
    resolveReviewWeekStart(TODAY, '2026-08-03') === '2026-07-27' &&
    resolveReviewWeekStart(TODAY, '2026-12-25') === '2026-07-27')
  check('local-date label without UTC drift',
    bounds.label === 'Jul 27–Aug 2' &&
    formatWeekRangeLabel('2026-12-28', '2027-01-03') === 'Dec 28, 2026–Jan 3, 2027')

  const nav = reviewWeekNavigation('2026-07-20', TODAY)
  check('navigation generates previous/next week starts',
    nav.previousWeekStart === '2026-07-13' && nav.nextWeekStart === '2026-07-27')
  const latestNav = reviewWeekNavigation('2026-07-27', TODAY)
  check('latest completed week has no next link and isLatest',
    latestNav.nextWeekStart === null && latestNav.isLatest &&
    latestNav.latestWeekStart === '2026-07-27')
}

// ── 6–8. Weight ──────────────────────────────────────────────────────
console.log('\n2. Weekly weight')
{
  const rows = [
    weighIn('2026-08-01', 185.0),
    weighIn('2026-08-01', 184.6, '2026-08-01T21:00:00.000Z'), // later same-day wins
    weighIn('2026-07-28', 185.8),
    weighIn('2026-07-24', 187.0),
    weighIn('2026-07-21', 187.4),
  ]
  const snapshot = JSON.stringify(rows)
  const w = computeWeeklyWeight(rows, bounds)
  check('same-day duplicates deduplicated (latest record wins)',
    w.latestWeightLbs === 184.6 && w.loggedDays === 2)
  check('weekly average over distinct daily weights',
    w.averageWeightLbs === 185.2) // (184.6 + 185.8) / 2
  check('prior weekly average', w.priorAverageWeightLbs === 187.2)
  check('weight comparison down',
    w.comparisonLabel === 'Average weight was down 2.0 lbs versus the prior week')
  check('weight input not mutated', JSON.stringify(rows) === snapshot)

  const up = computeWeeklyWeight([
    weighIn('2026-08-01', 188.0), weighIn('2026-07-28', 188.0),
    weighIn('2026-07-24', 187.3), weighIn('2026-07-21', 187.3),
  ], bounds)
  check('weight comparison up',
    up.comparisonLabel === 'Average weight was up 0.7 lbs versus the prior week')
  const same = computeWeeklyWeight([
    weighIn('2026-08-01', 185.0), weighIn('2026-07-28', 185.2),
    weighIn('2026-07-24', 185.3), weighIn('2026-07-21', 184.9),
  ], bounds)
  check('weight comparison unchanged',
    same.comparisonLabel === 'Average weight was unchanged versus the prior week')
  const insufficient = computeWeeklyWeight([
    weighIn('2026-08-01', 185.0), weighIn('2026-07-28', 185.8), weighIn('2026-07-24', 187.0),
  ], bounds)
  check('insufficient prior weigh-ins → no comparison',
    insufficient.comparisonLabel === null && insufficient.averageWeightLbs !== null)
}

// ── 9–15. Nutrition ──────────────────────────────────────────────────
console.log('\n3. Weekly nutrition')
{
  const rows = [
    food('2026-07-28', 900, 60), food('2026-07-28', 1100, 66), // same-day summed
    food('2026-07-30', 1900, 120),
    food('2026-08-01', 2100, 140),
    food('2026-08-02', 1900, 110),
    // prior week
    food('2026-07-21', 2200, 100), food('2026-07-23', 2000, 100),
  ]
  const n = computeWeeklyNutrition(rows, bounds, 126)
  check('daily aggregation: same-day entries summed into one logged day',
    n.loggedDays === 4)
  check('missing days not treated as zero (average over 4 logged days)',
    n.averageCalories === 1975) // (2000+1900+2100+1900)/4
  check('average protein across eligible days',
    n.averageProteinGrams === 124) // (126+120+140+110)/4
  check('protein-target adherence (>= 126g on 2 of 4)',
    n.proteinTargetMetDays === 2 && n.proteinTargetEligibleDays === 4)
  check('nutrition prior-week comparisons present and literal',
    n.comparisonLabels.includes('Average calories were down 125 versus the prior week') &&
    n.comparisonLabels.includes('Average protein was up 24g versus the prior week') &&
    n.comparisonLabels.includes('Logging increased by 2 days versus the prior week'))

  const sparse = computeWeeklyNutrition([food('2026-07-28', 1800, 100)], bounds, 126)
  check('fewer than two logged days → no averages, no comparisons',
    sparse.averageCalories === null && sparse.comparisonLabels.length === 0)
}

// ── 16–23. Training and progression ──────────────────────────────────
console.log('\n4. Training and exercise progression')
{
  const sessions = [
    // Review week: two completed, one skipped, one prior-week completed.
    session('2026-08-01', 'completed', 3600, [
      { id: 'ex-bench', name: 'Bench Press', mode: 'weight_reps', sets: [
        { reps: 8, kg: KG(140) },
        { reps: 8, kg: KG(135), warmup: true },   // warm-up excluded
        { reps: 5, kg: KG(150), completed: false }, // incomplete excluded
      ] },
    ]),
    session('2026-07-29', 'completed', null, [ // no duration recorded
      { id: 'ex-run', name: 'Run', mode: 'cardio', sets: [{ dur: 1900 }] },
    ]),
    session('2026-07-30', 'skipped', null, []),
    session('2026-07-22', 'completed', 3000, [ // prior week — not in totals
      { id: 'ex-bench', name: 'Bench Press', mode: 'weight_reps', sets: [{ reps: 8, kg: KG(135) }] },
      { id: 'ex-run', name: 'Run', mode: 'cardio', sets: [{ dur: 1800 }] },
    ]),
  ]
  const snapshot = JSON.stringify(sessions)
  const t = computeWeeklyTraining(sessions, bounds)
  check('completed-workout filtering (skipped and prior week excluded)',
    t.completedWorkouts === 2 && t.skippedWorkouts === 1)
  check('working sets exclude warm-ups and incomplete sets',
    t.completedWorkingSets === 2) // bench working set + run set
  check('duration sums only sessions that have one',
    t.completedDurationSeconds === 3600)
  const noDur = computeWeeklyTraining([
    session('2026-08-01', 'completed', null, [
      { id: 'ex-a', name: 'A', mode: 'weight_reps', sets: [{ reps: 5, kg: 100 }] },
    ]),
  ], bounds)
  check('no durations at all → null (omitted), never a fake zero',
    noDur.completedDurationSeconds === null)

  const completedOnly = sessions.filter((s) => s.status === 'completed')
  const p = computeWeeklyExerciseProgress(completedOnly, bounds)
  // Bench: 140 lbs > 135 lbs latest comparison → improved. Run: 1900s
  // this week vs 1800s in the PRIOR week (>1% longer) → improved via
  // the existing duration comparison.
  check('status counts via the existing 2X classifier',
    p.improving === 2 && p.needsData === 0 && p.steady === 0 && p.declining === 0)
  check('no duplicate exercises in notable results',
    new Set(p.notableExercises.map((r) => r.exerciseId)).size === p.notableExercises.length)
  check('classifier reuse: bench 140>135 lbs latest comparison → improving',
    p.notableExercises.some((r) => r.exerciseId === 'ex-bench' && r.status === 'improved'))
  check('training/progression inputs not mutated', JSON.stringify(sessions) === snapshot)

  // Prior session BEFORE the review week still supplies the comparison —
  // the run's only in-week session was judged against 07-22's session.
  check('comparison may read one qualifying session before the review week',
    p.notableExercises.some((r) => r.exerciseId === 'ex-run' && r.status === 'improved'))
}

// ── 41. Notable ordering ─────────────────────────────────────────────
console.log('\n5. Notable exercises')
{
  const mk = (id: string, name: string, status: ExerciseProgressOverviewRow['status'], date: string): ExerciseProgressOverviewRow => ({
    exerciseId: id, exerciseName: name, trackingMode: 'weight_reps',
    primaryMuscle: null, equipment: null, isUnilateral: false,
    latestWorkoutDate: date, recentSessionCount: 2,
    latestSummary: 'x', secondarySummary: null, status,
  })
  // Already-sorted order (improved → same → declined → needs_data).
  const sorted = [
    mk('i1', 'Imp Recent', 'improved', '2026-08-01'),
    mk('i2', 'Imp Older', 'improved', '2026-07-28'),
    mk('s1', 'Steady', 'same', '2026-08-01'),
    mk('d1', 'Dec', 'declined', '2026-08-01'),
    mk('n1', 'New', 'needs_data', '2026-08-01'),
  ]
  const notable = selectNotableExercises(sorted)
  check('notable order: improving (recent first) then declining, max 3',
    notable.map((r) => r.exerciseId).join(',') === 'i1,i2,d1')
  check('steady is counted but never notable', !notable.some((r) => r.status === 'same'))
  check('needs_data notable only when nothing is judged',
    selectNotableExercises([mk('n1', 'New', 'needs_data', '2026-08-01')])[0].exerciseId === 'n1')
}

// ── 24–26. Activity ──────────────────────────────────────────────────
console.log('\n6. Weekly activity')
{
  const a = computeWeeklyActivity([
    { logged_date: '2026-07-28', steps: 9000 },
    { logged_date: '2026-07-30', steps: 11000 },
    { logged_date: '2026-08-01', steps: 10000 },
    { logged_date: '2026-07-24', steps: 99999 }, // prior week — excluded
    { logged_date: '2026-07-31', steps: null },  // invalid — excluded
  ], bounds)
  check('activity logged-day count', a.loggedDays === 3)
  check('average steps across logged days only (missing days not zero)',
    a.averageSteps === 10000)
  check('total steps across logged days', a.totalSteps === 30000)
  const empty = computeWeeklyActivity([], bounds)
  check('no activity → nulls, never fake zeros',
    empty.loggedDays === 0 && empty.averageSteps === null && empty.totalSteps === null)
}

// ── 27–30. Fasting ───────────────────────────────────────────────────
console.log('\n7. Weekly fasting')
{
  const f = computeWeeklyFasting([
    { duration_minutes: 960 },   // 16h
    { duration_minutes: 1080 },  // 18h
    { duration_minutes: null },  // active/incomplete — excluded
    { duration_minutes: -30 },   // invalid — excluded
  ])
  check('completed-fast filtering (null/negative excluded)', f.completedFasts === 2)
  check('total fasting duration', f.totalDurationMinutes === 2040)
  check('longest completed fast', f.longestDurationMinutes === 1080)
  check('no fasts → zero count with null longest',
    computeWeeklyFasting([]).longestDurationMinutes === null)
}

// ── 31–32. Confidence ────────────────────────────────────────────────
console.log('\n8. Confidence')
{
  check(`sufficiency thresholds reuse existing constants (2/${WEEKLY_SUFFICIENT.nutritionDays}/1/${WEEKLY_SUFFICIENT.activityDays})`,
    WEEKLY_SUFFICIENT.weightDays === 2 && WEEKLY_SUFFICIENT.nutritionDays === 4 &&
    WEEKLY_SUFFICIENT.trainingWorkouts === 1 && WEEKLY_SUFFICIENT.activityDays === 4)
  const limited = computeWeeklyConfidence({
    weightLoggedDays: 1, nutritionLoggedDays: 2, completedWorkouts: 1, activityLoggedDays: 0,
  })
  check('limited: fewer than two sufficient categories',
    limited.level === 'limited' && limited.label === 'Limited data')
  const building = computeWeeklyConfidence({
    weightLoggedDays: 2, nutritionLoggedDays: 2, completedWorkouts: 2, activityLoggedDays: 1,
  })
  check('building: two or three sufficient categories', building.level === 'building')
  check('detail lists available AND missing categories',
    building.detail === 'weight and training are available; nutrition and activity are incomplete.')
  const strong = computeWeeklyConfidence({
    weightLoggedDays: 3, nutritionLoggedDays: 5, completedWorkouts: 3, activityLoggedDays: 6,
  })
  check('strong: all four categories sufficient',
    strong.level === 'strong' && strong.detail === 'All four categories have sufficient data.')
}

// ── 33–37. Focus items ───────────────────────────────────────────────
console.log('\n9. Next-week focus')
{
  const allMissing = buildWeeklyFocusItems({
    weightLoggedDays: 0, nutritionLoggedDays: 0, completedWorkouts: 0,
    activityLoggedDays: 0, decliningExerciseNames: [], improvingCount: 0,
  })
  check('maximum three focus items', allMissing.length === 3)
  check('priority: first missing-data action leads',
    allMissing[0] === 'Log nutrition on at least four days to improve weekly confidence.')

  const withDeclining = buildWeeklyFocusItems({
    weightLoggedDays: 0, nutritionLoggedDays: 0, completedWorkouts: 2,
    activityLoggedDays: 0, decliningExerciseNames: ['Tempo Run'], improvingCount: 2,
  })
  check('declining exercise outranks remaining consistency items',
    withDeclining[1] === 'Review Tempo Run; its latest comparison was declining.')
  check('remaining missing-data items follow declining',
    withDeclining[2] === 'Log a weigh-in next week to start tracking weekly weight.')

  const positive = buildWeeklyFocusItems({
    weightLoggedDays: 3, nutritionLoggedDays: 6, completedWorkouts: 3,
    activityLoggedDays: 5, decliningExerciseNames: [], improvingCount: 3,
  })
  check('positive continuation when nothing is missing',
    positive.length === 1 &&
    positive[0] === 'Keep the current routine; 3 exercises had improving latest comparisons.')

  const fallback = buildWeeklyFocusItems({
    weightLoggedDays: 3, nutritionLoggedDays: 6, completedWorkouts: 3,
    activityLoggedDays: 5, decliningExerciseNames: [], improvingCount: 0,
  })
  check('neutral fallback when nothing else is justified',
    fallback.length === 1 && fallback[0] === WEEKLY_FOCUS_FALLBACK)
}

// ── 38–40, 44–45. Assembly and empty state ───────────────────────────
console.log('\n10. Assembly')
{
  const empty = assembleWeeklyReview({
    todayStr: TODAY, weekStart: WEEK,
    weighInRows: [], foodLogRows: [], sessionRows: [], activityRows: [], fastRows: [],
    proteinTargetGrams: 126, fastingEnabled: true,
  })
  check('empty review period: no data, limited confidence, focus present',
    !empty.hasAnyData && empty.confidence.level === 'limited' &&
    empty.focusItems.length > 0 && empty.range.label === 'Jul 27–Aug 2')
  check('no NaN/Infinity/fake zero averages anywhere',
    !JSON.stringify(empty).includes('NaN') && !JSON.stringify(empty).includes('Infinity') &&
    empty.weight.averageWeightLbs === null && empty.nutrition.averageCalories === null &&
    empty.activity.averageSteps === null && empty.training.completedDurationSeconds === null)

  const weighRows = [weighIn('2026-08-01', 185.0)]
  const foodRows = [food('2026-07-28', 1800, 100)]
  const sessionRows = [session('2026-08-01', 'completed', 3600, [
    { id: 'ex-a', name: 'A', mode: 'weight_reps' as TrackingMode, sets: [{ reps: 5, kg: 100 }] },
  ])]
  const snapshots = [weighRows, foodRows, sessionRows].map((a) => JSON.stringify(a))
  const full = assembleWeeklyReview({
    todayStr: TODAY, weekStart: WEEK,
    weighInRows: weighRows, foodLogRows: foodRows, sessionRows,
    activityRows: [{ logged_date: '2026-07-28', steps: 9000 }],
    fastRows: [{ duration_minutes: 960 }],
    proteinTargetGrams: 126, fastingEnabled: false,
  })
  check('assembly never mutates any input array',
    [weighRows, foodRows, sessionRows].every((a, i) => JSON.stringify(a) === snapshots[i]))
  check('fasting section omitted (null) when fasting is disabled',
    full.fasting === null)
  check('navigation metadata supplies the week-link destinations',
    full.navigation.previousWeekStart === '2026-07-20' &&
    full.navigation.latestWeekStart === '2026-07-27' && full.navigation.isLatest)
  check('summary is derived data only — inputs remain the authority',
    full.hasAnyData && full.weight.loggedDays === 1 && full.training.completedWorkouts === 1)
}

// ── Result ───────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) {
  process.exit(1)
}
