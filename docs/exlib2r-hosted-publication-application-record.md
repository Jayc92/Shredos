# EXLIB-2R — hosted publication application record

Recorded 2026-09-06 (UTC). APPLICATION EVIDENCE ONLY — this record
documents that the reviewed EXLIB-2R Plank publication package WAS
EXECUTED ONCE against the hosted ShredOS Supabase project by the
authorized operator path, and preserves the operator-confirmed proof.
The hosted execution and every hosted check were performed by ChatGPT,
NOT by Claude: Claude made no hosted contact in this phase and never
executes publication packages. This record itself approves NOTHING
further: delivery activation, sealing, revocation, run creation, the
seed module edit, and the inventory seed_link_compatible flip all
remain separately gated acts.

## 1. Execution facts

- Executed by: ChatGPT (the Joseph/ChatGPT-only execution path; never
  by Claude), against the ShredOS Supabase project ttybyljytiwntvorugcv
  ONLY.
- Project identity at execution: name ShredOS, ref
  ttybyljytiwntvorugcv, status ACTIVE_HEALTHY, PostgreSQL engine 17,
  reported database version 17.6.1.127.
- Recovery point confirmed BEFORE execution: a physical backup at
  2026-09-05 13:10:31 UTC existed and was operator-confirmed current
  before the package ran.
- Executed package: docs/exlib2r-plank-publication-package.sql at
  main = f36ba7545584a813db0fa5e1c7cb389852fca5ae (tag
  exlib2r-plank-publication-prep-reviewed-not-executed, tag object
  aa599f1186cfaa6eec2d884c382ff147249478db), 48,913 bytes, SHA-256
  96ade4887320df83a3032fbb3afcf9566ecc4436276ebe6a54e2af07727f68de.
  The package file remains byte-identical after execution; any byte
  change would void its reviewed/executed status.
- The exact promoted package executed ONCE and the transaction
  COMMITTED successfully, with no retry and no partial replay.
- TIMING PRECISION — the OPERATOR EVIDENCE WINDOW: the independent
  read-only preflight was observed at 2026-09-06T01:37:28.618103Z,
  the operator's execution start marker was
  2026-09-06T01:37:33.538691Z, and the independent post-proof was
  observed at 2026-09-06T01:38:11.758568Z. The first and last
  timestamps are the operator evidence window; the transaction
  committed at some point inside it. The hosted content row's
  updated_at produced by the publication —
  2026-09-06T01:37:42.223891Z — is the database-generated
  publication/projection row timestamp inside that window (a mutable
  bookkeeping timestamp the package deliberately does not pin,
  recorded here for completeness). NO exact transport-return
  completion timestamp exists in the evidence, and none is invented
  here.
- TRANSPORT-RESULT PRECISION: the SQL transport returned [] — zero
  result rows — and did NOT surface PostgreSQL NOTICE output. The
  package's RAISE NOTICE echo and its in-block exact-JSONB equality
  assertion were therefore NOT observed as transport output, and
  this record does not present them as observed. They are proven as
  PACKAGE-INTERNAL evidence exactly the way the package was designed
  to prove them: the assertion ran inside the committed transaction,
  and any mismatch would have raised and rolled the whole
  transaction back. The COMMITTED TRANSACTION and the INDEPENDENT
  POST-STATE QUERIES (sections 4 onward) are the binding proof; the
  internally-asserted JSONB value is cited in section 3 from the
  package bytes, never as observed output.
- This is a DATA-LIFECYCLE package: it creates NO migration-history
  entry. The REPOSITORY migration sequence in effect on hosted
  remains exactly 001-027.
