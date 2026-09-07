// EXLIB-2W STATIC verification (LOCAL-ONLY): the human-decision
// transcription milestone — three round-0 snapshot transcripts
// (HISTORICAL, NON-OPERATIVE per Codex round 1: they hold populated
// APPROVE fields under a fixed blank-state declaration, so they
// record no presently valid decision) plus the completed S4
// authority-inputs form (unaffected, reserved evidence), the three
// superseding v2 BLANK templates awaiting fresh human review, and
// this milestone's record. The round-0 transcripts were transcribed
// VERBATIM from the human-supplied decisions of
// 2026-09-07T11:05:00-04:00 into copies of the promoted EXLIB-2V
// blank templates (which remain untouched).
//
// Proves the fifteen instructed families W1-W15: template
// integrity, leaf-exact completion transitions, non-null and
// character-exact supplied values, APPROVE decisions, timestamp
// parsing/equivalence/chronology, unchanged governed content,
// the seven-leaf authority completion, run-key freshness and
// bounds, the ALL_THREE_IDENTITIES membership, the
// no-mutation-surface boundary, the record's truthful
// nothing-applied claims, topology, and hygiene — PLUS the Codex
// round-1 W16 lifecycle-state coherence rule: a form's status is
// DERIVED from its six human fields, never trusted from a fixed
// declaration; the three round-0 completed forms are the only
// tolerated incoherent artifacts (populated decisions still
// declaring the blank-template state), and ONLY because the record
// declares them NON-OPERATIVE — no valid snapshot decision is
// currently claimed, and the superseding v2 BLANK templates await
// fresh human review — AND the Codex round-2 W17 transcription-
// authority boundary: the human authors every decision value and
// may expressly instruct character-for-character mechanical
// transcription, but no machine may ever make, infer, preselect,
// normalize, supplement, or invent one. Performs NO hosted contact
// and NO network activity of any kind.
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

const SRC = '0d4dad415a40c8b4baf042651e3f748f3c8c9f5e'
const SRC_TREE = 'badf189368c74cf4d47bcd251c8bcefe5cc1fd80'
const V_TAG = 'exlib2v-snapshot-review-decision-prep-stable'
const V_TAG_OBJ = '2ad1b44fc20af79d3aa5d9674a0ecc6502386da7'
const RECORD = 'docs/exlib2w-human-decision-record.md'
const VERIFIER = 'scripts/verify-exlib2w.ts'
const SLUGS = ['plank', 'dead-bug', 'ab-wheel-rollout'] as const
const blankOf = (s: string): string => `docs/exlib2v-${s}-snapshot-review-form.json`
const doneOf = (s: string): string => `docs/exlib2v-${s}-snapshot-review-form-completed.json`
const AUTH_BLANK = 'docs/exlib2v-s4-authority-inputs-form.json'
const AUTH_DONE = 'docs/exlib2v-s4-authority-inputs-form-completed.json'
const PHASE_ADDS = [...SLUGS.map(doneOf), AUTH_DONE, RECORD, VERIFIER].sort()
const TS_EDT = '2026-09-07T11:05:00-04:00'
const RUN_KEY = 'exlib2u-plank-release1-staged-v1'
const HUMAN_KEYS = ['decision', 'reviewer', 'reviewer_role_or_credential', 'reviewed_at', 'rationale', 'evidence'] as const

const rec = read(RECORD)
const recFlat = rec.replace(/\s+/g, ' ')

type Leaves = Map<string, unknown>
function leaves(v: unknown, prefix: string, out: Leaves): Leaves {
  if (v !== null && typeof v === 'object') {
    if (Array.isArray(v)) v.forEach((x, i) => leaves(x, `${prefix}[${i}]`, out))
    else for (const [k, x] of Object.entries(v as Record<string, unknown>)) leaves(x, `${prefix}/${k}`, out)
  } else out.set(prefix, v)
  return out
}
function leafDiff(a: unknown, b: unknown): string[] {
  const la = leaves(a, '', new Map())
  const lb = leaves(b, '', new Map())
  const paths = Array.from(new Set(Array.from(la.keys()).concat(Array.from(lb.keys()))))
  const diff: string[] = []
  for (const p of paths) {
    if (!la.has(p) || !lb.has(p) || la.get(p) !== lb.get(p)) diff.push(p)
  }
  return diff.sort()
}

