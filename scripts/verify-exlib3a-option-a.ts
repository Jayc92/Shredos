// EXLIB-3A OPTION A verification (LOCAL-ONLY): the controlled S6
// activation package — the exact future protected act bound to
// repository bytes, the inherited Option-B evidence, and the TWO
// drafted-unsent one-use grants (round-1 corrected: unobserved
// Preview/Development database posture, preflight-before-
// authorization chronology, observable-state evidence semantics,
// the A/M grant split, and the pinned runbook fingerprint).
// Performs NO hosted contact and activates nothing.
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

const ETIP = 'd4703187e1f52cdeda17d003023f8eb14e654480'
const RUNBOOK = 'docs/exlib3a-option-a-activation-runbook.md'
const PREP = 'docs/exlib3a-option-a-activation-prep-record.md'
const VERIFIER = 'scripts/verify-exlib3a-option-a.ts'
const MODULE = 'src/lib/supabase/deliver-catalog.ts'
const OB_REC = 'docs/exlib3a-option-b-hosted-measurement-record.md'
const PHASE_ADDS = [RUNBOOK, PREP, VERIFIER].sort()
const RETARGETED = ['scripts/verify-exlib3a-option-b-application.ts']
const RUN_KEY = 'exlib2u-plank-release1-staged-v1'
const FLAG_VAR = 'CATALOG' + '_DELIVERY' + '_ENABLED'
const KEY_VAR = 'CATALOG' + '_DELIVERY' + '_RUN_KEY'
const TIMEOUT_VAR = 'CATALOG' + '_DELIVERY' + '_TIMEOUT_MS'

const rb = read(RUNBOOK)
const rbFlat = norm(rb)
const mod = read(MODULE)
const obFlat = norm(read(OB_REC))
const sec = (a: string, b: string): string => {
  const s = rb.indexOf(a)
  const e = rb.indexOf(b, s)
  return norm(rb.slice(s < 0 ? 0 : s, e < 0 ? rb.length : e))
}

console.log('EXLIB-3A OPTION A activation-package verification (LOCAL-ONLY; PREPARATION ONLY; S6 STOPPED; both section-12 grants — AUTHORIZATION A and AUTHORIZATION M — are UNSENT)')

check('A1: the inherited Option-B baseline is CROSS-EXTRACTED from the promoted evidence-record bytes — the zero provenance surfaces, the sealed posture, the surrogate, the vector, tenants, predicate, and claims all appear in the runbook exactly as the evidence record preserves them, with the SPENT and historical-gap statements intact',
  (() => {
    for (const f of ['delivered_exercises_total = 0', 'corrections_total = 0',
      'target_run_id = 6669ba78-8e75-4042-ac2a-14082a9e5940',
      'vector_string = 3/3/5/3/6/1/2/2/1/6/3', 'tenant_exercises = 84',
      'delivery_predicate_rows = 1']) {
      if (!obFlat.includes(f)) return false
    }
    const s0 = sec('## 0.', '## 1.')
    return s0.includes(ETIP)
      && s0.includes('6669ba78-8e75-4042-ac2a-14082a9e5940')
      && s0.includes('sealed_at 2026-09-08 21:24:23.744781+00')
      && s0.includes('3/3/5/3/6/1/2/2/1/6/3')
      && s0.includes('not proof the RPC was never invoked')
      && s0.includes('The one-use Option-B authorization is SPENT')
      && s0.includes('historical S5 post-COMMIT gaps remain historical')
  })())
