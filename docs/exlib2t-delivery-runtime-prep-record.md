# EXLIB-2T — delivery-runtime preparation record (activation design S3)

Recorded 2026-09-06 (UTC). PREPARATION ONLY, ON A LOCAL BRANCH — this
milestone implements the activation design's S3 artifact: the
deliver_catalog_exercises runtime integration, deployed-capable but
BEHAVIORALLY INERT behind an application flag that DEFAULTS STRICTLY
OFF. Nothing is deployed, no flag is enabled anywhere, no hosted
import run exists or was created or approved, no Supabase or Vercel
endpoint was contacted, the published database state is untouched,
and EXLIB-2S remains parked unpromoted (this branch forks from
promoted main, so the SEED DEFINITION REMAINS BODYWEIGHT here —
exactly what S3 requires). Nothing here is approved by its own
existence.

## 1. Authoritative sources (all promoted, all byte-frozen)

- Promoted source commit: main =
  5f7e182f3027b3640514e06d642693f4018c03e2 (tree
  902a2b4b1bf76ca5d75fc8d20b62062411c95cc5), carrying the annotated
  tag exlib2r-hosted-publication-application-evidence-stable (tag
  object e1922ea29f76f43be17f0dd3a7f3d36bcfa8381b).
- The promoted coordinated-activation design
  (docs/exlib2g-plank-content-activation-design.md): S3 is "the
  delivery-capable runtime is deployed behind an OFF application
  flag while the SEED DEFINITION REMAINS BODYWEIGHT", and its
  fail-closed rule requires the implementation to "PROVE that
  delivery failure, a rejected run, a revoked run, a timeout, or a
  malformed response CANNOT call seedExercisesIfNeeded while the
  timed seed definition is live". This milestone implements that
  proof from day one, for every flag-ON path, regardless of seed
  definition.
- The delivery contract, from the applied migration bytes:
  public.deliver_catalog_exercises(p_run_key TEXT) RETURNS JSONB
  (migration 023, function body replaced by migration 026), SECURITY
  DEFINER, EXECUTE granted to authenticated (REVOKEd from
  PUBLIC/anon), refusing unauthenticated callers and any run key
  without a sealed, approved, unrevoked, non-dry run — the
  database-side predicate, not any application flag, is the security
  boundary. Its JSONB summary echoes run_key and reports integer
  counters (eligible, inserted, skipped_already_delivered, the alias
  family, inserted_catalog_logical_ids, plank_disposition).

## 2. What this milestone adds (the runtime, mechanically described)

- src/lib/supabase/deliver-catalog.ts (new): the single
  initialization entry point initializeExercisesIfNeeded plus the
  flag, run-key, and timeout accessors and the fail-closed delivery
  path.
- THE FLAG DEFAULTS STRICTLY OFF: isCatalogDeliveryEnabled() returns
  true ONLY for the exact string "true" in
  CATALOG_DELIVERY_ENABLED. Absent, empty, "false", "1", "TRUE",
  padded variants — anything else — is OFF. No tracked file sets the
  variable; no .env file was touched; enabling it is the design's S6
  event and is NOT part of this milestone.
- FLAG OFF (the strict default): the entry point calls the
  pre-existing seedExercisesIfNeeded and nothing else — the seed
  module is byte-identical to the promoted tip, and the seeded
  behavior for every current and new user is UNCHANGED.
