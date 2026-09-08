-- ============================================================
-- EXLIB-2Z — S5 seal package (APPROVE + PERMANENT SEAL)
-- STATUS: PREPARED — NOT EXECUTED — NOT AUTHORIZED FOR EXECUTION.
-- ONE-USE, NOT idempotent, and MATERIALLY IRREVERSIBLE.
--
-- WHAT THIS IS: the single lawful S5 act of the promoted activation
-- design — EXACTLY ONE public.exlib_approve_and_seal_run call on
-- the staged EXLIB-2U run. From the committed migration-023 bytes,
-- that call atomically sets approved_for_delivery = true and
-- sealed_at = NOW() in the single validated unsealed -> sealed
-- transition, PERMANENTLY freezing the run's membership and every
-- approval-bound field (run_key, dry_run, approved_for_delivery,
-- both approver identities and timestamps, the approval rationale,
-- sealed_at, created_at). Nothing else: NO delivery, NO revocation,
-- NO row INSERT/UPDATE/DELETE issued by this package itself, NO
-- snapshot/content/publication/projection change, NO tenant change,
-- NO authority change, NO environment change.
--
-- IRREVERSIBILITY, PLAINLY: a run seals AT MOST ONCE, forever. The
-- promoted contract provides NO unseal. The only legal post-seal
-- transition is exlib_revoke_run_delivery — a ONE-WAY emergency
-- delivery shutdown that reopens NOTHING (the seal, the membership,
-- and the approval evidence stay frozen exactly as sealed) and is
-- NOT part of S5 and NOT authorized by anything here. A different
-- approval decision requires a NEW run under a NEW key through the
-- whole S4 pipeline; the only other path back is a physical restore
-- that would rewind every later write with it.
--
-- RISK ELEVATION, THE HONEST CONSEQUENCE: after this seal the
-- delivery gate's own five-conjunct predicate (run_key match AND
-- approved_for_delivery = true AND dry_run = false AND sealed_at IS
-- NOT NULL AND revoked_at IS NULL) MATCHES this run. The delivery
-- function is SECURITY DEFINER with EXECUTE granted to the
-- authenticated role (granted by migration 023 and expressly
-- retained by migration 026, whose bytes record that CREATE OR
-- REPLACE preserves existing ACLs) — so sealing makes catalog
-- delivery REACHABLE by any authenticated caller that names the run
-- key, into that caller's own tenant, independently of the
-- application's strictly-OFF delivery flag. The database-side
-- predicate is the security boundary, and S5 is the act that flips
-- it. Sealing is therefore the LAST database gate before
-- user-reachable delivery; delivery itself still does not run
-- unless something calls it, and nothing here does.
--
-- EXECUTION AUTHORITY: may ONLY ever be applied to the Supabase
-- project "ShredOS" ref ttybyljytiwntvorugcv, ONLY by Joseph or
-- ChatGPT in the hosted SQL editor (operator posture: the
-- NON-SUPERUSER role postgres, the table owner — the seal function
-- is deliberately NOT client-callable: migration 023 REVOKEs it
-- from PUBLIC, anon, AND authenticated and grants nothing back),
-- and never by Claude and never by any automated pipeline. Exactly
-- ONE execution is authorizable, only after Codex review of this
-- package and its own explicit one-use human authorization with a
-- spent-check first; a second execution REFUSES at the one-use
-- posture gate below (the run is already sealed). A FAILED or
-- AMBIGUOUS attempt must never be retried blind: the preparation
-- record's ambiguity protocol (read-only disambiguation, then a
-- fresh human decision) governs.
--
-- OPERATOR PREFLIGHT (hosted-only facts these environment-neutral
-- bytes cannot gate; ALL required, read-only, immediately before
-- execution — the preparation record carries the exact queries and
-- expected values):
--   1. the SQL editor is connected to ShredOS ttybyljytiwntvorugcv;
--   2. this file's sha256 equals the promoted fingerprint in the
--      preparation record (re-measured, never trusted from a copy);
--   3. the staged run's hosted surrogate id and created_at equal
--      the preserved EXLIB-2U application evidence — surrogates are
--      hosted-generated, so their pins live in the preparation
--      record, never in these bytes;
--   4. a current physical backup is verified present and its
--      rewind horizon understood;
--   5. the one-use authorization for THIS fingerprint is unspent.
--
-- RESERVED AUTHORITY INPUTS (unchanged; the seal WRITES no
-- evidence — it validates and permanently freezes the values the
-- SPENT EXLIB-2U staging already carries, all reserved by
-- docs/exlib2v-s4-authority-inputs-form-completed.json, 3,416 B
-- sha256
-- 6cf77759f7a8ddf89d32b2fd225bcbe0eddaf09587dcc9d01a657752b9adeeae):
--   run_key    = exlib2u-plank-release1-staged-v1
--   product_approved_by = legal_approved_by = Joseph Carfagno
--   product_approved_at = legal_approved_at =
--                TIMESTAMPTZ '2026-09-07T11:05:00-04:00' (the
--     AUTHORITY-decision instant; the snapshot approvals are the
--     SEPARATE renewed decisions at 19:06-04:00, each gated below
--     inside its own family, never substituted)
--   approval_rationale = the artifact's exact string (gated below
--     character-for-character)
--   membership = ALL_THREE_IDENTITIES (six rows, gated below)
--
-- HOSTED PRE-STATE THIS BUILDS ON (the promoted EXLIB-2U
-- application evidence): vector 3/3/5/3/6/1/2/2/1/6/3 — EXACTLY ONE
-- staged run (the reserved key; dry_run = false, unapproved,
-- unsealed, unrevoked, operational fields NULL, the reserved
-- evidence verbatim) with its SIX membership rows, over the three
-- APPROVED snapshots carrying the applied EXLIB-2Y tuples, three
-- immutable review events, published + admitted + fingerprint-fresh
-- Plank content, the two projected relationships, claims invariant
-- 0/0, and delivery having NEVER run (zero tenant rows carry an
-- import_run_id).
--
-- FAIL-CLOSED SHAPE: one transaction; the same eleven-table SHARE
-- ROW EXCLUSIVE lock set as the reviewed EXLIB-2U package, taken
-- before any gated read; the run row additionally locked FOR UPDATE
-- at its first gate (the same row lock the seal function and both
-- freeze triggers take, so nothing about the run can move inside
-- the gated interval); every precondition RAISEs — STOP / DO NOT
-- SEAL — before the seal call, and every postcondition RAISEs after
-- it, so a postcondition failure rolls back THE SEAL ITSELF (proven
-- by the live suite's tampered-copy control). The trigger-binding
-- and authority gates below are byte-identical to the reviewed,
-- hosted-proven EXLIB-2U package blocks (inherited, not rewritten).
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
-- The S5 act updates ONLY the run row's two seal columns, so every
-- other surface — the membership rows themselves (whole-row), the
-- run's immutable evidence line, snapshots, events, anatomy,
-- aliases, claims, content, relationships, logical, tenant, and
-- authority — is captured here and must be byte-identical after.
CREATE TEMP TABLE exlib2z_capture ON COMMIT DROP AS
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
  (SELECT md5(coalesce(string_agg(ri::text,'|' ORDER BY ri.id),'-')) FROM public.exercise_catalog_run_items ri)                  AS run_items_digest,
  (SELECT r.run_key||'#'||r.dry_run::text||'#'||r.product_approved_by||'#'||r.product_approved_at::text||'#'||r.legal_approved_by||'#'||r.legal_approved_at::text||'#'||md5(r.approval_rationale)||'#'||r.created_at::text
     FROM public.exercise_catalog_import_runs r
    WHERE r.run_key = 'exlib2u-plank-release1-staged-v1')                                                                        AS run_evidence_line,
  (SELECT count(*)::text || ':' || md5(coalesce(string_agg(t::text,'|' ORDER BY t.id),'-')) FROM public.exercises t)             AS tenant_digest,
  (SELECT count(*)::text || ':' || md5(coalesce(string_agg(t::text,'|' ORDER BY t.id),'-')) FROM public.exercise_aliases t)      AS tenant_alias_digest,
  (SELECT md5(coalesce(string_agg(am::text, '|' ORDER BY am.roleid, am.member, am.grantor),'-'))
     FROM pg_catalog.pg_auth_members am
     JOIN pg_roles g ON g.oid = am.roleid
    WHERE g.rolname IN ('exlib_catalog_loader','exlib_catalog_reviewer','exlib_catalog_admission','exlib_catalog_admin'))       AS authority_digest;

-- ── Preconditions (ANY mismatch aborts EVERYTHING before the seal:
--    STOP / DO NOT SEAL) ────────────────────────────────────────
DO $pre$
DECLARE
  v_counts TEXT;
  v_run    public.exercise_catalog_import_runs%ROWTYPE;
  v_row    public.exercise_catalog%ROWTYPE;
  v_n      INTEGER;
  v_line   TEXT;
  v_orph   BIGINT;
  v_unc    BIGINT;
  v_exercise_members INTEGER;
  v_alias_members    INTEGER;
  v_unready INTEGER;
BEGIN
  -- executor posture: the hosted operator (table owner), nothing else
  IF current_user <> 'postgres' THEN
    RAISE EXCEPTION 'exlib2z seal: must run as the hosted operator role postgres (current_user=%); refusing — STOP / DO NOT SEAL', current_user;
  END IF;

  -- structural presence of the machinery this act depends on
  IF to_regclass('public.exercise_catalog_import_runs') IS NULL
     OR to_regclass('public.exercise_catalog_run_items') IS NULL
     OR to_regprocedure('public.exlib_approve_and_seal_run(text)') IS NULL
     OR to_regprocedure('public.exlib_revoke_run_delivery(text)') IS NULL
     OR to_regprocedure('public.deliver_catalog_exercises(text)') IS NULL THEN
    RAISE EXCEPTION 'exlib2z seal: the run tables, the S5 seal function, the revocation function, or the delivery function are missing; wrong or unmigrated database; refusing — STOP / DO NOT SEAL';
  END IF;
  -- the two freeze triggers this act depends on must be EXACTLY the
  -- promoted bindings (byte-identical gate inherited from the
  -- reviewed EXLIB-2U package): the promoted trigger name on the
  -- promoted table executing the promoted function over the
  -- promoted BEFORE-ROW event set (tgtype 23 = ROW + BEFORE +
  -- INSERT + UPDATE; tgtype 31 adds DELETE), ENABLED in the default
  -- origin mode ('O'), and each the ONLY non-internal trigger on
  -- its table — so a missing, disabled, decoy-rebound, event-
  -- narrowed, or shadow-supplemented trigger all refuse
  IF (SELECT count(*) FROM pg_catalog.pg_trigger t
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
    RAISE EXCEPTION 'exlib2z seal: the run-row or run-membership freeze trigger is not EXACTLY bound and enabled (promoted name, table, function, event set, enabled state, sole non-internal trigger); refusing — STOP / DO NOT SEAL';
  END IF;

  -- the catalog authority baseline must be EXACTLY the reviewed
  -- hosted shape (byte-identical gate inherited from the reviewed
  -- EXLIB-2U package): each of the four catalog roles held by
  -- postgres ALONE, granted by supabase_admin, ADMIN TRUE, INHERIT
  -- FALSE, SET FALSE — exactly four membership rows in total — so a
  -- count-preserving member, grantor, or option substitution refuses
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
    RAISE EXCEPTION 'exlib2z seal: the catalog authority baseline is not exactly the promoted shape (got: %); refusing — STOP / DO NOT SEAL', coalesce(v_line, '<none>');
  END IF;

  -- the exact post-EXLIB-2U staged baseline. ONE run and SIX items
  -- with every other count identical is the front-line gate: any
  -- world drift, any second run, any membership count change moves
  -- the vector and refuses here.
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
    RAISE EXCEPTION 'exlib2z seal: catalog state vector is % (expected the post-EXLIB-2U staged baseline 3/3/5/3/6/1/2/2/1/6/3); refusing — STOP / DO NOT SEAL', v_counts;
  END IF;

  -- the ONE run the vector counts must BE the reserved staged run,
  -- and this SELECT takes the same row lock the seal function and
  -- both freeze triggers take, freezing the run across the gated
  -- interval (a count-camouflaged key substitution refuses here)
  SELECT * INTO v_run
    FROM public.exercise_catalog_import_runs
   WHERE run_key = 'exlib2u-plank-release1-staged-v1'
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'exlib2z seal: the vector reads one run but it is NOT the reserved staged run (the reserved key is missing); refusing — STOP / DO NOT SEAL';
  END IF;

  -- ONE-USE: an already-sealed, already-approved, or revoked run
  -- means the S5 authority was already consumed (or the world is in
  -- an impossible posture); this is also exactly where a second
  -- execution of this package refuses
  IF v_run.sealed_at IS NOT NULL
     OR v_run.approved_for_delivery = true
     OR v_run.revoked_at IS NOT NULL THEN
    RAISE EXCEPTION 'exlib2z seal: the run is already sealed, approved, or revoked — the S5 authority is ONE-USE and this database shows it SPENT; refusing — STOP / DO NOT SEAL';
  END IF;

  -- the staged Design-S4 SELECTED posture, exactly
  IF v_run.dry_run <> false
     OR v_run.started_at IS NOT NULL
     OR v_run.completed_at IS NOT NULL
     OR v_run.result_counts IS NOT NULL
     OR v_run.created_at IS NULL THEN
    RAISE EXCEPTION 'exlib2z seal: the staged run is not in the Design-S4 SELECTED posture (dry_run or an operational field drifted); refusing — STOP / DO NOT SEAL';
  END IF;

  -- the reserved approval evidence, character-for-character — these
  -- are the exact values the seal will freeze forever
  IF v_run.product_approved_by IS DISTINCT FROM 'Joseph Carfagno'
     OR v_run.product_approved_at IS DISTINCT FROM TIMESTAMPTZ '2026-09-07T11:05:00-04:00'
     OR v_run.legal_approved_by IS DISTINCT FROM 'Joseph Carfagno'
     OR v_run.legal_approved_at IS DISTINCT FROM TIMESTAMPTZ '2026-09-07T11:05:00-04:00'
     OR v_run.approval_rationale IS DISTINCT FROM 'Approved for staged delivery validation of Plank and its reviewed progression and substitution targets. This does not authorize sealing, production delivery, or enabling the delivery flag; those remain separately gated.' THEN
    RAISE EXCEPTION 'exlib2z seal: the staged run does not carry the reserved approval evidence character-for-character; refusing — STOP / DO NOT SEAL';
  END IF;

  -- the six membership rows, resolved back through governed
  -- identity (never surrogates), are exactly ALL_THREE_IDENTITIES —
  -- these are the exact rows the seal will freeze forever
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
    RAISE EXCEPTION 'exlib2z seal: the membership is not exactly the six ALL_THREE_IDENTITIES rows; refusing — STOP / DO NOT SEAL (got: %)', v_line;
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_run_items ri WHERE ri.run_id <> v_run.id) <> 0 THEN
    RAISE EXCEPTION 'exlib2z seal: membership rows exist outside the staged run; refusing — STOP / DO NOT SEAL';
  END IF;

  -- delivery must never have occurred, and the unsealed run must
  -- not (impossibly) satisfy the delivery predicate already
  IF (SELECT count(*) FROM public.exercises e WHERE e.import_run_id IS NOT NULL) <> 0 THEN
    RAISE EXCEPTION 'exlib2z seal: delivery has already occurred (tenant rows carry an import_run_id); the world has moved; refusing — STOP / DO NOT SEAL';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_import_runs r
       WHERE r.run_key = 'exlib2u-plank-release1-staged-v1'
         AND r.approved_for_delivery = true
         AND r.dry_run = false
         AND r.sealed_at IS NOT NULL
         AND r.revoked_at IS NULL) <> 0 THEN
    RAISE EXCEPTION 'exlib2z seal: the run already satisfies the delivery predicate BEFORE sealing (impossible unsealed posture); refusing — STOP / DO NOT SEAL';
  END IF;

  -- the seal validation's own member-readiness queries (copied from
  -- the committed exlib_freeze_run_row bytes), evaluated BEFORE the
  -- call as this package's own gate — the identical validation the
  -- trigger will re-run inside the seal statement
  SELECT count(*) FILTER (WHERE ri.catalog_id IS NOT NULL),
         count(*) FILTER (WHERE ri.catalog_alias_id IS NOT NULL)
    INTO v_exercise_members, v_alias_members
  FROM public.exercise_catalog_run_items ri
  WHERE ri.run_id = v_run.id;
  IF COALESCE(v_exercise_members, 0) <> 3 OR COALESCE(v_alias_members, 0) <> 3 THEN
    RAISE EXCEPTION 'exlib2z seal: seal-shape counts are %/% (expected 3 exercise + 3 alias members); refusing — STOP / DO NOT SEAL', v_exercise_members, v_alias_members;
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
    RAISE EXCEPTION 'exlib2z seal: % exercise member(s) would fail the S5 seal validation; refusing — STOP / DO NOT SEAL', v_unready;
  END IF;

  -- ── the reviewed WORLD the sealed membership points into must
  --    still be exactly the promoted decision packets (the same
  --    per-identity, event, alias, publication, and claims gates
  --    the reviewed EXLIB-2U package proved; a seal binds these
  --    rows forever, so drift voids the act) ────────────────────
  SELECT count(*) INTO v_n FROM public.exercise_catalog c
   WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000001' AND c.is_active = true;
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'exlib2z seal: expected exactly one active Plank snapshot by logical identity, found %; refusing — STOP / DO NOT SEAL', v_n;
  END IF;
  SELECT c.* INTO v_row FROM public.exercise_catalog c
   WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000001' AND c.is_active = true
   FOR UPDATE;
  IF v_row.review_status <> 'approved'
     OR v_row.reviewed_by IS DISTINCT FROM 'Joseph Carfagno'
     OR v_row.reviewed_at IS DISTINCT FROM TIMESTAMPTZ '2026-09-07T19:06:00-04:00'
     OR v_row.review_rationale IS DISTINCT FROM 'Approved as an accurate timed, bilateral bodyweight core exercise.' THEN
    RAISE EXCEPTION 'exlib2z seal: the Plank snapshot does not carry the applied EXLIB-2Y approval tuple (status=%); refusing — STOP / DO NOT SEAL', v_row.review_status;
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
    RAISE EXCEPTION 'exlib2z seal: the live Plank snapshot governed fields differ from the promoted decision packet; refusing — STOP / DO NOT SEAL';
  END IF;

  SELECT count(*) INTO v_n FROM public.exercise_catalog c
   WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000002' AND c.is_active = true;
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'exlib2z seal: expected exactly one active Dead bug snapshot by logical identity, found %; refusing — STOP / DO NOT SEAL', v_n;
  END IF;
  SELECT c.* INTO v_row FROM public.exercise_catalog c
   WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000002' AND c.is_active = true
   FOR UPDATE;
  IF v_row.review_status <> 'approved'
     OR v_row.reviewed_by IS DISTINCT FROM 'Joseph Carfagno'
     OR v_row.reviewed_at IS DISTINCT FROM TIMESTAMPTZ '2026-09-07T19:06:00-04:00'
     OR v_row.review_rationale IS DISTINCT FROM 'Approved as an accurate alternating bodyweight core and mobility exercise.' THEN
    RAISE EXCEPTION 'exlib2z seal: the Dead bug snapshot does not carry the applied EXLIB-2Y approval tuple (status=%); refusing — STOP / DO NOT SEAL', v_row.review_status;
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
    RAISE EXCEPTION 'exlib2z seal: the live Dead bug snapshot governed fields differ from the promoted decision packet; refusing — STOP / DO NOT SEAL';
  END IF;

  SELECT count(*) INTO v_n FROM public.exercise_catalog c
   WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000003' AND c.is_active = true;
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'exlib2z seal: expected exactly one active Ab wheel rollout snapshot by logical identity, found %; refusing — STOP / DO NOT SEAL', v_n;
  END IF;
  SELECT c.* INTO v_row FROM public.exercise_catalog c
   WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000003' AND c.is_active = true
   FOR UPDATE;
  IF v_row.review_status <> 'approved'
     OR v_row.reviewed_by IS DISTINCT FROM 'Joseph Carfagno'
     OR v_row.reviewed_at IS DISTINCT FROM TIMESTAMPTZ '2026-09-07T19:06:00-04:00'
     OR v_row.review_rationale IS DISTINCT FROM 'Approved as an accurate advanced bilateral weighted-repetition core exercise.' THEN
    RAISE EXCEPTION 'exlib2z seal: the Ab wheel rollout snapshot does not carry the applied EXLIB-2Y approval tuple (status=%); refusing — STOP / DO NOT SEAL', v_row.review_status;
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
    RAISE EXCEPTION 'exlib2z seal: the live Ab wheel rollout snapshot governed fields differ from the promoted decision packet; refusing — STOP / DO NOT SEAL';
  END IF;

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
    RAISE EXCEPTION 'exlib2z seal: the review-event surface is not exactly the three applied EXLIB-2Y events; refusing — STOP / DO NOT SEAL (got: %)', v_line;
  END IF;

  SELECT string_agg(a.logical_id::text || '#' || a.alias, E'\n' ORDER BY a.logical_id, a.alias)
    INTO v_line
    FROM public.exercise_catalog_aliases a;
  IF v_line IS DISTINCT FROM
        'e21b2c00-0000-4000-a000-000000000001#Forearm plank'
     || E'\n' || 'e21b2c00-0000-4000-a000-000000000001#Front plank'
     || E'\n' || 'e21b2c00-0000-4000-a000-000000000003#Ab roller rollout' THEN
    RAISE EXCEPTION 'exlib2z seal: the catalog alias surface is not exactly the three promoted aliases; refusing — STOP / DO NOT SEAL (got: %)', v_line;
  END IF;

  IF (SELECT count(*) FROM public.exercise_catalog_content c
      WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000001'
        AND c.publication_status = 'published'
        AND c.import_admitted = true
        AND c.admitted_fingerprint = public.exlib_content_admission_fingerprint(c.id)) <> 1 THEN
    RAISE EXCEPTION 'exlib2z seal: the published, admitted, fingerprint-fresh Plank content row is not exactly present; refusing — STOP / DO NOT SEAL';
  END IF;
  IF (SELECT coalesce(string_agg(r.relation||'>'||r.to_logical_id::text, ',' ORDER BY r.relation), '<none>')
        FROM public.exercise_catalog_relationships r
       WHERE r.from_logical_id = 'e21b2c00-0000-4000-a000-000000000001')
     <> 'progression>e21b2c00-0000-4000-a000-000000000003,substitution>e21b2c00-0000-4000-a000-000000000002' THEN
    RAISE EXCEPTION 'exlib2z seal: the projected Plank relationships are not exactly the promoted pair; refusing — STOP / DO NOT SEAL';
  END IF;

  SELECT orphaned_claims, unclaimed_bearers INTO v_orph, v_unc FROM public.exlib_verify_catalog_claims();
  IF v_orph <> 0 OR v_unc <> 0 THEN
    RAISE EXCEPTION 'exlib2z seal: claims invariant broken (%/%); refusing — STOP / DO NOT SEAL', v_orph, v_unc;
  END IF;
