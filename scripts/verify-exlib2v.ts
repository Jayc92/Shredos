// EXLIB-2V STATIC verification (LOCAL-ONLY): the hosted
// snapshot-review DECISION PREPARATION — three blank human-review
// forms, one S4 authority-inputs form, and the preparation record.
//
// Proves: the promoted source and the preserved EXLIB-2U stop; the
// mechanical naming derivation; that every PRESERVED governed value
// the forms display re-derives from promoted committed bytes
// (load-package literals, preserved hosted UUIDs, trigger-governed
// field set — seventeen of the eighteen trigger-frozen fields
// verbatim, with created_at represented ONLY as an explicit
// UNKNOWN/NOT-PRESERVED sentinel because its non-null hosted value
// is not preserved anywhere in promoted evidence, per Codex round
// 1); that the reuse classifications' quoted evidence exists
// byte-for-byte in the promoted artifacts; that NO approval is
// preselected and NO identity, timestamp, rationale, run key, or
// membership choice is fabricated; the round-1 form LIFECYCLE
// contract (the blank form is an approved TEMPLATE; exactly one
// lawful human-completion transition over the six human fields;
// post-completion immutability; external voiding; no database
// effect); that the phase contains NO SQL package and NO
// database-mutation surface; that the S3/S4 boundary is stated
// truthfully; phase topology; and hygiene. Performs NO hosted
// contact and NO network activity of any kind.
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

const SRC = 'fc3e6cce5afcf03f0552d65a2de7e7c796646a25'
const SRC_TREE = '6a27b94167884d6fefb4555028257ccf40413738'
const S3_TAG = 'exlib2t-delivery-runtime-s3-deployed-flag-off'
const S3_TAG_OBJ = 'ef570b3c9834e346f80c14ca65fe3efbf4486ca9'
const RECORD = 'docs/exlib2v-snapshot-review-decision-prep-record.md'
const VERIFIER = 'scripts/verify-exlib2v.ts'
const FORMS = [
  'docs/exlib2v-plank-snapshot-review-form.json',
  'docs/exlib2v-dead-bug-snapshot-review-form.json',
  'docs/exlib2v-ab-wheel-rollout-snapshot-review-form.json',
]
const AUTH_FORM = 'docs/exlib2v-s4-authority-inputs-form.json'
const PHASE_PATHS = [...FORMS, AUTH_FORM, RECORD, VERIFIER].sort()
// the two mechanically necessary labeled retargets (enumerated by
// the sim-commit stale sweep; see the record's sweep section)
const RETARGETED = ['scripts/verify-exlib1c0b.ts', 'scripts/verify-exlib2t.ts'].sort()
const gitShow = (p: string): string =>
  execSync(`git show ${SRC}:"${p}"`, { encoding: 'utf8', maxBuffer: 1 << 26 })

const rec = read(RECORD)
const recFlat = rec.replace(/\s+/g, ' ')
const forms = FORMS.map((p) => JSON.parse(read(p)))
const [plank, deadbug, abwheel] = forms
const authForm = JSON.parse(read(AUTH_FORM))

// Ordered argument extraction from a load_catalog_snapshot call
// block: dollar-quoted literals, plain quoted literals, and NULLs,
// in call order (signature-fixed positions).
function extractCallArgs(block: string): Array<string | null> {
  const out: Array<string | null> = []
  const re = /\$[a-z0-9]*\$([\s\S]*?)\$[a-z0-9]*\$|'([^']*)'|(NULL)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(block)) !== null) {
    if (m[3] !== undefined) out.push(null)
    else out.push(m[1] !== undefined ? m[1] : m[2])
  }
  return out
}
const gv = (form: Record<string, any>, field: string): unknown =>
  form.governed_field_set[field]?.value

console.log('EXLIB-2V snapshot-review decision preparation verification (LOCAL-ONLY; documents and verifier only; nothing applied anywhere)')

