# Phase 5B.3 — Today Energy Balance Widget Notes

Third subphase of Phase 5B, from checkpoint `1c18506` / `phase5b2-adaptive-maintenance-stable`. The first user-facing consumer of the Energy Balance foundation: one restrained Today card answering *how much have I eaten, what's my target, how active am I versus my normal, what's my broader trajectory, and how much can we trust it* — and deliberately **never** answering "what calorie change should you make" (5B.4). **No migration** (exactly 001–019), no Coach/3E changes, no Progress charts, no new persisted facts.

## Product principle (pinned throughout)

This is a **trajectory** widget, not an exercise-calorie calculator: no calories-eaten-minus-workout math, no target-plus-exercise allowance, no "you earned X", **no eat-back of any kind**, no "calories burned today" (no trusted aggregate expenditure source exists), no session-calorie totals anywhere. The server fetch selects session **durations only** (for the activity baseline) — `calories_burned` is never even queried.

## Data flow

`fetchTodayEnergyBalance` (in `lib/today-energy.ts`) reuses the dashboard's already-fetched profile/target/today food logs and adds seven bounded window reads (food_logs, nutrition_day_status, nutrition_targets history, body_metrics 9 weeks, daily_activity_logs, workout/activity session durations — 28-day windows, never all-time). Everything flows through the existing 5B.1/5B.2 layers verbatim: context facts builder → weekly anchors → qualifying weeks → adaptive inference → energy confidence. Failed reads degrade to empty evidence (the model honestly reports insufficient data; Today never errors). The React card receives a finished `TodayEnergyBalanceViewModel` and performs **zero energy arithmetic** (pinned).

## View model

`{ caloriesConsumed, calorieTarget, calorieState, activityContext, trajectoryState, trajectoryLabel, confidenceLevel, confidenceMessage, maintenanceRange, maintenanceNote }`. Calorie semantics: consumed = the **same** `computeDailyTotals` the Nutrition card and Food Log use (Today never shows two disagreeing numbers); target = the **active** target only (never historical here); zero rows → null, never a fabricated 0; states no_target / no_food / under / near / over with the float-exact 10% band edge.

## Daily vs trajectory — visually and structurally distinct

`calorieState` (today's intake) and `trajectoryState` (multi-week) are separate fields rendered as separate rows — a day over target coexists with an on-track trend (runtime-pinned). Trajectory reuses the **3E bands verbatim** (`fatLossBand` by body-fat context, `GAIN_BAND`, maintenance stability) as *description only*: `on_track` / `watching` ("Watching trend") / `not_enough_data`; goals without a supported band (running/recomposition/unknown) get honest **descriptive** labels (`trend_only`: "Trending down/Stable/Trending up") — never a judgment, never a parallel recommendation engine.

## Activity semantics

The 5B.1 user-relative context passes through untouched: Low / Normal / High / "Not enough activity history" — no hard-coded step judgments in the component, no fake step-calorie burn.

## Confidence copy

Structured reason codes map to honest sentences by priority (weight evidence → nutrition completeness → target change → activity baseline): "Need another weekly weigh-in", "Mark completed food-log days to improve your estimate", "Targets changed recently — estimates are resettling", "Log steps or activity to build your baseline". No reasons → no message; unknown codes → nothing — prose is never fabricated from absent facts.

## Maintenance-range rules

- `high_confidence` → "Estimated maintenance: **2,400–2,600 kcal/day**" — always a range, bounds on the 5B.2 50-kcal boundaries.
- `moderate_confidence` → "Maintenance estimate is still settling" — no numbers.
- `observing` / `insufficient_data` → nothing at all.
- A point estimate (e.g. 2,437) can never render — the card only knows the range field.

## Empty states

No food → "Start logging food to see today's intake." No target → "Set your nutrition targets to track energy balance." (setup precedence over no-food). Insufficient trend → "We're still learning your trend." Incomplete explicit logging surfaces through the confidence copy. Nothing renders zeros as recorded values.

## Placement & responsive behavior

A new `TodayWidget id="energy"` (the documented seventh id) in its own additive row between the status and utility grids — one medium card in a `lg:grid-cols-3` row (never dominating), full-width stacked on mobile; compact stacked label/value rows, no 4-column density, no fixed widths (375px-safe by construction with the standing card primitives). Icon: lucide `Gauge`, decorative (`aria-hidden`); state is always conveyed by text labels, never color alone. The upper grid's documented three-column contract and the lower grid's fasting-adaptive column logic are byte-untouched.

## Flagged retargets (no coverage deleted)

- **4B.3** "no seventh id silently added" → seven ids with the documented `'energy'` addition (the pin's real property — no *silent* additions, coach/hero still excluded — unchanged).
- **5B.1** "no Today/Progress/Coach page changes" → narrowed to 5B.1's own claim (no 5B.1 page code; check-in/progress still energy-free).
- **5B.2** "no Today Energy Balance widget" → narrowed to 5B.2's own claim (no 5B.2 dashboard code; the widget present is explicitly the approved 5B.3 consumer).

## Files changed (4 feature/source)

lib/today-energy.ts (N) · components/dashboard/EnergyBalanceCard.tsx (N) · app/(app)/dashboard/page.tsx · components/dashboard/TodayWidget.tsx. Plus the 5B.3 harness, this doc, and the apply script (uncounted).

## Hosted QA protocol

No migration to apply (019 already live). Candidate branch **`phase5b3-qa`** → Vercel Preview → ChatGPT inspects deployment/runtime logs → physical QA per the delivery checklist (food-logged and no-food states, activity context, confidence copy, maintenance-range gating, desktop + 375px, no duplicate/conflicting calorie messages against the Nutrition card — both draw from the same computation) → on acceptance fast-forward to main, tag `phase5b3-energy-widget-stable`, push, backup, delete the QA branch. If real data doesn't produce a high-confidence range, QA the insufficient/moderate states physically and rely on the harness's runtime coverage for the high-confidence path — production data is never mutated to force a state.
