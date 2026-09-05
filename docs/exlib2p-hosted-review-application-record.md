# EXLIB-2P — hosted database content-review application record

Recorded 2026-09-05 (UTC). APPLICATION EVIDENCE ONLY — this record
documents that the reviewed EXLIB-2P Plank database content-review
package WAS EXECUTED ONCE against the hosted ShredOS Supabase project
by the authorized operator path, and preserves the operator-confirmed
proof. The hosted execution and every hosted check were performed by
ChatGPT, NOT by Claude: Claude made no hosted contact in this phase
and never executes review packages. This record itself approves
NOTHING further: import eligibility admission, relationship
projection, publication, delivery activation, sealing, revocation,
run creation, the seed module edit, and the inventory
seed_link_compatible flip all remain separately gated acts.

## 1. Execution facts

- Executed by: ChatGPT (the Joseph/ChatGPT-only execution path; never
  by Claude), against the ShredOS Supabase project ttybyljytiwntvorugcv
  ONLY.
- Recovery point confirmed BEFORE execution: a physical backup at
  2026-09-04 13:09:27 UTC existed and was operator-confirmed current
  before the package ran.
- Executed package: docs/exlib2p-plank-database-review-package.sql at
  main = 0e816533e6e3947ec007d7203937d67ce9d69e8d (tag
  exlib2p-plank-database-review-prep-reviewed-not-executed, tag object
  59edb6aa9413c03ae4da78efc071b6307a645630), 37,702 bytes, SHA-256
  76d1d67d6ec2bafc49ef43a6312700559cd9eeee4b8b9433868de9daf95dc666.
  The package file remains byte-identical after execution; any byte
  change would void its reviewed/executed status.
- The exact promoted package executed ONCE and the transaction
  COMMITTED successfully, with no retry and no partial replay.
- Execution started: 2026-09-05 03:14:33.631620 UTC
  (= 2026-09-04 23:14:33.631620 Eastern, EDT).
- Execution finished: 2026-09-05 03:14:37.444297 UTC
  (= 2026-09-04 23:14:37.444297 Eastern, EDT).
- This is a DATA-LIFECYCLE package: it creates NO migration-history
  entry. The REPOSITORY migration sequence in effect on hosted
  remains exactly 001-027.
- The package is ONE-USE by design and is now SPENT on this project:
  it must never be rerun. Its content-pending gate means a second
  execution refuses fail-closed BEFORE any write or authority change
  (the reviewed row is no longer pending), exactly as documented and
  as proven by the promoted live-harness one-use and race checks.
- The evidence in this record comes from THREE distinct sources,
  kept separate throughout: (a) the INDEPENDENT READ-ONLY PREFLIGHT
  ChatGPT performed before executing the package (section 2); (b) the
  package's INTERNAL preconditions and postconditions, proven because
  they ran and the transaction committed — any failure would have
  rolled everything back; and (c) ChatGPT's POST-EXECUTION queries
  (section 4 onward). Nothing from one source is presented as coming
  from another.

## 2. The independent read-only preflight (operator-confirmed)

BEFORE executing the package, ChatGPT independently verified the
package bytes locally, queried the Supabase project identity, and
queried the hosted database state — all read-only — and executed only
after every result matched. The separate preflight queries
independently observed the facts listed below; nothing here is drawn
from the package's own gates. PRESERVATION SCOPE: the preflight's
content-row query returned the whole hosted row — including its
payload and authorship fields — but the exact returned payload and
authorship VALUES were not supplied to this evidence milestone and
are NOT preserved here. This record preserves ONLY the fields
explicitly listed below, and nothing is reconstructed or inferred
from the package, the artifact, or the post-state:

- Project identity: name ShredOS, ref ttybyljytiwntvorugcv, status
  ACTIVE_HEALTHY, PostgreSQL engine 17, reported database version
  17.6.1.127.
- Package bytes, verified locally first: 37,702 bytes, SHA-256
  76d1d67d6ec2bafc49ef43a6312700559cd9eeee4b8b9433868de9daf95dc666.
- Execution identity: current_user = postgres AND session_user =
  postgres; postgres is not a superuser.
- Reviewer-role baseline: exactly one exlib_catalog_reviewer
  membership row — member postgres, grantor supabase_admin,
  ADMIN true, INHERIT false, SET false.
- Pre-execution count vector: 3/3/5/3/6/1/2/0/0/0/0.
- The Plank content row (the query returned the whole row; per the
  preservation scope above, this record preserves exactly these
  fields): logical UUID e21b2c00-0000-4000-a000-000000000001,
  content UUID e21b2c00-0000-4000-a000-000000000101, content
  version 1, content_status = pending,
  reviewed_by/reviewed_at/review_rationale all null,
  publication_status = draft, import_admitted = false,
  admitted_fingerprint/admitted_source_sha256/admitted_at all null.
