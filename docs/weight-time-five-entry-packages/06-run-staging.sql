-- ============================================================
-- W14-E stage 6 of 7 - DELIVERY RUN STAGING (family C) - the new five-entry run and its membership
-- STATUS: TEMPLATE - NOT EXECUTABLE - human decision leaves UNRESOLVED
--
-- GENERATED FILE. Do not edit by hand - regenerate:
--   npx tsx scripts/generate-weight-time-five-entry-packages.ts
-- Every value is derived from docs/weight-time-five-entry-lifecycle-manifest.json and the
-- three human decision forms (families A and B gated; family C: docs/weight-time-five-entry-run-authority-form.json).
--
-- WHY THIS FILE CANNOT RUN: every human decision leaf below is rendered as an
-- UNQUOTED <<UNRESOLVED:...>> token. That is a syntax error, deliberately: a
-- blank decision is never a string that could land in a column. The first
-- statement after BEGIN is a second deliberate syntax error, and the
-- precondition block raises before any read. When the forms are COMPLETED,
-- the same generator renders the executable package to this same path in a
-- later, separately reviewed commit. Blank is never approval.
--
-- WHAT THIS PACKAGE DOES (and everything it refuses to do):
--   - creates EXACTLY ONE new import run in the Design-S4 posture (dry_run = false, approved_for_delivery = false, sealed_at NULL, revoked_at NULL, operational fields NULL) carrying the family C product + legal approval evidence AT CREATION - derived from the promoted EXLIB-2U package: exlib_approve_and_seal_run only VALIDATES evidence, it never writes it
--   - creates EXACTLY FIVE membership rows: the five approved weight_time identities as exercise members, resolved by logical_id + is_active (never a hosted surrogate UUID), and ZERO alias members (none of the five carries an alias)
--   - the new run key is the family C run_key_literal and is NEVER the historical plank key exlib2u-plank-release1-staged-v1 (run_key is UNIQUE forever; the gate below refuses if the chosen key already exists)
--   - NO controlled function exists for run creation (only exlib_approve_and_seal_run writes a run row, and it only UPDATEs one that exists), so the direct owner INSERT is the ONLY lawful surface - the mechanism the promoted EXLIB-2U package used
--   - the staged run is STRUCTURALLY NON-DELIVERABLE: the delivery predicate (approved AND NOT dry AND sealed AND unrevoked) is EVALUATED below and must match zero rows; the delivery function is never called
--   - NO seal, NO revocation, NO delivery, NO change to the historical plank run or its six members, NO snapshot/content/publication/projection change, NO tenant change, NO authority change, NO environment change
--
-- EXECUTION AUTHORITY: may ONLY ever be applied to the Supabase project
-- "ShredOS" ref ttybyljytiwntvorugcv, ONLY by Joseph or ChatGPT in the hosted
-- SQL editor as the NON-SUPERUSER operator role postgres, never by Claude and
-- never by any automated pipeline, and only under its own one-use instruction
-- with a spent-check FIRST. Claude has made no hosted Supabase contact, no
-- Supabase CLI invocation and no Vercel contact while preparing it.
--
-- ONE-USE / FAIL-CLOSED: one transaction at REPEATABLE READ; SHARE ROW EXCLUSIVE
-- locks over the eleven gated catalog tables before any gated read; every
-- precondition and postcondition RAISEs on mismatch and rolls back EVERYTHING.
-- A second execution refuses at the pre-state gate before any write. If the
-- transport or result of an execution is ever ambiguous, READ STATE FIRST with
-- docs/weight-time-five-entry-read-state.sql and never blindly re-run.
--
-- POSITION IN THE SEQUENCE: stage 6 of 7. Vector before 8/8/10/3/11/6/2/2/1/6/8,
-- after 8/8/10/3/11/6/2/2/2/11/8 (runs 1 -> 2; run_items 6 -> 11 (five exercise members, zero alias members)).
-- ============================================================

BEGIN;
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;

-- TEMPLATE RENDERING: NOT EXECUTABLE. 92 human decision leaves are blank:
--   A.132.decision
--   A.132.reviewer
--   A.132.reviewer_role_or_credential
--   A.132.reviewed_at
--   A.132.rationale
--   A.133.decision
--   A.133.reviewer
--   A.133.reviewer_role_or_credential
--   A.133.reviewed_at
--   A.133.rationale
--   A.137.decision
--   A.137.reviewer
--   A.137.reviewer_role_or_credential
--   A.137.reviewed_at
--   A.137.rationale
--   A.138.decision
--   A.138.reviewer
--   A.138.reviewer_role_or_credential
--   A.138.reviewed_at
--   A.138.rationale
--   A.139.decision
--   A.139.reviewer
--   A.139.reviewer_role_or_credential
--   A.139.reviewed_at
--   A.139.rationale
--   B.132.decision
--   B.132.reviewer
--   B.132.reviewer_role_or_credential
--   B.132.reviewed_at
--   B.132.rationale
--   B.132.confirm.instruction_coaching_quality
--   B.132.confirm.safety_adequacy
--   B.132.confirm.partner_plate_placement_guidance_appropriate
--   B.132.confirm.plate_position_between_shoulder_blades_correct
--   B.132.confirm.load_selection_heuristic_reasonable
--   B.132.confirm.weight_time_contract_stated_correctly
--   B.132.confirm.easier_alternative_appropriate
--   B.133.decision
--   B.133.reviewer
--   B.133.reviewer_role_or_credential
--   B.133.reviewed_at
--   B.133.rationale
--   B.133.confirm.instruction_coaching_quality
--   B.133.confirm.safety_adequacy
--   B.133.confirm.vest_fit_guidance_appropriate
--   B.133.confirm.vest_loading_distinct_from_plate_placement
--   B.133.confirm.strap_and_pocket_check_sufficient
--   B.133.confirm.weight_time_contract_stated_correctly
--   B.133.confirm.easier_alternative_appropriate
--   B.137.decision
--   B.137.reviewer
--   B.137.reviewer_role_or_credential
--   B.137.reviewed_at
--   B.137.rationale
--   B.137.confirm.instruction_coaching_quality
--   B.137.confirm.safety_adequacy
--   B.137.confirm.grip_and_hang_mechanics_correct
--   B.137.confirm.dip_belt_or_feet_held_plate_both_appropriate
--   B.137.confirm.step_off_rather_than_jump_guidance_sufficient
--   B.137.confirm.weight_time_contract_stated_correctly
--   B.137.confirm.easier_alternative_appropriate
--   B.138.decision
--   B.138.reviewer
--   B.138.reviewer_role_or_credential
--   B.138.reviewed_at
--   B.138.rationale
--   B.138.confirm.instruction_coaching_quality
--   B.138.confirm.safety_adequacy
--   B.138.confirm.plate_on_thighs_near_hips_placement_correct
--   B.138.confirm.thighs_parallel_depth_cue_correct
--   B.138.confirm.position_first_then_load_ordering_appropriate
--   B.138.confirm.weight_time_contract_stated_correctly
--   B.138.confirm.easier_alternative_appropriate
--   B.139.decision
--   B.139.reviewer
--   B.139.reviewer_role_or_credential
--   B.139.reviewed_at
--   B.139.rationale
--   B.139.confirm.instruction_coaching_quality
--   B.139.confirm.safety_adequacy
--   B.139.confirm.vest_fit_guidance_appropriate
--   B.139.confirm.vest_not_bunched_behind_back_cue_useful
--   B.139.confirm.hands_free_advantage_over_plate_variant_accurate
--   B.139.confirm.weight_time_contract_stated_correctly
--   B.139.confirm.easier_alternative_appropriate
--   C.run_key_literal
--   C.product_approver_identity
--   C.product_approved_at
--   C.legal_approver_identity
--   C.legal_approved_at
--   C.approval_rationale
--   C.run_membership
-- The next line is a deliberate syntax error so nothing below can ever run.
SELECT <<UNRESOLVED-TEMPLATE: 92 human decision leaves are blank; regenerate from COMPLETED forms>>;

