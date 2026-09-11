// ============================================================
// ForgeFitOS — W14 static verifier: the five-entry catalog admission.
//
// Asserts the W14 preparation INDEPENDENTLY of the generator that produced
// it. Where the generator reads a carrier and writes an artifact, this
// verifier reads the artifact and the carrier separately and requires them
// to agree — so a generator bug, a hand edit, or a superseded value
// surviving into the package all show up here.
//
// Independence is deliberate in three places:
//
//   1. The class-A fields (the ones the historical planning inventory
//      supplies) are re-derived by a SEPARATE parse of
//      docs/exlib2b-release1-inventory.jsonl. The generator's parse is not
//      reused, and neither is its output.
//   2. The class-B/C fields (the operator's rulings) are pinned in the
//      EXPECTED table below, transcribed from the committed decision
//      carrier. The verifier does NOT learn them from the manifest it is
//      checking; that would only prove the manifest equals itself.
//   3. The payload fingerprints are recomputed here from the manifest's
//      DECLARED scheme, in code written independently of the generator's.
//
// The negative controls at the end are the point of the structure: every
// assertion set runs against deliberately corrupted copies of the manifest
// and the SQL package, and each control must be REJECTED BY THE ASSERTION
// IT TARGETS. A control that fails for an unrelated reason is reported as a
// broken control, not as a pass — otherwise a pin could be silently dead.
//
// SCOPE. This verifier covers the class the live proof structurally cannot:
// no database can know which five UUIDs were frozen, which three carries
// were deferred, or that a superseded source binding was replaced rather
// than merely changed. scripts/verify-weight-time-w14-live.sh proves what
// actually lands in PostgreSQL; this proves the governed intent is what got
// sent there. Both are required.
//
// Never contacts Supabase, Vercel, or any remote service, and never touches
// a database — it reads committed bytes and the working tree only.
// Run from the repository root:
//   npx tsx scripts/verify-weight-time-w14.ts
// ============================================================

import path from 'node:path'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'

const repositoryRoot = process.cwd()

const MANIFEST_PATH = 'docs/weight-time-w14-admission-manifest.json'
const SQL_PATH = 'docs/weight-time-w14-catalog-admission.sql'
const DECISIONS_PATH = 'docs/weight-time-w14-catalog-field-decisions.md'
const INVENTORY_PATH = 'docs/exlib2b-release1-inventory.jsonl'
const COVERAGE_PATH = 'docs/exlib2b-release1-coverage-matrix.md'
const GENERATOR_PATH = 'scripts/generate-weight-time-w14-package.ts'

/** The W13 production tree this candidate must be a plain forward line from. */
const PRODUCTION_BASE_COMMIT = 'a54a30c25b1427aee24d00c37bd6a4aec69dd3d0'
const PRODUCTION_BASE_TREE = 'e4838dea0c2ad66a894969ab1c20982d28a6af29'

/** The structural prerequisite. Frozen: W14 modifies no migration. */
const MIGRATION_028 = 'supabase/migrations/028_weight_time_tracking_mode.sql'
const MIGRATION_028_BYTES = 37162
const MIGRATION_028_SHA256 = '9b7d3a52dc0b75f129745bec51a4c972aa284bb5cb0d6159e0cbbb981e463fb3'

/**
 * Artifacts generated under the SUPERSEDED same-source-url decision. The
 * correction ruling classifies these hashes as BLOCKED evidence, so none of
 * them may appear in the governed manifest or package. They may — and do —
 * appear in the decision carrier, which records the history on purpose.
 */
const BLOCKED_SUPERSEDED_HASHES = [
  '27fb3f2081d71c639ada9ee1abfa38151c3a7965d7e3360bafc18a6d55a84baf', // superseded SQL package
  'c6e106d24134fb74a7344e10abf2c9c36cefb75d64d0436679aabfc75e55fadd', // superseded manifest
]
/** 133's payload fingerprint under the superseded binding. */
const SUPERSEDED_133_FINGERPRINT = '897843535539b8d324a31868b1b9a4c94e37c721697d163e1ce6143c8397c3a3'

/**
 * The operator's rulings, transcribed from the committed decision carrier.
 * Deliberately NOT read out of the manifest under test.
 *
 * The two external rows carry DISTINCT source urls. That is the whole point
 * of Correction 1: exercise_catalog_source_url_version_unique_idx makes one
 * shared url impossible for two rows born at catalog_version 1, and the
 * remedy was a second REAL committed evidence source — never a relaxed
 * index and never a falsified provenance.
 */
const EXPECTED = [
  {
    inventoryFileLine: 132,
    logicalId: 'e21b2c00-0000-4000-a000-000000000004',
    canonicalName: 'Plate-weighted plank',
    category: 'isolation',
    equipment: 'weight_plate',
    laterality: 'bilateral',
    trackingMode: 'weight_time',
    provenance: 'external_source_derived',
    movementPattern: 'core_anti_extension',
    sourceUrl: 'https://www.strengthlog.com/weighted-plank/',
    sourcePage: 'https://www.strengthlog.com/exercise-directory/',
    retrievedAt: '2026-08-20',
    importConfidence: 'human_review_required',
  },
  {
    inventoryFileLine: 133,
    logicalId: 'e21b2c00-0000-4000-a000-000000000005',
    canonicalName: 'Weighted vest plank',
    category: 'isolation',
    equipment: 'weighted_vest',
    laterality: 'bilateral',
    trackingMode: 'weight_time',
    provenance: 'external_source_derived',
    movementPattern: 'core_anti_extension',
    // Correction 1: the committed EXLIB-1C0A independent evidence article.
    sourceUrl: 'https://marathonhandbook.com/weighted-plank/',
    // Intentionally the same url as source_url: a standalone article, not a
    // directory listing. The StrengthLog directory page must NOT be attached
    // to a Marathon Handbook source record.
    sourcePage: 'https://marathonhandbook.com/weighted-plank/',
    retrievedAt: '2026-08-24',
    importConfidence: 'human_review_required',
  },
  {
    inventoryFileLine: 137,
    logicalId: 'e21b2c00-0000-4000-a000-000000000006',
    canonicalName: 'Weighted dead hang',
    category: 'isolation',
    equipment: 'weight_plate',
    laterality: 'bilateral',
    trackingMode: 'weight_time',
    provenance: 'forgefitos_original',
    movementPattern: 'grip_forearm',
    sourceUrl: null,
    sourcePage: null,
    retrievedAt: null,
    importConfidence: null,
  },
  {
    inventoryFileLine: 138,
    logicalId: 'e21b2c00-0000-4000-a000-000000000007',
    canonicalName: 'Weighted wall sit',
    category: 'compound',
    equipment: 'weight_plate',
    laterality: 'bilateral',
    trackingMode: 'weight_time',
    provenance: 'forgefitos_original',
    movementPattern: 'squat',
    sourceUrl: null,
    sourcePage: null,
    retrievedAt: null,
    importConfidence: null,
  },
  {
    inventoryFileLine: 139,
    logicalId: 'e21b2c00-0000-4000-a000-000000000008',
    canonicalName: 'Weighted vest wall sit',
    category: 'compound',
    equipment: 'weighted_vest',
    laterality: 'bilateral',
    trackingMode: 'weight_time',
    provenance: 'forgefitos_original',
    movementPattern: 'squat',
    sourceUrl: null,
    sourcePage: null,
    retrievedAt: null,
    importConfidence: null,
  },
] as const

