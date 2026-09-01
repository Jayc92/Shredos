// EXLIB-2G verifier — Plank content authoring and
// coordinated-activation design (LOCAL-ONLY; adjudicated resequencing
// after the fail-closed stop of the original seed-edit attempt).
//
// Proves: the exact source commit/tag and frozen EXLIB-2F evidence;
// the seed Plank UNCHANGED (bodyweight, old anatomy, byte-identical
// module); seed_link_compatible still false with the inventory
// byte-frozen; no runtime delivery wiring and no migration 027; the
// adjudication record carrying every accepted and rejected option,
// the discovered facts, the milestone order, and a staged-rollout
// state machine that covers rolling deployments, old clients,
// fail-closed behavior, and rollback; exactly ONE new Plank content
// record with the authoritative identity, timed mode, derived
// mobility type, and the exact two-entry anatomy, conforming to the
// promoted schema, R-rules, and style standard, still
// pending/evidence-null/import-ineligible/unpublished; the corpus,
// ledger, and eligibility artifacts untouched; the operator backup
// timestamp recorded as recovery evidence only; and the exact
// three-path phase inventory. Performs NO hosted contact.
//
// Fail-closed: any mismatch fails the suite.
import { execSync } from 'child_process'
import { createHash } from 'crypto'
import { existsSync, readFileSync, readdirSync } from 'fs'

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

const RECORD = 'docs/exlib2g-plank-content-activation-design.md'
const CONTENT = 'docs/exlib2g-plank-content.jsonl'
const VERIFIER = 'scripts/verify-exlib2g.ts'
const SOURCE_TIP = 'f17757a633ac9e06a244ff71cbcb3120096adb64'
const PHASE_NEW = [RECORD, CONTENT, VERIFIER].sort()

const rec = read(RECORD)
const recFlat = rec.replace(/\s+/g, ' ')
const inv = parseJsonl('docs/exlib2b-release1-inventory.jsonl')
const corpus: any[] = []
for (let i = 1; i <= 6; i += 1) corpus.push(...parseJsonl(`docs/exlib2c-release1-batch0${i}-content.jsonl`))
const plankRecs = existsSync(CONTENT) ? parseJsonl(CONTENT) : []
const p = plankRecs[0] ?? {}
const proseOf = (r: any): string => [
  ...(r.setup_steps ?? []), ...(r.execution_steps ?? []), ...(r.common_mistakes ?? []),
  r.breathing_cue ?? '', r.safety_guidance ?? '', r.equipment_setup ?? '',
  r.accessibility_alternative ?? ''].join(' ')

