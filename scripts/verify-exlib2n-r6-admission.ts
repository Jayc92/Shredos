// EXLIB-2N R6 import-eligibility ADMISSION verifier (Dead bug, Ab
// wheel rollout).
//
// Owns the admitted posture: the exact promoted source commit and
// annotated tag; the exact completed human-review forms; the exact
// pre-admission approved payloads; the one-field import_eligible
// false -> true JSON deltas proven independently per key; the
// truthful full-header commentary with explicit stale-claim
// rejection; the 126-record eligibility sweep (exactly the two
// admitted records eligible; every other record pending and
// ineligible); categories evidence-only and outside the authored
// schema; no UUID swap; no snapshot or load package; no publication
// or projection; no hosted-state claim; exact lifecycle boundaries;
// and the exact branch topology and five-path inventory. Performs NO
// hosted contact.
//
// Fail-closed: any mismatch fails the suite.

import { execSync } from 'child_process'
import { createHash } from 'crypto'

const SRC = 'd48a554454456713633bbc5bd3e4af5d8405135a'
// RETARGET (EXLIB-2O target-snapshot load prep): this suite proves
// the R6 ADMISSION milestone, promoted as the single commit
// 4e4a6e6... on the application tip. The EXLIB-2O milestone later
// advances HEAD (adding the prepared load package and its verifiers),
// so this suite's phase-range and committed-topology claims are
// anchored to that exact promoted admission tip, where they were and
// remain true. Claims over files EXLIB-2O does not touch stay live.
const TIP_R6 = '4e4a6e6c06ad3eaab234697cbc11725650f1a09f'
const SRC_TREE = '53196cd1927e2037f415b7dd5a92ee7280386df0'
const SRC_TAG = 'exlib2n-review-decision-application-stable'
const SRC_TAG_OBJ = '0802c029c1bc37d67579bf1ba7600cc70d510195'
const SRC_TAG_MSG = 'EXLIB-2N target-snapshot human-review decisions stable \u2014 APPROVED \u2014 NOT IMPORT ELIGIBLE OR LOADED\n'

const B02 = 'docs/exlib2c-release1-batch02-content.jsonl'
const B04 = 'docs/exlib2c-release1-batch04-content.jsonl'
const B02_PRE = { bytes: 51979, sha: 'c5679b103af90be8210c35ad1e76424d49696bd3316ed8fd73522f2096773726', line: 12, lineBytes: 1963, lineSha: '8fb7bbd7361451440a004d73f932f5651d69fda59d45c0c5d26e41a5415cf294' }
const B04_PRE = { bytes: 55298, sha: 'aaae85036135600e9fc27f8684f4b21aac7bc07c7cc69872e9932eeb73c1e9fb', line: 5, lineBytes: 2268, lineSha: '6257d16d40213358d7900f7a76b4d3a6ebc42dc22b8d966909c567cce55639e0' }
const B02_POST = { bytes: 52123, sha: 'ebca1c01ffa66c78bdc42fc2972cfd328a75d2d6c2735878f9445617c15743cc', line: 12, lineBytes: 1962, lineSha: '3fbbaccd7bdd152f86c8b4f46f4293e012494cdb5704b67d3762ec715d3dcf55' }
const B04_POST = { bytes: 55442, sha: 'c8a63ccbd7cc2913265926050480535f5d4adff585f1d462f9b2c2d30406fcf2', line: 5, lineBytes: 2267, lineSha: '4d09e2f9d9bef60bf01b00b1c84ea76563783c32995847a8e9dfde0ee740baa2' }
const DB_FORM = { path: 'docs/exlib2n-dead-bug-target-snapshot-review-form-completed.json', bytes: 5604, sha: 'ce555650a643077be099b9e65490e36d8731ce9c40ad0e3aa0e80065152cdbeb' }
const AW_FORM = { path: 'docs/exlib2n-ab-wheel-rollout-target-snapshot-review-form-completed.json', bytes: 5754, sha: 'efed7f1f59a040014dd6ca5df1276997de2f7410a186da10532fe987558181b5' }
const RECORD = 'docs/exlib2n-r6-eligibility-admission-record.md'
const VERIFIER = 'scripts/verify-exlib2n-r6-admission.ts'
const APP_VERIFIER = 'scripts/verify-exlib2n-application.ts'

