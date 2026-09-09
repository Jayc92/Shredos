// EXLIB-3A OPTION B verification (LOCAL-ONLY): the read-only
// current-state measurement package — its transactional shape, its
// zero-mutation and exact-count instrumentation, its complete
// metric census, and its predeclared interpretation and exact-once
// contracts, all bound to bytes. Performs NO hosted contact and
// executes nothing.
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

const CAND = '872e19eff3a618015a6dfea7d83c00a241c37aca'
const SQLPKG = 'docs/exlib3a-option-b-current-state-measurement.sql'
const RECORD = 'docs/exlib3a-option-b-current-state-measurement-prep-record.md'
const VERIFIER = 'scripts/verify-exlib3a-option-b.ts'
const PROPOSAL = 'docs/exlib3a-s6-delivery-configuration-proposal.md'
const PHASE_ADDS = [SQLPKG, RECORD, VERIFIER].sort()
const RETARGETED = ['scripts/verify-exlib3a.ts']
const RUN_KEY = 'exlib2u-plank-release1-staged-v1'
const FLAG_VAR = 'CATALOG' + '_DELIVERY' + '_ENABLED'
const KEY_VAR = 'CATALOG' + '_DELIVERY' + '_RUN_KEY'

const pkg = read(SQLPKG)
const rec = read(RECORD)
const recFlat = norm(rec)
const pkgCode = pkg.split('\n').filter((l) => !l.trim().startsWith('--')).join('\n')
// comment-prefix-stripped, whitespace-collapsed prose view of the
// whole package (header comments wrap across '--' lines, so raw
// substring checks on multi-word phrases would false-negative — the
// recurring wrap lesson)
const pkgProse = norm(pkg.split('\n').map((l) => l.replace(/^\s*--\s?/, '')).join(' '))
const rsec = (a: string, b: string): string => {
  const s = rec.indexOf(a)
  const e = rec.indexOf(b, s)
  return norm(rec.slice(s < 0 ? 0 : s, e < 0 ? rec.length : e))
}

console.log('EXLIB-3A OPTION B measurement package verification (LOCAL-ONLY; PREPARED — NOT EXECUTED; the section-16 authorization remains UNSENT)')

check('B1: the package bytes are exactly what this record reviews — the record\'s stated size and sha256 equal the live file\'s, and the package carries the governing labels (PREPARED / NOT AUTHORIZED, the hosted target, the Claude-exclusion executor boundary, the EXACT-ONCE LAW)',
  (() => {
    const m = recFlat.match(/docs\/exlib3a-option-b-current-state-measurement\.sql, ([\d,]+) bytes, sha256 ([0-9a-f]{64})/)
    if (!m) return false
    if (readFileSync(SQLPKG).length !== Number(m[1].replace(/,/g, ''))) return false
    if (sha256(SQLPKG) !== m[2]) return false
    return pkgProse.includes('PREPARED — NOT EXECUTED — NOT AUTHORIZED FOR EXECUTION')
      && pkgProse.includes('ttybyljytiwntvorugcv')
      && pkgProse.includes('never by Claude and never by any automated pipeline')
      && pkgProse.includes('EXACT-ONCE LAW')
  })())
check('B2: the transactional shape is exact AND the timestamp provenance is truthful (round-1 strengthened) — exactly ONE BEGIN TRANSACTION READ ONLY, ONE COMMIT, and ONE top-level SELECT; observed_at is identified as PostgreSQL\'s TRANSACTION-START timestamp (temporal context), the data metrics are stated to share the single SELECT\'s statement snapshot, the exact MVCC snapshot-acquisition instant is stated as not separately surfaced, and the factual sections REJECT any language equating now()/observed_at with the snapshot instant',
  (() => {
    if ((pkg.match(/^BEGIN TRANSACTION READ ONLY;$/gm) || []).length !== 1) return false
    if ((pkg.match(/^COMMIT;$/gm) || []).length !== 1) return false
    if ((pkg.match(/^SELECT /gm) || []).length !== 1) return false
    // the corrected provenance, required in both the package header
    // and the record
    if (!pkgProse.includes('TRANSACTION-START timestamp')) return false
    if (!pkgProse.includes('share that single statement')) return false
    if (!pkgProse.includes('does not separately surface')) return false
    if (!recFlat.includes('TRANSACTION-START timestamp')) return false
    if (!recFlat.includes('share one statement snapshot')) return false
    if (!recFlat.includes('not separately surfaced')) return false
    // the equating overstatements must be ABSENT from the package
    // and the record's factual sections (the dated disclosure may
    // quote them)
    const recFactual = norm(rec.slice(0, rec.indexOf('## 13.') > 0 ? rec.indexOf('## 13.') : rec.length))
    if (pkg.includes('the snapshot instant')) return false
    if (pkg.includes('bound to the read-only snapshot')) return false
    if (recFactual.includes('the snapshot instant')) return false
    if (recFactual.includes('bound to the read-only snapshot')) return false
    return true
  })())
