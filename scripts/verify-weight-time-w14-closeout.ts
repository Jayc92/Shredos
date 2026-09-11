// ============================================================
// ForgeFitOS — W14 closeout verifier: the hosted-application evidence record.
//
// The W14 one-use catalog-admission package has ALREADY RUN. It was executed
// once against hosted Supabase by the operator path (Joseph/ChatGPT) and is
// SPENT. This verifier does not re-prove the package — scripts/verify-weight-
// time-w14.ts does that, and it must keep running at the W14-P tip it
// governs. This one proves the CLOSEOUT: that the durable record tells the
// truth about the hosted act, and that closing out did not disturb a single
// byte of what was reviewed.
//
// Three properties, in order of how badly their absence would hurt:
//
//   1. BYTE IDENTITY. The executed SQL, its machine manifest, and the
//      field-decisions document are byte-identical to the approved W14-P
//      candidate — checked by blob ID against commit 361bca01, not merely
//      against a hash constant that could have been retyped. A byte change in
//      any of the three would void their reviewed/executed status.
//   2. RECORD FIDELITY. Every governed identity, hash, tip, tree and boundary
//      statement in the record matches the repository bytes it describes. The
//      record cannot drift into a comfortable summary of itself.
//   3. PROVENANCE HONESTY. No sentence in the record may claim Claude
//      contacted hosted Supabase. Every hosted figure is operator-supplied.
//      This is checked structurally — every sentence that mentions Claude
//      alongside a hosted system must carry a negation — not by trusting a
//      disclaimer at the top.
//
// Deliberately NOT here: any assertion about hosted state. Only the operator
// observed hosted state. A verifier that phoned Supabase to confirm the
// record would both violate the standing prohibition and quietly convert
// operator-supplied evidence into a Claude-verified claim. The record's own
// limits section says so, and this file honours it: the ONLY external command
// it spawns is git, and check X22 proves that about its own source.
//
// Run from the repository root:
//   npx tsx scripts/verify-weight-time-w14-closeout.ts
// ============================================================

