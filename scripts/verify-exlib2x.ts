// EXLIB-2X STATIC verification (LOCAL-ONLY): the renewed
// v2 human-decision transcription — three completed copies of the
// promoted, tagged EXLIB-2W corrected v2 templates, transcribed
// character-for-character under the human reviewer's EXPRESS
// TRANSCRIPTION INSTRUCTION of 2026-09-07T19:06:00-04:00 (the
// exact lawful completion transition the v2 templates define).
//
// Proves X1-X15: source/tag/template integrity, leaf-exact
// completion, non-null and character-exact values, APPROVE x3,
// timestamp equivalence and chronology (new timestamp, round-0
// instant unused), unchanged governed content, DERIVED-status
// coherence (completed copies derive COMPLETED_HUMAN_DECISION with
// no fixed declaration — the round-0 contradiction structurally
// cannot recur), the quoted express-instruction authority basis,
// the byte-frozen S4 authority artifact, the no-mutation boundary,
// the record's truthful not-yet claims, topology, and hygiene.
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

const SRC = '02bb9c462be99af128fc288cb59d4197b261faaf'
const SRC_TREE = '4f647d4ff935db9adcbbf855c31d8f42b1ee448e'
const W_TAG = 'exlib2w-snapshot-review-v2-templates-stable'
const W_TAG_OBJ = 'b1e41ccaf436f9fe61da0d44d639c71d96f3fd51'
const RECORD = 'docs/exlib2x-v2-decision-transcription-record.md'
const VERIFIER = 'scripts/verify-exlib2x.ts'
const SLUGS = ['plank', 'dead-bug', 'ab-wheel-rollout'] as const
const tmplOf = (s: string): string => `docs/exlib2w-${s}-snapshot-review-form-v2.json`
const doneOf = (s: string): string => `docs/exlib2w-${s}-snapshot-review-form-v2-completed.json`
const AUTH_DONE = 'docs/exlib2v-s4-authority-inputs-form-completed.json'
const AUTH_DONE_SHA256 = '6cf77759f7a8ddf89d32b2fd225bcbe0eddaf09587dcc9d01a657752b9adeeae'
const PHASE_ADDS = [...SLUGS.map(doneOf), RECORD, VERIFIER].sort()
const RETARGETED = ['scripts/verify-exlib2w.ts']
const TS_EDT = '2026-09-07T19:06:00-04:00'
const OLD_TS = '2026-09-07T11:05:00-04:00'
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
const derive = (h: Record<string, unknown>): string => {
  const nulls = HUMAN_KEYS.filter((k) => h[k] === null).length
  if (nulls === HUMAN_KEYS.length) return 'BLANK'
  if (nulls === 0) return 'COMPLETED'
  return 'INVALID'
}

const SUPPLIED: Record<string, Record<string, string>> = {
  'plank': {
    decision: 'APPROVE', reviewer: 'Joseph Carfagno',
    reviewer_role_or_credential: 'Product owner', reviewed_at: TS_EDT,
    rationale: 'Approved as an accurate timed, bilateral bodyweight core exercise.',
    evidence: 'Reviewed the complete EXLIB-2W corrected Plank snapshot-review v2 template.',
  },
  'dead-bug': {
    decision: 'APPROVE', reviewer: 'Joseph Carfagno',
    reviewer_role_or_credential: 'Product owner', reviewed_at: TS_EDT,
    rationale: 'Approved as an accurate alternating bodyweight core and mobility exercise.',
    evidence: 'Reviewed the complete EXLIB-2W corrected Dead bug snapshot-review v2 template.',
  },
  'ab-wheel-rollout': {
    decision: 'APPROVE', reviewer: 'Joseph Carfagno',
    reviewer_role_or_credential: 'Product owner', reviewed_at: TS_EDT,
    rationale: 'Approved as an accurate advanced bilateral weighted-repetition core exercise.',
    evidence: 'Reviewed the complete EXLIB-2W corrected Ab wheel rollout snapshot-review v2 template.',
  },
}

console.log('EXLIB-2X renewed v2 decision transcription verification (LOCAL-ONLY; completed v2 decisions are human evidence; nothing applied anywhere)')

check('X1: the promoted source is exact and the v2 templates are IMMUTABLE PREDECESSORS — the EXLIB-2W stable tag is the exact annotated object with the byte-exact 95-byte annotation, peels to the source commit whose tree is exact, and each v2 template is byte-identical to promoted main',
  (() => {
    try {
      if (execSync(`git rev-parse refs/tags/${W_TAG}`, { encoding: 'utf8' }).trim() !== W_TAG_OBJ) return false
      if (execSync(`git rev-parse refs/tags/${W_TAG}^{}`, { encoding: 'utf8' }).trim() !== SRC) return false
      if (execSync(`git rev-parse ${SRC}^{tree}`, { encoding: 'utf8' }).trim() !== SRC_TREE) return false
      const raw = execSync(`git cat-file tag refs/tags/${W_TAG}`, { encoding: 'utf8' })
      if (raw.slice(raw.indexOf('\n\n') + 2) !== 'EXLIB-2W corrected snapshot-review v2 templates — PREPARED — FRESH HUMAN DECISIONS PENDING\n') return false
      for (const s of SLUGS) {
        const live = execSync(`git hash-object "${tmplOf(s)}"`, { encoding: 'utf8' }).trim()
        const promoted = execSync(`git rev-parse "${SRC}:${tmplOf(s)}"`, { encoding: 'utf8' }).trim()
        if (live !== promoted) return false
      }
      return true
    } catch { return false }
  })())
