// EXLIB-2O static verifier — Dead bug + Ab wheel rollout
// target-snapshot load-package preparation.
//
// Proves: the exact promoted source (R6 admission tip + tag); the
// package fingerprint, labels, and structure (one transaction, the
// exact ELEVEN-table lock list — review events included, so the
// package's serialized boundary and its internally proven surface are
// the same eleven tables — the complete authoritative Plank pre-state
// gate, in which every expected value is bound by EXACT value
// equality to a literal re-derived mechanically from the promoted
// admitted Plank artifact and no hash appears at all, the distinction
// between that gate and the in-transaction
// transition-neutrality digests, whole-row tenant protection,
// exactly TWO SCHEMA-QUALIFIED public.load_catalog_snapshot calls and
// ZERO unqualified ones — so the function the package verifies is the
// function it invokes, whatever search_path says —
// and zero identity/content/review/admission/publication/seal/
// delivery calls, the transaction-contained authority elevation and
// grantor-scoped restoration, the exact pre/post count vectors, the
// independent and cross no-swap postconditions, the claims-invariant
// calls, and the one-use refusal language); EVERY dollar-quoted
// loader literal re-derived field-by-field from the R6-admitted
// authored records and the completed human-review forms (categories
// = the human decisions; the four discovery sources NULL); the
// preparation record's bindings; the untouched upstream authorities;
// and the phase topology/inventory. Performs NO hosted contact and
// never executes the package.
//
// Fail-closed: any mismatch fails the suite.

import { execSync } from 'child_process'
import { createHash } from 'crypto'
import { readFileSync } from 'fs'

const SRC = '4e4a6e6c06ad3eaab234697cbc11725650f1a09f'
const SRC_TREE = 'b5a689cda5e62cf9f3f56f42641867bcdc61e206'
const SRC_TAG = 'exlib2n-r6-eligibility-admission-stable'
const SRC_TAG_OBJ = '7106b05fa1308fef03b9e0942572b662435c3259'
const SRC_TAG_MSG = 'EXLIB-2N target-snapshot R6 eligibility admissions stable — ELIGIBLE — NOT LOADED OR PUBLISHED\n'

// The original EXLIB-2O preparation commit and the Codex round-2
// correction, BOTH PRESERVED untouched: the round-3 correction is one
// further plain forward commit on top of them, never an amend, rebase,
// squash, or rewrite. Each preserved commit's tree is pinned here, so a
// rewrite of either one fails this suite rather than passing quietly.
const PREP = '2f8f135fd97812c4a5a6a498796ee85f9d7df556'
const PREP_TREE = '816d6a24d5fab3b3ae70450f3347d6bcf4db3d4d'
const R2 = '8845c9d90e7e251342f01551f42796f0dda9550a'
const R2_TREE = 'c0aca442e5ba43db4ea6764e0135990beb53d797'

// RETARGET (EXLIB-2O hosted-execution evidence): this suite proves the
// LOAD-PREPARATION phase. That phase was promoted as main = TIP and the
// hosted execution happened; the application-evidence milestone then
// legitimately advances HEAD (adding the application record and its
// verifier), so the topology proofs below are anchored to the promoted
// EXLIB-2O tip — where they were and remain true — instead of HEAD.
// The tip's tree is pinned so a rewrite still fails here.
const TIP = '632ef40f448c49e07bb7569fd6cd29cc14e62c1b'
const TIP_TREE = 'ebe875778a4c76a5fac5e022a2a9f455163db1a7'

const PKG = 'docs/exlib2o-target-snapshot-load-package.sql'
const RECORD = 'docs/exlib2o-target-snapshot-load-prep-record.md'
const VERIFIER = 'scripts/verify-exlib2o.ts'
const LIVE = 'scripts/verify-exlib2o-live.sh'
const R6_VERIFIER = 'scripts/verify-exlib2n-r6-admission.ts'

const B02 = 'docs/exlib2c-release1-batch02-content.jsonl'
const B04 = 'docs/exlib2c-release1-batch04-content.jsonl'
const B02_FP = { bytes: 52123, sha: 'ebca1c01ffa66c78bdc42fc2972cfd328a75d2d6c2735878f9445617c15743cc', line: 12 }
const B04_FP = { bytes: 55442, sha: 'c8a63ccbd7cc2913265926050480535f5d4adff585f1d462f9b2c2d30406fcf2', line: 5 }
const DB_FORM = { path: 'docs/exlib2n-dead-bug-target-snapshot-review-form-completed.json', bytes: 5604, sha: 'ce555650a643077be099b9e65490e36d8731ce9c40ad0e3aa0e80065152cdbeb' }
const AW_FORM = { path: 'docs/exlib2n-ab-wheel-rollout-target-snapshot-review-form-completed.json', bytes: 5754, sha: 'efed7f1f59a040014dd6ca5df1276997de2f7410a186da10532fe987558181b5' }
const MIG027 = { path: 'supabase/migrations/027_exlib_catalog_content_schema.sql', sha: '90d53aaf8fd341dd99bab22b7d1ca280ec24b8ccee2a28efca6e835e0585a14f' }
const PKG2K = { path: 'docs/exlib2k-plank-catalog-load-package.sql', bytes: 29760, sha: 'a1b6dd55850c5d544e2f484d1ce4833b41deec7f3dd4d4c2373cb3b50daaccf0' }

const DB_UUID = 'e21b2c00-0000-4000-a000-000000000002'
const AW_UUID = 'e21b2c00-0000-4000-a000-000000000003'
// ELEVEN terms, matching the eleven locked tables exactly (Codex
// round-2 finding 1): logical / catalog / muscles / aliases / claims /
// content / expected-relationships / relationships / import-runs /
// run-items / REVIEW-EVENTS.
const PRE_VECTOR = '3/1/2/2/3/1/2/0/0/0/0'
const POST_VECTOR = '3/3/5/3/6/1/2/0/0/0/0'
const LOCKED_TABLES = ['public.exercise_catalog', 'public.exercise_catalog_aliases',
  'public.exercise_catalog_content', 'public.exercise_catalog_content_expected_relationships',
  'public.exercise_catalog_import_runs', 'public.exercise_catalog_logical',
  'public.exercise_catalog_muscles', 'public.exercise_catalog_name_claims',
  'public.exercise_catalog_relationships', 'public.exercise_catalog_review_events',
  'public.exercise_catalog_run_items']

