// ============================================================
// ForgeFitOS — W11 FAILURE LEDGER generator (W7.5-C), deterministic.
//
// Produces docs/weight-time-w11-failure-ledger.json (machine-readable) and
// docs/weight-time-w11-failure-ledger.md (rendered from the same data):
// for EVERY verifier check that is red on the committed tree BECAUSE of
// W4-W7, the verifier path, the exact check id/name, the exact observed
// failure line, its category, the FIRST W4-W7 commit at which that check
// fails (found by running the suite in disposable worktrees at each W-step
// commit), and the intended W11 disposition.
//
// HOW
//   1. Runs every scripts/verify-*.ts in a disposable worktree of HEAD (so
//      the measurement is always of a CLEAN committed tree, whatever the
//      main working tree holds) and collects its FAIL lines.
//   2. For each red suite, runs it in disposable worktrees at the W-step
//      commits PRE_W4 (795fe1ff) -> W4 -> W5 -> W6 -> W7 -> W8 -> W9 -> W10.
//      A check already red at PRE_W4 is PRE-EXISTING and is excluded from
//      the weight_time ledger (listed separately). Otherwise the first
//      commit at which the check's key fails is recorded.
//   3. Categorises each check by fixed textual rules PLUS the first red
//      commit: MIGRATION_INVENTORY_RETARGET, WEIGHT_TIME_BOUNDARY_RETARGET,
//      ROUTE_TEXT_RETARGET, AUDIT_COMPLETENESS_RETARGET,
//      HISTORICAL_PRODUCT_BOUNDARY_RETARGET (operator ruling at the W7.5
//      checkpoint: EXLIB-2F's "no product change" claim), UI_SURFACE_RETARGET
//      (the W10 user-facing pins), or OTHER_REQUIRES_REVIEW. Compound checks
//      that match more than one rule keep the category their first red
//      commit implies and list the other matching rules under `alsoMatches`.
//
// Check KEY = the FAIL text up to the first " — " (the detail separator
// most check() helpers use); the full observed line is recorded verbatim.
//
// Never contacts any remote service. Read-only on the repository except
// for writing the two ledger files. Run from the repository root:
//   npx tsx scripts/generate-weight-time-w11-ledger.ts
// ============================================================