- FLAG ON: delivery-first with THE FAIL-CLOSED LAW. The path
  carries NO client-side count guard (Codex round 1): existing
  seeded tenants MUST reach the database function too — the
  function owns idempotence (skipped_already_delivered), per-user
  collision handling, and migration 026's pristine-Plank
  reconciliation, and a client-side row-count short-circuit would
  starve exactly the tenants that reconciliation exists for. The
  legacy count guard belongs only to the flag-OFF seed path, inside
  seedExercisesIfNeeded itself. The path requires
  CATALOG_DELIVERY_RUN_KEY (missing configuration fails closed
  BEFORE any database call), invokes the
  deliver_catalog_exercises RPC under a timeout
  (CATALOG_DELIVERY_TIMEOUT_MS, defaulting to 10,000ms; a
  positive-integer-validated operational knob, never a behavior
  flag), validates the COMPLETE migration-026 JSONB summary
  contract (Codex rounds 1 and 2) — exactly the FOURTEEN keys, no
  more and no fewer; the run_key echo; non-negative integer values
  for all TEN counter keys; collision_names a string array;
  inserted_catalog_logical_ids an array of well-formed UUIDs;
  plank_disposition one of the SEVEN schema-produced values; the
  loop ACCOUNTING as the full function body actually produces it
  (Codex round 2): inserted + skipped_already_delivered +
  skipped_name_collision + correctedInPlace = eligible, where
  correctedInPlace is 1 exactly when plank_disposition is
  corrected_and_linked_pristine_seed and 0 otherwise — because the
  successful P2 pristine-seed correction UPDATEs the seed row in
  place and CONTINUEs without incrementing any of the three
  counters (and without appending a logical id), while eligible
  has already counted the row; plus the two length invariants (one
  logical id per insert; one collision name per collision skip);
  anything else is malformed — and on ANY failure — rejection,
  thrown client,
  timeout, malformed response, missing configuration, unexpected
  exception — logs and returns failed_closed WITHOUT SEEDING. A
  temporary inability to initialize exercises is the
  design-accepted safe outcome; a fallback seed row is not.
- TIMEOUT AMBIGUITY, stated honestly (Codex round 1): the timeout
  abandons the WAIT, not the database transaction — supabase-js
  RPC carries no supported cancellation, so the already-started
  transaction may still commit after this request stops listening.
  So a timeout means UNKNOWN eventual delivery outcome, never
  proven non-delivery, and the outcome object says so
  (unknownDeliveryOutcome: true, with a reason stating the wait
  was abandoned). What the fail-closed law guarantees is
  unchanged: the timed-out request NEVER seeds, and the next
  initialization attempt reconciles safely because the database
  function is idempotent per user.
- THE STRUCTURAL PROOF: the module carries an explicit FAIL-CLOSED
  REGION marker; the seed identifier appears exactly twice ABOVE it
  (the import and the flag-OFF branch) and ZERO times below it —
  the flag-ON path cannot name the seed function at all.
  scripts/verify-exlib2t.ts proves the split mechanically;
  scripts/verify-exlib2t-runtime.ts proves it behaviorally.
- Call sites: the three former direct seed call sites
  (src/app/(app)/workouts/page.tsx,
  src/app/(app)/workouts/exercises/page.tsx,
  src/app/api/exercises/route.ts) now route through the single
  entry point and reference the seed function zero times. In src/,
  seedExercisesIfNeeded is referenced only by its own module and by
  the flag-OFF branch of the entry-point module.

## 3. The dedicated tests (behavioral, no network, no hosted contact)

scripts/verify-exlib2t-runtime.ts drives the REAL entry point
against a fake in-memory Supabase client (13 checks): the strict-OFF
default across nine non-exact flag values with the seed path
verbatim and zero RPC calls; and, flag ON, every design-named
failure class failing closed with ZERO seed inserts — the missing
run key (failing closed before any RPC), the database rejection
(including the function's own no-sealed-run and not-authenticated
refusals), the thrown client, the timeout (a never-settling RPC
resolved by the race within the configured budget, asserted to be
classified unknownDeliveryOutcome: true with an UNKNOWN-outcome
reason), and SEVENTEEN malformed-response shapes against the
complete fourteen-key contract (null/array/string data, a PARTIAL
success object, a MISSING key, an EXTRA key, a wrong run_key echo,
non-integer and negative counters, an invalid collision_names
member, an invalid UUID, an invalid plank_disposition, the broken
accounting and both broken length invariants, a CORRECTED
disposition WITHOUT its accounting offset — the impossible round-1
fixture shape — and a NON-CORRECTION disposition with an
unexplained offset; none of them misclassified as an
unknown-outcome timeout) — plus the healthy fresh-insertion branch
(delivered_canonical_timed_plank), the EXISTING-SEEDED-TENANT
negative control (Codex round 1: with the flag ON a tenant that
already has seeded rows performs ZERO count queries, still invokes
the RPC exactly once, and accepts the database's
skipped-as-already-delivered summary), the THREE accepted
reconciliation summaries (Codex round 2: the Plank-only P2
correction with eligible 1 and all three counters 0, the mixed
delivery containing one P2 correction, and the already-linked
retry), and a CROSS-CUTTING tally proving the fake observed zero
seed-signature inserts across every flag-ON scenario in the suite.

