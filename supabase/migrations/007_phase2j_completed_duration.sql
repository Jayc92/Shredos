-- ============================================================
-- ShredOS Phase 2J — Correction-Safe Workout Duration
-- 007_phase2j_completed_duration.sql
-- ============================================================
-- Run AFTER 006 (routine-aware progression targets).
--
-- Problem: reopening a completed workout for correction (Phase 2I)
-- clears end_time, and formatWorkoutDuration falls back to "now" when
-- end_time is null. A historical workout reopened hours or days later
-- therefore displayed an inflated, misleading duration.
--
-- Fix: persist the workout's completed duration once, at first
-- completion, independent of the live start_time/end_time pair.
-- Reopening and recompleting never touch this value once set, so a
-- correction never inflates or resets the displayed duration.
--
-- Nullable, additive, non-destructive. No CHECK on start_time/end_time
-- themselves -- this column is a separate, persisted fact, not a
-- replacement for the underlying timestamps.
-- ============================================================

ALTER TABLE workout_sessions
  ADD COLUMN completed_duration_seconds INTEGER
    CHECK (completed_duration_seconds >= 0);

-- Backfill only rows that are actually completed with both real
-- timestamps present. Does not touch start_time/end_time. Does not
-- normalize or exclude unrealistic historical values (e.g. existing
-- long test-data sessions) -- those become real, if odd, persisted
-- durations, exactly as the existing timestamps already implied. No
-- guessing, no silent rewriting of historical data.
UPDATE workout_sessions
SET completed_duration_seconds = GREATEST(
  0,
  EXTRACT(EPOCH FROM (end_time - start_time))::integer
)
WHERE status = 'completed'
  AND start_time IS NOT NULL
  AND end_time IS NOT NULL;

NOTIFY pgrst, 'reload schema';
