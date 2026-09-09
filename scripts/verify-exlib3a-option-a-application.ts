// EXLIB-3A OPTION A APPLICATION verification (LOCAL-ONLY): the
// hosted ACTIVATION and POST-ACTIVATION OBSERVATION evidence — the
// operator-supplied platform and measurement results cross-checked
// mechanically against the delivery module's bytes, the reviewed
// measurement package, the promoted EXLIB-2U/2Z/Option-B records,
// and the reviewed activation runbook. Performs NO hosted contact;
// nothing is re-observed. The execution DEVIATION (two Production
// redeploys where one was specified) must be present and must not
// be rewritten as a single deployment event.
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

const PTIP = '73a2bc8c44c6260c096517e66090014f6af8ebc0'
const RECORD = 'docs/exlib3a-option-a-hosted-activation-record.md'
const VERIFIER = 'scripts/verify-exlib3a-option-a-application.ts'
const PHASE_ADDS = [RECORD, VERIFIER].sort()
const RETARGETED = ['scripts/verify-exlib3a-option-a.ts']
const SQLPKG = 'docs/exlib3a-option-b-current-state-measurement.sql'
const B_PREP = 'docs/exlib3a-option-b-current-state-measurement-prep-record.md'
const B_REC = 'docs/exlib3a-option-b-hosted-measurement-record.md'
const RUNBOOK = 'docs/exlib3a-option-a-activation-runbook.md'
const MODULE = 'src/lib/supabase/deliver-catalog.ts'
const U_PKG = 'docs/exlib2u-staged-run-package.sql'
const Z_REC = 'docs/exlib2z-hosted-application-record.md'
const U_REC = 'docs/exlib2u-hosted-application-record.md'

const DPL1 = 'dpl_9mMrn1CeQyESkKSVBA5DBYzEx9hh'
const DPL2 = 'dpl_2cB4gsmgrqEBDjqQ48hedQDExurr'
const BASE_SHA = '5ed6fd84ea81ce1b4ca768b44e036432d26c3ab8'
const OBSERVED_AT = '2026-09-09 15:54:55.316459+00'
const BASELINE_AT = '2026-09-09 02:27:31.8287+00'
const ZEROS = ['delivered_exercises_total', 'delivered_exercises_target_run',
  'delivered_aliases_total', 'delivered_aliases_target_run', 'corrections_total',
  'delivered_exercises_corrected_in_place', 'delivered_exercises_not_corrected_in_place']

const rec = read(RECORD)
const recFlat = norm(rec)
// The record's CLAIM SURFACE, which the negative pins scan. Two
// regions legitimately contain wording that is forbidden as a claim:
// the labeled QUOTATION of the reviewed specification in section 2
// (proven to be a genuine runbook quotation by C4) and the
// verifier-lifecycle section, which describes what these very pins
// reject. Excising them keeps the pins aimed at assertions about what
// occurred; the excisions are marker-bound and fail closed.
const excise = (s: string, a: string, b: string): string | null => {
  const i = s.indexOf(a)
  if (i < 0) return null
  const j = s.indexOf(b, i)
  if (j < 0) return null
  return s.slice(0, i) + s.slice(j)
}
const claimSurface = (() => {
  const one = excise(rec, 'WHAT THE REVIEWED ACT SPECIFIED:', 'WHAT OCCURRED:')
  if (one === null) return null
  const two = excise(one, '## 12.', '## 13.')
  if (two === null) return null
  return norm(two)
})()
const bprepFlat = norm(read(B_PREP))
const brecFlat = norm(read(B_REC))
const rbFlat = norm(read(RUNBOOK))
const sec = (a: string, b: string): string => {
  const s = rec.indexOf(a)
  const e = rec.indexOf(b, s < 0 ? 0 : s)
  return norm(rec.slice(s < 0 ? 0 : s, e < 0 ? rec.length : e))
}

console.log('EXLIB-3A OPTION A hosted-activation evidence verification (LOCAL-ONLY; BOTH authorizations SPENT; nothing re-observed, everything cross-checked)')

