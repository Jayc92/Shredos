// EXLIB-2C Release-1 Batch 1 verifier — authored content (PENDING
// REVIEW; loading prohibited).
//
// Proves: the source baseline and exact phase inventory; all 25
// records parse and validate against the promoted authoring schema;
// the selection is exactly the deterministic 14 seed-compatible + 11
// coverage additions (algorithm re-run, not trusted); every record
// matches its stable inventory metadata; no Plank and no weight_time;
// pending review carries zero evidence; import_eligible is literal
// false; publication state is absent; names/aliases/relationships are
// normalized-unique, resolved, and self-reference-free (R1-R8); prose
// is structurally complete, exercise-specific, terminology-conformant,
// free of copied-attribution and medical/treatment/rehab claims, and
// free of repeated boilerplate; the promoted design artifacts remain
// byte-identical; migration 026 is absent; product/schema/API/UI/
// dependency/configuration files are unchanged; the ledger and legacy
// eligibility are unchanged. Performs NO hosted contact.
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

const CONTENT = 'docs/exlib2c-release1-batch01-content.jsonl'
const SELECTION = 'docs/exlib2c-release1-batch01-selection.md'
const STYLE = 'docs/exlib2c-release1-batch01-style-standard.md'
const VERIFIER = 'scripts/verify-exlib2c-batch01.ts'
const DESIGN_VERIFIER = 'scripts/verify-exlib2a2b.ts'
const PHASE_NEW = [CONTENT, SELECTION, STYLE, VERIFIER].sort()
const PHASE_ALL = [...PHASE_NEW, DESIGN_VERIFIER].sort()
const DESIGN_TIP = '653c1e91a403a8061af34fce7dabfa8cb710a542'

const [MODE_REPS, MODE_BW, MODE_CARDIO, MODE_TIMED] = TRACKING_MODES

const batch = parseJsonl(CONTENT)
const inv = parseJsonl('docs/exlib2b-release1-inventory.jsonl')
const invByName = new Map(inv.map((r) => [r.proposed_canonical_name, r]))
const corpusNorm = new Set(inv.map((r) => r.normalized_name))
const schema = JSON.parse(read('docs/exlib2c-authoring-schema.json'))
const props = schema.properties
const selDoc = read(SELECTION)
const styleDoc = read(STYLE)

const proseOf = (r: any): string => [
  ...r.setup_steps, ...r.execution_steps, ...r.common_mistakes,
  r.breathing_cue, r.safety_guidance, r.equipment_setup,
  r.accessibility_alternative ?? '',
].join(' ')

