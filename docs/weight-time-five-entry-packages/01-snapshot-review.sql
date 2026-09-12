-- ============================================================
-- W14-E stage 1 of 7 - SNAPSHOT REVIEW (family A) for the five weight_time identities
-- STATUS: TEMPLATE - NOT EXECUTABLE - human decision leaves UNRESOLVED
--
-- GENERATED FILE. Do not edit by hand - regenerate:
--   npx tsx scripts/generate-weight-time-five-entry-packages.ts
-- Every value is derived from docs/weight-time-five-entry-lifecycle-manifest.json and the
-- three human decision forms (family A: docs/weight-time-five-entry-snapshot-review-form.json).
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
--   - performs EXACTLY FIVE snapshot review transitions (pending -> approved), one direct owner UPDATE per identity carrying its complete FRESH human audit tuple, resolved by logical_id + is_active (never a hosted surrogate UUID)
--   - lets the OPERATIVE migration-027 freeze trigger append the five immutable exercise_catalog_review_events rows itself (that table accepts inserts only at trigger depth >= 2)
--   - NO controlled function exists for snapshot review (migration 023 grants nothing on exercise_catalog; the four migration-027 roles hold EXECUTE on content-lifecycle functions only), so the direct owner UPDATE is the ONLY lawful surface - the same mechanism the promoted EXLIB-2Y package used
--   - NO content draft, review, admission, publication, projection, run, membership, seal, revocation, delivery, tenant change, authority change or environment change
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
-- POSITION IN THE SEQUENCE: stage 1 of 7. Vector before 8/8/10/3/11/1/2/2/1/6/3,
-- after 8/8/10/3/11/1/2/2/1/6/8 (review_events 3 -> 8 (one trigger-appended event per identity)).
-- ============================================================

BEGIN;
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;