## 4. What this milestone changes (the exact inventory)

Exactly TWENTY-THREE paths in ONE plain commit on the promoted tip:

- A src/lib/supabase/deliver-catalog.ts (the runtime).
- M the three call sites listed above.
- A docs/exlib2t-delivery-runtime-prep-record.md (this record).
- A scripts/verify-exlib2t.ts and A scripts/verify-exlib2t-runtime.ts.
- M sixteen committed historical verifiers, each carrying ONLY the
  mechanically necessary labeled retarget described in section 5.

The seed module, the inventory, every migration, package.json, and
every .env file are untouched (the verifier proves the frozen set).

## 5. The mechanically necessary historical retargets

The runtime is the FIRST milestone that adds src delivery references
and touches the initialization call sites, so every committed check
that asserted those live goes stale at this commit. The stale set
was enumerated MECHANICALLY: the full battery was run against a
temporary never-referenced simulated commit carrying the runtime
changes, and exactly SIXTEEN checks across SIXTEEN suites failed;
nothing else did. Three classes, one uniform mechanism — each claim
is anchored at the promoted EXLIB-2R evidence tip
5f7e182f3027b3640514e06d642693f4018c03e2 (the DELIVERY-RUNTIME
PREDECESSOR, this branch's fork point), where it was and remains
true, under the exact label
`RETARGET (EXLIB-2T delivery-runtime preparation)`:

- ZERO-DELIVERY-REFERENCE scans (verify-exlib2d F1, verify-exlib2e
  C1, verify-exlib2g A4, verify-exlib2h A3, verify-exlib2i C2,
  verify-exlib2j C2): the src consumer greps become anchored git
  greps at the predecessor; verify-exlib2g's seeding-call-site
  census is anchored the same way.
- LIVE-RANGE boundaries (verify-exlib2k D1, verify-exlib2m C2, and
  the five application suites verify-exlib2k/2o/2p/2q/2r-application):
  the SOURCE_TIP..HEAD phase-range clauses become
  SOURCE_TIP..predecessor — the range each milestone truthfully
  claimed.
- HUB-PAGE contracts (verify-phase4b6a, verify-phase5a2, verify-ui5a):
  the workouts-hub legacy-query assertions (including the direct
  seedExercisesIfNeeded call string) read the page at the anchored
  predecessor, where those milestones' claims held.

Assertion strength is unchanged everywhere (the anchored bytes are
exactly what the live bytes were before this milestone), and the
retargets are count-neutral: the simulated-commit battery reads
89 suites / 7,075 checks / 0 failures with the retargets in place —
exactly the promoted baseline 88/7,063 plus the twelve new runtime
behavior checks and nothing else.

SEQUENCING DISCLOSURE: the parked EXLIB-2S branch retargeted several
of these same suites for the seed/inventory flip under its own
label. The two branches fork from the same predecessor and edit some
of the same checks, so whichever lands second will need a reviewed
reconciliation of the overlapping retargets at that time; nothing
about this milestone changes the EXLIB-2S branch or its S7 block.

## 6. Verifier lifecycle for this milestone

scripts/verify-exlib2t.ts (new, static) owns the S3-preparation
posture: the promoted source refs and upstream freezes (seed module
and inventory byte-identical to the promoted tip — the S3
seed-remains-bodyweight requirement); the strict-OFF flag mechanics;
the FAIL-CLOSED REGION split (the seed identifier counted above and
below the marker); the single-entry-point routing census (zero
direct seed references in the call sites; the src-wide reference
census); the RPC integration shape against the migration bytes —
including, per Codex rounds 1 and 2, the COMPLETE fourteen-key
summary contract with the key set and the seven-value
plank_disposition enum EXTRACTED MECHANICALLY from migration 026's
bytes and compared with the module's constants, every validator
enforcement line pinned, and the CORRECTED accounting derived from
the migration's CONTROL FLOW (the P2 correction block proven
counter-free between IF v_p2_ok THEN and its CONTINUE, the other
Plank CONTINUE paths proven to increment their counters first, and
eligible proven to count at the loop top before the Plank
dispatch) plus both length invariants; the timeout machinery
including the UNKNOWN-eventual-outcome classification; the
NO-COUNT-GUARD structural proof (the fail-closed region's only
database surface is the single rpc call — it never queries a
table); the no-enablement proof (no tracked file assigns the flag;
no .env file changed); the runtime test suite's shape and totals;
the sixteen-suite retarget census (label + anchored predecessor
constant in every retargeted file, and nowhere else); two-commit
phase topology (the preserved preparation commit plus one forward
round-1 correction commit) over the twenty-three-path inventory;
and byte hygiene.