check('X2: each completed v2 copy differs from its immutable template at EXACTLY the six human_fields leaves — a structural leaf-walk finds identical key sets and value differences only at /human_fields/{decision,reviewer,reviewer_role_or_credential,reviewed_at,rationale,evidence}',
  SLUGS.every((s) => {
    const diff = leafDiff(JSON.parse(read(tmplOf(s))), JSON.parse(read(doneOf(s))))
    const expected = HUMAN_KEYS.map((k) => `/human_fields/${k}`).sort()
    return JSON.stringify(diff) === JSON.stringify(expected)
  }))
check('X3: NO completed field is null or blank — all six fields in all three completed v2 copies are non-null strings with non-zero trimmed length',
  SLUGS.every((s) => {
    const h = JSON.parse(read(doneOf(s))).human_fields
    return HUMAN_KEYS.every((k) => typeof h[k] === 'string' && h[k].trim().length > 0)
  }))
check('X4: every transcribed value is CHARACTER-EXACT against the instruction-supplied strings — decision, reviewer, credential, timestamp, rationale, and evidence verbatim in each completed copy',
  SLUGS.every((s) => {
    const h = JSON.parse(read(doneOf(s))).human_fields
    return HUMAN_KEYS.every((k) => h[k] === SUPPLIED[s][k])
  }))
check('X5: all three renewed decisions are APPROVE',
  SLUGS.every((s) => JSON.parse(read(doneOf(s))).human_fields.decision === 'APPROVE'))
check('X6: the renewed timestamp parses and equals the UTC instant 2026-09-07T23:06:00Z — the EDT representation is preserved in every completed copy and the conversion is proven, not assumed',
  (() => {
    const edt = Date.parse(TS_EDT)
    if (!(Number.isFinite(edt) && edt === Date.parse('2026-09-07T23:06:00Z'))) return false
    return SLUGS.every((s) => JSON.parse(read(doneOf(s))).human_fields.reviewed_at === TS_EDT)
      && recFlat.includes('2026-09-07T23:06:00Z')
  })())
check('X7: chronology holds and the round-0 instant is NOT reused — the renewed instant follows the recorded EXLIB-2W tag publication 2026-09-07T22:59:38Z (pinned in the record) and mechanically follows the tag object\'s own tagger instant, and the round-0 timestamp appears in NO human field of any new artifact',
  (() => {
    const edt = Date.parse(TS_EDT)
    if (!(edt > Date.parse('2026-09-07T22:59:38Z'))) return false
    if (!recFlat.includes('2026-09-07T22:59:38Z')) return false
    const raw = execSync(`git cat-file tag refs/tags/${W_TAG}`, { encoding: 'utf8' })
    const m = raw.match(/^tagger .* (\d+) [+-]\d{4}$/m)
    if (!m || !(edt > Number(m[1]) * 1000)) return false
    for (const s of SLUGS) {
      const h = JSON.parse(read(doneOf(s))).human_fields
      for (const k of HUMAN_KEYS) if (String(h[k]).includes(OLD_TS)) return false
    }
    return true
  })())
check('X8: governed content is UNCHANGED from the immutable templates — reviewed-object identity, all eighteen governed fields including the created_at UNKNOWN sentinel, verbatim scope, source fingerprints, and the entire state-neutral lifecycle (state rule, transcription boundary, immutability, voiding) are identical in every completed copy',
  SLUGS.every((s) => {
    const b = JSON.parse(read(tmplOf(s)))
    const c = JSON.parse(read(doneOf(s)))
    return JSON.stringify(c.reviewed_object) === JSON.stringify(b.reviewed_object)
      && JSON.stringify(c.governed_field_set) === JSON.stringify(b.governed_field_set)
      && c.governed_field_set.created_at.value === 'UNKNOWN_NOT_PRESERVED_HOSTED_GENERATED'
      && JSON.stringify(c.lifecycle) === JSON.stringify(b.lifecycle)
      && JSON.stringify(c.promoted_source_fingerprints_git_blob_sha1_at_source_commit)
        === JSON.stringify(b.promoted_source_fingerprints_git_blob_sha1_at_source_commit)
      && c.verbatim_scope === b.verbatim_scope
  }))
