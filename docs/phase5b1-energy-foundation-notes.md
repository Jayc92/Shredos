# Phase 5B.1 — Energy Facts + Confidence Foundation Notes

First subphase of Phase 5B (Energy Balance + Adaptive Coach), from checkpoint `7f8125c` / `phase5a6b-exercise-anatomy-stable`. Pure deterministic infrastructure — three new lib modules, **no UI changes, no migration** (migrations stay exactly 001–018), no Coach behavior changes, and absolutely **no recommendations**: 5B.1 answers "what does the data actually say and how much can we trust it," never "what should the user change."

## Product north star (recorded)

ForgeFitOS combines Apple Fitness/Health + MyFitnessPal + SmartGym + Runna + Strava concepts around the established macros framework: inputs (food, movement, workouts, cardio, steps, distance, fasting, weight, goals) → model (intake, expenditure signals, adherence, training load, weight response, trajectory) → Coach (am I progressing / eating right / moving enough / losing at a safe rate / preserving muscle / should something change). 5B builds that intelligence deterministically, layer by layer.

## The layer architecture and the deterministic-vs-AI boundary

`RAW ROWS → energy-facts → coach-signals → [5B.4] recommendations via the existing 3E + decision system → user decision → follow-through`. Every number — calories, averages, trends, rates, confidence, thresholds — is deterministic TypeScript, harness-pinned. The eventual AI layer consumes the structured signal/confidence vocabulary (stable machine strings, structured reasons — never an opaque score) and is limited to explanation and conversation; it never computes or invents a measurement.

## Target-setting model vs energy model

Nutrition targets keep coming from `lib/nutrition.ts` — bodyweight × activity multiplier (10/12/14), untouched, never written by the energy layer. The energy model's `estimateBaselineTdee` uses **the same multiplier estimate as its anchor** and runs Mifflin-St Jeor / Katch-McArdle only as **plausibility cross-checks** when the profile genuinely supports them (Mifflin: binary sex constant + plausible age 13–120 + height 100–250 cm; Katch: plausible body fat 3–60%). Output: `{ primaryEstimate, plausibilityRange (min/max — NEVER an average), crossChecks, context[] }`. Formula disagreement widens the range and flags `cross_checks_diverge`; it never blends into a fake "true TDEE." **Adaptive/observed maintenance inference is deliberately absent** — that is 5B.2's job, gated on explicit nutrition-day completion; nothing in 5B.1 exposes an inferred maintenance value that could drive a recommendation.

## Nutrition facts and the provisional completeness heuristic

`buildDailyNutritionFacts` emits one fact per local calendar day (missing days explicit — null values, never fabricated calories), reusing the 2Z normalizer (all-zero placeholder rows never create logged days; `entryCount` counts meaningful entries). Completeness classification: **missing / partial / likely_complete**, where likely_complete requires calories ≥ max(800, 45% of target) AND ≥2 meaningful entries — centralized named constants (`COMPLETENESS_MIN_CALORIES`, `COMPLETENESS_TARGET_FRACTION`, `COMPLETENESS_MIN_ENTRIES`). **This heuristic is provisional** (approved D5 refinement): it is context only, never authoritative evidence for changing calories; when 5B.2 ships the explicit "Finished logging today" signal (`nutrition_day_status`, migration 019), user-marked completion becomes the preferred high-confidence signal and the heuristic remains only for fallback context and pre-feature historical days. A heuristic likely_complete is never equivalent to an explicit completion. Adherence (under/near/over vs the 10% on-track band) is classified only on likely-complete days with a target — a partial day's "under" would be meaningless.

## Weekly weight anchors — Friday-weigh-in compatible

The model never requires daily (or twice-weekly) weighing. Per ISO week: 0 readings → no anchor (gaps are real, never interpolated); exactly 1 reading → a **single-quality anchor at reduced confidence**; ≥2 distinct dates (2Y same-day dedup first) → an averaged **multi-quality** anchor. Trend = least-squares regression over ≥3 anchors using real week spacing on the x-axis, producing `weeklyRateLb`, `weeklyRatePercent`, direction (thresholds mirror 1F: losing ≤ −0.1 lb/wk, gaining ≥ +0.2), and mean absolute residual. **Per-interval sign agreement is deliberately not required** (approved D4 refinement): the fixture 190.0 → 189.0 → 189.3 → 188.5 reads as a genuine declining trend (~−0.42 lb/wk, moderate confidence) despite the noisy uptick. Confidence rules (product thresholds, documented): <3 anchors insufficient; 3 → low; ≥4 noisy fit → low; ≥4 good fit (mean |residual| ≤ 0.75 lb) → moderate; ≥5 good-fit anchors with (≥2 multi-quality OR ≥6 anchors) → high — so a **Friday-only weigher reaches high confidence with six consistent weekly weigh-ins**. Phase 2Y UI behavior untouched. Calorie-adjustment proposals remain deferred to 5B.4.