const DB_CR = { status: 'approved', reviewer: 'Nick Tkacz', reviewed_at: '2026-09-03T15:47:00-04:00', rationale: 'matches my training and schooling' }
const AW_CR = { status: 'approved', reviewer: 'Nick Tkacz', reviewed_at: '2026-09-03T15:26:00-04:00', rationale: 'my training and schooling agrees with whats been done so far' }
const DB_UUID = 'e21b2c00-0000-4000-a000-000000000002'
const AW_UUID = 'e21b2c00-0000-4000-a000-000000000003'

const PHASE = [
  ['M', B02], ['M', B04], ['A', RECORD], ['A', VERIFIER], ['M', APP_VERIFIER],
].map(([s, p]) => `${s}\t${p}`).sort()

const HEADER_LINES = 4
const REQUIRED_TRUTHS = [
  'human-APPROVED (EXLIB-2N decision application) and IMPORT-ELIGIBLE (R6 eligibility admission)',
  'every other record in this batch remains PENDING REVIEW with null review evidence',
  'Every other record remains import_eligible=false',
  'review_status remains proposed for EVERY record, including the admitted one',
  'no publication state exists for any record in this batch',
  'import eligibility does NOT mean loaded, published, projected, or delivered',
]
const STALE_CLAIMS = [
  'import_eligible=false (including the approved record)',
  'Every record: provenance=forgefitos_original, review_status=proposed, import_eligible=false',
  'Every record: provenance=forgefitos_original, content_review pending',
  'with zero evidence',
  'nothing here is approved or loadable',
  'human content approval does NOT make any record loadable',
]

const sha256 = (buf: Buffer | string): string => createHash('sha256').update(buf).digest('hex')
const blobAt = (ref: string, p: string): Buffer =>
  execSync(`git cat-file blob ${ref}:${p}`, { maxBuffer: 1 << 26 })
const lines = (b: Buffer): string[] => b.toString('utf8').split('\n')
const parseRecs = (b: Buffer): any[] => lines(b)
  .filter((l) => l.trim() && !l.trim().startsWith('#')).map((l) => JSON.parse(l))

let pass = 0
let fail = 0
const check = (name: string, ok: boolean): void => {
  if (ok) { pass += 1; console.log(`  PASS  ${name}`) }
  else { fail += 1; console.log(`  FAIL  ${name}`) }
}

const committed = execSync(`git rev-list --count ${SRC}..HEAD`, { encoding: 'utf8' }).trim() !== '0'
const AT = committed ? 'HEAD' : SRC
// In the uncommitted authoring state the edited bytes live in the
// worktree; read them there. Once committed, read HEAD.
import { readFileSync, existsSync } from 'fs'
const bytesOf = (p: string): Buffer => (committed ? blobAt('HEAD', p) : readFileSync(p))

console.log(`EXLIB-2N R6 eligibility-admission verification (${committed ? 'committed' : 'uncommitted authoring'} state)`)

console.log('\nA. Promoted source and tag')
check('A1: the promoted application tag is the exact annotated object, peels to the promoted source tip (ancestor of HEAD) whose tree is exact, with the byte-exact annotation',
  (() => {
    try {
      if (execSync(`git cat-file -t refs/tags/${SRC_TAG}`, { encoding: 'utf8' }).trim() !== 'tag') return false
      if (execSync(`git rev-parse refs/tags/${SRC_TAG}`, { encoding: 'utf8' }).trim() !== SRC_TAG_OBJ) return false
      if (execSync(`git rev-parse refs/tags/${SRC_TAG}^{}`, { encoding: 'utf8' }).trim() !== SRC) return false
      execSync(`git merge-base --is-ancestor ${SRC} HEAD`, { stdio: 'pipe' })
      if (execSync(`git rev-parse ${SRC}^{tree}`, { encoding: 'utf8' }).trim() !== SRC_TREE) return false
      const raw = execSync(`git cat-file tag refs/tags/${SRC_TAG}`, { encoding: 'buffer' as any }) as unknown as Buffer
      const msg = raw.toString('utf8').split('\n\n').slice(1).join('\n\n')
      return msg === SRC_TAG_MSG
    } catch { return false }
  })())