- Both target snapshot rows: Dead bug (hosted snapshot UUID
  1ce09c1f-c13d-4231-8e12-6f35cfd761b5, logical
  e21b2c00-0000-4000-a000-000000000002, canonical name Dead bug,
  category mobility, active, version 1, review_status pending, all
  snapshot reviewer fields null) and Ab wheel rollout (hosted
  snapshot UUID c715d840-944b-4019-b984-1687accffcf4, logical
  e21b2c00-0000-4000-a000-000000000003, canonical name
  Ab wheel rollout, category other, active, version 1, review_status
  pending, all snapshot reviewer fields null).
- Claims invariant: 0 orphaned / 0 unclaimed.
- Client execution denials: anon, authenticated, and service_role
  could each NOT execute public.apply_content_review.
- Tenant exercises count: 84.
- Recovery: the physical backup at 2026-09-04 13:09:27 UTC,
  confirmed before execution.

PRECISION BOUNDARY (what the separate preflight did NOT return): the
complete field-by-field authoritative payload comparison, the reverse
target bindings, the exact alias, anatomy, claim, and
expected-relationship sets, and every other internal transaction gate
were NOT independently queried by the preflight. Those are proven
because the package's own preconditions ran and the transaction
committed — package-internal evidence, kept distinct from the
independently queried facts above. And, per the preservation scope,
the payload and authorship values the whole-row query returned are
themselves not preserved in this record: observation of a row and
preservation of its values are separate questions, and this record
claims only what it preserves.

## 3. The returned JSONB (surfaced by the hosted SQL response)

The single SELECT echoed the review function's JSONB return, exactly:

- decision: approved
- content_id: e21b2c00-0000-4000-a000-000000000101
- logical_id: e21b2c00-0000-4000-a000-000000000001

Every field equals the package's own call arguments and the row
postconditions below; the echo is display evidence and the row is the
binding proof, exactly as the package header states.

## 4. Operator-confirmed hosted proof (post-execution)

The following facts were confirmed against the hosted database by
ChatGPT's post-execution proof. Claude did not contact the hosted
database; the EXPECTED-STATE facts below are additionally
cross-checked mechanically against the executed package's own
fail-closed postconditions, the promoted admitted artifact, and the
committed schema by scripts/verify-exlib2p-application.ts.

The reviewed Plank content row (content UUID
e21b2c00-0000-4000-a000-000000000101 under logical UUID
e21b2c00-0000-4000-a000-000000000001, content_version 1):

- content_status = approved
- reviewed_by = Nick Tkacz
- reviewed_at = 2026-09-02 00:35:00 UTC — exactly the same INSTANT as
  the human decision's 2026-09-01T20:35:00-04:00 (the offset form and
  the UTC form name one point in time; the package compared the
  column to the timestamptz literal and the hosted read-back confirms
  the instant)
- review_rationale = Everything looks correct
- publication_status = draft (publication remains absent)
- import_admitted = false, admitted_fingerprint NULL,
  admitted_source_sha256 NULL, admitted_at NULL (admission remains
  absent)
- The complete content payload and authorship remained unchanged
  (every field the package re-asserted by exact value after the
  review).
- Hosted updated_at after the review: 2026-09-05 03:14:36.146071 UTC.
  This is a HOSTED FACT on ChatGPT's operator-path authority — a
  mutable bookkeeping timestamp the package deliberately does not
  pin, recorded here for completeness.

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

## 5. Review-event precision (schema-derived, formally accepted)

- exercise_catalog_review_events remains exactly 0. This is EXPECTED
  AND CORRECT: the table is SNAPSHOT-review scoped (its catalog_id
  references exercise_catalog(id), and its guard trigger accepts
  inserts only from the snapshot review-transition trigger, at
  pg_trigger_depth >= 2).
- The Plank content-review audit is the FROZEN TUPLE on
  exercise_catalog_content: content_status / reviewed_by /
  reviewed_at / review_rationale, under the one-way content_status
  machine (corrections require a new content version).
- No review event was invented or manually inserted, and the zero
  count is NOT missing evidence — it is the schema working exactly as
  designed, as Codex formally accepted in the EXLIB-2P preparation
  review.

## 6. Unchanged surfaces (operator-confirmed)

- Catalog claims invariant: 0 orphaned / 0 unclaimed.
- Projected relationships: 0. Import runs: 0. Run items: 0.
- Tenant exercises table: exactly 84 rows, unchanged.
- Plank anatomy unchanged: obliques / secondary and
  lower_back / tertiary.