## Activity baseline and context

User-relative, never population thresholds: 28-day median of **recorded** step days (NULL steps excluded — never zero-coerced, the 5A.4 rule; explicit 0 counts as a real rest day; ≥7 recorded days required before a baseline exists) plus the median of the window's four weekly intentional+workout session-minute totals (session absence genuinely means none recorded → 0). `classifyActivityContext` → low/normal/high at <70% / 70–130% / >130% of the user's own baseline — centralized constants documented as product thresholds, not physiological truths. Unknown when either side is unrecorded. **No calorie synthesis anywhere** — context classification only.

## Aggregate/component expenditure — the reconciliation contract

Structural from day one: a trusted **aggregate** signal (future Apple Health daily active energy) is the authoritative expenditure figure; session calories are **components** that attribute and explain it, never summed on top. The canonical fixture is pinned at runtime: aggregate 850 with workout 520 + walk 180 resolves to **850, never 1,550**. With no aggregate source (today), `authoritativeCalories` is **null** — nothing synthesizes expenditure from steps, distance, or session calories; components stay informational with NULL-vs-0 preserved (`sumRecordedCalories`: nothing recorded → null; explicit zeros → real 0).

## Confidence — structured reasons, never an opaque score

`computeEnergyConfidence` → `{ level: low|moderate|high, reasons: [...] }` with stable reason codes: `insufficient_weight_anchors`, `weight_trend_low_confidence`, `nutrition_logging_incomplete` (<4 likely-complete days in the last 7 — the standing reliable-days rule), `no_activity_baseline`, `recent_target_change` (<14 days). Level rule: any structural gap (anchors/nutrition) → low; any other reason → moderate; no reasons → high. The reasons array is the future AI layer's raw material and the future UI's honest-uncertainty source ("We need another weigh-in…").

## Signal vocabulary (restrained, no recommendations)

`deriveEnergySignals` assembles: `calorieAdherence` (intake_on_target / above / below / insufficient), `proteinState` (on_target ≥90% / close ≥80% / low — the standing coach thresholds), `carbState` (75 g guardrail), `fatState` (<80% of target reads low), `activityContext`, `weightEvidence` (trending_down / stable / trending_up / insufficient), `dataCompleteness`, and restrained composite `highlights` (the canonical `calories_on_target_protein_low`, `intake_above_target`). All intake/macro averages use **likely-complete days only** — partial days never masquerade as adherence. **Fasting is deliberately absent**: a behavioral tool with no energy math, never counted as expenditure or deficit; its adherence signals belong to a later Coach phase. Nothing here suggests, decides, writes, or changes 3E eligibility.

## No recommendations / no migration (the 5B.1 boundary)

Pinned: no decision_logs writes, no nutrition_targets writes, no Coach/Today/Progress page changes, no eat-back, no migration 019, no persisted-facts tables (`daily_energy_facts` / `energy_balance_snapshots` / `adaptive_tdee_state` / `nutrition_day_status` appear nowhere), new libs are pure (no supabase/fetch/client imports).

## 5B.2 dependency (recorded)

Adaptive maintenance inference needs: explicit nutrition-day completion (migration 019 + "Finished logging today"), the qualifying-week rule (≥5 complete days + a weight anchor), the 28-day rolling window with bounded correction (≤±100 kcal per new week, ±25% clamp, ≥3 qualifying weeks), and outlier-week exclusion — all consuming this phase's facts. 5B.3 (Today widget), 5B.4 (Coach integration + the 3E weekly-weigh-in evidence retarget), 5B.5 (Progress charts) follow.

## Vercel QA workflow (approved D8, recorded)

Local implementation/validation stays with Claude; hosted physical QA moves to Vercel Preview via temporary `phaseXX-qa` candidate branches (pushed after local green, never tagged, never merged pre-acceptance; ChatGPT owns Vercel-side inspection; branch deleted after checkpoint). 5B.1 is invisible library infrastructure, so no Preview is forced for it.

## Files changed (3 feature/source, under the 4-file cap)

lib/energy-facts.ts (N) · lib/energy-model.ts (N) · lib/coach-signals.ts (N). Plus the 5B.1 harness, this doc, and the apply script (uncounted). Zero existing files modified — no retargets were needed anywhere.