const SUPPLIED: Record<string, Record<string, string>> = {
  'plank': {
    decision: 'APPROVE', reviewer: 'Joseph Carfagno',
    reviewer_role_or_credential: 'Product owner', reviewed_at: TS_EDT,
    rationale: 'Approved as an accurate timed, bilateral bodyweight core exercise.',
    evidence: 'Reviewed the complete EXLIB-2V Plank snapshot-review packet.',
  },
  'dead-bug': {
    decision: 'APPROVE', reviewer: 'Joseph Carfagno',
    reviewer_role_or_credential: 'Product owner', reviewed_at: TS_EDT,
    rationale: 'Approved as an accurate alternating bodyweight core and mobility exercise.',
    evidence: 'Reviewed the complete EXLIB-2V Dead bug snapshot-review packet.',
  },
  'ab-wheel-rollout': {
    decision: 'APPROVE', reviewer: 'Joseph Carfagno',
    reviewer_role_or_credential: 'Product owner', reviewed_at: TS_EDT,
    rationale: 'Approved as an accurate advanced bilateral weighted-repetition core exercise.',
    evidence: 'Reviewed the complete EXLIB-2V Ab wheel rollout snapshot-review packet.',
  },
}

console.log('EXLIB-2W human-decision transcription verification (LOCAL-ONLY; round-0 transcripts NON-OPERATIVE; v2 templates blank; nothing applied anywhere)')

check('W1: every promoted BLANK template is byte-identical to promoted main — the three snapshot-review templates and the S4 authority-inputs template are untouched by this phase, and the promoted source tag/annotation are exact',
  (() => {
    try {
      if (execSync(`git rev-parse refs/tags/${V_TAG}`, { encoding: 'utf8' }).trim() !== V_TAG_OBJ) return false
      if (execSync(`git rev-parse refs/tags/${V_TAG}^{}`, { encoding: 'utf8' }).trim() !== SRC) return false
      if (execSync(`git rev-parse ${SRC}^{tree}`, { encoding: 'utf8' }).trim() !== SRC_TREE) return false
      const raw = execSync(`git cat-file tag refs/tags/${V_TAG}`, { encoding: 'utf8' })
      if (raw.slice(raw.indexOf('\n\n') + 2) !== 'EXLIB-2V hosted snapshot-review decision packets and S4 authority inputs — PREPARED — HUMAN DECISIONS PENDING\n') return false
      for (const p of [...SLUGS.map(blankOf), AUTH_BLANK]) {
        const live = execSync(`git hash-object "${p}"`, { encoding: 'utf8' }).trim()
        const promoted = execSync(`git rev-parse "${SRC}:${p}"`, { encoding: 'utf8' }).trim()
        if (live !== promoted) return false
      }
      return true
    } catch { return false }
  })())
check('W2: each round-0 snapshot transcript (HISTORICAL, NON-OPERATIVE) differs from its blank template at EXACTLY the six human_fields leaves — a structural leaf-walk over both parsed documents finds identical key sets and value differences only at /human_fields/{decision,reviewer,reviewer_role_or_credential,reviewed_at,rationale,evidence}',
  (() => {
    for (const s of SLUGS) {
      const diff = leafDiff(JSON.parse(read(blankOf(s))), JSON.parse(read(doneOf(s))))
      const expected = HUMAN_KEYS.map((k) => `/human_fields/${k}`).sort()
      if (JSON.stringify(diff) !== JSON.stringify(expected)) return false
    }
    return true
  })())
check('W3: NO transcribed human field is null or blank — all six fields in all three round-0 NON-OPERATIVE transcripts are non-null strings with non-zero trimmed length',
  SLUGS.every((s) => {
    const h = JSON.parse(read(doneOf(s))).human_fields
    return HUMAN_KEYS.every((k) => typeof h[k] === 'string' && h[k].trim().length > 0)
  }))
check('W4: every round-0 transcribed value is CHARACTER-EXACT — decision, reviewer, credential, timestamp, rationale, and evidence in each NON-OPERATIVE transcript equal the then-supplied strings verbatim (a historical-fidelity fact, not a claim of present validity)',
  SLUGS.every((s) => {
    const h = JSON.parse(read(doneOf(s))).human_fields
    return HUMAN_KEYS.every((k) => h[k] === SUPPLIED[s][k])
  }))
check('W5: all three round-0 transcripts carry APPROVE (historical content of the NON-OPERATIVE transcripts, not a presently valid decision)',
  SLUGS.every((s) => JSON.parse(read(doneOf(s))).human_fields.decision === 'APPROVE'))
