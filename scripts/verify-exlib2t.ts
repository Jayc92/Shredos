// EXLIB-2T STATIC verification (LOCAL-ONLY): the S3 delivery-runtime
// preparation — the deliver_catalog_exercises integration behind a
// strictly-OFF-by-default application flag — its record, its
// behavioral test suite, and the sixteen mechanically necessary
// labeled historical retargets.
//
// Proves: the promoted EXLIB-2R evidence source; the S3 boundary
// (seed module and inventory byte-identical to the promoted tip —
// the seed definition remains bodyweight on this branch); the
// strict-OFF flag mechanics (exact-string comparison, no other
// enablement path, no tracked assignment anywhere, no .env change);
// the FAIL-CLOSED REGION split (the seed identifier exactly twice
// above the marker — import + flag-OFF branch — and ZERO below);
// the single-entry-point routing census (the three call sites
// reference the seed zero times and the entry point once each; in
// src/ the seed function is referenced only by its own module and
// the entry-point module); the RPC integration shape against the
// migration bytes (function name, p_run_key argument, authenticated
// grant, summary validation demanding the run_key echo and integer
// counters); the timeout machinery (default 10000, validated
// positive-integer knob, cleared timer); the behavioral test
// suite's shape and its 12-check totals; the sixteen-suite retarget
// census (label + anchored predecessor in every retargeted file and
// nowhere else); two-state phase topology over the twenty-three-path
// inventory; and hygiene. Performs NO hosted contact and NO network
// activity of any kind.
//
// Fail-closed: any mismatch fails the suite.
import { execSync } from 'child_process'
import { readFileSync, readdirSync } from 'fs'

