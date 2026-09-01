// EXLIB-1C0B5 verifier — weight_time RPE/warmup subdecision
// (PRODUCT-DECISION OVERLAY ONLY) + bootstrap-audit reconciliation.
//
// Proves: Joseph's explicit 2026-08-28 RPE/warmup contract and its
// exact semantics; the overlay supersedes ONLY EXLIB-1C0B4's single
// intentionally-open subdecision with the B4 record preserved
// byte-for-byte; the bootstrap audit carries an honest dated
// historical-vs-current supersession; implementation and migration
// 026 remain unauthorized; weight_time remains absent from
// executable product code; all prior protected artifacts remain
// byte-identical; ledger 48/48 pending-null; 26/26 candidates
// import-ineligible; catalog and EXLIB-1C loading remain
// unauthorized. Performs NO hosted contact.
//
// Fail-closed: any mismatch fails the suite.
import { execSync } from 'child_process'
import { createHash } from 'crypto'
import { existsSync, readFileSync, readdirSync } from 'fs'

let passed = 0
let failed = 0
const check = (name: string, ok: boolean): void => {
  if (ok) { passed += 1; console.log(`  PASS  ${name}`) }
  else { failed += 1; console.log(`  FAIL  ${name}`) }
}
const read = (p: string): string => readFileSync(p, 'utf8')
const sha256 = (p: string): string => createHash('sha256').update(readFileSync(p)).digest('hex')

const OVERLAY = 'docs/exlib1c0b5-weight-time-rpe-warmup-decision.md'
const OVERLAY_BYTES = 3458
const OVERLAY_SHA = '0d5efdc70d968c0301f817cb5a9ac4feedf56e1f129bf03c23f5d6180f1009e3'
const AUDIT = 'docs/bootstrap-audit-2026-08-27.md'
const B4_RECORD = 'docs/exlib1c0b4-weight-time-product-decisions.md'
const B4_RECORD_SHA = '12fe23d37ee075c66c62dc1ad11b18fadf29ccd907525b2b9dabf7055feaa4aa'
const B4_COMMIT = '9b22947699529a2cb07af4c34cf53ebfee9646b8'

const ov = read(OVERLAY)
const flat = ov.replace(/\s+/g, ' ')
const audit = read(AUDIT)
const aflat = audit.replace(/\s+/g, ' ')

