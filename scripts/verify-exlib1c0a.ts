// ============================================================
// ForgeFitOS — EXLIB-1C0A private-use decision + equipment
// resolution harness. Proves the promoted EXLIB-1C0 packet stays
// byte-preserved as historical evidence, the private-use product
// decision is recorded with exact language and honest
// classification (no counsel claim, public/commercial gate open, no
// loading authorization), and the equipment overlay resolves
// EXACTLY nine ambiguous records into EXACTLY 26 canonical
// candidates reconciled against the REAL applied schema vocabulary,
// with independent (non-StrengthLog) evidence and no approvals.
// REVISED (EXLIB-1C0A direct review, committed-state lifecycle):
// adds the vocabulary product decision (extend_schema, fallbacks
// rejected, nothing implemented), weight_time tracking honesty for
// the weighted planks, dual-level eligibility counts, the durable
// E2 range pin, and a lifecycle-safe D1 that works uncommitted,
// on the QA candidate, and on promoted main.
// Run from the repository root:
//   npx tsx scripts/verify-exlib1c0a.ts
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
const sha256 = (p: string) => createHash('sha256').update(readFileSync(p)).digest('hex')

const START_COMMIT = '8ff68a1964e16a8163d599bbec46ff0a58a99713'
const PACKET_COMMIT = '1f9bbfa2bc1e08e1a185927cf09d94b789135483'
const RETARGET_COMMIT = '45b290c3639833010f7faf7d6c313ddcc3ee61aa'
const MANIFEST_SHA = '336cd4253f747cdb3ba73ffa2af5a63e255c7c87cc452d4c43ed59a654673dfa'
const LEDGER_SHA = 'aa4fe77c0c633510661eede94b40e9bae4aca90a7d8c2794abde92c83c6f7b7b'
const M023_SHA = '0991448c39a558385431c78cef6d6063df208312a3f53866756ba730066c42f2'
const M024_SHA = '190550ecdb99df702ab03d1b07592f861070141e5091eb25bc5bf45f211cc980'
const PACKET_SHA = '120ffcae062dc9968afaee2d5ab57e7651f4fd0dc9945711adc658140ff8ef28'
const PROPOSALS_SHA = '70e872febf76565147d94bf1c87d7a4c781bb048b1609059f1705da11bbed412'
const GUIDE_SHA = 'dd0c9d323c3685f27bf3478a944b441e08f2f26745aaefa9c7a2d5aedcd37d1f'
const VERIFIER_SHA = '7c2bcf068765e3ac0b56e1c23ee05048621859f09193d3a9f4aa782791ac9d0c'

const decision = read('docs/exlib1c0a-private-use-product-decision.md')
// Strip markdown blockquote markers before flattening so the exact
// decision sentences match across wrapped "> " lines.
const decisionFlat = decision.replace(/^>\s?/gm, '').replace(/\s+/g, ' ')
const overlayRaw = read('docs/exlib1c0a-equipment-resolution.jsonl')
const resolutions = overlayRaw.split('\n').filter((l) => l && !l.startsWith('#')).map((l) => JSON.parse(l))
const proposals = read('docs/exlib1c0-human-review-proposals.jsonl')
  .split('\n').filter((l) => l && !l.startsWith('#')).map((l) => JSON.parse(l))
const m023 = read('supabase/migrations/023_exlib_catalog_and_delivery_contract.sql')

// The REAL applied vocabularies, parsed from migration 023's CHECK
// constraints — never hardcoded independently of the schema.
function parseCheckList(anchor: string): string[] {
  const idx = m023.indexOf(anchor)
  if (idx < 0) return []
  const seg = m023.slice(idx, m023.indexOf('))', idx))
  return Array.from(seg.matchAll(/'([a-z_]+)'/g)).map((m) => m[1])
}
const SCHEMA_EQUIPMENT = parseCheckList('equipment IN (')
const SCHEMA_LATERALITY = parseCheckList('laterality IN')
const SCHEMA_TRACKING = parseCheckList('tracking_mode IN')