check('A2: the two variables are RE-DERIVED from module bytes, not recalled — the module reads exactly three process.env names, the runbook\'s fragment concatenations equal the derived enablement and run-key names, the timeout knob is explicitly excluded, and NO phase file carries either contiguous name (the 2T carrier census is preserved)',
  (() => {
    const derived = Array.from(new Set(Array.from(mod.matchAll(/process\.env\.([A-Z_]+)/g)).map((m) => m[1]))).sort()
    if (JSON.stringify(derived) !== JSON.stringify([FLAG_VAR, KEY_VAR, TIMEOUT_VAR].sort())) return false
    if (!rbFlat.includes('CATALOG + _DELIVERY + _ENABLED')) return false
    if (!rbFlat.includes('CATALOG + _DELIVERY + _RUN_KEY')) return false
    if ('CATALOG' + '_DELIVERY' + '_ENABLED' !== FLAG_VAR) return false
    if (!rbFlat.includes('the third is the operational timeout knob and is NOT part of activation')) return false
    const payload = PHASE_ADDS.map(read).join('\n')
    return !payload.includes(FLAG_VAR) && !payload.includes(KEY_VAR) && !payload.includes(TIMEOUT_VAR)
  })())
check('A3: the intended values are exact — the enablement value exactly true (matching the module\'s exact-string comparison in bytes), the run key exactly the byte-frozen authority artifact\'s literal, and no secret or unrelated configuration named anywhere',
  (() => {
    const auth = JSON.parse(read('docs/exlib2v-s4-authority-inputs-form-completed.json'))
    if (auth.requested_inputs.run_key_literal.value !== RUN_KEY) return false
    if (!mod.includes(`return process.env.${FLAG_VAR} === "true"`)) return false
    const s1 = sec('## 1.', '## 2.')
    return s1.includes('INTENDED VALUE, exact: true')
      && s1.includes(`INTENDED VALUE, exact: ${RUN_KEY}`)
      && s1.includes('No other variable, secret, or hosted configuration of any kind is part of the act')
  })())
check('A4: the environment scope is PRODUCTION ONLY and the Preview/Development database posture is honestly UNOBSERVED — repository bytes prove the variable family and code path only, the hosted per-environment values are platform facts unobserved until the read-only preflight, isolation CANNOT BE ASSUMED in either direction, a non-production canary is NOT AUTHORIZED (and even later-proven isolation would not expand this authorization), multi-environment propagation is prohibited, and NO unobserved same-project assertion survives in either document',
  (() => {
    const s2 = sec('## 2.', '## 3.')
    if (!s2.includes('PRODUCTION environment of the hosted Vercel project ONLY')) return false
    if (!s2.includes('Preview and Development receive NO activation variables')) return false
    if (!s2.includes('PREVIEW/DEVELOPMENT DATABASE POSTURE IS UNOBSERVED')) return false
    if (!s2.includes('UNOBSERVED until the read-only Vercel preflight')) return false
    if (!s2.includes('CANNOT BE ASSUMED')) return false
    if (!s2.includes('NOT AUTHORIZED as an activation shortcut')) return false
    if (!s2.includes('does NOT expand this Production-only authorization')) return false
    if (!s2.includes('separate governance decision')) return false
    if (!s2.includes('ACCIDENTAL MULTI-ENVIRONMENT PROPAGATION IS PROHIBITED')) return false
    const both = rbFlat + ' ' + norm(read(PREP))
    return !both.includes('targets the SAME hosted Supabase project')
      && !both.includes('same production database')
      && !both.includes('targets the same hosted Supabase project')
  })())
check('A5: the three fact classes are kept distinct — repository-proven facts, platform-operational facts assigned to a future READ-ONLY operator preflight (all six mandated observations named; no toolchain encodes it, so the operator gathers them), and the protected mutation acts; and NO Vercel contact occurs in this milestone',
  (() => {
    const s3 = sec('## 3.', '## 4.')
    if (!s3.includes('REPOSITORY-PROVEN FACTS')) return false
    if (!s3.includes('PLATFORM-OPERATIONAL FACTS')) return false
    if (!s3.includes('PROTECTED HOSTED MUTATION ACTS')) return false
    if (!s3.includes('no Vercel contact occurs in this milestone')) return false
    if (!s3.includes('no toolchain in this repository encodes a deterministic Vercel preflight')) return false
    for (const item of ['project identity', 'CURRENT presence/values', 'Preview/Development posture',
      'database-target posture', 'never secret values',
      'requires a redeploy or automatically causes one', 'currently promoted Production deployment',
      'deployment event that will carry activation']) {
      if (!s3.includes(item)) return false
    }
    return true
  })())