console.log('\nA. Promoted source, preserved stop, naming')
check('A1: the promoted source is exact — the S3 tag is the exact annotated object, peels to the source commit (an ancestor of HEAD) whose tree is exact, and its annotation is the byte-exact 75-byte DEPLOYED/FLAG-OFF/NO-DELIVERY-RUN statement',
  (() => {
    try {
      if (execSync(`git rev-parse refs/tags/${S3_TAG}`, { encoding: 'utf8' }).trim() !== S3_TAG_OBJ) return false
      if (execSync(`git rev-parse refs/tags/${S3_TAG}^{}`, { encoding: 'utf8' }).trim() !== SRC) return false
      execSync(`git merge-base --is-ancestor ${SRC} HEAD`, { stdio: 'pipe' })
      if (execSync(`git rev-parse ${SRC}^{tree}`, { encoding: 'utf8' }).trim() !== SRC_TREE) return false
      const raw = execSync(`git cat-file tag refs/tags/${S3_TAG}`, { encoding: 'utf8' })
      const msg = raw.slice(raw.indexOf('\n\n') + 2)
      return msg === 'EXLIB-2T S3 delivery runtime — DEPLOYED — FLAG OFF — NO DELIVERY RUN\n'
    } catch { return false }
  })())
check('A2: the EXLIB-2U stop is preserved — when the reserved staged-run branch exists locally it sits EXACTLY at the source commit with zero commits of its own (absence is lawful in bundle reconstructions), and this phase adds NO run package and NO path under the exlib2u name',
  (() => {
    try {
      const has = execSync('git branch --list exlib2u-staged-run-prep', { encoding: 'utf8' }).trim() !== ''
      if (has) {
        if (execSync('git rev-parse refs/heads/exlib2u-staged-run-prep', { encoding: 'utf8' }).trim() !== SRC) return false
        if (execSync(`git rev-list --count ${SRC}..refs/heads/exlib2u-staged-run-prep`, { encoding: 'utf8' }).trim() !== '0') return false
      }
      const tracked = execSync('git ls-files', { encoding: 'utf8' })
      return !/exlib2u/i.test(tracked)
    } catch { return false }
  })())
check('A3: the naming derivation holds — the EXLIB-2 series at the source commit uses letters a through u only (2s/2u existing solely as branches), exlib2v appears NOWHERE at the source commit and in no tag, and any phase2u tag present belongs to the separate phase2X namespace (that tag is outside the exlib bundle scope, so its absence in a bundle reconstruction is lawful)',
  (() => {
    const atSrc = execSync(`git ls-tree -r --name-only ${SRC}`, { encoding: 'utf8' })
    if (/exlib2v/i.test(atSrc)) return false
    // RETARGET (EXLIB-2W human-decision artifacts): the derivation
    // claim is a DERIVATION-TIME fact — this milestone's own
    // closure later created its stable tag lawfully, which is the
    // recurring completed-phase pattern (a finished milestone's own
    // artifacts falsify its authoring-time self-censuses). The
    // census excludes exactly that one post-closure tag by name;
    // every OTHER namespace remains fully censused.
    const tags = execSync('git tag', { encoding: 'utf8' }).split('\n').filter(Boolean)
      .filter((t) => t !== 'exlib2v-snapshot-review-decision-prep-stable')
    if (tags.some((t) => /exlib2v/i.test(t))) return false
    const phase2u = tags.filter((t) => t.startsWith('phase2u'))
    if (phase2u.length > 0 && !phase2u.includes('phase2u-cardio-timed-progression-stable')) return false
    const letters = new Set(
      (atSrc.match(/exlib2[a-z]/gi) || []).map((s) => s.toLowerCase().slice(-1)),
    )
    for (const t of tags) for (const m of t.toLowerCase().match(/exlib2[a-z]/g) || []) letters.add(m.slice(-1))
    if (letters.has('v')) return false
    return letters.has('t') && letters.has('b') && letters.has('g')
  })())

console.log('\nB. The forms re-derive from promoted bytes')
check('B1: all four forms parse, EVERY human field in all four is null (decision, reviewer, credential, timestamp, rationale, evidence; and every requested S4 authority input), and the three review forms offer exactly the explicit choices APPROVE / REJECT / CORRECT with nothing preselected',
  (() => {
    for (const f of forms) {
      const h = f.human_fields
      if (!h) return false
      for (const k of ['decision', 'reviewer', 'reviewer_role_or_credential', 'reviewed_at', 'rationale', 'evidence']) {
        if (h[k] !== null) return false
      }
      if (JSON.stringify(f.decision_choices) !== JSON.stringify(['APPROVE', 'REJECT', 'CORRECT'])) return false
      if (f.form_version !== 1) return false
      if (f.source_commit !== SRC) return false
    }
    const ri = authForm.requested_inputs
    if (ri.product_approver_identity.value !== null || ri.product_approver_identity.product_approved_at !== null) return false
    if (ri.legal_approver_identity.value !== null || ri.legal_approver_identity.legal_approved_at !== null) return false
    if (ri.approval_rationale.value !== null) return false
    if (ri.run_key_literal.value !== null) return false
    return ri.run_membership.value === null
  })())
