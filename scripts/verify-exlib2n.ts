// EXLIB-2N static verifier — target-snapshot human-review PREPARATION.
//
// Proves the preparation posture fail-closed: exact source refs and
// frozen fingerprints; exactly two evidence packets and two
// DELIBERATELY UNFILLED decision forms; correct artifact/UUID binding
// with no swap; every human-controlled field null; the exact
// five-value category vocabulary cross-checked against the live
// migration-023 CHECK bytes; Dead bug's external category evidence
// marked non-authoritative and unselected; Ab wheel rollout's
// category evidence explicitly nonexistent with nothing fabricated;
// both authored records byte-identical and still
// pending/proposed/import-ineligible; no load package in this phase;
// no database/runtime/seed/inventory/ledger change; no hosted
// endpoint, credential, or execution command; exact phase inventory
// and lifecycle posture. Performs NO hosted contact.
//
// Fail-closed: any mismatch fails the suite.

import { execSync } from 'child_process'
import { createHash } from 'crypto'
import { readFileSync, readdirSync } from 'fs'

const MAIN_TIP = '9c73f3c484c79d97cc31ef0a6b2fcae76fa334fc'
const MAIN_TREE = 'cc880929e26ba3954eff7e444e033c8793f2368d'
const TAG = 'exlib2k-hosted-load-application-evidence-stable'
const TAG_OBJ = '81c0954f2cb2971a79e1f139122e08bdca05acd0'

const B02 = 'docs/exlib2c-release1-batch02-content.jsonl'
const B02_BYTES = 51496
const B02_SHA = '1ddc3ab0bd92d60ef33960d82a8e0c8a2fdea1cb828d15fc9bf6a82c34305d48'
const B02_LINE = 12
const B02_LINE_BYTES = 1900
const B02_LINE_SHA = '3dbd0384542bdf6feb96d84a61d2d50b5c6ca0fdc057fcafded67aeb631a8796'

const B04 = 'docs/exlib2c-release1-batch04-content.jsonl'
const B04_BYTES = 54781
const B04_SHA = 'e7def375e9b9560863796bff90746dc6ff2b2f7c4bd7735a3d53fc2cc9750568'
const B04_LINE = 5
const B04_LINE_BYTES = 2178
const B04_LINE_SHA = '475870776e6dd309c6646f05b33b9a3050d7fbacd653e245dc3534d288981a8b'

const ARTIFACT = 'docs/exlib2g-plank-content.jsonl'
const ARTIFACT_BYTES = 2928
const ARTIFACT_SHA = 'd82078490efa9ef13e128e7b7b742fbda8ea9e74e32382252d96c326c679d752'
const PKG = 'docs/exlib2k-plank-catalog-load-package.sql'
const PKG_BYTES = 29760
const PKG_SHA = 'a1b6dd55850c5d544e2f484d1ce4833b41deec7f3dd4d4c2373cb3b50daaccf0'

const DB_UUID = 'e21b2c00-0000-4000-a000-000000000002'
const AW_UUID = 'e21b2c00-0000-4000-a000-000000000003'
const VOCAB = ['compound', 'isolation', 'cardio', 'mobility', 'other']

const DB_PACKET = 'docs/exlib2n-dead-bug-target-snapshot-review-packet.md'
const AW_PACKET = 'docs/exlib2n-ab-wheel-rollout-target-snapshot-review-packet.md'
const DB_FORM = 'docs/exlib2n-dead-bug-target-snapshot-review-form.json'
const AW_FORM = 'docs/exlib2n-ab-wheel-rollout-target-snapshot-review-form.json'
const RECORD = 'docs/exlib2n-target-snapshot-review-preparation-record.md'
const VERIFIER = 'scripts/verify-exlib2n.ts'
const PHASE_PATHS = [DB_PACKET, AW_PACKET, DB_FORM, AW_FORM, RECORD, VERIFIER].sort()

const sha256 = (buf: Buffer | string): string =>
  createHash('sha256').update(buf).digest('hex')
const blobAtHead = (p: string): Buffer =>
  execSync(`git cat-file blob HEAD:${p}`, { maxBuffer: 1 << 26 })