console.log('\nB. Completed forms and pre-admission payloads')
check('B1: both completed human-review forms are byte-exact and unchanged from the promoted source',
  (() => {
    for (const f of [DB_FORM, AW_FORM]) {
      const d = bytesOf(f.path)
      if (d.length !== f.bytes || sha256(d) !== f.sha) return false
      if (!d.equals(blobAt(SRC, f.path))) return false
    }
    return true
  })())
check('B2: the exact pre-admission approved payloads are pinned — batch files and record lines match the promoted application fingerprints at the source tip',
  (() => {
    for (const [p, pre] of [[B02, B02_PRE], [B04, B04_PRE]] as [string, typeof B02_PRE][]) {
      const d = blobAt(SRC, p)
      if (d.length !== pre.bytes || sha256(d) !== pre.sha) return false
      const ln = Buffer.from(lines(d)[pre.line - 1], 'utf8')
      if (ln.length !== pre.lineBytes || sha256(ln) !== pre.lineSha) return false
    }
    return true
  })())

console.log('\nC. The one-field JSON transitions')
const transition = (p: string, pre: typeof B02_PRE, post: typeof B02_POST, cr: any, name: string): boolean => {
  const preB = blobAt(SRC, p)
  const postB = bytesOf(p)
  if (postB.length !== post.bytes || sha256(postB) !== post.sha) return false
  const a = lines(preB)
  const b = lines(postB)
  if (a.length !== b.length) return false
  const diffs = a.map((l, i) => (l !== b[i] ? i + 1 : 0)).filter(Boolean)
  if (JSON.stringify(diffs) !== JSON.stringify([1, 2, 3, 4, post.line])) return false
  const rp = JSON.parse(a[post.line - 1])
  const rq = JSON.parse(b[post.line - 1])
  if (JSON.stringify(Object.keys(rp)) !== JSON.stringify(Object.keys(rq))) return false
  const delta = Object.keys(rp).filter((k) => JSON.stringify(rp[k]) !== JSON.stringify(rq[k]))
  if (JSON.stringify(delta) !== JSON.stringify(['import_eligible'])) return false
  if (rp.import_eligible !== false || rq.import_eligible !== true) return false
  if (JSON.stringify(rq.content_review) !== JSON.stringify(cr)) return false
  if (rq.review_status !== 'proposed' || rq.deferred !== false) return false
  if (rq.proposed_canonical_name !== name) return false
  if ('category' in rq || 'reviewer_role_or_credential' in rq || 'snapshot_category_decision' in rq) return false
  if (Object.keys(rq).some((k) => k.includes('publication') || k.includes('publish'))) return false
  const lb = Buffer.from(b[post.line - 1], 'utf8')
  return lb.length === post.lineBytes && sha256(lb) === post.lineSha
}
check('C1: Dead bug admission exact by proof — batch02 differs from the promoted source in exactly lines {1,2,3,4,12}; line 12 changes ONLY import_eligible false -> true; content_review value-identical; review_status proposed; deferred false; no category or publication key; post fingerprints exact',
  transition(B02, B02_PRE, B02_POST, DB_CR, 'Dead bug'))
check('C2: Ab wheel rollout admission exact by proof — batch04 differs from the promoted source in exactly lines {1,2,3,4,5}; line 5 changes ONLY import_eligible false -> true; content_review value-identical; review_status proposed; deferred false; no category or publication key; post fingerprints exact',
  transition(B04, B04_PRE, B04_POST, AW_CR, 'Ab wheel rollout'))

