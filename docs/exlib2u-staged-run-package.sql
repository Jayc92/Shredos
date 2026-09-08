-- ============================================================
-- EXLIB-2U — S4 staged-run package (STAGED, NON-DELIVERABLE)
-- STATUS: PREPARED — NOT EXECUTED. ONE-USE, NOT idempotent.
--
-- WHAT THIS IS: the single lawful S4 act of the promoted activation
-- design — it creates EXACTLY ONE staged import run in the SELECTED
-- Design-S4 posture (dry_run = false, approved_for_delivery =
-- false, sealed_at NULL, revoked_at NULL, operational fields NULL,
-- complete product + legal approval evidence populated as pre-seal
-- staging values) and EXACTLY SIX membership rows: the three
-- approved snapshot identities as exercise members plus all three
-- catalog aliases as alias members (the reserved
-- ALL_THREE_IDENTITIES choice). Nothing else: NO seal, NO delivery,
-- NO snapshot/content/publication/projection change, NO tenant
-- change, NO authority change, NO environment change.
--
-- The staged run is STRUCTURALLY NON-DELIVERABLE: the delivery
-- gate's own predicate (run_key match AND approved_for_delivery =
-- true AND dry_run = false AND sealed_at IS NOT NULL AND revoked_at
-- IS NULL, from the committed deliver_catalog_exercises bytes)
-- matches ZERO rows for this key — proven below by evaluating that
-- predicate, NEVER by calling the delivery function. It is DIRECTLY
-- S5-PROMOTABLE by one later, separately gated
-- exlib_approve_and_seal_run(run_key) call: the seal validation's
-- own member query (copied from the committed exlib_freeze_run_row
-- bytes) is evaluated below and must find a NON-EMPTY membership
-- with ZERO unready members — while nothing here performs, calls,
-- or simulates that transition.
--
-- EXECUTION AUTHORITY: may ONLY ever be applied to the Supabase
-- project "ShredOS" ref ttybyljytiwntvorugcv, ONLY by Joseph or
-- ChatGPT in the hosted SQL editor (operator posture: the
-- NON-SUPERUSER role postgres, the table owner), and never by
-- Claude and never by any automated pipeline. Exactly ONE execution
-- is authorized after Codex review and its own explicit one-use
-- instruction; a second execution REFUSES at the preconditions
-- (the zero-run baseline is gone and the reserved run key exists).
--
-- RESERVED AUTHORITY INPUTS (the immutable human decisions this
-- package transcribes; any byte change to the artifact voids it):
--   docs/exlib2v-s4-authority-inputs-form-completed.json
--     3,416 B sha256
--     6cf77759f7a8ddf89d32b2fd225bcbe0eddaf09587dcc9d01a657752b9adeeae
--   run_key    = exlib2u-plank-release1-staged-v1  (32 chars,
--                lawful under the 8..200 btrim CHECK)
--   membership = ALL_THREE_IDENTITIES: exercise members Plank,
--                Dead bug, Ab wheel rollout PLUS all three catalog
--                aliases (Front plank, Forearm plank -> Plank's
--                logical identity; Ab roller rollout -> Ab wheel
--                rollout's logical identity; Dead bug carries zero
--                aliases) as alias members = 6 run items
--   product_approved_by = legal_approved_by = Joseph Carfagno
--   product_approved_at = legal_approved_at =
--                TIMESTAMPTZ '2026-09-07T11:05:00-04:00'
--   approval_rationale = the artifact's exact string (in the INSERT
--                below, character-for-character)
--   CHRONOLOGY NOTE: 11:05-04:00 (15:05Z) is the AUTHORITY-decision
--   instant — the operator supplied these run-evidence values on
--   the round-0 authority form, which every later review ruled
--   byte-frozen, reserved, and standing. The SNAPSHOT approvals are
--   the SEPARATE renewed human decisions at 19:06-04:00 (23:06Z),
--   applied hosted by the spent EXLIB-2Y package on
--   2026-09-08T02:17:02Z. Both instants appear below, each bound to
--   its own decision family; neither is derived from the other.
--
-- DECISION PROVENANCE FOR THE MEMBER GATES (the immutable snapshot
-- decisions whose applied state the preconditions demand; any byte
-- change to any of them voids this package):
--   docs/exlib2w-plank-snapshot-review-form-v2-completed.json
--     14,505 B sha256
--     eec41ded250147da0f24749b0709474897043c7e385e4dc3072576daaa500fba
--   docs/exlib2w-dead-bug-snapshot-review-form-v2-completed.json
--     14,463 B sha256
--     def64ac383703fa89160478726e395db8b1187ad7d0b5aabf7cd0d8206c503c6
--   docs/exlib2w-ab-wheel-rollout-snapshot-review-form-v2-completed.json
--     14,516 B sha256
--     dee585f9470b8816e6df706f8c0c081ebf22efc5842d5802a4ecd8daaea2cba9
-- all four artifacts promoted at main =
-- 5fd7890233df728167a8a838a329ff14c04f0044 (the EXLIB-2Y evidence
-- tip this package builds on).
--
-- HOSTED PRE-STATE THIS BUILDS ON (the promoted EXLIB-2Y evidence):
-- all three snapshots APPROVED carrying Joseph Carfagno's exact
-- tuple at the 23:06Z instant, exactly three immutable pending ->
-- approved review events, vector 3/3/5/3/6/1/2/2/0/0/3 (runs and
-- run items BOTH ZERO — the one-use baseline), published + admitted
-- + fingerprint-fresh Plank content, the two projected
-- relationships, claims invariant 0/0.
--
-- THE DERIVED LAWFUL CREATION SURFACE (from the committed migration
-- bytes): migration 023 REVOKEs ALL on exercise_catalog_import_runs
-- and exercise_catalog_run_items from PUBLIC, anon, authenticated
-- and grants nothing back; no committed function INSERTs into
-- either table (exlib_approve_and_seal_run only UPDATEs an existing
-- run; the migration-027 NOLOGIN roles hold EXECUTE on content-
-- lifecycle functions only) — so a direct owner INSERT in the
-- hosted operator context is the ONLY lawful creation surface. The
-- exlib_freeze_run_row INSERT branch requires runs to be BORN
-- unsealed, unapproved, and unrevoked (approval evidence and
-- dry_run are writable pre-seal staging fields; the
-- approval_audit_chk CHECK binds evidence completeness only when
-- approved_for_delivery becomes true). exlib_freeze_run_membership
-- permits item INSERTs only while the parent run is unsealed and
-- locks the parent row FOR UPDATE. Members are resolved through
-- their GOVERNED IDENTITIES ONLY — snapshots by logical_id +
-- is_active = true (unique under
-- exercise_catalog_one_active_logical_idx), aliases by logical_id +
-- exact alias text (unique under
-- exercise_catalog_aliases_unique_idx) — never through a
-- hosted-generated surrogate UUID; no snapshot, event, or alias
-- surrogate literal appears anywhere in this package.
--
-- FAIL-CLOSED SHAPE: one transaction; SHARE ROW EXCLUSIVE locks
-- over the eleven gated catalog tables taken before any gated read,
-- so a concurrent writer (including a concurrent second execution)
-- serializes against this package and the loser refuses at the
-- preconditions; every precondition and postcondition RAISEs on
-- mismatch, rolling back EVERYTHING — a partial staging cannot
-- commit. Live tenant surfaces are captured-and-compared inside the
-- transaction (digest equality), never pinned to absolute counts,
-- because production signups lawfully change them.
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
-- The S4 act writes ONLY the two run tables, so EVERY other catalog
-- surface — including the approved snapshots themselves (their
-- created_at rides inside the row digest) and the immutable review
-- events — is captured here and must be byte-identical afterward.
CREATE TEMP TABLE exlib2u_capture ON COMMIT DROP AS
SELECT
  (SELECT md5(coalesce(string_agg(c::text,'|' ORDER BY c.logical_id, c.catalog_version),'-')) FROM public.exercise_catalog c)    AS snapshot_digest,
  (SELECT md5(coalesce(string_agg(e::text,'|' ORDER BY e.catalog_id, e.created_at),'-')) FROM public.exercise_catalog_review_events e) AS events_digest,
  (SELECT md5(coalesce(string_agg(m::text,'|' ORDER BY m.catalog_id, m.muscle),'-')) FROM public.exercise_catalog_muscles m)      AS anatomy_digest,
  (SELECT md5(coalesce(string_agg(a::text,'|' ORDER BY a.logical_id, a.alias),'-')) FROM public.exercise_catalog_aliases a)      AS alias_digest,
  (SELECT md5(coalesce(string_agg(n::text,'|' ORDER BY n.normalized_name),'-')) FROM public.exercise_catalog_name_claims n)      AS claims_digest,
  (SELECT md5(coalesce(string_agg(c::text,'|' ORDER BY c.id),'-')) FROM public.exercise_catalog_content c)                       AS content_digest,
  (SELECT md5(coalesce(string_agg(x::text,'|' ORDER BY x.relation, x.to_logical_id),'-')) FROM public.exercise_catalog_content_expected_relationships x) AS expected_rel_digest,
  (SELECT md5(coalesce(string_agg(r::text,'|' ORDER BY r.relation, r.to_logical_id),'-')) FROM public.exercise_catalog_relationships r)                  AS projection_digest,
  (SELECT md5(coalesce(string_agg(l::text,'|' ORDER BY l.id),'-')) FROM public.exercise_catalog_logical l)                       AS logical_digest,
  (SELECT count(*)::text || ':' || md5(coalesce(string_agg(t::text,'|' ORDER BY t.id),'-')) FROM public.exercises t)             AS tenant_digest,
  (SELECT count(*)::text || ':' || md5(coalesce(string_agg(t::text,'|' ORDER BY t.id),'-')) FROM public.exercise_aliases t)      AS tenant_alias_digest,
  (SELECT string_agg(x.rolname || '=' || x.n::text, ',' ORDER BY x.rolname)
     FROM (SELECT r.rolname, count(*) AS n
             FROM pg_catalog.pg_auth_members am JOIN pg_roles r ON r.oid = am.roleid
            WHERE r.rolname IN ('exlib_catalog_loader','exlib_catalog_reviewer','exlib_catalog_admission','exlib_catalog_admin')
            GROUP BY r.rolname) x)                                                                                               AS authority_shape;

