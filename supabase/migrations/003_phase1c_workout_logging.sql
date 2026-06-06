-- ============================================================
-- ShredOS Phase 1C — Workout Logging Migration
-- 003_phase1c_workout_logging.sql
-- ============================================================
-- Run AFTER 002_phase1b_food_logging.sql.
-- Requires update_updated_at_column() from Phase 1A.
-- ============================================================

-- ── exercises ────────────────────────────────────────────────────
CREATE TABLE exercises (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name              TEXT NOT NULL,
  category          TEXT CHECK (category IN ('compound','isolation','cardio','mobility','other')),

  primary_muscle    TEXT NOT NULL CHECK (primary_muscle IN (
    'chest','back','shoulders','biceps','triceps','forearms',
    'core','quads','hamstrings','glutes','calves','full_body','other'
  )),
  secondary_muscles JSONB NOT NULL DEFAULT '[]',

  equipment         TEXT CHECK (equipment IN (
    'barbell','dumbbell','cable','machine',
    'bodyweight','resistance_band','kettlebell','other'
  )),
  exercise_type     TEXT NOT NULL DEFAULT 'strength' CHECK (exercise_type IN (
    'strength','bodyweight','machine','cable',
    'dumbbell','barbell','cardio','mobility'
  )),

  unilateral        BOOLEAN NOT NULL DEFAULT false,
  notes             TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  is_system         BOOLEAN NOT NULL DEFAULT false,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER exercises_updated_at
  BEFORE UPDATE ON exercises
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE UNIQUE INDEX exercises_user_name_unique_idx
  ON exercises (user_id, lower(name));

CREATE INDEX exercises_user_muscle_idx
  ON exercises (user_id, primary_muscle)
  WHERE is_active = true;


-- ── workout_sessions ─────────────────────────────────────────────
CREATE TABLE workout_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  workout_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  title         TEXT NOT NULL DEFAULT '',
  status        TEXT NOT NULL DEFAULT 'in_progress'
                CHECK (status IN ('planned','in_progress','completed','skipped')),
  start_time    TIMESTAMPTZ,
  end_time      TIMESTAMPTZ,
  notes         TEXT,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER workout_sessions_updated_at
  BEFORE UPDATE ON workout_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX workout_sessions_user_date_idx
  ON workout_sessions (user_id, workout_date DESC);


-- ── workout_exercises ─────────────────────────────────────────────
CREATE TABLE workout_exercises (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_session_id  UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id         UUID NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,

  order_index         SMALLINT NOT NULL DEFAULT 0,
  target_sets         SMALLINT,
  target_reps         SMALLINT,
  target_weight_kg    NUMERIC(6,2),
  notes               TEXT,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER workout_exercises_updated_at
  BEFORE UPDATE ON workout_exercises
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX workout_exercises_session_order_idx
  ON workout_exercises (workout_session_id, order_index);

CREATE INDEX workout_exercises_exercise_idx
  ON workout_exercises (exercise_id);


-- ── workout_sets ──────────────────────────────────────────────────
CREATE TABLE workout_sets (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_exercise_id UUID NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,

  set_number          SMALLINT NOT NULL,
  weight_kg           NUMERIC(6,2),
  reps                SMALLINT,
  rpe                 NUMERIC(3,1) CHECK (rpe BETWEEN 1 AND 10),
  completed           BOOLEAN NOT NULL DEFAULT false,
  is_warmup           BOOLEAN NOT NULL DEFAULT false,
  notes               TEXT,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX workout_sets_exercise_idx
  ON workout_sets (workout_exercise_id, set_number);


-- ── Row Level Security ────────────────────────────────────────────

ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exercises_all" ON exercises
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workout_sessions_all" ON workout_sessions
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workout_exercises_all" ON workout_exercises
  FOR ALL USING (
    workout_session_id IN (
      SELECT id FROM workout_sessions WHERE user_id = auth.uid()
    )
  );

ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workout_sets_all" ON workout_sets
  FOR ALL USING (
    workout_exercise_id IN (
      SELECT we.id FROM workout_exercises we
      JOIN workout_sessions ws ON we.workout_session_id = ws.id
      WHERE ws.user_id = auth.uid()
    )
  );


-- ── Grants ───────────────────────────────────────────────────────

GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercises         TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_sessions  TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_exercises TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_sets      TO authenticated;

NOTIFY pgrst, 'reload schema';
