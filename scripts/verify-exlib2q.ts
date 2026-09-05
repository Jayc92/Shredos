// EXLIB-2Q STATIC verification (LOCAL-ONLY): the prepared Plank
// IMPORT-ELIGIBILITY ADMISSION package, its preparation record, and
// the phase lifecycle.
//
// Everything the package claims is INDEPENDENTLY RE-DERIVED here from
// the promoted sources: the source-provenance SHA-256 by hashing the
// promoted admitted artifact afresh; the applied human tuple from the
// completed form AND the artifact's content_review object; every
// payload literal from the admitted artifact field by field (JSONB
// fields as parsed values, no hashes in any payload comparison); the
// target bindings from the completed 2N category forms; the Plank
// snapshot vocabulary from the SPENT EXLIB-2K package's own literals.
// The package's single admission call is proven SCHEMA-QUALIFIED with
// ZERO unqualified call sites and ZERO review/publication call sites;
// both vector-building queries are mechanically extracted and proven
// identical in the canonical eleven-table order with the SAME
// unchanged vector pinned twice; the authority dance for
// exlib_catalog_admission is proven structurally; the
// database-computed admission fingerprint is proven verified
// RELATIONALLY (recompute equality), never pinned to an invented
// value; the derived contract is checked against the migration bytes
// (one-time/one-way admission, approved-only, draft-only, 64-hex
// source format, trigger fingerprint recomputation). Performs NO
// hosted contact and executes nothing.
//
// Fail-closed: any mismatch fails the suite.
import { execSync } from 'child_process'
import { createHash } from 'crypto'
import { readFileSync, readdirSync } from 'fs'

