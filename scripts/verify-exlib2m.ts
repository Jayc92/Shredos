// EXLIB-2M verifier — migration-027 apply-preparation (LOCAL-ONLY;
// the candidate is PREPARED, NOT APPLIED; hosted application remains
// Joseph/ChatGPT-only under a future explicit instruction).
//
// Proves the instruction's seventeen static requirements: exact
// source refs, tag, fingerprints, and phase inventory; exactly one
// numbered migration 027 and no 028; the reviewed proposal
// byte-identical to its promoted fingerprint; header-stripped
// executable-body byte-identity between migration 027 and the
// reviewed proposal; the four distinct NOLOGIN authorities with
// their exact ACLs and fixed search_paths; approval-before-one-time
// admission; the deterministic v2 SHA-256 manifest over the
// version-owned surface; review-frozen expected relationships; the
// protected atomic publication projection; approved-only
// publication with terminal revised/rejected; nonempty
// migration-023 compatibility; schema-only application; zero
// product/content/lifecycle change; narrow labeled anchored
// historical retargets; and the explicit prepared-not-applied
// posture. Performs NO hosted contact.
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
const shaText = (s: string): string => createHash('sha256').update(Buffer.from(s, 'utf8')).digest('hex')
const parseJsonl = (p: string): any[] => read(p).split('\n')
  .filter((l) => l.trim() && !l.trim().startsWith('#')).map((l) => JSON.parse(l))

const MIGRATION = 'supabase/migrations/027_exlib_catalog_content_schema.sql'
const PROPOSAL = 'docs/exlib2l-catalog-content-schema-proposal.sql'
const RECORD = 'docs/exlib2m-migration-027-apply-prep-record.md'
const VERIFIER = 'scripts/verify-exlib2m.ts'
const LIVE = 'scripts/verify-exlib2m-live.sh'
const SOURCE_TIP = '8289de5ef2f557fced97b9db88647b776a94b1bc'
const SOURCE_TREE = '3ef8c20908a708ea3c777f88a04e530f0ea9f071'
const TAG_2L_OBJ = '6301083c9d95caf46e3fe6bb61db9537ae04f1d1'
const PROPOSAL_SHA = '9a0505c8f2fea3f4330e7c80e22ffd8bc6867760b335a7468ea4587f0bd70553'
const MIGRATION_SHA = '90d53aaf8fd341dd99bab22b7d1ca280ec24b8ccee2a28efca6e835e0585a14f'
const BODY_SHA = 'ba28780f9544b1d3169938116d9babcc58bbcbe05218989e44bfae347793544f'
const PHASE_NEW = [MIGRATION, RECORD, VERIFIER, LIVE].sort()
const PHASE_MOD = [
  'scripts/verify-exlib1a.ts', 'scripts/verify-exlib1b1.ts', 'scripts/verify-exlib1b2.ts',
  'scripts/verify-exlib1b3.ts', 'scripts/verify-exlib1c0.ts', 'scripts/verify-exlib1c0a.ts',
  'scripts/verify-exlib1c0b.ts', 'scripts/verify-exlib1c0b2.ts', 'scripts/verify-exlib1c0b3.ts',
  'scripts/verify-exlib1c0b4.ts', 'scripts/verify-exlib1c0b5.ts', 'scripts/verify-exlib2a2b.ts',
  'scripts/verify-exlib2c-batch01.ts', 'scripts/verify-exlib2c-batch02.ts',
  'scripts/verify-exlib2c-batch03.ts', 'scripts/verify-exlib2c-batch04.ts',
  'scripts/verify-exlib2c-batch05.ts', 'scripts/verify-exlib2c-batch06.ts',
  'scripts/verify-exlib2d.ts', 'scripts/verify-exlib2f-application.ts',
  'scripts/verify-exlib2f-live.sh', 'scripts/verify-exlib2f.ts', 'scripts/verify-exlib2g.ts',
  'scripts/verify-exlib2h.ts', 'scripts/verify-exlib2i.ts', 'scripts/verify-exlib2j.ts',
  'scripts/verify-exlib2l-live.sh', 'scripts/verify-exlib2l.ts', 'scripts/verify-food-log-ux.ts',
  'scripts/verify-phase5b3.ts', 'scripts/verify-phase5b4.ts', 'scripts/verify-phase5b5.ts',
  'scripts/verify-ui1a.ts', 'scripts/verify-ui1b.ts', 'scripts/verify-ui2.ts',
  'scripts/verify-ui3.ts', 'scripts/verify-ui4.ts', 'scripts/verify-ui5a.ts',
  'scripts/verify-ui5b1a.ts', 'scripts/verify-ui5b1b.ts', 'scripts/verify-ui5b2.ts',
  'scripts/verify-ui6a.ts', 'scripts/verify-ui6b.ts', 'scripts/verify-ui6c.ts',
  'scripts/verify-ui7.ts'].sort()
