# Phase 4A — UX, Information Architecture, and Design-System Audit

**Status:** Authoritative implementation brief for Phase 4B (visual overhaul) and Phase 4C (customizable dashboard).
**Repository state audited:** commit `984737a` (`phase3e-goal-aware-adjustments-stable`), migrations through 013 applied.
**Rule for this document:** every claim about the current app cites the actual file, field, or query. Sections labeled **Current** describe what exists today; sections labeled **Future** are recommendations for 4B/4C. Nothing in this document changes production behavior; the ForgeFitOS rebrand itself is deferred to Phase 4B.

---

## Part 0 — Audit summary

ShredOS is functionally deep (tracking-aware training, trends, weekly review, coach, decision follow-through, goal-aware adjustments) but structurally flat:

1. **Navigation is a 12-item flat list** (`src/components/layout/nav-items.ts`) with no grouping, no hierarchy, and no reflection of product importance. Food and Nutrition even share the same icon (`UtensilsCrossed`).
2. **Every page is a `max-w-2xl` (672px) single column** — desktop is a stretched mobile layout. There is exactly one responsive split in the entire shell (`md:` sidebar vs. TopBar drawer).
3. **Every card is the same `shred-card`** (`bg-card rounded-xl border border-border p-4`, `src/app/globals.css`), so information, actions, warnings, and history all look equally important.
4. **The mint/green `--primary` token means six different things** (brand, selected, link, success, positive trend, button), and the dark theme mixes HSL triplets with oklch values in `globals.css`.
5. **Two component systems coexist**: shadcn-style primitives in `src/components/ui/*` (Card, Badge with variants) that pages mostly do not use, and raw `shred-card` divs that they do.
6. **Source-of-truth conflicts are real and enumerable** (Part 3): profile baseline weight vs. latest weigh-in, whole-object profile saves, calculated vs. active nutrition targets, four different time windows with inconsistent labels, three different workout-count definitions.
7. The product's greatest strengths — determinism, user control, honest evidence, "nothing changes silently" — are not yet expressed visually. Phase 4B's job is to make the interface as trustworthy as the data layer already is.

### Audited file inventory (primary sources for this document)

Layout/navigation: `src/app/(app)/layout.tsx`, `src/components/layout/Sidebar.tsx`, `src/components/layout/TopBar.tsx`, `src/components/layout/nav-items.ts`. Styling: `src/app/globals.css`, `tailwind.config.ts`, `src/components/ui/card.tsx`, `src/components/ui/badge.tsx`, `src/components/ui/option-card.tsx`. Data/domain: `src/lib/weight-trends.ts`, `src/lib/nutrition-trends.ts`, `src/lib/weekly-review.ts`, `src/lib/coach-actions.ts`, `src/lib/decisions.ts`, `src/lib/goal-adjustments.ts`, `src/lib/nutrition.ts`, `src/lib/progress-overview.ts`, `src/lib/progress-summary.ts` (dead), `src/lib/workout-coach.ts`, `src/lib/constants.ts`. Pages: every `page.tsx` under `src/app/(app)/` plus `src/app/(auth)/login/page.tsx` and `src/app/page.tsx`. Components: all families under `src/components/` (dashboard, coach, decisions, nutrition, food, weigh-in, fasting, workout, routine, progress, activity, onboarding, ui).

---

## Part 1 — Product information architecture

### Current state

`NAV_ITEMS` (actual order): Dashboard, Weigh-in, Workouts, Food, Activity, Nutrition, Fasting, Check-in, Coach, Progress, Decisions, Profile. Twelve flat entries rendered identically by `Sidebar.tsx` (desktop, `w-56`) and the `TopBar.tsx` mobile drawer. Fasting appears in navigation even when `profile.fasting_enabled` is false. Weigh-in sits second while Progress — which answers most user questions — sits tenth.

### Future: six product pillars (adopted with modifications)

Evaluated against actual routes and workflows; the recommended six-pillar direction is adopted, with Weigh-in/Activity/Fasting folded into pillars rather than staying top-level:

| Pillar | Nav label (4B) | Primary routes | Secondary routes |
|---|---|---|---|
| **Today** | Today | `/dashboard` | quick actions to log flows |
| **Train** | Train | `/workouts` | `/workouts/[id]`, `/workouts/routines`, `/workouts/routines/[id]`, `/workouts/exercises` |
| **Fuel** | Fuel | `/food` | `/food/saved`, `/nutrition` (targets, trends, target adjustment review) |
| **Progress** | Progress | `/progress` | `/progress/exercises/[id]`, `/weigh-in`, `/activity`, `/fasting` |
| **Coach** | Coach | `/coach` | `/check-in` (weekly review), `/decisions` |
| **Profile** | Profile | `/profile` | (future Settings split deferred; see Part 12) |

**Navigation tiers (Future):**

