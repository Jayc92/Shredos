# EXLIB-2G — Plank content authoring and coordinated-activation design

Recorded 2026-09-01. LOCAL-ONLY milestone: one Plank instructional
content record authored (pending, evidence-null, import-ineligible,
unpublished) plus this design record. NOTHING here edits the seed,
flips compatibility, wires runtime delivery, changes migrations,
creates hosted state, or contacts Supabase/Vercel.

## 1. Why the original EXLIB-2G attempt stopped (discovered facts)

- Current pristine seed Plank (src/lib/supabase/seed-exercises.ts):
  tracking_mode = bodyweight; anatomy = {(obliques, secondary)}
  (row primary_muscle = abs; exercise_type derives to bodyweight).
- Approved future Plank (promoted EXLIB-2D contract and inventory):
  tracking_mode = timed; derived exercise_type = mobility (via
  deriveLegacyExerciseType, matching migration 010's map); anatomy =
  {(obliques, secondary), (lower_back, tertiary)}.
- Migration 026's P2 predicate INTENTIONALLY recognizes only the OLD
  pristine bodyweight seed shape (tracking_mode = 'bodyweight' AND
  exercise_type = 'bodyweight' AND anatomy exactly
  obliques:secondary).
- Editing the seed before delivery activation would create unlinked
  timed seed rows (bare-15 seeding is the live path; zero src
  references to deliver_catalog_exercises) that P2 cannot correct.
- P5 would preserve such a row unlinked forever and deliver a second
  timed Plank — the two-Plank outcome the promoted design prohibits
  verbatim ("a release that creates an unlinked timed seed row").
- seed_link_compatible cannot truthfully become true in that state:
  the promoted condition requires the committed seed definition and
  the delivery contract to be COMPATIBLE, and the contract cannot
  link the new shape.

## 2. Codex adjudication (recorded verbatim as decided)

1. REJECT the early Plank seed edit — no early seed edit.
2. REJECT flipping seed_link_compatible now — no early compatibility
   flip.
3. REJECT amending migration 026 or creating migration 027 merely to
   permit an early seed edit — no migration-026 amendment; no
   migration 027 for this workaround.
4. REJECT accepting the P5/two-Plank outcome for users created
   during an intermediate window — no acceptance of the P5 duplicate
   outcome.
5. Preserve the current bodyweight pristine seed until the final
   coordinated delivery-activation release — the current seed
   remains unchanged until coordinated activation.
6. Reorder the work so Plank content and activation architecture are
   prepared before any seed/runtime/hosted mutation.

The fail-closed stop was accepted as correct; nothing needed
reverting because no bytes changed and no commit was created.

## 3. Safe milestone order (adjudicated sequencing)

A. Plank instructional content authored and reviewed locally
   (THIS milestone authors it; review remains pending).
B. Catalog snapshot/loading package prepared and reviewed separately
   (local artifacts only; nothing hosted).
C. Runtime delivery activation designed and reviewed (design below;
   implementation is NOT this milestone).
D. Hosted catalog loading may occur only in a database state the
   delivery function REJECTS (loaded but unapproved and unsealed -
   the run's born posture under migration 023). A sealed, approved,
   unrevoked run is deliverable to ANY authenticated caller of
   deliver_catalog_exercises regardless of application flags, so
   approval/sealing is NEVER staging: it is the protected
   delivery-activation event itself.
E. Final coordinated activation: under the protected gate, make the
   run deliverable (approve + seal) and verify it, enable the
   runtime delivery path, and only after delivery-first behavior is
   proven fleet-wide may the future seed become timed and
   seed_link_compatible become true - one reviewed release plan
   that prevents new users from entering the prohibited
   intermediate state (state machine below).
F. Delivery to users remains a separate explicit operator gate
   unless the final approved activation design proves it must be
   inseparable from E.

## 4. Coordinated-activation state machine (fail-closed design)

CORRECTED after Codex activation review (forward correction; the
original machine wrongly treated a sealed run as product-inactive).
Two governing truths shape everything below:

- An application runtime flag CANNOT protect the database: a
  sealed/approved/unrevoked run is deliverable to any authenticated
  caller who invokes deliver_catalog_exercises directly over RPC,
  whatever the application is doing. No claim of
  "sealed-but-inactive" appears anywhere in this design, and no
  authenticated direct-RPC exposure window is accepted.
- The existing migration-023/026 authorization predicate is the only
  delivery gate that actually binds every caller:
  approved_for_delivery = true AND dry_run = false AND sealed_at IS
  NOT NULL AND revoked_at IS NULL. Hosted staging must therefore
  keep the run in a posture that predicate REJECTS, and the staged
  posture must also be PROMOTABLE by the existing controlled
  operation. Transition precision, from the migration-023 bytes:
  exlib_approve_and_seal_run() sets ONLY approved_for_delivery =
  true and sealed_at = NOW() - it does NOT change dry_run and does
  NOT populate approval evidence - and the
  exercise_catalog_import_runs freeze trigger raises "dry runs
  cannot be sealed" whenever NEW.dry_run remains true at the
  approval/seal transition, requires complete non-blank product +
  legal approval evidence, rejects an empty membership, and rejects
  any exercise member that is not approved, active, and fully
  review-audited. The SELECTED staged posture is therefore: catalog
  rows and run/run-item rows fully loaded and fully
  reviewed/audited; the run row with dry_run = false,
  approved_for_delivery = false, sealed_at = NULL, revoked_at =
  NULL; and the required product/legal approval evidence populated
  (all of these are staging/preparation fields, writable while the
  run is unapproved and unsealed - the trigger freezes them only at
  and after the seal). This posture is structurally NON-DELIVERABLE
  (the predicate still requires approved_for_delivery = true and a
  non-null sealed_at) and is DIRECTLY promotable by one call to
  exlib_approve_and_seal_run(). If a loader necessarily creates the
  run dry_run = true first (the column default), the protected
  preparation transition is: (1) while still unapproved and
  unsealed, set dry_run = false and populate the required approval
  evidence; (2) the run remains non-deliverable in that state; (3)
  then call exlib_approve_and_seal_run(), which atomically sets
  approved_for_delivery = true and sealed_at; (4) verify the
  resulting run before enabling the application path. The promoted
  EXLIB-2F live matrix already executes the predicate's rejection
  of unapproved/unsealed/dry provenance and the revocation halt,
  and the run gate is byte-carried 023 text. No new database flag
  is invented and no migration 027 is proposed; the existing
  contract supports a hosted-loaded but non-deliverable run, so
  hosted loading need not wait for the activation event. The precise
  activation rule: the approval/seal transition of an ELIGIBLE
  UNSEALED run is the activation event - the exact moment
  authenticated direct RPC becomes deliverable - and it happens only
  under the protected gate. Revocation is PERMANENT: migration 023
  makes revoked_at one-way and never clearable, a revoked run can
  NEVER be reactivated or unrevoked (exlib_revoke_run_delivery is
  idempotent for an already-revoked run and reports the original
  revocation), and any later delivery decision requires a NEW run.
  The adjective "unrevoked" anywhere in this design means only the
  predicate state revoked_at IS NULL, never a transition.

No cross-system atomicity between Git, Vercel, and Supabase is
claimed or relied on anywhere below: every state tolerates the
others lagging, and every transition is safe under rolling
deployment with old clients still running.

The safe order (canonical):

1. Content reviewed locally.
2. Load package reviewed locally.
3. Runtime delivery-capable code deployed behind an OFF application
   flag while the seed remains bodyweight.
4. Catalog/run loaded hosted ONLY in the rejected staged posture:
   dry_run = false, unapproved, unsealed, unrevoked, membership
   fully loaded and review-audited, approval evidence populated.
5. Under a separate protected activation gate, make the run
   deliverable (approve + seal) and verify it.
6. Enable the runtime delivery path.
7. Only after delivery-first behavior is proven fleet-wide may the
   future seed become timed and seed_link_compatible become true
   (the seed-flip event, formerly S4c).

States:

- S0 CURRENT: old bodyweight seed live; hosted catalog rows zero;
  delivery runtime absent. Every client bare-seeds the bodyweight
  Plank, which stays P2-correctable forever. Safe indefinitely.
- S1 CONTENT-READY (this milestone): S0 plus one local Plank content
  record, pending/evidence-null/import-ineligible/unpublished. No
  behavioral change anywhere. Safe indefinitely.
- S2 LOAD-PACKAGE-READY: S1 plus a reviewed load package existing
  LOCALLY (fingerprinted payload, load procedure targeting the
  rejected posture only, rollback procedure). No hosted mutation.
- S3 RUNTIME-DEPLOYED-GATE-OFF: the delivery-capable runtime is
  deployed behind an OFF application flag while the SEED DEFINITION
  REMAINS BODYWEIGHT. Old and new server instances both bare-seed
  bodyweight rows (P2-correctable); rolling deployment is safe
  because no code anywhere writes a timed seed row. The flag
  protects only the application's own call path - it is NOT a
  security boundary - which is why S4's database posture, not this
  flag, is what keeps staging non-deliverable.
- S4 HOSTED-STAGED-NON-DELIVERABLE: the load package is applied
  hosted, leaving the run in the selected staged posture - dry_run
  = false, approved_for_delivery = false, sealed_at NULL,
  revoked_at NULL, membership fully loaded and fully
  review-audited, product/legal approval evidence populated (all
  writable pre-seal; if the loader created the run dry_run = true,
  the protected preparation transition flips it to false while
  still unapproved and unsealed). The delivery predicate rejects
  the run for EVERY caller, including direct authenticated RPC -
  there is no exposure window and nothing about this posture blocks
  the later one-call promotion. Loading itself changes no tenant
  data and no user-visible behavior. Reversible trivially (the run
  was never deliverable).
- S5 PROTECTED-ACTIVATION (the activation event): under the separate
  protected gate, one call to exlib_approve_and_seal_run() performs
  the single atomic transition the trigger permits - it sets ONLY
  approved_for_delivery = true and sealed_at = NOW() (never
  dry_run, never evidence; both must already be correct from S4, or
  the trigger fails the transition closed). The COMMIT of that
  transition is the exact moment authenticated direct RPC becomes
  deliverable. Verification runs immediately (fixture account or
  operator account) before any broader enablement. This is delivery
  activation, deliberately performed, never incidental staging.
- S6 DELIVERY-ENABLED: the application flag turns ON only after (i)
  S5 verification passed and (ii) the S3 rollout is fleet-complete
  (enforced by deployment-platform completion, not assumed).
  Zero-exercise users now receive the catalog through
  deliver_catalog_exercises; existing bodyweight seed rows are
  P2-corrected on each user's first delivery. The seed definition
  is STILL bodyweight, so any residual seeding path remains
  P2-correctable.
- S7 FUTURE-SEED (the seed-flip event, formerly S4c): only after
  delivery-first behavior is proven fleet-wide, edit the seed module
  (tracking_mode timed + the exact approved anatomy) and flip
  seed_link_compatible=true in the SAME commit. The flip is
  truthful: delivery, not seeding, defines the Plank for every new
  account.
- POST-S7 FAIL-CLOSED RULE (binding on the future runtime
  implementation): once the seed definition is timed, a failed or
  unavailable delivery MUST FAIL CLOSED for zero-exercise users - a
  temporary inability to initialize exercises is safer than
  creating an unlinked timed Plank that migration 026 can never
  P2-link. The runtime activation implementation must PROVE that
  delivery failure, a rejected run, a revoked run, a timeout, or a
  malformed response CANNOT call seedExercisesIfNeeded while the
  timed seed definition is live. Turning the application flag OFF
  after S7 does NOT restore S0 and is not a rollback: with the
  timed seed live, the legacy path is forbidden. Emergency catalog
  revocation after S7 may therefore cause fail-closed
  initialization for new users until the seed rollback completes -
  accepted by design.

Rollback (two distinct regimes):

- BEFORE S7 (seed still bodyweight): turning the application flag
  OFF safely returns to the existing bodyweight bare-seed path at
  any point in S3-S6; bodyweight rows remain P2-correctable, and
  exlib_revoke_run_delivery halts a deliverable run fail-closed
  without reinterpreting tenant rows. Nothing about this regime can
  create a timed row.
- AFTER S7 (timed seed live): legacy seeding MUST NOT be re-enabled
  while the timed seed definition is live, in any instance, ever.
  Ordered rollback: (1) revert the seed definition to bodyweight
  AND move seed_link_compatible back to false in the same reviewed
  repository state; (2) deploy that revert across the ENTIRE server
  fleet and verify fleet completion plus the restored old seed
  fingerprint; (3) only then may delivery be disabled and
  bodyweight legacy seeding re-enabled. If immediate catalog
  revocation is required for safety, revoke FIRST - initialization
  then fails closed for new users until steps (1)-(2) complete;
  that outage is the accepted safe behavior.
- MIXED-FLEET ANALYSIS (rollback): during the post-S7 revert
  deployment the fleet mixes timed-definition instances (fail
  closed, never seed) with reverted bodyweight-definition instances
  (delivery-first, flag still ON, so they do not bare-seed either).
  Because the flag stays ON until fleet completion is verified, NO
  instance bare-seeds during the mixed window, so old and new
  instances cannot disagree in a way that permits timed fallback
  seeding; after verified completion the flag turns OFF and every
  instance bare-seeds bodyweight only.

Old-client analysis (explicit): browsers never write seed rows
directly - both seeding and delivery are server-side effects of
authenticated page/API requests. A client rendered by old UI code
against a new server sees the new server behavior; the only real
hazards are mixed SERVER fleets (handled above in both directions)
and direct authenticated RPC (handled by the database posture, never
by flags). A plan that is safe only if every client changes
instantaneously is invalid; this plan requires no client change at
all.

INVALID ORDERINGS (explicitly rejected): seed edit before S6-proven
delivery-first behavior (recreates the prohibited unlinked-timed
state - the original EXLIB-2G mistake); approving/sealing a run as
"staging" before the protected gate (it is the activation event);
gate-ON before fleet-uniform rollout; re-enabling legacy seeding
after S7 before the fleet-wide seed revert completes; any reliance
on an application flag to keep a deliverable run from authenticated
callers.

## 5. The authored Plank content record (Part 3 of this milestone)

- Location: docs/exlib2g-plank-content.jsonl — a NEW artifact. The
  six promoted batch files are byte-frozen history and are NOT
  edited; release-1 ordinary authoring (126/126) remains exactly as
  promoted. The corpus for uniqueness/resolution checks is the 126
  promoted records plus this record.
- Identity: the authoritative inventory identity verbatim —
  canonical name Plank, primary_muscle abs, muscle_targets exactly
  {(obliques, secondary), (lower_back, tertiary)} (no other muscle
  or role), equipment bodyweight, tracking_mode timed (derived
  exercise_type mobility), laterality bilateral, movement_pattern
  core_anti_extension, training_role core, difficulty beginner,
  availability minimal.
- Aliases: "Front plank", "Forearm plank" — true synonyms of the
  same movement; neither collides with any corpus canonical name or
  any existing alias (mechanically verified).
- Relationships (authoring-time staging arrays; R3-resolvable):
  substitutions ["Dead bug"] (anti-extension alternative),
  progressions ["Ab wheel rollout"] (harder anti-extension).
  regressions [] — the natural regression (knees-down plank) is not
  a release-1 inventory identity, so per R3 it cannot be referenced
  as a relationship target; the knees-down regression is instead
  described in accessibility_alternative, exactly the batch-01
  precedent for easier variants without corpus identities. The
  natural loaded progressions (Plate-weighted plank, Weighted vest
  plank) are deliberately NOT referenced: both are weight_time
  DEFERRED identities excluded from every import subset, and a
  relationship pointing at an unloadable target would fail the
  load-time fail-closed resolver.
- Review state: content_review.status pending with reviewer,
  reviewed_at, and rationale all null; review_status proposed;
  import_eligible literal false; deferred false with null reason;
  provenance forgefitos_original with no source fields; publication
  state absent by contract (authoring records never carry it).
  Nothing is approved, sealed, loaded, published, or delivered.

## 6. Recovery evidence note

A post-026 physical backup of the hosted ShredOS project taken at
2026-09-01 13:09:47 UTC exists as OPERATOR recovery evidence. It was
made by the operator outside this repository; it is NOT
repository-generated, was never downloaded into or fingerprinted by
this repository, and nothing in this milestone reads or depends on
it. It is recorded here solely so the activation design's rollback
thinking acknowledges a physical restore point exists.

## 7. Boundaries

This milestone changes exactly: this design record, the one Plank
content artifact, and scripts/verify-exlib2g.ts. No seed edit, no
seed_link_compatible flip, no runtime delivery wiring, no migration
edit, no migration 027, no hosted contact, no catalog
snapshot/run/approval/seal/load/publication/delivery, no eligibility
or review-ledger mutation, no weight_time implementation, no push,
promotion, tag, deployment, or branch deletion.
