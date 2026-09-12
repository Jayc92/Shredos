// ============================================================
// ForgeFitOS — weight_time five-entry endgame: PACKAGE GENERATOR.
//
// Renders the SEVEN one-use hosted packages of the post-W14 lifecycle for the
// five weight_time identities, plus the reviewer-facing human review page,
// from exactly three inputs, none of which is typed here:
//
//   * docs/weight-time-five-entry-lifecycle-manifest.json - snapshot truth,
//     content payloads, per-stage vectors (generated; bound by bytes);
//   * the three human decision forms (families A, B, C);
//   * the committed governance whose signatures the static verifier pins.
//
// THE HUMAN DECISION BOUNDARY, MECHANIZED. A family whose leaves are ALL null
// is UNRESOLVED; a family whose leaves are ALL present is RESOLVED; anything in
// between is a FATAL error, because a partially completed decision is not a
// decision. A stage renders as an EXECUTABLE package only when every family it
// depends on is RESOLVED. Otherwise it renders as a TEMPLATE that is
// non-executable BY CONSTRUCTION: every human leaf is an UNQUOTED
// <<UNRESOLVED:...>> token (a syntax error, never a string that could land in a
// column), the first statement after BEGIN is a deliberate syntax error, and
// the precondition block raises before any read. This generator never fills a
// leaf, never defaults one, and never infers an approval.
//
// TEST-ONLY MODE. The disposable local proof needs executable packages under
// synthetic decisions. A form set whose files carry
// test_only_synthetic_decisions = true and whose every human string contains
// the marker TEST-ONLY renders in test mode, which (1) REFUSES to write under
// the repository's docs/ directory, (2) injects a fixture guard into every
// package that refuses to run unless the disposable-fixture marker relation
// exists, and (3) permits FIVE_ENTRY_VARIANT negative-control renderings. Real
// decisions may never carry the marker, and variants are refused outside test
// mode.
//
// Run from the repository root:
//   npx tsx scripts/generate-weight-time-five-entry-packages.ts          # write
//   npx tsx scripts/generate-weight-time-five-entry-packages.ts --check  # verify
// Environment (the disposable proof uses these; a real rendering uses none):
//   FIVE_ENTRY_FORMS_DIR   directory holding the three forms (default: docs)
//   FIVE_ENTRY_OUT_DIR     output directory (default: docs/weight-time-five-entry-packages)
//   FIVE_ENTRY_VARIANT     negative-control variant name (test mode only)
//
// Never contacts Supabase, Vercel, or any remote service. Never invokes the
// Supabase CLI. Reads and writes local files only.
// ============================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'

const REPO_ROOT: string = process.cwd()
const MANIFEST_RELATIVE_PATH = 'docs/weight-time-five-entry-lifecycle-manifest.json'
const DEFAULT_FORMS_DIRECTORY = 'docs'
const DEFAULT_OUT_DIRECTORY = 'docs/weight-time-five-entry-packages'
const HUMAN_REVIEW_RELATIVE_PATH = 'docs/weight-time-five-entry-human-review.md'
const FORM_FILE_NAMES = {
  A: 'weight-time-five-entry-snapshot-review-form.json',
  B: 'weight-time-five-entry-content-review-form.json',
  C: 'weight-time-five-entry-run-authority-form.json',
} as const

const TEST_ONLY_MARKER = 'TEST-ONLY'
const FIXTURE_GUARD_RELATION = 'exlib_disposable_fixture.marker'
const HISTORICAL_RUN_KEY = 'exlib2u-plank-release1-staged-v1'
const SUPABASE_PROJECT_REF = 'ttybyljytiwntvorugcv'

// The eleven gated tables, alphabetical, exactly as every promoted package
// locks and counts them.
const GATED_TABLES: readonly string[] = [
  'public.exercise_catalog',
  'public.exercise_catalog_aliases',
  'public.exercise_catalog_content',
  'public.exercise_catalog_content_expected_relationships',
  'public.exercise_catalog_import_runs',
  'public.exercise_catalog_logical',
  'public.exercise_catalog_muscles',
  'public.exercise_catalog_name_claims',
  'public.exercise_catalog_relationships',
  'public.exercise_catalog_review_events',
  'public.exercise_catalog_run_items',
]
const VECTOR_TABLES: readonly string[] = [
  'exercise_catalog_logical', 'exercise_catalog', 'exercise_catalog_muscles',
  'exercise_catalog_aliases', 'exercise_catalog_name_claims', 'exercise_catalog_content',
  'exercise_catalog_content_expected_relationships', 'exercise_catalog_relationships',
  'exercise_catalog_import_runs', 'exercise_catalog_run_items', 'exercise_catalog_review_events',
]
const CATALOG_ROLES: readonly string[] = [
  'exlib_catalog_loader', 'exlib_catalog_reviewer', 'exlib_catalog_admission', 'exlib_catalog_admin',
]

function fail(message: string): never {
  process.stderr.write(`FATAL: ${message}\n`)
  process.exit(1)
}
function sha256Hex(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}
function readJson<T>(absolutePath: string): T {
  if (!existsSync(absolutePath)) fail(`required input is missing: ${absolutePath}`)
  return JSON.parse(readFileSync(absolutePath, 'utf8')) as T
}

// ── Manifest shape (only the fields this generator consumes) ─────────
interface GovernedSnapshotFields {
  category: string; primary_muscle: string; equipment: string; laterality: string
  tracking_mode: string; provenance: string; movement_pattern: string; training_role: string
  difficulty: string; availability: string; source_url: string | null; source_page: string | null
  retrieved_at: string | null; import_confidence: string | null
  anatomy: { muscle: string; role: string }[]; aliases: string[]
}
interface ContentPayload {
  authored_by: string; authored_at: string; setup_steps: string[]; execution_steps: string[]
  breathing_cue: string; common_mistakes: string[]; safety_guidance: string
  equipment_setup: string; accessibility_alternative: string
  expected_relationships: { relation: string; to_logical_id: string }[]
}
interface ManifestEntry {
  inventory_file_line: number; canonical_name: string; logical_id: string
  content_id: string; content_version: number
  existing_snapshot_fingerprint: { governed_fields: GovernedSnapshotFields; payload_fingerprint_sha256: string }
  candidate_content_payload: ContentPayload
  content_payload_fingerprint: { sha256: string }
}
interface StageVector { stage: number; name: string; before: string; after: string; moves: string }
interface Manifest {
  production_base: { commit: string; tree: string }
  hosted_pre_state: { vector: string; historical_run: { run_key: string } }
  stage_vectors: StageVector[]
  stage_packages: { stage: number; path: string }[]
  admission_source_sha256: { value: string; bytes: number }
  delivery_run: { proposed_run_key: string; must_not_reuse: { forbidden_run_key: string } }
  scope: { deferred_out_of_scope: { logical_ids: string[]; names: string[] } }
  bound_artifacts: { path: string; bytes: number; sha256: string }[]
  entries: ManifestEntry[]
}

// ── Decision families ────────────────────────────────────────────────
interface FamilyADecision { reviewer: string; reviewerRole: string; reviewedAt: string; rationale: string; evidence: string | null }
interface FamilyBDecision { reviewer: string; reviewerRole: string; reviewedAt: string; rationale: string; evidence: string | null }
interface FamilyCDecision {
  runKey: string; productApprovedBy: string; productApprovedAt: string
  legalApprovedBy: string; legalApprovedAt: string; approvalRationale: string
}
type Resolution<T> = { state: 'UNRESOLVED'; leaves: string[] } | { state: 'RESOLVED'; value: T; leaves: string[] }

// The three forms, typed as loosely as they are read: every human leaf is
// `unknown` until the classifier decides it is blank or a validated value.
interface FormAEntry { inventory_file_line: number; canonical_name: string; logical_id: string; human_fields?: Record<string, unknown> }
interface FormA { test_only_synthetic_decisions?: boolean; entries?: FormAEntry[] }
interface FormBEntry {
  [leaf: string]: unknown
  inventory_file_line: number; canonical_name: string; logical_id: string; content_id: string; content_version: number
  needs_human_judgment_confirmations?: Record<string, unknown>
}
interface FormB { test_only_synthetic_decisions?: boolean; content_fingerprint?: { sha256?: string; bytes?: number }; entries?: FormBEntry[] }
interface FormC {
  test_only_synthetic_decisions?: boolean
  requested_inputs?: {
    run_key_literal?: { value?: unknown }
    product_approver_identity?: { value?: unknown; product_approved_at?: unknown }
    legal_approver_identity?: { value?: unknown; legal_approved_at?: unknown }
    approval_rationale?: { value?: unknown }
    run_membership?: { value?: unknown; exact_logical_ids?: string[] }
  }
}

// Whole seconds, or at most milliseconds: the admission fingerprint binds the
// review instant as extract(epoch ...)::numeric::text, and this generator
// reproduces that text from a JavaScript instant, which has no sub-millisecond
// precision. Refusing finer input keeps the precomputed fingerprint exact.
const ISO_OFFSET_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?([+-]\d{2}:\d{2}|Z)$/
const LOWER_HEX_64 = /^[0-9a-f]{64}$/
const UUID_SHAPE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

function isBlank(value: unknown): boolean {
  return value === null || value === undefined
}
function requireNonBlankString(value: unknown, label: string, minimumLength: number): string {
  if (typeof value !== 'string' || value.trim().length < minimumLength) {
    fail(`${label} must be a string of at least ${minimumLength} non-blank characters`)
  }
  return value
}
function requireTimestamp(value: unknown, label: string): string {
  if (typeof value !== 'string' || !ISO_OFFSET_TIMESTAMP.test(value)) {
    fail(`${label} must be an ISO-8601 date-time WITH an explicit offset and at most millisecond precision (e.g. 2026-09-12T10:00:00-04:00)`)
  }
  if (Number.isNaN(Date.parse(value))) fail(`${label} is not a parseable instant`)
  return value
}

/** ALL-null or ALL-present; anything else is fatal. Returns the leaf names for template tokens. */
function classifyLeaves(leaves: Record<string, unknown>, where: string): 'UNRESOLVED' | 'RESOLVED' {
  const names = Object.keys(leaves)
  const blank = names.filter((n) => isBlank(leaves[n]))
  if (blank.length === names.length) return 'UNRESOLVED'
  if (blank.length === 0) return 'RESOLVED'
  fail(`${where}: a PARTIALLY completed decision is not a decision (blank: ${blank.join(', ')}; filled: ${names.filter((n) => !isBlank(leaves[n])).join(', ')})`)
}

function resolveFamilyA(form: FormA, entries: ManifestEntry[]): Map<string, Resolution<FamilyADecision>> {
  const out = new Map<string, Resolution<FamilyADecision>>()
  if (!Array.isArray(form.entries) || form.entries.length !== 5) fail('family A form must carry exactly five entries')
  const formEntries: FormAEntry[] = form.entries
  for (const entry of entries) {
    const formEntry = formEntries.find((e) => e.logical_id === entry.logical_id)
    if (!formEntry) fail(`family A form has no entry for ${entry.logical_id}`)
    if (formEntry.inventory_file_line !== entry.inventory_file_line || formEntry.canonical_name !== entry.canonical_name) {
      fail(`family A form entry ${entry.logical_id} disagrees with the manifest on line/name`)
    }
    const h = formEntry.human_fields ?? {}
    const leafNames = ['decision', 'reviewer', 'reviewer_role_or_credential', 'reviewed_at', 'rationale']
    const leaves: Record<string, unknown> = {}
    for (const n of leafNames) leaves[n] = h[n]
    const tokenLeaves = leafNames.map((n) => `A.${entry.inventory_file_line}.${n}`)
    if (classifyLeaves(leaves, `family A, line ${entry.inventory_file_line}`) === 'UNRESOLVED') {
      if (!isBlank(h.evidence)) fail(`family A, line ${entry.inventory_file_line}: evidence is filled while the decision is blank`)
      out.set(entry.logical_id, { state: 'UNRESOLVED', leaves: tokenLeaves })
      continue
    }
    if (h.decision !== 'APPROVE') {
      fail(`family A, line ${entry.inventory_file_line}: decision is ${JSON.stringify(h.decision)}; only APPROVE has a prepared package. REJECT and CORRECT end the release for that identity and need their own instruction`)
    }
    out.set(entry.logical_id, {
      state: 'RESOLVED',
      leaves: tokenLeaves,
      value: {
        reviewer: requireNonBlankString(h.reviewer, `family A line ${entry.inventory_file_line} reviewer`, 3),
        reviewerRole: requireNonBlankString(h.reviewer_role_or_credential, `family A line ${entry.inventory_file_line} reviewer_role_or_credential`, 1),
        reviewedAt: requireTimestamp(h.reviewed_at, `family A line ${entry.inventory_file_line} reviewed_at`),
        rationale: requireNonBlankString(h.rationale, `family A line ${entry.inventory_file_line} rationale`, 10),
        evidence: isBlank(h.evidence) ? null : String(h.evidence),
      },
    })
  }
  return out
}

function resolveFamilyB(form: FormB, entries: ManifestEntry[], carrierSha: string): Map<string, Resolution<FamilyBDecision>> {
  const out = new Map<string, Resolution<FamilyBDecision>>()
  if (!Array.isArray(form.entries) || form.entries.length !== 5) fail('family B form must carry exactly five entries')
  if (form.content_fingerprint?.sha256 !== carrierSha) {
    fail(`family B form binds content carrier sha256 ${form.content_fingerprint?.sha256}, but the manifest's carrier digest is ${carrierSha}; the form is VOID and must be regenerated`)
  }
  const formEntries: FormBEntry[] = form.entries
  for (const entry of entries) {
    const f = formEntries.find((e) => e.logical_id === entry.logical_id)
    if (!f) fail(`family B form has no entry for ${entry.logical_id}`)
    if (f.content_id !== entry.content_id || f.content_version !== entry.content_version
      || f.inventory_file_line !== entry.inventory_file_line || f.canonical_name !== entry.canonical_name) {
      fail(`family B form entry ${entry.logical_id} disagrees with the manifest on content id/version/line/name`)
    }
    const confirmations = f.needs_human_judgment_confirmations ?? {}
    const confirmationNames = Object.keys(confirmations)
    if (confirmationNames.length < 5) fail(`family B, line ${entry.inventory_file_line}: the confirmation set is too small to be the promoted shape`)
    const leafNames = ['decision', 'reviewer', 'reviewer_role_or_credential', 'reviewed_at', 'rationale']
    const leaves: Record<string, unknown> = {}
    for (const n of leafNames) leaves[n] = f[n]
    for (const n of confirmationNames) leaves[`confirm:${n}`] = confirmations[n]
    const tokenLeaves = leafNames.map((n) => `B.${entry.inventory_file_line}.${n}`)
      .concat(confirmationNames.map((n) => `B.${entry.inventory_file_line}.confirm.${n}`))
    if (classifyLeaves(leaves, `family B, line ${entry.inventory_file_line}`) === 'UNRESOLVED') {
      if (!isBlank(f.evidence)) fail(`family B, line ${entry.inventory_file_line}: evidence is filled while the decision is blank`)
      out.set(entry.logical_id, { state: 'UNRESOLVED', leaves: tokenLeaves })
      continue
    }
    if (f.decision !== 'approved') {
      fail(`family B, line ${entry.inventory_file_line}: decision is ${JSON.stringify(f.decision)}; only approved has a prepared package. revised and rejected require a NEW content version and their own instruction`)
    }
    for (const n of confirmationNames) {
      if (confirmations[n] !== true) fail(`family B, line ${entry.inventory_file_line}: confirmation ${n} is ${JSON.stringify(confirmations[n])} while the decision is approved; an approval with an unconfirmed judgment is incoherent`)
    }
    out.set(entry.logical_id, {
      state: 'RESOLVED',
      leaves: tokenLeaves,
      value: {
        reviewer: requireNonBlankString(f.reviewer, `family B line ${entry.inventory_file_line} reviewer`, 3),
        reviewerRole: requireNonBlankString(f.reviewer_role_or_credential, `family B line ${entry.inventory_file_line} reviewer_role_or_credential`, 1),
        reviewedAt: requireTimestamp(f.reviewed_at, `family B line ${entry.inventory_file_line} reviewed_at`),
        rationale: requireNonBlankString(f.rationale, `family B line ${entry.inventory_file_line} rationale`, 10),
        evidence: isBlank(f.evidence) ? null : String(f.evidence),
      },
    })
  }
  return out
}

function resolveFamilyC(form: FormC, manifest: Manifest): Resolution<FamilyCDecision> {
  const r = form.requested_inputs ?? {}
  const leaves: Record<string, unknown> = {
    run_key_literal: r.run_key_literal?.value,
    product_approver_identity: r.product_approver_identity?.value,
    product_approved_at: r.product_approver_identity?.product_approved_at,
    legal_approver_identity: r.legal_approver_identity?.value,
    legal_approved_at: r.legal_approver_identity?.legal_approved_at,
    approval_rationale: r.approval_rationale?.value,
    run_membership: r.run_membership?.value,
  }
  const tokenLeaves = Object.keys(leaves).map((n) => `C.${n}`)
  if (classifyLeaves(leaves, 'family C') === 'UNRESOLVED') return { state: 'UNRESOLVED', leaves: tokenLeaves }
  const runKey = requireNonBlankString(leaves.run_key_literal, 'family C run_key_literal', 8)
  if (runKey.trim().length > 200) fail('family C run_key_literal exceeds 200 characters after btrim')
  if (runKey !== runKey.trim() || !/^[A-Za-z0-9._-]+$/.test(runKey)) {
    fail('family C run_key_literal must be free of whitespace and quoting characters: it is later bound byte-for-byte by an environment variable')
  }
  if (runKey === HISTORICAL_RUN_KEY || runKey === manifest.delivery_run.must_not_reuse.forbidden_run_key) {
    fail(`family C run_key_literal reuses the historical plank release key ${HISTORICAL_RUN_KEY}; refusing`)
  }
  if (leaves.run_membership !== 'ALL_FIVE_WEIGHT_TIME_IDENTITIES') {
    fail(`family C run_membership must be the one offered choice ALL_FIVE_WEIGHT_TIME_IDENTITIES, got ${JSON.stringify(leaves.run_membership)}`)
  }
  const expectedIds = (r.run_membership?.exact_logical_ids ?? []) as string[]
  const governed = manifest.entries.map((e) => e.logical_id)
  if (JSON.stringify([...expectedIds].sort()) !== JSON.stringify([...governed].sort())) {
    fail('family C run_membership.exact_logical_ids disagrees with the manifest\'s five governed identities')
  }
  return {
    state: 'RESOLVED',
    leaves: tokenLeaves,
    value: {
      runKey,
      productApprovedBy: requireNonBlankString(leaves.product_approver_identity, 'family C product_approver_identity', 3),
      productApprovedAt: requireTimestamp(leaves.product_approved_at, 'family C product_approved_at'),
      legalApprovedBy: requireNonBlankString(leaves.legal_approver_identity, 'family C legal_approver_identity', 3),
      legalApprovedAt: requireTimestamp(leaves.legal_approved_at, 'family C legal_approved_at'),
      approvalRationale: requireNonBlankString(leaves.approval_rationale, 'family C approval_rationale', 10),
    },
  }
}

