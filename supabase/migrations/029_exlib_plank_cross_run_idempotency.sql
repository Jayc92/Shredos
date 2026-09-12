-- ============================================================
-- ForgeFitOS W14-E — Plank cross-run idempotency
-- 029_exlib_plank_cross_run_idempotency.sql
-- ============================================================
-- STATUS: PREPARED — NOT APPLIED. Hosted application remains
-- Joseph/ChatGPT-only, on the ShredOS project ref ttybyljytiwntvorugcv
-- alone, under its own future one-use instruction with a spent-check
-- first, never by Claude and never by any automated pipeline.
--
-- WHY THIS MIGRATION EXISTS (independent review finding F-E8, adjudicated
-- a CONFIRMED database-contract defect). Migration 026 introduced the
-- shared verified-idempotency helper exlib_plank_link_valid, and migration
-- 028 retained the migration-026 delivery body that calls it from BOTH the
-- ordinary existing-link path and the raced logical-index recovery path.
-- The helper's provenance clause is STRICT to the delivering run:
--
--     AND p_link.import_run_id = p_run_id
--
-- so an otherwise-valid Plank tenant row delivered by the sealed historical
-- run exlib2u-plank-release1-staged-v1 can never validate when a LATER
-- sealed run that carries the same Plank snapshot forward delivers, and the
-- existing-link path raises "inconsistent prior Plank reconciliation
-- requires separate investigation" — so every user who already received
-- the plank release fails initialization against a cumulative run, on every
-- request. The cumulative-run release design is approved; the contract is
-- what must change, at the database layer.
--
-- WHAT THIS MIGRATION DOES — and everything it refuses to do:
--   - EXACTLY ONE statement of effect: CREATE OR REPLACE FUNCTION
--     exlib_plank_link_valid with the EXISTING signature unchanged
--     (UUID, public.exercises, UUID, UUID, TEXT, UUID) RETURNS BOOLEAN,
--     VOLATILE, SECURITY DEFINER, search_path = public, pg_temp. CREATE OR
--     REPLACE preserves the function's existing ACL; the REVOKE below
--     re-asserts the internal-only posture explicitly rather than relying
--     on that.
--   - EVERY non-provenance invariant is carried VERBATIM: user ownership,
--     tracking_mode = 'timed', exercise_type = 'mobility', EXACT catalog_id,
--     EXACT catalog_logical_id, exact anatomy equality (child rows locked
--     parent-first then in primary-key order, exactly as before), and the
--     exact canonical / "(timed)" name posture with exercise_name_claims
--     ownership.
--   - ONLY the provenance clause changes. NEW RULE: the linked row is valid
--     when EITHER its import_run_id is THIS delivering run (the unchanged
--     current-run behaviour), OR its import_run_id identifies a PRIOR
--     legitimate catalog delivery run that exists, is approved_for_delivery,
--     is not a dry run, is sealed, is not revoked, AND carries an
--     exercise_catalog_run_items row for EXACTLY p_cat_id — the exact
--     catalog snapshot is the compatibility boundary. A prior run that
--     merely carries a DIFFERENT snapshot of the same logical identity
--     does NOT qualify. A NULL import_run_id is refused EXPLICITLY (FALSE,
--     never an unknown): under 026 a NULL compared unknown and only the
--     caller's IF made it fail closed.
--   - NOTHING is mutated by validation or delivery: p_link.import_run_id
--     keeps its original run as historical provenance, and
--     exercise_catalog_corrections provenance is untouched.
--   - NO second delivery entrypoint. deliver_catalog_exercises (migration
--     028's definition) is NOT redefined: both of its call sites gain the
--     new behaviour solely through this shared helper, which is the
--     migration-026 design ("ONE validation shape used by BOTH paths so
--     the two can never drift").
--   - NO table, column, index, trigger, policy, role or grant is created,
--     altered or dropped. NO catalog, content, run, membership, tenant or
--     seed row changes. Locking order is unchanged: the helper still locks
--     ONLY the caller-owned anatomy rows (the caller has already locked the
--     parent exercises row FOR UPDATE); the new prior-run lookup is a plain
--     read of exercise_catalog_import_runs and exercise_catalog_run_items,
--     takes no row lock, and introduces no new lock domain.
--
-- FAIL-CLOSED POSTURES THIS RULE STILL REJECTS (proven by
-- scripts/verify-weight-time-migration-029-live.sh): a nonexistent run, an
-- unapproved run, a dry run, an unsealed run, a revoked run, an unrelated
-- sealed run that lacks the exact p_cat_id membership, and a sealed run
-- carrying only a DIFFERENT catalog snapshot of the same Plank logical
-- identity; plus every retained non-provenance failure (anatomy, mode,
-- exercise_type, catalog_id, logical_id, name/claim). The relaxation is
-- exact, not a blanket "any prior run" allowance.
--
-- HOSTED ORDER DEPENDENCY: this migration must be live and verified BEFORE
-- the delivery run key is repointed to any run that carries the Plank
-- snapshot forward and BEFORE any user receives such a run. It is NOT a
-- precondition of catalog snapshot review, content review, admission,
-- publication, run staging or sealing (none of them call the helper).
--
-- ONE explicit top-level transaction encloses every executable statement
-- (the same atomic-install rule as migrations 023-028). If the transport or
-- result of the hosted apply is ever ambiguous, READ STATE FIRST: the
-- helper either contains the prior-run clause or it does not; never re-run
-- blind.
-- ============================================================
BEGIN;

CREATE OR REPLACE FUNCTION exlib_plank_link_valid(
  p_uid       UUID,
  p_link      public.exercises,
  p_cat_id    UUID,
  p_logical   UUID,
  p_canonical TEXT,
  p_run_id    UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $helper$
DECLARE
  v_row_anat TEXT;
  v_cat_anat TEXT;
BEGIN
  -- EXLIB-2E (review 2) locking contract, carried verbatim from migration
  -- 026: the CALLER has already locked the parent exercises row FOR UPDATE;
  -- lock the child anatomy rows here, parent-first then children in
  -- deterministic primary-key order, BEFORE reading the signature.
  PERFORM 1 FROM public.exercise_muscles m
  WHERE m.user_id = p_uid AND m.exercise_id = p_link.id
  ORDER BY m.id
  FOR UPDATE;
  SELECT COALESCE(string_agg(m.muscle || ':' || m.role, ',' ORDER BY m.muscle, m.role), '')
    INTO v_row_anat FROM public.exercise_muscles m
    WHERE m.user_id = p_uid AND m.exercise_id = p_link.id;
  SELECT COALESCE(string_agg(m.muscle || ':' || m.role, ',' ORDER BY m.muscle, m.role), '')
    INTO v_cat_anat FROM public.exercise_catalog_muscles m
    WHERE m.catalog_id = p_cat_id;
  RETURN p_link.user_id = p_uid
    AND p_link.tracking_mode = 'timed'
    AND p_link.exercise_type = 'mobility'
    AND p_link.catalog_id = p_cat_id
    AND p_link.catalog_logical_id = p_logical
    -- W14-E migration 029 (finding F-E8): provenance is satisfied by THIS
    -- delivering run (unchanged), OR by a PRIOR legitimate run that is
    -- approved, non-dry, sealed, unrevoked AND carries EXACTLY this catalog
    -- snapshot in its membership. The exact snapshot is the compatibility
    -- boundary; a different snapshot of the same logical identity, and any
    -- run failing the authorized-run posture, never qualifies.
    AND p_link.import_run_id IS NOT NULL
    AND (
      p_link.import_run_id = p_run_id
      OR EXISTS (
        SELECT 1
        FROM public.exercise_catalog_import_runs pr
        JOIN public.exercise_catalog_run_items pri ON pri.run_id = pr.id
        WHERE pr.id = p_link.import_run_id
          AND pr.approved_for_delivery = true
          AND pr.dry_run = false
          AND pr.sealed_at IS NOT NULL
          AND pr.revoked_at IS NULL
          AND pri.catalog_id = p_cat_id
      )
    )
    AND v_row_anat = v_cat_anat
    AND (
      (lower(p_link.name) = lower(p_canonical)
       AND EXISTS (SELECT 1 FROM public.exercise_name_claims n
                   WHERE n.user_id = p_uid
                     AND n.normalized_name = lower(p_canonical)
                     AND n.claim_source = 'exercise'
                     AND n.exercise_id = p_link.id))
      OR
      (lower(p_link.name) = lower(p_canonical || ' (timed)')
       AND EXISTS (SELECT 1 FROM public.exercise_name_claims n
                   WHERE n.user_id = p_uid
                     AND n.normalized_name = lower(p_canonical || ' (timed)')
                     AND n.claim_source = 'exercise'
                     AND n.exercise_id = p_link.id))
    );
END;
$helper$;

-- Internal helper only: client execution posture unchanged (re-asserted).
REVOKE ALL ON FUNCTION exlib_plank_link_valid(UUID, public.exercises, UUID, UUID, TEXT, UUID)
  FROM PUBLIC, anon, authenticated;

COMMIT;

-- ── Rollback boundary (documentation) ────────────────────────────
-- Re-applying migration 026's exlib_plank_link_valid body (lines 79-139 of
-- that file) restores the strict current-run rule. No other object changed.
