-- ============================================================
-- EXLIB-2Y — hosted snapshot-review APPLICATION package
-- STATUS: PREPARED — NOT EXECUTED. ONE-USE, NOT idempotent.
--
-- WHAT THIS IS: the single lawful application of the three renewed,
-- promoted, human-authored EXLIB-2X APPROVE decisions to the three
-- hosted exercise_catalog snapshot rows. It performs EXACTLY three
-- review transitions (pending -> approved, each carrying its
-- complete FRESH human audit tuple in the SAME statement) and lets
-- the OPERATIVE migration-027 freeze trigger create the three
-- immutable exercise_catalog_review_events rows itself (that
-- events table's own guard accepts inserts only at trigger depth
-- >= 2, so the trigger is the ONLY lawful writer). Nothing else:
-- NO import run, NO run items, NO approval/sealing of any run, NO
-- delivery call, NO publication/admission/content/projection
-- change, NO tenant change, NO authority change, NO environment
-- change.
--
-- EXECUTION AUTHORITY: may ONLY ever be applied to the Supabase
-- project "ShredOS" ref ttybyljytiwntvorugcv, ONLY by Joseph or
-- ChatGPT in the hosted SQL editor (operator posture: the
-- NON-SUPERUSER role postgres, the table owner), and never by
-- Claude and never by any automated pipeline. Exactly ONE
-- execution is authorized after Codex review; a second execution
-- REFUSES at the preconditions (the rows are no longer pending and
-- the event baseline is no longer zero).
--
-- DECISION PROVENANCE (the immutable inputs; any byte change to
-- any of them voids this package):
--   docs/exlib2w-plank-snapshot-review-form-v2-completed.json
--     14,505 B sha256 eec41ded250147da0f24749b0709474897043c7e385e4dc3072576daaa500fba
--   docs/exlib2w-dead-bug-snapshot-review-form-v2-completed.json
--     14,463 B sha256 def64ac383703fa89160478726e395db8b1187ad7d0b5aabf7cd0d8206c503c6
--   docs/exlib2w-ab-wheel-rollout-snapshot-review-form-v2-completed.json
--     14,516 B sha256 dee585f9470b8816e6df706f8c0c081ebf22efc5842d5802a4ecd8daaea2cba9
-- all three promoted at main = 06d99e2cb3a678836a05a0078cc4f916d30cf462
-- and each a coherent COMPLETED_HUMAN_DECISION under the v2
-- derived-state rule (all six human fields non-null,
-- human-supplied, transcribed character-for-character under the
-- reviewer's express instruction of 2026-09-07T19:06:00-04:00).
--
-- THE DERIVED LAWFUL TRANSITION (from the committed migration
-- bytes; migration 023 grants nothing on exercise_catalog to any
-- role, and the four migration-027 NOLOGIN roles hold EXECUTE on
-- content-lifecycle functions only, so a direct owner UPDATE is
-- the ONLY lawful transition surface): one UPDATE per row setting
-- review_status AND the complete audit tuple together; the
-- operative exlib_freeze_catalog_snapshot trigger validates the
-- one-way machine (pending -> approved), demands the complete
-- non-blank FRESH tuple, forbids any governed-content change, and
-- appends the immutable review event.
--
-- AUDIT-TUPLE MAPPING (schema-derived; the snapshot row carries
-- exactly THREE audit columns): reviewed_by <- the decision's
-- reviewer; reviewed_at <- the decision's reviewed_at instant;
-- review_rationale <- the decision's rationale. The decision's
-- reviewer_role_or_credential and evidence fields remain in the
-- promoted decision artifacts (no snapshot column exists for
-- them), and the decision timestamp is written as the timestamptz
-- instant 2026-09-07T19:06:00-04:00 (= 2026-09-07T23:06:00Z).
--
-- RESOLUTION RULE: each row is resolved through its GOVERNED
-- LOGICAL IDENTITY (logical_id + is_active = true, unique under
-- exercise_catalog_one_active_logical_idx) — NEVER through a
-- hosted-generated snapshot UUID. The Plank snapshot UUID was
-- never preserved in promoted evidence and is NOT invented here;
-- no snapshot UUID literal appears anywhere in this package.
--
-- created_at TRUTHFULNESS: the decisions' created_at is the
-- explicit UNKNOWN_NOT_PRESERVED_HOSTED_GENERATED sentinel. This
-- package therefore verifies AT APPLICATION TIME that each row's
-- actual hosted created_at IS NOT NULL (the schema guarantees
-- non-null; the read proves the live fact) and that it is
-- UNCHANGED by the transition — it never pretends the exact value
-- was preserved in the decision artifacts.
--
-- FAIL-CLOSED SHAPE: one transaction; SHARE ROW EXCLUSIVE locks
-- over the eleven gated catalog tables taken before any gated
-- read, so a concurrent writer (including any events writer or a
-- concurrent second execution) serializes against this package and
-- the loser refuses at the preconditions; every precondition and
-- postcondition RAISEs on mismatch, rolling back EVERYTHING — a
-- partial application cannot commit. Live tenant surfaces are
-- captured-and-compared inside the transaction (digest equality),
-- never pinned to absolute counts, because production signups
-- lawfully change them.
-- ============================================================

BEGIN;

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

-- ── Capture-and-compare surfaces (temp, transaction-local) ──────
CREATE TEMP TABLE exlib2y_capture ON COMMIT DROP AS
SELECT
  (SELECT md5(coalesce(string_agg(m::text,'|' ORDER BY m.catalog_id, m.muscle),'-')) FROM public.exercise_catalog_muscles m)      AS anatomy_digest,
  (SELECT md5(coalesce(string_agg(a::text,'|' ORDER BY a.logical_id, a.alias),'-')) FROM public.exercise_catalog_aliases a)      AS alias_digest,
  (SELECT md5(coalesce(string_agg(n::text,'|' ORDER BY n.normalized_name),'-')) FROM public.exercise_catalog_name_claims n)      AS claims_digest,
  (SELECT md5(coalesce(string_agg(c::text,'|' ORDER BY c.id),'-')) FROM public.exercise_catalog_content c)                       AS content_digest,
  (SELECT md5(coalesce(string_agg(x::text,'|' ORDER BY x.relation, x.to_logical_id),'-')) FROM public.exercise_catalog_content_expected_relationships x) AS expected_rel_digest,
  (SELECT md5(coalesce(string_agg(r::text,'|' ORDER BY r.relation, r.to_logical_id),'-')) FROM public.exercise_catalog_relationships r)                  AS projection_digest,
  (SELECT count(*)::text || ':' || md5(coalesce(string_agg(t::text,'|' ORDER BY t.id),'-')) FROM public.exercises t)             AS tenant_digest,
  (SELECT count(*)::text || ':' || md5(coalesce(string_agg(t::text,'|' ORDER BY t.id),'-')) FROM public.exercise_aliases t)      AS tenant_alias_digest,
  (SELECT string_agg(x.rolname || '=' || x.n::text, ',' ORDER BY x.rolname)
     FROM (SELECT r.rolname, count(*) AS n
             FROM pg_catalog.pg_auth_members am JOIN pg_roles r ON r.oid = am.roleid
            WHERE r.rolname IN ('exlib_catalog_loader','exlib_catalog_reviewer','exlib_catalog_admission','exlib_catalog_admin')
            GROUP BY r.rolname) x)                                                                                               AS authority_shape,
  (SELECT jsonb_object_agg(c.logical_id::text, c.created_at)
     FROM public.exercise_catalog c
    WHERE c.logical_id IN ('e21b2c00-0000-4000-a000-000000000001',
                           'e21b2c00-0000-4000-a000-000000000002',
                           'e21b2c00-0000-4000-a000-000000000003')
      AND c.is_active = true)                                                                                                    AS created_at_map;

-- ── Preconditions (ANY mismatch aborts EVERYTHING) ───────────────
DO $pre$
DECLARE
  v_counts TEXT;
  v_row    public.exercise_catalog%ROWTYPE;
  v_n      INTEGER;
  v_ev     INTEGER;
  v_orph   BIGINT;
  v_unc    BIGINT;
BEGIN
  -- executor posture: the hosted operator (table owner), nothing else
  IF current_user <> 'postgres' THEN
    RAISE EXCEPTION 'exlib2y application: must run as the hosted operator role postgres (current_user=%); refusing', current_user;
  END IF;

  -- structural presence of the operative machinery
  IF to_regclass('public.exercise_catalog_review_events') IS NULL THEN
    RAISE EXCEPTION 'exlib2y application: review-events table missing; wrong or unmigrated database';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
                 WHERE c.relname = 'exercise_catalog' AND NOT t.tgisinternal) THEN
    RAISE EXCEPTION 'exlib2y application: the exercise_catalog freeze/review trigger is missing; refusing';
  END IF;

  -- the exact post-EXLIB-2R catalog vector (the promoted evidence
  -- baseline this application builds on; review events MUST be 0)
  SELECT (SELECT count(*) FROM public.exercise_catalog_logical)::text
    ||'/'||(SELECT count(*) FROM public.exercise_catalog)::text
    ||'/'||(SELECT count(*) FROM public.exercise_catalog_muscles)::text
    ||'/'||(SELECT count(*) FROM public.exercise_catalog_aliases)::text
    ||'/'||(SELECT count(*) FROM public.exercise_catalog_name_claims)::text
    ||'/'||(SELECT count(*) FROM public.exercise_catalog_content)::text
    ||'/'||(SELECT count(*) FROM public.exercise_catalog_content_expected_relationships)::text
    ||'/'||(SELECT count(*) FROM public.exercise_catalog_relationships)::text
    ||'/'||(SELECT count(*) FROM public.exercise_catalog_import_runs)::text
    ||'/'||(SELECT count(*) FROM public.exercise_catalog_run_items)::text
    ||'/'||(SELECT count(*) FROM public.exercise_catalog_review_events)::text
  INTO v_counts;
  IF v_counts <> '3/3/5/3/6/1/2/2/0/0/0' THEN
    RAISE EXCEPTION 'exlib2y application: catalog state vector is % (expected the post-EXLIB-2R evidence baseline 3/3/5/3/6/1/2/2/0/0/0); refusing — this package is ONE-USE and its baseline is gone', v_counts;
  END IF;
  SELECT count(*) INTO v_ev FROM public.exercise_catalog_review_events;
  IF v_ev <> 0 THEN
    RAISE EXCEPTION 'exlib2y application: % review event(s) already exist (expected the promoted zero baseline); refusing', v_ev;
  END IF;

  -- ── Plank (logical e21b2c00-0000-4000-a000-000000000001) ──────
  SELECT count(*) INTO v_n FROM public.exercise_catalog c
   WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000001' AND c.is_active = true;
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'exlib2y application: expected exactly one active Plank snapshot by logical identity, found %; refusing', v_n;
  END IF;
  SELECT c.* INTO v_row FROM public.exercise_catalog c
   WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000001' AND c.is_active = true
   FOR UPDATE;
  IF v_row.review_status <> 'pending'
     OR v_row.reviewed_by IS NOT NULL OR v_row.reviewed_at IS NOT NULL OR v_row.review_rationale IS NOT NULL THEN
    RAISE EXCEPTION 'exlib2y application: the Plank snapshot is not in the pending/NULL-audit state the decision reviewed (status=%); refusing', v_row.review_status;
  END IF;
  IF v_row.created_at IS NULL THEN
    RAISE EXCEPTION 'exlib2y application: the Plank snapshot created_at is NULL (schema violation); refusing';
  END IF;
  IF v_row.canonical_name <> 'Plank' OR v_row.category <> 'isolation'
     OR v_row.primary_muscle <> 'abs' OR v_row.equipment <> 'bodyweight'
     OR v_row.laterality <> 'bilateral' OR v_row.tracking_mode <> 'timed'
     OR v_row.source_url IS NOT NULL OR v_row.source_page IS NOT NULL
     OR v_row.retrieved_at IS NOT NULL OR v_row.import_confidence IS NOT NULL
     OR v_row.provenance <> 'forgefitos_original'
     OR v_row.movement_pattern <> 'core_anti_extension' OR v_row.training_role <> 'core'
     OR v_row.difficulty <> 'beginner' OR v_row.availability <> 'minimal'
     OR v_row.catalog_version <> 1 THEN
    RAISE EXCEPTION 'exlib2y application: the live Plank snapshot governed fields differ from the promoted decision packet; the decision is VOID for this row; refusing';
  END IF;

  -- ── Dead bug (logical e21b2c00-0000-4000-a000-000000000002) ───
  SELECT count(*) INTO v_n FROM public.exercise_catalog c
   WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000002' AND c.is_active = true;
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'exlib2y application: expected exactly one active Dead bug snapshot by logical identity, found %; refusing', v_n;
  END IF;
  SELECT c.* INTO v_row FROM public.exercise_catalog c
   WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000002' AND c.is_active = true
   FOR UPDATE;
  IF v_row.review_status <> 'pending'
     OR v_row.reviewed_by IS NOT NULL OR v_row.reviewed_at IS NOT NULL OR v_row.review_rationale IS NOT NULL THEN
    RAISE EXCEPTION 'exlib2y application: the Dead bug snapshot is not in the pending/NULL-audit state the decision reviewed (status=%); refusing', v_row.review_status;
  END IF;
  IF v_row.created_at IS NULL THEN
    RAISE EXCEPTION 'exlib2y application: the Dead bug snapshot created_at is NULL (schema violation); refusing';
  END IF;
  IF v_row.canonical_name <> 'Dead bug' OR v_row.category <> 'mobility'
     OR v_row.primary_muscle <> 'abs' OR v_row.equipment <> 'bodyweight'
     OR v_row.laterality <> 'alternating' OR v_row.tracking_mode <> 'bodyweight'
     OR v_row.source_url IS NOT NULL OR v_row.source_page IS NOT NULL
     OR v_row.retrieved_at IS NOT NULL OR v_row.import_confidence IS NOT NULL
     OR v_row.provenance <> 'forgefitos_original'
     OR v_row.movement_pattern <> 'core_anti_extension' OR v_row.training_role <> 'core'
     OR v_row.difficulty <> 'beginner' OR v_row.availability <> 'minimal'
     OR v_row.catalog_version <> 1 THEN
    RAISE EXCEPTION 'exlib2y application: the live Dead bug snapshot governed fields differ from the promoted decision packet; the decision is VOID for this row; refusing';
  END IF;

  -- ── Ab wheel rollout (logical e21b2c00-0000-4000-a000-000000000003)
  SELECT count(*) INTO v_n FROM public.exercise_catalog c
   WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000003' AND c.is_active = true;
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'exlib2y application: expected exactly one active Ab wheel rollout snapshot by logical identity, found %; refusing', v_n;
  END IF;
  SELECT c.* INTO v_row FROM public.exercise_catalog c
   WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000003' AND c.is_active = true
   FOR UPDATE;
  IF v_row.review_status <> 'pending'
     OR v_row.reviewed_by IS NOT NULL OR v_row.reviewed_at IS NOT NULL OR v_row.review_rationale IS NOT NULL THEN
    RAISE EXCEPTION 'exlib2y application: the Ab wheel rollout snapshot is not in the pending/NULL-audit state the decision reviewed (status=%); refusing', v_row.review_status;
  END IF;
  IF v_row.created_at IS NULL THEN
    RAISE EXCEPTION 'exlib2y application: the Ab wheel rollout snapshot created_at is NULL (schema violation); refusing';
  END IF;
  IF v_row.canonical_name <> 'Ab wheel rollout' OR v_row.category <> 'other'
     OR v_row.primary_muscle <> 'abs' OR v_row.equipment <> 'other'
     OR v_row.laterality <> 'bilateral' OR v_row.tracking_mode <> 'weight_reps'
     OR v_row.source_url IS NOT NULL OR v_row.source_page IS NOT NULL
     OR v_row.retrieved_at IS NOT NULL OR v_row.import_confidence IS NOT NULL
     OR v_row.provenance <> 'forgefitos_original'
     OR v_row.movement_pattern <> 'core_anti_extension' OR v_row.training_role <> 'core'
     OR v_row.difficulty <> 'advanced' OR v_row.availability <> 'minimal'
     OR v_row.catalog_version <> 1 THEN
    RAISE EXCEPTION 'exlib2y application: the live Ab wheel rollout snapshot governed fields differ from the promoted decision packet; the decision is VOID for this row; refusing';
  END IF;

  -- the publication surface this application must PRESERVE must be
  -- present exactly as promoted (published Plank content, fresh
  -- fingerprint equality, the two projected relationships)
  IF (SELECT count(*) FROM public.exercise_catalog_content c
      WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000001'
        AND c.publication_status = 'published'
        AND c.import_admitted = true
        AND c.admitted_fingerprint = public.exlib_content_admission_fingerprint(c.id)) <> 1 THEN
    RAISE EXCEPTION 'exlib2y application: the published, admitted, fingerprint-fresh Plank content row is not exactly present; refusing';
  END IF;
  IF (SELECT coalesce(string_agg(r.relation||'>'||r.to_logical_id::text, ',' ORDER BY r.relation), '<none>')
        FROM public.exercise_catalog_relationships r
       WHERE r.from_logical_id = 'e21b2c00-0000-4000-a000-000000000001')
     <> 'progression>e21b2c00-0000-4000-a000-000000000003,substitution>e21b2c00-0000-4000-a000-000000000002' THEN
    RAISE EXCEPTION 'exlib2y application: the projected Plank relationships are not exactly the promoted pair; refusing';
  END IF;

  -- catalog claims invariant
  SELECT orphaned_claims, unclaimed_bearers INTO v_orph, v_unc FROM public.exlib_verify_catalog_claims();
  IF v_orph <> 0 OR v_unc <> 0 THEN
    RAISE EXCEPTION 'exlib2y application: claims invariant broken (%/%); refusing', v_orph, v_unc;
  END IF;