LOCK TABLE
  public.exercise_catalog,
  public.exercise_catalog_aliases,
  public.exercise_catalog_content,
  public.exercise_catalog_content_expected_relationships,
  public.exercise_catalog_import_runs,
  public.exercise_catalog_logical,
  public.exercise_catalog_muscles,
  public.exercise_catalog_name_claims,
  public.exercise_catalog_relationships,
  public.exercise_catalog_review_events,
  public.exercise_catalog_run_items
  IN SHARE ROW EXCLUSIVE MODE;

-- ── Capture-and-compare surfaces (temp, transaction-local): every surface this
--    package must NOT change is digested here and re-digested afterwards.
--    These md5 digests detect a change between two readings inside this ONE
--    transaction; they never bind any source artifact. ──────────────────────
CREATE TEMP TABLE w14e6_capture ON COMMIT DROP AS
SELECT
  (SELECT md5(coalesce(string_agg(l::text, '|' ORDER BY l.id), '-')) FROM public.exercise_catalog_logical l) AS logical_digest,
  (SELECT md5(coalesce(string_agg(c::text, '|' ORDER BY c.logical_id, c.catalog_version), '-')) FROM public.exercise_catalog c) AS snapshots_digest,
  (SELECT md5(coalesce(string_agg(e::text, '|' ORDER BY e.id), '-')) FROM public.exercise_catalog_review_events e) AS events_digest,
  (SELECT md5(coalesce(string_agg(m::text, '|' ORDER BY m.catalog_id, m.muscle), '-')) FROM public.exercise_catalog_muscles m) AS anatomy_digest,
  (SELECT md5(coalesce(string_agg(a::text, '|' ORDER BY a.logical_id, a.alias), '-')) FROM public.exercise_catalog_aliases a) AS alias_digest,
  (SELECT md5(coalesce(string_agg(n::text, '|' ORDER BY n.normalized_name), '-')) FROM public.exercise_catalog_name_claims n) AS claims_digest,
  (SELECT md5(coalesce(string_agg(c::text, '|' ORDER BY c.id), '-')) FROM public.exercise_catalog_content c) AS content_digest,
  (SELECT md5(coalesce(string_agg(x::text, '|' ORDER BY x.content_id, x.relation, x.to_logical_id), '-')) FROM public.exercise_catalog_content_expected_relationships x) AS expected_rel_digest,
  (SELECT md5(coalesce(string_agg(r::text, '|' ORDER BY r.from_logical_id, r.relation, r.to_logical_id), '-')) FROM public.exercise_catalog_relationships r) AS projection_digest,
  (SELECT r::text FROM public.exercise_catalog_import_runs r WHERE r.run_key = 'exlib2u-plank-release1-staged-v1') AS historical_run_row,
  (SELECT md5(coalesce(string_agg(ri::text, '|' ORDER BY ri.id), '-'))
     FROM public.exercise_catalog_run_items ri
     JOIN public.exercise_catalog_import_runs r ON r.id = ri.run_id
    WHERE r.run_key = 'exlib2u-plank-release1-staged-v1') AS historical_items_digest,
  (SELECT md5(coalesce(string_agg(am::text, '|' ORDER BY am.roleid, am.member, am.grantor), '-'))
     FROM pg_catalog.pg_auth_members am
     JOIN pg_roles g ON g.oid = am.roleid
    WHERE g.rolname IN ('exlib_catalog_loader','exlib_catalog_reviewer','exlib_catalog_admission','exlib_catalog_admin')) AS authority_digest,
  (SELECT count(*)::text || ':' || md5(coalesce(string_agg(t::text, '|' ORDER BY t.id), '-')) FROM public.exercises t) AS tenant_digest,
  (SELECT count(*)::text || ':' || md5(coalesce(string_agg(t::text, '|' ORDER BY t.id), '-')) FROM public.exercise_aliases t) AS tenant_alias_digest,
  (SELECT count(*)::text || ':' || md5(coalesce(string_agg(t::text, '|' ORDER BY t.id), '-')) FROM public.exercise_muscles t) AS tenant_muscle_digest;

-- ── Preconditions (ANY mismatch aborts EVERYTHING before any write) ───
DO $pre$
DECLARE
  v_counts TEXT;
  v_line   TEXT;