## 7. Stop condition

This milestone stops LOCAL-ONLY on its branch for Codex review. Not
pushed, not promoted, not tagged, not merged, not deployed; the flag
enabled nowhere; no hosted contact; no import run created, approved,
sealed, or revoked; no EXLIB-2S promotion; no seed, inventory,
migration, dependency, or configuration change. The live product's
behavior is UNCHANGED anywhere this branch is not deployed — and
even where it IS eventually deployed, behavior remains unchanged
until the S6 flag event, which stays separately gated.

## 8. Codex round-1 correction (2026-09-06)

Codex review of the preparation commit
(3ab5ae060888e3cf65441b2b1e35f3bff43ca6a4, tree
d997b381d4966d3bb6dd27d3ec8bd6b1d34df1e3 — PRESERVED, never
rewritten) found TWO release blockers, corrected here as ONE plain
forward commit touching exactly four paths (the runtime module,
this record, and both dedicated suites):

- BLOCKER 1 — the flag-ON path carried a client-side count guard
  that short-circuited delivery for any tenant with existing
  exercise rows. That prevented delivery to EXISTING USERS
  entirely: an existing tenant with the original bodyweight seed
  could never reach migration 026's pristine-Plank reconciliation,
  which exists precisely for such tenants. The guard was REMOVED;
  idempotence, collision handling, and reconciliation are the
  database function's job (that is what skipped_already_delivered
  and plank_disposition report). The prior C2 runtime test had
  enshrined the incorrect behavior (asserting an
  already_initialized outcome with zero RPC calls); it is REPLACED
  by the existing-seeded-tenant negative control asserting the
  opposite: zero count queries, exactly one RPC call, and the
  skipped-as-already-delivered summary accepted. The
  already_initialized outcome no longer exists in the type.
- BLOCKER 2 — the response validator accepted any object carrying
  integer eligible/inserted and the run_key echo, i.e. a subset of
  the migration-026 contract. It now validates the COMPLETE
  contract as described in sections 2 and 6 (exact fourteen-key
  set, ten non-negative integer counters, string-array
  collision_names, UUID-array inserted_catalog_logical_ids,
  enum-checked plank_disposition, and the three loop invariants),
  with the key set and disposition enum extracted mechanically
  from the migration bytes by the static verifier rather than
  restated by hand.
- Also tightened per the same review: the timeout is now
  explicitly classified as an UNKNOWN eventual delivery outcome
  (unknownDeliveryOutcome: true) because Promise.race abandons the
  wait, not the database transaction; correctness relies on the
  function's per-user idempotence, and the outcome object no
  longer reads like a proven non-delivery.

Sections 2, 3, and 6 above were corrected in place so this record
states only true things; section 5's quoted battery figures
(89 suites / 7,075 checks and the sixteen-failure enumeration)
describe the ORIGINAL preparation's simulated-commit battery and
remain historical fact. The correction's own simulated-commit
battery (the corrected worktree committed against the preserved
preparation commit) showed ZERO stale historical checks — the
correction touches only files introduced by this milestone — and
the corrected committed totals are 90 suites / 7,091 checks /
0 failures (the static suite grew by one check, B7; the runtime
suite remains 12 checks). Nothing in this correction changes the
retarget set, the call sites, the seed module, any migration, or
any configuration; the stop condition of section 7 is unchanged
and this branch remains LOCAL-ONLY, awaiting re-review.

