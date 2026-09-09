// EXLIB-3A OPTION A verification (LOCAL-ONLY): the controlled S6
// activation package — the exact future protected act bound to
// repository bytes, the inherited Option-B evidence, and the
// drafted-unsent authorization. Performs NO hosted contact and
// activates nothing.
//
// Fail-closed: any mismatch fails the suite.
import { execSync } from 'child_process'
import { readFileSync } from 'fs'

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

console.log('EXLIB-3A OPTION A activation-package verification (LOCAL-ONLY; PREPARATION ONLY; S6 STOPPED; the section-12 authorization is UNSENT)')

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
check('A4: the environment scope is PRODUCTION ONLY — Preview and Development receive nothing, accidental multi-environment propagation is prohibited, and the preview-canary shortcut is prohibited WITH the grounded reason (every environment targets the same hosted project, so a preview canary would act on the production sealed run)',
  (() => {
    const s2 = sec('## 2.', '## 3.')
    return s2.includes('PRODUCTION environment of the hosted Vercel project ONLY')
      && s2.includes('Preview and Development receive NO activation variables')
      && s2.includes('ACCIDENTAL MULTI-ENVIRONMENT PROPAGATION IS PROHIBITED')
      && s2.includes('SAME hosted Supabase project')
      && s2.includes('PROHIBITED as an activation shortcut')
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
check('A7: the blast radius is accepted honestly — the at-scale automatic consequence is stated prominently, the canary determination reads NO EXISTING APPLICATION-LEVEL SINGLE-TENANT CANARY (grounded: no allowlist/flag/gating in src beyond the two unrelated field-validation hits), creating canary architecture is declared out of scope, and no single-user framing appears',
  (() => {
    const s5 = sec('## 5.', '## 6.')
    if (!s5.includes('EVERY AUTHENTICATED USER\'S NEXT QUALIFYING REQUEST')) return false
    if (!s5.includes('NOT a single-user event')) return false
    if (!s5.includes('NO EXISTING APPLICATION-LEVEL SINGLE-TENANT CANARY')) return false
    if (!s5.includes('Creating canary architecture is out of scope')) return false
    if (!s5.includes('EXPLICITLY ACCEPT the at-scale rollout')) return false
    if (rbFlat.includes('delivers to a single user')) return false
    const hits = execSync("grep -rniE 'allowlist|allow_list|featureflag|feature_flag|canary' src --include='*.ts' --include='*.tsx' | wc -l", { encoding: 'utf8', shell: '/bin/bash' }).trim()
    return hits === '2'
  })())
check('A8: the post-activation observation plan distinguishes the THREE states (activated-not-triggered / activated-and-triggered / ineffective-or-failing-closed) and names the exact instruments — the deployment-identity comparison, the variable presence proofs without unrelated secrets, the REUSED reviewed Option-B measurement package under a NEW one-use authorization, the fail-closed log evidence, and the run-posture re-read',
  (() => {
    const s6 = sec('## 6.', '## 7.')
    return s6.includes('ACTIVATED, NOT YET TRIGGERED')
      && s6.includes('ACTIVATED AND TRIGGERED')
      && s6.includes('ACTIVATION INEFFECTIVE OR FAILING CLOSED')
      && s6.includes('RE-USE the reviewed Option-B measurement package')
      && s6.includes('NEW one-use read-only')
      && s6.includes('without exposing any unrelated secret')
      && s6.includes('fail-closed log lines')
      && s6.includes('compared to the section 3.B.5 pre-activation identity')
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
check('A12: the drafted authorization is inspected IN ITS OWN SLICE and is UNSENT — PREPARED — NOT ISSUED — DELIBERATELY UNSENT with the must-not-authorize-itself statement; it binds the commit, the at-the-gate fingerprint, the preflight-established project identity, Production-only scope, both fragment-named variables and exact values, the key-first order, the deployment act, the EXPLICIT at-scale acceptance, the observation protocol, one-use consumed-by-attempt, the ambiguity rule, the bounded flag-OFF rollback scope with database acts excluded, and the full negative boundary',
  (() => {
    const s12 = sec('## 12.', '## 13.')
    return s12.includes('PREPARED — NOT ISSUED —')
      && s12.includes('it must not authorize itself')
      && s12.includes('Claude never issues authorizations')
      && s12.includes('binds the activation-package commit')
      && s12.includes('re-measured at the gate')
      && s12.includes('PROJECT IDENTITY — from the completed read-only preflight')
      && s12.includes('PRODUCTION environment ONLY')
      && s12.includes('CATALOG + _DELIVERY + _RUN_KEY')
      && s12.includes('CATALOG + _DELIVERY + _ENABLED')
      && s12.includes(RUN_KEY)
      && s12.includes('in that order, never flag-first, never half-staged')
      && s12.includes('I EXPLICITLY ACCEPT')
      && s12.includes('at-scale rollout with no application-level single-tenant canary')
      && s12.includes('ONE-USE, consumed by the attempt regardless of outcome')
      && s12.includes('do not retry blind')
      && s12.includes('bounded emergency flag-OFF rollback (mechanism 1)')
      && s12.includes('database rollback, revocation, and restore are NOT authorized')
      && s12.includes('no Supabase mutation, no delivery call by the operator, no revocation, no restore, no Preview/Development change, no other variable or setting, no EXLIB-2S work, and no Git push or tag')
  })())
check('A13: the state machine is explicit and gated — all nine labels (A0-A6, F1, F2) present, every transition requires its named gate, no state entered implicitly, and the failure branch ends in STOP with everything further a new human decision',
  (() => {
    const s10 = sec('## 10.', '## 11.')
    for (const st of ['A0 —', 'A1 —', 'A2 —', 'A3 —', 'A4 —', 'A5 —', 'A6 —', 'F1 —', 'F2 —']) {
      if (!s10.includes(st)) return false
    }
    return s10.includes('no state is entered implicitly')
      && s10.includes('everything further is a new human decision')
  })())
check('A14: activation evidence and delivery evidence are never conflated — configuration plus deployment does not itself prove any tenant delivery occurred, delivery is traffic-triggered, and the two evidence families are captured and reported separately',
  (() => {
    const s11 = sec('## 11.', '## 12.')
    return s11.includes('does NOT itself prove any tenant delivery occurred')
      && s11.includes('traffic-triggered')
      && s11.includes('SEPARATELY')
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
const PORCELAIN = execSync('git status --porcelain', { encoding: 'utf8' }).split('\n').filter(Boolean)
const CHANGED = PORCELAIN.map((l) => l.slice(3).trim()).sort()
const committed = CHANGED.length === 0
  && execSync(`git rev-list --count ${ETIP}..HEAD`, { encoding: 'utf8' }).trim() !== '0'
// Completed-phase note for the future: once this milestone is closed
// out and a successor commit exists, this HEAD-relative check goes
// stale by design and gets the standard labeled retarget.
if (committed) {
  check('A16: topology and retarget coverage — ONE plain forward activation-preparation commit over the accepted Option-B evidence tip (single parent d4703187...) carrying exactly the runbook, the preparation record, and this verifier plus ONLY the labeled V12 retarget, and verify-exlib3a-option-b-application.ts carries the RETARGET (EXLIB-3A OPTION A activation preparation) label anchored at the evidence tip with its twelve checks intact',
    (() => {
      try {
        if (execSync(`git rev-list --count ${ETIP}..HEAD`, { encoding: 'utf8' }).trim() !== '1') return false
        const p1 = execSync('git rev-list --parents -n 1 HEAD', { encoding: 'utf8' }).trim().split(/\s+/)
        if (p1.length !== 2 || p1[1] !== ETIP) return false
        const status = execSync(`git diff --name-status ${ETIP} HEAD`, { encoding: 'utf8' })
          .split('\n').filter(Boolean).sort()
        const expected = [
          ...PHASE_ADDS.map((p) => `A\t${p}`),
          ...RETARGETED.map((p) => `M\t${p}`),
        ].sort()
        if (JSON.stringify(status) !== JSON.stringify(expected)) return false
        const v = read('scripts/verify-exlib3a-option-b-application.ts')
        if (!v.includes('RETARGET (EXLIB-3A OPTION A activation preparation)')) return false
        if (!v.includes(`const ETIP = '${ETIP}'`)) return false
        return (v.match(/^check\(/gm) || []).length === 12
      } catch { return false }
    })())
} else {
  check('A16 (uncommitted authoring state): every worktree change lies inside the three phase paths plus the labeled retargeted suite, which carries the RETARGET (EXLIB-3A OPTION A activation preparation) label',
    CHANGED.length > 0 && CHANGED.every((p) => PHASE_ADDS.includes(p) || RETARGETED.includes(p))
    && read('scripts/verify-exlib3a-option-b-application.ts').includes('RETARGET (EXLIB-3A OPTION A activation preparation)'))
}

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