const EXPECTED_MAP: Record<string, string[]> = {
  'https://www.strengthlog.com/dragon-flag/': ['Dragon Flag'],
  'https://www.strengthlog.com/weighted-plank/': ['Plate-Weighted Plank', 'Weighted-Vest Plank'],
  'https://www.strengthlog.com/jefferson-curl/': ['Bodyweight Jefferson Curl', 'Dumbbell Jefferson Curl', 'Kettlebell Jefferson Curl', 'Barbell Jefferson Curl'],
  'https://www.strengthlog.com/bayesian-curl/': ['Single-Arm Cable Bayesian Curl'],
  'https://www.strengthlog.com/hammer-curl/': ['Dumbbell Hammer Curl', 'Cable Rope Hammer Curl', 'Resistance-Band Hammer Curl'],
  'https://www.strengthlog.com/donkey-calf-raises/': ['Bodyweight Donkey Calf Raise', 'Machine Donkey Calf Raise'],
  'https://www.strengthlog.com/standing-calf-raise/': ['Bodyweight Standing Calf Raise', 'Dumbbell Standing Calf Raise', 'Barbell Standing Calf Raise', 'Smith-Machine Standing Calf Raise', 'Machine Standing Calf Raise'],
  'https://www.strengthlog.com/ground-to-overhead/': ['Barbell Ground to Overhead', 'Dumbbell Ground to Overhead', 'Kettlebell Ground to Overhead', 'Sandbag Ground to Overhead'],
  'https://www.strengthlog.com/standing-hip-flexor-raise/': ['Bodyweight Standing Knee Raise', 'Resistance-Band Standing Hip Flexion', 'Cable Standing Hip Flexion', 'Standing Hip-Flexion Machine'],
}
const VOCAB_DECISION_CANDIDATES = ['Plate-Weighted Plank', 'Weighted-Vest Plank',
  'Smith-Machine Standing Calf Raise', 'Sandbag Ground to Overhead']
const INVENTORY_1C0A = [
  'docs/exlib1c0a-equipment-resolution.jsonl',
  'docs/exlib1c0a-private-use-product-decision.md',
  'scripts/verify-exlib1c0a.ts',
]

