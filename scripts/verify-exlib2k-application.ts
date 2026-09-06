// EXLIB-2K hosted-load APPLICATION-EVIDENCE verifier (LOCAL-ONLY).
//
// Owns the executed-state posture: the reviewed Plank catalog-load
// package (29,760 B / a1b6dd55...) was executed ONCE against hosted
// ShredOS by ChatGPT (never Claude) on 2026-09-03 and committed.
// Proves: exact source refs and byte-frozen fingerprints; the
// execution facts pinned verbatim with ChatGPT attribution; the
// operator-confirmed post-execution state cross-checked mechanically
// against the executed package's OWN postconditions and the admitted
// authoring artifact; the target-snapshot-gate evidence distinction
// held open (review/admission/publication BLOCKED); grantor-included
// authority restoration; advisor evidence precision (no
// globally-clean claim); the read-only verification honesty note;
// boundary freezes; and the lifecycle two-state check with the
// labeled retarget of the prepared-not-executed suite.
// Performs NO hosted contact: every fact here is read from committed
// files, the git object store, and the operator-authored record.
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

const RECORD = 'docs/exlib2k-hosted-load-application-record.md'
const PACKAGE = 'docs/exlib2k-plank-catalog-load-package.sql'
const ARTIFACT = 'docs/exlib2g-plank-content.jsonl'
const VERIFIER = 'scripts/verify-exlib2k-application.ts'
const RETARGETED = 'scripts/verify-exlib2k.ts'
const SOURCE_TIP = '2d80603bfcf6568da8ab79457e5745a77b7fafd6'
const SOURCE_TREE = '92c6c6f9a660bcf3948d6f6f166e66180f67c9be'
const TAG = 'exlib2k-hosted-authority-correction-reviewed-not-executed'
const TAG_OBJ = 'fb096db737816b23c581e8dd5561cad4fdc1d789'
const PKG_SHA = 'a1b6dd55850c5d544e2f484d1ce4833b41deec7f3dd4d4c2373cb3b50daaccf0'
const ARTIFACT_SHA = 'd82078490efa9ef13e128e7b7b742fbda8ea9e74e32382252d96c326c679d752'
const MIGRATION_SHA = '90d53aaf8fd341dd99bab22b7d1ca280ec24b8ccee2a28efca6e835e0585a14f'
const PL = 'e21b2c00-0000-4000-a000-000000000001'
const DBU = 'e21b2c00-0000-4000-a000-000000000002'
const AW = 'e21b2c00-0000-4000-a000-000000000003'
const CV = 'e21b2c00-0000-4000-a000-000000000101'
const LABEL = 'RETARGET (EXLIB-2K hosted-load application record)'
const HISTORY_ENTRIES = [
  '20260813034632_phase5b2_nutrition_day_status',
  '20260824135804_exlib_catalog_and_delivery_contract_revision_h',
  '20260824174252_exlib_post_application_hardening',
  '20260826203154_exlib_equipment_vocabulary_support',
  '20260901032229_exlib_plank_seed_reconciliation_026',
  '20260902194541_exlib_catalog_content_schema_027',
]

const rec = read(RECORD)
const recFlat = rec.replace(/\s+/g, ' ')
const pkg = read(PACKAGE)
const pkgFlat = pkg.replace(/\s+/g, ' ')
const art = parseJsonl(ARTIFACT)[0]
const frozenVsSource = (p: string): boolean =>
  execSync(`git hash-object "${p}"`, { encoding: 'utf8' }).trim() ===
  execSync(`git rev-parse "${SOURCE_TIP}:${p}"`, { encoding: 'utf8' }).trim()
// The record wraps long hashes across lines; compare hash mentions on
// the flattened, whitespace-stripped record.
const recSolid = rec.replace(/\s+/g, '')