BEGIN
  RAISE EXCEPTION 'W14E-6 run staging: TEMPLATE RENDERING with unresolved human decision leaves; this file is not executable and must be regenerated from COMPLETED forms';
  IF current_user <> 'postgres' OR session_user <> 'postgres' THEN
    RAISE EXCEPTION 'W14E-6 run staging: BOTH execution identities must be the hosted operator role postgres (got current_user=%, session_user=%); refusing before any write or authority change', current_user, session_user;
  END IF;
  IF (SELECT rolsuper FROM pg_roles WHERE rolname = current_user) THEN
    RAISE EXCEPTION 'W14E-6 run staging: the invoker is a superuser; this package is bound to the hosted non-superuser postgres posture';
  END IF;
  IF to_regclass('public.exercise_catalog_import_runs') IS NULL
     OR to_regclass('public.exercise_catalog_run_items') IS NULL
     OR to_regprocedure('public.exlib_approve_and_seal_run(text)') IS NULL
     OR to_regprocedure('public.deliver_catalog_exercises(text)') IS NULL THEN
    RAISE EXCEPTION 'W14E-6 run staging: the run tables, the seal function, or the delivery function are missing; wrong or unmigrated database';
  END IF;
  IF (SELECT count(*) FROM pg_catalog.pg_trigger t
       WHERE t.tgrelid = 'public.exercise_catalog'::regclass
         AND t.tgname = 'exercise_catalog_freeze_trigger'
         AND t.tgfoid = 'public.exlib_freeze_catalog_snapshot()'::regprocedure
         AND t.tgtype = 23
         AND t.tgenabled = 'O') <> 1
     OR (SELECT count(*) FROM pg_catalog.pg_trigger t
          WHERE t.tgrelid = 'public.exercise_catalog_review_events'::regclass
            AND t.tgname = 'exercise_catalog_review_events_guard_trigger'
            AND t.tgfoid = 'public.exlib_freeze_review_events()'::regprocedure
            AND t.tgtype = 31
            AND t.tgenabled = 'O') <> 1
     OR (SELECT count(*) FROM pg_catalog.pg_trigger t
          WHERE t.tgrelid = 'public.exercise_catalog_import_runs'::regclass
            AND t.tgname = 'exercise_catalog_import_runs_freeze_trigger'
            AND t.tgfoid = 'public.exlib_freeze_run_row()'::regprocedure
            AND t.tgtype = 23
            AND t.tgenabled = 'O') <> 1
     OR (SELECT count(*) FROM pg_catalog.pg_trigger t
          WHERE t.tgrelid = 'public.exercise_catalog_import_runs'::regclass
            AND NOT t.tgisinternal) <> 1
     OR (SELECT count(*) FROM pg_catalog.pg_trigger t
          WHERE t.tgrelid = 'public.exercise_catalog_run_items'::regclass
            AND t.tgname = 'exercise_catalog_run_items_freeze_trigger'
            AND t.tgfoid = 'public.exlib_freeze_run_membership()'::regprocedure
            AND t.tgtype = 31
            AND t.tgenabled = 'O') <> 1
     OR (SELECT count(*) FROM pg_catalog.pg_trigger t
          WHERE t.tgrelid = 'public.exercise_catalog_run_items'::regclass
            AND NOT t.tgisinternal) <> 1 THEN
    RAISE EXCEPTION 'W14E-6 run staging: a governing freeze trigger is not EXACTLY bound and enabled (promoted name, table, function, event set, enabled state); refusing';
  END IF;
  SELECT string_agg(g.rolname || '>' || m.rolname || '@' || gr.rolname
           || ':' || am.admin_option::text || ':' || am.inherit_option::text || ':' || am.set_option::text,
           E'\n' ORDER BY g.rolname, m.rolname, gr.rolname)
    INTO v_line
    FROM pg_catalog.pg_auth_members am
    JOIN pg_roles g  ON g.oid  = am.roleid
    JOIN pg_roles m  ON m.oid  = am.member
    JOIN pg_roles gr ON gr.oid = am.grantor
   WHERE g.rolname IN ('exlib_catalog_loader','exlib_catalog_reviewer','exlib_catalog_admission','exlib_catalog_admin');
  IF v_line IS DISTINCT FROM
        'exlib_catalog_admin>postgres@supabase_admin:true:false:false'
     || E'\n' || 'exlib_catalog_admission>postgres@supabase_admin:true:false:false'
     || E'\n' || 'exlib_catalog_loader>postgres@supabase_admin:true:false:false'
     || E'\n' || 'exlib_catalog_reviewer>postgres@supabase_admin:true:false:false' THEN
    RAISE EXCEPTION 'W14E-6 run staging: the catalog authority baseline is not exactly the promoted shape (got: %); refusing', coalesce(v_line, '<none>');
  END IF;
  SELECT
    (SELECT count(*) FROM public.exercise_catalog_logical)::text
    || '/' || (SELECT count(*) FROM public.exercise_catalog)::text
    || '/' || (SELECT count(*) FROM public.exercise_catalog_muscles)::text
    || '/' || (SELECT count(*) FROM public.exercise_catalog_aliases)::text
    || '/' || (SELECT count(*) FROM public.exercise_catalog_name_claims)::text
    || '/' || (SELECT count(*) FROM public.exercise_catalog_content)::text
    || '/' || (SELECT count(*) FROM public.exercise_catalog_content_expected_relationships)::text
    || '/' || (SELECT count(*) FROM public.exercise_catalog_relationships)::text
    || '/' || (SELECT count(*) FROM public.exercise_catalog_import_runs)::text
    || '/' || (SELECT count(*) FROM public.exercise_catalog_run_items)::text
    || '/' || (SELECT count(*) FROM public.exercise_catalog_review_events)::text
    INTO v_counts;
  IF v_counts <> '8/8/10/3/11/6/2/2/1/6/8' THEN
    RAISE EXCEPTION 'W14E-6 run staging: the catalog surface is not the exact expected pre-state (expected 8/8/10/3/11/6/2/2/1/6/8, found %); this ONE-USE package refuses to run twice, over foreign state, or over an ambiguous surface - READ STATE FIRST', v_counts;
  END IF;
  IF EXISTS (SELECT 1 FROM public.exercise_catalog_import_runs r WHERE r.run_key = <<UNRESOLVED:C.run_key_literal>>) THEN
    RAISE EXCEPTION 'W14E-6 run staging: the chosen run key already exists; refusing - run_key is UNIQUE forever, this package is ONE-USE, and the historical plank key must never be reused; READ STATE FIRST';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_import_runs r
       WHERE r.run_key = 'exlib2u-plank-release1-staged-v1'
         AND r.approved_for_delivery = true AND r.dry_run = false
         AND r.sealed_at IS NOT NULL AND r.revoked_at IS NULL) <> 1
     OR (SELECT count(*) FROM public.exercise_catalog_run_items ri
           JOIN public.exercise_catalog_import_runs r ON r.id = ri.run_id
          WHERE r.run_key = 'exlib2u-plank-release1-staged-v1') <> 6 THEN
    RAISE EXCEPTION 'W14E-6 run staging: the historical plank release run exlib2u-plank-release1-staged-v1 is not exactly one sealed, approved, non-dry, unrevoked run with six membership rows; the world is not the evidenced post-W14 hosted state; refusing';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_content c
       WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000001' AND c.publication_status = 'published'
         AND c.import_admitted = true
         AND c.admitted_fingerprint = public.exlib_content_admission_fingerprint(c.id)) <> 1 THEN
    RAISE EXCEPTION 'W14E-6 run staging: the published, admitted, fingerprint-fresh Plank content row is not exactly present; refusing';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_logical WHERE id IN ('e21b2c00-0000-4000-a000-000000000009', 'e21b2c00-0000-4000-a000-00000000000a', 'e21b2c00-0000-4000-a000-00000000000b')) <> 0
     OR (SELECT count(*) FROM public.exercise_catalog WHERE lower(canonical_name) ~ 'carry|farmer|suitcase|sandbag') <> 0 THEN
    RAISE EXCEPTION 'W14E-6 run staging: a deferred carry identity (inventory lines 134, 135, 136) is present in the catalog; the carries are DEFERRED and this lifecycle never touches them; refusing';
  END IF;
  -- every identity the membership INSERT names must resolve to exactly one
  -- ACTIVE snapshot - a listed identity that does not exist would otherwise
  -- silently produce no row
  IF (SELECT count(*) FROM public.exercise_catalog c
       WHERE c.logical_id IN ('e21b2c00-0000-4000-a000-000000000004',
                        'e21b2c00-0000-4000-a000-000000000005',
                        'e21b2c00-0000-4000-a000-000000000006',
                        'e21b2c00-0000-4000-a000-000000000007',
                        'e21b2c00-0000-4000-a000-000000000008')
         AND c.is_active = true) <> 5 THEN
    RAISE EXCEPTION 'W14E-6 run staging: the 5 listed membership identities do not each resolve to exactly one active snapshot; refusing';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog e
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000004' AND e.is_active = true) <> 1
     OR NOT EXISTS (SELECT 1 FROM public.exercise_catalog e
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000004' AND e.is_active = true
         AND e.canonical_name = $nm132$Plate-weighted plank$nm132$
         AND e.category = 'isolation' AND e.primary_muscle = 'abs'
         AND e.equipment = 'weight_plate' AND e.laterality = 'bilateral'
         AND e.tracking_mode = 'weight_time' AND e.provenance = 'external_source_derived'
         AND e.movement_pattern = 'core_anti_extension' AND e.training_role = 'core'
         AND e.difficulty = 'intermediate' AND e.availability = 'home_gym'
         AND e.source_url = $su132$https://www.strengthlog.com/weighted-plank/$su132$
         AND e.source_page = $sp132$https://www.strengthlog.com/exercise-directory/$sp132$
         AND e.retrieved_at = DATE '2026-08-20'
         AND e.import_confidence = 'human_review_required'
         AND e.catalog_version = 1) THEN
    RAISE EXCEPTION 'W14E-6 run staging: inventory line 132 (Plate-weighted plank) is not exactly one active v1 snapshot carrying the governed W14 fields; refusing';
  END IF;
  IF (SELECT coalesce(string_agg(m.muscle || ':' || m.role, ',' ORDER BY m.muscle, m.role), '')
        FROM public.exercise_catalog_muscles m
        JOIN public.exercise_catalog e ON e.id = m.catalog_id
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000004' AND e.is_active = true) <> 'obliques:secondary' THEN
    RAISE EXCEPTION 'W14E-6 run staging: inventory line 132 anatomy is not exactly obliques:secondary; refusing';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_aliases a WHERE a.logical_id = 'e21b2c00-0000-4000-a000-000000000004') <> 0 THEN
    RAISE EXCEPTION 'W14E-6 run staging: inventory line 132 alias count is not 0; refusing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.exercise_catalog e
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000004' AND e.is_active = true
         AND e.review_status = 'approved'
         AND e.reviewed_by = <<UNRESOLVED:A.132.reviewer>>
         AND e.reviewed_at = <<UNRESOLVED:A.132.reviewed_at>>
         AND e.review_rationale = <<UNRESOLVED:A.132.rationale>>) THEN
    RAISE EXCEPTION 'W14E-6 run staging: inventory line 132 does not bear the exact family A approval tuple; refusing';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog e
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000005' AND e.is_active = true) <> 1
     OR NOT EXISTS (SELECT 1 FROM public.exercise_catalog e
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000005' AND e.is_active = true
         AND e.canonical_name = $nm133$Weighted vest plank$nm133$
         AND e.category = 'isolation' AND e.primary_muscle = 'abs'
         AND e.equipment = 'weighted_vest' AND e.laterality = 'bilateral'
         AND e.tracking_mode = 'weight_time' AND e.provenance = 'external_source_derived'
         AND e.movement_pattern = 'core_anti_extension' AND e.training_role = 'core'
         AND e.difficulty = 'intermediate' AND e.availability = 'home_gym'
         AND e.source_url = $su133$https://marathonhandbook.com/weighted-plank/$su133$
         AND e.source_page = $sp133$https://marathonhandbook.com/weighted-plank/$sp133$
         AND e.retrieved_at = DATE '2026-08-24'
         AND e.import_confidence = 'human_review_required'
         AND e.catalog_version = 1) THEN
    RAISE EXCEPTION 'W14E-6 run staging: inventory line 133 (Weighted vest plank) is not exactly one active v1 snapshot carrying the governed W14 fields; refusing';
  END IF;
  IF (SELECT coalesce(string_agg(m.muscle || ':' || m.role, ',' ORDER BY m.muscle, m.role), '')
        FROM public.exercise_catalog_muscles m
        JOIN public.exercise_catalog e ON e.id = m.catalog_id
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000005' AND e.is_active = true) <> 'obliques:secondary' THEN
    RAISE EXCEPTION 'W14E-6 run staging: inventory line 133 anatomy is not exactly obliques:secondary; refusing';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_aliases a WHERE a.logical_id = 'e21b2c00-0000-4000-a000-000000000005') <> 0 THEN
    RAISE EXCEPTION 'W14E-6 run staging: inventory line 133 alias count is not 0; refusing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.exercise_catalog e
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000005' AND e.is_active = true
         AND e.review_status = 'approved'
         AND e.reviewed_by = <<UNRESOLVED:A.133.reviewer>>
         AND e.reviewed_at = <<UNRESOLVED:A.133.reviewed_at>>
         AND e.review_rationale = <<UNRESOLVED:A.133.rationale>>) THEN
    RAISE EXCEPTION 'W14E-6 run staging: inventory line 133 does not bear the exact family A approval tuple; refusing';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog e
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000006' AND e.is_active = true) <> 1
     OR NOT EXISTS (SELECT 1 FROM public.exercise_catalog e
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000006' AND e.is_active = true
         AND e.canonical_name = $nm137$Weighted dead hang$nm137$
         AND e.category = 'isolation' AND e.primary_muscle = 'forearms'
         AND e.equipment = 'weight_plate' AND e.laterality = 'bilateral'
         AND e.tracking_mode = 'weight_time' AND e.provenance = 'forgefitos_original'
         AND e.movement_pattern = 'grip_forearm' AND e.training_role = 'accessory'
         AND e.difficulty = 'intermediate' AND e.availability = 'home_gym'
         AND e.source_url IS NULL
         AND e.source_page IS NULL
         AND e.retrieved_at IS NULL
         AND e.import_confidence IS NULL
         AND e.catalog_version = 1) THEN
    RAISE EXCEPTION 'W14E-6 run staging: inventory line 137 (Weighted dead hang) is not exactly one active v1 snapshot carrying the governed W14 fields; refusing';
  END IF;
  IF (SELECT coalesce(string_agg(m.muscle || ':' || m.role, ',' ORDER BY m.muscle, m.role), '')
        FROM public.exercise_catalog_muscles m
        JOIN public.exercise_catalog e ON e.id = m.catalog_id
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000006' AND e.is_active = true) <> 'lats:secondary' THEN
    RAISE EXCEPTION 'W14E-6 run staging: inventory line 137 anatomy is not exactly lats:secondary; refusing';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_aliases a WHERE a.logical_id = 'e21b2c00-0000-4000-a000-000000000006') <> 0 THEN
    RAISE EXCEPTION 'W14E-6 run staging: inventory line 137 alias count is not 0; refusing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.exercise_catalog e
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000006' AND e.is_active = true
         AND e.review_status = 'approved'
         AND e.reviewed_by = <<UNRESOLVED:A.137.reviewer>>
         AND e.reviewed_at = <<UNRESOLVED:A.137.reviewed_at>>
         AND e.review_rationale = <<UNRESOLVED:A.137.rationale>>) THEN
    RAISE EXCEPTION 'W14E-6 run staging: inventory line 137 does not bear the exact family A approval tuple; refusing';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog e
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000007' AND e.is_active = true) <> 1
     OR NOT EXISTS (SELECT 1 FROM public.exercise_catalog e
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000007' AND e.is_active = true
         AND e.canonical_name = $nm138$Weighted wall sit$nm138$
         AND e.category = 'compound' AND e.primary_muscle = 'quads'
         AND e.equipment = 'weight_plate' AND e.laterality = 'bilateral'
         AND e.tracking_mode = 'weight_time' AND e.provenance = 'forgefitos_original'
         AND e.movement_pattern = 'squat' AND e.training_role = 'accessory'
         AND e.difficulty = 'beginner' AND e.availability = 'minimal'
         AND e.source_url IS NULL
         AND e.source_page IS NULL
         AND e.retrieved_at IS NULL
         AND e.import_confidence IS NULL
         AND e.catalog_version = 1) THEN
    RAISE EXCEPTION 'W14E-6 run staging: inventory line 138 (Weighted wall sit) is not exactly one active v1 snapshot carrying the governed W14 fields; refusing';
  END IF;
  IF (SELECT coalesce(string_agg(m.muscle || ':' || m.role, ',' ORDER BY m.muscle, m.role), '')
        FROM public.exercise_catalog_muscles m
        JOIN public.exercise_catalog e ON e.id = m.catalog_id
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000007' AND e.is_active = true) <> 'glutes:secondary' THEN
    RAISE EXCEPTION 'W14E-6 run staging: inventory line 138 anatomy is not exactly glutes:secondary; refusing';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_aliases a WHERE a.logical_id = 'e21b2c00-0000-4000-a000-000000000007') <> 0 THEN
    RAISE EXCEPTION 'W14E-6 run staging: inventory line 138 alias count is not 0; refusing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.exercise_catalog e
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000007' AND e.is_active = true
         AND e.review_status = 'approved'
         AND e.reviewed_by = <<UNRESOLVED:A.138.reviewer>>
         AND e.reviewed_at = <<UNRESOLVED:A.138.reviewed_at>>
         AND e.review_rationale = <<UNRESOLVED:A.138.rationale>>) THEN
    RAISE EXCEPTION 'W14E-6 run staging: inventory line 138 does not bear the exact family A approval tuple; refusing';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog e
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000008' AND e.is_active = true) <> 1
     OR NOT EXISTS (SELECT 1 FROM public.exercise_catalog e
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000008' AND e.is_active = true
         AND e.canonical_name = $nm139$Weighted vest wall sit$nm139$
         AND e.category = 'compound' AND e.primary_muscle = 'quads'
         AND e.equipment = 'weighted_vest' AND e.laterality = 'bilateral'
         AND e.tracking_mode = 'weight_time' AND e.provenance = 'forgefitos_original'
         AND e.movement_pattern = 'squat' AND e.training_role = 'accessory'
         AND e.difficulty = 'beginner' AND e.availability = 'home_gym'
         AND e.source_url IS NULL
         AND e.source_page IS NULL
         AND e.retrieved_at IS NULL
         AND e.import_confidence IS NULL
         AND e.catalog_version = 1) THEN
    RAISE EXCEPTION 'W14E-6 run staging: inventory line 139 (Weighted vest wall sit) is not exactly one active v1 snapshot carrying the governed W14 fields; refusing';
  END IF;
  IF (SELECT coalesce(string_agg(m.muscle || ':' || m.role, ',' ORDER BY m.muscle, m.role), '')
        FROM public.exercise_catalog_muscles m
        JOIN public.exercise_catalog e ON e.id = m.catalog_id
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000008' AND e.is_active = true) <> 'glutes:secondary' THEN
    RAISE EXCEPTION 'W14E-6 run staging: inventory line 139 anatomy is not exactly glutes:secondary; refusing';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_aliases a WHERE a.logical_id = 'e21b2c00-0000-4000-a000-000000000008') <> 0 THEN
    RAISE EXCEPTION 'W14E-6 run staging: inventory line 139 alias count is not 0; refusing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.exercise_catalog e
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000008' AND e.is_active = true
         AND e.review_status = 'approved'
         AND e.reviewed_by = <<UNRESOLVED:A.139.reviewer>>
         AND e.reviewed_at = <<UNRESOLVED:A.139.reviewed_at>>
         AND e.review_rationale = <<UNRESOLVED:A.139.rationale>>) THEN
    RAISE EXCEPTION 'W14E-6 run staging: inventory line 139 does not bear the exact family A approval tuple; refusing';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_content c
       WHERE c.id = 'e21b2c00-0000-4000-a000-000000000104' AND c.logical_id = 'e21b2c00-0000-4000-a000-000000000004'
         AND c.publication_status = 'published' AND c.import_admitted = true
         AND c.content_status = 'approved'
         AND c.admitted_source_sha256 = 'fb13ea5283e7ab13953471bb323e8fe9df9ce707e718751c477495068fea2921'
         AND c.admitted_fingerprint = <<UNRESOLVED:B.132.admission_fingerprint(derived)>>
         AND c.admitted_fingerprint = public.exlib_content_admission_fingerprint(c.id)) <> 1 THEN
    RAISE EXCEPTION 'W14E-6 run staging: the published, admitted, fingerprint-fresh content row for inventory line 132 is not exactly present; the run must never point at unpublished content; refusing';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_content c
       WHERE c.id = 'e21b2c00-0000-4000-a000-000000000105' AND c.logical_id = 'e21b2c00-0000-4000-a000-000000000005'
         AND c.publication_status = 'published' AND c.import_admitted = true
         AND c.content_status = 'approved'
         AND c.admitted_source_sha256 = 'fb13ea5283e7ab13953471bb323e8fe9df9ce707e718751c477495068fea2921'
         AND c.admitted_fingerprint = <<UNRESOLVED:B.133.admission_fingerprint(derived)>>
         AND c.admitted_fingerprint = public.exlib_content_admission_fingerprint(c.id)) <> 1 THEN
    RAISE EXCEPTION 'W14E-6 run staging: the published, admitted, fingerprint-fresh content row for inventory line 133 is not exactly present; the run must never point at unpublished content; refusing';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_content c
       WHERE c.id = 'e21b2c00-0000-4000-a000-000000000106' AND c.logical_id = 'e21b2c00-0000-4000-a000-000000000006'
         AND c.publication_status = 'published' AND c.import_admitted = true
         AND c.content_status = 'approved'
         AND c.admitted_source_sha256 = 'fb13ea5283e7ab13953471bb323e8fe9df9ce707e718751c477495068fea2921'
         AND c.admitted_fingerprint = <<UNRESOLVED:B.137.admission_fingerprint(derived)>>
         AND c.admitted_fingerprint = public.exlib_content_admission_fingerprint(c.id)) <> 1 THEN
    RAISE EXCEPTION 'W14E-6 run staging: the published, admitted, fingerprint-fresh content row for inventory line 137 is not exactly present; the run must never point at unpublished content; refusing';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_content c
       WHERE c.id = 'e21b2c00-0000-4000-a000-000000000107' AND c.logical_id = 'e21b2c00-0000-4000-a000-000000000007'
         AND c.publication_status = 'published' AND c.import_admitted = true
         AND c.content_status = 'approved'
         AND c.admitted_source_sha256 = 'fb13ea5283e7ab13953471bb323e8fe9df9ce707e718751c477495068fea2921'
         AND c.admitted_fingerprint = <<UNRESOLVED:B.138.admission_fingerprint(derived)>>
         AND c.admitted_fingerprint = public.exlib_content_admission_fingerprint(c.id)) <> 1 THEN
    RAISE EXCEPTION 'W14E-6 run staging: the published, admitted, fingerprint-fresh content row for inventory line 138 is not exactly present; the run must never point at unpublished content; refusing';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_content c
       WHERE c.id = 'e21b2c00-0000-4000-a000-000000000108' AND c.logical_id = 'e21b2c00-0000-4000-a000-000000000008'
         AND c.publication_status = 'published' AND c.import_admitted = true
         AND c.content_status = 'approved'
         AND c.admitted_source_sha256 = 'fb13ea5283e7ab13953471bb323e8fe9df9ce707e718751c477495068fea2921'
         AND c.admitted_fingerprint = <<UNRESOLVED:B.139.admission_fingerprint(derived)>>
         AND c.admitted_fingerprint = public.exlib_content_admission_fingerprint(c.id)) <> 1 THEN
    RAISE EXCEPTION 'W14E-6 run staging: the published, admitted, fingerprint-fresh content row for inventory line 139 is not exactly present; the run must never point at unpublished content; refusing';
  END IF;
  IF (SELECT orphaned_claims::text || '/' || unclaimed_bearers::text FROM public.exlib_verify_catalog_claims()) <> '0/0' THEN
    RAISE EXCEPTION 'W14E-6 run staging: the bidirectional catalog name-claim invariant does not hold; refusing';
  END IF;
