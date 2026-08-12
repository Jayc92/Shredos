-- ============================================================
-- ForgeFitOS Phase 5A.3 — Intentional Activity Sessions
-- 015_phase5a3_activity_sessions.sql
-- ============================================================
-- Run AFTER 014 (workout capture metadata).
--
-- New table for INTENTIONAL activity sessions (walks first; the
-- vocabulary supports future cardio types). Strict three-table
-- boundary:
--
--   workout_sessions     = structured strength training
--   activity_sessions    = intentional non-strength activity/cardio
--   daily_activity_logs  = passive per-day aggregate movement (steps)
--
-- Sessions NEVER write steps or daily aggregates, daily totals are
-- NEVER derived from sessions, and session calories NEVER touch
-- nutrition targets (informational only -- the target model's
-- activity multiplier already embeds habitual movement; eat-back
-- would double-count). Future Health-style imports reconcile and
-- deduplicate at the import layer, which stays possible because the
-- concepts never share rows and sessions carry provenance.
--
-- activity_date is the authoritative LOCAL calendar date (the
-- workout_date convention). started_at is OPTIONAL: "I walked 42
-- minutes yesterday" is a valid record with no known start instant.
-- ended_at is deliberately NOT stored (derivable as started_at +
-- duration when a start exists; a second persisted timestamp would
-- be a consistency liability through edits). Duration is the one
-- required metric. distance_meters is canonical metric storage
-- (matching workout_sets.distance_meters, migration 011); the UI
-- enters miles and the server converts once. calories_burned: NULL
-- = not recorded, 0 = explicitly zero (migration 014 rule).
--
-- source has NO DEFAULT deliberately (Phase 5A.2 lesson formalized):
-- every writer must state provenance explicitly. No 'legacy' -- a
-- new table has no unknowable rows. 'live' and 'imported' are
-- reserved vocabulary only (no timer, no integrations yet); future
-- providers will compose with source='imported' via an additive
-- provider column rather than polluting this taxonomy.
-- ============================================================

CREATE TABLE activity_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id          UUID NOT NULL
                   REFERENCES auth.users(id)
                   ON DELETE CASCADE,

  activity_type    TEXT NOT NULL
                   CHECK (
                     activity_type IN (
                       'walk',
                       'run',
                       'cycle',
                       'hike',
                       'row',
                       'elliptical',
                       'stair_climber',
                       'swim',
                       'other'
                     )
                   ),

  activity_date    DATE NOT NULL,

  started_at       TIMESTAMPTZ,

  duration_seconds INTEGER NOT NULL
                   CHECK (duration_seconds > 0),

  distance_meters  NUMERIC(10,2)
                   CHECK (distance_meters > 0),

  calories_burned  INTEGER
                   CHECK (calories_burned >= 0),

  source           TEXT NOT NULL
                   CHECK (
                     source IN (
                       'manual',
                       'live',
                       'imported'
                     )
                   ),

  notes            TEXT,

  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER activity_sessions_updated_at
  BEFORE UPDATE ON activity_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Every read path is user + date-descending. Multiple sessions per
-- day are valid, so no uniqueness constraint exists.
CREATE INDEX activity_sessions_user_date_idx
  ON activity_sessions (user_id, activity_date DESC);

ALTER TABLE activity_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY activity_sessions_select_own
  ON activity_sessions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY activity_sessions_insert_own
  ON activity_sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY activity_sessions_update_own
  ON activity_sessions FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY activity_sessions_delete_own
  ON activity_sessions FOR DELETE
  USING (user_id = auth.uid());

NOTIFY pgrst, 'reload schema';
