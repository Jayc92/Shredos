// ============================================================
// ForgeFitOS — EXLIB-1B3A post-application hardening AUDIT harness.
// Proves the audit is grounded in the exact applied Revision H
// bytes, reaches one evidence-backed disposition per index
// candidate with zero blanket reasoning, classifies every advisor
// finding, authored NO migration 024 and NO executable SQL, and
// changed nothing outside the two declared audit artifacts.
// Run from the repository root:
//   npx tsx scripts/verify-exlib1b3.ts
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

const APPLIED_SHA = '0991448c39a558385431c78cef6d6063df208312a3f53866756ba730066c42f2'
const M024 = 'supabase/migrations/024_exlib_post_application_hardening.sql'
const M024_SHA = '190550ecdb99df702ab03d1b07592f861070141e5091eb25bc5bf45f211cc980'
const HISTORY_ENTRY = '20260824135804_exlib_catalog_and_delivery_contract_revision_h'
const MIG = 'supabase/migrations/023_exlib_catalog_and_delivery_contract.sql'
const sqlBytes = readFileSync(MIG)
const sql = sqlBytes.toString('utf8')
const audit = read('docs/exlib1b3-post-application-hardening-audit.md')
const auditFlat = audit.replace(/\s+/g, ' ')
const notes = read('docs/exlib1b1-architecture-and-review-notes.md')
const notesFlat = notes.replace(/\s+/g, ' ')

const fnSlice = (name: string) => {
  const i = sql.indexOf('CREATE OR REPLACE FUNCTION ' + name)
  return sql.slice(i, sql.indexOf('$$;', i) + 3)
}
const claimsFn = fnSlice('exlib_verify_catalog_claims')
const lifecycleFn = fnSlice('exlib_verify_alias_lifecycle')

