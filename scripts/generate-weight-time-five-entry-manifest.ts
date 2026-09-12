// ============================================================
// ForgeFitOS — weight_time five-entry endgame: MANIFEST GENERATOR.
//
// Emits docs/weight-time-five-entry-lifecycle-manifest.json, the machine-
// readable endgame manifest that every later package generator and verifier
// reads. Nothing in the manifest is typed by hand:
//
//   * snapshot truth for the five identities is DERIVED from the frozen
//     W14 admission manifest, bound by bytes + sha256, never retyped;
//   * content payloads are DERIVED from the content carrier, bound the same
//     way;
//   * every content fingerprint is COMPUTED here by a scheme that a reviewer
//     can reproduce with shasum alone (see fingerprint_scheme in the output).
//
// Human decision leaves are emitted as nulls with a pointer to the blank
// form that owns them. This generator will never fill one, and --check
// fails if a manifest on disk has one filled in.
//
// Run from the repository root:
//   npx tsx scripts/generate-weight-time-five-entry-manifest.ts          # write
//   npx tsx scripts/generate-weight-time-five-entry-manifest.ts --check  # verify
//
// --check recomputes the manifest from current inputs and compares it byte
// for byte with the file on disk, so a drifted input or a hand-edited
// manifest is a non-zero exit rather than a silent inconsistency.
// ============================================================

import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'

const REPO_ROOT: string = process.cwd()

const OUT_RELATIVE_PATH = 'docs/weight-time-five-entry-lifecycle-manifest.json'
const W14_MANIFEST_RELATIVE_PATH = 'docs/weight-time-w14-admission-manifest.json'
const CONTENT_CARRIER_RELATIVE_PATH = 'docs/weight-time-five-entry-content.jsonl'

// The exact five governed identities, in manifest order. Any drift between
// this list and the W14 manifest's entry set is a fatal error, not a merge:
// the five are fixed by the governing instruction and by hosted state.
const GOVERNED_LOGICAL_IDS: readonly string[] = [
  'e21b2c00-0000-4000-a000-000000000004',
  'e21b2c00-0000-4000-a000-000000000005',
  'e21b2c00-0000-4000-a000-000000000006',
  'e21b2c00-0000-4000-a000-000000000007',
  'e21b2c00-0000-4000-a000-000000000008',
]

// Explicitly out of scope and deferred. Present ONLY so the manifest can
// assert their absence; no carry identity may appear anywhere else.
const DEFERRED_CARRY_LOGICAL_IDS: readonly string[] = [
  'e21b2c00-0000-4000-a000-000000000009',
  'e21b2c00-0000-4000-a000-00000000000a',
  'e21b2c00-0000-4000-a000-00000000000b',
]

// Artifacts whose bytes this manifest binds. A change to any of them must
// void the manifest, so each is pinned by size and sha256.
const BOUND_ARTIFACT_RELATIVE_PATHS: readonly string[] = [
  'supabase/migrations/023_exlib_catalog_and_delivery_contract.sql',
  'supabase/migrations/027_exlib_catalog_content_schema.sql',
  'supabase/migrations/028_weight_time_tracking_mode.sql',
  'supabase/migrations/029_exlib_plank_cross_run_idempotency.sql',
  'supabase/migrations/026_exlib_plank_seed_reconciliation.sql',
  'src/lib/supabase/deliver-catalog.ts',
  W14_MANIFEST_RELATIVE_PATH,
  CONTENT_CARRIER_RELATIVE_PATH,
  'docs/weight-time-w14-catalog-field-decisions.md',
  'docs/weight-time-five-entry-endgame-discovery-matrix.md',
  'docs/weight-time-five-entry-snapshot-review-form.json',
  'docs/weight-time-five-entry-content-review-form.json',
  'docs/weight-time-five-entry-run-authority-form.json',
  'docs/weight-time-five-entry-delivery-configuration-dependency.md',
  // The operator-supplied hosted facts this manifest restates as the pre-state.
  'docs/weight-time-w14-hosted-application-record.md',
  // The one promoted sealed run, whose row every package must leave untouched.
  'docs/exlib2u-staged-run-package.sql',
  'docs/exlib2z-s5-seal-package.sql',
]

// ── The hosted world every package starts from ──────────────────────
// OPERATOR-SUPPLIED, restated from docs/weight-time-w14-hosted-application-record.md
// (bound by bytes above). Claude never read hosted state; these figures are the
// operator's, and the disposable proof REBUILDS this exact vector locally by
// replaying the spent package chain, which is what makes it checkable at all.
// The eleven terms, in the order every promoted package prints them:
//   logical / snapshots / muscles / aliases / claims / content / expected_rel /
//   relationships / runs / run_items / review_events
const HOSTED_PRE_STATE_VECTOR = '8/8/10/3/11/1/2/2/1/6/3'
const HISTORICAL_RUN_KEY = 'exlib2u-plank-release1-staged-v1'
const PROPOSED_RUN_KEY = 'w14e-weight-time-release1-staged-v1'