END;
$pre$;

-- ── The three human-authored transitions (the trigger validates
--    each one and appends its immutable review event itself) ─────
UPDATE public.exercise_catalog
   SET review_status    = 'approved',
       reviewed_by      = 'Joseph Carfagno',
       reviewed_at      = TIMESTAMPTZ '2026-09-07T19:06:00-04:00',
       review_rationale = 'Approved as an accurate timed, bilateral bodyweight core exercise.'
 WHERE logical_id = 'e21b2c00-0000-4000-a000-000000000001' AND is_active = true;

UPDATE public.exercise_catalog
   SET review_status    = 'approved',
       reviewed_by      = 'Joseph Carfagno',
       reviewed_at      = TIMESTAMPTZ '2026-09-07T19:06:00-04:00',
       review_rationale = 'Approved as an accurate alternating bodyweight core and mobility exercise.'
 WHERE logical_id = 'e21b2c00-0000-4000-a000-000000000002' AND is_active = true;

UPDATE public.exercise_catalog
   SET review_status    = 'approved',
       reviewed_by      = 'Joseph Carfagno',
       reviewed_at      = TIMESTAMPTZ '2026-09-07T19:06:00-04:00',
       review_rationale = 'Approved as an accurate advanced bilateral weighted-repetition core exercise.'
 WHERE logical_id = 'e21b2c00-0000-4000-a000-000000000003' AND is_active = true;

