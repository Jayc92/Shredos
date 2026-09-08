// EXLIB-2Y APPLICATION verification (LOCAL-ONLY): the hosted
// snapshot-review application EVIDENCE — the operator-supplied
// execution facts cross-checked mechanically against the promoted
// repository bytes. Performs NO hosted contact; every hosted fact
// is verified for INTERNAL and CROSS-RECORD consistency, never
// re-observed.
//
// Fail-closed: any mismatch fails the suite.
import { execSync } from 'child_process'
import { readFileSync } from 'fs'

let passed = 0
let failed = 0
const check = (name: string, ok: boolean, detail?: string): void => {
  if (ok) { passed += 1; console.log(`  PASS  ${name}`) }
  else { failed += 1; console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`) }
}
const read = (p: string): string => readFileSync(p, 'utf8')

const SRC = '5fc27b8d63e1a6498eb7866136b9f04647b8cab8'
const Y_TAG = 'exlib2y-snapshot-review-application-prep-reviewed-not-executed'
const Y_TAG_OBJ = '5df3edc2f7c465d8bd79f43a4079e7cc47bc174a'
const PKG = 'docs/exlib2y-snapshot-review-application-package.sql'
const PKG_SHA = '74934419d027b477933f01bcbd2f4984700b34c6416ecd9c43c64bbd528757e0'
const RECORD = 'docs/exlib2y-hosted-application-record.md'
const VERIFIER = 'scripts/verify-exlib2y-application.ts'
const PHASE_ADDS = [RECORD, VERIFIER].sort()
const RETARGETED = ['scripts/verify-exlib2y.ts']
const SLUGS = ['plank', 'dead-bug', 'ab-wheel-rollout'] as const
const decOf = (s: string): string => `docs/exlib2w-${s}-snapshot-review-form-v2-completed.json`
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const SNAP = {
  'plank': 'ca566325-8d0d-4152-a15d-63baa065ac1d',
  'dead-bug': '1ce09c1f-c13d-4231-8e12-6f35cfd761b5',
  'ab-wheel-rollout': 'c715d840-944b-4019-b984-1687accffcf4',
} as const
const EVENTS = {
  'plank': '33e180fb-e94f-485a-ba2b-b7aa9a974579',
  'dead-bug': '4d01df9d-8a4e-496b-b7e9-32529e12ffd8',
  'ab-wheel-rollout': '081f696a-f79b-4bd3-8c13-6b5669dc3022',
} as const

const rec = read(RECORD)
const recFlat = rec.replace(/\s+/g, ' ')
const decisions = Object.fromEntries(SLUGS.map((s) => [s, JSON.parse(read(decOf(s)))]))

console.log('EXLIB-2Y hosted-application evidence verification (LOCAL-ONLY; the package is SPENT; nothing re-observed, everything cross-checked)')

check('A1: the promoted sources and the SPENT posture — the executed package is byte-identical to its accepted fingerprint at the promoted candidate, the reviewed-not-executed tag is exact, and this record states SPENT — DO NOT RERUN with the one-use authority consumed',
  (() => {
    try {
      if (execSync(`git rev-parse refs/tags/${Y_TAG}`, { encoding: 'utf8' }).trim() !== Y_TAG_OBJ) return false
      if (execSync(`git rev-parse refs/tags/${Y_TAG}^{}`, { encoding: 'utf8' }).trim() !== SRC) return false
      const sha = execSync(`git cat-file blob ${SRC}:${PKG} | shasum -a 256`, { encoding: 'utf8', shell: '/bin/zsh' }).split(/\s+/)[0]
      if (sha !== PKG_SHA) return false
      const live = execSync(`shasum -a 256 "${PKG}"`, { encoding: 'utf8' }).split(/\s+/)[0]
      if (live !== PKG_SHA) return false
      return recFlat.includes('SPENT — DO NOT RERUN') && recFlat.includes('one-use authority is consumed')
        && recFlat.includes('Executed exactly once; no retry occurred')
    } catch { return false }
  })())
check('A2: every reported tuple fact equals the IMMUTABLE decision artifacts — reviewer Joseph Carfagno, all three APPROVE, and the reported hosted instant 2026-09-07T23:06:00Z is the SAME instant as the artifacts\' (and the package\'s) 2026-09-07T19:06:00-04:00 literal, proven by parse',
  (() => {
    for (const s of SLUGS) {
      const h = decisions[s].human_fields
      if (h.decision !== 'APPROVE' || h.reviewer !== 'Joseph Carfagno') return false
      if (Date.parse(h.reviewed_at) !== Date.parse('2026-09-07T23:06:00Z')) return false
    }
    return recFlat.includes('2026-09-07T23:06:00Z') &&
      recFlat.includes('2026-09-07T19:06:00-04:00') &&
      recFlat.includes('the same instant') &&
      recFlat.includes("Joseph Carfagno's exact human tuple")
  })())
check('A3: the reported vector transition equals the package\'s own pinned gates — pre 3/3/5/3/6/1/2/2/0/0/0 and post 3/3/5/3/6/1/2/2/0/0/3, both present in the record AND in the executed package bytes, and the result row (EXLIB-2Y APPLIED / 3 / 3) matches the package\'s surfaced SELECT',
  (() => {
    const pkg = read(PKG)
    if (!pkg.includes("'3/3/5/3/6/1/2/2/0/0/0'") || !pkg.includes("'3/3/5/3/6/1/2/2/0/0/3'")) return false
    if (!pkg.includes("'EXLIB-2Y APPLIED' AS result")) return false
    return recFlat.includes('3/3/5/3/6/1/2/2/0/0/0') &&
      recFlat.includes('3/3/5/3/6/1/2/2/0/0/3') &&
      recFlat.includes('EXLIB-2Y APPLIED with approved_snapshots = 3 and review_events = 3')
  })())
check('A4: surrogate CROSS-CONSISTENCY — the reported Dead bug and Ab wheel rollout hosted snapshot UUIDs equal the EXLIB-2O application record\'s preserved literals, and the reported Plank UUID equals the EXLIB-2Q application record\'s preserved literal (extracted from those promoted records, never restated)',
  (() => {
    const orec = read('docs/exlib2o-hosted-load-application-record.md')
    if (!orec.includes(SNAP['dead-bug']) || !orec.includes(SNAP['ab-wheel-rollout'])) return false
    const qrec = read('docs/exlib2q-hosted-admission-application-record.md')
    if (!qrec.includes(SNAP['plank'])) return false
    for (const s of SLUGS) {
      if (!recFlat.includes(SNAP[s])) return false
    }
    return true
  })())
check('A5: identity well-formedness and distinctness — all six reported hosted identities (three snapshots, three events) are well-formed UUIDs, mutually distinct, and each event UUID appears in the record exactly once',
  (() => {
    const all = [...Object.values(SNAP), ...Object.values(EVENTS)]
    if (new Set(all).size !== 6) return false
    for (const u of all) {
      if (!UUID_RE.test(u)) return false
      if (!recFlat.includes(u)) return false
    }
    for (const e of Object.values(EVENTS)) {
      if ((rec.match(new RegExp(e, 'g')) || []).length !== 1) return false
    }
    return true
  })())
check('A6: chronology — the database effect instant 2026-09-08T02:17:02.173075Z parses, FOLLOWS the closeout tag object\'s own tagger instant (mechanically read from the raw tag bytes) and the recorded tag-push instant, and precedes the post-proof completion instant',
  (() => {
    const ex = Date.parse('2026-09-08T02:17:02.173Z')
    const post = Date.parse('2026-09-08T02:17:50.698Z')
    if (!(Number.isFinite(ex) && ex < post)) return false
    if (!(ex > Date.parse('2026-09-08T02:08:45Z'))) return false
    const raw = execSync(`git cat-file tag refs/tags/${Y_TAG}`, { encoding: 'utf8' })
    const m = raw.match(/^tagger .* (\d+) [+-]\d{4}$/m)
    if (!m || !(ex > Number(m[1]) * 1000)) return false
    return recFlat.includes('2026-09-08T02:17:02.173075Z') && recFlat.includes('2026-09-08T02:17:50.698335Z')
      && recFlat.includes('2026-09-08T02:08:45Z')
  })())
check('A7: the provenance-note disclosure is present and correctly scoped — the record states the 2V/2W forms\' Plank not-preserved note was FACTUALLY WRONG at authoring time (the 2Q record had already preserved the surrogate), that the error is NON-GOVERNING and voids nothing, and the 2Q record genuinely predates the forms in promoted history',
  (() => {
    if (!recFlat.includes('FACTUALLY WRONG at authoring time')) return false
    if (!recFlat.includes('NON-GOVERNING and voids nothing')) return false
    if (!recFlat.includes('cited only the EXLIB-2K load record')) return false
    try {
      // the 2Q record was added in history strictly before the 2V forms
      const qAdd = execSync("git log --format=%H --diff-filter=A -- docs/exlib2q-hosted-admission-application-record.md | tail -1", { encoding: 'utf8', shell: '/bin/zsh' }).trim()
      const vAdd = execSync("git log --format=%H --diff-filter=A -- docs/exlib2v-plank-snapshot-review-form.json | tail -1", { encoding: 'utf8', shell: '/bin/zsh' }).trim()
      if (!qAdd || !vAdd) return false
      execSync(`git merge-base --is-ancestor ${qAdd} ${vAdd}`, { stdio: 'pipe' })
      return true
    } catch { return false }
  })())
check('A8: the record\'s boundary claims are truthful — executed by ChatGPT only (Claude performed no hosted contact), advisors observed not modified, NO run exists, nothing sealed, no delivery, no environment/seed/inventory/authority change, and the S4/S5/S6 gates still stand with the next milestone named',
  recFlat.includes('WAS EXECUTED ONCE') &&
  recFlat.includes('by ChatGPT under the') &&
  recFlat.includes('Claude performed no hosted contact') &&
  recFlat.includes('observed the hosted database advisors without modifying anything') &&
  recFlat.includes('NO import run exists') &&
  recFlat.includes('no delivery occurred') &&
  recFlat.includes('EXLIB-2U S4 staged-run') &&
  !recFlat.includes('run was created') &&
  !recFlat.includes('was sealed'))
// RETARGET (EXLIB-2U S4 staged-run preparation): this phase
// COMPLETED — the evidence record was accepted by Codex and closed
// out (published + promoted + tagged APPLIED — SPENT — NO RUN) — so
// its topology claims are anchored at the phase's own promoted tip,
// where they held and hold forever; the HEAD-relative form went
// stale at the first successor commit, the same completed-phase
// pattern as every predecessor (seventh instance).
const TIP2YE = '5fd7890233df728167a8a838a329ff14c04f0044'
{
  check('A9: topology, inventory, and hygiene — ONE plain single-parent commit at the promoted phase tip carrying exactly this record and this verifier plus ONLY the labeled retarget; the record\'s non-ASCII is the em-dash only; no credential or endpoint material',
    (() => {
      try {
        if (execSync(`git merge-base ${SRC} ${TIP2YE}`, { encoding: 'utf8' }).trim() !== SRC) return false
        const parents = execSync(`git rev-list --parents -n 1 ${TIP2YE}`, { encoding: 'utf8' }).trim().split(/\s+/)
        if (parents.length !== 2 || parents[1] !== SRC) return false
        if (execSync(`git rev-list --count ${SRC}..${TIP2YE}`, { encoding: 'utf8' }).trim() !== '1') return false
        const status = execSync(`git diff --name-status ${SRC}..${TIP2YE}`, { encoding: 'utf8' })
          .split('\n').filter(Boolean).sort()
        const expected = [
          ...PHASE_ADDS.map((p) => `A\t${p}`),
          ...RETARGETED.map((p) => `M\t${p}`),
        ].sort()
        if (JSON.stringify(status) !== JSON.stringify(expected)) return false
        for (const ch of rec) {
          const c = ch.codePointAt(0) as number
          if (c > 127 && c !== 0x2014) return false
          if (c < 32 && ch !== '\n') return false
        }
        const payload = PHASE_ADDS.map(read).join('\n')
        const bads = ['SUPABASE' + '_URL', 'SUPABASE' + '_SERVICE', 'api' + 'key', 'Bearer' + ' ', 'ey' + 'J',
          'CATALOG' + '_DELIVERY_' + 'ENABLED', 'CATALOG' + '_DELIVERY_' + 'RUN_KEY']
        return !bads.some((b) => payload.includes(b))
      } catch { return false }
    })())
}

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
