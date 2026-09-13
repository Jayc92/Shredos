-- ============================================================
-- W14-E stage 6 of 7 - CUMULATIVE DELIVERY RUN STAGING (family C) - the historical six carried forward plus the five
-- STATUS: PREPARED - NOT EXECUTED - ONE-USE - NOT idempotent
--
-- GENERATED FILE. Do not edit by hand - regenerate:
--   npx tsx scripts/generate-weight-time-five-entry-packages.ts
-- Every value is derived from docs/weight-time-five-entry-lifecycle-manifest.json and the
-- three human decision forms (families A and B gated; family C: docs/weight-time-five-entry-run-authority-form.json).
--
-- WHAT THIS PACKAGE DOES (and everything it refuses to do):
--   - creates EXACTLY ONE new import run in the Design-S4 posture (dry_run = false, approved_for_delivery = false, sealed_at NULL, revoked_at NULL, operational fields NULL) carrying the family C product + legal approval evidence AT CREATION - derived from the promoted EXLIB-2U package: exlib_approve_and_seal_run only VALIDATES evidence, it never writes it
--   - creates EXACTLY ELEVEN membership rows: the SIX membership rows of the sealed historical plank run exlib2u-plank-release1-staged-v1 (3 exercise members + 3 alias members) COPIED from that run's own rows after a gate proves they still resolve to exactly the promoted six governed-identity lines, PLUS the five weight_time identities as exercise members resolved by logical_id + is_active - so the new run is CUMULATIVE (independent review finding R-E1): additive, not a replacement
--   - the new run key is the family C run_key_literal and is NEVER the historical plank key exlib2u-plank-release1-staged-v1 (run_key is UNIQUE forever; the gate below refuses if the chosen key already exists)
--   - the HISTORICAL RUN IS NEVER MUTATED, REVOKED OR EDITED: it is read as the copy source and its row and its six membership rows are proven byte-identical afterwards
--   - NO controlled function exists for run creation (only exlib_approve_and_seal_run writes a run row, and it only UPDATEs one that exists), so the direct owner INSERT is the ONLY lawful surface - the mechanism the promoted EXLIB-2U package used
--   - the staged run is STRUCTURALLY NON-DELIVERABLE: the delivery predicate (approved AND NOT dry AND sealed AND unrevoked) is EVALUATED below and must match zero rows; the delivery function is never called
--   - NO seal, NO revocation, NO delivery, NO snapshot/content/publication/projection change, NO tenant change, NO authority change, NO environment change
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
-- after 8/8/10/3/11/6/2/2/2/17/8 (runs 1 -> 2; run_items 6 -> 17 (the historical run's 3 exercise + 3 alias members copied forward, plus five new exercise members: 8 exercise + 3 alias)).
-- ============================================================

BEGIN;
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;

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
  IF EXISTS (SELECT 1 FROM public.exercise_catalog_import_runs r WHERE r.run_key = 'w14e-weight-time-release1-staged-v1') THEN
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
  -- THE HISTORICAL SOURCE RUN, resolved back through governed identity (never
  -- surrogates): it must still be sealed, approved, non-dry, unrevoked and carry
  -- EXACTLY the six membership lines the promoted EXLIB-2U package asserted and
  -- the EXLIB-2Z seal froze. These six rows are COPIED into the new run below;
  -- nothing here writes the historical run.
  SELECT string_agg(x.member, E'\n' ORDER BY x.member)
    INTO v_line
    FROM (
      SELECT 'exercise#' || c.logical_id::text AS member
        FROM public.exercise_catalog_run_items ri
        JOIN public.exercise_catalog_import_runs h ON h.id = ri.run_id
        JOIN public.exercise_catalog c ON c.id = ri.catalog_id
       WHERE h.run_key = 'exlib2u-plank-release1-staged-v1' AND ri.catalog_id IS NOT NULL
      UNION ALL
      SELECT 'alias#' || a.logical_id::text || '#' || a.alias
        FROM public.exercise_catalog_run_items ri
        JOIN public.exercise_catalog_import_runs h ON h.id = ri.run_id
        JOIN public.exercise_catalog_aliases a ON a.id = ri.catalog_alias_id
       WHERE h.run_key = 'exlib2u-plank-release1-staged-v1' AND ri.catalog_alias_id IS NOT NULL
    ) x;
  IF v_line IS DISTINCT FROM
        'alias#e21b2c00-0000-4000-a000-000000000001#Forearm plank'
     || E'\n' || 'alias#e21b2c00-0000-4000-a000-000000000001#Front plank'
     || E'\n' || 'alias#e21b2c00-0000-4000-a000-000000000003#Ab roller rollout'
     || E'\n' || 'exercise#e21b2c00-0000-4000-a000-000000000001'
     || E'\n' || 'exercise#e21b2c00-0000-4000-a000-000000000002'
     || E'\n' || 'exercise#e21b2c00-0000-4000-a000-000000000003' THEN
    RAISE EXCEPTION 'W14E-6 run staging: the historical source run exlib2u-plank-release1-staged-v1 does not carry exactly the promoted six membership lines (3 exercise + 3 alias members) - nothing can be carried forward; refusing (got: %)', coalesce(v_line, '<none>');
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_import_runs r
       WHERE r.run_key = 'exlib2u-plank-release1-staged-v1'
         AND r.approved_for_delivery = true AND r.dry_run = false
         AND r.sealed_at IS NOT NULL AND r.revoked_at IS NULL) <> 1 THEN
    RAISE EXCEPTION 'W14E-6 run staging: the historical source run exlib2u-plank-release1-staged-v1 is not exactly one sealed, approved, non-dry, unrevoked run; refusing';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_logical WHERE id IN ('e21b2c00-0000-4000-a000-000000000009', 'e21b2c00-0000-4000-a000-00000000000a', 'e21b2c00-0000-4000-a000-00000000000b')) <> 0
     OR (SELECT count(*) FROM public.exercise_catalog WHERE lower(canonical_name) ~ 'carry|farmer|suitcase|sandbag') <> 0 THEN
    RAISE EXCEPTION 'W14E-6 run staging: a deferred carry identity (inventory lines 134, 135, 136) is present in the catalog; the carries are DEFERRED and this lifecycle never touches them; refusing';
  END IF;
  -- every NEW identity the membership INSERT names must resolve to exactly one
  -- ACTIVE snapshot - a listed identity that does not exist would otherwise
  -- silently produce no row
  IF (SELECT count(*) FROM public.exercise_catalog c
       WHERE c.logical_id IN ('e21b2c00-0000-4000-a000-000000000004',
                        'e21b2c00-0000-4000-a000-000000000005',
                        'e21b2c00-0000-4000-a000-000000000006',
                        'e21b2c00-0000-4000-a000-000000000007',
                        'e21b2c00-0000-4000-a000-000000000008')
         AND c.is_active = true) <> 5 THEN
    RAISE EXCEPTION 'W14E-6 run staging: the 5 listed new membership identities do not each resolve to exactly one active snapshot; refusing';
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
         AND e.reviewed_by = $ar132$Joseph Carfagno$ar132$
         AND e.reviewed_at = TIMESTAMPTZ '2026-09-13T18:25:13-04:00'
         AND e.review_rationale = $aq132$I approve all five catalog snapshots as accurate for release.$aq132$) THEN
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
         AND e.reviewed_by = $ar133$Joseph Carfagno$ar133$
         AND e.reviewed_at = TIMESTAMPTZ '2026-09-13T18:25:13-04:00'
         AND e.review_rationale = $aq133$I approve all five catalog snapshots as accurate for release.$aq133$) THEN
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
         AND e.reviewed_by = $ar137$Joseph Carfagno$ar137$
         AND e.reviewed_at = TIMESTAMPTZ '2026-09-13T18:25:13-04:00'
         AND e.review_rationale = $aq137$I approve all five catalog snapshots as accurate for release.$aq137$) THEN
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
         AND e.reviewed_by = $ar138$Joseph Carfagno$ar138$
         AND e.reviewed_at = TIMESTAMPTZ '2026-09-13T18:25:13-04:00'
         AND e.review_rationale = $aq138$I approve all five catalog snapshots as accurate for release.$aq138$) THEN
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
         AND e.reviewed_by = $ar139$Joseph Carfagno$ar139$
         AND e.reviewed_at = TIMESTAMPTZ '2026-09-13T18:25:13-04:00'
         AND e.review_rationale = $aq139$I approve all five catalog snapshots as accurate for release.$aq139$) THEN
    RAISE EXCEPTION 'W14E-6 run staging: inventory line 139 does not bear the exact family A approval tuple; refusing';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_content c
       WHERE c.id = 'e21b2c00-0000-4000-a000-000000000104' AND c.logical_id = 'e21b2c00-0000-4000-a000-000000000004'
         AND c.publication_status = 'published' AND c.import_admitted = true
         AND c.content_status = 'approved'
         AND c.admitted_source_sha256 = '8fa1d3402a3ca9beef8b1cbb7ba58692bea0d28c11926d6db33da72877f2afdb'
         AND c.admitted_fingerprint = '9cbc10c9284f3e23f1123b647f17ee6bc05e8e452f5aa821b9a99256c9ddae7c'
         AND c.admitted_fingerprint = public.exlib_content_admission_fingerprint(c.id)) <> 1 THEN
    RAISE EXCEPTION 'W14E-6 run staging: the published, admitted, fingerprint-fresh content row for inventory line 132 is not exactly present; the run must never point at unpublished content; refusing';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_content c
       WHERE c.id = 'e21b2c00-0000-4000-a000-000000000105' AND c.logical_id = 'e21b2c00-0000-4000-a000-000000000005'
         AND c.publication_status = 'published' AND c.import_admitted = true
         AND c.content_status = 'approved'
         AND c.admitted_source_sha256 = '8fa1d3402a3ca9beef8b1cbb7ba58692bea0d28c11926d6db33da72877f2afdb'
         AND c.admitted_fingerprint = 'bb705be0318c34b7fd2ecd51039a665ad087be8f69fc227cf44a53ddbb06f1a5'
         AND c.admitted_fingerprint = public.exlib_content_admission_fingerprint(c.id)) <> 1 THEN
    RAISE EXCEPTION 'W14E-6 run staging: the published, admitted, fingerprint-fresh content row for inventory line 133 is not exactly present; the run must never point at unpublished content; refusing';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_content c
       WHERE c.id = 'e21b2c00-0000-4000-a000-000000000106' AND c.logical_id = 'e21b2c00-0000-4000-a000-000000000006'
         AND c.publication_status = 'published' AND c.import_admitted = true
         AND c.content_status = 'approved'
         AND c.admitted_source_sha256 = '8fa1d3402a3ca9beef8b1cbb7ba58692bea0d28c11926d6db33da72877f2afdb'
         AND c.admitted_fingerprint = 'e10369c291030ed61ddc48eda0c5c8759e0f3a7c68229a19a9b7c09792fe2008'
         AND c.admitted_fingerprint = public.exlib_content_admission_fingerprint(c.id)) <> 1 THEN
    RAISE EXCEPTION 'W14E-6 run staging: the published, admitted, fingerprint-fresh content row for inventory line 137 is not exactly present; the run must never point at unpublished content; refusing';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_content c
       WHERE c.id = 'e21b2c00-0000-4000-a000-000000000107' AND c.logical_id = 'e21b2c00-0000-4000-a000-000000000007'
         AND c.publication_status = 'published' AND c.import_admitted = true
         AND c.content_status = 'approved'
         AND c.admitted_source_sha256 = '8fa1d3402a3ca9beef8b1cbb7ba58692bea0d28c11926d6db33da72877f2afdb'
         AND c.admitted_fingerprint = '05ca70e920ac098f291c9928210f724ba15044bab7fac588591026b3d9d2b932'
         AND c.admitted_fingerprint = public.exlib_content_admission_fingerprint(c.id)) <> 1 THEN
    RAISE EXCEPTION 'W14E-6 run staging: the published, admitted, fingerprint-fresh content row for inventory line 138 is not exactly present; the run must never point at unpublished content; refusing';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_content c
       WHERE c.id = 'e21b2c00-0000-4000-a000-000000000108' AND c.logical_id = 'e21b2c00-0000-4000-a000-000000000008'
         AND c.publication_status = 'published' AND c.import_admitted = true
         AND c.content_status = 'approved'
         AND c.admitted_source_sha256 = '8fa1d3402a3ca9beef8b1cbb7ba58692bea0d28c11926d6db33da72877f2afdb'
         AND c.admitted_fingerprint = '8a7a94b2ede86cae694cde02fa5652154204a2093562f45c54778d0c2ff68c65'
         AND c.admitted_fingerprint = public.exlib_content_admission_fingerprint(c.id)) <> 1 THEN
    RAISE EXCEPTION 'W14E-6 run staging: the published, admitted, fingerprint-fresh content row for inventory line 139 is not exactly present; the run must never point at unpublished content; refusing';
  END IF;
  IF (SELECT orphaned_claims::text || '/' || unclaimed_bearers::text FROM public.exlib_verify_catalog_claims()) <> '0/0' THEN
    RAISE EXCEPTION 'W14E-6 run staging: the bidirectional catalog name-claim invariant does not hold; refusing';
  END IF;
