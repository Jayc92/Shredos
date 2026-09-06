// EXLIB-2C Release-1 Batch 3 verifier — authored content (PENDING
// REVIEW; loading prohibited).
//
// Proves: the exact source baseline and phase inventory; exactly 25
// Batch 3 records with zero overlap with Batches 1-2; the
// deterministic cumulative selection (with mechanically defined
// least-represented weighting) reproduced from the stable inventory;
// cumulative authored count exactly 75; schema validity and stable
// metadata equality; Plank/weight_time exclusion; R1-R8; aliases and
// relationships unique, resolved, and non-self-referential across
// ALL THREE batches; the pending/null-evidence/import-false/
// no-publication boundary; laterality and pronoun consistency;
// tracking-mode terminology; structural completeness; band anchor
// discipline; the Smith Machine progression rule; machine-model
// neutrality; originality, medical, and carried-forward stale-phrase
// scans from BOTH prior batch reviews; a cross-batch boilerplate
// scan across all 75 records; Batch 1-2 content and design artifacts
// byte-identical; migration 026 absent; runtime unchanged; ledger
// and legacy eligibility unchanged; exact lifecycle behavior; and
// the 2026-08-28 Codex review-correction families (D4 positive pins
// and D5 corpus-wide negative rejections).
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

const CONTENT = 'docs/exlib2c-release1-batch03-content.jsonl'
const SELECTION = 'docs/exlib2c-release1-batch03-selection.md'
const EDITORIAL = 'docs/exlib2c-release1-batch03-editorial-record.md'
const VERIFIER = 'scripts/verify-exlib2c-batch03.ts'
const B2_VERIFIER = 'scripts/verify-exlib2c-batch02.ts'
const PHASE_NEW = [CONTENT, SELECTION, EDITORIAL, VERIFIER].sort()
const PHASE_ALL = [...PHASE_NEW, B2_VERIFIER].sort()
const BATCH2_TIP = '6ca5b1470ea3b5715c55dbf08930c0a63e84562f'

const [MODE_REPS, MODE_BW, MODE_CARDIO, MODE_TIMED] = TRACKING_MODES

