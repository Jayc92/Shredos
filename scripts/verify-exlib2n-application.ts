// EXLIB-2N review-decision APPLICATION verifier.
//
// Owns the applied-state posture: the two completed human-review
// forms are committed byte-exact with their protected fields
// undisturbed; the two approved decisions are applied MINIMALLY to
// exactly the schema-defined content_review fields of the two
// authored records (proven line-by-line against the promoted 2N tip
// blobs); the header changes are commentary only; the category
// decisions live in evidence, never in the authored schema; every
// downstream lock (review_status, import_eligible, loading,
// publication, projection) remains closed; the UUID mappings are
// never swapped; no hosted-state claim is made; and the lifecycle
// history is exact. Performs NO hosted contact.
//
// Fail-closed: any mismatch fails the suite.

import { execSync } from 'child_process'
import { createHash } from 'crypto'
import { readFileSync } from 'fs'

const TIP = 'c9c1afd7df35f2870430da3a8d1295ff7e48e11d'
const TIP_TREE = 'c645439460601d44b9c889e2ac4e83cb624ea48d'
const TAG = 'exlib2n-target-snapshot-review-prep-stable'
const TAG_OBJ = '59c853c12455d1ac00522c479a2d5aad86b6c6ab'
// RETARGET (EXLIB-2N R6 eligibility admission): this suite proves the
// APPLICATION milestone, promoted as the single commit d48a554... on
// the 2N tip. The R6 admission milestone later flips import_eligible
// on exactly the two admitted records (changing the two batch files
// and HEAD topology), so this suite's phase claims — post-transition
// batch bytes, the 126-record eligibility sweep, the 19-path range,
// and the G replacement-branch topology — are anchored to that exact
// promoted application tip, where they were and remain true. Claims
// over files the admission does not touch stay live.
const TIP_APP = 'd48a554454456713633bbc5bd3e4af5d8405135a'

const B02 = 'docs/exlib2c-release1-batch02-content.jsonl'
const B04 = 'docs/exlib2c-release1-batch04-content.jsonl'
const B02_PRE = { bytes: 51496, sha: '1ddc3ab0bd92d60ef33960d82a8e0c8a2fdea1cb828d15fc9bf6a82c34305d48' }
const B04_PRE = { bytes: 54781, sha: 'e7def375e9b9560863796bff90746dc6ff2b2f7c4bd7735a3d53fc2cc9750568' }
// Corrected post fingerprints (Codex round 2): ALL FOUR leading header
// comment lines are rewritten truthful, so the changed-line set per
// file is exactly {1,2,3,4, record line}. The first-application
// fingerprints (51,690 B / 253a65b2..., 55,009 B / 1ddbd200...) are
// SUPERSEDED and live only on the preserved five-commit branch.
const B02_POST = { bytes: 51979, sha: 'c5679b103af90be8210c35ad1e76424d49696bd3316ed8fd73522f2096773726', line: 12, lineBytes: 1963, lineSha: '8fb7bbd7361451440a004d73f932f5651d69fda59d45c0c5d26e41a5415cf294' }
const B04_POST = { bytes: 55298, sha: 'aaae85036135600e9fc27f8684f4b21aac7bc07c7cc69872e9932eeb73c1e9fb', line: 5, lineBytes: 2268, lineSha: '6257d16d40213358d7900f7a76b4d3a6ebc42dc22b8d966909c567cce55639e0' }
const HEADER_LINES = 4

