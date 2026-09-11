// ============================================================
// ForgeFitOS — weight_time W14 five-entry catalog admission GENERATOR.
// Deterministic. LOCAL-ONLY. Contacts no network service of any kind.
//
// Produces, from committed carriers only:
//   docs/weight-time-w14-admission-manifest.json   (machine-readable manifest)
//   docs/weight-time-w14-catalog-admission.sql     (ONE-USE hosted package,
//                                                   PREPARED - NOT EXECUTED)
//
// WHY THIS EXISTS AS A GENERATOR RATHER THAN HAND-WRITTEN FILES
//   The eighteen load_catalog_snapshot arguments per entry come from TWO
//   committed carriers and nowhere else. Deriving them mechanically means a
//   ruling can never silently diverge from the package that implements it,
//   and a corrected ruling is applied by REGENERATING rather than by patching
//   a URL in 61 KB of SQL by hand. Follows the precedent set by
//   scripts/generate-weight-time-w11-ledger.ts.
//
// THE TWO CARRIERS
//   docs/exlib2b-release1-inventory.jsonl
//     Historical planning inventory. READ-ONLY, byte-preserved, never
//     rewritten by this work. Supplies the TEN class-A fields per entry,
//     verbatim, addressed by FILE LINE (the file has four leading comment
//     lines, so record ordinal = file line - 4).
//   docs/weight-time-w14-catalog-field-decisions.md
//     The operator's field decisions. Supplies the EIGHT fields that were
//     absent from the inventory: logical_id, category, provenance,
//     source_url, source_page, retrieved_at, import_confidence, aliases.
//     Its markdown tables are PARSED, not transcribed, so the document is
//     the machine-read carrier and not merely prose alongside one.
//
// SUPERSESSION IS MACHINE-ENFORCED
//   Section 11 (Correction 1) supersedes section 3's four source fields for
//   inventory line 133 only. This generator REQUIRES that shape: section 3's
//   133 rows for the four source fields must be struck through, and section
//   11.3 must supply them. If someone un-supersedes section 3, or deletes
//   section 11, generation FAILS rather than silently emitting the old
//   binding. Every other value in section 11.3 must AGREE with section 3.
//
// NEGATIVE-CONTROL VARIANTS
//   W14_VARIANT names a deliberate single-variable defect and W14_OUT_DIR
//   redirects output, so scripts/verify-weight-time-w14-live.sh can generate
//   its controls through THIS derivation path instead of editing generated
//   SQL with sed. A variant NEVER writes into docs/: the guard below refuses.
//   Variants are diagnostic only and are never committed.
//
// Run from the repository root:
//   npx tsx scripts/generate-weight-time-w14-package.ts
// ============================================================

import path from 'node:path'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

const repositoryRoot = process.cwd()

const INVENTORY_PATH = 'docs/exlib2b-release1-inventory.jsonl'
const DECISIONS_PATH = 'docs/weight-time-w14-catalog-field-decisions.md'
const MANIFEST_OUT = 'docs/weight-time-w14-admission-manifest.json'
const SQL_OUT = 'docs/weight-time-w14-catalog-admission.sql'

const PRODUCTION_BASE_COMMIT = 'a54a30c25b1427aee24d00c37bd6a4aec69dd3d0'
const PRODUCTION_BASE_TREE = 'e4838dea0c2ad66a894969ab1c20982d28a6af29'

/** Manifest order. Fixed, and asserted against the decision document. */
const MANIFEST_ORDER = [132, 133, 137, 138, 139] as const
/** The three deferred carries. Named so the exclusion proof cannot be satisfied by a rename. */
const EXCLUDED_CARRY_LINES = [134, 135, 136] as const
const EXCLUDED_CARRY_NAMES = ["Farmer's carry", 'Suitcase carry', 'Sandbag bear-hug carry'] as const
/** Lower-cased carry names, as the SQL exclusion predicates compare them. */
const CARRY_NORMALIZED = ["farmer's carry", 'suitcase carry', 'sandbag bear-hug carry'] as const

type Provenance = 'external_source_derived' | 'forgefitos_original'
type AnatomyRow = { muscle: string; role: string }

/** One admission entry: ten class-A fields plus eight operator-ruled ones. */
type Entry = {
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
  provenance: Provenance
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
}

/** The eighteen loader parameters, in migration-027 declaration order. */
const LOADER_PARAMETERS = [
  'logical_id', 'canonical_name', 'category', 'primary_muscle', 'equipment',
  'laterality', 'tracking_mode', 'provenance', 'movement_pattern', 'training_role',
  'difficulty', 'availability', 'source_url', 'source_page', 'retrieved_at',
  'import_confidence', 'anatomy', 'aliases',
] as const

/** The four discovery-source fields governed by exercise_catalog_provenance_sources_chk. */
const SOURCE_FIELDS = ['source_url', 'source_page', 'retrieved_at', 'import_confidence'] as const

function fail(message: string): never {
  throw new Error(`W14 GENERATOR REFUSED: ${message}`)
}

