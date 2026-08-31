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
| workout_sets | 003 + 011 | weight_kg/reps/rpe/completed/is_warmup plus duration_seconds/distance_meters (011). Bodyweight sets store reps; timed sets store duration_seconds. The two are DIFFERENT COLUMNS with different completion semantics. workout_sets.workout_exercise_id is NOT NULL and references workout_exercises(id) ON DELETE CASCADE, so zero workout_exercises rows for an exercise structurally implies zero workout_sets rows — set history cannot exist without a parent reference. |
| workout_routines/workout_routine_exercises | 004 | FK exercise_id ON DELETE RESTRICT (the exact table name is workout_routine_exercises) — routine references block deletion and encode rep-based intent for a bodyweight row. |
| exercise_muscles | 018 | Seeded secondary/tertiary rows; part of the pristine seed state, not user customization. |
| catalog tables + claim triggers + delivery machinery | 023 | exercise_catalog/_logical with one-active-per-name and one-active-per-logical unique indexes; fail-closed claim machinery; AND a complete, already-implemented tenant delivery contract — deliver_catalog_exercises(p_run_key TEXT), rollback_catalog_delivery(p_run_key TEXT), exlib_revoke_run_delivery(p_run_key TEXT), exlib_approve_and_seal_run(p_run_key TEXT), and the exercises_delivered_delete_gate_trigger — detailed in section 3c below. An earlier draft of this record wrongly said no delivery function existed; that statement was false and is withdrawn. |
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

Direct exercise-id dependency closure: mechanically scanning every
migration for REFERENCES exercises yields exactly four foreign-key
referencers — workout_exercises (003, RESTRICT),
workout_routine_exercises (004, RESTRICT), exercise_muscles (018,
CASCADE), and exercise_aliases (023, composite (user_id, id),
CASCADE) — plus one non-FK reference, exercise_name_claims
.exercise_id, whose state is validated by the claim-holder equality
precondition rather than a separate count. The P2 predicate covers
all of them; any future table referencing exercises.id must be added
to the predicate or explicitly closed before implementation.

### 3c. Existing delivery contract (migration 023, mechanically extracted)

Migration 023 ALREADY IMPLEMENTS tenant catalog delivery. Extracted
from the committed SQL, not assumed:

- deliver_catalog_exercises(p_run_key TEXT) RETURNS JSONB — SECURITY
  DEFINER with SET search_path = public, pg_temp; scopes every row to
  the authenticated caller via auth.uid(); serializes the whole call
  on the per-user advisory lock
  pg_advisory_xact_lock(hashtextextended(v_uid::text, 8231)); refuses
  any run that is not sealed, approved, and unrevoked
  (approved_for_delivery = true AND sealed_at IS NOT NULL AND
  revoked_at IS NULL raises an exception otherwise); skips identities
  the tenant already holds via the (user_id, catalog_logical_id)
  idempotency lookup (skipped_existing); pre-checks the canonical
  name against exercise_name_claims and skips fail-closed on
  collision (skipped_collision plus a collision-names array);
  inserts v_cat.canonical_name with the catalog metadata, derived
  exercise_type, is_active=true, is_system=true, and full provenance
  (catalog_id, catalog_logical_id, import_run_id); copies the
  catalog anatomy from exercise_catalog_muscles; converts a raced
  unique violation on exercises_user_name_unique_idx or
  exercise_name_claims_pkey into the same honest collision skip; and
  delivers aliases in a second phase that resolves its target
  exercise INDEPENDENTLY through the logical identity (serving both
  this call's inserts and earlier runs' deliveries), with
  (user_id, catalog_alias_id) idempotency, an inactive-target block,
  and separate reported counters. The JSONB report's existing key
  set, mechanically extracted, is exactly: run_key, eligible,
  inserted, skipped_already_delivered, skipped_name_collision,
  collision_names, alias_inserted, alias_added_to_existing,
  alias_already_delivered, alias_skipped_no_exercise,
  alias_skipped_inactive_exercise, alias_skipped_collision,
  inserted_catalog_logical_ids.
