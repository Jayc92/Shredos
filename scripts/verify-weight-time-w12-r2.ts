// ============================================================
// ForgeFitOS — W12-R2 verifier: the two narrow disposition corrections.
//
//   R2-1  F5 ruling — BLOCK-LOCAL representative terminology. The
//         per-WorkoutExerciseBlock weight_time comparison is ACCEPTED
//         behaviour; only the language was wrong (it called itself "this
//         session's representativeHold", which it is not). The regression
//         here is the contract, not the rename: duplicate blocks of one
//         exercise MAY show different comparison badges, while their PR
//         badges and the completion summary's PR count both come from the
//         ONE shared session-wide map evaluateWeightTimeSessionPRs
//         produces. No second PR evaluator exists, and aggregating the
//         block-local anchor across duplicate blocks is shown to be a
//         DIFFERENT, wrong answer.
//
//   R2-2  Deterministic same-date session chronology. "The most recent
//         completed session" was decided by `workout_date DESC` alone, so
//         two completed sessions on ONE date were left in PostgREST's
//         incidental row order — "Last:" and the recent-history rows could
//         each pick a different one and contradict each other on the same
//         screen. The approved order is workout_date, then the session's
//         created_at, then its id (DESC for a reverse-chronological read),
//         applied to fetchPreviousBests AND fetchExerciseHistory.
//
// THE ORACLE, and its assumptions — attack these first:
//
//   * The fake query builder records every .order(column, {ascending})
//     call IN CALL ORDER and applies a stable multi-key sort. Ties fall
//     through to fixture insertion order, which stands in for the
//     arbitrary order a real ORDER BY leaves unspecified. Fixtures are
//     therefore deliberately inserted WRONG-ANSWER-FIRST: a reader that
//     drops a key returns the fixture's first row, not the right one.
//   * `honouredOrderClauses: N` honours only the first N clauses. That
//     models the PRE-CORRECTION query exactly and is the positive control
//     — it must reproduce the defect, and reversing insertion order under
//     it must FLIP the answer, which is the nondeterminism itself.
//   * The fake PROJECTS the select string (nested lists included), so a
//     column the real query does not ask for is not visible to the reader
//     under test. This is stricter than the W12-R1 fake on purpose: the
//     R1 review found a tie-break reading a column that was never
//     selected, and a fake that hands over the whole fixture row can
//     never catch that class again.
//   * ORDER BY runs on the FULL rows, before projection — PostgREST can
//     order by an unselected column, so the select pins below are a
//     legibility requirement, separately argued, not a functional one.
//
// Never contacts Supabase, Vercel, or any remote service — every fetch
// helper runs against the fake builder over in-memory fixtures.
// Run from the repository root:
//   npx tsx scripts/verify-weight-time-w12-r2.ts
// ============================================================

import path from 'node:path'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

import {
  evaluateWeightTimeSessionPRs, weightTimePerformancesFromSessionSets, selectLongestHold,
} from '../src/lib/weight-time-records'
import type { WeightTimePoint, WeightTimeSessionBlock } from '../src/lib/weight-time-records'
import { compareWeightTimeSets, pickRepresentativeHold, summarizeWorkout } from '../src/lib/workout'
import type { ExerciseHistoryEntry } from '../src/lib/workout'
import { fetchExerciseHistory, fetchPreviousBests } from '../src/lib/supabase/server'
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
const stripComments = (text: string): string => text.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '')

/** Text of one exported async function, comments already stripped. */
function exportedFunctionSource(strippedSource: string, name: string): string {
  const start = strippedSource.indexOf(`export async function ${name}(`)
  if (start < 0) return ''
  const rest = strippedSource.slice(start)
  const end = rest.indexOf('\nexport ', 1)
  return end < 0 ? rest : rest.slice(0, end)
}

const USER_ID = 'user-w12-r2'
const HOLD_EXERCISE_ID = 'ex-hold'

// ── Fixture builders ─────────────────────────────────────────────────

function exercise(id: string, name: string, trackingMode: TrackingMode): Exercise {
  return {
    id, user_id: USER_ID, name, category: null, primary_muscle: 'chest', secondary_muscles: [],
    equipment: 'barbell', exercise_type: 'strength', tracking_mode: trackingMode, unilateral: false,
    notes: null, is_active: true, is_system: false,
    created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
  }
}

const HOLD_EXERCISE = exercise(HOLD_EXERCISE_ID, 'Weighted Plank', 'weight_time')

/**
 * One qualifying weighted hold as a full WorkoutSet row. Added weight is
 * given in POUNDS and converted by the app's own lbsToKg, so two sets
 * written with the same pound figure are exactly equal in kilograms. The
 * `rpe` is a per-set MARKER, unique inside each fixture: it survives into
 * both readers' outputs, so an assertion can name WHICH set was selected
 * rather than only its weight and duration (two sets can share those).
 */
function holdSet(id: string, setNumber: number, addedWeightLb: number, durationSeconds: number, rpeMarker: number): WorkoutSet {
  return {
    id, workout_exercise_id: `we-${id}`, set_number: setNumber, weight_kg: lbsToKg(addedWeightLb),
    reps: null, rpe: rpeMarker, completed: true, is_warmup: false, notes: null,
    duration_seconds: durationSeconds, distance_meters: null, created_at: '2026-08-01T10:00:00Z',
  }
}

