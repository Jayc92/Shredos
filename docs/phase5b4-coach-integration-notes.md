# Phase 5B.4 — Coach Integration Notes

Fourth subphase of Phase 5B, from checkpoint `b35b634` / `phase5b3-energy-widget-stable`. The stable 5B energy facts, adaptive-maintenance evidence, adherence evidence, activity context, and training context now feed the **existing** Coach decision system — the one live decision path (`evaluateGoalAdjustment` → `GET/POST /api/goal-adjustment` → the atomic `apply_goal_calorie_adjustment` RPC from migration 013). **No migration** (exactly 001–019): the existing schema preserves every required lifecycle guarantee; the audit snapshot gains additive jsonb fields only, so historical decision records remain readable unchanged.

## Runtime paths inspected (traced, not assumed)

- **Review generation:** `GET /api/goal-adjustment` → `fetchGoalAdjustmentReview` → `evaluateGoalAdjustment` (pure) — the only live recommendation path.
- **Apply:** `POST /api/goal-adjustment` → fresh server recompute → `validateAdjustmentApply` (never trusts a client eligibility flag) → atomic RPC (versioned target upsert + Applied decision commit/rollback together, per-user advisory lock).
- **Reject/dismiss:** `/api/decisions` PATCH with `decisions.ts` allowed-transition validation (`suggested → accepted | dismissed`); POST carries suggested-scoped duplicate prevention (`duplicate: true`).
- **UI:** `GoalAdjustmentReviewCard` on `/nutrition` — the one adjustment surface.
- **Divergent math:** nutrition-coach's 1F `calorieSuggestion` invented its own "try avg − 150" target numbers on the food page.

## Legacy weigh-in gates found (and what happened to each)

1. **`goal-adjustments.ts` `MIN_WEIGH_IN_DAYS = 2` per completed week** (via `computeWeeklyWeight` two-week averages) — THE live decision gate that made a weekly Friday cadence permanently `insufficient_weight_data`. **Corrected:** replaced by the longitudinal weekly-anchor model — `deriveWeeklyWeightAnchors` (single reading = valid lower-confidence anchor; ≥2 = averaged multi anchor) + `computeWeightTrend` regression with real week spacing; the gate is now `MIN_WEEKLY_ANCHORS_FOR_ADJUSTMENT = 3` anchors across weeks. Missing weeks are honest gaps, never zero change, never fabricated anchors. Anchor quality feeds trend confidence (the 200-step now requires moderate+), so single-reading and multi-reading weeks keep honest confidence differences without incentivizing daily weighing.
2. **`nutrition-coach.ts` `NUTRITION_MIN_WEIGH_INS = 2` within its 21-day trend window** — NOT a per-week gate (Friday cadence yields 3 readings/21 days and passes); left as-is. Its divergent **suggestion math was retired**: the panel's gates still decide when the situation is worth surfacing, but the copy now routes to the adjustment review instead of prescribing invented numbers.
3. **2Y `computeWeeklyWeight` / `MIN_DATES_FOR_AVERAGE = 2`** — display semantics on weekly-review/check-in (weekly *average* needs two dates by definition); not a decision path; untouched.
4. **coach-actions weigh-in nudge** — keys on zero weigh-ins this week; behavioral, not a two-per-week gate; untouched.

## The decision hierarchy (final, in evaluation order)

1. `data_unavailable` (failed reads never pose as zeros) → 2. `missing_target` → 3. `unsupported_goal` → 4. `recent_target_change` (two-completed-weeks cooldown) → 5. `pending_existing_decision` / `awaiting_review` (duplicate prevention) → 6. **weight evidence**: <3 weekly anchors → `insufficient_weight_data` ("one weigh-in per week is enough") → 7. **nutrition evidence**: complete days (explicit preferred, heuristic fallback; partial/missing never count) — <2 → `insufficient_nutrition_data`, <5 → `improve_logging` (**the audit-corrected proposal floor**: `MIN_COMPLETE_DAYS_FOR_PROPOSAL = 5` — below five completed days no target change is proposed in either direction; the state is guidance-only, explicitly framed as a logging-evidence gap and never as confirmed low intake) → 8. band classification on the regression rate (one noisy week is absorbed by the fit) → 9. within band → `hold` (with any protein/activity/training guidance) → 10. **`adherence_first`**: intake off-target on complete days → adherence guidance instead of a target change (low protein is never collapsed into "eat fewer calories"; incomplete logs are never confirmed low intake) → 11. **`activity_first`**: a would-be decrease with activity below the user's own baseline → restore movement first (decreases only; unknown activity never triggers it) → 12. step size: 200 only with band deviation ≥0.5 pp AND **five EXPLICITLY completed days** (heuristic-only weeks cap at 100 — the preferred-evidence rule, strengthened in the nutrition audit) AND trend confidence moderate+, **softened to 100 when protein is low or strength comparisons are declining** → 13. guardrails (1,200 floor, 75 g carb minimum, protein/fat untouched) → 14. eligible proposal.