-- TEMPLATE RENDERING: NOT EXECUTABLE. 25 human decision leaves are blank:
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
-- The next line is a deliberate syntax error so nothing below can ever run.
SELECT <<UNRESOLVED-TEMPLATE: 25 human decision leaves are blank; regenerate from COMPLETED forms>>;

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
CREATE TEMP TABLE w14e1_capture ON COMMIT DROP AS
SELECT
  (SELECT md5(coalesce(string_agg(l::text, '|' ORDER BY l.id), '-')) FROM public.exercise_catalog_logical l) AS logical_digest,
  (SELECT md5(coalesce(string_agg(c::text, '|' ORDER BY c.logical_id, c.catalog_version), '-')) FROM public.exercise_catalog c WHERE c.logical_id NOT IN ('e21b2c00-0000-4000-a000-000000000004', 'e21b2c00-0000-4000-a000-000000000005', 'e21b2c00-0000-4000-a000-000000000006', 'e21b2c00-0000-4000-a000-000000000007', 'e21b2c00-0000-4000-a000-000000000008')) AS snapshots_outside_five,
  (SELECT md5(coalesce(string_agg(e::text, '|' ORDER BY e.id), '-')) FROM public.exercise_catalog_review_events e JOIN public.exercise_catalog c ON c.id = e.catalog_id WHERE c.logical_id NOT IN ('e21b2c00-0000-4000-a000-000000000004', 'e21b2c00-0000-4000-a000-000000000005', 'e21b2c00-0000-4000-a000-000000000006', 'e21b2c00-0000-4000-a000-000000000007', 'e21b2c00-0000-4000-a000-000000000008')) AS events_outside_five,
  (SELECT md5(coalesce(string_agg(m::text, '|' ORDER BY m.catalog_id, m.muscle), '-')) FROM public.exercise_catalog_muscles m) AS anatomy_digest,
  (SELECT md5(coalesce(string_agg(a::text, '|' ORDER BY a.logical_id, a.alias), '-')) FROM public.exercise_catalog_aliases a) AS alias_digest,
  (SELECT md5(coalesce(string_agg(n::text, '|' ORDER BY n.normalized_name), '-')) FROM public.exercise_catalog_name_claims n) AS claims_digest,
  (SELECT md5(coalesce(string_agg(c::text, '|' ORDER BY c.id), '-')) FROM public.exercise_catalog_content c) AS content_digest,
  (SELECT md5(coalesce(string_agg(x::text, '|' ORDER BY x.content_id, x.relation, x.to_logical_id), '-')) FROM public.exercise_catalog_content_expected_relationships x) AS expected_rel_digest,
  (SELECT md5(coalesce(string_agg(r::text, '|' ORDER BY r.from_logical_id, r.relation, r.to_logical_id), '-')) FROM public.exercise_catalog_relationships r) AS projection_digest,
  (SELECT md5(coalesce(string_agg(r::text, '|' ORDER BY r.id), '-')) FROM public.exercise_catalog_import_runs r) AS runs_digest,
  (SELECT md5(coalesce(string_agg(ri::text, '|' ORDER BY ri.id), '-')) FROM public.exercise_catalog_run_items ri) AS run_items_digest,
  (SELECT jsonb_object_agg(c.logical_id::text, c.created_at) FROM public.exercise_catalog c WHERE c.logical_id IN ('e21b2c00-0000-4000-a000-000000000004', 'e21b2c00-0000-4000-a000-000000000005', 'e21b2c00-0000-4000-a000-000000000006', 'e21b2c00-0000-4000-a000-000000000007', 'e21b2c00-0000-4000-a000-000000000008') AND c.is_active = true) AS created_at_map,
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
  RAISE EXCEPTION 'W14E-1 snapshot review: TEMPLATE RENDERING with unresolved human decision leaves; this file is not executable and must be regenerated from COMPLETED forms';
  IF current_user <> 'postgres' OR session_user <> 'postgres' THEN
    RAISE EXCEPTION 'W14E-1 snapshot review: BOTH execution identities must be the hosted operator role postgres (got current_user=%, session_user=%); refusing before any write or authority change', current_user, session_user;
  END IF;
  IF (SELECT rolsuper FROM pg_roles WHERE rolname = current_user) THEN
    RAISE EXCEPTION 'W14E-1 snapshot review: the invoker is a superuser; this package is bound to the hosted non-superuser postgres posture';
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
    RAISE EXCEPTION 'W14E-1 snapshot review: a governing freeze trigger is not EXACTLY bound and enabled (promoted name, table, function, event set, enabled state); refusing';
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
    RAISE EXCEPTION 'W14E-1 snapshot review: the catalog authority baseline is not exactly the promoted shape (got: %); refusing', coalesce(v_line, '<none>');
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
  IF v_counts <> '8/8/10/3/11/1/2/2/1/6/3' THEN
    RAISE EXCEPTION 'W14E-1 snapshot review: the catalog surface is not the exact expected pre-state (expected 8/8/10/3/11/1/2/2/1/6/3, found %); this ONE-USE package refuses to run twice, over foreign state, or over an ambiguous surface - READ STATE FIRST', v_counts;
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_import_runs r
       WHERE r.run_key = 'exlib2u-plank-release1-staged-v1'
         AND r.approved_for_delivery = true AND r.dry_run = false
         AND r.sealed_at IS NOT NULL AND r.revoked_at IS NULL) <> 1
     OR (SELECT count(*) FROM public.exercise_catalog_run_items ri
           JOIN public.exercise_catalog_import_runs r ON r.id = ri.run_id
          WHERE r.run_key = 'exlib2u-plank-release1-staged-v1') <> 6 THEN
    RAISE EXCEPTION 'W14E-1 snapshot review: the historical plank release run exlib2u-plank-release1-staged-v1 is not exactly one sealed, approved, non-dry, unrevoked run with six membership rows; the world is not the evidenced post-W14 hosted state; refusing';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_content c
       WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000001' AND c.publication_status = 'published'
         AND c.import_admitted = true
         AND c.admitted_fingerprint = public.exlib_content_admission_fingerprint(c.id)) <> 1 THEN
    RAISE EXCEPTION 'W14E-1 snapshot review: the published, admitted, fingerprint-fresh Plank content row is not exactly present; refusing';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_logical WHERE id IN ('e21b2c00-0000-4000-a000-000000000009', 'e21b2c00-0000-4000-a000-00000000000a', 'e21b2c00-0000-4000-a000-00000000000b')) <> 0
     OR (SELECT count(*) FROM public.exercise_catalog WHERE lower(canonical_name) ~ 'carry|farmer|suitcase|sandbag') <> 0 THEN
    RAISE EXCEPTION 'W14E-1 snapshot review: a deferred carry identity (inventory lines 134, 135, 136) is present in the catalog; the carries are DEFERRED and this lifecycle never touches them; refusing';
  END IF;
  -- each governed identity: exactly one active v1 snapshot, every governed
  -- field exactly the frozen W14 value, pending with NULL audit, no event yet
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
    RAISE EXCEPTION 'W14E-1 snapshot review: inventory line 132 (Plate-weighted plank) is not exactly one active v1 snapshot carrying the governed W14 fields; refusing';
  END IF;
  IF (SELECT coalesce(string_agg(m.muscle || ':' || m.role, ',' ORDER BY m.muscle, m.role), '')
        FROM public.exercise_catalog_muscles m
        JOIN public.exercise_catalog e ON e.id = m.catalog_id
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000004' AND e.is_active = true) <> 'obliques:secondary' THEN
    RAISE EXCEPTION 'W14E-1 snapshot review: inventory line 132 anatomy is not exactly obliques:secondary; refusing';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_aliases a WHERE a.logical_id = 'e21b2c00-0000-4000-a000-000000000004') <> 0 THEN
    RAISE EXCEPTION 'W14E-1 snapshot review: inventory line 132 alias count is not 0; refusing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.exercise_catalog e
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000004' AND e.is_active = true
         AND e.review_status = 'pending' AND e.reviewed_by IS NULL
         AND e.reviewed_at IS NULL AND e.review_rationale IS NULL) THEN
    RAISE EXCEPTION 'W14E-1 snapshot review: inventory line 132 is not in the pending / NULL-audit state the decision reviewed; this ONE-USE transition is spent or the world moved - READ STATE FIRST; refusing';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_review_events ev
        JOIN public.exercise_catalog e ON e.id = ev.catalog_id
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000004') <> 0 THEN
    RAISE EXCEPTION 'W14E-1 snapshot review: a review event already exists for inventory line 132; refusing';
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
    RAISE EXCEPTION 'W14E-1 snapshot review: inventory line 133 (Weighted vest plank) is not exactly one active v1 snapshot carrying the governed W14 fields; refusing';
  END IF;
  IF (SELECT coalesce(string_agg(m.muscle || ':' || m.role, ',' ORDER BY m.muscle, m.role), '')
        FROM public.exercise_catalog_muscles m
        JOIN public.exercise_catalog e ON e.id = m.catalog_id
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000005' AND e.is_active = true) <> 'obliques:secondary' THEN
    RAISE EXCEPTION 'W14E-1 snapshot review: inventory line 133 anatomy is not exactly obliques:secondary; refusing';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_aliases a WHERE a.logical_id = 'e21b2c00-0000-4000-a000-000000000005') <> 0 THEN
    RAISE EXCEPTION 'W14E-1 snapshot review: inventory line 133 alias count is not 0; refusing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.exercise_catalog e
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000005' AND e.is_active = true
         AND e.review_status = 'pending' AND e.reviewed_by IS NULL
         AND e.reviewed_at IS NULL AND e.review_rationale IS NULL) THEN
    RAISE EXCEPTION 'W14E-1 snapshot review: inventory line 133 is not in the pending / NULL-audit state the decision reviewed; this ONE-USE transition is spent or the world moved - READ STATE FIRST; refusing';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_review_events ev
        JOIN public.exercise_catalog e ON e.id = ev.catalog_id
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000005') <> 0 THEN
    RAISE EXCEPTION 'W14E-1 snapshot review: a review event already exists for inventory line 133; refusing';
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
    RAISE EXCEPTION 'W14E-1 snapshot review: inventory line 137 (Weighted dead hang) is not exactly one active v1 snapshot carrying the governed W14 fields; refusing';
  END IF;
  IF (SELECT coalesce(string_agg(m.muscle || ':' || m.role, ',' ORDER BY m.muscle, m.role), '')
        FROM public.exercise_catalog_muscles m
        JOIN public.exercise_catalog e ON e.id = m.catalog_id
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000006' AND e.is_active = true) <> 'lats:secondary' THEN
    RAISE EXCEPTION 'W14E-1 snapshot review: inventory line 137 anatomy is not exactly lats:secondary; refusing';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_aliases a WHERE a.logical_id = 'e21b2c00-0000-4000-a000-000000000006') <> 0 THEN
    RAISE EXCEPTION 'W14E-1 snapshot review: inventory line 137 alias count is not 0; refusing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.exercise_catalog e
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000006' AND e.is_active = true
         AND e.review_status = 'pending' AND e.reviewed_by IS NULL
         AND e.reviewed_at IS NULL AND e.review_rationale IS NULL) THEN
    RAISE EXCEPTION 'W14E-1 snapshot review: inventory line 137 is not in the pending / NULL-audit state the decision reviewed; this ONE-USE transition is spent or the world moved - READ STATE FIRST; refusing';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_review_events ev
        JOIN public.exercise_catalog e ON e.id = ev.catalog_id
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000006') <> 0 THEN
    RAISE EXCEPTION 'W14E-1 snapshot review: a review event already exists for inventory line 137; refusing';
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
    RAISE EXCEPTION 'W14E-1 snapshot review: inventory line 138 (Weighted wall sit) is not exactly one active v1 snapshot carrying the governed W14 fields; refusing';
  END IF;
  IF (SELECT coalesce(string_agg(m.muscle || ':' || m.role, ',' ORDER BY m.muscle, m.role), '')
        FROM public.exercise_catalog_muscles m
        JOIN public.exercise_catalog e ON e.id = m.catalog_id
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000007' AND e.is_active = true) <> 'glutes:secondary' THEN
    RAISE EXCEPTION 'W14E-1 snapshot review: inventory line 138 anatomy is not exactly glutes:secondary; refusing';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_aliases a WHERE a.logical_id = 'e21b2c00-0000-4000-a000-000000000007') <> 0 THEN
    RAISE EXCEPTION 'W14E-1 snapshot review: inventory line 138 alias count is not 0; refusing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.exercise_catalog e
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000007' AND e.is_active = true
         AND e.review_status = 'pending' AND e.reviewed_by IS NULL
         AND e.reviewed_at IS NULL AND e.review_rationale IS NULL) THEN
    RAISE EXCEPTION 'W14E-1 snapshot review: inventory line 138 is not in the pending / NULL-audit state the decision reviewed; this ONE-USE transition is spent or the world moved - READ STATE FIRST; refusing';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_review_events ev
        JOIN public.exercise_catalog e ON e.id = ev.catalog_id
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000007') <> 0 THEN
    RAISE EXCEPTION 'W14E-1 snapshot review: a review event already exists for inventory line 138; refusing';
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
    RAISE EXCEPTION 'W14E-1 snapshot review: inventory line 139 (Weighted vest wall sit) is not exactly one active v1 snapshot carrying the governed W14 fields; refusing';
  END IF;
  IF (SELECT coalesce(string_agg(m.muscle || ':' || m.role, ',' ORDER BY m.muscle, m.role), '')
        FROM public.exercise_catalog_muscles m
        JOIN public.exercise_catalog e ON e.id = m.catalog_id
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000008' AND e.is_active = true) <> 'glutes:secondary' THEN
    RAISE EXCEPTION 'W14E-1 snapshot review: inventory line 139 anatomy is not exactly glutes:secondary; refusing';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_aliases a WHERE a.logical_id = 'e21b2c00-0000-4000-a000-000000000008') <> 0 THEN
    RAISE EXCEPTION 'W14E-1 snapshot review: inventory line 139 alias count is not 0; refusing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.exercise_catalog e
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000008' AND e.is_active = true
         AND e.review_status = 'pending' AND e.reviewed_by IS NULL
         AND e.reviewed_at IS NULL AND e.review_rationale IS NULL) THEN
    RAISE EXCEPTION 'W14E-1 snapshot review: inventory line 139 is not in the pending / NULL-audit state the decision reviewed; this ONE-USE transition is spent or the world moved - READ STATE FIRST; refusing';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_review_events ev
        JOIN public.exercise_catalog e ON e.id = ev.catalog_id
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000008') <> 0 THEN
    RAISE EXCEPTION 'W14E-1 snapshot review: a review event already exists for inventory line 139; refusing';
  END IF;
  IF (SELECT orphaned_claims::text || '/' || unclaimed_bearers::text FROM public.exlib_verify_catalog_claims()) <> '0/0' THEN
    RAISE EXCEPTION 'W14E-1 snapshot review: the bidirectional catalog name-claim invariant does not hold; refusing';
  END IF;
