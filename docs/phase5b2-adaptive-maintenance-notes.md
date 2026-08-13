# Phase 5B.2 — Explicit Nutrition Completion + Adaptive Maintenance Inference Notes

Second subphase of Phase 5B, from checkpoint `99534fb` / `phase5b1-energy-foundation-stable`. Two connected capabilities: the explicit **"Finished logging today"** signal (migration **019**, `nutrition_day_status`) and the first **adaptive maintenance inference** — fully analytical: no calorie recommendations, no target writes, no decision_logs, no 3E changes, no eat-back, and no Today Energy Balance widget (that is 5B.3, the first required Vercel Preview QA cycle).

## Migration 019 — nutrition_day_status

One row means exactly one thing: *the user explicitly marked this nutrition day complete*. `status` CHECK allows only `'complete'` — no partial/incomplete/skipped/estimated values exist, because those are heuristic read-time classifications (energy-facts), never user declarations. **Absence of a row means unknown, never explicitly incomplete.** Unique (user_id, logged_date), the standard `update_updated_at_column` trigger, own-row RLS with four per-operation policies, `GRANT SELECT/INSERT/UPDATE/DELETE TO authenticated` (the standing 015/016 lesson), nothing to anon, PostgREST reload. Deliberately NOT created (derived-not-persisted): `adaptive_tdee_state`, `daily_energy_facts`, `energy_balance_snapshots` — adaptive maintenance stays derived from source truth; `decision_logs.data_snapshot` will capture belief-at-decision-time once the Coach consumes these facts (5B.4).

## Explicit completion semantics

Hierarchy: **explicit_complete > likely_complete (heuristic) > partial > missing** — a heuristic likely_complete is never equivalent to a user declaration. Explicit completion is now the preferred evidence source for adaptive inference; the 5B.1 heuristic remains fallback for historical days that predate the feature and for low/moderate-confidence context. An explicit mark on a day with **no logged intake** stays `missing` (flagged via the separate `explicitComplete` field) — completion is a declaration about logging, never fabricated calories, and unlogged days are never counted as zero. **Editing food after marking complete does not clear the mark** (completion means "I consider this day finished"; only the user undoes it) — and the fact model always recomputes actual current intake from food_logs; nothing is snapshotted.

## Food Log UX

A restrained end-of-flow card on `/food` (after the meal sections, before secondary tools): *"Finished logging?" → [Mark day complete]*; when complete: *✓ Day marked complete → [Undo]* (lucide CheckCircle2, no emoji, no celebration mechanics, undo needs no confirmation). Works on any selected local date including historical ones; hidden on future dates (a day that hasn't happened can't be finished); `key={date}` per the 5A.3 date-isolation lesson.

## API / data flow

`/api/nutrition/day-status`: GET `?date=` → `{ complete: boolean }` (absence → false, meaning unknown); PUT `{ date }` → idempotent upsert (future dates rejected against the server's local today, the /api/activity convention); DELETE `?date=` → removes the declaration. Every operation authenticates, validates the local calendar date, and constrains to the caller's own rows — user_id is never trusted from the client. The page reads the selected date's row server-side alongside its existing parallel fetches.

## Historical target resolution — the 5B.1 limitation removed

`resolveTargetForDate(history, date)` returns the latest target version with `effective_date <= date` — today's target is never applied retroactively, and days before the first version have honest null target context (target-relative completeness/adherence reflects the missing target; never guessed). `buildDailyNutritionFactsWithContext` is the new inference-grade fact builder (per-day historical targets + explicit completion set); the 5B.1 flat-target `buildDailyNutritionFacts` remains for non-inference consumers. Historical targets are never mutated.

## Qualifying weeks

`buildQualifyingWeeks` partitions the trailing **4 ISO weeks** (28-day window — never silently expanded) into deterministic, inspectable records: `{ weekStart, weekEnd, avgCalories, explicitCompleteDays, heuristicCompleteDays, weightAnchor, targetCaloriesSeen, evidenceQuality, qualifies, excluded, exclusionReasons }`. A week's intake mean uses **explicit days when ≥5 exist** (`evidenceQuality: 'explicit'`); otherwise explicit+heuristic likely-complete days together when they reach 5 (`'heuristic'`, reduced confidence); partial/missing days never contribute and are never zero-filled. Exclusions (explainable reason codes, never dozens of biological rules): `insufficient_nutrition_days`, `no_weight_anchor`, `implausible_low_intake` (week mean <800 — extreme partial logging can't masquerade as real intake), `extreme_weight_change` (week-over-week anchor move >1.5% of body weight — water/noise/illness, not energy balance; surrounding valid weeks retained).

