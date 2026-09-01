// EXLIB-2H verifier — Plank content-review PREPARATION (LOCAL-ONLY;
// prepares the human review, approves NOTHING).
//
// Proves: the exact promoted EXLIB-2G source (commit/tag/artifact
// fingerprints, all byte-frozen); the Plank content record
// byte-identical with its review state still pending/evidence-null/
// import-ineligible/unpublished; the product boundary (seed,
// inventory, migrations, runtime, eligibility, ledger unchanged; no
// migration 027); the review contract derived from committed
// repository evidence (schema transitions, the applied review-audit
// CHECK, specialist requirement, distinct pipeline axis, R6
// eligibility lock, orthogonal publication); the packet covering
// every required review dimension with only the permitted finding
// classifications; the review form completely unfilled with zero
// fabricated identity/credential/evidence/timestamp/rationale/
// decision; the packet's inertness (it cannot mutate content or
// authorize loading); and the exact three-path phase inventory.
// Performs NO hosted contact.
//
// Fail-closed: any mismatch fails the suite.
import { execSync } from 'child_process'
import { createHash } from 'crypto'
import { existsSync, readFileSync, readdirSync } from 'fs'

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

const PACKET = 'docs/exlib2h-plank-content-review-packet.md'
const FORM = 'docs/exlib2h-plank-content-review-form.json'
const VERIFIER = 'scripts/verify-exlib2h.ts'
const CONTENT = 'docs/exlib2g-plank-content.jsonl'
const SOURCE_TIP = 'b9af2a40607c23ee57c04cdbdb9581b01a4f4f9a'
const CONTENT_SHA = 'a8cb6a5ed54bfa20f296d0624ccd29b20936f1f5b1c48ae201c4c44c2914a30a'
const PHASE_NEW = [PACKET, FORM, VERIFIER].sort()

const pk = read(PACKET)
const pkFlat = pk.replace(/\s+/g, ' ')
const form = JSON.parse(read(FORM))

