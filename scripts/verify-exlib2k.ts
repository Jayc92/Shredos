// EXLIB-2K verifier — Plank catalog-load preparation (LOCAL-ONLY;
// the package is PREPARED, NOT EXECUTED; hosted execution remains a
// later explicit Joseph/ChatGPT-path act).
//
// Proves the instruction's thirteen static requirements: exact
// source refs, tags, and fingerprints; migration 027 applied and
// evidenced but byte-unchanged; the load package resident under
// docs/ (never supabase/migrations); the exact admitted-Plank
// payload binding RE-DERIVED from the artifact (every dollar-quoted
// literal in the package parsed and compared to the artifact byte
// for byte); the exact relationship-target derivation with no
// fabrication (identity-only stubs, both names artifact-verbatim and
// inventory-present, no target content); loader-only authority; one
// explicit atomic transaction; the exact identities, snapshot,
// content version, and expected set pinned in the package's own
// postconditions; zero reviewer/admission/admin authority calls;
// zero run/seal/revocation/publication/delivery actions; zero
// seed/inventory/eligibility/ledger/runtime/config change; the
// explicit prepared-not-executed posture; and the exact phase
// inventory with the labeled historical-verifier lifecycle.
// Correction findings (section E): the lock-serialized fresh-load
// gate (deterministic coverage and order), the package-internal
// three-claim postconditions with the corrected claim-count wording,
// and the intended-vs-database-proven target-identity semantics with
// the mandatory target-snapshot gate.
// Hosted-authority correction (section F): the preserved failed-
// hosted-attempt evidence, the posture-gated transaction-contained
// elevation with exact restoration, the dedicated hosted-membership-
// semantics live checks on the non-superuser fixture, and the
// design-selection record.
// Performs NO hosted contact.
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

const PACKAGE = 'docs/exlib2k-plank-catalog-load-package.sql'
const RECORD = 'docs/exlib2k-plank-catalog-load-prep-record.md'
const VERIFIER = 'scripts/verify-exlib2k.ts'
const LIVE = 'scripts/verify-exlib2k-live.sh'
const ARTIFACT = 'docs/exlib2g-plank-content.jsonl'
const SOURCE_TIP = '3a1ac3b0bf2706ae9d1d03cc55a443b8bd4a1876'
const SOURCE_TREE = '36f43034b1efa111cfaf2854acd3c06bc416b750'
const TAG_OBJ = '8a4ee8a8395e21aabe2ccc7bc2138ddb5eafe280'
const ARTIFACT_SHA = 'd82078490efa9ef13e128e7b7b742fbda8ea9e74e32382252d96c326c679d752'
const MIGRATION_SHA = '90d53aaf8fd341dd99bab22b7d1ca280ec24b8ccee2a28efca6e835e0585a14f'
const PL = 'e21b2c00-0000-4000-a000-000000000001'
const DBU = 'e21b2c00-0000-4000-a000-000000000002'
const AW = 'e21b2c00-0000-4000-a000-000000000003'
const CV = 'e21b2c00-0000-4000-a000-000000000101'
const LABEL = 'RETARGET (EXLIB-2K catalog-load preparation)'
const PHASE_NEW = [PACKAGE, RECORD, VERIFIER, LIVE].sort()
const PHASE_MOD = ['scripts/verify-exlib2i.ts', 'scripts/verify-exlib2j.ts'].sort()

const pkg = read(PACKAGE)
const pkgFlat = pkg.replace(/\s+/g, ' ')
// comment prose flattened WITHOUT the leading "--" markers, so phrases
// that wrap across comment lines can be matched exactly
const pkgProse = pkg.split('\n').map((l) => l.replace(/^\s*-- ?/, '')).join(' ').replace(/\s+/g, ' ')
const rec = read(RECORD)
const recFlat = rec.replace(/\s+/g, ' ')
const live = read(LIVE)
const art = parseJsonl(ARTIFACT)[0]
const tagged = (tag: string): string => {
  const m = pkg.match(new RegExp(`\\$${tag}\\$([\\s\\S]*?)\\$${tag}\\$`))
  return m ? m[1] : `<<missing $${tag}$>>`
}
const frozenVsSource = (p: string): boolean =>
  execSync(`git hash-object "${p}"`, { encoding: 'utf8' }).trim() ===
  execSync(`git rev-parse "${SOURCE_TIP}:${p}"`, { encoding: 'utf8' }).trim()