const LABEL = 'RETARGET (EXLIB-2M migration-027 apply-prep)'

const mig = read(MIGRATION)
const migFlat = mig.replace(/\s+/g, ' ')
const migProse = mig.split('\n').map((l) => l.replace(/^\s*-- ?/, '')).join(' ').replace(/\s+/g, ' ')
const migCode = mig.split('\n').filter((l) => !l.trim().startsWith('--')).join('\n')
const rec = read(RECORD)
const recFlat = rec.replace(/\s+/g, ' ')
const live = read(LIVE)
const bodyOf = (s: string): string => {
  const ls = s.split('\n')
  const i = ls.findIndex((l) => l.trim() !== '' && !l.trim().startsWith('--'))
  return ls.slice(i).join('\n')
}
const frozenVsSource = (p: string): boolean =>
  execSync(`git hash-object "${p}"`, { encoding: 'utf8' }).trim() ===
  execSync(`git rev-parse "${SOURCE_TIP}:${p}"`, { encoding: 'utf8' }).trim()

async function main(): Promise<void> {
  console.log('EXLIB-2M verification (migration-027 apply-prep; PREPARED, NOT APPLIED; LOCAL-ONLY)')

  console.log('\nA. Source refs, inventory, and the candidate (proofs 1-4)')
  {
    check('A1: exact source refs — the EXLIB-2L reviewed-unapplied tag is the exact annotated object, peels to the promoted source tip (ancestor of HEAD) whose tree is exact',
      (() => {
        try {
          if (execSync('git rev-parse exlib2l-catalog-content-schema-proposal-reviewed-unapplied',
            { encoding: 'utf8' }).trim() !== TAG_2L_OBJ) return false
          if (execSync('git rev-parse exlib2l-catalog-content-schema-proposal-reviewed-unapplied^{}',
            { encoding: 'utf8' }).trim() !== SOURCE_TIP) return false
          execSync(`git merge-base --is-ancestor ${SOURCE_TIP} HEAD`, { stdio: 'pipe' })
          return execSync(`git rev-parse ${SOURCE_TIP}^{tree}`, { encoding: 'utf8' }).trim() === SOURCE_TREE
        } catch { return false }
      })())
    check('A2: exactly ONE numbered migration 027 exists with the exact candidate filename, NO 028, and exactly 27 numbered files forming the contiguous sequence 001-027 (proof 2)',
      (() => {
        const files = readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).sort()
        if (files.length !== 27) return false
        if (files.filter((f) => f.startsWith('027')).length !== 1) return false
        if (!files.includes('027_exlib_catalog_content_schema.sql')) return false
        if (files.some((f) => f.startsWith('028'))) return false
        const prefixes = files.map((f) => parseInt((f.match(/^(\d{3})_/) ?? [])[1], 10))
        return JSON.stringify(prefixes) === JSON.stringify(Array.from({ length: 27 }, (_, i) => i + 1))
      })())
    check('A3: the reviewed proposal remains byte-identical to its promoted fingerprint (78,468 B / 9a0505c8...) AND to its blob at the promoted tip — not moved, not deleted, not edited (proof 3)',
      readFileSync(PROPOSAL).length === 78468 && sha256(PROPOSAL) === PROPOSAL_SHA &&
      frozenVsSource(PROPOSAL) &&
      execSync('git ls-tree -r HEAD --name-only 2>/dev/null || true', { encoding: 'utf8' })
        .split('\n').filter((p) => /exlib2l.*\.sql$/i.test(p)).every((p) => p === PROPOSAL))
    check('A4: after removing only the truthful leading status headers, migration 027\'s executable SQL is BYTE-IDENTICAL to the reviewed proposal\'s executable SQL — recomputed, not pinned alone (63,180-byte body, sha ba28780f...; migration file 65,455 B / 90d53aaf...) (proof 4)',
      (() => {
        const mb = bodyOf(mig)
        const pb = bodyOf(read(PROPOSAL))
        return mb === pb && Buffer.byteLength(mb, 'utf8') === 63180 &&
          shaText(mb) === BODY_SHA &&
          readFileSync(MIGRATION).length === 65455 && sha256(MIGRATION) === MIGRATION_SHA &&
          mb.startsWith('BEGIN;')
      })())
  }

  console.log('\nB. The candidate retains every reviewed boundary (proofs 5-13)')
  {
    check('B1: four distinct NOLOGIN authorities with the exact grant separation — 6 GRANTs (loader x3, reviewer/admission/publication x1), 27 REVOKEs, pg_roles-guarded creations (proof 5)',
      (() => {
        const grants = mig.match(/^GRANT .*/gm) ?? []
        return ['exlib_catalog_loader', 'exlib_catalog_reviewer', 'exlib_catalog_admission', 'exlib_catalog_admin']
          .every((r) => migFlat.includes(`CREATE ROLE ${r} NOLOGIN`) &&
            migFlat.includes(`IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${r}')`)) &&
          grants.length === 6 &&
          grants.filter((g) => g.includes('TO exlib_catalog_loader')).length === 3 &&
          grants.filter((g) => g.includes('TO exlib_catalog_reviewer')).length === 1 &&
          grants.filter((g) => g.includes('TO exlib_catalog_admission')).length === 1 &&
          grants.filter((g) => g.includes('TO exlib_catalog_admin;')).length === 1 &&
          !grants.some((g) => /TO (PUBLIC|anon|authenticated)/.test(g)) &&
          !mig.includes('service' + '_role') &&
          (mig.match(/^REVOKE /gm) ?? []).length === 27
      })())
    check('B2: every privileged function retains its fixed search_path and exact ACL — 10/10 SECURITY DEFINER pinned, 13/13 functions pinned, helper REVOKEs intact, no JWT-metadata authorization (proof 6)',
      (() => {
        const defs = mig.split('CREATE OR REPLACE FUNCTION').slice(1)
        const secdef = defs.filter((d) => d.slice(0, 600).includes('SECURITY DEFINER'))
        return secdef.length === 10 &&
          secdef.every((d) => d.slice(0, 600).includes('SET search_path = public, pg_temp')) &&
          (mig.match(/SET search_path = public, pg_temp/g) ?? []).length === 13 &&
          migFlat.includes('REVOKE ALL ON FUNCTION exlib_content_admission_manifest(UUID) FROM PUBLIC, anon, authenticated;') &&
          migFlat.includes('REVOKE ALL ON FUNCTION exlib_content_admission_fingerprint(UUID) FROM PUBLIC, anon, authenticated;') &&
          !mig.includes('auth.jwt') && !mig.includes('request.jwt.claims') &&
          !mig.includes('app_metadata') && !mig.includes('user_metadata')
      })())
    check('B3: approval-before-admission and one-time admission remain exact — structural admission-order CHECK, one-way travel-alone transition, trigger fingerprint recomputation (proof 7)',
      migFlat.includes("CONSTRAINT exercise_catalog_content_admission_order_chk CHECK ( NOT import_admitted OR content_status <> 'pending' )") &&
      migFlat.includes('admission cannot precede human approval; only an approved version may be admitted') &&
      migFlat.includes('admission is one-way for an immutable version; it can be neither revoked nor re-recorded') &&
      migFlat.includes('the admission transition must travel alone') &&
      migFlat.includes('must equal the recomputed admission-manifest fingerprint; arbitrary hashes are rejected'))
    check('B4: manifest v2 remains deterministic SHA-256 over the reviewed version-owned surface — v2 literal, sha256 pipeline, no md5, hex-UTF8/day-offset/epoch/COLLATE-C determinism, no live-surface binding, distinct recorded source digest (proof 8)',
      (() => {
        const mfn = mig.slice(mig.indexOf('CREATE OR REPLACE FUNCTION exlib_content_admission_manifest'),
          mig.indexOf('CREATE OR REPLACE FUNCTION exlib_content_admission_fingerprint'))
        return mig.includes("'EXLIB-ADMISSION-MANIFEST v2'") &&
          migFlat.includes("SELECT encode(sha256(convert_to( public.exlib_content_admission_manifest(p_content_id), 'UTF8')), 'hex')") &&
          !/md5/i.test(migCode) &&
          (migCode.match(/ORDER BY [^)]*COLLATE "C"/g) ?? []).length === 3 &&
          mfn.includes("- DATE '1970-01-01'") && mfn.includes('extract(epoch FROM') &&
          !mfn.includes('public.exercise_catalog_relationships') &&
          migFlat.includes("AND admitted_source_sha256 ~ '^[0-9a-f]{64}" + "$'") &&
          migFlat.includes('must be a 64-character lowercase hex SHA-256 of the exact reviewed repository artifact')
      })())
    check('B5: expected relationships remain version-owned and review-frozen (proof 9)',
      migFlat.includes('PRIMARY KEY (content_id, relation, to_logical_id)') &&
      migFlat.includes('expected relationships freeze with the reviewed payload; corrections require a new content version') &&
      migFlat.includes('rows are immutable; delete and re-insert while the version is pending') &&
      migFlat.includes('cannot expect a relationship to its own identity'))
    check('B6: the live relationship surface remains a protected atomic publication projection — sentinel-gated trigger, atomic retire/delete/project/publish in publish_catalog_content, structural equality+freshness gate at publication (proof 10)',
      mig.includes('exlib_protect_relationship_projection') &&
      migFlat.includes("current_setting('exlib.relationship_projection_identity', true) IS DISTINCT FROM COALESCE(NEW.from_logical_id, OLD.from_logical_id)::text") &&
      migFlat.includes("PERFORM set_config('exlib.relationship_projection_identity', p_logical_id::text, true);") &&
      migFlat.includes('DELETE FROM public.exercise_catalog_relationships WHERE from_logical_id = p_logical_id;') &&
      migFlat.includes('INSERT INTO public.exercise_catalog_relationships (from_logical_id, to_logical_id, relation) SELECT p_logical_id, e.to_logical_id, e.relation FROM public.exercise_catalog_content_expected_relationships e WHERE e.content_id = p_content_id;') &&
      migFlat.includes("a required relationship is missing at publication; the version''s expected relationship set must be projected exactly") &&
      migFlat.includes('import admission is STALE - a bound surface changed after admission; publication is refused'))
    check('B7: approved remains the only publishable review result, and revised/rejected remain terminal and non-publishable (proofs 11-12)',
      migFlat.includes("publication_status <> 'published' OR (content_status = 'approved' AND import_admitted)") &&
      migFlat.includes('only approved content can be published; pending, revised, and rejected content can never be published') &&
      migFlat.includes('approved -> revised|rejected); re-approval requires a NEW content version') &&
      migProse.includes('re-approval impossible'))
    check('B8: nonempty migration-023 compatibility remains unchanged — nullable discovery metadata, originals-require-all-four CHECK, conditional source constraint, nothing fabricated (proof 13)',
      ['movement_pattern', 'training_role', 'difficulty', 'availability']
        .every((c) => migFlat.includes(`ADD COLUMN ${c} TEXT CHECK`) &&
          !migFlat.includes(`ADD COLUMN ${c} TEXT NOT NULL`)) &&
      migFlat.includes('ADD CONSTRAINT exercise_catalog_discovery_metadata_chk') &&
      migFlat.includes('ADD CONSTRAINT exercise_catalog_provenance_sources_chk') &&
      migProse.includes('a legitimate nonempty 023 catalog cannot truthfully supply these values for its existing external rows, and inventing placeholders is forbidden'))
  }

  console.log('\nC. Schema-only application; nothing else changed (proofs 14-15)')
  {
    check('C1: migration application creates schema only — one explicit transaction, NO line-leading DML outside function bodies, and the live suite proves the zero-state and 023-026 delivery/rollback preservation (proof 14)',
      (() => {
        if (!/^BEGIN;$/m.test(mig) || !/^COMMIT;$/m.test(mig)) return false
        const stripped = mig
          .replace(/\$do\$[\s\S]*?\$do\$/g, '')
          .replace(/\$\$[\s\S]*?\$\$/g, '')
          .split('\n').filter((l) => !l.trim().startsWith('--')).join('\n')
        return !/^\s*(INSERT|UPDATE|DELETE|COPY|TRUNCATE)\b/im.test(stripped) &&
          live.includes('D5: migration application alone creates NO content, relationship, expected-relationship, run, membership, review decision, admission, publication, or seal state') &&
          live.includes('E8: unchanged migration-026 DELIVERY works on the HISTORICAL external rows') &&
          live.includes('B4: migrations 001-027 applied cleanly in order to') &&
          live.includes('A5: DRIFT GATE') &&
          live.includes('A7: this suite sources the docs proposal EXACTLY ONCE')
      })())
    check('C2: no Plank content, review, eligibility, seed, inventory, ledger, runtime, API, UI, dependency, or configuration change — the frozen set is blob-identical to the promoted tip and the phase touches only migrations-027/docs/scripts paths (proof 15)',
      (() => {
        for (const p of ['docs/exlib2g-plank-content.jsonl',
          'docs/exlib2h-plank-content-review-form-completed.json',
          'docs/exlib2i-plank-human-review-decision-record.md',
          'docs/exlib2j-plank-import-eligibility-admission-record.md',
          'src/lib/supabase/seed-exercises.ts', 'docs/exlib2b-release1-inventory.jsonl',
          'docs/exlib1b1-review-ledger.jsonl', 'docs/exlib1c0a-equipment-resolution.jsonl',
          'package.json']) {
          if (!frozenVsSource(p)) return false
        }
        const cur = parseJsonl('docs/exlib2g-plank-content.jsonl')[0]
        if (!(cur.import_eligible === true && cur.content_review.status === 'approved' &&
          cur.review_status === 'proposed')) return false
        const range = execSync(`git diff --name-only ${SOURCE_TIP}..HEAD`, { encoding: 'utf8' })
          .split('\n').filter(Boolean)
        if (range.some((p) => !/^(docs\/|scripts\/verify-|supabase\/migrations\/027_)/.test(p))) return false
        return !execSync('git status --porcelain', { encoding: 'utf8' })
          .split('\n').filter(Boolean)
          .some((l) => /^(src\/|package|next\.config|tsconfig|\.env|public\/)/.test(l.slice(3)))
      })())
  }

  console.log('\nD. Historical-verifier lifecycle and the prepared posture (proofs 16-17)')
  {
    check('D1: every retargeted historical verifier is narrow, LABELED, and present — all 45 modified files carry the exact RETARGET (EXLIB-2M migration-027 apply-prep) label (proof 16)',
      PHASE_MOD.every((p) => read(p).includes(LABEL)))
    check('D2: the EXLIB-2L static verifier remains capable of proving the promoted proposal-only milestone — its no-027/proposal-only/phase claims are ANCHORED to the exact promoted tip 8289de5, not weakened',
      (() => {
        const l2 = read('scripts/verify-exlib2l.ts')
        return l2.includes("const PROMOTED_TIP_2L = '8289de5ef2f557fced97b9db88647b776a94b1bc'") &&
          l2.includes('git ls-tree ${PROMOTED_TIP_2L} supabase/migrations/') &&
          l2.includes('${SOURCE_TIP}..${PROMOTED_TIP_2L}') &&
          l2.includes(LABEL)
      })())
    check('D3: the EXLIB-2L live suite still applies migrations 001-026 and then the reviewed DOCS proposal exactly once — it structurally EXCLUDES 027 and can never apply both 027 and the proposal',
      (() => {
        const l2 = read('scripts/verify-exlib2l-live.sh')
        return l2.includes('case "$f" in supabase/migrations/02[7-9]_*) continue;; esac') &&
          l2.includes('-f "$PROPOSAL"') &&
          l2.includes(LABEL) &&
          l2.includes('never both 027 and the proposal')
      })())
    check('D4: the migration header states every required truthful fact — apply-prep candidate, reviewed source commit and proposal SHA-256, prepared for later explicit hosted application, NOT APPLIED during EXLIB-2M, Joseph/ChatGPT-only, schema-and-authorities-only, loads nothing, performs no lifecycle act, EXLIB-2K stays deferred (proof 17)',
      mig.includes('EXLIB-2M MIGRATION-027 APPLY-PREP CANDIDATE') &&
      mig.includes(SOURCE_TIP) &&
      mig.includes(PROPOSAL_SHA) &&
      migProse.includes('PREPARED FOR A LATER EXPLICIT HOSTED APPLICATION') &&
      migProse.includes('NOT APPLIED during EXLIB-2M') &&
      migProse.includes('Joseph/ChatGPT-only') &&
      migProse.includes('Migration 027 creates SCHEMA AND LIFECYCLE AUTHORITIES ONLY') &&
      migProse.includes('it loads NO identities, snapshots, anatomy, aliases, content, relationships, runs, or membership') &&
      migProse.includes('it performs NO human review, admission, publication, approval, seal, revocation, delivery, seed edit, or inventory flip') &&
      migProse.includes('EXLIB-2K (Plank catalog load) remains DEFERRED until migration 027 is reviewed, applied, and evidenced'))
    check('D5: the apply-prep record documents the gate (including the full tag-object SHA), the exact transformation, every classification, the boundaries, the totals, and the explicit prepared-not-applied no-hosted-contact posture',
      rec.includes(TAG_2L_OBJ) &&
      rec.includes(SOURCE_TIP) &&
      recFlat.includes('exactly its first 253 lines') &&
      rec.includes(BODY_SHA) &&
      rec.includes(MIGRATION_SHA) &&
      recFlat.includes('CLASS 2') && recFlat.includes('CLASS 3') && recFlat.includes('CLASS 4') &&
      recFlat.includes('SEQUENCE EXTENSION') && recFlat.includes('TIP ANCHORING') &&
      recFlat.includes('Forty-five verifier files were touched; every one carries the label') &&
      recFlat.includes('151/0') &&
      recFlat.includes('TWO-DATABASE EQUIVALENCE') &&
      recFlat.includes('No semantic difference attributable to apply-prep') &&
      recFlat.includes('Migration 027 exists ONLY as a reviewed local candidate file') &&
      recFlat.includes('NOT claimed as applied anywhere') &&
      recFlat.includes('No hosted service was contacted at any point in this milestone'))
    check('D6: lifecycle-safe phase boundary — the phase adds exactly four new paths (the 027 candidate, this record, this verifier, the live harness) and modifies exactly the 45 labeled verifiers; strict porcelain while uncommitted, adder-anchored once committed (proof 1, inventory half)',
      (() => {
        try {
          const inHead = (() => {
            try { execSync(`git cat-file -e HEAD:${RECORD}`, { stdio: 'pipe' }); return true } catch { return false }
          })()
          if (!inHead) {
            const entries = execSync('git status --porcelain', { encoding: 'utf8' })
              .split('\n').filter(Boolean).map((l) => l.trim()).sort()
            const expected = [...PHASE_NEW.map((f) => `?? ${f}`), ...PHASE_MOD.map((f) => `M ${f}`)].sort()
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
          return JSON.stringify(range) === JSON.stringify([...PHASE_NEW, ...PHASE_MOD].sort())
        } catch { return false }
      })())
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
