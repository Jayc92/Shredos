-- ============================================================
-- EXLIB-3A OPTION B — current-state measurement package
-- STATUS: PREPARED — NOT EXECUTED — NOT AUTHORIZED FOR EXECUTION.
-- READ-ONLY. ONE-USE by authorization (the package itself writes
-- nothing and cannot spend anything in the database).
--
-- WHAT THIS IS: the exact, reviewable SQL for the approved OPTION B
-- disposition of the EXLIB-3A governance proposal — one coherent
-- READ ONLY transaction that measures the CURRENT PERSISTENT
-- DELIVERY STATE and current database posture with exact SQL
-- COUNT(*) instrumentation, and surfaces the COMPLETE result as a
-- SINGLE result set (one SELECT of metric/value rows), so exactly
-- one execution yields every measurement — no second query is ever
-- needed, and the transport's last-result-set behavior cannot drop
-- evidence.
--
-- WHAT THIS MEASURES AND WHAT IT DOES NOT: every value below is a
-- CURRENT-STATE fact. TIMESTAMP PROVENANCE (round-1 corrected):
-- observed_at is PostgreSQL's TRANSACTION-START timestamp returned
-- by now() — temporal context for the measurement, NOT the exact
-- MVCC snapshot-acquisition instant, which this package does not
-- separately surface and which observed_at must never be
-- represented as. The DATA metrics are nonetheless coherent with
-- one another: all fifty are produced by exactly ONE top-level
-- SELECT and therefore share that single statement's MVCC
-- snapshot. Zero
-- provenance-linked rows means no persistent delivery-associated
-- tenant state is present NOW on the measured surfaces — it is NOT
-- proof that deliver_catalog_exercises was never invoked or
-- attempted (the promoted function has lawful idempotent,
-- collision, and skip outcomes that leave no new provenance-linked
-- rows). Nonzero provenance-linked rows means such state exists
-- NOW — never infer who invoked anything, when any state arose, or
-- by which path. Nothing here determines what happened during the
-- historical S5 post-COMMIT observation interval; those gaps
-- remain historical regardless of these results.
--
-- EXECUTION AUTHORITY: may ONLY ever be run against the Supabase
-- project "ShredOS" ref ttybyljytiwntvorugcv, ONLY by Joseph or
-- ChatGPT in the hosted SQL editor as the operator role, and never
-- by Claude and never by any automated pipeline — and ONLY under
-- the operator's explicit one-use OPTION B authorization (the
-- EXLIB-3A proposal's section 16, PREPARED AND UNSENT), which is
-- consumed by the attempt regardless of outcome.
--
-- EXACT-ONCE LAW: execute this file EXACTLY ONCE. If any query or
-- result is blocked, rejected, incomplete, interrupted, or
-- ambiguous: STOP — record the unavailable measurement as a gap;
-- do NOT manually re-run an individual SELECT under the spent
-- authorization; do NOT substitute connector table metadata or
-- live-row estimates for any exact count. A later attempt requires
-- a fresh operator decision and, if these bytes change, fresh
-- review.
--
-- OPERATOR PREFLIGHT (read-only, immediately before execution):
--   1. the SQL editor is connected to ShredOS ttybyljytiwntvorugcv;
--   2. this file's sha256, re-measured at the gate, equals the
--      reviewed fingerprint in the preparation record;
--   3. the target run key below is the reserved
--      exlib2u-plank-release1-staged-v1;
--   4. the one-use OPTION B authorization is unspent.
--   (No hosted backup precondition: this act is SELECT-only inside
--   a READ ONLY transaction and inherits no mutation-only
--   prerequisite.)
--
-- FAIL-CLOSED SHAPE: BEGIN TRANSACTION READ ONLY makes any write
-- attempt — including by any function this package calls — an
-- error that fails the whole package closed. The only function
-- calls are now(), COUNT(*)/aggregate functions, md5, coalesce,
-- and exlib_verify_catalog_claims() — the latter proven from the
-- committed migration bytes to be LANGUAGE sql STABLE with zero
-- mutation statements. No delivery, rollback, or revocation
-- function appears anywhere; no advisory or table lock is taken.
-- ============================================================