- rollback_catalog_delivery(p_run_key TEXT) RETURNS JSONB — same
  authentication and advisory lock; DEACTIVATES (is_active = false,
  never deletes) this run's delivered exercises and aliases by
  import_run_id provenance, deactivates dependent aliases with
  separate reporting, and reports found/newly_deactivated/
  already_inactive per category.
- exlib_revoke_run_delivery(p_run_key TEXT) — halts all future
  delivery of a run; exlib_approve_and_seal_run(p_run_key TEXT) —
  the delivery gate's other half.
- exercises_delivered_delete_gate_trigger
  (exlib_block_delivered_exercise_delete) — physically blocks DELETE
  of ANY row carrying catalog_id, catalog_logical_id, or
  import_run_id.

Current limitation relevant to Plank (also mechanically verified):
the function inserts v_cat.canonical_name ONLY. When canonical
'plank' is already claimed by the tenant's legacy row, delivery of
the Plank identity lands in skipped_collision — correct and
fail-closed, but it never attempts the deterministic 'Plank (timed)'
distinguished fallback and never performs the guarded P2 in-place
correction or anatomy synchronization. EXLIB-2D therefore requires a
NARROWLY REVIEWED EXTENSION of this existing contract — not a new
delivery system — integrated with the existing run, claims,
provenance, locking, idempotency, alias, rollback, and reporting
machinery.

## 4. The chosen reconciliation contract (single recommendation)

Canonical: the catalog Plank stays timed. Existing history is never
reinterpreted. The contract handles every population
deterministically; the machine-readable version every implementation
must satisfy is in docs/exlib2d-plank-reconciliation-matrix.md and is
reconciled check-by-check by scripts/verify-exlib2d.ts.

- P1 — future users, never seeded: per the promoted architecture
  (section 9), full-catalog delivery replaces bare-15 seeding at
  first authenticated use once delivery is proven end-to-end, so
  future users receive the timed catalog Plank through delivery
  itself. The SEED_EXERCISES Plank entry (tracking_mode AND anatomy,
  to the catalog values) is corrected in the SAME atomic release,
  purely as compatibility/fallback cleanup for any window where the
  seed function still runs. Prohibited intermediate states: a
  release that creates an unlinked timed seed row, or one where new
  users still receive a bodyweight Plank after catalog delivery is
  active. This phase does not touch the seed module.
- P2 — pristine, unused seed row: a narrowly proven in-place
  correction IS permitted. Nine preconditions, all re-verified
  inside the transaction under SELECT ... FOR UPDATE: (1) zero
  workout_exercises rows referencing the row — which structurally
  implies zero workout_sets rows, because
  workout_sets.workout_exercise_id is NOT NULL and references
  workout_exercises(id), so no set history can exist without a
  parent reference (proven, not assumed); (2) zero
  workout_routine_exercises rows; (3) the exercises row's scalar
  fields exactly equal the seed definition field by field
  (name='Plank', is_system=true, is_active=true, notes IS NULL,
  equipment='bodyweight', tracking_mode='bodyweight',
  exercise_type='bodyweight' — the live seed's derived value —
  category='isolation', primary_muscle='abs', unilateral=false);
  (4) catalog_id IS NULL; (5) catalog_logical_id IS NULL;
  (6) import_run_id IS NULL — a row carrying any catalog provenance
  is not an unreconciled seed row and must never be re-matched by
  this predicate; (7) zero exercise_aliases rows attached to the
  candidate exercise, regardless of active state or provenance —
  aliases are tenant-authored identity state, so their presence
  makes the row nonpristine even when the base row and anatomy
  still match the seed; (8) the row's exercise_muscles multiset
  exactly equals the expected live seed anatomy
  {(obliques, secondary)} — exact multiset equality including
  roles, nothing missing, nothing additional; ANY anatomy
  difference classifies the row as customized and routes it to P5,
  never P2; and (9) the user's 'plank' claim is held by this exact
  row with claim_source='exercise'. Failure of ANY precondition
  routes the row to P5/customized-or-nonpristine handling; the row
  is never mutated.
  Action, all in one transaction: the transaction FIRST looks for
  an existing (user_id, catalog_logical_id) link, BEFORE evaluating
  the old bodyweight-seed predicate. If a link exists, it is locked
  with SELECT ... FOR UPDATE and verified as a complete valid
  reconciliation outcome before any no-op: tracking_mode='timed',
  exercise_type='mobility', catalog_id at the expected active
  approved snapshot, catalog_logical_id equal to the expected Plank
  logical identity, import_run_id equal to the expected authorized
  run, anatomy multiset exactly equal to the expected catalog
  snapshot, tenant name either canonical 'Plank' with the correct
  claim held by this row or the deterministic distinguished
  'Plank (timed)' with its correct claim, ownership matching the
  calling tenant, and no duplicate linked identity (structurally
  backed by the unique index). Only a fully valid completed state
  may no-op; if ANY invariant differs, the transaction aborts
  fail-closed and reports an inconsistent prior reconciliation
  requiring separate investigation — never silently repairing,
  relinking, overwriting anatomy, renaming, or treating it as
  success. This verified idempotency applies identically to a
  corrected P2 row and to a separately delivered distinguished row.
  If no link exists: UPDATE tracking_mode='timed' +
  derived exercise_type='mobility'; atomically replace the
  seed-owned exercise_muscles rows with the exact active approved
  catalog snapshot — for Plank, {(obliques, secondary),
  (lower_back, tertiary)}: the expected present difference is that
  catalog lower_back/tertiary is absent from the live seed anatomy
  and is added here, so the linked row never disagrees with its
  catalog snapshot; then set the catalog link columns through the
  standard fail-closed machinery. Id and name are unchanged, so the
  claim never moves and no collision can occur. Any anatomy
  insert/delete/constraint failure rolls back the ENTIRE
  correction. Anatomy synchronization is permitted ONLY here in P2;
  P3-P6 rows are user/history-owned and are never synchronized.
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

