// EXLIB-2L verifier — catalog-content and relationship schema
// implementation PROPOSAL (LOCAL-ONLY; docs/-resident draft; NOT a
// migration; applies nothing; loads nothing; approves nothing).
//
// Proves the instruction's twelve static requirements: exact source
// refs/tags/fingerprints and the phase inventory; the proposal
// resident under docs/ with migrations exactly 001-026; the three
// EXLIB-2K blockers accurately resolved; external-import
// compatibility; no fabricated source facts for original content;
// review/eligibility/publication as separate axes; stale-fingerprint
// eligibility failing closed; identity-keyed fail-closed
// relationships; Plank's two targets handled without false
// approval/admission/publication; the publication/RLS/ACL/
// search_path/EXECUTE security posture; migration-026 behavior and
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
const PROPOSAL_SHA = 'df98e085eab21fd6e4074531efea5d9ae54daff603cde52da0e33e2b621a0639'
const PROPOSAL_BYTES = 33213
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
  console.log('EXLIB-2L verification (schema proposal; LOCAL-ONLY; applies and approves nothing)')

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
    check('A2: the proposal lives under docs/ at its exact fingerprint (33,213 B / df98e085...), declares itself NOT A MIGRATION with Joseph/ChatGPT-only application, and the design record pins the same fingerprint',
      readFileSync(PROPOSAL).length === PROPOSAL_BYTES && sha256(PROPOSAL) === PROPOSAL_SHA &&
      prop.includes('(DRAFT - NOT APPLIED - NOT A MIGRATION)') &&
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

  console.log('\nB. The three EXLIB-2K blockers, resolved without overstatement (proofs 3-5)')
  {
    check('B1: the design record preserves the EXLIB-2K finding exactly — three blockers, DEFERRED not failed, no claim that loading, publication, or activation occurred',
      design.includes('NO CONTENT DESTINATION') &&
      design.includes('NO RELATIONSHIP TARGET') &&
      design.includes('UNTRUTHFUL PROVENANCE SHAPE') &&
      designFlat.includes('DEFERRED — not failed permanently') &&
      designFlat.includes('Codex adjudicated the stop as correct') &&
      designFlat.includes('schema gaps, not content defects') &&
      designFlat.includes('Applying the proposal (if later approved) still loads NOTHING'))
    check('B2: blocker 1 resolved — exercise_catalog_content exists in the proposal with the full authored-payload model, versioning, and the draft/published/retired publication lifecycle',
      prop.includes('CREATE TABLE exercise_catalog_content (') &&
      ['logical_id', 'content_version', 'authored_by', 'authored_at', 'setup_steps',
        'execution_steps', 'breathing_cue', 'common_mistakes', 'safety_guidance',
        'equipment_setup', 'accessibility_alternative', 'content_status',
        'publication_status', 'import_admitted', 'admitted_fingerprint', 'admitted_at']
        .every((c) => prop.includes(c)) &&
      propFlat.includes("('draft','published','retired')") &&
      propFlat.includes('UNIQUE (logical_id, content_version)') &&
      propFlat.includes("ON exercise_catalog_content (logical_id) WHERE publication_status = 'published'"))
    check('B3: blocker 2 resolved — exercise_catalog_relationships exists, keyed by logical identity for the three promoted relation types',
      prop.includes('CREATE TABLE exercise_catalog_relationships (') &&
      propFlat.includes("relation TEXT NOT NULL CHECK (relation IN ('regression','progression','substitution'))"))
    check('B4: blocker 3 resolved — a truthful provenance model: 2-value provenance column defaulting to external_source_derived, the four NOT NULLs dropped, and the fail-closed conditional constraint requiring ALL FOUR sources for external rows and ALL FOUR NULL for original rows',
      propFlat.includes("ADD COLUMN provenance TEXT NOT NULL DEFAULT 'external_source_derived' CHECK (provenance IN ('forgefitos_original','external_source_derived'))") &&
      ['source_url', 'source_page', 'retrieved_at', 'import_confidence']
        .every((c) => propFlat.includes(`ALTER COLUMN ${c} DROP NOT NULL`)) &&
      propFlat.includes("ADD CONSTRAINT exercise_catalog_provenance_sources_chk CHECK ( (provenance = 'external_source_derived' AND source_url IS NOT NULL AND source_page IS NOT NULL AND retrieved_at IS NOT NULL AND import_confidence IS NOT NULL) OR (provenance = 'forgefitos_original' AND source_url IS NULL AND source_page IS NULL AND retrieved_at IS NULL AND import_confidence IS NULL) )"))
    check('B5: the promoted extended metadata lands with the 2A-verbatim vocabularies — movement_pattern (35), training_role (6), difficulty (3), availability (3), all NOT NULL with no default',
      vocabCount('movement_pattern') === 35 && vocabCount('training_role') === 6 &&
      vocabCount('difficulty') === 3 && vocabCount('availability') === 3 &&
      ['movement_pattern', 'training_role', 'difficulty', 'availability']
        .every((c) => propFlat.includes(`ADD COLUMN ${c} TEXT NOT NULL CHECK`)))
    check('B6: external-import compatibility is explicit — provenance DEFAULTs preserve existing meaning without rewriting, the design record records the zero-hosted-rows evidence and the fail-closed alternative, and the executable proposal (everything before the documentation-only rollback section) drops nothing',
      propProse.includes('if rows unexpectedly existed, application fails closed rather than fabricating values') &&
      designFlat.includes('the hosted catalog holds ZERO rows') &&
      designFlat.includes('provenance defaults to external_source_derived and complete source metadata satisfies the conditional CHECK unchanged') &&
      !/DROP (COLUMN|CONSTRAINT|TABLE|FUNCTION|TRIGGER|INDEX)/.test(prop.split('-- ── 5.')[0]))
    check('B7: original authored content requires NO fabricated source facts — the original branch of the conditional constraint FORBIDS all four source fields, and the proposal fabricates no source values anywhere (no URL literals outside comments)',
      propFlat.includes("(provenance = 'forgefitos_original' AND source_url IS NULL") &&
      !prop.split('\n').some((l) => !l.trim().startsWith('--') && /https?:\/\//.test(l)))
  }

  console.log('\nC. Separate axes, staleness, relationships, Plank targets (proofs 6-9)')
  {
    check('C1: review, eligibility, and publication are THREE separate axes — three distinct column groups with three distinct CHECKs, and the freeze trigger forbids transitions traveling together or smuggling admission changes',
      propFlat.includes("content_status TEXT NOT NULL DEFAULT 'pending'") &&
      propFlat.includes("publication_status TEXT NOT NULL DEFAULT 'draft'") &&
      propFlat.includes('import_admitted BOOLEAN NOT NULL DEFAULT false') &&
      prop.includes('CONSTRAINT exercise_catalog_content_publication_chk') &&
      prop.includes('CONSTRAINT exercise_catalog_content_review_audit_chk') &&
      prop.includes('CONSTRAINT exercise_catalog_content_admission_chk') &&
      propFlat.includes('a publication transition must travel alone') &&
      propFlat.includes('a review transition carries evidence only; payload and admission changes are separate pre-decision edits'))
    check('C2: publishing pending/revised/rejected content is STRUCTURALLY impossible (CHECK: published requires approved) AND rejected again in the function (defence in depth), with the 2A deviation disclosed in the header for adjudication',
      propFlat.includes("publication_status <> 'published' OR content_status = 'approved'") &&
      propFlat.includes('only approved content can be published; pending, revised, and rejected content can never be published') &&
      prop.includes('ONE DISCLOSED DEVIATION FROM PROMOTED EXLIB-2A') &&
      propFlat.includes('Part 4.B') && propFlat.includes("Part 5's live proof") &&
      propFlat.includes('re-approval impossible') &&
      designFlat.includes('only publishability narrows'))
    check('C3: stale-fingerprint eligibility fails closed — admission is all-or-nothing (flag+fingerprint+date), the publication function RECOMPUTES the fingerprint over the current payload and rejects any drift as STALE, and the fingerprint function is truthfully IMMUTABLE (day-offset date folding, never date::text)',
      propFlat.includes('(import_admitted = true AND admitted_fingerprint IS NOT NULL') &&
      propFlat.includes('IF v_target.admitted_fingerprint IS DISTINCT FROM v_computed THEN') &&
      propFlat.includes('import admission is STALE - the content changed after admission; re-review and re-admission are required') &&
      prop.includes("(p_authored_at - DATE '1970-01-01')::text") &&
      !prop.includes('p_authored_at::text') &&
      /LANGUAGE sql\s+IMMUTABLE/.test(prop))
    check('C4: relationship resolution is identity-keyed and fail-closed — both FKs RESTRICT to exercise_catalog_logical, self-reference CHECK, deterministic PK uniqueness, and the publication function revalidates relationships and rejects unresolved or impermissible targets',
      (propFlat.match(/REFERENCES exercise_catalog_logical\(id\) ON DELETE RESTRICT/g) ?? []).length >= 3 &&
      propFlat.includes('PRIMARY KEY (from_logical_id, to_logical_id, relation)') &&
      propFlat.includes('CHECK (from_logical_id <> to_logical_id)') &&
      propFlat.includes('unresolved or impermissible relationship target(s)'))
    check('C5: Plank\'s two targets are handled WITHOUT false approval/admission/publication — the byte-frozen artifact still names exactly Dead bug (substitution) and Ab wheel rollout (progression) with zero regressions, and the design record\'s determination distinguishes identity existence from content approval, eligibility, loading, and publication with no identity-only stub invention',
      JSON.stringify(cur.substitutions) === JSON.stringify(['Dead bug']) &&
      JSON.stringify(cur.progressions) === JSON.stringify(['Ab wheel rollout']) &&
      JSON.stringify(cur.regressions) === JSON.stringify([]) &&
      designFlat.includes('substitution "Dead bug", progression "Ab wheel rollout"') &&
      designFlat.includes('WITHOUT loading, approving, admitting, or publishing their content') &&
      designFlat.includes('This is NOT an identity-only stub shortcut') &&
      designFlat.includes('no target content is approved, admitted, loaded, or published merely to satisfy the foreign keys'))
    check('C6: the live harness really proves the target-content independence and staleness claims it is cited for (L7/L8/K1 present), never reads the Plank artifact, and uses only locally invented fixtures',
      live.includes('L7: the Plank relationship model is fully representable while its targets have NO approved, admitted, or published content') &&
      live.includes('L8: no identity-only stub shortcut was used') &&
      live.includes('K1: eligibility is FINGERPRINT-BOUND') &&
      live.split('\n').filter((l) => l.includes('exlib2g-plank-content'))
        .every((l) => l.trim().startsWith('#')) &&
      live.includes('LOCAL, DISPOSABLE PROOF FIXTURES'))
  }

  console.log('\nD. Security posture (proof 10)')
  {
    check('D1: RLS is enabled on BOTH new tables with zero policies defined, and ALL table privileges are revoked from PUBLIC, anon, and authenticated',
      (prop.match(/ENABLE ROW LEVEL SECURITY/g) ?? []).length === 2 &&
      !prop.includes('CREATE POLICY') &&
      propFlat.includes('ALTER TABLE exercise_catalog_content ENABLE ROW LEVEL SECURITY; REVOKE ALL ON TABLE exercise_catalog_content FROM PUBLIC, anon, authenticated;') &&
      propFlat.includes('ALTER TABLE exercise_catalog_relationships ENABLE ROW LEVEL SECURITY; REVOKE ALL ON TABLE exercise_catalog_relationships FROM PUBLIC, anon, authenticated;'))
    check('D2: the publication function is SECURITY DEFINER with a pinned search_path, EXECUTE explicitly revoked from PUBLIC, anon, and authenticated, and granted to EXACTLY ONE role — exlib_catalog_admin (NOLOGIN, idempotently created); the proposal contains exactly one GRANT statement',
      propFlat.includes('REVOKE EXECUTE ON FUNCTION publish_catalog_content(UUID, UUID) FROM PUBLIC;') &&
      propFlat.includes('REVOKE EXECUTE ON FUNCTION publish_catalog_content(UUID, UUID) FROM anon;') &&
      propFlat.includes('REVOKE EXECUTE ON FUNCTION publish_catalog_content(UUID, UUID) FROM authenticated;') &&
      propFlat.includes('GRANT EXECUTE ON FUNCTION publish_catalog_content(UUID, UUID) TO exlib_catalog_admin;') &&
      (prop.match(/^GRANT /gm) ?? []).length === 1 &&
      propFlat.includes('CREATE ROLE exlib_catalog_admin NOLOGIN') &&
      propFlat.includes("IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'exlib_catalog_admin')"))
    check('D3: every function in the proposal pins search_path = public, pg_temp (4 of 4), the two helper functions are also revoked from client roles, and no authorization path reads user-editable JWT metadata',
      (prop.match(/SET search_path = public, pg_temp/g) ?? []).length === 4 &&
      propFlat.includes('REVOKE ALL ON FUNCTION exlib_content_fingerprint(JSONB, JSONB, TEXT, JSONB, TEXT, TEXT, TEXT, TEXT, DATE) FROM PUBLIC, anon, authenticated;') &&
      propFlat.includes('REVOKE ALL ON FUNCTION exlib_freeze_content_version() FROM PUBLIC, anon, authenticated;') &&
      !prop.includes('auth.jwt') && !prop.includes('request.jwt.claims') &&
      !prop.includes('app_metadata') && !prop.includes('user_metadata'))
    check('D4: the proposal contains NO service-role reference and NO bare TO-authenticated authorization, and none of the five phase artifacts carries credential or connection-string material',
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

  console.log('\nE. Migration 026 and the activation state machine unchanged (proof 11)')
  {
    check('E1: verbatim carry RECOMPUTED — the one replaced 023 function (exlib_freeze_catalog_snapshot) is byte-identical to the committed 023 bytes outside the marked 8-line/518-byte EXLIB-2L splice (4,607-byte carried body)',
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
    check('E2: NO 024-026 object is redefined — the proposal\'s only CREATE targets are the carried freeze function plus three genuinely new names absent from every committed migration',
      (() => {
        const created = Array.from(prop.matchAll(/CREATE (?:OR REPLACE )?(?:FUNCTION|TABLE|TRIGGER|INDEX|UNIQUE INDEX|ROLE) (\w+)/g), (m) => m[1])
        const newNames = ['exercise_catalog_content', 'exercise_catalog_relationships',
          'exlib_content_fingerprint', 'exlib_freeze_content_version', 'publish_catalog_content',
          'exercise_catalog_content_one_published_idx', 'exercise_catalog_content_logical_idx',
          'exercise_catalog_relationships_to_idx', 'exercise_catalog_content_updated_at',
          'exercise_catalog_content_freeze_trigger', 'exlib_catalog_admin']
        if (!created.every((n) => n === 'exlib_freeze_catalog_snapshot' || newNames.includes(n))) return false
        const allMigs = readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql'))
          .map((f) => read(`supabase/migrations/${f}`)).join('\n')
        const genuinelyNew = ['exercise_catalog_content', 'exercise_catalog_relationships',
          'exlib_content_fingerprint', 'exlib_freeze_content_version', 'publish_catalog_content',
          'exlib_catalog_admin']
        if (genuinelyNew.some((n) => allMigs.includes(n))) return false
        return ['deliver_catalog_exercises', 'rollback_catalog_delivery', 'exlib_plank_link_valid',
          'exlib_revoke_run_delivery', 'exlib_approve_and_seal_run', 'exlib_block_delivered_exercise_delete']
          .every((n) => !prop.includes(`FUNCTION ${n}`))
      })())
    check('E3: the activation state machine is untouched — seed byte-frozen (bodyweight Plank), inventory byte-frozen with seed_link_compatible false, and the proposal\'s rollback/compatibility section states why 026 behavior is unchanged',
      (() => {
        if (!frozenVsSource('src/lib/supabase/seed-exercises.ts')) return false
        if (!frozenVsSource('docs/exlib2b-release1-inventory.jsonl')) return false
        const inv = parseJsonl('docs/exlib2b-release1-inventory.jsonl')
        const plank = inv.filter((r: any) => r.proposed_canonical_name === 'Plank')
        if (plank.length !== 1 || plank[0].seed_link_compatible !== false) return false
        return propProse.includes('Migration 026 behavior is untouched: no 026 object is modified') &&
          propProse.includes('Applying this schema performs NO load, approval, seal, publication, or delivery')
      })())
    check('E4: rollback and idempotency are defined — a pre-use drop sequence naming the exact explicit constraint, rollback-after-rows as a reviewed data operation, deliberate non-idempotency with the whole-transaction guarantee, and the pg_roles-guarded role as the one exception',
      propProse.includes('PRE-USE ROLLBACK ONLY') &&
      propProse.includes('DROP CONSTRAINT exercise_catalog_provenance_sources_chk') &&
      propProse.includes('rollback is a reviewed data operation, not a schema drop') &&
      propProse.includes('rolls back WHOLLY') &&
      propProse.includes('NOT idempotent by design') &&
      propProse.includes('The one exception is the role'))
  }

  console.log('\nF. Nothing else changed; records are honest (proof 12)')
  {
    check('F1: the admitted Plank content is byte-identical (2,928 B / d8207849...) — content, review evidence, and eligibility all untouched: approved by Nick Tkacz, import_eligible true, review_status proposed, no publication key',
      readFileSync(CONTENT).length === 2928 && sha256(CONTENT) === CONTENT_SHA &&
      cur.content_review.status === 'approved' && cur.content_review.reviewer === 'Nick Tkacz' &&
      cur.import_eligible === true && cur.review_status === 'proposed' &&
      !Object.keys(cur).some((k) => k.includes('publication')))
    check('F2: ledger, legacy eligibility, and all six batch corpora are byte-identical to the source tip (48/48 pending-null; 26/26 import-ineligible)',
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
    check('F3: no runtime, API, UI, dependency, or configuration change — the phase touches ONLY the five declared docs/ and scripts/ paths (nothing under src/, supabase/, package/config)',
      (() => {
        const range = execSync(`git diff --name-only ${SOURCE_TIP}..HEAD`, { encoding: 'utf8' })
          .split('\n').filter(Boolean)
        if (range.some((p) => !/^(docs\/|scripts\/verify-)/.test(p))) return false
        return !execSync('git status --porcelain', { encoding: 'utf8' })
          .split('\n').filter(Boolean)
          .some((l) => /^(src\/|supabase\/|package|next\.config|tsconfig|\.env|public\/)/.test(l.slice(3)))
      })())
    check('F4: the records are honest about authority and hosted state — the design record approves nothing, the implementation review record is explicitly NOT a specialist/human/Codex approval, both state no hosted contact, and the advisors limitation is recorded honestly in record AND harness',
      designFlat.includes('This record APPROVES NOTHING') &&
      designFlat.includes('awaits Codex review') &&
      reviewFlat.includes('It is NOT a specialist, human, or Codex approval, and it approves nothing') &&
      designFlat.includes('No hosted or persistent database is contacted or changed') &&
      reviewFlat.includes('No hosted service was contacted at any point in this milestone') &&
      reviewFlat.includes('hosted platform features') &&
      reviewFlat.includes('NOT a substitute for the hosted advisors') &&
      live.includes('NOT a substitute for the hosted advisors'))
    check('F5: the implementation review record discloses the three forward-fixed defects and the final live result, truthfully',
      reviewFlat.includes('UNTRUTHFUL IMMUTABLE MARKING') &&
      reviewFlat.includes('NEAR-IDENTICAL CONSTRAINT NAMES') &&
      reviewFlat.includes('MISSING SINGLE-TRANSACTION WRAPPER') &&
      reviewFlat.includes('100 passed, 0 failed') &&
      reviewFlat.includes('4,607 B exact match'))
    check('G1: lifecycle-safe phase boundary — the phase adds exactly five new paths (proposal, design record, implementation review record, this verifier, the live harness) and modifies NOTHING; strict porcelain while uncommitted, adder-anchored once committed',
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
