// EXLIB-2W STATIC verification (LOCAL-ONLY): the completed
// human-decision artifacts — three completed hosted-snapshot
// review forms and the completed S4 authority-inputs form,
// transcribed VERBATIM from the human-supplied decisions of
// 2026-09-07T11:05:00-04:00 into completed copies of the promoted
// EXLIB-2V blank templates (which remain untouched).
//
// Proves the fifteen instructed families W1-W15: template
// integrity, leaf-exact completion transitions, non-null and
// character-exact supplied values, APPROVE decisions, timestamp
// parsing/equivalence/chronology, unchanged governed content,
// the seven-leaf authority completion, run-key freshness and
// bounds, the ALL_THREE_IDENTITIES membership, the
// no-mutation-surface boundary, the record's truthful
// nothing-applied claims, topology, and hygiene. Performs NO
// hosted contact and NO network activity of any kind.
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

console.log('EXLIB-2W completed human-decision artifacts verification (LOCAL-ONLY; transcription only; nothing applied anywhere)')

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
check('W2: each completed snapshot form differs from its blank template at EXACTLY the six human_fields leaves — a structural leaf-walk over both parsed documents finds identical key sets and value differences only at /human_fields/{decision,reviewer,reviewer_role_or_credential,reviewed_at,rationale,evidence}',
  (() => {
    for (const s of SLUGS) {
      const diff = leafDiff(JSON.parse(read(blankOf(s))), JSON.parse(read(doneOf(s))))
      const expected = HUMAN_KEYS.map((k) => `/human_fields/${k}`).sort()
      if (JSON.stringify(diff) !== JSON.stringify(expected)) return false
    }
    return true
  })())
check('W3: NO completed human field is null or blank — all six fields in all three completed forms are non-null strings with non-zero trimmed length',
  SLUGS.every((s) => {
    const h = JSON.parse(read(doneOf(s))).human_fields
    return HUMAN_KEYS.every((k) => typeof h[k] === 'string' && h[k].trim().length > 0)
  }))
check('W4: every supplied value is CHARACTER-EXACT — decision, reviewer, credential, timestamp, rationale, and evidence in each completed form equal the instruction-supplied strings verbatim',
  SLUGS.every((s) => {
    const h = JSON.parse(read(doneOf(s))).human_fields
    return HUMAN_KEYS.every((k) => h[k] === SUPPLIED[s][k])
  }))
check('W5: all three decisions are APPROVE',
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
check('W8: reviewed-object identities, governed fields, source fingerprints, lifecycle rules, and the created_at UNKNOWN sentinel are UNCHANGED from the approved templates — re-asserted on the key spots of every completed form (the leaf-walk of W2 already bounds the change surface)',
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
if (committed) {
  check('W14: topology and inventory exact — ONE plain single-parent commit on the promoted source; the range carries exactly the SIX added phase paths (four completed forms, the record, this verifier) plus ONLY the labeled retargets the sweep enumerated; nothing deleted',
    (() => {
      try {
        if (execSync(`git merge-base ${SRC} HEAD`, { encoding: 'utf8' }).trim() !== SRC) return false
        const parents = execSync('git rev-list --parents -n 1 HEAD', { encoding: 'utf8' }).trim().split(/\s+/)
        if (parents.length !== 2 || parents[1] !== SRC) return false
        if (execSync(`git rev-list --count ${SRC}..HEAD`, { encoding: 'utf8' }).trim() !== '1') return false
        const status = execSync(`git diff --name-status ${SRC}..HEAD`, { encoding: 'utf8' })
          .split('\n').filter(Boolean).sort()
        const expected = [
          ...PHASE_ADDS.map((p) => `A\t${p}`),
          'M\tscripts/verify-exlib2v.ts',
        ].sort()
        return JSON.stringify(status) === JSON.stringify(expected)
      } catch { return false }
    })())
} else {
  check('W14 (uncommitted authoring state): every worktree change lies inside the six phase paths plus the labeled retargeted suite',
    CHANGED.length > 0 && CHANGED.every((p) => PHASE_ADDS.includes(p) || p === 'scripts/verify-exlib2v.ts'))
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

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