/** One workout_exercises block as the DATABASE returns it (nested rows). */
function holdBlock(orderIndex: number, sets: WorkoutSet[]): Record<string, unknown> {
  return {
    exercise_id: HOLD_EXERCISE_ID,
    order_index: orderIndex,
    exercise: { tracking_mode: 'weight_time' as TrackingMode },
    workout_sets: sets.map((s) => ({
      id: s.id, set_number: s.set_number, reps: s.reps, weight_kg: s.weight_kg, rpe: s.rpe,
      is_warmup: s.is_warmup, completed: s.completed, duration_seconds: s.duration_seconds,
      distance_meters: s.distance_meters,
    })),
  }
}

/** One workout_exercises block for summarizeWorkout (the live-session shape). */
function detailBlock(blockId: string, orderIndex: number, sets: WorkoutSet[]): WorkoutExerciseWithDetails {
  return {
    id: blockId, workout_session_id: 'sess-live', exercise_id: HOLD_EXERCISE_ID, order_index: orderIndex,
    target_sets: null, target_reps: null, target_reps_min: null, target_reps_max: null,
    target_weight_kg: null, notes: null, created_at: '2026-08-15T09:00:00Z', updated_at: '2026-08-15T09:00:00Z',
    exercise: HOLD_EXERCISE, workout_sets: sets,
  }
}

// ── Fake Supabase query builder ──────────────────────────────────────

interface FixtureSession {
  id: string
  user_id: string
  status: string
  workout_date: string
  created_at: string
  workout_exercises: Array<Record<string, unknown>>
}

function completedSession(id: string, workoutDate: string, createdAt: string, blocks: Array<Record<string, unknown>>): FixtureSession {
  return { id, user_id: USER_ID, status: 'completed', workout_date: workoutDate, created_at: createdAt, workout_exercises: blocks }
}

interface FieldSpec { name: string; children: FieldSpec[] | null }

/** The RESULT key of one select item: `exercise:exercises` returns `exercise`. */
function resultKeyOf(token: string): string {
  const trimmed = token.trim()
  const colon = trimmed.indexOf(':')
  return colon < 0 ? trimmed : trimmed.slice(0, colon).trim()
}

/** PostgREST select syntax, only as far as these two readers use it. */
function parseSelect(text: string): FieldSpec[] {
  const specs: FieldSpec[] = []
  let token = ''
  let index = 0
  while (index < text.length) {
    const character = text[index]
    if (character === '(') {
      const innerStart = index + 1
      let depth = 1
      index += 1
      while (index < text.length) {
        if (text[index] === '(') depth += 1
        else if (text[index] === ')') { depth -= 1; if (depth === 0) break }
        index += 1
      }
      specs.push({ name: resultKeyOf(token), children: parseSelect(text.slice(innerStart, index)) })
      token = ''
      index += 1
      while (index < text.length && text[index] !== ',') index += 1
      index += 1
      continue
    }
    if (character === ',') {
      if (token.trim()) specs.push({ name: resultKeyOf(token), children: null })
      token = ''
      index += 1
      continue
    }
    token += character
    index += 1
  }
  if (token.trim()) specs.push({ name: resultKeyOf(token), children: null })
  return specs
}

/** Drop every field the query did not select, at every nesting level. */
function projectSelected(value: unknown, specs: FieldSpec[]): unknown {
  if (Array.isArray(value)) return value.map((entry) => projectSelected(entry, specs))
  if (value === null || typeof value !== 'object') return value
  const source = value as Record<string, unknown>
  const projected: Record<string, unknown> = {}
  for (const spec of specs) {
    if (!(spec.name in source)) continue
    projected[spec.name] = spec.children ? projectSelected(source[spec.name], spec.children) : source[spec.name]
  }
  return projected
}

type FakeSupabaseClient = Parameters<typeof fetchPreviousBests>[0]

/**
 * Covers exactly the chains the two readers under test issue:
 * .select, .eq user_id, .eq status, optional .neq id, .order x N, .limit.
 * `honouredOrderClauses` models a query that issues FEWER order clauses
 * than the corrected one — the positive control for R2-2.
 */