- The package is ONE-USE by design and is now SPENT on this project:
  it must never be rerun. A second execution refuses fail-closed
  BEFORE any write or authority change at BOTH the vector gate (the
  eleven-term vector now carries the two projected rows) and the
  draft clause of the content gate (the row is no longer a draft),
  and migration 027's function independently refuses a non-draft
  version ("only a draft can be published; re-publishing a published
  or retired version is rejected"), exactly as documented and as
  proven by the promoted live-harness one-use and race checks.
- The evidence in this record comes from FIVE distinct sources, kept
  separate throughout: (a) the INDEPENDENT READ-ONLY PREFLIGHT
  ChatGPT performed before executing the package (section 2); (b)
  the package's INTERNAL preconditions, call-block assertion, and
  postconditions, proven because they ran and the transaction
  committed — any failure would have rolled everything back; (c) the
  TRANSPORT RESULT itself, which contributed exactly one fact: []
  with no surfaced notices (section 3); (d) ChatGPT's independent
  POST-EXECUTION queries (sections 4 onward); and (e) the ADVISOR
  observations (section 9). Nothing from one source is presented as
  coming from another.

## 2. The independent read-only preflight (operator-confirmed)

BEFORE executing the package, ChatGPT independently queried the
hosted database state — read-only — and executed only after every
result matched the reviewed pre-state. The preflight was observed at
2026-09-06T01:37:28.618103Z. It is an independent ChatGPT query
source, distinct from the package-internal gates and from the
post-execution queries. The separately preserved preflight facts
supplied to this milestone:

- Execution identity: current_user = postgres AND session_user =
  postgres; postgres is not a superuser.
- Admin-role baseline: exactly one exlib_catalog_admin membership
  row — member postgres, grantor supabase_admin, ADMIN true,
  INHERIT false, SET false.
- Pre-execution count vector, in package order: 3/3/5/3/6/1/2/0/0/0/0.
- The Plank content row: approved, ADMITTED, draft — with
  admitted_fingerprint
  23976eedf2d59b66cdfa05cd660a414430feabef8906e1936cb24f541040de9e
  and admitted_source_sha256
  d82078490efa9ef13e128e7b7b742fbda8ea9e74e32382252d96c326c679d752,
  exactly the promoted EXLIB-2Q evidence values.
- Zero projected relationships, zero review events, zero import
  runs, zero run items.
- Claims invariant: 0 orphaned / 0 unclaimed.
- Tenant exercises count: 84.
- The complete payload, snapshots, anatomy, aliases, claims, and
  expected relationships were independently returned by the
  preflight and are preserved in the operator's execution evidence.

PRESERVATION SCOPE: this record preserves exactly the preflight
facts listed above, as supplied to this milestone. The full
whole-surface preflight transcript (the payload field values, the
hosted snapshot UUIDs, and the per-row anatomy/alias/claim
readbacks) is preserved in the OPERATOR'S evidence set and is not
restated here; no hosted snapshot UUID was supplied to this
milestone and none is recorded here. The exact-value equality of
every one of those surfaces to the promoted literals was then
additionally proven by the executed package's own field-level
pre-gates — package-internal evidence, distinct from the preflight.
PRECISION BOUNDARY: the reverse target bindings, the
transition-neutrality digest comparisons, the two-grantor structural
authority proof, and every other internal transaction gate were NOT
independently queried by the preflight; those are proven because the
package's own preconditions ran and the transaction committed.

## 3. The transport result (what the SQL transport actually returned)

The SQL transport returned [] — zero result rows — and did not
surface PostgreSQL NOTICE output. Nothing else was observed on the
transport channel.

For completeness, the value the package asserted INTERNALLY (cited
from the promoted package bytes, NOT observed as output): the call
block captured the function's JSONB return into v_result, required
it exactly equal to {logical_id ...0001, published ...0101, retired
null, content_version 1, projected_relationships 2}, and would have
raised — rolling back everything — on any difference. Because the
transaction COMMITTED, that equality held. The RAISE NOTICE echo of
the same value was emitted server-side by the package but was not
carried back by the transport, so it is not evidence here; the row
postconditions and the independent post-state queries below are the
binding proof, exactly as the package header states.

## 4. Operator-confirmed hosted proof (post-execution)

The following facts were confirmed against the hosted database by
ChatGPT's independent post-proof queries, observed at
2026-09-06T01:38:11.758568Z. Claude did not contact the hosted
database; the EXPECTED-STATE facts below are additionally
cross-checked mechanically against the executed package's own
fail-closed postconditions, the promoted admitted artifact, and the
committed schema by scripts/verify-exlib2r-application.ts.

The eleven-table count vector was exactly 3/3/5/3/6/1/2/2/0/0/0 —
moved from the pre-state EXACTLY as a publication moves it (the
atomic projection added the two Plank relationship rows and nothing
else anywhere), matching the package's own post-state pin term for
term, in the package's own order:

- exercise_catalog_logical: 3
- exercise_catalog: 3
- exercise_catalog_muscles: 5
- exercise_catalog_aliases: 3
- exercise_catalog_name_claims: 6
- exercise_catalog_content: 1
- exercise_catalog_content_expected_relationships: 2
- exercise_catalog_relationships: 2
- exercise_catalog_import_runs: 0
- exercise_catalog_run_items: 0
- exercise_catalog_review_events: 0

The published Plank content row (content UUID
e21b2c00-0000-4000-a000-000000000101 under logical UUID
e21b2c00-0000-4000-a000-000000000001, content_version 1):

- publication_status = published. Publication counts for the
  identity: published 1, draft 0, retired 0 — the one-way transition
  landed exactly once and retired nothing (no published predecessor
  existed, exactly as the pre-state gate proved).
- Hosted updated_at after the publication:
  2026-09-06T01:37:42.223891Z — the database-generated
  publication/projection row timestamp inside the operator evidence
  window (section 1).
- The admission surface is intact: admitted_fingerprint
  23976eedf2d59b66cdfa05cd660a414430feabef8906e1936cb24f541040de9e
  and admitted_source_sha256
  d82078490efa9ef13e128e7b7b742fbda8ea9e74e32382252d96c326c679d752,
  both independently observed unchanged. admitted_at is unchanged BY
  SCHEMA LAW — migration 027's freeze trigger requires the
  publication transition to travel alone, so no admission field
  could change in the same act — and its presence is re-proven by
  the package's own postcondition (package-internal evidence).
- The content payload, authorship, and the applied human-review
  tuple remained unchanged (independently observed; the package
  additionally re-asserted every field by exact value after the
  transition).

## 5. The atomic projection (operator-confirmed, distinct and unswapped)

Exactly TWO projected relationships exist, and they are exactly the
promoted expected set, projected atomically inside the same
committed transaction as the publication transition:

1. Plank e21b2c00-0000-4000-a000-000000000001 — progression ->
   Ab wheel rollout e21b2c00-0000-4000-a000-000000000003.
2. Plank e21b2c00-0000-4000-a000-000000000001 — substitution ->
   Dead bug e21b2c00-0000-4000-a000-000000000002.

No swapped relationships exist: the progression aims at the Ab wheel
rollout identity and the substitution at the Dead bug identity,
matching the promoted artifact (progressions = [Ab wheel rollout],
substitutions = [Dead bug]) and the promoted expected-relationship
rows. The whole projection table holds exactly these two rows. The
package's own postconditions additionally proved projected-set
equality in BOTH directions against the expected set (no missing
row, no unexpected row) — the same structural equality migration
027's freeze trigger re-verified at the draft -> published
transition. The projection rows' created_at values are database
defaults, deliberately not gated or recorded by value.

## 6. Review-event precision (schema-derived, formally accepted)

- exercise_catalog_review_events remains exactly 0. This is EXPECTED
  AND CORRECT: the table is SNAPSHOT-review scoped (its catalog_id
  references exercise_catalog(id), and its guard trigger accepts
  inserts only from the snapshot review-transition trigger, at
  pg_trigger_depth >= 2).
- A publication writes ZERO rows there BY SCHEMA DESIGN; the
  publication's durable audit is the content row's one-way
  publication_status machine plus the protected projection itself.
- No review event was invented or manually inserted, and the zero
  count is NOT missing evidence — it is the schema working exactly
  as designed, as Codex formally accepted in the EXLIB-2P
  preparation review and as re-derived for publication in the
  EXLIB-2R preparation.

## 7. Unchanged surfaces (operator-confirmed)

- Catalog claims invariant: 0 orphaned / 0 unclaimed.
- Import runs: 0. Run items: 0.
- Tenant exercises table: exactly 84 rows, unchanged.
- The snapshots, anatomy, aliases, claims, and expected
  relationships remained unchanged (independently observed; the
  package additionally proved the untouched families digest-identical
  between its two readings and re-asserted the gated sets exactly).
- The seed module and the inventory seed_link_compatible flag are
  repository artifacts the package cannot and does not touch; the
  Plank inventory row remains seed_link_compatible false.

## 8. Authority restoration (operator-confirmed)

- Exactly ONE exlib_catalog_admin membership remains: member
  postgres, grantor supabase_admin, ADMIN TRUE, INHERIT FALSE,
  SET FALSE — the exact reviewed baseline, grantor included.
- The temporary postgres-granted SET membership is ABSENT.
- pg_has_role('postgres','exlib_catalog_admin','SET') = false.
- anon EXECUTE = false, authenticated EXECUTE = false, service_role
  EXECUTE = false on public.publish_catalog_content — the three-way
  function denial holds.
- SELECT on public.exercise_catalog_relationships = false for anon
  and authenticated — the ordinary-client table boundary holds; a
  published version remains invisible to anon and authenticated.
- HOSTED service_role TABLE OBSERVATION: the post-proof
  independently observed service_role's projection-table SELECT as
  FALSE on hosted. This is recorded as a hosted OBSERVATION under
  the accepted interpretation, unchanged: service_role's table
  posture is a platform-bootstrap-dependent fact, deliberately NOT a
  package gate (the reviewed fixture-portability boundary), and this
  observation does not convert it into a schema guarantee or a
  future precondition.
- No persistent authority widening occurred: the package's
  transaction-contained elevation was created and exactly restored
  inside the single committed transaction, precisely as reviewed.

## 9. Hosted advisors (run by ChatGPT, never Claude)

- The advisor results are captured as POST-EXECUTION OBSERVATIONS,
  not changes. Neither advisor class is claimed to be globally
  clean, and no advisor finding was fixed during execution.
- SECURITY retains the RLS-enabled-with-no-policy INFO notices on
  the private catalog tables — the INTENTIONAL deny-by-default
  posture, exactly the reviewed design, preserved precisely and not
  "fixed".
- Broader pre-existing security and performance warnings remain
  UNADJUDICATED and OUTSIDE EXLIB-2R; they belong to their own
  future operator decisions.

## 10. The lifecycle distinction (held precisely)

The stages remain distinct and are never conflated:

1. HUMAN content review — EXLIB-2I, done; evidence byte-frozen in
   the completed form and the admitted artifact.
2. HOSTED DATABASE CONTENT REVIEW — EXLIB-2P, done; evidenced by the
   promoted EXLIB-2P application record.
3. IMPORT ELIGIBILITY ADMISSION — EXLIB-2Q, done; evidenced by the
   promoted EXLIB-2Q application record.
4. PUBLICATION WITH ITS ATOMIC RELATIONSHIP PROJECTION — THIS
   record's act: the admitted version became the identity's
   published version and the protected projection became exactly its
   expected set, as ONE ATOMIC act, exactly once, through the
   reviewed authority. DONE and evidenced here.
5. DELIVERY ACTIVATION — NOT performed. The seed module edit and the
   inventory seed_link_compatible flip remain facts of the later
   coordinated delivery-activation release. DATABASE PUBLICATION IS
   NOT PRODUCT DELIVERY: the catalog tables keep RLS with zero
   policies and the ordinary-client denials above, so the published
   version remains invisible to anon and authenticated.

## 11. Verifier lifecycle for this milestone

- scripts/verify-exlib2r.ts carried the preparation phase's HEAD
  topology (exactly two commits over the promoted source 64640e9...,
  with the preserved original preparation commit pinned). Its G1/G2
  topology proofs are revised under the explicit label
  `RETARGET (EXLIB-2R hosted-publication evidence)`: they are
  anchored to the promoted EXLIB-2R preparation tip
  f36ba7545584a813db0fa5e1c7cb389852fca5ae (tree pinned, ancestor of
  HEAD), where they were and remain true. The package header's
  PREPARED — NOT EXECUTED status and the preparation record's
  not-executed statements are byte-frozen history that remain true
  AS WRITTEN of their own phase; no historical proof was weakened,
  and the suite's totals are unchanged in the committed state
  (33/0). The suite's uncommitted-state authoring-scope branch is
  superseded by this milestone's own phase-boundary check in the
  application verifier.
- scripts/verify-exlib2r-application.ts (new) owns the
  executed-state posture from this milestone forward: execution
  facts pinned verbatim with ChatGPT attribution, the recovery
  point, and the operator-evidence-window timing precision; the
  TRANSPORT-RESULT precision enforced (the [] result and unsurfaced
  notice are never presented as observed JSONB; the package-internal
  assertion is cited as such); the five-way evidence-source
  separation enforced; the preflight preserved at its supplied scope
  with the preservation-scope boundary; the post-state facts
  cross-checked against the executed package's gates, the promoted
  artifact, and the committed schema; the atomic-projection and
  no-swap facts enforced; the review-event precision block enforced
  verbatim; the authority restoration, the ordinary-client boundary,
  and the hosted service_role observation's non-gate interpretation
  enforced; the advisor precision enforced; the lifecycle
  distinction held; boundaries re-proven; and the lifecycle
  two-state check (no application record at the promoted tip;
  exactly this one in the live tree).

## 12. Dependency map (later, explicitly gated)

1. Codex review of this evidence milestone; push, promotion, and tag
   are separate explicit gates.
2. DELIVERY ACTIVATION — the seed module edit and the inventory
   seed_link_compatible flip: a later coordinated repository
   release, with its own review and its own explicit instruction.
3. Any further catalog lifecycle act requires its own authored,
   reviewed package; this package is SPENT and must never be rerun.
