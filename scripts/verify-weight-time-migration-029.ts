// ============================================================
// ForgeFitOS — migration 029 (Plank cross-run idempotency): STATIC verifier.
//
// Pins the exact security/integrity relaxation of migration 029 against the
// committed bytes, independently of the migration's own prose:
//   - migrations 026 and 028 are byte-identical to their promoted identities;
//   - exactly one 029 exists, and it is the narrow shape authorized: one
//     CREATE OR REPLACE of exlib_plank_link_valid with the UNCHANGED signature,
//     one REVOKE re-asserting the internal-only posture, inside one BEGIN/COMMIT;
//   - the helper body differs from migration 026's body ONLY in the provenance
//     clause (computed by removing that clause from both and comparing);
//   - the new clause is exactly the authorized rule: current run OR a prior run
//     that exists, is approved, non-dry, sealed, unrevoked AND carries EXACTLY
//     p_cat_id - never merely the same logical identity;
//   - deliver_catalog_exercises is NOT redefined by 029, and migration 028's
//     body still calls the shared helper from BOTH paths (existing-link and
//     raced logical-index), so both gain the behaviour through the helper;
//   - no new grant, table, column, index, trigger or policy.
// The live counterpart scripts/verify-weight-time-migration-029-live.sh proves
// the behaviour on disposable PostgreSQL. Both are required.
//
// Never contacts Supabase, Vercel, or any remote service.
// Run from the repository root:
//   npx tsx scripts/verify-weight-time-migration-029.ts
// ============================================================

import path from 'node:path'
import { readFileSync, readdirSync } from 'node:fs'
import { createHash } from 'node:crypto'

const repositoryRoot = process.cwd()
const M026 = 'supabase/migrations/026_exlib_plank_seed_reconciliation.sql'
const M028 = 'supabase/migrations/028_weight_time_tracking_mode.sql'
const M029 = 'supabase/migrations/029_exlib_plank_cross_run_idempotency.sql'
const M026_SHA = '620185b62c589c55fb30a237589589f46002a9d6c391b9ab936e07a6641cf4bc'
const HELPER_SIGNATURE = 'exlib_plank_link_valid(UUID, public.exercises, UUID, UUID, TEXT, UUID)'
const OLD_CLAUSE = '    AND p_link.import_run_id = p_run_id\n'
const NEW_CLAUSE = `    AND p_link.import_run_id IS NOT NULL
    AND (
      p_link.import_run_id = p_run_id
      OR EXISTS (
        SELECT 1
        FROM public.exercise_catalog_import_runs pr
        JOIN public.exercise_catalog_run_items pri ON pri.run_id = pr.id
        WHERE pr.id = p_link.import_run_id
          AND pr.approved_for_delivery = true
          AND pr.dry_run = false
          AND pr.sealed_at IS NOT NULL
          AND pr.revoked_at IS NULL
          AND pri.catalog_id = p_cat_id
      )
    )
`

