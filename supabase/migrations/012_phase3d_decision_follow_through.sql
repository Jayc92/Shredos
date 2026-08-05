-- ============================================================
-- 012_phase3d_decision_follow_through.sql
-- Phase 3D: manual decision follow-through and outcome review.
--
-- Purely ADDITIVE: no column is dropped, renamed, or retyped; every
-- existing decision_logs row is preserved and gains safe defaults.
-- The existing status CHECK constraint, decision_logs_updated_at
-- trigger, and "decisions_all" RLS policy (FOR ALL, user-scoped) are
-- untouched — RLS automatically covers the new columns.
--
-- follow_through_status: whether the user followed through on an
--   accepted/applied decision. Defaults to 'not_started' for every
--   historical row, which matches their actual state.
-- completed_at: when follow-through reached a terminal state
--   (completed / abandoned / not_applicable).
-- review_on: optional user-chosen "review on" DATE (date-only, local
--   calendar semantics — compared as dates, never as timestamps).
-- reviewed_at: when the user recorded an outcome.
-- outcome: the user's own neutral categorization — never computed
--   automatically from weight/nutrition/training data.
-- outcome_notes: optional plain-text note, length-limited at the
--   database as well as the API.
-- ============================================================

ALTER TABLE decision_logs
  ADD COLUMN follow_through_status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (follow_through_status IN ('not_started', 'completed', 'abandoned', 'not_applicable')),
  ADD COLUMN completed_at TIMESTAMPTZ,
  ADD COLUMN review_on DATE,
  ADD COLUMN reviewed_at TIMESTAMPTZ,
  ADD COLUMN outcome TEXT
    CHECK (outcome IN ('positive', 'neutral', 'negative', 'mixed', 'unclear', 'needs_more_time')),
  ADD COLUMN outcome_notes TEXT
    CHECK (outcome_notes IS NULL OR char_length(outcome_notes) <= 500);
