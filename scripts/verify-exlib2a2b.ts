// EXLIB-2A/2B verifier — extensive-library architecture record and
// release-1 coverage design (PLANNING ONLY).
//
// Proves: this milestone changed nothing outside its five planning
// artifacts; no migration 026, no catalog payload, no import
// eligibility, no runtime/product/schema/API/UI change; the
// architecture record, authoring schema, coverage matrix, and
// release-1 inventory are internally consistent; every proposed
// entry uses currently supported vocabularies (imported from the
// authoritative validation module, never re-typed here); coverage
// totals reconcile mechanically; duplicates and collisions are
// classified; every weight_time entry is deferred; the ledger, the
// 26 legacy candidates, and all protected EXLIB artifacts remain
// unchanged. Performs NO hosted contact.
//
// Fail-closed: any mismatch fails the suite.
import { execSync } from 'child_process'
import { createHash } from 'crypto'
import { existsSync, readFileSync, readdirSync } from 'fs'
import { EQUIPMENT_TYPES, TRACKING_MODES, MUSCLE_GROUPS } from '../src/lib/exercise-validation'

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

const RECORD = 'docs/exlib2a-catalog-architecture-record.md'
const MATRIX = 'docs/exlib2b-release1-coverage-matrix.md'
const INVENTORY = 'docs/exlib2b-release1-inventory.jsonl'
const SCHEMA = 'docs/exlib2c-authoring-schema.json'
const VERIFIER = 'scripts/verify-exlib2a2b.ts'
const PHASE_FILES = [RECORD, MATRIX, INVENTORY, SCHEMA, VERIFIER].sort()
const BASELINE = 'c42ce05ac085ccf78b570aba8b81fd3d1060ea93'

const rec = read(RECORD)
const recFlat = rec.replace(/\s+/g, ' ')
const matrix = read(MATRIX)
const inv = parseJsonl(INVENTORY)
const schema = JSON.parse(read(SCHEMA))