// Every stage moves the vector by a derivable delta and NOTHING else. The
// package generator reads these; the live proof reads them back from PostgreSQL.
const STAGE_VECTORS: readonly { stage: number; name: string; before: string; after: string; moves: string }[] = [
  { stage: 1, name: 'snapshot_review',     before: '8/8/10/3/11/1/2/2/1/6/3', after: '8/8/10/3/11/1/2/2/1/6/8',  moves: 'review_events 3 -> 8 (one trigger-appended event per identity)' },
  { stage: 2, name: 'content_draft',       before: '8/8/10/3/11/1/2/2/1/6/8', after: '8/8/10/3/11/6/2/2/1/6/8',  moves: 'content 1 -> 6; expected_rel stays 2 because every five-entry expected set is empty' },
  { stage: 3, name: 'content_review',      before: '8/8/10/3/11/6/2/2/1/6/8', after: '8/8/10/3/11/6/2/2/1/6/8',  moves: 'nothing; five content rows change in place' },
  { stage: 4, name: 'content_admission',   before: '8/8/10/3/11/6/2/2/1/6/8', after: '8/8/10/3/11/6/2/2/1/6/8',  moves: 'nothing; five content rows change in place' },
  { stage: 5, name: 'content_publication', before: '8/8/10/3/11/6/2/2/1/6/8', after: '8/8/10/3/11/6/2/2/1/6/8',  moves: 'nothing; relationships stay 2 because every projected set is empty' },
  { stage: 6, name: 'run_staging',         before: '8/8/10/3/11/6/2/2/1/6/8', after: '8/8/10/3/11/6/2/2/2/17/8', moves: 'runs 1 -> 2; run_items 6 -> 17 (the historical run\'s 3 exercise + 3 alias members copied forward, plus five new exercise members: 8 exercise + 3 alias)' },
  { stage: 7, name: 'run_seal',            before: '8/8/10/3/11/6/2/2/2/17/8', after: '8/8/10/3/11/6/2/2/2/17/8', moves: 'nothing; the new run row changes in place (approved_for_delivery, sealed_at)' },
]

const STAGE_PACKAGE_PATHS: readonly string[] = [
  'docs/weight-time-five-entry-packages/01-snapshot-review.sql',
  'docs/weight-time-five-entry-packages/02-content-draft-load.sql',
  'docs/weight-time-five-entry-packages/03-content-review.sql',
  'docs/weight-time-five-entry-packages/04-content-admission.sql',
  'docs/weight-time-five-entry-packages/05-content-publication.sql',
  'docs/weight-time-five-entry-packages/06-run-staging.sql',
  'docs/weight-time-five-entry-packages/07-run-seal.sql',
]

function fail(message: string): never {
  process.stderr.write(`FATAL: ${message}\n`)
  process.exit(1)
}

function absolutePathOf(relativePath: string): string {
  return path.join(REPO_ROOT, relativePath)
}

function readRequiredFile(relativePath: string): string {
  const absolutePath = absolutePathOf(relativePath)
  if (!existsSync(absolutePath)) fail(`required input is missing: ${relativePath}`)
  return readFileSync(absolutePath, 'utf8')
}

function sha256Hex(value: string): string {
  return createHash('sha256').update(Buffer.from(value, 'utf8')).digest('hex')
}

function bindArtifactByBytes(relativePath: string): {
  path: string
  bytes: number
  sha256: string
} {
  const absolutePath = absolutePathOf(relativePath)
  if (!existsSync(absolutePath)) fail(`cannot bind a missing artifact: ${relativePath}`)
  const rawBytes = readFileSync(absolutePath)
  const byteCount = statSync(absolutePath).size
  if (rawBytes.length !== byteCount) {
    fail(`byte count disagreement while binding ${relativePath}`)
  }
  return {
    path: relativePath,
    bytes: byteCount,
    sha256: createHash('sha256').update(rawBytes).digest('hex'),
  }
}

// ── Canonical rendering, identical in shape to the frozen W14 snapshot
// scheme so a reviewer already fluent in that one needs no new rules:
// one line per function argument, in the function's own declaration order,
// rendered as <parameter_name>=<value>\n, NULL rendered as the two
// characters backslash-N, JSONB rendered as compact JSON with sorted keys.
const NULL_RENDERING = '\\N'

function renderCanonicalScalar(value: string | number | null): string {
  if (value === null) return NULL_RENDERING
  return String(value)
}

function renderCanonicalJson(value: unknown): string {
  return canonicalJsonStringify(value)
}

function canonicalJsonStringify(value: unknown): string {
  if (value === null) return 'null'
  if (Array.isArray(value)) {
    return `[${value.map((element) => canonicalJsonStringify(element)).join(',')}]`
  }
  if (typeof value === 'object') {
    const objectValue = value as Record<string, unknown>
    const sortedKeys = Object.keys(objectValue).sort()
    const renderedPairs = sortedKeys.map(
      (key) => `${JSON.stringify(key)}:${canonicalJsonStringify(objectValue[key])}`,
    )
    return `{${renderedPairs.join(',')}}`
  }
  return JSON.stringify(value)
}

// The thirteen arguments of load_catalog_content_draft, in migration-027
// declaration order, verified against the migration bytes by the static
// verifier rather than trusted from this comment.
const CONTENT_DRAFT_PARAMETER_ORDER: readonly {
  parameterName: string
  carrierField: string
  kind: 'scalar' | 'json'
}[] = [
  { parameterName: 'p_logical_id', carrierField: 'logical_id', kind: 'scalar' },
  { parameterName: 'p_content_id', carrierField: 'content_id', kind: 'scalar' },
  { parameterName: 'p_content_version', carrierField: 'content_version', kind: 'scalar' },
  { parameterName: 'p_authored_by', carrierField: 'authored_by', kind: 'scalar' },
  { parameterName: 'p_authored_at', carrierField: 'authored_at', kind: 'scalar' },
  { parameterName: 'p_setup_steps', carrierField: 'setup_steps', kind: 'json' },
  { parameterName: 'p_execution_steps', carrierField: 'execution_steps', kind: 'json' },
  { parameterName: 'p_breathing_cue', carrierField: 'breathing_cue', kind: 'scalar' },
  { parameterName: 'p_common_mistakes', carrierField: 'common_mistakes', kind: 'json' },
  { parameterName: 'p_safety_guidance', carrierField: 'safety_guidance', kind: 'scalar' },
  { parameterName: 'p_equipment_setup', carrierField: 'equipment_setup', kind: 'scalar' },
  {
    parameterName: 'p_accessibility_alternative',
    carrierField: 'accessibility_alternative',
    kind: 'scalar',
  },
  {
    parameterName: 'p_expected_relationships',
    carrierField: 'expected_relationships',
    kind: 'json',
  },
]