check('W6: the decision timestamp parses and equals the UTC instant 2026-09-07T15:05:00Z — the EDT representation is preserved in every completed form and its timezone conversion is proven, not assumed',
  (() => {
    const edt = Date.parse(TS_EDT)
    const utc = Date.parse('2026-09-07T15:05:00Z')
    if (!(Number.isFinite(edt) && edt === utc)) return false
    return SLUGS.every((s) => JSON.parse(read(doneOf(s))).human_fields.reviewed_at === TS_EDT)
      && recFlat.includes('2026-09-07T15:05:00Z')
  })())
check('W7: the decision instant FOLLOWS the stable-tag publication — after the recorded push-completion instant 2026-09-07T15:01:23Z (pinned in the record) and mechanically after the tag object\'s own tagger instant read from the raw tag bytes',
  (() => {
    const edt = Date.parse(TS_EDT)
    if (!(edt > Date.parse('2026-09-07T15:01:23Z'))) return false
    if (!recFlat.includes('2026-09-07T15:01:23Z')) return false
    const raw = execSync(`git cat-file tag refs/tags/${V_TAG}`, { encoding: 'utf8' })
    const m = raw.match(/^tagger .* (\d+) [+-]\d{4}$/m)
    if (!m) return false
    return edt > Number(m[1]) * 1000
  })())
check('W8: reviewed-object identities, governed fields, source fingerprints, lifecycle rules, and the created_at UNKNOWN sentinel are UNCHANGED from the approved templates in every round-0 NON-OPERATIVE transcript — the identical lifecycle bytes are exactly what makes those transcripts incoherent and non-operative (the leaf-walk of W2 bounds the change surface)',
  SLUGS.every((s) => {
    const b = JSON.parse(read(blankOf(s)))
    const c = JSON.parse(read(doneOf(s)))
    return JSON.stringify(c.reviewed_object) === JSON.stringify(b.reviewed_object)
      && JSON.stringify(c.governed_field_set) === JSON.stringify(b.governed_field_set)
      && c.governed_field_set.created_at.value === 'UNKNOWN_NOT_PRESERVED_HOSTED_GENERATED'
      && JSON.stringify(c.lifecycle) === JSON.stringify(b.lifecycle)
      && JSON.stringify(c.promoted_source_fingerprints_git_blob_sha1_at_source_commit)
        === JSON.stringify(b.promoted_source_fingerprints_git_blob_sha1_at_source_commit)
      && c.verbatim_scope === b.verbatim_scope
  }))
check('W9: the completed authority form differs from its blank template at EXACTLY the seven authorized value leaves (both approver identities and timestamps, the approval rationale, the run-key literal, the membership choice) with the supplied values character-exact',
  (() => {
    const diff = leafDiff(JSON.parse(read(AUTH_BLANK)), JSON.parse(read(AUTH_DONE)))
    const expected = [
      '/requested_inputs/approval_rationale/value',
      '/requested_inputs/legal_approver_identity/legal_approved_at',
      '/requested_inputs/legal_approver_identity/value',
      '/requested_inputs/product_approver_identity/product_approved_at',
      '/requested_inputs/product_approver_identity/value',
      '/requested_inputs/run_key_literal/value',
      '/requested_inputs/run_membership/value',
    ].sort()
    if (JSON.stringify(diff) !== JSON.stringify(expected)) return false
    const ri = JSON.parse(read(AUTH_DONE)).requested_inputs
    if (ri.product_approver_identity.value !== 'Joseph Carfagno') return false
    if (ri.product_approver_identity.product_approved_at !== TS_EDT) return false
    if (ri.legal_approver_identity.value !== 'Joseph Carfagno') return false
    if (ri.legal_approver_identity.legal_approved_at !== TS_EDT) return false
    if (ri.approval_rationale.value !== 'Approved for staged delivery validation of Plank and its reviewed progression and substitution targets. This does not authorize sealing, production delivery, or enabling the delivery flag; those remain separately gated.') return false
    if (ri.run_key_literal.value !== RUN_KEY) return false
    return recFlat.includes('HUMAN-SUPPLIED both authority identities') &&
      recFlat.includes('The schema does not require distinct product and legal approvers')
  })())