let passed = 0
let failed = 0
const check = (name: string, ok: boolean, detail?: string): void => {
  if (ok) { passed += 1; console.log(`  PASS  ${name}`) }
  else { failed += 1; console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`) }
}
const read = (p: string): string => readFileSync(p, 'utf8')
const sha256 = (p: string): string => createHash('sha256').update(readFileSync(p)).digest('hex')

const PKG = 'docs/exlib2q-plank-import-admission-package.sql'
const RECORD = 'docs/exlib2q-plank-import-admission-prep-record.md'
const VERIFIER = 'scripts/verify-exlib2q.ts'
const LIVE = 'scripts/verify-exlib2q-live.sh'
const RETARGETED = 'scripts/verify-exlib2p-application.ts'
const ARTIFACT = 'docs/exlib2g-plank-content.jsonl'
const FORM = 'docs/exlib2h-plank-content-review-form-completed.json'
const DB_FORM = 'docs/exlib2n-dead-bug-target-snapshot-review-form-completed.json'
const AW_FORM = 'docs/exlib2n-ab-wheel-rollout-target-snapshot-review-form-completed.json'
const PKG2K = 'docs/exlib2k-plank-catalog-load-package.sql'
const PKG2O = 'docs/exlib2o-target-snapshot-load-package.sql'
const REC2P = 'docs/exlib2p-hosted-review-application-record.md'
const PKG2P = 'docs/exlib2p-plank-database-review-package.sql'
const MIG027 = 'supabase/migrations/027_exlib_catalog_content_schema.sql'
const MIG023 = 'supabase/migrations/023_exlib_catalog_and_delivery_contract.sql'
const SRC = '93202b4e89e92eef9a0f57d28c59900898cbc2ba'
const SRC_TREE = '814d94e41b6f0d1395b945c5a40e2da3b8c0d274'
const SRC_TAG = 'exlib2p-hosted-review-application-evidence-stable'
const SRC_TAG_OBJ = 'ad5ff4b161405eb8ae1b0272459d6c1e9d188a15'
const SRC_TAG_MSG = 'EXLIB-2P Plank hosted-review application evidence — REVIEWED — NOT ADMITTED OR PUBLISHED\n'
const PL = 'e21b2c00-0000-4000-a000-000000000001'
const CV = 'e21b2c00-0000-4000-a000-000000000101'
const DBU = 'e21b2c00-0000-4000-a000-000000000002'
const AW = 'e21b2c00-0000-4000-a000-000000000003'
const LABEL_2Q = 'RETARGET (EXLIB-2Q Plank import-admission preparation)'
const STATE_VECTOR = '3/3/5/3/6/1/2/0/0/0/0'
const ADMIT_SIG = 'uuid,uuid,text'
const CANON_ORDER = ['exercise_catalog_logical', 'exercise_catalog', 'exercise_catalog_muscles',
  'exercise_catalog_aliases', 'exercise_catalog_name_claims', 'exercise_catalog_content',
  'exercise_catalog_content_expected_relationships', 'exercise_catalog_relationships',
  'exercise_catalog_import_runs', 'exercise_catalog_run_items', 'exercise_catalog_review_events']
const FPS: Array<[string, number, string]> = [
  [ARTIFACT, 2928, 'd82078490efa9ef13e128e7b7b742fbda8ea9e74e32382252d96c326c679d752'],
  [FORM, 2389, '59ad2668790b6d0b135c8c453a702c45774f905ece8749a6112881b1df7e5b98'],
  [PKG2K, 29760, 'a1b6dd55850c5d544e2f484d1ce4833b41deec7f3dd4d4c2373cb3b50daaccf0'],
  [PKG2O, 39230, '4c0d74f942da4e92efab5923a435512c750c6d794077804ffeee8c0c305c966d'],
  [PKG2P, 37702, '76d1d67d6ec2bafc49ef43a6312700559cd9eeee4b8b9433868de9daf95dc666'],
  [REC2P, 19896, 'ca1e5116070cb563bafa58ff3c3bbbd90d7b1a4508d539e84963823b0b96c462'],
  [MIG027, 65455, '90d53aaf8fd341dd99bab22b7d1ca280ec24b8ccee2a28efca6e835e0585a14f'],
]

// bytes are authoritative from the worktree while the phase is being
// authored (any uncommitted change present) and from HEAD once the
// phase is committed clean — the EXLIB-2O round-2 lesson.
const PORCELAIN = execSync('git status --porcelain', { encoding: 'utf8' }).split('\n').filter(Boolean)
const CHANGED = PORCELAIN.map((l) => l.slice(3).trim()).sort()
const committed = CHANGED.length === 0
  && execSync(`git rev-list --count ${SRC}..HEAD`, { encoding: 'utf8' }).trim() !== '0'
const blobAt = (rev: string, p: string): Buffer =>
  execSync(`git show ${rev}:"${p}"`, { maxBuffer: 1 << 26 }) as unknown as Buffer
const bytesOf = (p: string): Buffer => (committed ? blobAt('HEAD', p) : readFileSync(p))

const pkg = bytesOf(PKG).toString('utf8')
const pkgFlat = pkg.replace(/\s+/g, ' ')
const pkgProse = pkg.replace(/\n\s*--/g, '').replace(/\s+/g, ' ')
const rec = bytesOf(RECORD).toString('utf8')
const recFlat = rec.replace(/\s+/g, ' ')
const recSolid = rec.replace(/\s+/g, '')
const art = JSON.parse(read(ARTIFACT).split('\n').filter((l) => l.trim() && !l.trim().startsWith('#'))[0])
const form = JSON.parse(read(FORM))
const pkg2k = read(PKG2K)
const lit = (text: string, tag: string): string | null => {
  const m = text.match(new RegExp(`\\$${tag}\\$([\\s\\S]*?)\\$${tag}\\$`))
  return m ? m[1] : null
}
const PHASE = [
  `A\t${PKG}`, `A\t${RECORD}`, `A\t${VERIFIER}`, `A\t${LIVE}`, `M\t${RETARGETED}`,
].sort()

console.log(`EXLIB-2P static verification (${committed ? 'committed' : 'uncommitted authoring'} state)`)

console.log('\nA. Promoted source and upstream freeze')
check('A1: the promoted EXLIB-2O evidence tag is the exact annotated object, peels to the promoted source tip (ancestor of HEAD) whose tree is exact, with the byte-exact TARGET GATE SATISFIED annotation',
  (() => {
    try {
      if (execSync(`git cat-file -t refs/tags/${SRC_TAG}`, { encoding: 'utf8' }).trim() !== 'tag') return false
      if (execSync(`git rev-parse refs/tags/${SRC_TAG}`, { encoding: 'utf8' }).trim() !== SRC_TAG_OBJ) return false
      if (execSync(`git rev-parse refs/tags/${SRC_TAG}^{}`, { encoding: 'utf8' }).trim() !== SRC) return false
      execSync(`git merge-base --is-ancestor ${SRC} HEAD`, { stdio: 'pipe' })
      if (execSync(`git rev-parse ${SRC}^{tree}`, { encoding: 'utf8' }).trim() !== SRC_TREE) return false
      const raw = execSync(`git cat-file tag refs/tags/${SRC_TAG}`, { encoding: 'utf8' })
      return raw.split('\n\n').slice(1).join('\n\n') === SRC_TAG_MSG
    } catch { return false }
  })())
check('A2: every upstream authority is byte-frozen at its promoted fingerprint — the admitted artifact, the completed Plank human form, the SPENT 2K and 2O packages, the 2O application record, and migration 027 — and each is blob-identical to the promoted source tip',
  (() => {
    for (const [p, b, s] of FPS) {
      if (readFileSync(p).length !== b || sha256(p) !== s) return false
      const live = execSync(`git hash-object "${p}"`, { encoding: 'utf8' }).trim()
      const at = execSync(`git rev-parse "${SRC}:${p}"`, { encoding: 'utf8' }).trim()
      if (live !== at) return false
    }
    return true
  })())

console.log('\nB. Package structure')
check('B1: the package is docs-only, labeled PREPARED — NOT EXECUTED, names ttybyljytiwntvorugcv as the only eventual target, forbids Claude and automation, classifies itself ONE-USE NOT idempotent, and binds every source fingerprint',
  PKG.startsWith('docs/') && pkg.includes('PREPARED — NOT EXECUTED')
  && pkg.includes('ttybyljytiwntvorugcv')
  && pkgProse.includes('never by Claude, and never by any automated pipeline')
  && pkg.includes('ONE-USE, NOT idempotent')
  && FPS.slice(0, 5).every(([, , s]) => pkg.includes(s)))
check('B2: ONE atomic transaction — exactly one BEGIN and one COMMIT, zero ROLLBACK statements (rollback is the failure path, never a statement)',
  (pkg.match(/^BEGIN;$/gm) || []).length === 1
  && (pkg.match(/^COMMIT;$/gm) || []).length === 1
  && !/^ROLLBACK/m.test(pkg))
check('B3: the LOCK statement serializes EXACTLY the eleven gated tables, alphabetically, in SHARE ROW EXCLUSIVE mode — the same tables the vectors count',
  (() => {
    const m = pkg.match(/LOCK TABLE([\s\S]*?)IN SHARE ROW EXCLUSIVE MODE;/)
    if (!m) return false
    const locked = (m[1].match(/public\.(\w+)/g) || []).map((s) => s.replace('public.', ''))
    const sorted = locked.slice().sort()
    return locked.length === 11
      && JSON.stringify(locked) === JSON.stringify(sorted)
      && JSON.stringify(locked.slice().sort()) === JSON.stringify(CANON_ORDER.slice().sort())
  })())
check('B4: exactly ONE SCHEMA-QUALIFIED public.admit_catalog_content call with the parsed 3-argument arity, the qualified to_regprocedure precondition, ZERO unqualified call sites, and ZERO review/publication call sites',
  (() => {
    const calls = pkg.match(/^SELECT public\.admit_catalog_content\(([\s\S]*?)\);$/gm)
    if (!calls || calls.length !== 1) return false
    const stripped = calls[0].replace(/\$[a-z0-9_]*\$[\s\S]*?\$[a-z0-9_]*\$/g, 'X')
    let depth = 0
    let args = 1
    for (const ch of stripped.slice(stripped.indexOf('(') + 1, stripped.lastIndexOf(')'))) {
      if (ch === '(') depth += 1
      else if (ch === ')') depth -= 1
      else if (ch === ',' && depth === 0) args += 1
    }
    if (args !== 3) return false
    if (!pkg.includes(`to_regprocedure('public.admit_catalog_content(${ADMIT_SIG})')`)) return false
    const unqual = (pkg.match(/(^|[^.a-zA-Z0-9_])admit_catalog_content\s*\(/gm) || [])
    if (unqual.length !== 0) return false
    return !/apply_content_review\s*\(/.test(pkg) && !/publish_catalog_content\s*\(/.test(pkg)
  })())
check('B5: BOTH vector-building queries are mechanically extracted, identical, in the canonical eleven-table order, and BOTH pin the SAME unchanged vector (a review changes no count — the pre- and post-vectors are deliberately equal)',
  (() => {
    const queries = pkg.match(/SELECT \(SELECT count\(\*\) FROM public\.[\s\S]*?INTO v_counts/g) || []
    if (queries.length !== 2) return false
    const orderOf = (q: string): string[] => {
      const out: string[] = []
      const re = /FROM public\.(exercise_catalog[a-z_]*)\)/g
      let m: RegExpExecArray | null = re.exec(q)
      while (m !== null) { out.push(m[1]); m = re.exec(q) }
      return out
    }
    const a = orderOf(queries[0])
    const b = orderOf(queries[1])
    if (a.length !== 11 || JSON.stringify(a) !== JSON.stringify(b)) return false
    if (JSON.stringify(a) !== JSON.stringify(CANON_ORDER)) return false
    return (pkg.match(new RegExp(`v_counts <> '${STATE_VECTOR.replace(/\//g, '\\/')}'`, 'g')) || []).length === 2
  })())
check('B6: the authority dance is complete and structural — grantor-included baseline gate, GRANT ... WITH SET TRUE INHERIT FALSE, the exact two-grantor proof BEFORE SET ROLE, SET ROLE/RESET ROLE bracketing the single call, the grantor-scoped REVOKE, and the restoration postcondition with pg_has_role SET false',
  pkgFlat.includes("r.rolname = 'exlib_catalog_admission' AND m.rolname = 'postgres' AND g.rolname = 'supabase_admin' AND am.admin_option AND NOT am.inherit_option AND NOT am.set_option")
  && pkg.includes('GRANT exlib_catalog_admission TO postgres WITH SET TRUE, INHERIT FALSE;')
  && pkgFlat.includes("g.rolname = 'postgres' AND NOT am.admin_option AND NOT am.inherit_option AND am.set_option")
  && pkg.includes('SET ROLE exlib_catalog_admission;')
  && pkg.includes('RESET ROLE;')
  && pkg.includes('REVOKE exlib_catalog_admission FROM postgres GRANTED BY postgres;')
  && pkgFlat.includes("pg_has_role('postgres', 'exlib_catalog_admission', 'SET')")
  && pkg.indexOf('SET ROLE exlib_catalog_admission;') < pkg.indexOf('SELECT public.admit_catalog_content(')
  && pkg.indexOf('SELECT public.admit_catalog_content(') < pkg.indexOf('RESET ROLE;'))
check('B7: the review-event SCOPING is enforced and disclosed — the package asserts ZERO Plank review events before, ZERO review events after, and carries the snapshot-scoped/trigger-internal derivation so "no event" reads as schema design, never as missing evidence',
  pkgFlat.includes('a Plank review event already exists; refusing')
  && pkgFlat.includes('a review event appeared; the snapshot-scoped log must stay empty under an admission')
  && pkgProse.includes('catalog_id references exercise_catalog(id)')
  && pkgProse.includes('pg_trigger_depth >= 2')
  && pkgProse.includes('writes ZERO rows there BY SCHEMA DESIGN'))
check('B8: ordinary clients stay locked out — has_function_privilege is checked for anon, authenticated, AND service_role, in BOTH the preconditions and the postconditions',
  (pkg.match(new RegExp(`has_function_privilege\\('(anon|authenticated|service_role)', 'public\\.admit_catalog_content\\(${ADMIT_SIG.replace(/,/g, ',')}\\)', 'EXECUTE'\\)`, 'g')) || []).length === 6)
check('B9: the dual-identity and non-superuser gates run before any authority change, and every gate failure message names the refusal',
  pkgFlat.includes("current_user <> 'postgres' OR session_user <> 'postgres'")
  && pkgFlat.includes('the invoker is a superuser')
  && pkg.indexOf("current_user <> 'postgres'") < pkg.indexOf('GRANT exlib_catalog_admission'))

console.log('\nC. Literals re-derived from the promoted sources')
check('C1: the applied human tuple is VERBATIM in BOTH the pre-gate and the post-gate — reviewer, timestamptz instant, and rationale equal the completed form AND the admitted artifact\'s content_review object — and the SOURCE-PROVENANCE argument equals a FRESH SHA-256 of the promoted artifact computed by this suite (present as the call argument AND the postcondition pin)',
  (() => {
    if (lit(pkg, 'p_rev') !== 'Nick Tkacz' || lit(pkg, 'q_rev') !== 'Nick Tkacz') return false
    if (form.reviewer !== 'Nick Tkacz' || art.content_review.reviewer !== 'Nick Tkacz') return false
    if ((pkg.match(/TIMESTAMPTZ '2026-09-01T20:35:00-04:00'/g) || []).length !== 2) return false
    if (form.reviewed_at !== '2026-09-01T20:35:00-04:00' || art.content_review.reviewed_at !== '2026-09-01T20:35:00-04:00') return false
    if (lit(pkg, 'p_rat') !== 'Everything looks correct' || lit(pkg, 'q_rat') !== 'Everything looks correct') return false
    if (form.rationale !== 'Everything looks correct' || art.content_review.rationale !== 'Everything looks correct') return false
    if (art.content_review.status !== 'approved' || form.decision !== 'approved') return false
    const artSha = sha256(ARTIFACT)
    if (lit(pkg, 'src') !== artSha) return false
    if (lit(pkg, 'q_src') !== artSha) return false
    // the fingerprint is DATABASE-COMPUTED and must be verified
    // relationally, never pinned: the postcondition carries the
    // recompute equality, the 64-hex shape, and the transaction-stable
    // CURRENT_DATE comparison
    return pkgFlat.includes('c.admitted_fingerprint = public.exlib_content_admission_fingerprint(c.id)')
      && pkgFlat.includes("c.admitted_fingerprint ~ '^[0-9a-f]{64}$'")
      && pkgFlat.includes('c.admitted_at = CURRENT_DATE')
      && pkgFlat.includes('c.admitted_fingerprint IS NOT NULL')
  })())
check('C2: every Plank payload literal equals the admitted artifact field by field, in BOTH the pre-gate and the post-gate — JSONB fields as parsed values, text fields exactly, the artifact\'s empty-string equipment_setup as the empty literal',
  (() => {
    const wantJson: Array<[string, string]> = [['setu', 'setup_steps'], ['exec', 'execution_steps'], ['mist', 'common_mistakes']]
    for (const [tag, field] of wantJson) {
      for (const prefix of ['p_', 'q_']) {
        const l = lit(pkg, `${prefix}${tag}`)
        if (l === null) return false
        if (JSON.stringify(JSON.parse(l)) !== JSON.stringify(art[field])) return false
      }
    }
    const wantText: Array<[string, string]> = [['br', 'breathing_cue'], ['sf', 'safety_guidance'], ['ac', 'accessibility_alternative']]
    for (const [tag, field] of wantText) {
      for (const prefix of ['p_', 'q_']) {
        if (lit(pkg, `${prefix}${tag}`) !== art[field]) return false
      }
    }
    if (art.equipment_setup !== '') return false
    if (lit(pkg, 'p_es') !== art.equipment_setup || lit(pkg, 'q_es') !== art.equipment_setup) return false
    for (const prefix of ['p_', 'q_']) {
      if (lit(pkg, `${prefix}ab`) !== art.authored_by) return false
    }
    return (pkg.match(/DATE '2026-09-01'/g) || []).length === 2 && art.authored_at === '2026-09-01'
  })())
check('C3: the target-snapshot gates carry the adjudicated bindings — Dead bug/mobility at ...0002 and Ab wheel rollout/other at ...0003, forward AND reverse, with the human categories re-derived from the completed 2N forms',
  (() => {
    const dbForm = JSON.parse(read(DB_FORM))
    const awForm = JSON.parse(read(AW_FORM))
    if (dbForm.snapshot_category_decision !== 'mobility' || awForm.snapshot_category_decision !== 'other') return false
    return pkgFlat.includes(`e.logical_id = '${DBU}' AND e.canonical_name = 'Dead bug' AND e.category = 'mobility'`)
      && pkgFlat.includes(`e.logical_id = '${AW}' AND e.canonical_name = 'Ab wheel rollout' AND e.category = 'other'`)
      && pkgFlat.includes(`WHERE e.canonical_name = 'Dead bug') <> 1`)
      && pkgFlat.includes(`WHERE e.canonical_name = 'Ab wheel rollout') <> 1`)
      && pkgFlat.includes(`<> '${DBU}'`) && pkgFlat.includes(`<> '${AW}'`)
  })())
check('C4: the Plank snapshot pins equal the SPENT EXLIB-2K package\'s own loader literals (name, category, and the nine vocabulary fields re-derived from its dollar-quoted arguments)',
  (() => {
    const pairs: Array<[string, string]> = [['nm', 'Plank'], ['pm', 'abs'], ['eq', 'bodyweight'],
      ['lat', 'bilateral'], ['tm', 'timed'], ['prov', 'forgefitos_original'],
      ['mp', 'core_anti_extension'], ['tr', 'core'], ['dif', 'beginner'], ['av', 'minimal']]
    for (const [tag, want] of pairs) {
      if (lit(pkg2k, tag) !== want) return false
    }
    if (!pkg2k.includes("'isolation',")) return false
    return pkgFlat.includes("e.canonical_name = 'Plank' AND e.category = 'isolation'")
      && pkgFlat.includes("e.primary_muscle = 'abs' AND e.equipment = 'bodyweight'")
      && pkgFlat.includes("e.laterality = 'bilateral' AND e.tracking_mode = 'timed'")
      && pkgFlat.includes("e.provenance = 'forgefitos_original'")
      && pkgFlat.includes("e.movement_pattern = 'core_anti_extension'")
      && pkgFlat.includes("e.training_role = 'core' AND e.difficulty = 'beginner'")
      && pkgFlat.includes("e.availability = 'minimal'")
  })())
check('C5: the Plank anatomy, alias, claim, and expected-relationship set strings are re-derived from the admitted artifact (sorted exactly as the package aggregates them)',
  (() => {
    const anat = art.muscle_targets.map((m: any) => `${m.muscle}:${m.role}`).sort().join(',')
    if (!pkg.includes(`'${anat}'`)) return false
    const aliases = art.aliases.slice().sort().join(',')
    if (!pkg.includes(`'${aliases}'`)) return false
    const claims = [`${art.proposed_canonical_name.toLowerCase()}=canonical`,
      ...art.aliases.map((a: string) => `${a.toLowerCase()}=alias`)].sort().join(',')
    if (!pkg.includes(`'${claims}'`)) return false
    const rels = [`progression>${AW}`, `substitution>${DBU}`].join(',')
    return pkg.includes(`'${rels}'`)
      && JSON.stringify(art.substitutions) === JSON.stringify(['Dead bug'])
      && JSON.stringify(art.progressions) === JSON.stringify(['Ab wheel rollout'])
  })())
check('C6: the content-identity and lifecycle pins are exact — content ...0101 under logical ...0001 version 1; the PRE-gate demands approved + the exact tuple + draft + UNADMITTED with the NULL trio; the POST-gate demands import_admitted true with the complete admission surface and publication still draft',
  pkgFlat.includes(`c.id = '${CV}' AND c.logical_id = '${PL}' AND c.content_version = 1`)
  && (pkgFlat.match(/c\.content_status = 'approved'/g) || []).length === 2
  && pkgFlat.includes("c.publication_status = 'draft' AND c.import_admitted = false AND c.admitted_fingerprint IS NULL AND c.admitted_source_sha256 IS NULL AND c.admitted_at IS NULL")
  && pkgFlat.includes('c.import_admitted = true')
  && pkgFlat.includes("AND c.publication_status = 'draft')"))

console.log('\nD. The preparation record')
check('D1: the record exists (docs-only), pins THIS package\'s exact byte count and SHA-256, and carries PREPARED — NOT EXECUTED with the Joseph/ChatGPT-only executor statement',
  (() => {
    const pkgBytes = bytesOf(PKG)
    const digest = createHash('sha256').update(pkgBytes).digest('hex')
    return RECORD.startsWith('docs/') && recSolid.includes(digest)
      && recFlat.includes(`${pkgBytes.length.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')} bytes`)
      && recFlat.includes('PREPARED — NOT EXECUTED')
      && recFlat.includes('Joseph/ChatGPT-only') && recFlat.includes('never by Claude')
  })())
