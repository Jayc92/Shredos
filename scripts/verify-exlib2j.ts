// EXLIB-2J verifier — Plank R6 import-eligibility admission
// (LOCAL-ONLY; eligibility only — authorizes no loading, publication,
// delivery, activation, seed, or hosted change).
//
// Proves: the exact promoted EXLIB-2I source (commit/tree/tag); the
// approved pre-admission payload fingerprint; the byte-frozen
// completed form and decision record with the exact human facts; R6
// and the eligibility lifecycle quoted from authoritative committed
// bytes with every prerequisite satisfied; the current content
// differing from the approved payload ONLY in import_eligible plus
// the disclosed comment clause; import_eligible now true with
// content_review value-identical and review_status independent; no
// publication key; seed/inventory/ledger/legacy-eligibility frozen
// with seed_link_compatible false; no load package, hosted mutation,
// runtime, migration-027, API, UI, dependency, or configuration
// change; the fingerprint-bound invalidation rule; the
// grants-nothing-further posture; and the labeled count-neutral
// retargets. Performs NO hosted contact.
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
const sha256At2N = (p: string): string =>
  createHash('sha256').update(readAt2N(p)).digest('hex')
const blob = (rev: string, p: string): Buffer =>
  execSync(`git show ${rev}:${p}`, { encoding: 'buffer' as any }) as unknown as Buffer

const CONTENT = 'docs/exlib2g-plank-content.jsonl'
const RECORD = 'docs/exlib2j-plank-import-eligibility-admission-record.md'
const VERIFIER = 'scripts/verify-exlib2j.ts'
const SOURCE_TIP = '73231e928748c7499172c28445a1958b13eace12'
const APPROVED_SHA = '4191659387d0d42303feb486b0dd7d7a1a72407d5c97b492db062350033a68fe'
const ADMITTED_SHA = 'd82078490efa9ef13e128e7b7b742fbda8ea9e74e32382252d96c326c679d752'
const PHASE_NEW = [RECORD, VERIFIER].sort()
const PHASE_ALL = [...PHASE_NEW, CONTENT,
  'scripts/verify-exlib2g.ts', 'scripts/verify-exlib2h.ts', 'scripts/verify-exlib2i.ts'].sort()

const rec = read(RECORD)
const recFlat = rec.replace(/\s+/g, ' ')
const cur = parseJsonl(CONTENT)[0]

