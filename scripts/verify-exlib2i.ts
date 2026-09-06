// EXLIB-2I verifier — the completed Plank human-review decision,
// recorded and applied (LOCAL-ONLY; the review was performed by a
// named human; Claude only recorded the supplied decision).
//
// Proves: exact source refs and the phase inventory; the historical
// blank EXLIB-2H form byte-identical; the completed form at its exact
// fingerprint, differing from the blank form ONLY in the authorized
// review fields with every protected statement byte-exact; the exact
// human-supplied facts (reviewer Nick Tkacz, role Personal Trainer,
// timestamp, decision approved, rationale, null evidence, seven true
// confirmations); the original content bytes at the promoted source
// commit; the current content differing ONLY in the schema-defined
// content_review fields plus the disclosed status comment line; the
// record approved yet still import-ineligible and unpublished; seed/
// inventory frozen with seed_link_compatible false; no runtime/
// migration/loading/ledger/eligibility/API/UI/dependency/config
// change; no hosted effect or hosted-contact claim; and the
// fail-closed lifecycle (approval alone authorizes neither loading
// nor publication nor activation). Performs NO hosted contact.
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
const shaBuf = (b: Buffer): string => createHash('sha256').update(b).digest('hex')
const parseJsonl = (p: string): any[] => read(p).split('\n')
  .filter((l) => l.trim() && !l.trim().startsWith('#')).map((l) => JSON.parse(l))
const blob = (rev: string, p: string): Buffer =>
  execSync(`git show ${rev}:${p}`, { encoding: 'buffer' as any }) as unknown as Buffer

const CONTENT = 'docs/exlib2g-plank-content.jsonl'
const BLANK = 'docs/exlib2h-plank-content-review-form.json'
const COMPLETED = 'docs/exlib2h-plank-content-review-form-completed.json'
const RECORD = 'docs/exlib2i-plank-human-review-decision-record.md'
const VERIFIER = 'scripts/verify-exlib2i.ts'
const SOURCE_TIP = 'e6a98f2ccc531ca3976e91c53b9f30b09f8ae193'
const OLD_CONTENT_SHA = 'a8cb6a5ed54bfa20f296d0624ccd29b20936f1f5b1c48ae201c4c44c2914a30a'
const NEW_CONTENT_SHA = '4191659387d0d42303feb486b0dd7d7a1a72407d5c97b492db062350033a68fe'
const COMPLETED_SHA = '59ad2668790b6d0b135c8c453a702c45774f905ece8749a6112881b1df7e5b98'
const TIP_2I = '73231e928748c7499172c28445a1958b13eace12'
const PHASE_NEW = [COMPLETED, RECORD, VERIFIER].sort()
const PHASE_ALL = [...PHASE_NEW, CONTENT, 'scripts/verify-exlib2g.ts', 'scripts/verify-exlib2h.ts'].sort()

const rec = read(RECORD)
const recFlat = rec.replace(/\s+/g, ' ')
const blank = JSON.parse(read(BLANK))
const comp = JSON.parse(read(COMPLETED))
const cur = parseJsonl(CONTENT)[0]