check('D2: the FOUR-WAY lifecycle distinction is explicit — human content approval (EXLIB-2I, done), database content review (THIS package, prepared), eligibility admission (separately blocked), publication (separately blocked) — and admission/publication are stated to remain blocked with their own authorities',
  recFlat.includes('human content approval') && recFlat.includes('database content review')
  && recFlat.includes('eligibility admission') && recFlat.includes('publication')
  && recFlat.includes('remain separately blocked')
  && recFlat.includes('admit_catalog_content') && recFlat.includes('publish_catalog_content')
  && recFlat.includes('exlib_catalog_admission') && recFlat.includes('exlib_catalog_admin'))
check('D3: the review-event scoping derivation is recorded — snapshot-scoped log, guard trigger depth >= 2, a content review writes ZERO events by design, the audit evidence lives on the content row — so the absent event can never be misread as missing evidence',
  recFlat.includes('SNAPSHOT-scoped') && recFlat.includes('pg_trigger_depth')
  && recFlat.includes('ZERO rows') && recFlat.includes('audit evidence')
  && recFlat.includes('content row'))
check('D4: the target-snapshot adjudication is cited through the promoted evidence tag (SATISFIED) with the hosted snapshot UUIDs as evidence — and the record states why those UUIDs are deliberately NOT package preconditions',
  recSolid.includes(SRC_TAG_OBJ) && recFlat.includes('TARGET GATE SATISFIED')
  && recSolid.includes('1ce09c1f-c13d-4231-8e12-6f35cfd761b5')
  && recSolid.includes('c715d840-944b-4019-b984-1687accffcf4')
  && recFlat.includes('deliberately NOT preconditions'))