// ── SQL rendering helpers ────────────────────────────────────────────
function dollarQuote(tag: string, text: string): string {
  const delimiter = `$${tag}$`
  if (text.includes(delimiter)) fail(`a text value contains its own dollar-quote delimiter ${delimiter}; choose another tag`)
  return `${delimiter}${text}${delimiter}`
}
function uuidLiteral(value: string): string {
  if (!UUID_SHAPE.test(value)) fail(`not a lowercase UUID: ${value}`)
  return `'${value}'`
}
function timestampLiteral(value: string): string {
  return `TIMESTAMPTZ '${value}'`
}
function dateLiteral(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) fail(`not a date: ${value}`)
  return `DATE '${value}'`
}
function textOrNullLiteral(tag: string, value: string | null): string {
  return value === null ? 'NULL' : dollarQuote(tag, value)
}
function jsonbLiteral(tag: string, value: unknown): string {
  return `${dollarQuote(tag, JSON.stringify(value))}::jsonb`
}
function token(leaf: string): string {
  return `<<UNRESOLVED:${leaf}>>`
}
function anatomyLine(anatomy: { muscle: string; role: string }[]): string {
  return [...anatomy].sort((a, b) => (a.muscle < b.muscle ? -1 : a.muscle > b.muscle ? 1 : 0))
    .map((r) => `${r.muscle}:${r.role}`).join(',')
}
function vectorSql(indent: string): string {
  return VECTOR_TABLES.map((t, i) => `${indent}${i === 0 ? '' : "|| '/' || "}(SELECT count(*) FROM public.${t})::text`).join('\n')
}
function lockStatement(): string {
  return `LOCK TABLE\n${GATED_TABLES.map((t) => `  ${t}`).join(',\n')}\n  IN SHARE ROW EXCLUSIVE MODE;`
}

/** PostgreSQL's jsonb text output for a JSON array of plain strings: elements joined by ", ". */
function pgJsonbArrayText(values: string[]): string {
  return `[${values.map((v) => JSON.stringify(v)).join(', ')}]`
}
/** 'S' + hex(utf8) or 'N' - migration 027's exlib_manifest_hex. */
function manifestHex(value: string | null): string {
  return value === null ? 'N' : `S${Buffer.from(value, 'utf8').toString('hex')}`
}
function dayOffset(isoDate: string): number {
  return Math.round((Date.parse(`${isoDate}T00:00:00Z`) - Date.parse('1970-01-01T00:00:00Z')) / 86400000)
}
/** extract(epoch FROM timestamptz)::numeric::text - six fractional digits on PostgreSQL 14+. */
function epochNumericText(isoTimestamp: string): string {
  const milliseconds = Date.parse(isoTimestamp)
  const wholeSeconds = Math.floor(milliseconds / 1000)
  const fractionalMicros = Math.round((milliseconds - wholeSeconds * 1000) * 1000)
  return `${wholeSeconds}.${String(fractionalMicros).padStart(6, '0')}`
}
/**
 * migration 027's exlib_content_admission_manifest v2, recomputed in TypeScript
 * from the same bound state, so the admission fingerprint the database will
 * compute is known BEFORE the hosted act and can be pinned. The disposable proof
 * requires equality with the database's own computation.
 */
function expectedAdmissionManifest(entry: ManifestEntry, decision: FamilyBDecision): string {
  const s = entry.existing_snapshot_fingerprint.governed_fields
  const c = entry.candidate_content_payload
  const anatomy = [...s.anatomy].sort((a, b) => Buffer.compare(Buffer.from(a.muscle), Buffer.from(b.muscle)))
  const aliases = [...s.aliases].sort((a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b)))
  const relationships = [...c.expected_relationships].sort((a, b) =>
    Buffer.compare(Buffer.from(a.relation), Buffer.from(b.relation)) || (a.to_logical_id < b.to_logical_id ? -1 : a.to_logical_id > b.to_logical_id ? 1 : 0))
  const lines: string[] = []
  lines.push('EXLIB-ADMISSION-MANIFEST v2')
  lines.push(`identity ${entry.logical_id}`)
  lines.push(['snapshot 1', manifestHex(entry.canonical_name), manifestHex(s.category), manifestHex(s.primary_muscle),
    manifestHex(s.equipment), manifestHex(s.laterality), manifestHex(s.tracking_mode), manifestHex(s.provenance),
    manifestHex(s.movement_pattern), manifestHex(s.training_role), manifestHex(s.difficulty), manifestHex(s.availability),
    manifestHex(s.source_url), manifestHex(s.source_page),
    s.retrieved_at === null ? 'N' : String(dayOffset(s.retrieved_at)), manifestHex(s.import_confidence)].join(' '))
  lines.push(anatomy.length === 0 ? 'anatomy NONE' : anatomy.map((m) => `anatomy ${manifestHex(m.muscle)} ${manifestHex(m.role)}`).join('\n'))
  lines.push(aliases.length === 0 ? 'alias NONE' : aliases.map((a) => `alias ${manifestHex(a)}`).join('\n'))
  lines.push(['content', String(entry.content_version), manifestHex(c.authored_by), String(dayOffset(c.authored_at)),
    manifestHex(pgJsonbArrayText(c.setup_steps)), manifestHex(pgJsonbArrayText(c.execution_steps)),
    manifestHex(c.breathing_cue), manifestHex(pgJsonbArrayText(c.common_mistakes)), manifestHex(c.safety_guidance),
    manifestHex(c.equipment_setup), manifestHex(c.accessibility_alternative)].join(' '))
  lines.push(['review', manifestHex('approved'), manifestHex(decision.reviewer), epochNumericText(decision.reviewedAt), manifestHex(decision.rationale)].join(' '))
  lines.push(relationships.length === 0 ? 'relationship NONE'
    : relationships.map((r) => `relationship ${manifestHex(r.relation)} ${r.to_logical_id}`).join('\n'))
  return lines.join('\n')
}

// ── Inputs ───────────────────────────────────────────────────────────
const manifest = readJson<Manifest>(path.join(REPO_ROOT, MANIFEST_RELATIVE_PATH))
if (manifest.entries.length !== 5) fail('the lifecycle manifest must govern exactly five identities')
for (const entry of manifest.entries) {
  if (entry.existing_snapshot_fingerprint.governed_fields.tracking_mode !== 'weight_time') fail(`${entry.logical_id} is not weight_time`)
  if (!UUID_SHAPE.test(entry.logical_id) || !UUID_SHAPE.test(entry.content_id)) fail('malformed identity in the manifest')
  for (const carryId of manifest.scope.deferred_out_of_scope.logical_ids) {
    if (entry.logical_id === carryId) fail(`a deferred carry identity is governed by the manifest: ${carryId}`)
  }
}
const carrierSha = manifest.admission_source_sha256.value
if (!LOWER_HEX_64.test(carrierSha)) fail('the manifest carries a malformed admission_source_sha256')

const formsDirectory = process.env.FIVE_ENTRY_FORMS_DIR
  ? path.resolve(REPO_ROOT, process.env.FIVE_ENTRY_FORMS_DIR)
  : path.join(REPO_ROOT, DEFAULT_FORMS_DIRECTORY)
const outDirectory = process.env.FIVE_ENTRY_OUT_DIR
  ? path.resolve(REPO_ROOT, process.env.FIVE_ENTRY_OUT_DIR)
  : path.join(REPO_ROOT, DEFAULT_OUT_DIRECTORY)
const variantName = process.env.FIVE_ENTRY_VARIANT ?? ''
const isCheckMode = process.argv.includes('--check')

const formA = readJson<FormA>(path.join(formsDirectory, FORM_FILE_NAMES.A))
const formB = readJson<FormB>(path.join(formsDirectory, FORM_FILE_NAMES.B))
const formC = readJson<FormC>(path.join(formsDirectory, FORM_FILE_NAMES.C))

const decisionsA = resolveFamilyA(formA, manifest.entries)
const decisionsB = resolveFamilyB(formB, manifest.entries, carrierSha)
const decisionC = resolveFamilyC(formC, manifest)

// Map iteration is collected with forEach: this repository's tsconfig has no
// downlevelIteration, so spreading or for..of over a Map is a type error here.
const decisionListA: Resolution<FamilyADecision>[] = []
decisionsA.forEach((d) => decisionListA.push(d))
const decisionListB: Resolution<FamilyBDecision>[] = []
decisionsB.forEach((d) => decisionListB.push(d))
const familyAResolved = decisionListA.every((d) => d.state === 'RESOLVED')
const familyBResolved = decisionListB.every((d) => d.state === 'RESOLVED')
const familyCResolved = decisionC.state === 'RESOLVED'
if (decisionListA.some((d) => d.state === 'RESOLVED') && !familyAResolved) fail('family A is resolved for some identities and blank for others; a release decision covers all five or none')
if (decisionListB.some((d) => d.state === 'RESOLVED') && !familyBResolved) fail('family B is resolved for some identities and blank for others; a release decision covers all five or none')

// ── Test-only mode detection and its refusals ────────────────────────
const testFlags = [formA, formB, formC].map((f) => f.test_only_synthetic_decisions === true)
const isTestMode = testFlags.every(Boolean)
if (testFlags.some(Boolean) && !isTestMode) fail('test_only_synthetic_decisions must be set on ALL THREE forms or on none')

function humanStrings(): string[] {
  const out: string[] = []
  for (const d of decisionListA) if (d.state === 'RESOLVED') out.push(d.value.reviewer, d.value.reviewerRole, d.value.rationale)
  for (const d of decisionListB) if (d.state === 'RESOLVED') out.push(d.value.reviewer, d.value.reviewerRole, d.value.rationale)
  if (decisionC.state === 'RESOLVED') out.push(decisionC.value.productApprovedBy, decisionC.value.legalApprovedBy, decisionC.value.approvalRationale)
  return out
}
const docsRoot = path.join(REPO_ROOT, 'docs')
const outIsUnderDocs = outDirectory === docsRoot || outDirectory.startsWith(`${docsRoot}${path.sep}`)
if (isTestMode) {
  if (!(familyAResolved && familyBResolved && familyCResolved)) fail('test mode requires all three families RESOLVED with synthetic values')
  const offenders = humanStrings().filter((s) => !s.includes(TEST_ONLY_MARKER))
  if (offenders.length > 0) fail(`test mode requires every human string to carry the ${TEST_ONLY_MARKER} marker; missing on: ${offenders.map((s) => JSON.stringify(s)).join(', ')}`)
  if (outIsUnderDocs) fail(`test mode REFUSES to write under ${docsRoot}: a runnable package carrying synthetic approvals must never sit in the repository's document tree`)
} else {
  const marked = humanStrings().filter((s) => s.includes(TEST_ONLY_MARKER))
  if (marked.length > 0) fail(`a real decision form carries the ${TEST_ONLY_MARKER} marker: ${marked.map((s) => JSON.stringify(s)).join(', ')}; refusing`)
  if (variantName !== '') fail(`FIVE_ENTRY_VARIANT=${variantName} is permitted in test mode only`)
  if (!outIsUnderDocs && !isCheckMode) fail('a real rendering must be written under docs/ (or checked in place)')
}

// ── Stage dependency on families ─────────────────────────────────────
const STAGE_FAMILIES: Record<number, ('A' | 'B' | 'C')[]> = {
  1: ['A'], 2: ['A'], 3: ['A', 'B'], 4: ['A', 'B'], 5: ['A', 'B'], 6: ['A', 'B', 'C'], 7: ['A', 'B', 'C'],
}
function stageIsExecutable(stage: number): boolean {
  return STAGE_FAMILIES[stage].every((f) => (f === 'A' ? familyAResolved : f === 'B' ? familyBResolved : familyCResolved))
}
function unresolvedLeavesFor(stage: number): string[] {
  const leaves: string[] = []
  for (const f of STAGE_FAMILIES[stage]) {
    if (f === 'A') for (const d of decisionListA) if (d.state === 'UNRESOLVED') leaves.push(...d.leaves)
    if (f === 'B') for (const d of decisionListB) if (d.state === 'UNRESOLVED') leaves.push(...d.leaves)
    if (f === 'C' && decisionC.state === 'UNRESOLVED') leaves.push(...decisionC.leaves)
  }
  return leaves
}

// ── Variant plumbing (test mode only) ────────────────────────────────
// A variant mutates ONE thing in the rendering so the disposable proof can show
// which guard refuses it. Variants are applied through the same code path as
// the governed rendering, never by editing generated SQL afterwards.
const KNOWN_VARIANTS = [
  'substitute_uuid_stage1', 'carry_stage1', 'blank_rationale_stage1', 'tracking_mode_stage1', 'unrelated_mutation_stage1', 'sabotage_post_stage1',
  'extra_content_stage2', 'payload_drift_stage2', 'payload_call_drift_stage2', 'no_revoke_stage2', 'sabotage_post_stage2',
  'blank_reviewer_stage3', 'tuple_drift_stage3',
  'wrong_carrier_sha_stage4', 'wrong_fingerprint_stage4',
  'historical_key_stage6', 'missing_member_stage6', 'extra_member_stage6', 'swap_member_stage6', 'carry_stage6', 'sabotage_post_stage6',
  'sabotage_post_stage7',
] as const
type VariantName = typeof KNOWN_VARIANTS[number]
if (variantName !== '' && !(KNOWN_VARIANTS as readonly string[]).includes(variantName)) fail(`unknown variant ${variantName}`)
const variant = variantName as VariantName | ''
const CARRY_ID_FOR_CONTROLS = manifest.scope.deferred_out_of_scope.logical_ids[0]
const SUBSTITUTE_ID_FOR_CONTROLS = 'e21b2c00-0000-4000-a000-0000000000ff'
const PLANK_ID = 'e21b2c00-0000-4000-a000-000000000001'

// ── Shared fragments ─────────────────────────────────────────────────
const FIVE_IDS_SQL = manifest.entries.map((e) => `'${e.logical_id}'`).join(', ')
const FIVE_CONTENT_IDS_SQL = manifest.entries.map((e) => `'${e.content_id}'`).join(', ')
const stageVector = (stage: number): StageVector => {
  const v = manifest.stage_vectors.find((s) => s.stage === stage)
  if (!v) fail(`manifest has no stage vector for stage ${stage}`)
  return v
}

function boundaryHeader(stage: number, title: string, whatItDoes: string[], whatItRefuses: string[], executable: boolean, dependsOn: string): string {
  const lines: string[] = []
  const status = isTestMode
    ? 'TEST-ONLY RENDERING under SYNTHETIC decisions - valid ONLY inside the disposable local fixture'
    : executable
      ? 'PREPARED - NOT EXECUTED - ONE-USE - NOT idempotent'
      : 'TEMPLATE - NOT EXECUTABLE - human decision leaves UNRESOLVED'
  lines.push('-- ============================================================')
  lines.push(`-- W14-E stage ${stage} of 7 - ${title}`)
  lines.push(`-- STATUS: ${status}`)
  lines.push('--')
  lines.push('-- GENERATED FILE. Do not edit by hand - regenerate:')
  lines.push('--   npx tsx scripts/generate-weight-time-five-entry-packages.ts')
  lines.push(`-- Every value is derived from ${MANIFEST_RELATIVE_PATH} and the`)
  lines.push(`-- three human decision forms (${dependsOn}).`)
  lines.push('--')
  if (!executable) {
    lines.push('-- WHY THIS FILE CANNOT RUN: every human decision leaf below is rendered as an')
    lines.push('-- UNQUOTED <<UNRESOLVED:...>> token. That is a syntax error, deliberately: a')
    lines.push('-- blank decision is never a string that could land in a column. The first')
    lines.push('-- statement after BEGIN is a second deliberate syntax error, and the')
    lines.push('-- precondition block raises before any read. When the forms are COMPLETED,')
    lines.push('-- the same generator renders the executable package to this same path in a')
    lines.push('-- later, separately reviewed commit. Blank is never approval.')
    lines.push('--')
  }
  if (isTestMode) {
    lines.push(`-- FIXTURE GUARD: refuses unless ${FIXTURE_GUARD_RELATION} exists, which only the`)
    lines.push('-- disposable proof creates. Every human value below is SYNTHETIC and carries')
    lines.push(`-- the ${TEST_ONLY_MARKER} marker. This rendering must never be executed anywhere else.`)
    lines.push('--')
  }
  lines.push('-- WHAT THIS PACKAGE DOES (and everything it refuses to do):')
  for (const w of whatItDoes) lines.push(`--   - ${w}`)
  for (const w of whatItRefuses) lines.push(`--   - ${w}`)
  lines.push('--')
  lines.push('-- EXECUTION AUTHORITY: may ONLY ever be applied to the Supabase project')
  lines.push(`-- "ShredOS" ref ${SUPABASE_PROJECT_REF}, ONLY by Joseph or ChatGPT in the hosted`)
  lines.push('-- SQL editor as the NON-SUPERUSER operator role postgres, never by Claude and')
  lines.push('-- never by any automated pipeline, and only under its own one-use instruction')
  lines.push('-- with a spent-check FIRST. Claude has made no hosted Supabase contact, no')
  lines.push('-- Supabase CLI invocation and no Vercel contact while preparing it.')
  lines.push('--')
  lines.push('-- ONE-USE / FAIL-CLOSED: one transaction at REPEATABLE READ; SHARE ROW EXCLUSIVE')
  lines.push('-- locks over the eleven gated catalog tables before any gated read; every')
  lines.push('-- precondition and postcondition RAISEs on mismatch and rolls back EVERYTHING.')
  lines.push('-- A second execution refuses at the pre-state gate before any write. If the')
  lines.push('-- transport or result of an execution is ever ambiguous, READ STATE FIRST with')
  lines.push('-- docs/weight-time-five-entry-read-state.sql and never blindly re-run.')
  lines.push('--')
  lines.push(`-- POSITION IN THE SEQUENCE: stage ${stage} of 7. Vector before ${stageVector(stage).before},`)
  lines.push(`-- after ${stageVector(stage).after} (${stageVector(stage).moves}).`)
  lines.push('-- ============================================================')
  return lines.join('\n')
}

