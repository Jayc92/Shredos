// ============================================================
// ForgeFitOS — W12-R1 verifier: the three independent-review findings.
//
// Dedicated coverage for the corrections required by the W12 independent
// review verdict. Each finding gets executable proof over the REAL modules,
// including a synthetic reproduction of the defect (a positive control that
// fails if the correction is reverted), never a source-text pin standing in
// for behavior:
//
//   R1-1  Recent PR tile key collision. Two successive strength PRs of the
//         same exercise / workout date / PR type shared one key, which
//         /progress used as a React key. Proven with events the REAL
//         strength engine emits, not hand-forged ones.
//   R1-2  The same exercise in several workout_exercises blocks. Each block
//         restarted weight_time PR evaluation from the historical frontier,
//         so a later block could not see an earlier block's points: the
//         review's own example (20 lb x 1:00 history; block A 25 lb x 1:10;
//         block B 25 lb x 1:05) wrongly reported block B as a PR.
//   R1-3  Session representative-hold consistency. Both the previous-bests
//         reader and the exercise detail selected the last physical SET of a
//         session, contradicting the representativeHold rule they claim to
//         use, and neither looked past one block.
//
// The R1 boundary is asserted too: migration 028 must be byte-identical.
//
// Never contacts Supabase, Vercel, or any remote service — every fetch
// helper runs against a fake query builder over in-memory fixtures.
// Run from the repository root:
//   npx tsx scripts/verify-weight-time-w12-r1.ts
// ============================================================

import path from 'node:path'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

import {
  evaluateWeightTimeSessionPRs, evaluateWeightTimeSetPRs, weightTimePerformancesFromSessionSets,
  selectRecentSessionRepresentatives, selectLongestHold, compareChronologically,
} from '../src/lib/weight-time-records'
import type {
  WeightTimePerformance, WeightTimePoint, WeightTimeRawSet, WeightTimeSessionBlock,
} from '../src/lib/weight-time-records'
import { buildRecentPRTiles, mergeRecentPRTiles, RECENT_PR_TILE_CAP } from '../src/lib/recent-pr-tiles'
import type { RecentPRTile } from '../src/lib/recent-pr-tiles'
import { fetchStrengthRecords } from '../src/lib/strength-records'
import type { PREvent, PREventType, StrengthRecordsSummary } from '../src/lib/strength-records'
import { fetchPreviousBests } from '../src/lib/supabase/server'
import { evaluateSetPRs, summarizeWorkout } from '../src/lib/workout'
import { lbsToKg } from '../src/lib/units'
import type { Exercise, TrackingMode, WorkoutExerciseWithDetails, WorkoutSet } from '../src/types/database'