Distinguished-name refresh semantics (this SPECIALIZES — not
contradicts — the promoted architecture's refresh rule that "name
updates go through the normalized-name claim check and are SKIPPED
(not forced) on collision, exactly like delivery"): the catalog
canonical name remains 'Plank'; 'Plank (timed)' is a deterministic
delivery-name override caused solely by the tenant's existing
'plank' claim, and it is re-derivable from the tenant row, its
logical identity, and live claim state — a delivered row whose
current name equals the distinguished variant of its logical
identity's canonical name is in the distinguished state — so no new
schema field is required. Metadata refresh updates compatible
catalog-controlled fields and anatomy on the delivered row while
PRESERVING the distinguished tenant name for as long as canonical
'plank' remains claimed by another row or alias; it never forces
'Plank', never fails the whole refresh solely because the canonical
name collides, and never oscillates between names. Freeing 'plank'
does not trigger any automatic rename: moving from 'Plank (timed)'
to 'Plank' remains an explicit user-initiated rename through the
existing claim machinery. Idempotent retries and refreshes
recognize the already-delivered logical identity via
catalog_logical_id regardless of its tenant display name.

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
UNIQUE (user_id, catalog_logical_id) index IS the idempotency key:
a repeat run finds the existing link (or the already-corrected P2
row), locks it, and validates the complete reconciliation state,
and it no-ops ONLY if every invariant passes; otherwise it fails
closed as an inconsistent prior reconciliation. Any failure
aborts the transaction, leaving prior state untouched and the
attempt retryable. All work is tenant-scoped under existing RLS.

User-visible behavior: existing users keep their Plank exactly as it
is, including all history; where a distinguished timed row is
delivered they see both, unambiguously labeled, and choose their own
migration pace. Future users (post-implementation) simply receive a
timed Plank.

Integration boundary (single entrypoint, chosen):
deliver_catalog_exercises(TEXT) remains the ONE public tenant
delivery entrypoint, with every migration-023 security, run,
rollback, and reporting semantic preserved. Migration 026 extends
its internal handling for the Plank logical identity (directly or
through a narrowly scoped internal helper invoked in the same
transaction); it must NOT create a second public tenant delivery
entrypoint with divergent authorization, locking, run validation,
reporting, or rollback behavior. The P2 correction and the
distinguished-name delivery both execute inside the same per-user
delivery transaction and the same advisory-lock domain
(hashtextextended(uid, 8231)) as ordinary catalog delivery.
For every non-Plank identity, authorization, selection, mutation,
collision, idempotency, alias, provenance, and rollback semantics
remain unchanged. Report compatibility is additive-only: every
existing migration-023 deliver_catalog_exercises JSONB key retains
its existing name, type, and meaning; the EXLIB-2D reporting
extensions are additive only; no existing key may be removed,
renamed, repurposed, or type-changed; and the Plank-specific
fallback must not affect selection or mutation behavior for any
other logical identity. Repository consumers were mechanically
scanned: no application code calls deliver_catalog_exercises or
rollback_catalog_delivery today — the only repository references
are frozen verification suites pinning the migration SQL text, and
the function is granted to authenticated for future RPC use, so the
additive rule protects future callers rather than fixing existing
ones. The distinguished fallback is keyed to the Plank logical
identity specifically — it must never generalize into an arbitrary
renaming scheme. Alias delivery already resolves its
target through catalog_logical_id independently of the tenant
display name, so aliases attach to the corrected or distinguished
row without modification. Delivery reporting is extended to
distinguish at least: corrected-and-linked pristine seed; delivered
canonical timed Plank; delivered distinguished timed Plank; already
valid/idempotent; skipped canonical-and-distinguished collision;
inconsistent prior reconciliation; and precondition failure routed
to preserved-legacy plus distinguished delivery.

P2 rollback provenance (chosen, conservative): the P2 conversion is
a provenance/link correction on a PREEXISTING tenant row, not a
newly delivered row, and rollback must treat it that way. Because
delivered inserts also carry is_system=true (mechanically verified
in the 023 INSERT), no existing column distinguishes a corrected
preexisting row from a run-inserted row; migration 026 therefore
records each P2 correction in a dedicated correction record
(user_id, exercise_id, run_id, corrected_at) written in the same
transaction, and the generic rollback_catalog_delivery deactivation
sweep is extended to EXCLUDE correction-recorded rows — it may
never deactivate (and can already never delete) a preexisting seed
row as though the run inserted it. P2 is intentionally
NON-REVERSIBLE after successful commit: reverting the timed mode or
the synchronized anatomy could recreate the exact semantic risks
this contract exists to prevent, so no automatic restore path
exists; run revocation (exlib_revoke_run_delivery) halts future
delivery but never reinterprets existing P2 data. The corrected
row's import_run_id keeps it inside refresh and verified-idempotency
recognition and places it under the existing delivered-row delete
gate (physical deletion blocked — an intended strengthening), while
the correction record keeps it outside every rollback deactivation
query. Newly inserted timed rows (canonical or distinguished) keep
the EXISTING rollback behavior unchanged. No rollback path deletes
user history, aliases, routines, workouts, or a preexisting
exercise id: the committed rollback function only ever sets
is_active = false, and the delete gate independently blocks
physical deletion.

## 5. Implementation dependency map (later work, none authorized)

1. Migration 026 (NOT created here): a narrowly reviewed EXTENSION
   of deliver_catalog_exercises(TEXT) (or a same-transaction
   internal helper) implementing the P2 predicate, anatomy
   synchronization, verified idempotency, the Plank-specific
   distinguished fallback, the extended reporting dispositions, the
   P2 correction record, and the rollback-sweep exclusion — plus its
   disposable-local-DB proof suite covering malformed links,
   concurrency, and rollback/revocation against both corrected and
   inserted rows.
2. Seed module edit aligning the Plank entry's tracking_mode AND
   anatomy to the catalog values, shipped in the SAME atomic release
   as (1) as compatibility/fallback cleanup — per the promoted
   architecture (section 9), full-catalog delivery replaces bare-15
   seeding for future accounts once proven, so the edit only covers
   any window where the seed function still runs. No intermediate
   release may create an unlinked timed seed row or leave new users
   receiving a bodyweight Plank after delivery is active.
3. Plank instructional content authoring (separate, after this
   contract is approved), then the standard review lifecycle.
4. Inventory update marking Plank seed_link_compatible — a GLOBAL
   promoted-artifact fact, never a per-user outcome: it may become
   true only in the coordinated implementation state where the
   committed future seed definition (tracking_mode AND anatomy) and
   the delivery contract are compatible. Not made here.
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