function templateSentinel(stage: number): string {
  const leaves = unresolvedLeavesFor(stage)
  return [
    '',
    `-- TEMPLATE RENDERING: NOT EXECUTABLE. ${leaves.length} human decision leaves are blank:`,
    ...leaves.map((l) => `--   ${l}`),
    '-- The next line is a deliberate syntax error so nothing below can ever run.',
    `SELECT <<UNRESOLVED-TEMPLATE: ${leaves.length} human decision leaves are blank; regenerate from COMPLETED forms>>;`,
    '',
  ].join('\n')
}

function preambleGuards(stage: number, label: string, executable: boolean): string {
  const lines: string[] = []
  if (!executable) {
    lines.push(`  RAISE EXCEPTION '${label}: TEMPLATE RENDERING with unresolved human decision leaves; this file is not executable and must be regenerated from COMPLETED forms';`)
  }
  if (isTestMode) {
    lines.push(`  IF to_regclass('${FIXTURE_GUARD_RELATION}') IS NULL THEN`)
    lines.push(`    RAISE EXCEPTION '${label}: TEST-ONLY RENDERING under SYNTHETIC decisions refuses to run outside the disposable fixture (marker relation ${FIXTURE_GUARD_RELATION} is absent)';`)
    lines.push('  END IF;')
  }
  return lines.join('\n')
}

function postureGate(label: string): string {
  return `  IF current_user <> 'postgres' OR session_user <> 'postgres' THEN
    RAISE EXCEPTION '${label}: BOTH execution identities must be the hosted operator role postgres (got current_user=%, session_user=%); refusing before any write or authority change', current_user, session_user;
  END IF;
  IF (SELECT rolsuper FROM pg_roles WHERE rolname = current_user) THEN
    RAISE EXCEPTION '${label}: the invoker is a superuser; this package is bound to the hosted non-superuser postgres posture';
  END IF;`
}

function authorityBaselineGate(label: string): string {
  return `  SELECT string_agg(g.rolname || '>' || m.rolname || '@' || gr.rolname
           || ':' || am.admin_option::text || ':' || am.inherit_option::text || ':' || am.set_option::text,
           E'\\n' ORDER BY g.rolname, m.rolname, gr.rolname)
    INTO v_line
    FROM pg_catalog.pg_auth_members am
    JOIN pg_roles g  ON g.oid  = am.roleid
    JOIN pg_roles m  ON m.oid  = am.member
    JOIN pg_roles gr ON gr.oid = am.grantor
   WHERE g.rolname IN (${CATALOG_ROLES.map((r) => `'${r}'`).join(',')});
  IF v_line IS DISTINCT FROM
        'exlib_catalog_admin>postgres@supabase_admin:true:false:false'
     || E'\\n' || 'exlib_catalog_admission>postgres@supabase_admin:true:false:false'
     || E'\\n' || 'exlib_catalog_loader>postgres@supabase_admin:true:false:false'
     || E'\\n' || 'exlib_catalog_reviewer>postgres@supabase_admin:true:false:false' THEN
    RAISE EXCEPTION '${label}: the catalog authority baseline is not exactly the promoted shape (got: %); refusing', coalesce(v_line, '<none>');
  END IF;`
}

function roleBaselineGate(label: string, role: string): string {
  return `  IF (SELECT count(*) FROM pg_catalog.pg_auth_members am
        JOIN pg_roles r ON r.oid = am.roleid
       WHERE r.rolname = '${role}') <> 1
     OR NOT EXISTS (
       SELECT 1 FROM pg_catalog.pg_auth_members am
         JOIN pg_roles r ON r.oid = am.roleid
         JOIN pg_roles m ON m.oid = am.member
         JOIN pg_roles g ON g.oid = am.grantor
        WHERE r.rolname = '${role}' AND m.rolname = 'postgres'
          AND g.rolname = 'supabase_admin'
          AND am.admin_option AND NOT am.inherit_option AND NOT am.set_option) THEN
    RAISE EXCEPTION '${label}: the ${role} membership posture is not the exact hosted baseline (exactly one membership: postgres granted BY supabase_admin with ADMIN TRUE, INHERIT FALSE, SET FALSE - grantor included); refusing before any write or authority change';
  END IF;`
}
function roleRestoredGate(label: string, role: string): string {
  return `  IF (SELECT count(*) FROM pg_catalog.pg_auth_members am
        JOIN pg_roles r ON r.oid = am.roleid
       WHERE r.rolname = '${role}') <> 1
     OR NOT EXISTS (
       SELECT 1 FROM pg_catalog.pg_auth_members am
         JOIN pg_roles r ON r.oid = am.roleid
         JOIN pg_roles m ON m.oid = am.member
         JOIN pg_roles g ON g.oid = am.grantor
        WHERE r.rolname = '${role}' AND m.rolname = 'postgres'
          AND g.rolname = 'supabase_admin'
          AND am.admin_option AND NOT am.inherit_option AND NOT am.set_option)
     OR pg_has_role('postgres', '${role}', 'SET') THEN
    RAISE EXCEPTION '${label}: authority restoration is not exact (baseline row plus zero standing SET capability required); rolling back everything';
  END IF;`
}
function twoGrantorBlock(label: string, role: string): string {
  return `-- ── Transaction-contained elevation (posture-gated above; revoked
--    below; postcondition-verified restored; rolls back with the
--    whole transaction on ANY failure) ─────────────────────────────
GRANT ${role} TO postgres WITH SET TRUE, INHERIT FALSE;

-- ── Structural two-grantor proof, BEFORE SET ROLE or any call ─────
DO $auth$
BEGIN
  IF (SELECT count(*) FROM pg_catalog.pg_auth_members am
        JOIN pg_roles r ON r.oid = am.roleid
       WHERE r.rolname = '${role}') <> 2
     OR NOT EXISTS (
       SELECT 1 FROM pg_catalog.pg_auth_members am
         JOIN pg_roles r ON r.oid = am.roleid
         JOIN pg_roles m ON m.oid = am.member
         JOIN pg_roles g ON g.oid = am.grantor
        WHERE r.rolname = '${role}' AND m.rolname = 'postgres'
          AND g.rolname = 'supabase_admin'
          AND am.admin_option AND NOT am.inherit_option AND NOT am.set_option)
     OR NOT EXISTS (
       SELECT 1 FROM pg_catalog.pg_auth_members am
         JOIN pg_roles r ON r.oid = am.roleid
         JOIN pg_roles m ON m.oid = am.member
         JOIN pg_roles g ON g.oid = am.grantor
        WHERE r.rolname = '${role}' AND m.rolname = 'postgres'
          AND g.rolname = 'postgres'
          AND NOT am.admin_option AND NOT am.inherit_option AND am.set_option) THEN
    RAISE EXCEPTION '${label}: the two-grantor membership shape after the temporary grant is not exact (supabase_admin-granted baseline row plus postgres-granted SET row); aborting before SET ROLE and before any call';
  END IF;
END
$auth$;

SET ROLE ${role};`
}
function revokeBlock(role: string, omit: boolean): string {
  if (omit) return 'RESET ROLE;\n\n-- (VARIANT: the grantor-scoped REVOKE is deliberately omitted)'
  return `RESET ROLE;

-- ── Exact restoration: remove ONLY the temporary grant this package
--    created, identified by its grantor ────────────────────────────
REVOKE ${role} FROM postgres GRANTED BY postgres;`
}
function functionDenialGate(label: string, signature: string, phase: 'refusing before any write or authority change' | 'rolling back everything'): string {
  return `  IF has_function_privilege('anon', '${signature}', 'EXECUTE')
     OR has_function_privilege('authenticated', '${signature}', 'EXECUTE')
     OR has_function_privilege('service_role', '${signature}', 'EXECUTE') THEN
    RAISE EXCEPTION '${label}: ${signature} is executable by an ordinary client role; ${phase}';
  END IF;`
}
function vectorGate(label: string, expected: string, phase: 'pre' | 'post'): string {
  const message = phase === 'pre'
    ? `the catalog surface is not the exact expected pre-state (expected ${expected}, found %); this ONE-USE package refuses to run twice, over foreign state, or over an ambiguous surface - READ STATE FIRST`
    : `post-state vector is % (expected ${expected}); rolling back everything`
  return `  SELECT
${vectorSql('    ')}
    INTO v_counts;
  IF v_counts <> '${expected}' THEN
    RAISE EXCEPTION '${label}: ${message}', v_counts;
  END IF;`
}
function claimsGate(label: string, phase: 'refusing' | 'rolling back everything'): string {
  return `  IF (SELECT orphaned_claims::text || '/' || unclaimed_bearers::text FROM public.exlib_verify_catalog_claims()) <> '0/0' THEN
    RAISE EXCEPTION '${label}: the bidirectional catalog name-claim invariant does not hold; ${phase}';
  END IF;`
}
function triggerBindingGate(label: string): string {
  return `  IF (SELECT count(*) FROM pg_catalog.pg_trigger t
       WHERE t.tgrelid = 'public.exercise_catalog'::regclass
         AND t.tgname = 'exercise_catalog_freeze_trigger'
         AND t.tgfoid = 'public.exlib_freeze_catalog_snapshot()'::regprocedure
         AND t.tgtype = 23
         AND t.tgenabled = 'O') <> 1
     OR (SELECT count(*) FROM pg_catalog.pg_trigger t
          WHERE t.tgrelid = 'public.exercise_catalog_review_events'::regclass
            AND t.tgname = 'exercise_catalog_review_events_guard_trigger'
            AND t.tgfoid = 'public.exlib_freeze_review_events()'::regprocedure
            AND t.tgtype = 31
            AND t.tgenabled = 'O') <> 1
     OR (SELECT count(*) FROM pg_catalog.pg_trigger t
          WHERE t.tgrelid = 'public.exercise_catalog_import_runs'::regclass
            AND t.tgname = 'exercise_catalog_import_runs_freeze_trigger'
            AND t.tgfoid = 'public.exlib_freeze_run_row()'::regprocedure
            AND t.tgtype = 23
            AND t.tgenabled = 'O') <> 1
     OR (SELECT count(*) FROM pg_catalog.pg_trigger t
          WHERE t.tgrelid = 'public.exercise_catalog_import_runs'::regclass
            AND NOT t.tgisinternal) <> 1
     OR (SELECT count(*) FROM pg_catalog.pg_trigger t
          WHERE t.tgrelid = 'public.exercise_catalog_run_items'::regclass
            AND t.tgname = 'exercise_catalog_run_items_freeze_trigger'
            AND t.tgfoid = 'public.exlib_freeze_run_membership()'::regprocedure
            AND t.tgtype = 31
            AND t.tgenabled = 'O') <> 1
     OR (SELECT count(*) FROM pg_catalog.pg_trigger t
          WHERE t.tgrelid = 'public.exercise_catalog_run_items'::regclass
            AND NOT t.tgisinternal) <> 1 THEN
    RAISE EXCEPTION '${label}: a governing freeze trigger is not EXACTLY bound and enabled (promoted name, table, function, event set, enabled state); refusing';
  END IF;`
}

/** The snapshot governed-field gate for one identity, exact value equality. */
function snapshotGovernedGate(label: string, entry: ManifestEntry, tagSuffix: string): string {
  const s = entry.existing_snapshot_fingerprint.governed_fields
  const nullOrEq = (column: string, value: string | null, tag: string) =>
    value === null ? `${column} IS NULL` : `${column} = ${dollarQuote(tag, value)}`
  const retrieved = s.retrieved_at === null ? 'e.retrieved_at IS NULL' : `e.retrieved_at = ${dateLiteral(s.retrieved_at)}`
  return `  IF (SELECT count(*) FROM public.exercise_catalog e
       WHERE e.logical_id = ${uuidLiteral(entry.logical_id)} AND e.is_active = true) <> 1
     OR NOT EXISTS (SELECT 1 FROM public.exercise_catalog e
       WHERE e.logical_id = ${uuidLiteral(entry.logical_id)} AND e.is_active = true
         AND e.canonical_name = ${dollarQuote(`nm${tagSuffix}`, entry.canonical_name)}
         AND e.category = '${s.category}' AND e.primary_muscle = '${s.primary_muscle}'
         AND e.equipment = '${s.equipment}' AND e.laterality = '${s.laterality}'
         AND e.tracking_mode = '${s.tracking_mode}' AND e.provenance = '${s.provenance}'
         AND e.movement_pattern = '${s.movement_pattern}' AND e.training_role = '${s.training_role}'
         AND e.difficulty = '${s.difficulty}' AND e.availability = '${s.availability}'
         AND ${nullOrEq('e.source_url', s.source_url, `su${tagSuffix}`)}
         AND ${nullOrEq('e.source_page', s.source_page, `sp${tagSuffix}`)}
         AND ${retrieved}
         AND ${s.import_confidence === null ? 'e.import_confidence IS NULL' : `e.import_confidence = '${s.import_confidence}'`}
         AND e.catalog_version = 1) THEN
    RAISE EXCEPTION '${label}: inventory line ${entry.inventory_file_line} (${entry.canonical_name.replace(/'/g, "''")}) is not exactly one active v1 snapshot carrying the governed W14 fields; refusing';
  END IF;
  IF (SELECT coalesce(string_agg(m.muscle || ':' || m.role, ',' ORDER BY m.muscle, m.role), '')
        FROM public.exercise_catalog_muscles m
        JOIN public.exercise_catalog e ON e.id = m.catalog_id
       WHERE e.logical_id = ${uuidLiteral(entry.logical_id)} AND e.is_active = true) <> '${anatomyLine(s.anatomy)}' THEN
    RAISE EXCEPTION '${label}: inventory line ${entry.inventory_file_line} anatomy is not exactly ${anatomyLine(s.anatomy)}; refusing';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_aliases a WHERE a.logical_id = ${uuidLiteral(entry.logical_id)}) <> ${s.aliases.length} THEN
    RAISE EXCEPTION '${label}: inventory line ${entry.inventory_file_line} alias count is not ${s.aliases.length}; refusing';
  END IF;`
}

/** Snapshot review tuple (family A) exact-value gate or unresolved-token gate. */
function snapshotReviewTupleGate(label: string, entry: ManifestEntry, phase: 'pre-pending' | 'approved'): string {
  if (phase === 'pre-pending') {
    return `  IF NOT EXISTS (SELECT 1 FROM public.exercise_catalog e
       WHERE e.logical_id = ${uuidLiteral(entry.logical_id)} AND e.is_active = true
         AND e.review_status = 'pending' AND e.reviewed_by IS NULL
         AND e.reviewed_at IS NULL AND e.review_rationale IS NULL) THEN
    RAISE EXCEPTION '${label}: inventory line ${entry.inventory_file_line} is not in the pending / NULL-audit state the decision reviewed; this ONE-USE transition is spent or the world moved - READ STATE FIRST; refusing';
  END IF;`
  }
  const d = decisionsA.get(entry.logical_id)!
  const n = entry.inventory_file_line
  const reviewer = d.state === 'RESOLVED' ? dollarQuote(`ar${n}`, d.value.reviewer) : token(`A.${n}.reviewer`)
  const reviewedAt = d.state === 'RESOLVED' ? timestampLiteral(d.value.reviewedAt) : token(`A.${n}.reviewed_at`)
  const rationale = d.state === 'RESOLVED' ? dollarQuote(`aq${n}`, d.value.rationale) : token(`A.${n}.rationale`)
  return `  IF NOT EXISTS (SELECT 1 FROM public.exercise_catalog e
       WHERE e.logical_id = ${uuidLiteral(entry.logical_id)} AND e.is_active = true
         AND e.review_status = 'approved'
         AND e.reviewed_by = ${reviewer}
         AND e.reviewed_at = ${reviewedAt}
         AND e.review_rationale = ${rationale}) THEN
    RAISE EXCEPTION '${label}: inventory line ${entry.inventory_file_line} does not bear the exact family A approval tuple; refusing';
  END IF;`
}

