-- ============================================================
-- ShredOS Phase 1B — Food Logging Migration
-- 002_phase1b_food_logging.sql
-- ============================================================
-- Run AFTER 001_phase1a_schema.sql.
-- Requires the update_updated_at_column() trigger function from Phase 1A.
-- ============================================================

-- ── saved_meals (created first — food_logs references it) ────────
CREATE TABLE saved_meals (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name                TEXT NOT NULL,
  meal_type_default   TEXT CHECK (meal_type_default IN (
                        'breakfast','lunch','dinner','snack','supplement','drink'
                      )),

  -- macro totals for the whole saved meal
  calories            INTEGER NOT NULL CHECK (calories >= 0),
  protein_g           NUMERIC(6,1) NOT NULL DEFAULT 0 CHECK (protein_g >= 0),
  carbs_g             NUMERIC(6,1) NOT NULL DEFAULT 0 CHECK (carbs_g >= 0),
  fat_g               NUMERIC(6,1) NOT NULL DEFAULT 0 CHECK (fat_g >= 0),
  fiber_g             NUMERIC(5,1) CHECK (fiber_g >= 0),
  sugar_g             NUMERIC(5,1) CHECK (sugar_g >= 0),
  sodium_mg           INTEGER CHECK (sodium_mg >= 0),

  -- Phase 2C: stores [{name, serving, calories, protein_g, carbs_g, fat_g, food_item_id?}]
  items               JSONB NOT NULL DEFAULT '[]',

  is_autopilot        BOOLEAN NOT NULL DEFAULT false,
  notes               TEXT,

  -- usage tracking for sorting (incremented on quick-add)
  use_count           INTEGER NOT NULL DEFAULT 0,
  last_used_at        TIMESTAMPTZ,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER saved_meals_updated_at
  BEFORE UPDATE ON saved_meals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sort: autopilot first, then by usage frequency
CREATE INDEX saved_meals_user_autopilot_idx
  ON saved_meals (user_id, is_autopilot DESC, use_count DESC);

-- Required: unique meal name per user (case-insensitive)
CREATE UNIQUE INDEX saved_meals_user_name_unique_idx
  ON saved_meals (user_id, lower(name));


-- ── food_logs ────────────────────────────────────────────────────
-- duration_minutes and other Phase 1A patterns are not reused here.
-- Phase 2C will add food_item_id and calculation_method as nullable
-- columns alongside saved_meal_id — no changes to this schema needed.
-- ── Quick-add behavior: macros are COPIED at log time.
--    Later edits to saved_meal do NOT alter past food_logs.
--    saved_meal_id is traceability only (ON DELETE SET NULL).
-- ────────────────────────────────────────────────────────────────

CREATE TABLE food_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  logged_date         DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_type           TEXT NOT NULL CHECK (meal_type IN (
                        'breakfast','lunch','dinner','snack','supplement','drink'
                      )),

  food_name           TEXT NOT NULL,
  serving_description TEXT,       -- "1 cup", "2 scoops", "1 bar" — free text in Phase 1B

  -- required macros
  calories            INTEGER NOT NULL CHECK (calories >= 0),
  protein_g           NUMERIC(6,1) NOT NULL DEFAULT 0 CHECK (protein_g >= 0),
  carbs_g             NUMERIC(6,1) NOT NULL DEFAULT 0 CHECK (carbs_g >= 0),
  fat_g               NUMERIC(6,1) NOT NULL DEFAULT 0 CHECK (fat_g >= 0),

  -- optional micros
  fiber_g             NUMERIC(5,1) CHECK (fiber_g >= 0),
  sugar_g             NUMERIC(5,1) CHECK (sugar_g >= 0),
  sodium_mg           INTEGER CHECK (sodium_mg >= 0),

  -- traceability: which saved_meal this was quick-added from (if any)
  -- Phase 2C adds: food_item_id UUID REFERENCES food_items(id) ON DELETE SET NULL
  saved_meal_id       UUID REFERENCES saved_meals(id) ON DELETE SET NULL,

  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER food_logs_updated_at
  BEFORE UPDATE ON food_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Primary access pattern: all entries for a user on a date
CREATE INDEX food_logs_user_date_idx
  ON food_logs (user_id, logged_date DESC);

-- Meal-type filtering within a day
CREATE INDEX food_logs_user_date_meal_idx
  ON food_logs (user_id, logged_date, meal_type);

-- Required: traceability queries for saved_meal origin
CREATE INDEX food_logs_user_saved_meal_idx
  ON food_logs (user_id, saved_meal_id)
  WHERE saved_meal_id IS NOT NULL;


-- ── Row Level Security ────────────────────────────────────────────

ALTER TABLE saved_meals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saved_meals_all" ON saved_meals
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "food_logs_all" ON food_logs
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ── Grants (required for PostgREST / Supabase client access) ─────

GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_meals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.food_logs TO authenticated;

NOTIFY pgrst, 'reload schema';