END
$pre$;

-- ── THE ACT: one staged run + its five membership rows ────────────────
INSERT INTO public.exercise_catalog_import_runs
  (run_key, dry_run,
   product_approved_by, product_approved_at,
   legal_approved_by, legal_approved_at,
   approval_rationale)
VALUES
  (<<UNRESOLVED:C.run_key_literal>>, false,
   <<UNRESOLVED:C.product_approver_identity>>, <<UNRESOLVED:C.product_approved_at>>,
   <<UNRESOLVED:C.legal_approver_identity>>, <<UNRESOLVED:C.legal_approved_at>>,
   <<UNRESOLVED:C.approval_rationale>>);

INSERT INTO public.exercise_catalog_run_items (run_id, catalog_id)
SELECT r.id, c.id
  FROM public.exercise_catalog_import_runs r
  JOIN public.exercise_catalog c
    ON c.logical_id IN ('e21b2c00-0000-4000-a000-000000000004',
                        'e21b2c00-0000-4000-a000-000000000005',
                        'e21b2c00-0000-4000-a000-000000000006',
                        'e21b2c00-0000-4000-a000-000000000007',
                        'e21b2c00-0000-4000-a000-000000000008')
   AND c.is_active = true
 WHERE r.run_key = <<UNRESOLVED:C.run_key_literal>>;