check('B2: the Plank form\'s governed values re-derive MECHANICALLY from the promoted EXLIB-2K load package call (ordered argument extraction: logical UUID, canonical name, category, primary muscle, equipment, laterality, tracking mode, provenance, movement pattern, training role, difficulty, availability, and the four NULL source fields)',
  (() => {
    const pkg = gitShow('docs/exlib2k-plank-catalog-load-package.sql')
    const start = pkg.indexOf('SELECT load_catalog_snapshot(')
    const block = pkg.slice(start, pkg.indexOf(');', start))
    const args = extractCallArgs(block)
    if (args.length < 16) return false
    const expect: Array<[number, string]> = [
      [0, 'logical_id'], [1, 'canonical_name'], [2, 'category'], [3, 'primary_muscle'],
      [4, 'equipment'], [5, 'laterality'], [6, 'tracking_mode'], [7, 'provenance'],
      [8, 'movement_pattern'], [9, 'training_role'], [10, 'difficulty'], [11, 'availability'],
    ]
    for (const [i, field] of expect) {
      if (args[i] !== gv(plank, field)) return false
    }
    for (const i of [12, 13, 14, 15]) if (args[i] !== null) return false
    for (const f of ['source_url', 'source_page', 'retrieved_at', 'import_confidence']) {
      if (gv(plank, f) !== null) return false
    }
    return gv(plank, 'tracking_mode') === 'timed' && gv(plank, 'category') === 'isolation'
  })())
check('B3: BOTH target forms\' governed values re-derive MECHANICALLY from the promoted EXLIB-2O load package\'s two schema-qualified calls, in the same ordered-argument way (Dead bug mobility/bodyweight/alternating/bodyweight-tracked beginner; Ab wheel rollout other/other/bilateral/weight_reps advanced; four NULL source fields each)',
  (() => {
    const pkg = gitShow('docs/exlib2o-target-snapshot-load-package.sql')
    const calls: Array<[Record<string, any>, string]> = [
      [deadbug, 'e21b2c00-0000-4000-a000-000000000002'],
      [abwheel, 'e21b2c00-0000-4000-a000-000000000003'],
    ]
    for (const [form, logical] of calls) {
      const start = pkg.indexOf(`SELECT public.load_catalog_snapshot(\n  '${logical}'`)
      if (start < 0) return false
      const block = pkg.slice(start, pkg.indexOf(');', start))
      const args = extractCallArgs(block)
      if (args.length < 16) return false
      const fields = ['logical_id', 'canonical_name', 'category', 'primary_muscle', 'equipment',
        'laterality', 'tracking_mode', 'provenance', 'movement_pattern', 'training_role',
        'difficulty', 'availability']
      for (let i = 0; i < fields.length; i += 1) {
        if (args[i] !== gv(form, fields[i])) return false
      }
      for (const i of [12, 13, 14, 15]) if (args[i] !== null) return false
      for (const f of ['source_url', 'source_page', 'retrieved_at', 'import_confidence']) {
        if (gv(form, f) !== null) return false
      }
    }
    return gv(deadbug, 'tracking_mode') === 'bodyweight' && gv(abwheel, 'tracking_mode') === 'weight_reps'
      && gv(deadbug, 'category') === 'mobility' && gv(abwheel, 'category') === 'other'
  })())