console.log('\nD. Truthful headers')
check('D1: every leading header line is truthful commentary — exactly four # lines per batch stating the six required truths; every stale claim is rejected; all four lines are dropped by the shared parse filter; record counts unchanged',
  (() => {
    for (const [p, name] of [[B02, 'Dead bug'], [B04, 'Ab wheel rollout']] as [string, string][]) {
      const post = lines(bytesOf(p))
      const pre = lines(blobAt(SRC, p))
      for (let i = 0; i < HEADER_LINES; i += 1) if (!post[i].startsWith('#')) return false
      if (post[HEADER_LINES].startsWith('#')) return false
      const hdr = post.slice(0, HEADER_LINES).join('\n')
      if (!hdr.includes(name)) return false
      for (const t of REQUIRED_TRUTHS) if (!hdr.includes(t)) return false
      for (const sc of STALE_CLAIMS) if (hdr.includes(sc)) return false
      if (post.slice(0, HEADER_LINES).filter((l) => l.trim() && !l.trim().startsWith('#')).length !== 0) return false
      const count = (ls: string[]): number => ls.filter((l) => l.trim() && !l.trim().startsWith('#')).length
      if (count(pre) !== 25 || count(post) !== 25) return false
    }
    return true
  })())

console.log('\nE. The eligibility sweep and separate axes')
check('E1: across all six authored batches, EXACTLY the two admitted records are import-eligible (Dead bug, Ab wheel rollout — both approved); the other 124 remain pending, ineligible, with null evidence; no record carries a publication key',
  (() => {
    let eligible = 0
    let others = 0
    for (let i = 1; i <= 6; i += 1) {
      const recs = parseRecs(bytesOf(`docs/exlib2c-release1-batch0${i}-content.jsonl`))
      for (const r of recs) {
        if (Object.keys(r).some((k) => k.includes('publication') || k.includes('publish'))) return false
        if (r.import_eligible === true) {
          eligible += 1
          if (!['Dead bug', 'Ab wheel rollout'].includes(r.proposed_canonical_name)) return false
          if (r.content_review.status !== 'approved') return false
          if (r.review_status !== 'proposed' || r.deferred !== false) return false
        } else {
          others += 1
          if (r.import_eligible !== false) return false
          if (r.content_review.status !== 'pending' || r.content_review.reviewer !== null) return false
        }
      }
    }
    return eligible === 2 && others === 124
  })())
check('E2: categories remain evidence-only and OUTSIDE the authored schema — the completed forms carry mobility/other; the schema has no category property; neither admitted record gained any key',
  (() => {
    const db = JSON.parse(bytesOf(DB_FORM.path).toString('utf8'))
    const aw = JSON.parse(bytesOf(AW_FORM.path).toString('utf8'))
    if (db.snapshot_category_decision !== 'mobility' || aw.snapshot_category_decision !== 'other') return false
    const schema = JSON.parse(bytesOf('docs/exlib2c-authoring-schema.json').toString('utf8'))
    return schema.additionalProperties === false && !('category' in schema.properties)
  })())
check('E3: no UUID swap — the completed forms bind Dead bug to ...0002 and Ab wheel rollout to ...0003, and the admission record repeats the binding',
  (() => {
    const db = JSON.parse(bytesOf(DB_FORM.path).toString('utf8'))
    const aw = JSON.parse(bytesOf(AW_FORM.path).toString('utf8'))
    const rec = bytesOf(RECORD).toString('utf8').replace(/\s+/g, ' ')
    return db.intended_logical_uuid === DB_UUID && aw.intended_logical_uuid === AW_UUID
      && rec.includes(`Dead bug = ${DB_UUID}`) && rec.includes(`rollout = ${AW_UUID}`)
  })())
check('E4: Plank is a separate, untouched population — the admitted Plank artifact stays byte-frozen with its own promoted admission, and the frozen inventory and ledger are untouched',
  (() => {
    const a = bytesOf('docs/exlib2g-plank-content.jsonl')
    if (a.length !== 2928 || sha256(a) !== 'd82078490efa9ef13e128e7b7b742fbda8ea9e74e32382252d96c326c679d752') return false
    if (sha256(bytesOf('docs/exlib2b-release1-inventory.jsonl')) !== 'd349110f22700a822eb427fc1dcce3e6dbcfd264b6d48ed84936b07b1ca256f5') return false
    return sha256(bytesOf('docs/exlib1b1-review-ledger.jsonl')) === 'aa4fe77c0c633510661eede94b40e9bae4aca90a7d8c2794abde92c83c6f7b7b'
  })())

