// EXLIB-2C Release-1 Batch 4 verifier — authored content (PENDING
// REVIEW; loading prohibited).
//
// Proves: the exact source baseline and phase inventory; exactly 25
// Batch 4 records with zero overlap with Batches 1-3; the
// deterministic cumulative selection (mechanical least-represented
// weighting) reproduced from the stable inventory; cumulative
// authored count exactly 100; schema validity and stable metadata
// equality; Plank/weight_time exclusion; R1-R8; aliases and
// relationships unique, resolved, and non-self-referential across
// ALL FOUR batches; the pending/null-evidence/import-false/
// no-publication boundary; laterality, tracking-mode, machine,
// Smith, weighted-vest, platform, and breathing rules; corpus-wide
// stale-phrase rejection carrying forward every Batch 1-3 review
// correction family across all 100 records; a cross-batch
// boilerplate scan across all 100 records; first-appearance
// positive pins for this batch's Smith, vest, bar-hang, Nordic,
// and bike hazards; Batch 1-3 content and design artifacts
// byte-identical; migration 026 absent; runtime unchanged; ledger
// and legacy eligibility unchanged; exact lifecycle behavior.
// Performs NO hosted contact.
//
// Fail-closed: any mismatch fails the suite.
import { execSync } from 'child_process'
import { createHash } from 'crypto'
import { existsSync, readFileSync, readdirSync } from 'fs'
import { TRACKING_MODES } from '../src/lib/exercise-validation'

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
// RETARGET (EXLIB-2N review-decision application): the Dead bug
// (batch02 line 12) and Ab wheel rollout (batch04 line 5) records
// were pending through the promoted EXLIB-2N tip; the approved human
// decisions are applied to exactly those two records after it. This
// suite's byte-frozen claims for those two files are anchored to that
// exact promoted tip, where they were true; every other file remains
// a live claim.
const TIP_2N_RETARGET = 'c9c1afd7df35f2870430da3a8d1295ff7e48e11d'
const readAt2N = (p: string): Buffer =>
  execSync(`git cat-file blob ${TIP_2N_RETARGET}:${p}`, { maxBuffer: 1 << 26 })
const sha256At2N = (p: string): string =>
  createHash('sha256').update(readAt2N(p)).digest('hex')
const parseJsonlAt2N = (p: string): any[] => readAt2N(p).toString('utf8').split('\n')
  .filter((l) => l.trim() && !l.trim().startsWith('#')).map((l) => JSON.parse(l))
const norm = (s: string): string => s.trim().toLowerCase()

const CONTENT = 'docs/exlib2c-release1-batch04-content.jsonl'
const SELECTION = 'docs/exlib2c-release1-batch04-selection.md'
const EDITORIAL = 'docs/exlib2c-release1-batch04-editorial-record.md'
const VERIFIER = 'scripts/verify-exlib2c-batch04.ts'
const B3_VERIFIER = 'scripts/verify-exlib2c-batch03.ts'
const PHASE_NEW = [CONTENT, SELECTION, EDITORIAL, VERIFIER].sort()
const PHASE_ALL = [...PHASE_NEW, B3_VERIFIER].sort()
const BATCH3_TIP = '11393041149d8a95d573622f932dc5df1cbaec5d'

const [MODE_REPS, MODE_BW, MODE_CARDIO, MODE_TIMED] = TRACKING_MODES

const batch = parseJsonlAt2N(CONTENT) // RETARGET (EXLIB-2N review-decision application)
const b1 = parseJsonl('docs/exlib2c-release1-batch01-content.jsonl')
const b2 = parseJsonlAt2N('docs/exlib2c-release1-batch02-content.jsonl') // RETARGET (EXLIB-2N review-decision application)
const b3 = parseJsonl('docs/exlib2c-release1-batch03-content.jsonl')
const prior = [...b1, ...b2, ...b3]
const inv = parseJsonl('docs/exlib2b-release1-inventory.jsonl')
const invByName = new Map(inv.map((r) => [r.proposed_canonical_name, r]))
const corpusNorm = new Set(inv.map((r) => r.normalized_name))
const schema = JSON.parse(read('docs/exlib2c-authoring-schema.json'))
const props = schema.properties
const selDoc = read(SELECTION)
const edDoc = read(EDITORIAL)

