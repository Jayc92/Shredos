-- ============================================================
-- EXLIB-2O — Dead bug + Ab wheel rollout TARGET-SNAPSHOT load
-- package.
--
--   PREPARED — NOT EXECUTED
--
-- The ONLY database this package may ever be executed against is
-- Supabase project "ShredOS", ref ttybyljytiwntvorugcv, and ONLY by
-- Joseph/ChatGPT over the established hosted-execution path — never
-- by Claude, and never by any automated pipeline. Local execution is
-- permitted ONLY inside disposable, socket-only PostgreSQL fixtures
-- that are destroyed afterward (the EXLIB-2O live verifier).
--
-- WHAT THIS PACKAGE DOES (and everything it refuses to do):
-- it adds exactly TWO born-active, born-pending catalog snapshots to
-- the two EXISTING bare logical identities that the executed
-- EXLIB-2K package created on hosted ShredOS:
--
--   Dead bug         -> e21b2c00-0000-4000-a000-000000000002
--   Ab wheel rollout -> e21b2c00-0000-4000-a000-000000000003
--
-- plus ONLY their loader-carried supporting rows: the anatomy rows
-- and alias rows carried in the calls below, and the name claims the
-- migration-023 claim trigger derives from them. It loads NO
-- instructional content for either target (zero
-- load_catalog_content_draft calls), creates NO content version, NO
-- expected relationship, NO projected relationship, NO review event,
-- NO review transition, NO publication state, NO import run, NO run
-- item, NO delivery state, NO seed change, and NO
-- seed_link_compatible flip, and it leaves every existing hosted
-- Plank row (identity, snapshot, anatomy, aliases, claims, content
-- draft, expected relationships) byte/value-unchanged — proven by an
-- in-transaction digest comparison. Database review of these
-- snapshots, content authoring/loading, admission, publication, and
-- relationship projection are all LATER, separately gated
-- milestones.
--
-- SOURCE DERIVATION (fail-closed; every value has a committed
-- authority; nothing is inferred):
--   * Identity bindings and the two names: the promoted EXLIB-2N
--     completed human-review forms and the EXLIB-2K load evidence
--     (the identities exist hosted as BARE identities).
--   * category 'mobility' (Dead bug) and 'other' (Ab wheel rollout):
--     the HUMAN category decisions carried by the completed forms
--     and the promoted application record — the authoring schema has
--     no category field, so these are the only authoritative
--     carriers.
--   * Every other snapshot value: VERBATIM from the R6-admitted
--     authored records —
--       docs/exlib2c-release1-batch02-content.jsonl line 12
--       (file 52,123 B, sha256
--       ebca1c01ffa66c78bdc42fc2972cfd328a75d2d6c2735878f9445617c15743cc)
--       docs/exlib2c-release1-batch04-content.jsonl line 5
--       (file 55,442 B, sha256
--       c8a63ccbd7cc2913265926050480535f5d4adff585f1d462f9b2c2d30406fcf2)
--     Completed forms:
--       ce555650a643077be099b9e65490e36d8731ce9c40ad0e3aa0e80065152cdbeb (Dead bug)
--       efed7f1f59a040014dd6ca5df1276997de2f7410a186da10532fe987558181b5 (Ab wheel rollout, EDT-corrected)
--   * provenance 'forgefitos_original' -> the four discovery-source
--     fields are NULL BY CONSTRAINT
--     (exercise_catalog_provenance_sources_chk); the authored records
--     never carried these keys at all.
--   * Applied migration 027 (byte-frozen):
--     90d53aaf8fd341dd99bab22b7d1ca280ec24b8ccee2a28efca6e835e0585a14f
--   * The SPENT EXLIB-2K package that produced the expected hosted
--     pre-state (never reused, never re-executed):
--     a1b6dd55850c5d544e2f484d1ce4833b41deec7f3dd4d4c2373cb3b50daaccf0
--   * Constructed values: NONE. The snapshot row ids are the table's
--     own gen_random_uuid() defaults; catalog_version, review_status
--     (pending, evidence-null), and is_active (true) are the
--     migration-023 born-state defaults; no content id or content
--     version exists because no content is loaded.
--
-- ONE-USE / FAIL-CLOSED: the pre-state gate demands the EXACT hosted
-- surface the executed EXLIB-2K package left behind (the exact
-- ten-table count vector, the exact three identities, both targets
-- bare, all three target names unclaimed, the claims invariant
-- clean). After this package commits, that gate can never hold
-- again, so a second execution refuses BEFORE any write or authority
-- change. Unrelated pre-existing state fails the same gate. The
-- whole package is ONE transaction: any failed precondition, loader
-- call, restoration check, or postcondition rolls back EVERYTHING,
-- including the temporary authority grant.
--
-- HOSTED AUTHORITY POSTURE (proven during EXLIB-2K): the invoker is
-- the NON-SUPERUSER hosted operator role postgres; the loader role
-- exlib_catalog_loader carries EXACTLY one membership — postgres,
-- granted BY supabase_admin, ADMIN TRUE / INHERIT FALSE / SET FALSE.
-- The package elevates inside the transaction (GRANT ... SET TRUE),
-- proves the exact two-grantor shape, performs the two loader calls
-- under SET ROLE, then restores byte-for-byte with a grantor-scoped
-- REVOKE and verifies the restored baseline in its postconditions.
-- ============================================================

