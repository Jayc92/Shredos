// EXLIB-1C0B4 verifier — weight_time product decisions 1-4
// (PRODUCT-DECISION RECORD ONLY).
//
// Proves: Joseph's four explicit 2026-08-27 selections and their
// exact semantics; decisions CLOSED with product direction APPROVED;
// implementation and migration 026 remain unauthorized; weight_time
// remains absent from executable product code; migration 025 and all
// prior protected artifacts remain byte-identical; ledger 48/48
// pending-null; 26/26 candidates import-ineligible; catalog and
// EXLIB-1C loading remain unauthorized; and the prior committed OPEN
// statements carry a durable dated supersession pointer WITHOUT any
// byte change to the approved historical artifacts.
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

const RECORD = 'docs/exlib1c0b4-weight-time-product-decisions.md'
const B2_RECORD = 'docs/exlib1c0b2-equipment-release-product-decisions.md'
const B1_AUDIT = 'docs/exlib1c0b-schema-vocabulary-impact-audit.md'
const B2_RECORD_SHA = '6b9e813ad625cb21a8be5a4992d94da7d45f149f3e824388190bb0292da1e64d'
const M025_FILE = 'supabase/migrations/025_exlib_equipment_vocabulary_support.sql'
const M025_SHA = 'fbda16f4d25cacd1715b199050506a4da15896355d96700876b76c68826d304c'
// Established via the orchestrator's read-only `wc -c` / `shasum -a
// 256` run against the finalized record (see verification evidence).
const RECORD_BYTES = 5973
const RECORD_SHA = '12fe23d37ee075c66c62dc1ad11b18fadf29ccd907525b2b9dabf7055feaa4aa'

const rec = read(RECORD)
const flat = rec.replace(/\s+/g, ' ')

