# EXLIB-2S — Plank delivery-activation preparation record

Recorded 2026-09-06 (UTC). PREPARATION ONLY, ON A LOCAL BRANCH — this
milestone prepares the coordinated Plank seed-module edit and the
inventory seed_link_compatible flip (the promoted activation design's
SEED-FLIP EVENT, its state S7) as one reviewed, committed, LOCAL-ONLY
change set. It changes no hosted database state of any kind: no
Supabase or Vercel endpoint was contacted, no SPENT package was
rerun, no import run was created, and every database fact below is
cited from promoted repository evidence bytes. NO PRODUCT DELIVERY IS
CLAIMED: merging, promoting, or deploying this branch IS the
seed-flip event, and it remains separately gated (section 3). Nothing
here is approved by its own existence.

## 1. Authoritative sources (all promoted, all byte-frozen)

- Promoted source commit: main =
  5f7e182f3027b3640514e06d642693f4018c03e2 (tree
  902a2b4b1bf76ca5d75fc8d20b62062411c95cc5), carrying the annotated
  evidence tag exlib2r-hosted-publication-application-evidence-stable
  (tag object e1922ea29f76f43be17f0dd3a7f3d36bcfa8381b, annotation
  "EXLIB-2R Plank hosted publication application evidence —
  PUBLISHED — DELIVERY NOT ACTIVATED").
- The hosted published state this preparation delivers against: the
  promoted EXLIB-2R application record (19,051 bytes, SHA-256
  bf0b75e73e6064ee2901bb1a3a607547215f4ab638b997eea7b012993240974e):
  the Plank content version e21b2c00-0000-4000-a000-000000000101 is
  PUBLISHED (published 1, draft 0, retired 0) with its ATOMIC
  projection exact — Plank progression -> Ab wheel rollout
  (...0003) and Plank substitution -> Dead bug (...0002) — and
  delivery activation NOT performed.
- The admitted, published Plank authored artifact (the payload and
  identity this seed edit corresponds to):
  docs/exlib2g-plank-content.jsonl, 2,928 bytes, SHA-256
  d82078490efa9ef13e128e7b7b742fbda8ea9e74e32382252d96c326c679d752.
- The promoted coordinated-activation design (Codex-adjudicated):
  docs/exlib2g-plank-content-activation-design.md, carried by the
  annotated tag exlib2g-plank-content-activation-design-stable. Its
  state machine, its same-commit rule for the seed-flip event, its
  INVALID-ORDERING rejections, and its POST-S7 FAIL-CLOSED RULE are
  quoted and honored below.
- The applied migrations whose bytes define the contract: 010 (the
  tracking-mode to legacy exercise_type map), 023 (the run-based
  delivery gate), 026 (the P2 pristine-seed predicate), 027 (the
  published catalog lifecycle).
- The authoritative release-1 inventory
  (docs/exlib2b-release1-inventory.jsonl) and the seed module
  (src/lib/supabase/seed-exercises.ts) at the promoted source tip —
  the two files this milestone changes.

## 2. The derived delivery contract (from promoted bytes, mechanically)

WHAT THE SEED MODULE IS AND EXPRESSES: the live seeding path is
seedExercisesIfNeeded (bare-15 seeding on first authenticated visit,
idempotent by count guard), writing tenant rows into
public.exercises and public.exercise_muscles. Each seed entry
expresses EXACTLY seven fields — name, category, primary_muscle,
equipment, tracking_mode, unilateral, muscle_targets — plus the
derived legacy exercise_type computed by deriveLegacyExerciseType at
insert time. THE SEED CANNOT EXPRESS instructional payload (setup
steps, execution steps, cues, mistakes, safety, accessibility) and
CANNOT EXPRESS exercise-to-exercise relationships: no such fields
exist in the seed shape and no tenant table carries
exercise-to-exercise links. Those are CATALOG facts — the published
payload and the two projected relationships live in the published
catalog surface evidenced by the promoted EXLIB-2R record — and this
record does not claim the seed carries them.

THE EXACT EDIT (the smallest change set that makes the seed
correspond to the published Plank identity at every field the seed
expresses):

- src/lib/supabase/seed-exercises.ts, the Plank entry:
  tracking_mode "bodyweight" becomes "timed"; muscle_targets
  {(obliques, secondary)} becomes {(obliques, secondary),
  (lower_back, tertiary)}. Every other field already corresponded
  (name Plank, category isolation, primary_muscle abs, equipment
  bodyweight, unilateral false — the published snapshot's bilateral
  laterality). The module's taxonomy-documentation comment gains the
  matching EXLIB-2S entry (the header demands every taxonomy change
  be documented).
- docs/exlib2b-release1-inventory.jsonl, the Plank row: exactly ONE
  field changes — "seed_link_compatible": false becomes true. No
  other row and no other field of the Plank row changes (the diff is
  one line; the verifier proves field-level equality of everything
  else).

WHY THE FLIP IS NOW TRUTHFUL: the promoted compatibility condition
(EXLIB-2A/2B, restated by the activation design) requires the
COMMITTED SEED DEFINITION and the delivery contract to be
COMPATIBLE. With this edit the committed seed definition equals the
published catalog identity at every expressible field —
name/tracking/equipment agreement, the exact approved anatomy, and
the derived legacy type — so seed_link_compatible = true states a
fact about these committed bytes. The design's SAME-COMMIT RULE
("edit the seed module ... and flip seed_link_compatible=true in the
SAME commit") is honored: both changes land in this milestone's one
phase commit.

THE CORRESPONDENCE PROOF (mechanical, in scripts/verify-exlib2s.ts):

- seed.name = Plank = the published canonical name (artifact
  proposed_canonical_name; the promoted evidence snapshot line
  "canonical_name = Plank, category = isolation").
- seed.category = isolation = the published snapshot category.
- seed.primary_muscle = abs = artifact primary_muscle = inventory
  primary_muscle.
- seed.equipment = bodyweight = artifact equipment = inventory
  equipment.
- seed.tracking_mode = timed = artifact tracking_mode = inventory
  tracking_mode.
- seed.unilateral = false = the published bilateral laterality
  (artifact laterality bilateral).
- seed.muscle_targets = {(obliques, secondary), (lower_back,
  tertiary)} = artifact muscle_targets = inventory muscle_targets =
  the promoted evidence anatomy line, EXACTLY (no other muscle or
  role).
- deriveLegacyExerciseType("timed") = mobility = inventory
  exercise_type_derived (the module's map matches migration 010's
  map, as the promoted design records).
- The published payload and the two projected relationships
  (progression -> Ab wheel rollout, substitution -> Dead bug) are
  cited from the promoted EXLIB-2R evidence record and are
  deliberately NOT expressed in the seed — the seed delivers the
  identity; the catalog holds the published content and
  relationships. Nothing diverges anywhere the two surfaces overlap.

HOSTED STATE: untouched. This milestone performed no hosted contact;
every published-state fact above is a citation of promoted evidence
bytes, and the hosted database remains exactly as the promoted
EXLIB-2R evidence left it.

## 3. The ordering gates that bind the RELEASE of this change set

Derived from the promoted activation design and the current
repository bytes, stated plainly and without deviation:

- The design places the seed-flip event at S7, AFTER: S3 (runtime
  delivery-capable code deployed behind an OFF application flag),
  S4 (a hosted import run staged NON-DELIVERABLE), S5 (the protected
  approve-and-seal activation event), and S6 (the application flag
  ON with delivery-first behavior proven fleet-wide).
- CURRENT FACTS: the repository contains ZERO src references to
  deliver_catalog_exercises (no delivery runtime exists, proven
  mechanically by the verifier); the promoted EXLIB-2R evidence
  records ZERO import runs and ZERO run items on hosted. S3 through
  S6 have NOT occurred.
- The design EXPLICITLY REJECTS, verbatim: "seed edit before
  S6-proven delivery-first behavior (recreates the prohibited
  unlinked-timed state - the original EXLIB-2G mistake)". The
  mechanism, from migration 026's bytes: the P2 predicate recognizes
  only the pristine bodyweight seed shape (tracking_mode =
  'bodyweight' with the old anatomy), so a DEPLOYED timed seed
  definition would create tenant rows the delivery path could never
  P2-link — the prohibited two-Plank outcome.
- THEREFORE, BINDINGLY: this milestone prepares the S7 change set on
  a LOCAL BRANCH ONLY. MERGING, PROMOTING, OR DEPLOYING THIS BRANCH
  IS THE SEED-FLIP EVENT (S7) AND REMAINS BLOCKED until either (a)
  the design's S3-S6 preconditions are met, or (b) Codex explicitly
  re-adjudicates the activation ordering for the published-content
  lifecycle (migration 027's publication route, which post-dates the
  design and is not addressed by its state machine). This record
  takes no position that the ordering has been re-adjudicated; it
  flags the constraint rather than deviating silently.
- The design's POST-S7 FAIL-CLOSED RULE is quoted as binding on any
  future runtime implementation: once the seed definition is timed,
  a failed or unavailable delivery MUST FAIL CLOSED for
  zero-exercise users; the runtime "must PROVE that delivery
  failure, a rejected run, a revoked run, a timeout, or a malformed
  response CANNOT call seedExercisesIfNeeded while the timed seed
  definition is live." No such runtime exists yet; this preparation
  adds none.
- The run-based delivery machinery itself (migration 023's
  deliver_catalog_exercises behind the approved/sealed/unrevoked
  predicate) is untouched by this milestone: no run was created,
  nothing was approved or sealed, and the function remains without
  any src caller.

## 4. What this milestone changes (the exact inventory)

Exactly THIRTY-FOUR paths in ONE plain commit on the promoted tip:

- M src/lib/supabase/seed-exercises.ts (the Plank entry + the
  documentation comment).
- M docs/exlib2b-release1-inventory.jsonl (one field on one row).
- A docs/exlib2s-plank-delivery-activation-prep-record.md (this
  record).
- A scripts/verify-exlib2s.ts (the dedicated verifier).
- M thirty committed historical verifiers, each carrying ONLY the
  mechanically necessary labeled retarget described in section 5.

No runtime, API, UI, dependency, configuration, migration, or hosted
change of any kind; no push, promotion, tag, or deployment.

## 5. The mechanically necessary historical retargets

The delivery activation is the FIRST milestone that changes the seed
module and the inventory, so every committed verifier that asserted
those bytes live — the frozen-product-surface class built up across
the entire EXLIB series — goes stale at this commit. The stale set
was enumerated MECHANICALLY, not assumed: the full battery was run
against a temporary never-referenced simulated commit carrying only
the two product changes, and exactly FORTY-ONE checks across THIRTY
suites failed; nothing else did. Each was retargeted under the exact
label `RETARGET (EXLIB-2S delivery-activation preparation)` with ONE
uniform, strength-preserving mechanism: the seed/inventory reads,
byte pins, and boundary ranges those checks make are ANCHORED AT THE
PROMOTED EXLIB-2R EVIDENCE TIP 5f7e182f3027b3640514e06d642693f4018c03e2
(the DELIVERY-ACTIVATION PREDECESSOR) — the last promoted commit at
which the whole frozen surface still held. The anchored bytes are
EXACTLY what the live bytes were when each suite's claim was made
(proven by the unbroken chain of frozen-surface checks across every
intervening milestone), so every assertion keeps identical strength;
it is scoped to "through this suite's milestone", which is what each
of those milestones truthfully claimed. No check was weakened or
deleted, and the battery totals are IDENTICAL before and after the
retargets (88 suites / 7,063 checks / 0 failures at the simulated
commit both ways — count-neutral).

The thirty retargeted suites: verify-exlib1a, verify-exlib2a2b,
verify-exlib2c-batch01 through batch06, verify-exlib2d,
verify-exlib2e, verify-exlib2f, verify-exlib2f-application,
verify-exlib2g, verify-exlib2h, verify-exlib2i, verify-exlib2j,
verify-exlib2k, verify-exlib2k-application, verify-exlib2l,
verify-exlib2m, verify-exlib2m-application,
verify-exlib2n-r6-admission, verify-exlib2o,
verify-exlib2o-application, verify-exlib2p,
verify-exlib2p-application, verify-exlib2q,
verify-exlib2q-application, verify-exlib2r, and
verify-exlib2r-application.

## 6. Verifier lifecycle for this milestone

scripts/verify-exlib2s.ts (new) owns the delivery-preparation
posture: the promoted source refs and upstream freezes; the complete
field-level seed-to-published-identity correspondence (parsed
mechanically from the seed module and compared to the artifact, the
inventory, and the promoted evidence lines); the anatomy set
equality; the derived-type equality; the one-field flip proof
(field-level equality of every other Plank inventory field against
the delivery predecessor, exactly fifteen compatible rows after the
flip); the same-commit rule; the seed non-expression boundary (the
seed type still carries exactly its seven fields; no payload or
relationship expression appeared); the published-side citations; the
ordering-gate disclosures (zero src delivery references, the
zero-runs citation, the design quotes, the blocked-release
statement, the P2 predicate citation); the no-delivery-claim
hygiene; the thirty-suite retarget census (every retargeted file
carries the label and the anchored predecessor constant); two-state
phase topology over the thirty-four-path inventory; and byte
hygiene.

## 7. Stop condition

This milestone stops LOCAL-ONLY on its branch for Codex review. Not
pushed, not promoted, not tagged, not merged, not deployed; no
hosted contact; no import run, approval, seal, revocation,
publication, or projection act; no runtime, API, UI, dependency, or
configuration change. The hosted ShredOS project remains exactly as
the promoted EXLIB-2R evidence left it, and the live product's seed
behavior is UNCHANGED anywhere this branch is not deployed. NO
PRODUCT DELIVERY IS CLAIMED anywhere in this milestone.