END
$pre$;

-- ── THE ACT: one staged run + its eleven membership rows ──────────────
INSERT INTO public.exercise_catalog_import_runs
  (run_key, dry_run,
   product_approved_by, product_approved_at,
   legal_approved_by, legal_approved_at,
   approval_rationale)
VALUES
  ('w14e-weight-time-release1-staged-v1', false,
   $pab$Joseph Carfagno$pab$, TIMESTAMPTZ '2026-09-13T18:25:13-04:00',
   $lab$Joseph Carfagno$lab$, TIMESTAMPTZ '2026-09-13T18:25:13-04:00',
   $apr$I approve `w14e-weight-time-release1-staged-v1` with the cumulative historical six plus five weight_time membership because it preserves the existing release while adding the five reviewed exercises; this approval does not itself enable production delivery.$apr$);

-- carried-forward EXERCISE members: the historical run's own membership rows,
-- COPIED (same catalog snapshot ids), never retyped
INSERT INTO public.exercise_catalog_run_items (run_id, catalog_id)
SELECT r.id, ri.catalog_id
  FROM public.exercise_catalog_import_runs r
  JOIN public.exercise_catalog_import_runs h ON h.run_key = 'exlib2u-plank-release1-staged-v1'
  JOIN public.exercise_catalog_run_items ri ON ri.run_id = h.id AND ri.catalog_id IS NOT NULL
  JOIN public.exercise_catalog c ON c.id = ri.catalog_id
 WHERE r.run_key = 'w14e-weight-time-release1-staged-v1';