const proseOf = (r: any): string => [
  ...r.setup_steps, ...r.execution_steps, ...r.common_mistakes,
  r.breathing_cue, r.safety_guidance, r.equipment_setup,
  r.accessibility_alternative ?? '',
].join(' ')
const primaryOf = (r: any): string => [
  ...r.setup_steps, ...r.execution_steps, ...r.common_mistakes,
  r.breathing_cue, r.safety_guidance, r.equipment_setup,
].join(' ')

// Every Batch 1-3 review-correction family, applied corpus-wide.
// REVISED (EXLIB-2C batch 4 review 1): extended with this review's
// corpus-wide-invalid phrases (absolute anti-pinning claims,
// bail-at-any-height framing, intentional drop/landing exits,
// generic-helper anchors, loose loads resting on the thighs,
// universal Smith stance doctrine). Phrases that are legitimate
// elsewhere in the corpus (e.g. "land softly on the balls of the
// feet" on Jump rope, or a cable set "just below chest height")
// are scoped in D6 instead. REVISED (EXLIB-2C cross-batch
// bench-safety correction): "safety arms just below chest height"
// is now corpus-wide invalid — the Batch 1 Bench press adopted the
// functional clearance doctrine under explicit authorization.
const STALE = /(complains|\bpour|waiting to happen|weakest at the bottom|pinches the shoulder joint|the weight is doing the choosing|under (the )?chair legs?|one rep at a time|hand-off|allows more weight|past the toes|while the tissue|step off the bars|overloads the groin|shallowly|shallow breath|never step off a moving belt|straddle|step or plate|looped across|between holds|locked out|removes lower-back|pad removes|reverse to the floor and reset|taking the eyes off the bell|can never pin you|at any height|land softly with bent knees|steady helper|resting across the thighs|drop to your knees|pitches the torso forward|slightly ahead of the bar|a little forward of the bar|safety arms just below chest height)/i
const MED = /\b(diagnos\w*|treat(s|ed|ment)?\b|rehabilitat\w*|prescri\w*|cure\w*|therap\w*|pain-free|guarantee\w*|tissue adapt|tissue recovery|physiological recovery)/i
const ACTION = /(stop|end the (set|session)|reduce|lighten|lighter|lower the (weight|hips|knee)|shorten|rest|pause|step down|step off|switch|set the (bar|bell|plate|dumbbell)s? down|strip weight|come off|lower down|shrink|slow the (pace|machine|rhythm)|grab the rails|drop the stack|move (your )?hands|rebuild)/i