const flat = (s: string): string => s.replace(/\s+/g, ' ')

const dbForm = JSON.parse(readFileSync(DB_FORM, 'utf8'))
const awForm = JSON.parse(readFileSync(AW_FORM, 'utf8'))
const dbPacketFlat = flat(readFileSync(DB_PACKET, 'utf8'))
const awPacketFlat = flat(readFileSync(AW_PACKET, 'utf8'))
const recFlat = flat(readFileSync(RECORD, 'utf8'))

let pass = 0
let fail = 0
const check = (name: string, ok: boolean): void => {
  if (ok) { pass += 1; console.log(`  PASS  ${name}`) }
  else { fail += 1; console.log(`  FAIL  ${name}`) }
}

console.log('EXLIB-2N target-snapshot review-preparation verifier')

console.log('\nA. Source refs and frozen fingerprints')
check('A1: source refs — the evidence tag is the exact annotated object, peels to the promoted tip (ancestor of HEAD) whose tree is exact',
  (() => {
    try {
      if (execSync(`git cat-file -t refs/tags/${TAG}`, { encoding: 'utf8' }).trim() !== 'tag') return false
      if (execSync(`git rev-parse refs/tags/${TAG}`, { encoding: 'utf8' }).trim() !== TAG_OBJ) return false
      if (execSync(`git rev-parse refs/tags/${TAG}^{}`, { encoding: 'utf8' }).trim() !== MAIN_TIP) return false
      execSync(`git merge-base --is-ancestor ${MAIN_TIP} HEAD`, { stdio: 'pipe' })
      return execSync(`git rev-parse ${MAIN_TIP}^{tree}`, { encoding: 'utf8' }).trim() === MAIN_TREE
    } catch { return false }
  })())
check('A2: the Dead bug authored source is byte-frozen — batch02 file and record line 12 match their exact byte counts and SHA-256 fingerprints at HEAD',
  (() => {
    const buf = blobAtHead(B02)
    if (buf.length !== B02_BYTES || sha256(buf) !== B02_SHA) return false
    const line = buf.toString('utf8').split('\n')[B02_LINE - 1]
    const lb = Buffer.from(line, 'utf8')
    return lb.length === B02_LINE_BYTES && sha256(lb) === B02_LINE_SHA
  })())
check('A3: the Ab wheel rollout authored source is byte-frozen — batch04 file and record line 5 match their exact byte counts and SHA-256 fingerprints at HEAD',
  (() => {
    const buf = blobAtHead(B04)
    if (buf.length !== B04_BYTES || sha256(buf) !== B04_SHA) return false
    const line = buf.toString('utf8').split('\n')[B04_LINE - 1]
    const lb = Buffer.from(line, 'utf8')
    return lb.length === B04_LINE_BYTES && sha256(lb) === B04_LINE_SHA
  })())
check('A4: upstream authorities byte-frozen — the admitted Plank artifact, the SPENT EXLIB-2K package, and exactly 27 numbered migrations with no 028',
  (() => {
    const a = blobAtHead(ARTIFACT)
    const p = blobAtHead(PKG)
    if (a.length !== ARTIFACT_BYTES || sha256(a) !== ARTIFACT_SHA) return false
    if (p.length !== PKG_BYTES || sha256(p) !== PKG_SHA) return false
    const migs = execSync('git ls-tree HEAD supabase/migrations/ --name-only', { encoding: 'utf8' })
      .split('\n').filter((f) => /\/0\d\d_.+\.sql$/.test(f))
    return migs.length === 27 && !migs.some((f) => f.includes('/028'))
  })())