function fakeClientFor(sessions: FixtureSession[], options: { honouredOrderClauses?: number } = {}) {
  class FakeQuery {
    private readonly equalities: Array<[string, unknown]> = []
    private readonly inequalities: Array<[string, unknown]> = []
    private readonly orderClauses: Array<{ column: string; ascending: boolean }> = []
    private selectedFields: FieldSpec[] = []
    private maximumRows: number | null = null
    constructor(private readonly table: string) {}
    select(columns: string): this { this.selectedFields = parseSelect(columns); return this }
    eq(column: string, value: unknown): this { this.equalities.push([column, value]); return this }
    neq(column: string, value: unknown): this { this.inequalities.push([column, value]); return this }
    order(column: string, options_?: { ascending?: boolean }): this {
      this.orderClauses.push({ column, ascending: options_?.ascending ?? true })
      return this
    }
    limit(count: number): this { this.maximumRows = count; return this }
    private equalityValue(column: string): unknown { return this.equalities.find(([name]) => name === column)?.[1] }
    private execute(): { data: unknown; error: null } {
      if (this.table !== 'workout_sessions') throw new Error(`FakeQuery: unexpected table ${this.table}`)
      const honoured = options.honouredOrderClauses === undefined
        ? this.orderClauses
        : this.orderClauses.slice(0, options.honouredOrderClauses)
      const columnOf = (session: FixtureSession, column: string): string => {
        const raw = (session as unknown as Record<string, unknown>)[column]
        return raw === null || raw === undefined ? '' : String(raw)
      }
      let rows = structuredClone(sessions)
        .filter((session) => session.user_id === this.equalityValue('user_id') && session.status === this.equalityValue('status'))
        .filter((session) => this.inequalities.every(([column, value]) => (session as unknown as Record<string, unknown>)[column] !== value))
      // Array.prototype.sort is stable, so rows tied on every HONOURED key
      // keep fixture insertion order — the stand-in for the arbitrary order
      // a real ORDER BY leaves unspecified.
      rows.sort((a, b) => {
        for (const clause of honoured) {
          const comparison = columnOf(a, clause.column).localeCompare(columnOf(b, clause.column))
          if (comparison !== 0) return clause.ascending ? comparison : -comparison
        }
        return 0
      })
      if (this.maximumRows !== null) rows = rows.slice(0, this.maximumRows)
      return { data: projectSelected(rows, this.selectedFields), error: null }
    }
    then<TResult>(onFulfilled: (value: { data: unknown; error: null }) => TResult): Promise<TResult> {
      return Promise.resolve(this.execute()).then(onFulfilled)
    }
  }
  return { from: (table: string) => new FakeQuery(table) } as unknown as FakeSupabaseClient
}

const previousBestOf = async (sessions: FixtureSession[], options: { honouredOrderClauses?: number } = {}): Promise<WorkoutSet | undefined> => {
  const bests = await fetchPreviousBests(
    fakeClientFor(sessions, options), USER_ID, [HOLD_EXERCISE_ID], 'sess-live'
  ) as Record<string, WorkoutSet>
  return bests[HOLD_EXERCISE_ID]
}

const historyOf = async (sessions: FixtureSession[], options: { honouredOrderClauses?: number } = {}, limit = 3): Promise<ExerciseHistoryEntry[]> => {
  const history = await fetchExerciseHistory(
    fakeClientFor(sessions, options), USER_ID, [HOLD_EXERCISE_ID], 'sess-live', limit
  )
  return history[HOLD_EXERCISE_ID] ?? []
}

// ── A. R2-1 — the block-local comparison contract ─────────────────────

// The previous session's representative hold: 20 lb x 1:00. Also the whole
// historical frontier, so every PR verdict below has a real baseline to
// beat and nothing is silently establishing one.
const PREVIOUS_SESSION_REPRESENTATIVE = holdSet('h-prev', 1, 20, 60, 0)
const HISTORICAL_FRONTIER: Record<string, WeightTimePoint[]> = {
  [HOLD_EXERCISE_ID]: [{ weightKg: lbsToKg(20), durationSeconds: 60 }],
}

// The same exercise in THREE workout_exercises blocks of one session.
// Chosen so the block-local badges genuinely disagree AND a favourable
// badge coexists with "not a PR":
//   A  30 lb x 1:30  → badge improved,       PR true
//   B  25 lb x 1:10  → badge improved,       PR FALSE (dominated by A)
//   C  15 lb x 1:05  → badge lighter_longer, PR false (dominated by A)
const BLOCK_A_SET = holdSet('h-a1', 1, 30, 90, 1)
const BLOCK_B_SET = holdSet('h-b1', 1, 25, 70, 2)
const BLOCK_C_SET = holdSet('h-c1', 1, 15, 65, 3)
const duplicateDetailBlocks: WorkoutExerciseWithDetails[] = [
  detailBlock('we-a', 0, [BLOCK_A_SET]),
  detailBlock('we-b', 1, [BLOCK_B_SET]),
  detailBlock('we-c', 2, [BLOCK_C_SET]),
]

/** Exactly the two calls WorkoutExerciseBlock makes, over ONE block's sets. */
function blockLocalBadge(sets: WorkoutSet[]): string {
  return compareWeightTimeSets(pickRepresentativeHold(sets), PREVIOUS_SESSION_REPRESENTATIVE)
}

function sessionBlocksOf(blocks: WorkoutExerciseWithDetails[]): WeightTimeSessionBlock[] {
  return blocks.map((block) => ({
    exerciseId: block.exercise_id,
    trackingMode: block.exercise.tracking_mode,
    sets: (block.workout_sets ?? []) as WorkoutSet[],
  }))
}

