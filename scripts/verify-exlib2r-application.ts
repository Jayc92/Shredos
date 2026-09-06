// EXLIB-2R hosted publication APPLICATION-EVIDENCE verifier
// (LOCAL-ONLY).
//
// Owns the executed-state posture: the reviewed Plank publication
// package (48,913 B / 96ade488...) was executed ONCE against hosted
// ShredOS by ChatGPT (never Claude) on 2026-09-06 UTC and committed.
// Proves: exact source refs and byte-frozen fingerprints; the
// execution facts pinned verbatim with ChatGPT attribution, the
// pre-execution recovery point, and the OPERATOR-EVIDENCE-WINDOW
// timing precision (no transport-return completion timestamp exists
// and none is invented); the TRANSPORT-RESULT precision (the SQL
// transport returned [] and surfaced no NOTICE — the package's
// internal JSONB assertion is cited as package-internal evidence
// proven by the committed transaction, never as observed output);
// the five-way evidence-source separation; the preflight preserved
// at its supplied scope with the preservation-scope boundary (no
// hosted snapshot UUID was supplied and none is recorded); the
// operator-confirmed post-state cross-checked against the executed
// package's OWN postconditions, the promoted admitted artifact, and
// the committed schema — the MOVED vector, the published row with
// counts 1/0/0, the intact admission surface with the
// admitted_at-by-schema-law attribution, the ATOMIC two-row
// projection with named directions and the no-swap proof; the
// review-event precision; the authority restoration with the
// three-way function denial and the ordinary-client table boundary;
// the hosted service_role observation held under its accepted
// bootstrap-dependent/non-gate interpretation; the advisor precision
// (observations, not changes; no invented advisor timestamp); the
// lifecycle distinction with delivery still separately gated;
// boundary freezes; and the lifecycle two-state check with the
// labeled retarget of the preparation suite's HEAD topology.
// Performs NO hosted contact: every fact here is read from committed
// files, the git object store, and the operator-authored record.
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

const RECORD = 'docs/exlib2r-hosted-publication-application-record.md'
const PACKAGE = 'docs/exlib2r-plank-publication-package.sql'
const PREP_RECORD = 'docs/exlib2r-plank-publication-prep-record.md'
const VERIFIER = 'scripts/verify-exlib2r-application.ts'
const RETARGETED = 'scripts/verify-exlib2r.ts'
const ARTIFACT = 'docs/exlib2g-plank-content.jsonl'
const FORM = 'docs/exlib2h-plank-content-review-form-completed.json'
const REC2Q = 'docs/exlib2q-hosted-admission-application-record.md'
const SOURCE_TIP = 'f36ba7545584a813db0fa5e1c7cb389852fca5ae'
const SOURCE_TREE = 'ef38c1af0647584158ee4b1f24dc969a17e4947f'
const TAG = 'exlib2r-plank-publication-prep-reviewed-not-executed'
const TAG_OBJ = 'aa599f1186cfaa6eec2d884c382ff147249478db'
const TAG_MSG = 'EXLIB-2R Plank publication package reviewed — PREPARED — NOT EXECUTED\n'
const PKG_SHA = '96ade4887320df83a3032fbb3afcf9566ecc4436276ebe6a54e2af07727f68de'
const ART_SHA = 'd82078490efa9ef13e128e7b7b742fbda8ea9e74e32382252d96c326c679d752'
const ADM_FP = '23976eedf2d59b66cdfa05cd660a414430feabef8906e1936cb24f541040de9e'
const PL = 'e21b2c00-0000-4000-a000-000000000001'
const CV = 'e21b2c00-0000-4000-a000-000000000101'
const DBU = 'e21b2c00-0000-4000-a000-000000000002'
const AW = 'e21b2c00-0000-4000-a000-000000000003'
const T_BACKUP = '2026-09-05 13:10:31 UTC'
const T_PREFLIGHT = '2026-09-06T01:37:28.618103Z'
const T_START = '2026-09-06T01:37:33.538691Z'
const T_UPDATED = '2026-09-06T01:37:42.223891Z'
const T_POSTPROOF = '2026-09-06T01:38:11.758568Z'
const LABEL = 'RETARGET (EXLIB-2R hosted-publication evidence)'
const PRE_VECTOR = '3/3/5/3/6/1/2/0/0/0/0'
const POST_VECTOR = '3/3/5/3/6/1/2/2/0/0/0'
const PUB_SIG = 'uuid,uuid'
const CANON_ORDER = ['exercise_catalog_logical', 'exercise_catalog', 'exercise_catalog_muscles',
  'exercise_catalog_aliases', 'exercise_catalog_name_claims', 'exercise_catalog_content',
  'exercise_catalog_content_expected_relationships', 'exercise_catalog_relationships',
  'exercise_catalog_import_runs', 'exercise_catalog_run_items', 'exercise_catalog_review_events']