-- ── Preconditions (ANY mismatch aborts EVERYTHING) ───────────────
DO $pre$
DECLARE
  v_counts TEXT;
  v_row    public.exercise_catalog%ROWTYPE;
  v_n      INTEGER;
  v_line   TEXT;
  v_orph   BIGINT;
  v_unc    BIGINT;
BEGIN
  -- executor posture: the hosted operator (table owner), nothing else
  IF current_user <> 'postgres' THEN
    RAISE EXCEPTION 'exlib2u staging: must run as the hosted operator role postgres (current_user=%); refusing', current_user;
  END IF;

  -- structural presence of the run machinery this posture depends on
  IF to_regclass('public.exercise_catalog_import_runs') IS NULL
     OR to_regclass('public.exercise_catalog_run_items') IS NULL
     OR to_regprocedure('public.exlib_approve_and_seal_run(text)') IS NULL
     OR to_regprocedure('public.deliver_catalog_exercises(text)') IS NULL THEN
    RAISE EXCEPTION 'exlib2u staging: the run tables, the S5 seal function, or the delivery function are missing; wrong or unmigrated database';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
                 WHERE c.relname = 'exercise_catalog_import_runs' AND NOT t.tgisinternal)
     OR NOT EXISTS (SELECT 1 FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
                    WHERE c.relname = 'exercise_catalog_run_items' AND NOT t.tgisinternal) THEN
    RAISE EXCEPTION 'exlib2u staging: the run-row or run-membership freeze trigger is missing; refusing';
  END IF;

  -- the exact post-EXLIB-2Y evidence baseline. Runs and run items
  -- BOTH ZERO is the ONE-USE gate: after this package commits (or
  -- after ANY run exists) the baseline is gone forever.
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
    RAISE EXCEPTION 'exlib2u staging: catalog state vector is % (expected the post-EXLIB-2Y evidence baseline 3/3/5/3/6/1/2/2/0/0/3); refusing — this package is ONE-USE and its baseline is gone', v_counts;
  END IF;
  IF EXISTS (SELECT 1 FROM public.exercise_catalog_import_runs r
              WHERE r.run_key = 'exlib2u-plank-release1-staged-v1') THEN
    RAISE EXCEPTION 'exlib2u staging: the reserved run key already exists; refusing — this package is ONE-USE';
  END IF;

  -- ── Plank (logical e21b2c00-0000-4000-a000-000000000001):
  --    exactly one active row, APPROVED with the applied EXLIB-2Y
  --    tuple, every governed field still the decision packet's ────
  SELECT count(*) INTO v_n FROM public.exercise_catalog c
   WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000001' AND c.is_active = true;
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'exlib2u staging: expected exactly one active Plank snapshot by logical identity, found %; refusing', v_n;
  END IF;
  SELECT c.* INTO v_row FROM public.exercise_catalog c
   WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000001' AND c.is_active = true
   FOR UPDATE;
  IF v_row.review_status <> 'approved'
     OR v_row.reviewed_by IS DISTINCT FROM 'Joseph Carfagno'
     OR v_row.reviewed_at IS DISTINCT FROM TIMESTAMPTZ '2026-09-07T19:06:00-04:00'
     OR v_row.review_rationale IS DISTINCT FROM 'Approved as an accurate timed, bilateral bodyweight core exercise.' THEN
    RAISE EXCEPTION 'exlib2u staging: the Plank snapshot does not carry the applied EXLIB-2Y approval tuple (status=%); refusing', v_row.review_status;
  END IF;
  IF v_row.created_at IS NULL THEN
    RAISE EXCEPTION 'exlib2u staging: the Plank snapshot created_at is NULL (schema violation); refusing';
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
    RAISE EXCEPTION 'exlib2u staging: the live Plank snapshot governed fields differ from the promoted decision packet; the reserved membership decision is VOID for this row; refusing';
  END IF;

  -- ── Dead bug (logical e21b2c00-0000-4000-a000-000000000002) ───
  SELECT count(*) INTO v_n FROM public.exercise_catalog c
   WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000002' AND c.is_active = true;
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'exlib2u staging: expected exactly one active Dead bug snapshot by logical identity, found %; refusing', v_n;
  END IF;
  SELECT c.* INTO v_row FROM public.exercise_catalog c
   WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000002' AND c.is_active = true
   FOR UPDATE;
  IF v_row.review_status <> 'approved'
     OR v_row.reviewed_by IS DISTINCT FROM 'Joseph Carfagno'
     OR v_row.reviewed_at IS DISTINCT FROM TIMESTAMPTZ '2026-09-07T19:06:00-04:00'
     OR v_row.review_rationale IS DISTINCT FROM 'Approved as an accurate alternating bodyweight core and mobility exercise.' THEN
    RAISE EXCEPTION 'exlib2u staging: the Dead bug snapshot does not carry the applied EXLIB-2Y approval tuple (status=%); refusing', v_row.review_status;
  END IF;
  IF v_row.created_at IS NULL THEN
    RAISE EXCEPTION 'exlib2u staging: the Dead bug snapshot created_at is NULL (schema violation); refusing';
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
    RAISE EXCEPTION 'exlib2u staging: the live Dead bug snapshot governed fields differ from the promoted decision packet; the reserved membership decision is VOID for this row; refusing';
  END IF;

  -- ── Ab wheel rollout (logical e21b2c00-0000-4000-a000-000000000003)
  SELECT count(*) INTO v_n FROM public.exercise_catalog c
   WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000003' AND c.is_active = true;
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'exlib2u staging: expected exactly one active Ab wheel rollout snapshot by logical identity, found %; refusing', v_n;
  END IF;
  SELECT c.* INTO v_row FROM public.exercise_catalog c
   WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000003' AND c.is_active = true
   FOR UPDATE;
  IF v_row.review_status <> 'approved'
     OR v_row.reviewed_by IS DISTINCT FROM 'Joseph Carfagno'
     OR v_row.reviewed_at IS DISTINCT FROM TIMESTAMPTZ '2026-09-07T19:06:00-04:00'
     OR v_row.review_rationale IS DISTINCT FROM 'Approved as an accurate advanced bilateral weighted-repetition core exercise.' THEN
    RAISE EXCEPTION 'exlib2u staging: the Ab wheel rollout snapshot does not carry the applied EXLIB-2Y approval tuple (status=%); refusing', v_row.review_status;
  END IF;
  IF v_row.created_at IS NULL THEN
    RAISE EXCEPTION 'exlib2u staging: the Ab wheel rollout snapshot created_at is NULL (schema violation); refusing';
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
    RAISE EXCEPTION 'exlib2u staging: the live Ab wheel rollout snapshot governed fields differ from the promoted decision packet; the reserved membership decision is VOID for this row; refusing';
  END IF;

  -- the review-event surface is EXACTLY the three applied EXLIB-2Y
  -- events (one pending -> approved per identity carrying the same
  -- tuple) — a fourth event, a different transition, or a foreign
  -- tuple means the reviewed world has moved and the reserved
  -- decisions no longer describe it
  SELECT string_agg(
           c.logical_id::text || '#' || e.from_status || '>' || e.to_status || '#' || e.reviewed_by || '#'
           || (e.reviewed_at = TIMESTAMPTZ '2026-09-07T19:06:00-04:00')::text || '#' || e.review_rationale,
           E'\n' ORDER BY c.logical_id)
    INTO v_line
    FROM public.exercise_catalog_review_events e
    JOIN public.exercise_catalog c ON c.id = e.catalog_id;
  IF v_line IS DISTINCT FROM
        'e21b2c00-0000-4000-a000-000000000001#pending>approved#Joseph Carfagno#true#Approved as an accurate timed, bilateral bodyweight core exercise.'
     || E'\n' || 'e21b2c00-0000-4000-a000-000000000002#pending>approved#Joseph Carfagno#true#Approved as an accurate alternating bodyweight core and mobility exercise.'
     || E'\n' || 'e21b2c00-0000-4000-a000-000000000003#pending>approved#Joseph Carfagno#true#Approved as an accurate advanced bilateral weighted-repetition core exercise.' THEN
    RAISE EXCEPTION 'exlib2u staging: the review-event surface is not exactly the three applied EXLIB-2Y events; refusing (got: %)', v_line;
  END IF;

  -- the alias membership source is EXACTLY the three promoted
  -- aliases bound to their governed logical identities
  SELECT string_agg(a.logical_id::text || '#' || a.alias, E'\n' ORDER BY a.logical_id, a.alias)
    INTO v_line
    FROM public.exercise_catalog_aliases a;
  IF v_line IS DISTINCT FROM
        'e21b2c00-0000-4000-a000-000000000001#Forearm plank'
     || E'\n' || 'e21b2c00-0000-4000-a000-000000000001#Front plank'
     || E'\n' || 'e21b2c00-0000-4000-a000-000000000003#Ab roller rollout' THEN
    RAISE EXCEPTION 'exlib2u staging: the catalog alias surface is not exactly the three promoted aliases; refusing (got: %)', v_line;
  END IF;

  -- the publication surface this staging must PRESERVE must be
  -- present exactly as promoted (published Plank content, fresh
  -- fingerprint equality, the two projected relationships)
  IF (SELECT count(*) FROM public.exercise_catalog_content c
      WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000001'
        AND c.publication_status = 'published'
        AND c.import_admitted = true
        AND c.admitted_fingerprint = public.exlib_content_admission_fingerprint(c.id)) <> 1 THEN
    RAISE EXCEPTION 'exlib2u staging: the published, admitted, fingerprint-fresh Plank content row is not exactly present; refusing';
  END IF;
  IF (SELECT coalesce(string_agg(r.relation||'>'||r.to_logical_id::text, ',' ORDER BY r.relation), '<none>')
        FROM public.exercise_catalog_relationships r
       WHERE r.from_logical_id = 'e21b2c00-0000-4000-a000-000000000001')
     <> 'progression>e21b2c00-0000-4000-a000-000000000003,substitution>e21b2c00-0000-4000-a000-000000000002' THEN
    RAISE EXCEPTION 'exlib2u staging: the projected Plank relationships are not exactly the promoted pair; refusing';
  END IF;

  -- catalog claims invariant
  SELECT orphaned_claims, unclaimed_bearers INTO v_orph, v_unc FROM public.exlib_verify_catalog_claims();
  IF v_orph <> 0 OR v_unc <> 0 THEN
    RAISE EXCEPTION 'exlib2u staging: claims invariant broken (%/%); refusing', v_orph, v_unc;
  END IF;
