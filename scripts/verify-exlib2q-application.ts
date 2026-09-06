// EXLIB-2Q hosted import-admission APPLICATION-EVIDENCE verifier
// (LOCAL-ONLY).
//
// Owns the executed-state posture: the reviewed Plank import-admission
// package (39,382 B / b15b9313...) was executed ONCE against hosted
// ShredOS by ChatGPT (never Claude) on 2026-09-05 UTC and committed.
// Proves: exact source refs and byte-frozen fingerprints; the
// execution facts pinned verbatim with ChatGPT attribution, the
// pre-execution recovery point, and the OPERATOR-EVIDENCE-WINDOW
// timing precision (the final timestamp is the post-execution proof
// completion, never equated with the transaction's commit time); the
// returned JSONB bound to the package's own call arguments and the
// row postconditions; the admission fingerprint held as a HOSTED,
// DATABASE-GENERATED fact absent from the package's pinned literals
// and equal to the post-query recomputation; the independent preflight
// preserved COMPLETELY — including the exact payload and authorship
// values, cross-checked mechanically against the promoted admitted
// artifact — with the five-way evidence-source separation enforced;
// the operator-confirmed post-state cross-checked against the executed
// package's OWN postconditions, the completed human forms, the
// promoted EXLIB-2O and EXLIB-2P application records (the identical
// hosted snapshot UUIDs), and the committed schema; the review-event
// precision block (zero events is EXPECTED AND CORRECT under the
// snapshot-scoped schema); the grantor-included authority restoration
// with client denials; the advisor precision (no globally-clean
// claim, nothing silently fixed); the lifecycle distinction with
// publication/projection/delivery still separately gated; boundary
// freezes; and the lifecycle two-state check with the labeled
// retarget of the preparation suite's HEAD topology.
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

const RECORD = 'docs/exlib2q-hosted-admission-application-record.md'
const PACKAGE = 'docs/exlib2q-plank-import-admission-package.sql'
const PREP_RECORD = 'docs/exlib2q-plank-import-admission-prep-record.md'
const VERIFIER = 'scripts/verify-exlib2q-application.ts'
const RETARGETED = 'scripts/verify-exlib2q.ts'
const ARTIFACT = 'docs/exlib2g-plank-content.jsonl'
const FORM = 'docs/exlib2h-plank-content-review-form-completed.json'
const REC2O = 'docs/exlib2o-hosted-load-application-record.md'
const REC2P = 'docs/exlib2p-hosted-review-application-record.md'
const PKG2O = 'docs/exlib2o-target-snapshot-load-package.sql'
const SOURCE_TIP = 'ed9f5aa9f176f4d5a38df134f664da85d7674270'
const SOURCE_TREE = '57bdc247c4cc8cdd2f220b2ae509341d79dce2a4'
const TAG = 'exlib2q-plank-import-admission-prep-reviewed-not-executed'
const TAG_OBJ = 'e87526c52e2854df0d2d3baaeb87e0c6e92c49f0'
const TAG_MSG = 'EXLIB-2Q Plank import-admission package reviewed — PREPARED — NOT EXECUTED\n'
const PKG_SHA = 'b15b9313db5efe679ca0d13cd0d9b9d97fd9316ec1d66d99c5bba6ca47529e57'
const ART_SHA = 'd82078490efa9ef13e128e7b7b742fbda8ea9e74e32382252d96c326c679d752'
const ADM_FP = '23976eedf2d59b66cdfa05cd660a414430feabef8906e1936cb24f541040de9e'
const PL = 'e21b2c00-0000-4000-a000-000000000001'
const CV = 'e21b2c00-0000-4000-a000-000000000101'
const DBU = 'e21b2c00-0000-4000-a000-000000000002'
const AW = 'e21b2c00-0000-4000-a000-000000000003'
const PL_SNAP = 'ca566325-8d0d-4152-a15d-63baa065ac1d'
const DB_SNAP = '1ce09c1f-c13d-4231-8e12-6f35cfd761b5'
const AW_SNAP = 'c715d840-944b-4019-b984-1687accffcf4'
const T_BACKUP = '2026-09-04 13:09:27 UTC'
const T_PREFLIGHT = '2026-09-05 17:56:02.541021 UTC'
const T_START = '2026-09-05 17:56:20.797012 UTC'
const T_UPDATED = '2026-09-05 17:56:32.572174 UTC'
const T_POSTPROOF = '2026-09-05 17:56:58.256852 UTC'
const T_PRE_UPDATED = '2026-09-05 03:14:36.146071 UTC'
const LABEL = 'RETARGET (EXLIB-2Q hosted-admission evidence)'
const STATE_VECTOR = '3/3/5/3/6/1/2/0/0/0/0'
const ADMIT_SIG = 'uuid,uuid,text'
const CANON_ORDER = ['exercise_catalog_logical', 'exercise_catalog', 'exercise_catalog_muscles',
  'exercise_catalog_aliases', 'exercise_catalog_name_claims', 'exercise_catalog_content',
  'exercise_catalog_content_expected_relationships', 'exercise_catalog_relationships',
  'exercise_catalog_import_runs', 'exercise_catalog_run_items', 'exercise_catalog_review_events']