## 9. Codex round-2 correction (2026-09-06)

Codex re-review of the round-1 commit
(d3db56316592aae3f93fb76e21971d64c477a615, tree
0224818afb62af05cc5cab194037006219c7960f — PRESERVED, never
rewritten) found ONE remaining blocker, corrected here as ONE plain
forward commit touching the same four paths. THE ROUND-1 INVARIANT
WAS WRONG, AND THE ROUND-1 FIXTURE HID IT:

- THE INCORRECT ROUND-1 INVARIANT: round 1 asserted inserted +
  skipped_already_delivered + skipped_name_collision = eligible
  with no offset. The finding was VERIFIED against the committed
  migration bytes before any edit: v_eligible increments at the
  loop top (line 259) for every run row, and the successful P2
  pristine-seed correction branch (IF v_p2_ok THEN, lines 336-358)
  performs the in-place UPDATE, the anatomy replacement, and the
  correction record, sets plank_disposition =
  corrected_and_linked_pristine_seed, and CONTINUEs — incrementing
  NONE of the three counters and appending NO logical id. So the
  lawful Plank-only correction returns eligible 1 with all three
  counters 0, and round 1's validator labeled that COMMITTED
  SUCCESS malformed — the delivery would have been rolled into a
  failed_closed outcome by the client for exactly the tenant the
  whole pristine-Plank reconciliation exists to serve. The
  corrected accounting adds correctedInPlace (1 for that one
  disposition, 0 otherwise), because every OTHER continue path
  increments a counter first: already_valid_idempotent increments
  skipped_already_delivered (both at its main-path CONTINUE and in
  the raced-idempotency exception handler), and the collision skip
  increments skipped_name_collision and appends the name. The two
  length invariants are unaffected (the correction branch appends
  no logical id and no collision name) and are preserved verbatim,
  as are the complete key/type validation, the round-1 count-guard
  removal, and the round-1 timeout-ambiguity classification.
- THE IMPOSSIBLE ROUND-1 FIXTURE: the round-1 "fresh user" success
  fixture combined inserted 25 / eligible 25 with
  corrected_and_linked_pristine_seed — a summary the database
  cannot produce (the corrected disposition requires the offset,
  so full insertion alongside it would need eligible 26). Because
  the fixture satisfied round 1's offset-free sum, the suite
  PASSED while the validator rejected the real committed success:
  the wrong fixture hid the wrong invariant. It is REPLACED by the
  schema-valid fresh-insertion disposition
  delivered_canonical_timed_plank (a fresh tenant has no name
  claims, so Plank inserts through the canonical branch and is
  counted by inserted). The old impossible shape is now itself a
  REJECTED malformed case.
- NEW BEHAVIORAL COVERAGE (the suite grows 12 -> 13 checks): the
  three lawful reconciliation summaries are accepted (the
  Plank-only P2 correction, the mixed delivery containing one P2
  correction, and the already-linked retry), and two accounting
  rejections join the malformed matrix (a corrected disposition
  WITHOUT its offset — the old fixture shape — and a
  non-correction disposition with an unexplained offset), taking
  it to SEVENTEEN shapes. The static verifier now derives the
  accounting from the migration's control flow itself (the
  counter-free P2 block, the counter-incrementing other CONTINUE
  paths, and the loop-top eligible increment) instead of trusting
  a hand-stated formula.

The correction's simulated-commit battery (the corrected worktree
committed against the preserved round-1 commit) again showed ZERO
stale historical checks, and the corrected committed totals are
90 suites / 7,092 checks / 0 failures (the runtime suite grew by
one check; the static suite remains 16 checks). Section 8's quoted
round-1 totals (90 suites / 7,091 checks) remain historical fact
about the round-1 battery. Nothing in this correction changes the
retarget set, the call sites, the seed module, any migration, or
any configuration; the stop condition of section 7 is unchanged
and this branch remains LOCAL-ONLY, awaiting re-review.
