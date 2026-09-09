// EXLIB-2Z APPLICATION verification (LOCAL-ONLY): the hosted S5
// seal application EVIDENCE — the operator-supplied execution facts
// cross-checked mechanically against the repository bytes. Performs
// NO hosted contact; every hosted fact is verified for INTERNAL and
// CROSS-RECORD consistency, never re-observed (the connector safety
// layer blocked post-COMMIT raw SELECTs, a disclosed observation
// gap this suite verifies is disclosed, never filled).
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
const R0 = 'dc3e83a89f086e636e7fe3aefc086872dbfefcb5'
const TIP2Z = '3969a98fc809cf69fb8a19c411de63d919db3ef7'
const PKG = 'docs/exlib2z-s5-seal-package.sql'
const PKG_SHA = '701302cb3baa36a510f96163ca5393ac63475d78463607757b02bd46b5015e6a'
const RECORD = 'docs/exlib2z-hosted-application-record.md'
const VERIFIER = 'scripts/verify-exlib2z-application.ts'
const PREP_ADDS = ['docs/exlib2z-s5-seal-package.sql', 'docs/exlib2z-s5-seal-prep-record.md',
  'scripts/verify-exlib2z-live.sh', 'scripts/verify-exlib2z.ts'].sort()
const PHASE_ADDS = [RECORD, VERIFIER].sort()
const RETARGETED = ['scripts/verify-exlib2z.ts']
const U_REC = 'docs/exlib2u-hosted-application-record.md'
const AUTH_FORM = 'docs/exlib2v-s4-authority-inputs-form-completed.json'
const SEAL_TXT = '2026-09-08 21:24:23.744781+00'
const SEAL_ISO = '2026-09-08T21:24:23.744781Z'
const VEC = '3/3/5/3/6/1/2/2/1/6/3'

const pkg = read(PKG)
const rec = read(RECORD)
const recFlat = norm(rec)
const urecFlat = norm(read(U_REC))
const auth = JSON.parse(read(AUTH_FORM))
const RUN_KEY = auth.requested_inputs.run_key_literal.value as string
const sec = (a: string, b: string): string => {
  const s = rec.indexOf(a)
  const e = rec.indexOf(b, s)
  return norm(rec.slice(s < 0 ? 0 : s, e < 0 ? rec.length : e))
}

console.log('EXLIB-2Z hosted S5 seal application evidence verification (LOCAL-ONLY; the authorization is SPENT; nothing re-observed, everything cross-checked)')

// negatives below are scoped to the FACTUAL sections (1-8): the
// verifier-lifecycle section (9) describes the rejected forms and
// the dated disclosure (13) legitimately quotes them — the same
// section-scoping lesson as the EXLIB-2U evidence round.
const recFactual = norm(rec.slice(0, rec.indexOf('## 9.')))
check('S1: SOURCE identity, the SPENT posture, and the TRANSPORT-PROVENANCE limitation (round-1 strengthened) — the seal package is byte-identical to its Codex-accepted fingerprint both live and at the candidate tip (mechanical SOURCE identity), the record states that the connector returned no byte echo or hash so raw transport-payload byte identity is not independently mechanically preserved post hoc, the overstated exact-executed-bytes form is REJECTED from the factual sections, and the one-use authorization is CONSUMED AND SPENT with exactly one attempt',
  (() => {
    try {
      if (sha256(PKG) !== PKG_SHA) return false
      const atTip = execSync(`git cat-file blob ${TIP2Z}:${PKG} | shasum -a 256`, { encoding: 'utf8', shell: '/bin/bash' }).split(/\s+/)[0]
      if (atTip !== PKG_SHA) return false
      const s1 = sec('## 1.', '## 2.')
      if (!s1.includes('SOURCE IDENTITY IS MECHANICAL')) return false
      if (!s1.includes('TRANSPORT PROVENANCE IS BOUNDED')) return false
      if (!s1.includes('returned NO byte-for-byte echo and NO hash')) return false
      if (!s1.includes('not independently mechanically preserved post hoc')) return false
      if (!s1.includes('intending the reviewed package')) return false
      if (!s1.includes('does not invalidate the hosted seal')) return false
      if (recFactual.includes('What was executed (the exact reviewed bytes)')) return false
      if (recFactual.includes('execution bytes were reconstructed from the exact uploaded file')) return false
      return recFlat.includes('CONSUMED AND SPENT — DO NOT RERUN THE SEAL PACKAGE')
        && recFlat.includes('Executed exactly once; no retry occurred after any outcome')
        && recFlat.includes('consumed by the attempt and is SPENT')
    } catch { return false }
  })())