## Adaptive maintenance math

`observed maintenance = qualified mean intake − (weeklyRateLb × 3500 / 7)`, with 3500 kcal/lb an **explicit approximation** never presented as measured physiology. Losing → negative storage change → maintenance > intake (2,000 kcal at −1 lb/wk → 2,500); gaining → maintenance < intake. The weight rate reuses the 5B.1 weekly-anchor regression over the qualifying weeks' anchors — no competing algorithm, real week spacing, Friday-only cadence fully supported.

## Bounded adaptation (derived, no persisted state)

The surfaced `adaptiveCentral` moves from the baseline toward the raw observation by at most **100 kcal × qualifying weeks** in the window, clamped to **±25% of the primary baseline** — a raw 600-kcal disagreement never moves the estimate 600 kcal at once; the estimate approaches evidence gradually as weeks qualify. Fully deterministic from window contents; **no `adaptive_tdee_state`, no hidden mutable calibration**. Ranges over false precision: `estimatedMaintenanceRange` bounds round to 50 with half-widths 200/150/100 by status (observing / moderate / high) — internal math keeps precision, users get honest ranges.

## Status & confidence

`insufficient_data` (<3 qualifying weeks — no estimate at all) → `observing` (3) → `moderate_confidence` (4 with soft concerns) → `high_confidence` (4 weeks, explicit-majority evidence, solid trend, no recent target change). Structured reasons extend the 5B.1 vocabulary: `insufficient_qualifying_weeks`, `insufficient_weight_anchors`, `insufficient_explicit_nutrition_days`, `mostly_heuristic_nutrition_days`, `recent_target_change` (reusing the 14-day concept — behavior may still be adapting after a target change), `high_weight_variance`, `outlier_week_excluded`, `target_changed_during_window`. Never an opaque score.

## Target changes inside the window

History is not thrown away: intake+weight math is target-independent, so the inference proceeds; per-day interpretation uses the historical target for each date; a window spanning a target change carries the `target_changed_during_window` confidence note (blocking high confidence, not the estimate).

## No double-counting (pinned)

Adaptive inference never touches workout calories, activity-session calories, steps, or distance — observed intake + weight response already captures total system behavior; adding session components would double-count. The 5B.1 aggregate/component contract (850 with 520+180 components → 850, never 1,550) remains intact and re-pinned. Activity data stays context/confidence only.

## Files changed (6 feature/source, at the cap)

types/database.ts · api/nutrition/day-status/route.ts (N) · lib/energy-facts.ts · lib/energy-model.ts · components/food/DayCompleteToggle.tsx (N) · app/(app)/food/page.tsx. Plus migration 019, the 5B.2 harness, this doc, and the apply script (uncounted).

## Flagged retargets (no coverage deleted)

- **5B.1** migration pin ("exactly 18, no 019") → "5B.1 added no migration" — 019 is this approved phase.
- **5B.1** "adaptive inference deferred to 5B.2" → "baseline estimator intact; adaptive section is the approved 5B.2 addition."
- **5A.6B** migration boundary ("exactly 18, no 019") → "5A.6B added exactly 018" (the standing boundary-pin retarget class).

## Migration stop / hosted QA protocol

Migration **019 must be applied to Supabase project ShredOS (ref `ttybyljytiwntvorugcv`) before hosted QA can exercise day-status writes** — until then, marking a day complete fails at the table. Hosted QA follows the approved D8 workflow: candidate branch `phase5b2-qa` pushed for a Vercel Preview (a QA candidate commit, never tagged, never merged pre-acceptance); ChatGPT inspects the Vercel deployment; physical QA runs against the Preview; after acceptance the accepted commit integrates to main, tags `phase5b2-adaptive-maintenance-stable`, and the QA branch is deleted.
