// EXLIB-2F APPLICATION-RECORD verifier — hosted migration 026 was
// applied by the authorized operator path (ChatGPT; never Claude).
//
// Proves LOCALLY, with no hosted contact: the application facts are
// pinned verbatim (hosted history entry, UTC/Eastern timing, ShredOS
// ref, applied-by attribution); the applied artifact is byte-frozen
// (candidate, reviewed proposal, apply-prep record); every structural
// fact in the operator-confirmed proof is cross-checked mechanically
// against the applied candidate's SQL (5 columns, 4 constraints, 2
// indexes, three RESTRICT FKs, RLS + zero policies + no client DML,
// helper posture, authenticated-only delivery/rollback via preserved
// 023 ACLs); the operator-attributed data facts are recorded WITH
// attribution (exercises 84; catalog/run/item/correction counts
// zero); the product boundary holds; the C2 retarget is labeled and
// anchored; and the phase inventory is exact.
//
// Fail-closed: any mismatch fails the suite.
import { execSync } from 'child_process'
import { createHash } from 'crypto'
import { existsSync, readFileSync } from 'fs'

let passed = 0
let failed = 0
const check = (name: string, ok: boolean, detail?: string): void => {
  if (ok) { passed += 1; console.log(`  PASS  ${name}`) }
  else { failed += 1; console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`) }
}
const read = (p: string): string => readFileSync(p, 'utf8')
const sha256 = (p: string): string => createHash('sha256').update(readFileSync(p)).digest('hex')
const parseJsonl = (p: string): any[] => read(p).split('\n')
  .filter((l) => l.trim() && !l.trim().startsWith('#')).map((l) => JSON.parse(l))
// RETARGET (EXLIB-2N review-decision application): the Dead bug
// (batch02 line 12) and Ab wheel rollout (batch04 line 5) records
// were pending through the promoted EXLIB-2N tip; the approved human
// decisions are applied to exactly those two records after it. This
// suite's byte-frozen claims for those two files are anchored to that
// exact promoted tip, where they were true; every other file remains
// a live claim.
const TIP_2N_RETARGET = 'c9c1afd7df35f2870430da3a8d1295ff7e48e11d'
const readAt2N = (p: string): Buffer =>
  execSync(`git cat-file blob ${TIP_2N_RETARGET}:${p}`, { maxBuffer: 1 << 26 })
const parseJsonlAt2N = (p: string): any[] => readAt2N(p).toString('utf8').split('\n')
  .filter((l) => l.trim() && !l.trim().startsWith('#')).map((l) => JSON.parse(l))

const RECORD = 'docs/exlib2f-migration-026-application-record.md'
const VERIFIER = 'scripts/verify-exlib2f-application.ts'
const CANDIDATE = 'supabase/migrations/026_exlib_plank_seed_reconciliation.sql'
const APPLY_PREP_TIP = 'bc8a5e20343aa1f83832627f78891632ee61f897'
const HISTORY_ENTRY = '20260901032229_exlib_plank_seed_reconciliation_026'
const PHASE_NEW = [RECORD, VERIFIER].sort()
const PHASE_ALL = [...PHASE_NEW, 'scripts/verify-exlib2f.ts'].sort()

const rec = read(RECORD)
const recFlat = rec.replace(/\s+/g, ' ')
const cand = read(CANDIDATE)
const m023 = read('supabase/migrations/023_exlib_catalog_and_delivery_contract.sql')

async function main(): Promise<void> {
  console.log('EXLIB-2F application-record verification (hosted 026 applied by the authorized path)')

  console.log('\nA. Application facts and frozen artifacts')
  {
    check('A1: applied artifact and sources byte-frozen — the candidate (33,294 B), the reviewed proposal (32,500 B), and the apply-prep record hold their exact promoted fingerprints, and the apply-prep tip with its tag are intact ancestors',
      (() => {
        try {
          execSync(`git merge-base --is-ancestor ${APPLY_PREP_TIP} HEAD`, { stdio: 'pipe' })
          if (execSync('git rev-parse exlib2f-migration-026-apply-prep-reviewed-not-applied^{}',
            { encoding: 'utf8' }).trim() !== APPLY_PREP_TIP) return false
        } catch { return false }
        return readFileSync(CANDIDATE).length === 33294 &&
          sha256(CANDIDATE) === '620185b62c589c55fb30a237589589f46002a9d6c391b9ab936e07a6641cf4bc' &&
          readFileSync('docs/exlib2e-migration-026-proposal.sql').length === 32500 &&
          sha256('docs/exlib2e-migration-026-proposal.sql') === 'a6696066d178ced7e53bf81e7106cce64a87e2c73d9b342464d930a2fe3c2108' &&
          sha256('docs/exlib2f-migration-026-apply-prep-record.md') === '85edab700af9d273a5f5c7b3153ec779145ca2da8bf35857cb0ba84de84a54dc'
      })())
    check('A2: application facts pinned verbatim — hosted history entry, applied-by-ChatGPT (never Claude), ShredOS ref, both timestamps (2026-09-01 03:22:29 UTC = 2026-08-31 23:22:29 Eastern), and the candidate/proposal fingerprints inside the record',
      rec.includes(HISTORY_ENTRY) &&
      recFlat.includes('Applied by: ChatGPT') &&
      recFlat.includes('never by Claude') &&
      recFlat.includes('ttybyljytiwntvorugcv ONLY') &&
      recFlat.includes('2026-09-01 03:22:29 UTC = 2026-08-31 23:22:29 Eastern') &&
      recFlat.includes('August 31 Eastern / September 1 UTC') &&
      rec.includes('620185b62c589c55fb30a237589589f46002a9d6c391b9ab936e07a6641cf4bc') &&
      rec.includes('a6696066d178ced7e53bf81e7106cce64a87e2c73d9b342464d930a2fe3c2108') &&
      recFlat.includes('any byte change would void the reviewed/applied status') &&
      recFlat.includes('Claude made no hosted contact in this phase and never applies migrations'))
    check('A3: structural proof cross-checked against the applied SQL — exactly 5 table columns, 4 constraints (tenant PK + three FKs), 2 indexes (PK + run_idx), all three FKs ON DELETE RESTRICT, RLS enabled, zero policies, REVOKE ALL from client roles; and the record claims exactly these numbers',
      (() => {
        const tStart = cand.indexOf('CREATE TABLE exercise_catalog_corrections (')
        const tEnd = cand.indexOf(');', tStart)
        const table = cand.slice(tStart, tEnd)
        const cols = ['user_id', 'exercise_id', 'import_run_id', 'catalog_logical_id', 'corrected_at']
          .filter((c) => new RegExp(`\\n  ${c}\\s`).test(table))
        if (cols.length !== 5) return false
        const restrictFks = (table.match(/ON DELETE RESTRICT/g) ?? []).length
        if (restrictFks !== 3) return false
        const pk = (table.match(/PRIMARY KEY \(user_id, exercise_id\)/g) ?? []).length
        if (pk !== 1) return false // 1 PK + 3 FKs = 4 constraints
        const idx = (cand.match(/CREATE INDEX exercise_catalog_corrections_run_idx/g) ?? []).length
        if (idx !== 1) return false // + the implicit PK index = 2 indexes
        if (!cand.includes('ALTER TABLE exercise_catalog_corrections ENABLE ROW LEVEL SECURITY;')) return false
        if (/CREATE POLICY[\s\S]{0,120}exercise_catalog_corrections/.test(cand)) return false
        if (!cand.includes('REVOKE ALL ON TABLE exercise_catalog_corrections\n  FROM PUBLIC, anon, authenticated;')) return false
        return recFlat.includes('exactly 5 columns') && recFlat.includes('4 constraints') &&
          recFlat.includes('2 indexes') && recFlat.includes('ON DELETE RESTRICT') &&
          recFlat.includes('ZERO policies') && recFlat.includes('NO DML privileges')
      })())
    check('A4: function posture cross-checked — helper VOLATILE/SECURITY DEFINER/fixed-search_path with client EXECUTE revoked; the candidate issues NO grant or revoke on delivery/rollback while migration 023 grants them to authenticated (ACLs preserved => authenticated-only execution), exactly as the record claims',
      (() => {
        const hStart = cand.indexOf('CREATE OR REPLACE FUNCTION exlib_plank_link_valid')
        const helper = cand.slice(hStart, cand.indexOf('$helper$;', hStart) + '$helper$;'.length)
        if (!(helper.includes('\nVOLATILE\n') && !helper.includes('\nSTABLE\n') &&
          helper.includes('SECURITY DEFINER') && helper.includes('SET search_path = public, pg_temp'))) return false
        if (!cand.includes('REVOKE ALL ON FUNCTION exlib_plank_link_valid(UUID, public.exercises, UUID, UUID, TEXT, UUID)\n  FROM PUBLIC, anon, authenticated;')) return false
        if (/GRANT[\s\S]{0,120}(deliver_catalog_exercises|rollback_catalog_delivery)/.test(cand)) return false
        if (/REVOKE[\s\S]{0,120}(deliver_catalog_exercises|rollback_catalog_delivery)/.test(cand)) return false
        if (!/GRANT EXECUTE ON FUNCTION deliver_catalog_exercises\(TEXT\) TO authenticated/.test(m023)) return false
        if (!/GRANT EXECUTE ON FUNCTION rollback_catalog_delivery\(TEXT\) TO authenticated/.test(m023)) return false
        return recFlat.includes('retain authenticated-only execution') &&
          recFlat.includes('CREATE OR REPLACE preserved the migration-023 ACLs')
      })())
    check('A5: operator-attributed data facts recorded WITH attribution — exercises remain 84; catalog, import-run, run-item, and correction counts remain zero; the record attributes these to the operator-provided hosted proof and states the migration mutated no data',
      recFlat.includes('operator-provided proof') &&
      recFlat.includes('recorded on operator authority') &&
      recFlat.includes('exercises count remains 84') &&
      recFlat.includes('counts all remain ZERO') &&
      recFlat.includes('no delivery, no correction, and no data mutation'))
    check('A6: ADMISSION (Codex evidence-precision) — the record distinguishes the REPOSITORY migration sequence (001-026 effective on hosted) from Supabase\'s hosted migration-history TABLE, pins exactly the five hosted history entries verbatim, and identifies 20260826203154_exlib_equipment_vocabulary_support as the hosted entry corresponding to repository migration 025',
      (() => {
        const ENTRIES = [
          '20260813034632_phase5b2_nutrition_day_status',
          '20260824135804_exlib_catalog_and_delivery_contract_revision_h',
          '20260824174252_exlib_post_application_hardening',
          '20260826203154_exlib_equipment_vocabulary_support',
          '20260901032229_exlib_plank_seed_reconciliation_026']
        if (!ENTRIES.every((e) => rec.includes(e))) return false
        // exactly five: no other 2026xxxxxxxxxx_ history-entry token appears
        const tokens = Array.from(new Set(Array.from(rec.matchAll(/20\d{12}_[a-z0-9_]+/g)).map((m) => m[0])))
        if (tokens.length !== 5 || !tokens.every((t) => ENTRIES.includes(t))) return false
        return recFlat.includes('REPOSITORY schema/migration sequence effective on hosted ShredOS is now 001-026') &&
          recFlat.includes('hosted migration-history TABLE is a different object') &&
          recFlat.includes('contains exactly these five entries, verbatim') &&
          recFlat.includes('20260826203154_exlib_equipment_vocabulary_support is the hosted entry corresponding to repository migration 025')
      })())
  }

  console.log('\nB. Boundaries and lifecycle')
  {
    check('B1: product boundary unchanged — seed byte-identical to the apply-prep tip, migrations exactly 26 with the one 026, ledger 48/48 pending-null, 26/26 legacy candidates ineligible, 126/126 authored records pending/ineligible/unpublished, zero weight_time, no importer; and the record restates every gated follow-up',
      (() => {
        const seedNow = readFileSync('src/lib/supabase/seed-exercises.ts')
        const seedTip = execSync(`git show ${APPLY_PREP_TIP}:src/lib/supabase/seed-exercises.ts`, { encoding: 'buffer' as any }) as unknown as Buffer
        if (!seedNow.equals(seedTip)) return false
        const files = execSync('ls supabase/migrations', { encoding: 'utf8' }).split('\n').filter((f) => f.endsWith('.sql'))
        // RETARGET (EXLIB-2M migration-027 apply-prep): the reviewed
        // 027 candidate joins the boundary (PREPARED, NOT APPLIED;
        // executable SQL byte-identical to the promoted EXLIB-2L
        // proposal); exactly-26 becomes exactly-27 with 027 pinned.
        if (files.length !== 27 || files.filter((f) => f.startsWith('026')).length !== 1 ||
          !files.includes('027_exlib_catalog_content_schema.sql')) return false
        const led = parseJsonl('docs/exlib1b1-review-ledger.jsonl')
        if (led.length !== 48 || !led.every((r: any) => r.status === 'pending' && r.reviewer === null)) return false
        const cands = parseJsonl('docs/exlib1c0a-equipment-resolution.jsonl').flatMap((r: any) => r.canonical_candidates)
        if (cands.length !== 26 || !cands.every((c: any) => c.import_eligible === false)) return false
        const recs: any[] = []
        for (let i = 1; i <= 6; i += 1) {
          // RETARGET (EXLIB-2N review-decision application): batches 2
          // and 4 anchored to the promoted 2N tip (pending there); the
          // other four remain live claims.
          const parse = (i === 2 || i === 4) ? parseJsonlAt2N : parseJsonl
          recs.push(...parse(`docs/exlib2c-release1-batch0${i}-content.jsonl`))
        }
        if (recs.length !== 126 || !recs.every((r) =>
          r.content_review.status === 'pending' && r.import_eligible === false &&
          !Object.keys(r).some((k) => k.includes('publication')))) return false
        if (execSync("grep -rl 'weight_time' src/ || true", { encoding: 'utf8' }).trim() !== '') return false
        if (existsSync('scripts/exlib1c-import.ts') || existsSync('src/lib/catalog-import.ts')) return false
        return recFlat.includes('seed_link_compatible remains false') &&
          recFlat.includes('approves NOTHING further') &&
          recFlat.includes('all remain unauthorized')
      })())
    check('B2: the C2 retarget is labeled and anchored — verify-exlib2f.ts carries the RETARGET (EXLIB-2F application record) label with the ls-tree anchor, and the apply-prep tip\'s tree really contains no application record',
      (() => {
        const e2f = read('scripts/verify-exlib2f.ts')
        if (!e2f.includes('RETARGET (EXLIB-2F application record)')) return false
        if (!e2f.includes(`git ls-tree ${APPLY_PREP_TIP} docs/`)) return false
        const docsAtTip = execSync(`git ls-tree ${APPLY_PREP_TIP} docs/ --name-only`, { encoding: 'utf8' })
          .split('\n').filter(Boolean)
        return !docsAtTip.some((f) => f.includes('exlib2f') && f.includes('application-record'))
      })())
    check('G1: lifecycle-safe phase boundary — exactly the two new artifacts plus the retargeted 2F verifier (3 paths); strict porcelain while uncommitted, adder-anchored once committed',
      (() => {
        try {
          const inHead = (() => {
            try { execSync(`git cat-file -e HEAD:${RECORD}`, { stdio: 'pipe' }); return true } catch { return false }
          })()
          if (!inHead) {
            const entries = execSync('git status --porcelain', { encoding: 'utf8' })
              .split('\n').filter(Boolean).map((l) => l.trim()).sort()
            const expected = [...PHASE_NEW.map((f) => `?? ${f}`), 'M scripts/verify-exlib2f.ts'].sort()
            if (JSON.stringify(entries) !== JSON.stringify(expected)) return false
            return execSync('git diff --cached --name-only', { encoding: 'utf8' }).trim() === ''
          }
          const adders = new Set<string>()
          for (const p of PHASE_NEW) {
            const a = execSync(`git log --all --format=%H --diff-filter=A -- ${p}`,
              { encoding: 'utf8' }).split('\n').filter(Boolean)
            if (a.length !== 1) return false
            adders.add(a[0])
          }
          if (adders.size !== 1) return false
          const phase = Array.from(adders)[0]
          execSync(`git merge-base --is-ancestor ${phase} HEAD`)
          execSync(`git merge-base --is-ancestor ${APPLY_PREP_TIP} ${phase}`)
          const range = execSync(`git diff --name-only ${APPLY_PREP_TIP}..${phase}`, { encoding: 'utf8' })
            .split('\n').filter(Boolean).sort()
          return JSON.stringify(range) === JSON.stringify(PHASE_ALL)
        } catch { return false }
      })())
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