- Plank aliases unchanged: Forearm plank and Front plank.
- Plank claims unchanged: plank / canonical, forearm plank / alias,
  front plank / alias.
- Expected relationships unchanged: progression ->
  e21b2c00-0000-4000-a000-000000000003 (Ab wheel rollout) and
  substitution -> e21b2c00-0000-4000-a000-000000000002 (Dead bug).

## 7. Target snapshots (operator-confirmed, distinct and unswapped)

Dead bug:

- Logical UUID e21b2c00-0000-4000-a000-000000000002; hosted snapshot
  UUID 1ce09c1f-c13d-4231-8e12-6f35cfd761b5 (the same hosted surrogate
  the promoted EXLIB-2O application record evidenced).
- canonical_name = Dead bug, category = mobility, active, catalog
  version 1, review_status = pending with NULL reviewer fields.

Ab wheel rollout:

- Logical UUID e21b2c00-0000-4000-a000-000000000003; hosted snapshot
  UUID c715d840-944b-4019-b984-1687accffcf4 (likewise identical to the
  promoted EXLIB-2O evidence).
- canonical_name = Ab wheel rollout, category = other, active,
  catalog version 1, review_status = pending with NULL reviewer
  fields.

The bindings remain distinct and unswapped; the content review
touched neither target snapshot.

## 8. Authority restoration (operator-confirmed)

- Exactly ONE exlib_catalog_reviewer membership remains: member
  postgres, grantor supabase_admin, ADMIN TRUE, INHERIT FALSE,
  SET FALSE — the exact reviewed baseline, grantor included.
- The temporary postgres-granted SET membership is ABSENT.
- pg_has_role('postgres','exlib_catalog_reviewer','SET') = false.
- anon EXECUTE = false, authenticated EXECUTE = false, service_role
  EXECUTE = false on public.apply_content_review.
- No persistent authority widening occurred: the package's
  transaction-contained elevation was created and exactly restored
  inside the single committed transaction, precisely as reviewed.

## 9. Hosted advisors (run by ChatGPT, never Claude)

- BOTH hosted advisor classes — the Supabase SECURITY advisor and the
  Supabase PERFORMANCE advisor — were run by ChatGPT immediately
  after this execution.
- NEITHER advisor result is claimed to be globally clean. This record
  states only what was established: NEITHER produced an execution
  failure or a blocking finding attributable to this Plank content
  review.
- SECURITY retains the RLS-enabled-with-no-policy INFO notices on the
  catalog tables — the INTENTIONAL deny-by-default posture, exactly
  the reviewed design, preserved precisely and not "fixed".
- Broader security warnings remain UNADJUDICATED and OUTSIDE
  EXLIB-2P.
- PERFORMANCE retains broader project notices and unused-index INFO
  notices. None of these notices is claimed introduced, fixed,
  accepted, or adjudicated here; they belong to their own future
  operator decisions.

## 10. The lifecycle distinction (held precisely)

The four stages remain distinct and are never conflated:

1. HUMAN content review — EXLIB-2I, done; evidence byte-frozen in the
   completed form and the admitted artifact.
2. HOSTED DATABASE CONTENT REVIEW — THIS record's act: the human
   decision applied to the hosted content row through the reviewed
   authority, exactly once. DONE and evidenced here.
3. IMPORT ELIGIBILITY ADMISSION — NOT performed. import_admitted is
   false with every admission field NULL. admit_catalog_content (role
   exlib_catalog_admission) was never invoked and remains separately
   gated behind its own reviewed package and explicit instruction.
4. PUBLICATION — NOT performed. publication_status is draft.
   publish_catalog_content (role exlib_catalog_admin) was never
   invoked; relationship projection and delivery activation likewise
   remain separately gated later acts.

## 11. Verifier lifecycle for this milestone

- scripts/verify-exlib2p.ts carried the preparation phase's HEAD
  topology (exactly one commit over the promoted evidence source).
  Its G1/G2 topology proofs are revised under the explicit label
  `RETARGET (EXLIB-2P hosted-review evidence)`: they are anchored to
  the promoted EXLIB-2P tip 0e816533e6e3947ec007d7203937d67ce9d69e8d
  (whose tree provably contains no application record), where they
  were and remain true. The package header's PREPARED — NOT EXECUTED
  status and the preparation record's not-executed statements are
  byte-frozen history that remain true AS WRITTEN of their own phase;
  no historical proof was weakened, and the suite's totals are
  unchanged (32/0). The suite's uncommitted-state authoring-scope
  check is superseded by this milestone's own phase-boundary check in
  the application verifier.
