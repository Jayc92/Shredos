// EXLIB-2L verifier — catalog-content and relationship schema
// implementation PROPOSAL, CORRECTED REVISION C (LOCAL-ONLY;
// docs/-resident draft; NOT a migration; applies nothing; loads
// nothing; approves nothing).
//
// Proves the instruction's twelve static requirements plus the four
// accepted round-1 corrections plus the two round-2 corrections:
// exact source refs/tags/fingerprints and the phase inventory; the
// proposal resident under docs/ with migrations exactly 001-026; the
// three EXLIB-2K blockers accurately resolved; external-import
// compatibility INCLUDING legitimate nonempty 023 catalogs; no
// fabricated source facts; the review-BEFORE-admission lifecycle
// with separate one-way axes; the complete v2 SHA-256 admission
// manifest computed from database state and bound to the
// VERSION-OWNED relationship set; the PROTECTED PUBLICATION
// PROJECTION that closes the published-version mutation window
// structurally; FOUR distinct operational authorities with an exact
// grant matrix and full cross-denials; stale admissions failing
// closed structurally; Plank's two targets handled without false
// approval/admission/publication; the RLS/ACL/search_path/EXECUTE
// posture; migration-026 behavior and the activation state machine
// unchanged (including a byte-exact verbatim-carry recomputation of
// the one replaced 023 function); and zero content/seed/inventory/
// runtime/ledger/eligibility/migration-directory change. Performs NO
// hosted contact.
//
// Fail-closed: any mismatch fails the suite.
import { execSync } from 'child_process'
import { createHash } from 'crypto'
import { readFileSync, readdirSync } from 'fs'

