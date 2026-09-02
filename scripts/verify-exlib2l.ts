// EXLIB-2L verifier — catalog-content and relationship schema
// implementation PROPOSAL, CORRECTED REVISION B (LOCAL-ONLY;
// docs/-resident draft; NOT a migration; applies nothing; loads
// nothing; approves nothing).
//
// Proves the instruction's twelve static requirements plus the four
// Codex round-1 corrections: exact source refs/tags/fingerprints and
// the phase inventory; the proposal resident under docs/ with
// migrations exactly 001-026; the three EXLIB-2K blockers accurately
// resolved; external-import compatibility INCLUDING legitimate
// nonempty 023 catalogs; no fabricated source facts for original
// content; the corrected review-BEFORE-admission lifecycle with
// review/eligibility/publication as separate one-way axes; the
// complete SHA-256 admission manifest computed from database state;
// stale-fingerprint eligibility failing closed structurally;
// identity-keyed fail-closed relationships with PROVABLE
// completeness via the version-owned expected set; Plank's two
// targets handled without false approval/admission/publication; the
// distinct admission/publication authorities with the full
// RLS/ACL/search_path/EXECUTE posture; migration-026 behavior and
// the activation state machine unchanged (including a byte-exact
// verbatim-carry recomputation of the one replaced 023 function);
// and zero content/seed/inventory/runtime/ledger/eligibility/
// migration-directory change. Performs NO hosted contact.
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

const PROPOSAL = 'docs/exlib2l-catalog-content-schema-proposal.sql'
const DESIGN = 'docs/exlib2l-catalog-content-schema-design-record.md'
const REVIEW = 'docs/exlib2l-catalog-content-schema-implementation-review-record.md'
const VERIFIER = 'scripts/verify-exlib2l.ts'
const LIVE = 'scripts/verify-exlib2l-live.sh'
const CONTENT = 'docs/exlib2g-plank-content.jsonl'
const SOURCE_TIP = '2a0465e8be5ec2e33a41fde8f30d5fcd5a2de738'
const SOURCE_TREE = '7d86338e99a0f382dc4b90f058262cbf4779a66d'
const TAG_2J_OBJ = '2da3f3554d3dc94bc992f3809274bae140138755'
const PROPOSAL_SHA = 'e42e08f259eda16173db06048b0e930056e0e7631895fa8382768cf68999b0de'
const PROPOSAL_BYTES = 63231
const CONTENT_SHA = 'd82078490efa9ef13e128e7b7b742fbda8ea9e74e32382252d96c326c679d752'
const MIG023_SHA = '0991448c39a558385431c78cef6d6063df208312a3f53866756ba730066c42f2'
const PHASE_NEW = [PROPOSAL, DESIGN, REVIEW, VERIFIER, LIVE].sort()