BEGIN;

-- ── Fresh-state gate serialization: REAL table locks, taken before
--    any read the gate depends on, in ONE deterministic alphabetical
--    statement. SHARE ROW EXCLUSIVE conflicts with itself, so two
--    concurrent executions serialize here; the loser proceeds only
--    after the winner commits and then refuses at the pre-state gate.
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
  IF to_regprocedure('public.load_catalog_snapshot(uuid,text,text,text,text,text,text,text,text,text,text,text,text,text,date,text,jsonb,jsonb)') IS NULL THEN
    RAISE EXCEPTION 'exlib2o load: migration-027 load_catalog_snapshot is missing; wrong or unmigrated database';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'exlib_catalog_loader') THEN
    RAISE EXCEPTION 'exlib2o load: loader role missing';
  END IF;
  -- hosted operator identity, recognized before any write
  IF current_user <> 'postgres' OR session_user <> 'postgres' THEN
    RAISE EXCEPTION 'exlib2o load: BOTH execution identities must be the hosted operator role postgres (got current_user=%, session_user=%); refusing before any write or authority change', current_user, session_user;
  END IF;
  IF (SELECT rolsuper FROM pg_roles WHERE rolname = current_user) THEN
    RAISE EXCEPTION 'exlib2o load: the invoker is a superuser; this package is bound to the hosted non-superuser postgres posture';
  END IF;
  -- the exact EXLIB-2K-proven authority baseline, grantor included
  IF (SELECT count(*) FROM pg_catalog.pg_auth_members am
        JOIN pg_roles r ON r.oid = am.roleid
       WHERE r.rolname = 'exlib_catalog_loader') <> 1
     OR NOT EXISTS (
       SELECT 1 FROM pg_catalog.pg_auth_members am
         JOIN pg_roles r ON r.oid = am.roleid
         JOIN pg_roles m ON m.oid = am.member
         JOIN pg_roles g ON g.oid = am.grantor
        WHERE r.rolname = 'exlib_catalog_loader' AND m.rolname = 'postgres'
          AND g.rolname = 'supabase_admin'
          AND am.admin_option AND NOT am.inherit_option AND NOT am.set_option) THEN
    RAISE EXCEPTION 'exlib2o load: the loader-role membership posture is not the exact hosted baseline (exactly one membership: postgres granted BY supabase_admin with ADMIN TRUE, INHERIT FALSE, SET FALSE — grantor included); refusing before any write or authority change';
  END IF;
  -- EXACT expected pre-state: the surface the executed EXLIB-2K
  -- package left behind, as a full ten-table count vector. Any other
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
    INTO v_counts;
  IF v_counts <> '3/1/2/2/3/1/2/0/0/0' THEN
    RAISE EXCEPTION 'exlib2o load: the catalog surface is not the exact post-EXLIB-2K hosted pre-state (expected 3/1/2/2/3/1/2/0/0/0, found %); this ONE-USE package refuses to run twice, over foreign state, or over an ambiguous surface', v_counts;
  END IF;
  -- the exact three identities, by UUID
  IF NOT EXISTS (SELECT 1 FROM public.exercise_catalog_logical WHERE id = 'e21b2c00-0000-4000-a000-000000000001')
     OR NOT EXISTS (SELECT 1 FROM public.exercise_catalog_logical WHERE id = 'e21b2c00-0000-4000-a000-000000000002')
     OR NOT EXISTS (SELECT 1 FROM public.exercise_catalog_logical WHERE id = 'e21b2c00-0000-4000-a000-000000000003') THEN
    RAISE EXCEPTION 'exlib2o load: an expected logical identity is missing (the EXLIB-2K identities ...0001/...0002/...0003 must all exist); refusing';
  END IF;
  -- both TARGETS must be BARE: zero snapshots (active or not), zero
  -- aliases, zero claims. Any snapshot state here is either a second
  -- execution or foreign interference — refuse both.
  IF EXISTS (SELECT 1 FROM public.exercise_catalog e
              WHERE e.logical_id IN ('e21b2c00-0000-4000-a000-000000000002',
                                     'e21b2c00-0000-4000-a000-000000000003'))
     OR EXISTS (SELECT 1 FROM public.exercise_catalog_aliases a
                 WHERE a.logical_id IN ('e21b2c00-0000-4000-a000-000000000002',
                                        'e21b2c00-0000-4000-a000-000000000003'))
     OR EXISTS (SELECT 1 FROM public.exercise_catalog_name_claims c
                 WHERE c.logical_id IN ('e21b2c00-0000-4000-a000-000000000002',
                                        'e21b2c00-0000-4000-a000-000000000003')) THEN
    RAISE EXCEPTION 'exlib2o load: a target identity already carries snapshot/alias/claim state; refusing (one-use; conflicting or foreign snapshot state)';
  END IF;
  -- the three names this package will claim must be UNCLAIMED, so a
  -- renamed/relocated bearer elsewhere refuses instead of colliding
  IF EXISTS (SELECT 1 FROM public.exercise_catalog_name_claims c
              WHERE c.normalized_name IN ('dead bug', 'ab wheel rollout', 'ab roller rollout')) THEN
    RAISE EXCEPTION 'exlib2o load: an intended catalog name is already claimed; refusing (possible rename/swap or foreign state)';
  END IF;
  -- the existing Plank surface must be EXACTLY the loaded EXLIB-2K
  -- shape: one born-active born-pending snapshot named Plank on
  -- ...0001 and the untouched draft content row ...0101 v1
  IF (SELECT count(*) FROM public.exercise_catalog e
       WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000001'
         AND e.canonical_name = 'Plank' AND e.is_active
         AND e.review_status = 'pending' AND e.catalog_version = 1) <> 1 THEN
    RAISE EXCEPTION 'exlib2o load: the existing Plank snapshot is not the exact loaded EXLIB-2K state (active pending v1 named Plank on ...0001); refusing (ambiguous surface)';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_content c
       WHERE c.id = 'e21b2c00-0000-4000-a000-000000000101'
         AND c.logical_id = 'e21b2c00-0000-4000-a000-000000000001'
         AND c.content_version = 1) <> 1 THEN
    RAISE EXCEPTION 'exlib2o load: the existing Plank content draft is not the exact loaded EXLIB-2K row (...0101 v1 on ...0001); refusing (ambiguous surface)';
  END IF;
  -- the catalog-claim invariant must already hold
  SELECT orphaned_claims, unclaimed_bearers
    INTO v_orphaned, v_unclaimed FROM public.exlib_verify_catalog_claims();
  IF v_orphaned <> 0 OR v_unclaimed <> 0 THEN
    RAISE EXCEPTION 'exlib2o load: the catalog claims invariant is already violated (orphaned=%, unclaimed=%); refusing', v_orphaned, v_unclaimed;
  END IF;
  -- freeze the untouched-surface evidence for the postconditions:
  -- Plank rows (identity, snapshot, anatomy, aliases, claims,
  -- content, expected relationships) and the whole tenant exercises
  -- table, digested now, re-digested after the load
  CREATE TEMP TABLE exlib2o_pre_evidence ON COMMIT DROP AS
  SELECT
    (SELECT md5(string_agg(e::text, '|' ORDER BY e.id))
       FROM public.exercise_catalog e
      WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000001') AS plank_snapshot_digest,
    (SELECT md5(coalesce(string_agg(m::text, '|' ORDER BY m.muscle), '<none>'))
       FROM public.exercise_catalog_muscles m
       JOIN public.exercise_catalog e ON e.id = m.catalog_id
      WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000001') AS plank_anatomy_digest,
    (SELECT md5(coalesce(string_agg(a::text, '|' ORDER BY a.alias), '<none>'))
       FROM public.exercise_catalog_aliases a
      WHERE a.logical_id = 'e21b2c00-0000-4000-a000-000000000001') AS plank_alias_digest,
    (SELECT md5(coalesce(string_agg(c::text, '|' ORDER BY c.normalized_name), '<none>'))
       FROM public.exercise_catalog_name_claims c
      WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000001') AS plank_claims_digest,
    (SELECT md5(string_agg(c::text, '|' ORDER BY c.id))
       FROM public.exercise_catalog_content c
      WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000001') AS plank_content_digest,
    (SELECT md5(coalesce(string_agg(x::text, '|' ORDER BY x.relation, x.to_logical_id), '<none>'))
       FROM public.exercise_catalog_content_expected_relationships x) AS expected_rel_digest,
    (SELECT count(*) FROM public.exercises) AS tenant_count,
    (SELECT md5(coalesce(string_agg(t.id::text || t.user_id::text || t.name || t.is_active::text, '|' ORDER BY t.id), '<none>'))
       FROM public.exercises t) AS tenant_digest;
END
$pre$;

-- ── Transaction-contained elevation (posture-gated above; revoked
--    below; postcondition-verified restored; rolls back with the
--    whole transaction on ANY failure) ─────────────────────────────
GRANT exlib_catalog_loader TO postgres WITH SET TRUE, INHERIT FALSE;

-- ── Structural two-grantor proof, BEFORE SET ROLE or any loader
--    call: exactly two membership rows — the untouched
--    supabase_admin-granted baseline plus the postgres-granted
--    temporary SET row ─────────────────────────────────────────────
DO $auth$
BEGIN
  IF (SELECT count(*) FROM pg_catalog.pg_auth_members am
        JOIN pg_roles r ON r.oid = am.roleid
       WHERE r.rolname = 'exlib_catalog_loader') <> 2
     OR NOT EXISTS (
       SELECT 1 FROM pg_catalog.pg_auth_members am
         JOIN pg_roles r ON r.oid = am.roleid
         JOIN pg_roles m ON m.oid = am.member
         JOIN pg_roles g ON g.oid = am.grantor
        WHERE r.rolname = 'exlib_catalog_loader' AND m.rolname = 'postgres'
          AND g.rolname = 'supabase_admin'
          AND am.admin_option AND NOT am.inherit_option AND NOT am.set_option)
     OR NOT EXISTS (
       SELECT 1 FROM pg_catalog.pg_auth_members am
         JOIN pg_roles r ON r.oid = am.roleid
         JOIN pg_roles m ON m.oid = am.member
         JOIN pg_roles g ON g.oid = am.grantor
        WHERE r.rolname = 'exlib_catalog_loader' AND m.rolname = 'postgres'
          AND g.rolname = 'postgres'
          AND NOT am.admin_option AND NOT am.inherit_option AND am.set_option) THEN
    RAISE EXCEPTION 'exlib2o load: the two-grantor membership shape after the temporary grant is not exact (supabase_admin-granted baseline row plus postgres-granted SET row); aborting before SET ROLE and before any loader call';
  END IF;
END
$auth$;

-- ── The two target-snapshot loads, under the loader authority ONLY.
--    Values are VERBATIM from the R6-admitted authored records; the
--    category arguments are the HUMAN decisions from the completed
--    forms; the four discovery-source arguments are NULL exactly as
--    authored and as the forgefitos_original constraint requires. ──
SET ROLE exlib_catalog_loader;

SELECT load_catalog_snapshot(
  'e21b2c00-0000-4000-a000-000000000002',
  $nm1$Dead bug$nm1$,
  $cat1$mobility$cat1$,
  $pm1$abs$pm1$,
  $eq1$bodyweight$eq1$,
  $lat1$alternating$lat1$,
  $tm1$bodyweight$tm1$,
  $prov1$forgefitos_original$prov1$,
  $mp1$core_anti_extension$mp1$,
  $tr1$core$tr1$,
  $dif1$beginner$dif1$,
  $av1$minimal$av1$,
  NULL, NULL, NULL, NULL,
  $anat1$[{"muscle": "hip_flexors", "role": "secondary"}]$anat1$::jsonb,
  $alia1$[]$alia1$::jsonb);

SELECT load_catalog_snapshot(
  'e21b2c00-0000-4000-a000-000000000003',
  $nm2$Ab wheel rollout$nm2$,
  $cat2$other$cat2$,
  $pm2$abs$pm2$,
  $eq2$other$eq2$,
  $lat2$bilateral$lat2$,
  $tm2$weight_reps$tm2$,
  $prov2$forgefitos_original$prov2$,
  $mp2$core_anti_extension$mp2$,
  $tr2$core$tr2$,
  $dif2$advanced$dif2$,
  $av2$minimal$av2$,
  NULL, NULL, NULL, NULL,
  $anat2$[{"muscle": "lats", "role": "tertiary"}, {"muscle": "obliques", "role": "secondary"}]$anat2$::jsonb,
  $alia2$["Ab roller rollout"]$alia2$::jsonb);

RESET ROLE;

-- ── Exact restoration: remove ONLY the temporary grant this package
--    created, identified by its grantor ────────────────────────────
REVOKE exlib_catalog_loader FROM postgres GRANTED BY postgres;

-- ── Postconditions (owner reads; ANY mismatch rolls back ALL) ─────
DO $post$
DECLARE
  v_counts TEXT;
  v_orphaned BIGINT;
  v_unclaimed BIGINT;
  v_db UUID;
  v_aw UUID;
BEGIN
  -- authority restored byte-for-byte: exactly the baseline row,
  -- grantor included, and no standing SET capability
  IF (SELECT count(*) FROM pg_catalog.pg_auth_members am
        JOIN pg_roles r ON r.oid = am.roleid
       WHERE r.rolname = 'exlib_catalog_loader') <> 1
     OR NOT EXISTS (
       SELECT 1 FROM pg_catalog.pg_auth_members am
         JOIN pg_roles r ON r.oid = am.roleid
         JOIN pg_roles m ON m.oid = am.member
         JOIN pg_roles g ON g.oid = am.grantor
        WHERE r.rolname = 'exlib_catalog_loader' AND m.rolname = 'postgres'
          AND g.rolname = 'supabase_admin'
          AND am.admin_option AND NOT am.inherit_option AND NOT am.set_option)
     OR pg_has_role('postgres', 'exlib_catalog_loader', 'SET') THEN
    RAISE EXCEPTION 'exlib2o load: authority restoration is not exact (baseline row plus zero standing SET capability required); rolling back everything';
  END IF;
  -- exact post-state count vector: pre + 2 snapshots + 3 anatomy
  -- rows + 1 alias + 3 claims, nothing else anywhere
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
    INTO v_counts;
  IF v_counts <> '3/3/5/3/6/1/2/0/0/0' THEN
    RAISE EXCEPTION 'exlib2o load: post-state counts are not exact (expected 3/3/5/3/6/1/2/0/0/0, found %); rolling back everything', v_counts;
  END IF;
  -- Dead bug binding, proven INDEPENDENTLY: exactly one snapshot on
  -- ...0002 and it is exactly the admitted record + the human
  -- category decision, born pending/active/v1 with NULL audit
  SELECT e.id INTO v_db FROM public.exercise_catalog e
   WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000002'
     AND e.canonical_name = 'Dead bug' AND e.category = 'mobility'
     AND e.primary_muscle = 'abs' AND e.equipment = 'bodyweight'
     AND e.laterality = 'alternating' AND e.tracking_mode = 'bodyweight'
     AND e.provenance = 'forgefitos_original'
     AND e.movement_pattern = 'core_anti_extension' AND e.training_role = 'core'
     AND e.difficulty = 'beginner' AND e.availability = 'minimal'
     AND e.source_url IS NULL AND e.source_page IS NULL
     AND e.retrieved_at IS NULL AND e.import_confidence IS NULL
     AND e.review_status = 'pending' AND e.reviewed_by IS NULL
     AND e.reviewed_at IS NULL AND e.review_rationale IS NULL
     AND e.catalog_version = 1 AND e.is_active;
  IF v_db IS NULL
     OR (SELECT count(*) FROM public.exercise_catalog e
          WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000002') <> 1 THEN
    RAISE EXCEPTION 'exlib2o load: the Dead bug snapshot binding is not exact; rolling back everything';
  END IF;
  IF (SELECT string_agg(m.muscle || ':' || m.role, ',' ORDER BY m.muscle)
        FROM public.exercise_catalog_muscles m WHERE m.catalog_id = v_db)
     IS DISTINCT FROM 'hip_flexors:secondary' THEN
    RAISE EXCEPTION 'exlib2o load: the Dead bug anatomy rows are not exact; rolling back everything';
  END IF;
  IF EXISTS (SELECT 1 FROM public.exercise_catalog_aliases a
              WHERE a.logical_id = 'e21b2c00-0000-4000-a000-000000000002') THEN
    RAISE EXCEPTION 'exlib2o load: Dead bug must carry zero aliases; rolling back everything';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.exercise_catalog_name_claims c
                  WHERE c.normalized_name = 'dead bug' AND c.claim_source = 'canonical'
                    AND c.logical_id = 'e21b2c00-0000-4000-a000-000000000002')
     OR (SELECT count(*) FROM public.exercise_catalog_name_claims c
          WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000002') <> 1 THEN
    RAISE EXCEPTION 'exlib2o load: the Dead bug claims are not exact; rolling back everything';
  END IF;
  -- Ab wheel rollout binding, proven INDEPENDENTLY
  SELECT e.id INTO v_aw FROM public.exercise_catalog e
   WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000003'
     AND e.canonical_name = 'Ab wheel rollout' AND e.category = 'other'
     AND e.primary_muscle = 'abs' AND e.equipment = 'other'
     AND e.laterality = 'bilateral' AND e.tracking_mode = 'weight_reps'
     AND e.provenance = 'forgefitos_original'
     AND e.movement_pattern = 'core_anti_extension' AND e.training_role = 'core'
     AND e.difficulty = 'advanced' AND e.availability = 'minimal'
     AND e.source_url IS NULL AND e.source_page IS NULL
     AND e.retrieved_at IS NULL AND e.import_confidence IS NULL
     AND e.review_status = 'pending' AND e.reviewed_by IS NULL
     AND e.reviewed_at IS NULL AND e.review_rationale IS NULL
     AND e.catalog_version = 1 AND e.is_active;
  IF v_aw IS NULL
     OR (SELECT count(*) FROM public.exercise_catalog e
          WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000003') <> 1 THEN
    RAISE EXCEPTION 'exlib2o load: the Ab wheel rollout snapshot binding is not exact; rolling back everything';
  END IF;
  IF (SELECT string_agg(m.muscle || ':' || m.role, ',' ORDER BY m.muscle)
        FROM public.exercise_catalog_muscles m WHERE m.catalog_id = v_aw)
     IS DISTINCT FROM 'lats:tertiary,obliques:secondary' THEN
    RAISE EXCEPTION 'exlib2o load: the Ab wheel rollout anatomy rows are not exact; rolling back everything';
  END IF;
  IF (SELECT string_agg(a.alias, ',' ORDER BY a.alias)
        FROM public.exercise_catalog_aliases a
       WHERE a.logical_id = 'e21b2c00-0000-4000-a000-000000000003')
     IS DISTINCT FROM 'Ab roller rollout' THEN
    RAISE EXCEPTION 'exlib2o load: the Ab wheel rollout aliases are not exact; rolling back everything';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.exercise_catalog_name_claims c
                  WHERE c.normalized_name = 'ab wheel rollout' AND c.claim_source = 'canonical'
                    AND c.logical_id = 'e21b2c00-0000-4000-a000-000000000003')
     OR NOT EXISTS (SELECT 1 FROM public.exercise_catalog_name_claims c
                  WHERE c.normalized_name = 'ab roller rollout' AND c.claim_source = 'alias'
                    AND c.logical_id = 'e21b2c00-0000-4000-a000-000000000003')
     OR (SELECT count(*) FROM public.exercise_catalog_name_claims c
          WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000003') <> 2 THEN
    RAISE EXCEPTION 'exlib2o load: the Ab wheel rollout claims are not exact; rolling back everything';
  END IF;
  -- CROSS no-swap proof: each name resolves to exactly its UUID and
  -- each UUID carries exactly its name+category, in BOTH directions
  IF (SELECT e.logical_id FROM public.exercise_catalog e WHERE e.canonical_name = 'Dead bug')
       <> 'e21b2c00-0000-4000-a000-000000000002'
     OR (SELECT e.logical_id FROM public.exercise_catalog e WHERE e.canonical_name = 'Ab wheel rollout')
       <> 'e21b2c00-0000-4000-a000-000000000003'
     OR (SELECT e.category FROM public.exercise_catalog e WHERE e.canonical_name = 'Dead bug') <> 'mobility'
     OR (SELECT e.category FROM public.exercise_catalog e WHERE e.canonical_name = 'Ab wheel rollout') <> 'other' THEN
    RAISE EXCEPTION 'exlib2o load: the UUID/name/category bindings are swapped or wrong; rolling back everything';
  END IF;
  -- zero content versions for either target; the only content row is
  -- still the untouched Plank draft
  IF EXISTS (SELECT 1 FROM public.exercise_catalog_content c
              WHERE c.logical_id IN ('e21b2c00-0000-4000-a000-000000000002',
                                     'e21b2c00-0000-4000-a000-000000000003')) THEN
    RAISE EXCEPTION 'exlib2o load: a target gained a content version; this package must load no content; rolling back everything';
  END IF;
  -- the untouched-surface digests must be IDENTICAL to the pre-state
  IF EXISTS (
    SELECT 1 FROM exlib2o_pre_evidence p
    WHERE p.plank_snapshot_digest IS DISTINCT FROM
            (SELECT md5(string_agg(e::text, '|' ORDER BY e.id))
               FROM public.exercise_catalog e
              WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000001')
       OR p.plank_anatomy_digest IS DISTINCT FROM
            (SELECT md5(coalesce(string_agg(m::text, '|' ORDER BY m.muscle), '<none>'))
               FROM public.exercise_catalog_muscles m
               JOIN public.exercise_catalog e ON e.id = m.catalog_id
              WHERE e.logical_id = 'e21b2c00-0000-4000-a000-000000000001')
       OR p.plank_alias_digest IS DISTINCT FROM
            (SELECT md5(coalesce(string_agg(a::text, '|' ORDER BY a.alias), '<none>'))
               FROM public.exercise_catalog_aliases a
              WHERE a.logical_id = 'e21b2c00-0000-4000-a000-000000000001')
       OR p.plank_claims_digest IS DISTINCT FROM
            (SELECT md5(coalesce(string_agg(c::text, '|' ORDER BY c.normalized_name), '<none>'))
               FROM public.exercise_catalog_name_claims c
              WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000001')
       OR p.plank_content_digest IS DISTINCT FROM
            (SELECT md5(string_agg(c::text, '|' ORDER BY c.id))
               FROM public.exercise_catalog_content c
              WHERE c.logical_id = 'e21b2c00-0000-4000-a000-000000000001')
       OR p.expected_rel_digest IS DISTINCT FROM
            (SELECT md5(coalesce(string_agg(x::text, '|' ORDER BY x.relation, x.to_logical_id), '<none>'))
               FROM public.exercise_catalog_content_expected_relationships x)
       OR p.tenant_count IS DISTINCT FROM (SELECT count(*) FROM public.exercises)
       OR p.tenant_digest IS DISTINCT FROM
            (SELECT md5(coalesce(string_agg(t.id::text || t.user_id::text || t.name || t.is_active::text, '|' ORDER BY t.id), '<none>'))
               FROM public.exercises t)) THEN
    RAISE EXCEPTION 'exlib2o load: an untouched surface changed (Plank rows, expected relationships, or tenant exercises); rolling back everything';
  END IF;
  -- the catalog-claim invariant must hold EXACTLY (0/0)
  SELECT orphaned_claims, unclaimed_bearers
    INTO v_orphaned, v_unclaimed FROM public.exlib_verify_catalog_claims();
  IF v_orphaned <> 0 OR v_unclaimed <> 0 THEN
    RAISE EXCEPTION 'exlib2o load: the catalog claims invariant does not hold after the load (orphaned=%, unclaimed=%); rolling back everything', v_orphaned, v_unclaimed;
  END IF;
  -- the loader surface stays locked away from ordinary clients
  IF has_function_privilege('anon', 'public.load_catalog_snapshot(uuid,text,text,text,text,text,text,text,text,text,text,text,text,text,date,text,jsonb,jsonb)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.load_catalog_snapshot(uuid,text,text,text,text,text,text,text,text,text,text,text,text,text,date,text,jsonb,jsonb)', 'EXECUTE')
     OR has_function_privilege('service_role', 'public.load_catalog_snapshot(uuid,text,text,text,text,text,text,text,text,text,text,text,text,text,date,text,jsonb,jsonb)', 'EXECUTE') THEN
    RAISE EXCEPTION 'exlib2o load: the loader function is executable by an ordinary client role; rolling back everything';
  END IF;
END
$post$;

COMMIT;