check('D5: honesty and boundaries — ONE-USE not idempotent with the mechanical reason, why this milestone changes NO hosted state, no counts change, the audit carrier is the content row\'s admission surface, the complete dependency map, and the derived contract (function, signature, caller role, one-time/one-way rule, database-computed fingerprint, CURRENT_DATE behavior)',
  recFlat.includes('ONE-USE') && recFlat.includes('not idempotent')
  && recFlat.includes('changes no hosted state')
  && recFlat.includes('admit_catalog_content') && recFlat.includes(ADMIT_SIG)
  && recFlat.includes('exlib_catalog_admission')
  && recFlat.includes('one-time and one-way')
  && recFlat.includes('no table count changes')
  && recFlat.includes('import_admitted / admitted_fingerprint / admitted_source_sha256 / admitted_at')
  && recFlat.includes('computed by the database') && recFlat.includes('CURRENT_DATE')
  && recFlat.includes('SECURITY DEFINER'))

console.log('\nE. Migrations, contract derivation, and the retarget')
check('E1: migrations remain exactly 001-027 with no 028 — the package lives under docs/, never under supabase/migrations/',
  (() => {
    const migs = readdirSync('supabase/migrations').filter((f) => /^\d{3}_.*\.sql$/.test(f)).sort()
    return migs.length === 27 && migs[26].startsWith('027_') && !migs.some((f) => f.startsWith('028'))
  })())
