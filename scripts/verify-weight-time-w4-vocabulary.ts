// ============================================================
// ForgeFitOS — W4 verifier: weight_time enters the vocabulary; legacy
// classification is explicit; the INTERMEDIATE state is stated, not hidden.
// (docs/weight-time-coordinated-implementation-plan.md §8.1, §16 W4.)
//
// WHAT W4 DID
//   Added 'weight_time' to the genuine TrackingMode declarations the W1
//   census found (types/database.ts; the three route-local aliases are
//   REPLACED by imports of the shared type), to TRACKING_MODES, to
//   VALID_MODE_FILTERS, and gave deriveLegacyExerciseType an EXPLICIT
//   'weight_time' -> 'strength' arm (Decision 3). It did NOT add the
//   user-facing label (constants.ts, W10), so the mode is not selectable.
//
// ONE DECLARATION DELIBERATELY DEFERRED (flagged at the W7 checkpoint)
//   The seed module's inline four-value union
//   (src/lib/supabase/seed-exercises.ts) is NOT widened. Twenty-two
//   committed evidence suites (EXLIB-1A, 2D–2T and their application
//   records) pin that module BLOB-IDENTICAL to promoted tips; changing a
//   single type annotation would turn all of them permanently red and
//   demand a labelled retarget campaign that W4–W7 does not authorize. The
//   narrower type is semantically valid — no seed row carries the fifth
//   mode; catalog delivery owns those entries — and the census carries the
//   site as PENDING (pin 47) so the decision stays visible. A3 asserts the
//   module is byte-identical to origin/main.
//
// THE INTERMEDIATE STATE, MADE EXPLICIT
//   W4 precedes the storage (W6) and API (W7) contracts. The three
//   Record<TrackingMode, …> maps that TypeScript forces to be total carry a
//   weight_time key that is EMPTY and marked "W4 TEMPORARY, FAIL-CLOSED":
//   every weight_time field is rejected, nothing is admitted. The database
//   CHECK (010/023) still rejects the value until migration 028 exists.
//   Checks C1–C3 below assert exactly that state. When W6/W7 land they
//   RETARGET those checks with a label; until then, a tree where the
//   placeholders quietly became "real" semantics fails here.
//
// Run from the repository root:
//   npx tsx scripts/verify-weight-time-w4-vocabulary.ts
// ============================================================

