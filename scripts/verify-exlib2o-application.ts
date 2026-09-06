// EXLIB-2O hosted target-snapshot load APPLICATION-EVIDENCE verifier
// (LOCAL-ONLY).
//
// Owns the executed-state posture: the reviewed Dead bug + Ab wheel
// rollout target-snapshot load package (39,230 B / 4c0d74f9...) was
// executed ONCE against hosted ShredOS by ChatGPT (never Claude) on
// 2026-09-04 and committed. Proves: exact source refs and byte-frozen
// fingerprints; the execution facts pinned verbatim with ChatGPT
// attribution and the pre-execution recovery point; the
// operator-confirmed pre- and post-execution state cross-checked
// mechanically against the executed package's OWN fail-closed gates
// and the promoted admitted authoring artifacts; the execution-output
// precision (the hosted response surfaced ONLY the final loader
// result — no Dead bug loader payload exists and none is fabricated);
// the target-snapshot-gate evidence/adjudication distinction; the
// grantor-included authority restoration; advisor evidence precision
// (no globally-clean claim); boundary freezes; and the lifecycle
// two-state check with the labeled retarget of the load-prep suite's
// HEAD topology.
// Performs NO hosted contact: every fact here is read from committed
// files, the git object store, and the operator-authored record.
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
const jsonLine = (p: string, n: number): any => JSON.parse(read(p).split('\n')[n - 1])

const RECORD = 'docs/exlib2o-hosted-load-application-record.md'
const PACKAGE = 'docs/exlib2o-target-snapshot-load-package.sql'
const PREP_RECORD = 'docs/exlib2o-target-snapshot-load-prep-record.md'
const VERIFIER = 'scripts/verify-exlib2o-application.ts'
const RETARGETED = 'scripts/verify-exlib2o.ts'
const LIVE = 'scripts/verify-exlib2o-live.sh'
const B02 = 'docs/exlib2c-release1-batch02-content.jsonl'
const B04 = 'docs/exlib2c-release1-batch04-content.jsonl'
const DB_FORM = 'docs/exlib2n-dead-bug-target-snapshot-review-form-completed.json'
const AW_FORM = 'docs/exlib2n-ab-wheel-rollout-target-snapshot-review-form-completed.json'
const SOURCE_TIP = '632ef40f448c49e07bb7569fd6cd29cc14e62c1b'
const SOURCE_TREE = 'ebe875778a4c76a5fac5e022a2a9f455163db1a7'
const TAG = 'exlib2o-target-snapshot-load-prep-reviewed-not-executed'
const TAG_OBJ = '7939f4a11d337756c80b9af57b9cf8d6137c1799'
const TAG_MSG = 'EXLIB-2O target-snapshot load package reviewed — PREPARED — NOT EXECUTED\n'
const PKG_SHA = '4c0d74f942da4e92efab5923a435512c750c6d794077804ffeee8c0c305c966d'
const ARTIFACT_SHA = 'd82078490efa9ef13e128e7b7b742fbda8ea9e74e32382252d96c326c679d752'
const MIGRATION_SHA = '90d53aaf8fd341dd99bab22b7d1ca280ec24b8ccee2a28efca6e835e0585a14f'
const PKG2K_SHA = 'a1b6dd55850c5d544e2f484d1ce4833b41deec7f3dd4d4c2373cb3b50daaccf0'
const DBU = 'e21b2c00-0000-4000-a000-000000000002'
const AW = 'e21b2c00-0000-4000-a000-000000000003'
const DB_SNAP = '1ce09c1f-c13d-4231-8e12-6f35cfd761b5'
const AW_SNAP = 'c715d840-944b-4019-b984-1687accffcf4'
const T_START = '2026-09-04T23:16:17.547Z'
const T_FINISH = '2026-09-04T23:16:19.483Z'
const T_BACKUP = '2026-09-04 13:09:27 UTC'
const LABEL = 'RETARGET (EXLIB-2O hosted-execution evidence)'
const PRE_VECTOR = '3/1/2/2/3/1/2/0/0/0/0'
const POST_VECTOR = '3/3/5/3/6/1/2/0/0/0/0'
// The package's authoritative eleven-table vector order (Codex
// correction round 1 pins it here once; C7 proves it EXTRACTED from
// both of the package's own vector-building queries rather than
// trusting this constant alone).
const CANON_ORDER = ['exercise_catalog_logical', 'exercise_catalog', 'exercise_catalog_muscles',
  'exercise_catalog_aliases', 'exercise_catalog_name_claims', 'exercise_catalog_content',
  'exercise_catalog_content_expected_relationships', 'exercise_catalog_relationships',
  'exercise_catalog_import_runs', 'exercise_catalog_run_items', 'exercise_catalog_review_events']