function git(...args: string[]): string {
  return execFileSync('git', ['-C', repositoryRoot, ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
}

function gitBlobBytes(relativePath: string): Buffer {
  const listing = git('ls-tree', 'HEAD', '--', relativePath).trim()
  if (listing === '') fail(`${relativePath} is not committed at HEAD; every carrier and binding must be committed before generation`)
  const blobId = listing.split(/\s+/)[2]
  return execFileSync('git', ['-C', repositoryRoot, 'cat-file', 'blob', blobId], { maxBuffer: 64 * 1024 * 1024 })
}

function sha256(data: Buffer | string): string {
  return createHash('sha256').update(data).digest('hex')
}

// ── markdown table parsing ────────────────────────────────────────────
/** A parsed `| field | value | class |` row. `superseded` = struck through with ~~. */
type FieldRow = { field: string; value: string; superseded: boolean }

/** Strips markdown emphasis/code fencing from one table cell and reports strike-through. */
function readCell(cell: string): { text: string; struck: boolean } {
  let text = cell.trim()
  let struck = false
  while (text.startsWith('~~') && text.endsWith('~~') && text.length > 4) {
    struck = true
    text = text.slice(2, -2).trim()
  }
  if (text.startsWith('**') && text.endsWith('**') && text.length > 4) text = text.slice(2, -2).trim()
  if (text.startsWith('`') && text.endsWith('`') && text.length > 1) text = text.slice(1, -1).trim()
  return { text, struck }
}

/** Every `| a | b | … |` row inside a slice of the document, as field/value pairs. */
function parseFieldRows(slice: string): FieldRow[] {
  const rows: FieldRow[] = []
  for (const raw of slice.split('\n')) {
    const line = raw.trim()
    if (!line.startsWith('|') || !line.endsWith('|')) continue
    const cells = line.slice(1, -1).split('|')
    if (cells.length < 2) continue
    const field = readCell(cells[0])
    const value = readCell(cells[1])
    if (field.text === 'field' || /^-+$/.test(field.text.replace(/[\s:]/g, '-'))) continue
    rows.push({ field: field.text, value: value.text, superseded: field.struck || value.struck })
  }
  return rows
}

/** The document text from `heading` up to the next heading at the same-or-shallower level. */
function section(document: string, heading: string): string {
  const start = document.indexOf(heading)
  if (start < 0) fail(`the decision document has no section "${heading}"`)
  const level = heading.match(/^#+/)?.[0].length ?? 2
  const rest = document.slice(start + heading.length)
  const nextHeading = rest.search(new RegExp(`\\n#{1,${level}} `))
  return nextHeading < 0 ? rest : rest.slice(0, nextHeading)
}

// ── the two carriers ──────────────────────────────────────────────────
type InventoryRecord = {
  proposed_canonical_name: string
  normalized_name: string
  primary_muscle: string
  muscle_targets: AnatomyRow[]
  equipment: string
  tracking_mode: string
  laterality: string
  movement_pattern: string
  training_role: string
  difficulty: string
  availability: string
}

/** Reads the historical inventory from the HEAD blob and addresses it by FILE LINE. */
function readInventory(): Map<number, InventoryRecord> {
  const bytes = gitBlobBytes(INVENTORY_PATH)
  const worktree = readFileSync(path.join(repositoryRoot, INVENTORY_PATH))
  if (!bytes.equals(worktree)) fail(`${INVENTORY_PATH} differs between HEAD and the working tree; it is historical approval evidence and must be byte-identical`)
  const lines = bytes.toString('utf8').split('\n')
  const byFileLine = new Map<number, InventoryRecord>()
  for (const fileLine of MANIFEST_ORDER) {
    const raw = lines[fileLine - 1]
    if (raw === undefined || raw.trim() === '') fail(`${INVENTORY_PATH} has no record at file line ${fileLine}`)
    byFileLine.set(fileLine, JSON.parse(raw) as InventoryRecord)
  }
  return byFileLine
}

/** Operator-ruled fields for one entry, resolved across sections 3, 6, 7 and 11. */
type Ruling = {
  logical_id: string
  category: string
  provenance: Provenance
  aliases: string[]
  source_url: string | null
  source_page: string | null
  retrieved_at: string | null
  import_confidence: string | null
}

function readRulings(): { rulings: Map<number, Ruling>; documentBytes: Buffer } {
  const documentBytes = gitBlobBytes(DECISIONS_PATH)
  const worktree = readFileSync(path.join(repositoryRoot, DECISIONS_PATH))
  if (!documentBytes.equals(worktree)) fail(`${DECISIONS_PATH} differs between HEAD and the working tree; commit the decision correction before regenerating, so the generated package is derived from a COMMITTED carrier`)
  const document = documentBytes.toString('utf8')

  // Section 7 — the frozen UUID allocation, keyed by inventory line.
  const uuidByLine = new Map<number, string>()
  for (const raw of section(document, '## 7. Deterministic logical identity allocation').split('\n')) {
    const match = raw.trim().match(/^\|\s*(\d{3})\s*\|[^|]*\|\s*`([0-9a-f-]{36})`\s*\|$/)
    if (match) uuidByLine.set(Number(match[1]), match[2])
  }

  // Section 6 — the category ruling, held independently of the per-entry tables
  // so a disagreement between the two is a refusal rather than a silent pick.
  const categoryByLine = new Map<number, string>()
  for (const raw of section(document, '## 6. Category ruling').split('\n')) {
    const match = raw.trim().match(/^\|\s*(\d{3})\s*\|\s*`(\w+)`\s*\|$/)
    if (match) categoryByLine.set(Number(match[1]), match[2])
  }

  // Section 11.3 — authoritative for line 133's four source fields.
  const correction = new Map<string, FieldRow>()
  for (const row of parseFieldRows(section(document, '### 11.3 Final 133 binding — authoritative'))) {
    if (row.superseded) fail(`section 11.3 marks "${row.field}" superseded; 11.3 is authoritative and may not itself be struck through`)
    correction.set(row.field, row)
  }
  for (const field of SOURCE_FIELDS) {
    if (!correction.has(field)) fail(`section 11.3 does not supply "${field}", which it must, being authoritative for line 133's source binding`)
  }

  const rulings = new Map<number, Ruling>()
  for (const fileLine of MANIFEST_ORDER) {
    const heading = `### ${fileLine} — `
    const rows = new Map<string, FieldRow>()
    for (const row of parseFieldRows(section(document, heading))) rows.set(row.field, row)

    const take = (field: string): string => {
      const authoritative = fileLine === 133 && (SOURCE_FIELDS as readonly string[]).includes(field)
      if (authoritative) {
        const superseded = rows.get(field)
        if (!superseded) fail(`section 3's entry ${fileLine} has no "${field}" row`)
        if (!superseded.superseded) fail(`line 133's "${field}" in section 3 is NOT marked superseded, but section 11 corrects it. Refusing rather than choosing between two live bindings: strike the section-3 row or remove section 11.`)
        return correction.get(field)!.value
      }
      const row = rows.get(field)
      if (!row) fail(`section 3's entry ${fileLine} has no "${field}" row`)
      if (row.superseded) fail(`section 3's entry ${fileLine} marks "${field}" superseded, but nothing supersedes it`)
      return row.value
    }

    const category = take('category')
    if (categoryByLine.get(fileLine) !== category) fail(`entry ${fileLine}: section 6 rules category "${categoryByLine.get(fileLine)}" but section 3 says "${category}"`)
    const provenance = take('provenance') as Provenance
    if (provenance !== 'external_source_derived' && provenance !== 'forgefitos_original') fail(`entry ${fileLine}: provenance "${provenance}" is neither external_source_derived nor forgefitos_original`)
    const aliasesText = take('aliases')
    if (aliasesText !== '[]') fail(`entry ${fileLine}: aliases is "${aliasesText}"; section 5 rules exactly [] for all five, and no alias may be invented`)

    // Section 11.3 restates category/provenance/aliases for 133. They must AGREE
    // with section 3 — the correction changes the source binding and nothing else.
    if (fileLine === 133) {
      for (const [field, value] of [['category', category], ['provenance', provenance], ['aliases', aliasesText]] as const) {
        const restated = correction.get(field)
        if (restated && restated.value !== value) fail(`section 11.3 restates ${field} as "${restated.value}" but section 3 rules "${value}"; Correction 1 changes only line 133's source binding`)
      }
    }

    const uuid = uuidByLine.get(fileLine)
    if (!uuid) fail(`section 7 allocates no logical identity for entry ${fileLine}`)

    const sourceValues = SOURCE_FIELDS.map((field) => {
      const value = take(field)
      return value === 'NULL' ? null : value
    })
    rulings.set(fileLine, {
      logical_id: uuid,
      category,
      provenance,
      aliases: [],
      source_url: sourceValues[0],
      source_page: sourceValues[1],
      retrieved_at: sourceValues[2],
      import_confidence: sourceValues[3],
    })
  }
  return { rulings, documentBytes }
}

// ── payload fingerprint ───────────────────────────────────────────────
/**
 * Canonical form: the eighteen loader arguments in migration-027 declaration
 * order, each rendered `p_<name>=<value>\n`. NULL renders as `\N`. Anatomy and
 * aliases render as FULLY COMPACT JSON (no spaces), keys sorted, anatomy rows
 * ordered by (muscle, role).
 *
 * The SQL call sites deliberately emit the SPACED jsonb literal instead — it is
 * easier to read in review and PostgreSQL normalizes jsonb on input either way.
 * The two renderings are therefore NOT interchangeable: the fingerprint is
 * defined over the compact form only. Do not "unify" them.
 */
function payloadCanonicalForm(entry: Omit<Entry, 'payload_fingerprint_sha256'>): string {
  let form = ''
  for (const parameter of LOADER_PARAMETERS) {
    const value = (entry as Record<string, unknown>)[parameter]
    let rendered: string
    if (value === null || value === undefined) rendered = '\\N'
    else if (parameter === 'anatomy') rendered = compactAnatomy(value as AnatomyRow[])
    else if (parameter === 'aliases') rendered = JSON.stringify(value)
    else rendered = String(value)
    form += `p_${parameter}=${rendered}\n`
  }
  return form
}

function compactAnatomy(rows: AnatomyRow[]): string {
  const ordered = [...rows].sort((a, b) => (a.muscle === b.muscle ? a.role.localeCompare(b.role) : a.muscle.localeCompare(b.muscle)))
  return JSON.stringify(ordered.map((row) => ({ muscle: row.muscle, role: row.role })))
}

/** The spaced jsonb rendering used at the SQL call sites (see payloadCanonicalForm). */
function spacedAnatomy(rows: AnatomyRow[]): string {
  const ordered = [...rows].sort((a, b) => (a.muscle === b.muscle ? a.role.localeCompare(b.role) : a.muscle.localeCompare(b.muscle)))
  return `[${ordered.map((row) => `{"muscle": "${row.muscle}", "role": "${row.role}"}`).join(', ')}]`
}

// ── entry assembly ────────────────────────────────────────────────────
function buildEntries(): { entries: Entry[]; decisionDocumentBytes: Buffer } {
  const inventory = readInventory()
  const { rulings, documentBytes } = readRulings()
  const entries: Entry[] = []
  for (const fileLine of MANIFEST_ORDER) {
    const record = inventory.get(fileLine)!
    const ruling = rulings.get(fileLine)!
    if (record.tracking_mode !== 'weight_time') fail(`inventory line ${fileLine} has tracking_mode "${record.tracking_mode}"; every W14 entry must be weight_time`)
    if (record.laterality !== 'bilateral') fail(`inventory line ${fileLine} has laterality "${record.laterality}"; all five W14 entries are bilateral`)
    const withoutFingerprint = {
      inventory_file_line: fileLine,
      inventory_record_ordinal: fileLine - 4,
      normalized_name: record.normalized_name,
      logical_id: ruling.logical_id,
      canonical_name: record.proposed_canonical_name,
      category: ruling.category,
      primary_muscle: record.primary_muscle,
      equipment: record.equipment,
      laterality: record.laterality,
      tracking_mode: record.tracking_mode,
      provenance: ruling.provenance,
      movement_pattern: record.movement_pattern,
      training_role: record.training_role,
      difficulty: record.difficulty,
      availability: record.availability,
      source_url: ruling.source_url,
      source_page: ruling.source_page,
      retrieved_at: ruling.retrieved_at,
      import_confidence: ruling.import_confidence,
      anatomy: record.muscle_targets,
      aliases: ruling.aliases,
    }
    entries.push({ ...withoutFingerprint, payload_fingerprint_sha256: sha256(payloadCanonicalForm(withoutFingerprint)) })
  }
  return { entries, decisionDocumentBytes: documentBytes }
}

// ── negative-control variants (diagnostic; never committed) ────────────
const VARIANTS: Record<string, { note: string; apply: (entries: Entry[]) => void }> = {
  identity: {
    // Not a defect: the no-op variant, used to prove determinism. It writes the
    // governed bytes to a scratch directory, banner and all suppressed, so a
    // verifier can diff them against docs/ without writing into docs/ itself.
    note: 'no mutation — the governed package, emitted to a scratch path to prove regeneration is byte-deterministic.',
    apply: () => {},
  },
  same_url_133: {
    note: 'line 133 given line 132\'s source_url — the superseded first ruling. MUST fail closed on exercise_catalog_source_url_version_unique_idx.',
    apply: (entries) => { entries[1].source_url = entries[0].source_url },
  },
  distinct_url_133: {
    note: 'line 133 given a synthetic distinct source_url. Isolates the shared-URL variable; expected to SUCCEED.',
    apply: (entries) => { entries[1].source_url = 'https://example.invalid/w14-probe-distinct-url/' },
  },
  forgefitos_133: {
    note: 'line 133 reclassified forgefitos_original with four NULLs. Isolates the provenance variable; expected to SUCCEED but VIOLATES the operator ruling and must never be committed.',
    apply: (entries) => {
      entries[1].provenance = 'forgefitos_original'
      entries[1].source_url = null; entries[1].source_page = null
      entries[1].retrieved_at = null; entries[1].import_confidence = null
    },
  },
  null_source_on_external: {
    note: 'line 132 keeps external_source_derived but loses source_url. MUST fail closed on exercise_catalog_provenance_sources_chk.',
    apply: (entries) => { entries[0].source_url = null },
  },
  source_on_forgefitos: {
    note: 'line 137 keeps forgefitos_original but gains source metadata. MUST fail closed on exercise_catalog_provenance_sources_chk.',
    apply: (entries) => {
      entries[2].source_url = 'https://example.invalid/w14-control-fabricated/'
      entries[2].source_page = 'https://example.invalid/w14-control-fabricated/'
      entries[2].retrieved_at = '2026-08-24'
      entries[2].import_confidence = 'human_review_required'
    },
  },
  bad_category: {
    note: 'line 138 given a category outside the migration-023 vocabulary. MUST fail closed on exercise_catalog_category_check.',
    apply: (entries) => { entries[3].category = 'w14_control_not_a_category' },
  },
  substitute_uuid: {
    note: 'line 139 given an identity outside the frozen allocation. The static verifier must reject it; the live run still lands five, so this control is about the STATIC oracle.',
    apply: (entries) => { entries[4].logical_id = 'e21b2c00-0000-4000-a000-0000000000ff' },
  },
  extra_identity: {
    note: 'a SIXTH entry appended (a duplicate of 139 under a new identity and name). MUST fail closed on the exact-five delta postconditions.',
    apply: (entries) => {
      const sixth: Entry = { ...entries[4], inventory_file_line: 140, inventory_record_ordinal: 136, logical_id: 'e21b2c00-0000-4000-a000-0000000000f6', canonical_name: 'W14 control sixth entry', normalized_name: 'w14 control sixth entry' }
      entries.push(sixth)
    },
  },
  admit_a_carry: {
    note: 'a deferred carry (inventory line 134) admitted as a sixth entry. MUST fail closed — on the delta postconditions and, independently, on the named carry-exclusion predicate.',
    apply: (entries) => {
      const carry: Entry = { ...entries[3], inventory_file_line: 134, inventory_record_ordinal: 130, logical_id: 'e21b2c00-0000-4000-a000-0000000000f4', canonical_name: "Farmer's carry", normalized_name: "farmer's carry", equipment: 'dumbbell', movement_pattern: 'carry' }
      entries.push(carry)
    },
  },
}

/** Sabotage applied to generated SQL text, not to the entry set. */
const SQL_SABOTAGE: Record<string, { note: string; apply: (sql: string) => string }> = {
  sabotage_last_postcondition: {
    note: 'the FINAL postcondition is made unsatisfiable. Proves the whole transaction rolls back: no W14 identity or snapshot may remain.',
    apply: (sql) => {
      const anchor = "  IF has_function_privilege('anon', 'public.load_catalog_identity(uuid)', 'EXECUTE')"
      if (!sql.includes(anchor)) fail('sabotage anchor (the final postcondition) not found in the generated SQL')
      return sql.replace(anchor, "  IF true -- W14 CONTROL: unsatisfiable final postcondition\n     OR has_function_privilege('anon', 'public.load_catalog_identity(uuid)', 'EXECUTE')")
    },
  },
}

// ── SQL emission ──────────────────────────────────────────────────────
/**
 * A SQL single-quoted literal. JavaScript's JSON.stringify and template
 * interpolation both happily emit a double-quoted string, which PostgreSQL
 * reads as an IDENTIFIER, not a literal — "Farmer's carry" is exactly such a
 * value. Every literal carrying user text goes through here.
 */
function sqlLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`
}

/** A dollar-quoted literal; tags are unique per call site so nesting is impossible. */
function dollarQuoted(tag: string, value: string): string {
  if (value.includes(`$${tag}$`)) fail(`dollar-quote tag ${tag} collides with the value it must wrap`)
  return `$${tag}$${value}$${tag}$`
}

const CATALOG_TABLES = [
  'exercise_catalog', 'exercise_catalog_aliases', 'exercise_catalog_content',
  'exercise_catalog_content_expected_relationships', 'exercise_catalog_corrections',
  'exercise_catalog_import_runs', 'exercise_catalog_logical',
  'exercise_catalog_muscles', 'exercise_catalog_name_claims',
  'exercise_catalog_relationships', 'exercise_catalog_review_events',
  'exercise_catalog_run_items',
]

/** The artifacts this package is valid only against. Bound by bytes and SHA-256. */
const BOUND_ARTIFACTS = [
  INVENTORY_PATH,
  'docs/exlib2b-release1-coverage-matrix.md',
  'docs/weight-time-coordinated-implementation-plan.md',
  'docs/exlib1a-discovery-manifest.jsonl',
  'docs/exlib1c0a-equipment-resolution.jsonl',
  DECISIONS_PATH,
  'docs/exlib2k-plank-catalog-load-package.sql',
  'supabase/migrations/023_exlib_catalog_and_delivery_contract.sql',
  'supabase/migrations/025_exlib_equipment_vocabulary_support.sql',
  'supabase/migrations/027_exlib_catalog_content_schema.sql',
  'supabase/migrations/028_weight_time_tracking_mode.sql',
]

type Binding = { path: string; bytes: number; sha256: string }

function bindArtifacts(): Binding[] {
  return BOUND_ARTIFACTS.map((relativePath) => {
    const bytes = gitBlobBytes(relativePath)
    return { path: relativePath, bytes: bytes.length, sha256: sha256(bytes) }
  })
}

function buildSql(entries: Entry[], bindings: Binding[], variantNote: string | null): string {
  const uuids = entries.map((entry) => entry.logical_id)
  const uuidListIndented = uuids.map((uuid) => `'${uuid}'`).join(',\n    ')
  const uuidListInline = uuids.map((uuid) => `'${uuid}'`).join(', ')
  const externalCount = entries.filter((entry) => entry.provenance === 'external_source_derived').length
  const originalCount = entries.length - externalCount

  const deltas: Array<[string, string, number]> = [
    ['n_logical', 'exercise_catalog_logical', 5],
    ['n_catalog', 'exercise_catalog', 5],
    ['n_muscles', 'exercise_catalog_muscles', 5],
    ['n_aliases', 'exercise_catalog_aliases', 0],
    ['n_claims', 'exercise_catalog_name_claims', 5],
    ['n_content', 'exercise_catalog_content', 0],
    ['n_expected', 'exercise_catalog_content_expected_relationships', 0],
    ['n_relationship', 'exercise_catalog_relationships', 0],
    ['n_runs', 'exercise_catalog_import_runs', 0],
    ['n_runitems', 'exercise_catalog_run_items', 0],
    ['n_reviewev', 'exercise_catalog_review_events', 0],
    ['n_correct', 'exercise_catalog_corrections', 0],
    ['n_tenant_ex', 'exercises', 0],
    ['n_tenant_alias', 'exercise_aliases', 0],
  ]

  const surfaceDigest = `md5(
      (SELECT coalesce(string_agg(s::text, '|' ORDER BY s.id), '-')
         FROM public.exercise_catalog s
        WHERE s.logical_id NOT IN (${uuidListInline}))
   || (SELECT coalesce(string_agg(m::text, '|' ORDER BY m.catalog_id, m.muscle), '-')
         FROM public.exercise_catalog_muscles m
        WHERE NOT EXISTS (SELECT 1 FROM public.exercise_catalog s
                           WHERE s.id = m.catalog_id
                             AND s.logical_id IN (${uuidListInline})))
   || (SELECT coalesce(string_agg(a::text, '|' ORDER BY a.logical_id, a.alias), '-')
         FROM public.exercise_catalog_aliases a
        WHERE a.logical_id NOT IN (${uuidListInline}))
   || (SELECT coalesce(string_agg(n::text, '|' ORDER BY n.normalized_name), '-')
         FROM public.exercise_catalog_name_claims n
        WHERE n.logical_id NOT IN (${uuidListInline}))
   || (SELECT coalesce(string_agg(l::text, '|' ORDER BY l.id), '-')
         FROM public.exercise_catalog_logical l
        WHERE l.id NOT IN (${uuidListInline})))`
  const contentDigest = `md5(
      (SELECT coalesce(string_agg(c::text, '|' ORDER BY c.id), '-')
         FROM public.exercise_catalog_content c)
   || (SELECT coalesce(string_agg(x::text, '|' ORDER BY x.content_id, x.relation, x.to_logical_id), '-')
         FROM public.exercise_catalog_content_expected_relationships x)
   || (SELECT coalesce(string_agg(v::text, '|' ORDER BY v.id), '-')
         FROM public.exercise_catalog_review_events v))`
  const tenantDigest = `md5(
      (SELECT coalesce(string_agg(t::text, '|' ORDER BY t.id), '-')
         FROM public.exercises t)
   || (SELECT coalesce(string_agg(a::text, '|' ORDER BY a.id), '-')
         FROM public.exercise_aliases a))`

  // ── snapshot call sites ──────────────────────────────────────────
  const calls = entries.map((entry) => {
    const n = entry.inventory_file_line
    // The governed shapes are all-four-present (external) or all-four-NULL
    // (forgefitos). The branch keys on the VALUES, not on the provenance label,
    // so a control that decouples the two still emits valid SQL and is refused
    // by the database constraint rather than by the generator.
    const allFourNull = SOURCE_FIELDS.every((field) => entry[field] === null)
    const sourceBlock = allFourNull
      ? '  NULL, NULL, NULL, NULL,   -- forgefitos_original: all four discovery-source fields NULL,\n' +
        '                            -- as exercise_catalog_provenance_sources_chk requires'
      : `  ${entry.source_url === null ? 'NULL' : dollarQuoted(`su${n}`, entry.source_url)},\n` +
        `  ${entry.source_page === null ? 'NULL' : dollarQuoted(`sp${n}`, entry.source_page)},\n` +
        `  ${entry.retrieved_at === null ? 'NULL' : `${dollarQuoted(`ra${n}`, entry.retrieved_at)}::date`},\n` +
        `  ${entry.import_confidence === null ? 'NULL' : dollarQuoted(`ic${n}`, entry.import_confidence)},`
    return `-- inventory line ${n} — ${entry.canonical_name}
--   payload fingerprint ${entry.payload_fingerprint_sha256}
SELECT public.load_catalog_snapshot(
  '${entry.logical_id}',
  ${dollarQuoted(`nm${n}`, entry.canonical_name)},
  ${dollarQuoted(`cat${n}`, entry.category)},
  ${dollarQuoted(`pm${n}`, entry.primary_muscle)},
  ${dollarQuoted(`eq${n}`, entry.equipment)},
  ${dollarQuoted(`lat${n}`, entry.laterality)},
  ${dollarQuoted(`tm${n}`, entry.tracking_mode)},
  ${dollarQuoted(`prov${n}`, entry.provenance)},
  ${dollarQuoted(`mp${n}`, entry.movement_pattern)},
  ${dollarQuoted(`tr${n}`, entry.training_role)},
  ${dollarQuoted(`dif${n}`, entry.difficulty)},
  ${dollarQuoted(`av${n}`, entry.availability)},
${sourceBlock}
  ${dollarQuoted(`anat${n}`, spacedAnatomy(entry.anatomy))}::jsonb,
  ${dollarQuoted(`alia${n}`, JSON.stringify(entry.aliases))}::jsonb);`
  })

  // ── per-entry postconditions ─────────────────────────────────────
  const posts = entries.map((entry) => {
    const n = entry.inventory_file_line
    const allFourNull = SOURCE_FIELDS.every((field) => entry[field] === null)
    const sourcePredicate = allFourNull
      ? '       AND s.source_url IS NULL AND s.source_page IS NULL\n' +
        '       AND s.retrieved_at IS NULL AND s.import_confidence IS NULL'
      : `       AND ${entry.source_url === null ? 's.source_url IS NULL' : `s.source_url = ${dollarQuoted(`su2${n}`, entry.source_url)}`}\n` +
        `       AND ${entry.source_page === null ? 's.source_page IS NULL' : `s.source_page = ${dollarQuoted(`sp2${n}`, entry.source_page)}`}\n` +
        `       AND ${entry.retrieved_at === null ? 's.retrieved_at IS NULL' : `s.retrieved_at = ${dollarQuoted(`ra2${n}`, entry.retrieved_at)}::date`}\n` +
        `       AND ${entry.import_confidence === null ? 's.import_confidence IS NULL' : `s.import_confidence = ${dollarQuoted(`ic2${n}`, entry.import_confidence)}`}`
    const anatomyPairs = [...entry.anatomy].sort((a, b) => a.muscle.localeCompare(b.muscle)).map((row) => `${row.muscle}:${row.role}`).join(',')
    return `  -- ── inventory line ${n} — ${entry.canonical_name} ──────────────────
  IF NOT EXISTS (
    SELECT 1 FROM public.exercise_catalog s
     WHERE s.logical_id = '${entry.logical_id}'
       AND s.canonical_name = ${dollarQuoted(`nm2${n}`, entry.canonical_name)}
       AND s.category = ${dollarQuoted(`cat2${n}`, entry.category)}
       AND s.primary_muscle = ${dollarQuoted(`pm2${n}`, entry.primary_muscle)}
       AND s.equipment = ${dollarQuoted(`eq2${n}`, entry.equipment)}
       AND s.laterality = ${dollarQuoted(`lat2${n}`, entry.laterality)}
       AND s.tracking_mode = ${dollarQuoted(`tm2${n}`, entry.tracking_mode)}
       AND s.provenance = ${dollarQuoted(`prov2${n}`, entry.provenance)}
       AND s.movement_pattern = ${dollarQuoted(`mp2${n}`, entry.movement_pattern)}
       AND s.training_role = ${dollarQuoted(`tr2${n}`, entry.training_role)}
       AND s.difficulty = ${dollarQuoted(`dif2${n}`, entry.difficulty)}
       AND s.availability = ${dollarQuoted(`av2${n}`, entry.availability)}
${sourcePredicate}
       AND s.review_status = 'pending'
       AND s.reviewed_by IS NULL AND s.reviewed_at IS NULL
       AND s.review_rationale IS NULL
       AND s.catalog_version = 1 AND s.is_active) THEN
    RAISE EXCEPTION 'w14 post: inventory line ${n} (${entry.canonical_name}) did not land with the exact governed payload (fingerprint ${entry.payload_fingerprint_sha256})';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog s
       WHERE s.logical_id = '${entry.logical_id}') <> 1 THEN
    RAISE EXCEPTION 'w14 post: inventory line ${n} does not bear EXACTLY ONE snapshot';
  END IF;
  IF (SELECT coalesce(string_agg(m.muscle || ':' || m.role, ',' ORDER BY m.muscle), '<none>')
        FROM public.exercise_catalog_muscles m
        JOIN public.exercise_catalog s ON s.id = m.catalog_id
       WHERE s.logical_id = '${entry.logical_id}') <> ${dollarQuoted(`an2${n}`, anatomyPairs)} THEN
    RAISE EXCEPTION 'w14 post: inventory line ${n} anatomy is not exactly ${anatomyPairs}';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.exercise_catalog_name_claims c
     WHERE c.normalized_name = ${dollarQuoted(`nn2${n}`, entry.normalized_name)}
       AND c.claim_source = 'canonical'
       AND c.logical_id = '${entry.logical_id}') THEN
    RAISE EXCEPTION 'w14 post: the canonical name claim "${entry.normalized_name}" is missing or owned by the wrong identity';
  END IF;`
  })

  const deltaColumns = deltas.map(([column]) => `${column} BIGINT NOT NULL`).join(',\n  ')
  const deltaSelect = deltas.map(([, table]) => `(SELECT count(*) FROM public.${table})`).join(',\n    ')
  const deltaChecks = deltas.map(([column, table, expected]) => `  IF (SELECT count(*) FROM public.${table}) - (SELECT p.${column} FROM w14_txn_pre p) <> ${expected} THEN
    RAISE EXCEPTION 'w14 post: the ${table} row delta is not exactly ${expected} (pre %, post %)',
      (SELECT p.${column} FROM w14_txn_pre p), (SELECT count(*) FROM public.${table});
  END IF;`).join('\n')

  const bindingLines = bindings.map((binding) => `--   - ${binding.path}\n--     ${binding.bytes.toLocaleString('en-US')} bytes, SHA-256\n--     ${binding.sha256}`).join('\n')
  const scopeLines = entries.map((entry) => `--   ${entry.inventory_file_line}  ${(entry.canonical_name + ' ').padEnd(28, '.')} ${entry.logical_id}`).join('\n')
  const variantBanner = variantNote === null ? '' : `-- ############################################################
-- ## DIAGNOSTIC NEGATIVE-CONTROL VARIANT — NOT THE GOVERNED PACKAGE
-- ## ${variantNote}
-- ## Generated to a scratch directory by
-- ## scripts/generate-weight-time-w14-package.ts. Never committed,
-- ## never applied anywhere but a disposable local cluster.
-- ############################################################

`

  const sql = `${variantBanner}-- ============================================================
-- WEIGHT_TIME W14 FIVE-ENTRY CATALOG ADMISSION PACKAGE
-- ${SQL_OUT}
-- STATUS: PREPARED - NOT EXECUTED
--
-- GENERATED FILE. Do not edit by hand - regenerate:
--   npx tsx scripts/generate-weight-time-w14-package.ts
-- Every value below is derived from two committed carriers: the
-- historical release-1 inventory (ten class-A fields per entry, read
-- verbatim at the named FILE LINE) and the operator's field decisions
-- (the eight fields the inventory never held). A hand edit here would
-- break that derivation silently; scripts/verify-weight-time-w14.ts
-- recomputes it and fails if this file and the manifest disagree.
--
-- This package is a reviewable, deterministic, ONE-USE SQL load of
-- EXACTLY FIVE weight_time catalog identities and their five canonical
-- snapshots. It lives under docs/, NOT under supabase/migrations/, and
-- has NOT been executed against any hosted or persistent database. It
-- has also never been executed against the operator's local hosted
-- session: the only execution it has ever received is on a disposable
-- initdb cluster created and destroyed by
-- scripts/verify-weight-time-w14-live.sh.
--
-- Its only eventual target is the ShredOS Supabase project
-- ttybyljytiwntvorugcv, and ONLY under a later explicit one-use
-- operator instruction through the authorized Joseph/ChatGPT path.
-- Claude never executes it against hosted, and Claude has made no
-- hosted Supabase contact, no Supabase CLI invocation, and no Vercel
-- contact while preparing it.
--
-- SCOPE - EXACTLY FIVE, IN THIS ORDER (inventory file line -> identity):
${scopeLines}
-- DELIBERATELY EXCLUDED - the three carries remain DEFERRED and are
-- not admitted, not renamed, not reinterpreted, and given no tracking
-- mode by this package: inventory lines 134 (Farmer's carry), 135
-- (Suitcase carry), 136 (Sandbag bear-hug carry). Carry tracking is a
-- separate, later product decision. The postconditions below prove
-- fail-closed that none of the three landed.
--
-- BINDINGS (this package is valid only against exactly these bytes):
${bindingLines}
--   Any byte change to a bound artifact voids this package.
--   scripts/verify-weight-time-w14.ts recomputes the manifest bindings
--   and proves this file consumes the manifest's exact values.
--
-- STRUCTURAL PREREQUISITE: migration 028 must already be applied, or
-- exercise_catalog_tracking_mode_check rejects 'weight_time' and all
-- five loads fail. 028 was applied to hosted ShredOS under W13-A
-- (operator-executed; hosted history version 20260911034422). This
-- package neither modifies nor re-applies it; the preflight only
-- OBSERVES that the literal is admitted, and refuses otherwise.
--
-- AUTHORITY: uses ONLY migration-027's loader authority
-- (exlib_catalog_loader) through exactly TWO of its approved loader
-- functions - load_catalog_identity and load_catalog_snapshot - both
-- SCHEMA-QUALIFIED at every call site, so the verified function is the
-- invoked function regardless of search_path. It issues NO INSERT,
-- UPDATE or DELETE against any catalog table: every write goes through
-- the loader boundary.
--   DELIBERATELY NOT CALLED, anywhere in this file:
--     load_catalog_content_draft ..... no prose content version
--     apply_content_review ........... no review transition
--     admit_catalog_content .......... no import_admitted mutation
--     publish_catalog_content ........ no publication
--     deliver_catalog_exercises ...... no tenant delivery
--     exlib_content_admission_manifest / _fingerprint
--                                      no admission evidence
-- Loading is not approval. The five snapshots land born-pending and
-- born-active, exactly as migration 027's carried freeze trigger
-- guarantees; database review, admission, publication and delivery all
-- remain separately gated authorities that this package does not touch.
--
-- DETERMINISTIC PREDECLARED IDENTIFIERS: the five UUIDs above are
-- allocated in docs/weight-time-w14-catalog-field-decisions.md section
-- 7 and frozen there. They continue the committed e21b2c00-0000-4000-
-- a000-0000000000NN family (…0001 Plank, …0002 Dead bug, …0003 Ab
-- wheel rollout) at the next free block, …0004 through …0008. No
-- runtime-random UUID is used: load_catalog_identity takes the
-- identity explicitly, so every logical identity is knowable, and
-- reviewable, BEFORE the hosted act.
--
-- FIELD DERIVATION: ten of the eighteen loader arguments per entry are
-- read verbatim from the historical release-1 inventory record at the
-- named file line (canonical_name, primary_muscle, equipment,
-- laterality, tracking_mode, movement_pattern, training_role,
-- difficulty, availability, anatomy). The remaining eight -
-- logical_id, category, provenance, source_url, source_page,
-- retrieved_at, import_confidence, aliases - were ABSENT from that
-- inventory and are carried by the operator's field decisions in
-- docs/weight-time-w14-catalog-field-decisions.md. Nothing here is
-- guessed, and no value is derived from general knowledge.
--
-- MIXED PROVENANCE IS INTENTIONAL: 132 and 133 are
-- external_source_derived and carry all four discovery-source fields;
-- 137, 138 and 139 are forgefitos_original and carry all four as NULL.
-- exercise_catalog_provenance_sources_chk enforces exactly that split
-- in both directions, and exercise_catalog_discovery_metadata_chk
-- additionally requires the four discovery-taxonomy fields on every
-- forgefitos_original row. Do not normalize the five to one
-- provenance value; the postconditions assert the split per entry.
--
-- TWO EXTERNAL ROWS, TWO DISTINCT SOURCE URLS (Correction 1): 132 and
-- 133 are both external_source_derived and their source_url values
-- MUST DIFFER. An earlier ruling bound both to one URL; disposable
-- execution proved that impossible, because
-- exercise_catalog_source_url_version_unique_idx (migration 023) is a
-- NON-PARTIAL unique index on (source_url, catalog_version) and
-- load_catalog_snapshot's INSERT omits catalog_version, so every new
-- snapshot is born at the DEFAULT of 1. 133 therefore binds to the
-- second real external evidence record already committed in
-- docs/exlib1c0a-equipment-resolution.jsonl (resolution
-- exlib1c0a-eq-02, independent_evidence). No provenance was changed to
-- satisfy the index, and the index is NOT relaxed, dropped or
-- partialized by this package or by any migration. A negative control
-- in scripts/verify-weight-time-w14-live.sh restores the shared URL
-- and proves this package fails closed on that index, leaving zero
-- partial W14 state.
--
-- NON-EMPTY BASELINE, MEASURED AS DELTAS (a deliberate deviation from
-- the EXLIB-2K precedent, disclosed for review): 2K could demand a
-- completely EMPTY catalog surface, because it was the first load. W14
-- cannot. The hosted catalog is already non-empty, and its exact
-- current row vector is not something the preparer of this package
-- has - or is permitted to obtain. So instead of pinning absolute
-- counts, this package captures the pre-state INSIDE the transaction
-- and asserts EXACT DELTAS. That is strictly stronger about
-- non-interference than an absolute vector would be: it proves this
-- transaction added exactly five identities, five snapshots, five
-- anatomy rows, five canonical name claims and NOTHING else, whatever
-- the baseline happened to be. It also holds two whole-surface md5
-- digests - the catalog surface OUTSIDE the five identities, and the
-- content/review surface - and requires both to be byte-identical
-- before and after.
--   The transaction runs at REPEATABLE READ so that "pre" and "post"
--   are the same MVCC snapshot plus this transaction's own effects.
--   Without it, a concurrent commit by an unrelated writer could shift
--   a delta and either mask an error or abort a correct run. System
--   catalogs are read with a fresh snapshot regardless, so the
--   authority-posture gates below still see current reality.
--
-- ONE-USE / RERUN BEHAVIOR: the preflight refuses, before any write,
-- in four distinct classes, each with its own message:
--   W14-PRE-STRUCT   a structural prerequisite is missing (loader
--                    functions, loader role, 028's tracking_mode
--                    literal, 025's equipment literals, 027's
--                    provenance/discovery constraints)
--   W14-PRE-TARGET   one of the five logical identities already exists
--   W14-PRE-SNAPSHOT a snapshot already exists for one of the five
--   W14-PRE-NAME     the canonical name, or its normalized claim, is
--                    already claimed by any identity
-- A SECOND EXECUTION THEREFORE FAILS CLOSED at W14-PRE-TARGET and is
-- NOT a normal success. The package is deliberately not made
-- "idempotent" by silently accepting a pre-existing target: an
-- unexpected target is an error, not a no-op, because it could equally
-- be someone else's identity, a partial state, or a different payload.
-- After ONE successful COMMIT this package is SPENT.
--   If a future execution's transport or result is ambiguous - a
--   dropped connection, an unreadable error, a timeout - READ STATE
--   FIRST and never blindly re-run. The five identities either exist
--   with the five governed payloads, or they do not exist at all;
--   there is no partial outcome to repair.
--
-- HOSTED AUTHORITY POSTURE: on hosted, current_user = session_user =
-- postgres; postgres is NOT a superuser; and migration 027's CREATE
-- ROLE left postgres the implicit creator membership in
-- exlib_catalog_loader - grantor supabase_admin, ADMIN TRUE, INHERIT
-- FALSE, SET FALSE. SET ROLE requires the SET option, so this package
-- uses the same TRANSACTION-CONTAINED elevation the 2K package
-- established: prove the exact baseline posture before any write,
-- grant WITH SET TRUE / INHERIT FALSE, prove the resulting two-grantor
-- shape BEFORE SET ROLE, load, RESET ROLE, REVOKE ... GRANTED BY
-- postgres, then postcondition-prove the baseline row - grantor
-- included - is exactly what remains. Role membership changes are
-- transactional, so a failure anywhere rolls back both the data and
-- the authority change. No standing privilege is widened by success or
-- by failure.
--
-- ATOMICITY: ONE explicit transaction encloses every statement. Any
-- preflight refusal, loader exception, constraint violation, or
-- postcondition mismatch - including the LAST postcondition in the
-- file - rolls back the WHOLE package, leaving no identity, no
-- snapshot, no anatomy row and no name claim behind.
-- ============================================================

BEGIN;

-- ── Snapshot discipline (see NON-EMPTY BASELINE above) ────────────
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;

-- ── Fresh-state gate serialization ───────────────────────────────
-- Two concurrent executions must never both observe an absent target
-- and both proceed. Before the pre-state read, the transaction takes
-- SHARE ROW EXCLUSIVE locks on every catalog table the delta vector
-- covers, in ONE statement, in ONE documented order: ALPHABETICAL by
-- table name. SHARE ROW EXCLUSIVE conflicts with itself and with ROW
-- EXCLUSIVE, so any concurrent execution of this package - or any
-- unrelated direct catalog writer - blocks here until this
-- transaction ends, while ordinary reads stay unblocked. These are
-- REAL table locks, not advisory ones, so non-cooperating writers are
-- bound too. A queued second execution proceeds only after this one
-- commits, and then fails closed at W14-PRE-TARGET.
--   The two TENANT tables (exercises, exercise_aliases) are
--   DELIBERATELY NOT LOCKED. This package writes nothing to them, and
--   locking a live user-facing table would block ordinary workout
--   writes for the duration of the transaction. Their zero-delta
--   proof does not need a lock: under REPEATABLE READ the pre and
--   post reads share one snapshot, so the measured delta is this
--   transaction's own effect and nothing else.
LOCK TABLE
${CATALOG_TABLES.slice(0, -1).map((table) => `  public.${table},`).join('\n')}
  public.${CATALOG_TABLES[CATALOG_TABLES.length - 1]}
  IN SHARE ROW EXCLUSIVE MODE;

-- ── Pre-state capture (dropped at COMMIT; never persists) ────────
CREATE TEMP TABLE w14_txn_pre (
  ${deltaColumns},
  d_surface TEXT NOT NULL,
  d_content TEXT NOT NULL,
  d_tenant  TEXT NOT NULL
) ON COMMIT DROP;

INSERT INTO w14_txn_pre
  SELECT
    ${deltaSelect},
    ${surfaceDigest},
    ${contentDigest},
    ${tenantDigest};

-- ── Preflight (runs as the invoking operator role, BEFORE the loader
--    role is assumed and BEFORE any authority change) ─────────────
DO $pre$
DECLARE
  v_n BIGINT;
  v_name TEXT;
BEGIN
  -- W14-PRE-STRUCT: the loader boundary must be exactly migration
  -- 027's, by exact signature.
  IF to_regprocedure('public.load_catalog_identity(uuid)') IS NULL
     OR to_regprocedure('public.load_catalog_snapshot(uuid,text,text,text,text,text,text,text,text,text,text,text,text,text,date,text,jsonb,jsonb)') IS NULL THEN
    RAISE EXCEPTION 'W14-PRE-STRUCT: the migration-027 loader functions are missing at their exact signatures; wrong or unmigrated database';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'exlib_catalog_loader') THEN
    RAISE EXCEPTION 'W14-PRE-STRUCT: the exlib_catalog_loader role is missing';
  END IF;
  -- W14-PRE-STRUCT: migration 028 must be applied, or every one of
  -- the five loads would fail on the tracking_mode CHECK. This
  -- OBSERVES the applied literal; it does not create or alter it.
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'exercise_catalog_tracking_mode_check'
       AND conrelid = 'public.exercise_catalog'::regclass
       AND pg_get_constraintdef(oid) LIKE '%''weight_time''%') THEN
    RAISE EXCEPTION 'W14-PRE-STRUCT: exercise_catalog_tracking_mode_check does not admit weight_time; migration 028 is not applied to this database';
  END IF;
  -- W14-PRE-STRUCT: migration 025's equipment vocabulary must admit
  -- both loaded equipment values.
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'exercise_catalog_equipment_check'
       AND conrelid = 'public.exercise_catalog'::regclass
       AND pg_get_constraintdef(oid) LIKE '%''weight_plate''%'
       AND pg_get_constraintdef(oid) LIKE '%''weighted_vest''%') THEN
    RAISE EXCEPTION 'W14-PRE-STRUCT: exercise_catalog_equipment_check does not admit weight_plate and weighted_vest; migration 025 is not applied to this database';
  END IF;
  -- W14-PRE-STRUCT: the unique index that makes two distinct external
  -- source URLs REQUIRED must be present and NON-PARTIAL. Correction 1
  -- depends on it, and a database where it had been relaxed would
  -- silently accept the superseded same-URL binding.
  IF NOT EXISTS (
    SELECT 1 FROM pg_index i
      JOIN pg_class c ON c.oid = i.indexrelid
     WHERE c.relname = 'exercise_catalog_source_url_version_unique_idx'
       AND i.indrelid = 'public.exercise_catalog'::regclass
       AND i.indisunique
       AND i.indpred IS NULL) THEN
    RAISE EXCEPTION 'W14-PRE-STRUCT: exercise_catalog_source_url_version_unique_idx is absent, non-unique or partial; the source-URL uniqueness this package is built around is not in force';
  END IF;
  -- W14-PRE-STRUCT: the two migration-027 constraints that enforce
  -- the mixed-provenance split must both be present. Without them the
  -- five payloads would load unchecked.
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
                  WHERE conname = 'exercise_catalog_provenance_sources_chk'
                    AND conrelid = 'public.exercise_catalog'::regclass)
     OR NOT EXISTS (SELECT 1 FROM pg_constraint
                     WHERE conname = 'exercise_catalog_discovery_metadata_chk'
                       AND conrelid = 'public.exercise_catalog'::regclass)
     OR NOT EXISTS (SELECT 1 FROM pg_constraint
                     WHERE conname = 'exercise_catalog_review_audit_chk'
                       AND conrelid = 'public.exercise_catalog'::regclass) THEN
    RAISE EXCEPTION 'W14-PRE-STRUCT: a required exercise_catalog governance constraint is absent (provenance_sources / discovery_metadata / review_audit)';
  END IF;
  -- The claims invariant must already hold; this package must not be
  -- the transaction that "fixes" or masks a pre-existing violation.
  IF EXISTS (SELECT 1 FROM public.exlib_verify_catalog_claims() v
              WHERE v.orphaned_claims <> 0 OR v.unclaimed_bearers <> 0) THEN
    RAISE EXCEPTION 'W14-PRE-STRUCT: the bidirectional catalog name-claim invariant is already violated at the pre-state; refusing to load into an inconsistent surface';
  END IF;

  -- W14-PRE-TARGET: none of the five logical identities may exist.
  -- This is what makes a second execution fail closed.
  SELECT count(*) INTO v_n FROM public.exercise_catalog_logical l
   WHERE l.id IN (
    ${uuidListIndented});
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'W14-PRE-TARGET: % of the five W14 logical identities already exist. This package is ONE-USE and is SPENT once committed. Do not re-run it: READ STATE FIRST. An unexpected pre-existing target is an error, never a no-op.', v_n;
  END IF;

  -- W14-PRE-SNAPSHOT: no snapshot may already reference one of the
  -- five identities. (Implied by the identity gate under the 023
  -- foreign key, asserted separately so the failure class is legible.)
  IF EXISTS (SELECT 1 FROM public.exercise_catalog s
              WHERE s.logical_id IN (
    ${uuidListIndented})) THEN
    RAISE EXCEPTION 'W14-PRE-SNAPSHOT: a snapshot already exists for one of the five W14 identities';
  END IF;

  -- W14-PRE-NAME: neither the canonical name nor its normalized claim
  -- may be held by ANY identity. A conflicting claim is a governance
  -- collision, not something to load over.
  SELECT c.normalized_name INTO v_name
    FROM public.exercise_catalog_name_claims c
   WHERE c.normalized_name IN (
    ${entries.map((entry) => sqlLiteral(entry.normalized_name)).join(',\n    ')})
   LIMIT 1;
  IF v_name IS NOT NULL THEN
    RAISE EXCEPTION 'W14-PRE-NAME: the normalized name % is already claimed in exercise_catalog_name_claims', v_name;
  END IF;
  SELECT s.canonical_name INTO v_name
    FROM public.exercise_catalog s
   WHERE lower(s.canonical_name) IN (
    ${entries.map((entry) => sqlLiteral(entry.normalized_name)).join(',\n    ')})
   LIMIT 1;
  IF v_name IS NOT NULL THEN
    RAISE EXCEPTION 'W14-PRE-NAME: the canonical name % is already borne by an existing snapshot', v_name;
  END IF;