async function main(): Promise<void> {
  console.log('EXLIB-2G verification (Plank content + activation design; adjudicated resequencing)')

  console.log('\nA. Source posture and standing boundaries')
  {
    check('A1: exact source — the application-evidence tag object peels to the source tip (an ancestor of HEAD), migration 026 and the EXLIB-2F evidence stay byte-frozen, and every protected fingerprint holds',
      (() => {
        try {
          if (execSync('git rev-parse exlib2f-migration-026-application-evidence-stable^{}',
            { encoding: 'utf8' }).trim() !== SOURCE_TIP) return false
          execSync(`git merge-base --is-ancestor ${SOURCE_TIP} HEAD`, { stdio: 'pipe' })
        } catch { return false }
        return sha256('supabase/migrations/026_exlib_plank_seed_reconciliation.sql') === '620185b62c589c55fb30a237589589f46002a9d6c391b9ab936e07a6641cf4bc' &&
          sha256('docs/exlib2f-migration-026-application-record.md') === 'dc6e6188f013eb02ad2028339d0515ea180ab1016b119eb15ee523db83358b2a' &&
          sha256('scripts/verify-exlib2f-application.ts') === '2c603036ef420c1450e349cb381cb422f98ff50be0f022717a17e5ae070ca6e7' &&
          sha256('docs/exlib2e-migration-026-proposal.sql') === 'a6696066d178ced7e53bf81e7106cce64a87e2c73d9b342464d930a2fe3c2108' &&
          sha256('docs/exlib2d-plank-seed-reconciliation-record.md') === '3ea2aa1d279bfd7a099e2b33fe4dfdba565dbde5c37e780c338673684e9baf7c' &&
          sha256('docs/exlib2c-release1-batch01-content.jsonl') === '8168fc196f89781e8a30b315f29d1c72f46afeff8edfe89d1812b0a150ece2b2' &&
          sha256('docs/exlib2c-release1-batch02-content.jsonl') === '1ddc3ab0bd92d60ef33960d82a8e0c8a2fdea1cb828d15fc9bf6a82c34305d48' &&
          sha256('docs/exlib2c-release1-batch03-content.jsonl') === 'e4fca8b632c9c9af9b7c6eece660f2042b6a4c3ef613e14c278f95cf9fcab528' &&
          sha256('docs/exlib2c-release1-batch04-content.jsonl') === 'e7def375e9b9560863796bff90746dc6ff2b2f7c4bd7735a3d53fc2cc9750568' &&
          sha256('docs/exlib2c-release1-batch05-content.jsonl') === '404722f1211e45c3b89ac8a32cceb617b958388c034b797dd2bba009aa127e5d' &&
          sha256('docs/exlib2c-release1-batch06-content.jsonl') === 'ec0760be401bb1d4c479d340369d6b6b690acf57f2f7a0f7fbeeaa2cf40ab5d7' &&
          sha256('docs/exlib2b-release1-inventory.jsonl') === 'd349110f22700a822eb427fc1dcce3e6dbcfd264b6d48ed84936b07b1ca256f5' &&
          sha256('docs/exlib2c-authoring-schema.json') === 'dddb872c7725c591e6d056e0dc73167d3c822f6245ebd2c759a045fecbd43c6e' &&
          sha256('docs/exlib1b1-review-ledger.jsonl') === 'aa4fe77c0c633510661eede94b40e9bae4aca90a7d8c2794abde92c83c6f7b7b'
      })())
    check('A2: the current seed Plank is UNCHANGED — the seed module is byte-identical to the source tip, and the Plank entry still reads tracking_mode bodyweight with anatomy exactly {(obliques, secondary)}',
      (() => {
        const seedNow = readFileSync('src/lib/supabase/seed-exercises.ts')
        const seedTip = execSync(`git show ${SOURCE_TIP}:src/lib/supabase/seed-exercises.ts`, { encoding: 'buffer' as any }) as unknown as Buffer
        if (!seedNow.equals(seedTip)) return false
        const seed = seedNow.toString('utf8')
        const line = seed.split('\n').findIndex((l) => l.includes('name: "Plank"'))
        if (line < 0) return false
        const block = seed.split('\n').slice(line, line + 2).join('\n')
        return block.includes('tracking_mode: "bodyweight"') &&
          block.includes('muscle_targets: [{ muscle: "obliques", role: "secondary" }]') &&
          !block.includes('lower_back') && !block.includes('"timed"')
      })())
    check('A3: seed_link_compatible remains FALSE in the authoritative inventory, which is byte-frozen (so no other inventory identity changed either)',
      (() => {
        const plank = inv.filter((r: any) => r.proposed_canonical_name === 'Plank')
        if (plank.length !== 1 || plank[0].seed_link_compatible !== false) return false
        return sha256('docs/exlib2b-release1-inventory.jsonl') === 'd349110f22700a822eb427fc1dcce3e6dbcfd264b6d48ed84936b07b1ca256f5'
      })())
    check('A4: no runtime delivery wiring (zero src references to deliver_catalog_exercises), no migration 027, migrations exactly the applied 26, and the seeding call sites are unchanged',
      (() => {
        if (execSync("grep -rln 'deliver_catalog_exercises' src/ || true", { encoding: 'utf8' }).trim() !== '') return false
        const files = readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql'))
        if (files.length !== 26 || files.some((f) => f.startsWith('027'))) return false
        const callers = execSync("grep -rln 'seedExercisesIfNeeded' src/ || true", { encoding: 'utf8' })
          .split('\n').filter(Boolean).sort()
        return JSON.stringify(callers) === JSON.stringify([
          'src/app/(app)/workouts/exercises/page.tsx', 'src/app/(app)/workouts/page.tsx',
          'src/app/api/exercises/route.ts', 'src/lib/supabase/seed-exercises.ts'])
      })())
    check('A5: the adjudication record carries every accepted and rejected option verbatim, the discovered facts, and the adjudicated milestone order A-F',
      recFlat.includes('REJECT the early Plank seed edit') &&
      recFlat.includes('REJECT flipping seed_link_compatible now') &&
      recFlat.includes('REJECT amending migration 026 or creating migration 027') &&
      recFlat.includes('REJECT accepting the P5/two-Plank outcome') &&
      recFlat.includes('Preserve the current bodyweight pristine seed until the final coordinated delivery-activation release') &&
      recFlat.includes('Reorder the work so Plank content and activation architecture are prepared before any seed/runtime/hosted mutation') &&
      recFlat.includes('tracking_mode = bodyweight; anatomy = {(obliques, secondary)}') &&
      recFlat.includes('tracking_mode = timed') &&
      recFlat.includes('derived exercise_type = mobility') &&
      recFlat.includes('{(obliques, secondary), (lower_back, tertiary)}') &&
      recFlat.includes('INTENTIONALLY recognizes only the OLD pristine bodyweight seed shape') &&
      recFlat.includes('unlinked timed seed rows') &&
      recFlat.includes('seed_link_compatible cannot truthfully become true in that state') &&
      ['A. Plank instructional content', 'B. Catalog snapshot/loading package',
        'C. Runtime delivery activation designed', 'D. Hosted catalog loading/sealing',
        'E. Final coordinated activation', 'F. Delivery to users remains a separate explicit operator gate']
        .every((s) => recFlat.includes(s)))
  }

  console.log('\nB. The authored Plank content record')
  {
    check('B1: exactly ONE new Plank content record exists, in the new EXLIB-2G artifact — never inserted into any byte-frozen historical batch (batch fingerprints proven in A1)',
      plankRecs.length === 1 && p.proposed_canonical_name === 'Plank' &&
      existsSync(CONTENT))
    check('B2: authoritative identity exact — timed tracking (with the repository deriving mobility from timed), primary abs, anatomy EXACTLY {(obliques, secondary), (lower_back, tertiary)} with no other muscle or role, and every metadata field equal to the authoritative inventory identity',
      (() => {
        if (p.tracking_mode !== 'timed') return false
        // the repository derivation: deriveLegacyExerciseType('timed') === 'mobility'
        if (!read('src/lib/exercise-validation.ts').includes("case 'timed': return 'mobility'")) return false
        const anat = (p.muscle_targets ?? []).map((m: any) => `${m.muscle}:${m.role}`).sort().join(',')
        if (anat !== 'lower_back:tertiary,obliques:secondary') return false
        if ((p.muscle_targets ?? []).length !== 2) return false
        const invPlank = inv.find((r: any) => r.proposed_canonical_name === 'Plank')
        return p.primary_muscle === 'abs' && invPlank.primary_muscle === 'abs' &&
          p.equipment === invPlank.equipment && p.tracking_mode === invPlank.tracking_mode &&
          p.laterality === invPlank.laterality && p.movement_pattern === invPlank.movement_pattern &&
          p.training_role === invPlank.training_role && p.difficulty === invPlank.difficulty &&
          p.availability === invPlank.availability && invPlank.exercise_type_derived === 'mobility'
      })())
    check('B3: review state fail-closed — content_review pending with reviewer/reviewed_at/rationale all null, review_status proposed, import_eligible the literal false, deferred false with null reason, forgefitos_original provenance with NO source fields, and NO publication key anywhere',
      p.content_review?.status === 'pending' && p.content_review?.reviewer === null &&
      p.content_review?.reviewed_at === null && p.content_review?.rationale === null &&
      p.review_status === 'proposed' && p.import_eligible === false &&
      p.deferred === false && p.deferred_reason === null &&
      p.provenance === 'forgefitos_original' &&
      !('source_url' in p) && !('source_page' in p) && !('retrieved_at' in p) &&
      !Object.keys(p).some((k) => k.includes('publication')))
    check('B4: schema, R-rule, and style conformance — exact required-field set, step/length bounds, normalized-unique non-colliding aliases, R3-resolvable relationship targets that avoid deferred identities, no self-reference, no medical/attribution language, stop language present, the breath rule, timed hold/duration language with no rep or per-side phrasing, no sentence copied from the promoted corpus, ASCII-only',
      (() => {
        const schema = JSON.parse(read('docs/exlib2c-authoring-schema.json'))
        const req: string[] = schema.required
        if (JSON.stringify(Object.keys(p).sort()) !== JSON.stringify([...req].sort())) return false
        const steps: string[] = [...p.setup_steps, ...p.execution_steps, ...p.common_mistakes]
        if (!steps.every((s) => s.length >= 10 && s.length <= 240 && s.trim())) return false
        if (p.setup_steps.length < 1 || p.setup_steps.length > 5) return false
        if (p.execution_steps.length < 2 || p.execution_steps.length > 6) return false
        if (p.common_mistakes.length < 1 || p.common_mistakes.length > 4) return false
        if (p.breathing_cue.length < 10 || p.breathing_cue.length > 240) return false
        if (p.safety_guidance.length < 10 || p.safety_guidance.length > 400) return false
        const corpusNorm = new Set(inv.map((r: any) => r.normalized_name))
        const aliasSeen = new Set<string>()
        for (const r of corpus) for (const a of r.aliases) aliasSeen.add(norm(a))
        for (const a of p.aliases) {
          if (corpusNorm.has(norm(a)) || aliasSeen.has(norm(a)) || norm(a) === 'plank') return false
        }
        if (new Set(p.aliases.map(norm)).size !== p.aliases.length) return false
        const deferredNames = new Set(inv.filter((r: any) => r.deferred === true).map((r: any) => r.normalized_name))
        for (const f of ['substitutions', 'regressions', 'progressions'] as const) {
          for (const t of p[f]) {
            if (!corpusNorm.has(norm(t)) || norm(t) === 'plank' || deferredNames.has(norm(t))) return false
          }
        }
        const text = proseOf(p)
        if (/\b(diagnos\w*|treat(s|ed|ment)?\b|rehabilitat\w*|prescri\w*|cure\w*|therap\w*|pain-free|guarantee\w*)/i.test(text)) return false
        if (/(according to|adapted from|source:|courtesy|credit(ed)? to|strengthlog)/i.test(text)) return false
        if (/hold your breath/i.test(text) && !/never/i.test(text)) return false
        const safety = (p.safety_guidance + ' ' + p.common_mistakes.join(' ')).toLowerCase()
        if (!/(stop|come out of|end(ing)? the (session|hold))/.test(safety)) return false
        if (!/hold/i.test(text) || !/duration/i.test(text)) return false
        if (/\brep(s|etition)?\b/i.test(text)) return false
        if (/per[- ]side|each side|one side at a time/i.test(text)) return false
        const seen = new Set<string>()
        for (const r of corpus) {
          for (const s of [...r.setup_steps, ...r.execution_steps, ...r.common_mistakes, r.breathing_cue, r.safety_guidance]) seen.add(s.trim())
        }
        for (const s of [...p.setup_steps, ...p.execution_steps, ...p.common_mistakes, p.breathing_cue, p.safety_guidance]) {
          if (seen.has(s.trim())) return false
        }
        return read(CONTENT).split('').every((c) => c.charCodeAt(0) < 128)
      })())
    check('B5: nothing else moved — all 126 promoted records stay pending/evidence-null/import-false/unpublished (batch bytes frozen in A1), the ledger stays 48/48 pending-null, all 26 legacy candidates stay import-ineligible, zero weight_time in src, and no importer or backup artifact was added',
      (() => {
        if (corpus.length !== 126 || !corpus.every((r) =>
          r.content_review.status === 'pending' && r.content_review.reviewer === null &&
          r.import_eligible === false && !Object.keys(r).some((k) => k.includes('publication')))) return false
        const led = parseJsonl('docs/exlib1b1-review-ledger.jsonl')
        if (led.length !== 48 || !led.every((r: any) => r.status === 'pending' && r.reviewer === null)) return false
        const cands = parseJsonl('docs/exlib1c0a-equipment-resolution.jsonl').flatMap((r: any) => r.canonical_candidates)
        if (cands.length !== 26 || !cands.every((c: any) => c.import_eligible === false)) return false
        if (execSync("grep -rl 'weight_time' src/ || true", { encoding: 'utf8' }).trim() !== '') return false
        if (existsSync('scripts/exlib1c-import.ts') || existsSync('src/lib/catalog-import.ts')) return false
        return !readdirSync('docs').some((f) => /\.(dump|backup|sql\.gz)$/.test(f))
      })())
  }

  console.log('\nC. Activation design and evidence posture')
  {
    check('C1: the activation state machine is complete — S0-S6 states, staged rollout with an off-flag deploy, rolling-deployment and old-client analysis, explicitly rejected invalid orderings, fail-closed sealing honesty, rollback states for runtime/delivery/catalog/seed failure, and NO claim of cross-system atomicity',
      ['S0 CURRENT', 'S1 CONTENT-READY', 'S2 CATALOG-PREPARED', 'S3 HOSTED-STAGED',
        'S4 RUNTIME-ACTIVATION', 'S4a', 'S4b', 'S4c', 'S5 ROLLBACK STATES', 'S6 FUTURE-SEED STATE',
        'INVALID ORDERINGS', 'rolling deployment', 'Old-client analysis',
        'No cross-system atomicity between Git, Vercel, and Supabase is', 'exlib_revoke_run_delivery']
        .every((s) => rec.includes(s)) &&
      recFlat.includes('safe only if every client changes instantaneously is invalid') &&
      recFlat.includes('deploy the delivery-capable runtime BEHIND an off flag') &&
      recFlat.includes('ONLY NOW edit the seed module'))
    check('C2: the operator backup timestamp 2026-09-01 13:09:47 UTC is recorded ONLY as operator recovery evidence — explicitly not repository-generated and never downloaded into the repository — and the record states no hosted contact occurred in this milestone',
      rec.includes('2026-09-01 13:09:47 UTC') &&
      recFlat.includes('NOT repository-generated') &&
      recFlat.includes('never downloaded into or fingerprinted by this repository') &&
      recFlat.includes('no hosted contact, no catalog snapshot/run/approval/seal/load/publication/delivery'))
    check('G1: lifecycle-safe phase boundary — exactly the three new artifacts (design record, content record, this verifier); strict porcelain while uncommitted, adder-anchored single-commit range once committed; no historical verifier needed a retarget this phase (the corpus files the battery reads are all byte-frozen and untouched)',
      (() => {
        try {
          const inHead = (() => {
            try { execSync(`git cat-file -e HEAD:${CONTENT}`, { stdio: 'pipe' }); return true } catch { return false }
          })()
          if (!inHead) {
            const entries = execSync('git status --porcelain', { encoding: 'utf8' })
              .split('\n').filter(Boolean).map((l) => l.trim()).sort()
            const expected = PHASE_NEW.map((f) => `?? ${f}`).sort()
            if (JSON.stringify(entries) !== JSON.stringify(expected)) return false
            return execSync('git diff --cached --name-only', { encoding: 'utf8' }).trim() === ''
          }
          const adders = new Set<string>()
          for (const pth of PHASE_NEW) {
            const a = execSync(`git log --all --format=%H --diff-filter=A -- "${pth}"`,
              { encoding: 'utf8' }).split('\n').filter(Boolean)
            if (a.length !== 1) return false
            adders.add(a[0])
          }
          if (adders.size !== 1) return false
          const phase = Array.from(adders)[0]
          execSync(`git merge-base --is-ancestor ${phase} HEAD`)
          execSync(`git merge-base --is-ancestor ${SOURCE_TIP} ${phase}`)
          const range = execSync(`git diff --name-only ${SOURCE_TIP}..${phase}`, { encoding: 'utf8' })
            .split('\n').filter(Boolean).sort()
          return JSON.stringify(range) === JSON.stringify(PHASE_NEW)
        } catch { return false }
      })())
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