import path from 'node:path'
import { execSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'

import { TRACKING_MODES, deriveLegacyExerciseType, normalizeExercisePatchPayload } from '../src/lib/exercise-validation'
import { parseTrackingModeFilter } from '../src/lib/progress-overview'

const repositoryRoot = process.cwd()
const read = (relativePath: string): string => readFileSync(path.join(repositoryRoot, relativePath), 'utf8')

let passed = 0
let failed = 0
function check(name: string, condition: boolean): void {
  if (condition) { passed += 1; console.log(`  PASS  ${name}`) } else { failed += 1; console.log(`  FAIL  ${name}`) }
}

const ROUTE_FILES = [
  'src/app/api/workout-exercises/[id]/apply-first-set/route.ts',
  'src/app/api/workout-exercises/[id]/sets/route.ts',
  'src/app/api/workout-sets/[id]/route.ts',
]

console.log('W4 verification — vocabulary + legacy classification (intermediate state explicit)')
console.log(`root=${repositoryRoot}`)

console.log('\nA. Declarations')
const databaseTypes = read('src/types/database.ts')
check("A1: src/types/database.ts declares TrackingMode with 'weight_time' as its fifth member",
  /export type TrackingMode = 'weight_reps' \| 'bodyweight' \| 'cardio' \| 'timed' \| 'weight_time'/.test(databaseTypes))
check('A2: the three route files import the shared TrackingMode and no longer declare a local alias',
  ROUTE_FILES.every((file) => {
    const text = read(file)
    return text.includes("import type { TrackingMode } from '@/types/database'") && !/^\s*type TrackingMode\s*=/m.test(text)
  }))
const seedModule = read('src/lib/supabase/seed-exercises.ts')
const ORIGIN_MAIN = '59e443ba3d75e4b2073d709c07d8b3142201c6bd'
const seedBlobAtOriginMain = execSync(`git -C "${repositoryRoot}" rev-parse ${ORIGIN_MAIN}:src/lib/supabase/seed-exercises.ts`, { encoding: 'utf8' }).trim()
const seedBlobNow = execSync(`git -C "${repositoryRoot}" hash-object src/lib/supabase/seed-exercises.ts`, { encoding: 'utf8' }).trim()
check(`A3 (DEFERRED, flagged): the seed module is byte-identical to origin/main ${ORIGIN_MAIN.slice(0, 8)} — its inline four-value union is deliberately NOT widened in W4 (22 evidence suites pin the blob); the census carries the site as PENDING`,
  seedBlobAtOriginMain === seedBlobNow
    && seedModule.includes('"weight_reps" | "bodyweight" | "cardio" | "timed"')
    && !seedModule.includes('weight_time'))
check("A4: TRACKING_MODES is exactly ['weight_reps','bodyweight','cardio','timed','weight_time'] at runtime",
  JSON.stringify(Array.from(TRACKING_MODES)) === JSON.stringify(['weight_reps', 'bodyweight', 'cardio', 'timed', 'weight_time']))
const patchResult = normalizeExercisePatchPayload({ tracking_mode: 'weight_time' })
check("A5: normalizeExercisePatchPayload accepts tracking_mode 'weight_time' at the API boundary (runtime)",
  patchResult.ok === true && (patchResult as { value: { tracking_mode?: string } }).value.tracking_mode === 'weight_time')
check("A6: normalizeExercisePatchPayload still rejects an unknown mode (runtime, fail closed)",
  normalizeExercisePatchPayload({ tracking_mode: 'weight_distance' }).ok === false)
check("A7: parseTrackingModeFilter('weight_time') === 'weight_time' and an unknown value still falls back to null (runtime)",
  parseTrackingModeFilter('weight_time') === 'weight_time' && parseTrackingModeFilter('bogus') === null)

console.log('\nB. Decision 3 — legacy classification is an EXPLICIT branch')
check("B1: deriveLegacyExerciseType('weight_time') === 'strength' (runtime)",
  deriveLegacyExerciseType('weight_time') === 'strength')
const validationSource = read('src/lib/exercise-validation.ts')
const switchBody = validationSource.slice(validationSource.indexOf('export function deriveLegacyExerciseType'))
const switchEnd = switchBody.indexOf('\n}\n')
const switchText = switchBody.slice(0, switchEnd)
check("B2: the switch carries an explicit `case 'weight_time': return 'strength'` and NO default arm",
  switchText.includes("case 'weight_time': return 'strength'") && !/\bdefault\s*:/.test(switchText))
check('B3: the four existing derivations are unchanged (runtime)',
  deriveLegacyExerciseType('bodyweight') === 'bodyweight' && deriveLegacyExerciseType('cardio') === 'cardio'
    && deriveLegacyExerciseType('timed') === 'mobility' && deriveLegacyExerciseType('weight_reps') === 'strength')

console.log('\nC. Intermediate state — stated, not hidden (W6/W7/W10 RETARGET these with a label)')
// RETARGET (W10, 2026-09-10): at W4 this check pinned the LIVE label list
// as weight_time-free ("not selectable before W10"). W10 is the step that
// makes the mode selectable, so the historical claim is now evaluated
// against the immutable W4 commit object (50e7451c) and the current state
// admits exactly one weight_time entry with the approved label
// "Weight + Time". Count-neutral.
const W4_TIP = '50e7451c9c2ed67053f1aac583187690350ce0f4'
const labelBlockOf = (text: string): string => text.slice(text.indexOf('export const TRACKING_MODES = ['), text.indexOf('] as const', text.indexOf('export const TRACKING_MODES = [')))
const constantsAtW4 = execSync(`git -C "${repositoryRoot}" show ${W4_TIP}:src/lib/constants.ts`, { encoding: 'utf8' })
const liveLabelBlock = labelBlockOf(read('src/lib/constants.ts'))
check("C1 (W10 RETARGET): at the W4 tip 50e7451c TRACKING_MODES did NOT list weight_time (the mode was not selectable before W10); the live list now carries exactly one weight_time entry labelled 'Weight + Time'",
  labelBlockOf(constantsAtW4).length > 0 && !labelBlockOf(constantsAtW4).includes('weight_time')
    && liveLabelBlock.length > 0 && (liveLabelBlock.match(/weight_time/g) ?? []).length === 1
    && /\{ value: 'weight_time', label: 'Weight \+ Time' \}/.test(liveLabelBlock))
// RETARGET (W7): at W4 this check pinned the three EMPTY placeholder keys
// marked "W4 TEMPORARY, FAIL-CLOSED". W7 replaced them with the real
// contract: the two set routes now execute src/lib/workout-set-contract.ts
// (one MODE_ALLOWED_FIELDS map for both), and apply-first-set copies
// weight_kg, duration_seconds and rpe. No placeholder marker may remain.
// RETARGET (W10): the apply-first-set copy list moved INTO the shared
// contract (MODE_COPY_FIELDS) so the route and the client read one
// definition; the same [weight_kg, duration_seconds, rpe] claim is now
// proven against the contract's literal plus the route's import.
const contractModule = read('src/lib/workout-set-contract.ts')
check('C2 (W7 RETARGET, W10 RETARGET): the W4 placeholders are gone — no "W4 TEMPORARY" marker remains under src/, both set routes import the shared contract, and its weight_time allowlist is exactly {weight_lbs, weight_kg, duration_seconds, rpe, is_warmup}; apply-first-set copies [weight_kg, duration_seconds, rpe] through the contract\'s MODE_COPY_FIELDS',
  !ROUTE_FILES.some((file) => read(file).includes('W4 TEMPORARY')) && !contractModule.includes('W4 TEMPORARY')
    && read(ROUTE_FILES[1]).includes("from '@/lib/workout-set-contract'") && read(ROUTE_FILES[2]).includes("from '@/lib/workout-set-contract'")
    && /weight_time: new Set\(\['weight_lbs', 'weight_kg', 'duration_seconds', 'rpe', 'is_warmup'\]\),/.test(contractModule)
    && /weight_time: \['weight_kg', 'duration_seconds', 'rpe'\],/.test(contractModule)
    && read(ROUTE_FILES[0]).includes("import { MODE_COPY_FIELDS } from '@/lib/workout-set-contract'"))
const migrationsDirectory = path.join(repositoryRoot, 'supabase', 'migrations')
const migrationFiles = readdirSync(migrationsDirectory).filter((name) => /^0\d\d_.*\.sql$/.test(name)).sort()
// RETARGET (W6): at W4 this check pinned "no 028 yet — the database still
// refuses weight_time". W6 authored 028, which widens both CHECKs by
// DROP/ADD under their installed names. Migrations 010 and 023 are NOT
// modified in place, so their four-value text remains the historical truth
// of their own files; the widening lives only in 028.
const FOUR_VALUE_CHECK = /CHECK \(tracking_mode IN\s*\('weight_reps',\s*'bodyweight',\s*'cardio',\s*'timed'\)\)/
check('C3 (W6 RETARGET): migration 028 exists exactly once; 010/023 keep their four-value CHECK text unchanged in place; 028 carries the five-value CHECK for both tables',
  migrationFiles.filter((name) => name.startsWith('028_')).length === 1
    && FOUR_VALUE_CHECK.test(read('supabase/migrations/010_phase2r_exercise_tracking_modes.sql'))
    && FOUR_VALUE_CHECK.test(read('supabase/migrations/023_exlib_catalog_and_delivery_contract.sql'))
    && !/weight_time/.test(read('supabase/migrations/010_phase2r_exercise_tracking_modes.sql'))
    && !/weight_time/.test(read('supabase/migrations/023_exlib_catalog_and_delivery_contract.sql'))
    && (read('supabase/migrations/028_weight_time_tracking_mode.sql').match(/CHECK \(tracking_mode IN \('weight_reps', 'bodyweight', 'cardio', 'timed', 'weight_time'\)\)/g) ?? []).length === 2
    && existsSync(path.join(migrationsDirectory, '027_exlib_catalog_content_schema.sql')))

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