END;
$pre$;

-- ── THE S5 ACT: exactly ONE seal call, its result validated ─────
-- exlib_approve_and_seal_run locks the run FOR UPDATE (the row lock
-- the precondition already holds in this transaction), performs the
-- single validated unsealed -> sealed transition (the freeze
-- trigger re-validates evidence and membership inside the same
-- statement), and returns the four-field JSONB result — which must
-- be EXACTLY the reserved shape or everything rolls back.
DO $act$
DECLARE
  v_result JSONB;
BEGIN
  v_result := public.exlib_approve_and_seal_run('exlib2u-plank-release1-staged-v1');
  IF v_result IS DISTINCT FROM jsonb_build_object(
       'run_key', 'exlib2u-plank-release1-staged-v1',
       'sealed', true,
       'exercise_members', 3,
       'alias_members', 3) THEN
    RAISE EXCEPTION 'exlib2z seal: the seal function returned % (expected exactly the reserved four-field result); rolling back everything — the attempted seal does not survive', v_result;
  END IF;
END;
$act$;

-- ── Postconditions (ANY mismatch rolls back EVERYTHING, including
--    the seal itself) ─────────────────────────────────────────────
DO $post$
DECLARE
  v_counts TEXT;
  v_line   TEXT;
  v_cap    RECORD;
  v_run    public.exercise_catalog_import_runs%ROWTYPE;
