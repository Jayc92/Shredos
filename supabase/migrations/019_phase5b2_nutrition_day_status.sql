-- ============================================================
-- ForgeFitOS Phase 5B.2 — Explicit Nutrition-Day Completion
-- 019_phase5b2_nutrition_day_status.sql
-- ============================================================
-- Run AFTER 018 (exercise anatomy).
--
-- One row means exactly one thing: "this user explicitly marked
-- this nutrition day complete" ("Finished logging today"). The
-- ABSENCE of a row means unknown / not-explicitly-complete — never
-- explicitly incomplete. The status vocabulary is deliberately just
-- 'complete': no partial/incomplete/skipped/estimated values exist,
-- because those are heuristic classifications derived at read time
-- (energy-facts), not user declarations.
--
-- Explicit completion is the preferred evidence source for the
-- 5B.2 adaptive maintenance inference; the 5B.1 heuristic
-- (likely_complete) remains fallback context for historical days
-- that predate this feature — the two are never equivalent.
--
-- Deliberately NOT created (derived-not-persisted rule):
-- adaptive_tdee_state, daily_energy_facts, energy_balance_snapshots.
-- Adaptive maintenance stays derived from source truth.
-- ============================================================

CREATE TABLE nutrition_day_status (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id      UUID NOT NULL
               REFERENCES auth.users(id)
               ON DELETE CASCADE,

  logged_date  DATE NOT NULL,

  status       TEXT NOT NULL
               CHECK (status IN ('complete')),

  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (user_id, logged_date)
);

CREATE TRIGGER nutrition_day_status_updated_at
  BEFORE UPDATE ON nutrition_day_status
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE nutrition_day_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY nutrition_day_status_select_own
  ON nutrition_day_status FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY nutrition_day_status_insert_own
  ON nutrition_day_status FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY nutrition_day_status_update_own
  ON nutrition_day_status FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY nutrition_day_status_delete_own
  ON nutrition_day_status FOR DELETE
  USING (user_id = auth.uid());

-- Table privileges (RLS policies alone grant nothing — the standing
-- 015/016 lesson). Nothing to anon; no service role.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nutrition_day_status TO authenticated;

NOTIFY pgrst, 'reload schema';