console.log('\nB. Phase inventory')
check('B1: the phase is exactly the six preparation paths (two packets, two forms, the record, this verifier) — committed as plain additions, or staged-clean pre-commit',
  (() => {
    const committed = execSync(`git rev-list --count ${MAIN_TIP}..HEAD`, { encoding: 'utf8' }).trim() !== '0'
    if (committed) {
      const status = execSync(`git diff --name-status ${MAIN_TIP}..HEAD`, { encoding: 'utf8' })
        .split('\n').filter(Boolean).map((l) => l.split('\t'))
      if (status.length !== 6) return false
      if (!status.every(([s]) => s === 'A')) return false
      const paths = status.map(([, p]) => p).sort()
      if (JSON.stringify(paths) !== JSON.stringify(PHASE_PATHS)) return false
      return execSync('git status --porcelain', { encoding: 'utf8' }).trim() === ''
    }
    const porc = execSync('git status --porcelain', { encoding: 'utf8' })
      .split('\n').filter(Boolean)
    const untracked = porc.filter((l) => l.startsWith('??')).map((l) => l.slice(3).trim()).sort()
    return porc.length === untracked.length
      && JSON.stringify(untracked) === JSON.stringify(PHASE_PATHS)
  })())
check('B2: the live docs tree carries exactly the five EXLIB-2N files — two packets, two forms, one preparation record — with the exact expected names',
  (() => {
    const files = readdirSync('docs').filter((f) => f.startsWith('exlib2n-')).sort()
    const expected = [DB_PACKET, AW_PACKET, DB_FORM, AW_FORM, RECORD]
      .map((p) => p.replace('docs/', '')).sort()
    return JSON.stringify(files) === JSON.stringify(expected)
  })())

console.log('\nC. Form binding')
check('C1: the Dead bug form binds its exact subject — packet path, batch02 artifact, file and record-line fingerprints, canonical name, intended UUID, source commit and tag',
  dbForm.packet === DB_PACKET
  && dbForm.authored_artifact === B02
  && dbForm.authored_artifact_fingerprint.file_bytes === B02_BYTES
  && dbForm.authored_artifact_fingerprint.file_sha256 === B02_SHA
  && dbForm.authored_artifact_fingerprint.record_line === B02_LINE
  && dbForm.authored_artifact_fingerprint.record_line_bytes_newline_excluded === B02_LINE_BYTES
  && dbForm.authored_artifact_fingerprint.record_line_sha256_newline_excluded === B02_LINE_SHA
  && dbForm.canonical_name === 'Dead bug'
  && dbForm.intended_logical_uuid === DB_UUID
  && dbForm.source_commit === MAIN_TIP
  && dbForm.source_tag === TAG
  && dbForm.source_tag_object === TAG_OBJ)
check('C2: the Ab wheel rollout form binds its exact subject — packet path, batch04 artifact, file and record-line fingerprints, canonical name, intended UUID, source commit and tag',
  awForm.packet === AW_PACKET
  && awForm.authored_artifact === B04
  && awForm.authored_artifact_fingerprint.file_bytes === B04_BYTES
  && awForm.authored_artifact_fingerprint.file_sha256 === B04_SHA
  && awForm.authored_artifact_fingerprint.record_line === B04_LINE
  && awForm.authored_artifact_fingerprint.record_line_bytes_newline_excluded === B04_LINE_BYTES
  && awForm.authored_artifact_fingerprint.record_line_sha256_newline_excluded === B04_LINE_SHA
  && awForm.canonical_name === 'Ab wheel rollout'
  && awForm.intended_logical_uuid === AW_UUID
  && awForm.source_commit === MAIN_TIP
  && awForm.source_tag === TAG
  && awForm.source_tag_object === TAG_OBJ)
check('C3: the UUID-to-name mappings are NOT swapped — Dead bug owns ...0002 and Ab wheel rollout owns ...0003 in both forms and both packets',
  dbForm.intended_logical_uuid !== awForm.intended_logical_uuid
  && dbForm.intended_logical_uuid.endsWith('0002')
  && awForm.intended_logical_uuid.endsWith('0003')
  && dbPacketFlat.includes(DB_UUID) && !dbPacketFlat.includes(AW_UUID)
  && awPacketFlat.includes(AW_UUID) && !awPacketFlat.includes(DB_UUID))

