# UI-2 — Today Dashboard Rebuild and Desktop Whitespace Correction Notes

First full route-level rebuild of the UI overhaul, from checkpoint `7a720e1` / `ui1b-shell-primitives-stable`. Same queries, same domain helpers, same actions and mutations — new composition. No migration (exactly 001–019), no persistence, no new dependency.

## Investigation summary

The page runs the same two `Promise.all` waves (23 bounded queries) and passes plain props to cards; only FastingCard and CoachCard are client components. No timezone is stored anywhere (`user_profiles` has no tz column) → the greeting is **time-neutral** ("Welcome back, {display_name}", neutral fallback when blank). The weight chart is buildable entirely from the already-fetched 20 weigh-ins. Calorie/protein tile figures derive from the same pure helpers NutritionCard uses (`computeDailyTotals` + `computeNutritionProgress`) — no target logic re-derived. Wrapping CoachCard in the widget contract is safe (the card file is untouched; the page wraps it).

## Composition (the UI-3 default order)

Header (PageHeader greeting + date + Weekly review/Coach links) → TodayPrimaryAction hero (full width) → metric tiles `calories | protein | steps` (`grid-cols-1 sm:grid-cols-3`) → main grid (`sm:grid-cols-2 lg:grid-cols-12 xl:gap-5`): **weight** feature card `lg:col-span-8` + detail rail `lg:col-span-4` (**nutrition** details, **workout** status; + **decisions** when fasting is off, `sm:col-span-2` full-row on tablet) → **energy** `lg:col-span-6` paired with **fasting** `lg:col-span-6` (enabled) or **coach** (disabled) → (enabled only) **coach** + **decisions** pair. Container `max-w-7xl` with `xl:gap-5`/`xl:space-y-5` density. Mobile is a single column in that DOM order; tablet pairs via `sm:` spans with no orphaned half-rows in either fasting state.

## Root whitespace correction

The audited defect — the 5B.3 Energy row (`lg:grid-cols-3` with ONE child = a permanent 66%-empty band) — is gone: Energy now always occupies a balanced `lg:col-span-6` next to a real partner in both fasting states. The other contributors are also addressed: `max-w-6xl → max-w-7xl` (approved route-specific), `xl:` density added (none existed), and the stacked third column that bottomed out was replaced by the deliberate 8/4 feature+rail split (unequal rail height is accepted rather than stretching cards into internal dead space).

## Widget contract

Union grows by exactly three documented ids: `coach` (CoachCard joins the contract; UI-3 will make it reorderable and **fully hideable**), `calories`, `protein` (tiles decomposed from the nutrition card; `nutrition` stays on the details card). All seven prior ids unchanged. `decisions`/`coach` each render in exactly one branch of the fasting conditional; every other id renders exactly once. No persistence, no Edit Layout control (UI-3 must make it functional before it appears), fixed deterministic order.

## Weight card semantics

WeightCard (same file, all prior capability kept: latest value, goal-aware change + label, confidence badge/note, goal progress, BMI note, next-weigh-in schedule, `weigh-in` links) gains `WeightTrendChart` — a domain-specific server SVG per the established precedent: **x-positions proportional to real days between readings** (a 3× gap renders 3× wider — runtime-pinned), points are the observations, the polyline is declared a guide, missing dates are never fabricated, no interpolation presented as data. 0 readings → existing empty state; 1 reading → "One more weigh-in starts your trend line."; ≥2 → chart. `role="img"`, per-point `<title>`, `sr-only` reading list. No "this week" claim exists anywhere in weight copy.

## Daily metric semantics

Calories = **recorded intake only** (`computeDailyTotals`/`computeNutritionProgress`, computed once in the page); protein separate; steps = the existing StepsCard unchanged (explicit-zero vs missing, `Log steps →` path, UI-1B bar). Missing food → "No food logged yet today." (never zero); no target → value without bar; over target → truthful value + "N over" with the bar clamped but announcing the true value (`aria-valuetext`, runtime-pinned). Tiles are presentational (`DailyMetricTile` receives finished strings + raw bar numbers); NutritionCard keeps carbs/fat bars, time-gated warnings (now `caution` tokens, copy unchanged), low-carb warning, day counts, and the 1F coaching footer — **nothing dropped, only relocated**; each metric's number/target appears exactly once.

## Workout / fasting / energy / coach preservation

Hero and WorkoutCard files functionally untouched (resume/start, conflict modal via the existing StartWorkoutButton flow, week dots, routines links). FastingCard: the hand-built goal bar became the domain-blind `ProgressRing` beside the timer — all arithmetic (incl. `goal_hours * 60`) stays in the card; timer, milestones, links, week stats, client boundary unchanged. EnergyBalanceCard untouched (5B.3 semantics, disclosures, no-eat-back framing) — only its grid region changed. CoachCard and DecisionLogCard untouched; every action/navigation target preserved (S34 pins the full link inventory). Weekly status remains the existing direct counts (session dots, days logged) — no streaks, no consistency %, no "on fire", no mock recommendations.

## Loading and accessibility

`loading.tsx` mirrors the new geometry (same container/grid families: header, hero, 3 tiles, 8/4 split, half-width pair), `aria-hidden`, reduced-motion-safe, no fake values. Exactly one page-level h1 (via PageHeader); charts and progress elements carry accessible names/values; no div-as-button; focus and reduced-motion contracts pinned.

## Retargets (all presentation-pin category, boundaries preserved)

- **verify-phase4b3 (20)**: H1-copy → PageHeader greeting (one-H1 boundary kept); fasting conditional string → ternary form (renders-only-when-enabled kept); `max-w-6xl` → `max-w-7xl`; the status/lower-grid class pins → the tile row + 12-col families (deliberate-responsive boundary kept); coach-has-no-id → coach-joins-deliberately (no-silent-additions boundary kept, union count pinned at exactly 10); DOM-order anchors moved to the new landmarks; loading-geometry pins → new skeleton regions; skeleton counts retargeted.
- **verify-phase5b3 (4)**: the two placement pins described the one-card `lg:grid-cols-3` row — the exact defect UI-2 was commissioned to remove — retargeted to "balanced half-width, never a one-child three-column row"; the two "untouched" pins were historical claims retargeted to their surviving invariants (all pre-5B.3 widgets mounted; the fasting condition still governs fasting).
- **verify-ui1b (2)** and **verify-ui1a (1)**: "UI-1x did not recompose Today" historical pins retargeted to marker-based form (no UI-1A/UI-1B marker; energy contract intact; Progress still unmigrated).

## Hosted QA notes

Authenticated visuals (real data at all six widths, chart with real weigh-ins, fasting ring live, both fasting states) are Vercel-QA items — local smoke was limited to the unauthenticated surface plus structural/runtime proofs.