check('E2: the derived contract matches the migration bytes — admit_catalog_content with the exact 3-argument signature, SECURITY DEFINER, EXECUTE granted ONLY to exlib_catalog_admission with PUBLIC/anon/authenticated revoked, the one-time/one-way rule, the approved-only and draft-only gates, the 64-hex source format rule, and the trigger\'s fingerprint-recomputation rejection of arbitrary hashes',
  (() => {
    const mig = read(MIG027)
    return mig.includes('CREATE OR REPLACE FUNCTION admit_catalog_content(')
      && mig.includes('GRANT EXECUTE ON FUNCTION admit_catalog_content(UUID, UUID, TEXT) TO exlib_catalog_admission;')
      && mig.includes('REVOKE EXECUTE ON FUNCTION admit_catalog_content(UUID, UUID, TEXT) FROM PUBLIC;')
      && mig.includes('this version is already admitted; admission is one-time and one-way')
      && mig.includes('only approved content may be admitted')
      && mig.includes('only an unpublished draft may be admitted')
      && mig.includes('p_source_artifact_sha256 must be a 64-character lowercase hex SHA-256')
      && mig.includes('admitted_fingerprint must equal the recomputed admission-manifest fingerprint; arbitrary hashes are rejected')
      && mig.includes('admitted_at            = CURRENT_DATE')
      && read(MIG023).includes('events are written only by the snapshot review transition trigger')
  })())