const R1 = '16b8ab0c0e95b0aceff2ed0c2540399651dc0ff6'
const R1_TREE = '2f706e99bd5fd1f9882a66e488aaeb3b763153d7'
// RETARGET (EXLIB-2P Plank database-review preparation): this suite
// proves the EVIDENCE milestone, which was promoted as main = EV_TIP;
// the EXLIB-2P preparation then legitimately advances HEAD, so E5's
// correction-topology proof is anchored to the promoted evidence tip
// — where it was and remains true — instead of HEAD. The tip's tree
// is pinned so a rewrite still fails here.
const EV_TIP = '442b6247ad2f4b95ce58a1c2ed72df2ca84aff63'
const EV_TREE = 'aee2a0c72c2fdcd8b9aa8f505c71cbf235e42252'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

const rec = read(RECORD)
const recFlat = rec.replace(/\s+/g, ' ')
const recSolid = rec.replace(/\s+/g, '')
const pkg = read(PACKAGE)
const pkgFlat = pkg.replace(/\s+/g, ' ')
const lit = (tag: string): string | null => {
  const m = pkg.match(new RegExp(`\\$${tag}\\$([\\s\\S]*?)\\$${tag}\\$`))
  return m ? m[1] : null
}
const frozenVsSource = (p: string): boolean =>
  execSync(`git hash-object "${p}"`, { encoding: 'utf8' }).trim() ===
  execSync(`git rev-parse "${SOURCE_TIP}:${p}"`, { encoding: 'utf8' }).trim()