check('B4: the hosted snapshot identities are exactly what promoted evidence preserves — the Dead bug and Ab wheel rollout forms carry the two hosted-generated UUIDs preserved in the EXLIB-2O application record (byte-equal), and the Plank form preserves NO hosted surrogate, saying so and requiring resolution by logical_id + is_active under the one-active-row unique index',
  (() => {
    const orec = gitShow('docs/exlib2o-hosted-load-application-record.md')
    const db = '1ce09c1f-c13d-4231-8e12-6f35cfd761b5'
    const aw = 'c715d840-944b-4019-b984-1687accffcf4'
    if (!orec.includes(db) || !orec.includes(aw)) return false
    if (deadbug.reviewed_object.hosted_snapshot_uuid !== db) return false
    if (abwheel.reviewed_object.hosted_snapshot_uuid !== aw) return false
    if (plank.reviewed_object.hosted_snapshot_uuid !== null) return false
    if (!plank.reviewed_object.hosted_snapshot_uuid_provenance.includes('NOT preserved in promoted evidence')) return false
    if (!plank.reviewed_object.hosted_snapshot_uuid_provenance.includes('logical_id + is_active = true')) return false
    // the evidentiary basis for Plank's null: the 2K application
    // record preserves NO hosted Plank snapshot UUID anywhere
    const krec = gitShow('docs/exlib2k-hosted-load-application-record.md')
    return !/snapshot uuid\s+[0-9a-f]{8}-/i.test(krec)
  })())
check('B5: the forms\' review contract matches the OPERATIVE migration-027 trigger bytes — the 18-field immutable governed set is extracted from the trigger\'s IS-DISTINCT block plus its structural companions and equals each form\'s governed keys; the one-way transition rule, the FRESH-audit-tuple rule, and the trigger-appended review-event insert are all real trigger bytes; and the forms\' CORRECT choice maps to revised-plus-new-version exactly as the trigger message demands',
  (() => {
    const mig = gitShow('supabase/migrations/027_exlib_catalog_content_schema.sql')
    const trigStart = mig.indexOf('CREATE OR REPLACE FUNCTION exlib_freeze_catalog_snapshot()')
    const trig = mig.slice(trigStart, mig.indexOf('CREATE TABLE exercise_catalog_content', trigStart))
    const blockStart = trig.indexOf('IF NEW.logical_id')
    const block = trig.slice(blockStart, trig.indexOf('RAISE EXCEPTION', blockStart))
    const trigFields = new Set(Array.from(block.matchAll(/NEW\.([a-z_]+)/g)).map((m) => m[1]))
    if (trigFields.size !== 18) return false
    for (const f of forms) {
      const keys = Object.keys(f.governed_field_set).filter((k) => !k.startsWith('_'))
      if (keys.length !== 18) return false
      for (const k of keys) if (!trigFields.has(k)) return false
    }
    if (!trig.includes("review_status is one-way (pending -> approved|revised|rejected; approved -> revised|rejected; revised/rejected terminal)")) return false
    if (!trig.includes('a review transition must carry FRESH evidence')) return false
    if (!trig.includes('INSERT INTO public.exercise_catalog_review_events')) return false
    if (!trig.includes('snapshot reactivation is not permitted')) return false
    for (const f of forms) {
      if (!f.review_contract.allowed_transitions.includes('pending -> approved | revised | rejected')) return false
      if (!f.review_contract.fresh_audit_tuple_rule.includes('FRESH evidence')) return false
      if (!f.proposed_transition.on_CORRECT.includes('NEW catalog version row')) return false
    }
    return true
  })())
check('B6: the forms\' current-hosted-state claims cite real promoted evidence — the EXLIB-2R application record pins the post-publication eleven-table vector 3/3/5/3/6/1/2/2/0/0/0 (review events, runs, and run items all ZERO), the load records pin each snapshot born pending with null reviewer fields, and every form states pending/NULL/zero-events accordingly',
  (() => {
    const rrec = gitShow('docs/exlib2r-hosted-publication-application-record.md')
    if (!rrec.includes('3/3/5/3/6/1/2/2/0/0/0')) return false
    if (!rrec.replace(/\s+/g, ' ').includes('exercise_catalog_import_runs: 0')) return false
    const orec = gitShow('docs/exlib2o-hosted-load-application-record.md').replace(/\s+/g, ' ')
    if ((orec.match(/Snapshot review_status = pending with every reviewer field null/g) || []).length !== 2) return false
    const krec = gitShow('docs/exlib2k-hosted-load-application-record.md').replace(/\s+/g, ' ')
    if (!krec.includes('snapshot review_status = pending')) return false
    for (const f of forms) {
      const s = f.current_hosted_review_state
      if (s.review_status !== 'pending' || s.reviewed_by !== null || s.reviewed_at !== null
        || s.review_rationale !== null || s.review_events_for_this_row !== 0) return false
    }
    return true
  })())