import path from 'node:path'
import { createHash } from 'node:crypto'
import { execSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'

const repositoryRoot = process.cwd()
const TSX = process.argv[1].includes('tsx') ? process.argv[1] : `${process.env.HOME}/.npm/_npx/fd45a72a545557e9/node_modules/.bin/tsx`
const JSON_OUT = 'docs/weight-time-w11-failure-ledger.json'
const MD_OUT = 'docs/weight-time-w11-failure-ledger.md'

/** The W-step commits, oldest first. PRE_W4 is the accepted pre-W4 baseline (plan errata commit). */
const STEPS: Array<{ label: string; sha: string }> = [
  { label: 'PRE_W4', sha: '795fe1ff0d7ecd272742fe9f56177f79eabb7a01' },
  { label: 'W4', sha: '50e7451c9c2ed67053f1aac583187690350ce0f4' },
  { label: 'W5', sha: '365e9e3d708c6ff5f8acaa3834de48a514d10300' },
  { label: 'W6', sha: 'c785140f27e0169f7c2791c5988f74a7a2c87393' },
  { label: 'W7', sha: 'c22be37cf5b6ee4e4f8791cf4fe37b605b221da8' },
  // W8-W10 (the W7.5 checkpoint authorised these; the ledger is regenerated
  // from the clean committed W10 tree).
  { label: 'W8', sha: 'dc8f10b7ade3ee63c286f4e7ab7d2880cfd4f840' },
  { label: 'W9', sha: '69b7c7c9f918d663dc880d618498d17657931729' },
  { label: 'W10', sha: '97442e22f47b5802c1a9dbd37079bc8ff567ebe5' },
]

type Category = 'MIGRATION_INVENTORY_RETARGET' | 'WEIGHT_TIME_BOUNDARY_RETARGET' | 'ROUTE_TEXT_RETARGET' | 'AUDIT_COMPLETENESS_RETARGET' | 'HISTORICAL_PRODUCT_BOUNDARY_RETARGET' | 'UI_SURFACE_RETARGET' | 'OTHER_REQUIRES_REVIEW'
const RULES: Array<{ category: Category; pattern: RegExp }> = [
  { category: 'ROUTE_TEXT_RETARGET', pattern: /PATCH fetches the stored primary|Add Set keeps every tracking-mode validation/i },
  { category: 'AUDIT_COMPLETENESS_RETARGET', pattern: /appears verbatim in the audit|named in the audit/i },
  // OPERATOR RULING (W7.5 checkpoint approval, 2026-09-10): verify-exlib2f C1
  // "no product change" is HISTORICAL_PRODUCT_BOUNDARY_RETARGET, not
  // OTHER_REQUIRES_REVIEW — EXLIB-2F's claim remains true of its own tip and
  // W4 is a legitimate later product boundary. Applied by pattern so the
  // classification is deterministic and reproducible; W11 owns the retarget.
  { category: 'HISTORICAL_PRODUCT_BOUNDARY_RETARGET', pattern: /no product change/i },
  // W10 user-facing pins: exact JSX/expression/count pins on SetRow, the
  // exercise block, the detail client and the /progress tiles that the
  // approved weight_time UI necessarily moved.
  // "summary/PR pipeline untouched" (verify-phase5a2) pins the same
  // summarizeWorkout(exercises, prBaseline ?? {}) call that phase4b6a/b pin;
  // W10 passes the 2-D baseline as a third argument.
  { category: 'UI_SURFACE_RETARGET', pattern: /summary tiles derived|detail client behavior contract|completion summary computed only|warm-up toggle shown only|header aligns with the composition|per-mode copy fields exact|required fields per mode|execution behavior anchors|progress badges|summary\/PR pipeline untouched/i },
  { category: 'WEIGHT_TIME_BOUNDARY_RETARGET', pattern: /weight_time|planning-only boundary|NOT-APPLIED boundary|vocabular/i },
  { category: 'MIGRATION_INVENTORY_RETARGET', pattern: /migration|001-02\d|no 028|exactly 2\d\b|numbered migration|inventory/i },
]
const DISPOSITIONS: Record<Category, string> = {
  MIGRATION_INVENTORY_RETARGET: 'Preserve the historical migration-set claim against its historical commit (evaluate the inventory at the pinned tip, never at HEAD); admit the reviewed migration 028 — and only 028 — as the current-state boundary by exact filename; never rewrite the phase record to pretend 028 existed then; count-neutral.',
  WEIGHT_TIME_BOUNDARY_RETARGET: 'Preserve the historical zero-weight_time boundary against the historical tip (evaluate `weight_time` absence in the tree at the pinned commit object); add a current-state admission for the reviewed weight_time boundary whose live claim is owned by scripts/verify-tracking-mode-census.ts and the contract verifiers; count-neutral.',
  ROUTE_TEXT_RETARGET: 'Retarget only the exact changed behaviour (the exercises PATCH select now also reads tracking_mode; the set routes\' inline validation moved into src/lib/workout-set-contract.ts) and retain the historical source proof against the historical tip; count-neutral.',
  AUDIT_COMPLETENESS_RETARGET: 'The byte-frozen pre-implementation audit cannot name artifacts that post-date it; admit the post-audit artifact by exact path/name with proof of absence at the closeout tip 59e443ba (the pattern verify-exlib1c0b already applies three times, most recently W7.5-B D2); the historical completeness claim over pre-existing artifacts is preserved; count-neutral.',
  HISTORICAL_PRODUCT_BOUNDARY_RETARGET: 'Operator ruling (W7.5 checkpoint): EXLIB-2F\'s "no product change" claim remains TRUE of its own tip — evaluate the product-change predicate against the pinned EXLIB-2F commit object, never against HEAD; admit W4 (50e7451c) as a legitimate later product boundary authorised by the approved weight_time plan, by exact commit id; never rewrite the EXLIB-2F record; count-neutral. W11 owns the retarget; nothing is retargeted before W11.',
  UI_SURFACE_RETARGET: 'Preserve the historical UI claim against its historical tip (the exact pinned expression or count, evaluated at the pinned commit object); admit the W10 weight_time surface by the exact changed expression — the warm-up toggle reads the shared WARMUP_FORBIDDEN_MODES set, the completion summary receives the 2-D baseline map as a third argument, the column headers render from the exhaustive COLUMN_HEADERS map (a fifth RPE header), Apply eligibility and copy fields read MODE_APPLY_REQUIRED_FIELDS / MODE_COPY_FIELDS from the shared contract in both the route and the client, the Recent PRs tile counts the merged strength + Weight-time list; count-neutral.',
  OTHER_REQUIRES_REVIEW: 'Not deterministically classifiable by the fixed rules — operator review required before any retarget.',
}

interface Failure { suite: string; verifierPath: string; checkKey: string; observedFailure: string }
interface LedgerEntry extends Failure {
  category: Category
  alsoMatches: Category[]
  firstRedCommit: { label: string; sha: string }
  disposition: string
}

function runSuiteIn(directory: string, suite: string): { exitCode: number; failLines: string[]; summary: string } {
  const result = spawnSync(TSX, [`scripts/${suite}.ts`], { cwd: directory, encoding: 'utf8', env: { ...process.env, LC_ALL: 'C', LANG: 'C' } })
  const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`
  const failLines = output.split('\n').filter((line) => /^\s*FAIL\s/.test(line)).map((line) => line.trim())
  const summary = output.split('\n').filter((line) => /\d+ passed/.test(line)).pop()?.trim() ?? '(no summary)'
  return { exitCode: result.status ?? 1, failLines, summary }
}
const keyOf = (failLine: string): string => failLine.replace(/^FAIL\s+/, '').split(' — ')[0].trim()

function addWorktree(sha: string): string {
  // The worktree lives in <base>/repo and the node_modules link in <base>/,
  // its PARENT: Node's resolution walks up from the worktree and finds it,
  // while git inside the worktree never sees it. (A link inside the
  // worktree would show as untracked — `.gitignore`'s `node_modules/`
  // matches directories only — and trip every worktree-cleanliness check.)
  const base = `/tmp/w11-ledger-${sha.slice(0, 8)}`
  const directory = path.join(base, 'repo')
  rmSync(base, { recursive: true, force: true })
  execSync(`git -C "${repositoryRoot}" worktree prune`, { stdio: 'ignore' })
  mkdirSync(base, { recursive: true })
  execSync(`git -C "${repositoryRoot}" worktree add --detach "${directory}" ${sha}`, { stdio: 'ignore' })
  if (!existsSync(path.join(base, 'node_modules'))) symlinkSync(path.join(repositoryRoot, 'node_modules'), path.join(base, 'node_modules'))
  // verify-ui6c reads the Next build output (.next/static/css), which is not
  // in git. `.next/` IS an ignored directory pattern, so a REAL `.next`
  // directory inside the worktree stays invisible to git; its `static` entry
  // links to the repository's own build output (the same artifact the
  // main-tree run uses). Without this the suite crashes before its checks.
  const nextStatic = path.join(repositoryRoot, '.next', 'static')
  if (existsSync(nextStatic)) {
    mkdirSync(path.join(directory, '.next'), { recursive: true })
    symlinkSync(nextStatic, path.join(directory, '.next', 'static'))
  }
  const porcelain = execSync(`git -C "${directory}" status --porcelain`, { encoding: 'utf8' }).trim()
  if (porcelain !== '') throw new Error(`worktree at ${sha.slice(0, 8)} is not clean before measurement:\n${porcelain}`)
  return directory
}
function removeWorktree(directory: string): void {
  try { execSync(`git -C "${repositoryRoot}" worktree remove --force "${directory}"`, { stdio: 'ignore' }) } catch { /* fall through */ }
  rmSync(path.dirname(directory), { recursive: true, force: true })
  execSync(`git -C "${repositoryRoot}" worktree prune`, { stdio: 'ignore' })
}

function main(): number {
  const headSha = execSync(`git -C "${repositoryRoot}" rev-parse HEAD`, { encoding: 'utf8' }).trim()
  console.log(`W11 failure ledger generation at HEAD ${headSha}`)
  const suites = readdirSync(path.join(repositoryRoot, 'scripts')).filter((name) => /^verify-.*\.ts$/.test(name)).map((name) => name.replace(/\.ts$/, '')).sort()

  console.log(`1. running ${suites.length} suites in a clean worktree of HEAD ...`)
  const headTree = addWorktree(headSha)
  const redAtHead: Array<{ suite: string; failures: Failure[]; summary: string }> = []
  const greenAtHead: string[] = []
  // A suite that exits non-zero WITHOUT any FAIL line crashed before its
  // checks (an environmental dependency, a thrown error). It is surfaced
  // here, never silently dropped, and fails the generation.
  const crashed: Array<{ suite: string; verifierPath: string; tail: string }> = []
  try {
    for (const suite of suites) {
      const run = runSuiteIn(headTree, suite)
      if (run.exitCode === 0 && run.failLines.length === 0) { greenAtHead.push(suite); continue }
      if (run.failLines.length === 0) { crashed.push({ suite, verifierPath: `scripts/${suite}.ts`, tail: run.summary }); continue }
      redAtHead.push({ suite, summary: run.summary, failures: run.failLines.map((line) => ({ suite, verifierPath: `scripts/${suite}.ts`, checkKey: keyOf(line), observedFailure: line })) })
    }
  } finally { removeWorktree(headTree) }
  console.log(`   red at HEAD: ${redAtHead.length} suites, ${redAtHead.reduce((n, s) => n + s.failures.length, 0)} failing checks; crashed without a FAIL line: ${crashed.length}`)

  console.log(`2. bisecting each red suite across ${STEPS.map((s) => s.label).join(' -> ')} ...`)
  const trees = STEPS.map((step) => ({ ...step, directory: addWorktree(step.sha) }))
  const entries: LedgerEntry[] = []
  const preExisting: Array<Failure & { redAt: string }> = []
  const unattributed: Failure[] = []
  try {
    for (const red of redAtHead) {
      // Which check keys fail at each step (a suite may not exist at earlier steps: treat as green there).
      const failingKeysByStep = trees.map((tree) => {
        if (!existsSync(path.join(tree.directory, 'scripts', `${red.suite}.ts`))) return new Set<string>()
        return new Set(runSuiteIn(tree.directory, red.suite).failLines.map(keyOf))
      })
      for (const failure of red.failures) {
        if (failingKeysByStep[0].has(failure.checkKey)) { preExisting.push({ ...failure, redAt: STEPS[0].label }); continue }
        const firstIndex = failingKeysByStep.findIndex((keys, index) => index > 0 && keys.has(failure.checkKey))
        if (firstIndex < 0) { unattributed.push(failure); continue }
        const matches = RULES.filter((rule) => rule.pattern.test(failure.observedFailure)).map((rule) => rule.category)
        const first = STEPS[firstIndex]
        // Category: the first red commit decides between compound matches.
        let category: Category
        if (matches.includes('ROUTE_TEXT_RETARGET') && first.label === 'W7') category = 'ROUTE_TEXT_RETARGET'
        else if (matches.includes('AUDIT_COMPLETENESS_RETARGET')) category = 'AUDIT_COMPLETENESS_RETARGET'
        else if (matches.includes('HISTORICAL_PRODUCT_BOUNDARY_RETARGET') && first.label === 'W4') category = 'HISTORICAL_PRODUCT_BOUNDARY_RETARGET'
        else if (matches.includes('UI_SURFACE_RETARGET') && first.label === 'W10') category = 'UI_SURFACE_RETARGET'
        else if (matches.includes('WEIGHT_TIME_BOUNDARY_RETARGET') && first.label === 'W4') category = 'WEIGHT_TIME_BOUNDARY_RETARGET'
        else if (matches.includes('MIGRATION_INVENTORY_RETARGET') && first.label === 'W6') category = 'MIGRATION_INVENTORY_RETARGET'
        else if (matches.length === 1) category = matches[0]
        else category = 'OTHER_REQUIRES_REVIEW'
        entries.push({ ...failure, category, alsoMatches: matches.filter((m) => m !== category), firstRedCommit: { label: first.label, sha: first.sha }, disposition: DISPOSITIONS[category] })
      }
    }
  } finally { for (const tree of trees) removeWorktree(tree.directory) }

  entries.sort((a, b) => a.suite.localeCompare(b.suite) || a.checkKey.localeCompare(b.checkKey))
  const byCategory = (category: Category) => entries.filter((entry) => entry.category === category)
  const ledger = {
    generatedAtCommit: headSha,
    generatedFrom: 'a clean disposable worktree of HEAD; bisected across PRE_W4/W4/W5/W6/W7/W8/W9/W10 worktrees',
    steps: STEPS,
    totals: {
      suitesRedAtHead: redAtHead.length,
      weightTimeCausedSuites: new Set(entries.map((entry) => entry.suite)).size,
      weightTimeCausedChecks: entries.length,
      byCategory: {
        MIGRATION_INVENTORY_RETARGET: byCategory('MIGRATION_INVENTORY_RETARGET').length,
        WEIGHT_TIME_BOUNDARY_RETARGET: byCategory('WEIGHT_TIME_BOUNDARY_RETARGET').length,
        ROUTE_TEXT_RETARGET: byCategory('ROUTE_TEXT_RETARGET').length,
        AUDIT_COMPLETENESS_RETARGET: byCategory('AUDIT_COMPLETENESS_RETARGET').length,
        HISTORICAL_PRODUCT_BOUNDARY_RETARGET: byCategory('HISTORICAL_PRODUCT_BOUNDARY_RETARGET').length,
        UI_SURFACE_RETARGET: byCategory('UI_SURFACE_RETARGET').length,
        OTHER_REQUIRES_REVIEW: byCategory('OTHER_REQUIRES_REVIEW').length,
      },
      preExistingAtPreW4Checks: preExisting.length,
      unattributedChecks: unattributed.length,
      crashedSuites: crashed.length,
      greenSuites: greenAtHead.length,
    },
    environmentNotes: [
      'Suites run with LC_ALL=C LANG=C.',
      'Each worktree sees the repository\'s node_modules through a link in its PARENT directory (invisible to git) and the Next build output through an ignored real .next/ directory linking to .next/static; verify-ui6c reads .next/static/css.',
    ],
    entries,
    preExistingAtPreW4: preExisting,
    unattributed,
    crashed,
    greenSuites: greenAtHead,
  }
  const json = JSON.stringify(ledger, null, 2) + '\n'
  writeFileSync(path.join(repositoryRoot, JSON_OUT), json)

  const lines: string[] = []
  lines.push('# weight_time — W11 failure ledger (generated)', '', `Generated by \`scripts/generate-weight-time-w11-ledger.ts\` at commit \`${headSha}\` from a clean disposable worktree of HEAD, bisected across ${STEPS.map((s) => `${s.label} \`${s.sha.slice(0, 8)}\``).join(', ')}. **Do not edit by hand — regenerate.** The JSON twin is the machine-readable source of truth.`, '')
  lines.push('## Totals', '', `| Measure | Value |`, `|---|---|`, `| Suites red at HEAD | ${ledger.totals.suitesRedAtHead} |`, `| Suites red because of W4–W7 | ${ledger.totals.weightTimeCausedSuites} |`, `| Failing checks caused by W4–W7 | ${ledger.totals.weightTimeCausedChecks} |`,
    ...Object.entries(ledger.totals.byCategory).map(([category, count]) => `| ${category} | ${count} |`),
    `| Pre-existing at PRE_W4 (excluded) | ${ledger.totals.preExistingAtPreW4Checks} |`, `| Unattributed (must be zero) | ${ledger.totals.unattributedChecks} |`, `| Green suites | ${ledger.totals.greenSuites} |`, '')
  lines.push('## Dispositions', '', ...Object.entries(DISPOSITIONS).map(([category, text]) => `- **${category}** — ${text}`), '')
  lines.push('## Entries (one row per failing check)', '', '| Verifier | Check | First red | Category | Also matches | Observed failure |', '|---|---|---|---|---|---|')
  for (const entry of entries) lines.push(`| \`${entry.verifierPath}\` | ${entry.checkKey.replace(/\|/g, '\\|')} | ${entry.firstRedCommit.label} \`${entry.firstRedCommit.sha.slice(0, 8)}\` | ${entry.category} | ${entry.alsoMatches.join(', ') || '—'} | ${entry.observedFailure.replace(/\|/g, '\\|').slice(0, 220)} |`)
  if (preExisting.length > 0) { lines.push('', '## Pre-existing at PRE_W4 (excluded from the weight_time ledger)', '', ...preExisting.map((f) => `- \`${f.verifierPath}\` — ${f.checkKey}`)) }
  if (unattributed.length > 0) { lines.push('', '## UNATTRIBUTED (STOP — classify before W11)', '', ...unattributed.map((f) => `- \`${f.verifierPath}\` — ${f.observedFailure}`)) }
  if (crashed.length > 0) { lines.push('', '## CRASHED WITHOUT A FAIL LINE (STOP — environmental or thrown error)', '', ...crashed.map((c) => `- \`${c.verifierPath}\` — ${c.tail}`)) }
  writeFileSync(path.join(repositoryRoot, MD_OUT), lines.join('\n') + '\n')

  console.log(`3. written ${JSON_OUT} (sha256 ${createHash('sha256').update(json).digest('hex')}) and ${MD_OUT}`)
  console.log(`   weight_time-caused: ${ledger.totals.weightTimeCausedSuites} suites / ${ledger.totals.weightTimeCausedChecks} checks; by category ${JSON.stringify(ledger.totals.byCategory)}; pre-existing excluded ${preExisting.length}; unattributed ${unattributed.length}; crashed ${crashed.length}`)
  return unattributed.length === 0 && crashed.length === 0 ? 0 : 1
}

process.exit(main())
