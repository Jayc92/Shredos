// ============================================================
// ForgeFitOS — W3 verifier: strength-records tracking-mode DENYLIST ->
// explicit ALLOWLIST, proven behaviour-equivalent for every currently
// shipped tracking mode.
// (docs/weight-time-coordinated-implementation-plan.md §8.7, §11, §16 W3.)
//
// WHAT CHANGED IN W3
//   src/lib/strength-records.ts used to exclude exercises from the
//   strength/1RM record model with two DENYLISTS
//     if (ex.tracking_mode === 'cardio' || ex.tracking_mode === 'timed') continue
//     .filter(([, meta]) => meta.trackingMode !== 'cardio' && meta.trackingMode !== 'timed')
//   which admit every FUTURE tracking mode by default. W3 replaces both
//   with one explicit ALLOWLIST, STRENGTH_RECORD_TRACKING_MODES =
//   {weight_reps, bodyweight}, consulted through
//   isStrengthRecordTrackingMode(). The change lands BEFORE the
//   TrackingMode union is widened, so the equivalence proof below is a
//   total-case argument over the CLOSED four-value vocabulary.
//
// WHAT THIS SCRIPT PROVES, EXECUTABLY
//   A. Source shape: the allowlist is exactly {weight_reps, bodyweight};
//      both former denylist expressions are gone; both former sites call
//      the allowlist; the census marker is present; the module still
//      never mentions the fifth mode (planning boundary intact). The
//      pre-W3 text fetched from git at BEFORE_COMMIT is identified by
//      CONTENT (it carries both denylists and not the new function), not
//      merely by path.
//   B. Exhaustive predicate table: the live vocabulary TRACKING_MODES is
//      asserted to be exactly the four known values (this proof is valid
//      ONLY over the closed vocabulary and must be re-issued if it
//      changes); for each mode, before = !(m === 'cardio' || m === 'timed')
//      and after = isStrengthRecordTrackingMode(m) must agree.
//   C. Differential run of the REAL module: the pre-W3 module bytes are
//      fetched from git at BEFORE_COMMIT, their '@/' imports rewritten to
//      absolute paths, loaded beside the live module, and BOTH exports
//      (fetchStrengthRecords, fetchExerciseProgressDetail) are executed
//      over an identical fixture through a fake Supabase query builder.
//      Output must be byte-identical JSON. The fixture gives the cardio
//      and timed exercises sets that WOULD qualify absent the mode gate
//      (rows the DB forbids in reality), so exclusion is shown to be by
//      MODE, not by data. Per-mode inclusion before/after is printed.
//   D. Oracle controls: three deliberately broken variants of the LIVE
//      module (allowlist minus bodyweight; minus weight_reps; plus
//      cardio) are run through the same differential and each MUST be
//      detected. Without these, a fixture that never reaches the
//      predicate would pass vacuously.
//
// SCOPE OF THE EQUIVALENCE CLAIM
//   The claim is over the four values the exercises.tracking_mode column
//   can hold (CHECK in 010:26-28, NOT NULL since the same migration).
//   For a value OUTSIDE that set — impossible through the schema — the
//   allowlist excludes where the denylist would have included; that
//   fail-closed difference is the point of the change, and is stated
//   here rather than hidden.
//
// Never contacts Supabase, Vercel, or any remote service.
// Run from the repository root:
//   npx tsx scripts/verify-strength-records-allowlist.ts
// ============================================================

