-- ============================================================
-- EXLIB-2R — Plank PUBLICATION package.
--
--   PREPARED — NOT EXECUTED
--
-- The ONLY database this package may ever be executed against is
-- Supabase project "ShredOS", ref ttybyljytiwntvorugcv, and ONLY by
-- Joseph/ChatGPT over the established hosted-execution path — never
-- by Claude, and never by any automated pipeline. Local execution is
-- permitted ONLY inside disposable, socket-only PostgreSQL fixtures
-- that are destroyed afterward (the EXLIB-2R live verifier).
--
-- WHAT THIS PACKAGE DOES (and everything it refuses to do):
--   - It performs EXACTLY ONE Plank publication:
--     public.publish_catalog_content over the APPROVED AND ADMITTED
--     Plank content row (logical e21b2c00-0000-4000-a000-000000000001,
--     content e21b2c00-0000-4000-a000-000000000101, version 1). The
--     publication transition and the RELATIONSHIP PROJECTION are ONE
--     ATOMIC ACT by schema design: migration 027's function swaps the
--     protected projection to exactly the version's expected set
--     under a transaction-local sentinel, and the content freeze
--     trigger STRUCTURALLY re-verifies projected-set equality and
--     admission-manifest freshness at the draft -> published
--     transition, for every caller. Publishing Plank projects exactly
--     TWO relationship rows (progression -> ...0003, substitution ->
--     ...0002) — the only count change this package makes.
--   - It performs NO load, NO review, NO admission, NO import run,
--     NO run item, NO retirement of any published version (none
--     exists — see the pre-state gate), NO delivery activation, NO
--     seal, NO revocation, NO seed or inventory change, and NO tenant
--     change. admit_catalog_content and apply_content_review are
--     never invoked; those names appear in this package only in this
--     refusal sentence.
--   - DATABASE PUBLICATION IS NOT PRODUCT DELIVERY: the catalog
--     tables keep RLS enabled with zero policies and zero client
--     privileges, so a published version remains invisible to every
--     ordinary client role. Delivery activation (the seed module edit
--     and the inventory seed_link_compatible flip) is a separate,
--     later, separately authorized repository act; this package
--     proves the tenant exercises table and the client-denial posture
--     are untouched.
--   - REVIEW-EVENT SCOPING (unchanged from the accepted EXLIB-2P/2Q
--     derivation): the exercise_catalog_review_events log is
--     SNAPSHOT-scoped — its catalog_id references
--     exercise_catalog(id) — and trigger-internal (its guard accepts
--     rows only at pg_trigger_depth >= 2, from the snapshot
--     review-transition trigger). A publication writes ZERO rows
--     there BY SCHEMA DESIGN; the publication's durable audit is the
--     content row's own one-way publication_status machine plus the
--     protected projection itself. This package asserts the
--     review-events count is unchanged at zero.
--
-- AUTHORITATIVE SOURCES (all promoted, all byte-frozen):
--   - Promoted source commit: main =
--     64640e9001c7e50b31319b7745dd87c68d1caa75 (tree
--     aca8b975d553cef734a6d3b54f8eef878b4f3fa5; annotated tag
--     exlib2q-hosted-admission-application-evidence-stable, tag object
--     2ff5a3744e6439782971c767fc4828068bcd42e8, annotation
--     "EXLIB-2Q Plank hosted import-admission application evidence —
--     ADMITTED — NOT PUBLISHED").
--   - The hosted admission this publication builds on: the SPENT
--     EXLIB-2Q package (39,382 bytes, SHA-256
--     b15b9313db5efe679ca0d13cd0d9b9d97fd9316ec1d66d99c5bba6ca47529e57),
--     evidenced by the promoted EXLIB-2Q application record (24,193
--     bytes, SHA-256
--     7b24c0ecb78977b829d589e341895e7eb8790513f55ef9c281a827f3829eab23):
--     import_admitted true; admitted_fingerprint
--     23976eedf2d59b66cdfa05cd660a414430feabef8906e1936cb24f541040de9e
--     (the hosted, database-generated admission-manifest fingerprint,
--     operator-evidenced EQUAL to a fresh recomputation); admitted
--     source SHA-256
--     d82078490efa9ef13e128e7b7b742fbda8ea9e74e32382252d96c326c679d752
--     (= the promoted artifact); admitted_at 2026-09-05; publication
--     still draft; zero projected relationships.
--   - FINGERPRINT PORTABILITY (why a hosted-computed value may be a
--     precondition literal here, unlike the hosted surrogate snapshot
--     UUIDs): migration 027's admission manifest v2 binds ONLY
--     portable state — the fixed logical UUID, the snapshot's
--     semantic fields, anatomy, aliases, the authored payload and
--     authorship, the review tuple as an absolute epoch, and the
--     expected relationship set. It binds NO hosted surrogate UUID
--     and NO admission field. A lawful fixture that reproduces the
--     promoted literals therefore computes EXACTLY this fingerprint,
--     and the EXLIB-2R live verifier proves that reproduction. The
--     gate below additionally demands fingerprint FRESHNESS
--     relationally (= a recomputation inside this transaction), which
--     is also what migration 027 re-verifies at publication.
--   - The admitted Plank authored artifact (payload and human-review
--     evidence): docs/exlib2g-plank-content.jsonl, 2,928 bytes,
--     SHA-256
--     d82078490efa9ef13e128e7b7b742fbda8ea9e74e32382252d96c326c679d752.
--     Every payload literal below is re-derived mechanically from it.
--   - The completed Plank human review form: 2,389 bytes, SHA-256
--     59ad2668790b6d0b135c8c453a702c45774f905ece8749a6112881b1df7e5b98.
--   - The hosted database review: the SPENT EXLIB-2P package (37,702
--     bytes, SHA-256
--     76d1d67d6ec2bafc49ef43a6312700559cd9eeee4b8b9433868de9daf95dc666);
--     content_status approved, reviewed_by Nick Tkacz, reviewed_at
--     the 2026-09-01T20:35:00-04:00 instant, review_rationale
--     "Everything looks correct".
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
--     UUIDs (Plank's ca-prefixed row included) are DELIBERATELY NOT
--     preconditions — the accepted fixture-portability reasoning:
--     they are loader-generated surrogates no lawful disposable
--     fixture can reproduce, so the gates below bind each target by
--     its FIXED logical UUID, exactly-one-snapshot structure,
--     canonical name, category, activity, version, and review state —
--     forward AND reverse. publish_catalog_content itself does NOT
--     require target snapshots to be reviewed; these gates pin them
--     PENDING because that is the exact evidenced hosted pre-state,
--     not because the function demands it.
--
-- ONE-USE / FAIL-CLOSED (honestly classified: this package is
-- ONE-USE, NOT idempotent): the pre-state gate demands the exact
-- post-EXLIB-2Q hosted surface with the Plank content row APPROVED,
-- ADMITTED, and still DRAFT with ZERO projected relationships, and
-- migration 027's publish_catalog_content itself refuses a
-- non-draft version ("only a draft can be published; re-publishing a
-- published or retired version is rejected"). UNLIKE the review and
-- admission packages, a publication CHANGES the count vector — the
-- projection inserts exactly two relationship rows
-- (3/3/5/3/6/1/2/0/0/0/0 becomes 3/3/5/3/6/1/2/2/0/0/0) — so a
-- second execution refuses fail-closed at BOTH the vector gate and
-- the draft gate BEFORE any write or authority change. Two concurrent
-- executions serialize at the eleven-table lock below; the loser
-- proceeds only after the winner commits and then refuses at the
-- pre-state gates (the vector already carries the two projected
-- rows and the content row is no longer a draft). Any gate failure
-- anywhere rolls back the ENTIRE transaction.
--
-- HOSTED AUTHORITY POSTURE (the EXLIB-2K-proven implicit-creator
-- mechanism, identical for every migration-027 lifecycle role): the
-- invoker is the NON-SUPERUSER operator role postgres; migration 027
-- created exlib_catalog_admin NOLOGIN in the same DO block as the
-- loader, reviewer, and admission roles, so the role carries EXACTLY
-- ONE membership — the implicit creator membership postgres granted
-- BY the bootstrap superuser supabase_admin with ADMIN TRUE, INHERIT
-- FALSE, SET FALSE. The package elevates inside the transaction
-- (GRANT ... SET TRUE), proves the exact two-grantor shape, performs
-- the single publication call under SET ROLE, then restores
-- byte-for-byte with a grantor-scoped REVOKE and verifies the
-- restored baseline in its postconditions.
--
-- DATABASE-GENERATED VALUES: the projection rows' created_at
-- timestamps are database defaults and are NOT gated by value — the
-- postconditions bind the projected SET (from/to/relation) exactly,
-- both directions. The returned JSONB contains NO database-generated
-- value for Plank: logical_id and published echo the two arguments,
-- content_version is the gated 1, projected_relationships is the
-- gated expected-set size 2, and retired is provably NULL because
-- the pre-state gate proves the identity carries EXACTLY ONE content
-- row and it is a draft — no published version can exist to retire.
-- The call block therefore asserts the ENTIRE returned JSONB by
-- exact equality, fabricating nothing.
--
-- NAME RESOLUTION (the EXLIB-2O round-3 standard): the single
-- publication call is SCHEMA-QUALIFIED as
-- public.publish_catalog_content, so the function the precondition
-- proves to exist is the function actually invoked, independent of
-- search_path. Every OTHER name in this package is either
-- public.-qualified or a pg_catalog system view or built-in, and
-- pg_catalog is searched ahead of every search_path entry, so no
-- schema placed on search_path can shadow any of them. This package
-- therefore pins no search_path and needs none.
--
-- EXECUTION OUTPUT: the call block captures the function's JSONB
-- return, asserts it equals the exact derivable value
-- {logical_id ...0001, published ...0101, retired null,
-- content_version 1, projected_relationships 2}, and surfaces it
-- with RAISE NOTICE. The notice is display evidence; the in-block
-- equality assertion and the row postconditions below are the
-- binding proof.
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
--    refuses at the pre-state gates (the vector already carries the
--    two projected rows and the content row is no longer a draft).
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
  IF to_regprocedure('public.publish_catalog_content(uuid,uuid)') IS NULL THEN
    RAISE EXCEPTION 'exlib2r publication: migration-027 publish_catalog_content is missing; wrong or unmigrated database';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'exlib_catalog_admin') THEN
    RAISE EXCEPTION 'exlib2r publication: admin role missing';
  END IF;
  -- hosted operator identity, recognized before any write
  IF current_user <> 'postgres' OR session_user <> 'postgres' THEN
    RAISE EXCEPTION 'exlib2r publication: BOTH execution identities must be the hosted operator role postgres (got current_user=%, session_user=%); refusing before any write or authority change', current_user, session_user;
  END IF;
  IF (SELECT rolsuper FROM pg_roles WHERE rolname = current_user) THEN
    RAISE EXCEPTION 'exlib2r publication: the invoker is a superuser; this package is bound to the hosted non-superuser postgres posture';
  END IF;
  -- the exact admin-role authority baseline, grantor included
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
    RAISE EXCEPTION 'exlib2r publication: the admin-role membership posture is not the exact hosted baseline (exactly one membership: postgres granted BY supabase_admin with ADMIN TRUE, INHERIT FALSE, SET FALSE — grantor included); refusing before any write or authority change';
  END IF;
  -- EXACT expected pre-state: the surface the executed EXLIB-2Q
  -- admission left behind (identical in COUNT to the post-EXLIB-2P
  -- surface, because an admission changes no count), as the full
  -- eleven-table count vector — the same eleven tables this
  -- transaction locks. Any other surface — including the surface
  -- this package itself produces, whose relationships term is 2 —
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
    RAISE EXCEPTION 'exlib2r publication: the catalog surface is not the exact post-EXLIB-2Q hosted pre-state (expected 3/3/5/3/6/1/2/0/0/0/0, found %); this ONE-USE package refuses to run twice, over foreign state, or over an ambiguous surface', v_counts;
  END IF;
  -- the exact three identities, by UUID
  IF NOT EXISTS (SELECT 1 FROM public.exercise_catalog_logical WHERE id = 'e21b2c00-0000-4000-a000-000000000001')
     OR NOT EXISTS (SELECT 1 FROM public.exercise_catalog_logical WHERE id = 'e21b2c00-0000-4000-a000-000000000002')
     OR NOT EXISTS (SELECT 1 FROM public.exercise_catalog_logical WHERE id = 'e21b2c00-0000-4000-a000-000000000003') THEN
    RAISE EXCEPTION 'exlib2r publication: an expected logical identity is missing (...0001/...0002/...0003 must all exist); refusing';
  END IF;
  -- TARGET-SNAPSHOT GATES, forward: each projection target carries
  -- EXACTLY ONE snapshot with the adjudicated name, category,
  -- activity, version, and review state — the exact evidenced hosted
  -- pre-state (the publish function itself does not require target
  -- review; the exactness requirement is this package's own).
  IF (SELECT count(*) FROM public.exercise_catalog e
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000002') <> 1
     OR NOT EXISTS (SELECT 1 FROM public.exercise_catalog e
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000002'
         AND e.canonical_name = 'Dead bug' AND e.category = 'mobility'
         AND e.review_status = 'pending' AND e.reviewed_by IS NULL
         AND e.catalog_version = 1 AND e.is_active) THEN
    RAISE EXCEPTION 'exlib2r publication: the Dead bug target snapshot is missing, inactive, re-versioned, reviewed, or re-bound (...0002 must carry exactly one active pending v1 snapshot named Dead bug, category mobility); refusing';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog e
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000003') <> 1
     OR NOT EXISTS (SELECT 1 FROM public.exercise_catalog e
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000003'
         AND e.canonical_name = 'Ab wheel rollout' AND e.category = 'other'
         AND e.review_status = 'pending' AND e.reviewed_by IS NULL
         AND e.catalog_version = 1 AND e.is_active) THEN
    RAISE EXCEPTION 'exlib2r publication: the Ab wheel rollout target snapshot is missing, inactive, re-versioned, reviewed, or re-bound (...0003 must carry exactly one active pending v1 snapshot named Ab wheel rollout, category other); refusing';
  END IF;
  -- TARGET-SNAPSHOT GATES, reverse (no-swap): each canonical name
  -- resolves to exactly its intended logical UUID and no other.
  IF (SELECT count(*) FROM public.exercise_catalog e WHERE e.canonical_name = 'Dead bug') <> 1
     OR (SELECT e.logical_id FROM public.exercise_catalog e WHERE e.canonical_name = 'Dead bug')
        <> 'e21b2c00-0000-4000-a000-000000000002'
     OR (SELECT count(*) FROM public.exercise_catalog e WHERE e.canonical_name = 'Ab wheel rollout') <> 1
     OR (SELECT e.logical_id FROM public.exercise_catalog e WHERE e.canonical_name = 'Ab wheel rollout')
        <> 'e21b2c00-0000-4000-a000-000000000003' THEN
    RAISE EXCEPTION 'exlib2r publication: reverse target binding failed (a canonical target name does not resolve to exactly its intended UUID — a swap or duplicate); refusing';
  END IF;
  -- THE COMPLETE AUTHORITATIVE PLANK PRE-STATE. Field-level, by
  -- EXACT VALUE EQUALITY to dollar-quoted authoritative literals
  -- re-derived mechanically from the promoted admitted Plank
  -- artifact docs/exlib2g-plank-content.jsonl (2,928 B, sha256
  -- d82078490efa9ef13e128e7b7b742fbda8ea9e74e32382252d96c326c679d752)
  -- and the promoted EXLIB-2Q application record. NO hash appears in
  -- the payload comparisons; the two fingerprint fields below are
  -- the promoted admission provenance this package REQUIRES intact:
  -- the source SHA equals the promoted artifact fingerprint, and the
  -- admission fingerprint equals BOTH the promoted evidenced literal
  -- AND a fresh recomputation inside this transaction (portable by
  -- manifest design — see header; STALE admission refuses here,
  -- before any write, exactly as migration 027 would refuse it
  -- again at the transition). admitted_at is present but
  -- DELIBERATELY not pinned to a date literal: it is
  -- execution-date-dependent (CURRENT_DATE at admission time), so a
  -- lawful fixture cannot reproduce the hosted calendar value; the
  -- all-or-nothing admission CHECK plus the two pinned digests carry
  -- the provenance.
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
    RAISE EXCEPTION 'exlib2r publication: the Plank snapshot is not the exact promoted EXLIB-2K state (a semantic field drifted); refusing before any write or authority change';
  END IF;
  IF (SELECT string_agg(m.muscle || ':' || m.role, ',' ORDER BY m.muscle)
        FROM public.exercise_catalog_muscles m
        JOIN public.exercise_catalog e ON e.id = m.catalog_id
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000001')
     IS DISTINCT FROM 'lower_back:tertiary,obliques:secondary' THEN
    RAISE EXCEPTION 'exlib2r publication: the Plank anatomy set drifted; refusing before any write or authority change';
  END IF;
  IF (SELECT string_agg(a.alias, ',' ORDER BY a.alias)
        FROM public.exercise_catalog_aliases a
       WHERE a.logical_id = 'e21b2c00-0000-4000-a000-000000000001')
     IS DISTINCT FROM 'Forearm plank,Front plank' THEN
    RAISE EXCEPTION 'exlib2r publication: the Plank alias set drifted; refusing before any write or authority change';
  END IF;
  IF (SELECT string_agg(c.normalized_name || '=' || c.claim_source, ',' ORDER BY c.normalized_name)
        FROM public.exercise_catalog_name_claims c
       WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000001')
     IS DISTINCT FROM 'forearm plank=alias,front plank=alias,plank=canonical' THEN
    RAISE EXCEPTION 'exlib2r publication: the Plank claim set drifted; refusing before any write or authority change';
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
         AND c.import_admitted = true
         AND c.admitted_source_sha256 = $p_src$d82078490efa9ef13e128e7b7b742fbda8ea9e74e32382252d96c326c679d752$p_src$
         AND c.admitted_fingerprint = $p_fp$23976eedf2d59b66cdfa05cd660a414430feabef8906e1936cb24f541040de9e$p_fp$
         AND c.admitted_fingerprint ~ '^[0-9a-f]{64}$'
         AND c.admitted_fingerprint = public.exlib_content_admission_fingerprint(c.id)
         AND c.admitted_at IS NOT NULL) THEN
    RAISE EXCEPTION 'exlib2r publication: the Plank content row is not the exact admitted pre-publication state (payload, authorship, the applied human review tuple, the admission provenance, admission freshness, or the approved/admitted/draft lifecycle drifted); refusing before any write or authority change';
  END IF;
  -- the expected relationship set: exactly the two promoted rows —
  -- these are the rows the atomic projection will make live
  IF (SELECT string_agg(x.relation || '>' || x.to_logical_id::text, ',' ORDER BY x.relation)
        FROM public.exercise_catalog_content_expected_relationships x)
     IS DISTINCT FROM 'progression>e21b2c00-0000-4000-a000-000000000003,substitution>e21b2c00-0000-4000-a000-000000000002' THEN
    RAISE EXCEPTION 'exlib2r publication: the Plank expected-relationship set drifted; refusing before any write or authority change';
  END IF;
  -- ZERO projected relationships anywhere (the vector eighth term
  -- above) AND explicitly for the Plank identity: publication has
  -- not happened, and no foreign projection exists for this package
  -- to collide with or silently absorb.
  IF (SELECT count(*) FROM public.exercise_catalog_relationships r
       WHERE r.from_logical_id = 'e21b2c00-0000-4000-a000-000000000001') <> 0 THEN
    RAISE EXCEPTION 'exlib2r publication: a projected Plank relationship already exists; publication is one-way and this package never re-projects; refusing';
  END IF;
  -- ZERO pre-existing review events, globally (the vector eleventh
  -- term above) AND explicitly for every Plank snapshot row.
  IF (SELECT count(*) FROM public.exercise_catalog_review_events ev
        JOIN public.exercise_catalog e ON e.id = ev.catalog_id
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000001') <> 0 THEN
    RAISE EXCEPTION 'exlib2r publication: a Plank review event already exists; refusing';
  END IF;
  -- the catalog-claim invariant must already hold
  SELECT orphaned_claims, unclaimed_bearers
    INTO v_orphaned, v_unclaimed FROM public.exlib_verify_catalog_claims();
  IF v_orphaned <> 0 OR v_unclaimed <> 0 THEN
    RAISE EXCEPTION 'exlib2r publication: the catalog claims invariant is already violated (orphaned=%, unclaimed=%); refusing', v_orphaned, v_unclaimed;
  END IF;
  -- the publication surface stays locked away from ordinary clients,
  -- function AND projection table
  IF has_function_privilege('anon', 'public.publish_catalog_content(uuid,uuid)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.publish_catalog_content(uuid,uuid)', 'EXECUTE')
     OR has_function_privilege('service_role', 'public.publish_catalog_content(uuid,uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'exlib2r publication: the publication function is executable by an ordinary client role; refusing before any write or authority change';
  END IF;
  IF has_table_privilege('anon', 'public.exercise_catalog_relationships', 'SELECT')
     OR has_table_privilege('authenticated', 'public.exercise_catalog_relationships', 'SELECT') THEN
    RAISE EXCEPTION 'exlib2r publication: the protected projection table is readable by an ordinary client role; refusing before any write or authority change';
  END IF;
  -- TRANSITION-NEUTRALITY EVIDENCE (not a pre-state authority: the
  -- authoritative pre-state is proven by the exact gates above):
  -- whole-row digests of every surface this package must NOT change
  -- — all three snapshot families, anatomy, aliases, claims,
  -- expected relationships, and the ENTIRE tenant exercises table —
  -- captured now and re-digested after the publication to prove
  -- EXLIB-2R itself changes none of them. The CONTENT row and the
  -- RELATIONSHIPS table are deliberately absent here: this package
  -- changes exactly the content row's publication status and the
  -- protected projection, and the postconditions bind those changes
  -- (and the frozen payload) by exact value instead. These digests
  -- are md5, used ONLY to detect a change between two readings
  -- inside this one transaction — never as a binding to any source
  -- artifact.
  CREATE TEMP TABLE exlib2r_pre_evidence ON COMMIT DROP AS
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
GRANT exlib_catalog_admin TO postgres WITH SET TRUE, INHERIT FALSE;

-- ── Structural two-grantor proof, BEFORE SET ROLE or the
--    publication call: exactly two membership rows — the untouched
--    supabase_admin-granted baseline plus the postgres-granted
--    temporary SET row ─────────────────────────────────────────────
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
    RAISE EXCEPTION 'exlib2r publication: the two-grantor membership shape after the temporary grant is not exact (supabase_admin-granted baseline row plus postgres-granted SET row); aborting before SET ROLE and before the publication call';
  END IF;
END
$auth$;

-- ── The single Plank publication, under the admin authority ONLY.
--    The two UUIDs are the promoted loaded identity and its admitted
--    content version. The returned JSONB is captured and asserted by
--    EXACT EQUALITY — every field is derivable (see header): the two
--    echoed arguments, the gated version 1, the gated expected-set
--    size 2, and retired null (the pre-state gate proved exactly one
--    content row exists for the identity and it is a draft, so no
--    published version can exist to retire). The call is
--    SCHEMA-QUALIFIED (see NAME RESOLUTION above). ─────────────────
SET ROLE exlib_catalog_admin;

DO $call$
DECLARE
  v_result JSONB;
BEGIN
  v_result := public.publish_catalog_content(
    'e21b2c00-0000-4000-a000-000000000001',
    'e21b2c00-0000-4000-a000-000000000101');
  IF v_result IS DISTINCT FROM jsonb_build_object(
       'logical_id',              'e21b2c00-0000-4000-a000-000000000001',
       'published',               'e21b2c00-0000-4000-a000-000000000101',
       'retired',                 NULL,
       'content_version',         1,
       'projected_relationships', 2) THEN
    RAISE EXCEPTION 'exlib2r publication: the returned JSONB is not the exact derivable result (expected logical ...0001, published ...0101, retired null, content_version 1, projected_relationships 2; got %); rolling back everything', v_result;
  END IF;
  RAISE NOTICE 'exlib2r publication result: %', v_result;
END
$call$;

RESET ROLE;

-- ── Exact restoration: remove ONLY the temporary grant this package
--    created, identified by its grantor ────────────────────────────
REVOKE exlib_catalog_admin FROM postgres GRANTED BY postgres;

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
    RAISE EXCEPTION 'exlib2r publication: authority restoration is not exact (baseline row plus zero standing SET capability required); rolling back everything';
  END IF;
  -- the PUBLISHED content row: publication_status published with
  -- EVERY other field re-asserted by exact value — payload,
  -- authorship, version, the applied human review tuple, and the
  -- COMPLETE UNCHANGED admission surface with its fingerprint STILL
  -- equal to a fresh recomputation (the freshness the freeze trigger
  -- just re-verified structurally at the transition; re-proven here
  -- as a postcondition). The publication transition travels alone by
  -- schema law; this gate proves it did.
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
         AND c.admitted_fingerprint = $q_fp$23976eedf2d59b66cdfa05cd660a414430feabef8906e1936cb24f541040de9e$q_fp$
         AND c.admitted_fingerprint ~ '^[0-9a-f]{64}$'
         AND c.admitted_fingerprint = public.exlib_content_admission_fingerprint(c.id)
         AND c.admitted_at IS NOT NULL
         AND c.authored_by = $q_ab$ForgeFitOS content program (AI-drafted original prose; pending human specialist review)$q_ab$
         AND c.authored_at = DATE '2026-09-01'
         AND c.setup_steps = $q_setu$["Lie face down, then prop yourself on your forearms with your elbows stacked directly under your shoulders.", "Extend your legs behind you with your feet about hip-width apart and your toes tucked under.", "Before lifting, brace your trunk gently as if preparing for a light press against your stomach."]$q_setu$::jsonb
         AND c.execution_steps = $q_exec$["Lift your hips so your body forms one straight line from the back of your head to your heels.", "Squeeze your glutes and keep your ribs drawn down so your lower back never sags toward the floor.", "Hold the position for the planned duration while keeping your neck long and your gaze at the floor.", "End the hold by lowering your knees to the floor under control, then rest fully before the next hold."]$q_exec$::jsonb
         AND c.common_mistakes = $q_mist$["Letting the hips sag so the lower back arches instead of staying in one straight line.", "Lifting the hips too high, which turns the hold into a rest position for the trunk.", "Grinding out extra seconds with a broken line instead of ending the hold when the position degrades."]$q_mist$::jsonb
         AND c.breathing_cue = $q_br$Breathe steadily for the whole hold with slow inhales and full exhales; never hold your breath to stiffen the position.$q_br$
         AND c.safety_guidance = $q_sf$A plank loads the trunk hardest once the hips drift, so keep the line strict rather than chasing longer times; if your lower back starts to ache or your hips sag and you cannot correct it, lower your knees and stop the hold there.$q_sf$
         AND c.equipment_setup = $q_es$$q_es$
         AND c.accessibility_alternative = $q_ac$Hold the position with your knees resting on the floor, or brace against a countertop at an incline for a gentler version.$q_ac$
         AND c.publication_status = 'published') THEN
    RAISE EXCEPTION 'exlib2r publication: the published content row is not exact (publication status, audit tuple, frozen payload, or the unchanged admission surface drifted); rolling back everything';
  END IF;
  -- THE EXACT PROJECTION, both directions: the live relationship set
  -- for Plank equals the expected set exactly (the same equality the
  -- freeze trigger verified structurally), the whole table holds
  -- exactly these two rows, and every row aims FROM Plank AT an
  -- existing gated target. created_at values are database defaults,
  -- deliberately not gated by value.
  IF (SELECT count(*) FROM public.exercise_catalog_relationships) <> 2
     OR (SELECT string_agg(r.relation || '>' || r.to_logical_id::text, ',' ORDER BY r.relation)
           FROM public.exercise_catalog_relationships r
          WHERE r.from_logical_id = 'e21b2c00-0000-4000-a000-000000000001')
        IS DISTINCT FROM 'progression>e21b2c00-0000-4000-a000-000000000003,substitution>e21b2c00-0000-4000-a000-000000000002' THEN
    RAISE EXCEPTION 'exlib2r publication: the projected relationship set is not exactly the expected set (progression -> ...0003 and substitution -> ...0002, from Plank, and nothing else anywhere); rolling back everything';
  END IF;
  IF EXISTS (
      SELECT 1 FROM public.exercise_catalog_content_expected_relationships e
      WHERE e.content_id = 'e21b2c00-0000-4000-a000-000000000101'
        AND NOT EXISTS (
          SELECT 1 FROM public.exercise_catalog_relationships r
          WHERE r.from_logical_id = 'e21b2c00-0000-4000-a000-000000000001'
            AND r.relation = e.relation
            AND r.to_logical_id = e.to_logical_id))
     OR EXISTS (
      SELECT 1 FROM public.exercise_catalog_relationships r
      WHERE r.from_logical_id = 'e21b2c00-0000-4000-a000-000000000001'
        AND NOT EXISTS (
          SELECT 1 FROM public.exercise_catalog_content_expected_relationships e
          WHERE e.content_id = 'e21b2c00-0000-4000-a000-000000000101'
            AND e.relation = r.relation
            AND e.to_logical_id = r.to_logical_id)) THEN
    RAISE EXCEPTION 'exlib2r publication: projected-set equality failed in a direction (a required relationship is missing or an unexpected one is present); rolling back everything';
  END IF;
  -- the eleven-table vector moved EXACTLY as a publication moves it:
  -- the projection added exactly the two relationship rows and
  -- NOTHING else anywhere — and the SNAPSHOT-scoped review-events
  -- log stays at zero BY SCHEMA DESIGN (see header).
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
  IF v_counts <> '3/3/5/3/6/1/2/2/0/0/0' THEN
    RAISE EXCEPTION 'exlib2r publication: post-state counts are not the exact published surface (expected 3/3/5/3/6/1/2/2/0/0/0, found %); a publication projects exactly two Plank relationship rows and creates or deletes nothing else; rolling back everything', v_counts;
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_review_events) <> 0 THEN
    RAISE EXCEPTION 'exlib2r publication: a review event appeared; the snapshot-scoped log must stay empty under a publication; rolling back everything';
  END IF;
  -- every untouched surface is digest-identical (transition
  -- neutrality, disclaimed above) — snapshots, anatomy, aliases,
  -- claims, expected relationships, and the tenant table
  IF EXISTS (SELECT 1 FROM exlib2r_pre_evidence p
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
    RAISE EXCEPTION 'exlib2r publication: an untouched surface changed (snapshots, anatomy, aliases, claims, expected relationships, or tenant exercises); rolling back everything';
  END IF;
  -- the catalog-claim invariant must hold EXACTLY (0/0)
  SELECT orphaned_claims, unclaimed_bearers
    INTO v_orphaned, v_unclaimed FROM public.exlib_verify_catalog_claims();
  IF v_orphaned <> 0 OR v_unclaimed <> 0 THEN
    RAISE EXCEPTION 'exlib2r publication: the catalog claims invariant does not hold after the publication (orphaned=%, unclaimed=%); rolling back everything', v_orphaned, v_unclaimed;
  END IF;
  -- the publication surface stays locked away from ordinary clients,
  -- function AND projection table: DATABASE PUBLICATION IS NOT
  -- PRODUCT DELIVERY (see header)
  IF has_function_privilege('anon', 'public.publish_catalog_content(uuid,uuid)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.publish_catalog_content(uuid,uuid)', 'EXECUTE')
     OR has_function_privilege('service_role', 'public.publish_catalog_content(uuid,uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'exlib2r publication: the publication function is executable by an ordinary client role; rolling back everything';
  END IF;
  IF has_table_privilege('anon', 'public.exercise_catalog_relationships', 'SELECT')
     OR has_table_privilege('authenticated', 'public.exercise_catalog_relationships', 'SELECT') THEN
    RAISE EXCEPTION 'exlib2r publication: the protected projection table is readable by an ordinary client role; rolling back everything';
  END IF;
END
$post$;

COMMIT;

-- ============================================================
-- AFTER COMMIT (evidence to capture, for the eventual authorized
-- hosted execution ONLY): the exact UTC start/finish timestamps, the
-- RAISE NOTICE echo of the asserted JSONB {"logical_id": "...0001",
-- "published": "...0101", "retired": null, "content_version": 1,
-- "projected_relationships": 2}, and the post-state read-backs.
-- DELIVERY REMAINS SEPARATELY BLOCKED: publishing the content does
-- NOT deliver it — the catalog tables keep RLS with zero policies
-- and zero client privileges, the tenant exercises table is
-- untouched, and the seed module and inventory compatibility flags
-- are repository artifacts this package cannot and does not touch.
-- The later delivery activation has its own reviewed change and its
-- own explicit instruction.
-- ============================================================
