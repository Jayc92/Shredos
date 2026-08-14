-- ============================================================
-- ForgeFitOS — UI-3: dashboard widget preferences
-- ============================================================
-- One JSONB column on user_profiles holding the versioned Today
-- customization document (DashboardPreferencesV1):
--
--   {
--     "version": 1,
--     "widgets": [
--       { "id": "calories", "enabled": true, "size": "compact" },
--       ... one entry per widget; ARRAY ORDER IS DISPLAY ORDER ...
--     ]
--   }
--
-- Valid ids: calories, protein, steps, weight, nutrition, workout,
-- energy, fasting, coach, decisions. Valid sizes: full, half,
-- compact. The application normalizes this document defensively on
-- every read AND every write (src/lib/dashboard-prefs.ts), so the
-- database default is the empty object — normalization expands it
-- to the canonical defaults; no per-user backfill is needed and
-- existing rows are untouched beyond gaining the default.
--
-- Security: user_profiles already carries owner-only RLS for
-- SELECT / INSERT / UPDATE / DELETE (migration 001: user_id =
-- auth.uid(), UPDATE with USING + WITH CHECK). A new column
-- inherits those policies — no policy change is required and none
-- is made. Table grants from 001 likewise cover added columns.
-- The existing update_updated_at_column trigger stamps updates.
-- ============================================================

ALTER TABLE user_profiles
  ADD COLUMN dashboard_prefs JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN user_profiles.dashboard_prefs IS
  'Versioned Today dashboard customization (DashboardPreferencesV1): {version: 1, widgets: [{id, enabled, size}]} — array order is display order; normalized defensively by the application on read and write.';

NOTIFY pgrst, 'reload schema';
