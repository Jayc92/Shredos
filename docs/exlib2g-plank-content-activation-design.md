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
D. Hosted catalog loading/sealing occurs under a separate protected
   gate while delivery remains inactive (no user-visible change; the
   delivery runtime is still absent, so sealed data sits inert
   behind the SECURITY DEFINER run gate).
E. Final coordinated activation changes runtime behavior, the future
   seed definition, and seed_link_compatible under ONE reviewed
   release plan that prevents new users from entering the prohibited
   intermediate state (state machine below).
F. Delivery to users remains a separate explicit operator gate
   unless the final approved activation design proves it must be
   inseparable from E.

## 4. Coordinated-activation state machine (fail-closed design)

No cross-system atomicity between Git, Vercel, and Supabase is
claimed or relied on anywhere below: every state tolerates the
others lagging, and every transition is safe under rolling
deployment with old clients still running.

- S0 CURRENT: old bodyweight seed live; hosted catalog rows zero;
  delivery runtime absent. Every client (old or new) bare-seeds the
  bodyweight Plank, which stays P2-correctable forever. Safe
  indefinitely.
- S1 CONTENT-READY (this milestone): S0 plus one local Plank content
  record, pending/evidence-null/import-ineligible/unpublished. No
  behavioral change anywhere. Safe indefinitely.
- S2 CATALOG-PREPARED: S1 plus a reviewed load package existing
  LOCALLY (fingerprinted payload, load procedure, rollback
  procedure). No hosted mutation. Safe indefinitely.
- S3 HOSTED-STAGED: catalog snapshot/run loaded and sealed on hosted
  under its own protected gate — but NO user delivery path exists
  (the runtime never calls deliver_catalog_exercises; clients cannot
  call it usefully because a sealed-but-unactivated run is inert
  product-side, and the seed path still bare-seeds bodyweight
  Planks, which remain P2-correctable). Old and new clients behave
  identically to S0. Reversible by exlib_revoke_run_delivery, which
  never reinterprets or touches tenant rows. NOTE (fail-closed
  honesty): sealing makes the run technically deliverable to any
  authenticated caller of deliver_catalog_exercises; S3 therefore
  REQUIRES the activation-design review to either accept that
  exposure window explicitly or place S3 after the runtime deploy
  completes with the flag still OFF (S4a below covers the safe
  ordering).
- S4 RUNTIME-ACTIVATION (the delicate one, ordered fail-closed):
  - S4a deploy the delivery-capable runtime BEHIND an off flag (or
    equivalent server-side gate): new server code prefers delivery
    for zero-exercise users but the gate keeps it on the bare-seed
    path; old and new server instances both bare-seed. No behavior
    change. The FUTURE SEED DEFINITION IS STILL BODYWEIGHT — so any
    instance, old or new, that seeds during rollout creates only
    P2-correctable rows. This is what makes rolling deployment safe:
    the prohibited "unlinked timed seed row" cannot exist because no
    code anywhere writes a timed seed row yet.
  - S4b flip the server-side gate ON only after (i) S3 is sealed and
    verified and (ii) the rollout of S4a is complete (no old server
    instances remain that would bare-seed AFTER delivery starts for
    other instances — enforced by deployment-platform completion,
    not assumed). From this moment zero-exercise users receive the
    catalog through deliver_catalog_exercises; existing bodyweight
    seed rows are corrected by P2 the first time delivery runs for
    that user. Old CLIENTS (browsers) are safe throughout: seeding
    and delivery are SERVER-side (page/API calls
    seedExercisesIfNeeded today); a stale browser simply invokes
    whatever the current server does.
  - S4c ONLY NOW edit the seed module (tracking_mode timed + the
    exact approved anatomy) as fallback cleanup for any residual
    path where the seed function still runs, and flip
    seed_link_compatible=true in the inventory in the same commit.
    Because delivery already precedes seeding for zero-exercise
    users, a timed seed row can only be created for a user who
    ALREADY holds the delivered/linked Plank (the seed function's
    zero-count guard makes even this practically unreachable), so
    the prohibited unlinked-timed state cannot arise. The flip is
    truthful: committed future seed definition and delivery contract
    are compatible because delivery, not seeding, defines the Plank
    for every new account.
  - INVALID ORDERINGS (explicitly rejected): seed edit before S4b
    (recreates the prohibited state — the original EXLIB-2G
    mistake); gate-on before rollout completion (mixed fleets could
    bare-seed and deliver for different users, which is safe for
    Plank via P2 but pointlessly racy); any plan requiring all
    clients to change instantaneously (invalid by definition here —
    both paths are server-side and both tolerate stale browsers).
- S5 ROLLBACK STATES:
  - Runtime deploy fails mid-rollout (S4a): every instance still
    bare-seeds bodyweight; nothing to undo.
  - Gate-on then delivery FAILS (S4b): the delivery function is
    atomic per user (advisory lock + single transaction) — a failed
    delivery leaves that user with zero exercises for that request;
    the gate can be flipped OFF, restoring bare-seed behavior for
    subsequent requests. Users already delivered keep linked rows
    (valid state; P2/verified-idempotency semantics remain correct).
  - Catalog must be revoked (any time): exlib_revoke_run_delivery
    halts future delivery fail-closed; delivered rows and corrected
    rows are never reinterpreted (promoted 026 proof); with the gate
    OFF the system degrades exactly to S0 behavior for new users.
  - Seed edit must be rolled back (after S4c): revert the seed
    commit; because delivery precedes seeding, no user depends on
    the timed seed definition; seed_link_compatible reverts in the
    same commit (it is a global artifact fact, so it must always
    move with the seed definition).
- S6 FUTURE-SEED STATE (steady state): timed seed definition +
  seed_link_compatible=true are truthful; bare-15 seeding is a
  vestigial fallback that can be retired under later product work.

Old-client analysis (explicit): browsers never write seed rows
directly — both seeding and delivery are server-side effects of
authenticated page/API requests. A client rendered by old UI code
against a new server sees the new server behavior; a mixed SERVER
fleet is the only real hazard, and S4a/S4b remove it by keeping the
seed definition bodyweight until the fleet is uniform and gated ON.
A plan that is safe only if every client changes instantaneously is
invalid; this plan requires no client change at all.

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
