// EXLIB-3A verification (LOCAL-ONLY): the S6 delivery-configuration
// governance proposal — every architectural claim bound to
// repository bytes at the durable EXLIB-2Z base, the inherited S5
// facts cross-extracted from the promoted records, and the drafted
// OPTION B authorization proven PREPARED AND UNSENT. Performs NO
// hosted contact and proposes nothing into effect.
//
// Fail-closed: any mismatch fails the suite.
import { execSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'

let passed = 0
let failed = 0
const check = (name: string, ok: boolean, detail?: string): void => {
  if (ok) { passed += 1; console.log(`  PASS  ${name}`) }
  else { failed += 1; console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`) }
}
const read = (p: string): string => readFileSync(p, 'utf8')
const norm = (s: string): string => s.replace(/\s+/g, ' ')

const BASE = '5ed6fd84ea81ce1b4ca768b44e036432d26c3ab8'
const TAG = 'exlib2z-hosted-application-evidence-stable'
const TAG_OBJ = '1eaf4fc0608665a2cb1960cd1314dfacdc5d2d4e'
const PROPOSAL = 'docs/exlib3a-s6-delivery-configuration-proposal.md'
const VERIFIER = 'scripts/verify-exlib3a.ts'
const MODULE = 'src/lib/supabase/deliver-catalog.ts'
const Z_REC = 'docs/exlib2z-hosted-application-record.md'
const PHASE_ADDS = [PROPOSAL, VERIFIER].sort()
const RETARGETED = ['scripts/verify-exlib2z-application.ts']
const ENTRY_POINTS = [
  'src/app/(app)/workouts/page.tsx',
  'src/app/(app)/workouts/exercises/page.tsx',
  'src/app/api/exercises/route.ts',
]
// the delivery variable names are NEVER carried contiguously by this
// milestone's files (the 2T flag census pins an exact carrier set);
// every needle is constructed
const FLAG_VAR = 'CATALOG' + '_DELIVERY' + '_ENABLED'
const KEY_VAR = 'CATALOG' + '_DELIVERY' + '_RUN_KEY'
const RUN_KEY = 'exlib2u-plank-release1-staged-v1'

const prop = read(PROPOSAL)
const propFlat = norm(prop)
const mod = read(MODULE)
const zrecFlat = norm(read(Z_REC))
const sec = (a: string, b: string): string => {
  const s = prop.indexOf(a)
  const e = prop.indexOf(b, s)
  return norm(prop.slice(s < 0 ? 0 : s, e < 0 ? prop.length : e))
}

console.log('EXLIB-3A S6 delivery-configuration governance proposal verification (LOCAL-ONLY; DISCOVERY AND PROPOSAL ONLY; nothing enabled anywhere)')

check('X1: the durable starting point is exact and the identifier is lawful — the stable tag object peels to the EXLIB-2Z closeout tip named in the proposal, and the exlib3 namespace contains ONLY this milestone\'s artifacts (the exlib2 letters are exhausted with 2s reserved)',
  (() => {
    try {
      if (execSync(`git rev-parse refs/tags/${TAG}`, { encoding: 'utf8' }).trim() !== TAG_OBJ) return false
      if (execSync(`git rev-parse 'refs/tags/${TAG}^{}'`, { encoding: 'utf8', shell: '/bin/bash' }).trim() !== BASE) return false
      const ex3 = execSync("ls docs | grep '^exlib3' || true", { encoding: 'utf8' }).split('\n').filter(Boolean)
      if (JSON.stringify(ex3) !== JSON.stringify(['exlib3a-s6-delivery-configuration-proposal.md'])) return false
      if (execSync("ls docs | grep -c '^exlib2s' || true", { encoding: 'utf8' }).trim() !== '0') return false
      return propFlat.includes(BASE) && propFlat.includes(TAG) && propFlat.includes('2s reserved/forbidden')
    } catch { return false }
  })())
check('X2: the inherited S5 facts are CROSS-EXTRACTED from the promoted EXLIB-2Z record bytes, never restated by hand — the sealed instant, the run key, the hosted surrogate, and the SPENT posture all appear in the proposal exactly as the promoted record preserves them',
  (() => {
    const sealed = zrecFlat.match(/(2026-09-08T21:24:23\.\d+Z)/)
    const surr = zrecFlat.match(/(6669ba78-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/)
    if (!sealed || !surr) return false
    if (!zrecFlat.includes(RUN_KEY)) return false
    return propFlat.includes(sealed[1]) && propFlat.includes(surr[1]) && propFlat.includes(RUN_KEY)
      && propFlat.includes('SPENT — DO NOT RERUN')
      && propFlat.includes('delivered tenant rows were exactly ZERO through COMMIT')
  })())
check('X3: the historical gaps are inherited with the promoted record\'s own provenance language and the no-retroactive-closure discipline — both gap statements and the live_rows_estimate fact match the promoted record, and the proposal states a later measurement cannot retroactively prove the original interval',
  (() => {
    if (!zrecFlat.includes('live_rows_estimate')) return false
    if (!zrecFlat.includes('was NOT successfully re-observed')) return false
    const s3 = sec('## 3.', '## 4.')
    return s3.includes('was NOT successfully re-observed')
      && s3.includes('live_rows_estimate-backed estimates only')
      && s3.includes('A later measurement cannot retroactively prove what happened')
      && s3.includes('current-state assurance')
  })())
check('X4: the runtime architecture claims are bound to module bytes — the exact-string flag comparison, the null-key fail-closed before any database call, the single FAIL-CLOSED REGION marker, and exactly ONE delivery RPC call site, with the proposal citing the module as the single owner',
  (() => {
    if (!mod.includes(`return process.env.${FLAG_VAR} === "true"`)) return false
    if (!mod.includes(`return failClosed("delivery is enabled but ${KEY_VAR} is not configured")`)) return false
    if ((mod.match(/FAIL-CLOSED REGION/g) || []).length !== 1) return false
    if ((mod.match(/supabase\.rpc\("deliver_catalog_exercises"/g) || []).length !== 1) return false
    return propFlat.includes('ONE runtime module owns delivery: src/lib/supabase/deliver-catalog.ts')
      && propFlat.includes('exactly the string "true"')
      && propFlat.includes('fails closed BEFORE any database call')
  })())
check('X5: the three entry points are exactly as claimed — each imports and calls initializeExercisesIfNeeded, each is server-side (no use-client directive), each authenticates BEFORE initializing, and NO other source file imports the module',
  (() => {
    for (const f of ENTRY_POINTS) {
      const src = read(f)
      if (src.slice(0, 120).includes('use client')) return false
      const authIdx = src.indexOf('auth.getUser')
      const initIdx = src.indexOf('initializeExercisesIfNeeded(supabase, user.id)')
      if (authIdx < 0 || initIdx < 0 || authIdx > initIdx) return false
    }
    const importers = execSync("grep -rl 'deliver-catalog' src --include='*.ts' --include='*.tsx' | sort", { encoding: 'utf8' })
      .split('\n').filter(Boolean).filter((p) => p !== MODULE).sort()
    if (JSON.stringify(importers) !== JSON.stringify([...ENTRY_POINTS].sort())) return false
    return propFlat.includes('THREE entry points call initializeExercisesIfNeeded')
      && propFlat.includes('authenticates FIRST')
  })())
check('X6: the no-enablement census holds and THIS milestone does not join the flag-variable carrier set — the environment files carry no delivery variable names, the repository-wide contiguous-flag-name carriers remain EXACTLY the four 2T-era files, and neither of this milestone\'s files carries either variable name contiguously',
  (() => {
    if (read('.env.example').includes(FLAG_VAR) || read('.env.example').includes(KEY_VAR)) return false
    if (existsSync('.env.local')) {
      const local = read('.env.local')
      if (local.includes(FLAG_VAR) || local.includes(KEY_VAR)) return false
    }
    const carriers = execSync(`grep -rl '${FLAG_VAR}' --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.next . | sed 's|^\\./||' | sort`, { encoding: 'utf8', shell: '/bin/bash' })
      .split('\n').filter(Boolean).sort()
    const expected = ['docs/exlib2t-delivery-runtime-prep-record.md', MODULE,
      'scripts/verify-exlib2t-runtime.ts', 'scripts/verify-exlib2t.ts'].sort()
    if (JSON.stringify(carriers) !== JSON.stringify(expected)) return false
    return !prop.includes(FLAG_VAR) && !prop.includes(KEY_VAR)
      && !read(VERIFIER).includes(FLAG_VAR) && !read(VERIFIER).includes(KEY_VAR)
  })())
check('X7: the automatic-at-scale consequence and the redeploy boundary are stated — activation is automatic per authenticated user at the three surfaces (never an operator-invoked single call), env changes alone invoke nothing, and the redeploy question is flagged as a platform fact NOT derivable from repository bytes',
  (() => {
    const s5 = sec('## 5.', '## 6.')
    return s5.includes('invokes nothing by itself')
      && s5.includes('AUTOMATICALLY, per authenticated user')
      && s5.includes('NOT an operator-invoked single call')
      && s5.includes('not derivable from repository bytes')
      && s5.includes('No Vercel contact was made')
  })())
check('X8: the not-a-secret run-key fact is census-derived — the reserved key literal appears in exactly the number of committed files at the base that the proposal states (sixteen), and the proposal names the database predicate as the only security boundary exactly as the module\'s own header does',
  (() => {
    const carriers = execSync(`git grep -l '${RUN_KEY}' ${BASE} | wc -l`, { encoding: 'utf8', shell: '/bin/bash' }).trim()
    if (carriers !== '16') return false
    if (!propFlat.includes('sixteen committed repository files')) return false
    if (!mod.includes("the database's sealed/approved/unrevoked run")) return false
    const s6 = sec('## 6.', '## 7.')
    return s6.includes('NOT A SECRET AND MUST NOT BE TREATED AS AN ACCESS-CONTROL MECHANISM')
      && s6.includes('S6 must never be described as making delivery technically reachable for the first time')
  })())
check('X9: the four rollback/shutdown paths are distinct and byte-grounded — the per-user deactivate-only rollback (auth.uid scope, is_active = false) and the one-way permanent revocation (no client grant) are located in the migration bytes, and the proposal\'s section 15 classifies all four paths with reversibility never conflated',
  (() => {
    const mig26 = read('supabase/migrations/026_exlib_plank_seed_reconciliation.sql')
    const rb = mig26.slice(mig26.indexOf('CREATE OR REPLACE FUNCTION rollback_catalog_delivery'))
    if (!rb.includes('auth.uid()')) return false
    if (!norm(rb).includes('SET is_active = false')) return false
    const mig23 = read('supabase/migrations/023_exlib_catalog_and_delivery_contract.sql')
    if (!norm(mig23).includes('revocation is one-way and permanent')) return false
    if (!mig23.includes('REVOKE ALL ON FUNCTION exlib_revoke_run_delivery(TEXT) FROM PUBLIC, anon, authenticated;')) return false
    const s15 = sec('## 15.', '## 16.')
    return s15.includes('REVERSIBLE') && s15.includes('PER-CALLING-USER, deactivate-only')
      && s15.includes('ONE-WAY, PERMANENT') && s15.includes('PHYSICAL RESTORE')
      && s15.includes('direct RPC reachability is UNTOUCHED')
  })())
check('X10: options A, B, and C are all present with the mandated threat-model items, and revocation is not auto-recommended — option C explicitly treats revocation as a separately gated one-way decision',
  (() => {
    const s8 = sec('## 8.', '## 9.')
    if (!s8.includes('OPTION A — PROCEED TOWARD CONTROLLED S6 ACTIVATION')) return false
    if (!s8.includes('OPTION B — REQUIRE A FRESH CURRENT-STATE MEASUREMENT')) return false
    if (!s8.includes('OPTION C — HOLD S6 INDEFINITELY')) return false
    if (!s8.includes('Revocation is NOT recommended here')) return false
    const s7 = sec('## 7.', '## 8.')
    for (const t of ['LEARNS/GUESSES THE RUN KEY', 'DIRECT RPC BYPASSES THE APP FLAG',
      'CLIENT BUNDLES', 'DUPLICATE/IDEMPOTENT BEHAVIOR', 'WHAT THE APP FLAG MITIGATES',
      'UNREVOKED', 'BLAST RADIUS', 'PRODUCTION REDEPLOY', 'VERCEL-SPECIFIC OPERATIONAL RISK']) {
      if (!s7.includes(t)) return false
    }
    return true
  })())
check('X11: the recommendation is OPTION B with the framing discipline intact — B is current-state assurance that CANNOT retroactively close the historical gaps, recommended first so A-versus-C is decided on measured present facts; the STOP conditions treat nonzero delivered rows as report-not-repair',
  (() => {
    const s9 = sec('## 9.', '## 10.')
    if (!s9.includes('OPTION B first')) return false
    if (!s9.includes('re-decide A versus C with current facts')) return false
    const s8 = sec('## 8.', '## 9.')
    if (!s8.includes('CANNOT retroactively prove what happened inside the original post-COMMIT interval')) return false
    const s13 = sec('## 13.', '## 14.')
    return s13.includes('NONZERO delivered rows today: NOT an error to be fixed')
      && s13.includes('do not attribute a mechanism, do not revoke')
  })())
check('X12: the drafted OPTION B authorization is PREPARED AND UNSENT, inspected in its own section slice — spent-check first, read-only, exact counts only (never estimate-backed metadata as a substitute), consumed by the attempt, the cannot-close-gaps statement inside the authorization text itself, and the full negative boundary',
  (() => {
    const s16 = sec('## 16.', '## 17.')
    return s16.includes('PREPARED — NOT ISSUED — DELIBERATELY UNSENT')
      && s16.includes('Claude never issues authorizations')
      && s16.includes('spent-check FIRST')
      && s16.includes('read-only')
      && s16.includes('never estimate-backed metadata as a substitute')
      && s16.includes('This authorization is ONE-USE and is consumed by the attempt')
      && s16.includes('cannot and do not retroactively close the historical post-COMMIT observation gaps')
      && s16.includes('no write of any kind, no delivery, no revocation, no restore, no environment or delivery-variable change, no S6 activation, no EXLIB-2S work, no Git push or tag, and no manual Vercel action')
  })())
check('X13: the milestone boundary and hygiene hold — section 17 lists every prohibited act with S6 remaining STOPPED, the proposal\'s non-ASCII is the em-dash only, and no phase file carries hosted endpoints or credential material',
  (() => {
    const s17 = sec('## 17.', '## 18.')
    if (!s17.includes('NO: Supabase contact; Vercel contact; delivery call; revocation; restore; S5 rerun')) return false
    if (!s17.includes('S6 remains STOPPED')) return false
    for (const ch of prop) {
      const c = ch.codePointAt(0) as number
      if (c > 127 && c !== 0x2014) return false
      if (c < 32 && ch !== '\n') return false
    }
    const payload = PHASE_ADDS.map(read).join('\n')
    const bads = ['supabase' + '.co', 'vercel' + '.com', 'postgres' + '://',
      'SUPABASE' + '_URL', 'SUPABASE' + '_SERVICE', 'api' + 'key', 'Bearer' + ' ', 'ey' + 'J']
    return !bads.some((b) => payload.includes(b))
  })())
const PORCELAIN = execSync('git status --porcelain', { encoding: 'utf8' }).split('\n').filter(Boolean)
const CHANGED = PORCELAIN.map((l) => l.slice(3).trim()).sort()
const committed = CHANGED.length === 0
  && execSync(`git rev-list --count ${BASE}..HEAD`, { encoding: 'utf8' }).trim() !== '0'
// Completed-phase note for the future: once this milestone is closed
// out and a successor commit exists, this HEAD-relative check goes
// stale by design and gets the standard labeled retarget.
if (committed) {
  check('X14: topology and retarget coverage — ONE plain forward proposal commit over the durable EXLIB-2Z base (single parent 5ed6fd84...) carrying exactly this proposal and this verifier plus ONLY the labeled S12 retarget, and verify-exlib2z-application.ts carries the RETARGET (EXLIB-3A S6 delivery governance) label anchored at the durable tip with its twelve checks intact',
    (() => {
      try {
        if (execSync(`git rev-list --count ${BASE}..HEAD`, { encoding: 'utf8' }).trim() !== '1') return false
        const p1 = execSync('git rev-list --parents -n 1 HEAD', { encoding: 'utf8' }).trim().split(/\s+/)
        if (p1.length !== 2 || p1[1] !== BASE) return false
        const status = execSync(`git diff --name-status ${BASE} HEAD`, { encoding: 'utf8' })
          .split('\n').filter(Boolean).sort()
        const expected = [
          ...PHASE_ADDS.map((p) => `A\t${p}`),
          ...RETARGETED.map((p) => `M\t${p}`),
        ].sort()
        if (JSON.stringify(status) !== JSON.stringify(expected)) return false
        const zapp = read('scripts/verify-exlib2z-application.ts')
        if (!zapp.includes('RETARGET (EXLIB-3A S6 delivery governance)')) return false
        if (!zapp.includes(`const DTIP = '${BASE}'`)) return false
        return (zapp.match(/^check\(/gm) || []).length === 12
      } catch { return false }
    })())
} else {
  check('X14 (uncommitted authoring state): every worktree change lies inside the two phase paths plus the labeled retargeted suite, which carries the RETARGET (EXLIB-3A S6 delivery governance) label',
    CHANGED.length > 0 && CHANGED.every((p) => PHASE_ADDS.includes(p) || RETARGETED.includes(p))
    && read('scripts/verify-exlib2z-application.ts').includes('RETARGET (EXLIB-3A S6 delivery governance)'))
}

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
