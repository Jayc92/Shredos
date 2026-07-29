-- ============================================================
-- ShredOS Phase 2L — Enforce One Active Workout Per User
-- 008_phase2l_active_workout_unique_index.sql
-- ============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM workout_sessions
    WHERE status = 'in_progress'
      AND completed_duration_seconds IS NULL
    GROUP BY user_id
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Cannot enforce one active workout: duplicate true-active sessions exist for at least one user. Resolve duplicates (mark extras skipped) before re-running this migration.';
  END IF;
END
$$;

CREATE UNIQUE INDEX workout_sessions_one_active_training_per_user_idx
ON workout_sessions (user_id)
WHERE status = 'in_progress'
  AND completed_duration_seconds IS NULL;

NOTIFY pgrst, 'reload schema';