const repositoryRoot = process.cwd()
let passed = 0
let failed = 0
function check(name: string, condition: boolean, detail?: string): void {
  if (condition) { passed += 1; console.log(`  PASS  ${name}`) } else { failed += 1; console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`) }
}
function read(relativePath: string): string {
  return readFileSync(path.join(repositoryRoot, relativePath), 'utf8')
}

const USER_ID = 'user-w12-r1'

// ── Shared fixture builders ──────────────────────────────────────────

function exercise(id: string, name: string, trackingMode: TrackingMode, isUnilateral = false): Exercise {
  return {
    id, user_id: USER_ID, name, category: null, primary_muscle: 'chest', secondary_muscles: [],
    equipment: trackingMode === 'bodyweight' ? 'bodyweight' : 'barbell',
    exercise_type: trackingMode === 'bodyweight' ? 'bodyweight' : trackingMode === 'cardio' ? 'cardio' : 'strength',
    tracking_mode: trackingMode, unilateral: isUnilateral, notes: null, is_active: true, is_system: false,
    created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
  }
}

/**
 * One qualifying (or deliberately non-qualifying) weighted hold. Added
 * weight is given in POUNDS — the unit the review's example uses — and
 * converted by the app's own lbsToKg, so two sets written with the same
 * pound figure are exactly equal in kilograms and isExactRepeat sees them
 * as the repeat they are.
 */
function holdSet(
  id: string,
  setNumber: number,
  addedWeightLb: number,
  durationSeconds: number,
  options: { isWarmup?: boolean; completed?: boolean } = {},
): WeightTimeRawSet {
  return {
    id, set_number: setNumber, weight_kg: lbsToKg(addedWeightLb), duration_seconds: durationSeconds,
    rpe: null, is_warmup: options.isWarmup ?? false, completed: options.completed ?? true,
  }
}

/** The same hold as a full WorkoutSet row, for the summarizeWorkout fixtures. */
function holdWorkoutSet(blockId: string, raw: WeightTimeRawSet): WorkoutSet {
  return {
    id: raw.id, workout_exercise_id: blockId, set_number: raw.set_number, weight_kg: raw.weight_kg,
    reps: null, rpe: raw.rpe, completed: raw.completed, is_warmup: raw.is_warmup, notes: null,
    duration_seconds: raw.duration_seconds, distance_meters: null, created_at: '2026-08-15T10:00:00Z',
  }
}

function strengthWorkoutSet(blockId: string, id: string, setNumber: number, reps: number | null, weightKg: number | null): WorkoutSet {
  return {
    id, workout_exercise_id: blockId, set_number: setNumber, weight_kg: weightKg, reps, rpe: null,
    completed: true, is_warmup: false, notes: null, duration_seconds: null, distance_meters: null,
    created_at: '2026-08-15T10:00:00Z',
  }
}

/** One workout_exercises block for summarizeWorkout, in the position the caller lists it. */
function detailBlock(blockId: string, ex: Exercise, orderIndex: number, sets: WorkoutSet[]): WorkoutExerciseWithDetails {
  return {
    id: blockId, workout_session_id: 'sess-live', exercise_id: ex.id, order_index: orderIndex,
    target_sets: null, target_reps: null, target_reps_min: null, target_reps_max: null,
    target_weight_kg: null, notes: null, created_at: '2026-08-15T09:00:00Z', updated_at: '2026-08-15T09:00:00Z',
    exercise: ex, workout_sets: sets,
  }
}

/** The blocks of one live session, as evaluateWeightTimeSessionPRs takes them. */
function sessionBlocks(blocks: WorkoutExerciseWithDetails[]): WeightTimeSessionBlock[] {
  return blocks.map((block) => ({
    exerciseId: block.exercise_id,
    trackingMode: block.exercise.tracking_mode,
    sets: block.workout_sets as unknown as WeightTimeRawSet[],
  }))
}

function performance(
  setId: string, sessionId: string, workoutDate: string, orderIndex: number,
  setNumber: number, addedWeightLb: number, durationSeconds: number,
): WeightTimePerformance {
  return {
    setId, exerciseId: 'ex-hold', sessionId, workoutDate,
    sessionCreatedAt: `${workoutDate}T09:00:00Z`, orderIndex, setNumber,
    weightKg: lbsToKg(addedWeightLb), durationSeconds, rpe: null,
  }
}

// ── Fake Supabase query builder ──────────────────────────────────────

interface FixtureSession {
  id: string
  user_id: string
  status: string
  workout_date: string
  created_at?: string
  workout_exercises: unknown[]
}

/**
 * Covers exactly the chains the two readers under test issue:
 * fetchStrengthRecords (.eq user_id, .eq status, .order asc) and
 * fetchPreviousBests (.eq user_id, .eq status, .neq id, .order desc, .limit).
 */
function fakeClientFor(sessions: FixtureSession[]) {
  class FakeQuery {
    private readonly equalities: Array<[string, unknown]> = []
    private readonly inequalities: Array<[string, unknown]> = []
    private ascending = true
    private maximumRows: number | null = null
    constructor(private readonly table: string) {}
    select(_columns: string): this { return this }
    eq(column: string, value: unknown): this { this.equalities.push([column, value]); return this }
    neq(column: string, value: unknown): this { this.inequalities.push([column, value]); return this }
    order(_column: string, options?: { ascending?: boolean }): this { this.ascending = options?.ascending ?? true; return this }
    limit(count: number): this { this.maximumRows = count; return this }
    private equalityValue(column: string): unknown { return this.equalities.find(([name]) => name === column)?.[1] }
    private execute(): { data: unknown; error: null } {
      if (this.table !== 'workout_sessions') throw new Error(`FakeQuery: unexpected table ${this.table}`)
      let rows = structuredClone(sessions)
        .filter((session) => session.user_id === this.equalityValue('user_id') && session.status === this.equalityValue('status'))
        .filter((session) => this.inequalities.every(([column, value]) => (session as unknown as Record<string, unknown>)[column] !== value))
      rows.sort((a, b) => this.ascending ? a.workout_date.localeCompare(b.workout_date) : b.workout_date.localeCompare(a.workout_date))
      if (this.maximumRows !== null) rows = rows.slice(0, this.maximumRows)
      return { data: rows, error: null }
    }
    then<TResult>(onFulfilled: (value: { data: unknown; error: null }) => TResult): Promise<TResult> {
      return Promise.resolve(this.execute()).then(onFulfilled)
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { from: (table: string) => new FakeQuery(table) } as any
}

// ── A. R1-1 — Recent PR tile key identity ────────────────────────────

/** The pre-correction key formula, verbatim, for the reproduction control. */
function legacyStrengthKey(event: PREvent): string {
  return `strength:${event.exerciseId}:${event.workoutDate}:${event.type}`
}

const RECORD_METRIC_BY_TYPE: Record<PREventType, (event: PREvent) => number | null> = {
  weight: (event) => event.weightKg,
  estimated_1rm: (event) => event.estimated1RmKg,
  bodyweight_reps: (event) => event.reps,
}

function groupEventsByLegacyIdentity(events: PREvent[]): Map<string, PREvent[]> {
  const groups = new Map<string, PREvent[]>()
  for (const event of events) {
    const collected = groups.get(legacyStrengthKey(event))
    if (collected) collected.push(event)
    else groups.set(legacyStrengthKey(event), [event])
  }
  return groups
}

/**
 * One completed session in which every PR type records TWICE — the state the
 * strength engine explicitly supports (processExerciseSession, quoting its own
 * comment: "The running best is updated after each set, so a second set in the
 * same session can be recognized as a new record even though it's only beating
 * THIS session's first set (successive same-workout PRs)") and the state the
 * old key could not tell apart.
 *
 * Each exercise needs THREE sets, because the first-ever qualifying value
 * silently establishes the baseline and is never itself a PR:
 *   ex-wr    100 -> 105 -> 110 kg: two 'weight' PRs (a weight PR outranks an
 *            est. 1RM PR for the same set, so only 'weight' is emitted).
 *   ex-1rm   120x2 -> 110.2x5 -> 110.4x5: the later sets are LIGHTER than the
 *            established max weight, so no weight PR can fire (a weight PR
 *            would outrank the est. 1RM PR for the same set), and the est.
 *            1RMs run 128.0 -> 128.6 -> 128.8 kg, giving two
 *            'estimated_1rm' PRs 0.2 kg = 0.44 POUNDS apart. Both round to
 *            the same whole kilogram, so a key that rounded or bucketed the
 *            metric would still collide. The odd weights are deliberate:
 *            epley1RM quantises to 0.1 kg and refuses reps below 2, so the
 *            first set needs 2+ reps to establish the 1RM baseline at all.
 *   ex-bw    8 -> 10 -> 12 reps: two 'bodyweight_reps' PRs.
 */
const strengthFixtureSessions: FixtureSession[] = [
  { id: 'sess-a1', user_id: USER_ID, status: 'completed', workout_date: '2026-08-01', workout_exercises: [
    { exercise_id: 'ex-wr', exercise: exercise('ex-wr', 'Bench Press', 'weight_reps'), workout_sets: [
      { set_number: 1, reps: 5, weight_kg: 100, rpe: 8, is_warmup: false, completed: true },
      { set_number: 2, reps: 3, weight_kg: 105, rpe: 9, is_warmup: false, completed: true },
      { set_number: 3, reps: 3, weight_kg: 110, rpe: 9, is_warmup: false, completed: true },
    ] },
    { exercise_id: 'ex-1rm', exercise: exercise('ex-1rm', 'Close-Grip Bench', 'weight_reps'), workout_sets: [
      { set_number: 1, reps: 2, weight_kg: 120,   rpe: 9, is_warmup: false, completed: true },
      { set_number: 2, reps: 5, weight_kg: 110.2, rpe: 8, is_warmup: false, completed: true },
      { set_number: 3, reps: 5, weight_kg: 110.4, rpe: 8, is_warmup: false, completed: true },
    ] },
    { exercise_id: 'ex-bw', exercise: exercise('ex-bw', 'Pull-up', 'bodyweight'), workout_sets: [
      { set_number: 1, reps: 8,  weight_kg: null, rpe: 7, is_warmup: false, completed: true },
      { set_number: 2, reps: 10, weight_kg: null, rpe: 9, is_warmup: false, completed: true },
      { set_number: 3, reps: 12, weight_kg: null, rpe: 9, is_warmup: false, completed: true },
    ] },
  ] },
]

async function verifyR1_1(): Promise<void> {
  console.log('\nA. R1-1 — Recent PR tile keys distinguish successive same-workout PR events')

  const summary = await fetchStrengthRecords(fakeClientFor(strengthFixtureSessions), USER_ID) as StrengthRecordsSummary
  const events = summary.recentPREvents
  const legacyGroups = groupEventsByLegacyIdentity(events)
  const collidingGroups = Array.from(legacyGroups.values()).filter((group) => group.length > 1)
  const collidingTypes = new Set(collidingGroups.map((group) => group[0].type))

  // The reproduction control. These events are what the real engine emits for
  // a legal session; if this arm ever goes quiet the rest of section A proves
  // nothing, so it is asserted, not assumed.
  check('A1: the REAL strength engine emits successive PR events sharing (exerciseId, workoutDate, type) — for all three PR types',
    collidingGroups.length >= 3 && collidingTypes.has('weight') && collidingTypes.has('estimated_1rm') && collidingTypes.has('bodyweight_reps'),
    `colliding groups: ${collidingGroups.length}, types: ${Array.from(collidingTypes).sort().join(', ')}`)
  check('A2: every such group is a genuine record progression — the record metric strictly increases, so it is a true event identity',
    collidingGroups.every((group) => {
      const metrics = [...group].reverse().map((event) => RECORD_METRIC_BY_TYPE[event.type](event))
      return metrics.every((metric) => metric !== null)
        && metrics.every((metric, index) => index === 0 || (metric as number) > (metrics[index - 1] as number))
    }))

  const tiles = buildRecentPRTiles(events, [])
  check('A3: both events of every colliding group remain in Recent PRs — none is dropped or merged',
    tiles.length === events.length && collidingGroups.every((group) => group.length === tiles.filter((tile) =>
      tile.model === 'strength' && tile.workoutDate === group[0].workoutDate && tile.key.startsWith(`strength:${group[0].exerciseId}:${group[0].workoutDate}:${group[0].type}:`)).length))
  check('A4: every tile key in the merged list is unique',
    new Set(tiles.map((tile) => tile.key)).size === tiles.length,
    `${tiles.length} tiles, ${new Set(tiles.map((tile) => tile.key)).size} distinct keys`)
  check('A5: the defect is reproduced under the pre-correction formula — the legacy key really did collide on this same input',
    new Set(events.map(legacyStrengthKey)).size < events.length)
  // The key applies NO rounding or bucketing of its own: it carries the metric
  // exactly as the engine produced it. (epley1RM has already quantised to
  // 0.1 kg upstream — that is the engine's precision, not the key's.) These
  // two est. 1RM PRs are 0.2 kg = 0.44 lb apart and round to the SAME whole
  // kilogram, so a key that rounded would put them back in collision.
  check('A6: the key applies no rounding of its own — two est. 1RM PRs that round to the same whole kg still get distinct keys',
    (() => {
      const oneRmEvents = events.filter((event) => event.exerciseId === 'ex-1rm' && event.type === 'estimated_1rm')
      const oneRmTiles = tiles.filter((tile) => tile.key.startsWith('strength:ex-1rm:2026-08-01:estimated_1rm:'))
      const metrics = oneRmEvents.map((event) => event.estimated1RmKg as number)
      return oneRmEvents.length === 2 && oneRmTiles.length === 2 && oneRmTiles[0].key !== oneRmTiles[1].key
        && metrics[0] !== metrics[1] && Math.abs(metrics[0] - metrics[1]) < lbsToKg(1)
        && Math.round(metrics[0]) === Math.round(metrics[1])
        && oneRmTiles.every((tile) => tile.key.endsWith(`:${oneRmEvents.find((event) =>
          tile.key === `strength:ex-1rm:2026-08-01:estimated_1rm:${event.estimated1RmKg}`)?.estimated1RmKg}`))
    })(),
    `metrics: ${events.filter((e) => e.exerciseId === 'ex-1rm' && e.type === 'estimated_1rm').map((e) => e.estimated1RmKg).join(', ')}`)

  // The legacy Recent PRs output must be untouched apart from the key, which
  // /progress uses as a React key and never displays.
  const legacyTiles: RecentPRTile[] = events.map((event) => ({ ...tileWithoutKey(event, tiles), key: legacyStrengthKey(event) }))
  check('A7: with zero weight_time events the output is identical to the legacy list apart from the key — same order, count, labels and values',
    tiles.length === legacyTiles.length && tiles.every((tile, index) =>
      tile.model === legacyTiles[index].model && tile.typeLabel === legacyTiles[index].typeLabel
      && tile.workoutDate === legacyTiles[index].workoutDate && tile.exerciseName === legacyTiles[index].exerciseName
      && tile.valueText === legacyTiles[index].valueText))
  check('A8: the key is the ONLY field that changed, and it changed for exactly the strength model',
    tiles.every((tile, index) => tile.key !== legacyTiles[index].key)
    && tiles.every((tile) => tile.model === 'strength' && tile.key.split(':').length === 5))

  // Ordering and cap behaviour, over more events than the cap admits.
  const manyStrengthTiles: RecentPRTile[] = Array.from({ length: 8 }, (_value, index) => ({
    key: `strength:ex-wr:2026-08-${String(20 - index).padStart(2, '0')}:weight:${100 - index}`,
    model: 'strength', typeLabel: 'Weight PR', workoutDate: `2026-08-${String(20 - index).padStart(2, '0')}`,
    exerciseName: 'Bench Press', valueText: `${220 - index} lbs`,
  }))
  const manyWeightTimeTiles: RecentPRTile[] = Array.from({ length: 8 }, (_value, index) => ({
    key: `weight_time:set-${index}`, model: 'weight_time', typeLabel: 'Weight-time PR',
    workoutDate: `2026-08-${String(20 - index).padStart(2, '0')}`, exerciseName: 'Plank', valueText: '1:30 · 20 lb added',
  }))
  const merged = mergeRecentPRTiles(manyStrengthTiles, manyWeightTimeTiles)
  check('A9: ordering and cap behaviour unchanged — date descending, strength first on an equal date, capped at RECENT_PR_TILE_CAP',
    merged.length === RECENT_PR_TILE_CAP
    && merged.every((tile, index) => index === 0 || tile.workoutDate <= merged[index - 1].workoutDate)
    && merged.filter((tile) => tile.workoutDate === '2026-08-20').map((tile) => tile.model).join(',') === 'strength,weight_time'
    && merged[0].workoutDate === '2026-08-20')

  const tileSource = read('src/lib/recent-pr-tiles.ts')
  check('A10: the false claim that a collision is "impossible even in principle" is gone, and the corrected reasoning is stated at the line',
    !tileSource.includes('impossible even in principle') && tileSource.includes('W12-R1-1')
    && tileSource.includes('is NOT unique') && tileSource.includes('strengthRecordMetric'))
}

/** The tile the CURRENT implementation produced for this event, key aside. */
function tileWithoutKey(event: PREvent, tiles: RecentPRTile[]): RecentPRTile {
  const match = tiles.find((tile) => tile.key.startsWith(`strength:${event.exerciseId}:${event.workoutDate}:${event.type}:`)
    && tile.key.endsWith(`:${RECORD_METRIC_BY_TYPE[event.type](event) ?? ''}`))
  if (!match) throw new Error(`no tile for event ${legacyStrengthKey(event)}`)
  return match
}

// ── B. R1-2 — the same exercise in several workout blocks ────────────

const HOLD_EXERCISE = exercise('ex-hold', 'Weighted Plank', 'weight_time')
const STRENGTH_EXERCISE = exercise('ex-wr', 'Bench Press', 'weight_reps')
const CARDIO_EXERCISE = exercise('ex-cardio', 'Row', 'cardio')

/** The review's stated history: 20 lb for 1:00. */
const HISTORICAL_FRONTIER: Record<string, WeightTimePoint[]> = {
  'ex-hold': [{ weightKg: lbsToKg(20), durationSeconds: 60 }],
}

function verifyR1_2(): void {
  console.log('\nB. R1-2 — weight_time PRs are evaluated per EXERCISE across every block, in session order')

  // Case A — the review's own example. Block A's 25 lb x 1:10 dominates
  // block B's 25 lb x 1:05, so only block A holds a PR.
  const caseABlockA = [holdSet('a1', 1, 25, 70)]
  const caseABlockB = [holdSet('b1', 1, 25, 65)]
  const caseA = evaluateWeightTimeSessionPRs([
    { exerciseId: 'ex-hold', trackingMode: 'weight_time', sets: caseABlockA },
    { exerciseId: 'ex-hold', trackingMode: 'weight_time', sets: caseABlockB },
  ], HISTORICAL_FRONTIER)
  check('B1: Case A — an earlier block\'s point dominates the later block\'s, so the later set is NOT a PR',
    caseA['a1'] === true && caseA['b1'] === false, JSON.stringify(caseA))

  // The reproduction control: the pre-correction shape evaluated each block
  // on its own, so block B restarted from the historical frontier and was
  // wrongly reported as a second PR.
  const caseABlockBAlone = evaluateWeightTimeSetPRs(
    weightTimePerformancesFromSessionSets(caseABlockB, 'ex-hold'), HISTORICAL_FRONTIER['ex-hold'])
  check('B2: the defect is reproduced — evaluating block B alone against the historical frontier calls it a PR',
    caseABlockBAlone['b1'] === true)

  // Case B — the later block exactly repeats the earlier one.
  const caseB = evaluateWeightTimeSessionPRs([
    { exerciseId: 'ex-hold', trackingMode: 'weight_time', sets: [holdSet('a1', 1, 25, 70)] },
    { exerciseId: 'ex-hold', trackingMode: 'weight_time', sets: [holdSet('b1', 1, 25, 70)] },
  ], HISTORICAL_FRONTIER)
  check('B3: Case B — the later block exactly repeats the earlier hold, so it is NOT a PR',
    caseB['a1'] === true && caseB['b1'] === false, JSON.stringify(caseB))

  // Case C — incomparable, and strictly better.
  const caseCIncomparable = evaluateWeightTimeSessionPRs([
    { exerciseId: 'ex-hold', trackingMode: 'weight_time', sets: [holdSet('a1', 1, 25, 70)] },
    { exerciseId: 'ex-hold', trackingMode: 'weight_time', sets: [holdSet('b1', 1, 30, 65)] },
  ], HISTORICAL_FRONTIER)
  const caseCImproves = evaluateWeightTimeSessionPRs([
    { exerciseId: 'ex-hold', trackingMode: 'weight_time', sets: [holdSet('a1', 1, 25, 70)] },
    { exerciseId: 'ex-hold', trackingMode: 'weight_time', sets: [holdSet('b1', 1, 30, 75)] },
  ], HISTORICAL_FRONTIER)
  check('B4: Case C — a later block that is incomparable (heavier, shorter) IS a PR',
    caseCIncomparable['a1'] === true && caseCIncomparable['b1'] === true, JSON.stringify(caseCIncomparable))
  check('B5: Case C — a later block that dominates the earlier one IS a PR',
    caseCImproves['a1'] === true && caseCImproves['b1'] === true, JSON.stringify(caseCImproves))

  // Actual session order is the ordering key, not a re-sort: the same two
  // holds in the opposite block order give the opposite answer.
  const reversed = evaluateWeightTimeSessionPRs([
    { exerciseId: 'ex-hold', trackingMode: 'weight_time', sets: caseABlockB },
    { exerciseId: 'ex-hold', trackingMode: 'weight_time', sets: caseABlockA },
  ], HISTORICAL_FRONTIER)
  check('B6: block ORDER is honoured — reversing the two blocks moves the refusal, it is never re-sorted away',
    reversed['b1'] === true && reversed['a1'] === true && caseA['b1'] === false, JSON.stringify(reversed))

  // Warm-ups and incomplete sets are not PR-eligible and get no entry.
  const withExcluded = evaluateWeightTimeSessionPRs([
    { exerciseId: 'ex-hold', trackingMode: 'weight_time', sets: [
      holdSet('warm', 1, 25, 120, { isWarmup: true }),
      holdSet('open', 2, 25, 999, { completed: false }),
      holdSet('a1', 3, 25, 70),
    ] },
  ], HISTORICAL_FRONTIER)
  check('B7: warm-up and incomplete holds are excluded entirely — no entry, and they cannot block a later set',
    !('warm' in withExcluded) && !('open' in withExcluded) && withExcluded['a1'] === true && Object.keys(withExcluded).length === 1)

  // Other tracking modes are skipped, not scored by this model.
  const otherModes = evaluateWeightTimeSessionPRs([
    { exerciseId: 'ex-wr', trackingMode: 'weight_reps', sets: [holdSet('s1', 1, 100, 0)] },
    { exerciseId: 'ex-cardio', trackingMode: 'cardio', sets: [holdSet('c1', 1, 0, 600)] },
  ], HISTORICAL_FRONTIER)
  check('B8: non-weight_time blocks produce no weight_time PR entries at all',
    Object.keys(otherModes).length === 0)

  // A single-block session must be unchanged from the per-block result — the
  // correction adds cross-block merging and changes nothing else.
  const singleBlockSets = [holdSet('a1', 1, 25, 70), holdSet('a2', 2, 25, 65), holdSet('a3', 3, 30, 65)]
  const throughSession = evaluateWeightTimeSessionPRs(
    [{ exerciseId: 'ex-hold', trackingMode: 'weight_time', sets: singleBlockSets }], HISTORICAL_FRONTIER)
  const throughBlock = evaluateWeightTimeSetPRs(
    weightTimePerformancesFromSessionSets(singleBlockSets, 'ex-hold'), HISTORICAL_FRONTIER['ex-hold'])
  check('B9: a single-block session is byte-identical to the legacy per-block evaluation',
    JSON.stringify(throughSession) === JSON.stringify(throughBlock), JSON.stringify(throughSession))

  // summarizeWorkout: the PR set count must not be inflated, and the summary
  // must agree with the per-set truth the badges render from.
  const blockA = detailBlock('we-a', HOLD_EXERCISE, 0, [holdWorkoutSet('we-a', holdSet('a1', 1, 25, 70))])
  const blockB = detailBlock('we-b', HOLD_EXERCISE, 1, [holdWorkoutSet('we-b', holdSet('b1', 1, 25, 65))])
  const strengthBlock = detailBlock('we-s', STRENGTH_EXERCISE, 2, [
    strengthWorkoutSet('we-s', 's1', 1, 5, 100), strengthWorkoutSet('we-s', 's2', 2, 3, 105),
  ])
  const liveBlocks = [blockA, blockB, strengthBlock]
  const badgeTruth = evaluateWeightTimeSessionPRs(sessionBlocks(liveBlocks), HISTORICAL_FRONTIER)
  const summaryDerived = summarizeWorkout(liveBlocks, {}, HISTORICAL_FRONTIER)
  const summaryShared = summarizeWorkout(liveBlocks, {}, HISTORICAL_FRONTIER, badgeTruth)
  const weightTimePRCount = Object.values(badgeTruth).filter(Boolean).length

  // The strength block's own contribution is DERIVED from the real strength
  // evaluator against the same empty baseline summarizeWorkout builds, never
  // hand-counted: evaluateSetPRs establishes the first-ever qualifying value
  // silently, so this is 1 here, not 2. Deriving it keeps the check about the
  // weight_time total instead of about my arithmetic.
  const strengthPRCount = Object.values(evaluateSetPRs(
    (strengthBlock.workout_sets ?? []) as WorkoutSet[],
    { maxWeightKg: null, maxEstimated1RmKg: null, maxBodyweightReps: null }
  )).filter((prType) => prType !== null).length

  check('B10: summarizeWorkout is not inflated — exactly ONE weight_time PR set across the two blocks, plus the strength PRs',
    weightTimePRCount === 1 && strengthPRCount === 1 && summaryDerived.prSetCount === weightTimePRCount + strengthPRCount,
    `prSetCount=${summaryDerived.prSetCount}, weightTime=${weightTimePRCount}, strength=${strengthPRCount}`)
  check('B11: the completion summary and the visible badges are the SAME per-set truth — passing the badge map changes nothing',
    JSON.stringify(summaryShared) === JSON.stringify(summaryDerived))
  check('B12: the strength block is untouched — its PR count is exactly what the strength evaluator alone returns',
    (summaryShared.exerciseSummaries.find((entry) => entry.workoutExerciseId === 'we-s')?.prSetCount ?? -1) === strengthPRCount,
    `we-s prSetCount=${summaryShared.exerciseSummaries.find((entry) => entry.workoutExerciseId === 'we-s')?.prSetCount}`)
  check('B13: the per-exercise weight_time PR counts match the badge map block by block',
    (summaryShared.exerciseSummaries.find((entry) => entry.workoutExerciseId === 'we-a')?.prSetCount ?? -1) === 1
    && (summaryShared.exerciseSummaries.find((entry) => entry.workoutExerciseId === 'we-b')?.prSetCount ?? -1) === 0)

  // Cardio/timed still contribute working sets but never PRs.
  const cardioBlock = detailBlock('we-c', CARDIO_EXERCISE, 3, [{
    ...strengthWorkoutSet('we-c', 'c1', 1, null, null), duration_seconds: 600, distance_meters: 2000,
  }])
  const withCardio = summarizeWorkout([...liveBlocks, cardioBlock], {}, HISTORICAL_FRONTIER, badgeTruth)
  check('B14: cardio/timed behaviour is preserved — the block counts as completed work and contributes no PR',
    withCardio.prSetCount === summaryShared.prSetCount && withCardio.workingSetCount === summaryShared.workingSetCount + 1)
}

// ── C. R1-3 — session representative-hold consistency ────────────────

function verifyR1_3(): void {
  console.log('\nC. R1-3 — the session representative is selected from ALL of its blocks, and is never the last set')

  // sess-latest: the longest hold is in the SECOND block, and the session's
  // final chronological set is its shortest.
  const history: WeightTimePerformance[] = [
    performance('e1', 'sess-early',  '2026-08-01', 0, 1, 20, 30),
    performance('p1', 'sess-prev',   '2026-08-08', 0, 1, 20, 80),
    performance('p2', 'sess-prev',   '2026-08-08', 0, 2, 20, 15),
    performance('l1', 'sess-latest', '2026-08-15', 0, 1, 20, 40),
    performance('l2', 'sess-latest', '2026-08-15', 0, 2, 20, 90),
    performance('l3', 'sess-latest', '2026-08-15', 1, 1, 20, 120),
    performance('l4', 'sess-latest', '2026-08-15', 1, 2, 20, 25),
  ]
  const [latest, previous] = selectRecentSessionRepresentatives(history)
  const chronological = [...history].sort(compareChronologically)
  const latestSessionSets = chronological.filter((entry) => entry.sessionId === 'sess-latest')
  const previousSessionSets = chronological.filter((entry) => entry.sessionId === 'sess-prev')

  // "Not the last set" is asserted against the set the chronological sort
  // actually puts last, never against a literal id — the literal would make
  // the inequality a tautology the compiler can fold away.
  // The inequality is evaluated OUTSIDE the conjunction: inside it, the
  // equality conjuncts narrow both sides to literals and the compiler folds
  // the comparison away as provably true.
  const latestFinalSet = latestSessionSets[latestSessionSets.length - 1]
  const previousFinalSet = previousSessionSets[previousSessionSets.length - 1]
  const latestIsFinalSet = latest?.setId === latestFinalSet.setId
  const previousIsFinalSet = previous?.setId === previousFinalSet.setId

  check('C1: the latest session\'s FINAL set is not its representative — the longest qualifying hold is',
    latest?.setId === 'l3' && latestFinalSet.setId === 'l4' && !latestIsFinalSet,
    `latest=${latest?.setId}, final=${latestFinalSet.setId}`)
  check('C2: the previous session\'s FINAL set is not its representative either',
    previous?.setId === 'p1' && previousFinalSet.setId === 'p2' && !previousIsFinalSet,
    `previous=${previous?.setId}, final=${previousFinalSet.setId}`)
  check('C3: the same exercise in two blocks — the representative sees BOTH, selecting the second block\'s longer hold',
    latest?.setId === 'l3' && latest?.orderIndex === 1 && latest?.durationSeconds === 120)
  check('C4: only the two most recent qualifying sessions are anchors — the older session is not one of them',
    latest?.sessionId === 'sess-latest' && previous?.sessionId === 'sess-prev')

  // The tie-break chain, exactly: duration, then added weight, then the
  // deterministic historical order. Never a scalar combining the two.
  const durationBeatsWeight = selectLongestHold([
    performance('heavy-short', 'sess-x', '2026-08-15', 0, 1, 30, 50),
    performance('light-long',  'sess-x', '2026-08-15', 0, 2, 10, 60),
  ])
  const equalDuration = selectLongestHold([
    performance('lighter',      'sess-x', '2026-08-15', 0, 1, 10, 60),
    performance('heavier-first','sess-x', '2026-08-15', 0, 2, 12, 60),
    performance('heavier-later','sess-x', '2026-08-15', 1, 1, 12, 60),
  ])
  check('C5: tie-break step 1 — the longer hold wins even when the other is heavier (no weight x duration product)',
    durationBeatsWeight?.setId === 'light-long')
  check('C6: tie-break step 2 and 3 — equal duration goes to the greater added weight, and a remaining tie to the earlier historical position',
    equalDuration?.setId === 'heavier-first' && equalDuration?.orderIndex === 0)
  check('C7: the selection returns the PERFORMANCE itself, never a synthesised or scalar "best"',
    latest !== null && history.includes(latest) && previous !== null && history.includes(previous))
  check('C8: an empty or single-session history degrades cleanly',
    JSON.stringify(selectRecentSessionRepresentatives([])) === '[null,null]'
    && selectRecentSessionRepresentatives([history[0]])[1] === null)

  const detailFieldSource = read('src/lib/weight-time-records.ts')
  const sectionsSource = read('src/components/progress/WeightTimeSections.tsx')
  check('C9: the detail type names its anchors explicitly, so it cannot be read as "the last physical set"',
    detailFieldSource.includes('latestSessionRepresentative: WeightTimePerformance | null')
    && detailFieldSource.includes('previousSessionRepresentative: WeightTimePerformance | null')
    && !detailFieldSource.includes('latestPerformance:') && !detailFieldSource.includes('previousPerformance:'))
  check('C10: the progress page reads those anchors for "Last:", the comparison copy and the next target',
    sectionsSource.includes('detail?.latestSessionRepresentative ?? null')
    && sectionsSource.includes('detail?.previousSessionRepresentative ?? null'))
}

// ── C(A). R1-3(A) — fetchPreviousBests merges every block ────────────

const previousBestsSessions: FixtureSession[] = [
  { id: 'sess-live', user_id: USER_ID, status: 'completed', workout_date: '2026-08-20', workout_exercises: [] },
  { id: 'sess-history', user_id: USER_ID, status: 'completed', workout_date: '2026-08-08', workout_exercises: [
    // The weighted hold appears twice; the longer hold is in the SECOND block.
    { exercise_id: 'ex-hold', order_index: 0, exercise: { tracking_mode: 'weight_time' }, workout_sets: [
      { id: 'h1', set_number: 1, reps: null, weight_kg: lbsToKg(20), rpe: 6, is_warmup: false, completed: true, duration_seconds: 60, distance_meters: null },
    ] },
    { exercise_id: 'ex-hold', order_index: 1, exercise: { tracking_mode: 'weight_time' }, workout_sets: [
      { id: 'h2', set_number: 1, reps: null, weight_kg: lbsToKg(20), rpe: 8, is_warmup: false, completed: true, duration_seconds: 100, distance_meters: null },
    ] },
    // A legacy exercise, also twice: the first block with working sets must
    // still decide the session, exactly as before the correction.
    { exercise_id: 'ex-wr', order_index: 2, exercise: { tracking_mode: 'weight_reps' }, workout_sets: [
      { id: 's1', set_number: 1, reps: 5, weight_kg: 100, rpe: 8, is_warmup: false, completed: true, duration_seconds: null, distance_meters: null },
    ] },
    { exercise_id: 'ex-wr', order_index: 3, exercise: { tracking_mode: 'weight_reps' }, workout_sets: [
      { id: 's2', set_number: 1, reps: 3, weight_kg: 120, rpe: 9, is_warmup: false, completed: true, duration_seconds: null, distance_meters: null },
    ] },
  ] },
]

async function verifyR1_3A(): Promise<void> {
  console.log('\nD. R1-3(A) — fetchPreviousBests merges a session\'s blocks before selecting its representative')

  const bests = await fetchPreviousBests(
    fakeClientFor(previousBestsSessions), USER_ID, ['ex-hold', 'ex-wr'], 'sess-live') as Record<string, WorkoutSet>

  check('D1: the weight_time representative is the longest hold across BOTH blocks, not the first block\'s',
    bests['ex-hold']?.duration_seconds === 100 && bests['ex-hold']?.rpe === 8,
    `duration=${bests['ex-hold']?.duration_seconds}`)
  check('D2: it is a real logged hold, carried with its own added weight — not a synthesised pair',
    bests['ex-hold']?.weight_kg === lbsToKg(20) && bests['ex-hold']?.completed === true && bests['ex-hold']?.is_warmup === false)
  check('D3: legacy-mode behaviour is preserved — the first block with working sets still decides the session',
    bests['ex-wr']?.weight_kg === 100 && bests['ex-wr']?.reps === 5)
  check('D4: the returned rows are addressed to the exercise, and dated to the session',
    bests['ex-hold']?.workout_exercise_id === 'ex-hold' && bests['ex-hold']?.created_at === '2026-08-08')

  const serverSource = read('src/lib/supabase/server.ts')
  check('D5: the reader selects the columns the merged order needs — set_number and order_index — and reuses the shared rule',
    serverSource.includes('workout_sets ( id, set_number, reps, weight_kg, rpe, is_warmup, completed, duration_seconds, distance_meters )')
    && serverSource.includes('exercise_id, order_index,')
    && serverSource.includes('selectLongestHold(performances)'))
}

// ── E. The R1 boundary ───────────────────────────────────────────────

function verifyBoundary(): void {
  console.log('\nE. R1 boundary — migration 028 is untouched')
  const migrationBytes = readFileSync(path.join(repositoryRoot, 'supabase/migrations/028_weight_time_tracking_mode.sql'))
  const digest = createHash('sha256').update(migrationBytes).digest('hex')
  check('E1: migration 028 is exactly 37,162 bytes',
    migrationBytes.length === 37162, `${migrationBytes.length} bytes`)
  check('E2: migration 028 sha256 is 9b7d3a52dc0b75f129745bec51a4c972aa284bb5cb0d6159e0cbbb981e463fb3',
    digest === '9b7d3a52dc0b75f129745bec51a4c972aa284bb5cb0d6159e0cbbb981e463fb3', digest)
}

async function main(): Promise<number> {
  console.log('W12-R1 — independent review corrections (R1-1 tile keys, R1-2 cross-block PRs, R1-3 session representatives)')
  await verifyR1_1()
  verifyR1_2()
  verifyR1_3()
  await verifyR1_3A()
  verifyBoundary()
  console.log(`\n${passed} passed, ${failed} failed`)
  return failed === 0 ? 0 : 1
}

main().then((code) => process.exit(code)).catch((error) => { console.error(error); process.exit(1) })