check('B3: ZERO mutation, DDL, grant, or lock statements — the comment-stripped SQL contains no INSERT/UPDATE/DELETE/MERGE/TRUNCATE/CREATE/ALTER/DROP/GRANT/REVOKE keyword, no advisory lock, and no explicit table lock',
  (() => {
    if ((pkgCode.match(/\b(INSERT|UPDATE|DELETE|MERGE|TRUNCATE|CREATE|ALTER|DROP|GRANT|REVOKE)\b/gi) || []).length !== 0) return false
    if (pkgCode.toLowerCase().includes('pg_advisory')) return false
    return !pkgCode.toUpperCase().includes('LOCK TABLE')
  })())
check('B4: ZERO lifecycle invocations — the delivery, rollback, revocation, and seal function names appear NOWHERE in the executable (comment-stripped) SQL; the header prose may NAME the delivery function only inside the required not-proof-of-invocation framing',
  !pkgCode.includes('deliver_catalog_exercises')
  && !pkgCode.includes('rollback_catalog_delivery')
  && !pkgCode.includes('exlib_revoke_run_delivery')
  && !pkgCode.includes('exlib_approve_and_seal_run')
  && !pkg.includes('rollback_catalog_delivery')
  && !pkg.includes('exlib_revoke_run_delivery')
  && !pkg.includes('exlib_approve_and_seal_run'))
check('B5: exact-count instrumentation only — every cardinality is a SQL count(*) (at least twenty-five call sites) and NO approximate or statistical instrument is referenced (no connector table-metadata tool, no live-row estimates, no statistics views)',
  (() => {
    if ((pkgCode.match(/count\(\*\)/g) || []).length < 25) return false
    const bads = ['list_tables', 'live_rows_estimate', 'pg_stat', 'reltuples', 'pg_class']
    return !bads.some((b) => pkg.includes(b))
  })())
check('B6: the claims function\'s single permitted call is repository-proven read-only — the committed migration bytes define exlib_verify_catalog_claims as LANGUAGE sql STABLE with ZERO mutation keywords in its body, the package calls it exactly twice (the two invariant metrics), and the record states the READ ONLY transaction as the enforcement belt',
  (() => {
    const mig = read('supabase/migrations/023_exlib_catalog_and_delivery_contract.sql')
    const s = mig.indexOf('CREATE OR REPLACE FUNCTION exlib_verify_catalog_claims')
    if (s < 0) return false
    const e = mig.indexOf('$$;', s)
    const fn = mig.slice(s, e)
    if (!fn.includes('LANGUAGE sql')) return false
    if (!fn.includes('STABLE')) return false
    if ((fn.match(/\b(INSERT|UPDATE|DELETE|MERGE|TRUNCATE)\b/gi) || []).length !== 0) return false
    if ((pkgCode.match(/exlib_verify_catalog_claims\(\)/g) || []).length !== 2) return false
    return recFlat.includes('the READ ONLY transaction is the enforcement belt')
  })())
check('B7: the reserved run identity is bound and NO hosted surrogate is assumed — the run key equals the byte-frozen authority artifact\'s literal and appears throughout the gates, while the preserved hosted surrogate UUID appears nowhere in the package (it is SURFACED by the measurement, never presupposed)',
  (() => {
    const auth = JSON.parse(read('docs/exlib2v-s4-authority-inputs-form-completed.json'))
    if (auth.requested_inputs.run_key_literal.value !== RUN_KEY) return false
    if ((pkg.match(new RegExp(RUN_KEY, 'g')) || []).length < 10) return false
    return !pkg.includes('6669ba78')
  })())