const DB_BLANK = 'docs/exlib2n-dead-bug-target-snapshot-review-form.json'
const AW_BLANK = 'docs/exlib2n-ab-wheel-rollout-target-snapshot-review-form.json'
const DB_DONE = 'docs/exlib2n-dead-bug-target-snapshot-review-form-completed.json'
const AW_DONE = 'docs/exlib2n-ab-wheel-rollout-target-snapshot-review-form-completed.json'
const DB_BLANK_FP = { bytes: 5499, sha: '2e6f41fff5103cb9537a224bac4277f79d1b08f4530cb218bdc9db59eb714fa8' }
const AW_BLANK_FP = { bytes: 5612, sha: '312e78558fd42387870dc686b7b48d3ea3b1434ea24165973667623897a795e6' }
const DB_DONE_FP = { bytes: 5604, sha: 'ce555650a643077be099b9e65490e36d8731ce9c40ad0e3aa0e80065152cdbeb' }
const AW_DONE_FP = { bytes: 5754, sha: 'efed7f1f59a040014dd6ca5df1276997de2f7410a186da10532fe987558181b5' }

const RECORD = 'docs/exlib2n-review-decision-application-record.md'
const VERIFIER = 'scripts/verify-exlib2n-application.ts'
const DB_UUID = 'e21b2c00-0000-4000-a000-000000000002'
const AW_UUID = 'e21b2c00-0000-4000-a000-000000000003'

const DB_CR = { status: 'approved', reviewer: 'Nick Tkacz', reviewed_at: '2026-09-03T15:47:00-04:00', rationale: 'matches my training and schooling' }
const AW_CR = { status: 'approved', reviewer: 'Nick Tkacz', reviewed_at: '2026-09-03T15:26:00-04:00', rationale: 'my training and schooling agrees with whats been done so far' }

const HUMAN = ['decision', 'reviewer', 'reviewer_role_or_credential', 'reviewed_at',
  'evidence', 'rationale', 'snapshot_category_decision', 'snapshot_category_rationale']
const RETARGETED = [
  'scripts/verify-exlib2c-batch02.ts', 'scripts/verify-exlib2c-batch03.ts',
  'scripts/verify-exlib2c-batch04.ts', 'scripts/verify-exlib2c-batch05.ts',
  'scripts/verify-exlib2c-batch06.ts', 'scripts/verify-exlib2d.ts',
  'scripts/verify-exlib2e.ts', 'scripts/verify-exlib2f.ts',
  'scripts/verify-exlib2f-application.ts', 'scripts/verify-exlib2g.ts',
  'scripts/verify-exlib2j.ts', 'scripts/verify-exlib2l.ts', 'scripts/verify-exlib2n.ts',
]
const PHASE_PATHS = [
  ['M', B02], ['M', B04],
  ['A', AW_DONE], ['A', DB_DONE], ['A', RECORD], ['A', VERIFIER],
  ...RETARGETED.map((p) => ['M', p]),
].map(([s, p]) => `${s}\t${p}`).sort()

const sha256 = (buf: Buffer | string): string => createHash('sha256').update(buf).digest('hex')
const blobAt = (ref: string, p: string): Buffer =>
  execSync(`git cat-file blob ${ref}:${p}`, { maxBuffer: 1 << 26 })
const flat = (s: string): string => s.replace(/\s+/g, ' ')

let pass = 0
let fail = 0
const check = (name: string, ok: boolean): void => {
  if (ok) { pass += 1; console.log(`  PASS  ${name}`) }
  else { fail += 1; console.log(`  FAIL  ${name}`) }
}

const dbBlank = JSON.parse(blobAt('HEAD', DB_BLANK).toString('utf8'))
const awBlank = JSON.parse(blobAt('HEAD', AW_BLANK).toString('utf8'))
const dbDone = JSON.parse(blobAt('HEAD', DB_DONE).toString('utf8'))
const awDone = JSON.parse(blobAt('HEAD', AW_DONE).toString('utf8'))
const recFlat = flat(blobAt('HEAD', RECORD).toString('utf8'))

console.log('EXLIB-2N review-decision APPLICATION verifier')