async function main(): Promise<void> {
  console.log('EXLIB-2O hosted-load application-evidence verification (EXECUTED ONCE by ChatGPT; LOCAL-ONLY)')

  console.log('\nA. Source refs and byte-frozen fingerprints')
  {
    check('A1: exact source refs — the reviewed-not-executed tag is the exact annotated object with the byte-exact annotation, peels to the promoted EXLIB-2O tip (ancestor of HEAD) whose tree is exact',
      (() => {
        try {
          if (execSync(`git cat-file -t refs/tags/${TAG}`, { encoding: 'utf8' }).trim() !== 'tag') return false
          if (execSync(`git rev-parse refs/tags/${TAG}`, { encoding: 'utf8' }).trim() !== TAG_OBJ) return false
          if (execSync(`git rev-parse refs/tags/${TAG}^{}`, { encoding: 'utf8' }).trim() !== SOURCE_TIP) return false
          execSync(`git merge-base --is-ancestor ${SOURCE_TIP} HEAD`, { stdio: 'pipe' })
          if (execSync(`git rev-parse ${SOURCE_TIP}^{tree}`, { encoding: 'utf8' }).trim() !== SOURCE_TREE) return false
          const raw = execSync(`git cat-file tag refs/tags/${TAG}`, { encoding: 'utf8' })
          return raw.split('\n\n').slice(1).join('\n\n') === TAG_MSG
        } catch { return false }
      })())
    check('A2: the executed package is byte-UNCHANGED — worktree bytes are exactly 39,230 B with the reviewed SHA-256 and blob-identical to the promoted tip (any byte change would void the reviewed/executed status)',
      readFileSync(PACKAGE).length === 39230 && sha256(PACKAGE) === PKG_SHA &&
      frozenVsSource(PACKAGE))
    check('A3: the upstream authorities stay byte-frozen — both admitted batch artifacts, both completed review forms, the admitted Plank artifact, migration 027, and the SPENT EXLIB-2K package — and the repository migration sequence is exactly 001-027 with no 028',
      (() => {
        for (const p of [B02, B04, DB_FORM, AW_FORM, 'docs/exlib2g-plank-content.jsonl',
          'docs/exlib2k-plank-catalog-load-package.sql']) {
          if (!frozenVsSource(p)) return false
        }
        if (sha256('docs/exlib2g-plank-content.jsonl') !== ARTIFACT_SHA) return false
        if (sha256('docs/exlib2k-plank-catalog-load-package.sql') !== PKG2K_SHA) return false
        if (sha256('supabase/migrations/027_exlib_catalog_content_schema.sql') !== MIGRATION_SHA) return false
        const migs = readdirSync('supabase/migrations').filter((f) => /^\d{3}_.*\.sql$/.test(f)).sort()
        return migs.length === 27 && migs[26].startsWith('027_') &&
          !migs.some((f) => f.startsWith('028'))
      })())
  }

  console.log('\nB. Execution facts pinned verbatim (operator attribution, recovery point, one-use)')
  {
    check('B1: ChatGPT attribution is explicit and exclusive — executed by ChatGPT through the Joseph/ChatGPT-only path, NOT by Claude, against the ShredOS project ttybyljytiwntvorugcv ONLY, executed ONCE and COMMITTED byte-for-byte in one transaction with no modification, retry, or partial replay',
      recFlat.includes('performed by ChatGPT, NOT by Claude') &&
      recFlat.includes('Claude made no hosted contact in this phase and never executes load packages') &&
      recFlat.includes('Executed by: ChatGPT (the Joseph/ChatGPT-only execution path; never by Claude)') &&
      recFlat.includes('ShredOS Supabase project ttybyljytiwntvorugcv ONLY') &&
      recFlat.includes('executed ONCE and COMMITTED successfully, byte-for-byte, in one transaction, with no modification, no retry, and no partial replay'))
    check('B2: the executed revision, timestamps, and recovery point are pinned exactly — source commit, tag, tag object, byte count, SHA-256, start, finish, and the operator-confirmed physical backup all appear in the record; start precedes finish by under a minute and the backup precedes the start',
      (() => {
        if (!recSolid.includes(SOURCE_TIP) || !recSolid.includes(TAG) ||
          !recSolid.includes(TAG_OBJ) || !recSolid.includes(PKG_SHA)) return false
        if (!recFlat.includes('39,230 bytes')) return false
        if (!recFlat.includes(`Execution started: ${T_START}`)) return false
        if (!recFlat.includes(`Execution finished successfully: ${T_FINISH}`)) return false
        if (!recFlat.includes(`physical backup at ${T_BACKUP}`)) return false
        if (!recFlat.includes('confirmed BEFORE execution')) return false
        const s = Date.parse(T_START); const f = Date.parse(T_FINISH)
        const b = Date.parse(T_BACKUP.replace(' UTC', 'Z').replace(' ', 'T'))
        return b < s && s < f && f - s < 60_000
      })())
    check('B3: the data-load/one-use posture is precise — NO migration-history entry created, the repository sequence stays 001-027, the package is SPENT, must never be rerun, and the recorded refusal shape is the package\'s own eleven-term pre-state gate',
      recFlat.includes('it creates NO migration-history entry') &&
      recFlat.includes('The REPOSITORY migration sequence in effect on hosted remains exactly 001-027') &&
      recFlat.includes('ONE-USE by design and is now SPENT') &&
      recFlat.includes('must never be rerun') &&
      recFlat.includes(`(${PRE_VECTOR} with both targets bare)`) &&
      recFlat.includes('a second execution fails closed before any write or authority change'))
    check('B4: every pre-execution gate is recorded and equals the package\'s own gate pins — dual postgres identities, non-superuser, the exact grantor-included baseline membership, the eleven-term pre vector, both targets bare, unclaimed names, and the 0/0 claims invariant',
      recFlat.includes('current_user = postgres AND session_user = postgres') &&
      recFlat.includes('postgres was NOT a superuser') &&
      recFlat.includes('exactly one row for role exlib_catalog_loader, member postgres, grantor supabase_admin, ADMIN TRUE, INHERIT FALSE, SET FALSE') &&
      recFlat.includes(`count vector was exactly ${PRE_VECTOR}`) &&
      pkg.includes(`v_counts <> '${PRE_VECTOR}'`) &&
      recFlat.includes('existed with ZERO snapshots (both targets bare)') &&
      recFlat.includes('The target names were unclaimed') &&
      pkgFlat.includes("normalized_name IN ('dead bug', 'ab wheel rollout', 'ab roller rollout')") &&
      recFlat.includes('claims invariant was 0 orphaned / 0 unclaimed') &&
      pkgFlat.includes('postgres granted BY supabase_admin with ADMIN TRUE, INHERIT FALSE, SET FALSE — grantor included'))
  }

  console.log('\nC. Post-execution state cross-checked against the package\'s own gates and the admitted artifacts')
  {
    check('C1: all TWELVE recorded counts are exact — the eleven-term post vector equals the package\'s own fail-closed post-state pin term for term, every per-table line matches it, and tenant exercises stays 84 unchanged',
      (() => {
        if (!pkg.includes(`v_counts <> '${POST_VECTOR}'`)) return false
        if (!recFlat.includes(`eleven-table vector was exactly ${POST_VECTOR}`)) return false
        const terms = POST_VECTOR.split('/').map(Number)
        for (let i = 0; i < CANON_ORDER.length; i += 1) {
          if (!rec.includes(`- ${CANON_ORDER[i]}: ${terms[i]}`)) return false
        }
        return recFlat.includes('exercises (tenant): 84, unchanged')
      })())
    check('C2: the Dead bug loaded state equals the package literals AND the admitted batch02 line-12 record AND the completed human form — canonical name, mobility category, pending/null/active/v1, exactly the one secondary hip_flexors anatomy row, zero aliases',
      (() => {
        const art = jsonLine(B02, 12)
        const form = JSON.parse(read(DB_FORM))
        if (lit('nm1') !== 'Dead bug' || art.proposed_canonical_name !== 'Dead bug') return false
        if (lit('cat1') !== 'mobility' || form.snapshot_category_decision !== 'mobility') return false
        if (!recFlat.includes(`Logical UUID ${DBU}`)) return false
        if (!recFlat.includes('canonical_name = Dead bug, category = mobility')) return false
        if (!recFlat.includes('Anatomy: hip_flexors / secondary (exactly one row)')) return false
        if (!recFlat.includes('Zero aliases')) return false
        const anat = JSON.parse(lit('anat1') as string)
        if (JSON.stringify(anat) !== JSON.stringify([{ muscle: 'hip_flexors', role: 'secondary' }])) return false
        if (JSON.stringify(art.muscle_targets) !== JSON.stringify([{ muscle: 'hip_flexors', role: 'secondary' }])) return false
        if (JSON.parse(lit('alia1') as string).length !== 0) return false
        if (JSON.stringify(art.aliases) !== JSON.stringify([])) return false
        return pkg.includes(`'${DBU}'`) && pkgFlat.includes("IS DISTINCT FROM 'hip_flexors:secondary'")
      })())
    check('C3: the Ab wheel rollout loaded state equals the package literals AND the admitted batch04 line-5 record AND the completed human form — canonical name, other category, pending/null/active/v1, exactly the two anatomy rows (obliques/secondary + lats/tertiary), exactly the one Ab roller rollout alias',
      (() => {
        const art = jsonLine(B04, 5)
        const form = JSON.parse(read(AW_FORM))
        if (lit('nm2') !== 'Ab wheel rollout' || art.proposed_canonical_name !== 'Ab wheel rollout') return false
        if (lit('cat2') !== 'other' || form.snapshot_category_decision !== 'other') return false
        if (!recFlat.includes(`Logical UUID ${AW}`)) return false
        if (!recFlat.includes('canonical_name = Ab wheel rollout, category = other')) return false
        if (!recFlat.includes('Anatomy: obliques / secondary and lats / tertiary (exactly two rows)')) return false
        if (!recFlat.includes('Exactly one alias: Ab roller rollout')) return false
        const anat = JSON.parse(lit('anat2') as string)
        const wantAnat = [{ muscle: 'lats', role: 'tertiary' }, { muscle: 'obliques', role: 'secondary' }]
        if (JSON.stringify(anat) !== JSON.stringify(wantAnat)) return false
        if (JSON.stringify(art.muscle_targets) !== JSON.stringify(wantAnat)) return false
        const alia = JSON.parse(lit('alia2') as string)
        if (JSON.stringify(alia) !== JSON.stringify(['Ab roller rollout'])) return false
        if (JSON.stringify(art.aliases) !== JSON.stringify(['Ab roller rollout'])) return false
        return pkg.includes(`'${AW}'`) &&
          pkgFlat.includes("IS DISTINCT FROM 'lats:tertiary,obliques:secondary'") &&
          pkgFlat.includes("IS DISTINCT FROM 'Ab roller rollout'")
      })())
    check('C4: snapshot lifecycle facts match the package\'s per-target binding gates — pending review with null reviewer fields, active, catalog version 1, for BOTH targets',
      (() => {
        const both = (rec.match(/Snapshot review_status = pending with every reviewer field null;\s*is_active = true; catalog_version = 1/g) || []).length
        return both === 2 &&
          pkgFlat.includes("e.review_status = 'pending' AND e.reviewed_by IS NULL") &&
          pkgFlat.includes('e.catalog_version = 1 AND e.is_active')
      })())
    check('C5: claims and bindings are exact and UNSWAPPED — the three normalized claims with their sources and owners equal the package\'s own no-swap postconditions, the reverse bindings are recorded, and the claims invariant stayed 0/0',
      recFlat.includes(`dead bug / canonical / ...0002; ab wheel rollout / canonical / ...0003; ab roller rollout / alias / ...0003`) &&
      recFlat.includes('Reverse no-swap UUID/name/category bindings hold') &&
      recFlat.includes('never swapped') &&
      recFlat.includes('claims invariant remained 0 orphaned / 0 unclaimed') &&
      pkgFlat.includes("c.normalized_name = 'dead bug' AND c.claim_source = 'canonical'") &&
      pkgFlat.includes("c.normalized_name = 'ab wheel rollout' AND c.claim_source = 'canonical'") &&
      pkgFlat.includes("c.normalized_name = 'ab roller rollout' AND c.claim_source = 'alias'"))
    check('C6: the hosted-generated snapshot UUIDs are recorded as HOSTED facts, both UUID-v4-shaped, marked as loader gen_random_uuid() output rather than package literals, and genuinely absent from the executed package bytes',
      UUID_RE.test(DB_SNAP) && UUID_RE.test(AW_SNAP) &&
      recSolid.includes(DB_SNAP) && recSolid.includes(AW_SNAP) &&
      recFlat.includes('a hosted fact, not a package literal') &&
      !pkg.includes(DB_SNAP) && !pkg.includes(AW_SNAP) &&
      recFlat.includes('recorded on ChatGPT\'s operator-path authority'))
    check('C7: VECTOR-ORDER PROOF (Codex correction round 1, dedicated) — the ordered table references are EXTRACTED mechanically from BOTH of the package\'s vector-building queries, the two extracted orders are identical, both equal the canonical eleven-table order, the record\'s pre-state parenthetical order matches it, and the record\'s post-state per-table list matches it term for term with run_items preceding review_events',
      (() => {
        // extract every vector-building query: the package has exactly
        // two (the pre-state gate's and the post-state gate's), each a
        // chain of (SELECT count(*) FROM public.<table>) terms INTO
        // v_counts — the extraction fails loudly if that shape drifts
        const queries = pkg.match(/SELECT \(SELECT count\(\*\) FROM public\.[\s\S]*?INTO v_counts/g) || []
        if (queries.length !== 2) return false
        const orderOf = (q: string): string[] => {
          const out: string[] = []
          const re = /FROM public\.(exercise_catalog[a-z_]*)\)/g
          let m: RegExpExecArray | null = re.exec(q)
          while (m !== null) { out.push(m[1]); m = re.exec(q) }
          return out
        }
        const pre = orderOf(queries[0])
        const post = orderOf(queries[1])
        if (pre.length !== 11 || post.length !== 11) return false
        if (JSON.stringify(pre) !== JSON.stringify(post)) return false
        if (JSON.stringify(pre) !== JSON.stringify(CANON_ORDER)) return false
        // the record's section-2 parenthetical, rebuilt from the
        // EXTRACTED order (short names strip the exercise_catalog_
        // prefix; the bare catalog table reads "catalog") and compared
        // on the whitespace-stripped record so 72-column wrapping
        // cannot hide a swap
        const shorts = pre.map((t) => (t === 'exercise_catalog' ? 'catalog' : t.replace(/^exercise_catalog_/, '')))
        if (!recSolid.includes(shorts.join('/'))) return false
        // the record's section-3 per-table list, read back in ORDER
        const listed: string[] = []
        const lineRe = /^- (exercise_catalog[a-z_]*): (\d+)$/gm
        let lm: RegExpExecArray | null = lineRe.exec(rec)
        while (lm !== null) { listed.push(lm[1]); lm = lineRe.exec(rec) }
        if (JSON.stringify(listed) !== JSON.stringify(pre)) return false
        if (listed.indexOf('exercise_catalog_run_items') > listed.indexOf('exercise_catalog_review_events')) return false
        // the corrected zero-surface sentence follows the same order,
        // and the record pins the full canonical order once verbatim
        return recFlat.includes('Zero import runs, zero run items, zero review events') &&
          recFlat.includes(CANON_ORDER.join(', '))
      })())
  }

  console.log('\nD. Output precision, gate distinction, authority, advisors, and boundaries')
  {
    check('D1: execution-output precision — the hosted response surfaced ONLY the final (Ab wheel rollout) loader result, its alias_rows = 1 and anatomy_rows = 2 equal the package\'s own argument cardinalities, its snapshot UUID matches the post-state row, the Dead bug loader result is recorded as NOT surfaced, and no Dead bug loader-return payload is fabricated',
      (() => {
        if (!recFlat.includes('surfaced the FINAL loader result only')) return false
        if (!recFlat.includes('alias_rows = 1, anatomy_rows = 2')) return false
        if (JSON.parse(lit('alia2') as string).length !== 1) return false
        if (JSON.parse(lit('anat2') as string).length !== 2) return false
        if (!recFlat.includes('did NOT separately surface the first (Dead bug) loader result')) return false
        if (!recFlat.includes('does NOT fabricate one')) return false
        if (!recFlat.includes('No Dead bug loader-return payload exists in the evidence')) return false
        // the record must never pair the Dead bug target with a surfaced
        // loader-return payload: its snapshot UUID may appear only in the
        // section-3 hosted post-state, never beside alias_rows/anatomy_rows
        const s5 = rec.slice(rec.indexOf('## 5.'), rec.indexOf('## 6.'))
        if (s5.includes(DB_SNAP)) return false
        return recFlat.includes('proven WITHOUT the missing payload') &&
          recFlat.includes('transaction-level postconditions') &&
          recFlat.includes('independent post-state queries in section 3')
      })())
    check('D2: the target-snapshot gate distinction — this record PRODUCES the gate\'s hosted evidence (citing the promoted EXLIB-2K record\'s section-5 gate verbatim terms) but does NOT adjudicate it; review, admission, and publication are recorded as BLOCKED and NOT BEGUN with zero review events',
      recFlat.includes('The promoted EXLIB-2K application record\'s section 5 established the fail-closed TARGET-SNAPSHOT GATE') &&
      recFlat.includes('never swapped, missing, inactive, or ambiguous') &&
      recFlat.includes('PRODUCES the gate\'s evidence; it does not ADJUDICATE the gate') &&
      recFlat.includes('a Codex/operator ruling that remains open') &&
      recFlat.includes('publication remain BLOCKED and NOT BEGUN') &&
      recFlat.includes('no review event exists, no admission occurred, no publication occurred') &&
      recFlat.includes('This record itself approves NOTHING further'))
    check('D3: authority restoration is pinned GRANTOR-INCLUDED and byte-for-byte — exactly one supabase_admin-granted membership with ADMIN TRUE/INHERIT FALSE/SET FALSE, the temporary SET row absent, pg_has_role SET false, no persistent widening — matching the package\'s restoration postcondition',
      recFlat.includes('restored byte-for-byte to the original supabase_admin -> postgres baseline') &&
      recFlat.includes('exactly ONE exlib_catalog_loader membership remains for postgres, grantor supabase_admin, ADMIN TRUE, INHERIT FALSE, SET FALSE') &&
      recFlat.includes('The temporary postgres-granted SET membership is ABSENT') &&
      recFlat.includes("pg_has_role('postgres','exlib_catalog_loader','SET') = false") &&
      recFlat.includes('No persistent authority widening occurred') &&
      pkgFlat.includes('grantor included, and no standing SET capability'))
    check('D4: advisor evidence precision — both advisors run by ChatGPT immediately after execution, NEITHER claimed globally clean, neither produced an execution failure or migration-blocking finding attributable to this two-snapshot load, the RLS-no-policy INFO posture preserved as intentional (not "fixed"), broader notices unadjudicated/outside EXLIB-2O and not introduced/fixed/accepted',
      recFlat.includes('BOTH hosted advisor classes') &&
      recFlat.includes('were run by ChatGPT immediately after this execution') &&
      recFlat.includes('NEITHER advisor result is claimed to be globally clean') &&
      recFlat.includes('NEITHER advisor produced an execution failure or a migration-blocking finding attributable to this two-snapshot load') &&
      recFlat.includes('INTENTIONAL deny-by-default posture') &&
      recFlat.includes('preserved precisely, not "fixed"') &&
      recFlat.includes('UNADJUDICATED and OUTSIDE EXLIB-2O') &&
      recFlat.includes('NOT introduced by this load, NOT fixed by it, and NOT accepted by this record'))
    check('D5: boundaries hold — Plank neutrality and the frozen set are recorded AND blob-identical to the promoted tip (prep record, live verifier, seed module, inventory, ledger, package.json), the Plank inventory row seed_link_compatible false at the anchored delivery predecessor, tenant 84 unchanged, and the range through the anchored predecessor touching only docs/ and scripts/verify-* paths',
      (() => {
        // RETARGET (EXLIB-2S delivery-activation preparation): the two
        // delivery-surface paths compare source-blob vs the anchored
        // delivery-predecessor blob; every other frozen path stays live.
        const DELIVERY_PRED = '5f7e182f3027b3640514e06d642693f4018c03e2'
        // (the 2O live verifier itself joins the anchored pair: the
        // EXLIB-2S live-suite retarget legitimately edits its D16
        // seed check after this suite's milestone)
        for (const p of ['src/lib/supabase/seed-exercises.ts', 'docs/exlib2b-release1-inventory.jsonl', LIVE]) {
          if (execSync(`git rev-parse "${SOURCE_TIP}:${p}"`, { encoding: 'utf8' }).trim() !==
              execSync(`git rev-parse "${DELIVERY_PRED}:${p}"`, { encoding: 'utf8' }).trim()) return false
        }
        for (const p of [PREP_RECORD, 'docs/exlib1b1-review-ledger.jsonl',
          'package.json', 'docs/exlib2k-hosted-load-application-record.md']) {
          if (!frozenVsSource(p)) return false
        }
        const inv = execSync(`git show ${DELIVERY_PRED}:"docs/exlib2b-release1-inventory.jsonl"`, { encoding: 'utf8', maxBuffer: 1 << 26 }).split('\n')
          .filter((l) => l.trim() && !l.trim().startsWith('#')).map((l) => JSON.parse(l))
        const plank = inv.filter((r: any) => r.proposed_canonical_name === 'Plank')
        if (plank.length !== 1 || plank[0].seed_link_compatible !== false) return false
        if (!recFlat.includes('entire pre-existing Plank surface')) return false
        if (!recFlat.includes('pending / draft / unadmitted')) return false
        if (!recFlat.includes('ZERO projected relationships')) return false
        if (!recFlat.includes('exercises table remained exactly 84 rows, unchanged')) return false
        if (!recFlat.includes('seed_link_compatible remains false')) return false
        const range = execSync(`git diff --name-only ${SOURCE_TIP}..${DELIVERY_PRED}`, { encoding: 'utf8' })
          .split('\n').filter(Boolean)
        return !range.some((p) => !/^(docs\/|scripts\/verify-)/.test(p)) &&
          recFlat.includes('Zero import runs, zero run items, zero review events')
      })())
  }

  console.log('\nE. Lifecycle: the labeled retarget and the two-state application record')
  {
    check('E1: the load-prep suite\'s HEAD topology is retargeted under the exact label — the label appears at least twice, the suite pins the promoted tip constant and its tree, its topology walks the TIP rather than HEAD, and the record documents the classification with unchanged totals (35/0)',
      (() => {
        const r = read(RETARGETED)
        if ((r.match(new RegExp(LABEL.replace(/[()]/g, '\\$&'), 'g')) ?? []).length < 2) return false
        if (!r.includes(`const TIP = '${SOURCE_TIP}'`)) return false
        if (!r.includes(`const TIP_TREE = '${SOURCE_TREE}'`)) return false
        if (!r.includes('rev-list --count ${SRC}..${TIP}')) return false
        return recFlat.includes(`label \`${LABEL}\``) &&
          recFlat.includes('the suite\'s totals are unchanged (35/0)') &&
          recFlat.includes('byte-frozen history that remain true AS WRITTEN of their own phase')
      })())
    check('E2: the lifecycle two-state proof — the promoted tip\'s tree contains NO application record, and the live tree contains exactly this one',
      (() => {
        const tipDocs = execSync(`git ls-tree ${SOURCE_TIP} docs/ --name-only`, { encoding: 'utf8' })
        if (tipDocs.includes('exlib2o-hosted-load-application-record')) return false
        const liveDocs = readdirSync('docs').filter((f) => f.includes('exlib2o-hosted-load-application-record'))
        return liveDocs.length === 1 && liveDocs[0] === 'exlib2o-hosted-load-application-record.md'
      })())
    check('E3: lifecycle-safe phase boundary — the phase adds exactly two paths (this record, this verifier) and modifies exactly the retargeted verify-exlib2o.ts; strict porcelain while uncommitted, adder-anchored once committed',
      (() => {
        try {
          const inHead = (() => {
            try { execSync(`git cat-file -e HEAD:${RECORD}`, { stdio: 'pipe' }); return true } catch { return false }
          })()
          const PHASE_NEW = [RECORD, VERIFIER].sort()
          if (!inHead) {
            const entries = execSync('git status --porcelain', { encoding: 'utf8' })
              .split('\n').filter(Boolean).map((l) => l.trim()).sort()
            const expected = [...PHASE_NEW.map((f) => `?? ${f}`), `M ${RETARGETED}`].sort()
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
          execSync(`git merge-base --is-ancestor ${SOURCE_TIP} ${phase}`)
          const range = execSync(`git diff --name-only ${SOURCE_TIP}..${phase}`, { encoding: 'utf8' })
            .split('\n').filter(Boolean).sort()
          return JSON.stringify(range) === JSON.stringify([...PHASE_NEW, RETARGETED].sort())
        } catch { return false }
      })())
    check('E4: LOCAL-ONLY hygiene — neither the record nor this verifier contains a hosted endpoint URL, connection string, credential, or Supabase CLI remote command, and neither performs hosted contact',
      (() => {
        const self = read(VERIFIER)
        const both = rec + self
        // Forbidden tokens are assembled from split halves so this
        // suite's own source never contains them verbatim (the same
        // split-token idiom as the live harness's hosted-contact scan).
        const bads = [
          'supabase' + '.co', 'vercel' + '.', 'postgresql' + '://', 'postgres' + '://',
          'SUPABASE' + '_URL', 'SUPABASE' + '_SERVICE', 'api' + 'key', 'Bearer' + ' ', 'ey' + 'J',
          '--db' + '-url', '--lin' + 'ked', 'db ' + 'push',
        ]
        for (const bad of bads) {
          if (both.includes(bad)) return false
        }
        return recFlat.includes('Claude made no hosted contact in this phase')
      })())
    check('E5: Codex correction round 1 topology — the original evidence commit 16b8ab0 is PRESERVED untouched with its exact recorded tree and its parent is the promoted tip; the correction is exactly ONE plain single-parent forward commit modifying exactly the record and this verifier (strict two-file worktree scope while it is being authored); and the record carries the truthful supersession disclosure — the reversed statement was the section-3 zero-surface sentence, the parenthetical and per-table list were already in package order, the numeric vectors were always correct, and the hosted execution stays valid and is never rerun',
      (() => {
        try {
          if (execSync(`git rev-parse ${R1}^{tree}`, { encoding: 'utf8' }).trim() !== R1_TREE) return false
          if (execSync(`git rev-parse ${R1}^`, { encoding: 'utf8' }).trim() !== SOURCE_TIP) return false
          const disclosure = recFlat.includes('single reversed-order statement in 16b8ab0 was the section-3 zero-surface sentence') &&
            recFlat.includes('were ALREADY in the package\'s exact order') &&
            recFlat.includes('No numeric value changes anywhere') &&
            recFlat.includes('remains valid, is unaffected, and is never rerun') &&
            recFlat.includes('16b8ab0 is PRESERVED untouched')
          if (!disclosure) return false
          // RETARGET (EXLIB-2P Plank database-review preparation):
          // anchored to the promoted evidence tip, where this was and
          // remains true; the tip must remain an ancestor of HEAD.
          if (execSync(`git rev-parse ${EV_TIP}^{tree}`, { encoding: 'utf8' }).trim() !== EV_TREE) return false
          execSync(`git merge-base --is-ancestor ${EV_TIP} HEAD`, { stdio: 'pipe' })
          if (execSync(`git rev-list --count ${R1}..${EV_TIP}`, { encoding: 'utf8' }).trim() !== '1') return false
          if (execSync(`git rev-list --count --merges ${R1}..${EV_TIP}`, { encoding: 'utf8' }).trim() !== '0') return false
          const parents = execSync(`git rev-list --parents -n 1 ${EV_TIP}`, { encoding: 'utf8' }).trim().split(/\s+/)
          if (parents.length !== 2 || parents[1] !== R1) return false
          const status = execSync(`git diff --name-status ${R1}..${EV_TIP}`, { encoding: 'utf8' })
            .split('\n').filter(Boolean).sort()
          return JSON.stringify(status) === JSON.stringify([`M\t${RECORD}`, `M\t${VERIFIER}`].sort())
        } catch { return false }
      })())
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
