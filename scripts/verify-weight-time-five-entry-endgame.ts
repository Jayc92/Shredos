// ============================================================
// ForgeFitOS — weight_time five-entry ENDGAME: static complete-endgame verifier.
//
// Asserts the whole local preparation INDEPENDENTLY of the two generators that
// produced it. Where a generator reads a carrier and writes an artifact, this
// verifier reads both separately and requires them to agree, so a generator
// bug, a hand edit, or a filled-in human decision surviving into a committed
// artifact all show up here.
//
// What it covers that no database can: which five UUIDs are governed, that the
// content ids follow the +0x100 convention, that every human decision leaf is
// still BLANK in the committed forms, that every committed package is a
// NON-EXECUTABLE TEMPLATE (sentinel + unresolved tokens, no resolved human
// literal, no synthetic marker), that no package names a carry, that the
// membership list is exactly the five, that the historical run key is never
// written, that the stage vectors chain, that the committed governance still
// carries the exact signatures the packages call, and that the change surface
// is exactly this preparation and nothing else. The disposable proof
// (scripts/verify-weight-time-five-entry-endgame-live.sh) covers what lands in
// PostgreSQL; both are required.
//
// The negative controls at the end are the point of the structure: every
// assertion set is re-run against deliberately corrupted copies of the
// artifacts, and each control must be REJECTED BY THE ASSERTION IT TARGETS.
//
// Never contacts Supabase, Vercel, or any remote service, and never touches a
// database - it reads committed bytes, the working tree, and git objects only.
// Run from the repository root:
//   npx tsx scripts/verify-weight-time-five-entry-endgame.ts
// ============================================================

import path from 'node:path'
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'

const repositoryRoot = process.cwd()

const MANIFEST_PATH = 'docs/weight-time-five-entry-lifecycle-manifest.json'
const W14_MANIFEST_PATH = 'docs/weight-time-w14-admission-manifest.json'
const CARRIER_PATH = 'docs/weight-time-five-entry-content.jsonl'
const FORM_A_PATH = 'docs/weight-time-five-entry-snapshot-review-form.json'
const FORM_B_PATH = 'docs/weight-time-five-entry-content-review-form.json'
const FORM_C_PATH = 'docs/weight-time-five-entry-run-authority-form.json'
const MATRIX_PATH = 'docs/weight-time-five-entry-endgame-discovery-matrix.md'
const DEPENDENCY_PATH = 'docs/weight-time-five-entry-delivery-configuration-dependency.md'
const HUMAN_REVIEW_PATH = 'docs/weight-time-five-entry-human-review.md'
const DECISION_RECORD_PATH = 'docs/weight-time-five-entry-human-decision-record.md'
const RUNBOOK_PATH = 'docs/weight-time-five-entry-operator-runbook.md'
/** The frozen W14-E executable-package review bundle: a review record, not a generated artifact, so D16 makes it agree with the tree rather than with itself. */
const REVIEW_BUNDLE_PATH = 'docs/weight-time-five-entry-executable-package-review-bundle.md'
const PROBE_PATH = 'docs/weight-time-five-entry-read-state.sql'
const REPORT_PATH = 'docs/weight-time-five-entry-endgame-report.md'
const MANIFEST_GENERATOR_PATH = 'scripts/generate-weight-time-five-entry-manifest.ts'
const PACKAGE_GENERATOR_PATH = 'scripts/generate-weight-time-five-entry-packages.ts'
const LIVE_VERIFIER_PATH = 'scripts/verify-weight-time-five-entry-endgame-live.sh'
const STATIC_VERIFIER_PATH = 'scripts/verify-weight-time-five-entry-endgame.ts'
const PACKAGE_DIR = 'docs/weight-time-five-entry-packages'
const PACKAGE_FILES = [
  '01-snapshot-review.sql', '02-content-draft-load.sql', '03-content-review.sql', '04-content-admission.sql',
  '05-content-publication.sql', '06-run-staging.sql', '07-run-seal.sql',
]

/** The published production main this preparation descends from. */
const PRODUCTION_BASE_COMMIT = '54a9d128bca659ec89d3ae149d47450e74a2ad2e'
const PRODUCTION_BASE_TREE = '0b438079693867fd1757cec383a2bc986b1c905c'

/**
 * The PRE-DECISION commit: the three BLANK forms, the seven NON-EXECUTABLE
 * templates and the pre-review human page, exactly as the humans reviewed them.
 *
 * When the decisions arrived the blank-form lifecycle was not deleted, it was
 * RETARGETED at this immutable object - the treatment W11 (76bfffcc) and W12-C
 * (ff2e6ee4) used for migration-inventory pins - so every fail-closed
 * blank-state assertion below still runs, against the bytes it was written
 * for. Section A runs the assertion set in RECORDED mode against the working
 * tree; section A0 runs the identical set in BLANK mode against this commit.
 */
const PRE_DECISION_COMMIT = '9bf9e6c861c226fd12b67e2dcd72dd7d4cdbafa8'
const PRE_DECISION_TREE = 'c9ead021907af098a1467b6cc7bad7a2eabdcf79'

/**
 * The governing human decisions, pinned here as literals. None of it is
 * derived from the forms or the packages this file reads, so a later silent
 * edit to a reviewer, a role, a timestamp or a rationale - in a form, in a
 * rendered package, or in the decision record - fails here rather than
 * shipping.
 */
const DECISION_TIMESTAMP = '2026-09-13T18:25:13-04:00'
const FAMILY_A_DECISION = {
  decision: 'APPROVE',
  reviewer: 'Joseph Carfagno',
  role: 'ForgeFitOS operator',
  rationale: 'I approve all five catalog snapshots as accurate for release.',
}
const FAMILY_B_DECISION = {
  decision: 'approved',
  reviewer: 'Nick Tkacz',
  role: 'Physical Trainer',
  rationale: 'I, Nick Tkacz, Physical Trainer, reviewed all five exercises. I approve all five as written and confirm all listed judgment items for each exercise.',
}
const FAMILY_C_APPROVER = 'Joseph Carfagno'
const RESOLVED_RUN_KEY = 'w14e-weight-time-release1-staged-v1'
const RESOLVED_RUN_MEMBERSHIP = 'CUMULATIVE_HISTORICAL_SIX_PLUS_FIVE_WEIGHT_TIME_IDENTITIES'
/**
 * The five admission fingerprints stage 4 pins, in manifest order. Literals on
 * purpose: PostgreSQL computes these itself from Nick's review tuple
 * (exlib_content_admission_fingerprint), the disposable live proof requires the
 * rendered pins to equal what the database computes, and this pin requires the
 * rendered pins to be the ones that were proved.
 */
const ADMISSION_FINGERPRINTS = [
  '9cbc10c9284f3e23f1123b647f17ee6bc05e8e452f5aa821b9a99256c9ddae7c',
  'bb705be0318c34b7fd2ecd51039a665ad087be8f69fc227cf44a53ddbb06f1a5',
  'e10369c291030ed61ddc48eda0c5c8759e0f3a7c68229a19a9b7c09792fe2008',
  '05ca70e920ac098f291c9928210f724ba15044bab7fac588591026b3d9d2b932',
  '8a7a94b2ede86cae694cde02fa5652154204a2093562f45c54778d0c2ff68c65',
]
/** The hosted migration-029 facts. OPERATOR-SUPPLIED; never Claude-observed. */
const MIGRATION_029_HOSTED_RECORD = '20260912181551_exlib_plank_cross_run_idempotency_029'
const MIGRATION_029_HOSTED_PROBE = 'migration_029_plank_cross_run_idempotency = APPLIED'

const MIGRATION_028 = 'supabase/migrations/028_weight_time_tracking_mode.sql'
const MIGRATION_029 = 'supabase/migrations/029_exlib_plank_cross_run_idempotency.sql'
const MIGRATION_029_VERIFIER_PATH = 'scripts/verify-weight-time-migration-029.ts'
const MIGRATION_029_LIVE_VERIFIER_PATH = 'scripts/verify-weight-time-migration-029-live.sh'
const MIGRATION_028_BYTES = 37162
const MIGRATION_028_SHA256 = '9b7d3a52dc0b75f129745bec51a4c972aa284bb5cb0d6159e0cbbb981e463fb3'

/** Frozen artifacts this work must not touch, pinned at the bytes W14 recorded. */
const FROZEN: { path: string; bytes: number; sha256: string }[] = [
  { path: 'scripts/verify-weight-time-w14.ts', bytes: 59124, sha256: '7462b768ecdd1c0d69f09ee50844b67b30a4dd3efbd53e6d4840cd760cfa05e6' },
  { path: 'scripts/verify-weight-time-w14-closeout.ts', bytes: 39254, sha256: '4954de840fe9e3279c9a3b06f8a4949b13cacd8994b572aa89cb22f969eaa251' },
  { path: 'docs/weight-time-w14-catalog-admission.sql', bytes: 64653, sha256: 'a928b045cc1397e4145b21a0504d4e7364a37c90b88c1dd85d8df36fb27413cd' },
  { path: MIGRATION_028, bytes: MIGRATION_028_BYTES, sha256: MIGRATION_028_SHA256 },
]