check('C1: both one-use grants are recorded SPENT with SEPARATE spent states — Authorization A consumed by the activation attempt regardless of outcome, Authorization M independently consumed by exactly one observation attempt with no retry, the two redeploys explicitly inside the SINGLE activation attempt creating no additional authorization, no further deployment authorized, and no hosted contact by Claude',
  (() => {
    const s1 = sec('## 1.', '## 2.')
    if (!s1.includes('CONSUMED BY THE ACTIVATION ATTEMPT REGARDLESS OF OUTCOME')) return false
    if (!s1.includes('INDEPENDENTLY CONSUMED BY THAT') || !s1.includes('EXECUTED EXACTLY ONCE')) return false
    if (!s1.includes('No retry occurred')) return false
    if (!s1.includes('WITHIN that single activation attempt')) return false
    if (!s1.includes('created no additional authorization')) return false
    if (!s1.includes('No further deployment event is authorized')) return false
    if (!s1.includes('Its spent state is not merged')) return false
    return recFlat.includes('BOTH AUTHORIZATIONS WERE CONSUMED BY THEIR RESPECTIVE ATTEMPTS AND ARE SPENT')
      && recFlat.includes('NEVER merged')
      && recFlat.includes('Claude performed no hosted contact of any kind')
      && recFlat.includes('no Vercel contact in any mode')
  })())
check('C2: the executed measurement package is byte-identical to the reviewed source — its live sha256 equals the fingerprint the Option-B PREPARATION RECORD pinned (extracted from those bytes, never restated), equals the blob at the reviewed Option-A candidate 73a2bc8c..., and is the value this record states with its exact byte count',
  (() => {
    try {
      const m = bprepFlat.match(/14,101 bytes, sha256 ([0-9a-f]{64})/)
      if (!m) return false
      if (sha256(SQLPKG) !== m[1]) return false
      if (readFileSync(SQLPKG).length !== 14101) return false
      const atTip = execSync(`git cat-file blob ${PTIP}:${SQLPKG} | shasum -a 256`, { encoding: 'utf8', shell: '/bin/bash' }).split(/\s+/)[0]
      if (atTip !== m[1]) return false
      return recFlat.includes(m[1]) && recFlat.includes('14,101 bytes')
        && recFlat.includes(`byte-identical live, at the Option-B candidate, and at the reviewed Option-A activation candidate ${PTIP}`)
    } catch { return false }
  })())
check('C3: THE DEVIATION is recorded as executed and never reconciled — both deployment ids present with both READY and both carrying the same source SHA, the reviewed exactly-ONE-deployment property named as NOT satisfied, the reason for the second redeploy expressly not inferred, and the record nowhere rewrites the sequence as one deployment event or claims the second redeploy was separately authorized',
  (() => {
    const s2 = sec('## 2.', '## 3.')
    if (!s2.includes(DPL1) || !s2.includes(DPL2)) return false
    if ((s2.match(/READY/g) || []).length < 2) return false
    if ((s2.match(new RegExp(BASE_SHA, 'g')) || []).length < 2) return false
    if (!s2.includes('the deployment-event count was TWO where the reviewed act specified ONE')) return false
    if (!s2.includes('does not rewrite the sequence as a single deployment')) return false
    if (!s2.includes('does not select one of the two')) return false
    if (!s2.includes('was NOT satisfied as written')) return false
    if (!s2.includes('did not state WHY the second redeploy occurred')) return false
    if (!s2.includes('NO inference about the reason')) return false
    if (!s2.includes('does NOT claim which of the two deployments first carried the activation configuration live')) return false
    if (!recFlat.includes('is NOT reconciled, merged, or rewritten into a single deployment event')) return false
    // negatives on the CLAIM SURFACE: no single-event rewrite, no
    // invented second authorization
    if (claimSurface === null) return false
    for (const bad of ['the single intended Production deployment event completed',
      'exactly one deployment event occurred', 'a single activation deployment event occurred',
      'the second redeploy was separately authorized', 'a second authorization']) {
      if (claimSurface.includes(bad)) return false
    }
    return true
  })())