check('X9: DERIVED-STATUS COHERENCE — each completed v2 copy derives as COMPLETED_HUMAN_DECISION (all six non-null) and carries NO fixed state declaration (state_rule only), each v2 template still derives as blank, no mixed-state artifact exists among them, and the round-0 contradiction therefore structurally cannot recur in the v2 line',
  (() => {
    for (const s of SLUGS) {
      const c = JSON.parse(read(doneOf(s)))
      if (derive(c.human_fields) !== 'COMPLETED') return false
      if (c.lifecycle.state !== undefined) return false
      if (typeof c.lifecycle.state_rule !== 'string') return false
      const t = JSON.parse(read(tmplOf(s)))
      if (derive(t.human_fields) !== 'BLANK') return false
    }
    return true
  })())
check('X10: the record quotes the EXPRESS TRANSCRIPTION INSTRUCTION verbatim as the authority basis — the reviewer\'s own words instructing purely mechanical character-for-character transcription with no inference, selection, preselection, normalization, rewriting, summarizing, supplementing, or invention',
  recFlat.includes('I, Joseph Carfagno, Product owner, expressly instruct you to act solely as a mechanical transcriber and copy the following human-supplied values character-for-character into exactly the six authorized human-field leaves of each corresponding v2 template.') &&
  recFlat.includes('Do not infer, select, preselect, normalize, rewrite, summarize, supplement, or invent anything. Change no other byte.'))
check('X11: the completed S4 authority-inputs artifact is BYTE-FROZEN and reserved — its live bytes and its blob at the promoted source both hash to the accepted fingerprint, and this phase neither modifies nor reinterprets it',
  (() => {
    try {
      const live = execSync(`shasum -a 256 "${AUTH_DONE}"`, { encoding: 'utf8' }).split(/\s+/)[0]
      if (live !== AUTH_DONE_SHA256) return false
      const blob = execSync(`git cat-file blob "${SRC}:${AUTH_DONE}" | shasum -a 256`, { encoding: 'utf8', shell: '/bin/zsh' }).split(/\s+/)[0]
      if (blob !== AUTH_DONE_SHA256) return false
      return recFlat.includes('BYTE-FROZEN and RESERVED')
    } catch { return false }
  })())
check('X12: NO mutation surface — no phase file is .sql, none carries SQL package markers, RPC calls, or the delivery environment-variable literals, and no seed, inventory, migration, or configuration path is touched',
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
check('X13: the record claims NOTHING was applied — pending snapshots with zero review events, no run, the application package separately gated, and no contrary occurred-claim',
  recFlat.includes('No hosted snapshot review has been applied') &&
  recFlat.includes('exercise_catalog_review_events remains at its promoted pre-application value of ZERO') &&
  recFlat.includes('No S4 run exists') &&
  recFlat.includes('ONE-USE hosted snapshot-review APPLICATION package') &&
  !recFlat.includes('review event was created') &&
  !recFlat.includes('has been sealed'))
const PORCELAIN = execSync('git status --porcelain', { encoding: 'utf8' }).split('\n').filter(Boolean)
const CHANGED = PORCELAIN.map((l) => l.slice(3).trim()).sort()
const committed = CHANGED.length === 0
  && execSync(`git rev-list --count ${SRC}..HEAD`, { encoding: 'utf8' }).trim() !== '0'
if (committed) {
  check('X14: topology and inventory exact — ONE plain single-parent commit on the promoted source carrying exactly the FIVE added phase paths (three completed v2 copies, the record, this verifier) plus ONLY the labeled retarget the sweep enumerated; nothing deleted',
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
          ...RETARGETED.map((p) => `M\t${p}`),
        ].sort()
        return JSON.stringify(status) === JSON.stringify(expected)
      } catch { return false }
    })())
} else {
  check('X14 (uncommitted authoring state): every worktree change lies inside the five phase paths plus the labeled retargeted suite',
    CHANGED.length > 0 && CHANGED.every((p) => PHASE_ADDS.includes(p) || RETARGETED.includes(p)))
}
check('X15: hygiene — all three completed v2 copies are pure ASCII, the record\'s non-ASCII is the em-dash only, and no phase file contains endpoint or credential material',
  (() => {
    for (const s of SLUGS) {
      for (const ch of read(doneOf(s))) if ((ch.codePointAt(0) as number) > 127) return false
    }
    for (const ch of rec) {
      const c = ch.codePointAt(0) as number
      if (c > 127 && c !== 0x2014) return false
      if (c < 32 && ch !== '\n') return false
    }
    const payload = PHASE_ADDS.map(read).join('\n')
    const bads = [
      'supabase' + '.co', 'vercel' + '.com', 'postgresql' + '://', 'postgres' + '://',
      'SUPABASE' + '_URL', 'SUPABASE' + '_SERVICE', 'api' + 'key', 'Bearer' + ' ', 'ey' + 'J',
      '--db' + '-url', '--lin' + 'ked', 'db ' + 'push',
    ]
    return !bads.some((b) => payload.includes(b))
  })())

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
