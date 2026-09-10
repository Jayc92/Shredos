// ============================================================
// ForgeFitOS — migration 028 TEXT verifier (W6), deterministic.
// (docs/weight-time-coordinated-implementation-plan.md §10, §16 W6.)
//
// The behavioural proof of 028 is scripts/verify-weight-time-contract-live.sh
// (disposable database). This verifier proves, from the committed TEXT and
// immutable git objects alone, the things a database run cannot:
//   * section D of 028 is migration 026's deliver_catalog_exercises
//     definition (lines 146-623) with EXACTLY two lines added — one
//     WHEN 'weight_time' THEN 'strength' arm immediately before each
//     ELSE 'strength' — and nothing else (Decision 3, no fallback-derived
//     classification, every other semantic byte-identical);
//   * 028 stays inside the operator-confirmed scope (one transaction, no
//     NOTIFY, no new column/table, no catalog admission);
//   * 028 drops exactly the two constraint names discovered in W2;
//   * append_workout_set keeps 021's signature and gains exactly the
//     weight_time contract (branch, completion rule, mode-aware lower bound);
//   * the guard trigger/function have the reviewed shape and surface;
//   * the header states LOCAL-ONLY / NOT APPLIED;
//   * migrations 026 and 027 are byte-identical to origin/main (immutable
//     pin 59e443ba): history was not edited in place.
// It prints 028's byte size and sha256 for the record; it does NOT pin them
// (the hosted application record will, when that act happens).
//
// Run from the repository root:
//   npx tsx scripts/verify-weight-time-migration-028.ts
// ============================================================

import path from 'node:path'
import { createHash } from 'node:crypto'
import { execSync } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'

const repositoryRoot = process.cwd()
const read = (relativePath: string): string => readFileSync(path.join(repositoryRoot, relativePath), 'utf8')
const ORIGIN_MAIN = '59e443ba3d75e4b2073d709c07d8b3142201c6bd'
const MIGRATION_028 = 'supabase/migrations/028_weight_time_tracking_mode.sql'
const MIGRATION_026 = 'supabase/migrations/026_exlib_plank_seed_reconciliation.sql'
const MIGRATION_027 = 'supabase/migrations/027_exlib_catalog_content_schema.sql'

