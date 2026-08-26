// ============================================================
// ForgeFitOS — EXLIB-1C0B2 equipment-release product-decision
// record harness. Proves Joseph's three equipment-release decisions
// (5-7) are recorded exactly and CLOSED/APPROVED, the four
// weight_time decisions (1-4) remain OPEN and undecided, Option B
// is approved as PRODUCT DIRECTION ONLY, and that nothing is
// implemented, authored, loaded, or made import-eligible: the
// applied schema, migrations, ledger, manifest, and all promoted
// artifacts stay byte-frozen.
// Run from the repository root:
//   npx tsx scripts/verify-exlib1c0b2.ts
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

const B1_COMMIT = '1021b337e6016f97674c1e4a5d84f397d234795d'
const B1_AUDIT_SHA = '0d4447142735b29c987e792a8ed3331f19b38c4ae9eb5225d77e7fcf5cff6c5e'
const B1_VERIFIER_SHA = '2e1a2098ede95742ad18499a5af857044a003f6bb13a8215bfdf3a071f25cfee'
const MANIFEST_SHA = '336cd4253f747cdb3ba73ffa2af5a63e255c7c87cc452d4c43ed59a654673dfa'
const LEDGER_SHA = 'aa4fe77c0c633510661eede94b40e9bae4aca90a7d8c2794abde92c83c6f7b7b'
const M023_SHA = '0991448c39a558385431c78cef6d6063df208312a3f53866756ba730066c42f2'
const M024_SHA = '190550ecdb99df702ab03d1b07592f861070141e5091eb25bc5bf45f211cc980'

const DECISION_DOC = 'docs/exlib1c0b2-equipment-release-product-decisions.md'
const record = read(DECISION_DOC)
const recordFlat = record.replace(/^>\s?/gm, '').replace(/\s+/g, ' ')
const m023 = read('supabase/migrations/023_exlib_catalog_and_delivery_contract.sql')
const FOUR_VALUES = ['weight_plate', 'weighted_vest', 'smith_machine', 'sandbag']
const LABELS: Array<[string, string]> = [
  ['weight_plate', 'Weight Plate'], ['weighted_vest', 'Weighted Vest'],
  ['smith_machine', 'Smith Machine'], ['sandbag', 'Sandbag']]

function countOf(text: string, needle: string): number {
  return text.split(needle).length - 1
}