check('A6: the activation ordering is key-first and grounded — run key staged FIRST while the flag remains OFF (inert by the module\'s committed flag-OFF branch), presence verified, flag second, the single deployment last; the flag-first hazard is explained via the module\'s missing-key fail-closed line (located in bytes); and no flag-first formulation appears',
  (() => {
    const s4 = sec('## 4.', '## 5.')
    if (!s4.includes('RUN KEY FIRST')) return false
    if (!s4.includes('the enablement flag remains OFF')) return false
    if (!s4.includes('VERIFY the run-key variable')) return false
    if (!s4.includes('THEN stage the enablement variable')) return false
    if (!s4.includes('THEN perform the single intended activation deployment event')) return false
    if (!s4.includes('WHY FLAG-FIRST IS UNSAFE')) return false
    if (!s4.includes('NEVER deploy with the flag ON while the key is absent')) return false
    if (!mod.includes(`return failClosed("delivery is enabled but ${KEY_VAR} is not configured")`)) return false
    return !rbFlat.includes('flag first, then the run key')
      && !rbFlat.includes('enablement flag first')
  })())
check('A7: the blast radius is accepted honestly and the canary census is pinned by PATH AND CONTENT — the at-scale automatic consequence is stated prominently, the determination reads NO EXISTING APPLICATION-LEVEL SINGLE-TENANT CANARY, the repository-wide tenant-gating search returns exactly the two known unrelated PATCH field-validation comment lines (so converting a hit into a real tenant/feature gate fails even at an unchanged count), the non-production-canary path is closed by the unobserved-isolation rule, creating canary architecture is out of scope, and no single-user framing appears',
  (() => {
    const s5 = sec('## 5.', '## 6.')
    if (!s5.includes('EVERY AUTHENTICATED USER\'S NEXT QUALIFYING REQUEST')) return false
    if (!s5.includes('NOT a single-user event')) return false
    if (!s5.includes('NO EXISTING APPLICATION-LEVEL SINGLE-TENANT CANARY')) return false
    if (!s5.includes('Creating canary architecture is out of scope')) return false
    if (!s5.includes('EXPLICITLY ACCEPT the at-scale rollout')) return false
    if (!s5.includes('database isolation unobserved')) return false
    if (rbFlat.includes('delivers to a single user')) return false
    const expected = [
      'src/app/api/routine-exercises/[id]/route.ts:// enforces a strict prescription/notes allowlist (exactly the fields',
      'src/app/api/workout-exercises/[id]/route.ts:// enforces a strict prescription/annotation allowlist: unknown keys',
    ].sort()
    // RETARGET (W7.5-B lifecycle correction, 2026-09-10 — NOT weight_time
    // work). The canary census is a claim about the CLOSEOUT tip
    // (59e443ba — the promoted main, the target of tag
    // exlib3a-option-a-activation-evidence-stable): at that tip exactly
    // these two comment lines match the keyword grep. That historical
    // assertion is preserved verbatim, evaluated against the immutable
    // commit object. Normal post-closeout development may add keyword hits
    // that are NOT a delivery canary/allowlist/feature-flag mechanism — the
    // weight_time milestone's tracking-mode "allowlist" (a strength-records
    // data-model term marked `tracking-mode-census: allowlist`) is one.
    // Such hits are admitted ONLY as comment lines in the two named files;
    // an executable hit, a hit in any other file, or any change to the two
    // historical lines still fails.
    const CLOSEOUT_TIP = '59e443ba3d75e4b2073d709c07d8b3142201c6bd'
    const KEYWORDS = 'allowlist|allow_list|featureflag|feature_flag|canary'
    const historicalHits = execSync(`git grep -riE '${KEYWORDS}' ${CLOSEOUT_TIP} -- 'src/*.ts' 'src/*.tsx' || true`, { encoding: 'utf8', shell: '/bin/bash' })
      .split('\n').filter(Boolean).map((l) => norm(l.replace(`${CLOSEOUT_TIP}:`, '')).trim()).sort()
    if (JSON.stringify(historicalHits) !== JSON.stringify(expected)) return false
    const liveHits = execSync(`grep -riE '${KEYWORDS}' src --include='*.ts' --include='*.tsx' || true`, { encoding: 'utf8', shell: '/bin/bash' })
      .split('\n').filter(Boolean).map((l) => norm(l).trim()).sort()
    if (!expected.every((l) => liveHits.includes(l))) return false
    const ADMITTED_COMMENT_FILES = ['src/lib/strength-records.ts', 'src/lib/workout-set-contract.ts']
    return liveHits.filter((l) => !expected.includes(l)).every((l) => {
      const file = l.slice(0, l.indexOf(':'))
      const content = l.slice(l.indexOf(':') + 1).trim()
      return ADMITTED_COMMENT_FILES.includes(file) && (content.startsWith('//') || content.startsWith('*') || content.startsWith('/*'))
    })
  })())
