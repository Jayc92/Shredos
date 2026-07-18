-- ============================================================
-- ShredOS — Phase 1H: manual daily activity/steps logging
-- ============================================================

CREATE TABLE IF NOT EXISTS public.daily_activity_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logged_date  DATE NOT NULL,
  steps        INTEGER NOT NULL DEFAULT 0 CHECK (steps >= 0 AND steps <= 100000),
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (user_id, logged_date)
);

CREATE INDEX IF NOT EXISTS daily_activity_logs_user_date_idx
  ON public.daily_activity_logs (user_id, logged_date DESC);

ALTER TABLE public.daily_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY daily_activity_logs_select_own
  ON public.daily_activity_logs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY daily_activity_logs_insert_own
  ON public.daily_activity_logs FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY daily_activity_logs_update_own
  ON public.daily_activity_logs FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY daily_activity_logs_delete_own
  ON public.daily_activity_logs FOR DELETE
  USING (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_activity_logs TO authenticated;

NOTIFY pgrst, 'reload schema';