END
$pre$;

-- ── Transaction-contained elevation, posture-gated ───────────────
DO $posture$
BEGIN
  IF current_user <> 'postgres' OR session_user <> 'postgres' THEN
    RAISE EXCEPTION 'W14-PRE-STRUCT: BOTH execution identities must be the hosted operator role postgres (got current_user=%, session_user=%); refusing before any write or authority change', current_user, session_user;
  END IF;
  IF (SELECT rolsuper FROM pg_roles WHERE rolname = current_user) THEN
    RAISE EXCEPTION 'W14-PRE-STRUCT: the invoker is a superuser; this package is bound to the hosted non-superuser postgres posture';
  END IF;
  IF (SELECT count(*) FROM pg_catalog.pg_auth_members am
        JOIN pg_roles r ON r.oid = am.roleid
       WHERE r.rolname = 'exlib_catalog_loader') <> 1
     OR NOT EXISTS (
       SELECT 1 FROM pg_catalog.pg_auth_members am
         JOIN pg_roles r ON r.oid = am.roleid
         JOIN pg_roles m ON m.oid = am.member
         JOIN pg_roles g ON g.oid = am.grantor
        WHERE r.rolname = 'exlib_catalog_loader' AND m.rolname = 'postgres'
          AND g.rolname = 'supabase_admin'
          AND am.admin_option AND NOT am.inherit_option AND NOT am.set_option) THEN
    RAISE EXCEPTION 'W14-PRE-STRUCT: the loader-role membership posture is not the exact hosted baseline (exactly one membership: postgres granted BY supabase_admin with ADMIN TRUE, INHERIT FALSE, SET FALSE - grantor included); refusing before any write or authority change';
  END IF;