console.log('\nD. Deliberately unfilled human fields')
check('D1: every human-controlled field is null in BOTH forms — decision, reviewer, role/credential, timestamp, evidence, rationale, category decision, category rationale, and every needs-human-judgment confirmation',
  (() => {
    const HUMAN = ['decision', 'reviewer', 'reviewer_role_or_credential', 'reviewed_at',
      'evidence', 'rationale', 'snapshot_category_decision', 'snapshot_category_rationale']
    for (const form of [dbForm, awForm]) {
      if (!HUMAN.every((k) => k in form && form[k] === null)) return false
      const conf = form.needs_human_judgment_confirmations
      if (typeof conf !== 'object' || conf === null) return false
      const keys = Object.keys(conf)
      if (keys.length < 9) return false
      if (!keys.every((k) => conf[k] === null)) return false
    }
    return Object.keys(dbForm.needs_human_judgment_confirmations).includes('plank_substitution_target_suitability')
      && Object.keys(awForm.needs_human_judgment_confirmations).includes('plank_progression_target_suitability')
  })())
check('D2: legal decisions are exactly approved | revised | rejected, and the decision requirements pin the named-human-never-AI reviewer, operator-validated credential, offset date-time, 10-char rationales, exactly-one category, and explicitly-true confirmations',
  (() => {
    for (const form of [dbForm, awForm]) {
      if (JSON.stringify(form.legal_decisions) !== JSON.stringify(['approved', 'revised', 'rejected'])) return false
      const req = form.decision_requirements
      if (!req.includes('NAMED HUMAN specialist, never AI')) return false
      if (!req.includes('confirmed by the operator')) return false
      if (!req.includes('valid offset date-time')) return false
      if (!(req.match(/>= 10 non-blank chars/g) || []).length) return false
      if (!req.includes('EXACTLY ONE value from snapshot_category_vocabulary')) return false
      if (!req.includes('EVERY needs_human_judgment_confirmations value explicitly true')) return false
      if (!req.includes('never substitutes for any required field')) return false
    }
    return true
  })())