async function main() {
  console.log('\nA. Immutable baseline')
  {
    check('A1: immutable ancestry — packet and retarget commits exact; HEAD descends; stable tag at the retarget commit',
      (() => {
        try {
          const tag = execSync('git rev-parse "exlib1c0-legal-human-review-packet-stable^{}"', { encoding: 'utf8' }).trim()
          const p1 = execSync(`git rev-parse "${PACKET_COMMIT}^"`, { encoding: 'utf8' }).trim()
          const p2 = execSync(`git rev-parse "${RETARGET_COMMIT}^"`, { encoding: 'utf8' }).trim()
          execSync(`git merge-base --is-ancestor ${RETARGET_COMMIT} HEAD`)
          return tag === RETARGET_COMMIT && p1 === START_COMMIT && p2 === PACKET_COMMIT
        } catch { return false }
      })())
    check('A2: the promoted EXLIB-1C0 artifacts are byte-preserved as historical evidence (docs on disk; verifier at the promoted commit, its worktree diff admission-only per D1)',
      sha256('docs/exlib1c0-legal-product-approval-packet.md') === PACKET_SHA &&
      sha256('docs/exlib1c0-human-review-proposals.jsonl') === PROPOSALS_SHA &&
      sha256('docs/exlib1c0-human-review-guide.md') === GUIDE_SHA &&
      (() => {
        try {
          const blob = execSync(`git show ${RETARGET_COMMIT}:scripts/verify-exlib1c0.ts`,
            { encoding: 'buffer', maxBuffer: 1024 * 1024 * 16 }) as unknown as Buffer
          return createHash('sha256').update(blob).digest('hex') === VERIFIER_SHA
        } catch { return false }
      })())
    check('A3: manifest and AUTHORITATIVE ledger byte-unchanged; ledger 48/48 pending-null',
      (() => {
        const led = read('docs/exlib1b1-review-ledger.jsonl')
          .split('\n').filter((l) => l && !l.startsWith('#')).map((l) => JSON.parse(l))
        return sha256('docs/exlib1a-discovery-manifest.jsonl') === MANIFEST_SHA &&
          sha256('docs/exlib1b1-review-ledger.jsonl') === LEDGER_SHA &&
          led.length === 48 &&
          led.every((l) => l.status === 'pending' && l.reviewer === null &&
            l.reviewed_at === null && l.decision_rationale === null)
      })())
    check('A4: migrations exactly 001-024 with exact applied fingerprints; NO migration 025',
      (() => {
        const files = readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql'))
        return files.length === 24 &&
          files.filter((f) => f.startsWith('025')).length === 0 &&
          sha256('supabase/migrations/023_exlib_catalog_and_delivery_contract.sql') === M023_SHA &&
          sha256('supabase/migrations/024_exlib_post_application_hardening.sql') === M024_SHA
      })())
    check('A5: no product/API/schema/dependency change and no EXLIB-1C implementation artifacts',
      (() => {
        try {
          return execSync(
            'git diff --name-only -- src/ supabase/ package.json package-lock.json next.config.mjs tailwind.config.ts tsconfig.json',
            { encoding: 'utf8' }).trim() === '' &&
            !existsSync('scripts/exlib1c-import.ts') &&
            !existsSync('src/lib/catalog-import.ts')
        } catch { return false }
      })())
  }

  console.log('\nB. Private-use decision record')
  {
    check('B1: the overlay preserves EXLIB-1C0 as the stable pre-decision record and disclaims retroactive change',
      decisionFlat.includes('remains the stable record of the pre-decision review state') &&
      decisionFlat.includes('supersedes only the private-use product-direction interpretation going forward') &&
      decisionFlat.includes('does not retroactively change what the packet truthfully recorded when promoted') &&
      decisionFlat.includes('remains pending because resolving one dimension does not constitute full-record approval'))
    check('B2: the exact private-use decision language is recorded, attributed to Joseph Carfagno, dated 2026-08-24',
      decisionFlat.includes('ForgeFitOS may use the EXLIB-1A manifest solely as an internal research and discovery artifact to construct an independently reviewed ForgeFitOS exercise catalog for private personal use.') &&
      decisionFlat.includes('No StrengthLog prose, instructions, programs, images, videos, branding, or source-specific expressive content may be imported.') &&
      decisionFlat.includes('Production records must use independently determined ForgeFitOS metadata.') &&
      decisionFlat.includes('Public or commercial release requires a separate review of the final ForgeFitOS catalog and product.') &&
      decisionFlat.includes('Joseph Carfagno') && decisionFlat.includes('2026-08-24'))
    check('B3: the decision classification is exact — private-use CLOSED/APPROVED; public/commercial OPEN; no clearance/permission/loading/record/1C claims',
      decisionFlat.includes('Private-use product decision: CLOSED/APPROVED by Joseph') &&
      decisionFlat.includes('Public/commercial product decision: OPEN') &&
      decisionFlat.includes('Formal legal clearance: not claimed') &&
      decisionFlat.includes('StrengthLog permission: not claimed') &&
      decisionFlat.includes('This does not authorize catalog loading') &&
      decisionFlat.includes('This does not approve any of the 48 full exercise records') &&
      decisionFlat.includes('This does not begin EXLIB-1C'))
    check('B4: no counsel claim and no legal-conclusion phrase in either overlay artifact',
      decisionFlat.includes('Neither ChatGPT nor Claude is legal counsel') &&
      [decisionFlat, overlayRaw.replace(/\s+/g, ' ')].every((t) =>
        // "is legal counsel" appears only inside the required
        // NOT-counsel disclaimer; every conclusion form stays banned.
        !/uncopyrightable|is legal\b(?! counsel)|is lawful|clearly permitted|no legal risk|zero legal risk|fair use permits/i.test(t)))
    check('B5: the source boundary is complete — internal provenance only, no expressive content, independent production metadata',
      decisionFlat.includes('internal research/discovery provenance only') &&
      decisionFlat.includes('It is not the production import payload') &&
      decisionFlat.includes('not importing StrengthLog workouts, programs, instructions, descriptions, cues, images, videos, muscle maps, branding, or other expressive content') &&
      decisionFlat.includes('StrengthLog URLs and source category placements are not production-facing catalog content') &&
      ['canonical identity', 'display name', 'aliases', 'anatomy', 'equipment',
        'laterality', 'tracking mode', 'eligibility', 'future original description/media']
        .every((f) => decisionFlat.includes(f)) &&
      decisionFlat.includes("must not represent itself as a copy or redistribution of StrengthLog's compiled directory"))
    check('B6: the gate reconciliation table is honest — historical L2 OPEN, private-use L2 CLOSED, L1 OPEN for public/commercial, loading prohibited',
      decisionFlat.includes('CLOSED for PRIVATE USE by Joseph') &&
      decisionFlat.includes('remains OPEN for public/commercial release; not claimed for private use') &&
      decisionFlat.includes('production payload independence replaces source-dataset copying as the controlling technical boundary') &&
      decisionFlat.includes('remains prohibited until a separately approved exact catalog payload exists') &&
      decisionFlat.includes('except where already technically established by applied migrations 023-024'))
    // REVISED (EXLIB-1C0A direct review, committed-state lifecycle):
    // Joseph's explicit product-vocabulary decision is recorded with
    // exact language and honest non-authorization classification.
    check('B7: the product-vocabulary decision is recorded verbatim, attributed and dated, and authorizes NO implementation',
      decisionFlat.includes('ForgeFitOS should preserve equipment-specific exercise identities.') &&
      decisionFlat.includes('The future catalog vocabulary should add `weight_plate`, `weighted_vest`, `smith_machine`, and `sandbag` rather than collapse those identities into `other` or generic `machine`.') &&
      decisionFlat.includes("This approves the product vocabulary direction only; it does not authorize migration 025, schema implementation, catalog loading, or any exercise's full-record eligibility.") &&
      decisionFlat.includes('Vocabulary direction: CLOSED/APPROVED by Joseph') &&
      decisionFlat.includes('Schema implementation: NOT AUTHORIZED') &&
      decisionFlat.includes('Migration 025: NOT AUTHORED/NOT APPROVED') &&
      decisionFlat.includes('remain import-ineligible until the schema/product implementation is separately reviewed and applied'))
  }

  console.log('\nC. Equipment-resolution overlay')
  {
    check('C1: exactly NINE source resolutions, one per expected ambiguous ledger identity, source facts verbatim from the workbook',
      resolutions.length === 9 &&
      JSON.stringify(resolutions.map((r) => r.source_identity.ledger_id).sort()) ===
        JSON.stringify(Object.keys(EXPECTED_MAP).sort()) &&
      resolutions.every((r) => {
        const p = proposals.find((x) => x.ledger_id === r.source_identity.ledger_id)
        return !!p && p.source_identity.source_name === r.source_identity.source_name &&
          p.source_identity.source_page === r.source_identity.source_page &&
          p.source_identity.retrieved_at === r.source_identity.retrieved_at &&
          p.proposed_equipment === null
      }))
    check('C2: exactly 26 DISTINCT canonical candidates with the exact per-family mapping (no missing/extra/duplicated name)',
      (() => {
        const names = resolutions.flatMap((r) => r.canonical_candidates.map((c: any) => c.candidate_name))
        if (names.length !== 26 || new Set(names).size !== 26) return false
        return resolutions.every((r) =>
          JSON.stringify(r.canonical_candidates.map((c: any) => c.candidate_name)) ===
          JSON.stringify(EXPECTED_MAP[r.source_identity.ledger_id]))
      })())
    check('C3: schema vocabulary parsed from the APPLIED migration is the eight expected values; supported candidates use it exactly; the four unsupported candidates carry explicit vocabulary decisions with null schema value',
      JSON.stringify([...SCHEMA_EQUIPMENT].sort()) === JSON.stringify(['barbell', 'bodyweight', 'cable', 'dumbbell', 'kettlebell', 'machine', 'other', 'resistance_band']) &&
      resolutions.every((r) => r.canonical_candidates.every((c: any) => {
        const e = c.equipment
        if (VOCAB_DECISION_CANDIDATES.includes(c.candidate_name)) {
          // REVISED (EXLIB-1C0A direct review, committed-state
          // lifecycle): Joseph selected extend_schema for all four;
          // the fallback mapping is rejected; the applied schema
          // still lacks the value and no implementation is claimed.
          const rejectedTarget = c.candidate_name === 'Smith-Machine Standing Calf Raise' ? "'machine'" : "'other'"
          return e.schema_supported === false && e.schema_value === null &&
            e.vocabulary_decision_required === true &&
            !SCHEMA_EQUIPMENT.includes(e.desired_value) &&
            Array.isArray(e.vocabulary_options) && e.vocabulary_options.length >= 2 &&
            e.vocabulary_options.some((o: string) => o.includes('separately reviewed schema/product change')) &&
            e.vocabulary_options.every((o: string) => !/CREATE|ALTER|INSERT/.test(o)) &&
            e.product_decision === 'extend_schema' &&
            e.product_decision_maker.includes('Joseph Carfagno') &&
            e.product_decision_date === '2026-08-24' &&
            e.fallback_mapping_rejected.includes(rejectedTarget) &&
            e.fallback_mapping_rejected.includes('rejected by the product decision') &&
            e.implementation_status.includes('NOT AUTHORIZED') &&
            e.implementation_status.includes('migration 025 not authored/not approved')
        }
        return e.schema_supported === true && e.vocabulary_decision_required === false &&
          e.schema_value === e.desired_value && SCHEMA_EQUIPMENT.includes(e.schema_value)
      })) &&
      resolutions.flatMap((r) => r.canonical_candidates.filter((c: any) => c.equipment.vocabulary_decision_required))
        .map((c: any) => c.candidate_name).sort().join('|') === [...VOCAB_DECISION_CANDIDATES].sort().join('|'))
    // REVISED (EXLIB-1C0A final consistency correction): the two
    // weighted-plank candidates record the honest desired future
    // mode weight_time (unsupported, null schema value, timed
    // rejected); every other candidate keeps a real schema value;
    // the Weighted Plank resolution's decision_basis carries the
    // corrected tracking language, and NO stale claim that plain
    // 'timed' is the proposed/selected final mapping survives
    // anywhere in the overlay.
    const PLANK_CANDIDATES = ['Plate-Weighted Plank', 'Weighted-Vest Plank']
    check('C4: tracking honesty — corrected Weighted Plank basis; NO stale timed-is-proposed claim; planks record unsupported weight_time with null schema value and timed rejected; all other tracking/laterality values are real applied-schema values',
      (() => {
        const eq02 = resolutions.find((r) => r.resolution_id === 'exlib1c0a-eq-02')
        return !!eq02 &&
          eq02.decision_basis.includes('weight_time is the desired future tracking identity because the exercise records both external load and hold duration') &&
          eq02.decision_basis.includes('weight_time is not supported by the applied schema, so proposed_tracking_mode and the tracking schema value remain null') &&
          eq02.decision_basis.includes("plain 'timed' is rejected because it loses the external load") &&
          eq02.decision_basis.includes('tracking/schema implementation and full-record eligibility remain pending and unauthorized') &&
          !/'timed' is (proposed|selected)|propos\w* (plain )?'timed'|select\w* (plain )?'timed'|'timed' (is|as) the (proposed|selected|final)/i.test(overlayRaw)
      })() &&
      SCHEMA_TRACKING.length === 4 && SCHEMA_LATERALITY.length === 3 &&
      !SCHEMA_TRACKING.includes('weight_time') &&
      resolutions.every((r) => r.canonical_candidates.every((c: any) => {
        if (!SCHEMA_LATERALITY.includes(c.proposed_laterality)) return false
        if (PLANK_CANDIDATES.includes(c.candidate_name)) {
          const t = c.tracking
          return c.proposed_tracking_mode === null && !!t &&
            t.desired_future_value === 'weight_time' &&
            t.schema_supported === false && t.schema_value === null &&
            t.tracking_decision_required === true &&
            t.rejected_mapping === "mapping to plain 'timed' is rejected because it loses the external load" &&
            t.implementation_status === 'no SQL or product implementation is authorized'
        }
        return SCHEMA_TRACKING.includes(c.proposed_tracking_mode) && c.tracking === undefined
      })) &&
      resolutions.flatMap((r) => r.canonical_candidates.filter((c: any) => c.proposed_tracking_mode === null))
        .map((c: any) => c.candidate_name).sort().join('|') === [...PLANK_CANDIDATES].sort().join('|'))
    check('C5: every resolution carries independent evidence (retrieved 2026-08-24) and ZERO StrengthLog evidence or candidate URLs',
      resolutions.every((r) =>
        Array.isArray(r.independent_evidence) && r.independent_evidence.length >= 1 &&
        r.independent_evidence.every((e: any) =>
          /^https:\/\//.test(e.url) && !/strengthlog\.com/i.test(e.url) &&
          e.retrieved_at === '2026-08-24' &&
          typeof e.classification_fact === 'string' && e.classification_fact.length > 20)) &&
      resolutions.every((r) => !/strengthlog/i.test(JSON.stringify(r.canonical_candidates))))
    check('C6: no copied instructions, long prose, or media anywhere in the overlay',
      !/how to perform|step [0-9]|keep your|brace your|drive through|squeeze at the top|muscles worked:|benefits of/i.test(overlayRaw) &&
      !/\.(jpg|jpeg|png|gif|webp|mp4|webm)/i.test(overlayRaw) &&
      resolutions.every((r) => r.independent_evidence.every((e: any) => e.classification_fact.length < 400)))
    // REVISED (EXLIB-1C0A direct review, committed-state lifecycle):
    // eligibility is now proven at BOTH levels — exactly 9
    // resolution-level and exactly 26 candidate-level false values,
    // with no true and no missing field anywhere.
    check('C7: every resolution is honest — Joseph owns the equipment decomposition only; anatomy/full-record pending; exactly 9 resolution-level AND 26 candidate-level import_eligible:false; no approval claims',
      resolutions.every((r) =>
        r.equipment_decision_maker.includes('Joseph Carfagno') &&
        r.equipment_decision_maker.includes('equipment decomposition only') &&
        r.pending.includes('anatomy and full-record eligibility remain pending') &&
        r.import_eligible === false &&
        r.legal_approval_claimed === false &&
        r.specialist_approval_claimed === false) &&
      resolutions.filter((r) => r.import_eligible === false).length === 9 &&
      resolutions.flatMap((r) => r.canonical_candidates)
        .filter((c: any) => c.import_eligible === false).length === 26 &&
      resolutions.every((r) => r.canonical_candidates.every((c: any) =>
        Object.prototype.hasOwnProperty.call(c, 'import_eligible') && c.import_eligible === false)))
    check('C8: generic-name dispositions and aliases are exact — Hammer Curl and Ground to Overhead are movement families; Bayesian and hip-flexor aliases retained',
      (() => {
        const by = (u: string) => resolutions.find((r) => r.source_identity.ledger_id === u)!
        const hammer = by('https://www.strengthlog.com/hammer-curl/')
        const gto = by('https://www.strengthlog.com/ground-to-overhead/')
        const bayes = by('https://www.strengthlog.com/bayesian-curl/')
        const hip = by('https://www.strengthlog.com/standing-hip-flexor-raise/')
        return hammer.generic_name_disposition === 'generic Hammer Curl is a movement-family/search term, not a loggable canonical identity' &&
          gto.generic_name_disposition === 'generic Ground to Overhead is a movement family, not a canonical identity' &&
          JSON.stringify(bayes.canonical_candidates[0].aliases) === JSON.stringify(['Bayesian Curl']) &&
          JSON.stringify(hip.family_aliases) === JSON.stringify(['Standing Hip Flexor Raise'])
      })())
  }

  console.log('\nD. Phase boundary')
  {
    // REVISED (EXLIB-1C0A direct review, committed-state lifecycle):
    // D1 now supports EXACTLY two legitimate states. While the phase
    // is uncommitted it proves the exact worktree (three untracked
    // artifacts + eight line-exact suite diffs). Once the decision
    // document is present in HEAD it requires a CLEAN worktree,
    // mechanically identifies the unique phase commit that first
    // added it (no hardcoded future SHA), and proves the same
    // line-exact diffs from that immutable commit range — valid on
    // both the QA candidate and promoted main.
    const SEVEN_SUITES = ['scripts/verify-exlib1a.ts', 'scripts/verify-exlib1b1.ts',
      'scripts/verify-exlib1b3.ts', 'scripts/verify-ui5b1b.ts', 'scripts/verify-ui5b2.ts',
      'scripts/verify-ui6c.ts', 'scripts/verify-ui7.ts']
    const SEVEN_ADDS = [
      '// ADMISSION (EXLIB-1C0A): the private-use decision and',
      '// equipment-resolution overlay artifacts are admitted',
      '// while uncommitted.',
      "f.startsWith('docs/exlib1c0a-') ||",
    ]
    const C0_DELS = [
      'const correctionRange = execSync(`git diff --name-only ${PACKET_COMMIT}..HEAD`, { encoding: \'utf8\' })',
      "return porcelain === '' && staged === '' &&",
    ]
    const C0_ADDS = [
      '// RETARGET (EXLIB-1C0A, immutable committed-range preservation):',
      '// the approved, immutable verifier-retarget commit that closed the',
      '// EXLIB-1C0 phase; the historical correction range ends HERE, never',
      '// at a moving HEAD.',
      "const RETARGET_COMMIT = '45b290c3639833010f7faf7d6c313ddcc3ee61aa'",
      '// ADMISSION (EXLIB-1C0A): the private-use decision and',
      '// equipment-resolution overlay artifacts (and their',
      '// verifier) are admitted while uncommitted, as are',
      '// committed verify suites whose worktree diff carries the',
      '// ADMISSION (EXLIB-1C0A) label.',
      "const porcelainAfterAdmissions = porcelain.split('\\n').filter(Boolean)",
      '.filter((l) => {',
      "const m = l.match(/^\\s*(\\?\\?|[A-Z]{1,2})\\s+(.+)$/)",
      "const status = m ? m[1] : ''",
      'const f = m ? m[2] : l',
      "if (f.startsWith('docs/exlib1c0a-') ||",
      "f === 'scripts/verify-exlib1c0a.ts') return false",
      "if (status === 'M' && f.startsWith('scripts/verify-') && f.endsWith('.ts')) {",
      'try {',
      'return !execSync(`git diff -- ${f}`, { encoding: \'utf8\' })',
      ".includes('ADMISSION (EXLIB-1C0A)')",
      '} catch { return true }',
      '}',
      'return true',
      "}).join('\\n')",
      '// RETARGET (EXLIB-1C0A, immutable committed-range',
      '// preservation): the historical correction range ends at',
      '// the immutable retarget commit, NOT at current HEAD, so',
      '// future phases advancing HEAD can never alter it; HEAD',
      '// must instead DESCEND from that commit.',
      'const correctionRange = execSync(`git diff --name-only ${PACKET_COMMIT}..${RETARGET_COMMIT}`, { encoding: \'utf8\' })',
      'execSync(`git merge-base --is-ancestor ${RETARGET_COMMIT} HEAD`)',
      '// ADMISSION (EXLIB-1C0A): assert emptiness after the',
      '// labeled admissions above; nothing else may be dirty.',
      "return porcelainAfterAdmissions === '' && staged === '' &&",
    ]
    const diffLineExact = (diffText: string, f: string): boolean => {
      const adds = diffText.split('\n').filter((l) => l.startsWith('+') && !l.startsWith('+++')).map((l) => l.slice(1).trim())
      const dels = diffText.split('\n').filter((l) => l.startsWith('-') && !l.startsWith('---')).map((l) => l.slice(1).trim())
      if (f === 'scripts/verify-exlib1c0.ts') {
        return JSON.stringify(adds) === JSON.stringify(C0_ADDS) &&
          JSON.stringify(dels) === JSON.stringify(C0_DELS)
      }
      return dels.length === 0 && JSON.stringify(adds) === JSON.stringify(SEVEN_ADDS)
    }
    const decisionInHead = (() => {
      try {
        execSync('git cat-file -e HEAD:docs/exlib1c0a-private-use-product-decision.md', { stdio: 'pipe' })
        return true
      } catch { return false }
    })()
    check(`D1: lifecycle-safe phase boundary (${decisionInHead ? 'COMMITTED' : 'UNCOMMITTED REVIEW'} state) — exact inventory and LINE-EXACT admission/retarget diffs`,
      (() => {
        try {
          if (!decisionInHead) {
            const out = execSync('git status --porcelain', { encoding: 'utf8' })
            const entries = out.split('\n').filter(Boolean)
            const untracked = entries.filter((l) => l.startsWith('??')).map((l) => l.slice(3).trim()).sort()
            const modified = entries.filter((l) => !l.startsWith('??')).map((l) => l.slice(3).trim())
            const staged = execSync('git diff --cached --name-only', { encoding: 'utf8' }).trim()
            if (staged !== '') return false
            if (JSON.stringify(untracked) !== JSON.stringify([...INVENTORY_1C0A].sort())) return false
            if (JSON.stringify([...modified].sort()) !==
              JSON.stringify([...SEVEN_SUITES, 'scripts/verify-exlib1c0.ts'].sort())) return false
            return modified.every((f) =>
              diffLineExact(execSync(`git diff -- ${f}`, { encoding: 'utf8' }), f))
          }
          // Committed state: clean tree, unique mechanically found
          // phase commit, immutable-range proofs.
          // ADMISSION (EXLIB-1C0B): the displacement-audit artifacts
          // (and their verifier), plus committed verify suites whose
          // worktree diff carries the ADMISSION (EXLIB-1C0B) label,
          // are admitted while that phase is uncommitted.
          const dirtyAfterAdmissions = execSync('git status --porcelain', { encoding: 'utf8' })
            .split('\n').filter(Boolean)
            .filter((l) => {
              const mm = l.match(/^\s*(\?\?|[A-Z]{1,2})\s+(.+)$/)
              const st = mm ? mm[1] : ''
              const f = mm ? mm[2] : l
              if (f.startsWith('docs/exlib1c0b-') ||
                f === 'scripts/verify-exlib1c0b.ts') return false
              if (st === 'M' && f.startsWith('scripts/verify-') && f.endsWith('.ts')) {
                try {
                  return !execSync(`git diff -- ${f}`, { encoding: 'utf8' })
                    .includes('ADMISSION (EXLIB-1C0B)')
                } catch { return true }
              }
              return true
            })
          if (dirtyAfterAdmissions.length !== 0) return false
          if (execSync('git diff --cached --name-only', { encoding: 'utf8' }).trim() !== '') return false
          const adders = execSync(
            'git log --all --format=%H --diff-filter=A -- docs/exlib1c0a-private-use-product-decision.md',
            { encoding: 'utf8' }).split('\n').filter(Boolean)
          if (adders.length !== 1) return false
          const phase = adders[0]
          execSync(`git merge-base --is-ancestor ${phase} HEAD`)
          const range = execSync(`git diff --name-only ${phase}^..${phase}`, { encoding: 'utf8' })
            .split('\n').filter(Boolean).sort()
          const expected = [...INVENTORY_1C0A, ...SEVEN_SUITES, 'scripts/verify-exlib1c0.ts'].sort()
          if (JSON.stringify(range) !== JSON.stringify(expected)) return false
          return [...SEVEN_SUITES, 'scripts/verify-exlib1c0.ts'].every((f) =>
            diffLineExact(execSync(`git diff ${phase}^..${phase} -- ${f}`, { encoding: 'utf8' }), f))
        } catch { return false }
      })())
    check('D2: the promoted proposals/guide/packet, ledger, manifest, and migrations show ZERO git diffs',
      (() => {
        try {
          return execSync('git diff --name-only -- docs/exlib1c0-human-review-proposals.jsonl docs/exlib1c0-human-review-guide.md docs/exlib1c0-legal-product-approval-packet.md docs/exlib1b1-review-ledger.jsonl docs/exlib1a-discovery-manifest.jsonl supabase/migrations/',
            { encoding: 'utf8' }).trim() === ''
        } catch { return false }
      })())
    check('D3: this phase authored no SQL and no importer/loader',
      !/CREATE TABLE|ALTER TABLE|INSERT INTO|CREATE POLICY|CREATE INDEX|ALTER FUNCTION/.test(decision + overlayRaw) &&
      readdirSync('supabase/migrations').every((f) => !f.startsWith('025')))
    // REVISED (EXLIB-1C0A direct review, committed-state lifecycle):
    // verify-exlib1c0's E2 must pin its historical correction range
    // to the immutable retarget commit — never a moving HEAD.
    check('D4: verify-exlib1c0 E2 is durable — correction range pinned PACKET_COMMIT..RETARGET_COMMIT with an ancestry check, under the exact RETARGET label',
      (() => {
        const src = read('scripts/verify-exlib1c0.ts')
        return src.includes('RETARGET (EXLIB-1C0A, immutable committed-range preservation)') &&
          src.includes("const RETARGET_COMMIT = '" + RETARGET_COMMIT + "'") &&
          src.includes('git diff --name-only ${PACKET_COMMIT}..${RETARGET_COMMIT}') &&
          src.includes('git merge-base --is-ancestor ${RETARGET_COMMIT} HEAD') &&
          !src.includes('${PACKET_COMMIT}..HEAD')
      })())
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
