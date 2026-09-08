// EXLIB-2Y STATIC verification (LOCAL-ONLY): the ONE-USE hosted
// snapshot-review APPLICATION package preparation — the package
// itself (PREPARED — NOT EXECUTED), its preparation record, and the
// live-suite coverage — proven against the promoted EXLIB-2X
// completed v2 decisions, which are IMMUTABLE inputs (any byte
// change to them voids the package and this suite fails).
//
// Proves Y1-Y14: the promoted source and decision-artifact
// integrity; package labels and statement shape (exactly three
// review-transition UPDATEs, zero delivery/seal/run/publication/
// event-insert statements, the eleven-table lock set); MECHANICAL
// value binding (every audit literal in the package equals the
// corresponding decision artifact's human field, extracted from the
// artifact bytes — never restated by hand); governed-field
// precondition binding; created_at truthfulness; logical-identity
// resolution with NO snapshot-UUID literals; the one-use vector
// gates; record truthfulness incl. the MEASURED live-suite totals;
// live-suite presence and coverage; topology; boundary; hygiene;
// and chronology consistency. Performs NO hosted contact and NO
// network activity of any kind.
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

const SRC = '06d99e2cb3a678836a05a0078cc4f916d30cf462'
const SRC_TREE = '28efad626174f70182a708d1609cc36a8e33b5ca'
const X_TAG = 'exlib2x-v2-decisions-transcribed-stable'
const X_TAG_OBJ = '0e98d6fea8f3b91c53044ed9c623676de42ee6b4'
const PKG = 'docs/exlib2y-snapshot-review-application-package.sql'
const RECORD = 'docs/exlib2y-snapshot-review-application-prep-record.md'
const VERIFIER = 'scripts/verify-exlib2y.ts'
const LIVE = 'scripts/verify-exlib2y-live.sh'
const SLUGS = ['plank', 'dead-bug', 'ab-wheel-rollout'] as const
const decOf = (s: string): string => `docs/exlib2w-${s}-snapshot-review-form-v2-completed.json`
const PHASE_ADDS = [PKG, RECORD, VERIFIER, LIVE].sort()
const RETARGETED = ['scripts/verify-exlib2x.ts']
const TS_EDT = '2026-09-07T19:06:00-04:00'

const pkg = read(PKG)
const rec = read(RECORD)
const recFlat = rec.replace(/\s+/g, ' ')
const decisions = SLUGS.map((s) => JSON.parse(read(decOf(s))))

console.log('EXLIB-2Y application-package preparation verification (LOCAL-ONLY; the package is PREPARED — NOT EXECUTED; nothing applied anywhere)')

check('Y1: the promoted source and the IMMUTABLE decision inputs are exact — main-ancestor source with the byte-exact 94-byte EXLIB-2X tag annotation, and each completed v2 decision artifact byte-identical to its promoted blob (any byte change voids the package)',
  (() => {
    try {
      if (execSync(`git rev-parse refs/tags/${X_TAG}`, { encoding: 'utf8' }).trim() !== X_TAG_OBJ) return false
      if (execSync(`git rev-parse refs/tags/${X_TAG}^{}`, { encoding: 'utf8' }).trim() !== SRC) return false
      if (execSync(`git rev-parse ${SRC}^{tree}`, { encoding: 'utf8' }).trim() !== SRC_TREE) return false
      const raw = execSync(`git cat-file tag refs/tags/${X_TAG}`, { encoding: 'utf8' })
      if (raw.slice(raw.indexOf('\n\n') + 2) !== 'EXLIB-2X renewed v2 snapshot-review decisions — TRANSCRIBED — APPLICATION PACKAGE PENDING\n') return false
      for (const s of SLUGS) {
        const live = execSync(`git hash-object "${decOf(s)}"`, { encoding: 'utf8' }).trim()
        const promoted = execSync(`git rev-parse "${SRC}:${decOf(s)}"`, { encoding: 'utf8' }).trim()
        if (live !== promoted) return false
      }
      return true
    } catch { return false }
  })())
