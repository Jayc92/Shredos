// EXLIB-2D verifier — Plank seed-reconciliation DESIGN (PLANNING
// ONLY; nothing implemented, loaded, approved, or applied).
//
// Proves: the exact source baseline and planning-only phase
// inventory; the live seed Plank still bodyweight/bodyweight and the
// seed module byte-identical to promoted main; the promoted catalog
// Plank still bodyweight/timed and seed_link_compatible:false with
// Plank unauthored; all six user populations carrying exactly one
// deterministic documented outcome; the chosen contract's
// no-reinterpretation / no-auto-merge / no-duplicate-claim /
// no-silent-rename / no-auto-delete / idempotency / locking /
// rollback / future-seed-timing rules pinned in both artifacts; all
// 126 ordinary records byte-unchanged and pending; the eight
// weight_time entries still deferred; migration 026 absent; zero
// weight_time implementation in src; ledger and legacy eligibility
// unchanged; no importer or loadable payload; and exact two-state
// lifecycle behavior. Performs NO hosted contact.
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

const RECORD = 'docs/exlib2d-plank-seed-reconciliation-record.md'
const MATRIX = 'docs/exlib2d-plank-reconciliation-matrix.md'
const VERIFIER = 'scripts/verify-exlib2d.ts'
const B6_VERIFIER = 'scripts/verify-exlib2c-batch06.ts'
const PHASE_NEW = [RECORD, MATRIX, VERIFIER].sort()
const PHASE_ALL = [...PHASE_NEW, B6_VERIFIER].sort()
const BATCH6_TIP = 'cdba699ab68ba9cee2fd9331962b8b2060099862'
const SEED = 'src/lib/supabase/seed-exercises.ts'

const recDoc = read(RECORD)
const recFlat = recDoc.replace(/\s+/g, ' ')
const matrixDoc = read(MATRIX)
const inv = parseJsonl('docs/exlib2b-release1-inventory.jsonl')

