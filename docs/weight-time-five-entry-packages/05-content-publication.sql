-- ============================================================
-- W14-E stage 5 of 7 - CONTENT PUBLICATION for the five weight_time identities
-- STATUS: TEMPLATE - NOT EXECUTABLE - human decision leaves UNRESOLVED
--
-- GENERATED FILE. Do not edit by hand - regenerate:
--   npx tsx scripts/generate-weight-time-five-entry-packages.ts
-- Every value is derived from docs/weight-time-five-entry-lifecycle-manifest.json and the
-- three human decision forms (families A and B gated).
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
--   - performs EXACTLY FIVE public.publish_catalog_content calls under the exlib_catalog_admin authority over the APPROVED AND ADMITTED content rows; publication and the RELATIONSHIP PROJECTION are ONE ATOMIC ACT by schema design - and because every five-entry expected set is EMPTY, each projection swap makes an empty set live, and the relationships table does not change at all (no separate projection package exists or is needed)
--   - the content freeze trigger STRUCTURALLY re-verifies projected-set equality and admission-manifest freshness at draft -> published, for every caller
--   - DATABASE PUBLICATION IS NOT PRODUCT DELIVERY: the catalog tables keep RLS with zero policies and no anon/authenticated privileges; nothing here is visible to a tenant and no tenant row changes
--   - LOAD-BEARING SEPARATION: publication must travel alone; the vector does not move
--   - NO run, membership, seal, revocation, delivery, tenant change or environment change
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
-- POSITION IN THE SEQUENCE: stage 5 of 7. Vector before 8/8/10/3/11/6/2/2/1/6/8,
-- after 8/8/10/3/11/6/2/2/1/6/8 (nothing; relationships stay 2 because every projected set is empty).
-- ============================================================

BEGIN;
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;

-- TEMPLATE RENDERING: NOT EXECUTABLE. 85 human decision leaves are blank:
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
-- The next line is a deliberate syntax error so nothing below can ever run.
SELECT <<UNRESOLVED-TEMPLATE: 85 human decision leaves are blank; regenerate from COMPLETED forms>>;

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
CREATE TEMP TABLE w14e5_capture ON COMMIT DROP AS
SELECT
  (SELECT md5(coalesce(string_agg(l::text, '|' ORDER BY l.id), '-')) FROM public.exercise_catalog_logical l) AS logical_digest,
  (SELECT md5(coalesce(string_agg(c::text, '|' ORDER BY c.logical_id, c.catalog_version), '-')) FROM public.exercise_catalog c) AS snapshots_digest,
  (SELECT md5(coalesce(string_agg(e::text, '|' ORDER BY e.id), '-')) FROM public.exercise_catalog_review_events e) AS events_digest,
  (SELECT md5(coalesce(string_agg(m::text, '|' ORDER BY m.catalog_id, m.muscle), '-')) FROM public.exercise_catalog_muscles m) AS anatomy_digest,
  (SELECT md5(coalesce(string_agg(a::text, '|' ORDER BY a.logical_id, a.alias), '-')) FROM public.exercise_catalog_aliases a) AS alias_digest,
  (SELECT md5(coalesce(string_agg(n::text, '|' ORDER BY n.normalized_name), '-')) FROM public.exercise_catalog_name_claims n) AS claims_digest,
  (SELECT md5(coalesce(string_agg(c::text, '|' ORDER BY c.id), '-')) FROM public.exercise_catalog_content c WHERE c.logical_id NOT IN ('e21b2c00-0000-4000-a000-000000000004', 'e21b2c00-0000-4000-a000-000000000005', 'e21b2c00-0000-4000-a000-000000000006', 'e21b2c00-0000-4000-a000-000000000007', 'e21b2c00-0000-4000-a000-000000000008')) AS content_outside_five,
  (SELECT md5(coalesce(string_agg(x::text, '|' ORDER BY x.content_id, x.relation, x.to_logical_id), '-')) FROM public.exercise_catalog_content_expected_relationships x) AS expected_rel_digest,
  (SELECT md5(coalesce(string_agg(r::text, '|' ORDER BY r.from_logical_id, r.relation, r.to_logical_id), '-')) FROM public.exercise_catalog_relationships r) AS projection_digest,
  (SELECT md5(coalesce(string_agg(r::text, '|' ORDER BY r.id), '-')) FROM public.exercise_catalog_import_runs r) AS runs_digest,
  (SELECT md5(coalesce(string_agg(ri::text, '|' ORDER BY ri.id), '-')) FROM public.exercise_catalog_run_items ri) AS run_items_digest,
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

-- ── Preconditions (owner-role reads, BEFORE any authority change) ─────
DO $pre$
DECLARE
  v_counts TEXT;
  v_line   TEXT;
