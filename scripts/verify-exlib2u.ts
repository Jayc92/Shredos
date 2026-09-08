// EXLIB-2U STATIC verification (LOCAL-ONLY): the ONE-USE S4
// staged-run package preparation — the package itself (PREPARED —
// NOT EXECUTED), its preparation record, and the live-suite
// coverage — proven against the promoted RESERVED AUTHORITY INPUTS
// and the promoted EXLIB-2W/2X completed v2 decisions, which are
// IMMUTABLE inputs (any byte change to any of them voids the
// package and this suite fails).
//
// Proves U1-U16: the promoted source and artifact integrity
// (including the EXLIB-2Y evidence tag bytes); package labels and
// fingerprint pins; statement shape (exactly ONE run INSERT + TWO
// run-item INSERTs, ZERO updates/deletes/seal/deliver calls, the
// eleven-table lock set); MECHANICAL value binding (every reserved
// authority value in the act equals the authority artifact's
// field, extracted from the artifact bytes — never restated by
// hand); membership derivation (ALL_THREE_IDENTITIES = the three
// decision logicals + the three artifact-named aliases, internally
// consistent across act, preconditions, and postconditions);
// per-identity APPROVED-tuple and governed-field gate binding;
// logical-identity resolution with NO hosted surrogate literals;
// the one-use vector gates; structural non-deliverability and
// S5-promotability shape; record truthfulness incl. the MEASURED
// live-suite totals; live-suite presence and coverage; topology
// (the round-0 candidate plus the ONE plain forward round-1
// correction commit); boundary; hygiene; chronology consistency
// (the 11:05 authority instant vs the 19:06 snapshot-decision
// instant, each bound to its own decision family); the EXACT
// ENABLED freeze-trigger bindings (round-1: names and functions
// extracted from the committed migration bytes, never restated);
// and the strengthened ABSOLUTE authority baseline (round-1:
// member + grantor + every option column, quoted from the promoted
// hosted application records; the old role=count shape gone).
// Performs NO hosted contact and NO network activity of any kind.
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

const SRC = '5fd7890233df728167a8a838a329ff14c04f0044'
const SRC_TREE = '4b866c203861b066832cc3bd0fc04c0dc247392a'
const CAND0 = '04654173f1cf393177b857966aa5e30560001285'
const Y_EV_TAG = 'exlib2y-hosted-application-evidence-stable'
const Y_EV_TAG_OBJ = 'cf20360fa94cb1c28b1cd6bf9dbefe4d9dad7692'
const PKG = 'docs/exlib2u-staged-run-package.sql'
const RECORD = 'docs/exlib2u-staged-run-prep-record.md'
const VERIFIER = 'scripts/verify-exlib2u.ts'
const LIVE = 'scripts/verify-exlib2u-live.sh'
const AUTH_FORM = 'docs/exlib2v-s4-authority-inputs-form-completed.json'
const SLUGS = ['plank', 'dead-bug', 'ab-wheel-rollout'] as const
const decOf = (s: string): string => `docs/exlib2w-${s}-snapshot-review-form-v2-completed.json`
const PHASE_ADDS = [PKG, RECORD, VERIFIER, LIVE].sort()
const RETARGETED = ['scripts/verify-exlib2v.ts', 'scripts/verify-exlib2y-application.ts']
const TS_AUTH = '2026-09-07T11:05:00-04:00'
const TS_DEC = '2026-09-07T19:06:00-04:00'

const pkg = read(PKG)
const rec = read(RECORD)
const recFlat = rec.replace(/\s+/g, ' ')
const auth = JSON.parse(read(AUTH_FORM))
const decisions = SLUGS.map((s) => JSON.parse(read(decOf(s))))
const RUN_KEY = auth.requested_inputs.run_key_literal.value as string
const APPROVER = auth.requested_inputs.product_approver_identity.value as string
const LEGAL = auth.requested_inputs.legal_approver_identity.value as string
const P_AT = auth.requested_inputs.product_approver_identity.product_approved_at as string
const L_AT = auth.requested_inputs.legal_approver_identity.legal_approved_at as string
const RATIONALE = auth.requested_inputs.approval_rationale.value as string
const MEMBERSHIP = auth.requested_inputs.run_membership.value as string
const actStart = pkg.indexOf('THE S4 ACT')
const actEnd = pkg.indexOf('Postconditions (ANY mismatch rolls back EVERYTHING)')
const act = pkg.slice(actStart, actEnd)