check('W10: the run key satisfies the schema rule and is FRESH — 8-200 characters after btrim, and absent from the entire promoted tree at the source commit (repository files and hosted evidence records alike)',
  (() => {
    const trimmed = RUN_KEY.trim()
    if (!(trimmed.length >= 8 && trimmed.length <= 200)) return false
    try {
      const hits = execSync(`git grep -l "${RUN_KEY}" ${SRC} || true`, { encoding: 'utf8' }).trim()
      return hits === ''
    } catch { return false }
  })())
check('W11: membership is exactly ALL_THREE_IDENTITIES — the human product decision, recorded with its seal consequence (all three snapshots must be applied approved before S5 can seal)',
  JSON.parse(read(AUTH_DONE)).requested_inputs.run_membership.value === 'ALL_THREE_IDENTITIES' &&
  recFlat.includes('ALL_THREE_IDENTITIES was the human product decision') &&
  recFlat.includes('before S5 sealing can succeed'))
check('W12: NO mutation surface is introduced — no phase file is .sql, none carries SQL package markers, RPC calls, hosted endpoints, or environment-variable assignments, and no seed, inventory, migration, or configuration path is touched',
  (() => {
    for (const p of PHASE_ADDS) {
      const t = read(p)
      if (p.endsWith('.sql')) return false
      if (p !== VERIFIER) {
        for (const bad of ['BEGIN;', 'COMMIT;', 'LOCK TABLE', 'SET ROLE', 'RESET ROLE']) {
          if (t.includes(bad)) return false
        }
        if (/^\s*(INSERT INTO|UPDATE\s+public\.|DELETE FROM)/m.test(t)) return false
        if (t.includes('supabase.rpc')) return false
      }
      if (t.includes('CATALOG' + '_DELIVERY_' + 'ENABLED')) return false
      if (t.includes('CATALOG' + '_DELIVERY_' + 'RUN_KEY')) return false
    }
    return true
  })())
check('W13: the record claims NOTHING was applied — the not-yet statements are present (pending snapshots, zero review events, no S4 run, application package separately gated) and no contrary occurred-claim exists',
  recFlat.includes('No hosted snapshot review has been applied') &&
  recFlat.includes('exercise_catalog_review_events remains at its promoted pre-application value of ZERO') &&
  recFlat.includes('No S4 run exists') &&
  recFlat.includes('RESERVED INPUTS ONLY') &&
  recFlat.includes('separately reviewed, ONE-USE hosted snapshot-review APPLICATION package') &&
  !recFlat.includes('review event was created') &&
  !recFlat.includes('has been sealed'))
const PORCELAIN = execSync('git status --porcelain', { encoding: 'utf8' }).split('\n').filter(Boolean)
const CHANGED = PORCELAIN.map((l) => l.slice(3).trim()).sort()
const committed = CHANGED.length === 0
  && execSync(`git rev-list --count ${SRC}..HEAD`, { encoding: 'utf8' }).trim() !== '0'