END;
$pre$;

-- ── THE S4 ACT: one staged run + its six membership rows ─────────
-- The run is born in the Design-S4 SELECTED posture. Every value
-- below is the reserved authority artifact's, character-for-
-- character; the freeze trigger's INSERT branch admits it because
-- the run is born unsealed, unapproved, and unrevoked.
INSERT INTO public.exercise_catalog_import_runs
  (run_key, dry_run,
   product_approved_by, product_approved_at,
   legal_approved_by, legal_approved_at,
   approval_rationale)
VALUES
  ('exlib2u-plank-release1-staged-v1', false,
   'Joseph Carfagno', TIMESTAMPTZ '2026-09-07T11:05:00-04:00',
   'Joseph Carfagno', TIMESTAMPTZ '2026-09-07T11:05:00-04:00',
   'Approved for staged delivery validation of Plank and its reviewed progression and substitution targets. This does not authorize sealing, production delivery, or enabling the delivery flag; those remain separately gated.');

-- exercise members: the three approved identities, resolved by
-- governed logical identity + is_active (never a surrogate)
INSERT INTO public.exercise_catalog_run_items (run_id, catalog_id)
SELECT r.id, c.id
  FROM public.exercise_catalog_import_runs r
  JOIN public.exercise_catalog c
    ON c.logical_id IN ('e21b2c00-0000-4000-a000-000000000001',
                        'e21b2c00-0000-4000-a000-000000000002',
                        'e21b2c00-0000-4000-a000-000000000003')
   AND c.is_active = true
 WHERE r.run_key = 'exlib2u-plank-release1-staged-v1';