## How the 5B evidence is used

- **Adaptive maintenance** (5B.2 pipeline with historical per-date target resolution): recorded in `adaptiveEvidence`; at high confidence its range is quoted in the explanation as consistency evidence — it **informs, never sets**; the proposal is always current target ±100/200.
- **Adherence** (explicit-complete days preferred, 10% band, float-exact): gates proposals; drives `adherence_first`.
- **Activity** (28-day user-relative baseline vs review-week recorded steps): drives `activity_first` and guidance; behavioral only, user-relative, no universal step prescriptions, and **never earned food**.
- **Training** (the existing 2X classifier over the progression lookback): `declining` softens decreases and adds guidance; `improving/stable` leave proposals intact; sparse data stays `unknown`, never negative.
- **Fasting** (completed fasts in the review window, fasting-enabled profiles): behavioral context recorded in evidence only — zero effect on any number, no physiological credits, no causation claims.

## Energy non-negotiables (proof)

No eat-back arithmetic exists anywhere in scope (harness-scanned). The review fetch queries session **durations only** (`completed_duration_seconds`, `duration_seconds`) for the activity baseline — `calories_burned` is never selected. Adaptive-maintenance math consumes intake + weight trend exclusively (steps/distance/session calories structurally absent from `energy-model.ts`). No fabricated daily expenditure; no trusted aggregate exists and none was invented.

## Decision lifecycle (preserved exactly)

Recommendations are reviewable (`GET` performs zero writes); apply is the explicit confirmed `POST` with fresh recompute + stale rejection + the 100/200 structural limit + the atomic RPC (advisory lock makes double-clicks fail the stale check); reject/dismiss stays explicit through the decisions transitions; the new `adherence_first`/`activity_first` states are structurally un-appliable (`validateAdjustmentApply` requires `eligible`). No silent target mutation, no automatic adoption of adaptive maintenance, versioned `effective_date` targets preserved, snapshot fields additive.

## Flagged retargets (no coverage deleted)

- **3E harness**: `MIN_WEIGH_IN_DAYS` import → `MIN_WEEKLY_ANCHORS_FOR_ADJUSTMENT`; `weightWeeks` fixture → four collinear weekly anchors at each scenario's intended rate; `foodDays` fixture → two-entry complete days (totals unchanged); the same-day-dedup fixture gained a third anchored week; the rate expectation moved to the regression convention (−0.76 = slope % of latest anchor); the floor fixture's intake now matches its small target so the floor (not the new adherence gate) is what's under test; the sparse-evidence pin renamed to the anchor threshold.
- **5B.1/5B.2/5B.3 boundary pins** ("3E untouched") → narrowed to their structural surviving claims (consumption direction, apply path + step limits, band values) since 5B.4 is the approved phase that touches 3E.

## Intentionally deferred

Fasting pattern *claims* (helping adherence / rebound correlation) — the evidence bar for honest claims isn't met by count data; recorded as context only. Coach-page rendering of the review (it lives on /nutrition; relocating is UI redesign). The Today whitespace debt (recorded, untouched). 5B.5 charts.

## Hosted QA protocol (for the later QA turn)

No migration to apply. Candidate branch `phase5b4-qa` → Vercel Preview → physical QA: the adjustment review card on /nutrition shows anchor-based evidence ("N weekly weigh-ins on record"), the insufficient state says one weigh-in per week is enough, guidance lines render, and with your real Friday cadence the review should now progress toward eligibility as anchors accumulate instead of being permanently blocked.

## Nutrition-evidence audit correction (pre-QA)

Audit finding: two complete days could NOT produce a proposal (they stopped at `improve_logging`), but **four complete days produced an eligible ±100 proposal** — below the required five-day evidence floor. Corrected: `MIN_COMPLETE_DAYS_FOR_PROPOSAL = 5` gates every proposal in both directions; the sub-floor state is guidance-only with copy that never reads sparse logs as under-eating; and the 200 step's coverage requirement was strengthened from five-complete-of-any-quality to **five explicitly completed days** (heuristic-only caps at 100). Fixture retargets (flagged in-file): the 3E default moved to five complete days spanning the review week, the strong/standard step fixtures now differ by evidence QUALITY (explicit vs heuristic) rather than by starving day counts, the maintenance weak-drift fixture shows the hold is deviation-driven, and the floor-guardrail fixture logs five adherent days. Fifteen dedicated runtime scenarios (N1–N15) pin the floor, both directions, partial-day exclusion, zero-fill absence, explicit-preferred/heuristic-fallback, guidance-only copy, apply-time rejection of newly-insufficient proposals, and the untouched Friday anchors.
