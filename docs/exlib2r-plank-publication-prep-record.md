# EXLIB-2R — Plank publication preparation record

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
review. Nothing here is approved by its own existence. PUBLICATION
HAS NOT OCCURRED and DELIVERY ACTIVATION HAS NOT OCCURRED.

## 1. Authoritative sources (all promoted, all byte-frozen)

- Promoted source commit: main =
  64640e9001c7e50b31319b7745dd87c68d1caa75 (tree
  aca8b975d553cef734a6d3b54f8eef878b4f3fa5), carrying the annotated
  evidence tag exlib2q-hosted-admission-application-evidence-stable
  (tag object 2ff5a3744e6439782971c767fc4828068bcd42e8, annotation
  "EXLIB-2Q Plank hosted import-admission application evidence —
  ADMITTED — NOT PUBLISHED").
- The hosted admission this publication builds on: the SPENT
  EXLIB-2Q package (39,382 bytes, SHA-256
  b15b9313db5efe679ca0d13cd0d9b9d97fd9316ec1d66d99c5bba6ca47529e57),
  evidenced by the promoted EXLIB-2Q application record (24,193
  bytes, SHA-256
  7b24c0ecb78977b829d589e341895e7eb8790513f55ef9c281a827f3829eab23):
  the Plank content row is APPROVED with the exact human tuple
  (Nick Tkacz, the 2026-09-01T20:35:00-04:00 instant, "Everything
  looks correct"), ADMITTED with the complete admission surface
  (fingerprint
  23976eedf2d59b66cdfa05cd660a414430feabef8906e1936cb24f541040de9e,
  hosted and database-generated, evidenced EQUAL to a fresh
  recomputation; source SHA
  d82078490efa9ef13e128e7b7b742fbda8ea9e74e32382252d96c326c679d752;
  admitted_at 2026-09-05), publication still draft, and ZERO
  projected relationships.
- The admitted Plank authored artifact (payload and human-review
  evidence): docs/exlib2g-plank-content.jsonl, 2,928 bytes, SHA-256
  d82078490efa9ef13e128e7b7b742fbda8ea9e74e32382252d96c326c679d752.
- The completed Plank human review form: 2,389 bytes, SHA-256
  59ad2668790b6d0b135c8c453a702c45774f905ece8749a6112881b1df7e5b98.
- The SPENT EXLIB-2K load package (created the content row): 29,760
  bytes, SHA-256
  a1b6dd55850c5d544e2f484d1ce4833b41deec7f3dd4d4c2373cb3b50daaccf0.
- The SPENT EXLIB-2O load package (created both target snapshots):
  39,230 bytes, SHA-256
  4c0d74f942da4e92efab5923a435512c750c6d794077804ffeee8c0c305c966d.
- The SPENT EXLIB-2P review package (applied the human decision):
  37,702 bytes, SHA-256
  76d1d67d6ec2bafc49ef43a6312700559cd9eeee4b8b9433868de9daf95dc666.
- Applied migration 027 (byte-frozen): SHA-256
  90d53aaf8fd341dd99bab22b7d1ca280ec24b8ccee2a28efca6e835e0585a14f.
- The target-snapshot bindings, adjudicated TARGET GATE SATISFIED in
  the promoted EXLIB-2O evidence and re-demanded by this package's
  gates: Dead bug at e21b2c00-0000-4000-a000-000000000002 (mobility)
  and Ab wheel rollout at e21b2c00-0000-4000-a000-000000000003
  (other), both active, catalog version 1, pending review, never
  swapped. The hosted surrogate snapshot UUIDs are deliberately NOT
  preconditions of the package — the accepted EXLIB-2O/2P/2Q
  fixture-portability reasoning: they are loader-generated surrogates
  no lawful disposable fixture can reproduce, so the gates bind each
  target by its fixed logical UUID, exactly-one-snapshot structure,
  canonical name, category, activity, version, and review state,
  forward and reverse. The pending pins are this package's OWN
  exactness requirement (the evidenced hosted pre-state);
  publish_catalog_content itself does NOT require target snapshots
  to be reviewed.

## 2. FINGERPRINT PORTABILITY (why one hosted-computed value IS a
## lawful precondition literal)

Unlike the hosted surrogate snapshot UUIDs, the admission fingerprint
23976eedf2d59b66cdfa05cd660a414430feabef8906e1936cb24f541040de9e IS
pinned as a package precondition literal, alongside the relational
freshness clause. Derived mechanically from migration 027's manifest
function: the admission manifest v2 binds ONLY portable state — the
fixed logical UUID, the active snapshot's semantic and discovery
fields, its anatomy rows, the identity's aliases, the authored
payload and authorship (dates as day offsets), the review tuple (the
timestamptz as an absolute epoch), and the expected relationship set,
all aggregated under COLLATE "C" byte order. It binds NO hosted
surrogate UUID and NO admission field. A lawful fixture that
reproduces the promoted literals therefore computes EXACTLY this
fingerprint, and the EXLIB-2R live verifier PROVES that reproduction
(its pre-state check compares the fixture's database-computed value
to the promoted hosted literal and stops the whole suite on any
difference). The package additionally demands FRESHNESS relationally
— the stored fingerprint must equal a recomputation inside the same
transaction — which is the same equality migration 027 re-verifies
structurally at the publication transition. admitted_at is required
PRESENT but deliberately never pinned to a calendar literal: it is
execution-date-dependent (CURRENT_DATE at admission time), so a
lawful fixture cannot reproduce the hosted calendar value; the
all-or-nothing admission CHECK plus the two pinned digests carry the
provenance.

## 3. The derived publication contract (from migrations 023/027)

Derived mechanically from the applied migration bytes, not assumed.
The ten questions the instruction requires answered, answered:

1. WHAT PUBLICATION MUTATES: exactly two surfaces. The Plank content
   row e21b2c00-0000-4000-a000-000000000101: publication_status
   'draft' -> 'published' (plus its database-managed updated_at
   bookkeeping trigger). The protected projection table
   exercise_catalog_relationships: the atomic swap for the identity.
   NOTHING else: the freeze trigger demands the publication
   transition travel ALONE (any other field change in the same
   UPDATE is refused), so payload, authorship, the review tuple, and
   the admission surface are structurally unchanged.
2. THE PROJECTED ROWS: exactly the version's expected relationship
   set — (from e21b2c00-0000-4000-a000-000000000001, relation
   progression, to ...0003) and (from ...0001, relation substitution,
   to ...0002). Two rows; their created_at values are database
   defaults, deliberately not gated by value.
3. HOW THEY ARE HANDLED: DELETE-then-INSERT — an ATOMIC PROJECTION
   SWAP inside publish_catalog_content under the transaction-local
   sentinel exlib.relationship_projection_identity (set for the one
   identity, cleared immediately after). For Plank the DELETE removes
   zero rows (the pre-state has none) and the INSERT projects the two
   expected rows. The projection-protection trigger refuses every
   other write path, UPDATE always, including direct owner-level
   writes.
4. THE LAWFUL PRE-STATE: the exact post-EXLIB-2Q hosted surface —
   vector 3/3/5/3/6/1/2/0/0/0/0; the Plank content row approved with
   the exact human tuple, ADMITTED with the complete promoted
   admission surface (fingerprint literal AND fresh recompute), still
   draft; zero projected relationships anywhere; both target
   snapshots bound and unswapped; zero review events; zero
   runs/items; the 0/0 claims invariant; the exact admin-role
   baseline; client denials.
5. THE SUCCESS POST-STATE: the content row published with every
   other field byte-identical and the fingerprint STILL fresh; the
   projection exactly the expected set in both directions; the
   vector EXACTLY 3/3/5/3/6/1/2/2/0/0/0; zero review events; every
   untouched surface digest-identical; tenant 84 unchanged; the
   authority baseline restored; client function and table denials
   intact.
6. ONE-USE MECHANISM: two independent catchers. The pre-state gate
   demands the pre-publication VECTOR (a publication moves the
   relationships term 0 -> 2, so a second run sees 2 and refuses at
   the vector gate — unlike the review and admission packages, whose
   one-use only the content gate could catch) AND the draft clause
   of the content gate; migration 027's function itself refuses a
   non-draft version ("only a draft can be published; re-publishing
   a published or retired version is rejected"), and the
   one-published partial unique index makes a second published
   version of the identity structurally impossible.
7. WHAT REMAINS UNCHANGED: the payload, authorship, review tuple,
   and admission surface (travel-alone, trigger-enforced); all three
   snapshot families, anatomy, aliases, claims, expected
   relationships; the review-events log (zero); import runs and run
   items (zero); the tenant exercises table (84 rows,
   digest-identical); every seed and inventory repository artifact;
   the claims invariant (0/0); the client-denial posture.
8. REVIEW EVENTS: a publication creates NONE. The
   exercise_catalog_review_events log is SNAPSHOT-scoped
   (catalog_id references exercise_catalog(id); its guard trigger
   accepts rows only at pg_trigger_depth >= 2 from the snapshot
   review-transition trigger — migration 023: events are written
   only by the snapshot review transition trigger). The publication
   audit is the content row's one-way publication_status machine
   plus the protected projection itself.
9. DELIVERY: publication does NOT activate product delivery.
   DATABASE PUBLICATION IS NOT PRODUCT DELIVERY: the catalog tables
   keep RLS enabled with zero policies and zero client privileges
   (the package re-proves the function EXECUTE denials and the
   projection-table SELECT denials at both ends), the tenant table
   is untouched, and the delivery surface — the seed module and the
   inventory seed_link_compatible flag, which remains false — is a
   set of repository artifacts a SQL package cannot and does not
   touch. This record never claims the exercise is deliverable or
   client-readable after publication, because the committed schema
   proves it is not.
10. SCHEMA CONTRADICTIONS: none found. Publication and relationship
    projection are ONE ATOMIC act by schema design (the swap happens
    inside publish_catalog_content; the freeze trigger structurally
    re-verifies projected-set equality in BOTH directions and
    manifest freshness at the draft -> published transition, for
    every caller including break-glass paths), which is exactly the
    act this instruction authorizes preparing. No gate this package
    needs conflicts with any trigger, CHECK, or index in migrations
    001-027.

Function surface: public.publish_catalog_content, signature
(uuid,uuid), RETURNS JSONB, LANGUAGE plpgsql, SECURITY DEFINER, SET
search_path = public, pg_temp (the body is self-protected; the CALL
is additionally schema-qualified per the EXLIB-2O round-3 standard).
Permitted caller: EXECUTE granted ONLY to exlib_catalog_admin;
PUBLIC, anon, and authenticated revoked; service_role holds no
grant. The admin role is NOLOGIN, created by migration 027 in the
same DO block as the loader, reviewer, and admission roles, so it
carries the same EXLIB-2K-proven implicit-creator baseline: exactly
ONE membership — postgres granted BY the bootstrap superuser
supabase_admin with ADMIN TRUE, INHERIT FALSE, SET FALSE. Function
refusals, in body order: unknown identity; content row not under the
identity; "only a draft can be published"; not approved; incomplete
review evidence; "content is not import-admitted"; "import admission
is STALE" (fresh recomputation differs from the stored fingerprint).
Return: {logical_id, published, retired, content_version,
projected_relationships}. For Plank every field is derivable and
none is database-generated: the two echoed arguments, retired NULL
(the pre-state gate proves the identity carries exactly ONE content
row and it is a draft, so no published version can exist to retire),
content_version 1, projected_relationships 2 — so the package's call
block asserts the ENTIRE returned JSONB by exact equality and
surfaces it with RAISE NOTICE (display evidence; the row
postconditions are the binding proof).

## 4. The prepared package

docs/exlib2r-plank-publication-package.sql — its exact byte count
and SHA-256 are pinned in section 8. PREPARED — NOT EXECUTED.
Honestly classified ONE-USE, not idempotent (section 3, answer 6).
One atomic transaction; SHARE ROW EXCLUSIVE locks over the same ELEVEN
tables the count vectors enumerate (alphabetical, one statement, the
projection table included); preconditions before any authority
change (identity, non-superuser, grantor-included ADMIN baseline,
the exact post-EXLIB-2Q vector, the three identities, both
target-snapshot gates forward AND reverse, the complete field-level
Plank pre-state by exact-value literals with the APPLIED HUMAN TUPLE
pinned AND the complete promoted admission surface pinned — the
fingerprint by promoted literal AND fresh recompute, the source SHA
by promoted literal, admitted_at present — still draft, ZERO
projected Plank relationships, zero review events, the 0/0 claims
invariant, and client function AND projection-table denial);
transaction-contained elevation with the structural two-grantor
proof; EXACTLY ONE schema-qualified public.publish_catalog_content
call captured into v_result with the ENTIRE returned JSONB asserted
by exact equality and echoed by RAISE NOTICE; grantor-scoped
revocation; postconditions (byte-exact authority restoration, the
PUBLISHED content row with every frozen field re-asserted by exact
value and the admission fingerprint STILL fresh, the exact
projection in BOTH directions with the whole table at exactly two
rows, the MOVED vector 3/3/5/3/6/1/2/2/0/0/0, zero review events,
digest-identical untouched surfaces including the tenant table, the
0/0 claims invariant, and the client denials again).
Transition-neutrality digests are md5 and are DISCLAIMED as
change-detection between two readings inside one transaction, never
a source binding; the content row and the relationships table are
deliberately absent from the digest set because they are the two
surfaces publication lawfully changes, bound by exact reads instead.
The package becomes SPENT after one successful hosted execution and
must never be rerun.

## 5. What this milestone changes and why it changes no hosted state

This milestone adds four repository files. It executes nothing
against any hosted service: the package is a reviewed artifact, not
an act. Claude authored and locally verified it against disposable
socket-only PostgreSQL clusters that are created and destroyed
inside the live verifier; no hosted endpoint, credential, or CLI
remote command appears anywhere in the phase. Hosted ShredOS remains
byte-for-byte as the promoted EXLIB-2Q application record left it:
Plank approved, admitted, DRAFT, with zero projected relationships.

## 6. Verifier lifecycle for this milestone

- scripts/verify-exlib2r.ts (new, static): re-derives every literal
  and binding from the promoted sources (the artifact payload with
  JSONB parsed equality; the human tuple from the completed form AND
  the artifact's content_review; the target categories from the
  completed 2N forms; the Plank snapshot vocabulary from the SPENT
  2K package's own literals; the admission fingerprint and source
  SHA from the promoted EXLIB-2Q application record and a fresh hash
  of the artifact), proves the package structure (one transaction,
  the eleven-table lock list, exactly one schema-qualified call with
  parsed 2-argument arity and zero unqualified/admission/review call
  sites, both vector queries mechanically extracted and identical in
  the canonical order with the PRE vector pinned once and the MOVED
  POST vector pinned once, the complete authority dance, the exact
  JSONB call-block assertion, the both-direction projection
  postconditions, the review-event scoping enforcement, client
  function and table denial, identity gates), the record bindings,
  the migration-derived contract, the live suite's shape
  mechanically, two-state topology, and hygiene.
- scripts/verify-exlib2r-live.sh (new, live): disposable socket-only
  PostgreSQL cluster; migrations 001-027 by the non-superuser
  postgres; ALL FOUR role baselines proven; the 84-exercise tenant
  fixture; the SPENT EXLIB-2K, 2O, 2P, AND 2Q packages executed once
  each to build the EXACT post-EXLIB-2Q pre-state — including the
  FINGERPRINT PORTABILITY proof (the fixture's database-computed
  admission fingerprint equals the promoted hosted literal exactly,
  or the suite stops); the prepared package's fingerprint context
  (the exact file under test is hashed and reported, and exactly
  that file is executed); the happy path (the published content line
  with the tuple intact, the exact atomic projection in both
  directions, the moved vector, the still-fresh admission surface,
  zero review events, digest-identical untouched surfaces, tenant
  neutrality, claims invariant, client function and table denial,
  authority restoration, and the asserted-JSONB notice echo); the
  one-use refusal at the VECTOR gate; a refusal matrix of EIGHTEEN
  counterfactuals (swapped / inactive (count-camouflaged) / missing
  (count-camouflaged) targets, payload drift, review-tuple drift,
  not-approved (coherent unreviewed shape), unadmitted content,
  stale admission fingerprint, wrong admitted source sha,
  already-published behind exact counts, pre-existing projected
  relationship, expected-relationship drift (refused by the
  freshness clause — the manifest binds the expected set, so the
  drift can never outrun it; the dedicated expected-set gate is
  structural defense-in-depth), foreign review event, foreign import
  run, wrong invoker (superuser), widened baseline with cluster-wide
  teardown, WRONG-GRANTOR baseline via disclosed shared-catalog
  surgery with cluster-wide restoration, and a drifted-argument
  package copy refused INSIDE the function with whole-transaction
  rollback) — every counterfactual through a checked fail-loud
  surgery, with rollback and byte-exact restoration proven, and
  durable pg_stat_user_functions zero-invocation proofs (plus
  liveness probes) that refused runs never reached the publication
  function; a two-session race with exactly one committer and the
  loser refused at the vector gate; a same-signature search_path
  decoy placed ahead of public proving the schema-qualified call
  cannot be hijacked while an unqualified copy IS hijacked and is
  refused by the call block's own exact JSONB assertion; and a final
  cluster-wide containment section proving all four role baselines
  exact and no foreign fixture directories remain.
- RETARGETS: NONE — mechanically proven unnecessary, and adjudicated
  so. The preparing instruction originally anticipated ONE retarget
  ("M one genuinely stale historical verifier", naming the EXLIB-2Q
  application verifier as the likely owner of HEAD-relative
  assertions). The mechanical stale-claim sweep instead found that
  suite's committed-state topology ADDER-ANCHORED (its phase proof
  walks the adder commit of its own files, not HEAD), every other
  historical proof tip-anchored by its own earlier retarget, and no
  committed verifier pinning any file this milestone adds. An
  EXHAUSTIVE SIMULATED-COMMIT BATTERY — the full 87-suite battery
  run against a temporary, never-referenced commit object carrying
  exactly this phase's four additions on the promoted tip — passed
  87 suites / 7,042 checks / 0 failures, proving ZERO historical
  suites stale at the commit boundary. The lawful inventory is
  therefore FOUR ADDITIONS with no modified path, and NO speculative
  retarget was made; Codex adjudicated the four-path inventory
  accepted on that proof. The known uncommitted-state
  authoring-scope assertions in earlier suites fail only while this
  phase's files sit uncommitted in the worktree (the 14 identified
  dirty-worktree scope effects) and self-heal at the commit
  boundary; they are dirty-worktree scope effects, not stale claims.

## 7. Why publication is its own act (never conflated)

The lifecycle stages remain distinct and remain separately blocked
where not yet performed: human content review (EXLIB-2I — done),
database content review (EXLIB-2P — done, hosted, evidenced),
import-eligibility admission (EXLIB-2Q — done, hosted, evidenced),
PUBLICATION WITH ITS ATOMIC RELATIONSHIP PROJECTION (THIS package —
PREPARED, NOT PERFORMED), and delivery activation (the seed module
edit and the inventory seed_link_compatible flip — a later
coordinated repository release, which remains separately blocked).
Publication makes the admitted version the identity's published
version and swaps the protected projection to its expected set as
ONE ATOMIC act under the transaction-local sentinel; it delivers
nothing (section 3, answer 9). Any future act needs its own reviewed
package and explicit instruction; this package is one-use and
becomes SPENT at its first successful hosted execution.

## 8. Fingerprints of this phase (recorded at commit time)

- docs/exlib2r-plank-publication-package.sql — the exact byte count
  and SHA-256 are stated below and re-verified mechanically:
  47,309 bytes, SHA-256
  3a4089c9a821dba0cf136c940bdb2fa444f547e6b37411b4c3663d21dea18218.
- Constructed values: NONE. Every literal in the package is
  re-derived from a promoted artifact (sections 1-3); the only new
  prose is gate wording and refusal messages.

## 9. Stop condition

This milestone stops LOCAL-ONLY for Codex review. Not pushed, not
promoted, not tagged; no hosted contact; no publication, projection,
run, delivery, seed, or seed_link_compatible change (the flag
remains false); no runtime, API, UI, dependency, or configuration
change.