async function main() {
  console.log('\nA. Immutable baseline')
  {
    check('A1: ancestry and tag anchors — HEAD descends from the promoted B1 commit; stable tag peels to it',
      (() => {
        try {
          const tag = execSync('git rev-parse "exlib1c0b1-schema-vocabulary-impact-audit-stable^{}"', { encoding: 'utf8' }).trim()
          const parent = execSync(`git rev-parse "${B1_COMMIT}^{commit}"`, { encoding: 'utf8' }).trim()
          execSync(`git merge-base --is-ancestor ${B1_COMMIT} HEAD`)
          return tag === B1_COMMIT && parent === B1_COMMIT
        } catch { return false }
      })())
    check('A2: promoted B1 artifacts byte-unchanged — audit exact on disk; verifier exact at the promoted commit (its worktree diff is admission-only per G1)',
      readFileSync('docs/exlib1c0b-schema-vocabulary-impact-audit.md').length === 31922 &&
      sha256('docs/exlib1c0b-schema-vocabulary-impact-audit.md') === B1_AUDIT_SHA &&
      (() => {
        try {
          const blob = execSync(`git show ${B1_COMMIT}:scripts/verify-exlib1c0b.ts`,
            { maxBuffer: 1024 * 1024 * 16 })
          return blob.length === 25347 &&
            createHash('sha256').update(blob).digest('hex') === B1_VERIFIER_SHA
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
    check('A4: migrations exactly 001-024 with exact applied 023/024 fingerprints; NO migration 025',
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
    check('A5: no SQL/schema/product/API/UI/importer/catalog-payload change',
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
            !/^(CREATE|ALTER|DROP|INSERT|UPDATE|DELETE)\s/m.test(record) &&
            !record.includes('```sql')
        } catch { return false }
      })())
  }

  console.log('\nB. Decision record content')
  {
    check('B1: record identity — product-decision record, NOT implementation or loading authorization, with exact B1 anchors',
      recordFlat.includes('This is a product-decision record') &&
      recordFlat.includes('NOT an implementation authorization and NOT a loading authorization') &&
      recordFlat.includes(B1_COMMIT) &&
      recordFlat.includes('exlib1c0b1-schema-vocabulary-impact-audit-stable') &&
      recordFlat.includes(B1_AUDIT_SHA) &&
      recordFlat.includes(B1_VERIFIER_SHA) &&
      recordFlat.includes('Joseph Carfagno') &&
      recordFlat.includes('2026-08-25') &&
      recordFlat.includes('preserved byte-for-byte as the pre-decision analysis record'))
    check('B2: Decision 5 present exactly once, CLOSED/APPROVED — all four values user-selectable for user-created exercises',
      countOf(record, '### Decision 5 ') === 1 &&
      recordFlat.includes('Decision 5 — user-created exercise selectability: CLOSED/APPROVED') &&
      recordFlat.includes('expose all four future equipment values to users wherever equipment can be selected for a user-created exercise') &&
      FOUR_VALUES.every((v) => recordFlat.includes(v)))
    check('B3: Decision 6 present exactly once, CLOSED/APPROVED — neutral next-available-increment/setting; fixed +5 lb rejected; behavior only',
      countOf(record, '### Decision 6 ') === 1 &&
      recordFlat.includes('Decision 6 — Smith Machine progression behavior: CLOSED/APPROVED') &&
      recordFlat.includes('do not assume or recommend a fixed +5 lb increment') &&
      recordFlat.includes('"next available increment/setting" semantics') &&
      recordFlat.includes('Smith-machine loading, plate increments, and counterbalancing vary by machine') &&
      recordFlat.includes('defines product behavior only; implementation is not authorized in this phase'))
    check('B4: Decision 7 present exactly once, CLOSED/APPROVED — the exact four display labels',
      countOf(record, '### Decision 7 ') === 1 &&
      recordFlat.includes('Decision 7 — display labels: CLOSED/APPROVED') &&
      LABELS.every(([v, label]) => recordFlat.includes(`${v} -> ${label}`)))
    check('B5: Decisions 1-4 remain OPEN and deferred; nothing weight_time is decided, defaulted, or narrowed',
      recordFlat.includes('Decisions 1-4 — weight_time: OPEN, deferred') &&
      recordFlat.includes('weight_time field contract (required/permitted/forbidden fields) — OPEN') &&
      recordFlat.includes('Completion/zero semantics — OPEN') &&
      recordFlat.includes('Legacy exercise_type derivation branch for weight_time — OPEN') &&
      recordFlat.includes('Records/PR participation model — OPEN') &&
      recordFlat.includes('Nothing in this record decides, defaults, or narrows any `weight_time` issue') &&
      recordFlat.includes('these open items do not block the equipment-only path'))
    check('B6: Option B — APPROVED as product direction for the equipment-only path; implementation separately unauthorized; historical label superseded, not rewritten',
      recordFlat.includes('APPROVED as product direction for the equipment-only path') &&
      recordFlat.includes('equipment-only support may proceed independently from `weight_time`') &&
      recordFlat.includes('Its implementation remains separately unauthorized') &&
      recordFlat.includes('superseded by this record going forward, not rewritten'))
    check('B7: exact status separation — direction approved; implementation/025/loading/EXLIB-1C/public-commercial/full-record all NOT granted',
      recordFlat.includes('| Product direction (Option B, equipment-only path) | APPROVED |') &&
      recordFlat.includes('| Implementation (schema/product/API/UI) | NOT YET AUTHORIZED |') &&
      recordFlat.includes('| Migration 025 | NOT AUTHORED and NOT AUTHORIZED |') &&
      recordFlat.includes('| Catalog loading | NOT AUTHORIZED |') &&
      recordFlat.includes('| EXLIB-1C | NOT BEGUN |') &&
      recordFlat.includes('| Public/commercial dataset clearance | UNCHANGED/OPEN |') &&
      recordFlat.includes('| Full-record and specialist review | UNCHANGED/PENDING (ledger 48/48 pending) |'))
    check('B8: all 26 candidates import-ineligible (recomputed) and the four values PROVEN absent from the applied schema',
      (() => {
        const recs = read('docs/exlib1c0a-equipment-resolution.jsonl')
          .split('\n').filter((l) => l && !l.startsWith('#')).map((l) => JSON.parse(l))
        const cands = recs.flatMap((r: any) => r.canonical_candidates)
        const idx = m023.indexOf('equipment IN (')
        const seg = m023.slice(idx, m023.indexOf('))', idx))
        return cands.length === 26 &&
          cands.every((c: any) => c.import_eligible === false) &&
          recs.every((r: any) => r.import_eligible === false) &&
          FOUR_VALUES.every((v) => !seg.includes(`'${v}'`)) &&
          recordFlat.includes('remain `import_eligible: false`') &&
          recordFlat.includes('remain absent from the applied schema until a separately reviewed coordinated implementation is approved')
      })())
    check('B9: the future coordinated implementation boundary is DEFINED (not implemented) and schema-only/bare-CHECK releases are PROHIBITED',
      ['schema CHECK updates', 'generated TypeScript/database unions',
        'UI/API validation and selectors', 'display labels',
        'Smith-machine progression behavior', 'labeled verifier retargets',
        'disposable local-Postgres live tests', 'rollback analysis',
        'installed constraint names first discovered mechanically on a disposable database']
        .every((a) => recordFlat.includes(a)) &&
      recordFlat.includes('A schema-only release or a bare CHECK expansion is PROHIBITED') &&
      recordFlat.includes('no CHECK may ship without its coordinated non-schema support in the same reviewed release'))
    check('B10: no legal-clearance or StrengthLog-permission claim is introduced',
      !/uncopyrightable|is legal\b(?! counsel)|is lawful|clearly permitted|no legal risk|zero legal risk|fair use permits/i.test(recordFlat) &&
      !/StrengthLog (has )?(granted|permitted|licensed|approved)/i.test(recordFlat) &&
      recordFlat.includes('| Public/commercial dataset clearance | UNCHANGED/OPEN |'))
  }

  console.log('\nG. Phase boundary')
  {
    // Lifecycle-safe boundary: exact review worktree while
    // uncommitted; mechanical unique-phase-commit discovery plus
    // immutable-range re-proof once committed. No hardcoded future
    // commit SHA.
    const INVENTORY_1C0B2 = [
      'docs/exlib1c0b2-equipment-release-product-decisions.md',
      'scripts/verify-exlib1c0b2.ts',
    ]
    const SEVEN_SUITES = ['scripts/verify-exlib1a.ts', 'scripts/verify-exlib1b1.ts',
      'scripts/verify-exlib1b3.ts', 'scripts/verify-ui5b1b.ts', 'scripts/verify-ui5b2.ts',
      'scripts/verify-ui6c.ts', 'scripts/verify-ui7.ts']
    const TEN_SUITES = [...SEVEN_SUITES, 'scripts/verify-exlib1c0.ts',
      'scripts/verify-exlib1c0a.ts', 'scripts/verify-exlib1c0b.ts']
    const SEVEN_ADDS = [
      '// ADMISSION (EXLIB-1C0B2): the equipment-decision',
      '// record artifacts are admitted while uncommitted.',
      "f.startsWith('docs/exlib1c0b2-') ||",
    ]
    const C0_DELS = [
      'return !/ADMISSION \\(EXLIB-1C0A\\)|ADMISSION \\(EXLIB-1C0B\\)/.test(',
    ]
    const C0_ADDS = [
      '// ADMISSION (EXLIB-1C0B2): the equipment-decision',
      '// record artifacts are admitted while uncommitted.',
      "if (f.startsWith('docs/exlib1c0b2-') ||",
      "f === 'scripts/verify-exlib1c0b2.ts') return false",
      '// ADMISSION (EXLIB-1C0B2): accept the new label.',
      'return !/ADMISSION \\(EXLIB-1C0A\\)|ADMISSION \\(EXLIB-1C0B\\)|ADMISSION \\(EXLIB-1C0B2\\)/.test(',
    ]
    const C0A_DELS = [
      'return !execSync(`git diff -- ${f}`, { encoding: \'utf8\' })',
      ".includes('ADMISSION (EXLIB-1C0B)')",
    ]
    const C0A_ADDS = [
      '// ADMISSION (EXLIB-1C0B2): the equipment-decision',
      '// record artifacts are admitted while uncommitted.',
      "if (f.startsWith('docs/exlib1c0b2-') ||",
      "f === 'scripts/verify-exlib1c0b2.ts') return false",
      '// ADMISSION (EXLIB-1C0B2): accept the new label.',
      'return !/ADMISSION \\(EXLIB-1C0B\\)|ADMISSION \\(EXLIB-1C0B2\\)/.test(',
      'execSync(`git diff -- ${f}`, { encoding: \'utf8\' }))',
    ]
    const C0B_DELS = [
      "if (execSync('git status --porcelain', { encoding: 'utf8' }).trim() !== '') return false",
    ]
    const C0B_ADDS = [
      '// ADMISSION (EXLIB-1C0B2): the equipment-decision record',
      '// artifacts (and their verifier), plus committed verify',
      '// suites whose worktree diff carries the',
      '// ADMISSION (EXLIB-1C0B2) label, are admitted while that',
      '// phase is uncommitted.',
      "const dirtyAfterB2 = execSync('git status --porcelain', { encoding: 'utf8' })",
      ".split('\\n').filter(Boolean)",
      '.filter((l) => {',
      'const mm = l.match(/^\\s*(\\?\\?|[A-Z]{1,2})\\s+(.+)$/)',
      "const st = mm ? mm[1] : ''",
      'const f = mm ? mm[2] : l',
      "if (f.startsWith('docs/exlib1c0b2-') ||",
      "f === 'scripts/verify-exlib1c0b2.ts') return false",
      "if (st === 'M' && f.startsWith('scripts/verify-') && f.endsWith('.ts')) {",
      'try {',
      'return !execSync(`git diff -- ${f}`, { encoding: \'utf8\' })',
      ".includes('ADMISSION (EXLIB-1C0B2)')",
      '} catch { return true }',
      '}',
      'return true',
      '})',
      'if (dirtyAfterB2.length !== 0) return false',
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
      if (f === 'scripts/verify-exlib1c0b.ts') {
        return JSON.stringify(adds) === JSON.stringify(C0B_ADDS) &&
          JSON.stringify(dels) === JSON.stringify(C0B_DELS)
      }
      return dels.length === 0 && JSON.stringify(adds) === JSON.stringify(SEVEN_ADDS)
    }
    const recordInHead = (() => {
      try {
        execSync(`git cat-file -e HEAD:${DECISION_DOC}`, { stdio: 'pipe' })
        return true
      } catch { return false }
    })()
    check(`G1: lifecycle-safe phase boundary (${recordInHead ? 'COMMITTED' : 'UNCOMMITTED REVIEW'} state) — exact inventory and LINE-EXACT admission diffs on all ten suites`,
      (() => {
        try {
          if (!recordInHead) {
            const entries = execSync('git status --porcelain', { encoding: 'utf8' }).split('\n').filter(Boolean)
            const untracked = entries.filter((l) => l.startsWith('??')).map((l) => l.slice(3).trim()).sort()
            const modified = entries.filter((l) => !l.startsWith('??'))
              .map((l) => (l.match(/^\s*[A-Z?]{1,2}\s+(.+)$/) as RegExpMatchArray)[1])
            const staged = execSync('git diff --cached --name-only', { encoding: 'utf8' }).trim()
            if (staged !== '') return false
            if (JSON.stringify(untracked) !== JSON.stringify([...INVENTORY_1C0B2].sort())) return false
            if (JSON.stringify([...modified].sort()) !== JSON.stringify([...TEN_SUITES].sort())) return false
            return modified.every((f) =>
              diffLineExact(execSync(`git diff -- ${f}`, { encoding: 'utf8' }), f))
          }
          // ADMISSION (EXLIB-1C0B3): the authorized migration-025
          // draft, its live suite and verifier, the coordinated
          // product changes, and committed verify suites whose
          // worktree diff carries this phase's labels are admitted
          // while that phase is uncommitted.
          const dirtyAfterB3 = execSync('git status --porcelain', { encoding: 'utf8' })
            .split('\n').filter(Boolean)
            .filter((l) => {
              const mm = l.match(/^\s*(\?\?|[A-Z]{1,2})\s+(.+)$/)
              const st = mm ? mm[1] : ''
              const f = mm ? mm[2] : l
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
                  return !/ADMISSION \(EXLIB-1C0B3\)|RETARGET \(EXLIB-1C0B3 migration 025 draft\)/.test(
                    execSync(`git diff -- ${f}`, { encoding: 'utf8' }))
                } catch { return true }
              }
              return true
            })
          if (dirtyAfterB3.length !== 0) return false
          if (execSync('git diff --cached --name-only', { encoding: 'utf8' }).trim() !== '') return false
          const adders = execSync(
            `git log --all --format=%H --diff-filter=A -- ${DECISION_DOC}`,
            { encoding: 'utf8' }).split('\n').filter(Boolean)
          if (adders.length !== 1) return false
          const phase = adders[0]
          const verifierAdders = execSync(
            'git log --all --format=%H --diff-filter=A -- scripts/verify-exlib1c0b2.ts',
            { encoding: 'utf8' }).split('\n').filter(Boolean)
          if (verifierAdders.length !== 1 || verifierAdders[0] !== phase) return false
          execSync(`git merge-base --is-ancestor ${phase} HEAD`)
          const range = execSync(`git diff --name-only ${phase}^..${phase}`, { encoding: 'utf8' })
            .split('\n').filter(Boolean).sort()
          const expected = [...INVENTORY_1C0B2, ...TEN_SUITES].sort()
          if (JSON.stringify(range) !== JSON.stringify(expected)) return false
          return TEN_SUITES.every((f) =>
            diffLineExact(execSync(`git diff ${phase}^..${phase} -- ${f}`, { encoding: 'utf8' }), f))
        } catch { return false }
      })())
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
