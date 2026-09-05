# EXLIB-2Q — hosted import-admission application record

Recorded 2026-09-05 (UTC). APPLICATION EVIDENCE ONLY — this record
documents that the reviewed EXLIB-2Q Plank import-admission package
WAS EXECUTED ONCE against the hosted ShredOS Supabase project by the
authorized operator path, and preserves the operator-confirmed proof.
The hosted execution and every hosted check were performed by ChatGPT,
NOT by Claude: Claude made no hosted contact in this phase and never
executes admission packages. This record itself approves NOTHING
further: publication, relationship projection, delivery activation,
sealing, revocation, run creation, the seed module edit, and the
inventory seed_link_compatible flip all remain separately gated acts.

## 1. Execution facts

- Executed by: ChatGPT (the Joseph/ChatGPT-only execution path; never
  by Claude), against the ShredOS Supabase project ttybyljytiwntvorugcv
  ONLY.
- Project identity at execution: name ShredOS, ref
  ttybyljytiwntvorugcv, status ACTIVE_HEALTHY, PostgreSQL engine 17,
  reported database version 17.6.1.127.
- Recovery point confirmed BEFORE execution: a physical backup at
  2026-09-04 13:09:27 UTC existed and was operator-confirmed current
  before the package ran.
- Executed package: docs/exlib2q-plank-import-admission-package.sql at
  main = ed9f5aa9f176f4d5a38df134f664da85d7674270 (tag
  exlib2q-plank-import-admission-prep-reviewed-not-executed, tag object
  e87526c52e2854df0d2d3baaeb87e0c6e92c49f0), 39,382 bytes, SHA-256
  b15b9313db5efe679ca0d13cd0d9b9d97fd9316ec1d66d99c5bba6ca47529e57.
  The package file remains byte-identical after execution; any byte
  change would void its reviewed/executed status.
- The exact promoted package executed ONCE and the transaction
  COMMITTED successfully, with no retry and no partial replay.
- TIMING PRECISION — the OPERATOR EVIDENCE WINDOW: the operator's
  pre-execution/start marker was 2026-09-05 17:56:20.797012 UTC and
  the post-execution proof query completed at
  2026-09-05 17:56:58.256852 UTC. The first and last timestamps are
  the operator evidence window, NOT the transaction's exact commit
  timestamp: the final timestamp records when the post-execution proof
  query finished, and the transaction committed at some point inside
  the window. The hosted content row's updated_at produced by the
  admission — 2026-09-05 17:56:32.572174 UTC — is the
  database-generated row timestamp inside that window (a mutable
  bookkeeping timestamp the package deliberately does not pin,
  recorded here for completeness).
- This is a DATA-LIFECYCLE package: it creates NO migration-history
  entry. The REPOSITORY migration sequence in effect on hosted
  remains exactly 001-027.