END
$pre$;

-- ── THE FIVE HUMAN-AUTHORED TRANSITIONS (the trigger validates each one and
--    appends its immutable review event itself) ───────────────────────────
UPDATE public.exercise_catalog
   SET review_status    = 'approved',
       reviewed_by      = <<UNRESOLVED:A.132.reviewer>>,
       reviewed_at      = <<UNRESOLVED:A.132.reviewed_at>>,
       review_rationale = <<UNRESOLVED:A.132.rationale>>
 WHERE logical_id = 'e21b2c00-0000-4000-a000-000000000004' AND is_active = true;

UPDATE public.exercise_catalog
   SET review_status    = 'approved',
       reviewed_by      = <<UNRESOLVED:A.133.reviewer>>,
       reviewed_at      = <<UNRESOLVED:A.133.reviewed_at>>,
       review_rationale = <<UNRESOLVED:A.133.rationale>>
 WHERE logical_id = 'e21b2c00-0000-4000-a000-000000000005' AND is_active = true;

UPDATE public.exercise_catalog
   SET review_status    = 'approved',
       reviewed_by      = <<UNRESOLVED:A.137.reviewer>>,
       reviewed_at      = <<UNRESOLVED:A.137.reviewed_at>>,
       review_rationale = <<UNRESOLVED:A.137.rationale>>
 WHERE logical_id = 'e21b2c00-0000-4000-a000-000000000006' AND is_active = true;