check('S2: the preserved preparation history — the single-parent chain 290f9bbb -> dc3e83a8 -> 3969a98f is intact with the exact cumulative (four adds + one retarget) and correction (record + verifier only) inventories, all anchored at constants',
  (() => {
    try {
      const p1 = execSync(`git rev-list --parents -n 1 ${TIP2Z}`, { encoding: 'utf8' }).trim().split(/\s+/)
      if (p1.length !== 2 || p1[1] !== R0) return false
      const p0 = execSync(`git rev-list --parents -n 1 ${R0}`, { encoding: 'utf8' }).trim().split(/\s+/)
      if (p0.length !== 2 || p0[1] !== BASE) return false
      const status = execSync(`git diff --name-status ${BASE} ${TIP2Z}`, { encoding: 'utf8' })
        .split('\n').filter(Boolean).sort()
      const expected = [
        ...PREP_ADDS.map((p) => `A\t${p}`),
        'M\tscripts/verify-exlib2u-application.ts',
      ].sort()
      if (JSON.stringify(status) !== JSON.stringify(expected)) return false
      const corr = execSync(`git diff --name-status ${R0} ${TIP2Z}`, { encoding: 'utf8' })
        .split('\n').filter(Boolean).sort()
      return JSON.stringify(corr) === JSON.stringify(['M\tdocs/exlib2z-s5-seal-prep-record.md', 'M\tscripts/verify-exlib2z.ts'].sort())
    } catch { return false }
  })())
