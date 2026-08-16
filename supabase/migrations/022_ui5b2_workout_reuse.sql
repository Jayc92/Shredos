-- ============================================================
-- ShredOS UI-5B2 — Workout reuse: save-as-routine + repeat
-- 022_ui5b2_workout_reuse.sql
-- ============================================================
-- Run AFTER 021_ui5b_transactional_ordering.sql.
--
-- Two SECURITY INVOKER functions following the migration 013/021
-- house pattern (terse error codes raised as exceptions; RLS remains
-- the enforcement floor because everything runs as the caller).
-- Each function is ONE transaction: any failure rolls the whole copy
-- back, so no compensating-cleanup architecture exists and a
-- partially created routine/session is unreachable by construction.
--
--   create_routine_from_workout(p_workout_session_id, p_name,
--                               p_description)
--     Copies a live or completed workout's STRUCTURE into a new
--     routine: exercise identities and displayed order, plus ONLY
--     the workout's explicit prescription columns. target_sets may
--     fall back to the count of existing non-warmup set rows —
--     that is workout structure, not performance. Nothing is ever
--     derived from logged reps/weight/RPE/duration/distance, and
--     session, exercise, and set notes are never copied. The source
--     workout is never written.
--
--   repeat_workout(p_workout_session_id, p_workout_date)
--     Copies a COMPLETED workout into a new in-progress session:
--     exercise order, explicit target columns, set count,
--     deterministic set order, and warmup identity — with DENSE
--     1..N set numbering per exercise, so a legacy source with
--     gapped or duplicate numbers can never seed a new workout that
--     violates UI-5B1B's contiguous-numbering invariant. Every new
--     set has reps,
--     weight_kg, rpe, duration_seconds, and distance_meters NULL,
--     completed = false, notes NULL — historical performance shows
--     only through the existing Last/Recent reference UI, never as
--     editable starting values. routine_id is NULL (the new workout
--     derives from a historical session, not its former routine).
--     The source workout is never written. BOTH functions freeze
--     their source with the same deterministic lock discipline —
--     parent session row FOR UPDATE, then exercise rows, then set
--     rows (the 021 parent-before-children order) — so the rows
--     counted by the bounds are exactly the rows copied, and nothing
--     can appear, disappear, reorder, renumber, or change structure
--     between validation and copy. A concurrent live-workout edit
--     may briefly wait; correctness takes priority for this short
--     transactional copy.
--
-- Error codes (raised, matching 021): not_authenticated,
-- invalid_input, not_found. Expected business outcomes return in
-- the jsonb payload instead of raising, because the UI needs them
-- as data: {"error":"duplicate_name"} from the existing
-- case-insensitive unique index, and
-- {"error":"active_workout_exists","active_workout_id":...} from
-- the precheck or the migration 008 partial unique index.
-- ============================================================

-- ── 1. Save a workout as a routine ─────────────────────────────────