-- ── Postconditions (ANY mismatch rolls back EVERYTHING) ─────────
DO $post$
DECLARE
  v_counts TEXT;
  v_line   TEXT;
  v_cap    RECORD;
BEGIN
  SELECT * INTO v_cap FROM exlib2y_capture;

  -- the vector moved in EXACTLY one position: events 0 -> 3
  SELECT (SELECT count(*) FROM public.exercise_catalog_logical)::text
    ||'/'||(SELECT count(*) FROM public.exercise_catalog)::text
    ||'/'||(SELECT count(*) FROM public.exercise_catalog_muscles)::text
    ||'/'||(SELECT count(*) FROM public.exercise_catalog_aliases)::text
    ||'/'||(SELECT count(*) FROM public.exercise_catalog_name_claims)::text
    ||'/'||(SELECT count(*) FROM public.exercise_catalog_content)::text
    ||'/'||(SELECT count(*) FROM public.exercise_catalog_content_expected_relationships)::text
    ||'/'||(SELECT count(*) FROM public.exercise_catalog_relationships)::text
    ||'/'||(SELECT count(*) FROM public.exercise_catalog_import_runs)::text
    ||'/'||(SELECT count(*) FROM public.exercise_catalog_run_items)::text
    ||'/'||(SELECT count(*) FROM public.exercise_catalog_review_events)::text
  INTO v_counts;
  IF v_counts <> '3/3/5/3/6/1/2/2/0/0/3' THEN
    RAISE EXCEPTION 'exlib2y application: post-state vector is % (expected 3/3/5/3/6/1/2/2/0/0/3); rolling back everything', v_counts;
  END IF;

  -- the three approved rows with the EXACT human tuples, governed
  -- fields untouched, created_at unchanged (compared to the
  -- captured live values, never to a pretended preserved value)
  SELECT string_agg(
           c.logical_id::text || '#' || c.review_status || '#' || c.reviewed_by || '#'
           || (c.reviewed_at = TIMESTAMPTZ '2026-09-07T19:06:00-04:00')::text || '#'
           || c.review_rationale || '#'
           || (c.created_at = (v_cap.created_at_map ->> c.logical_id::text)::timestamptz)::text,
           E'\n' ORDER BY c.logical_id)
    INTO v_line
    FROM public.exercise_catalog c
   WHERE c.is_active = true;
  IF v_line <> 'e21b2c00-0000-4000-a000-000000000001#approved#Joseph Carfagno#true#Approved as an accurate timed, bilateral bodyweight core exercise.#true'
            || E'\n' || 'e21b2c00-0000-4000-a000-000000000002#approved#Joseph Carfagno#true#Approved as an accurate alternating bodyweight core and mobility exercise.#true'
            || E'\n' || 'e21b2c00-0000-4000-a000-000000000003#approved#Joseph Carfagno#true#Approved as an accurate advanced bilateral weighted-repetition core exercise.#true' THEN
    RAISE EXCEPTION 'exlib2y application: the approved rows do not carry exactly the three human tuples with unchanged created_at; rolling back everything (got: %)', v_line;
  END IF;

  -- the trigger-created events: exactly three, one per row,
  -- pending -> approved, carrying the same tuples
  SELECT string_agg(
           c.logical_id::text || '#' || e.from_status || '>' || e.to_status || '#' || e.reviewed_by || '#'
           || (e.reviewed_at = TIMESTAMPTZ '2026-09-07T19:06:00-04:00')::text || '#' || e.review_rationale,
           E'\n' ORDER BY c.logical_id)
    INTO v_line
    FROM public.exercise_catalog_review_events e
    JOIN public.exercise_catalog c ON c.id = e.catalog_id;
  IF v_line <> 'e21b2c00-0000-4000-a000-000000000001#pending>approved#Joseph Carfagno#true#Approved as an accurate timed, bilateral bodyweight core exercise.'
            || E'\n' || 'e21b2c00-0000-4000-a000-000000000002#pending>approved#Joseph Carfagno#true#Approved as an accurate alternating bodyweight core and mobility exercise.'
            || E'\n' || 'e21b2c00-0000-4000-a000-000000000003#pending>approved#Joseph Carfagno#true#Approved as an accurate advanced bilateral weighted-repetition core exercise.' THEN
    RAISE EXCEPTION 'exlib2y application: the trigger-created review events are not exactly the three expected rows; rolling back everything (got: %)', v_line;
  END IF;

  -- every unrelated surface byte-preserved (captured pre vs now)
  IF (SELECT md5(coalesce(string_agg(m::text,'|' ORDER BY m.catalog_id, m.muscle),'-')) FROM public.exercise_catalog_muscles m) <> v_cap.anatomy_digest
     OR (SELECT md5(coalesce(string_agg(a::text,'|' ORDER BY a.logical_id, a.alias),'-')) FROM public.exercise_catalog_aliases a) <> v_cap.alias_digest
     OR (SELECT md5(coalesce(string_agg(n::text,'|' ORDER BY n.normalized_name),'-')) FROM public.exercise_catalog_name_claims n) <> v_cap.claims_digest
     OR (SELECT md5(coalesce(string_agg(c::text,'|' ORDER BY c.id),'-')) FROM public.exercise_catalog_content c) <> v_cap.content_digest
     OR (SELECT md5(coalesce(string_agg(x::text,'|' ORDER BY x.relation, x.to_logical_id),'-')) FROM public.exercise_catalog_content_expected_relationships x) <> v_cap.expected_rel_digest
     OR (SELECT md5(coalesce(string_agg(r::text,'|' ORDER BY r.relation, r.to_logical_id),'-')) FROM public.exercise_catalog_relationships r) <> v_cap.projection_digest THEN
    RAISE EXCEPTION 'exlib2y application: an unrelated catalog surface changed (anatomy/alias/claims/content/expected/projection); rolling back everything';
  END IF;
  IF (SELECT count(*)::text || ':' || md5(coalesce(string_agg(t::text,'|' ORDER BY t.id),'-')) FROM public.exercises t) <> v_cap.tenant_digest
     OR (SELECT count(*)::text || ':' || md5(coalesce(string_agg(t::text,'|' ORDER BY t.id),'-')) FROM public.exercise_aliases t) <> v_cap.tenant_alias_digest THEN
    RAISE EXCEPTION 'exlib2y application: a tenant surface changed inside the gated interval; rolling back everything';
  END IF;
  IF (SELECT string_agg(x.rolname || '=' || x.n::text, ',' ORDER BY x.rolname)
        FROM (SELECT r.rolname, count(*) AS n
                FROM pg_catalog.pg_auth_members am JOIN pg_roles r ON r.oid = am.roleid
               WHERE r.rolname IN ('exlib_catalog_loader','exlib_catalog_reviewer','exlib_catalog_admission','exlib_catalog_admin')
               GROUP BY r.rolname) x) IS DISTINCT FROM v_cap.authority_shape THEN
    RAISE EXCEPTION 'exlib2y application: the catalog authority shape changed (this package changes NO authority); rolling back everything';
  END IF;

  -- the claims invariant still holds
  IF (SELECT orphaned_claims::text||'/'||unclaimed_bearers::text FROM public.exlib_verify_catalog_claims()) <> '0/0' THEN
    RAISE EXCEPTION 'exlib2y application: claims invariant broken after application; rolling back everything';
  END IF;
END;
$post$;

-- surfaced result (display evidence; the committed rows are the proof)
SELECT 'EXLIB-2Y APPLIED' AS result,
       (SELECT count(*) FROM public.exercise_catalog WHERE review_status = 'approved' AND is_active = true) AS approved_snapshots,
       (SELECT count(*) FROM public.exercise_catalog_review_events) AS review_events;

COMMIT;
