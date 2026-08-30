# EXLIB-2D — Plank reconciliation population matrix

Machine-readable contract summary reconciled by scripts/verify-exlib2d.ts.
PLANNING ONLY: nothing here is implemented, loaded, approved, or applied.

```json
{
 "phase": "EXLIB-2D",
 "scope": "planning_and_product_definition_only",
 "mismatch": {
  "seed": {
   "file": "src/lib/supabase/seed-exercises.ts",
   "equipment": "bodyweight",
   "tracking_mode": "bodyweight"
  },
  "catalog": {
   "source": "docs/exlib2b-release1-inventory.jsonl",
   "equipment": "bodyweight",
   "tracking_mode": "timed",
   "seed_link_compatible": false
  }
 },
 "canonical_tracking_mode": "timed",
 "populations": {
  "P1_future_never_seeded": {
   "outcome": "seed_definition_corrected_to_timed_only_in_coordinated_implementation",
   "detail": "No seed edit in this phase. The SEED_EXERCISES Plank entry flips to timed in the SAME later implementation release that ships catalog delivery/linking for Plank, so a new user never receives a bodyweight Plank that immediately needs reconciliation. Until that release, seeding is unchanged."
  },
  "P2_pristine_unused_seed_row": {
   "outcome": "narrow_proven_in_place_correction_and_catalog_link",
   "preconditions": [
    "zero workout_exercises rows referencing the row",
    "zero routine_exercises rows referencing the row",
    "row field-tuple byte-matches the seed definition: name='Plank', is_system=true, is_active=true, notes IS NULL, equipment='bodyweight', tracking_mode='bodyweight', category='isolation', primary_muscle='abs', unilateral=false",
    "the user's 'plank' name claim is held by this exact row with claim_source='exercise'"
   ],
   "action": "single transaction: SELECT ... FOR UPDATE on the row; re-verify preconditions under lock; UPDATE tracking_mode='timed', exercise_type='mobility' (derived); set catalog_id/catalog_logical_id/import_run_id via the standard fail-closed claim machinery; name and id unchanged so the 'plank' claim is untouched",
   "history_risk": "none - preconditions prove zero historical or planned sets exist"
  },
  "P3_referenced_no_completed_sets": {
   "outcome": "preserve_legacy_row_unchanged_deliver_timed_identity_collision_safe",
   "detail": "A routine or open workout referencing the row encodes rep-based intent; flipping the mode would silently change what the set-entry UI collects. The row, its id, mode, and references are preserved."
  },
  "P4_completed_bodyweight_history": {
   "outcome": "preserve_legacy_row_and_history_unchanged_forever",
   "detail": "Progress/records are computed from sets at display time using the row's CURRENT tracking_mode (src/app/(app)/progress/exercises/[id]/page.tsx:122, src/lib/workout.ts setScore/bestSet vs representative-set), so a mode flip would silently reinterpret rep history under timed summaries. Never performed."
  },
  "P5_renamed_edited_archived_customized": {
   "outcome": "preserve_user_row_unchanged",
   "detail": "User intent owns the row. Claims survive deactivation by design (023: non-partial (user_id, lower(name)) unique index parity), so an archived legacy Plank still holds 'plank'."
  },
  "P6_existing_plank_name_collision": {
   "outcome": "preserve_all_existing_rows_deliver_under_distinguished_name_or_skip",
   "detail": "Whoever holds the 'plank' claim (exercise or alias) keeps it. Delivery never assumes the claim."
  }
 },
 "claims_and_collision_design": {
  "model_change_required": false,
  "rule": "The delivered timed row claims 'plank' only in P2 (same row, claim untouched) or when the user's 'plank' claim is free. Otherwise the delivered row uses the catalog-controlled distinguished tenant name 'Plank (timed)' (normalized 'plank (timed)') recorded as delivery metadata; the catalog canonical name is unchanged. If 'plank (timed)' is ALSO claimed, delivery of this identity is skipped fail-closed for that user and remains retryable. No unbounded suffix search. No silent rename of any user row ever; a later user-initiated rename of the delivered row to 'Plank' goes through the existing rename path once the user has freed the name themselves."
 },
 "transaction_and_idempotency": {
  "unit": "one per-user transaction per delivery/correction attempt",
  "lock": "SELECT ... FOR UPDATE on the candidate exercises row (P2) plus the existing claim-trigger serialization; delivery inserts rely on exercise_name_claims PK and exercises_user_catalog_logical unique index for race-freedom",
  "idempotency_key": "the UNIQUE (user_id, catalog_logical_id) index on exercises IS the idempotency key: a repeat run finds the link (or the P2 row already timed+linked) and no-ops",
  "rollback": "any precondition or constraint failure aborts the transaction; prior state is untouched; the attempt is retryable"
 },
 "guarantees": {
  "no_silent_history_reinterpretation": true,
  "no_bodyweight_data_rewritten_as_duration": true,
  "no_automatic_merge_across_tracking_modes": true,
  "no_duplicate_normalized_claim": true,
  "no_delivery_bypass_of_claim_machinery": true,
  "no_silent_rename": true,
  "no_auto_delete_or_auto_archive": true,
  "stable_ids_preserved": true,
  "tenant_safe_rls_preserved": true,
  "idempotent_and_retry_safe": true,
  "rollback_defined": true,
  "future_users_receive_timed_plank_after_coordinated_implementation": true,
  "legacy_retirement_is_user_initiated_only": true
 },
 "not_authorized_here": [
  "seed module edit",
  "Plank content authoring",
  "migration 026",
  "schema/API/UI implementation",
  "catalog loading or publication",
  "eligibility change",
  "ledger mutation",
  "hosted contact",
  "marking Plank seed_link_compatible in the inventory"
 ]
}
```