async function main() {
  console.log('\nA. Applied-state grounding')
  {
    check('A1: the audited artifact is EXACTLY the applied Revision H migration (bytes + SHA-256)',
      sqlBytes.length === 92806 &&
      createHash('sha256').update(sqlBytes).digest('hex') === APPLIED_SHA &&
      audit.includes(APPLIED_SHA) && audit.includes('92,806 bytes'))
    check('A2: the applied-state history anchor is recorded in the audit AND the promoted application record',
      audit.includes(HISTORY_ENTRY) && notes.includes(HISTORY_ENTRY) &&
      notesFlat.includes('applied to ShredOS are now exactly 001-023') &&
      audit.includes('exactly 001-023'))
    // RETARGET (EXLIB-1B3B migration 024 draft): the approved-scope
    // draft now exists; the boundary moves from exactly-23 to
    // exactly-24 with the 024 filename pinned. The audit's section-1
    // sentence remains as the historical audit-time starting state.
    check('A3: inventory is exactly 001-024 — one 023, one pinned 024 draft',
      (() => {
        const files = readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql'))
        return files.length === 24 &&
          files.filter((f) => f.startsWith('023')).length === 1 &&
          files.filter((f) => f === '024_exlib_post_application_hardening.sql').length === 1 &&
          audit.includes('No migration 024 exists')
      })())
    // RETARGET (EXLIB-1B3B migration 024 draft): the notes now
    // describe the drafted six-operation inventory, so the rule is
    // pinned at full strength as NO EXECUTABLE SQL — no sql fences
    // and no statement-shaped lines — while inline statement-TYPE
    // mentions (e.g. in the inventory) are the reviewer-required
    // documentation.
    check('A4: the notes contain no executable SQL — no fences, no statement-shaped lines — and pin the draft status',
      !/```/.test(audit) &&
      !/^\s*(CREATE|ALTER|INSERT|UPDATE|DELETE|DROP|GRANT|REVOKE|TRUNCATE)\s/m.test(audit) &&
      audit.includes('MIGRATION 024: DRAFT — NOT APPLIED — NOT APPROVED') &&
      audit.includes('MIGRATION 024 IS A DRAFT — NOT APPLIED — NOT APPROVED'))
    check('A5: current-guidance sources recorded with URLs and the retrieval date, separated from repo conclusions',
      audit.includes('retrieved 2026-08-24') &&
      ['lint=0011_function_search_path_mutable', 'lint=0001_unindexed_foreign_keys',
        'lint=0008_rls_enabled_no_policy', 'supabase.com/docs/guides/database/functions',
        'postgresql.org/docs/current/ddl-constraints.html', 'supabase.com/changelog']
        .every((u) => audit.includes(u)) &&
      auditFlat.includes('kept separate from repo-specific conclusions'))
  }

  console.log('\nB. Two-function search_path audit (mechanical)')
  {
    check('B1: both functions are SECURITY INVOKER with NO pinned search_path — exactly what lint 0011 flags',
      [claimsFn, lifecycleFn].every((f) =>
        !f.includes('SECURITY DEFINER') && !f.includes('SET search_path') &&
        f.includes('LANGUAGE sql') && f.includes('STABLE')))
    check('B2: every table reference in both bodies is schema-qualified (public.*)',
      ['public.exercise_catalog_name_claims', 'public.exercise_catalog_aliases',
        'public.exercise_catalog'].every((t) => claimsFn.includes(t)) &&
      ['public.exercise_aliases', 'public.exercises'].every((t) => lifecycleFn.includes(t)) &&
      !/(?:FROM|JOIN)\s+(?!public\.|bearers)[a-z_]+/.test(claimsFn.replace(/--[^\n]*/g, '')) &&
      !/(?:FROM|JOIN)\s+(?!public\.)[a-z_]+/.test(lifecycleFn.replace(/--[^\n]*/g, '')))
    check('B3: both are REVOKEd from PUBLIC/anon/authenticated with NO EXECUTE grant — unreachable by clients',
      ['exlib_verify_catalog_claims', 'exlib_verify_alias_lifecycle'].every((f) =>
        sql.includes(`REVOKE ALL ON FUNCTION ${f}() FROM PUBLIC, anon, authenticated`) &&
        !sql.includes(`GRANT EXECUTE ON FUNCTION ${f}`)))
    check('B4: neither accepts caller-controlled identity',
      claimsFn.includes('exlib_verify_catalog_claims()') &&
      lifecycleFn.includes('exlib_verify_alias_lifecycle()') &&
      [claimsFn, lifecycleFn].every((f) => !/p_user|p_uid|auth\.uid/.test(f)))
    check('B5: the audit reaches an explicit evidence-backed conclusion for EACH function — not advisor-reflex',
      (audit.match(/DEFENSE-IN-DEPTH, not necessary/g) || []).length === 2 &&
      auditFlat.includes('Behavior change from adding a pinned `search_path`: NONE') &&
      auditFlat.includes('Do not assume') === false &&
      auditFlat.includes('applies to ALL functions regardless of SECURITY INVOKER/DEFINER'))
    // REVISED (EXLIB-1B3A review correction): the form is RESOLVED to
    // the empty string; this check FAILS if the audit leaves the
    // choice open or recommends the house pattern for these two.
    check('B6: the search_path form is RESOLVED to the empty string; the house pattern is recorded as considered-and-REJECTED',
      auditFlat.includes("Chosen form: `SET search_path = ''`") &&
      auditFlat.includes('was considered and REJECTED for these two functions') &&
      auditFlat.includes('This choice is final for the 024 draft; it is not presented as an open alternative') &&
      !auditFlat.includes('for ChatGPT to choose') &&
      !auditFlat.includes('recommendation is the house form') &&
      !auditFlat.includes('docs-preferred alternative'))
  }

  console.log('\nC. Complete FK/index audit')
  {
    check('C1: the migration declares exactly 15 REFERENCES and the audit says so',
      (sql.match(/REFERENCES /g) || []).length === 15 &&
      auditFlat.includes('exactly 15 foreign-key references') &&
      auditFlat.includes('mechanically: 15 `REFERENCES` occurrences'))
    const rows = audit.split('\n').filter((l) => /^\| \d+ \|/.test(l))
    const DISPOSITIONS = ['REQUIRED IN 024', 'JUSTIFIED BUT DEFER UNTIL MEASURED', 'NOT JUSTIFIED']
    check('C2: the matrix covers all 15 FKs plus the not-an-FK claims assessment (16 rows)',
      rows.length === 16 &&
      [...Array(16)].every((_, i) => rows.some((r) => r.startsWith(`| ${i + 1} |`))))
    check('C3: every row carries EXACTLY ONE disposition',
      rows.every((r) =>
        DISPOSITIONS.filter((d) => r.includes(d)).length === 1 ||
        // 'JUSTIFIED BUT DEFER...' contains no other token; guard the
        // substring overlap of NOT JUSTIFIED inside none.
        (r.includes('JUSTIFIED BUT DEFER UNTIL MEASURED') && !r.includes('NOT JUSTIFIED') && !r.includes('REQUIRED IN 024'))))
    check('C4: every row carries concrete evidence (non-trivial final cell)',
      rows.every((r) => {
        const cells = r.split('|').map((c) => c.trim()).filter(Boolean)
        return cells[cells.length - 1].length >= 25
      }))
    // REVISED (EXLIB-1B3A review correction): parent-delete lifecycle
    // traces reclassified rows 6, 7, 11, 13 as REQUIRED and left one
    // DEFER (row 15) with an exact measurement plan.
    check('C5: totals reconcile — 4 required, 1 deferred with an exact measurement plan, 11 not justified',
      rows.filter((r) => r.includes('REQUIRED IN 024')).length === 4 &&
      rows.filter((r) => r.includes('JUSTIFIED BUT DEFER UNTIL MEASURED')).length === 1 &&
      rows.filter((r) => r.includes('NOT JUSTIFIED')).length === 11 &&
      auditFlat.includes('REQUIRED IN 024 = 4') &&
      auditFlat.includes('DEFER UNTIL MEASURED = 1') &&
      auditFlat.includes('NOT JUSTIFIED = 11') &&
      ['| 6 |', '| 7 |', '| 11 |', '| 13 |'].every((n) =>
        rows.some((r) => r.startsWith(n) && r.includes('REQUIRED IN 024'))))
    check('C6: all eight instruction-mandated candidates are individually assessed',
      ['exercise_aliases.catalog_alias_id', 'exercise_aliases.import_run_id',
        'exercise_name_claims.alias_id', 'exercises.catalog_id',
        'exercises.catalog_logical_id', 'exercises.import_run_id',
        'exercise_catalog_run_items.catalog_id', 'exercise_catalog_run_items.catalog_alias_id']
        .every((c) => rows.some((r) => r.replace(/\s+/g, '').includes(c.replace(/\./g, '.')))
          || audit.includes(c)))
    check('C7: leading-column and partial-predicate rules are stated and applied — trailing appearances never count as coverage',
      auditFlat.includes('trailing appearances do not count') &&
      auditFlat.includes('if the FK column is not leading, use means scanning that entire partial index'))
    check('C8: ZERO blanket reasoning — the audit explicitly rejects index-every-FK, advisor-notice-driven, and emptiness-based reasoning',
      auditFlat.includes('No disposition relies on "index every foreign key" reasoning') &&
      auditFlat.includes('no index is proposed merely to clear the INFO-level advisor notice') &&
      auditFlat.includes('none cites current emptiness') &&
      auditFlat.includes('"Currently empty/small" is never used as a reason'))
    // NEW (EXLIB-1B3A review correction): the growth model, the
    // parent-delete traces, and the DEFER measurement plan are
    // load-bearing evidence and fail closed.
    check('C9: run-membership growth model corrected — cumulative, append-only, unbounded; "permanently tiny" withdrawn',
      auditFlat.includes('one row is added per EXERCISE member per run') &&
      auditFlat.includes('one row per ALIAS member per run') &&
      auditFlat.includes('deletable ONLY while the run is unsealed') &&
      auditFlat.includes('membership is PERMANENT') &&
      auditFlat.includes('durable audit history') &&
      auditFlat.includes('potentially cumulative and unbounded') &&
      auditFlat.includes('schema enforces NO bound') &&
      !auditFlat.includes('permanently tiny'))
    check('C10: every parent-delete path is traced with its lifecycle determination and lock consequence',
      auditFlat.includes('EXPLICITLY SUPPORTED by the applied contract') &&
      auditFlat.includes('delete-while-unreferenced plus insert') &&
      auditFlat.includes('Determining "unreferenced" IS the RESTRICT check') &&
      auditFlat.includes('ALLOWED and documented by the applied contract for never-reviewed pending rows only') &&
      auditFlat.includes('FULL HEAP SCAN of the largest tenant table') &&
      auditFlat.includes('NOT a supported lifecycle operation') &&
      auditFlat.includes('STRUCTURALLY UNDELETABLE') &&
      auditFlat.includes('extends the parent-row lock') &&
      auditFlat.includes('unbounded lock-duration growth with adoption'))
    check('C11: the single DEFER carries a complete measurement plan — exact SQL, representative rows, method, threshold, lock concern, roadmap point',
      auditFlat.includes('EXPLAIN (ANALYZE, BUFFERS)') &&
      auditFlat.includes('100k-1M total exercises rows') &&
      auditFlat.includes('under 50 ms') &&
      auditFlat.includes('a sequential scan plan is an automatic trip') &&
      auditFlat.includes('per-user advisory lock and FOR UPDATE row locks') &&
      auditFlat.includes('EXLIB-1C pre-launch QA') &&
      auditFlat.includes('never Supabase'))
  }

  console.log('\nD. Advisor classification')
  {
    check('D1: zero-policy RLS classified INTENTIONAL fail-closed; rejection-policy suggestion explicitly rejected with reasons',
      auditFlat.includes('INTENTIONAL fail-closed design') &&
      auditFlat.includes('NO code change warranted') &&
      auditFlat.includes('REVOKE ALL already denies at the grant layer before RLS is even consulted'))
    check('D2: the two callable functions re-audited and classified INTENTIONAL (DEFINER discipline, auth.uid scope, exact grants, confined RLS bypass)',
      auditFlat.includes('Exposure remains intentional; NO change warranted') &&
      auditFlat.includes('identity derives solely from `auth.uid()`') &&
      auditFlat.includes('exactly two EXECUTE grants to authenticated') &&
      (sql.match(/GRANT EXECUTE/g) || []).length === 2)
    check('D3: unrelated pre-existing advisor findings excluded without fabricated enumeration',
      auditFlat.includes('EXCLUDED from EXLIB-1B3 by instruction') &&
      auditFlat.includes('excluded wholesale, by category of exclusion rather than by fabricated listing'))
  }

  console.log('\nE. Recommended 024 scope + boundaries')
  {
    // REVISED (EXLIB-1B3A review correction): the scope now includes
    // the four REQUIRED partial leading indexes.
    check('E1: the recommended migration 024 scope is EXACTLY the two empty-string search_path pins plus the four required partial leading indexes',
      auditFlat.includes("using EXACTLY `SET search_path = ''`") &&
      auditFlat.includes('Add FOUR partial leading indexes') &&
      auditFlat.includes('NOTHING ELSE. Zero policy changes. Zero grant changes.') &&
      auditFlat.includes('prose only — NO SQL AUTHORED') &&
      auditFlat.includes('Remaining unresolved decision:** none'))
    check('E2: a rollback and verification plan for the future 024 is recorded (fingerprint protocol, proconfig check, live suite, boundary retarget)',
      auditFlat.includes('single top-level transaction') &&
      auditFlat.includes('pg_proc.proconfig') &&
      auditFlat.includes('exactly-23 to exactly-24, pinned filename'))
    check('E3: EXLIB-1C and ledger boundaries are explicit',
      auditFlat.includes('EXLIB-1C (catalog data loading) remains blocked pending explicit legal and product approval') &&
      auditFlat.includes('MUST NOT be approved, edited, or fabricated'))
    check('E4: all 48 ledger records remain pending with null reviewer fields',
      (() => {
        const led = read('docs/exlib1b1-review-ledger.jsonl')
          .split('\n').filter((l) => l && !l.startsWith('#')).map((l) => JSON.parse(l))
        return led.length === 48 && led.every((l) =>
          l.status === 'pending' && l.reviewer === null && l.reviewed_at === null)
      })())
    check('E5: ZERO product/schema/API/dependency changes this turn (git)',
      (() => {
        try {
          return execSync(
            'git diff --name-only -- src/ supabase/ package.json package-lock.json next.config.mjs tailwind.config.ts tsconfig.json',
            { encoding: 'utf8' }).trim() === ''
        } catch { return false }
      })())
    // ADMISSION (EXLIB-1B3B migration 024 draft): the 024 draft and
    // its live verification script join the declared inventory.
    check('E6: the worktree contains ONLY the declared audit artifacts and their labeled admissions',
      (() => {
        let out = ''
        try { out = execSync('git status --porcelain', { encoding: 'utf8' }) } catch { return false }
        return out.split('\n').filter(Boolean).every((line) => {
          const f = line.slice(3).trim()
          return f === 'docs/exlib1b3-post-application-hardening-audit.md' ||
            f === 'supabase/migrations/024_exlib_post_application_hardening.sql' ||
            // ADMISSION (EXLIB-1C0): the approval-packet and
            // review-proposal artifacts are admitted while
            // uncommitted.
            f.startsWith('docs/exlib1c0-') ||
            // ADMISSION (EXLIB-1C0A): the private-use decision and
            // equipment-resolution overlay artifacts are admitted
            // while uncommitted.
            f.startsWith('docs/exlib1c0a-') ||
            // ADMISSION (EXLIB-1C0B): the displacement-audit
            // artifacts are admitted while uncommitted.
            f.startsWith('docs/exlib1c0b-') ||
            // ADMISSION (EXLIB-1B3B migration 024 draft): the phase's
            // mechanical migration-boundary retargets and worktree
            // admissions touch committed harnesses across the
            // battery; every such change is labeled in place, and
            // nothing outside docs/exlib1b3-*, the 024 draft, and
            // scripts/verify-* may appear.
            f.startsWith('scripts/verify-')
        })
      })())
  }

  console.log('\nF. Migration 024 draft (EXLIB-1B3B, deterministic)')
  {
    const m024Bytes = readFileSync(M024)
    const m024 = m024Bytes.toString('utf8')
    // Executable view: 024 has no dollar-quoted bodies, so stripping
    // full-line comments yields exactly the statement text.
    const exec = m024.split('\n')
      .filter((l) => l.trim() && !l.trim().startsWith('--')).join('\n')
    check('F1: the notes fingerprint equals the file — bytes and SHA-256',
      m024Bytes.length === 3726 &&
      createHash('sha256').update(m024Bytes).digest('hex') === M024_SHA &&
      audit.includes(M024_SHA) && audit.includes('3,726 bytes') &&
      m024.includes('STATUS: DRAFT — NOT APPLIED') &&
      m024.includes(APPLIED_SHA) && m024.includes(HISTORY_ENTRY) &&
      m024.includes('CONTAINS NO CONTENT DATA'))
    check('F2: exactly one top-level BEGIN; and one COMMIT; enclosing EVERY executable statement',
      (exec.match(/^BEGIN;$/gm) || []).length === 1 &&
      (exec.match(/^COMMIT;$/gm) || []).length === 1 &&
      exec.startsWith('BEGIN;') && exec.endsWith('COMMIT;'))
    check('F3: exactly two ALTER FUNCTION statements — exact names, niladic signatures, each pinning the empty-string search_path',
      (exec.match(/ALTER FUNCTION/g) || []).length === 2 &&
      exec.includes("ALTER FUNCTION public.exlib_verify_catalog_claims() SET search_path = '';") &&
      exec.includes("ALTER FUNCTION public.exlib_verify_alias_lifecycle() SET search_path = '';"))
    check('F4: zero function replacements and zero function bodies in 024',
      !m024.includes('CREATE OR REPLACE') &&
      !m024.includes('$$') &&
      !/LANGUAGE (sql|plpgsql)/.test(m024))
    check('F5: exactly four CREATE INDEX statements with the exact names, tables, columns, and predicates',
      (exec.match(/CREATE INDEX/g) || []).length === 4 &&
      /CREATE INDEX exercises_catalog_id_idx\n  ON public\.exercises \(catalog_id\)\n  WHERE catalog_id IS NOT NULL;/.test(exec) &&
      /CREATE INDEX exercise_aliases_catalog_alias_id_idx\n  ON public\.exercise_aliases \(catalog_alias_id\)\n  WHERE catalog_alias_id IS NOT NULL;/.test(exec) &&
      /CREATE INDEX exercise_catalog_run_items_catalog_id_idx\n  ON public\.exercise_catalog_run_items \(catalog_id\)\n  WHERE catalog_id IS NOT NULL;/.test(exec) &&
      /CREATE INDEX exercise_catalog_run_items_catalog_alias_id_idx\n  ON public\.exercise_catalog_run_items \(catalog_alias_id\)\n  WHERE catalog_alias_id IS NOT NULL;/.test(exec))
    check('F6: all four are non-unique, non-concurrent, and fail-closed (no UNIQUE, no CONCURRENTLY, no IF NOT EXISTS)',
      !exec.includes('UNIQUE') &&
      !/CONCURRENTLY/i.test(exec) &&
      !/IF NOT EXISTS/i.test(exec))
    check('F7: NO other DDL/DML/security statement of any kind — exactly eight statements',
      (exec.match(/;/g) || []).length === 8 &&
      !/INSERT |UPDATE |DELETE |TRUNCATE|DROP |GRANT |REVOKE |CREATE TABLE|CREATE TRIGGER|CREATE POLICY|CREATE FUNCTION|ALTER TABLE|CREATE ROLE|SECURITY DEFINER/.test(exec))
    check('F8: the four index names are absent from every migration 001-023 (collision-proof)',
      readdirSync('supabase/migrations')
        .filter((f) => f.endsWith('.sql') && !f.startsWith('024'))
        .every((f) => {
          const t = read('supabase/migrations/' + f)
          return ['exercises_catalog_id_idx', 'exercise_aliases_catalog_alias_id_idx',
            'exercise_catalog_run_items_catalog_id_idx',
            'exercise_catalog_run_items_catalog_alias_id_idx']
            .every((n) => !t.includes(n))
        }))
    check('F9: the notes carry the six-operation inventory, the ALTER-over-replacement rationale, the zero-change list, and the rollback contract',
      auditFlat.includes('Exact six-operation inventory') &&
      auditFlat.includes('Why ALTER FUNCTION rather than function replacement') &&
      auditFlat.includes('changes ONLY `proconfig` by construction') &&
      auditFlat.includes('Explicit zero-change list') &&
      auditFlat.includes('drop exactly the four indexes named above') &&
      auditFlat.includes('only after ChatGPT approves this exact fingerprint') &&
      auditFlat.includes('This section grants NO EXLIB-1C authorization'))
    check('F10: the live 024 suite exists, is separate from the approved 023 concurrency script, and gates on BOTH fingerprints before initdb',
      (() => {
        const sh = read('scripts/verify-exlib1b3-live.sh')
        const old023 = read('scripts/verify-exlib1b2-live-concurrency.sh')
        return sh.includes('set -euo pipefail') &&
          sh.includes(`SHA023="${APPLIED_SHA}"`) &&
          sh.includes(`SHA024="${M024_SHA}"`) &&
          sh.indexOf('shasum -a 256') < sh.indexOf('initdb -D') &&
          sh.includes('contacts Supabase, Vercel, or any remote service') &&
          sh.includes('EXPECTED_CFG') &&
          sh.includes('pg_get_function_identity_arguments') &&
          sh.includes('indisunique') &&
          sh.includes('enable_seqscan = off') &&
          sh.includes('CREATE DATABASE t2') &&
          !/supabase\.co|ttybyljytiwntvorugcv|vercel\.app/i.test(sh) &&
          old023.includes('APPROVED_SHA256="0991448c39a558385431c78cef6d6063df208312a3f53866756ba730066c42f2"')
      })())
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