console.log('\nF. Lifecycle boundaries')
check('F1: no snapshot, load package, SQL artifact, or hosted claim — the phase adds no .sql and no loader invocation; the record states the gate stays OPEN, both UUIDs stay BARE, and no hosted service was contacted',
  (() => {
    const rec = bytesOf(RECORD).toString('utf8')
    const flat = rec.replace(/\s+/g, ' ')
    if (!flat.includes('hosted target-snapshot gate remains OPEN')) return false
    if (!flat.includes('remain BARE identities on hosted ShredOS')) return false
    if (!flat.includes('no hosted contact of any kind')) return false
    if (!flat.includes('ChatGPT and Claude did NOT perform, influence, or fabricate the human reviews')) return false
    if (!flat.includes('ANY later change to either record\u0027s content bytes INVALIDATES')) return false
    // RETARGET (EXLIB-2O target-snapshot load prep): anchored range —
    // EXLIB-2O legitimately adds a docs-only .sql load package later
    const phase = committed
      ? execSync(`git diff --name-only ${SRC}..${TIP_R6}`, { encoding: 'utf8' }).split('\n').filter(Boolean)
      : execSync('git status --porcelain', { encoding: 'utf8' }).split('\n').filter(Boolean).map((l) => l.slice(3).trim())
    if (phase.some((p) => p.endsWith('.sql'))) return false
    const spent = bytesOf('docs/exlib2k-plank-catalog-load-package.sql')
    return spent.length === 29760 && sha256(spent) === 'a1b6dd55850c5d544e2f484d1ce4833b41deec7f3dd4d4c2373cb3b50daaccf0'
  })())
check('F2: the admission record binds every fingerprint set and the exact human facts without embellishment, and separates approval, eligibility, category, snapshot state, review, publication, projection, delivery, seed, and compatibility',
  (() => {
    const solid = bytesOf(RECORD).toString('utf8').replace(/\s+/g, '')
    for (const s of [B02_PRE.sha, B04_PRE.sha, B02_POST.sha, B04_POST.sha,
      B02_PRE.lineSha, B04_PRE.lineSha, B02_POST.lineSha, B04_POST.lineSha,
      DB_FORM.sha, AW_FORM.sha]) {
      if (!solid.includes(s)) return false
    }
    const flat = bytesOf(RECORD).toString('utf8').replace(/\s+/g, ' ')
    return flat.includes('Nick Tkacz') && flat.includes('personal trainer')
      && flat.includes('2026-09-03T15:47:00-04:00') && flat.includes('2026-09-03T15:26:00-04:00')
      && flat.includes('Dead bug = mobility') && flat.includes('Ab wheel rollout = other')
      && flat.includes('Explicit separations (unchanged by this admission)')
      && flat.includes('review_status remains "proposed"')
  })())