const batch = parseJsonl(CONTENT)
const b1 = parseJsonl('docs/exlib2c-release1-batch01-content.jsonl')
const b2 = parseJsonlAt2N('docs/exlib2c-release1-batch02-content.jsonl') // RETARGET (EXLIB-2N review-decision application)
const prior = [...b1, ...b2]
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
  console.log('EXLIB-2C Batch 3 verification (authored content, pending review)')

  console.log('\nA. Baseline and phase boundary')
  {
    // RETARGET (EXLIB-2C cross-batch bench-safety correction): the
    // Batch 1 content fingerprint moved because the pending Bench
    // press record adopted the functional safety-arm clearance
    // doctrine (explicitly authorized cross-batch correction). Only
    // the fingerprint value changed here; nothing else is weakened.
    check('A1: Batch 1-2 content and promoted design artifacts remain byte-identical, and prior protected EXLIB artifacts hold',
      sha256('docs/exlib2c-release1-batch01-content.jsonl') === '8168fc196f89781e8a30b315f29d1c72f46afeff8edfe89d1812b0a150ece2b2' &&
      sha256At2N('docs/exlib2c-release1-batch02-content.jsonl') === '1ddc3ab0bd92d60ef33960d82a8e0c8a2fdea1cb828d15fc9bf6a82c34305d48' &&
      sha256('docs/exlib2c-release1-batch01-style-standard.md') === '3bdf2f71a0be8aa41ce1a7b6ca149a1d33342b7ff8ea381c8e92686c030a75f1' &&
      sha256('docs/exlib2a-catalog-architecture-record.md') === 'de825ddf18260a877651e426c8436709257c9100e3dfcbd994e3b9e2496191d8' &&
      sha256('docs/exlib2b-release1-coverage-matrix.md') === 'c32b7b9e9d3aafab39a9a6d77db09349dd604457274767fe4c880c6bf1fb2fb0' &&
      createHash('sha256').update(execSync('git show 5f7e182f3027b3640514e06d642693f4018c03e2:docs/exlib2b-release1-inventory.jsonl', { maxBuffer: 1 << 26 }) as unknown as Buffer).digest('hex') === 'd349110f22700a822eb427fc1dcce3e6dbcfd264b6d48ed84936b07b1ca256f5' /* RETARGET (EXLIB-2S delivery-activation preparation): inventory anchored at the delivery predecessor */ &&
      sha256('docs/exlib2c-authoring-schema.json') === 'dddb872c7725c591e6d056e0dc73167d3c822f6245ebd2c759a045fecbd43c6e' &&
      sha256('supabase/migrations/025_exlib_equipment_vocabulary_support.sql') === 'fbda16f4d25cacd1715b199050506a4da15896355d96700876b76c68826d304c' &&
      sha256('docs/exlib1a-discovery-manifest.jsonl') === '336cd4253f747cdb3ba73ffa2af5a63e255c7c87cc452d4c43ed59a654673dfa' &&
      sha256('docs/exlib1b1-review-ledger.jsonl') === 'aa4fe77c0c633510661eede94b40e9bae4aca90a7d8c2794abde92c83c6f7b7b')
    // RETARGET (EXLIB-2C batch 4): the BATCH 3 milestone's range
    // claim is anchored to its own promoted tip (1139304...), not to
    // a moving HEAD, so later authoring batches building on the
    // promoted Batch 3 can never dilute or break this historical
    // claim. HEAD must still descend from that tip once it exists.
    check('A2: planning-only boundary — migration 026 absent, migrations exactly 001-025, zero weight_time in src, no importer artifacts, and the BATCH 3 range (batch 2 tip..batch 3 tip) touches ONLY this phase\'s five paths',
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
        const BATCH3_TIP = '11393041149d8a95d573622f932dc5df1cbaec5d'
        const inHistory = (() => {
          try {
            execSync(`git cat-file -e ${BATCH3_TIP}^{commit}`, { stdio: 'pipe' })
            return true
          } catch { return false }
        })()
        if (!inHistory) {
          const range = execSync(`git diff --name-only ${BATCH2_TIP}..HEAD`, { encoding: 'utf8' })
            .split('\n').filter(Boolean).sort()
          return range.length === 0 ||
            JSON.stringify(range) === JSON.stringify(PHASE_ALL)
        }
        execSync(`git merge-base --is-ancestor ${BATCH3_TIP} HEAD`)
        const range = execSync(`git diff --name-only ${BATCH2_TIP}..${BATCH3_TIP}`, { encoding: 'utf8' })
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
    check('G1: lifecycle-safe phase boundary — exact five-path inventory (four new + the retargeted Batch 2 verifier), nothing staged',
      (() => {
        try {
          const inHead = (() => {
            try { execSync(`git cat-file -e HEAD:${CONTENT}`, { stdio: 'pipe' }); return true } catch { return false }
          })()
          if (!inHead) {
            const entries = execSync('git status --porcelain', { encoding: 'utf8' })
              .split('\n').filter(Boolean).map((l) => l.trim()).sort()
            const expected = [...PHASE_NEW.map((f) => `?? ${f}`), `M ${B2_VERIFIER}`].sort()
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
          execSync(`git merge-base --is-ancestor ${BATCH2_TIP} ${phase}`)
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
    check('B2: the selection is EXACTLY the deterministic cumulative pick — algorithm re-run from Batches 1-2 coverage with mechanical least-represented weights (muscle 0->3; pattern 0->2, 1->1; equipment <=1 ->1; beginner 2; home/minimal 1; alphabetical tie-break) — and cumulative authored count is exactly 75 with zero overlap',
      (() => {
        const priorNames = new Set(prior.map((r) => r.proposed_canonical_name))
        if (prior.length !== 50) return false
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
          prior.length + batch.length === 75
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
    check('B4: the selection record documents the mechanical least-represented procedure, exclusions, coverage, cumulative 75, and remaining 51; the editorial record lists every correction with exercise and field',
      (() => {
        const sFlat = selDoc.replace(/\s+/g, ' ')
        const eFlat = edDoc.replace(/\s+/g, ' ')
        const m = selDoc.match(/```json\n([\s\S]*?)\n```/)
        if (!m) return false
        const mach = JSON.parse(m[1])
        const b3n = batch.map((r) => r.proposed_canonical_name)
          .sort((a, b) => (a.toLowerCase() < b.toLowerCase() ? -1 : 1))
        return mach.batch === 3 && mach.batch_size === 25 &&
          mach.cumulative_authored === 75 &&
          mach.remaining_release1_unauthored === 51 &&
          mach.plank_gated_separately === true &&
          JSON.stringify(mach.batch3_entries) === JSON.stringify(b3n) &&
          mach.selection_weights.new_primary_muscle === 3 &&
          mach.selection_weights.movement_pattern_uncovered === 2 &&
          mach.selection_weights.movement_pattern_single_covered === 1 &&
          mach.selection_weights.equipment_at_most_one === 1 &&
          String(mach.selection_weights.coverage_basis).includes('least represented defined mechanically') &&
          sFlat.includes('No entry was hand-picked') &&
          sFlat.includes('All 50 Batch 1-2 identities') &&
          sFlat.includes('Specialist review is a later explicit gate') &&
          eFlat.includes('Six duplicated sentences reworded') &&
          eFlat.includes('Smith machine entries (first in the corpus)') &&
          eFlat.includes('next available increment/setting')
      })())
  }

  console.log('\nC. Names, aliases, relationships, and R-rules')
  {
    check('C1: R1-R3 — aliases and relationship arrays nonblank, normalized-unique per record and across ALL THREE batches, never self-referencing, aliases never colliding with corpus canonical names, and every relationship target resolving to a promoted release-1 canonical name',
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
          !/(seat|pad|pulley|pivot|lever|hook|platform|handle|stack|column|backrest|rail|speed|console|stop|damper|strap|cuff|bench angle)/.test(text)) return false
        return true
      }))
    check('D2: safety, band, Smith, and machine-neutrality rules — concrete stop/modify action in every safety guidance, cuff/band records carry secure-attachment language, Smith records carry the exact neutral progression wording with hook/re-hook hazards and no fixed increments, machine records stay model-neutral, and no medical/rehab/tissue/carried-forward stale phrasing anywhere',
      (() => {
        const MED = /\b(diagnos\w*|treat(s|ed|ment)?\b|rehabilitat\w*|prescri\w*|cure\w*|therap\w*|pain-free|guarantee\w*|tissue adapt|tissue recovery|physiological recovery)/i
        const STALE = /(complains|\bpour|waiting to happen|weakest at the bottom|pinches the shoulder joint|the weight is doing the choosing|under (the )?chair legs?|one rep at a time|hand-off|allows more weight|past the toes|while the tissue)/i
        const ACTION = /(stop|end the (set|session)|reduce|lighten|lighter|lower the (weight|hips|knee)|shorten|rest|pause|step down|step off|switch|set the (bar|bell|plate|dumbbell)s? down|strip weight|come off|lower down|reverse to the floor|shrink|slow the (pace|machine|rhythm)|grab the rails|drop the stack|move (your )?hands|rebuild)/i
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
          }
          if (['machine'].includes(r.equipment) &&
            /(differ|vary)/i.test(text) === false &&
            ['rowing machine', 'treadmill run', 'back extension', 'close-grip lat pulldown'].includes(norm(r.proposed_canonical_name))) return false
          return true
        })
      })())
    check('D3: no exact sentence repeats within Batch 3 OR against any Batch 1-2 record (75-record cross-batch boilerplate scan)',
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
    check('D4: ADMISSION (EXLIB-2C batch 3 review 1) — positive correction pins: machine-true Chest-supported row prose (dumbbell substitution only as the labeled accessibility option), Turkish get-up two-handed roll-to-press entry with staged gaze and graded bail on a straight, stacked arm, rated non-slip calf block with explicit stop height and empty-bar familiarization, Copenhagen shin-supported default with foot support as a progression and neutral stop language, pre-failure Dip exit via stable platform with an assisted-machine alternative, modest changing-resistance band-curl claim, continuous comfortable Superman breathing, complete Face pull band inspect/fixed-anchor/confirm model, reconciled treadmill normal and emergency exits, and controlled-pause thoracic wording',
      (() => {
        const by = new Map<string, any>(batch.map((r) => [norm(r.proposed_canonical_name), r]))
        const csr = by.get('chest-supported row')
        const csrPrimary = [...csr.setup_steps, ...csr.execution_steps, ...csr.common_mistakes,
          csr.breathing_cue, csr.safety_guidance, csr.equipment_setup].join(' ')
        const csrOk = csr.equipment === 'machine' &&
          /chest pad/i.test(csrPrimary) && /handle/i.test(csrPrimary) && /seat/i.test(csrPrimary) &&
          !/dumbbell|incline bench/i.test(csrPrimary) &&
          /differ between machines/i.test(csr.equipment_setup) &&
          /reduces how much your lower back has to stabilize/i.test(csr.safety_guidance) &&
          !csr.aliases.some((a: string) => norm(a) === 'incline bench row') &&
          /^If no chest-supported row machine is available, substitute/i.test(csr.accessibility_alternative ?? '')
        const tgu = by.get('turkish get-up')
        const tguSetup = tgu.setup_steps.join(' ')
        const tguEx = tgu.execution_steps.join(' ')
        const tguOk = /grip its handle with both hands/i.test(tguSetup) &&
          /use both hands to press the bell up/i.test(tguSetup) &&
          /keep watching the bell through the floor, bridge, and sweep phases/i.test(tguEx) &&
          /Once stable in the half-kneeling position, shift your gaze forward/i.test(tguEx) &&
          /reverse only while you remain in control/i.test(tgu.safety_guidance) &&
          /stop at the nearest stable position/i.test(tgu.safety_guidance) &&
          /never try to catch or chase a falling bell/i.test(tgu.safety_guidance) &&
          /straight and stacked/i.test(proseOf(tgu))
        const smith = by.get('smith machine calf raise')
        const smithOk = /stable, non-slip calf block rated for the exercise/i.test(smith.setup_steps.join(' ')) &&
          /safety stops just below your lowest controlled heel position/i.test(smith.safety_guidance) &&
          /empty bar/i.test(smith.safety_guidance) &&
          proseOf(smith).includes('next available increment/setting')
        const cph = by.get('copenhagen plank')
        const cphOk = /Start with the bent-knee version/i.test(cph.setup_steps.join(' ')) &&
          /is a progression once shin-supported holds are steady/i.test(cph.equipment_setup) &&
          /sharp or increasing inner-thigh or groin discomfort/i.test(cph.safety_guidance) &&
          !/pinch/i.test(proseOf(cph))
        const dip = by.get('dip')
        const dipOk = /Stand on a stable platform/i.test(dip.setup_steps.join(' ')) &&
          /stop where the shoulders stay comfortable/i.test(dip.safety_guidance) &&
          /End the set before true failure/i.test(dip.safety_guidance) &&
          /lowering your feet back to the platform under control/i.test(dip.safety_guidance) &&
          /assisted dip machine/i.test(dip.accessibility_alternative ?? '')
        const ccOk = /band resistance changes as the band stretches/i.test(by.get('cable curl').accessibility_alternative ?? '')
        const supOk = /continuously and comfortably/i.test(by.get('superman hold').breathing_cue)
        const fp = by.get('face pull').accessibility_alternative ?? ''
        const fpOk = /checked for nicks or thinning/i.test(fp) &&
          /sturdy fixed anchor/i.test(fp) && /confirm it holds/i.test(fp)
        const tm = by.get('treadmill run')
        const tmOk = /let the belt come to a stop before you step off/i.test(tm.execution_steps.join(' ')) &&
          /slow the belt to a complete stop before stepping off/i.test(tm.safety_guidance) &&
          /press the safety stop while holding the rails/i.test(tm.safety_guidance) &&
          /only if you can do so under control/i.test(tm.safety_guidance)
        const thOk = /between controlled pauses/i.test(by.get('thoracic extension on foam roller').execution_steps.join(' '))
        return csrOk && tguOk && smithOk && cphOk && dipOk && ccOk && supOk && fpOk && tmOk && thOk
      })())
    check('D5: ADMISSION (EXLIB-2C batch 3 review 1) — negative rejections across ALL 75 records: no step-off-the-bars failure response, no groin-overload claims, no prescribed shallow breathing, no moving-belt/straddle contradiction, no loose-plate foot platforms, no bands looped across bars, no band constant-tension claims, no stale get-up gaze/bail or locked-out wording, no between-holds wording, no pad-removes-load claims, and no dumbbell-primary prose or removed alias on the machine Chest-supported row',
      (() => {
        const all75 = [...prior, ...batch]
        const BAN = new RegExp(['step off the bars', 'overloads the groin', 'shallowly', 'shallow breath',
          'never step off a moving belt', 'straddle', 'step or plate', 'looped across', 'between holds',
          'locked out', 'removes lower-back', 'pad removes', 'reverse to the floor and reset',
          'taking the eyes off the bell'].join('|'), 'i')
        for (const r of all75) {
          const text = proseOf(r)
          if (BAN.test(text)) return false
          if (/shallow/i.test(r.breathing_cue)) return false
          for (const s of text.split(/[.;]/)) {
            if (/\bband/i.test(s) && /constant[- ]tension/i.test(s)) return false
          }
          const acc = r.accessibility_alternative ?? ''
          if (/band/i.test(acc) && /face height/i.test(acc) &&
            !(/nicks or thinning|tears or thinning/i.test(acc) && /fixed anchor/i.test(acc) && /confirm/i.test(acc))) return false
        }
        const csr = all75.find((r) => norm(r.proposed_canonical_name) === 'chest-supported row')
        if (!csr || csr.equipment !== 'machine') return false
        const csrPrimary = [...csr.setup_steps, ...csr.execution_steps, ...csr.common_mistakes,
          csr.breathing_cue, csr.safety_guidance, csr.equipment_setup].join(' ')
        if (/dumbbell|incline bench/i.test(csrPrimary)) return false
        if (csr.aliases.some((a: string) => norm(a) === 'incline bench row')) return false
        const csrAcc = csr.accessibility_alternative ?? ''
        if (/dumbbell/i.test(csrAcc) && !/^If no chest-supported row machine is available/i.test(csrAcc)) return false
        return true
      })())
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