console.log('\nC. The reuse classifications are mechanically supported')
check('C1: Dead bug NOT REUSABLE — the promoted EXLIB-2N completed form itself binds the decision to the authored artifact (its voiding rule names the batch file and pinned record line; gate/loading/import-eligibility effects all none), and the EXLIB-2N application record states the decisions were applied to the authored records\' content_review fields',
  (() => {
    const nform = JSON.parse(gitShow('docs/exlib2n-dead-bug-target-snapshot-review-form-completed.json'))
    if (nform.voiding_rule !== 'Any byte change to the reviewed authored artifact (the batch file or the record line pinned above) voids this form.') return false
    if (nform.authored_artifact !== 'docs/exlib2c-release1-batch02-content.jsonl') return false
    if (!String(nform.gate_effect).startsWith('none')) return false
    if (!String(nform.loading_effect).startsWith('none')) return false
    if (!String(nform.import_eligible_effect).startsWith('none')) return false
    const napp = gitShow('docs/exlib2n-review-decision-application-record.md').replace(/\s+/g, ' ')
    if (!napp.includes("applied to the two authored exercise records' schema-defined content_review fields")) return false
    return deadbug.prior_decisions_not_reused.includes('NOT') &&
      deadbug.prior_decisions_not_reused.includes('batch02-content.jsonl record line 12')
  })())
check('C2: Ab wheel rollout NOT REUSABLE — the same independent proof on ITS OWN promoted completed form (authored-artifact voiding rule, none-effects) and the same application-record sentence',
  (() => {
    const nform = JSON.parse(gitShow('docs/exlib2n-ab-wheel-rollout-target-snapshot-review-form-completed.json'))
    if (nform.voiding_rule !== 'Any byte change to the reviewed authored artifact (the batch file or the record line pinned above) voids this form.') return false
    if (!String(nform.gate_effect).startsWith('none')) return false
    if (!String(nform.loading_effect).startsWith('none')) return false
    if (!String(nform.import_eligible_effect).startsWith('none')) return false
    return abwheel.prior_decisions_not_reused.includes('NOT') &&
      abwheel.prior_decisions_not_reused.includes('AUTHORED ARTIFACT')
  })())
check('C3: Plank NOT REUSABLE — the promoted EXLIB-2I record scopes that decision to the content lifecycle with no catalog snapshot involved, and the EXLIB-2P application record shows the applied fields were the CONTENT row\'s while the snapshot stayed pending with zero review events',
  (() => {
    const irec = gitShow('docs/exlib2i-plank-human-review-decision-record.md').replace(/\s+/g, ' ')
    if (!irec.includes('no catalog snapshot')) return false
    const prec = gitShow('docs/exlib2p-hosted-review-application-record.md').replace(/\s+/g, ' ')
    if (!prec.includes('content_status = approved')) return false
    if (!prec.includes('exercise_catalog_review_events remains exactly 0')) return false
    return plank.prior_decisions_not_reused.includes('NOT REUSABLE') &&
      plank.prior_decisions_not_reused.includes('content')
  })())

console.log('\nD. The S4 authority inputs and the membership consequences')
check('D1: the authority-inputs form requests exactly the four decision families (product approver + timestamp, legal approver + timestamp, approval rationale, run-key literal, membership) with EVERY value null, the run-key constraint stating 8-200 characters and permanent uniqueness, and membership offering exactly PLANK_ONLY and ALL_THREE_IDENTITIES',
  (() => {
    const ri = authForm.requested_inputs
    if (JSON.stringify(Object.keys(ri).sort()) !== JSON.stringify(
      ['approval_rationale', 'legal_approver_identity', 'product_approver_identity', 'run_key_literal', 'run_membership'].sort())) return false
    if (!ri.run_key_literal.constraint.includes('8 to 200 characters')) return false
    if (!ri.run_key_literal.constraint.includes('UNIQUE')) return false
    if (JSON.stringify(ri.run_membership.choices) !== JSON.stringify(['PLANK_ONLY', 'ALL_THREE_IDENTITIES'])) return false
    return authForm.preparer_boundary.includes('NEVER fill or fabricate')
  })())