check('A8: the post-activation plan claims only what instruments observe — the three OBSERVABLE states (CONFIG LIVE with NO persistent delivery state, CONFIG LIVE with persistent delivery state, INEFFECTIVE/FAILING CLOSED); zero counts are never translated into request history, nonzero persistent state is never attributed to a mechanism (standing direct RPC remains a competing writer), the telemetry limit is stated AND checked against the module bytes (exactly one console call, the fail-closed error), and every observation runs only under AUTHORIZATION M after state A4',
  (() => {
    const s6 = sec('## 6.', '## 7.')
    if (!s6.includes('ACTIVATION CONFIG LIVE / NO PERSISTENT DELIVERY STATE OBSERVED')) return false
    if (!s6.includes('ACTIVATION CONFIG LIVE / PERSISTENT DELIVERY STATE OBSERVED')) return false
    if (!s6.includes('ACTIVATION INEFFECTIVE OR FAILING CLOSED')) return false
    if (!s6.includes('NO claim is made about whether a qualifying request occurred')) return false
    if (!s6.includes('NEVER inferred from persistent state alone')) return false
    if (!s6.includes('competing possible mechanism')) return false
    if (!s6.includes('NO success-telemetry line')) return false
    if (!mod.includes('console.error(`deliverCatalog failed closed')) return false
    if ((mod.match(/console\./g) || []).length !== 1) return false
    if (!s6.includes('executed only under AUTHORIZATION M')) return false
    if (!s6.includes('only after state A4')) return false
    if (!s6.includes('RE-USE the reviewed Option-B measurement package')) return false
    if (!s6.includes('without exposing any unrelated secret')) return false
    if (!s6.includes('fail-closed log lines')) return false
    if (!s6.includes('compared to the section 3.B.5 pre-activation identity')) return false
    const both = rbFlat + ' ' + norm(read(PREP))
    return !both.includes('no qualifying request has arrived')
      && !both.includes('by the activation timeline')
      && !both.includes('attributable in aggregate to the app path')
  })())
check('A9: the STOP matrix is complete across all three phases with the STOP semantics — pre-activation (baseline moved, revoked run, key mismatch, project ambiguity, existing values, scope ambiguity, unprovable ordering, fingerprint mismatch, spent authorization), during (key/flag/deploy failures and ambiguity, wrong environment), post (initialization errors, unexpected counts/posture/claims/corrections, indistinguishable effect), and STOP means report-only with no unrelated repair and no revocation or restore',
  (() => {
    const s7 = sec('## 7.', '## 8.')
    for (const p of ['no longer the accepted baseline', 'revoked, missing, or duplicated',
      'does not equal exlib2u-plank-release1-staged-v1 exactly', 'ALREADY EXISTS in any environment',
      'cannot be limited to Production alone', 'cannot be proven safe',
      'fingerprint re-measured at the gate mismatches', 'already spent',
      'partially succeeds or its result is ambiguous', 'any environment other than Production is modified',
      'cannot distinguish whether the Production activation took effect']) {
      if (!s7.includes(p)) return false
    }
    return s7.includes('STOP MEANS: report exactly; perform NO unrelated repair, NO revocation, NO restore')
  })())