- The package is ONE-USE by design and is now SPENT on this project:
  it must never be rerun. A second execution refuses fail-closed at
  the package's own pre-admission-state gate BEFORE any write or
  authority change — the content row is NO LONGER UNADMITTED, so the
  gate raises its exact refusal ("not the exact reviewed
  pre-admission state") — and the function independently refuses an
  already-admitted version ("admission is one-time and one-way"),
  exactly as documented and as proven by the promoted live-harness
  one-use and race checks.
- BYTE-FROZEN PROSE IMPRECISION, disclosed: the SPENT package's
  serialization comment says the race loser "refuses at the pre-state
  gate (the content row is no longer pending)". Precisely read, the
  Plank content row's content_status was 'approved' — never
  'pending' — throughout EXLIB-2Q; what the loser actually hits is
  that same pre-admission-state gate refusing because the row is NO
  LONGER UNADMITTED. The parenthetical is EXLIB-2P-skeleton phrasing
  that survived the prose-truthfulness review; it is explanatory
  comment text, it changes no lock, gate, or refusal, and the
  executable refusal message it describes is exact. The package bytes
  are promoted and SPENT, so they are disclosed here rather than
  modified — any byte change would void the reviewed/executed status.
- The evidence in this record comes from FIVE distinct sources, kept
  separate throughout: (a) the INDEPENDENT READ-ONLY PREFLIGHT
  ChatGPT performed before executing the package (section 2); (b) the
  package's INTERNAL preconditions and postconditions, proven because
  they ran and the transaction committed — any failure would have
  rolled everything back; (c) the RETURNED JSONB surfaced by the
  hosted SQL response (section 3); (d) ChatGPT's independent
  POST-EXECUTION queries (sections 4 onward); and (e) the ADVISOR
  runs (section 9). Nothing from one source is presented as coming
  from another.

## 2. The independent read-only preflight (operator-confirmed)

BEFORE executing the package, ChatGPT independently queried the
hosted database state — read-only — and executed only after every
result matched the reviewed pre-state. The preflight was observed at
2026-09-05 17:56:02.541021 UTC. It is an independent ChatGPT query
source, distinct from the package-internal gates and from the
post-execution queries. PRESERVATION SCOPE: unlike the EXLIB-2P
evidence milestone (whose preflight payload values were not supplied
and were therefore not preserved), the exact whole-row payload and
authorship values WERE supplied in this execution evidence and ARE
preserved verbatim below. No additional preflight fact is claimed
beyond what is listed here.

- Execution identity: current_user = postgres AND session_user =
  postgres; postgres is not a superuser.
- Admission-role baseline: exactly one exlib_catalog_admission
  membership row — member postgres, grantor supabase_admin,
  ADMIN true, INHERIT false, SET false.
- Pre-execution count vector, in package order: 3/3/5/3/6/1/2/0/0/0/0.
- The pre-execution Plank content row: id
  e21b2c00-0000-4000-a000-000000000101, logical_id
  e21b2c00-0000-4000-a000-000000000001, content_version 1,
  content_status = approved, reviewed_by = Nick Tkacz,
  reviewed_at = 2026-09-02 00:35:00 UTC (exactly the same instant as
  2026-09-01T20:35:00-04:00), review_rationale = Everything looks
  correct, publication_status = draft, import_admitted = false,
  admitted_fingerprint null, admitted_source_sha256 null,
  admitted_at null, updated_at = 2026-09-05 03:14:36.146071 UTC (the
  hosted bookkeeping timestamp the promoted EXLIB-2P application
  record evidenced after the database content review).
- The preflight returned the complete content row, including these
  exact payload/authorship values, preserved verbatim:
  - authored_at: 2026-09-01
  - authored_by: ForgeFitOS content program (AI-drafted original
    prose; pending human specialist review)
  - setup_steps:
    1. Lie face down, then prop yourself on your forearms with your
       elbows stacked directly under your shoulders.
    2. Extend your legs behind you with your feet about hip-width
       apart and your toes tucked under.
    3. Before lifting, brace your trunk gently as if preparing for a
       light press against your stomach.
  - execution_steps:
    1. Lift your hips so your body forms one straight line from the
       back of your head to your heels.
    2. Squeeze your glutes and keep your ribs drawn down so your
       lower back never sags toward the floor.
    3. Hold the position for the planned duration while keeping your
       neck long and your gaze at the floor.
    4. End the hold by lowering your knees to the floor under
       control, then rest fully before the next hold.
  - breathing_cue: Breathe steadily for the whole hold with slow
    inhales and full exhales; never hold your breath to stiffen the
    position.
  - common_mistakes:
    1. Letting the hips sag so the lower back arches instead of
       staying in one straight line.
    2. Lifting the hips too high, which turns the hold into a rest
       position for the trunk.
    3. Grinding out extra seconds with a broken line instead of
       ending the hold when the position degrades.
  - safety_guidance: A plank loads the trunk hardest once the hips
    drift, so keep the line strict rather than chasing longer times;
    if your lower back starts to ache or your hips sag and you cannot
    correct it, lower your knees and stop the hold there.
  - equipment_setup: the EMPTY STRING (zero-length, not null).
  - accessibility_alternative: Hold the position with your knees
    resting on the floor, or brace against a countertop at an incline
    for a gentler version.
- The Plank snapshot: hosted snapshot UUID
  ca566325-8d0d-4152-a15d-63baa065ac1d, logical UUID
  e21b2c00-0000-4000-a000-000000000001, canonical name Plank,
  category isolation, active, catalog version 1, review_status
  pending with null reviewer fields; bodyweight / abs / bilateral /
  timed; forgefitos_original; core_anti_extension / core / beginner /
  minimal; discovery-source quadruple null.
- The Dead bug snapshot: hosted snapshot UUID
  1ce09c1f-c13d-4231-8e12-6f35cfd761b5, logical UUID
  e21b2c00-0000-4000-a000-000000000002, canonical name Dead bug,
  category mobility, active, version 1, review_status pending with
  null reviewer fields.
- The Ab wheel rollout snapshot: hosted snapshot UUID
  c715d840-944b-4019-b984-1687accffcf4, logical UUID
  e21b2c00-0000-4000-a000-000000000003, canonical name
  Ab wheel rollout, category other, active, version 1, review_status
  pending with null reviewer fields.
- Anatomy: Plank lower_back/tertiary and obliques/secondary; Dead bug
  hip_flexors/secondary; Ab wheel rollout lats/tertiary and
  obliques/secondary.
- Aliases: Plank Forearm plank and Front plank; Ab wheel rollout
  Ab roller rollout.
- Claims: Plank plank/canonical, forearm plank/alias, front
  plank/alias; Dead bug dead bug/canonical; Ab wheel rollout
  ab wheel rollout/canonical, ab roller rollout/alias.
- Expected relationships: progression to
  e21b2c00-0000-4000-a000-000000000003 and substitution to
  e21b2c00-0000-4000-a000-000000000002.
- Claims invariant: 0 orphaned / 0 unclaimed.
- Client execution denials: anon, authenticated, and service_role
  could each NOT execute public.admit_catalog_content.
- Tenant exercises count: 84.

PRECISION BOUNDARY (what the separate preflight did NOT establish):
the reverse target bindings, the transition-neutrality digest
comparisons, the two-grantor structural authority proof, and every
other internal transaction gate were NOT independently queried by the
preflight. Those are proven because the package's own preconditions
ran and the transaction committed — package-internal evidence, kept
distinct from the independently queried facts above. The Plank hosted
snapshot UUID recorded above is a loader-generated hosted surrogate,
observed by the preflight and recorded here as evidence; consistent
with the accepted fixture-portability rule it is NOT a precondition
of the package, whose gates bind every target by logical UUID,
structure, name, category, activity, version, and review state.

## 3. The returned JSONB (surfaced by the hosted SQL response)

The single SELECT echoed the admission function's JSONB return,
verbatim:

- admitted: e21b2c00-0000-4000-a000-000000000101
- logical_id: e21b2c00-0000-4000-a000-000000000001
- content_version: 1
- admitted_fingerprint:
  23976eedf2d59b66cdfa05cd660a414430feabef8906e1936cb24f541040de9e
- admitted_source_sha256:
  d82078490efa9ef13e128e7b7b742fbda8ea9e74e32382252d96c326c679d752

The admitted field carries the admitted CONTENT UUID and the
logical_id field its identity, exactly the package's own two UUID
call arguments; admitted_source_sha256 equals the package's third
argument — the SHA-256 of the promoted repository artifact
docs/exlib2g-plank-content.jsonl; and admitted_fingerprint is the
HOSTED, DATABASE-GENERATED admission-manifest fingerprint — computed
by public.exlib_content_admission_fingerprint, never an argument and
deliberately absent from the package's pinned literals. Every field
equals the row postconditions below; the echo is display-only
evidence and the row postconditions are the binding proof, exactly as
the package header states.

## 4. Operator-confirmed hosted proof (post-execution)

The following facts were confirmed against the hosted database by
ChatGPT's independent post-execution proof query. Claude did not
contact the hosted database; the EXPECTED-STATE facts below are
additionally cross-checked mechanically against the executed
package's own fail-closed postconditions, the promoted admitted
artifact, and the committed schema by
scripts/verify-exlib2q-application.ts.

The admitted Plank content row (content UUID
e21b2c00-0000-4000-a000-000000000101 under logical UUID
e21b2c00-0000-4000-a000-000000000001, content_version 1):

- import_admitted = true
- admitted_fingerprint =
  23976eedf2d59b66cdfa05cd660a414430feabef8906e1936cb24f541040de9e
- The freshly recomputed fingerprint —
  public.exlib_content_admission_fingerprint re-run by the proof
  query — returned
  23976eedf2d59b66cdfa05cd660a414430feabef8906e1936cb24f541040de9e,
  equal to the stored value: fingerprint_fresh = true, the exact
  freshness equality the package's postcondition demanded inside the
  transaction and publication will later demand again.
- admitted_source_sha256 =
  d82078490efa9ef13e128e7b7b742fbda8ea9e74e32382252d96c326c679d752
  (the promoted artifact's SHA-256, format-validated by the function
  and pinned by the package's postcondition).
- admitted_at = 2026-09-05 — the UTC execution date; the function
  sets CURRENT_DATE, which is transaction-stable, and the package's
  postcondition compared it to CURRENT_DATE exactly.

Unchanged content state:

- content_status = approved; the exact Nick Tkacz review tuple is
  unchanged (reviewed_by = Nick Tkacz, reviewed_at = the
  2026-09-01T20:35:00-04:00 instant, review_rationale = Everything
  looks correct).
- The complete content payload and authorship remained unchanged
  (every field the package re-asserted by exact value after the
  admission — the same values preserved verbatim in section 2).
- publication_status = draft (publication remains absent).
- content_version = 1; the logical/content UUID binding is unchanged.

The eleven-table count vector was exactly 3/3/5/3/6/1/2/0/0/0/0 —
UNCHANGED from the pre-state, matching the package's own post-state
pin term for term, in the package's own order:

- exercise_catalog_logical: 3
- exercise_catalog: 3
- exercise_catalog_muscles: 5
- exercise_catalog_aliases: 3
- exercise_catalog_name_claims: 6
- exercise_catalog_content: 1
- exercise_catalog_content_expected_relationships: 2
- exercise_catalog_relationships: 0
- exercise_catalog_import_runs: 0
- exercise_catalog_run_items: 0
- exercise_catalog_review_events: 0

An admission updates one content row in place and changes no table
count, so one-use is enforced by the pre-admission-state gate, not
the vector — exactly the reviewed derivation.

## 5. Review-event precision (schema-derived, formally accepted)

- exercise_catalog_review_events remains exactly 0. This is EXPECTED
  AND CORRECT: the table is SNAPSHOT-review scoped (its catalog_id
  references exercise_catalog(id), and its guard trigger accepts
  inserts only from the snapshot review-transition trigger, at
  pg_trigger_depth >= 2).
- The admission's durable audit is the content row's own admission
  surface — import_admitted / admitted_fingerprint /
  admitted_source_sha256 / admitted_at — alongside the FROZEN review
  tuple on exercise_catalog_content, under the one-way admission
  machine ("admission is one-time and one-way").
- No review event was invented or manually inserted, and the zero
  count is NOT missing evidence — it is the schema working exactly as
  designed, as Codex formally accepted in the EXLIB-2P preparation
  review and re-derived for the admission in the EXLIB-2Q
  preparation.

## 6. Unchanged surfaces (operator-confirmed)

- Catalog claims invariant: 0 orphaned / 0 unclaimed.
- Projected relationships: 0. Import runs: 0. Run items: 0.
- Tenant exercises table: exactly 84 rows, unchanged.
- Anatomy unchanged: Plank lower_back/tertiary and
  obliques/secondary; Dead bug hip_flexors/secondary; Ab wheel
  rollout lats/tertiary and obliques/secondary.
- Aliases unchanged: Plank Forearm plank and Front plank; Ab wheel
  rollout Ab roller rollout.
- Claims unchanged: plank / canonical, forearm plank / alias, front
  plank / alias; dead bug / canonical; ab wheel rollout / canonical,
  ab roller rollout / alias.
- Expected relationships unchanged: progression ->
  e21b2c00-0000-4000-a000-000000000003 (Ab wheel rollout) and
  substitution -> e21b2c00-0000-4000-a000-000000000002 (Dead bug).

## 7. The Plank snapshot and both target snapshots (operator-confirmed, distinct and unswapped)

Plank:

- Logical UUID e21b2c00-0000-4000-a000-000000000001; hosted snapshot
  UUID ca566325-8d0d-4152-a15d-63baa065ac1d (the loader-generated
  hosted surrogate, first evidenced by this milestone's preflight and
  post-execution queries; per the accepted fixture-portability rule
  it is evidence, never a package precondition).
- canonical_name = Plank, category = isolation, active, catalog
  version 1, review_status = pending with NULL reviewer fields,
  unchanged by the admission (the admission changes exactly the
  content row's admission surface).

Dead bug:

- Logical UUID e21b2c00-0000-4000-a000-000000000002; hosted snapshot
  UUID 1ce09c1f-c13d-4231-8e12-6f35cfd761b5 (the same hosted
  surrogate the promoted EXLIB-2O and EXLIB-2P application records
  evidenced).
- canonical_name = Dead bug, category = mobility, active, catalog
  version 1, review_status = pending with NULL reviewer fields.

Ab wheel rollout:

- Logical UUID e21b2c00-0000-4000-a000-000000000003; hosted snapshot
  UUID c715d840-944b-4019-b984-1687accffcf4 (likewise identical to
  the promoted EXLIB-2O and EXLIB-2P evidence).
- canonical_name = Ab wheel rollout, category = other, active,
  catalog version 1, review_status = pending with NULL reviewer
  fields.

All three snapshots are unchanged and the bindings remain distinct
and unswapped; the admission touched no snapshot row.

## 8. Authority restoration (operator-confirmed)

- Exactly ONE exlib_catalog_admission membership remains: member
  postgres, grantor supabase_admin, ADMIN TRUE, INHERIT FALSE,
  SET FALSE — the exact reviewed baseline, grantor included.
- The temporary postgres-granted SET membership is ABSENT.
- pg_has_role('postgres','exlib_catalog_admission','SET') = false.
- anon EXECUTE = false, authenticated EXECUTE = false, service_role
  EXECUTE = false on public.admit_catalog_content — they remain
  false, matching the preflight.
- No persistent authority widening occurred: the package's
  transaction-contained elevation was created and exactly restored
  inside the single committed transaction, precisely as reviewed.

## 9. Hosted advisors (run by ChatGPT, never Claude)

- BOTH hosted advisor classes — the Supabase SECURITY advisor and the
  Supabase PERFORMANCE advisor — were run by ChatGPT immediately
  after this execution, at approximately 2026-09-05 17:57:06 UTC.
- NEITHER advisor result is claimed to be globally clean. This record
  states only what was established: NEITHER produced an execution
  failure or a blocking finding attributable to this Plank import
  admission.
- SECURITY retains the RLS-enabled-with-no-policy INFO notices on the
  catalog tables — the INTENTIONAL deny-by-default posture, exactly
  the reviewed design, preserved precisely and not "fixed".
- SECURITY also reported broader pre-existing warnings — including
  mutable search paths, callable SECURITY DEFINER functions
  elsewhere, and leaked-password protection being disabled. These
  remain UNADJUDICATED and OUTSIDE EXLIB-2Q; they belong to their own
  future operator decisions.
- PERFORMANCE retains broader pre-existing indexing, RLS-init-plan,
  connection-strategy, and unused-index notices. None of these
  notices is claimed introduced, fixed, accepted, or adjudicated
  here.
- No advisor item was silently fixed in this milestone.

## 10. The lifecycle distinction (held precisely)

The stages remain distinct and are never conflated:

1. HUMAN content review — EXLIB-2I, done; evidence byte-frozen in the
   completed form and the admitted artifact.
2. HOSTED DATABASE CONTENT REVIEW — EXLIB-2P, done; evidenced by the
   promoted EXLIB-2P application record.
3. IMPORT ELIGIBILITY ADMISSION — THIS record's act: the approved
   content version made import-eligible with its provenance frozen
   (the database-computed manifest fingerprint, the artifact SHA, and
   the admission date), exactly once, through the reviewed authority.
   DONE and evidenced here.
4. PUBLICATION — NOT performed. publication_status is draft.
   publish_catalog_content (role exlib_catalog_admin) was never
   invoked; draft content is never client-visible.
5. RELATIONSHIP PROJECTION — NOT performed. Projected relationships
   remain 0; projection belongs to publication's atomic act.
6. DELIVERY ACTIVATION — NOT performed. The seed module edit and the
   inventory seed_link_compatible flip remain facts of the later
   coordinated delivery-activation release.

Admission makes the approved version eligible for import and freezes
its provenance; it publishes nothing, projects nothing, and delivers
nothing. Any future act needs its own reviewed package and explicit
instruction.

## 11. Verifier lifecycle for this milestone

- scripts/verify-exlib2q.ts carried the preparation phase's HEAD
  topology (exactly two commits over the promoted evidence source
  93202b4e..., with the preserved original preparation commit
  pinned). Its G1/G2 topology proofs are revised under the explicit
  label `RETARGET (EXLIB-2Q hosted-admission evidence)`: they are
  anchored to the promoted EXLIB-2Q preparation tip
  ed9f5aa9f176f4d5a38df134f664da85d7674270 (tree pinned, ancestor of
  HEAD), where they were and remain true. The package header's
  PREPARED — NOT EXECUTED status and the preparation record's
  not-executed statements are byte-frozen history that remain true AS
  WRITTEN of their own phase; no historical proof was weakened, and
  the suite's totals are unchanged in the committed state (33/0). The
  suite's uncommitted-state authoring-scope branch is superseded by
  this milestone's own phase-boundary check in the application
  verifier.
- scripts/verify-exlib2q-application.ts (new) owns the executed-state
  posture from this milestone forward: execution facts pinned
  verbatim with ChatGPT attribution, the recovery point, and the
  operator-evidence-window timing precision; the returned JSONB bound
  to the package's own call arguments and the row postconditions; the
  preflight preserved completely — including the exact payload and
  authorship values — and cross-checked mechanically against the
  promoted admitted artifact; the five-way evidence-source separation
  enforced; the post-state facts cross-checked against the executed
  package's gates, the completed forms, the promoted EXLIB-2O and
  EXLIB-2P evidence records (the identical hosted snapshot UUIDs),
  and the committed schema; the review-event precision block enforced
  verbatim; the advisor precision enforced; the lifecycle distinction
  held; boundaries re-proven; and the lifecycle two-state check (no
  application record at the promoted tip; exactly this one in the
  live tree).

## 12. Dependency map (later, explicitly gated)

1. Codex review of this evidence milestone; push, promotion, and tag
   are separate explicit gates.
2. PUBLICATION of the admitted content — its own reviewed package
   (publish_catalog_content under exlib_catalog_admin, with
   relationship projection as part of publication's atomic act), its
   own Codex review, and its own explicit hosted-execution
   instruction.
3. DELIVERY ACTIVATION — the seed module edit and the inventory
   seed_link_compatible flip remain facts of the later coordinated
   delivery-activation release.
4. Any further catalog lifecycle act requires its own authored,
   reviewed package; this package is SPENT and must never be rerun.
