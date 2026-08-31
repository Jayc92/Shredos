// EXLIB-2E verifier — migration-026 IMPLEMENTATION PROPOSAL (NOT
// APPLIED; the proposed SQL lives in docs/, never in
// supabase/migrations/, until an explicitly authorized later phase).
//
// Proves: the exact source baseline (approved EXLIB-2D artifacts and
// all protected fingerprints); the planning boundary (migrations
// still exactly 001-025, migration 026 absent from
// supabase/migrations/, the proposal present in docs/ instead, seed
// module and 126-record corpus byte-unchanged); the proposal's
// structure (correction table with tenant-scoped PK, RESTRICT FKs,
// deny-all RLS/REVOKE posture; exactly the two CREATE OR REPLACE
// function statements and no second public entrypoint); the
// verbatim-carry construction (023's run gate, generic insert block,
// alias phase, and rollback body fragments byte-present); the 13-key
// report compatibility with exactly one additive key; the Plank
// dispatch containment (identity-guarded, nine-part P2 predicate
// under FOR UPDATE, correction record, inconsistent-link exception,
// no rename mechanism anywhere); the rollback exclusion predicates;
// the review record's dependency map and dated consumer scan; and
// exact two-state lifecycle behavior. Performs NO hosted contact.
//
// Fail-closed: any mismatch fails the suite.
import { execSync } from 'child_process'
import { createHash } from 'crypto'
import { existsSync, readFileSync, readdirSync } from 'fs'

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

const PROPOSAL = 'docs/exlib2e-migration-026-proposal.sql'
const RECORD = 'docs/exlib2e-implementation-review-record.md'
const LIVE = 'scripts/verify-exlib2e-live.sh'
const VERIFIER = 'scripts/verify-exlib2e.ts'
const D_VERIFIER = 'scripts/verify-exlib2d.ts'
const PHASE_NEW = [PROPOSAL, RECORD, LIVE, VERIFIER].sort()
const PHASE_ALL = [...PHASE_NEW, D_VERIFIER].sort()
const EXLIB2D_TIP = '99991d7b07386c089bebf3c15a7ae98c10cde39b'

const prop = read(PROPOSAL)
const recFlat = read(RECORD).replace(/\s+/g, ' ')
const m023 = read('supabase/migrations/023_exlib_catalog_and_delivery_contract.sql')

const fnText = (src: string, name: string): string => {
  const start = src.indexOf(`CREATE OR REPLACE FUNCTION ${name}`)
  if (start < 0) return ''
  return src.slice(start, src.indexOf('$$;', start) + 3)
}
const returnKeys = (fn: string): string[] => {
  const ret = fn.slice(fn.lastIndexOf('RETURN jsonb_build_object'))
  return Array.from(ret.matchAll(/'(\w+)',/g)).map((m) => m[1])
}