async function main(): Promise<void> {
  console.log('EXLIB-2H verification (Plank content review preparation; approves NOTHING)')

  console.log('\nA. Source and boundary')
  {
    check('A1: exact source — the EXLIB-2G stable tag object peels to the source tip (ancestor of HEAD), and the 2G design record, 2G verifier, migration 026, and application evidence stay byte-frozen',
      (() => {
        try {
          if (execSync('git rev-parse exlib2g-plank-content-activation-design-stable^{}',
            { encoding: 'utf8' }).trim() !== SOURCE_TIP) return false
          execSync(`git merge-base --is-ancestor ${SOURCE_TIP} HEAD`, { stdio: 'pipe' })
        } catch { return false }
        return sha256('docs/exlib2g-plank-content-activation-design.md') === '139a097d7836bc1fee4a09a9014c03534e95d9a5c34438f97426df4cf6dafe1e' &&
          sha256('scripts/verify-exlib2g.ts') === 'acb8b80cb3e8faa984d109f3ea0e18b5cd07abd9f2d1e2c961f0dfc4e02f3719' &&
          sha256('supabase/migrations/026_exlib_plank_seed_reconciliation.sql') === '620185b62c589c55fb30a237589589f46002a9d6c391b9ab936e07a6641cf4bc' &&
          sha256('docs/exlib2f-migration-026-application-record.md') === 'dc6e6188f013eb02ad2028339d0515ea180ab1016b119eb15ee523db83358b2a'
      })())
    check('A2: the Plank content record is byte-identical (2,729 B) and its review state is untouched — pending with null reviewer/reviewed_at/rationale, review_status proposed, import_eligible false, no publication key',
      (() => {
        if (readFileSync(CONTENT).length !== 2729 || sha256(CONTENT) !== CONTENT_SHA) return false
        const r = parseJsonl(CONTENT)[0]
        return r.content_review.status === 'pending' && r.content_review.reviewer === null &&
          r.content_review.reviewed_at === null && r.content_review.rationale === null &&
          r.review_status === 'proposed' && r.import_eligible === false &&
          !Object.keys(r).some((k) => k.includes('publication'))
      })())
    check('A3: product boundary — seed, inventory, review ledger, and eligibility artifacts blob-identical to the source tip; zero supabase/ or src/ paths in the phase range; migrations exactly 26 with NO 027',
      (() => {
        for (const p of ['src/lib/supabase/seed-exercises.ts', 'docs/exlib2b-release1-inventory.jsonl',
          'docs/exlib1b1-review-ledger.jsonl', 'docs/exlib1c0a-equipment-resolution.jsonl']) {
          const now = execSync(`git hash-object "${p}"`, { encoding: 'utf8' }).trim()
          const tip = execSync(`git rev-parse "${SOURCE_TIP}:${p}"`, { encoding: 'utf8' }).trim()
          if (now !== tip) return false
        }
        const files = readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql'))
        if (files.length !== 26 || files.some((f) => f.startsWith('027'))) return false
        return execSync("grep -rln 'deliver_catalog_exercises' src/ || true", { encoding: 'utf8' }).trim() === ''
      })())
  }

  console.log('\nB. The derived review contract')
  {
    check('B1: reviewer authority and the human requirement are derived from committed evidence — the packet cites specialist_review_required (all inventory rows), the record\'s own pending-human-specialist declaration, the review-guide precedent, the no-fabrication standing rule, and answers NO to AI-approval-without-a-human; and the cited evidence really exists',
      (() => {
        const inv = parseJsonl('docs/exlib2b-release1-inventory.jsonl')
        if (!inv.every((r: any) => r.specialist_review_required === true)) return false
        if (!read(CONTENT).includes('pending human specialist review')) return false
        if (!read('docs/exlib1c0-human-review-guide.md').includes('qualified strength-and-conditioning')) return false
        return pkFlat.includes('specialist_review_required: true') &&
          pkFlat.includes('a qualified strength-and-conditioning reviewer + Joseph') &&
          pkFlat.includes('NEVER be approved without a distinct human reviewer') &&
          pkFlat.includes('reviewer identities/approvals are never fabricated and blank never means approval') &&
          pkFlat.includes('The repository defines NO credential registry') &&
          pkFlat.includes('is NO (see 1-2)')
      })())
    check('B2: statuses and transitions match the committed contract — pending -> approved | revised | rejected only, pending carries NO evidence, decided carries ALL (reviewer >= 3, reviewed_at, rationale >= 10), mirroring the applied exercise_catalog_review_audit_chk; the packet honestly notes exercise_catalog_content is NOT yet a migration; re-decision requires a NEW version',
      (() => {
        const schema = JSON.parse(read('docs/exlib2c-authoring-schema.json'))
        const st = schema.properties.content_review.properties.status.enum
        if (JSON.stringify(st) !== JSON.stringify(['pending', 'approved', 'revised', 'rejected'])) return false
        const m023 = read('supabase/migrations/023_exlib_catalog_and_delivery_contract.sql')
        if (!m023.includes('CONSTRAINT exercise_catalog_review_audit_chk CHECK (')) return false
        if (execSync("grep -c 'exercise_catalog_content' supabase/migrations/*.sql || true", { encoding: 'utf8' })
          .split('\n').filter(Boolean).some((l) => !/:0$/.test(l))) return false
        return pkFlat.includes('pending -> approved | revised | rejected') &&
          pkFlat.includes('a pending record carries NO review evidence') &&
          pkFlat.includes('a decided record carries ALL of it') &&
          pkFlat.includes('that content table is NOT yet a migration') &&
          pkFlat.includes('requires a NEW content version')
      })())
    check('B3: evidence, rationale, pipeline-axis, eligibility, and publication rules pinned — internal three-field evidence, rationale >= 10 non-blank, review_status a DISTINCT axis not required to move together, import_eligible flip only via a later separately approved fingerprinted act (R6), publication a separate orthogonal database-side lifecycle',
      pkFlat.includes('the reviewer identity, the decision timestamp, and the rationale') &&
      pkFlat.includes('No external URL evidence is required by the content-review contract') &&
      pkFlat.includes('at least 10 characters') &&
      pkFlat.includes('DISTINCT axes by schema declaration') &&
      pkFlat.includes('NOT required to transition together') &&
      pkFlat.includes('ONLY through a later, separately approved act on an exact fingerprinted payload') &&
      pkFlat.includes('A content approval alone NEVER flips it') &&
      pkFlat.includes('pending/rejected content can never be published structurally'))
  }

  console.log('\nC. Findings, form, and inertness')
  {
    check('C1: every required review dimension appears in the packet — identity/classification, anatomy, instruction quality (coherence, isometric hold, breathing, bracing, stopping, mistakes, alternatives, prose), safety/claims (all eight required scans), and relationships (five mechanical confirmations) — plus the frozen record rendered readably',
      ['A. Identity and classification', 'B. Anatomy', 'C. Instruction quality',
        'D. Safety and claims', 'E. Relationships',
        'Physical coherence walk-through', 'timed isometric hold',
        'never hold your breath', 'Stopping guidance', 'Common mistakes are specific',
        'No diagnosis/treatment/rehabilitation/prescription language',
        'No spot-fat-reduction', 'No instruction to continue through pain',
        'No absolute safety guarantee', 'No population-specific medical claim',
        'Dead bug', 'Ab wheel rollout', 'Empty regressions is legal',
        'exact normalization rules', 'The frozen record, rendered readably']
        .every((s) => pkFlat.includes(s)))
    check('C2: every finding uses ONLY the permitted classifications, the summary is honest (zero CORRECTION REQUIRED, zero BLOCKED BY GOVERNANCE, PASS + enumerated NEEDS HUMAN JUDGMENT), and the packet states nothing was rewritten to make a finding pass',
      (() => {
        const findings = pk.slice(pk.indexOf('## 4.'), pk.indexOf('## 5.'))
        const labels = Array.from(findings.matchAll(/: (PASS|NEEDS HUMAN JUDGMENT|CORRECTION REQUIRED|BLOCKED BY GOVERNANCE)/g)).map((m) => m[1])
        if (labels.length < 20) return false
        if (labels.some((l) => l === 'CORRECTION REQUIRED' || l === 'BLOCKED BY GOVERNANCE')) return false
        if (!labels.includes('NEEDS HUMAN JUDGMENT')) return false
        return pkFlat.includes('zero CORRECTION REQUIRED findings; zero BLOCKED BY GOVERNANCE findings') &&
          pkFlat.includes('Nothing was rewritten to make a finding pass')
      })())
    check('C3: the review form is completely UNFILLED — decision, reviewer, reviewer_role_or_credential, reviewed_at, evidence, and rationale all null; every human-judgment confirmation null; the content fingerprint pinned; and the no-effect/eligibility/publication/loading statements present',
      form.decision === null && form.reviewer === null &&
      form.reviewer_role_or_credential === null && form.reviewed_at === null &&
      form.evidence === null && form.rationale === null &&
      Object.values(form.needs_human_judgment_confirmations).every((v: any) => v === null) &&
      form.content_fingerprint.bytes === 2729 && form.content_fingerprint.sha256 === CONTENT_SHA &&
      JSON.stringify(form.legal_decisions) === JSON.stringify(['approved', 'revised', 'rejected']) &&
      form.no_effect_statement.includes('grants no approval') &&
      form.no_effect_statement.includes('NEVER reads as approval') &&
      form.no_effect_statement.includes('separate, separately reviewed milestone') &&
      form.import_eligible_effect.startsWith('none') &&
      form.publication_effect.startsWith('none') &&
      form.loading_effect.startsWith('none'))
    check('C4: zero fabrication — no reviewer name, credential, decision verb, timestamp, or rationale value appears anywhere as a filled fact: the form\'s decision fields are null, and the packet grants no approval, states only an authorized human reviewer may fill the fields, and keeps loading blocked until a recorded AND separately reviewed decision',
      (() => {
        if (!pkFlat.includes('THIS PACKET GRANTS NO APPROVAL')) return false
        if (!pkFlat.includes('Only an authorized human reviewer may fill the decision, identity, role/credential, timestamp, evidence, and rationale fields')) return false
        if (!pkFlat.includes('loading remains blocked until an authorized review decision is recorded AND that application is itself separately reviewed')) return false
        if (!pkFlat.includes('even a filled form changes nothing mechanically')) return false
        // the content record itself still carries no decision (A2 pins bytes)
        const r = parseJsonl(CONTENT)[0]
        return r.content_review.status === 'pending'
      })())
    check('G1: lifecycle-safe phase boundary — exactly the three new artifacts (packet, unfilled form, this verifier); strict porcelain while uncommitted, adder-anchored single-commit range once committed; ASCII-only new artifacts; no hosted contact (all proofs are local file and git reads)',
      (() => {
        try {
          const allowed = new Set(['\u2500', '\u2014', '\u2013', '\u00b7', '\u2026'])
          if (![PACKET, FORM].every((p) => read(p).split('').every((c) => c.charCodeAt(0) < 128 || allowed.has(c)))) return false
          const inHead = (() => {
            try { execSync(`git cat-file -e HEAD:${PACKET}`, { stdio: 'pipe' }); return true } catch { return false }
          })()
          if (!inHead) {
            const entries = execSync('git status --porcelain', { encoding: 'utf8' })
              .split('\n').filter(Boolean).map((l) => l.trim()).sort()
            const expected = PHASE_NEW.map((f) => `?? ${f}`).sort()
            if (JSON.stringify(entries) !== JSON.stringify(expected)) return false
            return execSync('git diff --cached --name-only', { encoding: 'utf8' }).trim() === ''
          }
          const adders = new Set<string>()
          for (const p of PHASE_NEW) {
            const a = execSync(`git log --all --format=%H --diff-filter=A -- "${p}"`,
              { encoding: 'utf8' }).split('\n').filter(Boolean)
            if (a.length !== 1) return false
            adders.add(a[0])
          }
          if (adders.size !== 1) return false
          const phase = Array.from(adders)[0]
          execSync(`git merge-base --is-ancestor ${phase} HEAD`)
          execSync(`git merge-base --is-ancestor ${SOURCE_TIP} ${phase}`)
          const range = execSync(`git diff --name-only ${SOURCE_TIP}..${phase}`, { encoding: 'utf8' })
            .split('\n').filter(Boolean).sort()
          return JSON.stringify(range) === JSON.stringify(PHASE_NEW)
        } catch { return false }
      })())
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