console.log('\nA. Source refs and upstream freeze')
check('A1: the promoted 2N preparation tag is the exact annotated object, peels to the promoted tip (ancestor of HEAD) whose tree is exact',
  (() => {
    try {
      if (execSync(`git cat-file -t refs/tags/${TAG}`, { encoding: 'utf8' }).trim() !== 'tag') return false
      if (execSync(`git rev-parse refs/tags/${TAG}`, { encoding: 'utf8' }).trim() !== TAG_OBJ) return false
      if (execSync(`git rev-parse refs/tags/${TAG}^{}`, { encoding: 'utf8' }).trim() !== TIP) return false
      execSync(`git merge-base --is-ancestor ${TIP} HEAD`, { stdio: 'pipe' })
      return execSync(`git rev-parse ${TIP}^{tree}`, { encoding: 'utf8' }).trim() === TIP_TREE
    } catch { return false }
  })())
check('A2: upstream authorities byte-frozen — the admitted Plank artifact, the SPENT EXLIB-2K package, the packets, the preparation record, and exactly 27 migrations with no 028',
  (() => {
    const a = blobAt('HEAD', 'docs/exlib2g-plank-content.jsonl')
    const p = blobAt('HEAD', 'docs/exlib2k-plank-catalog-load-package.sql')
    if (a.length !== 2928 || sha256(a) !== 'd82078490efa9ef13e128e7b7b742fbda8ea9e74e32382252d96c326c679d752') return false
    if (p.length !== 29760 || sha256(p) !== 'a1b6dd55850c5d544e2f484d1ce4833b41deec7f3dd4d4c2373cb3b50daaccf0') return false
    for (const [f, tipF] of [['docs/exlib2n-dead-bug-target-snapshot-review-packet.md', true],
      ['docs/exlib2n-ab-wheel-rollout-target-snapshot-review-packet.md', true],
      ['docs/exlib2n-target-snapshot-review-preparation-record.md', true]] as [string, boolean][]) {
      if (tipF && !blobAt('HEAD', f).equals(blobAt(TIP, f))) return false
    }
    const migs = execSync('git ls-tree HEAD supabase/migrations/ --name-only', { encoding: 'utf8' })
      .split('\n').filter((f) => /\/0\d\d_.+\.sql$/.test(f))
    return migs.length === 27 && !migs.some((f) => f.includes('/028'))
  })())

console.log('\nB. Completed-form evidence')
check('B1: both completed forms are committed byte-exact — Dead bug 5,604 B / ce555650..., Ab wheel rollout 5,754 B / efed7f1f... (the corrected-timestamp revision)',
  (() => {
    const d = blobAt('HEAD', DB_DONE)
    const a = blobAt('HEAD', AW_DONE)
    return d.length === DB_DONE_FP.bytes && sha256(d) === DB_DONE_FP.sha
      && a.length === AW_DONE_FP.bytes && sha256(a) === AW_DONE_FP.sha
  })())
check('B2: both promoted BLANK forms are preserved byte-identical at their original paths as historical evidence',
  (() => {
    const d = blobAt('HEAD', DB_BLANK)
    const a = blobAt('HEAD', AW_BLANK)
    return d.length === DB_BLANK_FP.bytes && sha256(d) === DB_BLANK_FP.sha
      && a.length === AW_BLANK_FP.bytes && sha256(a) === AW_BLANK_FP.sha
      && d.equals(blobAt(TIP, DB_BLANK)) && a.equals(blobAt(TIP, AW_BLANK))
  })())
check('B3: protected-field discipline — every non-human field of each completed form deep-equals its blank form, with identical key sets and order',
  (() => {
    for (const [done, blank] of [[dbDone, dbBlank], [awDone, awBlank]]) {
      if (JSON.stringify(Object.keys(done)) !== JSON.stringify(Object.keys(blank))) return false
      for (const k of Object.keys(blank)) {
        if (HUMAN.includes(k) || k === 'needs_human_judgment_confirmations') continue
        if (JSON.stringify(done[k]) !== JSON.stringify(blank[k])) return false
      }
      const cb = Object.keys(blank.needs_human_judgment_confirmations)
      const cd = Object.keys(done.needs_human_judgment_confirmations)
      if (JSON.stringify(cb) !== JSON.stringify(cd)) return false
    }
    return true
  })())