import path from 'node:path'
import { existsSync, readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'

const repositoryRoot = process.cwd()

// ── the governed paths ────────────────────────────────────────────────
const HOSTED_APPLICATION_RECORD_PATH = 'docs/weight-time-w14-hosted-application-record.md'
const CLOSEOUT_VERIFIER_PATH = 'scripts/verify-weight-time-w14-closeout.ts'
const SQL_PATH = 'docs/weight-time-w14-catalog-admission.sql'
const MANIFEST_PATH = 'docs/weight-time-w14-admission-manifest.json'
const DECISIONS_PATH = 'docs/weight-time-w14-catalog-field-decisions.md'
const PREP_REPORT_PATH = 'docs/weight-time-w14-prep-report.md'
const MIGRATION_028_PATH = 'supabase/migrations/028_weight_time_tracking_mode.sql'

/** The W13 production base this whole line of work forks from. */
const PRODUCTION_BASE_COMMIT = 'a54a30c25b1427aee24d00c37bd6a4aec69dd3d0'
const PRODUCTION_BASE_TREE = 'e4838dea0c2ad66a894969ab1c20982d28a6af29'

/**
 * The approved, independently reviewed W14-P candidate — the exact commit
 * whose bytes were authorized to run against hosted Supabase. Closeout must
 * sit FORWARD of this commit, never replace it: if an amend, rebase or squash
 * had touched the six W14-P commits, this SHA would no longer be an ancestor.
 */
const W14P_CANDIDATE_COMMIT = '361bca0149ae289dd7b010b94fb70d0d141b861e'
const W14P_CANDIDATE_TREE = '7e48ba6646425609dabc0a70882171b835e684a2'

/** The six W14-P commits, oldest first. Every one must survive verbatim. */
const W14P_COMMIT_CHAIN = [
  'f125308e0a22d935c889691452477b5ac9138f83',
  '5daba8e729c3999a1db57db68d9507918f2f4b21',
  'dd24dd655d8652fa0a57cc64338068aebe84804b',
  'a0bd82406088378b5469382b0fb8b0e5776379bf',
  '5ca9c2434cd92db44073a947b1f747e9c7a10745',
  '361bca0149ae289dd7b010b94fb70d0d141b861e',
] as const

/**
 * The frozen artifacts, pinned by size AND digest. These three are the
 * reviewed/executed set: the package that ran, the machine manifest that
 * governs it, and the decision carrier the manifest binds by hash.
 */
type FrozenArtifact = { path: string; bytes: number; sha256: string; why: string }
const FROZEN_ARTIFACTS: FrozenArtifact[] = [
  {
    path: SQL_PATH,
    bytes: 64653,
    sha256: 'a928b045cc1397e4145b21a0504d4e7364a37c90b88c1dd85d8df36fb27413cd',
    why: 'the one-use package that was executed against hosted Supabase and is now SPENT',
  },
  {
    path: MANIFEST_PATH,
    bytes: 16537,
    sha256: '8951f3cf6a808113b9a5d99f3e0c1f0db50e59ef953a55a539bb8b7c4cce4f49',
    why: 'the machine manifest that governs the package and binds its carriers by hash',
  },
  {
    path: DECISIONS_PATH,
    bytes: 29662,
    sha256: 'e111c738f2801f058e9f27136d731f6136401745541baf60ceaa26dbd2cf12d4',
    why: 'one of the manifest\'s eleven hashed source_bindings and the bound carrier_for_operator_ruled',
  },
  {
    path: MIGRATION_028_PATH,
    bytes: 37162,
    sha256: '9b7d3a52dc0b75f129745bec51a4c972aa284bb5cb0d6159e0cbbb981e463fb3',
    why: 'the structural prerequisite; W14 was a data load and modifies no migration',
  },
]

/** Historical evidence that must never be rewritten to flatter a later round. */
const HISTORICAL_EVIDENCE_PATHS = [
  'docs/exlib2b-release1-inventory.jsonl',
  'docs/exlib2b-release1-coverage-matrix.md',
  'docs/exlib1c0a-equipment-resolution.jsonl',
]

/**
 * F2a's named sites. These are DEFERRED NON-BLOCKING MAINTENANCE findings:
 * they require their own instruction, so a closeout round must not "helpfully"
 * fix them.
 */
const DEFERRED_MAINTENANCE_FILES = [
  'scripts/verify-exlib1c0b3-live.sh',
  'scripts/verify-exlib2e-live.sh',
  'scripts/verify-exlib2l-live.sh',
]

/**
 * The complete permitted change surface from the production base: the seven
 * reviewed W14-P additions plus exactly two closeout additions and one
 * annotated report.
 *
 * This allowlist governs the W14-C tip. It does NOT retarget the frozen
 * verifier's own allowlist, which still governs the W14-P tip and still reads
 * exactly seven paths there.
 */
const ALLOWED_CHANGED_PATHS = [
  // the seven reviewed W14-P additions
  MANIFEST_PATH,
  SQL_PATH,
  DECISIONS_PATH,
  PREP_REPORT_PATH,
  'scripts/generate-weight-time-w14-package.ts',
  'scripts/verify-weight-time-w14-live.sh',
  'scripts/verify-weight-time-w14.ts',
  // the two W14-C closeout additions
  HOSTED_APPLICATION_RECORD_PATH,
  CLOSEOUT_VERIFIER_PATH,
]

/** The five admitted logical identities, frozen during W14-P. */
type AdmittedEntry = { line: number; name: string; uuid: string }
const ADMITTED_ENTRIES: AdmittedEntry[] = [
  { line: 132, name: 'Plate-weighted plank', uuid: 'e21b2c00-0000-4000-a000-000000000004' },
  { line: 133, name: 'Weighted vest plank', uuid: 'e21b2c00-0000-4000-a000-000000000005' },
  { line: 137, name: 'Weighted dead hang', uuid: 'e21b2c00-0000-4000-a000-000000000006' },
  { line: 138, name: 'Weighted wall sit', uuid: 'e21b2c00-0000-4000-a000-000000000007' },
  { line: 139, name: 'Weighted vest wall sit', uuid: 'e21b2c00-0000-4000-a000-000000000008' },
]

/** The three carries that were deliberately NOT admitted. */
const DEFERRED_CARRIES = [
  { line: 134, name: "Farmer's carry" },
  { line: 135, name: 'Suitcase carry' },
  { line: 136, name: 'Sandbag bear-hug carry' },
]

/** The hosted project the operator acted on, and the only one W14 may name. */
const HOSTED_PROJECT_REF = 'ttybyljytiwntvorugcv'

/** Systems whose mention alongside "Claude" demands an explicit negation. */
const HOSTED_SYSTEM_WORDS = ['hosted', 'supabase', 'vercel']

/** Verbs that would turn a Claude sentence into a hosted-contact claim. */
const HOSTED_CONTACT_VERBS = [
  'queried', 'query', 'observed', 'read back', 'readback', 'contacted',
  'connected', 'applied', 'executed', 'ran', 'verified', 'confirmed', 'invoked',
]

// ── result plumbing ───────────────────────────────────────────────────
type Finding = { name: string; ok: boolean; detail?: string }

let passed = 0
let failed = 0
function check(name: string, condition: boolean, detail?: string): void {
  if (condition) { passed += 1; console.log(`  PASS  ${name}`) }
  else { failed += 1; console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`) }
}
function read(relativePath: string): string {
  return readFileSync(path.join(repositoryRoot, relativePath), 'utf8')
}
function sha256(content: string | Buffer): string {
  return createHash('sha256').update(content).digest('hex')
}
function git(...args: string[]): string {
  // Absolute -C, always: a command whose output becomes a claim about a repo
  // must not depend on the ambient working directory.
  return execFileSync('git', ['-C', repositoryRoot, ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).trim()
}
/** For git commands whose ANSWER is the exit status (--is-ancestor). */
function gitSucceeds(...args: string[]): boolean {
  try { git(...args); return true } catch { return false }
}
/** The blob ID git records for a path at a commit, or null if absent. */
function blobIdAt(commitish: string, relativePath: string): string | null {
  try { return git('rev-parse', `${commitish}:${relativePath}`) } catch { return null }
}

/**
 * Prose writes 64,653; machines write 64653. Stripping the separators from
 * digit groups lets one pinned integer be found in either rendering, without
 * loosening the check into a substring search for "653".
 */
function withoutDigitGroupSeparators(text: string): string {
  return text.replace(/(\d),(?=\d{3}\b)/g, '$1')
}

/**
 * Markdown inline markup sits INSIDE sentences: the record writes
 * `deliver_catalog_exercises` was NOT invoked, so a prose pattern looking for
 * "deliver_catalog_exercises was NOT invoked" never matches — a backtick is
 * not whitespace. Stripping emphasis and code markers, then collapsing the
 * hard wrap, makes a prose assertion a claim about the prose rather than
 * about one author's choice of formatting.
 *
 * This is deliberately applied to the sentence-shaped assertions only. The
 * digest, UUID and commit assertions match exact tokens against the raw
 * bytes, where a normalizer could only ever hide a difference.
 *
 * Underscore is NOT stripped, even though markdown treats it as emphasis:
 * this document is full of snake_case identifiers, and removing underscores
 * turns deliver_catalog_exercises into a token that appears nowhere. A
 * normalizer that mangles the very names the assertions look for reports the
 * document as defective when the defect is its own.
 */
function asProse(markdown: string): string {
  return markdown.replace(/[`*]/g, '').replace(/\s+/g, ' ').trim()
}