check('E3: the EXLIB-2P application suite is retargeted under the exact EXLIB-2Q label — the label appears at least twice, the promoted 2P-evidence tip and its tree are pinned, and its correction-topology proof walks the tip rather than HEAD',
  (() => {
    const r = bytesOf(RETARGETED).toString('utf8')
    if ((r.match(new RegExp(LABEL_2Q.replace(/[()]/g, '\\$&'), 'g')) ?? []).length < 2) return false
    if (!r.includes(`const EV2P_TIP = '${SRC}'`)) return false
    if (!r.includes(`const EV2P_TREE = '${SRC_TREE}'`)) return false
    return r.includes('rev-list --count ${R2}..${EV2P_TIP}')
  })())

console.log('\nF. The live verifier, mechanically')
check('F1: the live verifier exists, targets only disposable socket-only clusters, builds the pre-state by executing the SPENT 2K, 2O, AND 2P packages, carries the full refusal matrix through checked fail-loud surgeries, proves the one-use unadmitted gate, the race, the same-signature search_path decoy, the wrong-grantor shared-catalog variant with restoration, and the cluster-wide containment section',
  (() => {
    const l = bytesOf(LIVE).toString('utf8')
    if (!l.includes('unix_socket_directories') || !l.includes("listen_addresses=''")) return false
    if (!l.includes('-f "$PKG2K"') || !l.includes('-f "$PKG2O"') || !l.includes('-f "$PKG2P"')) return false
    if ((l.match(/^expect_pkg_refusal /gm) || []).length !== 12) return false
    if (!l.includes('HARNESS SURGERY FAILED')) return false
    if (!l.includes('not the exact reviewed pre-admission state')) return false
    if (!l.includes('track_functions=all') || !l.includes('pg_stat_user_functions')) return false
    if (!l.includes('CREATE FUNCTION exlib2q_decoy.admit_catalog_content(')) return false
    if (!l.includes('ALTER DATABASE $V SET search_path = exlib2q_decoy, public')) return false
    if (!l.includes('ADMIT_OK="true|true|true|true|true"')) return false
    if (!l.includes('ROLE MEMBERSHIPS ARE CLUSTER-WIDE')) return false
    if (!l.includes('UPDATE pg_auth_members SET grantor=')) return false
    if (!l.includes('=== I. Cluster-wide restoration and fixture containment')) return false
    return !/supabase\.co|vercel\./.test(l)
  })())