check('B4: exact human facts — both approved by Nick Tkacz / personal trainer at the exact Eastern-daylight offsets, rationales >= 10 non-blank chars, all confirmations Boolean true (9 + 10), optional evidence null',
  (() => {
    const nb = (s: string): number => {
      let n = 0
      for (const c of s) { if (!/\s/.test(c)) n += 1 }
      return n
    }
    for (const [f, ts, n] of [[dbDone, DB_CR.reviewed_at, 9], [awDone, AW_CR.reviewed_at, 10]] as [any, string, number][]) {
      if (f.decision !== 'approved' || f.reviewer !== 'Nick Tkacz'
        || f.reviewer_role_or_credential !== 'personal trainer'
        || f.reviewed_at !== ts || f.evidence !== null) return false
      if (nb(f.rationale) < 10 || nb(f.snapshot_category_rationale) < 10) return false
      const vals = Object.values(f.needs_human_judgment_confirmations)
      if (vals.length !== n || !vals.every((v) => v === true)) return false
    }
    return true
  })())
check('B5: exact category decisions — Dead bug = mobility, Ab wheel rollout = other; vocabulary intact; the Dead bug external "isolation" evidence stayed unselected and byte-unchanged',
  (() => {
    if (dbDone.snapshot_category_decision !== 'mobility') return false
    if (awDone.snapshot_category_decision !== 'other') return false
    const VOCAB = ['compound', 'isolation', 'cardio', 'mobility', 'other']
    if (JSON.stringify(dbDone.snapshot_category_vocabulary) !== JSON.stringify(VOCAB)) return false
    if (JSON.stringify(awDone.snapshot_category_vocabulary) !== JSON.stringify(VOCAB)) return false
    if (JSON.stringify(dbDone.snapshot_category_evidence) !== JSON.stringify(dbBlank.snapshot_category_evidence)) return false
    if (dbDone.snapshot_category_decision === 'isolation') return false
    return awDone.snapshot_category_evidence.exists === false
  })())

console.log('\nC. Minimal authored-record transitions')
const transition = (path: string, pre: any, post: any, cr: any): boolean => {
  const preBuf = blobAt(TIP, path)
  // RETARGET (EXLIB-2N R6 eligibility admission): post bytes anchored
  const postBuf = blobAt(TIP_APP, path)
  if (preBuf.length !== pre.bytes || sha256(preBuf) !== pre.sha) return false
  if (postBuf.length !== post.bytes || sha256(postBuf) !== post.sha) return false
  const preLines = preBuf.toString('utf8').split('\n')
  const postLines = postBuf.toString('utf8').split('\n')
  if (preLines.length !== postLines.length) return false
  const diffs = preLines.map((l, i) => (l !== postLines[i] ? i + 1 : 0)).filter(Boolean)
  // Codex round 2: the ENTIRE four-line header is corrected truthful,
  // so the exact changed-line set is {1,2,3,4, record line}.
  if (JSON.stringify(diffs) !== JSON.stringify([1, 2, 3, 4, post.line])) return false
  for (let i = 0; i < HEADER_LINES; i += 1) {
    if (!preLines[i].startsWith('#') || !postLines[i].startsWith('#')) return false
  }
  if (postLines[HEADER_LINES].startsWith('#')) return false
  const recPre = JSON.parse(preLines[post.line - 1])
  const recPost = JSON.parse(postLines[post.line - 1])
  if (JSON.stringify(Object.keys(recPre)) !== JSON.stringify(Object.keys(recPost))) return false
  const changed = Object.keys(recPre).filter((k) => JSON.stringify(recPre[k]) !== JSON.stringify(recPost[k]))
  if (JSON.stringify(changed) !== JSON.stringify(['content_review'])) return false
  if (JSON.stringify(recPost.content_review) !== JSON.stringify(cr)) return false
  const lb = Buffer.from(postLines[post.line - 1], 'utf8')
  return lb.length === post.lineBytes && sha256(lb) === post.lineSha
}
check('C1: Dead bug transition exact by proof — batch02 differs from the promoted 2N tip in exactly lines {1,2,3,4,12} (the full corrected header plus the record line); line 12 changes ONLY content_review, to exactly the approved human decision; post fingerprints exact',
  transition(B02, B02_PRE, B02_POST, DB_CR))