check('D2: the record derives BOTH membership options\' consequences from the delivery/seal/relationship bytes (Plank-only: only the Plank snapshot gates the seal and relationship targets stay tenant-unresolvable; all-three: all three snapshots gate the seal and the targets become tenant-resolvable) and makes NO recommendation because the bytes do not determine the choice — and the underlying run-scoping sentence is real migration text',
  (() => {
    if (!recFlat.includes('ONLY the Plank snapshot must be approved')) return false
    if (!recFlat.includes('all three snapshots must be approved, active, and fully review-audited at the seal')) return false
    if (!recFlat.includes('no recommendation is made')) return false
    if (!recFlat.includes('finds no tenant exercise until some FUTURE run delivers them')) return false
    // comment-wrapped prose: strip the SQL comment prefixes before
    // flattening (the sentence spans multiple "--" lines)
    const mig023 = gitShow('supabase/migrations/023_exlib_catalog_and_delivery_contract.sql')
      .replace(/\n\s*--/g, ' ').replace(/\s+/g, ' ')
    return mig023.includes('Content approved later, or bound to another run, is invisible to this run')
  })())

console.log('\nE. No package, no mutation surface, truthful boundary')
// RETARGET (EXLIB-2W human-decision artifacts): this phase
// COMPLETED — reviewed, published, promoted, production-deployed,
// and tagged — so its topology claims are anchored at the phase's
// own promoted tip (below) instead of HEAD, where they held and
// hold forever; the HEAD-relative form went stale at the first
// successor commit, the same completed-phase pattern as before.
const TIP2V = '0d4dad415a40c8b4baf042651e3f748f3c8c9f5e'
{
  check('E1: phase topology — THREE plain single-parent commits at the promoted phase tip: the preparation commit and the authoring correction (exact pinned ids, byte-frozen) plus ONE forward Codex-round-1 correction touching exactly the FIVE correction paths (the three review forms, the record, this verifier — the authority-inputs form deliberately untouched); the RANGE still carries exactly EIGHT paths (the SIX added phase paths plus the TWO labeled retargeted suites as modifications), nothing deleted, no .sql path anywhere in the phase',
    (() => {
      try {
        const PREP1 = '96c3bbbb6d9b4487d21684a891eab72458416ca5'
        const CORR1 = 'd37dd1b2dfcd00c58d4873d3e4b45f808617918f'
        if (execSync(`git merge-base ${SRC} ${TIP2V}`, { encoding: 'utf8' }).trim() !== SRC) return false
        const headParents = execSync(`git rev-list --parents -n 1 ${TIP2V}`, { encoding: 'utf8' }).trim().split(/\s+/)
        if (headParents.length !== 2 || headParents[1] !== CORR1) return false
        const c1Parents = execSync(`git rev-list --parents -n 1 ${CORR1}`, { encoding: 'utf8' }).trim().split(/\s+/)
        if (c1Parents.length !== 2 || c1Parents[1] !== PREP1) return false
        const prepParents = execSync(`git rev-list --parents -n 1 ${PREP1}`, { encoding: 'utf8' }).trim().split(/\s+/)
        if (prepParents.length !== 2 || prepParents[1] !== SRC) return false
        if (execSync(`git rev-list --count ${SRC}..${TIP2V}`, { encoding: 'utf8' }).trim() !== '3') return false
        if (execSync(`git rev-list --count --merges ${SRC}..${TIP2V}`, { encoding: 'utf8' }).trim() !== '0') return false
        const corr = execSync(`git diff --name-status ${CORR1}..${TIP2V}`, { encoding: 'utf8' })
          .split('\n').filter(Boolean).sort()
        const corrExpected = [...FORMS.map((p) => `M\t${p}`), `M\t${RECORD}`, `M\t${VERIFIER}`].sort()
        if (JSON.stringify(corr) !== JSON.stringify(corrExpected)) return false
        const status = execSync(`git diff --name-status ${SRC}..${TIP2V}`, { encoding: 'utf8' })
          .split('\n').filter(Boolean).sort()
        const expected = [
          ...PHASE_PATHS.map((p) => `A\t${p}`),
          ...RETARGETED.map((p) => `M\t${p}`),
        ].sort()
        if (JSON.stringify(status) !== JSON.stringify(expected)) return false
        return !PHASE_PATHS.some((p) => p.endsWith('.sql'))
      } catch { return false }
    })())
}
check('E2: NO mutation surface exists in this phase — no phase file carries SQL package markers (transaction begin/commit statements, LOCK TABLE, SET ROLE, or an INSERT/UPDATE/DELETE statement head), and no phase file names the runtime flag or run-key ENVIRONMENT variables (the census-protected literals appear nowhere in the phase)',
  (() => {
    for (const p of PHASE_PATHS) {
      const t = read(p)
      if (p !== VERIFIER) {
        for (const bad of ['BEGIN;', 'COMMIT;', 'LOCK TABLE', 'SET ROLE', 'RESET ROLE']) {
          if (t.includes(bad)) return false
        }
        if (/^\s*(INSERT INTO|UPDATE\s+public\.|DELETE FROM)/m.test(t)) return false
      }
      if (t.includes('CATALOG' + '_DELIVERY_' + 'ENABLED')) return false
      if (t.includes('CATALOG' + '_DELIVERY_' + 'RUN_KEY')) return false
    }
    return true
  })())