console.log('EXLIB-2U staged-run package preparation verification (LOCAL-ONLY; the package is PREPARED — NOT EXECUTED; nothing staged anywhere)')

check('U1: the promoted source and the IMMUTABLE inputs are exact — the EXLIB-2Y evidence tag carries its byte-exact 86-byte annotation and peels to the promoted source (whose tree is pinned), and the authority artifact plus each completed v2 decision artifact is byte-identical to its promoted blob (any byte change voids the package)',
  (() => {
    try {
      if (execSync(`git rev-parse refs/tags/${Y_EV_TAG}`, { encoding: 'utf8' }).trim() !== Y_EV_TAG_OBJ) return false
      if (execSync(`git rev-parse refs/tags/${Y_EV_TAG}^{}`, { encoding: 'utf8' }).trim() !== SRC) return false
      if (execSync(`git rev-parse ${SRC}^{tree}`, { encoding: 'utf8' }).trim() !== SRC_TREE) return false
      const raw = execSync(`git cat-file tag refs/tags/${Y_EV_TAG}`, { encoding: 'utf8' })
      if (raw.slice(raw.indexOf('\n\n') + 2) !== 'EXLIB-2Y hosted snapshot-review application evidence — APPLIED — SPENT — NO RUN\n') return false
      for (const f of [AUTH_FORM, ...SLUGS.map(decOf)]) {
        const live = execSync(`git hash-object "${f}"`, { encoding: 'utf8' }).trim()
        const promoted = execSync(`git rev-parse "${SRC}:${f}"`, { encoding: 'utf8' }).trim()
        if (live !== promoted) return false
      }
      return true
    } catch { return false }
  })())
check('U2: the package is labeled and fingerprint-pinned — PREPARED — NOT EXECUTED / ONE-USE NOT idempotent, the only lawful hosted target and the executor boundary named, the authority artifact AND the three decision artifacts pinned inside the package by exact byte size AND sha256 (measured live), and the record pins the package\'s own live fingerprint',
  (() => {
    if (!pkg.includes('PREPARED — NOT EXECUTED') || !pkg.includes('ONE-USE, NOT idempotent')) return false
    if (!pkg.includes('ttybyljytiwntvorugcv')) return false
    if (!pkg.includes('Claude and never by any automated pipeline')) return false
    for (const f of [AUTH_FORM, ...SLUGS.map(decOf)]) {
      const bytes = execSync(`wc -c < "${f}"`, { encoding: 'utf8' }).trim()
      const sha = execSync(`shasum -a 256 "${f}"`, { encoding: 'utf8' }).split(/\s+/)[0]
      if (!pkg.includes(sha)) return false
      if (!pkg.replace(/,/g, '').includes(`${bytes} B`)) return false
    }
    const pkgSha = execSync(`shasum -a 256 "${PKG}"`, { encoding: 'utf8' }).split(/\s+/)[0]
    return recFlat.includes(pkgSha)
  })())