check('C2: Ab wheel rollout transition exact by proof — batch04 differs from the promoted 2N tip in exactly lines {1,2,3,4,5} (the full corrected header plus the record line); line 5 changes ONLY content_review, to exactly the approved human decision; post fingerprints exact',
  transition(B04, B04_PRE, B04_POST, AW_CR))
check('C3: EVERY leading header line is truthful COMMENTARY (Codex round 2) — each batch carries exactly four leading # lines stating the named approved record, every other record pending, import_eligible=false for every record, no publication state, and approval-does-not-make-loadable; the three stale claims are rejected; all four lines are dropped by the shared parse filter and record counts are unchanged',
  (() => {
    for (const [path, name] of [[B02, 'Dead bug'], [B04, 'Ab wheel rollout']] as [string, string][]) {
      const pre = blobAt(TIP, path).toString('utf8').split('\n')
      // RETARGET (EXLIB-2N R6 eligibility admission): anchored
      const post = blobAt(TIP_APP, path).toString('utf8').split('\n')
      for (let i = 0; i < HEADER_LINES; i += 1) if (!post[i].startsWith('#')) return false
      if (post[HEADER_LINES].startsWith('#')) return false
      const hdr = post.slice(0, HEADER_LINES).join('\n')
      // the five required truths, each stated in the corrected header
      if (!hdr.includes(`${name}`) || !hdr.includes('APPROVED by named human review')) return false
      if (!hdr.includes('every other record in this batch remains PENDING REVIEW')) return false
      if (!hdr.includes('import_eligible=false (including the approved record)')) return false
      if (!hdr.includes('no publication state exists for any record in this batch')) return false
      if (!hdr.includes('human content approval does NOT make any record loadable')) return false
      // the stale, now-false claims must be gone (exact phrases)
      if (hdr.includes('Every record: provenance=forgefitos_original, content_review pending')) return false
      if (hdr.includes('with zero evidence')) return false
      if (hdr.includes('nothing here is approved or loadable')) return false
      // parse exclusion: every header line is dropped by the shared filter
      const dropped = post.slice(0, HEADER_LINES)
        .filter((l) => l.trim() && !l.trim().startsWith('#')).length
      if (dropped !== 0) return false
      const count = (ls: string[]): number => ls.filter((l) => l.trim() && !l.trim().startsWith('#')).length
      if (count(pre) !== count(post)) return false
    }
    return true
  })())
check('C4: the EXLIB-2I convention holds — content_review.reviewer carries the reviewer NAME only; the role/credential lives in the completed forms and the application record, and no invented field exists in either record',
  (() => {
    for (const [path, line] of [[B02, 12], [B04, 5]] as [string, number][]) {
      // RETARGET (EXLIB-2N R6 eligibility admission): anchored
      const rec = JSON.parse(blobAt(TIP_APP, path).toString('utf8').split('\n')[line - 1])
      if (rec.content_review.reviewer !== 'Nick Tkacz') return false
      if (JSON.stringify(Object.keys(rec.content_review)) !== JSON.stringify(['status', 'reviewer', 'reviewed_at', 'rationale'])) return false
      if ('category' in rec || 'reviewer_role_or_credential' in rec || 'snapshot_category_decision' in rec) return false
    }
    const schema = JSON.parse(blobAt('HEAD', 'docs/exlib2c-authoring-schema.json').toString('utf8'))
    return schema.additionalProperties === false && !('category' in schema.properties)
  })())