check('E3: the S3/S4 boundary is stated truthfully — the record says S3 is complete and deployed BEHIND THE OFF FLAG citing the byte-verified tag, says the runtime is inert with the seed path still serving initialization, pins the hosted zero-runs state from promoted evidence, and reserves EXLIB-2U (empty) for the staged-run preparation',
  recFlat.includes('S3 is complete') &&
  recFlat.includes('BEHIND THE OFF FLAG') &&
  recFlat.includes('every initialization still runs the seed path') &&
  recFlat.includes('3/3/5/3/6/1/2/2/0/0/0') &&
  recFlat.includes('PRESERVED EMPTY at the same promoted commit') &&
  recFlat.includes('reserved EXLIB-2U branch remains empty and untouched'))

console.log('\nF. Hygiene and reconciliation')
check('F1: hygiene — all four forms are pure ASCII; the record\'s non-ASCII is the em-dash only; no phase file contains a hosted endpoint URL, connection string, or credential material',
  (() => {
    for (const p of [...FORMS, AUTH_FORM]) {
      const t = read(p)
      for (const ch of t) if ((ch.codePointAt(0) as number) > 127) return false
    }
    for (const ch of rec) {
      const c = ch.codePointAt(0) as number
      if (c > 127 && c !== 0x2014) return false
      if (c < 32 && ch !== '\n') return false
    }
    const payload = PHASE_PATHS.map(read).join('\n')
    const bads = [
      'supabase' + '.co', 'vercel' + '.com', 'postgresql' + '://', 'postgres' + '://',
      'SUPABASE' + '_URL', 'SUPABASE' + '_SERVICE', 'api' + 'key', 'Bearer' + ' ', 'ey' + 'J',
      '--db' + '-url', '--lin' + 'ked', 'db ' + 'push',
    ]
    return !bads.some((b) => payload.includes(b))
  })())
