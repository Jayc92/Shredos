// EXLIB-2R STATIC verification (LOCAL-ONLY): the prepared Plank
// PUBLICATION package, its preparation record, and the live suite,
// mechanically re-derived from the promoted sources.
//
// Proves: the promoted EXLIB-2Q evidence source (tag object, peel,
// tree, byte-exact annotation); every upstream authority byte-frozen;
// the package structure (ONE transaction, the eleven-table lock set,
// exactly ONE schema-qualified publish call captured into v_result
// with parsed 2-argument arity and ZERO unqualified/admission/review
// call sites, BOTH vector queries mechanically extracted in canonical
// order pinning the PRE vector once and the MOVED POST vector once,
// the complete admin-authority dance, the exact-JSONB call-block
// assertion with the derivable-retired-null reasoning, the atomic
// projection postconditions in BOTH directions, the review-event
// scoping, client function AND table denials, identity gates); every
// literal re-derived from the promoted artifact, the completed human
// forms, the SPENT 2K package's own loader literals, and the promoted
// EXLIB-2Q application record (the admission fingerprint and source
// sha this package REQUIRES intact, with the freshness recompute
// clause in both gates); the preparation record's bindings; the
// migration-derived publication contract (draft-only one-way,
// approved-only, complete-evidence, admitted-only, STALE-admission
// refusal, the sentinel-authorized atomic projection swap, the
// freeze trigger's structural publication gates, the one-published
// partial unique index, EXECUTE granted only to exlib_catalog_admin);
// the live suite's shape mechanically; two-state phase topology; and
// hygiene. Performs NO hosted contact and NO database work itself.
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

const PKG = 'docs/exlib2r-plank-publication-package.sql'
const RECORD = 'docs/exlib2r-plank-publication-prep-record.md'
const VERIFIER = 'scripts/verify-exlib2r.ts'
const LIVE = 'scripts/verify-exlib2r-live.sh'
const ARTIFACT = 'docs/exlib2g-plank-content.jsonl'
const FORM = 'docs/exlib2h-plank-content-review-form-completed.json'
const DB_FORM = 'docs/exlib2n-dead-bug-target-snapshot-review-form-completed.json'
const AW_FORM = 'docs/exlib2n-ab-wheel-rollout-target-snapshot-review-form-completed.json'
const PKG2K = 'docs/exlib2k-plank-catalog-load-package.sql'
const PKG2O = 'docs/exlib2o-target-snapshot-load-package.sql'
const PKG2P = 'docs/exlib2p-plank-database-review-package.sql'
const PKG2Q = 'docs/exlib2q-plank-import-admission-package.sql'
const REC2Q = 'docs/exlib2q-hosted-admission-application-record.md'
const MIG027 = 'supabase/migrations/027_exlib_catalog_content_schema.sql'
const MIG023 = 'supabase/migrations/023_exlib_catalog_and_delivery_contract.sql'
const SRC = '64640e9001c7e50b31319b7745dd87c68d1caa75'
const SRC_TREE = 'aca8b975d553cef734a6d3b54f8eef878b4f3fa5'
const SRC_TAG = 'exlib2q-hosted-admission-application-evidence-stable'
const SRC_TAG_OBJ = '2ff5a3744e6439782971c767fc4828068bcd42e8'
const SRC_TAG_MSG = 'EXLIB-2Q Plank hosted import-admission application evidence — ADMITTED — NOT PUBLISHED\n'
const PL = 'e21b2c00-0000-4000-a000-000000000001'
const CV = 'e21b2c00-0000-4000-a000-000000000101'
const DBU = 'e21b2c00-0000-4000-a000-000000000002'
const AW = 'e21b2c00-0000-4000-a000-000000000003'
const PRE_VECTOR = '3/3/5/3/6/1/2/0/0/0/0'
const POST_VECTOR = '3/3/5/3/6/1/2/2/0/0/0'
const PUB_SIG = 'uuid,uuid'
const ART_SHA = 'd82078490efa9ef13e128e7b7b742fbda8ea9e74e32382252d96c326c679d752'
const HOSTED_FP = '23976eedf2d59b66cdfa05cd660a414430feabef8906e1936cb24f541040de9e'
const CANON_ORDER = ['exercise_catalog_logical', 'exercise_catalog', 'exercise_catalog_muscles',
  'exercise_catalog_aliases', 'exercise_catalog_name_claims', 'exercise_catalog_content',
  'exercise_catalog_content_expected_relationships', 'exercise_catalog_relationships',
  'exercise_catalog_import_runs', 'exercise_catalog_run_items', 'exercise_catalog_review_events']