check('U3: package statement shape exact — exactly ONE schema-qualified run INSERT and TWO run-item INSERTs (three INSERTs total), ZERO UPDATE/DELETE statements, ZERO seal/revoke/deliver/rollback CALLS (the function names appear only as existence checks and prose), ONE BEGIN and ONE COMMIT, ONE temp capture table, and the SHARE ROW EXCLUSIVE lock covers exactly the eleven gated tables',
  (() => {
    if ((pkg.match(/^INSERT INTO public\.exercise_catalog_import_runs$/gm) || []).length !== 1) return false
    if ((pkg.match(/^INSERT INTO public\.exercise_catalog_run_items/gm) || []).length !== 2) return false
    if ((pkg.match(/^INSERT INTO/gm) || []).length !== 3) return false
    if ((pkg.match(/^UPDATE /gm) || []).length !== 0) return false
    if ((pkg.match(/^DELETE /gm) || []).length !== 0) return false
    if (/exlib_approve_and_seal_run\('|exlib_revoke_run_delivery\('|PERFORM\s+[^;]*exlib_approve_and_seal_run/.test(pkg)) return false
    if (/deliver_catalog_exercises\('|rollback_catalog_delivery\('|PERFORM\s+[^;]*deliver_catalog_exercises/.test(pkg)) return false
    if (/publish_catalog_content|admit_catalog_content|apply_content_review|load_catalog_/.test(pkg)) return false
    if ((pkg.match(/^BEGIN;$/gm) || []).length !== 1) return false
    if ((pkg.match(/^COMMIT;$/gm) || []).length !== 1) return false
    if ((pkg.match(/^CREATE TEMP TABLE exlib2u_capture ON COMMIT DROP AS$/gm) || []).length !== 1) return false
    const lockStart = pkg.indexOf('LOCK TABLE')
    const lockBlock = pkg.slice(lockStart, pkg.indexOf('IN SHARE ROW EXCLUSIVE MODE', lockStart))
    const locked = Array.from(lockBlock.matchAll(/public\.([a-z_]+)/g)).map((m) => m[1]).sort()
    const expected = ['exercise_catalog', 'exercise_catalog_aliases', 'exercise_catalog_content',
      'exercise_catalog_content_expected_relationships', 'exercise_catalog_import_runs',
      'exercise_catalog_logical', 'exercise_catalog_muscles', 'exercise_catalog_name_claims',
      'exercise_catalog_relationships', 'exercise_catalog_review_events', 'exercise_catalog_run_items'].sort()
    return JSON.stringify(locked) === JSON.stringify(expected)
  })())
check('U4: MECHANICAL authority binding — the act\'s run INSERT carries the reserved authority artifact\'s run key (32 chars, within the 8..200 CHECK), dry_run=false, the product AND legal approver identity, both approval instants, and the rationale CHARACTER-EXACTLY (every literal extracted from the artifact bytes, never restated), and the reserved membership choice is ALL_THREE_IDENTITIES',
  (() => {
    if (RUN_KEY.length !== 32 || RUN_KEY.trim().length < 8 || RUN_KEY.trim().length > 200) return false
    if (P_AT !== TS_AUTH || L_AT !== TS_AUTH) return false
    if (!act.includes(`('${RUN_KEY}', false,`)) return false
    if ((act.match(new RegExp(`'${APPROVER}'`, 'g')) || []).length !== 2) return false
    if (APPROVER !== LEGAL) return false
    if ((act.match(new RegExp(`TIMESTAMPTZ '${P_AT.replace('+', '\\+')}'`, 'g')) || []).length !== 2) return false
    if (!act.includes(`'${RATIONALE}'`)) return false
    if (MEMBERSHIP !== 'ALL_THREE_IDENTITIES') return false
    return pkg.includes('ALL_THREE_IDENTITIES')
  })())
check('U5: membership derivation — the act\'s exercise-member list is exactly the three decision artifacts\' governed logical identities (each with is_active), its alias pairs carry exactly the three aliases the authority artifact names, and the act, the precondition alias gate, and the postcondition expected membership are mutually consistent (six members total)',
  (() => {
    const logicals = decisions.map((d) => d.reviewed_object.logical_uuid as string)
    for (const l of logicals) {
      if (!act.includes(`'${l}'`)) return false
    }
    const exList = act.slice(act.indexOf('(run_id, catalog_id)'), act.indexOf('(run_id, catalog_alias_id)'))
    if (!exList.includes('is_active = true')) return false
    if (Array.from(new Set(Array.from(exList.matchAll(/e21b2c00-[0-9a-f-]+/g)).map((m) => m[0]))).sort().join() !== logicals.slice().sort().join()) return false
    const m = (auth.requested_inputs.run_membership.constraint as string).match(/catalog aliases \(([^)]+)\) as alias members/)
    if (!m) return false
    const aliasNames = m[1].split(', ')
    if (aliasNames.length !== 3) return false
    const aliasList = act.slice(act.indexOf('(run_id, catalog_alias_id)'))
    for (const a of aliasNames) {
      if (!aliasList.includes(`'${a}'`)) return false
      if (!pkg.includes(`#${a}'`)) return false
      if (!pkg.includes(`alias#`)) return false
    }
    for (const l of logicals) {
      if (!pkg.includes(`'exercise#${l}'`)) return false
    }
    // the postcondition's expected-membership constant carries
    // exactly the three alias member lines (the precondition's
    // alias-surface gate uses the bare logical#alias form)
    return (pkg.match(/'alias#e21b2c00-[0-9a-f-]+#/g) || []).length === 3
  })())
check('U6: per-identity gate binding — for each decision artifact, the package precondition stanza for that identity demands review_status=approved with the artifact\'s reviewer, its reviewed_at instant, and its rationale CHARACTER-EXACTLY, plus every governed field (the eleven populated values, the four NULL provenance fields, and version 1); every literal below is EXTRACTED from the artifact bytes',
  (() => {
    for (const d of decisions) {
      const logical = d.reviewed_object.logical_uuid as string
      const g = d.governed_field_set
      const h = d.human_fields
      if (h.decision !== 'APPROVE') return false
      if (h.reviewed_at !== TS_DEC) return false
      const idx = pkg.indexOf(`WHERE c.logical_id = '${logical}' AND c.is_active = true;`)
      if (idx < 0) return false
      const sec = pkg.slice(idx, idx + 3200)
      if (!sec.includes("v_row.review_status <> 'approved'")) return false
      if (!sec.includes(`IS DISTINCT FROM '${h.reviewer}'`)) return false
      if (!sec.includes(`IS DISTINCT FROM TIMESTAMPTZ '${h.reviewed_at}'`)) return false
      if (!sec.includes(`IS DISTINCT FROM '${h.rationale}'`)) return false
      for (const field of ['canonical_name', 'category', 'primary_muscle', 'equipment', 'laterality',
        'tracking_mode', 'provenance', 'movement_pattern', 'training_role', 'difficulty', 'availability'] as const) {
        if (!sec.includes(`v_row.${field} <> '${g[field].value}'`)) return false
      }
      if (!sec.includes('v_row.catalog_version <> 1')) return false
      for (const nul of ['source_url', 'source_page', 'retrieved_at', 'import_confidence']) {
        if (g[nul].value !== null) return false
        if (!sec.includes(`v_row.${nul} IS NOT NULL`)) return false
      }
      if (!sec.includes('v_row.created_at IS NULL')) return false
      if (!pkg.includes(`'${h.rationale}'`)) return false
    }
    return true
  })())
check('U7: governed-identity resolution ONLY — the package contains exactly the three governed logical UUIDs and NO other UUID literal; the hosted snapshot surrogates and the hosted event surrogates appear NOWHERE',
  (() => {
    const uuids = Array.from(new Set(Array.from(pkg.matchAll(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g)).map((m) => m[0]))).sort()
    const expected = decisions.map((d) => d.reviewed_object.logical_uuid as string).sort()
    if (JSON.stringify(uuids) !== JSON.stringify(expected)) return false
    return !pkg.includes('ca566325') && !pkg.includes('1ce09c1f') && !pkg.includes('c715d840')
      && !pkg.includes('33e180fb') && !pkg.includes('4d01df9d') && !pkg.includes('081f696a')
  })())
check('U8: the ONE-USE gates — the precondition pins the exact post-EXLIB-2Y evidence baseline 3/3/5/3/6/1/2/2/0/0/3 (zero runs, zero items) with the explicit one-use refusal, plus the reserved-run-key-exists refusal behind it, and the postcondition pins 3/3/5/3/6/1/2/2/1/6/3 (the vector moves in exactly two positions)',
  pkg.includes("'3/3/5/3/6/1/2/2/0/0/3'") &&
  pkg.includes('ONE-USE and its baseline is gone') &&
  pkg.includes('reserved run key already exists') &&
  pkg.includes("'3/3/5/3/6/1/2/2/1/6/3'"))
check('U9: structural non-deliverability and S5-promotability — the postconditions evaluate the delivery gate\'s own five-conjunct predicate demanding ZERO matches (never calling the function), evaluate the seal validation\'s own member query demanding ZERO unready members and exactly 3 exercise + 3 alias members, and the run INSERT column list is exactly the seven staging columns (no seal, approval-state, operational, or created_at column is ever written)',
  (() => {
    if (!pkg.includes('r.approved_for_delivery = true') || !pkg.includes('r.dry_run = false')
        || !pkg.includes('r.sealed_at IS NOT NULL') || !pkg.includes('r.revoked_at IS NULL')) return false
    if (!pkg.includes('satisfies the delivery predicate (it must NOT)')) return false
    if (!pkg.includes("c.review_status <> 'approved'") || !pkg.includes('char_length(btrim(c.reviewed_by)) = 0')
        || !pkg.includes('char_length(btrim(c.review_rationale)) = 0')) return false
    if (!pkg.includes('would fail the S5 seal validation')) return false
    if (!pkg.includes('<> 3 OR COALESCE(v_alias_members, 0) <> 3')) return false
    const cols = act.match(/INSERT INTO public\.exercise_catalog_import_runs\s*\(([^)]+)\)/)
    if (!cols) return false
    const names = cols[1].split(',').map((c) => c.trim()).sort()
    const want = ['run_key', 'dry_run', 'product_approved_by', 'product_approved_at',
      'legal_approved_by', 'legal_approved_at', 'approval_rationale'].sort()
    return JSON.stringify(names) === JSON.stringify(want)
  })())
check('U10: the record is truthful and complete — it pins the package fingerprint, states PREPARED — NOT EXECUTED with the hosted one-use boundary, carries the MEASURED live-suite totals, explains the two decision-family instants (the 11:05 authority evidence vs the 19:06 snapshot approvals), discloses the vector-shadowed run-key gate as defense-in-depth, documents the ROUND-1 correction (exact enabled trigger bindings; the absolute member/grantor/option authority baseline), and claims no staging, seal, delivery, or hosted contact occurred',
  recFlat.includes('PREPARED — NOT EXECUTED') &&
  recFlat.includes('100 passed, 0 failed') &&
  recFlat.includes('AUTHORITY-decision instant') &&
  recFlat.includes('2026-09-07T11:05:00-04:00') &&
  recFlat.includes('2026-09-07T23:06:00Z') &&
  recFlat.includes('shadowed defense-in-depth') &&
  recFlat.includes('Round-1 correction') &&
  recFlat.includes('exact enabled bindings') &&
  recFlat.includes('member, grantor, or option substitution') &&
  recFlat.includes('No staged run exists anywhere') &&
  recFlat.includes('no seal') &&
  recFlat.includes('No hosted contact') &&
  recFlat.includes('executed hosted exactly once by Joseph/ChatGPT') &&
  !recFlat.includes('has been executed') &&
  !recFlat.includes('was sealed'))
check('U11: the LIVE suite exists and covers the instructed classes — happy path with the AUTHENTICATED live delivery-refusal probe, one-use replay, pre-existing reserved-key run, drifted approval tuple, drifted governed field, missing identity, count-camouflaged duplicate identity, tampered event surface, alias drift, wrong authority, partial-staging atomicity, tampered reserved evidence, the round-1 negative controls (disabled freeze trigger, decoy-rebound freeze trigger, and the three count-preserving authority substitutions with asserted five-field restorations), and the two-session race (the live suite runs on demand against a disposable cluster; it is deliberately outside the TS battery, as every live suite is)',
  (() => {
    const live = read(LIVE)
    for (const s of ['LIVE non-deliverability', 'ONE-USE: the second execution',
      'PRE-EXISTING RESERVED-KEY RUN', 'DRIFTED APPROVAL TUPLE', 'DRIFTED GOVERNED FIELD',
      'MISSING IDENTITY', 'DUPLICATE IDENTITY', 'TAMPERED EVENT SURFACE', 'ALIAS DRIFT',
      'WRONG AUTHORITY', 'PARTIAL STAGING', 'TAMPERED RESERVED EVIDENCE',
      'DISABLED FREEZE TRIGGER', 'DECOY-REBOUND FREEZE TRIGGER',
      'COUNT-PRESERVING MEMBER SUBSTITUTION', 'COUNT-PRESERVING ADMIN-OPTION FLIP',
      'COUNT-PRESERVING GRANTOR SUBSTITUTION', 'RESTORED to the exact five-field baseline',
      'exactly ONE commits']) {
      if (!live.includes(s)) return false
    }
    if (!live.includes('disposable local PostgreSQL ONLY')) return false
    if (!live.includes(PKG)) return false
    return live.includes('docs/exlib2y-snapshot-review-application-package.sql')
  })())
// RETARGET (EXLIB-2U hosted-application evidence): this phase
// COMPLETED — round 1 was accepted by Codex, closed out (published
// + promoted + tagged reviewed-not-executed), and its package has
// since been EXECUTED hosted exactly once — so its topology claims
// are anchored at the phase's own promoted tip, where they held
// and hold forever; the HEAD-relative form went stale at the first
// successor commit, the same completed-phase pattern as every
// predecessor (ninth instance).
const TIP2U = 'ea8f6902b7b42a4d7f5a9af8c376900da5533e5c'
{
  check('U12: topology and inventory exact — the round-0 candidate plus ONE plain forward round-1 correction commit at the promoted phase tip (single-parent chain source -> candidate -> correction), the CUMULATIVE diff carrying exactly the FOUR added phase paths plus ONLY the two labeled retargets, and the correction commit touching ONLY the package, the record, and the two 2U verifiers; nothing deleted anywhere',
    (() => {
      try {
        if (execSync(`git merge-base ${SRC} ${TIP2U}`, { encoding: 'utf8' }).trim() !== SRC) return false
        if (execSync(`git rev-list --count ${SRC}..${TIP2U}`, { encoding: 'utf8' }).trim() !== '2') return false
        const p1 = execSync(`git rev-list --parents -n 1 ${TIP2U}`, { encoding: 'utf8' }).trim().split(/\s+/)
        if (p1.length !== 2 || p1[1] !== CAND0) return false
        const p0 = execSync(`git rev-list --parents -n 1 ${CAND0}`, { encoding: 'utf8' }).trim().split(/\s+/)
        if (p0.length !== 2 || p0[1] !== SRC) return false
        const status = execSync(`git diff --name-status ${SRC}..${TIP2U}`, { encoding: 'utf8' })
          .split('\n').filter(Boolean).sort()
        const expected = [
          ...PHASE_ADDS.map((p) => `A\t${p}`),
          ...RETARGETED.map((p) => `M\t${p}`),
        ].sort()
        if (JSON.stringify(status) !== JSON.stringify(expected)) return false
        const corr = execSync(`git diff --name-status ${CAND0}..${TIP2U}`, { encoding: 'utf8' })
          .split('\n').filter(Boolean).sort()
        const corrExpected = [PKG, RECORD, VERIFIER, LIVE].sort().map((p) => `M\t${p}`)
        return JSON.stringify(corr) === JSON.stringify(corrExpected)
      } catch { return false }
    })())
}
check('U13: the boundary holds — the package lives under docs/ (never supabase/migrations/), no OTHER .sql path enters the phase, no phase file names the delivery environment-variable literals, the record carries no executable package markers, the package\'s non-ASCII is the em-dash and box-drawing rules only, the record\'s is the em-dash only, and no phase file carries endpoint or credential material',
  (() => {
    if (!PKG.startsWith('docs/')) return false
    if (PHASE_ADDS.filter((p) => p.endsWith('.sql')).length !== 1) return false
    for (const p of PHASE_ADDS) {
      const t = read(p)
      if (t.includes('CATALOG' + '_DELIVERY_' + 'ENABLED')) return false
      if (t.includes('CATALOG' + '_DELIVERY_' + 'RUN_KEY')) return false
    }
    for (const bad of ['BEGIN;', 'COMMIT;', 'LOCK TABLE']) {
      if (rec.includes(bad)) return false
    }
    for (const ch of pkg) {
      const c = ch.codePointAt(0) as number
      if (c > 127 && c !== 0x2014 && c !== 0x2500) return false
    }
    for (const ch of rec) {
      const c = ch.codePointAt(0) as number
      if (c > 127 && c !== 0x2014) return false
      if (c < 32 && ch !== '\n') return false
    }
    const payload = PHASE_ADDS.map(read).join('\n')
    const bads = ['supabase' + '.co', 'vercel' + '.com', 'postgresql' + '://', 'postgres' + '://',
      'SUPABASE' + '_URL', 'SUPABASE' + '_SERVICE', 'api' + 'key', 'Bearer' + ' ', 'ey' + 'J']
    return !bads.some((b) => payload.includes(b))
  })())
check('U14: chronology consistency — the authority instant (11:05 EDT = 15:05Z) and the snapshot-decision instant (19:06 EDT = 23:06Z) are DISTINCT instants proven by parse, each bound to its own family: the 11:05 literal appears exactly 5 times (header + the act\'s two evidence columns + the postcondition\'s two), the 19:06 literal exactly 4 times (the three tuple gates + the event gate), and neither replaces the other anywhere',
  (() => {
    if (Date.parse(TS_AUTH) !== Date.parse('2026-09-07T15:05:00Z')) return false
    if (Date.parse(TS_DEC) !== Date.parse('2026-09-07T23:06:00Z')) return false
    if (Date.parse(TS_AUTH) === Date.parse(TS_DEC)) return false
    if ((pkg.match(/2026-09-07T11:05:00-04:00/g) || []).length !== 5) return false
    if ((pkg.match(/2026-09-07T19:06:00-04:00/g) || []).length !== 4) return false
    for (const d of decisions) if (d.human_fields.reviewed_at !== TS_DEC) return false
    return auth.requested_inputs.product_approver_identity.product_approved_at === TS_AUTH
  })())
check('U15: EXACT ENABLED trigger bindings (round-1) — the package pins each freeze trigger as an exact binding: the promoted trigger NAME on the promoted TABLE executing the promoted FUNCTION (name and function EXTRACTED from the committed migration bytes, never restated) over the promoted BEFORE-ROW event set (tgtype 23 / 31), ENABLED (tgenabled=O), each the SOLE non-internal trigger on its table; the old some-trigger-exists shape appears nowhere',
  (() => {
    const mig = read('supabase/migrations/023_exlib_catalog_and_delivery_contract.sql')
    const m1 = mig.match(/CREATE TRIGGER (\w+)\s+BEFORE INSERT OR UPDATE ON exercise_catalog_import_runs\s+FOR EACH ROW EXECUTE FUNCTION (\w+)\(\)/)
    const m2 = mig.match(/CREATE TRIGGER (\w+)\s+BEFORE INSERT OR UPDATE OR DELETE ON exercise_catalog_run_items\s+FOR EACH ROW EXECUTE FUNCTION (\w+)\(\)/)
    if (!m1 || !m2) return false
    if (!pkg.includes(`t.tgname = '${m1[1]}'`)) return false
    if (!pkg.includes(`t.tgfoid = 'public.${m1[2]}()'::regprocedure`)) return false
    if (!pkg.includes(`t.tgname = '${m2[1]}'`)) return false
    if (!pkg.includes(`t.tgfoid = 'public.${m2[2]}()'::regprocedure`)) return false
    if (!pkg.includes('t.tgtype = 23') || !pkg.includes('t.tgtype = 31')) return false
    if ((pkg.match(/t\.tgenabled = 'O'/g) || []).length !== 2) return false
    if ((pkg.match(/NOT t\.tgisinternal/g) || []).length !== 2) return false
    if (/NOT EXISTS \(SELECT 1 FROM pg_trigger/.test(pkg)) return false
    return pkg.includes('not EXACTLY bound and enabled')
  })())
check('U16: strengthened ABSOLUTE authority baseline (round-1) — the package pins all four catalog-role memberships as complete tuples (member postgres, grantor supabase_admin, ADMIN TRUE, INHERIT FALSE, SET FALSE — the exact shape the promoted EXLIB-2K/2O hosted application records preserved, verified against their bytes) AND captures-and-compares the WHOLE membership rows across the gated interval; the old role=count shape appears nowhere',
  (() => {
    const kFlat = read('docs/exlib2k-hosted-load-application-record.md').replace(/\s+/g, ' ')
    const oFlat = read('docs/exlib2o-hosted-load-application-record.md').replace(/\s+/g, ' ')
    if (!kFlat.includes('ADMIN TRUE, INHERIT FALSE, SET FALSE')) return false
    if (!oFlat.includes('ADMIN TRUE, INHERIT FALSE, SET FALSE')) return false
    if (!kFlat.includes('grantor is supabase_admin') && !kFlat.includes('grantor supabase_admin')) return false
    for (const role of ['exlib_catalog_admin', 'exlib_catalog_admission', 'exlib_catalog_loader', 'exlib_catalog_reviewer']) {
      if (!pkg.includes(`'${role}>postgres@supabase_admin:true:false:false'`)) return false
    }
    if (!pkg.includes('authority_digest')) return false
    if ((pkg.match(/string_agg\(am::text, '\|' ORDER BY am\.roleid, am\.member, am\.grantor\)/g) || []).length !== 2) return false
    if (/rolname \|\| '=' \|\| x\.n::text/.test(pkg)) return false
    if (!pkg.includes('count-preserving member, grantor, or option substitution')) return false
    return pkg.includes('member, grantor, and every option column')
  })())

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
