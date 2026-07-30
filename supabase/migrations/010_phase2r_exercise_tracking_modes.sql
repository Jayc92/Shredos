-- ============================================================
-- ShredOS Phase 2R — Exercise Tracking Modes
-- 010_phase2r_exercise_tracking_modes.sql
-- ============================================================
-- Adds tracking_mode, a clearer replacement for the confusing
-- exercise_type taxonomy, which mixed tracking behavior with
-- equipment (e.g. it permitted Equipment: Dumbbell + Exercise type:
-- Machine simultaneously). exercise_type is NOT removed -- the
-- column remains populated for legacy compatibility, but is no
-- longer read by application code or exposed in the first-party UI
-- once the corresponding application changes ship alongside this
-- migration.
--
-- Backfilled deterministically for every existing row from its
-- current exercise_type, using the approved mapping:
--   strength, machine, cable, dumbbell, barbell -> weight_reps
--   bodyweight                                   -> bodyweight
--   cardio                                       -> cardio
--   mobility                                      -> timed
--
-- Every row already has a non-null exercise_type (NOT NULL since
-- migration 003), so this backfill covers 100% of existing rows and
-- tracking_mode can safely become NOT NULL in the same migration.
-- ============================================================

ALTER TABLE exercises
ADD COLUMN tracking_mode TEXT
  CHECK (tracking_mode IN ('weight_reps', 'bodyweight', 'cardio', 'timed'));

UPDATE exercises
SET tracking_mode = CASE exercise_type
  WHEN 'bodyweight' THEN 'bodyweight'
  WHEN 'cardio'      THEN 'cardio'
  WHEN 'mobility'    THEN 'timed'
  ELSE 'weight_reps' -- strength, machine, cable, dumbbell, barbell
END;

ALTER TABLE exercises
ALTER COLUMN tracking_mode SET NOT NULL;

-- Defensive safety net: every current application write path (POST,
-- PATCH, seed-exercises.ts) explicitly sets tracking_mode already, but
-- a DEFAULT protects any future direct insert that doesn't.
ALTER TABLE exercises
ALTER COLUMN tracking_mode SET DEFAULT 'weight_reps';

NOTIFY pgrst, 'reload schema';