async function main(): Promise<void> {
  console.log('EXLIB-2D verification (Plank reconciliation design, planning only)')

  console.log('\nA. Baseline and phase boundary')
  {
    check('A1: Batch 1-6 content and promoted design artifacts remain byte-identical, and prior protected EXLIB artifacts hold',
      sha256('docs/exlib2c-release1-batch01-content.jsonl') === '8168fc196f89781e8a30b315f29d1c72f46afeff8edfe89d1812b0a150ece2b2' &&
      sha256('docs/exlib2c-release1-batch02-content.jsonl') === '1ddc3ab0bd92d60ef33960d82a8e0c8a2fdea1cb828d15fc9bf6a82c34305d48' &&
      sha256('docs/exlib2c-release1-batch03-content.jsonl') === 'e4fca8b632c9c9af9b7c6eece660f2042b6a4c3ef613e14c278f95cf9fcab528' &&
      sha256('docs/exlib2c-release1-batch04-content.jsonl') === 'e7def375e9b9560863796bff90746dc6ff2b2f7c4bd7735a3d53fc2cc9750568' &&
      sha256('docs/exlib2c-release1-batch05-content.jsonl') === '404722f1211e45c3b89ac8a32cceb617b958388c034b797dd2bba009aa127e5d' &&
      sha256('docs/exlib2c-release1-batch06-content.jsonl') === 'ec0760be401bb1d4c479d340369d6b6b690acf57f2f7a0f7fbeeaa2cf40ab5d7' &&
      sha256('docs/exlib2c-release1-batch01-style-standard.md') === '3bdf2f71a0be8aa41ce1a7b6ca149a1d33342b7ff8ea381c8e92686c030a75f1' &&
      sha256('docs/exlib2a-catalog-architecture-record.md') === 'de825ddf18260a877651e426c8436709257c9100e3dfcbd994e3b9e2496191d8' &&
      sha256('docs/exlib2b-release1-coverage-matrix.md') === 'c32b7b9e9d3aafab39a9a6d77db09349dd604457274767fe4c880c6bf1fb2fb0' &&
      sha256('docs/exlib2b-release1-inventory.jsonl') === 'd349110f22700a822eb427fc1dcce3e6dbcfd264b6d48ed84936b07b1ca256f5' &&
      sha256('docs/exlib2c-authoring-schema.json') === 'dddb872c7725c591e6d056e0dc73167d3c822f6245ebd2c759a045fecbd43c6e' &&
      sha256('supabase/migrations/025_exlib_equipment_vocabulary_support.sql') === 'fbda16f4d25cacd1715b199050506a4da15896355d96700876b76c68826d304c' &&
      sha256('docs/exlib1a-discovery-manifest.jsonl') === '336cd4253f747cdb3ba73ffa2af5a63e255c7c87cc452d4c43ed59a654673dfa' &&
      sha256('docs/exlib1b1-review-ledger.jsonl') === 'aa4fe77c0c633510661eede94b40e9bae4aca90a7d8c2794abde92c83c6f7b7b')
    check('A2: planning-only boundary — migration 026 absent, migrations exactly 001-025, zero weight_time in src, no importer artifacts, and the range beyond the Batch 6 tip touches ONLY this phase\'s four paths',
      (() => {
        const files = readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).sort()
        if (files.length !== 25 || files.some((f) => f.startsWith('026'))) return false
        if (execSync("grep -rl 'weight_time' src/ || true", { encoding: 'utf8' }).trim() !== '') return false
        if (existsSync('scripts/exlib1c-import.ts') || existsSync('src/lib/catalog-import.ts')) return false
        const range = execSync(`git diff --name-only ${BATCH6_TIP}..HEAD`, { encoding: 'utf8' })
          .split('\n').filter(Boolean).sort()
        if (range.length === 0) return true // uncommitted review state
        return JSON.stringify(range) === JSON.stringify(PHASE_ALL)
      })())
    check('A3: ledger remains 48/48 pending-null and all 26 legacy candidates remain import-ineligible',
      (() => {
        const led = parseJsonl('docs/exlib1b1-review-ledger.jsonl')
        const cands = parseJsonl('docs/exlib1c0a-equipment-resolution.jsonl')
          .flatMap((r: any) => r.canonical_candidates)
        return led.length === 48 &&
          led.every((r: any) => r.status === 'pending' && r.reviewer === null &&
            r.reviewed_at === null && r.decision_rationale === null) &&
          cands.length === 26 && cands.every((c: any) => c.import_eligible === false)
      })())
    check('G1: lifecycle-safe phase boundary — exact four-path inventory (three new + the retargeted Batch 6 verifier), nothing staged; strict while uncommitted, adder-anchored once committed',
      (() => {
        try {
          const inHead = (() => {
            try { execSync(`git cat-file -e HEAD:${RECORD}`, { stdio: 'pipe' }); return true } catch { return false }
          })()
          if (!inHead) {
            const entries = execSync('git status --porcelain', { encoding: 'utf8' })
              .split('\n').filter(Boolean).map((l) => l.trim()).sort()
            const expected = [...PHASE_NEW.map((f) => `?? ${f}`), `M ${B6_VERIFIER}`].sort()
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
          execSync(`git merge-base --is-ancestor ${BATCH6_TIP} ${phase}`)
          const range = execSync(`git diff --name-only ${phase}^..${phase}`, { encoding: 'utf8' })
            .split('\n').filter(Boolean).sort()
          return JSON.stringify(range) === JSON.stringify(PHASE_ALL)
        } catch { return false }
      })())
  }

  console.log('\nB. Mismatch facts and contract reconciliation')
  {
    check('B1: the LIVE seed Plank remains bodyweight/bodyweight, the seed module is byte-identical to promoted main, and the idempotent count-guard seeding model is unchanged',
      (() => {
        const seed = read(SEED)
        const plankLine = seed.split('\n').find((l) => l.includes('"Plank"'))
        if (!plankLine) return false
        if (!/tracking_mode:\s*"bodyweight"/.test(plankLine)) return false
        if (!/equipment:\s*"bodyweight"/.test(plankLine)) return false
        if (!seed.includes('seedExercisesIfNeeded')) return false
        if (!seed.includes('if (count && count > 0) return')) return false
        const promoted = execSync(`git show ${BATCH6_TIP}:${SEED}`, { encoding: 'utf8' })
        return promoted === seed
      })())
    check('B2: the promoted catalog Plank remains bodyweight/timed with seed_link_compatible:false, Plank is unauthored, ordinary authoring stays exactly 126/126, and the eight weight_time entries stay deferred',
      (() => {
        const plank = inv.find((r) => r.normalized_name === 'plank')
        if (!plank || plank.deferred !== false) return false
        if (plank.equipment !== 'bodyweight' || plank.tracking_mode !== 'timed') return false
        if (plank.seed_link_compatible !== false) return false
        const authored = new Set<string>()
        for (let i = 1; i <= 6; i += 1) {
          for (const r of parseJsonl(`docs/exlib2c-release1-batch0${i}-content.jsonl`)) {
            authored.add(r.proposed_canonical_name)
          }
        }
        if (authored.size !== 126 || authored.has('Plank')) return false
        const release = inv.filter((r) => !r.deferred)
        const remaining = release.filter((r) => !authored.has(r.proposed_canonical_name))
        return release.length === 127 &&
          remaining.length === 1 && remaining[0].proposed_canonical_name === 'Plank' &&
          inv.filter((r) => r.deferred).length === 8 &&
          inv.filter((r) => r.deferred).every((r) => r.tracking_mode === 'weight_time')
      })())
    check('B3: REVISED (EXLIB-2D reviews 2-4) — the machine-readable matrix pins the full corrected contract: canonical timed, all six populations, the NINE-part P2 predicate (exercise_type, all-null catalog provenance, zero aliases, exact seed-anatomy multiset, FK-chain zero-set proof, claim equality) with nonpristine-to-P5 routing, anatomy synchronization scoped to P2 only with all-or-nothing rollback, VERIFIED idempotency (locked nine-invariant validation before any no-op, fail-closed inconsistent-link disposition), distinguished-name refresh preservation with no automatic rename, the global seed_link_compatible transition rule, future-signup sequencing, every guarantee flag true, and the nonauthorization list',
      (() => {
        const m = matrixDoc.match(/```json\n([\s\S]*?)\n```/)
        if (!m) return false
        const mach = JSON.parse(m[1])
        if (mach.scope !== 'planning_and_product_definition_only') return false
        if (mach.canonical_tracking_mode !== 'timed') return false
        if (mach.mismatch.seed.tracking_mode !== 'bodyweight' ||
          mach.mismatch.catalog.tracking_mode !== 'timed' ||
          mach.mismatch.catalog.seed_link_compatible !== false) return false
        const pops = ['P1_future_never_seeded', 'P2_pristine_unused_seed_row',
          'P3_referenced_no_completed_sets', 'P4_completed_bodyweight_history',
          'P5_renamed_edited_archived_customized', 'P6_existing_plank_name_collision']
        if (Object.keys(mach.populations).length !== 6) return false
        for (const p of pops) {
          const pop = mach.populations[p]
          if (!pop || typeof pop.outcome !== 'string' || pop.outcome.length < 10) return false
        }
        const p2 = mach.populations.P2_pristine_unused_seed_row
        if (p2.preconditions.length !== 9) return false
        if (!String(p2.preconditions[0]).includes('structurally implies zero workout_sets')) return false
        if (!String(p2.preconditions[1]).includes('workout_routine_exercises')) return false
        if (!String(p2.preconditions[2]).includes("exercise_type='bodyweight'")) return false
        if (!String(p2.preconditions[3]).includes('catalog_id IS NULL')) return false
        if (!String(p2.preconditions[4]).includes('catalog_logical_id IS NULL')) return false
        if (!String(p2.preconditions[5]).includes('import_run_id IS NULL')) return false
        if (!String(p2.preconditions[6]).includes('tenant-authored identity state')) return false
        if (!String(p2.preconditions[7]).includes('exact multiset equality')) return false
        if (!String(p2.preconditions[7]).includes('routes it to P5')) return false
        if (!String(p2.preconditions[8]).includes("claim_source='exercise'")) return false
        if (!String(p2.nonpristine_routing).includes('never mutated')) return false
        const vi = mach.transaction_and_idempotency.verified_idempotency
        if (!String(vi.lookup).includes('BEFORE evaluating the old bodyweight-seed predicate')) return false
        if (!String(vi.if_present).includes('SELECT ... FOR UPDATE')) return false
        if (vi.invariants.length !== 9) return false
        if (!vi.invariants.some((i: string) => i.includes("tracking_mode='timed'"))) return false
        if (!vi.invariants.some((i: string) => i.includes("exercise_type='mobility'"))) return false
        if (!vi.invariants.some((i: string) => i.includes('expected authorized run'))) return false
        if (!vi.invariants.some((i: string) => i.includes('UNIQUE (user_id, catalog_logical_id)'))) return false
        if (!String(vi.on_valid).includes('fully valid completed state')) return false
        if (!String(vi.on_invalid).includes('inconsistent prior reconciliation')) return false
        if (!String(vi.on_invalid).includes('Never silently repair')) return false
        if (JSON.stringify(vi.applies_to) !== JSON.stringify(['corrected P2 row', 'separately delivered distinguished row'])) return false
        if (!String(mach.transaction_and_idempotency.idempotency_key).includes('no-ops ONLY if every invariant passes')) return false
        if (!String(mach.transaction_and_idempotency.idempotency_key).includes('fails closed as an inconsistent prior reconciliation')) return false
        const dep = mach.exercise_id_dependency_inventory
        if (dep.fk_references.length !== 4 || dep.non_fk_references.length !== 1) return false
        if (!String(dep.non_fk_references[0].closure).includes('claim-holder equality')) return false
        const edc = mach.existing_delivery_contract
        if (!String(edc.entrypoint).includes('deliver_catalog_exercises(p_run_key TEXT)')) return false
        if (!String(edc.lock).includes('hashtextextended')) return false
        if (!String(edc.run_gating).includes('revoked_at IS NULL')) return false
        if (!String(edc.canonical_name_behavior).includes('v_cat.canonical_name')) return false
        if (!String(edc.current_plank_limitation).includes('skipped_collision')) return false
        if (!String(edc.current_plank_limitation).includes('narrowly reviewed extension')) return false
        const idg = mach.integration_design
        if (!String(idg.single_public_entrypoint).includes('ONE public tenant delivery entrypoint')) return false
        if (!String(idg.no_second_entrypoint).includes('divergent')) return false
        if (!String(idg.non_plank_unchanged).includes('authorization, selection, mutation, collision, idempotency, alias, provenance, and rollback semantics remain unchanged')) return false
        const rc = idg.report_compatibility
        if (rc.existing_jsonb_keys.length !== 13) return false
        if (!String(rc.rule).includes('ADDITIVE ONLY')) return false
        if (!String(rc.rule).includes('removed, renamed, repurposed, or type-changed')) return false
        if (!String(rc.fallback_isolation).includes('must not affect selection or mutation behavior')) return false
        if (!String(rc.repository_consumers).includes('no application-code caller')) return false
        if (!String(idg.fallback_scope).includes('never generalize')) return false
        if (idg.reporting_dispositions.length !== 7) return false
        const rbp = mach.rollback_provenance
        if (!String(rbp.discriminator_evidence).includes('is_system=true')) return false
        if (!String(rbp.mechanism).includes('correction record')) return false
        if (!String(rbp.mechanism).includes('EXCLUDE correction-recorded rows')) return false
        if (!String(rbp.p2_reversibility).includes('NON-REVERSIBLE')) return false
        if (!String(rbp.never_deleted).includes('is_active=false')) return false
        const sync = p2.anatomy_synchronization
        if (JSON.stringify(sync.target) !== JSON.stringify([['obliques', 'secondary'], ['lower_back', 'tertiary']])) return false
        if (!String(sync.rollback).includes('all or nothing')) return false
        if (JSON.stringify(sync.permitted_populations) !== JSON.stringify(['P2_pristine_unused_seed_row'])) return false
        if (sync.forbidden_populations.length !== 4) return false
        const rs = mach.claims_and_collision_design.refresh_semantics
        if (!String(rs.specializes).includes('SKIPPED (not forced) on collision')) return false
        if (rs.never_force_canonical !== true || rs.name_collision_never_fails_whole_refresh !== true) return false
        if (!String(rs.no_automatic_rename_when_canonical_freed).includes('user-initiated rename')) return false
        if (!String(rs.idempotent_recognition).includes('catalog_logical_id')) return false
        if (!String(mach.claims_and_collision_design.model_change_justification).includes('deterministically re-derivable')) return false
        if (!String(mach.seed_link_compatible_transition).includes('never a per-user outcome')) return false
        if (!String(mach.future_signup_sequencing).includes('replaces bare-15 seeding')) return false
        if (!String(mach.future_signup_sequencing).includes('prohibited intermediate states')) return false
        if (mach.claims_and_collision_design.model_change_required !== false) return false
        if (!String(mach.claims_and_collision_design.rule).includes("'Plank (timed)'")) return false
        if (!String(mach.claims_and_collision_design.rule).includes('No unbounded suffix search')) return false
        const t = mach.transaction_and_idempotency
        if (!String(t.idempotency_key).includes('(user_id, catalog_logical_id)')) return false
        if (!String(t.lock).includes('FOR UPDATE')) return false
        if (!String(t.rollback).includes('aborts the transaction')) return false
        const g = mach.guarantees
        const flags = ['no_silent_history_reinterpretation', 'no_bodyweight_data_rewritten_as_duration',
          'no_automatic_merge_across_tracking_modes', 'no_duplicate_normalized_claim',
          'no_delivery_bypass_of_claim_machinery', 'no_silent_rename',
          'no_automatic_rename_when_canonical_freed', 'no_auto_delete_or_auto_archive',
          'stable_ids_preserved', 'tenant_safe_rls_preserved', 'idempotent_and_retry_safe',
          'rollback_defined', 'anatomy_synchronized_only_in_P2',
          'zero_workout_references_structurally_imply_zero_sets',
          'linked_rows_never_disagree_with_catalog_anatomy',
          'alias_presence_is_nonpristine',
          'existing_link_no_op_only_after_full_validation',
          'malformed_links_abort_fail_closed',
          'single_public_delivery_entrypoint',
          'p2_rows_excluded_from_generic_rollback_deactivation',
          'run_revocation_never_reinterprets_existing_data',
          'rollback_deactivates_only_never_deletes',
          'future_users_receive_timed_plank_after_coordinated_implementation',
          'legacy_retirement_is_user_initiated_only']
        if (!flags.every((f) => g[f] === true)) return false
        const na = (mach.not_authorized_here as string[]).join('|')
        return ['seed module edit', 'Plank content authoring', 'migration 026', 'catalog loading',
          'hosted contact', 'seed_link_compatible'].every((k) => na.includes(k))
      })())
    check('B4: REVISED (EXLIB-2D reviews 2-4) — the reconciliation record pins the evidence and corrected contract: claims survive deactivation, RESTRICT FKs, current-mode reinterpretation hazard, the FK-chain zero-set proof, the complete dependency closure with exact table names, the nine-part P2 predicate (exercise_type, null provenance, zero aliases with the tenant-authored rationale, anatomy multiset, claim equality) with nonpristine-to-P5 routing, P2 anatomy synchronization with full rollback, verified idempotency with fail-closed inconsistent-link disposition, distinguished-name refresh specialization with no automatic rename, global seed_link_compatible transition, delivery-replaces-seeding sequencing, user-initiated-only retirement, and explicit nonauthorization',
      recFlat.includes('SURVIVE DEACTIVATION') &&
      recFlat.includes('ON DELETE RESTRICT') &&
      recFlat.includes('CURRENT tracking_mode at display time') &&
      recFlat.includes('silently reinterprets that history') &&
      recFlat.includes('re-verified inside the transaction under SELECT ... FOR UPDATE') &&
      recFlat.includes('structurally implies zero workout_sets rows') &&
      recFlat.includes('workout_routine_exercises (004, RESTRICT)') &&
      recFlat.includes('exercise_aliases (023, composite (user_id, id), CASCADE)') &&
      recFlat.includes('validated by the claim-holder equality precondition rather than a separate count') &&
      recFlat.includes("exercise_type='bodyweight'") &&
      recFlat.includes('catalog_id IS NULL; (5) catalog_logical_id IS NULL; (6) import_run_id IS NULL') &&
      recFlat.includes('zero exercise_aliases rows attached to the candidate exercise, regardless of active state or provenance') &&
      recFlat.includes('aliases are tenant-authored identity state') &&
      recFlat.includes('routes the row to P5/customized-or-nonpristine handling; the row is never mutated') &&
      recFlat.includes('verified as a complete valid reconciliation outcome before any no-op') &&
      recFlat.includes('Only a fully valid completed state may no-op') &&
      recFlat.includes('inconsistent prior reconciliation requiring separate investigation') &&
      recFlat.includes('never silently repairing, relinking, overwriting anatomy, renaming, or treating it as success') &&
      recFlat.includes('applies identically to a corrected P2 row and to a separately delivered distinguished row') &&
      !recFlat.includes('no-ops if the logical identity is already linked') &&
      recFlat.includes('Migration 023 ALREADY IMPLEMENTS tenant catalog delivery') &&
      recFlat.includes('deliver_catalog_exercises(p_run_key TEXT) RETURNS JSONB') &&
      recFlat.includes('pg_advisory_xact_lock(hashtextextended(v_uid::text, 8231))') &&
      recFlat.includes('inserts v_cat.canonical_name') &&
      recFlat.includes('that statement was false and is withdrawn') &&
      recFlat.includes('NARROWLY REVIEWED EXTENSION of this existing contract') &&
      recFlat.includes('remains the ONE public tenant delivery entrypoint') &&
      recFlat.includes('must NOT create a second public tenant delivery entrypoint') &&
      recFlat.includes('never generalize into an arbitrary renaming scheme') &&
      recFlat.includes('no existing column distinguishes a corrected preexisting row from a run-inserted row') &&
      recFlat.includes('EXCLUDE correction-recorded rows') &&
      recFlat.includes('intentionally NON-REVERSIBLE after successful commit') &&
      recFlat.includes('halts future delivery but never reinterprets existing P2 data') &&
      !recFlat.includes('NO delivery function is implemented yet') &&
      recFlat.includes('authorization, selection, mutation, collision, idempotency, alias, provenance, and rollback semantics remain unchanged') &&
      recFlat.includes('extensions are additive only; no existing key may be removed, renamed, repurposed, or type-changed') &&
      recFlat.includes('no application code calls deliver_catalog_exercises or rollback_catalog_delivery today') &&
      recFlat.includes('no-ops ONLY if every invariant passes; otherwise it fails closed as an inconsistent prior reconciliation') &&
      !recFlat.includes('byte-unchanged, and the distinguished fallback') &&
      recFlat.includes('exactly equals the expected live seed anatomy {(obliques, secondary)}') &&
      recFlat.includes('ANY anatomy difference classifies the row as customized and routes it to P5') &&
      recFlat.includes('atomically replace the seed-owned exercise_muscles rows with the exact active approved catalog snapshot') &&
      recFlat.includes('{(obliques, secondary), (lower_back, tertiary)}') &&
      recFlat.includes('rolls back the ENTIRE correction') &&
      recFlat.includes('Anatomy synchronization is permitted ONLY here in P2') &&
      recFlat.includes('BEFORE evaluating the old bodyweight-seed predicate') &&
      recFlat.includes('SPECIALIZES — not contradicts') &&
      recFlat.includes('never fails the whole refresh solely because the canonical name collides') &&
      recFlat.includes('does not trigger any automatic rename') &&
      recFlat.includes('GLOBAL promoted-artifact fact, never a per-user outcome') &&
      recFlat.includes('full-catalog delivery replaces bare-15 seeding') &&
      !recFlat.includes('byte-match') &&
      !recFlat.includes('where the P2 path applies') &&
      recFlat.includes("'Plank (timed)'") &&
      recFlat.includes('skipped fail-closed for that user and remains retryable') &&
      recFlat.includes('never an unbounded suffix search') &&
      recFlat.includes('no user row is ever renamed by the system') &&
      recFlat.includes('corrected in the SAME atomic release, purely as compatibility/fallback cleanup') &&
      recFlat.includes('Retirement of the legacy row is user-initiated only') &&
      recFlat.includes('Nothing is ever auto-deleted, auto-archived, or auto-renamed') &&
      recFlat.includes('UNIQUE (user_id, catalog_logical_id) index IS the idempotency key') &&
      recFlat.includes('This record approves NOTHING'))
    check('B5: all 126 authored records remain pending, evidence-null, import_eligible:false, and unpublished (live parse, not just fingerprints)',
      (() => {
        const recs: any[] = []
        for (let i = 1; i <= 6; i += 1) recs.push(...parseJsonl(`docs/exlib2c-release1-batch0${i}-content.jsonl`))
        return recs.length === 126 &&
          recs.every((r) => JSON.stringify(r.content_review) ===
            JSON.stringify({ status: 'pending', reviewer: null, reviewed_at: null, rationale: null }) &&
            r.import_eligible === false &&
            !Object.keys(r).some((k) => k.includes('publication')))
      })())
    check('B6: zero runtime/product/schema/API/UI/dependency/configuration changes — the phase range never touches src/, supabase/, package files, or config',
      (() => {
        const range = execSync(`git diff --name-only ${BATCH6_TIP}..HEAD`, { encoding: 'utf8' })
          .split('\n').filter(Boolean)
        return range.every((p) => !/^(src\/|package|supabase\/|next\.config|tsconfig|\.env|public\/)/.test(p))
      })())
  }

  console.log('\nC. Review-1 anatomy integrity')
  {
    check('C1: ADMISSION (EXLIB-2D review 1) — the seed/catalog anatomy difference is proven mechanically from the live artifacts, and the matrix mirrors it exactly: the live seed Plank anatomy is exactly {(obliques, secondary)}, the promoted catalog Plank anatomy is exactly {(obliques, secondary), (lower_back, tertiary)}, the sole delta is the catalog-only lower_back/tertiary row, and the matrix mismatch/delta/synchronization-target fields equal the parsed values',
      (() => {
        const seed = read('src/lib/supabase/seed-exercises.ts')
        const plankBlock = seed.split('\n').filter((l) => l.includes('"Plank"') ||
          (seed.split('\n').indexOf(l) === seed.split('\n').findIndex((x) => x.includes('"Plank"')) + 1))
        const plankIdx = seed.indexOf('{ name: "Plank"')
        if (plankIdx < 0) return false
        const plankSrc = seed.slice(plankIdx, seed.indexOf('}', seed.indexOf('muscle_targets', plankIdx)) + 1)
        const seedTargets = Array.from(plankSrc.matchAll(/\{ muscle: "(\w+)", role: "(\w+)" \}/g))
          .map((m) => [m[1], m[2]])
        if (JSON.stringify(seedTargets) !== JSON.stringify([['obliques', 'secondary']])) return false
        const plank = inv.find((r) => r.normalized_name === 'plank')
        const catTargets = plank.muscle_targets.map((t: any) => [t.muscle, t.role])
        if (JSON.stringify(catTargets) !== JSON.stringify([['obliques', 'secondary'], ['lower_back', 'tertiary']])) return false
        const m = matrixDoc.match(/```json\n([\s\S]*?)\n```/)
        if (!m) return false
        const mach = JSON.parse(m[1])
        if (JSON.stringify(mach.mismatch.seed.anatomy) !== JSON.stringify(seedTargets)) return false
        if (JSON.stringify(mach.mismatch.catalog.anatomy) !== JSON.stringify(catTargets)) return false
        if (JSON.stringify(mach.anatomy_delta.catalog_only) !== JSON.stringify([['lower_back', 'tertiary']])) return false
        if (JSON.stringify(mach.anatomy_delta.seed_only) !== JSON.stringify([])) return false
        if (JSON.stringify(mach.populations.P2_pristine_unused_seed_row.anatomy_synchronization.target) !==
          JSON.stringify(catTargets)) return false
        return true
      })())
  }

  console.log('\nD. Review-2 dependency and idempotency integrity')
  {
    check('D1: ADMISSION (EXLIB-2D review 2) — the exercises.id dependency inventory is reproduced mechanically from the migrations and matches the matrix exactly (workout_exercises, workout_routine_exercises, exercise_muscles, exercise_aliases as the only FK referencers, exercise_name_claims as the only non-FK reference closed by the claim precondition), and the verified-idempotency contract leaves no unconditional no-op path',
      (() => {
        const hits = execSync("grep -rln 'REFERENCES exercises' supabase/migrations/*.sql", { encoding: 'utf8' })
          .split('\n').filter(Boolean).sort()
        const tables = new Set<string>()
        for (const f of hits) {
          const src = read(f)
          const lines = src.split('\n')
          let lastTable = ''
          for (const l of lines) {
            const t = l.match(/CREATE TABLE (\w+)/)
            if (t) lastTable = t[1]
            if (l.includes('REFERENCES exercises')) tables.add(lastTable)
          }
        }
        const expected = ['exercise_aliases', 'exercise_muscles', 'workout_exercises', 'workout_routine_exercises']
        if (JSON.stringify(Array.from(tables).sort()) !== JSON.stringify(expected)) return false
        const claims = read('supabase/migrations/023_exlib_catalog_and_delivery_contract.sql')
        if (!claims.includes('CREATE TABLE exercise_name_claims')) return false
        const m = matrixDoc.match(/```json\n([\s\S]*?)\n```/)
        if (!m) return false
        const mach = JSON.parse(m[1])
        const fkNames = mach.exercise_id_dependency_inventory.fk_references
          .map((r: any) => r.table).sort()
        if (JSON.stringify(fkNames) !== JSON.stringify(expected)) return false
        if (mach.exercise_id_dependency_inventory.non_fk_references[0].table !== 'exercise_name_claims') return false
        const flat = matrixDoc.replace(/\s+/g, ' ')
        if (flat.includes('no-ops if the logical identity is already linked')) return false
        if (!flat.includes('lock the linked row with SELECT ... FOR UPDATE and validate the complete reconciliation outcome before any no-op')) return false
        return true
      })())
  }

  console.log('\nE. Review-3 delivery-contract integrity')
  {
    check('E1: ADMISSION (EXLIB-2D review 3) — the existing 023 delivery contract is proven mechanically from committed SQL (deliver_catalog_exercises(p_run_key TEXT), auth.uid scoping, per-user advisory lock, sealed/approved/unrevoked run gating, (user_id, catalog_logical_id) idempotency, canonical-name insertion with collision skip, alias phase, rollback_catalog_delivery deactivate-only, revoke/seal functions, delete gate, is_system=true on delivered inserts), and the design preserves one public entrypoint with P2 rows excluded from generic rollback while inserted rows keep existing rollback behavior',
      (() => {
        const sql = read('supabase/migrations/023_exlib_catalog_and_delivery_contract.sql')
        if (!sql.includes('CREATE OR REPLACE FUNCTION deliver_catalog_exercises(p_run_key TEXT)')) return false
        if (!sql.includes('PERFORM pg_advisory_xact_lock(hashtextextended(v_uid::text, 8231));')) return false
        if (!sql.includes('AND approved_for_delivery = true') ||
          !sql.includes('AND sealed_at IS NOT NULL') ||
          !sql.includes('AND revoked_at IS NULL')) return false
        if (!/WHERE e\.user_id = v_uid AND e\.catalog_logical_id = v_cat\.logical_id/.test(sql)) return false
        if (!/v_uid, v_cat\.canonical_name, v_cat\.category, v_cat\.primary_muscle/.test(sql)) return false
        if (!sql.includes('v_skipped_collision := v_skipped_collision + 1;')) return false
        if (!sql.includes('true, true, v_cat.id, v_cat.logical_id, v_run.id')) return false
        if (!sql.includes('CREATE OR REPLACE FUNCTION rollback_catalog_delivery(p_run_key TEXT)')) return false
        if (!sql.includes('CREATE OR REPLACE FUNCTION exlib_revoke_run_delivery(p_run_key TEXT)')) return false
        if (!sql.includes('CREATE OR REPLACE FUNCTION exlib_approve_and_seal_run(p_run_key TEXT)')) return false
        if (!sql.includes('CREATE TRIGGER exercises_delivered_delete_gate_trigger')) return false
        const rb = sql.slice(sql.indexOf('CREATE OR REPLACE FUNCTION rollback_catalog_delivery'))
        const rbBody = rb.slice(0, rb.indexOf('$$;'))
        if (!rbBody.includes('SET is_active = false')) return false
        if (/DELETE FROM public\.exercises/.test(rbBody)) return false
        if (recFlat.includes('NO delivery function is implemented yet')) return false
        const m = matrixDoc.match(/```json\n([\s\S]*?)\n```/)
        if (!m) return false
        const mach = JSON.parse(m[1])
        if (mach.guarantees.single_public_delivery_entrypoint !== true) return false
        if (mach.guarantees.p2_rows_excluded_from_generic_rollback_deactivation !== true) return false
        if (!String(mach.rollback_provenance.inserted_rows).includes('EXISTING rollback behavior unchanged')) return false
        return true
      })())
  }

  console.log('\nF. Review-4 report compatibility and no-op qualification')
  {
    check('F1: ADMISSION (EXLIB-2D review 4) — the existing deliver_catalog_exercises JSONB key set is extracted mechanically from the 023 RETURN and matches the matrix exactly; no application-code consumer exists (scan reproduced); and NO sentence in either artifact states a linked-row no-op without the full-validation qualification, under a wording-resistant sentence scan rather than one exact negative phrase',
      (() => {
        const sql = read('supabase/migrations/023_exlib_catalog_and_delivery_contract.sql')
        const start = sql.indexOf('CREATE OR REPLACE FUNCTION deliver_catalog_exercises')
        const body = sql.slice(start, sql.indexOf('$$;', start))
        const ret = body.slice(body.lastIndexOf('RETURN jsonb_build_object'))
        const keys = Array.from(ret.matchAll(/'(\w+)',/g)).map((m) => m[1])
        const EXPECTED = ['run_key', 'eligible', 'inserted', 'skipped_already_delivered',
          'skipped_name_collision', 'collision_names', 'alias_inserted',
          'alias_added_to_existing', 'alias_already_delivered', 'alias_skipped_no_exercise',
          'alias_skipped_inactive_exercise', 'alias_skipped_collision', 'inserted_catalog_logical_ids']
        if (JSON.stringify(keys) !== JSON.stringify(EXPECTED)) return false
        const m = matrixDoc.match(/```json\n([\s\S]*?)\n```/)
        if (!m) return false
        const mach = JSON.parse(m[1])
        if (JSON.stringify(mach.integration_design.report_compatibility.existing_jsonb_keys) !==
          JSON.stringify(EXPECTED)) return false
        for (const k of EXPECTED) {
          if (!recFlat.includes(k)) return false
        }
        const consumers = execSync(
          "grep -rln 'deliver_catalog_exercises\\|rollback_catalog_delivery' src/ || true",
          { encoding: 'utf8' }).trim()
        if (consumers !== '') return false
        const matFlat = matrixDoc.replace(/\s+/g, ' ')
        const QUALIFIED = /(only if every invariant passes|fully valid|complete valid|validates the complete)/i
        for (const text of [recFlat, matFlat]) {
          for (const sentence of text.split(/[.;]/)) {
            if (/no-?ops?\b/i.test(sentence) && /(link|idempot)/i.test(sentence) &&
              !QUALIFIED.test(sentence)) return false
          }
        }
        return true
      })())
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
