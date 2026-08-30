// EXLIB-2C Release-1 Batch 5 verifier — authored content (PENDING
// REVIEW; loading prohibited).
//
// Proves: the exact source baseline and phase inventory; exactly 25
// Batch 5 records with zero overlap with Batches 1-4; the
// deterministic cumulative selection (mechanical least-represented
// weighting) reproduced from the stable inventory; cumulative
// authored count exactly 125 with the single remaining ordinary
// entry identified as Thruster; schema validity and stable metadata
// equality; Plank/weight_time exclusion; R1-R8; aliases and
// relationships unique, resolved, and non-self-referential across
// ALL FIVE batches; the pending/null-evidence/import-false/
// no-publication boundary; laterality, tracking-mode, machine,
// Smith, bench-safety, load-security, platform, and breathing
// rules; corpus-wide stale-phrase rejection carrying forward every
// Batch 1-4 review correction family across all 125 records; a
// cross-batch boilerplate scan across all 125 records;
// first-appearance positive pins for this batch's rack-press,
// Smith-row, hip-thrust, over-face, kettlebell, sandbag, bar-hang,
// and vest hazards; Batch 1-4 content and design artifacts
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
const norm = (s: string): string => s.trim().toLowerCase()

const CONTENT = 'docs/exlib2c-release1-batch05-content.jsonl'
const SELECTION = 'docs/exlib2c-release1-batch05-selection.md'
const EDITORIAL = 'docs/exlib2c-release1-batch05-editorial-record.md'
const VERIFIER = 'scripts/verify-exlib2c-batch05.ts'
const B4_VERIFIER = 'scripts/verify-exlib2c-batch04.ts'
const PHASE_NEW = [CONTENT, SELECTION, EDITORIAL, VERIFIER].sort()
const PHASE_ALL = [...PHASE_NEW, B4_VERIFIER].sort()
const BATCH4_TIP = '71d3f9ae7d4ec02045973cb8d7d8da6082cb5e93'

const [MODE_REPS, MODE_BW, MODE_CARDIO, MODE_TIMED] = TRACKING_MODES

const batch = parseJsonl(CONTENT)
const b1 = parseJsonl('docs/exlib2c-release1-batch01-content.jsonl')
const b2 = parseJsonl('docs/exlib2c-release1-batch02-content.jsonl')
const b3 = parseJsonl('docs/exlib2c-release1-batch03-content.jsonl')
const b4 = parseJsonl('docs/exlib2c-release1-batch04-content.jsonl')
const prior = [...b1, ...b2, ...b3, ...b4]
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
// are scoped in D4's record-level guards instead. The bare
// "safety arms just below chest height" doctrine is corpus-wide
// invalid since the promoted cross-batch bench-safety correction.
const STALE = /(complains|\bpour|waiting to happen|weakest at the bottom|pinches the shoulder joint|the weight is doing the choosing|under (the )?chair legs?|one rep at a time|hand-off|allows more weight|past the toes|while the tissue|step off the bars|overloads the groin|shallowly|shallow breath|never step off a moving belt|straddle|step or plate|looped across|between holds|locked out|removes lower-back|pad removes|reverse to the floor and reset|taking the eyes off the bell|can never pin you|at any height|land softly with bent knees|steady helper|resting across the thighs|drop to your knees|pitches the torso forward|slightly ahead of the bar|a little forward of the bar|safety arms just below chest height)/i
const MED = /\b(diagnos\w*|treat(s|ed|ment)?\b|rehabilitat\w*|prescri\w*|cure\w*|therap\w*|pain-free|guarantee\w*|tissue adapt|tissue recovery|physiological recovery)/i
const ACTION = /(stop|end the (set|session)|reduce|lighten|lighter|lower the (weight|hips|knee)|shorten|rest|pause|step down|step off|switch|set the (bar|bell|plate|dumbbell)s? down|strip weight|come off|lower down|shrink|slow the (pace|machine|rhythm)|grab the rails|drop the stack|move (your )?hands|rebuild)/i

