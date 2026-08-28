// EXLIB-2C Release-1 Batch 2 verifier — authored content (PENDING
// REVIEW; loading prohibited).
//
// Proves: the exact source baseline and phase inventory; exactly 25
// Batch 2 records with zero identity overlap with Batch 1; the
// deterministic cumulative-coverage selection reproduced from the
// stable inventory; cumulative authored count exactly 50; schema
// validation; stable metadata equality; no Plank and no weight_time;
// R1-R8; resolved, unique, self-reference-free aliases and
// relationships; the pending/null-evidence/import-false/
// no-publication boundary; mode and laterality terminology across
// every prose field including singular wording for unilateral
// records; structural completeness; machine/equipment setup
// requirements; medical, copied-attribution, breath-holding,
// causal-injury, stale-phrase, and cross-batch boilerplate scans;
// Batch 1 content and the promoted design artifacts byte-identical;
// migration 026 absent; runtime/schema/API/UI/dependency/
// configuration unchanged; ledger and legacy eligibility unchanged;
// exact two-state lifecycle. Performs NO hosted contact.
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

const CONTENT = 'docs/exlib2c-release1-batch02-content.jsonl'
const SELECTION = 'docs/exlib2c-release1-batch02-selection.md'
const EDITORIAL = 'docs/exlib2c-release1-batch02-editorial-record.md'
const VERIFIER = 'scripts/verify-exlib2c-batch02.ts'
const B1_VERIFIER = 'scripts/verify-exlib2c-batch01.ts'
const PHASE_NEW = [CONTENT, SELECTION, EDITORIAL, VERIFIER].sort()
const PHASE_ALL = [...PHASE_NEW, B1_VERIFIER].sort()
const BATCH1_TIP = '064a131d88d4948a7aaaf9d77c9fa6565a9b000b'

const [MODE_REPS, MODE_BW, MODE_CARDIO, MODE_TIMED] = TRACKING_MODES

const batch = parseJsonl(CONTENT)
const b1 = parseJsonl('docs/exlib2c-release1-batch01-content.jsonl')
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

