// EXLIB-2M APPLICATION-RECORD verifier — hosted migration 027 was
// applied by the authorized operator path (ChatGPT; never Claude).
//
// Proves LOCALLY, with no hosted contact: the application facts are
// pinned verbatim (hosted history entry, UTC/Eastern timing, the
// pre-application recovery point, ShredOS ref, applied-by
// attribution); the applied artifact is byte-frozen (candidate,
// reviewed proposal, apply-prep record) with the executable-body
// equivalence recomputed; every structural fact in the
// ChatGPT-confirmed proof is cross-checked mechanically against the
// applied candidate's SQL (four NOLOGIN roles, six operational
// functions with one owning role each, SECURITY DEFINER + fixed
// search_path on all six, three RLS-enabled zero-policy tables with
// no client DML); the data-state facts are recorded WITH attribution
// (zero rows in all three tables; zero logical/snapshot/run/item
// counts; exercises 84; no lifecycle mutation); the product boundary
// holds; the prepared-not-applied retarget is labeled and anchored
// to the apply-prep tip; and the phase inventory is exact.
//
// Fail-closed: any mismatch fails the suite.
import { execSync } from 'child_process'
import { createHash } from 'crypto'
import { readFileSync } from 'fs'

let passed = 0
let failed = 0
const check = (name: string, ok: boolean, detail?: string): void => {
  if (ok) { passed += 1; console.log(`  PASS  ${name}`) }
  else { failed += 1; console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`) }
}
const read = (p: string): string => readFileSync(p, 'utf8')
const sha256 = (p: string): string => createHash('sha256').update(readFileSync(p)).digest('hex')
const shaText = (s: string): string => createHash('sha256').update(Buffer.from(s, 'utf8')).digest('hex')
const parseJsonl = (p: string): any[] => read(p).split('\n')
  .filter((l) => l.trim() && !l.trim().startsWith('#')).map((l) => JSON.parse(l))

const RECORD = 'docs/exlib2m-migration-027-application-record.md'
const VERIFIER = 'scripts/verify-exlib2m-application.ts'
const CANDIDATE = 'supabase/migrations/027_exlib_catalog_content_schema.sql'
const PROPOSAL = 'docs/exlib2l-catalog-content-schema-proposal.sql'
const APPLY_PREP_TIP = '66905d7464d3f9cc84bb07a3dc8f2062ac6b7745'
const HISTORY_ENTRY = '20260902194541_exlib_catalog_content_schema_027'
const CANDIDATE_SHA = '90d53aaf8fd341dd99bab22b7d1ca280ec24b8ccee2a28efca6e835e0585a14f'
const PROPOSAL_SHA = '9a0505c8f2fea3f4330e7c80e22ffd8bc6867760b335a7468ea4587f0bd70553'
const BODY_SHA = 'ba28780f9544b1d3169938116d9babcc58bbcbe05218989e44bfae347793544f'
const PHASE_NEW = [RECORD, VERIFIER].sort()
const PHASE_ALL = [...PHASE_NEW, 'scripts/verify-exlib2m.ts'].sort()

const rec = read(RECORD)
const recFlat = rec.replace(/\s+/g, ' ')
const cand = read(CANDIDATE)
const candFlat = cand.replace(/\s+/g, ' ')
const bodyOf = (s: string): string => {
  const ls = s.split('\n')
  const i = ls.findIndex((l) => l.trim() !== '' && !l.trim().startsWith('--'))
  return ls.slice(i).join('\n')
}
const frozenVsTip = (p: string): boolean =>
  execSync(`git hash-object "${p}"`, { encoding: 'utf8' }).trim() ===
  execSync(`git rev-parse "${APPLY_PREP_TIP}:${p}"`, { encoding: 'utf8' }).trim()

async function main(): Promise<void> {
  console.log('EXLIB-2M application-record verification (hosted 027 applied by the authorized path)')

  console.log('\nA. Application facts and the applied artifact')
  {
    check('A1: applied artifact and sources byte-frozen — the candidate (65,455 B / 90d53aaf...), the reviewed proposal (78,468 B / 9a0505c8...), and the apply-prep record hold their exact promoted fingerprints; the apply-prep tip and its reviewed-not-applied tag are intact ancestors; and the executable-body equivalence is RECOMPUTED (63,180 B / ba28780f... both sides)',
      (() => {
        try {
          execSync(`git merge-base --is-ancestor ${APPLY_PREP_TIP} HEAD`, { stdio: 'pipe' })
          if (execSync('git rev-parse exlib2m-migration-027-apply-prep-reviewed-not-applied^{}',
            { encoding: 'utf8' }).trim() !== APPLY_PREP_TIP) return false
          if (execSync('git rev-parse exlib2m-migration-027-apply-prep-reviewed-not-applied',
            { encoding: 'utf8' }).trim() !== '51965199307b1d8d7db3920736d559d2ecab5ae5') return false
        } catch { return false }
        const mb = bodyOf(cand)
        const pb = bodyOf(read(PROPOSAL))
        return readFileSync(CANDIDATE).length === 65455 && sha256(CANDIDATE) === CANDIDATE_SHA &&
          readFileSync(PROPOSAL).length === 78468 && sha256(PROPOSAL) === PROPOSAL_SHA &&
          sha256('docs/exlib2m-migration-027-apply-prep-record.md') === '5b24c7309f23c2f648c14589b910b0bbd48dde40ca86c8f2561dc6181d8b4b5c' &&
          mb === pb && Buffer.byteLength(mb, 'utf8') === 63180 && shaText(mb) === BODY_SHA
      })())
    check('A2: application facts pinned verbatim — the hosted history entry, applied-by-ChatGPT (never Claude), ShredOS ref ONLY, both timestamps (2026-09-02 19:45:41 UTC = 15:45:41 Eastern), the pre-application recovery point (2026-09-01 13:09:47 UTC), the candidate/proposal/body fingerprints, the byte-change-voids clause, and the no-hosted-contact attribution',
      rec.includes(HISTORY_ENTRY) &&
      recFlat.includes('Applied by: ChatGPT') &&
      recFlat.includes('never by Claude') &&
      recFlat.includes('ttybyljytiwntvorugcv ONLY') &&
      recFlat.includes('2026-09-02 19:45:41 UTC = 2026-09-02 15:45:41 Eastern') &&
      recFlat.includes('Pre-application physical recovery point: 2026-09-01 13:09:47 UTC') &&
      rec.includes(CANDIDATE_SHA) && rec.includes(PROPOSAL_SHA) && rec.includes(BODY_SHA) &&
      rec.includes(APPLY_PREP_TIP) &&
      rec.includes('51965199307b1d8d7db3920736d559d2ecab5ae5') &&
      recFlat.includes('any byte change would void the reviewed/applied status') &&
      recFlat.includes('The hosted application and every hosted check were performed by ChatGPT, NOT by Claude') &&
      recFlat.includes('Claude made no hosted contact in this phase and never applies migrations'))
    check('A3: repository sequence vs hosted history precisely distinguished — repository 001-027 in effect; the hosted migration-history TABLE is a different object; the new entry joins the five verbatim EXLIB-2F-evidenced entries for six total, stated as derived',
      recFlat.includes('REPOSITORY schema/migration sequence effective on hosted ShredOS is now 001-027') &&
      recFlat.includes("Supabase's hosted migration-history TABLE is a different object") &&
      rec.includes('20260901032229_exlib_plank_seed_reconciliation_026') &&
      rec.includes('20260813034632_phase5b2_nutrition_day_status') &&
      recFlat.includes('six entries in total, derived from that committed evidence plus this operator-provided entry') &&
      (() => {
        const files = execSync('ls supabase/migrations', { encoding: 'utf8' }).split('\n').filter((f) => f.endsWith('.sql'))
        return files.length === 27 && files.filter((f) => f.startsWith('027')).length === 1 &&
          !files.some((f) => f.startsWith('028'))
      })())
  }

  console.log('\nB. Structural proof cross-checked against the applied SQL')
  {
    check('B1: all four operational roles are created NOLOGIN with pg_roles guards in the applied SQL, exactly as the hosted proof states',
      ['exlib_catalog_loader', 'exlib_catalog_reviewer', 'exlib_catalog_admission', 'exlib_catalog_admin']
        .every((r) => candFlat.includes(`CREATE ROLE ${r} NOLOGIN`) &&
          candFlat.includes(`IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${r}')`)) &&
      recFlat.includes('All four operational roles exist and are NOLOGIN'))
    check('B2: all six operational functions have the exact intended authority grants in the applied SQL — 6 GRANTs, one owning role each (loader x3, reviewer/admission/publication x1), 27 REVOKEs, no client grantee — matching the hosted 0-mismatch/42-combination ACL proof',
      (() => {
        const grants = cand.match(/^GRANT .*/gm) ?? []
        return grants.length === 6 &&
          grants.filter((g) => g.includes('TO exlib_catalog_loader')).length === 3 &&
          grants.filter((g) => g.includes('TO exlib_catalog_reviewer')).length === 1 &&
          grants.filter((g) => g.includes('TO exlib_catalog_admission')).length === 1 &&
          grants.filter((g) => g.includes('TO exlib_catalog_admin;')).length === 1 &&
          !grants.some((g) => /TO (PUBLIC|anon|authenticated)/.test(g)) &&
          !cand.includes('service' + '_role') &&
          (cand.match(/^REVOKE /gm) ?? []).length === 27 &&
          recFlat.includes('The ACL matrix had 0 mismatches across 42 function/role combinations')
      })())
    check('B3: all six operational functions are SECURITY DEFINER with the fixed search_path in the applied SQL (and 13/13 functions overall pin it), exactly as the hosted proof states',
      (() => {
        const defs = cand.split('CREATE OR REPLACE FUNCTION').slice(1)
        const byName = (n: string) => defs.find((d) => d.trimStart().startsWith(n))
        const six = ['load_catalog_identity', 'load_catalog_snapshot', 'load_catalog_content_draft',
          'apply_content_review', 'admit_catalog_content', 'publish_catalog_content']
        return six.every((n) => {
          const d = byName(n)
          return !!d && d.slice(0, 700).includes('SECURITY DEFINER') &&
            d.slice(0, 700).includes('SET search_path = public, pg_temp')
        }) &&
          (cand.match(/SET search_path = public, pg_temp/g) ?? []).length === 13 &&
          recFlat.includes('All six functions are SECURITY DEFINER with fixed search_path = public, pg_temp')
      })())
    check('B4: the three catalog-content tables exist in the applied SQL with RLS ENABLED, zero policies, and REVOKE ALL from client roles, exactly as the hosted proof states',
      ['exercise_catalog_content', 'exercise_catalog_content_expected_relationships', 'exercise_catalog_relationships']
        .every((t) => cand.includes(`CREATE TABLE ${t} (`) &&
          candFlat.includes(`ALTER TABLE ${t} ENABLE ROW LEVEL SECURITY;`) &&
          candFlat.includes(`REVOKE ALL ON TABLE ${t} FROM PUBLIC, anon, authenticated;`)) &&
      !cand.includes('CREATE POLICY') &&
      recFlat.includes('Row Level Security ENABLED and ZERO policies'))
    check('B5: the zero-data facts are structurally consistent with the applied SQL (no line-leading DML outside function bodies — the migration cannot write rows) and are recorded WITH ChatGPT attribution (three tables zero rows; logical/snapshot/run/item zero; exercises exactly 84; no lifecycle mutation)',
      (() => {
        const stripped = cand
          .replace(/\$do\$[\s\S]*?\$do\$/g, '')
          .replace(/\$\$[\s\S]*?\$\$/g, '')
          .split('\n').filter((l) => !l.trim().startsWith('--')).join('\n')
        return !/^\s*(INSERT|UPDATE|DELETE|COPY|TRUNCATE)\b/im.test(stripped) &&
          recFlat.includes('contain ZERO rows') &&
          recFlat.includes('Logical-identity, snapshot, import-run, and run-item counts remain ZERO') &&
          recFlat.includes('exercises remains exactly 84') &&
          recFlat.includes('Nothing was loaded, reviewed, admitted, published, sealed, delivered, revoked, or otherwise lifecycle-mutated') &&
          recFlat.includes("recorded on ChatGPT's operator-path authority")
      })())
  }

  console.log('\nC. Boundaries, retarget lifecycle, and phase inventory')
  {
    check('C1: product boundary unchanged — seed, inventory (Plank seed_link_compatible false), ledger 48/48 pending-null, legacy eligibility 26/26 false, and the admitted Plank artifact (2,928 B / d8207849..., approved by Nick Tkacz, import_eligible true, review_status proposed) all blob-identical to the apply-prep tip',
      (() => {
        for (const p of ['src/lib/supabase/seed-exercises.ts', 'docs/exlib2b-release1-inventory.jsonl',
          'docs/exlib1b1-review-ledger.jsonl', 'docs/exlib1c0a-equipment-resolution.jsonl',
          'docs/exlib2g-plank-content.jsonl', 'package.json']) {
          if (!frozenVsTip(p)) return false
        }
        const inv = parseJsonl('docs/exlib2b-release1-inventory.jsonl')
        const plank = inv.filter((r: any) => r.proposed_canonical_name === 'Plank')
        if (plank.length !== 1 || plank[0].seed_link_compatible !== false) return false
        const led = parseJsonl('docs/exlib1b1-review-ledger.jsonl')
        if (led.length !== 48 || !led.every((r: any) => r.status === 'pending' && r.reviewer === null)) return false
        const cands = parseJsonl('docs/exlib1c0a-equipment-resolution.jsonl').flatMap((r: any) => r.canonical_candidates)
        if (cands.length !== 26 || !cands.every((c: any) => c.import_eligible === false)) return false
        const cur = parseJsonl('docs/exlib2g-plank-content.jsonl')[0]
        return readFileSync('docs/exlib2g-plank-content.jsonl').length === 2928 &&
          sha256('docs/exlib2g-plank-content.jsonl') === 'd82078490efa9ef13e128e7b7b742fbda8ea9e74e32382252d96c326c679d752' &&
          cur.import_eligible === true && cur.content_review.status === 'approved' &&
          cur.review_status === 'proposed'
      })())
    check('C2: the prepared-not-applied retarget is labeled and anchored — verify-exlib2m.ts carries RETARGET (EXLIB-2M application record) anchored to the apply-prep tip, whose tree PROVABLY contains no application record, while exactly this one application record exists in the live tree',
      (() => {
        const m2 = read('scripts/verify-exlib2m.ts')
        if (!m2.includes('RETARGET (EXLIB-2M application record)')) return false
        if (!m2.includes("git ls-tree 66905d7464d3f9cc84bb07a3dc8f2062ac6b7745 docs/ --name-only")) return false
        const tipDocs = execSync(`git ls-tree ${APPLY_PREP_TIP} docs/ --name-only`, { encoding: 'utf8' })
        if (tipDocs.includes('exlib2m-migration-027-application-record')) return false
        return execSync('ls docs | grep -c "exlib2m-migration-027-application-record" || true',
          { encoding: 'utf8' }).trim() === '1' &&
          recFlat.includes('no historical proof was weakened')
      })())
    check('C3: the record states what the application did NOT do and the gated dependency map — no catalog/lifecycle state, EXLIB-2K still DEFERRED as its own reviewed milestone, seed/inventory flips remain later coordinated facts, and this record approves nothing further',
      recFlat.includes('This record itself approves NOTHING further') &&
      recFlat.includes('No catalog identity, snapshot, anatomy row, alias, content version, expected relationship, live relationship, import run, run item, review decision, admission, publication, seal, revocation, or delivery exists or occurred') &&
      recFlat.includes('EXLIB-2K (the Plank catalog LOAD) remains DEFERRED') &&
      recFlat.includes('loading is its own separately gated, reviewed milestone') &&
      recFlat.includes('push/promotion/tag are separate explicit gates'))
    check('G1: lifecycle-safe phase boundary — the phase adds exactly two paths (this record, this verifier) and modifies exactly the retargeted verify-exlib2m.ts; strict porcelain while uncommitted, adder-anchored once committed',
      (() => {
        try {
          const inHead = (() => {
            try { execSync(`git cat-file -e HEAD:${RECORD}`, { stdio: 'pipe' }); return true } catch { return false }
          })()
          if (!inHead) {
            const entries = execSync('git status --porcelain', { encoding: 'utf8' })
              .split('\n').filter(Boolean).map((l) => l.trim()).sort()
            const expected = [...PHASE_NEW.map((f) => `?? ${f}`), 'M scripts/verify-exlib2m.ts'].sort()
            if (JSON.stringify(entries) !== JSON.stringify(expected)) return false
            return execSync('git diff --cached --name-only', { encoding: 'utf8' }).trim() === ''
          }
          const adders = new Set<string>()
          for (const p of PHASE_NEW) {
            const a = execSync(`git log --all --format=%H --diff-filter=A -- "${p}"`,
              { encoding: 'utf8' }).split('\n').filter(Boolean)
            if (a.length !== 1) return false
            adders.add(a[0])
          }
          if (adders.size !== 1) return false
          const phase = Array.from(adders)[0]
          execSync(`git merge-base --is-ancestor ${phase} HEAD`)
          execSync(`git merge-base --is-ancestor ${APPLY_PREP_TIP} ${phase}`)
          const range = execSync(`git diff --name-only ${APPLY_PREP_TIP}..${phase}`, { encoding: 'utf8' })
            .split('\n').filter(Boolean).sort()
          return JSON.stringify(range) === JSON.stringify(PHASE_ALL)
        } catch { return false }
      })())
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