console.log('\nE. Category decision posture')
check('E1: the category vocabulary is exactly compound | isolation | cardio | mobility | other in both forms and both packets, and equals the live migration-023 CHECK bytes',
  (() => {
    for (const form of [dbForm, awForm]) {
      if (JSON.stringify(form.snapshot_category_vocabulary) !== JSON.stringify(VOCAB)) return false
    }
    for (const p of [dbPacketFlat, awPacketFlat]) {
      if (!p.includes('- compound - isolation - cardio - mobility - other')) return false
    }
    const mig = readFileSync('supabase/migrations/023_exlib_catalog_and_delivery_contract.sql', 'utf8')
    const m = flat(mig).match(/category\s+TEXT NOT NULL CHECK \(category IN \(([^)]+)\)\)/)
    if (!m) return false
    const vals = m[1].split(',').map((s) => s.trim().replace(/'/g, ''))
    return JSON.stringify(vals) === JSON.stringify(VOCAB)
  })())
check('E2: Dead bug external evidence is EVIDENCE ONLY — exists but marked non-authoritative and unselected, the packet says nothing implies isolation must be chosen, and the category decision is null',
  (() => {
    const ev = dbForm.snapshot_category_evidence
    if (ev.exists !== true || ev.authoritative !== false || ev.preselected !== false) return false
    if (!/strengthlog/i.test(ev.source) || !ev.source.includes('isolation')) return false
    if (!ev.statement.includes('EVIDENCE ONLY')) return false
    if (!ev.statement.includes('free to select any of the five legal values')) return false
    if (!dbPacketFlat.includes('evidence only — NOT authoritative, NOT preselected')) return false
    if (!dbPacketFlat.includes('nothing here implies that isolation must be chosen')) return false
    return dbForm.snapshot_category_decision === null
  })())
check('E3: Ab wheel rollout has NO fabricated category evidence — the form declares none exists with a null source, the packet states the decision is independent with no inference, and the category decision is null',
  (() => {
    const ev = awForm.snapshot_category_evidence
    if (ev.exists !== false || ev.authoritative !== false || ev.preselected !== false) return false
    if (ev.source !== null) return false
    if (!ev.statement.includes('NO COMMITTED CATEGORY EVIDENCE EXISTS')) return false
    if (!ev.statement.includes('INDEPENDENT human decision')) return false
    if (!awPacketFlat.includes('NO COMMITTED CATEGORY EVIDENCE EXISTS for Ab wheel rollout')) return false
    if (!awPacketFlat.includes('does NOT infer a category from the movement pattern, the equipment, the difficulty, the tenant exercise_type_derived axis, or general exercise knowledge')) return false
    return awForm.snapshot_category_decision === null
  })())

console.log('\nF. Authored-state truth')
check('F1: both authored records remain pending / proposed / import-ineligible with null review evidence — parsed from the frozen batch lines at HEAD',
  (() => {
    for (const [p, n] of [[B02, B02_LINE], [B04, B04_LINE]] as [string, number][]) {
      const rec = JSON.parse(blobAtHead(p).toString('utf8').split('\n')[n - 1])
      if (rec.content_review.status !== 'pending') return false
      if (rec.content_review.reviewer !== null || rec.content_review.reviewed_at !== null
        || rec.content_review.rationale !== null) return false
      if (rec.review_status !== 'proposed') return false
      if (rec.import_eligible !== false || rec.deferred !== false) return false
    }
    return true
  })())
check('F2: the release inventory corroborates both records exactly on all nine shared classification fields, and both inventory rows carry specialist_review_required true and import_eligible false',
  (() => {
    const inv = blobAtHead('docs/exlib2b-release1-inventory.jsonl').toString('utf8')
      .split('\n').filter((l) => l.trim() && !l.startsWith('#')).map((l) => JSON.parse(l))
    const SHARED = ['primary_muscle', 'muscle_targets', 'equipment', 'tracking_mode', 'laterality',
      'movement_pattern', 'training_role', 'difficulty', 'availability']
    for (const [p, n, name] of [[B02, B02_LINE, 'Dead bug'], [B04, B04_LINE, 'Ab wheel rollout']] as [string, number, string][]) {
      const rec = JSON.parse(blobAtHead(p).toString('utf8').split('\n')[n - 1])
      const row = inv.find((r) => r.proposed_canonical_name === name)
      if (!row) return false
      if (row.specialist_review_required !== true || row.import_eligible !== false || row.deferred !== false) return false
      if (!SHARED.every((f) => JSON.stringify(rec[f]) === JSON.stringify(row[f]))) return false
    }
    return true
  })())
check('F3: the intended UUID authority holds — the admitted Plank artifact names Dead bug as its substitution target and Ab wheel rollout as its progression target',
  (() => {
    const art = JSON.parse(blobAtHead(ARTIFACT).toString('utf8').split('\n')
      .filter((l) => l.trim() && !l.startsWith('#'))[0])
    return art.substitutions.length === 1 && art.substitutions[0] === 'Dead bug'
      && art.progressions.length === 1 && art.progressions[0] === 'Ab wheel rollout'
      && art.regressions.length === 0
  })())

console.log('\nG. Boundaries')
check('G1: NO load package exists in this phase — no SQL file among the phase paths, no exlib2n SQL in docs, and the spent Plank package is byte-unchanged (proven in A4)',
  PHASE_PATHS.every((p) => !p.endsWith('.sql'))
  && readdirSync('docs').every((f) => !(f.startsWith('exlib2n') && f.endsWith('.sql'))))
check('G2: no database, runtime, seed, inventory, ledger, batch, or configuration path is touched — the phase paths carry no such prefix and the frozen files are proven byte-identical above',
  PHASE_PATHS.every((p) =>
    !/^(src\/|supabase\/|package|next\.config|tsconfig|\.env|public\/)/.test(p)
    && p !== B02 && p !== B04
    && p !== 'docs/exlib2b-release1-inventory.jsonl'
    && p !== 'docs/exlib1b1-review-ledger.jsonl'
    && !p.includes('seed-exercises')))

console.log('\nH. Hygiene')
check('H1: none of the six phase files contains a hosted endpoint, connection string, credential material, or remote execution command',
  (() => {
    const bads = [
      'supabase' + '.co', 'vercel' + '.', 'postgresql' + '://', 'postgres' + '://',
      'SUPABASE' + '_URL', 'SUPABASE' + '_SERVICE', 'api' + 'key', 'Bearer' + ' ', 'ey' + 'J',
      '--db' + '-url', '--lin' + 'ked', 'db ' + 'push', 'psql' + ' -', 'SET' + ' ROLE',
    ]
    const payload = PHASE_PATHS.map((p) => readFileSync(p, 'utf8')).join('\n')
    return bads.every((b) => !payload.includes(b))
  })())
check('H2: character hygiene — the two JSON forms are pure ASCII, and the three markdown files contain no non-ASCII character other than the em-dash (no smart quotes, zero-width, or control characters)',
  (() => {
    for (const p of [DB_FORM, AW_FORM]) {
      const s = readFileSync(p, 'utf8')
      for (const ch of s) {
        const c = ch.codePointAt(0) as number
        if (c > 127) return false
        if (c < 32 && ch !== '\n') return false
      }
    }
    for (const p of [DB_PACKET, AW_PACKET, RECORD]) {
      const s = readFileSync(p, 'utf8')
      for (const ch of s) {
        const c = ch.codePointAt(0) as number
        if (c > 127 && c !== 0x2014) return false
        if (c < 32 && ch !== '\n') return false
      }
    }
    return true
  })())

console.log('\nI. Lifecycle posture')
check('I1: two-state lifecycle — the promoted tip 9c73f3c carries NO exlib2n file, while the live tree carries exactly the five docs plus this verifier',
  (() => {
    const tipDocs = execSync(`git ls-tree ${MAIN_TIP} docs/ --name-only`, { encoding: 'utf8' })
    const tipScripts = execSync(`git ls-tree ${MAIN_TIP} scripts/ --name-only`, { encoding: 'utf8' })
    return !tipDocs.includes('exlib2n') && !tipScripts.includes('exlib2n')
  })())
check('I2: ZERO historical-verifier retargets — no pre-existing script or doc is modified by this phase (every phase path is a pure addition)',
  (() => {
    const committed = execSync(`git rev-list --count ${MAIN_TIP}..HEAD`, { encoding: 'utf8' }).trim() !== '0'
    if (!committed) {
      return execSync('git status --porcelain', { encoding: 'utf8' })
        .split('\n').filter(Boolean).every((l) => l.startsWith('??'))
    }
    return execSync(`git diff --name-status ${MAIN_TIP}..HEAD`, { encoding: 'utf8' })
      .split('\n').filter(Boolean).every((l) => l.startsWith('A\t'))
  })())
check('I3: the preparation record documents the fail-closed origin, the distinct category carrier, the no-migration rationale, the evidence-carrier posture, and all eight later lifecycle stages in order',
  recFlat.includes('FAILED CLOSED at its mandatory derivation gate with zero edits')
  && recFlat.includes('Why category needs a distinct decision carrier')
  && recFlat.includes('Why no schema migration is presently required')
  && recFlat.includes('Why the forms are evidence carriers, not executable authority')
  && ['1. REVIEW PREPARATION', '2. COMPLETED HUMAN DECISION', '3. SEPARATELY REVIEWED APPLICATION',
    '4. SEPARATE R6 ELIGIBILITY ADMISSION', '5. TARGET-SNAPSHOT LOAD-PACKAGE PREPARATION',
    '6. HOSTED SNAPSHOT LOADING', '7. HOSTED TARGET-SNAPSHOT PROOF', '8. ONLY THEN']
    .every((s, i, arr) => {
      const idx = recFlat.indexOf(s)
      return idx >= 0 && (i === 0 || idx > recFlat.indexOf(arr[i - 1]))
    }))
check('I4: both forms pin every mandated no-effect statement — preparer boundary (never fill or fabricate), artifact unmodified, import_eligible unflipped, no snapshot load, gate unsatisfied, separate application milestone, and the byte-change voiding rule',
  [dbForm, awForm].every((form) =>
    form.preparer_boundary.includes('may NEVER fill or fabricate the human fields')
    && form.no_effect_statement.includes('does not modify the authored artifact')
    && form.no_effect_statement.includes('does not flip import_eligible')
    && form.no_effect_statement.includes('does not load any snapshot')
    && form.no_effect_statement.includes('does not satisfy the hosted target-snapshot gate')
    && form.no_effect_statement.includes('separate, separately reviewed milestone')
    && form.voiding_rule.includes('voids this form')))

console.log(`\n${pass} passed, ${fail} failed`)
if (fail > 0) process.exit(1)