async function main(): Promise<void> {
  console.log('EXLIB-2I verification (human review decision recorded and applied)')

  console.log('\nA. Evidence lifecycle')
  {
    check('A1: exact source refs — the EXLIB-2H stable tag object peels to the source tip (an ancestor of HEAD), and the promoted packet stays byte-frozen',
      (() => {
        try {
          if (execSync('git rev-parse exlib2h-plank-content-review-prep-stable^{}',
            { encoding: 'utf8' }).trim() !== SOURCE_TIP) return false
          execSync(`git merge-base --is-ancestor ${SOURCE_TIP} HEAD`, { stdio: 'pipe' })
        } catch { return false }
        return sha256('docs/exlib2h-plank-content-review-packet.md') === '026b7c256ef7ae7ca35033dc5c3c407a3b6727420742209b6c2ba44610d877ae'
      })())
    check('A2: the historical blank EXLIB-2H form remains byte-identical (2,316 B) — never overwritten or deleted',
      readFileSync(BLANK).length === 2316 &&
      sha256(BLANK) === '42215b1df6f56c04afc8aa33d4c138ad17c858d03268bd337ff7821b3287fda1')
    check('A3: the completed form matches its exact fingerprint (2,389 B / 59ad2668...)',
      readFileSync(COMPLETED).length === 2389 && sha256(COMPLETED) === COMPLETED_SHA)
    check('A4: the completed form differs from the blank form ONLY in the authorized review fields (decision, reviewer, role, reviewed_at, rationale, the seven confirmations; evidence stayed null), with identical key sets and every protected legal/no-effect statement byte-exact',
      (() => {
        if (JSON.stringify(Object.keys(blank).sort()) !== JSON.stringify(Object.keys(comp).sort())) return false
        const CHANGED = new Set(['decision', 'reviewer', 'reviewer_role_or_credential', 'reviewed_at', 'rationale', 'needs_human_judgment_confirmations'])
        for (const k of Object.keys(blank)) {
          const same = JSON.stringify(blank[k]) === JSON.stringify(comp[k])
          if (CHANGED.has(k) && same) return false
          if (!CHANGED.has(k) && !same) return false
        }
        return comp.evidence === null &&
          ['no_effect_statement', 'import_eligible_effect', 'publication_effect', 'loading_effect', 'decision_requirements']
            .every((k) => JSON.stringify(blank[k]) === JSON.stringify(comp[k]))
      })())
    check('A5: the human-supplied facts match exactly — decision approved; reviewer Nick Tkacz; role Personal Trainer (operator-validated, not embellished); reviewed_at 2026-09-01T20:35:00-04:00; rationale "Everything looks correct"; evidence null; all seven confirmations true — in the completed form AND the decision record',
      comp.decision === 'approved' && comp.reviewer === 'Nick Tkacz' &&
      comp.reviewer_role_or_credential === 'Personal Trainer' &&
      comp.reviewed_at === '2026-09-01T20:35:00-04:00' &&
      comp.rationale === 'Everything looks correct' && comp.evidence === null &&
      Object.keys(comp.needs_human_judgment_confirmations).length === 7 &&
      Object.values(comp.needs_human_judgment_confirmations).every((v: any) => v === true) &&
      recFlat.includes('Reviewer: Nick Tkacz') &&
      recFlat.includes('Personal Trainer') &&
      recFlat.includes('2026-09-01T20:35:00-04:00') &&
      recFlat.includes('Decision: approved') &&
      recFlat.includes('"Everything looks correct"') &&
      recFlat.includes('Evidence: null') &&
      recFlat.includes('operator-validated') &&
      recFlat.includes('Nothing was inferred, embellished, renamed, or added') &&
      recFlat.includes('ChatGPT and Claude did NOT perform, influence, or fabricate the human review'))
  }

  console.log('\nB. The applied decision')
  {
    check('B1: the original content bytes match the reviewed fingerprint at the promoted source commit (2,729 B / a8cb6a5e... at e6a98f2), and the completed form pins that same fingerprint — the decision binds to exactly the reviewed bytes',
      (() => {
        const old = blob(SOURCE_TIP, CONTENT)
        return old.length === 2729 && shaBuf(old) === OLD_CONTENT_SHA &&
          comp.content_fingerprint.bytes === 2729 && comp.content_fingerprint.sha256 === OLD_CONTENT_SHA
      })())
    check('B2: REVISED (RETARGET (EXLIB-2J R6 eligibility admission)) — the AS-DECIDED content is anchored to the promoted EXLIB-2I tip (73231e9): there it was exactly 2,848 B / 41916593..., differing from the reviewed bytes ONLY in the content_review fields plus the disclosed comment; the live post-admission state is owned by scripts/verify-exlib2j.ts',
      (() => {
        const decided = blob(TIP_2I, CONTENT)
        if (decided.length !== 2848 || createHash('sha256').update(decided).digest('hex') !== NEW_CONTENT_SHA) return false
        const oldText = blob(SOURCE_TIP, CONTENT).toString('utf8')
        const oldRec = JSON.parse(oldText.split('\n').filter((l) => l.trim() && !l.trim().startsWith('#'))[0])
        const decRec = JSON.parse(decided.toString('utf8').split('\n').filter((l) => l.trim() && !l.trim().startsWith('#'))[0])
        for (const k of Object.keys(oldRec)) {
          if (k === 'content_review') continue
          if (JSON.stringify(oldRec[k]) !== JSON.stringify(decRec[k])) return false
        }
        if (JSON.stringify(Object.keys(oldRec).sort()) !== JSON.stringify(Object.keys(decRec).sort())) return false
        const decComment = decided.toString('utf8').split('\n')[0]
        return decComment.startsWith('#') && decComment.includes('APPROVED by named human review') &&
          decComment.includes('import_eligible=false') &&
          recFlat.includes('leading status comment line was updated') &&
          recFlat.includes('This is disclosed here explicitly; it is commentary, not a schema field')
      })())
    check('B3: the applied review fields equal the human-supplied facts exactly, and the schema represents them without invention — status approved, reviewer Nick Tkacz, reviewed_at 2026-09-01T20:35:00-04:00, rationale "Everything looks correct"; the reviewer role lives ONLY in the form and record because content_review has no role field',
      cur.content_review.status === 'approved' &&
      cur.content_review.reviewer === 'Nick Tkacz' &&
      cur.content_review.reviewed_at === '2026-09-01T20:35:00-04:00' &&
      cur.content_review.rationale === 'Everything looks correct' &&
      JSON.stringify(Object.keys(cur.content_review).sort()) === JSON.stringify(['rationale', 'reviewed_at', 'reviewer', 'status']) &&
      !JSON.stringify(cur).includes('Personal Trainer') &&
      recFlat.includes('content_review has no role field'))
    check('B4: the decided record satisfies the promoted contract shape — approved with ALL evidence present (reviewer >= 3 non-blank, reviewed_at, rationale >= 10 non-blank), mirroring the schema decided-branch and the applied review-audit CHECK pattern',
      (() => {
        const schema = JSON.parse(read('docs/exlib2c-authoring-schema.json'))
        if (JSON.stringify(schema.properties.content_review.properties.status.enum) !==
          JSON.stringify(['pending', 'approved', 'revised', 'rejected'])) return false
        return cur.content_review.reviewer.trim().length >= 3 &&
          typeof cur.content_review.reviewed_at === 'string' &&
          cur.content_review.rationale.trim().length >= 10
      })())
    check('B5: REVISED (RETARGET (EXLIB-2J R6 eligibility admission)) — at the promoted EXLIB-2I tip the record was approved and still import-INELIGIBLE (anchored); the LIVE record still holds review_status proposed and no publication key, and the live eligibility state is owned by scripts/verify-exlib2j.ts',
      (() => {
        const decRec = JSON.parse(blob(TIP_2I, CONTENT).toString('utf8').split('\n').filter((l) => l.trim() && !l.trim().startsWith('#'))[0])
        return decRec.import_eligible === false
      })() && cur.review_status === 'proposed' &&
      !Object.keys(cur).some((k) => k.includes('publication')) &&
      recFlat.includes('changes neither import eligibility nor publication nor hosted catalog state') &&
      recFlat.includes('Approval alone authorizes NOTHING further'))
  }

  console.log('\nC. Boundaries and lifecycle')
  {
    check('C1: seed and inventory held byte-identical through this milestone (delivery paths anchored at the delivery predecessor) and seed_link_compatible remained false; ledger 48/48 pending-null and 26/26 legacy candidates ineligible',
      (() => {
        // RETARGET (EXLIB-2S delivery-activation preparation): the two
        // delivery-surface paths compare source-blob vs the anchored
        // delivery-predecessor blob (the promoted EXLIB-2R evidence
        // tip), where this claim was and remains true; every other
        // frozen path stays live.
        const DELIVERY_PRED = '5f7e182f3027b3640514e06d642693f4018c03e2'
        for (const p of ['src/lib/supabase/seed-exercises.ts', 'docs/exlib2b-release1-inventory.jsonl']) {
          if (execSync(`git rev-parse "${SOURCE_TIP}:${p}"`, { encoding: 'utf8' }).trim() !==
              execSync(`git rev-parse "${DELIVERY_PRED}:${p}"`, { encoding: 'utf8' }).trim()) return false
        }
        for (const p of ['docs/exlib1b1-review-ledger.jsonl', 'docs/exlib1c0a-equipment-resolution.jsonl']) {
          const now = execSync(`git hash-object "${p}"`, { encoding: 'utf8' }).trim()
          const tip = execSync(`git rev-parse "${SOURCE_TIP}:${p}"`, { encoding: 'utf8' }).trim()
          if (now !== tip) return false
        }
        const inv = execSync(`git show ${DELIVERY_PRED}:"docs/exlib2b-release1-inventory.jsonl"`, { encoding: 'utf8', maxBuffer: 1 << 26 }).split('\n')
          .filter((l) => l.trim() && !l.trim().startsWith('#')).map((l) => JSON.parse(l))
        const plank = inv.filter((r: any) => r.proposed_canonical_name === 'Plank')
        if (plank.length !== 1 || plank[0].seed_link_compatible !== false) return false
        const led = parseJsonl('docs/exlib1b1-review-ledger.jsonl')
        if (led.length !== 48 || !led.every((r: any) => r.status === 'pending' && r.reviewer === null)) return false
        const cands = parseJsonl('docs/exlib1c0a-equipment-resolution.jsonl').flatMap((r: any) => r.canonical_candidates)
        return cands.length === 26 && cands.every((c: any) => c.import_eligible === false)
      })())
    check('C2: no runtime, migration, catalog-loading, API, UI, dependency, or configuration change — RETARGET (EXLIB-2M migration-027 apply-prep): the phase range and the migrations-exactly-26-with-no-027 inventory are anchored to the promoted EXLIB-2I tip (73231e9), where they were true; EXLIB-2M later prepares (never applies) 027. Zero deliver_catalog_exercises references in src, no load-payload artifact, and the no-hosted-contact claim remain live',
      (() => {
        const range = execSync(`git diff --name-only ${SOURCE_TIP}..${TIP_2I}`, { encoding: 'utf8' })
          .split('\n').filter(Boolean)
        if (range.some((p) => /^(src\/|supabase\/|package|next\.config|tsconfig|\.env|public\/)/.test(p))) return false
        const files = execSync(`git ls-tree ${TIP_2I} supabase/migrations/ --name-only`, { encoding: 'utf8' })
          .split('\n').filter((f) => f.endsWith('.sql'))
        if (files.length !== 26 || files.some((f) => f.includes('/027'))) return false
        if (execSync("grep -rln 'deliver_catalog_exercises' src/ || true", { encoding: 'utf8' }).trim() !== '') return false
        // RETARGET (EXLIB-2K catalog-load preparation): the
        // no-load-payload/load-package claim is anchored to the
        // promoted EXLIB-2I tip, where it was true; EXLIB-2K later
        // prepares (never hosted-executes) the reviewed docs package.
        if (execSync(`git ls-tree ${TIP_2I} docs/ --name-only`, { encoding: 'utf8' })
          .split('\n').some((f) => f.includes('load-payload') || f.includes('load-package'))) return false
        return recFlat.includes('no hosted service was contacted in this milestone')
      })())
    check('C3: fail-closed lifecycle stated and true — approval alone authorizes neither loading nor publication nor activation (R6 eligibility lock restated; publication separate; no catalog snapshot/run/seal/delivery exists or is authorized), and the retargets are narrow, labeled, and preserve the historical pending-review claims at their promoted tips',
      (() => {
        if (!recFlat.includes('import_eligible remains false (flipping it is a later, separately approved act on an exact fingerprinted payload')) return false
        if (!recFlat.includes('no catalog snapshot, load payload, run, seal, or delivery exists or is authorized')) return false
        const g = read('scripts/verify-exlib2g.ts')
        const h = read('scripts/verify-exlib2h.ts')
        if (!g.includes('RETARGET (EXLIB-2I human review decision)')) return false
        if (!h.includes('RETARGET (EXLIB-2I human review decision)')) return false
        // the anchored historical claims really hold at the promoted tips
        const g2 = JSON.parse(blob('b9af2a40607c23ee57c04cdbdb9581b01a4f4f9a', CONTENT).toString('utf8')
          .split('\n').filter((l) => l.trim() && !l.trim().startsWith('#'))[0])
        const h2 = JSON.parse(blob(SOURCE_TIP, CONTENT).toString('utf8')
          .split('\n').filter((l) => l.trim() && !l.trim().startsWith('#'))[0])
        return g2.content_review.status === 'pending' && h2.content_review.status === 'pending'
      })())
    check('G1: lifecycle-safe phase boundary — the phase touches exactly six paths (three new: completed form, decision record, this verifier; three modified: the content record and the two labeled retargeted verifiers); strict porcelain while uncommitted, adder-anchored once committed',
      (() => {
        try {
          const inHead = (() => {
            try { execSync(`git cat-file -e HEAD:${RECORD}`, { stdio: 'pipe' }); return true } catch { return false }
          })()
          if (!inHead) {
            const entries = execSync('git status --porcelain', { encoding: 'utf8' })
              .split('\n').filter(Boolean).map((l) => l.trim()).sort()
            const expected = [...PHASE_NEW.map((f) => `?? ${f}`),
              `M ${CONTENT}`, 'M scripts/verify-exlib2g.ts', 'M scripts/verify-exlib2h.ts'].sort()
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
          return JSON.stringify(range) === JSON.stringify(PHASE_ALL)
        } catch { return false }
      })())
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