/** Content payload exact-value predicate fragment for one content row (used in several gates). */
function contentPayloadPredicate(entry: ManifestEntry, alias: string, tagPrefix: string, payload: ContentPayload = entry.candidate_content_payload): string {
  const n = entry.inventory_file_line
  return `${alias}.id = ${uuidLiteral(entry.content_id)}
         AND ${alias}.logical_id = ${uuidLiteral(entry.logical_id)}
         AND ${alias}.content_version = ${entry.content_version}
         AND ${alias}.authored_by = ${dollarQuote(`${tagPrefix}ab${n}`, payload.authored_by)}
         AND ${alias}.authored_at = ${dateLiteral(payload.authored_at)}
         AND ${alias}.setup_steps = ${jsonbLiteral(`${tagPrefix}se${n}`, payload.setup_steps)}
         AND ${alias}.execution_steps = ${jsonbLiteral(`${tagPrefix}ex${n}`, payload.execution_steps)}
         AND ${alias}.breathing_cue = ${dollarQuote(`${tagPrefix}br${n}`, payload.breathing_cue)}
         AND ${alias}.common_mistakes = ${jsonbLiteral(`${tagPrefix}cm${n}`, payload.common_mistakes)}
         AND ${alias}.safety_guidance = ${dollarQuote(`${tagPrefix}sg${n}`, payload.safety_guidance)}
         AND ${alias}.equipment_setup = ${dollarQuote(`${tagPrefix}es${n}`, payload.equipment_setup)}
         AND ${alias}.accessibility_alternative = ${dollarQuote(`${tagPrefix}aa${n}`, payload.accessibility_alternative)}`
}
function contentReviewTuplePredicate(entry: ManifestEntry, alias: string, tagPrefix: string, decisionOverride?: FamilyBDecision): string {
  const d = decisionsB.get(entry.logical_id)!
  const n = entry.inventory_file_line
  const value = decisionOverride ?? (d.state === 'RESOLVED' ? d.value : null)
  const reviewer = value ? dollarQuote(`${tagPrefix}rv${n}`, value.reviewer) : token(`B.${n}.reviewer`)
  const reviewedAt = value ? timestampLiteral(value.reviewedAt) : token(`B.${n}.reviewed_at`)
  const rationale = value ? dollarQuote(`${tagPrefix}rr${n}`, value.rationale) : token(`B.${n}.rationale`)
  return `${alias}.content_status = 'approved'
         AND ${alias}.reviewed_by = ${reviewer}
         AND ${alias}.reviewed_at = ${reviewedAt}
         AND ${alias}.review_rationale = ${rationale}`
}

function capturePlankAndHistoricalRun(): string {
  return `  (SELECT r::text FROM public.exercise_catalog_import_runs r WHERE r.run_key = '${HISTORICAL_RUN_KEY}') AS historical_run_row,
  (SELECT md5(coalesce(string_agg(ri::text, '|' ORDER BY ri.id), '-'))
     FROM public.exercise_catalog_run_items ri
     JOIN public.exercise_catalog_import_runs r ON r.id = ri.run_id
    WHERE r.run_key = '${HISTORICAL_RUN_KEY}') AS historical_items_digest,
  (SELECT md5(coalesce(string_agg(am::text, '|' ORDER BY am.roleid, am.member, am.grantor), '-'))
     FROM pg_catalog.pg_auth_members am
     JOIN pg_roles g ON g.oid = am.roleid
    WHERE g.rolname IN (${CATALOG_ROLES.map((r) => `'${r}'`).join(',')})) AS authority_digest,
  (SELECT count(*)::text || ':' || md5(coalesce(string_agg(t::text, '|' ORDER BY t.id), '-')) FROM public.exercises t) AS tenant_digest,
  (SELECT count(*)::text || ':' || md5(coalesce(string_agg(t::text, '|' ORDER BY t.id), '-')) FROM public.exercise_aliases t) AS tenant_alias_digest,
  (SELECT count(*)::text || ':' || md5(coalesce(string_agg(t::text, '|' ORDER BY t.id), '-')) FROM public.exercise_muscles t) AS tenant_muscle_digest`
}
const DIGEST = {
  logical: `(SELECT md5(coalesce(string_agg(l::text, '|' ORDER BY l.id), '-')) FROM public.exercise_catalog_logical l)`,
  snapshotsAll: `(SELECT md5(coalesce(string_agg(c::text, '|' ORDER BY c.logical_id, c.catalog_version), '-')) FROM public.exercise_catalog c)`,
  snapshotsOutsideFive: `(SELECT md5(coalesce(string_agg(c::text, '|' ORDER BY c.logical_id, c.catalog_version), '-')) FROM public.exercise_catalog c WHERE c.logical_id NOT IN (${FIVE_IDS_SQL}))`,
  eventsAll: `(SELECT md5(coalesce(string_agg(e::text, '|' ORDER BY e.id), '-')) FROM public.exercise_catalog_review_events e)`,
  eventsOutsideFive: `(SELECT md5(coalesce(string_agg(e::text, '|' ORDER BY e.id), '-')) FROM public.exercise_catalog_review_events e JOIN public.exercise_catalog c ON c.id = e.catalog_id WHERE c.logical_id NOT IN (${FIVE_IDS_SQL}))`,
  anatomy: `(SELECT md5(coalesce(string_agg(m::text, '|' ORDER BY m.catalog_id, m.muscle), '-')) FROM public.exercise_catalog_muscles m)`,
  aliases: `(SELECT md5(coalesce(string_agg(a::text, '|' ORDER BY a.logical_id, a.alias), '-')) FROM public.exercise_catalog_aliases a)`,
  claims: `(SELECT md5(coalesce(string_agg(n::text, '|' ORDER BY n.normalized_name), '-')) FROM public.exercise_catalog_name_claims n)`,
  contentAll: `(SELECT md5(coalesce(string_agg(c::text, '|' ORDER BY c.id), '-')) FROM public.exercise_catalog_content c)`,
  contentOutsideFive: `(SELECT md5(coalesce(string_agg(c::text, '|' ORDER BY c.id), '-')) FROM public.exercise_catalog_content c WHERE c.logical_id NOT IN (${FIVE_IDS_SQL}))`,
  expectedRel: `(SELECT md5(coalesce(string_agg(x::text, '|' ORDER BY x.content_id, x.relation, x.to_logical_id), '-')) FROM public.exercise_catalog_content_expected_relationships x)`,
  projection: `(SELECT md5(coalesce(string_agg(r::text, '|' ORDER BY r.from_logical_id, r.relation, r.to_logical_id), '-')) FROM public.exercise_catalog_relationships r)`,
  runsAll: `(SELECT md5(coalesce(string_agg(r::text, '|' ORDER BY r.id), '-')) FROM public.exercise_catalog_import_runs r)`,
  runItemsAll: `(SELECT md5(coalesce(string_agg(ri::text, '|' ORDER BY ri.id), '-')) FROM public.exercise_catalog_run_items ri)`,
}
function captureTable(captureName: string, columns: Record<string, string>): string {
  const cols = Object.entries(columns).map(([name, sql]) => `  ${sql} AS ${name}`).join(',\n')
  return `-- ── Capture-and-compare surfaces (temp, transaction-local): every surface this
--    package must NOT change is digested here and re-digested afterwards.
--    These md5 digests detect a change between two readings inside this ONE
--    transaction; they never bind any source artifact. ──────────────────────
CREATE TEMP TABLE ${captureName} ON COMMIT DROP AS
SELECT
${cols},
${capturePlankAndHistoricalRun()};`
}
function unchangedGate(label: string, captureVar: string, columns: Record<string, string>): string {
  const clauses = Object.entries(columns).map(([name, sql]) => `${sql} IS DISTINCT FROM ${captureVar}.${name}`)
  return `  IF ${clauses.join('\n     OR ')} THEN
    RAISE EXCEPTION '${label}: a surface this package must not change has changed (${Object.keys(columns).join(', ')}); rolling back everything';
  END IF;
  IF (SELECT r::text FROM public.exercise_catalog_import_runs r WHERE r.run_key = '${HISTORICAL_RUN_KEY}') IS DISTINCT FROM ${captureVar}.historical_run_row
     OR (SELECT md5(coalesce(string_agg(ri::text, '|' ORDER BY ri.id), '-'))
           FROM public.exercise_catalog_run_items ri
           JOIN public.exercise_catalog_import_runs r ON r.id = ri.run_id
          WHERE r.run_key = '${HISTORICAL_RUN_KEY}') IS DISTINCT FROM ${captureVar}.historical_items_digest THEN
    RAISE EXCEPTION '${label}: the historical sealed plank run ${HISTORICAL_RUN_KEY} or its membership changed; this package never touches it; rolling back everything';
  END IF;
  IF (SELECT md5(coalesce(string_agg(am::text, '|' ORDER BY am.roleid, am.member, am.grantor), '-'))
        FROM pg_catalog.pg_auth_members am
        JOIN pg_roles g ON g.oid = am.roleid
       WHERE g.rolname IN (${CATALOG_ROLES.map((r) => `'${r}'`).join(',')})) IS DISTINCT FROM ${captureVar}.authority_digest THEN
    RAISE EXCEPTION '${label}: the catalog authority memberships changed across the act - whole rows compared: member, grantor, every option column; rolling back everything';
  END IF;
  IF (SELECT count(*)::text || ':' || md5(coalesce(string_agg(t::text, '|' ORDER BY t.id), '-')) FROM public.exercises t) IS DISTINCT FROM ${captureVar}.tenant_digest
     OR (SELECT count(*)::text || ':' || md5(coalesce(string_agg(t::text, '|' ORDER BY t.id), '-')) FROM public.exercise_aliases t) IS DISTINCT FROM ${captureVar}.tenant_alias_digest
     OR (SELECT count(*)::text || ':' || md5(coalesce(string_agg(t::text, '|' ORDER BY t.id), '-')) FROM public.exercise_muscles t) IS DISTINCT FROM ${captureVar}.tenant_muscle_digest THEN
    RAISE EXCEPTION '${label}: a tenant surface (exercises, exercise_aliases, exercise_muscles) changed inside the gated interval; NO tenant delivery occurs in this package; rolling back everything';
  END IF;`
}
function historicalRunIntactGate(label: string): string {
  return `  IF (SELECT count(*) FROM public.exercise_catalog_import_runs r
       WHERE r.run_key = '${HISTORICAL_RUN_KEY}'
         AND r.approved_for_delivery = true AND r.dry_run = false
         AND r.sealed_at IS NOT NULL AND r.revoked_at IS NULL) <> 1
     OR (SELECT count(*) FROM public.exercise_catalog_run_items ri
           JOIN public.exercise_catalog_import_runs r ON r.id = ri.run_id
          WHERE r.run_key = '${HISTORICAL_RUN_KEY}') <> 6 THEN
    RAISE EXCEPTION '${label}: the historical plank release run ${HISTORICAL_RUN_KEY} is not exactly one sealed, approved, non-dry, unrevoked run with six membership rows; the world is not the evidenced post-W14 hosted state; refusing';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_content c
       WHERE c.logical_id = '${PLANK_ID}' AND c.publication_status = 'published'
         AND c.import_admitted = true
         AND c.admitted_fingerprint = public.exlib_content_admission_fingerprint(c.id)) <> 1 THEN
    RAISE EXCEPTION '${label}: the published, admitted, fingerprint-fresh Plank content row is not exactly present; refusing';
  END IF;`
}
function noCarryGate(label: string): string {
  const carries = manifest.scope.deferred_out_of_scope.logical_ids.map((id) => `'${id}'`).join(', ')
  return `  IF (SELECT count(*) FROM public.exercise_catalog_logical WHERE id IN (${carries})) <> 0
     OR (SELECT count(*) FROM public.exercise_catalog WHERE lower(canonical_name) ~ 'carry|farmer|suitcase|sandbag') <> 0 THEN
    RAISE EXCEPTION '${label}: a deferred carry identity (inventory lines 134, 135, 136) is present in the catalog; the carries are DEFERRED and this lifecycle never touches them; refusing';
  END IF;`
}
function resultSelect(stage: number, title: string, extra: string): string {
  return `-- surfaced result (display evidence; the committed rows are the proof)
SELECT 'W14E-${stage} ${title}' AS result,
       (SELECT
${vectorSql('          ')}) AS vector${extra};`
}
function transactionOpen(stage: number, executable: boolean): string {
  return `BEGIN;
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
${executable ? '' : templateSentinel(stage)}
${lockStatement()}`
}

// ── Stage 1: snapshot review ─────────────────────────────────────────
function renderStage1(): string {
  const label = 'W14E-1 snapshot review'
  const executable = stageIsExecutable(1)
  const v = stageVector(1)
  let targets: ManifestEntry[] = manifest.entries
  if (variant === 'substitute_uuid_stage1') {
    targets = manifest.entries.map((e, i) => (i === 4 ? { ...e, logical_id: SUBSTITUTE_ID_FOR_CONTROLS } : e))
  }
  if (variant === 'carry_stage1') {
    targets = manifest.entries.concat([{ ...manifest.entries[0], inventory_file_line: 134, canonical_name: "Farmer's carry", logical_id: CARRY_ID_FOR_CONTROLS }])
  }
  const captureColumns = {
    logical_digest: DIGEST.logical,
    snapshots_outside_five: DIGEST.snapshotsOutsideFive,
    events_outside_five: DIGEST.eventsOutsideFive,
    anatomy_digest: DIGEST.anatomy,
    alias_digest: DIGEST.aliases,
    claims_digest: DIGEST.claims,
    content_digest: DIGEST.contentAll,
    expected_rel_digest: DIGEST.expectedRel,
    projection_digest: DIGEST.projection,
    runs_digest: DIGEST.runsAll,
    run_items_digest: DIGEST.runItemsAll,
    created_at_map: `(SELECT jsonb_object_agg(c.logical_id::text, c.created_at) FROM public.exercise_catalog c WHERE c.logical_id IN (${FIVE_IDS_SQL}) AND c.is_active = true)`,
  }
  const perTargetGates = targets.map((e) => `${snapshotGovernedGate(label, e, String(e.inventory_file_line))}\n${snapshotReviewTupleGate(label, e, 'pre-pending')}
  IF (SELECT count(*) FROM public.exercise_catalog_review_events ev
        JOIN public.exercise_catalog e ON e.id = ev.catalog_id
       WHERE e.logical_id = ${uuidLiteral(e.logical_id)}) <> 0 THEN
    RAISE EXCEPTION '${label}: a review event already exists for inventory line ${e.inventory_file_line}; refusing';
  END IF;`).join('\n')
  const updates = targets.map((e) => {
    const d = decisionsA.get(e.logical_id) ?? decisionsA.get(manifest.entries[0].logical_id)!
    const n = e.inventory_file_line
    let rationale = d.state === 'RESOLVED' ? dollarQuote(`ra${n}`, d.value.rationale) : token(`A.${n}.rationale`)
    if (variant === 'blank_rationale_stage1' && n === 132) rationale = 'NULL'
    const extraSet = variant === 'tracking_mode_stage1' && n === 137 ? ",\n       tracking_mode    = 'timed'" : ''
    return `UPDATE public.exercise_catalog
   SET review_status    = 'approved',
       reviewed_by      = ${d.state === 'RESOLVED' ? dollarQuote(`rb${n}`, d.value.reviewer) : token(`A.${n}.reviewer`)},
       reviewed_at      = ${d.state === 'RESOLVED' ? timestampLiteral(d.value.reviewedAt) : token(`A.${n}.reviewed_at`)},
       review_rationale = ${rationale}${extraSet}
 WHERE logical_id = ${uuidLiteral(e.logical_id)} AND is_active = true;`
  }).join('\n\n')
  const unrelated = variant === 'unrelated_mutation_stage1'
    ? `\n-- (VARIANT: an unrelated snapshot row is touched)\nUPDATE public.exercise_catalog SET is_active = is_active WHERE logical_id = '${PLANK_ID}' AND is_active = true;\n`
    : ''
  const postTuples = manifest.entries.map((e) => `${snapshotReviewTupleGate(label, e, 'approved')}
  IF (SELECT c.created_at FROM public.exercise_catalog c WHERE c.logical_id = ${uuidLiteral(e.logical_id)} AND c.is_active = true)
     IS DISTINCT FROM (v_cap.created_at_map ->> '${e.logical_id}')::timestamptz THEN
    RAISE EXCEPTION '${label}: created_at changed for inventory line ${e.inventory_file_line}; rolling back everything';
  END IF;`).join('\n')
  const eventLines = manifest.entries.map((e) => {
    const d = decisionsA.get(e.logical_id)!
    const n = e.inventory_file_line
    const reviewer = d.state === 'RESOLVED' ? dollarQuote(`er${n}`, d.value.reviewer) : token(`A.${n}.reviewer`)
    const reviewedAt = d.state === 'RESOLVED' ? timestampLiteral(d.value.reviewedAt) : token(`A.${n}.reviewed_at`)
    const rationale = d.state === 'RESOLVED' ? dollarQuote(`eq${n}`, d.value.rationale) : token(`A.${n}.rationale`)
    return `  IF (SELECT count(*) FROM public.exercise_catalog_review_events ev
        JOIN public.exercise_catalog c ON c.id = ev.catalog_id
       WHERE c.logical_id = ${uuidLiteral(e.logical_id)}
         AND ev.from_status = 'pending' AND ev.to_status = 'approved'
         AND ev.reviewed_by = ${reviewer}
         AND ev.reviewed_at = ${reviewedAt}
         AND ev.review_rationale = ${rationale}) <> 1
     OR (SELECT count(*) FROM public.exercise_catalog_review_events ev
        JOIN public.exercise_catalog c ON c.id = ev.catalog_id
       WHERE c.logical_id = ${uuidLiteral(e.logical_id)}) <> 1 THEN
    RAISE EXCEPTION '${label}: the trigger-appended review event for inventory line ${e.inventory_file_line} is not exactly one pending -> approved row carrying the family A tuple; rolling back everything';
  END IF;`
  }).join('\n')
  const postVector = variant === 'sabotage_post_stage1' ? '0/0/0/0/0/0/0/0/0/0/0' : v.after
  return `${boundaryHeader(1, 'SNAPSHOT REVIEW (family A) for the five weight_time identities', [
    'performs EXACTLY FIVE snapshot review transitions (pending -> approved), one direct owner UPDATE per identity carrying its complete FRESH human audit tuple, resolved by logical_id + is_active (never a hosted surrogate UUID)',
    'lets the OPERATIVE migration-027 freeze trigger append the five immutable exercise_catalog_review_events rows itself (that table accepts inserts only at trigger depth >= 2)',
  ], [
    'NO controlled function exists for snapshot review (migration 023 grants nothing on exercise_catalog; the four migration-027 roles hold EXECUTE on content-lifecycle functions only), so the direct owner UPDATE is the ONLY lawful surface - the same mechanism the promoted EXLIB-2Y package used',
    'NO content draft, review, admission, publication, projection, run, membership, seal, revocation, delivery, tenant change, authority change or environment change',
  ], executable, 'family A: docs/weight-time-five-entry-snapshot-review-form.json')}

${transactionOpen(1, executable)}

${captureTable('w14e1_capture', captureColumns)}

-- ── Preconditions (ANY mismatch aborts EVERYTHING before any write) ───
DO $pre$
DECLARE
  v_counts TEXT;
  v_line   TEXT;
BEGIN
${preambleGuards(1, label, executable)}
${postureGate(label)}
${triggerBindingGate(label)}
${authorityBaselineGate(label)}
${vectorGate(label, v.before, 'pre')}
${historicalRunIntactGate(label)}
${noCarryGate(label)}
  -- each governed identity: exactly one active v1 snapshot, every governed
  -- field exactly the frozen W14 value, pending with NULL audit, no event yet
${perTargetGates}
${claimsGate(label, 'refusing')}
END
$pre$;

-- ── THE FIVE HUMAN-AUTHORED TRANSITIONS (the trigger validates each one and
--    appends its immutable review event itself) ───────────────────────────
${updates}
${unrelated}
-- ── Postconditions (ANY mismatch rolls back EVERYTHING) ──────────────
DO $post$
DECLARE
  v_counts TEXT;
  v_cap    RECORD;
BEGIN
  SELECT * INTO v_cap FROM w14e1_capture;
${vectorGate(label, postVector, 'post')}
${postTuples}
${eventLines}
  IF (SELECT count(*) FROM public.exercise_catalog WHERE logical_id IN (${FIVE_IDS_SQL}) AND is_active = true AND review_status = 'approved') <> 5 THEN
    RAISE EXCEPTION '${label}: not exactly five approved active snapshots among the governed identities; rolling back everything';
  END IF;
${unchangedGate(label, 'v_cap', captureColumns)}
${claimsGate(label, 'rolling back everything')}
END
$post$;

${resultSelect(1, 'SNAPSHOTS APPROVED', `,
       (SELECT count(*) FROM public.exercise_catalog WHERE logical_id IN (${FIVE_IDS_SQL}) AND review_status = 'approved' AND is_active = true) AS approved_five,
       (SELECT count(*) FROM public.exercise_catalog_review_events) AS review_events`)}

COMMIT;
`
}