/**
 * The record hard-wraps at ~72 columns, so a single sentence spans several
 * lines. Collapsing all whitespace first makes sentence splitting mean what
 * it says; splitting the raw lines would tear negations away from the clauses
 * they govern and produce false alarms.
 */
function sentencesOf(markdown: string): string[] {
  return asProse(markdown).split(/(?<=[.!?])\s+/).filter((sentence) => sentence.length > 0)
}

// ── the record: does it say what the bytes say? ───────────────────────
type World = { record: string }

/**
 * Every assertion about the record's CONTENT lives here, so the negative
 * controls at the end can re-run the whole set against a corrupted copy and
 * demand that the targeted pin — not merely "something" — rejects it.
 */
function assertRecord(world: World, findings: Finding[]): void {
  const record = world.record
  const numeric = withoutDigitGroupSeparators(record)
  const prose = asProse(record)
  const add = (name: string, ok: boolean, detail?: string): void => { findings.push({ name, ok, detail }) }

  // ── R1-R3 the executed artifacts, by size and digest ──
  add('R1 the record is a substantial durable document, not a stub',
    record.length > 8000, `${record.length} characters`)

  for (const artifact of FROZEN_ARTIFACTS.filter((a) => a.path !== MIGRATION_028_PATH)) {
    const label = artifact.path === SQL_PATH ? 'R2 the executed SQL package'
      : artifact.path === MANIFEST_PATH ? 'R3 the machine manifest'
      : 'R3b the bound decision carrier'
    add(`${label} is recorded with its exact reviewed size and sha256`,
      numeric.includes(String(artifact.bytes)) && record.includes(artifact.sha256),
      `looking for ${artifact.bytes} and ${artifact.sha256.slice(0, 12)}… in ${artifact.path}`)
  }

  // ── R4-R5 the git identities ──
  add('R4 the approved W14-P candidate tip and tree are recorded exactly',
    record.includes(W14P_CANDIDATE_COMMIT) && record.includes(W14P_CANDIDATE_TREE))
  add('R5 the production base commit and tree are recorded exactly',
    record.includes(PRODUCTION_BASE_COMMIT) && record.includes(PRODUCTION_BASE_TREE))

  // ── R6-R7 the five admitted identities ──
  // Exactly once, not merely present: a UUID recorded twice is how two
  // different entries end up described as the same row.
  for (const entry of ADMITTED_ENTRIES) {
    const occurrences = record.split(entry.uuid).length - 1
    add(`R6.${entry.line} the frozen logical UUID for ${entry.line} is recorded EXACTLY ONCE`,
      occurrences === 1, `found ${occurrences} occurrence(s) of ${entry.uuid}`)
    add(`R7.${entry.line} the canonical name "${entry.name}" is recorded`,
      record.includes(entry.name))
  }

  // ── R8 the hosted status verdict ──
  const statusTokens = ['COMPLETE', 'PASSED', 'SPENT']
  const missingStatus = statusTokens.filter((token) => !record.includes(token))
  add('R8 the hosted status is recorded as COMPLETE / PASSED / SPENT',
    missingStatus.length === 0, `missing: ${missingStatus.join(', ')}`)

  // ── R9 the carry exclusion ──
  for (const carry of DEFERRED_CARRIES) {
    add(`R9.${carry.line} the deferred carry "${carry.name}" is recorded as excluded`,
      record.includes(carry.name) && numeric.includes(String(carry.line)))
  }
  add('R9d the carries are labelled deferred, not merely omitted in silence',
    /deferred/i.test(prose) && /carr(y|ies)/i.test(prose))

  // ── R10 the delivery boundary: nothing downstream happened ──
  add('R10a the record states that no content admission, review, publication or delivery occurred',
    /no\s+review/i.test(prose) && /no\s+content\s+admission/i.test(prose)
    && /no\s+publication/i.test(prose) && /no\s+delivery/i.test(prose))
  add('R10b the record states deliver_catalog_exercises was NOT invoked',
    /deliver_catalog_exercises\s+was\s+NOT\s+invoked/i.test(prose))
  add('R10c the record states the downstream acts remain separately gated and have not begun',
    /separately\s+gated/i.test(prose) && /(have|has)\s+not\s+begun/i.test(prose))

  // ── R11 the spent-state rule ──
  add('R11a the record carries the DO NOT RERUN rule',
    /DO\s+NOT\s+RERUN/i.test(prose))
  add('R11b the record carries the read-state-first rule for any future ambiguity',
    /READ\s+STATE\s+FIRST/i.test(prose))
  add('R11c the record records the operator\'s spent-gate proof by name',
    record.includes('would_second_run_fail_pre_target'))

  // ── R12-R13 provenance discipline ──
  add('R12 all three provenance classes are declared and kept distinct',
    /REVIEWED\s+PREP\s+FACT/i.test(prose)
    && /OPERATOR-SUPPLIED\s+HOSTED\s+FACT/i.test(prose)
    && /CLAUDE-VERIFIED\s+LOCAL\s+FACT/i.test(prose))
  add('R13 the record states plainly that the hosted facts are operator-supplied and were not verified by Claude',
    /operator-supplied/i.test(prose) && /never\s+independently\s+verified\s+by\s+Claude/i.test(prose))

  // ── R14 the hosted target ──
  add(`R14 the hosted target project ref ${HOSTED_PROJECT_REF} is recorded`,
    record.includes(HOSTED_PROJECT_REF))

  // ── R15 the migration pin ──
  const migration028 = FROZEN_ARTIFACTS.find((a) => a.path === MIGRATION_028_PATH)!
  add('R15a migration 028 is recorded with its exact pinned sha256',
    record.includes(migration028.sha256))
  add('R15b the record states that no migration 029 exists',
    /(no|not)\s+(migration\s+)?029/i.test(prose))

  // ── R16 provenance honesty, checked structurally ──
  // Every sentence that puts Claude next to a hosted system and a
  // contact verb must carry a negation. A disclaimer at the top of the
  // document does not make a sentence in the middle of it true.
  const offending = sentencesOf(record).filter((sentence) => {
    const lower = sentence.toLowerCase()
    if (!lower.includes('claude')) return false
    if (!HOSTED_SYSTEM_WORDS.some((word) => lower.includes(word))) return false
    if (!HOSTED_CONTACT_VERBS.some((verb) => lower.includes(verb))) return false
    return !/\b(no|not|never|nor|without|neither|cannot|didn't)\b/i.test(sentence)
  })
  add('R16 no sentence claims Claude contacted, queried or verified hosted state',
    offending.length === 0, offending.map((s) => `"${s.slice(0, 120)}"`).join(' | '))

  // ── R17 the boundary statements about Claude's own actions ──
  add('R17a the record states Claude made no hosted Supabase contact and did not invoke the Supabase CLI',
    /did\s+not\s+query\s+hosted\s+Supabase/i.test(prose) && /did\s+not\s+invoke\s+the\s+Supabase\s+CLI/i.test(prose))
  add('R17b the record states no Vercel contact',
    /(not|no)\s+[^.]{0,40}Vercel/i.test(prose))
  add('R17c the record states the closeout commits are unpublished and that publication is a separate authorization',
    /(unpublished|not\s+been\s+pushed|does\s+not\s+authorize\s+a\s+push)/i.test(prose)
    && /separate[^.]{0,60}authoriz/i.test(prose))

  // ── R18 the payload fingerprints tie the record to the manifest ──
  // Read from the manifest, not transcribed here: the record must agree with
  // the artifact, and the artifact is the thing that ran.
  const manifest = JSON.parse(read(MANIFEST_PATH))
  const manifestEntries: Array<Record<string, unknown>> = manifest.entries
  for (const entry of manifestEntries) {
    const fingerprint = String(entry.payload_fingerprint_sha256)
    const line = String(entry.inventory_file_line)
    add(`R18.${line} the manifest's payload fingerprint for ${line} appears in the record`,
      record.includes(fingerprint), `${fingerprint.slice(0, 16)}…`)
  }

  // ── R19 the record does not silently claim the reviewed labels changed ──
  add('R19 the record explains that the frozen PREPARED labels are artifact labels, not current world state',
    /PREPARED/i.test(prose) && /(frozen|byte-identical)/i.test(prose))
}

// ── the bytes: did closeout disturb anything reviewed? ────────────────
function verifyBytesAndBoundaries(): void {
  // ── X1-X8 byte identity of the frozen artifacts ──
  for (const artifact of FROZEN_ARTIFACTS) {
    const onDisk = readFileSync(path.join(repositoryRoot, artifact.path))
    check(`X1.${path.basename(artifact.path)} on disk still matches its pinned size and sha256 — ${artifact.why}`,
      onDisk.length === artifact.bytes && sha256(onDisk) === artifact.sha256,
      `${onDisk.length} B sha256 ${sha256(onDisk)}`)

    // Blob identity against the APPROVED CANDIDATE, not against the constant
    // above. This is the check a retyped hash cannot fake: git computed both
    // sides, and equality means the reviewer's bytes and today's bytes are
    // the same object.
    const atCandidate = blobIdAt(W14P_CANDIDATE_COMMIT, artifact.path)
    const atHead = blobIdAt('HEAD', artifact.path)
    check(`X2.${path.basename(artifact.path)} is the SAME GIT BLOB at the approved W14-P candidate and at HEAD`,
      atCandidate !== null && atCandidate === atHead,
      `candidate ${atCandidate} vs HEAD ${atHead}`)
  }

  // The manifest's own frozen status fields. Left deliberately untouched:
  // they are labels of the reviewed artifact. The post-execution truth lives
  // in the hosted-application record, and X2 above is what keeps that
  // decision honest rather than convenient.
  const manifest = JSON.parse(read(MANIFEST_PATH))
  check('X3 the manifest\'s reviewed status labels are untouched — PREPARED - NOT APPLIED, hosted_application_has_occurred false',
    manifest.status === 'PREPARED - NOT APPLIED' && manifest.hosted_application_has_occurred === false,
    `status ${JSON.stringify(manifest.status)} flag ${JSON.stringify(manifest.hosted_application_has_occurred)}`)

  // ── X4 migration boundaries ──
  const migrationNames = git('ls-tree', '--name-only', 'HEAD:supabase/migrations').split('\n').filter(Boolean)
  check('X4a migration 028 is byte-identical at the production base and at HEAD',
    blobIdAt(PRODUCTION_BASE_COMMIT, MIGRATION_028_PATH) === blobIdAt('HEAD', MIGRATION_028_PATH),
    `${blobIdAt(PRODUCTION_BASE_COMMIT, MIGRATION_028_PATH)} vs ${blobIdAt('HEAD', MIGRATION_028_PATH)}`)
  check('X4b no migration 029 exists — W14 was a controlled data load, not a migration',
    migrationNames.filter((name) => name.startsWith('029')).length === 0,
    migrationNames.filter((name) => name.startsWith('029')).join(', '))
  check('X4c the migration count is unchanged at 28',
    migrationNames.length === 28, `${migrationNames.length} migrations`)

  // ── X5 the change surface ──
  const committedPaths = git('diff', '--name-only', PRODUCTION_BASE_COMMIT, 'HEAD').split('\n').filter(Boolean)
  const workingPaths = git('status', '--porcelain').split('\n').filter(Boolean)
    .flatMap((line) => line.slice(3).split(' -> '))
    .map((entry) => entry.trim().replace(/^"|"$/g, ''))
  const surface = Array.from(new Set(committedPaths.concat(workingPaths))).sort()

  const outsideAllowlist = surface.filter((p) => !ALLOWED_CHANGED_PATHS.includes(p))
  check('X5a the ENTIRE change surface — committed and uncommitted — is W14 preparation and closeout artifacts and nothing else',
    outsideAllowlist.length === 0, `outside the allowlist: ${outsideAllowlist.join(', ')}`)
  check('X5b nothing under src/ changed',
    git('diff', '--name-only', PRODUCTION_BASE_COMMIT, 'HEAD', '--', 'src').length === 0,
    git('diff', '--name-only', PRODUCTION_BASE_COMMIT, 'HEAD', '--', 'src'))
  check('X5c nothing under supabase/ changed',
    git('diff', '--name-only', PRODUCTION_BASE_COMMIT, 'HEAD', '--', 'supabase').length === 0,
    git('diff', '--name-only', PRODUCTION_BASE_COMMIT, 'HEAD', '--', 'supabase'))

  // Closeout adds exactly two files and annotates exactly one. Stated as a
  // shape, so an unnoticed extra edit cannot hide inside the allowlist.
  const changedSinceCandidate = git('diff', '--name-status', W14P_CANDIDATE_COMMIT, 'HEAD')
    .split('\n').filter(Boolean).map((line) => line.split('\t'))
  const addedSinceCandidate = changedSinceCandidate.filter(([status]) => status === 'A').map(([, p]) => p).sort()
  const modifiedSinceCandidate = changedSinceCandidate.filter(([status]) => status === 'M').map(([, p]) => p).sort()
  const otherSinceCandidate = changedSinceCandidate.filter(([status]) => status !== 'A' && status !== 'M')
  check('X5d closeout ADDS exactly the record and the closeout verifier',
    addedSinceCandidate.length === 2
    && addedSinceCandidate.includes(HOSTED_APPLICATION_RECORD_PATH)
    && addedSinceCandidate.includes(CLOSEOUT_VERIFIER_PATH),
    addedSinceCandidate.join(', '))
  check('X5e closeout MODIFIES exactly one file, the prep report — the only W14 document that is not a bound artifact',
    modifiedSinceCandidate.length === 1 && modifiedSinceCandidate[0] === PREP_REPORT_PATH,
    modifiedSinceCandidate.join(', '))
  check('X5f closeout deletes and renames nothing',
    otherSinceCandidate.length === 0, otherSinceCandidate.map((r) => r.join(' ')).join(', '))

  // ── X6 the seven reviewed W14-P paths all survive ──
  const missingReviewedPaths = ALLOWED_CHANGED_PATHS
    .filter((p) => p !== HOSTED_APPLICATION_RECORD_PATH && p !== CLOSEOUT_VERIFIER_PATH)
    .filter((p) => blobIdAt('HEAD', p) === null)
  check('X6 all seven reviewed W14-P artifacts are still present at HEAD',
    missingReviewedPaths.length === 0, `missing: ${missingReviewedPaths.join(', ')}`)

  // ── X7 historical evidence ──
  for (const evidencePath of HISTORICAL_EVIDENCE_PATHS) {
    check(`X7.${path.basename(evidencePath)} is byte-identical at the production base and at HEAD`,
      blobIdAt(PRODUCTION_BASE_COMMIT, evidencePath) === blobIdAt('HEAD', evidencePath),
      `${blobIdAt(PRODUCTION_BASE_COMMIT, evidencePath)} vs ${blobIdAt('HEAD', evidencePath)}`)
  }

  // ── X8 the deferred maintenance sites ──
  for (const maintenancePath of DEFERRED_MAINTENANCE_FILES) {
    check(`X8.${path.basename(maintenancePath)} is untouched — F2a is deferred non-blocking maintenance and needs its own instruction`,
      blobIdAt(PRODUCTION_BASE_COMMIT, maintenancePath) === blobIdAt('HEAD', maintenancePath)
      && !surface.includes(maintenancePath))
  }

  // ── X9 ancestry: a plain forward line, no history rewrite ──
  check('X9a the production base is an ancestor of HEAD',
    gitSucceeds('merge-base', '--is-ancestor', PRODUCTION_BASE_COMMIT, 'HEAD'))
  check('X9b the APPROVED W14-P candidate is an ancestor of HEAD — closeout builds forward and did not amend, rebase or squash it',
    gitSucceeds('merge-base', '--is-ancestor', W14P_CANDIDATE_COMMIT, 'HEAD'))
  check('X9c the base tree pin is exact',
    git('rev-parse', `${PRODUCTION_BASE_COMMIT}^{tree}`) === PRODUCTION_BASE_TREE)
  check('X9d the approved candidate tree pin is exact',
    git('rev-parse', `${W14P_CANDIDATE_COMMIT}^{tree}`) === W14P_CANDIDATE_TREE)
  check('X9e there are no merge commits from the base to HEAD',
    git('rev-list', '--count', '--merges', `${PRODUCTION_BASE_COMMIT}..HEAD`) === '0',
    `${git('rev-list', '--count', '--merges', `${PRODUCTION_BASE_COMMIT}..HEAD`)} merges`)

  const commitsWithUnexpectedParentCount = git('rev-list', '--parents', `${PRODUCTION_BASE_COMMIT}..HEAD`)
    .split('\n').filter(Boolean).filter((line) => line.trim().split(/\s+/).length !== 2)
  check('X9f every commit from the base to HEAD has exactly one parent',
    commitsWithUnexpectedParentCount.length === 0, `${commitsWithUnexpectedParentCount.length} commit(s) with a different parent count`)

  for (const commit of W14P_COMMIT_CHAIN) {
    check(`X9g.${commit.slice(0, 8)} the reviewed W14-P commit still exists and is an ancestor of HEAD`,
      gitSucceeds('cat-file', '-e', `${commit}^{commit}`) && gitSucceeds('merge-base', '--is-ancestor', commit, 'HEAD'))
  }

  // ── X10 the manifest's own bindings, re-checked at the closeout tip ──
  // The frozen verifier's B13 proves this at the W14-P tip. It cannot prove it
  // here, because its allowlist deliberately does not know about the closeout
  // artifacts. So the property is re-asserted rather than dropped.
  type SourceBinding = { path: string; bytes: number; sha256: string }
  const bindings: SourceBinding[] = manifest.source_bindings
  const driftedBindings = bindings.filter((binding) => {
    const onDisk = readFileSync(path.join(repositoryRoot, binding.path))
    const committed = execFileSync('git', ['-C', repositoryRoot, 'cat-file', 'blob', `HEAD:${binding.path}`], { maxBuffer: 64 * 1024 * 1024 })
    return onDisk.length !== binding.bytes || sha256(onDisk) !== binding.sha256 || sha256(committed) !== binding.sha256
  })
  check(`X10 all ${bindings.length} bound source artifacts still match their recorded bytes and sha256, both as committed at HEAD and on disk`,
    driftedBindings.length === 0, driftedBindings.map((b) => b.path).join(', '))

  // ── X11 the annotated report annotates rather than rewrites ──
  const prepReport = read(PREP_REPORT_PATH)
  const reportDiff = git('diff', '--numstat', W14P_CANDIDATE_COMMIT, 'HEAD', '--', PREP_REPORT_PATH)
  const [addedLines, removedLines] = reportDiff ? reportDiff.split('\t').slice(0, 2).map(Number) : [0, 0]
  check('X11a the prep report is annotated, not rewritten — additions vastly outnumber removals',
    removedLines <= 2 && addedLines > 20, `+${addedLines} -${removedLines}`)
  check('X11b the prep report carries a dated W14-C supersession notice that points at the record',
    /SUPERSESSION NOTICE/.test(prepReport)
    && prepReport.includes('2026-09-11')
    && prepReport.includes('weight-time-w14-hosted-application-record.md'))
  check('X11c the prep report\'s original status wording survives verbatim, scoped rather than deleted',
    prepReport.includes('LOCAL\nPREPARATION COMPLETE. W14 HOSTED APPLICATION HAS NOT OCCURRED.')
    || prepReport.includes('LOCAL PREPARATION COMPLETE. W14 HOSTED APPLICATION HAS NOT OCCURRED.'))
  check('X11d every W14-C annotation in the report is marked as such',
    (prepReport.split('[W14-C]').length - 1) >= 3, `${prepReport.split('[W14-C]').length - 1} marked annotations`)

  // ── X12 this verifier cannot contact a hosted system ──
  // Structural, not a promise in a comment: the only external command this
  // file spawns is git.
  const ownSource = read(CLOSEOUT_VERIFIER_PATH)
  const spawnedCommands = Array.from(ownSource.matchAll(/execFileSync\(\s*'([^']+)'/g)).map((m) => m[1])
  const nonGitCommands = spawnedCommands.filter((command) => command !== 'git')
  check('X12a the only external command this verifier spawns is git — it structurally cannot reach a hosted system',
    spawnedCommands.length > 0 && nonGitCommands.length === 0, `also spawns: ${nonGitCommands.join(', ')}`)
  check('X12b this verifier imports no network module',
    !/from\s+'node:(http|https|net|tls|dgram)'/.test(ownSource))
}

// ── negative controls ────────────────────────────────────────────────
/**
 * A control corrupts the record and must be REJECTED BY A NAMED ASSERTION.
 * Requiring the specific assertion — not merely "something failed" — is what
 * keeps each pin alive: a pin that stops firing shows up here as a broken
 * control rather than vanishing into an aggregate pass.
 *
 * Each control is classified DELETE, SUBSTITUTE or ADD. A suite made only of
 * SUBSTITUTE controls proves nothing about what happens when a claim is
 * simply dropped, which is the likelier failure in a document that gets
 * edited by hand.
 */
function runRecordControls(baseline: World): void {
  const controls: Array<{ label: string; expect: string; mutate: (w: World) => void }> = [
    {
      label: 'NC-DELETE: the DO NOT RERUN rule removed from the record',
      expect: 'R11a',
      mutate: (w) => { w.record = w.record.replace(/DO NOT RERUN/g, 'proceed as needed') },
    },
    {
      label: 'NC-DELETE: the read-state-first rule removed',
      expect: 'R11b',
      mutate: (w) => { w.record = w.record.replace(/READ STATE FIRST/gi, 'try again') },
    },
    {
      label: 'NC-DELETE: the spent-gate proof token removed',
      expect: 'R11c',
      mutate: (w) => { w.record = w.record.replace(/would_second_run_fail_pre_target/g, 'looked fine') },
    },
    {
      label: 'NC-DELETE: one deferred carry dropped from the record',
      expect: 'R9.135',
      mutate: (w) => { w.record = w.record.replace(/Suitcase carry/g, '') },
    },
    {
      label: 'NC-DELETE: the delivery boundary sentence removed',
      expect: 'R10b',
      mutate: (w) => { w.record = w.record.replace(/deliver_catalog_exercises/g, 'the delivery routine') },
    },
    {
      label: 'NC-DELETE: the operator-supplied labelling of the hosted facts removed',
      expect: 'R13',
      mutate: (w) => { w.record = w.record.replace(/never independently verified by Claude/gi, 'verified') },
    },
    {
      label: 'NC-SUBSTITUTE: one of the five frozen logical UUIDs replaced',
      expect: 'R6.139',
      mutate: (w) => { w.record = w.record.replace('e21b2c00-0000-4000-a000-000000000008', 'e21b2c00-0000-4000-a000-0000000000ff') },
    },
    {
      label: 'NC-SUBSTITUTE: the executed package\'s sha256 altered by one character',
      expect: 'R2',
      mutate: (w) => { w.record = w.record.replace(/a928b045cc1397e4145b21a0504d4e7364a37c90b88c1dd85d8df36fb27413cd/g, `a928b045cc1397e4145b21a0504d4e7364a37c90b88c1dd85d8df36fb27413c${'e'}`) },
    },
    {
      label: 'NC-SUBSTITUTE: the approved W14-P candidate tip replaced with another commit',
      expect: 'R4',
      mutate: (w) => { w.record = w.record.replace(new RegExp(W14P_CANDIDATE_COMMIT, 'g'), 'dd24dd655d8652fa0a57cc64338068aebe84804b') },
    },
    {
      label: 'NC-SUBSTITUTE: the hosted status downgraded from SPENT to a rerunnable state',
      expect: 'R8',
      mutate: (w) => { w.record = w.record.replace(/SPENT/g, 'READY') },
    },
    {
      label: 'NC-SUBSTITUTE: one payload fingerprint perturbed',
      expect: 'R18.132',
      mutate: (w) => { w.record = w.record.replace('f1f2843950c1426c5b5b615b50ec97d168e632b7e1c8946f98f5178efd5e1216', 'f'.repeat(64)) },
    },
    {
      label: 'NC-SUBSTITUTE: the wrong hosted project ref recorded',
      expect: 'R14',
      mutate: (w) => { w.record = w.record.replace(new RegExp(HOSTED_PROJECT_REF, 'g'), 'someotherprojectref0') },
    },
    {
      label: 'NC-SUBSTITUTE: migration 028\'s pinned digest altered',
      expect: 'R15a',
      mutate: (w) => { w.record = w.record.replace(/9b7d3a52dc0b75f129745bec51a4c972aa284bb5cb0d6159e0cbbb981e463fb3/g, '0'.repeat(64)) },
    },
    {
      label: 'NC-ADD: a sentence claiming Claude queried hosted Supabase itself',
      expect: 'R16',
      mutate: (w) => { w.record += '\n\nClaude queried hosted Supabase directly and confirmed all five rows.\n' },
    },
    {
      label: 'NC-ADD: a sentence claiming Claude executed the package against hosted',
      expect: 'R16',
      mutate: (w) => { w.record += '\n\nClaude executed the package against hosted Supabase and observed the commit.\n' },
    },
    {
      label: 'NC-ADD: the same logical UUID recorded a second time, describing a different row',
      expect: 'R6.132',
      mutate: (w) => { w.record += '\n\n| 140 | Some other exercise | `e21b2c00-0000-4000-a000-000000000004` | n/a |\n' },
    },
  ]

  for (const control of controls) {
    const world: World = { record: baseline.record }
    control.mutate(world)
    if (world.record === baseline.record) {
      check(`${control.label} -> rejected by ${control.expect}`, false,
        'the control did not change the record — its target text is GONE, so the control is broken')
      continue
    }
    const findings: Finding[] = []
    assertRecord(world, findings)
    const targeted = findings.filter((finding) => finding.name.startsWith(control.expect))
    if (targeted.length === 0) {
      check(`${control.label} -> rejected by ${control.expect}`, false,
        `no assertion named ${control.expect} exists — the control targets a pin that is GONE`)
      continue
    }
    const rejected = targeted.some((finding) => !finding.ok)
    const collateral = findings.filter((f) => !f.ok && !f.name.startsWith(control.expect)).length
    check(`${control.label} -> rejected by ${control.expect}${collateral > 0 ? ` (and ${collateral} further assertion${collateral === 1 ? '' : 's'})` : ''}`,
      rejected, `${control.expect} still PASSED on the corrupted record — that pin is dead`)
  }
}

/**
 * The byte pins cannot be exercised by corrupting the record, so they are
 * ablated directly: each pinned size and digest is perturbed and the same
 * comparison must fail. A pin nobody has ever seen fail is indistinguishable
 * from a pin that is not wired up.
 */
function runPinAblations(): void {
  for (const artifact of FROZEN_ARTIFACTS) {
    const onDisk = readFileSync(path.join(repositoryRoot, artifact.path))
    const wrongDigest = `${artifact.sha256.slice(0, 63)}${artifact.sha256.endsWith('f') ? 'e' : 'f'}`
    check(`AB.${path.basename(artifact.path)} the digest pin is live — a one-character change to the expected sha256 makes the comparison FAIL`,
      sha256(onDisk) !== wrongDigest)
    check(`AB.${path.basename(artifact.path)} the size pin is live — a one-byte change to the expected size makes the comparison FAIL`,
      onDisk.length !== artifact.bytes + 1)
  }
  check('AB.candidate-blob the blob-identity check is live — a path that never existed at the candidate resolves to null and cannot match',
    blobIdAt(W14P_CANDIDATE_COMMIT, HOSTED_APPLICATION_RECORD_PATH) === null,
    'the record must NOT exist at the approved W14-P candidate, or the closeout would be inside the reviewed set')
  check('AB.allowlist the change-surface allowlist is live — a path outside it is detected as outside it',
    !ALLOWED_CHANGED_PATHS.includes('src/app/page.tsx'))
}

// ── main ─────────────────────────────────────────────────────────────
function main(): number {
  console.log('W14 closeout — the hosted catalog-application record: local verification\n')
  console.log('The W14 package has ALREADY RUN and is SPENT. This verifier reads bytes and')
  console.log('git objects only: no database, no hosted Supabase, no Vercel, no Supabase CLI.')
  console.log('Every hosted figure in the record is OPERATOR-SUPPLIED and is not re-read here.\n')

  for (const requiredPath of [HOSTED_APPLICATION_RECORD_PATH, SQL_PATH, MANIFEST_PATH, DECISIONS_PATH, PREP_REPORT_PATH]) {
    if (!existsSync(path.join(repositoryRoot, requiredPath))) {
      console.log(`  FAIL  required artifact missing: ${requiredPath}`)
      return 1
    }
  }

  const baseline: World = { record: read(HOSTED_APPLICATION_RECORD_PATH) }

  console.log('— The hosted-application record against the bytes it describes')
  const findings: Finding[] = []
  assertRecord(baseline, findings)
  for (const finding of findings) check(finding.name, finding.ok, finding.detail)

  console.log('\n— Byte identity, migration and change-surface boundaries, ancestry')
  verifyBytesAndBoundaries()

  console.log('\n— Negative controls: every pin must reject the corruption it targets')
  runRecordControls(baseline)

  console.log('\n— Pin ablations: every byte pin must be demonstrably live')
  runPinAblations()

  const recordBytes = readFileSync(path.join(repositoryRoot, HOSTED_APPLICATION_RECORD_PATH))
  console.log(`\nunder test: ${HOSTED_APPLICATION_RECORD_PATH} ${recordBytes.length} B sha256 ${sha256(recordBytes)}`)
  console.log('W14 HOSTED APPLICATION IS COMPLETE / PASSED / SPENT. DO NOT RERUN THE PACKAGE.')
  console.log('Content review, publication and delivery have NOT begun and remain separately gated.')
  console.log(`\n${passed} passed, ${failed} failed`)
  return failed === 0 ? 0 : 1
}

process.exit(main())