async function sectionA(): Promise<void> {
  console.log('\nA. R2-1 — blockRepresentativeHold is block-local, and PR truth is not\n')

  const badges = duplicateDetailBlocks.map((block) => blockLocalBadge(block.workout_sets ?? []))
  const holds = duplicateDetailBlocks.map((block) => pickRepresentativeHold(block.workout_sets ?? []))
  const sharedPRs = evaluateWeightTimeSessionPRs(sessionBlocksOf(duplicateDetailBlocks), HISTORICAL_FRONTIER)

  check('A1: duplicate blocks of ONE exercise may show DIFFERENT block-local comparison badges',
    badges.length === 3 && new Set(badges).size > 1,
    `badges=${JSON.stringify(badges)}`)
  check('A2: each badge is the accepted per-block verdict (A improved, B improved, C lighter_longer)',
    badges[0] === 'improved' && badges[1] === 'improved' && badges[2] === 'lighter_longer',
    JSON.stringify(badges))
  check('A3: each block\'s anchor is that block\'s OWN set, never the session\'s longest hold',
    holds[0]?.id === 'h-a1' && holds[1]?.id === 'h-b1' && holds[2]?.id === 'h-c1',
    JSON.stringify(holds.map((hold) => hold?.id)))

  // The SESSION representative — what progress/history actually read — is
  // selected across every block by fetchPreviousBests' own weight_time arm.
  const asPreviousSession = completedSession('sess-dup', '2026-08-01', '2026-08-01T09:00:00Z', [
    holdBlock(0, [BLOCK_A_SET]), holdBlock(1, [BLOCK_B_SET]), holdBlock(2, [BLOCK_C_SET]),
  ])
  const sessionRepresentative = await previousBestOf([asPreviousSession])
  check('A4: the SESSION representative is chosen across ALL blocks (block A\'s hold), so blocks B and C\'s anchors are provably a different thing',
    sessionRepresentative?.rpe === 1 && sessionRepresentative?.duration_seconds === 90,
    `rpe=${sessionRepresentative?.rpe} duration=${sessionRepresentative?.duration_seconds}`)

  const prTruth = duplicateDetailBlocks.map((block) => sharedPRs[(block.workout_sets ?? [])[0].id] === true)
  check('A5: PR truth comes from the ONE shared session-wide map — exactly one PR across the three blocks',
    Object.values(sharedPRs).filter(Boolean).length === 1 && prTruth[0] && !prTruth[1] && !prTruth[2],
    `map=${JSON.stringify(sharedPRs)}`)
  check('A6: the badge does NOT determine PR truth — blocks A and B share the badge "improved" while only A is a PR',
    badges[0] === badges[1] && prTruth[0] !== prTruth[1])
  check('A7: nor does a favourable badge imply a PR — block C\'s "lighter_longer" and block B\'s "improved" are both non-PRs',
    !prTruth[1] && !prTruth[2] && badges[1] !== badges[2])

  const summary = summarizeWorkout(duplicateDetailBlocks, {}, HISTORICAL_FRONTIER, sharedPRs)
  const summaryWithoutMap = summarizeWorkout(duplicateDetailBlocks, {}, HISTORICAL_FRONTIER)
  check('A8: summarizeWorkout\'s PR count is that same shared map\'s count, not a per-block re-evaluation',
    summary.prSetCount === Object.values(sharedPRs).filter(Boolean).length && summary.prSetCount === 1,
    `prSetCount=${summary.prSetCount}`)
  check('A9: passing the shared map explicitly and letting summarizeWorkout derive it give the identical summary',
    JSON.stringify(summary) === JSON.stringify(summaryWithoutMap))
  check('A10: the per-block PR counts follow the shared map (A 1, B 0, C 0) — never the badges',
    summary.exerciseSummaries.map((entry) => entry.prSetCount).join(',') === '1,0,0',
    summary.exerciseSummaries.map((entry) => entry.prSetCount).join(','))

  // POSITIVE CONTROL for A1/A2: aggregating the anchor across duplicate
  // blocks — the thing the F5 ruling forbids — is a DIFFERENT answer.
  const aggregatedSets = duplicateDetailBlocks.flatMap((block) => block.workout_sets ?? [])
  const aggregatedBadge = blockLocalBadge(aggregatedSets)
  check('A11: control — aggregating the anchor across duplicate blocks collapses all three badges to one, so this fixture would catch that regression',
    aggregatedBadge === 'improved' && new Set([aggregatedBadge, aggregatedBadge, aggregatedBadge]).size === 1 && new Set(badges).size === 2,
    `aggregated=${aggregatedBadge}`)
  check('A12: control — the aggregated anchor is block A\'s set, i.e. blocks B and C would each be described by a hold they did not perform',
    pickRepresentativeHold(aggregatedSets)?.id === 'h-a1')

  // The pooled-performance route fetchPreviousBests uses must agree with
  // the aggregated anchor: one rule, two scopes, never two rules.
  const pooled = duplicateDetailBlocks.flatMap((block, position) => weightTimePerformancesFromSessionSets(
    (block.workout_sets ?? []) as WorkoutSet[], HOLD_EXERCISE_ID,
    { sessionId: 'sess-dup', workoutDate: '2026-08-01', orderIndex: block.order_index ?? position }
  ))
  check('A13: the session-scoped selector (selectLongestHold over pooled performances) and the block-scoped one agree when given the same sets — one rule, two scopes',
    selectLongestHold(pooled)?.setId === pickRepresentativeHold(aggregatedSets)?.id)

  // ── Structural: the terminology the F5 ruling required ──
  const blockSource = read('src/components/workout/WorkoutExerciseBlock.tsx')
  check('A14: WorkoutExerciseBlock names the anchor blockRepresentativeHold and no longer keeps a bare session-suggesting local',
    /const blockRepresentativeHold = isWeightTime \? pickRepresentativeHold\(sets\) : null/.test(blockSource)
      && !/const representativeHold\b/.test(blockSource)
      && !/const previousRepresentativeHold\b/.test(blockSource))
  check('A15: the misleading "This session\'s representativeHold" wording is gone',
    !blockSource.includes("This session's representativeHold"))
  check('A16: the comparison badge is computed from blockRepresentativeHold against the previous SESSION representative, with both names saying their scope',
    /const previousSessionRepresentativeHold = isWeightTime \? previousBest : null/.test(blockSource)
      && /compareWeightTimeSets\(blockRepresentativeHold, previousSessionRepresentativeHold\)/.test(blockSource))
  const contractPoints = [
    'THIS workout_exercises block',
    "ONLY for this block's comparison badge",
    'NOT the session representative',
    'does NOT determine weight_time PR truth',
    "does NOT feed summarizeWorkout's PR count",
  ]
  check('A17: all five contract points are documented at blockRepresentativeHold',
    contractPoints.every((point) => blockSource.includes(point)),
    contractPoints.filter((point) => !blockSource.includes(point)).join(' | '))
  const executableBlock = stripComments(blockSource)
  check('A18: the component contains NO second weight_time PR evaluator — its weight_time arm only maps the parent-computed map onto its own set ids',
    !/evaluateWeightTime(Set|Session)PRs\(|reconstructWeightTimePREvents\(|weightTimeFrontier\(|dominates\(/.test(executableBlock)
      && /setPRs\[s\.id\] = weightTimeSetPRs\?\.\[s\.id\] \? 'weight_time' : null/.test(executableBlock))
  check('A19: the strength scorer stays on the NON-weight_time branch, so it is not a second evaluator for holds either',
    /if \(isWeightTime\) \{[\s\S]*?\} else \{\s*Object\.assign\(setPRs, evaluateSetPRs\(/.test(executableBlock))
  check('A20: the block-local anchor never reaches a scalar scorer or a ProgressSignal',
    !/setScore\(blockRepresentativeHold|progressSignal\(blockRepresentativeHold|classifyTrend\([^)]*blockRepresentativeHold/.test(executableBlock))
  check('A21: pickRepresentativeHold\'s doc no longer claims to be inherently per-session, and states that the scope is the caller\'s',
    /W12-R2-1: the SCOPE is the caller's/.test(read('src/lib/workout.ts')))
}

// ── B. R2-2 — deterministic same-date session chronology ──────────────

// Case A/C fixture. TWO completed sessions on 2026-08-08 (a morning and an
// evening session), plus an older session whose created_at is much NEWER
// than either — the control that workout_date is still the PRIMARY
// dimension. The morning session is listed FIRST on purpose, so incidental
// row order is the WRONG answer.
const AM_SET = holdSet('h-am', 1, 20, 60, 5)
const PM_SET = holdSet('h-pm', 1, 20, 100, 9)
const OLD_SET = holdSet('h-old', 1, 20, 200, 3)
const sameDateSessions: FixtureSession[] = [
  completedSession('sess-am', '2026-08-08', '2026-08-08T08:00:00Z', [holdBlock(0, [AM_SET])]),
  completedSession('sess-pm', '2026-08-08', '2026-08-08T18:00:00Z', [holdBlock(0, [PM_SET])]),
  completedSession('sess-old', '2026-08-01', '2026-08-30T23:00:00Z', [holdBlock(0, [OLD_SET])]),
]
const sameDateSessionsReversed = [...sameDateSessions].reverse()

// Case B fixture. Same workout_date AND the same created_at, so only the
// id can decide. `sess-zzz` must win under id DESC; it is listed SECOND so
// insertion order is again the wrong answer.
const AAA_SET = holdSet('h-aaa', 1, 20, 60, 5)
const ZZZ_SET = holdSet('h-zzz', 1, 20, 111, 9)
const sameInstantSessions: FixtureSession[] = [
  completedSession('sess-aaa', '2026-08-08', '2026-08-08T08:00:00Z', [holdBlock(0, [AAA_SET])]),
  completedSession('sess-zzz', '2026-08-08', '2026-08-08T08:00:00Z', [holdBlock(0, [ZZZ_SET])]),
]

// Case D fixture. One session, one block: longest duration → heavier added
// weight → the LOWER set_number. d2 must win; d4 ties it on duration AND
// weight and loses only on set_number, and d5 is heavier but shorter so no
// weight x duration product can be hiding in the rule.
const D1 = holdSet('h-d1', 1, 20, 100, 1)
const D2 = holdSet('h-d2', 2, 30, 100, 2)
const D3 = holdSet('h-d3', 3, 25, 90, 3)
const D4 = holdSet('h-d4', 4, 30, 100, 4)
const D5 = holdSet('h-d5', 5, 45, 50, 5)
const representativeSets = [D1, D2, D3, D4, D5]
const representativeSessions: FixtureSession[] = [
  completedSession('sess-rep', '2026-08-05', '2026-08-05T09:00:00Z', [holdBlock(0, representativeSets)]),
]
const representativeSessionsReversed: FixtureSession[] = [
  completedSession('sess-rep', '2026-08-05', '2026-08-05T09:00:00Z', [holdBlock(0, [...representativeSets].reverse())]),
]

// Case E fixture. The same exercise in two blocks of one session, the
// longer hold in the SECOND block: a reader that stops at the first block
// returns 60 s.
const POOL_FIRST = holdSet('h-p0', 1, 20, 60, 4)
const POOL_SECOND = holdSet('h-p1', 1, 20, 130, 6)
const poolBlocks = [holdBlock(0, [POOL_FIRST]), holdBlock(1, [POOL_SECOND])]
const poolSessions: FixtureSession[] = [completedSession('sess-pool', '2026-08-07', '2026-08-07T09:00:00Z', poolBlocks)]
const poolSessionsReversed: FixtureSession[] = [completedSession('sess-pool', '2026-08-07', '2026-08-07T09:00:00Z', [...poolBlocks].reverse())]

// Case E, tie form. Two blocks whose holds tie on duration, weight AND
// set_number, so ONLY the visit order can decide — which is why the block
// order is sorted by order_index rather than taken from arrival order.
const TIE_FIRST = holdSet('h-t0', 1, 20, 100, 7)
const TIE_SECOND = holdSet('h-t1', 1, 20, 100, 8)
const tieBlocks = [holdBlock(0, [TIE_FIRST]), holdBlock(1, [TIE_SECOND])]
const blockTieSessions: FixtureSession[] = [completedSession('sess-tie', '2026-08-06', '2026-08-06T09:00:00Z', tieBlocks)]
const blockTieSessionsReversed: FixtureSession[] = [completedSession('sess-tie', '2026-08-06', '2026-08-06T09:00:00Z', [...tieBlocks].reverse())]

async function sectionB(): Promise<void> {
  console.log('\nB. R2-2 — workout_date DESC, created_at DESC, id DESC\n')

  // Case A — same workout_date, different created_at.
  const sameDateBest = await previousBestOf(sameDateSessions)
  const sameDateBestReversed = await previousBestOf(sameDateSessionsReversed)
  check('B1: case A — of two completed sessions on one workout_date, the later created_at is the previous/latest session',
    sameDateBest?.rpe === 9 && sameDateBest?.duration_seconds === 100,
    `rpe=${sameDateBest?.rpe} duration=${sameDateBest?.duration_seconds}`)
  check('B2: case A — and the SAME session wins with the fixture rows inserted in the opposite order, so no incidental row order is being read',
    sameDateBestReversed?.rpe === 9 && sameDateBestReversed?.duration_seconds === 100,
    `rpe=${sameDateBestReversed?.rpe}`)
  check('B3: case A — workout_date stays the PRIMARY dimension: the older-dated session wins nothing despite the newest created_at of the three',
    sameDateBest?.created_at === '2026-08-08' && sameDateBest?.duration_seconds !== 200)

  // POSITIVE CONTROL — the pre-correction query, reproduced.
  const defectAsInserted = await previousBestOf(sameDateSessions, { honouredOrderClauses: 1 })
  const defectReversed = await previousBestOf(sameDateSessionsReversed, { honouredOrderClauses: 1 })
  check('B4: control — with workout_date as the ONLY honoured order key (the pre-correction query) this fixture returns the WRONG session',
    defectAsInserted?.rpe === 5 && defectAsInserted?.duration_seconds === 60,
    `rpe=${defectAsInserted?.rpe}`)
  check('B5: control — and that answer FLIPS with fixture row order, which is the nondeterminism itself, so B1/B2 are not passing by luck',
    defectReversed?.rpe === 9 && defectAsInserted?.rpe !== defectReversed?.rpe)

  // Case B — identical workout_date and created_at: the id decides.
  const tieBest = await previousBestOf(sameInstantSessions)
  const tieBestReversed = await previousBestOf([...sameInstantSessions].reverse())
  check('B6: case B — same workout_date AND same created_at: the id tie-break decides (id DESC → sess-zzz)',
    tieBest?.rpe === 9 && tieBest?.duration_seconds === 111,
    `rpe=${tieBest?.rpe}`)
  check('B7: case B — the id tie-break is deterministic: the same session wins from either insertion order',
    tieBestReversed?.rpe === 9 && tieBest?.rpe === tieBestReversed?.rpe)
  const tieDefect = await previousBestOf(sameInstantSessions, { honouredOrderClauses: 2 })
  check('B8: control — honouring only workout_date and created_at leaves this pair tied and returns the wrong session, so the third clause is load-bearing',
    tieDefect?.rpe === 5, `rpe=${tieDefect?.rpe}`)

  // Case C — the two readers must agree.
  const sameDateHistory = await historyOf(sameDateSessions)
  const sameDateHistoryReversed = await historyOf(sameDateSessionsReversed)
  check('B9: case C — fetchExerciseHistory\'s most-recent row is the SAME session fetchPreviousBests calls the previous best',
    sameDateHistory[0]?.durationSeconds === sameDateBest?.duration_seconds
      && sameDateHistory[0]?.rpe === sameDateBest?.rpe
      && sameDateHistory[0]?.workoutDate === sameDateBest?.created_at,
    `history=${JSON.stringify(sameDateHistory[0])}`)
  check('B10: case C — the whole recent-history ordering is the approved chronology (pm, am, older), not the rows\' arrival order',
    sameDateHistory.map((entry) => entry.rpe).join(',') === '9,5,3',
    sameDateHistory.map((entry) => entry.rpe).join(','))
  check('B11: case C — that ordering is identical with the fixture rows inserted in the opposite order',
    sameDateHistoryReversed.map((entry) => entry.rpe).join(',') === '9,5,3',
    sameDateHistoryReversed.map((entry) => entry.rpe).join(','))
  const historyDefect = await historyOf(sameDateSessions, { honouredOrderClauses: 1 })
  const historyDefectReversed = await historyOf(sameDateSessionsReversed, { honouredOrderClauses: 1 })
  check('B12: control — under the pre-correction single-clause query the two same-date rows swap with insertion order, which is how "Last:" and history could disagree',
    historyDefect.map((entry) => entry.rpe).join(',') === '5,9,3'
      && historyDefectReversed.map((entry) => entry.rpe).join(',') === '9,5,3',
    `${historyDefect.map((entry) => entry.rpe).join(',')} vs ${historyDefectReversed.map((entry) => entry.rpe).join(',')}`)
  const tieHistory = await historyOf(sameInstantSessions)
  check('B13: case C — the readers also agree on the id tie-break, not just the created_at one',
    tieHistory[0]?.rpe === tieBest?.rpe && tieHistory[0]?.durationSeconds === 111)

  // Case D — the representative WITHIN the selected session.
  const representativeBest = await previousBestOf(representativeSessions)
  const representativeBestReversed = await previousBestOf(representativeSessionsReversed)
  const representativeHistory = await historyOf(representativeSessions)
  check('B14: case D — longest duration, then heavier added weight, then the LOWER set_number selects the session\'s representative',
    representativeBest?.rpe === 2 && representativeBest?.duration_seconds === 100 && representativeBest?.weight_kg === lbsToKg(30),
    `rpe=${representativeBest?.rpe} duration=${representativeBest?.duration_seconds}`)
  check('B15: case D — a heavier but SHORTER hold never wins, so no weight x duration scalar is deciding this',
    representativeBest?.weight_kg !== lbsToKg(45) && representativeBest?.duration_seconds !== 50)
  check('B16: case D — the set_number tie-break is a real total order: reversing the sets inside the block picks the same set',
    representativeBestReversed?.rpe === 2, `rpe=${representativeBestReversed?.rpe}`)
  check('B17: case D — fetchExerciseHistory selects the same representative as fetchPreviousBests',
    representativeHistory[0]?.rpe === 2 && representativeHistory[0]?.durationSeconds === 100 && representativeHistory[0]?.weightKg === lbsToKg(30),
    JSON.stringify(representativeHistory[0]))
  // fetchExerciseHistory's tie-break degrades to ARRAY order if set_number
  // is missing from the row — which is the exact latent defect the R1 review
  // surfaced (a tie-break reading a column the query never selected). In the
  // as-inserted fixture array order happens to give the right answer, so the
  // reversed one is the load-bearing case: the tying set with the LOWER
  // set_number arrives LAST there, and only the real rule can find it.
  const representativeHistoryReversed = await historyOf(representativeSessionsReversed)
  check('B18: case D — and it still applies the set_number RULE when the arriving row order contradicts it, rather than degrading to array order',
    representativeHistoryReversed[0]?.rpe === 2 && representativeHistoryReversed[0]?.durationSeconds === 100,
    `rpe=${representativeHistoryReversed[0]?.rpe}`)

  // Case E — several blocks of one exercise pooled before selection.
  const poolBest = await previousBestOf(poolSessions)
  const poolBestReversed = await previousBestOf(poolSessionsReversed)
  const poolHistory = await historyOf(poolSessions)
  const poolHistoryReversed = await historyOf(poolSessionsReversed)
  check('B19: case E — two workout_exercises blocks of one exercise are POOLED before the representative is selected (the longer hold is in the second block)',
    poolBest?.rpe === 6 && poolBest?.duration_seconds === 130,
    `rpe=${poolBest?.rpe} duration=${poolBest?.duration_seconds}`)
  check('B20: case E — fetchExerciseHistory pools the same way and emits ONE row for the session',
    poolHistory.length === 1 && poolHistory[0]?.rpe === 6 && poolHistory[0]?.durationSeconds === 130,
    JSON.stringify(poolHistory))
  check('B21: case E — pooling does not depend on the order the nested blocks arrive in',
    poolBestReversed?.rpe === 6 && poolHistoryReversed[0]?.rpe === 6)

  const tieBlockBest = await previousBestOf(blockTieSessions)
  const tieBlockBestReversed = await previousBestOf(blockTieSessionsReversed)
  const tieBlockHistory = await historyOf(blockTieSessions)
  const tieBlockHistoryReversed = await historyOf(blockTieSessionsReversed)
  check('B22: case E — when two blocks TIE on duration, weight and set_number, the block with the lower order_index wins in both readers',
    tieBlockBest?.rpe === 7 && tieBlockHistory[0]?.rpe === 7,
    `bests=${tieBlockBest?.rpe} history=${tieBlockHistory[0]?.rpe}`)
  check('B23: case E — and that tie resolves the same way with the blocks reversed in the arriving rows',
    tieBlockBestReversed?.rpe === 7 && tieBlockHistoryReversed[0]?.rpe === 7,
    `bests=${tieBlockBestReversed?.rpe} history=${tieBlockHistoryReversed[0]?.rpe}`)
  check('B24: control — the merge helper itself IS visit-order sensitive on that tie (reversed visit order returns the other set), which is why the block order is sorted rather than trusted',
    pickRepresentativeHold([TIE_FIRST, TIE_SECOND])?.rpe === 7 && pickRepresentativeHold([TIE_SECOND, TIE_FIRST])?.rpe === 8)

  // ── Structural: the three order clauses, pinned ──
  const serverExecutable = stripComments(read('src/lib/supabase/server.ts'))
  const previousBestsSource = exportedFunctionSource(serverExecutable, 'fetchPreviousBests')
  const historySource = exportedFunctionSource(serverExecutable, 'fetchExerciseHistory')
  const APPROVED_ORDER = /\.order\('workout_date', \{ ascending: false \}\)\s*\.order\('created_at', \{ ascending: false \}\)\s*\.order\('id', \{ ascending: false \}\)/
  check('B25: both function bodies were located for the structural pins',
    previousBestsSource !== '' && historySource !== '')
  check('B26: fetchPreviousBests orders workout_date DESC, then created_at DESC, then id DESC — consecutively and in that order',
    APPROVED_ORDER.test(previousBestsSource))
  check('B27: fetchExerciseHistory orders by the identical three clauses',
    APPROVED_ORDER.test(historySource))
  check('B28: neither reader has any OTHER order clause that could take precedence — exactly three each',
    (previousBestsSource.match(/\.order\(/g) ?? []).length === 3 && (historySource.match(/\.order\(/g) ?? []).length === 3,
    `${(previousBestsSource.match(/\.order\(/g) ?? []).length} / ${(historySource.match(/\.order\(/g) ?? []).length}`)
  check('B29: the two readers\' order clauses are the same SOURCE TEXT, so they cannot drift apart into disagreeing',
    (previousBestsSource.match(APPROVED_ORDER) ?? [''])[0] === (historySource.match(APPROVED_ORDER) ?? ['x'])[0])
  check('B30: both selects include created_at, so the ordering is legible in the rows the query returns and not only in the query',
    /\bid, workout_date, created_at,/.test(previousBestsSource) && /\bid, workout_date, created_at,/.test(historySource))
  check('B31: fetchPreviousBests still selects the set id and set_number its tie-break reads',
    /workout_sets \( id, set_number,/.test(previousBestsSource))
  check('B32: fetchExerciseHistory selects set_number — the column its representative tie-break reads and which it previously never asked for',
    /workout_sets \( set_number,/.test(historySource))
  check('B33: both selects include the block order_index the cross-block ordering needs',
    /exercise_id, order_index,/.test(previousBestsSource) && /exercise_id, order_index,/.test(historySource))
  check('B34: fetchExerciseHistory visits blocks in order_index order rather than arrival order',
    /\.sort\(\(a, b\) => \(a\.order_index \?\? 0\) - \(b\.order_index \?\? 0\)\)/.test(historySource))
  check('B35: workout_date remains the date dimension of an emitted previous-best row — created_at was added for ORDERING, it did not replace it',
    /created_at: session\.workout_date,/.test(previousBestsSource)
      && /workoutDate: session\.workout_date,/.test(historySource))
}

// ── C. The R2 boundary — migration 028 is frozen ─────────────────────

const MIGRATION_PATH = 'supabase/migrations/028_weight_time_tracking_mode.sql'
const MIGRATION_BYTES = 37162
const MIGRATION_SHA256 = '9b7d3a52dc0b75f129745bec51a4c972aa284bb5cb0d6159e0cbbb981e463fb3'

function sectionC(): void {
  console.log('\nC. R2 boundary — migration 028 unchanged\n')
  const migration = readFileSync(path.join(repositoryRoot, MIGRATION_PATH))
  check(`C1: ${MIGRATION_PATH} is still ${MIGRATION_BYTES} bytes`,
    migration.byteLength === MIGRATION_BYTES, `${migration.byteLength} bytes`)
  check('C2: and byte-identical by sha256 to its approved, frozen state',
    createHash('sha256').update(migration).digest('hex') === MIGRATION_SHA256,
    createHash('sha256').update(migration).digest('hex'))
}

async function main(): Promise<void> {
  console.log('W12-R2 verifier — the two disposition corrections\n')
  await sectionA()
  await sectionB()
  sectionC()
  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main().then(() => process.exit(failed > 0 ? 1 : 0)).catch((error) => { console.error(error); process.exit(1) })