console.log('\nD. Downstream locks')
check('D1: both records stay review_status "proposed", import_eligible false, deferred false — and EXACTLY these two of the 126 authored records are approved; the other 124 remain pending with null evidence',
  (() => {
    let approved = 0
    let pending = 0
    for (let i = 1; i <= 6; i += 1) {
      // RETARGET (EXLIB-2N R6 eligibility admission): the phase sweep
      // (2 approved / 124 pending / ALL import-ineligible) anchored to
      // the promoted application tip, where it was true.
      const recs = blobAt(TIP_APP, `docs/exlib2c-release1-batch0${i}-content.jsonl`).toString('utf8')
        .split('\n').filter((l) => l.trim() && !l.trim().startsWith('#')).map((l) => JSON.parse(l))
      for (const r of recs) {
        if (r.import_eligible !== false) return false
        if (r.content_review.status === 'approved') {
          approved += 1
          if (!['Dead bug', 'Ab wheel rollout'].includes(r.proposed_canonical_name)) return false
          if (r.review_status !== 'proposed' || r.deferred !== false) return false
        } else {
          pending += 1
          if (r.content_review.status !== 'pending' || r.content_review.reviewer !== null) return false
        }
      }
    }
    return approved === 2 && pending === 124
  })())
check('D2: no publication key anywhere, no load package or SQL artifact in the phase, and the R6 eligibility admissions are DELIBERATELY not performed (stated in the record)',
  (() => {
    for (const [path, line] of [[B02, 12], [B04, 5]] as [string, number][]) {
      // RETARGET (EXLIB-2N R6 eligibility admission): anchored
      const rec = JSON.parse(blobAt(TIP_APP, path).toString('utf8').split('\n')[line - 1])
      if (Object.keys(rec).some((k) => k.includes('publication'))) return false
    }
    // RETARGET (EXLIB-2N R6 eligibility admission): anchored range
    const range = execSync(`git diff --name-only ${TIP}..${TIP_APP}`, { encoding: 'utf8' }).split('\n').filter(Boolean)
    if (range.some((p) => p.endsWith('.sql'))) return false
    return recFlat.includes('R6-style eligibility admissions are DELIBERATELY NOT performed in this milestone')
      && recFlat.includes('import_eligible — the R6 admission axis: UNCHANGED at false for both')
  })())
check('D3: the UUID mappings are never swapped — the record and both committed completed forms bind Dead bug to ...0002 and Ab wheel rollout to ...0003',
  dbDone.intended_logical_uuid === DB_UUID && awDone.intended_logical_uuid === AW_UUID
  && dbDone.canonical_name === 'Dead bug' && awDone.canonical_name === 'Ab wheel rollout'
  && recFlat.includes(`Dead bug = ${DB_UUID}`) && recFlat.includes(`rollout = ${AW_UUID}`))
check('D4: no hosted-state claim — the record states both UUIDs remain BARE hosted identities, the target-snapshot gate remains OPEN, and no hosted service was contacted; the forms\' gate-effect statements are intact',
  recFlat.includes('remain BARE identities on hosted ShredOS')
  && recFlat.includes('hosted target-snapshot gate remains OPEN')
  && recFlat.includes('No hosted service was contacted')
  && dbDone.gate_effect.includes('cannot satisfy it') && awDone.gate_effect.includes('cannot satisfy it'))