interface ContentCarrierRecord {
  inventory_file_line: number
  canonical_name: string
  logical_id: string
  content_id: string
  content_version: number
  authored_by: string
  authored_at: string
  setup_steps: string[]
  execution_steps: string[]
  breathing_cue: string
  common_mistakes: string[]
  safety_guidance: string
  equipment_setup: string
  accessibility_alternative: string
  expected_relationships: unknown[]
}

function buildContentCanonicalForm(record: ContentCarrierRecord): string {
  const renderedLines: string[] = []
  for (const parameter of CONTENT_DRAFT_PARAMETER_ORDER) {
    const carrierValue = (record as unknown as Record<string, unknown>)[parameter.carrierField]
    if (carrierValue === undefined) {
      fail(`content carrier record ${record.logical_id} is missing ${parameter.carrierField}`)
    }
    const renderedValue =
      parameter.kind === 'json'
        ? renderCanonicalJson(carrierValue)
        : renderCanonicalScalar(carrierValue as string | number | null)
    renderedLines.push(`${parameter.parameterName}=${renderedValue}\n`)
  }
  return renderedLines.join('')
}

function parseContentCarrier(rawText: string): ContentCarrierRecord[] {
  const parsedRecords: ContentCarrierRecord[] = []
  const textLines = rawText.split('\n')
  for (let lineIndex = 0; lineIndex < textLines.length; lineIndex += 1) {
    const rawLine = textLines[lineIndex]
    const trimmedLine = rawLine.trim()
    if (trimmedLine.length === 0) continue
    if (trimmedLine.startsWith('#') || trimmedLine.startsWith('//')) continue
    let parsedRecord: ContentCarrierRecord
    try {
      parsedRecord = JSON.parse(rawLine) as ContentCarrierRecord
    } catch (parseError) {
      fail(
        `content carrier line ${lineIndex + 1} is not valid JSON: ${
          (parseError as Error).message
        }`,
      )
    }
    parsedRecords.push(parsedRecord)
  }
  return parsedRecords
}

interface W14ManifestEntry {
  inventory_file_line: number
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
  anatomy: { muscle: string; role: string }[]
  aliases: unknown[]
  payload_fingerprint_sha256: string
}

// ── The historical run's six membership rows, DERIVED from the promoted
// EXLIB-2U staging package's own membership postcondition (bound by bytes
// below), never retyped: the exact governed-identity lines that package
// asserted after staging, and that the 2Z seal froze forever.
const HISTORICAL_RUN_PACKAGE_RELATIVE_PATH = 'docs/exlib2u-staged-run-package.sql'
const historicalRunPackageText = readRequiredFile(HISTORICAL_RUN_PACKAGE_RELATIVE_PATH)
const HISTORICAL_MEMBER_LINES: readonly string[] = Array.from(new Set(
  (historicalRunPackageText.match(/'(alias|exercise)#e21b2c00-0000-4000-a000-[0-9a-f]{12}(#[^']*)?'/g) ?? [])
    .map((literal) => literal.slice(1, -1)),
)).sort()
if (HISTORICAL_MEMBER_LINES.length !== 6
  || HISTORICAL_MEMBER_LINES.filter((l) => l.startsWith('exercise#')).length !== 3
  || HISTORICAL_MEMBER_LINES.filter((l) => l.startsWith('alias#')).length !== 3) {
  fail(`the promoted EXLIB-2U package does not yield exactly 3 exercise + 3 alias membership lines (got ${HISTORICAL_MEMBER_LINES.length})`)
}
for (const line of HISTORICAL_MEMBER_LINES) {
  const id = line.split('#')[1]
  if (GOVERNED_LOGICAL_IDS.includes(id) || DEFERRED_CARRY_LOGICAL_IDS.includes(id)) fail(`a historical member line names a five-entry or carry identity: ${line}`)
}

// ── Inputs ────────────────────────────────────────────────────────
const w14ManifestRawText = readRequiredFile(W14_MANIFEST_RELATIVE_PATH)
const w14Manifest = JSON.parse(w14ManifestRawText) as { entries: W14ManifestEntry[] }
const contentCarrierRawText = readRequiredFile(CONTENT_CARRIER_RELATIVE_PATH)
const contentCarrierRecords = parseContentCarrier(contentCarrierRawText)
// The carrier digest is what admit_catalog_content records as
// admitted_source_sha256 - a digest of the exact reviewed repository artifact.
// Bound over RAW BYTES, not the parsed records, so a whitespace or comment
// change voids it exactly as it would void the human review form.
const contentCarrierBinding = bindArtifactByBytes(CONTENT_CARRIER_RELATIVE_PATH)

if (w14Manifest.entries.length !== 5) {
  fail(`frozen W14 manifest has ${w14Manifest.entries.length} entries, expected 5`)
}
if (contentCarrierRecords.length !== 5) {
  fail(`content carrier has ${contentCarrierRecords.length} records, expected 5`)
}

const w14EntriesByLogicalId = new Map<string, W14ManifestEntry>()
for (const entry of w14Manifest.entries) {
  if (w14EntriesByLogicalId.has(entry.logical_id)) {
    fail(`frozen W14 manifest lists ${entry.logical_id} more than once`)
  }
  w14EntriesByLogicalId.set(entry.logical_id, entry)
}

