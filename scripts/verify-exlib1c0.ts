// ============================================================
// ForgeFitOS — EXLIB-1C0 approval-packet + review-proposal harness
// (review-corrected). Proves the packet/workbook/guide are grounded
// in the unchanged authoritative artifacts, contain ZERO approvals
// and zero legal conclusions (across ALL THREE artifacts), split the
// legal and product gates independently, label every carried-forward
// value as not independently validated, keep every honesty rule, and
// that this phase changed nothing outside its declared 11-path
// inventory (with the seven committed-suite changes proven
// admission-only).
// REVISED (EXLIB-1C0 final review correction): the guide is parsed
// STRUCTURALLY (nine batch sections, every decision row) against
// expected membership sets derived mechanically from the proposal
// data; carried-forward label counts are exact full-string counts;
// the seven admission diffs are proven line-exact.
// Run from the repository root:
//   npx tsx scripts/verify-exlib1c0.ts
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

const MANIFEST_SHA = '336cd4253f747cdb3ba73ffa2af5a63e255c7c87cc452d4c43ed59a654673dfa'
const M023_SHA = '0991448c39a558385431c78cef6d6063df208312a3f53866756ba730066c42f2'
const M024_SHA = '190550ecdb99df702ab03d1b07592f861070141e5091eb25bc5bf45f211cc980'
const START_COMMIT = '8ff68a1964e16a8163d599bbec46ff0a58a99713'
// RETARGET (EXLIB-1C0 promotion, committed-state verification): the
// approved, immutable packet commit (parent START_COMMIT, tree
// 4920394facac912bcb1da7337af21bedfabbbe08).
const PACKET_COMMIT = '1f9bbfa2bc1e08e1a185927cf09d94b789135483'
// RETARGET (EXLIB-1C0A, immutable committed-range preservation):
// the approved, immutable verifier-retarget commit that closed the
// EXLIB-1C0 phase; the historical correction range ends HERE, never
// at a moving HEAD.
const RETARGET_COMMIT = '45b290c3639833010f7faf7d6c313ddcc3ee61aa'

const packet = read('docs/exlib1c0-legal-product-approval-packet.md')
const packetFlat = packet.replace(/\s+/g, ' ')
const guide = read('docs/exlib1c0-human-review-guide.md')
const guideFlat = guide.replace(/\s+/g, ' ')
const proposalsRaw = read('docs/exlib1c0-human-review-proposals.jsonl')
const proposals = proposalsRaw.split('\n').filter((l) => l && !l.startsWith('#')).map((l) => JSON.parse(l))
const ledger = read('docs/exlib1b1-review-ledger.jsonl')
  .split('\n').filter((l) => l && !l.startsWith('#')).map((l) => JSON.parse(l))
const manifest = read('docs/exlib1a-discovery-manifest.jsonl')
  .split('\n').filter((l) => l && !l.startsWith('#')).map((l) => JSON.parse(l))
const manByUrl = new Map(manifest.map((m) => [m.source_url, m]))
const DIMENSIONS = ['anatomy', 'equipment', 'laterality', 'tracking_mode',
  'naming', 'alias_or_collision', 'eligibility']
const INVENTORY_11 = [
  'docs/exlib1c0-human-review-guide.md',
  'docs/exlib1c0-human-review-proposals.jsonl',
  'docs/exlib1c0-legal-product-approval-packet.md',
  'scripts/verify-exlib1a.ts', 'scripts/verify-exlib1b1.ts',
  'scripts/verify-exlib1b3.ts', 'scripts/verify-exlib1c0.ts',
  'scripts/verify-ui5b1b.ts', 'scripts/verify-ui5b2.ts',
  'scripts/verify-ui6c.ts', 'scripts/verify-ui7.ts',
]
const ADMISSION_SUITES = INVENTORY_11.filter((f) =>
  f.startsWith('scripts/') && f !== 'scripts/verify-exlib1c0.ts')

