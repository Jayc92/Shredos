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
 "exercise_id_dependency_inventory": {
  "fk_references": [
   {
    "table": "workout_exercises",
    "migration": "003",
    "on_delete": "RESTRICT",
    "predicate_role": "must be zero for P2; structurally implies zero workout_sets"
   },
   {
    "table": "workout_routine_exercises",
    "migration": "004",
    "on_delete": "RESTRICT",
    "predicate_role": "must be zero for P2"
   },
   {
    "table": "exercise_muscles",
    "migration": "018",
    "on_delete": "CASCADE",
    "predicate_role": "must exactly equal the expected seed anatomy multiset for P2"
   },
   {
    "table": "exercise_aliases",
    "migration": "023",
    "on_delete": "CASCADE (composite user_id,id)",
    "predicate_role": "must be zero rows for P2 regardless of active state or provenance"
   }
  ],
  "non_fk_references": [
   {
    "table": "exercise_name_claims",
    "column": "exercise_id",
    "closure": "covered by the claim-holder equality precondition: the user's 'plank' claim must be held by this exact row with claim_source='exercise', so claim state is validated rather than separately counted"
   }
  ],
  "scan_rule": "the set above is the complete result of mechanically scanning every migration for REFERENCES exercises; any future table referencing exercises.id must be added to the P2 predicate or explicitly closed here before implementation"
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
    "zero workout_routine_exercises rows referencing the row",
    "the exercises row's scalar fields exactly equal the seed definition field by field: name='Plank', is_system=true, is_active=true, notes IS NULL, equipment='bodyweight', tracking_mode='bodyweight', exercise_type='bodyweight' (the live seed's derived value), category='isolation', primary_muscle='abs', unilateral=false",
    "catalog_id IS NULL",
    "catalog_logical_id IS NULL",
    "import_run_id IS NULL",
    "zero exercise_aliases rows attached to the candidate exercise, regardless of active state or provenance - aliases are tenant-authored identity state, so their presence makes the row nonpristine even when the base row and anatomy still match the seed",
    "the row's exercise_muscles multiset exactly equals the expected live seed anatomy {(obliques, secondary)} - exact multiset equality including roles, nothing missing, nothing additional; ANY difference classifies the row as customized and routes it to P5, never P2",
    "the user's 'plank' name claim is held by this exact row with claim_source='exercise'"
   ],
   "nonpristine_routing": "failure of ANY precondition routes the row to P5/customized-or-nonpristine handling; the row is never mutated",
   "action": "single transaction: verified-idempotency lookup FIRST (see verified_idempotency); if no link exists, SELECT ... FOR UPDATE on the candidate row; re-verify EVERY precondition under the lock; UPDATE tracking_mode='timed', exercise_type='mobility' (derived); atomically replace the seed-owned exercise_muscles rows with the exact active approved catalog snapshot {(obliques, secondary), (lower_back, tertiary)}; then set catalog_id/catalog_logical_id/import_run_id via the standard fail-closed claim machinery; tenant id and name unchanged",
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
   "detail": "User intent owns the row, INCLUDING any anatomy customization or attached alias: an exercise_muscles multiset differing in any way from the expected seed anatomy, or any exercise_aliases row regardless of state, routes the row here. Claims survive deactivation by design; no anatomy synchronization is ever performed on it."
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
  "verified_idempotency": {
   "lookup": "the transaction FIRST looks for an exercises row with (user_id, catalog_logical_id) = (caller, Plank logical identity), BEFORE evaluating the old bodyweight-seed predicate",
   "if_absent": "continue to P2 or distinguished-delivery classification",
   "if_present": "lock the linked row with SELECT ... FOR UPDATE and validate the complete reconciliation outcome before any no-op",
   "invariants": [
    "tracking_mode='timed'",
    "exercise_type='mobility'",
    "catalog_id points to the expected active approved catalog snapshot version",
    "catalog_logical_id equals the expected Plank logical identity",
    "import_run_id equals the expected authorized run",
    "exercise_muscles multiset exactly equals the expected catalog snapshot {(obliques, secondary), (lower_back, tertiary)}",
    "tenant name is either canonical 'Plank' with the correct 'plank' claim held by this row, or the deterministic distinguished 'Plank (timed)' with its correct 'plank (timed)' claim held by this row",
    "user_id ownership matches the calling tenant",
    "no duplicate linked identity exists - structurally backed by the UNIQUE (user_id, catalog_logical_id) index"
   ],
   "on_valid": "only a fully valid completed state may no-op",
   "on_invalid": "abort fail-closed and report an inconsistent prior reconciliation requiring separate investigation. Never silently repair, relink, overwrite anatomy, rename, or treat it as success",
   "applies_to": [
    "corrected P2 row",
    "separately delivered distinguished row"
   ]
  },
  "lock": "SELECT ... FOR UPDATE on the candidate exercises row (P2) or the linked row (verified idempotency) plus the existing claim-trigger serialization; delivery inserts rely on exercise_name_claims PK and the exercises UNIQUE (user_id, catalog_logical_id) index for race-freedom",
  "idempotency_key": "the UNIQUE (user_id, catalog_logical_id) index on exercises IS the idempotency key, and a found link no-ops ONLY after full invariant validation",
  "rollback": "any precondition, anatomy, invariant, or constraint failure aborts the transaction; prior state is untouched; a precondition/constraint failure is retryable while an invariant failure on an existing link is an inconsistent-state report, not a retry loop"
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
  "alias_presence_is_nonpristine": true,
  "existing_link_no_op_only_after_full_validation": true,
  "malformed_links_abort_fail_closed": true,
  "future_users_receive_timed_plank_after_coordinated_implementation": true,
  "legacy_retirement_is_user_initiated_only": true,
  "single_public_delivery_entrypoint": true,
  "p2_rows_excluded_from_generic_rollback_deactivation": true,
  "run_revocation_never_reinterprets_existing_data": true,
  "rollback_deactivates_only_never_deletes": true
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
 ],
 "existing_delivery_contract": {
  "source": "supabase/migrations/023_exlib_catalog_and_delivery_contract.sql (mechanically extracted)",
  "entrypoint": "deliver_catalog_exercises(p_run_key TEXT) RETURNS JSONB",
  "security": "SECURITY DEFINER, SET search_path = public, pg_temp, auth.uid() tenant scoping",
  "lock": "pg_advisory_xact_lock(hashtextextended(v_uid::text, 8231)) per-user advisory lock",
  "run_gating": "approved_for_delivery = true AND sealed_at IS NOT NULL AND revoked_at IS NULL, else exception",
  "idempotency": "(user_id, catalog_logical_id) existing-row skip (skipped_existing)",
  "canonical_name_behavior": "pre-checks exercise_name_claims and inserts v_cat.canonical_name; collision skips fail-closed (skipped_collision + collision-names array); raced unique violations on exercises_user_name_unique_idx / exercise_name_claims_pkey convert to the same honest skip",
  "insert_provenance": "is_active=true, is_system=true, catalog_id, catalog_logical_id, import_run_id; anatomy copied from exercise_catalog_muscles",
  "alias_delivery": "second phase resolves the target exercise independently through the logical identity with (user_id, catalog_alias_id) idempotency and an inactive-target block",
  "rollback": "rollback_catalog_delivery(p_run_key TEXT) deactivates (is_active=false, never deletes) this run's exercises and aliases by import_run_id, with dependent-alias reporting",
  "revocation": "exlib_revoke_run_delivery(p_run_key TEXT) halts future delivery; exlib_approve_and_seal_run(p_run_key TEXT) gates it",
  "delete_gate": "exercises_delivered_delete_gate_trigger blocks physical DELETE of any row with catalog provenance",
  "current_plank_limitation": "inserts the canonical name ONLY: when canonical 'plank' is claimed the identity lands in skipped_collision - no deterministic 'Plank (timed)' distinguished fallback, no guarded P2 in-place correction or anatomy synchronization; EXLIB-2D requires a narrowly reviewed extension of this contract, not a new delivery system"
 },
 "integration_design": {
  "single_public_entrypoint": "deliver_catalog_exercises(TEXT) is preserved as the ONE public tenant delivery entrypoint; migration 026 extends its internal Plank handling directly or via a narrowly scoped internal helper in the same transaction",
  "no_second_entrypoint": "no second public tenant delivery entrypoint with divergent authorization, locking, run validation, reporting, or rollback behavior may be created",
  "shared_boundary": "P2 correction and distinguished delivery execute inside the same per-user delivery transaction and the same advisory-lock domain (hashtextextended(uid, 8231)) as ordinary catalog delivery",
  "non_plank_unchanged": "canonical delivery behavior for every non-Plank identity remains byte-unchanged",
  "fallback_scope": "the distinguished fallback is keyed to the Plank logical identity specifically and must never generalize into an arbitrary renaming scheme",
  "alias_resolution": "alias delivery resolves the linked/delivered Plank row through catalog_logical_id regardless of canonical or distinguished tenant name (existing 023 behavior, unchanged)",
  "reporting_dispositions": [
   "corrected_and_linked_pristine_seed",
   "delivered_canonical_timed_plank",
   "delivered_distinguished_timed_plank",
   "already_valid_idempotent",
   "skipped_canonical_and_distinguished_collision",
   "inconsistent_prior_reconciliation",
   "precondition_failure_preserved_legacy_plus_distinguished_delivery"
  ]
 },
 "rollback_provenance": {
  "p2_nature": "a provenance/link correction on a PREEXISTING tenant row, never a newly delivered row",
  "discriminator_evidence": "delivered inserts also carry is_system=true (mechanically verified in the 023 INSERT), so no existing column distinguishes a corrected preexisting row from a run-inserted row",
  "mechanism": "migration 026 records each P2 correction in a dedicated correction record (user_id, exercise_id, run_id, corrected_at) written in the same transaction; the generic rollback_catalog_delivery deactivation sweep is extended to EXCLUDE correction-recorded rows",
  "p2_reversibility": "intentionally NON-REVERSIBLE after successful commit - reverting timed mode or synchronized anatomy could recreate the semantic risks this contract prevents; no automatic restore path exists",
  "revocation_semantics": "run revocation halts future delivery but never reinterprets existing P2 data",
  "import_run_id_interaction": "the corrected row's import_run_id keeps it inside refresh and verified-idempotency recognition and under the existing delivered-row delete gate (physical deletion blocked - intended strengthening), while the correction record keeps it outside every rollback deactivation query",
  "inserted_rows": "newly inserted timed rows (canonical or distinguished) keep the EXISTING rollback behavior unchanged",
  "never_deleted": "no rollback path deletes user history, aliases, routines, workouts, or a preexisting exercise id: the committed rollback function only ever sets is_active=false and the delete gate independently blocks physical deletion"
 }
}
```