- **Primary navigation:** the six pillars. Desktop: grouped sidebar with pillar headers and nested items. Mobile: bottom navigation with five slots (Today, Train, Fuel, Progress, Coach) + a "More" sheet carrying Profile and secondary routes. This is the **mobile navigation recommendation**; the grouped sidebar is the **desktop navigation recommendation**.
- **DECIDED (product approval):** the five persistent mobile slots are exactly **Today / Train / Fuel / Progress / Coach**. **Profile belongs in the More/settings surface**, not the persistent slots. Decisions, Weigh-in, Activity, Fasting, Saved meals, Profile, and other utilities remain accessible through contextual navigation or More.
- **Secondary navigation:** within-pillar tabs/links (existing `WorkoutsSubNav` pattern generalizes: Train → Sessions / Routines / Library; Fuel → Log / Saved meals / Targets & trends; Coach → Actions / Weekly review / Decisions).
- **Contextual navigation:** in-page links that already exist and work well (exercise cards → detail, weight card → weigh-in, coach action → nutrition). Preserve.
- **Utility navigation:** sign-out and account (currently a bare email + sign-out row in `layout.tsx`); move into the Profile pillar surface in 4B.
- **Directly reachable but not primary:** `/weigh-in`, `/activity`, `/fasting`, `/decisions`, `/check-in`, `/food/saved` — all keep their URLs (no route renames in 4A/4B; see Part 16) but leave the top level.
- Fasting navigation entries should render only when `fasting_enabled` is true (small 4B change, matching the dashboard's existing conditional).

---

## Part 2 — Page responsibility matrix

Every user-facing route. "Decision" = keep / merge / rename / split / demote for the 4B+ IA.

| Route | User question | Primary action | Data / source of truth | Current issues | Future role | Decision |
|---|---|---|---|---|---|---|
| `/` (`src/app/page.tsx`) | entry redirect | — | auth session | none | redirect to /dashboard or /login | keep |
| `/login` (`src/app/(auth)/login/page.tsx`) | how do I get in? | sign in | Supabase auth | visually unbranded | branded, calm entry | keep (restyle 4B.6) |
| `/onboarding` | set me up | complete wizard | `user_profiles` insert | goal copy duplicated with `MAIN_GOAL_OPTIONS` (constants.ts) | first-run setup | keep; unify option source (4B.6) |
| `/dashboard` | how am I doing today? | jump to a log flow | 7 cards, ~10 bounded queries (`dashboard/page.tsx`) | fixed layout; all cards equal weight; no customization | **Today** — widget grid (4C) | keep; label → "Today" (4B) |
| `/coach` | what should I focus on? | record a decision | `fetchCoachActions` (current ISO week) | window label implicit | Coach pillar home | keep |
| `/check-in` | how did last week go? | review; follow links | `fetchWeeklyReviewSummary` (latest completed ISO week) | name says "check-in", content is "weekly review" | Coach pillar: Weekly review | keep; label → "Weekly review" (4B) |
| `/decisions` | what have I decided? | accept/dismiss; follow-through; outcome | `decision_logs` (3D lifecycles) | expanded cards dense; 7 filters wrap awkwardly | Coach pillar secondary | demote from top-level |
| `/profile` | who am I / my settings? | save profile | `user_profiles` whole-object update | very long single form; baseline-vs-latest weight ambiguity (Part 3A); whole-object stale-overwrite class | Profile pillar; sectioned | keep; section + relabel (4B.6); split deferred |
| `/activity` | steps today/this week? | log steps | `daily_activity_logs` | thin page; top-level slot unearned | Progress secondary | demote |
| `/nutrition` | what are my targets/trends? | adjust targets (explicit) | `nutrition_targets` + 2Z trends + 3E review | "Calculated from profile" vs "Override targets" ambiguity (Part 3D); long page | Fuel: Targets & trends | keep; relabel sections (4B.5) |
| `/food` | what did I eat today? | log food | `food_logs` (today) | solid; coach panel + quick add dense on mobile | Fuel home | keep |
| `/food/saved` | reuse my meals | manage saved meals | `saved_meals` | fine | Fuel secondary | keep |
| `/weigh-in` | what's my weight trend? | log weigh-in | `body_metrics` + 2Y trends | two summary cards overlap (7-day trend vs "Last 28 days") | Progress secondary: Body weight | demote; consolidate cards (4B.5) |
| `/fasting` | am I fasting; history? | start/end fast | `fasting_logs` | top-level even when disabled | Progress/Today secondary, gated by `fasting_enabled` | demote |
| `/workouts` | train now; what's ready? | start workout | sessions + muscle readiness | sub-nav tabs work well | Train home | keep |
| `/workouts/[id]` | run/review this session | complete sets | session + sets | dense but functional; the app's most interactive surface | active workout | keep (careful 4B.4) |
| `/workouts/routines` | my templates | create/start routine | `workout_routines` | fine | Train secondary | keep |
| `/workouts/routines/[id]` | edit template | edit | routine + exercises | editor formy | Train secondary | keep |
| `/workouts/exercises` | my exercise library | add/edit exercise | `exercises` | fine | Train secondary: Library | keep |
| `/progress` | is it working? | drill into detail | 2X overview + PRs + weight + nutrition cards | long; summary tiles + cards all equal weight | Progress home | keep |
| `/progress/exercises/[id]` | this exercise's trend | review charts/records | 2W charts + records | solid | Progress detail | keep |

No route is merged, renamed, or removed in 4A. Rename *labels* (not URLs) in 4B: Dashboard→Today, Check-in→Weekly review, Nutrition→Targets & trends (within Fuel).

---

## Part 3 — Source-of-truth audit

Each conflict: actual field/query → authoritative source → current copy → future copy → future edit location → migration needed later.

### A. Weight (baseline vs. latest)

- **Actual fields:** `user_profiles.current_weight_kg` (set at onboarding; editable on `/profile` as "Current weight"; feeds `calculateNutritionTargets`) vs. `body_metrics.weight_kg` latest row (dashboard `WeightCard`, `/weigh-in`, all 2Y trends).
- **Conflict:** the user edits "Current weight" on Profile but the rest of the app shows the latest weigh-in — the two silently diverge after the first weigh-in.
- **Authoritative:** `body_metrics` latest for *display everywhere*; `user_profiles.current_weight_kg` is really the **calculation input baseline** for target math.
- **Future copy:** Profile relabels the field **"Baseline weight (used for target calculations)"** and shows a read-only "Latest weigh-in: X lbs (Aug 4) → Weigh-in" row beside it. Decision: **relabel as baseline; surface latest read-only** (option chosen over auto-syncing, which would silently mutate calculation inputs).
- **Edit location:** baseline on Profile; actual weight only via `/weigh-in`. **No data migration required** — semantics change only in copy.

### B. Goal weight

- **Actual field:** `user_profiles.goal_weight_kg` is read by dashboard `WeightCard` *and* the 2Y goal context on `/weigh-in` — a single authoritative field today. The historically observed divergence came from Profile's **whole-object save** (Part 3, item "Profile save path"): the form loads values at mount and writes them all back on save, so a goal weight changed elsewhere between load and save is overwritten with stale form state.
- **Authoritative:** `user_profiles.goal_weight_kg`; edited only on Profile. **Future:** 4B keeps one field, and the Profile save should move toward per-section saves (or diff-only updates, extending the existing decision-diff pattern in `handleSave`) to close the stale-overwrite class. No migration.

### C. Step goal

- **Actual field:** `user_profiles.step_goal` (slider on Profile; used by dashboard `StepsCard`, coach rule 5, weekly review). Single field — divergence risk is the same stale whole-object save plus the slider's default `'8000'` string state before profile load. **Authoritative:** `user_profiles.step_goal`; edit on Profile only; same per-section-save fix as B. No migration.

### D. Nutrition targets (calculated vs. active)

- **Actual:** `calculateNutritionTargets(profile)` renders the "Calculated from profile" card on `/nutrition` — a *recommendation*, never persisted until applied. The **active target** is the latest `nutrition_targets` row by `effective_date` (`fetchCurrentNutritionTarget`). The 3E review proposes; migration 013's RPC applies. Intentional, but the page shows both numbers with equal visual weight.
- **Approved terminology (Future, binding for 4B):**
  - **Calculated recommendation** — the live calculator output ("Calculated from profile" card).
  - **Active targets** — the persisted authoritative row. Never label a calculated value as current.
  - **Proposed adjustment** — the 3E review's pending proposal.
  - **Historical target** — superseded `nutrition_targets` rows.
- **Edit location:** Active targets change only via the Override form or the explicit adjustment apply. No migration.

### E. Body fat

- **Actual:** `user_profiles.bf_pct` (Profile field, protein-basis input) vs. `body_metrics.bf_pct` per weigh-in. The 3E review prefers the most recent plausible metric within 56 days, then falls back to the profile value (`resolveBodyFatContext`).
- **Future copy on Profile:** "Body fat % (fallback estimate — recent weigh-in measurements take precedence where available)" plus a read-only "Latest measured: X% (Jul 30)". Hierarchy: **latest measured → profile fallback → unknown**. No migration.

### F. Workout counts

- **Actual definitions in play:** dashboard `fetchWorkoutWeekStats` counts `in_progress` + `completed` sessions this Monday-week; weekly review (3A) counts completed-only in a *completed* ISO week; `/progress` 2X overview caps "recent sessions" at 5; old 28-day `fetchProgressSummary` is dead code. Three live definitions with no labels.
- **Future:** every count carries its window label ("this week (so far)", "last completed week", "recent"). Completed-only is the default meaning of "workouts"; in-progress is surfaced separately ("1 in progress"). No migration.

### G. Time windows (approved labels, binding for 4B)

| Window | Where used (actual) | Approved label |
|---|---|---|
| Current ISO week so far | Coach (`fetchWeeklyReview`), dashboard week stats | "This week (so far)" |
| Latest completed ISO week | Check-in (3A), adjustment review (3E) | "Last completed week (Jul 27–Aug 2)" |
| Prior comparison week | 3A/3E comparisons | "vs. prior week" |
| Rolling 7 days anchored to latest data | 2Y/2Z trend summaries | "Current 7-day average" |
| Last 28 days anchored to latest data | 2W/2Y/2Z charts | "Last 28 days" |

### H. Decisions lifecycles

- **Actual (3D):** `status` (Suggested/Accepted/Dismissed/Applied/Reversed) + `follow_through_status` (Not started/Completed/Abandoned/Not applicable) + outcome (six neutral categories) + `review_on` due state — three separate lifecycles.
- **Approved user-facing hierarchy:** the card leads with **status**, shows follow-through and outcome as secondary chips, and "Review now" as the only attention-demanding state. Approved phrases: "Suggested", "Accepted", "Applied", "Dismissed", "Follow-through", "Outcome", "Review now", "Needs follow-through". No new states; copy only.

---

## Part 4 — User journey audit

Format: entry → steps → friction → future path (dashboard widget involvement / mobile notes).

1. **New user onboarding** — `/login` → wizard → dashboard. Friction: wizard sets goal/weight/bf that later become Part-3 ambiguities; no preview of what the dashboard will contain. Future: final step previews the recommended layout (4C presets); mobile: single-column wizard already fine.
2. **Daily dashboard visit** — nav → 7 equal cards. Friction: no ranking by relevance (an active fast and a stale decision look alike); no quick-log actions. Future: Today widget grid, quick actions in widget frames; top row = today-actionable.
3. **Starting a workout** — Dashboard WorkoutCard or Train → routine → active session. Friction: two hops from dashboard; readiness panel lives on /workouts only. Future: Active workout / Next workout widget with one-tap resume; mobile: sticky set-entry controls in 4B.4.
4. **Logging food** — Fuel home; quick-add + saved meals already good. Friction: coach panel pushes the log below the fold on mobile. Future: log-first layout; Nutrition widget quick action "Log food".
5. **Logging weight** — `/weigh-in` form on top: good. Friction: two overlapping summary cards (7-day trend + Last 28 days). Future: single consolidated trend card (4B.5); Weight widget quick action.
6. **Reviewing progress** — `/progress` overview → detail. Friction: page length; tiles/cards equal weight. Future: highlights first, filters sticky on mobile.
7. **Weekly check-in** — nav → completed-week review. Friction: discoverability (tenth nav slot); no dashboard presence. Future: Weekly review widget appears when a new completed week is available.
8. **Receiving a Coach recommendation** — `/coach` or dashboard CoachCard (training coach only — the dashboard card is *muscle readiness*, not coach actions; a naming trap, see Part 9). Future: one "Coach" widget = primary action + link.
9. **Recording a decision** — Coach → Record → `/decisions`. Works; duplicate-guard exists. Friction: user gets no pointer to the decision just created. Future: success state links to it.
10. **Applying a calorie adjustment** — `/nutrition` review card → confirm → apply (3E, atomic). Friction: card sits mid-page below trends. Future: adjustment review anchored under Active targets; Target adjustment widget when eligible/blocked-with-reason.
11. **Reviewing follow-through/outcome** — `/decisions` expand → manage. Friction: dense expansion (Part 7). Future: two-step disclosure (summary chips → manage sheet on mobile).
12. **Editing profile goals** — `/profile` long form. Friction: goal card is mid-page; save-all model. Future: sectioned page with per-section save (4B.6).
13. **Workout-only user** — must ignore 10 irrelevant nav items today. Future: workout-only dashboard preset (4C) + pillar nav keeps Fuel/Progress collapsed; nothing forces nutrition setup.
14. **Complete-system user** — everything exists; the cost is length and sameness. Future: full-system preset with expanded Today grid.

---

## Part 5 — Dashboard widget architecture (design only — no implementation in 4A)

### Conceptual contract (typed, for 4C)

```ts
type DashboardWidgetSize = 'compact' | 'half' | 'full' | 'expanded'

interface DashboardWidgetDefinition {
  id: string                      // stable, versioned key e.g. 'weight'
  title: string
  route: string                   // primary destination
  category: 'today' | 'train' | 'fuel' | 'progress' | 'coach'
  defaultSize: DashboardWidgetSize
  supportedSizes: DashboardWidgetSize[]
  priority: number                // default ordering weight
  requiredData: string[]          // e.g. ['body_metrics']
  emptyState: string              // neutral copy when no data
  quickAction?: { label: string; route: string }
  hideable: boolean
  reorderable: boolean
  goalRelevance?: string[]        // MainGoal values that auto-prioritize
  featureDependency?: 'fasting_enabled'
}

interface DashboardWidgetPreference {
  id: string
  size: DashboardWidgetSize
  hidden: boolean
}

interface DashboardLayoutItem extends DashboardWidgetPreference {
  order: number
}
```

**Size system decision:** the four-name vocabulary (`compact | half | full | expanded`) mapping onto a 2-column desktop grid (compact = ⅓-height half, half = 1 column, full = 2 columns, expanded = 2 columns + extra content) is chosen over a raw grid-span model. Justification: names carry *content* intent (what a widget shows at each size), which a bare `colSpan` cannot; mobile normalization is trivial (everything renders full-width, `compact` stays short); and the vocabulary constrains 4C scope to four tested variants instead of arbitrary spans.

### Current dashboard card inventory (actual: `src/app/(app)/dashboard/page.tsx`)

| Card (component) | Default visibility | Default size (future) | Compact content | Expanded content | Primary action | Empty state | Hideable | Auto-prioritized when | Belongs on dashboard? |
|---|---|---|---|---|---|---|---|---|---|
| Weight (`WeightCard`) | visible | half | latest lbs + Δ | + 7-day avg & goal context | Log weigh-in | "Log your first weigh-in…" | yes | weigh-in day (cadence) | yes |
| Nutrition (`NutritionCard`) | visible | full | today's cal/protein bars | + carbs/fat bars + coach note | Log food | "Log food to begin…" | yes | goal = fat_loss/recomposition | yes |
| Workout (`WorkoutCard`) | visible | full | next/last session + count | + routine list | Start workout | "Start your first workout" | yes | active session exists | yes |
| Fasting (`FastingCard`) | `fasting_enabled` only | half | active fast timer / last fast | + week stats | Start/end fast | "No fasts this week" | yes | fast active | yes (gated) |
| Steps (`StepsCard`) | visible | compact | today's steps vs goal | + week average | Log steps | "No steps logged today" | yes | never | yes |
| Training coach (`CoachCard` from `workout-coach`) | visible | half | readiness headline | + per-muscle chips | View workouts | "Complete a workout first" | yes | all fresh | yes — retitle "Muscle readiness" (Part 9) |
| Latest decision (`DecisionLogCard`) | visible | compact | latest title + status | — | View all | "No decisions yet" | yes | pending suggestion exists | yes, compact-only |

### Future widgets (grounded in existing features only)

Weekly review (new completed week ready), Target adjustment review (eligible or blocked-with-reason), Active workout (resume), Progress highlights (improving count + notable exercise), Next weigh-in (cadence date), Personal records (latest PR). No speculative features.

### Customization principles (4C)

- Presets: **Recommended default** (order: Active workout* > Workout > Nutrition > Weight > Coach actions > Steps > Fasting* > Latest decision; * = conditional), **Workout-only** (Workout, Active workout, Muscle readiness, Progress highlights), **Full system** (everything). A separate beginner preset is **not justified** — the recommended default with empty states already serves it; goal-based *ordering* nudges (via `goalRelevance`) are applied only to the recommended preset's defaults, never to a user-customized layout.
- Users can: show only Workout, reorder, resize within `supportedSizes`, hide any widget, and **reset to recommended layout**.
- Hidden widgets: their routes remain fully reachable in navigation (hiding a widget never hides a feature).
- Empty widgets: render their neutral empty state with the quick action; never auto-hide (data absence is information).
- The system may *suggest* a layout change (e.g. "Fasting is disabled — hide its widget?") but **never applies one automatically** — same explicit-approval principle as targets and decisions.

---

## Part 6 — Responsive information architecture

### Current state (actual)

- `tailwind.config.ts` defines **no custom `screens`** → default Tailwind breakpoints: sm 640, md 768, lg 1024, xl 1280, 2xl 1536.
- The entire app uses effectively **one split**: `md:` toggles Sidebar (desktop, fixed `w-56`) vs. TopBar drawer (mobile) in `src/app/(app)/layout.tsx`.
- Every content page wraps in `max-w-2xl mx-auto` (672px) — on a 1440px display, ~55% of the viewport is empty canvas. Desktop **is** a stretched mobile layout.
- Dashboard uses a simple grid (`md:grid-cols-2` on some cards); charts are responsive-width SVGs (2W); Decisions filters horizontally scroll (`overflow-x-auto`).

### Future targets (conceptual; final px values fixed in 4B.1 against the Tailwind defaults — do not invent new arbitrary values)

- **mobile** (< md 768): one column, bottom navigation, sticky page header optional.
- **tablet** (md–lg): one column content, persistent compact sidebar.
- **desktop** (lg–xl): two-column-capable content, `max-w-4xl`–`5xl` for grid pages.
- **wide desktop** (≥ xl): dashboard grid up to 2 columns of `full` widgets; content max ~`max-w-6xl`, never full-bleed text.

Per page family: **Dashboard/Today** — widget grid, 1-col mobile / 2-col desktop, no sticky elements, no horizontal scroll. **Profile** — sectioned cards with an in-page section nav on desktop (long single form is the worst mobile offender today), per-section save; form controls max `max-w-md` inside wide sections. **Nutrition** — desktop two-column (trends left, targets/adjustment right); charts full-width of their column; forms never stretch past `max-w-md`. **Decisions** — filters as wrapping chips on desktop, horizontal scroll retained on mobile with edge-fade affordance; expanded management moves to a sheet on mobile. **Active workout** — one column always; set-entry rows ≥44px touch targets; sticky session header with elapsed/complete on mobile; no hover-only controls. **Exercise history/progress detail** — charts stack, cards single column ≤ lg, two columns above. **Routines editor** — form sections, drag handles ≥44px (future). **Check-in** — single column (reading surface) capped at `max-w-2xl` even on wide screens. **Onboarding** — centered single column, unchanged. Touch targets: minimum 44×44px for all tap controls (several text-link actions on cards are below this today).

---

## Part 7 — Visual hierarchy audit → design principles

Current issues (observed in actual components/styles) and the principle that fixes each — principles, not one-off patches:

1. **Every card is the same `shred-card` border box** → *Principle: three surface tiers — flat (canvas sections), raised (primary cards, subtle shadow instead of border), outlined (secondary/historical). Borders become the exception, not the default.*
2. **Information and action look identical** (text links `text-primary hover:underline` do all the work; the app has almost no buttons outside forms) → *Principle: actions are buttons (primary/secondary/ghost); links navigate; a card has at most one primary action.*
3. **Status colors carry too much meaning** (green = brand = selected = success = trend; see Part 8B) → *Principle: brand accent ≠ semantic status; trends use direction + neutral ink, semantic color only for genuine states.*
4. **Equal-weight card stacks** on /progress, /check-in, /dashboard → *Principle: page = one hero surface + supporting surfaces; summaries lead, history trails.*
5. **Stretched desktop forms** (Profile, Nutrition override, Routines) → *Principle: forms live in `max-w-md` columns regardless of page width; sections carry titles and their own save where meaningful.*
6. **Expanded DecisionCard becomes a wall of controls** (reason + snapshots + follow-through + review date + outcome form) → *Principle: progressive disclosure has at most two levels visible at once; management beyond level two moves to a sheet/modal.*
7. **Metric typography is flat** (`text-2xl font-bold` everywhere; `metric-value` utility exists in globals.css but is barely used) → *Principle: one metric type role, used consistently; supporting text visibly subordinate.*
8. **Filters/badges have no hierarchy** (filter pills, status badges, and chips share the same pill shape/size) → *Principle: filters, statuses, and metadata get distinct shapes/weights (chip vs badge vs tag).*
9. **Empty areas on desktop** (672px column) → *Principle: width earns density — wider viewports get more columns, never wider paragraphs.*
10. **Loading is page-blocking** ("Loading..." text on client pages) → *Principle: skeletons at the card level; page shells render immediately.*

---

## Part 8 — ForgeFitOS design-system specification (specification only; implemented in 4B.1)

### A. Brand attributes

Grounded, strong, welcoming, modular, intelligent, calm, modern. Explicitly **not**: aggressive, shredded-body-focused, guilt-driven, AI-flashy. Serves beginners and experienced users across fat loss, strength, maintenance, recomposition, and lighter activity.

### B. Color roles (semantic roles; final values chosen in 4B.1 with contrast validation)

canvas · elevated surface · interactive surface · primary text · secondary text · muted text · border subtle · border strong · brand accent · accent subtle · success · caution · critical · informational · chart series (single-series default + reserved comparison hue) · workout readiness states (fresh/ready/recovering/fatigued — currently green/amber/red text classes in `MuscleReadinessPanel`).

**Current reality (audited, `src/app/globals.css` + `tailwind.config.ts`):** `:root` tokens are oklch; `.dark` mixes HSL triplets (`--primary: 162 70% 55%`) with oklch — two formats in one theme. The mint/green `--primary` currently means **brand** (logo-adjacent accents), **selected** (nav active `bg-primary/15 text-primary`, filter pills, OptionCard), **success** (mixed with `text-green-400`), **link** (`text-primary hover:underline` everywhere), **positive trend** (green deltas), and **button** (`bg-primary`). Semantic greens/ambers/reds are raw Tailwind classes (`text-green-400`, `bg-amber-500/10`), not tokens. **These meanings must be separated in 4B.1:** brand accent (identity, primary buttons), selection (accent subtle backgrounds), success (semantic token, used sparingly), links (primary-text underline or accent, one rule), trends (neutral ink + direction glyphs by default).

**DECIDED (product approval):** the existing **mint/teal brand family is retained** and de-overloaded in Phase 4B with this semantic separation:

- **mint/teal** — brand and primary interaction
- **green** — success or positive state
- **amber** — caution/recovery
- **red** — destructive/critical
- **blue or violet** — informational/data context
- **neutrals** — structure, borders, inactive and selected-state support

Selection and status must never rely on color alone (text, glyphs, or weight always accompany color).

### C. Typography roles

display · page title · section title · card title · body · supporting text · metric (tabular) · label · button · badge · chart annotation.
**Current:** system `font-sans` only; a `font-stat` utility exists for metrics.
**DECIDED (product approval):** **Geist Sans** is the single variable interface family for ForgeFitOS, covering all roles above. Rationale: highly legible for dense fitness dashboards and numeric metrics (good tabular figures), modern and calm rather than aggressive, well-suited to Next.js UI, and licensed under the **SIL Open Font License 1.1**. **Geist Mono** may be reserved only for rare utility contexts where monospaced alignment provides real value (e.g. raw before/after JSON snapshots in decision detail) — it is **not** a general second family, and no paired display family is used. Fonts are installed in **4B.1 only** — no font package is added or loaded in Phase 4A.

### D. Spacing

One scale: 4-based (4/8/12/16/24/32/48/64). Three density levels: **cozy** (mobile cards), **regular** (default), **spacious** (page sections). Current usage is ad-hoc (`space-y-1.5/2/3/4/5/6` all common); 4B maps them to the scale.

### E. Shape

Card radius 12px (`rounded-xl`, keep) · input radius 8px (`rounded-lg`, keep) · button radius 8px · badge/chip radius full · borders: subtle tier only (see Part 7 P1) · shadows: one soft elevation for raised surfaces, none elsewhere.

### F. Component inventory (future variants; misuse noted)

| Component | Purpose | Variants | States | Misuse to avoid |
|---|---|---|---|---|
| Button | actions | primary / secondary / ghost / destructive | default, hover, focus-visible, disabled, loading | never for navigation |
| IconButton | compact action | ghost / outlined | + pressed | no unlabeled destructive |
| Card | container | flat / raised / outlined | — | nesting raised in raised |
| MetricCard | one number + context | compact / regular | loading skeleton | multiple metrics crammed in |
| ActionCard | recommendation + CTA | primary / secondary | — | more than one primary CTA |
| StatusCard | state summary | info / success / caution / critical | — | as a generic container |
| EmptyState | absence + next step | inline / full | — | guilt copy |
| Notice | inline callout | info / caution / critical / success | dismissible? | stacking multiple notices |
| Badge | status metadata | status set + neutral | — | badges as buttons |
| Tabs | peer views | underline / contained | active, focus | more than ~5 tabs |
| SegmentedControl | exclusive small sets | 2–4 options | — | for navigation |
| FilterChip | filtering | selected/unselected | count affix | mixing with status badges |
| Input / NumberInput / Select / Textarea | forms | default / with-unit | error, disabled, focus | unlabeled inputs |
| Toggle | boolean setting | default | — | for actions with side effects beyond the setting |
| OptionCard | exclusive rich choice | default / selected | focus | long option lists (>6) |
| Modal / Drawer / Sheet | focused tasks | sm / md | — | sheets for confirmations (use modal) |
| Tooltip | supplemental hint | default | — | essential info in tooltips |
| Skeleton | loading | text / card / chart | — | spinners for content areas |
| ChartCard | chart + summary | regular / compact | empty, loading | chart without text summary |
| Stat | inline metric | default / delta | — | deltas without window labels |
| ProgressBar | bounded progress | default / warning-over | — | as a trend indicator |
| PageHeader / SectionHeader | hierarchy | with-actions / plain | — | multiple H1-level headers |
| WidgetFrame | dashboard widget chrome (4C) | by size | empty, loading, error | content escaping the frame |

Form states (error/disabled/focus), loading states (skeletons), and empty states are first-class variants above, not afterthoughts.

---

## Part 9 — Content design and terminology

### Approved terminology table

| Term (approved) | Replaces / clarifies | Rule |
|---|---|---|
| Coach | — | the actions surface (`/coach`) |
| Muscle readiness | "Training coach" (dashboard `CoachCard` title trap) | readiness panel is not the Coach |
| Weekly review | "Check-in" (page content already says review) | route label in 4B |
| Progress | — | trends + records home |
| Fuel → Food log / Targets & trends | "Food" vs "Nutrition" ambiguity | pillar + sub-labels |
| Decision log | Decisions | history surface |
| Suggested / Accepted / Applied / Dismissed | "Pending" (filter label only) | statuses are nouns |
| Follow-through | — | did you act on it |
| Outcome | — | what you observed |
| Review now / Needs follow-through | — | the only urgency chips |
| Target adjustment review | — | the 3E surface |
| Calculated recommendation | "Calculated from profile" | never "your targets" |
| Active targets | "Override targets" (form retitles "Edit active targets") | the authoritative row |
| Proposed adjustment | — | pre-approval only |
| Baseline weight | Profile "Current weight" | calculation input |
| Latest weigh-in | "current weight" in prose | body_metrics latest |
| Goal weight | — | single profile field |
| Main goal | — | the six-value enum |
| Latest measurement | body-fat recent metric | precedence over fallback |
| This week (so far) / Last completed week / Current 7-day average / Last 28 days / vs. prior week | assorted implicit windows | always label windows |

### Voice rules

Concise; neutral; non-judgmental; **no guilt framing** ("You skipped…" is banned; "No workouts logged this week" is the pattern); **no causation claims**; **no false precision**; **no medical language**; no "failure"/"success" verdicts on the user. Actions use verbs ("Log weigh-in", "Apply new calorie target"); historical states use nouns/past-tense labels ("Applied", "Completed"). Numbers always carry units and window labels.

---

## Part 10 — Accessibility audit

Severity: blocker / high / medium / low. No WCAG conformance is claimed — no assistive-technology or contrast-tool testing has been run; items below come from code inspection and must be verified during 4B.

| Finding (actual location) | Severity |
|---|---|
| Text-link actions ~16px tall (card "→" links, decision buttons) — touch target below 44px | high |
| Filter rows rely on horizontal scroll with no affordance (`DecisionList`, `/progress` filters on mobile) | medium |
| Status conveyed by color+text (badges are OK), but trend deltas on dashboard use color alone in places (`WeightCard` red/green delta) | high |
| Focus states: form inputs have `focus:ring`; many text-link buttons rely on browser default only | medium |
| Link vs button semantics: several `<button>`s navigate and `<Link>`s act — mixed in decision/coach cards | medium |
| Heading order: pages generally h1→h2/h3 correctly; dashboard cards use h3-equivalents without a page h1 landmark ("Dashboard" heading exists — verify) | low |
| Dynamic success/error messages (profile save, decision updates, adjustment apply) are visual only — no `aria-live` announcement | high |
| Expandable DecisionCard uses a plain button without `aria-expanded` | medium |
| Charts have `role="img"` + desc (2W ✓) and text summaries ✓ — maintain; add table alternative in 4C backlog | low |
| NumberInputs use `inputMode` (`profile` ✓); date inputs native ✓ | low |
| Motion: no animation system exists, so no `prefers-reduced-motion` risk yet — 4B must add the media query with any new motion | low |
| Mobile zoom not disabled ✓ | — |
| Keyboard requirements (4B): every interactive element reachable and operable; visible focus on all controls; escape closes sheets/modals | — |
| Contrast requirements (4B): all text tokens ≥ 4.5:1 on their surfaces; UI components ≥ 3:1; validate with tooling, then state results — never claim compliance untested | — |

---

## Part 11 — Performance and loading UX

Audited (code-level, not profiled):

- **Server/client boundaries:** most pages are server components; `/nutrition` and `/profile` are full client pages doing browser-client Supabase fetches in `useEffect` with page-blocking "Loading..." text — the worst loading UX in the app.
- **Duplicate fetches:** `/dashboard` runs ~10 bounded queries per load including two coach summaries; `/coach` re-runs `fetchWeeklyReview` + `fetchNutritionCoachSummary` (acceptable, but shared caching is a 4B.3 candidate). `/nutrition` fetches trends client-side while the 3E review re-fetches overlapping windows server-side via the API (documented overlap; low volume).
- **Loading states:** no skeletons anywhere; card-level loading exists only in the 3E review card ("Loading review…").
- **Layout shift:** client pages jump from "Loading..." to full content; charts render server-side (no shift ✓).
- **Bundles:** `/nutrition` 9.4kB route JS (largest content page), `/onboarding` 6.5kB; no heavy dependency issues (no chart lib ✓).
- **Optimistic updates:** deliberately absent (3D returns server rows) ✓ — keep.
- **Stale data after mutation:** handled by onApplied/onDecisionChange callbacks (3D/3E) ✓; `/profile` uses `router.refresh()` only.

**Prioritized for 4B/4C:** (1) skeleton system + remove page-blocking loading text (4B.1/4B.3); (2) consider converting `/nutrition` shell to server-rendered with client islands (4B.5); (3) shared per-request memoization of profile/target fetches (4B.3); (4) defer: bundle tuning, table alternatives for charts (post-4C).

---

## Part 12 — Route and component decisions

| Question | Decision | User benefit / cost / compatibility |
|---|---|---|
| Food vs Nutrition separate? | **Keep both routes**, group under Fuel with sub-labels "Food log" and "Targets & trends" | benefit: logging stays one tap; cost: nav copy only; URLs unchanged |
| Coach vs Check-in separate? | **Keep separate** (current-week actions vs completed-week review), grouped under Coach pillar | preserves 3A/3C window semantics; zero route risk |
| Decisions top-level? | **Demote** to Coach pillar secondary | reduces nav noise; URL unchanged |
| Weigh-in under Progress? | **Yes (nav grouping only)**; `/weigh-in` URL kept | body data lives with Progress; deep links safe |
| Activity its own route? | **Keep route, demote** to Progress secondary | thin page doesn't earn primary slot |
| Fasting top-level? | **Demote + gate** on `fasting_enabled` | stops advertising a disabled feature |
| Workouts/Routines/Library tabs? | **Keep tabs** (existing `WorkoutsSubNav` pattern works) | no change |
| Profile split into Profile + Settings? | **Defer split; section the page in 4B.6** (Personal / Goals / Schedules / Preferences with per-section saves) | split adds route churn without user benefit yet |
| Dashboard → Today? | **Rename label to "Today" in 4B**; `/dashboard` URL kept | matches pillar naming; zero redirect risk |
| Progress include Weekly Review? | **No** — Weekly review stays under Coach; Progress links to it | review is retrospective coaching, not trend data |
| Target adjustment location? | **Exclusively `/nutrition`** (already true); Coach links to it | one authoritative apply surface (3E principle) |

No route renames, redirects, or nav-structure changes are made in 4A; labels and grouping land in 4B.2.

---

## Part 13 — Phase 4B implementation plan (visual overhaul)

The recommended sequence was evaluated and adopted with one change: page headers move into 4B.1 (they are a token/component concern consumed by every later subphase).

| Subphase | Routes | Component families | Regression risks | Harness expectation | Checkpoint tag |
|---|---|---|---|---|---|
| **4B.1 Foundation** | none directly (global) | tokens (single color format, semantic roles), typography roles, canvas/surfaces, Button/forms/Card tiers/Badge/Tabs/Notice/Skeleton, PageHeader, layout shell width system, ForgeFitOS rebrand of tokens & app name | every page's visual snapshot; chart token contrast (2W validator rerun) | verify-phase4b1: token contract, component variants, no logic diffs; all 2W–3E harnesses green | `phase4b1-foundation-stable` |
| **4B.2 Navigation** | shell | grouped sidebar, mobile bottom nav + More sheet, nav labels (Today/Weekly review), fasting gating, utility nav | active states, deep links, back behavior | nav inventory checks; route reachability | `phase4b2-navigation-stable` |
| **4B.3 Daily surfaces** | /dashboard /coach /check-in /decisions | dashboard cards → MetricCard/ActionCard, decision progressive disclosure + sheet, skeletons | 3C/3D flows (record, follow-through, outcome) | 3C/3D harnesses + new UI contracts | `phase4b3-daily-stable` |
| **4B.4 Training** | /workouts /workouts/[id] /routines(+id) /exercises /progress/exercises/[id] | active-workout density + sticky header + touch targets, readiness retitle, ChartCard | set entry, completion math (untouched libs) | 2S/2T behavior spot QA + 2W/2X harnesses | `phase4b4-training-stable` |
| **4B.5 Fuel & body** | /food /food/saved /nutrition /weigh-in /fasting /activity | nutrition 2-col + terminology (Active targets etc.), weigh-in card consolidation, source-of-truth copy (Part 3) | 2Y/2Z/3E flows incl. adjustment apply | 2Y/2Z/3E harnesses + terminology checks | `phase4b5-fuel-stable` |
| **4B.6 Setup** | /onboarding /profile /login | sectioned profile + per-section save + baseline-weight relabel, option-source unification, branded login | profile save semantics, decision diffs | 3E profile checks + new save-path checks | `phase4b6-setup-stable` |

**4B.6 profile decision-logging policy (DECIDED, product approval):** per-section saves log only meaningful changes that affect coaching, recommendations, schedules, or calculated targets.

- **Log:** main goal, goal weight, activity level, baseline weight, body-fat fallback, height or age when changed, step goal, weigh-in schedule, fasting preference/default.
- **Do not log:** display-name-only changes, unchanged saves, formatting-only changes, or latest weigh-ins as profile changes (weigh-ins stay in `body_metrics`).
- When multiple fields in one section change, prefer **one consolidated Applied decision** listing only the changed fields, rather than separate noisy entries.

Each subphase: browser QA of its routes on mobile + desktop, full harness suite rerun, uncommitted-diff review, apply script, checkpoint tag by the user after QA.

---

## Part 14 — Phase 4C implementation plan (customizable dashboard)

- **Preference schema:** one `dashboard_layout JSONB` column on `user_profiles` storing `DashboardLayoutItem[]` + preset id + schema version. **Migration required: yes — exactly one, `014_phase4c_dashboard_layout.sql`, additive, RLS inherited from the existing user_profiles policy.** (Decision: JSONB column over a new table — single-row-per-user data, no relational queries needed.)
- **Defaults/presets:** Recommended default, Workout-only, Full system (Part 5); preset selection + "Reset to recommended" always available.
- **Ordering/sizing:** accessible move controls (up/down buttons + keyboard) ship first; drag-and-drop is an enhancement layered on top, never the only mechanism.
- **Mobile normalization:** single column; order preserved; sizes collapse (compact stays short, others full-width).
- **New/versioned widgets:** unknown ids in stored layout are ignored gracefully; new widgets append at recommended position with a one-time "New widget available" notice (suggestion only — **the system never mutates a saved layout automatically**).
- **Persistence:** server-side read with the page; explicit save on change with the 3D error pattern (failed save leaves prior layout intact, readable error, no false success); no optimistic reorder without rollback.
- **Multi-user:** per-user row; RLS as-is.
- **Deterministic verification:** verify-phase4c harness — preference validation, preset contents, unknown-widget tolerance, no-auto-mutation, migration contract.
- **Accessibility:** move controls are real buttons with `aria-label`s; reorder announcements via `aria-live`; hidden widgets listed in an edit panel, not lost.

---

## Part 15 — Prioritization

### A. Must fix in 4B

| Issue | Severity | Routes | User impact | Risk | Phase |
|---|---|---|---|---|---|
| Profile "Current weight" semantics (baseline vs latest) | high | /profile | silent divergence, trust | low (copy + read-only row) | 4B.6 |
| Whole-object profile save (goal weight / step goal stale overwrites) | high | /profile | data loss class | medium | 4B.6 |
| Calculated vs Active nutrition target labels | high | /nutrition | wrong number trusted | low | 4B.5 |
| Time-window labels (four windows, unlabeled) | high | /coach /check-in /nutrition /progress /dashboard | misread evidence | low | 4B.3/4B.5 |
| Green means six things (color semantics) | high | global | status illegibility | medium | 4B.1 |
| Action vs information hierarchy (links-as-actions, no buttons) | high | global | discoverability | medium | 4B.1 |
| Dynamic messages lack aria-live | high | /profile /decisions /nutrition | screen-reader silence | low | 4B.1 |
| Touch targets < 44px on card actions | high | global mobile | mis-taps | low | 4B.1 |
| Mobile navigation (12-item drawer → bottom nav + pillars) | high | shell | daily friction | medium | 4B.2 |
| Page-blocking "Loading..." on /nutrition /profile | high | 2 routes | perceived slowness | medium | 4B.5/4B.6 |

### B. Should fix in 4B

| Issue | Severity | Routes | Impact | Risk | Phase |
|---|---|---|---|---|---|
| Repetitive card borders / flat surface hierarchy | medium | global | scannability | low | 4B.1 |
| Dense Decisions expansion → sheet | medium | /decisions | 3D usability | medium | 4B.3 |
| Long Profile page → sections | medium | /profile | mobile fatigue | low | 4B.6 |
| Stretched desktop forms (`max-w-md` rule) | medium | forms | polish | low | 4B.1 |
| Weigh-in overlapping summary cards | medium | /weigh-in | confusion | low | 4B.5 |
| "Training coach" card retitle → Muscle readiness | medium | /dashboard | naming trap | low | 4B.3 |
| Fasting nav gating | medium | shell | noise | low | 4B.2 |
| Workout-count window labels | medium | /dashboard /check-in | misreading | low | 4B.3 |
| Duplicate nav icon (Food/Nutrition) | low | shell | polish | low | 4B.2 |
| Skeleton loading system | medium | global | perceived speed | low | 4B.1 |

### C. Defer until after 4C

| Issue | Severity | Notes |
|---|---|---|
| Dashboard customization itself | — | is Phase 4C |
| Route renames/redirects (`/dashboard`→`/today`, `/check-in`→`/review`) | low | needs redirect strategy; labels suffice for now |
| Profile → Profile + Settings route split | low | re-evaluate after 4B.6 sections |
| Dead `progress-summary.ts` (`fetchProgressSummary` has no callers; still selects the phantom `fasting_logs.duration_minutes`) | low | delete module in a cleanup pass; no runtime impact today |
| `.DS_Store` hygiene: files exist at `./.DS_Store` and `./supabase/.DS_Store`; already git-ignored (`.gitignore` line 31) — **must also be excluded from backup zips and apply scripts** | low | operational note; apply scripts already write only approved files |
| Chart table alternatives; bundle tuning; onboarding option-source unification if missed in 4B.6 | low | post-4C backlog |

---

## Part 16 — Implementation constraints (all phases)

Preserve all existing behavior. Do not: change database data; apply migrations (4C's 014 is designed here, not created); modify RLS; change target logic, Coach rules, Weekly Review rules, decision transitions, workout calculations, or nutrition calculations; rename routes or introduce redirects yet; change app branding in 4A (ForgeFitOS rebrand lands in 4B.1); add dependencies without explicit justification (the only anticipated 4B addition is a font package, to be justified in 4B.1); commit or tag without user QA.

**User-control principle (binding):** nothing applies automatically — layouts, targets, decisions, and settings change only by explicit user action, exactly as the data layer already enforces.

---

## Resolved product decisions (formerly open questions — all five RESOLVED by product approval)

1. **Typography — RESOLVED:** Geist Sans as the single variable interface family (SIL Open Font License 1.1); Geist Mono reserved for rare monospaced-alignment utility contexts only, never a general second family. Installed in 4B.1; nothing installed in 4A. (Part 8C.)
2. **Brand accent — RESOLVED:** retain the mint/teal family; de-overload in 4B with the semantic separation mint/teal = brand + primary interaction, green = success, amber = caution/recovery, red = destructive/critical, blue/violet = informational/data, neutrals = structure. Selection and status never rely on color alone. (Part 8B.)
3. **Mobile navigation — RESOLVED:** persistent slots are Today / Train / Fuel / Progress / Coach; Profile lives in the More/settings surface; Decisions, Weigh-in, Activity, Fasting, Saved meals and other utilities reachable via contextual navigation or More. (Part 1.)
4. **Profile decision logging — RESOLVED:** 4B.6 per-section saves log only meaningful changes (main goal, goal weight, activity level, baseline weight, body-fat fallback, height/age, step goal, weigh-in schedule, fasting preference/default), never display-name-only/unchanged/formatting-only saves or weigh-ins; multi-field section changes produce one consolidated Applied decision. (Part 13, 4B.6.)
5. **Label-only navigation changes — RESOLVED:** Dashboard → Today and Check-in → Weekly review as label renames only; `/dashboard` and `/check-in` URLs unchanged through Phase 4C; no redirects or route renames in 4A or 4B. (Part 12.)

No open questions remain for Phase 4B.