console.log('\nG. Branch topology and phase inventory')
if (committed) {
  check('G1: admission parentage — the merge base of HEAD and the promoted source IS the source, HEAD\u0027s only parent IS the source (single parent)',
    (() => {
      try {
        // RETARGET (EXLIB-2O target-snapshot load prep): anchored
        if (execSync(`git merge-base ${SRC} ${TIP_R6}`, { encoding: 'utf8' }).trim() !== SRC) return false
        if (execSync(`git rev-parse ${TIP_R6}^1`, { encoding: 'utf8' }).trim() !== SRC) return false
        const parents = execSync(`git rev-list --parents -n 1 ${TIP_R6}`, { encoding: 'utf8' }).trim().split(/\s+/)
        return parents.length === 2 && parents[1] === SRC
      } catch { return false }
    })())
  check('G2: admission distance and purity — exactly 1 ahead / 0 behind the promoted source; one commit; zero merges',
    (() => {
      // RETARGET (EXLIB-2O target-snapshot load prep): anchored
      const ahead = execSync(`git rev-list --count ${SRC}..${TIP_R6}`, { encoding: 'utf8' }).trim()
      const behind = execSync(`git rev-list --count ${TIP_R6}..${SRC}`, { encoding: 'utf8' }).trim()
      const merges = execSync(`git rev-list --count --merges ${SRC}..${TIP_R6}`, { encoding: 'utf8' }).trim()
      return ahead === '1' && behind === '0' && merges === '0'
    })())
  check('G3: exact phase inventory — the single commit carries exactly the five disclosed paths (2 modified batch files, 2 additions, 1 labeled retargeted suite) and nothing else',
    (() => {
      // RETARGET (EXLIB-2O target-snapshot load prep): anchored
      const status = execSync(`git diff --name-status ${SRC}..${TIP_R6}`, { encoding: 'utf8' })
        .split('\n').filter(Boolean).sort()
      return JSON.stringify(status) === JSON.stringify(PHASE)
    })())
} else {
  check('G1-G3 (uncommitted authoring state): the worktree changes are exactly the five phase paths',
    (() => {
      const porc = execSync('git status --porcelain', { encoding: 'utf8' }).split('\n').filter(Boolean)
      const paths = porc.map((l) => l.slice(3).trim()).sort()
      const expected = PHASE.map((s) => s.split('\t')[1]).sort()
      return JSON.stringify(paths) === JSON.stringify(expected)
    })())
}
check('G4: the retargeted application verifier carries the admission label and its anchored source constant',
  (() => {
    const v = bytesOf(APP_VERIFIER).toString('utf8')
    return v.includes('RETARGET (EXLIB-2N R6 eligibility admission)')
      && v.includes(`const TIP_APP = '${SRC}'`)
  })())

console.log('\nH. Hygiene')
check('H1: character discipline — both admitted record lines and all eight header lines are pure ASCII; the record contains no non-ASCII beyond the em-dash; no phase file carries credential material or remote execution commands',
  (() => {
    const ascii = (s: string): boolean => {
      for (const ch of s) {
        const c = ch.codePointAt(0) as number
        if (c > 127 || (c < 32 && ch !== '\n')) return false
      }
      return true
    }
    for (const [p, ln] of [[B02, 12], [B04, 5]] as [string, number][]) {
      const ls = lines(bytesOf(p))
      if (!ascii(ls[ln - 1])) return false
      for (let i = 0; i < HEADER_LINES; i += 1) if (!ascii(ls[i])) return false
    }
    for (const ch of bytesOf(RECORD).toString('utf8')) {
      const c = ch.codePointAt(0) as number
      if (c > 127 && c !== 0x2014) return false
      if (c < 32 && ch !== '\n') return false
    }
    const bads = ['SUPABASE_' + 'SERVICE', 'sb_' + 'secret', 'eyJ' + 'hb',
      '--db' + '-url', '--lin' + 'ked', 'db ' + 'push', 'psql' + ' -', 'SET' + ' ROLE']
    const payload = [RECORD, VERIFIER].map((p) => bytesOf(p).toString('utf8')).join('\n')
    return bads.every((b) => !payload.includes(b))
  })())
check('H2: two-state lifecycle — the admission record and this verifier are absent at the promoted source tip and present in this phase',
  (() => {
    const srcDocs = execSync(`git ls-tree ${SRC} docs/ --name-only`, { encoding: 'utf8' })
    const srcScripts = execSync(`git ls-tree ${SRC} scripts/ --name-only`, { encoding: 'utf8' })
    if (srcDocs.includes('exlib2n-r6-eligibility-admission-record')) return false
    if (srcScripts.includes('verify-exlib2n-r6-admission')) return false
    bytesOf(RECORD)
    bytesOf(VERIFIER)
    return true
  })())

console.log(`\n${pass} passed, ${fail} failed`)
if (fail > 0) process.exit(1)