END
$posture$;

GRANT exlib_catalog_loader TO postgres WITH SET TRUE, INHERIT FALSE;

-- ── Structural two-grantor proof, BEFORE SET ROLE or any loader
--    call: exactly two membership rows must now exist - the untouched
--    supabase_admin-granted baseline plus the postgres-granted
--    temporary SET row. Grantor keys make them DISTINCT rows, which
--    is precisely why the grantor-scoped REVOKE below can remove only
--    the temporary one. ─────────────────────────────────────────────
DO $auth$
BEGIN
  IF (SELECT count(*) FROM pg_catalog.pg_auth_members am
        JOIN pg_roles r ON r.oid = am.roleid
       WHERE r.rolname = 'exlib_catalog_loader') <> 2
     OR NOT EXISTS (
       SELECT 1 FROM pg_catalog.pg_auth_members am
         JOIN pg_roles r ON r.oid = am.roleid
         JOIN pg_roles m ON m.oid = am.member
         JOIN pg_roles g ON g.oid = am.grantor
        WHERE r.rolname = 'exlib_catalog_loader' AND m.rolname = 'postgres'
          AND g.rolname = 'supabase_admin'
          AND am.admin_option AND NOT am.inherit_option AND NOT am.set_option)
     OR NOT EXISTS (
       SELECT 1 FROM pg_catalog.pg_auth_members am
         JOIN pg_roles r ON r.oid = am.roleid
         JOIN pg_roles m ON m.oid = am.member
         JOIN pg_roles g ON g.oid = am.grantor
        WHERE r.rolname = 'exlib_catalog_loader' AND m.rolname = 'postgres'
          AND g.rolname = 'postgres'
          AND NOT am.admin_option AND NOT am.inherit_option AND am.set_option) THEN
    RAISE EXCEPTION 'W14-AUTH: the two-grantor membership shape after the temporary grant is not exact (supabase_admin-granted baseline plus postgres-granted SET row); aborting before SET ROLE and before any loader call';
  END IF;
