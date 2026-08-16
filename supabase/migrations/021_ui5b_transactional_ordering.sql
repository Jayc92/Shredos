-- ============================================================
-- ForgeFitOS — Migration 021 (UI-5B1B)
-- Transactional exercise ordering and set numbering.
--
-- Four SECURITY INVOKER functions following the migration 013 house
-- pattern (auth.uid() guard, explicit owner check on top of RLS,
-- pg_advisory_xact_lock serialization, RAISE aborts the whole
-- transaction with a machine-mappable message):
--
--   1. reorder_workout_exercises(session, ordered ids)
--   2. reorder_routine_exercises(routine, ordered ids)
--   3. delete_workout_set_and_resequence(set)
--   4. append_workout_set(workout exercise, typed set values)
--
-- Integrity boundaries:
--   - Reordering writes order_index ONLY, in one UPDATE, after
--     exact-set validation (same count, no nulls, no duplicates, no
--     unknown ids, no omissions), so a stale client changes nothing.
--     Completed workouts may call the workout variant because it is
--     structurally incapable of touching logged data.
--   - Set numbering has NO unique constraint (003), so deletion and
--     append must share one serialization boundary: both take the
--     same per-exercise advisory lock before reading or writing any
--     set_number. Delete-and-resequence commits atomically (no
--     partial delete-without-resequence state can ever be visible),
--     and append computes MAX+1 under the same lock, so rapid or
--     concurrent add/delete cannot create duplicate or gapped
--     numbering.
--   - Resequencing preserves every remaining set's id, values,
--     nulls, completion, warmup, and notes; it writes set_number
--     only, ordered deterministically by (set_number, id).
--
--   - CONCURRENCY REVIEW: authorization against session status is
--     decided only on a FOR UPDATE re-read of the session row taken
--     AFTER the advisory lock (completion's row UPDATE conflicts
--     with it, so append/delete can never commit after 'completed'
--     became authoritative). Reordering freezes membership with
--     parent-row FOR UPDATE (conflicts with the FK KEY SHARE lock
--     child INSERTs take) plus child-row FOR UPDATE (conflicts with
--     child DELETEs), so success can only commit against the exact
--     validated list. Duplicate deletes are detected via
--     DELETE ... RETURNING — a second delete of the same set gets
--     not_found, never a false success. FINAL REVIEW: tracking_mode
--     is mutable (route + direct Data API), so append reads it under
--     an exercises-row FOR UPDATE taken after the session lock and
--     validates every mode-dependent rule only then — a mode edit
--     either commits first (append validates against the new mode)
--     or waits for the append to commit. Global lock order: advisory
--     lock, then parent/session row, then exercise row, then child
--     rows.
--
-- Errors raised (mapped by the API routes, never surfaced raw):
--   not_authenticated | not_found | invalid_input |
--   stale_exercise_list | workout_completed
-- ============================================================

-- ── 1. Workout exercise reordering ─────────────────────────────────

