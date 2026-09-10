-- ============================================================
-- 028_weight_time_tracking_mode.sql
-- weight_time tracking mode — the coordinated DATABASE changes (W6)
--
-- Plan:   docs/weight-time-coordinated-implementation-plan.md
--         (revision 3, operator-approved 2026-09-09; sections 5.4, 8.6,
--         8.9, 8.10, 10)
-- Names:  docs/weight-time-w2-installed-constraint-names.md
--         (installed constraint identities, derived mechanically on a
--         disposable database from the committed migrations 001-027)
-- Proof:  scripts/verify-weight-time-contract-live.sh
--         (disposable-DB contract, legacy-mode regression, guard matrix,
--         BOTH concurrency interleavings with two real sessions,
--         structure readback, atomicity, classified negative controls)
--
-- STATUS: LOCAL-ONLY. This file is NOT APPLIED to any hosted project by
-- the commit that adds it. Hosted application remains Joseph/ChatGPT-only,
-- on the ShredOS project alone, under its own future explicit instruction
-- (plan section 16, W13). The hosted boundary at authoring time is
-- migrations 001-027 (docs/exlib2m-migration-027-application-record.md).
--
-- CONTENTS — exactly the operator-confirmed scope, nothing else:
--   A. widen BOTH tracking_mode CHECKs to admit 'weight_time', dropping
--      and re-adding them under their INSTALLED names
--      (exercises_tracking_mode_check, exercise_catalog_tracking_mode_check).
--      Migrations 010 and 023 are not modified in place.
--   B. CREATE OR REPLACE append_workout_set with an explicit weight_time
--      branch and a MODE-AWARE weight lower bound: 0 is a legal weight_time
--      load; a negative weight always rejects; every shipped mode keeps its
--      exact current rules (weight_reps/bodyweight still reject 0).
--   C. the tracking-mode HISTORY GUARD (plan section 5, O8 option (b)): a
--      BEFORE UPDATE OF tracking_mode trigger on exercises rejects a mode
--      change while ANY current workout_sets row references the exercise,
--      with the controlled error token tracking_mode_has_workout_history.
--      The database is the integrity boundary; the route precheck is UX.
--   D. CREATE OR REPLACE deliver_catalog_exercises so BOTH legacy
--      classification CASE sites carry an EXPLICIT
--      WHEN 'weight_time' THEN 'strength' arm (Decision 3). The body is
--      migration 026's definition (lines 146-623) with exactly those two
--      lines added — generated mechanically, verified by diff.
--   E. nothing else: no new workout_sets column, no combined score, no
--      carry support, no history/audit table, no catalog admission, no
--      content-lifecycle mutation. Migration 027 is untouched.
--
-- ROLLBACK POSTURE: reversible only while ZERO exercises carry
-- tracking_mode = 'weight_time' (drop the trigger, restore the two
-- function bodies from 021/026, re-narrow the CHECKs). After first
-- adoption, contracting the CHECK would fail or destroy data: fix
-- FORWARD, never contract.
--
-- ATOMICITY: one transaction — every statement below lands or none does
-- (proven by the suite's sabotaged-constraint arm).
-- ============================================================

BEGIN;

-- ── A. Tracking-mode vocabulary: both CHECKs, by their installed names,
--      re-added under the same names so nothing later must rediscover them ──

ALTER TABLE public.exercises
  DROP CONSTRAINT exercises_tracking_mode_check;
ALTER TABLE public.exercises
  ADD CONSTRAINT exercises_tracking_mode_check
  CHECK (tracking_mode IN ('weight_reps', 'bodyweight', 'cardio', 'timed', 'weight_time'));

ALTER TABLE public.exercise_catalog
  DROP CONSTRAINT exercise_catalog_tracking_mode_check;
ALTER TABLE public.exercise_catalog
  ADD CONSTRAINT exercise_catalog_tracking_mode_check
  CHECK (tracking_mode IN ('weight_reps', 'bodyweight', 'cardio', 'timed', 'weight_time'));

-- ── B. append_workout_set: the weight_time contract and a mode-aware
--      weight lower bound. Everything not marked "028:" is migration
--      021's text, unchanged. ──

CREATE OR REPLACE FUNCTION append_workout_set(
  p_workout_exercise_id UUID,
  p_reps             SMALLINT DEFAULT NULL,
  p_weight_kg        NUMERIC  DEFAULT NULL,
  p_rpe              NUMERIC  DEFAULT NULL,
  p_duration_seconds INTEGER  DEFAULT NULL,
  p_distance_meters  NUMERIC  DEFAULT NULL,
  p_completed        BOOLEAN  DEFAULT false,
  p_is_warmup        BOOLEAN  DEFAULT false,
  p_notes            TEXT     DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_uid            UUID;
  v_session_id     UUID;
  v_exercise_ref   UUID;
  v_session_status TEXT;
  v_tracking_mode  TEXT;
  v_completed      BOOLEAN;
  v_is_warmup      BOOLEAN;
  v_next_number    INTEGER;
  v_row            workout_sets%ROWTYPE;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF p_workout_exercise_id IS NULL THEN
    RAISE EXCEPTION 'invalid_input';
  END IF;

  -- Resolve the lock DOMAIN only: session id + exercise reference,
  -- restricted to the caller's own rows. NOTHING here is trusted for
  -- authorization or validation — session status and tracking mode
  -- are both mutable and are re-read below under row locks.
  SELECT ws.id, we.exercise_id
  INTO v_session_id, v_exercise_ref
  FROM workout_exercises we
  JOIN workout_sessions ws ON ws.id = we.workout_session_id
  WHERE we.id = p_workout_exercise_id AND ws.user_id = v_uid;

  IF v_session_id IS NULL THEN
    RAISE EXCEPTION 'not_found';
  END IF;

  v_completed := COALESCE(p_completed, false);
  v_is_warmup := COALESCE(p_is_warmup, false);

  -- Mode-INDEPENDENT type/range validation may run pre-lock (cheap
  -- rejection; nulls stay null — never coerced to zero). Every
  -- mode-DEPENDENT rule waits for the locked tracking-mode read.
  -- 028: the weight LOWER bound is mode-dependent now (0 is a legal
  -- weight_time load), so only its mode-independent parts stay here:
  -- a NEGATIVE weight always rejects, and the 1000 kg ceiling holds for
  -- every mode. Migration 021's `<= 0` rule moves below the locked
  -- read, scoped to exactly the modes it always governed.
  IF (p_reps IS NOT NULL AND (p_reps < 0 OR p_reps > 1000))
     OR (p_rpe IS NOT NULL AND (p_rpe < 1 OR p_rpe > 10))
     OR (p_weight_kg IS NOT NULL AND (p_weight_kg < 0 OR p_weight_kg > 1000))
     OR (p_duration_seconds IS NOT NULL AND (p_duration_seconds < 0 OR p_duration_seconds > 86400))
     OR (p_distance_meters IS NOT NULL AND (p_distance_meters < 0 OR p_distance_meters > 1000000))
     OR (p_notes IS NOT NULL AND length(p_notes) > 10000)
  THEN
    RAISE EXCEPTION 'invalid_input';
  END IF;

  -- The SAME lock delete_workout_set_and_resequence takes: numbering
  -- is decided only inside this boundary, so add-after-delete always
  -- continues the contiguous sequence (1,2 then Add gives 1,2,3) and
  -- concurrent operations cannot duplicate or gap numbers. Lock
  -- order: advisory first, then the session row, then the exercise
  -- row — identical everywhere in this migration.
  PERFORM pg_advisory_xact_lock(
    hashtext('workout_set_numbering'),
    hashtext(p_workout_exercise_id::text)
  );

  -- CONCURRENCY REVIEW: authoritative completed check on the LOCKED
  -- session row. Completion's UPDATE of this row conflicts with FOR
  -- UPDATE: if completion committed first we observe 'completed'
  -- here and reject; if we lock first, completion waits for this
  -- insert to commit. Never decided on the initial lookup.
  SELECT ws.status INTO v_session_status
  FROM workout_sessions ws
  WHERE ws.id = v_session_id AND ws.user_id = v_uid
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found';
  END IF;
  IF v_session_status = 'completed' THEN
    RAISE EXCEPTION 'workout_completed';
  END IF;

  -- TRACKING-MODE RACE (final review): tracking_mode is MUTABLE — the
  -- exercises PATCH route supports changing it after use, and RLS +
  -- the authenticated UPDATE grant let a direct Data API caller
  -- change it too (every exercise row, including seeded defaults, is
  -- a per-user row owned by the caller, so this lock is always
  -- permitted). Read the AUTHORITATIVE mode under FOR UPDATE: a
  -- tracking-mode UPDATE conflicts with this lock, so if the edit
  -- committed first we validate against the NEW mode; if we lock
  -- first, the edit waits until this insert commits. The row stays
  -- locked through the INSERT, so no payload valid only for the old
  -- mode can ever commit against the new mode. Lock order: advisory,
  -- then session row, then exercise row — consistent everywhere; no
  -- other function in this migration locks exercises rows, and the
  -- exercise-edit path takes only this single row lock, so no cycle
  -- exists.
  -- 028: the exercise-edit path now also runs the history-guard trigger
  -- (section C) INSIDE its row lock; the trigger reads workout_sets and
  -- workout_exercises only, takes no additional locks, and therefore
  -- introduces no cycle. Interleaving A (edit locks first) and B (this
  -- function locks first) are both exercised by the contract suite.
  SELECT e.tracking_mode INTO v_tracking_mode
  FROM exercises e
  WHERE e.id = v_exercise_ref AND e.user_id = v_uid
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found';
  END IF;

  -- Per-mode field gating — identical to the route's contract,
  -- strictly AFTER the authoritative locked mode read.
  IF v_tracking_mode IN ('weight_reps', 'bodyweight') THEN
    IF p_duration_seconds IS NOT NULL OR p_distance_meters IS NOT NULL THEN
      RAISE EXCEPTION 'invalid_input';
    END IF;
    -- 028: migration 021's pre-lock `p_weight_kg <= 0` rule, preserved
    -- for exactly the modes it always governed. Zero is NOT a legal
    -- weight_reps/bodyweight load — "no added weight" is NULL, never 0.
    IF p_weight_kg IS NOT NULL AND p_weight_kg <= 0 THEN
      RAISE EXCEPTION 'invalid_input';
    END IF;
  ELSIF v_tracking_mode = 'cardio' THEN
    IF p_reps IS NOT NULL OR p_weight_kg IS NOT NULL OR p_rpe IS NOT NULL
       OR v_is_warmup THEN
      RAISE EXCEPTION 'invalid_input';
    END IF;
  ELSIF v_tracking_mode = 'timed' THEN
    IF p_reps IS NOT NULL OR p_weight_kg IS NOT NULL
       OR p_distance_meters IS NOT NULL OR v_is_warmup THEN
      RAISE EXCEPTION 'invalid_input';
    END IF;
  ELSIF v_tracking_mode = 'weight_time' THEN
    -- 028 (Decisions 1, 2, 5 — EXLIB-1C0B4/B5, CLOSED): a weighted hold.
    -- weight_kg is the ADDED load (0 is a legal, intentional baseline);
    -- duration_seconds is the hold. rpe and is_warmup are PERMITTED
    -- (unlike cardio/timed); reps and distance_meters are FORBIDDEN.
    IF p_reps IS NOT NULL OR p_distance_meters IS NOT NULL THEN
      RAISE EXCEPTION 'invalid_input';
    END IF;
  ELSE
    RAISE EXCEPTION 'invalid_input';
  END IF;

  -- Per-mode completion requirements — identical to the route.
  IF v_completed THEN
    IF v_tracking_mode = 'bodyweight' AND NOT v_is_warmup AND p_reps IS NULL THEN
      RAISE EXCEPTION 'invalid_input';
    END IF;
    IF v_tracking_mode IN ('cardio', 'timed')
       AND (p_duration_seconds IS NULL OR p_duration_seconds <= 0) THEN
      RAISE EXCEPTION 'invalid_input';
    END IF;
    -- 028 (Decision 2): a completed weight_time set requires BOTH a
    -- weight (0 is legal; NULL is not zero) AND a duration > 0. A
    -- warmup does not waive this (Decision 5).
    IF v_tracking_mode = 'weight_time'
       AND (p_weight_kg IS NULL OR p_duration_seconds IS NULL OR p_duration_seconds <= 0) THEN
      RAISE EXCEPTION 'invalid_input';
    END IF;
  END IF;

  SELECT COALESCE(MAX(s.set_number), 0) + 1
  INTO v_next_number
  FROM workout_sets s
  WHERE s.workout_exercise_id = p_workout_exercise_id;

  -- Identity and numbering are server-controlled; only the validated
  -- typed values above can ever be written.
  INSERT INTO workout_sets (
    workout_exercise_id, set_number,
    reps, weight_kg, rpe,
    duration_seconds, distance_meters,
    completed, is_warmup, notes
  ) VALUES (
    p_workout_exercise_id, v_next_number,
    p_reps, p_weight_kg, p_rpe,
    p_duration_seconds, p_distance_meters,
    v_completed, v_is_warmup, p_notes
  )
  RETURNING * INTO v_row;

  RETURN to_jsonb(v_row);
END;
$$;

COMMENT ON FUNCTION append_workout_set(UUID, SMALLINT, NUMERIC, NUMERIC, INTEGER, NUMERIC, BOOLEAN, BOOLEAN, TEXT) IS
  'UI-5B1B: appends one set with a server-computed contiguous set_number under the same per-exercise advisory lock as delete_workout_set_and_resequence. Fully self-validating for direct authenticated RPC calls: ownership, completed lock, server-derived tracking mode, per-mode field gating, and type/range checks all live in the function body. 028: explicit weight_time branch (weight 0 legal, duration > 0 to complete, rpe/warmup permitted, reps/distance forbidden); the weight lower bound is mode-aware after the locked mode read.';

REVOKE ALL ON FUNCTION append_workout_set(UUID, SMALLINT, NUMERIC, NUMERIC, INTEGER, NUMERIC, BOOLEAN, BOOLEAN, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION append_workout_set(UUID, SMALLINT, NUMERIC, NUMERIC, INTEGER, NUMERIC, BOOLEAN, BOOLEAN, TEXT) TO authenticated;

-- ── C. Tracking-mode HISTORY GUARD (plan section 5, O8 option (b)) ──
-- The database is the integrity boundary. The rule is EXTANT SETS, not
-- "ever had history": draft sets can be deleted and a mistaken mode then
-- corrected; completed workout history is read-only and so stays present,
-- blocking the change permanently. No history table or column is needed.

CREATE OR REPLACE FUNCTION public.exercises_guard_tracking_mode_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- The trigger's WHEN clause already restricts this to a REAL change
  -- (OLD.tracking_mode IS DISTINCT FROM NEW.tracking_mode); same-mode
  -- and unrelated-field updates never reach here.
  --
  -- SECURITY DEFINER, deliberately: the question is whether ANY current
  -- workout_sets row references this exercise, and row-level security on
  -- workout_sets must never be able to hide such a row from this check.
  -- Minimum surface: read-only, no parameters, not callable as an RPC
  -- (EXECUTE revoked below), fixed search_path.
  IF EXISTS (
    SELECT 1
    FROM public.workout_sets ws
    JOIN public.workout_exercises we ON we.id = ws.workout_exercise_id
    WHERE we.exercise_id = OLD.id
  ) THEN
    RAISE EXCEPTION 'tracking_mode_has_workout_history';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.exercises_guard_tracking_mode_history() FROM PUBLIC, anon, authenticated, service_role;

CREATE TRIGGER exercises_tracking_mode_history_guard
  BEFORE UPDATE OF tracking_mode ON public.exercises
  FOR EACH ROW
  WHEN (OLD.tracking_mode IS DISTINCT FROM NEW.tracking_mode)
  EXECUTE FUNCTION public.exercises_guard_tracking_mode_history();

-- ── D. deliver_catalog_exercises: migration 026's definition (lines
--      146-623) with EXACTLY two lines added — one explicit
--      WHEN 'weight_time' THEN 'strength' arm in each legacy-
--      classification CASE (Decision 3). Generated mechanically from 026
--      and verified by diff; every other line is byte-identical, and the
--      function's existing authority (023) is preserved by CREATE OR
--      REPLACE. The ELSE 'strength' catch-alls remain for genuinely
--      unknown values — they are no longer what maps weight_time. ──

CREATE OR REPLACE FUNCTION deliver_catalog_exercises(p_run_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid               UUID := auth.uid();
  v_run               public.exercise_catalog_import_runs%ROWTYPE;
  v_cat               RECORD;
  v_alias             RECORD;
  v_new_id            UUID;
  v_target_id         UUID;
  v_target_active     BOOLEAN;
  v_constraint        TEXT;
  v_eligible          INTEGER := 0;
  v_inserted          INTEGER := 0;
  v_skipped_existing  INTEGER := 0;
  v_skipped_collision INTEGER := 0;
  v_alias_inserted    INTEGER := 0;
  v_alias_added_existing   INTEGER := 0;
  v_alias_already_delivered INTEGER := 0;
  v_alias_no_exercise       INTEGER := 0;
  v_alias_skipped_inactive  INTEGER := 0;
  v_alias_skipped     INTEGER := 0;
  v_inserted_logical  UUID[]  := '{}';
  v_collision_names   TEXT[]  := '{}';
  -- EXLIB-2D (proposed migration 026): Plank reconciliation state.
  v_plank_logical     UUID;
  v_plank_disposition TEXT    := 'not_in_run';
  v_plank_name        TEXT;
  v_linked            public.exercises%ROWTYPE;
  v_seed              public.exercises%ROWTYPE;
  v_seed_found        BOOLEAN := false;
  v_p2_ok             BOOLEAN := false;
  v_row_anat          TEXT;
  v_cat_anat          TEXT;
  v_claim_source      TEXT;
  v_claim_exercise    UUID;
  v_snap_mode         TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'deliver_catalog_exercises: not authenticated';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_uid::text, 8231));

  -- Revision F, finding 1: delivery requires the PERMANENT seal and
  -- refuses revoked runs. sealed_at/approved_for_delivery are frozen
  -- after sealing and membership is permanently frozen, so the set
  -- this gate admits was fixed at the moment of approval.
  SELECT * INTO v_run
  FROM public.exercise_catalog_import_runs
  WHERE run_key = p_run_key
    AND approved_for_delivery = true
    AND dry_run = false
    AND sealed_at IS NOT NULL
    AND revoked_at IS NULL;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'deliver_catalog_exercises: no sealed, approved, unrevoked delivery run for this key';
  END IF;

  -- EXLIB-2D: resolve this run's Plank logical identity once (NULL
  -- when the run has no approved active Plank member).
  SELECT c.logical_id INTO v_plank_logical
  FROM public.exercise_catalog c
  JOIN public.exercise_catalog_run_items ri
    ON ri.run_id = v_run.id AND ri.catalog_id = c.id
  WHERE c.review_status = 'approved'
    AND c.is_active = true
    AND lower(c.canonical_name) = 'plank'
  LIMIT 1;

  -- EXLIB-2E (review 1) catalog snapshot gate: before ANY Plank
  -- correction or delivery, the run's active approved Plank snapshot
  -- itself must match the promoted contract — timed tracking (which
  -- derives the mobility tenant type) and the exact approved anatomy
  -- multiset. A bodyweight or malformed snapshot fails the whole
  -- delivery closed; it can never produce a timed disposition or a
  -- tenant row whose mode disagrees with its catalog provenance.
  IF v_plank_logical IS NOT NULL THEN
    SELECT c.tracking_mode,
           COALESCE((SELECT string_agg(m.muscle || ':' || m.role, ',' ORDER BY m.muscle, m.role)
                     FROM public.exercise_catalog_muscles m
                     WHERE m.catalog_id = c.id), '')
      INTO v_snap_mode, v_cat_anat
    FROM public.exercise_catalog c
    JOIN public.exercise_catalog_run_items ri
      ON ri.run_id = v_run.id AND ri.catalog_id = c.id
    WHERE c.logical_id = v_plank_logical
      AND c.review_status = 'approved'
      AND c.is_active = true
    LIMIT 1;
    IF v_snap_mode IS DISTINCT FROM 'timed'
       OR v_cat_anat <> 'lower_back:tertiary,obliques:secondary' THEN
      RAISE EXCEPTION 'deliver_catalog_exercises: malformed Plank catalog snapshot (expected timed tracking and the approved anatomy multiset); delivery fails closed';
    END IF;
  END IF;

  -- ── Phase 1: the requested run's EXERCISE members ──────────────
  -- Scoped to v_run.id via the frozen membership table (Revision E,
  -- finding 1). Row gates (approved + active) remain as additional
  -- fail-closed conditions: post-approval state changes can only
  -- remove a member from delivery, never alter or add content.
  FOR v_cat IN
    SELECT c.*
    FROM public.exercise_catalog c
    JOIN public.exercise_catalog_run_items ri
      ON ri.run_id = v_run.id AND ri.catalog_id = c.id
    WHERE c.review_status = 'approved'
      AND c.is_active = true
    ORDER BY lower(c.canonical_name)
  LOOP
    v_eligible := v_eligible + 1;

    -- ── EXLIB-2D Plank dispatch (this logical identity ONLY; every
    -- other identity falls through to the unchanged generic path
    -- below). All work stays inside the same transaction and the
    -- same per-user advisory-lock domain as ordinary delivery. ──
    IF v_plank_logical IS NOT NULL AND v_cat.logical_id = v_plank_logical THEN
      -- Verified idempotency: an existing link is locked and fully
      -- validated; it may no-op ONLY if every invariant passes.
      SELECT e.* INTO v_linked FROM public.exercises e
      WHERE e.user_id = v_uid AND e.catalog_logical_id = v_cat.logical_id
      FOR UPDATE;
      IF FOUND THEN
        -- EXLIB-2E (review 1): shared validation shape; strict run
        -- provenance (import_run_id must equal THIS authorized run).
        IF exlib_plank_link_valid(v_uid, v_linked, v_cat.id, v_cat.logical_id,
                                  v_cat.canonical_name, v_run.id) THEN
          v_skipped_existing := v_skipped_existing + 1;
          v_plank_disposition := 'already_valid_idempotent';
          CONTINUE;
        END IF;
        RAISE EXCEPTION 'deliver_catalog_exercises: inconsistent prior Plank reconciliation requires separate investigation (no silent repair, relink, anatomy overwrite, or rename)';
      END IF;

      -- P2: guarded in-place correction of a provably pristine,
      -- unused, uncustomized seed row (nine preconditions, all
      -- re-verified here under SELECT ... FOR UPDATE).
      v_seed_found := false;
      v_p2_ok := false;
      SELECT n.claim_source, n.exercise_id INTO v_claim_source, v_claim_exercise
      FROM public.exercise_name_claims n
      WHERE n.user_id = v_uid AND n.normalized_name = lower(v_cat.canonical_name);
      IF v_claim_source = 'exercise' THEN
        SELECT e.* INTO v_seed FROM public.exercises e
        WHERE e.user_id = v_uid AND e.id = v_claim_exercise
        FOR UPDATE;
        IF FOUND THEN
          v_seed_found := true;
          IF v_seed.name = 'Plank'
             AND v_seed.is_system = true AND v_seed.is_active = true
             AND v_seed.notes IS NULL
             AND v_seed.equipment = 'bodyweight'
             AND v_seed.tracking_mode = 'bodyweight'
             AND v_seed.exercise_type = 'bodyweight'
             AND v_seed.category = 'isolation'
             AND v_seed.primary_muscle = 'abs'
             AND v_seed.unilateral = false
             AND v_seed.catalog_id IS NULL
             AND v_seed.catalog_logical_id IS NULL
             AND v_seed.import_run_id IS NULL
             AND NOT EXISTS (SELECT 1 FROM public.workout_exercises w
                             WHERE w.exercise_id = v_seed.id)
             AND NOT EXISTS (SELECT 1 FROM public.workout_routine_exercises w
                             WHERE w.exercise_id = v_seed.id)
             AND NOT EXISTS (SELECT 1 FROM public.exercise_aliases a
                             WHERE a.user_id = v_uid AND a.exercise_id = v_seed.id)
          THEN
            -- EXLIB-2E (review 2): lock the seed row's child anatomy
            -- rows (parent already locked above; children in
            -- deterministic primary-key order) BEFORE reading the
            -- signature and before the delete-and-replace, so a
            -- concurrent customization can never be overwritten as a
            -- pristine correction.
            PERFORM 1 FROM public.exercise_muscles m
            WHERE m.user_id = v_uid AND m.exercise_id = v_seed.id
            ORDER BY m.id
            FOR UPDATE;
            SELECT COALESCE(string_agg(m.muscle || ':' || m.role, ',' ORDER BY m.muscle, m.role), '')
              INTO v_row_anat FROM public.exercise_muscles m
              WHERE m.user_id = v_uid AND m.exercise_id = v_seed.id;
            IF v_row_anat = 'obliques:secondary' THEN
              v_p2_ok := true;
            END IF;
          END IF;
        END IF;
      END IF;

      IF v_p2_ok THEN
        -- Atomic: scalar + provenance update, anatomy replacement to
        -- the exact active approved catalog snapshot, and the
        -- correction record — all or nothing with the delivery txn.
        UPDATE public.exercises SET
          tracking_mode      = 'timed',
          exercise_type      = 'mobility',
          catalog_id         = v_cat.id,
          catalog_logical_id = v_cat.logical_id,
          import_run_id      = v_run.id
        WHERE id = v_seed.id AND user_id = v_uid;
        DELETE FROM public.exercise_muscles
        WHERE user_id = v_uid AND exercise_id = v_seed.id;
        INSERT INTO public.exercise_muscles (user_id, exercise_id, muscle, role)
        SELECT v_uid, v_seed.id, m.muscle, m.role
        FROM public.exercise_catalog_muscles m
        WHERE m.catalog_id = v_cat.id;
        INSERT INTO public.exercise_catalog_corrections
          (user_id, exercise_id, import_run_id, catalog_logical_id)
        VALUES (v_uid, v_seed.id, v_run.id, v_cat.logical_id);
        v_plank_disposition := 'corrected_and_linked_pristine_seed';
        CONTINUE;
      END IF;

      -- Collision-safe delivery: canonical when the claim is free,
      -- the deterministic distinguished fallback when only the
      -- canonical is claimed, otherwise a fail-closed retryable
      -- skip. Never a rename of any existing row.
      IF NOT EXISTS (SELECT 1 FROM public.exercise_name_claims n
                     WHERE n.user_id = v_uid
                       AND n.normalized_name = lower(v_cat.canonical_name)) THEN
        v_plank_name := v_cat.canonical_name;
        v_plank_disposition := 'delivered_canonical_timed_plank';
      ELSIF NOT EXISTS (SELECT 1 FROM public.exercise_name_claims n
                        WHERE n.user_id = v_uid
                          AND n.normalized_name = lower(v_cat.canonical_name || ' (timed)')) THEN
        v_plank_name := v_cat.canonical_name || ' (timed)';
        IF v_seed_found THEN
          v_plank_disposition := 'precondition_failure_preserved_legacy_plus_distinguished_delivery';
        ELSE
          v_plank_disposition := 'delivered_distinguished_timed_plank';
        END IF;
      ELSE
        v_skipped_collision := v_skipped_collision + 1;
        v_collision_names   := array_append(v_collision_names, v_cat.canonical_name);
        v_plank_disposition := 'skipped_canonical_and_distinguished_collision';
        CONTINUE;
      END IF;

      BEGIN
        INSERT INTO public.exercises (
          user_id, name, category, primary_muscle, equipment,
          exercise_type, tracking_mode, unilateral,
          is_active, is_system, catalog_id, catalog_logical_id, import_run_id
        ) VALUES (
          v_uid, v_plank_name, v_cat.category, v_cat.primary_muscle,
          v_cat.equipment,
          CASE v_cat.tracking_mode
            WHEN 'bodyweight' THEN 'bodyweight'
            WHEN 'cardio'     THEN 'cardio'
            WHEN 'timed'      THEN 'mobility'
            WHEN 'weight_time' THEN 'strength'
            ELSE 'strength'
          END,
          v_cat.tracking_mode,
          (v_cat.laterality <> 'bilateral'),
          true, true, v_cat.id, v_cat.logical_id, v_run.id
        ) RETURNING id INTO v_new_id;

        INSERT INTO public.exercise_muscles (user_id, exercise_id, muscle, role)
        SELECT v_uid, v_new_id, m.muscle, m.role
        FROM public.exercise_catalog_muscles m
        WHERE m.catalog_id = v_cat.id;
      EXCEPTION
        WHEN unique_violation THEN
          GET STACKED DIAGNOSTICS v_constraint = CONSTRAINT_NAME;
          IF v_constraint IN ('exercises_user_name_unique_idx',
                              'exercise_name_claims_pkey') THEN
            -- A client create/rename raced the pre-check: honest
            -- fail-closed skip, retryable later (no second fallback
            -- attempt inside a race).
            v_skipped_collision := v_skipped_collision + 1;
            v_collision_names   := array_append(v_collision_names, v_plank_name);
            v_plank_disposition := 'skipped_canonical_and_distinguished_collision';
            CONTINUE;
          ELSIF v_constraint = 'exercises_user_catalog_logical_unique_idx' THEN
            -- EXLIB-2E (review 1): a direct write raced the logical
            -- index (client writes do not share the advisory lock).
            -- The winning row is locked and FULLY validated with the
            -- same shared shape as the existing-link path; only a
            -- completely valid winner may no-op, and any malformed
            -- winner aborts fail-closed with no repair or partial
            -- mutation.
            SELECT e.* INTO v_linked FROM public.exercises e
            WHERE e.user_id = v_uid AND e.catalog_logical_id = v_cat.logical_id
            FOR UPDATE;
            IF FOUND AND exlib_plank_link_valid(v_uid, v_linked, v_cat.id, v_cat.logical_id,
                                                v_cat.canonical_name, v_run.id) THEN
              v_skipped_existing := v_skipped_existing + 1;
              v_plank_disposition := 'already_valid_idempotent';
              CONTINUE;
            END IF;
            RAISE EXCEPTION 'deliver_catalog_exercises: inconsistent prior Plank reconciliation requires separate investigation (no silent repair, relink, anatomy overwrite, or rename)';
          ELSE
            RAISE;
          END IF;
      END;

      v_inserted         := v_inserted + 1;
      v_inserted_logical := array_append(v_inserted_logical, v_cat.logical_id);
      CONTINUE;
    END IF;

    IF EXISTS (
      SELECT 1 FROM public.exercises e
      WHERE e.user_id = v_uid AND e.catalog_logical_id = v_cat.logical_id
    ) THEN
      v_skipped_existing := v_skipped_existing + 1;
      CONTINUE;
    END IF;

    IF EXISTS (
      SELECT 1 FROM public.exercise_name_claims n
      WHERE n.user_id = v_uid
        AND n.normalized_name = lower(v_cat.canonical_name)
    ) THEN
      v_skipped_collision := v_skipped_collision + 1;
      v_collision_names   := array_append(v_collision_names, v_cat.canonical_name);
      CONTINUE;
    END IF;

    -- Exercise + anatomy subtransaction. Expected race constraints
    -- ONLY; everything else re-raises and aborts the delivery.
    BEGIN
      INSERT INTO public.exercises (
        user_id, name, category, primary_muscle, equipment,
        exercise_type, tracking_mode, unilateral,
        is_active, is_system, catalog_id, catalog_logical_id, import_run_id
      ) VALUES (
        v_uid, v_cat.canonical_name, v_cat.category, v_cat.primary_muscle,
        v_cat.equipment,
        CASE v_cat.tracking_mode
          WHEN 'bodyweight' THEN 'bodyweight'
          WHEN 'cardio'     THEN 'cardio'
          WHEN 'timed'      THEN 'mobility'
          WHEN 'weight_time' THEN 'strength'
          ELSE 'strength'
        END,
        v_cat.tracking_mode,
        (v_cat.laterality <> 'bilateral'),
        true, true, v_cat.id, v_cat.logical_id, v_run.id
      ) RETURNING id INTO v_new_id;

      INSERT INTO public.exercise_muscles (user_id, exercise_id, muscle, role)
      SELECT v_uid, v_new_id, m.muscle, m.role
      FROM public.exercise_catalog_muscles m
      WHERE m.catalog_id = v_cat.id;
    EXCEPTION
      WHEN unique_violation THEN
        GET STACKED DIAGNOSTICS v_constraint = CONSTRAINT_NAME;
        IF v_constraint IN ('exercises_user_name_unique_idx',
                            'exercise_name_claims_pkey') THEN
          -- The user already holds this name (the PRE-EXISTING
          -- non-partial exercises index counts inactive rows) or a
          -- concurrent create/rename raced the pre-check: an honest
          -- name collision that SKIPS this candidate only — never
          -- an abort (Revision C, finding 1).
          v_skipped_collision := v_skipped_collision + 1;
          v_collision_names   := array_append(v_collision_names, v_cat.canonical_name);
          CONTINUE;
        ELSIF v_constraint = 'exercises_user_catalog_logical_unique_idx' THEN
          -- Concurrent duplicate delivery: already delivered. The
          -- alias phase below resolves its target independently.
          v_skipped_existing := v_skipped_existing + 1;
          CONTINUE;
        ELSE
          -- Anatomy/provenance/unknown uniqueness failure is a
          -- defect, never a disposition: abort everything.
          RAISE;
        END IF;
    END;

    v_inserted         := v_inserted + 1;
    v_inserted_logical := array_append(v_inserted_logical, v_cat.logical_id);
  END LOOP;

  -- ── Phase 2: the requested run's ALIAS members ──────────────────
  -- One unified phase preserves every Revision D disposition while
  -- serving both cases: aliases of exercises inserted by phase 1 of
  -- THIS call (alias_inserted) and this run's newly approved aliases
  -- for exercises delivered by EARLIER runs (alias_added_to_existing
  -- — the LATER-RUN ALIAS POLICY of Revision C, finding 2, preserved
  -- and still approval-gated: an alias-only run delivers only after
  -- ITS OWN product + legal approval). Idempotency is DECLARATIVE
  -- (Revision C, finding 2): the partial unique
  -- (user_id, catalog_alias_id) makes re-delivery of the same
  -- catalog alias impossible whether its tenant row is active OR
  -- inactive — retries can never create duplicate audit rows, and
  -- a rolled-back (deactivated) alias stays a deterministic skip
  -- until an explicit future reactivation operation.
  -- Revision D, finding 3 (preserved): an INACTIVE target exercise
  -- blocks the insert (alias_skipped_inactive_exercise) — an
  -- active-but-nonresolving alias can never be created.
  -- Revision E: a member whose logical has NO delivered exercise for
  -- this user (never delivered here, or its exercise member was
  -- collision-skipped) reports alias_skipped_no_exercise.
  FOR v_alias IN
    SELECT a.id, a.alias, a.logical_id
    FROM public.exercise_catalog_aliases a
    JOIN public.exercise_catalog_run_items ri
      ON ri.run_id = v_run.id AND ri.catalog_alias_id = a.id
    ORDER BY lower(a.alias)
  LOOP
    IF EXISTS (
      SELECT 1 FROM public.exercise_aliases t
      WHERE t.user_id = v_uid AND t.catalog_alias_id = v_alias.id
    ) THEN
      v_alias_already_delivered := v_alias_already_delivered + 1;
      CONTINUE;
    END IF;

    v_target_id     := NULL;
    v_target_active := false;
    SELECT e.id, e.is_active INTO v_target_id, v_target_active
    FROM public.exercises e
    WHERE e.user_id = v_uid AND e.catalog_logical_id = v_alias.logical_id;

    IF v_target_id IS NULL THEN
      v_alias_no_exercise := v_alias_no_exercise + 1;
      CONTINUE;
    END IF;
    IF NOT v_target_active THEN
      -- Revision D, finding 3: the target exercise is inactive —
      -- insert nothing; never create an active alias that cannot
      -- resolve. Deterministic on retry.
      v_alias_skipped_inactive := v_alias_skipped_inactive + 1;
      CONTINUE;
    END IF;
    IF EXISTS (
      SELECT 1 FROM public.exercise_name_claims n
      WHERE n.user_id = v_uid
        AND n.normalized_name = lower(v_alias.alias)
    ) THEN
      v_alias_skipped := v_alias_skipped + 1;
      CONTINUE;
    END IF;

    BEGIN
      INSERT INTO public.exercise_aliases
        (user_id, exercise_id, alias, catalog_alias_id, import_run_id)
      VALUES (v_uid, v_target_id, v_alias.alias, v_alias.id, v_run.id);
      IF v_alias.logical_id = ANY(v_inserted_logical) THEN
        v_alias_inserted := v_alias_inserted + 1;
      ELSE
        v_alias_added_existing := v_alias_added_existing + 1;
      END IF;
    EXCEPTION
      WHEN unique_violation THEN
        GET STACKED DIAGNOSTICS v_constraint = CONSTRAINT_NAME;
        IF v_constraint = 'exercise_aliases_user_catalog_alias_unique_idx' THEN
          -- Raced idempotency: this catalog alias already has its
          -- tenant row for this user.
          v_alias_already_delivered := v_alias_already_delivered + 1;
        ELSIF v_constraint IN ('exercise_name_claims_pkey',
                            'exercise_aliases_user_alias_unique_idx') THEN
          v_alias_skipped := v_alias_skipped + 1;
        ELSE
          RAISE;
        END IF;
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'run_key',                p_run_key,
    'eligible',               v_eligible,
    'inserted',               v_inserted,
    'skipped_already_delivered', v_skipped_existing,
    'skipped_name_collision', v_skipped_collision,
    'collision_names',        to_jsonb(v_collision_names),
    'alias_inserted',         v_alias_inserted,
    'alias_added_to_existing', v_alias_added_existing,
    'alias_already_delivered', v_alias_already_delivered,
    'alias_skipped_no_exercise', v_alias_no_exercise,
    'alias_skipped_inactive_exercise', v_alias_skipped_inactive,
    'alias_skipped_collision', v_alias_skipped,
    'inserted_catalog_logical_ids', to_jsonb(v_inserted_logical),
    'plank_disposition',      v_plank_disposition
  );
END;
$$;

COMMIT;