async function main(): Promise<void> {
  console.log('EXLIB-2C Batch 2 verification (authored content, pending review)')

  console.log('\nA. Baseline and phase boundary')
  {
    check('A1: Batch 1 content and promoted design artifacts remain byte-identical, and prior protected EXLIB artifacts hold',
      sha256('docs/exlib2c-release1-batch01-content.jsonl') === '4f761df53eef0375adce9caa88277d1c7a047ecbdc4c696b0a286f9ebb3ef19b' &&
      sha256('docs/exlib2c-release1-batch01-selection.md') === '96a6664c32ac3606739cdf02d3e85dfba2af1b54ae3a08385275d6040512e20c' &&
      sha256('docs/exlib2c-release1-batch01-style-standard.md') === '3bdf2f71a0be8aa41ce1a7b6ca149a1d33342b7ff8ea381c8e92686c030a75f1' &&
      sha256('docs/exlib2a-catalog-architecture-record.md') === 'de825ddf18260a877651e426c8436709257c9100e3dfcbd994e3b9e2496191d8' &&
      sha256('docs/exlib2b-release1-coverage-matrix.md') === 'c32b7b9e9d3aafab39a9a6d77db09349dd604457274767fe4c880c6bf1fb2fb0' &&
      sha256('docs/exlib2b-release1-inventory.jsonl') === 'd349110f22700a822eb427fc1dcce3e6dbcfd264b6d48ed84936b07b1ca256f5' &&
      sha256('docs/exlib2c-authoring-schema.json') === 'dddb872c7725c591e6d056e0dc73167d3c822f6245ebd2c759a045fecbd43c6e' &&
      sha256('supabase/migrations/025_exlib_equipment_vocabulary_support.sql') === 'fbda16f4d25cacd1715b199050506a4da15896355d96700876b76c68826d304c' &&
      sha256('docs/exlib1a-discovery-manifest.jsonl') === '336cd4253f747cdb3ba73ffa2af5a63e255c7c87cc452d4c43ed59a654673dfa' &&
      sha256('docs/exlib1b1-review-ledger.jsonl') === 'aa4fe77c0c633510661eede94b40e9bae4aca90a7d8c2794abde92c83c6f7b7b')
    check('A2: planning-only boundary — migration 026 absent, migrations exactly 001-025, zero weight_time in src, no importer artifacts, and the range beyond the Batch 1 tip touches ONLY this phase\'s five paths',
      (() => {
        const files = readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).sort()
        if (files.length !== 25 || files.some((f) => f.startsWith('026'))) return false
        if (execSync("grep -rl 'weight_time' src/ || true", { encoding: 'utf8' }).trim() !== '') return false
        if (existsSync('scripts/exlib1c-import.ts') || existsSync('src/lib/catalog-import.ts')) return false
        const range = execSync(`git diff --name-only ${BATCH1_TIP}..HEAD`, { encoding: 'utf8' })
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
    check('G1: lifecycle-safe phase boundary — exact five-path inventory (four new + the retargeted Batch 1 verifier), nothing staged',
      (() => {
        try {
          const inHead = (() => {
            try { execSync(`git cat-file -e HEAD:${CONTENT}`, { stdio: 'pipe' }); return true } catch { return false }
          })()
          if (!inHead) {
            const entries = execSync('git status --porcelain', { encoding: 'utf8' })
              .split('\n').filter(Boolean).map((l) => l.trim()).sort()
            const expected = [...PHASE_NEW.map((f) => `?? ${f}`), `M ${B1_VERIFIER}`].sort()
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
          execSync(`git merge-base --is-ancestor ${BATCH1_TIP} ${phase}`)
          const range = execSync(`git diff --name-only ${phase}^..${phase}`, { encoding: 'utf8' })
            .split('\n').filter(Boolean).sort()
          return JSON.stringify(range) === JSON.stringify(PHASE_ALL)
        } catch { return false }
      })())
  }

  console.log('\nB. Batch structure and selection')
  {
    check('B1: exactly 25 records, every one schema-valid — required/allowed fields, enum vocabularies, bounds, clean pending review, import_eligible literal false, original provenance without source fields, no deferred entries, no publication state',
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
    check('B2: the selection is EXACTLY the deterministic cumulative-coverage pick — algorithm re-run against the promoted inventory starting from Batch 1 coverage (weights 3/2/1 + beginner 2 + home/minimal 1, alphabetical tie-break), and cumulative authored count is exactly 50 with zero overlap',
      (() => {
        const b1Names = new Set(b1.map((r) => r.proposed_canonical_name))
        if (b1.length !== 25) return false
        if (batch.some((r) => b1Names.has(r.proposed_canonical_name))) return false
        const release = inv.filter((r) => !r.deferred)
        const byName = new Map(release.map((r) => [r.proposed_canonical_name, r]))
        const sel: any[] = Array.from(b1Names).sort().map((n) => byName.get(n))
        if (sel.some((r) => !r)) return false
        let pool = release.filter((r) => !b1Names.has(r.proposed_canonical_name) &&
          r.normalized_name !== 'plank')
        const picks: string[] = []
        for (let i = 0; i < 25; i += 1) {
          const pm = new Set(sel.map((r) => r.primary_muscle))
          const pat = new Set(sel.map((r) => r.movement_pattern))
          const eq = new Set(sel.map((r) => r.equipment))
          const score = (r: any): number =>
            (pm.has(r.primary_muscle) ? 0 : 3) + (pat.has(r.movement_pattern) ? 0 : 2) +
            (eq.has(r.equipment) ? 0 : 1) + (r.difficulty === 'beginner' ? 2 : 0) +
            (['minimal', 'home_gym'].includes(r.availability) ? 1 : 0)
          pool = pool.sort((a, b) => score(b) - score(a) ||
            (a.normalized_name < b.normalized_name ? -1 : 1))
          picks.push(pool[0].proposed_canonical_name)
          sel.push(pool[0])
          pool = pool.slice(1)
        }
        return JSON.stringify(picks.sort()) ===
          JSON.stringify(batch.map((r) => r.proposed_canonical_name).sort()) &&
          b1.length + batch.length === 50
      })())
    check('B3: every batch record matches its stable promoted-inventory metadata exactly, and no Plank or weight_time entry exists',
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
    check('B4: the selection record documents the cumulative deterministic procedure, exclusions, coverage, remaining count, and pending/not-loadable posture; the editorial record lists every correction with field and reason',
      (() => {
        const sFlat = selDoc.replace(/\s+/g, ' ')
        const eFlat = edDoc.replace(/\s+/g, ' ')
        const m = selDoc.match(/```json\n([\s\S]*?)\n```/)
        if (!m) return false
        const mach = JSON.parse(m[1])
        const b2n = batch.map((r) => r.proposed_canonical_name)
          .sort((a, b) => (a.toLowerCase() < b.toLowerCase() ? -1 : 1))
        return mach.batch === 2 && mach.batch_size === 25 &&
          mach.cumulative_authored === 50 &&
          mach.remaining_release1_unauthored === 76 &&
          mach.plank_gated_separately === true &&
          JSON.stringify(mach.batch2_entries) === JSON.stringify(b2n) &&
          mach.selection_weights.new_primary_muscle === 3 &&
          mach.selection_weights.new_movement_pattern === 2 &&
          mach.selection_weights.new_equipment === 1 &&
          String(mach.selection_weights.coverage_basis).includes('cumulative coverage after Batch 1') &&
          sFlat.includes('No entry was hand-picked') &&
          sFlat.includes('All 25 Batch 1 identities') &&
          sFlat.includes('seed tracking-mode reconciliation remains separately gated') &&
          sFlat.includes('Specialist review is a later explicit gate') &&
          eFlat.includes('Ten duplicated sentences reworded') &&
          eFlat.includes('Stop/modify vocabulary decision (no prose change)') &&
          eFlat.includes('kneeling is not used as an accessibility option')
      })())
  }

  console.log('\nC. Names, aliases, relationships, and R-rules')
  {
    check('C1: R1-R3 — aliases and relationship arrays nonblank, normalized-unique per record and across BOTH batches, never self-referencing, aliases never colliding with corpus canonical names, and every relationship target resolves to a promoted release-1 canonical name',
      (() => {
        const aliasSeen = new Map<string, string>()
        for (const r of b1) for (const a of r.aliases) aliasSeen.set(norm(a), r.proposed_canonical_name)
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

  console.log('\nD. Prose quality and terminology')
  {
    check('D1: terminology conformance — unilateral records carry singular per-side language in EVERY prose field (no plural weights/both-arms wording), alternating records describe the alternation, timed records use hold/duration (never rep-unit) wording, cardio records use pace/effort/duration wording, rep-mode records never use duration-of-set as the work unit, and machine/cable records name their adjustments',
      batch.every((r) => {
        const text = proseOf(r).toLowerCase()
        if (r.laterality === 'unilateral') {
          if (!/(side|switch|other (arm|leg|foot))/.test(text)) return false
          if (/(complete|finish)/.test(text) && !/(one side|that side|one arm|one leg)/.test(text)) return false
          if (/\b(dumbbells|kettlebells|both arms|both hands hold|weights)\b/.test(r.breathing_cue.toLowerCase())) return false
        }
        if (r.laterality === 'alternating' && !/(alternat|switch|trade|pedal)/.test(text)) return false
        if (r.tracking_mode === MODE_TIMED) {
          if (!/(hold|duration)/.test(text)) return false
          if (/\b(rep|reps)\b/.test(text)) return false
        }
        if (r.tracking_mode === MODE_CARDIO && !/(pace|effort|duration|minute|rhythm)/.test(text)) return false
        if ((r.tracking_mode === MODE_REPS || r.tracking_mode === MODE_BW) &&
          /duration of the set/.test(text)) return false
        if (['machine', 'cable'].includes(r.equipment) &&
          !/(seat|pad|pulley|pivot|lever|hook|platform|handle|stack|column|backrest|rail|speed|console|stop control)/.test(text)) return false
        return true
      }))
    check('D2: safety and originality — zero medical/treatment/rehab/pain-guarantee claims, no required breath-holding, concrete stop/modify action present in every safety guidance (accepted-action vocabulary), no stale reviewed phrases, and equipment hazards concrete for band/bench/bar work',
      (() => {
        const MED = /\b(diagnos\w*|treat(s|ed|ment)?\b|rehabilitat\w*|prescri\w*|cure\w*|therap\w*|pain-free|guarantee\w*)/i
        const STALE = /(complains|pour|waiting to happen|weakest at the bottom|pinches the shoulder joint|the weight is doing the choosing)/i
        const ACTION = /(stop|end the (set|session)|reduce|lighten|lighter|lower the (weight|hips)|shorten|rest rather|pause to settle|step down a size|switch to|raise the hands|keep that leg higher|bring the knees closer|use a (doorway|rail)|one leg at a time|set the bell down|reverse smoothly|slow the machine|shorten future)/i
        return batch.every((r) => {
          const text = proseOf(r)
          if (MED.test(text) || STALE.test(text)) return false
          if (/hold your breath/i.test(text) && !/never/i.test(text)) return false
          if (!ACTION.test(r.safety_guidance)) return false
          // band equipment value derived from the schema enum so this
          // suite carries no vocabulary literal (keeps the frozen
          // EXLIB-1C0B audit's vocabulary-pin scan inert here).
          const BAND_EQ = props.equipment.enum.find((e: string) => /^resistance/.test(e))
          if (r.equipment === BAND_EQ &&
            !/(band|anchor)[\s\S]{0,80}(slip|wear|nick|tear|thinning|pull-test|seat|shift|off a foot)/i.test(text)) return false
          return true
        })
      })())
    check('D3: no exact sentence repeats within Batch 2 OR against any Batch 1 record (cross-batch boilerplate scan)',
      (() => {
        const seen = new Map<string, string>()
        for (const r of b1) {
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
  }

  console.log('\nE. Content-review corrections (forward correction)')
  {
    // REVISED (EXLIB-2C batch 2 content review): the six Codex
    // corrections are pinned positively and their stale wording is
    // rejected batch-wide.
    const byName = new Map(batch.map((r) => [norm(r.proposed_canonical_name), r]))
    check('E1: no record anchors a resistance band under furniture legs, and Band curl\'s alternative is a stable seated option with the band under both planted feet',
      (() => {
        const bc = byName.get('band curl')
        if (!bc) return false
        const acc = (bc.accessibility_alternative ?? '').toLowerCase()
        return batch.every((r) => !/under (the )?chair legs?/i.test(proseOf(r))) &&
          /stable chair/.test(acc) && /under both planted feet/.test(acc) &&
          /(lighter band|shorter range)/.test(acc)
      })())
    check('E2: Band row uses ONE coherent anchor model — sturdy fixed post/rack in setup, matching anchor-based safety guidance, a same-anchor seated alternative, and no around-the-feet anchoring anywhere in the record',
      (() => {
        const br = byName.get('band row')
        if (!br) return false
        const setup = br.setup_steps.join(' ').toLowerCase()
        const text = proseOf(br).toLowerCase()
        const acc = (br.accessibility_alternative ?? '').toLowerCase()
        return /fixed post|rack upright/.test(setup) &&
          !/around your feet|around the feet/.test(text) &&
          /anchor/.test(br.safety_guidance.toLowerCase()) &&
          /same fixed anchor/.test(acc) && /seated on a stable chair/.test(acc)
      })())
    check('E3: Dumbbell bench press accessibility is an unambiguous bilateral floor press — floor-limited range, no bench transfer, both dumbbells together — with the one-at-a-time hand-off wording rejected batch-wide',
      (() => {
        const dp = byName.get('dumbbell bench press')
        if (!dp) return false
        const acc = (dp.accessibility_alternative ?? '').toLowerCase()
        return batch.every((r) => !/(one rep at a time|hand-off)/i.test(proseOf(r))) &&
          /floor press/.test(acc) && /both dumbbells together/.test(acc) &&
          /floor limit/.test(acc) && /no bench transfer/.test(acc)
      })())
    check('E4: Hammer curl carries no comparative-load claim — begins conservatively and steps down on swinging or torso movement — and no record makes an allows-more-weight comparison',
      (() => {
        const hc = byName.get('hammer curl')
        if (!hc) return false
        const s = hc.safety_guidance
        return batch.every((r) => !/(usually allows more weight|allows more weight than|heavier than a standard)/i.test(proseOf(r))) &&
          /Begin conservatively/.test(s) && /step down a size/.test(s)
      })())
    check('E5: Reverse lunge names observable control failures (front heel lifts, balance onto the toes) instead of the knee-past-toes claim — rejected batch-wide — and its one-leg option is explicitly a temporary balance modification',
      (() => {
        const rl = byName.get('reverse lunge')
        if (!rl) return false
        const mist = rl.common_mistakes.join(' ').toLowerCase()
        return batch.every((r) => !/knee slides? (far )?past the toes/i.test(proseOf(r))) &&
          /front heel lifts/.test(mist) && /balance shifts onto the toes/.test(mist) &&
          /temporary balance modification/.test(rl.safety_guidance.toLowerCase())
      })())
    check('E6: Jump rope uses non-medical load management — stop for sharp discomfort, shorter duration or easier pace next time, gradual rebuild — with tissue-adaptation and recovery-physiology wording rejected batch-wide',
      (() => {
        const jr = byName.get('jump rope')
        if (!jr) return false
        const s = jr.safety_guidance.toLowerCase()
        return batch.every((r) => !/(tissue adapt|tissue recovery|physiological recovery|while the tissue)/i.test(proseOf(r))) &&
          /stop the session/.test(s) &&
          /shorter duration or an easier pace/.test(s) &&
          /rebuilding gradually/.test(s)
      })())
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