check('A10: the rollback runbook keeps the four mechanisms separate with the primary flag-OFF limits stated — stops ONLY the automatic app path, does NOT remove direct RPC reachability, does NOT undo delivered tenant state — and the recommended pre-authorization is the bounded emergency flag-OFF only (conditional on prior config mutation plus an immediate fail-closed condition), with DATABASE ROLLBACK AND REVOCATION EXCLUDED unconditionally',
  (() => {
    const s8 = sec('## 8.', '## 9.')
    if (!s8.includes('stops ONLY the automatic app path')) return false
    if (!s8.includes('does NOT remove direct authenticated RPC reachability')) return false
    if (!s8.includes('does NOT undo tenant state already delivered')) return false
    if (!s8.includes('rollback_catalog_delivery') || !s8.includes('exlib_revoke_run_delivery')) return false
    if (!s8.includes('NOT part of this runbook\'s act')) return false
    if (!s8.includes('SHOULD pre-authorize the bounded emergency flag-OFF rollback (mechanism 1 ONLY)')) return false
    if (!s8.includes('already mutated the Production configuration')) return false
    if (!s8.includes('immediate fail-closed STOP condition')) return false
    if (!s8.includes('DATABASE ROLLBACK AND REVOCATION ARE EXCLUDED FROM THIS PRE-AUTHORIZATION')) return false
    return !s8.includes('pre-authorization includes exlib_revoke')
      && !rbFlat.includes('emergency rollback includes exlib_revoke_run_delivery')
  })())
check('A11: the direct-RPC posture is unchanged and truthfully framed — activation does not create the privilege, it increases scale and official-path exposure, the flag is a rollout control and not the database security boundary, and no DB-grant change is proposed; no reachability-creation claim appears',
  (() => {
    const s9 = sec('## 9.', '## 10.')
    if (!s9.includes('Activation does not create this privilege')) return false
    if (!s9.includes('increases SCALE and adds the official application path')) return false
    if (!s9.includes('rollout control, not a database security boundary')) return false
    if (!s9.includes('No change to the database EXECUTE grant is proposed')) return false
    return !rbFlat.includes('creates direct-RPC reachability')
      && !rbFlat.includes('creates the direct-RPC reachability')
  })())
check('A12: TWO distinct one-use grants inspected IN THEIR OWN SLICE, both UNSENT — AUTHORIZATION A (production activation, consumed by the activation attempt) and AUTHORIZATION M (post-activation read-only measurement, independently consumed by the observation attempt, usable only after state A4, spent states never merged, not an investigation license); A binds the corrected commit + the runbook SHA-256 pinned in the committed prep record (recomputed here from bytes) + the preflight project identity, and carries the exact act, order, at-scale acceptance, bounded rollback, and negative boundary; neither grant can authorize itself',
  (() => {
    const s12 = sec('## 12.', '## 13.')
    if (!s12.includes('AUTHORIZATION A — PRODUCTION ACTIVATION (PREPARED — NOT ISSUED —')) return false
    if (!s12.includes('AUTHORIZATION M — POST-ACTIVATION READ-ONLY MEASUREMENT (PREPARED — NOT ISSUED —')) return false
    if (!s12.includes('spent states are never merged')) return false
    if (!s12.includes('ONE-USE, consumed by the activation attempt regardless of outcome')) return false
    if (!s12.includes('independently ONE-USE, consumed by the observation attempt regardless of outcome')) return false
    if (!s12.includes('usable ONLY after state A4')) return false
    if (!s12.includes('MUST NOT be used merely to investigate')) return false
    if (!s12.includes('neither grant can authorize itself')) return false
    if (!s12.includes('Claude never issues authorizations')) return false
    if (!s12.includes('binds the activation-package commit')) return false
    if (!s12.includes('[RUNBOOK SHA-256 — the exact value pinned in the committed preparation record]')) return false
    if (!s12.includes('re-measured at the gate')) return false
    if (!s12.includes('PROJECT IDENTITY — from the completed read-only preflight')) return false
    if (!s12.includes('PRODUCTION environment ONLY')) return false
    if (!s12.includes('CATALOG + _DELIVERY + _RUN_KEY')) return false
    if (!s12.includes('CATALOG + _DELIVERY + _ENABLED')) return false
    if (!s12.includes(RUN_KEY)) return false
    if (!s12.includes('in that order, never flag-first, never half-staged')) return false
    if (!s12.includes('I EXPLICITLY ACCEPT')) return false
    if (!s12.includes('at-scale rollout with no application-level single-tenant canary')) return false
    if (!s12.includes('do not retry blind')) return false
    if (!s12.includes('bounded emergency flag-OFF rollback (mechanism 1)')) return false
    if (!s12.includes('database rollback, revocation, and restore are NOT authorized')) return false
    if (!s12.includes('captured only under Authorization M')) return false
    if (!s12.includes('no Supabase mutation, no delivery call by the operator, no revocation, no restore, no Preview/Development change, no other variable or setting, no EXLIB-2S work, and no Git push or tag')) return false
    if (!s12.includes('no configuration change, no deployment, no delivery call, no revocation, no restore')) return false
    const rbBuf = readFileSync(RUNBOOK)
    const rbSha = createHash('sha256').update(rbBuf).digest('hex')
    const prep = read(PREP)
    return prep.includes(rbSha) && prep.includes(`${rbBuf.length} bytes`)
  })())