const contentRecordsByLogicalId = new Map<string, ContentCarrierRecord>()
for (const record of contentCarrierRecords) {
  if (contentRecordsByLogicalId.has(record.logical_id)) {
    fail(`content carrier lists ${record.logical_id} more than once`)
  }
  contentRecordsByLogicalId.set(record.logical_id, record)
}

for (const carryLogicalId of DEFERRED_CARRY_LOGICAL_IDS) {
  if (contentRecordsByLogicalId.has(carryLogicalId)) {
    fail(`content carrier contains a DEFERRED carry identity: ${carryLogicalId}`)
  }
  if (w14EntriesByLogicalId.has(carryLogicalId)) {
    fail(`frozen W14 manifest contains a DEFERRED carry identity: ${carryLogicalId}`)
  }
}

// ── Per-identity manifest entries ─────────────────────────────────
const manifestEntries = GOVERNED_LOGICAL_IDS.map((logicalId) => {
  const snapshotEntry = w14EntriesByLogicalId.get(logicalId)
  if (snapshotEntry === undefined) {
    fail(`governed identity ${logicalId} is absent from the frozen W14 manifest`)
  }
  const contentRecord = contentRecordsByLogicalId.get(logicalId)
  if (contentRecord === undefined) {
    fail(`governed identity ${logicalId} has no content payload in the carrier`)
  }
  if (contentRecord.canonical_name !== snapshotEntry.canonical_name) {
    fail(
      `canonical_name disagreement for ${logicalId}: carrier says ` +
        `"${contentRecord.canonical_name}", frozen snapshot says ` +
        `"${snapshotEntry.canonical_name}"`,
    )
  }
  if (contentRecord.inventory_file_line !== snapshotEntry.inventory_file_line) {
    fail(`inventory_file_line disagreement for ${logicalId}`)
  }
  if (snapshotEntry.tracking_mode !== 'weight_time') {
    fail(`${logicalId} is not weight_time in the frozen snapshot; refusing`)
  }

  const contentCanonicalForm = buildContentCanonicalForm(contentRecord)
  const contentPayloadFingerprint = sha256Hex(contentCanonicalForm)

  return {
    inventory_file_line: snapshotEntry.inventory_file_line,
    canonical_name: snapshotEntry.canonical_name,
    logical_id: logicalId,
    content_id: contentRecord.content_id,
    content_version: contentRecord.content_version,

    existing_snapshot_fingerprint: {
      payload_fingerprint_sha256: snapshotEntry.payload_fingerprint_sha256,
      binding_note:
        'The snapshot payload fingerprint of the ALREADY-ADMITTED hosted snapshot, ' +
        'copied from the frozen W14 admission manifest which this manifest binds by ' +
        'bytes. It is NOT recomputed here, because recomputing it would silently ' +
        'redefine what W14 froze.',
      expected_pre_state: {
        review_status: 'pending',
        is_active: true,
        catalog_version: 1,
        reviewed_by: null,
        reviewed_at: null,
        review_rationale: null,
      },
      governed_fields: {
        category: snapshotEntry.category,
        primary_muscle: snapshotEntry.primary_muscle,
        equipment: snapshotEntry.equipment,
        laterality: snapshotEntry.laterality,
        tracking_mode: snapshotEntry.tracking_mode,
        provenance: snapshotEntry.provenance,
        movement_pattern: snapshotEntry.movement_pattern,
        training_role: snapshotEntry.training_role,
        difficulty: snapshotEntry.difficulty,
        availability: snapshotEntry.availability,
        source_url: snapshotEntry.source_url,
        source_page: snapshotEntry.source_page,
        retrieved_at: snapshotEntry.retrieved_at,
        import_confidence: snapshotEntry.import_confidence,
        anatomy: snapshotEntry.anatomy,
        aliases: snapshotEntry.aliases,
      },
    },

    candidate_content_payload: {
      authored_by: contentRecord.authored_by,
      authored_at: contentRecord.authored_at,
      setup_steps: contentRecord.setup_steps,
      execution_steps: contentRecord.execution_steps,
      breathing_cue: contentRecord.breathing_cue,
      common_mistakes: contentRecord.common_mistakes,
      safety_guidance: contentRecord.safety_guidance,
      equipment_setup: contentRecord.equipment_setup,
      accessibility_alternative: contentRecord.accessibility_alternative,
      expected_relationships: contentRecord.expected_relationships,
    },

    content_payload_fingerprint: {
      sha256: contentPayloadFingerprint,
      canonical_form: contentCanonicalForm,
      recomputation_command:
        'printf %s "<canonical_form>" | shasum -a 256   ' +
        '(the canonical form already ends in a newline; do not add one)',
    },

    human_decision_slots: {
      snapshot_review: {
        family: 'A',
        form: 'docs/weight-time-five-entry-snapshot-review-form.json',
        required_leaves: [
          'decision',
          'reviewer',
          'reviewer_role_or_credential',
          'reviewed_at',
          'rationale',
        ],
        optional_leaves: ['evidence'],
        filled: false,
        values: null,
      },
      content_review: {
        family: 'B',
        form: 'docs/weight-time-five-entry-content-review-form.json',
        required_leaves: [
          'decision',
          'reviewer',
          'reviewer_role_or_credential',
          'reviewed_at',
          'rationale',
        ],
        optional_leaves: ['evidence'],
        filled: false,
        values: null,
      },
    },

    expected_transitions: {
      snapshot_review: {
        stage: 1,
        mechanism: 'direct owner UPDATE on public.exercise_catalog',
        controlled_function: null,
        authority: 'table owner (postgres)',
        from: { review_status: 'pending', audit_fields: 'all NULL' },
        to: { review_status: 'approved', audit_fields: 'complete, non-blank' },
        side_effect: 'exactly ONE trigger-appended exercise_catalog_review_events row',
        one_use: 'pre-state assertion refuses a second application',
      },
      content_draft: {
        stage: 2,
        mechanism: 'load_catalog_content_draft',
        authority: 'exlib_catalog_loader',
        from: { content_row: 'absent' },
        to: {
          content_status: 'pending',
          publication_status: 'draft',
          import_admitted: false,
          audit_fields: 'all NULL',
          admission_fields: 'all NULL',
        },
        one_use: 'UNIQUE (logical_id, content_version) refuses a second load',
      },
      content_review: {
        stage: 3,
        mechanism: 'apply_content_review',
        authority: 'exlib_catalog_reviewer',
        from: { content_status: 'pending' },
        to: { content_status: 'approved', audit_fields: 'complete, non-blank' },
        must_travel_alone: true,
        one_use: 'one-way edge set refuses re-decision of a decided version',
      },
      content_admission: {
        stage: 4,
        mechanism: 'admit_catalog_content',
        authority: 'exlib_catalog_admission',
        from: { import_admitted: false, content_status: 'approved', publication_status: 'draft' },
        to: {
          import_admitted: true,
          admitted_source_sha256: 'the content carrier digest, known now',
          admitted_fingerprint:
            'exlib_content_admission_fingerprint recomputed by the database; NOT ' +
            'precomputable, because the manifest it hashes binds the human review tuple',
        },
        must_travel_alone: true,
        one_use: 'one-way; refuses an already-admitted version',
      },
      content_publication: {
        stage: 5,
        mechanism: 'publish_catalog_content',
        authority: 'exlib_catalog_admin',
        from: { publication_status: 'draft' },
        to: { publication_status: 'published' },
        side_effect:
          'atomic relationship projection swap for this identity; with an empty ' +
          'expected set the projected set becomes empty',
        must_travel_alone: true,
        one_use: 'one-way; at most one published version per logical identity',
      },
    },

    expected_delivery_run_membership: {
      member_kind: 'exercise',
      resolved_by: 'logical_id AND is_active = true',
      alias_members: 0,
      alias_members_reason: 'this identity carries no aliases',
    },

    expected_tenant_delivery_effect: {
      target_table: 'public.exercises',
      path: 'generic (non-Plank) insert path',
      name: snapshotEntry.canonical_name,
      category: snapshotEntry.category,
      primary_muscle: snapshotEntry.primary_muscle,
      equipment: snapshotEntry.equipment,
      exercise_type: 'strength',
      exercise_type_derivation:
        "the explicit WHEN 'weight_time' THEN 'strength' arm added by migration 028 " +
        'section D (Decision 3)',
      tracking_mode: 'weight_time',
      unilateral: false,
      unilateral_derivation: "(laterality <> 'bilateral') and laterality is bilateral",
      is_active: true,
      is_system: true,
      provenance_columns: ['catalog_id', 'catalog_logical_id', 'import_run_id'],
      exercise_muscles_rows: snapshotEntry.anatomy.length,
    },
  }
})

