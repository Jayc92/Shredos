// ============================================================
// ShredOS — Phase 3B deterministic verification harness
// Verifies the repaired legacy Coach weekly-review data path:
//   - static schema-contract checks (the query must reference the
//     real workout_sets.completed column, never .status)
//   - normalizeLegacyWeeklySessionRows semantics
//   - fetchWeeklyReview end-to-end against a mock Supabase client
//     (bounds, corrected counts, safe error behavior)
//   - buildCoachActions consuming corrected data with unchanged
//     thresholds, priority, wording, and decision metadata
//   - Phase 3A exports untouched
// Deterministic: fixed fixtures, no Date.now(), no network.
// Run from the repository root:
//   npx tsx scripts/verify-phase3b.ts
// ============================================================

import { readFileSync } from 'fs'
import {
  fetchWeeklyReview,
  normalizeLegacyWeeklySessionRows,
  deriveCompletedFastMinutes,
  // Phase 3A exports — presence asserted below, behavior re-verified
  // by scripts/verify-phase3a.ts.
  fetchWeeklyReviewSummary,
  assembleWeeklyReview,
  resolveReviewWeekStart,
} from '../src/lib/weekly-review'
import type { LegacyWeeklySessionRow } from '../src/lib/weekly-review'
import { buildCoachActions } from '../src/lib/coach-actions'

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

// Friday 2026-08-07 (ISO week Mon 2026-08-03 .. Sun 2026-08-09):
// daysElapsed = 5, past every coach gate.
const TODAY = '2026-08-07'
const WEEK_START = '2026-08-03'

