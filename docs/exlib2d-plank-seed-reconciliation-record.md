# EXLIB-2D — Plank seed-reconciliation design record

Prepared 2026-08-30. PLANNING AND PRODUCT DEFINITION ONLY. This
record designs the reconciliation; it implements nothing, edits no
seed code, authors no Plank content, creates no migration, loads no
catalog data, and contacts no hosted service. Every authorization
boundary in force before this phase remains in force after it.

## 1. Source state and fingerprints

- main = origin/main = cdba699ab68ba9cee2fd9331962b8b2060099862
  (tag exlib2c-release1-batch06-authored-pending-review, tag object
  a0ec86cd3986911a8e0e0a8b35d5d4920078c84c, peels to main).
- Ordinary release-1 authoring complete: 126/126 records across
  Batches 1-6, all pending with null review evidence,
  import_eligible false, unpublished.
- Plank is the sole remaining non-deferred release-1 identity; the
  eight weight_time entries remain deferred.

## 2. The exact mismatch

- Live seed (src/lib/supabase/seed-exercises.ts, Plank row):
  equipment=bodyweight, tracking_mode="bodyweight" — reps are the
  logged and scored metric.
- Promoted catalog identity (docs/exlib2b-release1-inventory.jsonl):
  equipment=bodyweight, tracking_mode="timed",
  seed_link_compatible=false — duration is the logged metric.
- The catalog Plank KEEPS tracking_mode=timed. Repository evidence
  (below) shows no contradiction forcing bodyweight; a plank is a
  hold, the timed model is the correct product definition, and the
  authoring schema derives exercise_type "mobility" from it, exactly
  matching migration 010's exercise_type->tracking_mode backfill map
  (mobility <-> timed).

## 3. Repository evidence (mechanical inventory)

Tables that reference an exercise id or interpret tracking_mode:

| Surface | Location | Consequence for reconciliation |
|---|---|---|
| exercises | 003 (table), 010 (tracking_mode NOT NULL + CHECK + DEFAULT), 018 (exercise_muscles), 023 (catalog_id, catalog_logical_id, import_run_id + UNIQUE (user_id, catalog_logical_id)) | Per-user rows; non-partial UNIQUE (user_id, lower(name)) from 003 means even an INACTIVE row blocks its name. |
| exercise_name_claims | 023 | PK (user_id, normalized_name): exactly ONE claim per normalized name per user. Exercise claims mirror the non-partial unique index and SURVIVE DEACTIVATION by design; they release only on rename or row delete (exlib_claim_exercise_name trigger). Alias claims are active-only. |
| workout_exercises | 003 | FK exercise_id ON DELETE RESTRICT — any workout reference blocks deletion. |
| workout_sets | 003 + 011 | weight_kg/reps/rpe/completed/is_warmup plus duration_seconds/distance_meters (011). Bodyweight sets store reps; timed sets store duration_seconds. The two are DIFFERENT COLUMNS with different completion semantics. |
| routines/routine_exercises | 004 | FK exercise_id ON DELETE RESTRICT — routine references block deletion and encode rep-based intent for a bodyweight row. |
| exercise_muscles | 018 | Seeded secondary/tertiary rows; part of the pristine seed state, not user customization. |
| catalog tables + claim triggers | 023 | exercise_catalog/_logical with one-active-per-name and one-active-per-logical unique indexes; fail-closed claim machinery; delivery columns exist but NO delivery function is implemented yet (EXLIB-2A design is planning-only). |
| RLS | 003/023 | All per-user; catalog claim functions are SECURITY DEFINER with pinned search_path. Reconciliation work stays inside one tenant's rows. |

Code paths that interpret tracking_mode:

- src/lib/exercise-validation.ts — TRACKING_MODES,
  deriveLegacyExerciseType (timed -> mobility); POST requires
  tracking_mode; PATCH accepts tracking_mode (it IS user-mutable
  today) and refreshes the legacy exercise_type.
- src/lib/supabase/seed-exercises.ts — seedExercisesIfNeeded runs on
  first /workouts visit, is idempotent by a count>0 guard (ANY
  exercise present skips seeding entirely), inserts is_system=true
  rows, and bypasses caller validation by deriving exercise_type
  directly.
- src/lib/workout.ts — setScore/bestSet score bodyweight sets by
  REPS; the tracking-aware representative-set selection scores timed
  sets by LONGEST duration_seconds. These are disjoint metrics.
- src/app/(app)/progress/exercises/[id]/page.tsx — reads the row's
  CURRENT tracking_mode at display time and chooses the summary
  model with it. There is NO records table: records/progress are
  recomputed from sets on every view.

Decisive consequence: because progress and records are computed from
sets using the row's CURRENT tracking_mode, an in-place mode flip on
a row that has ANY logged sets silently reinterprets that history
(rep-based sets vanish from timed summaries, which read
duration_seconds). An in-place change is therefore safe ONLY when
provably no sets and no planned references exist. The API already
permitting PATCH of tracking_mode does not make it safe for seeded
history; it only proves the column is mutable.

## 4. The chosen reconciliation contract (single recommendation)