check('F2: reconciliation — the record\'s battery claim names 91 suites / 7,113 checks / 0 failures (the promoted 90/7,092 baseline plus exactly this suite\'s MEASURED TWENTY-ONE checks, count-neutral retargets), tells the TRUE sweep story (exactly THREE stale checks across TWO suites), and the EXLIB-2V retarget label appears in EXACTLY the two enumerated retargeted suites and nowhere else',
  (() => {
    if (!recFlat.includes('91 suites / 7,113 checks / 0 failures')) return false
    if (!recFlat.includes('exactly THREE checks across TWO suites failed; nothing else did')) return false
    const labelled = execSync("grep -rl 'RETARGET (EXLIB-2V' scripts/ || true", { encoding: 'utf8' })
      .split('\n').filter(Boolean).filter((p) => p !== VERIFIER)
      .map((p) => p.replace(/^\.\//, '')).sort()
    if (JSON.stringify(labelled) !== JSON.stringify(RETARGETED)) return false
    for (const p of RETARGETED) {
      if (!read(p).includes('RETARGET (EXLIB-2V snapshot-review decision preparation)')) return false
    }
    return true
  })())

console.log('\nG. Round-1 corrected form contract')
check('G1: the LIFECYCLE is explicit and lawful in all three review forms (Codex round 1) — the blank form is an approved TEMPLATE and not a decision; EXACTLY ONE lawful human-completion transition exists (only the six named human fields change from null to complete human-supplied values, no field may remain null in a completed decision, no machine or preparer may fill or preselect, no other byte may change); AFTER completion any further byte change voids the decision; source-byte and hosted-row-state changes void it independently; filling still has no database effect; the self-voiding round-0 rule is GONE; and the authority-inputs form is deliberately byte-identical to its preparation-commit blob (its "recorded inputs" voiding target exists only after completion, so it carries no equivalent contradiction)',
  (() => {
    for (const f of forms) {
      if (f.voiding_rule !== undefined) return false
      const lc = f.lifecycle
      if (!lc) return false
      if (!String(lc.state).includes('PREPARED_BLANK_TEMPLATE')) return false
      if (!String(lc.state).includes('NOT a decision')) return false
      const t = String(lc.lawful_completion_transition)
      if (!t.includes('EXACTLY ONE lawful transition')) return false
      for (const k of ['decision', 'reviewer', 'reviewer_role_or_credential', 'reviewed_at', 'rationale', 'evidence']) {
        if (!t.includes(k)) return false
      }
      if (!t.includes('from null to complete human-supplied values')) return false
      if (!t.includes('NO field may remain null in a completed decision')) return false
      if (!t.includes('NO machine or preparer may fill or preselect')) return false
      if (!t.includes('NO OTHER BYTE of the form may change')) return false
      if (!String(lc.post_completion_immutability).includes('any further byte change to the completed form voids the decision')) return false
      if (!String(lc.external_voiding).includes('hosted row state')) return false
      if (!String(lc.external_voiding).includes('voids the decision')) return false
      if (!String(lc.no_database_effect).includes('one-use application package')) return false
    }
    const prepBlob = execSync(`git rev-parse "96c3bbbb6d9b4487d21684a891eab72458416ca5:${AUTH_FORM}"`, { encoding: 'utf8' }).trim()
    const liveBlob = execSync(`git hash-object "${AUTH_FORM}"`, { encoding: 'utf8' }).trim()
    if (prepBlob !== liveBlob) return false
    if (authForm.voiding_rule !== 'Any byte change to this form voids the recorded inputs.') return false
    return recFlat.includes('carries no equivalent contradiction')
  })())
check('G2: created_at is represented TRUTHFULLY (Codex round 1) — it remains one of the 18 trigger-frozen governed keys in every form, its value is the explicit UNKNOWN_NOT_PRESERVED_HOSTED_GENERATED sentinel string (never JSON null and never a claimed-known timestamp), the forms state the database value is NON-NULL quoting the real schema constraint (proven against the migration bytes), classify it as operational metadata rather than a human content-review input while trigger-frozen, require application-time row-identity/state verification, and every verbatim/completeness claim is narrowed to SEVENTEEN preserved values (the round-0 every-field-verbatim claim is gone from forms and record)',
  (() => {
    for (const f of forms) {
      const keys = Object.keys(f.governed_field_set).filter((k) => !k.startsWith('_'))
      if (keys.length !== 18 || !keys.includes('created_at')) return false
      const ca = f.governed_field_set.created_at
      if (ca.value !== 'UNKNOWN_NOT_PRESERVED_HOSTED_GENERATED') return false
      if (typeof ca.value !== 'string') return false
      if (/\d{4}-\d{2}-\d{2}/.test(String(ca.value))) return false
      if (ca.database_value_is_non_null !== true) return false
      if (!String(ca.database_constraint).includes('TIMESTAMPTZ NOT NULL DEFAULT NOW()')) return false
      if (!String(ca.value_representation_note).includes('NOT a JSON null')) return false
      if (!String(ca.classification).includes('NOT a human content-review input')) return false
      if (!String(ca.classification).includes('trigger-frozen')) return false
      if (!String(ca.application_time_rule).includes('row identity and state at application')) return false
      if (!String(f.verbatim_scope).includes('seventeen of the eighteen')) return false
      if (JSON.stringify(f).includes('governed_field_set_verbatim')) return false
    }
    const mig023 = gitShow('supabase/migrations/023_exlib_catalog_and_delivery_contract.sql')
    const catBlock = mig023.slice(mig023.indexOf('CREATE TABLE exercise_catalog ('), mig023.indexOf('CREATE UNIQUE INDEX exercise_catalog_logical_version_unique_idx'))
    if (!catBlock.includes('created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()')) return false
    if (recFlat.includes('EVERY governed snapshot field verbatim')) return false
    return recFlat.includes('SEVENTEEN preserved values verbatim and created_at explicitly UNKNOWN')
  })())

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
