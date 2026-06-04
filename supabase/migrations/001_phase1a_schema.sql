-- ============================================================
-- ShredOS Phase 1A — Database Migration
-- 001_phase1a_schema.sql
-- ============================================================
-- Run this in: Supabase → SQL Editor, OR via `supabase db push`
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Shared trigger: auto-update updated_at ────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- TABLE: user_profiles
-- ============================================================
CREATE TABLE user_profiles (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- identity
  display_name                TEXT NOT NULL,
  age                         SMALLINT CHECK (age BETWEEN 13 AND 120),
  sex                         TEXT CHECK (sex IN ('male', 'female', 'other', 'prefer_not_to_say')),

  -- body stats — stored metric, displayed imperial in UI
  height_cm                   NUMERIC(5,1),     -- UI: feet/inches → stored as cm
  current_weight_kg           NUMERIC(6,2),     -- UI: lbs → stored as kg
  goal_weight_kg              NUMERIC(6,2),
  bf_pct                      NUMERIC(4,1) CHECK (bf_pct BETWEEN 1 AND 70),
  goal_bf_pct                 NUMERIC(4,1) CHECK (goal_bf_pct BETWEEN 1 AND 70),

  -- training context
  training_experience         TEXT CHECK (training_experience IN ('beginner', 'intermediate', 'advanced')),
  main_goal                   TEXT CHECK (main_goal IN ('fat_loss', 'muscle_gain', 'strength', 'recomposition', 'maintenance', 'running')),
  activity_level              TEXT CHECK (activity_level IN ('sedentary', 'moderately_active', 'very_active')),
  step_goal                   INTEGER DEFAULT 8000 CHECK (step_goal BETWEEN 1000 AND 50000),
  dietary_prefs               JSONB NOT NULL DEFAULT '[]',
  allergies                   JSONB NOT NULL DEFAULT '[]',
  injuries                    TEXT,
  notes                       TEXT,

  -- weigh-in preferences
  preferred_weigh_in_cadence  TEXT NOT NULL DEFAULT 'weekly'
                              CHECK (preferred_weigh_in_cadence IN ('weekly', 'biweekly', 'manual')),
  preferred_weigh_in_day      SMALLINT NOT NULL DEFAULT 5  -- 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
                              CHECK (preferred_weigh_in_day BETWEEN 0 AND 6),
  preferred_weigh_in_time     TEXT NOT NULL DEFAULT 'morning'
                              CHECK (preferred_weigh_in_time IN ('morning', 'evening')),

  -- fasting preferences
  fasting_enabled             BOOLEAN NOT NULL DEFAULT false,
  default_fasting_goal_hours  NUMERIC(4,1) CHECK (default_fasting_goal_hours BETWEEN 1 AND 96),
  fasting_notes               TEXT,

  -- onboarding state
  onboarding_complete         BOOLEAN NOT NULL DEFAULT false,

  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- TABLE: body_metrics
-- ============================================================
-- NOTE: BMI is NOT stored here. Height is in user_profiles.
-- BMI is calculated in the application: weight_kg / (height_m^2)
-- ============================================================
CREATE TABLE body_metrics (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logged_date      DATE NOT NULL,

  -- weight stored in kg; UI always shows lbs
  weight_kg        NUMERIC(6,2),

  -- optional body composition
  bf_pct           NUMERIC(4,1) CHECK (bf_pct BETWEEN 1 AND 70),

  -- optional measurements (cm)
  waist_cm         NUMERIC(5,1),
  chest_cm         NUMERIC(5,1),
  arms_cm          NUMERIC(5,1),
  thighs_cm        NUMERIC(5,1),
  hips_cm          NUMERIC(5,1),

  -- vitals
  rhr              SMALLINT CHECK (rhr BETWEEN 20 AND 200),
  sleep_hr         NUMERIC(3,1) CHECK (sleep_hr BETWEEN 0 AND 24),

  -- subjective scores 1–5
  energy_1_5       SMALLINT CHECK (energy_1_5 BETWEEN 1 AND 5),
  hunger_1_5       SMALLINT CHECK (hunger_1_5 BETWEEN 1 AND 5),
  mood_1_5         SMALLINT CHECK (mood_1_5 BETWEEN 1 AND 5),

  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- one entry per user per date
  CONSTRAINT body_metrics_user_date_unique UNIQUE (user_id, logged_date)
);

CREATE TRIGGER body_metrics_updated_at
  BEFORE UPDATE ON body_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Performance index for dashboard queries (latest entry first)
CREATE INDEX body_metrics_user_date_idx
  ON body_metrics (user_id, logged_date DESC);


-- ============================================================
-- TABLE: nutrition_targets
-- ============================================================
-- Versioned by effective_date. The currently active row is the
-- most recent row WHERE effective_date <= CURRENT_DATE.
-- ============================================================
CREATE TABLE nutrition_targets (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  effective_date   DATE NOT NULL DEFAULT CURRENT_DATE,

  -- daily targets
  calories         INTEGER NOT NULL CHECK (calories BETWEEN 500 AND 10000),
  protein_g        INTEGER NOT NULL CHECK (protein_g BETWEEN 0 AND 1000),
  fat_g            INTEGER NOT NULL CHECK (fat_g BETWEEN 0 AND 500),
  carbs_g          INTEGER NOT NULL CHECK (carbs_g >= 0),
  fiber_g          INTEGER CHECK (fiber_g >= 0),
  water_ml         INTEGER DEFAULT 2500 CHECK (water_ml >= 0),

  -- context that generated these targets (for audit + coach)
  maintenance_cal  INTEGER,
  deficit          INTEGER,           -- negative = surplus
  activity_level   TEXT CHECK (activity_level IN ('sedentary', 'moderately_active', 'very_active')),
  multiplier_used  NUMERIC(4,2),      -- 10 / 12 / 14
  protein_basis    TEXT CHECK (protein_basis IN ('bodyweight', 'lean_mass')),
  low_carb_warning BOOLEAN NOT NULL DEFAULT false,
  notes            TEXT,

  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- one target version per user per date
  CONSTRAINT nutrition_targets_user_date_unique UNIQUE (user_id, effective_date)
);

CREATE TRIGGER nutrition_targets_updated_at
  BEFORE UPDATE ON nutrition_targets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX nutrition_targets_user_effective_date_idx
  ON nutrition_targets (user_id, effective_date DESC);


-- ============================================================
-- TABLE: fasting_logs
-- ============================================================
-- duration_minutes is NOT stored — calculated in app from
-- (ended_at - started_at). A SQL view can be added in Phase 2
-- if aggregate queries need it.
-- ============================================================
CREATE TABLE fasting_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  started_at       TIMESTAMPTZ NOT NULL,
  ended_at         TIMESTAMPTZ,              -- NULL = fast is currently active

  fasting_type     TEXT NOT NULL DEFAULT 'intermittent'
                   CHECK (fasting_type IN ('overnight', 'intermittent', 'extended', 'custom')),
  goal_hours       NUMERIC(4,1) CHECK (goal_hours BETWEEN 1 AND 96),
  completed_goal   BOOLEAN,                  -- set when fast ends

  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER fasting_logs_updated_at
  BEFORE UPDATE ON fasting_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- DB-level guard: only one active fast per user at a time
-- ended_at IS NULL means "currently active"
CREATE UNIQUE INDEX fasting_logs_one_active_fast_per_user
  ON fasting_logs (user_id)
  WHERE ended_at IS NULL;

-- Performance indexes
CREATE INDEX fasting_logs_user_started_idx
  ON fasting_logs (user_id, started_at DESC);

-- Fast lookup for "is there an active fast?" queries
CREATE INDEX fasting_logs_active_idx
  ON fasting_logs (user_id, ended_at)
  WHERE ended_at IS NULL;


-- ============================================================
-- TABLE: decision_logs
-- ============================================================
-- Every meaningful coaching recommendation or target change
-- is logged here. Nothing changes silently.
-- ============================================================
CREATE TABLE decision_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- classification
  decision_type    TEXT NOT NULL,
  -- Examples: 'nutrition_targets_set', 'nutrition_targets_updated',
  --           'calorie_adjustment', 'step_goal_changed', 'fasting_goal_changed',
  --           'weigh_in_cadence_changed', 'no_change_low_confidence',
  --           'protein_target_change', 'training_adjustment'

  decision_title   TEXT NOT NULL,       -- short: "Calories decreased to 2,100"
  decision_summary TEXT NOT NULL,       -- one sentence: "Calorie target reduced by 150..."
  reason           TEXT NOT NULL,       -- full reasoning shown to user

  -- data that triggered this decision (snapshot at time of creation)
  data_snapshot    JSONB,               -- {weigh_in_count, avg_weight_kg, avg_cal, confidence, ...}
  previous_value   JSONB,               -- {calories: 2250}
  new_value        JSONB,               -- {calories: 2100}

  -- lifecycle
  status           TEXT NOT NULL DEFAULT 'suggested'
                   CHECK (status IN ('suggested', 'accepted', 'dismissed', 'applied', 'reversed')),

  created_by       TEXT NOT NULL DEFAULT 'system'
                   CHECK (created_by IN ('user', 'system', 'coach')),

  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  applied_at       TIMESTAMPTZ,
  notes            TEXT
);

CREATE TRIGGER decision_logs_updated_at
  BEFORE UPDATE ON decision_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX decision_logs_user_created_idx
  ON decision_logs (user_id, created_at DESC);

CREATE INDEX decision_logs_user_status_idx
  ON decision_logs (user_id, status)
  WHERE status = 'suggested';


-- ============================================================
-- ROW LEVEL SECURITY — all user-owned tables
-- ============================================================

-- user_profiles: explicit per-operation (delete needs care)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profile_select" ON user_profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "profile_insert" ON user_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "profile_update" ON user_profiles
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "profile_delete" ON user_profiles
  FOR DELETE USING (user_id = auth.uid());

-- body_metrics
ALTER TABLE body_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "metrics_all" ON body_metrics
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- nutrition_targets
ALTER TABLE nutrition_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nutrition_all" ON nutrition_targets
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- fasting_logs
ALTER TABLE fasting_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fasting_all" ON fasting_logs
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- decision_logs
ALTER TABLE decision_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "decisions_all" ON decision_logs
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