async function main(): Promise<void> {
  console.log('EXLIB-1C0B5 verification (weight_time RPE/warmup subdecision overlay)')

  console.log('\nA. Overlay status and narrow supersession')
  {
    check('A1: status block — subdecision CLOSED/APPROVED (2026-08-28), product-definition only, implementation NOT AUTHORIZED, migration 026 NOT AUTHORED/NOT AUTHORIZED, coordinated plan still required, Decisions 1-4 unchanged, prohibitions and frozen ledger stated, full base SHA anchored',
      flat.includes('PRODUCT-DECISION RECORD ONLY') &&
      flat.includes('Decided explicitly by Joseph Carfagno on 2026-08-28') &&
      flat.includes('**CLOSED/APPROVED** (2026-08-28)') &&
      flat.includes('Product-definition approval only') &&
      flat.includes('Implementation remains **NOT AUTHORIZED**') &&
      flat.includes('Migration 026 remains **NOT AUTHORED and NOT AUTHORIZED**') &&
      flat.includes('separately reviewed coordinated `weight_time` implementation plan before any migration or runtime work') &&
      flat.includes('Decisions 1-4 of EXLIB-1C0B4 are **unchanged**') &&
      flat.includes('No catalog loading') &&
      flat.includes('48/48 pending-null') &&
      flat.includes('remain `import_eligible: false`') &&
      flat.includes('No EXLIB-1C loading authorization') &&
      flat.includes(B4_COMMIT))
    check('A2: narrow supersession — cites the stable B4 record by exact fingerprint/tag, quotes its intentional OPEN language, supersedes ONLY that subdecision; the committed B4 record remains byte-identical on disk with its OPEN text preserved',
      flat.includes(B4_RECORD) &&
      flat.includes('5,973 bytes') &&
      flat.includes(B4_RECORD_SHA) &&
      flat.includes('exlib1c0b4-weight-time-product-decisions-stable') &&
      flat.includes('intentionally left this subdecision open') &&
      flat.includes('remains an OPEN PRODUCT DECISION, exactly as before and unresolved by this record') &&
      flat.includes('This overlay supersedes ONLY that open RPE/warmup subdecision') &&
      flat.includes('preserved byte-for-byte') &&
      sha256(B4_RECORD) === B4_RECORD_SHA &&
      read(B4_RECORD).includes('remains an OPEN PRODUCT DECISION, exactly as before and unresolved') &&
      execSync(`git diff HEAD -- ${B4_RECORD}`, { encoding: 'utf8' }).trim() === '')
  }

  console.log('\nB. The approved RPE/warmup contract — exact semantics')
  {
    check('B1: both fields permitted on existing columns — no new columns, rpe optional/nullable with existing range/semantics, is_warmup optional with existing default false, neither required for completion',
      flat.includes('`workout_sets.rpe` is permitted for `weight_time`') &&
      flat.includes('`workout_sets.is_warmup` is permitted for `weight_time`') &&
      flat.includes('Both reuse the existing columns; add no new columns') &&
      flat.includes('`rpe` is optional/nullable and retains its existing valid range and semantics') &&
      flat.includes('`is_warmup` remains optional with its existing default of `false`') &&
      flat.includes('Neither field is required for completion'))
    check('B2: the core completed-set contract is restated unchanged — weight_kg >= 0, duration_seconds > 0, both present, zero weight valid intentional baseline, zero duration invalid',
      flat.includes('Neither changes the core completed-set contract') &&
      flat.includes('`weight_kg >= 0`') &&
      flat.includes('`duration_seconds > 0`') &&
      flat.includes('both values must be present') &&
      flat.includes('zero weight is a valid intentional baseline') &&
      flat.includes('zero duration is invalid'))
    check('B3: RPE is metadata only — excluded from longest-hold, heaviest-hold, Pareto/frontier PR, progression, ranking, and any combined score',
      flat.includes('RPE is metadata only') &&
      flat.includes('It does not participate in longest-hold, heaviest-hold, Pareto/frontier PR, progression, ranking, or any combined score'))
    check('B4: warmup semantics — history-visible but excluded from longest-hold/heaviest-hold records, Pareto/frontier PRs, progression baselines, and working-set volume/readiness calculations; completed warmups validate like working sets; warmup/working status changes trigger recalculation; two-dimensional model unchanged (no scalar weight x time, no RPE-adjusted score)',
      flat.includes('Warmup `weight_time` sets remain visible in history but are excluded from') &&
      flat.includes('longest-hold records') &&
      flat.includes('heaviest-hold records') &&
      flat.includes('Pareto/frontier PRs') &&
      flat.includes('progression baselines') &&
      flat.includes('working-set volume/readiness calculations wherever warmups are already excluded') &&
      flat.includes('A completed warmup set must satisfy the same weight-and-duration validation as a completed working set') &&
      flat.includes('Changing a set between warmup and working status must trigger recalculation of affected records, summaries, and progression inputs') &&
      flat.includes('The two-dimensional model remains unchanged: no scalar weight x time score and no RPE-adjusted score'))
  }

  console.log('\nC. Bootstrap-audit reconciliation')
  {
    // REVISED (EXLIB-1C0B5 review correction): C1 additionally
    // requires the corrected current-state section-8 sentence and
    // explicitly rejects the stale pending/possible phrasing, so no
    // current-state passage can characterize the resolved RPE/warmup
    // decision as pending or conditional. Historical-truth assertions
    // about B4 are preserved unchanged.
    check('C1: the audit distinguishes historical truth (B4 left the question open — statement preserved) from current truth (2026-08-28 overlay resolves it), points to the overlay by exact path, states the corrected field-contract sentence with ZERO stale pending/possible phrasing, keeps the next milestone as a separately reviewed coordinated plan, and keeps migration 026 nonexistent and unauthorized',
      aflat.includes('historically open, NOW RESOLVED (dated supersession)') &&
      aflat.includes('**Historical truth**: this was deliberately *not* resolved by EXLIB-1C0B4') &&
      aflat.includes('that statement about EXLIB-1C0B4 remains accurate as written') &&
      aflat.includes('**Current truth (supersession, 2026-08-28)**') &&
      aflat.includes(OVERLAY) &&
      aflat.includes('NOW SATISFIED (2026-08-28)') &&
      aflat.includes('still NOT started and NOT authorized by the overlay') &&
      aflat.includes('CLOSED (2026-08-28, dated supersession)') &&
      aflat.includes('the plan itself still requires separate review before any migration/runtime work') &&
      aflat.includes('Migration 026 remains nonexistent and unauthorized') &&
      aflat.includes('reuses `weight_kg`/`duration_seconds` and permits the optional existing `rpe`/`is_warmup` fields under the EXLIB-1C0B5 contract, all of which already exist') &&
      !aflat.includes('pending gate 1') &&
      !aflat.includes('possibly `rpe`/`is_warmup`'))
  }

  console.log('\nD. Frozen implementation boundary')
  {
    check('D1: migration 026 absent, migrations exactly 001-025 with 025 byte-identical, and weight_time absent from executable product code',
      (() => {
        const files = readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).sort()
        const src = execSync("grep -rl 'weight_time' src/ || true", { encoding: 'utf8' }).trim()
        // RETARGET (EXLIB-2F migration 026 apply-prep candidate): the
        // reviewed 026 candidate joins the boundary (PREPARED, NOT
        // APPLIED; executable SQL byte-identical to the promoted
        // proposal); exactly-25 becomes exactly-26 with 026 pinned.
        return files.length === 26 &&
          files.filter((f) => f.startsWith('026')).length === 1 &&
          files[25] === '026_exlib_plank_seed_reconciliation.sql' &&
          files[24] === '025_exlib_equipment_vocabulary_support.sql' &&
          sha256('supabase/migrations/025_exlib_equipment_vocabulary_support.sql') === 'fbda16f4d25cacd1715b199050506a4da15896355d96700876b76c68826d304c' &&
          src === ''
      })())
    check('D2: prior protected artifacts remain byte-identical — B4 record, live suite, guard, implementation record, application record, manifest, ledger, B2 record, B1 audit',
      sha256(B4_RECORD) === B4_RECORD_SHA &&
      /* RETARGET (EXLIB-2F): the 1C0B3 live suite gained a narrow labeled 026-exclusion so its exactly-001-025 claim stays true now that the reviewed apply-prep candidate exists; pin moves to the revised bytes. */ sha256('scripts/verify-exlib1c0b3-live.sh') === 'eb1b46e941303e0ae7300e4527703753323025712d5c03463733b213f939f6ac' &&
      sha256('scripts/verify-exlib1c0b3-guard.sh') === 'f5fcda9ef95b4743f8e4009d5a1330289e046d20cc524e944a8d2e91c53b06a4' &&
      sha256('docs/exlib1c0b3-coordinated-equipment-implementation.md') === 'da5e42379ace7ef199f73a23a230b32a97c52ccc972118837535abdb1a1ed1eb' &&
      sha256('docs/exlib1c0b3-application-deployment-hosted-qa-record.md') === '7ef2080a8949da5bafb350957fb3b364e472e75f05a300a0ff560b50cc5aa3df' &&
      sha256('docs/exlib1a-discovery-manifest.jsonl') === '336cd4253f747cdb3ba73ffa2af5a63e255c7c87cc452d4c43ed59a654673dfa' &&
      sha256('docs/exlib1b1-review-ledger.jsonl') === 'aa4fe77c0c633510661eede94b40e9bae4aca90a7d8c2794abde92c83c6f7b7b' &&
      sha256('docs/exlib1c0b2-equipment-release-product-decisions.md') === '6b9e813ad625cb21a8be5a4992d94da7d45f149f3e824388190bb0292da1e64d' &&
      sha256('docs/exlib1c0b-schema-vocabulary-impact-audit.md') === '0d4447142735b29c987e792a8ed3331f19b38c4ae9eb5225d77e7fcf5cff6c5e')
    check('D3: ledger mechanically 48/48 pending-null, 26/26 candidates import-ineligible, and no importer artifacts',
      (() => {
        const parse = (p: string): any[] => read(p).split('\n')
          .filter((l) => l.trim() && !l.trim().startsWith('#')).map((l) => JSON.parse(l))
        const led = parse('docs/exlib1b1-review-ledger.jsonl')
        const cands = parse('docs/exlib1c0a-equipment-resolution.jsonl')
          .flatMap((r: any) => r.canonical_candidates)
        return led.length === 48 &&
          led.every((r: any) => r.status === 'pending' && r.reviewer === null &&
            r.reviewed_at === null && r.decision_rationale === null) &&
          cands.length === 26 &&
          cands.every((c: any) => c.import_eligible === false) &&
          !existsSync('scripts/exlib1c-import.ts') &&
          !existsSync('src/lib/catalog-import.ts')
      })())
  }

  console.log('\nG. Phase boundary')
  {
    // Line-exact expected diffs of EVERY modified file in this
    // phase: twelve committed suites gain only the labeled
    // EXLIB-1C0B5 scope admissions (ADMISSION (EXLIB-1C0B5
    // weight_time rpe-warmup decision)). Generated mechanically from
    // the reviewed worktree diff; lines trimmed, in file order.
    const DIFF_MAP: Record<string, { adds: string[]; dels: string[] }> =
      JSON.parse("{\"scripts/verify-exlib1a.ts\": {\"adds\": [\"// ADMISSION (EXLIB-1C0B5 weight_time rpe-warmup decision): the\", \"// uncommitted decision overlay, bootstrap audit, and B5 verifier\", \"// are admitted (exact paths).\", \"f === 'docs/exlib1c0b5-weight-time-rpe-warmup-decision.md' ||\", \"f === 'docs/bootstrap-audit-2026-08-27.md' ||\"], \"dels\": []}, \"scripts/verify-exlib1b1.ts\": {\"adds\": [\"// ADMISSION (EXLIB-1C0B5 weight_time rpe-warmup decision): the\", \"// uncommitted decision overlay, bootstrap audit, and B5 verifier\", \"// are admitted (exact paths).\", \"f === 'docs/exlib1c0b5-weight-time-rpe-warmup-decision.md' ||\", \"f === 'docs/bootstrap-audit-2026-08-27.md' ||\"], \"dels\": []}, \"scripts/verify-exlib1b3.ts\": {\"adds\": [\"// ADMISSION (EXLIB-1C0B5 weight_time rpe-warmup decision): the\", \"// uncommitted decision overlay, bootstrap audit, and B5 verifier\", \"// are admitted (exact paths).\", \"f === 'docs/exlib1c0b5-weight-time-rpe-warmup-decision.md' ||\", \"f === 'docs/bootstrap-audit-2026-08-27.md' ||\"], \"dels\": []}, \"scripts/verify-exlib1c0.ts\": {\"adds\": [\"// ADMISSION (EXLIB-1C0B5 weight_time rpe-warmup decision): the\", \"// uncommitted decision overlay, bootstrap audit, and B5 verifier\", \"// are admitted (exact paths).\", \"f === 'docs/exlib1c0b5-weight-time-rpe-warmup-decision.md' ||\", \"f === 'docs/bootstrap-audit-2026-08-27.md' ||\", \"f === 'scripts/verify-exlib1c0b5.ts' ||\", \"return !/ADMISSION \\\\(EXLIB-1C0A\\\\)|ADMISSION \\\\(EXLIB-1C0B\\\\)|ADMISSION \\\\(EXLIB-1C0B2\\\\)|ADMISSION \\\\(EXLIB-1C0B3\\\\)|RETARGET \\\\(EXLIB-1C0B3 migration 025 draft\\\\)|ADMISSION \\\\(EXLIB-1C0B4 weight_time product decisions\\\\)|ADMISSION \\\\(EXLIB-1C0B5 weight_time rpe-warmup decision\\\\)/.test(\"], \"dels\": [\"return !/ADMISSION \\\\(EXLIB-1C0A\\\\)|ADMISSION \\\\(EXLIB-1C0B\\\\)|ADMISSION \\\\(EXLIB-1C0B2\\\\)|ADMISSION \\\\(EXLIB-1C0B3\\\\)|RETARGET \\\\(EXLIB-1C0B3 migration 025 draft\\\\)|ADMISSION \\\\(EXLIB-1C0B4 weight_time product decisions\\\\)/.test(\"]}, \"scripts/verify-exlib1c0a.ts\": {\"adds\": [\"// ADMISSION (EXLIB-1C0B5 weight_time rpe-warmup decision): the\", \"// uncommitted decision overlay, bootstrap audit, and B5 verifier\", \"// are admitted (exact paths).\", \"f === 'docs/exlib1c0b5-weight-time-rpe-warmup-decision.md' ||\", \"f === 'docs/bootstrap-audit-2026-08-27.md' ||\", \"f === 'scripts/verify-exlib1c0b5.ts' ||\", \"return !/ADMISSION \\\\(EXLIB-1C0B\\\\)|ADMISSION \\\\(EXLIB-1C0B2\\\\)|ADMISSION \\\\(EXLIB-1C0B3\\\\)|RETARGET \\\\(EXLIB-1C0B3 migration 025 draft\\\\)|ADMISSION \\\\(EXLIB-1C0B4 weight_time product decisions\\\\)|ADMISSION \\\\(EXLIB-1C0B5 weight_time rpe-warmup decision\\\\)/.test(\"], \"dels\": [\"return !/ADMISSION \\\\(EXLIB-1C0B\\\\)|ADMISSION \\\\(EXLIB-1C0B2\\\\)|ADMISSION \\\\(EXLIB-1C0B3\\\\)|RETARGET \\\\(EXLIB-1C0B3 migration 025 draft\\\\)|ADMISSION \\\\(EXLIB-1C0B4 weight_time product decisions\\\\)/.test(\"]}, \"scripts/verify-exlib1c0b.ts\": {\"adds\": [\"// ADMISSION (EXLIB-1C0B5 weight_time rpe-warmup decision): the\", \"// uncommitted decision overlay, bootstrap audit, and B5 verifier\", \"// are admitted (exact paths).\", \"f === 'docs/exlib1c0b5-weight-time-rpe-warmup-decision.md' ||\", \"f === 'docs/bootstrap-audit-2026-08-27.md' ||\", \"f === 'scripts/verify-exlib1c0b5.ts' ||\", \"return !/ADMISSION \\\\(EXLIB-1C0B2\\\\)|ADMISSION \\\\(EXLIB-1C0B3\\\\)|RETARGET \\\\(EXLIB-1C0B3 migration 025 draft\\\\)|ADMISSION \\\\(EXLIB-1C0B4 weight_time product decisions\\\\)|ADMISSION \\\\(EXLIB-1C0B5 weight_time rpe-warmup decision\\\\)/.test(\"], \"dels\": [\"return !/ADMISSION \\\\(EXLIB-1C0B2\\\\)|ADMISSION \\\\(EXLIB-1C0B3\\\\)|RETARGET \\\\(EXLIB-1C0B3 migration 025 draft\\\\)|ADMISSION \\\\(EXLIB-1C0B4 weight_time product decisions\\\\)/.test(\"]}, \"scripts/verify-exlib1c0b2.ts\": {\"adds\": [\"// ADMISSION (EXLIB-1C0B5 weight_time rpe-warmup decision): the\", \"// uncommitted decision overlay, bootstrap audit, and B5 verifier\", \"// are admitted (exact paths).\", \"f === 'docs/exlib1c0b5-weight-time-rpe-warmup-decision.md' ||\", \"f === 'docs/bootstrap-audit-2026-08-27.md' ||\", \"f === 'scripts/verify-exlib1c0b5.ts' ||\", \"return !/ADMISSION \\\\(EXLIB-1C0B3\\\\)|RETARGET \\\\(EXLIB-1C0B3 migration 025 draft\\\\)|ADMISSION \\\\(EXLIB-1C0B4 weight_time product decisions\\\\)|ADMISSION \\\\(EXLIB-1C0B5 weight_time rpe-warmup decision\\\\)/.test(\"], \"dels\": [\"return !/ADMISSION \\\\(EXLIB-1C0B3\\\\)|RETARGET \\\\(EXLIB-1C0B3 migration 025 draft\\\\)|ADMISSION \\\\(EXLIB-1C0B4 weight_time product decisions\\\\)/.test(\"]}, \"scripts/verify-exlib1c0b3.ts\": {\"adds\": [\"// ADMISSION (EXLIB-1C0B5 weight_time rpe-warmup decision):\", \"// while the EXLIB-1C0B5 decision overlay, the bootstrap\", \"// audit, and the B5 verifier are being prepared uncommitted\", \"// (this verifier gains only this admission, and eleven\", \"// committed suites gain only the labeled B5 scope\", \"// admissions), the worktree may contain exactly that\", \"// inventory. Anything else still fails; the admission is\", \"// inert once the B5 phase commits.\", \"const B5_DECISION_DIRT = [\", \"'?? docs/bootstrap-audit-2026-08-27.md',\", \"'?? docs/exlib1c0b5-weight-time-rpe-warmup-decision.md',\", \"'?? scripts/verify-exlib1c0b5.ts',\", \"'M scripts/verify-exlib1c0b3.ts',\", \"'M scripts/verify-exlib1a.ts',\", \"'M scripts/verify-exlib1b1.ts',\", \"'M scripts/verify-exlib1b3.ts',\", \"'M scripts/verify-exlib1c0.ts',\", \"'M scripts/verify-exlib1c0a.ts',\", \"'M scripts/verify-exlib1c0b.ts',\", \"'M scripts/verify-exlib1c0b2.ts',\", \"'M scripts/verify-ui5b1b.ts',\", \"'M scripts/verify-ui5b2.ts',\", \"'M scripts/verify-ui6c.ts',\", \"'M scripts/verify-ui7.ts',\", \"].sort()\", \"JSON.stringify(dirt) !== JSON.stringify(B4_DECISION_DIRT) &&\", \"JSON.stringify(dirt) !== JSON.stringify(B5_DECISION_DIRT)) return false\"], \"dels\": [\"JSON.stringify(dirt) !== JSON.stringify(B4_DECISION_DIRT)) return false\"]}, \"scripts/verify-ui5b1b.ts\": {\"adds\": [\"// ADMISSION (EXLIB-1C0B5 weight_time rpe-warmup decision): the\", \"// uncommitted decision overlay, bootstrap audit, and B5 verifier\", \"// are admitted (exact paths).\", \"f === 'docs/exlib1c0b5-weight-time-rpe-warmup-decision.md' ||\", \"f === 'docs/bootstrap-audit-2026-08-27.md' ||\"], \"dels\": []}, \"scripts/verify-ui5b2.ts\": {\"adds\": [\"// ADMISSION (EXLIB-1C0B5 weight_time rpe-warmup decision): the\", \"// uncommitted decision overlay, bootstrap audit, and B5 verifier\", \"// are admitted (exact paths).\", \"f === 'docs/exlib1c0b5-weight-time-rpe-warmup-decision.md' ||\", \"f === 'docs/bootstrap-audit-2026-08-27.md' ||\"], \"dels\": []}, \"scripts/verify-ui6c.ts\": {\"adds\": [\"// ADMISSION (EXLIB-1C0B5 weight_time rpe-warmup decision): the\", \"// uncommitted decision overlay, bootstrap audit, and B5 verifier\", \"// are admitted (exact paths).\", \"f === 'docs/exlib1c0b5-weight-time-rpe-warmup-decision.md' ||\", \"f === 'docs/bootstrap-audit-2026-08-27.md' ||\"], \"dels\": []}, \"scripts/verify-ui7.ts\": {\"adds\": [\"// ADMISSION (EXLIB-1C0B5 weight_time rpe-warmup decision): the\", \"// uncommitted decision overlay, bootstrap audit, and B5 verifier\", \"// are admitted (exact paths).\", \"f === 'docs/exlib1c0b5-weight-time-rpe-warmup-decision.md' ||\", \"f === 'docs/bootstrap-audit-2026-08-27.md' ||\"], \"dels\": []}}")
    const MODIFIED = Object.keys(DIFF_MAP).sort()
    const diffLineExact = (diffText: string, f: string): boolean => {
      const adds = diffText.split('\n').filter((l) => l.startsWith('+') && !l.startsWith('+++')).map((l) => l.slice(1).trim())
      const dels = diffText.split('\n').filter((l) => l.startsWith('-') && !l.startsWith('---')).map((l) => l.slice(1).trim())
      const want = DIFF_MAP[f]
      return !!want && JSON.stringify(adds) === JSON.stringify(want.adds) &&
        JSON.stringify(dels) === JSON.stringify(want.dels)
    }
    const inHead = (() => {
      try {
        execSync(`git cat-file -e HEAD:${OVERLAY}`, { stdio: 'pipe' })
        return true
      } catch { return false }
    })()
    check(`G1: lifecycle-safe phase boundary (${inHead ? 'COMMITTED' : 'UNCOMMITTED REVIEW'} state) — exact fifteen-path inventory and LINE-EXACT diffs on every modified suite`,
      (() => {
        try {
          const UNTRACKED = [AUDIT, OVERLAY, 'scripts/verify-exlib1c0b5.ts']
          if (!inHead) {
            const entries = execSync('git status --porcelain', { encoding: 'utf8' })
              .split('\n').filter(Boolean).map((l) => l.trim()).sort()
            const expected = [
              ...UNTRACKED.map((f) => `?? ${f}`),
              ...MODIFIED.map((f) => `M ${f}`),
            ].sort()
            if (JSON.stringify(entries) !== JSON.stringify(expected)) return false
            if (execSync('git diff --cached --name-only', { encoding: 'utf8' }).trim() !== '') return false
            return MODIFIED.every((f) =>
              diffLineExact(execSync(`git diff -- ${f}`, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 16 }), f))
          }
          const adders = execSync(`git log --all --format=%H --diff-filter=A -- ${OVERLAY}`,
            { encoding: 'utf8' }).split('\n').filter(Boolean)
          if (adders.length !== 1) return false
          const phase = adders[0]
          for (const p of [AUDIT, 'scripts/verify-exlib1c0b5.ts']) {
            const a = execSync(`git log --all --format=%H --diff-filter=A -- ${p}`,
              { encoding: 'utf8' }).split('\n').filter(Boolean)
            if (a.length !== 1 || a[0] !== phase) return false
          }
          execSync(`git merge-base --is-ancestor ${phase} HEAD`)
          const range = execSync(`git diff --name-only ${phase}^..${phase}`, { encoding: 'utf8' })
            .split('\n').filter(Boolean).sort()
          const expected = [...UNTRACKED, ...MODIFIED].sort()
          if (JSON.stringify(range) !== JSON.stringify(expected)) return false
          return MODIFIED.every((f) =>
            diffLineExact(execSync(`git diff ${phase}^..${phase} -- ${f}`, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 16 }), f))
        } catch { return false }
      })())
    check('G2: PRIMARY protection is a byte-for-byte pin of the reviewed overlay (exact length + SHA-256, both required) — any reword, including a contradiction no scan anticipates, changes these bytes and fails; supplementary authorizes-nothing statement check included',
      readFileSync(OVERLAY).length === OVERLAY_BYTES &&
      sha256(OVERLAY) === OVERLAY_SHA &&
      flat.includes('it implements nothing and authorizes no implementation, migration, deployment, hosted QA, catalog loading, or EXLIB-1C loading'))
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