async function main(): Promise<void> {
  console.log('EXLIB-2C Batch 4 verification (authored content, pending review)')

  console.log('\nA. Baseline and phase boundary')
  {
    check('A1: Batch 1-3 content and promoted design artifacts remain byte-identical, and prior protected EXLIB artifacts hold',
      // RETARGET (EXLIB-2C cross-batch bench-safety correction): Batch 1's
      // fingerprint moved because the pending Bench press record adopted
      // the functional safety-arm clearance doctrine in the same
      // explicitly authorized commit as this phase's corrections.
      sha256('docs/exlib2c-release1-batch01-content.jsonl') === '8168fc196f89781e8a30b315f29d1c72f46afeff8edfe89d1812b0a150ece2b2' &&
      sha256At2N('docs/exlib2c-release1-batch02-content.jsonl') === '1ddc3ab0bd92d60ef33960d82a8e0c8a2fdea1cb828d15fc9bf6a82c34305d48' &&
      sha256('docs/exlib2c-release1-batch03-content.jsonl') === 'e4fca8b632c9c9af9b7c6eece660f2042b6a4c3ef613e14c278f95cf9fcab528' &&
      sha256('docs/exlib2c-release1-batch01-style-standard.md') === '3bdf2f71a0be8aa41ce1a7b6ca149a1d33342b7ff8ea381c8e92686c030a75f1' &&
      sha256('docs/exlib2a-catalog-architecture-record.md') === 'de825ddf18260a877651e426c8436709257c9100e3dfcbd994e3b9e2496191d8' &&
      sha256('docs/exlib2b-release1-coverage-matrix.md') === 'c32b7b9e9d3aafab39a9a6d77db09349dd604457274767fe4c880c6bf1fb2fb0' &&
      sha256('docs/exlib2b-release1-inventory.jsonl') === 'd349110f22700a822eb427fc1dcce3e6dbcfd264b6d48ed84936b07b1ca256f5' &&
      sha256('docs/exlib2c-authoring-schema.json') === 'dddb872c7725c591e6d056e0dc73167d3c822f6245ebd2c759a045fecbd43c6e' &&
      sha256('supabase/migrations/025_exlib_equipment_vocabulary_support.sql') === 'fbda16f4d25cacd1715b199050506a4da15896355d96700876b76c68826d304c' &&
      sha256('docs/exlib1a-discovery-manifest.jsonl') === '336cd4253f747cdb3ba73ffa2af5a63e255c7c87cc452d4c43ed59a654673dfa' &&
      sha256('docs/exlib1b1-review-ledger.jsonl') === 'aa4fe77c0c633510661eede94b40e9bae4aca90a7d8c2794abde92c83c6f7b7b')
    check('A2: planning-only boundary — migration 026 absent, migrations exactly 001-025, zero weight_time in src, no importer artifacts, and the BATCH 4 range (batch 3 tip..batch 4 tip) touches ONLY this phase\'s authorized paths',
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
        if (files.length !== 27 || files.filter((f) => f.startsWith('026')).length !== 1 ||
          !files.includes('026_exlib_plank_seed_reconciliation.sql') ||
          !files.includes('027_exlib_catalog_content_schema.sql')) return false
        if (execSync("grep -rl 'weight_time' src/ || true", { encoding: 'utf8' }).trim() !== '') return false
        if (existsSync('scripts/exlib1c-import.ts') || existsSync('src/lib/catalog-import.ts')) return false
        // RETARGET (EXLIB-2C cross-batch bench-safety correction): the
        // explicitly authorized cross-batch commit also touches the
        // Batch 1 content blob and the two dependent fingerprint pins;
        // no other path may ever join this phase's range.
        const CROSS_ALL = [...PHASE_ALL,
          'docs/exlib2c-release1-batch01-content.jsonl',
          'scripts/verify-exlib2c-batch01.ts',
          'scripts/verify-exlib2c-batch02.ts'].sort()
        // RETARGET (EXLIB-2C batch 5): the BATCH 4 milestone's range
        // claim is anchored to its own promoted tip (71d3f9a...), not
        // to a moving HEAD, so later authoring batches building on the
        // promoted Batch 4 can never dilute or break this historical
        // claim. HEAD must still descend from that tip once it exists.
        const BATCH4_TIP = '71d3f9ae7d4ec02045973cb8d7d8da6082cb5e93'
        const inHistory = (() => {
          try {
            execSync(`git cat-file -e ${BATCH4_TIP}^{commit}`, { stdio: 'pipe' })
            return true
          } catch { return false }
        })()
        if (!inHistory) {
          const range = execSync(`git diff --name-only ${BATCH3_TIP}..HEAD`, { encoding: 'utf8' })
            .split('\n').filter(Boolean).sort()
          if (range.length === 0) return true // uncommitted review state
          return JSON.stringify(range) === JSON.stringify(PHASE_ALL) ||
            JSON.stringify(range) === JSON.stringify(CROSS_ALL)
        }
        execSync(`git merge-base --is-ancestor ${BATCH4_TIP} HEAD`)
        const range = execSync(`git diff --name-only ${BATCH3_TIP}..${BATCH4_TIP}`, { encoding: 'utf8' })
          .split('\n').filter(Boolean).sort()
        return JSON.stringify(range) === JSON.stringify(CROSS_ALL)
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
    check('G1: lifecycle-safe phase boundary — exact five-path inventory (four new + the retargeted Batch 3 verifier), nothing staged; strict while uncommitted, adder-anchored once committed',
      (() => {
        try {
          const inHead = (() => {
            try { execSync(`git cat-file -e HEAD:${CONTENT}`, { stdio: 'pipe' }); return true } catch { return false }
          })()
          if (!inHead) {
            const entries = execSync('git status --porcelain', { encoding: 'utf8' })
              .split('\n').filter(Boolean).map((l) => l.trim()).sort()
            const expected = [...PHASE_NEW.map((f) => `?? ${f}`), `M ${B3_VERIFIER}`].sort()
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
          execSync(`git merge-base --is-ancestor ${BATCH3_TIP} ${phase}`)
          const range = execSync(`git diff --name-only ${phase}^..${phase}`, { encoding: 'utf8' })
            .split('\n').filter(Boolean).sort()
          return JSON.stringify(range) === JSON.stringify(PHASE_ALL)
        } catch { return false }
      })())
  }

  console.log('\nB. Batch structure and selection')
  {
    check('B1: exactly 25 records, every one schema-valid — required/allowed fields, enums, bounds (>=3 setup/execution/mistakes), clean pending review, import_eligible literal false, original provenance, no deferred entries, no publication state',
      (() => {
        if (batch.length !== 25) return false
        const nameRe = new RegExp(props.proposed_canonical_name.pattern)
        return batch.every((r) => {
          const keysOk = schema.required.every((k: string) => k in r) &&
            Object.keys(r).every((k) => k in props)
          const enumsOk = ['primary_muscle', 'equipment', 'tracking_mode', 'laterality',
            'movement_pattern', 'training_role', 'difficulty', 'availability',
            'provenance', 'review_status'].every((f) => props[f].enum.includes(r[f]))
          const targetsOk = r.muscle_targets.every((t: any) =>
            props.muscle_targets.items.properties.muscle.enum.includes(t.muscle) &&
            ['secondary', 'tertiary'].includes(t.role))
          const lens = (arr: string[], mn: number, mx: number): boolean =>
            arr.length >= mn && arr.length <= mx &&
            arr.every((s) => s.trim().length > 0 && s.length >= 10 && s.length <= 240)
          const proseOk = lens(r.setup_steps, 3, 5) && lens(r.execution_steps, 3, 6) &&
            lens(r.common_mistakes, 3, 4) &&
            r.breathing_cue.length >= 10 && r.breathing_cue.length <= 240 &&
            r.safety_guidance.length >= 10 && r.safety_guidance.length <= 400 &&
            r.equipment_setup.length <= 240 &&
            (r.accessibility_alternative === null || r.accessibility_alternative.length <= 240)
          const reviewOk = JSON.stringify(r.content_review) ===
            JSON.stringify({ status: 'pending', reviewer: null, reviewed_at: null, rationale: null })
          const flagsOk = r.import_eligible === false && r.deferred === false &&
            r.deferred_reason === null && r.review_status === 'proposed'
          const provOk = r.provenance === 'forgefitos_original' &&
            !('source_url' in r) && !('source_page' in r) && !('retrieved_at' in r) &&
            r.authored_by.trim().length >= 3 && /^\d{4}-\d{2}-\d{2}$/.test(r.authored_at)
          const noPub = !Object.keys(r).some((k) => k.includes('publication'))
          return keysOk && enumsOk && targetsOk && proseOk && reviewOk &&
            flagsOk && provOk && noPub && nameRe.test(r.proposed_canonical_name)
        })
      })())
    check('B2: the selection is EXACTLY the deterministic cumulative pick — algorithm re-run from Batches 1-3 coverage with mechanical least-represented weights (muscle 0->3; pattern 0->2, 1->1; equipment <=1 ->1; beginner 2; home/minimal 1; alphabetical tie-break) — and cumulative authored count is exactly 100 with zero overlap',
      (() => {
        const priorNames = new Set(prior.map((r) => r.proposed_canonical_name))
        if (prior.length !== 75) return false
        if (batch.some((r) => priorNames.has(r.proposed_canonical_name))) return false
        const release = inv.filter((r) => !r.deferred)
        const byName = new Map(release.map((r) => [r.proposed_canonical_name, r]))
        const sel: any[] = Array.from(priorNames).sort().map((n) => byName.get(n))
        if (sel.some((r) => !r)) return false
        let pool = release.filter((r) => !priorNames.has(r.proposed_canonical_name) &&
          r.normalized_name !== 'plank')
        const picks: string[] = []
        for (let i = 0; i < 25; i += 1) {
          const pm = new Map<string, number>()
          const pat = new Map<string, number>()
          const eq = new Map<string, number>()
          for (const r of sel) {
            pm.set(r.primary_muscle, (pm.get(r.primary_muscle) ?? 0) + 1)
            pat.set(r.movement_pattern, (pat.get(r.movement_pattern) ?? 0) + 1)
            eq.set(r.equipment, (eq.get(r.equipment) ?? 0) + 1)
          }
          const score = (r: any): number => {
            let s = 0
            if ((pm.get(r.primary_muscle) ?? 0) === 0) s += 3
            const pc = pat.get(r.movement_pattern) ?? 0
            if (pc === 0) s += 2
            else if (pc === 1) s += 1
            if ((eq.get(r.equipment) ?? 0) <= 1) s += 1
            if (r.difficulty === 'beginner') s += 2
            if (['minimal', 'home_gym'].includes(r.availability)) s += 1
            return s
          }
          pool = pool.sort((a, b) => score(b) - score(a) ||
            (a.normalized_name < b.normalized_name ? -1 : 1))
          picks.push(pool[0].proposed_canonical_name)
          sel.push(pool[0])
          pool = pool.slice(1)
        }
        return JSON.stringify(picks.sort()) ===
          JSON.stringify(batch.map((r) => r.proposed_canonical_name).sort()) &&
          prior.length + batch.length === 100
      })())
    check('B3: every record matches stable inventory metadata exactly; no Plank or weight_time; batch names unique',
      batch.every((r) => {
        const m = invByName.get(r.proposed_canonical_name)
        return !!m &&
          ['primary_muscle', 'equipment', 'tracking_mode', 'laterality', 'movement_pattern',
            'training_role', 'difficulty', 'availability'].every((f) => r[f] === m[f]) &&
          JSON.stringify(r.muscle_targets) === JSON.stringify(m.muscle_targets)
      }) &&
      !batch.some((r) => norm(r.proposed_canonical_name) === 'plank') &&
      batch.every((r) => r.tracking_mode !== 'weight_time') &&
      new Set(batch.map((r) => norm(r.proposed_canonical_name))).size === 25)
    check('B4: the selection record documents the mechanical least-represented procedure, exclusions, coverage, cumulative 100, and remaining 26; the editorial record lists every correction with exercise and field',
      (() => {
        const sFlat = selDoc.replace(/\s+/g, ' ')
        const eFlat = edDoc.replace(/\s+/g, ' ')
        const m = selDoc.match(/```json\n([\s\S]*?)\n```/)
        if (!m) return false
        const mach = JSON.parse(m[1])
        const b4n = batch.map((r) => r.proposed_canonical_name)
          .sort((a, b) => (a.toLowerCase() < b.toLowerCase() ? -1 : 1))
        return mach.batch === 4 && mach.batch_size === 25 &&
          mach.cumulative_authored === 100 &&
          mach.remaining_release1_unauthored === 26 &&
          mach.plank_gated_separately === true &&
          mach.deferred_weight_time_excluded === 8 &&
          JSON.stringify(mach.batch4_entries) === JSON.stringify(b4n) &&
          mach.selection_weights.new_primary_muscle === 3 &&
          mach.selection_weights.movement_pattern_uncovered === 2 &&
          mach.selection_weights.movement_pattern_single_covered === 1 &&
          mach.selection_weights.equipment_at_most_one === 1 &&
          mach.selection_weights.beginner_bonus === 2 &&
          mach.selection_weights.home_or_minimal_bonus === 1 &&
          String(mach.selection_weights.coverage_basis).includes('least represented defined mechanically') &&
          sFlat.includes('No entry was hand-picked') &&
          sFlat.includes('All 75 Batch 1-3 identities') &&
          sFlat.includes('Specialist review is a later explicit gate') &&
          eFlat.includes('One duplicated sentence reworded') &&
          eFlat.includes('Drafting-pass corrections before generation') &&
          eFlat.includes('next available increment/setting')
      })())
  }

  console.log('\nC. Names, aliases, relationships, and R-rules')
  {
    check('C1: R1-R3 — aliases and relationship arrays nonblank, normalized-unique per record and across ALL FOUR batches, never self-referencing, aliases never colliding with corpus canonical names, and every relationship target resolving to a promoted release-1 canonical name',
      (() => {
        const aliasSeen = new Map<string, string>()
        for (const r of prior) for (const a of r.aliases) aliasSeen.set(norm(a), r.proposed_canonical_name)
        return batch.every((r) => {
          const self = norm(r.proposed_canonical_name)
          return (['aliases', 'substitutions', 'regressions', 'progressions'] as const).every((f) => {
            const vals: string[] = r[f]
            const norms = vals.map(norm)
            if (vals.some((v) => !v.trim() || v.length < 2)) return false
            if (new Set(norms).size !== norms.length) return false
            if (norms.includes(self)) return false
            if (f === 'aliases') {
              return norms.every((a) => {
                if (corpusNorm.has(a)) return false
                if (aliasSeen.has(a) && aliasSeen.get(a) !== r.proposed_canonical_name) return false
                aliasSeen.set(a, r.proposed_canonical_name)
                return true
              })
            }
            return norms.every((t) => corpusNorm.has(t))
          })
        })
      })())
    check('C2: R5-R8 — no weight_time record, import_eligible literal false on all 25, zero copied-attribution markers, and original provenance with no source fields',
      batch.every((r) => r.tracking_mode !== 'weight_time') &&
      batch.every((r) => r.import_eligible === false) &&
      batch.every((r) => !/(according to|adapted from|source:|courtesy|credit(ed)? to|strengthlog)/i.test(proseOf(r))) &&
      batch.every((r) => r.provenance === 'forgefitos_original' &&
        !('source_url' in r) && !('source_page' in r) && !('retrieved_at' in r)))
  }

  console.log('\nD. Prose quality, terminology, and carried-forward review rules')
  {
    check('D1: terminology conformance — unilateral records use singular one-side-then-switch language in every field (no plural weights/both-arms cue wording), alternating records describe the rhythm, timed records use hold/duration (never rep units), cardio records use pace/effort/duration, rep-mode records never use duration-of-set, and machine/cable records name their adjustments',
      batch.every((r) => {
        const text = proseOf(r).toLowerCase()
        if (r.laterality === 'unilateral') {
          if (!/(side|switch|other (arm|leg|foot|ankle))/.test(text)) return false
          if (!/(one side|that side|one leg|that leg|one arm|that arm|one ankle)/.test(text)) return false
          if (/\b(dumbbells|kettlebells|both arms|weights)\b/.test(r.breathing_cue.toLowerCase())) return false
        }
        if (r.laterality === 'alternating' && !/(alternat|switch|march|each side)/.test(text)) return false
        if (r.tracking_mode === MODE_TIMED) {
          if (!/(hold|duration)/.test(text)) return false
          if (/\b(rep|reps)\b/.test(text)) return false
        }
        if (r.tracking_mode === MODE_CARDIO && !/(pace|effort|duration|minute|rhythm|stroke)/.test(text)) return false
        if ((r.tracking_mode === MODE_REPS || r.tracking_mode === MODE_BW) &&
          /duration of the set/.test(text)) return false
        if (['machine', 'cable'].includes(r.equipment) &&
          !/(seat|pad|pulley|pivot|lever|hook|platform|handle|stack|column|backrest|rail|speed|console|stop|damper|strap|cuff|saddle|bench angle)/.test(text)) return false
        return true
      }))
    check('D2: safety, machine, Smith, vest, and platform rules — concrete stop/modify action in every safety guidance, cuff/band records carry secure-attachment language, Smith records carry the exact neutral progression wording with hook/re-hook hazards, empty-bar familiarization, and no fixed increments, machine records stay model-neutral (adjustments differ/vary) and never name free weights in primary prose, weighted-vest records carry snug/secure fit language, and no medical/rehab/tissue/carried-forward stale phrasing anywhere in the batch',
      (() => {
        return batch.every((r) => {
          const text = proseOf(r)
          if (MED.test(text) || STALE.test(text)) return false
          if (/hold your breath/i.test(text) && !/never/i.test(text)) return false
          if (!ACTION.test(r.safety_guidance)) return false
          if (/cuff/i.test(text) && !/(snug|cannot slide|fasten)/i.test(text)) return false
          if (r.equipment === 'smith_machine') {
            if (!text.includes('next available increment/setting')) return false
            if (/\+\s?(5|2\.5)\s?(lb|kg)|fixed jump of/i.test(text) && !/rather than a fixed jump/i.test(text)) return false
            if (!/(hook|re-hook)/i.test(text)) return false
            if (!/empty bar/i.test(text)) return false
          }
          if (r.equipment === 'machine') {
            if (!/(differ|vary)/i.test(r.equipment_setup)) return false
            if (/\b(dumbbell|barbell|kettlebell)/i.test(primaryOf(r))) return false
          }
          if (r.equipment === 'weighted_vest' &&
            !/(snug|cannot shift|secure)/i.test(text)) return false
          return true
        })
      })())
    check('D3: no exact sentence repeats within Batch 4 OR against any Batch 1-3 record (100-record cross-batch boilerplate scan)',
      (() => {
        const seen = new Map<string, string>()
        for (const r of prior) {
          for (const s of [...r.setup_steps, ...r.execution_steps, ...r.common_mistakes,
            r.breathing_cue, r.safety_guidance]) seen.set(s.trim(), r.proposed_canonical_name)
        }
        return batch.every((r) => {
          const sentences = [...r.setup_steps, ...r.execution_steps, ...r.common_mistakes,
            r.breathing_cue, r.safety_guidance].map((s: string) => s.trim())
          return sentences.every((s) => {
            if (seen.has(s) && seen.get(s) !== r.proposed_canonical_name) return false
            seen.set(s, r.proposed_canonical_name)
            return true
          })
        })
      })())
    check('D4: corpus-wide negative rejections across ALL 100 records — every Batch 1-3 review-correction family stays enforced (stale phrases, prescribed shallow breathing, band constant-tension claims, incomplete face-height band alternatives, machine-metadata contradictions on the corrected Chest-supported row)',
      (() => {
        const all100 = [...prior, ...batch]
        for (const r of all100) {
          const text = proseOf(r)
          if (STALE.test(text)) return false
          if (/shallow/i.test(r.breathing_cue)) return false
          for (const s of text.split(/[.;]/)) {
            if (/\bband/i.test(s) && /constant[- ]tension/i.test(s)) return false
          }
          const acc = r.accessibility_alternative ?? ''
          if (/band/i.test(acc) && /face height/i.test(acc) &&
            !(/nicks or thinning|tears or thinning/i.test(acc) && /fixed anchor/i.test(acc) && /confirm/i.test(acc))) return false
        }
        const csr = all100.find((r) => norm(r.proposed_canonical_name) === 'chest-supported row')
        if (!csr || csr.equipment !== 'machine') return false
        if (/dumbbell|incline bench/i.test(primaryOf(csr))) return false
        if ((csr.aliases as string[]).some((a) => norm(a) === 'incline bench row')) return false
        return true
      })())
    check('D5: ADMISSION (EXLIB-2C batch 4), REVISED (EXLIB-2C batch 4 review 1) — first-appearance positive pins: Smith bench functional escape clearance tested with the empty bar and conditional re-hooking, Smith squat depth-relative stops with a model-neutral whole-foot stance, weighted-vest snug fit with lightest-setting starts and step-down dismount, bar-hang records with stable non-slip entry and grip-limited set endings, Nordic padded immovable anchor with hands-catch and stop-before-control-is-gone, ab wheel arch-control set ending, bike fixed-drive dismount, and the Bulgarian split squat one-leg switch contract',
      (() => {
        const by = new Map<string, any>(batch.map((r) => [norm(r.proposed_canonical_name), r]))
        // REVISED (EXLIB-2C batch 4 review 1): the Smith bench pins now
        // require the FUNCTIONAL clearance rule (highest stop position
        // that preserves the intended range while allowing a flatten-
        // and-slide-clear escape, tested with the empty bar) instead of
        // the withdrawn universal chest-height doctrine and absolute
        // anti-pinning claim; the squat pins now require the model-
        // neutral whole-foot stance instead of feet-forward doctrine.
        const sbp = by.get('smith machine bench press')
        const sbpOk = /highest position that still allows your intended bottom range/i.test(sbp.setup_steps.join(' ')) &&
          /flatten your torso and slide clear/i.test(sbp.setup_steps.join(' ')) &&
          /test that stop position with the empty bar before loading/i.test(sbp.setup_steps.join(' ')) &&
          /shorten the range/i.test(sbp.safety_guidance) &&
          /re-hook only if the hooks are aligned and the bar is under control/i.test(sbp.safety_guidance) &&
          /lower the bar onto the tested safeties/i.test(sbp.safety_guidance)
        const ssq = by.get('smith machine squat')
        const ssqOk = /safety stops just below your lowest squat depth/i.test(ssq.setup_steps.join(' ')) &&
          /stance that keeps your whole foot planted/i.test(ssq.setup_steps.join(' ')) &&
          /rail paths may be vertical or angled/i.test(ssq.equipment_setup) &&
          /feet under or slightly ahead of you depending on the machine/i.test(ssq.equipment_setup) &&
          /lower with control onto the stops or rotate to re-hook/i.test(ssq.safety_guidance)
        const vpu = by.get('weighted vest pull-up')
        const vpp = by.get('weighted vest push-up')
        const vestOk = /snugly so it cannot shift/i.test(vpu.setup_steps.join(' ')) &&
          /lightest vest setting/i.test(vpu.safety_guidance) &&
          /step down onto the step rather than dropping/i.test(vpu.safety_guidance) &&
          /snugly so the plates sit flat/i.test(vpp.setup_steps.join(' '))
        const hangs = ['chin-up', 'hanging knee raise', 'hanging leg raise', 'weighted vest pull-up']
        const hangOk = hangs.every((n) => {
          const r = by.get(n)
          return /(stable, non-slip (step|box)|stable (step|box|platform))/i.test(proseOf(r)) &&
            /end the set/i.test(r.safety_guidance)
        })
        const nor = by.get('nordic hamstring curl')
        const norOk = /padded, (fixed|immovable)/i.test(proseOf(nor)) &&
          /catch/i.test(proseOf(nor)) &&
          /stop the set before control is gone/i.test(nor.safety_guidance)
        const abw = by.get('ab wheel rollout')
        const abwOk = /end the set as soon as the hips drop or the lower back starts to arch/i.test(abw.safety_guidance)
        const bike = by.get('stationary bike')
        const bikeOk = /wait for the pedals to stop before dismounting/i.test(bike.safety_guidance)
        const bss = by.get('bulgarian split squat')
        const bssOk = /complete every rep on one leg, then switch legs and match the load and reps/i.test(bss.execution_steps.join(' '))
        return sbpOk && ssqOk && vestOk && hangOk && norOk && abwOk && bikeOk && bssOk
      })())
    check('D6: ADMISSION (EXLIB-2C batch 4 review 1) — review-correction enforcement: no chest-height stop doctrine in any Smith record, no intentional chin-up drop exit, inspected band in the Hip abduction alternative, Nordic purpose-built or force-tested fixed anchor with no generic-helper equivalence, no unsecured load resting on the thighs, controlled weighted-vest push-up regression with no feet-elevation accessibility anywhere in the corpus, and a controlled dumbbell-fly exit (the corpus-wide bans on absolute anti-pinning claims, bail-at-any-height framing, drop-to-knees, steady-helper anchors, and universal Smith stance doctrine run in D2/D4 via the extended stale-phrase family)',
      (() => {
        const all100 = [...prior, ...batch]
        for (const r of all100) {
          if (r.equipment === 'smith_machine' && /just below chest (height|level)/i.test(proseOf(r))) return false
          if (/elevate(d)? the feet/i.test(r.accessibility_alternative ?? '')) return false
        }
        const by = new Map<string, any>(batch.map((r) => [norm(r.proposed_canonical_name), r]))
        const chin = by.get('chin-up')
        const chinOk = /pause and get assistance rather than dropping on purpose/i.test(chin.safety_guidance) &&
          /step back down onto the step/i.test(chin.safety_guidance)
        const hip = by.get('hip abduction machine')
        const hipOk = /checked for tears, nicks, or thinning/i.test(hip.accessibility_alternative ?? '')
        const nor = by.get('nordic hamstring curl')
        const norOk = /purpose-built Nordic station/i.test(nor.equipment_setup) &&
          /padded fixed anchor tested with partial force/i.test(nor.equipment_setup)
        const scr = by.get('seated calf raise')
        const scrOk = /body weight only/i.test(scr.accessibility_alternative ?? '') &&
          /press down on the thighs with your hands/i.test(scr.accessibility_alternative ?? '')
        const vpp = by.get('weighted vest push-up')
        const vppOk = /lower the knees under control/i.test(vpp.safety_guidance) &&
          /raised, stable surface/i.test(vpp.accessibility_alternative ?? '') &&
          /remove the vest/i.test(vpp.accessibility_alternative ?? '')
        const fly = by.get('dumbbell fly')
        const flyOk = /rock up to sitting rather than dropping the weights outward/i.test(fly.execution_steps.join(' '))
        // REVISED (EXLIB-2C cross-batch bench-safety correction): the
        // Machine hip thrust alternative must secure any external load.
        const mht = by.get('machine hip thrust')
        const mhtOk = /padded weight held securely on your hips with both hands/i.test(mht.accessibility_alternative ?? '') &&
          !/light weight across the hips/i.test(mht.accessibility_alternative ?? '')
        return chinOk && hipOk && norOk && scrOk && vppOk && flyOk && mhtOk
      })())
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