const PHASE = [
  ['A', PKG], ['A', RECORD], ['A', VERIFIER], ['A', LIVE], ['M', R6_VERIFIER],
].map(([s, p]) => `${s}\t${p}`).sort()
// The four paths each Codex correction commit modifies (rounds 2 and 3
// touch the same four: the package, the record, and both verifiers).
const CORRECTED = [PKG, RECORD, VERIFIER, LIVE]

const sha256 = (buf: Buffer | string): string => createHash('sha256').update(buf).digest('hex')
const blobAt = (ref: string, p: string): Buffer =>
  execSync(`git cat-file blob ${ref}:${p}`, { maxBuffer: 1 << 26 })

let pass = 0
let fail = 0
const check = (name: string, ok: boolean): void => {
  if (ok) { pass += 1; console.log(`  PASS  ${name}`) }
  else { fail += 1; console.log(`  FAIL  ${name}`) }
}

// Which bytes are authoritative? Round 1 decided this from the commit
// distance alone, which silently graded a CORRECTION round's edits
// against the already-committed (pre-correction) blobs. The phase is
// "committed" only when the worktree holds no uncommitted change at
// all; while corrections are being authored the worktree is
// authoritative, and the topology checks take their authoring branch.
const PORCELAIN = execSync('git status --porcelain', { encoding: 'utf8' }).split('\n').filter(Boolean)
const CHANGED = PORCELAIN.map((l) => l.slice(3).trim()).sort()
const committed = CHANGED.length === 0
  && execSync(`git rev-list --count ${SRC}..HEAD`, { encoding: 'utf8' }).trim() !== '0'
const bytesOf = (p: string): Buffer => (committed ? blobAt('HEAD', p) : readFileSync(p))
const pkg = bytesOf(PKG).toString('utf8')
const rec = bytesOf(RECORD).toString('utf8')
// package comment prose with the comment markers and line wrapping
// removed, so a phrase can be asserted without depending on where the
// 60-column comment blocks happen to wrap it
const pkgProse = pkg.replace(/\n\s*--/g, '').replace(/\s+/g, ' ')
const recFlat = rec.replace(/\s+/g, ' ')
const recSolid = rec.replace(/\s+/g, '')

// dollar-quoted literal extractor: $tag$value$tag$
const lit = (tag: string): string | null => {
  const m = pkg.match(new RegExp(`\\$${tag}\\$([\\s\\S]*?)\\$${tag}\\$`))
  return m ? m[1] : null
}

console.log(`EXLIB-2O static verification (${committed ? 'committed' : 'uncommitted authoring'} state)`)

console.log('\nA. Promoted source and upstream freeze')
check('A1: the promoted R6-admission tag is the exact annotated object, peels to the promoted source tip (ancestor of HEAD) whose tree is exact, with the byte-exact annotation',
  (() => {
    try {
      if (execSync(`git cat-file -t refs/tags/${SRC_TAG}`, { encoding: 'utf8' }).trim() !== 'tag') return false
      if (execSync(`git rev-parse refs/tags/${SRC_TAG}`, { encoding: 'utf8' }).trim() !== SRC_TAG_OBJ) return false
      if (execSync(`git rev-parse refs/tags/${SRC_TAG}^{}`, { encoding: 'utf8' }).trim() !== SRC) return false
      execSync(`git merge-base --is-ancestor ${SRC} HEAD`, { stdio: 'pipe' })
      if (execSync(`git rev-parse ${SRC}^{tree}`, { encoding: 'utf8' }).trim() !== SRC_TREE) return false
      const raw = execSync(`git cat-file tag refs/tags/${SRC_TAG}`, { encoding: 'buffer' as any }) as unknown as Buffer
      return raw.toString('utf8').split('\n\n').slice(1).join('\n\n') === SRC_TAG_MSG
    } catch { return false }
  })())
check('A2: the loadable payloads and their evidence are byte-frozen — both admitted batch files, both completed forms, migration 027, and the SPENT EXLIB-2K package hold their exact promoted fingerprints',
  (() => {
    for (const [p, b, s] of [[B02, B02_FP.bytes, B02_FP.sha], [B04, B04_FP.bytes, B04_FP.sha],
      [DB_FORM.path, DB_FORM.bytes, DB_FORM.sha], [AW_FORM.path, AW_FORM.bytes, AW_FORM.sha],
      [PKG2K.path, PKG2K.bytes, PKG2K.sha]] as [string, number, string][]) {
      const d = bytesOf(p)
      if (d.length !== b || sha256(d) !== s) return false
    }
    return sha256(bytesOf(MIG027.path)) === MIG027.sha
  })())

console.log('\nB. Package identity, labels, and structure')
check('B1: the package is docs-only, labeled PREPARED — NOT EXECUTED, names ttybyljytiwntvorugcv as the only eventual target, forbids Claude execution, and binds every source fingerprint',
  pkg.includes('PREPARED — NOT EXECUTED') && pkg.includes('ttybyljytiwntvorugcv')
  && pkg.includes('never') && pkg.includes('by Claude')
  && pkg.includes(B02_FP.sha) && pkg.includes(B04_FP.sha)
  && pkg.includes(DB_FORM.sha) && pkg.includes(AW_FORM.sha)
  && pkg.includes(MIG027.sha) && pkg.includes(PKG2K.sha)
  && PKG.startsWith('docs/') && !PKG.startsWith('supabase/'))
check('B2: exactly one explicit transaction encloses the package',
  (pkg.match(/^BEGIN;$/m) || []).length === 1
  && pkg.split('\n').filter((l) => l === 'BEGIN;').length === 1
  && pkg.split('\n').filter((l) => l === 'COMMIT;').length === 1)
check('B3: the fresh-state gate is serialized by REAL table locks — one SHARE ROW EXCLUSIVE statement over exactly the ELEVEN catalog tables in deterministic alphabetical order (review events included), before any gated read',
  (() => {
    const m = pkg.match(/LOCK TABLE\n([\s\S]*?)\n  IN SHARE ROW EXCLUSIVE MODE;/)
    if (!m) return false
    const tables = m[1].split('\n').map((l) => l.trim().replace(/,$/, '')).filter(Boolean)
    if (tables.length !== 11) return false
    if (JSON.stringify(tables) !== JSON.stringify(LOCKED_TABLES)) return false
    if (JSON.stringify(tables) !== JSON.stringify([...tables].sort())) return false
    return pkg.indexOf('LOCK TABLE') < pkg.indexOf('DO $pre$')
  })())