async function main(): Promise<void> {
  console.log('EXLIB-2E verification (migration-026 proposal, NOT applied)')

  console.log('\nA. Baseline and phase boundary')
  {
    check('A1: approved EXLIB-2D artifacts and all protected fingerprints hold (Batches 1-6 content, design artifacts, 2D record/matrix at their review-4 state)',
      sha256('docs/exlib2d-plank-seed-reconciliation-record.md') === '3ea2aa1d279bfd7a099e2b33fe4dfdba565dbde5c37e780c338673684e9baf7c' &&
      sha256('docs/exlib2d-plank-reconciliation-matrix.md') === '5e852982314ebbd52428b5a317388c2b88d69649e1c5c8f21b105f19f9734928' &&
      sha256('docs/exlib2c-release1-batch01-content.jsonl') === '8168fc196f89781e8a30b315f29d1c72f46afeff8edfe89d1812b0a150ece2b2' &&
      sha256('docs/exlib2c-release1-batch02-content.jsonl') === '1ddc3ab0bd92d60ef33960d82a8e0c8a2fdea1cb828d15fc9bf6a82c34305d48' &&
      sha256('docs/exlib2c-release1-batch03-content.jsonl') === 'e4fca8b632c9c9af9b7c6eece660f2042b6a4c3ef613e14c278f95cf9fcab528' &&
      sha256('docs/exlib2c-release1-batch04-content.jsonl') === 'e7def375e9b9560863796bff90746dc6ff2b2f7c4bd7735a3d53fc2cc9750568' &&
      sha256('docs/exlib2c-release1-batch05-content.jsonl') === '404722f1211e45c3b89ac8a32cceb617b958388c034b797dd2bba009aa127e5d' &&
      sha256('docs/exlib2c-release1-batch06-content.jsonl') === 'ec0760be401bb1d4c479d340369d6b6b690acf57f2f7a0f7fbeeaa2cf40ab5d7' &&
      sha256('docs/exlib2b-release1-inventory.jsonl') === 'd349110f22700a822eb427fc1dcce3e6dbcfd264b6d48ed84936b07b1ca256f5' &&
      sha256('docs/exlib2c-authoring-schema.json') === 'dddb872c7725c591e6d056e0dc73167d3c822f6245ebd2c759a045fecbd43c6e' &&
      sha256('supabase/migrations/025_exlib_equipment_vocabulary_support.sql') === 'fbda16f4d25cacd1715b199050506a4da15896355d96700876b76c68826d304c' &&
      sha256('docs/exlib1b1-review-ledger.jsonl') === 'aa4fe77c0c633510661eede94b40e9bae4aca90a7d8c2794abde92c83c6f7b7b')
    check('A2: NOT-APPLIED boundary — migrations still exactly 001-025 with NO 026 in supabase/migrations/, the proposal present in docs/ instead, zero weight_time in src, no importer artifacts, seed module byte-identical to promoted main, and the range beyond the approved EXLIB-2D tip touches ONLY this phase\'s five paths',
      (() => {
        const files = readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).sort()
        if (files.length !== 25 || files.some((f) => f.startsWith('026'))) return false
        if (!existsSync(PROPOSAL)) return false
        if (execSync("grep -rl 'weight_time' src/ || true", { encoding: 'utf8' }).trim() !== '') return false
        if (existsSync('scripts/exlib1c-import.ts') || existsSync('src/lib/catalog-import.ts')) return false
        const seedNow = readFileSync('src/lib/supabase/seed-exercises.ts')
        const seedMain = execSync('git show cdba699ab68ba9cee2fd9331962b8b2060099862:src/lib/supabase/seed-exercises.ts', { encoding: 'buffer' as any }) as unknown as Buffer
        if (!seedNow.equals(seedMain)) return false
        const range = execSync(`git diff --name-only ${EXLIB2D_TIP}..HEAD`, { encoding: 'utf8' })
          .split('\n').filter(Boolean).sort()
        if (range.length === 0) return true // uncommitted review state
        return JSON.stringify(range) === JSON.stringify(PHASE_ALL)
      })())
    check('A3: ledger remains 48/48 pending-null, all 26 legacy candidates import-ineligible, and all 126 authored records pending/evidence-null/import-false/unpublished',
      (() => {
        const led = parseJsonl('docs/exlib1b1-review-ledger.jsonl')
        const cands = parseJsonl('docs/exlib1c0a-equipment-resolution.jsonl')
          .flatMap((r: any) => r.canonical_candidates)
        if (led.length !== 48 || !led.every((r: any) => r.status === 'pending' && r.reviewer === null)) return false
        if (cands.length !== 26 || !cands.every((c: any) => c.import_eligible === false)) return false
        const recs: any[] = []
        for (let i = 1; i <= 6; i += 1) recs.push(...parseJsonl(`docs/exlib2c-release1-batch0${i}-content.jsonl`))
        return recs.length === 126 && recs.every((r) =>
          r.content_review.status === 'pending' && r.content_review.reviewer === null &&
          r.import_eligible === false && !Object.keys(r).some((k) => k.includes('publication')))
      })())
    check('G1: lifecycle-safe phase boundary — exact five-path inventory (four new + the retargeted EXLIB-2D verifier), nothing staged; strict while uncommitted, adder-anchored once committed',
      (() => {
        try {
          const inHead = (() => {
            try { execSync(`git cat-file -e HEAD:${PROPOSAL}`, { stdio: 'pipe' }); return true } catch { return false }
          })()
          if (!inHead) {
            const entries = execSync('git status --porcelain', { encoding: 'utf8' })
              .split('\n').filter(Boolean).map((l) => l.trim()).sort()
            const expected = [...PHASE_NEW.map((f) => `?? ${f}`), `M ${D_VERIFIER}`].sort()
            if (JSON.stringify(entries) !== JSON.stringify(expected)) return false
            return execSync('git diff --cached --name-only', { encoding: 'utf8' }).trim() === ''
          }
          const adders = new Set<string>()
          for (const p of PHASE_NEW) {
            const a = execSync(`git log --all --format=%H --diff-filter=A -- ${p}`,
              { encoding: 'utf8' }).split('\n').filter(Boolean)
            if (a.length !== 1) return false
            adders.add(a[0])
          }
          if (adders.size !== 1) return false
          const phase = Array.from(adders)[0]
          execSync(`git merge-base --is-ancestor ${phase} HEAD`)
          execSync(`git merge-base --is-ancestor ${EXLIB2D_TIP} ${phase}`)
          const range = execSync(`git diff --name-only ${phase}^..${phase}`, { encoding: 'utf8' })
            .split('\n').filter(Boolean).sort()
          return JSON.stringify(range) === JSON.stringify(PHASE_ALL)
        } catch { return false }
      })())
  }

  console.log('\nB. Proposal structure and verbatim-carry construction')
  {
    check('B1: the correction table is tenant-scoped and client-inaccessible — PK (user_id, exercise_id), composite RESTRICT FK to exercises, RESTRICT FKs to the run and logical tables, RLS enabled with no client policies, and REVOKE ALL from PUBLIC/anon/authenticated',
      prop.includes('CREATE TABLE exercise_catalog_corrections (') &&
      prop.includes('PRIMARY KEY (user_id, exercise_id)') &&
      prop.includes('REFERENCES exercises (user_id, id) ON DELETE RESTRICT') &&
      prop.includes('REFERENCES exercise_catalog_import_runs (id) ON DELETE RESTRICT') &&
      prop.includes('REFERENCES exercise_catalog_logical (id) ON DELETE RESTRICT') &&
      prop.includes('ALTER TABLE exercise_catalog_corrections ENABLE ROW LEVEL SECURITY;') &&
      prop.includes('REVOKE ALL ON TABLE exercise_catalog_corrections\n  FROM PUBLIC, anon, authenticated;') &&
      !/CREATE POLICY[\s\S]{0,120}exercise_catalog_corrections/.test(prop))
    check('B2: REVISED (EXLIB-2E review 1) — exactly THREE function statements (the internal shared validation helper plus the two delivery/rollback replacements), the helper client-revoked, and no second public delivery entrypoint or new grants',
      (() => {
        const fns = Array.from(prop.matchAll(/CREATE (OR REPLACE )?FUNCTION (\w+)/g)).map((m) => m[2])
        if (JSON.stringify(fns) !== JSON.stringify(['exlib_plank_link_valid', 'deliver_catalog_exercises', 'rollback_catalog_delivery'])) return false
        if (!prop.includes('REVOKE ALL ON FUNCTION exlib_plank_link_valid(UUID, public.exercises, UUID, UUID, TEXT, UUID)\n  FROM PUBLIC, anon, authenticated;')) return false
        if (/GRANT\s/.test(prop)) return false
        return true
      })())
    check('B3: verbatim carry — 023\'s run gate, per-user advisory lock, generic insert block, raced-violation dispositions, alias phase, and rollback body fragments are byte-present in the proposal',
      (() => {
        const gate = `  SELECT * INTO v_run
  FROM public.exercise_catalog_import_runs
  WHERE run_key = p_run_key
    AND approved_for_delivery = true
    AND dry_run = false
    AND sealed_at IS NOT NULL
    AND revoked_at IS NULL;`
        if (!prop.includes(gate)) return false
        if (!prop.includes("PERFORM pg_advisory_xact_lock(hashtextextended(v_uid::text, 8231));")) return false
        const d023 = fnText(m023, 'deliver_catalog_exercises(p_run_key TEXT)')
        const insStart = d023.indexOf('    BEGIN\n      INSERT INTO public.exercises (')
        const insEnd = d023.indexOf('    END;', insStart) + '    END;'.length
        const genericInsert = d023.slice(insStart, insEnd)
        if (!prop.includes(genericInsert)) return false
        if (!prop.includes("-- ── Phase 2: the requested run's ALIAS members")) return false
        const r023 = fnText(m023, 'rollback_catalog_delivery(p_run_key TEXT)')
        const aliasPass = r023.slice(r023.indexOf('WITH updated_aliases AS ('), r023.indexOf('SELECT count(*) INTO v_alias_deactivated'))
        if (!prop.includes(aliasPass)) return false
        return true
      })())
    check('B4: 13-key report compatibility — 023 returns exactly the 13 known keys; the proposal returns the same 13 in the same order plus plank_disposition ONLY',
      (() => {
        const EXPECTED = ['run_key', 'eligible', 'inserted', 'skipped_already_delivered',
          'skipped_name_collision', 'collision_names', 'alias_inserted',
          'alias_added_to_existing', 'alias_already_delivered', 'alias_skipped_no_exercise',
          'alias_skipped_inactive_exercise', 'alias_skipped_collision', 'inserted_catalog_logical_ids']
        const oldKeys = returnKeys(fnText(m023, 'deliver_catalog_exercises(p_run_key TEXT)'))
        const newKeys = returnKeys(fnText(prop, 'deliver_catalog_exercises(p_run_key TEXT)'))
        return JSON.stringify(oldKeys) === JSON.stringify(EXPECTED) &&
          JSON.stringify(newKeys) === JSON.stringify([...EXPECTED, 'plank_disposition'])
      })())
    check('B5: REVISED (EXLIB-2E review 1) — Plank dispatch containment: identity-guarded dispatch, verified idempotency under FOR UPDATE through the ONE shared validation shape with STRICT run provenance (import_run_id = the delivering run) and the inconsistent-reconciliation abort, the raced logical-index winner validated by the SAME shape, the nine-part P2 predicate under lock, the atomic correction with its record, the deterministic single fallback, and NO rename mechanism',
      (() => {
        if (!prop.includes('IF v_plank_logical IS NOT NULL AND v_cat.logical_id = v_plank_logical THEN')) return false
        if (!prop.includes('inconsistent prior Plank reconciliation requires separate investigation')) return false
        // STRICT run invariant in the shared helper; the withdrawn
        // permissive any-existing-run predicate must be gone.
        if (!prop.includes('AND p_link.import_run_id = p_run_id')) return false
        if (prop.includes('v_linked.import_run_id IS NOT NULL')) return false
        if (/EXISTS \(SELECT 1 FROM public\.exercise_catalog_import_runs r2/.test(prop)) return false
        // ONE shared shape: definition + exactly two call sites, and
        // the dispatch no longer carries its own inline invariant copy.
        if ((prop.match(/exlib_plank_link_valid\(/g) ?? []).length !== 4) return false
        if (prop.includes('v_linked.tracking_mode')) return false
        const p2Pins = [
          "v_seed.name = 'Plank'", 'v_seed.is_system = true AND v_seed.is_active = true',
          'v_seed.notes IS NULL', "v_seed.equipment = 'bodyweight'",
          "v_seed.tracking_mode = 'bodyweight'", "v_seed.exercise_type = 'bodyweight'",
          "v_seed.category = 'isolation'", "v_seed.primary_muscle = 'abs'",
          'v_seed.unilateral = false', 'v_seed.catalog_id IS NULL',
          'v_seed.catalog_logical_id IS NULL', 'v_seed.import_run_id IS NULL',
          'FROM public.workout_exercises w', 'FROM public.workout_routine_exercises w',
          'FROM public.exercise_aliases a', "= 'obliques:secondary'",
          'INSERT INTO public.exercise_catalog_corrections']
        if (!p2Pins.every((p) => prop.includes(p))) return false
        if (!prop.includes("v_plank_name := v_cat.canonical_name || ' (timed)';")) return false
        const deliverNew = fnText(prop, 'deliver_catalog_exercises(p_run_key TEXT)')
        // FOR UPDATE used for both the linked-row validation and the seed lock
        if ((deliverNew.match(/FOR UPDATE;/g) ?? []).length < 2) return false
        // No rename mechanism anywhere in the proposal
        if (/UPDATE public\.exercises SET[\s\S]{0,200}?name\s*=/.test(prop)) return false
        return true
      })())
    check('B6: rollback exclusion — the correction-record NOT EXISTS predicate guards the found-count, the lock/dependent-alias set, and the deactivation sweep (three occurrences), with deactivate-only semantics preserved (no DELETE FROM exercises)',
      (() => {
        const rollbackNew = fnText(prop, 'rollback_catalog_delivery(p_run_key TEXT)')
        const excl = (rollbackNew.match(/NOT EXISTS \(SELECT 1 FROM public\.exercise_catalog_corrections cc/g) ?? []).length
        if (excl !== 3) return false
        if (!rollbackNew.includes('SET is_active = false')) return false
        if (/DELETE FROM public\.exercises/.test(rollbackNew)) return false
        return true
      })())
    check('B7: ADMISSION (EXLIB-2E review 1) — the catalog snapshot gate fails delivery closed before any Plank work unless the run\'s active approved Plank snapshot is timed with the exact approved anatomy multiset, and the raced-winner branch performs the locked shared-shape validation instead of an unconditional no-op',
      (() => {
        if (!prop.includes('malformed Plank catalog snapshot (expected timed tracking and the approved anatomy multiset); delivery fails closed')) return false
        if (!prop.includes("IS DISTINCT FROM 'timed'")) return false
        if (!prop.includes("<> 'lower_back:tertiary,obliques:secondary'")) return false
        const deliverNew = fnText(prop, 'deliver_catalog_exercises(p_run_key TEXT)')
        const raced = deliverNew.slice(deliverNew.indexOf("ELSIF v_constraint = 'exercises_user_catalog_logical_unique_idx' THEN"))
        const racedBlock = raced.slice(0, raced.indexOf('ELSE'))
        if (!racedBlock.includes('FOR UPDATE;')) return false
        if (!racedBlock.includes('exlib_plank_link_valid(')) return false
        if (!racedBlock.includes('RAISE EXCEPTION')) return false
        // the GENERIC (non-Plank) handler keeps its 023 behavior verbatim
        const generic = deliverNew.slice(deliverNew.indexOf('-- Concurrent duplicate delivery: already delivered.'))
        if (!generic.slice(0, 400).includes('v_skipped_existing := v_skipped_existing + 1;')) return false
        return true
      })())
  }

  console.log('\nC. Review record and consumer scan')
  {
    check('C1: the review record pins the construction method, schema posture, alias semantics, compatibility proof, dated consumer rescan, dependency map, and NOT-APPLIED boundaries; and the live consumer rescan still finds no application-code caller',
      recFlat.includes('extracting the migration-023 function texts VERBATIM') &&
      recFlat.includes('PRIMARY KEY (user_id, exercise_id)') &&
      recFlat.includes('RLS ENABLED with NO client policies') &&
      recFlat.includes('No 023 alias-reactivation semantic was changed') &&
      recFlat.includes('plus the single additive plank_disposition') &&
      recFlat.includes('rescanned 2026-08-31') &&
      recFlat.includes('recorded as a dated fact, not a permanent architectural invariant') &&
      recFlat.includes('move the byte-identical proposal into') &&
      recFlat.includes('Application by Joseph/ChatGPT ONLY') &&
      recFlat.includes('This package approves NOTHING and applies NOTHING') &&
      execSync("grep -rln 'deliver_catalog_exercises\\|rollback_catalog_delivery' src/ || true", { encoding: 'utf8' }).trim() === '')
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