check('A13: the state-machine chronology is correct and mechanically enforced — A0 claims NO hosted variable posture (UNOBSERVED; no absent-everywhere or OFF-everywhere claim), A1 completes the read-only preflight with BOTH grants still UNISSUED, A2 is entered only after AUTHORIZATION A is issued and unspent, A5 runs under AUTHORIZATION M, all nine labels present, no implicit transitions, and the failure branch ends in a new human decision',
  (() => {
    const s10 = sec('## 10.', '## 11.')
    for (const st of ['A0 —', 'A1 —', 'A2 —', 'A3 —', 'A4 —', 'A5 —', 'A6 —', 'F1 —', 'F2 —']) {
      if (!s10.includes(st)) return false
    }
    const block = (a: string, b: string): string => s10.slice(s10.indexOf(a), s10.indexOf(b))
    const a0 = block('A0 —', 'A1 —')
    const a1 = block('A1 —', 'A2 —')
    const a2 = block('A2 —', 'A3 —')
    const a5 = block('A5 —', 'A6 —')
    if (!a0.includes('UNOBSERVED')) return false
    if (a0.includes('both variables absent')) return false
    if (a0.includes('OFF everywhere')) return false
    if (!a1.includes('UNISSUED')) return false
    if (a1.includes('has been issued')) return false
    if (!a2.includes('AUTHORIZATION A has been issued and is unspent')) return false
    if (!a5.includes('AUTHORIZATION M')) return false
    if (rbFlat.includes('both variables absent. (Now.)')) return false
    return s10.includes('no state is entered implicitly')
      && s10.includes('everything further is a new human decision')
  })())
check('A14: activation evidence and delivery evidence are never conflated and mechanism is never attributed — configuration plus deployment does not itself prove any tenant delivery occurred, delivery is traffic-triggered, persistent state does not identify its own mechanism (app path and standing direct RPC are both lawful writers), the families are reported separately under the three observable states, and no request-history/invocation-history/mechanism-attribution claim is derived from persistent state alone',
  (() => {
    const s11 = sec('## 11.', '## 12.')
    return s11.includes('does NOT itself prove any tenant delivery occurred')
      && s11.includes('traffic-triggered')
      && s11.includes('SEPARATELY')
      && s11.includes('both lawful writers')
      && s11.includes('three observable states of section 6')
      && s11.includes('derived from persistent state alone')
  })())