check('C4: the reviewed act\'s single-deployment property is quoted from the RUNBOOK\'s own bytes (sections 3.B.6, 4, and state A4 all specify one intended deployment event), so the deviation is measured against reviewed text rather than recollection, and the deployed source SHA is pinned ANCHORED (a commit object, ancestor of the corrected candidate, base of exactly this seven-commit local-only chain) with the no-application-code property DERIVED from that range rather than read from the record',
  (() => {
    if (!rbFlat.includes('chosen so exactly ONE intended deployment activates the configuration')) return false
    if (!rbFlat.includes('THEN perform the single intended activation deployment event')) return false
    if (!rbFlat.includes('the single intended Production deployment event completed')) return false
    const s2 = sec('## 2.', '## 3.')
    if (!s2.includes('exactly ONE intended deployment activates the configuration')) return false
    if (!s2.includes('the single intended activation deployment event')) return false
    try {
      // ANCHORED, never branch-relative: the durable-closeout ruling
      // already retired one refs/heads/main pin as closeout-stale (see
      // the RETARGET note in scripts/verify-exlib2u-application.ts,
      // enforced by Z14), and the eventual consolidated closeout will
      // advance main past this base for exactly the same reason. The
      // deployed source is therefore pinned as a commit object and by
      // its position as the base of this local-only chain, which held
      // at execution time and holds forever — and is portable to a
      // fresh clone, where no local main exists at all.
      if (execSync(`git cat-file -t ${BASE_SHA}`, { encoding: 'utf8' }).trim() !== 'commit') return false
      execSync(`git merge-base --is-ancestor ${BASE_SHA} ${PTIP}`, { encoding: 'utf8' })
      if (execSync(`git rev-list --count ${BASE_SHA}..${PTIP}`, { encoding: 'utf8' }).trim() !== '7') return false
      // the no-application-code property is DERIVED from the deployed
      // base against the chain tip, not taken from the record's prose
      const paths = execSync(`git diff --name-only ${BASE_SHA} ${PTIP}`, { encoding: 'utf8' })
        .split('\n').filter(Boolean)
      if (paths.length === 0) return false
      if (!paths.every((p) => p.startsWith('docs/') || p.startsWith('scripts/'))) return false
    } catch { return false }
    return recFlat.includes('the durable production base of this whole EXLIB-3A chain')
      && recFlat.includes('no application code change entered production')
  })())
check('C5: the environment evidence is scoped and provenance-bounded — Production-only variable creation before the redeploy sequence with the scope attested by screenshots, Preview NOT modified, the exact hosted values recorded as operator-entered and NOT independently exposed by the connector, and the record expressly declining independent proof of the exact-string enablement value and the run-key literal',
  (() => {
    const s3 = sec('## 3.', '## 4.')
    if (!s3.includes('OPERATOR-CREATED WITH PRODUCTION-ONLY SCOPE before the redeploy sequence')) return false
    if (!s3.includes('scoped to Production only')) return false
    if (!s3.includes('OPERATOR-ENTERED EVIDENCE and are NOT independently exposed by the Vercel connector')) return false
    if (!s3.includes('does NOT carry independent mechanical proof')) return false
    if (!s3.includes('PREVIEW: not modified')) return false
    if (!s3.includes('BY CONSTRUCTION from the attested Production-only scope')) return false
    if (!s3.includes('a separate enumeration of Preview\'s variable list was not part of the handoff')) return false
    if (!s3.includes('Development delivery-variable posture was not addressed')) return false
    // the module's exact-string law is real, re-derived from bytes
    // (the committed comparison is against the double-quoted literal)
    const mod = read(MODULE)
    return mod.includes('=== "true"') && s3.includes('exactly the string true')
  })())