const V2_FORMS = SLUGS.map((s) => `docs/exlib2w-${s}-snapshot-review-form-v2.json`)
// RETARGET (EXLIB-2X v2 decision transcription): this phase
// COMPLETED — reviewed, published, promoted, production-deployed,
// and tagged — so its topology claims are anchored at the phase's
// own promoted tip (below) instead of HEAD, where they held and
// hold forever; the HEAD-relative form went stale at the first
// successor commit, the same completed-phase pattern as before.
const TIP2W = '02bb9c462be99af128fc288cb59d4197b261faaf'
{
  check('W14: topology and inventory exact — THREE plain single-parent commits at the promoted phase tip: the PRESERVED round-0 transcription commit and the PRESERVED round-1 correction (exact pinned ids AND trees) plus ONE forward Codex-round-2 correction touching exactly the FIVE round-2 paths (the three v2 templates, the record, this verifier); the full range carries exactly TEN paths; nothing deleted',
    (() => {
      try {
        const W0 = '28ec4aebc4796317bb2a3fde663fc80b859773cd'
        const W0_TREE = '6972c99c0dad1da09ee893c3175f8fd4ae042b18'
        const W1 = '373b97acff103f24d1f3c6fbf651000a6b7e9fbf'
        const W1_TREE = '6cec33caf09f642365071f560fbf75ac1df7b348'
        if (execSync(`git merge-base ${SRC} ${TIP2W}`, { encoding: 'utf8' }).trim() !== SRC) return false
        const headParents = execSync(`git rev-list --parents -n 1 ${TIP2W}`, { encoding: 'utf8' }).trim().split(/\s+/)
        if (headParents.length !== 2 || headParents[1] !== W1) return false
        const w1Parents = execSync(`git rev-list --parents -n 1 ${W1}`, { encoding: 'utf8' }).trim().split(/\s+/)
        if (w1Parents.length !== 2 || w1Parents[1] !== W0) return false
        const w0Parents = execSync(`git rev-list --parents -n 1 ${W0}`, { encoding: 'utf8' }).trim().split(/\s+/)
        if (w0Parents.length !== 2 || w0Parents[1] !== SRC) return false
        if (execSync(`git rev-parse ${W0}^{tree}`, { encoding: 'utf8' }).trim() !== W0_TREE) return false
        if (execSync(`git rev-parse ${W1}^{tree}`, { encoding: 'utf8' }).trim() !== W1_TREE) return false
        if (execSync(`git rev-list --count ${SRC}..${TIP2W}`, { encoding: 'utf8' }).trim() !== '3') return false
        if (execSync(`git rev-list --count --merges ${SRC}..${TIP2W}`, { encoding: 'utf8' }).trim() !== '0') return false
        const corr = execSync(`git diff --name-status ${W1}..${TIP2W}`, { encoding: 'utf8' })
          .split('\n').filter(Boolean).sort()
        const corrExpected = [
          ...V2_FORMS.map((p) => `M\t${p}`),
          `M\t${RECORD}`, `M\t${VERIFIER}`,
        ].sort()
        if (JSON.stringify(corr) !== JSON.stringify(corrExpected)) return false
        const status = execSync(`git diff --name-status ${SRC}..${TIP2W}`, { encoding: 'utf8' })
          .split('\n').filter(Boolean).sort()
        const expected = [
          ...PHASE_ADDS.map((p) => `A\t${p}`),
          ...V2_FORMS.map((p) => `A\t${p}`),
          'M\tscripts/verify-exlib2v.ts',
        ].sort()
        return JSON.stringify(status) === JSON.stringify(expected)
      } catch { return false }
    })())
}
check('W15: hygiene and credential boundaries — all four completed forms are pure ASCII, the record\'s non-ASCII is the em-dash only, and no phase file contains endpoint or credential material',
  (() => {
    for (const p of [...SLUGS.map(doneOf), AUTH_DONE]) {
      for (const ch of read(p)) if ((ch.codePointAt(0) as number) > 127) return false
    }
    for (const ch of rec) {
      const c = ch.codePointAt(0) as number
      if (c > 127 && c !== 0x2014) return false
      if (c < 32 && ch !== '\n') return false
    }
    const payload = [...PHASE_ADDS].map(read).join('\n')
    const bads = [
      'supabase' + '.co', 'vercel' + '.com', 'postgresql' + '://', 'postgres' + '://',
      'SUPABASE' + '_URL', 'SUPABASE' + '_SERVICE', 'api' + 'key', 'Bearer' + ' ', 'ey' + 'J',
      '--db' + '-url', '--lin' + 'ked', 'db ' + 'push',
    ]
    return !bads.some((b) => payload.includes(b))
  })())