check('Y2: the package is labeled and fingerprint-pinned — PREPARED — NOT EXECUTED / ONE-USE NOT idempotent, the only lawful hosted target and the executor boundary named, the three decision artifacts pinned inside the package by exact byte size AND sha256, and the record pins the package\'s own live fingerprint',
  (() => {
    if (!pkg.includes('PREPARED — NOT EXECUTED') || !pkg.includes('ONE-USE, NOT idempotent')) return false
    if (!pkg.includes('ttybyljytiwntvorugcv')) return false
    if (!pkg.includes('Claude and never by any automated pipeline')) return false
    for (const s of SLUGS) {
      const bytes = execSync(`wc -c < "${decOf(s)}"`, { encoding: 'utf8' }).trim()
      const sha = execSync(`shasum -a 256 "${decOf(s)}"`, { encoding: 'utf8' }).split(/\s+/)[0]
      if (!pkg.includes(sha)) return false
      if (!pkg.replace(/,/g, '').includes(`${bytes} B`)) return false
    }
    const pkgSha = execSync(`shasum -a 256 "${PKG}"`, { encoding: 'utf8' }).split(/\s+/)[0]
    return recFlat.includes(pkgSha)
  })())
check('Y3: package statement shape exact — exactly THREE schema-qualified exercise_catalog UPDATEs each setting review_status=\'approved\' plus the full audit tuple; ZERO delivery, seal/revoke, run-insert, publication/lifecycle-function, or direct event-insert statements; ONE BEGIN and ONE COMMIT; the SHARE ROW EXCLUSIVE lock covers exactly the eleven gated tables',
  (() => {
    if ((pkg.match(/^UPDATE public\.exercise_catalog$/gm) || []).length !== 3) return false
    if ((pkg.match(/review_status    = 'approved'/g) || []).length !== 3) return false
    if (/deliver_catalog_exercises|rollback_catalog_delivery/.test(pkg)) return false
    if (/exlib_approve_and_seal_run|exlib_revoke_run_delivery/.test(pkg)) return false
    if (/INSERT INTO\s+public\.exercise_catalog_import_runs|INSERT INTO\s+public\.exercise_catalog_run_items/.test(pkg)) return false
    if (/publish_catalog_content|admit_catalog_content|apply_content_review|load_catalog_/.test(pkg)) return false
    if (/INSERT INTO\s+public\.exercise_catalog_review_events/.test(pkg)) return false
    if ((pkg.match(/^BEGIN;$/gm) || []).length !== 1) return false
    if ((pkg.match(/^COMMIT;$/gm) || []).length !== 1) return false
    const lockStart = pkg.indexOf('LOCK TABLE')
    const lockBlock = pkg.slice(lockStart, pkg.indexOf('IN SHARE ROW EXCLUSIVE MODE', lockStart))
    const locked = Array.from(lockBlock.matchAll(/public\.([a-z_]+)/g)).map((m) => m[1]).sort()
    const expected = ['exercise_catalog', 'exercise_catalog_aliases', 'exercise_catalog_content',
      'exercise_catalog_content_expected_relationships', 'exercise_catalog_import_runs',
      'exercise_catalog_logical', 'exercise_catalog_muscles', 'exercise_catalog_name_claims',
      'exercise_catalog_relationships', 'exercise_catalog_review_events', 'exercise_catalog_run_items'].sort()
    return JSON.stringify(locked) === JSON.stringify(expected)
  })())
check('Y4: MECHANICAL value binding — for each decision artifact, the package\'s corresponding UPDATE stanza carries the artifact\'s reviewer, its reviewed_at instant, and its rationale CHARACTER-EXACTLY (extracted from the artifact bytes, never restated), and targets the artifact\'s own governed logical identity',
  (() => {
    const stanzas = pkg.split(/^UPDATE public\.exercise_catalog$/gm).slice(1)
    if (stanzas.length !== 3) return false
    for (const d of decisions) {
      const logical = d.reviewed_object.logical_uuid as string
      const stanza = stanzas.find((x) => x.includes(`logical_id = '${logical}'`))
      if (!stanza) return false
      const block = stanza.slice(0, stanza.indexOf(';'))
      if (!block.includes(`reviewed_by      = '${d.human_fields.reviewer}'`)) return false
      if (!block.includes(`reviewed_at      = TIMESTAMPTZ '${d.human_fields.reviewed_at}'`)) return false
      if (!block.includes(`review_rationale = '${d.human_fields.rationale}'`)) return false
      if (d.human_fields.decision !== 'APPROVE') return false
      if (!block.includes("review_status    = 'approved'")) return false
      if (!block.includes('AND is_active = true')) return false
    }
    return true
  })())
