# Phase 5A.4 — Daily Aggregate Distance Notes

Fourth subphase of Phase 5A (migration 017), from checkpoint `5dbcd40` / `phase5a3-activity-sessions-stable`. Each local calendar day can now independently record **total daily steps** and **total daily distance** — aggregate movement signals — while intentional activity sessions remain component records that are never summed on top of them.

## NULL vs 0 — the authoritative semantics (both metrics)

For `daily_activity_logs.steps` AND `daily_activity_logs.distance_meters`: **NULL = not recorded, 0 = explicitly recorded zero.** Valid rows: steps only, distance only, both, zero steps + positive distance, positive steps + zero distance. A distance-only day never fabricates zero steps and vice versa. The distinction survives every layer: the form prefills NULL as blank and a stored 0 as "0"; blank submits as `null` (the old blank→0 coercion is gone from both the form and the route); the shared validator (`validateDailyMovementInput`) returns `null` for blank/whitespace and rejects — never coerces — booleans/arrays/objects that `Number()` would silently turn into a fabricated zero; the upsert writes NULL through; the schema permits it.

## Nullable steps rationale (migration 017)

The old `steps INTEGER NOT NULL DEFAULT 0` made "never entered" indistinguishable from "recorded zero", which becomes actively wrong the moment a row can exist for distance alone. 017 is additive only:

- `ADD COLUMN distance_meters NUMERIC(10,2) CHECK (distance_meters IS NULL OR distance_meters >= 0)` — canonical meters, the 011/015 precision convention
- `ALTER COLUMN steps DROP NOT NULL, ALTER COLUMN steps DROP DEFAULT`
- existing rows keep their step values and receive `distance_meters = NULL`; no backfill, no data rewrite
- **no new GRANT** (the 005 table-level authenticated privileges cover added columns — the 016 lesson, inverted), no RLS/policy changes, no new index, no provenance column yet (the future import layer adds one)
- migrations 005/015/016 untouched; the 005 `CHECK (steps >= 0 AND steps <= 100000)` remains valid because SQL CHECKs pass on NULL

## Canonical distance

Miles in the UI, meters in the database, converted **exactly once, server-side**, via the existing shared `milesToMeters`/`metersToMiles`/`METERS_PER_MILE` (no second constant anywhere). Prefill converts back at the same 2dp, round-trip stable. Validation (D5 as modified): blank → NULL, 0 → explicit zero, positive finite → canonical meters, negative/NaN/Infinity/malformed → rejected with exact errors. **No arbitrary product-level maximum and no silent clamping** — the only upper rejection is the NUMERIC(10,2) storage precision itself (`DAILY_DISTANCE_MAX_METERS = 99999999.99`). The established 100,000-step bound (the 005 CHECK) is retained, enforced by explicit rejection rather than the route's old silent clamp.

## Per-date form behavior

The passive card gains a Distance (miles, optional) field; Steps is labeled optional and both placeholders read "Not recorded" (blank no longer means 0). The 5A.3 `key={date}` remount fix is preserved — each calendar day gets its own form instance, so steps AND distance reinitialize from that date's server-fetched row and can never bleed across `?date=` navigations (Monday 8,111 + 3.8 mi / Tuesday distance-only 5.2 mi / Wednesday steps-only 17,101 each hold their exact state; pinned at runtime).

## Dashboard impact

`StepsCard.hasLoggedToday` retargeted from row existence (`todayLog !== null`) to the steps value itself (`todayLog?.steps != null`) — a distance-only row now shows "No steps logged yet today." instead of implying steps were recorded, while an explicit 0 still renders as a real recorded zero. No daily distance on the dashboard this phase (deferred).

## Weekly step completeness impact

The authoritative 5A.3 average is untouched: `7-day average = SUM(steps) / 7`, NULL steps contributing zero. But **"X/7 days logged" now counts only dates where steps IS NOT NULL** — a distance-only day does not increment step completeness. Both weekly consumers audited and aligned: the legacy `fetchWeeklyReview` block (stepLoggedDays, the NULL-safe sum, and the goal-hit filter — which previously would have counted NULL rows against a goal via JS `null >= n` coercion) and `computeWeeklyActivity` (already NULL-safe from its 5A.3 shape). `averageDailySteps` remains the single source of truth; no logged-days division anywhere.

