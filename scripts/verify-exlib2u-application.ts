// EXLIB-2U APPLICATION verification (LOCAL-ONLY): the hosted
// staged-run application EVIDENCE — the operator-supplied execution
// facts cross-checked mechanically against the promoted repository
// bytes. Performs NO hosted contact; every hosted fact is verified
// for INTERNAL and CROSS-RECORD consistency, never re-observed.
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

const SRC = 'ea8f6902b7b42a4d7f5a9af8c376900da5533e5c'
const U_TAG = 'exlib2u-s4-staged-run-prep-reviewed-not-executed'
const U_TAG_OBJ = '41d8eb3eb3a4ea9f811fbf9d7138158157e03f90'
// RETARGET (EXLIB-2Z S5 seal preparation): this evidence phase
// COMPLETED — the Codex-approved durable closeout fast-forwarded
// main ea8f6902 -> 290f9bbb and tagged the evidence tip stable, so
// the old E1 pin refs/heads/main == SRC (true at execution time)
// went stale AT the closeout exactly as the durable-closeout ruling
// recorded, and E11's HEAD-relative two-commit topology went stale
// at this milestone's own first successor commit — the recurring
// completed-phase pattern (tenth instance). Both claims are
// re-anchored at the phase's own promoted evidence tip and its
// durable stable tag, where they held and hold forever.
const EV1 = '290f9bbbfea84ac6bcd2cefb59f7bed2247e2021'
const EV_TAG = 'exlib2u-hosted-application-evidence-stable'
const EV_TAG_OBJ = '82e9800765579f15adc127eb4a218982c50425c8'
const PKG = 'docs/exlib2u-staged-run-package.sql'
const PKG_SHA = 'ceb4964f3537f49ef987e77876c3106917abc3edf2fc9bff3991fb644c90722f'
const RECORD = 'docs/exlib2u-hosted-application-record.md'
const VERIFIER = 'scripts/verify-exlib2u-application.ts'
const AUTH_FORM = 'docs/exlib2v-s4-authority-inputs-form-completed.json'
const PHASE_ADDS = [RECORD, VERIFIER].sort()
const RETARGETED = ['scripts/verify-exlib2u.ts']
const RUN_UUID = '6669ba78-8e75-4042-ac2a-14082a9e5940'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

const pkg = read(PKG)
const rec = read(RECORD)
const recFlat = rec.replace(/\s+/g, ' ')
const auth = JSON.parse(read(AUTH_FORM))

console.log('EXLIB-2U hosted-application evidence verification (LOCAL-ONLY; the package is SPENT; nothing re-observed, everything cross-checked)')

check('E1: the promoted sources and the SPENT posture — the executed package is byte-identical to its accepted round-1 fingerprint at the promoted tip (live file AND tip blob), the reviewed-not-executed tag object peels to that tip, the evidence tip carrying this record was durably promoted under its stable tag (RETARGET (EXLIB-2Z S5 seal preparation): anchored constants replace the closeout-stale refs/heads/main pin), and this record states SPENT — DO NOT RERUN with the one-use authority consumed and no retry',
  (() => {
    try {
      if (execSync(`git rev-parse refs/tags/${U_TAG}`, { encoding: 'utf8' }).trim() !== U_TAG_OBJ) return false
      if (execSync(`git rev-parse refs/tags/${U_TAG}^{}`, { encoding: 'utf8' }).trim() !== SRC) return false
      if (execSync(`git rev-parse refs/tags/${EV_TAG}`, { encoding: 'utf8' }).trim() !== EV_TAG_OBJ) return false
      if (execSync(`git rev-parse 'refs/tags/${EV_TAG}^{}'`, { encoding: 'utf8', shell: '/bin/zsh' }).trim() !== EV1) return false
      const atTip = execSync(`git cat-file blob ${SRC}:${PKG} | shasum -a 256`, { encoding: 'utf8', shell: '/bin/zsh' }).split(/\s+/)[0]
      if (atTip !== PKG_SHA) return false
      const live = execSync(`shasum -a 256 "${PKG}"`, { encoding: 'utf8' }).split(/\s+/)[0]
      if (live !== PKG_SHA) return false
      return recFlat.includes('SPENT — DO NOT RERUN') && recFlat.includes('one-use authority is consumed')
        && recFlat.includes('Executed exactly once; no retry occurred')
    } catch { return false }
  })())