END
$auth$;

-- ── The load, under the loader authority ONLY ────────────────────
SET ROLE exlib_catalog_loader;

-- ${entries.length} identities, in manifest order. Explicit UUIDs, never
-- gen_random_uuid(): load_catalog_identity's p_id parameter exists
-- exactly so the identity is reviewable before the act.
${uuids.map((uuid) => `SELECT public.load_catalog_identity('${uuid}');`).join('\n')}

-- ${entries.length} canonical snapshots, in manifest order ${entries.map((entry) => entry.inventory_file_line).join(', ')}.
${calls.join('\n\n')}

RESET ROLE;

-- ── Exact restoration: remove ONLY the temporary grant this package
--    created, identified by its grantor. The implicit migration-027
--    creator membership (a different grantor) is untouched. ────────
REVOKE exlib_catalog_loader FROM postgres GRANTED BY postgres;

-- ── Postconditions (owner reads; ANY mismatch rolls back ALL) ────
DO $post$
BEGIN
  -- (1) EXACT DELTAS across every catalog table and both tenant
  --     tables. Five identities, five snapshots, five anatomy rows,
  --     five canonical name claims - and zero of everything else.
  --     Zero aliases is a governed value, not an omission: the
  --     operator ruled aliases [] for all five, and an unsupported
  --     name claim is worse than no alias claim.