console.log('\nE. Lifecycle and inventory')
check('E1: two-state lifecycle — the promoted 2N tip carries neither completed form, nor this record, nor this verifier; HEAD carries all four',
  (() => {
    const tipDocs = execSync(`git ls-tree ${TIP} docs/ --name-only`, { encoding: 'utf8' })
    const tipScripts = execSync(`git ls-tree ${TIP} scripts/ --name-only`, { encoding: 'utf8' })
    // exact-name probes: the 2H Plank completed form legitimately
    // exists at the tip, so a loose 'form-completed' substring is wrong
    if (tipDocs.includes('exlib2n-dead-bug-target-snapshot-review-form-completed')
      || tipDocs.includes('exlib2n-ab-wheel-rollout-target-snapshot-review-form-completed')
      || tipDocs.includes('exlib2n-review-decision-application-record')) return false
    if (tipScripts.includes('verify-exlib2n-application')) return false
    for (const p of [DB_DONE, AW_DONE, RECORD, VERIFIER]) blobAt('HEAD', p)
    return true
  })())
check('E2: exact phase inventory — the range from the promoted 2N tip is exactly the nineteen disclosed paths (2 modified batch files, 4 additions, 13 labeled retargeted suites) with no other change — RETARGET (EXLIB-2N R6 eligibility admission): anchored to the promoted application tip',
  (() => {
    const status = execSync(`git diff --name-status ${TIP}..${TIP_APP}`, { encoding: 'utf8' })
      .split('\n').filter(Boolean).sort()
    return JSON.stringify(status) === JSON.stringify(PHASE_PATHS)
  })())
check('E3: every retargeted suite carries the exact label and no other pre-existing file is modified',
  (() => {
    for (const p of RETARGETED) {
      if (!blobAt('HEAD', p).toString('utf8').includes('RETARGET (EXLIB-2N review-decision application)')) return false
    }
    // RETARGET (EXLIB-2N R6 eligibility admission): anchored range
    const mods = execSync(`git diff --name-status ${TIP}..${TIP_APP}`, { encoding: 'utf8' })
      .split('\n').filter((l) => l.startsWith('M\t')).map((l) => l.slice(2))
    return JSON.stringify(mods.sort()) === JSON.stringify([B02, B04, ...RETARGETED].sort())
  })())
check('E4: the application record binds all three fingerprint sets, the reviewer facts, both category decisions with rationales, the seven distinct axes, the AI-did-not-review statement, and the timestamp-correction provenance',
  (() => {
    const recSolid = recFlat.replace(/\s+/g, '')
    for (const s of [B02_PRE.sha, B04_PRE.sha, B02_POST.sha, B04_POST.sha,
      DB_DONE_FP.sha, AW_DONE_FP.sha, DB_BLANK_FP.sha, AW_BLANK_FP.sha]) {
      if (!recSolid.includes(s)) return false
    }
    return recFlat.includes('Nick Tkacz') && recFlat.includes('personal trainer')
      && recFlat.includes('2026-09-03T15:47:00-04:00') && recFlat.includes('2026-09-03T15:26:00-04:00')
      && recFlat.includes('snapshot category decision **mobility**')
      && recFlat.includes('snapshot category decision **other**')
      && recFlat.includes('works out your core') && recFlat.includes('it impacts a multitude of things')
      && recFlat.includes('ChatGPT and Claude did NOT perform, influence, or fabricate the human reviews')
      && recFlat.includes('Distinct axes (never conflated)')
      && recFlat.includes('directed a single-byte offset correction to -04:00')
  })())

console.log('\nF. Hygiene')
check('F1: no phase file contains a hosted endpoint, connection string, credential material, or remote execution command',
  (() => {
    const bads = [
      'supabase' + '.co', 'vercel' + '.', 'postgresql' + '://', 'postgres' + '://',
      'SUPABASE' + '_URL', 'SUPABASE' + '_SERVICE', 'api' + 'key', 'Bearer' + ' ', 'ey' + 'J',
      '--db' + '-url', '--lin' + 'ked', 'db ' + 'push', 'psql' + ' -', 'SET' + ' ROLE',
    ]
    const payload = [DB_DONE, AW_DONE, RECORD, VERIFIER]
      .map((p) => blobAt('HEAD', p).toString('utf8')).join('\n')
    return bads.every((b) => !payload.includes(b))
  })())