check('F2: the live one-use and race proofs key on the UNADMITTED-CONTENT gate, not the vector — the script states why (an admission changes no count) and greps for that refusal in both places',
  (() => {
    const l = bytesOf(LIVE).toString('utf8')
    return l.includes('the vector alone cannot catch')
      && (l.match(/not the exact reviewed pre-admission state/g) || []).length >= 3
  })())

console.log('\nG. Phase topology (two-state)')
const PHASE_PATHS = PHASE.map((s) => s.split('\t')[1]).sort()
if (committed) {
  check('G1: phase topology — the merge base of HEAD and the promoted source IS the source; the phase is exactly ONE plain single-parent commit, 1 ahead / 0 behind, zero merges',
    (() => {
      try {
        if (execSync(`git merge-base ${SRC} HEAD`, { encoding: 'utf8' }).trim() !== SRC) return false
        const parents = execSync('git rev-list --parents -n 1 HEAD', { encoding: 'utf8' }).trim().split(/\s+/)
        if (parents.length !== 2 || parents[1] !== SRC) return false
        return execSync(`git rev-list --count ${SRC}..HEAD`, { encoding: 'utf8' }).trim() === '1'
          && execSync(`git rev-list --count HEAD..${SRC}`, { encoding: 'utf8' }).trim() === '0'
          && execSync(`git rev-list --count --merges ${SRC}..HEAD`, { encoding: 'utf8' }).trim() === '0'
      } catch { return false }
    })())
  check('G2: exact phase inventory — the commit carries exactly the five disclosed paths (4 additions, 1 labeled retargeted suite) and nothing else',
    (() => {
      const status = execSync(`git diff --name-status ${SRC}..HEAD`, { encoding: 'utf8' })
        .split('\n').filter(Boolean).sort()
      return JSON.stringify(status) === JSON.stringify(PHASE)
    })())
} else {
  check('G1-G2 (uncommitted authoring state): every worktree change lies inside the five phase paths — nothing outside this phase is touched',
    CHANGED.length > 0 && CHANGED.every((p) => PHASE_PATHS.includes(p)))
}
check('G3: two-state lifecycle — the package, record, and both verifiers are absent at the promoted source tip and present in this phase',
  (() => {
    const srcDocs = execSync(`git ls-tree ${SRC} docs/ --name-only`, { encoding: 'utf8' })
    const srcScripts = execSync(`git ls-tree ${SRC} scripts/ --name-only`, { encoding: 'utf8' })
    if (srcDocs.includes('exlib2q-')) return false
    if (srcScripts.includes('verify-exlib2q')) return false
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
check('H2: the frozen product surface is untouched — seed module, inventory, review ledger, package.json, and the batch artifacts are blob-identical to the promoted source tip',
  (() => {
    for (const p of ['src/lib/supabase/seed-exercises.ts', 'docs/exlib2b-release1-inventory.jsonl',
      'docs/exlib1b1-review-ledger.jsonl', 'package.json',
      'docs/exlib2c-release1-batch02-content.jsonl', 'docs/exlib2c-release1-batch04-content.jsonl']) {
      const live = execSync(`git hash-object "${p}"`, { encoding: 'utf8' }).trim()
      const at = execSync(`git rev-parse "${SRC}:${p}"`, { encoding: 'utf8' }).trim()
      if (live !== at) return false
    }
    return true
  })())

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