// ── Stage 2: content draft load ──────────────────────────────────────
function renderStage2(): string {
  const label = 'W14E-2 content draft load'
  const executable = stageIsExecutable(2)
  const v = stageVector(2)
  const role = 'exlib_catalog_loader'
  const signature = 'public.load_catalog_content_draft(uuid,uuid,integer,text,date,jsonb,jsonb,text,jsonb,text,text,text,jsonb)'
  let loadTargets: ManifestEntry[] = manifest.entries
  if (variant === 'payload_drift_stage2' || variant === 'payload_call_drift_stage2') {
    loadTargets = manifest.entries.map((e) => e.inventory_file_line !== 133 ? e : {
      ...e,
      candidate_content_payload: {
        ...e.candidate_content_payload,
        setup_steps: e.candidate_content_payload.setup_steps.map((s, i) => (i === 0 ? `${s} (drifted)` : s)),
      },
    })
  }
  if (variant === 'extra_content_stage2') {
    loadTargets = manifest.entries.concat([{ ...manifest.entries[0], logical_id: PLANK_ID, content_id: 'e21b2c00-0000-4000-a000-0000000001f1', content_version: 2, inventory_file_line: 1 }])
  }
  // The post gate reads the GOVERNED payload (manifest), never the act's list,
  // unless the variant explicitly drifts both sides.
  const postTargets: ManifestEntry[] = variant === 'payload_drift_stage2' ? loadTargets.slice(0, 5) : manifest.entries
  const captureColumns = {
    logical_digest: DIGEST.logical,
    snapshots_digest: DIGEST.snapshotsAll,
    events_digest: DIGEST.eventsAll,
    anatomy_digest: DIGEST.anatomy,
    alias_digest: DIGEST.aliases,
    claims_digest: DIGEST.claims,
    content_outside_five: DIGEST.contentOutsideFive,
    expected_rel_digest: DIGEST.expectedRel,
    projection_digest: DIGEST.projection,
    runs_digest: DIGEST.runsAll,
    run_items_digest: DIGEST.runItemsAll,
  }
  const preGates = manifest.entries.map((e) => `${snapshotGovernedGate(label, e, String(e.inventory_file_line))}\n${snapshotReviewTupleGate(label, e, 'approved')}
  IF (SELECT count(*) FROM public.exercise_catalog_content c WHERE c.logical_id = ${uuidLiteral(e.logical_id)}) <> 0
     OR (SELECT count(*) FROM public.exercise_catalog_content c WHERE c.id = ${uuidLiteral(e.content_id)}) <> 0 THEN
    RAISE EXCEPTION '${label}: a content version already exists for inventory line ${e.inventory_file_line} (or its predeclared content id is taken); this ONE-USE load is spent or the world moved - READ STATE FIRST; refusing';
  END IF;`).join('\n')
  const calls = loadTargets.map((e) => {
    const p = e.candidate_content_payload
    const n = e.inventory_file_line
    return `  v_result := public.load_catalog_content_draft(
    ${uuidLiteral(e.logical_id)},
    ${uuidLiteral(e.content_id)},
    ${e.content_version},
    ${dollarQuote(`ab${n}`, p.authored_by)},
    ${dateLiteral(p.authored_at)},
    ${jsonbLiteral(`se${n}`, p.setup_steps)},
    ${jsonbLiteral(`ex${n}`, p.execution_steps)},
    ${dollarQuote(`br${n}`, p.breathing_cue)},
    ${jsonbLiteral(`cm${n}`, p.common_mistakes)},
    ${dollarQuote(`sg${n}`, p.safety_guidance)},
    ${dollarQuote(`es${n}`, p.equipment_setup)},
    ${dollarQuote(`aa${n}`, p.accessibility_alternative)},
    ${jsonbLiteral(`er${n}`, p.expected_relationships)});
  IF v_result IS DISTINCT FROM jsonb_build_object(
       'logical_id', ${uuidLiteral(e.logical_id)},
       'content_id', ${uuidLiteral(e.content_id)},
       'content_version', ${e.content_version},
       'expected_relationships', ${p.expected_relationships.length}) THEN
    RAISE EXCEPTION '${label}: load_catalog_content_draft for inventory line ${n} returned % (not the exact derivable result); rolling back everything', v_result;
  END IF;`
  }).join('\n')
  const postRows = postTargets.map((e) => `  IF (SELECT count(*) FROM public.exercise_catalog_content c WHERE c.logical_id = ${uuidLiteral(e.logical_id)}) <> 1
     OR NOT EXISTS (SELECT 1 FROM public.exercise_catalog_content c
       WHERE ${contentPayloadPredicate(e, 'c', 'q')}
         AND c.content_status = 'pending'
         AND c.publication_status = 'draft'
         AND c.import_admitted = false
         AND c.reviewed_by IS NULL AND c.reviewed_at IS NULL AND c.review_rationale IS NULL
         AND c.admitted_fingerprint IS NULL AND c.admitted_source_sha256 IS NULL AND c.admitted_at IS NULL) THEN
    RAISE EXCEPTION '${label}: the content row for inventory line ${e.inventory_file_line} is not exactly the loaded born-pending / draft / unadmitted state with the governed payload; rolling back everything';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_content_expected_relationships x WHERE x.content_id = ${uuidLiteral(e.content_id)}) <> ${e.candidate_content_payload.expected_relationships.length} THEN
    RAISE EXCEPTION '${label}: the expected-relationship set for inventory line ${e.inventory_file_line} is not exactly the governed set; rolling back everything';
  END IF;`).join('\n')
  const postVector = variant === 'sabotage_post_stage2' ? '0/0/0/0/0/0/0/0/0/0/0' : v.after
  return `${boundaryHeader(2, 'CONTENT DRAFT LOAD for the five weight_time identities', [
    `performs EXACTLY FIVE public.load_catalog_content_draft calls under the exlib_catalog_loader authority, each with a PREDECLARED content id (…0104 to …0108, the established +0x100 convention over …0004 to …0008) and content_version 1, carrying the AI-drafted payload verbatim from the bound content carrier (sha256 ${carrierSha})`,
    'every version lands born-pending / draft / unadmitted with NULL audit and NULL admission fields, exactly as the migration-027 freeze trigger guarantees; every expected relationship set is EMPTY by decision (reviewer question RQ-1)',
  ], [
    'NO review, admission, publication, projection, run, membership, seal, revocation, delivery, tenant change or environment change; the elevation is transaction-contained and restored byte-for-byte',
  ], executable, 'family A: docs/weight-time-five-entry-snapshot-review-form.json (gated, not written)')}

${transactionOpen(2, executable)}

${captureTable('w14e2_capture', captureColumns)}

-- ── Preconditions (owner-role reads, BEFORE any authority change) ─────
DO $pre$
DECLARE
  v_counts TEXT;
  v_line   TEXT;
BEGIN
${preambleGuards(2, label, executable)}
  IF to_regprocedure('${signature}') IS NULL THEN
    RAISE EXCEPTION '${label}: migration-027 load_catalog_content_draft is missing at its exact signature; wrong or unmigrated database';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${role}') THEN
    RAISE EXCEPTION '${label}: loader role missing';
  END IF;
${postureGate(label)}
${roleBaselineGate(label, role)}
${triggerBindingGate(label)}
${vectorGate(label, v.before, 'pre')}
${historicalRunIntactGate(label)}
${noCarryGate(label)}
${preGates}
${claimsGate(label, 'refusing')}
${functionDenialGate(label, signature, 'refusing before any write or authority change')}
END
$pre$;

${twoGrantorBlock(label, role)}

-- ── THE FIVE LOADS, under the loader authority ONLY; each returned JSONB
--    is asserted by exact equality ──────────────────────────────────────
DO $act$
DECLARE
  v_result JSONB;
BEGIN
${calls}
END
$act$;

${revokeBlock(role, variant === 'no_revoke_stage2')}

-- ── Postconditions (owner reads; ANY mismatch rolls back ALL) ─────────
DO $post$
DECLARE
  v_counts TEXT;
  v_cap    RECORD;
BEGIN
  SELECT * INTO v_cap FROM w14e2_capture;
${roleRestoredGate(label, role)}
${vectorGate(label, postVector, 'post')}
${postRows}
  IF (SELECT count(*) FROM public.exercise_catalog_content c WHERE c.logical_id IN (${FIVE_IDS_SQL})) <> 5 THEN
    RAISE EXCEPTION '${label}: the governed identities do not carry exactly five content versions in total; rolling back everything';
  END IF;
${unchangedGate(label, 'v_cap', captureColumns)}
${claimsGate(label, 'rolling back everything')}
${functionDenialGate(label, signature, 'rolling back everything')}
END
$post$;

${resultSelect(2, 'CONTENT DRAFTS LOADED', `,
       (SELECT count(*) FROM public.exercise_catalog_content WHERE logical_id IN (${FIVE_IDS_SQL}) AND content_status = 'pending') AS pending_drafts`)}

COMMIT;
`
}

// ── Stage 3: content review ──────────────────────────────────────────
function renderStage3(): string {
  const label = 'W14E-3 content review'
  const executable = stageIsExecutable(3)
  const v = stageVector(3)
  const role = 'exlib_catalog_reviewer'
  const signature = 'public.apply_content_review(uuid,uuid,text,text,timestamptz,text)'
  const captureColumns = {
    logical_digest: DIGEST.logical,
    snapshots_digest: DIGEST.snapshotsAll,
    events_digest: DIGEST.eventsAll,
    anatomy_digest: DIGEST.anatomy,
    alias_digest: DIGEST.aliases,
    claims_digest: DIGEST.claims,
    content_outside_five: DIGEST.contentOutsideFive,
    expected_rel_digest: DIGEST.expectedRel,
    projection_digest: DIGEST.projection,
    runs_digest: DIGEST.runsAll,
    run_items_digest: DIGEST.runItemsAll,
  }
  const decisionFor = (e: ManifestEntry): FamilyBDecision | null => {
    const d = decisionsB.get(e.logical_id)!
    if (d.state !== 'RESOLVED') return null
    if (variant === 'tuple_drift_stage3' && e.inventory_file_line === 132) return { ...d.value, reviewer: `${d.value.reviewer} (drifted)` }
    return d.value
  }
  const preGates = manifest.entries.map((e) => `${snapshotReviewTupleGate(label, e, 'approved')}
  IF (SELECT count(*) FROM public.exercise_catalog_content c WHERE c.logical_id = ${uuidLiteral(e.logical_id)}) <> 1
     OR NOT EXISTS (SELECT 1 FROM public.exercise_catalog_content c
       WHERE ${contentPayloadPredicate(e, 'c', 'p')}
         AND c.content_status = 'pending'
         AND c.publication_status = 'draft'
         AND c.import_admitted = false
         AND c.reviewed_by IS NULL AND c.reviewed_at IS NULL AND c.review_rationale IS NULL) THEN
    RAISE EXCEPTION '${label}: the content row for inventory line ${e.inventory_file_line} is not the exact loaded pre-review state (payload drifted, or the review is already applied - this ONE-USE decision is spent; READ STATE FIRST); refusing before any write or authority change';
  END IF;`).join('\n')
  const calls = manifest.entries.map((e) => {
    const n = e.inventory_file_line
    const value = decisionFor(e)
    let reviewer = value ? dollarQuote(`rv${n}`, value.reviewer) : token(`B.${n}.reviewer`)
    if (variant === 'blank_reviewer_stage3' && n === 132) reviewer = "'   '"
    return `  v_result := public.apply_content_review(
    ${uuidLiteral(e.logical_id)},
    ${uuidLiteral(e.content_id)},
    'approved',
    ${reviewer},
    ${value ? timestampLiteral(value.reviewedAt) : token(`B.${n}.reviewed_at`)},
    ${value ? dollarQuote(`rr${n}`, value.rationale) : token(`B.${n}.rationale`)});
  IF v_result IS DISTINCT FROM jsonb_build_object(
       'logical_id', ${uuidLiteral(e.logical_id)},
       'content_id', ${uuidLiteral(e.content_id)},
       'decision', 'approved') THEN
    RAISE EXCEPTION '${label}: apply_content_review for inventory line ${n} returned % (not the exact derivable result); rolling back everything', v_result;
  END IF;`
  }).join('\n')
  const postRows = manifest.entries.map((e) => `  IF NOT EXISTS (SELECT 1 FROM public.exercise_catalog_content c
       WHERE ${contentPayloadPredicate(e, 'c', 'q')}
         AND ${contentReviewTuplePredicate(e, 'c', 'q', decisionFor(e) ?? undefined)}
         AND c.publication_status = 'draft'
         AND c.import_admitted = false
         AND c.admitted_fingerprint IS NULL AND c.admitted_source_sha256 IS NULL AND c.admitted_at IS NULL) THEN
    RAISE EXCEPTION '${label}: the reviewed content row for inventory line ${e.inventory_file_line} is not exact (decision, audit tuple, frozen payload, draft publication, or absent admission drifted); rolling back everything';
  END IF;`).join('\n')
  return `${boundaryHeader(3, 'CONTENT REVIEW (family B) for the five weight_time identities', [
    'performs EXACTLY FIVE public.apply_content_review calls under the exlib_catalog_reviewer authority, each carrying the HUMAN decision approved plus the reviewer, the exact offset timestamp and the rationale VERBATIM from the completed family B form',
    'the review evidence lives on the content row (reviewed_by / reviewed_at / review_rationale); the SNAPSHOT-scoped review-events log is untouched BY SCHEMA DESIGN and the vector does not move',
    'the reviewer\'s operator-validated role/credential and the per-entry judgment confirmations remain in the completed form: migration 027\'s review surface carries no column for them',
  ], [
    'LOAD-BEARING SEPARATION: a review decision may not travel with a payload change or an admission change (the freeze trigger refuses); this package changes exactly the review surface of five rows and nothing else',
    'NO admission, publication, projection, run, membership, seal, revocation, delivery, tenant change or environment change',
  ], executable, 'family A gated; family B: docs/weight-time-five-entry-content-review-form.json')}

${transactionOpen(3, executable)}

${captureTable('w14e3_capture', captureColumns)}

-- ── Preconditions (owner-role reads, BEFORE any authority change) ─────
DO $pre$
DECLARE
  v_counts TEXT;
  v_line   TEXT;
BEGIN
${preambleGuards(3, label, executable)}
  IF to_regprocedure('${signature}') IS NULL THEN
    RAISE EXCEPTION '${label}: migration-027 apply_content_review is missing at its exact signature; wrong or unmigrated database';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${role}') THEN
    RAISE EXCEPTION '${label}: reviewer role missing';
  END IF;
${postureGate(label)}
${roleBaselineGate(label, role)}
${vectorGate(label, v.before, 'pre')}
${historicalRunIntactGate(label)}
${noCarryGate(label)}
${preGates}
${claimsGate(label, 'refusing')}
${functionDenialGate(label, signature, 'refusing before any write or authority change')}
END
$pre$;

${twoGrantorBlock(label, role)}

-- ── THE FIVE HUMAN DECISIONS, applied under the reviewer authority ONLY ─
DO $act$
DECLARE
  v_result JSONB;
BEGIN
${calls}
END
$act$;

${revokeBlock(role, false)}

-- ── Postconditions (owner reads; ANY mismatch rolls back ALL) ─────────
DO $post$
DECLARE
  v_counts TEXT;
  v_cap    RECORD;
BEGIN
  SELECT * INTO v_cap FROM w14e3_capture;
${roleRestoredGate(label, role)}
${vectorGate(label, v.after, 'post')}
${postRows}
${unchangedGate(label, 'v_cap', captureColumns)}
${claimsGate(label, 'rolling back everything')}
${functionDenialGate(label, signature, 'rolling back everything')}
END
$post$;

${resultSelect(3, 'CONTENT REVIEWED', `,
       (SELECT count(*) FROM public.exercise_catalog_content WHERE logical_id IN (${FIVE_IDS_SQL}) AND content_status = 'approved') AS approved_content`)}

COMMIT;
`
}