check('W16: LIFECYCLE-STATE COHERENCE (Codex round 1) — every snapshot-review form artifact\'s status is DERIVED mechanically from its six human fields (all null = blank template; all non-null = completed decision; mixed = INVALID and rejected outright); a populated form carrying the fixed present-tense blank-template declaration is INCOHERENT, and exactly the three enumerated round-0 completed forms are tolerated as such — only because the record declares them NON-OPERATIVE with no valid snapshot decision currently claimed; the three v2 templates carry the state-neutral mechanical rule (no fixed state declaration), derive as blank, copy the governed facts exactly, and keep every other lifecycle rule verbatim',
  (() => {
    const FIXED_BLANK_DECL = 'PREPARED_BLANK_TEMPLATE - this prepared blank form is an approved template, NOT a decision'
    const derive = (h: Record<string, unknown>): string => {
      const nulls = HUMAN_KEYS.filter((k) => h[k] === null).length
      if (nulls === HUMAN_KEYS.length) return 'BLANK'
      if (nulls === 0) return 'COMPLETED'
      return 'INVALID'
    }
    const incoherent: string[] = []
    const all = [...SLUGS.map(blankOf), ...SLUGS.map(doneOf), ...V2_FORMS]
    for (const p of all) {
      const f = JSON.parse(read(p))
      const status = derive(f.human_fields)
      if (status === 'INVALID') return false
      const fixedDecl = typeof f.lifecycle.state === 'string' && f.lifecycle.state.startsWith(FIXED_BLANK_DECL)
      if (status === 'COMPLETED' && fixedDecl) incoherent.push(p)
      if (status === 'BLANK' && typeof f.lifecycle.state === 'string' && !fixedDecl) return false
    }
    if (JSON.stringify(incoherent.sort()) !== JSON.stringify(SLUGS.map(doneOf).sort())) return false
    if (!recFlat.includes('NON-OPERATIVE')) return false
    if (!recFlat.includes('NO VALID SNAPSHOT DECISION IS CURRENTLY CLAIMED')) return false
    for (const p of V2_FORMS) {
      const f = JSON.parse(read(p))
      if (f.lifecycle.state !== undefined) return false
      const rule = String(f.lifecycle.state_rule)
      if (!rule.includes('DERIVED MECHANICALLY FROM THE SIX human_fields')) return false
      if (!rule.includes('COMPLETED_HUMAN_DECISION')) return false
      if (!rule.includes('INVALID')) return false
      if (derive(f.human_fields) !== 'BLANK') return false
      if (f.form_version !== 2) return false
      if (!String(f.supersedes).includes('NON-OPERATIVE')) return false
      const slug = p.replace('docs/exlib2w-', '').replace('-snapshot-review-form-v2.json', '')
      const blank = JSON.parse(read(blankOf(slug)))
      if (JSON.stringify(f.governed_field_set) !== JSON.stringify(blank.governed_field_set)) return false
      if (JSON.stringify(f.reviewed_object) !== JSON.stringify(blank.reviewed_object)) return false
      if (f.verbatim_scope !== blank.verbatim_scope) return false
      // the v2 completion transition LAWFULLY differs from the 2V
      // blank's (Codex round 2: the human-authorship / mechanical-
      // transcription boundary); W17 owns its exact text. The other
      // three rules stay verbatim.
      for (const k of ['post_completion_immutability', 'external_voiding', 'no_database_effect']) {
        if (f.lifecycle[k] !== blank.lifecycle[k]) return false
      }
      if (f.governed_field_set.created_at.value !== 'UNKNOWN_NOT_PRESERVED_HOSTED_GENERATED') return false
    }
    return true
  })())

check('W17: TRANSCRIPTION-AUTHORITY COHERENCE (Codex round 2) — all three v2 templates carry the SAME exact human-authorship/mechanical-transcription boundary: the human supplies all six values explicitly and may either enter them directly or EXPRESSLY INSTRUCT a mechanical transcriber to copy them character-for-character; the transcriber may never infer, select, preselect, normalize, rewrite, summarize, supplement, or invent a value; absent evidence needs the HUMAN\'s explicit no-evidence statement; the absolute machine/preparer prohibition is GONE from every v2 template; no wording grants machine judgment; all six human fields remain null; no valid snapshot decision is currently claimed; and fresh explicit human decisions with a new timestamp remain required',
  (() => {
    const texts = V2_FORMS.map((p) => JSON.parse(read(p)).lifecycle.lawful_completion_transition as string)
    if (new Set(texts).size !== 1) return false
    const t = texts[0]
    if (!t.includes('supplies ALL SIX human_fields values')) return false
    if (!t.includes('EXPRESSLY INSTRUCT a mechanical transcriber to copy the supplied strings character-for-character')) return false
    if (!t.includes('may NOT infer, select, preselect, normalize, rewrite, summarize, supplement, or invent any value')) return false
    if (!t.includes('authored by the human alone')) return false
    if (!t.includes('not permission for any machine to make, infer, or complete a human decision')) return false
    if (!t.includes('the HUMAN supplies the explicit no-evidence statement (never the transcriber)')) return false
    if (!t.includes('exactly these six human_fields leaves and NO OTHER BYTE')) return false
    for (const p of V2_FORMS) {
      const raw = read(p)
      if (raw.includes('NO machine or preparer may fill')) return false
      if (/(may|can|is permitted to|allowed to)\s+(infer|select|preselect|normalize|rewrite|summarize|supplement|invent|complete)/.test(raw)) return false
      const h = JSON.parse(raw).human_fields
      for (const k of HUMAN_KEYS) if (h[k] !== null) return false
    }
    return recFlat.includes('NO VALID SNAPSHOT DECISION IS CURRENTLY CLAIMED')
      && recFlat.includes('FRESH human review') && recFlat.includes('NEW timestamp')
  })())

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