## Reconciliation rule (informational, never structural)

Intentional-session distance is a **component of** the daily aggregate, never an addition to it. For the viewed date, `/activity` compares `SUM(activity_sessions.distance_meters for that activity_date)` (NULL session distances contribute nothing; fetched by a dedicated user+date-scoped read, `fetchActivitySessionsForDate` — never inferred from the recent-10 list) against `daily_activity_logs.distance_meters`. Daily NULL → nothing to reconcile, no warning. Session total ≤ daily → no warning (equality included — components may fully account for the aggregate). Session total > daily at **2dp-mile comparison** (meter-level float noise cannot manufacture a warning) → one restrained informational line: *"Your logged activities total 6.2 mi, but your daily movement total is 4.5 mi. Check your activity total or session distances."* It never blocks a save (the save path never even sees it), never mutates either value, never auto-fills, and uses no alarm styling. Reference fixtures pinned at runtime: daily 7.4 vs sessions 1.74 + 3.00 = 4.74 → silent; daily 4.5 vs 6.2 → warns. The residual ("other/passive movement ≈ 2.66 mi") is deliberately NOT displayed — no derived metrics this phase.

## No automatic aggregation (double-counting protections)

Pinned: session routes never touch `daily_activity_logs`; the daily route never touches `activity_sessions`; no code path adds session distance onto the daily total; no distance→steps or steps→distance conversion or estimation exists in either direction (no stride math); session calories remain informational with no nutrition/energy integration. Deferred consumers stay deferred: no 7-day distance average/total/tile, no distance Progress facts (`progress-summary` stays byte-untouched on its documented dead path), no Coach or Energy Balance consumption.

## Future Health / active-energy model (recorded, not implemented)

Daily aggregates (steps, distance, future active energy) versus session components (workouts, walks, runs) — components are generally contained within the aggregates and must never be blindly summed onto them. The standing example: Apple Health daily active energy 850 kcal with 520 kcal of workout/session calories must NOT read as 1,370 kcal burned. This phase's aggregate-vs-session distance reconciliation is the first concrete instance of that rule; the calorie version belongs to the future Energy Balance + Adaptive Coach phase (no eat-back, conservative 100–200 kcal adjustments, confidence-weighted).

## Deferred plausibility warning

The 180-mile/54-minute walk QA case remains roadmap for a later validation-quality phase: activity-type-aware speed/pace plausibility as an overridable warning, never brittle hard limits. Nothing shipped here (D6).

## Files changed (8 feature/source, the approved cap)

types/database.ts · lib/activity.ts · api/activity/route.ts · lib/supabase/server.ts · ActivityLogForm.tsx · activity/page.tsx · lib/weekly-review.ts · StepsCard.tsx. Plus migration 017, the 5A.4 harness, this doc, and the apply script (uncounted).

## Flagged harness retargets (documented semantics changes, no coverage deleted)

- **4B.3** "valid zero not conflated with missing: steps" — the missing-vs-zero gate moved from row existence to the steps value (`todayLog?.steps != null`); the protected distinction is unchanged.
- **4B.5** 7-day summary expression — the sum is now NULL-safe (`(l.steps ?? 0)`); same shared SUM/7 helper.
- **4B.5** "no invented streaks/calories/distance" — distance is now a real approved feature on /activity; streaks and calories remain banned.
- **5A.3** migration boundary pin — from a total count ("exactly 16, no 017") to "5A.3 added exactly 015 + 016", since 017 is this approved phase.
- **5A.3** /api/activity byte-anchor — the route legitimately gained distance; the pinned boundary (future-date rule, single upsert path, no session code) is now checked on comment-stripped source.
- **5A.3** "no step derivation from sessions" — lib/activity.ts now legitimately hosts the daily movement validator (which names steps); session-scoped files keep the plain ban and the lib is pinned against derivation identifiers instead.
- **5A.3** form-initializer pin — the initializer now distinguishes stored NULL (blank) from stored 0 ("0"); state still comes from the selected date's server row.

## Migration stop protocol

Implemented and validated locally; **migration 017 must be applied to Supabase project ShredOS (ref `ttybyljytiwntvorugcv`) before any migration-dependent browser QA** — until then the live table still has NOT NULL steps and no distance column, so daily-movement saves would fail. The apply script never touches Supabase.