let passed = 0
let failed = 0
const check = (name: string, ok: boolean, detail?: string): void => {
  if (ok) { passed += 1; console.log(`  PASS  ${name}`) }
  else { failed += 1; console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`) }
}
const read = (p: string): string => readFileSync(p, 'utf8')
const sha256 = (p: string): string => createHash('sha256').update(readFileSync(p)).digest('hex')
const parseJsonl = (p: string): any[] => read(p).split('\n')
  .filter((l) => l.trim() && !l.trim().startsWith('#')).map((l) => JSON.parse(l))
// RETARGET (EXLIB-2N review-decision application): the Dead bug
// (batch02 line 12) and Ab wheel rollout (batch04 line 5) records
// were pending and byte-frozen from this suite's source tip through
// the promoted EXLIB-2N tip; the approved human decisions change
// exactly those two files after it. Their frozen-vs-source claims are
// anchored to that promoted tip; every other file remains live.
const TIP_2N_RETARGET = 'c9c1afd7df35f2870430da3a8d1295ff7e48e11d'
const frozenAt2NVsSource = (p: string): boolean =>
  execSync(`git rev-parse ${TIP_2N_RETARGET}:${p}`, { encoding: 'utf8' }).trim() ===
  execSync(`git rev-parse ${SOURCE_TIP}:${p}`, { encoding: 'utf8' }).trim()

const PROPOSAL = 'docs/exlib2l-catalog-content-schema-proposal.sql'
const DESIGN = 'docs/exlib2l-catalog-content-schema-design-record.md'
const REVIEW = 'docs/exlib2l-catalog-content-schema-implementation-review-record.md'
const VERIFIER = 'scripts/verify-exlib2l.ts'
const LIVE = 'scripts/verify-exlib2l-live.sh'
const CONTENT = 'docs/exlib2g-plank-content.jsonl'
const SOURCE_TIP = '2a0465e8be5ec2e33a41fde8f30d5fcd5a2de738'
const SOURCE_TREE = '7d86338e99a0f382dc4b90f058262cbf4779a66d'
const TAG_2J_OBJ = '2da3f3554d3dc94bc992f3809274bae140138755'
// RETARGET (EXLIB-2M migration-027 apply-prep): this suite proves the
// promoted, PROPOSAL-ONLY EXLIB-2L milestone at its exact promoted tip.
// Its "no 027 / proposal only / five-path phase" claims are anchored to
// that tip (where they were and remain true), because EXLIB-2M later
// creates supabase/migrations/027 as a prepared-not-applied candidate.
const PROMOTED_TIP_2L = '8289de5ef2f557fced97b9db88647b776a94b1bc'
const PROPOSAL_SHA = '9a0505c8f2fea3f4330e7c80e22ffd8bc6867760b335a7468ea4587f0bd70553'
const PROPOSAL_BYTES = 78468
const CONTENT_SHA = 'd82078490efa9ef13e128e7b7b742fbda8ea9e74e32382252d96c326c679d752'
const MIG023_SHA = '0991448c39a558385431c78cef6d6063df208312a3f53866756ba730066c42f2'
const PHASE_NEW = [PROPOSAL, DESIGN, REVIEW, VERIFIER, LIVE].sort()

const prop = read(PROPOSAL)
const propFlat = prop.replace(/\s+/g, ' ')
// comment prose flattened WITHOUT the leading "--" markers, so phrases
// that wrap across comment lines can be matched exactly
const propProse = prop.split('\n').map((l) => l.replace(/^\s*-- ?/, '')).join(' ').replace(/\s+/g, ' ')
const propCode = prop.split('\n').filter((l) => !l.trim().startsWith('--')).join('\n')
const design = read(DESIGN)
const designFlat = design.replace(/\s+/g, ' ')
const designNoWs = design.replace(/\s+/g, '')
const review = read(REVIEW)
const reviewFlat = review.replace(/\s+/g, ' ')
const live = read(LIVE)
const cur = parseJsonl(CONTENT)[0]
const mig023 = read('supabase/migrations/023_exlib_catalog_and_delivery_contract.sql')

const vocabCount = (col: string): number => {
  const m = prop.match(new RegExp(`CHECK \\(${col} IN \\(([\\s\\S]*?)\\)\\)`))
  return m ? (m[1].match(/'[a-z_]+'/g) ?? []).length : -1
}
const extractFreezeFn = (s: string): string => {
  const start = s.indexOf('CREATE OR REPLACE FUNCTION exlib_freeze_catalog_snapshot()')
  if (start < 0) return ''
  const end = s.indexOf('\n$$;', start)
  return end < 0 ? '' : s.slice(start, end + 4)
}
const frozenVsSource = (p: string): boolean =>
  execSync(`git hash-object "${p}"`, { encoding: 'utf8' }).trim() ===
  execSync(`git rev-parse "${SOURCE_TIP}:${p}"`, { encoding: 'utf8' }).trim()

async function main(): Promise<void> {
  console.log('EXLIB-2L verification (corrected schema proposal, revision C; LOCAL-ONLY; applies and approves nothing)')

  console.log('\nA. Source refs and the proposal artifact')
  {
    check('A1: exact source refs — the EXLIB-2J stable tag is the exact annotated object, peels to the source tip (ancestor of HEAD) whose tree is exact',
      (() => {
        try {
          if (execSync('git rev-parse exlib2j-plank-import-eligibility-admission-stable',
            { encoding: 'utf8' }).trim() !== TAG_2J_OBJ) return false
          if (execSync('git rev-parse exlib2j-plank-import-eligibility-admission-stable^{}',
            { encoding: 'utf8' }).trim() !== SOURCE_TIP) return false
          execSync(`git merge-base --is-ancestor ${SOURCE_TIP} HEAD`, { stdio: 'pipe' })
          return execSync(`git rev-parse ${SOURCE_TIP}^{tree}`, { encoding: 'utf8' }).trim() === SOURCE_TREE
        } catch { return false }
      })())
    check('A2: the corrected proposal lives under docs/ at its exact fingerprint (78,468 B / 9a0505c8...), declares itself NOT A MIGRATION with Joseph/ChatGPT-only application and the CORRECTED REVISION C banner, and the design record pins the same fingerprint',
      readFileSync(PROPOSAL).length === PROPOSAL_BYTES && sha256(PROPOSAL) === PROPOSAL_SHA &&
      prop.includes('(DRAFT - NOT APPLIED - NOT A MIGRATION)') &&
      prop.includes('CORRECTED REVISION C') &&
      propFlat.includes('only Joseph/ChatGPT may ever apply migrations') &&
      designNoWs.includes(PROPOSAL_SHA))
    check('A3: RETARGET (EXLIB-2M migration-027 apply-prep) — at the promoted EXLIB-2L tip (8289de5) migrations were EXACTLY 001-026 with no 027 (anchored via git, where the claim was true); every one of those 26 files remains byte-identical to the source tip in the LIVE tree today, and 023 keeps its exact applied REVISION H fingerprint (92,806 B / 0991448c...)',
      (() => {
        const files = execSync(`git ls-tree ${PROMOTED_TIP_2L} supabase/migrations/ --name-only`, { encoding: 'utf8' })
          .split('\n').filter((f) => f.endsWith('.sql')).map((f) => f.split('/').pop() as string).sort()
        if (files.length !== 26 || files.some((f) => f.startsWith('027'))) return false
        for (const f of files) if (!frozenVsSource(`supabase/migrations/${f}`)) return false
        return readFileSync('supabase/migrations/023_exlib_catalog_and_delivery_contract.sql').length === 92806 &&
          sha256('supabase/migrations/023_exlib_catalog_and_delivery_contract.sql') === MIG023_SHA
      })())
    check('A4: the proposal is ONE explicit transaction (the 023/024/025 batching policy) and contains NO line-leading DML outside function bodies — applying it could write no data even in principle',
      (() => {
        if (!/^BEGIN;$/m.test(prop) || !/^COMMIT;$/m.test(prop)) return false
        if (!propProse.includes('Do not rely on any client to batch')) return false
        const stripped = prop
          .replace(/\$do\$[\s\S]*?\$do\$/g, '')
          .replace(/\$\$[\s\S]*?\$\$/g, '')
          .split('\n').filter((l) => !l.trim().startsWith('--')).join('\n')
        return !/^\s*(INSERT|UPDATE|DELETE|COPY|TRUNCATE)\b/im.test(stripped)
      })())
  }

  console.log('\nB. The three EXLIB-2K blockers; nonempty compatibility (round-1 finding 4, preserved)')
  {
    check('B1: the design record preserves the EXLIB-2K finding exactly — three blockers, DEFERRED not failed, no claim that loading, publication, or activation occurred',
      design.includes('NO CONTENT DESTINATION') &&
      design.includes('NO RELATIONSHIP TARGET') &&
      design.includes('UNTRUTHFUL PROVENANCE SHAPE') &&
      designFlat.includes('DEFERRED — not failed permanently') &&
      designFlat.includes('Codex adjudicated the stop as correct') &&
      designFlat.includes('schema gaps, not content defects') &&
      designFlat.includes('Applying the proposal (if later approved) still loads NOTHING'))
    check('B2: blocker 1 resolved — exercise_catalog_content with the full authored-payload model, versioning, the draft/published/retired lifecycle, and the four-field admission record',
      prop.includes('CREATE TABLE exercise_catalog_content (') &&
      ['logical_id', 'content_version', 'authored_by', 'authored_at', 'setup_steps',
        'execution_steps', 'breathing_cue', 'common_mistakes', 'safety_guidance',
        'equipment_setup', 'accessibility_alternative', 'content_status',
        'publication_status', 'import_admitted', 'admitted_fingerprint',
        'admitted_source_sha256', 'admitted_at']
        .every((c) => prop.includes(c)) &&
      propFlat.includes("('draft','published','retired')") &&
      propFlat.includes('UNIQUE (logical_id, content_version)') &&
      propFlat.includes("ON exercise_catalog_content (logical_id) WHERE publication_status = 'published'"))
    check('B3: blocker 2 resolved — the version-owned expected-relationship SOURCE OF TRUTH plus the 2A-verbatim-shaped live surface (now a protected projection)',
      prop.includes('CREATE TABLE exercise_catalog_relationships (') &&
      prop.includes('CREATE TABLE exercise_catalog_content_expected_relationships (') &&
      propFlat.includes("relation TEXT NOT NULL CHECK (relation IN ('regression','progression','substitution'))") &&
      propFlat.includes('PRIMARY KEY (content_id, relation, to_logical_id)') &&
      propFlat.includes('PRIMARY KEY (from_logical_id, to_logical_id, relation)'))
    check('B4: blocker 3 resolved — truthful provenance: 2-value provenance column defaulting to external_source_derived, the four NOT NULLs dropped, and the fail-closed conditional constraint',
      propFlat.includes("ADD COLUMN provenance TEXT NOT NULL DEFAULT 'external_source_derived' CHECK (provenance IN ('forgefitos_original','external_source_derived'))") &&
      ['source_url', 'source_page', 'retrieved_at', 'import_confidence']
        .every((c) => propFlat.includes(`ALTER COLUMN ${c} DROP NOT NULL`)) &&
      propFlat.includes("ADD CONSTRAINT exercise_catalog_provenance_sources_chk CHECK ( (provenance = 'external_source_derived' AND source_url IS NOT NULL AND source_page IS NOT NULL AND retrieved_at IS NOT NULL AND import_confidence IS NOT NULL) OR (provenance = 'forgefitos_original' AND source_url IS NULL AND source_page IS NULL AND retrieved_at IS NULL AND import_confidence IS NULL) )"))
    check('B5: the promoted metadata vocabularies land 2A-verbatim as NULLABLE columns (finding 4), with originals REQUIRED to carry all four via exercise_catalog_discovery_metadata_chk',
      vocabCount('movement_pattern') === 35 && vocabCount('training_role') === 6 &&
      vocabCount('difficulty') === 3 && vocabCount('availability') === 3 &&
      ['movement_pattern', 'training_role', 'difficulty', 'availability']
        .every((c) => propFlat.includes(`ADD COLUMN ${c} TEXT CHECK`) &&
          !propFlat.includes(`ADD COLUMN ${c} TEXT NOT NULL`)) &&
      propFlat.includes("ADD CONSTRAINT exercise_catalog_discovery_metadata_chk CHECK ( provenance <> 'forgefitos_original' OR (movement_pattern IS NOT NULL AND training_role IS NOT NULL AND difficulty IS NOT NULL AND availability IS NOT NULL) )"))
    check('B6: NONEMPTY-catalog compatibility is explicit and honest — zero-hosted-rows is hosted evidence only, nothing backfilled or invented, legacy metadata NULL and immutable, the manifest is the workflow gate, and the executable proposal drops nothing',
      propProse.includes('"Hosted currently has zero rows" is treated as evidence for the hosted instance only, NOT as generic migration compatibility') &&
      designFlat.includes('no placeholder values, no deterministic backfill') &&
      propFlat.includes('lacks complete discovery metadata') &&
      !/DROP (COLUMN|CONSTRAINT|TABLE|FUNCTION|TRIGGER|INDEX)/.test(prop.split('-- ── 5.')[0]))
    check('B7: the live suite seeds a legitimate NONEMPTY 023 catalog BEFORE applying, proves byte-identical legacy rows and unchanged 026 delivery/rollback, and applies to BOTH empty and nonempty databases',
      live.includes('seeded with a legitimate NONEMPTY') &&
      live.includes('E1: every pre-existing 023 column of every legacy row is BYTE-IDENTICAL after application') &&
      live.includes('E3: external source fields REMAIN REQUIRED') &&
      live.includes('E8: unchanged migration-026 DELIVERY works on the HISTORICAL external rows after the proposal') &&
      live.includes('E10: unchanged migration-026 ROLLBACK works on the historical delivery after the proposal') &&
      live.includes('K5: the legacy external snapshot CANNOT enter the admission workflow') &&
      live.includes('D1: the proposal applies CLEANLY over the NONEMPTY legitimate 001-026 state') &&
      live.includes('D2: the proposal applies CLEANLY over the EMPTY 001-026 state'))
    check('B8: original authored content requires NO fabricated source facts — the original branch FORBIDS all four source fields, and the proposal fabricates no source values anywhere (no URL literals outside comments)',
      propFlat.includes("(provenance = 'forgefitos_original' AND source_url IS NULL") &&
      !prop.split('\n').some((l) => !l.trim().startsWith('--') && /https?:\/\//.test(l)))
  }

  console.log('\nC. Lifecycle order and the v2 admission manifest (round-1 findings 1-2, preserved; v2 for round 2)')
  {
    check('C1: the lifecycle ORDER is the promoted one — born pending/draft/UNADMITTED (trigger + structural CHECK), pending prose editable, review freezes the payload, and only an approved draft may receive its one-time admission',
      propFlat.includes('versions are born unadmitted; admission is a later, separately authorized act on an approved version') &&
      propFlat.includes('CONSTRAINT exercise_catalog_content_admission_order_chk CHECK ( NOT import_admitted OR content_status <> \'pending\' )') &&
      propFlat.includes('admission cannot precede human approval; only an approved version may be admitted') &&
      propFlat.includes('only approved content may be admitted; revised and rejected versions require a new content version') &&
      propFlat.includes('only an unpublished draft may be admitted') &&
      propFlat.includes('admission is one-way for an immutable version; it can be neither revoked nor re-recorded') &&
      propFlat.includes('the admission transition must travel alone') &&
      propFlat.includes('admission fields change only through the one-time admission transition'))
    check('C2: review, eligibility, and publication remain three separate one-way axes with the preserved approved-only narrowing (published implies approved AND admitted, structurally)',
      propFlat.includes('a review transition carries evidence only; payload and admission changes are forbidden in the same statement') &&
      propFlat.includes('a publication transition must travel alone') &&
      propFlat.includes("publication_status <> 'published' OR (content_status = 'approved' AND import_admitted)") &&
      propFlat.includes('only approved content can be published; pending, revised, and rejected content can never be published') &&
      prop.includes('PRESERVED NARROWING') &&
      propProse.includes('re-approval impossible'))
    check('C3: the admission manifest is VERSIONED v2, canonical, SHA-256, and computed FROM DATABASE STATE — the admission function computes it, the freeze trigger independently recomputes it, and no md5 call exists anywhere in the executable proposal',
      prop.includes("'EXLIB-ADMISSION-MANIFEST v2'") &&
      !prop.includes("'EXLIB-ADMISSION-MANIFEST v1'") &&
      prop.includes('CREATE OR REPLACE FUNCTION exlib_content_admission_manifest(p_content_id UUID)') &&
      propFlat.includes("SELECT encode(sha256(convert_to( public.exlib_content_admission_manifest(p_content_id), 'UTF8')), 'hex')") &&
      propFlat.includes('must equal the recomputed admission-manifest fingerprint; arbitrary hashes are rejected') &&
      !/md5/i.test(propCode))
    check('C4: the v2 manifest binds EVERY required surface INCLUDING the version-owned relationship set — and does NOT bind the live projection surface, so one version\'s manifest can never be coupled to another version\'s publication state',
      (() => {
        const fn = prop.slice(prop.indexOf('CREATE OR REPLACE FUNCTION exlib_content_admission_manifest'),
          prop.indexOf('CREATE OR REPLACE FUNCTION exlib_content_admission_fingerprint'))
        return ["'identity '", "'snapshot '", "'anatomy ", "'alias ", "'content '", "'review '",
          "'relationship ", 'exercise_catalog_muscles', 'exercise_catalog_aliases',
          'exercise_catalog_content_expected_relationships',
          'canonical_name', 'movement_pattern', 'source_url', 'import_confidence',
          'content_version', 'authored_by', 'reviewed_by', 'review_rationale']
          .every((tok) => fn.includes(tok)) &&
          !fn.includes('public.exercise_catalog_relationships') &&
          fn.includes('exactly one ACTIVE catalog snapshot') &&
          fn.includes('lacks complete discovery metadata')
      })())
    check('C5: manifest determinism is engineered, not assumed — hex-encoded UTF8 text, day-offset dates, numeric-epoch timestamps, jsonb canonical form, COLLATE "C" row ordering, and truthful STABLE (not IMMUTABLE) volatility',
      propFlat.includes("SELECT COALESCE('S' || encode(convert_to(p_value, 'UTF8'), 'hex'), 'N')") &&
      prop.includes("(v_c.authored_at - DATE '1970-01-01')::text") &&
      prop.includes('extract(epoch FROM v_c.reviewed_at)::numeric::text') &&
      (propCode.match(/ORDER BY [^)]*COLLATE "C"/g) ?? []).length === 3 &&
      !/LANGUAGE sql\s+IMMUTABLE/.test(prop) && !/\n\s*IMMUTABLE\b/.test(prop))
    check('C6: TWO digests stored DISTINCTLY with SHA-256 shape enforced, the recorded-fact nature of the source digest disclosed, and the old MD5\'s incompleteness stated plainly',
      propFlat.includes("AND admitted_fingerprint ~ '^[0-9a-f]{64}" + "$'") &&
      propFlat.includes("AND admitted_source_sha256 ~ '^[0-9a-f]{64}" + "$'") &&
      propFlat.includes('must be a 64-character lowercase hex SHA-256 of the exact reviewed repository artifact') &&
      propProse.includes('It did NOT cover the complete EXLIB-2J admitted artifact') &&
      designFlat.includes('did NOT bind the complete EXLIB-2J admitted artifact') &&
      designFlat.includes('recorded as provenance evidence and format-validated'))
  }

  console.log('\nD. The protected publication projection (round-2 finding 1)')
  {
    check('D1: the live surface is a TRIGGER-PROTECTED projection — INSERT/DELETE only under the transaction-local sentinel for that exact identity, UPDATE never, binding every caller including the owner',
      prop.includes('CREATE OR REPLACE FUNCTION exlib_protect_relationship_projection()') &&
      prop.includes('CREATE TRIGGER exercise_catalog_relationships_projection_trigger') &&
      propFlat.includes("current_setting('exlib.relationship_projection_identity', true) IS DISTINCT FROM COALESCE(NEW.from_logical_id, OLD.from_logical_id)::text") &&
      propFlat.includes('projection rows are immutable; the projection is replaced atomically inside publish_catalog_content') &&
      propFlat.includes("this table is a protected projection of the PUBLISHED version''s expected relationship set; it changes only atomically inside publish_catalog_content"))
    check('D2: publish_catalog_content performs the ATOMIC SWITCH — retire prior, delete the identity\'s projection, project the new version\'s expected set, publish — all under the logical-identity lock in one transaction, with the sentinel set and cleared around exactly the projection statements',
      propFlat.includes("PERFORM set_config('exlib.relationship_projection_identity', p_logical_id::text, true);") &&
      propFlat.includes('DELETE FROM public.exercise_catalog_relationships WHERE from_logical_id = p_logical_id;') &&
      propFlat.includes('INSERT INTO public.exercise_catalog_relationships (from_logical_id, to_logical_id, relation) SELECT p_logical_id, e.to_logical_id, e.relation FROM public.exercise_catalog_content_expected_relationships e WHERE e.content_id = p_content_id;') &&
      propFlat.includes('GET DIAGNOSTICS v_projected = ROW_COUNT;') &&
      propFlat.includes("PERFORM set_config('exlib.relationship_projection_identity', '', true);"))
    check('D3: the content freeze trigger STRUCTURALLY re-verifies projected-set equality (both directions, precise errors) and manifest freshness at the moment any row becomes published — even sentinel-abusing break-glass writes cannot pair a published version with a wrong or stale set',
      propFlat.includes("a required relationship is missing at publication; the version''s expected relationship set must be projected exactly") &&
      propFlat.includes('an unexpected relationship is present at publication; the projected live set must equal the expected set exactly') &&
      propFlat.includes('import admission is STALE - a bound surface changed after admission; publication is refused') &&
      (prop.match(/exlib_content_admission_fingerprint\(OLD\.id\)/g) ?? []).length === 1 &&
      (prop.match(/exlib_content_admission_fingerprint\(NEW\.id\)/g) ?? []).length === 1 &&
      (prop.match(/exlib_content_admission_fingerprint\(p_content_id\)/g) ?? []).length >= 2)
    check('D4: admission does NOT touch or read the live surface — the admit function and the trigger admission branch reference only the version-owned expected set (through the manifest), never the projection',
      (() => {
        const fn = prop.slice(prop.indexOf('CREATE OR REPLACE FUNCTION admit_catalog_content'),
          prop.indexOf('REVOKE EXECUTE ON FUNCTION admit_catalog_content'))
        return !fn.includes('exercise_catalog_relationships') &&
          propProse.includes('It does NOT touch or read the live relationship surface (which belongs to the published version)')
      })())
    check('D5: the window-closure sequence is live-proven end to end — v1 published with A stays published, unchanged, and manifest-FRESH through v2\'s staging, review, and admission; failed v2 publication preserves v1/A exactly; success atomically retires v1 and activates exactly B; versions\' rows never collide',
      live.includes('L1: version 1 is PUBLISHED with relationship set A') &&
      live.includes('L2: version 2 is STAGED with a DIFFERENT expected set B') &&
      live.includes('L4: version 2 is ADMITTED with set B while version 1/A remains published') &&
      live.includes('L5: after version 2\'s admission, version 1 is STILL published, its live set is STILL exactly A, and its manifest is STILL FRESH') &&
      live.includes('L7: the failed publication left version 1 published and set A intact EXACTLY') &&
      live.includes('L9: the successful publication ATOMICALLY retired version 1 and activated EXACTLY set B') &&
      live.includes('L10: the two versions\' relationship rows coexist WITHOUT collision') &&
      live.includes('J12: even a direct OWNER break-glass publish'))
    check('D6: the Plank model still requires exactly substitution -> Dead bug and progression -> Ab wheel rollout — the byte-frozen artifact is unchanged, and targets remain bare logical identities with no content requirements',
      JSON.stringify(cur.substitutions) === JSON.stringify(['Dead bug']) &&
      JSON.stringify(cur.progressions) === JSON.stringify(['Ab wheel rollout']) &&
      JSON.stringify(cur.regressions) === JSON.stringify([]) &&
      designFlat.includes('substitution "Dead bug", progression "Ab wheel rollout"') &&
      designFlat.includes('This is NOT an identity-only stub shortcut') &&
      live.includes('J5: the PLANK MODEL published with EXACTLY its substitution and progression') &&
      live.includes('J6: the relationship TARGETS remain bare logical identities'))
    check('D7: the expected set stays version-owned and review-frozen (authored while pending, rows immutable, Revision-G lock pattern, no self-expectation)',
      propFlat.includes('expected relationships freeze with the reviewed payload; corrections require a new content version') &&
      propFlat.includes('rows are immutable; delete and re-insert while the version is pending') &&
      propFlat.includes('cannot expect a relationship to its own identity') &&
      prop.includes('exlib_freeze_expected_relationships'))
  }

  console.log('\nE. Four distinct operational authorities (round-2 finding 2)')
  {
    check('E1: FOUR NOLOGIN roles exist, pg_roles-guarded — loader, reviewer, admission, and the promoted 2A publication role',
      ['exlib_catalog_loader', 'exlib_catalog_reviewer', 'exlib_catalog_admission', 'exlib_catalog_admin']
        .every((r) => propFlat.includes(`CREATE ROLE ${r} NOLOGIN`) &&
          propFlat.includes(`IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${r}')`)))
    check('E2: the GRANT matrix is exact in the SQL — six lifecycle functions, each granted to exactly its one owning role, exactly six GRANT statements, EXECUTE revoked from PUBLIC/anon/authenticated on every one',
      propFlat.includes('GRANT EXECUTE ON FUNCTION load_catalog_identity(UUID) TO exlib_catalog_loader;') &&
      propFlat.includes('GRANT EXECUTE ON FUNCTION load_catalog_snapshot(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, DATE, TEXT, JSONB, JSONB) TO exlib_catalog_loader;') &&
      propFlat.includes('GRANT EXECUTE ON FUNCTION load_catalog_content_draft(UUID, UUID, INTEGER, TEXT, DATE, JSONB, JSONB, TEXT, JSONB, TEXT, TEXT, TEXT, JSONB) TO exlib_catalog_loader;') &&
      propFlat.includes('GRANT EXECUTE ON FUNCTION apply_content_review(UUID, UUID, TEXT, TEXT, TIMESTAMPTZ, TEXT) TO exlib_catalog_reviewer;') &&
      propFlat.includes('GRANT EXECUTE ON FUNCTION admit_catalog_content(UUID, UUID, TEXT) TO exlib_catalog_admission;') &&
      propFlat.includes('GRANT EXECUTE ON FUNCTION publish_catalog_content(UUID, UUID) TO exlib_catalog_admin;') &&
      (prop.match(/^GRANT /gm) ?? []).length === 6 &&
      (prop.match(/^REVOKE /gm) ?? []).length === 27)
    check('E3: the loader authority is creation-only (three INSERT-only functions whose writes land born-pending/active/unadmitted); the reviewer applies exactly one legal pending decision with a complete tuple and updates only the four review fields; post-decision transitions are deliberately NOT operational',
      prop.includes('CREATE OR REPLACE FUNCTION load_catalog_identity(p_id UUID DEFAULT NULL)') &&
      prop.includes('CREATE OR REPLACE FUNCTION load_catalog_snapshot(') &&
      prop.includes('CREATE OR REPLACE FUNCTION load_catalog_content_draft(') &&
      prop.includes('CREATE OR REPLACE FUNCTION apply_content_review(') &&
      propFlat.includes('only a pending version can receive its review decision through this authority') &&
      propFlat.includes('decision must be approved, revised, or rejected') &&
      propFlat.includes('a complete, non-blank reviewer/timestamp/rationale tuple is required') &&
      propProse.includes('Post-decision transitions (approved -> revised|rejected) are deliberately NOT an operational authority in this proposal') &&
      (() => {
        const loaderFns = prop.slice(prop.indexOf('CREATE OR REPLACE FUNCTION load_catalog_identity'),
          prop.indexOf('CREATE OR REPLACE FUNCTION apply_content_review'))
        return !/\bUPDATE\s+public\./.test(loaderFns) && !/\bDELETE\s+FROM\b/.test(loaderFns)
      })())
    check('E4: every function pins search_path = public, pg_temp (13 of 13), no authorization path reads user-editable JWT metadata, and the break-glass honesty statement is present in proposal AND records',
      (prop.match(/SET search_path = public, pg_temp/g) ?? []).length === 13 &&
      !prop.includes('auth.jwt') && !prop.includes('request.jwt.claims') &&
      !prop.includes('app_metadata') && !prop.includes('user_metadata') &&
      propProse.includes('it is disclosed break-glass capability') &&
      designFlat.includes('HONEST BREAK-GLASS STATEMENT') &&
      reviewFlat.includes('identified honestly as database-superuser break-glass power'))
    check('E5: ALL TWELVE authority cross-denials are live-proven (not only admission-vs-publication), plus all four acts denied for ordinary clients and direct-table denials for the operational roles',
      ['M2: LOADER cannot review', 'M3: LOADER cannot admit', 'M4: LOADER cannot publish',
        'M5: REVIEWER cannot load', 'M6: REVIEWER cannot admit', 'M7: REVIEWER cannot publish',
        'M8: ADMISSION cannot load', 'M9: ADMISSION cannot review', 'M10: ADMISSION cannot publish',
        'M11: PUBLICATION cannot load', 'M12: PUBLICATION cannot review', 'M13: PUBLICATION cannot admit']
        .every((s) => live.includes(s)) &&
      live.includes('M14: $role cannot LOAD') &&
      live.includes('M15: operational roles hold NO direct table privileges') &&
      live.includes('M1: the GRANT matrix is exact'))
    check('E6: the proposal contains NO service-role reference and NO bare TO-authenticated authorization, and none of the five phase artifacts carries credential or connection-string material',
      (() => {
        const SR = 'service' + '_role'
        if (prop.includes(SR) || prop.includes('TO authenticated')) return false
        const TOKENS = ['pass' + 'word', 'sb' + 'p_', 'ey' + 'j', 'postgres' + 'ql://', 'postgres' + '://']
        return PHASE_NEW.every((p) => {
          const s = read(p).toLowerCase()
          return TOKENS.every((t) => !s.includes(t))
        })
      })())
  }

  console.log('\nF. Migration 026 and the activation state machine unchanged')
  {
    check('F1: verbatim carry RECOMPUTED — the one replaced 023 function is byte-identical to the committed 023 bytes outside the marked 8-line/518-byte EXLIB-2L splice (4,607-byte carried body)',
      (() => {
        const m = extractFreezeFn(mig023)
        const p = extractFreezeFn(prop)
        if (!m || !p) return false
        const SPLICE = [
          '     -- EXLIB-2L splice: the provenance discriminator and the four',
          '     -- discovery-metadata columns join the immutable snapshot list;',
          '     -- corrections still require a new catalog version row.',
          '     OR NEW.provenance        IS DISTINCT FROM OLD.provenance',
          '     OR NEW.movement_pattern  IS DISTINCT FROM OLD.movement_pattern',
          '     OR NEW.training_role     IS DISTINCT FROM OLD.training_role',
          '     OR NEW.difficulty        IS DISTINCT FROM OLD.difficulty',
          '     OR NEW.availability      IS DISTINCT FROM OLD.availability',
        ]
        const kept = p.split('\n').filter((l) => !SPLICE.includes(l))
        const spliceBytes = SPLICE.reduce((n, l) => n + Buffer.byteLength(l) + 1, 0)
        return kept.join('\n') === m &&
          p.split('\n').length - kept.length === 8 &&
          Buffer.byteLength(m) === 4607 && spliceBytes === 518
      })())
    check('F2: NO 024-026 object is redefined — the proposal\'s only CREATE targets are the carried freeze function plus genuinely new names absent from every committed migration',
      (() => {
        const created = Array.from(prop.matchAll(/CREATE (?:OR REPLACE )?(?:FUNCTION|TABLE|TRIGGER|INDEX|UNIQUE INDEX|ROLE) (\w+)/g), (m) => m[1])
        const newNames = ['exercise_catalog_content', 'exercise_catalog_relationships',
          'exercise_catalog_content_expected_relationships',
          'exlib_manifest_hex', 'exlib_content_admission_manifest',
          'exlib_content_admission_fingerprint', 'exlib_freeze_content_version',
          'exlib_freeze_expected_relationships', 'exlib_protect_relationship_projection',
          'load_catalog_identity', 'load_catalog_snapshot', 'load_catalog_content_draft',
          'apply_content_review', 'admit_catalog_content', 'publish_catalog_content',
          'exercise_catalog_content_one_published_idx', 'exercise_catalog_content_logical_idx',
          'exercise_catalog_relationships_to_idx',
          'exercise_catalog_content_expected_relationships_target_idx',
          'exercise_catalog_content_updated_at', 'exercise_catalog_content_freeze_trigger',
          'exercise_catalog_content_expected_relationships_freeze_trigger',
          'exercise_catalog_relationships_projection_trigger',
          'exlib_catalog_loader', 'exlib_catalog_reviewer', 'exlib_catalog_admission', 'exlib_catalog_admin']
        if (!created.every((n) => n === 'exlib_freeze_catalog_snapshot' || newNames.includes(n))) return false
        // RETARGET (EXLIB-2M migration-027 apply-prep): the "genuinely new
        // names absent from every committed migration" claim is anchored to
        // the promoted EXLIB-2L tip, where migrations were exactly 001-026;
        // EXLIB-2M's prepared 027 deliberately carries these names.
        const allMigs = execSync(`git ls-tree ${PROMOTED_TIP_2L} supabase/migrations/ --name-only`, { encoding: 'utf8' })
          .split('\n').filter((f) => f.endsWith('.sql'))
          .map((f) => execSync(`git show ${PROMOTED_TIP_2L}:${f}`, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 16 })).join('\n')
        const genuinelyNew = ['exercise_catalog_content', 'exercise_catalog_relationships',
          'exlib_content_admission_manifest', 'exlib_freeze_content_version',
          'exlib_protect_relationship_projection', 'load_catalog_identity', 'load_catalog_snapshot',
          'load_catalog_content_draft', 'apply_content_review', 'admit_catalog_content',
          'publish_catalog_content', 'exlib_catalog_loader', 'exlib_catalog_reviewer',
          'exlib_catalog_admission', 'exlib_catalog_admin']
        if (genuinelyNew.some((n) => allMigs.includes(n))) return false
        return ['deliver_catalog_exercises', 'rollback_catalog_delivery', 'exlib_plank_link_valid',
          'exlib_revoke_run_delivery', 'exlib_approve_and_seal_run', 'exlib_block_delivered_exercise_delete']
          .every((n) => !prop.includes(`FUNCTION ${n}`))
      })())
    check('F3: the activation state machine is untouched — seed byte-frozen (bodyweight Plank), inventory byte-frozen with seed_link_compatible false, and the proposal states why 026 behavior is unchanged (also live-proven by post-application delivery/rollback)',
      (() => {
        if (!frozenVsSource('src/lib/supabase/seed-exercises.ts')) return false
        if (!frozenVsSource('docs/exlib2b-release1-inventory.jsonl')) return false
        const inv = parseJsonl('docs/exlib2b-release1-inventory.jsonl')
        const plank = inv.filter((r: any) => r.proposed_canonical_name === 'Plank')
        if (plank.length !== 1 || plank[0].seed_link_compatible !== false) return false
        return propProse.includes('Migration 026 behavior is untouched: no 026 object is modified') &&
          propProse.includes('Applying this schema performs NO load, review decision, approval, admission, seal, publication, or delivery')
      })())
    check('F4: rollback and idempotency are defined — a pre-use drop sequence naming BOTH explicit constraints and every new object, rollback-after-rows as a reviewed data operation, deliberate non-idempotency with the whole-transaction guarantee, and the pg_roles-guarded role SET as the one exception',
      propProse.includes('PRE-USE ROLLBACK ONLY') &&
      propProse.includes('DROP CONSTRAINT exercise_catalog_provenance_sources_chk') &&
      propProse.includes('DROP CONSTRAINT exercise_catalog_discovery_metadata_chk') &&
      propProse.includes('DROP FUNCTION exlib_protect_relationship_projection()') &&
      propProse.includes('rollback is a reviewed data operation, not a schema drop') &&
      propProse.includes('rolls back WHOLLY') &&
      propProse.includes('NOT idempotent by design') &&
      propProse.includes('The one exception is the set of four roles'))
  }

  console.log('\nG. Nothing else changed; records are honest')
  {
    check('G1: the admitted Plank content is byte-identical (2,928 B / d8207849...) — content, review evidence, and eligibility all untouched: approved by Nick Tkacz, import_eligible true, review_status proposed, no publication key',
      readFileSync(CONTENT).length === 2928 && sha256(CONTENT) === CONTENT_SHA &&
      cur.content_review.status === 'approved' && cur.content_review.reviewer === 'Nick Tkacz' &&
      cur.import_eligible === true && cur.review_status === 'proposed' &&
      !Object.keys(cur).some((k) => k.includes('publication')))
    check('G2: ledger, legacy eligibility, and all six batch corpora are byte-identical to the source tip (48/48 pending-null; 26/26 import-ineligible)',
      (() => {
        for (const p of ['docs/exlib1b1-review-ledger.jsonl', 'docs/exlib1c0a-equipment-resolution.jsonl']) {
          if (!frozenVsSource(p)) return false
        }
        for (let i = 1; i <= 6; i += 1) {
          // RETARGET (EXLIB-2N review-decision application)
          const frozen = (i === 2 || i === 4) ? frozenAt2NVsSource : frozenVsSource
          if (!frozen(`docs/exlib2c-release1-batch0${i}-content.jsonl`)) return false
        }
        const led = parseJsonl('docs/exlib1b1-review-ledger.jsonl')
        if (led.length !== 48 || !led.every((r: any) => r.status === 'pending' && r.reviewer === null)) return false
        const cands = parseJsonl('docs/exlib1c0a-equipment-resolution.jsonl').flatMap((r: any) => r.canonical_candidates)
        return cands.length === 26 && cands.every((c: any) => c.import_eligible === false)
      })())
    check('G3: RETARGET (EXLIB-2M migration-027 apply-prep) — the EXLIB-2L phase touched ONLY the five declared docs/ and scripts/ paths, anchored to the exact promoted range (source tip .. 8289de5) where the claim was and remains true; later phases own their own boundaries',
      (() => {
        const range = execSync(`git diff --name-only ${SOURCE_TIP}..${PROMOTED_TIP_2L}`, { encoding: 'utf8' })
          .split('\n').filter(Boolean)
        return range.length === 5 && !range.some((p) => !/^(docs\/|scripts\/verify-)/.test(p))
      })())
    check('G4: the records are honest — the design record approves nothing and awaits Codex re-review; the implementation review record is explicitly NOT a specialist/human/Codex approval, answers BOTH round-2 findings, restates the no-regression matrix, and records the final totals truthfully; the advisors limitation is recorded honestly',
      designFlat.includes('This record APPROVES NOTHING') &&
      designFlat.includes('awaits Codex re-review') &&
      reviewFlat.includes('It is NOT a specialist, human, or Codex approval, and it approves nothing') &&
      designFlat.includes('No hosted or persistent database is contacted or changed') &&
      reviewFlat.includes('No hosted service was contacted at any point in this milestone') &&
      reviewFlat.includes('PUBLISHED-VERSION MUTATION WINDOW (round-2 finding 1)') &&
      reviewFlat.includes('TWO AUTHORITIES CLAIMED AS FOUR (round-2 finding 2)') &&
      reviewFlat.includes('NO REGRESSION of the accepted round-1 corrections') &&
      reviewFlat.includes('135 passed, 0 failed') &&
      reviewFlat.includes('4,607 B exact match') &&
      reviewFlat.includes('NOT a substitute for the hosted advisors') &&
      live.includes('NOT a substitute for the hosted'))
    check('G5: lifecycle-safe phase boundary — the phase adds exactly five new paths and modifies NOTHING pre-existing; strict porcelain while uncommitted, adder-anchored once committed',
      (() => {
        try {
          const inHead = (() => {
            try { execSync(`git cat-file -e HEAD:${PROPOSAL}`, { stdio: 'pipe' }); return true } catch { return false }
          })()
          if (!inHead) {
            const entries = execSync('git status --porcelain', { encoding: 'utf8' })
              .split('\n').filter(Boolean).map((l) => l.trim()).sort()
            const expected = PHASE_NEW.map((f) => `?? ${f}`).sort()
            if (JSON.stringify(entries) !== JSON.stringify(expected)) return false
            return execSync('git diff --cached --name-only', { encoding: 'utf8' }).trim() === ''
          }
          const adders = new Set<string>()
          for (const p of PHASE_NEW) {
            const a = execSync(`git log --all --format=%H --diff-filter=A -- "${p}"`,
              { encoding: 'utf8' }).split('\n').filter(Boolean)
            if (a.length !== 1) return false
            adders.add(a[0])
          }
          if (adders.size !== 1) return false
          const phase = Array.from(adders)[0]
          execSync(`git merge-base --is-ancestor ${phase} HEAD`)
          execSync(`git merge-base --is-ancestor ${SOURCE_TIP} ${phase}`)
          const range = execSync(`git diff --name-only ${SOURCE_TIP}..${phase}`, { encoding: 'utf8' })
            .split('\n').filter(Boolean).sort()
          return JSON.stringify(range) === JSON.stringify(PHASE_NEW)
        } catch { return false }
      })())
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