let passed = 0
let failed = 0
function check(name: string, condition: boolean, detail?: string): void {
  if (condition) { passed += 1; console.log(`  PASS  ${name}`) } else { failed += 1; console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`) }
}

console.log('Migration 028 text verification (W6)')
console.log(`root=${repositoryRoot}`)
const text028 = read(MIGRATION_028)
console.log(`${MIGRATION_028}: ${Buffer.byteLength(text028)} bytes, sha256 ${createHash('sha256').update(text028).digest('hex')} (recorded, not pinned)`)

console.log('\nA. Identity and scope')
const migrationFiles = readdirSync(path.join(repositoryRoot, 'supabase', 'migrations')).filter((name) => /^0\d\d_.*\.sql$/.test(name)).sort()
check('A1: exactly 28 numbered migrations; 028 is the only file numbered 028 and the last one',
  migrationFiles.length === 28 && migrationFiles.filter((name) => name.startsWith('028_')).length === 1 && migrationFiles[27] === '028_weight_time_tracking_mode.sql')
check('A2: one transaction — exactly one BEGIN; and one COMMIT;, BEGIN before COMMIT',
  (text028.match(/^BEGIN;$/gm) ?? []).length === 1 && (text028.match(/^COMMIT;$/gm) ?? []).length === 1 && text028.indexOf('BEGIN;') < text028.indexOf('COMMIT;'))
check('A3: no NOTIFY (no PostgREST-visible signature changes), no new column, no new table, no DROP TABLE, no catalog data statement',
  !/NOTIFY/.test(text028) && !/ADD COLUMN/i.test(text028) && !/CREATE TABLE/i.test(text028) && !/DROP TABLE/i.test(text028)
    && !/INSERT INTO public\.exercise_catalog\b/i.test(text028) && !/admit_catalog_content|publish_catalog_content|load_catalog_/i.test(text028))
check('A4: the header states LOCAL-ONLY / NOT APPLIED and names the plan, the W2 record and the proof suite',
  /LOCAL-ONLY\. This file is NOT APPLIED to any hosted project/.test(text028)
    && text028.includes('docs/weight-time-coordinated-implementation-plan.md')
    && text028.includes('docs/weight-time-w2-installed-constraint-names.md')
    && text028.includes('scripts/verify-weight-time-contract-live.sh'))

console.log('\nB. Section A — the two CHECKs by their W2 installed names')
const drops = text028.match(/^\s*DROP CONSTRAINT (\w+);/gm) ?? []
check('B1: exactly two DROP CONSTRAINT statements: exercises_tracking_mode_check and exercise_catalog_tracking_mode_check',
  drops.length === 2 && /DROP CONSTRAINT exercises_tracking_mode_check;/.test(text028) && /DROP CONSTRAINT exercise_catalog_tracking_mode_check;/.test(text028))
const fiveValue = "CHECK (tracking_mode IN ('weight_reps', 'bodyweight', 'cardio', 'timed', 'weight_time'))"
check('B2: both constraints are re-added under the SAME names with the exact five-value definition',
  (text028.split(fiveValue).length - 1) === 2
    && /ADD CONSTRAINT exercises_tracking_mode_check\s+CHECK/.test(text028) && /ADD CONSTRAINT exercise_catalog_tracking_mode_check\s+CHECK/.test(text028))
check('B3: migrations 010 and 023 are not edited in place (their four-value text is intact) — the widening lives only in 028',
  /CHECK \(tracking_mode IN\s*\('weight_reps',\s*'bodyweight',\s*'cardio',\s*'timed'\)\)/.test(read('supabase/migrations/010_phase2r_exercise_tracking_modes.sql'))
    && /CHECK \(tracking_mode IN\s*\('weight_reps',\s*'bodyweight',\s*'cardio',\s*'timed'\)\)/.test(read('supabase/migrations/023_exlib_catalog_and_delivery_contract.sql')))

console.log('\nC. Section B — append_workout_set')
const text021 = read('supabase/migrations/021_ui5b_transactional_ordering.sql')
const signature = (text: string): string | undefined => /CREATE OR REPLACE FUNCTION append_workout_set\(([\s\S]*?)\) RETURNS JSONB/.exec(text)?.[1].replace(/\s+/g, ' ').trim()
check('C1: the signature (parameters, defaults, RETURNS JSONB, SECURITY INVOKER, search_path) is identical to 021',
  signature(text028) !== undefined && signature(text028) === signature(text021)
    && /RETURNS JSONB\nLANGUAGE plpgsql\nSECURITY INVOKER\nSET search_path = public\nAS \$\$/.test(text028))
check("C2: the pre-lock mode-independent rule rejects only NEGATIVE weight and the 1000 kg ceiling (no global `<= 0`)",
  text028.includes('(p_weight_kg IS NOT NULL AND (p_weight_kg < 0 OR p_weight_kg > 1000))') && !text028.includes('(p_weight_kg <= 0 OR p_weight_kg > 1000)'))
check("C3: the `<= 0` rule survives INSIDE the weight_reps/bodyweight branch, after the locked read",
  /IF v_tracking_mode IN \('weight_reps', 'bodyweight'\) THEN[\s\S]*?IF p_weight_kg IS NOT NULL AND p_weight_kg <= 0 THEN\s+RAISE EXCEPTION 'invalid_input';/.test(text028))
check("C4: an explicit weight_time gate forbids reps and distance_meters (rpe and is_warmup permitted)",
  /ELSIF v_tracking_mode = 'weight_time' THEN[\s\S]*?IF p_reps IS NOT NULL OR p_distance_meters IS NOT NULL THEN\s+RAISE EXCEPTION 'invalid_input';/.test(text028))
check("C5: completion for weight_time requires weight NOT NULL (0 legal) and duration > 0, and the fail-closed ELSE RAISE stays",
  /IF v_tracking_mode = 'weight_time'\s+AND \(p_weight_kg IS NULL OR p_duration_seconds IS NULL OR p_duration_seconds <= 0\) THEN\s+RAISE EXCEPTION 'invalid_input';/.test(text028)
    && /ELSE\s+RAISE EXCEPTION 'invalid_input';\s+END IF;/.test(text028))
check('C6: the cardio, timed, bodyweight-completion and cardio/timed-completion rules are byte-identical to 021',
  ["IF p_reps IS NOT NULL OR p_weight_kg IS NOT NULL OR p_rpe IS NOT NULL\n       OR v_is_warmup THEN", "IF p_reps IS NOT NULL OR p_weight_kg IS NOT NULL\n       OR p_distance_meters IS NOT NULL OR v_is_warmup THEN",
    "IF v_tracking_mode = 'bodyweight' AND NOT v_is_warmup AND p_reps IS NULL THEN", "IF v_tracking_mode IN ('cardio', 'timed')\n       AND (p_duration_seconds IS NULL OR p_duration_seconds <= 0) THEN"]
    .every((fragment) => text021.includes(fragment) && text028.includes(fragment)))
check('C7: REVOKE from PUBLIC, anon and GRANT EXECUTE to authenticated are re-asserted for append_workout_set',
  /REVOKE ALL ON FUNCTION append_workout_set\(UUID, SMALLINT, NUMERIC, NUMERIC, INTEGER, NUMERIC, BOOLEAN, BOOLEAN, TEXT\) FROM PUBLIC, anon;/.test(text028)
    && /GRANT EXECUTE ON FUNCTION append_workout_set\(UUID, SMALLINT, NUMERIC, NUMERIC, INTEGER, NUMERIC, BOOLEAN, BOOLEAN, TEXT\) TO authenticated;/.test(text028))

console.log('\nD. Section C — the history guard')
check('D1: the trigger is BEFORE UPDATE OF tracking_mode ON public.exercises, FOR EACH ROW, WHEN (OLD IS DISTINCT FROM NEW)',
  /CREATE TRIGGER exercises_tracking_mode_history_guard\s+BEFORE UPDATE OF tracking_mode ON public\.exercises\s+FOR EACH ROW\s+WHEN \(OLD\.tracking_mode IS DISTINCT FROM NEW\.tracking_mode\)\s+EXECUTE FUNCTION public\.exercises_guard_tracking_mode_history\(\);/.test(text028))
check('D2: the function is SECURITY DEFINER with search_path = public, pg_temp, raises the controlled token, and tests workout_sets JOIN workout_exercises on OLD.id',
  /FUNCTION public\.exercises_guard_tracking_mode_history\(\)\s+RETURNS trigger\s+LANGUAGE plpgsql\s+SECURITY DEFINER\s+SET search_path = public, pg_temp/.test(text028)
    && text028.includes("RAISE EXCEPTION 'tracking_mode_has_workout_history';")
    && /FROM public\.workout_sets ws\s+JOIN public\.workout_exercises we ON we\.id = ws\.workout_exercise_id\s+WHERE we\.exercise_id = OLD\.id/.test(text028))
check('D3: EXECUTE is revoked from PUBLIC, anon, authenticated and service_role — the function is not a generic privileged RPC',
  text028.includes('REVOKE ALL ON FUNCTION public.exercises_guard_tracking_mode_history() FROM PUBLIC, anon, authenticated, service_role;'))
check('D4: no new table, column or audit structure supports the guard (the EXISTS reads the two existing tables only)',
  !/CREATE TABLE/i.test(text028) && !/ADD COLUMN/i.test(text028) && (text028.match(/CREATE OR REPLACE FUNCTION/g) ?? []).length === 3)

console.log('\nE. Section D — deliver_catalog_exercises: 026 lines 146-623 plus exactly two arms')
const lines026 = read(MIGRATION_026).split('\n')
const source026 = lines026.slice(145, 623) // 1-based 146..623 inclusive
const lines028 = text028.split('\n')
const startD = lines028.findIndex((line) => line === 'CREATE OR REPLACE FUNCTION deliver_catalog_exercises(p_run_key TEXT)')
const endD = lines028.findIndex((line, index) => index > startD && line === '$$;')
const sectionD = startD >= 0 && endD > startD ? lines028.slice(startD, endD + 1) : []
const armPattern = /^\s*WHEN 'weight_time' THEN 'strength'$/
const sectionDWithoutArms = sectionD.filter((line) => !armPattern.test(line))
check('E1: with the two arm lines removed, section D is byte-identical to 026 lines 146-623 (same line count, every line equal)',
  sectionD.length === source026.length + 2 && sectionDWithoutArms.length === source026.length && sectionDWithoutArms.every((line, index) => line === source026[index]))
const armIndexes = sectionD.map((line, index) => (armPattern.test(line) ? index : -1)).filter((index) => index >= 0)
check("E2: exactly two arms, each IMMEDIATELY before an ELSE 'strength' line, with matching indentation",
  armIndexes.length === 2 && armIndexes.every((index) => /^\s*ELSE 'strength'$/.test(sectionD[index + 1] ?? '')
    && (sectionD[index].match(/^\s*/)?.[0] ?? '') === (sectionD[index + 1].match(/^\s*/)?.[0] ?? '')))
check("E3: both ELSE 'strength' catch-alls remain (unknown values still fall back; weight_time no longer depends on them), and the two CASEs are the only ones in the function",
  sectionD.filter((line) => /^\s*ELSE 'strength'$/.test(line)).length === 2 && sectionD.filter((line) => /CASE v_cat\.tracking_mode/.test(line)).length === 2)
check("E4: 026 line 397 and line 480 are the two ELSE 'strength' sites (the plan's §17 drift record) and 027 never redefines the function",
  /^\s*ELSE 'strength'$/.test(lines026[396]) && /^\s*ELSE 'strength'$/.test(lines026[479]) && !read(MIGRATION_027).includes('deliver_catalog_exercises'))

console.log('\nF. History untouched')
const blob = (revision: string, filePath: string): string => execSync(`git -C "${repositoryRoot}" rev-parse ${revision}:${filePath}`, { encoding: 'utf8' }).trim()
const workingBlob = (filePath: string): string => execSync(`git -C "${repositoryRoot}" hash-object ${filePath}`, { encoding: 'utf8' }).trim()
check(`F1: migration 026 is byte-identical to origin/main ${ORIGIN_MAIN.slice(0, 8)}`, blob(ORIGIN_MAIN, MIGRATION_026) === workingBlob(MIGRATION_026))
check(`F2: migration 027 is byte-identical to origin/main ${ORIGIN_MAIN.slice(0, 8)}`, blob(ORIGIN_MAIN, MIGRATION_027) === workingBlob(MIGRATION_027))
check(`F3: migrations 010, 021 and 023 are byte-identical to origin/main ${ORIGIN_MAIN.slice(0, 8)}`,
  ['supabase/migrations/010_phase2r_exercise_tracking_modes.sql', 'supabase/migrations/021_ui5b_transactional_ordering.sql', 'supabase/migrations/023_exlib_catalog_and_delivery_contract.sql']
    .every((filePath) => blob(ORIGIN_MAIN, filePath) === workingBlob(filePath)))

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
