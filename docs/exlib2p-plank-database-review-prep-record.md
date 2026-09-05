# EXLIB-2P — Plank database content-review preparation record

Recorded 2026-09-04 (UTC). PREPARATION ONLY — this milestone authors,
verifies, and commits a reviewed SQL package and its evidence; it
changes no hosted state of any kind. The package is
PREPARED — NOT EXECUTED. Eventual hosted execution is
Joseph/ChatGPT-only over the established hosted-execution path —
never by Claude, and never by any automated pipeline — and requires
its own explicit instruction after Codex review. Nothing here is
approved by its own existence; blank or null never reads as approval.

## 1. Authoritative sources (all promoted, all byte-frozen)

- Promoted source commit: main =
  442b6247ad2f4b95ce58a1c2ed72df2ca84aff63 (tree
  aee2a0c72c2fdcd8b9aa8f505c71cbf235e42252), carrying the annotated
  evidence tag exlib2o-hosted-load-application-evidence-stable (tag
  object d244aa4a27efd34fec489fc0087c34c03d2e561d, annotation
  "EXLIB-2O target-snapshot hosted-load application evidence —
  LOADED — TARGET GATE SATISFIED").
- The TARGET-SNAPSHOT GATE is formally adjudicated SATISFIED by
  Codex on the promoted EXLIB-2O application evidence
  (docs/exlib2o-hosted-load-application-record.md, 15,938 bytes,
  SHA-256
  e45939733abda83932173c492a6436aca5e188bd2644f34f87f3a03175edea09).
  That record preserves the hosted facts this package's target gates
  re-demand: Dead bug at e21b2c00-0000-4000-a000-000000000002
  (category mobility, hosted snapshot UUID
  1ce09c1f-c13d-4231-8e12-6f35cfd761b5) and Ab wheel rollout at
  e21b2c00-0000-4000-a000-000000000003 (category other, hosted
  snapshot UUID c715d840-944b-4019-b984-1687accffcf4), both active,
  catalog version 1, pending review, never swapped. The two hosted
  snapshot UUIDs are deliberately NOT preconditions of the package:
  they are loader-generated surrogate ids that no lawful disposable
  fixture can reproduce, so the package binds each target by its
  fixed logical UUID, exactly-one-snapshot structure, canonical name,
  category, activity, version, and review state — forward and
  reverse. The adjudication changed no database state; citing it here
  claims no Plank lifecycle act.
- The admitted Plank authored artifact (payload and human-review
  evidence): docs/exlib2g-plank-content.jsonl, 2,928 bytes, SHA-256
  d82078490efa9ef13e128e7b7b742fbda8ea9e74e32382252d96c326c679d752.
- The completed Plank human review form (permanent evidence):
  docs/exlib2h-plank-content-review-form-completed.json, 2,389 bytes,
  SHA-256
  59ad2668790b6d0b135c8c453a702c45774f905ece8749a6112881b1df7e5b98.
- The SPENT EXLIB-2K load package (created the loaded content row):
  29,760 bytes, SHA-256
  a1b6dd55850c5d544e2f484d1ce4833b41deec7f3dd4d4c2373cb3b50daaccf0.
- The SPENT EXLIB-2O load package (created both target snapshots):
  39,230 bytes, SHA-256
  4c0d74f942da4e92efab5923a435512c750c6d794077804ffeee8c0c305c966d.
- Applied migration 027 (byte-frozen): SHA-256
  90d53aaf8fd341dd99bab22b7d1ca280ec24b8ccee2a28efca6e835e0585a14f.
- The loaded hosted content identity: content UUID
  e21b2c00-0000-4000-a000-000000000101 under logical UUID
  e21b2c00-0000-4000-a000-000000000001, content_version 1 — hosted
  state pending/draft/unadmitted with NULL review evidence, per the
  promoted EXLIB-2K and EXLIB-2O application records.

## 2. The human decision carried forward (EXLIB-2I, verbatim)

The database review carries EXACTLY the recorded human decision —
nothing invented, renamed, embellished, or reinterpreted:

- Decision: approved
- Reviewer: Nick Tkacz (the named human reviewer; his
  operator-validated credential, Personal Trainer, lives in the
  completed form and the EXLIB-2I record — migration 027's
  content-review surface carries no role field, exactly as the
  EXLIB-2I derived contract states, so no role mapping is invented)
- Reviewed at: 2026-09-01T20:35:00-04:00 (carried as the exact
  timestamptz INSTANT; the offset is preserved as a point in time)
- Rationale: "Everything looks correct"

Both authorities agree byte for byte: the completed form
(59ad2668...) and the admitted artifact's content_review object
(inside d8207849...). The package's call arguments and its
postcondition pins are both re-derived from them mechanically by
scripts/verify-exlib2p.ts.

## 3. The derived database-review contract (from migrations 023/027)

Derived mechanically from the applied migration bytes, not assumed:

- Function: public.apply_content_review, signature
  (uuid,uuid,text,text,timestamptz,text), RETURNS JSONB, LANGUAGE
  plpgsql, SECURITY DEFINER, SET search_path = public, pg_temp (the
  body is self-protected; the CALL is additionally schema-qualified
  per the EXLIB-2O round-3 standard, so the checked object and the
  invoked object are the same database object by construction).
- Permitted caller: EXECUTE is granted ONLY to
  exlib_catalog_reviewer; PUBLIC, anon, and authenticated are
  revoked; service_role holds no grant. The reviewer role is NOLOGIN;
  the hosted operator postgres reaches it only through a
  transaction-contained SET-capable membership.
- Reviewer-role authority baseline: exactly ONE membership — the
  implicit creator membership postgres granted BY the bootstrap
  superuser supabase_admin with ADMIN TRUE, INHERIT FALSE, SET FALSE
  (the same mechanism EXLIB-2K proved for the loader role; migration
  027 created the role as postgres, and PostgreSQL records the
  bootstrap superuser as the implicit grant's grantor).
- Lifecycle preconditions enforced by the function itself: the
  logical identity must exist (locked FOR UPDATE); the content row
  must exist under that identity; content_status must be 'pending'
  ("only a pending version can receive its review decision through
  this authority; the decision is one-time and corrections require a
  new content version").
- Decision vocabulary: the decision must be one of approved,
  revised, or rejected; a complete, non-blank
  reviewer/timestamp/rationale tuple is required.
- Effects on the content row: content_status := decision;
  reviewed_by/reviewed_at/review_rationale := the tuple. NOTHING
  else: the content freeze trigger independently forbids payload,
  authorship, and admission changes in the same statement ("a review
  transition carries evidence only") and enforces the one-way
  content_status machine (pending -> approved|revised|rejected;
  approved -> revised|rejected; re-approval requires a NEW content
  version) with a complete fresh audit tuple.
- Approval changes NO admission or publication state:
  import_admitted stays false with every admission field NULL, and
  publication_status stays draft. Admission and publication are
  separate one-time acts through admit_catalog_content (role
  exlib_catalog_admission) and publish_catalog_content (role
  exlib_catalog_admin), which this package never invokes.
- REVIEW-EVENT SCOPING (the decisive derivation): the
  exercise_catalog_review_events log is SNAPSHOT-scoped — its
  catalog_id references exercise_catalog(id), and its guard trigger
  (migration 023: "events are written only by the snapshot review
  transition trigger") accepts rows only at pg_trigger_depth >= 2,
  from inside the snapshot review-transition trigger. A CONTENT
  review through apply_content_review therefore writes ZERO rows
  there BY SCHEMA DESIGN. The complete audit evidence of a content
  review is the content row itself: the reviewed_by / reviewed_at /
  review_rationale tuple under the one-way content_status machine.
  The package asserts the review-events count is unchanged at zero
  and binds the content row's tuple exactly — so the absent event
  can never be misread as missing evidence, and no schema or
  evidence was changed to force an event into existence.
- Idempotency, honestly: the package is ONE-USE, not idempotent. A
  second execution refuses fail-closed at the package's own
  content-pending gate BEFORE any authority change (and the function
  would independently refuse a non-pending version). Because a
  content review changes NO table count, the eleven-term vector
  alone cannot catch a re-run — the pre- and post-vectors are
  deliberately the same value (3/3/5/3/6/1/2/0/0/0/0) — which is
  exactly why the content-pending gate exists and why the live
  verifier keys its one-use and race proofs on it.
- Authority restoration: the temporary postgres-granted SET
  membership is revoked grantor-scoped inside the transaction, and
  the postconditions demand exactly the baseline row back with
  pg_has_role('postgres','exlib_catalog_reviewer','SET') = false.
- RLS/client boundaries: the catalog tables carry the intentional
  deny-by-default posture (RLS enabled, zero policies, client DML
  revoked); the package additionally proves anon, authenticated, and
  service_role cannot EXECUTE the review function, before and after.
- Refusal conditions: every gate failure raises and rolls back the
  ENTIRE transaction — wrong identity or superuser invoker, wrong
  authority baseline, any vector drift, missing/inactive/re-bound/
  swapped target snapshots (forward or reverse), any Plank snapshot,
  anatomy, alias, claim, payload, lifecycle, or expected-relationship
  drift, a pre-existing Plank review event, a violated claims
  invariant, or client-executable review authority.

The derived contract represents the approved human review faithfully
and completely; no blocker exists and no schema or evidence change
was needed.

## 4. The prepared package

docs/exlib2p-plank-database-review-package.sql — its exact byte
count and SHA-256 are pinned in section 8. PREPARED — NOT EXECUTED.
One atomic transaction; SHARE ROW EXCLUSIVE locks over the same
ELEVEN tables the count vectors enumerate (alphabetical, one
statement); preconditions before any authority change (identity,
non-superuser, grantor-included reviewer baseline, the exact
post-EXLIB-2O vector, the three identities, both target-snapshot
gates forward AND reverse, the complete field-level Plank pre-state
by dollar-quoted authoritative literals with NO hash in any gate,
zero Plank review events, the 0/0 claims invariant, and client
privilege denial); transaction-contained elevation with the
structural two-grantor proof; EXACTLY ONE schema-qualified
public.apply_content_review call carrying the verbatim human tuple;
grantor-scoped revocation; postconditions (byte-exact authority
restoration, the reviewed content row with the exact tuple and every
frozen field re-asserted by exact value, the UNCHANGED eleven-term
vector, zero review events, digest-identical untouched surfaces
including the tenant table, the 0/0 claims invariant, and client
privilege denial). Transition-neutrality digests are md5 and are
DISCLAIMED as change-detection between two readings inside one
transaction, never a source binding — the authoritative gates are
the exact-value pins above them.

## 5. What this milestone changes and why it changes no hosted state

This milestone adds four repository files and retargets one
committed verifier. It executes nothing against any hosted service:
the package is a reviewed artifact, not an act. Claude authored and
locally verified it against disposable socket-only PostgreSQL
clusters that are created and destroyed inside the live verifier;
no Supabase or Vercel endpoint, credential, or CLI remote command
appears anywhere in the phase. Hosted ShredOS remains byte-for-byte
as the promoted EXLIB-2O application record left it.

## 6. Verifier lifecycle for this milestone

- scripts/verify-exlib2p.ts (new, static): re-derives every package
  literal and binding from the promoted sources (the human tuple
  from the completed form AND the artifact's content_review object;
  every payload field from the admitted artifact, JSONB fields as
  parsed values; the target categories from the completed 2N forms;
  the Plank snapshot vocabulary from the SPENT 2K package's own
  dollar-quoted literals; the set strings from the artifact), proves
  the package structure (one transaction, the eleven-table lock
  list, exactly one schema-qualified call with parsed 6-argument
  arity and zero unqualified/admission/publication call sites, both
  vector queries mechanically extracted and identical in the
  canonical order with the SAME unchanged vector pinned twice, the
  complete authority dance, the review-event scoping enforcement and
  disclosure, client-privilege denial, identity gates), the record
  bindings, the derived contract against the migration bytes, the
  labeled retarget, the live verifier's shape mechanically, the
  two-state phase topology, and hygiene.
- scripts/verify-exlib2p-live.sh (new, live): disposable socket-only
  PostgreSQL cluster; migrations 001-027 applied by the
  non-superuser postgres on the supabase_admin-bootstrapped fixture;
  BOTH role baselines proven; the 84-exercise tenant fixture; the
  SPENT EXLIB-2K and EXLIB-2O packages executed once each to build
  the EXACT post-EXLIB-2O pre-state; the happy path (exact human
  tuple, timestamptz instant equality, unchanged vector, zero review
  events, digest-identical untouched surfaces, tenant neutrality,
  claims invariant, client denial, authority restoration, and the
  JSONB echo); the one-use refusal at the content-pending gate; a
  refusal matrix of swapped / inactive (count-camouflaged) / missing
  (count-camouflaged) target snapshots, mutated Plank payload, wrong
  human-review binding (a sed-derived drifted-call copy caught by
  the package's own postcondition), pre-existing review event,
  already-reviewed, already-admitted, already-published, wrong
  invoker (superuser), and widened authority baseline — every
  counterfactual built through a checked surgery helper that FAILS
  LOUDLY if the mutation does not land, with whole-transaction
  rollback and byte-exact restoration proven after every variant,
  and with durable pg_stat_user_functions zero-invocation proofs
  (plus a liveness probe) that refused runs never reached the review
  function; the cluster-wide role-membership teardown after the
  widening variant (pg_auth_members is a shared catalog — a lesson
  this harness embeds explicitly); a two-session race with exactly
  one committer; and a same-signature search_path decoy placed ahead
  of public proving the schema-qualified call cannot be hijacked
  while an unqualified copy of the same package IS hijacked and
  rolls back whole.
- RETARGET (EXLIB-2P Plank database-review preparation):
  scripts/verify-exlib2o-application.ts — its E5 correction-topology
  proof walked HEAD and becomes stale the moment this preparation
  commit exists; it is re-anchored to the promoted evidence tip
  442b6247... (tree pinned, ancestor-of-HEAD asserted), where it was
  and remains true. Count-neutral (24/0 before and after); no other
  committed suite required retargeting (the mechanical sweep found
  every other topology claim already tip-anchored and no committed
  verifier pinning the retargeted file's bytes).

## 7. Dependency map (later, explicitly gated)

1. Codex review of this preparation; push, promotion, and tag are
   separate explicit gates.
2. Hosted execution of this package (Joseph/ChatGPT-only, once,
   against ttybyljytiwntvorugcv only) under its own explicit
   instruction, followed by its own application-evidence milestone.
3. Eligibility admission of the reviewed content
   (admit_catalog_content, role exlib_catalog_admission) — remains
   separately blocked until its own reviewed package and explicit
   instruction; approval alone admits nothing.
4. Publication (publish_catalog_content, role exlib_catalog_admin) —
   remains separately blocked; draft content is never client-visible.
5. Relationship projection, import runs, delivery, seed edits, and
   the seed_link_compatible flip all remain facts of later, separately
   gated releases.

The four lifecycle stages are distinct by design and are never
conflated here: human content approval (EXLIB-2I — done, evidence
frozen), database content review (THIS package — prepared, not
executed), eligibility admission (blocked), publication (blocked).
Admission and publication remain separately blocked whatever this
package's fate.

## 8. Fingerprints of this phase (recorded at commit time)

- docs/exlib2p-plank-database-review-package.sql — the exact byte
  count and SHA-256 are stated below and re-verified mechanically:
  37,702 bytes, SHA-256
  76d1d67d6ec2bafc49ef43a6312700559cd9eeee4b8b9433868de9daf95dc666.
- Constructed values: NONE. Every literal in the package is
  re-derived from a promoted artifact (section 2 and section 3); the
  only new prose is gate wording and refusal messages.

## 9. Stop condition

This milestone stops LOCAL-ONLY for Codex review. Not pushed, not
promoted, not tagged; no hosted contact; no review event, admission,
publication, projection, run, delivery, seed, or
seed_link_compatible change; no runtime, API, UI, dependency, or
configuration change.