check('E2: reserved-authority binding — the reported run key equals the byte-frozen authority artifact\'s literal, the reported hosted evidence instant 2026-09-07T15:05:00Z is the SAME instant as the artifact\'s (and the package\'s) 2026-09-07T11:05:00-04:00 literal proven by parse, and the reported membership is the reserved ALL_THREE_IDENTITIES (six rows: three exercise identities plus three aliases)',
  (() => {
    const runKey = auth.requested_inputs.run_key_literal.value as string
    if (!recFlat.includes(runKey)) return false
    const pat = auth.requested_inputs.product_approver_identity.product_approved_at as string
    if (Date.parse(pat) !== Date.parse('2026-09-07T15:05:00Z')) return false
    if (!recFlat.includes('2026-09-07T15:05:00Z') || !recFlat.includes(pat)) return false
    if (!recFlat.includes('the same instant')) return false
    if (auth.requested_inputs.run_membership.value !== 'ALL_THREE_IDENTITIES') return false
    return recFlat.includes('ALL_THREE_IDENTITIES')
      && recFlat.includes('three exercise identities plus the three catalog aliases')
  })())
check('E3: the reported vector transition and transport result equal the package\'s own pinned gates — pre 3/3/5/3/6/1/2/2/0/0/3 and post 3/3/5/3/6/1/2/2/1/6/3 present in the record AND in the executed package bytes, and the transport row (EXLIB-2U STAGED / runs 1 / run_items 6 / staged_non_deliverable true) matches the package\'s surfaced SELECT',
  (() => {
    if (!pkg.includes("'3/3/5/3/6/1/2/2/0/0/3'") || !pkg.includes("'3/3/5/3/6/1/2/2/1/6/3'")) return false
    if (!pkg.includes("'EXLIB-2U STAGED' AS result")) return false
    if (!pkg.includes('AS staged_non_deliverable')) return false
    return recFlat.includes('3/3/5/3/6/1/2/2/0/0/3') &&
      recFlat.includes('3/3/5/3/6/1/2/2/1/6/3') &&
      recFlat.includes('result EXLIB-2U STAGED, runs 1, run_items 6, staged_non_deliverable true')
  })())
check('E4: the reported staged posture equals the package\'s postcondition pins — dry_run false, unapproved, unsealed, unrevoked, all five operational/seal fields NULL, structural non-deliverability (the five-conjunct predicate, zero matches, no delivery call) and S5-promotability (3 exercise / 3 alias / 0 unready, NO seal performed, run still unapproved and unsealed)',
  (() => {
    for (const pin of ['v_run.dry_run <> false', 'v_run.approved_for_delivery <> false',
      'v_run.sealed_at IS NOT NULL', 'v_run.revoked_at IS NOT NULL', 'v_run.started_at IS NOT NULL',
      'satisfies the delivery predicate (it must NOT)', 'would fail the S5 seal validation']) {
      if (!pkg.includes(pin)) return false
    }
    return recFlat.includes('dry_run = false') &&
      recFlat.includes('approved_for_delivery = false') &&
      recFlat.includes('sealed_at / revoked_at / started_at / completed_at / result_counts all NULL') &&
      recFlat.includes('five-conjunct predicate matches ZERO rows') &&
      recFlat.includes('No delivery call was made') &&
      recFlat.includes('3 exercise members / 3 alias members / 0 unready') &&
      recFlat.includes('NO seal was performed') &&
      recFlat.includes('unapproved and unsealed')
  })())
check('E5: hosted run-surrogate identity — the reported run id is a well-formed UUID, appears in this record exactly once, appears NOWHERE in the promoted tree at the tip (first preservation here), and is distinct from all six previously preserved hosted surrogates (extracted from the promoted EXLIB-2Y record bytes, never restated)',
  (() => {
    if (!UUID_RE.test(RUN_UUID)) return false
    if ((rec.match(new RegExp(RUN_UUID, 'g')) || []).length !== 1) return false
    try {
      const hits = execSync(`git grep -c ${RUN_UUID} ${SRC} | wc -l`, { encoding: 'utf8', shell: '/bin/zsh' }).trim()
      if (hits !== '0') return false
    } catch { /* git grep exits 1 on zero hits; the pipe already yields 0 */ }
    const yrec = read('docs/exlib2y-hosted-application-record.md')
    const prior = Array.from(new Set(Array.from(yrec.matchAll(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g)).map((m) => m[0])))
    if (prior.length < 6) return false
    return !prior.includes(RUN_UUID)
  })())