const FPS: Array<[string, number, string]> = [
  [ARTIFACT, 2928, ART_SHA],
  [FORM, 2389, '59ad2668790b6d0b135c8c453a702c45774f905ece8749a6112881b1df7e5b98'],
  [PKG2K, 29760, 'a1b6dd55850c5d544e2f484d1ce4833b41deec7f3dd4d4c2373cb3b50daaccf0'],
  [PKG2O, 39230, '4c0d74f942da4e92efab5923a435512c750c6d794077804ffeee8c0c305c966d'],
  [PKG2P, 37702, '76d1d67d6ec2bafc49ef43a6312700559cd9eeee4b8b9433868de9daf95dc666'],
  [PKG2Q, 39382, 'b15b9313db5efe679ca0d13cd0d9b9d97fd9316ec1d66d99c5bba6ca47529e57'],
  [REC2Q, 24193, '7b24c0ecb78977b829d589e341895e7eb8790513f55ef9c281a827f3829eab23'],
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
const rec2qSolid = read(REC2Q).replace(/\s+/g, '')
const lit = (text: string, tag: string): string | null => {
  const m = text.match(new RegExp(`\\$${tag}\\$([\\s\\S]*?)\\$${tag}\\$`))
  return m ? m[1] : null
}
const PHASE = [
  `A\t${PKG}`, `A\t${RECORD}`, `A\t${VERIFIER}`, `A\t${LIVE}`,
].sort()

console.log(`EXLIB-2R static verification (${committed ? 'committed' : 'uncommitted authoring'} state)`)

console.log('\nA. Promoted source and upstream freeze')
check('A1: the promoted EXLIB-2Q evidence tag is the exact annotated object, peels to the promoted source tip (ancestor of HEAD) whose tree is exact, with the byte-exact ADMITTED — NOT PUBLISHED annotation',
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
check('A2: every upstream authority is byte-frozen at its promoted fingerprint — the admitted artifact, the completed Plank human form, the SPENT 2K/2O/2P/2Q packages, the 2Q application record, and migration 027 — and each is blob-identical to the promoted source tip',
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
  && FPS.slice(0, 7).every(([, , s]) => pkg.includes(s)))
check('B2: ONE atomic transaction — exactly one BEGIN and one COMMIT, zero ROLLBACK statements (rollback is the failure path, never a statement)',
  (pkg.match(/^BEGIN;$/gm) || []).length === 1
  && (pkg.match(/^COMMIT;$/gm) || []).length === 1
  && !/^ROLLBACK/m.test(pkg))
check('B3: the LOCK statement serializes EXACTLY the eleven gated tables, alphabetically, in SHARE ROW EXCLUSIVE mode — the same tables the vectors count, the projection table included',
  (() => {
    const m = pkg.match(/LOCK TABLE([\s\S]*?)IN SHARE ROW EXCLUSIVE MODE;/)
    if (!m) return false
    const locked = (m[1].match(/public\.(\w+)/g) || []).map((s) => s.replace('public.', ''))
    const sorted = locked.slice().sort()
    return locked.length === 11
      && JSON.stringify(locked) === JSON.stringify(sorted)
      && JSON.stringify(locked.slice().sort()) === JSON.stringify(CANON_ORDER.slice().sort())
  })())
check('B4: exactly ONE SCHEMA-QUALIFIED public.publish_catalog_content call, captured into v_result inside the call block, with the parsed 2-argument arity, the qualified to_regprocedure precondition, ZERO unqualified call sites, and ZERO admission/review call sites',
  (() => {
    const calls = pkg.match(/v_result := public\.publish_catalog_content\(([\s\S]*?)\);/g)
    if (!calls || calls.length !== 1) return false
    const stripped = calls[0].replace(/\$[a-z0-9_]*\$[\s\S]*?\$[a-z0-9_]*\$/g, 'X')
    let depth = 0
    let args = 1
    for (const ch of stripped.slice(stripped.indexOf('(') + 1, stripped.lastIndexOf(')'))) {
      if (ch === '(') depth += 1
      else if (ch === ')') depth -= 1
      else if (ch === ',' && depth === 0) args += 1
    }
    if (args !== 2) return false
    if (!pkg.includes(`to_regprocedure('public.publish_catalog_content(${PUB_SIG})')`)) return false
    const unqual = (pkg.match(/(^|[^.a-zA-Z0-9_])publish_catalog_content\s*\(/gm) || [])
    if (unqual.length !== 0) return false
    return !/apply_content_review\s*\(/.test(pkg) && !/admit_catalog_content\s*\(/.test(pkg)
  })())
check('B5: BOTH vector-building queries are mechanically extracted, identical, in the canonical eleven-table order — the PRE gate pins the post-EXLIB-2Q vector ONCE and the POST gate pins the MOVED vector ONCE (a publication projects exactly the two relationship rows; the count change is deliberate and exact)',
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
    if ((pkg.match(new RegExp(`v_counts <> '${PRE_VECTOR.replace(/\//g, '\\/')}'`, 'g')) || []).length !== 1) return false
    return (pkg.match(new RegExp(`v_counts <> '${POST_VECTOR.replace(/\//g, '\\/')}'`, 'g')) || []).length === 1
  })())
check('B6: the authority dance is complete and structural — grantor-included ADMIN baseline gate, GRANT ... WITH SET TRUE INHERIT FALSE, the exact two-grantor proof BEFORE SET ROLE, SET ROLE/RESET ROLE bracketing the single call, the grantor-scoped REVOKE, and the restoration postcondition with pg_has_role SET false',
  pkgFlat.includes("r.rolname = 'exlib_catalog_admin' AND m.rolname = 'postgres' AND g.rolname = 'supabase_admin' AND am.admin_option AND NOT am.inherit_option AND NOT am.set_option")
  && pkg.includes('GRANT exlib_catalog_admin TO postgres WITH SET TRUE, INHERIT FALSE;')
  && pkgFlat.includes("g.rolname = 'postgres' AND NOT am.admin_option AND NOT am.inherit_option AND am.set_option")
  && pkg.includes('SET ROLE exlib_catalog_admin;')
  && pkg.includes('RESET ROLE;')
  && pkg.includes('REVOKE exlib_catalog_admin FROM postgres GRANTED BY postgres;')
  && pkgFlat.includes("pg_has_role('postgres', 'exlib_catalog_admin', 'SET')")
  && pkg.indexOf('SET ROLE exlib_catalog_admin;') < pkg.indexOf('v_result := public.publish_catalog_content(')
  && pkg.indexOf('v_result := public.publish_catalog_content(') < pkg.indexOf('RESET ROLE;'))
check('B7: the review-event SCOPING is enforced and disclosed — the package asserts ZERO Plank review events before, ZERO review events after, and carries the snapshot-scoped/trigger-internal derivation so "no event" reads as schema design, never as missing evidence',
  pkgFlat.includes('a Plank review event already exists; refusing')
  && pkgFlat.includes('a review event appeared; the snapshot-scoped log must stay empty under a publication')
  && pkgProse.includes('catalog_id references exercise_catalog(id)')
  && pkgProse.includes('pg_trigger_depth >= 2')
  && pkgProse.includes('writes ZERO rows there BY SCHEMA DESIGN'))
check('B8: ordinary clients stay locked out, function AND projection table — has_function_privilege is checked for anon, authenticated, AND service_role and has_table_privilege for anon AND authenticated on the protected projection, each in BOTH the preconditions and the postconditions (database publication is not product delivery)',
  (pkg.match(new RegExp(`has_function_privilege\\('(anon|authenticated|service_role)', 'public\\.publish_catalog_content\\(${PUB_SIG}\\)', 'EXECUTE'\\)`, 'g')) || []).length === 6
  && (pkg.match(/has_table_privilege\('(anon|authenticated)', 'public\.exercise_catalog_relationships', 'SELECT'\)/g) || []).length === 4)
check('B9: the dual-identity and non-superuser gates run before any authority change, and every gate failure message names the refusal',
  pkgFlat.includes("current_user <> 'postgres' OR session_user <> 'postgres'")
  && pkgFlat.includes('the invoker is a superuser')
  && pkg.indexOf("current_user <> 'postgres'") < pkg.indexOf('GRANT exlib_catalog_admin'))
check('B10: the call block asserts the ENTIRE returned JSONB by exact equality — all five fields (the two echoed arguments, retired null, content_version 1, projected_relationships 2), with the derivable-retired-null reasoning (exactly one content row, draft, so no published version can exist to retire), an IS DISTINCT FROM comparison, and the RAISE NOTICE display echo — fabricating no database-generated value',
  (() => {
    if (!pkgFlat.includes("'logical_id', 'e21b2c00-0000-4000-a000-000000000001'")) return false
    if (!pkgFlat.includes("'published', 'e21b2c00-0000-4000-a000-000000000101'")) return false
    if (!pkgFlat.includes("'retired', NULL")) return false
    if (!pkgFlat.includes("'content_version', 1")) return false
    if (!pkgFlat.includes("'projected_relationships', 2")) return false
    if (!pkgFlat.includes('IF v_result IS DISTINCT FROM jsonb_build_object(')) return false
    if (!pkg.includes("RAISE NOTICE 'exlib2r publication result: %', v_result;")) return false
    if (!pkgProse.includes('retired is provably NULL because the pre-state gate proves the identity carries EXACTLY ONE content row and it is a draft')) return false
    return pkgProse.includes('The returned JSONB contains NO database-generated value for Plank')
  })())
check('B11: the atomic-projection postconditions are complete — the whole-table count of exactly 2, the exact projected-set string for Plank, the set-equality proof in BOTH directions against the expected relationships, and the disclosed created_at non-gating (database defaults are never gated by value)',
  (() => {
    if (!pkgFlat.includes('(SELECT count(*) FROM public.exercise_catalog_relationships) <> 2')) return false
    if ((pkg.match(/'progression>e21b2c00-0000-4000-a000-000000000003,substitution>e21b2c00-0000-4000-a000-000000000002'/g) || []).length !== 2) return false
    if (!pkgFlat.includes('AND NOT EXISTS ( SELECT 1 FROM public.exercise_catalog_relationships r WHERE r.from_logical_id = NEW.logical_id'.replace('NEW.logical_id', `'${PL}'`))
      && !pkgFlat.includes(`WHERE e.content_id = '${CV}' AND NOT EXISTS ( SELECT 1 FROM public.exercise_catalog_relationships r`)) return false
    if (!pkgFlat.includes(`WHERE r.from_logical_id = '${PL}' AND NOT EXISTS ( SELECT 1 FROM public.exercise_catalog_content_expected_relationships e`)) return false
    return pkgProse.includes('created_at values are database defaults, deliberately not gated by value')
  })())

console.log('\nC. Literals re-derived from the promoted sources')
check('C1: the applied human tuple is VERBATIM in BOTH gates, the admission provenance this package requires intact equals the promoted evidence — the source sha equals a FRESH SHA-256 of the promoted artifact, the admission fingerprint literal equals the value the promoted EXLIB-2Q application record evidences (never hand-derived), BOTH gates demand the relational fresh-recompute equality, and admitted_at is present but deliberately never pinned to a calendar literal',
  (() => {
    if (lit(pkg, 'p_rev') !== 'Nick Tkacz' || lit(pkg, 'q_rev') !== 'Nick Tkacz') return false
    if (form.reviewer !== 'Nick Tkacz' || art.content_review.reviewer !== 'Nick Tkacz') return false
    if ((pkg.match(/TIMESTAMPTZ '2026-09-01T20:35:00-04:00'/g) || []).length !== 2) return false
    if (lit(pkg, 'p_rat') !== 'Everything looks correct' || lit(pkg, 'q_rat') !== 'Everything looks correct') return false
    if (form.rationale !== 'Everything looks correct' || art.content_review.rationale !== 'Everything looks correct') return false
    const artSha = sha256(ARTIFACT)
    if (artSha !== ART_SHA) return false
    if (lit(pkg, 'p_src') !== artSha || lit(pkg, 'q_src') !== artSha) return false
    if (lit(pkg, 'p_fp') !== HOSTED_FP || lit(pkg, 'q_fp') !== HOSTED_FP) return false
    if (!rec2qSolid.includes(HOSTED_FP)) return false
    if ((pkg.match(/c\.admitted_fingerprint = public\.exlib_content_admission_fingerprint\(c\.id\)/g) || []).length !== 2) return false
    if ((pkg.match(/c\.admitted_at IS NOT NULL/g) || []).length !== 2) return false
    if (pkgFlat.includes('c.admitted_at = CURRENT_DATE')) return false
    if (pkgFlat.includes('c.admitted_at = DATE ')) return false
    return pkgProse.includes('execution-date-dependent (CURRENT_DATE at admission time), so a lawful fixture cannot reproduce the hosted calendar value')
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
check('C3: the target-snapshot gates carry the adjudicated bindings — Dead bug/mobility at ...0002 and Ab wheel rollout/other at ...0003, forward AND reverse, with the human categories re-derived from the completed 2N forms — and the package states the pending pins are ITS OWN exactness requirement, not a function demand',
  (() => {
    const dbForm = JSON.parse(read(DB_FORM))
    const awForm = JSON.parse(read(AW_FORM))
    if (dbForm.snapshot_category_decision !== 'mobility' || awForm.snapshot_category_decision !== 'other') return false
    return pkgFlat.includes(`e.logical_id = '${DBU}' AND e.canonical_name = 'Dead bug' AND e.category = 'mobility'`)
      && pkgFlat.includes(`e.logical_id = '${AW}' AND e.canonical_name = 'Ab wheel rollout' AND e.category = 'other'`)
      && pkgFlat.includes(`WHERE e.canonical_name = 'Dead bug') <> 1`)
      && pkgFlat.includes(`WHERE e.canonical_name = 'Ab wheel rollout') <> 1`)
      && pkgFlat.includes(`<> '${DBU}'`) && pkgFlat.includes(`<> '${AW}'`)
      && pkgProse.includes('does NOT require target snapshots to be reviewed')
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
check('C5: the Plank anatomy, alias, claim, expected-relationship, and PROJECTED-relationship set strings are re-derived from the admitted artifact (sorted exactly as the package aggregates them; the projected-set string appears once as the expected pre-state and once as the projected post-state)',
  (() => {
    const anat = art.muscle_targets.map((m: { muscle: string; role: string }) => `${m.muscle}:${m.role}`).sort().join(',')
    if (!pkg.includes(`'${anat}'`)) return false
    const aliases = [...art.aliases].sort().join(',')
    if (!pkg.includes(`'${aliases}'`)) return false
    const claims = [`${art.proposed_canonical_name.toLowerCase()}=canonical`,
      ...art.aliases.map((a: string) => `${a.toLowerCase()}=alias`)].sort().join(',')
    if (!pkg.includes(`'${claims}'`)) return false
    const rels = [`progression>${AW}`, `substitution>${DBU}`].join(',')
    return (pkg.match(new RegExp(`'${rels}'`, 'g')) || []).length === 2
      && JSON.stringify(art.substitutions) === JSON.stringify(['Dead bug'])
      && JSON.stringify(art.progressions) === JSON.stringify(['Ab wheel rollout'])
  })())
check('C6: the content-identity and lifecycle pins are exact — content ...0101 under logical ...0001 version 1; the PRE-gate demands approved + the exact tuple + ADMITTED with the complete promoted admission surface + still draft + zero Plank projection; the POST-gate demands published with the admission surface UNCHANGED',
  pkgFlat.includes(`c.id = '${CV}' AND c.logical_id = '${PL}' AND c.content_version = 1`)
  && (pkgFlat.match(/c\.content_status = 'approved'/g) || []).length === 2
  && (pkgFlat.match(/c\.import_admitted = true/g) || []).length === 2
  && pkgFlat.includes("c.publication_status = 'draft'")
  && pkgFlat.includes("c.publication_status = 'published'")
  && pkgFlat.includes('a projected Plank relationship already exists'))

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
check('D2: the lifecycle distinction is explicit — human review done (2I), database review done (2P), admission done (2Q, hosted, evidenced), PUBLICATION prepared NOT performed, and DELIVERY ACTIVATION separately blocked — with publication and relationship projection derived as ONE ATOMIC act by schema design',
  recFlat.includes('human content review') && recFlat.includes('database content review')
  && recFlat.includes('import-eligibility admission')
  && recFlat.includes('PREPARED, NOT PERFORMED')
  && recFlat.includes('delivery activation') && recFlat.includes('remains separately blocked')
  && recFlat.includes('publish_catalog_content') && recFlat.includes('exlib_catalog_admin')
  && recFlat.includes('ONE ATOMIC act') && recFlat.includes('transaction-local sentinel'))
check('D3: publication-versus-delivery precision — the record states DATABASE PUBLICATION IS NOT PRODUCT DELIVERY with the mechanism (RLS with zero policies and zero client privileges; the tenant table and seed/inventory artifacts untouched), and never claims the exercise becomes visible in the application',
  recFlat.includes('DATABASE PUBLICATION IS NOT PRODUCT DELIVERY')
  && recFlat.includes('zero policies') && recFlat.includes('zero client privileges')
  && recFlat.includes('seed_link_compatible') && recFlat.includes('remains false')
  && !recFlat.includes('becomes visible in the app')
  && !recFlat.includes('visible to users'))
check('D4: the fingerprint-portability derivation is recorded — WHY the hosted-computed admission fingerprint is a lawful precondition literal (the manifest binds only portable state; the live suite proves the fixture reproduces it) while hosted surrogate snapshot UUIDs remain non-preconditions under the accepted fixture-portability rule',
  recFlat.includes('FINGERPRINT PORTABILITY') && recSolid.includes(HOSTED_FP)
  && recFlat.includes('binds NO hosted surrogate UUID and NO admission field')
  && recFlat.includes('deliberately NOT preconditions')
  && recFlat.includes('fixture-portability'))
check('D5: honesty and boundaries — ONE-USE not idempotent with the mechanical reason (the MOVED vector plus the draft gate), why this milestone changes NO hosted state, the derived contract (function, signature, caller role, draft-only one-way rule, STALE-admission refusal, the sentinel-authorized atomic swap, the structural freeze-trigger gates), the review-event derivation, and the complete dependency map',
  recFlat.includes('ONE-USE') && recFlat.includes('not idempotent')
  && recFlat.includes('changes no hosted state')
  && recFlat.includes('publish_catalog_content') && recFlat.includes(PUB_SIG)
  && recFlat.includes('only a draft can be published')
  && recFlat.includes('import admission is STALE')
  && recFlat.includes('exlib.relationship_projection_identity')
  && recFlat.includes('one-published partial unique index')
  && recFlat.includes('SNAPSHOT-scoped') && recFlat.includes('pg_trigger_depth')
  && recFlat.includes('SECURITY DEFINER'))

console.log('\nE. Migrations and the contract derivation')
check('E1: migrations remain exactly 001-027 with no 028 — the package lives under docs/, never under supabase/migrations/',
  (() => {
    const migs = readdirSync('supabase/migrations').filter((f) => /^\d{3}_.*\.sql$/.test(f)).sort()
    return migs.length === 27 && migs[26].startsWith('027_') && !migs.some((f) => f.startsWith('028'))
  })())
check('E2: the derived contract matches the migration bytes — publish_catalog_content with the exact 2-argument signature, SECURITY DEFINER, EXECUTE granted ONLY to exlib_catalog_admin with PUBLIC/anon/authenticated revoked, the draft-only refusal, the approved-only and complete-evidence and admitted-only gates, the STALE-admission refusal, the sentinel-authorized projection swap, the freeze trigger\'s structural publication gates (travel-alone, both-direction set equality, freshness), the projection-protection trigger, and the one-published partial unique index',
  (() => {
    const mig = read(MIG027)
    return mig.includes('CREATE OR REPLACE FUNCTION publish_catalog_content(')
      && mig.includes('GRANT EXECUTE ON FUNCTION publish_catalog_content(UUID, UUID) TO exlib_catalog_admin;')
      && mig.includes('REVOKE EXECUTE ON FUNCTION publish_catalog_content(UUID, UUID) FROM PUBLIC;')
      && mig.includes('only a draft can be published; re-publishing a published or retired version is rejected')
      && mig.includes('only approved content can be published')
      && mig.includes('incomplete review evidence')
      && mig.includes('content is not import-admitted; eligibility is a separate, explicitly approved act')
      && mig.includes('import admission is STALE')
      && mig.includes("set_config('exlib.relationship_projection_identity',")
      && mig.includes('a publication transition must travel alone')
      && mig.includes('a required relationship is missing at publication')
      && mig.includes('an unexpected relationship is present at publication')
      && mig.includes('exlib_protect_relationship_projection')
      && mig.includes('exercise_catalog_content_one_published_idx')
      && read(MIG023).includes('events are written only by the snapshot review transition trigger')
  })())

console.log('\nF. The live verifier, mechanically')
check('F1: the live verifier exists, targets only disposable socket-only clusters, builds the pre-state by executing the SPENT 2K, 2O, 2P, AND 2Q packages, proves FINGERPRINT PORTABILITY (the fixture recomputes the promoted hosted literal exactly), carries the full refusal matrix through checked fail-loud surgeries, proves the vector-gate one-use, the race, the same-signature search_path decoy with the call-block JSONB refusal on the hijacked copy, the wrong-grantor shared-catalog variant with restoration, and the FOUR-baseline cluster-wide containment section',
  (() => {
    const l = bytesOf(LIVE).toString('utf8')
    if (!l.includes('unix_socket_directories') || !l.includes("listen_addresses=''")) return false
    if (!l.includes('-f "$PKG2K"') || !l.includes('-f "$PKG2O"') || !l.includes('-f "$PKG2P"') || !l.includes('-f "$PKG2Q"')) return false
    if (!l.includes('FINGERPRINT PORTABILITY PROVEN')) return false
    if (!l.includes(`HOSTED_FP="${HOSTED_FP}"`)) return false
    if ((l.match(/^expect_pkg_refusal /gm) || []).length !== 17) return false
    if (!l.includes('HARNESS SURGERY FAILED')) return false
    if (!l.includes('not the exact admitted pre-publication state')) return false
    if (!l.includes('not the exact post-EXLIB-2Q hosted pre-state')) return false
    if (!l.includes('the returned JSONB is not the exact derivable result')) return false
    if (!l.includes('track_functions=all') || !l.includes('pg_stat_user_functions')) return false
    if (!l.includes('CREATE FUNCTION exlib2r_decoy.publish_catalog_content(')) return false
    if (!l.includes('ALTER DATABASE $V SET search_path = exlib2r_decoy, public')) return false
    if (!l.includes('POST_VECTOR="3/3/5/3/6/1/2/2/0/0/0"')) return false
    if (!l.includes('ROLE MEMBERSHIPS ARE CLUSTER-WIDE')) return false
    if (!l.includes('UPDATE pg_auth_members SET grantor=')) return false
    if (!l.includes('ALL FOUR cluster-wide role baselines')) return false
    if (!l.includes('=== I. Cluster-wide restoration and fixture containment')) return false
    return !/supabase\.co|vercel\./.test(l)
  })())
check('F2: the live one-use and race proofs key on the VECTOR gate — the script states why (a publication moves the count vector, unlike the review and admission packages) and greps for that refusal in both places',
  (() => {
    const l = bytesOf(LIVE).toString('utf8')
    return l.includes('a publication changes the count vector')
      && (l.match(/not the exact post-EXLIB-2Q hosted pre-state/g) || []).length >= 4
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
  check('G2: exact phase inventory — the range carries exactly the four disclosed additions (package, record, static verifier, live verifier)',
    (() => {
      const status = execSync(`git diff --name-status ${SRC}..HEAD`, { encoding: 'utf8' })
        .split('\n').filter(Boolean).sort()
      return JSON.stringify(status) === JSON.stringify(PHASE)
    })())
} else {
  check('G1-G2 (uncommitted authoring state): every worktree change lies inside the four phase paths — nothing outside this phase is touched',
    CHANGED.length > 0 && CHANGED.every((p) => PHASE_PATHS.includes(p)))
}
check('G3: two-state lifecycle — the package, record, and both verifiers are absent at the promoted source tip and present in this phase',
  (() => {
    const srcDocs = execSync(`git ls-tree ${SRC} docs/ --name-only`, { encoding: 'utf8' })
    const srcScripts = execSync(`git ls-tree ${SRC} scripts/ --name-only`, { encoding: 'utf8' })
    if (srcDocs.includes('exlib2r-')) return false
    if (srcScripts.includes('verify-exlib2r')) return false
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
check('H2: the frozen product surface is untouched — seed module, inventory, review ledger, package.json, and the batch artifacts are blob-identical to the promoted source tip — and the Plank inventory row stays seed_link_compatible false',
  (() => {
    for (const p of ['src/lib/supabase/seed-exercises.ts', 'docs/exlib2b-release1-inventory.jsonl',
      'docs/exlib1b1-review-ledger.jsonl', 'package.json',
      'docs/exlib2c-release1-batch02-content.jsonl', 'docs/exlib2c-release1-batch04-content.jsonl']) {
      const live = execSync(`git hash-object "${p}"`, { encoding: 'utf8' }).trim()
      const at = execSync(`git rev-parse "${SRC}:${p}"`, { encoding: 'utf8' }).trim()
      if (live !== at) return false
    }
    const inv = read('docs/exlib2b-release1-inventory.jsonl').split('\n')
      .filter((l) => l.trim() && !l.trim().startsWith('#')).map((l) => JSON.parse(l))
    const plank = inv.filter((r: { proposed_canonical_name: string; seed_link_compatible: boolean }) =>
      r.proposed_canonical_name === 'Plank')
    return plank.length === 1 && plank[0].seed_link_compatible === false
  })())

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