-- alias members: all three catalog aliases, resolved by governed
-- logical identity + exact alias text (the alias gate above proved
-- these are the ONLY three alias rows)
INSERT INTO public.exercise_catalog_run_items (run_id, catalog_alias_id)
SELECT r.id, a.id
  FROM public.exercise_catalog_import_runs r
  JOIN public.exercise_catalog_aliases a
    ON (a.logical_id, a.alias) IN (
         (UUID 'e21b2c00-0000-4000-a000-000000000001', 'Front plank'),
         (UUID 'e21b2c00-0000-4000-a000-000000000001', 'Forearm plank'),
         (UUID 'e21b2c00-0000-4000-a000-000000000003', 'Ab roller rollout'))
 WHERE r.run_key = 'exlib2u-plank-release1-staged-v1';

-- ── Postconditions (ANY mismatch rolls back EVERYTHING) ─────────
DO $post$
DECLARE
  v_counts   TEXT;
  v_line     TEXT;
  v_cap      RECORD;
  v_run      public.exercise_catalog_import_runs%ROWTYPE;
  v_exercise_members INTEGER;
  v_alias_members    INTEGER;
  v_unready  INTEGER;
BEGIN
  SELECT * INTO v_cap FROM exlib2u_capture;

  -- the vector moved in EXACTLY two positions: runs 0 -> 1 and run
  -- items 0 -> 6; everything else is count-identical
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
  IF v_counts <> '3/3/5/3/6/1/2/2/1/6/3' THEN
    RAISE EXCEPTION 'exlib2u staging: post-state vector is % (expected 3/3/5/3/6/1/2/2/1/6/3); rolling back everything', v_counts;
  END IF;

  -- the run row is EXACTLY the Design-S4 SELECTED staged posture
  -- carrying the reserved evidence values and nothing else
  SELECT * INTO v_run FROM public.exercise_catalog_import_runs
   WHERE run_key = 'exlib2u-plank-release1-staged-v1';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'exlib2u staging: the staged run row is missing after the act; rolling back everything';
  END IF;
  IF v_run.dry_run <> false
     OR v_run.approved_for_delivery <> false
     OR v_run.sealed_at IS NOT NULL
     OR v_run.revoked_at IS NOT NULL
     OR v_run.started_at IS NOT NULL
     OR v_run.completed_at IS NOT NULL
     OR v_run.result_counts IS NOT NULL
     OR v_run.created_at IS NULL
     OR v_run.product_approved_by IS DISTINCT FROM 'Joseph Carfagno'
     OR v_run.product_approved_at IS DISTINCT FROM TIMESTAMPTZ '2026-09-07T11:05:00-04:00'
     OR v_run.legal_approved_by IS DISTINCT FROM 'Joseph Carfagno'
     OR v_run.legal_approved_at IS DISTINCT FROM TIMESTAMPTZ '2026-09-07T11:05:00-04:00'
     OR v_run.approval_rationale IS DISTINCT FROM 'Approved for staged delivery validation of Plank and its reviewed progression and substitution targets. This does not authorize sealing, production delivery, or enabling the delivery flag; those remain separately gated.' THEN
    RAISE EXCEPTION 'exlib2u staging: the run row is not exactly the selected staged posture with the reserved evidence; rolling back everything';
  END IF;

  -- the six membership rows, resolved back through governed
  -- identity (never surrogates), are exactly ALL_THREE_IDENTITIES
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
     || E'\n' || 'exercise#e21b2c00-0000-4000-a000-000000000003' THEN
    RAISE EXCEPTION 'exlib2u staging: the membership is not exactly the six ALL_THREE_IDENTITIES rows; rolling back everything (got: %)', v_line;
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_run_items ri WHERE ri.run_id <> v_run.id) <> 0 THEN
    RAISE EXCEPTION 'exlib2u staging: membership rows exist outside the staged run; rolling back everything';
  END IF;

  -- STRUCTURAL NON-DELIVERABILITY: the delivery gate's own
  -- predicate (copied from the committed deliver_catalog_exercises
  -- bytes), evaluated here — NEVER the function — matches ZERO rows
  IF (SELECT count(*) FROM public.exercise_catalog_import_runs r
       WHERE r.run_key = 'exlib2u-plank-release1-staged-v1'
         AND r.approved_for_delivery = true
         AND r.dry_run = false
         AND r.sealed_at IS NOT NULL
         AND r.revoked_at IS NULL) <> 0 THEN
    RAISE EXCEPTION 'exlib2u staging: the staged run satisfies the delivery predicate (it must NOT); rolling back everything';
  END IF;

  -- STRUCTURAL S5-PROMOTABILITY: the seal validation's own queries
  -- (copied from the committed exlib_freeze_run_row bytes) find a
  -- NON-EMPTY membership (3 exercise + 3 alias members) with ZERO
  -- unready exercise members — one later, separately gated
  -- exlib_approve_and_seal_run call can promote this run; NOTHING
  -- here performs, calls, or simulates that transition
  SELECT count(*) FILTER (WHERE ri.catalog_id IS NOT NULL),
         count(*) FILTER (WHERE ri.catalog_alias_id IS NOT NULL)
    INTO v_exercise_members, v_alias_members
  FROM public.exercise_catalog_run_items ri
  WHERE ri.run_id = v_run.id;
  IF COALESCE(v_exercise_members, 0) <> 3 OR COALESCE(v_alias_members, 0) <> 3 THEN
    RAISE EXCEPTION 'exlib2u staging: seal-shape counts are %/% (expected 3 exercise + 3 alias members); rolling back everything', v_exercise_members, v_alias_members;
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
    RAISE EXCEPTION 'exlib2u staging: % exercise member(s) would fail the S5 seal validation; rolling back everything', v_unready;
  END IF;

  -- every unrelated surface byte-preserved (captured pre vs now):
  -- snapshots (incl. their created_at), events, anatomy, aliases,
  -- claims, content, expected relationships, projection, logical
  IF (SELECT md5(coalesce(string_agg(c::text,'|' ORDER BY c.logical_id, c.catalog_version),'-')) FROM public.exercise_catalog c) <> v_cap.snapshot_digest
     OR (SELECT md5(coalesce(string_agg(e::text,'|' ORDER BY e.catalog_id, e.created_at),'-')) FROM public.exercise_catalog_review_events e) <> v_cap.events_digest
     OR (SELECT md5(coalesce(string_agg(m::text,'|' ORDER BY m.catalog_id, m.muscle),'-')) FROM public.exercise_catalog_muscles m) <> v_cap.anatomy_digest
     OR (SELECT md5(coalesce(string_agg(a::text,'|' ORDER BY a.logical_id, a.alias),'-')) FROM public.exercise_catalog_aliases a) <> v_cap.alias_digest
     OR (SELECT md5(coalesce(string_agg(n::text,'|' ORDER BY n.normalized_name),'-')) FROM public.exercise_catalog_name_claims n) <> v_cap.claims_digest
     OR (SELECT md5(coalesce(string_agg(c::text,'|' ORDER BY c.id),'-')) FROM public.exercise_catalog_content c) <> v_cap.content_digest
     OR (SELECT md5(coalesce(string_agg(x::text,'|' ORDER BY x.relation, x.to_logical_id),'-')) FROM public.exercise_catalog_content_expected_relationships x) <> v_cap.expected_rel_digest
     OR (SELECT md5(coalesce(string_agg(r::text,'|' ORDER BY r.relation, r.to_logical_id),'-')) FROM public.exercise_catalog_relationships r) <> v_cap.projection_digest
     OR (SELECT md5(coalesce(string_agg(l::text,'|' ORDER BY l.id),'-')) FROM public.exercise_catalog_logical l) <> v_cap.logical_digest THEN
    RAISE EXCEPTION 'exlib2u staging: an unrelated catalog surface changed (snapshot/events/anatomy/alias/claims/content/expected/projection/logical); rolling back everything';
  END IF;
  IF (SELECT count(*)::text || ':' || md5(coalesce(string_agg(t::text,'|' ORDER BY t.id),'-')) FROM public.exercises t) <> v_cap.tenant_digest
     OR (SELECT count(*)::text || ':' || md5(coalesce(string_agg(t::text,'|' ORDER BY t.id),'-')) FROM public.exercise_aliases t) <> v_cap.tenant_alias_digest THEN
    RAISE EXCEPTION 'exlib2u staging: a tenant surface changed inside the gated interval; rolling back everything';
  END IF;
  IF (SELECT string_agg(x.rolname || '=' || x.n::text, ',' ORDER BY x.rolname)
        FROM (SELECT r.rolname, count(*) AS n
                FROM pg_catalog.pg_auth_members am JOIN pg_roles r ON r.oid = am.roleid
               WHERE r.rolname IN ('exlib_catalog_loader','exlib_catalog_reviewer','exlib_catalog_admission','exlib_catalog_admin')
               GROUP BY r.rolname) x) IS DISTINCT FROM v_cap.authority_shape THEN
    RAISE EXCEPTION 'exlib2u staging: the catalog authority shape changed (this package changes NO authority); rolling back everything';
  END IF;

  -- the claims invariant still holds
  IF (SELECT orphaned_claims::text||'/'||unclaimed_bearers::text FROM public.exlib_verify_catalog_claims()) <> '0/0' THEN
    RAISE EXCEPTION 'exlib2u staging: claims invariant broken after staging; rolling back everything';
  END IF;
END;
$post$;

-- surfaced result (display evidence; the committed rows are the proof)
SELECT 'EXLIB-2U STAGED' AS result,
       (SELECT count(*) FROM public.exercise_catalog_import_runs) AS runs,
       (SELECT count(*) FROM public.exercise_catalog_run_items) AS run_items,
       (SELECT (r.dry_run = false AND r.approved_for_delivery = false
                AND r.sealed_at IS NULL AND r.revoked_at IS NULL)
          FROM public.exercise_catalog_import_runs r
         WHERE r.run_key = 'exlib2u-plank-release1-staged-v1') AS staged_non_deliverable;

COMMIT;
