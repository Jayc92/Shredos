-- ============================================================
-- ShredOS Phase 2S — Tracking-Aware Set Entry
-- 011_phase2s_tracking_aware_set_entry.sql
-- ============================================================
-- Adds duration_seconds and distance_meters to workout_sets, so
-- cardio and timed exercises (Phase 2R tracking modes) can actually
-- be logged -- previously the set-entry UI rendered the same
-- reps/weight/RPE row for every exercise regardless of tracking mode.
--
-- No backfill: these values were never previously capturable in any
-- form, for any exercise, so every existing row correctly has NULL
-- for both -- not because all historical rows are weight_reps (they
-- are not; bodyweight rows have existed since the original seed set).
-- ============================================================

ALTER TABLE workout_sets
  ADD COLUMN duration_seconds INTEGER
    CHECK (duration_seconds >= 0),
  ADD COLUMN distance_meters NUMERIC(10,2)
    CHECK (distance_meters >= 0);

NOTIFY pgrst, 'reload schema';