- scripts/verify-exlib2p-application.ts (new) owns the executed-state
  posture from this milestone forward: execution facts pinned
  verbatim with ChatGPT attribution and the recovery point; the
  returned JSONB bound to the package's own call arguments; the
  post-state facts cross-checked against the executed package's
  gates, the promoted admitted artifact, the completed forms, the
  promoted EXLIB-2O evidence record (the identical hosted snapshot
  UUIDs), and the committed schema; the review-event precision block
  enforced verbatim; the advisor precision enforced; the lifecycle
  distinction held; boundaries re-proven; and the lifecycle two-state
  check (no application record at the promoted tip; exactly this one
  in the live tree).

## 12. Dependency map (later, explicitly gated)

1. Codex review of this evidence milestone; push, promotion, and tag
   are separate explicit gates.
2. IMPORT ELIGIBILITY ADMISSION of the approved content — its own
   reviewed package (admit_catalog_content under
   exlib_catalog_admission), its own Codex review, and its own
   explicit hosted-execution instruction.
3. Relationship projection and PUBLICATION — separately gated after
   admission, through publish_catalog_content under
   exlib_catalog_admin.
4. DELIVERY ACTIVATION — the seed module edit and the inventory
   seed_link_compatible flip remain facts of the later coordinated
   delivery-activation release.
5. Any further catalog lifecycle act requires its own authored,
   reviewed package; this package is SPENT and must never be rerun.

## 13. Codex correction round 1 (2026-09-05) — the preflight disclosure

The original evidence commit 0843ed4aeb408992faf6af65d51f711f22e510a5
stated: "No separate pre-flight read set is claimed beyond the
recovery point above; nothing is invented here." That statement was
FALSE as a statement about what happened: ChatGPT HAD performed the
independent read-only preflight now recorded in section 2 — verifying
the package bytes locally, querying the Supabase project identity,
and querying the hosted database state — and executed the package
only after those results matched. The original commit under-claimed
the evidence; it invented nothing, but it wrongly asserted that no
independent preflight existed.

This correction is exactly ONE plain forward commit on the preserved
original evidence commit (0843ed4..., tree
6fb25ca8485345c8853f35b6fe9b3e56fe003546, unchanged and never
rewritten), touching exactly this record and
scripts/verify-exlib2p-application.ts. The hosted execution and the
post-state remain valid exactly as evidenced; the package is SPENT
and was NOT rerun; NO hosted contact of any kind occurred during this
local correction. Section 1 now separates the three evidence sources
explicitly (independent preflight, package-internal gates proven by
the committed transaction, post-execution queries), section 2 records
the preflight verbatim with its precision boundary, and the
application verifier gained a dedicated preflight-facts check and a
dedicated correction-topology check while its false-statement
enforcement was removed.

## 14. Codex correction round 2 (2026-09-05) — the preservation scope

The round-1 correction commit 3c91d9ee6707658f9b6891f49d3a52412f4c55f7
OVERSTATED what this record preserves: its section 2 said the
preflight queries "returned exactly the following" and described "the
complete Plank content row (returned whole, including its payload and
authorship fields)" — while the bullet beneath preserved only the
identifiers, version, lifecycle state, and review/admission fields,
not the payload or authorship values the sentence implied were
recorded. The verifier's preflight check certified that incomplete
transcription as complete.

The exact returned payload and authorship values were NOT available
to this milestone: the operator-supplied preflight evidence stated
that the whole row was returned but did not supply those values, and
no preflight transcript exists in this milestone's possession. They
were therefore NOT reconstructed or inferred from the package, the
artifact, or the post-state — inventing them would have been a worse
defect than the overstatement. Section 2 now states the truthful
preservation scope (the whole-row return is evidenced; only the
explicitly listed fields are preserved), the Plank bullet claims
exactly what it lists, and the precision boundary distinguishes
observation from preservation.

No fact was invented in either round; the round-1 defect was an
overstatement of preservation, not a fabricated value. The hosted
execution and the post-state remain valid exactly as evidenced; the
package is SPENT and was NOT rerun; NO hosted contact of any kind
occurred during this local correction. This correction is exactly ONE
plain forward commit on the preserved round-1 commit (3c91d9ee...,
tree 3544e9b9c29983c031b39a277c32fdd8a59246f7, unchanged and never
rewritten, atop the equally preserved original evidence commit
0843ed4a...), touching exactly this record and
scripts/verify-exlib2p-application.ts. The application verifier's
preflight check now enforces the narrower truthful claim, a dedicated
new check pins this correction's supersession, and the
correction-topology proof covers the full chain.