-- ── Postconditions (ANY mismatch rolls back EVERYTHING) ──────────────
DO $post$
DECLARE
  v_counts TEXT;
  v_line   TEXT;
  v_cap    RECORD;
  v_run    public.exercise_catalog_import_runs%ROWTYPE;
  v_exercise_members INTEGER;
  v_alias_members    INTEGER;
  v_unready          INTEGER;
BEGIN
  SELECT * INTO v_cap FROM w14e6_capture;
  SELECT
    (SELECT count(*) FROM public.exercise_catalog_logical)::text
    || '/' || (SELECT count(*) FROM public.exercise_catalog)::text
    || '/' || (SELECT count(*) FROM public.exercise_catalog_muscles)::text
    || '/' || (SELECT count(*) FROM public.exercise_catalog_aliases)::text
    || '/' || (SELECT count(*) FROM public.exercise_catalog_name_claims)::text
    || '/' || (SELECT count(*) FROM public.exercise_catalog_content)::text
    || '/' || (SELECT count(*) FROM public.exercise_catalog_content_expected_relationships)::text
    || '/' || (SELECT count(*) FROM public.exercise_catalog_relationships)::text
    || '/' || (SELECT count(*) FROM public.exercise_catalog_import_runs)::text
    || '/' || (SELECT count(*) FROM public.exercise_catalog_run_items)::text
    || '/' || (SELECT count(*) FROM public.exercise_catalog_review_events)::text
    INTO v_counts;
  IF v_counts <> '8/8/10/3/11/6/2/2/2/11/8' THEN
    RAISE EXCEPTION 'W14E-6 run staging: post-state vector is % (expected 8/8/10/3/11/6/2/2/2/11/8); rolling back everything', v_counts;
  END IF;
  SELECT * INTO v_run FROM public.exercise_catalog_import_runs WHERE run_key = <<UNRESOLVED:C.run_key_literal>>;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'W14E-6 run staging: the staged run row is missing after the act; rolling back everything';
  END IF;
  IF v_run.dry_run <> false
     OR v_run.approved_for_delivery <> false
     OR v_run.sealed_at IS NOT NULL
     OR v_run.revoked_at IS NOT NULL
     OR v_run.started_at IS NOT NULL
     OR v_run.completed_at IS NOT NULL
     OR v_run.result_counts IS NOT NULL
     OR v_run.created_at IS NULL THEN
    RAISE EXCEPTION 'W14E-6 run staging: the run row is not exactly the staged Design-S4 posture; rolling back everything';
  END IF;
  IF v_run.product_approved_by IS DISTINCT FROM <<UNRESOLVED:C.product_approver_identity>>
     OR v_run.product_approved_at IS DISTINCT FROM <<UNRESOLVED:C.product_approved_at>>
     OR v_run.legal_approved_by IS DISTINCT FROM <<UNRESOLVED:C.legal_approver_identity>>
     OR v_run.legal_approved_at IS DISTINCT FROM <<UNRESOLVED:C.legal_approved_at>>
     OR v_run.approval_rationale IS DISTINCT FROM <<UNRESOLVED:C.approval_rationale>> THEN
    RAISE EXCEPTION 'W14E-6 run staging: the run does not carry the reserved family C approval evidence character-for-character; refusing';
  END IF;
  SELECT string_agg(x.member, E'\n' ORDER BY x.member)
    INTO v_line
    FROM (
      SELECT 'exercise#' || c.logical_id::text AS member
        FROM public.exercise_catalog_run_items ri
        JOIN public.exercise_catalog c ON c.id = ri.catalog_id
       WHERE ri.run_id = v_run.id AND ri.catalog_id IS NOT NULL
      UNION ALL
      SELECT 'alias#' || a.logical_id::text || '#' || a.alias
        FROM public.exercise_catalog_run_items ri
        JOIN public.exercise_catalog_aliases a ON a.id = ri.catalog_alias_id
       WHERE ri.run_id = v_run.id AND ri.catalog_alias_id IS NOT NULL
    ) x;
  IF v_line IS DISTINCT FROM
        'exercise#e21b2c00-0000-4000-a000-000000000004'
     || E'\n' || 'exercise#e21b2c00-0000-4000-a000-000000000005'
     || E'\n' || 'exercise#e21b2c00-0000-4000-a000-000000000006'
     || E'\n' || 'exercise#e21b2c00-0000-4000-a000-000000000007'
     || E'\n' || 'exercise#e21b2c00-0000-4000-a000-000000000008' THEN
    RAISE EXCEPTION 'W14E-6 run staging: the membership is not exactly the five governed exercise members with zero alias members; rolling back everything (got: %)', coalesce(v_line, '<none>');
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_run_items ri
       WHERE ri.run_id <> v_run.id
         AND ri.run_id <> (SELECT r.id FROM public.exercise_catalog_import_runs r WHERE r.run_key = 'exlib2u-plank-release1-staged-v1')) <> 0 THEN
    RAISE EXCEPTION 'W14E-6 run staging: membership rows exist outside the new run and the historical plank run; rolling back everything';
  END IF;
  SELECT count(*) FILTER (WHERE ri.catalog_id IS NOT NULL),
         count(*) FILTER (WHERE ri.catalog_alias_id IS NOT NULL)
    INTO v_exercise_members, v_alias_members
  FROM public.exercise_catalog_run_items ri
  WHERE ri.run_id = v_run.id;
  IF COALESCE(v_exercise_members, 0) <> 5 OR COALESCE(v_alias_members, 0) <> 0 THEN
    RAISE EXCEPTION 'W14E-6 run staging: seal-shape counts are %/% (expected 5 exercise + 0 alias members); rolling back everything', v_exercise_members, v_alias_members;
  END IF;
  SELECT count(*) INTO v_unready
    FROM public.exercise_catalog_run_items ri
    JOIN public.exercise_catalog c ON c.id = ri.catalog_id
   WHERE ri.run_id = v_run.id
     AND (c.review_status <> 'approved'
          OR c.is_active = false
          OR c.reviewed_by IS NULL
          OR char_length(btrim(c.reviewed_by)) = 0
          OR c.review_rationale IS NULL
          OR char_length(btrim(c.review_rationale)) = 0);
  IF v_unready <> 0 THEN
    RAISE EXCEPTION 'W14E-6 run staging: % exercise member(s) would fail the seal validation; rolling back everything', v_unready;
  END IF;
  -- STRUCTURAL NON-DELIVERABILITY: the delivery predicate, evaluated - never the function
  IF (SELECT count(*) FROM public.exercise_catalog_import_runs r
       WHERE r.run_key = <<UNRESOLVED:C.run_key_literal>>
         AND r.approved_for_delivery = true
         AND r.dry_run = false
         AND r.sealed_at IS NOT NULL
         AND r.revoked_at IS NULL) <> 0 THEN
    RAISE EXCEPTION 'W14E-6 run staging: the staged run satisfies the delivery predicate (it must NOT); rolling back everything';
  END IF;
  IF (SELECT md5(coalesce(string_agg(l::text, '|' ORDER BY l.id), '-')) FROM public.exercise_catalog_logical l) IS DISTINCT FROM v_cap.logical_digest
     OR (SELECT md5(coalesce(string_agg(c::text, '|' ORDER BY c.logical_id, c.catalog_version), '-')) FROM public.exercise_catalog c) IS DISTINCT FROM v_cap.snapshots_digest
     OR (SELECT md5(coalesce(string_agg(e::text, '|' ORDER BY e.id), '-')) FROM public.exercise_catalog_review_events e) IS DISTINCT FROM v_cap.events_digest
     OR (SELECT md5(coalesce(string_agg(m::text, '|' ORDER BY m.catalog_id, m.muscle), '-')) FROM public.exercise_catalog_muscles m) IS DISTINCT FROM v_cap.anatomy_digest
     OR (SELECT md5(coalesce(string_agg(a::text, '|' ORDER BY a.logical_id, a.alias), '-')) FROM public.exercise_catalog_aliases a) IS DISTINCT FROM v_cap.alias_digest
     OR (SELECT md5(coalesce(string_agg(n::text, '|' ORDER BY n.normalized_name), '-')) FROM public.exercise_catalog_name_claims n) IS DISTINCT FROM v_cap.claims_digest
     OR (SELECT md5(coalesce(string_agg(c::text, '|' ORDER BY c.id), '-')) FROM public.exercise_catalog_content c) IS DISTINCT FROM v_cap.content_digest
     OR (SELECT md5(coalesce(string_agg(x::text, '|' ORDER BY x.content_id, x.relation, x.to_logical_id), '-')) FROM public.exercise_catalog_content_expected_relationships x) IS DISTINCT FROM v_cap.expected_rel_digest
     OR (SELECT md5(coalesce(string_agg(r::text, '|' ORDER BY r.from_logical_id, r.relation, r.to_logical_id), '-')) FROM public.exercise_catalog_relationships r) IS DISTINCT FROM v_cap.projection_digest THEN
    RAISE EXCEPTION 'W14E-6 run staging: a surface this package must not change has changed (logical_digest, snapshots_digest, events_digest, anatomy_digest, alias_digest, claims_digest, content_digest, expected_rel_digest, projection_digest); rolling back everything';
  END IF;
  IF (SELECT r::text FROM public.exercise_catalog_import_runs r WHERE r.run_key = 'exlib2u-plank-release1-staged-v1') IS DISTINCT FROM v_cap.historical_run_row
     OR (SELECT md5(coalesce(string_agg(ri::text, '|' ORDER BY ri.id), '-'))
           FROM public.exercise_catalog_run_items ri
           JOIN public.exercise_catalog_import_runs r ON r.id = ri.run_id
          WHERE r.run_key = 'exlib2u-plank-release1-staged-v1') IS DISTINCT FROM v_cap.historical_items_digest THEN
    RAISE EXCEPTION 'W14E-6 run staging: the historical sealed plank run exlib2u-plank-release1-staged-v1 or its membership changed; this package never touches it; rolling back everything';
  END IF;
  IF (SELECT md5(coalesce(string_agg(am::text, '|' ORDER BY am.roleid, am.member, am.grantor), '-'))
        FROM pg_catalog.pg_auth_members am
        JOIN pg_roles g ON g.oid = am.roleid
       WHERE g.rolname IN ('exlib_catalog_loader','exlib_catalog_reviewer','exlib_catalog_admission','exlib_catalog_admin')) IS DISTINCT FROM v_cap.authority_digest THEN
    RAISE EXCEPTION 'W14E-6 run staging: the catalog authority memberships changed across the act - whole rows compared: member, grantor, every option column; rolling back everything';
  END IF;
  IF (SELECT count(*)::text || ':' || md5(coalesce(string_agg(t::text, '|' ORDER BY t.id), '-')) FROM public.exercises t) IS DISTINCT FROM v_cap.tenant_digest
     OR (SELECT count(*)::text || ':' || md5(coalesce(string_agg(t::text, '|' ORDER BY t.id), '-')) FROM public.exercise_aliases t) IS DISTINCT FROM v_cap.tenant_alias_digest
     OR (SELECT count(*)::text || ':' || md5(coalesce(string_agg(t::text, '|' ORDER BY t.id), '-')) FROM public.exercise_muscles t) IS DISTINCT FROM v_cap.tenant_muscle_digest THEN
    RAISE EXCEPTION 'W14E-6 run staging: a tenant surface (exercises, exercise_aliases, exercise_muscles) changed inside the gated interval; NO tenant delivery occurs in this package; rolling back everything';
  END IF;
  IF (SELECT orphaned_claims::text || '/' || unclaimed_bearers::text FROM public.exlib_verify_catalog_claims()) <> '0/0' THEN
    RAISE EXCEPTION 'W14E-6 run staging: the bidirectional catalog name-claim invariant does not hold; rolling back everything';
  END IF;