BEGIN TRANSACTION READ ONLY;

SELECT m.metric, m.value
FROM (VALUES
  ('package',
   'exlib3a-option-b-current-state-measurement-v1'),
  ('observed_at',
   now()::text),
  ('executor',
   current_user::text),

  -- exact import-run census and the target run row
  ('runs_total',
   (SELECT count(*)::text FROM public.exercise_catalog_import_runs)),
  ('target_run_key',
   'exlib2u-plank-release1-staged-v1'),
  ('target_run_found',
   (SELECT count(*)::text FROM public.exercise_catalog_import_runs r
     WHERE r.run_key = 'exlib2u-plank-release1-staged-v1')),
  ('target_run_id',
   coalesce((SELECT r.id::text FROM public.exercise_catalog_import_runs r
     WHERE r.run_key = 'exlib2u-plank-release1-staged-v1'), '<absent>')),
  ('target_run_created_at',
   coalesce((SELECT r.created_at::text FROM public.exercise_catalog_import_runs r
     WHERE r.run_key = 'exlib2u-plank-release1-staged-v1'), '<absent>')),
  ('target_run_dry_run',
   coalesce((SELECT r.dry_run::text FROM public.exercise_catalog_import_runs r
     WHERE r.run_key = 'exlib2u-plank-release1-staged-v1'), '<absent>')),
  ('target_run_approved_for_delivery',
   coalesce((SELECT r.approved_for_delivery::text FROM public.exercise_catalog_import_runs r
     WHERE r.run_key = 'exlib2u-plank-release1-staged-v1'), '<absent>')),
  ('target_run_sealed_at',
   coalesce((SELECT r.sealed_at::text FROM public.exercise_catalog_import_runs r
     WHERE r.run_key = 'exlib2u-plank-release1-staged-v1'), '<null-or-absent>')),
  ('target_run_revoked_at',
   coalesce((SELECT r.revoked_at::text FROM public.exercise_catalog_import_runs r
     WHERE r.run_key = 'exlib2u-plank-release1-staged-v1'), '<null-or-absent>')),
  ('target_run_started_at',
   coalesce((SELECT r.started_at::text FROM public.exercise_catalog_import_runs r
     WHERE r.run_key = 'exlib2u-plank-release1-staged-v1'), '<null-or-absent>')),
  ('target_run_completed_at',
   coalesce((SELECT r.completed_at::text FROM public.exercise_catalog_import_runs r
     WHERE r.run_key = 'exlib2u-plank-release1-staged-v1'), '<null-or-absent>')),
  ('target_run_result_counts',
   coalesce((SELECT r.result_counts::text FROM public.exercise_catalog_import_runs r
     WHERE r.run_key = 'exlib2u-plank-release1-staged-v1'), '<null-or-absent>')),
  ('target_run_product_approved_by',
   coalesce((SELECT r.product_approved_by FROM public.exercise_catalog_import_runs r
     WHERE r.run_key = 'exlib2u-plank-release1-staged-v1'), '<null-or-absent>')),
  ('target_run_product_approved_at',
   coalesce((SELECT r.product_approved_at::text FROM public.exercise_catalog_import_runs r
     WHERE r.run_key = 'exlib2u-plank-release1-staged-v1'), '<null-or-absent>')),
  ('target_run_legal_approved_by',
   coalesce((SELECT r.legal_approved_by FROM public.exercise_catalog_import_runs r
     WHERE r.run_key = 'exlib2u-plank-release1-staged-v1'), '<null-or-absent>')),
  ('target_run_legal_approved_at',
   coalesce((SELECT r.legal_approved_at::text FROM public.exercise_catalog_import_runs r
     WHERE r.run_key = 'exlib2u-plank-release1-staged-v1'), '<null-or-absent>')),
  ('target_run_approval_rationale_md5',
   coalesce((SELECT md5(r.approval_rationale) FROM public.exercise_catalog_import_runs r
     WHERE r.run_key = 'exlib2u-plank-release1-staged-v1'), '<null-or-absent>')),

  -- exact target-run membership
  ('run_items_total',
   (SELECT count(*)::text FROM public.exercise_catalog_run_items)),
  ('target_run_items',
   (SELECT count(*)::text FROM public.exercise_catalog_run_items ri
     WHERE ri.run_id = (SELECT r.id FROM public.exercise_catalog_import_runs r
       WHERE r.run_key = 'exlib2u-plank-release1-staged-v1'))),
  ('target_run_exercise_members',
   (SELECT count(*)::text FROM public.exercise_catalog_run_items ri
     WHERE ri.catalog_id IS NOT NULL
       AND ri.run_id = (SELECT r.id FROM public.exercise_catalog_import_runs r
         WHERE r.run_key = 'exlib2u-plank-release1-staged-v1'))),
  ('target_run_alias_members',
   (SELECT count(*)::text FROM public.exercise_catalog_run_items ri
     WHERE ri.catalog_alias_id IS NOT NULL
       AND ri.run_id = (SELECT r.id FROM public.exercise_catalog_import_runs r
         WHERE r.run_key = 'exlib2u-plank-release1-staged-v1'))),
  ('items_outside_target_run',
   (SELECT count(*)::text FROM public.exercise_catalog_run_items ri
     WHERE ri.run_id IS DISTINCT FROM (SELECT r.id FROM public.exercise_catalog_import_runs r
       WHERE r.run_key = 'exlib2u-plank-release1-staged-v1'))),
  ('target_run_member_surface',
   coalesce((SELECT string_agg(x.member, '; ' ORDER BY x.member) FROM (
      SELECT 'exercise#' || c.logical_id::text AS member
        FROM public.exercise_catalog_run_items ri
        JOIN public.exercise_catalog c ON c.id = ri.catalog_id
       WHERE ri.run_id = (SELECT r.id FROM public.exercise_catalog_import_runs r
         WHERE r.run_key = 'exlib2u-plank-release1-staged-v1')
      UNION ALL
      SELECT 'alias#' || a.logical_id::text || '#' || a.alias
        FROM public.exercise_catalog_run_items ri
        JOIN public.exercise_catalog_aliases a ON a.id = ri.catalog_alias_id
       WHERE ri.run_id = (SELECT r.id FROM public.exercise_catalog_import_runs r
         WHERE r.run_key = 'exlib2u-plank-release1-staged-v1')
    ) x), '<none>')),

  -- exact CURRENT PERSISTENT delivery-associated tenant state
  ('delivered_exercises_total',
   (SELECT count(*)::text FROM public.exercises e
     WHERE e.import_run_id IS NOT NULL)),
  ('delivered_exercises_target_run',
   (SELECT count(*)::text FROM public.exercises e
     WHERE e.import_run_id = (SELECT r.id FROM public.exercise_catalog_import_runs r
       WHERE r.run_key = 'exlib2u-plank-release1-staged-v1'))),
  ('delivered_aliases_total',
   (SELECT count(*)::text FROM public.exercise_aliases a
     WHERE a.import_run_id IS NOT NULL)),
  ('delivered_aliases_target_run',
   (SELECT count(*)::text FROM public.exercise_aliases a
     WHERE a.import_run_id = (SELECT r.id FROM public.exercise_catalog_import_runs r
       WHERE r.run_key = 'exlib2u-plank-release1-staged-v1'))),

  -- the migration-026 corrected-in-place distinguisher: a P2 Plank
  -- correction UPDATEs an existing tenant row (no count movement)
  -- and records a row here — these three exact counts separate
  -- corrected-in-place state from inserted delivery state
  ('corrections_total',
   (SELECT count(*)::text FROM public.exercise_catalog_corrections)),
  ('delivered_exercises_corrected_in_place',
   (SELECT count(*)::text FROM public.exercises e
     WHERE e.import_run_id IS NOT NULL
       AND EXISTS (SELECT 1 FROM public.exercise_catalog_corrections c
         WHERE c.user_id = e.user_id AND c.exercise_id = e.id))),
  ('delivered_exercises_not_corrected_in_place',
   (SELECT count(*)::text FROM public.exercises e
     WHERE e.import_run_id IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM public.exercise_catalog_corrections c
         WHERE c.user_id = e.user_id AND c.exercise_id = e.id))),

  -- exact current catalog cardinalities (the eleven closed-S5
  -- vector tables) plus the derived vector string
  ('cat_logical',
   (SELECT count(*)::text FROM public.exercise_catalog_logical)),
  ('cat_snapshots',
   (SELECT count(*)::text FROM public.exercise_catalog)),
  ('cat_muscles',
   (SELECT count(*)::text FROM public.exercise_catalog_muscles)),
  ('cat_aliases',
   (SELECT count(*)::text FROM public.exercise_catalog_aliases)),
  ('cat_name_claims',
   (SELECT count(*)::text FROM public.exercise_catalog_name_claims)),
  ('cat_content',
   (SELECT count(*)::text FROM public.exercise_catalog_content)),
  ('cat_expected_relationships',
   (SELECT count(*)::text FROM public.exercise_catalog_content_expected_relationships)),
  ('cat_relationships',
   (SELECT count(*)::text FROM public.exercise_catalog_relationships)),
  ('cat_import_runs',
   (SELECT count(*)::text FROM public.exercise_catalog_import_runs)),
  ('cat_run_items',
   (SELECT count(*)::text FROM public.exercise_catalog_run_items)),
  ('cat_review_events',
   (SELECT count(*)::text FROM public.exercise_catalog_review_events)),
  ('vector_string',
   (SELECT (SELECT count(*) FROM public.exercise_catalog_logical)::text
     ||'/'||(SELECT count(*) FROM public.exercise_catalog)::text
     ||'/'||(SELECT count(*) FROM public.exercise_catalog_muscles)::text
     ||'/'||(SELECT count(*) FROM public.exercise_catalog_aliases)::text
     ||'/'||(SELECT count(*) FROM public.exercise_catalog_name_claims)::text
     ||'/'||(SELECT count(*) FROM public.exercise_catalog_content)::text
     ||'/'||(SELECT count(*) FROM public.exercise_catalog_content_expected_relationships)::text
     ||'/'||(SELECT count(*) FROM public.exercise_catalog_relationships)::text
     ||'/'||(SELECT count(*) FROM public.exercise_catalog_import_runs)::text
     ||'/'||(SELECT count(*) FROM public.exercise_catalog_run_items)::text
     ||'/'||(SELECT count(*) FROM public.exercise_catalog_review_events)::text)),

  -- exact current tenant cardinalities
  ('tenant_exercises',
   (SELECT count(*)::text FROM public.exercises)),
  ('tenant_exercise_aliases',
   (SELECT count(*)::text FROM public.exercise_aliases)),

  -- exact current delivery-predicate count for the reserved run
  ('delivery_predicate_rows',
   (SELECT count(*)::text FROM public.exercise_catalog_import_runs r
     WHERE r.run_key = 'exlib2u-plank-release1-staged-v1'
       AND r.approved_for_delivery = true
       AND r.dry_run = false
       AND r.sealed_at IS NOT NULL
       AND r.revoked_at IS NULL)),

  -- current claims invariant (the committed verification function
  -- is LANGUAGE sql STABLE with zero mutation statements; the READ
  -- ONLY transaction is the enforcement belt)
  ('claims_orphaned',
   (SELECT orphaned_claims::text FROM public.exlib_verify_catalog_claims())),
  ('claims_unclaimed_bearers',
   (SELECT unclaimed_bearers::text FROM public.exlib_verify_catalog_claims()))
) AS m(metric, value);

COMMIT;