check('B8: the metric census is COMPLETE and exact — the package\'s single result set declares exactly the fifty required metrics, in order, each exactly once, including the corrected-in-place distinguisher trio and the derived vector string',
  (() => {
    const keys = Array.from(pkg.matchAll(/^  \('([a-z0-9_]+)',$/gm)).map((m) => m[1])
    const inline = Array.from(pkg.matchAll(/^  \('([a-z0-9_]+)',\s*$/gm)).map((m) => m[1])
    const expected = ['package', 'observed_at', 'executor',
      'runs_total', 'target_run_key', 'target_run_found', 'target_run_id', 'target_run_created_at',
      'target_run_dry_run', 'target_run_approved_for_delivery', 'target_run_sealed_at',
      'target_run_revoked_at', 'target_run_started_at', 'target_run_completed_at',
      'target_run_result_counts', 'target_run_product_approved_by', 'target_run_product_approved_at',
      'target_run_legal_approved_by', 'target_run_legal_approved_at', 'target_run_approval_rationale_md5',
      'run_items_total', 'target_run_items', 'target_run_exercise_members', 'target_run_alias_members',
      'items_outside_target_run', 'target_run_member_surface',
      'delivered_exercises_total', 'delivered_exercises_target_run',
      'delivered_aliases_total', 'delivered_aliases_target_run',
      'corrections_total', 'delivered_exercises_corrected_in_place',
      'delivered_exercises_not_corrected_in_place',
      'cat_logical', 'cat_snapshots', 'cat_muscles', 'cat_aliases', 'cat_name_claims',
      'cat_content', 'cat_expected_relationships', 'cat_relationships', 'cat_import_runs',
      'cat_run_items', 'cat_review_events', 'vector_string',
      'tenant_exercises', 'tenant_exercise_aliases',
      'delivery_predicate_rows', 'claims_orphaned', 'claims_unclaimed_bearers']
    if (expected.length !== 50) return false
    const found = keys.length >= inline.length ? keys : inline
    if (JSON.stringify(found) !== JSON.stringify(expected)) return false
    return recFlat.includes('FIFTY rows')
  })())
check('B9: the interpretation is PREDECLARED before any execution — zero provenance rows is stated as no-persistent-state-now and expressly NOT proof the RPC was never invoked (in the package header AND the record), nonzero is STOP-and-report with the who/when/path inference forbidden, posture contradictions are STOP, and the historical gaps remain historical',
  (() => {
    const s4 = rsec('## 4.', '## 5.')
    if (!s4.includes('NOT proof that deliver_catalog_exercises was never invoked')) return false
    if (!s4.includes('never infer who invoked anything, when any state arose, or by which path')) return false
    if (!s4.includes('STOP and report')) return false
    if (!s4.includes('remain HISTORICAL')) return false
    return pkgProse.includes('NOT proof that deliver_catalog_exercises was never invoked')
      && pkgProse.includes('never infer who invoked anything')
      && pkgProse.includes('those gaps remain historical regardless of these results')
  })())
check('B10: the exact-once law is one coherent contract — executed EXACTLY ONCE, consumed by the attempt regardless of outcome, any blocked or incomplete result is a recorded gap, NO manual re-run of an individual SELECT under the spent authorization, NO instrument substitution, and the single-result-set design makes one execution complete by construction',
  (() => {
    const s5 = rsec('## 5.', '## 6.')
    if (!s5.includes('EXACTLY ONCE')) return false
    if (!s5.includes('consumed by the attempt regardless of outcome')) return false
    if (!s5.includes('record the unavailable measurement as a gap')) return false
    if (!s5.includes('do NOT manually re-run an individual SELECT')) return false
    if (!s5.includes('fresh operator decision')) return false
    const s2 = rsec('## 2.', '## 3.')
    if (!s2.includes('ONE SELECT of fifty (metric, value) rows')) return false
    return pkg.includes('do NOT manually re-run an individual SELECT')
      && pkg.includes('execute this file EXACTLY ONCE')
  })())
check('B11: the operator preflight is complete WITH the justified absence of a backup precondition — project ref, at-the-gate sha re-measure, the reserved key, and the unspent check are required, while the mutation-only backup prerequisite is deliberately not inherited by this SELECT-only act',
  (() => {
    const s6 = rsec('## 6.', '## 7.')
    return s6.includes('re-measured at the gate')
      && s6.includes('ttybyljytiwntvorugcv')
      && s6.includes(RUN_KEY)
      && s6.includes('unspent')
      && s6.includes('DELIBERATELY NO HOSTED-BACKUP PRECONDITION')
      && s6.includes('SELECT-only inside a READ ONLY transaction')
      && pkg.includes('No hosted backup precondition')
  })())
check('B12: the proposal inheritance and boundary hold — the section-16 authorization of the accepted EXLIB-3A proposal is named as the SOLE issuance path and still reads PREPARED — NOT ISSUED — DELIBERATELY UNSENT in the proposal itself, one read-only advisor observation is scoped with no remediation, and the record\'s boundary lists every prohibited act with S6 STOPPED',
  (() => {
    if (!recFlat.includes("the EXLIB-3A proposal's section 16")) return false
    if (!recFlat.includes('PREPARED — NOT ISSUED — DELIBERATELY UNSENT')) return false
    const prop = read(PROPOSAL)
    const s16 = norm(prop.slice(prop.indexOf('## 16.'), prop.indexOf('## 17.')))
    if (!s16.includes('PREPARED — NOT ISSUED — DELIBERATELY UNSENT')) return false
    const s7 = rsec('## 7.', '## 8.')
    if (!s7.includes('exactly ONE read-only advisor observation')) return false
    if (!s7.includes('No advisor remediation')) return false
    const s11 = rsec('## 11.', '## 12.')
    return s11.includes('No Supabase contact, no Vercel contact, no hosted SQL execution')
      && s11.includes('S6 remains STOPPED')
  })())
check('B13: hygiene — the record\'s non-ASCII is the em-dash only, and no phase file carries the delivery environment-variable names contiguously, hosted endpoints, or credential material',
  (() => {
    for (const ch of rec) {
      const c = ch.codePointAt(0) as number
      if (c > 127 && c !== 0x2014) return false
      if (c < 32 && ch !== '\n') return false
    }
    const payload = PHASE_ADDS.map(read).join('\n')
    if (payload.includes(FLAG_VAR) || payload.includes(KEY_VAR)) return false
    const bads = ['supabase' + '.co', 'vercel' + '.com', 'postgres' + '://',
      'SUPABASE' + '_URL', 'SUPABASE' + '_SERVICE', 'api' + 'key', 'Bearer' + ' ', 'ey' + 'J']
    return !bads.some((b) => payload.includes(b))
  })())
// RETARGET (EXLIB-3A OPTION B hosted-measurement evidence): this
// preparation phase COMPLETED — the round-1 corrected candidate was
// Codex-approved, the operator issued and consumed the one-use
// OPTION B authorization, and the hosted measurement executed
// exactly once (SPENT) — so the topology claims are anchored at the
// phase's own corrected candidate, where they held and hold
// forever; the HEAD-relative form (and its uncommitted authoring
// branch) went stale at the evidence milestone's own commit, the
// same completed-phase pattern as every predecessor (fourteenth
// instance). Count-neutral: the suite still reports fourteen
// checks.
const MTIP = '3442c8f0f53f70ca367bfe10876dd3cd79fc8456'
check('B14: topology and retarget coverage (anchored at the corrected candidate) — the preserved round-0 measurement-preparation commit plus ONE plain forward round-1 correction over the accepted proposal candidate (single-parent chain 872e19ef -> ba6a6ca6 -> 3442c8f0), the CUMULATIVE diff carrying exactly the SQL package, this record, and this verifier plus ONLY the labeled X14 retarget, the correction touching ONLY the three Option-B paths, and verify-exlib3a.ts carrying the RETARGET (EXLIB-3A OPTION B measurement preparation) label anchored at the accepted candidate with its fourteen checks intact',
  (() => {
    try {
      const M0 = 'ba6a6ca6cf39d8fdc60a822e93413dd5cf7d1c1a'
      if (execSync(`git rev-list --count ${CAND}..${MTIP}`, { encoding: 'utf8' }).trim() !== '2') return false
      const p1 = execSync(`git rev-list --parents -n 1 ${MTIP}`, { encoding: 'utf8' }).trim().split(/\s+/)
      if (p1.length !== 2 || p1[1] !== M0) return false
      const p0 = execSync(`git rev-list --parents -n 1 ${M0}`, { encoding: 'utf8' }).trim().split(/\s+/)
      if (p0.length !== 2 || p0[1] !== CAND) return false
      const status = execSync(`git diff --name-status ${CAND} ${MTIP}`, { encoding: 'utf8' })
        .split('\n').filter(Boolean).sort()
      const expected = [
        ...PHASE_ADDS.map((p) => `A\t${p}`),
        ...RETARGETED.map((p) => `M\t${p}`),
      ].sort()
      if (JSON.stringify(status) !== JSON.stringify(expected)) return false
      const corr = execSync(`git diff --name-status ${M0} ${MTIP}`, { encoding: 'utf8' })
        .split('\n').filter(Boolean).sort()
      const corrExpected = [...PHASE_ADDS].sort().map((p) => `M\t${p}`)
      if (JSON.stringify(corr) !== JSON.stringify(corrExpected)) return false
      const x = read('scripts/verify-exlib3a.ts')
      if (!x.includes('RETARGET (EXLIB-3A OPTION B measurement preparation)')) return false
      if (!x.includes(`const CTIP = '${CAND}'`)) return false
      return (x.match(/^check\(/gm) || []).length === 14
    } catch { return false }
  })())

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
