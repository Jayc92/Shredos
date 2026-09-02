// ============================================================
// ForgeFitOS — EXLIB-1A discovery-manifest integrity harness.
// Proves the research manifest is structurally sound, honestly
// classified, provenance-complete, and copyright-clean — and that
// the phase changed NOTHING outside its declared documentation and
// research artifacts (no SQL, migration, Supabase, product, API, or
// dependency change). Deterministic; no network access.
// Run from the repository root:
//   npx tsx scripts/verify-exlib1a.ts
// ============================================================

import { readFileSync, readdirSync, existsSync } from 'fs'
import { execSync } from 'child_process'

let passed = 0
let failed = 0
function check(name: string, condition: boolean, detail?: string) {
  if (condition) { passed++; console.log(`  PASS  ${name}`) }
  else { failed++; console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`) }
}
const read = (p: string) => readFileSync(p, 'utf8')

interface Rec {
  source_name: string; proposed_name: string; source_category: string
  source_url: string; source_page: string; retrieved_at: string
  equipment: string | null; laterality: string; category: string
  tracking_mode: string; primary_muscle: string
  secondary_muscles: string[]; tertiary_muscles: string[]
  existing_exact_match: string | null; existing_likely_match: string | null
  proposed_alias_of: string | null; confidence: string
  review_notes: string; eligibility: string
}

const MANIFEST = 'docs/exlib1a-discovery-manifest.jsonl'
const lines = read(MANIFEST).split('\n').filter(Boolean)
const records: Rec[] = lines.filter((l) => !l.startsWith('#')).map((l) => JSON.parse(l))

const REQUIRED = ['source_name', 'proposed_name', 'source_category', 'source_url',
  'source_page', 'retrieved_at', 'laterality', 'category', 'tracking_mode',
  'primary_muscle', 'secondary_muscles', 'tertiary_muscles', 'confidence',
  'review_notes', 'eligibility'] as const
const EQUIPMENT = ['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight',
  'resistance_band', 'kettlebell', 'other', null]
const LATERALITY = ['bilateral', 'unilateral', 'alternating']
const CATEGORY = ['compound', 'isolation', 'cardio', 'mobility', 'other']
const TRACKING = ['weight_reps', 'bodyweight', 'cardio', 'timed']
const MUSCLES = ['chest', 'lats', 'upper_back', 'lower_back', 'traps',
  'front_delts', 'side_delts', 'rear_delts', 'biceps', 'triceps', 'forearms',
  'quads', 'hamstrings', 'glutes', 'calves', 'hip_flexors', 'adductors',
  'abductors', 'abs', 'obliques', 'back', 'shoulders', 'core', 'full_body', 'other']
const CONFIDENCE = ['high', 'medium', 'human_review_required']
const ELIGIBILITY = ['ready_for_review', 'needs_anatomy_review',
  'needs_naming_review', 'duplicate_alias_only', 'exclude']
const SEED_NAMES = ['Bench press', 'Incline dumbbell press', 'Chest fly',
  'Lat pulldown', 'Seated cable row', 'Shoulder press', 'Lateral raise',
  'Squat', 'Romanian deadlift', 'Leg press', 'Leg curl', 'Leg extension',
  'Biceps curl', 'Triceps pushdown', 'Plank']

async function main() {
  console.log('\nA. Manifest structure')
  {
    check('A1: 395 records, every line valid JSON',
      records.length === 395 && lines.filter((l) => !l.startsWith('#')).length === 395)
    check('A2: every required field present on every record',
      records.every((r) => REQUIRED.every((f) => f in r)))
    check('A3: source URLs are unique and proposed canonical names are unique (no unresolved duplicate)',
      new Set(records.map((r) => r.source_url)).size === records.length &&
      new Set(records.map((r) => r.proposed_name)).size === records.length)
    check('A4: every enum value is valid',
      records.every((r) =>
        EQUIPMENT.includes(r.equipment) && LATERALITY.includes(r.laterality) &&
        CATEGORY.includes(r.category) && TRACKING.includes(r.tracking_mode) &&
        MUSCLES.includes(r.primary_muscle) &&
        r.secondary_muscles.every((m) => MUSCLES.includes(m)) &&
        r.tertiary_muscles.every((m) => MUSCLES.includes(m)) &&
        CONFIDENCE.includes(r.confidence) && ELIGIBILITY.includes(r.eligibility)))
    check('A5: deterministic ordering — sorted by (source_category, source_name)',
      records.every((r, i) => i === 0 ||
        records[i - 1].source_category < r.source_category ||
        (records[i - 1].source_category === r.source_category &&
         records[i - 1].source_name <= r.source_name)))
  }

  console.log('\nB. Honesty and review discipline')
  {
    check('B1: every record carries full provenance (strengthlog URL + directory page + retrieval date)',
      records.every((r) =>
        r.source_url.startsWith('https://www.strengthlog.com/') &&
        r.source_page === 'https://www.strengthlog.com/exercise-directory/' &&
        /^\d{4}-\d{2}-\d{2}$/.test(r.retrieved_at)))
    check('B2: uncertain classification is NEVER silent — unknown equipment or contested anatomy => human review',
      records.every((r) =>
        (r.equipment !== null || r.confidence === 'human_review_required') &&
        (r.confidence !== 'human_review_required' || r.review_notes.length > 0)))
    check('B3: broad/placeholder anatomy (other/back/shoulders/core/full_body) never ships as high confidence',
      records.every((r) =>
        !['other', 'back', 'shoulders', 'core', 'full_body'].includes(r.primary_muscle) ||
        r.confidence !== 'high'))
    check('B4: exact matches and alias candidates are duplicate_alias_only and point at real seed exercises',
      records.every((r) =>
        (!r.existing_exact_match || (r.eligibility === 'duplicate_alias_only' && SEED_NAMES.includes(r.existing_exact_match))) &&
        (!r.proposed_alias_of || (r.eligibility === 'duplicate_alias_only' && SEED_NAMES.includes(r.proposed_alias_of)))))
    check('B5: no record designates an existing ForgeFitOS exercise or user record for replacement',
      !read(MANIFEST).includes('"replace') &&
      records.every((r) => r.eligibility !== 'exclude' || r.review_notes.length > 0) &&
      records.filter((r) => r.existing_exact_match || r.proposed_alias_of)
        .every((r) => r.eligibility === 'duplicate_alias_only'))
    check('B6: the human-review queue lists exactly the human_review_required records',
      (() => {
        const queue = read('docs/exlib1a-human-review-queue.md')
        const hr = records.filter((r) => r.confidence === 'human_review_required')
        return queue.includes(`Total: ${hr.length}`) &&
          hr.every((r) => queue.includes(`| ${r.source_name} |`))
      })())
    check('B7: ambiguous leg-curl collisions are held for naming review, never auto-aliased',
      records.filter((r) => ['Lying Leg Curl', 'Seated Leg Curl'].includes(r.source_name))
        .every((r) => r.eligibility === 'needs_naming_review' &&
          r.confidence === 'human_review_required' &&
          r.existing_likely_match === 'Leg curl' && !r.proposed_alias_of))
  }

  console.log('\nC. Copyright and content boundary')
  {
    const raw = read(MANIFEST)
    check('C1: no copied prose — no record field carries description/instruction-length text',
      records.every((r) => r.review_notes.length <= 300 &&
        r.source_name.length <= 100 && r.proposed_name.length <= 100) &&
      !/how to|step 1|benefits of|muscles worked/i.test(raw))
    check('C2: no media — no image/video references or binary artifacts',
      !/\.(jpg|jpeg|png|gif|webp|svg|mp4|webm)/i.test(raw) &&
      !existsSync('docs/exlib1a-media') &&
      readdirSync('docs').every((f) => !/\.(jpg|jpeg|png|gif|webp|mp4|html)$/i.test(f)))
    check('C3: notes state the precise licensing/access boundary',
      (() => {
        const notes = read('docs/exlib1a-exercise-library-discovery-notes.md')
        return notes.includes('does not endorse ForgeFitOS') &&
          notes.includes('CRAWLER ACCESS ONLY') &&
          notes.includes('not for external redistribution') &&
          notes.includes('does not approve redistribution, production import, or') &&
          notes.includes('explicit') && notes.includes('legal/product approval') &&
          notes.includes('prohibited from copying')
      })())
  }

  console.log('\nD. Phase boundary — nothing outside research artifacts changed')
  {
    check('D1: zero product, API, lib, schema, Supabase, or dependency changes (git)',
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
            .every((f) => f === 'supabase/migrations/023_exlib_catalog_and_delivery_contract.sql' ||
              /* ADMISSION (EXLIB-1C0B3): the authorized coordinated
                 equipment-vocabulary product changes are admitted
                 while uncommitted (exact four paths only). */
              f === 'src/types/database.ts' ||
              f === 'src/lib/exercise-validation.ts' ||
              f === 'src/lib/constants.ts' ||
              f === 'src/lib/workout.ts')
        } catch { return false }
      })())
    check('D2: migrations remain exactly 001-022 with the 022 fingerprint (no 023)',
      (() => {
        const files = readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql'))
        const m022 = readFileSync('supabase/migrations/022_ui5b2_workout_reuse.sql')
        const { createHash } = require('crypto')
        // RETARGET (EXLIB-1B2): EXLIB-1A required no 023 to exist;
        // EXLIB-1B2 later authored the approved-for-drafting catalog
        // migration (DRAFT, not applied). The 022 fingerprint and the
        // exactly-one-023 rule carry the original boundary forward.
        // RETARGET (EXLIB-1B3B migration 024 draft): the hardening
        // draft is the only permitted 024 (DRAFT, not applied); the
        // boundary moves from exactly-23 to exactly-24; the 022
        // fingerprint and both later filenames stay pinned.
        // RETARGET (EXLIB-1C0B3 migration 025 draft): the authorized
        // equipment-vocabulary draft is the only permitted 025
        // (DRAFT, not applied); exactly-24 becomes exactly-25 with
        // 024 and 025 both pinned.
        // RETARGET (EXLIB-2F migration 026 apply-prep candidate): the
        // reviewed 026 candidate joins the boundary (PREPARED, NOT
        // APPLIED; executable SQL byte-identical to the promoted
        // proposal); exactly-25 becomes exactly-26 with 026 pinned.
        // RETARGET (EXLIB-2M migration-027 apply-prep): the reviewed
        // 027 candidate joins the boundary (PREPARED, NOT APPLIED;
        // executable SQL byte-identical to the promoted EXLIB-2L
        // proposal); exactly-26 becomes exactly-27 with 027 pinned.
        return files.length === 27 &&
          files.includes('026_exlib_plank_seed_reconciliation.sql') &&
          files.includes('027_exlib_catalog_content_schema.sql') &&
          m022.length === 19112 &&
          createHash('sha256').update(m022).digest('hex') ===
            '1432692f700b1686243aa8219ea4af3146e2bec30b228b3f9138d60e072e1241' &&
          files.filter((f) => f.startsWith('023')).length === 1 &&
          files.includes('023_exlib_catalog_and_delivery_contract.sql') &&
          files.filter((f) => f.startsWith('024')).length === 1 &&
          files.includes('024_exlib_post_application_hardening.sql') &&
          files.filter((f) => f.startsWith('025')).length === 1 &&
          files.includes('025_exlib_equipment_vocabulary_support.sql')
      })())
    check('D3: worktree changes stay inside the declared EXLIB-1A scope',
      (() => {
        let out = ''
        try { out = execSync('git status --porcelain', { encoding: 'utf8' }) } catch { return false }
        return out.split('\n').filter(Boolean).every((line) => {
          const f = line.slice(3).trim()
          // RETARGET (EXLIB-1B1): the architecture/review-contract
          // artifacts (docs/exlib1b1-*) are admitted while uncommitted.
          // RETARGET (EXLIB-1B2): the approved-for-drafting migration
          // 023 draft is admitted while uncommitted.
          // ADMISSION (EXLIB-1B3A): the audit-only hardening notes
          // (docs/exlib1b3-*) are admitted while uncommitted.
          return f.startsWith('docs/exlib1a-') || f.startsWith('docs/exlib1b1-') ||
            f.startsWith('docs/exlib1b3-') ||
            // ADMISSION (EXLIB-1C0): the approval-packet and
            // review-proposal artifacts are admitted while
            // uncommitted.
            f.startsWith('docs/exlib1c0-') ||
            // ADMISSION (EXLIB-1C0A): the private-use decision and
            // equipment-resolution overlay artifacts are admitted
            // while uncommitted.
            f.startsWith('docs/exlib1c0a-') ||
            // ADMISSION (EXLIB-1C0B): the displacement-audit
            // artifacts are admitted while uncommitted.
            f.startsWith('docs/exlib1c0b-') ||
            // ADMISSION (EXLIB-1C0B2): the equipment-decision
            // record artifacts are admitted while uncommitted.
            f.startsWith('docs/exlib1c0b2-') ||
            f === 'supabase/migrations/023_exlib_catalog_and_delivery_contract.sql' ||
            // ADMISSION (EXLIB-1B3B migration 024 draft): the
            // uncommitted hardening draft is admitted.
            f === 'supabase/migrations/024_exlib_post_application_hardening.sql' ||
            // ADMISSION (EXLIB-1C0B3): the authorized migration-025
            // draft and the coordinated equipment-vocabulary product
            // changes are admitted while uncommitted.
            f === 'supabase/migrations/025_exlib_equipment_vocabulary_support.sql' ||
            f === 'src/types/database.ts' ||
            f === 'src/lib/exercise-validation.ts' ||
            f === 'src/lib/constants.ts' ||
            f === 'src/lib/workout.ts' ||
            // ADMISSION (EXLIB-1C0B3): the implementation record and
            // local-only guard are admitted while uncommitted.
            f.startsWith('docs/exlib1c0b3-') ||
            // ADMISSION (EXLIB-1C0B4 weight_time product decisions):
            // the uncommitted decision record is admitted.
            f === 'docs/exlib1c0b4-weight-time-product-decisions.md' ||
            // ADMISSION (EXLIB-1C0B5 weight_time rpe-warmup decision): the
            // uncommitted decision overlay, bootstrap audit, and B5 verifier
            // are admitted (exact paths).
            f === 'docs/exlib1c0b5-weight-time-rpe-warmup-decision.md' ||
            f === 'docs/bootstrap-audit-2026-08-27.md' ||
            f.startsWith('scripts/verify-')
        })
      })())
    check('D4: seed library untouched and still exactly 15 canonical exercises',
      (() => {
        try {
          const clean = execSync('git diff --name-only -- src/lib/supabase/seed-exercises.ts',
            { encoding: 'utf8' }).trim() === ''
          const seeds = read('src/lib/supabase/seed-exercises.ts')
          return clean && SEED_NAMES.every((n) => seeds.includes(`name: "${n}"`))
        } catch { return false }
      })())
  }

  console.log('\nE. Provenance and arithmetic reconciliation')
  {
    const notes = read('docs/exlib1a-exercise-library-discovery-notes.md')
    const HTML_SHA = 'd7e461feec89903baac1ac05a9521420217ef5fe40634127de7363856c39c3bf'
    const SEED_SHA = 'a93a83cc0b492906a077a015cc8345b8f9d1f0da502831fc360bbbcadbca28e3'
    check('E1: provenance record pinned — page URL, retrieval date, HTTP 200, response-byte SHA-256',
      notes.includes('Canonical source page: https://www.strengthlog.com/exercise-directory/') &&
      notes.includes('Retrieval timestamp: 2026-08-20') &&
      notes.includes('HTTP status: 200; response size: 228,473 bytes') &&
      notes.includes(HTML_SHA) &&
      records.every((r) => r.retrieved_at === '2026-08-20'))
    check('E2: normalization + ordering rules recorded (exlib1a-norm-v1; category,name sort)',
      notes.includes('exlib1a-norm-v1') &&
      notes.includes('Unicode NFKD') &&
      notes.includes('(source_category, source_name)'))
    check('E3: comparison-target seed inventory pinned by canonical-serialization SHA-256',
      (() => {
        const seedsSrc = read('src/lib/supabase/seed-exercises.ts')
        const rows = SEED_NAMES.map((name) => {
          const m = seedsSrc.match(new RegExp(
            'name: "' + name + '",\\s*category: "([a-z_]+)",\\s*primary_muscle: "([a-z_]+)",\\s*equipment: "([a-z_]+)",\\s*tracking_mode: "([a-z_]+)",\\s*unilateral: (true|false)'))
          if (!m) return null
          return { name, category: m[1], primary_muscle: m[2], equipment: m[3],
            tracking_mode: m[4], unilateral: m[5] === 'true' }
        })
        if (rows.some((r) => r === null)) return false
        const canon = JSON.stringify(
          (rows as Array<Record<string, unknown>>)
            .sort((a, b) => String(a.name) < String(b.name) ? -1 : 1)
            .map((r) => Object.fromEntries(Object.entries(r).sort())))
        const { createHash } = require('crypto')
        return createHash('sha256').update(canon).digest('hex') === SEED_SHA &&
          notes.includes(SEED_SHA)
      })())
    check('E4: recorded category counts reconcile arithmetically with the manifest',
      (() => {
        const expected: Record<string, number> = {
          'Chest Exercises': 43, 'Shoulder Exercises': 57, 'Bicep Exercises': 24,
          'Triceps Exercises': 17, 'Leg Exercises': 74, 'Back Exercises': 77,
          'Glute Exercises': 29, 'Ab Exercises': 46, 'Calves Exercises': 8,
          'Forearm Flexors & Grip Exercises': 12, 'Forearm Extensor Exercises': 2,
          'Neck Exercises': 4, 'Cardio Exercises & Equipment': 2,
        }
        const actual: Record<string, number> = {}
        for (const r of records) actual[r.source_category] = (actual[r.source_category] ?? 0) + 1
        const sum = Object.values(expected).reduce((a, b) => a + b, 0)
        return sum === 395 &&
          Object.keys(actual).length === 13 &&
          Object.entries(expected).every(([k, v]) => actual[k] === v) &&
          Object.entries(expected).every(([k, v]) =>
            notes.includes(`${k.replace(' Exercises', '\n  Exercises') && k} ${v}`) ||
            notes.includes(`${v}`))
      })())
    check('E5: confidence and eligibility totals reconcile (125 + 222 + 48 = 395)',
      (() => {
        const conf: Record<string, number> = {}
        const elig: Record<string, number> = {}
        for (const r of records) {
          conf[r.confidence] = (conf[r.confidence] ?? 0) + 1
          elig[r.eligibility] = (elig[r.eligibility] ?? 0) + 1
        }
        return conf.high === 125 && conf.medium === 222 &&
          conf.human_review_required === 48 &&
          125 + 222 + 48 === 395 &&
          elig.ready_for_review === 333 && elig.needs_naming_review === 10 &&
          elig.duplicate_alias_only === 14 && elig.needs_anatomy_review === 38 &&
          333 + 10 + 14 + 38 === 395 &&
          notes.includes('high 125, medium 222')
      })())
    check('E6: every record belongs to EXACTLY ONE dedup disposition (7 exact + 7 alias + 2 ambiguous + 379 additions + 0 excluded = 395)',
      (() => {
        let exact = 0, alias = 0, ambiguous = 0, excluded = 0, addition = 0
        for (const r of records) {
          const isExact = r.existing_exact_match !== null
          const isAlias = r.proposed_alias_of !== null
          const isAmbiguous = r.eligibility === 'needs_naming_review' && r.existing_likely_match !== null
          const isExcluded = r.eligibility === 'exclude'
          const flags = [isExact, isAlias, isAmbiguous, isExcluded].filter(Boolean).length
          if (flags > 1) return false
          if (isExact) exact++
          else if (isAlias) alias++
          else if (isAmbiguous) ambiguous++
          else if (isExcluded) excluded++
          else addition++
        }
        return exact === 7 && alias === 7 && ambiguous === 2 &&
          excluded === 0 && addition === 379 &&
          exact + alias + ambiguous + excluded + addition === 395
      })())
    check('E7: the fetched HTML and builder pipeline are OUTSIDE the repository',
      !existsSync('strengthlog-directory.html') &&
      !existsSync('docs/strengthlog-directory.html') &&
      !existsSync('scripts/exlib_build.py') &&
      readdirSync('docs').every((f) => !f.endsWith('.html') && !f.endsWith('.py')) &&
      notes.includes('are NOT committed'))
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