const prop = read(PROPOSAL)
const propFlat = prop.replace(/\s+/g, ' ')
// comment prose flattened WITHOUT the leading "--" markers, so phrases
// that wrap across comment lines can be matched exactly
const propProse = prop.split('\n').map((l) => l.replace(/^\s*-- ?/, '')).join(' ').replace(/\s+/g, ' ')
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
  console.log('EXLIB-2L verification (corrected schema proposal, revision B; LOCAL-ONLY; applies and approves nothing)')

  console.log('\nA. Source refs and the proposal artifact (proofs 1-2)')
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
    check('A2: the corrected proposal lives under docs/ at its exact fingerprint (63,231 B / e42e08f2...), declares itself NOT A MIGRATION with Joseph/ChatGPT-only application and the CORRECTED REVISION B banner, and the design record pins the same fingerprint',
      readFileSync(PROPOSAL).length === PROPOSAL_BYTES && sha256(PROPOSAL) === PROPOSAL_SHA &&
      prop.includes('(DRAFT - NOT APPLIED - NOT A MIGRATION)') &&
      prop.includes('CORRECTED REVISION B') &&
      propFlat.includes('only Joseph/ChatGPT may ever apply migrations') &&
      designNoWs.includes(PROPOSAL_SHA))
    check('A3: migrations remain EXACTLY 001-026 — 26 files, no 027, every file byte-identical to the source tip, and 023 at its exact applied REVISION H fingerprint (92,806 B / 0991448c...)',
      (() => {
        const files = readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).sort()
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

  console.log('\nB. The three EXLIB-2K blockers, resolved without overstatement; nonempty compatibility (proofs 3-5; finding 4)')
  {
    check('B1: the design record preserves the EXLIB-2K finding exactly — three blockers, DEFERRED not failed, no claim that loading, publication, or activation occurred',
      design.includes('NO CONTENT DESTINATION') &&
      design.includes('NO RELATIONSHIP TARGET') &&
      design.includes('UNTRUTHFUL PROVENANCE SHAPE') &&
      designFlat.includes('DEFERRED — not failed permanently') &&
      designFlat.includes('Codex adjudicated the stop as correct') &&
      designFlat.includes('schema gaps, not content defects') &&
      designFlat.includes('Applying the proposal (if later approved) still loads NOTHING'))
    check('B2: blocker 1 resolved — exercise_catalog_content exists with the full authored-payload model, versioning, the draft/published/retired publication lifecycle, and the four-field admission record',
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
    check('B3: blocker 2 resolved — exercise_catalog_relationships (2A-verbatim) PLUS the version-owned expected-relationship table that makes completeness provable',
      prop.includes('CREATE TABLE exercise_catalog_relationships (') &&
      prop.includes('CREATE TABLE exercise_catalog_content_expected_relationships (') &&
      propFlat.includes("relation TEXT NOT NULL CHECK (relation IN ('regression','progression','substitution'))") &&
      propFlat.includes('PRIMARY KEY (content_id, relation, to_logical_id)'))
    check('B4: blocker 3 resolved — truthful provenance: 2-value provenance column defaulting to external_source_derived, the four NOT NULLs dropped, and the fail-closed conditional constraint (all four sources for external rows, all four NULL for original rows)',
      propFlat.includes("ADD COLUMN provenance TEXT NOT NULL DEFAULT 'external_source_derived' CHECK (provenance IN ('forgefitos_original','external_source_derived'))") &&
      ['source_url', 'source_page', 'retrieved_at', 'import_confidence']
        .every((c) => propFlat.includes(`ALTER COLUMN ${c} DROP NOT NULL`)) &&
      propFlat.includes("ADD CONSTRAINT exercise_catalog_provenance_sources_chk CHECK ( (provenance = 'external_source_derived' AND source_url IS NOT NULL AND source_page IS NOT NULL AND retrieved_at IS NOT NULL AND import_confidence IS NOT NULL) OR (provenance = 'forgefitos_original' AND source_url IS NULL AND source_page IS NULL AND retrieved_at IS NULL AND import_confidence IS NULL) )"))
    check('B5: the promoted metadata vocabularies land 2A-verbatim — movement_pattern (35), training_role (6), difficulty (3), availability (3) — as NULLABLE columns (finding 4), with originals REQUIRED to carry all four via exercise_catalog_discovery_metadata_chk',
      vocabCount('movement_pattern') === 35 && vocabCount('training_role') === 6 &&
      vocabCount('difficulty') === 3 && vocabCount('availability') === 3 &&
      ['movement_pattern', 'training_role', 'difficulty', 'availability']
        .every((c) => propFlat.includes(`ADD COLUMN ${c} TEXT CHECK`) &&
          !propFlat.includes(`ADD COLUMN ${c} TEXT NOT NULL`)) &&
      propFlat.includes("ADD CONSTRAINT exercise_catalog_discovery_metadata_chk CHECK ( provenance <> 'forgefitos_original' OR (movement_pattern IS NOT NULL AND training_role IS NOT NULL AND difficulty IS NOT NULL AND availability IS NOT NULL) )"))
    check('B6: NONEMPTY-catalog compatibility is explicit and honest (finding 4) — zero-hosted-rows is treated as hosted evidence only, nothing is backfilled or invented, legacy metadata stays NULL and immutable, and the workflow gate (manifest) is the completeness enforcement point',
      propProse.includes('"Hosted currently has zero rows" is treated as evidence for the hosted instance only, NOT as generic migration compatibility') &&
      propProse.includes('legacy rows\' discovery metadata stays NULL rather than invented') &&
      designFlat.includes('no placeholder values, no deterministic backfill') &&
      designFlat.includes('the admission manifest RAISES on NULL discovery metadata') &&
      propFlat.includes('lacks complete discovery metadata') &&
      !/DROP (COLUMN|CONSTRAINT|TABLE|FUNCTION|TRIGGER|INDEX)/.test(prop.split('-- ── 5.')[0]))
    check('B7: the live suite seeds a legitimate NONEMPTY 023 external catalog BEFORE applying, then proves byte-identical legacy rows, still-required sources, and unchanged 026 delivery AND rollback on the historical rows (proofs 14-15)',
      live.includes('seeded with a legitimate NONEMPTY') &&
      live.includes('C1: two legitimate 023-era EXTERNAL snapshots insert under the pre-proposal schema') &&
      live.includes('E1: every pre-existing 023 column of every legacy row is BYTE-IDENTICAL after application') &&
      live.includes('E3: external source fields REMAIN REQUIRED') &&
      live.includes('E8: unchanged migration-026 DELIVERY works on the HISTORICAL external rows after the proposal') &&
      live.includes('E10: unchanged migration-026 ROLLBACK works on the historical delivery after the proposal') &&
      live.includes('K4: the legacy external snapshot CANNOT enter the admission workflow') &&
      live.includes("D1: the proposal applies CLEANLY over the NONEMPTY legitimate 001-026 state") &&
      live.includes("D2: the proposal applies CLEANLY over the EMPTY 001-026 state"))
    check('B8: original authored content requires NO fabricated source facts — the original branch FORBIDS all four source fields, and the proposal fabricates no source values anywhere (no URL literals outside comments)',
      propFlat.includes("(provenance = 'forgefitos_original' AND source_url IS NULL") &&
      !prop.split('\n').some((l) => !l.trim().startsWith('--') && /https?:\/\//.test(l)))
  }

  console.log('\nC. The corrected lifecycle and the admission manifest (findings 1-2; proofs 6-7)')
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
    check('C2: review, eligibility, and publication remain three separate one-way axes — review transitions carry evidence only (no payload or admission smuggling), publication transitions travel alone, and the extended publication CHECK makes published imply approved AND admitted',
      propFlat.includes('a review transition carries evidence only; payload and admission changes are forbidden in the same statement') &&
      propFlat.includes('a publication transition must travel alone') &&
      propFlat.includes("publication_status <> 'published' OR (content_status = 'approved' AND import_admitted)") &&
      propFlat.includes('only approved content can be published; pending, revised, and rejected content can never be published') &&
      prop.includes('PRESERVED NARROWING') &&
      propProse.includes('re-approval impossible'))
    check('C3: the admission manifest is versioned, canonical, SHA-256, and computed FROM DATABASE STATE — never caller-supplied: the admission function computes it, the freeze trigger independently recomputes it, and no md5 call exists anywhere in the proposal',
      prop.includes("'EXLIB-ADMISSION-MANIFEST v1'") &&
      prop.includes('CREATE OR REPLACE FUNCTION exlib_content_admission_manifest(p_content_id UUID)') &&
      prop.includes('CREATE OR REPLACE FUNCTION exlib_content_admission_fingerprint(p_content_id UUID)') &&
      propFlat.includes("SELECT encode(sha256(convert_to( public.exlib_content_admission_manifest(p_content_id), 'UTF8')), 'hex')") &&
      propFlat.includes('must equal the recomputed admission-manifest fingerprint; arbitrary hashes are rejected') &&
      !/md5/i.test(prop.split('\n').filter((l) => !l.trim().startsWith('--')).join('\n')))
    check('C4: the manifest binds EVERY required surface — identity, the single active snapshot\'s classification/tracking/provenance/discovery/sources, anatomy, aliases, authored content, authorship, the review-bound version with evidence, the expected set, and the live set',
      (() => {
        const fn = prop.slice(prop.indexOf('exlib_content_admission_manifest'),
          prop.indexOf('CREATE OR REPLACE FUNCTION exlib_content_admission_fingerprint'))
        return ["'identity '", "'snapshot '", "'anatomy ", "'alias ", "'content '", "'review '",
          "'expected ", "'relation ", 'exercise_catalog_muscles', 'exercise_catalog_aliases',
          'exercise_catalog_content_expected_relationships', 'exercise_catalog_relationships',
          'canonical_name', 'movement_pattern', 'source_url', 'import_confidence',
          'content_version', 'authored_by', 'reviewed_by', 'review_rationale']
          .every((tok) => fn.includes(tok)) &&
          fn.includes('exactly one ACTIVE catalog snapshot') &&
          fn.includes('lacks complete discovery metadata')
      })())
    check('C5: manifest determinism is engineered, not assumed — hex-encoded UTF8 text, day-offset dates, numeric-epoch timestamps, jsonb canonical form, COLLATE "C" row ordering, and truthful STABLE (not IMMUTABLE) volatility',
      propFlat.includes("SELECT COALESCE('S' || encode(convert_to(p_value, 'UTF8'), 'hex'), 'N')") &&
      prop.includes("(v_c.authored_at - DATE '1970-01-01')::text") &&
      prop.includes('extract(epoch FROM v_c.reviewed_at)::numeric::text') &&
      (prop.split('\n').filter((l) => !l.trim().startsWith('--')).join('\n')
        .match(/ORDER BY [^)]*COLLATE "C"/g) ?? []).length === 4 &&
      !/LANGUAGE sql\s+IMMUTABLE/.test(prop) && !/\n\s*IMMUTABLE\b/.test(prop) &&
      propProse.includes('an IMMUTABLE marking would be untruthful'))
    check('C6: TWO digests stored DISTINCTLY with SHA-256 shape enforced — the computed manifest fingerprint and the recorded source artifact SHA-256 (64-hex validated; the recorded-fact nature is disclosed, and no claim is made that the old MD5 covered the EXLIB-2J artifact)',
      propFlat.includes("AND admitted_fingerprint ~ '^[0-9a-f]{64}" + "$'") &&
      propFlat.includes("AND admitted_source_sha256 ~ '^[0-9a-f]{64}" + "$'") &&
      propFlat.includes('must be a 64-character lowercase hex SHA-256 of the exact reviewed repository artifact') &&
      propProse.includes('It did NOT cover the complete EXLIB-2J admitted artifact') &&
      propProse.includes('It is REPLACED, not renamed') &&
      reviewFlat.includes('did NOT cover the complete EXLIB-2J artifact') &&
      designFlat.includes('recorded as provenance evidence and format-validated'))
  }

  console.log('\nD. Relationship completeness and version isolation (finding 3; proofs 8-9)')
  {
    check('D1: relationship resolution is identity-keyed and fail-closed — RESTRICT FKs to exercise_catalog_logical everywhere, self-links refused in BOTH tables, deterministic PK uniqueness in both',
      (propFlat.match(/REFERENCES exercise_catalog_logical\(id\) ON DELETE RESTRICT/g) ?? []).length >= 4 &&
      propFlat.includes('PRIMARY KEY (from_logical_id, to_logical_id, relation)') &&
      propFlat.includes('CHECK (from_logical_id <> to_logical_id)') &&
      propFlat.includes('cannot expect a relationship to its own identity'))
    check('D2: the expected set is version-owned and review-frozen — authored while pending, rows immutable (UPDATE never allowed), insert/delete refused once decided, using the Revision-G lock pattern',
      propFlat.includes('expected relationships freeze with the reviewed payload; corrections require a new content version') &&
      propFlat.includes('rows are immutable; delete and re-insert while the version is pending') &&
      prop.includes('FOR UPDATE;') &&
      prop.includes('exlib_freeze_expected_relationships'))
    check('D3: completeness is enforced at ADMISSION and at PUBLICATION, in the FUNCTIONS and STRUCTURALLY in the trigger — exact set equality both directions with precise missing/unexpected errors, so a direct owner-level publish cannot bypass it either',
      propFlat.includes('an expected relationship is missing from the live set') &&
      propFlat.includes('an unexpected live relationship is present') &&
      propFlat.includes("a required relationship is missing at publication; the version''s expected relationship set must exist exactly") &&
      propFlat.includes('an unexpected relationship is present at publication; the live set must equal the expected set exactly') &&
      (prop.match(/a required relationship is missing at publication/g) ?? []).length === 2 &&
      propProse.includes('a direct owner-level write cannot bypass them either'))
    check('D4: staleness fails publication closed structurally — the trigger publication branch AND the function both recompute the manifest, and the STALE messages name the bound surfaces',
      propFlat.includes('import admission is STALE - a bound surface (snapshot, anatomy, alias, content, authorship, review evidence, or relationship) changed after admission') &&
      propFlat.includes('import admission is STALE - a bound surface changed after admission; publication is refused') &&
      (prop.match(/exlib_content_admission_fingerprint\(OLD\.id\)/g) ?? []).length === 1 &&
      (prop.match(/exlib_content_admission_fingerprint\(NEW\.id\)/g) ?? []).length === 1 &&
      (prop.match(/exlib_content_admission_fingerprint\(p_content_id\)/g) ?? []).length >= 2)
    check('D5: Plank\'s two targets are handled WITHOUT false approval/admission/publication — the byte-frozen artifact still names exactly Dead bug (substitution) and Ab wheel rollout (progression) with zero regressions, and the design record\'s determination keeps identity existence separate from content state with no identity-only stub invention',
      JSON.stringify(cur.substitutions) === JSON.stringify(['Dead bug']) &&
      JSON.stringify(cur.progressions) === JSON.stringify(['Ab wheel rollout']) &&
      JSON.stringify(cur.regressions) === JSON.stringify([]) &&
      designFlat.includes('substitution "Dead bug", progression "Ab wheel rollout"') &&
      designFlat.includes('the target identities need NO snapshot, NO content, NO admission, and NO publication of their own') &&
      designFlat.includes('This is NOT an identity-only stub shortcut') &&
      designFlat.includes('no target content is approved, admitted, loaded, or published merely to satisfy the foreign keys'))
    check('D6: version isolation is designed and live-proven — one version\'s relationships cannot silently alter another\'s publication meaning; the other version fails CLOSED instead',
      designFlat.includes('VERSION ISOLATION') &&
      propProse.includes('cannot silently alter another version\'s publication meaning') &&
      live.includes('L2: version 2 cannot be admitted while the LIVE set still serves version 1') &&
      live.includes('L4: version 1 can NO LONGER publish'))
    check('D7: the live harness proves the completeness matrix it is cited for — either required relationship missing, extras, swapped types, the direct-write bypass probes, and target-content independence',
      live.includes('J2: the PLANK MODEL cannot publish with its required PROGRESSION missing') &&
      live.includes('J3: the Plank model cannot publish with its required SUBSTITUTION missing either') &&
      live.includes('J4: an EXTRA relationship fails publication') &&
      live.includes('J5: WRONG relationship types fail publication') &&
      live.includes('J5b: even a DIRECT OWNER-LEVEL publish cannot bypass completeness') &&
      live.includes('K1b: even a DIRECT OWNER-LEVEL publish cannot bypass staleness') &&
      live.includes('ZERO content, ZERO admission, ZERO publication of their own') &&
      live.split('\n').filter((l) => l.includes('exlib2g-plank-content'))
        .every((l) => l.trim().startsWith('#')) &&
      live.includes('LOCAL, DISPOSABLE PROOF FIXTURES'))
  }

  console.log('\nE. Distinct authorities and security posture (proof 10)')
  {
    check('E1: RLS is enabled on ALL THREE new tables with zero policies, and ALL table privileges are revoked from PUBLIC, anon, and authenticated',
      (prop.match(/ENABLE ROW LEVEL SECURITY/g) ?? []).length === 3 &&
      !prop.includes('CREATE POLICY') &&
      propFlat.includes('ALTER TABLE exercise_catalog_content ENABLE ROW LEVEL SECURITY; REVOKE ALL ON TABLE exercise_catalog_content FROM PUBLIC, anon, authenticated;') &&
      propFlat.includes('ALTER TABLE exercise_catalog_relationships ENABLE ROW LEVEL SECURITY; REVOKE ALL ON TABLE exercise_catalog_relationships FROM PUBLIC, anon, authenticated;') &&
      propFlat.includes('ALTER TABLE exercise_catalog_content_expected_relationships ENABLE ROW LEVEL SECURITY; REVOKE ALL ON TABLE exercise_catalog_content_expected_relationships FROM PUBLIC, anon, authenticated;'))
    check('E2: admission and publication are DISTINCT dedicated authorities — admit EXECUTE revoked from clients and granted ONLY to exlib_catalog_admission; publish EXECUTE revoked from clients and granted ONLY to exlib_catalog_admin; exactly two GRANT statements exist; both roles NOLOGIN and pg_roles-guarded',
      propFlat.includes('REVOKE EXECUTE ON FUNCTION admit_catalog_content(UUID, UUID, TEXT) FROM PUBLIC;') &&
      propFlat.includes('REVOKE EXECUTE ON FUNCTION admit_catalog_content(UUID, UUID, TEXT) FROM anon;') &&
      propFlat.includes('REVOKE EXECUTE ON FUNCTION admit_catalog_content(UUID, UUID, TEXT) FROM authenticated;') &&
      propFlat.includes('GRANT EXECUTE ON FUNCTION admit_catalog_content(UUID, UUID, TEXT) TO exlib_catalog_admission;') &&
      propFlat.includes('REVOKE EXECUTE ON FUNCTION publish_catalog_content(UUID, UUID) FROM PUBLIC;') &&
      propFlat.includes('GRANT EXECUTE ON FUNCTION publish_catalog_content(UUID, UUID) TO exlib_catalog_admin;') &&
      (prop.match(/^GRANT /gm) ?? []).length === 2 &&
      propFlat.includes('CREATE ROLE exlib_catalog_admin NOLOGIN') &&
      propFlat.includes('CREATE ROLE exlib_catalog_admission NOLOGIN') &&
      propFlat.includes("IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'exlib_catalog_admission')") &&
      live.includes('H12: the admission authority CANNOT publish') &&
      live.includes('H13: the publication authority CANNOT admit'))
    check('E3: every function pins search_path = public, pg_temp (8 of 8), every helper is revoked from client roles, and no authorization path reads user-editable JWT metadata',
      (prop.match(/SET search_path = public, pg_temp/g) ?? []).length === 8 &&
      propFlat.includes('REVOKE ALL ON FUNCTION exlib_manifest_hex(TEXT) FROM PUBLIC, anon, authenticated;') &&
      propFlat.includes('REVOKE ALL ON FUNCTION exlib_content_admission_manifest(UUID) FROM PUBLIC, anon, authenticated;') &&
      propFlat.includes('REVOKE ALL ON FUNCTION exlib_content_admission_fingerprint(UUID) FROM PUBLIC, anon, authenticated;') &&
      propFlat.includes('REVOKE ALL ON FUNCTION exlib_freeze_content_version() FROM PUBLIC, anon, authenticated;') &&
      propFlat.includes('REVOKE ALL ON FUNCTION exlib_freeze_expected_relationships() FROM PUBLIC, anon, authenticated;') &&
      !prop.includes('auth.jwt') && !prop.includes('request.jwt.claims') &&
      !prop.includes('app_metadata') && !prop.includes('user_metadata'))
    check('E4: the proposal contains NO service-role reference and NO bare TO-authenticated authorization, and none of the five phase artifacts carries credential or connection-string material',
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

  console.log('\nF. Migration 026 and the activation state machine unchanged (proof 11)')
  {
    check('F1: verbatim carry RECOMPUTED — the one replaced 023 function (exlib_freeze_catalog_snapshot) is byte-identical to the committed 023 bytes outside the marked 8-line/518-byte EXLIB-2L splice (4,607-byte carried body)',
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
          'exlib_freeze_expected_relationships', 'admit_catalog_content', 'publish_catalog_content',
          'exercise_catalog_content_one_published_idx', 'exercise_catalog_content_logical_idx',
          'exercise_catalog_relationships_to_idx',
          'exercise_catalog_content_expected_relationships_target_idx',
          'exercise_catalog_content_updated_at', 'exercise_catalog_content_freeze_trigger',
          'exercise_catalog_content_expected_relationships_freeze_trigger',
          'exlib_catalog_admin', 'exlib_catalog_admission']
        if (!created.every((n) => n === 'exlib_freeze_catalog_snapshot' || newNames.includes(n))) return false
        const allMigs = readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql'))
          .map((f) => read(`supabase/migrations/${f}`)).join('\n')
        const genuinelyNew = ['exercise_catalog_content', 'exercise_catalog_relationships',
          'exlib_content_admission_manifest', 'exlib_freeze_content_version',
          'admit_catalog_content', 'publish_catalog_content', 'exlib_catalog_admin',
          'exlib_catalog_admission']
        if (genuinelyNew.some((n) => allMigs.includes(n))) return false
        return ['deliver_catalog_exercises', 'rollback_catalog_delivery', 'exlib_plank_link_valid',
          'exlib_revoke_run_delivery', 'exlib_approve_and_seal_run', 'exlib_block_delivered_exercise_delete']
          .every((n) => !prop.includes(`FUNCTION ${n}`))
      })())
    check('F3: the activation state machine is untouched — seed byte-frozen (bodyweight Plank), inventory byte-frozen with seed_link_compatible false, and the proposal\'s rollback section states why 026 behavior is unchanged (now also live-proven by post-application delivery/rollback)',
      (() => {
        if (!frozenVsSource('src/lib/supabase/seed-exercises.ts')) return false
        if (!frozenVsSource('docs/exlib2b-release1-inventory.jsonl')) return false
        const inv = parseJsonl('docs/exlib2b-release1-inventory.jsonl')
        const plank = inv.filter((r: any) => r.proposed_canonical_name === 'Plank')
        if (plank.length !== 1 || plank[0].seed_link_compatible !== false) return false
        return propProse.includes('Migration 026 behavior is untouched: no 026 object is modified') &&
          propProse.includes('Applying this schema performs NO load, approval, admission, seal, publication, or delivery')
      })())
    check('F4: rollback and idempotency are defined — a pre-use drop sequence naming BOTH explicit constraints, rollback-after-rows as a reviewed data operation, deliberate non-idempotency with the whole-transaction guarantee, and the pg_roles-guarded role PAIR as the one exception',
      propProse.includes('PRE-USE ROLLBACK ONLY') &&
      propProse.includes('DROP CONSTRAINT exercise_catalog_provenance_sources_chk') &&
      propProse.includes('DROP CONSTRAINT exercise_catalog_discovery_metadata_chk') &&
      propProse.includes('rollback is a reviewed data operation, not a schema drop') &&
      propProse.includes('rolls back WHOLLY') &&
      propProse.includes('NOT idempotent by design') &&
      propProse.includes('The one exception is the pair of roles'))
  }

  console.log('\nG. Nothing else changed; records are honest (proof 12)')
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
          if (!frozenVsSource(`docs/exlib2c-release1-batch0${i}-content.jsonl`)) return false
        }
        const led = parseJsonl('docs/exlib1b1-review-ledger.jsonl')
        if (led.length !== 48 || !led.every((r: any) => r.status === 'pending' && r.reviewer === null)) return false
        const cands = parseJsonl('docs/exlib1c0a-equipment-resolution.jsonl').flatMap((r: any) => r.canonical_candidates)
        return cands.length === 26 && cands.every((c: any) => c.import_eligible === false)
      })())
    check('G3: no runtime, API, UI, dependency, or configuration change — the phase touches ONLY the five declared docs/ and scripts/ paths (nothing under src/, supabase/, package/config)',
      (() => {
        const range = execSync(`git diff --name-only ${SOURCE_TIP}..HEAD`, { encoding: 'utf8' })
          .split('\n').filter(Boolean)
        if (range.some((p) => !/^(docs\/|scripts\/verify-)/.test(p))) return false
        return !execSync('git status --porcelain', { encoding: 'utf8' })
          .split('\n').filter(Boolean)
          .some((l) => /^(src\/|supabase\/|package|next\.config|tsconfig|\.env|public\/)/.test(l.slice(3)))
      })())
    check('G4: the records are honest about authority, hosted state, and the correction round — the design record approves nothing and awaits Codex RE-review, the implementation review record is explicitly NOT a specialist/human/Codex approval and discloses this round\'s own found-and-fixed defects, and the advisors limitation is recorded honestly in record AND harness',
      designFlat.includes('This record APPROVES NOTHING') &&
      designFlat.includes('awaits Codex re-review') &&
      reviewFlat.includes('It is NOT a specialist, human, or Codex approval, and it approves nothing') &&
      designFlat.includes('No hosted or persistent database is contacted or changed') &&
      reviewFlat.includes('No hosted service was contacted at any point in this milestone') &&
      reviewFlat.includes('FUNCTION-ONLY PUBLICATION GATE') &&
      reviewFlat.includes('COLLATION-DEPENDENT MANIFEST ORDERING') &&
      reviewFlat.includes('111 passed, 0 failed') &&
      reviewFlat.includes('4,607 B exact match') &&
      reviewFlat.includes('NOT a substitute for the hosted advisors') &&
      live.includes('NOT a substitute for the hosted'))
    check('G5: the four Codex round-1 findings are each answered in the review record with their corrections, and the preserved narrowing is restated',
      reviewFlat.includes('REVERSED REVIEW/ADMISSION ORDER (finding 1)') &&
      reviewFlat.includes('INCOMPLETE MD5 FINGERPRINT (finding 2)') &&
      reviewFlat.includes('UNPROVABLE RELATIONSHIP COMPLETENESS (finding 3)') &&
      reviewFlat.includes('NONEMPTY-023 INCOMPATIBILITY (finding 4)') &&
      reviewFlat.includes("PRESERVED DECISION (adjudicated): only content_status = 'approved' may publish"))
    check('G6: lifecycle-safe phase boundary — the phase adds exactly five new paths (proposal, design record, implementation review record, this verifier, the live harness) and modifies NOTHING pre-existing; strict porcelain while uncommitted, adder-anchored once committed',
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