check('C6: the newly observed database-target posture is recorded with the runbook\'s PRE-COMMITTED consequence — Production and Preview resolving the same hosted project ShredOS ref ttybyljytiwntvorugcv means Preview is NOT database-isolated and a Preview canary REMAINS PROHIBITED, while the DEVELOPMENT posture stays UNOBSERVED and still governed in either direction',
  (() => {
    const s3 = sec('## 3.', '## 4.')
    if (!s3.includes('ttybyljytiwntvorugcv')) return false
    if (!s3.includes('PREVIEW IS THEREFORE NOT DATABASE-ISOLATED FROM PRODUCTION')) return false
    if (!s3.includes('using Preview as a canary REMAINS PROHIBITED')) return false
    if (!s3.includes('WAS NOT OBSERVED and remains UNOBSERVED')) return false
    if (!s3.includes('in either direction')) return false
    // the runbook genuinely pre-committed this consequence
    if (!rbFlat.includes('that observed fact must be recorded and using that environment as a canary remains PROHIBITED')) return false
    // no canary was invented, and no isolation is asserted
    for (const bad of ['Preview is database-isolated', 'Development is database-isolated',
      'a Preview canary was used', 'canary was performed']) {
      if (recFlat.includes(bad)) return false
    }
    return true
  })())
check('C7: the activation-order evidence is split honestly — the intra-variable creation order and the step-2 intermediate verification recorded NOT ESTABLISHED, while the safety property is shown to have held because BOTH variables preceded ANY redeploy and the reviewed runbook itself makes the deployment event the moment activation becomes live, with the fail-closed hazard grounded in the module\'s own missing-key branch',
  (() => {
    const s2 = sec('## 2.', '## 3.')
    if (!s2.includes('NOT ESTABLISHED by the handoff')) return false
    if (!s2.includes('intra-variable creation order')) return false
    if (!s2.includes('step 2 intermediate verification')) return false
    if (!s2.includes('no deployment event intervened between the two variable creations')) return false
    if (!s2.includes('NEVER carried live by any deployment event')) return false
    if (!s2.includes('SAFETY PROPERTY of section 4 held')) return false
    if (!s2.includes('recorded as NOT ESTABLISHED rather than as performed')) return false
    if (!rbFlat.includes('which is the moment activation becomes live')) return false
    const mod = read(MODULE)
    return mod.includes('failClosed') && s2.includes('fail-closed branch')
  })())
check('C8: the runtime observation preserves the TELEMETRY LIMITATION re-derived from module bytes — zero fail-closed lines and zero runtime error clusters over the observed two-hour window, the module\'s ONLY console call being its fail-closed error (verified by counting console calls in the module), no success telemetry claimed, and the zero count read in BOTH directions (it rules out the observed failing-closed class; it is NOT affirmative proof the app path executed or that the configuration is ON)',
  (() => {
    const s4 = sec('## 4.', '## 5.')
    if (!s4.includes('deliverCatalog failed closed log lines = 0')) return false
    if (!s4.includes('runtime error clusters = 0')) return false
    if (!s4.includes('two-hour window')) return false
    if (!s4.includes('NO success-telemetry instrument exists')) return false
    if (!s4.includes('none is claimed or invented')) return false
    if (!s4.includes('DOES rule out the observed failing-closed class')) return false
    if (!s4.includes('NOT affirmative proof that the application path executed')) return false
    if (!s4.includes('NOT proof that the configuration is ON')) return false
    if (!s4.includes('never counts alone')) return false
    const mod = read(MODULE)
    if ((mod.match(/console\./g) || []).length !== 1) return false
    return mod.includes('console.error(`deliverCatalog failed closed')
  })())
