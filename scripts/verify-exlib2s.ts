// EXLIB-2S STATIC verification (LOCAL-ONLY): the prepared Plank
// delivery-activation change set — the coordinated seed-module edit
// and the inventory seed_link_compatible flip (the promoted
// activation design's SEED-FLIP EVENT, state S7) — its preparation
// record, and the thirty-one mechanically necessary labeled historical
// retargets.
//
// Proves: the promoted EXLIB-2R evidence source (tag object, peel,
// tree, byte-exact annotation); every upstream authority byte-frozen;
// the complete field-level correspondence between the edited seed
// Plank entry and the PUBLISHED Plank identity (parsed mechanically
// from the seed module and compared against the promoted artifact,
// the inventory row, and the promoted evidence lines — including the
// exact anatomy set and the derived legacy type); the ONE-FIELD flip
// (every other Plank inventory field equal to the delivery
// predecessor; exactly fifteen compatible rows after); the
// same-commit rule; the seed NON-EXPRESSION boundary (the seed still
// expresses exactly its seven fields — no payload, no
// exercise-to-exercise relationships — those remain catalog facts
// cited from the promoted EXLIB-2R evidence); the ordering-gate
// disclosures (zero src delivery-runtime references, the zero-runs
// citation, the design's verbatim invalid-ordering rejection and
// post-S7 fail-closed rule, the blocked-release statement, and the
// migration-026 P2 predicate citation); the no-delivery-claim
// hygiene; the thirty-one-suite retarget census (label + anchored
// delivery-predecessor constant in every retargeted file); two-state
// phase topology over the thirty-five-path inventory; and hygiene.
// Performs NO hosted contact and NO database work itself.
//
// Fail-closed: any mismatch fails the suite.
import { execSync } from 'child_process'
import { createHash } from 'crypto'
import { readFileSync, readdirSync } from 'fs'