async function main(): Promise<void> {
  console.log('EXLIB-2K verification (Plank catalog-load preparation; PREPARED, NOT EXECUTED; LOCAL-ONLY)')

  console.log('\nA. Source refs, applied schema, and residency (proofs 1-3)')
  {
    check('A1: exact source refs — the application-evidence tag is the exact annotated object, peels to the promoted source tip (ancestor of HEAD) whose tree is exact, and the admitted artifact holds its promoted fingerprint (proof 1)',
      (() => {
        try {
          if (execSync('git rev-parse exlib2m-migration-027-application-evidence-stable',
            { encoding: 'utf8' }).trim() !== TAG_OBJ) return false
          if (execSync('git rev-parse exlib2m-migration-027-application-evidence-stable^{}',
            { encoding: 'utf8' }).trim() !== SOURCE_TIP) return false
          execSync(`git merge-base --is-ancestor ${SOURCE_TIP} HEAD`, { stdio: 'pipe' })
          if (execSync(`git rev-parse ${SOURCE_TIP}^{tree}`, { encoding: 'utf8' }).trim() !== SOURCE_TREE) return false
        } catch { return false }
        return readFileSync(ARTIFACT).length === 2928 && sha256(ARTIFACT) === ARTIFACT_SHA
      })())
    check('A2: migration 027 is applied and evidenced but byte-UNCHANGED — its exact fingerprint holds, it is blob-identical to the source tip, and the promoted application record still pins the hosted-history entry (proof 2)',
      readFileSync('supabase/migrations/027_exlib_catalog_content_schema.sql').length === 65455 &&
      sha256('supabase/migrations/027_exlib_catalog_content_schema.sql') === MIGRATION_SHA &&
      frozenVsSource('supabase/migrations/027_exlib_catalog_content_schema.sql') &&
      read('docs/exlib2m-migration-027-application-record.md').includes('20260902194541_exlib_catalog_content_schema_027') &&
      frozenVsSource('docs/exlib2m-migration-027-application-record.md'))
    check('A3: the load package lives under docs/ ONLY — migrations remain exactly 001-027 with no 028 and no new migration file; the package binds both fingerprints and one explicit transaction encloses it (proofs 3, 7)',
      (() => {
        const files = readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).sort()
        if (files.length !== 27 || files.some((f) => f.startsWith('028'))) return false
        if (!PACKAGE.startsWith('docs/')) return false
        return pkg.includes('PREPARED — NOT EXECUTED') &&
          pkg.includes(ARTIFACT_SHA) && pkg.includes(MIGRATION_SHA) &&
          pkg.includes('ttybyljytiwntvorugcv') &&
          (pkg.match(/^BEGIN;$/gm) ?? []).length === 1 &&
          (pkg.match(/^COMMIT;$/gm) ?? []).length === 1
      })())
  }

  console.log('\nB. The payload binding, re-derived from the artifact (proofs 4-5, 8)')
  {
    check('B1: EVERY text literal in the package equals the admitted artifact byte for byte — canonical name, classification (10 fields), authorship, and all five scalar payload fields including the empty-string equipment_setup (proof 4)',
      tagged('nm') === art.proposed_canonical_name &&
      tagged('pm') === art.primary_muscle &&
      tagged('eq') === art.equipment &&
      tagged('lat') === art.laterality &&
      tagged('tm') === art.tracking_mode &&
      tagged('prov') === art.provenance &&
      tagged('mp') === art.movement_pattern &&
      tagged('tr') === art.training_role &&
      tagged('dif') === art.difficulty &&
      tagged('av') === art.availability &&
      tagged('ab') === art.authored_by &&
      tagged('ad') === art.authored_at &&
      tagged('br') === art.breathing_cue &&
      tagged('sf') === art.safety_guidance &&
      tagged('es') === art.equipment_setup && art.equipment_setup === '' &&
      tagged('ac') === art.accessibility_alternative)
    check('B2: every JSONB literal parses to exactly the artifact value — anatomy pair, alias pair, and the three prose arrays (proof 4)',
      JSON.stringify(JSON.parse(tagged('anat'))) === JSON.stringify(art.muscle_targets) &&
      JSON.stringify(JSON.parse(tagged('alia'))) === JSON.stringify(art.aliases) &&
      JSON.stringify(JSON.parse(tagged('setu'))) === JSON.stringify(art.setup_steps) &&
      JSON.stringify(JSON.parse(tagged('exec'))) === JSON.stringify(art.execution_steps) &&
      JSON.stringify(JSON.parse(tagged('mist'))) === JSON.stringify(art.common_mistakes))
    check('B3: the relationship-target derivation is exact and fabrication-free — the expected set parses to exactly substitution->Dead-bug-identity and progression->Ab-wheel-identity, both names are artifact-verbatim AND present in the promoted inventory, regressions stay empty, and neither target receives snapshot or content anywhere in the package (proof 5)',
      (() => {
        const exp = JSON.parse(tagged('expx'))
        if (JSON.stringify(exp) !== JSON.stringify([
          { relation: 'substitution', to_logical_id: DBU },
          { relation: 'progression', to_logical_id: AW }])) return false
        if (JSON.stringify(art.substitutions) !== JSON.stringify(['Dead bug'])) return false
        if (JSON.stringify(art.progressions) !== JSON.stringify(['Ab wheel rollout'])) return false
        if (JSON.stringify(art.regressions) !== JSON.stringify([])) return false
        const inv = parseJsonl('docs/exlib2b-release1-inventory.jsonl')
        const names = new Set(inv.map((r: any) => r.proposed_canonical_name))
        if (!names.has('Dead bug') || !names.has('Ab wheel rollout')) return false
        // exactly one snapshot call and one content call, both for the Plank identity
        const snapCalls = pkg.match(/^SELECT load_catalog_snapshot\(/gm) ?? []
        const draftCalls = pkg.match(/^SELECT load_catalog_content_draft\(/gm) ?? []
        return snapCalls.length === 1 && draftCalls.length === 1 &&
          recFlat.includes('IDENTITY-ONLY STUBS') &&
          recFlat.includes('no separately approved and eligible source artifact exists, so loading their content is forbidden and not performed')
      })())
    check('B4: the package\'s own postconditions pin the exact resulting state — 3 identities, the single pending active Plank snapshot with every field (including the derived category and NULL sources), the exact anatomy/alias pairs, exactly one pending/draft/unadmitted content version 1, exactly the two expected rows, and zero forbidden state (proof 8)',
      pkgFlat.includes("(SELECT count(*) FROM public.exercise_catalog_logical) <> 3") &&
      pkgFlat.includes("s.category = 'isolation'") &&
      pkgFlat.includes('s.source_url IS NULL AND s.source_page IS NULL') &&
      pkgFlat.includes("'lower_back:tertiary,obliques:secondary'") &&
      pkgFlat.includes("'Forearm plank,Front plank'") &&
      pkgFlat.includes("v_c.content_status <> 'pending' OR v_c.publication_status <> 'draft'") &&
      pkgFlat.includes('OR v_c.import_admitted') &&
      pkgFlat.includes("e.relation = 'substitution' AND e.to_logical_id = '" + DBU + "'") &&
      pkgFlat.includes("e.relation = 'progression' AND e.to_logical_id = '" + AW + "'") &&
      pkgFlat.includes('forbidden state exists (projection, run, membership, or target snapshot/content)') &&
      pkg.includes(PL) && pkg.includes(CV))
    check('B5: the derived category is disclosed with its complete committed chain — seed row, 2D pristine predicate, applied 026 gate and its category-preserving link path, and the uniqueness argument (mobility excluded)',
      recFlat.includes("DERIVED BY COMMITTED CONTRACT (disclosed for adjudication — the one field with no verbatim source): snapshot category = 'isolation'") &&
      recFlat.includes('the inventory\'s exercise_type_derived = "mobility" is the TENANT exercises.exercise_type value') &&
      recFlat.includes("v_seed.category = 'isolation'") &&
      recFlat.includes('the linked row never disagrees with its catalog snapshot') &&
      recFlat.includes("'mobility' is uniquely EXCLUDED") &&
      pkgFlat.includes('DERIVED FROM COMMITTED CONTRACT, not from general knowledge'))
  }

  console.log('\nC. Authority discipline (proofs 6, 9-10)')
  {
    check('C1: loader-only authority — SET ROLE exlib_catalog_loader wraps exactly the five loader calls, preconditions/postconditions are owner-role reads, and no other operational role is assumed (proof 6)',
      (pkg.match(/^SET ROLE exlib_catalog_loader;$/gm) ?? []).length === 1 &&
      (pkg.match(/^RESET ROLE;$/gm) ?? []).length === 1 &&
      (pkg.match(/^SELECT load_catalog_(identity|snapshot|content_draft)\(/gm) ?? []).length === 5 &&
      !pkg.includes('SET ROLE exlib_catalog_reviewer') &&
      !pkg.includes('SET ROLE exlib_catalog_admission') &&
      !pkg.includes('SET ROLE exlib_catalog_admin'))
    check('C2: ZERO reviewer/admission/admin authority calls anywhere in the package (proof 9)',
      !pkg.includes('apply_content_review') &&
      !pkg.includes('admit_catalog_content') &&
      !pkg.includes('publish_catalog_content'))
    check('C3: ZERO run, seal, revocation, publication, or delivery actions — no run/membership inserts and none of those function names appear; the record cites the committed contracts binding runs to DELIVERY, not loading (proof 10)',
      !pkg.includes('exlib_approve_and_seal_run') &&
      !pkg.includes('deliver_catalog_exercises') &&
      !pkg.includes('rollback_catalog_delivery') &&
      !pkg.includes('exlib_revoke_run_delivery') &&
      !/INSERT INTO\s+(public\.)?exercise_catalog_import_runs/i.test(pkg) &&
      !/INSERT INTO\s+(public\.)?exercise_catalog_run_items/i.test(pkg) &&
      recFlat.includes('bind import runs, run items, sealing, and revocation to the DELIVERY lifecycle') &&
      recFlat.includes('Run creation is therefore NOT part of this load stage and the package creates none'))
  }

  console.log('\nD. Boundaries, posture, and lifecycle (proofs 11-13)')
  {
    check('D1: no seed, inventory, eligibility, ledger, runtime, or config change — the frozen set is blob-identical to the promoted tip, and the phase touches only docs/ and scripts/verify-* paths (proof 11)',
      (() => {
        for (const p of [ARTIFACT, 'src/lib/supabase/seed-exercises.ts',
          'docs/exlib2b-release1-inventory.jsonl', 'docs/exlib1b1-review-ledger.jsonl',
          'docs/exlib1c0a-equipment-resolution.jsonl', 'package.json',
          'docs/exlib2j-plank-import-eligibility-admission-record.md']) {
          if (!frozenVsSource(p)) return false
        }
        const inv = parseJsonl('docs/exlib2b-release1-inventory.jsonl')
        const plank = inv.filter((r: any) => r.proposed_canonical_name === 'Plank')
        if (plank.length !== 1 || plank[0].seed_link_compatible !== false) return false
        if (art.import_eligible !== true || art.content_review.status !== 'approved' ||
          art.content_review.reviewer !== 'Nick Tkacz' || art.review_status !== 'proposed') return false
        if (Object.keys(art).some((k) => k.includes('publication'))) return false
        const range = execSync(`git diff --name-only ${SOURCE_TIP}..HEAD`, { encoding: 'utf8' })
          .split('\n').filter(Boolean)
        return !range.some((p) => !/^(docs\/|scripts\/verify-)/.test(p))
      })())
    check('D2: explicit prepared-not-executed posture — the package and the record both state it, the one-use behavior is documented honestly (non-idempotent loaders; empty-surface precondition), and the eventual hosted execution stays a separate Joseph/ChatGPT-path act (proof 12)',
      pkgProse.includes('ONE-USE package by design') &&
      pkgProse.includes('a second execution fails closed at the preconditions before any write') &&
      pkgProse.includes('Claude never executes it against hosted') &&
      recFlat.includes('The load package exists ONLY as a reviewed local file') &&
      recFlat.includes('NOT been executed against hosted Supabase or any persistent database') &&
      recFlat.includes('NOT claimed as executed anywhere') &&
      recFlat.includes('the fail-closed stop was not triggered') &&
      live.includes('E1: a second execution fails closed at the empty-surface precondition (ONE-USE, exactly as documented)'))
    check('D3: the live harness proves the required matrix — 27 migrations exactly once, zero starting state, the 84-exercise representative tenant fixture, byte-level artifact match, admission-before-review and publication refusals, no projection, no run/delivery/exercise effect, one-use, and whole-transaction rollback variants on fresh scratch databases',
      live.includes('B2: migrations 001-027 applied exactly once in order (27 files, ALL as the non-superuser postgres)') &&
      live.includes('B3: the database begins with ZERO catalog/content state') &&
      live.includes('B4: representative tenant fixture in place - exactly 84 exercises') &&
      live.includes('C4: EVERY loaded value equals the admitted artifact byte for byte') &&
      live.includes('D1: it CANNOT be admitted before database review') &&
      live.includes('D2: it CANNOT be published (pending, unadmitted)') &&
      live.includes('D3: NO live relationship projection exists before publication') &&
      live.includes('D5: exercises remains EXACTLY 84 and byte-identical') &&
      live.includes('F(nonempty surface)') &&
      live.includes('the WHOLE transaction rolled back - zero rows persisted') &&
      live.includes('G3: the disposable cluster and every scratch database are destroyed on exit'))
    check('D4: the historical-verifier lifecycle is classified and labeled — verify-exlib2i.ts and verify-exlib2j.ts carry the exact RETARGET label with their no-load-package claims anchored to their promoted tips via git, and the record documents the classification (proof 13, lifecycle half)',
      PHASE_MOD.every((p) => read(p).includes(LABEL)) &&
      read('scripts/verify-exlib2i.ts').includes('git ls-tree ${TIP_2I} docs/ --name-only') &&
      read('scripts/verify-exlib2j.ts').includes('git ls-tree ${TIP_2J} docs/ --name-only') &&
      recFlat.includes('HISTORICAL PHASE CLAIMS requiring an exact promoted-tip anchor') &&
      recFlat.includes('anchored to each suite\'s exact promoted tip (73231e9 for 2I, 2a0465e for 2J)'))
    check('D5: lifecycle-safe phase boundary — the phase adds exactly four paths (package, record, this verifier, the live harness) and modifies exactly the two labeled retargets; strict porcelain while uncommitted, adder-anchored once committed (proof 13, inventory half)',
      (() => {
        try {
          const inHead = (() => {
            try { execSync(`git cat-file -e HEAD:${PACKAGE}`, { stdio: 'pipe' }); return true } catch { return false }
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

  console.log('\nE. Correction findings (lock serialization, claim postconditions, target-identity semantics)')
  {
    check('E1: the fresh-load gate is LOCK-SERIALIZED — exactly one LOCK statement sits after BEGIN and before the empty-state read, takes SHARE ROW EXCLUSIVE on EXACTLY the ten tables the gate covers in documented alphabetical order, documents the real-table-lock (no advisory-only) design held through COMMIT with ordinary reads unblocked, and the live harness proves the REAL two-session race',
      (() => {
        if ((pkg.match(/^LOCK TABLE/gm) ?? []).length !== 1) return false
        const iBegin = pkg.indexOf('\nBEGIN;')
        const iLock = pkg.indexOf('LOCK TABLE')
        const iPre = pkg.indexOf('DO $pre$')
        if (!(iBegin > 0 && iBegin < iLock && iLock < iPre)) return false
        const lockM = pkg.match(/^LOCK TABLE\n([\s\S]*?)IN SHARE ROW EXCLUSIVE MODE;/m)
        if (!lockM) return false
        const lockTables = lockM[1].split('\n').map((l) => l.trim().replace(/,$/, ''))
          .filter((l) => l.startsWith('public.')).map((l) => l.replace('public.', ''))
        if (lockTables.length !== 10) return false
        if (JSON.stringify(lockTables) !== JSON.stringify([...lockTables].sort())) return false
        const preBlock = pkg.slice(iPre, pkg.indexOf('$pre$;'))
        const gateTables = Array.from(preBlock.matchAll(/count\(\*\) FROM public\.(\w+)\)/g))
          .map((m) => m[1]).sort()
        if (JSON.stringify(gateTables) !== JSON.stringify(lockTables)) return false
        return pkgProse.includes('ALPHABETICAL by table name, in a single LOCK statement') &&
          pkgProse.includes('REAL table locks - no advisory-lock-only design') &&
          pkgProse.includes('remain held through every loader call, every postcondition, and COMMIT') &&
          pkgProse.includes('while ordinary reads stay unblocked') &&
          pkgProse.includes('A queued second execution proceeds only after this one commits, then fails closed at the nonempty one-use precondition') &&
          live.includes('CC1: session A holds a GRANTED ShareRowExclusiveLock') &&
          live.includes('CC2: session B is genuinely WAITING on the table lock') &&
          live.includes('CC3: EXACTLY ONE execution succeeded') &&
          live.includes('CC4: the final database holds EXACTLY ONE valid load result')
      })())
    check('E2: the three catalog name claims are part of the package\'s OWN fail-closed postconditions — exactly three rows, the exact canonical/alias/alias triple all owned by the Plank identity, migration-023\'s bidirectional invariant via exlib_verify_catalog_claims(), the stale "two claims" wording corrected everywhere, and the live harness proves both the exact external rows and the claim-corruption rollback',
      pkgFlat.includes('(SELECT count(*) FROM public.exercise_catalog_name_claims) <> 3') &&
      pkgFlat.includes("WHERE c.normalized_name = 'plank' AND c.claim_source = 'canonical' AND c.logical_id = '" + PL + "')") &&
      pkgFlat.includes("WHERE c.normalized_name = 'front plank' AND c.claim_source = 'alias' AND c.logical_id = '" + PL + "')") &&
      pkgFlat.includes("WHERE c.normalized_name = 'forearm plank' AND c.claim_source = 'alias' AND c.logical_id = '" + PL + "')") &&
      pkgFlat.includes('FROM public.exlib_verify_catalog_claims() v') &&
      pkgFlat.includes('v.orphaned_claims <> 0 OR v.unclaimed_bearers <> 0') &&
      pkgProse.includes("exactly THREE catalog name claims (one canonical 'plank' plus the two alias claims), postcondition-verified together with migration 023's bidirectional claim invariant") &&
      !pkgProse.includes('claims machinery entries') &&
      !recFlat.replace(/miscounted the result as "two catalog name\/alias claims machinery entries"/, '').includes('claims machinery entries') &&
      recFlat.includes('EXACTLY the three catalog name claims') &&
      recFlat.includes('exlib_verify_catalog_claims() returns 0/0') &&
      live.includes("C2b: the three claims are EXACTLY the required rows") &&
      live.includes("C2c: migration-023's bidirectional claim invariant is clean after the load") &&
      live.includes("claim corruption (an owner DELETE of one claim row injected after RESET ROLE) trips the package's OWN three-claim postcondition"))
    check('E3: intended vs database-proven target identity is stated precisely — the package and record both say the artifact/package ASSIGN the intended mapping, the database stores only bare UUIDs with NO independent-proof claim, identity-only staging is bounded to this milestone (Plank pending/draft/unadmitted/unpublished), and review/admission/publication stay blocked until the fail-closed target-snapshot gate (Dead bug = ...0002, Ab wheel rollout = ...0003, never swapped/missing/inactive/ambiguous) exists; no target snapshot is created and neither expected relationship is weakened',
      pkgProse.includes('INTENDED vs DATABASE-PROVEN TARGET IDENTITY (semantic precision):') &&
      pkgProse.includes('ASSIGN the intended target-name-to-UUID mapping') &&
      pkgProse.includes('NO claim is made that hosted database state independently proves those names after this load') &&
      pkgProse.includes('MUST all remain blocked until separately reviewed target snapshots exist and a fail-closed gate proves that') &&
      pkgProse.includes(DBU + " bears the active canonical snapshot 'Dead bug'") &&
      pkgProse.includes(AW + " bears the active canonical snapshot 'Ab wheel rollout'") &&
      pkgProse.includes('swapped, missing, inactive, or ambiguous') &&
      recFlat.includes('the two target logical rows are BARE UUIDs') &&
      recFlat.includes('NO claim is made that hosted database state independently proves those names') &&
      recFlat.includes('MUST all remain blocked until separately reviewed target snapshots exist') &&
      recFlat.includes(DBU + ' bears the active canonical snapshot "Dead bug"') &&
      recFlat.includes(AW + ' bears the active canonical snapshot "Ab wheel rollout"') &&
      recFlat.includes('with neither mapping swapped, missing, inactive, or ambiguous') &&
      recFlat.includes('No target snapshot is created here (no authorized source artifact exists), and neither expected relationship is weakened or removed') &&
      JSON.stringify(JSON.parse(tagged('expx'))) === JSON.stringify([
        { relation: 'substitution', to_logical_id: DBU },
        { relation: 'progression', to_logical_id: AW }]))
  }

  console.log('\nF. Hosted-authority correction (failed-attempt evidence, posture gate, transactional elevation, hosted-shape fixture)')
  {
    const crec = read('docs/exlib2k-hosted-authority-correction-record.md')
    const crecFlat = crec.replace(/\s+/g, ' ')
    check('F1: the failed hosted attempt is preserved as evidence — performed by ChatGPT (not Claude) against ttybyljytiwntvorugcv on the exact promoted bytes (20,116 B / 78cff34a...), verbatim ERROR 42501 at SET ROLE before any loader call, transaction rolled back, ALL TEN tables zero, no partial state or lifecycle effect',
      crecFlat.includes('performed by ChatGPT, not Claude') &&
      crec.includes('ttybyljytiwntvorugcv') &&
      crec.includes('78cff34a39239c62391f322138e7e4085191fb4f26fc0e87c17c6474915e21a7') &&
      crecFlat.includes('20,116 B') &&
      crecFlat.includes('ERROR 42501: permission denied to set role "exlib_catalog_loader"') &&
      crecFlat.includes("The failure occurred at the package's SET ROLE statement — BEFORE any loader call") &&
      crecFlat.includes('The single enclosing transaction rolled back') &&
      crecFlat.includes('ALL TEN catalog tables remained exactly zero rows') &&
      crecFlat.includes('No partial state and no lifecycle effect') &&
      crecFlat.includes('ADMIN TRUE, INHERIT FALSE, SET FALSE') &&
      crecFlat.includes('SET ROLE exlib_catalog_loader is CORRECTLY denied') &&
      pkgProse.includes('HOSTED EXECUTION HISTORY (evidence, preserved):') &&
      pkgProse.includes('ERROR 42501: permission denied to set role "exlib_catalog_loader"') &&
      recFlat.includes('FAILED SAFELY at SET ROLE'))
    check('F2: the corrected package is posture-gated and restoration-exact — the exact hosted baseline is proven BEFORE any write (postgres by name, non-superuser, exactly one membership ADMIN TRUE/INHERIT FALSE/SET FALSE), exactly one transaction-contained GRANT ... WITH SET TRUE, INHERIT FALSE precedes SET ROLE, exactly one REVOKE ... GRANTED BY postgres follows RESET ROLE, and the postconditions require the baseline restored plus zero anon/authenticated/service_role/PUBLIC grants on the loader functions',
      (() => {
        if ((pkg.match(/^GRANT exlib_catalog_loader TO postgres WITH SET TRUE, INHERIT FALSE;$/gm) ?? []).length !== 1) return false
        if ((pkg.match(/^REVOKE exlib_catalog_loader FROM postgres GRANTED BY postgres;$/gm) ?? []).length !== 1) return false
        const iPre = pkg.indexOf('DO $pre$')
        const iGrant = pkg.indexOf('\nGRANT exlib_catalog_loader')
        const iSet = pkg.indexOf('\nSET ROLE exlib_catalog_loader;')
        const iReset = pkg.indexOf('\nRESET ROLE;')
        const iRevoke = pkg.indexOf('\nREVOKE exlib_catalog_loader')
        const iPost = pkg.indexOf('DO $post$')
        const iCommit = pkg.indexOf('\nCOMMIT;')
        if (!(iPre > 0 && iPre < iGrant && iGrant < iSet && iSet < iReset && iReset < iRevoke && iRevoke < iPost && iPost < iCommit)) return false
        return pkgFlat.includes("IF current_user <> 'postgres' OR session_user <> 'postgres' THEN") &&
          pkgFlat.includes('the invoker is a superuser; this package is bound to the hosted non-superuser postgres posture') &&
          pkgFlat.includes('the loader-role membership posture is not the exact hosted baseline (exactly one membership: postgres granted BY supabase_admin with ADMIN TRUE, INHERIT FALSE, SET FALSE - grantor included); refusing before any write or authority change') &&
          (pkgFlat.match(/am\.admin_option AND NOT am\.inherit_option AND NOT am\.set_option/g) ?? []).length === 3 &&
          pkgFlat.includes('the temporary loader elevation was not exactly restored - EXACTLY the original supabase_admin-granted baseline row (grantor included) must remain') &&
          pkgFlat.includes("has_function_privilege('anon', 'public.load_catalog_identity(uuid)', 'EXECUTE')") &&
          pkgFlat.includes("has_function_privilege('service_role', 'public.load_catalog_identity(uuid)', 'EXECUTE')") &&
          pkgFlat.includes('a.grantee = 0') &&
          pkgProse.includes('TRANSACTION-CONTAINED elevation') &&
          pkgProse.includes('No standing privilege is widened by success or failure.')
      })())
    check('F3: the live fixture and proofs carry the hosted shape — a DEDICATED hosted-membership-semantics check (all four authorities ADMIN TRUE/INHERIT FALSE/SET FALSE for the non-superuser postgres), the baseline 42501 reproduction, the promoted-bytes reproduction of the exact hosted refusal with ten-zero rollback, restoration proofs on success/second-run/every variant/the race, the restoration-removed and pre-widened-baseline variants, and disclosed supabase_admin probe authority',
      live.includes('B1b: the working role reproduces the hosted operator posture - postgres is LOGIN, NOSUPERUSER, CREATEDB, CREATEROLE') &&
      live.includes('B2b: HOSTED MEMBERSHIP SEMANTICS (dedicated check)') &&
      live.includes('B2c: SET ROLE exlib_catalog_loader as postgres is CORRECTLY denied at baseline') &&
      live.includes('F0a: the promoted package bytes are fingerprint-verified from git (20,116 B / 78cff34a') &&
      live.includes('F0b: the promoted package fails with EXACTLY the hosted error') &&
      live.includes('F0c: all TEN catalog tables remain exactly zero rows after the reproduced failure') &&
      live.includes('C1b: AUTHORITY RESTORED after success') &&
      live.includes('C1c: SET ROLE exlib_catalog_loader as postgres is denied AGAIN after the successful load') &&
      live.includes('E3b: the failed second execution also left the authority baseline untouched') &&
      live.includes('the temporary authority elevation ALSO rolled back - loader membership is exactly the hosted baseline') &&
      live.includes('restoration removed (the REVOKE ... GRANTED BY line deleted)') &&
      live.includes('CC5: after the race the authority baseline is exact') &&
      live.includes('F3b: the untouched package refuses the widened posture at its OWN posture gate') &&
      live.includes('F3d: the harness restored the exact baseline via supabase_admin') &&
      live.includes('supabase_admin PROBE authority') &&
      crecFlat.includes('supabase_admin') && crecFlat.includes('non-superuser postgres'))
    check('F4: the design selection is recorded fail-closed and nothing forbidden was done — shapes A/B/C evaluated with B SELECTED (zero residual authority) and A/C REJECTED, the deliberately-NOT-done list present, migrations remain exactly 001-027 with no 028, and the artifact and migration 027 stay byte-identical to promoted main',
      (() => {
        if (!crecFlat.includes('A. Standing hosted operator membership')) return false
        if (!crecFlat.includes('REJECTED: it leaves a PERSISTENT widening')) return false
        if (!crecFlat.includes('B. Package-contained transaction-safe elevation with exact restoration. SELECTED — smallest correct design')) return false
        if (!crecFlat.includes('C. A separate migration/authority mechanism')) return false
        if (!crecFlat.includes('largest blast radius of the three')) return false
        if (!crecFlat.includes('SET ROLE was NOT deleted')) return false
        if (!crecFlat.includes('NO hosted ACL change was applied')) return false
        const files = readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).sort()
        if (files.length !== 27 || files.some((f) => f.startsWith('028'))) return false
        return frozenVsSource('docs/exlib2g-plank-content.jsonl') &&
          frozenVsSource('supabase/migrations/027_exlib_catalog_content_schema.sql')
      })())
    check('F5: GRANTOR BINDING (dedicated) — the baseline gate, the structural two-grantor check between GRANT and SET ROLE, and the restoration postcondition all bind grantor supabase_admin exactly; the temporary row is postgres-granted SET-only; and the live suite carries the dedicated grantor proofs (exact baseline row, instrumented two-row shape, grantor-scoped-revoke isolation, GRANT-removed abort, wrong-grantor refusal with restoration)',
      (() => {
        const iGrant = pkg.indexOf('\nGRANT exlib_catalog_loader')
        const iAuth = pkg.indexOf('DO $auth$')
        const iSet = pkg.indexOf('\nSET ROLE exlib_catalog_loader;')
        if (!(iGrant > 0 && iGrant < iAuth && iAuth < iSet)) return false
        if ((pkgFlat.match(/g\.rolname = 'supabase_admin'/g) ?? []).length !== 3) return false
        if ((pkgFlat.match(/g\.rolname = 'postgres'/g) ?? []).length !== 1) return false
        if ((pkgFlat.match(/NOT am\.admin_option AND NOT am\.inherit_option AND am\.set_option/g) ?? []).length !== 1) return false
        return pkgFlat.includes('the two-grantor membership shape after the temporary grant is not exact (supabase_admin-granted baseline row plus postgres-granted SET row); aborting before SET ROLE and before any loader call') &&
          pkgProse.includes('grantor supabase_admin -> member postgres') &&
          pkgProse.includes('STRUCTURAL TWO-GRANTOR SHAPE') &&
          pkgProse.includes('cannot remove or alter the supabase_admin-granted baseline row') &&
          live.includes('B2d: DEDICATED baseline-grantor proof') &&
          live.includes('AU1: EXACT two-row shape immediately after the temporary GRANT') &&
          live.includes('AU2: the grantor-scoped REVOKE ... GRANTED BY postgres removes ONLY the postgres-granted temporary row') &&
          live.includes('AU3: the instrumented probe rolled back completely') &&
          live.includes('elevation removed (the GRANT line deleted) - the structural two-grantor check aborts BEFORE SET ROLE and before any loader call') &&
          live.includes('F4a: the harness constructed a GRANTOR-ISOLATED counterfactual baseline - exactly one row, member postgres, ADMIN TRUE / INHERIT FALSE / SET FALSE, and ONLY the grantor differs') &&
          live.includes('F4b: the package refuses a baseline whose ONLY defect is the grantor - the grantor clause is load-bearing') &&
          live.includes('F4c: the refusal wrote ZERO catalog rows and did not touch the (wrong-grantor) pre-existing membership') &&
          live.includes('F4d: the harness restored the exact supabase_admin-granted baseline row') &&
          live.includes('1/supabase_admin>postgres:true:false:false') &&
          crecFlat.includes('GRANTOR supabase_admin') &&
          crecFlat.includes('grantor-scoped REVOKE removes only the temporary row')
      })())
    check('F6: SESSION BINDING (dedicated) — the gate requires BOTH current_user AND session_user to equal postgres before any authority or data change, and the live suite proves a different session_user that switched current_user to postgres is refused before elevation and writes, with zero catalog rows and the baseline intact',
      pkgFlat.includes("IF current_user <> 'postgres' OR session_user <> 'postgres' THEN") &&
      pkgFlat.includes('BOTH execution identities must be the hosted operator role postgres (got current_user=%, session_user=%); refusing before any write or authority change') &&
      pkgProse.includes('current_user = postgres AND session_user = postgres') &&
      live.includes('F5a: the package refuses when session_user=exlib_intruder has switched current_user to postgres - rejection at the identity gate, BEFORE elevation and writes') &&
      live.includes('F5b: the identity refusal wrote ZERO catalog rows and left the authority baseline exact') &&
      live.includes('F5c: the harness intruder role is fully removed') &&
      crecFlat.includes('current_user = postgres; session_user = postgres') &&
      crecFlat.includes('a different session_user that switched current_user to postgres'))
    check('F7: FIXTURE GRANTOR IDENTITY (dedicated) — the disposable bootstrap superuser is named supabase_admin so the implicit creator memberships reproduce the hosted grantor identity, not merely equivalent options; the fixture asserts the grantor-included row on all four authorities; and no cluster_admin naming remains anywhere in the live suite',
      live.includes('initdb -D "$PGDATA" -U supabase_admin') &&
      live.includes('exlib_catalog_loader=supabase_admin>postgres:true:false:false') &&
      !live.includes('cluster_admin') &&
      live.includes('BASELINE_OK="1/supabase_admin>postgres:true:false:false"') &&
      crecFlat.includes('named for the hosted GRANTOR IDENTITY'))
    check('F8: GRANTOR NON-CONSTRUCTIBILITY (dedicated) — the live suite proves, from PostgreSQL\'s own refusals, that a postgres-granted BASELINE row cannot exist (no-ADMIN grantor refusal plus the self-grantor ADMIN refusal), that the temporary postgres-granted row cannot outlive the baseline row it depends on, and that the hosted grantor supabase_admin is the BOOTSTRAP superuser PostgreSQL records for an implicit creator membership; the record states each fact and discloses that the grantor-isolating counterfactual is harness-only catalog surgery',
      live.includes('F4e: with no baseline row present, a postgres-granted membership CANNOT be created') &&
      live.includes('permission denied to grant privileges as role "postgres"') &&
      live.includes('F4f: while the temporary postgres-granted row exists, PostgreSQL REFUSES to remove the supabase_admin-granted baseline row it depends on') &&
      live.includes('dependent privileges exist') &&
      live.includes('F4g: postgres cannot even recreate the baseline row under its own grantor') &&
      live.includes('ADMIN option cannot be granted back to your own grantor') &&
      live.includes('F4h: a role created by the NON-SUPERUSER postgres records its implicit creator membership with the BOOTSTRAP superuser as grantor') &&
      live.includes('UPDATE pg_catalog.pg_auth_members SET grantor') &&
      live.includes('disposable-fixture surgery') &&
      crecFlat.includes("The GRANTOR of that implicit membership is PostgreSQL's BOOTSTRAP superuser") &&
      crecFlat.includes('A postgres-granted BASELINE row therefore cannot exist') &&
      crecFlat.includes('The temporary row can never outlive its baseline') &&
      crecFlat.includes('That surgery exists ONLY in the disposable harness'))
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