// RETARGET (EXLIB-2S delivery-activation preparation): the Plank
// delivery activation legitimately changes the seed module and the
// inventory Plank row AFTER this suite's own milestone; this suite's
// seed/inventory claims and its live-range boundary are therefore
// anchored to the promoted EXLIB-2R evidence tip (the
// delivery-activation predecessor), where they were and remain true.
// Assertion strength is unchanged: the bytes at the anchor are
// exactly what the live bytes were before the delivery activation.
const DELIVERY_PRED = '5f7e182f3027b3640514e06d642693f4018c03e2'

const rec = read(RECORD)
const recFlat = rec.replace(/\s+/g, ' ')
const recSolid = rec.replace(/\s+/g, '')
const pkg = read(PACKAGE)
const pkgFlat = pkg.replace(/\s+/g, ' ')
const art = JSON.parse(read(ARTIFACT).split('\n').filter((l) => l.trim() && !l.trim().startsWith('#'))[0])
const form = JSON.parse(read(FORM))
const lit = (tag: string): string | null => {
  const m = pkg.match(new RegExp(`\\$${tag}\\$([\\s\\S]*?)\\$${tag}\\$`))
  return m ? m[1] : null
}
const frozenVsSource = (p: string): boolean =>
  execSync(`git hash-object "${p}"`, { encoding: 'utf8' }).trim() ===
  execSync(`git rev-parse "${SOURCE_TIP}:${p}"`, { encoding: 'utf8' }).trim()
const toInstant = (s: string): number => Date.parse(s.replace(' UTC', 'Z').replace(' ', 'T'))