check('C9: the persistent-state measurement is complete on the provenance surfaces and compared without extension — all SEVEN surfaces exactly 0 at the pinned observed_at, every metric name stated in that section a REAL key of the executed package\'s own bytes (no invented metric), NO MOVEMENT against the promoted pre-activation baseline, and the pre-declared interpretation preserved (not proof the RPC was never invoked; no who, no when, no path; historical gaps not retroactively closed)',
  (() => {
    const s5 = sec('## 5.', '## 6.')
    for (const z of ZEROS) { if (!s5.includes(`${z} = 0`)) return false }
    if (!s5.includes(`observed_at = ${OBSERVED_AT}`)) return false
    if (!s5.includes('TRANSACTION-START timestamp')) return false
    const pkg = read(SQLPKG)
    const keys = new Set(Array.from(pkg.matchAll(/^ {2}\('([a-z0-9_]+)',$/gm)).map((m) => m[1]))
    if (keys.size !== 50) return false
    const raw = rec.slice(rec.indexOf('## 5.'), rec.indexOf('## 6.'))
    const named = Array.from(raw.matchAll(/^- ([a-z_][a-z0-9_]*)(?: = |:)/gm)).map((m) => m[1])
    if (named.length < 20) return false
    for (const n of named) { if (!keys.has(n)) return false }
    if (!s5.includes(`Option-B measurement at ${BASELINE_AT} returned all seven provenance surfaces at exactly 0`)) return false
    if (!s5.includes('NO MOVEMENT on any measured provenance surface')) return false
    if (!s5.includes('DOES NOT prove the delivery RPC was never invoked or attempted')) return false
    if (!s5.includes('no who, no when, and no path')) return false
    if (!s5.includes('remain HISTORICAL and are not retroactively closed')) return false
    if (!s5.includes('no metric is filled in from the earlier measurement or from expectation')) return false
    // the baseline really did read all seven zero in the promoted record
    for (const z of ZEROS) { if (!brecFlat.includes(`${z} = 0`)) return false }
    return true
  })())
check('C10: the run posture and invariants are CROSS-RECORD exact — the surrogate equals the promoted EXLIB-2U record\'s hosted id, the seal instant equals the promoted EXLIB-2Z record\'s instant by parse, every posture and invariant value equals the promoted Option-B baseline, and the member surface is OPERATOR-ATTESTED against the governed six-member expectation whose lines are cross-checked against the EXLIB-2U staging package\'s own bytes, never verbatim-captured',
  (() => {
    const s5 = sec('## 5.', '## 6.')
    const idm = norm(read(U_REC)).match(/hosted id ([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/)
    if (!idm) return false
    if (!s5.includes(`target_run_id = ${idm[1]}`)) return false
    const zm = norm(read(Z_REC)).match(/(2026-09-08T21:24:23\.\d+Z)/)
    if (!zm) return false
    if (Date.parse('2026-09-08 21:24:23.744781+00'.replace(' ', 'T').replace('+00', 'Z')) !== Date.parse(zm[1])) return false
    const posture = ['runs_total = 1', 'target_run_found = 1', 'target_run_dry_run = false',
      'target_run_approved_for_delivery = true',
      'target_run_sealed_at = 2026-09-08 21:24:23.744781+00',
      'target_run_revoked_at = <null-or-absent>', 'target_run_items = 6',
      'target_run_exercise_members = 3', 'target_run_alias_members = 3',
      'items_outside_target_run = 0', 'vector_string = 3/3/5/3/6/1/2/2/1/6/3',
      'tenant_exercises = 84', 'tenant_exercise_aliases = 0',
      'delivery_predicate_rows = 1', 'claims_orphaned = 0', 'claims_unclaimed_bearers = 0']
    for (const p of posture) {
      if (!s5.includes(p)) return false
      if (!brecFlat.includes(p)) return false
    }
    if (!s5.includes('OPERATOR-ATTESTED AS RETURNED EXACTLY AS EXPECTED')) return false
    if (!s5.includes('the verbatim returned string was not restated in the operator handoff')) return false
    const upkg = read(U_PKG)
    for (const line of ["'alias#e21b2c00-0000-4000-a000-000000000001#Forearm plank'",
      "'alias#e21b2c00-0000-4000-a000-000000000001#Front plank'",
      "'alias#e21b2c00-0000-4000-a000-000000000003#Ab roller rollout'",
      "'exercise#e21b2c00-0000-4000-a000-000000000001'",
      "'exercise#e21b2c00-0000-4000-a000-000000000002'",
      "'exercise#e21b2c00-0000-4000-a000-000000000003'"]) {
      if (!upkg.includes(line)) return false
      if (!s5.includes(line.replace(/'/g, ''))) return false
    }
    return sec('## 8.', '## 9.').includes('NEVER as a verbatim capture')
  })())
check('C11: the classification is the EXACT reviewed observable-state name, recorded against the current promoted deployment with the deviation disclosed and NOT absorbed, and all FOUR inference prohibitions are explicit (no request history, no invocation history, no successful app-path delivery, no mechanism) with the standing direct-RPC competing writer named and the classic overclaims absent from the whole record',
  (() => {
    const STATE = 'ACTIVATION CONFIG LIVE / NO PERSISTENT DELIVERY STATE OBSERVED'
    if (!recFlat.includes(STATE)) return false
    if (!rbFlat.includes(STATE)) return false
    const s6 = sec('## 6.', '## 7.')
    if (!s6.includes(DPL2)) return false
    if (!s6.includes('disclosed and NOT absorbed into this classification')) return false
    for (const k of ['REQUEST HISTORY', 'INVOCATION HISTORY', 'SUCCESSFUL APP-PATH DELIVERY', 'MECHANISM']) {
      if (!s6.includes(k)) return false
    }
    if (!s6.includes('competing lawful writer')) return false
    if (claimSurface === null) return false
    for (const bad of ['no qualifying request has arrived', 'by the activation timeline',
      'attributable in aggregate to the app path', 'proves the app path',
      'delivery succeeded', 'successful delivery occurred', 'the RPC was invoked',
      'no invocation occurred', 'the app path was exercised']) {
      if (claimSurface.includes(bad)) return false
    }
    return true
  })())
check('C12: the STOP evaluation covers every reviewed post-activation condition against the attested evidence, the near-miss during-activation condition is evaluated WITHOUT self-adjudicating the deviation, no rollback was executed (no F1, no F2; mechanism 1 unexercised and moot; database rollback, revocation and restore excluded), and the bounded decision implication authorizes NO new protected action',
  (() => {
    const s7 = sec('## 7.', '## 8.')
    if ((s7.match(/NOT TRIGGERED/g) || []).length < 6) return false
    for (const k of ['fail-closed failures across the window', 'persistent delivery-state movement',
      'Unexpected run posture', 'Claims invariant nonzero', 'tenant-count movement',
      'migration 026', 'cannot distinguish whether the Production activation']) {
      if (!s7.includes(k)) return false
    }
    if (!s7.includes('COUNT deviation from the reviewed act')) return false
    if (!s7.includes('did not enumerate as a condition of its own')) return false
    if (!s7.includes('DOES NOT SELF-ADJUDICATE THE DEVIATION')) return false
    if (!s7.includes('NO ROLLBACK WAS EXECUTED')) return false
    if (!s7.includes('no F1, no F2')) return false
    if (!s7.includes('went unexercised')) return false
    if (!s7.includes('database rollback, revocation, and restore were excluded unconditionally')) return false
    const s10 = sec('## 10.', '## 11.')
    if (!s10.includes('SUPPORTS ACCEPTING THE ACTIVATION OPERATIONALLY WITH NO ROLLBACK')) return false
    if (!s10.includes('THIS EVIDENCE RECORD ITSELF AUTHORIZES NO NEW PROTECTED ACTION')) return false
    if (!s10.includes('requires its own new explicit one-use human authorization')) return false
    return recFlat.includes('THIS RECORD AUTHORIZES NO NEW PROTECTED ACTION')
      && sec('## 14.', '￿').includes('Both Authorization A and Authorization M are SPENT and neither can be re-used')
  })())
check('C13: the boundary and the provenance map are complete and hygiene holds — no Claude hosted contact in any mode, one measurement attempt with no instrument substitution, no push or tag with main = origin/main unchanged, the provenance map carrying a NOT OBSERVED class, the record\'s non-ASCII limited to the em-dash, and no phase file carrying a contiguous delivery or Supabase variable name, hosted endpoint, or credential material',
  (() => {
    const s11 = sec('## 11.', '## 12.')
    if (!s11.includes('no Vercel contact in any mode including read-only')) return false
    if (!s11.includes('no estimate or metadata instrument was substituted')) return false
    if (!s11.includes('remains UNPUSHED with main = origin/main')) return false
    if (!s11.includes('No advisor observation was taken in this milestone')) return false
    const s8 = sec('## 8.', '## 9.')
    if (!s8.includes('NOT OBSERVED')) return false
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
check('C14: the chronology orders by parse (creation < seal < pre-activation measurement < advisor < this measurement) with the un-supplied deployment instants disclosed as a parse gap, and topology holds anchored at the reviewed candidate — TWO PLAIN FORWARD commits over 73a2bc8c... (the evidence commit, then one honest correction commit; every commit in the range single-parent, never an amend or rebase) whose union carries exactly this record and this verifier plus ONLY the labeled sixteenth-instance retarget, with verify-exlib3a-option-a.ts anchored at that candidate and its SIXTEEN checks intact',
  (() => {
    const staging = Date.parse('2026-09-08T05:26:09.940165Z')
    const seal = Date.parse('2026-09-08T21:24:23.744781Z')
    const base = Date.parse(BASELINE_AT.replace(' ', 'T').replace('+00', 'Z'))
    const adv = Date.parse('2026-09-09T02:27:38.675Z')
    const obs = Date.parse(OBSERVED_AT.replace(' ', 'T').replace('+00', 'Z'))
    for (const t of [staging, seal, base, adv, obs]) { if (!Number.isFinite(t)) return false }
    if (!(staging < seal && seal < base && base < adv && adv < obs)) return false
    const s9 = sec('## 9.', '## 10.')
    if (!s9.includes('DEPLOYMENT INSTANTS WERE NOT SUPPLIED')) return false
    if (!s9.includes('NOT proven by parse in this record')) return false
    try {
      const LABEL = 'RETARGET (EXLIB-3A OPTION A hosted-activation evidence)'
      const t = read(RETARGETED[0])
      if (!t.includes(LABEL)) return false
      if (!t.includes(`const PTIP = '${PTIP}'`)) return false
      if ((t.match(/^ {0,2}check\(/gm) || []).length !== 16) return false
      const PORCELAIN = execSync('git status --porcelain', { encoding: 'utf8' }).split('\n').filter(Boolean)
      const CHANGED = PORCELAIN.map((l) => l.slice(3).trim()).sort()
      if (CHANGED.length > 0) {
        return CHANGED.every((p) => PHASE_ADDS.includes(p) || RETARGETED.includes(p))
      }
      // PLAIN FORWARD ONLY: the phase landed as two commits — the
      // evidence commit, then one honest correction commit after the
      // sweep's own control arm showed section 13 had understated the
      // sweep's reds. The standing rule forbids amend/rebase/squash,
      // so the correction is a successor, never a rewrite; every
      // commit in the range is therefore asserted single-parent.
      execSync(`git merge-base --is-ancestor ${PTIP} HEAD`, { encoding: 'utf8' })
      const range = execSync(`git rev-list --parents ${PTIP}..HEAD`, { encoding: 'utf8' })
        .split('\n').filter(Boolean).map((l) => l.trim().split(/\s+/))
      if (range.length !== 2) return false
      if (!range.every((p) => p.length === 2)) return false
      if (range[range.length - 1][1] !== PTIP) return false
      const status = execSync(`git diff --name-status ${PTIP} HEAD`, { encoding: 'utf8' })
        .split('\n').filter(Boolean).sort()
      const expected = [
        ...PHASE_ADDS.map((p) => `A\t${p}`),
        ...RETARGETED.map((p) => `M\t${p}`),
      ].sort()
      return JSON.stringify(status) === JSON.stringify(expected)
    } catch { return false }
  })())

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
