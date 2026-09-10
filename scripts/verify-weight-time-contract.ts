// ============================================================
// ForgeFitOS — weight_time CONTRACT proof, APPLICATION layer.
// W5: RED-first. Authored BEFORE the route changes, to demonstrate that
//     the CURRENT application code rejects or corrupts the approved
//     weight_time contract. Every check asserts the CONTRACT; PASS means
//     the contract holds on this tree, FAIL means it does not (yet).
// W7: the same checks must go GREEN with no assertion weakened.
// (docs/weight-time-coordinated-implementation-plan.md §12, §16 W5/W7.)
//
// The database-layer half of the contract (append_workout_set, the CHECKs,
// the tracking-mode history guard, the concurrency interleavings) lives in
// scripts/verify-weight-time-contract-live.sh.
//
// HOW IT FINDS THE CONTRACT
//   W7 factors the per-mode set contract out of the two set-writing routes
//   into src/lib/workout-set-contract.ts (pure functions, no Next/Supabase).
//   While that module is absent (W5), the route-level checks evaluate the
//   routes' OWN inline expressions, extracted from source, so the defect is
//   shown executing rather than described.
//
// Never contacts Supabase, Vercel, or any remote service.
// Run from the repository root:
//   npx tsx scripts/verify-weight-time-contract.ts
// ============================================================