check('E6: chronology — the tag object\'s tagger instant (mechanically read from the raw tag bytes) precedes the recorded tag push, which precedes preflight < execution start < database-created run < transport return < post-proof, every instant parsing; the executed bytes were the promoted, tagged bytes',
  (() => {
    const raw = execSync(`git cat-file tag refs/tags/${U_TAG}`, { encoding: 'utf8' })
    const m = raw.match(/^tagger .* (\d+) [+-]\d{4}$/m)
    if (!m) return false
    const tagAt = Number(m[1]) * 1000
    const chain = ['2026-09-08T05:03:41Z', '2026-09-08T05:25:52.346Z', '2026-09-08T05:26:08.937Z',
      '2026-09-08T05:26:09.940Z', '2026-09-08T05:26:10.075Z', '2026-09-08T05:27:10.884Z'].map((s) => Date.parse(s))
    if (chain.some((t) => !Number.isFinite(t))) return false
    let prev = tagAt
    for (const t of chain) { if (!(t > prev)) return false; prev = t }
    return recFlat.includes('2026-09-08T05:03:41Z') && recFlat.includes('2026-09-08T05:25:52.346242Z')
      && recFlat.includes('2026-09-08T05:26:08.937Z') && recFlat.includes('2026-09-08T05:26:09.940165Z')
      && recFlat.includes('2026-09-08T05:26:10.075Z') && recFlat.includes('2026-09-08T05:27:10.884093Z')
  })())
check('E7: the backup rewind horizon is stated truthfully — the reported physical backup instant parses, PRECEDES the EXLIB-2Y application instant (extracted from the promoted 2Y record bytes) and this staging, and the record states the restore posture AVAILABLE, NOT AUTHORIZED with the rewind consequence spelled out',
  (() => {
    const backup = Date.parse('2026-09-07T13:12:01Z')
    if (!Number.isFinite(backup)) return false
    const yFlat = read('docs/exlib2y-hosted-application-record.md').replace(/\s+/g, ' ')
    const ym = yFlat.match(/Database effect timestamp: (2026-09-08T02:17:02\.\d+Z)/)
    if (!ym) return false
    const yAt = Date.parse(ym[1])
    if (!(backup < yAt)) return false
    if (!(yAt < Date.parse('2026-09-08T05:25:52.346Z'))) return false
    return recFlat.includes('2026-09-07T13:12:01Z') &&
      recFlat.includes('AVAILABLE, NOT AUTHORIZED') &&
      recFlat.includes('would rewind the approved snapshots and their review events as well as this staged run')
  })())
check('E8: strengthened-gate consistency — the record\'s trigger and authority preservation claims say exactly what the round-1 gates prove (exact enabled bindings; member, grantor, and option posture; whole-row preservation), and the tenant-alias observation is stated with its structural reason',
  (() => {
    if (!pkg.includes('not EXACTLY bound and enabled')) return false
    if (!pkg.includes('member, grantor, and every option column')) return false
    return recFlat.includes('exactly bound and enabled') &&
      recFlat.includes('member, grantor, and option posture') &&
      recFlat.includes('authority baseline preservation is proven') &&
      recFlat.includes('84 exercises and zero tenant aliases') &&
      recFlat.includes('hosted tenant aliases can only arise from delivery or user authoring')
  })())
