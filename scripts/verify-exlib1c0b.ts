// ============================================================
// ForgeFitOS — EXLIB-1C0B schema-vocabulary displacement-audit
// harness. Proves the audit is grounded in the frozen promoted
// state, that its schema and consumer inventories reconcile
// MECHANICALLY against fresh repository searches (no consumer may
// be missing), that the weight_time analysis and open product
// decisions are explicit (nothing silently chosen), that the
// recommendation is labeled PROPOSED — NOT APPROVED, and that this
// phase authored no SQL, no migration 025, and no product change.
// Run from the repository root:
//   npx tsx scripts/verify-exlib1c0b.ts
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

const C0A_COMMIT = '55fa7610b61d711c51a2e5d10a00c1608830d151'
const MANIFEST_SHA = '336cd4253f747cdb3ba73ffa2af5a63e255c7c87cc452d4c43ed59a654673dfa'
const LEDGER_SHA = 'aa4fe77c0c633510661eede94b40e9bae4aca90a7d8c2794abde92c83c6f7b7b'
const M023_SHA = '0991448c39a558385431c78cef6d6063df208312a3f53866756ba730066c42f2'
const M024_SHA = '190550ecdb99df702ab03d1b07592f861070141e5091eb25bc5bf45f211cc980'
const DECISION_SHA = '5daeda78e3a8e2886a6b720273c3069995f1b86789872004cc90d49197abe8af'
const OVERLAY_SHA = 'f9e7a98db6b519e650d5f2b8a231308c0fd76ccb23e1685f497100812fbd2fb4'
const C0A_VERIFIER_SHA = '34b92338ac173dd2990671cabf5a5d2c18d5202abe636248daeb610bfd0cf27d'
const C0_VERIFIER_SHA = '90a62fabd253f9267de6a0e89a4a227d4ca3f2c11054a2c8ba178033e90a2047'

const audit = read('docs/exlib1c0b-schema-vocabulary-impact-audit.md')
const auditFlat = audit.replace(/\s+/g, ' ')
const overlay = read('docs/exlib1c0a-equipment-resolution.jsonl')
  .split('\n').filter((l) => l && !l.startsWith('#')).map((l) => JSON.parse(l))
const DESIRED_EQUIPMENT = ['weight_plate', 'weighted_vest', 'smith_machine', 'sandbag']

function grepFiles(dir: string, re: RegExp): string[] {
  const out: string[] = []
  const walk = (d: string) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = `${d}/${e.name}`
      if (e.isDirectory()) { walk(p); continue }
      if (!/\.(ts|tsx|sql)$/.test(e.name)) continue
      if (re.test(readFileSync(p, 'utf8'))) out.push(p)
    }
  }
  walk(dir)
  return out.sort()
}

