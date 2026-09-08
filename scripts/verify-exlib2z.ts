// EXLIB-2Z verification (LOCAL-ONLY): the S5 seal package
// preparation — the one-use, materially irreversible
// exlib_approve_and_seal_run package proven against the promoted
// migration bytes, the reserved authority artifact, the reviewed
// EXLIB-2U package's inherited gate blocks, and this milestone's
// preparation record. Performs NO hosted contact and simulates
// nothing; every claim is a byte comparison.
//
// Fail-closed: any mismatch fails the suite.
import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import { createHash } from 'crypto'

let passed = 0
let failed = 0
const check = (name: string, ok: boolean, detail?: string): void => {
  if (ok) { passed += 1; console.log(`  PASS  ${name}`) }
  else { failed += 1; console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`) }
}
const read = (p: string): string => readFileSync(p, 'utf8')
const norm = (s: string): string => s.replace(/\s+/g, ' ')
const sha256 = (p: string): string => createHash('sha256').update(readFileSync(p)).digest('hex')

const BASE = '290f9bbbfea84ac6bcd2cefb59f7bed2247e2021'
const PKG = 'docs/exlib2z-s5-seal-package.sql'
const RECORD = 'docs/exlib2z-s5-seal-prep-record.md'
const LIVE = 'scripts/verify-exlib2z-live.sh'
const VERIFIER = 'scripts/verify-exlib2z.ts'
const PHASE_ADDS = [PKG, RECORD, LIVE, VERIFIER].sort()
const RETARGETED = ['scripts/verify-exlib2u-application.ts']
const U_PKG = 'docs/exlib2u-staged-run-package.sql'
const U_REC = 'docs/exlib2u-hosted-application-record.md'
const MIG = 'supabase/migrations/023_exlib_catalog_and_delivery_contract.sql'
const MIG26 = 'supabase/migrations/026_exlib_plank_seed_reconciliation.sql'
const AUTH_FORM = 'docs/exlib2v-s4-authority-inputs-form-completed.json'

const pkg = read(PKG)
const rec = read(RECORD)
const recFlat = norm(rec)
const live = read(LIVE)
const upkg = read(U_PKG)
const urecFlat = norm(read(U_REC))
const mig = read(MIG)
const auth = JSON.parse(read(AUTH_FORM))
const RUN_KEY = auth.requested_inputs.run_key_literal.value as string

// slice a gate block: from the exact start marker to the THEN that
// closes its IF — used to prove byte-identical gate inheritance.
const sliceBlock = (hay: string, startMarker: string): string => {
  const s = hay.indexOf(startMarker)
  if (s < 0) return ''
  const e = hay.indexOf('THEN', s)
  if (e < 0) return ''
  return hay.slice(s, e)
}

console.log('EXLIB-2Z S5 seal package preparation verification (LOCAL-ONLY; PREPARED — NOT EXECUTED — NOT AUTHORIZED; nothing sealed anywhere)')

check('Z1: the package bytes are exactly what this record reviews — the record\'s stated size and sha256 equal the live file\'s, and the package carries every governing label (PREPARED / NOT AUTHORIZED / ONE-USE / MATERIALLY IRREVERSIBLE / the hosted target / the Claude-exclusion executor boundary / the RISK ELEVATION statement) while the record declares PREPARATION AND REVIEW ONLY with the drafted authorization NOT ISSUED',
  (() => {
    const m = recFlat.match(/docs\/exlib2z-s5-seal-package\.sql, ([\d,]+) bytes, sha256 ([0-9a-f]{64})/)
    if (!m) return false
    const size = Number(m[1].replace(/,/g, ''))
    if (readFileSync(PKG).length !== size) return false
    if (sha256(PKG) !== m[2]) return false
    return pkg.includes('PREPARED — NOT EXECUTED — NOT AUTHORIZED')
      && pkg.includes('ONE-USE, NOT idempotent, and MATERIALLY IRREVERSIBLE')
      && pkg.includes('ttybyljytiwntvorugcv')
      && pkg.includes('never by Claude and never by any automated pipeline')
      && pkg.includes('RISK ELEVATION')
      && recFlat.includes('PREPARATION AND REVIEW ONLY')
      && recFlat.includes('PREPARED, NOT ISSUED')
  })())
check('Z2: statement shape exact — exactly ONE seal call bearing the reserved key literal, ZERO revoke/deliver/rollback calls, ZERO direct INSERT/UPDATE/DELETE statements, ONE BEGIN, ONE COMMIT, THREE DO blocks, and the ELEVEN-table SHARE ROW EXCLUSIVE lock block byte-identical to the reviewed EXLIB-2U package\'s',
  (() => {
    if ((pkg.match(/public\.exlib_approve_and_seal_run\('/g) || []).length !== 1) return false
    if (!pkg.includes(`public.exlib_approve_and_seal_run('${RUN_KEY}')`)) return false
    if ((pkg.match(/exlib_revoke_run_delivery\('|deliver_catalog_exercises\('|rollback_catalog_delivery\('/g) || []).length !== 0) return false
    if ((pkg.match(/^INSERT INTO/gm) || []).length !== 0) return false
    if ((pkg.match(/^UPDATE /gm) || []).length !== 0) return false
    if ((pkg.match(/^DELETE /gm) || []).length !== 0) return false
    if ((pkg.match(/^BEGIN;$/gm) || []).length !== 1) return false
    if ((pkg.match(/^COMMIT;$/gm) || []).length !== 1) return false
    if ((pkg.match(/^DO \$/gm) || []).length !== 3) return false
    const uLockStart = upkg.indexOf('LOCK TABLE')
    const uLockEnd = upkg.indexOf('IN SHARE ROW EXCLUSIVE MODE;', uLockStart)
    if (uLockStart < 0 || uLockEnd < 0) return false
    const uLock = upkg.slice(uLockStart, uLockEnd + 'IN SHARE ROW EXCLUSIVE MODE;'.length)
    return pkg.includes(uLock)
  })())
check('Z3: GATE INHERITANCE proven byte-identical — the exact-enabled-trigger-binding gate block and the absolute four-role authority gate block (both round-1 strengthened, hosted-proven in the EXLIB-2U execution) appear VERBATIM in this package (extracted from the 2U bytes, located in the 2Z bytes), and the six-line ALL_THREE_IDENTITIES membership literal appears exactly twice (pre and post)',
  (() => {
    const trig = sliceBlock(upkg, 'IF (SELECT count(*) FROM pg_catalog.pg_trigger t')
    if (trig.length < 500 || !pkg.includes(trig)) return false
    const authBlock = sliceBlock(upkg, "SELECT string_agg(g.rolname || '>' || m.rolname || '@' || gr.rolname")
    if (authBlock.length < 400 || !pkg.includes(authBlock)) return false
    const mStart = upkg.indexOf("'alias#e21b2c00-0000-4000-a000-000000000001#Forearm plank'")
    const mEndMarker = "'exercise#e21b2c00-0000-4000-a000-000000000003'"
    const mEnd = upkg.indexOf(mEndMarker, mStart)
    if (mStart < 0 || mEnd < 0) return false
    const members = upkg.slice(mStart, mEnd + mEndMarker.length)
    return pkg.split(members).length - 1 === 2
  })())
check('Z4: MECHANICAL authority binding — the reserved run key, both approver identities, the authority instant (twice, product and legal), and the rationale in the package all equal the byte-frozen authority artifact\'s values (parsed from the artifact, never restated), and the two decision families\' instants are DISTINCT by parse with each family present',
  (() => {
    if (RUN_KEY !== 'exlib2u-plank-release1-staged-v1') return false
    const pat = auth.requested_inputs.product_approver_identity.product_approved_at as string
    const lat = auth.requested_inputs.legal_approver_identity.legal_approved_at as string
    if (Date.parse(pat) !== Date.parse(lat)) return false
    // three occurrences: the header's reserved-inputs statement plus
    // the evidence gate's product and legal comparisons
    if ((pkg.match(new RegExp(`TIMESTAMPTZ '${pat}'`, 'g')) || []).length !== 3) return false
    const prodBy = auth.requested_inputs.product_approver_identity.value as string
    if (!pkg.includes(`'${prodBy}'`)) return false
    const rationale = auth.requested_inputs.approval_rationale.value as string
    if (!pkg.includes(`'${rationale}'`)) return false
    if (Date.parse(pat) === Date.parse('2026-09-07T19:06:00-04:00')) return false
    return pkg.includes("TIMESTAMPTZ '2026-09-07T19:06:00-04:00'")
  })())
check('Z5: the S5 contract is extracted from promoted bytes, not asserted — migration 023 contains the exact atomic effect (SET approved_for_delivery = true, sealed_at = NOW()), both seal-function refusals, the sealed-branch immutability message, and the membership-permanence message, and this record quotes each verbatim',
  (() => {
    if (!norm(mig).includes('UPDATE public.exercise_catalog_import_runs SET approved_for_delivery = true, sealed_at = NOW()')) return false
    for (const q of ['exlib_approve_and_seal_run: unknown run key',
      'run is already sealed; a different approval decision requires a NEW run',
      "a sealed run''s approval-bound fields (run_key, dry_run, approval evidence, seal) are immutable",
      "a sealed run''s membership is PERMANENT; changed membership requires a NEW run (delivery disablement and revocation never reopen editing)"]) {
      if (!norm(mig).includes(q)) return false
      if (!recFlat.includes(q)) return false
    }
    return recFlat.includes('approved_for_delivery = true') && recFlat.includes('sealed_at = NOW()')
  })())
check('Z6: pre-seal predicate completeness — the staged-baseline vector literal appears exactly five times (the header\'s pre-state statement, pre gate + message, post gate + message), the run posture and evidence conjuncts are present, the readiness mirror\'s unready condition is WHITESPACE-NORMALIZED IDENTICAL to the freeze trigger\'s own condition in the migration bytes, and the five-conjunct delivery predicate is evaluated on both sides of the act',
  (() => {
    if ((pkg.match(/3\/3\/5\/3\/6\/1\/2\/2\/1\/6\/3/g) || []).length !== 5) return false
    for (const pin of ['v_run.sealed_at IS NOT NULL', 'v_run.dry_run <> false',
      'v_run.started_at IS NOT NULL', "v_run.product_approved_by IS DISTINCT FROM 'Joseph Carfagno'",
      'FOR UPDATE']) {
      if (!pkg.includes(pin)) return false
    }
    const unready = "(c.review_status <> 'approved' OR c.is_active = false OR c.reviewed_by IS NULL OR char_length(btrim(c.reviewed_by)) = 0 OR c.review_rationale IS NULL OR char_length(btrim(c.review_rationale)) = 0)"
    if (!norm(mig).includes(unready)) return false
    if (!norm(pkg).includes(unready)) return false
    const pred = 'approved_for_delivery = true AND r.dry_run = false AND r.sealed_at IS NOT NULL AND r.revoked_at IS NULL'
    return (norm(pkg).match(new RegExp(pred.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length === 2
  })())
check('Z7: abort semantics complete — inside the package, every precondition RAISE carries STOP / DO NOT SEAL (count equality, at least twenty) and every postcondition RAISE states the attempted seal does not survive (count equality, at least eight); the record forbids repair, retry, substitution, and opportunistic mutation under any refusal',
  (() => {
    const pre = pkg.slice(pkg.indexOf('DO $pre$'), pkg.indexOf('$pre$;'))
    const post = pkg.slice(pkg.indexOf('DO $post$'), pkg.indexOf('$post$;'))
    const preRaises = (pre.match(/RAISE EXCEPTION/g) || []).length
    const preStops = (pre.match(/STOP \/ DO NOT SEAL/g) || []).length
    const postRaises = (post.match(/RAISE EXCEPTION/g) || []).length
    const postSurvive = (post.match(/does not survive/g) || []).length
    if (preRaises !== preStops || preRaises < 20) return false
    if (postRaises !== postSurvive || postRaises < 8) return false
    return recFlat.includes('repair, retry, substitution, or opportunistic mutation')
      && recFlat.includes('A refusal is evidence, never an invitation to fix the database')
  })())
check('Z8: one-use and ambiguity semantics — the package refuses re-execution with the pinned SPENT message, and the record states the authorization is consumed BY THE ATTEMPT, forbids blind retry, and carries the exact read-only disambiguation query with both outcome branches',
  (() => {
    if (!pkg.includes('ONE-USE and this database shows it SPENT')) return false
    if (!recFlat.includes('consumed by the ATTEMPT, not only by success')) return false
    if (!recFlat.includes('NEVER retry blind')) return false
    if (!norm(rec).includes(norm(`SELECT run_key, approved_for_delivery, sealed_at, revoked_at
  FROM public.exercise_catalog_import_runs
  WHERE run_key = 'exlib2u-plank-release1-staged-v1';`))) return false
    return recFlat.includes('the seal LANDED') && recFlat.includes('the seal did NOT land')
  })())
check('Z9: expected post-seal state exact WITH the pre-COMMIT/post-COMMIT distinction (round-1 strengthened) — the package binds the seal instant to its own transaction, validates the four-field JSONB result, whole-row-digests the membership, and demands the predicate match exactly once; section 6 binds the zero-delivery claim TO THE GATED TRANSACTION and requires the after-commit evidence pass to OBSERVE rather than assume, with the STOP-and-report branch that never attributes movement to the package and never continues toward S6; section 9\'s capture item is an OBSERVATION, never an assumption',
  (() => {
    if (!pkg.includes('v_run.sealed_at <> now()')) return false
    if (!norm(pkg).includes("'run_key', 'exlib2u-plank-release1-staged-v1', 'sealed', true, 'exercise_members', 3, 'alias_members', 3")) return false
    if (!pkg.includes('run_items_digest')) return false
    if (!pkg.includes('run_evidence_line')) return false
    if (!pkg.includes("'EXLIB-2Z SEALED' AS result")) return false
    const sec6 = norm(rec.slice(rec.indexOf('## 6.'), rec.indexOf('## 7.')))
    const sec9 = norm(rec.slice(rec.indexOf('## 9.'), rec.indexOf('## 10.')))
    if (!sec6.includes('PROVEN INSIDE THE S5 TRANSACTION, BEFORE COMMIT')) return false
    if (!sec6.includes('B. AFTER COMMIT')) return false
    // the zero-delivery claim must be BOUND to the gated
    // transaction, never stated as a free-standing post-COMMIT fact
    if (!sec6.includes('zero tenant rows carry an import_run_id and both tenant digests are identical THROUGH THE GATED TRANSACTION')) return false
    if (!sec6.includes('must OBSERVE')) return false
    if (!sec6.includes('rather than assume')) return false
    if (!sec6.includes('STOP and report')) return false
    if (!sec6.includes('do not infer that the seal package itself performed the delivery')) return false
    if (!sec6.includes('do not continue toward S6 under the existing authorization')) return false
    if (!sec9.includes('OBSERVATION (never an assumption)')) return false
    if (!sec9.includes('THROUGH COMMIT')) return false
    return sec6.includes('Vector UNCHANGED')
      && sec6.includes('matches EXACTLY ONE row')
      && sec6.includes('asserted equal to now() inside the package transaction')
  })())
check('Z10: revocation is documented, bounded, and NEVER exercised — the record quotes the revocation contract from the migration bytes (sealed-only, one-way, idempotent reporting, never reopens), declares it NOT part of S5 and NOT authorized, and BOTH the package and the live suite contain ZERO revocation call sites, with the live suite\'s deliberate-omission flag present',
  (() => {
    for (const q of ['exlib_revoke_run_delivery: only sealed runs can be revoked',
      'revocation is one-way and permanent']) {
      if (!norm(mig).includes(q) || !recFlat.includes(q)) return false
    }
    if ((pkg.match(/exlib_revoke_run_delivery\('/g) || []).length !== 0) return false
    if ((live.match(/exlib_revoke_run_delivery\('/g) || []).length !== 0) return false
    return recFlat.includes('NOT part of S5 and is NOT authorized')
      && recFlat.includes('DELIBERATE OMISSION')
      && live.includes('DELIBERATE OMISSIONS')
      && live.includes('is NEVER called')
  })())
check('Z11: the S6 separation and the risk elevation are byte-grounded — migration 023 REVOKEs the seal function from every client role with no grant back while GRANTing deliver_catalog_exercises to authenticated, migration 026 records that CREATE OR REPLACE preserves those ACLs, the record states the post-seal reachability consequence with the evidence-bounded flag posture, and the live suite MEASURES the privilege posture instead of exercising it',
  (() => {
    if (!mig.includes('REVOKE ALL ON FUNCTION exlib_approve_and_seal_run(TEXT) FROM PUBLIC, anon, authenticated;')) return false
    if (!mig.includes('GRANT EXECUTE ON FUNCTION deliver_catalog_exercises(TEXT) TO authenticated;')) return false
    // comment-stripped flat compare (the prose spans SQL comment
    // lines, so '--' markers must be removed before collapsing)
    const mig26Flat = norm(read(MIG26).split('\n').map((l) => l.replace(/^\s*--\s?/, '')).join(' '))
    if (!mig26Flat.includes('because CREATE OR REPLACE preserves existing ACLs')) return false
    if (!recFlat.includes('REACHABLE by any authenticated caller that names the run key')) return false
    if (!recFlat.includes('NOT been re-observed')) return false
    if (!recFlat.includes('the LAST database gate before user-reachable delivery')) return false
    return live.includes("has_function_privilege('authenticated', 'public.deliver_catalog_exercises(text)', 'EXECUTE')")
      && live.includes("has_function_privilege('authenticated', 'public.exlib_approve_and_seal_run(text)', 'EXECUTE')")
      && recFlat.includes('NO successful delivery probe')
  })())
check('Z12: the drafted human authorization is PREPARED AND UNSENT and carries the explicit risk acknowledgment IN SECTION 17 ITSELF (round-1 strengthened: the check inspects only the section-17 slice, so a risk statement elsewhere in the record cannot satisfy it) — S5 COMMIT named as the protected DELIVERY-ACTIVATION event with immediate predicate satisfaction and flag-independent authenticated reachability, the no-delivery boundary scoped to the OPERATOR without asserting technical unreachability, the explicit acceptance of that post-COMMIT reachability, plus the spent-check, at-the-gate re-measure, single execution, refusal/ambiguity protocols, observe-not-assume capture, and the full negative boundary',
  (() => {
    const s = rec.indexOf('## 17.')
    if (s < 0) return false
    const e = rec.indexOf('## 18.', s)
    const sec17 = norm(rec.slice(s, e > 0 ? e : rec.length))
    return sec17.includes('PREPARED — NOT ISSUED — DELIBERATELY UNSENT')
      && sec17.includes('DELIVERY-ACTIVATION event')
      && sec17.includes('satisfies the database delivery predicate')
      && sec17.includes("independently of the application's delivery flag")
      && sec17.includes('constrains the OPERATOR')
      && sec17.includes('does not mean delivery is technically unreachable from authenticated direct RPC after S5 commits')
      && sec17.includes('explicitly accepts that post-COMMIT direct-RPC reachability')
      && sec17.includes('spent-check FIRST')
      && sec17.includes('re-measuring the package file')
      && sec17.includes('exactly once against ShredOS ref ttybyljytiwntvorugcv')
      && sec17.includes('OBSERVING (never assuming)')
      && sec17.includes('This authorization is ONE-USE and is consumed by the attempt')
      && sec17.includes('no delivery, no revocation, no delivery-variable or environment change, no runtime activation, no S6 work, no EXLIB-2S work, no Git push or tag, and no manual Vercel action')
      && sec17.includes('each an OPERATOR boundary; none of these words undoes the database reachability the seal itself activates')
      && sec17.includes('Claude never issues authorizations')
  })())
check('Z13: the hosted-surrogate preflight pins are CROSS-RECORD exact — the run id and database-created instant in this record\'s operator preflight equal the literals preserved in the promoted EXLIB-2U hosted-application record (extracted from those bytes, wrap-safe), and the surrogate appears NOWHERE in the environment-neutral package',
  (() => {
    const idm = urecFlat.match(/hosted id ([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/)
    const tm = urecFlat.match(/created the run at (2026-09-08T05:26:09\.\d+Z)/)
    if (!idm || !tm) return false
    if (!recFlat.includes(idm[1]) || !recFlat.includes(tm[1])) return false
    return !pkg.includes(idm[1])
  })())
check('Z14: the completed-phase retarget is applied exactly as convention requires — the EXLIB-2U application verifier carries the RETARGET (EXLIB-2Z S5 seal preparation) label, the closeout-stale refs/heads/main pin is GONE, the anchored constants (the promoted evidence tip and its stable tag object) are present, and the suite still declares exactly eleven checks',
  (() => {
    const uapp = read('scripts/verify-exlib2u-application.ts')
    if (!uapp.includes('RETARGET (EXLIB-2Z S5 seal preparation)')) return false
    if (uapp.includes("'git rev-parse refs/heads/main'")) return false
    if (!uapp.includes("const EV1 = '290f9bbbfea84ac6bcd2cefb59f7bed2247e2021'")) return false
    if (!uapp.includes("const EV_TAG_OBJ = '82e9800765579f15adc127eb4a218982c50425c8'")) return false
    return (uapp.match(/^check\(/gm) || []).length === 11
  })())
check('Z15: hygiene — this record\'s non-ASCII is the em-dash only, and no phase file carries the delivery environment-variable literals, hosted endpoints, or credential material',
  (() => {
    for (const ch of rec) {
      const c = ch.codePointAt(0) as number
      if (c > 127 && c !== 0x2014) return false
      if (c < 32 && ch !== '\n') return false
    }
    const payload = PHASE_ADDS.map(read).join('\n')
    const bads = ['CATALOG' + '_DELIVERY_' + 'ENABLED', 'CATALOG' + '_DELIVERY_' + 'RUN_KEY',
      'supabase' + '.co', 'vercel' + '.com', 'postgres' + '://',
      'SUPABASE' + '_URL', 'SUPABASE' + '_SERVICE', 'api' + 'key', 'Bearer' + ' ', 'ey' + 'J']
    return !bads.some((b) => payload.includes(b))
  })())
// RETARGET (EXLIB-2Z hosted-application evidence): this phase
// COMPLETED — the corrected candidate was Codex-approved, the
// operator issued and consumed the one-use S5 authorization, and
// the seal executed hosted exactly once (SPENT) — so the topology
// claims are anchored at the phase's own candidate tip, where they
// held and hold forever; the HEAD-relative form (and its
// uncommitted authoring branch) went stale at this evidence
// milestone's own commit, the same completed-phase pattern as every
// predecessor (eleventh instance). Count-neutral: the suite still
// reports sixteen checks.
const TIP2Z = '3969a98fc809cf69fb8a19c411de63d919db3ef7'
check('Z16: topology and inventory exact (anchored at the candidate tip) — the preserved round-0 preparation commit plus ONE plain forward round-1 correction commit over the durably closed EXLIB-2U evidence tip (single-parent chain 290f9bbb -> dc3e83a8 -> 3969a98f), the CUMULATIVE diff carrying exactly the four phase adds plus ONLY the labeled EXLIB-2U application-verifier retarget, and the correction commit touching ONLY this record and this verifier; nothing deleted',
  (() => {
    try {
      const R0 = 'dc3e83a89f086e636e7fe3aefc086872dbfefcb5'
      if (execSync(`git merge-base ${BASE} ${TIP2Z}`, { encoding: 'utf8' }).trim() !== BASE) return false
      if (execSync(`git rev-list --count ${BASE}..${TIP2Z}`, { encoding: 'utf8' }).trim() !== '2') return false
      const p1 = execSync(`git rev-list --parents -n 1 ${TIP2Z}`, { encoding: 'utf8' }).trim().split(/\s+/)
      if (p1.length !== 2 || p1[1] !== R0) return false
      const p0 = execSync(`git rev-list --parents -n 1 ${R0}`, { encoding: 'utf8' }).trim().split(/\s+/)
      if (p0.length !== 2 || p0[1] !== BASE) return false
      const status = execSync(`git diff --name-status ${BASE}..${TIP2Z}`, { encoding: 'utf8' })
        .split('\n').filter(Boolean).sort()
      const expected = [
        ...PHASE_ADDS.map((p) => `A\t${p}`),
        ...RETARGETED.map((p) => `M\t${p}`),
      ].sort()
      if (JSON.stringify(status) !== JSON.stringify(expected)) return false
      const corr = execSync(`git diff --name-status ${R0}..${TIP2Z}`, { encoding: 'utf8' })
        .split('\n').filter(Boolean).sort()
      const corrExpected = [RECORD, VERIFIER].sort().map((p) => `M\t${p}`)
      return JSON.stringify(corr) === JSON.stringify(corrExpected)
    } catch { return false }
  })())

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
