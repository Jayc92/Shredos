-- ============================================================
-- ForgeFitOS Phase 5A.3 — Activity Session Grants (corrective)
-- 016_phase5a3_activity_session_grants.sql
-- ============================================================
-- Run AFTER 015 (activity_sessions).
--
-- Corrective migration: 015 created activity_sessions with full
-- own-row RLS but omitted the project's standard table privilege
-- grant. RLS policies alone do not grant privileges, so every
-- authenticated write failed with "permission denied for table
-- activity_sessions" in physical QA. Every other user-owned table
-- (002 food, 003 workouts, 004 routines, 005 daily activity) grants
-- exactly SELECT/INSERT/UPDATE/DELETE to authenticated — this adds
-- the identical minimal grant. RLS from 015 remains enabled and
-- unchanged and continues to scope every operation to own rows.
-- Nothing is granted to anon; no service-role grant (matching the
-- existing migration convention).
-- ============================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_sessions TO authenticated;

NOTIFY pgrst, 'reload schema';