// ── Aggregate expectations ────────────────────────────────────────
const totalExpectedMuscleRows = manifestEntries.reduce(
  (runningTotal, entry) => runningTotal + entry.expected_tenant_delivery_effect.exercise_muscles_rows,
  0,
)

const manifestObject = {
  artifact: 'weight-time-five-entry-lifecycle-manifest',
  status: 'PREPARED - NOT REVIEWED, NOT EXECUTED, NOT DELIVERED',
  generated_by: 'scripts/generate-weight-time-five-entry-manifest.ts',
  determinism:
    'Regenerate with the generator and compare; --check exits non-zero on any drift. ' +
    'Every value is derived from a bound input, so this manifest is independently ' +
    'recomputable from the repository alone.',

  production_base: {
    commit: '54a9d128bca659ec89d3ae149d47450e74a2ad2e',
    tree: '0b438079693867fd1757cec383a2bc986b1c905c',
    note:
      'The published main this preparation descends from. Recorded, not verified ' +
      'against any remote: this generator spawns no network commands.',
  },

  boundary_statement: {
    hosted_supabase_contact: 'NONE',
    supabase_cli_invocation: 'NONE',
    vercel_contact: 'NONE',
    git_push: 'NONE',
    human_approval: 'NOT GIVEN, NOT INFERRED, NOT PREFILLED',
    execution: 'NONE - no package in this round has been executed anywhere hosted',
    delivery: 'NOT TRIGGERED',
  },

  scope: {
    identity_count: 5,
    governed_logical_ids: GOVERNED_LOGICAL_IDS,
    deferred_out_of_scope: {
      inventory_lines: [134, 135, 136],
      names: ["Farmer's carry", 'Suitcase carry', 'Sandbag bear-hug carry'],
      logical_ids: DEFERRED_CARRY_LOGICAL_IDS,
      assertion:
        'No carry identity appears in any content payload, package, run membership ' +
        'or delivery expectation in this round.',
    },
  },

  tracking_contract: {
    mode: 'weight_time',
    dimensions: ['added weight', 'duration'],
    reps: 'NOT TRACKED',
    scalar_score: 'NONE - the model is two-dimensional (Pareto), by design',
    unchanged_by_this_round: true,
  },

  fingerprint_scheme: {
    subject: 'candidate content payload per identity',
    algorithm: 'sha256 over UTF-8 bytes of the canonical form',
    canonical_form:
      'the thirteen load_catalog_content_draft arguments in migration-027 ' +
      'declaration order, each rendered as <parameter_name>=<value> followed by a ' +
      'newline, concatenated',
    parameter_order: CONTENT_DRAFT_PARAMETER_ORDER.map((p) => p.parameterName),
    null_rendering: NULL_RENDERING,
    json_rendering: 'compact JSON, keys sorted, no whitespace',
    independently_recomputable: true,
    recomputation_command: 'printf %s "<canonical_form>" | shasum -a 256',
    deliberately_mirrors:
      'the frozen W14 snapshot payload_fingerprint_scheme, so a reviewer fluent in ' +
      'that scheme needs no new rules here',
  },

  why_admission_fingerprints_are_absent:
    'exlib_content_admission_manifest binds the human review tuple (content_status, ' +
    'reviewed_by, reviewed_at as an epoch, review_rationale), so the admission ' +
    'fingerprint is NOT computable before the human content decision exists. This ' +
    'manifest therefore publishes payload fingerprints, which are computable now, and ' +
    'admitted_source_sha256, which is the carrier digest. Real admission fingerprints ' +
    'appear only inside the disposable local proof, under synthetic decisions that must ' +
    'never reach a governing production artifact.',

  human_decision_families: [
    {
      family: 'A',
      what: 'snapshot review',
      consumed_at_stage: 1,
      cardinality: 'once per identity (5)',
      form: 'docs/weight-time-five-entry-snapshot-review-form.json',
      filled: false,
    },
    {
      family: 'B',
      what: 'content review',
      consumed_at_stage: 3,
      cardinality: 'once per identity (5)',
      form: 'docs/weight-time-five-entry-content-review-form.json',
      filled: false,
    },
    {
      family: 'C',
      what: 'delivery run authority',
      consumed_at_stage: 6,
      cardinality: 'once for the run',
      form: 'docs/weight-time-five-entry-run-authority-form.json',
      filled: false,
    },
  ],

  package_sequence: [
    { ordinal: 1, stage: 'snapshot_review', needs_human_family: 'A', separation: 'sequential' },
    { ordinal: 2, stage: 'content_draft', needs_human_family: null, separation: 'sequential' },
    {
      ordinal: 3,
      stage: 'content_review',
      needs_human_family: 'B',
      separation: 'LOAD-BEARING: a review decision may not travel with a payload change',
    },
    {
      ordinal: 4,
      stage: 'content_admission',
      needs_human_family: null,
      separation: 'LOAD-BEARING: admission must travel alone',
    },
    {
      ordinal: 5,
      stage: 'content_publication',
      needs_human_family: null,
      separation: 'LOAD-BEARING: publication must travel alone',
    },
    { ordinal: 6, stage: 'run_staging', needs_human_family: 'C', separation: 'sequential' },
    {
      ordinal: 7,
      stage: 'run_seal',
      needs_human_family: null,
      separation: 'LOAD-BEARING: membership is permanent after the seal',
    },
  ],

  delivery_run: {
    proposed_run_key: PROPOSED_RUN_KEY,
    proposed_run_key_status:
      'PROPOSAL ONLY. run_key_literal is a human decision leaf in family C and is blank ' +
      'in the form. This value is a derivation offered for confirmation, not a choice made ' +
      'on the operator behalf.',
    derivation:
      'Mirrors the one promoted run key exlib2u-plank-release1-staged-v1 segment for ' +
      'segment: <staging milestone>-<subject>-release<N>-staged-v<M>. Here the staging ' +
      'milestone is the W14 endgame (w14e), the subject is weight-time, it is the first ' +
      'release of that subject, and it is v1.',
    length: PROPOSED_RUN_KEY.length,
    length_constraint: '8..200 after btrim',
    must_not_reuse: {
      forbidden_run_key: HISTORICAL_RUN_KEY,
      reason:
        'That key identifies the plank release and is UNIQUE forever. Reusing it is ' +
        'structurally impossible and was named a high-risk boundary by the governing ' +
        'instruction.',
    },
    dry_run_at_creation: false,
    dry_run_note:
      'Derived from the promoted staged-run package: the run is created with ' +
      'dry_run = false because the seal refuses a dry run and dry_run is immutable once ' +
      'sealed. Non-deliverability before sealing comes from approved_for_delivery = false ' +
      'and sealed_at IS NULL, which is proven by EVALUATING the delivery predicate, never ' +
      'by calling the delivery function.',
    approval_evidence_written_at: 'creation',
    approval_evidence_note:
      'Also derived from the promoted package: product/legal approval evidence is written ' +
      'in the run INSERT, not at seal time. exlib_approve_and_seal_run only validates it. ' +
      'That is why run staging requires the completed family C form.',
    design:
      'CUMULATIVE (independent review finding R-E1): the five are ADDITIVE, not a replacement. The ' +
      'new run carries forward all six membership rows of the sealed historical plank run and adds ' +
      'the five new identities. The historical run is never mutated, revoked or edited.',
    expected_membership: {
      exercise_members: 8,
      alias_members: 3,
      total_items: 11,
      carried_forward_from: HISTORICAL_RUN_KEY,
      carried_forward_members: HISTORICAL_MEMBER_LINES,
      exact_new_logical_ids: GOVERNED_LOGICAL_IDS,
      expected_member_lines: HISTORICAL_MEMBER_LINES.concat(GOVERNED_LOGICAL_IDS.map((id) => `exercise#${id}`)).sort(),
      contains_carry: false,
    },
    seal_preconditions_recheck: {
      note:
        'exlib_approve_and_seal_run re-checks every exercise member independently of ' +
        'stage 1, so a defective snapshot review surfaces here as a refusal.',
      per_member_required: [
        "review_status = 'approved'",
        'is_active = true',
        'reviewed_by non-blank',
        'review_rationale non-blank',
      ],
      not_checked_by_seal: 'reviewed_at (the catalog review-audit CHECK covers it instead)',
    },
  },

  expected_delivery_effect: {
    function: 'deliver_catalog_exercises',
    definition_source: 'migration 028 section D (migration 026 body plus the explicit weight_time arms)',
    plank_gate_armed: true,
    plank_gate_reasoning:
      "the cumulative run carries the historical Plank member (lower(canonical_name) = 'plank'), so the " +
      'Plank reconciliation dispatch of migration 026 is ARMED for this run; the five new identities take the generic insert path',
    derivation_note:
      'every counter below is derived by reading the committed function body; the disposable proof ' +
      'asserts each summary against the live database, which is the oracle',
    case_fresh_user_zero_rows: {
      description: 'a user with NO exercises (delivery-first initialization; no seed row exists to reconcile)',
      summary: {
        eligible: 8, inserted: 8, skipped_already_delivered: 0, skipped_name_collision: 0, collision_names: [],
        alias_inserted: 3, alias_added_to_existing: 0, alias_already_delivered: 0, alias_skipped_no_exercise: 0,
        alias_skipped_inactive_exercise: 0, alias_skipped_collision: 0, inserted_catalog_logical_id_count: 8,
        plank_disposition: 'delivered_canonical_timed_plank',
      },
      accounting_offset: 0,
      new_weight_time_exercise_muscles_rows: totalExpectedMuscleRows,
      repeat: 'a second and third delivery skip all eight (skipped_already_delivered 8, alias_already_delivered 3, plank_disposition already_valid_idempotent)',
    },
    case_pristine_legacy_seed_user: {
      description: 'a user carrying the original untouched bodyweight Plank seed with its obliques:secondary anatomy and no other catalog rows',
      summary: {
        eligible: 8, inserted: 7, skipped_already_delivered: 0, skipped_name_collision: 0, collision_names: [],
        alias_inserted: 1, alias_added_to_existing: 2, alias_already_delivered: 0, alias_skipped_no_exercise: 0,
        alias_skipped_inactive_exercise: 0, alias_skipped_collision: 0, inserted_catalog_logical_id_count: 7,
        plank_disposition: 'corrected_and_linked_pristine_seed',
      },
      accounting_offset: 1,
    },
    case_existing_plank_user_from_historical_run: {
      description: 'a user who ALREADY received the plank release through exlib2u-plank-release1-staged-v1',
      before_migration_029:
        'REFUSED (finding F-E8, measured in C1): the existing Plank link carries the HISTORICAL run id and ' +
        'the migration-026 helper demanded import_run_id = THIS run, so the existing-link path raised ' +
        '"inconsistent prior Plank reconciliation requires separate investigation" and rolled back.',
      after_migration_029: {
        summary: {
          eligible: 8, inserted: 5, skipped_already_delivered: 3, skipped_name_collision: 0, collision_names: [],
          alias_inserted: 0, alias_added_to_existing: 0, alias_already_delivered: 3, alias_skipped_no_exercise: 0,
          alias_skipped_inactive_exercise: 0, alias_skipped_collision: 0, inserted_catalog_logical_id_count: 5,
          plank_disposition: 'already_valid_idempotent',
        },
        accounting_offset: 0,
        preserved: 'the Plank row keeps its HISTORICAL import_run_id (provenance is never rewritten); no duplicate Plank, Dead bug or Ab wheel row; the three aliases are not duplicated',
        repeat: 'a second and third delivery: skipped_already_delivered 8, alias_already_delivered 3, inserted 0',
        requires: 'migration 029 live and verified (READ STATE FIRST via the probe row migration_029_plank_cross_run_idempotency = APPLIED)',
      },
    },
  },

  migration_029: {
    path: 'supabase/migrations/029_exlib_plank_cross_run_idempotency.sql',
    status: 'PREPARED - NOT APPLIED hosted; applied only on disposable local clusters',
    fixes: 'F-E8: exlib_plank_link_valid (migration 026, called from both paths of the migration-028 delivery body) required import_run_id = the delivering run',
    new_rule:
      'the existing Plank link is valid when its import_run_id is THIS run, OR identifies a PRIOR run that exists, ' +
      'is approved_for_delivery, non-dry, sealed, unrevoked AND carries EXACTLY p_cat_id in its membership. The exact ' +
      'snapshot is the compatibility boundary; a different snapshot of the same logical identity does not qualify.',
    unchanged: 'every non-provenance invariant, the signature, SECURITY DEFINER, the internal-only posture, the lock discipline; deliver_catalog_exercises is not redefined',
    hosted_order_dependency:
      'MUST be live and verified BEFORE the run-key repoint (stage 8) and before any user receives the cumulative run. ' +
      'NOT a precondition of stages 1-7: none of the seven packages calls the helper. Least coupled safe order: ' +
      'stages 1-7 in either order relative to 029; 029 strictly before stage 8.',
    spent_check: 'docs/weight-time-five-entry-read-state.sql row migration_029_plank_cross_run_idempotency (APPLIED / NOT_APPLIED / MIXED); never re-run blind',
    verifiers: ['scripts/verify-weight-time-migration-029.ts', 'scripts/verify-weight-time-migration-029-live.sh'],
  },

  delivery_configuration_dependency: {
    required: true,
    proven_from: 'src/lib/supabase/deliver-catalog.ts and the UNIQUE run_key column',
    variable: 'CATALOG_DELIVERY_RUN_KEY',
    current_value_configured_in_production: HISTORICAL_RUN_KEY,
    current_value_provenance: 'OPERATOR-SUPPLIED via the EXLIB-3A activation record; not verified here',
    why:
      'the application reads ONE scalar run key and passes it straight to the RPC, and ' +
      'run_key is UNIQUE, so exactly one run is deliverable per deployment',
    claude_performed_the_change: false,
    detail_document: 'docs/weight-time-five-entry-delivery-configuration-dependency.md',
  },

  hosted_pre_state: {
    provenance:
      'OPERATOR-SUPPLIED via docs/weight-time-w14-hosted-application-record.md (bound by bytes ' +
      'below). Never read from hosted by Claude. The disposable proof rebuilds this exact ' +
      'vector by replaying the spent package chain 2K, 2O, 2P, 2Q, 2R, 2Y, 2U, 2Z and W14.',
    vector_order: [
      'exercise_catalog_logical', 'exercise_catalog', 'exercise_catalog_muscles',
      'exercise_catalog_aliases', 'exercise_catalog_name_claims', 'exercise_catalog_content',
      'exercise_catalog_content_expected_relationships', 'exercise_catalog_relationships',
      'exercise_catalog_import_runs', 'exercise_catalog_run_items', 'exercise_catalog_review_events',
    ],
    vector: HOSTED_PRE_STATE_VECTOR,
    five_targets: 'each pending, active, catalog_version 1, all three review-audit fields NULL; 0 content versions, 0 review events, 0 run items, 0 tenant rows',
    historical_run: {
      run_key: HISTORICAL_RUN_KEY,
      posture: 'sealed, approved, dry_run false, unrevoked; 3 exercise members + 3 alias members; MUST be byte-identical after every package',
      members: HISTORICAL_MEMBER_LINES,
      members_source: HISTORICAL_RUN_PACKAGE_RELATIVE_PATH,
      members_note:
        'governed-identity lines (exercise#<logical_id> / alias#<logical_id>#<alias>) parsed from the ' +
        'promoted staging package\'s membership postcondition; the cumulative stage-6 package refuses ' +
        'unless the live historical run still resolves to exactly these six, then COPIES its rows',
    },
    authority_baseline:
      'each of exlib_catalog_loader / exlib_catalog_reviewer / exlib_catalog_admission / ' +
      'exlib_catalog_admin carries exactly one membership: postgres granted BY supabase_admin, ' +
      'ADMIN TRUE, INHERIT FALSE, SET FALSE',
  },

  stage_vectors: STAGE_VECTORS,

  stage_packages: STAGE_PACKAGE_PATHS.map((relativePath, index) => ({
    stage: index + 1,
    path: relativePath,
    generated_by: 'scripts/generate-weight-time-five-entry-packages.ts',
    rendering_rule:
      'rendered as a NON-EXECUTABLE TEMPLATE while any human decision leaf is null; rendered ' +
      'executable only from COMPLETED forms, by the same generator, in a later commit',
  })),

  admission_source_sha256: {
    value: contentCarrierBinding.sha256,
    bytes: contentCarrierBinding.bytes,
    meaning:
      'the third argument of every admit_catalog_content call: the SHA-256 of the exact reviewed ' +
      'content carrier bytes (comments included). A byte change to the carrier changes this ' +
      'value and voids the content-review form.',
  },

  bound_artifacts: BOUND_ARTIFACT_RELATIVE_PATHS.map((relativePath) =>
    bindArtifactByBytes(relativePath),
  ),

  entries: manifestEntries,
}

