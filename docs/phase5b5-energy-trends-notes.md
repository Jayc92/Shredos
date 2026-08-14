# Phase 5B.5 — Progress Energy & Adherence Trends Notes

Final subphase of Phase 5B, from checkpoint `7dd8120` / `phase5b4-coach-integration-stable`. Adds an **Energy & adherence** section to the existing Progress page that visualizes the stable 5B.1–5B.4 evidence — no second energy model, no new Coach logic, **no migration** (exactly 001–019), read-only everywhere (nothing on Progress can mutate data).

## Investigation findings

`/progress` is a server component with two parallel fetch rounds and a `?mode=` filter via `searchParams`; the app deliberately has **no chart library** (audited again — none installed): Phase 2W's `ExerciseTrendChart` set the precedent of a server component rendering plain, deterministic, viewBox-responsive SVG with design-token colors and native `<title>` tooltips. Two small weekly charts don't justify a dependency, so `WeeklyEnergyChart` follows that precedent exactly. Weeks are Monday-start ISO weeks via `latestCompletedWeekStart`/`startOfISOWeek` (local `YYYY-MM-DD` strings, lexical comparison, no UTC drift) — the same conventions the anchors and review windows already use, so week assignment is consistent by construction (a Sunday belongs to its Monday's week; pinned).

## Data semantics and thresholds (all reused, none invented)

- **Qualifying intake day** = `explicit_complete` (preferred) or `likely_complete` (fallback) with recorded calories — partial/missing days are structurally excluded from averages; a week with zero qualifying days is a **gap** (null), never a zero point. Counts are disclosed on every point (`qualifyingDays`, `explicitDays`, `heuristicDays`).
- **`WEEK_CONFIDENT_DAYS = 4`** (the standing reliable-days rule): 1–3 qualifying days render as hollow low-confidence points and are labeled as such; they are never presented as equally reliable.
- **Per-date target matching (corrected in the 5B.5 target audit)**: every qualifying day is compared against the target that was active on **that specific date** — the per-date `resolveTargetForDate` resolution by `effective_date` the 5B.1 facts builder already performs. The weekly **intake-comparison target** (`averageTargetCalories`) is the day-weighted average of those per-date targets over exactly the same qualifying days as the intake average (2 days at 2,300 + 3 days at 2,100 → 2,180); it is never a single week-end resolution applied to earlier days, never **retroactive**, and never fabricated when no days qualify (null). Mixed weeks carry `targetVersionCount`, `hasTargetTransition`, and `targetTransition {from, to}` for disclosure. The **target-history timeline** is preserved as the distinct `activeTargetAtWeekEnd` field (when versions actually became effective) — rendered only on weeks with no qualifying intake, explicitly labeled "no intake comparison", and never used in adherence math. *Original defect, caught by user audit:* the initial implementation resolved one target at week end and displayed it against the full-week intake average — a fixture with intake 2,350 across a 2,300→2,100 transition read "Above target" (11.9% vs 2,100) when the honest day-weighted comparison is "Near target" (7.8% vs 2,180). Fixed in lib + summary/interpretation + chart; harness S8–S10 retargeted to the timeline field they were actually exercising (flagged) and T1–T20 added.
- **Weight**: `deriveWeeklyWeightAnchors` (single reading = valid hollow anchor, ≥2 = solid averaged anchor) + `computeWeightTrend` regression; the derived trend line renders dashed, only when ≥3 anchors exist, at real week spacing (empty week slots preserve spacing). Band classification reuses `classifyTrajectory` (the 3E bands) descriptively.
- **Activity**: user-relative only — last completed week's recorded-step mean vs the 28-day baseline median (NULL steps excluded, explicit 0 counts; missing = unknown, never low). No universal step goals, no step-calorie conversion.
- **Maintenance**: the current 5B.2 pipeline result only. High confidence → bounded range; moderate → "Still settling"; below → what's missing, no numbers. **No historical maintenance series** — deriving as-of past weeks risks future-data **leakage**, and an honest current summary beats a misleading time series (deliberate deferral).

## The experience

**Summary strip** (five stacked rows): weight trajectory (`−0.5 lb/week` or "Not enough weigh-ins yet"), calorie adherence from the latest confident week ("Near/Above/Below target" or "Not enough completed days"), logging coverage ("N of 7 days complete"), activity ("Near your usual level" etc.), maintenance (range / "Still settling" / "Needs more evidence"). **Interpretation card**: 1–3 deterministic plain-language sentences (what the data shows, what's missing, next useful action) that defer any decision to the Coach review — no reason codes, no new recommendation engine, sparse logs explicitly never read as confirmed under-eating. **Weekly calories vs target chart**: solid points (4+ days), hollow points (low confidence), dashed target step-line (the day-weighted comparison target; a diamond marker plus "target changed from X to Y this week — compared against the Z day-weighted average" disclosure on transition weeks; the active-target timeline on no-intake weeks), honest gaps, per-week tooltips + sr-only text equivalents. **Weekly weight chart**: solid multi-reading anchors, hollow single-reading anchors, dashed derived trend line, gap slots, per-week tooltips. **Coverage table**: per week, neutral language ("3 completed days · more completed days needed", "strong coverage"). **Activity + maintenance card**: current context with the baseline comparison sentence. **Range controls**: plain links `?range=4|8|12` (default 8) preserving the `?mode=` filter — no client JS, works at any width; changing range never changes evidence semantics (pinned). **QA-candidate correction**: the links already used `next/link` (client-side, no full reload) but omitted `scroll={false}`, so the App Router's default post-navigation behavior scrolled the viewport to the top on every range change. Fixed by adding `scroll={false}` to the existing `Link` — no client component, no `useRouter`/`useTransition`, no manual scroll math; back/forward, direct `?range=` URLs, and opening a range link in a new tab were already correct because it's a real `<a href>`.

## Energy non-negotiables (proof)

The fetch selects session **durations only** (`calories_burned` appears nowhere in scope); no total-burn or eat-back field exists in the view model (pinned by JSON inspection); no steps/distance→calorie conversion; no expenditure fabrication.

## Architecture and query boundaries

`lib/progress-energy.ts`: pure `buildProgressEnergyTrends` (fixture-testable) + `fetchProgressEnergyTrends` with seven bounded reads (food/day-status/targets over the range ∪ adaptive window; body_metrics over the range; steps/workout/activity durations over the 28-day baseline lookback) — no all-time scans, no duplicate queries (one facts pass serves the whole range), joined into the page's existing parallel batch. Components render finished view models with zero energy arithmetic (server components — no client JS added, no payload growth).

## Accessibility and mobile

`role="img"` + `aria-label` on each SVG, native `<title>` per point on enlarged hit targets, an `sr-only` per-week text list, sparse x-labels (`labelEvery`) so 12-week ranges never crowd at 375px, viewBox scaling with `w-full h-auto` (no viewport measurement, no scroll hacks), hollow-vs-solid encoded in legend text so color never carries meaning alone, and 44px-order touch targets on the range links.

## Files changed (4 feature/source)

lib/progress-energy.ts (N) · components/progress/WeeklyEnergyChart.tsx (N) · components/progress/EnergyTrendSection.tsx (N) · app/(app)/progress/page.tsx. Plus the 5B.5 harness, this doc, and the apply script (uncounted). **Zero retargets** — all 31 prior suites passed unmodified.

## Deferred (deliberate)

Historical maintenance chart (leakage risk, above); a weekly activity chart (the honest current-context summary ships; a steps series adds little until imports widen the data); everything on the standing roadmap (imports, macro bars, plausibility warnings, Today whitespace, the 5B.4 cooldown-sentence copy debt).

## Hosted QA protocol

No migration to apply. Candidate branch `phase5b5-qa` → Vercel Preview → physical QA: the Energy & adherence section at the bottom of /progress; with real data expect honest sparse states (gaps, "Not enough completed days", hollow anchors from Friday weigh-ins), range links switching 4/8/12 weeks, desktop + 375px with no overflow, and no total-burn/eat-back language anywhere.