check('A15: hygiene — both documents\' non-ASCII is the em-dash only, and no phase file carries hosted endpoints, credential material, or a contiguous delivery-variable name',
  (() => {
    for (const p of [RUNBOOK, PREP]) {
      for (const ch of read(p)) {
        const c = ch.codePointAt(0) as number
        if (c > 127 && c !== 0x2014) return false
        if (c < 32 && ch !== '\n') return false
      }
    }
    const payload = PHASE_ADDS.map(read).join('\n')
    const bads = ['supabase' + '.co', 'vercel' + '.com', 'postgres' + '://',
      'SUPABASE' + '_URL', 'SUPABASE' + '_SERVICE', 'api' + 'key', 'Bearer' + ' ', 'ey' + 'J']
    return !bads.some((b) => payload.includes(b))
  })())
const P0 = '5d286889c7a6f9a5b663d92d61073d7207464736'
// A16 RETARGET (EXLIB-3A OPTION A hosted-activation evidence): this
// suite's original HEAD-relative completed-phase topology (committed
// branch pinned exactly two commits over the accepted Option-B
// evidence tip with HEAD's parent the round-0 preparation commit;
// uncommitted branch described this preparation milestone's own
// authoring worktree) went stale at the hosted-activation evidence
// milestone's own commit, the same completed-phase pattern as every
// predecessor (sixteenth instance). Retargeted to anchor at this
// phase's own reviewed candidate, where the chain, the cumulative
// inventory, and the correction's three-path scope hold forever, and
// where the retargeted predecessor suite is read from the anchored
// blob rather than the worktree. Count-neutral: the suite still
// reports sixteen checks.
const PTIP = '73a2bc8c44c6260c096517e66090014f6af8ebc0'
check('A16: topology and retarget coverage (anchored at the reviewed corrected candidate 73a2bc8c...) — the round-0 preparation commit plus ONE plain forward round-1 correction over the accepted Option-B evidence tip (single-parent chain d4703187 -> 5d286889 -> 73a2bc8c), the CUMULATIVE diff carrying exactly the runbook, the preparation record, and this verifier plus ONLY the accepted labeled V12 retarget, the correction touching ONLY the three authorized Option-A paths (the retargeted predecessor suite byte-unchanged in round 1), and verify-exlib3a-option-b-application.ts AT THE ANCHOR carrying the RETARGET (EXLIB-3A OPTION A activation preparation) label anchored at the evidence tip with its twelve checks intact',
  (() => {
    try {
      if (execSync(`git rev-list --count ${ETIP}..${PTIP}`, { encoding: 'utf8' }).trim() !== '2') return false
      const p1 = execSync(`git rev-list --parents -n 1 ${PTIP}`, { encoding: 'utf8' }).trim().split(/\s+/)
      if (p1.length !== 2 || p1[1] !== P0) return false
      const p0 = execSync(`git rev-list --parents -n 1 ${P0}`, { encoding: 'utf8' }).trim().split(/\s+/)
      if (p0.length !== 2 || p0[1] !== ETIP) return false
      const status = execSync(`git diff --name-status ${ETIP} ${PTIP}`, { encoding: 'utf8' })
        .split('\n').filter(Boolean).sort()
      const expected = [
        ...PHASE_ADDS.map((p) => `A\t${p}`),
        ...RETARGETED.map((p) => `M\t${p}`),
      ].sort()
      if (JSON.stringify(status) !== JSON.stringify(expected)) return false
      const corr = execSync(`git diff --name-status ${P0} ${PTIP}`, { encoding: 'utf8' })
        .split('\n').filter(Boolean).sort()
      const corrExpected = [...PHASE_ADDS].sort().map((p) => `M\t${p}`)
      if (JSON.stringify(corr) !== JSON.stringify(corrExpected)) return false
      const v = execSync(`git show ${PTIP}:scripts/verify-exlib3a-option-b-application.ts`, { encoding: 'utf8' })
      if (!v.includes('RETARGET (EXLIB-3A OPTION A activation preparation)')) return false
      if (!v.includes(`const ETIP = '${ETIP}'`)) return false
      return (v.match(/^check\(/gm) || []).length === 12
    } catch { return false }
  })())

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
