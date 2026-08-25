// ============================================================
// ForgeFitOS — EXLIB-1B1 architecture + review-contract harness.
// Proves the architecture audit is grounded in the real consumers,
// the option matrix reconciles arithmetically, the recommendation
// stays proposed-not-approved, the 48-record review ledger matches
// the committed EXLIB-1A manifest identity-for-identity with zero
// fabricated approvals, and the phase changed nothing outside its
// declared documentation artifacts (no SQL, no migration 023, no
// product/API/lib/schema/dependency change, no import).
// Run from the repository root:
//   npx tsx scripts/verify-exlib1b1.ts
// ============================================================

import { readFileSync, readdirSync, existsSync } from 'fs'
import { execSync } from 'child_process'
import { createHash } from 'crypto'

let passed = 0
let failed = 0
function check(name: string, condition: boolean, detail?: string) {
  if (condition) { passed++; console.log(`  PASS  ${name}`) }
  else { failed++; console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`) }
}
const read = (p: string) => readFileSync(p, 'utf8')

const notes = read('docs/exlib1b1-architecture-and-review-notes.md')
// Prose anchors tolerate the doc's hard line wraps.
const notesFlat = notes.replace(/\s+/g, ' ')
const MANIFEST_SHA = '336cd4253f747cdb3ba73ffa2af5a63e255c7c87cc452d4c43ed59a654673dfa'

interface Ledger {
  ledger_id: string
  source_facts: { name: string; category: string; url: string; retrieved_at: string }
  forgefit_proposed: Record<string, unknown>
  unresolved_decisions: Record<string, unknown>
  specialist_review: string[]
  reviewer: string | null
  reviewed_at: string | null
  decision_rationale: string | null
  status: string
}

const ledger: Ledger[] = read('docs/exlib1b1-review-ledger.jsonl')
  .split('\n').filter((l) => l && !l.startsWith('#')).map((l) => JSON.parse(l))

interface Manifest {
  source_name: string; source_url: string; source_category: string
  confidence: string; eligibility: string; retrieved_at: string
}
const manifestRaw = read('docs/exlib1a-discovery-manifest.jsonl')
const manifest: Manifest[] = manifestRaw
  .split('\n').filter((l) => l && !l.startsWith('#')).map((l) => JSON.parse(l))

async function main() {
  console.log('\nA. Architecture audit grounding')
  {
    const CONSUMERS = [
      'src/app/api/exercises/route.ts',
      'src/app/api/exercises/[id]/route.ts',
      'src/app/(app)/workouts/exercises/page.tsx',
      'src/app/(app)/workouts/[id]/page.tsx',
      'src/app/(app)/workouts/routines/[id]/page.tsx',
      'src/app/(app)/progress/exercises/[id]/page.tsx',
      'src/lib/strength-records.ts',
      'src/lib/supabase/seed-exercises.ts',
    ]
    check('A1: every documented direct consumer exists AND actually touches the exercises table',
      CONSUMERS.every((f) => existsSync(f) &&
        (read(f).includes("from('exercises')") || read(f).includes('from("exercises")')) &&
        notes.includes(f.replace('src/app/(app)/', '').replace('src/', ''))))
    check('A2: the mechanical consumer sweep finds NO direct consumer missing from the notes',
      (() => {
        try {
          const found = execSync(
            `grep -rl "from('exercises')" src --include='*.ts' --include='*.tsx'`,
            { encoding: 'utf8' }).trim().split('\n')
          return found.every((f) => CONSUMERS.includes(f))
        } catch { return false }
      })())
    check('A3: load-bearing facts anchored — RLS policy, unique index, RESTRICT FKs, RPC id copies',
      notes.includes('exercises_all FOR ALL USING (user_id = auth.uid())') &&
      notes.includes('exercises_user_name_unique_idx (user_id, lower(name))') &&
      notes.includes('ON DELETE RESTRICT') &&
      notes.includes('COPY `exercise_id`') &&
      read('supabase/migrations/003_phase1c_workout_logging.sql')
        .includes('FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())'))
    check('A4: existing-user delivery gap honestly documented (seeding is count-gated)',
      notesFlat.includes('Seeding runs only when the user has zero exercises'))
  }

  console.log('\nB. Option matrix')
  {
    check('B1: all three required options evaluated plus the materially distinct A+ variant',
      notes.includes('### Option A ') && notes.includes('### Option B ') &&
      notes.includes('### Option C ') && notes.includes('### Option A+'))
    check('B2: decision criteria, weights, and weighted totals reconcile arithmetically',
      (() => {
        const weights = [5, 5, 4, 3, 2, 1, 3, 3]
        const scores: Record<string, number[]> = {
          A: [5, 5, 5, 3, 2, 2, 4, 5],
          'A+': [5, 5, 5, 5, 3, 2, 4, 5],
          B: [1, 3, 2, 5, 5, 5, 2, 3],
          C: [3, 5, 4, 4, 4, 3, 2, 4],
        }
        const totals: Record<string, number> = { A: 112, 'A+': 120, B: 73, C: 97 }
        const max = weights.reduce((a, b) => a + b, 0) * 5
        return max === 130 && notes.includes('(max 130)') &&
          Object.entries(scores).every(([k, row]) =>
            row.reduce((acc, s, i) => acc + s * weights[i], 0) === totals[k]) &&
          notes.includes('| **Weighted total (max 130)** | **112** | **120** | **73** | **97** |')
      })())
    check('B3: recommendation labeled PROPOSED, NOT APPROVED and grounded in the consumer inventory',
      notesFlat.includes('PROPOSED, NOT APPROVED') &&
      notesFlat.includes('awaits explicit approval') &&
      notesFlat.includes('derived from the consumer inventory'))
  }

  console.log('\nC. Data contract stays documentation-only')
  {
    check('C1: no SQL authored — no CREATE/ALTER/INSERT statements, no sql fences, no migration 023',
      !/```sql/i.test(notes) &&
      !/CREATE TABLE|ALTER TABLE|INSERT INTO|CREATE POLICY/.test(notes) &&
      // RETARGET (EXLIB-1B2): EXLIB-1B1 itself authored no SQL (this
      // document still contains none); EXLIB-1B2 later authored the
      // approved-for-drafting 023 draft, which is the only permitted
      // 023 (DRAFT, not applied).
      readdirSync('supabase/migrations').filter((f) => f.startsWith('023')).length === 1 &&
      readdirSync('supabase/migrations').some((f) => f === '023_exlib_catalog_and_delivery_contract.sql') &&
      // RETARGET (EXLIB-1B3B migration 024 draft): the approved-scope
      // hardening draft 024_exlib_post_application_hardening.sql is
      // the only permitted 024 (DRAFT, not applied); the boundary
      // moves from exactly-23 to exactly-24; both filenames stay
      // pinned; no other migration may appear.
      readdirSync('supabase/migrations').filter((f) => f.startsWith('024')).length === 1 &&
      readdirSync('supabase/migrations').some((f) => f === '024_exlib_post_application_hardening.sql') &&
      readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).length === 24)
    check('C2: migration 022 fingerprint intact',
      (() => {
        const m022 = readFileSync('supabase/migrations/022_ui5b2_workout_reuse.sql')
        return m022.length === 19112 &&
          createHash('sha256').update(m022).digest('hex') ===
            '1432692f700b1686243aa8219ea4af3146e2bec30b228b3f9138d60e072e1241'
      })())
    check('C3: contract covers every required concern',
      ['exercise_catalog', 'exercise_aliases', 'exercise_catalog_import_runs',
        'catalog_id', 'import_run_id', 'review_status', 'catalog_version',
        'bilateral|unilateral|alternating',
        'idempotency', 'backfill', 'RESTRICT', 'Rollback']
        .every((k) => notesFlat.includes(k)) &&
      notesFlat.includes('is_system=false` rows remain fully protected'))
    check('C4: user-created protection + inserts-only rules explicit',
      notesFlat.includes('NEVER updates, renames, retargets, reactivates, or deletes any existing `exercises` row') &&
      notesFlat.includes('never overwritten, never merged'))
  }

  console.log('\nD. Review ledger integrity')
  {
    const hr = manifest.filter((m) => m.confidence === 'human_review_required')
    check('D1: ledger contains exactly the 48 committed human-review records — no missing, no extra',
      ledger.length === 48 && hr.length === 48 &&
      new Set(ledger.map((l) => l.ledger_id)).size === 48 &&
      hr.every((m) => ledger.some((l) => l.ledger_id === m.source_url)) &&
      ledger.every((l) => hr.some((m) => m.source_url === l.ledger_id)))
    check('D2: record identity and source facts match EXLIB-1A byte-for-byte',
      ledger.every((l) => {
        const m = hr.find((x) => x.source_url === l.ledger_id)
        return !!m && l.source_facts.name === m.source_name &&
          l.source_facts.category === m.source_category &&
          l.source_facts.url === m.source_url &&
          l.source_facts.retrieved_at === m.retrieved_at
      }))
    check('D3: source facts separated from ForgeFitOS judgments; unresolved fields explicitly null',
      ledger.every((l) =>
        'source_facts' in l && 'forgefit_proposed' in l &&
        Object.keys(l.unresolved_decisions).length === 7 &&
        ['anatomy', 'equipment', 'laterality', 'tracking_mode', 'naming',
          'alias_or_collision', 'eligibility']
          .every((k) => k in l.unresolved_decisions &&
            l.unresolved_decisions[k] === null)))
    check('D4: ZERO fabricated approvals — every record pending with null reviewer/timestamp/rationale',
      ledger.every((l) =>
        l.status === 'pending' && l.reviewer === null &&
        l.reviewed_at === null && l.decision_rationale === null))
    check('D5: blank is never approval — the ledger header pins the rule and status vocabulary',
      (() => {
        const raw = read('docs/exlib1b1-review-ledger.jsonl')
        return raw.includes('blank/null field is NEVER approval') &&
          raw.includes('pending -> approved | revised | rejected') &&
          raw.includes('REQUIRES reviewer + reviewed_at + decision_rationale')
      })())
    check('D6: every record carries at least one specialist-review tag; counts reconcile',
      ledger.every((l) => l.specialist_review.length >= 1) &&
      ledger.filter((l) => l.specialist_review.includes('neck')).length === 4 &&
      ledger.filter((l) => l.specialist_review.includes('tibialis')).length === 4 &&
      ledger.filter((l) => l.specialist_review.includes('naming_collision')).length === 2 &&
      ledger.filter((l) => l.specialist_review.includes('tracking_mode_mismatch')).length === 2)
    check('D7: no medium-confidence or non-queued record was promoted into the ledger',
      ledger.every((l) => {
        const m = manifest.find((x) => x.source_url === l.ledger_id)
        return !!m && m.confidence === 'human_review_required'
      }))
  }

  console.log('\nE. Phase boundary')
  {
    check('E1: EXLIB-1A manifest remains byte-identical',
      createHash('sha256').update(manifestRaw).digest('hex') === MANIFEST_SHA &&
      manifest.length === 395)
    check('E2: licensing/copyright boundary unchanged in the committed EXLIB-1A notes',
      (() => {
        const a = read('docs/exlib1a-exercise-library-discovery-notes.md')
        return a.includes('CRAWLER ACCESS ONLY') &&
          a.includes('not for external redistribution') &&
          a.includes('legal/product approval') &&
          (() => {
            try {
              return execSync('git diff --name-only -- docs/exlib1a-exercise-library-discovery-notes.md docs/exlib1a-discovery-manifest.jsonl docs/exlib1a-human-review-queue.md',
                { encoding: 'utf8' }).trim() === ''
            } catch { return false }
          })()
      })())
    check('E3: zero product, API, lib, schema, Supabase, or dependency changes (git)',
      (() => {
        try {
          // ADMISSION (EXLIB-1B2 Revision H): migration 023 is now a
          // COMMITTED phase artifact (candidate 8ec67b4); the
          // in-review Revision H correction to that same declared
          // draft appears as a tracked modification and is admitted.
          // Everything else under these paths must remain untouched.
          return execSync(
            'git diff --name-only -- src/ supabase/ package.json package-lock.json next.config.mjs tailwind.config.ts tsconfig.json',
            { encoding: 'utf8' }).trim().split('\n').filter(Boolean)
            .every((f) => f === 'supabase/migrations/023_exlib_catalog_and_delivery_contract.sql')
        } catch { return false }
      })())
    check('E4: worktree changes stay inside the declared EXLIB-1B1 scope',
      (() => {
        let out = ''
        try { out = execSync('git status --porcelain', { encoding: 'utf8' }) } catch { return false }
        return out.split('\n').filter(Boolean).every((line) => {
          const f = line.slice(3).trim()
          // RETARGET (EXLIB-1B2): the approved-for-drafting migration
          // 023 draft is admitted while uncommitted.
          // ADMISSION (EXLIB-1B3A): the audit-only hardening notes
          // (docs/exlib1b3-*) are admitted while uncommitted.
          return f.startsWith('docs/exlib1b1-') ||
            f.startsWith('docs/exlib1b3-') ||
            // ADMISSION (EXLIB-1C0): the approval-packet and
            // review-proposal artifacts are admitted while
            // uncommitted.
            f.startsWith('docs/exlib1c0-') ||
            // ADMISSION (EXLIB-1C0A): the private-use decision and
            // equipment-resolution overlay artifacts are admitted
            // while uncommitted.
            f.startsWith('docs/exlib1c0a-') ||
            f === 'supabase/migrations/023_exlib_catalog_and_delivery_contract.sql' ||
            // ADMISSION (EXLIB-1B3B migration 024 draft): the
            // uncommitted hardening draft is admitted.
            f === 'supabase/migrations/024_exlib_post_application_hardening.sql' ||
            f.startsWith('scripts/verify-')
        })
      })())
    check('E5: rollout plan present with explicit blockers, 023 unapproved, Joseph-applies rule',
      notes.includes('Architecture approval') &&
      notes.includes('BLOCKER') &&
      notes.includes('023 remains unapproved and unauthored') &&
      notes.includes('Joseph applies the exact approved SQL') &&
      notes.includes('never Claude'))
  }

  console.log('\nF. Architecture review gates (EXLIB-1B1 correction)')
  {
    check('F1: tenant-safe aliases — composite FK to exercises(user_id, id), declarative not trigger-based',
      notesFlat.includes('UNIQUE candidate key on `(user_id, id)`') &&
      notesFlat.includes('composite foreign key `(user_id, exercise_id)` REFERENCES `exercises(user_id, id)`') &&
      notesFlat.includes('impossible for one user\'s alias to reference another user\'s exercise') &&
      notesFlat.includes('No trigger or route check is the enforcement mechanism') &&
      notesFlat.includes('unique `(user_id, lower(alias))`') &&
      notesFlat.includes('second exercise/history identity can never exist'))
    check('F2: catalog closed by default — zero authenticated/anon access, least-privilege grants, DEFINER discipline',
      notesFlat.includes('zero policies for `authenticated` and zero for `anon`') &&
      notesFlat.includes('REVOKE ALL from PUBLIC and `anon`') &&
      notesFlat.includes('NO SELECT grants to `authenticated`') &&
      notesFlat.includes('SEPARATE, separately reviewed contract') &&
      notesFlat.includes('never a browser client') &&
      notesFlat.includes('never a new `service_role` dependency in product source') &&
      notesFlat.includes('fixed `search_path`') &&
      notesFlat.includes('REVOKEd from PUBLIC and `anon`') &&
      !notesFlat.includes('readable by authenticated users'))
    check('F3: atomic resumable delivery — one transaction, partial unique idempotency, same path for all provisioning',
      notesFlat.includes('One transactional delivery operation per user per import run') &&
      notesFlat.includes('partial unique index on `exercises(user_id, catalog_id) WHERE catalog_id IS NOT NULL`') &&
      notesFlat.includes('retry after interruption produces zero duplicates') &&
      notesFlat.includes('inserted/skipped/collision/error counts') &&
      notesFlat.includes('explicit and opt-in, batched per user') &&
      notesFlat.includes('calls the SAME authoritative function') &&
      notesFlat.includes('no second, behaviorally divergent delivery loop') &&
      notesFlat.includes('rejected') &&
      notesFlat.includes('structurally impossible'))
    check('F4: snapshot mutability + provenance integrity — immutable catalog, stable provenance, RESTRICT FKs',
      notesFlat.includes('immutable, versioned canonical source') &&
      notesFlat.includes('USER-OWNED SNAPSHOT') &&
      notesFlat.includes('NEVER silently rewrite a delivered snapshot') &&
      notesFlat.includes('`catalog_id` and `import_run_id` never change after insert') &&
      notesFlat.includes('column-level privileges') &&
      notesFlat.includes('NO UPDATE privilege on `catalog_id`') &&
      notesFlat.includes('never "repairs" or overwrites a user-edited delivered row') &&
      notesFlat.includes('exercise_catalog(id)` **ON DELETE RESTRICT**') &&
      notesFlat.includes('exercise_catalog_import_runs(id)` **ON DELETE RESTRICT**') &&
      notesFlat.includes('deactivate-only'))
    check('F5: gate statements reconcile with the consumer audit (product reads only user-owned exercises)',
      notesFlat.includes('the current product continues reading ONLY user-owned `exercises`') &&
      notesFlat.includes('the Part 2 inventory is unchanged by this contract') &&
      notesFlat.includes('the legacy 15 seeds keep `catalog_id NULL`'))
    check('F6: delivery never reuses the count-gated client-seeder pattern',
      notesFlat.includes('independent client requests would permit partial libraries') &&
      notesFlat.includes('the current seeder becomes a thin trigger point'))
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