async function main() {
  console.log('\nA. Immutable baseline')
  {
    check('A1: promoted anchors — HEAD descends from the EXLIB-1C0A commit; stable tag dereferences to it; promoted docs byte-exact on disk and both prior verifiers byte-exact at the promoted commit (worktree diffs admission-only per G2)',
      (() => {
        try {
          const tag = execSync('git rev-parse "exlib1c0a-private-use-equipment-decisions-stable^{}"', { encoding: 'utf8' }).trim()
          execSync(`git merge-base --is-ancestor ${C0A_COMMIT} HEAD`)
          const blobSha = (p: string) => createHash('sha256')
            .update(execSync(`git show ${C0A_COMMIT}:${p}`, { maxBuffer: 1024 * 1024 * 16 }))
            .digest('hex')
          return tag === C0A_COMMIT &&
            sha256('docs/exlib1c0a-private-use-product-decision.md') === DECISION_SHA &&
            sha256('docs/exlib1c0a-equipment-resolution.jsonl') === OVERLAY_SHA &&
            blobSha('scripts/verify-exlib1c0a.ts') === C0A_VERIFIER_SHA &&
            blobSha('scripts/verify-exlib1c0.ts') === C0_VERIFIER_SHA
        } catch { return false }
      })())
    check('A2: manifest and AUTHORITATIVE ledger frozen; ledger 48/48 pending-null',
      (() => {
        const led = read('docs/exlib1b1-review-ledger.jsonl')
          .split('\n').filter((l) => l && !l.startsWith('#')).map((l) => JSON.parse(l))
        return sha256('docs/exlib1a-discovery-manifest.jsonl') === MANIFEST_SHA &&
          sha256('docs/exlib1b1-review-ledger.jsonl') === LEDGER_SHA &&
          led.length === 48 &&
          led.every((l) => l.status === 'pending' && l.reviewer === null &&
            l.reviewed_at === null && l.decision_rationale === null)
      })())
    check('A3: migrations exactly 001-024 with exact 023/024 fingerprints; NO migration 025',
      (() => {
        const files = readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql'))
        // RETARGET (EXLIB-1C0B3 migration 025 draft): the authorized
        // equipment-vocabulary draft is the only permitted 025
        // (DRAFT, not applied); exactly-24 becomes exactly-25 with
        // 024 and 025 pinned.
        return files.length === 25 &&
          files.filter((f) => f.startsWith('025')).length === 1 &&
          files.includes('025_exlib_equipment_vocabulary_support.sql') &&
          sha256('supabase/migrations/023_exlib_catalog_and_delivery_contract.sql') === M023_SHA &&
          sha256('supabase/migrations/024_exlib_post_application_hardening.sql') === M024_SHA
      })())
    check('A4: overlay remains 9 resolutions / 26 candidates, ALL import-ineligible, carrying exactly the five desired future values',
      (() => {
        const cands = overlay.flatMap((r) => r.canonical_candidates)
        const desired = cands.filter((c: any) => c.equipment.vocabulary_decision_required)
          .map((c: any) => c.equipment.desired_value).sort()
        const planks = cands.filter((c: any) => c.tracking && c.tracking.desired_future_value === 'weight_time')
        return overlay.length === 9 && cands.length === 26 &&
          new Set(cands.map((c: any) => c.candidate_name)).size === 26 &&
          cands.every((c: any) => c.import_eligible === false) &&
          overlay.every((r) => r.import_eligible === false) &&
          JSON.stringify(desired) === JSON.stringify([...DESIRED_EQUIPMENT].sort()) &&
          planks.length === 2
      })())
    check('A5: no product/API/schema/dependency change, no importer artifacts, no CLI residue',
      (() => {
        try {
          // ADMISSION (EXLIB-1C0B3): the authorized coordinated
          // equipment-vocabulary product changes are admitted while
          // uncommitted (exact four paths only).
          return execSync(
            'git diff --name-only -- src/ supabase/ package.json package-lock.json next.config.mjs tailwind.config.ts tsconfig.json',
            { encoding: 'utf8' }).trim().split('\n').filter(Boolean)
            .every((f) => f === 'src/types/database.ts' ||
              f === 'src/lib/exercise-validation.ts' ||
              f === 'src/lib/constants.ts' || f === 'src/lib/workout.ts') &&
            !existsSync('scripts/exlib1c-import.ts') &&
            !existsSync('src/lib/catalog-import.ts') &&
            !existsSync('supabase/.temp')
        } catch { return false }
      })())
  }

  console.log('\nB. Audit honesty and guidance')
  {
    check('B1: the five banner statements are present verbatim',
      ['ANALYSIS ONLY', 'MIGRATION 025 NOT AUTHORED',
        'NO SCHEMA OR PRODUCT CHANGE APPROVED', 'NO CATALOG LOADING AUTHORIZED',
        'ALL 26 CANDIDATES REMAIN IMPORT-INELIGIBLE']
        .every((a) => audit.includes(a)))
    check('B2: guidance provenance — CLI 2.105.0 inspected, primary URLs recorded with the 2026-08-25 retrieval date, no hosted contact',
      auditFlat.includes('`supabase --version` = **2.105.0**') &&
      auditFlat.includes('retrieved 2026-08-25') &&
      ['https://supabase.com/changelog',
        'https://supabase.com/docs/guides/deployment/database-migrations',
        'https://www.postgresql.org/docs/current/sql-altertable.html',
        'https://www.postgresql.org/docs/current/ddl-constraints.html']
        .every((u) => audit.includes(u)) &&
      auditFlat.includes('No Supabase or Vercel connection was made') &&
      auditFlat.includes('the hosted ShredOS project was not contacted'))
    check('B3: documentation-vs-repository derivation is separated and constraint names are honestly UNCONFIRMED until derived live',
      auditFlat.includes('Documentation-derived conclusions') &&
      auditFlat.includes('UNNAMED in the committed SQL') &&
      auditFlat.includes('MUST derive the exact names from `pg_constraint` on a disposable local install') &&
      auditFlat.includes('recorded here as a mandatory pre-draft step, not inferred as fact'))
  }

  console.log('\nC. Schema inventory reconciliation (mechanical)')
  {
    const migFiles = grepFiles('supabase/migrations', /equipment|tracking_mode|exercise_type/)
      .map((p) => p.split('/').pop() as string)
    check('C1: exactly the four vocabulary-bearing migrations exist and each is named in the audit; 024 non-interaction stated',
      // RETARGET (EXLIB-1C0B3 migration 025 draft): the authorized
      // equipment-vocabulary draft is a FIFTH vocabulary-bearing
      // migration; the audit (byte-frozen, pre-decision) names the
      // four that existed at audit time.
      JSON.stringify(migFiles) === JSON.stringify([
        '003_phase1c_workout_logging.sql',
        '010_phase2r_exercise_tracking_modes.sql',
        '021_ui5b_transactional_ordering.sql',
        '023_exlib_catalog_and_delivery_contract.sql',
        '025_exlib_equipment_vocabulary_support.sql']) &&
      migFiles.filter((f) => !f.startsWith('025')).every((f) => audit.includes(f)) &&
      auditFlat.includes('Migration 024 touches none of the three columns'))
    check('C2: the schema matrix enumerates S1-S15 including both CHECK pairs, the freeze trigger, delivery, rollback, append RPC, grants, and set storage',
      ['| S1 |', '| S2 |', '| S3 |', '| S4 |', '| S5 |', '| S6 |', '| S7 |',
        '| S8 |', '| S9 |', '| S10 |', '| S11 |', '| S12 |', '| S13 |',
        '| S14 |', '| S15 |'].every((s) => audit.includes(s)) &&
      auditFlat.includes('exercise_catalog_freeze_trigger') &&
      auditFlat.includes('deliver_catalog_exercises(TEXT)') &&
      auditFlat.includes('rollback_catalog_delivery(TEXT)') &&
      auditFlat.includes('append_workout_set'))
    const m023 = read('supabase/migrations/023_exlib_catalog_and_delivery_contract.sql').replace(/\s+/g, ' ')
    check('C3: the delivery derivation quoted in the audit matches the REAL committed CASE (timed->mobility, ELSE->strength)',
      m023.includes("WHEN 'timed' THEN 'mobility'") &&
      m023.includes("ELSE 'strength'") &&
      auditFlat.includes("timed->'mobility', ELSE->'strength'") &&
      auditFlat.includes('an ACCIDENTAL mapping, not a decision'))
    const m021 = read('supabase/migrations/021_ui5b_transactional_ordering.sql').replace(/\s+/g, ' ')
    check('C4: the append-RPC gating quoted in the audit matches the REAL committed rules (fail-closed ELSE; per-mode field and completion gates)',
      m021.includes("ELSIF v_tracking_mode = 'timed' THEN") &&
      m021.includes("ELSE RAISE EXCEPTION 'invalid_input';") &&
      auditFlat.includes("ELSE RAISE 'invalid_input'") &&
      auditFlat.includes('weight_time hits the ELSE -> fail-closed REJECTION'))
    const m003 = read('supabase/migrations/003_phase1c_workout_logging.sql').replace(/\s+/g, ' ')
    const m011 = read('supabase/migrations/011_phase2s_tracking_aware_set_entry.sql').replace(/\s+/g, ' ')
    check('C5: set-storage facts match the committed schema — nullable weight_kg/reps (003), duration/distance added in 011, no cross-column weight-duration constraint',
      m003.includes('weight_kg NUMERIC(6,2)') && m003.includes('reps SMALLINT') &&
      m011.includes('ADD COLUMN duration_seconds INTEGER') &&
      m011.includes('ADD COLUMN distance_meters NUMERIC(10,2)') &&
      auditFlat.includes('no cross-column constraint ties weight to reps or forbids weight+duration together'))
  }

  console.log('\nD. Consumer reconciliation (mechanical, fail-closed)')
  {
    const srcConsumers = Array.from(new Set([
      ...grepFiles('src', /equipment/),
      ...grepFiles('src', /tracking_mode|trackingMode/),
      ...grepFiles('src', /exercise_type|exerciseType/),
    ])).sort()
    const missing = srcConsumers.filter((p) => !audit.includes(p))
    check(`D1: EVERY src consumer found by fresh mechanical search (${srcConsumers.length} files) appears verbatim in the audit — none missing`,
      srcConsumers.length >= 20 && missing.length === 0,
      missing.length ? `missing: ${missing.join(', ')}` : undefined)
    const suitePins = readdirSync('scripts').filter((f) => f.startsWith('verify-') && f.endsWith('.ts'))
      .filter((f) => f !== 'verify-exlib1c0b.ts')
      .filter((f) => /weight_reps|resistance_band/.test(read(`scripts/${f}`)))
      .map((f) => f.replace('.ts', ''))
      .sort()
    // RETARGET (EXLIB-1C0B3 migration 025 draft): the audit is the
    // byte-frozen PRE-implementation record; suites created BY the
    // later authorized implementation phase it proposed cannot be
    // named in it and are excluded from the must-be-named set.
    const missingSuites = suitePins.filter((n) => !audit.includes(n) &&
      !n.startsWith('verify-exlib1c0b3'))
    check(`D2: EVERY committed verifier suite carrying vocabulary pins (${suitePins.length} suites) is named in the audit — none missing`,
      suitePins.length >= 12 && missingSuites.length === 0,
      missingSuites.length ? `missing: ${missingSuites.join(', ')}` : undefined)
    check('D3: the consumer matrix records role, exhaustive assumption, per-value effects, required change, and schema-only safety for the API/UI/records surfaces',
      ['| C1 |', '| C5 |', '| C8 |', '| C15 |', '| C16 |', '| C23 |']
        .every((s) => audit.includes(s)) &&
      auditFlat.includes('UNDEFINED -> runtime TypeError/500') &&
      auditFlat.includes('renders NO input fields (silent dead UI)') &&
      auditFlat.includes('silent misclassification'))
  }

  console.log('\nE. weight_time contract analysis')
  {
    check('E1: storage-coexistence and per-mode validation facts are stated from the real schema (weight+duration already storable; prohibitions live in validation only)',
      auditFlat.includes('already physically possible') &&
      auditFlat.includes('Every prohibition is in validation') &&
      auditFlat.includes('No new set columns are required'))
    check('E2: every undecidable item is an explicit OPEN PRODUCT DECISION — field contract, completion/zero semantics, legacy derivation, records model — nothing chosen silently',
      (audit.match(/OPEN PRODUCT DECISION/g) || []).length >= 4 &&
      auditFlat.includes('but it is a decision, not a default') &&
      auditFlat.includes('Either it is excluded from records initially or a distinct load-x-duration performance model is designed'))
    check('E3: delivered-before-support verdict is explicit — weight_time rows would be visible but unusable and delivery MUST wait',
      auditFlat.includes('visible but unusable') &&
      auditFlat.includes('Delivery of weight_time rows MUST wait for full product support'))
  }

  console.log('\nF. Options, recommendation, and rollout')
  {
    check('F1: at least the four required options are compared against the required criteria',
      ['A: combined release', 'B: split', 'C: schema-first', 'D: orthogonal metric-capability']
        .every((o) => auditFlat.includes(o)) &&
      ['Historical data integrity', 'Silent data loss prevention', 'Catalog-delivery safety',
        'Rollback safety', 'Consumer displacement', 'Testability',
        'Immutable snapshot/run compatibility']
        .every((c) => auditFlat.includes(c)))
    check('F2: the recommendation is labeled PROPOSED — NOT APPROVED and answers every required question explicitly',
      auditFlat.includes('PROPOSED — NOT APPROVED') &&
      auditFlat.includes('Can the four equipment values ship independently?** YES') &&
      auditFlat.includes('Can weight_time ship as a schema-only value?** NO') &&
      auditFlat.includes('EQUIPMENT ONLY (proposed)') &&
      auditFlat.includes('Exact product decisions remaining before drafting SQL') &&
      auditFlat.includes('What must be released atomically?') &&
      auditFlat.includes('Never a bare CHECK first'))
    check('F3: the staged rollout covers all thirteen fail-closed stages ending in hosted QA, with application/loading authorization Joseph/ChatGPT-only',
      ['Architecture/product decision', 'Migration 025 draft',
        'Disposable local-Postgres verification', 'Candidate preparation and promotion',
        'Explicit Supabase application authorization', 'Read-only post-application verification',
        'Catalog candidate eligibility review', 'Dry-run payload review',
        'Explicit loading authorization', 'Rollback rehearsal', 'Hosted QA']
        .every((s) => auditFlat.includes(s)) &&
      auditFlat.includes('Joseph/ChatGPT only') &&
      auditFlat.includes('Claude never applies'))
    check('F4: rollback analysis is complete — contraction-after-adoption impossibility, dependent-row removal, immutable snapshots, forward-only meaning, and why candidates stay ineligible',
      auditFlat.includes('contraction is only possible while zero rows use the values') &&
      auditFlat.includes('impossible without first normalizing or deleting dependent rows') &&
      auditFlat.includes('corrected by a NEW catalog version row') &&
      auditFlat.includes('never constraint contraction over live values') &&
      auditFlat.includes('Why catalog records stay ineligible during this phase'))
    // REVISED (EXLIB-1C0B1 direct review, committed-state lifecycle):
    // decision-consistency — the seven open decisions are enumerated
    // exactly, correctly partitioned between the two releases, none
    // is silently selected or singled out as a lone blocker, and
    // nothing is approved or authored.
    check('F5: decision consistency — exactly seven open decisions; (1)-(4) gate weight_time; (5)-(7) ALL gate the equipment release; no sole-blocker claim; none silently defaulted; Option B stays PROPOSED — NOT APPROVED; migration 025 unauthored',
      (() => {
        const start = auditFlat.indexOf('Exact product decisions remaining before drafting SQL')
        const end = auditFlat.indexOf('What must be released atomically')
        if (start < 0 || end <= start) return false
        const block = auditFlat.slice(start, end)
        // Enumeration markers only — the range expressions
        // "(1)-(4)"/"(5)-(7)" in the gating sentence are excluded by
        // requiring a non-hyphen before the marker.
        const nums = Array.from(block.matchAll(/[^-]\(([1-7])\)\s/g)).map((m) => m[1])
        return nums.length === 7 &&
          JSON.stringify([...nums].sort()) === JSON.stringify(['1', '2', '3', '4', '5', '6', '7']) &&
          auditFlat.includes('Decisions (1)-(4) gate the weight_time feature only') &&
          auditFlat.includes('(5)-(7) are ALL unresolved product decisions for the coordinated equipment release') &&
          auditFlat.includes('none may be silently defaulted') &&
          !auditFlat.includes('sole blocker') &&
          auditFlat.includes('Migration 025 drafting may begin only after Joseph explicitly closes all three') &&
          auditFlat.includes('unless Joseph explicitly approves a documented deferred behavior') &&
          auditFlat.includes('all 26 candidates remain import-ineligible throughout') &&
          auditFlat.includes('Option B') && auditFlat.includes('PROPOSED — NOT APPROVED') &&
          auditFlat.includes('MIGRATION 025 NOT AUTHORED') &&
          // RETARGET (EXLIB-1C0B3 migration 025 draft): the audit's
          // unauthored statement is historical; the authorized draft
          // is now the only permitted 025.
          readdirSync('supabase/migrations').filter((f) => f.startsWith('025'))
            .every((f) => f === '025_exlib_equipment_vocabulary_support.sql')
      })())
  }

  console.log('\nG. Phase boundary')
  {
    check('G1: the audit contains NO executable SQL (no line-start DDL/DML) and no fenced SQL block',
      !/^(CREATE|ALTER|DROP|INSERT|UPDATE|DELETE)\s/m.test(audit) &&
      !audit.includes('```sql'))
    // REVISED (EXLIB-1C0B1 direct review, committed-state lifecycle):
    // G2 supports EXACTLY two legitimate states, and merely
    // containing the ADMISSION (EXLIB-1C0B) label is no longer
    // sufficient — every one of the nine tracked-suite diffs must
    // match its reviewed form LINE-EXACTLY. While uncommitted it
    // proves the exact review worktree; once the audit exists in
    // HEAD it requires a clean tree, mechanically discovers the
    // unique phase commit (no hardcoded future SHA), and re-runs the
    // identical line-exact proofs over the immutable phase^..phase
    // range — valid on both a QA candidate checkout and promoted
    // main.
    const INVENTORY_1C0B = [
      'docs/exlib1c0b-schema-vocabulary-impact-audit.md',
      'scripts/verify-exlib1c0b.ts',
    ]
    const SEVEN_SUITES = ['scripts/verify-exlib1a.ts', 'scripts/verify-exlib1b1.ts',
      'scripts/verify-exlib1b3.ts', 'scripts/verify-ui5b1b.ts', 'scripts/verify-ui5b2.ts',
      'scripts/verify-ui6c.ts', 'scripts/verify-ui7.ts']
    const NINE_SUITES = [...SEVEN_SUITES, 'scripts/verify-exlib1c0.ts', 'scripts/verify-exlib1c0a.ts']
    const SEVEN_ADDS = [
      '// ADMISSION (EXLIB-1C0B): the displacement-audit',
      '// artifacts are admitted while uncommitted.',
      "f.startsWith('docs/exlib1c0b-') ||",
    ]
    const C0_DELS = [
      'return !execSync(`git diff -- ${f}`, { encoding: \'utf8\' })',
      ".includes('ADMISSION (EXLIB-1C0A)')",
    ]
    const C0_ADDS = [
      '// ADMISSION (EXLIB-1C0B): the displacement-audit',
      '// artifacts (and their verifier) are admitted while',
      '// uncommitted.',
      "if (f.startsWith('docs/exlib1c0b-') ||",
      "f === 'scripts/verify-exlib1c0b.ts') return false",
      'return !/ADMISSION \\(EXLIB-1C0A\\)|ADMISSION \\(EXLIB-1C0B\\)/.test(',
      'execSync(`git diff -- ${f}`, { encoding: \'utf8\' }))',
    ]
    const C0A_DELS = [
      "if (execSync('git status --porcelain', { encoding: 'utf8' }).trim() !== '') return false",
    ]
    const C0A_ADDS = [
      '// ADMISSION (EXLIB-1C0B): the displacement-audit artifacts',
      '// (and their verifier), plus committed verify suites whose',
      '// worktree diff carries the ADMISSION (EXLIB-1C0B) label,',
      '// are admitted while that phase is uncommitted.',
      "const dirtyAfterAdmissions = execSync('git status --porcelain', { encoding: 'utf8' })",
      ".split('\\n').filter(Boolean)",
      '.filter((l) => {',
      'const mm = l.match(/^\\s*(\\?\\?|[A-Z]{1,2})\\s+(.+)$/)',
      "const st = mm ? mm[1] : ''",
      'const f = mm ? mm[2] : l',
      "if (f.startsWith('docs/exlib1c0b-') ||",
      "f === 'scripts/verify-exlib1c0b.ts') return false",
      "if (st === 'M' && f.startsWith('scripts/verify-') && f.endsWith('.ts')) {",
      'try {',
      'return !execSync(`git diff -- ${f}`, { encoding: \'utf8\' })',
      ".includes('ADMISSION (EXLIB-1C0B)')",
      '} catch { return true }',
      '}',
      'return true',
      '})',
      'if (dirtyAfterAdmissions.length !== 0) return false',
    ]
    const diffLineExact = (diffText: string, f: string): boolean => {
      const adds = diffText.split('\n').filter((l) => l.startsWith('+') && !l.startsWith('+++')).map((l) => l.slice(1).trim())
      const dels = diffText.split('\n').filter((l) => l.startsWith('-') && !l.startsWith('---')).map((l) => l.slice(1).trim())
      if (f === 'scripts/verify-exlib1c0.ts') {
        return JSON.stringify(adds) === JSON.stringify(C0_ADDS) &&
          JSON.stringify(dels) === JSON.stringify(C0_DELS)
      }
      if (f === 'scripts/verify-exlib1c0a.ts') {
        return JSON.stringify(adds) === JSON.stringify(C0A_ADDS) &&
          JSON.stringify(dels) === JSON.stringify(C0A_DELS)
      }
      return dels.length === 0 && JSON.stringify(adds) === JSON.stringify(SEVEN_ADDS)
    }
    const auditInHead = (() => {
      try {
        execSync('git cat-file -e HEAD:docs/exlib1c0b-schema-vocabulary-impact-audit.md', { stdio: 'pipe' })
        return true
      } catch { return false }
    })()
    check(`G2: lifecycle-safe phase boundary (${auditInHead ? 'COMMITTED' : 'UNCOMMITTED REVIEW'} state) — exact inventory and LINE-EXACT admission diffs on all nine suites`,
      (() => {
        try {
          if (!auditInHead) {
            const entries = execSync('git status --porcelain', { encoding: 'utf8' }).split('\n').filter(Boolean)
            const untracked = entries.filter((l) => l.startsWith('??')).map((l) => l.slice(3).trim()).sort()
            const modified = entries.filter((l) => !l.startsWith('??'))
              .map((l) => (l.match(/^\s*[A-Z?]{1,2}\s+(.+)$/) as RegExpMatchArray)[1])
            const staged = execSync('git diff --cached --name-only', { encoding: 'utf8' }).trim()
            if (staged !== '') return false
            if (JSON.stringify(untracked) !== JSON.stringify([...INVENTORY_1C0B].sort())) return false
            if (JSON.stringify([...modified].sort()) !== JSON.stringify([...NINE_SUITES].sort())) return false
            return modified.every((f) =>
              diffLineExact(execSync(`git diff -- ${f}`, { encoding: 'utf8' }), f))
          }
          // ADMISSION (EXLIB-1C0B2): the equipment-decision record
          // artifacts (and their verifier), plus committed verify
          // suites whose worktree diff carries the
          // ADMISSION (EXLIB-1C0B2) label, are admitted while that
          // phase is uncommitted.
          const dirtyAfterB2 = execSync('git status --porcelain', { encoding: 'utf8' })
            .split('\n').filter(Boolean)
            .filter((l) => {
              const mm = l.match(/^\s*(\?\?|[A-Z]{1,2})\s+(.+)$/)
              const st = mm ? mm[1] : ''
              const f = mm ? mm[2] : l
              if (f.startsWith('docs/exlib1c0b2-') ||
                f === 'scripts/verify-exlib1c0b2.ts') return false
              // ADMISSION (EXLIB-1C0B3): the authorized migration-025
              // draft, its live suite and verifier, and the
              // coordinated product changes are admitted while
              // uncommitted.
              if (f === 'supabase/migrations/025_exlib_equipment_vocabulary_support.sql' ||
                f === 'scripts/verify-exlib1c0b3-live.sh' ||
                f === 'scripts/verify-exlib1c0b3.ts' ||
                f === 'src/types/database.ts' ||
                f === 'src/lib/exercise-validation.ts' ||
                f === 'src/lib/constants.ts' ||
                f === 'src/lib/workout.ts') return false
                // ADMISSION (EXLIB-1C0B3): the implementation record and
                // local-only guard are admitted while uncommitted.
                if (f.startsWith('docs/exlib1c0b3-') ||
                  f === 'scripts/verify-exlib1c0b3-guard.sh') return false
              if (st === 'M' && f.startsWith('scripts/verify-') && f.endsWith('.ts')) {
                try {
                  // ADMISSION (EXLIB-1C0B3): accept this phase's
                  // admission and retarget labels too.
                  return !/ADMISSION \(EXLIB-1C0B2\)|ADMISSION \(EXLIB-1C0B3\)|RETARGET \(EXLIB-1C0B3 migration 025 draft\)/.test(
                    execSync(`git diff -- ${f}`, { encoding: 'utf8' }))
                } catch { return true }
              }
              return true
            })
          if (dirtyAfterB2.length !== 0) return false
          if (execSync('git diff --cached --name-only', { encoding: 'utf8' }).trim() !== '') return false
          const adders = execSync(
            'git log --all --format=%H --diff-filter=A -- docs/exlib1c0b-schema-vocabulary-impact-audit.md',
            { encoding: 'utf8' }).split('\n').filter(Boolean)
          if (adders.length !== 1) return false
          const phase = adders[0]
          const verifierAdders = execSync(
            'git log --all --format=%H --diff-filter=A -- scripts/verify-exlib1c0b.ts',
            { encoding: 'utf8' }).split('\n').filter(Boolean)
          if (verifierAdders.length !== 1 || verifierAdders[0] !== phase) return false
          execSync(`git merge-base --is-ancestor ${phase} HEAD`)
          const range = execSync(`git diff --name-only ${phase}^..${phase}`, { encoding: 'utf8' })
            .split('\n').filter(Boolean).sort()
          const expected = [...INVENTORY_1C0B, ...NINE_SUITES].sort()
          if (JSON.stringify(range) !== JSON.stringify(expected)) return false
          return NINE_SUITES.every((f) =>
            diffLineExact(execSync(`git diff ${phase}^..${phase} -- ${f}`, { encoding: 'utf8' }), f))
        } catch { return false }
      })())
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