${deltaChecks}

${posts.join('\n\n')}

  -- (2) No alias row and no alias CLAIM may exist for any of the five.
  IF (SELECT count(*) FROM public.exercise_catalog_aliases a
       WHERE a.logical_id IN (
    ${uuidListIndented})) <> 0 THEN
    RAISE EXCEPTION 'w14 post: an alias row exists for a W14 identity; the governed alias set is empty for all five';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_name_claims c
       WHERE c.claim_source = 'alias' AND c.logical_id IN (
    ${uuidListIndented})) <> 0 THEN
    RAISE EXCEPTION 'w14 post: an alias name claim exists for a W14 identity';
  END IF;

  -- (3) Exactly five snapshots carry tracking_mode weight_time among
  --     the five identities, and every one of the five does.
  IF (SELECT count(*) FROM public.exercise_catalog s
       WHERE s.logical_id IN (
    ${uuidListIndented})
         AND s.tracking_mode = 'weight_time') <> 5 THEN
    RAISE EXCEPTION 'w14 post: the five W14 snapshots do not all carry tracking_mode = weight_time';
  END IF;

  -- (4) The mixed-provenance split, asserted as a set: exactly two
  --     external_source_derived and exactly three forgefitos_original.
  IF (SELECT count(*) FROM public.exercise_catalog s
       WHERE s.logical_id IN (
    ${uuidListIndented})
         AND s.provenance = 'external_source_derived') <> ${externalCount}
     OR (SELECT count(*) FROM public.exercise_catalog s
          WHERE s.logical_id IN (
    ${uuidListIndented})
            AND s.provenance = 'forgefitos_original') <> ${originalCount} THEN
    RAISE EXCEPTION 'w14 post: the intentional 2/3 provenance split is not exact; the five must NOT be normalized to one provenance value';
  END IF;

  -- (4a) THE TWO EXTERNAL ROWS MUST CARRY DISTINCT source_url VALUES
  --      (Correction 1). The unique index would already refuse a
  --      duplicate; this asserts the governed intent directly, so a
  --      future relaxation of the index cannot quietly re-admit the
  --      superseded same-URL binding.
  IF (SELECT count(DISTINCT s.source_url) FROM public.exercise_catalog s
       WHERE s.logical_id IN (
    ${uuidListIndented})
         AND s.provenance = 'external_source_derived') <> ${externalCount} THEN
    RAISE EXCEPTION 'w14 post: the external_source_derived W14 rows do not carry DISTINCT source_url values';
  END IF;

  -- (5) CARRY EXCLUSION. The delta of exactly five identities already
  --     forbids a sixth, but the three deferred carries are named
  --     explicitly so the proof is legible and cannot be satisfied by
  --     a renamed carry.
  IF EXISTS (SELECT 1 FROM public.exercise_catalog s
              WHERE lower(s.canonical_name) IN (
    ${CARRY_NORMALIZED.map((name) => sqlLiteral(name)).join(',\n    ')}))
     OR EXISTS (SELECT 1 FROM public.exercise_catalog_name_claims c
                 WHERE c.normalized_name IN (
    ${CARRY_NORMALIZED.map((name) => sqlLiteral(name)).join(',\n    ')})) THEN
    RAISE EXCEPTION 'w14 post: a deferred carry (inventory line 134, 135 or 136) is present; the three carries must NOT be admitted by this package';
  END IF;

  -- (6) NO TENANT DELIVERY. deliver_catalog_exercises is never called
  --     in this file; this proves no tenant row was linked to any of
  --     the five by any path, which is target-scoped and therefore
  --     independent of unrelated concurrent tenant activity.
  IF EXISTS (SELECT 1 FROM public.exercises t
              WHERE t.catalog_logical_id IN (
    ${uuidListIndented}))
     OR EXISTS (SELECT 1 FROM public.exercises t
                 JOIN public.exercise_catalog s ON s.id = t.catalog_id
                WHERE s.logical_id IN (
    ${uuidListIndented}))
     OR EXISTS (SELECT 1 FROM public.exercise_aliases a
                 JOIN public.exercise_catalog_aliases ca ON ca.id = a.catalog_alias_id
                WHERE ca.logical_id IN (
    ${uuidListIndented})) THEN
    RAISE EXCEPTION 'w14 post: a tenant exercise or tenant alias references a W14 identity; this package performs NO delivery';
  END IF;

  -- (7) NO CONTENT, REVIEW, ADMISSION or PUBLICATION ACT. Beyond the
  --     zero deltas above, the whole content/expected-relationship/
  --     review-event surface must be byte-identical to the pre-state
  --     digest, and no content row may reference one of the five.
  IF (SELECT ${contentDigest}) <> (SELECT p.d_content FROM w14_txn_pre p) THEN
    RAISE EXCEPTION 'w14 post: the content / expected-relationship / review-event surface CHANGED; this package performs no content, review, admission or publication act';
  END IF;
  IF EXISTS (SELECT 1 FROM public.exercise_catalog_content c
              WHERE c.logical_id IN (
    ${uuidListIndented})) THEN
    RAISE EXCEPTION 'w14 post: a content version references a W14 identity';
  END IF;

  -- (8) THE PRE-EXISTING CATALOG SURFACE OUTSIDE THE FIVE IS
  --     UNCHANGED, byte-for-byte, including every pre-existing
  --     snapshot, anatomy row, alias, name claim and logical identity.
  IF (SELECT ${surfaceDigest}) <> (SELECT p.d_surface FROM w14_txn_pre p) THEN
    RAISE EXCEPTION 'w14 post: the pre-existing catalog surface outside the five W14 identities CHANGED';
  END IF;

  -- (9) THE TENANT SURFACE IS UNCHANGED, byte-for-byte.
  IF (SELECT ${tenantDigest}) <> (SELECT p.d_tenant FROM w14_txn_pre p) THEN
    RAISE EXCEPTION 'w14 post: the tenant exercise / alias surface CHANGED; this package writes nothing to tenant tables';
  END IF;

  -- (10) The bidirectional claim invariant still holds: zero orphaned
  --      claims and zero unclaimed bearers, via migration 023's own
  --      verifier function.
  IF EXISTS (SELECT 1 FROM public.exlib_verify_catalog_claims() v
              WHERE v.orphaned_claims <> 0 OR v.unclaimed_bearers <> 0) THEN
    RAISE EXCEPTION 'w14 post: the bidirectional name-claim invariant is violated (orphaned claim or unclaimed bearer)';
  END IF;

  -- (11) AUTHORITY RESTORATION, before COMMIT: exactly the original
  --      supabase_admin-granted baseline row remains - grantor
  --      included - and no client, service or PUBLIC grant exists on
  --      any of the three loader functions.
  IF (SELECT count(*) FROM pg_catalog.pg_auth_members am
        JOIN pg_roles r ON r.oid = am.roleid
       WHERE r.rolname = 'exlib_catalog_loader') <> 1
     OR NOT EXISTS (
       SELECT 1 FROM pg_catalog.pg_auth_members am
         JOIN pg_roles r ON r.oid = am.roleid
         JOIN pg_roles m ON m.oid = am.member
         JOIN pg_roles g ON g.oid = am.grantor
        WHERE r.rolname = 'exlib_catalog_loader' AND m.rolname = 'postgres'
          AND g.rolname = 'supabase_admin'
          AND am.admin_option AND NOT am.inherit_option AND NOT am.set_option) THEN
    RAISE EXCEPTION 'w14 post: the temporary loader elevation was not exactly restored - EXACTLY the original supabase_admin-granted baseline row (grantor included) must remain';
  END IF;
  IF has_function_privilege('anon', 'public.load_catalog_identity(uuid)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.load_catalog_identity(uuid)', 'EXECUTE')
     OR has_function_privilege('service_role', 'public.load_catalog_identity(uuid)', 'EXECUTE')
     OR EXISTS (SELECT 1 FROM pg_proc p CROSS JOIN LATERAL aclexplode(p.proacl) a
                 WHERE p.pronamespace = 'public'::regnamespace
                   AND p.proname IN ('load_catalog_identity','load_catalog_snapshot','load_catalog_content_draft')
                   AND a.grantee = 0) THEN
    RAISE EXCEPTION 'w14 post: a client, service, or PUBLIC grant exists on the loader functions';
  END IF;