async function main(): Promise<void> {
  console.log('EXLIB-2C Batch 1 verification (authored content, pending review)')

  console.log('\nA. Baseline and phase boundary')
  {
    check('A1: promoted design artifacts remain byte-identical (record, matrix, inventory, authoring schema) and all prior protected EXLIB artifacts hold',
      sha256('docs/exlib2a-catalog-architecture-record.md') === 'de825ddf18260a877651e426c8436709257c9100e3dfcbd994e3b9e2496191d8' &&
      sha256('docs/exlib2b-release1-coverage-matrix.md') === 'c32b7b9e9d3aafab39a9a6d77db09349dd604457274767fe4c880c6bf1fb2fb0' &&
      sha256('docs/exlib2b-release1-inventory.jsonl') === 'd349110f22700a822eb427fc1dcce3e6dbcfd264b6d48ed84936b07b1ca256f5' &&
      sha256('docs/exlib2c-authoring-schema.json') === 'dddb872c7725c591e6d056e0dc73167d3c822f6245ebd2c759a045fecbd43c6e' &&
      sha256('supabase/migrations/025_exlib_equipment_vocabulary_support.sql') === 'fbda16f4d25cacd1715b199050506a4da15896355d96700876b76c68826d304c' &&
      sha256('docs/exlib1a-discovery-manifest.jsonl') === '336cd4253f747cdb3ba73ffa2af5a63e255c7c87cc452d4c43ed59a654673dfa' &&
      sha256('docs/exlib1b1-review-ledger.jsonl') === 'aa4fe77c0c633510661eede94b40e9bae4aca90a7d8c2794abde92c83c6f7b7b')
    // RETARGET (EXLIB-2C batch 2): the BATCH 1 milestone's range
    // claim is anchored to its own promoted tip (064a131...), not to
    // a moving HEAD, so later authoring batches building on the
    // promoted Batch 1 can never dilute or break this historical
    // claim. HEAD must still descend from that tip once it exists.
    check('A2: planning-only boundary — migration 026 absent, migrations exactly 001-025, zero weight_time in src, no importer artifacts, and the BATCH 1 range (design tip..batch 1 tip) touches ONLY this phase\'s five paths',
      (() => {
        const files = readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).sort()
        if (files.length !== 25 || files.some((f) => f.startsWith('026'))) return false
        if (execSync("grep -rl 'weight_time' src/ || true", { encoding: 'utf8' }).trim() !== '') return false
        if (existsSync('scripts/exlib1c-import.ts') || existsSync('src/lib/catalog-import.ts')) return false
        const BATCH1_TIP = '064a131d88d4948a7aaaf9d77c9fa6565a9b000b'
        const inHistory = (() => {
          try {
            execSync(`git cat-file -e ${BATCH1_TIP}^{commit}`, { stdio: 'pipe' })
            return true
          } catch { return false }
        })()
        if (!inHistory) {
          const range = execSync(`git diff --name-only ${DESIGN_TIP}..HEAD`, { encoding: 'utf8' })
            .split('\n').filter(Boolean).sort()
          return range.length === 0 ||
            JSON.stringify(range) === JSON.stringify(PHASE_ALL)
        }
        execSync(`git merge-base --is-ancestor ${BATCH1_TIP} HEAD`)
        const range = execSync(`git diff --name-only ${DESIGN_TIP}..${BATCH1_TIP}`, { encoding: 'utf8' })
          .split('\n').filter(Boolean).sort()
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
    check(`G1: lifecycle-safe phase boundary — exact five-path inventory (four new + the retargeted design verifier), nothing staged`,
      (() => {
        try {
          const inHead = (() => {
            try { execSync(`git cat-file -e HEAD:${CONTENT}`, { stdio: 'pipe' }); return true } catch { return false }
          })()
          if (!inHead) {
            const entries = execSync('git status --porcelain', { encoding: 'utf8' })
              .split('\n').filter(Boolean).map((l) => l.trim()).sort()
            const expected = [...PHASE_NEW.map((f) => `?? ${f}`), `M ${DESIGN_VERIFIER}`].sort()
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
          execSync(`git merge-base --is-ancestor ${DESIGN_TIP} ${phase}`)
          const range = execSync(`git diff --name-only ${phase}^..${phase}`, { encoding: 'utf8' })
            .split('\n').filter(Boolean).sort()
          return JSON.stringify(range) === JSON.stringify(PHASE_ALL)
        } catch { return false }
      })())
  }

  console.log('\nB. Batch structure and selection')
  {
    check('B1: exactly 25 records, every one schema-valid — required/allowed fields, enum vocabularies, string/array bounds, clean pending review, import_eligible literal false, original provenance with no source fields, no deferred entries, no publication state',
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
          const proseOk = lens(r.setup_steps, 1, 5) && lens(r.execution_steps, 2, 6) &&
            lens(r.common_mistakes, 1, 4) &&
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
          const noPub = !JSON.stringify(Object.keys(r)).includes('publication')
          return keysOk && enumsOk && targetsOk && proseOk && reviewOk &&
            flagsOk && provOk && noPub && nameRe.test(r.proposed_canonical_name)
        })
      })())
    check('B2: the selection is EXACTLY the deterministic 14 seed-link-compatible base + 11 greedy coverage additions (algorithm re-run against the promoted inventory, weights 3/2/1 + beginner 2 + home/minimal 1, alphabetical tie-break)',
      (() => {
        const release = inv.filter((r) => !r.deferred)
        const base = release.filter((r) => r.seed_link_compatible === true)
        if (base.length !== 14) return false
        const sel = [...base]
        let pool = release.filter((r) => r.seed_link_compatible !== true && r.normalized_name !== 'plank')
        for (let i = 0; i < 11; i += 1) {
          const pm = new Set(sel.map((r) => r.primary_muscle))
          const pat = new Set(sel.map((r) => r.movement_pattern))
          const eq = new Set(sel.map((r) => r.equipment))
          const score = (r: any): number =>
            (pm.has(r.primary_muscle) ? 0 : 3) + (pat.has(r.movement_pattern) ? 0 : 2) +
            (eq.has(r.equipment) ? 0 : 1) + (r.difficulty === 'beginner' ? 2 : 0) +
            (['minimal', 'home_gym'].includes(r.availability) ? 1 : 0)
          pool = pool.sort((a, b) => score(b) - score(a) ||
            (a.normalized_name < b.normalized_name ? -1 : 1))
          sel.push(pool[0])
          pool = pool.slice(1)
        }
        const expected = sel.map((r) => r.proposed_canonical_name).sort()
        const actual = batch.map((r) => r.proposed_canonical_name).sort()
        return JSON.stringify(expected) === JSON.stringify(actual)
      })())
    check('B3: every batch record matches its stable promoted-inventory metadata exactly (muscles, targets, equipment, tracking, laterality, pattern, role, difficulty, availability)',
      batch.every((r) => {
        const m = invByName.get(r.proposed_canonical_name)
        return !!m &&
          ['primary_muscle', 'equipment', 'tracking_mode', 'laterality', 'movement_pattern',
            'training_role', 'difficulty', 'availability'].every((f) => r[f] === m[f]) &&
          JSON.stringify(r.muscle_targets) === JSON.stringify(m.muscle_targets)
      }))
    check('B4: no Plank, no weight_time, and batch normalized names/identities are unique',
      (() => {
        const norms = batch.map((r) => norm(r.proposed_canonical_name))
        return !norms.includes('plank') &&
          batch.every((r) => r.tracking_mode !== 'weight_time') &&
          new Set(norms).size === 25
      })())
    check('B5: the selection record documents the deterministic procedure, exclusions, editorial corrections, and pending/no-loading posture; the style standard pins voice, side wording, mode wording, Smith rule, breathing, and safety boundaries',
      (() => {
        const sFlat = selDoc.replace(/\s+/g, ' ')
        const stFlat = styleDoc.replace(/\s+/g, ' ')
        const m = selDoc.match(/```json\n([\s\S]*?)\n```/)
        if (!m) return false
        const mach = JSON.parse(m[1])
        const base = inv.filter((r) => r.seed_link_compatible === true)
          .map((r) => r.proposed_canonical_name).sort((a, b) => a.toLowerCase() < b.toLowerCase() ? -1 : 1)
        const batchNames = batch.map((r) => r.proposed_canonical_name)
        const adds = batchNames.filter((n) => !base.includes(n)).sort((a, b) => a.toLowerCase() < b.toLowerCase() ? -1 : 1)
        return mach.batch_size === 25 &&
          JSON.stringify(mach.seed_compatible_base) === JSON.stringify(base) &&
          JSON.stringify(mach.coverage_additions) === JSON.stringify(adds) &&
          mach.excluded_plank === true && mach.excluded_weight_time_count === 8 &&
          mach.selection_weights.new_primary_muscle === 3 &&
          mach.selection_weights.new_movement_pattern === 2 &&
          mach.selection_weights.new_equipment === 1 &&
          sFlat.includes('No entry was hand-picked') &&
          sFlat.includes('its seed reconciliation requires the separately reviewed correction') &&
          sFlat.includes('Corrections applied') &&
          sFlat.includes('Cat-cow') && sFlat.includes('Reverse wrist curl') &&
          sFlat.includes('Specialist review is a later explicit gate') &&
          stFlat.includes('Second person, imperative mood') &&
          stFlat.includes('complete the set on one side, then match the reps or duration on the other side') &&
          stFlat.includes('next available increment/setting') &&
          stFlat.includes('Prolonged breath-holding is never required or encouraged') &&
          stFlat.includes('diagnosis, treatment or rehabilitation prescriptions')
      })())
  }

  console.log('\nC. Names, aliases, relationships, and R-rules')
  {
    check('C1: R1-R3 — aliases and relationship arrays are nonblank and normalized-unique per record, never self-referencing, never colliding with corpus canonical names (aliases), and every relationship target resolves to a promoted release-1 canonical name',
      (() => {
        const aliasSeen = new Map<string, string>()
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
                if (aliasSeen.has(a) && aliasSeen.get(a) !== self) return false
                aliasSeen.set(a, self)
                return true
              })
            }
            return norms.every((t) => corpusNorm.has(t))
          })
        })
      })())
    check('C2: R5-R8 — no weight_time record anywhere in the batch, import_eligible is the literal false on all 25, zero copied-attribution markers in prose, and original provenance carries no source fields',
      batch.every((r) => r.tracking_mode !== 'weight_time') &&
      batch.every((r) => r.import_eligible === false) &&
      batch.every((r) => !/(according to|adapted from|source:|courtesy|credit(ed)? to|strengthlog)/i.test(proseOf(r))) &&
      batch.every((r) => r.provenance === 'forgefitos_original' &&
        !('source_url' in r) && !('source_page' in r) && !('retrieved_at' in r)))
  }

  console.log('\nD. Prose quality and terminology')
  {
    check('D1: structural completeness beyond schema minimums — at least 3 setup steps or a documented bodyweight-simple setup, at least 3 execution steps, and at least 3 common mistakes on every record',
      batch.every((r) => r.setup_steps.length >= 3 && r.execution_steps.length >= 3 &&
        r.common_mistakes.length >= 3))
    check('D2: terminology conformance — unilateral records carry per-side language, alternating records describe the alternation, timed records use hold/duration (never rep-unit) wording, cardio records use pace/effort/duration wording, rep-mode records never use duration-of-set as the work unit, and machine/cable records name their adjustments',
      batch.every((r) => {
        const text = proseOf(r).toLowerCase()
        if (r.laterality === 'unilateral' && !/(side|switch|other (arm|leg|foot))/.test(text)) return false
        if (r.laterality === 'alternating' && !/(alternat|switch)/.test(text)) return false
        if (r.tracking_mode === MODE_TIMED) {
          if (!/(hold|duration)/.test(text)) return false
          if (/\b(rep|reps)\b/.test(text)) return false
        }
        if (r.tracking_mode === MODE_CARDIO && !/(pace|effort|duration|minute)/.test(text)) return false
        if ((r.tracking_mode === MODE_REPS || r.tracking_mode === MODE_BW) &&
          /duration of the set/.test(text)) return false
        if (['machine', 'cable'].includes(r.equipment) &&
          !/(seat|pad|pulley|pivot|lever|hook|platform|handle|stack|column|backrest)/.test(text)) return false
        return true
      }))
    check('D3: safety and originality — zero medical/treatment/rehabilitation/pain-guarantee claims, no required breath-holding, stop/modify language present in every safety guidance or mistakes section, the Smith rule applies to any smith entries, and no exact sentence repeats across records (boilerplate scan)',
      (() => {
        const MED = /\b(diagnos\w*|treat(s|ed|ment)?\b|rehabilitat\w*|prescri\w*|cure\w*|therap\w*|pain-free|guarantee\w*)/i
        const seen = new Map<string, string>()
        return batch.every((r) => {
          const text = proseOf(r)
          if (MED.test(text)) return false
          if (/hold your breath/i.test(text) && !/never/i.test(text)) return false
          const safety = (r.safety_guidance + ' ' + r.common_mistakes.join(' ')).toLowerCase()
          if (!/(stop|lower the weight|reduce the (weight|load)|lighten|shrink(ing)? the range|come out of|rack it|slow(ing)? down|step down|move to flat ground|end(ing)? the session)/.test(safety)) return false
          if (r.equipment === 'smith_machine' &&
            (!text.includes('next available increment/setting') || /\+\s?(5|2\.5)\s?(lb|kg)/i.test(text))) return false
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
    // REVISED (EXLIB-2C batch 1 content review): the unilateral
    // contract is pinned positively AND negatively; the lateral-raise
    // pouring cue and every stale reviewed phrase are rejected;
    // neutral wrist/thumb guidance is required.
    check('E1: unilateral contract — Biceps curl and Lateral raise default to one arm at a time with explicit complete-one-side / switch-sides / match-load-and-reps language, and NO unilateral record offers simultaneous two-arm/two-leg execution as an equal default',
      (() => {
        const byName = new Map(batch.map((r) => [norm(r.proposed_canonical_name), r]))
        const pinned = ['biceps curl', 'lateral raise'].every((n) => {
          const r = byName.get(n)
          if (!r) return false
          const ex = r.execution_steps.join(' ').toLowerCase()
          const setup = r.setup_steps.join(' ').toLowerCase()
          return /(complete|finish) the (full )?set on one side/.test(ex) &&
            /switch sides/.test(ex) &&
            /match(ing)? the load and reps/.test(ex) &&
            /(one hand|one arm)/.test(setup + ' ' + ex)
        })
        const noBilateralDefault = batch.filter((r) => r.laterality === 'unilateral')
          .every((r) => {
            const text = (r.setup_steps.join(' ') + ' ' + r.execution_steps.join(' ')).toLowerCase()
            return !/(dumbbells? in each hand|in each hand|both arms (together|at once)|both dumbbells|or work (one|both) arms?|one arm at a time or both)/.test(text)
          })
        return pinned && noBilateralDefault
      })())
    // REVISED (EXLIB-2C batch 1 breathing-cue correction): the
    // Lateral raise breathing cue is pinned as SINGULAR — one
    // dumbbell, one side — and the stale bilateral sentence (or any
    // plural weights/sides regression in the cue) fails.
    check('E2: Lateral raise technical wording — no pouring cue anywhere in the batch, neutral wrist and thumb guidance present, control/comfort stop language instead of an absolute above-shoulder impingement claim, and a SINGULAR one-dumbbell breathing cue (plural weights/sides cue wording rejected)',
      (() => {
        const lr = batch.find((r) => norm(r.proposed_canonical_name) === 'lateral raise')
        if (!lr) return false
        const text = proseOf(lr).toLowerCase()
        const cue = String(lr.breathing_cue)
        return batch.every((r) => !/pour/i.test(proseOf(r))) &&
          /wrist neutral|neutral wrist/.test(text) &&
          /thumb/.test(text) &&
          /highest (point you can control comfortably|controlled)/.test(text) &&
          !/pinch(es)? the shoulder joint/.test(text) &&
          cue === 'Exhale as you raise the dumbbell; inhale as you lower it back to your side.' &&
          !/raise the weights/i.test(cue) &&
          !/lower them/i.test(cue) &&
          !/your sides/i.test(cue) &&
          !/\b(weights|dumbbells|them|sides)\b/i.test(cue)
      })())
    check('E3: stale reviewed phrases are absent from every record — complaining/personified body parts, causal injury claims, colorful warnings, unsupported strength-curve and difficulty claims, and the kneeling Pallof regression',
      (() => {
        const STALE = [
          'if either hip complains',
          'the weight is doing the choosing',
          'this is an easy mobility drill',
          'which strains the shoulders',
          'long exhales help the hip release',
          'which cranks the shoulders',
          'if the front of the knee complains',
          'inner-thigh muscles strain easily',
          'overloaded wrist extension quickly leads to sore elbows',
          'a rolled ankle waiting to happen',
          'weakest at the bottom',
          'kneel on both knees closer to the anchor',
          'pinches the shoulder joint',
        ]
        const all = batch.map((r) => proseOf(r).toLowerCase()).join(' \n ')
        return STALE.every((p) => !all.includes(p))
      })())
    check('E4: corrected accessibility — Band Pallof press regression is seated with lighter band/closer anchor and matched sides; Biceps curl regression is a supported seated unilateral option; the style standard pins the unilateral-default rule and the selection record logs corrections 4-7',
      (() => {
        const bp = batch.find((r) => norm(r.proposed_canonical_name) === 'band pallof press')
        const bc = batch.find((r) => norm(r.proposed_canonical_name) === 'biceps curl')
        const st = styleDoc.replace(/\s+/g, ' ')
        const sd = selDoc.replace(/\s+/g, ' ')
        return !!bp && !!bc &&
          /sit on a stable chair or bench/i.test(bp.accessibility_alternative ?? '') &&
          /lighter band/i.test(bp.accessibility_alternative ?? '') &&
          /seated/i.test(bc.accessibility_alternative ?? '') &&
          /one arm at a time/i.test(bc.accessibility_alternative ?? '') &&
          st.includes('simultaneous two-arm/two-leg execution must not be offered as an equal default') &&
          sd.includes('Biceps curl and Lateral raise rewritten to the unilateral') &&
          sd.includes('Lateral raise technical correction') &&
          sd.includes('Accessibility corrections') &&
          sd.includes('Ten-phrase professional wording sweep')
      })())
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