BEGIN
  SELECT * INTO v_cap FROM exlib2z_capture;

  -- the seal moves NO counts anywhere: the vector is IDENTICAL
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
    RAISE EXCEPTION 'exlib2z seal: post-state vector is % (the seal must move NO counts; expected 3/3/5/3/6/1/2/2/1/6/3); rolling back everything — the attempted seal does not survive', v_counts;
  END IF;

  -- the run row is EXACTLY the sealed posture: approved and sealed
  -- IN THIS TRANSACTION (sealed_at = now() binds the seal instant
  -- to this very transaction), unrevoked, operational fields still
  -- NULL, and every immutable evidence field byte-identical to the
  -- captured pre-seal line
  SELECT * INTO v_run FROM public.exercise_catalog_import_runs
   WHERE run_key = 'exlib2u-plank-release1-staged-v1';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'exlib2z seal: the sealed run row is missing after the act; rolling back everything — the attempted seal does not survive';
  END IF;
  IF v_run.approved_for_delivery <> true
     OR v_run.sealed_at IS NULL
     OR v_run.sealed_at <> now()
     OR v_run.revoked_at IS NOT NULL
     OR v_run.started_at IS NOT NULL
     OR v_run.completed_at IS NOT NULL
     OR v_run.result_counts IS NOT NULL THEN
    RAISE EXCEPTION 'exlib2z seal: the run row is not exactly the sealed posture (approved, sealed at this transaction instant, unrevoked, operational fields NULL); rolling back everything — the attempted seal does not survive';
  END IF;
  IF (v_run.run_key||'#'||v_run.dry_run::text||'#'||v_run.product_approved_by||'#'||v_run.product_approved_at::text||'#'||v_run.legal_approved_by||'#'||v_run.legal_approved_at::text||'#'||md5(v_run.approval_rationale)||'#'||v_run.created_at::text)
     IS DISTINCT FROM v_cap.run_evidence_line THEN
    RAISE EXCEPTION 'exlib2z seal: an immutable evidence field changed across the seal (the seal freezes, never edits); rolling back everything — the attempted seal does not survive';
  END IF;

  -- the membership rows are BYTE-IDENTICAL (whole-row digest): the
  -- seal freezes the six rows exactly as staged
  IF (SELECT md5(coalesce(string_agg(ri::text,'|' ORDER BY ri.id),'-')) FROM public.exercise_catalog_run_items ri)
     IS DISTINCT FROM v_cap.run_items_digest THEN
    RAISE EXCEPTION 'exlib2z seal: a membership row changed across the seal; rolling back everything — the attempted seal does not survive';
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
     || E'\n' || 'exercise#e21b2c00-0000-4000-a000-000000000003' THEN
    RAISE EXCEPTION 'exlib2z seal: the sealed membership is not exactly the six ALL_THREE_IDENTITIES rows; rolling back everything — the attempted seal does not survive (got: %)', v_line;
  END IF;

  -- THE INTENDED IRREVERSIBLE EFFECT, STATED AND VERIFIED: the
  -- delivery gate's own five-conjunct predicate NOW matches EXACTLY
  -- this one run. Delivery itself did NOT run: zero tenant rows
  -- carry an import_run_id, and both tenant digests are identical.
  IF (SELECT count(*) FROM public.exercise_catalog_import_runs r
       WHERE r.run_key = 'exlib2u-plank-release1-staged-v1'
         AND r.approved_for_delivery = true
         AND r.dry_run = false
         AND r.sealed_at IS NOT NULL
         AND r.revoked_at IS NULL) <> 1 THEN
    RAISE EXCEPTION 'exlib2z seal: the sealed run does not satisfy the delivery predicate exactly once (impossible sealed posture); rolling back everything — the attempted seal does not survive';
  END IF;
  IF (SELECT count(*) FROM public.exercises e WHERE e.import_run_id IS NOT NULL) <> 0 THEN
    RAISE EXCEPTION 'exlib2z seal: delivery occurred inside the gated interval (tenant rows carry an import_run_id); rolling back everything — the attempted seal does not survive';
  END IF;
  IF (SELECT count(*)::text || ':' || md5(coalesce(string_agg(t::text,'|' ORDER BY t.id),'-')) FROM public.exercises t) <> v_cap.tenant_digest
     OR (SELECT count(*)::text || ':' || md5(coalesce(string_agg(t::text,'|' ORDER BY t.id),'-')) FROM public.exercise_aliases t) <> v_cap.tenant_alias_digest THEN
    RAISE EXCEPTION 'exlib2z seal: a tenant surface changed inside the gated interval; rolling back everything — the attempted seal does not survive';
  END IF;

  -- every unrelated surface byte-preserved (captured pre vs now)
  IF (SELECT md5(coalesce(string_agg(c::text,'|' ORDER BY c.logical_id, c.catalog_version),'-')) FROM public.exercise_catalog c) <> v_cap.snapshot_digest
     OR (SELECT md5(coalesce(string_agg(e::text,'|' ORDER BY e.catalog_id, e.created_at),'-')) FROM public.exercise_catalog_review_events e) <> v_cap.events_digest
     OR (SELECT md5(coalesce(string_agg(m::text,'|' ORDER BY m.catalog_id, m.muscle),'-')) FROM public.exercise_catalog_muscles m) <> v_cap.anatomy_digest
     OR (SELECT md5(coalesce(string_agg(a::text,'|' ORDER BY a.logical_id, a.alias),'-')) FROM public.exercise_catalog_aliases a) <> v_cap.alias_digest
     OR (SELECT md5(coalesce(string_agg(n::text,'|' ORDER BY n.normalized_name),'-')) FROM public.exercise_catalog_name_claims n) <> v_cap.claims_digest
     OR (SELECT md5(coalesce(string_agg(c::text,'|' ORDER BY c.id),'-')) FROM public.exercise_catalog_content c) <> v_cap.content_digest
     OR (SELECT md5(coalesce(string_agg(x::text,'|' ORDER BY x.relation, x.to_logical_id),'-')) FROM public.exercise_catalog_content_expected_relationships x) <> v_cap.expected_rel_digest
     OR (SELECT md5(coalesce(string_agg(r::text,'|' ORDER BY r.relation, r.to_logical_id),'-')) FROM public.exercise_catalog_relationships r) <> v_cap.projection_digest
     OR (SELECT md5(coalesce(string_agg(l::text,'|' ORDER BY l.id),'-')) FROM public.exercise_catalog_logical l) <> v_cap.logical_digest THEN
    RAISE EXCEPTION 'exlib2z seal: an unrelated catalog surface changed (snapshot/events/anatomy/alias/claims/content/expected/projection/logical); rolling back everything — the attempted seal does not survive';
  END IF;
  IF (SELECT md5(coalesce(string_agg(am::text, '|' ORDER BY am.roleid, am.member, am.grantor),'-'))
        FROM pg_catalog.pg_auth_members am
        JOIN pg_roles g ON g.oid = am.roleid
       WHERE g.rolname IN ('exlib_catalog_loader','exlib_catalog_reviewer','exlib_catalog_admission','exlib_catalog_admin')) IS DISTINCT FROM v_cap.authority_digest THEN
    RAISE EXCEPTION 'exlib2z seal: the catalog authority memberships changed inside the gated interval — whole rows compared: member, grantor, and every option column (this package changes NO authority); rolling back everything — the attempted seal does not survive';
  END IF;

  -- the claims invariant still holds
  IF (SELECT orphaned_claims::text||'/'||unclaimed_bearers::text FROM public.exlib_verify_catalog_claims()) <> '0/0' THEN
    RAISE EXCEPTION 'exlib2z seal: claims invariant broken after sealing; rolling back everything — the attempted seal does not survive';
  END IF;
END;
$post$;

-- surfaced result (display evidence; the committed row is the proof)
SELECT 'EXLIB-2Z SEALED' AS result,
       (SELECT count(*) FROM public.exercise_catalog_import_runs) AS runs,
       (SELECT count(*) FROM public.exercise_catalog_run_items) AS run_items,
       r.approved_for_delivery,
       r.sealed_at,
       (r.revoked_at IS NULL) AS unrevoked,
       (SELECT count(*) FROM public.exercise_catalog_import_runs x
         WHERE x.run_key = 'exlib2u-plank-release1-staged-v1'
           AND x.approved_for_delivery = true
           AND x.dry_run = false
           AND x.sealed_at IS NOT NULL
           AND x.revoked_at IS NULL) AS delivery_predicate_rows,
       (SELECT count(*) FROM public.exercises e WHERE e.import_run_id IS NOT NULL) AS delivered_tenant_rows
  FROM public.exercise_catalog_import_runs r
 WHERE r.run_key = 'exlib2u-plank-release1-staged-v1';

COMMIT;
