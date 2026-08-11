# Phase 5A.1 — Backdated + Manual Ongoing Fasting Notes

First subphase of the approved Phase 5A split (real-world activity capture). Scope: the fasting manual-entry workflow only. **No migration, no schema change, no new route, no dependency, no timer/stats/history redesign.**

## User problem

A user begins fasting at 8:00 PM without pressing "Start fast now," opens ForgeFitOS later, and needs to enter Start = 8:00 PM with End blank — creating the **current active fast** whose timer immediately reflects elapsed time since 8:00 PM. This is a backdated *active* fast, not a historical completed one.

## Root cause

The database already supported this perfectly: `started_at NOT NULL`, `ended_at NULL = active`, the `fasting_logs_one_active_fast_per_user` partial unique index, and derived-only duration. The manual insert even wrote `ended_at: null` when End was blank. The real defects were UX and validation, not the data model:

1. **No time validation** — a future Start was accepted (the live timer then derives from a negative elapsed) and an End at-or-before Start was accepted (negative durations would flow into weekly averages).
2. **Manual entry was hidden whenever any fast was active** (`!activeFast &&` gated the toggle) — wrongly blocking completed historical entries (which can never violate the one-active index) and leaving no explicit conflict handling for a second ongoing attempt beyond a terse DB error.
3. **No affordance** that a blank End is the ongoing-fast workflow, so the supported behavior was effectively undiscoverable — in real use both fields were filled because nothing said otherwise. End correctly defaults blank and is never prefilled.
4. `FastingControls` still carried broken 4B-era legacy tokens (`bg-destructive/10`, `border-border`, `hover:bg-accent`, `bg-primary`) — the error row rendered un-red on the light system.

## What changed (2 feature/source files)

**`src/lib/fasting.ts` (additive only)** — `validateManualFastTimes(startRaw, endRaw, now?)`: a pure, deterministic helper returning either `{ ok, startedAt, endedAt }` or an exact error sentence. Rules: Start required and parsable; Start not in the future beyond a 2-minute clock-skew tolerance (`MANUAL_FAST_FUTURE_TOLERANCE_MS` — skew only, not a grace window); blank End = ongoing (`endedAt: null`); a provided End must parse and be strictly after Start. No invented minimum duration, no age limit. All pre-existing exports untouched.

**`src/components/fasting/FastingControls.tsx`** — manual entry now validates through the helper before any write; the toggle is available while a fast is active (completed historical entries are always legal); an ongoing attempt while a fast is active is blocked in the UI with the explicit sentence "You already have an active fast. End the current fast before starting another ongoing fast." (the existing fast is never mutated, replaced, or auto-ended — ending it uses the normal End-fast control, which is on the same card); the 23505 unique-index violation maps to the same sentence as the race-safe fallback; helper copy under the fields: "Leave End blank to start an ongoing fast from this time." Approved token sweep in the same file: error row `text-critical bg-critical-subtle`, End-fast `bg-critical-subtle text-critical border-edge hover:border-critical`, Start-now `bg-brand`, inputs/selects on the app-wide `bg-secondary border-input text-ink` convention, save button bordered-neutral, main actions `py-3` (44px-class). Insert contracts are byte-compatible: live start unchanged; manual completed uses `didCompleteGoal` exactly as before; manual ongoing writes `completed_goal: null` like live start; `fasting_type` derivation unchanged; exactly two `FASTING_GOAL_OPTIONS.map` call sites remain.

## Local-time handling

`datetime-local` values are the user's local wall-clock intent. They are parsed **exactly once** with `new Date(raw)` (which interprets the un-zoned string in the local timezone) and converted **exactly once** to the stored TIMESTAMPTZ via `toISOString()` at insert. No `'Z'` suffix appended, no `getTimezoneOffset` arithmetic, no date shifting — the harness executes the helper at runtime and asserts 8:00 PM stays hour 20 on the entered calendar date.

## What was deliberately not changed

`FastingTimer` (already derives elapsed and projected end from `fast.started_at` — a backdated row renders correctly with zero changes), `FastingStats`/`computeFastingWeekStats` (already exclude open rows from completed averages), `FastingHistory` and the page's completed-only history query, `useFasting` hooks, the end-fast flow (ends backdated fasts identically), weekly review, Coach, schema, RLS, and all non-fasting surfaces. Migrations remain 13.

## Physical-QA correction (pre-checkpoint): fast record editing

Physical QA confirmed backdated ongoing creation worked (manual Start = Aug 10 8:00 PM, End blank → active fast, timer at ~14h50), then exposed the missing workflow: the tester pressed **End fast** while not actually done — the row became a completed 14h53 history entry with **no way to correct it back**. Correction shipped before the 5A.1 checkpoint:

- **New shared `EditFastForm`** (one component, reused by Controls and History). Fields: Start + End (optional) only — goal hours and notes deliberately out of scope. Validation reuses `validateManualFastTimes` verbatim; prefill formats the stored instant back to local wall-clock via date-fns (`yyyy-MM-dd'T'HH:mm`), the exact inverse of the proven single-parse convention (runtime round-trip tested).
- **Same-row identity**: always an `update` scoped to `.eq('id', fast.id).eq('user_id', user.id)` — never delete/reinsert, never a new row. Payload touches exactly `started_at`, `ended_at`, `completed_goal`.
- **Active fast**: an `Edit fast` toggle in Controls corrects a wrong Start in place; the timer immediately re-derives (it already keys on `fast.started_at`). Editing the active fast is not a second-active conflict.
- **Completed fast**: each history row gets a labeled Pencil (`aria-label="Edit fast"`) beside the unchanged delete. Editing Start/End keeps it completed with the corrected derived duration; **clearing End reopens the same row** (`ended_at = NULL`, `completed_goal = NULL`) and it becomes the current active fast — timer resumes from the (possibly corrected) original start. The consequence is stated before save: "This fast will become active again." (caution notice), with helper copy "Leave End blank to keep this fast ongoing."
- **One-active conflict**: before any reopening write the form freshly queries for a *different* open row (`.is('ended_at', null).neq('id', fast.id)`) and blocks with "You already have an active fast. End the current fast before reopening this one." — the existing active fast and the target row are both untouched on conflict; the partial unique index remains the race-safe backstop and 23505 maps to the same sentence.
- **`completed_goal` is never stale**: recomputed via `didCompleteGoal` with the corrected timestamps and the row's own goal whenever End is present; forced to `NULL` whenever the row is (or becomes) ongoing.
- In-file token sweep while editing History: goal badge `text-green-400` → `text-success`; delete hover `text-destructive` → `text-critical`. Delete semantics byte-unchanged.

No migration (still none in 5A.1), no API, no new dependency. History/stats/timer logic needed zero changes — the reopened row flows through the existing `ended_at IS NULL` filters everywhere.

## Deferred

Phase 5A.2 (historical workouts + calories, migration 014, `legacy/live/manual/imported` provenance with legacy rows never falsely labeled), Phase 5A.3 (activity sessions/walking, migration 015, no steps field initially), all imports/integrations/normalization per the Phase 5A audit; any "replace current fast" destructive workflow (explicitly out of 5A.1); editing an active fast's start time after the fact.
