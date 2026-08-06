# Phase 4B.5 — Progress Pillar Redesign Notes

Companion to the 4A audit and 4B.1–4B.4 notes. This phase redesigns the five Progress-pillar routes — `/progress`, `/progress/exercises/[id]`, `/weigh-in`, `/activity`, `/fasting` — onto the 4B.1 design system and 4B.2 shell. **Presentation and information hierarchy only**: every calculation, query boundary, date rule, form contract, mutation, chart value, and URL is unchanged and byte-anchored by the harness.

## The workflow and evidence separation

Overview = cross-domain trends · Exercise detail = one exercise's tracking-aware history · Weigh-in = body-metric logging + weight trends · Activity = daily steps logging · Fasting = active-fast control + history. The evidence states stay distinct: **latest measurement** (prominent numerals), **trend over time** (averages/comparisons/charts, only with the existing minimum evidence), **logging coverage** ("Based on N logged days", "N of 7 days logged"), **missing evidence** (explicit "No X logged" copy — never zeros), **user targets** (goal context, neutral), **system summaries** (status badges with text).

## Shared Progress subnav

`ProgressSubNav` (new client leaf, CoachSubNav pattern): Overview `/progress` · Weigh-in `/weigh-in` · Activity `/activity` · Fasting `/fasting`. **Overview matches route-aware** (`/progress` plus every `/progress/*` detail page keeps Overview active); the others match exactly. Active = brand underline + weight + `aria-current` (never color alone); `overflow-x-auto` for narrow screens; no persistence, no counts. **The Fasting link renders only when `profile.fasting_enabled` is true** — the flag is passed from each server page's already-fetched profile (no client fetch, no flash). The direct `/fasting` URL remains reachable regardless, matching prior phase policy; when disabled, the page renders with the subnav showing no active item for it (observed pre-existing behavior: the route itself has never checked the flag — unchanged).

## Progress overview — /progress

Hierarchy: header → subnav → summary tiles (four sunken tiles — counts derived from the same overview/PR data below, no invented score) → Exercise progress (filters + rows) → Recent PRs → a `lg:grid-cols-2` row of Weight and Nutrition trend cards → cross-pillar links (labels aligned: "Weekly review →", "Coach →"). `max-w-6xl`; exercise rows now `interactive` Cards in a `sm:2 / lg:3` grid. **Filters remain real links** (querystring navigation, `?mode=` semantics untouched) restyled to the FilterChip visual language — check glyph + border + weight when selected — rather than the client-state FilterChip primitive, because these filters are server-side navigation. Status order, latest summaries, session caps, empty states: verbatim.

## Body-weight and nutrition trend sections

Both are `metric` Cards with every value, threshold (`MIN_DATES_FOR_AVERAGE`, `MIN_LOGGED_DAYS_FOR_AVERAGE`), comparison label, and coverage line rendered verbatim from the untouched `weight-trends`/`nutrition-trends` libs. One-measurement states remain measurements ("Log at least two weigh-ins to see a weight trend"); missing days are never zeros; the goal context is omitted when no goal exists; adherence denominators are logged days, never 7.

## Exercise detail — /progress/exercises/[id]

Hierarchy: back link → header (name wraps safely + mode/muscle/equipment context) → subnav (Overview active) → records (`elevated`) → trend charts → coaching/most-recent (`status`/`metric`) → recent sets/history (`subtle`) → PR history (`default`). `max-w-3xl` (readable chart width). The chart component itself (`ExerciseTrendChart`, custom SVG) is unchanged except its Card wrapper and tokens — metric selection, point building, tooltips, pace direction ("Lower is faster"), the two-point minimum, and the insufficient-data state are all the untouched Phase 2W adapters. Secondary charts render only when the existing selectors produce them.

## Weigh-in — /weigh-in

Hierarchy: header (schedule line) → subnav → evidence-coverage bar (same thresholds/copy, semantic state tokens — coverage, not performance) → **upper `lg:grid-cols-2` area: log form (`action` Card) beside the trend summary + 28-day chart (`metric` Cards)** → 28-day summary (`metric`) → body measurements (`default`) → history (`default`, empty state `status`). `max-w-6xl` justified by the two-column upper area. Every form field, unit conversion, validation, save path, same-day rule, and history value is unchanged (the form component's internals were not touched beyond the Card wrapper and chrome tokens).

## Activity — /activity

Hierarchy: header → subnav → date navigation (existing prev/next/today pattern, future-day disable preserved) → today's form (`action` Card via ActivityLogForm) → goal line → Last-7-days (`metric` Card, sunken tiles). `max-w-3xl` — deliberately not stretched; the route has little data and the existing trailing-7-day query is the only multi-day source (nothing added). Zero-vs-missing distinction is the form/API's existing `maybeSingle` behavior, untouched.

## Fasting — /fasting

Hierarchy: header (existing adherence-tool framing, unchanged) → subnav (Fasting link follows the flag) → active timer (`status` Card — live, tabular digits, milestone copy from the untouched lib) → start/end controls (`elevated`) → week stats (`metric`) → history (`default`, empty `status`). Timer interval/cleanup, timestamp-derived durations, goal handling, uniqueness, and history are byte-preserved. The end-fast control keeps its existing seriousness (not account-destructive red).

## Card-variant mapping (summary)

Overview tiles = sunken panels · exercise rows = interactive · trend sections = metric · empty/filter-empty = status · detail records = elevated, coaching/most-recent = status/metric, history = subtle/default · weigh-in form / activity form = action · fasting timer = status, controls = elevated, stats = metric · chart wrapper = default (insufficient-data = subtle).

## `.shred-card` removal scope

Removed from all five route scopes and 12 route-specific components: the five pages, `ExerciseTrendChart`, all five weigh-in components, `ActivityLogForm`, and all four fasting components. The alias remains defined globally for the remaining unmigrated routes (`/nutrition`, `/food`, `/workouts`, `/profile`, …).

## Dead-code finding: progress-summary.ts

The brief's premise ("no active callers") is **partially outdated**: the file is *partially* live. `fetchProgressSummary` — the function containing the phantom `fasting_logs.duration_minutes` select — **remains dead** (its only mention in `/progress` is a comment; zero call sites). But `computeWeightProgress`, a pure function in the same file with no phantom columns, **is live**: `/weigh-in` calls it for the 28-day summary and `WeighInSummary` imports its type. Per instructions: the dead path was **not activated, not patched, and the file was not modified**; the live pure function keeps serving `/weigh-in` exactly as before. The harness pins both facts.

## Loading, responsive, boundaries, accessibility

Five new `loading.tsx` files with route-matched geometry (the detail skeleton shows one chart region without fake values). All grids `sm`/`lg`-keyed, one-column mobile, shell breakpoint untouched, bottom-nav clearance inherited. Server/client split unchanged: all five pages remain server components; client islands stay where hooks/forms/timers need them (WeighInForm, ActivityLogForm, FastingTimer/Controls, chart tooltips); `ProgressSubNav` is the one new client leaf. One H1 per route, labeled nav landmark, `aria-current`, text-carrying statuses, chart meaning in adjacent text — a foundation, **not** a WCAG conformance claim.

## Deferred to 4B.6+

Fuel/Train route redesigns (`/food`, `/nutrition`, `/workouts` family) and `/profile`; remaining `.shred-card` removals; repainting remaining domain-lib color output (progressColor and friends); per-section profile saves (4B.6 per the 4A decision).
