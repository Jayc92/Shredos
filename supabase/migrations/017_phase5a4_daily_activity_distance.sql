-- ============================================================
-- ForgeFitOS Phase 5A.4 — Daily Aggregate Distance
-- 017_phase5a4_daily_activity_distance.sql
-- ============================================================
-- Run AFTER 016 (activity session grants).
--
-- daily_activity_logs represents AGGREGATE daily movement signals.
-- This migration adds canonical daily distance and makes steps
-- honestly optional, so each local calendar day can independently
-- record steps, distance, both, or neither:
--
--   steps           NULL = not recorded, 0 = explicitly zero
--   distance_meters NULL = not recorded, 0 = explicitly zero
--
-- The old `steps INTEGER NOT NULL DEFAULT 0` conflated "never
-- entered" with "recorded zero"; dropping NOT NULL and the DEFAULT
-- makes the missing-vs-zero distinction survive the schema. Existing
-- rows keep their step values and receive distance_meters = NULL
-- (never entered) — no backfill, no data rewrite.
--
-- Intentional activity_sessions remain COMPONENT records: their
-- distances are already largely contained within the daily aggregate
-- and are never summed on top of it. No provenance column yet (the
-- future import layer adds it). No steps/distance conversion exists
-- in either direction.
--
-- No new GRANT: the 005 table-level privileges for authenticated
-- cover added columns. RLS, policies, and indexes are unchanged.
-- Migrations 005/015/016 are untouched.
-- ============================================================

ALTER TABLE public.daily_activity_logs
  ADD COLUMN distance_meters NUMERIC(10,2)
    CHECK (distance_meters IS NULL OR distance_meters >= 0);

ALTER TABLE public.daily_activity_logs
  ALTER COLUMN steps DROP NOT NULL,
  ALTER COLUMN steps DROP DEFAULT;

NOTIFY pgrst, 'reload schema';