CREATE OR REPLACE FUNCTION create_routine_from_workout(
  p_workout_session_id UUID,
  p_name               TEXT,
  p_description        TEXT DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid            UUID;
  v_name           TEXT;
  v_description    TEXT;
  v_status         TEXT;
  v_src_ids        UUID[];
  v_set_count      INTEGER;
  v_routine_id     UUID;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  v_name := NULLIF(btrim(COALESCE(p_name, '')), '');
  v_description := NULLIF(btrim(COALESCE(p_description, '')), '');
  IF p_workout_session_id IS NULL
     OR v_name IS NULL
     OR length(v_name) > 120
     OR (v_description IS NOT NULL AND length(v_description) > 2000)
  THEN
    RAISE EXCEPTION 'invalid_input';
  END IF;

  -- Ownership + eligible source status (explicit owner predicate on
  -- top of RLS). Live and completed workouts are both eligible; a
  -- planned/skipped shell is not a workout structure worth saving.
  -- SOURCE LOCKING, step 1 of 3 (deterministic global order: parent
  -- session row, then exercise rows, then set rows — the same
  -- parent-before-children order 021 and repeat_workout use, so no
  -- lock-order cycle exists). FOR UPDATE on the parent freezes its
  -- existence, ownership, AND child membership for the whole
  -- transaction: a live workout's Add Exercise takes FOR KEY SHARE
  -- on this row via the foreign key, which conflicts with FOR UPDATE
  -- and therefore BLOCKS until this copy commits. A concurrent live
  -- edit may briefly wait; correctness takes priority. Locks are the
  -- only thing taken on the source — the RPC never writes it.
  SELECT ws.status INTO v_status
  FROM workout_sessions ws
  WHERE ws.id = p_workout_session_id AND ws.user_id = v_uid
  FOR UPDATE;
  IF v_status IS NULL THEN
    RAISE EXCEPTION 'not_found';
  END IF;
  IF v_status NOT IN ('in_progress', 'completed') THEN
    RAISE EXCEPTION 'invalid_input';
  END IF;

  -- SOURCE LOCKING, step 2 of 3 + AUTHORITATIVE ORDER, captured
  -- exactly once: FOR UPDATE on every source exercise row, acquired
  -- in deterministic id order inside the subquery (FOR UPDATE cannot
  -- sit beside an aggregate). Target columns, order_index, and row
  -- existence are frozen, and the parent lock above already blocks
  -- NEW children — so the 500 bound below counts exactly the rows
  -- eligible for copying. Same (order_index, id) tiebreak as the 021
  -- resequencer.
  SELECT array_agg(locked.id ORDER BY locked.order_index, locked.id)
    INTO v_src_ids
  FROM (
    SELECT we.id, we.order_index
    FROM workout_exercises we
    WHERE we.workout_session_id = p_workout_session_id
    ORDER BY we.id
    FOR UPDATE
  ) locked;
  IF COALESCE(array_length(v_src_ids, 1), 0) > 500 THEN
    RAISE EXCEPTION 'invalid_input';
  END IF;

  -- SOURCE LOCKING, step 3 of 3: FOR UPDATE on every source set row
  -- (deterministic id order), so no set can appear, disappear,
  -- renumber, or flip its warmup designation before the copy. The
  -- 5000 bound is counted AFTER this freeze, so the rows counted are
  -- exactly the frozen population the fallback non-warmup COUNT
  -- reads — and it keeps that COUNT far below any unsafe smallint
  -- cast.
  PERFORM 1
  FROM workout_sets s
  WHERE s.workout_exercise_id = ANY (v_src_ids)
  ORDER BY s.id
  FOR UPDATE;
  SELECT COUNT(*) INTO v_set_count
  FROM workout_sets s
  WHERE s.workout_exercise_id = ANY (v_src_ids);
  IF v_set_count > 5000 THEN
    RAISE EXCEPTION 'invalid_input';
  END IF;

  -- The existing case-insensitive unique index
  -- (workout_routines_user_name_idx on (user_id, lower(name))) is
  -- the duplicate-name authority — including under concurrent
  -- double-submits, where the second insert blocks until the first
  -- commits and then violates. That expected outcome returns as
  -- data; any OTHER unique violation re-raises untouched.
  BEGIN
    INSERT INTO workout_routines (user_id, name, description)
    VALUES (v_uid, v_name, v_description)
    RETURNING id INTO v_routine_id;
  EXCEPTION WHEN unique_violation THEN
    IF SQLERRM LIKE '%workout_routines_user_name_idx%' THEN
      RETURN jsonb_build_object('error', 'duplicate_name');
    END IF;
    RAISE;
  END;

  -- Structure copy FROM THE LOCKED SOURCE — positions come from the
  -- captured array's ordinality, never a re-read of order_index, so
  -- dense order (0..n-1, no vacancies) is deterministic and exact:
  --   target_sets  explicit source target first; otherwise the count
  --                of non-warmup rows in the FROZEN set population
  --                (structure); an exercise with no sets stays NULL
  --                — missing never becomes zero;
  --   reps range   explicit target_reps_min/max; when both are
  --                absent, the legacy explicit single target_reps
  --                (also a prescription column, snapshotted from the
  --                originating routine) maps to an exact min = max
  --                range;
  --   weight       explicit target_weight_kg verbatim (NULL vs zero
  --                preserved);
  --   target_rpe, rest_seconds, notes stay NULL — the workout has no
  --   explicit prescription contract for them, and deriving them
  --   from logged performance is forbidden.
  INSERT INTO workout_routine_exercises (
    routine_id, exercise_id, order_index,
    target_sets, target_reps_min, target_reps_max, target_weight_kg
  )
  SELECT
    v_routine_id,
    we.exercise_id,
    (src.ord - 1)::smallint,
    COALESCE(
      we.target_sets,
      (SELECT NULLIF(COUNT(*), 0)
       FROM workout_sets s
       WHERE s.workout_exercise_id = we.id
         AND s.is_warmup = false)::smallint
    ),
    COALESCE(we.target_reps_min,
             CASE WHEN we.target_reps_max IS NULL THEN we.target_reps END),
    COALESCE(we.target_reps_max,
             CASE WHEN we.target_reps_min IS NULL THEN we.target_reps END),
    we.target_weight_kg
  FROM unnest(v_src_ids) WITH ORDINALITY AS src(id, ord)
  JOIN workout_exercises we ON we.id = src.id;

  RETURN jsonb_build_object('routine_id', v_routine_id);
END;
$$;

COMMENT ON FUNCTION create_routine_from_workout(UUID, TEXT, TEXT) IS
  'UI-5B2: copies a live/completed workout''s structure (exercise identity, displayed order, explicit prescription columns; target_sets may fall back to the non-warmup set COUNT) into a new routine in one transaction. Never copies or derives logged performance, never copies any notes, never writes the source. Duplicate names return {"error":"duplicate_name"} via the existing case-insensitive unique index.';


-- ── 2. Repeat a completed workout ──────────────────────────────────

CREATE OR REPLACE FUNCTION repeat_workout(
  p_workout_session_id UUID,
  p_workout_date       DATE
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid            UUID;
  v_source         RECORD;
  v_src_ids        UUID[];
  v_set_count      INTEGER;
  v_active_id      UUID;
  v_session_id     UUID;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF p_workout_session_id IS NULL OR p_workout_date IS NULL THEN
    RAISE EXCEPTION 'invalid_input';
  END IF;

  -- Ownership + eligible source status: completed workouts only.
  -- SOURCE LOCKING, step 1 of 3 (deterministic global order: parent
  -- session row, then exercise rows, then set rows — the same
  -- parent-before-children order every 021 function uses, so no
  -- lock-order cycle exists with reorder/delete/append). FOR UPDATE
  -- on the parent freezes its existence, ownership, and membership
  -- (a child INSERT's FOR KEY SHARE conflicts with it) for the whole
  -- transaction. Locks are the only thing taken on the source — the
  -- RPC never writes it.
  SELECT ws.id, ws.status, ws.title INTO v_source
  FROM workout_sessions ws
  WHERE ws.id = p_workout_session_id AND ws.user_id = v_uid
  FOR UPDATE;
  IF v_source.id IS NULL THEN
    RAISE EXCEPTION 'not_found';
  END IF;
  IF v_source.status <> 'completed' THEN
    RAISE EXCEPTION 'invalid_input';
  END IF;

  -- SOURCE LOCKING, step 2 of 3 + AUTHORITATIVE ORDER, captured
  -- exactly once. FOR UPDATE on every source exercise row (acquired
  -- in deterministic id order inside the subquery — FOR UPDATE
  -- cannot sit beside an aggregate, and a stable acquisition order
  -- avoids intra-statement deadlocks with other multi-row lockers)
  -- freezes target columns, order_index, and row existence: an
  -- order-only reorder (legal on completed workouts), a target edit,
  -- or a direct-API delete now BLOCKS until this transaction
  -- commits, so no captured exercise can disappear and no position
  -- can shift between capture and insertion. Every statement below
  -- derives positions from this one array (unnest WITH ORDINALITY),
  -- never from a re-read of order_index. Same (order_index, id)
  -- tiebreak as the 021 resequencer. Bounded like 021's ceilings.
  SELECT array_agg(locked.id ORDER BY locked.order_index, locked.id)
    INTO v_src_ids
  FROM (
    SELECT we.id, we.order_index
    FROM workout_exercises we
    WHERE we.workout_session_id = p_workout_session_id
    ORDER BY we.id
    FOR UPDATE
  ) locked;
  IF COALESCE(array_length(v_src_ids, 1), 0) > 500 THEN
    RAISE EXCEPTION 'invalid_input';
  END IF;

  -- SOURCE LOCKING, step 3 of 3: FOR UPDATE on every source set row
  -- (deterministic id order), so set rows cannot disappear, renumber,
  -- or change their warmup designation during the copy. The bound is
  -- counted AFTER the rows are frozen, so it is authoritative.
  PERFORM 1
  FROM workout_sets s
  WHERE s.workout_exercise_id = ANY (v_src_ids)
  ORDER BY s.id
  FOR UPDATE;
  SELECT COUNT(*) INTO v_set_count
  FROM workout_sets s
  WHERE s.workout_exercise_id = ANY (v_src_ids);
  IF v_set_count > 5000 THEN
    RAISE EXCEPTION 'invalid_input';
  END IF;

  -- Active-session PRECHECK, using the exact predicate of migration
  -- 008's partial unique index (a reopened correction — in_progress
  -- with completed_duration_seconds set — is deliberately not an
  -- active workout, matching findActiveTrainingSession). This covers
  -- the common case as data the conflict modal needs.
  SELECT ws.id INTO v_active_id
  FROM workout_sessions ws
  WHERE ws.user_id = v_uid
    AND ws.status = 'in_progress'
    AND ws.completed_duration_seconds IS NULL
  LIMIT 1;
  IF v_active_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'error', 'active_workout_exists',
      'active_workout_id', v_active_id
    );
  END IF;

  -- Session copy: NEW identity; the source title is reused (it names
  -- the workout's content); routine_id is NULL by product decision;
  -- start_time is a real UTC instant; the caller supplies the
  -- user-local calendar date. Historical date, duration, end_time,
  -- notes, and completion state are never copied.
  -- The RACE window (two tabs passing the precheck simultaneously)
  -- is closed by migration 008's partial unique index on this very
  -- insert — it fires before any child rows exist, and the expected
  -- outcome returns as data for the existing conflict modal.
  BEGIN
    INSERT INTO workout_sessions (
      user_id, workout_date, title, status, start_time, source, routine_id
    ) VALUES (
      v_uid, p_workout_date, v_source.title, 'in_progress', NOW(), 'live', NULL
    )
    RETURNING id INTO v_session_id;
  EXCEPTION WHEN unique_violation THEN
    IF SQLERRM LIKE '%workout_sessions_one_active_training_per_user_idx%' THEN
      SELECT ws.id INTO v_active_id
      FROM workout_sessions ws
      WHERE ws.user_id = v_uid
        AND ws.status = 'in_progress'
        AND ws.completed_duration_seconds IS NULL
      LIMIT 1;
      RETURN jsonb_build_object(
        'error', 'active_workout_exists',
        'active_workout_id', v_active_id
      );
    END IF;
    RAISE;
  END;

  -- Exercise copy: positions come from the captured array's
  -- ordinality (0-based), and the explicit target columns copy
  -- VERBATIM — NULL vs zero preserved exactly. Exercise notes are
  -- never copied. Every captured row is guaranteed present and
  -- unchanged by the FOR UPDATE locks above, so the resulting order
  -- is dense and exact: positions 0..n-1 with no vacancies.
  INSERT INTO workout_exercises (
    workout_session_id, exercise_id, order_index,
    target_sets, target_reps, target_reps_min, target_reps_max,
    target_weight_kg
  )
  SELECT
    v_session_id,
    we.exercise_id,
    (src.ord - 1)::smallint,
    we.target_sets, we.target_reps, we.target_reps_min,
    we.target_reps_max, we.target_weight_kg
  FROM unnest(v_src_ids) WITH ORDINALITY AS src(id, ord)
  JOIN workout_exercises we ON we.id = src.id;

  -- Set skeleton copy: set COUNT, deterministic set ORDER, and each
  -- ordered row's warmup identity are preserved — but numbering is
  -- NORMALIZED, not copied: dense 1..N per exercise via ROW_NUMBER
  -- over the deterministic (set_number, id) source order (the same
  -- tiebreak the 021 resequencer uses). A legacy source numbered
  -- 2,3 or 1,3,7 — or carrying duplicates — therefore seeds a new
  -- workout that already satisfies UI-5B1B's contiguous-numbering
  -- invariant; an already-contiguous source is reproduced unchanged.
  -- EVERY value field (reps, weight_kg, rpe, duration_seconds,
  -- distance_meters) is NULL, completed = false, notes NULL — logged
  -- performance (including logged zeros) never becomes an editable
  -- starting value; the Last/Recent reference UI is the only place
  -- history appears. New exercises match their source through the
  -- SAME captured array positions used above, never a re-read of
  -- source order; the locked source rows cannot move or vanish while
  -- this runs.
  INSERT INTO workout_sets (
    workout_exercise_id, set_number,
    reps, weight_kg, rpe, duration_seconds, distance_meters,
    completed, is_warmup, notes
  )
  SELECT
    new_we.id,
    (ROW_NUMBER() OVER (
       PARTITION BY src.id
       ORDER BY s.set_number, s.id
     ))::smallint,
    NULL, NULL, NULL, NULL, NULL,
    false, s.is_warmup, NULL
  FROM unnest(v_src_ids) WITH ORDINALITY AS src(id, ord)
  JOIN workout_exercises new_we
    ON new_we.workout_session_id = v_session_id
   AND new_we.order_index = (src.ord - 1)::smallint
  JOIN workout_sets s ON s.workout_exercise_id = src.id;

  RETURN jsonb_build_object('session_id', v_session_id);
END;
$$;

COMMENT ON FUNCTION repeat_workout(UUID, DATE) IS
  'UI-5B2: copies a completed workout into a new in-progress session in one transaction — exercise order, explicit target columns, set count, deterministic set order, and warmup identity, with DENSE 1..N set numbering per exercise (normalized via ROW_NUMBER over (set_number, id), never copied verbatim). Every new set has NULL values and completed=false; notes are never copied; routine_id is NULL; the source is never written. Active-workout conflicts return {"error":"active_workout_exists","active_workout_id":...} via the precheck or migration 008''s partial unique index.';


-- ── Grants ───────────────────────────────────────────────────────

REVOKE ALL ON FUNCTION create_routine_from_workout(UUID, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION repeat_workout(UUID, DATE) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION create_routine_from_workout(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION repeat_workout(UUID, DATE) TO authenticated;

NOTIFY pgrst, 'reload schema';
