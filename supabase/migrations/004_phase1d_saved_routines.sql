-- ============================================================
-- ShredOS Phase 1D — Saved Workout Routines
-- 004_phase1d_saved_routines.sql
-- ============================================================
-- Run AFTER 003_phase1c_workout_logging.sql.
-- Requires update_updated_at_column() from Phase 1A.
-- ============================================================

-- ── workout_routines ──────────────────────────────────────────────
CREATE TABLE workout_routines (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name                       TEXT NOT NULL,
  description                TEXT,
  goal                       TEXT CHECK (goal IN (
                               'strength','hypertrophy','endurance',
                               'conditioning','mobility','mixed')),
  primary_muscle_focus       TEXT CHECK (primary_muscle_focus IN (
                               'chest','back','legs','shoulders',
                               'arms','core','full_body','other')),
  difficulty                 TEXT CHECK (difficulty IN (
                               'beginner','intermediate','advanced')),
  estimated_duration_minutes SMALLINT,
  is_active                  BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER workout_routines_updated_at
  BEFORE UPDATE ON workout_routines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Unique routine name per user (case-insensitive)
CREATE UNIQUE INDEX workout_routines_user_name_idx
  ON workout_routines (user_id, lower(name));

CREATE INDEX workout_routines_user_active_idx
  ON workout_routines (user_id, is_active);


-- ── workout_routine_exercises ────────────────────────────────────
-- References existing exercises rows — no duplicate exercise definitions.
-- ON DELETE RESTRICT on exercise_id: remove from routine before deleting exercise.
CREATE TABLE workout_routine_exercises (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id  UUID NOT NULL REFERENCES workout_routines(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,

  order_index      SMALLINT NOT NULL DEFAULT 0,
  target_sets      SMALLINT,
  target_reps_min  SMALLINT,
  target_reps_max  SMALLINT,
  -- stored in kg; UI accepts and displays lbs (same as all Phase 1C weights)
  target_weight_kg NUMERIC(6,2),
  target_rpe       NUMERIC(3,1) CHECK (target_rpe BETWEEN 1 AND 10),
  rest_seconds     SMALLINT,
  notes            TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER workout_routine_exercises_updated_at
  BEFORE UPDATE ON workout_routine_exercises
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX workout_routine_exercises_routine_idx
  ON workout_routine_exercises (routine_id, order_index);

CREATE INDEX workout_routine_exercises_exercise_idx
  ON workout_routine_exercises (exercise_id);


-- ── Add routine_id to workout_sessions ───────────────────────────
-- Non-destructive: existing sessions get routine_id = NULL.
-- ON DELETE SET NULL: deleting a routine nullifies the link on sessions
-- but preserves all workout history.
ALTER TABLE workout_sessions
  ADD COLUMN routine_id UUID REFERENCES workout_routines(id) ON DELETE SET NULL;

CREATE INDEX workout_sessions_routine_idx
  ON workout_sessions (routine_id)
  WHERE routine_id IS NOT NULL;


-- ── Row Level Security ────────────────────────────────────────────

ALTER TABLE workout_routines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workout_routines_all" ON workout_routines
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE workout_routine_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workout_routine_exercises_all" ON workout_routine_exercises
  FOR ALL USING (
    routine_id IN (SELECT id FROM workout_routines WHERE user_id = auth.uid())
  );


-- ── Grants ───────────────────────────────────────────────────────

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_routines          TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_routine_exercises TO authenticated;

NOTIFY pgrst, 'reload schema';
