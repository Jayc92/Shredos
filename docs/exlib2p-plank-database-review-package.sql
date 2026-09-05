-- ============================================================
-- EXLIB-2P — Plank DATABASE CONTENT-REVIEW package.
--
--   PREPARED — NOT EXECUTED
--
-- The ONLY database this package may ever be executed against is
-- Supabase project "ShredOS", ref ttybyljytiwntvorugcv, and ONLY by
-- Joseph/ChatGPT over the established hosted-execution path — never
-- by Claude, and never by any automated pipeline. Local execution is
-- permitted ONLY inside disposable, socket-only PostgreSQL fixtures
-- that are destroyed afterward (the EXLIB-2P live verifier).
--
-- WHAT THIS PACKAGE DOES (and everything it refuses to do):
--   - It performs EXACTLY ONE Plank database content-review action:
--     public.apply_content_review over the loaded Plank content row
--     (logical e21b2c00-0000-4000-a000-000000000001, content
--     e21b2c00-0000-4000-a000-000000000101, version 1), carrying the
--     HUMAN decision recorded in EXLIB-2I verbatim: approved, by
--     Nick Tkacz, at 2026-09-01T20:35:00-04:00, rationale
--     "Everything looks correct". The reviewer's operator-validated
--     credential (Personal Trainer) lives in the completed form and
--     the records; migration 027's content-review surface carries no
--     role field, exactly as the EXLIB-2I derived contract states.
--   - It performs NO eligibility admission, NO publication, NO
--     relationship projection, NO load, NO import run, NO run item,
--     NO delivery, NO seal, NO revocation, NO seed or inventory
--     change, and NO tenant change. admit_catalog_content and
--     publish_catalog_content are never invoked; the words appear in
--     this package only in this refusal sentence.
--   - REVIEW-EVENT SCOPING (derived from migrations 023/027, stated
--     so the evidence expectations cannot be misread): the
--     exercise_catalog_review_events log is SNAPSHOT-scoped — its
--     catalog_id references exercise_catalog(id) and its guard
--     trigger accepts rows ONLY from inside the snapshot
--     review-transition trigger (pg_trigger_depth >= 2). A CONTENT
--     review through apply_content_review therefore writes ZERO rows
--     there BY SCHEMA DESIGN; its complete audit evidence is the
--     content row's own reviewed_by / reviewed_at /
--     review_rationale tuple under the one-way content_status
--     machine (corrections require a NEW content version). This
--     package asserts the review-events count is unchanged at zero
--     and that the content row carries the exact tuple.
--
-- AUTHORITATIVE SOURCES (all promoted, all byte-frozen):
--   - Promoted source commit: main =
--     442b6247ad2f4b95ce58a1c2ed72df2ca84aff63 (tree
--     aee2a0c72c2fdcd8b9aa8f505c71cbf235e42252; annotated tag
--     exlib2o-hosted-load-application-evidence-stable, tag object
--     d244aa4a27efd34fec489fc0087c34c03d2e561d, annotation
--     "EXLIB-2O target-snapshot hosted-load application evidence —
--     LOADED — TARGET GATE SATISFIED").
--   - The admitted Plank authored artifact (payload + human review
--     evidence + import eligibility): docs/exlib2g-plank-content.jsonl,
--     2,928 bytes, SHA-256
--     d82078490efa9ef13e128e7b7b742fbda8ea9e74e32382252d96c326c679d752.
--     Every payload literal below is re-derived mechanically from it.
--   - The completed human review form (permanent evidence):
--     docs/exlib2h-plank-content-review-form-completed.json, 2,389
--     bytes, SHA-256
--     59ad2668790b6d0b135c8c453a702c45774f905ece8749a6112881b1df7e5b98.
--   - The loaded hosted content identity: content UUID ...0101,
--     logical UUID ...0001, content_version 1 — created by the SPENT
--     EXLIB-2K package (29,760 B, SHA-256
--     a1b6dd55850c5d544e2f484d1ce4833b41deec7f3dd4d4c2373cb3b50daaccf0)
--     and evidenced by the promoted EXLIB-2K application record.
--   - The target-snapshot evidence (gate adjudicated SATISFIED):
--     the promoted EXLIB-2O application record (15,938 B / SHA-256
--     e45939733abda83932173c492a6436aca5e188bd2644f34f87f3a03175edea09)
--     records Dead bug ...0002 (category mobility, hosted snapshot
--     UUID 1ce09c1f-c13d-4231-8e12-6f35cfd761b5) and Ab wheel rollout
--     ...0003 (category other, hosted snapshot UUID
--     c715d840-944b-4019-b984-1687accffcf4), both active, catalog
--     version 1, pending review, never swapped. The two hosted
--     snapshot UUIDs are DELIBERATELY NOT preconditions: they are
--     loader-generated surrogate ids that no lawful fixture can
--     reproduce, so the gates below bind each target by its FIXED
--     logical UUID, exactly-one-snapshot structure, canonical name,
--     category, activity, version, and review state — forward AND
--     reverse — which is the identity the adjudicated gate demanded.
--   - The SPENT EXLIB-2O load package (created both target
--     snapshots): 39,230 bytes, SHA-256
--     4c0d74f942da4e92efab5923a435512c750c6d794077804ffeee8c0c305c966d.
--   - Applied migration 027 (byte-frozen): SHA-256
--     90d53aaf8fd341dd99bab22b7d1ca280ec24b8ccee2a28efca6e835e0585a14f.
--
-- ONE-USE / FAIL-CLOSED (honestly classified: this package is
-- ONE-USE, NOT idempotent): the pre-state gate demands the exact
-- post-EXLIB-2O hosted surface with the Plank content row still
-- pending and its reviewer fields NULL, and migration 027's
-- apply_content_review itself refuses any non-pending version
-- ("the decision is one-time and corrections require a new content
-- version"). A second execution therefore refuses fail-closed at the
-- pre-state gate BEFORE any write or authority change; it does not
-- silently succeed, so no idempotency is claimed. Any gate failure
-- anywhere rolls back the ENTIRE transaction.
--
-- HOSTED AUTHORITY POSTURE (proven during EXLIB-2K and re-derived
-- for the reviewer role from the same mechanism): the invoker is the
-- NON-SUPERUSER operator role postgres; migration 027 created
-- exlib_catalog_reviewer NOLOGIN as postgres, so the role carries
-- EXACTLY ONE membership — the implicit creator membership postgres
-- granted BY the bootstrap superuser supabase_admin with ADMIN TRUE,
-- INHERIT FALSE, SET FALSE. The package elevates inside the
-- transaction (GRANT ... SET TRUE), proves the exact two-grantor
-- shape, performs the single review call under SET ROLE, then
-- restores byte-for-byte with a grantor-scoped REVOKE and verifies
-- the restored baseline in its postconditions.
--
-- NAME RESOLUTION (the EXLIB-2O round-3 standard, applied from the
-- start): the single review call is SCHEMA-QUALIFIED as
-- public.apply_content_review, so the function the precondition
-- proves to exist is the function actually invoked, independent of
-- search_path. Every OTHER name in this package is either
-- public.-qualified or a pg_catalog system view or built-in, and
-- pg_catalog is searched ahead of every search_path entry, so no
-- schema placed on search_path can shadow any of them. This package
-- therefore pins no search_path and needs none. The checked object
-- and the invoked object are the same database object by
-- construction.
--
-- EXECUTION OUTPUT: the single SELECT echoes the function's JSONB
-- return {logical_id, content_id, decision}. That echo is
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
  IF to_regprocedure('public.apply_content_review(uuid,uuid,text,text,timestamptz,text)') IS NULL THEN
    RAISE EXCEPTION 'exlib2p review: migration-027 apply_content_review is missing; wrong or unmigrated database';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'exlib_catalog_reviewer') THEN
    RAISE EXCEPTION 'exlib2p review: reviewer role missing';
  END IF;
  -- hosted operator identity, recognized before any write
  IF current_user <> 'postgres' OR session_user <> 'postgres' THEN
    RAISE EXCEPTION 'exlib2p review: BOTH execution identities must be the hosted operator role postgres (got current_user=%, session_user=%); refusing before any write or authority change', current_user, session_user;
  END IF;
  IF (SELECT rolsuper FROM pg_roles WHERE rolname = current_user) THEN
    RAISE EXCEPTION 'exlib2p review: the invoker is a superuser; this package is bound to the hosted non-superuser postgres posture';
  END IF;
  -- the exact reviewer-role authority baseline, grantor included
  IF (SELECT count(*) FROM pg_catalog.pg_auth_members am
        JOIN pg_roles r ON r.oid = am.roleid
       WHERE r.rolname = 'exlib_catalog_reviewer') <> 1
     OR NOT EXISTS (
       SELECT 1 FROM pg_catalog.pg_auth_members am
         JOIN pg_roles r ON r.oid = am.roleid
         JOIN pg_roles m ON m.oid = am.member
         JOIN pg_roles g ON g.oid = am.grantor
        WHERE r.rolname = 'exlib_catalog_reviewer' AND m.rolname = 'postgres'
          AND g.rolname = 'supabase_admin'
          AND am.admin_option AND NOT am.inherit_option AND NOT am.set_option) THEN
    RAISE EXCEPTION 'exlib2p review: the reviewer-role membership posture is not the exact hosted baseline (exactly one membership: postgres granted BY supabase_admin with ADMIN TRUE, INHERIT FALSE, SET FALSE — grantor included); refusing before any write or authority change';
  END IF;
  -- EXACT expected pre-state: the surface the executed EXLIB-2O
  -- package left behind, as the full eleven-table count vector —
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
    RAISE EXCEPTION 'exlib2p review: the catalog surface is not the exact post-EXLIB-2O hosted pre-state (expected 3/3/5/3/6/1/2/0/0/0/0, found %); this ONE-USE package refuses to run twice, over foreign state, or over an ambiguous surface', v_counts;
  END IF;
  -- the exact three identities, by UUID
  IF NOT EXISTS (SELECT 1 FROM public.exercise_catalog_logical WHERE id = 'e21b2c00-0000-4000-a000-000000000001')
     OR NOT EXISTS (SELECT 1 FROM public.exercise_catalog_logical WHERE id = 'e21b2c00-0000-4000-a000-000000000002')
     OR NOT EXISTS (SELECT 1 FROM public.exercise_catalog_logical WHERE id = 'e21b2c00-0000-4000-a000-000000000003') THEN
    RAISE EXCEPTION 'exlib2p review: an expected logical identity is missing (...0001/...0002/...0003 must all exist); refusing';
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
    RAISE EXCEPTION 'exlib2p review: the Dead bug target snapshot is missing, inactive, re-versioned, reviewed, or re-bound (...0002 must carry exactly one active pending v1 snapshot named Dead bug, category mobility); refusing';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog e
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000003') <> 1
     OR NOT EXISTS (SELECT 1 FROM public.exercise_catalog e
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000003'
         AND e.canonical_name = 'Ab wheel rollout' AND e.category = 'other'
         AND e.review_status = 'pending' AND e.reviewed_by IS NULL
         AND e.catalog_version = 1 AND e.is_active) THEN
    RAISE EXCEPTION 'exlib2p review: the Ab wheel rollout target snapshot is missing, inactive, re-versioned, reviewed, or re-bound (...0003 must carry exactly one active pending v1 snapshot named Ab wheel rollout, category other); refusing';
  END IF;
  -- TARGET-SNAPSHOT GATES, reverse (no-swap): each canonical name
  -- resolves to exactly its intended logical UUID and no other.
  IF (SELECT count(*) FROM public.exercise_catalog e WHERE e.canonical_name = 'Dead bug') <> 1
     OR (SELECT e.logical_id FROM public.exercise_catalog e WHERE e.canonical_name = 'Dead bug')
        <> 'e21b2c00-0000-4000-a000-000000000002'
     OR (SELECT count(*) FROM public.exercise_catalog e WHERE e.canonical_name = 'Ab wheel rollout') <> 1
     OR (SELECT e.logical_id FROM public.exercise_catalog e WHERE e.canonical_name = 'Ab wheel rollout')
        <> 'e21b2c00-0000-4000-a000-000000000003' THEN
    RAISE EXCEPTION 'exlib2p review: reverse target binding failed (a canonical target name does not resolve to exactly its intended UUID — a swap or duplicate); refusing';
  END IF;
  -- THE COMPLETE AUTHORITATIVE PLANK PRE-STATE. Field-level, by
  -- EXACT VALUE EQUALITY to dollar-quoted authoritative literals
  -- re-derived mechanically from the promoted admitted Plank
  -- artifact docs/exlib2g-plank-content.jsonl (2,928 B, sha256
  -- d82078490efa9ef13e128e7b7b742fbda8ea9e74e32382252d96c326c679d752).
  -- NO hash of any kind appears in this gate. These are the SAME
  -- literals the Codex-approved EXLIB-2O package carried; the
  -- review evidence must still be NULL and the lifecycle still
  -- pending/draft/unadmitted — that is exactly what this package is
  -- authorized to change (the review evidence and content_status),
  -- and nothing else.
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
    RAISE EXCEPTION 'exlib2p review: the Plank snapshot is not the exact promoted EXLIB-2K state (a semantic field drifted); refusing before any write or authority change';
  END IF;
  IF (SELECT string_agg(m.muscle || ':' || m.role, ',' ORDER BY m.muscle)
        FROM public.exercise_catalog_muscles m
        JOIN public.exercise_catalog e ON e.id = m.catalog_id
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000001')
     IS DISTINCT FROM 'lower_back:tertiary,obliques:secondary' THEN
    RAISE EXCEPTION 'exlib2p review: the Plank anatomy set drifted; refusing before any write or authority change';
  END IF;
  IF (SELECT string_agg(a.alias, ',' ORDER BY a.alias)
        FROM public.exercise_catalog_aliases a
       WHERE a.logical_id = 'e21b2c00-0000-4000-a000-000000000001')
     IS DISTINCT FROM 'Forearm plank,Front plank' THEN
    RAISE EXCEPTION 'exlib2p review: the Plank alias set drifted; refusing before any write or authority change';
  END IF;
  IF (SELECT string_agg(c.normalized_name || '=' || c.claim_source, ',' ORDER BY c.normalized_name)
        FROM public.exercise_catalog_name_claims c
       WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000001')
     IS DISTINCT FROM 'forearm plank=alias,front plank=alias,plank=canonical' THEN
    RAISE EXCEPTION 'exlib2p review: the Plank claim set drifted; refusing before any write or authority change';
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
         AND c.content_status = 'pending'
         AND c.publication_status = 'draft'
         AND c.import_admitted = false
         AND c.reviewed_by IS NULL AND c.reviewed_at IS NULL
         AND c.review_rationale IS NULL
         AND c.admitted_fingerprint IS NULL
         AND c.admitted_source_sha256 IS NULL
         AND c.admitted_at IS NULL) THEN
    RAISE EXCEPTION 'exlib2p review: the Plank content row is not the exact loaded pre-review state (payload, authorship, review evidence, or draft/unadmitted/unpublished lifecycle drifted); refusing before any write or authority change';
  END IF;
  IF (SELECT string_agg(x.relation || '>' || x.to_logical_id::text, ',' ORDER BY x.relation)
        FROM public.exercise_catalog_content_expected_relationships x)
     IS DISTINCT FROM 'progression>e21b2c00-0000-4000-a000-000000000003,substitution>e21b2c00-0000-4000-a000-000000000002' THEN
    RAISE EXCEPTION 'exlib2p review: the Plank expected-relationship set drifted; refusing before any write or authority change';
  END IF;
  -- ZERO pre-existing review events, globally (the vector eleventh
  -- term above) AND explicitly for every Plank snapshot row — a
  -- prior event would mean foreign snapshot-review activity this
  -- package must never build on.
  IF (SELECT count(*) FROM public.exercise_catalog_review_events ev
        JOIN public.exercise_catalog e ON e.id = ev.catalog_id
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000001') <> 0 THEN
    RAISE EXCEPTION 'exlib2p review: a Plank review event already exists; refusing';
  END IF;
  -- the catalog-claim invariant must already hold
  SELECT orphaned_claims, unclaimed_bearers
    INTO v_orphaned, v_unclaimed FROM public.exlib_verify_catalog_claims();
  IF v_orphaned <> 0 OR v_unclaimed <> 0 THEN
    RAISE EXCEPTION 'exlib2p review: the catalog claims invariant is already violated (orphaned=%, unclaimed=%); refusing', v_orphaned, v_unclaimed;
  END IF;
  -- the review surface stays locked away from ordinary clients
  IF has_function_privilege('anon', 'public.apply_content_review(uuid,uuid,text,text,timestamptz,text)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.apply_content_review(uuid,uuid,text,text,timestamptz,text)', 'EXECUTE')
     OR has_function_privilege('service_role', 'public.apply_content_review(uuid,uuid,text,text,timestamptz,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'exlib2p review: the review function is executable by an ordinary client role; refusing before any write or authority change';
  END IF;
  -- TRANSITION-NEUTRALITY EVIDENCE (not a pre-state authority: the
  -- authoritative pre-state is proven by the exact gates above):
  -- whole-row digests of every surface this package must NOT change
  -- — all three snapshot families, anatomy, aliases, claims,
  -- expected relationships, and the ENTIRE tenant exercises table —
  -- captured now and re-digested after the review to prove EXLIB-2P
  -- itself changes none of them. The CONTENT row is deliberately
  -- absent here: this package changes exactly its review surface,
  -- and the postconditions bind that change (and the frozen payload)
  -- by exact value instead. These digests are md5, used ONLY to
  -- detect a change between two readings inside this one transaction
  -- — never as a binding to any source artifact.
  CREATE TEMP TABLE exlib2p_pre_evidence ON COMMIT DROP AS
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
GRANT exlib_catalog_reviewer TO postgres WITH SET TRUE, INHERIT FALSE;

-- ── Structural two-grantor proof, BEFORE SET ROLE or the review
--    call: exactly two membership rows — the untouched
--    supabase_admin-granted baseline plus the postgres-granted
--    temporary SET row ─────────────────────────────────────────────
DO $auth$
BEGIN
  IF (SELECT count(*) FROM pg_catalog.pg_auth_members am
        JOIN pg_roles r ON r.oid = am.roleid
       WHERE r.rolname = 'exlib_catalog_reviewer') <> 2
     OR NOT EXISTS (
       SELECT 1 FROM pg_catalog.pg_auth_members am
         JOIN pg_roles r ON r.oid = am.roleid
         JOIN pg_roles m ON m.oid = am.member
         JOIN pg_roles g ON g.oid = am.grantor
        WHERE r.rolname = 'exlib_catalog_reviewer' AND m.rolname = 'postgres'
          AND g.rolname = 'supabase_admin'
          AND am.admin_option AND NOT am.inherit_option AND NOT am.set_option)
     OR NOT EXISTS (
       SELECT 1 FROM pg_catalog.pg_auth_members am
         JOIN pg_roles r ON r.oid = am.roleid
         JOIN pg_roles m ON m.oid = am.member
         JOIN pg_roles g ON g.oid = am.grantor
        WHERE r.rolname = 'exlib_catalog_reviewer' AND m.rolname = 'postgres'
          AND g.rolname = 'postgres'
          AND NOT am.admin_option AND NOT am.inherit_option AND am.set_option) THEN
    RAISE EXCEPTION 'exlib2p review: the two-grantor membership shape after the temporary grant is not exact (supabase_admin-granted baseline row plus postgres-granted SET row); aborting before SET ROLE and before the review call';
  END IF;
END
$auth$;

-- ── The single Plank database content-review, under the reviewer
--    authority ONLY. Every argument is VERBATIM from the EXLIB-2I
--    human decision (completed form 59ad2668..., artifact
--    content_review object): the decision, the named human reviewer,
--    the exact offset timestamp (a timestamptz instant), and the
--    exact rationale. The call is SCHEMA-QUALIFIED (see NAME
--    RESOLUTION above). ─────────────────────────────────────────────
SET ROLE exlib_catalog_reviewer;

SELECT public.apply_content_review(
  'e21b2c00-0000-4000-a000-000000000001',
  'e21b2c00-0000-4000-a000-000000000101',
  $dec$approved$dec$,
  $rev$Nick Tkacz$rev$,
  TIMESTAMPTZ '2026-09-01T20:35:00-04:00',
  $rat$Everything looks correct$rat$);

RESET ROLE;

-- ── Exact restoration: remove ONLY the temporary grant this package
--    created, identified by its grantor ────────────────────────────
REVOKE exlib_catalog_reviewer FROM postgres GRANTED BY postgres;

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
       WHERE r.rolname = 'exlib_catalog_reviewer') <> 1
     OR NOT EXISTS (
       SELECT 1 FROM pg_catalog.pg_auth_members am
         JOIN pg_roles r ON r.oid = am.roleid
         JOIN pg_roles m ON m.oid = am.member
         JOIN pg_roles g ON g.oid = am.grantor
        WHERE r.rolname = 'exlib_catalog_reviewer' AND m.rolname = 'postgres'
          AND g.rolname = 'supabase_admin'
          AND am.admin_option AND NOT am.inherit_option AND NOT am.set_option)
     OR pg_has_role('postgres', 'exlib_catalog_reviewer', 'SET') THEN
    RAISE EXCEPTION 'exlib2p review: authority restoration is not exact (baseline row plus zero standing SET capability required); rolling back everything';
  END IF;
  -- the REVIEWED content row: content_status approved, the EXACT
  -- human audit tuple, and every frozen field re-asserted by exact
  -- value — payload, authorship, version, draft publication, and the
  -- completely absent admission surface. reviewed_at is compared as
  -- the exact timestamptz INSTANT the human decision names.
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
         AND c.authored_by = $q_ab$ForgeFitOS content program (AI-drafted original prose; pending human specialist review)$q_ab$
         AND c.authored_at = DATE '2026-09-01'
         AND c.setup_steps = $q_setu$["Lie face down, then prop yourself on your forearms with your elbows stacked directly under your shoulders.", "Extend your legs behind you with your feet about hip-width apart and your toes tucked under.", "Before lifting, brace your trunk gently as if preparing for a light press against your stomach."]$q_setu$::jsonb
         AND c.execution_steps = $q_exec$["Lift your hips so your body forms one straight line from the back of your head to your heels.", "Squeeze your glutes and keep your ribs drawn down so your lower back never sags toward the floor.", "Hold the position for the planned duration while keeping your neck long and your gaze at the floor.", "End the hold by lowering your knees to the floor under control, then rest fully before the next hold."]$q_exec$::jsonb
         AND c.common_mistakes = $q_mist$["Letting the hips sag so the lower back arches instead of staying in one straight line.", "Lifting the hips too high, which turns the hold into a rest position for the trunk.", "Grinding out extra seconds with a broken line instead of ending the hold when the position degrades."]$q_mist$::jsonb
         AND c.breathing_cue = $q_br$Breathe steadily for the whole hold with slow inhales and full exhales; never hold your breath to stiffen the position.$q_br$
         AND c.safety_guidance = $q_sf$A plank loads the trunk hardest once the hips drift, so keep the line strict rather than chasing longer times; if your lower back starts to ache or your hips sag and you cannot correct it, lower your knees and stop the hold there.$q_sf$
         AND c.equipment_setup = $q_es$$q_es$
         AND c.accessibility_alternative = $q_ac$Hold the position with your knees resting on the floor, or brace against a countertop at an incline for a gentler version.$q_ac$
         AND c.publication_status = 'draft'
         AND c.import_admitted = false
         AND c.admitted_fingerprint IS NULL
         AND c.admitted_source_sha256 IS NULL
         AND c.admitted_at IS NULL) THEN
    RAISE EXCEPTION 'exlib2p review: the reviewed content row is not exact (decision, audit tuple, frozen payload, draft publication, or absent admission drifted); rolling back everything';
  END IF;
  -- the eleven-table vector is UNCHANGED: a content review updates
  -- one row in place and creates NOTHING — and the SNAPSHOT-scoped
  -- review-events log stays at zero BY SCHEMA DESIGN (see header):
  -- content review evidence lives on the content row, never in
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
    RAISE EXCEPTION 'exlib2p review: post-state counts changed (expected the unchanged 3/3/5/3/6/1/2/0/0/0/0, found %); a content review must create and delete nothing; rolling back everything', v_counts;
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_review_events) <> 0 THEN
    RAISE EXCEPTION 'exlib2p review: a review event appeared; the snapshot-scoped log must stay empty under a content review; rolling back everything';
  END IF;
  -- every untouched surface is digest-identical (transition
  -- neutrality, disclaimed above) — snapshots, anatomy, aliases,
  -- claims, expected relationships, and the tenant table
  IF EXISTS (SELECT 1 FROM exlib2p_pre_evidence p
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
    RAISE EXCEPTION 'exlib2p review: an untouched surface changed (snapshots, anatomy, aliases, claims, expected relationships, or tenant exercises); rolling back everything';
  END IF;
  -- the catalog-claim invariant must hold EXACTLY (0/0)
  SELECT orphaned_claims, unclaimed_bearers
    INTO v_orphaned, v_unclaimed FROM public.exlib_verify_catalog_claims();
  IF v_orphaned <> 0 OR v_unclaimed <> 0 THEN
    RAISE EXCEPTION 'exlib2p review: the catalog claims invariant does not hold after the review (orphaned=%, unclaimed=%); rolling back everything', v_orphaned, v_unclaimed;
  END IF;
  -- the review surface stays locked away from ordinary clients
  IF has_function_privilege('anon', 'public.apply_content_review(uuid,uuid,text,text,timestamptz,text)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.apply_content_review(uuid,uuid,text,text,timestamptz,text)', 'EXECUTE')
     OR has_function_privilege('service_role', 'public.apply_content_review(uuid,uuid,text,text,timestamptz,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'exlib2p review: the review function is executable by an ordinary client role; rolling back everything';
  END IF;
END
$post$;

COMMIT;

-- ============================================================
-- AFTER COMMIT (evidence to capture, for the eventual authorized
-- hosted execution ONLY): the exact UTC start/finish timestamps, the
-- SELECT's JSONB echo {"logical_id": "...0001", "content_id":
-- "...0101", "decision": "approved"}, and the post-state read-backs.
-- ADMISSION AND PUBLICATION REMAIN SEPARATELY BLOCKED: approving the
-- content does NOT admit it (import_admitted stays false with every
-- admission field NULL) and does NOT publish it (publication_status
-- stays draft). Each later act has its own authority role, its own
-- reviewed package, and its own explicit instruction.
-- ============================================================