CREATE OR REPLACE FUNCTION reorder_workout_exercises(
  p_session_id  UUID,
  p_ordered_ids UUID[]
) RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_uid   UUID;
  v_count INTEGER;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF p_session_id IS NULL
     OR p_ordered_ids IS NULL
     OR COALESCE(array_length(p_ordered_ids, 1), 0) = 0
     OR COALESCE(array_length(p_ordered_ids, 1), 0) > 500
     OR EXISTS (SELECT 1 FROM unnest(p_ordered_ids) AS supplied(id)
                WHERE supplied.id IS NULL)
  THEN
    RAISE EXCEPTION 'invalid_input';
  END IF;

  -- Serialize concurrent reorders of this session (released on
  -- commit/rollback).
  PERFORM pg_advisory_xact_lock(
    hashtext('reorder_workout_exercises'),
    hashtext(p_session_id::text)
  );

  -- Ownership + MEMBERSHIP FREEZE (concurrency review): lock the
  -- parent session row FOR UPDATE. Inserting a child workout_exercise
  -- takes a FOR KEY SHARE lock on this exact row via the foreign-key
  -- integrity trigger, and FOR UPDATE conflicts with FOR KEY SHARE —
  -- so no Add Exercise can commit while this transaction holds the
  -- lock (and parent deletion/updates wait too). Explicit owner
  -- predicate on top of RLS.
  PERFORM 1
  FROM workout_sessions ws
  WHERE ws.id = p_session_id AND ws.user_id = v_uid
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found';
  END IF;

  -- Freeze the CURRENT children: FOR UPDATE on every existing child
  -- row conflicts with the row lock a concurrent Remove Exercise
  -- DELETE needs, so no current member can vanish between validation
  -- and the ordering UPDATE. A removal that committed BEFORE this
  -- lock is observed by the re-read below and fails exact-set
  -- validation. Lock order everywhere in this migration: advisory
  -- lock, then parent row, then child rows — no cycles are possible.
  PERFORM 1
  FROM workout_exercises we
  WHERE we.workout_session_id = p_session_id
  FOR UPDATE;

  -- Exact-set validation AGAINST THE FROZEN MEMBERSHIP: the submitted
  -- list must be precisely the session's current exercises — same
  -- count, no duplicates, no unknown or omitted ids. A stale client
  -- fails here and NOTHING commits; success can only ever commit
  -- against the exact list that was locked.
  SELECT COUNT(*) INTO v_count
  FROM workout_exercises we
  WHERE we.workout_session_id = p_session_id;

  IF v_count = 0
     OR v_count <> COALESCE(array_length(p_ordered_ids, 1), 0)
     OR v_count <> (SELECT COUNT(DISTINCT supplied.id)
                    FROM unnest(p_ordered_ids) AS supplied(id))
     OR EXISTS (
       SELECT 1 FROM unnest(p_ordered_ids) AS supplied(id)
       WHERE supplied.id NOT IN (
         SELECT we.id FROM workout_exercises we
         WHERE we.workout_session_id = p_session_id
       )
     )
  THEN
    RAISE EXCEPTION 'stale_exercise_list';
  END IF;

  -- One statement, one transaction: contiguous zero-based order.
  -- Touches order_index ONLY, so completed workouts may reorder
  -- presentation without any logged value, set, note, target,
  -- status, or metadata change.
  UPDATE workout_exercises we
  SET order_index = supplied.ord - 1
  FROM unnest(p_ordered_ids) WITH ORDINALITY AS supplied(id, ord)
  WHERE we.id = supplied.id
    AND we.workout_session_id = p_session_id;
END;
$$;

COMMENT ON FUNCTION reorder_workout_exercises(UUID, UUID[]) IS
  'UI-5B1B: transactional, order_index-only reordering of a workout''s exercises with exact-set validation. Safe for completed workouts (presentation order only).';

-- ── 2. Routine exercise reordering ─────────────────────────────────

CREATE OR REPLACE FUNCTION reorder_routine_exercises(
  p_routine_id  UUID,
  p_ordered_ids UUID[]
) RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_uid   UUID;
  v_count INTEGER;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF p_routine_id IS NULL
     OR p_ordered_ids IS NULL
     OR COALESCE(array_length(p_ordered_ids, 1), 0) = 0
     OR COALESCE(array_length(p_ordered_ids, 1), 0) > 500
     OR EXISTS (SELECT 1 FROM unnest(p_ordered_ids) AS supplied(id)
                WHERE supplied.id IS NULL)
  THEN
    RAISE EXCEPTION 'invalid_input';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtext('reorder_routine_exercises'),
    hashtext(p_routine_id::text)
  );

  -- Same membership freeze as the workout variant: parent row FOR
  -- UPDATE blocks child INSERT (FK KEY SHARE conflict) and parent
  -- deletion; child rows FOR UPDATE block concurrent removal.
  PERFORM 1
  FROM workout_routines wr
  WHERE wr.id = p_routine_id AND wr.user_id = v_uid
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found';
  END IF;

  PERFORM 1
  FROM workout_routine_exercises wre
  WHERE wre.routine_id = p_routine_id
  FOR UPDATE;

  SELECT COUNT(*) INTO v_count
  FROM workout_routine_exercises wre
  WHERE wre.routine_id = p_routine_id;

  IF v_count = 0
     OR v_count <> COALESCE(array_length(p_ordered_ids, 1), 0)
     OR v_count <> (SELECT COUNT(DISTINCT supplied.id)
                    FROM unnest(p_ordered_ids) AS supplied(id))
     OR EXISTS (
       SELECT 1 FROM unnest(p_ordered_ids) AS supplied(id)
       WHERE supplied.id NOT IN (
         SELECT wre.id FROM workout_routine_exercises wre
         WHERE wre.routine_id = p_routine_id
       )
     )
  THEN
    RAISE EXCEPTION 'stale_exercise_list';
  END IF;

  UPDATE workout_routine_exercises wre
  SET order_index = supplied.ord - 1
  FROM unnest(p_ordered_ids) WITH ORDINALITY AS supplied(id, ord)
  WHERE wre.id = supplied.id
    AND wre.routine_id = p_routine_id;
