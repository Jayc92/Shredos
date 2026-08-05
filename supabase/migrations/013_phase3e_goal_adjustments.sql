-- ============================================================
-- 013_phase3e_goal_adjustments.sql
-- Phase 3E: atomic user-approved calorie adjustment.
--
-- A target change and its Applied decision must succeed or fail
-- TOGETHER ("nothing changes silently"). This single PL/pgSQL
-- function performs the target-version upsert and the decision
-- insert in one transaction: any failure (including either write)
-- raises and rolls back both.
--
-- SECURITY INVOKER (deliberate): the function runs as the calling
-- authenticated role, so the existing RLS policies ("nutrition_all",
-- "decisions_all" — both FOR ALL, user-scoped) fully apply to both
-- writes. No policy is weakened or replaced; explicit auth.uid()
-- checks are kept as belt-and-suspenders. SECURITY DEFINER is not
-- needed and therefore not used. No service-role involvement.
--
-- Concurrency/idempotency: a per-user transaction-scoped advisory
-- lock serializes simultaneous applies. The loser of a double-click
-- re-reads the (now updated) authoritative target after the winner
-- commits, fails the expected-calories check, and aborts with
-- 'stale_target' — never a second target version, never a second
-- decision. No permanent uniqueness constraint is added, so future
-- legitimate adjustments stay possible.
--
-- The database revalidates what it can enforce structurally: caller
-- identity, ownership, the expected current target, and the +/-100
-- or +/-200 step. Domain eligibility (bands, coverage, cooldowns) is
-- recomputed by the API from fresh data BEFORE calling this function
-- — a client "eligible" flag is never trusted at either layer.
-- Macros are read from the authoritative current row INSIDE the
-- transaction (never from the client), so protein, carbohydrates,
-- and fat are preserved by construction.
-- ============================================================

CREATE OR REPLACE FUNCTION apply_goal_calorie_adjustment(
  p_effective_date    DATE,
  p_expected_calories INTEGER,
  p_proposed_calories INTEGER,
  p_decision_title    TEXT,
  p_decision_summary  TEXT,
  p_reason            TEXT,
  p_data_snapshot     JSONB,
  p_review_on         DATE
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_uid      UUID;
  v_current  nutrition_targets%ROWTYPE;
  v_target   nutrition_targets%ROWTYPE;
  v_decision decision_logs%ROWTYPE;
BEGIN
  -- 1. Caller must be an authenticated user.
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- Serialize concurrent applies for this user for the duration of
  -- the transaction (released automatically on commit/rollback).
  PERFORM pg_advisory_xact_lock(
    hashtext('goal_calorie_adjustment'),
    hashtext(v_uid::text)
  );

  -- 2./3. Load the authoritative current target (owned rows only via
  -- RLS AND the explicit user_id predicate) and verify it still
  -- matches what the user approved. A newer version — including one
  -- committed by a concurrent request while we waited on the lock —
  -- fails this check and aborts everything.
  SELECT * INTO v_current
  FROM nutrition_targets
  WHERE user_id = v_uid
    AND effective_date <= p_effective_date
  ORDER BY effective_date DESC
  LIMIT 1;

  IF NOT FOUND OR v_current.calories <> p_expected_calories THEN
    RAISE EXCEPTION 'stale_target';
  END IF;

  -- 4. Only the conservative round steps are ever accepted.
  IF abs(p_proposed_calories - p_expected_calories) NOT IN (100, 200) THEN
    RAISE EXCEPTION 'invalid_adjustment';
  END IF;

  -- 5./6. New target version via the existing per-user-per-date
  -- versioning convention. Protein, carbohydrates, and fat come from
  -- the authoritative row read above — preserved by construction.
  INSERT INTO nutrition_targets (
    user_id, effective_date, calories, protein_g, carbs_g, fat_g,
    low_carb_warning, notes
  ) VALUES (
    v_uid, p_effective_date, p_proposed_calories,
    v_current.protein_g, v_current.carbs_g, v_current.fat_g,
    v_current.carbs_g < 75, 'Applied from the goal adjustment review.'
  )
  ON CONFLICT ON CONSTRAINT nutrition_targets_user_date_unique
  DO UPDATE SET
    calories         = EXCLUDED.calories,
    protein_g        = EXCLUDED.protein_g,
    carbs_g          = EXCLUDED.carbs_g,
    fat_g            = EXCLUDED.fat_g,
    low_carb_warning = EXCLUDED.low_carb_warning,
    notes            = EXCLUDED.notes,
    updated_at       = NOW()
  RETURNING * INTO v_target;

  -- 7. Exactly one Applied decision, in the same transaction.
  -- follow_through_status keeps its Phase 3D column default
  -- ('not_started'); outcome and reviewed_at stay NULL.
  INSERT INTO decision_logs (
    user_id, decision_type, decision_title, decision_summary, reason,
    data_snapshot, previous_value, new_value,
    status, created_by, applied_at, review_on
  ) VALUES (
    v_uid, 'calorie_adjustment', p_decision_title, p_decision_summary, p_reason,
    p_data_snapshot,
    jsonb_build_object('calories', p_expected_calories),
    jsonb_build_object('calories', p_proposed_calories),
    'applied', 'user', NOW(), p_review_on
  )
  RETURNING * INTO v_decision;

  -- 8. Both rows back to the caller. 9. Any raise above (or any
  -- write failure) rolls the whole function's transaction back —
  -- no target change can ever exist without its Applied decision.
  RETURN jsonb_build_object(
    'target', to_jsonb(v_target),
    'decision', to_jsonb(v_decision)
  );
END;
$$;

-- Least privilege: only authenticated users may execute.
REVOKE ALL ON FUNCTION apply_goal_calorie_adjustment(DATE, INTEGER, INTEGER, TEXT, TEXT, TEXT, JSONB, DATE) FROM PUBLIC;
REVOKE ALL ON FUNCTION apply_goal_calorie_adjustment(DATE, INTEGER, INTEGER, TEXT, TEXT, TEXT, JSONB, DATE) FROM anon;
GRANT EXECUTE ON FUNCTION apply_goal_calorie_adjustment(DATE, INTEGER, INTEGER, TEXT, TEXT, TEXT, JSONB, DATE) TO authenticated;
