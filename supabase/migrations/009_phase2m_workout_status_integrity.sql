-- ============================================================
-- ShredOS Phase 2M — Workout Status Integrity
-- 009_phase2m_workout_status_integrity.sql
-- ============================================================

ALTER TABLE workout_sessions
ADD CONSTRAINT workout_sessions_completed_requires_duration_check
CHECK (
  status <> 'completed'
  OR completed_duration_seconds IS NOT NULL
);

ALTER TABLE workout_sessions
ADD CONSTRAINT workout_sessions_completed_requires_end_time_check
CHECK (
  status <> 'completed'
  OR end_time IS NOT NULL
);

NOTIFY pgrst, 'reload schema';