import path from 'node:path'
import os from 'node:os'
import { execSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'

import { TRACKING_MODES } from '../src/lib/exercise-validation'

/** The commit whose tree holds the PRE-W3 module (W2's commit — the parent of W3). Immutable pin. */
const BEFORE_COMMIT = '3a9466356d73310d903e486a00043a5fe34e2f48'
const MODULE_PATH = 'src/lib/strength-records.ts'
const EXPECTED_VOCABULARY: readonly string[] = ['weight_reps', 'bodyweight', 'cardio', 'timed']

const repositoryRoot = process.cwd()

let passed = 0
let failed = 0
function check(name: string, condition: boolean): void {
  if (condition) { passed += 1; console.log(`  PASS  ${name}`) } else { failed += 1; console.log(`  FAIL  ${name}`) }
}

// ── Fixture: one exercise per current tracking mode, plus a unilateral one ─

interface FixtureExercise {
  id: string; user_id: string; name: string; exercise_type: string; tracking_mode: string; equipment: string | null; unilateral: boolean
}
interface FixtureSet { set_number: number; reps: number | null; weight_kg: number | null; rpe: number | null; is_warmup: boolean; completed: boolean }
interface FixtureWorkoutExercise { exercise_id: string; exercise: FixtureExercise; workout_sets: FixtureSet[] }
interface FixtureSession { id: string; user_id: string; status: string; workout_date: string; workout_exercises: FixtureWorkoutExercise[] }

const USER_ID = 'user-1'
const exercisesById: Record<string, FixtureExercise> = {
  'ex-wr':     { id: 'ex-wr',     user_id: USER_ID, name: 'Bench Press',  exercise_type: 'strength',   tracking_mode: 'weight_reps', equipment: 'barbell',   unilateral: false },
  'ex-bw':     { id: 'ex-bw',     user_id: USER_ID, name: 'Pull-up',      exercise_type: 'bodyweight', tracking_mode: 'bodyweight',  equipment: 'bodyweight', unilateral: false },
  'ex-cardio': { id: 'ex-cardio', user_id: USER_ID, name: 'Run',          exercise_type: 'cardio',     tracking_mode: 'cardio',      equipment: null,        unilateral: false },
  'ex-timed':  { id: 'ex-timed',  user_id: USER_ID, name: 'Plank',        exercise_type: 'mobility',   tracking_mode: 'timed',       equipment: 'bodyweight', unilateral: false },
  'ex-uni':    { id: 'ex-uni',    user_id: USER_ID, name: 'Split Squat',  exercise_type: 'strength',   tracking_mode: 'weight_reps', equipment: 'dumbbell',  unilateral: true },
}
const set = (set_number: number, reps: number | null, weight_kg: number | null, rpe: number | null = null, is_warmup = false, completed = true): FixtureSet =>
  ({ set_number, reps, weight_kg, rpe, is_warmup, completed })
const block = (exerciseId: string, workout_sets: FixtureSet[]): FixtureWorkoutExercise =>
  ({ exercise_id: exerciseId, exercise: exercisesById[exerciseId], workout_sets })

// The cardio and timed exercises are given sets that WOULD qualify for the
// strength model (reps > 0 / weight > 0) if only the mode gate let them
// through. The real database forbids such rows; here they prove that
// exclusion happens by MODE, not by absent data.
const sessions: FixtureSession[] = [
  { id: 's1', user_id: USER_ID, status: 'completed', workout_date: '2026-08-01', workout_exercises: [
    block('ex-wr', [set(1, 5, 100, 8), set(2, 3, 105, 9), set(3, 10, 60, null, true), set(4, 1, 110, null, false, false)]),
    block('ex-bw', [set(1, 8, null)]),
    block('ex-cardio', [set(1, 5, 20)]),
    block('ex-uni', [set(1, 8, 20)]),
  ] },
  { id: 's2', user_id: USER_ID, status: 'completed', workout_date: '2026-08-08', workout_exercises: [
    block('ex-wr', [set(1, 3, 110, 9), set(2, 8, 100, 8)]),
    block('ex-bw', [set(1, 10, null)]),
    block('ex-timed', [set(1, null, 30)]),
    block('ex-uni', [set(1, 8, 22.5)]),
  ] },
  { id: 's3', user_id: USER_ID, status: 'completed', workout_date: '2026-08-15', workout_exercises: [
    block('ex-wr', [set(1, 5, 100, 7)]),
    block('ex-wr', [set(1, 5, 102.5, 8)]), // same exercise added twice in one session — exercises the merge path
    block('ex-bw', [set(1, 10, null), set(2, 6, null)]),
    block('ex-cardio', [set(1, 6, 25)]),
    block('ex-timed', [set(1, null, 35)]),
  ] },
  { id: 's4', user_id: USER_ID, status: 'in_progress', workout_date: '2026-08-22', workout_exercises: [
    block('ex-wr', [set(1, 1, 200)]), // must be filtered out by status
  ] },
]

/** Minimal thenable query builder covering exactly the chains strength-records.ts issues. */
class FakeQuery {
  private readonly filters: Array<[string, unknown]> = []
  private wantSingle = false
  constructor(private readonly table: string) {}
  select(_columns: string): this { return this }
  eq(column: string, value: unknown): this { this.filters.push([column, value]); return this }
  order(_column: string, _options?: unknown): this { return this }
  single(): this { this.wantSingle = true; return this }
  private filterValue(column: string): unknown { return this.filters.find(([name]) => name === column)?.[1] }
  private execute(): { data: unknown; error: null } {
    if (this.table === 'exercises') {
      const match = Object.values(exercisesById).find((exercise) => exercise.id === this.filterValue('id') && exercise.user_id === this.filterValue('user_id'))
      return { data: match ? structuredClone(match) : null, error: null }
    }
    if (this.table === 'workout_sessions') {
      const exerciseFilter = this.filterValue('workout_exercises.exercise_id')
      let rows: FixtureSession[] = structuredClone(sessions)
        .filter((session) => session.user_id === this.filterValue('user_id') && session.status === this.filterValue('status'))
      if (exerciseFilter !== undefined) {
        // !inner embed semantics: only sessions containing the exercise, only that exercise's blocks.
        rows = rows
          .map((session) => ({ ...session, workout_exercises: session.workout_exercises.filter((we) => we.exercise_id === exerciseFilter) }))
          .filter((session) => session.workout_exercises.length > 0)
      }
      rows.sort((a, b) => a.workout_date.localeCompare(b.workout_date))
      return { data: this.wantSingle ? rows[0] ?? null : rows, error: null }
    }
    throw new Error(`FakeQuery: unexpected table ${this.table}`)
  }
  then<TResult>(onFulfilled: (value: { data: unknown; error: null }) => TResult): Promise<TResult> {
    return Promise.resolve(this.execute()).then(onFulfilled)
  }
}
const fakeSupabase = { from: (table: string) => new FakeQuery(table) }

// ── Module loading helpers ─────────────────────────────────────────────

interface StrengthRecordsModule {
  fetchStrengthRecords: (supabase: unknown, userId: string) => Promise<unknown>
  fetchExerciseProgressDetail: (supabase: unknown, userId: string, exerciseId: string) => Promise<unknown>
  isStrengthRecordTrackingMode?: (mode: string) => boolean
}

/** Rewrite '@/x' imports to absolute paths so a copy outside src/ resolves the same modules as the live file. */
function rewriteAliasImports(moduleText: string): string {
  return moduleText.replace(/from (['"])@\/([^'"]+)\1/g, (_whole, quote: string, aliasPath: string) => {
    const base = path.join(repositoryRoot, 'src', aliasPath)
    const resolved = existsSync(`${base}.ts`) ? `${base}.ts` : existsSync(`${base}.tsx`) ? `${base}.tsx` : existsSync(path.join(base, 'index.ts')) ? path.join(base, 'index.ts') : base
    return `from ${quote}${resolved}${quote}`
  })
}

async function loadModuleFromText(directory: string, fileName: string, moduleText: string): Promise<StrengthRecordsModule> {
  const filePath = path.join(directory, fileName)
  writeFileSync(filePath, rewriteAliasImports(moduleText))
  return (await import(filePath)) as StrengthRecordsModule
}

async function runEverything(module: StrengthRecordsModule): Promise<{ summary: unknown; details: Record<string, unknown> }> {
  const summary = await module.fetchStrengthRecords(fakeSupabase, USER_ID)
  const details: Record<string, unknown> = {}
  for (const exerciseId of Object.keys(exercisesById)) details[exerciseId] = await module.fetchExerciseProgressDetail(fakeSupabase, USER_ID, exerciseId)
  return { summary, details }
}

interface InclusionRow { exerciseId: string; mode: string; inRecords: boolean; prEvents: number; detailMaxWeightKg: unknown }
function inclusionTable(output: { summary: unknown; details: Record<string, unknown> }): InclusionRow[] {
  const summary = output.summary as { records: Array<{ exerciseId: string }>; recentPREvents: Array<{ exerciseId: string }> }
  return Object.values(exercisesById).map((exercise) => ({
    exerciseId: exercise.id,
    mode: exercise.tracking_mode,
    inRecords: summary.records.some((record) => record.exerciseId === exercise.id),
    prEvents: summary.recentPREvents.filter((event) => event.exerciseId === exercise.id).length,
    detailMaxWeightKg: (output.details[exercise.id] as { maxWeightKg: unknown } | null)?.maxWeightKg ?? null,
  }))
}

// ── Main ───────────────────────────────────────────────────────────────

async function main(): Promise<number> {
  console.log('W3 verification — strength-records tracking-mode denylist -> explicit allowlist')
  console.log(`root=${repositoryRoot}`)
  console.log(`BEFORE_COMMIT=${BEFORE_COMMIT} (pre-W3 module bytes are fetched from this immutable object)`)

  const liveText = readFileSync(path.join(repositoryRoot, MODULE_PATH), 'utf8')
  let beforeText = ''
  try {
    beforeText = execSync(`git -C "${repositoryRoot}" show ${BEFORE_COMMIT}:${MODULE_PATH}`, { encoding: 'utf8' })
  } catch {
    console.log(`  FAIL  could not read ${MODULE_PATH} at ${BEFORE_COMMIT} from git`)
    return 1
  }

  console.log('\nA. Source shape')
  const oldLoopDenylist = "if (ex.tracking_mode === 'cardio' || ex.tracking_mode === 'timed') continue"
  const oldFilterDenylist = ".filter(([, meta]) => meta.trackingMode !== 'cardio' && meta.trackingMode !== 'timed')"
  check('A1: the pre-W3 module (from git) carries BOTH denylists and not the new function — identified by content, not path',
    beforeText.includes(oldLoopDenylist) && beforeText.includes(oldFilterDenylist) && !beforeText.includes('isStrengthRecordTrackingMode'))
  check("A2: the live module defines the allowlist as exactly new Set<TrackingMode>(['weight_reps', 'bodyweight'])",
    liveText.includes("const STRENGTH_RECORD_TRACKING_MODES: ReadonlySet<TrackingMode> = new Set<TrackingMode>(['weight_reps', 'bodyweight'])"))
  check('A3: the live module exports isStrengthRecordTrackingMode',
    liveText.includes('export function isStrengthRecordTrackingMode(trackingMode: TrackingMode): boolean'))
  check('A4: both former denylist expressions are gone and no `=== / !==` comparison against cardio or timed remains anywhere in the module',
    !liveText.includes(oldLoopDenylist) && !liveText.includes(oldFilterDenylist)
      && !/[!=]==\s*'(cardio|timed)'/.test(liveText) && !/'(cardio|timed)'\s*[!=]==/.test(liveText))
  check('A5: both former sites now consult the allowlist',
    liveText.includes('if (!isStrengthRecordTrackingMode(ex.tracking_mode)) continue')
      && liveText.includes('.filter(([, meta]) => isStrengthRecordTrackingMode(meta.trackingMode))'))
  check('A6: the census marker sits directly above the allowlist statement',
    /tracking-mode-census: allowlist — [^\n]+\n(\/\/[^\n]*\n)*const STRENGTH_RECORD_TRACKING_MODES/.test(liveText))
  check('A7: the module still never mentions the fifth mode (planning boundary intact through W3)',
    !liveText.includes('weight' + '_time'))
  check('A8: the live module differs from the pre-W3 module ONLY where W3 intended (no other line changed)',
    (() => {
      const beforeLines = beforeText.split('\n')
      const afterLines = liveText.split('\n')
      const removed = beforeLines.filter((line) => !afterLines.includes(line))
      // Every removed line must be one of the intended edits: the two denylists and the comment/docstring lines they carried.
      const intendedRemovals = [
        oldLoopDenylist.trim(), oldFilterDenylist.trim(),
        "* in a single query + single pass. Exercises of type 'cardio'/", "* 'mobility' are excluded entirely — neither a weight nor a rep-PR",
        '* framing fits them, same reasoning already applied in', '* suggestNextTarget (Phase 2C).',
        '// Phase 2R: cardio/timed excluded entirely -- don\'t even collect', '// their sets. Uses tracking_mode, the behavioral replacement for',
        "// exercise_type's old cardio/mobility check.",
      ]
      return removed.every((line) => intendedRemovals.includes(line.trim()))
    })())

  console.log('\nB. Exhaustive predicate table over the CURRENT (closed) vocabulary')
  const liveVocabulary = Array.from(TRACKING_MODES as readonly string[])
  check(`B1: TRACKING_MODES is exactly ${JSON.stringify(EXPECTED_VOCABULARY)} — this proof is valid only over the closed vocabulary and must be re-issued if it changes`,
    JSON.stringify(liveVocabulary) === JSON.stringify(EXPECTED_VOCABULARY))
  const liveModule = (await import(path.join(repositoryRoot, MODULE_PATH))) as StrengthRecordsModule
  const isStrengthRecordTrackingMode = liveModule.isStrengthRecordTrackingMode
  check('B2: the live module exposes isStrengthRecordTrackingMode at runtime', typeof isStrengthRecordTrackingMode === 'function')
  const beforePredicate = (mode: string): boolean => !(mode === 'cardio' || mode === 'timed') // the former denylist, transcribed
  let allAgree = true
  console.log('      mode         | before (denylist) | after (allowlist)')
  for (const mode of liveVocabulary) {
    const before = beforePredicate(mode)
    const after = isStrengthRecordTrackingMode ? isStrengthRecordTrackingMode(mode) : !before
    if (before !== after) allAgree = false
    console.log(`      ${mode.padEnd(12)} | ${String(before).padEnd(17)} | ${String(after)}`)
  }
  check('B3: before and after agree for every current tracking mode (weight_reps, bodyweight included; cardio, timed excluded)', allAgree)

  console.log('\nC. Differential run of the REAL module (pre-W3 from git vs live) over an identical fixture')
  const temporaryDirectory = mkdtempSync(path.join(os.tmpdir(), 'w3-strength-records-'))
  try {
    const beforeModule = await loadModuleFromText(temporaryDirectory, 'before.ts', beforeText)
    const beforeOutput = await runEverything(beforeModule)
    const afterOutput = await runEverything(liveModule)
    const beforeJson = JSON.stringify(beforeOutput)
    const afterJson = JSON.stringify(afterOutput)
    check('C1: fetchStrengthRecords + fetchExerciseProgressDetail (all five fixture exercises) produce byte-identical JSON before and after', beforeJson === afterJson)
    const beforeRows = inclusionTable(beforeOutput)
    const afterRows = inclusionTable(afterOutput)
    console.log('      exercise   | mode         | in records (before/after) | PR events (before/after) | detail maxWeightKg (before/after)')
    for (let index = 0; index < beforeRows.length; index += 1) {
      const b = beforeRows[index]; const a = afterRows[index]
      console.log(`      ${b.exerciseId.padEnd(10)} | ${b.mode.padEnd(12)} | ${String(b.inRecords).padEnd(5)} / ${String(a.inRecords).padEnd(17)} | ${String(b.prEvents).padEnd(5)} / ${String(a.prEvents).padEnd(16)} | ${String(b.detailMaxWeightKg)} / ${String(a.detailMaxWeightKg)}`)
    }
    check('C2: inclusion — weight_reps and bodyweight exercises ARE in records, cardio and timed are NOT, identically before and after',
      afterRows.every((row) => row.inRecords === (row.mode === 'weight_reps' || row.mode === 'bodyweight'))
        && JSON.stringify(beforeRows) === JSON.stringify(afterRows))
    check('C3: the fixture is non-trivial — the weight_reps exercise produced PR events and the bodyweight exercise produced a rep PR',
      afterRows.find((row) => row.exerciseId === 'ex-wr')!.prEvents > 0 && afterRows.find((row) => row.exerciseId === 'ex-bw')!.prEvents > 0)

    console.log('\nD. Oracle controls — broken allowlists MUST be detected by the same differential')
    const allowlistLine = "new Set<TrackingMode>(['weight_reps', 'bodyweight'])"
    check('D0: the live allowlist expression occurs exactly once (so each control below really rewrites it)', liveText.split(allowlistLine).length === 2)
    const controls: Array<[string, string, string]> = [
      ['D1: allowlist minus bodyweight is detected (bodyweight exercise would vanish from records)', 'broken-no-bodyweight.ts', "new Set<TrackingMode>(['weight_reps'])"],
      ['D2: allowlist minus weight_reps is detected (weight_reps exercises would vanish from records)', 'broken-no-weight-reps.ts', "new Set<TrackingMode>(['bodyweight'])"],
      ['D3: allowlist plus cardio is detected (proves the cardio fixture rows WOULD qualify absent the mode gate — exclusion is by mode, not data)', 'broken-plus-cardio.ts', "new Set<TrackingMode>(['weight_reps', 'bodyweight', 'cardio'])"],
    ]
    for (const [name, fileName, replacement] of controls) {
      const brokenModule = await loadModuleFromText(temporaryDirectory, fileName, liveText.replace(allowlistLine, replacement))
      const brokenJson = JSON.stringify(await runEverything(brokenModule))
      check(name, brokenJson !== beforeJson)
    }
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true })
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  return failed === 0 ? 0 : 1
}

main().then((code) => process.exit(code)).catch((error) => { console.error(error); process.exit(1) })
