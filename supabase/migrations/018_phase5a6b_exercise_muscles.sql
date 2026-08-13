-- ============================================================
-- ForgeFitOS Phase 5A.6B — Exercise Anatomy + Multi-Muscle Targeting
-- 018_phase5a6b_exercise_muscles.sql
-- ============================================================
-- Run AFTER 017 (daily activity distance).
--
-- Upgrades the anatomy model: a widened 25-value canonical muscle
-- vocabulary and a normalized exercise_muscles relationship table
-- for secondary/tertiary targets. The PRIMARY target deliberately
-- stays on exercises.primary_muscle (exactly-one-primary remains
-- structurally guaranteed and every existing consumer keeps
-- resolving anatomy through exercise_id).
--
-- Taxonomy notes:
--   - broad values 'back', 'shoulders', 'core' REMAIN valid: existing
--     rows are honestly broad and are never guess-mapped to specifics
--   - no 'thigh' (anatomically ambiguous: quads/hamstrings/adductors
--     are the useful groups), no 'cardio' (a category/tracking
--     concept, not a muscle), no upper/lower chest (variation
--     concepts, not separate muscles)
--   - roles are 'secondary'/'tertiary' ONLY; contribution weights are
--     deliberately NOT stored -- the future Coach defines weights
--     centrally so re-tuning never rewrites relationship rows
--
-- CRITICAL SAFETY RULE: exercises.secondary_muscles JSONB is NOT
-- dropped. It is backfilled into exercise_muscles below and becomes
-- DEPRECATED, application-read-only rollback insurance. The app
-- neither writes it nor treats it as authoritative after 5A.6B
-- (no dual-write -- drift would defeat the safety purpose). A later
-- cleanup migration may drop it only after a stable checkpoint and
-- physical QA prove the join-table model.
-- ============================================================

-- 1. Widen the primary_muscle vocabulary (pure widening: every
--    existing value remains valid; no rows are rewritten).
ALTER TABLE public.exercises
  DROP CONSTRAINT exercises_primary_muscle_check;

ALTER TABLE public.exercises
  ADD CONSTRAINT exercises_primary_muscle_check CHECK (primary_muscle IN (
    -- upper
    'chest', 'lats', 'upper_back', 'lower_back', 'traps',
    'front_delts', 'side_delts', 'rear_delts',
    'biceps', 'triceps', 'forearms',
    -- lower
    'quads', 'hamstrings', 'glutes', 'calves',
    'hip_flexors', 'adductors', 'abductors',
    -- core
    'abs', 'obliques',
    -- retained broad values
    'back', 'shoulders', 'core',
    -- other
    'full_body', 'other'
  ));

-- 2. Secondary/tertiary relationship table. No updated_at: rows use
--    replace-not-update semantics (edits are a safe delete+insert of
--    the exercise's relationship set).
CREATE TABLE exercise_muscles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id      UUID NOT NULL
               REFERENCES auth.users(id)
               ON DELETE CASCADE,

  exercise_id  UUID NOT NULL
               REFERENCES exercises(id)
               ON DELETE CASCADE,

  muscle       TEXT NOT NULL
               CHECK (muscle IN (
                 'chest', 'lats', 'upper_back', 'lower_back', 'traps',
                 'front_delts', 'side_delts', 'rear_delts',
                 'biceps', 'triceps', 'forearms',
                 'quads', 'hamstrings', 'glutes', 'calves',
                 'hip_flexors', 'adductors', 'abductors',
                 'abs', 'obliques',
                 'back', 'shoulders', 'core',
                 'full_body', 'other'
               )),

  -- Primary rows never live here (exercises.primary_muscle owns
  -- exactly-one-primary structurally).
  role         TEXT NOT NULL
               CHECK (role IN ('secondary', 'tertiary')),

  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One row per exercise+muscle: a muscle cannot appear twice on one
  -- exercise (in any role). The unique constraint's backing btree
  -- index leads on exercise_id, so it ALSO serves every query in the
  -- app (embedded reads and the edit-time delete are both keyed on
  -- exercise_id) -- a separate exercise_muscles_exercise_idx would be
  -- pure duplication, so none is created (smallest useful index).
  UNIQUE (exercise_id, muscle)
);

-- 3. Own-row RLS (the established per-operation pattern).
ALTER TABLE exercise_muscles ENABLE ROW LEVEL SECURITY;

CREATE POLICY exercise_muscles_select_own
  ON exercise_muscles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY exercise_muscles_insert_own
  ON exercise_muscles FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY exercise_muscles_update_own
  ON exercise_muscles FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY exercise_muscles_delete_own
  ON exercise_muscles FOR DELETE
  USING (user_id = auth.uid());

-- 4. Table privileges (RLS policies alone grant nothing -- the
--    migration-015/016 lesson). Nothing to anon; no service role.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercise_muscles TO authenticated;

-- 5. Backfill: every existing JSONB secondary entry becomes one
--    secondary relationship row. user_id and exercise_id are
--    preserved from the owning exercise; no tertiary roles are
--    fabricated; broad values are preserved verbatim. Empty arrays
--    produce no rows. ON CONFLICT guards duplicate entries inside a
--    single legacy array.
INSERT INTO exercise_muscles (user_id, exercise_id, muscle, role)
SELECT e.user_id, e.id, m.value, 'secondary'
FROM public.exercises e,
     LATERAL jsonb_array_elements_text(e.secondary_muscles) AS m(value)
WHERE e.secondary_muscles IS NOT NULL
  AND jsonb_typeof(e.secondary_muscles) = 'array'
ON CONFLICT (exercise_id, muscle) DO NOTHING;

NOTIFY pgrst, 'reload schema';