check('S3: authority and identity binding — the reserved run key equals the byte-frozen authority artifact\'s literal, the hosted surrogate and staging instant equal the literals preserved in the promoted EXLIB-2U application record (extracted from those bytes, wrap-safe, never restated), and the record states the operator-path executor, the consumed section-17 authorization, and that Claude performed no hosted contact',
  (() => {
    if (RUN_KEY !== 'exlib2u-plank-release1-staged-v1') return false
    if (!recFlat.includes(RUN_KEY)) return false
    const idm = urecFlat.match(/hosted id ([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/)
    const tm = urecFlat.match(/created the run at (2026-09-08T05:26:09\.\d+Z)/)
    if (!idm || !tm) return false
    if (!recFlat.includes(idm[1]) || !recFlat.includes(tm[1])) return false
    return recFlat.includes('operator path (ChatGPT/Codex)')
      && recFlat.includes('one-use section-17 authorization')
      && recFlat.includes('delivery-activation consequence explicitly accepted')
      && recFlat.includes('Claude performed no hosted contact')
  })())
check('S4: the surfaced transport row — all eight fields present exactly (EXLIB-2Z SEALED / runs 1 / run_items 6 / approved true / the sealed instant / unrevoked / predicate rows 1 / delivered rows 0), the row shape matches the package\'s own surfaced SELECT, and the transport form and ISO form of the seal instant are the same instant by parse',
  (() => {
    for (const f of ['result = EXLIB-2Z SEALED', 'runs = 1', 'run_items = 6',
      'approved_for_delivery = true', `sealed_at = ${SEAL_TXT}`, 'unrevoked = true',
      'delivery_predicate_rows = 1', 'delivered_tenant_rows = 0']) {
      if (!recFlat.includes(f)) return false
    }
    if (!pkg.includes("'EXLIB-2Z SEALED' AS result")) return false
    if (!pkg.includes('AS delivery_predicate_rows')) return false
    if (!pkg.includes('AS delivered_tenant_rows')) return false
    const a = Date.parse(SEAL_TXT.replace(' ', 'T').replace('+00', 'Z'))
    const b = Date.parse(SEAL_ISO)
    if (!Number.isFinite(a) || a !== b) return false
    return recFlat.includes(SEAL_ISO) && recFlat.includes('proven by parse')
  })())
check('S5: EVIDENCE PRECISION preserved — the record states the inner four-field JSONB was validated INSIDE the package and was NOT separately surfaced by the transport, never representing it as independently transport-observed, and grounds the success argument in the COMMIT of the reviewed fail-closed package',
  (() => {
    const s3 = sec('## 3.', '## 4.')
    if (!s3.includes('validated INSIDE the package')) return false
    if (!s3.includes('NOT separately surfaced by the transport')) return false
    if (!s3.includes('NOT represented here as independently transport-observed')) return false
    if (!s3.includes('every in-package precondition, the exact four-field function-result validation, and every postcondition passed')) return false
    return s3.includes('rolled the whole transaction back, seal included')
  })())
check('S6: the six-class evidence provenance map is complete and distinct — in-package transaction proof, surfaced transport result, human-observed backup UI, post-COMMIT LIVE-ROW-ESTIMATE observation (never described as an exact count), advisor observation, and the blocked raw SQL disclosed as the exact-cardinality and delivered-row observation gaps',
  (() => {
    const s7 = sec('## 7.', '## 8.')
    for (const c of ['IN-PACKAGE TRANSACTION PROOF', 'SURFACED TRANSPORT RESULT',
      'HUMAN-OBSERVED BACKUP UI', 'POST-COMMIT LIVE-ROW-ESTIMATE OBSERVATION',
      'ADVISOR OBSERVATION', 'BLOCKED RAW SQL']) {
      if (!s7.includes(c)) return false
    }
    // exactly the six numbered ALL-CAPS class items (the section
    // heading's own "7." is excluded by the digit range and case)
    return (s7.match(/[1-6]\. [A-Z]{2}/g) || []).length === 6
  })())
check('S7: the post-COMMIT evidence WITH its explicit gaps (rounds 1 and 2 strengthened) — the eleven reported values DERIVE the stated estimate sequence (recomputed here from the record\'s own enumeration, mechanically consistent with the operator-supplied numbers), the values are identified as live_rows_estimate-backed statistics that are NOT exact COUNT(*) results and whose numerical stability cannot prove exact no-movement, BOTH gaps are explicit (the exact post-COMMIT cardinalities and the delivered-row predicate, neither re-observed, neither converted to a zero), the STOP branch neither triggered nor definitively cleared, S6 STOPPED on the gaps, the safety-layer block disclosed as not-a-failure and not retried, the overstated exact-count/exact-vector/no-movement/count-identical/observed/proves/cleared claims REJECTED from the factual sections, and the insufficiency of totals GROUNDED mechanically in the migration-026 in-place reconciliation UPDATE located in the migration bytes',
  (() => {
    const s4 = sec('## 4.', '## 5.')
    const names = ['exercise_catalog_logical', 'exercise_catalog', 'exercise_catalog_muscles',
      'exercise_catalog_aliases', 'exercise_catalog_name_claims', 'exercise_catalog_content',
      'exercise_catalog_content_expected_relationships', 'exercise_catalog_relationships',
      'exercise_catalog_import_runs', 'exercise_catalog_run_items', 'exercise_catalog_review_events']
    const counts: string[] = []
    for (const n of names) {
      const m = s4.match(new RegExp(`${n} = (\\d+)`))
      if (!m) return false
      counts.push(m[1])
    }
    if (counts.join('/') !== VEC) return false
    if (!s4.includes(VEC)) return false
    if (!s4.match(/public\.exercises = 84/)) return false
    if (!s4.match(/public\.exercise_aliases = 0/)) return false
    // the precise post-COMMIT claims (rounds 1 and 2 corrected):
    // the returned values are live_rows_estimate-backed statistics,
    // never exact counts, and BOTH exact-observation gaps are open
    if (!s4.includes('list_tables')) return false
    if (!s4.includes('live_rows_estimate')) return false
    if (!s4.includes('LIVE-ROW ESTIMATE')) return false
    if (!s4.includes('estimates, not exact COUNT(*) results')) return false
    if (!s4.includes('numerical estimate stability cannot prove exact no-movement')) return false
    if (!s4.includes('exact post-COMMIT table cardinalities were NOT successfully re-observed')) return false
    if (!s4.includes('Neither gap may be silently converted')) return false
    if (!s4.includes('WHERE import_run_id IS NOT NULL')) return false
    if (!s4.includes('was NOT successfully re-observed')) return false
    if (!s4.includes('MUST NOT be read as equivalent')) return false
    if (!s4.includes('EXPLICIT EVIDENCE GAP')) return false
    if (!s4.includes('not filled, not inferred away, and not silently converted into a zero')) return false
    if (!s4.includes('neither triggered NOR definitively cleared')) return false
    if (!s4.includes('S6 remains STOPPED pending a separate governance decision')) return false
    // the rejected overstatements must be ABSENT from the factual
    // sections (the lifecycle and disclosure sections may describe
    // or quote them): round-1 delivered-row forms AND round-2
    // exact-count forms
    if (recFactual.includes('delivered-row and tenant state were OBSERVED')) return false
    if (recFactual.includes('branch was therefore NOT triggered')) return false
    if (recFactual.includes('proves no post-activation delivery')) return false
    if (recFactual.includes('NO post-activation delivery or tenant movement was observed')) return false
    if (recFactual.includes('observed state vector is EXACTLY')) return false
    if (recFactual.includes('tenant TOTAL counts OBSERVED')) return false
    if (recFactual.includes('no total-count movement was observed')) return false
    if (recFactual.includes('count-identical')) return false
    // WHY totals are insufficient, grounded in the migration bytes:
    // the guarded in-place Plank reconciliation UPDATE assigns
    // import_run_id to an EXISTING public.exercises row
    const mig26 = norm(read('supabase/migrations/026_exlib_plank_seed_reconciliation.sql'))
    if (!mig26.includes("UPDATE public.exercises SET tracking_mode = 'timed', exercise_type = 'mobility', catalog_id = v_cat.id, catalog_logical_id = v_cat.logical_id, import_run_id = v_run.id")) return false
    if (!recFlat.includes('in-place Plank reconciliation path that UPDATEs an existing public.exercises row and sets import_run_id = v_run.id')) return false
    return s4.includes('blocked further raw SELECTs')
      && s4.includes('SELECT now()')
      && s4.includes('NOT a database failure')
      && s4.includes('the seal was NOT retried')
      && s4.includes('NOT filled in')
  })())
check('S8: chronology — staging (extracted from the promoted EXLIB-2U record bytes) precedes the human-observed backup, which precedes the seal, which precedes both advisor observations; every instant parses; and the stated 8h 16m 35.744781s backup-to-seal delta is exact by parse arithmetic',
  (() => {
    const tm = urecFlat.match(/created the run at (2026-09-08T05:26:09\.\d+Z)/)
    if (!tm) return false
    const staging = Date.parse(tm[1])
    const backup = Date.parse('2026-09-08T13:07:48Z')
    const seal = Date.parse(SEAL_ISO)
    const adv1 = Date.parse('2026-09-08T21:25:17.662Z')
    const adv2 = Date.parse('2026-09-08T21:25:18.103Z')
    for (const t of [staging, backup, seal, adv1, adv2]) {
      if (!Number.isFinite(t)) return false
    }
    if (!(staging < backup && backup < seal && seal < adv1 && adv1 < adv2)) return false
    if (Math.floor((seal - backup) / 1000) !== 8 * 3600 + 16 * 60 + 35) return false
    return recFlat.includes('8h 16m 35.744781s')
      && recFlat.includes('2026-09-08 13:07:48 +0000')
      && recFlat.includes('2026-09-08T21:25:17.662Z')
      && recFlat.includes('2026-09-08T21:25:18.103Z')
  })())
check('S9: the advisor evidence is complete, arithmetic-consistent, and cross-record UNCHANGED — the per-class counts extracted from this record\'s own enumeration sum to the stated 20/48 totals AND equal, class by class, the enumeration preserved in the promoted EXLIB-2U record (extracted from those bytes), everything observed-only, with the deliver-function authenticated exposure noted as the independently observed accepted consequence',
  (() => {
    const grab = (flat: string): { s: string, p: string } | null => {
      const sm = flat.match(/(\d+) security notices \(([^)]+)\)/)
      const pm = flat.match(/(\d+) performance notices \(([^)]+)\)/)
      if (!sm || !pm) return null
      const sum = (s: string): number => (s.match(/\d+/g) || []).map(Number).reduce((a, b) => a + b, 0)
      if (sum(sm[2]) !== Number(sm[1]) || sum(pm[2]) !== Number(pm[1])) return null
      return { s: `${sm[1]}:${norm(sm[2])}`, p: `${pm[1]}:${norm(pm[2])}` }
    }
    const mine = grab(recFlat)
    const prior = grab(urecFlat)
    if (!mine || !prior) return false
    if (mine.s !== prior.s || mine.p !== prior.p) return false
    if (!recFlat.includes('UNCHANGED from the advisor posture')) return false
    if (!recFlat.includes('observed only and not modified')) return false
    return recFlat.includes('public.deliver_catalog_exercises(p_run_key text)')
      && recFlat.includes('post-S5 authenticated direct-RPC reachability the issued authorization explicitly accepted')
  })())