async function main(): Promise<void> {
  console.log('EXLIB-1C0B4 verification (weight_time product decisions)')

  console.log('\nA. Record status and supersession')
  {
    check('A1: record status block — decisions CLOSED (2026-08-27), direction APPROVED, implementation NOT AUTHORIZED, migration 026 NOT AUTHORED/NOT AUTHORIZED, coordinated plan required, loading prohibitions and frozen ledger stated',
      flat.includes('PRODUCT-DECISION RECORD ONLY') &&
      flat.includes('Decided explicitly by Joseph Carfagno on 2026-08-27') &&
      flat.includes('Decisions 1-4: **CLOSED** (2026-08-27)') &&
      flat.includes('Product direction: **APPROVED**') &&
      flat.includes('Implementation: **NOT AUTHORIZED**') &&
      flat.includes('Migration 026: **NOT AUTHORED and NOT AUTHORIZED**') &&
      flat.includes('separately reviewed coordinated plan') &&
      flat.includes('No catalog loading') &&
      flat.includes('48/48 pending-null') &&
      flat.includes('remain `import_eligible: false`') &&
      flat.includes('No EXLIB-1C loading authorization') &&
      flat.includes('13a8d82330709338c86e5697250de8fa7fd0fa77') &&
      flat.includes('43c094b2c550aed7453a23d3b85880f7e8858478') &&
      flat.includes(B2_RECORD_SHA))
    check('A2: durable dated supersession — the record names EVERY committed OPEN statement exactly (B2 section + status row; B1 audit OPEN PRODUCT DECISION markers), NARROWS item 4 to only the sub-question Decision 1 actually answers while leaving the RPE/warmup permission sub-question explicitly OPEN, the historical artifacts remain byte-identical, and their audit findings are declared preserved',
      flat.includes('Dated supersession pointer (2026-08-27)') &&
      flat.includes(B2_RECORD) &&
      flat.includes('"Decisions 1-4 — weight_time: OPEN, deferred"') &&
      flat.includes('"| Decisions 1-4 (weight_time) | OPEN, deferred |"') &&
      flat.includes(B1_AUDIT) &&
      flat.includes('"OPEN PRODUCT DECISION" markers for empty/zero/partial semantics, legacy exercise_type derivation, and records participation (product-contract analysis items 5, 7 and 8, and consumer row C16) are superseded in full') &&
      flat.includes('Its item 4 (field contract) is superseded ONLY for the narrow sub-question Decision 1 below actually answers') &&
      flat.includes("that `weight_time` reuses `weight_kg` and `duration_seconds` and excludes `reps`") &&
      flat.includes("and remains OPEN, unchanged and unresolved, for whether `rpe`, a warmup flag, or any other field is permitted") &&
      flat.includes('that sub-question is NOT superseded') &&
      flat.includes('only the specific sub-questions decisions 1-4 actually answer have their OPEN status superseded') &&
      flat.includes("item 4's RPE/warmup permission sub-question is explicitly excluded from supersession and remains OPEN") &&
      flat.includes('intentionally left byte-identical') &&
      flat.includes('consumer audits and hazard findings') &&
      flat.includes('preserved unchanged') &&
      sha256(B2_RECORD) === B2_RECORD_SHA &&
      sha256(B1_AUDIT) === '0d4447142735b29c987e792a8ed3331f19b38c4ae9eb5225d77e7fcf5cff6c5e' &&
      read(B2_RECORD).includes('### Decisions 1-4 — weight_time: OPEN, deferred') &&
      read(B2_RECORD).includes('| Decisions 1-4 (weight_time) | OPEN, deferred |') &&
      (read(B1_AUDIT).match(/OPEN PRODUCT DECISION/g) || []).length === 5)
  }

  console.log('\nB. The four decisions — exact selected options and semantics')
  {
    check('B1: decision 1 = OPTION A tracking-field contract — reuse weight_kg (external/added, not body weight) + duration_seconds (hold duration), reps null/absent, labels "Added weight"/"Duration", no combined storage score, RPE/warmup/other fields explicitly left undecided (not invented)',
      flat.includes('Decision 1 — tracking-field contract: OPTION A (CLOSED)') &&
      flat.includes('Add a distinct `weight_time` tracking method') &&
      flat.includes('Reuse existing `weight_kg` and `duration_seconds` storage fields') &&
      flat.includes("`weight_kg` represents external/added weight, not the user's body weight") &&
      flat.includes('`duration_seconds` represents completed hold duration') &&
      flat.includes('`reps` is not part of this tracking method and remains null/absent') &&
      flat.includes('User-facing labels are "Added weight" and "Duration."') &&
      flat.includes('No combined weight-time storage score is authorized') &&
      flat.includes('The bullets above are the entirety of Decision 1, and only they are CLOSED') &&
      flat.includes("is OUTSIDE Decision 1's scope: this record does not decide, permit, or forbid such a field") &&
      flat.includes('remains an OPEN PRODUCT DECISION, exactly as before and unresolved by this record') &&
      !flat.includes('optional fields such as notes and RPE may remain available') &&
      !flat.includes('This record decides nothing about RPE, warmup, distance, or any field beyond'))
    check('B2: decision 2 = OPTION A completion/zero semantics — both values required, weight_kg >= 0, duration_seconds > 0, zero weight = intentional unweighted baseline, zero duration invalid, negatives invalid, null weight != zero, null duration incomplete, partial entry never completes, fail closed, edits reevaluate records',
      flat.includes('Decision 2 — completion and zero semantics: OPTION A (CLOSED)') &&
      flat.includes('A completed set requires both values to be present') &&
      flat.includes('`weight_kg >= 0`') &&
      flat.includes('`duration_seconds > 0`') &&
      flat.includes('Zero added weight is valid and means an intentional unweighted baseline') &&
      flat.includes('Zero duration is invalid') &&
      flat.includes('Negative values are invalid') &&
      flat.includes('Null/omitted weight is not equivalent to zero') &&
      flat.includes('Null/omitted duration is incomplete') &&
      flat.includes('Partially entered information must not count as a completed set') &&
      flat.includes('Completion attempts with invalid or incomplete values must fail closed') &&
      flat.includes('Editing a completed set must cause affected record status to be reevaluated'))
    check("B3: decision 3 = OPTION A legacy classification — explicit exercise_type='strength' derivation branch (never an accidental CASE fallback), behavior branches on tracking_type='weight_time', no weight-and-reps assumption for strength, no hybrid type",
      flat.includes('Decision 3 — legacy classification: OPTION A (CLOSED)') &&
      flat.includes("`weight_time` exercises explicitly derive broad legacy `exercise_type='strength'`") &&
      flat.includes('intentional branch, not an accidental CASE fallback') &&
      flat.includes("branch on `tracking_type='weight_time'`") &&
      flat.includes('Consumers must not assume every strength exercise uses weight and reps') &&
      flat.includes('No new `hybrid` exercise type is approved'))
    check('B4: decision 4 = OPTION C records/progression — two-dimensional frontier model, no combined scalar, contextual achievements (longest hold w/ weight, heaviest hold w/ duration, frontier PR), strict frontier-improvement and tie rules, one-dimension-at-a-time progression, conservative reset, exact neutral guidance, no heavier-is-universally-better claim',
      flat.includes('Decision 4 — records and progression: OPTION C (CLOSED)') &&
      flat.includes('Use a two-dimensional weight/duration record model') &&
      flat.includes('Do not create or display one combined scalar score such as weight x time') &&
      flat.includes('longest hold, displaying its associated weight') &&
      flat.includes('heaviest hold, displaying its associated duration') &&
      flat.includes('a weight-time PR when a performance improves the two-dimensional record frontier') &&
      flat.includes('A performance is frontier-improving only when no prior performance is equal or better in both weight and duration') &&
      flat.includes('Ties require an improvement in the other dimension') &&
      flat.includes('Progression should generally change one dimension at a time') &&
      flat.includes('At the same weight, recognize increased duration') &&
      flat.includes('progression may recommend the next available weight with a conservative duration reset') &&
      flat.includes('"Try holding this weight slightly longer."') &&
      flat.includes('"When this duration feels controlled, try the next available weight."') &&
      flat.includes('Never claim that a heavier but dramatically shorter hold is universally better'))
  }

  console.log('\nC. Frozen implementation boundary')
  {
    check('C1: migration files are EXACTLY the numeric sequence 001-025 (no gap, no duplicate, no 026+), and 025 is byte-identical',
      (() => {
        const files = readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).sort()
        const prefixes = files.map((f) => {
          const m = f.match(/^(\d{3})_/)
          return m ? parseInt(m[1], 10) : NaN
        })
        // RETARGET (EXLIB-2F migration 026 apply-prep candidate): the
        // reviewed 026 candidate extends the exact numeric sequence to
        // 001-026 (PREPARED, NOT APPLIED); no gap, no duplicate, no 027+.
        const expected = Array.from({ length: 26 }, (_, i) => i + 1)
        return files.length === 26 &&
          !prefixes.some((n) => Number.isNaN(n)) &&
          JSON.stringify(prefixes) === JSON.stringify(expected) &&
          files.filter((f) => f.startsWith('026')).length === 1 &&
          files[25] === '026_exlib_plank_seed_reconciliation.sql' &&
          files.filter((f) => f.startsWith('027')).length === 0 &&
          files[24] === '025_exlib_equipment_vocabulary_support.sql' &&
          sha256(M025_FILE) === M025_SHA
      })())
    check('C2: weight_time remains absent from every file under src/ — direct recursive enumeration and read, fail-closed on any filesystem error (no grep, no swallowed exit code)',
      (() => {
        const walk = (dir: string): string[] =>
          readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
            const p = `${dir}/${e.name}`
            return e.isDirectory() ? walk(p) : [p]
          })
        try {
          const files = walk('src')
          return files.length > 0 &&
            files.every((f) => !readFileSync(f, 'utf8').includes('weight_time'))
        } catch {
          return false
        }
      })())
    check('C3: prior protected artifacts remain byte-identical — live suite, guard, implementation record, application record, manifest, ledger',
      /* RETARGET (EXLIB-2F): the 1C0B3 live suite gained a narrow labeled 026-exclusion so its exactly-001-025 claim stays true now that the reviewed apply-prep candidate exists; pin moves to the revised bytes. */ sha256('scripts/verify-exlib1c0b3-live.sh') === 'eb1b46e941303e0ae7300e4527703753323025712d5c03463733b213f939f6ac' &&
      sha256('scripts/verify-exlib1c0b3-guard.sh') === 'f5fcda9ef95b4743f8e4009d5a1330289e046d20cc524e944a8d2e91c53b06a4' &&
      sha256('docs/exlib1c0b3-coordinated-equipment-implementation.md') === 'da5e42379ace7ef199f73a23a230b32a97c52ccc972118837535abdb1a1ed1eb' &&
      sha256('docs/exlib1c0b3-application-deployment-hosted-qa-record.md') === '7ef2080a8949da5bafb350957fb3b364e472e75f05a300a0ff560b50cc5aa3df' &&
      sha256('docs/exlib1a-discovery-manifest.jsonl') === '336cd4253f747cdb3ba73ffa2af5a63e255c7c87cc452d4c43ed59a654673dfa' &&
      sha256('docs/exlib1b1-review-ledger.jsonl') === 'aa4fe77c0c633510661eede94b40e9bae4aca90a7d8c2794abde92c83c6f7b7b')
    check('C4: ledger mechanically 48/48 pending-null, 26/26 candidates import-ineligible, and no importer artifacts',
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
    // phase: verify-exlib1c0b3.ts gains exactly the narrow
    // EXLIB-1C0B4 dirt admission inside its committed G1 branch, and
    // eleven committed suites gain only the labeled EXLIB-1C0B4
    // scope admissions (ADMISSION (EXLIB-1C0B4 weight_time product
    // decisions)). Generated mechanically from the reviewed worktree
    // diff; lines trimmed, in file order.
    const DIFF_MAP: Record<string, { adds: string[]; dels: string[] }> =
      JSON.parse("{\"scripts/verify-exlib1a.ts\": {\"adds\": [\"// ADMISSION (EXLIB-1C0B4 weight_time product decisions):\", \"// the uncommitted decision record is admitted.\", \"f === 'docs/exlib1c0b4-weight-time-product-decisions.md' ||\"], \"dels\": []}, \"scripts/verify-exlib1b1.ts\": {\"adds\": [\"// ADMISSION (EXLIB-1C0B4 weight_time product decisions):\", \"// the uncommitted decision record is admitted.\", \"f === 'docs/exlib1c0b4-weight-time-product-decisions.md' ||\"], \"dels\": []}, \"scripts/verify-exlib1b3.ts\": {\"adds\": [\"// ADMISSION (EXLIB-1C0B4 weight_time product decisions):\", \"// the uncommitted decision record is admitted.\", \"f === 'docs/exlib1c0b4-weight-time-product-decisions.md' ||\"], \"dels\": []}, \"scripts/verify-exlib1c0.ts\": {\"adds\": [\"// ADMISSION (EXLIB-1C0B4 weight_time product decisions):\", \"// the uncommitted decision record is admitted.\", \"f === 'docs/exlib1c0b4-weight-time-product-decisions.md' ||\", \"f === 'scripts/verify-exlib1c0b4.ts' ||\", \"return !/ADMISSION \\\\(EXLIB-1C0A\\\\)|ADMISSION \\\\(EXLIB-1C0B\\\\)|ADMISSION \\\\(EXLIB-1C0B2\\\\)|ADMISSION \\\\(EXLIB-1C0B3\\\\)|RETARGET \\\\(EXLIB-1C0B3 migration 025 draft\\\\)|ADMISSION \\\\(EXLIB-1C0B4 weight_time product decisions\\\\)/.test(\"], \"dels\": [\"return !/ADMISSION \\\\(EXLIB-1C0A\\\\)|ADMISSION \\\\(EXLIB-1C0B\\\\)|ADMISSION \\\\(EXLIB-1C0B2\\\\)|ADMISSION \\\\(EXLIB-1C0B3\\\\)|RETARGET \\\\(EXLIB-1C0B3 migration 025 draft\\\\)/.test(\"]}, \"scripts/verify-exlib1c0a.ts\": {\"adds\": [\"// ADMISSION (EXLIB-1C0B4 weight_time product decisions):\", \"// the uncommitted decision record is admitted.\", \"f === 'docs/exlib1c0b4-weight-time-product-decisions.md' ||\", \"f === 'scripts/verify-exlib1c0b4.ts' ||\", \"return !/ADMISSION \\\\(EXLIB-1C0B\\\\)|ADMISSION \\\\(EXLIB-1C0B2\\\\)|ADMISSION \\\\(EXLIB-1C0B3\\\\)|RETARGET \\\\(EXLIB-1C0B3 migration 025 draft\\\\)|ADMISSION \\\\(EXLIB-1C0B4 weight_time product decisions\\\\)/.test(\"], \"dels\": [\"return !/ADMISSION \\\\(EXLIB-1C0B\\\\)|ADMISSION \\\\(EXLIB-1C0B2\\\\)|ADMISSION \\\\(EXLIB-1C0B3\\\\)|RETARGET \\\\(EXLIB-1C0B3 migration 025 draft\\\\)/.test(\"]}, \"scripts/verify-exlib1c0b.ts\": {\"adds\": [\"// ADMISSION (EXLIB-1C0B4 weight_time product decisions):\", \"// the uncommitted decision record is admitted.\", \"f === 'docs/exlib1c0b4-weight-time-product-decisions.md' ||\", \"f === 'scripts/verify-exlib1c0b4.ts' ||\", \"return !/ADMISSION \\\\(EXLIB-1C0B2\\\\)|ADMISSION \\\\(EXLIB-1C0B3\\\\)|RETARGET \\\\(EXLIB-1C0B3 migration 025 draft\\\\)|ADMISSION \\\\(EXLIB-1C0B4 weight_time product decisions\\\\)/.test(\"], \"dels\": [\"return !/ADMISSION \\\\(EXLIB-1C0B2\\\\)|ADMISSION \\\\(EXLIB-1C0B3\\\\)|RETARGET \\\\(EXLIB-1C0B3 migration 025 draft\\\\)/.test(\"]}, \"scripts/verify-exlib1c0b2.ts\": {\"adds\": [\"// ADMISSION (EXLIB-1C0B4 weight_time product decisions):\", \"// the uncommitted decision record is admitted.\", \"f === 'docs/exlib1c0b4-weight-time-product-decisions.md' ||\", \"f === 'scripts/verify-exlib1c0b4.ts' ||\", \"return !/ADMISSION \\\\(EXLIB-1C0B3\\\\)|RETARGET \\\\(EXLIB-1C0B3 migration 025 draft\\\\)|ADMISSION \\\\(EXLIB-1C0B4 weight_time product decisions\\\\)/.test(\"], \"dels\": [\"return !/ADMISSION \\\\(EXLIB-1C0B3\\\\)|RETARGET \\\\(EXLIB-1C0B3 migration 025 draft\\\\)/.test(\"]}, \"scripts/verify-exlib1c0b3.ts\": {\"adds\": [\"// ADMISSION (EXLIB-1C0B4 weight_time product decisions):\", \"// while the EXLIB-1C0B4 decision record and its focused\", \"// verifier are being prepared uncommitted (this verifier\", \"// gains only this admission, and eleven committed suites\", \"// gain only the labeled B4 scope admissions), the worktree\", \"// may contain exactly that inventory. Anything else still\", \"// fails; the admission is inert once the B4 phase commits.\", \"const B4_DECISION_DIRT = [\", \"'?? docs/exlib1c0b4-weight-time-product-decisions.md',\", \"'?? scripts/verify-exlib1c0b4.ts',\", \"'M scripts/verify-exlib1c0b3.ts',\", \"'M scripts/verify-exlib1a.ts',\", \"'M scripts/verify-exlib1b1.ts',\", \"'M scripts/verify-exlib1b3.ts',\", \"'M scripts/verify-exlib1c0.ts',\", \"'M scripts/verify-exlib1c0a.ts',\", \"'M scripts/verify-exlib1c0b.ts',\", \"'M scripts/verify-exlib1c0b2.ts',\", \"'M scripts/verify-ui5b1b.ts',\", \"'M scripts/verify-ui5b2.ts',\", \"'M scripts/verify-ui6c.ts',\", \"'M scripts/verify-ui7.ts',\", \"].sort()\", \"JSON.stringify(dirt) !== JSON.stringify(APP_RECORD_DIRT) &&\", \"JSON.stringify(dirt) !== JSON.stringify(B4_DECISION_DIRT)) return false\"], \"dels\": [\"JSON.stringify(dirt) !== JSON.stringify(APP_RECORD_DIRT)) return false\"]}, \"scripts/verify-ui5b1b.ts\": {\"adds\": [\"// ADMISSION (EXLIB-1C0B4 weight_time product decisions):\", \"// the uncommitted decision record is admitted.\", \"f === 'docs/exlib1c0b4-weight-time-product-decisions.md' ||\"], \"dels\": []}, \"scripts/verify-ui5b2.ts\": {\"adds\": [\"// ADMISSION (EXLIB-1C0B4 weight_time product decisions):\", \"// the uncommitted decision record is admitted.\", \"f === 'docs/exlib1c0b4-weight-time-product-decisions.md' ||\"], \"dels\": []}, \"scripts/verify-ui6c.ts\": {\"adds\": [\"// ADMISSION (EXLIB-1C0B4 weight_time product decisions):\", \"// the uncommitted decision record is admitted.\", \"f === 'docs/exlib1c0b4-weight-time-product-decisions.md' ||\"], \"dels\": []}, \"scripts/verify-ui7.ts\": {\"adds\": [\"// ADMISSION (EXLIB-1C0B4 weight_time product decisions):\", \"// the uncommitted decision record is admitted.\", \"f === 'docs/exlib1c0b4-weight-time-product-decisions.md' ||\"], \"dels\": []}}")
    const MODIFIED = Object.keys(DIFF_MAP).sort()
    const diffLineExact = (diffText: string, f: string): boolean => {
      const adds = diffText.split('\n').filter((l) => l.startsWith('+') && !l.startsWith('+++')).map((l) => l.slice(1).trim())
      const dels = diffText.split('\n').filter((l) => l.startsWith('-') && !l.startsWith('---')).map((l) => l.slice(1).trim())
      const want = DIFF_MAP[f]
      return !!want && JSON.stringify(adds) === JSON.stringify(want.adds) &&
        JSON.stringify(dels) === JSON.stringify(want.dels)
    }
    const recInHead = (() => {
      try {
        execSync(`git cat-file -e HEAD:${RECORD}`, { stdio: 'pipe' })
        return true
      } catch { return false }
    })()
    check(`G1: lifecycle-safe phase boundary (${recInHead ? 'COMMITTED' : 'UNCOMMITTED REVIEW'} state) — exact inventory and LINE-EXACT diffs on every modified suite`,
      (() => {
        try {
          const UNTRACKED = [RECORD, 'scripts/verify-exlib1c0b4.ts']
          if (!recInHead) {
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
          const adders = execSync(`git log --all --format=%H --diff-filter=A -- ${RECORD}`,
            { encoding: 'utf8' }).split('\n').filter(Boolean)
          if (adders.length !== 1) return false
          const phase = adders[0]
          const vAdders = execSync('git log --all --format=%H --diff-filter=A -- scripts/verify-exlib1c0b4.ts',
            { encoding: 'utf8' }).split('\n').filter(Boolean)
          if (vAdders.length !== 1 || vAdders[0] !== phase) return false
          execSync(`git merge-base --is-ancestor ${phase} HEAD`)
          const range = execSync(`git diff --name-only ${phase}^..${phase}`, { encoding: 'utf8' })
            .split('\n').filter(Boolean).sort()
          const expected = [...UNTRACKED, ...MODIFIED].sort()
          if (JSON.stringify(range) !== JSON.stringify(expected)) return false
          return MODIFIED.every((f) =>
            diffLineExact(execSync(`git diff ${phase}^..${phase} -- ${f}`, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 16 }), f))
        } catch { return false }
      })())
    check('G2: PRIMARY protection is a byte-for-byte pin of the independently reviewed record (exact length + SHA-256, both required) — this is what actually rules out ANY textual contradiction, including forms a natural-language scan would miss (e.g. "Implementation is authorized", "Migration 026 approved", "Catalog loading is approved"). The supplementary checks below (strict Status-bullet parse, an AUTHORIZED-must-follow-"NOT " scan, and topic-absence for deployment/hosted-contact) are defense-in-depth, NOT a claim of exhaustive natural-language detection',
      (() => {
        // PRIMARY: the byte pin. Any change to the record — including
        // a contradiction phrased in a way no regex below anticipates
        // — changes these bytes and fails this check. This is the
        // only check in this file that cannot be evaded by rewording.
        const bytePinOk = readFileSync(RECORD).length === RECORD_BYTES &&
          sha256(RECORD) === RECORD_SHA
        // SUPPLEMENTARY, not exhaustive: strict parse of every
        // "- Label: **VALUE**" bullet in the Status section against
        // an exact expected map. Catches a duplicate/missing label or
        // a changed VALUE (e.g. "Implementation: **AUTHORIZED**") in
        // that specific bolded form, but — unlike the byte pin above —
        // does not catch every unbolded or reworded contradiction.
        const statusStart = rec.indexOf('## Status')
        const statusEnd = rec.indexOf('## Supersession')
        const statusSection = statusStart !== -1 && statusEnd !== -1 && statusEnd > statusStart
          ? rec.slice(statusStart, statusEnd) : ''
        const bulletRe = /^-\s*([^:*\n]+):\s*\*\*([^*]+)\*\*/gm
        const found: Record<string, string[]> = {}
        let bm: RegExpExecArray | null
        while ((bm = bulletRe.exec(statusSection)) !== null) {
          const label = bm[1].trim()
          found[label] = [...(found[label] || []), bm[2].trim()]
        }
        const EXPECTED: Record<string, string> = {
          'Decisions 1-4': 'CLOSED',
          'Product direction': 'APPROVED',
          'Implementation': 'NOT AUTHORIZED',
          'Migration 026': 'NOT AUTHORED and NOT AUTHORIZED',
        }
        const labelsOk = statusSection !== '' &&
          Object.keys(EXPECTED).every((label) =>
            found[label]?.length === 1 && found[label][0] === EXPECTED[label]) &&
          Object.keys(found).length === Object.keys(EXPECTED).length
        // SUPPLEMENTARY: the bare word AUTHORIZED must never appear
        // unless the 4 characters immediately before it are "NOT " —
        // catches an injected bolded-or-not "...AUTHORIZED" token
        // ANYWHERE, but (as the director noted) NOT lowercase/synonym
        // forms like "is authorized" or "approved" outside this exact
        // token; those are covered only by the byte pin above.
        const authRe = /AUTHORIZED/g
        let am: RegExpExecArray | null
        let authGuardOk = true
        while ((am = authRe.exec(flat)) !== null) {
          if (flat.slice(Math.max(0, am.index - 4), am.index) !== 'NOT ') { authGuardOk = false; break }
        }
        const loadingOk = flat.includes('No catalog loading') &&
          flat.includes('No EXLIB-1C loading authorization')
        // Deployment / hosted-contact: prohibited by TOTAL ABSENCE of
        // the topic (no deployment/hosted claim exists to authorize
        // or deny) — enforced by the byte pin (any addition of such a
        // claim changes the bytes) plus this direct topic-absence scan,
        // NOT by looking for a NOT-AUTHORIZED statement about it.
        const deploymentAbsent = !/deploy|hosted|\bapply\b|\bapplied\b|supabase/i.test(flat)
        const ledgerOk = flat.includes('48/48 pending-null') &&
          !flat.includes('reviewer') &&
          !/ledger[^.]{0,80}approv|approv[^.]{0,80}ledger/i.test(flat)
        return bytePinOk && labelsOk && authGuardOk && loadingOk && deploymentAbsent && ledgerOk
      })())
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