/** The three carries: deferred, not admitted, not renamed, not reinterpreted. */
const EXCLUDED_CARRIES = [
  { inventoryFileLine: 134, canonicalName: "Farmer's carry" },
  { inventoryFileLine: 135, canonicalName: 'Suitcase carry' },
  { inventoryFileLine: 136, canonicalName: 'Sandbag bear-hug carry' },
] as const

const MANIFEST_ORDER = [132, 133, 137, 138, 139]

/** Authorities this work must not exercise. Loading is not approval. */
const FORBIDDEN_FUNCTIONS = [
  'deliver_catalog_exercises',
  'rollback_catalog_delivery',
  'load_catalog_content_draft',
  'apply_content_review',
  'admit_catalog_content',
  'publish_catalog_content',
  'exlib_approve_and_seal_run',
  'exlib_revoke_run_delivery',
  'exlib_content_admission_manifest',
]

/**
 * The change surface W14 preparation is allowed to touch. Anything outside
 * this list means the work grew past its authorization.
 */
const ALLOWED_CHANGED_PATHS = [
  DECISIONS_PATH,
  MANIFEST_PATH,
  SQL_PATH,
  GENERATOR_PATH,
  'scripts/verify-weight-time-w14.ts',
  'scripts/verify-weight-time-w14-live.sh',
  'docs/weight-time-w14-prep-report.md',
]

/** Deferred non-blocking maintenance findings. Explicitly out of scope. */
const DEFERRED_MAINTENANCE_FILES = [
  'scripts/verify-exlib1c0b3-live.sh',
  'scripts/verify-exlib2e-live.sh',
  'scripts/verify-exlib2l-live.sh',
]

/** The 18 load_catalog_snapshot parameters, in migration-027 declaration order. */
const LOADER_PARAMETERS = [
  'logical_id', 'canonical_name', 'category', 'primary_muscle', 'equipment',
  'laterality', 'tracking_mode', 'provenance', 'movement_pattern', 'training_role',
  'difficulty', 'availability', 'source_url', 'source_page', 'retrieved_at',
  'import_confidence', 'anatomy', 'aliases',
] as const

/** Field -> the dollar-quote tag the package uses at its call sites. */
const CALL_SITE_TAGS: Record<string, string> = {
  canonical_name: 'nm', category: 'cat', primary_muscle: 'pm', equipment: 'eq',
  laterality: 'lat', tracking_mode: 'tm', provenance: 'prov', movement_pattern: 'mp',
  training_role: 'tr', difficulty: 'dif', availability: 'av', source_url: 'su',
  source_page: 'sp', retrieved_at: 'ra', import_confidence: 'ic', anatomy: 'anat',
  aliases: 'alia',
}