END;
$$;

COMMENT ON FUNCTION reorder_routine_exercises(UUID, UUID[]) IS
  'UI-5B1B: transactional, order_index-only reordering of a routine''s exercises with exact-set validation.';

-- ── 3. Delete a set and resequence atomically ──────────────────────

CREATE OR REPLACE FUNCTION delete_workout_set_and_resequence(
  p_set_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_uid            UUID;
  v_exercise_id    UUID;
  v_session_id     UUID;
  v_session_status TEXT;
  v_deleted_id     UUID;
  v_remaining      INTEGER;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF p_set_id IS NULL THEN
    RAISE EXCEPTION 'invalid_input';
  END IF;

  -- Resolve the lock DOMAIN through the set -> exercise -> session
  -- chain, restricted to the caller's own rows. This initial lookup
  -- only identifies WHICH locks to take — every authorization
  -- decision is re-made below AFTER the locks are held.
  SELECT we.id, ws.id
  INTO v_exercise_id, v_session_id
  FROM workout_sets s
  JOIN workout_exercises we ON we.id = s.workout_exercise_id
  JOIN workout_sessions ws ON ws.id = we.workout_session_id
  WHERE s.id = p_set_id AND ws.user_id = v_uid;

  IF v_exercise_id IS NULL THEN
    RAISE EXCEPTION 'not_found';
  END IF;

  -- Serialize this exercise's ENTIRE set-numbering domain. The
  -- append function takes the identical lock, so no numbering
  -- decision is ever made outside this boundary. Lock order:
  -- advisory first, then the session row — identical everywhere.
  PERFORM pg_advisory_xact_lock(
    hashtext('workout_set_numbering'),
    hashtext(v_exercise_id::text)
  );

  -- CONCURRENCY REVIEW: re-read the authoritative session row FOR
  -- UPDATE. The completion/reopen routes update this exact row, and
  -- a row UPDATE conflicts with FOR UPDATE — so if completion
  -- committed first we observe status = completed here (READ
  -- COMMITTED re-reads the latest committed row after the lock
  -- wait) and reject; if we hold the lock first, completion waits
  -- until this transaction commits. The initial lookup above is
  -- never trusted for this decision.
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

  -- Delete ONLY the requested set — revalidated under the lock. A
  -- concurrent duplicate delete that won the lock first already
  -- removed the row: RETURNING then yields nothing and this call
  -- reports the controlled not_found instead of a false success
  -- (the transaction aborts atomically; nothing else has mutated).
  DELETE FROM workout_sets
  WHERE id = p_set_id AND workout_exercise_id = v_exercise_id
  RETURNING id INTO v_deleted_id;
  IF v_deleted_id IS NULL THEN
    RAISE EXCEPTION 'not_found';
  END IF;

  -- Resequence the remainder contiguously to 1..N, deterministically
  -- ordered by prior (set_number, id). Writes set_number ONLY —
  -- every remaining set keeps its id, values, nulls, completion,
  -- warmup state, and notes. Deleting the last set is valid and
  -- leaves zero rows, exactly as the previous route behavior allowed.
  UPDATE workout_sets s
  SET set_number = renumbered.new_number
  FROM (
    SELECT inner_s.id AS set_id,
           ROW_NUMBER() OVER (ORDER BY inner_s.set_number, inner_s.id) AS new_number
    FROM workout_sets inner_s
    WHERE inner_s.workout_exercise_id = v_exercise_id
  ) AS renumbered
  WHERE s.id = renumbered.set_id
    AND s.set_number IS DISTINCT FROM renumbered.new_number;

  SELECT COUNT(*) INTO v_remaining
  FROM workout_sets s
  WHERE s.workout_exercise_id = v_exercise_id;

  RETURN jsonb_build_object(
    'deleted', true,
    'workout_exercise_id', v_exercise_id,
    'remaining_count', v_remaining
  );
END;
$$;

COMMENT ON FUNCTION delete_workout_set_and_resequence(UUID) IS
  'UI-5B1B: atomically deletes one set and renumbers the exercise''s remaining sets to a contiguous 1..N (set_number only; ids, values, completion, warmup, and notes untouched). Shares the per-exercise numbering lock with append_workout_set.';

-- ── 4. Append a set under the shared numbering lock ────────────────
--
-- SECURITY-REVIEW REWRITE: explicit typed parameters instead of a
-- JSONB blob, because execution is granted to `authenticated` and a
-- direct RPC caller bypasses the Next.js route entirely. The
-- function therefore enforces EVERY invariant itself:
--   - ownership + completed-workout rejection (fail-closed);
--   - tracking mode read from the caller's OWN exercise row UNDER A
--     ROW LOCK (mutable via the exercises PATCH route and direct
--     Data API) — never trusted from the arguments or from any
--     pre-lock read;
--   - per-mode field gating identical to the route (weight modes
--     may not carry duration/distance; cardio may not carry
--     reps/weight/rpe/warmup; timed may not carry
--     reps/weight/distance/warmup);
--   - type/range validation (reps 0..1000; rpe 1..10; weight_kg
--     0 < kg <= 1000, already the internal metric unit — the
--     lbs->kg conversion happens only in the route and a direct
--     caller can only ever write the internal column with range
--     checks; duration 0..86400 and distance 0..1000000, both
--     allowing stored zeros so Add Set carry-forward cannot regress;
--     notes <= 10000 chars);
--   - the same per-mode completion requirements as the route;
--   - identity, foreign-key, timestamp, and set_number columns are
--     not parameters at all, so they cannot be supplied;
--   - typed parameters mean PostgREST rejects malformed argument
--     types before the function body runs — no uncontrolled cast
--     errors can originate here.

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
  IF (p_reps IS NOT NULL AND (p_reps < 0 OR p_reps > 1000))
     OR (p_rpe IS NOT NULL AND (p_rpe < 1 OR p_rpe > 10))
     OR (p_weight_kg IS NOT NULL AND (p_weight_kg <= 0 OR p_weight_kg > 1000))
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
  'UI-5B1B: appends one set with a server-computed contiguous set_number under the same per-exercise advisory lock as delete_workout_set_and_resequence. Fully self-validating for direct authenticated RPC calls: ownership, completed lock, server-derived tracking mode, per-mode field gating, and type/range checks all live in the function body.';

-- ── Grants ───────────────────────────────────────────────────────

REVOKE ALL ON FUNCTION reorder_workout_exercises(UUID, UUID[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION reorder_routine_exercises(UUID, UUID[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION delete_workout_set_and_resequence(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION append_workout_set(UUID, SMALLINT, NUMERIC, NUMERIC, INTEGER, NUMERIC, BOOLEAN, BOOLEAN, TEXT) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION reorder_workout_exercises(UUID, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION reorder_routine_exercises(UUID, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_workout_set_and_resequence(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION append_workout_set(UUID, SMALLINT, NUMERIC, NUMERIC, INTEGER, NUMERIC, BOOLEAN, BOOLEAN, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