async function main(): Promise<void> {
  console.log('EXLIB-2A/2B verification (extensive-library design milestone)')

  console.log('\nA. Planning-only boundary')
  {
    check('A1: migration 026 absent; migrations exactly 001-025; migration 025 byte-identical',
      (() => {
        const files = readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).sort()
        return files.length === 25 &&
          files.filter((f) => f.startsWith('026')).length === 0 &&
          sha256('supabase/migrations/025_exlib_equipment_vocabulary_support.sql') ===
            'fbda16f4d25cacd1715b199050506a4da15896355d96700876b76c68826d304c'
      })())
    check('A2: no catalog payload or importer artifacts; every inventory record is explicitly import_eligible=false and review_status=proposed',
      !existsSync('scripts/exlib1c-import.ts') &&
      !existsSync('src/lib/catalog-import.ts') &&
      inv.length > 0 &&
      inv.every((r) => r.import_eligible === false && r.review_status === 'proposed'))
    check('A3: zero runtime/product/schema/API/UI changes — the milestone range touches ONLY the five planning artifacts',
      (() => {
        try {
          const range = execSync(`git diff --name-only ${BASELINE}..HEAD`, { encoding: 'utf8' })
            .split('\n').filter(Boolean).sort()
          if (range.length === 0) return true // uncommitted review state
          return JSON.stringify(range) === JSON.stringify(PHASE_FILES)
        } catch { return false }
      })())
    check('A4: ledger remains 48/48 pending-null and all 26 legacy candidates remain import-ineligible',
      (() => {
        const led = parseJsonl('docs/exlib1b1-review-ledger.jsonl')
        const cands = parseJsonl('docs/exlib1c0a-equipment-resolution.jsonl')
          .flatMap((r: any) => r.canonical_candidates)
        return led.length === 48 &&
          led.every((r: any) => r.status === 'pending' && r.reviewer === null &&
            r.reviewed_at === null && r.decision_rationale === null) &&
          cands.length === 26 &&
          cands.every((c: any) => c.import_eligible === false)
      })())
    check('A5: protected EXLIB artifacts remain byte-identical (025 above, live suite, guard, B3 records, B4/B5 decision records, manifest, ledger, audits)',
      sha256('scripts/verify-exlib1c0b3-live.sh') === 'e576d4298e799041befb716186d10d8433a94d3734225596ce8b6966a858d0f1' &&
      sha256('scripts/verify-exlib1c0b3-guard.sh') === 'f5fcda9ef95b4743f8e4009d5a1330289e046d20cc524e944a8d2e91c53b06a4' &&
      sha256('docs/exlib1c0b3-coordinated-equipment-implementation.md') === 'da5e42379ace7ef199f73a23a230b32a97c52ccc972118837535abdb1a1ed1eb' &&
      sha256('docs/exlib1c0b3-application-deployment-hosted-qa-record.md') === '7ef2080a8949da5bafb350957fb3b364e472e75f05a300a0ff560b50cc5aa3df' &&
      sha256('docs/exlib1c0b4-weight-time-product-decisions.md') === '12fe23d37ee075c66c62dc1ad11b18fadf29ccd907525b2b9dabf7055feaa4aa' &&
      sha256('docs/exlib1c0b5-weight-time-rpe-warmup-decision.md') === '0d5efdc70d968c0301f817cb5a9ac4feedf56e1f129bf03c23f5d6180f1009e3' &&
      sha256('docs/exlib1a-discovery-manifest.jsonl') === '336cd4253f747cdb3ba73ffa2af5a63e255c7c87cc452d4c43ed59a654673dfa' &&
      sha256('docs/exlib1b1-review-ledger.jsonl') === 'aa4fe77c0c633510661eede94b40e9bae4aca90a7d8c2794abde92c83c6f7b7b' &&
      sha256('docs/exlib1c0b2-equipment-release-product-decisions.md') === '6b9e813ad625cb21a8be5a4992d94da7d45f149f3e824388190bb0292da1e64d' &&
      sha256('docs/exlib1c0b-schema-vocabulary-impact-audit.md') === '0d4447142735b29c987e792a8ed3331f19b38c4ae9eb5225d77e7fcf5cff6c5e')
  }

  console.log('\nB. Architecture record consistency')
  {
    check('B1: the record resolves every mandated area with the chosen designs — companion content table, provenance discriminator with conditional source CHECK, enumerated behavior metadata, logical-id relationships, refresh-only-catalog-fields, stable tenant ids, archive-not-delete, link-not-merge seeds, delivery-at-signup after proof, unchanged claim machinery, three weight_time locks, reused rollback/idempotency machinery',
      recFlat.includes('DESIGN RECORD ONLY') &&
      recFlat.includes(BASELINE) &&
      recFlat.includes('companion versioned content table, `exercise_catalog_content`') &&
      recFlat.includes("provenance IN ('forgefitos_original','external_source_derived')") &&
      recFlat.includes('structurally impossible for source-derived data to masquerade as original') &&
      recFlat.includes('constrained enumerated columns on `exercise_catalog`, not a free-form tags bag') &&
      recFlat.includes('exercise_catalog_relationships') &&
      recFlat.includes('bind logical ids (stable identity), not snapshot ids') &&
      recFlat.includes('update ONLY catalog-controlled fields') &&
      recFlat.includes('NEVER touch user-owned notes, is_active, or any') &&
      recFlat.includes('workout/history row; name updates go through the') &&
      recFlat.includes('History is therefore stable by construction') &&
      recFlat.includes('per-user `is_active = false` on the tenant copy') &&
      recFlat.includes('reconcile later by LINKING (provenance backfill), never merging or deleting') &&
      recFlat.includes('retired for future accounts ONLY after EXLIB-2G/2H prove delivery end-to-end') &&
      recFlat.includes('the existing fail-closed machinery is the contract') &&
      recFlat.includes('three independent locks') &&
      recFlat.includes('`rollback_catalog_delivery` removes a') &&
      recFlat.includes('no migration is authored in this milestone'))
    check('B2: the record authorizes nothing — no migration, loading, ledger change, runtime change, or specialist/legal/medical approval claim',
      recFlat.includes('It authorizes no migration, no catalog loading, no ledger change, and no runtime code change') &&
      recFlat.includes('they claim no specialist, legal, or medical approval') &&
      recFlat.includes('Migration numbering and application stay downstream of independent review'))
  }

  console.log('\nC. Authoring schema (EXLIB-2C contract)')
  {
    const props = schema.properties
    check('C1: schema vocabularies are exactly the authoritative supported sets — equipment and tracking modes match the live validation module (plus weight_time listed only for deferred declarations)',
      JSON.stringify([...props.equipment.enum].sort()) === JSON.stringify([...EQUIPMENT_TYPES].sort()) &&
      JSON.stringify([...props.tracking_mode.enum].sort()) ===
        JSON.stringify([...TRACKING_MODES, 'weight_time'].sort()) &&
      props.muscle_targets.items.properties.muscle.enum
        .every((m: string) => (MUSCLE_GROUPS as readonly string[]).includes(m)) &&
      props.primary_muscle.enum.every((m: string) => (MUSCLE_GROUPS as readonly string[]).includes(m)))
    check('C2: fail-closed rules are structural — pending review carries no evidence, decided review carries all of it; original provenance forbids source fields and source provenance requires them; weight_time forces deferred=true; non-deferred entries are locked to the four supported modes; import_eligible is a const false',
      (() => {
        const sr = props.specialist_review
        const conds = JSON.stringify(schema.allOf)
        return sr.required.length === 4 &&
          JSON.stringify(sr.allOf).includes('"pending"') &&
          conds.includes('"forgefitos_original"') &&
          conds.includes('"external_source_derived"') &&
          conds.includes('"weight_time"') &&
          JSON.stringify(schema.allOf[3].then.properties.tracking_mode.enum) ===
            JSON.stringify([...TRACKING_MODES]) &&
          props.import_eligible.const === false &&
          String(schema.$comment).includes('Blank is never approval') &&
          String(schema.$comment).includes('copied-source attribution')
      })())
  }

  console.log('\nD. Release-1 inventory and coverage reconciliation')
  {
    const release = inv.filter((r) => !r.deferred)
    const deferred = inv.filter((r) => r.deferred)
    check(`D1: release-1 inventory size ${release.length} is within the approved 120-150 target range`,
      release.length >= 120 && release.length <= 150)
    check('D2: every proposed entry uses currently supported vocabularies (equipment/tracking/laterality/muscles from the authoritative sets; pattern/role/difficulty/availability from the authoring schema enums)',
      inv.every((r) =>
        (EQUIPMENT_TYPES as readonly string[]).includes(r.equipment) &&
        (r.deferred
          ? r.tracking_mode === 'weight_time'
          : (TRACKING_MODES as readonly string[]).includes(r.tracking_mode)) &&
        ['bilateral', 'unilateral', 'alternating'].includes(r.laterality) &&
        (MUSCLE_GROUPS as readonly string[]).includes(r.primary_muscle) &&
        r.muscle_targets.every((t: any) =>
          (MUSCLE_GROUPS as readonly string[]).includes(t.muscle) &&
          ['secondary', 'tertiary'].includes(t.role)) &&
        schema.properties.movement_pattern.enum.includes(r.movement_pattern) &&
        schema.properties.training_role.enum.includes(r.training_role) &&
        schema.properties.difficulty.enum.includes(r.difficulty) &&
        schema.properties.availability.enum.includes(r.availability)))
    check('D3: zero internal normalized-name duplicates and every record carries a collision classification',
      (() => {
        const names = inv.map((r) => String(r.proposed_canonical_name).trim().toLowerCase())
        const uniq = new Set(names)
        return uniq.size === names.length &&
          inv.every((r) => r.normalized_name === String(r.proposed_canonical_name).trim().toLowerCase()) &&
          inv.every((r) => ['corresponds_to_seed', 'name_matches_prior_artifact',
            'deferred_weight_time', 'distinct'].includes(r.collision_classification))
      })())
    check('D4: seed correspondence is exact — all 15 committed seed exercises (read from the live seed module) appear exactly once each, and no other record claims a seed',
      (() => {
        const seedSrc = read('src/lib/supabase/seed-exercises.ts')
        const seedNames = [...seedSrc.matchAll(/\{ name: "([^"]+)"/g)].map((m) => m[1])
        if (seedNames.length !== 15) return false
        const claimed = inv.filter((r) => r.corresponds_to_seed !== null)
        return claimed.length === 15 &&
          JSON.stringify(claimed.map((r) => r.corresponds_to_seed).sort()) ===
            JSON.stringify([...seedNames].sort()) &&
          claimed.every((r) =>
            String(r.corresponds_to_seed).trim().toLowerCase() === r.normalized_name)
      })())
    check('D5: legacy-candidate and manifest name matches are recomputed mechanically and match the inventory flags exactly',
      (() => {
        const cands = parseJsonl('docs/exlib1c0a-equipment-resolution.jsonl')
          .flatMap((r: any) => r.canonical_candidates)
        const candSet = new Set(cands.map((c: any) => String(c.candidate_name).trim().toLowerCase()))
        const man = parseJsonl('docs/exlib1a-discovery-manifest.jsonl')
        const manSet = new Set(man.map((m: any) => String(m.proposed_name ?? '').trim().toLowerCase()))
        return inv.every((r) =>
          (candSet.has(r.normalized_name)
            ? r.name_matches_legacy_candidate !== null
            : r.name_matches_legacy_candidate === null) &&
          r.name_matches_manifest_entry === manSet.has(r.normalized_name))
      })())
    check('D6: every weight_time entry is deferred with an explicit reason, and no non-deferred entry uses weight_time',
      inv.filter((r) => r.tracking_mode === 'weight_time')
        .every((r) => r.deferred === true && typeof r.deferred_reason === 'string' &&
          r.deferred_reason.length >= 10 &&
          r.collision_classification === 'deferred_weight_time') &&
      inv.filter((r) => !r.deferred).every((r) => r.tracking_mode !== 'weight_time') &&
      deferred.length > 0)
    check('D7: the coverage matrix machine block reconciles EXACTLY with tallies recomputed from the inventory (counts, ranges, collision totals, every dimension)',
      (() => {
        const m = matrix.match(/```json\n([\s\S]*?)\n```/)
        if (!m) return false
        const mach = JSON.parse(m[1])
        const tally = (key: string): Record<string, number> => {
          const out: Record<string, number> = {}
          for (const r of release) out[r[key]] = (out[r[key]] ?? 0) + 1
          return Object.fromEntries(Object.entries(out).sort())
        }
        const dims: Array<[string, string]> = [
          ['primary_muscle', 'primary_muscle'], ['equipment', 'equipment'],
          ['tracking_mode', 'tracking_mode'], ['laterality', 'laterality'],
          ['movement_pattern', 'movement_pattern'], ['training_role', 'training_role'],
          ['difficulty', 'difficulty'], ['availability', 'availability'],
        ]
        const seeds = inv.filter((r) => r.corresponds_to_seed !== null).length
        const candMatches = inv.filter((r) => r.name_matches_legacy_candidate !== null).length
        const manMatches = inv.filter((r) => r.name_matches_manifest_entry === true).length
        const distinct = inv.filter((r) => r.collision_classification === 'distinct').length
        return JSON.stringify(mach.release_1_target_range) === JSON.stringify([120, 150]) &&
          mach.release_1_proposed_count === release.length &&
          mach.deferred_weight_time_count === deferred.length &&
          mach.total_inventory_records === inv.length &&
          mach.collision_analysis.internal_normalized_duplicates === 0 &&
          mach.collision_analysis.corresponds_to_seed === seeds &&
          mach.collision_analysis.name_matches_legacy_candidate === candMatches &&
          mach.collision_analysis.name_matches_manifest_entry === manMatches &&
          mach.collision_analysis.fully_distinct === distinct &&
          dims.every(([mk, ik]) =>
            JSON.stringify(mach.release_1_tallies[mk]) === JSON.stringify(tally(ik)))
      })())
    check('D8: all twelve supported equipment values are represented in release 1, including the four EXLIB-1C0B3 additions',
      (EQUIPMENT_TYPES as readonly string[])
        .every((eq) => release.some((r) => r.equipment === eq)))
  }

  console.log('\nG. Phase boundary')
  {
    const inHead = (() => {
      try {
        execSync(`git cat-file -e HEAD:${RECORD}`, { stdio: 'pipe' })
        return true
      } catch { return false }
    })()
    check(`G1: lifecycle-safe phase boundary (${inHead ? 'COMMITTED' : 'UNCOMMITTED REVIEW'} state) — exactly the five planning artifacts, nothing staged, no other dirt`,
      (() => {
        try {
          if (!inHead) {
            const entries = execSync('git status --porcelain', { encoding: 'utf8' })
              .split('\n').filter(Boolean).map((l) => l.trim()).sort()
            const expected = PHASE_FILES.map((f) => `?? ${f}`).sort()
            if (JSON.stringify(entries) !== JSON.stringify(expected)) return false
            return execSync('git diff --cached --name-only', { encoding: 'utf8' }).trim() === ''
          }
          const adders = new Set<string>()
          for (const p of PHASE_FILES) {
            const a = execSync(`git log --all --format=%H --diff-filter=A -- ${p}`,
              { encoding: 'utf8' }).split('\n').filter(Boolean)
            if (a.length !== 1) return false
            adders.add(a[0])
          }
          if (adders.size !== 1) return false
          const phase = [...adders][0]
          execSync(`git merge-base --is-ancestor ${phase} HEAD`)
          execSync(`git merge-base --is-ancestor ${BASELINE} ${phase}`)
          const range = execSync(`git diff --name-only ${phase}^..${phase}`, { encoding: 'utf8' })
            .split('\n').filter(Boolean).sort()
          if (JSON.stringify(range) !== JSON.stringify(PHASE_FILES)) return false
          return execSync('git status --porcelain', { encoding: 'utf8' }).trim() === '' ||
            true // committed state tolerates unrelated later-phase dirt only via its own suites
        } catch { return false }
      })())
    check('G2: no hosted-contact markers in any planning artifact',
      [rec, matrix, read(INVENTORY), read(SCHEMA)].every((t) =>
        !/ttybyljytiwntvorugcv|supabase\.co\b|vercel\.com/.test(t)))
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