let passed = 0
let failed = 0
function check(name: string, condition: boolean, detail?: string): void {
  if (condition) { passed += 1; console.log(`  PASS  ${name}`) }
  else { failed += 1; console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`) }
}
function read(p: string): string { return readFileSync(path.join(repositoryRoot, p), 'utf8') }
function sha256(b: Buffer | string): string { return createHash('sha256').update(b).digest('hex') }
/** Executable text: `--` comments removed line by line (conservative: only ever deletes text). */
function executable(sql: string): string {
  return sql.split('\n').map((l) => { const at = l.indexOf('--'); return at === -1 ? l : l.slice(0, at) }).join('\n')
}
/** The helper's CREATE OR REPLACE ... $helper$ body ... $helper$; block. */
function helperBlock(sql: string): string {
  const start = sql.indexOf('CREATE OR REPLACE FUNCTION exlib_plank_link_valid(')
  const end = sql.indexOf('$helper$;', start)
  return start === -1 || end === -1 ? '' : sql.slice(start, end + '$helper$;'.length)
}
/** Body with comment lines dropped and the provenance clause removed, for a like-for-like comparison. */
function bodyWithoutProvenance(block: string, clause: string): string {
  const withoutComments = block.split('\n').filter((l) => !l.trim().startsWith('--')).join('\n')
  const at = withoutComments.indexOf(clause)
  return at === -1 ? '<clause not found>' : withoutComments.slice(0, at) + withoutComments.slice(at + clause.length)
}

console.log('migration 029 — Plank cross-run idempotency: static verification\n')
const m026 = read(M026); const m028 = read(M028)
const files = readdirSync(path.join(repositoryRoot, 'supabase/migrations')).filter((f) => f.endsWith('.sql')).sort()
check('A1 exactly one migration 029 exists, named 029_exlib_plank_cross_run_idempotency.sql, and it is the LAST migration (29 files)',
  files.filter((f) => f.startsWith('029')).length === 1 && files[files.length - 1] === path.basename(M029) && files.length === 29, files.slice(-3).join(', '))
const m029Buffer = readFileSync(path.join(repositoryRoot, M029)); const m029 = m029Buffer.toString('utf8')
console.log(`  INFO  029 is ${m029Buffer.length} bytes, sha256 ${sha256(m029Buffer)}`)
check('A2 migration 028 is byte-identical to its promoted identity (37,162 B, 9b7d3a52…) - 029 does not touch it',
  readFileSync(path.join(repositoryRoot, M028)).length === 37162 && sha256(readFileSync(path.join(repositoryRoot, M028))) === '9b7d3a52dc0b75f129745bec51a4c972aa284bb5cb0d6159e0cbbb981e463fb3')
check('A3 migration 026 is byte-identical to its promoted identity (33,294 B) - 029 does not touch it',
  readFileSync(path.join(repositoryRoot, M026)).length === 33294 && sha256(readFileSync(path.join(repositoryRoot, M026))) === M026_SHA)

const exe = executable(m029)
// Top-level text = the executable text with the helper's CREATE ... $helper$; block removed.
const topLevel = exe.replace(helperBlock(exe), '<HELPER>').split('\n').map((l) => l.trim()).filter((l) => l.length > 0)
check('B1 029 is ONE transaction whose top level is EXACTLY: BEGIN; the helper CREATE OR REPLACE; the REVOKE; COMMIT; - nothing else',
  JSON.stringify(topLevel) === JSON.stringify(['BEGIN;', '<HELPER>', 'REVOKE ALL ON FUNCTION exlib_plank_link_valid(UUID, public.exercises, UUID, UUID, TEXT, UUID)', 'FROM PUBLIC, anon, authenticated;', 'COMMIT;']),
  topLevel.map((l) => l.slice(0, 50)).join(' | '))
check('B2 029 creates or alters NO table, column, index, trigger, policy, role or grant, and does NOT redefine deliver_catalog_exercises or rollback_catalog_delivery',
  !/\b(CREATE|ALTER|DROP)\s+(TABLE|INDEX|TRIGGER|POLICY|ROLE|SCHEMA|TYPE)\b/i.test(exe) && !/\bGRANT\b/.test(exe) && !/\bALTER\s+TABLE\b/i.test(exe)
  && !exe.includes('deliver_catalog_exercises(') && !exe.includes('rollback_catalog_delivery('))
const h026 = helperBlock(m026); const h029 = helperBlock(m029)
check('B3 the helper signature is UNCHANGED: (p_uid UUID, p_link public.exercises, p_cat_id UUID, p_logical UUID, p_canonical TEXT, p_run_id UUID) RETURNS BOOLEAN, plpgsql, VOLATILE, SECURITY DEFINER, search_path = public, pg_temp',
  h029.includes('  p_uid       UUID,\n  p_link      public.exercises,\n  p_cat_id    UUID,\n  p_logical   UUID,\n  p_canonical TEXT,\n  p_run_id    UUID\n) RETURNS BOOLEAN\nLANGUAGE plpgsql\nVOLATILE\nSECURITY DEFINER\nSET search_path = public, pg_temp')
  && h026.includes('  p_uid       UUID,\n  p_link      public.exercises,\n  p_cat_id    UUID,\n  p_logical   UUID,\n  p_canonical TEXT,\n  p_run_id    UUID\n) RETURNS BOOLEAN\nLANGUAGE plpgsql\nVOLATILE\nSECURITY DEFINER\nSET search_path = public, pg_temp'))
check('B4 026 carries the OLD strict clause exactly once and 029 does NOT carry it as a bare clause; 029 carries the NEW clause exactly once and 026 does not',
  (h026.match(/    AND p_link\.import_run_id = p_run_id\n/g) ?? []).length === 1 && !h029.includes(OLD_CLAUSE) && (h029.split(NEW_CLAUSE).length - 1) === 1 && !h026.includes('pr.approved_for_delivery'))
const stripped026 = bodyWithoutProvenance(h026, OLD_CLAUSE); const stripped029 = bodyWithoutProvenance(h029, NEW_CLAUSE)
check('B5 with the provenance clause removed from both, the 029 helper body equals the 026 helper body LINE FOR LINE (comments aside) - every non-provenance invariant is carried verbatim: ownership, timed, mobility, exact catalog_id, exact logical_id, anatomy lock + equality, canonical/(timed) name + claim ownership',
  stripped026 !== '<clause not found>' && stripped026 === stripped029, stripped026 === stripped029 ? undefined : 'bodies differ outside the provenance clause')
check('B6 the NEW clause is exactly the authorized rule: import_run_id NOT NULL, then current run OR a prior run that exists (join by id), approved_for_delivery = true, dry_run = false, sealed_at IS NOT NULL, revoked_at IS NULL, AND has a run_items row for EXACTLY p_cat_id; it does not consult logical identity',
  NEW_CLAUSE.includes('AND p_link.import_run_id IS NOT NULL') && NEW_CLAUSE.includes('WHERE pr.id = p_link.import_run_id') && NEW_CLAUSE.includes('pri.catalog_id = p_cat_id') && !NEW_CLAUSE.includes('logical') && NEW_CLAUSE.includes('pr.approved_for_delivery = true') && NEW_CLAUSE.includes('pr.dry_run = false') && NEW_CLAUSE.includes('pr.sealed_at IS NOT NULL') && NEW_CLAUSE.includes('pr.revoked_at IS NULL'))
check('B7 029 mutates nothing during validation: the helper body contains no INSERT INTO, UPDATE ... SET or DELETE FROM (the only UPDATE token is the carried FOR UPDATE row lock)',
  !/\b(INSERT\s+INTO|UPDATE\s+\w+\s+SET|DELETE\s+FROM)\b/i.test(executable(h029)))
check('B8 029 re-asserts the internal-only posture: REVOKE ALL ... FROM PUBLIC, anon, authenticated on the exact signature, and grants nothing',
  exe.includes(`REVOKE ALL ON FUNCTION ${HELPER_SIGNATURE}\n  FROM PUBLIC, anon, authenticated`) && !/\bGRANT\b/.test(exe))
check('B9 the lock discipline is unchanged: the only row lock in the helper is the anatomy FOR UPDATE carried from 026 (parent-first, children in primary-key order); the prior-run lookup takes no lock',
  (executable(h029).match(/FOR UPDATE/g) ?? []).length === 1 && (executable(h026).match(/FOR UPDATE/g) ?? []).length === 1 && h029.includes('ORDER BY m.id\n  FOR UPDATE;') && !NEW_CLAUSE.includes('FOR UPDATE'))

const deliver028 = m028.slice(m028.indexOf('CREATE OR REPLACE FUNCTION deliver_catalog_exercises(p_run_key TEXT)'))
check('C1 migration 028\'s deliver_catalog_exercises calls the shared helper from EXACTLY TWO sites - the existing-link path and the raced logical-index recovery path - and passes v_run.id (THIS delivering run) at both',
  (deliver028.match(/exlib_plank_link_valid\(v_uid, v_linked, v_cat\.id, v_cat\.logical_id,\n\s+v_cat\.canonical_name, v_run\.id\)/g) ?? []).length === 2)
check('C2 the two call sites keep their semantics: a valid link is a skipped_already_delivered / already_valid_idempotent CONTINUE, an invalid one RAISES - neither site carries its own provenance logic',
  (deliver028.match(/v_skipped_existing := v_skipped_existing \+ 1;\n\s+v_plank_disposition := 'already_valid_idempotent';\n\s+CONTINUE;/g) ?? []).length === 2
  && (deliver028.match(/inconsistent prior Plank reconciliation requires separate investigation/g) ?? []).length === 2 && !deliver028.includes('approved_for_delivery = true AND dry_run = false AND sealed_at IS NOT NULL AND revoked_at IS NULL\n          AND pri'))
check('C3 the delivery function body need not change: 029 contains no CREATE OR REPLACE of deliver_catalog_exercises, so 028\'s definition (with its authenticated EXECUTE grant preserved by 023/026) remains the ONE delivery entrypoint',
  !exe.includes('CREATE OR REPLACE FUNCTION deliver_catalog_exercises') && (exe.match(/CREATE OR REPLACE FUNCTION/g) ?? []).length === 1)
check('D1 029 states its hosted-order dependency: live and verified BEFORE the run-key repoint and before any user receives a Plank-carrying run; NOT a precondition of the seven catalog stages',
  m029.includes('must be live and verified BEFORE') && m029.includes('NOT a\n-- precondition of catalog snapshot review'))
check('D2 029 states READ STATE FIRST for an ambiguous apply and names its rollback boundary (re-apply the 026 body)',
  m029.includes('READ STATE FIRST') && m029.includes('Re-applying migration 026'))

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