const rec = read(RECORD)
const recFlat = rec.replace(/\s+/g, ' ')
const recSolid = rec.replace(/\s+/g, '')
const pkg = read(PACKAGE)
const pkgFlat = pkg.replace(/\s+/g, ' ')
const art = JSON.parse(read(ARTIFACT).split('\n').filter((l) => l.trim() && !l.trim().startsWith('#'))[0])
const frozenVsSource = (p: string): boolean =>
  execSync(`git hash-object "${p}"`, { encoding: 'utf8' }).trim() ===
  execSync(`git rev-parse "${SOURCE_TIP}:${p}"`, { encoding: 'utf8' }).trim()
const toInstant = (s: string): number => Date.parse(s.includes('T') ? s : s.replace(' UTC', 'Z').replace(' ', 'T'))

async function main(): Promise<void> {
  console.log('EXLIB-2R hosted-publication application-evidence verification (EXECUTED ONCE by ChatGPT; LOCAL-ONLY)')

  console.log('\nA. Source refs and byte-frozen fingerprints')
  {
    check('A1: exact source refs — the reviewed-not-executed tag is the exact annotated object with the byte-exact annotation, peels to the promoted EXLIB-2R tip (ancestor of HEAD) whose tree is exact',
      (() => {
        try {
          if (execSync(`git cat-file -t refs/tags/${TAG}`, { encoding: 'utf8' }).trim() !== 'tag') return false
          if (execSync(`git rev-parse refs/tags/${TAG}`, { encoding: 'utf8' }).trim() !== TAG_OBJ) return false
          if (execSync(`git rev-parse refs/tags/${TAG}^{}`, { encoding: 'utf8' }).trim() !== SOURCE_TIP) return false
          execSync(`git merge-base --is-ancestor ${SOURCE_TIP} HEAD`, { stdio: 'pipe' })
          if (execSync(`git rev-parse ${SOURCE_TIP}^{tree}`, { encoding: 'utf8' }).trim() !== SOURCE_TREE) return false
          const raw = execSync(`git cat-file tag refs/tags/${TAG}`, { encoding: 'utf8' })
          return raw.split('\n\n').slice(1).join('\n\n') === TAG_MSG
        } catch { return false }
      })())
    check('A2: the executed package is byte-UNCHANGED — worktree bytes are exactly 48,913 B with the reviewed SHA-256 and blob-identical to the promoted tip (any byte change would void the reviewed/executed status)',
      readFileSync(PACKAGE).length === 48913 && sha256(PACKAGE) === PKG_SHA &&
      frozenVsSource(PACKAGE))
    check('A3: the upstream authorities stay byte-frozen — the admitted artifact (with its exact reviewed SHA-256), the completed human form, the EXLIB-2R preparation record, the 2Q application record, and migration 027 — and the repository migration sequence is exactly 001-027 with no 028',
      (() => {
        if (sha256(ARTIFACT) !== ART_SHA) return false
        for (const p of [ARTIFACT, FORM, PREP_RECORD, REC2Q,
          'supabase/migrations/027_exlib_catalog_content_schema.sql']) {
          if (!frozenVsSource(p)) return false
        }
        const migs = readdirSync('supabase/migrations').filter((f) => /^\d{3}_.*\.sql$/.test(f)).sort()
        return migs.length === 27 && migs[26].startsWith('027_') && !migs.some((f) => f.startsWith('028'))
      })())
  }

  console.log('\nB. Execution facts pinned verbatim (attribution, evidence window, transport precision, preflight)')
  {
    check('B1: ChatGPT attribution is explicit and exclusive — executed by ChatGPT through the Joseph/ChatGPT-only path, NOT by Claude, against the ShredOS project ttybyljytiwntvorugcv ONLY with the exact project identity (ACTIVE_HEALTHY, PostgreSQL 17, 17.6.1.127), executed ONCE and COMMITTED with no retry and no partial replay',
      recFlat.includes('performed by ChatGPT, NOT by Claude') &&
      recFlat.includes('Claude made no hosted contact in this phase and never executes publication packages') &&
      recFlat.includes('Executed by: ChatGPT (the Joseph/ChatGPT-only execution path; never by Claude)') &&
      recFlat.includes('ShredOS Supabase project ttybyljytiwntvorugcv ONLY') &&
      recFlat.includes('name ShredOS, ref ttybyljytiwntvorugcv, status ACTIVE_HEALTHY, PostgreSQL engine 17, reported database version 17.6.1.127') &&
      recFlat.includes('executed ONCE and the transaction COMMITTED successfully, with no retry and no partial replay'))
    check('B2: OPERATOR-EVIDENCE-WINDOW timing precision — the executed revision, tag, byte count, SHA-256, backup, preflight instant, start marker, database-generated updated_at, and post-proof instant are all pinned; the ordering backup < preflight < start < updated_at < post-proof holds; the record names the first and last timestamps the operator evidence window, states NO transport-return completion timestamp exists and none is invented, and makes no "Execution finished:" claim; the package itself never references updated_at',
      (() => {
        if (!recSolid.includes(SOURCE_TIP) || !recSolid.includes(TAG) ||
          !recSolid.includes(TAG_OBJ) || !recSolid.includes(PKG_SHA)) return false
        if (!recFlat.includes('48,913 bytes')) return false
        if (!recFlat.includes(`physical backup at ${T_BACKUP}`)) return false
        if (!recFlat.includes('confirmed BEFORE execution')) return false
        if (!recFlat.includes(`preflight was observed at ${T_PREFLIGHT}`)) return false
        if (!recFlat.includes(`execution start marker was ${T_START}`)) return false
        if (!recFlat.includes(`independent post-proof was observed at ${T_POSTPROOF}`)) return false
        if (!recFlat.includes('operator evidence window')) return false
        if (!recFlat.includes('the transaction committed at some point inside it')) return false
        if (!recFlat.includes(`updated_at produced by the publication — ${T_UPDATED} — is the database-generated publication/projection row timestamp inside that window`)) return false
        if (!recFlat.includes('NO exact transport-return completion timestamp exists in the evidence, and none is invented here')) return false
        if (recFlat.includes('Execution finished:')) return false
        const b = toInstant(T_BACKUP); const p = toInstant(T_PREFLIGHT)
        const s = toInstant(T_START); const u = toInstant(T_UPDATED); const f = toInstant(T_POSTPROOF)
        return b < p && p < s && s < u && u < f && !pkg.includes('updated_at')
      })())
    check('B3: TRANSPORT-RESULT PRECISION (dedicated) — the record states the SQL transport returned [] with NO surfaced NOTICE, never presents the package\'s notice or JSONB as observed transport output, cites the internally-asserted value from the package bytes as package-internal evidence proven by the committed transaction, and names the committed transaction plus the independent post-state queries as the binding proof; the package really carries that notice line and that exact-equality assertion',
      (() => {
        if (!recFlat.includes('the SQL transport returned [] — zero result rows — and did NOT surface PostgreSQL NOTICE output')) return false
        if (!recFlat.includes('therefore NOT observed as transport output')) return false
        if (!recFlat.includes('this record does not present them as observed')) return false
        if (!recFlat.includes('proven as PACKAGE-INTERNAL evidence')) return false
        if (!recFlat.includes('any mismatch would have raised and rolled the whole transaction back')) return false
        if (!recFlat.includes('The COMMITTED TRANSACTION and the INDEPENDENT POST-STATE QUERIES (sections 4 onward) are the binding proof')) return false
        if (!recFlat.includes('cited in section 3 from the package bytes, never as observed output')) return false
        if (!recFlat.includes('was not carried back by the transport, so it is not evidence here')) return false
        // the record must NOT claim an observed echo (the 2P/2Q
        // observed-transport phrasings are forbidden here)
        if (recFlat.includes('The single SELECT echoed')) return false
        if (recFlat.includes('echoed the function')) return false
        if (recFlat.includes('is recorded verbatim')) return false
        // and the package really carries the notice + the assertion
        if (!pkg.includes("RAISE NOTICE 'exlib2r publication result: %', v_result;")) return false
        if (!pkgFlat.includes('IF v_result IS DISTINCT FROM jsonb_build_object(')) return false
        return pkgFlat.includes("'projected_relationships', 2")
      })())
    check('B4: the one-use posture and source separation are precise — NO migration-history entry, the sequence stays 001-027, the package is SPENT and must never be rerun, the second-run refusal is BOTH the vector gate and the draft clause (with the function\'s own non-draft refusal quoted from migration bytes), and the FIVE-way evidence-source split is explicit with the transport source contributing exactly the [] fact',
      recFlat.includes('it creates NO migration-history entry') &&
      recFlat.includes('remains exactly 001-027') &&
      recFlat.includes('ONE-USE by design and is now SPENT') &&
      recFlat.includes('must never be rerun') &&
      recFlat.includes('BOTH the vector gate (the eleven-term vector now carries the two projected rows) and the draft clause') &&
      recFlat.includes('"only a draft can be published; re-publishing a published or retired version is rejected"') &&
      read('supabase/migrations/027_exlib_catalog_content_schema.sql').includes('only a draft can be published; re-publishing a published or retired version is rejected') &&
      recFlat.includes('FIVE distinct sources') &&
      recFlat.includes('contributed exactly one fact: [] with no surfaced notices') &&
      recFlat.includes('Nothing from one source is presented as coming from another'))
    check('B5: the independent preflight is preserved at its SUPPLIED scope — observed-at instant, dual postgres identity + non-superuser, the exact admin-role baseline row, the pre-execution vector, approved/ADMITTED/draft with BOTH promoted digests, the zero counts, the 0/0 invariant, tenant 84, the complete-surfaces-preserved-operator-side statement, the PRESERVATION SCOPE (transcript not restated; NO hosted snapshot UUID supplied or recorded — mechanically enforced), and the PRECISION BOUNDARY keeping package-internal gates distinct',
      (() => {
        const s2start = rec.indexOf('## 2. The independent read-only preflight')
        const s2end = rec.indexOf('## 3.')
        if (s2start < 0 || s2end <= s2start) return false
        const s2 = rec.slice(s2start, s2end).replace(/\s+/g, ' ')
        if (!s2.includes(`preflight was observed at ${T_PREFLIGHT}`)) return false
        if (!s2.includes('current_user = postgres AND session_user = postgres; postgres is not a superuser')) return false
        if (!s2.includes('exactly one exlib_catalog_admin membership row — member postgres, grantor supabase_admin, ADMIN true, INHERIT false, SET false')) return false
        if (!s2.includes(`Pre-execution count vector, in package order: ${PRE_VECTOR}`)) return false
        if (!s2.includes('approved, ADMITTED, draft')) return false
        if (!s2.includes(ADM_FP) || !s2.includes(ART_SHA)) return false
        if (!s2.includes('exactly the promoted EXLIB-2Q evidence values')) return false
        if (!s2.includes('Zero projected relationships, zero review events, zero import runs, zero run items')) return false
        if (!s2.includes('0 orphaned / 0 unclaimed')) return false
        if (!s2.includes('Tenant exercises count: 84')) return false
        if (!s2.includes('preserved in the operator\'s execution evidence')) return false
        if (!s2.includes('PRESERVATION SCOPE')) return false
        if (!s2.includes('is not restated here')) return false
        if (!s2.includes('no hosted snapshot UUID was supplied to this milestone and none is recorded here')) return false
        // mechanical enforcement: the known hosted surrogates are absent
        // from the ENTIRE record (they were not supplied this time)
        for (const surrogate of ['ca566325-8d0d-4152-a15d-63baa065ac1d',
          '1ce09c1f-c13d-4231-8e12-6f35cfd761b5', 'c715d840-944b-4019-b984-1687accffcf4']) {
          if (recSolid.includes(surrogate)) return false
        }
        if (!s2.includes('PRECISION BOUNDARY')) return false
        return s2.includes('NOT independently queried by the preflight')
      })())
  }

  console.log('\nC. Post-execution state cross-checked against the package\'s own gates and the promoted sources')
  {
    check('C1: the recorded post-vector is the MOVED eleven-term value in the package\'s own mechanically-extracted order — both package queries identical and canonical, the package pins the pre-vector once and the post-vector once, the record lists every term in order, and the publication counts read published 1 / draft 0 / retired 0',
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
        if (JSON.stringify(a) !== JSON.stringify(orderOf(queries[1]))) return false
        if (JSON.stringify(a) !== JSON.stringify(CANON_ORDER)) return false
        if ((pkg.match(new RegExp(`v_counts <> '${PRE_VECTOR.replace(/\//g, '\\/')}'`, 'g')) || []).length !== 1) return false
        if ((pkg.match(new RegExp(`v_counts <> '${POST_VECTOR.replace(/\//g, '\\/')}'`, 'g')) || []).length !== 1) return false
        if (!recFlat.includes(`count vector was exactly ${POST_VECTOR}`)) return false
        if (!recFlat.includes('moved from the pre-state EXACTLY as a publication moves it')) return false
        const terms = POST_VECTOR.split('/').map(Number)
        const listed: string[] = []
        const lineRe = /^- (exercise_catalog[a-z_]*): (\d+)$/gm
        let lm: RegExpExecArray | null = lineRe.exec(rec)
        while (lm !== null) { listed.push(lm[1]); lm = lineRe.exec(rec) }
        if (JSON.stringify(listed) !== JSON.stringify(CANON_ORDER)) return false
        for (let i = 0; i < CANON_ORDER.length; i += 1) {
          if (!rec.includes(`- ${CANON_ORDER[i]}: ${terms[i]}`)) return false
        }
        return recFlat.includes('published 1, draft 0, retired 0') &&
          recFlat.includes('retired nothing (no published predecessor existed')
      })())
    check('C2: the published content row is exact with honest source attribution — publication_status published, the hosted updated_at recorded as the in-window database-generated timestamp, the admission fingerprint and source SHA independently observed unchanged at their promoted values, admitted_at unchanged attributed to SCHEMA LAW (travel-alone trigger) plus the package postcondition rather than to an independent observation, and payload/authorship/tuple unchanged',
      (() => {
        if (!recFlat.includes('publication_status = published')) return false
        if (!recFlat.includes(`Hosted updated_at after the publication: ${T_UPDATED}`)) return false
        if (!recSolid.includes(`admitted_fingerprint${ADM_FP}`) && !recFlat.includes(`admitted_fingerprint ${ADM_FP}`)) return false
        if (!recFlat.includes('both independently observed unchanged')) return false
        if (!recFlat.includes('admitted_at is unchanged BY SCHEMA LAW')) return false
        if (!recFlat.includes('the publication transition to travel alone')) return false
        if (!read('supabase/migrations/027_exlib_catalog_content_schema.sql').includes('a publication transition must travel alone')) return false
        if (!recFlat.includes('re-proven by the package\'s own postcondition (package-internal evidence)')) return false
        if (!pkgFlat.includes('c.admitted_at IS NOT NULL')) return false
        return recFlat.includes('payload, authorship, and the applied human-review tuple remained unchanged')
      })())
    check('C3: the ATOMIC PROJECTION is exact, directed, and unswapped — exactly two rows with the named directions (progression -> Ab wheel rollout ...0003, substitution -> Dead bug ...0002) matching the promoted artifact\'s sets, the explicit no-swap statement, the whole-table-holds-exactly-two statement, the both-direction package equality cited, and created_at deliberately not recorded by value',
      (() => {
        if (!recFlat.includes(`Plank ${PL} — progression -> Ab wheel rollout ${AW}`)) return false
        if (!recFlat.includes(`Plank ${PL} — substitution -> Dead bug ${DBU}`)) return false
        if (JSON.stringify(art.progressions) !== JSON.stringify(['Ab wheel rollout'])) return false
        if (JSON.stringify(art.substitutions) !== JSON.stringify(['Dead bug'])) return false
        if (!recFlat.includes('No swapped relationships exist')) return false
        if (!recFlat.includes('whole projection table holds exactly these two rows')) return false
        if (!recFlat.includes('projected-set equality in BOTH directions')) return false
        if (!pkgFlat.includes('projected-set equality failed in a direction')) return false
        return recFlat.includes('created_at values are database defaults, deliberately not gated or recorded by value')
      })())
    check('C4: REVIEW-EVENT PRECISION verbatim — zero events EXPECTED AND CORRECT, snapshot-scoped schema (catalog_id -> exercise_catalog(id), guard at depth >= 2), the publication audit is the one-way status machine plus the protected projection, no event invented, the zero is NOT missing evidence — and the package enforces zero at both ends',
      recFlat.includes('exercise_catalog_review_events remains exactly 0. This is EXPECTED AND CORRECT') &&
      recFlat.includes('SNAPSHOT-review scoped') &&
      recFlat.includes('catalog_id references exercise_catalog(id)') &&
      recFlat.includes('pg_trigger_depth >= 2') &&
      recFlat.includes('one-way publication_status machine plus the protected projection') &&
      recFlat.includes('No review event was invented or manually inserted') &&
      recFlat.includes('NOT missing evidence') &&
      pkgFlat.includes('a Plank review event already exists; refusing') &&
      pkgFlat.includes('a review event appeared; the snapshot-scoped log must stay empty under a publication'))
    check('C5: every unchanged surface is recorded — invariant 0/0, zero runs/items, tenant 84 unchanged, snapshots/anatomy/aliases/claims/expected unchanged (independently observed, with the package\'s digest neutrality cited), and the delivery surface untouched with the Plank inventory row still seed_link_compatible false (parsed from the frozen inventory)',
      (() => {
        if (!recFlat.includes('0 orphaned / 0 unclaimed')) return false
        if (!recFlat.includes('Import runs: 0. Run items: 0.')) return false
        if (!recFlat.includes('exactly 84 rows, unchanged')) return false
        if (!recFlat.includes('snapshots, anatomy, aliases, claims, and expected relationships remained unchanged')) return false
        if (!recFlat.includes('digest-identical between its two readings')) return false
        if (!recFlat.includes('remains seed_link_compatible false')) return false
        const inv = read('docs/exlib2b-release1-inventory.jsonl').split('\n')
          .filter((l) => l.trim() && !l.trim().startsWith('#')).map((l) => JSON.parse(l))
        const plank = inv.filter((r: { proposed_canonical_name: string; seed_link_compatible: boolean }) =>
          r.proposed_canonical_name === 'Plank')
        return plank.length === 1 && plank[0].seed_link_compatible === false
      })())
    check('C6: authority restoration and the denial posture are pinned — exactly one supabase_admin-granted membership t/f/f, the temporary SET row absent, pg_has_role SET false, the three-way function denial, the anon/authenticated table boundary, AND the hosted service_role table observation held under its accepted interpretation (observed FALSE; a platform-bootstrap-dependent fact; deliberately NOT a package gate; not converted into a schema guarantee or future precondition; the package still carries no service_role table gate)',
      recFlat.includes('Exactly ONE exlib_catalog_admin membership remains: member postgres, grantor supabase_admin, ADMIN TRUE, INHERIT FALSE, SET FALSE') &&
      recFlat.includes('The temporary postgres-granted SET membership is ABSENT') &&
      recFlat.includes("pg_has_role('postgres','exlib_catalog_admin','SET') = false") &&
      recFlat.includes('anon EXECUTE = false, authenticated EXECUTE = false, service_role EXECUTE = false on public.publish_catalog_content') &&
      recFlat.includes('SELECT on public.exercise_catalog_relationships = false for anon and authenticated') &&
      recFlat.includes('published version remains invisible to anon and authenticated') &&
      recFlat.includes('independently observed service_role\'s projection-table SELECT as FALSE on hosted') &&
      recFlat.includes('platform-bootstrap-dependent fact, deliberately NOT a package gate') &&
      recFlat.includes('does not convert it into a schema guarantee or a future precondition') &&
      recFlat.includes('No persistent authority widening occurred') &&
      pkg.includes('REVOKE exlib_catalog_admin FROM postgres GRANTED BY postgres;') &&
      (pkg.match(new RegExp(`has_function_privilege\\('(anon|authenticated|service_role)', 'public\\.publish_catalog_content\\(${PUB_SIG}\\)', 'EXECUTE'\\)`, 'g')) || []).length === 6 &&
      (pkg.match(/has_table_privilege\('service_role'/g) || []).length === 0)
  }

  console.log('\nD. Advisors, lifecycle distinction, and boundaries')
  {
    check('D1: advisor evidence precision — results captured as POST-EXECUTION OBSERVATIONS not changes, neither class claimed globally clean, the RLS-no-policy INFO posture preserved as intentional, broader pre-existing warnings unadjudicated and outside EXLIB-2R, nothing fixed during execution, and NO advisor timestamp invented (the advisor section carries no date-time value)',
      (() => {
        if (!recFlat.includes('captured as POST-EXECUTION OBSERVATIONS, not changes')) return false
        if (!recFlat.includes('Neither advisor class is claimed to be globally clean')) return false
        if (!recFlat.includes('no advisor finding was fixed during execution')) return false
        if (!recFlat.includes('INTENTIONAL deny-by-default posture')) return false
        if (!recFlat.includes('preserved precisely and not "fixed"')) return false
        if (!recFlat.includes('UNADJUDICATED and OUTSIDE EXLIB-2R')) return false
        const s9 = rec.slice(rec.indexOf('## 9. Hosted advisors'), rec.indexOf('## 10.'))
        return !/\d{4}-\d{2}-\d{2}/.test(s9)
      })())
    check('D2: the lifecycle distinction is held — human review done (2I), database review done (2P), admission done (2Q), PUBLICATION WITH ITS ATOMIC RELATIONSHIP PROJECTION DONE and evidenced HERE as one atomic act, and DELIVERY ACTIVATION NOT performed with DATABASE PUBLICATION IS NOT PRODUCT DELIVERY stated and the record approving nothing further',
      recFlat.includes('HUMAN content review — EXLIB-2I, done') &&
      recFlat.includes('HOSTED DATABASE CONTENT REVIEW — EXLIB-2P, done') &&
      recFlat.includes('IMPORT ELIGIBILITY ADMISSION — EXLIB-2Q, done') &&
      recFlat.includes('PUBLICATION WITH ITS ATOMIC RELATIONSHIP PROJECTION — THIS record\'s act') &&
      recFlat.includes('as ONE ATOMIC act, exactly once') &&
      recFlat.includes('DONE and evidenced here') &&
      recFlat.includes('DELIVERY ACTIVATION — NOT performed') &&
      recFlat.includes('DATABASE PUBLICATION IS NOT PRODUCT DELIVERY') &&
      recFlat.includes('This record itself approves NOTHING further'))
    check('D3: boundaries hold — the frozen product surface is blob-identical to the promoted tip (seed module, inventory, ledger, package.json, both batch artifacts), and the phase range through the anchored delivery-runtime predecessor touches only docs/ and scripts/verify-* paths (RETARGET (EXLIB-2T delivery-runtime preparation))',
      (() => {
        for (const p of ['src/lib/supabase/seed-exercises.ts', 'docs/exlib2b-release1-inventory.jsonl',
          'docs/exlib1b1-review-ledger.jsonl', 'package.json',
          'docs/exlib2c-release1-batch02-content.jsonl', 'docs/exlib2c-release1-batch04-content.jsonl']) {
          if (!frozenVsSource(p)) return false
        }
        // RETARGET (EXLIB-2T delivery-runtime preparation): the live-range
        // boundary is anchored at the delivery-runtime predecessor, where
        // this milestone's claim was and remains true.
        const range = execSync(`git diff --name-only ${SOURCE_TIP}..5f7e182f3027b3640514e06d642693f4018c03e2`, { encoding: 'utf8' })
          .split('\n').filter(Boolean)
        return !range.some((p) => !/^(docs\/|scripts\/verify-)/.test(p))
      })())
  }

  console.log('\nE. Lifecycle: the labeled retarget and the two-state application record')
  {
    check('E1: the preparation suite\'s HEAD topology is retargeted under the exact label — the label appears at least twice in scripts/verify-exlib2r.ts, the suite pins the promoted tip constant and its tree, its topology walks the TIP rather than HEAD, and the record documents the classification with unchanged committed-state totals (33/0)',
      (() => {
        const r = read(RETARGETED)
        if ((r.match(new RegExp(LABEL.replace(/[()]/g, '\\$&'), 'g')) ?? []).length < 2) return false
        if (!r.includes(`const TIP = '${SOURCE_TIP}'`)) return false
        if (!r.includes(`const TIP_TREE = '${SOURCE_TREE}'`)) return false
        if (!r.includes('rev-list --count ${SRC}..${TIP}')) return false
        return recFlat.includes(`label \`${LABEL}\``) &&
          recFlat.includes('the suite\'s totals are unchanged in the committed state (33/0)') &&
          recFlat.includes('byte-frozen history that remain true AS WRITTEN of their own phase')
      })())
    check('E2: the lifecycle two-state proof — the promoted tip\'s tree contains NO application record, and the live tree contains exactly this one',
      (() => {
        const tipDocs = execSync(`git ls-tree ${SOURCE_TIP} docs/ --name-only`, { encoding: 'utf8' })
        if (tipDocs.includes('exlib2r-hosted-publication-application-record')) return false
        const liveDocs = readdirSync('docs').filter((f) => f.includes('exlib2r-hosted-publication-application-record'))
        return liveDocs.length === 1 && liveDocs[0] === 'exlib2r-hosted-publication-application-record.md'
      })())
    check('E3: lifecycle-safe phase boundary — the phase adds exactly two paths (this record, this verifier) and modifies exactly the retargeted verify-exlib2r.ts; strict porcelain while uncommitted, adder-anchored once committed',
      (() => {
        try {
          const inHead = (() => {
            try { execSync(`git cat-file -e HEAD:${RECORD}`, { stdio: 'pipe' }); return true } catch { return false }
          })()
          const PHASE_NEW = [RECORD, VERIFIER].sort()
          if (!inHead) {
            const entries = execSync('git status --porcelain', { encoding: 'utf8' })
              .split('\n').filter(Boolean).map((l) => l.trim()).sort()
            const expected = [...PHASE_NEW.map((f) => `?? ${f}`), `M ${RETARGETED}`].sort()
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
          return JSON.stringify(range) === JSON.stringify([...PHASE_NEW, RETARGETED].sort())
        } catch { return false }
      })())
    check('E4: LOCAL-ONLY hygiene — neither the record nor this verifier contains a hosted endpoint URL, connection string, credential, or Supabase CLI remote command; the record carries no non-ASCII beyond the em-dash; and the record states Claude made no hosted contact',
      (() => {
        const self = read(VERIFIER)
        const both = rec + self
        // Forbidden tokens are assembled from split halves so this
        // suite's own source never contains them verbatim.
        const bads = [
          'supabase' + '.co', 'vercel' + '.', 'postgresql' + '://', 'postgres' + '://',
          'SUPABASE' + '_URL', 'SUPABASE' + '_SERVICE', 'api' + 'key', 'Bearer' + ' ', 'ey' + 'J',
          '--db' + '-url', '--lin' + 'ked', 'db ' + 'push',
        ]
        for (const bad of bads) {
          if (both.includes(bad)) return false
        }
        for (const ch of rec) {
          const c = ch.codePointAt(0) as number
          if (c > 127 && c !== 0x2014) return false
          if (c < 32 && ch !== '\n') return false
        }
        return recFlat.includes('Claude made no hosted contact in this phase')
      })())
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
