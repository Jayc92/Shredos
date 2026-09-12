-- ============================================================
-- W14-E READ-STATE PROBE - READ ONLY - the "READ STATE FIRST" instrument.
--
-- Run this BEFORE any stage package (the spent-check) and AFTER any execution
-- whose transport or result was ambiguous (a dropped connection, a timeout, an
-- unreadable error). It performs NO write of any kind: the transaction is
-- declared READ ONLY, so an accidental write statement would abort, and it ends
-- in ROLLBACK. Safe to run any number of times.
--
-- Output: one row per lifecycle stage with a classification:
--   NOT_APPLIED  the stage has not run - it is the next lawful act only if
--                every EARLIER stage reads APPLIED
--   APPLIED      the stage has run and is SPENT - never run its package again
--   MIXED        an impossible-by-design partial state - STOP, do not run any
--                package, report the exact rows; a retry will not fix it
--   ABSENT       (stage 7 only) no five-entry run exists yet
-- plus the eleven-term catalog vector, the new cumulative run's posture, and the
-- migration-029 spent-check (APPLIED / NOT_APPLIED / MIXED) read from the live helper (the historical
-- plank run's six members carried forward plus the five: 8 exercise + 3 alias members).
--
-- Hosted execution of this probe is READ ONLY and is still an operator act
-- (Joseph/ChatGPT) on ShredOS; Claude never runs it hosted. The disposable
-- proof runs it locally and checks each classification against a known state.
-- ============================================================
BEGIN;
SET TRANSACTION READ ONLY;

WITH five AS (
  SELECT unnest(ARRAY[
    'e21b2c00-0000-4000-a000-000000000004',
    'e21b2c00-0000-4000-a000-000000000005',
    'e21b2c00-0000-4000-a000-000000000006',
    'e21b2c00-0000-4000-a000-000000000007',
    'e21b2c00-0000-4000-a000-000000000008']::uuid[]) AS logical_id
),
snap AS (
  SELECT count(*) FILTER (WHERE c.review_status = 'approved') AS approved,
         count(*) FILTER (WHERE c.review_status = 'pending')  AS pending,
         count(*) AS total
    FROM public.exercise_catalog c JOIN five f ON f.logical_id = c.logical_id
   WHERE c.is_active = true
),
ev AS (
  SELECT count(*) AS events
    FROM public.exercise_catalog_review_events e
    JOIN public.exercise_catalog c ON c.id = e.catalog_id
    JOIN five f ON f.logical_id = c.logical_id
),
con AS (
  SELECT count(*) AS rows_total,
         count(*) FILTER (WHERE c.content_status = 'pending')       AS pending,
         count(*) FILTER (WHERE c.content_status = 'approved')      AS approved,
         count(*) FILTER (WHERE c.import_admitted)                  AS admitted,
         count(*) FILTER (WHERE c.publication_status = 'published') AS published
    FROM public.exercise_catalog_content c JOIN five f ON f.logical_id = c.logical_id
),
runs AS (
  SELECT r.run_key, r.approved_for_delivery, r.dry_run, r.sealed_at, r.revoked_at,
         (SELECT count(*) FROM public.exercise_catalog_run_items ri WHERE ri.run_id = r.id AND ri.catalog_id IS NOT NULL) AS exercise_members,
         (SELECT count(*) FROM public.exercise_catalog_run_items ri WHERE ri.run_id = r.id AND ri.catalog_alias_id IS NOT NULL) AS alias_members,
         (SELECT count(*) FROM public.exercise_catalog_run_items ri
            JOIN public.exercise_catalog c ON c.id = ri.catalog_id
            JOIN five f ON f.logical_id = c.logical_id
           WHERE ri.run_id = r.id) AS five_members
    FROM public.exercise_catalog_import_runs r
   WHERE r.run_key <> 'exlib2u-plank-release1-staged-v1'
),
classify AS (
  SELECT 1 AS stage, 'snapshot_review' AS name,
         CASE WHEN (SELECT approved FROM snap) = 5 AND (SELECT events FROM ev) = 5 THEN 'APPLIED'
              WHEN (SELECT approved FROM snap) = 0 AND (SELECT pending FROM snap) = 5 AND (SELECT events FROM ev) = 0 THEN 'NOT_APPLIED'
              ELSE 'MIXED' END AS state,
         'approved=' || (SELECT approved FROM snap) || ' pending=' || (SELECT pending FROM snap) || ' active_total=' || (SELECT total FROM snap) || ' events=' || (SELECT events FROM ev) AS detail
  UNION ALL
  SELECT 2, 'content_draft',
         CASE WHEN (SELECT rows_total FROM con) = 5 THEN 'APPLIED'
              WHEN (SELECT rows_total FROM con) = 0 THEN 'NOT_APPLIED'
              ELSE 'MIXED' END,
         'content_rows=' || (SELECT rows_total FROM con)
  UNION ALL
  SELECT 3, 'content_review',
         CASE WHEN (SELECT rows_total FROM con) = 5 AND (SELECT approved FROM con) = 5 THEN 'APPLIED'
              WHEN (SELECT rows_total FROM con) = 0 OR ((SELECT rows_total FROM con) = 5 AND (SELECT pending FROM con) = 5) THEN 'NOT_APPLIED'
              ELSE 'MIXED' END,
         'approved=' || (SELECT approved FROM con) || ' pending=' || (SELECT pending FROM con)
  UNION ALL
  SELECT 4, 'content_admission',
         CASE WHEN (SELECT rows_total FROM con) = 5 AND (SELECT admitted FROM con) = 5 THEN 'APPLIED'
              WHEN (SELECT admitted FROM con) = 0 THEN 'NOT_APPLIED'
              ELSE 'MIXED' END,
         'admitted=' || (SELECT admitted FROM con)
  UNION ALL
  SELECT 5, 'content_publication',
         CASE WHEN (SELECT rows_total FROM con) = 5 AND (SELECT published FROM con) = 5 THEN 'APPLIED'
              WHEN (SELECT published FROM con) = 0 THEN 'NOT_APPLIED'
              ELSE 'MIXED' END,
         'published=' || (SELECT published FROM con)
  UNION ALL
  SELECT 6, 'run_staging',
         CASE WHEN (SELECT count(*) FROM runs) = 0 THEN 'NOT_APPLIED'
              WHEN (SELECT count(*) FROM runs) = 1 AND (SELECT five_members FROM runs) = 5 AND (SELECT exercise_members FROM runs) = 8 AND (SELECT alias_members FROM runs) = 3 THEN 'APPLIED'
              ELSE 'MIXED' END,
         'non_plank_runs=' || (SELECT count(*) FROM runs) || ' keys=' || coalesce((SELECT string_agg(run_key, ',' ORDER BY run_key) FROM runs), '<none>')
           || ' members=' || coalesce((SELECT string_agg(exercise_members::text || '+' || alias_members::text || ' (five=' || five_members::text || ')', ',' ORDER BY run_key) FROM runs), '<none>')
  UNION ALL
  SELECT 7, 'run_seal',
         CASE WHEN (SELECT count(*) FROM runs) = 0 THEN 'ABSENT'
              WHEN (SELECT count(*) FROM runs) = 1 AND (SELECT sealed_at IS NOT NULL AND approved_for_delivery AND NOT dry_run AND revoked_at IS NULL FROM runs) THEN 'APPLIED'
              WHEN (SELECT count(*) FROM runs) = 1 AND (SELECT sealed_at IS NULL AND NOT approved_for_delivery AND NOT dry_run AND revoked_at IS NULL FROM runs) THEN 'NOT_APPLIED'
              ELSE 'MIXED' END,
         coalesce((SELECT string_agg(run_key || ' approved=' || approved_for_delivery::text || ' sealed=' || (sealed_at IS NOT NULL)::text || ' revoked=' || (revoked_at IS NOT NULL)::text, ',' ORDER BY run_key) FROM runs), '<none>')
)
SELECT stage, name, state, detail FROM classify
UNION ALL
SELECT 0, 'catalog_vector', 'INFO',
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
UNION ALL
SELECT 0, 'migration_029_plank_cross_run_idempotency',
       CASE WHEN pg_get_functiondef('public.exlib_plank_link_valid(uuid,public.exercises,uuid,uuid,text,uuid)'::regprocedure) LIKE '%pri.catalog_id = p_cat_id%'
                 AND pg_get_functiondef('public.exlib_plank_link_valid(uuid,public.exercises,uuid,uuid,text,uuid)'::regprocedure) LIKE '%pr.revoked_at IS NULL%' THEN 'APPLIED'
            WHEN pg_get_functiondef('public.exlib_plank_link_valid(uuid,public.exercises,uuid,uuid,text,uuid)'::regprocedure) LIKE '%AND p_link.import_run_id = p_run_id%' THEN 'NOT_APPLIED'
            ELSE 'MIXED' END,
       'the shared Plank link validator: APPLIED = carries the prior-run exact-snapshot clause (029); NOT_APPLIED = the strict current-run clause (026/028); MIXED = neither shape - STOP. 029 must read APPLIED before the run key is repointed to a Plank-carrying run.'
UNION ALL
SELECT 0, 'historical_plank_run', 'INFO',
       coalesce((SELECT r.run_key || ' approved=' || r.approved_for_delivery::text || ' sealed=' || (r.sealed_at IS NOT NULL)::text
                         || ' revoked=' || (r.revoked_at IS NOT NULL)::text
                         || ' items=' || (SELECT count(*) FROM public.exercise_catalog_run_items ri WHERE ri.run_id = r.id)::text
                   FROM public.exercise_catalog_import_runs r WHERE r.run_key = 'exlib2u-plank-release1-staged-v1'), '<absent>')
UNION ALL
SELECT 0, 'authority_baseline', 'INFO',
       coalesce((SELECT string_agg(g.rolname || '>' || m.rolname || '@' || gr.rolname || ':' || am.admin_option::text || ':' || am.inherit_option::text || ':' || am.set_option::text, ' ' ORDER BY g.rolname, m.rolname, gr.rolname)
                   FROM pg_catalog.pg_auth_members am
                   JOIN pg_roles g ON g.oid = am.roleid JOIN pg_roles m ON m.oid = am.member JOIN pg_roles gr ON gr.oid = am.grantor
                  WHERE g.rolname IN ('exlib_catalog_loader','exlib_catalog_reviewer','exlib_catalog_admission','exlib_catalog_admin')), '<none>')
ORDER BY 1, 2;

ROLLBACK;
