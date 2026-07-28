-- ============================================================
-- ShredOS Phase 2F — Routine-Aware Progression Targets
-- 006_phase2f_routine_aware_targets.sql
-- ============================================================
-- Run AFTER 005 (daily_activity_logs).
--
-- Adds two nullable columns to workout_exercises so a workout started
-- from a saved routine can snapshot the routine's intended REP RANGE
-- (target_reps_min / target_reps_max), not just the already-collapsed,
-- ambiguous target_reps (= target_reps_max ?? target_reps_min ?? null)
-- introduced in Phase 1D.
--
-- Nullable, additive, non-destructive. No backfill: there is no
-- reliable way to reconstruct which routine (if any) an existing
-- workout's target_reps value originally came from, or whether it was
-- sourced from a min or a max — target_reps is already a collapsed
-- value with no preserved provenance. Every existing row gets NULL
-- for both new columns automatically, and suggestNextTarget's
-- resolveRepTarget() treats "both null" as mode 'none', falling back
-- to the exact existing Phase 2C global-fallback behavior
-- (LOW_REPS_THRESHOLD=6, TOP_OF_RANGE_REPS=8). Every existing workout,
-- and every future manually-created (non-routine) workout, continues
-- to behave exactly as it does today.
--
-- No CHECK (target_reps_min <= target_reps_max) constraint, matching
-- the existing workout_routine_exercises table (004), where this same
-- validation is enforced client-side only, not at the DB level.
-- suggestNextTarget has its own defensive handling for the malformed
-- min > max case (falls back completely to global behavior, does not
-- attempt to repair or infer intent).
-- ============================================================

ALTER TABLE workout_exercises
  ADD COLUMN target_reps_min SMALLINT,
  ADD COLUMN target_reps_max SMALLINT;

NOTIFY pgrst, 'reload schema';