async function main(): Promise<void> {
  console.log('EXLIB-2K hosted-load application-evidence verification (EXECUTED ONCE by ChatGPT; LOCAL-ONLY)')

  console.log('\nA. Source refs and byte-frozen fingerprints')
  {
    check('A1: exact source refs — the reviewed-not-executed tag is the exact annotated object, peels to the promoted correction tip (ancestor of HEAD) whose tree is exact',
      (() => {
        try {
          if (execSync(`git rev-parse ${TAG}`, { encoding: 'utf8' }).trim() !== TAG_OBJ) return false
          if (execSync(`git rev-parse ${TAG}^{}`, { encoding: 'utf8' }).trim() !== SOURCE_TIP) return false
          execSync(`git merge-base --is-ancestor ${SOURCE_TIP} HEAD`, { stdio: 'pipe' })
          return execSync(`git rev-parse ${SOURCE_TIP}^{tree}`, { encoding: 'utf8' }).trim() === SOURCE_TREE
        } catch { return false }
      })())
    check('A2: the executed package is byte-UNCHANGED — worktree bytes are exactly 29,760 B with the reviewed SHA-256 and blob-identical to the promoted correction tip (any byte change would void the reviewed/executed status)',
      readFileSync(PACKAGE).length === 29760 && sha256(PACKAGE) === PKG_SHA &&
      frozenVsSource(PACKAGE))
    check('A3: the admitted artifact and migration 027 stay byte-frozen and the repository migration sequence is exactly 001-027 with no 028',
      (() => {
        if (readFileSync(ARTIFACT).length !== 2928 || sha256(ARTIFACT) !== ARTIFACT_SHA) return false
        if (!frozenVsSource(ARTIFACT)) return false
        if (sha256('supabase/migrations/027_exlib_catalog_content_schema.sql') !== MIGRATION_SHA) return false
        const migs = readdirSync('supabase/migrations').filter((f) => /^\d{3}_.*\.sql$/.test(f)).sort()
        return migs.length === 27 && migs[26].startsWith('027_') &&
          !migs.some((f) => f.startsWith('028'))
      })())
  }

  console.log('\nB. Execution facts pinned verbatim (operator attribution and hosted identity)')
  {
    check('B1: ChatGPT attribution is explicit and exclusive — executed by ChatGPT through the Joseph/ChatGPT-only path, NOT by Claude, against the ShredOS project ttybyljytiwntvorugcv ONLY, executed ONCE and COMMITTED',
      recFlat.includes('performed by ChatGPT, NOT by Claude') &&
      recFlat.includes('Claude made no hosted contact in this phase and never executes load packages') &&
      recFlat.includes('Executed by: ChatGPT (the Joseph/ChatGPT-only execution path; never by Claude)') &&
      recFlat.includes('ShredOS Supabase project ttybyljytiwntvorugcv ONLY') &&
      recFlat.includes('The exact promoted package executed ONCE and COMMITTED successfully'))
    check('B2: the executed revision is pinned exactly — source commit, tag, tag object, byte count, and SHA-256 all appear in the record and match this suite\'s constants',
      recSolid.includes(SOURCE_TIP) && recSolid.includes(TAG) &&
      recSolid.includes(TAG_OBJ) && recSolid.includes(PKG_SHA) &&
      recFlat.includes('29,760 bytes') &&
      recFlat.includes('Hosted creation timestamp: 2026-09-03 04:40:12.816865 UTC') &&
      recFlat.includes('= 2026-09-03 00:40:12.816865 Eastern (EDT)'))
    check('B3: the data-load/migration-history distinction is precise — NO migration-history entry created, the six established entries are pinned verbatim, the repository sequence stays 001-027, and the one-use package is documented as SPENT',
      recFlat.includes('it creates NO migration-history entry') &&
      HISTORY_ENTRIES.every((e) => rec.includes(e)) &&
      recFlat.includes('The REPOSITORY migration sequence in effect on hosted remains exactly 001-027') &&
      recFlat.includes('ONE-USE by design and is now SPENT') &&
      recFlat.includes('a second execution fails closed before any write'))
    check('B4: every pre-execution gate is recorded — project identity exact and ACTIVE_HEALTHY, PostgreSQL 17.6, migrations in effect, dual execution identities, non-superuser, the exact grantor-included baseline membership, all TEN tables empty, exercises 84',
      recFlat.includes('ACTIVE_HEALTHY') &&
      recFlat.includes('PostgreSQL 17.6') &&
      recFlat.includes('current_user = postgres AND session_user = postgres') &&
      recFlat.includes('postgres is NOT a superuser') &&
      recFlat.includes('exactly one row, supabase_admin -> postgres, ADMIN TRUE, INHERIT FALSE, SET FALSE') &&
      recFlat.includes('All TEN catalog tables were empty') &&
      recFlat.includes('Existing exercises count was 84'))
  }

  console.log('\nC. Post-execution state cross-checked against the package\'s own postconditions and the admitted artifact')
  {
    check('C1: the loader returns match the reviewed constants — content UUID, logical UUID, content version 1, and 2 expected relationships, each also pinned inside the executed package',
      recFlat.includes(`Content UUID: ${CV}`) &&
      recFlat.includes(`Logical UUID: ${PL}`) &&
      recFlat.includes('Content version: 1') &&
      recFlat.includes('Expected relationships: 2') &&
      pkg.includes(`'${CV}'`) && pkg.includes(`'${PL}'`) &&
      pkgFlat.includes(`v_c.logical_id <> '${PL}' OR v_c.content_version <> 1`))
    check('C2: all ELEVEN recorded counts equal the executed package\'s own fail-closed postcondition pins row for row (ten catalog tables plus exercises 84 unchanged)',
      (() => {
        const pins: Array<[string, number]> = [
          ['exercise_catalog_logical', 3], ['exercise_catalog', 1],
          ['exercise_catalog_muscles', 2], ['exercise_catalog_aliases', 2],
          ['exercise_catalog_name_claims', 3], ['exercise_catalog_content', 1],
          ['exercise_catalog_content_expected_relationships', 2],
          ['exercise_catalog_relationships', 0], ['exercise_catalog_import_runs', 0],
          ['exercise_catalog_run_items', 0],
        ]
        const post = pkg.slice(pkg.indexOf('DO $post$'))
        for (const [t, n] of pins) {
          if (!rec.includes(`- ${t}: ${n}`)) return false
          if (!new RegExp(`FROM public\\.${t}\\)\\s*<>\\s*${n}\\b`).test(post)) return false
        }
        return recFlat.includes('exercises: 84, unchanged')
      })())
    check('C3: every loaded snapshot field equals BOTH the package\'s load_catalog_snapshot arguments and the admitted artifact — canonical name, category, and the nine artifact-sourced fields',
      (() => {
        if (!recFlat.includes('canonical_name = Plank') || art.proposed_canonical_name !== 'Plank' ||
          !pkg.includes('$nm$Plank$nm$')) return false
        const snap = pkg.slice(pkg.indexOf('SELECT load_catalog_snapshot('), pkg.indexOf('$alia$') + 60)
        if (!recFlat.includes('category = isolation') || !snap.includes("'isolation',")) return false
        const fields: Array<[string, string, string]> = [
          ['primary_muscle', 'abs', 'pm'], ['equipment', 'bodyweight', 'eq'],
          ['laterality', 'bilateral', 'lat'], ['tracking_mode', 'timed', 'tm'],
          ['provenance', 'forgefitos_original', 'prov'],
          ['movement_pattern', 'core_anti_extension', 'mp'],
          ['training_role', 'core', 'tr'], ['difficulty', 'beginner', 'dif'],
          ['availability', 'minimal', 'av'],
        ]
        for (const [k, v, tag] of fields) {
          if (!recFlat.includes(`${k} = ${v}`)) return false
          if (art[k] !== v) return false
          if (!snap.includes(`$${tag}$${v}$${tag}$`)) return false
        }
        return recFlat.includes('snapshot review_status = pending')
      })())
    check('C4: claims, anatomy, and expected relationships match the artifact and the package — the three normalized claims Plank-owned with the 0/0 invariant, both anatomy pairs, both artifact-verbatim aliases, and the exact intended-target UUIDs',
      recFlat.includes('plank / canonical, front plank / alias, forearm plank / alias') &&
      recFlat.includes('all three owned by the Plank logical UUID') &&
      recFlat.includes('orphaned_claims = 0 and unclaimed_bearers = 0') &&
      recFlat.includes('obliques / secondary, lower_back / tertiary') &&
      JSON.stringify(art.muscle_targets) === JSON.stringify([
        { muscle: 'obliques', role: 'secondary' }, { muscle: 'lower_back', role: 'tertiary' }]) &&
      JSON.stringify(art.aliases) === JSON.stringify(['Front plank', 'Forearm plank']) &&
      recFlat.includes(`substitution -> ${DBU}`) &&
      recFlat.includes(`progression -> ${AW}`) &&
      JSON.stringify(art.substitutions) === JSON.stringify(['Dead bug']) &&
      JSON.stringify(art.progressions) === JSON.stringify(['Ab wheel rollout']) &&
      pkgFlat.includes(`'${DBU}'`) && pkgFlat.includes(`'${AW}'`))
    check('C5: the content lifecycle is fully pre-review — pending/draft/unadmitted with every admitted and reviewer field null and NO publication projection, matching the package\'s own postcondition pins',
      recFlat.includes('content_status = pending') &&
      recFlat.includes('publication_status = draft') &&
      recFlat.includes('import_admitted = false') &&
      recFlat.includes('admitted fingerprint, admitted source SHA, and admitted timestamp are all null') &&
      recFlat.includes('reviewer identity, review timestamp, and review rationale are all null') &&
      recFlat.includes('NO publication projection exists') &&
      pkgFlat.includes("v_c.content_status <> 'pending'") &&
      pkgFlat.includes("v_c.publication_status <> 'draft'") &&
      pkgFlat.includes('v_c.import_admitted'))
  }

  console.log('\nD. Evidence distinction, authority restoration, advisors, honesty, and boundaries')
  {
    check('D1: the target-snapshot gate is held OPEN — intended assignments distinguished from bare identity UUIDs, hosted does NOT yet prove the named target snapshots, and review/admission/publication remain BLOCKED; the record approves nothing and neither performs nor waives the gate',
      recFlat.includes('INTENDED assignments from the reviewed package') &&
      recFlat.includes('BARE IDENTITY UUIDs ONLY') &&
      recFlat.includes('does NOT yet independently prove that the target UUIDs have active canonical snapshots named Dead bug and Ab wheel rollout') &&
      recFlat.includes('review, eligibility admission, and publication remain BLOCKED until that gate is separately satisfied') &&
      recFlat.includes('this record neither performs nor waives it') &&
      recFlat.includes('This record itself approves NOTHING further'))
    check('D2: authority restoration is pinned GRANTOR-INCLUDED — exactly one supabase_admin-granted membership with ADMIN TRUE/INHERIT FALSE/SET FALSE, the temporary postgres-granted SET row absent, pg_has_role SET false, no persistent widening — matching the package\'s restoration postcondition',
      recFlat.includes('Exactly ONE exlib_catalog_loader membership remains for postgres') &&
      recFlat.includes('Its grantor is supabase_admin, with ADMIN TRUE, INHERIT FALSE, SET FALSE') &&
      recFlat.includes('The temporary postgres-granted SET membership is ABSENT') &&
      recFlat.includes("pg_has_role(postgres, exlib_catalog_loader, 'SET') = false") &&
      recFlat.includes('No persistent authority widening occurred') &&
      pkgFlat.includes('EXACTLY the original supabase_admin-granted baseline row (grantor included) must remain'))
    check('D3: advisor evidence precision — both advisors run by ChatGPT (never Claude), NEITHER claimed globally clean, no package-specific ERROR or migration-blocking result, RLS-no-policy INFO notices explained as intentional deny-by-default, broader notices explicitly unadjudicated',
      recFlat.includes('BOTH hosted advisor classes') &&
      recFlat.includes('were run by ChatGPT after this execution') &&
      recFlat.includes('NEITHER advisor result is claimed to be globally clean') &&
      recFlat.includes('NO package-specific ERROR and NO migration-blocking result was identified') &&
      recFlat.includes('INTENTIONAL deny-by-default posture') &&
      recFlat.includes('NOT introduced, NOT fixed, and NOT adjudicated in this milestone'))
    check('D4: the verification honesty note is preserved — two initial post-execution queries used incorrect INFERRED names and failed READ-ONLY with no mutation; the corrected queries derive from the committed package and migration-027 schema and passed',
      recFlat.includes('Two initial post-execution verification queries used incorrect INFERRED table/column names and failed READ-ONLY') &&
      recFlat.includes('They performed no mutation of any kind') &&
      recFlat.includes('corrected verification queries were derived from the committed package and migration-027 schema and passed'))
    check('D5: boundaries held through this milestone — the frozen set (delivery paths anchored at the delivery predecessor), the Plank inventory row seed_link_compatible false at the anchor, and the range through the anchored predecessor touching only docs/ and scripts/verify-* paths',
      (() => {
        // RETARGET (EXLIB-2S delivery-activation preparation): the two
        // delivery-surface paths compare source-blob vs the anchored
        // delivery-predecessor blob (the promoted EXLIB-2R evidence
        // tip), where this claim was and remains true; every other
        // frozen path stays live.
        const DELIVERY_PRED = '5f7e182f3027b3640514e06d642693f4018c03e2'
        for (const p of ['src/lib/supabase/seed-exercises.ts', 'docs/exlib2b-release1-inventory.jsonl']) {
          if (execSync(`git rev-parse "${SOURCE_TIP}:${p}"`, { encoding: 'utf8' }).trim() !==
              execSync(`git rev-parse "${DELIVERY_PRED}:${p}"`, { encoding: 'utf8' }).trim()) return false
        }
        for (const p of [ARTIFACT, 'docs/exlib1b1-review-ledger.jsonl',
          'docs/exlib1c0a-equipment-resolution.jsonl', 'package.json',
          'docs/exlib2j-plank-import-eligibility-admission-record.md']) {
          if (!frozenVsSource(p)) return false
        }
        const inv = execSync(`git show ${DELIVERY_PRED}:"docs/exlib2b-release1-inventory.jsonl"`, { encoding: 'utf8', maxBuffer: 1 << 26 }).split('\n')
          .filter((l) => l.trim() && !l.trim().startsWith('#')).map((l) => JSON.parse(l))
        const plank = inv.filter((r: any) => r.proposed_canonical_name === 'Plank')
        if (plank.length !== 1 || plank[0].seed_link_compatible !== false) return false
        const range = execSync(`git diff --name-only ${SOURCE_TIP}..${DELIVERY_PRED}`, { encoding: 'utf8' })
          .split('\n').filter(Boolean)
        return !range.some((p) => !/^(docs\/|scripts\/verify-)/.test(p)) &&
          recFlat.includes('seed_link_compatible remains false') &&
          recFlat.includes('review ledger remains 48/48 pending') &&
          recFlat.includes('exercises remains exactly 84')
      })())
  }

  console.log('\nE. Lifecycle: the labeled retarget and the two-state application record')
  {
    check('E1: the prepared-not-executed suite is retargeted under the exact label — header and D2 posture check both carry it, the promoted-tip docs anchor probe is present, and the record documents the classification with unchanged totals (27/0)',
      (() => {
        const r = read(RETARGETED)
        if ((r.match(new RegExp(LABEL.replace(/[()]/g, '\\$&'), 'g')) ?? []).length < 2) return false
        if (!r.includes(`git ls-tree ${SOURCE_TIP} docs/ --name-only`)) return false
        if (!r.includes('true AS WRITTEN of its own phase')) return false
        return recFlat.includes(`label \`${LABEL}\``) &&
          recFlat.includes('the suite\'s totals are unchanged (27/0)') &&
          recFlat.includes('byte-frozen history that remain true AS WRITTEN of their own phases')
      })())
    check('E2: the lifecycle two-state proof — the promoted correction tip\'s tree contains NO application record, and the live tree contains exactly this one',
      (() => {
        const tipDocs = execSync(`git ls-tree ${SOURCE_TIP} docs/ --name-only`, { encoding: 'utf8' })
        if (tipDocs.includes('exlib2k-hosted-load-application-record')) return false
        const liveDocs = readdirSync('docs').filter((f) => f.includes('exlib2k-hosted-load-application-record'))
        return liveDocs.length === 1 && liveDocs[0] === 'exlib2k-hosted-load-application-record.md'
      })())
    check('E3: lifecycle-safe phase boundary — the phase adds exactly two paths (this record, this verifier) and modifies exactly the retargeted verify-exlib2k.ts; strict porcelain while uncommitted, adder-anchored once committed',
      (() => {
        try {
          const inHead = (() => {
            try { execSync(`git cat-file -e HEAD:${RECORD}`, { stdio: 'pipe' }); return true } catch { return false }
          })()
          const PHASE_NEW = [RECORD, VERIFIER].sort()
          if (!inHead) {
            const entries = execSync('git status --porcelain', { encoding: 'utf8' })
              .split('\n').filter(Boolean).map((l) => l.trim()).sort()
            const expected = [...PHASE_NEW.map((f) => `?? ${f}`), `M ${RETARGETED}`].sort()
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
          return JSON.stringify(range) === JSON.stringify([...PHASE_NEW, RETARGETED].sort())
        } catch { return false }
      })())
    check('E4: LOCAL-ONLY hygiene — neither the record nor this verifier contains a hosted endpoint URL, connection string, credential, or Supabase CLI remote command, and neither performs hosted contact',
      (() => {
        const self = read(VERIFIER)
        const both = rec + self
        // Forbidden tokens are assembled from split halves so this
        // suite's own source never contains them verbatim (the same
        // split-token idiom as the live harness's hosted-contact scan).
        const bads = [
          'supabase' + '.co', 'vercel' + '.', 'postgresql' + '://', 'postgres' + '://',
          'SUPABASE' + '_URL', 'SUPABASE' + '_SERVICE', 'api' + 'key', 'Bearer' + ' ', 'ey' + 'J',
          '--db' + '-url', '--lin' + 'ked', 'db ' + 'push',
        ]
        for (const bad of bads) {
          if (both.includes(bad)) return false
        }
        return recFlat.includes('Claude made no hosted contact in this phase')
      })())
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