check('Y5: governed-field precondition binding — for each artifact, the package precondition stanza for that identity compares the live row against the artifact\'s preserved governed values (name, category, primary muscle, equipment, laterality, tracking mode, provenance, discovery posture, version) and demands the pending/NULL-audit state; every literal below is EXTRACTED from the artifact bytes',
  (() => {
    for (const d of decisions) {
      const logical = d.reviewed_object.logical_uuid as string
      const g = d.governed_field_set
      const secStart = pkg.indexOf(`c.logical_id = '${logical}' AND c.is_active = true;`)
      if (secStart < 0) return false
      const idx = pkg.indexOf(`WHERE c.logical_id = '${logical}'`)
      if (idx < 0) return false
      const sec = pkg.slice(Math.max(0, idx - 400), idx + 2600)
      for (const [field, col] of [['canonical_name', 'canonical_name'], ['category', 'category'],
        ['primary_muscle', 'primary_muscle'], ['equipment', 'equipment'], ['laterality', 'laterality'],
        ['tracking_mode', 'tracking_mode'], ['provenance', 'provenance'],
        ['movement_pattern', 'movement_pattern'], ['training_role', 'training_role'],
        ['difficulty', 'difficulty'], ['availability', 'availability']] as const) {
        if (!sec.includes(`v_row.${col} <> '${g[field].value}'`)) return false
      }
      if (!sec.includes('v_row.catalog_version <> 1')) return false
      if (!sec.includes("v_row.review_status <> 'pending'")) return false
      if (!sec.includes('v_row.reviewed_by IS NOT NULL')) return false
      if (!sec.includes('v_row.source_url IS NOT NULL')) return false
    }
    return true
  })())
check('Y6: created_at truthfulness — the package verifies each row\'s LIVE created_at is non-null at application time and compares it across the transition via the in-transaction capture map; it never claims the exact value was preserved (the artifacts carry the UNKNOWN sentinel, which the package references only as provenance)',
  (() => {
    if ((pkg.match(/created_at IS NULL/g) || []).length !== 3) return false
    if (!pkg.includes('created_at_map')) return false
    if (!pkg.includes("(v_cap.created_at_map ->> c.logical_id::text)::timestamptz")) return false
    for (const d of decisions) {
      if (d.governed_field_set.created_at.value !== 'UNKNOWN_NOT_PRESERVED_HOSTED_GENERATED') return false
    }
    return pkg.includes('UNKNOWN_NOT_PRESERVED_HOSTED_GENERATED')
  })())
check('Y7: logical-identity resolution ONLY — the package contains exactly the three governed logical UUIDs (each appearing in its precondition, its UPDATE, and the capture map) and NO other UUID literal; the two hosted-preserved snapshot UUIDs and any invented surrogate appear NOWHERE',
  (() => {
    const uuids = Array.from(new Set(Array.from(pkg.matchAll(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g)).map((m) => m[0]))).sort()
    const expected = decisions.map((d) => d.reviewed_object.logical_uuid as string).sort()
    if (JSON.stringify(uuids) !== JSON.stringify(expected)) return false
    return !pkg.includes('1ce09c1f') && !pkg.includes('c715d840')
  })())
check('Y8: the ONE-USE gates — the precondition pins the exact post-EXLIB-2R evidence baseline 3/3/5/3/6/1/2/2/0/0/0 (zero events) with the explicit one-use refusal message, and the postcondition pins 3/3/5/3/6/1/2/2/0/0/3 (the vector moves in exactly one position)',
  pkg.includes("'3/3/5/3/6/1/2/2/0/0/0'") &&
  pkg.includes('ONE-USE and its baseline is gone') &&
  pkg.includes("'3/3/5/3/6/1/2/2/0/0/3'") &&
  pkg.includes('% review event(s) already exist'))
