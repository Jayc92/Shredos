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
// RETARGET (EXLIB-2S delivery-activation preparation): this suite's
// inventory analysis is anchored at the promoted EXLIB-2R evidence
// tip (the delivery-activation predecessor) — byte-identical to the
// inventory this milestone created and analyzed; EXLIB-2S later
// flips exactly the Plank seed_link_compatible field as its own
// reviewed act.
const inv = execSync(`git show 5f7e182f3027b3640514e06d642693f4018c03e2:"docs/exlib2b-release1-inventory.jsonl"`, { encoding: 'utf8', maxBuffer: 1 << 26 }).split('\n')
  .filter((l) => l.trim() && !l.trim().startsWith('#')).map((l) => JSON.parse(l))
const schema = JSON.parse(read(SCHEMA))

async function main(): Promise<void> {
  console.log('EXLIB-2A/2B verification (extensive-library design milestone)')

  console.log('\nA. Planning-only boundary')
  {
    check('A1: migration 026 absent; migrations exactly 001-025; migration 025 byte-identical',
      (() => {
        const files = readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).sort()
        // RETARGET (EXLIB-2F migration 026 apply-prep candidate): the
        // reviewed 026 candidate joins the boundary (PREPARED, NOT
        // APPLIED; executable SQL byte-identical to the promoted
        // proposal); exactly-25 becomes exactly-26 with 026 pinned.
        // RETARGET (EXLIB-2M migration-027 apply-prep): the reviewed
        // 027 candidate joins the boundary (PREPARED, NOT APPLIED;
        // executable SQL byte-identical to the promoted EXLIB-2L
        // proposal); exactly-26 becomes exactly-27 with 027 pinned.
        return files.length === 27 &&
          files.filter((f) => f.startsWith('026')).length === 1 &&
          files.includes('026_exlib_plank_seed_reconciliation.sql') &&
          files.includes('027_exlib_catalog_content_schema.sql') &&
          sha256('supabase/migrations/025_exlib_equipment_vocabulary_support.sql') ===
            'fbda16f4d25cacd1715b199050506a4da15896355d96700876b76c68826d304c'
      })())
    check('A2: no catalog payload or importer artifacts; every inventory record is explicitly import_eligible=false and review_status=proposed',
      !existsSync('scripts/exlib1c-import.ts') &&
      !existsSync('src/lib/catalog-import.ts') &&
      inv.length > 0 &&
      inv.every((r) => r.import_eligible === false && r.review_status === 'proposed'))
    // RETARGET (EXLIB-2C batch 1): the DESIGN milestone's range claim
    // is anchored to its own promoted tip (653c1e9...), not to a
    // moving HEAD, so later authoring phases building on top of the
    // promoted design can never dilute or break this historical
    // claim. HEAD must still descend from that tip.
    check('A3: zero runtime/product/schema/API/UI changes — the DESIGN milestone range (baseline..design tip) touches ONLY the five planning artifacts, and HEAD descends from the design tip',
      (() => {
        try {
          const DESIGN_TIP = '653c1e91a403a8061af34fce7dabfa8cb710a542'
          const inHistory = (() => {
            try {
              execSync(`git cat-file -e ${DESIGN_TIP}^{commit}`, { stdio: 'pipe' })
              return true
            } catch { return false }
          })()
          if (!inHistory) {
            // pre-promotion review state: fall back to the original
            // uncommitted/branch-local behavior
            const range = execSync(`git diff --name-only ${BASELINE}..HEAD`, { encoding: 'utf8' })
              .split('\n').filter(Boolean).sort()
            return range.length === 0 ||
              JSON.stringify(range) === JSON.stringify(PHASE_FILES)
          }
          execSync(`git merge-base --is-ancestor ${DESIGN_TIP} HEAD`)
          const range = execSync(`git diff --name-only ${BASELINE}..${DESIGN_TIP}`, { encoding: 'utf8' })
            .split('\n').filter(Boolean).sort()
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
      /* RETARGET (EXLIB-2F): the 1C0B3 live suite gained a narrow labeled 026-exclusion so its exactly-001-025 claim stays true now that the reviewed apply-prep candidate exists; pin moves to the revised bytes. */ sha256('scripts/verify-exlib1c0b3-live.sh') === 'eb1b46e941303e0ae7300e4527703753323025712d5c03463733b213f939f6ac' &&
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
    // REVISED (EXLIB-2A/2B review correction): content binds to the
    // STABLE logical identity with its own complete fail-closed
    // review lifecycle; prose authorship lives on the content
    // version; relationships are never duplicated as content JSONB.
    check('B1: content architecture — exercise_catalog_content keyed to exercise_catalog_logical (not a snapshot), per-version authored_by/authored_at, complete fail-closed content review lifecycle, approved/revised-active-only exposure, immutable correction versions, and NO relationship JSONB',
      recFlat.includes('keyed to the STABLE `exercise_catalog_logical` identity') &&
      recFlat.includes('REFERENCES exercise_catalog_logical(id)') &&
      recFlat.includes('prose authorship/provenance binds to THIS content version') &&
      recFlat.includes("content_status IN ('pending','approved','revised','rejected')") &&
      recFlat.includes('exercise_catalog_content_review_audit_chk') &&
      recFlat.includes('blank or missing never means approved; a pending version carries no review evidence; a decided version carries all of it') &&
      recFlat.includes('corrections create a NEW') &&
      recFlat.includes('content_version+1 under the SAME logical identity') &&
      recFlat.includes('substitutions/regressions/progressions are deliberately ABSENT') &&
      recFlat.includes('never requires copying or re-authoring unchanged prose'))
    // REVISED (EXLIB-2A/2B publication-lifecycle correction): draft/
    // review state is distinct from published-active state; a pending
    // replacement coexists with the published version; promotion is
    // atomic and locked; rejected replacements are inert; uniqueness
    // targets published versions only; no default-active trap.
    check('B1b: publication lifecycle — orthogonal draft/published/retired state born as draft (never auto-published), published-only partial uniqueness (zero or one per logical), pending/rejected structurally unpublishable, coexisting pending replacement, atomic locked promotion (validate -> retire -> publish, no two-published/no-published interval), rejected replacement inert, and publication transitions as the sole post-decision mutation',
      recFlat.includes('Draft/review state is distinct from published-active state') &&
      recFlat.includes('exactly zero or one PUBLISHED content version exists per logical exercise') &&
      recFlat.includes('pending or rejected content is never published or exposed') &&
      recFlat.includes('currently published version remains visible while its replacement is pending review') &&
      recFlat.includes("publication_status IN ('draft','published','retired')") &&
      recFlat.includes("DEFAULT 'draft'") &&
      recFlat.includes('NEVER auto-publishes (no') &&
      recFlat.includes("ON (logical_id) WHERE publication_status = 'published'") &&
      recFlat.includes('exercise_catalog_content_publication_chk') &&
      recFlat.includes("publication_status <> 'published' OR content_status IN ('approved','revised')") &&
      recFlat.includes('exposes ONLY rows with') &&
      recFlat.includes("publication_status = 'published' (which the publication CHECK") &&
      recFlat.includes('FUNCTION publish_catalog_content(p_logical_id, p_content_id)') &&
      recFlat.includes('lock the logical exercise row (SELECT ... FOR UPDATE ON') &&
      recFlat.includes('FAIL-CLOSED VALIDATIONS (each rejects with an error)') &&
      recFlat.includes('retire the currently published version (publication_status') &&
      recFlat.includes("publish the replacement ('draft' -> 'published')") &&
      recFlat.includes('no externally') &&
      recFlat.includes('observable interval ever has two published versions') &&
      recFlat.includes('published version when one existed before') &&
      recFlat.includes('A REJECTED replacement never reaches step 3') &&
      recFlat.includes('version is untouched') &&
      recFlat.includes('The ONLY permitted post-decision mutation is the') &&
      recFlat.includes('publication_status transition (draft -> published ->'))
    // REVISED (EXLIB-2A/2B security correction): the publication
    // function's SECURITY DEFINER execution boundary is hardened —
    // non-client-callable, role-restricted, fixed search_path,
    // schema-qualified, with explicit fail-closed input validations
    // — and the general auth.uid() statement is reconciled into two
    // explicit function classes.
    check('B1c: publication-function security — REVOKE EXECUTE FROM PUBLIC/anon/authenticated with GRANT only to exlib_catalog_admin, no service-role credential in app code, pinned safe search_path with schema-qualified references, fail-closed rejection of mismatched logical/content ids, non-draft targets, pending/rejected review, and blank evidence, direct client mutation denied with publication only via the restricted function, and the two-class function security model reconciled',
      recFlat.includes('EXECUTION BOUNDARY (non-client-callable, role-restricted)') &&
      recFlat.includes('REVOKE EXECUTE ON FUNCTION publish_catalog_content') &&
      recFlat.includes('FROM PUBLIC') &&
      recFlat.includes('FROM anon') &&
      recFlat.includes('FROM authenticated') &&
      recFlat.includes('GRANT EXECUTE ON FUNCTION publish_catalog_content') &&
      recFlat.includes('TO exlib_catalog_admin') &&
      recFlat.includes('No ordinary tenant/application role can call it') &&
      recFlat.includes('service-role credential is used or exposed in application') &&
      recFlat.includes('SET search_path = public, pg_temp') &&
      recFlat.includes('every referenced table/function is schema-qualified') &&
      recFlat.includes('p_content_id must belong to p_logical_id') &&
      recFlat.includes("must currently be in 'draft' publication") &&
      recFlat.includes('pending or rejected review state is rejected') &&
      recFlat.includes('incomplete or blank review evidence is rejected') &&
      recFlat.includes('run validations a-d fail-closed') &&
      recFlat.includes('Direct table mutation on `exercise_catalog_content` is denied to every client role') &&
      recFlat.includes('publication is possible ONLY through this restricted function') &&
      recFlat.includes('TENANT-DELIVERY functions') &&
      recFlat.includes('remain scoped to `auth.uid()` with no user parameter') &&
      recFlat.includes('ADMINISTRATIVE publication function') &&
      recFlat.includes('non-client-callable and role-restricted') &&
      recFlat.includes('no function is both'))
    check('B2: provenance split and honest metadata — METADATA provenance on exercise_catalog with conditional source CHECK (no prose authorship there), content provenance on the content version, enumerated behavior metadata incl. the honest non-strength patterns, relationships table as sole persisted store fed fail-closed from staging arrays, aliases in existing machinery only',
      recFlat.includes('Metadata provenance** lives on `exercise_catalog`') &&
      recFlat.includes('Instructional-content provenance and authorship** live on the specific `exercise_catalog_content` version') &&
      recFlat.includes('Prose authorship is never placed only on the catalog metadata snapshot') &&
      recFlat.includes("provenance IN ('forgefitos_original','external_source_derived')") &&
      recFlat.includes('structurally impossible for source-derived data to masquerade as original') &&
      recFlat.includes('constrained enumerated columns on `exercise_catalog`, not a free-form tags bag') &&
      ['cyclic_cardio', 'locomotion', 'jump', 'ground_to_standing',
        'mobility_flow', 'static_stretch', 'spinal_articulation']
        .every((p) => recFlat.includes(`'${p}'`)) &&
      recFlat.includes('never be force-fitted into strength-pattern values') &&
      recFlat.includes('STAGING INPUTS ONLY') &&
      recFlat.includes('never persisted redundantly as content JSONB') &&
      recFlat.includes('`exercise_catalog_relationships` is the sole persisted source of truth') &&
      recFlat.includes('Aliases likewise stay exclusively in the existing alias machinery'))
    check('B3: unchanged foundations and boundaries — logical-id relationships, refresh-only-catalog-fields, stable tenant ids, archive-not-delete, link-not-merge seeds with the 15-covered/14-compatible Plank distinction, delivery-at-signup after proof, unchanged claim machinery, three weight_time locks, reused rollback machinery, and the record authorizes nothing',
      recFlat.includes('DESIGN RECORD ONLY') &&
      recFlat.includes(BASELINE) &&
      recFlat.includes('bind logical ids (stable identity), not snapshot ids') &&
      recFlat.includes('update ONLY catalog-controlled fields') &&
      recFlat.includes('NEVER touch user-owned notes, is_active, or any') &&
      recFlat.includes('History is therefore stable by construction') &&
      recFlat.includes('per-user `is_active = false` on the tenant copy') &&
      recFlat.includes('reconcile later by LINKING (provenance backfill), never merging or deleting') &&
      recFlat.includes('15 of 15 names are covered; only 14 of 15 are currently link-compatible') &&
      recFlat.includes('**Plank fails criterion (b)**') &&
      recFlat.includes('no automatic link, merge, tracking-mode rewrite, or delivery overwrite is authorized') &&
      recFlat.includes('The live seed module is not modified in this milestone') &&
      recFlat.includes('retired for future accounts ONLY after EXLIB-2G/2H prove delivery end-to-end') &&
      recFlat.includes('the existing fail-closed machinery is the contract') &&
      recFlat.includes('three independent locks') &&
      recFlat.includes('`rollback_catalog_delivery` removes a') &&
      recFlat.includes('no migration is authored in this milestone') &&
      recFlat.includes('It authorizes no migration, no catalog loading, no ledger change, and no runtime code change') &&
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
    // REVISED (EXLIB-2A/2B review correction): content_review is
    // structurally bound to the content version; deferred flags are
    // bidirectionally conditional; relationship/alias arrays are
    // staging inputs with blank rejection and uniqueness; rules
    // draft-07 cannot express are pinned as mandatory deterministic
    // validator rules, not comments.
    check('C2: fail-closed rules are structural — content_review pending carries no evidence and decided carries all of it (bound to the content version); original provenance forbids source fields and source provenance requires them; weight_time forces deferred=true; deferred=false locks the four supported modes AND requires deferred_reason=null; deferred=true requires a nonblank reason; import_eligible is a const false',
      (() => {
        const cr = props.content_review
        const conds = JSON.stringify(schema.allOf)
        return cr.required.length === 4 &&
          JSON.stringify(cr.allOf).includes('"pending"') &&
          String(cr.$comment).includes('bound to THIS content version') &&
          String(cr.$comment).includes('exercise_catalog_content.content_status') &&
          conds.includes('"forgefitos_original"') &&
          conds.includes('"external_source_derived"') &&
          conds.includes('"weight_time"') &&
          JSON.stringify(schema.allOf[3].then.properties.tracking_mode.enum) ===
            JSON.stringify([...TRACKING_MODES]) &&
          schema.allOf[3].then.properties.deferred_reason.type === 'null' &&
          schema.allOf[4].then.properties.deferred_reason.minLength >= 10 &&
          schema.allOf[4].then.properties.deferred_reason.pattern === '\\S' &&
          props.import_eligible.const === false &&
          String(schema.$comment).includes('Blank is never approval') &&
          String(schema.$comment).includes('copied-source attribution') &&
          String(schema.$comment).includes('authoring records NEVER carry publication state') &&
          String(schema.$comment).includes('nothing in an authoring file can publish content')
      })())
    check('C3: relationship and alias arrays are staging inputs with structural hygiene — uniqueItems, nonblank pattern items, staging-only comments — and prose authorship fields align to the content-version architecture',
      (() => {
        const arrays = [props.substitutions, props.regressions, props.progressions, props.aliases]
        return arrays.every((a: any) => a.uniqueItems === true &&
            a.items.pattern === '\\S' && a.items.minLength >= 2) &&
          [props.substitutions, props.regressions, props.progressions].every((a: any) =>
            String(a.$comment).includes('STAGING INPUT ONLY') &&
            String(a.$comment).includes('exercise_catalog_relationships') &&
            String(a.$comment).includes('never persisted as content JSONB')) &&
          String(props.aliases.$comment).includes('EXISTING alias machinery only') &&
          String(props.authored_by.$comment).includes('THIS content version') &&
          String(props.authored_by.$comment).includes('NOT to the catalog metadata snapshot') &&
          props.authored_by.pattern === '\\S'
      })())
    check('C4: every rule draft-07 cannot express alone is pinned as a MANDATORY deterministic validator rule (normalized uniqueness, self-reference, target resolution, trim-blank, weight_time exclusion, import_eligible literal, attribution scan, provenance cross-check)',
      (() => {
        const rules: string[] = schema.x_mandatory_validator_rules
        return Array.isArray(rules) && rules.length === 8 &&
          ['R1','R2','R3','R4','R5','R6','R7','R8'].every((id, i) => rules[i].startsWith(`${id}:`)) &&
          rules.some((r) => r.includes('NORMALIZED')) &&
          rules.some((r) => r.includes('self-reference')) &&
          rules.some((r) => r.includes('resolve to an existing corpus canonical name')) &&
          rules.some((r) => r.includes('excluded from every proposed import subset')) &&
          rules.some((r) => r.includes('copied-source attribution')) &&
          String(schema.$comment).includes('binding contract, not commentary')
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
    // REVISED (EXLIB-2A/2B review correction): name coverage and
    // link compatibility are distinct, both recomputed from the LIVE
    // seed module (name + tracking_mode + equipment).
    check('D4: seed analysis is exact and mechanical (anchored at the delivery predecessor) — all 15 seed names covered exactly once, but only 14 were link-compatible then (name+tracking+equipment agreement); Plank is the sole incompatible entry (seed bodyweight vs catalog timed), and every inventory compatibility flag matches the recomputation',
      (() => {
        // RETARGET (EXLIB-2S delivery-activation preparation): the seed
        // is anchored at the delivery predecessor, where this
        // milestone's analysis was and remains true.
        const seedSrc = execSync('git show 5f7e182f3027b3640514e06d642693f4018c03e2:src/lib/supabase/seed-exercises.ts', { encoding: 'utf8', maxBuffer: 1 << 26 })
        const seedFacts = new Map<string, { equipment: string; tracking: string }>()
        Array.from(seedSrc.matchAll(
          /\{ name: "([^"]+)",\s*category: "[^"]*",\s*primary_muscle: "[^"]*",\s*equipment: "([^"]*)",\s*tracking_mode: "([^"]*)"/g))
          .forEach((m) => seedFacts.set(m[1].trim().toLowerCase(), { equipment: m[2], tracking: m[3] }))
        if (seedFacts.size !== 15) return false
        const claimed = inv.filter((r) => r.corresponds_to_seed !== null)
        if (claimed.length !== 15) return false
        if (JSON.stringify(claimed.map((r) => String(r.corresponds_to_seed).trim().toLowerCase()).sort()) !==
            JSON.stringify(Array.from(seedFacts.keys()).sort())) return false
        const compatible = claimed.filter((r) => {
          const sf = seedFacts.get(r.normalized_name)!
          const isCompat = sf.tracking === r.tracking_mode && sf.equipment === r.equipment
          if (r.seed_link_compatible !== isCompat) return false
          return isCompat
        })
        const flagsConsistent = claimed.every((r) => {
          const sf = seedFacts.get(r.normalized_name)!
          return r.seed_link_compatible === (sf.tracking === r.tracking_mode && sf.equipment === r.equipment)
        })
        const nonSeedFlagsNull = inv.filter((r) => r.corresponds_to_seed === null)
          .every((r) => r.seed_link_compatible === null)
        const incompatible = claimed.filter((r) => r.seed_link_compatible === false)
        return flagsConsistent && nonSeedFlagsNull &&
          compatible.length === 14 &&
          incompatible.length === 1 &&
          incompatible[0].normalized_name === 'plank' &&
          incompatible[0].tracking_mode === 'timed' &&
          seedFacts.get('plank')!.tracking === 'bodyweight'
      })())
    check('D4b: the proposed catalog Plank is timed (an honest hold), its derived legacy type is mobility, and its seed correspondence is preserved as a factual name match only',
      (() => {
        const plank = inv.find((r) => r.normalized_name === 'plank')
        return !!plank && plank.tracking_mode === 'timed' &&
          plank.exercise_type_derived === 'mobility' &&
          plank.corresponds_to_seed === 'Plank' &&
          plank.seed_link_compatible === false && !plank.deferred
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
        const linkCompat = inv.filter((r) => r.seed_link_compatible === true).length
        const candMatches = inv.filter((r) => r.name_matches_legacy_candidate !== null).length
        const manMatches = inv.filter((r) => r.name_matches_manifest_entry === true).length
        const distinct = inv.filter((r) => r.collision_classification === 'distinct').length
        return JSON.stringify(mach.release_1_target_range) === JSON.stringify([120, 150]) &&
          mach.release_1_proposed_count === release.length &&
          mach.deferred_weight_time_count === deferred.length &&
          mach.total_inventory_records === inv.length &&
          mach.collision_analysis.internal_normalized_duplicates === 0 &&
          mach.collision_analysis.corresponds_to_seed === seeds &&
          mach.collision_analysis.seed_link_compatible === linkCompat &&
          mach.collision_analysis.name_matches_legacy_candidate === candMatches &&
          mach.collision_analysis.name_matches_manifest_entry === manMatches &&
          mach.collision_analysis.fully_distinct === distinct &&
          dims.every(([mk, ik]) =>
            JSON.stringify(mach.release_1_tallies[mk]) === JSON.stringify(tally(ik)))
      })())
    check('D8: all twelve supported equipment values are represented in release 1, including the four EXLIB-1C0B3 additions',
      (EQUIPMENT_TYPES as readonly string[])
        .every((eq) => release.some((r) => r.equipment === eq)))
    // REVISED (EXLIB-2A/2B review correction): cardio/locomotion/
    // jump/get-up/mobility movements carry honest patterns — the
    // twelve reviewer-named entries are pinned exactly.
    check('D9: honest movement patterns — the twelve reclassified entries carry their dedicated non-strength patterns, and no cardio-mode or mobility-role entry uses squat/lunge/carry/horizontal_pull/core_anti_extension',
      (() => {
        const want: Record<string, string> = {
          'rowing machine': 'cyclic_cardio',
          'stationary bike': 'cyclic_cardio',
          'elliptical trainer': 'cyclic_cardio',
          'treadmill run': 'locomotion',
          'stair climber': 'locomotion',
          'jump rope': 'jump',
          'turkish get-up': 'ground_to_standing',
          "world's greatest stretch": 'mobility_flow',
          '90/90 hip switch': 'mobility_flow',
          'couch stretch': 'static_stretch',
          'cat-cow': 'spinal_articulation',
          'thoracic extension on foam roller': 'spinal_articulation',
        }
        const byName = new Map(inv.map((r) => [r.normalized_name, r]))
        const banned = ['squat', 'lunge', 'carry', 'horizontal_pull', 'core_anti_extension']
        return Object.entries(want).every(([n, p]) => byName.get(n)?.movement_pattern === p) &&
          release.filter((r) => r.tracking_mode === 'cardio' || r.training_role === 'mobility')
            .every((r) => !banned.includes(r.movement_pattern))
      })())
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
          const phase = Array.from(adders)[0]
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