// ── Stage 4: content admission ───────────────────────────────────────
function renderStage4(): string {
  const label = 'W14E-4 content admission'
  const executable = stageIsExecutable(4)
  const v = stageVector(4)
  const role = 'exlib_catalog_admission'
  const signature = 'public.admit_catalog_content(uuid,uuid,text)'
  const sourceSha = variant === 'wrong_carrier_sha_stage4' ? 'f'.repeat(64) : carrierSha
  const captureColumns = {
    logical_digest: DIGEST.logical,
    snapshots_digest: DIGEST.snapshotsAll,
    events_digest: DIGEST.eventsAll,
    anatomy_digest: DIGEST.anatomy,
    alias_digest: DIGEST.aliases,
    claims_digest: DIGEST.claims,
    content_outside_five: DIGEST.contentOutsideFive,
    expected_rel_digest: DIGEST.expectedRel,
    projection_digest: DIGEST.projection,
    runs_digest: DIGEST.runsAll,
    run_items_digest: DIGEST.runItemsAll,
  }
  const fingerprintFor = (e: ManifestEntry): string => {
    const d = decisionsB.get(e.logical_id)!
    if (d.state !== 'RESOLVED') return token(`B.${e.inventory_file_line}.admission_fingerprint(derived)`)
    const fp = sha256Hex(expectedAdmissionManifest(e, d.value))
    return `'${variant === 'wrong_fingerprint_stage4' && e.inventory_file_line === 132 ? 'e'.repeat(64) : fp}'`
  }
  const preGates = manifest.entries.map((e) => `${snapshotGovernedGate(label, e, String(e.inventory_file_line))}\n${snapshotReviewTupleGate(label, e, 'approved')}
  IF (SELECT count(*) FROM public.exercise_catalog_content c WHERE c.logical_id = ${uuidLiteral(e.logical_id)}) <> 1
     OR NOT EXISTS (SELECT 1 FROM public.exercise_catalog_content c
       WHERE ${contentPayloadPredicate(e, 'c', 'p')}
         AND ${contentReviewTuplePredicate(e, 'c', 'p')}
         AND c.publication_status = 'draft'
         AND c.import_admitted = false
         AND c.admitted_fingerprint IS NULL AND c.admitted_source_sha256 IS NULL AND c.admitted_at IS NULL) THEN
    RAISE EXCEPTION '${label}: the content row for inventory line ${e.inventory_file_line} is not the exact reviewed pre-admission state (payload, the applied family B tuple, or the approved/draft/UNADMITTED lifecycle drifted - a second admission is refused by design; READ STATE FIRST); refusing before any write or authority change';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_content_expected_relationships x WHERE x.content_id = ${uuidLiteral(e.content_id)}) <> ${e.candidate_content_payload.expected_relationships.length} THEN
    RAISE EXCEPTION '${label}: the expected-relationship set for inventory line ${e.inventory_file_line} drifted; refusing';
  END IF;`).join('\n')
  const calls = manifest.entries.map((e) => {
    const n = e.inventory_file_line
    return `  v_result := public.admit_catalog_content(
    ${uuidLiteral(e.logical_id)},
    ${uuidLiteral(e.content_id)},
    '${sourceSha}');
  IF v_result IS DISTINCT FROM jsonb_build_object(
       'logical_id', ${uuidLiteral(e.logical_id)},
       'admitted', ${uuidLiteral(e.content_id)},
       'content_version', ${e.content_version},
       'admitted_fingerprint', ${fingerprintFor(e)},
       'admitted_source_sha256', '${sourceSha}') THEN
    RAISE EXCEPTION '${label}: admit_catalog_content for inventory line ${n} returned % - the database-computed admission fingerprint or the echo differs from the PRECOMPUTED expected value (migration 027 manifest v2 recomputed in the generator); rolling back everything', v_result;
  END IF;`
  }).join('\n')
  const postRows = manifest.entries.map((e) => `  IF NOT EXISTS (SELECT 1 FROM public.exercise_catalog_content c
       WHERE ${contentPayloadPredicate(e, 'c', 'q')}
         AND ${contentReviewTuplePredicate(e, 'c', 'q')}
         AND c.import_admitted = true
         AND c.admitted_source_sha256 = '${sourceSha}'
         AND c.admitted_fingerprint = ${fingerprintFor(e)}
         AND c.admitted_fingerprint ~ '^[0-9a-f]{64}$'
         AND c.admitted_fingerprint = public.exlib_content_admission_fingerprint(c.id)
         AND c.admitted_at = CURRENT_DATE
         AND c.publication_status = 'draft') THEN
    RAISE EXCEPTION '${label}: the admitted content row for inventory line ${e.inventory_file_line} is not exact (admission surface, precomputed fingerprint equality, fresh recomputation equality, audit tuple, frozen payload, or draft publication drifted); rolling back everything';
  END IF;`).join('\n')
  return `${boundaryHeader(4, 'CONTENT ADMISSION for the five weight_time identities', [
    `performs EXACTLY FIVE public.admit_catalog_content calls under the exlib_catalog_admission authority, each recording the SAME source-artifact provenance: the SHA-256 of the exact reviewed content carrier docs/weight-time-five-entry-content.jsonl (${carrierSha})`,
    'the admission fingerprint is COMPUTED BY THE DATABASE from bound state; the caller cannot supply it. Because migration 027\'s manifest v2 binds only portable state (identity, snapshot fields, anatomy, aliases, payload, authorship, the review tuple as an epoch, expected relationships), the generator PRECOMPUTES each expected value from the same inputs and this package asserts the database agrees - so a bound surface that drifted after the decision refuses here',
  ], [
    'LOAD-BEARING SEPARATION: admission must travel alone (the freeze trigger refuses any payload, review or publication change in the same statement); the vector does not move',
    'NO publication, projection, run, membership, seal, revocation, delivery, tenant change or environment change',
  ], executable, 'families A and B gated (docs/weight-time-five-entry-snapshot-review-form.json, docs/weight-time-five-entry-content-review-form.json)')}

${transactionOpen(4, executable)}

${captureTable('w14e4_capture', captureColumns)}

-- ── Preconditions (owner-role reads, BEFORE any authority change) ─────
DO $pre$
DECLARE
  v_counts TEXT;
  v_line   TEXT;
BEGIN
${preambleGuards(4, label, executable)}
  IF to_regprocedure('${signature}') IS NULL THEN
    RAISE EXCEPTION '${label}: migration-027 admit_catalog_content is missing at its exact signature; wrong or unmigrated database';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${role}') THEN
    RAISE EXCEPTION '${label}: admission role missing';
  END IF;
${postureGate(label)}
${roleBaselineGate(label, role)}
${vectorGate(label, v.before, 'pre')}
${historicalRunIntactGate(label)}
${noCarryGate(label)}
${preGates}
${claimsGate(label, 'refusing')}
${functionDenialGate(label, signature, 'refusing before any write or authority change')}
END
$pre$;

${twoGrantorBlock(label, role)}

-- ── THE FIVE ADMISSIONS, under the admission authority ONLY ───────────
DO $act$
DECLARE
  v_result JSONB;
BEGIN
${calls}
END
$act$;

${revokeBlock(role, false)}

-- ── Postconditions (owner reads; ANY mismatch rolls back ALL) ─────────
DO $post$
DECLARE
  v_counts TEXT;
  v_cap    RECORD;
BEGIN
  SELECT * INTO v_cap FROM w14e4_capture;
${roleRestoredGate(label, role)}
${vectorGate(label, v.after, 'post')}
${postRows}
${unchangedGate(label, 'v_cap', captureColumns)}
${claimsGate(label, 'rolling back everything')}
${functionDenialGate(label, signature, 'rolling back everything')}
END
$post$;

${resultSelect(4, 'CONTENT ADMITTED', `,
       (SELECT count(*) FROM public.exercise_catalog_content WHERE logical_id IN (${FIVE_IDS_SQL}) AND import_admitted) AS admitted_content`)}

COMMIT;
`
}

// ── Stage 5: content publication ─────────────────────────────────────
function renderStage5(): string {
  const label = 'W14E-5 content publication'
  const executable = stageIsExecutable(5)
  const v = stageVector(5)
  const role = 'exlib_catalog_admin'
  const signature = 'public.publish_catalog_content(uuid,uuid)'
  const captureColumns = {
    logical_digest: DIGEST.logical,
    snapshots_digest: DIGEST.snapshotsAll,
    events_digest: DIGEST.eventsAll,
    anatomy_digest: DIGEST.anatomy,
    alias_digest: DIGEST.aliases,
    claims_digest: DIGEST.claims,
    content_outside_five: DIGEST.contentOutsideFive,
    expected_rel_digest: DIGEST.expectedRel,
    projection_digest: DIGEST.projection,
    runs_digest: DIGEST.runsAll,
    run_items_digest: DIGEST.runItemsAll,
  }
  const fingerprintFor = (e: ManifestEntry): string => {
    const d = decisionsB.get(e.logical_id)!
    return d.state === 'RESOLVED' ? `'${sha256Hex(expectedAdmissionManifest(e, d.value))}'` : token(`B.${e.inventory_file_line}.admission_fingerprint(derived)`)
  }
  const preGates = manifest.entries.map((e) => `  IF (SELECT count(*) FROM public.exercise_catalog_content c WHERE c.logical_id = ${uuidLiteral(e.logical_id)}) <> 1
     OR NOT EXISTS (SELECT 1 FROM public.exercise_catalog_content c
       WHERE ${contentPayloadPredicate(e, 'c', 'p')}
         AND ${contentReviewTuplePredicate(e, 'c', 'p')}
         AND c.import_admitted = true
         AND c.admitted_source_sha256 = '${carrierSha}'
         AND c.admitted_fingerprint = ${fingerprintFor(e)}
         AND c.admitted_fingerprint = public.exlib_content_admission_fingerprint(c.id)
         AND c.admitted_at IS NOT NULL
         AND c.publication_status = 'draft') THEN
    RAISE EXCEPTION '${label}: the content row for inventory line ${e.inventory_file_line} is not the exact admitted pre-publication state (payload, family B tuple, admission provenance, admission freshness, or the approved/admitted/DRAFT lifecycle drifted - a second publication is refused by design; READ STATE FIRST); refusing before any write or authority change';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_relationships r WHERE r.from_logical_id = ${uuidLiteral(e.logical_id)}) <> 0 THEN
    RAISE EXCEPTION '${label}: a projected relationship already exists for inventory line ${e.inventory_file_line}; publication is one-way and this package never re-projects; refusing';
  END IF;`).join('\n')
  const calls = manifest.entries.map((e) => `  v_result := public.publish_catalog_content(
    ${uuidLiteral(e.logical_id)},
    ${uuidLiteral(e.content_id)});
  IF v_result IS DISTINCT FROM jsonb_build_object(
       'logical_id', ${uuidLiteral(e.logical_id)},
       'published', ${uuidLiteral(e.content_id)},
       'retired', NULL,
       'content_version', ${e.content_version},
       'projected_relationships', ${e.candidate_content_payload.expected_relationships.length}) THEN
    RAISE EXCEPTION '${label}: publish_catalog_content for inventory line ${e.inventory_file_line} returned % (not the exact derivable result: retired null because the identity carries exactly one content row, projected 0 because the expected set is empty); rolling back everything', v_result;
  END IF;`).join('\n')
  const postRows = manifest.entries.map((e) => `  IF (SELECT count(*) FROM public.exercise_catalog_content c WHERE c.logical_id = ${uuidLiteral(e.logical_id)} AND c.publication_status = 'published') <> 1
     OR NOT EXISTS (SELECT 1 FROM public.exercise_catalog_content c
       WHERE ${contentPayloadPredicate(e, 'c', 'q')}
         AND ${contentReviewTuplePredicate(e, 'c', 'q')}
         AND c.import_admitted = true
         AND c.admitted_source_sha256 = '${carrierSha}'
         AND c.admitted_fingerprint = ${fingerprintFor(e)}
         AND c.admitted_fingerprint = public.exlib_content_admission_fingerprint(c.id)
         AND c.publication_status = 'published') THEN
    RAISE EXCEPTION '${label}: the published content row for inventory line ${e.inventory_file_line} is not exact (publication status, audit tuple, frozen payload, or the unchanged admission surface drifted); rolling back everything';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_relationships r WHERE r.from_logical_id = ${uuidLiteral(e.logical_id)}) <> ${e.candidate_content_payload.expected_relationships.length} THEN
    RAISE EXCEPTION '${label}: the projected relationship set for inventory line ${e.inventory_file_line} is not exactly the (empty) expected set; rolling back everything';
  END IF;`).join('\n')
  return `${boundaryHeader(5, 'CONTENT PUBLICATION for the five weight_time identities', [
    'performs EXACTLY FIVE public.publish_catalog_content calls under the exlib_catalog_admin authority over the APPROVED AND ADMITTED content rows; publication and the RELATIONSHIP PROJECTION are ONE ATOMIC ACT by schema design - and because every five-entry expected set is EMPTY, each projection swap makes an empty set live, and the relationships table does not change at all (no separate projection package exists or is needed)',
    'the content freeze trigger STRUCTURALLY re-verifies projected-set equality and admission-manifest freshness at draft -> published, for every caller',
  ], [
    'DATABASE PUBLICATION IS NOT PRODUCT DELIVERY: the catalog tables keep RLS with zero policies and no anon/authenticated privileges; nothing here is visible to a tenant and no tenant row changes',
    'LOAD-BEARING SEPARATION: publication must travel alone; the vector does not move',
    'NO run, membership, seal, revocation, delivery, tenant change or environment change',
  ], executable, 'families A and B gated')}

${transactionOpen(5, executable)}

${captureTable('w14e5_capture', captureColumns)}

-- ── Preconditions (owner-role reads, BEFORE any authority change) ─────
DO $pre$
DECLARE
  v_counts TEXT;
  v_line   TEXT;
BEGIN
${preambleGuards(5, label, executable)}
  IF to_regprocedure('${signature}') IS NULL THEN
    RAISE EXCEPTION '${label}: migration-027 publish_catalog_content is missing at its exact signature; wrong or unmigrated database';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${role}') THEN
    RAISE EXCEPTION '${label}: admin role missing';
  END IF;
${postureGate(label)}
${roleBaselineGate(label, role)}
${vectorGate(label, v.before, 'pre')}
${historicalRunIntactGate(label)}
${noCarryGate(label)}
${manifest.entries.map((e) => snapshotReviewTupleGate(label, e, 'approved')).join('\n')}
${preGates}
${claimsGate(label, 'refusing')}
${functionDenialGate(label, signature, 'refusing before any write or authority change')}
  IF has_table_privilege('anon', 'public.exercise_catalog_relationships', 'SELECT')
     OR has_table_privilege('authenticated', 'public.exercise_catalog_relationships', 'SELECT') THEN
    RAISE EXCEPTION '${label}: the protected projection table is readable by an ordinary client role; refusing before any write or authority change';
  END IF;
END
$pre$;

${twoGrantorBlock(label, role)}

-- ── THE FIVE PUBLICATIONS, under the admin authority ONLY ─────────────
DO $act$
DECLARE
  v_result JSONB;
BEGIN
${calls}
END
$act$;

${revokeBlock(role, false)}

-- ── Postconditions (owner reads; ANY mismatch rolls back ALL) ─────────
DO $post$
DECLARE
  v_counts TEXT;
  v_cap    RECORD;
BEGIN
  SELECT * INTO v_cap FROM w14e5_capture;
${roleRestoredGate(label, role)}
${vectorGate(label, v.after, 'post')}
${postRows}
${unchangedGate(label, 'v_cap', captureColumns)}
${claimsGate(label, 'rolling back everything')}
${functionDenialGate(label, signature, 'rolling back everything')}
  IF has_table_privilege('anon', 'public.exercise_catalog_relationships', 'SELECT')
     OR has_table_privilege('authenticated', 'public.exercise_catalog_relationships', 'SELECT') THEN
    RAISE EXCEPTION '${label}: the protected projection table is readable by an ordinary client role; rolling back everything';
  END IF;
END
$post$;

${resultSelect(5, 'CONTENT PUBLISHED', `,
       (SELECT count(*) FROM public.exercise_catalog_content WHERE logical_id IN (${FIVE_IDS_SQL}) AND publication_status = 'published') AS published_content,
       (SELECT count(*) FROM public.exercise_catalog_relationships WHERE from_logical_id IN (${FIVE_IDS_SQL})) AS projected_relationships_from_five`)}

COMMIT;
`
}

