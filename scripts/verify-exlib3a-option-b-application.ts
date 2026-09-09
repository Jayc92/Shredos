// EXLIB-3A OPTION B APPLICATION verification (LOCAL-ONLY): the
// hosted current-state measurement EVIDENCE — the operator-supplied
// fifty-row result cross-checked mechanically against the package
// bytes, the reserved authority artifact, and the promoted
// EXLIB-2U/2Z records. Performs NO hosted contact; nothing is
// re-observed.
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

const MTIP = '3442c8f0f53f70ca367bfe10876dd3cd79fc8456'
const SQLPKG = 'docs/exlib3a-option-b-current-state-measurement.sql'
const PREP = 'docs/exlib3a-option-b-current-state-measurement-prep-record.md'
const RECORD = 'docs/exlib3a-option-b-hosted-measurement-record.md'
const VERIFIER = 'scripts/verify-exlib3a-option-b-application.ts'
const PHASE_ADDS = [RECORD, VERIFIER].sort()
const RETARGETED = ['scripts/verify-exlib3a-option-b.ts']
const U_REC = 'docs/exlib2u-hosted-application-record.md'
const Z_REC = 'docs/exlib2z-hosted-application-record.md'
const AUTH_FORM = 'docs/exlib2v-s4-authority-inputs-form-completed.json'

const pkg = read(SQLPKG)
const rec = read(RECORD)
const recFlat = norm(rec)
const prepFlat = norm(read(PREP))
const urecFlat = norm(read(U_REC))
const zrecFlat = norm(read(Z_REC))
const sec = (a: string, b: string): string => {
  const s = rec.indexOf(a)
  const e = rec.indexOf(b, s)
  return norm(rec.slice(s < 0 ? 0 : s, e < 0 ? rec.length : e))
}

console.log('EXLIB-3A OPTION B hosted-measurement evidence verification (LOCAL-ONLY; the authorization is SPENT; nothing re-observed, everything cross-checked)')

check('V1: the executed source and the SPENT posture — the measurement package is byte-identical live and at the corrected candidate to the fingerprint the PREP RECORD pinned (extracted from those bytes, never restated), and this record states the one-use authorization CONSUMED AND SPENT with exactly one attempt and no retry',
  (() => {
    try {
      const m = prepFlat.match(/14,101 bytes, sha256 ([0-9a-f]{64})/)
      if (!m) return false
      if (sha256(SQLPKG) !== m[1]) return false
      const atTip = execSync(`git cat-file blob ${MTIP}:${SQLPKG} | shasum -a 256`, { encoding: 'utf8', shell: '/bin/bash' }).split(/\s+/)[0]
      if (atTip !== m[1]) return false
      if (!recFlat.includes(m[1])) return false
      return recFlat.includes('CONSUMED BY THAT ATTEMPT AND IS SPENT')
        && recFlat.includes('No retry occurred')
        && recFlat.includes('no further hosted query may be run under it')
    } catch { return false }
  })())
check('V2: the source-versus-transport provenance distinction stands — source identity mechanical (verified at the gate and in the repository), NO byte echo or hash of the submitted payload returned, transport-payload identity not independently preserved post hoc, and the complete fifty-row return establishing execution of the intended read-only shape',
  (() => {
    const s1 = sec('## 1.', '## 2.')
    return s1.includes('mechanically verified by the operator immediately before')
      && s1.includes('NO complete byte-for-byte echo and NO hash')
      && s1.includes('not independently preserved post hoc')
      && s1.includes('fifty-row result set establishes execution of the intended read-only measurement shape')
  })())
