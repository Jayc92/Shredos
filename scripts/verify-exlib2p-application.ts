// EXLIB-2P hosted database content-review APPLICATION-EVIDENCE
// verifier (LOCAL-ONLY).
//
// Owns the executed-state posture: the reviewed Plank database
// content-review package (37,702 B / 76d1d67d...) was executed ONCE
// against hosted ShredOS by ChatGPT (never Claude) on 2026-09-05 UTC
// and committed. Proves: exact source refs and byte-frozen
// fingerprints; the execution facts pinned verbatim with ChatGPT
// attribution and the pre-execution recovery point; the returned
// JSONB bound to the package's own call arguments; the
// operator-confirmed post-state cross-checked mechanically against
// the executed package's OWN postconditions, the promoted admitted
// artifact, the completed human forms, the promoted EXLIB-2O
// application record (the identical hosted snapshot UUIDs), and the
// committed schema; the review-event precision block (zero events is
// EXPECTED AND CORRECT under the snapshot-scoped schema — the audit
// is the frozen content-row tuple, never an invented event); the
// grantor-included authority restoration with client denials; the
// advisor precision (no globally-clean claim); the four-way lifecycle
// distinction with admission/publication/delivery still separately
// gated; boundary freezes; and the lifecycle two-state check with the
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

const RECORD = 'docs/exlib2p-hosted-review-application-record.md'
const PACKAGE = 'docs/exlib2p-plank-database-review-package.sql'
const PREP_RECORD = 'docs/exlib2p-plank-database-review-prep-record.md'
const VERIFIER = 'scripts/verify-exlib2p-application.ts'
const RETARGETED = 'scripts/verify-exlib2p.ts'
const ARTIFACT = 'docs/exlib2g-plank-content.jsonl'
const FORM = 'docs/exlib2h-plank-content-review-form-completed.json'
const REC2O = 'docs/exlib2o-hosted-load-application-record.md'
const SOURCE_TIP = '0e816533e6e3947ec007d7203937d67ce9d69e8d'
const SOURCE_TREE = 'd38d92e1f77635e0e35fc96a1cd9200fc5b659a1'
const TAG = 'exlib2p-plank-database-review-prep-reviewed-not-executed'
const TAG_OBJ = '59edb6aa9413c03ae4da78efc071b6307a645630'
const TAG_MSG = 'EXLIB-2P Plank database-review package reviewed — PREPARED — NOT EXECUTED\n'
const PKG_SHA = '76d1d67d6ec2bafc49ef43a6312700559cd9eeee4b8b9433868de9daf95dc666'
const PL = 'e21b2c00-0000-4000-a000-000000000001'
const CV = 'e21b2c00-0000-4000-a000-000000000101'
const DBU = 'e21b2c00-0000-4000-a000-000000000002'
const AW = 'e21b2c00-0000-4000-a000-000000000003'
const DB_SNAP = '1ce09c1f-c13d-4231-8e12-6f35cfd761b5'
const AW_SNAP = 'c715d840-944b-4019-b984-1687accffcf4'
const T_START = '2026-09-05 03:14:33.631620 UTC'
const T_FINISH = '2026-09-05 03:14:37.444297 UTC'
const T_BACKUP = '2026-09-04 13:09:27 UTC'
const T_UPDATED = '2026-09-05 03:14:36.146071 UTC'
const LABEL = 'RETARGET (EXLIB-2P hosted-review evidence)'
// RETARGET (EXLIB-2Q Plank import-admission preparation): this suite
// proves the EVIDENCE milestone, which was promoted as main =
// EV2P_TIP; the EXLIB-2Q preparation then legitimately advances HEAD,
// so E5's correction-topology proof is anchored to the promoted
// evidence tip — where it was and remains true — instead of HEAD.
// The tip's tree is pinned so a rewrite still fails here.
const EV2P_TIP = '93202b4e89e92eef9a0f57d28c59900898cbc2ba'
const EV2P_TREE = '814d94e41b6f0d1395b945c5a40e2da3b8c0d274'
const STATE_VECTOR = '3/3/5/3/6/1/2/0/0/0/0'
const REVIEW_SIG = 'uuid,uuid,text,text,timestamptz,text'
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
  console.log('EXLIB-2P hosted-review application-evidence verification (EXECUTED ONCE by ChatGPT; LOCAL-ONLY)')

  console.log('\nA. Source refs and byte-frozen fingerprints')
  {
    check('A1: exact source refs — the reviewed-not-executed tag is the exact annotated object with the byte-exact annotation, peels to the promoted EXLIB-2P tip (ancestor of HEAD) whose tree is exact',
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
    check('A2: the executed package is byte-UNCHANGED — worktree bytes are exactly 37,702 B with the reviewed SHA-256 and blob-identical to the promoted tip (any byte change would void the reviewed/executed status)',
      readFileSync(PACKAGE).length === 37702 && sha256(PACKAGE) === PKG_SHA &&
      frozenVsSource(PACKAGE))
    check('A3: the upstream authorities stay byte-frozen — the admitted artifact, the completed human form, the preparation record, the 2O application record, and migration 027 — and the repository migration sequence is exactly 001-027 with no 028',
      (() => {
        for (const p of [ARTIFACT, FORM, PREP_RECORD, REC2O,
          'supabase/migrations/027_exlib_catalog_content_schema.sql']) {
          if (!frozenVsSource(p)) return false
        }
        const migs = readdirSync('supabase/migrations').filter((f) => /^\d{3}_.*\.sql$/.test(f)).sort()
        return migs.length === 27 && migs[26].startsWith('027_') && !migs.some((f) => f.startsWith('028'))
      })())
  }

  console.log('\nB. Execution facts pinned verbatim (operator attribution, recovery point, one-use)')
  {
    check('B1: ChatGPT attribution is explicit and exclusive — executed by ChatGPT through the Joseph/ChatGPT-only path, NOT by Claude, against the ShredOS project ttybyljytiwntvorugcv ONLY, executed ONCE and COMMITTED with no retry and no partial replay',
      recFlat.includes('performed by ChatGPT, NOT by Claude') &&
      recFlat.includes('Claude made no hosted contact in this phase and never executes review packages') &&
      recFlat.includes('Executed by: ChatGPT (the Joseph/ChatGPT-only execution path; never by Claude)') &&
      recFlat.includes('ShredOS Supabase project ttybyljytiwntvorugcv ONLY') &&
      recFlat.includes('executed ONCE and the transaction COMMITTED successfully, with no retry and no partial replay'))
    check('B2: the executed revision, timestamps, and recovery point are pinned exactly — source commit, tag, tag object, byte count, SHA-256, start, finish, and the operator-confirmed physical backup all appear in the record; the backup precedes the start and the start precedes the finish by under a minute',
      (() => {
        if (!recSolid.includes(SOURCE_TIP) || !recSolid.includes(TAG) ||
          !recSolid.includes(TAG_OBJ) || !recSolid.includes(PKG_SHA)) return false
        if (!recFlat.includes('37,702 bytes')) return false
        if (!recFlat.includes(`Execution started: ${T_START}`)) return false
        if (!recFlat.includes(`Execution finished: ${T_FINISH}`)) return false
        if (!recFlat.includes(`physical backup at ${T_BACKUP}`)) return false
        if (!recFlat.includes('confirmed BEFORE execution')) return false
        const b = toInstant(T_BACKUP); const s = toInstant(T_START); const f = toInstant(T_FINISH)
        return b < s && s < f && f - s < 60_000
      })())
    check('B3: the one-use posture is precise — NO migration-history entry, the sequence stays 001-027, the package is SPENT and must never be rerun, the second-run refusal is the content-pending gate, the superseded no-preflight sentence is GONE, and the three-source evidence split (independent preflight / package-internal gates / post-execution queries) is explicit',
      recFlat.includes('it creates NO migration-history entry') &&
      recFlat.includes('remains exactly 001-027') &&
      recFlat.includes('ONE-USE by design and is now SPENT') &&
      recFlat.includes('must never be rerun') &&
      recFlat.includes('the reviewed row is no longer pending') &&
      // the superseded sentence must be GONE from the factual body
      // (sections 1-12); the section-13 disclosure QUOTES it as what
      // the original commit said, which is the supersession record
      !recFlat.slice(0, recFlat.indexOf('## 13.')).includes('No separate pre-flight read set is claimed') &&
      (recFlat.slice(recFlat.indexOf('## 13.')).match(/No separate pre-flight read set is claimed/g) || []).length === 1 &&
      recFlat.includes('THREE distinct sources') &&
      recFlat.includes('Nothing from one source is presented as coming from another'))
    check('B5: PREFLIGHT (Codex correction rounds 1-2, dedicated) — the independently observed preflight facts are recorded with the TRUTHFUL preservation scope (project identity ACTIVE_HEALTHY / PostgreSQL 17 / 17.6.1.127, locally-verified package bytes, dual postgres identity + non-superuser, the exact reviewer baseline row, the pre-execution vector, the Plank content row\'s explicitly listed fields, both target snapshot rows with their hosted UUIDs, the 0/0 invariant, all three client denials, tenant 84, and the backup) and the PRECISION BOUNDARY is enforced: the preflight section claims only what it preserves',
      (() => {
        const s2start = rec.indexOf('## 2. The independent read-only preflight')
        const s2end = rec.indexOf('## 3.')
        if (s2start < 0 || s2end < 0 || s2end <= s2start) return false
        const s2 = rec.slice(s2start, s2end).replace(/\s+/g, ' ')
        if (!s2.includes('verified the package bytes locally, queried the Supabase project identity, and queried the hosted database state')) return false
        if (!s2.includes('executed only after every result matched')) return false
        if (!s2.includes('name ShredOS, ref ttybyljytiwntvorugcv, status ACTIVE_HEALTHY, PostgreSQL engine 17, reported database version 17.6.1.127')) return false
        if (!s2.includes(`37,702 bytes, SHA-256 ${PKG_SHA}`)) return false
        if (!s2.includes('current_user = postgres AND session_user = postgres; postgres is not a superuser')) return false
        if (!s2.includes('member postgres, grantor supabase_admin, ADMIN true, INHERIT false, SET false')) return false
        if (!s2.includes(`Pre-execution count vector: ${STATE_VECTOR}`)) return false
        if (!s2.includes('The Plank content row (the query returned the whole row; per the preservation scope above, this record preserves exactly these fields)')) return false
        if (!s2.includes('content_status = pending, reviewed_by/reviewed_at/review_rationale all null')) return false
        if (!s2.includes(DB_SNAP) || !s2.includes(AW_SNAP)) return false
        if (!s2.includes('0 orphaned / 0 unclaimed')) return false
        if (!s2.includes('anon, authenticated, and service_role could each NOT execute public.apply_content_review')) return false
        if (!s2.includes('Tenant exercises count: 84')) return false
        if (!s2.includes(`physical backup at ${T_BACKUP}`)) return false
        // the precision boundary: package-internal gates are NOT claimed
        // as independently queried, and the preflight bullet list never
        // mentions the package-internal-only surfaces
        if (!s2.includes('PRECISION BOUNDARY')) return false
        if (!s2.includes('were NOT independently queried by the preflight')) return false
        if (!s2.includes('the reverse target bindings, the exact alias, anatomy, claim, and expected-relationship sets')) return false
        if (!s2.includes('observation of a row and preservation of its values are separate questions')) return false
        const bullets = s2.slice(0, s2.indexOf('PRECISION BOUNDARY'))
        return !/anatomy|alias(?!.*authorship)|expected[- ]relationship|reverse/i.test(bullets.replace(/payload and authorship/g, ''))
      })())
    check('B6: PRESERVATION SCOPE (Codex correction round 2, dedicated) — the overstatement is GONE from the preflight section (no "returned exactly the following", no "complete Plank content row (returned whole"), the truthful scope statement is present (whole-row return evidenced; VALUES not supplied to this milestone and NOT preserved; only the listed fields preserved; nothing reconstructed or inferred), and the dated section-14 disclosure carries the supersession with the not-invented / still-valid / SPENT / no-hosted-contact statements',
      (() => {
        const s2start = rec.indexOf('## 2. The independent read-only preflight')
        const s2end = rec.indexOf('## 3.')
        if (s2start < 0 || s2end <= s2start) return false
        const s2 = rec.slice(s2start, s2end).replace(/\s+/g, ' ')
        if (s2.includes('returned exactly the following')) return false
        if (s2.includes('The complete Plank content row (returned whole')) return false
        if (!s2.includes('PRESERVATION SCOPE')) return false
        if (!s2.includes('the exact returned payload and authorship VALUES were not supplied to this evidence milestone and are NOT preserved here')) return false
        if (!s2.includes('This record preserves ONLY the fields explicitly listed below')) return false
        if (!s2.includes('nothing is reconstructed or inferred from the package, the artifact, or the post-state')) return false
        const s14 = recFlat.slice(recFlat.indexOf('## 14.'))
        if (!s14.includes('Codex correction round 2 (2026-09-05)')) return false
        if (!s14.includes('OVERSTATED what this record preserves')) return false
        if (!s14.includes('were NOT available to this milestone')) return false
        if (!s14.includes('NOT reconstructed or inferred')) return false
        if (!s14.includes('No fact was invented in either round')) return false
        if (!s14.includes('remain valid exactly as evidenced')) return false
        if (!s14.includes('SPENT and was NOT rerun')) return false
        return s14.includes('NO hosted contact of any kind occurred during this local correction')
      })())
    check('B4: the returned JSONB is recorded verbatim and every field equals the package\'s own call arguments — decision approved, content ...0101, logical ...0001',
      recFlat.includes('decision: approved') &&
      recFlat.includes(`content_id: ${CV}`) &&
      recFlat.includes(`logical_id: ${PL}`) &&
      lit('dec') === 'approved' &&
      pkg.includes(`'${PL}',`) && pkg.includes(`'${CV}',`) &&
      recFlat.includes('the echo is display evidence and the row is the binding proof'))
  }

  console.log('\nC. Post-execution state cross-checked against the package\'s own gates and the promoted sources')
  {
    check('C1: the recorded vector is the UNCHANGED eleven-term value in the package\'s own mechanically-extracted order — both package queries identical, canonical order, every per-table line matching term for term',
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
        if (!pkg.includes(`v_counts <> '${STATE_VECTOR}'`)) return false
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
        return true
      })())
    check('C2: the reviewed content row equals the package\'s own postcondition pins AND the human sources — approved, Nick Tkacz, the exact instant (UTC form == offset form), the exact rationale, publication draft, admission absent with NULL trio, payload and authorship unchanged',
      (() => {
        if (!recFlat.includes('content_status = approved')) return false
        if (!recFlat.includes('reviewed_by = Nick Tkacz')) return false
        if (!recFlat.includes('reviewed_at = 2026-09-02 00:35:00 UTC')) return false
        if (!recFlat.includes('exactly the same INSTANT as the human decision\'s 2026-09-01T20:35:00-04:00')) return false
        if (Date.parse('2026-09-02T00:35:00Z') !== Date.parse('2026-09-01T20:35:00-04:00')) return false
        if (!recFlat.includes('review_rationale = Everything looks correct')) return false
        if (form.reviewer !== 'Nick Tkacz' || form.rationale !== 'Everything looks correct') return false
        if (art.content_review.reviewed_at !== '2026-09-01T20:35:00-04:00') return false
        if (lit('q_rev') !== 'Nick Tkacz' || lit('q_rat') !== 'Everything looks correct') return false
        if (!pkgFlat.includes("c.reviewed_at = TIMESTAMPTZ '2026-09-01T20:35:00-04:00'")) return false
        if (!recFlat.includes('publication_status = draft (publication remains absent)')) return false
        if (!recFlat.includes('import_admitted = false, admitted_fingerprint NULL, admitted_source_sha256 NULL, admitted_at NULL')) return false
        return recFlat.includes('complete content payload and authorship remained unchanged')
      })())
    check('C3: the hosted updated_at is recorded as a HOSTED FACT on operator authority — a mutable bookkeeping timestamp the package deliberately does not pin — and it falls inside the execution window',
      (() => {
        if (!recFlat.includes(`Hosted updated_at after the review: ${T_UPDATED}`)) return false
        if (!recFlat.includes('a mutable bookkeeping timestamp the package deliberately does not pin')) return false
        const u = toInstant(T_UPDATED)
        return toInstant(T_START) < u && u < toInstant(T_FINISH) && !pkg.includes('updated_at')
      })())
    check('C4: REVIEW-EVENT PRECISION verbatim — zero events EXPECTED AND CORRECT, snapshot-scoped schema (catalog_id -> exercise_catalog(id), guard at depth >= 2), the audit is the FROZEN TUPLE on the content row, no event invented or manually inserted, the zero is NOT missing evidence — and the package enforces zero at both ends',
      recFlat.includes('exercise_catalog_review_events remains exactly 0. This is EXPECTED AND CORRECT') &&
      recFlat.includes('SNAPSHOT-review scoped') &&
      recFlat.includes('catalog_id references exercise_catalog(id)') &&
      recFlat.includes('pg_trigger_depth >= 2') &&
      recFlat.includes('FROZEN TUPLE on exercise_catalog_content') &&
      recFlat.includes('No review event was invented or manually inserted') &&
      recFlat.includes('NOT missing evidence') &&
      pkgFlat.includes('a Plank review event already exists; refusing') &&
      pkgFlat.includes('a review event appeared; the snapshot-scoped log must stay empty'))
    check('C5: every unchanged surface equals the artifact-derived sets — invariant 0/0, zero projections/runs/items, tenant 84, and the exact Plank anatomy, alias, claim, and expected-relationship sets',
      (() => {
        if (!recFlat.includes('0 orphaned / 0 unclaimed')) return false
        if (!recFlat.includes('Projected relationships: 0. Import runs: 0. Run items: 0.')) return false
        if (!recFlat.includes('exactly 84 rows, unchanged')) return false
        const anat = art.muscle_targets.map((m: any) => `${m.muscle} / ${m.role}`)
        if (JSON.stringify(anat) !== JSON.stringify(['obliques / secondary', 'lower_back / tertiary'])) return false
        if (!recFlat.includes('obliques / secondary and lower_back / tertiary')) return false
        if (JSON.stringify(art.aliases) !== JSON.stringify(['Front plank', 'Forearm plank'])) return false
        if (!recFlat.includes('Forearm plank and Front plank')) return false
        if (!recFlat.includes('plank / canonical, forearm plank / alias, front plank / alias')) return false
        return recFlat.includes(`progression -> ${AW}`) && recFlat.includes(`substitution -> ${DBU}`) &&
          JSON.stringify(art.progressions) === JSON.stringify(['Ab wheel rollout']) &&
          JSON.stringify(art.substitutions) === JSON.stringify(['Dead bug'])
      })())
    check('C6: both target snapshots are recorded exactly as the promoted EXLIB-2O evidence — the IDENTICAL hosted snapshot UUIDs (cross-checked against that record\'s bytes), correct names/categories, active, v1, pending with NULL reviewer fields, distinct and unswapped, untouched by the review',
      (() => {
        const rec2o = read(REC2O).replace(/\s+/g, '')
        if (!rec2o.includes(DB_SNAP) || !rec2o.includes(AW_SNAP)) return false
        if (!recSolid.includes(DB_SNAP) || !recSolid.includes(AW_SNAP)) return false
        return recFlat.includes('canonical_name = Dead bug, category = mobility, active, catalog version 1') &&
          recFlat.includes('canonical_name = Ab wheel rollout, category = other, active, catalog version 1') &&
          recFlat.includes('bindings remain distinct and unswapped') &&
          recFlat.includes('touched neither target snapshot')
      })())
  }

  console.log('\nD. Authority, advisors, lifecycle distinction, and boundaries')
  {
    check('D1: authority restoration is pinned GRANTOR-INCLUDED with the client denials — exactly one supabase_admin-granted membership t/f/f, the temporary SET row absent, pg_has_role SET false, anon/authenticated/service_role EXECUTE all false — matching the package\'s restoration postconditions',
      recFlat.includes('Exactly ONE exlib_catalog_reviewer membership remains: member postgres, grantor supabase_admin, ADMIN TRUE, INHERIT FALSE, SET FALSE') &&
      recFlat.includes('The temporary postgres-granted SET membership is ABSENT') &&
      recFlat.includes("pg_has_role('postgres','exlib_catalog_reviewer','SET') = false") &&
      recFlat.includes('anon EXECUTE = false, authenticated EXECUTE = false, service_role EXECUTE = false on public.apply_content_review') &&
      recFlat.includes('No persistent authority widening occurred') &&
      pkg.includes('REVOKE exlib_catalog_reviewer FROM postgres GRANTED BY postgres;') &&
      (pkg.match(new RegExp(`has_function_privilege\\('(anon|authenticated|service_role)', 'public\\.apply_content_review\\(${REVIEW_SIG}\\)', 'EXECUTE'\\)`, 'g')) || []).length === 6)
    check('D2: advisor evidence precision — both advisors run by ChatGPT immediately after execution, NEITHER claimed globally clean, neither produced an execution failure or blocking finding attributable to this Plank content review, the RLS-no-policy INFO posture preserved as intentional, broader security warnings unadjudicated and outside EXLIB-2P, and the performance broader/unused-index INFO notices not claimed introduced/fixed/accepted/adjudicated',
      recFlat.includes('BOTH hosted advisor classes') &&
      recFlat.includes('were run by ChatGPT immediately after this execution') &&
      recFlat.includes('NEITHER advisor result is claimed to be globally clean') &&
      recFlat.includes('NEITHER produced an execution failure or a blocking finding attributable to this Plank content review') &&
      recFlat.includes('INTENTIONAL deny-by-default posture') &&
      recFlat.includes('preserved precisely and not "fixed"') &&
      recFlat.includes('Broader security warnings remain UNADJUDICATED and OUTSIDE EXLIB-2P') &&
      recFlat.includes('PERFORMANCE retains broader project notices and unused-index INFO notices') &&
      recFlat.includes('None of these notices is claimed introduced, fixed, accepted, or adjudicated here'))
    check('D3: the FOUR-WAY lifecycle distinction is held — human review done (2I), hosted database review DONE and evidenced HERE, admission NOT performed (admit_catalog_content never invoked, separately gated), publication NOT performed (draft; publish_catalog_content never invoked) — and projection/delivery remain later gated acts',
      recFlat.includes('HUMAN content review — EXLIB-2I, done') &&
      recFlat.includes('HOSTED DATABASE CONTENT REVIEW') && recFlat.includes('DONE and evidenced here') &&
      recFlat.includes('IMPORT ELIGIBILITY ADMISSION — NOT performed') &&
      recFlat.includes('admit_catalog_content (role exlib_catalog_admission) was never invoked') &&
      recFlat.includes('PUBLICATION — NOT performed') &&
      recFlat.includes('publish_catalog_content (role exlib_catalog_admin) was never invoked') &&
      recFlat.includes('relationship projection and delivery activation likewise remain separately gated') &&
      recFlat.includes('This record itself approves NOTHING further'))
    check('D4: boundaries hold — the frozen set is blob-identical to the promoted tip (seed module, inventory, ledger, package.json, both batch artifacts), the Plank inventory row stayed seed_link_compatible false through this milestone, and the phase range through the anchored delivery predecessor touches only docs/ and scripts/verify-* paths (RETARGET (EXLIB-2S delivery-activation preparation))',
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
        const plank = inv.filter((r: any) => r.proposed_canonical_name === 'Plank')
        if (plank.length !== 1 || plank[0].seed_link_compatible !== false) return false
        const range = execSync(`git diff --name-only ${SOURCE_TIP}..${DELIVERY_PRED}`, { encoding: 'utf8' })
          .split('\n').filter(Boolean)
        return !range.some((p) => !/^(docs\/|scripts\/verify-)/.test(p))
      })())
  }

  console.log('\nE. Lifecycle: the labeled retarget and the two-state application record')
  {
    check('E1: the preparation suite\'s HEAD topology is retargeted under the exact label — the label appears at least twice, the suite pins the promoted tip constant and its tree, its topology walks the TIP rather than HEAD, and the record documents the classification with unchanged totals (32/0)',
      (() => {
        const r = read(RETARGETED)
        if ((r.match(new RegExp(LABEL.replace(/[()]/g, '\\$&'), 'g')) ?? []).length < 2) return false
        if (!r.includes(`const TIP = '${SOURCE_TIP}'`)) return false
        if (!r.includes(`const TIP_TREE = '${SOURCE_TREE}'`)) return false
        if (!r.includes('rev-list --count ${SRC}..${TIP}')) return false
        return recFlat.includes(`label \`${LABEL}\``) &&
          recFlat.includes('the suite\'s totals are unchanged (32/0)') &&
          recFlat.includes('byte-frozen history that remain true AS WRITTEN of their own phase')
      })())
    check('E2: the lifecycle two-state proof — the promoted tip\'s tree contains NO application record, and the live tree contains exactly this one',
      (() => {
        const tipDocs = execSync(`git ls-tree ${SOURCE_TIP} docs/ --name-only`, { encoding: 'utf8' })
        if (tipDocs.includes('exlib2p-hosted-review-application-record')) return false
        const liveDocs = readdirSync('docs').filter((f) => f.includes('exlib2p-hosted-review-application-record'))
        return liveDocs.length === 1 && liveDocs[0] === 'exlib2p-hosted-review-application-record.md'
      })())
    check('E3: lifecycle-safe phase boundary — the phase adds exactly two paths (this record, this verifier) and modifies exactly the retargeted verify-exlib2p.ts; strict porcelain while uncommitted, adder-anchored once committed',
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
    check('E4: LOCAL-ONLY hygiene — neither the record nor this verifier contains a hosted endpoint URL, connection string, credential, or Supabase CLI remote command, and neither performs hosted contact',
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
        return recFlat.includes('Claude made no hosted contact in this phase')
      })())
    check('E5: correction topology (rounds 1-2) — the original evidence commit 0843ed4 AND the round-1 correction 3c91d9ee are both PRESERVED untouched with their exact recorded trees on the chain 0e816533 -> 0843ed4a -> 3c91d9ee; each correction is exactly ONE plain single-parent forward commit modifying exactly the record and this verifier, zero merges (strict two-file worktree scope while a round is being authored); and the record carries BOTH dated supersession disclosures',
      (() => {
        try {
          const R1 = '0843ed4aeb408992faf6af65d51f711f22e510a5'
          const R1_TREE = '6fb25ca8485345c8853f35b6fe9b3e56fe003546'
          const R2 = '3c91d9ee6707658f9b6891f49d3a52412f4c55f7'
          const R2_TREE = '3544e9b9c29983c031b39a277c32fdd8a59246f7'
          if (execSync(`git rev-parse ${R1}^{tree}`, { encoding: 'utf8' }).trim() !== R1_TREE) return false
          if (execSync(`git rev-parse ${R1}^`, { encoding: 'utf8' }).trim() !== SOURCE_TIP) return false
          if (execSync(`git rev-parse ${R2}^{tree}`, { encoding: 'utf8' }).trim() !== R2_TREE) return false
          if (execSync(`git rev-parse ${R2}^`, { encoding: 'utf8' }).trim() !== R1) return false
          const twoFiles = JSON.stringify([`M\t${RECORD}`, `M\t${VERIFIER}`].sort())
          const r1status = execSync(`git diff --name-status ${R1}..${R2}`, { encoding: 'utf8' })
            .split('\n').filter(Boolean).sort()
          if (JSON.stringify(r1status) !== twoFiles) return false
          const disclosure = recFlat.includes('Codex correction round 1 (2026-09-05)') &&
            recFlat.includes('That statement was FALSE as a statement about what happened') &&
            recFlat.includes('ChatGPT HAD performed the independent read-only preflight') &&
            recFlat.includes('Codex correction round 2 (2026-09-05)') &&
            recFlat.includes('The hosted execution and the post-state remain valid exactly as evidenced') &&
            recFlat.includes('the package is SPENT and was NOT rerun') &&
            recFlat.includes('NO hosted contact of any kind occurred during this local correction')
          if (!disclosure) return false
          // RETARGET (EXLIB-2Q Plank import-admission preparation):
          // anchored to the promoted evidence tip, where this was and
          // remains true; the tip must remain an ancestor of HEAD.
          if (execSync(`git rev-parse ${EV2P_TIP}^{tree}`, { encoding: 'utf8' }).trim() !== EV2P_TREE) return false
          execSync(`git merge-base --is-ancestor ${EV2P_TIP} HEAD`, { stdio: 'pipe' })
          if (execSync(`git rev-list --count ${R2}..${EV2P_TIP}`, { encoding: 'utf8' }).trim() !== '1') return false
          if (execSync(`git rev-list --count --merges ${SOURCE_TIP}..${EV2P_TIP}`, { encoding: 'utf8' }).trim() !== '0') return false
          const parents = execSync(`git rev-list --parents -n 1 ${EV2P_TIP}`, { encoding: 'utf8' }).trim().split(/\s+/)
          if (parents.length !== 2 || parents[1] !== R2) return false
          const status = execSync(`git diff --name-status ${R2}..${EV2P_TIP}`, { encoding: 'utf8' })
            .split('\n').filter(Boolean).sort()
          return JSON.stringify(status) === twoFiles
        } catch { return false }
      })())
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