check('S10: the seal semantics and the ASYMMETRIC rewind horizon — the record names the delivery-activation event with the predicate satisfied and delivery NOT performed, and states (backed by the S8 parse facts) that a restore to the observed backup would UNDO THE SEAL while PRESERVING the staged run, AVAILABLE and NOT AUTHORIZED',
  (() => {
    const s6 = sec('## 6.', '## 7.')
    if (!s6.includes('DELIVERY-ACTIVATION event')) return false
    if (!s6.includes('satisfies the database delivery predicate')) return false
    if (!s6.includes("independently of the application's delivery flag")) return false
    if (!s6.includes('Delivery was NOT performed by the S5 transaction')) return false
    if (!s6.includes('no operator delivery call occurred')) return false
    if (!s6.includes('live-row estimates read 84 exercises / 0 tenant aliases')) return false
    if (!s6.includes('delivered-row predicate was NOT re-observed')) return false
    if (!s6.includes('AVAILABLE, NOT AUTHORIZED')) return false
    if (!s6.includes('UNDO THE SEAL')) return false
    if (!s6.includes('PRESERVING the staged run')) return false
    return s6.includes('separately gated operator decision')
  })())
check('S11: boundary and hygiene — the full negative boundary is stated (one attempt, SPENT, no operator delivery call, no revocation, no S6, no environment change, no EXLIB-2S, no push or tag, no Vercel action, no Claude hosted contact even after the block), the next gated milestones are named in order, the record\'s non-ASCII is the em-dash only, and no phase file carries delivery environment-variable or credential literals',
  (() => {
    if (!recFlat.includes('No operator delivery call, no revocation, no delivery-variable or environment change, no runtime activation, no S6 act')) return false
    if (!recFlat.includes('No hosted contact by Claude at any point, including after the safety layer blocked raw SELECTs')) return false
    if (!recFlat.includes('Codex review of this evidence record')) return false
    if (!recFlat.includes('consolidated EXLIB-2Z closeout')) return false
    if (!recFlat.includes('S6 delivery-configuration consideration')) return false
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
// RETARGET (EXLIB-3A S6 delivery governance): this evidence phase
// COMPLETED — round-2 was Codex-APPROVED and the operator's one-use
// closeout authorization was consumed, promoting the whole chain to
// main under the stable tag — so the topology claims are anchored
// at the phase's own durably closed tip, where they held and hold
// forever; the HEAD-relative form (and its uncommitted authoring
// branch) went stale at the first successor commit, the same
// completed-phase pattern as every predecessor (twelfth instance).
// Count-neutral: the suite still reports twelve checks.
const DTIP = '5ed6fd84ea81ce1b4ca768b44e036432d26c3ab8'
check('S12: topology and retarget coverage (anchored at the durably closed tip) — the preserved round-0 evidence commit plus the preserved round-1 correction plus the round-2 correction over the candidate tip (single-parent chain 3969a98f -> be9b94aa -> 8caf777f -> 5ed6fd84, the stable-tagged EXLIB-2Z closeout), the CUMULATIVE diff carrying exactly this record and this verifier plus ONLY the labeled Z16 retarget, the round-2 correction touching ONLY this record and this verifier, and verify-exlib2z.ts carrying the RETARGET (EXLIB-2Z hosted-application evidence) label anchored at the candidate tip with its sixteen checks intact',
  (() => {
    try {
      const EV0 = 'be9b94aa999e4a4a4e155c4745b77c07315f6934'
      const R1 = '8caf777fd0b57d614941755b5dd0cb2cf43f3c03'
      if (execSync(`git rev-list --count ${TIP2Z}..${DTIP}`, { encoding: 'utf8' }).trim() !== '3') return false
      const p2 = execSync(`git rev-list --parents -n 1 ${DTIP}`, { encoding: 'utf8' }).trim().split(/\s+/)
      if (p2.length !== 2 || p2[1] !== R1) return false
      const p1 = execSync(`git rev-list --parents -n 1 ${R1}`, { encoding: 'utf8' }).trim().split(/\s+/)
      if (p1.length !== 2 || p1[1] !== EV0) return false
      const p0 = execSync(`git rev-list --parents -n 1 ${EV0}`, { encoding: 'utf8' }).trim().split(/\s+/)
      if (p0.length !== 2 || p0[1] !== TIP2Z) return false
      const status = execSync(`git diff --name-status ${TIP2Z} ${DTIP}`, { encoding: 'utf8' })
        .split('\n').filter(Boolean).sort()
      const expected = [
        ...PHASE_ADDS.map((p) => `A\t${p}`),
        ...RETARGETED.map((p) => `M\t${p}`),
      ].sort()
      if (JSON.stringify(status) !== JSON.stringify(expected)) return false
      const corr = execSync(`git diff --name-status ${R1} ${DTIP}`, { encoding: 'utf8' })
        .split('\n').filter(Boolean).sort()
      const corrExpected = [RECORD, VERIFIER].sort().map((p) => `M\t${p}`)
      if (JSON.stringify(corr) !== JSON.stringify(corrExpected)) return false
      const z = read('scripts/verify-exlib2z.ts')
      if (!z.includes('RETARGET (EXLIB-2Z hosted-application evidence)')) return false
      if (!z.includes(`const TIP2Z = '${TIP2Z}'`)) return false
      return (z.match(/^check\(/gm) || []).length === 16
    } catch { return false }
  })())

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
