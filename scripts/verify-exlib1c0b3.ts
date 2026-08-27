// ============================================================
// ForgeFitOS — EXLIB-1C0B3 coordinated equipment implementation
// harness. Proves migration 025 (DRAFT — NOT APPLIED) replaces
// exactly the two installed equipment CHECK constraints atomically
// with old-plus-four vocabularies, that every product consumer
// (types, validation, labels, selectors, Smith-machine progression)
// ships coordinated in the same worktree, that the live disposable
// suite gates on exact fingerprints, and that nothing else moved:
// manifest/ledger frozen, 26 candidates import-ineligible, no
// weight_time, no catalog data, no hosted-service contact.
// Run from the repository root:
//   npx tsx scripts/verify-exlib1c0b3.ts
// ============================================================

import { readFileSync, readdirSync, existsSync } from 'fs'
import { execSync } from 'child_process'
import { createHash } from 'crypto'

let passed = 0
let failed = 0
function check(name: string, condition: boolean, detail?: string) {
  if (condition) { passed++; console.log(`  PASS  ${name}`) }
  else { failed++; console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`) }
}
const read = (p: string) => readFileSync(p, 'utf8')
const sha256 = (p: string) => createHash('sha256').update(readFileSync(p)).digest('hex')

const B2_COMMIT = '360ccd24ac1529c910fc58744be71b3bf9838af3'
const B2_RECORD_SHA = '6b9e813ad625cb21a8be5a4992d94da7d45f149f3e824388190bb0292da1e64d'
const B2_VERIFIER_SHA = 'c8f20346ad02c3f5a2af3edf013ebb051fdcef103e160ff8b50f06c8500c03da'
const MANIFEST_SHA = '336cd4253f747cdb3ba73ffa2af5a63e255c7c87cc452d4c43ed59a654673dfa'
const LEDGER_SHA = 'aa4fe77c0c633510661eede94b40e9bae4aca90a7d8c2794abde92c83c6f7b7b'
const M023_SHA = '0991448c39a558385431c78cef6d6063df208312a3f53866756ba730066c42f2'
const M024_SHA = '190550ecdb99df702ab03d1b07592f861070141e5091eb25bc5bf45f211cc980'
const M025_FILE = 'supabase/migrations/025_exlib_equipment_vocabulary_support.sql'
// Within-phase correction (EXLIB-1C0B3 direct review): NOTIFY
// removed from 025; fingerprint advanced to the corrected bytes.
const M025_SHA = 'fbda16f4d25cacd1715b199050506a4da15896355d96700876b76c68826d304c'
const M025_BYTES = 3587
const LIVE_SCRIPT = 'scripts/verify-exlib1c0b3-live.sh'
const OLD_VALUES = ['barbell', 'dumbbell', 'cable', 'machine',
  'bodyweight', 'resistance_band', 'kettlebell', 'other']
const NEW_VALUES = ['weight_plate', 'weighted_vest', 'smith_machine', 'sandbag']
const ALL_VALUES = [...OLD_VALUES, ...NEW_VALUES]
const LABELS: Array<[string, string]> = [
  ['weight_plate', 'Weight Plate'], ['weighted_vest', 'Weighted Vest'],
  ['smith_machine', 'Smith Machine'], ['sandbag', 'Sandbag']]
const OLD_LABELS: Array<[string, string]> = [
  ['barbell', 'Barbell'], ['dumbbell', 'Dumbbell'], ['cable', 'Cable'],
  ['machine', 'Machine'], ['bodyweight', 'Bodyweight'],
  ['resistance_band', 'Band'], ['kettlebell', 'Kettlebell'], ['other', 'Other']]

const m025 = read(M025_FILE)
const m025Exec = m025.split('\n')
  .map((l) => l.replace(/--.*$/, '').trim()).filter(Boolean).join('\n')
const dbTypes = read('src/types/database.ts')
const validation = read('src/lib/exercise-validation.ts')
const constants = read('src/lib/constants.ts')
const workout = read('src/lib/workout.ts')
const live = read(LIVE_SCRIPT)

// LINE-EXACT map of every tracked modification in this phase
// (admissions, retargets, and the four coordinated product edits),
// generated mechanically from the reviewed worktree diffs.
const DIFF_MAP: Record<string, { adds: string[]; dels: string[] }> =
  JSON.parse("{\"scripts/verify-exlib1a.ts\":{\"adds\":[\".every((f) => f === 'supabase/migrations/023_exlib_catalog_and_delivery_contract.sql' ||\",\"/* ADMISSION (EXLIB-1C0B3): the authorized coordinated\",\"equipment-vocabulary product changes are admitted\",\"while uncommitted (exact four paths only). */\",\"f === 'src/types/database.ts' ||\",\"f === 'src/lib/exercise-validation.ts' ||\",\"f === 'src/lib/constants.ts' ||\",\"f === 'src/lib/workout.ts')\",\"// RETARGET (EXLIB-1C0B3 migration 025 draft): the authorized\",\"// equipment-vocabulary draft is the only permitted 025\",\"// (DRAFT, not applied); exactly-24 becomes exactly-25 with\",\"// 024 and 025 both pinned.\",\"return files.length === 25 && m022.length === 19112 &&\",\"files.includes('024_exlib_post_application_hardening.sql') &&\",\"files.filter((f) => f.startsWith('025')).length === 1 &&\",\"files.includes('025_exlib_equipment_vocabulary_support.sql')\",\"// ADMISSION (EXLIB-1C0B3): the authorized migration-025\",\"// draft and the coordinated equipment-vocabulary product\",\"// changes are admitted while uncommitted.\",\"f === 'supabase/migrations/025_exlib_equipment_vocabulary_support.sql' ||\",\"f === 'src/types/database.ts' ||\",\"f === 'src/lib/exercise-validation.ts' ||\",\"f === 'src/lib/constants.ts' ||\",\"f === 'src/lib/workout.ts' ||\",\"// ADMISSION (EXLIB-1C0B3): the implementation record and\",\"// local-only guard are admitted while uncommitted.\",\"f.startsWith('docs/exlib1c0b3-') ||\"],\"dels\":[\".every((f) => f === 'supabase/migrations/023_exlib_catalog_and_delivery_contract.sql')\",\"return files.length === 24 && m022.length === 19112 &&\",\"files.includes('024_exlib_post_application_hardening.sql')\"]},\"scripts/verify-exlib1b1.ts\":{\"adds\":[\"// RETARGET (EXLIB-1C0B3 migration 025 draft): the authorized\",\"// equipment-vocabulary draft is the only permitted 025 (DRAFT,\",\"// not applied); the boundary moves from exactly-24 to\",\"// exactly-25 with 024 and 025 both pinned.\",\"readdirSync('supabase/migrations').filter((f) => f.startsWith('025')).length === 1 &&\",\"readdirSync('supabase/migrations').some((f) => f === '025_exlib_equipment_vocabulary_support.sql') &&\",\"readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).length === 25)\",\".every((f) => f === 'supabase/migrations/023_exlib_catalog_and_delivery_contract.sql' ||\",\"/* ADMISSION (EXLIB-1C0B3): the authorized coordinated\",\"equipment-vocabulary product changes are admitted\",\"while uncommitted (exact four paths only). */\",\"f === 'src/types/database.ts' ||\",\"f === 'src/lib/exercise-validation.ts' ||\",\"f === 'src/lib/constants.ts' ||\",\"f === 'src/lib/workout.ts')\",\"// ADMISSION (EXLIB-1C0B3): the authorized migration-025\",\"// draft and the coordinated equipment-vocabulary product\",\"// changes are admitted while uncommitted.\",\"f === 'supabase/migrations/025_exlib_equipment_vocabulary_support.sql' ||\",\"f === 'src/types/database.ts' ||\",\"f === 'src/lib/exercise-validation.ts' ||\",\"f === 'src/lib/constants.ts' ||\",\"f === 'src/lib/workout.ts' ||\",\"// ADMISSION (EXLIB-1C0B3): the implementation record and\",\"// local-only guard are admitted while uncommitted.\",\"f.startsWith('docs/exlib1c0b3-') ||\"],\"dels\":[\"readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).length === 24)\",\".every((f) => f === 'supabase/migrations/023_exlib_catalog_and_delivery_contract.sql')\"]},\"scripts/verify-exlib1b2.ts\":{\"adds\":[\"// RETARGET (EXLIB-1C0B3 migration 025 draft): the authorized\",\"// equipment-vocabulary draft joins the boundary (DRAFT, not\",\"// applied); exactly-24 becomes exactly-25 with 024 and 025\",\"// both pinned.\",\"files.length === 25 &&\",\"files[24] === '025_exlib_equipment_vocabulary_support.sql' &&\",\"// ADMISSION (EXLIB-1C0B3): the authorized coordinated\",\"// equipment-vocabulary product changes are admitted while\",\"// uncommitted (exact four paths only).\",\"{ encoding: 'utf8' }).trim().split('\\\\n').filter(Boolean)\",\".every((f) => f === 'src/types/database.ts' ||\",\"f === 'src/lib/exercise-validation.ts' ||\",\"f === 'src/lib/constants.ts' || f === 'src/lib/workout.ts')\"],\"dels\":[\"files.length === 24 &&\",\"{ encoding: 'utf8' }).trim() === ''\"]},\"scripts/verify-exlib1b3.ts\":{\"adds\":[\"// RETARGET (EXLIB-1C0B3 migration 025 draft): the authorized\",\"// equipment-vocabulary draft is the only permitted 025\",\"// (DRAFT, not applied); exactly-24 becomes exactly-25 with\",\"// 024 and 025 both pinned.\",\"return files.length === 25 &&\",\"files.filter((f) => f === '025_exlib_equipment_vocabulary_support.sql').length === 1 &&\",\"// ADMISSION (EXLIB-1C0B3): the authorized coordinated\",\"// equipment-vocabulary product changes are admitted while\",\"// uncommitted (exact four paths only).\",\"{ encoding: 'utf8' }).trim().split('\\\\n').filter(Boolean)\",\".every((f) => f === 'src/types/database.ts' ||\",\"f === 'src/lib/exercise-validation.ts' ||\",\"f === 'src/lib/constants.ts' || f === 'src/lib/workout.ts')\",\"// ADMISSION (EXLIB-1C0B3): the authorized migration-025\",\"// draft and the coordinated equipment-vocabulary product\",\"// changes are admitted while uncommitted.\",\"f === 'supabase/migrations/025_exlib_equipment_vocabulary_support.sql' ||\",\"f === 'src/types/database.ts' ||\",\"f === 'src/lib/exercise-validation.ts' ||\",\"f === 'src/lib/constants.ts' ||\",\"f === 'src/lib/workout.ts' ||\",\"// ADMISSION (EXLIB-1C0B3): the implementation record and\",\"// local-only guard are admitted while uncommitted.\",\"f.startsWith('docs/exlib1c0b3-') ||\"],\"dels\":[\"return files.length === 24 &&\",\"{ encoding: 'utf8' }).trim() === ''\"]},\"scripts/verify-exlib1c0.ts\":{\"adds\":[\"// RETARGET (EXLIB-1C0B3 migration 025 draft): the authorized\",\"// equipment-vocabulary draft is the only permitted 025\",\"// (DRAFT, not applied; 3,587 bytes, sha256\",\"// fbda16f4d25cacd1715b199050506a4da15896355d96700876b76c68826d304c);\",\"// exactly-24 becomes exactly-25 with 024 and 025 pinned.\",\"return files.length === 25 &&\",\"files.filter((f) => f.startsWith('025')).length === 1 &&\",\"files.includes('025_exlib_equipment_vocabulary_support.sql') &&\",\"// ADMISSION (EXLIB-1C0B3): the authorized coordinated\",\"// equipment-vocabulary product changes are admitted while\",\"// uncommitted (exact four paths only).\",\"{ encoding: 'utf8' }).trim().split('\\\\n').filter(Boolean)\",\".every((f) => f === 'src/types/database.ts' ||\",\"f === 'src/lib/exercise-validation.ts' ||\",\"f === 'src/lib/constants.ts' || f === 'src/lib/workout.ts') &&\",\"// ADMISSION (EXLIB-1C0B3): the authorized migration-025\",\"// draft, its live suite and verifier, and the\",\"// coordinated product changes are admitted while\",\"// uncommitted.\",\"if (f === 'supabase/migrations/025_exlib_equipment_vocabulary_support.sql' ||\",\"f === 'scripts/verify-exlib1c0b3-live.sh' ||\",\"f === 'scripts/verify-exlib1c0b3.ts' ||\",\"f === 'src/types/database.ts' ||\",\"f === 'src/lib/exercise-validation.ts' ||\",\"f === 'src/lib/constants.ts' ||\",\"f === 'src/lib/workout.ts') return false\",\"// ADMISSION (EXLIB-1C0B3): the implementation record and\",\"// local-only guard are admitted while uncommitted.\",\"if (f.startsWith('docs/exlib1c0b3-') ||\",\"f === 'scripts/verify-exlib1c0b3-guard.sh') return false\",\"// ADMISSION (EXLIB-1C0B3): accept this phase's\",\"// admission and retarget labels too.\",\"return !/ADMISSION \\\\(EXLIB-1C0A\\\\)|ADMISSION \\\\(EXLIB-1C0B\\\\)|ADMISSION \\\\(EXLIB-1C0B2\\\\)|ADMISSION \\\\(EXLIB-1C0B3\\\\)|RETARGET \\\\(EXLIB-1C0B3 migration 025 draft\\\\)/.test(\",\"// RETARGET (EXLIB-1C0B3 migration 025 draft): the authorized\",\"// draft is the only permitted 025.\",\"readdirSync('supabase/migrations').filter((f) => f.startsWith('025'))\",\".every((f) => f === '025_exlib_equipment_vocabulary_support.sql'))\"],\"dels\":[\"return files.length === 24 &&\",\"files.filter((f) => f.startsWith('025')).length === 0 &&\",\"{ encoding: 'utf8' }).trim() === '' &&\",\"return !/ADMISSION \\\\(EXLIB-1C0A\\\\)|ADMISSION \\\\(EXLIB-1C0B\\\\)|ADMISSION \\\\(EXLIB-1C0B2\\\\)/.test(\",\"readdirSync('supabase/migrations').every((f) => !f.startsWith('025')))\"]},\"scripts/verify-exlib1c0a.ts\":{\"adds\":[\"// RETARGET (EXLIB-1C0B3 migration 025 draft): the authorized\",\"// equipment-vocabulary draft is the only permitted 025\",\"// (DRAFT, not applied); exactly-24 becomes exactly-25 with\",\"// 024 and 025 pinned.\",\"return files.length === 25 &&\",\"files.filter((f) => f.startsWith('025')).length === 1 &&\",\"files.includes('025_exlib_equipment_vocabulary_support.sql') &&\",\"// ADMISSION (EXLIB-1C0B3): the authorized coordinated\",\"// equipment-vocabulary product changes are admitted while\",\"// uncommitted (exact four paths only).\",\"{ encoding: 'utf8' }).trim().split('\\\\n').filter(Boolean)\",\".every((f) => f === 'src/types/database.ts' ||\",\"f === 'src/lib/exercise-validation.ts' ||\",\"f === 'src/lib/constants.ts' || f === 'src/lib/workout.ts') &&\",\"// ADMISSION (EXLIB-1C0B3): the authorized migration-025\",\"// draft, its live suite and verifier, and the\",\"// coordinated product changes are admitted while\",\"// uncommitted.\",\"if (f === 'supabase/migrations/025_exlib_equipment_vocabulary_support.sql' ||\",\"f === 'scripts/verify-exlib1c0b3-live.sh' ||\",\"f === 'scripts/verify-exlib1c0b3.ts' ||\",\"f === 'src/types/database.ts' ||\",\"f === 'src/lib/exercise-validation.ts' ||\",\"f === 'src/lib/constants.ts' ||\",\"f === 'src/lib/workout.ts') return false\",\"// ADMISSION (EXLIB-1C0B3): the implementation record and\",\"// local-only guard are admitted while uncommitted.\",\"if (f.startsWith('docs/exlib1c0b3-') ||\",\"f === 'scripts/verify-exlib1c0b3-guard.sh') return false\",\"// ADMISSION (EXLIB-1C0B3): accept this phase's\",\"// admission and retarget labels too.\",\"return !/ADMISSION \\\\(EXLIB-1C0B\\\\)|ADMISSION \\\\(EXLIB-1C0B2\\\\)|ADMISSION \\\\(EXLIB-1C0B3\\\\)|RETARGET \\\\(EXLIB-1C0B3 migration 025 draft\\\\)/.test(\",\"// RETARGET (EXLIB-1C0B3 migration 025 draft): the authorized\",\"// draft is the only permitted 025.\",\"readdirSync('supabase/migrations').filter((f) => f.startsWith('025'))\",\".every((f) => f === '025_exlib_equipment_vocabulary_support.sql'))\"],\"dels\":[\"return files.length === 24 &&\",\"files.filter((f) => f.startsWith('025')).length === 0 &&\",\"{ encoding: 'utf8' }).trim() === '' &&\",\"return !/ADMISSION \\\\(EXLIB-1C0B\\\\)|ADMISSION \\\\(EXLIB-1C0B2\\\\)/.test(\",\"readdirSync('supabase/migrations').every((f) => !f.startsWith('025')))\"]},\"scripts/verify-exlib1c0b.ts\":{\"adds\":[\"// RETARGET (EXLIB-1C0B3 migration 025 draft): the authorized\",\"// equipment-vocabulary draft is the only permitted 025\",\"// (DRAFT, not applied); exactly-24 becomes exactly-25 with\",\"// 024 and 025 pinned.\",\"return files.length === 25 &&\",\"files.filter((f) => f.startsWith('025')).length === 1 &&\",\"files.includes('025_exlib_equipment_vocabulary_support.sql') &&\",\"// ADMISSION (EXLIB-1C0B3): the authorized coordinated\",\"// equipment-vocabulary product changes are admitted while\",\"// uncommitted (exact four paths only).\",\"{ encoding: 'utf8' }).trim().split('\\\\n').filter(Boolean)\",\".every((f) => f === 'src/types/database.ts' ||\",\"f === 'src/lib/exercise-validation.ts' ||\",\"f === 'src/lib/constants.ts' || f === 'src/lib/workout.ts') &&\",\"// RETARGET (EXLIB-1C0B3 migration 025 draft): the authorized\",\"// equipment-vocabulary draft is a FIFTH vocabulary-bearing\",\"// migration; the audit (byte-frozen, pre-decision) names the\",\"// four that existed at audit time.\",\"'023_exlib_catalog_and_delivery_contract.sql',\",\"'025_exlib_equipment_vocabulary_support.sql']) &&\",\"migFiles.filter((f) => !f.startsWith('025')).every((f) => audit.includes(f)) &&\",\"// RETARGET (EXLIB-1C0B3 migration 025 draft): the audit is the\",\"// byte-frozen PRE-implementation record; suites created BY the\",\"// later authorized implementation phase it proposed cannot be\",\"// named in it and are excluded from the must-be-named set.\",\"const missingSuites = suitePins.filter((n) => !audit.includes(n) &&\",\"!n.startsWith('verify-exlib1c0b3'))\",\"// RETARGET (EXLIB-1C0B3 migration 025 draft): the audit's\",\"// unauthored statement is historical; the authorized draft\",\"// is now the only permitted 025.\",\"readdirSync('supabase/migrations').filter((f) => f.startsWith('025'))\",\".every((f) => f === '025_exlib_equipment_vocabulary_support.sql')\",\"// ADMISSION (EXLIB-1C0B3): the authorized migration-025\",\"// draft, its live suite and verifier, and the\",\"// coordinated product changes are admitted while\",\"// uncommitted.\",\"if (f === 'supabase/migrations/025_exlib_equipment_vocabulary_support.sql' ||\",\"f === 'scripts/verify-exlib1c0b3-live.sh' ||\",\"f === 'scripts/verify-exlib1c0b3.ts' ||\",\"f === 'src/types/database.ts' ||\",\"f === 'src/lib/exercise-validation.ts' ||\",\"f === 'src/lib/constants.ts' ||\",\"f === 'src/lib/workout.ts') return false\",\"// ADMISSION (EXLIB-1C0B3): the implementation record and\",\"// local-only guard are admitted while uncommitted.\",\"if (f.startsWith('docs/exlib1c0b3-') ||\",\"f === 'scripts/verify-exlib1c0b3-guard.sh') return false\",\"// ADMISSION (EXLIB-1C0B3): accept this phase's\",\"// admission and retarget labels too.\",\"return !/ADMISSION \\\\(EXLIB-1C0B2\\\\)|ADMISSION \\\\(EXLIB-1C0B3\\\\)|RETARGET \\\\(EXLIB-1C0B3 migration 025 draft\\\\)/.test(\",\"execSync(`git diff -- ${f}`, { encoding: 'utf8' }))\"],\"dels\":[\"return files.length === 24 &&\",\"files.filter((f) => f.startsWith('025')).length === 0 &&\",\"{ encoding: 'utf8' }).trim() === '' &&\",\"'023_exlib_catalog_and_delivery_contract.sql']) &&\",\"migFiles.every((f) => audit.includes(f)) &&\",\"const missingSuites = suitePins.filter((n) => !audit.includes(n))\",\"readdirSync('supabase/migrations').every((f) => !f.startsWith('025'))\",\"return !execSync(`git diff -- ${f}`, { encoding: 'utf8' })\",\".includes('ADMISSION (EXLIB-1C0B2)')\"]},\"scripts/verify-exlib1c0b2.ts\":{\"adds\":[\"// RETARGET (EXLIB-1C0B3 migration 025 draft): the authorized\",\"// equipment-vocabulary draft is the only permitted 025\",\"// (DRAFT, not applied); exactly-24 becomes exactly-25 with\",\"// 024 and 025 pinned.\",\"return files.length === 25 &&\",\"files.filter((f) => f.startsWith('025')).length === 1 &&\",\"files.includes('025_exlib_equipment_vocabulary_support.sql') &&\",\"// ADMISSION (EXLIB-1C0B3): the authorized coordinated\",\"// equipment-vocabulary product changes are admitted while\",\"// uncommitted (exact four paths only).\",\"{ encoding: 'utf8' }).trim().split('\\\\n').filter(Boolean)\",\".every((f) => f === 'src/types/database.ts' ||\",\"f === 'src/lib/exercise-validation.ts' ||\",\"f === 'src/lib/constants.ts' || f === 'src/lib/workout.ts') &&\",\"// ADMISSION (EXLIB-1C0B3): the authorized migration-025\",\"// draft, its live suite and verifier, the coordinated\",\"// product changes, and committed verify suites whose\",\"// worktree diff carries this phase's labels are admitted\",\"// while that phase is uncommitted.\",\"const dirtyAfterB3 = execSync('git status --porcelain', { encoding: 'utf8' })\",\".split('\\\\n').filter(Boolean)\",\".filter((l) => {\",\"const mm = l.match(/^\\\\s*(\\\\?\\\\?|[A-Z]{1,2})\\\\s+(.+)$/)\",\"const st = mm ? mm[1] : ''\",\"const f = mm ? mm[2] : l\",\"if (f === 'supabase/migrations/025_exlib_equipment_vocabulary_support.sql' ||\",\"f === 'scripts/verify-exlib1c0b3-live.sh' ||\",\"f === 'scripts/verify-exlib1c0b3.ts' ||\",\"f === 'src/types/database.ts' ||\",\"f === 'src/lib/exercise-validation.ts' ||\",\"f === 'src/lib/constants.ts' ||\",\"f === 'src/lib/workout.ts') return false\",\"// ADMISSION (EXLIB-1C0B3): the implementation record and\",\"// local-only guard are admitted while uncommitted.\",\"if (f.startsWith('docs/exlib1c0b3-') ||\",\"f === 'scripts/verify-exlib1c0b3-guard.sh') return false\",\"if (st === 'M' && f.startsWith('scripts/verify-') && f.endsWith('.ts')) {\",\"try {\",\"return !/ADMISSION \\\\(EXLIB-1C0B3\\\\)|RETARGET \\\\(EXLIB-1C0B3 migration 025 draft\\\\)/.test(\",\"execSync(`git diff -- ${f}`, { encoding: 'utf8' }))\",\"} catch { return true }\",\"}\",\"return true\",\"})\",\"if (dirtyAfterB3.length !== 0) return false\"],\"dels\":[\"return files.length === 24 &&\",\"files.filter((f) => f.startsWith('025')).length === 0 &&\",\"{ encoding: 'utf8' }).trim() === '' &&\",\"if (execSync('git status --porcelain', { encoding: 'utf8' }).trim() !== '') return false\"]},\"scripts/verify-food-log-ux.ts\":{\"adds\":[\"(/* RETARGET (EXLIB-1B2): 023_exlib_catalog_and_delivery_contract.sql is the approved-for-drafting EXLIB catalog migration (DRAFT, not applied); the boundary moves from exactly-22 to exactly-23; no other migration may appear. */ /* RETARGET (EXLIB-1B3B migration 024 draft): 024_exlib_post_application_hardening.sql is the approved-scope hardening draft (DRAFT, not applied; sha256 190550ecdb99df702ab03d1b07592f861070141e5091eb25bc5bf45f211cc980); the boundary moves from exactly-23 to exactly-24; both filenames stay pinned; no other migration may appear. */ /* RETARGET (EXLIB-1C0B3 migration 025 draft): 025_exlib_equipment_vocabulary_support.sql is the authorized equipment-vocabulary draft (DRAFT, not applied; sha256 fbda16f4d25cacd1715b199050506a4da15896355d96700876b76c68826d304c); the boundary moves from exactly-24 to exactly-25; 024 and 025 both stay pinned; no other migration may appear. */ readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).length === 25 && readdirSync('supabase/migrations').some((f) => f === '023_exlib_catalog_and_delivery_contract.sql') && readdirSync('supabase/migrations').some((f) => f === '024_exlib_post_application_hardening.sql') && readdirSync('supabase/migrations').some((f) => f === '025_exlib_equipment_vocabulary_support.sql')) &&\"],\"dels\":[\"(/* RETARGET (EXLIB-1B2): 023_exlib_catalog_and_delivery_contract.sql is the approved-for-drafting EXLIB catalog migration (DRAFT, not applied); the boundary moves from exactly-22 to exactly-23; no other migration may appear. */ /* RETARGET (EXLIB-1B3B migration 024 draft): 024_exlib_post_application_hardening.sql is the approved-scope hardening draft (DRAFT, not applied; sha256 190550ecdb99df702ab03d1b07592f861070141e5091eb25bc5bf45f211cc980); the boundary moves from exactly-23 to exactly-24; both filenames stay pinned; no other migration may appear. */ readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).length === 24 && readdirSync('supabase/migrations').some((f) => f === '023_exlib_catalog_and_delivery_contract.sql') && readdirSync('supabase/migrations').some((f) => f === '024_exlib_post_application_hardening.sql')) &&\"]},\"scripts/verify-phase5b3.ts\":{\"adds\":[\"(/* RETARGET (EXLIB-1B2): 023_exlib_catalog_and_delivery_contract.sql is the approved-for-drafting EXLIB catalog migration (DRAFT, not applied); the boundary moves from exactly-22 to exactly-23; no other migration may appear. */ /* RETARGET (EXLIB-1B3B migration 024 draft): 024_exlib_post_application_hardening.sql is the approved-scope hardening draft (DRAFT, not applied; sha256 190550ecdb99df702ab03d1b07592f861070141e5091eb25bc5bf45f211cc980); the boundary moves from exactly-23 to exactly-24; both filenames stay pinned; no other migration may appear. */ /* RETARGET (EXLIB-1C0B3 migration 025 draft): 025_exlib_equipment_vocabulary_support.sql is the authorized equipment-vocabulary draft (DRAFT, not applied; sha256 fbda16f4d25cacd1715b199050506a4da15896355d96700876b76c68826d304c); the boundary moves from exactly-24 to exactly-25; 024 and 025 both stay pinned; no other migration may appear. */ readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).length === 25 && readdirSync('supabase/migrations').some((f) => f === '023_exlib_catalog_and_delivery_contract.sql') && readdirSync('supabase/migrations').some((f) => f === '024_exlib_post_application_hardening.sql') && readdirSync('supabase/migrations').some((f) => f === '025_exlib_equipment_vocabulary_support.sql')) &&\"],\"dels\":[\"(/* RETARGET (EXLIB-1B2): 023_exlib_catalog_and_delivery_contract.sql is the approved-for-drafting EXLIB catalog migration (DRAFT, not applied); the boundary moves from exactly-22 to exactly-23; no other migration may appear. */ /* RETARGET (EXLIB-1B3B migration 024 draft): 024_exlib_post_application_hardening.sql is the approved-scope hardening draft (DRAFT, not applied; sha256 190550ecdb99df702ab03d1b07592f861070141e5091eb25bc5bf45f211cc980); the boundary moves from exactly-23 to exactly-24; both filenames stay pinned; no other migration may appear. */ readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).length === 24 && readdirSync('supabase/migrations').some((f) => f === '023_exlib_catalog_and_delivery_contract.sql') && readdirSync('supabase/migrations').some((f) => f === '024_exlib_post_application_hardening.sql')) &&\"]},\"scripts/verify-phase5b4.ts\":{\"adds\":[\"(/* RETARGET (EXLIB-1B2): 023_exlib_catalog_and_delivery_contract.sql is the approved-for-drafting EXLIB catalog migration (DRAFT, not applied); the boundary moves from exactly-22 to exactly-23; no other migration may appear. */ /* RETARGET (EXLIB-1B3B migration 024 draft): 024_exlib_post_application_hardening.sql is the approved-scope hardening draft (DRAFT, not applied; sha256 190550ecdb99df702ab03d1b07592f861070141e5091eb25bc5bf45f211cc980); the boundary moves from exactly-23 to exactly-24; both filenames stay pinned; no other migration may appear. */ /* RETARGET (EXLIB-1C0B3 migration 025 draft): 025_exlib_equipment_vocabulary_support.sql is the authorized equipment-vocabulary draft (DRAFT, not applied; sha256 fbda16f4d25cacd1715b199050506a4da15896355d96700876b76c68826d304c); the boundary moves from exactly-24 to exactly-25; 024 and 025 both stay pinned; no other migration may appear. */ readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).length === 25 && readdirSync('supabase/migrations').some((f) => f === '023_exlib_catalog_and_delivery_contract.sql') && readdirSync('supabase/migrations').some((f) => f === '024_exlib_post_application_hardening.sql') && readdirSync('supabase/migrations').some((f) => f === '025_exlib_equipment_vocabulary_support.sql')) &&\"],\"dels\":[\"(/* RETARGET (EXLIB-1B2): 023_exlib_catalog_and_delivery_contract.sql is the approved-for-drafting EXLIB catalog migration (DRAFT, not applied); the boundary moves from exactly-22 to exactly-23; no other migration may appear. */ /* RETARGET (EXLIB-1B3B migration 024 draft): 024_exlib_post_application_hardening.sql is the approved-scope hardening draft (DRAFT, not applied; sha256 190550ecdb99df702ab03d1b07592f861070141e5091eb25bc5bf45f211cc980); the boundary moves from exactly-23 to exactly-24; both filenames stay pinned; no other migration may appear. */ readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).length === 24 && readdirSync('supabase/migrations').some((f) => f === '023_exlib_catalog_and_delivery_contract.sql') && readdirSync('supabase/migrations').some((f) => f === '024_exlib_post_application_hardening.sql')) &&\"]},\"scripts/verify-phase5b5.ts\":{\"adds\":[\"(/* RETARGET (EXLIB-1B2): 023_exlib_catalog_and_delivery_contract.sql is the approved-for-drafting EXLIB catalog migration (DRAFT, not applied); the boundary moves from exactly-22 to exactly-23; no other migration may appear. */ /* RETARGET (EXLIB-1B3B migration 024 draft): 024_exlib_post_application_hardening.sql is the approved-scope hardening draft (DRAFT, not applied; sha256 190550ecdb99df702ab03d1b07592f861070141e5091eb25bc5bf45f211cc980); the boundary moves from exactly-23 to exactly-24; both filenames stay pinned; no other migration may appear. */ /* RETARGET (EXLIB-1C0B3 migration 025 draft): 025_exlib_equipment_vocabulary_support.sql is the authorized equipment-vocabulary draft (DRAFT, not applied; sha256 fbda16f4d25cacd1715b199050506a4da15896355d96700876b76c68826d304c); the boundary moves from exactly-24 to exactly-25; 024 and 025 both stay pinned; no other migration may appear. */ readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).length === 25 && readdirSync('supabase/migrations').some((f) => f === '023_exlib_catalog_and_delivery_contract.sql') && readdirSync('supabase/migrations').some((f) => f === '024_exlib_post_application_hardening.sql') && readdirSync('supabase/migrations').some((f) => f === '025_exlib_equipment_vocabulary_support.sql')) &&\"],\"dels\":[\"(/* RETARGET (EXLIB-1B2): 023_exlib_catalog_and_delivery_contract.sql is the approved-for-drafting EXLIB catalog migration (DRAFT, not applied); the boundary moves from exactly-22 to exactly-23; no other migration may appear. */ /* RETARGET (EXLIB-1B3B migration 024 draft): 024_exlib_post_application_hardening.sql is the approved-scope hardening draft (DRAFT, not applied; sha256 190550ecdb99df702ab03d1b07592f861070141e5091eb25bc5bf45f211cc980); the boundary moves from exactly-23 to exactly-24; both filenames stay pinned; no other migration may appear. */ readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).length === 24 && readdirSync('supabase/migrations').some((f) => f === '023_exlib_catalog_and_delivery_contract.sql') && readdirSync('supabase/migrations').some((f) => f === '024_exlib_post_application_hardening.sql')) &&\"]},\"scripts/verify-ui1a.ts\":{\"adds\":[\"(/* RETARGET (EXLIB-1B2): 023_exlib_catalog_and_delivery_contract.sql is the approved-for-drafting EXLIB catalog migration (DRAFT, not applied); the boundary moves from exactly-22 to exactly-23; no other migration may appear. */ /* RETARGET (EXLIB-1B3B migration 024 draft): 024_exlib_post_application_hardening.sql is the approved-scope hardening draft (DRAFT, not applied; sha256 190550ecdb99df702ab03d1b07592f861070141e5091eb25bc5bf45f211cc980); the boundary moves from exactly-23 to exactly-24; both filenames stay pinned; no other migration may appear. */ /* RETARGET (EXLIB-1C0B3 migration 025 draft): 025_exlib_equipment_vocabulary_support.sql is the authorized equipment-vocabulary draft (DRAFT, not applied; sha256 fbda16f4d25cacd1715b199050506a4da15896355d96700876b76c68826d304c); the boundary moves from exactly-24 to exactly-25; 024 and 025 both stay pinned; no other migration may appear. */ readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).length === 25 && readdirSync('supabase/migrations').some((f) => f === '023_exlib_catalog_and_delivery_contract.sql') && readdirSync('supabase/migrations').some((f) => f === '024_exlib_post_application_hardening.sql') && readdirSync('supabase/migrations').some((f) => f === '025_exlib_equipment_vocabulary_support.sql')) &&\"],\"dels\":[\"(/* RETARGET (EXLIB-1B2): 023_exlib_catalog_and_delivery_contract.sql is the approved-for-drafting EXLIB catalog migration (DRAFT, not applied); the boundary moves from exactly-22 to exactly-23; no other migration may appear. */ /* RETARGET (EXLIB-1B3B migration 024 draft): 024_exlib_post_application_hardening.sql is the approved-scope hardening draft (DRAFT, not applied; sha256 190550ecdb99df702ab03d1b07592f861070141e5091eb25bc5bf45f211cc980); the boundary moves from exactly-23 to exactly-24; both filenames stay pinned; no other migration may appear. */ readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).length === 24 && readdirSync('supabase/migrations').some((f) => f === '023_exlib_catalog_and_delivery_contract.sql') && readdirSync('supabase/migrations').some((f) => f === '024_exlib_post_application_hardening.sql')) &&\"]},\"scripts/verify-ui1b.ts\":{\"adds\":[\"(/* RETARGET (EXLIB-1B2): 023_exlib_catalog_and_delivery_contract.sql is the approved-for-drafting EXLIB catalog migration (DRAFT, not applied); the boundary moves from exactly-22 to exactly-23; no other migration may appear. */ /* RETARGET (EXLIB-1B3B migration 024 draft): 024_exlib_post_application_hardening.sql is the approved-scope hardening draft (DRAFT, not applied; sha256 190550ecdb99df702ab03d1b07592f861070141e5091eb25bc5bf45f211cc980); the boundary moves from exactly-23 to exactly-24; both filenames stay pinned; no other migration may appear. */ /* RETARGET (EXLIB-1C0B3 migration 025 draft): 025_exlib_equipment_vocabulary_support.sql is the authorized equipment-vocabulary draft (DRAFT, not applied; sha256 fbda16f4d25cacd1715b199050506a4da15896355d96700876b76c68826d304c); the boundary moves from exactly-24 to exactly-25; 024 and 025 both stay pinned; no other migration may appear. */ readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).length === 25 && readdirSync('supabase/migrations').some((f) => f === '023_exlib_catalog_and_delivery_contract.sql') && readdirSync('supabase/migrations').some((f) => f === '024_exlib_post_application_hardening.sql') && readdirSync('supabase/migrations').some((f) => f === '025_exlib_equipment_vocabulary_support.sql')) &&\"],\"dels\":[\"(/* RETARGET (EXLIB-1B2): 023_exlib_catalog_and_delivery_contract.sql is the approved-for-drafting EXLIB catalog migration (DRAFT, not applied); the boundary moves from exactly-22 to exactly-23; no other migration may appear. */ /* RETARGET (EXLIB-1B3B migration 024 draft): 024_exlib_post_application_hardening.sql is the approved-scope hardening draft (DRAFT, not applied; sha256 190550ecdb99df702ab03d1b07592f861070141e5091eb25bc5bf45f211cc980); the boundary moves from exactly-23 to exactly-24; both filenames stay pinned; no other migration may appear. */ readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).length === 24 && readdirSync('supabase/migrations').some((f) => f === '023_exlib_catalog_and_delivery_contract.sql') && readdirSync('supabase/migrations').some((f) => f === '024_exlib_post_application_hardening.sql')) &&\"]},\"scripts/verify-ui2.ts\":{\"adds\":[\"(/* RETARGET (EXLIB-1B2): 023_exlib_catalog_and_delivery_contract.sql is the approved-for-drafting EXLIB catalog migration (DRAFT, not applied); the boundary moves from exactly-22 to exactly-23; no other migration may appear. */ /* RETARGET (EXLIB-1B3B migration 024 draft): 024_exlib_post_application_hardening.sql is the approved-scope hardening draft (DRAFT, not applied; sha256 190550ecdb99df702ab03d1b07592f861070141e5091eb25bc5bf45f211cc980); the boundary moves from exactly-23 to exactly-24; both filenames stay pinned; no other migration may appear. */ /* RETARGET (EXLIB-1C0B3 migration 025 draft): 025_exlib_equipment_vocabulary_support.sql is the authorized equipment-vocabulary draft (DRAFT, not applied; sha256 fbda16f4d25cacd1715b199050506a4da15896355d96700876b76c68826d304c); the boundary moves from exactly-24 to exactly-25; 024 and 025 both stay pinned; no other migration may appear. */ readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).length === 25 && readdirSync('supabase/migrations').some((f) => f === '023_exlib_catalog_and_delivery_contract.sql') && readdirSync('supabase/migrations').some((f) => f === '024_exlib_post_application_hardening.sql') && readdirSync('supabase/migrations').some((f) => f === '025_exlib_equipment_vocabulary_support.sql')) &&\"],\"dels\":[\"(/* RETARGET (EXLIB-1B2): 023_exlib_catalog_and_delivery_contract.sql is the approved-for-drafting EXLIB catalog migration (DRAFT, not applied); the boundary moves from exactly-22 to exactly-23; no other migration may appear. */ /* RETARGET (EXLIB-1B3B migration 024 draft): 024_exlib_post_application_hardening.sql is the approved-scope hardening draft (DRAFT, not applied; sha256 190550ecdb99df702ab03d1b07592f861070141e5091eb25bc5bf45f211cc980); the boundary moves from exactly-23 to exactly-24; both filenames stay pinned; no other migration may appear. */ readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).length === 24 && readdirSync('supabase/migrations').some((f) => f === '023_exlib_catalog_and_delivery_contract.sql') && readdirSync('supabase/migrations').some((f) => f === '024_exlib_post_application_hardening.sql')) &&\"]},\"scripts/verify-ui3.ts\":{\"adds\":[\"(/* RETARGET (EXLIB-1B2): 023_exlib_catalog_and_delivery_contract.sql is the approved-for-drafting EXLIB catalog migration (DRAFT, not applied); the boundary moves from exactly-22 to exactly-23; no other migration may appear. */ /* RETARGET (EXLIB-1B3B migration 024 draft): 024_exlib_post_application_hardening.sql is the approved-scope hardening draft (DRAFT, not applied; sha256 190550ecdb99df702ab03d1b07592f861070141e5091eb25bc5bf45f211cc980); the boundary moves from exactly-23 to exactly-24; both filenames stay pinned; no other migration may appear. */ /* RETARGET (EXLIB-1C0B3 migration 025 draft): 025_exlib_equipment_vocabulary_support.sql is the authorized equipment-vocabulary draft (DRAFT, not applied; sha256 fbda16f4d25cacd1715b199050506a4da15896355d96700876b76c68826d304c); the boundary moves from exactly-24 to exactly-25; 024 and 025 both stay pinned; no other migration may appear. */ readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).length === 25 && readdirSync('supabase/migrations').some((f) => f === '023_exlib_catalog_and_delivery_contract.sql') && readdirSync('supabase/migrations').some((f) => f === '024_exlib_post_application_hardening.sql') && readdirSync('supabase/migrations').some((f) => f === '025_exlib_equipment_vocabulary_support.sql')) &&\"],\"dels\":[\"(/* RETARGET (EXLIB-1B2): 023_exlib_catalog_and_delivery_contract.sql is the approved-for-drafting EXLIB catalog migration (DRAFT, not applied); the boundary moves from exactly-22 to exactly-23; no other migration may appear. */ /* RETARGET (EXLIB-1B3B migration 024 draft): 024_exlib_post_application_hardening.sql is the approved-scope hardening draft (DRAFT, not applied; sha256 190550ecdb99df702ab03d1b07592f861070141e5091eb25bc5bf45f211cc980); the boundary moves from exactly-23 to exactly-24; both filenames stay pinned; no other migration may appear. */ readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).length === 24 && readdirSync('supabase/migrations').some((f) => f === '023_exlib_catalog_and_delivery_contract.sql') && readdirSync('supabase/migrations').some((f) => f === '024_exlib_post_application_hardening.sql')) &&\"]},\"scripts/verify-ui4.ts\":{\"adds\":[\"(/* RETARGET (EXLIB-1B2): 023_exlib_catalog_and_delivery_contract.sql is the approved-for-drafting EXLIB catalog migration (DRAFT, not applied); the boundary moves from exactly-22 to exactly-23; no other migration may appear. */ /* RETARGET (EXLIB-1B3B migration 024 draft): 024_exlib_post_application_hardening.sql is the approved-scope hardening draft (DRAFT, not applied; sha256 190550ecdb99df702ab03d1b07592f861070141e5091eb25bc5bf45f211cc980); the boundary moves from exactly-23 to exactly-24; both filenames stay pinned; no other migration may appear. */ /* RETARGET (EXLIB-1C0B3 migration 025 draft): 025_exlib_equipment_vocabulary_support.sql is the authorized equipment-vocabulary draft (DRAFT, not applied; sha256 fbda16f4d25cacd1715b199050506a4da15896355d96700876b76c68826d304c); the boundary moves from exactly-24 to exactly-25; 024 and 025 both stay pinned; no other migration may appear. */ readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).length === 25 && readdirSync('supabase/migrations').some((f) => f === '023_exlib_catalog_and_delivery_contract.sql') && readdirSync('supabase/migrations').some((f) => f === '024_exlib_post_application_hardening.sql') && readdirSync('supabase/migrations').some((f) => f === '025_exlib_equipment_vocabulary_support.sql')) &&\",\"(/* RETARGET (EXLIB-1B2): 023_exlib_catalog_and_delivery_contract.sql is the approved-for-drafting EXLIB catalog migration (DRAFT, not applied); the boundary moves from exactly-22 to exactly-23; no other migration may appear. */ /* RETARGET (EXLIB-1B3B migration 024 draft): 024_exlib_post_application_hardening.sql is the approved-scope hardening draft (DRAFT, not applied; sha256 190550ecdb99df702ab03d1b07592f861070141e5091eb25bc5bf45f211cc980); the boundary moves from exactly-23 to exactly-24; both filenames stay pinned; no other migration may appear. */ /* RETARGET (EXLIB-1C0B3 migration 025 draft): 025_exlib_equipment_vocabulary_support.sql is the authorized equipment-vocabulary draft (DRAFT, not applied; sha256 fbda16f4d25cacd1715b199050506a4da15896355d96700876b76c68826d304c); the boundary moves from exactly-24 to exactly-25; 024 and 025 both stay pinned; no other migration may appear. */ readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).length === 25 && readdirSync('supabase/migrations').some((f) => f === '023_exlib_catalog_and_delivery_contract.sql') && readdirSync('supabase/migrations').some((f) => f === '024_exlib_post_application_hardening.sql') && readdirSync('supabase/migrations').some((f) => f === '025_exlib_equipment_vocabulary_support.sql')))\"],\"dels\":[\"(/* RETARGET (EXLIB-1B2): 023_exlib_catalog_and_delivery_contract.sql is the approved-for-drafting EXLIB catalog migration (DRAFT, not applied); the boundary moves from exactly-22 to exactly-23; no other migration may appear. */ /* RETARGET (EXLIB-1B3B migration 024 draft): 024_exlib_post_application_hardening.sql is the approved-scope hardening draft (DRAFT, not applied; sha256 190550ecdb99df702ab03d1b07592f861070141e5091eb25bc5bf45f211cc980); the boundary moves from exactly-23 to exactly-24; both filenames stay pinned; no other migration may appear. */ readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).length === 24 && readdirSync('supabase/migrations').some((f) => f === '023_exlib_catalog_and_delivery_contract.sql') && readdirSync('supabase/migrations').some((f) => f === '024_exlib_post_application_hardening.sql')) &&\",\"(/* RETARGET (EXLIB-1B2): 023_exlib_catalog_and_delivery_contract.sql is the approved-for-drafting EXLIB catalog migration (DRAFT, not applied); the boundary moves from exactly-22 to exactly-23; no other migration may appear. */ /* RETARGET (EXLIB-1B3B migration 024 draft): 024_exlib_post_application_hardening.sql is the approved-scope hardening draft (DRAFT, not applied; sha256 190550ecdb99df702ab03d1b07592f861070141e5091eb25bc5bf45f211cc980); the boundary moves from exactly-23 to exactly-24; both filenames stay pinned; no other migration may appear. */ readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).length === 24 && readdirSync('supabase/migrations').some((f) => f === '023_exlib_catalog_and_delivery_contract.sql') && readdirSync('supabase/migrations').some((f) => f === '024_exlib_post_application_hardening.sql')))\"]},\"scripts/verify-ui5a.ts\":{\"adds\":[\"// ADMISSION (EXLIB-1C0B3): the authorized coordinated\",\"// equipment-vocabulary product changes (exact four paths).\",\"f === 'src/types/database.ts' || f === 'src/lib/exercise-validation.ts' ||\",\"f === 'src/lib/constants.ts' || f === 'src/lib/workout.ts' ||\",\"(/* RETARGET (EXLIB-1B2): 023_exlib_catalog_and_delivery_contract.sql is the approved-for-drafting EXLIB catalog migration (DRAFT, not applied); the boundary moves from exactly-22 to exactly-23; no other migration may appear. */ /* RETARGET (EXLIB-1B3B migration 024 draft): 024_exlib_post_application_hardening.sql is the approved-scope hardening draft (DRAFT, not applied; sha256 190550ecdb99df702ab03d1b07592f861070141e5091eb25bc5bf45f211cc980); the boundary moves from exactly-23 to exactly-24; both filenames stay pinned; no other migration may appear. */ /* RETARGET (EXLIB-1C0B3 migration 025 draft): 025_exlib_equipment_vocabulary_support.sql is the authorized equipment-vocabulary draft (DRAFT, not applied; sha256 fbda16f4d25cacd1715b199050506a4da15896355d96700876b76c68826d304c); the boundary moves from exactly-24 to exactly-25; 024 and 025 both stay pinned; no other migration may appear. */ readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).length === 25 && readdirSync('supabase/migrations').some((f) => f === '023_exlib_catalog_and_delivery_contract.sql') && readdirSync('supabase/migrations').some((f) => f === '024_exlib_post_application_hardening.sql') && readdirSync('supabase/migrations').some((f) => f === '025_exlib_equipment_vocabulary_support.sql')) &&\"],\"dels\":[\"(/* RETARGET (EXLIB-1B2): 023_exlib_catalog_and_delivery_contract.sql is the approved-for-drafting EXLIB catalog migration (DRAFT, not applied); the boundary moves from exactly-22 to exactly-23; no other migration may appear. */ /* RETARGET (EXLIB-1B3B migration 024 draft): 024_exlib_post_application_hardening.sql is the approved-scope hardening draft (DRAFT, not applied; sha256 190550ecdb99df702ab03d1b07592f861070141e5091eb25bc5bf45f211cc980); the boundary moves from exactly-23 to exactly-24; both filenames stay pinned; no other migration may appear. */ readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).length === 24 && readdirSync('supabase/migrations').some((f) => f === '023_exlib_catalog_and_delivery_contract.sql') && readdirSync('supabase/migrations').some((f) => f === '024_exlib_post_application_hardening.sql')) &&\"]},\"scripts/verify-ui5b1a.ts\":{\"adds\":[\"UI6A.includes(f) || UI6B.includes(f) || UI6C.includes(f) || UI7.includes(f) ||\",\"// ADMISSION (EXLIB-1C0B3): the authorized coordinated\",\"// equipment-vocabulary product changes (exact four paths).\",\"f === 'src/types/database.ts' || f === 'src/lib/exercise-validation.ts' ||\",\"f === 'src/lib/constants.ts' || f === 'src/lib/workout.ts'),\",\"// ADMISSION (EXLIB-1C0B3): the authorized coordinated\",\"// equipment-vocabulary changes are admitted while\",\"// uncommitted (exact paths only).\",\"f === 'src/types/database.ts' || f === 'src/lib/exercise-validation.ts' ||\",\"f === 'src/lib/constants.ts' || f === 'src/lib/workout.ts' ||\",\"((!f.startsWith('src/lib/') || LOCAL_DATE_FIX.includes(f)) &&\",\"f === 'supabase/migrations/023_exlib_catalog_and_delivery_contract.sql'))))\",\"(/* RETARGET (EXLIB-1B2): 023_exlib_catalog_and_delivery_contract.sql is the approved-for-drafting EXLIB catalog migration (DRAFT, not applied); the boundary moves from exactly-22 to exactly-23; no other migration may appear. */ /* RETARGET (EXLIB-1B3B migration 024 draft): 024_exlib_post_application_hardening.sql is the approved-scope hardening draft (DRAFT, not applied; sha256 190550ecdb99df702ab03d1b07592f861070141e5091eb25bc5bf45f211cc980); the boundary moves from exactly-23 to exactly-24; both filenames stay pinned; no other migration may appear. */ /* RETARGET (EXLIB-1C0B3 migration 025 draft): 025_exlib_equipment_vocabulary_support.sql is the authorized equipment-vocabulary draft (DRAFT, not applied; sha256 fbda16f4d25cacd1715b199050506a4da15896355d96700876b76c68826d304c); the boundary moves from exactly-24 to exactly-25; 024 and 025 both stay pinned; no other migration may appear. */ readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).length === 25 && readdirSync('supabase/migrations').some((f) => f === '023_exlib_catalog_and_delivery_contract.sql') && readdirSync('supabase/migrations').some((f) => f === '024_exlib_post_application_hardening.sql') && readdirSync('supabase/migrations').some((f) => f === '025_exlib_equipment_vocabulary_support.sql')) &&\",\"// ADMISSION (EXLIB-1C0B3): the authorized Smith-machine\",\"// progression branch is a labeled pure addition; the analytics\",\"// helpers asserted below stay pinned by content anchors.\",\"(!diffFiles.includes('src/lib/workout.ts') ||\",\"(() => {\",\"const d = execSync('git diff -- src/lib/workout.ts', { encoding: 'utf8' })\",\"return d.includes('EXLIB-1C0B3') &&\",\"d.split('\\\\n').filter((l) => l.startsWith('-') && !l.startsWith('---')).length === 0\",\"})()) &&\"],\"dels\":[\"UI6A.includes(f) || UI6B.includes(f) || UI6C.includes(f) || UI7.includes(f)),\",\"(!f.startsWith('src/lib/') || LOCAL_DATE_FIX.includes(f)) &&\",\"f === 'supabase/migrations/023_exlib_catalog_and_delivery_contract.sql')))\",\"(/* RETARGET (EXLIB-1B2): 023_exlib_catalog_and_delivery_contract.sql is the approved-for-drafting EXLIB catalog migration (DRAFT, not applied); the boundary moves from exactly-22 to exactly-23; no other migration may appear. */ /* RETARGET (EXLIB-1B3B migration 024 draft): 024_exlib_post_application_hardening.sql is the approved-scope hardening draft (DRAFT, not applied; sha256 190550ecdb99df702ab03d1b07592f861070141e5091eb25bc5bf45f211cc980); the boundary moves from exactly-23 to exactly-24; both filenames stay pinned; no other migration may appear. */ readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).length === 24 && readdirSync('supabase/migrations').some((f) => f === '023_exlib_catalog_and_delivery_contract.sql') && readdirSync('supabase/migrations').some((f) => f === '024_exlib_post_application_hardening.sql')) &&\",\"!diffFiles.includes('src/lib/workout.ts') &&\"]},\"scripts/verify-ui5b1b.ts\":{\"adds\":[\"(/* RETARGET (EXLIB-1B2): 023_exlib_catalog_and_delivery_contract.sql is the approved-for-drafting EXLIB catalog migration (DRAFT, not applied); the boundary moves from exactly-22 to exactly-23; no other migration may appear. */ /* RETARGET (EXLIB-1B3B migration 024 draft): 024_exlib_post_application_hardening.sql is the approved-scope hardening draft (DRAFT, not applied; sha256 190550ecdb99df702ab03d1b07592f861070141e5091eb25bc5bf45f211cc980); the boundary moves from exactly-23 to exactly-24; both filenames stay pinned; no other migration may appear. */ /* RETARGET (EXLIB-1C0B3 migration 025 draft): 025_exlib_equipment_vocabulary_support.sql is the authorized equipment-vocabulary draft (DRAFT, not applied; sha256 fbda16f4d25cacd1715b199050506a4da15896355d96700876b76c68826d304c); the boundary moves from exactly-24 to exactly-25; 024 and 025 both stay pinned; no other migration may appear. */ readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).length === 25 && readdirSync('supabase/migrations').some((f) => f === '023_exlib_catalog_and_delivery_contract.sql') && readdirSync('supabase/migrations').some((f) => f === '024_exlib_post_application_hardening.sql') && readdirSync('supabase/migrations').some((f) => f === '025_exlib_equipment_vocabulary_support.sql')) &&\",\"// ADMISSION (EXLIB-1C0B3): the authorized migration-025\",\"// draft and the coordinated equipment-vocabulary product\",\"// changes are admitted while uncommitted.\",\"f === 'supabase/migrations/025_exlib_equipment_vocabulary_support.sql' ||\",\"f === 'src/types/database.ts' ||\",\"f === 'src/lib/exercise-validation.ts' ||\",\"f === 'src/lib/constants.ts' ||\",\"f === 'src/lib/workout.ts' ||\",\"// ADMISSION (EXLIB-1C0B3): the implementation record and\",\"// local-only guard are admitted while uncommitted.\",\"f.startsWith('docs/exlib1c0b3-') ||\"],\"dels\":[\"(/* RETARGET (EXLIB-1B2): 023_exlib_catalog_and_delivery_contract.sql is the approved-for-drafting EXLIB catalog migration (DRAFT, not applied); the boundary moves from exactly-22 to exactly-23; no other migration may appear. */ /* RETARGET (EXLIB-1B3B migration 024 draft): 024_exlib_post_application_hardening.sql is the approved-scope hardening draft (DRAFT, not applied; sha256 190550ecdb99df702ab03d1b07592f861070141e5091eb25bc5bf45f211cc980); the boundary moves from exactly-23 to exactly-24; both filenames stay pinned; no other migration may appear. */ readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).length === 24 && readdirSync('supabase/migrations').some((f) => f === '023_exlib_catalog_and_delivery_contract.sql') && readdirSync('supabase/migrations').some((f) => f === '024_exlib_post_application_hardening.sql')) &&\"]},\"scripts/verify-ui5b2.ts\":{\"adds\":[\"(/* RETARGET (EXLIB-1B2): 023_exlib_catalog_and_delivery_contract.sql is the approved-for-drafting EXLIB catalog migration (DRAFT, not applied); the boundary moves from exactly-22 to exactly-23; no other migration may appear. */ /* RETARGET (EXLIB-1B3B migration 024 draft): 024_exlib_post_application_hardening.sql is the approved-scope hardening draft (DRAFT, not applied; sha256 190550ecdb99df702ab03d1b07592f861070141e5091eb25bc5bf45f211cc980); the boundary moves from exactly-23 to exactly-24; both filenames stay pinned; no other migration may appear. */ /* RETARGET (EXLIB-1C0B3 migration 025 draft): 025_exlib_equipment_vocabulary_support.sql is the authorized equipment-vocabulary draft (DRAFT, not applied; sha256 fbda16f4d25cacd1715b199050506a4da15896355d96700876b76c68826d304c); the boundary moves from exactly-24 to exactly-25; 024 and 025 both stay pinned; no other migration may appear. */ readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).length === 25 && readdirSync('supabase/migrations').some((f) => f === '023_exlib_catalog_and_delivery_contract.sql') && readdirSync('supabase/migrations').some((f) => f === '024_exlib_post_application_hardening.sql') && readdirSync('supabase/migrations').some((f) => f === '025_exlib_equipment_vocabulary_support.sql')) &&\",\"// ADMISSION (EXLIB-1C0B3): the authorized migration-025\",\"// draft and the coordinated equipment-vocabulary product\",\"// changes are admitted while uncommitted.\",\"f === 'supabase/migrations/025_exlib_equipment_vocabulary_support.sql' ||\",\"f === 'src/types/database.ts' ||\",\"f === 'src/lib/exercise-validation.ts' ||\",\"f === 'src/lib/constants.ts' ||\",\"f === 'src/lib/workout.ts' ||\",\"// ADMISSION (EXLIB-1C0B3): the implementation record and\",\"// local-only guard are admitted while uncommitted.\",\"f.startsWith('docs/exlib1c0b3-') ||\",\"// ADMISSION (EXLIB-1C0B3): the authorized coordinated\",\"// equipment-vocabulary lib changes are admitted while\",\"// uncommitted (exact three lib paths only).\",\"if (f === 'src/lib/exercise-validation.ts' ||\",\"f === 'src/lib/constants.ts' || f === 'src/lib/workout.ts') return true\"],\"dels\":[\"(/* RETARGET (EXLIB-1B2): 023_exlib_catalog_and_delivery_contract.sql is the approved-for-drafting EXLIB catalog migration (DRAFT, not applied); the boundary moves from exactly-22 to exactly-23; no other migration may appear. */ /* RETARGET (EXLIB-1B3B migration 024 draft): 024_exlib_post_application_hardening.sql is the approved-scope hardening draft (DRAFT, not applied; sha256 190550ecdb99df702ab03d1b07592f861070141e5091eb25bc5bf45f211cc980); the boundary moves from exactly-23 to exactly-24; both filenames stay pinned; no other migration may appear. */ readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).length === 24 && readdirSync('supabase/migrations').some((f) => f === '023_exlib_catalog_and_delivery_contract.sql') && readdirSync('supabase/migrations').some((f) => f === '024_exlib_post_application_hardening.sql')) &&\"]},\"scripts/verify-ui6a.ts\":{\"adds\":[\"// ADMISSION (EXLIB-1C0B3): the authorized migration-025\",\"// draft and the coordinated equipment-vocabulary product\",\"// changes are admitted while uncommitted.\",\"if (f === 'supabase/migrations/025_exlib_equipment_vocabulary_support.sql') return true\",\"if (f === 'src/types/database.ts' || f === 'src/lib/exercise-validation.ts' ||\",\"f === 'src/lib/constants.ts' || f === 'src/lib/workout.ts') return true\",\"// ADMISSION (EXLIB-1C0B3): the authorized coordinated\",\"// equipment-vocabulary lib changes are admitted while\",\"// uncommitted (exact three lib paths only).\",\"if (f === 'src/lib/exercise-validation.ts' ||\",\"f === 'src/lib/constants.ts' || f === 'src/lib/workout.ts') return true\",\".every((f) => f === 'supabase/migrations/023_exlib_catalog_and_delivery_contract.sql' ||\",\"/* ADMISSION (EXLIB-1C0B3): the authorized coordinated\",\"equipment-vocabulary product changes are admitted\",\"while uncommitted (exact four paths only). */\",\"f === 'src/types/database.ts' ||\",\"f === 'src/lib/exercise-validation.ts' ||\",\"f === 'src/lib/constants.ts' ||\",\"f === 'src/lib/workout.ts') &&\",\"(/* RETARGET (EXLIB-1B2): 023_exlib_catalog_and_delivery_contract.sql is the approved-for-drafting EXLIB catalog migration (DRAFT, not applied); the boundary moves from exactly-22 to exactly-23; no other migration may appear. */ /* RETARGET (EXLIB-1B3B migration 024 draft): 024_exlib_post_application_hardening.sql is the approved-scope hardening draft (DRAFT, not applied; sha256 190550ecdb99df702ab03d1b07592f861070141e5091eb25bc5bf45f211cc980); the boundary moves from exactly-23 to exactly-24; both filenames stay pinned; no other migration may appear. */ /* RETARGET (EXLIB-1C0B3 migration 025 draft): 025_exlib_equipment_vocabulary_support.sql is the authorized equipment-vocabulary draft (DRAFT, not applied; sha256 fbda16f4d25cacd1715b199050506a4da15896355d96700876b76c68826d304c); the boundary moves from exactly-24 to exactly-25; 024 and 025 both stay pinned; no other migration may appear. */ readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).length === 25 && readdirSync('supabase/migrations').some((f) => f === '023_exlib_catalog_and_delivery_contract.sql') && readdirSync('supabase/migrations').some((f) => f === '024_exlib_post_application_hardening.sql') && readdirSync('supabase/migrations').some((f) => f === '025_exlib_equipment_vocabulary_support.sql'))\"],\"dels\":[\".every((f) => f === 'supabase/migrations/023_exlib_catalog_and_delivery_contract.sql') &&\",\"(/* RETARGET (EXLIB-1B2): 023_exlib_catalog_and_delivery_contract.sql is the approved-for-drafting EXLIB catalog migration (DRAFT, not applied); the boundary moves from exactly-22 to exactly-23; no other migration may appear. */ /* RETARGET (EXLIB-1B3B migration 024 draft): 024_exlib_post_application_hardening.sql is the approved-scope hardening draft (DRAFT, not applied; sha256 190550ecdb99df702ab03d1b07592f861070141e5091eb25bc5bf45f211cc980); the boundary moves from exactly-23 to exactly-24; both filenames stay pinned; no other migration may appear. */ readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).length === 24 && readdirSync('supabase/migrations').some((f) => f === '023_exlib_catalog_and_delivery_contract.sql') && readdirSync('supabase/migrations').some((f) => f === '024_exlib_post_application_hardening.sql'))\"]},\"scripts/verify-ui6b.ts\":{\"adds\":[\"// ADMISSION (EXLIB-1C0B3): the authorized migration-025\",\"// draft and the coordinated equipment-vocabulary product\",\"// changes are admitted while uncommitted.\",\"if (f === 'supabase/migrations/025_exlib_equipment_vocabulary_support.sql') return true\",\"if (f === 'src/types/database.ts' || f === 'src/lib/exercise-validation.ts' ||\",\"f === 'src/lib/constants.ts' || f === 'src/lib/workout.ts') return true\",\"// ADMISSION (EXLIB-1C0B3): the authorized migration-025\",\"// draft and the coordinated equipment-vocabulary product\",\"// changes are admitted while uncommitted.\",\"if (f === 'supabase/migrations/025_exlib_equipment_vocabulary_support.sql') return true\",\"if (f === 'src/types/database.ts' || f === 'src/lib/exercise-validation.ts' ||\",\"f === 'src/lib/constants.ts' || f === 'src/lib/workout.ts') return true\",\"// ADMISSION (EXLIB-1C0B3): constants.ts gains ONLY the\",\"// labeled equipment options (pure additions, phase label\",\"// required); fasting.ts must remain byte-untouched.\",\"if (execSync('git diff --name-only -- src/lib/fasting.ts',\",\"{ encoding: 'utf8' }).trim() !== '') return false\",\"const d = execSync('git diff -- src/lib/constants.ts', { encoding: 'utf8' })\",\"return d === '' ||\",\"(d.includes('EXLIB-1C0B3') &&\",\"d.split('\\\\n').filter((l) => l.startsWith('-') && !l.startsWith('---')).length === 0)\",\".every((f) => f === 'supabase/migrations/023_exlib_catalog_and_delivery_contract.sql' ||\",\"/* ADMISSION (EXLIB-1C0B3): the authorized coordinated\",\"equipment-vocabulary product changes are admitted\",\"while uncommitted (exact four paths only). */\",\"f === 'src/types/database.ts' ||\",\"f === 'src/lib/exercise-validation.ts' ||\",\"f === 'src/lib/constants.ts' ||\",\"f === 'src/lib/workout.ts') &&\",\"(/* RETARGET (EXLIB-1B2): 023_exlib_catalog_and_delivery_contract.sql is the approved-for-drafting EXLIB catalog migration (DRAFT, not applied); the boundary moves from exactly-22 to exactly-23; no other migration may appear. */ /* RETARGET (EXLIB-1B3B migration 024 draft): 024_exlib_post_application_hardening.sql is the approved-scope hardening draft (DRAFT, not applied; sha256 190550ecdb99df702ab03d1b07592f861070141e5091eb25bc5bf45f211cc980); the boundary moves from exactly-23 to exactly-24; both filenames stay pinned; no other migration may appear. */ /* RETARGET (EXLIB-1C0B3 migration 025 draft): 025_exlib_equipment_vocabulary_support.sql is the authorized equipment-vocabulary draft (DRAFT, not applied; sha256 fbda16f4d25cacd1715b199050506a4da15896355d96700876b76c68826d304c); the boundary moves from exactly-24 to exactly-25; 024 and 025 both stay pinned; no other migration may appear. */ readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).length === 25 && readdirSync('supabase/migrations').some((f) => f === '023_exlib_catalog_and_delivery_contract.sql') && readdirSync('supabase/migrations').some((f) => f === '024_exlib_post_application_hardening.sql') && readdirSync('supabase/migrations').some((f) => f === '025_exlib_equipment_vocabulary_support.sql'))\"],\"dels\":[\"return execSync('git diff --name-only -- src/lib/fasting.ts src/lib/constants.ts',\",\"{ encoding: 'utf8' }).trim() === ''\",\".every((f) => f === 'supabase/migrations/023_exlib_catalog_and_delivery_contract.sql') &&\",\"(/* RETARGET (EXLIB-1B2): 023_exlib_catalog_and_delivery_contract.sql is the approved-for-drafting EXLIB catalog migration (DRAFT, not applied); the boundary moves from exactly-22 to exactly-23; no other migration may appear. */ /* RETARGET (EXLIB-1B3B migration 024 draft): 024_exlib_post_application_hardening.sql is the approved-scope hardening draft (DRAFT, not applied; sha256 190550ecdb99df702ab03d1b07592f861070141e5091eb25bc5bf45f211cc980); the boundary moves from exactly-23 to exactly-24; both filenames stay pinned; no other migration may appear. */ readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).length === 24 && readdirSync('supabase/migrations').some((f) => f === '023_exlib_catalog_and_delivery_contract.sql') && readdirSync('supabase/migrations').some((f) => f === '024_exlib_post_application_hardening.sql'))\"]},\"scripts/verify-ui6c.ts\":{\"adds\":[\"// ADMISSION (EXLIB-1C0B3): the authorized migration-025\",\"// draft and the coordinated equipment-vocabulary product\",\"// changes are admitted while uncommitted.\",\"f === 'supabase/migrations/025_exlib_equipment_vocabulary_support.sql' ||\",\"f === 'src/types/database.ts' ||\",\"f === 'src/lib/exercise-validation.ts' ||\",\"f === 'src/lib/constants.ts' ||\",\"f === 'src/lib/workout.ts' ||\",\"// ADMISSION (EXLIB-1C0B3): the implementation record and\",\"// local-only guard are admitted while uncommitted.\",\"f.startsWith('docs/exlib1c0b3-') ||\",\".every((f) => f === 'supabase/migrations/023_exlib_catalog_and_delivery_contract.sql' ||\",\"/* ADMISSION (EXLIB-1C0B3): the authorized coordinated\",\"equipment-vocabulary product changes are admitted\",\"while uncommitted (exact four paths only). */\",\"f === 'src/types/database.ts' ||\",\"f === 'src/lib/exercise-validation.ts' ||\",\"f === 'src/lib/constants.ts' ||\",\"f === 'src/lib/workout.ts')\",\"// ADMISSION (EXLIB-1C0B3): the authorized Smith-machine\",\"// progression branch is admitted — pure additions only,\",\"// carrying the phase label; existing helpers untouched.\",\"const d = execSync('git diff -- src/lib/workout.ts', { encoding: 'utf8' })\",\"return d === '' ||\",\"(d.includes('EXLIB-1C0B3') &&\",\"d.split('\\\\n').filter((l) => l.startsWith('-') && !l.startsWith('---')).length === 0)\",\"// RETARGET (EXLIB-1C0B3 migration 025 draft): the authorized\",\"// equipment-vocabulary draft joins the boundary (DRAFT, not\",\"// applied); exactly-24 becomes exactly-25 with 024 and 025\",\"// both pinned.\",\"return files.length === 25 &&\",\"files.includes('025_exlib_equipment_vocabulary_support.sql') &&\"],\"dels\":[\".every((f) => f === 'supabase/migrations/023_exlib_catalog_and_delivery_contract.sql')\",\"return execSync('git diff --name-only -- src/lib/workout.ts', { encoding: 'utf8' }).trim() === ''\",\"return files.length === 24 &&\"]},\"scripts/verify-ui7.ts\":{\"adds\":[\"// ADMISSION (EXLIB-1C0B3): the authorized migration-025\",\"// draft and the coordinated equipment-vocabulary product\",\"// changes are admitted while uncommitted.\",\"f === 'supabase/migrations/025_exlib_equipment_vocabulary_support.sql' ||\",\"f === 'src/types/database.ts' ||\",\"f === 'src/lib/exercise-validation.ts' ||\",\"f === 'src/lib/constants.ts' ||\",\"f === 'src/lib/workout.ts' ||\",\"// ADMISSION (EXLIB-1C0B3): the implementation record and\",\"// local-only guard are admitted while uncommitted.\",\"f.startsWith('docs/exlib1c0b3-') ||\",\".every((f) => f === 'supabase/migrations/023_exlib_catalog_and_delivery_contract.sql' ||\",\"/* ADMISSION (EXLIB-1C0B3): the authorized coordinated\",\"equipment-vocabulary product changes are admitted\",\"while uncommitted (exact four paths only). */\",\"f === 'src/types/database.ts' ||\",\"f === 'src/lib/exercise-validation.ts' ||\",\"f === 'src/lib/constants.ts' ||\",\"f === 'src/lib/workout.ts')\",\"// ADMISSION (EXLIB-1C0B3): the authorized Smith-machine\",\"// progression branch is admitted — pure additions only,\",\"// carrying the phase label; badge maps stay consumer-side.\",\"const d = execSync('git diff -- src/lib/workout.ts', { encoding: 'utf8' })\",\"(d === '' ||\",\"(d.includes('EXLIB-1C0B3') &&\",\"d.split('\\\\n').filter((l) => l.startsWith('-') && !l.startsWith('---')).length === 0))\",\"// RETARGET (EXLIB-1C0B3 migration 025 draft): the authorized\",\"// equipment-vocabulary draft joins the boundary (DRAFT, not\",\"// applied); exactly-24 becomes exactly-25 with 024 and 025\",\"// both pinned.\",\"return files.length === 25 &&\",\"files.includes('025_exlib_equipment_vocabulary_support.sql') &&\"],\"dels\":[\".every((f) => f === 'supabase/migrations/023_exlib_catalog_and_delivery_contract.sql')\",\"execSync('git diff --name-only -- src/lib/workout.ts', { encoding: 'utf8' }).trim() === ''\",\"return files.length === 24 &&\"]},\"src/lib/constants.ts\":{\"adds\":[\"// EXLIB-1C0B3: the four approved additions with Joseph's exact\",\"// decision-7 labels; 'Other' stays last as the catch-all.\",\"{ value: 'weight_plate',  label: 'Weight Plate' },\",\"{ value: 'weighted_vest', label: 'Weighted Vest' },\",\"{ value: 'smith_machine', label: 'Smith Machine' },\",\"{ value: 'sandbag',       label: 'Sandbag' },\"],\"dels\":[]},\"src/lib/exercise-validation.ts\":{\"adds\":[\"// EXLIB-1C0B3: the four approved additions (migration 025). Must\",\"// stay in lockstep with both database equipment CHECKs and\",\"// ExerciseEquipment in src/types/database.ts.\",\"'weight_plate', 'weighted_vest', 'smith_machine', 'sandbag',\"],\"dels\":[]},\"src/lib/workout.ts\":{\"adds\":[\"// EXLIB-1C0B3 decision 6: Smith Machine is handled EXPLICITLY and\",\"// never falls through to the fixed +5 lbs weight branch below --\",\"// Smith-machine loading, plate increments, and counterbalancing\",\"// vary by machine, so the guidance stays neutral and makes no\",\"// claim about machine equivalence.\",\"if (equipment === 'smith_machine') {\",\"return {\",\"action: 'increase',\",\"message: `Try the next available increment/setting${suffix}`,\",\"}\",\"}\",\"\"],\"dels\":[]},\"src/types/database.ts\":{\"adds\":[\"// EXLIB-1C0B3: the four approved equipment-vocabulary additions\",\"// (migration 025; decisions 5-7 in\",\"// docs/exlib1c0b2-equipment-release-product-decisions.md).\",\"| 'weight_plate' | 'weighted_vest' | 'smith_machine' | 'sandbag'\"],\"dels\":[]}}")

async function main() {
  console.log('\nA. Immutable baseline')
  {
    check('A1: ancestry — HEAD descends from the B2 decision commit; stable tag peels to it',
      (() => {
        try {
          const tag = execSync('git rev-parse "exlib1c0b2-equipment-release-product-decisions-stable^{}"', { encoding: 'utf8' }).trim()
          execSync(`git merge-base --is-ancestor ${B2_COMMIT} HEAD`)
          return tag === B2_COMMIT
        } catch { return false }
      })())
    check('A2: B2 artifacts frozen — decision record exact on disk; B2 verifier exact at the B2 commit',
      readFileSync('docs/exlib1c0b2-equipment-release-product-decisions.md').length === 5131 &&
      sha256('docs/exlib1c0b2-equipment-release-product-decisions.md') === B2_RECORD_SHA &&
      (() => {
        try {
          const blob = execSync(`git show ${B2_COMMIT}:scripts/verify-exlib1c0b2.ts`,
            { maxBuffer: 1024 * 1024 * 16 })
          return blob.length === 18664 &&
            createHash('sha256').update(blob).digest('hex') === B2_VERIFIER_SHA
        } catch { return false }
      })())
    check('A3: manifest and AUTHORITATIVE ledger byte-frozen; ledger 48/48 pending-null',
      (() => {
        const led = read('docs/exlib1b1-review-ledger.jsonl')
          .split('\n').filter((l) => l && !l.startsWith('#')).map((l) => JSON.parse(l))
        return sha256('docs/exlib1a-discovery-manifest.jsonl') === MANIFEST_SHA &&
          sha256('docs/exlib1b1-review-ledger.jsonl') === LEDGER_SHA &&
          led.length === 48 &&
          led.every((l) => l.status === 'pending' && l.reviewer === null &&
            l.reviewed_at === null && l.decision_rationale === null)
      })())
    check('A4: migrations exactly 001-025 — 023/024 frozen; 025 has the exact draft filename and fingerprint',
      (() => {
        const files = readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql'))
        return files.length === 25 &&
          files.filter((f) => f.startsWith('025')).length === 1 &&
          files.includes('025_exlib_equipment_vocabulary_support.sql') &&
          sha256('supabase/migrations/023_exlib_catalog_and_delivery_contract.sql') === M023_SHA &&
          sha256('supabase/migrations/024_exlib_post_application_hardening.sql') === M024_SHA &&
          readFileSync(M025_FILE).length === M025_BYTES &&
          sha256(M025_FILE) === M025_SHA
      })())
    check('A5: all 26 candidates and all 9 resolutions remain import-ineligible; no importer artifacts',
      (() => {
        const recs = read('docs/exlib1c0a-equipment-resolution.jsonl')
          .split('\n').filter((l) => l && !l.startsWith('#')).map((l) => JSON.parse(l))
        const cands = recs.flatMap((r: any) => r.canonical_candidates)
        return recs.length === 9 && cands.length === 26 &&
          cands.every((c: any) => c.import_eligible === false) &&
          recs.every((r: any) => r.import_eligible === false) &&
          !existsSync('scripts/exlib1c-import.ts') &&
          !existsSync('src/lib/catalog-import.ts')
      })())
  }

  console.log('\nB. Migration 025 draft')
  {
    check('B1: header — DRAFT NOT APPLIED; anchors 024 fingerprint and the B2 stable record; no content data',
      m025.includes('STATUS: DRAFT — NOT APPLIED') &&
      m025.includes(M024_SHA) &&
      m025.includes(B2_RECORD_SHA) &&
      m025.includes('exlib1c0b2-equipment-release-product-decisions-stable') &&
      m025.includes('CONTAINS NO CONTENT DATA'))
    check('B2: atomic wrapper — exactly one BEGIN and one COMMIT; the executable statements are exactly the two replacements — zero NOTIFY',
      (() => {
        const stmts = m025Exec.split(';').map((s) => s.replace(/\s+/g, ' ').trim()).filter(Boolean)
        // Within-phase correction (EXLIB-1C0B3 direct review):
        // NOTIFY removed — a CHECK vocabulary expansion needs no
        // PostgREST schema-cache reload and it sat outside the
        // authorized exact constraint-replacement scope. The exact
        // 6-statement inventory below IS the one-BEGIN/one-COMMIT
        // proof: BEGIN first, COMMIT last, nothing else, zero NOTIFY.
        return stmts.filter((x) => x === 'BEGIN').length === 1 &&
          stmts.filter((x) => x === 'COMMIT').length === 1 &&
          stmts.every((x) => !/NOTIFY|reload schema/i.test(x)) &&
          stmts.length === 6 &&
          stmts[0] === 'BEGIN' &&
          stmts[1] === 'ALTER TABLE public.exercises DROP CONSTRAINT exercises_equipment_check' &&
          stmts[2].startsWith('ALTER TABLE public.exercises ADD CONSTRAINT exercises_equipment_check CHECK (equipment IN (') &&
          stmts[3] === 'ALTER TABLE public.exercise_catalog DROP CONSTRAINT exercise_catalog_equipment_check' &&
          stmts[4].startsWith('ALTER TABLE public.exercise_catalog ADD CONSTRAINT exercise_catalog_equipment_check CHECK (equipment IN (') &&
          stmts[5] === 'COMMIT'
      })())
    check('B3: both re-added CHECKs carry the exact old-plus-four vocabulary in order (mechanically discovered installed names, now explicit)',
      (() => {
        const expected = ALL_VALUES.map((v) => `'${v}'`).join(', ')
        const bodies = Array.from(m025Exec.matchAll(/ADD CONSTRAINT \w+ CHECK \(equipment IN \(([^)]+)\)\)/g))
          .map((m) => m[1].replace(/\s+/g, ' ').trim())
        return bodies.length === 2 && bodies.every((b) => b === expected)
      })())
    check('B4: forbidden constructs absent — no IF (NOT) EXISTS / NOT VALID / CONCURRENTLY / dynamic SQL / exception handling / DML / table-column-policy-grant-trigger-function-RLS change / weight_time',
      !/IF EXISTS|IF NOT EXISTS|NOT VALID|CONCURRENTLY|EXECUTE |EXCEPTION|NOTIFY|reload schema/i.test(m025Exec) &&
      !/CREATE TABLE|CREATE POLICY|CREATE TRIGGER|CREATE FUNCTION|CREATE INDEX|GRANT |REVOKE |INSERT INTO|UPDATE |DELETE FROM|ADD COLUMN|DROP COLUMN|ROW LEVEL SECURITY/i.test(m025Exec) &&
      // The header COMMENT documents the weight_time exclusion; the
      // executable text must never contain it.
      !/weight_time/i.test(m025Exec))
  }

  console.log('\nC. Coordinated product implementation')
  {
    check('C1: ExerciseEquipment union is exactly the twelve values; no weight_time',
      ALL_VALUES.every((v) => dbTypes.includes(`'${v}'`)) &&
      (() => {
        const seg = dbTypes.slice(dbTypes.indexOf('export type ExerciseEquipment'),
          dbTypes.indexOf('export type ExerciseType'))
        const vals = Array.from(seg.matchAll(/'([a-z_]+)'/g)).map((m) => m[1])
        return vals.length === 12 &&
          JSON.stringify([...vals].sort()) === JSON.stringify([...ALL_VALUES].sort()) &&
          !seg.includes('weight_time')
      })())
    check('C2: EQUIPMENT_TYPES is exactly the twelve values and validateEquipment still fails closed on unknown values',
      (() => {
        const seg = validation.slice(validation.indexOf('export const EQUIPMENT_TYPES'),
          validation.indexOf('] as const', validation.indexOf('export const EQUIPMENT_TYPES')))
        const vals = Array.from(seg.matchAll(/'([a-z_]+)'/g)).map((m) => m[1])
        return vals.length === 12 &&
          JSON.stringify([...vals].sort()) === JSON.stringify([...ALL_VALUES].sort()) &&
          validation.includes("return fail('Invalid equipment value.')")
      })())
    check('C3: EXERCISE_EQUIPMENT options — the exact four decision-7 labels added, all eight existing labels unchanged, Other stays last',
      (() => {
        const seg = constants.slice(constants.indexOf('export const EXERCISE_EQUIPMENT'),
          constants.indexOf('] as const', constants.indexOf('export const EXERCISE_EQUIPMENT')))
        const pairs = Array.from(seg.matchAll(/value: '([a-z_]+)',\s*label: '([^']+)'/g)).map((m) => [m[1], m[2]])
        return pairs.length === 12 &&
          LABELS.every(([v, l]) => pairs.some(([pv, pl]) => pv === v && pl === l)) &&
          OLD_LABELS.every(([v, l]) => pairs.some(([pv, pl]) => pv === v && pl === l)) &&
          pairs[pairs.length - 1][0] === 'other'
      })())
    check('C4: Smith Machine progression — explicit branch, neutral increment/setting wording, no fixed +5 lb fall-through, machine/cable unchanged, no counterbalance claims in messages',
      (() => {
        const smithIdx = workout.indexOf("if (equipment === 'smith_machine')")
        const fallbackIdx = workout.indexOf('SUGGESTED_WEIGHT_INCREASE_LBS', workout.indexOf('buildIncreaseSuggestion('))
        return smithIdx > 0 &&
          workout.includes('Try the next available increment/setting${suffix}'.replace('\\', '')) &&
          workout.includes("if (equipment === 'machine' || equipment === 'cable')") &&
          workout.includes('Try the next available setting${suffix}'.replace('\\', '')) &&
          fallbackIdx > smithIdx &&
          !/counterbalanc/i.test(Array.from(workout.matchAll(/message: `([^`]*)`/g)).map((m) => m[1]).join(' '))
      })())
    check('C5: consumer completeness — every vocabulary-bearing src file is exactly the three authoritative modules and each carries all four new values',
      (() => {
        const out = execSync("grep -rl \"'kettlebell'\" src/ || true", { encoding: 'utf8' })
          .split('\n').filter(Boolean).sort()
        return JSON.stringify(out) === JSON.stringify([
          'src/lib/constants.ts', 'src/lib/exercise-validation.ts', 'src/types/database.ts']) &&
          out.every((f) => NEW_VALUES.every((v) => read(f).includes(`'${v}'`)))
      })())
    check('C6: no weight_time support anywhere in src/ and none in the migration',
      (() => {
        const out = execSync("grep -rl 'weight_time' src/ || true", { encoding: 'utf8' }).trim()
        return out === '' && !/weight_time/.test(m025Exec)
      })())
    check('C7: catalog delivery preserves equipment verbatim — no remap between catalog and tenant rows',
      (() => {
        const m023 = read('supabase/migrations/023_exlib_catalog_and_delivery_contract.sql')
        const deliver = m023.slice(m023.indexOf('deliver_catalog_exercises'))
        return deliver.includes('v_cat.equipment') &&
          !/CASE\s+v_cat\.equipment/i.test(deliver)
      })())
  }

  console.log('\nD. Live disposable-database suite')
  {
    check('D1: live script — set -euo pipefail; gates 023/024/025 fingerprints BEFORE initdb; socket-only; teardown trap; never contacts Supabase',
      live.startsWith('#!/bin/bash') &&
      live.includes('set -euo pipefail') &&
      live.indexOf('Fingerprint gates') < live.indexOf('initdb -D') &&
      live.includes(`SHA023="${M023_SHA}"`) &&
      live.includes(`SHA024="${M024_SHA}"`) &&
      live.includes(`SHA025="${M025_SHA}"`) &&
      live.includes('BYTES025=3587') &&
      live.includes("listen_addresses=''") &&
      live.includes('trap cleanup EXIT') &&
      // The live script CREATEs a local stub role named
      // service_role (never a key); only genuine contact markers
      // are forbidden.
      !/supabase\.co|SUPABASE_URL|db push/.test(live) &&
      !/SUPABASE_SERVICE_ROLE|service_role_key/i.test(live))
    check('D2: live script structure — applies exact 001-025 in order, proves both 12-value definitions, all twelve inserts plus unknown-fails-closed, 024 unaffected, zero content rows, and forced-failure atomicity',
      live.includes('Apply auth stubs + exact migrations 001-025 in order') &&
      live.includes('exercises_equipment_check') &&
      live.includes('exercise_catalog_equipment_check') &&
      ALL_VALUES.every((v) => live.includes(v)) &&
      live.includes('trampoline') &&
      live.includes('the four 024 indexes still exist') &&
      live.includes('catalog content tables remain 0/0/0/0') &&
      live.includes('Atomicity: second database with a forced mid-transaction failure') &&
      live.includes('DROP CONSTRAINT exercise_catalog_equipment_check'))
  }

  console.log('\nE. Implementation record, incident, and local-only guard')
  {
    const rec = read('docs/exlib1c0b3-coordinated-equipment-implementation.md')
    const recFlat = rec.replace(/\s+/g, ' ')
    check('E1: the implementation record anchors B2, inventories the coordinated release, and pins the CORRECTED migration fingerprint with DRAFT status',
      recFlat.includes('Migration 025 status: DRAFT — NOT APPLIED') &&
      recFlat.includes(B2_COMMIT) &&
      recFlat.includes('exlib1c0b2-equipment-release-product-decisions-stable') &&
      recFlat.includes(B2_RECORD_SHA) &&
      recFlat.includes(M025_SHA) &&
      recFlat.includes('3,587 bytes') &&
      recFlat.includes('exactly six executable statements') &&
      recFlat.includes('zero NOTIFY') &&
      LABELS.every(([v, l]) => recFlat.includes(v) && recFlat.includes(l)) &&
      recFlat.includes('Try the next available increment/setting') &&
      recFlat.includes('remains 48/48 pending-null') &&
      recFlat.includes('remain `import_eligible: false`'))
    check('E2: the hosted-contact incident section records EVERY required fact and never claims the boundary was fully held',
      rec.includes('## 5. Hosted-contact boundary incident — 2026-08-26') &&
      recFlat.includes('dev server was initially launched BEFORE the local Supabase override was active') &&
      recFlat.includes('One anonymous middleware auth request (page load) and two failed sign-in attempts for a nonexistent local fixture user reached the hosted Supabase auth endpoint') &&
      recFlat.includes('No valid session was created; no authenticated query, data read, data mutation, migration application, or catalog loading occurred') &&
      recFlat.includes('`.env.local` was not modified') &&
      recFlat.includes('test sequencing/configuration') &&
      recFlat.includes('This is a boundary violation even though it caused no database mutation') &&
      recFlat.includes('Claude made the contact, not Joseph or ChatGPT') &&
      recFlat.includes('No further hosted contact is authorized') &&
      recFlat.includes('supersedes any implication elsewhere that the no-hosted-contact boundary was fully held; it was not'))
    // REVISED (EXLIB-1C0B3 final guard correction): the prevention
    // rule must now state the REAL effective development-environment
    // resolution — process env highest, then the four dotenv files in
    // order, first defined wins — and that the guard parses the
    // actual winning value with a real URL parser.
    check('E3: the prevention rule is complete — stack first, overrides, EFFECTIVE-env precedence (process env highest, four dotenv files in order), real URL parsing of the winning value, dev server last, fail closed',
      recFlat.includes('Start the disposable/local Supabase stack FIRST') &&
      recFlat.includes('Materialize explicit local-only environment overrides') &&
      recFlat.includes('Mechanically reject any Supabase URL whose host is not loopback') &&
      recFlat.includes('takes HIGHEST precedence, then `.env.development.local`, `.env.local`, `.env.development`, `.env` (first defined wins)') &&
      recFlat.includes('a hosted process value cannot be masked by a local dotenv file') &&
      recFlat.includes('parses the actual winning value with a real URL parser (Node WHATWG `new URL()`)') &&
      // REVISED (EXLIB-1C0B3 final guard correction, defined-vs-empty):
      // the record must state that DEFINED includes an explicitly
      // empty value and that an empty winner fails closed.
      recFlat.includes('Defined includes an explicitly empty value; an empty higher-priority value wins resolution and fails closed rather than falling through') &&
      recFlat.includes('Only then start the dev server') &&
      recFlat.includes('pre-browser assertion proving all effective Supabase endpoints resolve to `127.0.0.1` or `localhost`') &&
      recFlat.includes('Fail closed BEFORE browser launch otherwise'))
    // REVISED (EXLIB-1C0B3 final guard correction): the guard now
    // models the REAL effective Next.js development environment
    // (process env > .env.development.local > .env.local >
    // .env.development > .env) and parses the winning value with a
    // real URL parser. Explicit fixture invocations run with
    // NEXT_PUBLIC_SUPABASE_URL removed from the child environment so
    // inherited values can never contaminate a fixture result.
    // REVISED (EXLIB-1C0B3 final guard correction, defined-vs-empty):
    // E4 grows from 18 to 21 cases — a DEFINED (set-but-empty)
    // higher-priority value must WIN the resolution and fail closed,
    // never falling through: exported empty over a loopback dotenv;
    // empty .env.development.local over a loopback .env.local; and an
    // empty fixture key while a hosted process value exists (fixture
    // mode must fail on the empty value without consulting or leaking
    // the process value).
    check('E4: guard case matrix — 21/21 (precedence, defined-vs-empty fail-closed, parser, credential/interpolation/hostname rejections, loopback passes, zero output leaks)',
      (() => {
        try {
          const fs = require('fs')
          const os = require('os')
          const path = require('path')
          const guardAbs = path.resolve('scripts/verify-exlib1c0b3-guard.sh')
          const HOSTED = 'https://ttybyljytiwntvorugcv.supabase.co'
          const LOOP = 'http://127.0.0.1:55321'
          const base = fs.mkdtempSync(path.join(os.tmpdir(), 'b3-guard-'))
          // Minimal, fully-controlled child environment so an inherited
          // NEXT_PUBLIC_SUPABASE_URL can never leak into a guard
          // invocation that did not explicitly set one. NODE_ENV is set
          // only because the app's ProcessEnv augmentation requires it;
          // the guard never reads it.
          const childEnv = (extra: Record<string, string>): NodeJS.ProcessEnv => ({
            PATH: process.env.PATH as string, HOME: process.env.HOME as string,
            NODE_ENV: 'test' as NodeJS.ProcessEnv['NODE_ENV'], ...extra,
          })
          const run = (cwd: string, envUrl: string | null, args: string[]): { code: number; out: string } => {
            try {
              const out = execSync(['bash', guardAbs, ...args].join(' '), {
                cwd, encoding: 'utf8',
                env: childEnv(envUrl === null ? {} : { NEXT_PUBLIC_SUPABASE_URL: envUrl }),
              })
              return { code: 0, out }
            } catch (e: any) {
              return { code: e.status ?? 1, out: String(e.stdout ?? '') }
            }
          }
          const dir = (name: string, files: Record<string, string>): string => {
            const d = path.join(base, name)
            fs.mkdirSync(d, { recursive: true })
            for (const [f, url] of Object.entries(files)) {
              fs.writeFileSync(path.join(d, f), `NEXT_PUBLIC_SUPABASE_URL=${url}\n`)
            }
            return d
          }
          const fixture = (url: string | null): string => {
            const f = path.join(base, 'fixture.env')
            fs.writeFileSync(f, url === null ? 'OTHER=1\n' : `NEXT_PUBLIC_SUPABASE_URL=${url}\n`)
            return f
          }
          const results: boolean[] = []
          // 1-3: process env has highest precedence
          const c1 = dir('c1', { '.env.development.local': LOOP })
          results.push(run(c1, HOSTED, []).code !== 0)
          results.push(run(c1, 'https://example.com', []).code !== 0)
          const c3 = dir('c3', { '.env.development.local': HOSTED, '.env.local': HOSTED, '.env.development': HOSTED, '.env': HOSTED })
          results.push(run(c3, LOOP, []).code === 0)
          // 4-7: dotenv precedence chain
          results.push(run(dir('c4', { '.env.development.local': LOOP, '.env.local': HOSTED }), null, []).code === 0)
          results.push(run(dir('c5', { '.env.development.local': HOSTED, '.env.local': LOOP }), null, []).code !== 0)
          results.push(run(dir('c6', { '.env.local': LOOP, '.env.development': HOSTED }), null, []).code === 0)
          results.push(run(dir('c7', { '.env.development': LOOP, '.env': HOSTED }), null, []).code === 0)
          // 8-17: explicit fixture mode (child env cleared of the URL var)
          results.push(run(base, null, [fixture('http://localhost:55321')]).code === 0)
          results.push(run(base, null, [fixture(LOOP)]).code === 0)
          results.push(run(base, null, [fixture('http://[bad')]).code !== 0)
          results.push(run(base, null, [fixture('example.com/path')]).code !== 0)
          results.push(run(base, null, [fixture('http://user:SECRETMARK@127.0.0.1:55321')]).code !== 0)
          results.push(run(base, null, [fixture('https://localhost.evil.example')]).code !== 0)
          results.push(run(base, null, [fixture('$SUPABASE_URL')]).code !== 0)
          // eslint-disable-next-line no-template-curly-in-string
          results.push(run(base, null, [fixture('${SUPABASE_URL}')]).code !== 0)
          results.push(run(base, null, [fixture(null)]).code !== 0)
          results.push(run(base, null, [fixture(HOSTED)]).code !== 0)
          // 18: zero output leaks of path/query/fragment/credential markers
          const leak = run(base, null, [fixture('http://user:SECRETMARK@127.0.0.1:55321/pathMARK?q=QMARK#fMARK')])
          results.push(leak.code !== 0 && !/SECRETMARK|pathMARK|QMARK|fMARK/.test(leak.out))
          // 19-21: DEFINED-but-empty wins and fails closed, never
          // falling through to a lower-priority source.
          // 19: exported EMPTY value beats a loopback dotenv -> FAIL
          //     attributed to process-env (no fall-through PASS).
          const r19 = run(dir('c19', { '.env.development.local': LOOP }), '', [])
          results.push(r19.code !== 0 && /EMPTY \(source: process-env\)/.test(r19.out))
          // 20: EMPTY .env.development.local beats a loopback
          //     .env.local -> FAIL attributed to the empty file.
          const r20 = run(dir('c20', { '.env.development.local': '', '.env.local': LOOP }), null, [])
          results.push(r20.code !== 0 && /EMPTY \(source: \.env\.development\.local\)/.test(r20.out))
          // 21: fixture with an EMPTY key while a HOSTED process value
          //     exists -> FAIL on the fixture's empty value; the
          //     process value is neither consulted nor leaked.
          const r21 = run(base, HOSTED, [fixture('')])
          results.push(r21.code !== 0 && /EMPTY \(source: file-arg\)/.test(r21.out) &&
            !r21.out.includes('ttybyljytiwntvorugcv') && !r21.out.includes('process-env'))
          fs.rmSync(base, { recursive: true, force: true })
          const guardSrc = read('scripts/verify-exlib1c0b3-guard.sh')
          return results.length === 21 && results.every(Boolean) &&
            guardSrc.includes('set -euo pipefail') &&
            guardSrc.includes('new URL(raw)') &&
            !/\bsed\b/.test(guardSrc) &&
            !guardSrc.includes('ANON_KEY')
        } catch { return false }
      })())
    // REVISED (EXLIB-1C0B3 final guard correction): the guarded key
    // is mechanically proven to be the ONLY authoritative Supabase
    // endpoint URL key the application flow reads.
    check('E5: NEXT_PUBLIC_SUPABASE_URL is the only Supabase endpoint URL key read by src/',
      (() => {
        try {
          const out = execSync(
            "grep -rhoE 'process\\.env\\.[A-Z_]*SUPABASE[A-Z_]*' src/ | sort -u",
            { encoding: 'utf8' }).trim().split('\n').filter(Boolean).sort()
          return JSON.stringify(out) === JSON.stringify([
            'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY',
            'process.env.NEXT_PUBLIC_SUPABASE_URL'])
        } catch { return false }
      })())
  }

  console.log('\nG. Phase boundary')
  {
    // Within-phase correction (EXLIB-1C0B3 direct review): the
    // durable implementation record and the local-only guard join
    // the phase inventory.
    const INVENTORY_UNTRACKED = [
      M025_FILE, LIVE_SCRIPT, 'scripts/verify-exlib1c0b3.ts',
      'docs/exlib1c0b3-coordinated-equipment-implementation.md',
      'scripts/verify-exlib1c0b3-guard.sh',
    ]
    const MODIFIED = Object.keys(DIFF_MAP).sort()
    const diffLineExact = (diffText: string, f: string): boolean => {
      const adds = diffText.split('\n').filter((l) => l.startsWith('+') && !l.startsWith('+++')).map((l) => l.slice(1).trim())
      const dels = diffText.split('\n').filter((l) => l.startsWith('-') && !l.startsWith('---')).map((l) => l.slice(1).trim())
      const want = DIFF_MAP[f]
      return !!want && JSON.stringify(adds) === JSON.stringify(want.adds) &&
        JSON.stringify(dels) === JSON.stringify(want.dels)
    }
    const migInHead = (() => {
      try {
        execSync(`git cat-file -e HEAD:${M025_FILE}`, { stdio: 'pipe' })
        return true
      } catch { return false }
    })()
    check(`G1: lifecycle-safe phase boundary (${migInHead ? 'COMMITTED' : 'UNCOMMITTED REVIEW'} state) — exact inventory and LINE-EXACT diffs on every modified path`,
      (() => {
        try {
          if (!migInHead) {
            const entries = execSync('git status --porcelain', { encoding: 'utf8' }).split('\n').filter(Boolean)
            const untracked = entries.filter((l) => l.startsWith('??')).map((l) => l.slice(3).trim()).sort()
            const modified = entries.filter((l) => !l.startsWith('??'))
              .map((l) => (l.match(/^\s*[A-Z?]{1,2}\s+(.+)$/) as RegExpMatchArray)[1]).sort()
            const staged = execSync('git diff --cached --name-only', { encoding: 'utf8' }).trim()
            if (staged !== '') return false
            if (JSON.stringify(untracked) !== JSON.stringify([...INVENTORY_UNTRACKED].sort())) return false
            if (JSON.stringify(modified) !== JSON.stringify(MODIFIED)) return false
            return modified.every((f) =>
              diffLineExact(execSync(`git diff -- ${f}`, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 16 }), f))
          }
          // ADMISSION (EXLIB-1C0B3 application record): while the
          // durable application/deployment/hosted-QA record is being
          // prepared uncommitted on the promoted main, the worktree
          // may contain exactly that record (untracked) and this
          // verifier (modified). Anything else still fails. Once the
          // record phase commits, the status is empty again and this
          // admission is inert.
          const dirt = execSync('git status --porcelain', { encoding: 'utf8' })
            .split('\n').filter(Boolean).map((l) => l.trim()).sort()
          const APP_RECORD_DIRT = [
            '?? docs/exlib1c0b3-application-deployment-hosted-qa-record.md',
            'M scripts/verify-exlib1c0b3.ts',
          ].sort()
          if (dirt.length !== 0 &&
            JSON.stringify(dirt) !== JSON.stringify(APP_RECORD_DIRT)) return false
          if (execSync('git diff --cached --name-only', { encoding: 'utf8' }).trim() !== '') return false
          const adders = execSync(
            `git log --all --format=%H --diff-filter=A -- ${M025_FILE}`,
            { encoding: 'utf8' }).split('\n').filter(Boolean)
          if (adders.length !== 1) return false
          const phase = adders[0]
          for (const p of [LIVE_SCRIPT, 'scripts/verify-exlib1c0b3.ts',
            'docs/exlib1c0b3-coordinated-equipment-implementation.md',
            'scripts/verify-exlib1c0b3-guard.sh']) {
            const a = execSync(`git log --all --format=%H --diff-filter=A -- ${p}`,
              { encoding: 'utf8' }).split('\n').filter(Boolean)
            if (a.length !== 1 || a[0] !== phase) return false
          }
          execSync(`git merge-base --is-ancestor ${phase} HEAD`)
          const range = execSync(`git diff --name-only ${phase}^..${phase}`, { encoding: 'utf8' })
            .split('\n').filter(Boolean).sort()
          const expected = [...INVENTORY_UNTRACKED, ...MODIFIED].sort()
          if (JSON.stringify(range) !== JSON.stringify(expected)) return false
          return MODIFIED.every((f) =>
            diffLineExact(execSync(`git diff ${phase}^..${phase} -- ${f}`, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 16 }), f))
        } catch { return false }
      })())
    check('G2: no hosted-service contact markers in the migration or live script',
      [m025, live].every((t) =>
        !/ttybyljytiwntvorugcv|supabase\.co\b|vercel\.com|db push/.test(t)))
  }

  console.log('\nH. Application, deployment, and hosted-QA record (EXLIB-1C0B3 application record)')
  {
    // ADMISSION (EXLIB-1C0B3 application record): pins every
    // authoritative fact of the durable application/deployment/
    // hosted-QA record. Documentation checks only — this section
    // performs NO Supabase or Vercel contact; hosted facts are
    // pinned as recorded statements from ChatGPT's authenticated
    // session reports, and repository facts are checked mechanically.
    const APP_RECORD = 'docs/exlib1c0b3-application-deployment-hosted-qa-record.md'
    const rec = read(APP_RECORD)
    const flat = rec.replace(/\s+/g, ' ')
    check('H1: record pins the exact source promotion and migration application — SHAs, tag object, tree, fingerprints, history entry, constraint verification, and the preserved historical DRAFT header',
      flat.includes('f20ab59b0e4375e6ec7d80c90583585d2c0bf9c0') &&
      flat.includes('360ccd24ac1529c910fc58744be71b3bf9838af3') &&
      flat.includes('exlib1c0b3-coordinated-equipment-support-stable') &&
      flat.includes('f6c20450c6a4f1b919b177bb212d7e2d112d6f0b') &&
      flat.includes('436ea1b7b43aef4f4b350cedef49ce1f3c8ac880') &&
      flat.includes(M025_SHA) &&
      flat.includes('e576d4298e799041befb716186d10d8433a94d3734225596ce8b6966a858d0f1') &&
      flat.includes('f5fcda9ef95b4743f8e4009d5a1330289e046d20cc524e944a8d2e91c53b06a4') &&
      flat.includes('29aa42146a132d4ab7be3be110df21095e5c0ee90b2311be9b84fc7803674a3d') &&
      flat.includes('da5e42379ace7ef199f73a23a230b32a97c52ccc972118837535abdb1a1ed1eb') &&
      flat.includes('Applied by ChatGPT') &&
      flat.includes('never by Claude') &&
      flat.includes('20260826203154_exlib_equipment_vocabulary_support') &&
      flat.includes('validated, non-deferrable, and containing exactly all 12 accepted values') &&
      flat.includes('deliberately NOT rewritten') &&
      m025.includes('STATUS: DRAFT — NOT APPLIED') &&
      sha256(M025_FILE) === M025_SHA)
    check('H2: record pins the automatic deployment and hosted QA — Vercel identifiers, deployed SHA, alias, four QA exercises and persisted values, edit-flow notes, bundle guidance, and the complete cleanup counts',
      flat.includes('prj_wmJg53QOXs4HI4hYhdBwH8VcH8RC') &&
      flat.includes('dpl_HAHnk2W2YcnZn9tSaieQvm5Y7BAb') &&
      flat.includes('status READY') &&
      flat.includes('https://shredos-pi.vercel.app') &&
      flat.includes('no manual Vercel deployment or configuration operation occurred') &&
      ['QA EXLIB Weight Plate 2026-08-27', 'QA EXLIB Weighted Vest 2026-08-27',
        'QA EXLIB Smith Machine 2026-08-27', 'QA EXLIB Sandbag 2026-08-27']
        .every((n) => flat.includes(n)) &&
      ['`weight_plate`', '`weighted_vest`', '`smith_machine`', '`sandbag`']
        .every((v) => flat.includes(v)) &&
      flat.includes('Hosted QA edit verified') &&
      flat.includes('next available increment/setting') &&
      flat.includes('rose from 84 to 88') &&
      flat.includes('zero workout and routine references') &&
      flat.includes('exactly four `exercise_name_claim` rows and exactly four QA exercises') &&
      flat.includes('exercises 84; exercise_name_claims 84; remaining QA exercises 0') &&
      flat.includes('Tenant rows using the four new values: 0. Catalog rows using the four new values: 0') &&
      flat.includes('Catalog content remained zero throughout') &&
      flat.includes('runtime-error query found no errors') &&
      flat.includes('warning/error log query found no matching logs'))
    check('H3: record states the evidence layers honestly and the frozen prohibitions — hosted facts are relayed session reports, the ledger is a committed source artifact (mechanically 48/48 pending-null, 26/26 import-ineligible), and catalog/EXLIB-1C loading remain unauthorized',
      (() => {
        try {
          if (!flat.includes('COMMITTED SOURCE ARTIFACT')) return false
          if (!flat.includes('not by querying any hosted ledger table')) return false
          if (!flat.includes('Claude performed no Supabase or Vercel contact')) return false
          if (!flat.includes("ChatGPT's authenticated hosted application, deployment, and QA session reports")) return false
          if (!flat.includes('Catalog loading remains UNAUTHORIZED')) return false
          if (!flat.includes('EXLIB-1C loading remains UNAUTHORIZED')) return false
          if (!flat.includes('48/48 pending-null')) return false
          if (!flat.includes('`import_eligible: false`')) return false
          const parseJsonl = (p: string): any[] => read(p).split('\n')
            .filter((l) => l.trim() && !l.trim().startsWith('#')).map((l) => JSON.parse(l))
          const led = parseJsonl('docs/exlib1b1-review-ledger.jsonl')
          const cands = parseJsonl('docs/exlib1c0a-equipment-resolution.jsonl')
            .flatMap((r: any) => r.canonical_candidates)
          return led.length === 48 &&
            led.every((r: any) => r.status === 'pending' && r.reviewer === null &&
              r.reviewed_at === null && r.decision_rationale === null) &&
            cands.length === 26 &&
            cands.every((c: any) => c.import_eligible === false)
        } catch { return false }
      })())
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