check('E9: the record\'s boundary claims are truthful and evidence-bounded (round-1 strengthened, count-neutral) — executed once by the operator path (Claude performed no hosted contact); the advisor observations are enumerated COMPLETELY, the per-class counts extracted from the record\'s own enumeration summing exactly to the stated security and performance totals, observed only and not modified; section 6 makes NO current-state flag-posture claim (the unsupported absent-everywhere claim is rejected there; the disclosure may quote it) and states exactly what the evidence supports; no delivery call, no S5 approval or seal, no environment/seed/inventory/Git/Vercel/EXLIB-2S action; the dated correction disclosure is present; and the next gated milestones are named in order',
  (() => {
    if (!recFlat.includes('WAS EXECUTED ONCE')) return false
    if (!recFlat.includes('operator path (Joseph/ChatGPT)')) return false
    if (!recFlat.includes('Claude performed no hosted contact')) return false
    if (!recFlat.includes('observed both hosted advisor classes and changed nothing')) return false
    const secm = recFlat.match(/(\d+) security notices \(([^)]+)\)/)
    const perfm = recFlat.match(/(\d+) performance notices \(([^)]+)\)/)
    if (!secm || !perfm) return false
    const sum = (s: string): number => (s.match(/\d+/g) || []).map(Number).reduce((a, b) => a + b, 0)
    if (sum(secm[2]) !== Number(secm[1]) || sum(perfm[2]) !== Number(perfm[1])) return false
    for (const cls of ['RLS-enabled/no-policy', 'mutable search paths', 'anonymous SECURITY DEFINER exposure',
      'authenticated SECURITY DEFINER exposures', 'leaked-password-protection warning',
      'unindexed foreign keys', 'RLS initialization-plan warnings', 'unused indexes',
      'absolute Auth connection-strategy notice']) {
      if (!recFlat.includes(cls)) return false
    }
    if (!recFlat.includes('observed only and not modified')) return false
    const sec6 = rec.slice(rec.indexOf('## 6.'), rec.indexOf('## 7.')).replace(/\s+/g, ' ')
    if (sec6.includes('remain ABSENT everywhere') || sec6.includes('remains inert')) return false
    if (!sec6.includes('made no Vercel or delivery-variable change during this execution')) return false
    if (!sec6.includes('not re-observed by this evidence pass')) return false
    if (!sec6.includes('Independently of flag posture')) return false
    if (!sec6.includes('unapproved and unsealed and the database delivery predicate matches zero rows')) return false
    if (!recFlat.includes('no delivery call, no S5 approval or seal, no environment-variable change, no seed or inventory edit, no Git action, no Vercel action, and no EXLIB-2S action')) return false
    if (!recFlat.includes('Codex review of this evidence record')) return false
    if (!recFlat.includes('Correction disclosure (2026-09-08, round 1)')) return false
    return !recFlat.includes('the run is sealed') && !recFlat.includes('delivery succeeded')
  })())
check('E10: hygiene — the record\'s non-ASCII is the em-dash only, and neither phase file carries the delivery environment-variable literals, endpoints, or credential material',
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
// RETARGET (EXLIB-2Z S5 seal preparation): the committed branch of
// this check was HEAD-relative and went stale at this milestone's
// own first successor commit; the uncommitted authoring branch can
// no longer describe any lawful state. Both are replaced by ONE
// anchored form at the promoted evidence tip EV1 (the durably
// closed, stable-tagged tip), where the chain and both inventories
// held and hold forever. Count-neutral: the suite still reports
// eleven checks.
check('E11: topology and inventory exact (anchored at the promoted evidence tip) — the preserved round-0 evidence commit plus ONE plain forward round-1 correction commit on the promoted 2U tip (single-parent chain tip -> evidence -> correction ending at the stable-tagged evidence tip), the CUMULATIVE diff carrying exactly this record and this verifier plus ONLY the labeled retarget, and the correction commit touching ONLY the record and this verifier; nothing deleted',
  (() => {
    try {
      const EV0 = 'cf30ed4edf7c70ce7fd612a9d0604ea9a088c9a7'
      if (execSync(`git merge-base ${SRC} ${EV1}`, { encoding: 'utf8' }).trim() !== SRC) return false
      if (execSync(`git rev-list --count ${SRC}..${EV1}`, { encoding: 'utf8' }).trim() !== '2') return false
      const p1 = execSync(`git rev-list --parents -n 1 ${EV1}`, { encoding: 'utf8' }).trim().split(/\s+/)
      if (p1.length !== 2 || p1[1] !== EV0) return false
      const p0 = execSync(`git rev-list --parents -n 1 ${EV0}`, { encoding: 'utf8' }).trim().split(/\s+/)
      if (p0.length !== 2 || p0[1] !== SRC) return false
      const status = execSync(`git diff --name-status ${SRC}..${EV1}`, { encoding: 'utf8' })
        .split('\n').filter(Boolean).sort()
      const expected = [
        ...PHASE_ADDS.map((p) => `A\t${p}`),
        ...RETARGETED.map((p) => `M\t${p}`),
      ].sort()
      if (JSON.stringify(status) !== JSON.stringify(expected)) return false
      const corr = execSync(`git diff --name-status ${EV0}..${EV1}`, { encoding: 'utf8' })
        .split('\n').filter(Boolean).sort()
      const corrExpected = [RECORD, VERIFIER].sort().map((p) => `M\t${p}`)
      return JSON.stringify(corr) === JSON.stringify(corrExpected)
    } catch { return false }
  })())

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