let passed = 0
let failed = 0
const check = (name: string, ok: boolean, detail?: string): void => {
  if (ok) { passed += 1; console.log(`  PASS  ${name}`) }
  else { failed += 1; console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`) }
}
const read = (p: string): string => readFileSync(p, 'utf8')
const sha256 = (p: string): string => createHash('sha256').update(readFileSync(p)).digest('hex')

const RECORD = 'docs/exlib2s-plank-delivery-activation-prep-record.md'
const VERIFIER = 'scripts/verify-exlib2s.ts'
const SEED = 'src/lib/supabase/seed-exercises.ts'
const INVENTORY = 'docs/exlib2b-release1-inventory.jsonl'
const ARTIFACT = 'docs/exlib2g-plank-content.jsonl'
const DESIGN = 'docs/exlib2g-plank-content-activation-design.md'
const REC2R = 'docs/exlib2r-hosted-publication-application-record.md'
const SRC = '5f7e182f3027b3640514e06d642693f4018c03e2'
const SRC_TREE = '902a2b4b1bf76ca5d75fc8d20b62062411c95cc5'
const SRC_TAG = 'exlib2r-hosted-publication-application-evidence-stable'
const SRC_TAG_OBJ = 'e1922ea29f76f43be17f0dd3a7f3d36bcfa8381b'
const SRC_TAG_MSG = 'EXLIB-2R Plank hosted publication application evidence — PUBLISHED — DELIVERY NOT ACTIVATED\n'
const LABEL = 'RETARGET (EXLIB-2S delivery-activation preparation)'
const RETARGETED = [
  'scripts/verify-exlib1a.ts', 'scripts/verify-exlib2a2b.ts',
  'scripts/verify-exlib2c-batch01.ts', 'scripts/verify-exlib2c-batch02.ts',
  'scripts/verify-exlib2c-batch03.ts', 'scripts/verify-exlib2c-batch04.ts',
  'scripts/verify-exlib2c-batch05.ts', 'scripts/verify-exlib2c-batch06.ts',
  'scripts/verify-exlib2d.ts', 'scripts/verify-exlib2e.ts',
  'scripts/verify-exlib2f.ts', 'scripts/verify-exlib2f-application.ts',
  'scripts/verify-exlib2g.ts', 'scripts/verify-exlib2h.ts',
  'scripts/verify-exlib2i.ts', 'scripts/verify-exlib2j.ts',
  'scripts/verify-exlib2k.ts', 'scripts/verify-exlib2k-application.ts',
  'scripts/verify-exlib2l.ts', 'scripts/verify-exlib2m.ts',
  'scripts/verify-exlib2m-application.ts', 'scripts/verify-exlib2n-r6-admission.ts',
  'scripts/verify-exlib2o.ts', 'scripts/verify-exlib2o-application.ts',
  'scripts/verify-exlib2o-live.sh',
  'scripts/verify-exlib2p.ts', 'scripts/verify-exlib2p-application.ts',
  'scripts/verify-exlib2q.ts', 'scripts/verify-exlib2q-application.ts',
  'scripts/verify-exlib2r.ts', 'scripts/verify-exlib2r-application.ts',
].sort()
const PHASE = [
  `A\t${RECORD}`, `A\t${VERIFIER}`, `M\t${SEED}`, `M\t${INVENTORY}`,
  ...RETARGETED.map((p) => `M\t${p}`),
].sort()
const PHASE_PATHS = PHASE.map((s) => s.split('\t')[1]).sort()

const rec = read(RECORD)
const recFlat = rec.replace(/\s+/g, ' ')
const recSolid = rec.replace(/\s+/g, '')
const seed = read(SEED)
const design = read(DESIGN)
const designFlat = design.replace(/\s+/g, ' ')
const rec2rFlat = read(REC2R).replace(/\s+/g, ' ')
const art = JSON.parse(read(ARTIFACT).split('\n').filter((l) => l.trim() && !l.trim().startsWith('#'))[0])
const parseInv = (text: string): Array<Record<string, unknown>> => text.split('\n')
  .filter((l) => l.trim() && !l.trim().startsWith('#')).map((l) => JSON.parse(l))
const inv = parseInv(read(INVENTORY))
const invAtSrc = parseInv(execSync(`git show ${SRC}:"${INVENTORY}"`, { encoding: 'utf8', maxBuffer: 1 << 26 }))
const frozenVsSource = (p: string): boolean =>
  execSync(`git hash-object "${p}"`, { encoding: 'utf8' }).trim() ===
  execSync(`git rev-parse "${SRC}:${p}"`, { encoding: 'utf8' }).trim()

console.log('EXLIB-2S delivery-activation preparation verification (LOCAL-ONLY; nothing merged, deployed, or delivered)')

console.log('\nA. Promoted source and upstream freeze')
check('A1: the promoted EXLIB-2R evidence tag is the exact annotated object, peels to the promoted source tip (ancestor of HEAD) whose tree is exact, with the byte-exact PUBLISHED — DELIVERY NOT ACTIVATED annotation',
  (() => {
    try {
      if (execSync(`git cat-file -t refs/tags/${SRC_TAG}`, { encoding: 'utf8' }).trim() !== 'tag') return false
      if (execSync(`git rev-parse refs/tags/${SRC_TAG}`, { encoding: 'utf8' }).trim() !== SRC_TAG_OBJ) return false
      if (execSync(`git rev-parse refs/tags/${SRC_TAG}^{}`, { encoding: 'utf8' }).trim() !== SRC) return false
      execSync(`git merge-base --is-ancestor ${SRC} HEAD`, { stdio: 'pipe' })
      if (execSync(`git rev-parse ${SRC}^{tree}`, { encoding: 'utf8' }).trim() !== SRC_TREE) return false
      const raw = execSync(`git cat-file tag refs/tags/${SRC_TAG}`, { encoding: 'utf8' })
      return raw.split('\n\n').slice(1).join('\n\n') === SRC_TAG_MSG
    } catch { return false }
  })())
check('A2: the upstream authorities stay byte-frozen at the promoted tip — the published artifact (with its exact SHA-256), the promoted EXLIB-2R evidence record, the promoted activation design, and migrations 010/023/026/027',
  (() => {
    if (sha256(ARTIFACT) !== 'd82078490efa9ef13e128e7b7b742fbda8ea9e74e32382252d96c326c679d752') return false
    if (readFileSync(REC2R).length !== 19051) return false
    for (const p of [ARTIFACT, REC2R, DESIGN,
      'supabase/migrations/010_phase2r_exercise_tracking_modes.sql',
      'supabase/migrations/023_exlib_catalog_and_delivery_contract.sql',
      'supabase/migrations/026_exlib_plank_seed_reconciliation.sql',
      'supabase/migrations/027_exlib_catalog_content_schema.sql']) {
      if (!frozenVsSource(p)) return false
    }
    return true
  })())

console.log('\nB. The seed edit corresponds exactly to the published Plank identity')
check('B1: the edited seed Plank entry parses to EXACTLY the published identity at every field the seed expresses — name Plank, category isolation (the published snapshot category), primary_muscle abs, equipment bodyweight, tracking_mode timed, unilateral false (the published bilateral laterality) — each cross-checked against the promoted artifact, the inventory row, and the promoted evidence line',
  (() => {
    const m = seed.match(/\{ name: "Plank",\s*category: "([a-z_]+)", primary_muscle: "([a-z_]+)",\s*equipment: "([a-z_]+)", tracking_mode: "([a-z_]+)",\s*unilateral: (true|false),\n\s*muscle_targets: \[([^\]]*)\] \}/)
    if (!m) return false
    if (m[1] !== 'isolation' || m[2] !== 'abs' || m[3] !== 'bodyweight' || m[4] !== 'timed' || m[5] !== 'false') return false
    if (art.proposed_canonical_name !== 'Plank' || art.primary_muscle !== 'abs' ||
      art.equipment !== 'bodyweight' || art.tracking_mode !== 'timed' || art.laterality !== 'bilateral') return false
    const invPlank = inv.find((r) => r.proposed_canonical_name === 'Plank') as Record<string, unknown>
    if (!invPlank || invPlank.primary_muscle !== 'abs' || invPlank.equipment !== 'bodyweight' ||
      invPlank.tracking_mode !== 'timed') return false
    return rec2rFlat.includes('canonical_name = Plank, category = isolation') === false
      ? read('docs/exlib2q-hosted-admission-application-record.md').replace(/\s+/g, ' ').includes('canonical_name = Plank, category = isolation')
      : true
  })())
check('B2: the seed anatomy set is EXACTLY the published anatomy — {(obliques, secondary), (lower_back, tertiary)}, no other muscle or role — equal to the artifact muscle_targets and the inventory muscle_targets, in the seed entry\'s parsed targets',
  (() => {
    const m = seed.match(/\{ name: "Plank",[\s\S]*?muscle_targets: \[([^\]]*)\] \}/)
    if (!m) return false
    const targets = Array.from(m[1].matchAll(/\{ muscle: "([a-z_]+)", role: "([a-z_]+)" \}/g))
      .map((t) => `${t[1]}:${t[2]}`).sort()
    const want = ['lower_back:tertiary', 'obliques:secondary']
    if (JSON.stringify(targets) !== JSON.stringify(want)) return false
    const artT = (art.muscle_targets as Array<{ muscle: string; role: string }>)
      .map((t) => `${t.muscle}:${t.role}`).sort()
    if (JSON.stringify(artT) !== JSON.stringify(want)) return false
    const invPlank = inv.find((r) => r.proposed_canonical_name === 'Plank') as { muscle_targets: Array<{ muscle: string; role: string }> }
    const invT = invPlank.muscle_targets.map((t) => `${t.muscle}:${t.role}`).sort()
    return JSON.stringify(invT) === JSON.stringify(want)
  })())
check('B3: the derived legacy exercise_type is mobility — the validation module maps timed to mobility (the same map migration 010 applied, per the promoted design), equal to the inventory\'s exercise_type_derived — so the seeded row derives exactly the published type',
  (() => {
    const val = read('src/lib/exercise-validation.ts')
    if (!val.includes("case 'timed': return 'mobility'")) return false
    const invPlank = inv.find((r) => r.proposed_canonical_name === 'Plank') as Record<string, unknown>
    if (invPlank.exercise_type_derived !== 'mobility') return false
    return designFlat.includes('derived exercise_type = mobility (via deriveLegacyExerciseType, matching migration 010')
  })())
check('B4: the flip is EXACTLY ONE FIELD — the live Plank inventory row equals the delivery-predecessor row on every field except seed_link_compatible (false becomes true), no other inventory row changed at all, and exactly FIFTEEN rows are now compatible (fourteen before, plus Plank)',
  (() => {
    const now = inv.find((r) => r.proposed_canonical_name === 'Plank') as Record<string, unknown>
    const before = invAtSrc.find((r) => r.proposed_canonical_name === 'Plank') as Record<string, unknown>
    if (!now || !before) return false
    if (now.seed_link_compatible !== true || before.seed_link_compatible !== false) return false
    const nowRest = { ...now }; delete nowRest.seed_link_compatible
    const beforeRest = { ...before }; delete beforeRest.seed_link_compatible
    if (JSON.stringify(nowRest) !== JSON.stringify(beforeRest)) return false
    const others = inv.filter((r) => r.proposed_canonical_name !== 'Plank')
    const othersBefore = invAtSrc.filter((r) => r.proposed_canonical_name !== 'Plank')
    if (JSON.stringify(others) !== JSON.stringify(othersBefore)) return false
    if (inv.filter((r) => r.seed_link_compatible === true).length !== 15) return false
    return invAtSrc.filter((r) => r.seed_link_compatible === true).length === 14
  })())
check('B5: the SAME-COMMIT rule and the non-expression boundary hold — the seed edit and the flip travel in the same phase (both changed together, uncommitted or in the one phase commit); the seed type still expresses exactly its seven fields with NO payload or relationship expression; and the record states the seed delivers the identity while the published payload and the two projected relationships remain catalog facts',
  (() => {
    const seedChanged = execSync(`git diff --name-only ${SRC} -- "${SEED}"`, { encoding: 'utf8' }).trim() !== ''
    const invChanged = execSync(`git diff --name-only ${SRC} -- "${INVENTORY}"`, { encoding: 'utf8' }).trim() !== ''
    const inHead = (() => {
      try {
        return execSync(`git show HEAD:"${SEED}"`, { encoding: 'utf8', maxBuffer: 1 << 26 }) !==
          execSync(`git show ${SRC}:"${SEED}"`, { encoding: 'utf8', maxBuffer: 1 << 26 })
      } catch { return false }
    })()
    if (!inHead && (!seedChanged || !invChanged)) return false
    const typeBlock = seed.match(/SEED_EXERCISES: ReadonlyArray<\{([\s\S]*?)\}>/)
    if (!typeBlock) return false
    const fields = Array.from(typeBlock[1].matchAll(/^\s*(\w+):/gm)).map((f) => f[1]).sort()
    if (JSON.stringify(fields) !== JSON.stringify(['category', 'equipment', 'muscle_targets', 'name', 'primary_muscle', 'tracking_mode', 'unilateral'])) return false
    if (/setup_steps|execution_steps|breathing|progression|substitution|regression/.test(seed.replace(/\/\/[^\n]*/g, ''))) return false
    return recFlat.includes('THE SEED CANNOT EXPRESS instructional payload')
      && recFlat.includes('CANNOT EXPRESS exercise-to-exercise relationships')
      && recFlat.includes('the seed delivers the identity; the catalog holds the published content and relationships')
  })())
check('B6: the published-side citations are exact — the promoted EXLIB-2R evidence record carries published 1 / draft 0 / retired 0 and BOTH projected relationship lines this record cites, and the record pins the evidence fingerprints',
  rec2rFlat.includes('published 1, draft 0, retired 0') &&
  rec2rFlat.includes('progression -> Ab wheel rollout e21b2c00-0000-4000-a000-000000000003') &&
  rec2rFlat.includes('substitution -> Dead bug e21b2c00-0000-4000-a000-000000000002') &&
  recSolid.includes('bf0b75e73e6064ee2901bb1a3a607547215f4ab638b997eea7b012993240974e') &&
  recSolid.includes('d82078490efa9ef13e128e7b7b742fbda8ea9e74e32382252d96c326c679d752') &&
  recFlat.includes('Plank progression -> Ab wheel rollout') &&
  recFlat.includes('Plank substitution -> Dead bug'))

console.log('\nC. The ordering gates and the no-delivery-claim posture')
check('C1: the ordering-gate disclosure is complete and mechanically grounded — ZERO src references to deliver_catalog_exercises (proven here), the zero-runs citation from the promoted evidence, the design\'s verbatim invalid-ordering rejection and post-S7 fail-closed rule (cross-checked against the design bytes), the migration-026 P2 pristine-bodyweight predicate citation (cross-checked against the migration bytes), and the BINDING blocked-release statement',
  (() => {
    if (execSync("grep -rln 'deliver_catalog_exercises' src/ || true", { encoding: 'utf8' }).trim() !== '') return false
    if (!rec2rFlat.includes('Import runs: 0. Run items: 0.')) return false
    if (!recFlat.includes('ZERO src references to deliver_catalog_exercises')) return false
    if (!recFlat.includes('records ZERO import runs and ZERO run items on hosted')) return false
    const invalidOrdering = 'seed edit before S6-proven delivery-first behavior (recreates the prohibited unlinked-timed state - the original EXLIB-2G mistake)'
    if (!designFlat.includes(invalidOrdering)) return false
    if (!recFlat.includes('"seed edit before S6-proven delivery-first behavior (recreates the prohibited unlinked-timed state - the original EXLIB-2G mistake)"')) return false
    const postS7 = 'must PROVE that delivery failure, a rejected run, a revoked run, a timeout, or a malformed response CANNOT call seedExercisesIfNeeded while the timed seed definition is live'
    if (!designFlat.includes(postS7)) return false
    if (!recFlat.includes(postS7)) return false
    if (!read('supabase/migrations/026_exlib_plank_seed_reconciliation.sql').includes("v_seed.tracking_mode = 'bodyweight'")) return false
    if (!recFlat.includes('MERGING, PROMOTING, OR DEPLOYING THIS BRANCH IS THE SEED-FLIP EVENT (S7) AND REMAINS BLOCKED')) return false
    if (!recFlat.includes('Codex explicitly re-adjudicates the activation ordering')) return false
    return recFlat.includes('flags the constraint rather than deviating silently')
  })())
check('C2: NO PRODUCT DELIVERY IS CLAIMED — the record says so explicitly, never claims users receive the catalog or the timed seed, states the live product\'s seed behavior is unchanged where this branch is not deployed, and the design\'s same-commit rule is quoted and honored',
  recFlat.includes('NO PRODUCT DELIVERY IS CLAIMED') &&
  !recFlat.includes('users now receive') &&
  !recFlat.includes('is now delivered to users') &&
  recFlat.includes('the live product\'s seed behavior is UNCHANGED anywhere this branch is not deployed') &&
  designFlat.includes('flip seed_link_compatible=true in the SAME commit') &&
  recFlat.includes('"edit the seed module ... and flip seed_link_compatible=true in the SAME commit"'))
check('C3: hosted state untouched — the record states every database fact is cited from promoted evidence bytes, no hosted contact occurred, no SPENT package was rerun, no import run was created, and the hosted project remains exactly as the promoted EXLIB-2R evidence left it',
  recFlat.includes('no Supabase or Vercel endpoint was contacted') &&
  recFlat.includes('no SPENT package was rerun') &&
  recFlat.includes('no import run was created') &&
  recFlat.includes('cited from promoted repository evidence bytes') &&
  recFlat.includes('remains exactly as the promoted EXLIB-2R evidence left it'))

console.log('\nD. The retarget census')
check('D1: exactly the THIRTY-ONE enumerated suites carry the label — every retargeted file contains the exact label AND the anchored delivery-predecessor commit constant, NO other script carries the label, and the record enumerates the same thirty-one suites with the 42-check mechanical-enumeration story (41 battery checks by simulated commit, plus the one live-suite check found by direct live-suite inspection) and the count-neutral totals',
  (() => {
    const labelled = execSync(`grep -rl 'RETARGET (EXLIB-2S delivery-activation preparation)' scripts/ | sort`, { encoding: 'utf8' })
      .split('\n').filter(Boolean).filter((p) => p !== VERIFIER).sort()
    if (JSON.stringify(labelled) !== JSON.stringify(RETARGETED)) return false
    for (const p of RETARGETED) {
      const t = read(p)
      if (!t.includes(LABEL)) return false
      if (!t.includes('5f7e182f3027b3640514e06d642693f4018c03e2')) return false
    }
    if (!recFlat.includes('exactly FORTY-ONE checks across THIRTY battery suites failed; nothing else in the battery did')) return false
    if (!recFlat.includes('ONE further live-suite check')) return false
    if (!recFlat.includes('FORTY-TWO checks across THIRTY-ONE suites')) return false
    if (!recFlat.includes('88 suites / 7,063 checks / 0 failures at the simulated commit both ways')) return false
    return recFlat.includes('DELIVERY-ACTIVATION PREDECESSOR')
  })())

console.log('\nE. Phase topology (two-state) and hygiene')
const PORCELAIN = execSync('git status --porcelain', { encoding: 'utf8' }).split('\n').filter(Boolean)
const CHANGED = PORCELAIN.map((l) => l.slice(3).trim()).sort()
const committed = CHANGED.length === 0
  && execSync(`git rev-list --count ${SRC}..HEAD`, { encoding: 'utf8' }).trim() !== '0'
if (committed) {
  check('E1: phase topology — the merge base of HEAD and the promoted source IS the source; the phase is exactly THREE plain single-parent commits (the preparation commit, PRESERVED with its exact tree; the live-suite-retarget correction, PRESERVED; and its one second-order-pin correction), 3 ahead / 0 behind, zero merges, with the combined correction range touching exactly the record, this verifier, the retargeted live suite, and the 2O application verifier',
    (() => {
      try {
        if (execSync(`git merge-base ${SRC} HEAD`, { encoding: 'utf8' }).trim() !== SRC) return false
        const PREP = '7e6f70cb80be22c7de55cb4f5f8303eb019c7e78'
        const PREP_TREE = '105495c5ba5013e4a56ee09ea94270f10014c447'
        const CORR1 = '9ba7b437e8df9caa2f0e906bfec6d3633f561b27'
        if (execSync(`git rev-parse ${PREP}^{tree}`, { encoding: 'utf8' }).trim() !== PREP_TREE) return false
        for (const [child, parent] of [['HEAD', CORR1], [CORR1, PREP], [PREP, SRC]]) {
          const parents = execSync(`git rev-list --parents -n 1 ${child}`, { encoding: 'utf8' }).trim().split(/\s+/)
          if (parents.length !== 2 || parents[1] !== parent) return false
        }
        const corr = execSync(`git diff --name-status ${PREP}..HEAD`, { encoding: 'utf8' })
          .split('\n').filter(Boolean).sort()
        if (JSON.stringify(corr) !== JSON.stringify([`M\t${RECORD}`, `M\t${VERIFIER}`,
          'M\tscripts/verify-exlib2o-application.ts', 'M\tscripts/verify-exlib2o-live.sh'].sort())) return false
        return execSync(`git rev-list --count ${SRC}..HEAD`, { encoding: 'utf8' }).trim() === '3'
          && execSync(`git rev-list --count HEAD..${SRC}`, { encoding: 'utf8' }).trim() === '0'
          && execSync(`git rev-list --count --merges ${SRC}..HEAD`, { encoding: 'utf8' }).trim() === '0'
      } catch { return false }
    })())
  check('E2: exact phase inventory — the range carries exactly the THIRTY-FIVE disclosed paths (2 additions, the 2 product files, and the 31 labeled retargeted suites)',
    (() => {
      const status = execSync(`git diff --name-status ${SRC}..HEAD`, { encoding: 'utf8' })
        .split('\n').filter(Boolean).sort()
      return JSON.stringify(status) === JSON.stringify(PHASE)
    })())
} else {
  check('E1-E2 (uncommitted authoring state): every worktree change lies inside the thirty-five phase paths — nothing outside this phase is touched',
    CHANGED.length > 0 && CHANGED.every((p) => PHASE_PATHS.includes(p)))
}
check('E3: two-state lifecycle — the record and this verifier are absent at the promoted source tip, the seed and inventory at the tip still carry the OLD state (bodyweight Plank, flip false), and the live phase carries the new state',
  (() => {
    const srcDocs = execSync(`git ls-tree ${SRC} docs/ --name-only`, { encoding: 'utf8' })
    const srcScripts = execSync(`git ls-tree ${SRC} scripts/ --name-only`, { encoding: 'utf8' })
    if (srcDocs.includes('exlib2s-')) return false
    if (srcScripts.includes('verify-exlib2s')) return false
    const seedAtSrc = execSync(`git show ${SRC}:"${SEED}"`, { encoding: 'utf8', maxBuffer: 1 << 26 })
    if (!seedAtSrc.includes('tracking_mode: "bodyweight",  unilateral: false,\n    muscle_targets: [{ muscle: "obliques", role: "secondary" }] }')) return false
    const beforePlank = invAtSrc.find((r) => r.proposed_canonical_name === 'Plank') as Record<string, unknown>
    if (beforePlank.seed_link_compatible !== false) return false
    return seed.includes('tracking_mode: "timed"') &&
      (inv.find((r) => r.proposed_canonical_name === 'Plank') as Record<string, unknown>).seed_link_compatible === true
  })())
check('E4: LOCAL-ONLY hygiene — neither the record nor this verifier contains a hosted endpoint URL, connection string, credential, or Supabase CLI remote command; the record carries no non-ASCII beyond the em-dash; and the seed edit introduced no credential or endpoint material',
  (() => {
    const self = read(VERIFIER)
    const both = rec + self + seed
    const bads = [
      'supabase' + '.co', 'vercel' + '.', 'postgresql' + '://', 'postgres' + '://',
      'SUPABASE' + '_URL', 'SUPABASE' + '_SERVICE', 'api' + 'key', 'Bearer' + ' ', 'ey' + 'J',
      '--db' + '-url', '--lin' + 'ked', 'db ' + 'push',
    ]
    for (const bad of bads) {
      if (both.includes(bad)) return false
    }
    for (const ch of rec) {
      const c = ch.codePointAt(0) as number
      if (c > 127 && c !== 0x2014) return false
      if (c < 32 && ch !== '\n') return false
    }
    return true
  })())

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