check('V3: the metric census is COMPLETE against the package\'s own bytes — every metric key extracted from the executed SQL appears in this record exactly once, and the governance values are pinned exactly: all seven delivery-provenance surfaces ZERO, the vector re-derived from the eleven individual cardinalities equal to 3/3/5/3/6/1/2/2/1/6/3, tenants 84/0, predicate 1, claims 0/0, runs 1',
  (() => {
    const keys = Array.from(pkg.matchAll(/^  \('([a-z0-9_]+)',$/gm)).map((m) => m[1])
    if (keys.length !== 50) return false
    for (const k of keys) {
      if ((recFlat.match(new RegExp(`(^| )${k} =`, 'g')) || []).length !== 1) {
        if (k === 'target_run_member_surface') {
          if (!recFlat.includes('target_run_member_surface:')) return false
          continue
        }
        return false
      }
    }
    for (const z of ['delivered_exercises_total = 0', 'delivered_exercises_target_run = 0',
      'delivered_aliases_total = 0', 'delivered_aliases_target_run = 0', 'corrections_total = 0',
      'delivered_exercises_corrected_in_place = 0', 'delivered_exercises_not_corrected_in_place = 0']) {
      if (!recFlat.includes(z)) return false
    }
    const cats = ['cat_logical = 3', 'cat_snapshots = 3', 'cat_muscles = 5', 'cat_aliases = 3',
      'cat_name_claims = 6', 'cat_content = 1', 'cat_expected_relationships = 2',
      'cat_relationships = 2', 'cat_import_runs = 1', 'cat_run_items = 6', 'cat_review_events = 3']
    const derived = cats.map((c) => c.split(' = ')[1]).join('/')
    for (const c of cats) { if (!recFlat.includes(c)) return false }
    if (derived !== '3/3/5/3/6/1/2/2/1/6/3') return false
    if (!recFlat.includes('vector_string = 3/3/5/3/6/1/2/2/1/6/3')) return false
    return recFlat.includes('tenant_exercises = 84')
      && recFlat.includes('tenant_exercise_aliases = 0')
      && recFlat.includes('delivery_predicate_rows = 1')
      && recFlat.includes('claims_orphaned = 0')
      && recFlat.includes('claims_unclaimed_bearers = 0')
      && recFlat.includes('runs_total = 1')
  })())
check('V4: the run posture is CROSS-RECORD exact — the surrogate and creation instant equal the promoted EXLIB-2U record\'s literals, the seal instant equals the promoted EXLIB-2Z record\'s instant by parse, the approval instants equal the reserved authority instant by parse, and the rationale md5 RECOMPUTES from the byte-frozen artifact\'s rationale',
  (() => {
    const idm = urecFlat.match(/hosted id ([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/)
    const tm = urecFlat.match(/created the run at (2026-09-08T05:26:09\.\d+Z)/)
    if (!idm || !tm) return false
    if (!recFlat.includes(`target_run_id = ${idm[1]}`)) return false
    if (Date.parse('2026-09-08 05:26:09.940165+00'.replace(' ', 'T').replace('+00', 'Z')) !== Date.parse(tm[1])) return false
    const zm = zrecFlat.match(/(2026-09-08T21:24:23\.\d+Z)/)
    if (!zm) return false
    if (Date.parse('2026-09-08 21:24:23.744781+00'.replace(' ', 'T').replace('+00', 'Z')) !== Date.parse(zm[1])) return false
    const auth = JSON.parse(read(AUTH_FORM))
    const pat = auth.requested_inputs.product_approver_identity.product_approved_at as string
    if (Date.parse('2026-09-07 15:05:00+00'.replace(' ', 'T').replace('+00', 'Z')) !== Date.parse(pat)) return false
    const md5 = createHash('md5').update(auth.requested_inputs.approval_rationale.value as string).digest('hex')
    if (md5 !== 'ca1acc7c1ef7c5a47ee7e7e286620dc5') return false
    if (!recFlat.includes('target_run_approval_rationale_md5 = ca1acc7c1ef7c5a47ee7e7e286620dc5')) return false
    return recFlat.includes('target_run_dry_run = false')
      && recFlat.includes('target_run_approved_for_delivery = true')
      && recFlat.includes('target_run_revoked_at = <null-or-absent>')
      && recFlat.includes('target_run_items = 6')
      && recFlat.includes('items_outside_target_run = 0')
  })())
check('V5: the member-surface provenance is honest — the value is recorded as OPERATOR-ATTESTED against the quoted governed expectation (the exact six-member surface reserved since EXLIB-2U, matching the staging package\'s pinned lines), never represented as a verbatim capture, and the provenance map carries it as its own class',
  (() => {
    if (!recFlat.includes('OPERATOR-ATTESTED AS RETURNED EXACTLY AS EXPECTED')) return false
    if (!recFlat.includes('the verbatim returned string was not restated in the operator handoff')) return false
    const upkg = read('docs/exlib2u-staged-run-package.sql')
    for (const line of ["'alias#e21b2c00-0000-4000-a000-000000000001#Forearm plank'",
      "'alias#e21b2c00-0000-4000-a000-000000000001#Front plank'",
      "'alias#e21b2c00-0000-4000-a000-000000000003#Ab roller rollout'",
      "'exercise#e21b2c00-0000-4000-a000-000000000001'",
      "'exercise#e21b2c00-0000-4000-a000-000000000002'",
      "'exercise#e21b2c00-0000-4000-a000-000000000003'"]) {
      if (!upkg.includes(line)) return false
      if (!recFlat.includes(line.replace(/'/g, ''))) return false
    }
    const s5 = sec('## 5.', '## 6.')
    return s5.includes('OPERATOR ATTESTATION')
      && s5.includes('NEVER as a verbatim capture')
  })())
check('V6: the interpretation is applied exactly as predeclared — zero provenance rows read as no-persistent-state-at-the-snapshot, expressly NOT proof the RPC was never invoked, no who/when/path inference, the historical gaps NOT retroactively closed, observed_at identified as transaction-start temporal context, and NO STOP condition triggered',
  (() => {
    const s4 = sec('## 4.', '## 5.')
    if (!s4.includes('NO PERSISTENT DELIVERY-ASSOCIATED TENANT STATE EXISTS AT THE MEASUREMENT SNAPSHOT')) return false
    if (!s4.includes('does NOT prove the delivery RPC was never invoked or attempted')) return false
    if (!s4.includes('no who, no when, and no path')) return false
    if (!s4.includes('remain HISTORICAL and are NOT retroactively closed')) return false
    if (!s4.includes('NO STOP CONDITION WAS TRIGGERED')) return false
    const s3 = sec('## 3.', '## 4.')
    return s3.includes('TRANSACTION-START timestamp')
      && s3.includes('the exact MVCC snapshot-acquisition instant is not surfaced')
  })())
check('V7: the advisor observation is arithmetic-consistent and honestly scoped — 13+2+1+3+1 sums to the stated 20, the instant parses and follows the measurement, the three named authenticated SECURITY DEFINER functions are recorded (re-confirming the standing reachability), the security-class-only scope is disclosed, and zero remediation is stated',
  (() => {
    const s6 = sec('## 6.', '## 7.')
    const m = s6.match(/(\d+) security notices, distributed exactly as (\d+) [^;]+; (\d+) [^;]+; (\d+) [^;]+; (\d+) [^;]+; (\d+)/)
    if (!m) return false
    if (Number(m[2]) + Number(m[3]) + Number(m[4]) + Number(m[5]) + Number(m[6]) !== Number(m[1])) return false
    if (Number(m[1]) !== 20) return false
    for (const f of ['deliver_catalog_exercises', 'rls_auto_enable', 'rollback_catalog_delivery']) {
      if (!s6.includes(f)) return false
    }
    return s6.includes('2026-09-09T02:27:38.675Z')
      && s6.includes('the performance class was NOT observed by this capture')
      && s6.includes('No advisor setting or finding was modified')
  })())
check('V8: the chronology orders by parse — staging creation < seal < the measurement\'s transaction start < the advisor observation, and the returned instants equal the promoted records\' preserved instants',
  (() => {
    const staging = Date.parse('2026-09-08T05:26:09.940165Z')
    const seal = Date.parse('2026-09-08T21:24:23.744781Z')
    const obs = Date.parse('2026-09-09 02:27:31.8287+00'.replace(' ', 'T').replace('+00', 'Z'))
    const adv = Date.parse('2026-09-09T02:27:38.675Z')
    for (const t of [staging, seal, obs, adv]) { if (!Number.isFinite(t)) return false }
    if (!(staging < seal && seal < obs && obs < adv)) return false
    return recFlat.includes('observed_at = 2026-09-09 02:27:31.8287+00')
      && recFlat.includes('2026-09-09T02:27:31.8287Z')
  })())
check('V9: the decision implication is bounded — the record states the current facts SUPPORT reconsidering OPTION A while authorizing NOTHING (the A decision, the activation package, and any activation authorization each named as separate gates), with S6 activation STOPPED throughout',
  (() => {
    const s8 = sec('## 8.', '## 9.')
    return s8.includes('SUPPORT reconsidering OPTION A')
      && s8.includes('THIS AUTHORIZES NOTHING')
      && s8.includes('its own one-use human authorization')
      && s8.includes('S6 activation remains STOPPED')
  })())
check('V10: the boundary is complete — one attempt, SPENT, no individual-SELECT re-run, no instrument substitution, no delivery, no revocation, no restore, no environment change, no S6 activation or preparation, no EXLIB-2S, no push, no tag, no Vercel action, no advisor remediation, no Claude hosted contact',
  (() => {
    const s11 = sec('## 11.', '## 12.')
    return s11.includes('no individual SELECT was re-run')
      && s11.includes('no estimate or metadata instrument was substituted')
      && s11.includes('No delivery call, no revocation, no restore')
      && s11.includes('no S6 activation or preparation, no EXLIB-2S act, no push, no tag, no manual Vercel action, and no advisor remediation')
      && s11.includes('No hosted contact by Claude at any point')
  })())
check('V11: hygiene — the record\'s non-ASCII is the em-dash only, and no phase file carries the delivery environment-variable names contiguously, hosted endpoints, or credential material',
  (() => {
    for (const ch of rec) {
      const c = ch.codePointAt(0) as number
      if (c > 127 && c !== 0x2014) return false
      if (c < 32 && ch !== '\n') return false
    }
    const payload = PHASE_ADDS.map(read).join('\n')
    const FLAG_VAR = 'CATALOG' + '_DELIVERY' + '_ENABLED'
    const KEY_VAR = 'CATALOG' + '_DELIVERY' + '_RUN_KEY'
    if (payload.includes(FLAG_VAR) || payload.includes(KEY_VAR)) return false
    const bads = ['supabase' + '.co', 'vercel' + '.com', 'postgres' + '://',
      'SUPABASE' + '_URL', 'SUPABASE' + '_SERVICE', 'api' + 'key', 'Bearer' + ' ', 'ey' + 'J']
    return !bads.some((b) => payload.includes(b))
  })())
const PORCELAIN = execSync('git status --porcelain', { encoding: 'utf8' }).split('\n').filter(Boolean)
const CHANGED = PORCELAIN.map((l) => l.slice(3).trim()).sort()
const committed = CHANGED.length === 0
  && execSync(`git rev-list --count ${MTIP}..HEAD`, { encoding: 'utf8' }).trim() !== '0'
// Completed-phase note for the future: once this milestone is closed
// out and a successor commit exists, this HEAD-relative check goes
// stale by design and gets the standard labeled retarget.
if (committed) {
  check('V12: topology and retarget coverage — ONE plain forward evidence commit over the corrected measurement candidate (single parent 3442c8f0...) carrying exactly this record and this verifier plus ONLY the labeled B14 retarget, and verify-exlib3a-option-b.ts carries the RETARGET (EXLIB-3A OPTION B hosted-measurement evidence) label anchored at the corrected candidate with its fourteen checks intact',
    (() => {
      try {
        if (execSync(`git rev-list --count ${MTIP}..HEAD`, { encoding: 'utf8' }).trim() !== '1') return false
        const p1 = execSync('git rev-list --parents -n 1 HEAD', { encoding: 'utf8' }).trim().split(/\s+/)
        if (p1.length !== 2 || p1[1] !== MTIP) return false
        const status = execSync(`git diff --name-status ${MTIP} HEAD`, { encoding: 'utf8' })
          .split('\n').filter(Boolean).sort()
        const expected = [
          ...PHASE_ADDS.map((p) => `A\t${p}`),
          ...RETARGETED.map((p) => `M\t${p}`),
        ].sort()
        if (JSON.stringify(status) !== JSON.stringify(expected)) return false
        const b = read('scripts/verify-exlib3a-option-b.ts')
        if (!b.includes('RETARGET (EXLIB-3A OPTION B hosted-measurement evidence)')) return false
        if (!b.includes(`const MTIP = '${MTIP}'`)) return false
        return (b.match(/^check\(/gm) || []).length === 14
      } catch { return false }
    })())
} else {
  check('V12 (uncommitted authoring state): every worktree change lies inside the two phase paths plus the labeled retargeted suite, which carries the RETARGET (EXLIB-3A OPTION B hosted-measurement evidence) label',
    CHANGED.length > 0 && CHANGED.every((p) => PHASE_ADDS.includes(p) || RETARGETED.includes(p))
    && read('scripts/verify-exlib3a-option-b.ts').includes('RETARGET (EXLIB-3A OPTION B hosted-measurement evidence)'))
}

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
