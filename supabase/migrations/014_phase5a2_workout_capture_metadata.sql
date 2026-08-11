-- ============================================================
-- ForgeFitOS Phase 5A.2 — Workout Capture Metadata
-- 014_phase5a2_workout_capture_metadata.sql
-- ============================================================
-- Run AFTER 013 (goal adjustments).
--
-- Problem: workout_sessions assumed every workout is captured live
-- (start_time = when New workout was pressed, end_time = when
-- Complete was pressed). A workout performed away from the app and
-- typed in later therefore recorded the DATA-ENTRY time, not the
-- activity time, and there was no way to record calories burned or
-- to distinguish how a row was captured.
--
-- Additive only. No status/index/RLS/duration-semantics changes.
--
-- source: capture provenance.
--   'legacy'   -- rows created before this migration. We cannot
--                 truthfully know whether they were live or
--                 after-the-fact entries through the old live
--                 workflow, so they are explicitly classified as
--                 legacy-unknown rather than falsely labeled 'live'.
--   'live'     -- created by the live start flows (New workout /
--                 routine start), written explicitly by the app.
--   'manual'   -- historical/manual entry (Log past workout).
--   'imported' -- RESERVED for future integrations (Apple Health
--                 etc.). No import behavior exists yet.
--
-- calories_burned: optional user-entered whole calories.
--   NULL = not recorded (unknown). 0 = explicitly recorded as zero.
--   Never estimated, never derived, never fed into nutrition
--   targets (the activity multiplier in the target model already
--   embeds habitual activity -- subtracting exercise calories would
--   double-count).
-- ============================================================

ALTER TABLE workout_sessions
  ADD COLUMN calories_burned INTEGER
    CHECK (calories_burned >= 0),
  ADD COLUMN source TEXT NOT NULL DEFAULT 'legacy'
    CHECK (source IN ('legacy', 'live', 'manual', 'imported'));

NOTIFY pgrst, 'reload schema';
