-- ============================================================
-- EXLIB-2Q — Plank IMPORT-ELIGIBILITY ADMISSION package.
--
--   PREPARED — NOT EXECUTED
--
-- The ONLY database this package may ever be executed against is
-- Supabase project "ShredOS", ref ttybyljytiwntvorugcv, and ONLY by
-- Joseph/ChatGPT over the established hosted-execution path — never
-- by Claude, and never by any automated pipeline. Local execution is
-- permitted ONLY inside disposable, socket-only PostgreSQL fixtures
-- that are destroyed afterward (the EXLIB-2Q live verifier).
--
-- WHAT THIS PACKAGE DOES (and everything it refuses to do):
--   - It performs EXACTLY ONE Plank import-eligibility admission:
--     public.admit_catalog_content over the APPROVED Plank content
--     row (logical e21b2c00-0000-4000-a000-000000000001, content
--     e21b2c00-0000-4000-a000-000000000101, version 1), recording the
--     promoted reviewed source artifact's SHA-256 as provenance. The
--     admission fingerprint is COMPUTED BY THE DATABASE from bound
--     state (exlib_content_admission_fingerprint); the caller cannot
--     supply it, the freeze trigger recomputes and rejects arbitrary
--     hashes, and this package verifies it RELATIONALLY afterward.
--   - It performs NO publication, NO relationship projection, NO
--     load, NO review, NO import run, NO run item, NO delivery, NO
--     seal, NO revocation, NO seed or inventory change, and NO tenant
--     change. publish_catalog_content and apply_content_review are
--     never invoked; those names appear in this package only in this
--     refusal sentence.
--   - REVIEW-EVENT SCOPING (unchanged from the accepted EXLIB-2P
--     derivation): the exercise_catalog_review_events log is
--     SNAPSHOT-scoped — its catalog_id references
--     exercise_catalog(id) — and trigger-internal (its guard accepts
--     rows only at pg_trigger_depth >= 2, from the snapshot
--     review-transition trigger). An admission writes ZERO rows there
--     BY SCHEMA DESIGN; the
--     admission's durable audit is the content row's own
--     import_admitted / admitted_fingerprint / admitted_source_sha256
--     / admitted_at surface, which migration 027 forces to be
--     complete exactly when admitted (all-or-nothing CHECK). This
--     package asserts the review-events count is unchanged at zero.
--
-- AUTHORITATIVE SOURCES (all promoted, all byte-frozen):
--   - Promoted source commit: main =
--     93202b4e89e92eef9a0f57d28c59900898cbc2ba (tree
--     814d94e41b6f0d1395b945c5a40e2da3b8c0d274; annotated tag
--     exlib2p-hosted-review-application-evidence-stable, tag object
--     ad5ff4b161405eb8ae1b0272459d6c1e9d188a15, annotation
--     "EXLIB-2P Plank hosted-review application evidence — REVIEWED —
--     NOT ADMITTED OR PUBLISHED").
--   - The admitted Plank authored artifact (payload, human-review
--     evidence, and THE SOURCE-PROVENANCE SHA this package records):
--     docs/exlib2g-plank-content.jsonl, 2,928 bytes, SHA-256
--     d82078490efa9ef13e128e7b7b742fbda8ea9e74e32382252d96c326c679d752.
--     Every payload literal below is re-derived mechanically from it,
--     and the p_source_artifact_sha256 argument IS this fingerprint.
--   - The hosted database review (created the approved state this
--     package requires): the SPENT EXLIB-2P package, 37,702 bytes,
--     SHA-256
--     76d1d67d6ec2bafc49ef43a6312700559cd9eeee4b8b9433868de9daf95dc666,
--     evidenced by the promoted EXLIB-2P application record (19,896
--     bytes, SHA-256
--     ca1e5116070cb563bafa58ff3c3bbbd90d7b1a4508d539e84963823b0b96c462):
--     content_status approved, reviewed_by Nick Tkacz, reviewed_at
--     the 2026-09-01T20:35:00-04:00 instant, review_rationale
--     "Everything looks correct", publication draft, admission absent.
--   - The completed human review form: 2,389 bytes, SHA-256
--     59ad2668790b6d0b135c8c453a702c45774f905ece8749a6112881b1df7e5b98.
--   - The SPENT EXLIB-2K load package (created the content row):
--     29,760 bytes, SHA-256
--     a1b6dd55850c5d544e2f484d1ce4833b41deec7f3dd4d4c2373cb3b50daaccf0.
--   - The SPENT EXLIB-2O load package (created both target
--     snapshots): 39,230 bytes, SHA-256
--     4c0d74f942da4e92efab5923a435512c750c6d794077804ffeee8c0c305c966d.
--   - Applied migration 027 (byte-frozen): SHA-256
--     90d53aaf8fd341dd99bab22b7d1ca280ec24b8ccee2a28efca6e835e0585a14f.
--   - The target-snapshot bindings (gate adjudicated SATISFIED in
--     EXLIB-2O; re-demanded here): Dead bug ...0002 mobility and
--     Ab wheel rollout ...0003 other, both active, catalog version 1,
--     pending review, never swapped. The hosted surrogate snapshot
--     UUIDs (1ce09c1f-c13d-4231-8e12-6f35cfd761b5 and
--     c715d840-944b-4019-b984-1687accffcf4) are DELIBERATELY NOT
--     preconditions — the accepted EXLIB-2O/2P fixture-portability
--     reasoning: they are loader-generated surrogates no lawful
--     disposable fixture can reproduce, so the gates below bind each
--     target by its FIXED logical UUID, exactly-one-snapshot
--     structure, canonical name, category, activity, version, and
--     review state — forward AND reverse.
--
-- ONE-USE / FAIL-CLOSED (honestly classified: this package is
-- ONE-USE, NOT idempotent): the pre-state gate demands the exact
-- post-EXLIB-2P hosted surface with the Plank content row APPROVED
-- and still UNADMITTED (import_admitted false, admission trio NULL),
-- and migration 027's admit_catalog_content itself refuses an
-- already-admitted version ("admission is one-time and one-way"). An
-- admission changes NO table count — the eleven-term vector is the
-- SAME before and after — so one-use is enforced by the unadmitted-
-- content gate, not the vector. A second execution refuses
-- fail-closed BEFORE any write or authority change. Any gate failure
-- anywhere rolls back the ENTIRE transaction.
--
-- HOSTED AUTHORITY POSTURE (the EXLIB-2K-proven implicit-creator
-- mechanism, identical for every migration-027 lifecycle role): the
-- invoker is the NON-SUPERUSER operator role postgres; migration 027
-- created exlib_catalog_admission NOLOGIN as postgres, so the role
-- carries EXACTLY ONE membership — the implicit creator membership
-- postgres granted BY the bootstrap superuser supabase_admin with
-- ADMIN TRUE, INHERIT FALSE, SET FALSE. The package elevates inside
-- the transaction (GRANT ... SET TRUE), proves the exact two-grantor
-- shape, performs the single admission call under SET ROLE, then
-- restores byte-for-byte with a grantor-scoped REVOKE and verifies
-- the restored baseline in its postconditions.
--
-- DATABASE-GENERATED VALUES (verified relationally, never pinned to
-- invented literals): admitted_fingerprint is computed by
-- public.exlib_content_admission_fingerprint from bound database
-- state — the postcondition requires it NON-NULL, 64-hex, and EQUAL
-- to a fresh recomputation inside this same transaction (the same
-- freshness equality publication will later demand); admitted_at is
-- set by the function to CURRENT_DATE, which is transaction-stable,
-- so the postcondition compares it to CURRENT_DATE exactly.
--
-- NAME RESOLUTION (the EXLIB-2O round-3 standard): the single
-- admission call is SCHEMA-QUALIFIED as public.admit_catalog_content,
-- so the function the precondition proves to exist is the function
-- actually invoked, independent of search_path. Every OTHER name in
-- this package is either public.-qualified or a pg_catalog system
-- view or built-in, and pg_catalog is searched ahead of every
-- search_path entry, so no schema placed on search_path can shadow
-- any of them. This package therefore pins no search_path and needs
-- none.
--
-- EXECUTION OUTPUT: the single SELECT echoes the function's JSONB
-- return {logical_id, admitted, content_version,
-- admitted_fingerprint, admitted_source_sha256}. That echo is
-- display-only evidence; every fact in it is independently enforced
-- by the row postconditions below, which are the binding proof.
-- ============================================================

BEGIN;

-- ── Fresh-state gate serialization: REAL table locks over the
--    ELEVEN gated tables (every table the pre/post vectors count,
--    review events included), taken before any read the gate depends
--    on, in ONE deterministic alphabetical statement. SHARE ROW
--    EXCLUSIVE conflicts with itself and with ordinary writers, so
--    two concurrent executions serialize here and no writer can
--    introduce lifecycle drift inside the package's gated interval;
--    the loser proceeds only after the winner commits and then
--    refuses at the pre-state gate (the content row is no longer
--    pending).
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

-- ── Preconditions (owner-role reads, BEFORE any authority change) ─
DO $pre$
DECLARE
  v_counts TEXT;
  v_orphaned BIGINT;
  v_unclaimed BIGINT;
BEGIN
  -- the narrowest migration-027 authority this package needs
  IF to_regprocedure('public.admit_catalog_content(uuid,uuid,text)') IS NULL THEN
    RAISE EXCEPTION 'exlib2q admission: migration-027 admit_catalog_content is missing; wrong or unmigrated database';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'exlib_catalog_admission') THEN
    RAISE EXCEPTION 'exlib2q admission: admission role missing';
  END IF;
  -- hosted operator identity, recognized before any write
  IF current_user <> 'postgres' OR session_user <> 'postgres' THEN
    RAISE EXCEPTION 'exlib2q admission: BOTH execution identities must be the hosted operator role postgres (got current_user=%, session_user=%); refusing before any write or authority change', current_user, session_user;
  END IF;
  IF (SELECT rolsuper FROM pg_roles WHERE rolname = current_user) THEN
    RAISE EXCEPTION 'exlib2q admission: the invoker is a superuser; this package is bound to the hosted non-superuser postgres posture';
  END IF;
  -- the exact admission-role authority baseline, grantor included
  IF (SELECT count(*) FROM pg_catalog.pg_auth_members am
        JOIN pg_roles r ON r.oid = am.roleid
       WHERE r.rolname = 'exlib_catalog_admission') <> 1
     OR NOT EXISTS (
       SELECT 1 FROM pg_catalog.pg_auth_members am
         JOIN pg_roles r ON r.oid = am.roleid
         JOIN pg_roles m ON m.oid = am.member
         JOIN pg_roles g ON g.oid = am.grantor
        WHERE r.rolname = 'exlib_catalog_admission' AND m.rolname = 'postgres'
          AND g.rolname = 'supabase_admin'
          AND am.admin_option AND NOT am.inherit_option AND NOT am.set_option) THEN
    RAISE EXCEPTION 'exlib2q admission: the admission-role membership posture is not the exact hosted baseline (exactly one membership: postgres granted BY supabase_admin with ADMIN TRUE, INHERIT FALSE, SET FALSE — grantor included); refusing before any write or authority change';
  END IF;
  -- EXACT expected pre-state: the surface the executed EXLIB-2P
  -- review left behind (identical in COUNT to the post-EXLIB-2O
  -- surface, because a content review changes no count), as the full
  -- eleven-table count vector —
  -- the same eleven tables this transaction locks. Any other
  -- surface — including the surface this package itself produces —
  -- refuses fail-closed BEFORE any write (one-use + foreign-state
  -- refusal in one gate).
  SELECT (SELECT count(*) FROM public.exercise_catalog_logical)::text
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
  IF v_counts <> '3/3/5/3/6/1/2/0/0/0/0' THEN
    RAISE EXCEPTION 'exlib2q admission: the catalog surface is not the exact post-EXLIB-2P hosted pre-state (expected 3/3/5/3/6/1/2/0/0/0/0, found %); this ONE-USE package refuses to run twice, over foreign state, or over an ambiguous surface', v_counts;
  END IF;
  -- the exact three identities, by UUID
  IF NOT EXISTS (SELECT 1 FROM public.exercise_catalog_logical WHERE id = 'e21b2c00-0000-4000-a000-000000000001')
     OR NOT EXISTS (SELECT 1 FROM public.exercise_catalog_logical WHERE id = 'e21b2c00-0000-4000-a000-000000000002')
     OR NOT EXISTS (SELECT 1 FROM public.exercise_catalog_logical WHERE id = 'e21b2c00-0000-4000-a000-000000000003') THEN
    RAISE EXCEPTION 'exlib2q admission: an expected logical identity is missing (...0001/...0002/...0003 must all exist); refusing';
  END IF;
  -- TARGET-SNAPSHOT GATES, forward: each target carries EXACTLY ONE
  -- snapshot with the adjudicated name, category, activity, version,
  -- and review state. These are the same bindings the SATISFIED gate
  -- adjudicated; the hosted surrogate snapshot UUIDs are evidence in
  -- the promoted record, not preconditions (see header).
  IF (SELECT count(*) FROM public.exercise_catalog e
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000002') <> 1
     OR NOT EXISTS (SELECT 1 FROM public.exercise_catalog e
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000002'
         AND e.canonical_name = 'Dead bug' AND e.category = 'mobility'
         AND e.review_status = 'pending' AND e.reviewed_by IS NULL
         AND e.catalog_version = 1 AND e.is_active) THEN
    RAISE EXCEPTION 'exlib2q admission: the Dead bug target snapshot is missing, inactive, re-versioned, reviewed, or re-bound (...0002 must carry exactly one active pending v1 snapshot named Dead bug, category mobility); refusing';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog e
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000003') <> 1
     OR NOT EXISTS (SELECT 1 FROM public.exercise_catalog e
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000003'
         AND e.canonical_name = 'Ab wheel rollout' AND e.category = 'other'
         AND e.review_status = 'pending' AND e.reviewed_by IS NULL
         AND e.catalog_version = 1 AND e.is_active) THEN
    RAISE EXCEPTION 'exlib2q admission: the Ab wheel rollout target snapshot is missing, inactive, re-versioned, reviewed, or re-bound (...0003 must carry exactly one active pending v1 snapshot named Ab wheel rollout, category other); refusing';
  END IF;
  -- TARGET-SNAPSHOT GATES, reverse (no-swap): each canonical name
  -- resolves to exactly its intended logical UUID and no other.
  IF (SELECT count(*) FROM public.exercise_catalog e WHERE e.canonical_name = 'Dead bug') <> 1
     OR (SELECT e.logical_id FROM public.exercise_catalog e WHERE e.canonical_name = 'Dead bug')
        <> 'e21b2c00-0000-4000-a000-000000000002'
     OR (SELECT count(*) FROM public.exercise_catalog e WHERE e.canonical_name = 'Ab wheel rollout') <> 1
     OR (SELECT e.logical_id FROM public.exercise_catalog e WHERE e.canonical_name = 'Ab wheel rollout')
        <> 'e21b2c00-0000-4000-a000-000000000003' THEN
    RAISE EXCEPTION 'exlib2q admission: reverse target binding failed (a canonical target name does not resolve to exactly its intended UUID — a swap or duplicate); refusing';
  END IF;
  -- THE COMPLETE AUTHORITATIVE PLANK PRE-STATE. Field-level, by
  -- EXACT VALUE EQUALITY to dollar-quoted authoritative literals
  -- re-derived mechanically from the promoted admitted Plank
  -- artifact docs/exlib2g-plank-content.jsonl (2,928 B, sha256
  -- d82078490efa9ef13e128e7b7b742fbda8ea9e74e32382252d96c326c679d752).
  -- NO hash of any kind appears in this gate (the admission INPUT
  -- sha in the call below is the artifact's recorded provenance, not
  -- a payload comparison). These are the SAME literals the
  -- Codex-approved EXLIB-2O and EXLIB-2P packages carried; the
  -- review evidence must be EXACTLY the applied human tuple and the
  -- lifecycle approved/draft/UNADMITTED — the admission surface is
  -- exactly what this package is authorized to change, and nothing
  -- else.
  IF (SELECT count(*) FROM public.exercise_catalog e
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000001') <> 1
     OR NOT EXISTS (SELECT 1 FROM public.exercise_catalog e
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000001'
         AND e.canonical_name = 'Plank' AND e.category = 'isolation'
         AND e.primary_muscle = 'abs' AND e.equipment = 'bodyweight'
         AND e.laterality = 'bilateral' AND e.tracking_mode = 'timed'
         AND e.provenance = 'forgefitos_original'
         AND e.movement_pattern = 'core_anti_extension'
         AND e.training_role = 'core' AND e.difficulty = 'beginner'
         AND e.availability = 'minimal'
         AND e.source_url IS NULL AND e.source_page IS NULL
         AND e.retrieved_at IS NULL AND e.import_confidence IS NULL
         AND e.review_status = 'pending' AND e.reviewed_by IS NULL
         AND e.reviewed_at IS NULL AND e.review_rationale IS NULL
         AND e.catalog_version = 1 AND e.is_active) THEN
    RAISE EXCEPTION 'exlib2q admission: the Plank snapshot is not the exact promoted EXLIB-2K state (a semantic field drifted); refusing before any write or authority change';
  END IF;
  IF (SELECT string_agg(m.muscle || ':' || m.role, ',' ORDER BY m.muscle)
        FROM public.exercise_catalog_muscles m
        JOIN public.exercise_catalog e ON e.id = m.catalog_id
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000001')
     IS DISTINCT FROM 'lower_back:tertiary,obliques:secondary' THEN
    RAISE EXCEPTION 'exlib2q admission: the Plank anatomy set drifted; refusing before any write or authority change';
  END IF;
  IF (SELECT string_agg(a.alias, ',' ORDER BY a.alias)
        FROM public.exercise_catalog_aliases a
       WHERE a.logical_id = 'e21b2c00-0000-4000-a000-000000000001')
     IS DISTINCT FROM 'Forearm plank,Front plank' THEN
    RAISE EXCEPTION 'exlib2q admission: the Plank alias set drifted; refusing before any write or authority change';
  END IF;
  IF (SELECT string_agg(c.normalized_name || '=' || c.claim_source, ',' ORDER BY c.normalized_name)
        FROM public.exercise_catalog_name_claims c
       WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000001')
     IS DISTINCT FROM 'forearm plank=alias,front plank=alias,plank=canonical' THEN
    RAISE EXCEPTION 'exlib2q admission: the Plank claim set drifted; refusing before any write or authority change';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_content c
       WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000001') <> 1
     OR NOT EXISTS (SELECT 1 FROM public.exercise_catalog_content c
       WHERE c.id = 'e21b2c00-0000-4000-a000-000000000101'
         AND c.logical_id = 'e21b2c00-0000-4000-a000-000000000001'
         AND c.content_version = 1
         AND c.authored_by = $p_ab$ForgeFitOS content program (AI-drafted original prose; pending human specialist review)$p_ab$
         AND c.authored_at = DATE '2026-09-01'
         AND c.setup_steps = $p_setu$["Lie face down, then prop yourself on your forearms with your elbows stacked directly under your shoulders.", "Extend your legs behind you with your feet about hip-width apart and your toes tucked under.", "Before lifting, brace your trunk gently as if preparing for a light press against your stomach."]$p_setu$::jsonb
         AND c.execution_steps = $p_exec$["Lift your hips so your body forms one straight line from the back of your head to your heels.", "Squeeze your glutes and keep your ribs drawn down so your lower back never sags toward the floor.", "Hold the position for the planned duration while keeping your neck long and your gaze at the floor.", "End the hold by lowering your knees to the floor under control, then rest fully before the next hold."]$p_exec$::jsonb
         AND c.common_mistakes = $p_mist$["Letting the hips sag so the lower back arches instead of staying in one straight line.", "Lifting the hips too high, which turns the hold into a rest position for the trunk.", "Grinding out extra seconds with a broken line instead of ending the hold when the position degrades."]$p_mist$::jsonb
         AND c.breathing_cue = $p_br$Breathe steadily for the whole hold with slow inhales and full exhales; never hold your breath to stiffen the position.$p_br$
         AND c.safety_guidance = $p_sf$A plank loads the trunk hardest once the hips drift, so keep the line strict rather than chasing longer times; if your lower back starts to ache or your hips sag and you cannot correct it, lower your knees and stop the hold there.$p_sf$
         AND c.equipment_setup = $p_es$$p_es$
         AND c.accessibility_alternative = $p_ac$Hold the position with your knees resting on the floor, or brace against a countertop at an incline for a gentler version.$p_ac$
         AND c.content_status = 'approved'
         AND c.reviewed_by = $p_rev$Nick Tkacz$p_rev$
         AND c.reviewed_at = TIMESTAMPTZ '2026-09-01T20:35:00-04:00'
         AND c.review_rationale = $p_rat$Everything looks correct$p_rat$
         AND c.publication_status = 'draft'
         AND c.import_admitted = false
         AND c.admitted_fingerprint IS NULL
         AND c.admitted_source_sha256 IS NULL
         AND c.admitted_at IS NULL) THEN
    RAISE EXCEPTION 'exlib2q admission: the Plank content row is not the exact reviewed pre-admission state (payload, authorship, the applied human review tuple, or the approved/draft/unadmitted lifecycle drifted); refusing before any write or authority change';
  END IF;
  IF (SELECT string_agg(x.relation || '>' || x.to_logical_id::text, ',' ORDER BY x.relation)
        FROM public.exercise_catalog_content_expected_relationships x)
     IS DISTINCT FROM 'progression>e21b2c00-0000-4000-a000-000000000003,substitution>e21b2c00-0000-4000-a000-000000000002' THEN
    RAISE EXCEPTION 'exlib2q admission: the Plank expected-relationship set drifted; refusing before any write or authority change';
  END IF;
  -- ZERO pre-existing review events, globally (the vector eleventh
  -- term above) AND explicitly for every Plank snapshot row — a
  -- prior event would mean foreign snapshot-review activity this
  -- package must never build on.
  IF (SELECT count(*) FROM public.exercise_catalog_review_events ev
        JOIN public.exercise_catalog e ON e.id = ev.catalog_id
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000001') <> 0 THEN
    RAISE EXCEPTION 'exlib2q admission: a Plank review event already exists; refusing';
  END IF;
  -- the catalog-claim invariant must already hold
  SELECT orphaned_claims, unclaimed_bearers
    INTO v_orphaned, v_unclaimed FROM public.exlib_verify_catalog_claims();
  IF v_orphaned <> 0 OR v_unclaimed <> 0 THEN
    RAISE EXCEPTION 'exlib2q admission: the catalog claims invariant is already violated (orphaned=%, unclaimed=%); refusing', v_orphaned, v_unclaimed;
  END IF;
  -- the admission surface stays locked away from ordinary clients
  IF has_function_privilege('anon', 'public.admit_catalog_content(uuid,uuid,text)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.admit_catalog_content(uuid,uuid,text)', 'EXECUTE')
     OR has_function_privilege('service_role', 'public.admit_catalog_content(uuid,uuid,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'exlib2q admission: the admission function is executable by an ordinary client role; refusing before any write or authority change';
  END IF;
  -- TRANSITION-NEUTRALITY EVIDENCE (not a pre-state authority: the
  -- authoritative pre-state is proven by the exact gates above):
  -- whole-row digests of every surface this package must NOT change
  -- — all three snapshot families, anatomy, aliases, claims,
  -- expected relationships, and the ENTIRE tenant exercises table —
  -- captured now and re-digested after the admission to prove
  -- EXLIB-2Q itself changes none of them. The CONTENT row is
  -- deliberately absent here: this package changes exactly its
  -- admission surface,
  -- and the postconditions bind that change (and the frozen payload)
  -- by exact value instead. These digests are md5, used ONLY to
  -- detect a change between two readings inside this one transaction
  -- — never as a binding to any source artifact.
  CREATE TEMP TABLE exlib2q_pre_evidence ON COMMIT DROP AS
  SELECT
    (SELECT md5(string_agg(e::text, '|' ORDER BY e.logical_id))
       FROM public.exercise_catalog e) AS snapshots_digest,
    (SELECT md5(coalesce(string_agg(m::text, '|' ORDER BY m.catalog_id, m.muscle), '<none>'))
       FROM public.exercise_catalog_muscles m) AS anatomy_digest,
    (SELECT md5(coalesce(string_agg(a::text, '|' ORDER BY a.logical_id, a.alias), '<none>'))
       FROM public.exercise_catalog_aliases a) AS alias_digest,
    (SELECT md5(coalesce(string_agg(c::text, '|' ORDER BY c.normalized_name), '<none>'))
       FROM public.exercise_catalog_name_claims c) AS claims_digest,
    (SELECT md5(coalesce(string_agg(x::text, '|' ORDER BY x.relation, x.to_logical_id), '<none>'))
       FROM public.exercise_catalog_content_expected_relationships x) AS expected_rel_digest,
    (SELECT count(*) FROM public.exercises) AS tenant_count,
    (SELECT md5(coalesce(string_agg(t::text, '|' ORDER BY t.id), '<none>'))
       FROM public.exercises t) AS tenant_digest;
END
$pre$;

-- ── Transaction-contained elevation (posture-gated above; revoked
--    below; postcondition-verified restored; rolls back with the
--    whole transaction on ANY failure) ─────────────────────────────
GRANT exlib_catalog_admission TO postgres WITH SET TRUE, INHERIT FALSE;

-- ── Structural two-grantor proof, BEFORE SET ROLE or the
--    admission call: exactly two membership rows — the untouched
--    supabase_admin-granted baseline plus the postgres-granted
--    temporary SET row ─────────────────────────────────────────────
DO $auth$
BEGIN
  IF (SELECT count(*) FROM pg_catalog.pg_auth_members am
        JOIN pg_roles r ON r.oid = am.roleid
       WHERE r.rolname = 'exlib_catalog_admission') <> 2
     OR NOT EXISTS (
       SELECT 1 FROM pg_catalog.pg_auth_members am
         JOIN pg_roles r ON r.oid = am.roleid
         JOIN pg_roles m ON m.oid = am.member
         JOIN pg_roles g ON g.oid = am.grantor
        WHERE r.rolname = 'exlib_catalog_admission' AND m.rolname = 'postgres'
          AND g.rolname = 'supabase_admin'
          AND am.admin_option AND NOT am.inherit_option AND NOT am.set_option)
     OR NOT EXISTS (
       SELECT 1 FROM pg_catalog.pg_auth_members am
         JOIN pg_roles r ON r.oid = am.roleid
         JOIN pg_roles m ON m.oid = am.member
         JOIN pg_roles g ON g.oid = am.grantor
        WHERE r.rolname = 'exlib_catalog_admission' AND m.rolname = 'postgres'
          AND g.rolname = 'postgres'
          AND NOT am.admin_option AND NOT am.inherit_option AND am.set_option) THEN
    RAISE EXCEPTION 'exlib2q admission: the two-grantor membership shape after the temporary grant is not exact (supabase_admin-granted baseline row plus postgres-granted SET row); aborting before SET ROLE and before the admission call';
  END IF;
END
$auth$;

-- ── The single Plank import-eligibility admission, under the
--    admission authority ONLY. The two UUIDs are the promoted loaded
--    identity; the third argument is the SHA-256 of the promoted
--    reviewed source artifact docs/exlib2g-plank-content.jsonl
--    (2,928 B), re-derived mechanically — the recorded provenance,
--    exactly as migration 027 prescribes ("the exact repository
--    source artifact SHA-256"). The admission fingerprint is NOT an
--    argument: the database computes it. The call is SCHEMA-QUALIFIED
--    (see NAME RESOLUTION above). ────────────────────────────────────
SET ROLE exlib_catalog_admission;

SELECT public.admit_catalog_content(
  'e21b2c00-0000-4000-a000-000000000001',
  'e21b2c00-0000-4000-a000-000000000101',
  $src$d82078490efa9ef13e128e7b7b742fbda8ea9e74e32382252d96c326c679d752$src$);

RESET ROLE;

-- ── Exact restoration: remove ONLY the temporary grant this package
--    created, identified by its grantor ────────────────────────────
REVOKE exlib_catalog_admission FROM postgres GRANTED BY postgres;

-- ── Postconditions (owner reads; ANY mismatch rolls back ALL) ─────
DO $post$
DECLARE
  v_counts TEXT;
  v_orphaned BIGINT;
  v_unclaimed BIGINT;
BEGIN
  -- authority restored byte-for-byte: exactly the baseline row,
  -- grantor included, and no standing SET capability
  IF (SELECT count(*) FROM pg_catalog.pg_auth_members am
        JOIN pg_roles r ON r.oid = am.roleid
       WHERE r.rolname = 'exlib_catalog_admission') <> 1
     OR NOT EXISTS (
       SELECT 1 FROM pg_catalog.pg_auth_members am
         JOIN pg_roles r ON r.oid = am.roleid
         JOIN pg_roles m ON m.oid = am.member
         JOIN pg_roles g ON g.oid = am.grantor
        WHERE r.rolname = 'exlib_catalog_admission' AND m.rolname = 'postgres'
          AND g.rolname = 'supabase_admin'
          AND am.admin_option AND NOT am.inherit_option AND NOT am.set_option)
     OR pg_has_role('postgres', 'exlib_catalog_admission', 'SET') THEN
    RAISE EXCEPTION 'exlib2q admission: authority restoration is not exact (baseline row plus zero standing SET capability required); rolling back everything';
  END IF;
  -- the ADMITTED content row: import_admitted true with the COMPLETE
  -- admission surface — the recorded source-artifact SHA pinned to
  -- the promoted artifact fingerprint, the database-computed
  -- admission fingerprint verified RELATIONALLY (non-null, 64-hex,
  -- and equal to a fresh recomputation inside this transaction — the
  -- freshness equality publication later demands), admitted_at equal
  -- to the transaction-stable CURRENT_DATE — and every frozen field
  -- re-asserted by exact value: payload, authorship, version, the
  -- applied human review tuple, and draft publication.
  IF (SELECT count(*) FROM public.exercise_catalog_content c
       WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000001') <> 1
     OR NOT EXISTS (SELECT 1 FROM public.exercise_catalog_content c
       WHERE c.id = 'e21b2c00-0000-4000-a000-000000000101'
         AND c.logical_id = 'e21b2c00-0000-4000-a000-000000000001'
         AND c.content_version = 1
         AND c.content_status = 'approved'
         AND c.reviewed_by = $q_rev$Nick Tkacz$q_rev$
         AND c.reviewed_at = TIMESTAMPTZ '2026-09-01T20:35:00-04:00'
         AND c.review_rationale = $q_rat$Everything looks correct$q_rat$
         AND c.import_admitted = true
         AND c.admitted_source_sha256 = $q_src$d82078490efa9ef13e128e7b7b742fbda8ea9e74e32382252d96c326c679d752$q_src$
         AND c.admitted_fingerprint IS NOT NULL
         AND c.admitted_fingerprint ~ '^[0-9a-f]{64}$'
         AND c.admitted_fingerprint = public.exlib_content_admission_fingerprint(c.id)
         AND c.admitted_at = CURRENT_DATE
         AND c.authored_by = $q_ab$ForgeFitOS content program (AI-drafted original prose; pending human specialist review)$q_ab$
         AND c.authored_at = DATE '2026-09-01'
         AND c.setup_steps = $q_setu$["Lie face down, then prop yourself on your forearms with your elbows stacked directly under your shoulders.", "Extend your legs behind you with your feet about hip-width apart and your toes tucked under.", "Before lifting, brace your trunk gently as if preparing for a light press against your stomach."]$q_setu$::jsonb
         AND c.execution_steps = $q_exec$["Lift your hips so your body forms one straight line from the back of your head to your heels.", "Squeeze your glutes and keep your ribs drawn down so your lower back never sags toward the floor.", "Hold the position for the planned duration while keeping your neck long and your gaze at the floor.", "End the hold by lowering your knees to the floor under control, then rest fully before the next hold."]$q_exec$::jsonb
         AND c.common_mistakes = $q_mist$["Letting the hips sag so the lower back arches instead of staying in one straight line.", "Lifting the hips too high, which turns the hold into a rest position for the trunk.", "Grinding out extra seconds with a broken line instead of ending the hold when the position degrades."]$q_mist$::jsonb
         AND c.breathing_cue = $q_br$Breathe steadily for the whole hold with slow inhales and full exhales; never hold your breath to stiffen the position.$q_br$
         AND c.safety_guidance = $q_sf$A plank loads the trunk hardest once the hips drift, so keep the line strict rather than chasing longer times; if your lower back starts to ache or your hips sag and you cannot correct it, lower your knees and stop the hold there.$q_sf$
         AND c.equipment_setup = $q_es$$q_es$
         AND c.accessibility_alternative = $q_ac$Hold the position with your knees resting on the floor, or brace against a countertop at an incline for a gentler version.$q_ac$
         AND c.publication_status = 'draft') THEN
    RAISE EXCEPTION 'exlib2q admission: the admitted content row is not exact (admission surface, audit tuple, frozen payload, or draft publication drifted); rolling back everything';
  END IF;
  -- the eleven-table vector is UNCHANGED: an admission updates one
  -- row in place and creates NOTHING — and the SNAPSHOT-scoped
  -- review-events log stays at zero BY SCHEMA DESIGN (see header):
  -- the admission audit lives on the content row, never in
  -- exercise_catalog_review_events.
  SELECT (SELECT count(*) FROM public.exercise_catalog_logical)::text
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
  IF v_counts <> '3/3/5/3/6/1/2/0/0/0/0' THEN
    RAISE EXCEPTION 'exlib2q admission: post-state counts changed (expected the unchanged 3/3/5/3/6/1/2/0/0/0/0, found %); an admission must create and delete nothing; rolling back everything', v_counts;
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_review_events) <> 0 THEN
    RAISE EXCEPTION 'exlib2q admission: a review event appeared; the snapshot-scoped log must stay empty under an admission; rolling back everything';
  END IF;
  -- every untouched surface is digest-identical (transition
  -- neutrality, disclaimed above) — snapshots, anatomy, aliases,
  -- claims, expected relationships, and the tenant table
  IF EXISTS (SELECT 1 FROM exlib2q_pre_evidence p
     WHERE p.snapshots_digest IS DISTINCT FROM
            (SELECT md5(string_agg(e::text, '|' ORDER BY e.logical_id))
               FROM public.exercise_catalog e)
       OR p.anatomy_digest IS DISTINCT FROM
            (SELECT md5(coalesce(string_agg(m::text, '|' ORDER BY m.catalog_id, m.muscle), '<none>'))
               FROM public.exercise_catalog_muscles m)
       OR p.alias_digest IS DISTINCT FROM
            (SELECT md5(coalesce(string_agg(a::text, '|' ORDER BY a.logical_id, a.alias), '<none>'))
               FROM public.exercise_catalog_aliases a)
       OR p.claims_digest IS DISTINCT FROM
            (SELECT md5(coalesce(string_agg(c::text, '|' ORDER BY c.normalized_name), '<none>'))
               FROM public.exercise_catalog_name_claims c)
       OR p.expected_rel_digest IS DISTINCT FROM
            (SELECT md5(coalesce(string_agg(x::text, '|' ORDER BY x.relation, x.to_logical_id), '<none>'))
               FROM public.exercise_catalog_content_expected_relationships x)
       OR p.tenant_count IS DISTINCT FROM (SELECT count(*) FROM public.exercises)
       OR p.tenant_digest IS DISTINCT FROM
            (SELECT md5(coalesce(string_agg(t::text, '|' ORDER BY t.id), '<none>'))
               FROM public.exercises t)) THEN
    RAISE EXCEPTION 'exlib2q admission: an untouched surface changed (snapshots, anatomy, aliases, claims, expected relationships, or tenant exercises); rolling back everything';
  END IF;
  -- the catalog-claim invariant must hold EXACTLY (0/0)
  SELECT orphaned_claims, unclaimed_bearers
    INTO v_orphaned, v_unclaimed FROM public.exlib_verify_catalog_claims();
  IF v_orphaned <> 0 OR v_unclaimed <> 0 THEN
    RAISE EXCEPTION 'exlib2q admission: the catalog claims invariant does not hold after the admission (orphaned=%, unclaimed=%); rolling back everything', v_orphaned, v_unclaimed;
  END IF;
  -- the admission surface stays locked away from ordinary clients
  IF has_function_privilege('anon', 'public.admit_catalog_content(uuid,uuid,text)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.admit_catalog_content(uuid,uuid,text)', 'EXECUTE')
     OR has_function_privilege('service_role', 'public.admit_catalog_content(uuid,uuid,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'exlib2q admission: the admission function is executable by an ordinary client role; rolling back everything';
  END IF;
END
$post$;

COMMIT;

-- ============================================================
-- AFTER COMMIT (evidence to capture, for the eventual authorized
-- hosted execution ONLY): the exact UTC start/finish timestamps, the
-- SELECT's JSONB echo {"logical_id": "...0001", "admitted":
-- "...0101", "content_version": 1, "admitted_fingerprint": "<the
-- database-computed 64-hex value>", "admitted_source_sha256":
-- "d8207849..."}, and the post-state read-backs. PUBLICATION,
-- RELATIONSHIP PROJECTION, AND DELIVERY REMAIN SEPARATELY BLOCKED:
-- admitting the content does NOT publish it (publication_status
-- stays draft, zero projected relationships) and activates nothing.
-- Each later act has its own authority role, its own reviewed
-- package, and its own explicit instruction.
-- ============================================================