check('Y9: the record is truthful and complete — it pins the package fingerprint, quotes the audit-tuple mapping (three snapshot audit columns; role/evidence stay in the artifacts), states PREPARED — NOT EXECUTED with the hosted one-use boundary, carries the MEASURED live-suite totals, and claims no application, event, run, seal, delivery, or hosted contact occurred',
  recFlat.includes('PREPARED — NOT EXECUTED') &&
  recFlat.includes('exactly THREE audit columns') &&
  recFlat.includes('64 passed, 0 failed') &&
  recFlat.includes('No hosted snapshot review has been applied') &&
  recFlat.includes('no review event exists') &&
  recFlat.includes('No S4 run exists') &&
  !recFlat.includes('has been applied to the hosted') &&
  recFlat.includes('executed hosted exactly once by Joseph/ChatGPT'))
check('Y10: the LIVE suite exists and covers the instructed classes — happy path, one-use replay, drifted governed field, missing identity, count-camouflaged duplicate identity, stale review state, foreign event, wrong authority, partial-application atomicity, swapped-identity writes, and the two-session race (the live suite runs on demand against a disposable cluster; it is deliberately outside the TS battery, as every live suite is)',
  (() => {
    const live = read(LIVE)
    for (const s of ['Happy path', 'ONE-USE: the second execution', 'DRIFTED GOVERNED FIELD',
      'MISSING IDENTITY', 'DUPLICATE IDENTITY', 'STALE REVIEW STATE', 'FOREIGN REVIEW EVENT',
      'WRONG AUTHORITY', 'PARTIAL APPLICATION', 'SWAPPED-IDENTITY WRITES', 'exactly ONE commits']) {
      if (!live.includes(s)) return false
    }
    return live.includes('disposable local PostgreSQL ONLY') && live.includes(PKG)
  })())
const PORCELAIN = execSync('git status --porcelain', { encoding: 'utf8' }).split('\n').filter(Boolean)
const CHANGED = PORCELAIN.map((l) => l.slice(3).trim()).sort()
const committed = CHANGED.length === 0
  && execSync(`git rev-list --count ${SRC}..HEAD`, { encoding: 'utf8' }).trim() !== '0'
if (committed) {
  check('Y11: topology and inventory exact — ONE plain single-parent commit on the promoted source carrying exactly the FOUR added phase paths (package, record, this verifier, the live suite) plus ONLY the labeled retarget the sweep enumerated; nothing deleted',
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
  check('Y11 (uncommitted authoring state): every worktree change lies inside the four phase paths plus the labeled retargeted suite',
    CHANGED.length > 0 && CHANGED.every((p) => PHASE_ADDS.includes(p) || RETARGETED.includes(p)))
}
check('Y12: the boundary holds — the package lives under docs/ (never supabase/migrations/), no OTHER .sql path enters the phase, no phase file names the delivery environment-variable literals, and the record and verifiers carry no executable package markers',
  (() => {
    if (!PKG.startsWith('docs/')) return false
    if (PHASE_ADDS.filter((p) => p.endsWith('.sql')).length !== 1) return false
    for (const p of PHASE_ADDS) {
      const t = read(p)
      if (t.includes('CATALOG' + '_DELIVERY_' + 'ENABLED')) return false
      if (t.includes('CATALOG' + '_DELIVERY_' + 'RUN_KEY')) return false
    }
    const recT = read(RECORD)
    for (const bad of ['BEGIN;', 'COMMIT;', 'LOCK TABLE']) {
      if (recT.includes(bad)) return false
    }
    return true
  })())
check('Y13: hygiene — the package\'s non-ASCII is limited to the em-dash and box-drawing section rules, the record\'s to the em-dash, and no phase file carries endpoint or credential material',
  (() => {
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
check('Y14: chronology consistency — the package\'s single timestamp literal equals every artifact\'s reviewed_at EDT instant (2026-09-07T19:06:00-04:00 = 23:06:00Z, proven by parse), and the round-0 11:05 instant appears nowhere in the package',
  (() => {
    if (Date.parse(TS_EDT) !== Date.parse('2026-09-07T23:06:00Z')) return false
    for (const d of decisions) if (d.human_fields.reviewed_at !== TS_EDT) return false
    if ((pkg.match(/2026-09-07T19:06:00-04:00/g) || []).length < 3) return false
    return !pkg.includes('2026-09-07T11:05:00-04:00')
  })())

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