-- NEW exercise members: the five approved weight_time identities, resolved by
-- governed logical identity + is_active (never a surrogate)
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
 WHERE r.run_key = 'w14e-weight-time-release1-staged-v1';

-- carried-forward ALIAS members: the historical run's own alias membership rows, COPIED
INSERT INTO public.exercise_catalog_run_items (run_id, catalog_alias_id)
SELECT r.id, ri.catalog_alias_id
  FROM public.exercise_catalog_import_runs r
  JOIN public.exercise_catalog_import_runs h ON h.run_key = 'exlib2u-plank-release1-staged-v1'
  JOIN public.exercise_catalog_run_items ri ON ri.run_id = h.id AND ri.catalog_alias_id IS NOT NULL
  JOIN public.exercise_catalog_aliases a ON a.id = ri.catalog_alias_id
 WHERE r.run_key = 'w14e-weight-time-release1-staged-v1';

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
  IF v_counts <> '8/8/10/3/11/6/2/2/2/17/8' THEN
    RAISE EXCEPTION 'W14E-6 run staging: post-state vector is % (expected 8/8/10/3/11/6/2/2/2/17/8); rolling back everything', v_counts;
  END IF;
  SELECT * INTO v_run FROM public.exercise_catalog_import_runs WHERE run_key = 'w14e-weight-time-release1-staged-v1';
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
  IF v_run.product_approved_by IS DISTINCT FROM $pab$Joseph Carfagno$pab$
     OR v_run.product_approved_at IS DISTINCT FROM TIMESTAMPTZ '2026-09-13T18:25:13-04:00'
     OR v_run.legal_approved_by IS DISTINCT FROM $lab$Joseph Carfagno$lab$
     OR v_run.legal_approved_at IS DISTINCT FROM TIMESTAMPTZ '2026-09-13T18:25:13-04:00'
     OR v_run.approval_rationale IS DISTINCT FROM $apr$I approve `w14e-weight-time-release1-staged-v1` with the cumulative historical six plus five weight_time membership because it preserves the existing release while adding the five reviewed exercises; this approval does not itself enable production delivery.$apr$ THEN
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
        'alias#e21b2c00-0000-4000-a000-000000000001#Forearm plank'
     || E'\n' || 'alias#e21b2c00-0000-4000-a000-000000000001#Front plank'
     || E'\n' || 'alias#e21b2c00-0000-4000-a000-000000000003#Ab roller rollout'
     || E'\n' || 'exercise#e21b2c00-0000-4000-a000-000000000001'
     || E'\n' || 'exercise#e21b2c00-0000-4000-a000-000000000002'
     || E'\n' || 'exercise#e21b2c00-0000-4000-a000-000000000003'
     || E'\n' || 'exercise#e21b2c00-0000-4000-a000-000000000004'
     || E'\n' || 'exercise#e21b2c00-0000-4000-a000-000000000005'
     || E'\n' || 'exercise#e21b2c00-0000-4000-a000-000000000006'
     || E'\n' || 'exercise#e21b2c00-0000-4000-a000-000000000007'
     || E'\n' || 'exercise#e21b2c00-0000-4000-a000-000000000008' THEN
    RAISE EXCEPTION 'W14E-6 run staging: the membership is not exactly the eleven cumulative lines (the historical run''s six carried forward plus the five new exercise members); rolling back everything (got: %)', coalesce(v_line, '<none>');
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
  IF COALESCE(v_exercise_members, 0) <> 8 OR COALESCE(v_alias_members, 0) <> 3 THEN
    RAISE EXCEPTION 'W14E-6 run staging: seal-shape counts are %/% (expected 8 exercise + 3 alias members); rolling back everything', v_exercise_members, v_alias_members;
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
  -- the carried-forward rows reference the SAME catalog snapshot rows and the SAME
  -- alias rows as the historical run (a copy, not a re-resolution)
  IF (SELECT count(*) FROM public.exercise_catalog_run_items n
        JOIN public.exercise_catalog_run_items h ON h.catalog_id = n.catalog_id
        JOIN public.exercise_catalog_import_runs hr ON hr.id = h.run_id AND hr.run_key = 'exlib2u-plank-release1-staged-v1'
       WHERE n.run_id = v_run.id AND n.catalog_id IS NOT NULL) <> 3
     OR (SELECT count(*) FROM public.exercise_catalog_run_items n
        JOIN public.exercise_catalog_run_items h ON h.catalog_alias_id = n.catalog_alias_id
        JOIN public.exercise_catalog_import_runs hr ON hr.id = h.run_id AND hr.run_key = 'exlib2u-plank-release1-staged-v1'
       WHERE n.run_id = v_run.id AND n.catalog_alias_id IS NOT NULL) <> 3 THEN
    RAISE EXCEPTION 'W14E-6 run staging: the carried-forward membership does not reference exactly the historical run''s 3 snapshot rows and 3 alias rows; rolling back everything';
  END IF;
  -- STRUCTURAL NON-DELIVERABILITY: the delivery predicate, evaluated - never the function
  IF (SELECT count(*) FROM public.exercise_catalog_import_runs r
       WHERE r.run_key = 'w14e-weight-time-release1-staged-v1'
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
SELECT 'W14E-6 CUMULATIVE RUN STAGED' AS result,
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
          FROM public.exercise_catalog_import_runs r WHERE r.run_key = 'w14e-weight-time-release1-staged-v1') AS staged_non_deliverable;

COMMIT;