END
$post$;

-- surfaced result (display evidence; the committed rows are the proof)
SELECT 'W14E-6 RUN STAGED' AS result,
       (SELECT
          (SELECT count(*) FROM public.exercise_catalog_logical)::text
          || '/' || (SELECT count(*) FROM public.exercise_catalog)::text
          || '/' || (SELECT count(*) FROM public.exercise_catalog_muscles)::text
          || '/' || (SELECT count(*) FROM public.exercise_catalog_aliases)::text
          || '/' || (SELECT count(*) FROM public.exercise_catalog_name_claims)::text
          || '/' || (SELECT count(*) FROM public.exercise_catalog_content)::text
          || '/' || (SELECT count(*) FROM public.exercise_catalog_content_expected_relationships)::text
          || '/' || (SELECT count(*) FROM public.exercise_catalog_relationships)::text
          || '/' || (SELECT count(*) FROM public.exercise_catalog_import_runs)::text
          || '/' || (SELECT count(*) FROM public.exercise_catalog_run_items)::text
          || '/' || (SELECT count(*) FROM public.exercise_catalog_review_events)::text) AS vector,
       (SELECT count(*) FROM public.exercise_catalog_import_runs) AS runs,
       (SELECT count(*) FROM public.exercise_catalog_run_items) AS run_items,
       (SELECT (r.dry_run = false AND r.approved_for_delivery = false AND r.sealed_at IS NULL AND r.revoked_at IS NULL)
          FROM public.exercise_catalog_import_runs r WHERE r.run_key = <<UNRESOLVED:C.run_key_literal>>) AS staged_non_deliverable;

COMMIT;