BEGIN
  RAISE EXCEPTION 'W14E-5 content publication: TEMPLATE RENDERING with unresolved human decision leaves; this file is not executable and must be regenerated from COMPLETED forms';
  IF to_regprocedure('public.publish_catalog_content(uuid,uuid)') IS NULL THEN
    RAISE EXCEPTION 'W14E-5 content publication: migration-027 publish_catalog_content is missing at its exact signature; wrong or unmigrated database';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'exlib_catalog_admin') THEN
    RAISE EXCEPTION 'W14E-5 content publication: admin role missing';
  END IF;
  IF current_user <> 'postgres' OR session_user <> 'postgres' THEN
    RAISE EXCEPTION 'W14E-5 content publication: BOTH execution identities must be the hosted operator role postgres (got current_user=%, session_user=%); refusing before any write or authority change', current_user, session_user;
  END IF;
  IF (SELECT rolsuper FROM pg_roles WHERE rolname = current_user) THEN
    RAISE EXCEPTION 'W14E-5 content publication: the invoker is a superuser; this package is bound to the hosted non-superuser postgres posture';
  END IF;
  IF (SELECT count(*) FROM pg_catalog.pg_auth_members am
        JOIN pg_roles r ON r.oid = am.roleid
       WHERE r.rolname = 'exlib_catalog_admin') <> 1
     OR NOT EXISTS (
       SELECT 1 FROM pg_catalog.pg_auth_members am
         JOIN pg_roles r ON r.oid = am.roleid
         JOIN pg_roles m ON m.oid = am.member
         JOIN pg_roles g ON g.oid = am.grantor
        WHERE r.rolname = 'exlib_catalog_admin' AND m.rolname = 'postgres'
          AND g.rolname = 'supabase_admin'
          AND am.admin_option AND NOT am.inherit_option AND NOT am.set_option) THEN
    RAISE EXCEPTION 'W14E-5 content publication: the exlib_catalog_admin membership posture is not the exact hosted baseline (exactly one membership: postgres granted BY supabase_admin with ADMIN TRUE, INHERIT FALSE, SET FALSE - grantor included); refusing before any write or authority change';
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
    RAISE EXCEPTION 'W14E-5 content publication: the catalog surface is not the exact expected pre-state (expected 8/8/10/3/11/6/2/2/1/6/8, found %); this ONE-USE package refuses to run twice, over foreign state, or over an ambiguous surface - READ STATE FIRST', v_counts;
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_import_runs r
       WHERE r.run_key = 'exlib2u-plank-release1-staged-v1'
         AND r.approved_for_delivery = true AND r.dry_run = false
         AND r.sealed_at IS NOT NULL AND r.revoked_at IS NULL) <> 1
     OR (SELECT count(*) FROM public.exercise_catalog_run_items ri
           JOIN public.exercise_catalog_import_runs r ON r.id = ri.run_id
          WHERE r.run_key = 'exlib2u-plank-release1-staged-v1') <> 6 THEN
    RAISE EXCEPTION 'W14E-5 content publication: the historical plank release run exlib2u-plank-release1-staged-v1 is not exactly one sealed, approved, non-dry, unrevoked run with six membership rows; the world is not the evidenced post-W14 hosted state; refusing';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_content c
       WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000001' AND c.publication_status = 'published'
         AND c.import_admitted = true
         AND c.admitted_fingerprint = public.exlib_content_admission_fingerprint(c.id)) <> 1 THEN
    RAISE EXCEPTION 'W14E-5 content publication: the published, admitted, fingerprint-fresh Plank content row is not exactly present; refusing';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_logical WHERE id IN ('e21b2c00-0000-4000-a000-000000000009', 'e21b2c00-0000-4000-a000-00000000000a', 'e21b2c00-0000-4000-a000-00000000000b')) <> 0
     OR (SELECT count(*) FROM public.exercise_catalog WHERE lower(canonical_name) ~ 'carry|farmer|suitcase|sandbag') <> 0 THEN
    RAISE EXCEPTION 'W14E-5 content publication: a deferred carry identity (inventory lines 134, 135, 136) is present in the catalog; the carries are DEFERRED and this lifecycle never touches them; refusing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.exercise_catalog e
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000004' AND e.is_active = true
         AND e.review_status = 'approved'
         AND e.reviewed_by = <<UNRESOLVED:A.132.reviewer>>
         AND e.reviewed_at = <<UNRESOLVED:A.132.reviewed_at>>
         AND e.review_rationale = <<UNRESOLVED:A.132.rationale>>) THEN
    RAISE EXCEPTION 'W14E-5 content publication: inventory line 132 does not bear the exact family A approval tuple; refusing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.exercise_catalog e
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000005' AND e.is_active = true
         AND e.review_status = 'approved'
         AND e.reviewed_by = <<UNRESOLVED:A.133.reviewer>>
         AND e.reviewed_at = <<UNRESOLVED:A.133.reviewed_at>>
         AND e.review_rationale = <<UNRESOLVED:A.133.rationale>>) THEN
    RAISE EXCEPTION 'W14E-5 content publication: inventory line 133 does not bear the exact family A approval tuple; refusing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.exercise_catalog e
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000006' AND e.is_active = true
         AND e.review_status = 'approved'
         AND e.reviewed_by = <<UNRESOLVED:A.137.reviewer>>
         AND e.reviewed_at = <<UNRESOLVED:A.137.reviewed_at>>
         AND e.review_rationale = <<UNRESOLVED:A.137.rationale>>) THEN
    RAISE EXCEPTION 'W14E-5 content publication: inventory line 137 does not bear the exact family A approval tuple; refusing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.exercise_catalog e
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000007' AND e.is_active = true
         AND e.review_status = 'approved'
         AND e.reviewed_by = <<UNRESOLVED:A.138.reviewer>>
         AND e.reviewed_at = <<UNRESOLVED:A.138.reviewed_at>>
         AND e.review_rationale = <<UNRESOLVED:A.138.rationale>>) THEN
    RAISE EXCEPTION 'W14E-5 content publication: inventory line 138 does not bear the exact family A approval tuple; refusing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.exercise_catalog e
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000008' AND e.is_active = true
         AND e.review_status = 'approved'
         AND e.reviewed_by = <<UNRESOLVED:A.139.reviewer>>
         AND e.reviewed_at = <<UNRESOLVED:A.139.reviewed_at>>
         AND e.review_rationale = <<UNRESOLVED:A.139.rationale>>) THEN
    RAISE EXCEPTION 'W14E-5 content publication: inventory line 139 does not bear the exact family A approval tuple; refusing';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_content c WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000004') <> 1
     OR NOT EXISTS (SELECT 1 FROM public.exercise_catalog_content c
       WHERE c.id = 'e21b2c00-0000-4000-a000-000000000104'
         AND c.logical_id = 'e21b2c00-0000-4000-a000-000000000004'
         AND c.content_version = 1
         AND c.authored_by = $pab132$ForgeFitOS content program (AI-drafted original prose; pending human specialist review)$pab132$
         AND c.authored_at = DATE '2026-09-11'
         AND c.setup_steps = $pse132$["Set your forearms on the floor shoulder-width apart with your elbows under your shoulders, then extend your legs into one straight line from heels to head.","Have a partner set one weight plate flat across your upper back, centred between your shoulder blades, never on your neck or lower back.","Choose a plate you could hold for at least half your unweighted plank time; the added load raises the difficulty and does not replace the position."]$pse132$::jsonb
         AND c.execution_steps = $pex132$["Brace your abs and squeeze your glutes so your hips stay level with your shoulders and the plate sits flat without rocking.","Hold the position and keep breathing; a plate that stays still is the clearest sign your torso is not shifting underneath it.","End the hold the moment your hips sag or your lower back starts to arch, and have the plate lifted off before you come down.","Record the weight you held and the duration you completed; this exercise is scored as added weight plus time, never as repetitions."]$pex132$::jsonb
         AND c.breathing_cue = $pbr132$Take smaller breaths than usual and keep them continuous through the hold; never hold your breath to brace, because a long hold needs steady airflow.$pbr132$
         AND c.common_mistakes = $pcm132$["Letting the hips drift up into a pike, which shortens the lever and makes the added plate easier than the logged weight suggests.","Placing the plate low on the lower back, where it loads the spine instead of the mid-back and hides a sagging position.","Reaching for a heavier plate before the unweighted hold is solid, so the position fails before the trunk is actually challenged."]$pcm132$::jsonb
         AND c.safety_guidance = $psg132$Have the plate placed and removed by another person whenever you can, because sliding a plate on or off alone tends to twist the torso under load. Keep the plate off the neck and off the lower back, and end the hold at the first loss of a flat, level torso rather than pushing to failure with weight on your back.$psg132$
         AND c.equipment_setup = $pes132$One flat weight plate and a mat. A bumper plate sits more stably than a thin iron plate, and a training partner to place and remove it is strongly preferred.$pes132$
         AND c.accessibility_alternative = $paa132$Hold an unweighted plank for the same duration, or hold the position with your knees on the floor and no plate, adding time before you add any load.$paa132$
         AND c.content_status = 'approved'
         AND c.reviewed_by = <<UNRESOLVED:B.132.reviewer>>
         AND c.reviewed_at = <<UNRESOLVED:B.132.reviewed_at>>
         AND c.review_rationale = <<UNRESOLVED:B.132.rationale>>
         AND c.import_admitted = true
         AND c.admitted_source_sha256 = 'fb13ea5283e7ab13953471bb323e8fe9df9ce707e718751c477495068fea2921'
         AND c.admitted_fingerprint = <<UNRESOLVED:B.132.admission_fingerprint(derived)>>
         AND c.admitted_fingerprint = public.exlib_content_admission_fingerprint(c.id)
         AND c.admitted_at IS NOT NULL
         AND c.publication_status = 'draft') THEN
    RAISE EXCEPTION 'W14E-5 content publication: the content row for inventory line 132 is not the exact admitted pre-publication state (payload, family B tuple, admission provenance, admission freshness, or the approved/admitted/DRAFT lifecycle drifted - a second publication is refused by design; READ STATE FIRST); refusing before any write or authority change';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_relationships r WHERE r.from_logical_id = 'e21b2c00-0000-4000-a000-000000000004') <> 0 THEN
    RAISE EXCEPTION 'W14E-5 content publication: a projected relationship already exists for inventory line 132; publication is one-way and this package never re-projects; refusing';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_content c WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000005') <> 1
     OR NOT EXISTS (SELECT 1 FROM public.exercise_catalog_content c
       WHERE c.id = 'e21b2c00-0000-4000-a000-000000000105'
         AND c.logical_id = 'e21b2c00-0000-4000-a000-000000000005'
         AND c.content_version = 1
         AND c.authored_by = $pab133$ForgeFitOS content program (AI-drafted original prose; pending human specialist review)$pab133$
         AND c.authored_at = DATE '2026-09-11'
         AND c.setup_steps = $pse133$["Fit the vest before you get down: tighten the straps so it sits high on the torso and cannot slide toward your head once you are horizontal.","Set your forearms shoulder-width apart with your elbows under your shoulders, then extend your legs into one straight line from heels to head.","Choose a vest load you could hold for at least half your unweighted plank time, and check that the weight is even front to back."]$pse133$::jsonb
         AND c.execution_steps = $pex133$["Brace your abs and squeeze your glutes so the vest's load stays over your mid-torso instead of dragging your hips toward the floor.","Hold the position and keep breathing; a vest that rides forward means the straps need tightening, not that you should push on.","End the hold when your hips sag or your lower back arches, then lower your knees before standing so the vest does not swing.","Record the vest weight and the duration you completed; this exercise is scored as added weight plus time, never as repetitions."]$pex133$::jsonb
         AND c.breathing_cue = $pbr133$Take smaller breaths than usual and keep them continuous; a snug vest limits how far the ribcage can expand, so do not brace by holding your breath.$pbr133$
         AND c.common_mistakes = $pcm133$["Wearing the vest loose, so it slides toward the shoulders and moves the load off the mid-torso partway through the hold.","Letting the hips sag under the extra load, which turns a trunk hold into a lower-back hold.","Adding vest weight in large jumps, because a spread-out load is easy to underestimate until the position fails.","Treating the vest as a way to extend a hold rather than as a separate, shorter, heavier effort."]$pcm133$::jsonb
         AND c.safety_guidance = $psg133$Check the straps and weight pockets before every set, because a pocket that comes loose during a hold drops load unpredictably. Keep the load balanced front to back, and end the hold at the first loss of a flat, level torso instead of pushing to failure while wearing weight.$psg133$
         AND c.equipment_setup = $pes133$A weighted vest with secured, evenly distributed weight pockets, and a mat. Confirm the straps are snug and every pocket is closed before you start the hold.$pes133$
         AND c.accessibility_alternative = $paa133$Hold an unweighted plank for the same duration, or wear the vest for a shorter hold and build the time back up before adding any pockets.$paa133$
         AND c.content_status = 'approved'
         AND c.reviewed_by = <<UNRESOLVED:B.133.reviewer>>
         AND c.reviewed_at = <<UNRESOLVED:B.133.reviewed_at>>
         AND c.review_rationale = <<UNRESOLVED:B.133.rationale>>
         AND c.import_admitted = true
         AND c.admitted_source_sha256 = 'fb13ea5283e7ab13953471bb323e8fe9df9ce707e718751c477495068fea2921'
         AND c.admitted_fingerprint = <<UNRESOLVED:B.133.admission_fingerprint(derived)>>
         AND c.admitted_fingerprint = public.exlib_content_admission_fingerprint(c.id)
         AND c.admitted_at IS NOT NULL
         AND c.publication_status = 'draft') THEN
    RAISE EXCEPTION 'W14E-5 content publication: the content row for inventory line 133 is not the exact admitted pre-publication state (payload, family B tuple, admission provenance, admission freshness, or the approved/admitted/DRAFT lifecycle drifted - a second publication is refused by design; READ STATE FIRST); refusing before any write or authority change';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_relationships r WHERE r.from_logical_id = 'e21b2c00-0000-4000-a000-000000000005') <> 0 THEN
    RAISE EXCEPTION 'W14E-5 content publication: a projected relationship already exists for inventory line 133; publication is one-way and this package never re-projects; refusing';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_content c WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000006') <> 1
     OR NOT EXISTS (SELECT 1 FROM public.exercise_catalog_content c
       WHERE c.id = 'e21b2c00-0000-4000-a000-000000000106'
         AND c.logical_id = 'e21b2c00-0000-4000-a000-000000000006'
         AND c.content_version = 1
         AND c.authored_by = $pab137$ForgeFitOS content program (AI-drafted original prose; pending human specialist review)$pab137$
         AND c.authored_at = DATE '2026-09-11'
         AND c.setup_steps = $pse137$["Attach the weight to a dipping belt around your hips, or set a plate to hold between your feet, before you reach for the bar.","Set your hands on the bar just outside shoulder width with a full overhand grip and your thumbs wrapped around it.","Step off a box rather than jumping up, so the added weight does not swing and load your shoulders all at once."]$pse137$::jsonb
         AND c.execution_steps = $pex137$["Hang with your arms straight and your shoulders active rather than fully slack, keeping your body still.","Keep your grip closed and your legs quiet so the weight hangs plumb underneath you instead of swinging.","Release when your grip starts to open, then step down under control; never drop from the bar with weight attached.","Record the added weight and the duration you completed; this exercise is scored as added weight plus time, never as repetitions."]$pex137$::jsonb
         AND c.breathing_cue = $pbr137$Breathe steadily and evenly through the hang; holding your breath to squeeze the bar ends the hold well before your grip actually gives out.$pbr137$
         AND c.common_mistakes = $pcm137$["Jumping up to the bar with weight attached, which loads the shoulders and grip before the hang has even started.","Letting the body swing, so the grip fights momentum instead of holding one steady load.","Using a thumbless grip under added weight, which gives up the most secure part of the hold.","Adding weight before an unweighted hang is comfortable for a full minute."]$pcm137$::jsonb
         AND c.safety_guidance = $psg137$Hang over a clear floor and set the bar at a height that lets you step off and step back down with the weight still attached. Carry the load on a belt or held firmly between the feet rather than balanced, and release the bar deliberately, because dropping from a loaded hang puts the whole load on the shoulders at once.$psg137$
         AND c.equipment_setup = $pes137$A secure pull-up bar rated for your bodyweight plus the added load, and a dipping belt with a weight plate, or a plate held securely between the feet.$pes137$
         AND c.accessibility_alternative = $paa137$Hang from the bar with no added weight for the same duration, or use a lower bar with your feet on the floor so your legs carry part of the load.$paa137$
         AND c.content_status = 'approved'
         AND c.reviewed_by = <<UNRESOLVED:B.137.reviewer>>
         AND c.reviewed_at = <<UNRESOLVED:B.137.reviewed_at>>
         AND c.review_rationale = <<UNRESOLVED:B.137.rationale>>
         AND c.import_admitted = true
         AND c.admitted_source_sha256 = 'fb13ea5283e7ab13953471bb323e8fe9df9ce707e718751c477495068fea2921'
         AND c.admitted_fingerprint = <<UNRESOLVED:B.137.admission_fingerprint(derived)>>
         AND c.admitted_fingerprint = public.exlib_content_admission_fingerprint(c.id)
         AND c.admitted_at IS NOT NULL
         AND c.publication_status = 'draft') THEN
    RAISE EXCEPTION 'W14E-5 content publication: the content row for inventory line 137 is not the exact admitted pre-publication state (payload, family B tuple, admission provenance, admission freshness, or the approved/admitted/DRAFT lifecycle drifted - a second publication is refused by design; READ STATE FIRST); refusing before any write or authority change';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_relationships r WHERE r.from_logical_id = 'e21b2c00-0000-4000-a000-000000000006') <> 0 THEN
    RAISE EXCEPTION 'W14E-5 content publication: a projected relationship already exists for inventory line 137; publication is one-way and this package never re-projects; refusing';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_content c WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000007') <> 1
     OR NOT EXISTS (SELECT 1 FROM public.exercise_catalog_content c
       WHERE c.id = 'e21b2c00-0000-4000-a000-000000000107'
         AND c.logical_id = 'e21b2c00-0000-4000-a000-000000000007'
         AND c.content_version = 1
         AND c.authored_by = $pab138$ForgeFitOS content program (AI-drafted original prose; pending human specialist review)$pab138$
         AND c.authored_at = DATE '2026-09-11'
         AND c.setup_steps = $pse138$["Stand with your back flat against a wall, then walk your feet forward and slide down until your thighs are parallel to the floor.","Check that your knees sit above your heels rather than ahead of your toes, and that your whole back stays against the wall.","Once you are already in position, have a plate placed on your thighs close to your hips and hold it there with both hands."]$pse138$::jsonb
         AND c.execution_steps = $pex138$["Press your back into the wall and drive through both feet evenly so the plate stays level across your thighs.","Hold with your knees at roughly a right angle and your weight through the whole foot rather than the toes.","End the hold when your thighs rise out of parallel or your back peels off the wall, then set the plate down before standing.","Record the plate weight and the duration you completed; this exercise is scored as added weight plus time, never as repetitions."]$pex138$::jsonb
         AND c.breathing_cue = $pbr138$Keep breathing evenly the whole way through; the burn will tempt you to hold your breath, which ends the hold sooner than your legs would.$pbr138$
         AND c.common_mistakes = $pcm138$["Sliding up out of parallel as the hold gets hard, which quietly makes the effort easier than the logged time suggests.","Resting the plate on the knees instead of near the hips, where it shifts the load and tends to slide.","Letting the knees travel forward past the toes, which moves the effort off the thighs.","Coming out of the hold by standing up with the plate still resting on the thighs."]$pcm138$::jsonb
         AND c.safety_guidance = $psg138$Get into the seated position first and have the plate placed afterwards, because picking a plate up while already holding a wall sit tends to pull you out of position. Keep both hands on the plate so it cannot slide off your thighs, and set it down before you stand.$psg138$
         AND c.equipment_setup = $pes138$A flat wall and one weight plate held on the thighs near the hips. A bumper plate is easier to keep flat than a thin iron plate.$pes138$
         AND c.accessibility_alternative = $paa138$Hold the wall sit with no plate for the same duration, or sit higher than parallel and add depth before you add any weight.$paa138$
         AND c.content_status = 'approved'
         AND c.reviewed_by = <<UNRESOLVED:B.138.reviewer>>
         AND c.reviewed_at = <<UNRESOLVED:B.138.reviewed_at>>
         AND c.review_rationale = <<UNRESOLVED:B.138.rationale>>
         AND c.import_admitted = true
         AND c.admitted_source_sha256 = 'fb13ea5283e7ab13953471bb323e8fe9df9ce707e718751c477495068fea2921'
         AND c.admitted_fingerprint = <<UNRESOLVED:B.138.admission_fingerprint(derived)>>
         AND c.admitted_fingerprint = public.exlib_content_admission_fingerprint(c.id)
         AND c.admitted_at IS NOT NULL
         AND c.publication_status = 'draft') THEN
    RAISE EXCEPTION 'W14E-5 content publication: the content row for inventory line 138 is not the exact admitted pre-publication state (payload, family B tuple, admission provenance, admission freshness, or the approved/admitted/DRAFT lifecycle drifted - a second publication is refused by design; READ STATE FIRST); refusing before any write or authority change';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_relationships r WHERE r.from_logical_id = 'e21b2c00-0000-4000-a000-000000000007') <> 0 THEN
    RAISE EXCEPTION 'W14E-5 content publication: a projected relationship already exists for inventory line 138; publication is one-way and this package never re-projects; refusing';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_content c WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000008') <> 1
     OR NOT EXISTS (SELECT 1 FROM public.exercise_catalog_content c
       WHERE c.id = 'e21b2c00-0000-4000-a000-000000000108'
         AND c.logical_id = 'e21b2c00-0000-4000-a000-000000000008'
         AND c.content_version = 1
         AND c.authored_by = $pab139$ForgeFitOS content program (AI-drafted original prose; pending human specialist review)$pab139$
         AND c.authored_at = DATE '2026-09-11'
         AND c.setup_steps = $pse139$["Fit and tighten the vest while standing, so it sits snug on the torso and will not slide up once your back is against the wall.","Stand with your back flat against the wall, walk your feet forward, and slide down until your thighs are parallel to the floor.","Check that your knees sit above your heels and that the vest is not bunched between your back and the wall."]$pse139$::jsonb
         AND c.execution_steps = $pex139$["Press your back into the wall and drive through both feet evenly, keeping the vest's load centred over your hips.","Hold with your knees at roughly a right angle and your hands free at your sides or folded across your chest.","End the hold when your thighs rise out of parallel or your back peels off the wall, then stand up under control.","Record the vest weight and the duration you completed; this exercise is scored as added weight plus time, never as repetitions."]$pex139$::jsonb
         AND c.breathing_cue = $pbr139$Breathe evenly and continuously; a snug vest restricts the ribcage, so a held breath will end the hold before your legs do.$pbr139$
         AND c.common_mistakes = $pcm139$["Sliding up out of parallel as the hold gets hard, which makes the logged time overstate the work actually done.","Letting the vest bunch up behind the back, which pushes the torso off the wall and changes the angle.","Adding vest weight when sitting above parallel is what is really limiting the hold.","Letting the knees drift forward past the toes as fatigue sets in."]$pcm139$::jsonb
         AND c.safety_guidance = $psg139$Fit the vest before you get into position and check that its pockets are closed, because load shifting partway through a wall sit tends to pull the torso off the wall. Keep the whole foot planted and end the hold at the first loss of parallel rather than pushing to failure under load.$psg139$
         AND c.equipment_setup = $pes139$A flat wall and a weighted vest with secured, evenly distributed pockets. Because the hands stay free, a vest suits longer holds than a plate held on the thighs.$pes139$
         AND c.accessibility_alternative = $paa139$Hold the wall sit with no vest for the same duration, or wear the vest for a shorter hold and build the time back up before adding any pockets.$paa139$
         AND c.content_status = 'approved'
         AND c.reviewed_by = <<UNRESOLVED:B.139.reviewer>>
         AND c.reviewed_at = <<UNRESOLVED:B.139.reviewed_at>>
         AND c.review_rationale = <<UNRESOLVED:B.139.rationale>>
         AND c.import_admitted = true
         AND c.admitted_source_sha256 = 'fb13ea5283e7ab13953471bb323e8fe9df9ce707e718751c477495068fea2921'
         AND c.admitted_fingerprint = <<UNRESOLVED:B.139.admission_fingerprint(derived)>>
         AND c.admitted_fingerprint = public.exlib_content_admission_fingerprint(c.id)
         AND c.admitted_at IS NOT NULL
         AND c.publication_status = 'draft') THEN
    RAISE EXCEPTION 'W14E-5 content publication: the content row for inventory line 139 is not the exact admitted pre-publication state (payload, family B tuple, admission provenance, admission freshness, or the approved/admitted/DRAFT lifecycle drifted - a second publication is refused by design; READ STATE FIRST); refusing before any write or authority change';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_relationships r WHERE r.from_logical_id = 'e21b2c00-0000-4000-a000-000000000008') <> 0 THEN
    RAISE EXCEPTION 'W14E-5 content publication: a projected relationship already exists for inventory line 139; publication is one-way and this package never re-projects; refusing';
  END IF;
  IF (SELECT orphaned_claims::text || '/' || unclaimed_bearers::text FROM public.exlib_verify_catalog_claims()) <> '0/0' THEN
    RAISE EXCEPTION 'W14E-5 content publication: the bidirectional catalog name-claim invariant does not hold; refusing';
  END IF;
  IF has_function_privilege('anon', 'public.publish_catalog_content(uuid,uuid)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.publish_catalog_content(uuid,uuid)', 'EXECUTE')
     OR has_function_privilege('service_role', 'public.publish_catalog_content(uuid,uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'W14E-5 content publication: public.publish_catalog_content(uuid,uuid) is executable by an ordinary client role; refusing before any write or authority change';
  END IF;
  IF has_table_privilege('anon', 'public.exercise_catalog_relationships', 'SELECT')
     OR has_table_privilege('authenticated', 'public.exercise_catalog_relationships', 'SELECT') THEN
    RAISE EXCEPTION 'W14E-5 content publication: the protected projection table is readable by an ordinary client role; refusing before any write or authority change';
  END IF;
END
$pre$;

-- ── Transaction-contained elevation (posture-gated above; revoked
--    below; postcondition-verified restored; rolls back with the
--    whole transaction on ANY failure) ─────────────────────────────
GRANT exlib_catalog_admin TO postgres WITH SET TRUE, INHERIT FALSE;

-- ── Structural two-grantor proof, BEFORE SET ROLE or any call ─────
DO $auth$
BEGIN
  IF (SELECT count(*) FROM pg_catalog.pg_auth_members am
        JOIN pg_roles r ON r.oid = am.roleid
       WHERE r.rolname = 'exlib_catalog_admin') <> 2
     OR NOT EXISTS (
       SELECT 1 FROM pg_catalog.pg_auth_members am
         JOIN pg_roles r ON r.oid = am.roleid
         JOIN pg_roles m ON m.oid = am.member
         JOIN pg_roles g ON g.oid = am.grantor
        WHERE r.rolname = 'exlib_catalog_admin' AND m.rolname = 'postgres'
          AND g.rolname = 'supabase_admin'
          AND am.admin_option AND NOT am.inherit_option AND NOT am.set_option)
     OR NOT EXISTS (
       SELECT 1 FROM pg_catalog.pg_auth_members am
         JOIN pg_roles r ON r.oid = am.roleid
         JOIN pg_roles m ON m.oid = am.member
         JOIN pg_roles g ON g.oid = am.grantor
        WHERE r.rolname = 'exlib_catalog_admin' AND m.rolname = 'postgres'
          AND g.rolname = 'postgres'
          AND NOT am.admin_option AND NOT am.inherit_option AND am.set_option) THEN
    RAISE EXCEPTION 'W14E-5 content publication: the two-grantor membership shape after the temporary grant is not exact (supabase_admin-granted baseline row plus postgres-granted SET row); aborting before SET ROLE and before any call';
  END IF;
END
$auth$;

SET ROLE exlib_catalog_admin;

-- ── THE FIVE PUBLICATIONS, under the admin authority ONLY ─────────────
DO $act$
DECLARE
  v_result JSONB;
BEGIN
  v_result := public.publish_catalog_content(
    'e21b2c00-0000-4000-a000-000000000004',
    'e21b2c00-0000-4000-a000-000000000104');
  IF v_result IS DISTINCT FROM jsonb_build_object(
       'logical_id', 'e21b2c00-0000-4000-a000-000000000004',
       'published', 'e21b2c00-0000-4000-a000-000000000104',
       'retired', NULL,
       'content_version', 1,
       'projected_relationships', 0) THEN
    RAISE EXCEPTION 'W14E-5 content publication: publish_catalog_content for inventory line 132 returned % (not the exact derivable result: retired null because the identity carries exactly one content row, projected 0 because the expected set is empty); rolling back everything', v_result;
  END IF;
  v_result := public.publish_catalog_content(
    'e21b2c00-0000-4000-a000-000000000005',
    'e21b2c00-0000-4000-a000-000000000105');
  IF v_result IS DISTINCT FROM jsonb_build_object(
       'logical_id', 'e21b2c00-0000-4000-a000-000000000005',
       'published', 'e21b2c00-0000-4000-a000-000000000105',
       'retired', NULL,
       'content_version', 1,
       'projected_relationships', 0) THEN
    RAISE EXCEPTION 'W14E-5 content publication: publish_catalog_content for inventory line 133 returned % (not the exact derivable result: retired null because the identity carries exactly one content row, projected 0 because the expected set is empty); rolling back everything', v_result;
  END IF;
  v_result := public.publish_catalog_content(
    'e21b2c00-0000-4000-a000-000000000006',
    'e21b2c00-0000-4000-a000-000000000106');
  IF v_result IS DISTINCT FROM jsonb_build_object(
       'logical_id', 'e21b2c00-0000-4000-a000-000000000006',
       'published', 'e21b2c00-0000-4000-a000-000000000106',
       'retired', NULL,
       'content_version', 1,
       'projected_relationships', 0) THEN
    RAISE EXCEPTION 'W14E-5 content publication: publish_catalog_content for inventory line 137 returned % (not the exact derivable result: retired null because the identity carries exactly one content row, projected 0 because the expected set is empty); rolling back everything', v_result;
  END IF;
  v_result := public.publish_catalog_content(
    'e21b2c00-0000-4000-a000-000000000007',
    'e21b2c00-0000-4000-a000-000000000107');
  IF v_result IS DISTINCT FROM jsonb_build_object(
       'logical_id', 'e21b2c00-0000-4000-a000-000000000007',
       'published', 'e21b2c00-0000-4000-a000-000000000107',
       'retired', NULL,
       'content_version', 1,
       'projected_relationships', 0) THEN
    RAISE EXCEPTION 'W14E-5 content publication: publish_catalog_content for inventory line 138 returned % (not the exact derivable result: retired null because the identity carries exactly one content row, projected 0 because the expected set is empty); rolling back everything', v_result;
  END IF;
  v_result := public.publish_catalog_content(
    'e21b2c00-0000-4000-a000-000000000008',
    'e21b2c00-0000-4000-a000-000000000108');
  IF v_result IS DISTINCT FROM jsonb_build_object(
       'logical_id', 'e21b2c00-0000-4000-a000-000000000008',
       'published', 'e21b2c00-0000-4000-a000-000000000108',
       'retired', NULL,
       'content_version', 1,
       'projected_relationships', 0) THEN
    RAISE EXCEPTION 'W14E-5 content publication: publish_catalog_content for inventory line 139 returned % (not the exact derivable result: retired null because the identity carries exactly one content row, projected 0 because the expected set is empty); rolling back everything', v_result;
  END IF;
END
$act$;

RESET ROLE;

-- ── Exact restoration: remove ONLY the temporary grant this package
--    created, identified by its grantor ────────────────────────────
REVOKE exlib_catalog_admin FROM postgres GRANTED BY postgres;

-- ── Postconditions (owner reads; ANY mismatch rolls back ALL) ─────────
DO $post$
DECLARE
  v_counts TEXT;
  v_cap    RECORD;
BEGIN
  SELECT * INTO v_cap FROM w14e5_capture;
  IF (SELECT count(*) FROM pg_catalog.pg_auth_members am
        JOIN pg_roles r ON r.oid = am.roleid
       WHERE r.rolname = 'exlib_catalog_admin') <> 1
     OR NOT EXISTS (
       SELECT 1 FROM pg_catalog.pg_auth_members am
         JOIN pg_roles r ON r.oid = am.roleid
         JOIN pg_roles m ON m.oid = am.member
         JOIN pg_roles g ON g.oid = am.grantor
        WHERE r.rolname = 'exlib_catalog_admin' AND m.rolname = 'postgres'
          AND g.rolname = 'supabase_admin'
          AND am.admin_option AND NOT am.inherit_option AND NOT am.set_option)
     OR pg_has_role('postgres', 'exlib_catalog_admin', 'SET') THEN
    RAISE EXCEPTION 'W14E-5 content publication: authority restoration is not exact (baseline row plus zero standing SET capability required); rolling back everything';
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
    RAISE EXCEPTION 'W14E-5 content publication: post-state vector is % (expected 8/8/10/3/11/6/2/2/1/6/8); rolling back everything', v_counts;
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_content c WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000004' AND c.publication_status = 'published') <> 1
     OR NOT EXISTS (SELECT 1 FROM public.exercise_catalog_content c
       WHERE c.id = 'e21b2c00-0000-4000-a000-000000000104'
         AND c.logical_id = 'e21b2c00-0000-4000-a000-000000000004'
         AND c.content_version = 1
         AND c.authored_by = $qab132$ForgeFitOS content program (AI-drafted original prose; pending human specialist review)$qab132$
         AND c.authored_at = DATE '2026-09-11'
         AND c.setup_steps = $qse132$["Set your forearms on the floor shoulder-width apart with your elbows under your shoulders, then extend your legs into one straight line from heels to head.","Have a partner set one weight plate flat across your upper back, centred between your shoulder blades, never on your neck or lower back.","Choose a plate you could hold for at least half your unweighted plank time; the added load raises the difficulty and does not replace the position."]$qse132$::jsonb
         AND c.execution_steps = $qex132$["Brace your abs and squeeze your glutes so your hips stay level with your shoulders and the plate sits flat without rocking.","Hold the position and keep breathing; a plate that stays still is the clearest sign your torso is not shifting underneath it.","End the hold the moment your hips sag or your lower back starts to arch, and have the plate lifted off before you come down.","Record the weight you held and the duration you completed; this exercise is scored as added weight plus time, never as repetitions."]$qex132$::jsonb
         AND c.breathing_cue = $qbr132$Take smaller breaths than usual and keep them continuous through the hold; never hold your breath to brace, because a long hold needs steady airflow.$qbr132$
         AND c.common_mistakes = $qcm132$["Letting the hips drift up into a pike, which shortens the lever and makes the added plate easier than the logged weight suggests.","Placing the plate low on the lower back, where it loads the spine instead of the mid-back and hides a sagging position.","Reaching for a heavier plate before the unweighted hold is solid, so the position fails before the trunk is actually challenged."]$qcm132$::jsonb
         AND c.safety_guidance = $qsg132$Have the plate placed and removed by another person whenever you can, because sliding a plate on or off alone tends to twist the torso under load. Keep the plate off the neck and off the lower back, and end the hold at the first loss of a flat, level torso rather than pushing to failure with weight on your back.$qsg132$
         AND c.equipment_setup = $qes132$One flat weight plate and a mat. A bumper plate sits more stably than a thin iron plate, and a training partner to place and remove it is strongly preferred.$qes132$
         AND c.accessibility_alternative = $qaa132$Hold an unweighted plank for the same duration, or hold the position with your knees on the floor and no plate, adding time before you add any load.$qaa132$
         AND c.content_status = 'approved'
         AND c.reviewed_by = <<UNRESOLVED:B.132.reviewer>>
         AND c.reviewed_at = <<UNRESOLVED:B.132.reviewed_at>>
         AND c.review_rationale = <<UNRESOLVED:B.132.rationale>>
         AND c.import_admitted = true
         AND c.admitted_source_sha256 = 'fb13ea5283e7ab13953471bb323e8fe9df9ce707e718751c477495068fea2921'
         AND c.admitted_fingerprint = <<UNRESOLVED:B.132.admission_fingerprint(derived)>>
         AND c.admitted_fingerprint = public.exlib_content_admission_fingerprint(c.id)
         AND c.publication_status = 'published') THEN
    RAISE EXCEPTION 'W14E-5 content publication: the published content row for inventory line 132 is not exact (publication status, audit tuple, frozen payload, or the unchanged admission surface drifted); rolling back everything';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_relationships r WHERE r.from_logical_id = 'e21b2c00-0000-4000-a000-000000000004') <> 0 THEN
    RAISE EXCEPTION 'W14E-5 content publication: the projected relationship set for inventory line 132 is not exactly the (empty) expected set; rolling back everything';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_content c WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000005' AND c.publication_status = 'published') <> 1
     OR NOT EXISTS (SELECT 1 FROM public.exercise_catalog_content c
       WHERE c.id = 'e21b2c00-0000-4000-a000-000000000105'
         AND c.logical_id = 'e21b2c00-0000-4000-a000-000000000005'
         AND c.content_version = 1
         AND c.authored_by = $qab133$ForgeFitOS content program (AI-drafted original prose; pending human specialist review)$qab133$
         AND c.authored_at = DATE '2026-09-11'
         AND c.setup_steps = $qse133$["Fit the vest before you get down: tighten the straps so it sits high on the torso and cannot slide toward your head once you are horizontal.","Set your forearms shoulder-width apart with your elbows under your shoulders, then extend your legs into one straight line from heels to head.","Choose a vest load you could hold for at least half your unweighted plank time, and check that the weight is even front to back."]$qse133$::jsonb
         AND c.execution_steps = $qex133$["Brace your abs and squeeze your glutes so the vest's load stays over your mid-torso instead of dragging your hips toward the floor.","Hold the position and keep breathing; a vest that rides forward means the straps need tightening, not that you should push on.","End the hold when your hips sag or your lower back arches, then lower your knees before standing so the vest does not swing.","Record the vest weight and the duration you completed; this exercise is scored as added weight plus time, never as repetitions."]$qex133$::jsonb
         AND c.breathing_cue = $qbr133$Take smaller breaths than usual and keep them continuous; a snug vest limits how far the ribcage can expand, so do not brace by holding your breath.$qbr133$
         AND c.common_mistakes = $qcm133$["Wearing the vest loose, so it slides toward the shoulders and moves the load off the mid-torso partway through the hold.","Letting the hips sag under the extra load, which turns a trunk hold into a lower-back hold.","Adding vest weight in large jumps, because a spread-out load is easy to underestimate until the position fails.","Treating the vest as a way to extend a hold rather than as a separate, shorter, heavier effort."]$qcm133$::jsonb
         AND c.safety_guidance = $qsg133$Check the straps and weight pockets before every set, because a pocket that comes loose during a hold drops load unpredictably. Keep the load balanced front to back, and end the hold at the first loss of a flat, level torso instead of pushing to failure while wearing weight.$qsg133$
         AND c.equipment_setup = $qes133$A weighted vest with secured, evenly distributed weight pockets, and a mat. Confirm the straps are snug and every pocket is closed before you start the hold.$qes133$
         AND c.accessibility_alternative = $qaa133$Hold an unweighted plank for the same duration, or wear the vest for a shorter hold and build the time back up before adding any pockets.$qaa133$
         AND c.content_status = 'approved'
         AND c.reviewed_by = <<UNRESOLVED:B.133.reviewer>>
         AND c.reviewed_at = <<UNRESOLVED:B.133.reviewed_at>>
         AND c.review_rationale = <<UNRESOLVED:B.133.rationale>>
         AND c.import_admitted = true
         AND c.admitted_source_sha256 = 'fb13ea5283e7ab13953471bb323e8fe9df9ce707e718751c477495068fea2921'
         AND c.admitted_fingerprint = <<UNRESOLVED:B.133.admission_fingerprint(derived)>>
         AND c.admitted_fingerprint = public.exlib_content_admission_fingerprint(c.id)
         AND c.publication_status = 'published') THEN
    RAISE EXCEPTION 'W14E-5 content publication: the published content row for inventory line 133 is not exact (publication status, audit tuple, frozen payload, or the unchanged admission surface drifted); rolling back everything';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_relationships r WHERE r.from_logical_id = 'e21b2c00-0000-4000-a000-000000000005') <> 0 THEN
    RAISE EXCEPTION 'W14E-5 content publication: the projected relationship set for inventory line 133 is not exactly the (empty) expected set; rolling back everything';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_content c WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000006' AND c.publication_status = 'published') <> 1
     OR NOT EXISTS (SELECT 1 FROM public.exercise_catalog_content c
       WHERE c.id = 'e21b2c00-0000-4000-a000-000000000106'
         AND c.logical_id = 'e21b2c00-0000-4000-a000-000000000006'
         AND c.content_version = 1
         AND c.authored_by = $qab137$ForgeFitOS content program (AI-drafted original prose; pending human specialist review)$qab137$
         AND c.authored_at = DATE '2026-09-11'
         AND c.setup_steps = $qse137$["Attach the weight to a dipping belt around your hips, or set a plate to hold between your feet, before you reach for the bar.","Set your hands on the bar just outside shoulder width with a full overhand grip and your thumbs wrapped around it.","Step off a box rather than jumping up, so the added weight does not swing and load your shoulders all at once."]$qse137$::jsonb
         AND c.execution_steps = $qex137$["Hang with your arms straight and your shoulders active rather than fully slack, keeping your body still.","Keep your grip closed and your legs quiet so the weight hangs plumb underneath you instead of swinging.","Release when your grip starts to open, then step down under control; never drop from the bar with weight attached.","Record the added weight and the duration you completed; this exercise is scored as added weight plus time, never as repetitions."]$qex137$::jsonb
         AND c.breathing_cue = $qbr137$Breathe steadily and evenly through the hang; holding your breath to squeeze the bar ends the hold well before your grip actually gives out.$qbr137$
         AND c.common_mistakes = $qcm137$["Jumping up to the bar with weight attached, which loads the shoulders and grip before the hang has even started.","Letting the body swing, so the grip fights momentum instead of holding one steady load.","Using a thumbless grip under added weight, which gives up the most secure part of the hold.","Adding weight before an unweighted hang is comfortable for a full minute."]$qcm137$::jsonb
         AND c.safety_guidance = $qsg137$Hang over a clear floor and set the bar at a height that lets you step off and step back down with the weight still attached. Carry the load on a belt or held firmly between the feet rather than balanced, and release the bar deliberately, because dropping from a loaded hang puts the whole load on the shoulders at once.$qsg137$
         AND c.equipment_setup = $qes137$A secure pull-up bar rated for your bodyweight plus the added load, and a dipping belt with a weight plate, or a plate held securely between the feet.$qes137$
         AND c.accessibility_alternative = $qaa137$Hang from the bar with no added weight for the same duration, or use a lower bar with your feet on the floor so your legs carry part of the load.$qaa137$
         AND c.content_status = 'approved'
         AND c.reviewed_by = <<UNRESOLVED:B.137.reviewer>>
         AND c.reviewed_at = <<UNRESOLVED:B.137.reviewed_at>>
         AND c.review_rationale = <<UNRESOLVED:B.137.rationale>>
         AND c.import_admitted = true
         AND c.admitted_source_sha256 = 'fb13ea5283e7ab13953471bb323e8fe9df9ce707e718751c477495068fea2921'
         AND c.admitted_fingerprint = <<UNRESOLVED:B.137.admission_fingerprint(derived)>>
         AND c.admitted_fingerprint = public.exlib_content_admission_fingerprint(c.id)
         AND c.publication_status = 'published') THEN
    RAISE EXCEPTION 'W14E-5 content publication: the published content row for inventory line 137 is not exact (publication status, audit tuple, frozen payload, or the unchanged admission surface drifted); rolling back everything';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_relationships r WHERE r.from_logical_id = 'e21b2c00-0000-4000-a000-000000000006') <> 0 THEN
    RAISE EXCEPTION 'W14E-5 content publication: the projected relationship set for inventory line 137 is not exactly the (empty) expected set; rolling back everything';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_content c WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000007' AND c.publication_status = 'published') <> 1
     OR NOT EXISTS (SELECT 1 FROM public.exercise_catalog_content c
       WHERE c.id = 'e21b2c00-0000-4000-a000-000000000107'
         AND c.logical_id = 'e21b2c00-0000-4000-a000-000000000007'
         AND c.content_version = 1
         AND c.authored_by = $qab138$ForgeFitOS content program (AI-drafted original prose; pending human specialist review)$qab138$
         AND c.authored_at = DATE '2026-09-11'
         AND c.setup_steps = $qse138$["Stand with your back flat against a wall, then walk your feet forward and slide down until your thighs are parallel to the floor.","Check that your knees sit above your heels rather than ahead of your toes, and that your whole back stays against the wall.","Once you are already in position, have a plate placed on your thighs close to your hips and hold it there with both hands."]$qse138$::jsonb
         AND c.execution_steps = $qex138$["Press your back into the wall and drive through both feet evenly so the plate stays level across your thighs.","Hold with your knees at roughly a right angle and your weight through the whole foot rather than the toes.","End the hold when your thighs rise out of parallel or your back peels off the wall, then set the plate down before standing.","Record the plate weight and the duration you completed; this exercise is scored as added weight plus time, never as repetitions."]$qex138$::jsonb
         AND c.breathing_cue = $qbr138$Keep breathing evenly the whole way through; the burn will tempt you to hold your breath, which ends the hold sooner than your legs would.$qbr138$
         AND c.common_mistakes = $qcm138$["Sliding up out of parallel as the hold gets hard, which quietly makes the effort easier than the logged time suggests.","Resting the plate on the knees instead of near the hips, where it shifts the load and tends to slide.","Letting the knees travel forward past the toes, which moves the effort off the thighs.","Coming out of the hold by standing up with the plate still resting on the thighs."]$qcm138$::jsonb
         AND c.safety_guidance = $qsg138$Get into the seated position first and have the plate placed afterwards, because picking a plate up while already holding a wall sit tends to pull you out of position. Keep both hands on the plate so it cannot slide off your thighs, and set it down before you stand.$qsg138$
         AND c.equipment_setup = $qes138$A flat wall and one weight plate held on the thighs near the hips. A bumper plate is easier to keep flat than a thin iron plate.$qes138$
         AND c.accessibility_alternative = $qaa138$Hold the wall sit with no plate for the same duration, or sit higher than parallel and add depth before you add any weight.$qaa138$
         AND c.content_status = 'approved'
         AND c.reviewed_by = <<UNRESOLVED:B.138.reviewer>>
         AND c.reviewed_at = <<UNRESOLVED:B.138.reviewed_at>>
         AND c.review_rationale = <<UNRESOLVED:B.138.rationale>>
         AND c.import_admitted = true
         AND c.admitted_source_sha256 = 'fb13ea5283e7ab13953471bb323e8fe9df9ce707e718751c477495068fea2921'
         AND c.admitted_fingerprint = <<UNRESOLVED:B.138.admission_fingerprint(derived)>>
         AND c.admitted_fingerprint = public.exlib_content_admission_fingerprint(c.id)
         AND c.publication_status = 'published') THEN
    RAISE EXCEPTION 'W14E-5 content publication: the published content row for inventory line 138 is not exact (publication status, audit tuple, frozen payload, or the unchanged admission surface drifted); rolling back everything';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_relationships r WHERE r.from_logical_id = 'e21b2c00-0000-4000-a000-000000000007') <> 0 THEN
    RAISE EXCEPTION 'W14E-5 content publication: the projected relationship set for inventory line 138 is not exactly the (empty) expected set; rolling back everything';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_content c WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000008' AND c.publication_status = 'published') <> 1
     OR NOT EXISTS (SELECT 1 FROM public.exercise_catalog_content c
       WHERE c.id = 'e21b2c00-0000-4000-a000-000000000108'
         AND c.logical_id = 'e21b2c00-0000-4000-a000-000000000008'
         AND c.content_version = 1
         AND c.authored_by = $qab139$ForgeFitOS content program (AI-drafted original prose; pending human specialist review)$qab139$
         AND c.authored_at = DATE '2026-09-11'
         AND c.setup_steps = $qse139$["Fit and tighten the vest while standing, so it sits snug on the torso and will not slide up once your back is against the wall.","Stand with your back flat against the wall, walk your feet forward, and slide down until your thighs are parallel to the floor.","Check that your knees sit above your heels and that the vest is not bunched between your back and the wall."]$qse139$::jsonb
         AND c.execution_steps = $qex139$["Press your back into the wall and drive through both feet evenly, keeping the vest's load centred over your hips.","Hold with your knees at roughly a right angle and your hands free at your sides or folded across your chest.","End the hold when your thighs rise out of parallel or your back peels off the wall, then stand up under control.","Record the vest weight and the duration you completed; this exercise is scored as added weight plus time, never as repetitions."]$qex139$::jsonb
         AND c.breathing_cue = $qbr139$Breathe evenly and continuously; a snug vest restricts the ribcage, so a held breath will end the hold before your legs do.$qbr139$
         AND c.common_mistakes = $qcm139$["Sliding up out of parallel as the hold gets hard, which makes the logged time overstate the work actually done.","Letting the vest bunch up behind the back, which pushes the torso off the wall and changes the angle.","Adding vest weight when sitting above parallel is what is really limiting the hold.","Letting the knees drift forward past the toes as fatigue sets in."]$qcm139$::jsonb
         AND c.safety_guidance = $qsg139$Fit the vest before you get into position and check that its pockets are closed, because load shifting partway through a wall sit tends to pull the torso off the wall. Keep the whole foot planted and end the hold at the first loss of parallel rather than pushing to failure under load.$qsg139$
         AND c.equipment_setup = $qes139$A flat wall and a weighted vest with secured, evenly distributed pockets. Because the hands stay free, a vest suits longer holds than a plate held on the thighs.$qes139$
         AND c.accessibility_alternative = $qaa139$Hold the wall sit with no vest for the same duration, or wear the vest for a shorter hold and build the time back up before adding any pockets.$qaa139$
         AND c.content_status = 'approved'
         AND c.reviewed_by = <<UNRESOLVED:B.139.reviewer>>
         AND c.reviewed_at = <<UNRESOLVED:B.139.reviewed_at>>
         AND c.review_rationale = <<UNRESOLVED:B.139.rationale>>
         AND c.import_admitted = true
         AND c.admitted_source_sha256 = 'fb13ea5283e7ab13953471bb323e8fe9df9ce707e718751c477495068fea2921'
         AND c.admitted_fingerprint = <<UNRESOLVED:B.139.admission_fingerprint(derived)>>
         AND c.admitted_fingerprint = public.exlib_content_admission_fingerprint(c.id)
         AND c.publication_status = 'published') THEN
    RAISE EXCEPTION 'W14E-5 content publication: the published content row for inventory line 139 is not exact (publication status, audit tuple, frozen payload, or the unchanged admission surface drifted); rolling back everything';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_relationships r WHERE r.from_logical_id = 'e21b2c00-0000-4000-a000-000000000008') <> 0 THEN
    RAISE EXCEPTION 'W14E-5 content publication: the projected relationship set for inventory line 139 is not exactly the (empty) expected set; rolling back everything';
  END IF;
  IF (SELECT md5(coalesce(string_agg(l::text, '|' ORDER BY l.id), '-')) FROM public.exercise_catalog_logical l) IS DISTINCT FROM v_cap.logical_digest
     OR (SELECT md5(coalesce(string_agg(c::text, '|' ORDER BY c.logical_id, c.catalog_version), '-')) FROM public.exercise_catalog c) IS DISTINCT FROM v_cap.snapshots_digest
     OR (SELECT md5(coalesce(string_agg(e::text, '|' ORDER BY e.id), '-')) FROM public.exercise_catalog_review_events e) IS DISTINCT FROM v_cap.events_digest
     OR (SELECT md5(coalesce(string_agg(m::text, '|' ORDER BY m.catalog_id, m.muscle), '-')) FROM public.exercise_catalog_muscles m) IS DISTINCT FROM v_cap.anatomy_digest
     OR (SELECT md5(coalesce(string_agg(a::text, '|' ORDER BY a.logical_id, a.alias), '-')) FROM public.exercise_catalog_aliases a) IS DISTINCT FROM v_cap.alias_digest
     OR (SELECT md5(coalesce(string_agg(n::text, '|' ORDER BY n.normalized_name), '-')) FROM public.exercise_catalog_name_claims n) IS DISTINCT FROM v_cap.claims_digest
     OR (SELECT md5(coalesce(string_agg(c::text, '|' ORDER BY c.id), '-')) FROM public.exercise_catalog_content c WHERE c.logical_id NOT IN ('e21b2c00-0000-4000-a000-000000000004', 'e21b2c00-0000-4000-a000-000000000005', 'e21b2c00-0000-4000-a000-000000000006', 'e21b2c00-0000-4000-a000-000000000007', 'e21b2c00-0000-4000-a000-000000000008')) IS DISTINCT FROM v_cap.content_outside_five
     OR (SELECT md5(coalesce(string_agg(x::text, '|' ORDER BY x.content_id, x.relation, x.to_logical_id), '-')) FROM public.exercise_catalog_content_expected_relationships x) IS DISTINCT FROM v_cap.expected_rel_digest
     OR (SELECT md5(coalesce(string_agg(r::text, '|' ORDER BY r.from_logical_id, r.relation, r.to_logical_id), '-')) FROM public.exercise_catalog_relationships r) IS DISTINCT FROM v_cap.projection_digest
     OR (SELECT md5(coalesce(string_agg(r::text, '|' ORDER BY r.id), '-')) FROM public.exercise_catalog_import_runs r) IS DISTINCT FROM v_cap.runs_digest
     OR (SELECT md5(coalesce(string_agg(ri::text, '|' ORDER BY ri.id), '-')) FROM public.exercise_catalog_run_items ri) IS DISTINCT FROM v_cap.run_items_digest THEN
    RAISE EXCEPTION 'W14E-5 content publication: a surface this package must not change has changed (logical_digest, snapshots_digest, events_digest, anatomy_digest, alias_digest, claims_digest, content_outside_five, expected_rel_digest, projection_digest, runs_digest, run_items_digest); rolling back everything';
  END IF;
  IF (SELECT r::text FROM public.exercise_catalog_import_runs r WHERE r.run_key = 'exlib2u-plank-release1-staged-v1') IS DISTINCT FROM v_cap.historical_run_row
     OR (SELECT md5(coalesce(string_agg(ri::text, '|' ORDER BY ri.id), '-'))
           FROM public.exercise_catalog_run_items ri
           JOIN public.exercise_catalog_import_runs r ON r.id = ri.run_id
          WHERE r.run_key = 'exlib2u-plank-release1-staged-v1') IS DISTINCT FROM v_cap.historical_items_digest THEN
    RAISE EXCEPTION 'W14E-5 content publication: the historical sealed plank run exlib2u-plank-release1-staged-v1 or its membership changed; this package never touches it; rolling back everything';
  END IF;
  IF (SELECT md5(coalesce(string_agg(am::text, '|' ORDER BY am.roleid, am.member, am.grantor), '-'))
        FROM pg_catalog.pg_auth_members am
        JOIN pg_roles g ON g.oid = am.roleid
       WHERE g.rolname IN ('exlib_catalog_loader','exlib_catalog_reviewer','exlib_catalog_admission','exlib_catalog_admin')) IS DISTINCT FROM v_cap.authority_digest THEN
    RAISE EXCEPTION 'W14E-5 content publication: the catalog authority memberships changed across the act - whole rows compared: member, grantor, every option column; rolling back everything';
  END IF;
  IF (SELECT count(*)::text || ':' || md5(coalesce(string_agg(t::text, '|' ORDER BY t.id), '-')) FROM public.exercises t) IS DISTINCT FROM v_cap.tenant_digest
     OR (SELECT count(*)::text || ':' || md5(coalesce(string_agg(t::text, '|' ORDER BY t.id), '-')) FROM public.exercise_aliases t) IS DISTINCT FROM v_cap.tenant_alias_digest
     OR (SELECT count(*)::text || ':' || md5(coalesce(string_agg(t::text, '|' ORDER BY t.id), '-')) FROM public.exercise_muscles t) IS DISTINCT FROM v_cap.tenant_muscle_digest THEN
    RAISE EXCEPTION 'W14E-5 content publication: a tenant surface (exercises, exercise_aliases, exercise_muscles) changed inside the gated interval; NO tenant delivery occurs in this package; rolling back everything';
  END IF;
  IF (SELECT orphaned_claims::text || '/' || unclaimed_bearers::text FROM public.exlib_verify_catalog_claims()) <> '0/0' THEN
    RAISE EXCEPTION 'W14E-5 content publication: the bidirectional catalog name-claim invariant does not hold; rolling back everything';
  END IF;
  IF has_function_privilege('anon', 'public.publish_catalog_content(uuid,uuid)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.publish_catalog_content(uuid,uuid)', 'EXECUTE')
     OR has_function_privilege('service_role', 'public.publish_catalog_content(uuid,uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'W14E-5 content publication: public.publish_catalog_content(uuid,uuid) is executable by an ordinary client role; rolling back everything';
  END IF;
  IF has_table_privilege('anon', 'public.exercise_catalog_relationships', 'SELECT')
     OR has_table_privilege('authenticated', 'public.exercise_catalog_relationships', 'SELECT') THEN
    RAISE EXCEPTION 'W14E-5 content publication: the protected projection table is readable by an ordinary client role; rolling back everything';
  END IF;
END
$post$;

-- surfaced result (display evidence; the committed rows are the proof)
SELECT 'W14E-5 CONTENT PUBLISHED' AS result,
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
       (SELECT count(*) FROM public.exercise_catalog_content WHERE logical_id IN ('e21b2c00-0000-4000-a000-000000000004', 'e21b2c00-0000-4000-a000-000000000005', 'e21b2c00-0000-4000-a000-000000000006', 'e21b2c00-0000-4000-a000-000000000007', 'e21b2c00-0000-4000-a000-000000000008') AND publication_status = 'published') AS published_content,
       (SELECT count(*) FROM public.exercise_catalog_relationships WHERE from_logical_id IN ('e21b2c00-0000-4000-a000-000000000004', 'e21b2c00-0000-4000-a000-000000000005', 'e21b2c00-0000-4000-a000-000000000006', 'e21b2c00-0000-4000-a000-000000000007', 'e21b2c00-0000-4000-a000-000000000008')) AS projected_relationships_from_five;

COMMIT;
