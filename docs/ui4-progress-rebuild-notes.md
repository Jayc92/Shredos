# UI-4 — Progress Visual Rebuild Notes

From checkpoint `f266485` / `ui3-dashboard-customization-stable`. Presentational rebuild of `/progress` answering four questions — weight trend, strength, coverage, energy/adherence — with **zero calculation, query, or evidence changes**. No migration (exactly 001–020), no dependency (plain-SVG precedent again meets the chart requirements), no other route touched.

## Audit summary (pre-edit)

The page runs the same two parallel read rounds (profile+target; strengthRecords, tracking-aware overview, 50 weigh-ins, nutrition trend logs, energy trends) and renders: header → ProgressSubNav → 4 summary tiles → tracking-mode filter + exercise overview cards → Recent PRs list → Weight (2Y compact 7-day summary) + Nutrition (2Z) pair → 5B.5 EnergyTrendSection → bottom links. Pin surface: 4B.5 pins the H1, tile markup, filter nav, empty-state copy, helper calls, and both route widths; 2Y/2Z copy is pinned via 4B.5; 5B.5 pins the energy mount + range/scroll semantics. The rebuild was designed around those pins — every pinned copy string and helper call survives verbatim.

## What changed (all presentation)

1. **Weight feature chart** — the existing Weight card becomes the feature card (`lg:col-span-8`, Nutrition as the `lg:col-span-4` rail, `items-start`) and gains `ProgressWeightChart`: a server-SVG area chart of the **same already-fetched 50 weigh-ins**, windowed to the existing `?range` weeks (`parseEnergyRange` — same param, same options, invalid input repaired by the existing parser; a visual window only). Real-date x spacing (runtime-pinned: a 54-day gap renders 54/7× a 7-day gap), points are the observations, the line/area are guide encodings, nothing interpolated, null weights filtered (never plotted as zero). Goal context comes only from the existing profile goal weight and draws **only within 15 lbs of the observed range** (runtime-pinned — a distant goal never squashes real data). States: 0 in range → "No weigh-ins recorded in the selected range."; 1 → "One weigh-in recorded in this range — one more starts the trend chart." (a single observation is never presented as a trend); the 2Y latest/7-day-average copy and all its pinned sparse branches remain above the chart. Friday weigh-in semantics and target history untouched (libs carry no UI-4 marker, pinned).
2. **Strength PRs** — the Recent PRs list becomes a compact responsive card grid (`sm:2 lg:3 xl:4`), with the established Phase-2D PR definitions (Weight PR / Est. 1RM PR / Rep PR, per-side suffix) preserved **verbatim** — the computation lines are byte-identical and pinned. No percentages, scores, rankings, or milestones. Long names wrap (`min-w-0 break-words`).
3. **Training coverage** — new `TrainingCoverageSection` aggregating the **already-fetched overview rows** (no new read): tracked exercises grouped by primary muscle with UI-1B `ProgressBar` rows ("N of M tracked exercises trained recently" — recorded sessions only). **Attribution boundary documented in-component**: primary-muscle grouping only; the 5A.6B multi-muscle anatomy is deliberately not re-derived, and the section never claims anatomical volume coverage. Muscles with no tracked exercises are listed as exactly that. Empty state honest.
4. **Layout** — container `max-w-6xl → max-w-7xl` + `xl:` tiers (the UI-0 approval covered route-specific Progress widening); summary tiles, filter, overview grid, Nutrition card, EnergyTrendSection, and bottom links unchanged.
5. **Loading** — mirrors the new geometry (feature-chart block + 8/4 split), same pinned tile/chip/row skeletons, `max-w-7xl`.

## Deliberately retained reads

All existing bounded reads run unchanged — including `fetchRecentWeighIns(50)` feeding both the 2Y summary and the new chart, and the overview rows feeding both the exercise list and coverage. No new fetch anywhere.

## Retargets (2, both flagged)

`verify-phase4b5`: the two `max-w-6xl` width pins (page + loading) → `max-w-7xl` (approved route-specific widening; the "deliberate width + interactive rows / route-matched loading widths" boundaries survive; every other route's width still pinned unchanged). No other suite needed changes; Phase-5B expectations untouched.

## Pre-candidate integrity audits

**Coverage filter independence (passed as-built):** the page wires the COMPLETE `overviewRows` into `TrainingCoverageSection` while only the exercise list consumes `filterOverviewRows(...)` — changing the mode filter can never change whole-page coverage totals. Runtime-pinned (C-INDEP): identical complete rows → identical coverage; a filtered subset WOULD differ, and the page is pinned to the complete wiring. Stored multi-muscle anatomy is displayed-only, never overwritten or reinterpreted.

**Goal-line disclosure (defect found, corrected narrowly):** the original chart silently dropped a valid stored goal outside the 15-lb proximity window. Corrected: the chart still scales to real observations only (a distant goal never alters the y-domain — runtime-pinned by comparing extreme labels against the goal-free chart), a nearby goal renders as the labeled dashed line, and a distant valid goal now gets a concise factual disclosure below the chart ("Goal: X lbs — outside the displayed scale.") with no projection, threshold rationalization, or ideal-weight language; a missing goal produces neither (G1–G4 runtime-pinned).

## Hosted QA notes

Real-data review: chart with actual weigh-in cadence at all six widths; goal-line proximity behavior; PR cards with real names; coverage with the real exercise library; sparse ranges (4-week window with 0/1 weigh-ins); energy section unchanged behavior.