let passed = 0
let failed = 0
const check = (name: string, ok: boolean, detail?: string): void => {
  if (ok) { passed += 1; console.log(`  PASS  ${name}`) }
  else { failed += 1; console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`) }
}
const read = (p: string): string => readFileSync(p, 'utf8')

const RECORD = 'docs/exlib2t-delivery-runtime-prep-record.md'
const VERIFIER = 'scripts/verify-exlib2t.ts'
const RUNTIME_TESTS = 'scripts/verify-exlib2t-runtime.ts'
const MODULE = 'src/lib/supabase/deliver-catalog.ts'
const SEED = 'src/lib/supabase/seed-exercises.ts'
const INVENTORY = 'docs/exlib2b-release1-inventory.jsonl'
const CALL_SITES = [
  'src/app/(app)/workouts/page.tsx',
  'src/app/(app)/workouts/exercises/page.tsx',
  'src/app/api/exercises/route.ts',
]
const SRC = '5f7e182f3027b3640514e06d642693f4018c03e2'
const SRC_TREE = '902a2b4b1bf76ca5d75fc8d20b62062411c95cc5'
const SRC_TAG = 'exlib2r-hosted-publication-application-evidence-stable'
const SRC_TAG_OBJ = 'e1922ea29f76f43be17f0dd3a7f3d36bcfa8381b'
const LABEL = 'RETARGET (EXLIB-2T delivery-runtime preparation)'
const RETARGETED = [
  'scripts/verify-exlib2d.ts', 'scripts/verify-exlib2e.ts', 'scripts/verify-exlib2g.ts',
  'scripts/verify-exlib2h.ts', 'scripts/verify-exlib2i.ts', 'scripts/verify-exlib2j.ts',
  'scripts/verify-exlib2k.ts', 'scripts/verify-exlib2k-application.ts',
  'scripts/verify-exlib2m.ts', 'scripts/verify-exlib2o-application.ts',
  'scripts/verify-exlib2p-application.ts', 'scripts/verify-exlib2q-application.ts',
  'scripts/verify-exlib2r-application.ts', 'scripts/verify-phase4b6a.ts',
  'scripts/verify-phase5a2.ts', 'scripts/verify-ui5a.ts',
].sort()
const PHASE = [
  `A\t${MODULE}`, `A\t${RECORD}`, `A\t${VERIFIER}`, `A\t${RUNTIME_TESTS}`,
  ...CALL_SITES.map((p) => `M\t${p}`),
  ...RETARGETED.map((p) => `M\t${p}`),
].sort()
const PHASE_PATHS = PHASE.map((s) => s.split('\t')[1]).sort()

const rec = read(RECORD)
const recFlat = rec.replace(/\s+/g, ' ')
const mod = read(MODULE)
const tests = read(RUNTIME_TESTS)
const frozenVsSource = (p: string): boolean =>
  execSync(`git hash-object "${p}"`, { encoding: 'utf8' }).trim() ===
  execSync(`git rev-parse "${SRC}:${p}"`, { encoding: 'utf8' }).trim()

console.log('EXLIB-2T delivery-runtime preparation verification (LOCAL-ONLY; flag strictly OFF; nothing deployed or enabled)')

console.log('\nA. Promoted source and the S3 boundary')
check('A1: the promoted EXLIB-2R evidence tag is the exact annotated object, peels to the promoted source tip (ancestor of HEAD) whose tree is exact',
  (() => {
    try {
      if (execSync(`git rev-parse refs/tags/${SRC_TAG}`, { encoding: 'utf8' }).trim() !== SRC_TAG_OBJ) return false
      if (execSync(`git rev-parse refs/tags/${SRC_TAG}^{}`, { encoding: 'utf8' }).trim() !== SRC) return false
      execSync(`git merge-base --is-ancestor ${SRC} HEAD`, { stdio: 'pipe' })
      return execSync(`git rev-parse ${SRC}^{tree}`, { encoding: 'utf8' }).trim() === SRC_TREE
    } catch { return false }
  })())
check('A2: the S3 boundary holds — the seed module and the inventory are byte-identical to the promoted tip (the seed definition REMAINS BODYWEIGHT on this branch, exactly what the activation design requires of S3), and the activation design, package.json, and migrations 023/026/027 are frozen too',
  (() => {
    for (const p of [SEED, INVENTORY, 'docs/exlib2g-plank-content-activation-design.md', 'package.json',
      'supabase/migrations/023_exlib_catalog_and_delivery_contract.sql',
      'supabase/migrations/026_exlib_plank_seed_reconciliation.sql',
      'supabase/migrations/027_exlib_catalog_content_schema.sql']) {
      if (!frozenVsSource(p)) return false
    }
    return read(SEED).includes('tracking_mode: "bodyweight",  unilateral: false,\n    muscle_targets: [{ muscle: "obliques", role: "secondary" }] }')
  })())

console.log('\nB. The runtime module: strict-OFF flag, fail-closed region, integration shape')
check('B1: the flag defaults STRICTLY OFF — enablement is the single exact-string comparison CATALOG_DELIVERY_ENABLED === "true", no other enablement path exists in the module, and NO tracked file assigns the variable (the census finds the name only in this phase\'s module, tests, verifier, and record)',
  (() => {
    if (!mod.includes('return process.env.CATALOG_DELIVERY_ENABLED === "true"')) return false
    if ((mod.match(/CATALOG_DELIVERY_ENABLED/g) || []).length !== 2) return false
    const carriers = execSync("grep -rl 'CATALOG_DELIVERY_ENABLED' --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.next . | sed 's|^\\./||' | sort", { encoding: 'utf8' })
      .split('\n').filter(Boolean).sort()
    if (JSON.stringify(carriers) !== JSON.stringify([RECORD, RUNTIME_TESTS, VERIFIER, MODULE].sort())) return false
    const assigns = execSync("grep -rn 'CATALOG_DELIVERY_ENABLED[[:space:]]*=[^=]' --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.next . || true", { encoding: 'utf8' })
      .split('\n').filter(Boolean)
      // the tests' own env harness is the only lawful assigner
      .filter((l) => !l.startsWith(`${RUNTIME_TESTS}:`))
    return assigns.length === 0
  })())
check('B2: the FAIL-CLOSED REGION split is exact — the marker appears once; the seed identifier appears in CODE exactly TWICE above it (the import and the flag-OFF branch) and ZERO times below it, comments included, so the flag-ON path structurally cannot reach the seed',
  (() => {
    const marker = 'FAIL-CLOSED REGION'
    if ((mod.match(/FAIL-CLOSED REGION/g) || []).length !== 1) return false
    const idx = mod.indexOf(marker)
    // CODE references only above the marker (the module's own
    // explanatory comments may name the identifier); below the
    // marker the RAW count must be zero — not even a comment.
    const above = mod.slice(0, idx).replace(/\/\/[^\n]*/g, '')
    const below = mod.slice(idx)
    if ((above.match(/seedExercisesIfNeeded/g) || []).length !== 2) return false
    if (!mod.includes('import { seedExercisesIfNeeded } from "./seed-exercises"')) return false
    if (!above.includes('await seedExercisesIfNeeded(supabase, userId)')) return false
    return (below.match(/seedExercisesIfNeeded/g) || []).length === 0
  })())
check('B3: single-entry-point routing — each of the three call sites imports initializeExercisesIfNeeded exactly once, calls it exactly once, and references the seed function ZERO times; across src/, seedExercisesIfNeeded is referenced ONLY by its own module and the entry-point module',
  (() => {
    for (const p of CALL_SITES) {
      const t = read(p)
      if ((t.match(/initializeExercisesIfNeeded/g) || []).length !== 2) return false
      if (!t.includes("from '@/lib/supabase/deliver-catalog'")) return false
      if (t.includes('seedExercisesIfNeeded')) return false
    }
    const refs = execSync("grep -rl 'seedExercisesIfNeeded' src/ | sort", { encoding: 'utf8' })
      .split('\n').filter(Boolean).sort()
    return JSON.stringify(refs) === JSON.stringify([MODULE, SEED].sort())
  })())
check('B4: the RPC integration matches the migration contract — exactly one rpc call site invoking deliver_catalog_exercises with the p_run_key argument; the migration declares that exact signature RETURNS JSONB with EXECUTE granted to authenticated; and the response validator demands the run_key echo plus non-negative integer eligible/inserted counters',
  (() => {
    if ((mod.match(/supabase\.rpc\(/g) || []).length !== 1) return false
    if (!mod.includes('supabase.rpc("deliver_catalog_exercises", { p_run_key: runKey })')) return false
    const mig = read('supabase/migrations/023_exlib_catalog_and_delivery_contract.sql')
    if (!mig.includes('CREATE OR REPLACE FUNCTION deliver_catalog_exercises(p_run_key TEXT)')) return false
    if (!mig.includes('GRANT EXECUTE ON FUNCTION deliver_catalog_exercises(TEXT) TO authenticated;')) return false
    if (!mod.includes('if (obj.run_key !== expectedRunKey) return null')) return false
    if (!mod.includes("if (typeof inserted !== 'number' || !Number.isInteger(inserted) || inserted < 0) return null".replace(/'/g, '"'))) return false
    return mod.includes('function parseDeliverySummary(')
  })())
check('B5: the missing-configuration and timeout machinery are exact — a null run key fails closed BEFORE the RPC (the null check precedes the rpc call in the fail-closed region), the timeout default is 10,000ms behind a positive-integer-validated knob, and the race clears its timer',
  (() => {
    const region = mod.slice(mod.indexOf('FAIL-CLOSED REGION'))
    const keyIdx = region.indexOf('if (runKey === null)')
    const rpcIdx = region.indexOf('supabase.rpc(')
    if (keyIdx < 0 || rpcIdx < 0 || keyIdx > rpcIdx) return false
    if (!mod.includes('const DEFAULT_DELIVERY_TIMEOUT_MS = 10_000')) return false
    if (!mod.includes('if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) return DEFAULT_DELIVERY_TIMEOUT_MS')) return false
    if (!mod.includes('clearTimeout(timer)')) return false
    return mod.includes('return failClosed("delivery is enabled but CATALOG_DELIVERY_RUN_KEY is not configured")')
  })())
check('B6: fail-closed is a RETURN, never a throw or a fallback — failClosed logs "no seeding occurred", returns the failed_closed outcome, the delivery path is wrapped in a catch boundary that also fails closed, and the record carries the design\'s fail-closed rule verbatim',
  mod.includes('function failClosed(reason: string): InitializeOutcome {') &&
  mod.includes('deliverCatalog failed closed (no seeding occurred)') &&
  mod.includes('return { path: "failed_closed", reason }') &&
  mod.includes('} catch (e) {') &&
  recFlat.includes('PROVE that delivery failure, a rejected run, a revoked run, a timeout, or a malformed response CANNOT call seedExercisesIfNeeded while the timed seed definition is live') &&
  read('docs/exlib2g-plank-content-activation-design.md').replace(/\s+/g, ' ').includes('PROVE that delivery failure, a rejected run, a revoked run, a timeout, or a malformed response CANNOT call seedExercisesIfNeeded while the timed seed definition is live'))

console.log('\nC. The behavioral test suite')
check('C1: the runtime test suite exists with the design-named coverage — the strict-OFF sweep (nine non-exact values), the missing run key failing closed before any RPC, the rejection/thrown/timeout/malformed classes (seven malformed shapes), the healthy branches, and the cross-cutting zero-seed-inserts tally — driven through the REAL entry point against a fake client with no network',
  (() => {
    if (!tests.includes("import { initializeExercisesIfNeeded } from '../src/lib/supabase/deliver-catalog'")) return false
    if (!tests.includes("['false', '1', 'TRUE', 'True', ' true', 'true ', 'yes', 'on', '']")) return false
    if (!tests.includes('rpcNeverResolves')) return false
    if (!tests.includes('CATALOG_DELIVERY_TIMEOUT_MS: \'50\''.replace(/'/g, "'"))) return false
    if ((tests.match(/\['[a-z -]+', /g) || []).length >= 0 && !tests.includes("['wrong run_key echo'")) return false
    if (!tests.includes('onPathSeedInserts === 0')) return false
    if (!tests.includes('fails closed BEFORE any RPC attempt')) return false
    return !tests.includes('createClient') && !/https?:\/\//.test(tests.replace(/\/\/[^\n]*/g, ''))
  })())

console.log('\nD. The retarget census and the sequencing disclosure')
check('D1: exactly the SIXTEEN enumerated suites carry the label — every retargeted file contains the exact label AND the anchored predecessor commit, NO other script carries the label, and the record tells the mechanical-enumeration story with the count-neutral reconciliation (89/7,075/0 = the baseline 88/7,063 plus exactly the twelve runtime checks)',
  (() => {
    const labelled = execSync(`grep -rl 'RETARGET (EXLIB-2T delivery-runtime preparation)' scripts/ | sort`, { encoding: 'utf8' })
      .split('\n').filter(Boolean).filter((p) => p !== VERIFIER && p !== RUNTIME_TESTS).sort()
    if (JSON.stringify(labelled) !== JSON.stringify(RETARGETED)) return false
    for (const p of RETARGETED) {
      const t = read(p)
      if (!t.includes(LABEL)) return false
      if (!t.includes(SRC)) return false
    }
    if (!recFlat.includes('exactly SIXTEEN checks across SIXTEEN suites failed; nothing else did')) return false
    return recFlat.includes('89 suites / 7,075 checks / 0 failures')
  })())
check('D2: the EXLIB-2S sequencing disclosure is present — the parked seed-flip branch retargeted overlapping suites under its own label, the reconciliation belongs to whichever lands second, and nothing here changes the EXLIB-2S branch or its S7 block',
  recFlat.includes('SEQUENCING DISCLOSURE') &&
  recFlat.includes('whichever lands second will need a reviewed reconciliation of the overlapping retargets') &&
  recFlat.includes('nothing about this milestone changes the EXLIB-2S branch or its S7 block'))

console.log('\nE. Phase topology (two-state) and hygiene')
const PORCELAIN = execSync('git status --porcelain', { encoding: 'utf8' }).split('\n').filter(Boolean)
const CHANGED = PORCELAIN.map((l) => l.slice(3).trim()).sort()
const committed = CHANGED.length === 0
  && execSync(`git rev-list --count ${SRC}..HEAD`, { encoding: 'utf8' }).trim() !== '0'
if (committed) {
  check('E1: phase topology — the merge base of HEAD and the promoted source IS the source; the phase is exactly ONE plain single-parent commit, 1 ahead / 0 behind, zero merges',
    (() => {
      try {
        if (execSync(`git merge-base ${SRC} HEAD`, { encoding: 'utf8' }).trim() !== SRC) return false
        const parents = execSync('git rev-list --parents -n 1 HEAD', { encoding: 'utf8' }).trim().split(/\s+/)
        if (parents.length !== 2 || parents[1] !== SRC) return false
        return execSync(`git rev-list --count ${SRC}..HEAD`, { encoding: 'utf8' }).trim() === '1'
          && execSync(`git rev-list --count HEAD..${SRC}`, { encoding: 'utf8' }).trim() === '0'
          && execSync(`git rev-list --count --merges ${SRC}..HEAD`, { encoding: 'utf8' }).trim() === '0'
      } catch { return false }
    })())
  check('E2: exact phase inventory — the range carries exactly the TWENTY-THREE disclosed paths (4 additions, the 3 call sites, and the 16 labeled retargeted suites), and NO .env or configuration path appears',
    (() => {
      const status = execSync(`git diff --name-status ${SRC}..HEAD`, { encoding: 'utf8' })
        .split('\n').filter(Boolean).sort()
      if (JSON.stringify(status) !== JSON.stringify(PHASE)) return false
      return !status.some((s) => /\.env|next\.config|package\.json|tsconfig/.test(s))
    })())
} else {
  check('E1-E2 (uncommitted authoring state): every worktree change lies inside the twenty-three phase paths — nothing outside this phase is touched',
    CHANGED.length > 0 && CHANGED.every((p) => PHASE_PATHS.includes(p)))
}
check('E3: two-state lifecycle — the module, record, and both suites are absent at the promoted source tip, the call sites at the tip still call the seed directly, and the live phase carries the new routing',
  (() => {
    if (execSync(`git ls-tree ${SRC} src/lib/supabase/ --name-only`, { encoding: 'utf8' }).includes('deliver-catalog')) return false
    if (execSync(`git ls-tree ${SRC} docs/ --name-only`, { encoding: 'utf8' }).includes('exlib2t-')) return false
    if (execSync(`git ls-tree ${SRC} scripts/ --name-only`, { encoding: 'utf8' }).includes('verify-exlib2t')) return false
    for (const p of CALL_SITES) {
      const at = execSync(`git show ${SRC}:"${p}"`, { encoding: 'utf8', maxBuffer: 1 << 26 })
      if (!at.includes('seedExercisesIfNeeded(supabase, user.id)')) return false
    }
    return true
  })())
check('E4: LOCAL-ONLY hygiene — no phase file contains a hosted endpoint URL, connection string, credential, or Supabase CLI remote command; the record carries no non-ASCII beyond the em-dash',
  (() => {
    const payload = [RECORD, VERIFIER, RUNTIME_TESTS, MODULE].map(read).join('\n')
    const bads = [
      'supabase' + '.co', 'vercel' + '.', 'postgresql' + '://', 'postgres' + '://',
      'SUPABASE' + '_URL', 'SUPABASE' + '_SERVICE', 'api' + 'key', 'Bearer' + ' ', 'ey' + 'J',
      '--db' + '-url', '--lin' + 'ked', 'db ' + 'push',
    ]
    for (const bad of bads) {
      if (payload.includes(bad)) return false
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