async function main(): Promise<void> {
  console.log('EXLIB-2J verification (R6 import-eligibility admission; eligibility ONLY)')

  console.log('\nA. Source and evidence freeze')
  {
    check('A1: exact source — the EXLIB-2I stable tag object peels to the source tip (ancestor of HEAD) whose tree is exact, and the approved pre-admission payload at that tip is exactly 2,848 B / 41916593...',
      (() => {
        try {
          if (execSync('git rev-parse exlib2i-plank-human-review-decision-stable^{}',
            { encoding: 'utf8' }).trim() !== SOURCE_TIP) return false
          execSync(`git merge-base --is-ancestor ${SOURCE_TIP} HEAD`, { stdio: 'pipe' })
          if (execSync(`git rev-parse ${SOURCE_TIP}^{tree}`, { encoding: 'utf8' }).trim() !== '08dc8e579354d98fb9c6629bec7a872a1c26de09') return false
        } catch { return false }
        const approved = blob(SOURCE_TIP, CONTENT)
        return approved.length === 2848 && shaBuf(approved) === APPROVED_SHA
      })())
    check('A2: the completed human-review form and the decision record remain byte-identical, and the human facts remain exact (Nick Tkacz / Personal Trainer / 2026-09-01T20:35:00-04:00 / approved / "Everything looks correct" / null evidence / seven true confirmations)',
      (() => {
        if (readFileSync('docs/exlib2h-plank-content-review-form-completed.json').length !== 2389 ||
          sha256('docs/exlib2h-plank-content-review-form-completed.json') !== '59ad2668790b6d0b135c8c453a702c45774f905ece8749a6112881b1df7e5b98') return false
        if (readFileSync('docs/exlib2i-plank-human-review-decision-record.md').length !== 5738 ||
          sha256('docs/exlib2i-plank-human-review-decision-record.md') !== '3df132666dcb97df07da2ab2da7e43dc799e52f859dd2034a73f6ea0e8029fbf') return false
        const comp = JSON.parse(read('docs/exlib2h-plank-content-review-form-completed.json'))
        return comp.decision === 'approved' && comp.reviewer === 'Nick Tkacz' &&
          comp.reviewer_role_or_credential === 'Personal Trainer' &&
          comp.reviewed_at === '2026-09-01T20:35:00-04:00' &&
          comp.rationale === 'Everything looks correct' && comp.evidence === null &&
          Object.values(comp.needs_human_judgment_confirmations).every((v: any) => v === true)
      })())
    check('A3: R6 and the eligibility lifecycle are quoted from the authoritative committed bytes — the schema really carries the exact R6 text and the const-false lifecycle comment the record quotes, the promoted review contract really carries the separately-approved-act rule, and the record honestly notes the schema\'s stale phase label',
      (() => {
        const schema = JSON.parse(read('docs/exlib2c-authoring-schema.json'))
        const r6: string = schema.x_mandatory_validator_rules[5]
        if (!r6.startsWith('R6: no record in any EXLIB-2C authoring batch may carry import_eligible true')) return false
        if (schema.properties.import_eligible.const !== false) return false
        if (!schema.properties.import_eligible.$comment.includes('flipping to true is a later, separately approved')) return false
        if (!read('docs/exlib2h-plank-content-review-packet.md').replace(/\s+/g, ' ')
          .includes('may become true ONLY through a later, separately approved act on an exact fingerprinted payload')) return false
        return rec.includes('R6: no record in any EXLIB-2C authoring batch may carry') &&
          recFlat.includes('flipping to true is a later, separately approved EXLIB-2F act on an exact fingerprinted payload') &&
          recFlat.includes('the schema\'s "EXLIB-2F" phase label was written before the phase sequence was renumbered') &&
          recFlat.includes('the act the schema describes is THIS milestone (EXLIB-2J)')
      })())
    check('A4: every R6 prerequisite is satisfied and recorded with committed evidence — later than authoring (2G/2H promoted), a separately approved act distinct from the content approval, the exact fingerprinted payload (2,848 B / 41916593...), and the human approval present; plus the authority determination (content-artifact field; the byte-frozen inventory is planning-time history, not a live eligibility ledger; legacy candidates a different population)',
      recFlat.includes('LATER THAN AUTHORING') &&
      recFlat.includes('SEPARATELY APPROVED ACT') &&
      recFlat.includes('approval alone never flips eligibility') &&
      recFlat.includes('EXACT FINGERPRINTED PAYLOAD') &&
      rec.includes(APPROVED_SHA) &&
      recFlat.includes('HUMAN APPROVAL PRESENT') &&
      recFlat.includes('No other authoritative artifact requires a change for R6 consistency') &&
      recFlat.includes('not a live eligibility ledger') &&
      recFlat.includes('a different, untouched population') &&
      recFlat.includes("R6's batch prohibition is untouched"))
  }

  console.log('\nB. The admitted state')
  {
    check('B1: the current content differs from the approved pre-admission bytes ONLY in import_eligible plus the disclosed truthful comment clause — every other record field is value-identical, content_review is byte-equivalent in value, and the current fingerprint is exactly 2,928 B / d8207849...',
      (() => {
        if (readFileSync(CONTENT).length !== 2928 || sha256(CONTENT) !== ADMITTED_SHA) return false
        const appRec = JSON.parse(blob(SOURCE_TIP, CONTENT).toString('utf8')
          .split('\n').filter((l) => l.trim() && !l.trim().startsWith('#'))[0])
        for (const k of Object.keys(appRec)) {
          if (k === 'import_eligible') continue
          if (JSON.stringify(appRec[k]) !== JSON.stringify(cur[k])) return false
        }
        if (JSON.stringify(Object.keys(appRec).sort()) !== JSON.stringify(Object.keys(cur).sort())) return false
        if (appRec.import_eligible !== false || cur.import_eligible !== true) return false
        const comment = read(CONTENT).split('\n')[0]
        return comment.startsWith('#') && comment.includes('import_eligible=true (EXLIB-2J R6 admission') &&
          comment.includes('any later content-byte change invalidates it') &&
          recFlat.includes('only the directly stale clause was revised') &&
          recFlat.includes('commentary, not a schema field')
      })())
    check('B2: import_eligible is TRUE, content_review remains approved with the exact human values, review_status remains "proposed" and independently governed (no coupled transition was inferred), and no publication key exists',
      cur.import_eligible === true &&
      cur.content_review.status === 'approved' &&
      cur.content_review.reviewer === 'Nick Tkacz' &&
      cur.content_review.reviewed_at === '2026-09-01T20:35:00-04:00' &&
      cur.content_review.rationale === 'Everything looks correct' &&
      cur.review_status === 'proposed' &&
      !Object.keys(cur).some((k) => k.includes('publication')) &&
      recFlat.includes('the schema mechanically requires no coupled transition and none was inferred') &&
      recFlat.includes('governed separately'))
    check('B3: the admission is fingerprint-bound and drift-invalidated — the record binds eligibility to exactly 2,928 B / d8207849... and states that ANY later content-byte change invalidates the admission and requires review/re-admission',
      rec.includes(ADMITTED_SHA) &&
      recFlat.includes('applies ONLY to the exact resulting fingerprint above') &&
      recFlat.includes('ANY later change to the content bytes INVALIDATES this admission') &&
      recFlat.includes('requires human review (or re-review) and a new, separately approved eligibility admission'))
  }

  console.log('\nC. Boundaries and lifecycle')
  {
    check('C1: seed, inventory, ledger, and legacy eligibility remain byte-identical to the source tip; seed_link_compatible remains false; the six batch corpora stay byte-frozen with every record import_eligible=false (R6\'s batch scope untouched)',
      (() => {
        for (const p of ['src/lib/supabase/seed-exercises.ts', 'docs/exlib2b-release1-inventory.jsonl',
          'docs/exlib1b1-review-ledger.jsonl', 'docs/exlib1c0a-equipment-resolution.jsonl']) {
          const now = execSync(`git hash-object "${p}"`, { encoding: 'utf8' }).trim()
          const tip = execSync(`git rev-parse "${SOURCE_TIP}:${p}"`, { encoding: 'utf8' }).trim()
          if (now !== tip) return false
        }
        const inv = parseJsonl('docs/exlib2b-release1-inventory.jsonl')
        const plank = inv.filter((r: any) => r.proposed_canonical_name === 'Plank')
        if (plank.length !== 1 || plank[0].seed_link_compatible !== false) return false
        const SHAS = ['8168fc196f89781e8a30b315f29d1c72f46afeff8edfe89d1812b0a150ece2b2',
          '1ddc3ab0bd92d60ef33960d82a8e0c8a2fdea1cb828d15fc9bf6a82c34305d48',
          'e4fca8b632c9c9af9b7c6eece660f2042b6a4c3ef613e14c278f95cf9fcab528',
          'e7def375e9b9560863796bff90746dc6ff2b2f7c4bd7735a3d53fc2cc9750568',
          '404722f1211e45c3b89ac8a32cceb617b958388c034b797dd2bba009aa127e5d',
          'ec0760be401bb1d4c479d340369d6b6b690acf57f2f7a0f7fbeeaa2cf40ab5d7']
        for (let i = 1; i <= 6; i += 1) {
          // RETARGET (EXLIB-2N review-decision application): batches 2
          // and 4 are anchored to the promoted 2N tip (their pending
          // bytes); the other four remain live byte-frozen claims.
          const shaOf = (i === 2 || i === 4) ? sha256At2N : sha256
          if (shaOf(`docs/exlib2c-release1-batch0${i}-content.jsonl`) !== SHAS[i - 1]) return false
        }
        return true
      })())
    check('C2: no load package, hosted mutation, runtime delivery, migration 027, API, UI, dependency, or configuration change — RETARGET (EXLIB-2M migration-027 apply-prep): the phase range and the migrations-exactly-26-with-no-027 inventory are anchored to the promoted EXLIB-2J tip (2a0465e), where they were true; EXLIB-2M later prepares (never applies) 027. Zero deliver_catalog_exercises references in src and no load-package artifact remain live claims',
      (() => {
        const TIP_2J = '2a0465e8be5ec2e33a41fde8f30d5fcd5a2de738'
        const range = execSync(`git diff --name-only ${SOURCE_TIP}..${TIP_2J}`, { encoding: 'utf8' })
          .split('\n').filter(Boolean)
        if (range.some((p) => !/^(docs\/|scripts\/verify-)/.test(p))) return false
        const files = execSync(`git ls-tree ${TIP_2J} supabase/migrations/ --name-only`, { encoding: 'utf8' })
          .split('\n').filter((f) => f.endsWith('.sql'))
        if (files.length !== 26 || files.some((f) => f.includes('/027'))) return false
        if (execSync("grep -rln 'deliver_catalog_exercises' src/ || true", { encoding: 'utf8' }).trim() !== '') return false
        // RETARGET (EXLIB-2K catalog-load preparation): the
        // no-load-payload/load-package claim is anchored to the
        // promoted EXLIB-2J tip, where it was true; EXLIB-2K later
        // prepares (never hosted-executes) the reviewed docs package.
        return !execSync(`git ls-tree ${TIP_2J} docs/ --name-only`, { encoding: 'utf8' })
          .split('\n').some((f) => f.includes('load-payload') || f.includes('load-package'))
      })())
    check('C3: the admission grants nothing further — the record explicitly separates human approval, eligibility, review_status, seed compatibility, loading, publication, and delivery activation, and states no hosted service was contacted',
      recFlat.includes('authorizes NO catalog snapshot, NO load package, NO loading, NO publication, NO delivery, NO runtime activation, NO hosted contact, NO seed edit, and NO seed_link_compatible flip') &&
      recFlat.includes('Catalog loading: NOT authorized') &&
      recFlat.includes('Delivery activation: NOT authorized') &&
      recFlat.includes('no hosted service was contacted in this milestone'))
    check('C4: the retargets are narrow, labeled, count-neutral, and anchored — verify-exlib2i/2g/2h each carry the RETARGET (EXLIB-2J R6 eligibility admission) label anchored to the promoted EXLIB-2I tip, where the ineligible claim really held',
      (() => {
        for (const f of ['scripts/verify-exlib2i.ts', 'scripts/verify-exlib2g.ts', 'scripts/verify-exlib2h.ts']) {
          const s = read(f)
          if (!s.includes('RETARGET (EXLIB-2J R6 eligibility admission)')) return false
          if (!s.includes('73231e928748c7499172c28445a1958b13eace12')) return false
        }
        const decRec = JSON.parse(blob(SOURCE_TIP, CONTENT).toString('utf8')
          .split('\n').filter((l) => l.trim() && !l.trim().startsWith('#'))[0])
        return decRec.import_eligible === false
      })())
    check('G1: lifecycle-safe phase boundary — the phase touches exactly six paths (two new: admission record, this verifier; four modified: the content record and the three labeled retargeted verifiers); strict porcelain while uncommitted, adder-anchored once committed',
      (() => {
        try {
          const inHead = (() => {
            try { execSync(`git cat-file -e HEAD:${RECORD}`, { stdio: 'pipe' }); return true } catch { return false }
          })()
          if (!inHead) {
            const entries = execSync('git status --porcelain', { encoding: 'utf8' })
              .split('\n').filter(Boolean).map((l) => l.trim()).sort()
            const expected = [...PHASE_NEW.map((f) => `?? ${f}`), `M ${CONTENT}`,
              'M scripts/verify-exlib2g.ts', 'M scripts/verify-exlib2h.ts', 'M scripts/verify-exlib2i.ts'].sort()
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