Canonical: the catalog Plank stays timed. Existing history is never
reinterpreted. The contract handles every population
deterministically; the machine-readable version every implementation
must satisfy is in docs/exlib2d-plank-reconciliation-matrix.md and is
reconciled check-by-check by scripts/verify-exlib2d.ts.

- P1 — future users, never seeded: the SEED_EXERCISES Plank entry is
  corrected to timed ONLY in the coordinated later implementation
  release (together with Plank catalog delivery/linking), never
  before, so no partially-reconciled state ever ships. This phase
  does not touch the seed module.
- P2 — pristine, unused seed row: a narrowly proven in-place
  correction IS permitted. Preconditions, all re-verified inside the
  transaction under SELECT ... FOR UPDATE: zero workout_exercises
  rows, zero routine_exercises rows, the row's field tuple
  byte-matches the seed definition (name='Plank', is_system=true,
  is_active=true, notes IS NULL, equipment='bodyweight',
  tracking_mode='bodyweight', category='isolation',
  primary_muscle='abs', unilateral=false), and the user's 'plank'
  claim is held by this exact row with claim_source='exercise'.
  Action: UPDATE tracking_mode='timed' + derived
  exercise_type='mobility', then set the catalog link columns
  through the standard fail-closed machinery. Id and name are
  unchanged, so the claim never moves and no collision can occur.
  With zero sets and zero references there is no history to
  reinterpret. If ANY precondition fails, this subcase is abandoned
  for that user and the P3-P6 path applies — never a forced fallback
  mutation.
- P3 — referenced but no completed sets: preserve the row unchanged.
  A routine or open workout referencing it encodes rep-based intent;
  flipping the mode would silently change what the set-entry UI
  collects mid-plan. Delivery follows the collision-safe path below.
- P4 — completed bodyweight history: preserve the row and its
  history unchanged, permanently. No rewrite of reps into duration,
  no display-model flip, no merge.
- P5 — renamed/edited/archived/customized rows: preserve unchanged.
  User intent owns the row; claims survive archival by the promoted
  023 doctrine, and this design does not alter that.
- P6 — any other 'plank' normalized-name claim (exercise or alias):
  preserve; delivery never assumes the claim.

Claims and collision handling (no model change required): the
current claim model represents both rows safely because they carry
DIFFERENT normalized names. When 'plank' is free (or the P2 same-row
correction applies), the timed identity carries the canonical name.
Otherwise the delivered row uses the catalog-controlled,
collision-distinguished tenant display name 'Plank (timed)'
(normalized 'plank (timed)'), recorded as delivery metadata against
the import run; the catalog canonical name itself never changes, and
no user row is ever renamed by the system. If 'plank (timed)' is
ALSO claimed, delivery of this identity is skipped fail-closed for
that user and remains retryable — a deterministic single fallback,
never an unbounded suffix search. A user who later frees 'plank'
themselves may rename the delivered row through the EXISTING rename
path, whose claim trigger already releases and re-claims atomically.

Retirement of the legacy row is user-initiated only: archive through
the existing is_active=false path (name claim intentionally
persists), or delete through the existing delete path, which the
RESTRICT foreign keys already block while any workout or routine
references exist. Nothing is ever auto-deleted, auto-archived, or
auto-renamed. A future product affordance may guide manual routine
re-pointing before retirement; it is out of scope here and never
automatic.

Transactionality, idempotency, rollback: one per-user transaction
per attempt; the P2 path locks the candidate row with
SELECT ... FOR UPDATE and re-verifies every precondition under the
lock; inserts rely on the exercise_name_claims primary key and the
UNIQUE (user_id, catalog_logical_id) index for race-freedom; the
UNIQUE (user_id, catalog_logical_id) index IS the idempotency key: a
repeat run finds the existing
link (or the already-corrected P2 row) and no-ops. Any failure
aborts the transaction, leaving prior state untouched and the
attempt retryable. All work is tenant-scoped under existing RLS.

User-visible behavior: existing users keep their Plank exactly as it
is, including all history; where a distinguished timed row is
delivered they see both, unambiguously labeled, and choose their own
migration pace. Future users (post-implementation) simply receive a
timed Plank.

## 5. Implementation dependency map (later work, none authorized)

1. Migration 026 (NOT created here): delivery/correction routine as
   guarded SQL (or an equivalent server-side function) implementing
   P2 preconditions, the collision-naming rule, and the idempotent
   link — plus its disposable-local-DB proof suite.
2. Seed module edit flipping the Plank entry to timed, shipped in
   the SAME release as (1).
3. Plank instructional content authoring (separate, after this
   contract is approved), then the standard review lifecycle.
4. Inventory update marking Plank seed_link_compatible where the P2
   path applies — an implementation-state change, not made here.
5. API/UI: none required by the contract itself beyond existing
   surfaces; the optional retirement affordance is future product
   work. Tests: population-matrix fixtures P1-P6 against a
   disposable local cluster.

## 6. Explicit nonauthorization boundaries

This record approves NOTHING. It does not authorize seed edits,
Plank content, migration 026, schema/API/UI changes, catalog
loading, publication, import eligibility, specialist approval,
ledger mutation, or hosted contact. Every record in Batches 1-6
remains pending with null review evidence and import_eligible false.
