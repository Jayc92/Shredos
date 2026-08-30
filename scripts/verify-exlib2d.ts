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
    check('B3: the machine-readable matrix pins the full contract — canonical timed, all six populations with exactly one deterministic outcome each, no claim-model change, idempotency key, locking, rollback, every guarantee flag true, and the nonauthorization list',
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
        if (mach.populations.P2_pristine_unused_seed_row.preconditions.length !== 4) return false
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
          'no_delivery_bypass_of_claim_machinery', 'no_silent_rename', 'no_auto_delete_or_auto_archive',
          'stable_ids_preserved', 'tenant_safe_rls_preserved', 'idempotent_and_retry_safe',
          'rollback_defined', 'future_users_receive_timed_plank_after_coordinated_implementation',
          'legacy_retirement_is_user_initiated_only']
        if (!flags.every((f) => g[f] === true)) return false
        const na = (mach.not_authorized_here as string[]).join('|')
        return ['seed module edit', 'Plank content authoring', 'migration 026', 'catalog loading',
          'hosted contact', 'seed_link_compatible'].every((k) => na.includes(k))
      })())
    check('B4: the reconciliation record pins the repository evidence and the contract — claims survive deactivation, RESTRICT FKs, current-mode display reinterpretation hazard, P2 preconditions re-verified under lock, catalog-controlled distinguished naming with fail-closed skip, coordinated future-seed timing, user-initiated-only retirement, and explicit nonauthorization',
      recFlat.includes('SURVIVE DEACTIVATION') &&
      recFlat.includes('ON DELETE RESTRICT') &&
      recFlat.includes('CURRENT tracking_mode at display time') &&
      recFlat.includes('silently reinterprets that history') &&
      recFlat.includes('re-verified inside the transaction under SELECT ... FOR UPDATE') &&
      recFlat.includes("'Plank (timed)'") &&
      recFlat.includes('skipped fail-closed for that user and remains retryable') &&
      recFlat.includes('never an unbounded suffix search') &&
      recFlat.includes('no user row is ever renamed by the system') &&
      recFlat.includes('corrected to timed ONLY in the coordinated later implementation release') &&
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

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