async function main() {
  console.log('\nA. Immutable baseline')
  {
    // RETARGET (EXLIB-1C0 promotion, committed-state verification):
    // A1 no longer pins the MOVABLE main ref to the pre-promotion
    // commit. It proves immutable ancestry instead: the stable tag
    // still dereferences to the starting commit, the approved packet
    // commit exists with exactly that parent, and the tested HEAD
    // contains the packet commit as an ancestor. Valid both on the
    // pre-promotion candidate and on promoted main.
    check('A1: immutable ancestry — stable tag at the starting commit; packet commit exists with that exact parent; HEAD descends from the packet commit',
      (() => {
        try {
          const tag = execSync('git rev-parse "exlib1b3-migration-024-application-record-stable^{}"', { encoding: 'utf8' }).trim()
          const packet = execSync(`git rev-parse "${PACKET_COMMIT}^{commit}"`, { encoding: 'utf8' }).trim()
          const parent = execSync(`git rev-parse "${PACKET_COMMIT}^"`, { encoding: 'utf8' }).trim()
          execSync(`git merge-base --is-ancestor ${PACKET_COMMIT} HEAD`)
          return tag === START_COMMIT && packet === PACKET_COMMIT && parent === START_COMMIT
        } catch { return false }
      })())
    check('A2: applied migration fingerprints exact; inventory exactly 001-024; NO migration 025',
      (() => {
        const files = readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql'))
        const m023 = readFileSync('supabase/migrations/023_exlib_catalog_and_delivery_contract.sql')
        const m024 = readFileSync('supabase/migrations/024_exlib_post_application_hardening.sql')
        return files.length === 24 &&
          files.filter((f) => f.startsWith('025')).length === 0 &&
          m023.length === 92806 &&
          createHash('sha256').update(m023).digest('hex') === M023_SHA &&
          m024.length === 3726 &&
          createHash('sha256').update(m024).digest('hex') === M024_SHA
      })())
    check('A3: the 395-record manifest is byte-unchanged with unchanged classifications',
      (() => {
        const raw = readFileSync('docs/exlib1a-discovery-manifest.jsonl')
        return createHash('sha256').update(raw).digest('hex') === MANIFEST_SHA &&
          manifest.length === 395
      })())
    check('A4: the AUTHORITATIVE ledger is unchanged — 48 records, all pending with null reviewer fields (git-clean too)',
      ledger.length === 48 &&
      ledger.every((l) => l.status === 'pending' && l.reviewer === null &&
        l.reviewed_at === null && l.decision_rationale === null) &&
      (() => {
        try {
          return execSync('git diff --name-only -- docs/exlib1b1-review-ledger.jsonl docs/exlib1a-discovery-manifest.jsonl',
            { encoding: 'utf8' }).trim() === ''
        } catch { return false }
      })())
    check('A5: no catalog data, no EXLIB-1C implementation, no product/API/schema/dependency change',
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

  console.log('\nB. Proposal workbook integrity')
  {
    check('B1: exactly 48 proposal rows, one-to-one with the authoritative ledger by identity',
      proposals.length === 48 &&
      new Set(proposals.map((p) => p.ledger_id)).size === 48 &&
      proposals.every((p) => ledger.some((l) => l.ledger_id === p.ledger_id)) &&
      ledger.every((l) => proposals.some((p) => p.ledger_id === l.ledger_id)))
    check('B2: every source fact and existing proposal is copied VERBATIM from the ledger',
      proposals.every((p) => {
        const l = ledger.find((x) => x.ledger_id === p.ledger_id)
        return !!l &&
          JSON.stringify(p.source_facts) === JSON.stringify(l.source_facts) &&
          JSON.stringify(p.existing_forgefit_proposed) === JSON.stringify(l.forgefit_proposed) &&
          JSON.stringify(p.specialist_review) === JSON.stringify(l.specialist_review)
      }))
    // STRENGTHENED (EXLIB-1C0 review correction, finding E): full
    // source_identity reconciliation against the MANIFEST fields,
    // not only the URL.
    check('B2b: source_identity fully reconciles against the authoritative manifest (name, url, page, retrieval date)',
      proposals.every((p) => {
        const m = manByUrl.get(p.ledger_id)
        return !!m &&
          p.source_identity.source_name === m.source_name &&
          p.source_identity.source_url === m.source_url &&
          p.source_identity.source_page === m.source_page &&
          p.source_identity.retrieved_at === m.retrieved_at &&
          p.proposed_primary_muscle === m.primary_muscle &&
          JSON.stringify(p.proposed_secondary_muscles) === JSON.stringify(m.secondary_muscles) &&
          p.proposed_tracking_mode === m.tracking_mode &&
          p.proposed_laterality === m.laterality
      }))
    check('B3: ALL proposals are unapproved with null approver/reviewer/timestamp/rationale — recommendations are not approvals',
      proposals.every((p) => p.proposal_status === 'unapproved' &&
        p.approver === null && p.reviewer === null && p.approved_at === null &&
        p.reviewed_at === null && p.decision_rationale === null) &&
      proposalsRaw.includes('Recommendations are NOT approvals') &&
      proposalsRaw.includes('a blank or null field is NEVER approval'))
    check('B4: all seven decision dimensions present on every record, each with decision/basis/confidence',
      proposals.every((p) =>
        JSON.stringify(p.unresolved_decisions) === JSON.stringify(DIMENSIONS) &&
        DIMENSIONS.every((d) => p.recommendations[d] &&
          typeof p.recommendations[d].recommended_decision === 'string' &&
          p.recommendations[d].recommended_decision.length > 10 &&
          typeof p.recommendations[d].recommendation_basis === 'string' &&
          ['high', 'medium', 'low'].includes(p.recommendations[d].confidence))))
    check('B5: NO record is silently import-eligible — every record gated on BOTH independent dataset gates',
      proposals.every((p) => p.import_eligible === false) &&
      proposals.every((p) => p.legal_dependency === true) &&
      proposals.every((p) => p.blocking_questions.length >= 1 &&
        p.blocking_questions.some((q: string) =>
          q.includes('qualified counsel determination') &&
          q.includes("Joseph's separate product decision"))))
    // REVISED (EXLIB-1C0 review correction, finding C): the Weighted
    // Plank equipment contradiction joins the unresolved set (9).
    check('B6: unknown or CONTRADICTORY equipment is NEVER invented — nine records stay null with explicit blockers',
      proposals.filter((p) => p.proposed_equipment === null).length === 9 &&
      proposals.filter((p) => p.proposed_equipment === null).every((p) =>
        p.recommendations.equipment.recommended_decision.startsWith('unresolved') &&
        (p.recommendations.equipment.recommended_decision.includes('DO NOT infer') ||
          p.recommendations.equipment.recommended_decision.includes('EXTERNAL LOAD'))))
    check('B7: specialist flags retained — every group keeps its exact membership',
      (() => {
        const count = (t: string) => proposals.filter((p) => p.specialist_review.includes(t)).length
        return count('neck') === 4 && count('tibialis') === 4 &&
          count('olympic_full_body') === 13 && count('rotator_cuff') === 8 &&
          count('loaded_carry_hold') === 2 && count('naming_collision') === 2 &&
          count('equipment_unknown') === 8 && count('contested_anatomy') === 30 &&
          count('tracking_mode_mismatch') === 2 &&
          proposals.filter((p) => p.specialist_review_required).length === 38
      })())
    check('B8: contested/vocabulary anatomy stays UNRESOLVED in the recommendation itself',
      proposals.filter((p) => ['neck', 'tibialis', 'rotator_cuff', 'olympic_full_body', 'contested_anatomy']
        .some((t) => p.specialist_review.includes(t)))
        .every((p) => p.recommendations.anatomy.recommended_decision.startsWith('unresolved') &&
          p.recommendations.anatomy.confidence === 'low'))
    check('B9: no movement technique or instructions are inferred — none were collected',
      !/how to|step 1|technique:|keep your|brace your|drive through/i.test(proposalsRaw) &&
      !/\.(jpg|jpeg|png|gif|webp|mp4|webm)/i.test(proposalsRaw))
    // NEW (EXLIB-1C0 review correction, finding C): evidence honesty.
    check('B10: every carried-forward value is LABELED as not independently validated (or is explicitly unresolved)',
      proposals.every((p) =>
        ['anatomy', 'equipment', 'laterality', 'tracking_mode', 'alias_or_collision'].every((d) => {
          const r = p.recommendations[d]
          return r.recommended_decision.startsWith('unresolved') ||
            (r.recommendation_basis + r.recommended_decision).includes('carried-forward')
        })))
    // REVISED (EXLIB-1C0 final review correction): EXACT label
    // accounting — full-label occurrence counts (split on the exact
    // string), never loose 'carried-forward' substring counting.
    check('B10b: exactly 227 standard carried-forward labels and exactly 2 collision-alias disposition labels (exact full strings)',
      proposalsRaw.split('carried-forward candidate; not independently validated').length - 1 === 227 &&
      proposalsRaw.split('carried-forward disposition; not independently validated').length - 1 === 2)
    check('B11: the exact finding-B naming basis replaces the removed legal conclusion on all 46 non-collision records',
      proposals.filter((p) => !p.specialist_review.includes('naming_collision'))
        .every((p) => p.recommendations.naming.recommendation_basis ===
          "Name retained verbatim from the factual manifest; production-use rights remain unresolved under the packet's legal gate.") &&
      proposals.filter((p) => p.specialist_review.includes('naming_collision'))
        .every((p) => p.recommendations.naming.recommendation_basis
          .includes("production-use rights remain unresolved under the packet's legal gate")))
    check('B12: NO high-confidence accepted equipment anywhere; records whose own notes say unknown/contradictory are unresolved',
      proposals.every((p) => p.recommendations.equipment.confidence !== 'high') &&
      proposals.filter((p) =>
        (p.existing_forgefit_proposed.review_notes || '').includes('equipment could not be inferred') ||
        (p.existing_forgefit_proposed.review_notes || '').includes('external load'))
        .every((p) => p.recommendations.equipment.recommended_decision.startsWith('unresolved') &&
          p.proposed_equipment === null))
    check('B13: the specifically re-audited records carry low-confidence or unresolved equipment (no non-literal acceptance)',
      ['Turkish Get-Up', 'Farmers Walk', 'Poliquin Raise'].every((n) => {
        const p = proposals.find((x) => x.source_identity.source_name === n)
        return !!p && p.recommendations.equipment.confidence === 'low'
      }) &&
      ['Wall Walk', 'Heel Walk'].every((n) => {
        const p = proposals.find((x) => x.source_identity.source_name === n)
        return !!p && p.recommendations.equipment.confidence !== 'high' &&
          (p.recommendations.equipment.recommendation_basis +
            p.recommendations.equipment.recommended_decision).includes('carried-forward')
      }))
  }

  console.log('\nC. Legal/product packet integrity')
  {
    check('C1: the mandatory boundary statements are all present',
      ['not legal advice and cannot substitute for qualified counsel',
        'CRAWLER ACCESS ONLY',
        'copyright, database-right, contractual, trademark, endorsement, redistribution, or commercial-use rights',
        'Only exercise names, category placement, and source URLs were collected',
        'No source descriptions, instructions, cues, images, or videos were collected',
        'StrengthLog does not endorse ForgeFitOS',
        'INTERNAL research/review artifact',
        'Repository presence and technical readiness',
        'do NOT authorize production import',
        'COMPILED dataset',
        'explicit product/legal determination',
        'silence is not approval']
        .every((a) => packetFlat.includes(a)))
    check('C2: the approval-scope list names all eight required items',
      ['Source-fact fields', 'Normalization', 'Provenance retention',
        'Internal catalog use', 'Production delivery',
        'Redistribution or public display, if any',
        'Attribution requirements, if any', 'Prohibited content']
        .every((a) => packetFlat.includes(a)) &&
      packetFlat.includes('affirmative, dated, attributable'))
    // REVISED (EXLIB-1C0 review correction, finding A): the table is
    // the PRODUCT gate; counsel is always first and never selectable
    // away.
    check('C3: the decision table is the L2 product gate, executed only after L1, and chooses NOTHING',
      ['Approved as proposed', 'Approved with attribution/provenance conditions',
        'Approved only after independent factual re-verification',
        'Approved only for internal research, not production', 'Rejected',
        'Blocked pending further counsel input']
        .every((a) => packetFlat.includes(a)) &&
      packetFlat.includes('no outcome is chosen here') &&
      packetFlat.includes('THIS PACKET APPROVES NOTHING') &&
      packetFlat.includes('The counsel handoff (Gate L1) is ALWAYS executed first') &&
      packetFlat.includes('choosing any row below can never supply the legal determination'))
    check('C4: NO legal conclusion is fabricated ANYWHERE — packet, guide, AND proposals scanned',
      [packetFlat, guideFlat, proposalsRaw.replace(/\s+/g, ' ')].every((t) =>
        !/uncopyrightable|is legal\b|is lawful|clearly permitted|no legal risk|fair use permits/i.test(t)) &&
      packetFlat.includes('Nothing in this packet predicts counsel') &&
      packetFlat.includes('nothing below speculates about what the law conclusively permits'))
    check('C5: category separation A/B/C/D is present and not collapsed',
      ['A. Source facts:', 'B. ForgeFitOS-generated classifications',
        'C. Already-approved architecture:', 'D. Still-unapproved decisions:']
        .every((a) => packetFlat.includes(a)) &&
      packetFlat.includes('Architecture approval says nothing about content rights'))
    check('C6: authoritative-input inventory cites every governing source',
      ['docs/exlib1a-exercise-library-discovery-notes.md', 'docs/exlib1a-discovery-manifest.jsonl',
        'docs/exlib1a-human-review-queue.md', 'docs/exlib1b1-architecture-and-review-notes.md',
        'docs/exlib1b1-review-ledger.jsonl',
        'supabase/migrations/023_exlib_catalog_and_delivery_contract.sql',
        'supabase/migrations/024_exlib_post_application_hardening.sql',
        'docs/exlib1b3-post-application-hardening-audit.md']
        .every((a) => packet.includes(a)) &&
      packet.includes(MANIFEST_SHA))
    // NEW (EXLIB-1C0 review correction, finding A): independent gates.
    check('C7: the legal and product gates are SPLIT, independently owned, and Joseph cannot supply the legal one',
      packetFlat.includes('TWO INDEPENDENT GATES') &&
      packetFlat.includes('Gate L1 — qualified counsel determination') &&
      packetFlat.includes('Joseph CANNOT supply this gate; a product-owner choice is not a legal determination') &&
      packetFlat.includes("Gate L2 — Joseph's separate product decision") &&
      packetFlat.includes("Made only AFTER reviewing counsel's result") &&
      packetFlat.includes('Neither gate substitutes for the other') &&
      packetFlat.includes('BOTH must close before any internal catalog loading or production delivery'))
    check('C8: the Terms-of-Service EVIDENCE GAP is recorded with its fail-closed counsel requirement, uncharacterized',
      packetFlat.includes('Terms-of-Service evidence gap (fail-closed)') &&
      packetFlat.includes('were NOT collected or characterized during discovery') &&
      packetFlat.includes('deliberately does not research or characterize them') &&
      packetFlat.includes('counsel must be provided the applicable terms, or an explicit dated record that they could not be established'))
  }

  console.log('\nD. Review guide + gate matrix')
  {
    check('D1: all nine required batches exist with the correct sizes',
      ['Naming/collision (2)', 'Anatomy vocabulary gaps (8)',
        'Tracking-mode questions (2)', 'Laterality questions (4)',
        'Equipment uncertainty (8)', 'Olympic/full-body classification (13)',
        'Rotator-cuff classification (8)', 'Loaded carries/holds (2)',
        'Other contested anatomy (9)']
        .every((b) => guideFlat.includes(b)))
    check('D2: every batch names its decider; 56 decision rows, ALL unchecked',
      (guide.match(/decides: /g) || []).length >= 9 &&
      (guide.match(/\[ \] accept  \[ \] revise  \[ \] reject  \[ \] defer/g) || []).length === 56 &&
      !guide.includes('[x]') && !guide.includes('[X]'))
    // REVISED (EXLIB-1C0 review correction, findings C+D): renamed
    // no-S&C-flag section; corrected distribution and overlap text.
    check('D3: summary counts reconcile — 38 specialist, 10 no-S&C-flag (still blocked, not validated), all 48 dual-gate-blocked',
      guideFlat.includes('Specialist input required: 38. Records with no S&C flag currently recorded: 10') &&
      guideFlat.includes('L1 counsel + L2 product) regardless of anatomy resolution: ALL 48') &&
      guideFlat.includes('the absence of an S&C flag is not validation') &&
      guideFlat.includes('specialist 28, equipment 9 (the 8 unknowns + the Weighted Plank contradiction), vocabulary 8, tracking 1, naming 2'))
    // REVISED (EXLIB-1C0 review correction, findings A+D): 17 gates.
    check('D4: the gate matrix contains ALL SEVENTEEN fail-closed gates, every one OPEN',
      ['Gate L1 — qualified counsel determination',
        'Terms-of-Service evidence for counsel',
        "Gate L2 — Joseph's separate product decision",
        'Provenance/attribution approval', 'All 48 ledger resolutions',
        'Specialist sign-off', 'Deterministic final canonical names and aliases',
        'Vocabulary decisions for unsupported anatomy',
        'Tracking-mode and laterality resolutions',
        'Dry-run importer design review', 'Catalog run membership freeze',
        'Review-audit completeness', 'No unresolved record included',
        'Rollback rehearsal', 'Exact approved content manifest fingerprint',
        'Explicit Supabase application/loading authorization', 'Hosted QA plan']
        .every((g) => guideFlat.includes(g)) &&
      (guide.match(/\| OPEN \|/g) || []).length === 17 &&
      guideFlat.includes('Seventeen gates, all OPEN') &&
      !/\| CLOSED \|/.test(guide))
    check('D5: the guide states implementation may not begin from this packet alone',
      guideFlat.includes('EXLIB-1C implementation may not begin merely because this packet exists') &&
      guideFlat.includes('explicitly approve the legal/product outcome and the resolved content manifest in a later turn'))
    check('D6: zero-approval confirmations present in guide AND packet',
      guideFlat.includes('ZERO APPROVALS EXIST') &&
      guideFlat.includes('Nothing in this guide, the packet, or the proposals workbook approves anything') &&
      packetFlat.includes('Zero-approval confirmation'))
    // REVISED (EXLIB-1C0 final review correction): D7-D9 replaced
    // with STRUCTURAL guide parsing — the nine batch sections are
    // parsed independently and in order, every decision row is
    // parsed into (exercise name, ledger_id, recommendation summary,
    // confidence, unchecked schema), and each batch is compared for
    // EXACT set equality against expected membership derived
    // mechanically from the proposal data itself.
    const CHECKBOX_UNCHECKED = '[ ] accept  [ ] revise  [ ] reject  [ ] defer'
    const SUMMARY_SUFFIX = '... (summary only)'
    const propByUrl = new Map(proposals.map((p) => [p.ledger_id as string, p]))
    const flag = (p: any, t: string) => p.specialist_review.includes(t)
    // Which workbook dimension each batch's Recommendation column
    // summarizes (batches 2/6/7/9 are all anatomy questions).
    const BATCH_DIMENSION: Record<number, string> = {
      1: 'naming', 2: 'anatomy', 3: 'tracking_mode', 4: 'laterality',
      5: 'equipment', 6: 'anatomy', 7: 'anatomy', 8: 'eligibility',
      9: 'anatomy',
    }
    // Expected batch membership, derived ONLY from proposal data.
    const expectedBatch = (n: number): string[] => proposals.filter((p) => {
      switch (n) {
        case 1: return flag(p, 'naming_collision')
        case 2: return flag(p, 'neck') || flag(p, 'tibialis')
        case 3: return flag(p, 'tracking_mode_mismatch')
        case 4: return p.proposed_laterality === 'alternating'
        case 5: return flag(p, 'equipment_unknown')
        case 6: return flag(p, 'olympic_full_body')
        case 7: return flag(p, 'rotator_cuff')
        case 8: return flag(p, 'loaded_carry_hold')
        case 9: return flag(p, 'contested_anatomy') &&
          !flag(p, 'olympic_full_body') && !flag(p, 'rotator_cuff')
        default: return false
      }
    }).map((p) => p.ledger_id as string).sort()
    const batchSections = guide.split(/\n## /).filter((s) => s.startsWith('Batch '))
    type GuideRow = { batch: number; name: string; url: string; rec: string; conf: string; box: string }
    const parsedRows: GuideRow[] = []
    let structuralParseOk = batchSections.length === 9
    batchSections.forEach((s, i) => {
      const n = parseInt(s.slice('Batch '.length), 10)
      if (n !== i + 1) structuralParseOk = false
      s.split('\n').filter((l) => l.includes('[ ] accept')).forEach((r) => {
        const cells = r.split('|').map((c) => c.trim())
        if (cells.length !== 7 || cells[0] !== '' || cells[6] !== '') {
          structuralParseOk = false
          return
        }
        parsedRows.push({ batch: n, name: cells[1], url: cells[2], rec: cells[3], conf: cells[4], box: cells[5] })
      })
    })
    check('D7: structural parse — nine ordered batch sections; all 56 rows parse into name/ledger_id/summary/confidence/schema; every schema exactly unchecked with a valid confidence',
      structuralParseOk && parsedRows.length === 56 &&
      parsedRows.every((r) => r.box === CHECKBOX_UNCHECKED &&
        ['high', 'medium', 'low'].includes(r.conf)))
    check('D7b: row identity — every ledger_id exactly matches one proposal and the displayed name EXACTLY equals that proposal\'s source name (URL and name never mismatched)',
      parsedRows.every((r) => {
        const p = propByUrl.get(r.url)
        return !!p && p.source_identity.source_name === r.name &&
          /^https:\/\/www\.strengthlog\.com\/[a-z0-9-]+\/$/.test(r.url)
      }))
    check('D8: recommendation traceability — every summary is the mapped dimension\'s decision verbatim or a labeled "(summary only)" true prefix of it, with matching confidence; truncated text is never decision-complete',
      guideFlat.includes('marked "(summary only)" are NOT decision-complete') &&
      guideFlat.includes('No decision may be based only on truncated text') &&
      parsedRows.every((r) => {
        const p = propByUrl.get(r.url)
        if (!p) return false
        const d = p.recommendations[BATCH_DIMENSION[r.batch]]
        if (!d || r.conf !== d.confidence) return false
        if (r.rec.endsWith(SUMMARY_SUFFIX)) {
          return d.recommended_decision.startsWith(r.rec.slice(0, -SUMMARY_SUFFIX.length))
        }
        return r.rec === d.recommended_decision && !r.rec.includes('...')
      }))
    check('D9: every batch EXACTLY equals its expected membership set (no missing/extra/duplicated/misplaced record) and overlap arithmetic reconciles independently (48 unique / 56 appearances / 8 extra from the exact 7 records)',
      (() => {
        for (let n = 1; n <= 9; n++) {
          const got = parsedRows.filter((r) => r.batch === n).map((r) => r.url).sort()
          if (JSON.stringify(got) !== JSON.stringify(expectedBatch(n))) return false
        }
        const urlOf = (nm: string) => proposals.find((p) => p.source_identity.source_name === nm)!.ledger_id
        // Appearance counts from the PARSED rows...
        const appear = new Map<string, number>()
        parsedRows.forEach((r) => appear.set(r.url, (appear.get(r.url) || 0) + 1))
        const total = Array.from(appear.values()).reduce((a, b) => a + b, 0)
        // ...and an INDEPENDENT recomputation from the expected sets.
        const expectedAppear = new Map<string, number>()
        for (let n = 1; n <= 9; n++) {
          expectedBatch(n).forEach((u) => expectedAppear.set(u, (expectedAppear.get(u) || 0) + 1))
        }
        const expectedTotal = Array.from(expectedAppear.values()).reduce((a, b) => a + b, 0)
        const SEVEN_OVERLAPS: Array<[string, number]> = [
          ['Farmers Walk', 3], ['Weighted Plank', 2], ['Heel Walk', 2],
          ['Jumping Lunge', 2], ['Wall Walk', 2], ['Jefferson Curl', 2],
          ['Ground to Overhead', 2]]
        return appear.size === 48 && total === 56 &&
          expectedAppear.size === 48 && expectedTotal === 56 &&
          SEVEN_OVERLAPS.every(([nm, c]) =>
            appear.get(urlOf(nm)) === c && expectedAppear.get(urlOf(nm)) === c) &&
          Array.from(appear.entries()).filter(([, c]) => c > 1).length === 7 &&
          Array.from(expectedAppear.entries()).filter(([, c]) => c > 1).length === 7 &&
          guideFlat.includes('8 extra appearances from exactly 7') &&
          guideFlat.includes('Heel Walk')
      })())
  }

  console.log('\nE. Phase boundary')
  {
    check('E1: no copied source prose or media anywhere in the three artifacts',
      [packet, guide, proposalsRaw].every((t) =>
        !/muscles worked|benefits of|how to perform/i.test(t) &&
        !/\.(jpg|jpeg|png|gif|webp|mp4|webm)/i.test(t)))
    // RETARGET (EXLIB-1C0 promotion, committed-state verification):
    // E2 no longer requires the former 11-path DIRTY worktree. It
    // requires a completely clean worktree and index, proves the
    // IMMUTABLE packet-commit range changed exactly the reviewed
    // 11-path inventory, and separately proves the correction range
    // after the packet commit changed exactly this verifier. No
    // prefix or wildcard allowance.
    check('E2: clean worktree/index; the immutable packet range changed EXACTLY the 11-path inventory; the correction range changed EXACTLY this verifier',
      (() => {
        try {
          const porcelain = execSync('git status --porcelain', { encoding: 'utf8' }).trim()
          // ADMISSION (EXLIB-1C0A): the private-use decision and
          // equipment-resolution overlay artifacts (and their
          // verifier) are admitted while uncommitted, as are
          // committed verify suites whose worktree diff carries the
          // ADMISSION (EXLIB-1C0A) label.
          const porcelainAfterAdmissions = porcelain.split('\n').filter(Boolean)
            .filter((l) => {
              const m = l.match(/^\s*(\?\?|[A-Z]{1,2})\s+(.+)$/)
              const status = m ? m[1] : ''
              const f = m ? m[2] : l
              if (f.startsWith('docs/exlib1c0a-') ||
                f === 'scripts/verify-exlib1c0a.ts') return false
              // ADMISSION (EXLIB-1C0B): the displacement-audit
              // artifacts (and their verifier) are admitted while
              // uncommitted.
              if (f.startsWith('docs/exlib1c0b-') ||
                f === 'scripts/verify-exlib1c0b.ts') return false
              // ADMISSION (EXLIB-1C0B2): the equipment-decision
              // record artifacts are admitted while uncommitted.
              if (f.startsWith('docs/exlib1c0b2-') ||
                f === 'scripts/verify-exlib1c0b2.ts') return false
              if (status === 'M' && f.startsWith('scripts/verify-') && f.endsWith('.ts')) {
                try {
                  // ADMISSION (EXLIB-1C0B2): accept the new label.
                  return !/ADMISSION \(EXLIB-1C0A\)|ADMISSION \(EXLIB-1C0B\)|ADMISSION \(EXLIB-1C0B2\)/.test(
                    execSync(`git diff -- ${f}`, { encoding: 'utf8' }))
                } catch { return true }
              }
              return true
            }).join('\n')
          const staged = execSync('git diff --cached --name-only', { encoding: 'utf8' }).trim()
          const packetRange = execSync(`git diff --name-only ${START_COMMIT}..${PACKET_COMMIT}`, { encoding: 'utf8' })
            .split('\n').filter(Boolean).sort()
          // RETARGET (EXLIB-1C0A, immutable committed-range
          // preservation): the historical correction range ends at
          // the immutable retarget commit, NOT at current HEAD, so
          // future phases advancing HEAD can never alter it; HEAD
          // must instead DESCEND from that commit.
          const correctionRange = execSync(`git diff --name-only ${PACKET_COMMIT}..${RETARGET_COMMIT}`, { encoding: 'utf8' })
            .split('\n').filter(Boolean).sort()
          execSync(`git merge-base --is-ancestor ${RETARGET_COMMIT} HEAD`)
          // ADMISSION (EXLIB-1C0A): assert emptiness after the
          // labeled admissions above; nothing else may be dirty.
          return porcelainAfterAdmissions === '' && staged === '' &&
            JSON.stringify(packetRange) === JSON.stringify([...INVENTORY_11].sort()) &&
            JSON.stringify(correctionRange) === JSON.stringify(['scripts/verify-exlib1c0.ts'])
        } catch { return false }
      })())
    check('E3: this phase authored no SQL and no migration 025',
      !/CREATE TABLE|ALTER TABLE|INSERT INTO|CREATE POLICY|CREATE INDEX/.test(packet + guide) &&
      readdirSync('supabase/migrations').every((f) => !f.startsWith('025')))
    // RETARGET (EXLIB-1C0 promotion, committed-state verification):
    // E4 no longer reads admissions from the (now clean) worktree
    // diff. It inspects each suite's diff over the IMMUTABLE packet
    // commit range and preserves the full LINE-EXACT proof — zero
    // deletions, exactly one added executable expression, exactly
    // one ADMISSION label, and the remaining additions exactly the
    // three expected comment lines. Nothing else may be added.
    const ADMISSION_EXPR = "f.startsWith('docs/exlib1c0-') ||"
    const ADMISSION_COMMENTS = [
      '// ADMISSION (EXLIB-1C0): the approval-packet and',
      '// review-proposal artifacts are admitted while',
      '// uncommitted.',
    ]
    check('E4: each committed-suite change in the immutable packet range is admission-only and LINE-EXACT — zero deletions; exactly one added expression; exactly one ADMISSION (EXLIB-1C0) label; exactly the three expected comment lines; nothing else',
      ADMISSION_SUITES.every((f) => {
        let d = ''
        try { d = execSync(`git diff ${START_COMMIT}..${PACKET_COMMIT} -- ${f}`, { encoding: 'utf8' }) } catch { return false }
        const adds = d.split('\n')
          .filter((l) => l.startsWith('+') && !l.startsWith('+++'))
          .map((l) => l.slice(1).trim())
        const dels = d.split('\n').filter((l) => l.startsWith('-') && !l.startsWith('---'))
        const exprAdds = adds.filter((t) => !t.startsWith('//'))
        const commentAdds = adds.filter((t) => t.startsWith('//'))
        return dels.length === 0 &&
          exprAdds.length === 1 && exprAdds[0] === ADMISSION_EXPR &&
          adds.filter((t) => t.includes('ADMISSION (EXLIB-1C0)')).length === 1 &&
          JSON.stringify(commentAdds) === JSON.stringify(ADMISSION_COMMENTS)
      }))
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