const GOVERNED = [
  { line: 132, logicalId: 'e21b2c00-0000-4000-a000-000000000004', contentId: 'e21b2c00-0000-4000-a000-000000000104', name: 'Plate-weighted plank' },
  { line: 133, logicalId: 'e21b2c00-0000-4000-a000-000000000005', contentId: 'e21b2c00-0000-4000-a000-000000000105', name: 'Weighted vest plank' },
  { line: 137, logicalId: 'e21b2c00-0000-4000-a000-000000000006', contentId: 'e21b2c00-0000-4000-a000-000000000106', name: 'Weighted dead hang' },
  { line: 138, logicalId: 'e21b2c00-0000-4000-a000-000000000007', contentId: 'e21b2c00-0000-4000-a000-000000000107', name: 'Weighted wall sit' },
  { line: 139, logicalId: 'e21b2c00-0000-4000-a000-000000000008', contentId: 'e21b2c00-0000-4000-a000-000000000108', name: 'Weighted vest wall sit' },
]
const CARRY_IDS = ['e21b2c00-0000-4000-a000-000000000009', 'e21b2c00-0000-4000-a000-00000000000a', 'e21b2c00-0000-4000-a000-00000000000b']
// Word-bounded: 'carrying' (a governed field 'carrying the governed W14 fields') is not a carry.
const CARRY_WORDS = /\b(farmer|suitcase|sandbag|carry|carries)\b/i
const HISTORICAL_RUN_KEY = 'exlib2u-plank-release1-staged-v1'
const HOSTED_VECTOR = '8/8/10/3/11/1/2/2/1/6/3'
const HISTORICAL_RUN_PACKAGE_PATH = 'docs/exlib2u-staged-run-package.sql'
/** The historical six, parsed here INDEPENDENTLY of the manifest generator from the promoted 2U package's membership postcondition. */
function historicalSixFromPromotedPackage(): string[] {
  const text = read(HISTORICAL_RUN_PACKAGE_PATH)
  return Array.from(new Set((text.match(/'(alias|exercise)#e21b2c00-0000-4000-a000-[0-9a-f]{12}(#[^']*)?'/g) ?? []).map((l) => l.slice(1, -1)))).sort()
}
const SYNTHETIC_MARKER = 'TEST-ONLY'
const PLANK_ID = 'e21b2c00-0000-4000-a000-000000000001'
/** The three historical plank-release identities (Plank, Dead bug, Ab wheel rollout): lawful in gates and in the stage-6/7 carry-forward. */
const HISTORICAL_LOGICAL_IDS = ['e21b2c00-0000-4000-a000-000000000001', 'e21b2c00-0000-4000-a000-000000000002', 'e21b2c00-0000-4000-a000-000000000003']

/** W14-E runtime evidence, written after the hosted run: the record and its verifier. */
const RUNTIME_EVIDENCE_RECORD_PATH = 'docs/weight-time-w14e-production-runtime-evidence-record.md'
const RUNTIME_EVIDENCE_VERIFIER_PATH = 'scripts/verify-weight-time-w14e-production-runtime-record.ts'

const ALLOWED_CHANGED_PATHS = [
  CARRIER_PATH, MATRIX_PATH, FORM_A_PATH, FORM_B_PATH, FORM_C_PATH, DEPENDENCY_PATH, MANIFEST_PATH,
  HUMAN_REVIEW_PATH, DECISION_RECORD_PATH, REVIEW_BUNDLE_PATH, RUNBOOK_PATH, PROBE_PATH, REPORT_PATH,
  MANIFEST_GENERATOR_PATH, PACKAGE_GENERATOR_PATH, LIVE_VERIFIER_PATH, STATIC_VERIFIER_PATH,
  MIGRATION_029, MIGRATION_029_VERIFIER_PATH, MIGRATION_029_LIVE_VERIFIER_PATH,
  ...PACKAGE_FILES.map((f) => `${PACKAGE_DIR}/${f}`),
  // W14-E RUNTIME EVIDENCE (post-run): the durable record of the Production
  // fresh-account delivery smoke test and its own static verifier. Admitted by
  // NAME, exactly two paths, because B6 measures the whole worktree from the
  // production base: there is no way to record what the run did without the
  // census seeing the record. Widening it here keeps the census green ON A
  // KNOWN PAIR rather than leaving it red, where a genuinely stray path would
  // hide inside an already-failing check. Nothing else is admitted, and
  // neither path is under src/ or supabase/, so B7/B8 stay untouched.
  RUNTIME_EVIDENCE_RECORD_PATH, RUNTIME_EVIDENCE_VERIFIER_PATH,
]
/**
 * RETARGET (W14-E — migration 029) surface: the 65 NON-FROZEN historical suites whose migration-inventory
 * pins (exactly 22/24/25/26/27/28 files, no 023/025/026/028/029, nothing under supabase/) were tripped by the
 * authorized migration 029 and retargeted under the MIGRATION_INVENTORY_RETARGET authorization — the same
 * treatment W11 (76bfffcc) and W12-C (ff2e6ee4) applied for 028. Derived mechanically from the inventory-pin
 * census of the 40e12a42 tip (79 failing checks in 67 suites, 0 unclassified), minus the two FROZEN verifiers.
 * Each is admitted into the change surface ONLY if its diff from the production base carries the W14-E
 * retarget label; nothing else may appear.
 */
const RETARGET_SURFACE = [
  'scripts/verify-exlib1a.ts',
  'scripts/verify-exlib1b1.ts',
  'scripts/verify-exlib1b2.ts',
  'scripts/verify-exlib1b3.ts',
  'scripts/verify-exlib1c0.ts',
  'scripts/verify-exlib1c0a.ts',
  'scripts/verify-exlib1c0b.ts',
  'scripts/verify-exlib1c0b2.ts',
  'scripts/verify-exlib1c0b3.ts',
  'scripts/verify-exlib1c0b4.ts',
  'scripts/verify-exlib1c0b5.ts',
  'scripts/verify-exlib2a2b.ts',
  'scripts/verify-exlib2c-batch01.ts',
  'scripts/verify-exlib2c-batch02.ts',
  'scripts/verify-exlib2c-batch03.ts',
  'scripts/verify-exlib2c-batch04.ts',
  'scripts/verify-exlib2c-batch05.ts',
  'scripts/verify-exlib2c-batch06.ts',
  'scripts/verify-exlib2d.ts',
  'scripts/verify-exlib2f.ts',
  'scripts/verify-exlib2f-application.ts',
  'scripts/verify-exlib2f-live.sh',
  'scripts/verify-exlib2k.ts',
  'scripts/verify-exlib2k-application.ts',
  'scripts/verify-exlib2k-live.sh',
  'scripts/verify-exlib2m.ts',
  'scripts/verify-exlib2m-application.ts',
  'scripts/verify-exlib2m-live.sh',
  'scripts/verify-exlib2n.ts',
  'scripts/verify-exlib2n-application.ts',
  'scripts/verify-exlib2o.ts',
  'scripts/verify-exlib2o-application.ts',
  'scripts/verify-exlib2o-live.sh',
  'scripts/verify-exlib2p.ts',
  'scripts/verify-exlib2p-application.ts',
  'scripts/verify-exlib2p-live.sh',
  'scripts/verify-exlib2q.ts',
  'scripts/verify-exlib2q-application.ts',
  'scripts/verify-exlib2q-live.sh',
  'scripts/verify-exlib2r.ts',
  'scripts/verify-exlib2r-application.ts',
  'scripts/verify-exlib2r-live.sh',
  'scripts/verify-exlib2u-live.sh',
  'scripts/verify-exlib2y-live.sh',
  'scripts/verify-exlib2z-live.sh',
  'scripts/verify-food-log-ux.ts',
  'scripts/verify-phase5b3.ts',
  'scripts/verify-phase5b4.ts',
  'scripts/verify-phase5b5.ts',
  'scripts/verify-ui1a.ts',
  'scripts/verify-ui1b.ts',
  'scripts/verify-ui2.ts',
  'scripts/verify-ui3.ts',
  'scripts/verify-ui4.ts',
  'scripts/verify-ui5a.ts',
  'scripts/verify-ui5b1a.ts',
  'scripts/verify-ui5b1b.ts',
  'scripts/verify-ui5b2.ts',
  'scripts/verify-ui6a.ts',
  'scripts/verify-ui6b.ts',
  'scripts/verify-ui6c.ts',
  'scripts/verify-ui7.ts',
  'scripts/verify-weight-time-contract-live.sh',
  'scripts/verify-weight-time-migration-028.ts',
  'scripts/verify-weight-time-w14-live.sh',
]
const RETARGET_LABEL = 'RETARGET (W14-E'
/** Deferred non-blocking maintenance findings (F2/F2a/F2b/F3/F4). Explicitly out of scope. */
const DEFERRED_MAINTENANCE_FILES = [
  'scripts/verify-exlib1c0b3-live.sh', 'scripts/verify-exlib2e-live.sh', 'scripts/verify-exlib2l-live.sh',
]
const GATED_TABLES = [
  'public.exercise_catalog', 'public.exercise_catalog_aliases', 'public.exercise_catalog_content',
  'public.exercise_catalog_content_expected_relationships', 'public.exercise_catalog_import_runs',
  'public.exercise_catalog_logical', 'public.exercise_catalog_muscles', 'public.exercise_catalog_name_claims',
  'public.exercise_catalog_relationships', 'public.exercise_catalog_review_events', 'public.exercise_catalog_run_items',
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
/**
 * Bytes as committed at a given commit. NOT through git() - that trims, and a
 * claim about bytes cannot be made about trimmed bytes.
 */
function readAtCommit(commit: string, relativePath: string): string {
  return execFileSync('git', ['-C', repositoryRoot, 'show', `${commit}:${relativePath}`], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
}
function sha256(text: string | Buffer): string {
  return createHash('sha256').update(text).digest('hex')
}
function git(...args: string[]): string {
  return execFileSync('git', ['-C', repositoryRoot, ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).trim()
}
function gitSucceeds(...args: string[]): boolean {
  try { git(...args); return true } catch { return false }
}
function tsx(args: string[], env: Record<string, string> = {}): { ok: boolean; out: string } {
  try {
    const out = execFileSync('npx', ['--no-install', 'tsx', ...args], { cwd: repositoryRoot, encoding: 'utf8', env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] })
    return { ok: true, out }
  } catch (error) {
    const e = error as { stdout?: string; stderr?: string }
    return { ok: false, out: `${e.stdout ?? ''}${e.stderr ?? ''}` }
  }
}
/** SQL with `--` comments removed, so claims about calls are about executable text. */
function executableSql(sql: string): string {
  return sql.split('\n').map((line) => { const at = line.indexOf('--'); return at === -1 ? line : line.slice(0, at) }).join('\n')
}
/** A literal escaped for use inside a RegExp. */
function rx(literal: string): string {
  return literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
function canonicalJson(value: unknown): string {
  if (value === null) return 'null'
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  if (typeof value === 'object') {
    const o = value as Record<string, unknown>
    return `{${Object.keys(o).sort().map((k) => `${JSON.stringify(k)}:${canonicalJson(o[k])}`).join(',')}}`
  }
  return JSON.stringify(value)
}

// ── the World every assertion reads (pure, so controls can corrupt a copy) ──
type CarrierRecord = Record<string, unknown> & { logical_id: string; content_id: string; inventory_file_line: number; canonical_name: string }
/**
 * The artifact shapes, declared rather than inferred: an assertion that reads
 * `entry.content_id` must fail loudly when the field is renamed, and a control
 * that mutates a governed value must be a compile error if the field is gone.
 */
type GovernedFields = Record<string, unknown> & { tracking_mode: string; laterality: string; availability: string; aliases: unknown[]; anatomy: unknown }
type ManifestEntryShape = {
  inventory_file_line: number; logical_id: string; content_id: string; content_version: number; canonical_name: string
  existing_snapshot_fingerprint: { governed_fields: GovernedFields; payload_fingerprint_sha256: string }
  content_payload_fingerprint: { sha256: string }
  human_decision_slots: Record<string, { filled: boolean; values: unknown }>
}
type ManifestShape = {
  entries: ManifestEntryShape[]
  stage_vectors: { before: string; after: string }[]
  stage_packages: { path: string }[]
  admission_source_sha256: { value: string }
  delivery_run: { proposed_run_key: string; must_not_reuse: { forbidden_run_key: string }; expected_membership: { exercise_members: number; alias_members: number; total_items: number; carried_forward_members: string[]; expected_member_lines: string[] } }
  hosted_pre_state: { vector: string; historical_run: { run_key: string; members: string[] } }
  human_decision_families: { filled: boolean }[]
  boundary_statement: { human_approval: string }
  delivery_configuration_dependency: { required: boolean; claude_performed_the_change: boolean; variable: string }
  bound_artifacts: { path: string; bytes: number; sha256: string }[]
  migration_029?: { path: string; status: string; new_rule: string; hosted_order_dependency: string; hosted_application?: { provenance: string; claude_observed_hosted_state: boolean; claude_applied_it: boolean; migration_record: string; post_apply_read_state_probe: string } }
  expected_delivery_effect?: { case_existing_plank_user_from_historical_run?: { after_migration_029?: { summary?: { inserted: number; skipped_already_delivered: number; plank_disposition: string } } } }
}
type W14EntryShape = Record<string, unknown> & { logical_id: string; canonical_name: string; anatomy: unknown; payload_fingerprint_sha256: string }
type W14Shape = { entries: W14EntryShape[] }
type FormAEntryShape = { inventory_file_line: number; canonical_name: string; logical_id: string; human_fields: Record<string, unknown> }
type FormAShape = { test_only_synthetic_decisions?: boolean; entries: FormAEntryShape[] }
type FormBEntryShape = Record<string, unknown> & { inventory_file_line: number; canonical_name: string; logical_id: string; content_id: string; content_version: number; rationale?: unknown; needs_human_judgment_confirmations: Record<string, unknown> }
type FormBShape = {
  test_only_synthetic_decisions?: boolean; content_artifact: string; content_fingerprint: { sha256: string; bytes: number }
  reviewer_identity_dependency: { raised_as: string; options_without_recommendation: unknown }; decision_requirements: string
  entries: FormBEntryShape[]
}
type FormCShape = {
  test_only_synthetic_decisions?: boolean
  requested_inputs: {
    run_key_literal: { value: unknown; must_not_be: string; preparer_proposal: string }
    product_approver_identity: { value: unknown; product_approved_at: unknown }
    legal_approver_identity: { value: unknown; legal_approved_at: unknown }
    approval_rationale: { value: unknown }
    run_membership: { value: unknown; exact_new_logical_ids: string[]; excluded_deferred_logical_ids: string[]; choices: string[]; carried_forward_from_historical_run: { run_key: string; members: string[] } }
  }
}
type World = {
  manifest: ManifestShape
  w14: W14Shape
  carrierText: string
  carrierRecords: CarrierRecord[]
  formA: FormAShape
  formB: FormBShape
  formC: FormCShape
  packages: Record<string, string>
}
function parseCarrier(text: string): CarrierRecord[] {
  return text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0 && !l.startsWith('#') && !l.startsWith('//')).map((l) => JSON.parse(l) as CarrierRecord)
}
/**
 * Which decision state a World is in. Every assertion that reads a human leaf,
 * or reads a rendering that a human leaf resolves, is a function of this: the
 * lifecycle has exactly two states and the generator refuses the third.
 */
type DecisionMode = 'BLANK' | 'RECORDED'
function loadWorldFrom(readText: (relativePath: string) => string): World {
  const packages: Record<string, string> = {}
  for (const f of PACKAGE_FILES) packages[f] = readText(`${PACKAGE_DIR}/${f}`)
  const carrierText = readText(CARRIER_PATH)
  return {
    manifest: JSON.parse(readText(MANIFEST_PATH)) as ManifestShape,
    w14: JSON.parse(readText(W14_MANIFEST_PATH)) as W14Shape,
    carrierText,
    carrierRecords: parseCarrier(carrierText),
    formA: JSON.parse(readText(FORM_A_PATH)) as FormAShape,
    formB: JSON.parse(readText(FORM_B_PATH)) as FormBShape,
    formC: JSON.parse(readText(FORM_C_PATH)) as FormCShape,
    packages,
  }
}
/** The working tree: completed forms, executable renderings. */
function loadWorld(): World { return loadWorldFrom(read) }
/** The pre-decision commit: blank forms, non-executable templates. */
function loadPreDecisionWorld(): World { return loadWorldFrom((p) => readAtCommit(PRE_DECISION_COMMIT, p)) }

const CONTENT_PARAMETERS: { name: string; field: string; json: boolean }[] = [
  { name: 'p_logical_id', field: 'logical_id', json: false }, { name: 'p_content_id', field: 'content_id', json: false },
  { name: 'p_content_version', field: 'content_version', json: false }, { name: 'p_authored_by', field: 'authored_by', json: false },
  { name: 'p_authored_at', field: 'authored_at', json: false }, { name: 'p_setup_steps', field: 'setup_steps', json: true },
  { name: 'p_execution_steps', field: 'execution_steps', json: true }, { name: 'p_breathing_cue', field: 'breathing_cue', json: false },
  { name: 'p_common_mistakes', field: 'common_mistakes', json: true }, { name: 'p_safety_guidance', field: 'safety_guidance', json: false },
  { name: 'p_equipment_setup', field: 'equipment_setup', json: false }, { name: 'p_accessibility_alternative', field: 'accessibility_alternative', json: false },
  { name: 'p_expected_relationships', field: 'expected_relationships', json: true },
]
/** The manifest's declared content fingerprint scheme, implemented independently of the generator. */
function contentFingerprint(record: CarrierRecord): string {
  let form = ''
  for (const p of CONTENT_PARAMETERS) {
    const v = record[p.field]
    form += `${p.name}=${p.json ? canonicalJson(v) : v === null ? '\\N' : String(v)}\n`
  }
  return sha256(form)
}

function assertArtifacts(w: World, out: Finding[], mode: DecisionMode): void {
  const c = (name: string, ok: boolean, detail?: string) => out.push({ name, ok, detail })
  const m = w.manifest

  // ── M: the lifecycle manifest ─────────────────────────────────────
  c('M1 the manifest governs EXACTLY five identities', Array.isArray(m.entries) && m.entries.length === 5, `${m.entries?.length}`)
  c('M2 the five logical UUIDs are exactly the frozen W14 allocation …0004 to …0008, in manifest order 132,133,137,138,139',
    JSON.stringify((m.entries ?? []).map((e) => [e.inventory_file_line, e.logical_id])) === JSON.stringify(GOVERNED.map((g) => [g.line, g.logicalId])))
  c('M3 every content id follows the established +0x100 convention over its logical id (…0004 -> …0104, as the plank precedent …0001 -> …0101) at content_version 1',
    (m.entries ?? []).every((e) => {
      const tail = parseInt(e.logical_id.slice(-12), 16) + 0x100
      return e.content_id === `${e.logical_id.slice(0, -12)}${tail.toString(16).padStart(12, '0')}` && e.content_version === 1
    }))
  // In a package a carry id may appear ONLY on the exclusion-gate line that
  // asserts its ABSENCE; every other occurrence is a carry being touched.
  const carryOutsideGate = (sql: string): number => sql.split('\n').filter((line) => !line.includes('FROM public.exercise_catalog_logical WHERE id IN (')).filter((line) => CARRY_IDS.some((id) => line.includes(id))).length
  const carryIdHits = CARRY_IDS.filter((id) => (m.entries ?? []).some((e) => e.logical_id === id) || w.carrierRecords.some((r) => r.logical_id === id) || (w.formA.entries ?? []).some((e) => e.logical_id === id) || (w.formB.entries ?? []).some((e) => e.logical_id === id))
  c('M4 no deferred carry identity is governed, carried, packaged or reviewed anywhere (in a package a carry id appears only on the line asserting its absence)',
    carryIdHits.length === 0 && Object.values(w.packages).every((p) => carryOutsideGate(p) === 0) && !(w.carrierRecords.some((r) => CARRY_WORDS.test(r.canonical_name))) && !(w.formA.entries ?? []).some((e) => CARRY_WORDS.test(e.canonical_name ?? '')),
    carryIdHits.join(', ') || 'a carry appears outside the exclusion gate')
  c('M5 every governed snapshot is weight_time, bilateral, with an empty alias set',
    (m.entries ?? []).every((e) => e.existing_snapshot_fingerprint?.governed_fields?.tracking_mode === 'weight_time' && e.existing_snapshot_fingerprint?.governed_fields?.laterality === 'bilateral' && Array.isArray(e.existing_snapshot_fingerprint?.governed_fields?.aliases) && e.existing_snapshot_fingerprint.governed_fields.aliases.length === 0))
  for (const g of GOVERNED) {
    const e = (m.entries ?? []).find((x) => x.logical_id === g.logicalId)
    const r = w.carrierRecords.find((x) => x.logical_id === g.logicalId)
    c(`M6.${g.line} the content fingerprint recomputes from the CARRIER under the manifest's declared scheme (independent implementation)`,
      !!e && !!r && contentFingerprint(r) === e.content_payload_fingerprint?.sha256, e && r ? `${contentFingerprint(r).slice(0, 12)} vs ${String(e.content_payload_fingerprint?.sha256).slice(0, 12)}` : 'entry or record missing')
    const w14e = (w.w14.entries ?? []).find((x) => x.logical_id === g.logicalId)
    const gf = e?.existing_snapshot_fingerprint?.governed_fields
    c(`M7.${g.line} the governed snapshot fields equal the frozen W14 admission manifest, field for field, and the W14 payload fingerprint is carried unchanged`,
      !!e && !!w14e && !!gf && ['category', 'primary_muscle', 'equipment', 'laterality', 'tracking_mode', 'provenance', 'movement_pattern', 'training_role', 'difficulty', 'availability', 'source_url', 'source_page', 'retrieved_at', 'import_confidence'].every((f) => gf[f] === w14e[f])
      && canonicalJson(gf.anatomy) === canonicalJson(w14e.anatomy) && e.existing_snapshot_fingerprint.payload_fingerprint_sha256 === w14e.payload_fingerprint_sha256 && e.canonical_name === w14e.canonical_name && e.canonical_name === g.name)
  }
  const sv = m.stage_vectors ?? []
  c('M8 the seven stage vectors CHAIN: stage 1 starts at the operator-reported hosted vector, every after[n] equals before[n+1], stages 3/4/5/7 move nothing, 1 moves only events, 2 only content, 6 only runs+items (6 -> 17: the historical six carried forward plus five)',
    sv.length === 7 && sv[0].before === HOSTED_VECTOR && sv.every((s, i) => i === 0 || s.before === sv[i - 1].after)
    && sv[0].after === '8/8/10/3/11/1/2/2/1/6/8' && sv[1].after === '8/8/10/3/11/6/2/2/1/6/8' && sv[2].after === sv[1].after && sv[3].after === sv[2].after && sv[4].after === sv[3].after
    && sv[5].after === '8/8/10/3/11/6/2/2/2/17/8' && sv[6].after === sv[5].after)
  c('M9 the manifest binds the carrier digest as admission_source_sha256 and it equals the sha256 of the carrier bytes on disk',
    m.admission_source_sha256?.value === sha256(Buffer.from(w.carrierText, 'utf8')) && /^[0-9a-f]{64}$/.test(String(m.admission_source_sha256?.value)))
  c('M10 the manifest names the seven stage package paths in order and every one exists',
    Array.isArray(m.stage_packages) && m.stage_packages.length === 7 && m.stage_packages.every((p, i) => p.path === `${PACKAGE_DIR}/${PACKAGE_FILES[i]}` && existsSync(path.join(repositoryRoot, p.path))))
  c('M11 the manifest\'s human decision slots are all unfilled and its boundary statement says no approval was given or inferred',
    (m.entries ?? []).every((e) => Object.values(e.human_decision_slots ?? {}).every((s) => s.filled === false && s.values === null))
    && (m.human_decision_families ?? []).every((f) => f.filled === false) && String(m.boundary_statement?.human_approval).includes('NOT GIVEN'))
  c('M12 the proposed run key is derived on the promoted convention and is NOT the historical plank key; the historical key is recorded as forbidden',
    /^[a-z0-9]+-weight-time-release1-staged-v1$/.test(String(m.delivery_run?.proposed_run_key)) && m.delivery_run?.proposed_run_key !== HISTORICAL_RUN_KEY && m.delivery_run?.must_not_reuse?.forbidden_run_key === HISTORICAL_RUN_KEY)
  const six = historicalSixFromPromotedPackage()
  const em = m.delivery_run?.expected_membership
  c('M14 the manifest\'s historical six equal the six membership lines parsed INDEPENDENTLY from the promoted EXLIB-2U package (3 exercise + 3 alias), and its cumulative membership is exactly those six plus the five new exercise lines: 8 exercise + 3 alias = 11',
    six.length === 6 && JSON.stringify([...(m.hosted_pre_state?.historical_run?.members ?? [])].sort()) === JSON.stringify(six)
    && JSON.stringify([...(em?.carried_forward_members ?? [])].sort()) === JSON.stringify(six)
    && JSON.stringify([...(em?.expected_member_lines ?? [])].sort()) === JSON.stringify(six.concat(GOVERNED.map((g) => `exercise#${g.logicalId}`)).sort())
    && em?.exercise_members === 8 && em?.alias_members === 3 && em?.total_items === 11
    && six.every((l) => !GOVERNED.some((g) => l.includes(g.logicalId)) && !CARRY_IDS.some((id) => l.includes(id))))
  const m029Block = m.migration_029
  const m029Hosted = m029Block?.hosted_application
  const m029Shape = m029Block?.path === MIGRATION_029 && String(m029Block?.new_rule).includes('EXACTLY p_cat_id') && String(m029Block?.hosted_order_dependency).includes('BEFORE the run-key repoint') && String(m029Block?.hosted_order_dependency).includes('NOT a precondition of stages 1-7')
    && m.expected_delivery_effect?.case_existing_plank_user_from_historical_run?.after_migration_029?.summary?.inserted === 5 && m.expected_delivery_effect?.case_existing_plank_user_from_historical_run?.after_migration_029?.summary?.skipped_already_delivered === 3 && m.expected_delivery_effect?.case_existing_plank_user_from_historical_run?.after_migration_029?.summary?.plank_disposition === 'already_valid_idempotent'
  if (mode === 'BLANK') {
    c('M15 the manifest carries the migration-029 block (path, PREPARED - NOT APPLIED, the exact-snapshot prior-run rule, the hosted-order dependency: before stage 8, not a precondition of stages 1-7) and the existing-plank-user expectation AFTER 029 (eligible 8, inserted 5, skipped 3, alias_already 3, already_valid_idempotent)',
      m029Shape && String(m029Block?.status).includes('NOT APPLIED'), `status: ${m029Block?.status}`)
  } else {
    // The operator applied 029 hosted between the pre-decision commit and this
    // one. The manifest may say so; it may NOT say Claude saw it. This pin is
    // the guard on that distinction.
    c('M15 the manifest carries the migration-029 block (path, APPLIED hosted and never "NOT APPLIED", the exact-snapshot prior-run rule, the same hosted-order dependency) with the hosted application labelled OPERATOR-SUPPLIED - Claude neither applied it nor observed hosted state - carrying the exact hosted migration record and read-state probe, and the existing-plank-user expectation AFTER 029 (eligible 8, inserted 5, skipped 3, alias_already 3, already_valid_idempotent)',
      m029Shape && String(m029Block?.status).includes('APPLIED hosted') && !String(m029Block?.status).includes('NOT APPLIED')
      && String(m029Hosted?.provenance).includes('OPERATOR-SUPPLIED') && m029Hosted?.claude_observed_hosted_state === false && m029Hosted?.claude_applied_it === false
      && m029Hosted?.migration_record === MIGRATION_029_HOSTED_RECORD && m029Hosted?.post_apply_read_state_probe === MIGRATION_029_HOSTED_PROBE,
      `status: ${m029Block?.status}`)
  }
  c('M13 the manifest records that a production configuration change IS required and that Claude did not perform it',
    m.delivery_configuration_dependency?.required === true && m.delivery_configuration_dependency?.claude_performed_the_change === false && m.delivery_configuration_dependency?.variable === 'CATALOG_DELIVERY_RUN_KEY')

  // ── F: the three human decision forms ─────────────────────────────
  const aLeaves = (w.formA.entries ?? []).flatMap((e) => Object.values(e.human_fields ?? { missing: 'x' }))
  const bLeafNames = ['decision', 'reviewer', 'reviewer_role_or_credential', 'reviewed_at', 'evidence', 'rationale']
  const bLeaves = (w.formB.entries ?? []).flatMap((e) => bLeafNames.map((k) => e[k]).concat(Object.values(e.needs_human_judgment_confirmations ?? {})))
  const rc = w.formC.requested_inputs
  const cLeaves = [rc.run_key_literal?.value, rc.product_approver_identity?.value, rc.product_approver_identity?.product_approved_at, rc.legal_approver_identity?.value, rc.legal_approver_identity?.legal_approved_at, rc.approval_rationale?.value, rc.run_membership?.value]
  if (mode === 'BLANK') {
    c('F1 EVERY human decision leaf in the three committed forms is null - blank is never approval, and nothing was prefilled',
      aLeaves.length === 30 && aLeaves.every((v: unknown) => v === null) && bLeaves.every((v: unknown) => v === null) && cLeaves.every((v) => v === null),
      `A filled: ${aLeaves.filter((v: unknown) => v !== null).length}, B filled: ${bLeaves.filter((v: unknown) => v !== null).length}, C filled: ${cLeaves.filter((v) => v !== null).length}`)
  } else {
    // Exact equality against the literals at the top of this file, not merely
    // "non-null": a recorded decision is one specific human saying one specific
    // thing at one specific time, and any other value is a different decision.
    const aFilled = (w.formA.entries ?? []).length === 5 && (w.formA.entries ?? []).every((e) => {
      const h = e.human_fields ?? {}
      return h.decision === FAMILY_A_DECISION.decision && h.reviewer === FAMILY_A_DECISION.reviewer
        && h.reviewer_role_or_credential === FAMILY_A_DECISION.role && h.reviewed_at === DECISION_TIMESTAMP && h.rationale === FAMILY_A_DECISION.rationale
    })
    const bFilled = (w.formB.entries ?? []).length === 5 && (w.formB.entries ?? []).every((e) =>
      e.decision === FAMILY_B_DECISION.decision && e.reviewer === FAMILY_B_DECISION.reviewer && e.reviewer_role_or_credential === FAMILY_B_DECISION.role
      && e.reviewed_at === DECISION_TIMESTAMP && e.rationale === FAMILY_B_DECISION.rationale
      && Object.keys(e.needs_human_judgment_confirmations ?? {}).length >= 5
      && Object.values(e.needs_human_judgment_confirmations ?? {}).every((v) => v === true))
    // No "and it is not the historical key" clause here: equality with
    // RESOLVED_RUN_KEY already excludes it, and F5 pins the form's own
    // must_not_be independently.
    const cFilled = rc.run_key_literal?.value === RESOLVED_RUN_KEY
      && rc.product_approver_identity?.value === FAMILY_C_APPROVER && rc.product_approver_identity?.product_approved_at === DECISION_TIMESTAMP
      && rc.legal_approver_identity?.value === FAMILY_C_APPROVER && rc.legal_approver_identity?.legal_approved_at === DECISION_TIMESTAMP
      && String(rc.approval_rationale?.value).includes(RESOLVED_RUN_KEY) && String(rc.approval_rationale?.value).includes('does not itself enable production delivery')
      && rc.run_membership?.value === RESOLVED_RUN_MEMBERSHIP
    c(`F1 EVERY REQUIRED human decision leaf carries the EXACT governing tuple, all at the one governing decision timestamp ${DECISION_TIMESTAMP}: family A ${FAMILY_A_DECISION.decision} by ${FAMILY_A_DECISION.reviewer} (${FAMILY_A_DECISION.role}) on all five, family B ${FAMILY_B_DECISION.decision} by ${FAMILY_B_DECISION.reviewer} (${FAMILY_B_DECISION.role}) on all five with EVERY judgment confirmation true, family C the cumulative run authority; nothing partially filled`,
      aFilled && bFilled && cFilled && aLeaves.length === 30 && cLeaves.every((v) => v !== null),
      `A ${aFilled}, B ${bFilled}, C ${cFilled}; C nulls: ${cLeaves.filter((v) => v === null).length}`)
  }
  c('F2 every form entry carries every REQUIRED leaf as an explicit key (a missing key is not a blank decision, it is a broken form)',
    (w.formA.entries ?? []).length === 5 && (w.formA.entries ?? []).every((e) => ['decision', 'reviewer', 'reviewer_role_or_credential', 'reviewed_at', 'rationale', 'evidence'].every((k) => Object.prototype.hasOwnProperty.call(e.human_fields ?? {}, k)))
    && (w.formB.entries ?? []).length === 5 && (w.formB.entries ?? []).every((e) => bLeafNames.every((k) => Object.prototype.hasOwnProperty.call(e, k)) && Object.keys(e.needs_human_judgment_confirmations ?? {}).length >= 5)
    && ['run_key_literal', 'product_approver_identity', 'legal_approver_identity', 'approval_rationale', 'run_membership'].every((k) => Object.prototype.hasOwnProperty.call(rc, k)))
  c('F3 no committed form carries the synthetic-decision flag or the synthetic marker',
    [w.formA, w.formB, w.formC].every((f) => f.test_only_synthetic_decisions !== true && !JSON.stringify(f).includes(SYNTHETIC_MARKER)))
  c('F4 the content-review form binds the SAME carrier bytes and sha256 the manifest binds',
    w.formB.content_fingerprint?.sha256 === m.admission_source_sha256?.value && w.formB.content_fingerprint?.bytes === Buffer.byteLength(w.carrierText, 'utf8') && w.formB.content_artifact === CARRIER_PATH)
  c('F5 the run-authority form forbids the historical key by name and its proposal differs from it',
    rc.run_key_literal?.must_not_be === HISTORICAL_RUN_KEY && rc.run_key_literal?.preparer_proposal !== HISTORICAL_RUN_KEY && rc.run_key_literal?.preparer_proposal === m.delivery_run?.proposed_run_key)
  c('F6 the run-authority form fixes the membership to the CUMULATIVE design: the historical run\'s six lines (equal to the promoted 2U package) carried forward plus exactly the five governed identities, one offered choice, the three carries excluded',
    JSON.stringify([...(rc.run_membership?.exact_new_logical_ids ?? [])].sort()) === JSON.stringify(GOVERNED.map((g) => g.logicalId).sort())
    && JSON.stringify([...(rc.run_membership?.excluded_deferred_logical_ids ?? [])].sort()) === JSON.stringify([...CARRY_IDS].sort())
    && JSON.stringify(rc.run_membership?.choices) === JSON.stringify(['CUMULATIVE_HISTORICAL_SIX_PLUS_FIVE_WEIGHT_TIME_IDENTITIES'])
    && rc.run_membership?.carried_forward_from_historical_run?.run_key === HISTORICAL_RUN_KEY
    && JSON.stringify([...(rc.run_membership?.carried_forward_from_historical_run?.members ?? [])].sort()) === JSON.stringify(historicalSixFromPromotedPackage()))
  c('F7 the forms address the five identities by the frozen UUIDs and the content form by the +0x100 content ids',
    GOVERNED.every((g) => (w.formA.entries ?? []).some((e) => e.logical_id === g.logicalId && e.inventory_file_line === g.line) && (w.formB.entries ?? []).some((e) => e.logical_id === g.logicalId && e.content_id === g.contentId && e.content_version === 1)))
  c('F8 the content-review form surfaces the reviewer-role dependency (RQ-4) rather than resolving it',
    String(w.formB.reviewer_identity_dependency?.raised_as) === 'RQ-4' && Array.isArray(w.formB.reviewer_identity_dependency?.options_without_recommendation) && String(w.formB.decision_requirements).includes('named human specialist, never AI'))

  // ── T: the seven committed TEMPLATE packages ──────────────────────
  for (let index = 0; index < PACKAGE_FILES.length; index += 1) {
    const file = PACKAGE_FILES[index]
    const stage = index + 1
    const sql = w.packages[file] ?? ''
    const exe = executableSql(sql)
    const label = `T${stage}`
    if (mode === 'BLANK') {
      c(`${label}.a the template carries the deliberate first-statement syntax-error sentinel and a template RAISE in its precondition block`,
        /^SELECT <<UNRESOLVED-TEMPLATE: \d+ human decision leaves are blank; regenerate from COMPLETED forms>>;$/m.test(sql) && sql.includes('TEMPLATE RENDERING with unresolved human decision leaves'))
      c(`${label}.b the template carries at least one unresolved token and NO synthetic marker, and is labelled TEMPLATE - NOT EXECUTABLE`,
        (sql.match(/<<UNRESOLVED:/g) ?? []).length >= 1 && !sql.includes(SYNTHETIC_MARKER) && sql.includes('STATUS: TEMPLATE - NOT EXECUTABLE'))
    } else {
      c(`${label}.a the EXECUTABLE rendering carries NO unresolved-template sentinel, NO template RAISE and NO template status label - nothing deliberately unparseable survives into a package an operator may run`,
        !sql.includes('<<UNRESOLVED-TEMPLATE') && !sql.includes('TEMPLATE RENDERING with unresolved human decision leaves') && !sql.includes('STATUS: TEMPLATE - NOT EXECUTABLE'))
      c(`${label}.b the EXECUTABLE rendering carries NO unresolved token of any kind and NO synthetic marker, and is labelled PREPARED - NOT EXECUTED - ONE-USE - NOT idempotent`,
        !sql.includes('<<UNRESOLVED') && !sql.includes(SYNTHETIC_MARKER) && sql.includes('STATUS: PREPARED - NOT EXECUTED - ONE-USE - NOT idempotent'))
    }
    c(`${label}.c one BEGIN, REPEATABLE READ, one COMMIT, no ROLLBACK statement, and the eleven-table SHARE ROW EXCLUSIVE lock`,
      (exe.match(/^BEGIN;$/gm) ?? []).length === 1 && (exe.match(/^COMMIT;$/gm) ?? []).length === 1 && !/^\s*ROLLBACK/mi.test(exe)
      && exe.includes('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;') && GATED_TABLES.every((t) => new RegExp(`^  ${t.replace('.', '\\.')},?$`, 'm').test(exe)) && exe.includes('IN SHARE ROW EXCLUSIVE MODE;'))
    c(`${label}.d NO delivery, rollback-delivery or revocation call anywhere in the executable text`,
      !/(SELECT|PERFORM|:=)\s+public\.(deliver_catalog_exercises|rollback_catalog_delivery|exlib_revoke_run_delivery)\(/.test(exe))
    const sv = (m.stage_vectors ?? [])[index] ?? {}
    const vectorPins = (exe.match(/IF v_counts <> '([0-9/]+)' THEN/g) ?? []).map((mm) => mm.replace(/^IF v_counts <> '/, '').replace(/' THEN$/, ''))
    c(`${label}.e exactly two vector pins, in order: the pre-state gate pins the manifest's before-vector (${sv.before}) and the post-state gate the after-vector (${sv.after})`,
      JSON.stringify(vectorPins) === JSON.stringify([sv.before, sv.after]), vectorPins.join(' , '))
    // Identity-level scope. Instructional prose may legitimately use the verb
    // "carry" (entry 137 does), so the carry check binds NAMES and IDENTITIES:
    // the canonical-name literals the package renders, and every e21b2c00 UUID
    // outside the single exclusion gate that asserts the carries are ABSENT.
    const exeWithoutExclusionGate = exe.replace(/  IF \(SELECT count\(\*\) FROM public\.exercise_catalog_logical WHERE id IN \([^\n]*\n[^\n]*\n[^\n]*\n  END IF;/g, '')
    const exclusionGates = (exe.match(/FROM public\.exercise_catalog_logical WHERE id IN \(/g) ?? []).length
    const renderedNames = Array.from(new Set((exe.match(/\$nm\d+\$([^$]*)\$nm\d+\$/g) ?? []).map((lit) => lit.replace(/^\$nm\d+\$/, '').replace(/\$nm\d+\$$/, ''))))
    c(`${label}.f identity scope: one carry-exclusion gate naming all three carry ids; outside it no carry id, no carry NAME among the rendered canonical-name literals, and no ungoverned e21b2c00 identity (only the five, their content ids, and the three historical plank-release identities in gates and carry-forward)`,
      exclusionGates === 1 && CARRY_IDS.every((id) => exe.includes(id))
      && !CARRY_IDS.some((id) => exeWithoutExclusionGate.includes(id))
      && !renderedNames.some((n) => CARRY_WORDS.test(n)) && renderedNames.every((n) => GOVERNED.some((g) => g.name === n))
      && (exeWithoutExclusionGate.match(/e21b2c00-0000-4000-a000-[0-9a-f]{12}/g) ?? []).every((id) => GOVERNED.some((g) => g.logicalId === id || g.contentId === id) || HISTORICAL_LOGICAL_IDS.includes(id)),
      `names: ${renderedNames.join(' | ')}`)
    c(`${label}.g the historical plank key appears only in read gates (never as a written run_key), and the package names ShredOS and the operator-only executor`,
      !((exe.match(/INSERT INTO public\.exercise_catalog_import_runs\n[\s\S]*?\);/g) ?? []).some((stmt) => stmt.includes(HISTORICAL_RUN_KEY))) && sql.includes('ttybyljytiwntvorugcv') && sql.includes('never by Claude'))
  }
  const s1 = executableSql(w.packages['01-snapshot-review.sql'] ?? '')
  const s1Updates = s1.match(/^UPDATE public\.exercise_catalog\n[\s\S]*?;$/gm) ?? []
  const s1Shape = s1Updates.length === 5 && GOVERNED.every((g) => s1Updates.some((u) => u.includes(`WHERE logical_id = '${g.logicalId}' AND is_active = true;`)))
    && s1Updates.every((u) => (u.match(/^\s+(SET )?\w+\s+= /gm) ?? []).length === 4)
  if (mode === 'BLANK') {
    c('T1.h stage 1 carries EXACTLY FIVE UPDATE statements, each targeting one governed identity by logical_id + is_active, each with the three human leaves UNRESOLVED and no other SET column',
      s1Shape && s1Updates.every((u) => /reviewed_by\s+= <<UNRESOLVED:A\.\d+\.reviewer>>/.test(u) && /reviewed_at\s+= <<UNRESOLVED:A\.\d+\.reviewed_at>>/.test(u) && /review_rationale = <<UNRESOLVED:A\.\d+\.rationale>>/.test(u)))
  } else {
    c(`T1.h stage 1 carries EXACTLY FIVE UPDATE statements, each targeting one governed identity by logical_id + is_active, each carrying ${FAMILY_A_DECISION.reviewer}'s family-A tuple verbatim at the governing timestamp, and no other SET column`,
      s1Shape && s1Updates.every((u) => new RegExp(`reviewed_by\\s+= \\$rb\\d+\\$${rx(FAMILY_A_DECISION.reviewer)}\\$rb\\d+\\$`).test(u)
        && new RegExp(`reviewed_at\\s+= TIMESTAMPTZ '${rx(DECISION_TIMESTAMP)}'`).test(u)
        && new RegExp(`review_rationale = \\$ra\\d+\\$${rx(FAMILY_A_DECISION.rationale)}\\$ra\\d+\\$`).test(u)))
  }
  const s2 = executableSql(w.packages['02-content-draft-load.sql'] ?? '')
  const s2Calls = s2.match(/public\.load_catalog_content_draft\(\n[\s\S]*?\);$/gm) ?? []
  c('T2.h stage 2 carries EXACTLY FIVE load_catalog_content_draft calls under SET ROLE exlib_catalog_loader with the grantor-scoped REVOKE, each naming a governed logical id and its +0x100 content id in order',
    s2Calls.length === 5 && GOVERNED.every((g, i) => s2Calls[i].includes(`'${g.logicalId}',\n    '${g.contentId}',\n    1,`))
    && s2.includes('SET ROLE exlib_catalog_loader;') && s2.includes('REVOKE exlib_catalog_loader FROM postgres GRANTED BY postgres;') && s2.includes('GRANT exlib_catalog_loader TO postgres WITH SET TRUE, INHERIT FALSE;'))
  c('T2.i every stage-2 payload literal equals the CARRIER record (compact JSON for arrays, dollar-quoted scalars)',
    GOVERNED.every((g, i) => {
      const r = w.carrierRecords.find((x) => x.logical_id === g.logicalId)
      return !!r && s2Calls[i]?.includes(`${JSON.stringify(r.setup_steps)}`) && s2Calls[i]?.includes(`${JSON.stringify(r.execution_steps)}`) && s2Calls[i]?.includes(`${JSON.stringify(r.common_mistakes)}`) && s2Calls[i]?.includes(String(r.breathing_cue)) && s2Calls[i]?.includes(String(r.safety_guidance)) && s2Calls[i]?.includes(String(r.accessibility_alternative)) && s2Calls[i]?.includes(String(r.equipment_setup)) && s2Calls[i]?.includes(`DATE '${r.authored_at}'`)
    }))
  const s3 = executableSql(w.packages['03-content-review.sql'] ?? '')
  const s3Shape = (s3.match(/:= public\.apply_content_review\(/g) ?? []).length === 5
    && s3.includes('SET ROLE exlib_catalog_reviewer;') && s3.includes('REVOKE exlib_catalog_reviewer FROM postgres GRANTED BY postgres;')
  if (mode === 'BLANK') {
    c('T3.h stage 3 carries EXACTLY FIVE apply_content_review calls under SET ROLE exlib_catalog_reviewer with the decision literal approved and the reviewer / timestamp / rationale UNRESOLVED',
      s3Shape && (s3.match(/'approved',\n\s+<<UNRESOLVED:B\.\d+\.reviewer>>,\n\s+<<UNRESOLVED:B\.\d+\.reviewed_at>>,\n\s+<<UNRESOLVED:B\.\d+\.rationale>>\);/g) ?? []).length === 5)
  } else {
    // The whole tuple in ONE regex per call: a reviewer paired with someone
    // else's rationale, or with a different timestamp, is not this review.
    const reviewCalls = (s3.match(new RegExp(`'${FAMILY_B_DECISION.decision}',\\n\\s+\\$rv\\d+\\$${rx(FAMILY_B_DECISION.reviewer)}\\$rv\\d+\\$,\\n\\s+TIMESTAMPTZ '${rx(DECISION_TIMESTAMP)}',\\n\\s+\\$rr\\d+\\$${rx(FAMILY_B_DECISION.rationale)}\\$rr\\d+\\$\\);`, 'g')) ?? []).length
    c(`T3.h stage 3 carries EXACTLY FIVE apply_content_review calls under SET ROLE exlib_catalog_reviewer, each passing the decision literal ${FAMILY_B_DECISION.decision} with ${FAMILY_B_DECISION.reviewer}'s name, the governing timestamp and ${FAMILY_B_DECISION.reviewer}'s rationale verbatim as ONE tuple`,
      s3Shape && reviewCalls === 5, `complete review tuples: ${reviewCalls}`)
  }
  const s4 = executableSql(w.packages['04-content-admission.sql'] ?? '')
  const s4Shape = (s4.match(/:= public\.admit_catalog_content\(/g) ?? []).length === 5 && (s4.match(new RegExp(`'${m.admission_source_sha256?.value}'\\);`, 'g')) ?? []).length === 5
    && s4.includes('SET ROLE exlib_catalog_admission;')
  if (mode === 'BLANK') {
    c('T4.h stage 4 carries EXACTLY FIVE admit_catalog_content calls under SET ROLE exlib_catalog_admission, each passing the carrier digest the manifest binds, with the admission fingerprint pin UNRESOLVED (it derives from the family B tuple)',
      s4Shape && (s4.match(/'admitted_fingerprint', <<UNRESOLVED:B\.\d+\.admission_fingerprint\(derived\)>>/g) ?? []).length === 5)
  } else {
    const rendered = (s4.match(/'admitted_fingerprint', '[0-9a-f]{64}'/g) ?? []).map((l) => l.slice(-65, -1))
    c('T4.h stage 4 carries EXACTLY FIVE admit_catalog_content calls under SET ROLE exlib_catalog_admission, each passing the carrier digest the manifest binds, and pins EXACTLY the five admission fingerprints derived from Nick Tkacz\'s review tuple, in manifest order (the same five PostgreSQL computes for itself in the disposable proof)',
      s4Shape && JSON.stringify(rendered) === JSON.stringify(ADMISSION_FINGERPRINTS), `rendered: ${rendered.map((f) => f.slice(0, 8)).join(',')}`)
  }
  const s5 = executableSql(w.packages['05-content-publication.sql'] ?? '')
  c('T5.h stage 5 carries EXACTLY FIVE publish_catalog_content calls under SET ROLE exlib_catalog_admin, each asserting retired NULL and projected_relationships 0',
    (s5.match(/:= public\.publish_catalog_content\(/g) ?? []).length === 5 && (s5.match(/'retired', NULL,\n\s+'content_version', 1,\n\s+'projected_relationships', 0\)/g) ?? []).length === 5 && s5.includes('SET ROLE exlib_catalog_admin;'))
  const s6 = executableSql(w.packages['06-run-staging.sql'] ?? '')
  const inList = s6.match(/INSERT INTO public\.exercise_catalog_run_items[\s\S]*?ON c\.logical_id IN \(([\s\S]*?)\)\n\s+AND c\.is_active = true/)
  const listed = inList ? (inList[1].match(/e21b2c00-0000-4000-a000-[0-9a-f]{12}/g) ?? []) : []
  const copyStatements = s6.match(/^INSERT INTO public\.exercise_catalog_run_items \(run_id, (catalog_id|catalog_alias_id)\)\nSELECT r\.id, ri\.catalog(_alias)?_id\n[\s\S]*?;$/gm) ?? []
  c(`T6.h stage 6 carries ONE run INSERT (dry_run false, and ${mode === 'BLANK' ? 'run_key plus all five approval-evidence leaves UNRESOLVED' : `run_key '${RESOLVED_RUN_KEY}' with ${FAMILY_C_APPROVER}'s product and legal approvals, both at the governing timestamp, and the approval rationale verbatim`}), TWO carry-forward INSERTs that COPY the historical run\'s own exercise and alias membership rows (never retyped ids), and ONE new-member INSERT whose IN list is EXACTLY the five governed identities`,
    (s6.match(/^INSERT INTO public\.exercise_catalog_import_runs$/gm) ?? []).length === 1 && (s6.match(/^INSERT INTO public\.exercise_catalog_run_items \(run_id, catalog_id\)$/gm) ?? []).length === 2 && (s6.match(/^INSERT INTO public\.exercise_catalog_run_items \(run_id, catalog_alias_id\)$/gm) ?? []).length === 1
    && copyStatements.length === 2 && copyStatements.every((st) => st.includes(`JOIN public.exercise_catalog_import_runs h ON h.run_key = '${HISTORICAL_RUN_KEY}'`))
    && (mode === 'BLANK'
      ? s6.includes('(<<UNRESOLVED:C.run_key_literal>>, false,') && (s6.match(/<<UNRESOLVED:C\.(product_approver_identity|product_approved_at|legal_approver_identity|legal_approved_at|approval_rationale)>>/g) ?? []).length >= 5
      : s6.includes(`('${RESOLVED_RUN_KEY}', false,`)
        && s6.includes(`$pab$${FAMILY_C_APPROVER}$pab$, TIMESTAMPTZ '${DECISION_TIMESTAMP}'`)
        && s6.includes(`$lab$${FAMILY_C_APPROVER}$lab$, TIMESTAMPTZ '${DECISION_TIMESTAMP}'`)
        && s6.includes(`$apr$I approve \`${RESOLVED_RUN_KEY}\``) && s6.includes('this approval does not itself enable production delivery.$apr$'))
    && JSON.stringify([...listed].sort()) === JSON.stringify(GOVERNED.map((g) => g.logicalId).sort()) && listed.length === 5, `listed: ${listed.join(',')}; copies: ${copyStatements.length}`)
  const sixLines = historicalSixFromPromotedPackage()
  c('T6.i stage 6 gates the historical source run on EXACTLY the promoted six membership lines (parsed independently from the 2U package), expects a membership of exactly those six plus the five new exercise lines, seal-shape 8 + 3, evaluates the delivery predicate (never calls the function), and demands published, admitted, fingerprint-fresh content for all five',
    sixLines.every((l) => (s6.match(new RegExp(`'${l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`, 'g')) ?? []).length >= 2)
    && GOVERNED.every((g) => s6.includes(`'exercise#${g.logicalId}'`)) && s6.includes("<> 8 OR COALESCE(v_alias_members, 0) <> 3")
    && s6.includes('AND r.approved_for_delivery = true\n         AND r.dry_run = false\n         AND r.sealed_at IS NOT NULL\n         AND r.revoked_at IS NULL) <> 0 THEN') && (s6.match(/the run must never point at unpublished content/g) ?? []).length === 5
    && s6.includes('does not carry exactly the promoted six membership lines'))
  const s7 = executableSql(w.packages['07-run-seal.sql'] ?? '')
  const sealCalls = mode === 'BLANK'
    ? (s7.match(/public\.exlib_approve_and_seal_run\(<<UNRESOLVED:C\.run_key_literal>>\)/g) ?? []).length
    : (s7.match(new RegExp(rx(`public.exlib_approve_and_seal_run('${RESOLVED_RUN_KEY}')`), 'g')) ?? []).length
  c(`T7.h stage 7 carries EXACTLY ONE exlib_approve_and_seal_run call on ${mode === 'BLANK' ? 'the UNRESOLVED run key' : `the authorized run key '${RESOLVED_RUN_KEY}'`}, asserts exercise_members 8 / alias_members 3, gates the historical six and the eleven cumulative lines, and states the seal is one-use and irreversible`,
    sealCalls === 1 && s7.includes("'exercise_members', 8,\n       'alias_members', 3)")
    && sixLines.every((l) => s7.includes(`'${l}'`)) && GOVERNED.every((g) => s7.includes(`'exercise#${g.logicalId}'`)) && (w.packages['07-run-seal.sql'] ?? '').includes('IRREVERSIBILITY, PLAINLY'), `seal calls: ${sealCalls}`)
}

// ── boundaries (repository state; not part of the corruptible World) ──
function verifyBoundaries(world: World): void {
  const m028 = readFileSync(path.join(repositoryRoot, MIGRATION_028))
  check('B1 migration 028 is byte-identical at its pinned size and sha256 - this work modifies no migration', m028.length === MIGRATION_028_BYTES && sha256(m028) === MIGRATION_028_SHA256)
  const migrations = readdirSync(path.join(repositoryRoot, 'supabase/migrations')).filter((f) => f.endsWith('.sql'))
  // Migration 029 (F-E8 remediation) is AUTHORIZED and present: exactly one, last, bound by bytes in the manifest.
  const m029Binding = (world.manifest.bound_artifacts ?? []).find((b) => b.path === MIGRATION_029)
  const m029Disk = readFileSync(path.join(repositoryRoot, MIGRATION_029))
  check('B2 there are exactly 29 numbered migrations: 001-028 plus EXACTLY ONE authorized 029 (Plank cross-run idempotency), last in order, bound by bytes in the lifecycle manifest and byte-identical on disk; no 030',
    migrations.length === 29 && migrations.filter((f) => f.startsWith('029')).length === 1 && migrations[28] === path.basename(MIGRATION_029) && !migrations.some((f) => f.startsWith('030'))
    && !!m029Binding && m029Binding.bytes === m029Disk.length && m029Binding.sha256 === sha256(m029Disk), `${migrations.length} migrations; 029 bound: ${!!m029Binding}`)
  check('B2b migration 029 is the ONLY change under supabase/: 001-028 are byte-identical to the production base',
    git('diff', '--name-only', PRODUCTION_BASE_COMMIT, '--', 'supabase').split('\n').concat(git('ls-files', '--others', '--exclude-standard', '--', 'supabase').split('\n')).filter(Boolean).sort().filter((p, i, a) => a.indexOf(p) === i).join(',') === MIGRATION_029)
  check('B3 HEAD descends from the published production main 54a9d128 with ZERO merge commits - plain forward commits only',
    gitSucceeds('merge-base', '--is-ancestor', PRODUCTION_BASE_COMMIT, 'HEAD') && git('rev-list', '--count', '--merges', `${PRODUCTION_BASE_COMMIT}..HEAD`) === '0')
  check('B4 the production base commit still resolves to its pinned tree', git('rev-parse', `${PRODUCTION_BASE_COMMIT}^{tree}`) === PRODUCTION_BASE_TREE)
  check('B5 every commit above the base has exactly one parent (no amend, rebase, squash or merge can be hidden in the chain)',
    git('rev-list', `${PRODUCTION_BASE_COMMIT}..HEAD`).split('\n').filter(Boolean).every((sha) => git('rev-list', '--parents', '-n', '1', sha).split(' ').length === 2))
  const committed = git('diff', '--name-only', PRODUCTION_BASE_COMMIT, 'HEAD').split('\n').filter(Boolean)
  // Read RAW, not through git() which trims: a leading space is the porcelain
  // status column of a modified tracked file (" M path"), and trimming it
  // shifts the path slice by one character.
  const porcelainRaw = execFileSync('git', ['-C', repositoryRoot, 'status', '--porcelain'], { encoding: 'utf8' })
  const working = porcelainRaw.split('\n').filter((l) => l.length > 3).flatMap((l) => l.slice(3).split(' -> ')).map((p) => p.trim().replace(/^"|"$/g, ''))
  const surface = Array.from(new Set(committed.concat(working))).sort()
  const retargeted = surface.filter((p) => RETARGET_SURFACE.includes(p))
  const outside = surface.filter((p) => !ALLOWED_CHANGED_PATHS.includes(p) && !RETARGET_SURFACE.includes(p) && p !== `${PACKAGE_DIR}/`)
  check('B6 the ENTIRE change surface - committed and uncommitted - is five-entry endgame preparation plus the labelled migration-029 inventory retarget of the 65 census-derived historical suites, and nothing else', outside.length === 0, `outside: ${outside.join(', ')}`)
  const unlabelled = retargeted.filter((p) => !(git('diff', PRODUCTION_BASE_COMMIT, '--', p).includes(RETARGET_LABEL)))
  check('B6b RETARGET (W14-E migration 029): every retargeted historical suite differs from the production base ONLY with the W14-E retarget label present in its diff, the retarget surface is exactly the 65 census-derived non-frozen suites (no more, no fewer), and the two FROZEN verifiers are NOT among them',
    retargeted.length === 65 && RETARGET_SURFACE.length === 65 && unlabelled.length === 0
    && !RETARGET_SURFACE.includes('scripts/verify-weight-time-w14.ts') && !RETARGET_SURFACE.includes('scripts/verify-weight-time-w14-closeout.ts')
    && !surface.includes('scripts/verify-weight-time-w14.ts') && !surface.includes('scripts/verify-weight-time-w14-closeout.ts'),
    `retargeted ${retargeted.length}; unlabelled: ${unlabelled.join(', ')}`)
  check(`B14 the PRE-DECISION commit ${PRE_DECISION_COMMIT.slice(0, 8)} still resolves to its pinned tree and is an ancestor of HEAD: the reviewed pre-decision surface (blank forms, seven non-executable templates, "Nothing here is approved" review page) is preserved as an immutable git object rather than rewritten in place, and section A0 above evaluates the blank-form lifecycle against it`,
    git('rev-parse', `${PRE_DECISION_COMMIT}^{tree}`) === PRE_DECISION_TREE && gitSucceeds('merge-base', '--is-ancestor', PRE_DECISION_COMMIT, 'HEAD'),
    git('rev-parse', `${PRE_DECISION_COMMIT}^{tree}`))
  check('B7 no src/ application code is touched', surface.every((p) => !p.startsWith('src/')))
  check('B8 under supabase/ only the authorized migration 029 is touched (no other migration, no 026/027/028 edit)', surface.filter((p) => p.startsWith('supabase/')).every((p) => p === MIGRATION_029))
  check('B9 the deferred F2/F2a/F2b/F3/F4 maintenance sites are NOT modified on account of this work', DEFERRED_MAINTENANCE_FILES.every((p) => !surface.includes(p)))
  for (const f of FROZEN) {
    const onDisk = readFileSync(path.join(repositoryRoot, f.path))
    const committedBlob = execFileSync('git', ['-C', repositoryRoot, 'cat-file', 'blob', `HEAD:${f.path}`], { maxBuffer: 64 * 1024 * 1024 })
    check(`B10 frozen artifact untouched: ${f.path}`, onDisk.length === f.bytes && sha256(onDisk) === f.sha256 && sha256(committedBlob) === f.sha256, `${onDisk.length} B ${sha256(onDisk).slice(0, 12)}`)
  }
  const bindings: { path: string; bytes: number; sha256: string }[] = world.manifest.bound_artifacts ?? []
  const drifted = bindings.filter((b) => { const d = readFileSync(path.join(repositoryRoot, b.path)); return d.length !== b.bytes || sha256(d) !== b.sha256 })
  check(`B11 all ${bindings.length} artifacts the lifecycle manifest binds still match their recorded bytes and sha256 on disk (migrations 026, 028 and 029 included)`, bindings.length >= 17 && drifted.length === 0 && bindings.some((b) => b.path === MIGRATION_029) && bindings.some((b) => b.path === 'supabase/migrations/026_exlib_plank_seed_reconciliation.sql'), drifted.map((b) => b.path).join(', '))
  // The swept literals are assembled from fragments so this file never carries
  // them: verify-exlib1c0b.ts D2 sweeps scripts/verify-*.ts for them and requires
  // every hit to be named in a byte-frozen audit this file cannot join.
  const sweptLiterals = new RegExp(`${['weight', '_reps'].join('')}|${['resistance', '_band'].join('')}`)
  check('B12 the exlib1c0b vocabulary-pin sweep would not classify this verifier or the two generators as suites carrying vocabulary pins (neither swept literal appears in these files)',
    ![STATIC_VERIFIER_PATH, MANIFEST_GENERATOR_PATH, PACKAGE_GENERATOR_PATH, MIGRATION_029_VERIFIER_PATH].some((p) => sweptLiterals.test(read(p))))
  check('B13 the enablement-variable census (verify-exlib2t B1) is undisturbed: no five-entry document spells the enablement variable literally (the fragment convention of the EXLIB-3A records is followed)',
    ![...readdirSync(path.join(repositoryRoot, 'docs')).filter((f) => f.includes('five-entry') && statSync(path.join(repositoryRoot, 'docs', f)).isFile()).map((f) => `docs/${f}`),
      ...readdirSync(path.join(repositoryRoot, 'scripts')).filter((f) => f.includes('five-entry')).map((f) => `scripts/${f}`),
      ...PACKAGE_FILES.map((f) => `${PACKAGE_DIR}/${f}`)].some((p) => read(p).includes(['CATALOG', '_DELIVERY', '_ENABLED'].join(''))))
}

// ── governance signatures (committed bytes the packages depend on) ────
function verifyGovernance(): void {
  const m023 = read('supabase/migrations/023_exlib_catalog_and_delivery_contract.sql')
  const m027 = read('supabase/migrations/027_exlib_catalog_content_schema.sql')
  const m028 = read(MIGRATION_028)
  const sig = (name: string) => { const mm = m027.match(new RegExp(`CREATE OR REPLACE FUNCTION ${name}\\(([\\s\\S]*?)\\) RETURNS`)); return mm ? mm[1].replace(/\s+/g, ' ').trim() : '' }
  check('S1 load_catalog_content_draft has exactly the thirteen parameters the generator renders, in declaration order',
    sig('load_catalog_content_draft') === 'p_logical_id UUID, p_content_id UUID, p_content_version INTEGER, p_authored_by TEXT, p_authored_at DATE, p_setup_steps JSONB, p_execution_steps JSONB, p_breathing_cue TEXT, p_common_mistakes JSONB, p_safety_guidance TEXT, p_equipment_setup TEXT, p_accessibility_alternative TEXT, p_expected_relationships JSONB', sig('load_catalog_content_draft'))
  check('S2 apply_content_review(p_logical_id, p_content_id, p_decision, p_reviewer, p_reviewed_at, p_rationale) - the six-argument review surface, no role column',
    sig('apply_content_review') === 'p_logical_id UUID, p_content_id UUID, p_decision TEXT, p_reviewer TEXT, p_reviewed_at TIMESTAMPTZ, p_rationale TEXT')
  check('S3 admit_catalog_content(p_logical_id, p_content_id, p_source_artifact_sha256) - the caller supplies the carrier digest only; the fingerprint is computed by the database',
    sig('admit_catalog_content') === 'p_logical_id UUID, p_content_id UUID, p_source_artifact_sha256 TEXT' && m027.includes('v_fingerprint := public.exlib_content_admission_fingerprint(p_content_id);'))
  check('S4 publish_catalog_content(p_logical_id, p_content_id) swaps the projection under a transaction-local sentinel and re-checks fingerprint freshness',
    sig('publish_catalog_content') === 'p_logical_id UUID, p_content_id UUID' && m027.includes("set_config('exlib.relationship_projection_identity'") && m027.includes('IF v_target.admitted_fingerprint IS DISTINCT FROM v_computed THEN'))
  check('S5 the admission manifest v2 binds exactly the surfaces the generator recomputes: identity, snapshot, anatomy, alias, content, review (with epoch), relationship',
    ["'EXLIB-ADMISSION-MANIFEST v2'", "'identity '", "'snapshot '", "'anatomy '", "'alias '", "'content '", "'review '", "'relationship '", 'extract(epoch FROM v_c.reviewed_at)::numeric::text', "(v_s.retrieved_at - DATE '1970-01-01')::text", "(v_c.authored_at - DATE '1970-01-01')::text", "COLLATE \"C\""].every((s) => m027.includes(s))
    && m027.includes("SELECT COALESCE('S' || encode(convert_to(p_value, 'UTF8'), 'hex'), 'N');"))
  check('S6 the content freeze trigger forces review, admission and publication to TRAVEL ALONE and forbids admitting a pending version (the load-bearing separations the packages keep)',
    m027.includes('a review transition carries evidence only; payload and admission changes are forbidden in the same statement') && m027.includes('the admission transition must travel alone') && m027.includes('a publication transition must travel alone') && m027.includes('CONSTRAINT exercise_catalog_content_admission_order_chk'))
  check('S7 there is NO controlled function for snapshot review or run creation: no function writes exercise_catalog.review_status and only exlib_approve_and_seal_run UPDATEs a run row',
    !/CREATE OR REPLACE FUNCTION [a-z_]+\([^)]*\)[\s\S]{0,400}UPDATE public\.exercise_catalog\s+SET review_status/.test(m023 + m027) && m023.includes('CREATE OR REPLACE FUNCTION exlib_approve_and_seal_run(p_run_key TEXT)') && !/INSERT INTO public\.exercise_catalog_import_runs/.test(m023 + m027 + m028))
  check('S8 review events are written only by the snapshot freeze trigger (depth >= 2 guard) and the snapshot trigger demands a complete FRESH audit tuple on every transition',
    m023.includes('IF pg_trigger_depth() < 2 THEN') && m023.includes('a review transition must carry FRESH evidence'))
  check('S9 run_key is UNIQUE with the 8..200 btrim CHECK, membership rows are immutable, and a sealed run\'s membership is PERMANENT',
    /run_key\s+TEXT NOT NULL UNIQUE\s+CHECK \(char_length\(btrim\(run_key\)\) BETWEEN 8 AND 200\)/.test(m023) && m023.includes("a sealed run''s membership is PERMANENT"))
  check('S10 the seal validates every exercise member (approved, active, non-blank reviewer and rationale) and refuses dry runs and empty membership',
    m023.includes('cannot seal — % exercise member(s) are not approved, active, and fully review-audited') && m023.includes('dry runs cannot be sealed') && m023.includes('an empty membership cannot be sealed'))
  check('S11 deliver_catalog_exercises (migration 028 definition) is per-user via auth.uid(), refuses unauthenticated callers, requires the sealed/approved/non-dry/unrevoked predicate, and maps weight_time to strength explicitly',
    /v_uid\s+UUID := auth\.uid\(\);/.test(m028) && m028.includes("RAISE EXCEPTION 'deliver_catalog_exercises: not authenticated';") && /WHERE run_key = p_run_key\s+AND approved_for_delivery = true\s+AND dry_run = false\s+AND sealed_at IS NOT NULL\s+AND revoked_at IS NULL;/.test(m028) && (executableSql(m028).match(/WHEN 'weight_time' THEN 'strength'/g) ?? []).length === 2)
  const mod = read('src/lib/supabase/deliver-catalog.ts')
  check('S12 the application selects the run from ONE scalar env var and passes it straight to the RPC - so exactly one run is deliverable per deployment and a configuration change is REQUIRED to deliver the five',
    mod.includes('const key = process.env.CATALOG_DELIVERY_RUN_KEY') && mod.includes('supabase.rpc("deliver_catalog_exercises", { p_run_key: runKey })') && !mod.includes('CATALOG_DELIVERY_RUN_KEYS'))
  const m029 = read(MIGRATION_029)
  check('S15 migration 029 replaces ONLY exlib_plank_link_valid (existing signature, internal-only posture re-asserted) and does not redefine deliver_catalog_exercises; migration 028 still calls the shared helper from both paths, so both gain the new provenance rule through the helper',
    (m029.split('\n').map((l) => { const at = l.indexOf('--'); return at === -1 ? l : l.slice(0, at) }).join('\n').match(/CREATE OR REPLACE FUNCTION/g) ?? []).length === 1 && m029.includes('CREATE OR REPLACE FUNCTION exlib_plank_link_valid(') && !m029.includes('CREATE OR REPLACE FUNCTION deliver_catalog_exercises')
    && m029.includes('REVOKE ALL ON FUNCTION exlib_plank_link_valid(UUID, public.exercises, UUID, UUID, TEXT, UUID)\n  FROM PUBLIC, anon, authenticated;') && m029.includes('AND pri.catalog_id = p_cat_id') && m029.includes('AND p_link.import_run_id IS NOT NULL')
    && (m028.match(/exlib_plank_link_valid\(v_uid, v_linked, v_cat\.id, v_cat\.logical_id,\n\s+v_cat\.canonical_name, v_run\.id\)/g) ?? []).length === 2)
  const m2k = read('docs/exlib2k-plank-catalog-load-package.sql')
  check('S13 the +0x100 content-id convention is the plank precedent\'s: the spent 2K package loaded content …0101 for identity …0001',
    /load_catalog_content_draft\(\n\s+'e21b2c00-0000-4000-a000-000000000001',\n\s+'e21b2c00-0000-4000-a000-000000000101',\n\s+1,/.test(m2k))
  const exercises003 = read('supabase/migrations/003_phase1c_workout_logging.sql')
  const m018 = read('supabase/migrations/018_phase5a6b_exercise_muscles.sql')
  const m025 = read('supabase/migrations/025_exlib_equipment_vocabulary_support.sql')
  const tenantEquipment = m025.match(/ALTER TABLE public\.exercises\n  ADD CONSTRAINT exercises_equipment_check CHECK \(equipment IN \(([\s\S]*?)\)\);/)
  check('S14 the TENANT exercises CHECKs admit every value delivery will copy from the five snapshots: abs / forearms / quads (018), weight_plate / weighted_vest (025), isolation / compound (003), weight_time (028)',
    m018.includes("'abs', 'obliques'") && m018.includes("'forearms'") && m018.includes("'quads', 'hamstrings'") && !!tenantEquipment && tenantEquipment[1].includes("'weight_plate'") && tenantEquipment[1].includes("'weighted_vest'")
    && exercises003.includes("category          TEXT CHECK (category IN ('compound','isolation','cardio','mobility','other'))") && m028.includes("ADD CONSTRAINT exercises_tracking_mode_check"))
}

// ── documents, probe, verifiers, generators ───────────────────────────
function verifyDocuments(world: World): void {
  const review = read(HUMAN_REVIEW_PATH)
  check('D1 the human review page names all five exercises with their frozen ids and content ids, every content field, the three decision families, and the reviewer-role question RQ-4',
    GOVERNED.every((g) => review.includes(`### ${g.line}. ${g.name}`) && review.includes(g.logicalId) && review.includes(g.contentId))
    && ['Setup:', 'Execution:', 'Breathing cue:', 'Common mistakes:', 'Safety:', 'Equipment setup:', 'Accessibility alternative:', 'Expected relationships:'].every((h) => (review.match(new RegExp(h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) ?? []).length === 5)
    && review.includes('RQ-4') && review.includes('Family A') && review.includes('Family B') && review.includes('Family C') && review.includes('Blank is never approval'))
  check(`D2 the CURRENT human review page tells the truth about the decisions: it states DECISIONS RECORDED, names ${FAMILY_B_DECISION.reviewer} as the content reviewer, carries the governing timestamp and the authorized run key, still states that blank is never approval, and no longer claims nothing is approved; no synthetic marker`,
    !review.includes(SYNTHETIC_MARKER) && review.includes('STATUS: DECISIONS RECORDED') && !review.includes('Nothing here is approved')
    && review.includes(FAMILY_B_DECISION.reviewer) && review.includes(DECISION_TIMESTAMP) && review.includes(RESOLVED_RUN_KEY) && review.includes('Blank is never approval'))
  const preReview = readAtCommit(PRE_DECISION_COMMIT, HUMAN_REVIEW_PATH)
  check(`D2b the PRE-DECISION review page the humans actually reviewed is preserved unrewritten at ${PRE_DECISION_COMMIT.slice(0, 8)}: it still says "Nothing here is approved", still carries no decision timestamp and no reviewer name, and its bytes differ from the current page (the historical review prose was not edited - it was superseded)`,
    preReview.includes('STATUS: FOR HUMAN REVIEW. Nothing here is approved') && !preReview.includes(DECISION_TIMESTAMP) && !preReview.includes(FAMILY_B_DECISION.reviewer)
    && !preReview.includes('DECISIONS RECORDED') && sha256(preReview) !== sha256(review))
  const dep = read(DEPENDENCY_PATH)
  check('D3 the dependency document proves the configuration change is required from committed code, states repointing DE-SELECTS the plank release, says delivered counts are UNKNOWN, and records no Vercel contact',
    dep.includes('a configuration change IS required') && dep.includes('CUMULATIVE') && dep.includes('F-E8') && dep.includes('029') && dep.includes('Delivered counts are UNKNOWN') && dep.includes('no Vercel contact') && dep.includes('`CATALOG` + `_DELIVERY` + `_ENABLED`'))
  const runbook = existsSync(path.join(repositoryRoot, RUNBOOK_PATH)) ? read(RUNBOOK_PATH) : ''
  check('D4 the operator runbook exists and states the seven packages in order, the spent-check probe before each, the READ STATE FIRST rule, the Vercel repoint as an operator-only act, and that Claude performs none of it',
    runbook.length > 0 && PACKAGE_FILES.every((f) => runbook.includes(f)) && runbook.includes(PROBE_PATH) && runbook.includes('READ STATE FIRST') && runbook.includes('Claude performs none') && runbook.includes(HISTORICAL_RUN_KEY) && runbook.includes('`CATALOG` + `_DELIVERY` + `_ENABLED`') && runbook.includes('F-E8') && runbook.includes('8/8/10/3/11/6/2/2/2/17/8') && runbook.includes('029_exlib_plank_cross_run_idempotency.sql') && runbook.includes('migration_029_plank_cross_run_idempotency'))
  check('D5 the runbook indexes the seven package files by their exact position and forbids running any package twice',
    runbook.includes('01-snapshot-review.sql') && runbook.indexOf('01-snapshot-review.sql') < runbook.indexOf('07-run-seal.sql') && /never run (a|any|the same) package\s+(a second time|twice)/i.test(runbook))
  const probe = read(PROBE_PATH)
  check('D6 the read-state probe is READ ONLY by declaration, ends in ROLLBACK, classifies all seven stages plus the migration-029 spent-check, and contains no write statement',
    probe.includes('SET TRANSACTION READ ONLY;') && probe.trim().endsWith('ROLLBACK;') && probe.includes("'migration_029_plank_cross_run_idempotency'") && probe.includes('pri.catalog_id = p_cat_id') && [1, 2, 3, 4, 5, 6, 7].every((n) => probe.includes(`SELECT ${n}, '`) || probe.includes(`SELECT ${n} AS stage`)) && !/^\s*(UPDATE|INSERT|DELETE|GRANT|REVOKE|ALTER|DROP|CREATE|SET ROLE)\b/m.test(probe))
  const matrix = read(MATRIX_PATH)
  check('D7 the discovery matrix records the two places where no controlled function exists and the field-name disagreement (breathing_cue, not cues)',
    matrix.includes('Two places where "use the controlled function" has no function to use') && matrix.includes('There is **no `cues` field**'))
  check('D13 the focused migration-029 verifiers exist (static and disposable live), the live one is executable, and neither names a hosted endpoint',
    existsSync(path.join(repositoryRoot, MIGRATION_029_VERIFIER_PATH)) && existsSync(path.join(repositoryRoot, MIGRATION_029_LIVE_VERIFIER_PATH)) && (statSync(path.join(repositoryRoot, MIGRATION_029_LIVE_VERIFIER_PATH)).mode & 0o111) !== 0
    && ![MIGRATION_029_VERIFIER_PATH, MIGRATION_029_LIVE_VERIFIER_PATH].some((p) => /supabase\.(co|com)|vercel\.(app|com)|npx supabase|supabase (db|projects|link|login)/i.test(read(p))))
  const live = read(LIVE_VERIFIER_PATH)
  check('D8 the live verifier exists, is executable, replays the nine spent packages pinned by bytes, renders the TEST-ONLY packages through the real generator, and contains no hosted reference',
    (statSync(path.join(repositoryRoot, LIVE_VERIFIER_PATH)).mode & 0o111) !== 0 && ['exlib2k', 'exlib2o', 'exlib2p', 'exlib2q', 'exlib2r', 'exlib2y', 'exlib2u', 'exlib2z', 'weight-time-w14-catalog-admission'].every((s) => live.includes(s))
    && live.includes('FIVE_ENTRY_FORMS_DIR') && live.includes('FIVE_ENTRY_VARIANT') && live.includes('029_') && !/supabase\.(co|com)|vercel\.(app|com)|npx supabase|supabase (db|projects|link|login)/i.test(live))
  check('D9 the manifest generator regenerates the committed manifest byte-for-byte (--check)', tsx([MANIFEST_GENERATOR_PATH, '--check']).ok)
  const pkgCheck = tsx([PACKAGE_GENERATOR_PATH, '--check'])
  check('D10 the package generator regenerates all NINE committed artifacts byte-for-byte from the COMPLETED forms - the seven executable packages, the human review page and the human decision record (--check)', pkgCheck.ok, pkgCheck.out.slice(-200))
  // The blank-form regression, EXECUTED rather than asserted: materialise the
  // pre-decision forms and renderings from the immutable commit into a scratch
  // tree and require the SAME generator, unchanged, to reproduce all eight of
  // them byte-for-byte. If a later edit makes the review page claim decisions
  // unconditionally, or resolves a template leaf that has no decision behind
  // it, this fails here.
  const blankRoot = path.join(tmpdir(), 'w14e-static-blank-form-regression')
  rmSync(blankRoot, { recursive: true, force: true })
  const blankForms = path.join(blankRoot, 'forms')
  const blankOut = path.join(blankRoot, 'out')
  mkdirSync(blankForms, { recursive: true })
  mkdirSync(blankOut, { recursive: true })
  for (const formPath of [FORM_A_PATH, FORM_B_PATH, FORM_C_PATH]) writeFileSync(path.join(blankForms, path.basename(formPath)), readAtCommit(PRE_DECISION_COMMIT, formPath))
  for (const f of PACKAGE_FILES) writeFileSync(path.join(blankOut, f), readAtCommit(PRE_DECISION_COMMIT, `${PACKAGE_DIR}/${f}`))
  writeFileSync(path.join(blankOut, path.basename(HUMAN_REVIEW_PATH)), preReview)
  const blankCheck = tsx([PACKAGE_GENERATOR_PATH, '--check'], { FIVE_ENTRY_FORMS_DIR: blankForms, FIVE_ENTRY_OUT_DIR: blankOut })
  check('D10b BLANK-FORM REGRESSION: handed the pre-decision BLANK forms, this same generator still renders the seven NON-EXECUTABLE templates and the pre-review "Nothing here is approved" page byte-for-byte, and renders NO decision record (--check, eight renderings) - blank mode was retargeted, never weakened',
    blankCheck.ok && blankCheck.out.includes('8 renderings') && !existsSync(path.join(blankOut, path.basename(DECISION_RECORD_PATH))), blankCheck.out.slice(-300))
  // PARTIAL is the third state the lifecycle refuses: one blanked leaf inside
  // an otherwise complete family is neither a blank decision nor a recorded one.
  const partialRoot = path.join(tmpdir(), 'w14e-static-partial-refusal')
  rmSync(partialRoot, { recursive: true, force: true })
  mkdirSync(partialRoot, { recursive: true })
  writeFileSync(path.join(partialRoot, path.basename(FORM_A_PATH)), read(FORM_A_PATH))
  writeFileSync(path.join(partialRoot, path.basename(FORM_C_PATH)), read(FORM_C_PATH))
  const partialB = JSON.parse(read(FORM_B_PATH)) as { entries: Record<string, unknown>[] }
  partialB.entries[2].reviewer = null
  writeFileSync(path.join(partialRoot, path.basename(FORM_B_PATH)), `${JSON.stringify(partialB, null, 2)}\n`)
  const partialRefusal = tsx([PACKAGE_GENERATOR_PATH, '--check'], { FIVE_ENTRY_FORMS_DIR: partialRoot, FIVE_ENTRY_OUT_DIR: path.join(partialRoot, 'out') })
  check('D10c POSITIVE CONTROL: with one reviewer leaf blanked out of an otherwise COMPLETE family B, the generator refuses the render as a PARTIALLY completed decision (exit non-zero, named reason) - it will not render executable SQL for a half-decided family',
    !partialRefusal.ok && partialRefusal.out.includes('PARTIALLY completed decision is not a decision'), partialRefusal.out.slice(-200))
  const gen = read(PACKAGE_GENERATOR_PATH)
  check('D11 the package generator refuses, by code, to write synthetic renderings under docs/, refuses variants outside test mode, refuses partial decisions, refuses non-APPROVE/approved decisions and refuses the historical key',
    gen.includes('test mode REFUSES to write under') && gen.includes('is permitted in test mode only') && gen.includes('a PARTIALLY completed decision is not a decision') && gen.includes('only APPROVE has a prepared package') && gen.includes('only approved has a prepared package') && gen.includes('reuses the historical plank release key'))
  const variantRefusal = tsx([PACKAGE_GENERATOR_PATH], { FIVE_ENTRY_VARIANT: 'carry_stage1', FIVE_ENTRY_OUT_DIR: path.join(tmpdir(), 'w14e-static-variant-refusal') })
  check('D12 POSITIVE CONTROL: invoking a negative-control variant against the REAL forms is refused by the generator (exit non-zero, named reason)', !variantRefusal.ok && variantRefusal.out.includes('permitted in test mode only'))
  // The completion record: the artifact that binds the three filled forms, the
  // decisions, and everything rendered from them. Every digest below is
  // recomputed here from the bytes on disk, so the record cannot agree with
  // itself - it has to agree with the tree.
  const record = read(DECISION_RECORD_PATH)
  const formBindings = [FORM_A_PATH, FORM_B_PATH, FORM_C_PATH].map((formPath) => { const bytes = readFileSync(path.join(repositoryRoot, formPath)); return { formPath, length: bytes.length, sha: sha256(bytes) } })
  const packageDigests = PACKAGE_FILES.map((f) => sha256(readFileSync(path.join(repositoryRoot, `${PACKAGE_DIR}/${f}`))))
  check('D14 the human decision record binds - by digests recomputed here from the tree, not copied from the record - all three COMPLETED forms (path, bytes, sha256), all seven EXECUTABLE packages (sha256), the five unchanged content payload fingerprints and the five generated admission fingerprints',
    formBindings.every((b) => record.includes(b.formPath) && record.includes(String(b.length)) && record.includes(b.sha))
    && packageDigests.every((d) => record.includes(d))
    && (world.manifest.entries ?? []).every((e) => record.includes(e.content_payload_fingerprint.sha256))
    && ADMISSION_FINGERPRINTS.every((f) => record.includes(f)),
    `forms bound: ${formBindings.filter((b) => record.includes(b.sha)).length}/3, packages bound: ${packageDigests.filter((d) => record.includes(d)).length}/7`)
  check(`D15 the human decision record states the governing decision timestamp, both Joseph tuples and the ${FAMILY_B_DECISION.reviewer} / ${FAMILY_B_DECISION.role} tuple with its rationale verbatim, ALL judgment confirmations true for all five entries, the authorized run key with the cumulative 8 exercise + 3 alias membership, and labels hosted migration 029 OPERATOR-SUPPLIED with its exact hosted record and read-state probe; it is a GENERATED file carrying no synthetic marker and no unresolved token`,
    record.includes(DECISION_TIMESTAMP) && (record.match(new RegExp(rx(DECISION_TIMESTAMP), 'g')) ?? []).length >= 12
    && [FAMILY_A_DECISION, FAMILY_B_DECISION].every((d) => record.includes(d.decision) && record.includes(d.reviewer) && record.includes(d.role) && record.includes(d.rationale))
    && (record.match(/ALL true/g) ?? []).length === 5
    && record.includes(RESOLVED_RUN_KEY) && record.includes(RESOLVED_RUN_MEMBERSHIP) && record.includes('8 exercise members + 3 alias members = 11 membership rows')
    && record.includes('OPERATOR-SUPPLIED') && record.includes(MIGRATION_029_HOSTED_RECORD) && record.includes(MIGRATION_029_HOSTED_PROBE)
    && record.includes('GENERATED FILE') && !record.includes(SYNTHETIC_MARKER) && !record.includes('<<UNRESOLVED'))
  // The frozen review bundle. It is hand-assembled prose around machine-copied
  // tables, so it is checked the same way as the record: every digest is
  // recomputed here from the tree, and the candidate it claims to have measured
  // must be a real ancestor commit whose tree it also states correctly. A
  // bundle cannot state its own SHA, so the pin is the MEASURED candidate.
  const bundle = existsSync(path.join(repositoryRoot, REVIEW_BUNDLE_PATH)) ? read(REVIEW_BUNDLE_PATH) : ''
  // Every 40-hex token the bundle states must be a real object in THIS repository:
  // a commit that is an ancestor of HEAD (whose tree the bundle also states), or a
  // tree. A token that resolves to nothing - or to a commit off this history - is a
  // fabricated pin. The MEASURED candidate is then the stated ancestor commit that
  // is not the pre-decision commit; the bundle cannot state its own SHA, so this is
  // the strongest pin available to it.
  // No Set spread and no matchAll spread: this repository's tsconfig has no
  // downlevelIteration, so iterating either is a TS2802 compile error.
  const bundleShas = (bundle.match(/`[0-9a-f]{40}`/g) ?? []).map((t) => t.slice(1, -1)).filter((sha, i, all) => all.indexOf(sha) === i)
  const objectType = (sha: string) => (gitSucceeds('cat-file', '-e', sha) ? git('cat-file', '-t', sha) : 'MISSING')
  const bundleCommits = bundleShas.filter((sha) => objectType(sha) === 'commit')
  const bundleTrees = bundleShas.filter((sha) => objectType(sha) === 'tree')
  const unresolvable = bundleShas.filter((sha) => !bundleCommits.includes(sha) && !bundleTrees.includes(sha))
  const offHistory = bundleCommits.filter((sha) => !gitSucceeds('merge-base', '--is-ancestor', sha, 'HEAD'))
  const treeUnstated = bundleCommits.filter((sha) => !bundle.includes(git('rev-parse', `${sha}^{tree}`)))
  const measured = bundleCommits.find((sha) => sha !== PRE_DECISION_COMMIT)
  check('D16 the frozen executable-package review bundle exists and agrees with the TREE, not with itself: the three form digests and all seven package digests recomputed here, the five content payload and five admission fingerprints, the governing timestamp, both Joseph tuples, the Nick Tkacz tuple, the run key and the 8 + 3 membership, the OPERATOR-SUPPLIED migration-029 label with its exact hosted record and probe, and a measured candidate commit that is a real ancestor of HEAD whose stated tree resolves',
    bundle.length > 0
    && formBindings.every((b) => bundle.includes(b.formPath) && bundle.includes(String(b.length)) && bundle.includes(b.sha))
    && packageDigests.every((d) => bundle.includes(d))
    && (world.manifest.entries ?? []).every((e) => bundle.includes(e.content_payload_fingerprint.sha256))
    && ADMISSION_FINGERPRINTS.every((f) => bundle.includes(f))
    && bundle.includes(DECISION_TIMESTAMP)
    && [FAMILY_A_DECISION, FAMILY_B_DECISION].every((d) => bundle.includes(d.reviewer) && bundle.includes(d.role) && bundle.includes(d.rationale))
    && bundle.includes(RESOLVED_RUN_KEY) && bundle.includes(RESOLVED_RUN_MEMBERSHIP)
    && bundle.includes('8 exercise members + 3 alias members = 11 membership rows')
    && bundle.includes('OPERATOR-SUPPLIED') && bundle.includes(MIGRATION_029_HOSTED_RECORD) && bundle.includes(MIGRATION_029_HOSTED_PROBE)
    && bundle.includes(PRE_DECISION_COMMIT)
    && !bundle.includes('<<UNRESOLVED')
    && unresolvable.length === 0 && offHistory.length === 0 && treeUnstated.length === 0
    && bundleCommits.includes(PRE_DECISION_COMMIT)
    && measured !== undefined && gitSucceeds('merge-base', '--is-ancestor', measured, 'HEAD') && bundle.includes(git('rev-parse', `${measured}^{tree}`)),
    `measured candidate: ${measured ?? 'NONE'}; commits: ${bundleCommits.length}, trees: ${bundleTrees.length}, unresolvable: ${unresolvable.join(', ') || 'none'}, off-history: ${offHistory.join(', ') || 'none'}, tree-unstated: ${treeUnstated.join(', ') || 'none'}`)
}

// ── negative controls ─────────────────────────────────────────────────
/**
 * Every control names the decision state it attacks. A control that deletes a
 * template sentinel has nothing to delete in an executable rendering, and a
 * control that fills a blank leaf has nothing to fill in a completed form: the
 * blank-state controls run against the pre-decision commit, the recorded-state
 * ones against the working tree, and both sets run every time.
 */
function runControls(recorded: World, blank: World): void {
  const controls: Array<{ label: string; expect: string; mode?: DecisionMode; mutate: (w: World) => void }> = [
    { label: 'NC-WRONG-UUID: one of the five frozen logical UUIDs replaced', expect: 'M2', mutate: (w) => { w.manifest.entries[4].logical_id = 'e21b2c00-0000-4000-a000-0000000000ff' } },
    { label: 'NC-SIXTH-IDENTITY: a sixth entry appended to the manifest', expect: 'M1', mutate: (w) => { w.manifest.entries.push({ ...w.manifest.entries[0], logical_id: 'e21b2c00-0000-4000-a000-0000000000f6', content_id: 'e21b2c00-0000-4000-a000-0000000001f6' }) } },
    { label: 'NC-CONTENT-ID-CONVENTION: a content id off the +0x100 convention', expect: 'M3', mutate: (w) => { w.manifest.entries[1].content_id = 'e21b2c00-0000-4000-a000-000000000205' } },
    { label: 'NC-CARRY-INSERTED: a deferred carry record added to the content carrier', expect: 'M4', mutate: (w) => { w.carrierRecords.push({ ...w.carrierRecords[0], logical_id: CARRY_IDS[0], canonical_name: "Farmer's carry", content_id: 'e21b2c00-0000-4000-a000-000000000109', inventory_file_line: 134 }) } },
    { label: 'NC-TRACKING-MODE: one governed snapshot moved off weight_time to its confusable neighbour', expect: 'M5', mutate: (w) => { w.manifest.entries[2].existing_snapshot_fingerprint.governed_fields.tracking_mode = 'timed' } },
    { label: 'NC-CONTENT-FINGERPRINT: one content fingerprint perturbed', expect: 'M6.132', mutate: (w) => { w.manifest.entries[0].content_payload_fingerprint.sha256 = 'f'.repeat(64) } },
    { label: 'NC-CARRIER-DRIFT: one word changed in a carrier record (the fingerprint no longer recomputes)', expect: 'M6.133', mutate: (w) => { (w.carrierRecords[1].setup_steps as string[])[0] += ' (drifted)' } },
    { label: 'NC-W14-DISAGREEMENT: a governed snapshot field silently changed against the frozen W14 manifest', expect: 'M7.138', mutate: (w) => { w.manifest.entries[3].existing_snapshot_fingerprint.governed_fields.availability = 'home_gym' } },
    { label: 'NC-VECTOR-CHAIN: the stage-2 after-vector broken', expect: 'M8', mutate: (w) => { w.manifest.stage_vectors[1].after = '8/8/10/3/11/7/2/2/1/6/8' } },
    { label: 'NC-CARRIER-SHA: the manifest binds a carrier digest other than the on-disk bytes', expect: 'M9', mutate: (w) => { w.manifest.admission_source_sha256.value = 'e'.repeat(64) } },
    { label: 'NC-SLOT-FILLED: a manifest human decision slot marked filled', expect: 'M11', mutate: (w) => { w.manifest.entries[0].human_decision_slots.snapshot_review.filled = true } },
    { label: 'NC-HISTORICAL-KEY-PROPOSED: the historical plank key proposed as the new run key', expect: 'M12', mutate: (w) => { w.manifest.delivery_run.proposed_run_key = HISTORICAL_RUN_KEY } },
    { label: 'NC-DECISION-FILLED: a family A decision tuple filled in the blank committed form', expect: 'F1', mode: 'BLANK', mutate: (w) => { Object.assign(w.formA.entries[0].human_fields, { decision: 'APPROVE', reviewer: 'Someone', reviewer_role_or_credential: 'x', reviewed_at: '2026-09-12T10:00:00-04:00', rationale: 'Approved because it looks right.' }) } },
    { label: 'NC-DECISION-FIELD-MISSING: a required leaf key removed from a family B entry', expect: 'F2', mutate: (w) => { delete w.formB.entries[2].rationale } },
    { label: 'NC-SYNTHETIC-FLAG: the synthetic-decision flag set on a committed form', expect: 'F3', mutate: (w) => { w.formC.test_only_synthetic_decisions = true } },
    { label: 'NC-FORM-CARRIER-SHA: the content form bound to a different carrier digest', expect: 'F4', mutate: (w) => { w.formB.content_fingerprint.sha256 = 'a'.repeat(64) } },
    { label: 'NC-MEMBERSHIP-IDS: the run-authority new-membership ids altered', expect: 'F6', mutate: (w) => { w.formC.requested_inputs.run_membership.exact_new_logical_ids[4] = PLANK_ID } },
    { label: 'NC-FORM-HISTORICAL-SIX: a carried-forward historical member dropped from the run-authority form', expect: 'F6', mutate: (w) => { w.formC.requested_inputs.run_membership.carried_forward_from_historical_run.members.pop() } },
    { label: 'NC-MANIFEST-HISTORICAL-SIX: the manifest\'s historical six altered (an alias line dropped)', expect: 'M14', mutate: (w) => { w.manifest.hosted_pre_state.historical_run.members = w.manifest.hosted_pre_state.historical_run.members.filter((l: string) => !l.includes('Front plank')) } },
    { label: 'NC-MANIFEST-FIVE-ONLY: the manifest\'s cumulative membership reduced to the five (the rejected design)', expect: 'M14', mutate: (w) => { w.manifest.delivery_run.expected_membership.expected_member_lines = GOVERNED.map((g) => `exercise#${g.logicalId}`); w.manifest.delivery_run.expected_membership.exercise_members = 5; w.manifest.delivery_run.expected_membership.alias_members = 0; w.manifest.delivery_run.expected_membership.total_items = 5 } },
    { label: 'NC-CARRY-FORWARD-DROPPED: the stage-6 alias carry-forward INSERT removed from the template', expect: 'T6.h', mutate: (w) => { w.packages['06-run-staging.sql'] = w.packages['06-run-staging.sql'].replace(/INSERT INTO public\.exercise_catalog_run_items \(run_id, catalog_alias_id\)\nSELECT r\.id, ri\.catalog_alias_id\n[\s\S]*?;\n/, '') } },
    { label: 'NC-CARRY-FORWARD-SOURCE: the stage-6 carry-forward copies from a different run key', expect: 'T6.h', mutate: (w) => { w.packages['06-run-staging.sql'] = w.packages['06-run-staging.sql'].split(`JOIN public.exercise_catalog_import_runs h ON h.run_key = '${HISTORICAL_RUN_KEY}'`).join("JOIN public.exercise_catalog_import_runs h ON h.run_key = 'some-other-run'") } },
    { label: 'NC-HISTORICAL-LINE-DROPPED: a promoted historical membership line removed from the stage-6 gate', expect: 'T6.i', mutate: (w) => { w.packages['06-run-staging.sql'] = w.packages['06-run-staging.sql'].split("'alias#e21b2c00-0000-4000-a000-000000000003#Ab roller rollout'").join("'alias#e21b2c00-0000-4000-a000-000000000003#Ab roller'") } },
    { label: 'NC-SEAL-SHAPE: stage 7 asserts the five-only seal shape', expect: 'T7.h', mutate: (w) => { w.packages['07-run-seal.sql'] = w.packages['07-run-seal.sql'].replace("'exercise_members', 8,\n       'alias_members', 3)", "'exercise_members', 5,\n       'alias_members', 0)") } },
    { label: 'NC-SENTINEL-REMOVED: the stage-1 template made syntactically runnable by deleting its sentinel', expect: 'T1.a', mode: 'BLANK', mutate: (w) => { w.packages['01-snapshot-review.sql'] = w.packages['01-snapshot-review.sql'].replace(/^SELECT <<UNRESOLVED-TEMPLATE:.*$/m, '') } },
    { label: 'NC-RESOLVED-LITERAL: a human leaf in the stage-1 template replaced by a resolved string literal', expect: 'T1.h', mode: 'BLANK', mutate: (w) => { w.packages['01-snapshot-review.sql'] = w.packages['01-snapshot-review.sql'].replace('reviewed_by      = <<UNRESOLVED:A.132.reviewer>>', "reviewed_by      = 'Someone'") } },
    { label: 'NC-SYNTHETIC-MARKER: the synthetic marker present in a committed template', expect: 'T3.b', mutate: (w) => { w.packages['03-content-review.sql'] += `\n-- ${SYNTHETIC_MARKER}\n` } },
    { label: 'NC-SIXTH-UPDATE: a sixth review UPDATE added to stage 1', expect: 'T1.h', mutate: (w) => { w.packages['01-snapshot-review.sql'] = w.packages['01-snapshot-review.sql'].replace(/^COMMIT;$/m, `UPDATE public.exercise_catalog\n   SET review_status    = 'approved'\n WHERE logical_id = '${PLANK_ID}' AND is_active = true;\nCOMMIT;`) } },
    { label: 'NC-DELIVERY-CALL: a tenant delivery call appended to stage 7', expect: 'T7.d', mutate: (w) => { w.packages['07-run-seal.sql'] = w.packages['07-run-seal.sql'].replace(/^COMMIT;$/m, "SELECT public.deliver_catalog_exercises('x');\nCOMMIT;") } },
    { label: 'NC-HISTORICAL-KEY-WRITTEN: the stage-6 TEMPLATE INSERTs the historical plank key as the new run_key', expect: 'T6.g', mode: 'BLANK', mutate: (w) => { w.packages['06-run-staging.sql'] = w.packages['06-run-staging.sql'].replace('(<<UNRESOLVED:C.run_key_literal>>, false,', `('${HISTORICAL_RUN_KEY}', false,`) } },
    { label: 'NC-MISSING-MEMBER: the stage-6 membership IN list reduced to four', expect: 'T6.h', mutate: (w) => { w.packages['06-run-staging.sql'] = w.packages['06-run-staging.sql'].replace(/ON c\.logical_id IN \(([\s\S]*?)\)/, (mm: string, list: string) => `ON c.logical_id IN (${list.split(',').slice(0, 4).join(',')})`) } },
    { label: 'NC-EXTRA-MEMBER: the plank identity added to the stage-6 NEW-member IN list (a duplicate of a carried-forward member)', expect: 'T6.h', mutate: (w) => { w.packages['06-run-staging.sql'] = w.packages['06-run-staging.sql'].replace(/ON c\.logical_id IN \(([\s\S]*?)\)/, (mm: string, list: string) => `ON c.logical_id IN (${list},\n                        '${PLANK_ID}')`) } },
    { label: 'NC-CARRY-MEMBER: a deferred carry added to the stage-6 membership IN list', expect: 'T6.f', mutate: (w) => { w.packages['06-run-staging.sql'] = w.packages['06-run-staging.sql'].replace(/ON c\.logical_id IN \(([\s\S]*?)\)/, (mm: string, list: string) => `ON c.logical_id IN (${list},\n                        '${CARRY_IDS[0]}')`) } },
    { label: 'NC-TEMPLATE-VECTOR: a stage-4 vector pin altered in the package', expect: 'T4.e', mutate: (w) => { w.packages['04-content-admission.sql'] = w.packages['04-content-admission.sql'].replace("IF v_counts <> '8/8/10/3/11/6/2/2/1/6/8' THEN", "IF v_counts <> '8/8/10/3/11/6/2/2/1/6/9' THEN") } },
    { label: 'NC-LOCK-DROPPED: one gated table removed from the stage-2 lock list', expect: 'T2.c', mutate: (w) => { w.packages['02-content-draft-load.sql'] = w.packages['02-content-draft-load.sql'].replace('  public.exercise_catalog_review_events,\n', '') } },
    { label: 'NC-UNGOVERNED-UUID: a substitute identity introduced into the stage-1 executable text', expect: 'T1.f', mutate: (w) => { w.packages['01-snapshot-review.sql'] = w.packages['01-snapshot-review.sql'].replace("WHERE logical_id = 'e21b2c00-0000-4000-a000-000000000008' AND is_active = true;", "WHERE logical_id = 'e21b2c00-0000-4000-a000-0000000000ff' AND is_active = true;") } },
    { label: 'NC-PAYLOAD-DRIFT-IN-PACKAGE: a stage-2 payload literal differs from the carrier', expect: 'T2.i', mutate: (w) => { w.packages['02-content-draft-load.sql'] = w.packages['02-content-draft-load.sql'].replace('Set your forearms on the floor shoulder-width apart', 'Set your forearms on the floor shoulder-width apart (drifted)') } },
    { label: 'NC-REVOKE-DROPPED: the grantor-scoped REVOKE removed from stage 2', expect: 'T2.h', mutate: (w) => { w.packages['02-content-draft-load.sql'] = w.packages['02-content-draft-load.sql'].replace('REVOKE exlib_catalog_loader FROM postgres GRANTED BY postgres;', '') } },
    { label: 'NC-ADMISSION-SHA: stage 4 passes a digest other than the bound carrier digest', expect: 'T4.h', mutate: (w) => { w.packages['04-content-admission.sql'] = w.packages['04-content-admission.sql'].split(`'${recorded.manifest.admission_source_sha256.value}');`).join(`'${'b'.repeat(64)}');`) } },
    // ── the recorded decisions themselves ──
    { label: 'NC-DECISION-SUBSTITUTED: the family B reviewer replaced by a different person in the completed form', expect: 'F1', mutate: (w) => { w.formB.entries.forEach((e) => { e.reviewer = 'A. N. Other' }) } },
    { label: 'NC-DECISION-TIMESTAMP-DRIFT: one family A decision moved one second off the governing timestamp', expect: 'F1', mutate: (w) => { w.formA.entries[3].human_fields.reviewed_at = '2026-09-13T18:25:14-04:00' } },
    { label: 'NC-CONFIRMATION-UNSET: one judgment confirmation flipped back to false in the completed form', expect: 'F1', mutate: (w) => { const key = Object.keys(w.formB.entries[1].needs_human_judgment_confirmations)[0]; w.formB.entries[1].needs_human_judgment_confirmations[key] = false } },
    { label: 'NC-MEMBERSHIP-DECISION-CHANGED: the family C membership decision changed to the rejected five-only design', expect: 'F1', mutate: (w) => { w.formC.requested_inputs.run_membership.value = 'FIVE_WEIGHT_TIME_IDENTITIES_ONLY' } },
    { label: 'NC-ROLE-DROPPED: the family B reviewer credential blanked while the name survives', expect: 'F1', mutate: (w) => { w.formB.entries[4].reviewer_role_or_credential = null } },
    { label: 'NC-PACKAGE-REVIEWER-DRIFT: stage 3 renders a reviewer other than the human who reviewed', expect: 'T3.h', mutate: (w) => { w.packages['03-content-review.sql'] = w.packages['03-content-review.sql'].split(`$rv132$${FAMILY_B_DECISION.reviewer}$rv132$`).join('$rv132$A. N. Other$rv132$') } },
    { label: 'NC-PACKAGE-RATIONALE-DRIFT: stage 3 renders a rationale the reviewer did not write', expect: 'T3.h', mutate: (w) => { w.packages['03-content-review.sql'] = w.packages['03-content-review.sql'].split(`$rr137$${FAMILY_B_DECISION.rationale}$rr137$`).join('$rr137$Looks fine to me.$rr137$') } },
    { label: 'NC-PACKAGE-TIMESTAMP-DRIFT: one stage-1 review timestamp rendered one second off the governing timestamp', expect: 'T1.h', mutate: (w) => { w.packages['01-snapshot-review.sql'] = w.packages['01-snapshot-review.sql'].replace(/reviewed_at(\s+)= TIMESTAMPTZ '[^']*'/, "reviewed_at$1= TIMESTAMPTZ '2026-09-13T18:25:14-04:00'") } },
    { label: 'NC-UNRESOLVED-TOKEN-SURVIVED: an unresolved human token left behind in an executable package', expect: 'T1.b', mutate: (w) => { w.packages['01-snapshot-review.sql'] = w.packages['01-snapshot-review.sql'].replace(`$ra132$${FAMILY_A_DECISION.rationale}$ra132$`, '<<UNRESOLVED:A.132.rationale>>') } },
    { label: 'NC-ADMISSION-FINGERPRINT-DRIFT: one stage-4 admission fingerprint pin perturbed', expect: 'T4.h', mutate: (w) => { w.packages['04-content-admission.sql'] = w.packages['04-content-admission.sql'].split(ADMISSION_FINGERPRINTS[2]).join('c'.repeat(64)) } },
    { label: 'NC-ADMISSION-FINGERPRINT-SWAPPED: two stage-4 admission fingerprints exchanged between identities (each value still present, both now on the wrong content)', expect: 'T4.h', mutate: (w) => { w.packages['04-content-admission.sql'] = w.packages['04-content-admission.sql'].split(ADMISSION_FINGERPRINTS[0]).join('__SWAP__').split(ADMISSION_FINGERPRINTS[1]).join(ADMISSION_FINGERPRINTS[0]).split('__SWAP__').join(ADMISSION_FINGERPRINTS[1]) } },
    { label: 'NC-HISTORICAL-KEY-WRITTEN-RECORDED: the EXECUTABLE stage 6 INSERTs the historical plank key as the new run_key', expect: 'T6.g', mutate: (w) => { w.packages['06-run-staging.sql'] = w.packages['06-run-staging.sql'].replace(`('${RESOLVED_RUN_KEY}', false,`, `('${HISTORICAL_RUN_KEY}', false,`) } },
    { label: 'NC-SEALED-KEY-DRIFT: stage 7 seals a run key other than the authorized one', expect: 'T7.h', mutate: (w) => { w.packages['07-run-seal.sql'] = w.packages['07-run-seal.sql'].split(`exlib_approve_and_seal_run('${RESOLVED_RUN_KEY}')`).join("exlib_approve_and_seal_run('some-other-run-key')") } },
    { label: 'NC-RUN-APPROVER-DRIFT: the stage-6 run row credits a legal approver who did not approve', expect: 'T6.h', mutate: (w) => { w.packages['06-run-staging.sql'] = w.packages['06-run-staging.sql'].split(`$lab$${FAMILY_C_APPROVER}$lab$`).join('$lab$A. N. Other$lab$') } },
    { label: 'NC-CLAUDE-OBSERVED-HOSTED: the manifest claims Claude observed the hosted migration-029 state', expect: 'M15', mutate: (w) => { const h = w.manifest.migration_029?.hosted_application; if (h) h.claude_observed_hosted_state = true } },
    { label: 'NC-HOSTED-PROVENANCE-DROPPED: the hosted migration-029 application no longer labelled OPERATOR-SUPPLIED', expect: 'M15', mutate: (w) => { const h = w.manifest.migration_029?.hosted_application; if (h) h.provenance = 'verified in this round' } },
    { label: 'NC-HOSTED-PROBE-DRIFT: the operator\'s post-apply read-state probe restated inexactly', expect: 'M15', mutate: (w) => { const h = w.manifest.migration_029?.hosted_application; if (h) h.post_apply_read_state_probe = 'migration_029_plank_cross_run_idempotency = PRESENT' } },
  ]
  for (const control of controls) {
    const mode: DecisionMode = control.mode ?? 'RECORDED'
    const baseline = mode === 'BLANK' ? blank : recorded
    const world: World = {
      manifest: structuredClone(baseline.manifest), w14: baseline.w14, carrierText: baseline.carrierText,
      carrierRecords: structuredClone(baseline.carrierRecords), formA: structuredClone(baseline.formA), formB: structuredClone(baseline.formB), formC: structuredClone(baseline.formC),
      packages: { ...baseline.packages },
    }
    control.mutate(world)
    const findings: Finding[] = []
    assertArtifacts(world, findings, mode)
    const prefix = mode === 'BLANK' ? '[blank] ' : ''
    const targeted = findings.filter((f) => f.name.startsWith(control.expect + ' ') || f.name.startsWith(control.expect + '.') || f.name === control.expect)
    if (targeted.length === 0) { check(`${prefix}${control.label} -> rejected by ${control.expect}`, false, `no assertion named ${control.expect} exists in ${mode} mode - the control targets a pin that is GONE`); continue }
    const rejected = targeted.some((f) => !f.ok)
    const collateral = findings.filter((f) => !f.ok && !targeted.includes(f)).length
    check(`${prefix}${control.label} -> rejected by ${control.expect}${collateral > 0 ? ` (and ${collateral} further assertion${collateral === 1 ? '' : 's'})` : ''}`, rejected, `${control.expect} still PASSED on the corrupted ${mode} artifact - that pin is dead`)
  }
}

function main(): number {
  console.log('W14-E — five-entry endgame: static verification of the complete local preparation\n')
  const required = [MANIFEST_PATH, W14_MANIFEST_PATH, CARRIER_PATH, FORM_A_PATH, FORM_B_PATH, FORM_C_PATH, MATRIX_PATH, DEPENDENCY_PATH, HUMAN_REVIEW_PATH, DECISION_RECORD_PATH, PROBE_PATH, MANIFEST_GENERATOR_PATH, PACKAGE_GENERATOR_PATH, LIVE_VERIFIER_PATH, ...PACKAGE_FILES.map((f) => `${PACKAGE_DIR}/${f}`)]
  const missing = required.filter((p) => !existsSync(path.join(repositoryRoot, p)))
  check(`P1 all ${required.length} required artifacts exist`, missing.length === 0, missing.join(', '))
  if (missing.length > 0) { console.log(`\n${passed} passed, ${failed} failed`); return 1 }
  const world = loadWorld()
  console.log('\nA. Artifacts (RECORDED decisions): manifest, completed forms, seven executable packages')
  const findings: Finding[] = []
  assertArtifacts(world, findings, 'RECORDED')
  for (const f of findings) check(f.name, f.ok, f.detail)
  const preWorld = loadPreDecisionWorld()
  console.log(`\nA0. The SAME assertion set in BLANK mode against the pre-decision commit ${PRE_DECISION_COMMIT.slice(0, 8)} - the fail-closed blank-form lifecycle, retargeted rather than deleted`)
  const preFindings: Finding[] = []
  assertArtifacts(preWorld, preFindings, 'BLANK')
  for (const f of preFindings) check(`A0 ${f.name}`, f.ok, f.detail)
  console.log('\nB. Boundaries: migrations, ancestry, change surface, frozen artifacts')
  verifyBoundaries(world)
  console.log('\nS. Governance signatures the packages depend on')
  verifyGovernance()
  console.log('\nD. Documents, probe, verifiers, generators')
  verifyDocuments(world)
  console.log('\nN. Negative controls - each must be rejected by the assertion it targets')
  runControls(world, preWorld)
  console.log(`\n${passed} passed, ${failed} failed`)
  return failed === 0 ? 0 : 1
}
process.exit(main())