// ── 1. Static schema contract ────────────────────────────────────────
console.log('\n1. Schema contract')
{
  const migration = readFileSync('supabase/migrations/003_phase1c_workout_logging.sql', 'utf8')
  const setsTable = migration.slice(
    migration.indexOf('CREATE TABLE workout_sets'),
    migration.indexOf(');', migration.indexOf('CREATE TABLE workout_sets'))
  )
  check('schema defines workout_sets.completed BOOLEAN',
    /completed\s+BOOLEAN/.test(setsTable))
  check('schema defines NO workout_sets.status column',
    !/^\s*status\s/m.test(setsTable))

  const source = readFileSync('src/lib/weekly-review.ts', 'utf8')
  check('weekly-review source never selects workout_sets(status',
    !source.includes('workout_sets ( status') && !source.includes('workout_sets(status'))
  check('weekly-review source selects the real completed column',
    source.includes('workout_sets ( completed, is_warmup )'))
  check('no set.status filtering remains', !source.includes('set.status'))

  // Fasting schema contract (second Phase 3B defect, found in QA):
  // fasting_logs persists started_at/ended_at only — duration is
  // ALWAYS derived in app code, never stored.
  const schemaSql = readFileSync('supabase/migrations/001_phase1a_schema.sql', 'utf8')
  const fastsTable = schemaSql.slice(
    schemaSql.indexOf('CREATE TABLE fasting_logs'),
    schemaSql.indexOf(');', schemaSql.indexOf('CREATE TABLE fasting_logs'))
  )
  check('schema persists fasting started_at and nullable ended_at',
    /started_at\s+TIMESTAMPTZ NOT NULL/.test(fastsTable) && /ended_at\s+TIMESTAMPTZ/.test(fastsTable))
  check('schema defines NO fasting_logs.duration_minutes column',
    !fastsTable.includes('duration_minutes'))
  const selectedColumns = Array.from(
    source.matchAll(/\.select\(\s*(?:'([^']*)'|`([^`]*)`)/g)
  ).map((m) => m[1] ?? m[2])
  check('no weekly-review select references duration_minutes',
    selectedColumns.every((cols) => !cols.includes('duration_minutes')))
  check('fasting queries select the real timestamp columns',
    selectedColumns.filter((cols) => cols === 'started_at, ended_at').length === 2)
}

// ── Fasting duration derivation ──────────────────────────────────────
console.log('\n1b. Completed-fast duration derivation')
{
  const rows = [
    { started_at: '2026-08-04T04:00:00.000Z', ended_at: '2026-08-04T20:00:00.000Z' }, // 16h
    { started_at: '2026-08-05T03:00:00.000Z', ended_at: '2026-08-05T21:00:00.000Z' }, // 18h
    { started_at: '2026-08-06T10:00:00.000Z', ended_at: null },                        // active — excluded
    { started_at: '2026-08-07T10:00:00.000Z', ended_at: '2026-08-07T08:00:00.000Z' }, // negative — excluded
    { started_at: '2026-08-08T10:00:00.000Z', ended_at: '2026-08-08T10:00:00.000Z' }, // zero — excluded
  ]
  const snapshot = JSON.stringify(rows)
  const minutes = deriveCompletedFastMinutes(rows)
  check('duration derived from timestamps via the authoritative convention',
    minutes.join(',') === '960,1080')
  check('active fast (null ended_at) never counts as completed',
    minutes.length === 2)
  check('invalid/negative/zero derived durations excluded',
    minutes.every((m) => m > 0))
  check('derivation never mutates input rows', JSON.stringify(rows) === snapshot)
  check('no NaN/Infinity in derived minutes', minutes.every((m) => Number.isFinite(m)))
}

// ── 2–17. Normalizer semantics ───────────────────────────────────────
console.log('\n2. Legacy session normalization')
{
  const sets = (specs: Array<[boolean, boolean]>) =>
    specs.map(([completed, is_warmup]) => ({ completed, is_warmup }))
  const rows: LegacyWeeklySessionRow[] = [
    {
      status: 'completed',
      workout_date: '2026-08-03',
      workout_exercises: [
        // Multiple exercises in one workout, multiple sets each.
        { workout_sets: sets([[true, false], [true, false], [false, false]]) }, // 2 working
        { workout_sets: sets([[true, true], [true, false]]) },                  // warm-up excluded → 1
      ],
    },
    {
      status: 'completed',
      workout_date: '2026-08-05',
      workout_exercises: [{ workout_sets: sets([[true, false]]) }], // 1 working
    },
    {
      status: 'in_progress',
      workout_date: '2026-08-07',
      workout_exercises: [{ workout_sets: sets([[true, false]]) }], // never counted
    },
    { status: 'skipped', workout_date: '2026-08-06', workout_exercises: [] },
    // Null embedded relations tolerated.
    { status: 'completed', workout_date: '2026-08-04', workout_exercises: null },
    {
      status: 'completed',
      workout_date: '2026-08-06',
      workout_exercises: [{ workout_sets: null }],
    },
  ]
  const snapshot = JSON.stringify(rows)
  const totals = normalizeLegacyWeeklySessionRows(rows)

  check('completed workout filtering (4 completed of 6 rows)',
    totals.sessionsCompleted === 4)
  check('active workout excluded from completed but flags hasActiveSession',
    totals.hasActiveSession === true &&
    !totals.sessionDates.includes('2026-08-07'))
  check('skipped workouts count as nothing',
    !totals.sessionDates.includes('2026-08-06') || totals.sessionDates.filter((d) => d === '2026-08-06').length === 1)
  check('working-set count: completed, non-warm-up sets only (2+1+1)',
    totals.totalSetsCompleted === 4)
  check('incomplete sets excluded', totals.totalSetsCompleted !== 5)
  check('session dates come from completed sessions',
    totals.sessionDates.join(',') === '2026-08-03,2026-08-05,2026-08-04,2026-08-06')
  check('null embedded relations tolerated (no crash, zero sets)',
    totals.sessionsCompleted === 4)
  check('input rows not mutated', JSON.stringify(rows) === snapshot)
  check('no NaN/Infinity in totals',
    Number.isFinite(totals.sessionsCompleted) && Number.isFinite(totals.totalSetsCompleted))
  check('legacy contract has no duration field (Phase 3A owns durations)',
    !('completedDurationSeconds' in totals))

  const empty = normalizeLegacyWeeklySessionRows([])
  check('empty workout week → zeros, no active session',
    empty.sessionsCompleted === 0 && empty.totalSetsCompleted === 0 &&
    empty.sessionDates.length === 0 && empty.hasActiveSession === false)
}

// ── Mock Supabase client ─────────────────────────────────────────────

interface TableResult { data: unknown; error: unknown }

function mockSupabase(results: Record<string, TableResult>) {
  const captured: Record<string, { select: string; filters: Array<[string, unknown[]]> }> = {}
  return {
    captured,
    from(table: string) {
      const record = { select: '', filters: [] as Array<[string, unknown[]]> }
      captured[table] = record
      const builder: Record<string, unknown> = {}
      const chain = (name: string) =>
        (...args: unknown[]) => {
          if (name === 'select') record.select = String(args[0])
          else record.filters.push([name, args])
          return builder
        }
      for (const m of ['select', 'eq', 'gte', 'lte', 'not', 'in', 'order', 'limit']) {
        builder[m] = chain(m)
      }
      builder.then = (resolve: (v: TableResult) => void) =>
        Promise.resolve(results[table] ?? { data: [], error: null }).then(resolve)
      return builder
    },
  }
}

const SESSION_ROWS: LegacyWeeklySessionRow[] = [
  {
    status: 'completed',
    workout_date: '2026-08-03',
    workout_exercises: [
      { workout_sets: [{ completed: true, is_warmup: false }, { completed: true, is_warmup: false }] },
    ],
  },
  {
    status: 'completed',
    workout_date: '2026-08-05',
    workout_exercises: [{ workout_sets: [{ completed: true, is_warmup: false }] }],
  },
]

// Minimal nutrition-coach summary shape for buildCoachActions.
const NEUTRAL_NUTRITION_SUMMARY = {
  calorieSuggestion: null,
  calorieTrend: 'insufficient-data',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any

// ── 18–19. End-to-end via fetchWeeklyReview ──────────────────────────
async function runAsyncSections() {
  console.log('\n3. Repaired fetchWeeklyReview')
  await (async () => {
  const supabase = mockSupabase({
    body_metrics: { data: [], error: null },
    food_logs: { data: [], error: null },
    workout_sessions: { data: SESSION_ROWS, error: null },
    fasting_logs: { data: [], error: null },
    daily_activity_logs: { data: [], error: null },
  })

  const review = await fetchWeeklyReview(
    supabase, 'user-1', TODAY, null, 'fat_loss', false, null
  )

  check('current in-progress ISO week convention preserved',
    review.weekStart === WEEK_START && review.weekEnd === '2026-08-09' &&
    review.daysElapsed === 5)
  const sessionQuery = supabase.captured['workout_sessions']
  check('weekly date boundary applied to the sessions query (capped at today)',
    JSON.stringify(sessionQuery.filters).includes(`["gte",["workout_date","${WEEK_START}"]]`) &&
    JSON.stringify(sessionQuery.filters).includes(`["lte",["workout_date","${TODAY}"]]`))
  check('sessions query selects the real columns',
    sessionQuery.select.includes('workout_sets ( completed, is_warmup )'))
  check('corrected counts flow through the legacy summary',
    review.sessionsCompleted === 2 && review.totalSetsCompleted === 3 &&
    review.hasActiveSession === false)
  check('hasAnyData true once workouts exist', review.hasAnyData === true)

  // 19–23: coach consumer on corrected data.
  const actions = buildCoachActions(review, NEUTRAL_NUTRITION_SUMMARY, 'maintenance')
  check('coach no longer claims zero workouts when workouts exist',
    actions.primaryAction?.type !== 'complete_workout' &&
    !actions.secondaryActions.some((a) => a.type === 'complete_workout'))
})()

  // ── 20–24. Coach semantics on corrected + failing data ───────────────
  console.log('\n4. Coach semantics and safe errors')
  await (async () => {
  // Query error → stable safe result (empty training), logged not thrown.
  const failing = mockSupabase({
    body_metrics: { data: [], error: null },
    food_logs: { data: [], error: null },
    workout_sessions: { data: null, error: { message: 'column workout_sets.status does not exist' } },
    fasting_logs: { data: [], error: null },
    daily_activity_logs: { data: [], error: null },
  })
  const originalError = console.error
  let loggedError = false
  console.error = (...args: unknown[]) => {
    if (String(args[0]).includes('fetchWeeklyReview')) loggedError = true
  }
  const broken = await fetchWeeklyReview(failing, 'user-1', TODAY, null, 'fat_loss', false, null)
  console.error = originalError

  check('query error produces a stable safe result (no throw, zero training)',
    broken.sessionsCompleted === 0 && broken.totalSetsCompleted === 0 &&
    broken.hasActiveSession === false)
  check('query error is observable via development logging', loggedError)

  // Thresholds/priority/wording/decision metadata unchanged: zero
  // workouts on day 5 of a cutting week with no weigh-ins → the same
  // pre-existing rules fire in the same order with the same text.
  const actions = buildCoachActions(broken, NEUTRAL_NUTRITION_SUMMARY, 'fat_loss')
  check('recommendation priority unchanged (weigh-in rule leads)',
    actions.primaryAction?.type === 'log_weigh_in' && actions.primaryAction.priority === 1)
  check('recommendation wording unchanged',
    actions.primaryAction?.title === 'Log a weigh-in this week' &&
    actions.secondaryActions.some((a) => a.title === 'Get a workout in this week'))
  check('threshold gates unchanged (early week still returns no actions)',
    buildCoachActions({ ...broken, daysElapsed: 2 }, NEUTRAL_NUTRITION_SUMMARY, 'fat_loss')
      .hasEnoughData === false)
  check('decision metadata unchanged',
    actions.primaryAction?.decisionType === 'coach_log_weigh_in' &&
    actions.secondaryActions.find((a) => a.type === 'complete_workout')?.decisionType ===
      'coach_complete_workout')
  check('no NaN/Infinity in coach output',
    !JSON.stringify(actions).includes('NaN') && !JSON.stringify(actions).includes('Infinity'))
})()

  // ── Fasting end-to-end through both repaired paths ─────────────────
  console.log('\n4b. Fasting data flow')
  await (async () => {
    const FAST_ROWS = [
      { started_at: '2026-08-04T04:00:00.000Z', ended_at: '2026-08-04T20:00:00.000Z' }, // 960m
      { started_at: '2026-08-05T03:00:00.000Z', ended_at: '2026-08-05T21:00:00.000Z' }, // 1080m
      { started_at: '2026-08-06T10:00:00.000Z', ended_at: '2026-08-06T10:00:00.000Z' }, // zero — excluded
    ]

    const supabase = mockSupabase({
      body_metrics: { data: [], error: null },
      food_logs: { data: [], error: null },
      workout_sessions: { data: SESSION_ROWS, error: null },
      fasting_logs: { data: FAST_ROWS, error: null },
      daily_activity_logs: { data: [], error: null },
    })
    const review = await fetchWeeklyReview(supabase, 'user-1', TODAY, null, 'fat_loss', true, null)
    check('legacy fasting query selects real timestamp columns',
      supabase.captured['fasting_logs'].select === 'started_at, ended_at')
    check('fasting data flows into the legacy Coach summary (derived durations)',
      review.fastsCompletedThisWeek === 2 && review.avgFastHours === 17)
    check('no NaN/Infinity in legacy fasting output',
      !JSON.stringify(review).includes('NaN') && !JSON.stringify(review).includes('Infinity'))

    // Phase 3A summary path uses the same derivation at its fetch boundary.
    const supabase3a = mockSupabase({
      body_metrics: { data: [], error: null },
      food_logs: { data: [], error: null },
      workout_sessions: { data: [], error: null },
      fasting_logs: { data: FAST_ROWS, error: null },
      daily_activity_logs: { data: [], error: null },
    })
    const summary = await fetchWeeklyReviewSummary(
      supabase3a, 'user-1', TODAY, undefined, null, true
    )
    check('completed-week summary fasting derives durations from timestamps',
      summary.fasting !== null &&
      summary.fasting.completedFasts === 2 &&
      summary.fasting.totalDurationMinutes === 2040 &&
      summary.fasting.longestDurationMinutes === 1080)
    check('completed-week fasting query also selects real columns',
      supabase3a.captured['fasting_logs'].select === 'started_at, ended_at')

    // Fasting query failure → safe, observable, stable.
    const failing = mockSupabase({
      body_metrics: { data: [], error: null },
      food_logs: { data: [], error: null },
      workout_sessions: { data: [], error: null },
      fasting_logs: { data: null, error: { code: '42703', message: 'column fasting_logs.duration_minutes does not exist' } },
      daily_activity_logs: { data: [], error: null },
    })
    const originalError = console.error
    let loggedFastingError = false
    console.error = (...args: unknown[]) => {
      if (String(args[0]).includes('fasting_logs')) loggedFastingError = true
    }
    const broken = await fetchWeeklyReview(failing, 'user-1', TODAY, null, 'fat_loss', true, null)
    console.error = originalError
    check('fasting query error produces a stable safe result',
      broken.fastsCompletedThisWeek === 0 && broken.avgFastHours === null)
    check('fasting query error is observable via development logging', loggedFastingError)
  })()
}

// ── 25. Phase 3A untouched ───────────────────────────────────────────
console.log('\n5. Phase 3A isolation')
{
  check('Phase 3A exports still present',
    typeof fetchWeeklyReviewSummary === 'function' &&
    typeof assembleWeeklyReview === 'function' &&
    typeof resolveReviewWeekStart === 'function')
  check('Phase 3A window behavior unchanged (spot check)',
    resolveReviewWeekStart('2026-08-04', undefined) === '2026-07-27')
  const empty3a = assembleWeeklyReview({
    todayStr: '2026-08-04', weekStart: '2026-07-27',
    weighInRows: [], foodLogRows: [], sessionRows: [], activityRows: [], fastRows: [],
    proteinTargetGrams: null, fastingEnabled: false,
  })
  check('Phase 3A assembly unchanged (spot check)',
    empty3a.range.label === 'Jul 27–Aug 2' && empty3a.confidence.level === 'limited')
}

// ── Result ───────────────────────────────────────────────────────────
runAsyncSections().then(() => {
  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) {
    process.exit(1)
  }
}).catch((err) => {
  console.error('HARNESS CRASH:', err)
  process.exit(1)
})
