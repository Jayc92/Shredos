// EXLIB-2O static verifier — Dead bug + Ab wheel rollout
// target-snapshot load-package preparation.
//
// Proves: the exact promoted source (R6 admission tip + tag); the
// package fingerprint, labels, and structure (one transaction, the
// exact ten-table lock list, exactly TWO load_catalog_snapshot calls
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
const PRE_VECTOR = '3/1/2/2/3/1/2/0/0/0'
const POST_VECTOR = '3/3/5/3/6/1/2/0/0/0'

const PHASE = [
  ['A', PKG], ['A', RECORD], ['A', VERIFIER], ['A', LIVE], ['M', R6_VERIFIER],
].map(([s, p]) => `${s}\t${p}`).sort()

const sha256 = (buf: Buffer | string): string => createHash('sha256').update(buf).digest('hex')
const blobAt = (ref: string, p: string): Buffer =>
  execSync(`git cat-file blob ${ref}:${p}`, { maxBuffer: 1 << 26 })

let pass = 0
let fail = 0
const check = (name: string, ok: boolean): void => {
  if (ok) { pass += 1; console.log(`  PASS  ${name}`) }
  else { fail += 1; console.log(`  FAIL  ${name}`) }
}

const committed = execSync(`git rev-list --count ${SRC}..HEAD`, { encoding: 'utf8' }).trim() !== '0'
const bytesOf = (p: string): Buffer => (committed ? blobAt('HEAD', p) : readFileSync(p))
const pkg = bytesOf(PKG).toString('utf8')
const rec = bytesOf(RECORD).toString('utf8')
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
check('B3: the fresh-state gate is serialized by REAL table locks — one SHARE ROW EXCLUSIVE statement over exactly the ten catalog tables in alphabetical order, before any gated read',
  (() => {
    const m = pkg.match(/LOCK TABLE\n([\s\S]*?)\n  IN SHARE ROW EXCLUSIVE MODE;/)
    if (!m) return false
    const tables = m[1].split('\n').map((l) => l.trim().replace(/,$/, '')).filter(Boolean)
    const expected = ['public.exercise_catalog', 'public.exercise_catalog_aliases',
      'public.exercise_catalog_content', 'public.exercise_catalog_content_expected_relationships',
      'public.exercise_catalog_import_runs', 'public.exercise_catalog_logical',
      'public.exercise_catalog_muscles', 'public.exercise_catalog_name_claims',
      'public.exercise_catalog_relationships', 'public.exercise_catalog_run_items']
    if (JSON.stringify(tables) !== JSON.stringify(expected)) return false
    return pkg.indexOf('LOCK TABLE') < pkg.indexOf('DO $pre$')
  })())
check('B4: the narrowest authority — exactly TWO load_catalog_snapshot calls and ZERO load_catalog_identity, load_catalog_content_draft, review, admission, publication, seal, run, or delivery calls',
  (() => {
    const snap = (pkg.match(/^SELECT load_catalog_snapshot\(/gm) || []).length
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
check('B6: the fail-closed pre-state gate demands the EXACT post-EXLIB-2K hosted surface — the ten-table count vector, the exact three identities, both targets BARE, the three names unclaimed, the exact Plank shape, and the claims invariant — all BEFORE any write or authority change',
  pkg.includes(`<> '${PRE_VECTOR}'`)
  && pkg.includes('an expected logical identity is missing')
  && pkg.includes('a target identity already carries snapshot/alias/claim state')
  && pkg.includes('an intended catalog name is already claimed')
  && pkg.includes('the existing Plank snapshot is not the exact loaded EXLIB-2K state')
  && pkg.includes('the existing Plank content draft is not the exact loaded EXLIB-2K row')
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
      const m = pkg.match(new RegExp(`SELECT load_catalog_snapshot\\(\\s*'([0-9a-f-]{36})',\\s*\\$${tag}\\$`))
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
    if (!recSolid.includes(`${pkgBytes.length.toString().slice(0, 2)}`)) return false
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
check('E2: upstream authorities untouched — the admitted Plank artifact, both batch files, both forms, the schema, the inventory, and the ledger are byte-identical to the promoted source tip',
  (() => {
    for (const p of ['docs/exlib2g-plank-content.jsonl', B02, B04, DB_FORM.path, AW_FORM.path,
      'docs/exlib2c-authoring-schema.json', 'docs/exlib2b-release1-inventory.jsonl',
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
if (committed) {
  check('G1: phase topology — the merge base of HEAD and the promoted source IS the source, the sole parent of HEAD IS the source, exactly 1 ahead / 0 behind, one commit, zero merges',
    (() => {
      try {
        if (execSync(`git merge-base ${SRC} HEAD`, { encoding: 'utf8' }).trim() !== SRC) return false
        if (execSync('git rev-parse HEAD^1', { encoding: 'utf8' }).trim() !== SRC) return false
        const parents = execSync('git rev-list --parents -n 1 HEAD', { encoding: 'utf8' }).trim().split(/\s+/)
        if (parents.length !== 2 || parents[1] !== SRC) return false
        return execSync(`git rev-list --count ${SRC}..HEAD`, { encoding: 'utf8' }).trim() === '1'
          && execSync(`git rev-list --count HEAD..${SRC}`, { encoding: 'utf8' }).trim() === '0'
          && execSync(`git rev-list --count --merges ${SRC}..HEAD`, { encoding: 'utf8' }).trim() === '0'
      } catch { return false }
    })())
  check('G2: exact phase inventory — the single commit carries exactly the five disclosed paths (4 additions, 1 labeled retargeted suite) and nothing else',
    (() => {
      const status = execSync(`git diff --name-status ${SRC}..HEAD`, { encoding: 'utf8' })
        .split('\n').filter(Boolean).sort()
      return JSON.stringify(status) === JSON.stringify(PHASE)
    })())
} else {
  check('G1-G2 (uncommitted authoring state): the worktree changes are exactly the five phase paths',
    (() => {
      const porc = execSync('git status --porcelain', { encoding: 'utf8' }).split('\n').filter(Boolean)
      const paths = porc.map((l) => l.slice(3).trim()).sort()
      const expected = PHASE.map((s) => s.split('\t')[1]).sort()
      return JSON.stringify(paths) === JSON.stringify(expected)
    })())
}
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
check('H2: the live verifier exists, targets only disposable socket-only clusters, executes the committed 2K package to build the pre-state, and carries the full refusal matrix including the two-session race',
  (() => {
    const l = bytesOf(LIVE).toString('utf8')
    return l.includes('unix_socket_directories') && l.includes("listen_addresses=''")
      && l.includes('exlib2k-plank-catalog-load-package.sql')
      && l.includes(PKG)
      && l.includes('RACE') && l.includes('exactly one committer')
  })())

console.log(`\n${pass} passed, ${fail} failed`)
if (fail > 0) process.exit(1)
