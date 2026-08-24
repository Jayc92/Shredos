// ============================================================
// ForgeFitOS — EXLIB-1B2 migration-023 static-verification harness
// (Revision H). Deterministically proves the DRAFT migration closes
// every SQL review finding: deactivate-all rollback, one database-
// enforced name/alias namespace (claims table + PK, not function
// pre-checks), stable logical catalog identity with alias
// continuity across versions, per-user advisory-lock concurrency
// with constraint backstops, atomic failure semantics with no
// error-count facade, CHECK-enforced product+legal approval
// auditability, and exact parsed privilege boundaries. The
// migration remains DRAFT — NOT APPLIED; this suite never contacts
// a database.
// Run from the repository root:
//   npx tsx scripts/verify-exlib1b2.ts
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

const M023 = 'supabase/migrations/023_exlib_catalog_and_delivery_contract.sql'
const sql = read(M023)
const sqlBytes = readFileSync(M023)
const notes = read('docs/exlib1b1-architecture-and-review-notes.md')
const notesFlat = notes.replace(/\s+/g, ' ')
// SQL prose anchors tolerate the file's comment line wraps.
// REVISED (EXLIB-1B2 Revision D): also strip INDENTED comment
// markers so prose anchors inside function bodies flatten cleanly
// (strictly more permissive for prose; no check weakened).
const sqlFlat = sql.replace(/^\s*--\s?/gm, '').replace(/\s+/g, ' ')
const M023_SHA = '0991448c39a558385431c78cef6d6063df208312a3f53866756ba730066c42f2'
const REV_G_SHA = '7653b4c87835b0318f8a298855571ddcfe2ffef4ed00fa8e9178f252491e9f92'
const REV_F_SHA = '77ddadff1f3cc8a5b718d82432e912280ad5f1504ca612ddf2f65e3ce65ca00b'
const REV_E_SHA = '8b155d4709c595b7ea15f847eaf7d9bac6c893696d71bf8ccc8e7954d615df16'
const REV_D_SHA = '4d27e0e79693d396b75e3a8a8db09567f29e7c2e4f9c44d3756fe5d58a08de22'
const REV_C_SHA = '5923075e67392d5d63db949ead11162a4400b1aa8a62be20b823f227b415ec63'
const REV_B_SHA = '730899c7b533676cb2045c522ecb367913428eaa2c04e5af0f80c2d3bcf13c37'
const REV_A_SHA = '944c2186504fa007a32c2b5ec39f63cf275c75c1685d0ab2f3d824f699dee232'
const OLD_SHA = '8c90b88924ce46737499bed97227435387cef423ade9f0ecf1f3d3584e50af6a'

const deliverFn = sql.slice(
  sql.indexOf('CREATE OR REPLACE FUNCTION deliver_catalog_exercises'),
  sql.indexOf('-- ── 13.'))
const rollbackFn = sql.slice(
  sql.indexOf('CREATE OR REPLACE FUNCTION rollback_catalog_delivery'),
  sql.indexOf('-- ── 14.'))
// REVISED (EXLIB-1B2 Revision D): slice ends at the new 9B section
// so this stays exactly the two per-user claim helpers.
const triggerFns = sql.slice(
  sql.indexOf('CREATE OR REPLACE FUNCTION exlib_claim_exercise_name'),
  sql.indexOf('-- ── 9B.'))
const cascadeFn = sql.slice(
  sql.indexOf('CREATE OR REPLACE FUNCTION exlib_deactivate_exercise_aliases'),
  sql.indexOf('CREATE TRIGGER exercises_dependent_alias_trigger'))
const deleteGateFn = sql.slice(
  sql.indexOf('CREATE OR REPLACE FUNCTION exlib_block_delivered_exercise_delete'),
  sql.indexOf('CREATE TRIGGER exercises_delivered_delete_gate_trigger'))
const lifecycleVerifyFn = sql.slice(
  sql.indexOf('CREATE OR REPLACE FUNCTION exlib_verify_alias_lifecycle'),
  sql.indexOf('-- ── 10.'))
const snapshotFreezeFn = sql.slice(
  sql.indexOf('CREATE OR REPLACE FUNCTION exlib_freeze_catalog_snapshot'),
  sql.indexOf('CREATE TRIGGER exercise_catalog_freeze_trigger'))
const anatomyFreezeFn = sql.slice(
  sql.indexOf('CREATE OR REPLACE FUNCTION exlib_freeze_catalog_anatomy'),
  sql.indexOf('CREATE TRIGGER exercise_catalog_muscles_freeze_trigger'))
const aliasFreezeFn = sql.slice(
  sql.indexOf('CREATE OR REPLACE FUNCTION exlib_freeze_catalog_alias'),
  sql.indexOf('CREATE TRIGGER exercise_catalog_aliases_freeze_trigger'))
const runItemsFreezeFn = sql.slice(
  sql.indexOf('CREATE OR REPLACE FUNCTION exlib_freeze_run_membership'),
  sql.indexOf('CREATE TRIGGER exercise_catalog_run_items_freeze_trigger'))
const eventsGuardFn = sql.slice(
  sql.indexOf('CREATE OR REPLACE FUNCTION exlib_freeze_review_events'),
  sql.indexOf('CREATE TRIGGER exercise_catalog_review_events_guard_trigger'))
const runRowFreezeFn = sql.slice(
  sql.indexOf('CREATE OR REPLACE FUNCTION exlib_freeze_run_row'),
  sql.indexOf('CREATE TRIGGER exercise_catalog_import_runs_freeze_trigger'))
const approveFn = sql.slice(
  sql.indexOf('CREATE OR REPLACE FUNCTION exlib_approve_and_seal_run'),
  sql.indexOf('CREATE OR REPLACE FUNCTION exlib_revoke_run_delivery'))
const revokeFn = sql.slice(
  sql.indexOf('CREATE OR REPLACE FUNCTION exlib_revoke_run_delivery'),
  sql.indexOf('-- ── 6.'))
const catalogClaimFns = sql.slice(
  sql.indexOf('CREATE OR REPLACE FUNCTION exlib_claim_catalog_name'),
  sql.indexOf('-- ── 7.'))