import path from 'node:path'
import os from 'node:os'
import { execSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'

import { lbsToKg } from '../src/lib/units'
import { isStrengthRecordTrackingMode } from '../src/lib/strength-records'

const repositoryRoot = process.cwd()
const read = (relativePath: string): string => readFileSync(path.join(repositoryRoot, relativePath), 'utf8')

let passed = 0
let failed = 0
function check(name: string, condition: boolean, detail?: string): void {
  if (condition) { passed += 1; console.log(`  PASS  ${name}`) } else { failed += 1; console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`) }
}

const POST_ROUTE = 'src/app/api/workout-exercises/[id]/sets/route.ts'
const PATCH_ROUTE = 'src/app/api/workout-sets/[id]/route.ts'
const APPLY_ROUTE = 'src/app/api/workout-exercises/[id]/apply-first-set/route.ts'
const EXERCISE_ROUTE = 'src/app/api/exercises/[id]/route.ts'
const CONTRACT_MODULE = 'src/lib/workout-set-contract.ts'
const HISTORY_TOKEN = 'tracking_mode_has_workout_history'
const HISTORY_COPY = 'This exercise has logged sets. Delete its draft sets or keep the current tracking mode.'

type Failure = { ok: false; status: number; error: string }
interface ContractModule {
  MODE_ALLOWED_FIELDS: Record<string, ReadonlySet<string>>
  resolveIncomingWeightKg: (trackingMode: string, body: Record<string, unknown>) => { ok: true; weightKg: number | null | undefined } | Failure
  buildSetInsert: (trackingMode: string, body: Record<string, unknown>) => { ok: true; payload: Record<string, unknown> } | Failure
  buildSetPatch: (trackingMode: string, existing: Record<string, unknown>, body: Record<string, unknown>) => { ok: true; update: Record<string, unknown> } | Failure
  mapWorkoutSetRpcError: (message: string) => { status: number; error: string } | null
  TRACKING_MODE_HISTORY_ERROR_TOKEN: string
  TRACKING_MODE_HISTORY_409_COPY: string
}

/** Extracts and EXECUTES a route's own weight-conversion expression for a given weight_lbs. */
function evaluateRouteWeightExpression(routeText: string, pattern: RegExp, weightLbs: number): unknown {
  const match = pattern.exec(routeText)
  if (!match) return '(expression not found)'
  const expression = match[1]
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const evaluate = new Function('body', 'lbsToKg', `return (${expression})`) as (body: Record<string, unknown>, convert: (lbs: number) => number) => unknown
  return evaluate({ weight_lbs: weightLbs }, lbsToKg)
}

async function loadContractModule(): Promise<ContractModule | null> {
  const modulePath = path.join(repositoryRoot, CONTRACT_MODULE)
  if (!existsSync(modulePath)) return null
  return (await import(modulePath)) as ContractModule
}

// ── Strength-records control fixture (item 9) ───────────────────────────
// A weight_time exercise whose sets WOULD qualify for the strength model
// (weight > 0) if the mode gate let them through.
const USER_ID = 'user-1'
const weightTimeExercise = { id: 'ex-wt', user_id: USER_ID, name: 'Plate-weighted plank', exercise_type: 'strength', tracking_mode: 'weight_time', equipment: 'weight_plate', unilateral: false }
const benchExercise = { id: 'ex-wr', user_id: USER_ID, name: 'Bench Press', exercise_type: 'strength', tracking_mode: 'weight_reps', equipment: 'barbell', unilateral: false }
const sessions = [
  { id: 's1', user_id: USER_ID, status: 'completed', workout_date: '2026-08-01', workout_exercises: [
    { exercise_id: 'ex-wt', exercise: weightTimeExercise, workout_sets: [{ set_number: 1, reps: null, weight_kg: 20, rpe: null, is_warmup: false, completed: true }] },
    { exercise_id: 'ex-wr', exercise: benchExercise, workout_sets: [{ set_number: 1, reps: 5, weight_kg: 100, rpe: 8, is_warmup: false, completed: true }] },
  ] },
  { id: 's2', user_id: USER_ID, status: 'completed', workout_date: '2026-08-08', workout_exercises: [
    { exercise_id: 'ex-wt', exercise: weightTimeExercise, workout_sets: [{ set_number: 1, reps: null, weight_kg: 25, rpe: null, is_warmup: false, completed: true }] },
    { exercise_id: 'ex-wr', exercise: benchExercise, workout_sets: [{ set_number: 1, reps: 5, weight_kg: 105, rpe: 8, is_warmup: false, completed: true }] },
  ] },
]
class FakeQuery {
  private readonly filters: Array<[string, unknown]> = []
  constructor(private readonly table: string) {}
  select(_columns: string): this { return this }
  eq(column: string, value: unknown): this { this.filters.push([column, value]); return this }
  order(_column: string, _options?: unknown): this { return this }
  single(): this { return this }
  then<TResult>(onFulfilled: (value: { data: unknown; error: null }) => TResult): Promise<TResult> {
    if (this.table !== 'workout_sessions') return Promise.resolve({ data: null, error: null }).then(onFulfilled)
    const rows = structuredClone(sessions).filter((session) => session.user_id === this.filters.find(([name]) => name === 'user_id')?.[1] && session.status === 'completed')
    return Promise.resolve({ data: rows, error: null }).then(onFulfilled)
  }
}
const fakeSupabase = { from: (table: string) => new FakeQuery(table) }

function rewriteAliasImports(moduleText: string): string {
  return moduleText.replace(/from (['"])@\/([^'"]+)\1/g, (_whole, quote: string, aliasPath: string) => {
    const base = path.join(repositoryRoot, 'src', aliasPath)
    const resolved = existsSync(`${base}.ts`) ? `${base}.ts` : existsSync(`${base}.tsx`) ? `${base}.tsx` : base
    return `from ${quote}${resolved}${quote}`
  })
}

async function main(): Promise<number> {
  console.log('weight_time CONTRACT proof — application layer (W5 RED-first / W7 GREEN)')
  console.log(`root=${repositoryRoot}`)
  const contract = await loadContractModule()
  console.log(`contract module ${CONTRACT_MODULE}: ${contract ? 'PRESENT (W7)' : 'ABSENT (W5 state — route-level checks evaluate the routes\' own inline expressions)'}`)

  const postRoute = read(POST_ROUTE)
  const patchRoute = read(PATCH_ROUTE)
  const applyRoute = read(APPLY_ROUTE)
  const exerciseRoute = read(EXERCISE_ROUTE)

  console.log('\nA. Zero weight survives as numeric 0 (items 4, 5)')
  if (contract) {
    const zeroLbs = contract.resolveIncomingWeightKg('weight_time', { weight_lbs: 0 })
    const zeroKg = contract.resolveIncomingWeightKg('weight_time', { weight_kg: 0 })
    check('A1: weight_time — 0 lbs resolves to numeric 0 kg, never null', zeroLbs.ok && zeroLbs.weightKg === 0)
    check('A2: weight_time — an explicit weight_kg of 0 stays numeric 0', zeroKg.ok && zeroKg.weightKg === 0)
    const negative = contract.resolveIncomingWeightKg('weight_time', { weight_lbs: -5 })
    check('A3: weight_time — a negative weight is REJECTED (400), not normalised to null', !negative.ok && negative.status === 400)
    const legacyZero = contract.resolveIncomingWeightKg('weight_reps', { weight_lbs: 0 })
    check('A4: legacy weight_reps keeps its existing zero semantics (0 lbs -> null, the value the database contract requires)', legacyZero.ok && legacyZero.weightKg === null)
    const positive = contract.resolveIncomingWeightKg('weight_time', { weight_lbs: 45 })
    check('A5: weight_time — 45 lbs converts through the shared lbsToKg rounding (20.41 kg)', positive.ok && positive.weightKg === Math.round(lbsToKg(45) * 100) / 100)
  } else {
    const postZero = evaluateRouteWeightExpression(postRoute, /if \(typeof body\.weight_lbs === 'number' && (body\.weight_lbs > 0)\)/, 0)
    const patchZero = evaluateRouteWeightExpression(patchRoute, /incomingWeightKg = (body\.weight_lbs > 0 \? Math\.round\(lbsToKg\(body\.weight_lbs\) \* 100\) \/ 100 : null)/, 0)
    check('A1: weight_time — 0 lbs resolves to numeric 0 kg, never null (POST route)', false,
      `the POST route\'s guard \`body.weight_lbs > 0\` evaluates to ${JSON.stringify(postZero)} for 0 lbs, so 0 never reaches storage (weight_kg stays null)`)
    check('A2: weight_time — 0 lbs resolves to numeric 0 kg, never null (PATCH route)', false,
      `the PATCH route\'s expression evaluates to ${JSON.stringify(patchZero)} for 0 lbs`)
    const patchNegative = evaluateRouteWeightExpression(patchRoute, /incomingWeightKg = (body\.weight_lbs > 0 \? Math\.round\(lbsToKg\(body\.weight_lbs\) \* 100\) \/ 100 : null)/, -5)
    check('A3: weight_time — a negative weight is REJECTED, not normalised to null', false,
      `the PATCH route\'s expression evaluates to ${JSON.stringify(patchNegative)} for -5 lbs (silently normalised)`)
    check('A4: legacy weight_reps keeps its existing zero semantics (0 lbs -> null)', patchZero === null)
    check('A5: weight_time — positive weights convert through the shared lbsToKg rounding', false, 'no weight_time conversion path exists')
  }

  console.log('\nB. Field contract at the routes (items 1, 2)')
  const expectedAllowed = ['duration_seconds', 'is_warmup', 'rpe', 'weight_kg', 'weight_lbs']
  if (contract) {
    const allowed = Array.from(contract.MODE_ALLOWED_FIELDS.weight_time ?? []).sort()
    check(`B1: weight_time permits exactly ${JSON.stringify(expectedAllowed)}`, JSON.stringify(allowed) === JSON.stringify(expectedAllowed))
    const withReps = contract.buildSetInsert('weight_time', { reps: 5, weight_lbs: 20, duration_seconds: 60 })
    const withDistance = contract.buildSetInsert('weight_time', { distance_meters: 100, weight_lbs: 20, duration_seconds: 60 })
    check('B2: weight_time forbids reps (400)', !withReps.ok && withReps.status === 400)
    check('B3: weight_time forbids distance_meters (400)', !withDistance.ok && withDistance.status === 400)
    const withWarmupAndRpe = contract.buildSetInsert('weight_time', { weight_lbs: 20, duration_seconds: 60, rpe: 7, is_warmup: true })
    check('B4: weight_time permits optional rpe and is_warmup and carries them into the payload',
      withWarmupAndRpe.ok && withWarmupAndRpe.payload.rpe === 7 && withWarmupAndRpe.payload.is_warmup === true
        && withWarmupAndRpe.payload.reps === null && withWarmupAndRpe.payload.distance_meters === null)
  } else {
    const placeholder = /weight_time: new Set<string>\(\),/.test(postRoute) && /weight_time: new Set<string>\(\),/.test(patchRoute)
    check(`B1: weight_time permits exactly ${JSON.stringify(expectedAllowed)}`, false,
      placeholder ? 'both set routes carry the W4 TEMPORARY empty set: EVERY weight_time field is rejected' : 'no weight_time contract in the routes')
    check('B2: weight_time forbids reps', false, 'unreachable: the routes cannot accept any weight_time set at all')
    check('B3: weight_time forbids distance_meters', false, 'unreachable: the routes cannot accept any weight_time set at all')
    check('B4: weight_time permits optional rpe and is_warmup', false, 'the W4 placeholder rejects rpe and is_warmup with every other field')
  }

  console.log('\nC. Completion semantics (items 3, 6, 7, 8)')
  if (contract) {
    const complete = contract.buildSetInsert('weight_time', { completed: true, weight_lbs: 0, duration_seconds: 60 })
    check('C1: completed weight_time with legal 0 weight and duration 60 is accepted, weight stored as numeric 0', complete.ok && complete.payload.weight_kg === 0 && complete.payload.duration_seconds === 60 && complete.payload.completed === true)
    const noWeight = contract.buildSetInsert('weight_time', { completed: true, duration_seconds: 60 })
    check('C2: completed weight_time WITHOUT a weight is rejected (null weight is not zero weight)', !noWeight.ok && noWeight.status === 400)
    const noDuration = contract.buildSetInsert('weight_time', { completed: true, weight_lbs: 20 })
    check('C3: completed weight_time WITHOUT a duration is rejected', !noDuration.ok && noDuration.status === 400)
    const zeroDuration = contract.buildSetInsert('weight_time', { completed: true, weight_lbs: 20, duration_seconds: 0 })
    const negativeDuration = contract.buildSetInsert('weight_time', { completed: true, weight_lbs: 20, duration_seconds: -5 })
    check('C4: zero or negative duration cannot complete', !zeroDuration.ok && !negativeDuration.ok)
    const partial = contract.buildSetInsert('weight_time', { weight_lbs: 20 })
    check('C5: an INCOMPLETE weight_time set may exist with partial values', partial.ok && partial.payload.completed === false && partial.payload.duration_seconds === null)
    const warmupIncomplete = contract.buildSetInsert('weight_time', { completed: true, is_warmup: true, weight_lbs: 10 })
    const warmupComplete = contract.buildSetInsert('weight_time', { completed: true, is_warmup: true, weight_lbs: 10, duration_seconds: 30 })
    check('C6: a completed WARMUP weight_time set obeys the same weight+duration rule (warmup does not waive it)', !warmupIncomplete.ok && warmupComplete.ok)
    const patchComplete = contract.buildSetPatch('weight_time', { reps: null, weight_kg: 0, rpe: null, is_warmup: false, completed: false, duration_seconds: null, distance_meters: null }, { completed: true })
    check('C7: PATCH completion is validated against the MERGED state — completing a row with weight 0 but no duration is rejected', !patchComplete.ok && patchComplete.status === 400)
    const patchCompleteOk = contract.buildSetPatch('weight_time', { reps: null, weight_kg: 0, rpe: null, is_warmup: false, completed: false, duration_seconds: 45, distance_meters: null }, { completed: true })
    check('C8: PATCH completion succeeds once the merged row has weight (0 is legal) and duration > 0', patchCompleteOk.ok && patchCompleteOk.update.completed === true)
  } else {
    for (const [id, name] of [['C1', 'completed weight_time with legal 0 weight and duration 60 is accepted'], ['C2', 'completed weight_time without a weight is rejected'], ['C3', 'completed weight_time without a duration is rejected'], ['C4', 'zero or negative duration cannot complete'], ['C5', 'an incomplete weight_time set may exist'], ['C6', 'a completed warmup obeys the same rule'], ['C7', 'PATCH completion validated against the merged state'], ['C8', 'PATCH completion succeeds with weight 0 and duration > 0']]) {
      check(`${id}: ${name}`, false, 'no weight_time completion branch exists in either route (the routes only know bodyweight/cardio/timed completion rules)')
    }
  }

  console.log('\nD. The PATCH self-heal can destroy stored dimensions (item 10)')
  const selfHealPresent = /if \(\(existing as any\)\.weight_kg !== null\) update\.weight_kg = null/.test(patchRoute)
    && /self-heals any stale field/.test(patchRoute)
  check('D1: the PATCH route no longer nulls weight_kg / reps / duration / distance / rpe / is_warmup because the exercise\'s mode later differs',
    !selfHealPresent, 'workout-sets/[id]/route.ts still carries the self-heal: a timed-mode PATCH nulls a stored weight_kg (:117) even when the request never touched it')
  if (contract) {
    const staleRow = { reps: null, weight_kg: 20, rpe: 8, is_warmup: false, completed: false, duration_seconds: 30, distance_meters: null }
    const unrelated = contract.buildSetPatch('timed', staleRow, { notes: 'felt strong' })
    check('D2: an unrelated PATCH (notes only) on a row carrying a weight from a former mode updates ONLY notes — weight_kg and rpe are preserved',
      unrelated.ok && JSON.stringify(Object.keys(unrelated.update).sort()) === JSON.stringify(['notes']))
    const durationOnly = contract.buildSetPatch('weight_reps', { reps: 5, weight_kg: 100, rpe: null, is_warmup: false, completed: false, duration_seconds: 30, distance_meters: null }, { reps: 6 })
    check('D3: a reps-only PATCH on a weight_reps row that still carries a duration updates ONLY reps — the stored duration is preserved',
      durationOnly.ok && JSON.stringify(Object.keys(durationOnly.update).sort()) === JSON.stringify(['reps']))
    const weightTimeEdit = contract.buildSetPatch('weight_time', { reps: 5, weight_kg: 20, rpe: null, is_warmup: false, completed: false, duration_seconds: 30, distance_meters: null }, { duration_seconds: 40 })
    check('D4: a weight_time PATCH never erases a stored reps value as incidental cleanup',
      weightTimeEdit.ok && JSON.stringify(Object.keys(weightTimeEdit.update).sort()) === JSON.stringify(['duration_seconds']))
  } else {
    check('D2: an unrelated PATCH preserves stored dimensions from a former mode', false, 'contract module absent; the route\'s self-heal block is the executing behaviour')
    check('D3: a reps-only PATCH preserves a stored duration', false, 'contract module absent')
    check('D4: a weight_time PATCH never erases stored reps', false, 'contract module absent')
  }

  console.log('\nE. Exercise tracking-mode edit is history-guarded at the route (item 11, UX layer)')
  check('E1: PATCH /api/exercises/[id] prechecks CURRENT workout_sets referencing the exercise before a tracking_mode change',
    /workout_sets/.test(exerciseRoute) && /tracking_mode/.test(exerciseRoute) && /409/.test(exerciseRoute),
    'the route has no workout_sets precheck: a mode change is applied regardless of logged sets')
  // (W7 correction to this verifier: written before the contract module
  // existed, E2 assumed the route would carry the token as a literal; the
  // route imports the shared constant instead, and G1 proves that constant
  // IS the token. Either form satisfies the contract.)
  check(`E2: the route maps the database guard's '${HISTORY_TOKEN}' error to 409 (race path)`,
    (exerciseRoute.includes(HISTORY_TOKEN) || (exerciseRoute.includes('TRACKING_MODE_HISTORY_ERROR_TOKEN') && contract?.TRACKING_MODE_HISTORY_ERROR_TOKEN === HISTORY_TOKEN))
      && /includes\(TRACKING_MODE_HISTORY_ERROR_TOKEN\)\)[\s\S]{0,120}status: 409/.test(exerciseRoute),
    'no mapping: a trigger rejection would surface as a generic 500')
  check('E3: the 409 copy speaks of EXTANT sets, not "ever used"', exerciseRoute.includes(HISTORY_COPY) || (contract?.TRACKING_MODE_HISTORY_409_COPY === HISTORY_COPY && exerciseRoute.includes('TRACKING_MODE_HISTORY_409_COPY')),
    'copy absent')
  // RETARGET (W10, 2026-09-10): the copy set moved from the route into the
  // shared contract module (MODE_COPY_FIELDS) so the route and the client
  // read one definition. The historical claim — the W4 placeholder is gone
  // and weight_time copies exactly weight_kg, duration_seconds, rpe — is
  // preserved: it is now proven against the contract module's literal
  // AND against the route importing that constant. Count-neutral.
  const contractText = readFileSync(path.join(repositoryRoot, 'src/lib/workout-set-contract.ts'), 'utf8')
  check('E4: the apply-first-set copy set for weight_time is defined (weight_kg, duration_seconds, rpe), not the W4 placeholder — in the shared contract the route imports',
    /weight_time:\s*\['weight_kg', 'duration_seconds', 'rpe'\]/.test(contractText)
      && /import \{ MODE_COPY_FIELDS \} from '@\/lib\/workout-set-contract'/.test(applyRoute)
      && !/const MODE_COPY_FIELDS/.test(applyRoute)
      && !/W4 TEMPORARY/.test(applyRoute),
    'the weight_time copy set is not the single shared definition (or the W4 TEMPORARY placeholder is back)')

  console.log('\nF. weight_time does not participate in strength/1RM calculations (item 9)')
  check("F1: isStrengthRecordTrackingMode('weight_time') === false (the W3 allowlist)", isStrengthRecordTrackingMode('weight_time') === false)
  const temporaryDirectory = mkdtempSync(path.join(os.tmpdir(), 'w5-contract-'))
  try {
    const liveModule = await import(path.join(repositoryRoot, 'src/lib/strength-records.ts')) as { fetchStrengthRecords: (client: unknown, userId: string) => Promise<{ records: Array<{ exerciseId: string }> }> }
    const liveSummary = await liveModule.fetchStrengthRecords(fakeSupabase, USER_ID)
    check('F2: the live module excludes a weight_time exercise whose sets carry weight > 0 (they would otherwise qualify) and keeps the weight_reps exercise',
      !liveSummary.records.some((record) => record.exerciseId === 'ex-wt') && liveSummary.records.some((record) => record.exerciseId === 'ex-wr'))
    // CONTROL: the pre-W3 denylist module (immutable pin) LEAKS the same fixture into the strength model.
    const beforeText = execSync(`git -C "${repositoryRoot}" show 3a9466356d73310d903e486a00043a5fe34e2f48:src/lib/strength-records.ts`, { encoding: 'utf8' })
    const beforePath = path.join(temporaryDirectory, 'before.ts')
    writeFileSync(beforePath, rewriteAliasImports(beforeText))
    const beforeModule = await import(beforePath) as typeof liveModule
    const beforeSummary = await beforeModule.fetchStrengthRecords(fakeSupabase, USER_ID)
    check('F3 (control): the pre-W3 denylist module from git 3a946635 DOES leak the weight_time exercise into strength records — the fixture is real and the allowlist is what excludes it',
      beforeSummary.records.some((record) => record.exerciseId === 'ex-wt'))
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true })
  }

  console.log('\nG. RPC error mapping (W7)')
  if (contract) {
    check(`G1: the exported history token is '${HISTORY_TOKEN}'`, contract.TRACKING_MODE_HISTORY_ERROR_TOKEN === HISTORY_TOKEN)
    check('G2: mapWorkoutSetRpcError maps invalid_input -> 400, workout_completed -> 409, not_found -> 404, unknown -> null',
      contract.mapWorkoutSetRpcError('P0001: invalid_input')?.status === 400
        && contract.mapWorkoutSetRpcError('workout_completed')?.status === 409
        && contract.mapWorkoutSetRpcError('not_found')?.status === 404
        && contract.mapWorkoutSetRpcError('something else') === null)
  } else {
    check('G1: history error token exported by the contract module', false, 'contract module absent')
    check('G2: RPC error mapping is shared, not duplicated per route', false, 'contract module absent')
  }

  console.log(`\n${passed} passed, ${failed} failed${failed > 0 ? '  (RED: the contract does not hold on this tree)' : '  (GREEN: the contract holds)'}`)
  return failed === 0 ? 0 : 1
}

main().then((code) => process.exit(code)).catch((error) => { console.error(error); process.exit(1) })