check('B4: the narrowest authority — exactly TWO load_catalog_snapshot calls and ZERO load_catalog_identity, load_catalog_content_draft, review, admission, publication, seal, run, or delivery calls',
  (() => {
    const snap = (pkg.match(/^SELECT public\.load_catalog_snapshot\(/gm) || []).length
    const ident = (pkg.match(/load_catalog_identity\s*\(/g) || []).length
    const draft = (pkg.match(/load_catalog_content_draft\s*\(\s*'/g) || []).length
    const other = (pkg.match(/apply_content_review|admit_catalog_content|publish_catalog_content|exlib_approve_and_seal_run|deliver_catalog_exercises|rollback_catalog_delivery|exlib_revoke_run_delivery/g) || []).length
    return snap === 2 && ident === 0 && draft === 0 && other === 0
  })())
check('B5: transaction-contained elevation with grantor-scoped restoration — GRANT ... WITH SET TRUE, INHERIT FALSE; the $auth$ two-grantor structural proof BEFORE SET ROLE; SET ROLE/RESET ROLE framing; REVOKE ... GRANTED BY postgres; and the $post$ baseline + zero-standing-SET restoration proof',
  pkg.includes('GRANT exlib_catalog_loader TO postgres WITH SET TRUE, INHERIT FALSE;')
  && pkg.includes('two-grantor membership shape after the temporary grant is not exact')
  && pkg.indexOf('DO $auth$') < pkg.indexOf('SET ROLE exlib_catalog_loader;')
  && pkg.includes('SET ROLE exlib_catalog_loader;') && pkg.includes('RESET ROLE;')
  && pkg.includes('REVOKE exlib_catalog_loader FROM postgres GRANTED BY postgres;')
  && pkg.includes("pg_has_role('postgres', 'exlib_catalog_loader', 'SET')")
  && pkg.includes('authority restoration is not exact'))
check('B6: the fail-closed pre-state gate demands the EXACT post-EXLIB-2K hosted surface — the ELEVEN-table count vector, the exact three identities, both targets BARE, the three names unclaimed, the complete authoritative Plank state, and the claims invariant — all BEFORE any write or authority change',
  pkg.includes(`<> '${PRE_VECTOR}'`)
  && pkg.includes('an expected logical identity is missing')
  && pkg.includes('a target identity already carries snapshot/alias/claim state')
  && pkg.includes('an intended catalog name is already claimed')
  && pkg.includes('the Plank snapshot is not the exact promoted EXLIB-2K state')
  && pkg.includes('the Plank content draft is not the exact promoted EXLIB-2K state')
  && pkg.includes('the catalog claims invariant is already violated')
  && pkg.indexOf('DO $pre$') < pkg.indexOf('GRANT exlib_catalog_loader')
  && pkg.includes('refuses to run twice, over foreign state, or over an ambiguous surface'))
check('B7: the postconditions prove the EXACT post-state — the count vector, both independent bindings, the cross no-swap proof in both directions, zero target content, the pre-captured Plank/tenant digests, the claims invariant, and the client-privilege lock — each rolling back everything on mismatch',
  pkg.includes(`<> '${POST_VECTOR}'`)
  && pkg.includes('the Dead bug snapshot binding is not exact')
  && pkg.includes('the Ab wheel rollout snapshot binding is not exact')
  && pkg.includes('the UUID/name/category bindings are swapped or wrong')
  && pkg.includes('a target gained a content version')
  && pkg.includes('an untouched surface changed')
  && pkg.includes('the catalog claims invariant does not hold after the load')
  && pkg.includes('executable by an ordinary client role')
  && (pkg.match(/rolling back everything/g) || []).length >= 10
  && pkg.includes('CREATE TEMP TABLE exlib2o_pre_evidence ON COMMIT DROP'))

// ── Codex round-2 corrections: dedicated checks ──────────────────
// Round 1 serialized and proved TEN tables while asserting zero
// review events only from OUTSIDE the package, and pinned the Plank
// pre-state with four fields plus an in-transaction digest that could
// only ever prove "nothing changed while I ran". B8-B12 bind the
// corrections so neither gap can silently reopen.
check('B8: the serialized boundary and the internally proven surface are the SAME ELEVEN tables — the count vector is built from exactly the eleven locked tables (same set, eleven terms), and both the pre and post vector constants carry eleven terms',
  (() => {
    const vecBlocks = pkg.match(/SELECT \(SELECT count\(\*\) FROM public\.exercise_catalog_logical\)::text[\s\S]*?INTO v_counts;/g)
    if (!vecBlocks || vecBlocks.length !== 2) return false
    for (const block of vecBlocks) {
      const counted = (block.match(/count\(\*\) FROM public\.(\w+)/g) || [])
        .map((s) => `public.${s.replace(/^count\(\*\) FROM public\./, '')}`)
      if (counted.length !== 11) return false
      if (JSON.stringify([...counted].sort()) !== JSON.stringify([...LOCKED_TABLES].sort())) return false
      if (!counted.includes('public.exercise_catalog_review_events')) return false
    }
    return PRE_VECTOR.split('/').length === 11 && POST_VECTOR.split('/').length === 11
      && pkg.includes(`<> '${PRE_VECTOR}'`) && pkg.includes(`<> '${POST_VECTOR}'`)
  })())
check('B9: zero review events is enforced by the package ITSELF, not only asserted from outside — review events are locked, counted in the pre vector (expected 0), counted again in the post vector (expected 0), and any nonzero count refuses fail-closed before any write',
  (() => {
    const locked = pkg.includes('public.exercise_catalog_review_events,')
    const counted = (pkg.match(/count\(\*\) FROM public\.exercise_catalog_review_events/g) || []).length
    // review events are the ELEVENTH (last) term of both vectors, and
    // both constants end in the zero that pins them empty
    return locked && counted === 2
      && PRE_VECTOR.split('/')[10] === '0' && POST_VECTOR.split('/')[10] === '0'
      && pkg.includes('refuses to run twice, over foreign state, or over an ambiguous surface')
      && pkg.includes('post-state counts are not exact')
  })())
check('B10: the COMPLETE authoritative Plank pre-state is proven from promoted committed evidence before GRANT — snapshot semantics, anatomy, aliases, claims, the full content payload with authorship and review evidence, the draft/unadmitted/unpublished lifecycle, and the exact expected relationships — each with its own fail-closed refusal',
  (() => {
    const msgs = [
      'the Plank snapshot is not the exact promoted EXLIB-2K state',
      'the Plank anatomy set is not the exact promoted EXLIB-2K state',
      'the Plank alias set is not the exact promoted EXLIB-2K state',
      'the Plank claim set is not the exact promoted EXLIB-2K state',
      'the Plank content draft is not the exact promoted EXLIB-2K state',
      'the Plank expected-relationship set is not the exact promoted EXLIB-2K state',
    ]
    if (!msgs.every((m) => pkg.includes(m))) return false
    // every gate precedes the authority change and the loader calls
    const grant = pkg.indexOf('GRANT exlib_catalog_loader TO postgres WITH SET TRUE')
    const firstLoad = pkg.search(/^SELECT public\.load_catalog_snapshot\(/m)
    if (!msgs.every((m) => pkg.indexOf(m) < grant && pkg.indexOf(m) < firstLoad)) return false
    // snapshot semantics: every stable field, not just name/active/pending/v1
    const snapFields = ["e.category = 'isolation'", "e.primary_muscle = 'abs'",
      "e.equipment = 'bodyweight'", "e.laterality = 'bilateral'", "e.tracking_mode = 'timed'",
      "e.provenance = 'forgefitos_original'", "e.movement_pattern = 'core_anti_extension'",
      "e.training_role = 'core'", "e.difficulty = 'beginner'", "e.availability = 'minimal'",
      'e.source_url IS NULL', 'e.source_page IS NULL', 'e.retrieved_at IS NULL',
      'e.import_confidence IS NULL', "e.review_status = 'pending'", 'e.reviewed_by IS NULL',
      'e.catalog_version = 1', 'e.is_active']
    if (!snapFields.every((f) => pkg.includes(f))) return false
    // complete content payload + lifecycle + authorship. Every payload
    // field is compared to a dollar-quoted authoritative literal by
    // EXACT value equality (B13 proves the literals are the artifact's
    // own values and that no hash survives in this gate).
    const contentFields = ['AND c.setup_steps = $p_setu$', 'AND c.execution_steps = $p_exec$',
      'AND c.common_mistakes = $p_mist$', 'AND c.breathing_cue = $p_br$',
      'AND c.safety_guidance = $p_sf$', 'AND c.equipment_setup = $p_es$$p_es$',
      'AND c.accessibility_alternative = $p_ac$', 'AND c.authored_by = $p_ab$',
      "c.authored_at = DATE '2026-09-01'", "c.content_status = 'pending'",
      "c.publication_status = 'draft'", 'c.import_admitted = false',
      'c.reviewed_by IS NULL', 'c.reviewed_at IS NULL', 'c.review_rationale IS NULL',
      'c.admitted_fingerprint IS NULL', 'c.admitted_source_sha256 IS NULL', 'c.admitted_at IS NULL']
    if (!contentFields.every((f) => pkg.includes(f))) return false
    // exact anatomy/alias/claim/relationship sets
    return pkg.includes("'lower_back:tertiary,obliques:secondary'")
      && pkg.includes("'Forearm plank,Front plank'")
      && pkg.includes("'forearm plank=alias,front plank=alias,plank=canonical'")
      && pkg.includes("'progression>e21b2c00-0000-4000-a000-000000000003,substitution>e21b2c00-0000-4000-a000-000000000002'")
      // generated ids/timestamps are bound STRUCTURALLY, never invented:
      // the content row is addressed by its fixed UUID, and no created_at/
      // updated_at literal is pinned anywhere in the gate
      && pkg.includes("c.id = 'e21b2c00-0000-4000-a000-000000000101'")
      && !/c\.created_at\s*=/.test(pkg) && !/c\.updated_at\s*=/.test(pkg)
      && !/e\.created_at\s*=/.test(pkg) && !/e\.updated_at\s*=/.test(pkg)
  })())
check('B11: the authoritative pre-state proof and the in-transaction digests are kept DISTINCT — the digests are labeled transition-neutrality evidence explicitly disclaiming pre-state authority, are captured only AFTER every authoritative gate has passed, and are compared in $post$ to prove EXLIB-2O changed nothing',
  (() => {
    const digestLabel = 'TRANSITION-NEUTRALITY EVIDENCE (not a pre-state authority'
    if (!pkg.includes(digestLabel)) return false
    const capture = pkg.indexOf('CREATE TEMP TABLE exlib2o_pre_evidence')
    const lastGate = pkg.indexOf('the Plank expected-relationship set is not the exact promoted EXLIB-2K state')
    const compare = pkg.indexOf('an untouched surface changed')
    return lastGate > 0 && capture > lastGate
      && capture < pkg.indexOf('GRANT exlib_catalog_loader')
      && compare > capture && compare > pkg.indexOf('DO $post$')
      && pkg.includes('re-digested after the')
  })())
check('B12: the "tenant table unchanged" claim covers EVERY persisted column — the digest is a whole-row rendering (row::text) over the entire exercises table with deterministic primary-key ordering, plus the row count, and pins no narrowed column list',
  (() => {
    const rowDigests = (pkg.match(/md5\(coalesce\(string_agg\(t::text, '\|' ORDER BY t\.id\), '<none>'\)\)/g) || []).length
    return rowDigests === 2
      && (pkg.match(/count\(\*\) FROM public\.exercises/g) || []).length === 2
      && pkg.includes('every persisted column')
      && !/string_agg\(t\.(name|category|slug)/.test(pkg)
  })())

// ── Codex round-3 corrections: dedicated checks ──────────────────
// Round 2 verified public.load_catalog_snapshot but INVOKED
// load_catalog_snapshot unqualified, so search_path — which the
// package does not pin — stood between the checked object and the
// invoked one; and it pinned six payload fields with md5, which proves
// md5 equality rather than value equality and which this program had
// already rejected as an admission binding. B13/B14 bind both fixes.
const PLANK_ARTIFACT = { path: 'docs/exlib2g-plank-content.jsonl', bytes: 2928, sha: 'd82078490efa9ef13e128e7b7b742fbda8ea9e74e32382252d96c326c679d752' }
const GATE_OPEN = 'AUTHORITATIVE PLANK PRE-STATE GATE'
const GATE_CLOSE = 'TRANSITION-NEUTRALITY EVIDENCE'
// The payload/authorship fields, with the dollar-quote tag each is
// bound by and whether the binding is text or JSONB equality.
const PAYLOAD: [string, string, 'text' | 'json'][] = [
  ['setup_steps', 'p_setu', 'json'], ['execution_steps', 'p_exec', 'json'],
  ['common_mistakes', 'p_mist', 'json'], ['breathing_cue', 'p_br', 'text'],
  ['safety_guidance', 'p_sf', 'text'], ['equipment_setup', 'p_es', 'text'],
  ['accessibility_alternative', 'p_ac', 'text'], ['authored_by', 'p_ab', 'text'],
]
check('B13: the authoritative Plank gate carries NO hash of any kind — every payload and authorship field is bound by EXACT value equality (text to a dollar-quoted text literal, JSONB to a JSONB literal), every expected value in the whole gate is re-derived mechanically from the promoted admitted Plank artifact (or, for the category the artifact cannot carry, from the promoted EXLIB-2K load call), and the md5 transition-neutrality digests survive only OUTSIDE the gate, explicitly disclaimed as never a source binding',
  (() => {
    const art = bytesOf(PLANK_ARTIFACT.path)
    if (art.length !== PLANK_ARTIFACT.bytes || sha256(art) !== PLANK_ARTIFACT.sha) return false
    const lines = art.toString('utf8').split('\n').filter((l) => l.trim() && !l.startsWith('#'))
    if (lines.length !== 1) return false
    const plank: Record<string, unknown> = JSON.parse(lines[0])
    const open = pkg.indexOf(GATE_OPEN)
    const close = pkg.indexOf(GATE_CLOSE)
    if (open < 0 || close < 0 || close < open) return false
    const gate = pkg.slice(open, close)
    // (1) zero hash predicates anywhere in the authoritative gate —
    // md5 above all, but also the digest/encode family
    if (/(md5|digest|sha\d+|hashtext|encode|crypt)\s*\(/i.test(gate)) return false
    // (2) every payload field compared directly, and every literal
    // equal BY VALUE to the artifact's own field
    for (const [col, tag, kind] of PAYLOAD) {
      if (!gate.includes(`AND c.${col} = $${tag}$`)) return false
      const v = lit(tag)
      if (v === null) return false
      if (kind === 'json') {
        if (!gate.includes(`$${tag}$::jsonb`)) return false
        if (JSON.stringify(JSON.parse(v)) !== JSON.stringify(plank[col])) return false
      } else if (v !== plank[col]) return false
    }
    if (!gate.includes(`c.authored_at = DATE '${plank.authored_at as string}'`)) return false
    // (3) the rest of the gate's expected values, re-derived the same way
    const anatomy = (plank.muscle_targets as { muscle: string, role: string }[])
      .map((m) => `${m.muscle}:${m.role}`).sort().join(',')
    const aliases = (plank.aliases as string[]).slice().sort().join(',')
    const claims = [...(plank.aliases as string[]).map((a) => `${a.toLowerCase()}=alias`),
      `${(plank.proposed_canonical_name as string).toLowerCase()}=canonical`].sort().join(',')
    if (!gate.includes(`'${anatomy}'`) || !gate.includes(`'${aliases}'`) || !gate.includes(`'${claims}'`)) return false
    for (const f of ['primary_muscle', 'equipment', 'laterality', 'tracking_mode', 'provenance',
      'movement_pattern', 'training_role', 'difficulty', 'availability']) {
      if (!gate.includes(`e.${f} = '${plank[f] as string}'`)) return false
    }
    if (!gate.includes(`e.canonical_name = '${plank.proposed_canonical_name as string}'`)) return false
    // category exists in no authored record: its authority is the
    // promoted (SPENT) EXLIB-2K load call's third argument
    const k2 = bytesOf(PKG2K.path).toString('utf8')
    const kCat = k2.match(/SELECT load_catalog_snapshot\(\n[^\n]*\n[^\n]*\n {2}'([a-z_]+)',\n/)
    if (!kCat || !gate.includes(`e.category = '${kCat[1]}'`)) return false
    // (4) the md5 digests live ONLY in the transition-neutrality
    // evidence, which disclaims source authority in its own words
    const evidence = pkg.slice(close)
    return (evidence.match(/md5\(/g) || []).length === (pkg.match(/md5\(/g) || []).length
      && (evidence.match(/md5\(/g) || []).length === 14
      && evidence.includes('never as')
      && evidence.includes('a binding to any source artifact')
      && evidence.includes('compared against itself and pass')
  })())
check('B14: the VERIFIED function and the INVOKED function are structurally the same object — both loader calls are schema-qualified public.load_catalog_snapshot, there is not one unqualified call site anywhere, the precondition checks that exact schema-qualified 18-argument signature, each call passes exactly 18 arguments, and every other name in the package is either public.-qualified or a pg_catalog object no search_path entry can shadow',
  (() => {
    // exactly two qualified call sites, zero unqualified ones
    if ((pkg.match(/^SELECT public\.load_catalog_snapshot\(/gm) || []).length !== 2) return false
    if ((pkg.match(/(?<!public\.)load_catalog_snapshot\s*\(/g) || []).length !== 0) return false
    // the checked signature, and its argument arity
    const sig = pkg.match(/to_regprocedure\('public\.load_catalog_snapshot\(([^)]*)\)'\)/)
    if (!sig) return false
    const argTypes = sig[1].split(',').map((s) => s.trim()).filter(Boolean)
    if (argTypes.length !== 18 || argTypes[0] !== 'uuid') return false
    // each call's own arity: strip dollar-quoted literals (their
    // contents carry commas), then count top-level commas
    const calls = pkg.match(/^SELECT public\.load_catalog_snapshot\(([\s\S]*?)\);$/gm)
    if (!calls || calls.length !== 2) return false
    for (const call of calls) {
      const stripped = call.replace(/\$[a-z0-9_]*\$[\s\S]*?\$[a-z0-9_]*\$/g, 'X')
      let depth = 0
      let args = 1
      for (const ch of stripped.slice(stripped.indexOf('(') + 1, stripped.lastIndexOf(')'))) {
        if (ch === '(') depth += 1
        else if (ch === ')') depth -= 1
        else if (ch === ',' && depth === 0) args += 1
      }
      if (args !== 18) return false
    }
    // EXACT inventory of every name the package does NOT qualify, so a
    // new unqualified reference cannot slip in unnoticed:
    //   pg_roles             — a pg_catalog system view; pg_catalog is
    //                          searched ahead of every search_path
    //                          entry, so no interposed schema can
    //                          shadow it
    //   exlib2o_pre_evidence — this transaction's own ON COMMIT DROP
    //                          temp table; only this session's temp
    //                          schema can hold that name, and a
    //                          pre-existing one makes the CREATE fail
    //                          closed
    //   postgres             — the ROLE in "REVOKE ... FROM postgres",
    //                          not a relation at all
    const rels = Array.from(new Set((pkg.match(/(?:FROM|JOIN)\s+([a-zA-Z_][\w.]*)/g) || [])
      .map((s) => s.replace(/^(?:FROM|JOIN)\s+/, ''))
      .filter((n) => !n.startsWith('public.') && !n.startsWith('pg_catalog.')))).sort()
    if (JSON.stringify(rels) !== JSON.stringify(['exlib2o_pre_evidence', 'pg_roles', 'postgres'])) return false
    return pkgProse.includes('This package therefore pins no search_path and needs none.')
      && pkgProse.includes('the checked object and the invoked object are now the same database object by construction')
  })())

console.log('\nC. Loader literals re-derived from the admitted sources')
const b02rec = JSON.parse(bytesOf(B02).toString('utf8').split('\n')[B02_FP.line - 1])
const b04rec = JSON.parse(bytesOf(B04).toString('utf8').split('\n')[B04_FP.line - 1])
const dbForm = JSON.parse(bytesOf(DB_FORM.path).toString('utf8'))
const awForm = JSON.parse(bytesOf(AW_FORM.path).toString('utf8'))
check('C1: Dead bug literals VERBATIM — name, primary muscle, equipment, laterality, tracking mode, provenance, movement pattern, training role, difficulty, and availability equal the admitted batch02 line-12 values',
  lit('nm1') === b02rec.proposed_canonical_name
  && lit('pm1') === b02rec.primary_muscle
  && lit('eq1') === b02rec.equipment
  && lit('lat1') === b02rec.laterality
  && lit('tm1') === b02rec.tracking_mode
  && lit('prov1') === b02rec.provenance
  && lit('mp1') === b02rec.movement_pattern
  && lit('tr1') === b02rec.training_role
  && lit('dif1') === b02rec.difficulty
  && lit('av1') === b02rec.availability)
check('C2: Dead bug anatomy and aliases VERBATIM — the JSONB literals equal the admitted muscle_targets and aliases arrays exactly',
  JSON.stringify(JSON.parse(lit('anat1') || 'null')) === JSON.stringify(b02rec.muscle_targets)
  && JSON.stringify(JSON.parse(lit('alia1') || 'null')) === JSON.stringify(b02rec.aliases))
check('C3: Dead bug category is the HUMAN decision — the package literal equals the completed form snapshot_category_decision (mobility), a value that exists in NO authored record',
  lit('cat1') === dbForm.snapshot_category_decision
  && lit('cat1') === 'mobility'
  && !('category' in b02rec) && !('snapshot_category_decision' in b02rec))
check('C4: Ab wheel rollout literals VERBATIM from the admitted batch04 line-5 values',
  lit('nm2') === b04rec.proposed_canonical_name
  && lit('pm2') === b04rec.primary_muscle
  && lit('eq2') === b04rec.equipment
  && lit('lat2') === b04rec.laterality
  && lit('tm2') === b04rec.tracking_mode
  && lit('prov2') === b04rec.provenance
  && lit('mp2') === b04rec.movement_pattern
  && lit('tr2') === b04rec.training_role
  && lit('dif2') === b04rec.difficulty
  && lit('av2') === b04rec.availability)
check('C5: Ab wheel rollout anatomy and aliases VERBATIM',
  JSON.stringify(JSON.parse(lit('anat2') || 'null')) === JSON.stringify(b04rec.muscle_targets)
  && JSON.stringify(JSON.parse(lit('alia2') || 'null')) === JSON.stringify(b04rec.aliases))
check('C6: Ab wheel rollout category is the HUMAN decision (other) from the completed form; the authored record carries none',
  lit('cat2') === awForm.snapshot_category_decision
  && lit('cat2') === 'other'
  && !('category' in b04rec) && !('snapshot_category_decision' in b04rec))
check('C7: the UUID bindings appear exactly and are never swapped — each loader call opens with its own identity, matching the completed forms, and the discovery quadruple is NULL in both calls exactly as authored',
  (() => {
    const uuidOf = (tag: string): string | null => {
      const m = pkg.match(new RegExp(`SELECT public\\.load_catalog_snapshot\\(\\s*'([0-9a-f-]{36})',\\s*\\$${tag}\\$`))
      return m ? m[1] : null
    }
    if (uuidOf('nm1') !== DB_UUID) return false
    if (uuidOf('nm2') !== AW_UUID) return false
    if (dbForm.intended_logical_uuid !== DB_UUID || awForm.intended_logical_uuid !== AW_UUID) return false
    // the authored records NEVER carried discovery sources (the keys
    // are absent); the package passes SQL NULL as the
    // forgefitos_original constraint requires
    const noSrc = (r: any): boolean =>
      ['source_url', 'source_page', 'retrieved_at', 'import_confidence'].every((k) => r[k] == null)
    if (!noSrc(b02rec) || !noSrc(b04rec)) return false
    return (pkg.match(/^  NULL, NULL, NULL, NULL,$/gm) || []).length === 2
  })())

console.log('\nD. Preparation record bindings')
check('D1: the record binds every fingerprint (both admitted sources with line fingerprints, both forms, the package, migration 027, the spent 2K package), both UUIDs, both categories with their carriers, and the constructed-values-NONE statement',
  (() => {
    const pkgBytes = bytesOf(PKG)
    for (const s of [B02_FP.sha, B04_FP.sha, DB_FORM.sha, AW_FORM.sha, MIG027.sha, PKG2K.sha, sha256(pkgBytes)]) {
      if (!recSolid.includes(s)) return false
    }
    // the record writes byte counts comma-grouped ("35,468 B"). Round 1
    // compared only the first two digits, which any stale count sharing
    // a leading pair would have passed; assert the exact grouped count
    // so "recompute every fingerprint from final bytes" is really proven.
    if (!recSolid.includes(`${pkgBytes.length.toLocaleString('en-US')}B`)) return false
    return recFlat.includes(DB_UUID) && recFlat.includes(AW_UUID)
      && recFlat.includes('category **mobility**') && recFlat.includes('category **other**')
      && recFlat.includes('CONSTRUCTED VALUES: NONE')
  })())
check('D2: the record states the exact pre/post state vectors, the authority elevation and restoration behavior, the one-use and failure/rollback semantics, and the target no-swap proof layers',
  recFlat.includes(PRE_VECTOR) && recFlat.includes(POST_VECTOR)
  && recFlat.includes('granted BY supabase_admin, ADMIN TRUE / INHERIT FALSE / SET FALSE')
  && recFlat.includes('grantor-scoped REVOKE')
  && recFlat.includes('second execution refuses BEFORE any write or authority change')
  && recFlat.includes('rolls back EVERYTHING')
  && recFlat.includes('Target no-swap proof'))
check('D3: the record separates target-snapshot loading from content loading, keeps review/admission/publication/projection/Plank release/delivery as later gated milestones, carries the byte-change invalidation rule, and states PREPARED — NOT EXECUTED with the AI-did-not-review statement',
  recFlat.includes('is NOT content loading')
  && recFlat.includes('later, separately gated')
  && recFlat.includes('VOIDS the preparation approval')
  && recFlat.includes('PREPARED — NOT EXECUTED')
  && recFlat.includes('ChatGPT and Claude did NOT perform, influence, or fabricate the human reviews'))

console.log('\nE. Lifecycle, retargets, and phase topology')
check('E1: the R6 admission verifier carries the exact EXLIB-2O retarget label with its G topology and F1 range anchored to the promoted R6 tip; the application verifier is byte-unchanged from the promoted source',
  (() => {
    const v = bytesOf(R6_VERIFIER).toString('utf8')
    if (!v.includes('RETARGET (EXLIB-2O target-snapshot load prep)')) return false
    if (!v.includes(`const TIP_R6 = '${SRC}'`)) return false
    return bytesOf('scripts/verify-exlib2n-application.ts')
      .equals(blobAt(SRC, 'scripts/verify-exlib2n-application.ts'))
  })())
check('E2: upstream authorities untouched — the admitted Plank artifact, both batch files, both forms, the schema, the inventory (anchored at the delivery predecessor), and the ledger byte-identical to the promoted source tip',
  (() => {
    // RETARGET (EXLIB-2S delivery-activation preparation): the
    // inventory is compared source-blob vs the anchored
    // delivery-predecessor blob (the promoted EXLIB-2R evidence tip),
    // where this claim was and remains true; the rest stay live.
    const DELIVERY_PRED = '5f7e182f3027b3640514e06d642693f4018c03e2'
    if (!blobAt(DELIVERY_PRED, 'docs/exlib2b-release1-inventory.jsonl').equals(blobAt(SRC, 'docs/exlib2b-release1-inventory.jsonl'))) return false
    for (const p of ['docs/exlib2g-plank-content.jsonl', B02, B04, DB_FORM.path, AW_FORM.path,
      'docs/exlib2c-authoring-schema.json',
      'docs/exlib1b1-review-ledger.jsonl']) {
      if (!bytesOf(p).equals(blobAt(SRC, p))) return false
    }
    return true
  })())
check('E3: migrations remain exactly 001-027 with no 028 — the package lives under docs/, never under supabase/migrations/',
  (() => {
    const migs = execSync(`git ls-tree ${committed ? 'HEAD' : SRC} supabase/migrations/ --name-only`, { encoding: 'utf8' })
      .split('\n').filter((f) => /\/0\d\d_.+\.sql$/.test(f))
    return migs.length === 27 && !migs.some((f) => f.includes('/028'))
  })())
// RETARGET (EXLIB-2O hosted-execution evidence): G1/G2/G4 walk the
// promoted EXLIB-2O tip instead of HEAD, so they hold in every later
// milestone; the tip must remain an ancestor of HEAD.
check('G1: phase topology — the merge base of the promoted EXLIB-2O tip and the promoted source IS the source; the phase is exactly THREE plain single-parent commits in order (the original preparation, the Codex round-2 correction, the Codex round-3 correction), 3 ahead / 0 behind, zero merges — RETARGET (EXLIB-2O hosted-execution evidence): anchored to the promoted tip 632ef40..., where this was and remains true',
  (() => {
    try {
      if (execSync(`git rev-parse ${TIP}^{tree}`, { encoding: 'utf8' }).trim() !== TIP_TREE) return false
      execSync(`git merge-base --is-ancestor ${TIP} HEAD`, { stdio: 'pipe' })
      if (execSync(`git merge-base ${SRC} ${TIP}`, { encoding: 'utf8' }).trim() !== SRC) return false
      // every link in the chain, walked explicitly: TIP -> R2 -> PREP -> SRC
      for (const [child, parent] of [[TIP, R2], [R2, PREP], [PREP, SRC]]) {
        const parents = execSync(`git rev-list --parents -n 1 ${child}`, { encoding: 'utf8' }).trim().split(/\s+/)
        if (parents.length !== 2 || parents[1] !== parent) return false
      }
      return execSync(`git rev-list --count ${SRC}..${TIP}`, { encoding: 'utf8' }).trim() === '3'
        && execSync(`git rev-list --count ${TIP}..${SRC}`, { encoding: 'utf8' }).trim() === '0'
        && execSync(`git rev-list --count --merges ${SRC}..${TIP}`, { encoding: 'utf8' }).trim() === '0'
    } catch { return false }
  })())
check('G2: exact phase inventory — the three-commit range carries exactly the five disclosed paths (4 additions, 1 labeled retargeted suite) and nothing else — anchored to the promoted tip',
  (() => {
    const status = execSync(`git diff --name-status ${SRC}..${TIP}`, { encoding: 'utf8' })
      .split('\n').filter(Boolean).sort()
    return JSON.stringify(status) === JSON.stringify(PHASE)
  })())
check('G4: BOTH earlier commits are PRESERVED, never rewritten — the original preparation and the round-2 correction still carry their exact recorded trees, and the parent chain is unchanged — and the round-3 correction is exactly ONE plain single-parent forward commit on top of the round-2 correction, modifying exactly the four corrected paths — anchored to the promoted tip',
  (() => {
    try {
      if (execSync(`git rev-parse ${PREP}^{tree}`, { encoding: 'utf8' }).trim() !== PREP_TREE) return false
      if (execSync(`git rev-parse ${R2}^{tree}`, { encoding: 'utf8' }).trim() !== R2_TREE) return false
      const pparents = execSync(`git rev-list --parents -n 1 ${PREP}`, { encoding: 'utf8' }).trim().split(/\s+/)
      if (pparents.length !== 2 || pparents[1] !== SRC) return false
      if (execSync(`git rev-list --count ${R2}..${TIP}`, { encoding: 'utf8' }).trim() !== '1') return false
      if (execSync(`git rev-list --count --merges ${R2}..${TIP}`, { encoding: 'utf8' }).trim() !== '0') return false
      // each correction round, taken on its own, modifies exactly the
      // four corrected paths - round 2 over the preparation commit and
      // round 3 over round 2
      for (const base of [PREP, R2]) {
        const range = base === PREP ? `${PREP}..${R2}` : `${R2}..${TIP}`
        const status = execSync(`git diff --name-status ${range}`, { encoding: 'utf8' })
          .split('\n').filter(Boolean).sort()
        if (JSON.stringify(status) !== JSON.stringify(CORRECTED.map((p) => `M\t${p}`).sort())) return false
      }
      return true
    } catch { return false }
  })())
check('G3: two-state lifecycle — the package, record, and both verifiers are absent at the promoted source tip and present in this phase',
  (() => {
    const srcDocs = execSync(`git ls-tree ${SRC} docs/ --name-only`, { encoding: 'utf8' })
    const srcScripts = execSync(`git ls-tree ${SRC} scripts/ --name-only`, { encoding: 'utf8' })
    if (srcDocs.includes('exlib2o-')) return false
    if (srcScripts.includes('verify-exlib2o')) return false
    for (const p of [PKG, RECORD, VERIFIER, LIVE]) bytesOf(p)
    return true
  })())

console.log('\nH. Hygiene')
check('H1: no phase file contains credential material, hosted connection strings, or remote execution commands; the package and record carry no non-ASCII beyond the em-dash and box-drawing rules',
  (() => {
    const bads = ['SUPABASE_' + 'SERVICE', 'sb_' + 'secret', 'eyJ' + 'hb',
      '--db' + '-url', '--lin' + 'ked', 'db ' + 'push', 'supabase' + '.co/']
    const payload = [PKG, RECORD, VERIFIER].map((p) => bytesOf(p).toString('utf8')).join('\n')
    if (!bads.every((b) => !payload.includes(b))) return false
    for (const p of [PKG, RECORD]) {
      for (const ch of bytesOf(p).toString('utf8')) {
        const c = ch.codePointAt(0) as number
        if (c > 127 && c !== 0x2014 && c !== 0x2500) return false
        if (c < 32 && ch !== '\n') return false
      }
    }
    return true
  })())
check('H2: the live verifier exists, targets only disposable socket-only clusters, executes the committed 2K package to build the pre-state, carries a refusal matrix of EXACTLY SIXTEEN counterfactual variants (the five round-2 additions and the two round-3 additions among them), counts the loader calls SCHEMA-QUALIFIED, proves with a real same-signature decoy ahead of public that the qualified call cannot be hijacked, checks every harness surgery so a silently rejected mutation can never read as a pass, and proves the review-events writer exclusion structurally from pg_locks',
  (() => {
    const l = bytesOf(LIVE).toString('utf8')
    return l.includes('unix_socket_directories') && l.includes("listen_addresses=''")
      && l.includes('exlib2k-plank-catalog-load-package.sql')
      && l.includes(PKG)
      && l.includes('RACE') && l.includes('exactly one committer')
      // the refusal matrix is COUNTED, not described: the header prose and
      // the actual number of counterfactual variants cannot drift apart
      && (l.match(/^expect_pkg_refusal /gm) || []).length === 16
      && l.includes('SIXTEEN counterfactual variants')
      // the five round-2 refusal variants, by their pinned gate messages
      && l.includes('PRE-EXISTING REVIEW EVENT refused')
      && l.includes('MUTATED PLANK CONTENT PAYLOAD refused')
      && l.includes('ALTERED PLANK LIFECYCLE refused')
      && l.includes('ALTERED EXPECTED RELATIONSHIP refused')
      && l.includes('ALTERED PLANK SNAPSHOT FIELD refused')
      // round-3: the live parsing/counting/surgery logic recognizes the
      // SCHEMA-QUALIFIED calls (package identity, omitted-call surgery)
      && l.includes("^SELECT public\\.load_catalog_snapshot(")
      && l.includes('ZERO unqualified call sites')
      && l.includes('/^SELECT public\\.load_catalog_snapshot\\(/{n++}')
      // round-3: both payload counterfactuals, scalar and jsonb
      && l.includes('MUTATED PLANK CONTENT PAYLOAD refused - SCALAR payload field')
      && l.includes('MUTATED PLANK CONTENT PAYLOAD refused - JSONB payload field')
      // round-3: the durable, NON-TRANSACTIONAL invocation instrument and
      // the real decoy that gives it teeth
      && l.includes('track_functions=all') && l.includes('pg_stat_user_functions')
      && l.includes('SEARCH_PATH DECOY')
      && l.includes('CREATE FUNCTION exlib2o_decoy.load_catalog_snapshot(')
      && l.includes('ALTER DATABASE $V SET search_path = exlib2o_decoy, public')
      && l.includes('the round-2 UNQUALIFIED call shape IS hijacked')
      // fail-loud harness surgery, and the ELEVEN-term live vectors
      && l.includes('HARNESS SURGERY FAILED')
      && l.includes(`PRE_VECTOR="${PRE_VECTOR}"`) && l.includes(`POST_VECTOR="${POST_VECTOR}"`)
      // structural review-events lock proof: granted holder vs ungranted waiter
      && l.includes("l.mode = 'ShareRowExclusiveLock' AND l.granted")
      && l.includes("l.mode = 'RowExclusiveLock' AND NOT l.granted")
      && l.includes("c.relname = 'exercise_catalog_review_events'")
  })())

console.log(`\n${pass} passed, ${fail} failed`)
if (fail > 0) process.exit(1)