async function main(): Promise<void> {
  console.log('EXLIB-2Q hosted-admission application-evidence verification (EXECUTED ONCE by ChatGPT; LOCAL-ONLY)')

  console.log('\nA. Source refs and byte-frozen fingerprints')
  {
    check('A1: exact source refs — the reviewed-not-executed tag is the exact annotated object with the byte-exact annotation, peels to the promoted EXLIB-2Q tip (ancestor of HEAD) whose tree is exact',
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
    check('A2: the executed package is byte-UNCHANGED — worktree bytes are exactly 39,382 B with the reviewed SHA-256 and blob-identical to the promoted tip (any byte change would void the reviewed/executed status)',
      readFileSync(PACKAGE).length === 39382 && sha256(PACKAGE) === PKG_SHA &&
      frozenVsSource(PACKAGE))
    check('A3: the upstream authorities stay byte-frozen — the admitted artifact (with its exact reviewed SHA-256), the completed human form, the preparation record, the 2O and 2P application records, the 2O package, and migration 027 — and the repository migration sequence is exactly 001-027 with no 028',
      (() => {
        if (sha256(ARTIFACT) !== ART_SHA) return false
        for (const p of [ARTIFACT, FORM, PREP_RECORD, REC2O, REC2P, PKG2O,
          'supabase/migrations/027_exlib_catalog_content_schema.sql']) {
          if (!frozenVsSource(p)) return false
        }
        const migs = readdirSync('supabase/migrations').filter((f) => /^\d{3}_.*\.sql$/.test(f)).sort()
        return migs.length === 27 && migs[26].startsWith('027_') && !migs.some((f) => f.startsWith('028'))
      })())
  }

  console.log('\nB. Execution facts pinned verbatim (operator attribution, evidence window, preflight, JSONB)')
  {
    check('B1: ChatGPT attribution is explicit and exclusive — executed by ChatGPT through the Joseph/ChatGPT-only path, NOT by Claude, against the ShredOS project ttybyljytiwntvorugcv ONLY with the exact project identity (ACTIVE_HEALTHY, PostgreSQL 17, 17.6.1.127), executed ONCE and COMMITTED with no retry and no partial replay',
      recFlat.includes('performed by ChatGPT, NOT by Claude') &&
      recFlat.includes('Claude made no hosted contact in this phase and never executes admission packages') &&
      recFlat.includes('Executed by: ChatGPT (the Joseph/ChatGPT-only execution path; never by Claude)') &&
      recFlat.includes('ShredOS Supabase project ttybyljytiwntvorugcv ONLY') &&
      recFlat.includes('name ShredOS, ref ttybyljytiwntvorugcv, status ACTIVE_HEALTHY, PostgreSQL engine 17, reported database version 17.6.1.127') &&
      recFlat.includes('executed ONCE and the transaction COMMITTED successfully, with no retry and no partial replay'))
    check('B2: OPERATOR-EVIDENCE-WINDOW timing precision — the executed revision, tag, byte count, SHA-256, backup, start marker, database-generated updated_at, and post-proof completion are all pinned; the ordering backup < preflight < start < updated_at < post-proof holds; the record names the first and last timestamps THE OPERATOR EVIDENCE WINDOW and never equates the final timestamp with the transaction\'s commit time (no "Execution finished:" claim exists)',
      (() => {
        if (!recSolid.includes(SOURCE_TIP) || !recSolid.includes(TAG) ||
          !recSolid.includes(TAG_OBJ) || !recSolid.includes(PKG_SHA)) return false
        if (!recFlat.includes('39,382 bytes')) return false
        if (!recFlat.includes(`physical backup at ${T_BACKUP}`)) return false
        if (!recFlat.includes('confirmed BEFORE execution')) return false
        if (!recFlat.includes(`pre-execution/start marker was ${T_START}`)) return false
        if (!recFlat.includes(`post-execution proof query completed at ${T_POSTPROOF}`)) return false
        if (!recFlat.includes('OPERATOR EVIDENCE WINDOW')) return false
        if (!recFlat.includes('NOT the transaction\'s exact commit timestamp')) return false
        if (!recFlat.includes('the transaction committed at some point inside the window')) return false
        if (!recFlat.includes(`updated_at produced by the admission — ${T_UPDATED} — is the database-generated row timestamp inside that window`)) return false
        if (recFlat.includes('Execution finished:')) return false
        const b = toInstant(T_BACKUP); const p = toInstant(T_PREFLIGHT)
        const s = toInstant(T_START); const u = toInstant(T_UPDATED); const f = toInstant(T_POSTPROOF)
        return b < p && p < s && s < u && u < f && f - s < 60_000 && !pkg.includes('updated_at')
      })())
    check('B3: the one-use posture is precise — NO migration-history entry, the sequence stays 001-027, the package is SPENT and must never be rerun, the second-run refusal is the pre-admission-state gate (NO LONGER UNADMITTED, with the package\'s exact refusal text and the function\'s one-time-and-one-way refusal both real), the FIVE-way evidence-source separation is explicit, and the byte-frozen "no longer pending" comment imprecision is DISCLOSED (quoted exactly once) rather than repeated as a claim',
      (() => {
        if (!recFlat.includes('it creates NO migration-history entry')) return false
        if (!recFlat.includes('remains exactly 001-027')) return false
        if (!recFlat.includes('ONE-USE by design and is now SPENT')) return false
        if (!recFlat.includes('must never be rerun')) return false
        if (!recFlat.includes('the content row is NO LONGER UNADMITTED')) return false
        if (!recFlat.includes('"not the exact reviewed pre-admission state"')) return false
        if (!pkgFlat.includes('not the exact reviewed pre-admission state')) return false
        if (!recFlat.includes('"admission is one-time and one-way"')) return false
        if (!pkgFlat.includes('admission is one-time and one-way')) return false
        if (!recFlat.includes('FIVE distinct sources')) return false
        if (!recFlat.includes('Nothing from one source is presented as coming from another')) return false
        // the disclosure: the frozen comment really says it (read
        // across its wrapped comment lines), the record quotes it
        // exactly once, names it EXLIB-2P-skeleton phrasing, and
        // asserts the bytes stay unmodified (A2 proves they did)
        const pkgProse = pkg.replace(/\n\s*--/g, '').replace(/\s+/g, ' ')
        if (!pkgProse.includes('refuses at the pre-state gate (the content row is no longer pending)')) return false
        if (!recFlat.includes('BYTE-FROZEN PROSE IMPRECISION')) return false
        if ((recFlat.match(/the content row is no longer pending/g) || []).length !== 1) return false
        if (!recFlat.includes('EXLIB-2P-skeleton phrasing')) return false
        if (!recFlat.includes('it changes no lock, gate, or refusal')) return false
        return recFlat.includes('disclosed here rather than modified')
      })())
    check('B4: the returned JSONB is recorded verbatim and every field is bound — admitted carries the content UUID and logical_id its identity (the package\'s own two UUID call arguments), content_version 1, admitted_source_sha256 equals the package\'s third argument AND a fresh SHA-256 of the promoted artifact, and admitted_fingerprint equals the recorded post-state value',
      (() => {
        if (!recFlat.includes(`admitted: ${CV}`)) return false
        if (!recFlat.includes(`logical_id: ${PL}`)) return false
        if (!recFlat.includes('content_version: 1')) return false
        if (!recSolid.includes(`admitted_fingerprint:${ADM_FP}`)) return false
        if (!recSolid.includes(`admitted_source_sha256:${ART_SHA}`)) return false
        if (!pkg.includes(`'${PL}',`) || !pkg.includes(`'${CV}',`)) return false
        if (lit('src') !== ART_SHA) return false
        if (lit('q_src') !== ART_SHA) return false
        if (sha256(ARTIFACT) !== ART_SHA) return false
        return recFlat.includes('the echo is display-only evidence and the row postconditions are the binding proof')
      })())
    check('B5: the independent preflight is preserved COMPLETELY — observed-at instant, dual postgres identity + non-superuser, the exact admission-role baseline row, the pre-execution vector, the complete approved-and-unadmitted content row (exact human tuple, NULL admission trio, and the prior hosted updated_at equal to the promoted 2P record\'s value), the 0/0 invariant, all three client denials on public.admit_catalog_content, tenant 84, the inverted PRESERVATION SCOPE (values supplied this time and preserved; no additional preflight fact claimed), and the PRECISION BOUNDARY keeping package-internal gates distinct',
      (() => {
        const s2start = rec.indexOf('## 2. The independent read-only preflight')
        const s2end = rec.indexOf('## 3.')
        if (s2start < 0 || s2end <= s2start) return false
        const s2 = rec.slice(s2start, s2end).replace(/\s+/g, ' ')
        if (!s2.includes(`observed at ${T_PREFLIGHT}`)) return false
        if (!s2.includes('independent ChatGPT query source, distinct from the package-internal gates and from the post-execution queries')) return false
        if (!s2.includes('current_user = postgres AND session_user = postgres; postgres is not a superuser')) return false
        if (!s2.includes('exactly one exlib_catalog_admission membership row — member postgres, grantor supabase_admin, ADMIN true, INHERIT false, SET false')) return false
        if (!s2.includes(`Pre-execution count vector, in package order: ${STATE_VECTOR}`)) return false
        if (!s2.includes('content_status = approved, reviewed_by = Nick Tkacz')) return false
        if (!s2.includes('reviewed_at = 2026-09-02 00:35:00 UTC (exactly the same instant as 2026-09-01T20:35:00-04:00)')) return false
        if (Date.parse('2026-09-02T00:35:00Z') !== Date.parse('2026-09-01T20:35:00-04:00')) return false
        if (!s2.includes('review_rationale = Everything looks correct')) return false
        if (!s2.includes('import_admitted = false, admitted_fingerprint null, admitted_source_sha256 null, admitted_at null')) return false
        if (!s2.includes(`updated_at = ${T_PRE_UPDATED}`)) return false
        if (!read(REC2P).replace(/\s+/g, ' ').includes(`Hosted updated_at after the review: ${T_PRE_UPDATED}`)) return false
        if (!s2.includes('0 orphaned / 0 unclaimed')) return false
        if (!s2.includes('anon, authenticated, and service_role could each NOT execute public.admit_catalog_content')) return false
        if (!s2.includes('Tenant exercises count: 84')) return false
        if (!s2.includes('PRESERVATION SCOPE')) return false
        if (!s2.includes('WERE supplied in this execution evidence and ARE preserved verbatim below')) return false
        if (!s2.includes('No additional preflight fact is claimed')) return false
        if (!s2.includes('PRECISION BOUNDARY')) return false
        if (!s2.includes('were NOT independently queried by the preflight')) return false
        if (!s2.includes('the reverse target bindings, the transition-neutrality digest comparisons, the two-grantor structural authority proof')) return false
        return s2.includes('proven because the package\'s own preconditions ran and the transaction committed')
      })())
    check('B6: the preserved payload and authorship values are MECHANICALLY EQUAL to the promoted admitted artifact — every setup step, execution step, common mistake, the breathing cue, the safety guidance, the accessibility alternative, authored_by, authored_at, and the empty-string (not null) equipment_setup — and equal to the executed package\'s own dollar-quoted pre/post literals where scalar',
      (() => {
        const s2 = rec.slice(rec.indexOf('## 2.'), rec.indexOf('## 3.')).replace(/\s+/g, ' ')
        if (art.authored_at !== '2026-09-01' || !s2.includes('authored_at: 2026-09-01')) return false
        if (!s2.includes(`authored_by: ${art.authored_by}`)) return false
        const numbered = (items: string[]): boolean =>
          items.every((t, i) => s2.includes(`${i + 1}. ${t}`))
        if (art.setup_steps.length !== 3 || !numbered(art.setup_steps)) return false
        if (art.execution_steps.length !== 4 || !numbered(art.execution_steps)) return false
        if (art.common_mistakes.length !== 3 || !numbered(art.common_mistakes)) return false
        if (!s2.includes(`breathing_cue: ${art.breathing_cue}`)) return false
        if (!s2.includes(`safety_guidance: ${art.safety_guidance}`)) return false
        if (!s2.includes(`accessibility_alternative: ${art.accessibility_alternative}`)) return false
        if (art.equipment_setup !== '' || !s2.includes('equipment_setup: the EMPTY STRING (zero-length, not null)')) return false
        if (lit('p_ab') !== art.authored_by || lit('q_ab') !== art.authored_by) return false
        if (lit('p_br') !== art.breathing_cue || lit('q_br') !== art.breathing_cue) return false
        if (lit('p_sf') !== art.safety_guidance || lit('q_sf') !== art.safety_guidance) return false
        return lit('p_ac') === art.accessibility_alternative && lit('q_ac') === art.accessibility_alternative
      })())
  }

  console.log('\nC. Post-execution state cross-checked against the package\'s own gates and the promoted sources')
  {
    check('C1: the recorded vector is the UNCHANGED eleven-term value in the package\'s own mechanically-extracted order — both package queries identical, canonical order, the same vector pinned twice in the package, every per-table line matching term for term',
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
        if ((pkg.match(new RegExp(`v_counts <> '${STATE_VECTOR.replace(/\//g, '\\/')}'`, 'g')) || []).length !== 2) return false
        if (!recFlat.includes(`count vector was exactly ${STATE_VECTOR}`)) return false
        if (!recFlat.includes('UNCHANGED from the pre-state')) return false
        const terms = STATE_VECTOR.split('/').map(Number)
        const listed: string[] = []
        const lineRe = /^- (exercise_catalog[a-z_]*): (\d+)$/gm
        let lm: RegExpExecArray | null = lineRe.exec(rec)
        while (lm !== null) { listed.push(lm[1]); lm = lineRe.exec(rec) }
        if (JSON.stringify(listed) !== JSON.stringify(CANON_ORDER)) return false
        for (let i = 0; i < CANON_ORDER.length; i += 1) {
          if (!rec.includes(`- ${CANON_ORDER[i]}: ${terms[i]}`)) return false
        }
        return recFlat.includes('one-use is enforced by the pre-admission-state gate, not the vector')
      })())
    check('C2: the admitted content row is exact and equals the package\'s own postconditions — import_admitted true, the 64-hex admission fingerprint, admitted_source_sha256 equal to the artifact\'s SHA-256, and admitted_at 2026-09-05 (the UTC execution date; the function sets transaction-stable CURRENT_DATE and the package compared exactly that)',
      (() => {
        if (!/^[0-9a-f]{64}$/.test(ADM_FP)) return false
        if (!recFlat.includes('import_admitted = true')) return false
        if (!recSolid.includes(`admitted_fingerprint=${ADM_FP}`)) return false
        if (!recSolid.includes(`admitted_source_sha256=${ART_SHA}`)) return false
        if (!recFlat.includes('admitted_at = 2026-09-05 — the UTC execution date')) return false
        if (!T_START.startsWith('2026-09-05') || !T_POSTPROOF.startsWith('2026-09-05')) return false
        if (!pkgFlat.includes('c.import_admitted = true')) return false
        if (!pkgFlat.includes('c.admitted_at = CURRENT_DATE')) return false
        return pkgFlat.includes("c.admitted_fingerprint ~ '^[0-9a-f]{64}$'")
      })())
    check('C3: the admission fingerprint is a HOSTED, DATABASE-GENERATED fact — ABSENT from the executed package\'s pinned literals AND from every promoted preparation-era byte (the package binds it RELATIONALLY to a fresh recomputation), and the recorded value equals the post-query recomputation with fingerprint_fresh true',
      (() => {
        if (pkg.includes(ADM_FP)) return false
        if (read(PREP_RECORD).includes(ADM_FP)) return false
        try {
          execSync(`git grep -q ${ADM_FP} ${SOURCE_TIP}`, { stdio: 'pipe' })
          return false
        } catch { /* absent at the promoted tip: expected */ }
        if (!pkgFlat.includes('c.admitted_fingerprint = public.exlib_content_admission_fingerprint(c.id)')) return false
        if (!recFlat.includes('HOSTED, DATABASE-GENERATED admission-manifest fingerprint')) return false
        if (!recFlat.includes('never an argument and deliberately absent from the package\'s pinned literals')) return false
        if ((recSolid.match(new RegExp(ADM_FP, 'g')) || []).length !== 3) return false
        if (!recFlat.includes('The freshly recomputed fingerprint')) return false
        if (!recFlat.includes('equal to the stored value: fingerprint_fresh = true')) return false
        return recFlat.includes('the exact freshness equality the package\'s postcondition demanded inside the transaction')
      })())
    check('C4: the unchanged content state equals the human sources and the package\'s frozen-field postconditions — approved with the exact Nick Tkacz tuple, payload and authorship unchanged (the same verbatim values of section 2), publication draft, version 1, binding unchanged',
      (() => {
        if (!recFlat.includes('content_status = approved; the exact Nick Tkacz review tuple is unchanged')) return false
        if (!recFlat.includes('reviewed_by = Nick Tkacz, reviewed_at = the 2026-09-01T20:35:00-04:00 instant, review_rationale = Everything looks correct')) return false
        if (form.reviewer !== 'Nick Tkacz' || form.rationale !== 'Everything looks correct') return false
        if (art.content_review.reviewed_at !== '2026-09-01T20:35:00-04:00') return false
        if (lit('q_rev') !== 'Nick Tkacz' || lit('q_rat') !== 'Everything looks correct') return false
        if (!pkgFlat.includes("c.reviewed_at = TIMESTAMPTZ '2026-09-01T20:35:00-04:00'")) return false
        if (!recFlat.includes('complete content payload and authorship remained unchanged')) return false
        if (!recFlat.includes('the same values preserved verbatim in section 2')) return false
        if (!recFlat.includes('publication_status = draft (publication remains absent)')) return false
        return recFlat.includes('content_version = 1; the logical/content UUID binding is unchanged')
      })())
    check('C5: REVIEW-EVENT PRECISION verbatim — zero events EXPECTED AND CORRECT, snapshot-scoped schema (catalog_id -> exercise_catalog(id), guard at depth >= 2), the admission\'s durable audit is the content row\'s own admission surface alongside the frozen review tuple, no event invented or manually inserted, the zero is NOT missing evidence — and the package enforces zero at both ends',
      recFlat.includes('exercise_catalog_review_events remains exactly 0. This is EXPECTED AND CORRECT') &&
      recFlat.includes('SNAPSHOT-review scoped') &&
      recFlat.includes('catalog_id references exercise_catalog(id)') &&
      recFlat.includes('pg_trigger_depth >= 2') &&
      recFlat.includes('import_admitted / admitted_fingerprint / admitted_source_sha256 / admitted_at') &&
      recFlat.includes('No review event was invented or manually inserted') &&
      recFlat.includes('NOT missing evidence') &&
      pkgFlat.includes('a Plank review event already exists; refusing') &&
      pkgFlat.includes('a review event appeared; the snapshot-scoped log must stay empty under an admission'))
    check('C6: every unchanged surface equals the promoted-source-derived sets — invariant 0/0, zero projections/runs/items, tenant 84, the Plank anatomy/alias sets from the artifact, and the Dead bug / Ab wheel rollout anatomy, alias, and claim vocabulary present in the SPENT 2O package\'s own literals',
      (() => {
        if (!recFlat.includes('0 orphaned / 0 unclaimed')) return false
        if (!recFlat.includes('Projected relationships: 0. Import runs: 0. Run items: 0.')) return false
        if (!recFlat.includes('exactly 84 rows, unchanged')) return false
        const anat = art.muscle_targets.map((m: { muscle: string; role: string }) => `${m.muscle}/${m.role}`).sort()
        if (JSON.stringify(anat) !== JSON.stringify(['lower_back/tertiary', 'obliques/secondary'])) return false
        if (!recFlat.includes('Plank lower_back/tertiary and obliques/secondary')) return false
        if (!recFlat.includes('Dead bug hip_flexors/secondary')) return false
        if (!recFlat.includes('Ab wheel rollout lats/tertiary and obliques/secondary')) return false
        if (JSON.stringify([...art.aliases].sort()) !== JSON.stringify(['Forearm plank', 'Front plank'])) return false
        if (!recFlat.includes('Plank Forearm plank and Front plank')) return false
        if (!recFlat.includes('Ab wheel rollout Ab roller rollout')) return false
        const p2o = read(PKG2O)
        for (const tok of ['hip_flexors', 'lats', 'obliques', 'Ab roller rollout',
          'dead bug', 'ab wheel rollout', 'ab roller rollout']) {
          if (!p2o.includes(tok)) return false
        }
        if (!recFlat.includes('plank / canonical, forearm plank / alias, front plank / alias')) return false
        if (!recFlat.includes('dead bug / canonical')) return false
        if (!recFlat.includes('ab wheel rollout / canonical, ab roller rollout / alias')) return false
        return recFlat.includes(`progression -> ${AW}`) && recFlat.includes(`substitution -> ${DBU}`) &&
          JSON.stringify(art.progressions) === JSON.stringify(['Ab wheel rollout']) &&
          JSON.stringify(art.substitutions) === JSON.stringify(['Dead bug'])
      })())
    check('C7: all three snapshots are exact, distinct, and unswapped — the Dead bug and Ab wheel rollout hosted UUIDs IDENTICAL to the promoted EXLIB-2O and EXLIB-2P evidence (cross-checked against both records\' bytes), the Plank hosted UUID first evidenced HERE (a hosted surrogate ABSENT from the package and from every promoted preparation-era byte, held as evidence and never a package precondition), correct names/categories/vocabulary, active, v1, pending with NULL reviewer fields, untouched by the admission',
      (() => {
        const rec2o = read(REC2O).replace(/\s+/g, '')
        const rec2p = read(REC2P).replace(/\s+/g, '')
        if (!rec2o.includes(DB_SNAP) || !rec2o.includes(AW_SNAP)) return false
        if (!rec2p.includes(DB_SNAP) || !rec2p.includes(AW_SNAP)) return false
        if (!recSolid.includes(DB_SNAP) || !recSolid.includes(AW_SNAP) || !recSolid.includes(PL_SNAP)) return false
        if (new Set([PL_SNAP, DB_SNAP, AW_SNAP]).size !== 3) return false
        if (pkg.includes(PL_SNAP)) return false
        try {
          execSync(`git grep -q ${PL_SNAP} ${SOURCE_TIP}`, { stdio: 'pipe' })
          return false
        } catch { /* absent at the promoted tip: expected */ }
        if (!recFlat.includes('per the accepted fixture-portability rule it is evidence, never a package precondition')) return false
        if (!recFlat.includes('canonical_name = Plank, category = isolation, active, catalog version 1')) return false
        if (!recFlat.includes('bodyweight / abs / bilateral / timed; forgefitos_original; core_anti_extension / core / beginner / minimal; discovery-source quadruple null')) return false
        if (!recFlat.includes('canonical_name = Dead bug, category = mobility, active, catalog version 1')) return false
        if (!recFlat.includes('canonical_name = Ab wheel rollout, category = other, active, catalog version 1')) return false
        return recFlat.includes('bindings remain distinct and unswapped') &&
          recFlat.includes('the admission touched no snapshot row')
      })())
  }

  console.log('\nD. Authority, advisors, lifecycle distinction, and boundaries')
  {
    check('D1: authority restoration is pinned GRANTOR-INCLUDED with the client denials — exactly one supabase_admin-granted membership t/f/f, the temporary SET row absent, pg_has_role SET false, anon/authenticated/service_role EXECUTE all false on public.admit_catalog_content — matching the package\'s restoration postconditions',
      recFlat.includes('Exactly ONE exlib_catalog_admission membership remains: member postgres, grantor supabase_admin, ADMIN TRUE, INHERIT FALSE, SET FALSE') &&
      recFlat.includes('The temporary postgres-granted SET membership is ABSENT') &&
      recFlat.includes("pg_has_role('postgres','exlib_catalog_admission','SET') = false") &&
      recFlat.includes('anon EXECUTE = false, authenticated EXECUTE = false, service_role EXECUTE = false on public.admit_catalog_content') &&
      recFlat.includes('No persistent authority widening occurred') &&
      pkg.includes('REVOKE exlib_catalog_admission FROM postgres GRANTED BY postgres;') &&
      (pkg.match(new RegExp(`has_function_privilege\\('(anon|authenticated|service_role)', 'public\\.admit_catalog_content\\(${ADMIT_SIG}\\)', 'EXECUTE'\\)`, 'g')) || []).length === 6)
    check('D2: advisor evidence precision — both advisors run by ChatGPT immediately after execution at approximately 2026-09-05 17:57:06 UTC, NEITHER claimed globally clean, neither produced an execution failure or blocking finding attributable to this admission, the RLS-no-policy INFO posture preserved as intentional, the named broader security warnings (mutable search paths, callable SECURITY DEFINER functions elsewhere, leaked-password protection disabled) unadjudicated and outside EXLIB-2Q, the performance indexing/RLS-init-plan/connection-strategy/unused-index notices not claimed introduced/fixed/accepted/adjudicated, and NOTHING silently fixed',
      recFlat.includes('BOTH hosted advisor classes') &&
      recFlat.includes('were run by ChatGPT immediately after this execution, at approximately 2026-09-05 17:57:06 UTC') &&
      recFlat.includes('NEITHER advisor result is claimed to be globally clean') &&
      recFlat.includes('NEITHER produced an execution failure or a blocking finding attributable to this Plank import admission') &&
      recFlat.includes('INTENTIONAL deny-by-default posture') &&
      recFlat.includes('preserved precisely and not "fixed"') &&
      recFlat.includes('mutable search paths, callable SECURITY DEFINER functions elsewhere, and leaked-password protection being disabled') &&
      recFlat.includes('UNADJUDICATED and OUTSIDE EXLIB-2Q') &&
      recFlat.includes('indexing, RLS-init-plan, connection-strategy, and unused-index notices') &&
      recFlat.includes('None of these notices is claimed introduced, fixed, accepted, or adjudicated here') &&
      recFlat.includes('No advisor item was silently fixed in this milestone'))
    check('D3: the lifecycle distinction is held — human review done (2I), hosted database review done (2P), IMPORT ELIGIBILITY ADMISSION DONE and evidenced HERE, publication NOT performed (draft; publish_catalog_content never invoked), relationship projection NOT performed (0 projected; belongs to publication\'s atomic act), delivery activation NOT performed — and the record approves nothing further',
      recFlat.includes('HUMAN content review — EXLIB-2I, done') &&
      recFlat.includes('HOSTED DATABASE CONTENT REVIEW — EXLIB-2P, done') &&
      recFlat.includes('IMPORT ELIGIBILITY ADMISSION — THIS record\'s act') &&
      recFlat.includes('DONE and evidenced here') &&
      recFlat.includes('PUBLICATION — NOT performed') &&
      recFlat.includes('publish_catalog_content (role exlib_catalog_admin) was never invoked') &&
      recFlat.includes('RELATIONSHIP PROJECTION — NOT performed') &&
      recFlat.includes('projection belongs to publication\'s atomic act') &&
      recFlat.includes('DELIVERY ACTIVATION — NOT performed') &&
      recFlat.includes('seed_link_compatible flip remain facts of the later coordinated delivery-activation release') &&
      recFlat.includes('This record itself approves NOTHING further'))
    check('D4: boundaries hold — the frozen product surface is blob-identical to the promoted tip (seed module, inventory, ledger, package.json, both batch artifacts), the Plank inventory row stayed seed_link_compatible false through this milestone, and the phase range through the anchored delivery predecessor touches only docs/ and scripts/verify-* paths (RETARGET (EXLIB-2S delivery-activation preparation))',
      (() => {
        // RETARGET (EXLIB-2S delivery-activation preparation): the two
        // delivery-surface paths compare SRC-blob vs the anchored
        // delivery-predecessor blob; every other frozen path stays live.
        for (const p of ['src/lib/supabase/seed-exercises.ts', 'docs/exlib2b-release1-inventory.jsonl']) {
          if (execSync(`git rev-parse "${SOURCE_TIP}:${p}"`, { encoding: 'utf8' }).trim() !==
              execSync(`git rev-parse "${DELIVERY_PRED}:${p}"`, { encoding: 'utf8' }).trim()) return false
        }
        for (const p of ['docs/exlib1b1-review-ledger.jsonl', 'package.json',
          'docs/exlib2c-release1-batch02-content.jsonl', 'docs/exlib2c-release1-batch04-content.jsonl']) {
          if (!frozenVsSource(p)) return false
        }
        const inv = execSync(`git show ${DELIVERY_PRED}:"docs/exlib2b-release1-inventory.jsonl"`,
          { encoding: 'utf8', maxBuffer: 1 << 26 }).split('\n')
          .filter((l) => l.trim() && !l.trim().startsWith('#')).map((l) => JSON.parse(l))
        const plank = inv.filter((r: { proposed_canonical_name: string; seed_link_compatible: boolean }) =>
          r.proposed_canonical_name === 'Plank')
        if (plank.length !== 1 || plank[0].seed_link_compatible !== false) return false
        const range = execSync(`git diff --name-only ${SOURCE_TIP}..${DELIVERY_PRED}`, { encoding: 'utf8' })
          .split('\n').filter(Boolean)
        return !range.some((p) => !/^(docs\/|scripts\/verify-)/.test(p))
      })())
  }

  console.log('\nE. Lifecycle: the labeled retarget and the two-state application record')
  {
    check('E1: the preparation suite\'s HEAD topology is retargeted under the exact label — the label appears at least twice in scripts/verify-exlib2q.ts, the suite pins the promoted tip constant and its tree, its topology walks the TIP rather than HEAD, and the record documents the classification with unchanged committed-state totals (33/0)',
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
        if (tipDocs.includes('exlib2q-hosted-admission-application-record')) return false
        const liveDocs = readdirSync('docs').filter((f) => f.includes('exlib2q-hosted-admission-application-record'))
        return liveDocs.length === 1 && liveDocs[0] === 'exlib2q-hosted-admission-application-record.md'
      })())
    check('E3: lifecycle-safe phase boundary — the phase adds exactly two paths (this record, this verifier) and modifies exactly the retargeted verify-exlib2q.ts; strict porcelain while uncommitted, adder-anchored once committed',
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