// ── Emit or check ─────────────────────────────────────────────────
const renderedManifest = `${JSON.stringify(manifestObject, null, 2)}\n`

// Fail closed if any human decision leaf somehow acquired a value.
for (const entry of manifestEntries) {
  for (const [slotName, slot] of Object.entries(entry.human_decision_slots)) {
    if (slot.filled !== false || slot.values !== null) {
      fail(
        `human decision leaf ${slotName} for ${entry.logical_id} is not blank; ` +
          'this generator may never fill one',
      )
    }
  }
}

const isCheckMode = process.argv.includes('--check')
const outputAbsolutePath = absolutePathOf(OUT_RELATIVE_PATH)

if (isCheckMode) {
  if (!existsSync(outputAbsolutePath)) {
    fail(`--check: ${OUT_RELATIVE_PATH} does not exist`)
  }
  const onDiskManifest = readFileSync(outputAbsolutePath, 'utf8')
  if (onDiskManifest !== renderedManifest) {
    process.stderr.write(
      `FATAL: --check: ${OUT_RELATIVE_PATH} differs from a fresh generation.\n` +
        `  on disk:    ${onDiskManifest.length} bytes, sha256 ${sha256Hex(onDiskManifest)}\n` +
        `  regenerated: ${renderedManifest.length} bytes, sha256 ${sha256Hex(renderedManifest)}\n` +
        '  Either an input drifted or the manifest was hand-edited. Regenerate.\n',
    )
    process.exit(1)
  }
  process.stdout.write(
    `MANIFEST CHECK OK  ${OUT_RELATIVE_PATH}  ` +
      `${renderedManifest.length} bytes  sha256 ${sha256Hex(renderedManifest)}\n`,
  )
  process.exit(0)
}

writeFileSync(outputAbsolutePath, renderedManifest, 'utf8')
process.stdout.write(
  `wrote ${OUT_RELATIVE_PATH}\n` +
    `  bytes  ${renderedManifest.length}\n` +
    `  sha256 ${sha256Hex(renderedManifest)}\n` +
    `  entries ${manifestEntries.length}\n`,
)
for (const entry of manifestEntries) {
  process.stdout.write(
    `  ${entry.inventory_file_line} ${entry.canonical_name.padEnd(24)} ` +
      `content_fp ${entry.content_payload_fingerprint.sha256}\n`,
  )
}