async function main() {
  console.log('\nA. Inventory, fingerprints, revision record')
  {
    const files = readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).sort()
    check('A1: migrations are exactly 001-023; 023 has the approved draft filename',
      files.length === 23 &&
      files[22] === '023_exlib_catalog_and_delivery_contract.sql' &&
      files.every((f, i) => f.startsWith(String(i + 1).padStart(3, '0'))))
    check('A2: migration 022 fingerprint unchanged',
      (() => {
        const m022 = readFileSync('supabase/migrations/022_ui5b2_workout_reuse.sql')
        return m022.length === 19112 &&
          createHash('sha256').update(m022).digest('hex') ===
            '1432692f700b1686243aa8219ea4af3146e2bec30b228b3f9138d60e072e1241'
      })())
    // REVISED (EXLIB-1B2 Revision C): fingerprint advanced to the
    // Revision C bytes; Revision B joins the superseded set.
    // REVISED (EXLIB-1B2 Revision D): fingerprint advanced to the
    // Revision D bytes; Revision C joins the superseded set.
    // REVISED (EXLIB-1B2 Revision E): fingerprint advanced to the
    // Revision E bytes; Revision D joins the superseded set.
    // REVISED (EXLIB-1B2 Revision F): fingerprint advanced to the
    // Revision F bytes; Revision E was REJECTED in review and joins
    // the superseded set with that rejection recorded.
    // REVISED (EXLIB-1B2 Revision G): fingerprint advanced to the
    // Revision G bytes; Revision F was REJECTED in review and joins
    // the superseded set with that rejection recorded.
    // REVISED (EXLIB-1B2 Revision H): fingerprint advanced to the
    // Revision H bytes; Revision G joins the superseded set with its
    // approved-architecture status recorded (superseded, NOT
    // rejected — solely the atomic-install correction).
    check('A3: Revision H fingerprint matches the notes; ALL EIGHT superseded fingerprints marked DO NOT APPLY (G superseded-not-rejected)',
      sqlBytes.length === 92806 &&
      createHash('sha256').update(sqlBytes).digest('hex') === M023_SHA &&
      notes.includes(M023_SHA) && notes.includes('92,806 bytes') &&
      notes.includes(OLD_SHA) && notes.includes(REV_A_SHA) &&
      notes.includes(REV_B_SHA) && notes.includes(REV_C_SHA) &&
      notes.includes(REV_D_SHA) && notes.includes(REV_E_SHA) &&
      notes.includes(REV_F_SHA) && notes.includes(REV_G_SHA) &&
      sql.includes(REV_G_SHA) &&
      sql.includes(REV_F_SHA) && sql.includes(REV_E_SHA) &&
      sql.includes(REV_D_SHA) && sql.includes(REV_C_SHA) &&
      sql.includes(REV_B_SHA) &&
      sql.includes(REV_A_SHA) && sql.includes(OLD_SHA) &&
      sql.includes('Revision E (REJECTED in review):') &&
      sql.includes('Revision F (REJECTED in review):') &&
      sqlFlat.includes('Revision G (architecture APPROVED; superseded SOLELY by the Revision H atomic-install transaction wrapper — not rejected)') &&
      notesFlat.includes('DO NOT APPLY') &&
      notesFlat.includes('DRAFT — NOT APPLIED') &&
      notesFlat.includes(`Revision B (\`${REV_B_SHA}\`): SUPERSEDED — DO NOT APPLY`) &&
      notesFlat.includes(`Revision C (\`${REV_C_SHA}\`): SUPERSEDED — DO NOT APPLY`) &&
      notesFlat.includes(`Revision D (\`${REV_D_SHA}\`): SUPERSEDED — DO NOT APPLY`) &&
      notesFlat.includes(`Revision E (\`${REV_E_SHA}\`): REJECTED — SUPERSEDED — DO NOT APPLY`) &&
      notesFlat.includes(`Revision F (\`${REV_F_SHA}\`): REJECTED — SUPERSEDED — DO NOT APPLY`) &&
      notesFlat.includes(`Revision G (\`${REV_G_SHA}\`): SUPERSEDED — DO NOT APPLY`) &&
      notesFlat.includes('NOT rejected') &&
      sql.includes('STATUS: DRAFT — NOT APPLIED') &&
      sql.includes('(REVISION H)'))
  }

  console.log('\nB. Zero content data, additive preservation')
  {
    check('B1: no catalog-side data insertion; no manifest content; no literal VALUES data',
      !/INSERT INTO (public\.)?exercise_catalog\b/.test(sql) &&
      !/INSERT INTO (public\.)?exercise_catalog_logical/.test(sql) &&
      !/INSERT INTO (public\.)?exercise_catalog_muscles/.test(sql.replace(/public\.exercise_muscles/g, '')) &&
      !/INSERT INTO (public\.)?exercise_catalog_aliases/.test(sql) &&
      !/INSERT INTO (public\.)?exercise_catalog_import_runs/.test(sql) &&
      // REVISED (EXLIB-1B2 Revision E, finding 1): the membership
      // table is created EMPTY — the migration binds no run content.
      !/INSERT INTO (public\.)?exercise_catalog_run_items/.test(sql) &&
      !sql.includes('strengthlog.com') &&
      !/VALUES\s*\(\s*'/.test(sql))
    check('B2: the ONLY backfill is the derived claims materialization from the user\'s own names',
      (sql.match(/^INSERT INTO exercise_name_claims/m) || []).length === 1 &&
      sql.includes("SELECT e.user_id, lower(e.name), 'exercise', e.id\nFROM exercises e") &&
      !/\bDROP\b/i.test(sql) && !/\bTRUNCATE\b/i.test(sql) &&
      !/ALTER COLUMN/i.test(sql))
    check('B3: DELETE appears ONLY inside the claim-maintenance trigger functions (claims rows, never user data)',
      (() => {
        const deletes = sql.match(/DELETE FROM [\w.]+/g) || []
        return deletes.length > 0 &&
          deletes.every((d) => d === 'DELETE FROM public.exercise_name_claims' ||
            d === 'DELETE FROM public.exercise_catalog_name_claims') &&
          !/\bDELETE\b/i.test(deliverFn) && !/\bDELETE\b/i.test(rollbackFn)
      })())
    // REVISED (EXLIB-1B2 Revision D, finding 1): the dependent-alias
    // lifecycle trigger adds the second (and only other)
    // exercise_aliases UPDATE — still exclusively is_active
    // deactivation, never content or provenance.
    // REVISED (EXLIB-1B2 Revision F, finding 1): the two run
    // lifecycle operations add exactly two UPDATEs on the runs table
    // (the sealing transition and the one-way revocation), both
    // inside those functions and both fully revalidated by the
    // BEFORE trigger.
    check('B4: complete UPDATE census — rollback deactivations, the lifecycle cascade, and the two run lifecycle transitions',
      (sql.match(/UPDATE (public\.)?exercises\b/g) || []).length === 1 &&
      (sql.match(/UPDATE (public\.)?exercise_aliases/g) || []).length === 2 &&
      (sql.match(/UPDATE (public\.)?exercise_catalog_import_runs/g) || []).length === 2 &&
      approveFn.includes('UPDATE public.exercise_catalog_import_runs') &&
      revokeFn.includes('UPDATE public.exercise_catalog_import_runs') &&
      (sql.match(/SET is_active = false/g) || []).length === 3 &&
      (rollbackFn.match(/SET is_active = false/g) || []).length === 2 &&
      !/UPDATE/.test(deliverFn))
    check('B5: zero product, API, lib, or seeder changes accompany the draft (git)',
      (() => {
        try {
          return execSync('git diff --name-only -- src/ package.json package-lock.json',
            { encoding: 'utf8' }).trim() === ''
        } catch { return false }
      })())
  }

  console.log('\nC. Closed-by-default access + alias least privilege')
  {
    // REVISED (EXLIB-1B2 Revision E, finding 1): the frozen run
    // membership table joins the closed set.
    // REVISED (EXLIB-1B2 Revision G, finding 2): the append-only
    // review-evidence log joins the closed set.
    const CLOSED = ['exercise_catalog_import_runs', 'exercise_catalog_logical',
      'exercise_catalog', 'exercise_catalog_muscles', 'exercise_catalog_aliases',
      'exercise_catalog_name_claims', 'exercise_catalog_run_items',
      'exercise_catalog_review_events',
      'exercise_name_claims']
    check('C1: RLS enabled on all ten new tables',
      CLOSED.concat('exercise_aliases').every((t) =>
        new RegExp(`ALTER TABLE ${t}\\s+ENABLE ROW LEVEL SECURITY`).test(sql.replace(/ {2,}/g, ' '))))
    // REVISED (EXLIB-1B2 Revision E, finding 4): the policy now
    // targets authenticated explicitly and uses the initplan-stable
    // (SELECT auth.uid()) form.
    check('C2: exactly ONE policy exists — owner SELECT on exercise_aliases, TO authenticated, (SELECT auth.uid()) form',
      (sql.match(/CREATE POLICY/g) || []).length === 1 &&
      sql.includes('CREATE POLICY exercise_aliases_select_own') &&
      sql.includes('ON exercise_aliases FOR SELECT') &&
      sql.includes('TO authenticated') &&
      sql.includes('USING ((SELECT auth.uid()) = user_id)') &&
      !sql.includes('USING (user_id = auth.uid())'))
    check('C3: REVOKE ALL from PUBLIC, anon, authenticated on every closed table',
      CLOSED.every((t) =>
        new RegExp(`REVOKE ALL ON ${t}\\s+FROM PUBLIC, anon, authenticated`).test(sql.replace(/ {2,}/g, ' '))))
    check('C4: authenticated has NO direct alias mutation — SELECT-only grant, no INSERT/UPDATE/DELETE policy or grant',
      sql.includes('REVOKE ALL ON exercise_aliases FROM PUBLIC, anon, authenticated') &&
      sql.includes('GRANT SELECT ON exercise_aliases TO authenticated') &&
      !/GRANT [^;]*INSERT[^;]* ON exercise_aliases/.test(sql) &&
      !sql.includes('exercise_aliases_insert_own') &&
      !sql.includes('exercise_aliases_update_own') &&
      !sql.includes('exercise_aliases_delete_own') &&
      notesFlat.includes('future alias-management surface'))
  }

  console.log('\nD. Privilege model on exercises (parsed)')
  {
    check('D1: table-level INSERT/UPDATE revoked from PUBLIC, anon, authenticated',
      sql.includes('REVOKE INSERT, UPDATE ON exercises FROM PUBLIC, anon, authenticated'))
    const insertCols = sql.match(/GRANT INSERT \(([^)]+)\)\s+ON exercises TO authenticated/)
    const updateCols = sql.match(/GRANT UPDATE \(([^)]+)\)\s+ON exercises TO authenticated/)
    const parse = (m: RegExpMatchArray | null) =>
      m ? m[1].split(',').map((c) => c.trim()).sort() : []
    check('D2: exact INSERT column grant — product write set; id/provenance excluded',
      JSON.stringify(parse(insertCols)) === JSON.stringify(
        ['category', 'equipment', 'exercise_type', 'is_active', 'is_system',
          'name', 'notes', 'primary_muscle', 'tracking_mode', 'unilateral',
          'user_id'].sort()))
    check('D3: exact UPDATE column grant — PATCH set only; immutable columns unreachable via PostgREST',
      JSON.stringify(parse(updateCols)) === JSON.stringify(
        ['category', 'equipment', 'exercise_type', 'is_active', 'name',
          'notes', 'primary_muscle', 'tracking_mode', 'unilateral'].sort()) &&
      ['user_id', 'catalog_id', 'catalog_logical_id', 'import_run_id',
        'is_system', 'secondary_muscles', 'id']
        .every((c) => !parse(updateCols).includes(c)))
    check('D4: the grant sets cover every column the current routes/seeder actually write',
      (() => {
        const val = read('src/lib/exercise-validation.ts')
        const patchWrites = ['name', 'primary_muscle', 'category', 'equipment',
          'tracking_mode', 'unilateral', 'notes', 'is_active']
        return patchWrites.every((c) => val.includes(`payload.${c}`)) &&
          read('src/app/api/exercises/[id]/route.ts').includes('updatePayload.exercise_type') &&
          read('src/lib/supabase/seed-exercises.ts').includes('is_system: true') &&
          parse(insertCols).includes('is_system') && parse(updateCols).length === 9
      })())
  }

  console.log('\nE. One namespace — database-enforced, normalization unchanged')
  {
    check('E1: claims table exists with PK (user_id, normalized_name) as the cross-table constraint',
      sql.includes('CREATE TABLE exercise_name_claims') &&
      sql.includes('PRIMARY KEY (user_id, normalized_name)') &&
      sql.includes("claim_source IN ('exercise','alias')") &&
      sql.includes("(claim_source = 'alias') = (alias_id IS NOT NULL)"))
    check('E2: triggers cover exercise-name INSERT/UPDATE/DELETE and alias INSERT/UPDATE/DELETE',
      sql.includes('AFTER INSERT OR UPDATE OF name OR DELETE ON exercises') &&
      sql.includes('AFTER INSERT OR UPDATE OF alias, is_active OR DELETE ON exercise_aliases') &&
      triggerFns.includes("VALUES (NEW.user_id, lower(NEW.name), 'exercise', NEW.id)") &&
      triggerFns.includes("VALUES (NEW.user_id, lower(NEW.alias), 'alias', NEW.exercise_id, NEW.id)") &&
      triggerFns.includes('IS DISTINCT FROM'))
    check('E3: trigger functions are SECURITY DEFINER with fixed search_path (clients hold no claims grants)',
      (triggerFns.match(/SECURITY DEFINER/g) || []).length === 2 &&
      (triggerFns.match(/SET search_path = public, pg_temp/g) || []).length === 2 &&
      sql.includes('REVOKE ALL ON FUNCTION exlib_claim_exercise_name() FROM PUBLIC, anon, authenticated') &&
      sql.includes('REVOKE ALL ON FUNCTION exlib_claim_alias_name() FROM PUBLIC, anon, authenticated'))
    check('E4: normalization is EXACTLY lower(text) — consistent with existing uniqueness; no silent change',
      (sql.match(/lower\(NEW\.(name|alias)\)/g) || []).length >= 3 &&
      sql.includes('Normalization is EXACTLY lower(text)') &&
      sql.includes('ON exercise_aliases (user_id, lower(alias))'))
    check('E5: existing 23505-based POST/PATCH behavior is preserved (claims PK raises the same SQLSTATE)',
      read('src/app/api/exercises/route.ts').includes("error.code === '23505'") &&
      read('src/lib/supabase/seed-exercises.ts').includes('23505'))
  }

  console.log('\nF. Stable logical identity + alias continuity')
  {
    check('F1: logical registry exists; snapshots and canonical aliases attach to it',
      sql.includes('CREATE TABLE exercise_catalog_logical') &&
      sql.includes('logical_id        UUID NOT NULL') &&
      sql.includes('REFERENCES exercise_catalog_logical(id) ON DELETE RESTRICT') &&
      sql.includes('ON exercise_catalog_aliases (lower(alias))') &&
      (sql.match(/REFERENCES exercise_catalog_logical\(id\) ON DELETE RESTRICT/g) || []).length === 4)
    check('F2: versioning is per logical identity — unique (logical_id, version); one ACTIVE per logical + per name',
      sql.includes('ON exercise_catalog (logical_id, catalog_version)') &&
      sql.includes('exercise_catalog_one_active_logical_idx') &&
      sql.includes('exercise_catalog_one_active_name_idx'))
    check('F3: delivery idempotency keys the LOGICAL identity, not the version-row UUID',
      sql.includes('ON exercises (user_id, catalog_logical_id)') &&
      sql.includes('WHERE catalog_logical_id IS NOT NULL') &&
      deliverFn.includes('e.catalog_logical_id = v_cat.logical_id'))
    check('F4: delivered snapshots record the exact version (catalog_id) alongside the logical pointer',
      deliverFn.includes('v_cat.id, v_cat.logical_id, v_run.id') &&
      sql.includes('ADD COLUMN catalog_id UUID') &&
      sql.includes('ADD COLUMN catalog_logical_id UUID'))
    // REVISED (EXLIB-1B2 Revision E, finding 1): alias members are
    // selected by run membership and resolve their target exercise by
    // logical identity — the same continuity, expressed through the
    // frozen membership join.
    check('F5: alias delivery keys the LOGICAL identity — continuity across versions',
      deliverFn.includes('e.catalog_logical_id = v_alias.logical_id') &&
      deliverFn.includes('SELECT a.id, a.alias, a.logical_id'))
  }

  console.log('\nG. Concurrency + atomic failure semantics')
  {
    check('G1: 64-bit advisory lock with identical derivation in BOTH functions; 32-bit hashtext rejected',
      (sql.match(/PERFORM pg_advisory_xact_lock\(hashtextextended\(v_uid::text, 8231\)\)/g) || []).length === 2 &&
      !/pg_advisory_xact_lock\(\s*hashtext\(/.test(sql) &&
      !/pg_advisory_xact_lock\(8231/.test(sql) &&
      deliverFn.includes('hashtextextended') &&
      rollbackFn.includes('hashtextextended'))
    check('G2: lock guarantee stated honestly — serialization is the safety property; separation best-effort',
      sqlFlat.includes('theoretically possible') &&
      sqlFlat.includes('merely SERIALIZES (the safety property)') &&
      sqlFlat.includes('best-effort'))
    check('G3: exactly two unique_violation handlers, each constraint-name-inspected; unknown constraints RE-RAISE',
      (deliverFn.match(/EXCEPTION\s+WHEN unique_violation THEN/g) || []).length === 2 &&
      (deliverFn.match(/GET STACKED DIAGNOSTICS v_constraint = CONSTRAINT_NAME/g) || []).length === 2 &&
      (deliverFn.match(/\bRAISE;/g) || []).length === 2 &&
      !/WHEN OTHERS/i.test(sql) &&
      !/EXCEPTION\s+WHEN /.test(rollbackFn))
    // REVISED (EXLIB-1B2 Revision C, finding 1): the exercise-block
    // allowlist now ALSO admits the pre-existing
    // exercises_user_name_unique_idx, mapped ONLY to the name-
    // collision counter; the alias block gains the declarative
    // idempotency index mapped ONLY to alias_already_delivered.
    check('G3b: exact allowlist + counter attribution — identity/provenance conflicts never read as name collisions',
      // REVISED (EXLIB-1B2 Revision E): phase-1 de-nesting shifted
      // the handler two columns left; the allowlist is unchanged.
      deliverFn.includes("IF v_constraint IN ('exercises_user_name_unique_idx',\n                            'exercise_name_claims_pkey') THEN") &&
      deliverFn.includes("ELSIF v_constraint = 'exercises_user_catalog_logical_unique_idx' THEN") &&
      deliverFn.includes("IF v_constraint = 'exercise_aliases_user_catalog_alias_unique_idx' THEN") &&
      deliverFn.includes("ELSIF v_constraint IN ('exercise_name_claims_pkey',") &&
      deliverFn.includes("'exercise_aliases_user_alias_unique_idx')") &&
      deliverFn.indexOf('v_skipped_collision := v_skipped_collision + 1') <
        deliverFn.indexOf("ELSIF v_constraint = 'exercises_user_catalog_logical_unique_idx'"))
    check('G4: unexpected failures abort — no success-shaped return after errors; no error-count field',
      !deliverFn.includes("'error") && !rollbackFn.includes("'error") &&
      !deliverFn.includes('error_count') &&
      sqlFlat.includes('every unknown constraint RE-RAISES and aborts the entire delivery'))
    // REVISED (EXLIB-1B2 Revision C, finding 2): the result schema
    // gains alias_added_to_existing and alias_already_delivered.
    // REVISED (EXLIB-1B2 Revision D, finding 3): the result schema
    // gains alias_skipped_inactive_exercise.
    check('G5: expected dispositions are explicit and distinct in the result schema',
      ["'eligible'", "'inserted'", "'skipped_already_delivered'",
        "'skipped_name_collision'", "'collision_names'", "'alias_inserted'",
        "'alias_added_to_existing'", "'alias_already_delivered'",
        "'alias_skipped_inactive_exercise'",
        "'alias_skipped_collision'", "'inserted_catalog_logical_ids'"]
        .every((k) => deliverFn.includes(k)))
    check('G6: retry idempotency — constraint backstops exist and re-delivery skips by logical identity',
      deliverFn.includes('v_skipped_existing') &&
      sql.includes('exercises_user_catalog_logical_unique_idx'))
  }

  console.log('\nH. Rollback contract (Revision A)')
  {
    // REVISED (EXLIB-1B2 Revision C, finding 2): rollback aliases are
    // keyed by RUN PROVENANCE (a.import_run_id), not exercise linkage.
    check('H1: rollback deactivates EVERY active delivered exercise AND this run\'s aliases by provenance — no reference-skip logic',
      rollbackFn.includes('e.import_run_id = v_run.id') &&
      rollbackFn.includes('UPDATE public.exercise_aliases a') &&
      (rollbackFn.match(/a\.import_run_id = v_run\.id/g) || []).length === 2 &&
      !rollbackFn.includes('a.exercise_id IN (') &&
      !rollbackFn.includes('NOT EXISTS') &&
      !rollbackFn.includes('workout_exercises'))
    // REVISED (EXLIB-1B2 Revision D, finding 2): the stable contract
    // gains the seventh counter, alias_dependent_deactivated.
    check('H2: delete-free and idempotent with honest per-kind counts (exercise + direct alias + dependent alias)',
      !/\bDELETE\b/i.test(rollbackFn) &&
      ["'found'", "'newly_deactivated'", "'already_inactive'",
        "'alias_found'", "'alias_newly_deactivated'", "'alias_already_inactive'",
        "'alias_dependent_deactivated'"]
        .every((k) => rollbackFn.includes(k)) &&
      rollbackFn.includes('v_found - v_deactivated') &&
      rollbackFn.includes('v_alias_found - v_alias_deactivated'))
    check('H3: audit rows preserved; active namespace released by trigger; re-delivery stays a no-op',
      !rollbackFn.includes('exercise_muscles') &&
      sqlFlat.includes('claim release is trigger-driven') &&
      sqlFlat.includes('releasing the aliases\' ACTIVE namespace claims') &&
      sqlFlat.includes('Re-delivery after rollback is a no-op'))
    check('H4: rollback state transitions documented — exercise-name claims deliberately survive (existing non-partial index semantics); alias claims are active-only',
      sqlFlat.includes('exercise claims survive deactivation') &&
      sqlFlat.includes('Alias claims are ACTIVE-ONLY') &&
      sqlFlat.includes('reserves its name today'))
  }

  console.log('\nI. Auditable approval gate')
  {
    // REVISED (EXLIB-1B2 Revision E, finding 2): identities and
    // rationale must be NON-BLANK (btrim length) as well as non-null.
    check('I1: runs CHECK — deliverable requires REAL product+legal identities, timestamps, non-blank rationale, dry_run=false',
      sql.includes('approved_for_delivery = false') &&
      sql.includes('product_approved_by IS NOT NULL') &&
      sql.includes('char_length(btrim(product_approved_by)) > 0') &&
      sql.includes('product_approved_at IS NOT NULL') &&
      sql.includes('legal_approved_by IS NOT NULL') &&
      sql.includes('char_length(btrim(legal_approved_by)) > 0') &&
      sql.includes('legal_approved_at IS NOT NULL') &&
      sql.includes('approval_rationale IS NOT NULL') &&
      sql.includes('char_length(btrim(approval_rationale)) > 0') &&
      sql.includes('AND dry_run = false'))
    // REVISED (EXLIB-1B2 Revision E, finding 2): reviewer identity
    // and rationale must be non-blank as well as non-null.
    check('I2: catalog-row CHECK — non-pending review requires NON-BLANK reviewer + rationale and a timestamp',
      sql.includes('reviewed_by IS NOT NULL') &&
      sql.includes('char_length(btrim(reviewed_by)) > 0') &&
      sql.includes('reviewed_at IS NOT NULL') &&
      sql.includes('review_rationale IS NOT NULL') &&
      sql.includes('char_length(btrim(review_rationale)) > 0'))
    // REVISED (EXLIB-1B2 Revision F, finding 1): the run gate also
    // requires the permanent seal and refuses revoked runs.
    check('I3: the delivery WHERE clauses require the full auditable state — sealed, approved, unrevoked run AND row gate',
      deliverFn.includes('approved_for_delivery = true') &&
      deliverFn.includes('dry_run = false') &&
      deliverFn.includes('AND sealed_at IS NOT NULL') &&
      deliverFn.includes('AND revoked_at IS NULL') &&
      deliverFn.includes("c.review_status = 'approved'") &&
      deliverFn.includes('c.is_active = true'))
    // REVISED (EXLIB-1B2 Revision F, finding 1): the two run
    // lifecycle UPDATEs are function DEFINITIONS, not executed DML —
    // the migration itself still populates and approves NOTHING.
    check('I4: nothing is populated or approved by this migration — no snapshot updates; runs UPDATEs exist only inside the two lifecycle functions',
      !sql.includes("review_status = 'approved',") &&
      !/UPDATE (public\.)?exercise_catalog\b/.test(sql) &&
      (sql.match(/UPDATE (public\.)?exercise_catalog_import_runs/g) || []).length === 2 &&
      approveFn.includes('UPDATE public.exercise_catalog_import_runs') &&
      revokeFn.includes('UPDATE public.exercise_catalog_import_runs') &&
      !/INSERT INTO (public\.)?exercise_catalog_import_runs/.test(sql) &&
      !/SELECT setval|COPY /.test(sql))
  }

  console.log('\nJ. Function identity + privileges (parsed)')
  {
    check('J1: both callable functions are SECURITY DEFINER, fixed search_path, auth.uid()-only, no user parameter',
      [deliverFn, rollbackFn].every((f) =>
        f.includes('SECURITY DEFINER') &&
        f.includes('SET search_path = public, pg_temp') &&
        f.includes('auth.uid()')) &&
      sql.includes('deliver_catalog_exercises(p_run_key TEXT)') &&
      sql.includes('rollback_catalog_delivery(p_run_key TEXT)') &&
      !/p_user|p_uid|p_owner/.test(sql))
    check('J2: function body references are schema-qualified (public.*) under the fixed path',
      // REVISED (EXLIB-1B2 Revision E, finding 1): + run membership.
      // REVISED (EXLIB-1B2 Revision G, finding 2): + review events.
      ['public.exercise_catalog_import_runs', 'public.exercise_catalog',
        'public.exercises', 'public.exercise_muscles', 'public.exercise_aliases',
        'public.exercise_catalog_muscles', 'public.exercise_catalog_aliases',
        'public.exercise_catalog_name_claims', 'public.exercise_name_claims',
        'public.exercise_catalog_run_items',
        'public.exercise_catalog_review_events']
        .every((t) => sql.includes(t)))
    check('J3: EXECUTE revoked from PUBLIC/anon; granted to authenticated ONLY on the two self-scoped functions',
      sql.includes('REVOKE ALL ON FUNCTION deliver_catalog_exercises(TEXT) FROM PUBLIC, anon') &&
      sql.includes('REVOKE ALL ON FUNCTION rollback_catalog_delivery(TEXT) FROM PUBLIC, anon') &&
      sql.includes('GRANT EXECUTE ON FUNCTION deliver_catalog_exercises(TEXT) TO authenticated') &&
      sql.includes('GRANT EXECUTE ON FUNCTION rollback_catalog_delivery(TEXT) TO authenticated') &&
      (sql.match(/GRANT EXECUTE/g) || []).length === 2)
    check('J4: no service_role reference in the migration or product source',
      !sql.includes('service_role') &&
      (() => {
        try { execSync("grep -rn 'service_role' src", { encoding: 'utf8' }); return false }
        catch { return true }
      })())
  }

  console.log('\nL. Global catalog namespace + alias lifecycle (Revision B)')
  {
    check('L1: one global claims table covers ACTIVE canonical names AND aliases with a single PK',
      sql.includes('CREATE TABLE exercise_catalog_name_claims') &&
      sql.includes('normalized_name  TEXT PRIMARY KEY') &&
      sql.includes("claim_source     TEXT NOT NULL CHECK (claim_source IN ('canonical','alias'))"))
    check('L2: catalog triggers cover snapshot INSERT/UPDATE(name,is_active)/DELETE and alias INSERT/UPDATE/DELETE',
      sql.includes('AFTER INSERT OR UPDATE OF canonical_name, is_active OR DELETE ON exercise_catalog') &&
      sql.includes('AFTER INSERT OR UPDATE OF alias OR DELETE ON exercise_catalog_aliases') &&
      catalogClaimFns.includes("VALUES (lower(NEW.canonical_name), 'canonical', NEW.logical_id)") &&
      catalogClaimFns.includes("VALUES (lower(NEW.alias), 'alias', NEW.logical_id)"))
    check('L3: same-logical version continuity is a permitted no-op; cross-logical collisions hit the PK',
      catalogClaimFns.includes('Same-logical continuity') &&
      (catalogClaimFns.match(/IF NOT EXISTS \(\s+SELECT 1 FROM public\.exercise_catalog_name_claims c/g) || []).length === 2 &&
      catalogClaimFns.includes('c.logical_id = NEW.logical_id'))
    // REVISED (EXLIB-1B2 Revision C, finding 3): the check-then-delete
    // release re-check is GONE — multiple active bearers per claim are
    // structurally prohibited, so the departing bearer releases
    // unconditionally and no race window exists.
    check('L4: claim release is UNCONDITIONAL — no check-then-delete re-check anywhere in the claim triggers',
      !sql.includes('e.id <> OLD.id') &&
      !catalogClaimFns.includes('AND NOT EXISTS (') &&
      catalogClaimFns.includes('Release is UNCONDITIONAL') &&
      catalogClaimFns.includes('check-then-delete race window'))
    check('L5: tenant aliases carry is_active; ACTIVE-only partial uniqueness lets released names be reused',
      sql.includes('is_active    BOOLEAN NOT NULL DEFAULT true') &&
      sqlFlat.includes('ON exercise_aliases (user_id, lower(alias)) WHERE is_active = true'))
    check('L6: tenant alias claims are active-only — trigger releases on deactivate, restores on reactivate',
      sql.includes('AFTER INSERT OR UPDATE OF alias, is_active OR DELETE ON exercise_aliases') &&
      triggerFns.includes('IF NEW.is_active THEN') &&
      triggerFns.includes('OLD.is_active AND (NOT NEW.is_active') &&
      triggerFns.includes('NEW.is_active AND (NOT OLD.is_active'))
    check('L7: alias lookup contract — active aliases resolve to active exercises only',
      sqlFlat.includes('active aliases resolve to active exercises only'))
    check('L8: all four claim-trigger helpers are DEFINER, fixed-path, and revoked from every client role',
      ['exlib_claim_exercise_name', 'exlib_claim_alias_name',
        'exlib_claim_catalog_name', 'exlib_claim_catalog_alias']
        .every((f) => sql.includes(`REVOKE ALL ON FUNCTION ${f}() FROM PUBLIC, anon, authenticated`)) &&
      // REVISED (EXLIB-1B2 Revision D, finding 1): the lifecycle
      // cascade and the delivered-delete gate add two DEFINER
      // trigger functions (6 -> 8), both fixed-path and revoked; the
      // two verify functions remain SECURITY INVOKER by design.
      // REVISED (EXLIB-1B2 Revision E, findings 1+3): the four freeze
      // helpers (snapshot/anatomy/alias/membership) add four more
      // (8 -> 12), same discipline.
      // REVISED (EXLIB-1B2 Revision F, finding 1): the run-row freeze
      // helper and the two run lifecycle operations add three more
      // (12 -> 15), same discipline; none are client-callable.
      // REVISED (EXLIB-1B2 Revision G, finding 2): the review-events
      // guard adds one more (15 -> 16), same discipline.
      (sql.match(/SECURITY DEFINER/g) || []).length === 16 &&
      (sql.match(/SET search_path = public, pg_temp/g) || []).length === 16)
  }

  console.log('\nM. Revision C findings')
  {
    check('M1: the committed 003 index name is resolved, not guessed — the allowlist string matches migration 003 exactly',
      (() => {
        const m003 = read('supabase/migrations/003_phase1c_workout_logging.sql')
        return m003.includes('CREATE UNIQUE INDEX exercises_user_name_unique_idx') &&
          m003.replace(/\s+/g, ' ')
            .includes('CREATE UNIQUE INDEX exercises_user_name_unique_idx ON exercises (user_id, lower(name))') &&
          deliverFn.includes("'exercises_user_name_unique_idx'")
      })())
    check('M2: exercises_user_name_unique_idx maps ONLY to skipped_name_collision — never already-delivered, never abort',
      (() => {
        const i = deliverFn.indexOf("'exercises_user_name_unique_idx'")
        const branch = deliverFn.slice(i, deliverFn.indexOf('ELSIF', i))
        return i > -1 && (deliverFn.match(/'exercises_user_name_unique_idx'/g) || []).length === 1 &&
          branch.includes('v_skipped_collision := v_skipped_collision + 1') &&
          branch.includes('CONTINUE;') &&
          !branch.includes('v_skipped_existing') && !branch.includes('RAISE')
      })())
    check('M3: static collision proof pinned — exactly three expected exercise-insert sources; all others are defects that RAISE',
      sqlFlat.includes('STATIC COLLISION PROOF (Revision C, finding 1)') &&
      sqlFlat.includes('can raise unique_violation ONLY from') &&
      ['exercises_user_name_unique_idx', 'exercise_name_claims_pkey',
        'exercises_user_catalog_logical_unique_idx']
        .every((c) => sqlFlat.includes(c)) &&
      sqlFlat.includes('a defect, never a disposition, hence RAISE') &&
      sqlFlat.includes('exercises_pkey / exercises_user_id_id_unique take gen_random_uuid() ids') &&
      sqlFlat.includes('exercise_catalog_muscles_unique'))
    check('M4: pre-existing name is a SKIP, not an abort — collision branch continues; only the ELSE arm re-raises',
      sqlFlat.includes('a pre-existing name surfaces HERE, not at the claims PK: an honest per-candidate skip, never an abort') &&
      deliverFn.indexOf('CONTINUE;') > -1 &&
      // REVISED (EXLIB-1B2 Revision E): de-nested indentation.
      deliverFn.indexOf("IF v_constraint IN ('exercises_user_name_unique_idx'") <
        deliverFn.indexOf('ELSE\n          -- Anatomy/provenance/unknown uniqueness failure'))
    check('M5: alias provenance is immutable and RESTRICT-protected — catalog_alias_id + import_run_id FKs; no client mutation path',
      sql.includes('catalog_alias_id UUID REFERENCES exercise_catalog_aliases(id) ON DELETE RESTRICT') &&
      sql.includes('import_run_id    UUID REFERENCES exercise_catalog_import_runs(id) ON DELETE RESTRICT') &&
      deliverFn.includes('(user_id, exercise_id, alias, catalog_alias_id, import_run_id)') &&
      deliverFn.includes('VALUES (v_uid, v_target_id, v_alias.alias, v_alias.id, v_run.id)') &&
      !/GRANT [^;]*UPDATE[^;]* ON exercise_aliases/.test(sql))
    check('M6: declarative alias idempotency — partial unique (user_id, catalog_alias_id); independent of the active-name index; no duplicate audit rows on retry',
      sqlFlat.includes('CREATE UNIQUE INDEX exercise_aliases_user_catalog_alias_unique_idx ON exercise_aliases (user_id, catalog_alias_id) WHERE catalog_alias_id IS NOT NULL') &&
      deliverFn.includes('WHERE t.user_id = v_uid AND t.catalog_alias_id = v_alias.id') &&
      !deliverFn.includes('t.is_active') &&
      sqlFlat.includes('ACTIVE OR INACTIVE') &&
      sqlFlat.includes('retries can never create duplicate audit rows'))
    // REVISED (EXLIB-1B2 Revision D, finding 3): the target select
    // now also fetches is_active; the policy applies only to ACTIVE
    // targets (see O4).
    // REVISED (EXLIB-1B2 Revision E, finding 1): the policy lives in
    // the unified alias phase — membership-scoped, approval-gated,
    // and the inserted-this-call distinction keys v_inserted_logical.
    check('M7: later-run alias policy explicit — ACTIVE already-delivered exercises still receive this run\'s new aliases, reported separately',
      sqlFlat.includes('the LATER-RUN ALIAS POLICY of Revision C, finding 2, preserved and still approval-gated') &&
      deliverFn.includes('SELECT e.id, e.is_active INTO v_target_id, v_target_active') &&
      deliverFn.includes('IF v_alias.logical_id = ANY(v_inserted_logical) THEN\n        v_alias_inserted := v_alias_inserted + 1;\n      ELSE\n        v_alias_added_existing := v_alias_added_existing + 1;'))
    // REVISED (EXLIB-1B2 Revision D, findings 1-2): DIRECT rollback
    // deactivation stays run-provenance-scoped; the lifecycle cascade
    // adds separately counted DEPENDENT deactivations, superseding
    // the Revision C \"other runs' aliases untouched\" wording, which
    // conflicted with lookup safety.
    check('M8: direct rollback stays provenance-scoped; dependent deactivations are lifecycle-driven and separately reported',
      rollbackFn.includes('AND a.import_run_id = v_run.id') &&
      sqlFlat.includes('reported separately as alias_dependent_deactivated, NEVER as this run\'s deliveries') &&
      sqlFlat.includes('Aliases on exercises this run did not deliver, and every unrelated row, are NEVER touched'))
    check('M9: catalog claim concurrency — EXACTLY-ONE-active-bearer is structural; invariant function present and client-revoked',
      sql.includes('CREATE OR REPLACE FUNCTION exlib_verify_catalog_claims()') &&
      sql.includes('orphaned_claims    BIGINT') &&
      sql.includes('unclaimed_bearers  BIGINT') &&
      sql.includes('REVOKE ALL ON FUNCTION exlib_verify_catalog_claims() FROM PUBLIC, anon, authenticated') &&
      !sql.includes('GRANT EXECUTE ON FUNCTION exlib_verify_catalog_claims') &&
      sqlFlat.includes('MULTIPLE active bearers per claim are structurally impossible') &&
      sqlFlat.includes('exercise_catalog_active_name_unique_idx') &&
      sqlFlat.includes('bars a canonical bearer and an alias bearer from coexisting'))
    check('M10: tenant claims share the exactly-one-bearer property — non-partial exercises index + partial active-alias index + claims PK',
      notesFlat.includes('tenant claims are NOT susceptible') &&
      notesFlat.includes('non-partial') &&
      sqlFlat.includes('The tenant side shares the property'))
    // REVISED (EXLIB-1B2 Revision D, finding 2): the stable contract
    // is now SEVEN counters — alias_dependent_deactivated appended.
    check('M11: STABLE seven-counter rollback result contract — nothing more, nothing less beyond run_key',
      (() => {
        const ret = rollbackFn.slice(rollbackFn.indexOf('RETURN jsonb_build_object'))
        const keys = Array.from(ret.matchAll(/'([a-z_]+)',/g), (m) => m[1])
        return JSON.stringify(keys) === JSON.stringify(
          ['run_key', 'found', 'newly_deactivated', 'already_inactive',
            'alias_found', 'alias_newly_deactivated', 'alias_already_inactive',
            'alias_dependent_deactivated'])
      })())
    check('M12: delivery and rollback state-transition tables recorded in the notes',
      notesFlat.includes('Delivery state transitions (Revision C)') &&
      notesFlat.includes('Rollback state transitions (Revision C)') &&
      notesFlat.includes('alias_added_to_existing') &&
      notesFlat.includes('alias_already_delivered'))
  }

  console.log('\nO. Revision D findings')
  {
    check('O1: lifecycle cascade trigger — any true->false exercises.is_active transition deactivates its active aliases, DB-enforced',
      sql.includes('CREATE TRIGGER exercises_dependent_alias_trigger\n  AFTER UPDATE OF is_active ON exercises\n  FOR EACH ROW EXECUTE FUNCTION exlib_deactivate_exercise_aliases();') &&
      cascadeFn.includes('IF OLD.is_active AND NOT NEW.is_active THEN') &&
      cascadeFn.includes('WHERE a.user_id = NEW.user_id') &&
      cascadeFn.includes('AND a.exercise_id = NEW.id') &&
      cascadeFn.includes('AND a.is_active = true') &&
      (cascadeFn.match(/SET is_active = false/g) || []).length === 1 &&
      (cascadeFn.match(/SET /g) || []).length === 2 &&
      cascadeFn.includes('SECURITY DEFINER') &&
      cascadeFn.includes('SET search_path = public, pg_temp') &&
      sql.includes('REVOKE ALL ON FUNCTION exlib_deactivate_exercise_aliases() FROM PUBLIC, anon, authenticated') &&
      !cascadeFn.includes('auth.uid') && !/p_user|p_uid/.test(cascadeFn))
    check('O2: no second-update reliance — rollback and the PATCH route perform no manual dependent-alias update',
      (rollbackFn.match(/UPDATE public\.exercise_aliases/g) || []).length === 1 &&
      rollbackFn.slice(rollbackFn.indexOf('UPDATE public.exercise_aliases'),
        rollbackFn.indexOf('RETURNING a.id')).includes('AND a.import_run_id = v_run.id') &&
      !read('src/app/api/exercises/[id]/route.ts').includes('exercise_aliases') &&
      sqlFlat.includes('no route or function has to remember a second update'))
    check('O3: dependent counter is exact — FOR UPDATE lock, non-run-provenance predicate, locked-id scope, separate result key',
      rollbackFn.includes('FOR UPDATE') &&
      rollbackFn.includes('a.import_run_id IS DISTINCT FROM v_run.id') &&
      rollbackFn.includes('a.exercise_id = ANY(v_active_ids)') &&
      rollbackFn.includes("'alias_dependent_deactivated', v_alias_dependent") &&
      rollbackFn.indexOf('SET is_active = false') < rollbackFn.indexOf('FOR UPDATE') &&
      sqlFlat.includes('so the count below exactly matches what exercises_dependent_alias_trigger deactivates'))
    // REVISED (EXLIB-1B2 Revision E, finding 1): one unified alias
    // phase means ONE target lookup; the guard still precedes every
    // insert path and the disposition is unchanged.
    check('O4: alias delivery to an INACTIVE exercise is blocked — deterministic alias_skipped_inactive_exercise, no insert path',
      (deliverFn.match(/SELECT e\.id, e\.is_active INTO v_target_id, v_target_active/g) || []).length === 1 &&
      deliverFn.includes('v_target_active := false;') &&
      deliverFn.includes('IF NOT v_target_active THEN') &&
      deliverFn.includes('v_alias_skipped_inactive := v_alias_skipped_inactive + 1;\n      CONTINUE;') &&
      deliverFn.indexOf('IF NOT v_target_active THEN') <
        deliverFn.indexOf('INSERT INTO public.exercise_aliases') &&
      deliverFn.includes("'alias_skipped_inactive_exercise', v_alias_skipped_inactive"))
    check('O5: manual deactivation/reactivation semantics pinned — cascade on deactivate; reactivation never revives aliases',
      sqlFlat.includes('Reactivating an exercise (false -> true) does NOT silently reactivate old aliases') &&
      sqlFlat.includes('the trigger acts only on the true -> false edge') &&
      sqlFlat.includes('Alias reactivation remains an explicit future reviewed operation') &&
      sqlFlat.includes('retries cannot create replacement inactive rows') &&
      sqlFlat.includes('catalog rollback, the product PATCH route, every future authorized path'))
    check('O6: lookup-safety invariant — zero active aliases on inactive exercises; INVOKER, client-revoked, ungranted',
      lifecycleVerifyFn.includes('active_aliases_on_inactive_exercises') &&
      lifecycleVerifyFn.includes('a.is_active = true') &&
      lifecycleVerifyFn.includes('e.is_active = false') &&
      !lifecycleVerifyFn.includes('SECURITY DEFINER') &&
      sql.includes('REVOKE ALL ON FUNCTION exlib_verify_alias_lifecycle() FROM PUBLIC, anon, authenticated') &&
      !sql.includes('GRANT EXECUTE ON FUNCTION exlib_verify_alias_lifecycle') &&
      sqlFlat.includes('requires BOTH exercise_aliases.is_active = true AND the target exercises.is_active = true'))
    check('O7: delivered-row deletion fail-closed — BEFORE DELETE gate on provenance; user-created deletion unchanged; decision documented as unresolved',
      sql.includes('CREATE TRIGGER exercises_delivered_delete_gate_trigger\n  BEFORE DELETE ON exercises') &&
      deleteGateFn.includes('OLD.catalog_id IS NOT NULL') &&
      deleteGateFn.includes('OLD.catalog_logical_id IS NOT NULL') &&
      deleteGateFn.includes('OLD.import_run_id IS NOT NULL') &&
      deleteGateFn.includes('RAISE EXCEPTION') &&
      sqlFlat.includes('UNRESOLVED PRODUCT DECISION') &&
      sqlFlat.includes('existing product behavior for user-created exercises is unchanged') &&
      notesFlat.includes('UNRESOLVED PRODUCT DECISION') &&
      (() => {
        const route = read('src/app/api/exercises/[id]/route.ts')
        return route.includes('This exercise has workout history. Deactivate it instead of deleting.') &&
          route.includes(".from('exercises').delete()") &&
          notesFlat.includes('pre-checks only `workout_exercises`')
      })())
    // REVISED (EXLIB-1B2 Revision E, finding 1): the contract gains
    // alias_skipped_no_exercise for members whose logical has no
    // delivered exercise for this user.
    check('O8: STABLE delivery result contract — exact key list, nothing more, nothing less',
      (() => {
        const ret = deliverFn.slice(deliverFn.indexOf('RETURN jsonb_build_object'))
        const keys = Array.from(ret.matchAll(/'([a-z_]+)',/g), (m) => m[1])
        return JSON.stringify(keys) === JSON.stringify(
          ['run_key', 'eligible', 'inserted', 'skipped_already_delivered',
            'skipped_name_collision', 'collision_names', 'alias_inserted',
            'alias_added_to_existing', 'alias_already_delivered',
            'alias_skipped_no_exercise',
            'alias_skipped_inactive_exercise', 'alias_skipped_collision',
            'inserted_catalog_logical_ids'])
      })())
    // REVISED (EXLIB-1B2 Revision D correction): the retry contract
    // is STATE idempotency — same durable state, no duplicate rows
    // or repeated mutations; counters describe each attempt's
    // dispositions and are NOT claimed identical across attempts.
    check('O9: Revision D state-transition matrix covers all six required scenarios plus the precise retry contract',
      notesFlat.includes('State-transition matrix (Revision D)') &&
      ['original-run rollback', 'later alias-only run rollback',
        'original-run rollback after later aliases',
        'manual exercise deactivation',
        'inactive exercise encountered by a later run']
        .every((k) => notesFlat.includes(k)) &&
      notesFlat.includes('Retry after every scenario produces the same durable database state: no duplicate rows, no repeated mutations') &&
      notesFlat.includes('Disposition counters are NOT claimed to be identical across attempts') &&
      notesFlat.includes('the invariant is the state, not the numbers') &&
      !notesFlat.includes('identical counters') &&
      !notesFlat.includes('same counts every time'))
    // REVISED (EXLIB-1B2 Revision E, findings 1+3): + four freeze
    // helpers (8 -> 12 client-revoked functions).
    // REVISED (EXLIB-1B2 Revision F, finding 1): + the run-row freeze
    // helper (13 niladic) and the two run lifecycle operations, which
    // are revoked from authenticated TOO — approval and revocation
    // are never client-callable.
    // REVISED (EXLIB-1B2 Revision G, finding 2): + the review-events
    // guard (14 niladic client-revoked functions).
    check('O10: complete function-privilege inventory — 14 niladic + 2 lifecycle client-revoked functions, 2 PUBLIC/anon-revoked callables, 2 EXECUTE grants',
      (sql.match(/REVOKE ALL ON FUNCTION [a-z_]+\(\) FROM PUBLIC, anon, authenticated;/g) || []).length === 14 &&
      (sql.match(/REVOKE ALL ON FUNCTION [a-z_]+\(TEXT\) FROM PUBLIC, anon, authenticated;/g) || []).length === 2 &&
      (sql.match(/REVOKE ALL ON FUNCTION [a-z_]+\(TEXT\) FROM PUBLIC, anon;/g) || []).length === 2 &&
      (sql.match(/GRANT EXECUTE/g) || []).length === 2 &&
      !sql.includes('GRANT EXECUTE ON FUNCTION exlib_approve_and_seal_run') &&
      !sql.includes('GRANT EXECUTE ON FUNCTION exlib_revoke_run_delivery'))
    // REVISED (EXLIB-1B2 Revision E): the live artifact is the
    // Revision E copy; the Revision D copy is retained as a
    // fingerprint-pinned historical record.
    // REVISED (EXLIB-1B2 Revision F): the live artifact is the
    // Revision F copy; the D and E copies are retained pinned to
    // their superseded fingerprints.
    // REVISED (EXLIB-1B2 Revision G): the live artifact is the
    // Revision G copy; D, E, and F copies retained pinned.
    // REVISED (EXLIB-1B2 Revision H): the live artifact is the
    // Revision H copy; the G copy is retained pinned to its
    // superseded (approved-architecture) fingerprint.
    check('O11: the Revision H review-copy artifact is byte-identical to the draft; the D, E, F, and G copies still match their superseded fingerprints',
      (() => {
        const copy = readFileSync('docs/exlib1b1-migration-023-revision-h-review-copy.sql')
        const gCopy = readFileSync('docs/exlib1b1-migration-023-revision-g-review-copy.sql')
        const fCopy = readFileSync('docs/exlib1b1-migration-023-revision-f-review-copy.sql')
        const eCopy = readFileSync('docs/exlib1b1-migration-023-revision-e-review-copy.sql')
        const dCopy = readFileSync('docs/exlib1b1-migration-023-revision-d-review-copy.sql')
        return copy.length === sqlBytes.length &&
          createHash('sha256').update(copy).digest('hex') === M023_SHA &&
          copy.equals(sqlBytes) &&
          gCopy.length === 91382 &&
          createHash('sha256').update(gCopy).digest('hex') === REV_G_SHA &&
          fCopy.length === 83969 &&
          createHash('sha256').update(fCopy).digest('hex') === REV_F_SHA &&
          eCopy.length === 65288 &&
          createHash('sha256').update(eCopy).digest('hex') === REV_E_SHA &&
          dCopy.length === 53909 &&
          createHash('sha256').update(dCopy).digest('hex') === REV_D_SHA
      })())
  }

  console.log('\nP. Revision E findings (fail-closed proofs)')
  {
    check('P1: delivery is run-scoped — BOTH loops join ONLY the requested run\'s membership; Run A cannot read Run B exercises, anatomy, or aliases',
      (deliverFn.match(/ri\.run_id = v_run\.id/g) || []).length === 2 &&
      (deliverFn.match(/JOIN public\.exercise_catalog_run_items ri/g) || []).length === 2 &&
      deliverFn.includes('ON ri.run_id = v_run.id AND ri.catalog_id = c.id') &&
      deliverFn.includes('ON ri.run_id = v_run.id AND ri.catalog_alias_id = a.id') &&
      // No unscoped catalog read remains: every FROM on the catalog
      // or its aliases is immediately followed by the membership JOIN.
      (deliverFn.match(/FROM public\.exercise_catalog c\n    JOIN public\.exercise_catalog_run_items ri/g) || []).length === 1 &&
      (deliverFn.match(/FROM public\.exercise_catalog_aliases a\n    JOIN public\.exercise_catalog_run_items ri/g) || []).length === 1 &&
      (deliverFn.match(/FROM public\.exercise_catalog c/g) || []).length === 1 &&
      (deliverFn.match(/FROM public\.exercise_catalog_aliases a/g) || []).length === 1 &&
      // Anatomy follows the member snapshot only.
      deliverFn.includes('FROM public.exercise_catalog_muscles m\n      WHERE m.catalog_id = v_cat.id'))
    // REVISED (EXLIB-1B2 Revision F, finding 1): the freeze keys
    // EXCLUSIVELY on the permanent sealed_at and locks the parent
    // run row FOR UPDATE — approval/edit races are closed and NO
    // state (disablement, revocation, anything) reopens editing.
    check('P2: a sealed run\'s membership is PERMANENT — rows immutable; add/remove raises forever after sealing',
      sql.includes('CREATE TRIGGER exercise_catalog_run_items_freeze_trigger\n  BEFORE INSERT OR UPDATE OR DELETE ON exercise_catalog_run_items') &&
      runItemsFreezeFn.includes("IF TG_OP = 'UPDATE' THEN") &&
      runItemsFreezeFn.includes('membership rows are immutable') &&
      runItemsFreezeFn.includes('SELECT r.sealed_at INTO v_sealed_at') &&
      runItemsFreezeFn.includes('FOR UPDATE') &&
      runItemsFreezeFn.includes("a sealed run''s membership is PERMANENT") &&
      !runItemsFreezeFn.includes('approved_for_delivery') &&
      !runItemsFreezeFn.includes('revoked_at') &&
      (runItemsFreezeFn.match(/RAISE EXCEPTION/g) || []).length === 3)
    // REVISED (EXLIB-1B2 Revision F, finding 1): the gate now also
    // requires the permanent seal and refuses revoked runs.
    check('P3: alias-only later runs deliver ONLY after their own sealed approval — the sealed/unrevoked gate precedes both loops and scopes the requested run',
      deliverFn.includes('approved_for_delivery = true') &&
      deliverFn.includes('AND dry_run = false') &&
      deliverFn.includes('AND sealed_at IS NOT NULL') &&
      deliverFn.includes('AND revoked_at IS NULL') &&
      deliverFn.indexOf('approved_for_delivery = true') <
        deliverFn.indexOf('FOR v_cat IN') &&
      deliverFn.indexOf('sealed_at IS NOT NULL') <
        deliverFn.indexOf('FOR v_cat IN') &&
      deliverFn.indexOf('FOR v_cat IN') < deliverFn.indexOf('FOR v_alias IN') &&
      deliverFn.includes('WHERE run_key = p_run_key'))
    check('P4: empty and whitespace-only approval/review identities and rationales fail at the CHECK boundary',
      ['product_approved_by', 'legal_approved_by', 'approval_rationale',
        'reviewed_by', 'review_rationale']
        .every((c) => sql.includes(`char_length(btrim(${c})) > 0`)) &&
      ['product_approved_by', 'legal_approved_by', 'approval_rationale',
        'reviewed_by', 'review_rationale']
        .every((c) => sql.includes(`${c} IS NOT NULL`)))
    check('P5: claim ownership cannot become stale — logical_id and claimed text are frozen under every claim trigger',
      snapshotFreezeFn.includes('IF NEW.logical_id        IS DISTINCT FROM OLD.logical_id') &&
      snapshotFreezeFn.includes('OR NEW.canonical_name IS DISTINCT FROM OLD.canonical_name') &&
      snapshotFreezeFn.includes('snapshot identity/content is immutable') &&
      // REVISED (EXLIB-1B2 Revision F, findings 2-3): the freeze
      // trigger also guards INSERT (born pending + active).
      sql.includes('CREATE TRIGGER exercise_catalog_freeze_trigger\n  BEFORE INSERT OR UPDATE ON exercise_catalog') &&
      aliasFreezeFn.includes('alias rows are immutable') &&
      sql.includes('CREATE TRIGGER exercise_catalog_aliases_freeze_trigger\n  BEFORE UPDATE ON exercise_catalog_aliases') &&
      anatomyFreezeFn.includes('anatomy rows are immutable') &&
      anatomyFreezeFn.includes('anatomy is sealed once its snapshot leaves pending review') &&
      sql.includes('CREATE TRIGGER exercise_catalog_muscles_freeze_trigger\n  BEFORE INSERT OR UPDATE OR DELETE ON exercise_catalog_muscles'))
    check('P6: membership table is closed, keyed, and kind-exclusive — RESTRICT FKs, per-run uniqueness, exactly one member kind per row',
      sql.includes('CREATE TABLE exercise_catalog_run_items') &&
      sql.includes('(catalog_id IS NULL) <> (catalog_alias_id IS NULL)') &&
      sqlFlat.includes('CREATE UNIQUE INDEX exercise_catalog_run_items_exercise_unique_idx ON exercise_catalog_run_items (run_id, catalog_id) WHERE catalog_id IS NOT NULL') &&
      sqlFlat.includes('CREATE UNIQUE INDEX exercise_catalog_run_items_alias_unique_idx ON exercise_catalog_run_items (run_id, catalog_alias_id) WHERE catalog_alias_id IS NOT NULL') &&
      sql.includes('REVOKE ALL ON exercise_catalog_run_items   FROM PUBLIC, anon, authenticated') &&
      (sql.match(/run_id            UUID NOT NULL\n                    REFERENCES exercise_catalog_import_runs\(id\) ON DELETE RESTRICT/g) || []).length === 1)
    check('P7: alias members with no delivered target report the distinct alias_skipped_no_exercise disposition',
      deliverFn.includes('IF v_target_id IS NULL THEN\n      v_alias_no_exercise := v_alias_no_exercise + 1;\n      CONTINUE;') &&
      deliverFn.includes("'alias_skipped_no_exercise', v_alias_no_exercise") &&
      sqlFlat.includes('a member whose logical has NO delivered exercise for this user'))
    // REVISED (EXLIB-1B2 Revision F, finding 1): + the run-row freeze
    // helper and the two run lifecycle operations (which take only a
    // run key — no user identity of any kind).
    // REVISED (EXLIB-1B2 Revision G, finding 2): + the review-events
    // guard (six freeze helpers).
    check('P8: all six freeze helpers and both run lifecycle operations follow the DEFINER discipline and are unreachable by clients',
      ['exlib_freeze_catalog_snapshot', 'exlib_freeze_catalog_anatomy',
        'exlib_freeze_catalog_alias', 'exlib_freeze_run_membership',
        'exlib_freeze_run_row', 'exlib_freeze_review_events']
        .every((f) =>
          sql.includes(`REVOKE ALL ON FUNCTION ${f}() FROM PUBLIC, anon, authenticated`) &&
          !sql.includes(`GRANT EXECUTE ON FUNCTION ${f}`)) &&
      [snapshotFreezeFn, anatomyFreezeFn, aliasFreezeFn, runItemsFreezeFn,
        runRowFreezeFn, approveFn, revokeFn, eventsGuardFn]
        .every((f) => f.includes('SECURITY DEFINER') &&
          f.includes('SET search_path = public, pg_temp') &&
          !/p_user|p_uid|auth\.uid/.test(f)))
  }

  console.log('\nQ. Revision F regression proofs (fail-closed)')
  {
    check('Q1: approve -> disable/revoke -> membership INSERT fails — the freeze keys only on the permanent seal',
      runItemsFreezeFn.includes('IF v_sealed_at IS NOT NULL THEN') &&
      runItemsFreezeFn.includes("a sealed run''s membership is PERMANENT") &&
      runItemsFreezeFn.includes('delivery disablement and revocation never reopen editing') &&
      !runItemsFreezeFn.includes('approved_for_delivery') &&
      !runItemsFreezeFn.includes('revoked_at'))
    check('Q2: approve -> disable/revoke -> membership DELETE fails — same permanent-seal predicate covers every TG_OP',
      sql.includes('BEFORE INSERT OR UPDATE OR DELETE ON exercise_catalog_run_items') &&
      runItemsFreezeFn.includes('COALESCE(NEW.run_id, OLD.run_id)') &&
      runItemsFreezeFn.includes('RETURN COALESCE(NEW, OLD);'))
    check('Q3: membership UPDATE fails ALWAYS — rows are immutable in every run state',
      runItemsFreezeFn.includes("IF TG_OP = 'UPDATE' THEN\n    RAISE EXCEPTION") &&
      runItemsFreezeFn.indexOf("IF TG_OP = 'UPDATE'") <
        runItemsFreezeFn.indexOf('SELECT r.sealed_at'))
    check('Q4: old approval evidence cannot approve changed membership — one atomic seal, born-unsealed runs, coupled CHECKs, frozen evidence',
      runRowFreezeFn.includes('runs are born unsealed, unapproved, and unrevoked') &&
      runRowFreezeFn.includes('approval and the seal move together in ONE atomic unsealed -> sealed transition') &&
      runRowFreezeFn.includes("a sealed run''s approval-bound fields (run_key, dry_run, approval evidence, seal) are immutable") &&
      sql.includes('exercise_catalog_import_runs_seal_coupling_chk') &&
      sqlFlat.includes('(approved_for_delivery = true AND sealed_at IS NOT NULL) OR (approved_for_delivery = false AND sealed_at IS NULL)') &&
      runRowFreezeFn.includes('sealing requires complete, non-blank product + legal approval evidence') &&
      runRowFreezeFn.includes('an empty membership cannot be sealed'))
    check('Q5: a pending member cannot later become newly deliverable under a sealed run — seal validation + one-way review machine',
      runRowFreezeFn.includes("c.review_status <> 'approved'") &&
      snapshotFreezeFn.includes('it can never return to pending and re-approval requires a new catalog version row') &&
      snapshotFreezeFn.includes('snapshots are born pending') &&
      snapshotFreezeFn.includes("(OLD.review_status = 'pending'\n             AND NEW.review_status IN ('approved','revised','rejected'))") &&
      snapshotFreezeFn.includes("(OLD.review_status = 'approved'\n                AND NEW.review_status IN ('revised','rejected'))"))
    check('Q6: an inactive member cannot later become newly deliverable under a sealed run — seal validation + one-way is_active',
      runRowFreezeFn.includes('c.is_active = false') &&
      snapshotFreezeFn.includes('IF NOT OLD.is_active AND NEW.is_active THEN') &&
      snapshotFreezeFn.includes('snapshot reactivation is not permitted; restoring deliverability requires a new catalog version row and a new sealed run') &&
      snapshotFreezeFn.includes('snapshots are born active'))
    check('Q7: approval and membership editing serialize on the SAME parent run row lock',
      runItemsFreezeFn.includes('FROM public.exercise_catalog_import_runs r') &&
      runItemsFreezeFn.includes('FOR UPDATE') &&
      approveFn.includes('WHERE run_key = p_run_key\n  FOR UPDATE') &&
      runRowFreezeFn.includes('cannot race a membership change') &&
      revokeFn.includes('FOR UPDATE'))
    check('Q8: approved -> pending fails — the review machine has no path back to pending',
      snapshotFreezeFn.includes('review_status is one-way') &&
      !snapshotFreezeFn.includes("NEW.review_status IN ('pending'") &&
      snapshotFreezeFn.includes('revised/rejected terminal'))
    // REVISED (EXLIB-1B2 Revision G, finding 1): the status read is
    // now the LOCKED read (see R1) — same permanent seal.
    check('Q9: anatomy cannot change after the first transition out of pending — permanent because pending is unreachable again',
      anatomyFreezeFn.includes("v_review_status <> 'pending'") &&
      anatomyFreezeFn.includes('anatomy rows are immutable') &&
      anatomyFreezeFn.includes('anatomy is sealed once its snapshot leaves pending review') &&
      sqlFlat.includes('the first transition out of pending closes anatomy editing forever') &&
      sql.includes('BEFORE INSERT OR UPDATE OR DELETE ON exercise_catalog_muscles'))
    check('Q10: a new catalog version and a new run remain the ONLY correction/restoration path',
      (sql.match(/requires? a new catalog version row/g) || []).length >= 4 &&
      sqlFlat.includes('changed membership requires a NEW run') &&
      sqlFlat.includes('a different approval decision requires a NEW run') &&
      sqlFlat.includes('restoring deliverability requires a new catalog version row and a new sealed run'))
    check('Q11: alias-only runs still work only under their own sealed approval — membership-scoped alias phase behind the sealed gate',
      (deliverFn.match(/ri\.run_id = v_run\.id/g) || []).length === 2 &&
      deliverFn.includes('ON ri.run_id = v_run.id AND ri.catalog_alias_id = a.id') &&
      deliverFn.includes('AND sealed_at IS NOT NULL') &&
      sqlFlat.includes('Alias-only later runs are preserved and each requires its own sealed membership and its own product + legal approval'))
    check('Q12: approval evidence and run_key are immutable after sealing — every approval-bound field is in the frozen chain',
      ['NEW.run_key            IS DISTINCT FROM OLD.run_key',
        'NEW.dry_run            IS DISTINCT FROM OLD.dry_run',
        'NEW.approved_for_delivery IS DISTINCT FROM OLD.approved_for_delivery',
        'NEW.product_approved_by   IS DISTINCT FROM OLD.product_approved_by',
        'NEW.product_approved_at   IS DISTINCT FROM OLD.product_approved_at',
        'NEW.legal_approved_by     IS DISTINCT FROM OLD.legal_approved_by',
        'NEW.legal_approved_at     IS DISTINCT FROM OLD.legal_approved_at',
        'NEW.approval_rationale    IS DISTINCT FROM OLD.approval_rationale',
        'NEW.sealed_at             IS DISTINCT FROM OLD.sealed_at']
        .every((f) => runRowFreezeFn.includes(f)) &&
      sqlFlat.includes('Operational result fields (documented mutable; Revision F, finding 1 item 10)'))
    check('Q13: emergency delivery disablement is one-way and reopens NOTHING — revocation is not an editing mechanism',
      runRowFreezeFn.includes('revocation is one-way and permanent') &&
      runRowFreezeFn.includes('only sealed runs can be revoked') &&
      revokeFn.includes('only sealed runs can be revoked') &&
      sql.includes('exercise_catalog_import_runs_revoke_after_seal_chk') &&
      sqlFlat.includes('revoked_at IS NULL OR sealed_at IS NOT NULL') &&
      deliverFn.includes('AND revoked_at IS NULL') &&
      !runItemsFreezeFn.includes('revoked_at') &&
      sqlFlat.includes('NEVER a mechanism to reopen membership or approval editing'))
  }

  console.log('\nR. Revision G findings (fail-closed proofs)')
  {
    check('R1: anatomy mutation LOCKS the parent snapshot row FOR UPDATE before reading its review state — no unlocked check remains',
      anatomyFreezeFn.includes('SELECT c.review_status INTO v_review_status') &&
      anatomyFreezeFn.includes('FOR UPDATE') &&
      anatomyFreezeFn.indexOf('FOR UPDATE') <
        anatomyFreezeFn.indexOf("v_review_status <> 'pending'") &&
      anatomyFreezeFn.includes('IF NOT FOUND THEN') &&
      anatomyFreezeFn.includes('unknown parent snapshot') &&
      !anatomyFreezeFn.includes('IF EXISTS ('))
    check('R2: anatomy and review transitions serialize on the SAME snapshot row lock — the transition is an UPDATE of that row',
      sqlFlat.includes('anatomy mutation and review transition SERIALIZE') &&
      sqlFlat.includes('a waiting anatomy write observes the non-pending status and fails') &&
      sql.includes('CREATE TRIGGER exercise_catalog_freeze_trigger\n  BEFORE INSERT OR UPDATE ON exercise_catalog'))
    check('R3: the permanent anatomy seal survives the lock rework — first decision seals forever (one-way machine unchanged)',
      anatomyFreezeFn.includes('anatomy is sealed once its snapshot leaves pending review') &&
      snapshotFreezeFn.includes('it can never return to pending and re-approval requires a new catalog version row') &&
      sqlFlat.includes('the first transition out of pending closes anatomy editing forever'))
    check('R4: snapshots are born pending with ALL review-audit fields NULL — CHECK-enforced on both sides',
      sqlFlat.includes("(review_status = 'pending' AND reviewed_by IS NULL AND reviewed_at IS NULL AND review_rationale IS NULL)") &&
      sqlFlat.includes("(review_status <> 'pending' AND reviewed_by IS NOT NULL AND char_length(btrim(reviewed_by)) > 0 AND reviewed_at IS NOT NULL AND review_rationale IS NOT NULL AND char_length(btrim(review_rationale)) > 0)") &&
      snapshotFreezeFn.includes('snapshots are born with NULL review-audit fields; evidence arrives only with a review transition'))
    check('R5: EVERY review transition requires a complete, non-blank, FRESH audit tuple — a status-only flip fails',
      snapshotFreezeFn.includes('every review transition requires a complete, non-blank audit tuple') &&
      snapshotFreezeFn.includes('IF NEW.reviewed_by IS NOT DISTINCT FROM OLD.reviewed_by') &&
      snapshotFreezeFn.includes('AND NEW.reviewed_at IS NOT DISTINCT FROM OLD.reviewed_at') &&
      snapshotFreezeFn.includes('AND NEW.review_rationale IS NOT DISTINCT FROM OLD.review_rationale') &&
      snapshotFreezeFn.includes("the audit tuple must differ from the prior decision''s tuple"))
    check('R6: same-status audit rewriting still fails (Revision F guard retained verbatim)',
      snapshotFreezeFn.includes('review-audit fields may change only together with an allowed review_status transition'))
    check('R7: the evidence log is append-only, trigger-written, machine-mirrored, and closed',
      sql.includes('CREATE TABLE exercise_catalog_review_events') &&
      sqlFlat.includes("(from_status = 'pending' AND to_status IN ('approved','revised','rejected')) OR (from_status = 'approved' AND to_status IN ('revised','rejected'))") &&
      eventsGuardFn.includes("IF TG_OP IN ('UPDATE','DELETE') THEN") &&
      eventsGuardFn.includes('the review-evidence log is append-only') &&
      eventsGuardFn.includes('IF pg_trigger_depth() < 2 THEN') &&
      eventsGuardFn.includes('events are written only by the snapshot review transition trigger') &&
      sql.includes('BEFORE INSERT OR UPDATE OR DELETE ON exercise_catalog_review_events') &&
      (sql.match(/INSERT INTO public\.exercise_catalog_review_events/g) || []).length === 1 &&
      snapshotFreezeFn.includes('INSERT INTO public.exercise_catalog_review_events') &&
      sql.includes('REVOKE ALL ON exercise_catalog_review_events FROM PUBLIC, anon, authenticated') &&
      sql.includes('REFERENCES exercise_catalog(id) ON DELETE RESTRICT,\n  from_status'))
    check('R8: snapshot audit columns are documented as CURRENT-decision-only; full history lives in the events log',
      sqlFlat.includes('The snapshot row keeps only the CURRENT decision') &&
      sqlFlat.includes('the full history lives in exercise_catalog_review_events') &&
      sqlFlat.includes('any reviewed snapshot physically undeletable'))
    // REVISED (EXLIB-1B2 Revision G candidate gate): the live suite
    // now refuses to run against anything but the APPROVED Revision G
    // fingerprint, verified before initdb or any SQL execution.
    check('R9: the live two-session concurrency proofs exist, run on a DISPOSABLE LOCAL cluster, gate on the approved fingerprint, and never contact Supabase',
      (() => {
        const sh = read('scripts/verify-exlib1b2-live-concurrency.sh')
        return sh.includes('DISPOSABLE LOCAL PostgreSQL cluster') &&
          sh.includes('NEVER contacts Supabase') &&
          sh.includes(`APPROVED_SHA256="${M023_SHA}"`) &&
          // REVISED (EXLIB-1B2 Revision H): the gate pins the
          // Revision H byte count.
          sh.includes('APPROVED_BYTES=92806') &&
          sh.includes('Approved-fingerprint gate (before initdb or any SQL execution)') &&
          sh.indexOf('ACTUAL_SHA256=$(shasum -a 256 "$MIG"') < sh.indexOf('initdb -D') &&
          sh.includes('set -uo pipefail') &&
          sh.includes("listen_addresses=''") &&
          sh.includes('mktemp -d') &&
          sh.includes('trap cleanup EXIT') &&
          sh.includes('psql -h "$SOCK"') &&
          !/supabase\.co|ttybyljytiwntvorugcv|vercel\.app/i.test(sh) &&
          // Both interleavings asserted, with blocking measured.
          sh.includes("I1: approval BLOCKED on the anatomy session's lock") &&
          sh.includes("I2: late anatomy BLOCKED on the approval's lock") &&
          sh.includes('sealed once its snapshot leaves pending review') &&
          sh.includes('-ge 1500') &&
          // Applies the EXACT artifact, not a copy.
          sh.includes('MIG="supabase/migrations/023_exlib_catalog_and_delivery_contract.sql"') &&
          sh.includes('-f "$MIG"') &&
          // Excluded from the deterministic offline battery by type.
          !existsSync('scripts/verify-exlib1b2-live-concurrency.ts')
      })())
  }

  console.log('\nS. Revision H atomic-install wrapper (fail-closed proofs)')
  {
    // Top-level analysis: strip every dollar-quoted PL/pgSQL body so
    // function-internal BEGIN/END can never be miscounted as
    // transaction boundaries.
    const topLevel = sql.replace(/\$\$[\s\S]*?\$\$/g, '$BODY$')
    const lines = topLevel.split('\n')
    const isExecutable = (l: string) =>
      /^(CREATE|ALTER|INSERT|REVOKE|GRANT|DROP|UPDATE|DELETE|SELECT|COMMENT)\b/.test(l.trim()) &&
      !l.trim().startsWith('--')
    const beginIdx = lines.findIndex((l) => l === 'BEGIN;')
    const commitIdx = lines.findIndex((l) => l === 'COMMIT;')
    check('S1: the top-level transaction wrapper exists — exactly one BEGIN; and one COMMIT;',
      (topLevel.match(/^BEGIN;$/gm) || []).length === 1 &&
      (topLevel.match(/^COMMIT;$/gm) || []).length === 1 &&
      beginIdx > -1 && commitIdx > beginIdx)
    check('S2: the wrapper encloses EVERY executable migration statement',
      lines.every((l, i) => !isExecutable(l) || (i > beginIdx && i < commitIdx)))
    check('S3: BEGIN precedes the first DDL/DML/REVOKE/GRANT — only comments and blanks before it',
      lines.slice(0, beginIdx)
        .every((l) => l.trim() === '' || l.trim().startsWith('--')) &&
      lines.findIndex(isExecutable) > beginIdx)
    check('S4: COMMIT follows the final executable statement — only comments and blanks after it',
      lines.slice(commitIdx + 1)
        .every((l) => l.trim() === '' || l.trim().startsWith('--')))
    check('S5: no top-level ROLLBACK, SAVEPOINT, or additional transaction boundary exists',
      !/ROLLBACK/.test(topLevel) &&
      !/SAVEPOINT/.test(topLevel) &&
      !/START TRANSACTION/.test(topLevel) &&
      !/^BEGIN\s*;?\s*$/m.test(topLevel.split('\n').filter((l, i) => i !== beginIdx).join('\n')))
    check('S6: PL/pgSQL BEGIN/END blocks are NOT miscounted — the raw file has many, the stripped top level exactly one',
      (sql.match(/^BEGIN$/gm) || []).length >= 10 &&
      !topLevel.includes('RAISE EXCEPTION') &&
      (topLevel.match(/\$BODY\$/g) || []).length >= 16 &&
      (topLevel.match(/^BEGIN;$/gm) || []).length === 1)
    check('S7: Revision G is marked superseded (NOT rejected) and Revision H is the only current draft fingerprint',
      sqlFlat.includes('superseded SOLELY by the Revision H atomic-install transaction wrapper') &&
      notesFlat.includes(`Revision G (\`${REV_G_SHA}\`): SUPERSEDED — DO NOT APPLY`) &&
      notesFlat.includes('NOT rejected: its architecture passed review') &&
      notesFlat.includes(`\`${M023_SHA}\``) &&
      notesFlat.includes('## Migration 023 — REVISION H — DRAFT — NOT APPLIED'))
  }

  console.log('\nK. Phase boundary')
  {
    check('K1: review ledger untouched — 48 records, all pending, null reviewer fields',
      (() => {
        const led = read('docs/exlib1b1-review-ledger.jsonl')
          .split('\n').filter((l) => l && !l.startsWith('#')).map((l) => JSON.parse(l))
        return led.length === 48 && led.every((l) =>
          l.status === 'pending' && l.reviewer === null && l.reviewed_at === null)
      })())
    check('K2: EXLIB-1A manifest byte-identical (zero classification changes)',
      createHash('sha256').update(read('docs/exlib1a-discovery-manifest.jsonl')).digest('hex') ===
        '336cd4253f747cdb3ba73ffa2af5a63e255c7c87cc452d4c43ed59a654673dfa')
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