UPDATE public.exercise_catalog
   SET review_status    = 'approved',
       reviewed_by      = <<UNRESOLVED:A.138.reviewer>>,
       reviewed_at      = <<UNRESOLVED:A.138.reviewed_at>>,
       review_rationale = <<UNRESOLVED:A.138.rationale>>
 WHERE logical_id = 'e21b2c00-0000-4000-a000-000000000007' AND is_active = true;

UPDATE public.exercise_catalog
   SET review_status    = 'approved',
       reviewed_by      = <<UNRESOLVED:A.139.reviewer>>,
       reviewed_at      = <<UNRESOLVED:A.139.reviewed_at>>,
       review_rationale = <<UNRESOLVED:A.139.rationale>>
 WHERE logical_id = 'e21b2c00-0000-4000-a000-000000000008' AND is_active = true;

-- ── Postconditions (ANY mismatch rolls back EVERYTHING) ──────────────
DO $post$
DECLARE
  v_counts TEXT;
  v_cap    RECORD;
BEGIN
  SELECT * INTO v_cap FROM w14e1_capture;
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
  IF v_counts <> '8/8/10/3/11/1/2/2/1/6/8' THEN
    RAISE EXCEPTION 'W14E-1 snapshot review: post-state vector is % (expected 8/8/10/3/11/1/2/2/1/6/8); rolling back everything', v_counts;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.exercise_catalog e
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000004' AND e.is_active = true
         AND e.review_status = 'approved'
         AND e.reviewed_by = <<UNRESOLVED:A.132.reviewer>>
         AND e.reviewed_at = <<UNRESOLVED:A.132.reviewed_at>>
         AND e.review_rationale = <<UNRESOLVED:A.132.rationale>>) THEN
    RAISE EXCEPTION 'W14E-1 snapshot review: inventory line 132 does not bear the exact family A approval tuple; refusing';
  END IF;
  IF (SELECT c.created_at FROM public.exercise_catalog c WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000004' AND c.is_active = true)
     IS DISTINCT FROM (v_cap.created_at_map ->> 'e21b2c00-0000-4000-a000-000000000004')::timestamptz THEN
    RAISE EXCEPTION 'W14E-1 snapshot review: created_at changed for inventory line 132; rolling back everything';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.exercise_catalog e
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000005' AND e.is_active = true
         AND e.review_status = 'approved'
         AND e.reviewed_by = <<UNRESOLVED:A.133.reviewer>>
         AND e.reviewed_at = <<UNRESOLVED:A.133.reviewed_at>>
         AND e.review_rationale = <<UNRESOLVED:A.133.rationale>>) THEN
    RAISE EXCEPTION 'W14E-1 snapshot review: inventory line 133 does not bear the exact family A approval tuple; refusing';
  END IF;
  IF (SELECT c.created_at FROM public.exercise_catalog c WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000005' AND c.is_active = true)
     IS DISTINCT FROM (v_cap.created_at_map ->> 'e21b2c00-0000-4000-a000-000000000005')::timestamptz THEN
    RAISE EXCEPTION 'W14E-1 snapshot review: created_at changed for inventory line 133; rolling back everything';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.exercise_catalog e
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000006' AND e.is_active = true
         AND e.review_status = 'approved'
         AND e.reviewed_by = <<UNRESOLVED:A.137.reviewer>>
         AND e.reviewed_at = <<UNRESOLVED:A.137.reviewed_at>>
         AND e.review_rationale = <<UNRESOLVED:A.137.rationale>>) THEN
    RAISE EXCEPTION 'W14E-1 snapshot review: inventory line 137 does not bear the exact family A approval tuple; refusing';
  END IF;
  IF (SELECT c.created_at FROM public.exercise_catalog c WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000006' AND c.is_active = true)
     IS DISTINCT FROM (v_cap.created_at_map ->> 'e21b2c00-0000-4000-a000-000000000006')::timestamptz THEN
    RAISE EXCEPTION 'W14E-1 snapshot review: created_at changed for inventory line 137; rolling back everything';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.exercise_catalog e
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000007' AND e.is_active = true
         AND e.review_status = 'approved'
         AND e.reviewed_by = <<UNRESOLVED:A.138.reviewer>>
         AND e.reviewed_at = <<UNRESOLVED:A.138.reviewed_at>>
         AND e.review_rationale = <<UNRESOLVED:A.138.rationale>>) THEN
    RAISE EXCEPTION 'W14E-1 snapshot review: inventory line 138 does not bear the exact family A approval tuple; refusing';
  END IF;
  IF (SELECT c.created_at FROM public.exercise_catalog c WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000007' AND c.is_active = true)
     IS DISTINCT FROM (v_cap.created_at_map ->> 'e21b2c00-0000-4000-a000-000000000007')::timestamptz THEN
    RAISE EXCEPTION 'W14E-1 snapshot review: created_at changed for inventory line 138; rolling back everything';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.exercise_catalog e
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000008' AND e.is_active = true
         AND e.review_status = 'approved'
         AND e.reviewed_by = <<UNRESOLVED:A.139.reviewer>>
         AND e.reviewed_at = <<UNRESOLVED:A.139.reviewed_at>>
         AND e.review_rationale = <<UNRESOLVED:A.139.rationale>>) THEN
    RAISE EXCEPTION 'W14E-1 snapshot review: inventory line 139 does not bear the exact family A approval tuple; refusing';
  END IF;
  IF (SELECT c.created_at FROM public.exercise_catalog c WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000008' AND c.is_active = true)
     IS DISTINCT FROM (v_cap.created_at_map ->> 'e21b2c00-0000-4000-a000-000000000008')::timestamptz THEN
    RAISE EXCEPTION 'W14E-1 snapshot review: created_at changed for inventory line 139; rolling back everything';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_review_events ev
        JOIN public.exercise_catalog c ON c.id = ev.catalog_id
       WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000004'
         AND ev.from_status = 'pending' AND ev.to_status = 'approved'
         AND ev.reviewed_by = <<UNRESOLVED:A.132.reviewer>>
         AND ev.reviewed_at = <<UNRESOLVED:A.132.reviewed_at>>
         AND ev.review_rationale = <<UNRESOLVED:A.132.rationale>>) <> 1
     OR (SELECT count(*) FROM public.exercise_catalog_review_events ev
        JOIN public.exercise_catalog c ON c.id = ev.catalog_id
       WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000004') <> 1 THEN
    RAISE EXCEPTION 'W14E-1 snapshot review: the trigger-appended review event for inventory line 132 is not exactly one pending -> approved row carrying the family A tuple; rolling back everything';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_review_events ev
        JOIN public.exercise_catalog c ON c.id = ev.catalog_id
       WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000005'
         AND ev.from_status = 'pending' AND ev.to_status = 'approved'
         AND ev.reviewed_by = <<UNRESOLVED:A.133.reviewer>>
         AND ev.reviewed_at = <<UNRESOLVED:A.133.reviewed_at>>
         AND ev.review_rationale = <<UNRESOLVED:A.133.rationale>>) <> 1
     OR (SELECT count(*) FROM public.exercise_catalog_review_events ev
        JOIN public.exercise_catalog c ON c.id = ev.catalog_id
       WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000005') <> 1 THEN
    RAISE EXCEPTION 'W14E-1 snapshot review: the trigger-appended review event for inventory line 133 is not exactly one pending -> approved row carrying the family A tuple; rolling back everything';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_review_events ev
        JOIN public.exercise_catalog c ON c.id = ev.catalog_id
       WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000006'
         AND ev.from_status = 'pending' AND ev.to_status = 'approved'
         AND ev.reviewed_by = <<UNRESOLVED:A.137.reviewer>>
         AND ev.reviewed_at = <<UNRESOLVED:A.137.reviewed_at>>
         AND ev.review_rationale = <<UNRESOLVED:A.137.rationale>>) <> 1
     OR (SELECT count(*) FROM public.exercise_catalog_review_events ev
        JOIN public.exercise_catalog c ON c.id = ev.catalog_id
       WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000006') <> 1 THEN
    RAISE EXCEPTION 'W14E-1 snapshot review: the trigger-appended review event for inventory line 137 is not exactly one pending -> approved row carrying the family A tuple; rolling back everything';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_review_events ev
        JOIN public.exercise_catalog c ON c.id = ev.catalog_id
       WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000007'
         AND ev.from_status = 'pending' AND ev.to_status = 'approved'
         AND ev.reviewed_by = <<UNRESOLVED:A.138.reviewer>>
         AND ev.reviewed_at = <<UNRESOLVED:A.138.reviewed_at>>
         AND ev.review_rationale = <<UNRESOLVED:A.138.rationale>>) <> 1
     OR (SELECT count(*) FROM public.exercise_catalog_review_events ev
        JOIN public.exercise_catalog c ON c.id = ev.catalog_id
       WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000007') <> 1 THEN
    RAISE EXCEPTION 'W14E-1 snapshot review: the trigger-appended review event for inventory line 138 is not exactly one pending -> approved row carrying the family A tuple; rolling back everything';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_review_events ev
        JOIN public.exercise_catalog c ON c.id = ev.catalog_id
       WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000008'
         AND ev.from_status = 'pending' AND ev.to_status = 'approved'
         AND ev.reviewed_by = <<UNRESOLVED:A.139.reviewer>>
         AND ev.reviewed_at = <<UNRESOLVED:A.139.reviewed_at>>
         AND ev.review_rationale = <<UNRESOLVED:A.139.rationale>>) <> 1
     OR (SELECT count(*) FROM public.exercise_catalog_review_events ev
        JOIN public.exercise_catalog c ON c.id = ev.catalog_id
       WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000008') <> 1 THEN
    RAISE EXCEPTION 'W14E-1 snapshot review: the trigger-appended review event for inventory line 139 is not exactly one pending -> approved row carrying the family A tuple; rolling back everything';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog WHERE logical_id IN ('e21b2c00-0000-4000-a000-000000000004', 'e21b2c00-0000-4000-a000-000000000005', 'e21b2c00-0000-4000-a000-000000000006', 'e21b2c00-0000-4000-a000-000000000007', 'e21b2c00-0000-4000-a000-000000000008') AND is_active = true AND review_status = 'approved') <> 5 THEN
    RAISE EXCEPTION 'W14E-1 snapshot review: not exactly five approved active snapshots among the governed identities; rolling back everything';
  END IF;
  IF (SELECT md5(coalesce(string_agg(l::text, '|' ORDER BY l.id), '-')) FROM public.exercise_catalog_logical l) IS DISTINCT FROM v_cap.logical_digest
     OR (SELECT md5(coalesce(string_agg(c::text, '|' ORDER BY c.logical_id, c.catalog_version), '-')) FROM public.exercise_catalog c WHERE c.logical_id NOT IN ('e21b2c00-0000-4000-a000-000000000004', 'e21b2c00-0000-4000-a000-000000000005', 'e21b2c00-0000-4000-a000-000000000006', 'e21b2c00-0000-4000-a000-000000000007', 'e21b2c00-0000-4000-a000-000000000008')) IS DISTINCT FROM v_cap.snapshots_outside_five
     OR (SELECT md5(coalesce(string_agg(e::text, '|' ORDER BY e.id), '-')) FROM public.exercise_catalog_review_events e JOIN public.exercise_catalog c ON c.id = e.catalog_id WHERE c.logical_id NOT IN ('e21b2c00-0000-4000-a000-000000000004', 'e21b2c00-0000-4000-a000-000000000005', 'e21b2c00-0000-4000-a000-000000000006', 'e21b2c00-0000-4000-a000-000000000007', 'e21b2c00-0000-4000-a000-000000000008')) IS DISTINCT FROM v_cap.events_outside_five
     OR (SELECT md5(coalesce(string_agg(m::text, '|' ORDER BY m.catalog_id, m.muscle), '-')) FROM public.exercise_catalog_muscles m) IS DISTINCT FROM v_cap.anatomy_digest
     OR (SELECT md5(coalesce(string_agg(a::text, '|' ORDER BY a.logical_id, a.alias), '-')) FROM public.exercise_catalog_aliases a) IS DISTINCT FROM v_cap.alias_digest
     OR (SELECT md5(coalesce(string_agg(n::text, '|' ORDER BY n.normalized_name), '-')) FROM public.exercise_catalog_name_claims n) IS DISTINCT FROM v_cap.claims_digest
     OR (SELECT md5(coalesce(string_agg(c::text, '|' ORDER BY c.id), '-')) FROM public.exercise_catalog_content c) IS DISTINCT FROM v_cap.content_digest
     OR (SELECT md5(coalesce(string_agg(x::text, '|' ORDER BY x.content_id, x.relation, x.to_logical_id), '-')) FROM public.exercise_catalog_content_expected_relationships x) IS DISTINCT FROM v_cap.expected_rel_digest
     OR (SELECT md5(coalesce(string_agg(r::text, '|' ORDER BY r.from_logical_id, r.relation, r.to_logical_id), '-')) FROM public.exercise_catalog_relationships r) IS DISTINCT FROM v_cap.projection_digest
     OR (SELECT md5(coalesce(string_agg(r::text, '|' ORDER BY r.id), '-')) FROM public.exercise_catalog_import_runs r) IS DISTINCT FROM v_cap.runs_digest
     OR (SELECT md5(coalesce(string_agg(ri::text, '|' ORDER BY ri.id), '-')) FROM public.exercise_catalog_run_items ri) IS DISTINCT FROM v_cap.run_items_digest
     OR (SELECT jsonb_object_agg(c.logical_id::text, c.created_at) FROM public.exercise_catalog c WHERE c.logical_id IN ('e21b2c00-0000-4000-a000-000000000004', 'e21b2c00-0000-4000-a000-000000000005', 'e21b2c00-0000-4000-a000-000000000006', 'e21b2c00-0000-4000-a000-000000000007', 'e21b2c00-0000-4000-a000-000000000008') AND c.is_active = true) IS DISTINCT FROM v_cap.created_at_map THEN
    RAISE EXCEPTION 'W14E-1 snapshot review: a surface this package must not change has changed (logical_digest, snapshots_outside_five, events_outside_five, anatomy_digest, alias_digest, claims_digest, content_digest, expected_rel_digest, projection_digest, runs_digest, run_items_digest, created_at_map); rolling back everything';
  END IF;
  IF (SELECT r::text FROM public.exercise_catalog_import_runs r WHERE r.run_key = 'exlib2u-plank-release1-staged-v1') IS DISTINCT FROM v_cap.historical_run_row
     OR (SELECT md5(coalesce(string_agg(ri::text, '|' ORDER BY ri.id), '-'))
           FROM public.exercise_catalog_run_items ri
           JOIN public.exercise_catalog_import_runs r ON r.id = ri.run_id
          WHERE r.run_key = 'exlib2u-plank-release1-staged-v1') IS DISTINCT FROM v_cap.historical_items_digest THEN
    RAISE EXCEPTION 'W14E-1 snapshot review: the historical sealed plank run exlib2u-plank-release1-staged-v1 or its membership changed; this package never touches it; rolling back everything';
  END IF;
  IF (SELECT md5(coalesce(string_agg(am::text, '|' ORDER BY am.roleid, am.member, am.grantor), '-'))
        FROM pg_catalog.pg_auth_members am
        JOIN pg_roles g ON g.oid = am.roleid
       WHERE g.rolname IN ('exlib_catalog_loader','exlib_catalog_reviewer','exlib_catalog_admission','exlib_catalog_admin')) IS DISTINCT FROM v_cap.authority_digest THEN
    RAISE EXCEPTION 'W14E-1 snapshot review: the catalog authority memberships changed across the act - whole rows compared: member, grantor, every option column; rolling back everything';
  END IF;
  IF (SELECT count(*)::text || ':' || md5(coalesce(string_agg(t::text, '|' ORDER BY t.id), '-')) FROM public.exercises t) IS DISTINCT FROM v_cap.tenant_digest
     OR (SELECT count(*)::text || ':' || md5(coalesce(string_agg(t::text, '|' ORDER BY t.id), '-')) FROM public.exercise_aliases t) IS DISTINCT FROM v_cap.tenant_alias_digest
     OR (SELECT count(*)::text || ':' || md5(coalesce(string_agg(t::text, '|' ORDER BY t.id), '-')) FROM public.exercise_muscles t) IS DISTINCT FROM v_cap.tenant_muscle_digest THEN
    RAISE EXCEPTION 'W14E-1 snapshot review: a tenant surface (exercises, exercise_aliases, exercise_muscles) changed inside the gated interval; NO tenant delivery occurs in this package; rolling back everything';
  END IF;
  IF (SELECT orphaned_claims::text || '/' || unclaimed_bearers::text FROM public.exlib_verify_catalog_claims()) <> '0/0' THEN
    RAISE EXCEPTION 'W14E-1 snapshot review: the bidirectional catalog name-claim invariant does not hold; rolling back everything';
  END IF;
END
$post$;

-- surfaced result (display evidence; the committed rows are the proof)
SELECT 'W14E-1 SNAPSHOTS APPROVED' AS result,
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
       (SELECT count(*) FROM public.exercise_catalog WHERE logical_id IN ('e21b2c00-0000-4000-a000-000000000004', 'e21b2c00-0000-4000-a000-000000000005', 'e21b2c00-0000-4000-a000-000000000006', 'e21b2c00-0000-4000-a000-000000000007', 'e21b2c00-0000-4000-a000-000000000008') AND review_status = 'approved' AND is_active = true) AS approved_five,
       (SELECT count(*) FROM public.exercise_catalog_review_events) AS review_events;

COMMIT;
