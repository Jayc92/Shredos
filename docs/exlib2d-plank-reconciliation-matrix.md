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
   "tracking_mode": "bodyweight",
   "anatomy": [
    [
     "obliques",
     "secondary"
    ]
   ]
  },
  "catalog": {
   "source": "docs/exlib2b-release1-inventory.jsonl",
   "equipment": "bodyweight",
   "tracking_mode": "timed",
   "seed_link_compatible": false,
   "anatomy": [
    [
     "obliques",
     "secondary"
    ],
    [
     "lower_back",
     "tertiary"
    ]
   ]
  }
 },
 "canonical_tracking_mode": "timed",
 "anatomy_delta": {
  "shared": [
   [
    "obliques",
    "secondary"
   ]
  ],
  "catalog_only": [
   [
    "lower_back",
    "tertiary"
   ]
  ],
  "seed_only": []
 },
 "populations": {
  "P1_future_never_seeded": {
   "outcome": "catalog_delivery_replaces_seeding_seed_edit_is_fallback_cleanup_in_same_atomic_release",
   "detail": "Per the promoted architecture (section 9), future signup replaces bare-15 seeding with full-catalog delivery at first authenticated use, only after delivery is proven end-to-end. The SEED_EXERCISES Plank entry (tracking_mode AND anatomy) is corrected to match the catalog in the SAME atomic release as that implementation, purely as compatibility/fallback cleanup for any window where the seed function still runs. Prohibited intermediate states: a release that creates an unlinked timed seed row, or one where new users still receive a bodyweight Plank after catalog delivery is active."
  },
  "P2_pristine_unused_seed_row": {
   "outcome": "narrow_proven_in_place_correction_with_anatomy_synchronization_and_catalog_link",
   "preconditions": [
    "zero workout_exercises rows referencing the row - which structurally implies zero workout_sets rows because workout_sets.workout_exercise_id is NOT NULL and references workout_exercises(id) ON DELETE CASCADE, so no set can exist without a parent workout_exercises row",
    "zero routine_exercises rows referencing the row",
    "the exercises row's scalar fields exactly equal the seed definition field by field: name='Plank', is_system=true, is_active=true, notes IS NULL, equipment='bodyweight', tracking_mode='bodyweight', category='isolation', primary_muscle='abs', unilateral=false",
    "the row's exercise_muscles multiset exactly equals the expected live seed anatomy {(obliques, secondary)} - exact multiset equality including roles, nothing missing, nothing additional; ANY difference classifies the row as customized and routes it to P5, never P2",
    "the user's 'plank' name claim is held by this exact row with claim_source='exercise'"
   ],
   "action": "single transaction: no-op link check FIRST (see retry_ordering); SELECT ... FOR UPDATE on the row; re-verify EVERY precondition under the lock; UPDATE tracking_mode='timed', exercise_type='mobility' (derived); atomically replace the seed-owned exercise_muscles rows with the exact active approved catalog snapshot {(obliques, secondary), (lower_back, tertiary)}; then set catalog_id/catalog_logical_id/import_run_id via the standard fail-closed claim machinery; tenant id and name unchanged",
   "anatomy_synchronization": {
    "target": [
     [
      "obliques",
      "secondary"
     ],
     [
      "lower_back",
      "tertiary"
     ]
    ],
    "expected_present_difference": "catalog lower_back/tertiary is absent from the live seed anatomy and is added by the synchronization",
    "rollback": "any anatomy insert/delete/constraint failure rolls back the ENTIRE correction transaction - all or nothing",
    "permitted_populations": [
     "P2_pristine_unused_seed_row"
    ],
    "forbidden_populations": [
     "P3_referenced_no_completed_sets",
     "P4_completed_bodyweight_history",
     "P5_renamed_edited_archived_customized",
     "P6_existing_plank_name_collision"
    ]
   },
   "history_risk": "none - the preconditions prove structurally that zero historical or planned sets exist"
  },
  "P3_referenced_no_completed_sets": {
   "outcome": "preserve_legacy_row_unchanged_deliver_timed_identity_collision_safe",
   "detail": "A routine or open workout referencing the row encodes rep-based intent; flipping the mode would silently change what the set-entry UI collects. The row, its id, mode, anatomy, and references are preserved; no anatomy synchronization is ever performed on it."
  },
  "P4_completed_bodyweight_history": {
   "outcome": "preserve_legacy_row_and_history_unchanged_forever",
   "detail": "Progress/records are computed from sets at display time using the row's CURRENT tracking_mode, so a mode flip would silently reinterpret rep history under timed summaries. Never performed; no anatomy synchronization either."
  },
  "P5_renamed_edited_archived_customized": {
   "outcome": "preserve_user_row_unchanged",
   "detail": "User intent owns the row, INCLUDING any anatomy customization: an exercise_muscles multiset differing in any way from the expected seed anatomy routes the row here. Claims survive deactivation by design; no anatomy synchronization is ever performed on it."
  },
  "P6_existing_plank_name_collision": {
   "outcome": "preserve_all_existing_rows_deliver_under_distinguished_name_or_skip",
   "detail": "Whoever holds the 'plank' claim (exercise or alias) keeps it. Delivery never assumes the claim; no anatomy synchronization on any existing row."
  }
 },
 "claims_and_collision_design": {
  "model_change_required": false,
  "model_change_justification": "the distinguished-name state is deterministically re-derivable from the tenant row, its logical identity, and live claim state (a delivered row whose current name equals the distinguished variant of its logical identity's canonical name is in the distinguished state), so no schema field is needed",
  "rule": "The delivered timed row claims 'plank' only in P2 (same row, claim untouched) or when the user's 'plank' claim is free. Otherwise the delivered row uses the catalog-controlled distinguished tenant name 'Plank (timed)' (normalized 'plank (timed)') recorded as delivery metadata; the catalog canonical name is unchanged. If 'plank (timed)' is ALSO claimed, delivery of this identity is skipped fail-closed for that user and remains retryable. No unbounded suffix search. No silent rename of any user row ever; a later user-initiated rename of the delivered row to 'Plank' goes through the existing rename path once the user has freed the name themselves.",
  "refresh_semantics": {
   "specializes": "the promoted architecture refresh rule - name updates go through the normalized-name claim check and are SKIPPED (not forced) on collision, exactly like delivery; this contract specializes, not contradicts, that rule",
   "preserve_distinguished_name": "refresh updates compatible catalog-controlled metadata and anatomy on the delivered row while PRESERVING the distinguished tenant name for as long as canonical 'plank' remains claimed by another row or alias",
   "never_force_canonical": true,
   "name_collision_never_fails_whole_refresh": true,
   "no_oscillation": "a distinguished-state row never auto-renames to canonical and a canonical-named row already holds its claim, so names never oscillate",
   "no_automatic_rename_when_canonical_freed": "freeing 'plank' does NOT silently rename the delivered row; moving from 'Plank (timed)' to 'Plank' remains an explicit user-initiated rename through the existing claim machinery",
   "idempotent_recognition": "retries and refreshes recognize the already-delivered logical identity via catalog_logical_id regardless of its tenant display name"
  }
 },
 "transaction_and_idempotency": {
  "unit": "one per-user transaction per delivery/correction attempt",
  "retry_ordering": "a retry FIRST checks UNIQUE (user_id, catalog_logical_id) and no-ops if the logical identity is already linked, BEFORE evaluating the old bodyweight-seed predicate - an already-linked (timed, synchronized) row is never re-matched against the bodyweight predicate and never mutated again",
  "lock": "SELECT ... FOR UPDATE on the candidate exercises row (P2) plus the existing claim-trigger serialization; delivery inserts rely on exercise_name_claims PK and the exercises UNIQUE (user_id, catalog_logical_id) index for race-freedom",
  "idempotency_key": "the UNIQUE (user_id, catalog_logical_id) index on exercises IS the idempotency key: a repeat run finds the link (or the P2 row already timed+linked) and no-ops",
  "rollback": "any precondition, anatomy, or constraint failure aborts the transaction; prior state is untouched; the attempt is retryable"
 },
 "seed_link_compatible_transition": "seed_link_compatible is a GLOBAL promoted-inventory artifact fact, never a per-user outcome: it may become true only in the later coordinated implementation state where the committed future seed definition (tracking_mode AND anatomy) and the delivery contract are compatible; no per-user P2 result changes it",
 "future_signup_sequencing": "full-catalog delivery replaces bare-15 seeding at first authenticated use per the promoted architecture section 9, only after delivery is proven; the seed-module Plank edit (tracking_mode AND anatomy to catalog values) is compatibility/fallback cleanup shipped in the SAME atomic release; prohibited intermediate states: an unlinked timed seed row, or new users receiving a bodyweight Plank after catalog delivery is active",
 "guarantees": {
  "no_silent_history_reinterpretation": true,
  "no_bodyweight_data_rewritten_as_duration": true,
  "no_automatic_merge_across_tracking_modes": true,
  "no_duplicate_normalized_claim": true,
  "no_delivery_bypass_of_claim_machinery": true,
  "no_silent_rename": true,
  "no_automatic_rename_when_canonical_freed": true,
  "no_auto_delete_or_auto_archive": true,
  "stable_ids_preserved": true,
  "tenant_safe_rls_preserved": true,
  "idempotent_and_retry_safe": true,
  "rollback_defined": true,
  "anatomy_synchronized_only_in_P2": true,
  "zero_workout_references_structurally_imply_zero_sets": true,
  "linked_rows_never_disagree_with_catalog_anatomy": true,
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