END
$post$;

COMMIT;

-- The transaction above is the entire package. After COMMIT the
-- database holds exactly five NEW logical identities, each bearing
-- exactly one PENDING, ACTIVE, version-1 canonical snapshot with
-- tracking_mode weight_time, its single secondary-muscle anatomy row,
-- ZERO aliases, and one canonical name claim - and nothing else
-- changed anywhere, proven by exact deltas over fourteen tables and
-- three whole-surface digests, with the temporary loader elevation
-- restored to the hosted baseline before COMMIT.
--
-- The three deferred carries (inventory lines 134, 135, 136) are NOT
-- admitted. No prose content version exists for any of the five. No
-- review, admission, publication, sealing or delivery has occurred.
-- deliver_catalog_exercises was not invoked. Every one of those
-- remains a separately gated authority.
--
-- THIS PACKAGE HAS NOT BEEN APPLIED TO HOSTED. It is ONE-USE: after a
-- successful hosted COMMIT it is SPENT and must not be re-run.
`
  // Cosmetic: an empty interpolation line inside a generated IN ( … ) list.
  return sql.replace(/\(\n {4}\n {4}/g, '(\n    ')
}

// ── manifest emission ─────────────────────────────────────────────────
function buildManifest(entries: Entry[], bindings: Binding[]): string {
  const provenanceBasis: Record<number, string> = { 132: 'operator_inheritance', 133: 'operator_inheritance_over_committed_independent_evidence', 137: 'operator_decision', 138: 'operator_decision', 139: 'operator_decision' }
  const manifest = {
    artifact: 'weight_time W14 five-entry catalog admission manifest',
    status: 'PREPARED - NOT APPLIED',
    generated_by: 'scripts/generate-weight-time-w14-package.ts',
    recorded_utc: '2026-09-11',
    production_base: { commit: PRODUCTION_BASE_COMMIT, tree: PRODUCTION_BASE_TREE },
    hosted_application_has_occurred: false,
    eventual_target: {
      supabase_project_ref: 'ttybyljytiwntvorugcv',
      supabase_project_name: 'ShredOS',
      executor: 'Joseph/ChatGPT only - never Claude',
      requires: 'a later explicit one-use operator instruction',
    },
    loader_boundary: {
      identity_function: 'public.load_catalog_identity(uuid)',
      snapshot_function: 'public.load_catalog_snapshot(uuid,text,text,text,text,text,text,text,text,text,text,text,text,text,date,text,jsonb,jsonb)',
      authority_role: 'exlib_catalog_loader',
      functions_deliberately_NOT_used: ['public.load_catalog_content_draft', 'public.apply_content_review', 'public.admit_catalog_content', 'public.publish_catalog_content', 'public.deliver_catalog_exercises', 'public.exlib_content_admission_manifest'],
      no_direct_dml: 'the package issues no INSERT/UPDATE/DELETE against any catalog table; every write goes through the migration-027 loader boundary',
    },
    admission_set_size: entries.length,
    manifest_order: entries.map((entry) => entry.inventory_file_line),
    excluded_deferred: {
      inventory_file_lines: [...EXCLUDED_CARRY_LINES],
      names: [...EXCLUDED_CARRY_NAMES],
      reason: 'Carry tracking is a separate, later product decision. No carry mode is named, invented, or reinterpreted, and no carry entry is admitted.',
    },
    provenance_split: {
      external_source_derived: entries.filter((entry) => entry.provenance === 'external_source_derived').map((entry) => entry.inventory_file_line),
      forgefitos_original: entries.filter((entry) => entry.provenance === 'forgefitos_original').map((entry) => entry.inventory_file_line),
      invariant: 'MIXED BY DESIGN - do not normalize. external rows carry all four discovery-source fields non-NULL; forgefitos_original rows carry all four NULL, enforced by exercise_catalog_provenance_sources_chk.',
    },
    external_source_url_uniqueness: {
      rule: 'the external_source_derived rows carry DISTINCT source_url values',
      enforced_by: 'exercise_catalog_source_url_version_unique_idx — a NON-PARTIAL unique index on (source_url, catalog_version), migration 023',
      catalog_version_note: 'load_catalog_snapshot\'s INSERT omits catalog_version, so every newly loaded snapshot is born at the column DEFAULT of 1; a differing version is not reachable through the authorized loader',
      history: 'a superseded first ruling bound 132 and 133 to one URL; disposable execution proved that impossible, and Correction 1 (decision document section 11) rebound 133 to the second committed external evidence record',
      urls: entries.filter((entry) => entry.provenance === 'external_source_derived').map((entry) => ({ inventory_file_line: entry.inventory_file_line, source_url: entry.source_url })),
    },
    payload_fingerprint_scheme: {
      algorithm: 'sha256',
      input: 'the eighteen load_catalog_snapshot arguments in migration-027 declaration order, each rendered as "<parameter_name>=<value>\\n" and concatenated',
      null_rendering: '\\N (backslash, capital N)',
      anatomy_rendering: 'FULLY COMPACT JSON array of {"muscle","role"} objects with sorted keys, ordered by (muscle, role) - note the SQL call sites emit a spaced jsonb literal instead, which is cosmetic and NOT the fingerprint input',
      aliases_rendering: 'compact JSON array, empty for every W14 entry',
      recomputable_by: 'printf %s "<payload_canonical_form>" | shasum -a 256',
      independently_recomputed_by: 'scripts/verify-weight-time-w14.ts',
    },
    expected_effect: {
      logical_identities_created: 5,
      snapshots_created: 5,
      anatomy_rows_created: 5,
      alias_rows_created: 0,
      name_claim_rows_created: 5,
      content_versions_created: 0,
      review_events_created: 0,
      relationship_rows_created: 0,
      import_runs_created: 0,
      run_items_created: 0,
      corrections_created: 0,
      tenant_exercises_created: 0,
      tenant_delivery_aliases_created: 0,
      born_state: 'review_status=pending, is_active=true, catalog_version=1, reviewed_by/reviewed_at/review_rationale all NULL - the migration-027 freeze trigger guarantees it',
      note: 'loading is not approval; database review, admission, publication and delivery all remain separately gated authorities',
    },
    source_bindings: bindings,
    historical_evidence_preserved: {
      files: [INVENTORY_PATH, 'docs/exlib2b-release1-coverage-matrix.md'],
      rule: 'byte-identical; the eight historical deferred rows keep import_eligible=false, review_status=proposed, deferred=true and their original deferred_reason; the coverage matrix keeps its "8 explicitly deferred" statement',
    },
    entries: entries.map((entry) => ({
      ...entry,
      decision_basis: {
        class_A_source_derived: ['canonical_name', 'primary_muscle', 'equipment', 'laterality', 'tracking_mode', 'movement_pattern', 'training_role', 'difficulty', 'availability', 'anatomy'],
        carrier_for_class_A: INVENTORY_PATH,
        operator_ruled: ['logical_id', 'category', 'provenance', 'source_url', 'source_page', 'retrieved_at', 'import_confidence', 'aliases'],
        carrier_for_operator_ruled: DECISIONS_PATH,
        provenance_basis: provenanceBasis[entry.inventory_file_line] ?? 'operator_decision',
        ...(entry.inventory_file_line === 133
          ? { corrected_by: 'section 11 (Correction 1) of ' + DECISIONS_PATH, corrected_fields: [...SOURCE_FIELDS], class_A_within_the_correction: ['source_url', 'retrieved_at'], operator_ruled_within_the_correction: ['source_page', 'import_confidence'] }
          : {}),
      },
    })),
  }
  return JSON.stringify(manifest, null, 2) + '\n'
}

// ── main ──────────────────────────────────────────────────────────────
function main(): number {
  const variantName = process.env.W14_VARIANT ?? ''
  const outputDirectory = process.env.W14_OUT_DIR ?? ''
  if (variantName !== '' && outputDirectory === '') fail('W14_VARIANT requires W14_OUT_DIR: a diagnostic variant is never written into docs/')
  if (variantName === '' && outputDirectory !== '') fail('W14_OUT_DIR without W14_VARIANT: the governed package is only ever written to docs/')

  const { entries } = buildEntries()

  // A defect variant mutates the entry set BEFORE the invariants run, because
  // breaking one of them is exactly what makes it a control. The `identity`
  // variant mutates nothing, so it is held to the governed invariants too.
  if (variantName !== '' && variantName in VARIANTS) {
    VARIANTS[variantName].apply(entries)
    // Fingerprints follow the mutated payload, so a control's own SQL is self-consistent.
    for (const entry of entries) {
      const { payload_fingerprint_sha256: _ignored, ...rest } = entry
      entry.payload_fingerprint_sha256 = sha256(payloadCanonicalForm(rest))
    }
  } else if (variantName !== '' && !(variantName in SQL_SABOTAGE)) {
    fail(`unknown W14_VARIANT "${variantName}". Known: ${[...Object.keys(VARIANTS), ...Object.keys(SQL_SABOTAGE)].join(', ')}`)
  }

  // Governed invariants.
  if (variantName === '' || variantName === 'identity') {
    if (entries.length !== 5) fail(`the admission set is ${entries.length} entries; W14 admits EXACTLY FIVE`)
    const order = entries.map((entry) => entry.inventory_file_line)
    if (order.join(',') !== MANIFEST_ORDER.join(',')) fail(`manifest order is ${order.join(', ')}; it must be exactly ${MANIFEST_ORDER.join(', ')}`)
    for (const line of EXCLUDED_CARRY_LINES) {
      if (order.includes(line)) fail(`inventory line ${line} is a DEFERRED carry and must not be admitted`)
    }
    const external = entries.filter((entry) => entry.provenance === 'external_source_derived')
    const original = entries.filter((entry) => entry.provenance === 'forgefitos_original')
    if (external.length !== 2 || original.length !== 3) fail(`the provenance split is ${external.length}/${original.length}; it must be exactly 2 external_source_derived / 3 forgefitos_original and must NOT be normalized`)
    for (const entry of external) {
      for (const field of SOURCE_FIELDS) {
        if (entry[field] === null) fail(`entry ${entry.inventory_file_line} is external_source_derived but ${field} is NULL; exercise_catalog_provenance_sources_chk requires all four non-NULL`)
      }
    }
    for (const entry of original) {
      for (const field of SOURCE_FIELDS) {
        if (entry[field] !== null) fail(`entry ${entry.inventory_file_line} is forgefitos_original but ${field} is not NULL; external provenance must never be fabricated`)
      }
    }
    const externalUrls = new Set(external.map((entry) => entry.source_url))
    if (externalUrls.size !== external.length) fail('the external_source_derived entries share a source_url. exercise_catalog_source_url_version_unique_idx forbids it at catalog_version 1, and Correction 1 binds 133 to its own committed evidence URL.')
    for (const entry of entries) {
      if (entry.aliases.length !== 0) fail(`entry ${entry.inventory_file_line} carries an alias; the governed alias set is exactly [] for all five`)
      if (entry.tracking_mode !== 'weight_time') fail(`entry ${entry.inventory_file_line} is not weight_time`)
    }
  }

  const bindings = bindArtifacts()
  // `identity` emits the governed bytes verbatim - no banner - so a diff against
  // docs/ is a real determinism proof rather than a comparison of two headers.
  const variantNote = variantName === '' || variantName === 'identity'
    ? null
    : `${variantName}: ${(VARIANTS[variantName] ?? SQL_SABOTAGE[variantName]).note}`
  let sql = buildSql(entries, bindings, variantNote)
  if (variantName in SQL_SABOTAGE) sql = SQL_SABOTAGE[variantName].apply(sql)
  const manifest = buildManifest(entries, bindings)

  const manifestPath = variantName === '' ? path.join(repositoryRoot, MANIFEST_OUT) : path.join(outputDirectory, 'w14-manifest.json')
  const sqlPath = variantName === '' ? path.join(repositoryRoot, SQL_OUT) : path.join(outputDirectory, `w14-${variantName}.sql`)
  writeFileSync(manifestPath, manifest)
  writeFileSync(sqlPath, sql)

  const manifestBytes = Buffer.byteLength(manifest)
  const sqlBytes = Buffer.byteLength(sql)
  if (variantName !== '') console.log(`VARIANT ${variantName} — ${(VARIANTS[variantName] ?? SQL_SABOTAGE[variantName]).note}`)
  console.log(`manifest ${manifestPath}`)
  console.log(`         ${manifestBytes} bytes  sha256 ${sha256(manifest)}`)
  console.log(`sql      ${sqlPath}`)
  console.log(`         ${sqlBytes} bytes  sha256 ${sha256(sql)}`)
  for (const entry of entries) {
    console.log(`  ${entry.inventory_file_line}  ${entry.logical_id}  ${entry.provenance.padEnd(23)}  ${entry.payload_fingerprint_sha256}  ${entry.source_url ?? 'NULL'}`)
  }
  return 0
}

process.exit(main())