check('F2: character hygiene — the completed forms, both edited record lines, and all eight corrected header lines are pure ASCII; the record contains no non-ASCII beyond the em-dash',
  (() => {
    const ascii = (s: string): boolean => {
      for (const ch of s) {
        const c = ch.codePointAt(0) as number
        if (c > 127 || (c < 32 && ch !== '\n')) return false
      }
      return true
    }
    if (!ascii(blobAt('HEAD', DB_DONE).toString('utf8'))) return false
    if (!ascii(blobAt('HEAD', AW_DONE).toString('utf8'))) return false
    // RETARGET (EXLIB-2N R6 eligibility admission): batch lines anchored
    for (const [path, line] of [[B02, 12], [B04, 5], [B02, 1], [B04, 1], [B02, 2], [B04, 2], [B02, 3], [B04, 3], [B02, 4], [B04, 4]] as [string, number][]) {
      if (!ascii(blobAt(TIP_APP, path).toString('utf8').split('\n')[line - 1])) return false
    }
    for (const ch of blobAt('HEAD', RECORD).toString('utf8')) {
      const c = ch.codePointAt(0) as number
      if (c > 127 && c !== 0x2014) return false
      if (c < 32 && ch !== '\n') return false
    }
    return true
  })())

console.log('\nG. Replacement-branch topology (Codex round 2)')
// The Codex correction round required the milestone as EXACTLY ONE
// plain single-parent commit on a fresh branch off promoted main; the
// superseded five-commit branch is preserved unrewritten as history.
// These proofs bind the replacement topology at review time; a later
// milestone that advances HEAD retargets them to the then-known tip
// under the established labeled-retarget lifecycle.
// RETARGET (EXLIB-2N R6 eligibility admission): exactly that — the
// application milestone's tip is now the promoted TIP_APP constant,
// and all four topology proofs are anchored to it, where they were
// and remain true as history.
check('G1: replacement parentage — the merge base of HEAD and the promoted 2N tip IS the tip, HEAD\'s only parent IS the tip (single-parent, no second parent)',
  (() => {
    try {
      if (execSync(`git merge-base ${TIP} ${TIP_APP}`, { encoding: 'utf8' }).trim() !== TIP) return false
      if (execSync(`git rev-parse ${TIP_APP}^1`, { encoding: 'utf8' }).trim() !== TIP) return false
      const parents = execSync(`git rev-list --parents -n 1 ${TIP_APP}`, { encoding: 'utf8' }).trim().split(/\s+/)
      return parents.length === 2 && parents[1] === TIP
    } catch { return false }
  })())
check('G2: replacement distance — HEAD is exactly 1 ahead of and 0 behind the promoted 2N tip',
  (() => {
    const ahead = execSync(`git rev-list --count ${TIP}..${TIP_APP}`, { encoding: 'utf8' }).trim()
    const behind = execSync(`git rev-list --count ${TIP_APP}..${TIP}`, { encoding: 'utf8' }).trim()
    return ahead === '1' && behind === '0'
  })())
check('G3: replacement purity — the range from the promoted 2N tip contains exactly one commit and zero merges',
  (() => {
    const commits = execSync(`git rev-list --count ${TIP}..${TIP_APP}`, { encoding: 'utf8' }).trim()
    const merges = execSync(`git rev-list --count --merges ${TIP}..${TIP_APP}`, { encoding: 'utf8' }).trim()
    return commits === '1' && merges === '0'
  })())
check('G4: replacement inventory — the single commit carries exactly the nineteen disclosed paths (2 modified batch files, 4 additions, 13 labeled retargeted suites) and nothing else',
  (() => {
    const status = execSync(`git diff --name-status ${TIP}..${TIP_APP}`, { encoding: 'utf8' })
      .split('\n').filter(Boolean).sort()
    return JSON.stringify(status) === JSON.stringify(PHASE_PATHS)
  })())

console.log(`\n${pass} passed, ${fail} failed`)
if (fail > 0) process.exit(1)
