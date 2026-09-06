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
- FLAG ON: delivery-first with THE FAIL-CLOSED LAW. The path runs
  the same idempotent count guard, requires
  CATALOG_DELIVERY_RUN_KEY (missing configuration fails closed
  BEFORE any database call), invokes the schema-qualified
  deliver_catalog_exercises RPC under a timeout
  (CATALOG_DELIVERY_TIMEOUT_MS, defaulting to 10,000ms; a
  positive-integer-validated operational knob, never a behavior
  flag), validates the JSONB summary (run_key echo and non-negative
  integer counters; anything else is malformed), and on ANY failure
  — rejection, thrown client, timeout, malformed response, missing
  configuration, unexpected exception — logs and returns
  failed_closed WITHOUT SEEDING. A temporary inability to
  initialize exercises is the design-accepted safe outcome; a
  fallback seed row is not.
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
against a fake in-memory Supabase client (12 checks): the strict-OFF
default across nine non-exact flag values with the seed path
verbatim and zero RPC calls; and, flag ON, every design-named
failure class failing closed with ZERO seed inserts — the missing
run key (failing closed before any RPC), the database rejection
(including the function's own no-sealed-run and not-authenticated
refusals), the thrown client, the timeout (a never-settling RPC
resolved by the race within the configured budget), and seven
malformed-response shapes — plus the healthy delivered and
already-initialized branches, and a CROSS-CUTTING tally proving the
fake observed zero seed-signature inserts across every flag-ON
scenario in the suite.

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
census); the RPC integration shape against the migration bytes (the
exact function name and argument, the authenticated grant, the
summary validation); the timeout machinery; the no-enablement proof
(no tracked file assigns the flag; no .env file changed); the
runtime test suite's shape and totals; the sixteen-suite retarget
census (label + anchored predecessor constant in every retargeted
file, and nowhere else); two-state phase topology over the
twenty-three-path inventory; and byte hygiene.

## 7. Stop condition

This milestone stops LOCAL-ONLY on its branch for Codex review. Not
pushed, not promoted, not tagged, not merged, not deployed; the flag
enabled nowhere; no hosted contact; no import run created, approved,
sealed, or revoked; no EXLIB-2S promotion; no seed, inventory,
migration, dependency, or configuration change. The live product's
behavior is UNCHANGED anywhere this branch is not deployed — and
even where it IS eventually deployed, behavior remains unchanged
until the S6 flag event, which stays separately gated.