// ── Stage 6: run staging ─────────────────────────────────────────────
function runKeyLiteral(): string {
  if (decisionC.state !== 'RESOLVED') return token('C.run_key_literal')
  return `'${variant === 'historical_key_stage6' ? HISTORICAL_RUN_KEY : decisionC.value.runKey}'`
}
function runEvidenceGate(label: string, alias: string): string {
  if (decisionC.state !== 'RESOLVED') {
    return `  IF ${alias}.product_approved_by IS DISTINCT FROM ${token('C.product_approver_identity')}
     OR ${alias}.product_approved_at IS DISTINCT FROM ${token('C.product_approved_at')}
     OR ${alias}.legal_approved_by IS DISTINCT FROM ${token('C.legal_approver_identity')}
     OR ${alias}.legal_approved_at IS DISTINCT FROM ${token('C.legal_approved_at')}
     OR ${alias}.approval_rationale IS DISTINCT FROM ${token('C.approval_rationale')} THEN
    RAISE EXCEPTION '${label}: the run does not carry the reserved family C approval evidence character-for-character; refusing';
  END IF;`
  }
  const c = decisionC.value
  return `  IF ${alias}.product_approved_by IS DISTINCT FROM ${dollarQuote('pab', c.productApprovedBy)}
     OR ${alias}.product_approved_at IS DISTINCT FROM ${timestampLiteral(c.productApprovedAt)}
     OR ${alias}.legal_approved_by IS DISTINCT FROM ${dollarQuote('lab', c.legalApprovedBy)}
     OR ${alias}.legal_approved_at IS DISTINCT FROM ${timestampLiteral(c.legalApprovedAt)}
     OR ${alias}.approval_rationale IS DISTINCT FROM ${dollarQuote('apr', c.approvalRationale)} THEN
    RAISE EXCEPTION '${label}: the run does not carry the reserved family C approval evidence character-for-character; refusing';
  END IF;`
}
function membershipLinesExpected(): string {
  return manifest.entries.map((e) => `exercise#${e.logical_id}`).sort().map((l) => `'${l}'`).join("\n     || E'\\n' || ")
}
function membershipGate(label: string, phase: 'refusing' | 'rolling back everything'): string {
  return `  SELECT string_agg(x.member, E'\\n' ORDER BY x.member)
    INTO v_line
    FROM (
      SELECT 'exercise#' || c.logical_id::text AS member
        FROM public.exercise_catalog_run_items ri
        JOIN public.exercise_catalog c ON c.id = ri.catalog_id
       WHERE ri.run_id = v_run.id AND ri.catalog_id IS NOT NULL
      UNION ALL
      SELECT 'alias#' || a.logical_id::text || '#' || a.alias
        FROM public.exercise_catalog_run_items ri
        JOIN public.exercise_catalog_aliases a ON a.id = ri.catalog_alias_id
       WHERE ri.run_id = v_run.id AND ri.catalog_alias_id IS NOT NULL
    ) x;
  IF v_line IS DISTINCT FROM
        ${membershipLinesExpected()} THEN
    RAISE EXCEPTION '${label}: the membership is not exactly the five governed exercise members with zero alias members; ${phase} (got: %)', coalesce(v_line, '<none>');
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_run_items ri
       WHERE ri.run_id <> v_run.id
         AND ri.run_id <> (SELECT r.id FROM public.exercise_catalog_import_runs r WHERE r.run_key = '${HISTORICAL_RUN_KEY}')) <> 0 THEN
    RAISE EXCEPTION '${label}: membership rows exist outside the new run and the historical plank run; ${phase}';
  END IF;
  SELECT count(*) FILTER (WHERE ri.catalog_id IS NOT NULL),
         count(*) FILTER (WHERE ri.catalog_alias_id IS NOT NULL)
    INTO v_exercise_members, v_alias_members
  FROM public.exercise_catalog_run_items ri
  WHERE ri.run_id = v_run.id;
  IF COALESCE(v_exercise_members, 0) <> 5 OR COALESCE(v_alias_members, 0) <> 0 THEN
    RAISE EXCEPTION '${label}: seal-shape counts are %/% (expected 5 exercise + 0 alias members); ${phase}', v_exercise_members, v_alias_members;
  END IF;
  SELECT count(*) INTO v_unready
    FROM public.exercise_catalog_run_items ri
    JOIN public.exercise_catalog c ON c.id = ri.catalog_id
   WHERE ri.run_id = v_run.id
     AND (c.review_status <> 'approved'
          OR c.is_active = false
          OR c.reviewed_by IS NULL
          OR char_length(btrim(c.reviewed_by)) = 0
          OR c.review_rationale IS NULL
          OR char_length(btrim(c.review_rationale)) = 0);
  IF v_unready <> 0 THEN
    RAISE EXCEPTION '${label}: % exercise member(s) would fail the seal validation; ${phase}', v_unready;
  END IF;`
}
function publishedFiveGate(label: string): string {
  return manifest.entries.map((e) => {
    const d = decisionsB.get(e.logical_id)!
    const fp = d.state === 'RESOLVED' ? `'${sha256Hex(expectedAdmissionManifest(e, d.value))}'` : token(`B.${e.inventory_file_line}.admission_fingerprint(derived)`)
    return `  IF (SELECT count(*) FROM public.exercise_catalog_content c
       WHERE c.id = ${uuidLiteral(e.content_id)} AND c.logical_id = ${uuidLiteral(e.logical_id)}
         AND c.publication_status = 'published' AND c.import_admitted = true
         AND c.content_status = 'approved'
         AND c.admitted_source_sha256 = '${carrierSha}'
         AND c.admitted_fingerprint = ${fp}
         AND c.admitted_fingerprint = public.exlib_content_admission_fingerprint(c.id)) <> 1 THEN
    RAISE EXCEPTION '${label}: the published, admitted, fingerprint-fresh content row for inventory line ${e.inventory_file_line} is not exactly present; the run must never point at unpublished content; refusing';
  END IF;`
  }).join('\n')
}
function renderStage6(): string {
  const label = 'W14E-6 run staging'
  const executable = stageIsExecutable(6)
  const v = stageVector(6)
  let members: string[] = manifest.entries.map((e) => e.logical_id)
  if (variant === 'missing_member_stage6') members = members.slice(0, 4)
  if (variant === 'extra_member_stage6') members = members.concat([PLANK_ID])
  if (variant === 'swap_member_stage6') members = members.slice(0, 4).concat([PLANK_ID])
  if (variant === 'carry_stage6') members = members.concat([CARRY_ID_FOR_CONTROLS])
  const membersSql = members.map((m) => `'${m}'`).join(',\n                        ')
  const captureColumns = {
    logical_digest: DIGEST.logical,
    snapshots_digest: DIGEST.snapshotsAll,
    events_digest: DIGEST.eventsAll,
    anatomy_digest: DIGEST.anatomy,
    alias_digest: DIGEST.aliases,
    claims_digest: DIGEST.claims,
    content_digest: DIGEST.contentAll,
    expected_rel_digest: DIGEST.expectedRel,
    projection_digest: DIGEST.projection,
  }
  const c = decisionC.state === 'RESOLVED' ? decisionC.value : null
  const insertRun = `INSERT INTO public.exercise_catalog_import_runs
  (run_key, dry_run,
   product_approved_by, product_approved_at,
   legal_approved_by, legal_approved_at,
   approval_rationale)
VALUES
  (${runKeyLiteral()}, false,
   ${c ? dollarQuote('pab', c.productApprovedBy) : token('C.product_approver_identity')}, ${c ? timestampLiteral(c.productApprovedAt) : token('C.product_approved_at')},
   ${c ? dollarQuote('lab', c.legalApprovedBy) : token('C.legal_approver_identity')}, ${c ? timestampLiteral(c.legalApprovedAt) : token('C.legal_approved_at')},
   ${c ? dollarQuote('apr', c.approvalRationale) : token('C.approval_rationale')});`
  const postVector = variant === 'sabotage_post_stage6' ? '0/0/0/0/0/0/0/0/0/0/0' : v.after
  return `${boundaryHeader(6, 'DELIVERY RUN STAGING (family C) - the new five-entry run and its membership', [
    'creates EXACTLY ONE new import run in the Design-S4 posture (dry_run = false, approved_for_delivery = false, sealed_at NULL, revoked_at NULL, operational fields NULL) carrying the family C product + legal approval evidence AT CREATION - derived from the promoted EXLIB-2U package: exlib_approve_and_seal_run only VALIDATES evidence, it never writes it',
    'creates EXACTLY FIVE membership rows: the five approved weight_time identities as exercise members, resolved by logical_id + is_active (never a hosted surrogate UUID), and ZERO alias members (none of the five carries an alias)',
    `the new run key is the family C run_key_literal and is NEVER the historical plank key ${HISTORICAL_RUN_KEY} (run_key is UNIQUE forever; the gate below refuses if the chosen key already exists)`,
  ], [
    'NO controlled function exists for run creation (only exlib_approve_and_seal_run writes a run row, and it only UPDATEs one that exists), so the direct owner INSERT is the ONLY lawful surface - the mechanism the promoted EXLIB-2U package used',
    'the staged run is STRUCTURALLY NON-DELIVERABLE: the delivery predicate (approved AND NOT dry AND sealed AND unrevoked) is EVALUATED below and must match zero rows; the delivery function is never called',
    'NO seal, NO revocation, NO delivery, NO change to the historical plank run or its six members, NO snapshot/content/publication/projection change, NO tenant change, NO authority change, NO environment change',
  ], executable, 'families A and B gated; family C: docs/weight-time-five-entry-run-authority-form.json')}

${transactionOpen(6, executable)}

${captureTable('w14e6_capture', captureColumns)}

-- ── Preconditions (ANY mismatch aborts EVERYTHING before any write) ───
DO $pre$
DECLARE
  v_counts TEXT;
  v_line   TEXT;
BEGIN
${preambleGuards(6, label, executable)}
${postureGate(label)}
  IF to_regclass('public.exercise_catalog_import_runs') IS NULL
     OR to_regclass('public.exercise_catalog_run_items') IS NULL
     OR to_regprocedure('public.exlib_approve_and_seal_run(text)') IS NULL
     OR to_regprocedure('public.deliver_catalog_exercises(text)') IS NULL THEN
    RAISE EXCEPTION '${label}: the run tables, the seal function, or the delivery function are missing; wrong or unmigrated database';
  END IF;
${triggerBindingGate(label)}
${authorityBaselineGate(label)}
${vectorGate(label, v.before, 'pre')}
  IF EXISTS (SELECT 1 FROM public.exercise_catalog_import_runs r WHERE r.run_key = ${runKeyLiteral()}) THEN
    RAISE EXCEPTION '${label}: the chosen run key already exists; refusing - run_key is UNIQUE forever, this package is ONE-USE, and the historical plank key must never be reused; READ STATE FIRST';
  END IF;
${historicalRunIntactGate(label)}
${noCarryGate(label)}
  -- every identity the membership INSERT names must resolve to exactly one
  -- ACTIVE snapshot - a listed identity that does not exist would otherwise
  -- silently produce no row
  IF (SELECT count(*) FROM public.exercise_catalog c
       WHERE c.logical_id IN (${membersSql})
         AND c.is_active = true) <> ${members.length} THEN
    RAISE EXCEPTION '${label}: the ${members.length} listed membership identities do not each resolve to exactly one active snapshot; refusing';
  END IF;
${manifest.entries.map((e) => `${snapshotGovernedGate(label, e, String(e.inventory_file_line))}\n${snapshotReviewTupleGate(label, e, 'approved')}`).join('\n')}
${publishedFiveGate(label)}
${claimsGate(label, 'refusing')}
END
$pre$;

-- ── THE ACT: one staged run + its five membership rows ────────────────
${insertRun}

INSERT INTO public.exercise_catalog_run_items (run_id, catalog_id)
SELECT r.id, c.id
  FROM public.exercise_catalog_import_runs r
  JOIN public.exercise_catalog c
    ON c.logical_id IN (${membersSql})
   AND c.is_active = true
 WHERE r.run_key = ${runKeyLiteral()};

-- ── Postconditions (ANY mismatch rolls back EVERYTHING) ──────────────
DO $post$
DECLARE
  v_counts TEXT;
  v_line   TEXT;
  v_cap    RECORD;
  v_run    public.exercise_catalog_import_runs%ROWTYPE;
  v_exercise_members INTEGER;
  v_alias_members    INTEGER;
  v_unready          INTEGER;
BEGIN
  SELECT * INTO v_cap FROM w14e6_capture;
${vectorGate(label, postVector, 'post')}
  SELECT * INTO v_run FROM public.exercise_catalog_import_runs WHERE run_key = ${runKeyLiteral()};
  IF NOT FOUND THEN
    RAISE EXCEPTION '${label}: the staged run row is missing after the act; rolling back everything';
  END IF;
  IF v_run.dry_run <> false
     OR v_run.approved_for_delivery <> false
     OR v_run.sealed_at IS NOT NULL
     OR v_run.revoked_at IS NOT NULL
     OR v_run.started_at IS NOT NULL
     OR v_run.completed_at IS NOT NULL
     OR v_run.result_counts IS NOT NULL
     OR v_run.created_at IS NULL THEN
    RAISE EXCEPTION '${label}: the run row is not exactly the staged Design-S4 posture; rolling back everything';
  END IF;
${runEvidenceGate(label, 'v_run')}
${membershipGate(label, 'rolling back everything')}
  -- STRUCTURAL NON-DELIVERABILITY: the delivery predicate, evaluated - never the function
  IF (SELECT count(*) FROM public.exercise_catalog_import_runs r
       WHERE r.run_key = ${runKeyLiteral()}
         AND r.approved_for_delivery = true
         AND r.dry_run = false
         AND r.sealed_at IS NOT NULL
         AND r.revoked_at IS NULL) <> 0 THEN
    RAISE EXCEPTION '${label}: the staged run satisfies the delivery predicate (it must NOT); rolling back everything';
  END IF;
${unchangedGate(label, 'v_cap', captureColumns)}
${claimsGate(label, 'rolling back everything')}
END
$post$;

${resultSelect(6, 'RUN STAGED', `,
       (SELECT count(*) FROM public.exercise_catalog_import_runs) AS runs,
       (SELECT count(*) FROM public.exercise_catalog_run_items) AS run_items,
       (SELECT (r.dry_run = false AND r.approved_for_delivery = false AND r.sealed_at IS NULL AND r.revoked_at IS NULL)
          FROM public.exercise_catalog_import_runs r WHERE r.run_key = ${runKeyLiteral()}) AS staged_non_deliverable`)}

COMMIT;
`
}

// ── Stage 7: run seal ────────────────────────────────────────────────
function renderStage7(): string {
  const label = 'W14E-7 run seal'
  const executable = stageIsExecutable(7)
  const v = stageVector(7)
  const captureColumns = {
    logical_digest: DIGEST.logical,
    snapshots_digest: DIGEST.snapshotsAll,
    events_digest: DIGEST.eventsAll,
    anatomy_digest: DIGEST.anatomy,
    alias_digest: DIGEST.aliases,
    claims_digest: DIGEST.claims,
    content_digest: DIGEST.contentAll,
    expected_rel_digest: DIGEST.expectedRel,
    projection_digest: DIGEST.projection,
    run_items_digest: DIGEST.runItemsAll,
    new_run_evidence_line: `(SELECT r.run_key || '#' || r.dry_run::text || '#' || r.product_approved_by || '#' || r.product_approved_at::text || '#' || r.legal_approved_by || '#' || r.legal_approved_at::text || '#' || md5(r.approval_rationale) || '#' || r.created_at::text
     FROM public.exercise_catalog_import_runs r WHERE r.run_key = ${runKeyLiteral()})`,
  }
  const postVector = variant === 'sabotage_post_stage7' ? '0/0/0/0/0/0/0/0/0/0/0' : v.after
  return `${boundaryHeader(7, 'RUN SEAL (approve + PERMANENT seal) for the new five-entry run', [
    `performs EXACTLY ONE public.exlib_approve_and_seal_run call on the staged five-entry run; from the committed migration-023 bytes that call atomically sets approved_for_delivery = true and sealed_at = NOW() in the single validated unsealed -> sealed transition, PERMANENTLY freezing the run's five-member membership and every approval-bound field`,
    'the seal function re-validates every exercise member (approved, active, non-blank reviewer, non-blank rationale) independently of stage 1, inside the same statement, through the run-row freeze trigger',
  ], [
    'IRREVERSIBILITY, PLAINLY: a run seals AT MOST ONCE, forever. There is no unseal. The only later transition is exlib_revoke_run_delivery, a ONE-WAY shutdown that reopens nothing and is NOT part of this package. A membership mistake found after this point needs a NEW run with a NEW key',
    'RISK ELEVATION: after the seal the delivery predicate matches this run, so deliver_catalog_exercises(<new key>) becomes REACHABLE by any authenticated caller naming the key - into that caller\'s own tenant. The application delivers only the configured run key, which still names the plank release until the SEPARATE Vercel change (never performed by Claude) repoints it',
    'NO delivery, NO revocation, NO change to the historical plank run, NO snapshot/content/publication/projection change, NO tenant change, NO authority change, NO environment change',
  ], executable, 'families A, B and C gated')}

${transactionOpen(7, executable)}

${captureTable('w14e7_capture', captureColumns)}

-- ── Preconditions (ANY mismatch aborts EVERYTHING before the seal:
--    STOP / DO NOT SEAL) ─────────────────────────────────────────────
DO $pre$
DECLARE
  v_counts TEXT;
  v_line   TEXT;
  v_run    public.exercise_catalog_import_runs%ROWTYPE;
  v_exercise_members INTEGER;
  v_alias_members    INTEGER;
  v_unready          INTEGER;
BEGIN
${preambleGuards(7, label, executable)}
${postureGate(label)}
  IF to_regclass('public.exercise_catalog_import_runs') IS NULL
     OR to_regclass('public.exercise_catalog_run_items') IS NULL
     OR to_regprocedure('public.exlib_approve_and_seal_run(text)') IS NULL
     OR to_regprocedure('public.exlib_revoke_run_delivery(text)') IS NULL
     OR to_regprocedure('public.deliver_catalog_exercises(text)') IS NULL THEN
    RAISE EXCEPTION '${label}: the run tables, the seal function, the revocation function, or the delivery function are missing; wrong or unmigrated database; refusing - STOP / DO NOT SEAL';
  END IF;
${triggerBindingGate(label)}
${authorityBaselineGate(label)}
${vectorGate(label, v.before, 'pre')}
${historicalRunIntactGate(label)}
${noCarryGate(label)}
  SELECT * INTO v_run
    FROM public.exercise_catalog_import_runs
   WHERE run_key = ${runKeyLiteral()}
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION '${label}: the staged five-entry run is missing (unknown run key); stage 6 has not run, or the key differs; refusing - STOP / DO NOT SEAL';
  END IF;
  -- ONE-USE: an already-sealed, already-approved, or revoked run means the
  -- seal authority was already consumed; this is also exactly where a
  -- second execution of this package refuses
  IF v_run.sealed_at IS NOT NULL
     OR v_run.approved_for_delivery = true
     OR v_run.revoked_at IS NOT NULL THEN
    RAISE EXCEPTION '${label}: the run is already sealed, approved, or revoked - the seal authority is ONE-USE and this database shows it SPENT; refusing - STOP / DO NOT SEAL; READ STATE FIRST';
  END IF;
  IF v_run.dry_run <> false
     OR v_run.started_at IS NOT NULL
     OR v_run.completed_at IS NOT NULL
     OR v_run.result_counts IS NOT NULL
     OR v_run.created_at IS NULL THEN
    RAISE EXCEPTION '${label}: the staged run is not in the Design-S4 posture (dry_run or an operational field drifted); refusing - STOP / DO NOT SEAL';
  END IF;