async function main(): Promise<void> {
  console.log('EXLIB-2C Batch 4 verification (authored content, pending review)')

  console.log('\nA. Baseline and phase boundary')
  {
    check('A1: Batch 1-4 content and promoted design artifacts remain byte-identical (Batch 1 at its promoted cross-batch-corrected fingerprint), and prior protected EXLIB artifacts hold',
      sha256('docs/exlib2c-release1-batch01-content.jsonl') === '8168fc196f89781e8a30b315f29d1c72f46afeff8edfe89d1812b0a150ece2b2' &&
      sha256('docs/exlib2c-release1-batch02-content.jsonl') === '1ddc3ab0bd92d60ef33960d82a8e0c8a2fdea1cb828d15fc9bf6a82c34305d48' &&
      sha256('docs/exlib2c-release1-batch03-content.jsonl') === 'e4fca8b632c9c9af9b7c6eece660f2042b6a4c3ef613e14c278f95cf9fcab528' &&
      sha256('docs/exlib2c-release1-batch04-content.jsonl') === 'e7def375e9b9560863796bff90746dc6ff2b2f7c4bd7735a3d53fc2cc9750568' &&
      sha256('docs/exlib2c-release1-batch01-style-standard.md') === '3bdf2f71a0be8aa41ce1a7b6ca149a1d33342b7ff8ea381c8e92686c030a75f1' &&
      sha256('docs/exlib2a-catalog-architecture-record.md') === 'de825ddf18260a877651e426c8436709257c9100e3dfcbd994e3b9e2496191d8' &&
      sha256('docs/exlib2b-release1-coverage-matrix.md') === 'c32b7b9e9d3aafab39a9a6d77db09349dd604457274767fe4c880c6bf1fb2fb0' &&
      sha256('docs/exlib2b-release1-inventory.jsonl') === 'd349110f22700a822eb427fc1dcce3e6dbcfd264b6d48ed84936b07b1ca256f5' &&
      sha256('docs/exlib2c-authoring-schema.json') === 'dddb872c7725c591e6d056e0dc73167d3c822f6245ebd2c759a045fecbd43c6e' &&
      sha256('supabase/migrations/025_exlib_equipment_vocabulary_support.sql') === 'fbda16f4d25cacd1715b199050506a4da15896355d96700876b76c68826d304c' &&
      sha256('docs/exlib1a-discovery-manifest.jsonl') === '336cd4253f747cdb3ba73ffa2af5a63e255c7c87cc452d4c43ed59a654673dfa' &&
      sha256('docs/exlib1b1-review-ledger.jsonl') === 'aa4fe77c0c633510661eede94b40e9bae4aca90a7d8c2794abde92c83c6f7b7b')
    check('A2: planning-only boundary — migration 026 absent, migrations exactly 001-025, zero weight_time in src, no importer artifacts, and the range beyond the Batch 4 tip touches ONLY this phase\'s five paths',
      (() => {
        const files = readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).sort()
        if (files.length !== 25 || files.some((f) => f.startsWith('026'))) return false
        if (execSync("grep -rl 'weight_time' src/ || true", { encoding: 'utf8' }).trim() !== '') return false
        if (existsSync('scripts/exlib1c-import.ts') || existsSync('src/lib/catalog-import.ts')) return false
        const range = execSync(`git diff --name-only ${BATCH4_TIP}..HEAD`, { encoding: 'utf8' })
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
    check('G1: lifecycle-safe phase boundary — exact five-path inventory (four new + the retargeted Batch 4 verifier), nothing staged; strict while uncommitted, adder-anchored once committed',
      (() => {
        try {
          const inHead = (() => {
            try { execSync(`git cat-file -e HEAD:${CONTENT}`, { stdio: 'pipe' }); return true } catch { return false }
          })()
          if (!inHead) {
            const entries = execSync('git status --porcelain', { encoding: 'utf8' })
              .split('\n').filter(Boolean).map((l) => l.trim()).sort()
            const expected = [...PHASE_NEW.map((f) => `?? ${f}`), `M ${B4_VERIFIER}`].sort()
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
          execSync(`git merge-base --is-ancestor ${BATCH4_TIP} ${phase}`)
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
    check('B2: the selection is EXACTLY the deterministic cumulative pick — algorithm re-run from Batches 1-4 coverage with mechanical least-represented weights (muscle 0->3; pattern 0->2, 1->1; equipment <=1 ->1; beginner 2; home/minimal 1; alphabetical tie-break) — cumulative authored count is exactly 125 with zero overlap, and the ONE remaining ordinary entry is exactly Thruster',
      (() => {
        const priorNames = new Set(prior.map((r) => r.proposed_canonical_name))
        if (prior.length !== 100) return false
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
          prior.length + batch.length === 125 &&
          pool.length === 1 && pool[0].proposed_canonical_name === 'Thruster'
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
    check('B4: the selection record documents the mechanical least-represented procedure, exclusions, coverage, cumulative 125, and the single remaining ordinary entry (Thruster); the editorial record lists every correction with exercise and field',
      (() => {
        const sFlat = selDoc.replace(/\s+/g, ' ')
        const eFlat = edDoc.replace(/\s+/g, ' ')
        const m = selDoc.match(/```json\n([\s\S]*?)\n```/)
        if (!m) return false
        const mach = JSON.parse(m[1])
        const b4n = batch.map((r) => r.proposed_canonical_name)
          .sort((a, b) => (a.toLowerCase() < b.toLowerCase() ? -1 : 1))
        return mach.batch === 5 && mach.batch_size === 25 &&
          mach.cumulative_authored === 125 &&
          mach.remaining_release1_unauthored === 1 &&
          mach.remaining_ordinary_entry === 'Thruster' &&
          mach.plank_gated_separately === true &&
          mach.deferred_weight_time_excluded === 8 &&
          JSON.stringify(mach.batch5_entries) === JSON.stringify(b4n) &&
          mach.selection_weights.new_primary_muscle === 3 &&
          mach.selection_weights.movement_pattern_uncovered === 2 &&
          mach.selection_weights.movement_pattern_single_covered === 1 &&
          mach.selection_weights.equipment_at_most_one === 1 &&
          mach.selection_weights.beginner_bonus === 2 &&
          mach.selection_weights.home_or_minimal_bonus === 1 &&
          String(mach.selection_weights.coverage_basis).includes('least represented defined mechanically') &&
          sFlat.includes('No entry was hand-picked') &&
          sFlat.includes('All 100 Batch 1-4 identities') &&
          sFlat.includes('Specialist review is a later explicit gate') &&
          eFlat.includes('Drafting-pass corrections before generation') &&
          eFlat.includes('line-by-line editorial corrections') &&
          eFlat.includes('next available increment/setting')
      })())
  }

  console.log('\nC. Names, aliases, relationships, and R-rules')
  {
    check('C1: R1-R3 — aliases and relationship arrays nonblank, normalized-unique per record and across ALL FIVE batches, never self-referencing, aliases never colliding with corpus canonical names, and every relationship target resolving to a promoted release-1 canonical name',
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
    check('D3: no exact sentence repeats within Batch 5 OR against any Batch 1-4 record (125-record cross-batch boilerplate scan)',
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
    check('D4: corpus-wide negative rejections across ALL 125 records — every Batch 1-4 review-correction family stays enforced (stale phrases, prescribed shallow breathing, band constant-tension claims, incomplete face-height band alternatives, Smith chest-height doctrine, feet-elevation accessibility, machine-metadata contradictions on the corrected Chest-supported row)',
      (() => {
        const all125 = [...prior, ...batch]
        for (const r of all125) {
          const text = proseOf(r)
          if (STALE.test(text)) return false
          if (/shallow/i.test(r.breathing_cue)) return false
          for (const s of text.split(/[.;]/)) {
            if (/\bband/i.test(s) && /constant[- ]tension/i.test(s)) return false
          }
          const acc = r.accessibility_alternative ?? ''
          if (/band/i.test(acc) && /face height/i.test(acc) &&
            !(/nicks or thinning|tears or thinning/i.test(acc) && /fixed anchor/i.test(acc) && /confirm/i.test(acc))) return false
          if (r.equipment === 'smith_machine' && /just below chest (height|level)/i.test(text)) return false
          if (/elevate(d)? the feet/i.test(acc)) return false
        }
        const csr = all125.find((r) => norm(r.proposed_canonical_name) === 'chest-supported row')
        if (!csr || csr.equipment !== 'machine') return false
        if (/dumbbell|incline bench/i.test(primaryOf(csr))) return false
        if ((csr.aliases as string[]).some((a) => norm(a) === 'incline bench row')) return false
        return true
      })())
    check('D5: ADMISSION (EXLIB-2C batch 5), REVISED (EXLIB-2C batch 5 review 1) — first-appearance positive pins: functional rack-press safeties with unloaded-bar clearance tests and spotter-supplements language on both barbell presses, Front squat hands-clear release onto tested safeties with a step back, Smith row tested stops with hinged empty-bar hook practice and both-hooks confirmation, padded hand-held Hip thrust bar, over-face Skull crusher no-grind exit, kettlebell no-catch discipline with the pre-rep versus mid-flight grip distinction, sandbag clear-feet release-zone rule, functional Good morning stop doctrine, Pull-up and Inverted row secured-bar and platform exits, Walking lunge mid-runway set-down, and Weighted vest squat re-tighten/remove rules',
      (() => {
        const by = new Map<string, any>(batch.map((r) => [norm(r.proposed_canonical_name), r]))
        const cgbp = by.get('close-grip bench press')
        const cgbpOk = /as high as they can go while still clearing your intended touch point/i.test(cgbp.setup_steps.join(' ')) &&
          /Confirm with an unloaded bar that you can flatten out and slide free/i.test(cgbp.setup_steps.join(' ')) &&
          /shorten the range rather than lowering them/i.test(cgbp.safety_guidance) &&
          /spotter is an addition to tested safeties/i.test(cgbp.safety_guidance) &&
          /lower the bar to the safeties, flatten out, and slide free/i.test(cgbp.safety_guidance)
        const ibp = by.get('incline barbell press')
        const ibpOk = /as high as the incline allows while clearing your touch point/i.test(ibp.setup_steps.join(' ')) &&
          /Check with an unloaded bar/i.test(ibp.setup_steps.join(' ')) &&
          /Re-test the safety height with an unloaded bar whenever the bench angle changes/i.test(ibp.safety_guidance) &&
          /spotter supplements the safeties/i.test(ibp.safety_guidance) &&
          /lower to the safeties, flatten, and slide down the bench/i.test(ibp.safety_guidance)
        // REVISED (EXLIB-2C batch 5 review 1): the withdrawn manual
        // steer-to-safeties, finish-and-park-after-slipping,
        // chest-then-sit-up, and lean-and-release-in-front pins are
        // replaced with the corrected procedures, and the functional
        // Good morning stop doctrine is pinned.
        const fsq = by.get('front squat')
        const fsqOk = /safeties as high as they can go while clearing your bottom position, tested with an unloaded bar/i.test(fsq.setup_steps.join(' ')) &&
          /end the set when you can no longer keep them up/i.test(fsq.safety_guidance) &&
          /release your hands clear/i.test(fsq.safety_guidance) &&
          /onto the tested safeties/i.test(fsq.safety_guidance) &&
          /step backward away/i.test(fsq.safety_guidance) &&
          /never try to catch or wrestle a falling bar/i.test(fsq.safety_guidance)
        const gm = by.get('good morning')
        const gmOk = /just below the bar's lowest intended position/i.test(gm.equipment_setup) &&
          /test that exact height with an unloaded bar before loading/i.test(gm.equipment_setup) &&
          /without forcing you below the planned range/i.test(gm.safety_guidance) &&
          /shorten the range if they cannot/i.test(gm.safety_guidance) &&
          /rests securely on both safeties/i.test(gm.safety_guidance) &&
          /step out only once it is fully supported/i.test(gm.safety_guidance)
        const smr = by.get('smith machine row')
        const smrOk = /confirm the safety stops sit just below that starting height/i.test(smr.setup_steps.join(' ')) &&
          /Practice the hook rotation with an empty bar from the hinged position/i.test(smr.setup_steps.join(' ')) &&
          /lower the bar onto the stops or re-hook it fully/i.test(smr.safety_guidance) &&
          /check both hooks caught/i.test(smr.safety_guidance)
        const ht = by.get('hip thrust')
        const htOk = /padded barbell/i.test(ht.setup_steps.join(' ')) &&
          /Keep both hands on the bar/i.test(ht.setup_steps.join(' ')) &&
          /must be padded and held with both hands so it cannot roll or slide/i.test(ht.safety_guidance)
        const sk = by.get('skull crusher')
        const skOk = /straight-arm position for a partner to take/i.test(sk.execution_steps.join(' ')) &&
          /roll it to the hip crease/i.test(sk.execution_steps.join(' ')) &&
          /end the set a rep early/i.test(sk.safety_guidance) &&
          /roll it to the hips before sitting up/i.test(sk.safety_guidance) &&
          /never sit upright with a bar resting loose on the chest/i.test(sk.safety_guidance)
        const kcp = by.get('kettlebell clean and press')
        const kcpOk = /never try to catch or steer a bell that has gotten away/i.test(kcp.safety_guidance) &&
          /Complete the set on one side, then switch hands and match the load and reps/i.test(kcp.execution_steps.join(' '))
        const ksw = by.get('kettlebell swing')
        const kswOk = /before the next rep begins, end the set and park the bell while control is intact/i.test(ksw.safety_guidance) &&
          /slips mid-flight, move clear and let it land/i.test(ksw.safety_guidance) &&
          /never grab, chase, or redirect/i.test(ksw.safety_guidance) &&
          /never throw the bell on purpose/i.test(ksw.safety_guidance)
        const pu = by.get('pull-up')
        const puOk = /end the set while the grip is still secure and the step is within reach/i.test(pu.safety_guidance) &&
          /pause and get help rather than choosing a drop/i.test(pu.safety_guidance) &&
          /firm pull-test/i.test(pu.equipment_setup)
        const ir = by.get('inverted row')
        const irOk = /confirm both hooks are seated/i.test(ir.setup_steps.join(' ')) &&
          /Test the bar with a firm downward pull/i.test(ir.safety_guidance)
        const sbs = by.get('sandbag shouldering')
        const sbsOk = /stop trying to save the shoulder position/i.test(sbs.safety_guidance) &&
          /cleared drop area away from your feet/i.test(sbs.safety_guidance) &&
          /step clear without twisting/i.test(sbs.safety_guidance) &&
          /never catch a falling bag/i.test(sbs.safety_guidance) &&
          /Clear a drop area around you, away from your feet/i.test(sbs.setup_steps.join(' ')) &&
          /alternating shoulders rep by rep/i.test(sbs.execution_steps.join(' '))
        const wl = by.get('walking lunge')
        const wlOk = /set the dumbbells down mid-runway/i.test(wl.safety_guidance)
        const wvs = by.get('weighted vest squat')
        const wvsOk = /Fasten the vest snug so it cannot shift/i.test(wvs.setup_steps.join(' ')) &&
          /remove the vest and finish the set with body weight/i.test(wvs.safety_guidance)
        return cgbpOk && ibpOk && fsqOk && gmOk && smrOk && htOk && skOk && kcpOk &&
          kswOk && puOk && irOk && sbsOk && wlOk && wvsOk
      })())
    check('D6: ADMISSION (EXLIB-2C batch 5 review 1) — review-correction enforcement across ALL 125 records: no generic near-hip-height safeties, no duck-out exits, no manual steering of a rolling or over-face bar, no finishing a swing after the grip starts slipping, no sitting up with a bar loose on the chest, no lean-and-release toward the front of the feet, no lowering-builds-most claims, and no assumed small vest increments; plus the corrected Reverse curl neutral lowering and the model-neutral vest progression',
      (() => {
        const all125 = [...prior, ...batch]
        const BAN = new RegExp(['near hip height', 'duck out', 'steer it down onto the safeties',
          'steer the bar to the chest', 'finish that swing', 'lean toward the floor and let it go',
          'builds most of the', "vest's own small steps", 'sit up with it'].join('|'), 'i')
        for (const r of all125) {
          if (BAN.test(proseOf(r))) return false
        }
        const by = new Map<string, any>(batch.map((r) => [norm(r.proposed_canonical_name), r]))
        const rc = by.get('reverse curl')
        const rcOk = /keeping the wrists straight and the bar under control/i.test(rc.execution_steps.join(' ')) &&
          !/builds most/i.test(proseOf(rc))
        const wvs = by.get('weighted vest squat')
        const wvsOk = /next available vest setting only after full sets remain controlled/i.test(wvs.equipment_setup)
        return rcOk && wvsOk
      })())
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