const SOURCE_FIELDS = ['source_url', 'source_page', 'retrieved_at', 'import_confidence'] as const

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
function sha256(text: string | Buffer): string {
  return createHash('sha256').update(text).digest('hex')
}
function git(...args: string[]): string {
  // Absolute -C, always: a command whose output becomes a claim about a repo
  // must not depend on the ambient working directory.
  return execFileSync('git', ['-C', repositoryRoot, ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).trim()
}
/** For git commands whose ANSWER is the exit status (--is-ancestor, --quiet). */
function gitSucceeds(...args: string[]): boolean {
  try { git(...args); return true } catch { return false }
}

/**
 * SQL with comment text removed, so "this function is never called" is a
 * claim about executable statements and not about the prose that promises
 * it. The package names every forbidden function in its own header comment;
 * matching raw text would make that documentation self-incriminating.
 *
 * Conservative by construction: it truncates each line at the first `--`,
 * which can only ever DELETE text from consideration. A forbidden call
 * placed before a `--` on its own line still survives and is still caught.
 */
function executableSql(sql: string): string {
  return sql.split('\n').map((line) => {
    const at = line.indexOf('--')
    return at === -1 ? line : line.slice(0, at)
  }).join('\n')
}

/** The five load_catalog_snapshot call sites, split so each is read alone. */
function snapshotBlocks(sql: string): string[] {
  return sql.match(/^SELECT public\.load_catalog_snapshot\($[\s\S]*?::jsonb\);$/gm) ?? []
}
/** The one call site that carries this inventory line's name tag. */
function snapshotBlockFor(sql: string, inventoryLine: number): string | undefined {
  return snapshotBlocks(sql).find((block) => block.includes(`$nm${inventoryLine}$`))
}

// ── the assertion set (pure, so controls can run it too) ──────────────
/**
 * The manifest's shape, declared rather than inferred. The point is not
 * ceremony: an assertion that reads `entry.source_url` has to fail when the
 * field is renamed, and only a declared shape makes that a compile error
 * instead of a silent `undefined === null` comparison. The index signature
 * exists because the source-field assertions address fields by name.
 */
type AnatomyRow = { muscle: string; role: string }
type DecisionBasis = {
  class_A_source_derived: string[]
  operator_ruled: string[]
  carrier_for_class_A: string
  carrier_for_operator_ruled: string
  provenance_basis?: string
}
type ManifestEntry = {
  inventory_file_line: number
  inventory_record_ordinal: number
  normalized_name: string
  logical_id: string
  canonical_name: string
  category: string
  primary_muscle: string
  equipment: string
  laterality: string
  tracking_mode: string
  provenance: string
  movement_pattern: string
  training_role: string
  difficulty: string
  availability: string
  source_url: string | null
  source_page: string | null
  retrieved_at: string | null
  import_confidence: string | null
  anatomy: AnatomyRow[]
  aliases: string[]
  payload_fingerprint_sha256: string
  decision_basis: DecisionBasis
  [field: string]: unknown
}
type SourceBinding = { path: string; bytes: number; sha256: string }
/**
 * `entries` and `provenance_split` are declared PRESENT rather than optional.
 * That is a statement about the artifact contract, not a proof: what actually
 * proves they exist is S1a/S1b (five entries) and S8x/S7e (the provenance
 * split), which read the parsed JSON at runtime. Declaring them lets the
 * negative controls address a governed value directly, so a renamed field is
 * a compile error instead of a control that silently mutates nothing.
 */
type Manifest = {
  admission_set_size?: number
  manifest_order?: number[]
  hosted_application_has_occurred?: boolean
  excluded_deferred?: { inventory_file_lines?: number[]; names?: string[]; reason?: string }
  provenance_split: { external_source_derived?: number[]; forgefitos_original?: number[]; invariant: string }
  external_source_url_uniqueness?: { rule?: string; enforced_by?: string; catalog_version_note?: string; history?: string }
  source_bindings?: SourceBinding[]
  entries: ManifestEntry[]
  [key: string]: unknown
}

type World = { manifest: Manifest; sql: string }

/**
 * Every assertion that reads the manifest or the SQL package. Pure: it
 * appends findings rather than printing, so a corrupted World can be run
 * through the identical logic and its rejection verified by name.
 */
function assertArtifacts(world: World, out: Finding[]): void {
  const add = (name: string, ok: boolean, detail?: string) => { out.push({ name, ok, detail }) }
  const { manifest, sql } = world
  const entries: ManifestEntry[] = Array.isArray(manifest?.entries) ? manifest.entries : []

  // ── S1 admission set, size, order, no sixth identity ──
  add('S1a admission set is EXACTLY the five governed inventory lines',
    entries.length === 5 && entries.every((e, i) => e.inventory_file_line === MANIFEST_ORDER[i]),
    `entries: ${entries.map((e) => e.inventory_file_line).join(',')}`)
  add('S1b declared admission_set_size is 5 and agrees with the entry count',
    manifest?.admission_set_size === 5 && entries.length === 5,
    `declared ${manifest?.admission_set_size}, actual ${entries.length}`)
  add('S1c manifest_order is exactly 132, 133, 137, 138, 139',
    Array.isArray(manifest?.manifest_order) && manifest.manifest_order.join(',') === MANIFEST_ORDER.join(','),
    `got ${JSON.stringify(manifest?.manifest_order)}`)
  add('S1d no SIXTH logical identity anywhere - the five UUIDs are unique and the package declares exactly five',
    new Set(entries.map((e) => e.logical_id)).size === 5
      && (sql.match(/^SELECT public\.load_catalog_identity\(/gm) ?? []).length === 5
      && (sql.match(/^SELECT public\.load_catalog_snapshot\($/gm) ?? []).length === 5,
    `distinct ids ${new Set(entries.map((e) => e.logical_id)).size}, identity calls ${(sql.match(/^SELECT public\.load_catalog_identity\(/gm) ?? []).length}, snapshot calls ${(sql.match(/^SELECT public\.load_catalog_snapshot\($/gm) ?? []).length}`)

  // ── S2 carry exclusion ──
  const carryLines: number[] = EXCLUDED_CARRIES.map((c) => c.inventoryFileLine)
  add('S2a carry exclusion is declared as exactly inventory lines 134, 135, 136',
    manifest?.excluded_deferred?.inventory_file_lines?.join(',') === carryLines.join(','),
    `got ${JSON.stringify(manifest?.excluded_deferred?.inventory_file_lines)}`)
  add('S2b no carry is admitted - no entry bears a carry inventory line or a carry name',
    entries.every((e) => !carryLines.includes(e.inventory_file_line))
      && entries.every((e) => !/carry|farmer|suitcase|sandbag/i.test(String(e.canonical_name))),
    entries.map((e) => `${e.inventory_file_line}:${e.canonical_name}`).join(' '))
  add('S2c no carry name reaches a load_catalog_snapshot call site in the package',
    snapshotBlocks(sql).length === 5 && snapshotBlocks(sql).every((block) => !/carry|farmer|suitcase|sandbag/i.test(block)),
    `${snapshotBlocks(sql).length} call sites parsed`)

  // ── S3..S7 per-entry governed values, against the INDEPENDENT table ──
  for (const want of EXPECTED) {
    const line = want.inventoryFileLine
    const entry = entries.find((e) => e.inventory_file_line === line)
    if (!entry) { add(`S3.${line} the manifest governs inventory line ${line}`, false, 'entry absent'); continue }
    add(`S3.${line} tracking_mode is exactly weight_time`, entry.tracking_mode === want.trackingMode, `got ${entry.tracking_mode}`)
    add(`S4.${line} equipment is exactly ${want.equipment}`, entry.equipment === want.equipment, `got ${entry.equipment}`)
    add(`S5.${line} laterality is bilateral`, entry.laterality === want.laterality, `got ${entry.laterality}`)
    add(`S6.${line} category is exactly ${want.category} (operator ruling, not derived from training_role)`,
      entry.category === want.category, `got ${entry.category}`)
    add(`S7.${line} provenance is exactly ${want.provenance}`, entry.provenance === want.provenance, `got ${entry.provenance}`)
    add(`S7.${line}b logical identity is the frozen UUID ${want.logicalId}`, entry.logical_id === want.logicalId, `got ${entry.logical_id}`)
    add(`S7.${line}c canonical_name is exactly "${want.canonicalName}"`, entry.canonical_name === want.canonicalName, `got ${entry.canonical_name}`)
    add(`S7.${line}d movement_pattern is exactly ${want.movementPattern}`, entry.movement_pattern === want.movementPattern, `got ${entry.movement_pattern}`)
    add(`S9.${line} aliases is exactly [] - no alias claim is preferable to an unsupported name claim`,
      Array.isArray(entry.aliases) && entry.aliases.length === 0, `got ${JSON.stringify(entry.aliases)}`)
    // The four discovery-source fields, each pinned individually so nulling
    // any ONE of them is caught rather than averaged away.
    for (const field of SOURCE_FIELDS) {
      const expectedValue = field === 'source_url' ? want.sourceUrl
        : field === 'source_page' ? want.sourcePage
        : field === 'retrieved_at' ? want.retrievedAt : want.importConfidence
      add(`S8.${line}.${field} is exactly ${expectedValue === null ? 'NULL' : expectedValue}`,
        (entry[field] ?? null) === expectedValue, `got ${JSON.stringify(entry[field] ?? null)}`)
    }
  }

  // ── S7e the intentional 2/3 provenance split, never normalized ──
  const external = entries.filter((e) => e.provenance === 'external_source_derived').map((e) => e.inventory_file_line)
  const original = entries.filter((e) => e.provenance === 'forgefitos_original').map((e) => e.inventory_file_line)
  add('S7e the provenance split is MIXED exactly 2/3 - external 132,133 and forgefitos_original 137,138,139 - and was not normalized to one value',
    external.join(',') === '132,133' && original.join(',') === '137,138,139',
    `external [${external.join(',')}] original [${original.join(',')}]`)
  add('S7f every forgefitos_original entry carries ALL FOUR discovery-source fields NULL',
    entries.filter((e) => e.provenance === 'forgefitos_original')
      .every((e) => SOURCE_FIELDS.every((f) => (e[f] ?? null) === null)))
  add('S7g every external_source_derived entry carries ALL FOUR discovery-source fields NON-NULL',
    entries.filter((e) => e.provenance === 'external_source_derived')
      .every((e) => SOURCE_FIELDS.every((f) => (e[f] ?? null) !== null)))

  // ── S8z THE CORRECTION-1 INVARIANT: two external rows, two distinct urls ──
  const e132 = entries.find((e) => e.inventory_file_line === 132)
  const e133 = entries.find((e) => e.inventory_file_line === 133)
  add('S8z the two external source urls DIFFER - the superseded shared-url binding is impossible under exercise_catalog_source_url_version_unique_idx at catalog_version 1',
    !!e132 && !!e133 && e132.source_url !== e133.source_url,
    `132 [${e132?.source_url}] 133 [${e133?.source_url}]`)
  add('S8y both plank variants remain external_source_derived - the collision was NOT resolved by reclassifying 133 as a ForgeFitOS original',
    e132?.provenance === 'external_source_derived' && e133?.provenance === 'external_source_derived')
  add('S8x the manifest records the uniqueness rule and names the index that enforces it',
    typeof manifest?.external_source_url_uniqueness?.enforced_by === 'string'
      && manifest.external_source_url_uniqueness.enforced_by.includes('exercise_catalog_source_url_version_unique_idx'),
    `got ${JSON.stringify(manifest?.external_source_url_uniqueness?.enforced_by)}`)

  // ── S10 payload fingerprints recompute from the manifest's own scheme ──
  for (const entry of entries) {
    let form = ''
    for (const parameter of LOADER_PARAMETERS) {
      const value = entry[parameter] ?? null
      let rendered: string
      if (parameter === 'anatomy') {
        const rows = ([...((value ?? []) as AnatomyRow[])]).sort((a, b) =>
          a.muscle === b.muscle ? String(a.role).localeCompare(String(b.role)) : String(a.muscle).localeCompare(String(b.muscle)))
        rendered = JSON.stringify(rows.map((r) => ({ muscle: r.muscle, role: r.role })))
      } else if (parameter === 'aliases') {
        rendered = JSON.stringify(value ?? [])
      } else {
        rendered = value === null ? '\\N' : String(value)
      }
      form += `p_${parameter}=${rendered}\n`
    }
    const recomputed = sha256(form)
    add(`S10.${entry.inventory_file_line} payload fingerprint recomputes independently from the manifest's declared scheme`,
      recomputed === entry.payload_fingerprint_sha256,
      `recomputed ${recomputed} declared ${entry.payload_fingerprint_sha256}`)
  }

  // ── S11 the package consumes the SAME values the manifest governs ──
  // Read structurally by dollar-quote tag, which keys each value to both a
  // field and an inventory line — stronger than argument position.
  for (const entry of entries) {
    const line = entry.inventory_file_line
    add(`S11.${line} the package declares this identity exactly once`,
      (sql.match(new RegExp(`^SELECT public\\.load_catalog_identity\\('${entry.logical_id}'\\);$`, 'gm')) ?? []).length === 1)
    let agreed = 0
    let disagreed: string[] = []
    for (const [field, tag] of Object.entries(CALL_SITE_TAGS)) {
      const value = entry[field] ?? null
      const marker = `$${tag}${line}$`
      const at = sql.indexOf(marker)
      if (value === null) {
        if (at === -1) agreed += 1
        else disagreed.push(`${field}: manifest NULL but the package emits ${marker}`)
        continue
      }
      if (at === -1) { disagreed.push(`${field}: ${marker} absent from the package`); continue }
      const end = sql.indexOf(marker, at + marker.length)
      const emitted = sql.slice(at + marker.length, end)
      // anatomy and aliases are emitted as SPACED json at the call site and
      // hashed as COMPACT json in the fingerprint. Both renderings are
      // intentional; compare structurally rather than by text.
      const same = (field === 'anatomy' || field === 'aliases')
        ? JSON.stringify(JSON.parse(emitted)) === JSON.stringify(value)
        : emitted === String(value)
      if (same) agreed += 1
      else disagreed.push(`${field}: package [${emitted}] manifest [${value}]`)
    }
    add(`S11.${line}b all seventeen governed payload fields in the package equal the manifest`,
      disagreed.length === 0 && agreed === Object.keys(CALL_SITE_TAGS).length,
      disagreed.slice(0, 3).join(' | '))
    add(`S11.${line}c the package binds this entry's payload fingerprint`,
      sql.includes(entry.payload_fingerprint_sha256))
  }
  for (const entry of entries.filter((e) => e.provenance === 'forgefitos_original')) {
    const block = snapshotBlockFor(sql, entry.inventory_file_line)
    add(`S11.${entry.inventory_file_line}d this entry's OWN call site emits four bare NULLs for the discovery-source arguments, satisfying exercise_catalog_provenance_sources_chk`,
      !!block && /\n\s*NULL, NULL, NULL, NULL,/.test(block), block ? 'NULL quartet not found in this block' : 'call site not found')
  }

  // ── S12 forbidden authority never appears in the package ──
  const executable = executableSql(sql)
  for (const fn of FORBIDDEN_FUNCTIONS) {
    add(`S12.${fn} is NEVER invoked - no call site survives in the package with comment text removed`,
      !new RegExp(`\\b(public\\.)?${fn}\\s*\\(`).test(executable))
  }
  add('S12z the package performs no content admission, review, or publication write',
    !/\bimport_admitted\s*=/.test(executable)
      && !/(INSERT INTO|UPDATE|DELETE FROM)\s+(public\.)?exercise_catalog_content\b/i.test(executable)
      && !/(INSERT INTO|UPDATE|DELETE FROM)\s+(public\.)?exercise_catalog_review_events\b/i.test(executable))
  add('S12y the package performs no tenant-delivery operation - no write to exercises or exercise_aliases',
    !/(INSERT INTO|UPDATE|DELETE FROM)\s+(public\.)?exercises\b/i.test(executable)
      && !/(INSERT INTO|UPDATE|DELETE FROM)\s+(public\.)?exercise_aliases\b/i.test(executable))
  add('S12x the package writes through the loader boundary only - no direct DML against any catalog table',
    !/^\s*(INSERT INTO|UPDATE|DELETE FROM)\s+(public\.)?exercise_catalog/im.test(executable))

  // ── M the required-field matrix: no loader argument may be guessed ──
  // The original STOP happened because four loader arguments had no carrier
  // in committed evidence. This re-runs that matrix mechanically: all
  // eighteen arguments of every entry must be attributed to exactly one
  // class, and each class must name a carrier the manifest has already bound
  // by size and SHA-256. "No field may be guessed" becomes checkable rather
  // than asserted.
  const boundPaths = new Set((manifest?.source_bindings ?? []).map((b) => b.path))
  let resolvedArguments = 0
  for (const entry of entries) {
    const basis = entry.decision_basis ?? {}
    const classA: string[] = basis.class_A_source_derived ?? []
    const ruled: string[] = basis.operator_ruled ?? []
    const attributed = [...classA, ...ruled]
    const missing = LOADER_PARAMETERS.filter((p) => !attributed.includes(p))
    const both = classA.filter((p) => ruled.includes(p))
    const unknown = attributed.filter((p) => !(LOADER_PARAMETERS as readonly string[]).includes(p))
    add(`M1.${entry.inventory_file_line} all eighteen loader arguments are attributed to exactly one decision class - none unattributed, none double-counted, none invented`,
      missing.length === 0 && both.length === 0 && unknown.length === 0 && attributed.length === 18,
      `missing [${missing.join(',')}] in both [${both.join(',')}] unknown [${unknown.join(',')}] total ${attributed.length}`)
    add(`M2.${entry.inventory_file_line} both decision classes name a carrier that the manifest has bound by size and SHA-256`,
      boundPaths.has(basis.carrier_for_class_A) && boundPaths.has(basis.carrier_for_operator_ruled),
      `class A carrier [${basis.carrier_for_class_A}] operator carrier [${basis.carrier_for_operator_ruled}]`)
    add(`M3.${entry.inventory_file_line} the class-A carrier is the historical planning inventory and the operator carrier is the W14 decision document - neither class is credited to the other's source`,
      basis.carrier_for_class_A === INVENTORY_PATH && basis.carrier_for_operator_ruled === DECISIONS_PATH)
    if (missing.length === 0 && both.length === 0 && unknown.length === 0) resolvedArguments += 18
  }
  add(`M4 the full matrix is closed: all ${entries.length * 18} entry-argument pairs are resolved against a committed carrier`,
    resolvedArguments === entries.length * 18 && entries.length === 5,
    `${resolvedArguments} of ${entries.length * 18} resolved`)

  // ── S13 superseded evidence must not survive into the artifacts ──
  const manifestText = JSON.stringify(manifest)
  add('S13a no BLOCKED superseded artifact hash appears in the governed manifest or package',
    BLOCKED_SUPERSEDED_HASHES.every((h) => !manifestText.includes(h) && !sql.includes(h)))
  add("S13b 133's superseded payload fingerprint appears in neither the manifest nor the package",
    !manifestText.includes(SUPERSEDED_133_FINGERPRINT) && !sql.includes(SUPERSEDED_133_FINGERPRINT))
  add('S13c the package is labeled PREPARED - NOT EXECUTED and states that hosted application has not occurred',
    sql.includes('PREPARED - NOT EXECUTED') && sql.includes('HAS NOT BEEN APPLIED TO HOSTED')
      && manifest?.hosted_application_has_occurred === false)
}

// ── the class-A oracle: an independent read of the historical inventory ──
function verifyAgainstInventory(manifest: Manifest): void {
  const lines = read(INVENTORY_PATH).split('\n')
  const CLASS_A: Array<[string, string]> = [
    ['canonical_name', 'proposed_canonical_name'], ['normalized_name', 'normalized_name'],
    ['primary_muscle', 'primary_muscle'], ['equipment', 'equipment'],
    ['tracking_mode', 'tracking_mode'], ['laterality', 'laterality'],
    ['movement_pattern', 'movement_pattern'], ['training_role', 'training_role'],
    ['difficulty', 'difficulty'], ['availability', 'availability'],
  ]
  for (const want of EXPECTED) {
    const raw = lines[want.inventoryFileLine - 1]
    const record = JSON.parse(raw)
    const entry = (manifest.entries ?? []).find((e) => e.inventory_file_line === want.inventoryFileLine)
    if (!entry) {
      check(`A1.${want.inventoryFileLine} the manifest governs inventory line ${want.inventoryFileLine}`, false, 'entry absent')
      continue
    }
    const wrong = CLASS_A.filter(([manifestKey, inventoryKey]) => entry[manifestKey] !== record[inventoryKey])
      .map(([manifestKey, inventoryKey]) => `${manifestKey}: manifest [${entry[manifestKey]}] inventory [${record[inventoryKey]}]`)
    check(`A1.${want.inventoryFileLine} all ten class-A fields equal the historical inventory record, re-parsed independently of the generator`,
      wrong.length === 0, wrong.slice(0, 3).join(' | '))
    const inventoryAnatomy = JSON.stringify(record.muscle_targets ?? [])
    check(`A2.${want.inventoryFileLine} anatomy equals the inventory's muscle_targets exactly`,
      JSON.stringify(entry.anatomy) === inventoryAnatomy,
      `manifest ${JSON.stringify(entry.anatomy)} inventory ${inventoryAnatomy}`)
    check(`A3.${want.inventoryFileLine} the inventory line and the record ordinal stay consistent (ordinal = file line - 4)`,
      entry.inventory_record_ordinal === want.inventoryFileLine - 4,
      `ordinal ${entry.inventory_record_ordinal} for file line ${want.inventoryFileLine}`)
  }
  // The three carries must still be present in the inventory, untouched.
  for (const carry of EXCLUDED_CARRIES) {
    const record = JSON.parse(lines[carry.inventoryFileLine - 1])
    check(`A4.${carry.inventoryFileLine} the deferred carry "${carry.canonicalName}" is still on the historical inventory line, still deferred, still import_ineligible, still review_status=proposed`,
      record.proposed_canonical_name === carry.canonicalName && record.deferred === true
      && record.import_eligible === false && record.review_status === 'proposed',
      `name ${record.proposed_canonical_name} deferred ${record.deferred} eligible ${record.import_eligible} status ${record.review_status}`)
  }
  // The historical rows for the FIVE admitted entries must ALSO be untouched:
  // admitting an entry into the catalog does not rewrite the approval record
  // that deferred it.
  const stillDeferred = EXPECTED.filter((w) => {
    const record = JSON.parse(lines[w.inventoryFileLine - 1])
    return record.deferred === true && record.import_eligible === false && record.review_status === 'proposed'
  })
  check('A5 all five admitted entries keep their ORIGINAL historical inventory rows - deferred=true, import_eligible=false, review_status=proposed - because that file is approval evidence, not a live admission ledger',
    stillDeferred.length === 5, `${stillDeferred.length} of 5 unchanged`)
  check('A6 the coverage matrix still states that eight entries were explicitly deferred',
    /8 explicitly deferred/.test(read(COVERAGE_PATH)))
}

// ── the decision carrier: rulings must be recorded, not merely applied ──
function assertDecisionCarrier(document: string, out: Finding[]): void {
  const check = (name: string, ok: boolean, detail?: string) => { out.push({ name, ok, detail }) }
  // The carrier is hard-wrapped markdown, so any sentence may break at any
  // word. Prose assertions run against a whitespace-flattened copy and
  // structural ones (headings, table rows) against the raw bytes: a pin that
  // depends on WHERE a line happens to wrap is not a pin, it is a coin flip.
  const flat = (text: string) => text.replace(/\s+/g, ' ')
  const prose = flat(document)
  check('D1 the decision carrier exists and is committed at HEAD',
    document.length > 0 && git('ls-tree', 'HEAD', '--', DECISIONS_PATH).length > 0)
  check('D2 the carrier carries an explicit decision-provenance class section, so no value is credited to a source that did not supply it',
    /^## 2\. Decision-provenance classes$/m.test(document)
    && /^## 8\. Required-field matrix/m.test(document))
  check('D3 the carrier states plainly what it does NOT do, including that it does not rewrite the historical inventory or admit anything',
    /^## 9\. What this document deliberately does NOT do$/m.test(document)
    && prose.includes('does **not** rewrite, reinterpret, or annotate')
    && prose.includes('does **not** admit anything'))

  // Correction 1 must be a FORWARD correction that preserves its own history.
  const correctionStart = document.indexOf('## 11. Correction 1')
  const correction = correctionStart === -1 ? '' : document.slice(correctionStart)
  const correctionProse = flat(correction)
  check('D4 Correction 1 exists as a later LABELED section that declares itself a correction rather than a rewrite, and names the unamended first-version commit',
    correction.length > 0
    && correctionProse.includes('This section is a later, labeled correction, not a rewrite.')
    && correctionProse.includes('f125308e0a22d935c889691452477b5ac9138f83')
    && correctionProse.includes('is NOT amended'))
  check('D5 Correction 1 records that the first decision version bound BOTH plank variants to one source_url',
    correctionProse.includes('The first decision version bound both plank variants to one'))
  check('D6 Correction 1 records that DISPOSABLE EXECUTION proved that binding impossible under the named unique index, and that the package rolled back correctly',
    correctionProse.includes('Disposable execution proved that binding impossible.')
    && correctionProse.includes('exercise_catalog_source_url_version_unique_idx')
    && correctionProse.includes('The package correctly rolled back.'))
  check('D6b Correction 1 records the exact colliding key the database reported, so the blocker is evidence rather than paraphrase',
    correctionProse.includes('Key (source_url, catalog_version)')
    && correctionProse.includes('(https://www.strengthlog.com/weighted-plank/, 1) already exists'))
  check('D6c Correction 1 explains why deferring 133 would not help - the index is non-partial and catalog_version is not reachable through the loader',
    correctionProse.includes('non-partial')
    && correctionProse.includes('born at the column DEFAULT of 1')
    && correctionProse.includes('not a sequencing problem'))
  check('D7 Correction 1 identifies the second external evidence carrier as an ALREADY-COMMITTED EXLIB-1C0A record, established without network access',
    correctionProse.includes('exlib1c0a-eq-02')
    && correctionProse.includes('docs/exlib1c0a-equipment-resolution.jsonl')
    && correctionProse.includes('https://marathonhandbook.com/weighted-plank/')
    && correctionProse.includes('not new, not fetched, and not invented')
    && correctionProse.includes('No network access was used'))
  check("D7b the earlier STOP report's one wrong statement is recorded as a labeled later correction rather than erased, and the STOP itself is still affirmed as correct",
    correctionProse.includes('Correction to the earlier STOP report, recorded rather than erased')
    && correctionProse.includes('That statement was wrong.')
    && correctionProse.includes('The STOP itself was correct'))
  check('D8 Correction 1 states that no provenance value is changed merely to satisfy a constraint and that no schema relaxation is needed or authorized',
    correctionProse.includes('No provenance value is changed merely to satisfy a constraint.')
    && correctionProse.includes('No schema relaxation is needed, and none is authorized.')
    && correctionProse.includes('No migration 029 exists'))
  check("D9 the ORIGINAL section 3 rows for 133's superseded source binding are struck through and marked superseded, preserving the decision history rather than rewriting why the value changed",
    /\|\s*~~`source_url`~~\s*\|\s*~~`https:\/\/www\.strengthlog\.com\/weighted-plank\/`~~\s*\|\s*superseded/.test(document)
    && /\|\s*~~`source_page`~~\s*\|.*~~\s*\|\s*superseded/.test(document)
    && /\|\s*~~`retrieved_at`~~\s*\|\s*~~`2026-08-20`~~\s*\|\s*superseded/.test(document))
  const authoritative = correction.slice(correction.indexOf('### 11.3'), correction.indexOf('### 11.4'))
  check('D10 the authoritative 11.3 table states all seven final 133 values exactly, each with its decision class',
    /\|\s*`source_url`\s*\|\s*`https:\/\/marathonhandbook\.com\/weighted-plank\/`\s*\|\s*\*\*A\*\*/.test(authoritative)
    && /\|\s*`source_page`\s*\|\s*`https:\/\/marathonhandbook\.com\/weighted-plank\/`\s*\|\s*\*\*C\*\*/.test(authoritative)
    && /\|\s*`retrieved_at`\s*\|\s*`2026-08-24`\s*\|\s*\*\*A\*\*/.test(authoritative)
    && /\|\s*`import_confidence`\s*\|\s*`human_review_required`\s*\|\s*\*\*C\*\*/.test(authoritative)
    && /\|\s*`provenance`\s*\|\s*`external_source_derived`\s*\|\s*\*\*B\*\*/.test(authoritative)
    && /\|\s*`category`\s*\|\s*`isolation`\s*\|\s*\*\*C\*\*/.test(authoritative)
    && /\|\s*`aliases`\s*\|\s*`\[\]`\s*\|\s*\*\*C\*\*/.test(authoritative))
  check('D11 the carrier explicitly declines to credit Marathon Handbook with the import_confidence vocabulary value',
    correctionProse.includes('Marathon Handbook did not supply that vocabulary value and must not be credited with it'))
  check('D12 the carrier rules the source_page identity deliberate and forbids attaching the StrengthLog directory page to the Marathon Handbook record',
    correctionProse.includes('must NOT be attached to the Marathon Handbook source record')
    && correctionProse.includes('intentionally the same URL as `source_url`'))
  check('D12b Correction 1 confirms 133 was NOT reclassified and the 2/3 provenance sequence is unchanged',
    correctionProse.includes('133 remains `external_source_derived`')
    && correctionProse.includes('It was not reclassified to `forgefitos_original`')
    && correctionProse.includes('provenance sequence is unchanged'))
  check('D13 every one of the five frozen logical UUIDs is recorded in the carrier',
    EXPECTED.every((w) => document.includes(w.logicalId)))
  check('D14 the required-field matrix section names a carrier for every loader argument',
    prose.includes('every loader argument now has a carrier'))
}

/**
 * The D-block is text presence, which makes it the easiest kind of pin to
 * kill by accident: reword the document and the assertion quietly stops
 * asserting. These controls remove or rewrite exactly the passages the
 * governing ruling requires to be PRESERVED, and require the named
 * assertion to notice. A document is the only evidence that a decision was
 * ruled rather than assumed, so its pins have to be demonstrably alive.
 */
function runDecisionControls(document: string): void {
  const cut = (text: string, from: string, to: string): string => {
    const a = text.indexOf(from)
    const b = to === '' ? text.length : text.indexOf(to)
    return a === -1 || b === -1 ? text : text.slice(0, a) + text.slice(b)
  }
  const controls: Array<{ label: string; expect: string; mutate: (d: string) => string }> = [
    {
      label: 'NC-DECISION-ERASED: Correction 1 deleted instead of recorded as a forward correction',
      expect: 'D4',
      mutate: (d) => cut(d, '## 11. Correction 1', ''),
    },
    {
      label: 'NC-DECISION-UNSTRUCK: the superseded 133 rows silently un-struck, rewriting why the value changed',
      expect: 'D9',
      mutate: (d) => d.replace(/~~/g, ''),
    },
    {
      label: 'NC-DECISION-STOP-ERASED: the STOP report correction erased rather than labeled',
      expect: 'D7b',
      mutate: (d) => cut(d, '**Correction to the earlier STOP report', '### 11.3'),
    },
    {
      label: 'NC-DECISION-REBOUND: the authoritative 11.3 table quietly rebound to the superseded URL',
      expect: 'D10',
      mutate: (d) => d.replace(
        '| `source_url` | `https://marathonhandbook.com/weighted-plank/` | **A** |',
        '| `source_url` | `https://www.strengthlog.com/weighted-plank/` | **A** |'),
    },
    {
      label: 'NC-DECISION-EVIDENCE: the committed EXLIB-1C0A evidence carrier removed from the record',
      expect: 'D7',
      mutate: (d) => cut(d, '### 11.2 The second external evidence carrier', '### 11.3'),
    },
    {
      label: 'NC-DECISION-RELAXATION: the refusal to relax the schema struck from the record',
      expect: 'D8',
      mutate: (d) => cut(d, '### 11.4 What this correction does NOT do', ''),
    },
    {
      label: 'NC-DECISION-UUID: one frozen logical identity missing from the carrier',
      expect: 'D13',
      mutate: (d) => d.replace(EXPECTED[2].logicalId, 'e21b2c00-0000-4000-a000-0000000000ff'),
    },
  ]
  for (const control of controls) {
    const mutated = control.mutate(document)
    if (mutated === document) {
      check(`${control.label} -> rejected by ${control.expect}`, false,
        'the control changed NOTHING - the passage it targets is already gone from the document')
      continue
    }
    const findings: Finding[] = []
    assertDecisionCarrier(mutated, findings)
    const targeted = findings.filter((f) => f.name.startsWith(control.expect + ' '))
    if (targeted.length === 0) {
      check(`${control.label} -> rejected by ${control.expect}`, false,
        `no assertion named ${control.expect} exists - the control targets a pin that is GONE`)
      continue
    }
    check(`${control.label} -> rejected by ${control.expect}`, targeted.some((f) => !f.ok),
      `${control.expect} still PASSED on the mutilated document - that pin is dead`)
  }
}

// ── boundaries: 028, the index, the change surface, the commit shape ──
function verifyBoundaries(): void {
  const migrationBytes = readFileSync(path.join(repositoryRoot, MIGRATION_028))
  check('B1 migration 028 is byte-identical at its pinned size and sha256 - W14 modifies no migration',
    migrationBytes.length === MIGRATION_028_BYTES && sha256(migrationBytes) === MIGRATION_028_SHA256,
    `${migrationBytes.length} bytes, sha256 ${sha256(migrationBytes)}`)
  const migrations = readdirSync(path.join(repositoryRoot, 'supabase/migrations')).filter((f) => f.endsWith('.sql'))
  check('B2 there are exactly 28 numbered migrations and NO migration 029 - this work adds none',
    migrations.length === 28 && migrations.filter((f) => f.startsWith('029')).length === 0,
    `${migrations.length} migrations`)

  // The index Correction 1 turns on. Asserted at its DEFINING migration and
  // proven un-altered by every migration after it, so "the index enforces
  // this" is a fact about the applied chain, not about one file.
  const m023 = read('supabase/migrations/023_exlib_catalog_and_delivery_contract.sql')
  check('B3 exercise_catalog_source_url_version_unique_idx is defined in migration 023 as a NON-PARTIAL unique index on exactly (source_url, catalog_version)',
    /CREATE UNIQUE INDEX exercise_catalog_source_url_version_unique_idx\s+ON exercise_catalog\s*\(source_url, catalog_version\);/.test(m023),
    'definition not found in the expected form')
  const later = migrations.filter((f) => /^02[4-8]/.test(f)).map((f) => read(`supabase/migrations/${f}`)).join('\n')
  check('B4 no migration after 023 alters, drops, or reindexes exercise_catalog_source_url_version_unique_idx, so it is still in force at 028',
    !/(DROP INDEX|ALTER INDEX|REINDEX)[^\n;]*exercise_catalog_source_url_version_unique_idx/i.test(later)
    && !/ALTER TABLE[^;]*exercise_catalog[^;]*DROP CONSTRAINT[^;]*source_url/i.test(later))
  check('B5 no migration after 023 relaxes the index by adding NULLS NOT DISTINCT or a partial predicate to it',
    !/exercise_catalog_source_url_version_unique_idx[^;]*NULLS NOT DISTINCT/i.test(later)
    && !/CREATE UNIQUE INDEX[^;]*exercise_catalog_source_url_version_unique_idx[^;]*WHERE/i.test(later))

  // Change surface: committed diff from the production base, plus anything
  // still uncommitted, so the surface is the same before and after commit.
  check('B6 HEAD descends from the W13 production base with ZERO merge commits - a plain forward line',
    gitSucceeds('merge-base', '--is-ancestor', PRODUCTION_BASE_COMMIT, 'HEAD')
    && git('rev-list', '--count', '--merges', `${PRODUCTION_BASE_COMMIT}..HEAD`) === '0',
    `merges: ${git('rev-list', '--count', '--merges', `${PRODUCTION_BASE_COMMIT}..HEAD`)}`)
  check('B7 the production base commit still resolves to its pinned tree',
    git('rev-parse', `${PRODUCTION_BASE_COMMIT}^{tree}`) === PRODUCTION_BASE_TREE)
  const committed = git('diff', '--name-only', PRODUCTION_BASE_COMMIT, 'HEAD').split('\n').filter(Boolean)
  const working = git('status', '--porcelain').split('\n').filter(Boolean)
    // A rename prints "R  old -> new"; take both sides so neither escapes the allowlist.
    .flatMap((l) => l.slice(3).split(' -> ')).map((p) => p.trim().replace(/^"|"$/g, ''))
  // Array.from, not a spread: this repo's tsconfig target predates
  // downlevelIteration, so spreading a Set is a type error here.
  const surface = Array.from(new Set(committed.concat(working))).sort()
  const outside = surface.filter((p) => !ALLOWED_CHANGED_PATHS.includes(p))
  check('B8 the ENTIRE change surface - committed and uncommitted - is W14 preparation artifacts and nothing else',
    outside.length === 0, `outside the allowlist: ${outside.join(', ')}`)
  check('B9 no src/ application code is touched',
    surface.every((p) => !p.startsWith('src/')), surface.filter((p) => p.startsWith('src/')).join(', '))
  check('B10 no file under supabase/migrations/ is touched',
    surface.every((p) => !p.startsWith('supabase/migrations/')), surface.filter((p) => p.startsWith('supabase/migrations/')).join(', '))
  check('B11 the historical Release-1 inventory and coverage matrix are byte-identical to the production base',
    !surface.includes(INVENTORY_PATH) && !surface.includes(COVERAGE_PATH)
    && git('rev-parse', `${PRODUCTION_BASE_COMMIT}:${INVENTORY_PATH}`) === git('rev-parse', `HEAD:${INVENTORY_PATH}`)
    && git('rev-parse', `${PRODUCTION_BASE_COMMIT}:${COVERAGE_PATH}`) === git('rev-parse', `HEAD:${COVERAGE_PATH}`))
  check('B12 the deferred F2a maintenance sites are NOT modified on account of this work',
    DEFERRED_MAINTENANCE_FILES.every((p) => !surface.includes(p)),
    DEFERRED_MAINTENANCE_FILES.filter((p) => surface.includes(p)).join(', '))

  // Every artifact the manifest binds must still hash to the bound value,
  // both as committed and on disk.
  const bindings: SourceBinding[] = JSON.parse(read(MANIFEST_PATH)).source_bindings
  const drifted = bindings.filter((b) => {
    const onDisk = readFileSync(path.join(repositoryRoot, b.path))
    const committed = execFileSync('git', ['-C', repositoryRoot, 'cat-file', 'blob', `HEAD:${b.path}`], { maxBuffer: 64 * 1024 * 1024 })
    return onDisk.length !== b.bytes || sha256(onDisk) !== b.sha256 || sha256(committed) !== b.sha256
  })
  check(`B13 all ${bindings.length} bound source artifacts still match their recorded bytes and sha256, both as committed at HEAD and on disk`,
    drifted.length === 0, drifted.map((b) => b.path).join(', '))
}

// ── negative controls ────────────────────────────────────────────────
/**
 * A control corrupts the World and must be REJECTED BY A NAMED ASSERTION.
 * Requiring the specific assertion — not merely "something failed" — is what
 * keeps each pin alive: a pin that stops firing shows up as a broken control
 * rather than disappearing into an aggregate pass.
 */
function runControls(baseline: World): void {
  const controls: Array<{ label: string; expect: string; mutate: (w: World) => void }> = [
    {
      label: 'NC-SUBSTITUTE: one of the five frozen logical UUIDs replaced',
      expect: 'S7.139b',
      mutate: (w) => { w.manifest.entries[4].logical_id = 'e21b2c00-0000-4000-a000-0000000000ff' },
    },
    {
      label: 'NC-ADD: a SIXTH entry appended to the admission set',
      expect: 'S1a',
      mutate: (w) => { w.manifest.entries.push({ ...w.manifest.entries[4], inventory_file_line: 140, logical_id: 'e21b2c00-0000-4000-a000-0000000000f6' }) },
    },
    {
      label: 'NC-REORDER: the manifest order permuted',
      expect: 'S1c',
      mutate: (w) => { w.manifest.manifest_order = [133, 132, 137, 138, 139] },
    },
    {
      label: 'NC-EXTRA-IDENTITY: a sixth load_catalog_identity call added to the package',
      expect: 'S1d',
      mutate: (w) => { w.sql = w.sql.replace(/^SELECT public\.load_catalog_identity\('e21b2c00-0000-4000-a000-000000000008'\);$/m, "SELECT public.load_catalog_identity('e21b2c00-0000-4000-a000-000000000008');\nSELECT public.load_catalog_identity('e21b2c00-0000-4000-a000-0000000000f6');") },
    },
    {
      label: 'NC-ADMIT-A-CARRY: a deferred carry admitted as a sixth entry',
      expect: 'S2b',
      mutate: (w) => { w.manifest.entries.push({ ...w.manifest.entries[0], inventory_file_line: 134, canonical_name: "Farmer's carry", logical_id: 'e21b2c00-0000-4000-a000-0000000000fc' }) },
    },
    {
      label: 'NC-SAME-URL: the two external source urls made identical (the superseded binding)',
      expect: 'S8z',
      mutate: (w) => { w.manifest.entries[1].source_url = w.manifest.entries[0].source_url },
    },
    {
      label: 'NC-FORGEFITOS-133: 133 reclassified as forgefitos_original to dodge the unique index',
      expect: 'S7.133',
      mutate: (w) => {
        w.manifest.entries[1].provenance = 'forgefitos_original'
        for (const f of SOURCE_FIELDS) w.manifest.entries[1][f] = null
      },
    },
    {
      label: 'NC-NULL-EXTERNAL-FIELD: one external discovery-source field nulled',
      expect: 'S8.133.source_page',
      mutate: (w) => { w.manifest.entries[1].source_page = null },
    },
    {
      label: 'NC-SUPERSEDED-MANIFEST: the whole superseded same-url 133 binding restored, fingerprint included',
      expect: 'S8z',
      mutate: (w) => {
        const entry = w.manifest.entries[1]
        entry.source_url = 'https://www.strengthlog.com/weighted-plank/'
        entry.source_page = 'https://www.strengthlog.com/exercise-directory/'
        entry.retrieved_at = '2026-08-20'
        entry.payload_fingerprint_sha256 = SUPERSEDED_133_FINGERPRINT
      },
    },
    {
      label: 'NC-ALIAS: an unsupported alias name claim added',
      expect: 'S9.132',
      mutate: (w) => { w.manifest.entries[0].aliases = ['weighted plank'] },
    },
    {
      label: 'NC-CATEGORY: a category silently changed during package generation',
      expect: 'S6.138',
      mutate: (w) => { w.manifest.entries[3].category = 'isolation' },
    },
    {
      label: 'NC-EQUIPMENT: an equipment mapping changed',
      expect: 'S4.133',
      mutate: (w) => { w.manifest.entries[1].equipment = 'weight_plate' },
    },
    {
      // 'timed' rather than the obvious wrong value: it is the vocabulary
      // neighbour weight_time is actually confusable with, AND it keeps the
      // legacy reps-and-load mode name out of this file's bytes.
      // verify-exlib1c0b.ts sweeps scripts/verify-*.ts for that name and
      // requires every hit to appear in a byte-frozen pre-implementation audit
      // that no later file can join. A control string is not a reason to
      // retarget somebody else's frozen pin.
      label: 'NC-TRACKING-MODE: one entry moved off weight_time to its confusable vocabulary neighbour',
      expect: 'S3.137',
      mutate: (w) => { w.manifest.entries[2].tracking_mode = 'timed' },
    },
    {
      label: 'NC-FINGERPRINT: one payload fingerprint perturbed',
      expect: 'S10.132',
      mutate: (w) => { w.manifest.entries[0].payload_fingerprint_sha256 = 'f'.repeat(64) },
    },
    {
      label: 'NC-PACKAGE-DRIFT: the package emits a value the manifest does not govern',
      expect: 'S11.132b',
      mutate: (w) => { w.sql = w.sql.replace('$eq132$weight_plate$eq132$', '$eq132$weighted_vest$eq132$') },
    },
    {
      label: 'NC-DELIVERY: a tenant delivery call added to the package',
      expect: 'S12.deliver_catalog_exercises',
      mutate: (w) => { w.sql = w.sql.replace(/^COMMIT;$/m, "SELECT public.deliver_catalog_exercises('00000000-0000-0000-0000-000000000000');\nCOMMIT;") },
    },
    {
      label: 'NC-CONTENT-REVIEW: a content review call added to the package',
      expect: 'S12.apply_content_review',
      mutate: (w) => { w.sql = w.sql.replace(/^COMMIT;$/m, "SELECT public.apply_content_review('x');\nCOMMIT;") },
    },
    {
      label: 'NC-DIRECT-DML: a direct catalog INSERT added, bypassing the loader boundary',
      expect: 'S12x',
      mutate: (w) => { w.sql = w.sql.replace(/^COMMIT;$/m, 'INSERT INTO public.exercise_catalog (id) VALUES (gen_random_uuid());\nCOMMIT;') },
    },
    {
      label: 'NC-BLOCKED-HASH: a superseded artifact hash reintroduced into the manifest',
      expect: 'S13a',
      mutate: (w) => { w.manifest.provenance_split.invariant += ` ${BLOCKED_SUPERSEDED_HASHES[0]}` },
    },
    {
      label: 'NC-UNCARRIED-FIELD: a loader argument left with no decision carrier - the exact defect that caused the original STOP',
      expect: 'M1.133',
      mutate: (w) => {
        const basis = w.manifest.entries[1].decision_basis
        basis.operator_ruled = basis.operator_ruled.filter((p: string) => p !== 'source_url')
      },
    },
    {
      label: 'NC-MISCREDITED-FIELD: a source-derived fact reattributed to the operator carrier',
      expect: 'M1.132',
      mutate: (w) => { w.manifest.entries[0].decision_basis.operator_ruled.push('equipment') },
    },
    {
      label: 'NC-UNBOUND-CARRIER: a decision carrier that the manifest never bound by hash',
      expect: 'M2.137',
      mutate: (w) => { w.manifest.entries[2].decision_basis.carrier_for_operator_ruled = 'docs/some-unbound-note.md' },
    },
  ]

  for (const control of controls) {
    const world: World = { manifest: structuredClone(baseline.manifest), sql: baseline.sql }
    control.mutate(world)
    const findings: Finding[] = []
    assertArtifacts(world, findings)
    const targeted = findings.filter((f) => f.name.startsWith(control.expect))
    if (targeted.length === 0) {
      check(`${control.label} -> rejected by ${control.expect}`, false,
        `no assertion named ${control.expect} exists - the control targets a pin that is GONE`)
      continue
    }
    const rejected = targeted.some((f) => !f.ok)
    const collateral = findings.filter((f) => !f.ok && !f.name.startsWith(control.expect)).length
    check(`${control.label} -> rejected by ${control.expect}${collateral > 0 ? ` (and ${collateral} further assertion${collateral === 1 ? '' : 's'})` : ''}`,
      rejected, `${control.expect} still PASSED on the corrupted artifact - that pin is dead`)
  }
}

// ── main ─────────────────────────────────────────────────────────────
function main(): number {
  console.log('W14 — five-entry catalog admission: static verification of the PREPARED package\n')

  for (const p of [MANIFEST_PATH, SQL_PATH, DECISIONS_PATH, GENERATOR_PATH]) {
    if (!existsSync(path.join(repositoryRoot, p))) { console.log(`  FAIL  required artifact missing: ${p}`); return 1 }
  }
  const manifest = JSON.parse(read(MANIFEST_PATH))
  const sql = read(SQL_PATH)
  const baseline: World = { manifest, sql }

  console.log('— The governed artifacts')
  const findings: Finding[] = []
  assertArtifacts(baseline, findings)
  for (const f of findings) check(f.name, f.ok, f.detail)

  console.log('\n— Class-A fields against an independent read of the historical inventory')
  verifyAgainstInventory(manifest)

  console.log('\n— The decision carrier and Correction 1')
  const decisions = read(DECISIONS_PATH)
  const decisionFindings: Finding[] = []
  assertDecisionCarrier(decisions, decisionFindings)
  for (const f of decisionFindings) check(f.name, f.ok, f.detail)

  console.log('\n— Boundaries: migration 028, the unique index, and the change surface')
  verifyBoundaries()

  console.log('\n— Negative controls: every pin must reject the corruption it targets')
  runControls(baseline)
  runDecisionControls(decisions)

  const bytes = readFileSync(path.join(repositoryRoot, SQL_PATH))
  const manifestBytes = readFileSync(path.join(repositoryRoot, MANIFEST_PATH))
  console.log(`\nunder test: ${SQL_PATH} ${bytes.length} B sha256 ${sha256(bytes)}`)
  console.log(`            ${MANIFEST_PATH} ${manifestBytes.length} B sha256 ${sha256(manifestBytes)}`)
  console.log('W14 HOSTED APPLICATION HAS NOT OCCURRED. This verifier reads bytes only: no database, no Supabase, no Vercel.')
  console.log(`\n${passed} passed, ${failed} failed`)
  return failed === 0 ? 0 : 1
}

process.exit(main())