${runEvidenceGate(label, 'v_run')}
${membershipGate(label, 'refusing')}
  IF (SELECT count(*) FROM public.exercises e WHERE e.import_run_id = v_run.id) <> 0 THEN
    RAISE EXCEPTION '${label}: tenant rows already carry this run id before the seal (impossible unsealed posture); refusing - STOP / DO NOT SEAL';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_import_runs r
       WHERE r.run_key = ${runKeyLiteral()}
         AND r.approved_for_delivery = true AND r.dry_run = false
         AND r.sealed_at IS NOT NULL AND r.revoked_at IS NULL) <> 0 THEN
    RAISE EXCEPTION '${label}: the run already satisfies the delivery predicate BEFORE sealing (impossible unsealed posture); refusing - STOP / DO NOT SEAL';
  END IF;
${manifest.entries.map((e) => `${snapshotGovernedGate(label, e, String(e.inventory_file_line))}\n${snapshotReviewTupleGate(label, e, 'approved')}`).join('\n')}
${publishedFiveGate(label)}
${claimsGate(label, 'refusing')}
END
$pre$;

-- ── THE ACT: exactly ONE seal call, its result validated ──────────────
DO $act$
DECLARE
  v_result JSONB;
BEGIN
  v_result := public.exlib_approve_and_seal_run(${runKeyLiteral()});
  IF v_result IS DISTINCT FROM jsonb_build_object(
       'run_key', ${runKeyLiteral()},
       'sealed', true,
       'exercise_members', 5,
       'alias_members', 0) THEN
    RAISE EXCEPTION '${label}: the seal function returned % (expected exactly the reserved four-field result); rolling back everything - the attempted seal does not survive', v_result;
  END IF;
END
$act$;

-- ── Postconditions (ANY mismatch rolls back EVERYTHING, including
--    the seal itself) ───────────────────────────────────────────────
DO $post$
DECLARE
  v_counts TEXT;
  v_line   TEXT;
  v_cap    RECORD;
  v_run    public.exercise_catalog_import_runs%ROWTYPE;
  v_exercise_members INTEGER;
  v_alias_members    INTEGER;
  v_unready          INTEGER;
BEGIN
  SELECT * INTO v_cap FROM w14e7_capture;
${vectorGate(label, postVector, 'post')}
  SELECT * INTO v_run FROM public.exercise_catalog_import_runs WHERE run_key = ${runKeyLiteral()};
  IF NOT FOUND THEN
    RAISE EXCEPTION '${label}: the sealed run row is missing after the act; rolling back everything - the attempted seal does not survive';
  END IF;
  IF v_run.approved_for_delivery <> true
     OR v_run.sealed_at IS NULL
     OR v_run.sealed_at <> now()
     OR v_run.revoked_at IS NOT NULL
     OR v_run.started_at IS NOT NULL
     OR v_run.completed_at IS NOT NULL
     OR v_run.result_counts IS NOT NULL THEN
    RAISE EXCEPTION '${label}: the run row is not exactly the sealed posture (approved, sealed at this transaction instant, unrevoked, operational fields NULL); rolling back everything - the attempted seal does not survive';
  END IF;
  IF (v_run.run_key || '#' || v_run.dry_run::text || '#' || v_run.product_approved_by || '#' || v_run.product_approved_at::text || '#' || v_run.legal_approved_by || '#' || v_run.legal_approved_at::text || '#' || md5(v_run.approval_rationale) || '#' || v_run.created_at::text)
     IS DISTINCT FROM v_cap.new_run_evidence_line THEN
    RAISE EXCEPTION '${label}: an immutable evidence field changed across the seal (the seal freezes, never edits); rolling back everything - the attempted seal does not survive';
  END IF;
${runEvidenceGate(label, 'v_run')}
${membershipGate(label, 'rolling back everything')}
  -- THE INTENDED IRREVERSIBLE EFFECT, STATED AND VERIFIED: the delivery
  -- predicate NOW matches exactly this run (and still exactly the historical
  -- plank run). Delivery itself did NOT run for this run.
  IF (SELECT count(*) FROM public.exercise_catalog_import_runs r
       WHERE r.run_key = ${runKeyLiteral()}
         AND r.approved_for_delivery = true AND r.dry_run = false
         AND r.sealed_at IS NOT NULL AND r.revoked_at IS NULL) <> 1 THEN
    RAISE EXCEPTION '${label}: the sealed run does not satisfy the delivery predicate exactly once; rolling back everything - the attempted seal does not survive';
  END IF;
  IF (SELECT count(*) FROM public.exercises e WHERE e.import_run_id = v_run.id) <> 0 THEN
    RAISE EXCEPTION '${label}: delivery from the new run occurred inside the gated interval; rolling back everything - the attempted seal does not survive';
  END IF;
${unchangedGate(label, 'v_cap', captureColumns)}
${claimsGate(label, 'rolling back everything')}
END
$post$;

${resultSelect(7, 'RUN SEALED', `,
       (SELECT r.approved_for_delivery FROM public.exercise_catalog_import_runs r WHERE r.run_key = ${runKeyLiteral()}) AS approved_for_delivery,
       (SELECT r.sealed_at FROM public.exercise_catalog_import_runs r WHERE r.run_key = ${runKeyLiteral()}) AS sealed_at,
       (SELECT count(*) FROM public.exercise_catalog_import_runs x
         WHERE x.approved_for_delivery = true AND x.dry_run = false AND x.sealed_at IS NOT NULL AND x.revoked_at IS NULL) AS delivery_predicate_rows_total,
       (SELECT count(*) FROM public.exercises e JOIN public.exercise_catalog_import_runs r ON r.id = e.import_run_id WHERE r.run_key = ${runKeyLiteral()}) AS delivered_tenant_rows_new_run`)}

COMMIT;
`
}

// ── Human review page (reviewer-facing, one page for all five) ───────
function renderHumanReview(): string {
  const L: string[] = []
  L.push('# weight_time five-entry release: human review page')
  L.push('')
  L.push('STATUS: FOR HUMAN REVIEW. Nothing here is approved. Blank is never approval. Every value below is')
  L.push('rendered from committed bytes (`docs/weight-time-five-entry-lifecycle-manifest.json`), never retyped.')
  L.push('')
  L.push('GENERATED FILE. Do not edit by hand - regenerate with')
  L.push('`npx tsx scripts/generate-weight-time-five-entry-packages.ts`.')
  L.push('')
  L.push('## What you are deciding, in one paragraph')
  L.push('')
  L.push('Five weight_time catalog snapshots already exist on hosted ShredOS, pending review (loaded by the')
  L.push('spent W14 act). Three decisions are needed, on three blank forms. **Family A** (one per exercise):')
  L.push('is the catalog snapshot - its identity and metadata below - approved for release? **Family B** (one')
  L.push('per exercise): is the AI-drafted instructional content below fit to publish? **Family C** (once):')
  L.push('the permanent run key and the product + legal authority for the new delivery run. The three carries')
  L.push('(Farmer\'s carry, Suitcase carry, Sandbag bear-hug carry) are NOT in scope and appear nowhere.')
  L.push('')
  L.push('## Who may decide (surfaced, not resolved)')
  L.push('')
  L.push('- Family A and family C precedent: the operator (Joseph Carfagno) decided both for the plank release.')
  L.push('- Family B precedent: the one promoted content review in this repository was performed by a **named')
  L.push('  external specialist with a stated credential** (a personal trainer), and the form inherited from it')
  L.push('  says "named human specialist, never AI". The database enforces only a non-blank reviewer string.')
  L.push('  **Decide who completes family B before the sitting** (reviewer question RQ-4 in the content form).')
  L.push('')
  L.push('## The forms')
  L.push('')
  L.push('| Family | Form | Cardinality | Leaves per decision |')
  L.push('| --- | --- | --- | --- |')
  L.push('| A | `docs/weight-time-five-entry-snapshot-review-form.json` | 5 | decision (APPROVE / REJECT / CORRECT), reviewer, reviewer_role_or_credential, reviewed_at (with offset), rationale (>= 10 chars), optional evidence |')
  L.push('| B | `docs/weight-time-five-entry-content-review-form.json` | 5 | decision (approved / revised / rejected), reviewer, reviewer_role_or_credential, reviewed_at, rationale, the per-exercise judgment confirmations, optional evidence |')
  L.push('| C | `docs/weight-time-five-entry-run-authority-form.json` | 1 | run_key_literal, product approver + timestamp, legal approver + timestamp, approval_rationale, run_membership |')
  L.push('')
  L.push(`Only APPROVE (A) and approved (B) have prepared packages. Any other choice ends the release for that`)
  L.push('exercise and needs its own instruction; the generator refuses to render a package for it.')
  L.push('')
  L.push('## Open reviewer questions (answer at the sitting)')
  L.push('')
  L.push('- **RQ-1** (all five, family B): expected relationships are EMPTY for every entry; no substitution,')
  L.push('  progression or regression edge is proposed. Adding edges is legitimate and costs one regeneration.')
  L.push('- **RQ-2** (133, family A): source_url and source_page are the same standalone article URL; lawful and')
  L.push('  ruled in W14; restated so approval is informed.')
  L.push('- **RQ-3** (138, family A): availability is `minimal` (a wall and one plate), the other four are `home_gym`.')
  L.push('- **RQ-4** (all five, family B): who may lawfully complete family B (see above).')
  L.push('- **RQ-5** (132, family B): the plate is placed and removed by another person "whenever you can"; the')
  L.push('  accessibility alternative is unweighted. Is a solo trainee adequately served?')
  L.push(`- **RQ-6** (family C): confirm or replace the proposed run key \`${manifest.delivery_run.proposed_run_key}\` (permanent, globally unique).`)
  L.push('- **RQ-7** (family C): the plank precedent had one named human give both product and legal approval at')
  L.push('  the same instant; confirm the same posture or name a second approver.')
  L.push('- **RQ-8** (family C): the sealed plank run stays sealed; the intent is to ADD a second sealed run and')
  L.push('  later repoint delivery to it, not to revoke the plank run.')
  L.push('')
  L.push('## The five exercises')
  L.push('')
  for (const e of manifest.entries) {
    const s = e.existing_snapshot_fingerprint.governed_fields
    const c = e.candidate_content_payload
    L.push(`### ${e.inventory_file_line}. ${e.canonical_name}`)
    L.push('')
    L.push(`- logical identity: \`${e.logical_id}\` (frozen in W14); content version 1 id: \`${e.content_id}\``)
    L.push(`- tracking contract: **weight_time** - recorded as added weight plus duration, never repetitions`)
    L.push('')
    L.push('**Snapshot metadata (family A decides this; every field is immutable at catalog_version 1 once approved)**')
    L.push('')
    L.push('| Field | Value |')
    L.push('| --- | --- |')
    L.push(`| category / primary_muscle / equipment | ${s.category} / ${s.primary_muscle} / ${s.equipment} |`)
    L.push(`| laterality / tracking_mode | ${s.laterality} / ${s.tracking_mode} |`)
    L.push(`| movement_pattern / training_role | ${s.movement_pattern} / ${s.training_role} |`)
    L.push(`| difficulty / availability | ${s.difficulty} / ${s.availability} |`)
    L.push(`| anatomy (secondary/tertiary) | ${s.anatomy.map((m) => `${m.muscle}:${m.role}`).join(', ')} |`)
    L.push(`| aliases | ${s.aliases.length === 0 ? '(none)' : s.aliases.join(', ')} |`)
    L.push(`| provenance | ${s.provenance} |`)
    if (s.provenance === 'external_source_derived') {
      L.push(`| source_url | ${s.source_url} |`)
      L.push(`| source_page | ${s.source_page} |`)
      L.push(`| retrieved_at / import_confidence | ${s.retrieved_at} / ${s.import_confidence} |`)
    } else {
      L.push('| source fields | all four NULL (ForgeFitOS original; constraint-enforced) |')
    }
    L.push(`| snapshot payload fingerprint (W14) | \`${e.existing_snapshot_fingerprint.payload_fingerprint_sha256}\` |`)
    L.push('')
    L.push('**Proposed instructional content (family B decides this; AI-drafted, no human endorsement yet)**')
    L.push('')
    L.push(`- authored_by: ${c.authored_by}; authored_at: ${c.authored_at}`)
    L.push(`- content payload fingerprint: \`${e.content_payload_fingerprint.sha256}\``)
    L.push('')
    L.push('Setup:')
    L.push('')
    c.setup_steps.forEach((step, i) => L.push(`${i + 1}. ${step}`))
    L.push('')
    L.push('Execution:')
    L.push('')
    c.execution_steps.forEach((step, i) => L.push(`${i + 1}. ${step}`))
    L.push('')
    L.push(`Breathing cue: ${c.breathing_cue}`)
    L.push('')
    L.push('Common mistakes:')
    L.push('')
    c.common_mistakes.forEach((m) => L.push(`- ${m}`))
    L.push('')
    L.push(`Safety: ${c.safety_guidance}`)
    L.push('')
    L.push(`Equipment setup: ${c.equipment_setup}`)
    L.push('')
    L.push(`Accessibility alternative: ${c.accessibility_alternative}`)
    L.push('')
    L.push(`Expected relationships: ${c.expected_relationships.length === 0 ? '(none proposed; see RQ-1)' : JSON.stringify(c.expected_relationships)}`)
    L.push('')
    L.push('**Decisions required for this exercise**')
    L.push('')
    L.push(`- Family A leaf set: \`entries[${e.inventory_file_line}].human_fields\` in the snapshot form - decision, reviewer, reviewer_role_or_credential, reviewed_at, rationale.`)
    L.push(`- Family B leaf set: the entry with content_id \`${e.content_id}\` in the content form - decision, reviewer, reviewer_role_or_credential, reviewed_at, rationale, and each needs_human_judgment_confirmations key (true or false).`)
    L.push('')
  }
  L.push('## Family C, once for the run')
  L.push('')
  L.push(`- run_key_literal: blank. Proposal for confirmation: \`${manifest.delivery_run.proposed_run_key}\` (must never be \`${HISTORICAL_RUN_KEY}\`).`)
  L.push('- product approver identity + timestamp (with offset), legal approver identity + timestamp (with offset).')
  L.push('- approval_rationale: state plainly what the approval does NOT authorize (it does not enable production')
  L.push('  delivery; the Vercel run-key change is a separate operator act).')
  L.push('- run_membership: the one offered choice, `ALL_FIVE_WEIGHT_TIME_IDENTITIES`.')
  L.push('')
  L.push('## What happens after the forms are complete')
  L.push('')
  L.push('The same generator renders the seven executable hosted packages from the completed forms (a new')
  L.push('commit, reviewed independently), and each package is then executed ONCE by Joseph/ChatGPT against')
  L.push('ShredOS under its own one-use instruction, in the order stated in')
  L.push('`docs/weight-time-five-entry-operator-runbook.md`. Nothing in this page performs any of that.')
  L.push('')
  return `${L.join('\n')}`
}

// ── Emit or check ────────────────────────────────────────────────────
const renderings: { path: string; text: string }[] = [
  renderStage1, renderStage2, renderStage3, renderStage4, renderStage5, renderStage6, renderStage7,
].map((render, index) => ({
  path: path.join(outDirectory, path.basename(manifest.stage_packages[index].path)),
  text: render(),
}))
if (!isTestMode) {
  renderings.push({ path: path.join(REPO_ROOT, HUMAN_REVIEW_RELATIVE_PATH), text: renderHumanReview() })
}

// Fail closed: a real (non-test) executable rendering must never carry the
// marker, and a template must carry at least one token in every dependent leaf.
for (const r of renderings) {
  if (!isTestMode && r.text.includes(TEST_ONLY_MARKER) && r.path.endsWith('.sql')) fail(`a real rendering carries the ${TEST_ONLY_MARKER} marker: ${r.path}`)
}

if (isCheckMode) {
  let drift = 0
  for (const r of renderings) {
    if (!existsSync(r.path)) { process.stderr.write(`FATAL: --check: ${r.path} does not exist\n`); drift += 1; continue }
    const onDisk = readFileSync(r.path, 'utf8')
    if (onDisk !== r.text) {
      process.stderr.write(`FATAL: --check: ${path.relative(REPO_ROOT, r.path)} differs from a fresh rendering (on disk ${onDisk.length} bytes sha256 ${sha256Hex(onDisk)}; regenerated ${r.text.length} bytes sha256 ${sha256Hex(r.text)})\n`)
      drift += 1
    }
  }
  if (drift > 0) process.exit(1)
  process.stdout.write(`PACKAGES CHECK OK  ${renderings.length} renderings byte-identical\n`)
  process.exit(0)
}

mkdirSync(outDirectory, { recursive: true })
for (const r of renderings) {
  writeFileSync(r.path, r.text, 'utf8')
  const size = statSync(r.path).size
  process.stdout.write(`wrote ${path.relative(REPO_ROOT, r.path)}  ${size} bytes  sha256 ${sha256Hex(readFileSync(r.path))}\n`)
}
process.stdout.write(`mode: ${isTestMode ? 'TEST-ONLY' : 'real'}; families resolved A=${familyAResolved} B=${familyBResolved} C=${familyCResolved}; variant=${variantName || '(none)'}\n`)
for (const stage of [1, 2, 3, 4, 5, 6, 7]) {
  process.stdout.write(`  stage ${stage}: ${stageIsExecutable(stage) ? 'EXECUTABLE' : `TEMPLATE (${unresolvedLeavesFor(stage).length} unresolved leaves)`}\n`)
}
