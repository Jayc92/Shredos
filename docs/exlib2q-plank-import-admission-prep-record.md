# EXLIB-2Q — Plank import-eligibility admission preparation record

Recorded 2026-09-05 (UTC). PREPARATION ONLY — this milestone authors,
verifies, and commits a reviewed SQL package and its evidence; it
changes no hosted state of any kind. The package is
PREPARED — NOT EXECUTED, and no hosted execution occurred in this
milestone: no Supabase or Vercel endpoint was contacted, and every
preparation fact below comes from committed evidence and schema bytes
only — nothing was independently queried from any hosted system.
Eventual hosted execution is Joseph/ChatGPT-only over the established
hosted-execution path — never by Claude, and never by any automated
pipeline — and requires its own explicit instruction after Codex
review. Nothing here is approved by its own existence.

## 1. Authoritative sources (all promoted, all byte-frozen)

- Promoted source commit: main =
  93202b4e89e92eef9a0f57d28c59900898cbc2ba (tree
  814d94e41b6f0d1395b945c5a40e2da3b8c0d274), carrying the annotated
  evidence tag exlib2p-hosted-review-application-evidence-stable (tag
  object ad5ff4b161405eb8ae1b0272459d6c1e9d188a15, annotation
  "EXLIB-2P Plank hosted-review application evidence — REVIEWED —
  NOT ADMITTED OR PUBLISHED").
- The hosted database review this admission builds on: the SPENT
  EXLIB-2P package (37,702 bytes, SHA-256
  76d1d67d6ec2bafc49ef43a6312700559cd9eeee4b8b9433868de9daf95dc666),
  evidenced by the promoted EXLIB-2P application record (19,896
  bytes, SHA-256
  ca1e5116070cb563bafa58ff3c3bbbd90d7b1a4508d539e84963823b0b96c462):
  the Plank content row is APPROVED with the exact human tuple
  (Nick Tkacz, the 2026-09-01T20:35:00-04:00 instant, "Everything
  looks correct"), publication draft, and UNADMITTED with every
  admission field NULL.
- The admitted Plank authored artifact (payload, human-review
  evidence, and THE SOURCE-PROVENANCE SHA this package records):
  docs/exlib2g-plank-content.jsonl, 2,928 bytes, SHA-256
  d82078490efa9ef13e128e7b7b742fbda8ea9e74e32382252d96c326c679d752.
- The completed Plank human review form: 2,389 bytes, SHA-256
  59ad2668790b6d0b135c8c453a702c45774f905ece8749a6112881b1df7e5b98.
- The SPENT EXLIB-2K load package (created the content row): 29,760
  bytes, SHA-256
  a1b6dd55850c5d544e2f484d1ce4833b41deec7f3dd4d4c2373cb3b50daaccf0.
- The SPENT EXLIB-2O load package (created both target snapshots):
  39,230 bytes, SHA-256
  4c0d74f942da4e92efab5923a435512c750c6d794077804ffeee8c0c305c966d.
- Applied migration 027 (byte-frozen): SHA-256
  90d53aaf8fd341dd99bab22b7d1ca280ec24b8ccee2a28efca6e835e0585a14f.
- The target-snapshot bindings, adjudicated TARGET GATE SATISFIED in
  the promoted EXLIB-2O evidence and re-demanded by this package's
  gates: Dead bug at e21b2c00-0000-4000-a000-000000000002 (mobility,
  hosted snapshot UUID 1ce09c1f-c13d-4231-8e12-6f35cfd761b5) and
  Ab wheel rollout at e21b2c00-0000-4000-a000-000000000003 (other,
  hosted snapshot UUID c715d840-944b-4019-b984-1687accffcf4), both
  active, catalog version 1, pending review, never swapped. The two
  hosted snapshot UUIDs are deliberately NOT preconditions of the
  package — the accepted EXLIB-2O/2P fixture-portability reasoning:
  they are loader-generated surrogates no lawful disposable fixture
  can reproduce, so the gates bind each target by its fixed logical
  UUID, exactly-one-snapshot structure, canonical name, category,
  activity, version, and review state, forward and reverse.

## 2. The admission inputs, derived (nothing hand-typed or invented)

public.admit_catalog_content takes exactly three arguments:

- p_logical_id = e21b2c00-0000-4000-a000-000000000001 — the promoted
  loaded Plank identity (EXLIB-2K evidence).
- p_content_id = e21b2c00-0000-4000-a000-000000000101 — the promoted
  loaded content row (EXLIB-2K evidence), version 1.
- p_source_artifact_sha256 =
  d82078490efa9ef13e128e7b7b742fbda8ea9e74e32382252d96c326c679d752 —
  the SHA-256 of the promoted reviewed repository artifact
  docs/exlib2g-plank-content.jsonl, re-derived mechanically by the
  static verifier hashing the artifact afresh (never hand-typed).
  Migration 027 prescribes exactly this: "the exact repository source
  artifact SHA-256", format-validated as 64-character lowercase hex.

DATABASE-GENERATED VALUES (verified relationally, never pinned to
invented literals): the admission fingerprint is NOT an argument — it
is computed by the database (public.exlib_content_admission_fingerprint,
from the bound snapshot and content state; the manifest demands
exactly one ACTIVE snapshot with complete discovery metadata), and
the freeze trigger independently recomputes it and rejects arbitrary
hashes. The package's postcondition therefore requires
admitted_fingerprint NON-NULL, 64-hex, and EQUAL to a fresh
recomputation inside the same transaction — the exact freshness
equality publication will later demand. admitted_at is set by the
function to CURRENT_DATE, which is transaction-stable, so the
postcondition compares it to CURRENT_DATE exactly; it is
execution-date-dependent and is never pinned to an invented date.

## 3. The derived admission contract (from migrations 023/027)

Derived mechanically from the applied migration bytes, not assumed:

- Function: public.admit_catalog_content, signature (uuid,uuid,text),
  RETURNS JSONB, LANGUAGE plpgsql, SECURITY DEFINER, SET search_path
  = public, pg_temp (the body is self-protected; the CALL is
  additionally schema-qualified per the EXLIB-2O round-3 standard).
- Permitted caller: EXECUTE granted ONLY to exlib_catalog_admission;
  PUBLIC, anon, and authenticated revoked; service_role holds no
  grant. The admission role is NOLOGIN; the hosted operator postgres
  reaches it only through a transaction-contained SET-capable
  membership.
- Admission-role authority baseline: exactly ONE membership — the
  implicit creator membership postgres granted BY the bootstrap
  superuser supabase_admin with ADMIN TRUE, INHERIT FALSE, SET FALSE
  (the same EXLIB-2K-proven mechanism as the loader and reviewer
  roles; migration 027 created all three the same way).
- Function preconditions: the identity exists (locked FOR UPDATE);
  the content row exists under it; NOT already admitted ("this
  version is already admitted; admission is one-time and one-way");
  content_status = 'approved' (a pending version gets the dedicated
  "admission cannot precede human approval" refusal; revised and
  rejected versions require a new content version); publication_status
  = 'draft' ("only an unpublished draft may be admitted"); the
  complete non-blank review evidence tuple; the 64-hex source format.
- Effects: import_admitted := true; admitted_fingerprint := the
  database-computed manifest fingerprint; admitted_source_sha256 :=
  the caller's format-validated provenance sha; admitted_at :=
  CURRENT_DATE. NOTHING else: the freeze trigger forbids payload,
  authorship, review-evidence, and publication changes in the same
  statement, demands the complete all-or-nothing admission trio
  (migration 027's CHECK: digests present and well-formed exactly
  when admitted), and recomputes the fingerprint ("admitted_fingerprint
  must equal the recomputed admission-manifest fingerprint; arbitrary
  hashes are rejected").
- The admission changes NO other lifecycle state: publication stays
  draft; no relationship projection, import run, run item, or
  delivery state exists or changes; the review tuple is untouched.
- COUNTS: no table count changes — an admission updates one content
  row in place, so the eleven-term vector is the SAME before and
  after (3/3/5/3/6/1/2/0/0/0/0), and one-use is therefore enforced by
  the unadmitted-content gate, not the vector.
- AUDIT CARRIER: the admission's durable audit is the content row's
  own import_admitted / admitted_fingerprint / admitted_source_sha256
  / admitted_at surface. REVIEW-EVENT SEMANTICS are unchanged from
  the accepted EXLIB-2P derivation: exercise_catalog_review_events is
  SNAPSHOT-scoped (catalog_id references exercise_catalog(id); its
  guard trigger accepts rows only at pg_trigger_depth >= 2 from the
  snapshot review-transition trigger), so an admission writes ZERO
  rows there BY SCHEMA DESIGN — the audit evidence lives on the
  content row, no event is invented, and the package asserts the
  count stays zero.
- One-use, honestly: ONE-USE, not idempotent. A second execution
  refuses fail-closed at the package's own unadmitted-content gate
  BEFORE any authority change, and the function independently refuses
  an already-admitted version. RETURN JSONB: {logical_id, admitted,
  content_version, admitted_fingerprint, admitted_source_sha256} —
  display evidence; the row postconditions are the binding proof.
- Failure/rollback posture: every gate failure raises and rolls back
  the ENTIRE transaction — wrong identity or superuser invoker, wrong
  or widened or wrong-grantor authority baseline, any vector drift,
  missing/inactive/re-bound/swapped target snapshots (forward or
  reverse), any Plank snapshot/anatomy/alias/claim/payload/lifecycle/
  review-tuple/expected-relationship drift, a pre-existing review
  event, a violated claims invariant, or client-executable admission
  authority.

The derived contract represents the intended admission faithfully;
no blocker exists and no schema or evidence change was needed.

## 4. The prepared package

docs/exlib2q-plank-import-admission-package.sql — its exact byte
count and SHA-256 are pinned in section 8. PREPARED — NOT EXECUTED.
One atomic transaction; SHARE ROW EXCLUSIVE locks over the same
ELEVEN tables the count vectors enumerate (alphabetical, one
statement); preconditions before any authority change (identity,
non-superuser, grantor-included admission baseline, the exact
post-EXLIB-2P vector, the three identities, both target-snapshot
gates forward AND reverse, the complete field-level Plank pre-state
by exact-value literals with the APPLIED HUMAN TUPLE pinned and the
admission surface still NULL, zero review events, the 0/0 claims
invariant, and client privilege denial); transaction-contained
elevation with the structural two-grantor proof; EXACTLY ONE
schema-qualified public.admit_catalog_content call; grantor-scoped
revocation; postconditions (byte-exact authority restoration, the
ADMITTED content row with the complete admission surface — source
sha pinned to the promoted artifact fingerprint, the
database-computed fingerprint verified relationally, admitted_at =
CURRENT_DATE — every frozen field re-asserted by exact value,
publication still draft, the UNCHANGED eleven-term vector, zero
review events, digest-identical untouched surfaces including the
tenant table, the 0/0 claims invariant, and client privilege denial
again). Transition-neutrality digests are md5 and are DISCLAIMED as
change-detection between two readings inside one transaction, never
a source binding. The package becomes SPENT after one successful
hosted execution and must never be rerun.

## 5. What this milestone changes and why it changes no hosted state

This milestone adds four repository files and retargets one committed
verifier. It executes nothing against any hosted service: the package
is a reviewed artifact, not an act. Claude authored and locally
verified it against disposable socket-only PostgreSQL clusters that
are created and destroyed inside the live verifier; no hosted
endpoint, credential, or CLI remote command appears anywhere in the
phase. Hosted ShredOS remains byte-for-byte as the promoted EXLIB-2P
application record left it.

## 6. Verifier lifecycle for this milestone

- scripts/verify-exlib2q.ts (new, static): re-derives every literal
  and binding from the promoted sources (the source-provenance sha by
  hashing the artifact afresh; the applied human tuple from the
  completed form AND the artifact's content_review; every payload
  field from the artifact with JSONB parsed equality; the target
  categories from the completed 2N forms; the Plank snapshot
  vocabulary from the SPENT 2K package's own literals), proves the
  package structure (one transaction, the eleven-table lock list,
  exactly one schema-qualified call with parsed 3-argument arity and
  zero unqualified/review/publication call sites, both vector queries
  mechanically extracted and identical in the canonical order with
  the SAME unchanged vector pinned twice, the complete authority
  dance, the relational fingerprint verification, the review-event
  scoping enforcement, client denial, identity gates), the record
  bindings, the migration-derived contract, the labeled retarget, the
  live suite's shape mechanically, two-state topology, and hygiene.
- scripts/verify-exlib2q-live.sh (new, live): disposable socket-only
  PostgreSQL cluster; migrations 001-027 by the non-superuser
  postgres; ALL THREE role baselines proven; the 84-exercise tenant
  fixture; the SPENT EXLIB-2K, 2O, AND 2P packages executed once each
  to build the EXACT post-EXLIB-2P pre-state; the prepared package's
  fingerprint context (the exact file under test is hashed and
  reported, and exactly that file is executed); the happy path
  (complete admission surface with relational fingerprint equality
  and CURRENT_DATE, unchanged vector, zero review events,
  digest-identical untouched surfaces, tenant neutrality, claims
  invariant, client denial, authority restoration, and the JSONB
  echo); the one-use refusal at the unadmitted-content gate; a
  THIRTEEN-variant refusal matrix (swapped / inactive
  (count-camouflaged) / missing (count-camouflaged) targets, payload
  drift, review-tuple drift, not-approved content, already-admitted,
  publication drift, foreign review event, wrong invoker (superuser),
  widened baseline with cluster-wide teardown, WRONG-GRANTOR baseline
  via disclosed shared-catalog surgery with cluster-wide restoration,
  and a drifted-source-sha package copy accepted by the function's
  format check and caught by the package's own exact postcondition) —
  every counterfactual through a checked fail-loud surgery, with
  whole-transaction rollback and byte-exact restoration proven after
  every variant, and durable pg_stat_user_functions zero-invocation
  proofs (plus liveness probes) that refused runs never reached the
  admission function; a two-session race with exactly one committer;
  a same-signature search_path decoy placed ahead of public proving
  the schema-qualified call cannot be hijacked while an unqualified
  copy IS hijacked and rolls back whole; and a final cluster-wide
  containment section proving all three role baselines exact and no
  foreign fixture directories remain.
- RETARGET (EXLIB-2Q Plank import-admission preparation):
  scripts/verify-exlib2p-application.ts — its E5 correction-topology
  proof walked HEAD and becomes stale the moment this preparation
  commit exists; it is re-anchored to the promoted EXLIB-2P evidence
  tip 93202b4e... (tree pinned, ancestor-of-HEAD asserted), where it
  was and remains true. Count-neutral (24/0 before and after); the
  mechanical sweep found every other topology claim already
  tip-anchored and no committed verifier pinning any changed file's
  bytes.

## 7. Why admission is its own act (never conflated)

The lifecycle stages remain distinct and remain separately blocked
where not yet performed: human content approval (EXLIB-2I — done),
database content review (EXLIB-2P — done, hosted, evidenced),
IMPORT ELIGIBILITY ADMISSION (THIS package — prepared, not executed),
publication (publish_catalog_content under exlib_catalog_admin —
blocked; draft content is never client-visible), relationship
projection (belongs to publication's atomic act — blocked), and
delivery activation (the seed module edit and the inventory
seed_link_compatible flip — blocked, facts of a later coordinated
release). Admission makes the approved version eligible for import
and freezes its provenance; it publishes nothing, projects nothing,
delivers nothing, and remains separately blocked from all of them.
Any future act needs its own reviewed package and explicit
instruction; this package is one-use and becomes SPENT.

## 8. Fingerprints of this phase (recorded at commit time)

- docs/exlib2q-plank-import-admission-package.sql — the exact byte
  count and SHA-256 are stated below and re-verified mechanically:
  39,361 bytes, SHA-256
  6406eb57637a09885c429b732230bc1928d7c023592889a7603a454045a3f803.
- Constructed values: NONE. Every literal in the package is
  re-derived from a promoted artifact (sections 1-3); the only new
  prose is gate wording and refusal messages.

## 9. Stop condition

This milestone stops LOCAL-ONLY for Codex review. Not pushed, not
promoted, not tagged; no hosted contact; no admission, publication,
projection, run, delivery, seed, or seed_link_compatible change; no
runtime, API, UI, dependency, or configuration change.
