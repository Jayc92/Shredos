# UI-7 — Profile, Onboarding, Authentication, and Full-App Consistency

Final implementation phase of the established UI overhaul.
Presentation-and-consistency only. Starting state: `main` at
`fdb3a9fbaf6377211d0147cbe8e3b447bf4a688c` (UI-6C stable, tree
`f449659...`), migrations 001–022, 45 suites / 5,995 checks.

## Audited inventory and classification

**A. Changed in UI-7 (23 product paths + retargeted harnesses +
verify-ui7 + these notes):** the profile page, onboarding wizard +
Steps 1/3/4, login page, seven dashboard cards/tiles, the progress
overview and exercise-detail pages, the weigh-in page + form,
ExercisePicker, ProgressBadge, `globals.css`, `tailwind.config.ts`,
`.env.example`.

**B. Already compliant, intentionally byte-untouched:**
`profile/loading.tsx` (geometry already mirrors the rebuilt page),
`Step2Goals.tsx` (semantic tokens, no glyphs, compliant buttons),
`onboarding/page.tsx` (auth + completion gates), CoachSubNav,
WorkoutsSubNav, ProgressSubNav, `ui/option-card`, `ui/select`,
`ui/page-header`, layout shell (Sidebar/MobileBottomNav/route-match
labels were already Today/Train/Fuel/Workouts/Food log).

**C. Protected behavior contracts (proven byte- or
behavior-anchored):** every profile payload field/write and its four
decision-log side effects; imperial round-trip conversions;
onboarding's step machine, validation, single-submit writes,
completion redirect and guardrail warnings; login's
signIn/signUp/OTP calls, redirects, and `emailRedirectTo`; the auth
callback + signout routes (zero diff); parsing/bounds/steps on every
numeric input; missing-vs-zero semantics.

**D. Proven-dead code removed** (see below).

**E. Ambiguous/live legacy kept untouched:** `.metric-label` (live —
consumed by /nutrition and Step 4), `.metric-value`, `.status-muted`
(legacy but roadmap does not name them; usage audit deferred),
`--background/--card/--primary/...` legacy CSS vars (pinned by 4B.1
as compatibility contract), `NEXT_PUBLIC_APP_URL` (LIVE — three
readers in the login page).

**F. Deferred roadmap items:** everything in the exclusions list.

## Profile

PageHeader owns the title with the same support copy (verbatim,
single-line); the Name and height inputs moved off the legacy
`bg-secondary border-input ring-ring` aliases onto the semantic
input convention; every input meets 44px; the hand-rolled fasting
switch keeps its `role="switch"`/`aria-checked` contract, gains an
aria-label, a semantic `bg-ink` thumb, and the semantic focus ring.
Grouping (Personal info / Main goal / Activity level / Weigh-in
schedule / Fasting), width (`max-w-4xl`), OptionCards, selects,
range slider, save flow, and all copy unchanged.

## NumField findings

There is exactly ONE shared numeric-input component in the
repository: the `NumField` helper local to the profile page (its
documented structure — no cross-page abstraction exists, and none
was invented). UI-7 gave it htmlFor/id association, a 44px control,
and kept its adjacent (non-overlapping) unit span, semantic tokens,
`inputMode="decimal"`, select-on-focus, and placeholder behavior —
an empty value shows only its placeholder, while a stored zero
renders the literal "0" (missing never looks like zero). Onboarding
Step 1's `Input` gained a real suffix slot: the unit renders inside
the control with reserved `pr-10` padding and `pointer-events-none`,
so units can never overlap typed values or Safari's number controls.
Other numeric inputs (nutrition targets page, SetRow, WeighInForm)
are their own established per-surface implementations — audited,
already semantic, untouched.

## Onboarding

State machine byte-preserved (step order, skip/back/next bounds,
single-submit `handleComplete` with exactly three writes, completion
redirect, validation, all selection values). Presentation: PageHeader
owns the wizard title with the accessible "Step X of 4" description;
progress segments stay decorative (`aria-hidden`) beside that text;
Steps 1/3 inputs and textarea moved onto the semantic input
convention with associated labels; the Step 3 switch matches the
profile switch treatment; Continue/Back/Start tracking buttons keep
their wording with aria-hidden Lucide ArrowRight/ArrowLeft icons and
44px targets. The Step 4 calculation breakdown's multiplication sign
is mathematics, not an icon — untouched.

## Authentication

Login (the repository's only auth surface, plus the untouched
callback/signout routes): labels are now programmatically associated
(five htmlFor/id pairs), mode tabs are 44px with `aria-pressed` and
a weight change (never color-alone), inputs and buttons are 44px,
the one arbitrary `text-[hsl(var(--brand-foreground))]` became the
semantic `text-brand-foreground`, and password-manager attributes
(`autoComplete` email/current-password/new-password) are preserved.
Behavior byte-preserved: signInWithPassword/signUp/signInWithOtp,
`window.location.assign('/dashboard')`, `emailRedirectTo`, error
messages, rate-limit hint copy. No auth-loop change; the login page
never consumed `?next` and still does not (preserved, not added).

## Terminology

The shell was already aligned (Today/Train/Fuel pillars;
Workouts/Food log destinations; `/dashboard` presents as "Today").
The audit found no user-facing "Dashboard" label and no
inconsistent pillar/destination labels; internal identifiers, route
paths, API fields, and stored values were left byte-untouched. No
route, folder, or endpoint renamed. verify-ui7 F1–F3 pin the rules.

## Glyph cleanup

Every remaining user-visible text-glyph affordance in product
surfaces was replaced by an aria-hidden Lucide icon beside the SAME
visible label: dashboard header quick links and all seven
cards/tiles, the progress overview's STATUS_META badges (matching
the Weekly Review StatusBadge exactly) and its eight cross-links,
the exercise-detail back link and "Vs. previous session" line
(consumer-side SIGNAL_TEXT map; `lib/workout.ts` byte-untouched with
`progressLabel` retained as the explicit fallback), ProgressBadge
(SIGNAL_META with TrendingUp/TrendingDown/MoveRight; same wording),
the weigh-in confidence line and saved confirmation (Check icons),
ExercisePicker's library link, and onboarding's Continue/Back/Start
tracking buttons. Mathematical symbols (Step 4's multiplication
sign, activity multipliers "(x12)") were kept. WeighInForm's two
status lines also moved off raw `green-400`/`destructive` onto the
semantic success/critical tokens while being edited for the glyph.

## Proven-dead presentation code removed

1. **Seven `.text-*` typography roles** (`text-display`,
   `text-card-title`, `text-body`, `text-metric`, `text-button`,
   `text-badge`, `text-chart-annotation`): a repo-wide
   word-boundary search found zero references in `src/` (the only
   harness references were the superseded 4B.1 definition pins,
   retargeted). The four live roles (`text-page-title`,
   `text-section-title`, `text-support`, `text-label`) remain
   defined and consumed.
2. **`.shred-card` transitional alias** (globals.css): zero class
   usages anywhere in `src/` (the one `card.tsx` mention is a
   comment); every route composes `<Card variant>` since 4B.6D.
   The retained-alias pins in 4a/4b1/4b3/4b5/4b6a/4b6b/4b6c/4b6d
   were superseded presentation pins, retargeted to absence.
3. **`shred.*` literal palette** (tailwind.config.ts): zero
   `shred-green/amber/red/blue` class usages in source or scripts.
4. **`NEXT_PUBLIC_APP_NAME`** (.env.example): zero readers in
   source, config, or build files — `APP_NAME` is a hardcoded
   constant — so the variable is nonfunctional regardless of any
   deployment setting; the stale reference line was removed. (No
   Vercel access was needed for this proof: a variable with no
   reader cannot function.) `NEXT_PUBLIC_APP_URL` and the Supabase
   vars are live and untouched; the commented future-phase
   `ANTHROPIC_API_KEY` note was kept.

## Retarget ledger

All labels read exactly `RETARGET (UI-7)` — 43 labels total.
**Assertion retargets: 34 labels, 34 original boundaries, 49
modified assertions across 11 suites** (each preserves or
strengthens the original behavior boundary; only the displaced
presentation anchor moved): 4a x1 (alias documented -> absence);
4b1 x5 labels / 15 assertions (the one role-registry label covers
the 11-check loop — four live roles present AND seven removed roles
absent, one boundary; plus alias absence, palette absence, and two
token-value contracts); 4b3 x3 labels / 8 assertions (header quick
links; the shared card-action check covers six per-card assertions
under one boundary — approved label + ArrowRight; alias absence);
4b5 x6 (route-decl ban re-pinned to the href-pair shape;
STATUS_META; back link; cross-links; statuses-carry-text; alias
absence); 4b6a x2 / 4b6b x2 (picker link; alias absence); 4b6c x4
(profile PageHeader title; one-title-per-route; header copy anchor;
alias absence); 4b6d x7 (wizard step text; suffix slot; required
markers with htmlFor; input convention now semantic on BOTH
surfaces; alias absence; wizard PageHeader; labels with htmlFor);
ui2 x2 (nutrition + fasting card labels); ui4 x1 (STATUS_META);
ui6c x1 (X1 badge labels via SIGNAL_META, lib untouched).
**Worktree-scope admissions: 9 labels across 7 suites** (ui5a,
ui5b1a, ui5b1b, ui6a, ui6b x1 each; ui5b2 x2 and ui6c x2 — the
second label in each is the mechanical docs/scope line of the same
admission). **Exclusion-boundary narrowings — 0. Comment-only
cleanup — 0.** No behavioral assertion was deleted or weakened.

## Measured responsive empirics (all six approved widths)

Method (reproducible): production build, local `next start` on port
3012, the REAL `/login` page (a UI-7 surface, measured directly with
a deliberately long unbroken email typed into the real field) plus
an injected fixture carrying the exact shipped class strings for the
profile form (PageHeader block, long unwrappable name value, NumField
grid with unit spans, save button) and the onboarding card (progress
segments, `pr-10` suffix inputs with long values, icon buttons).
Measured after each resize settled.

| Width | clientWidth | scrollWidth | H-overflow | Out-of-viewport elements | Notes |
|------|------|------|------|------|------|
| 320  | 320  | 320  | none | 0 | login tabs 44px, email input 44px, Back/Continue 46px, NumField grid 2 cols, suffix pads 40px |
| 375  | 375  | 375  | none | 0 | profile/onboarding containers fill width |
| 768  | 753  | 753  | none | 0 | onboarding card capped at 512px (`max-w-lg`) |
| 1024 | 1009 | 1009 | none | 0 | profile capped at 896px (`max-w-4xl`) |
| 1440 | 1425 | 1425 | none | 0 | 896px profile shell centered (<2px offset) |
| 1920 | 1905 | 1905 | none | 0 | 896px/512px shells centered; zero console errors at every width |

## Hosted-QA checklist

1. `/login`: three mode tabs (44px, selected state readable without
   color), labeled fields, long emails never overflow at 320px;
   sign-in/sign-up/magic-link all behave exactly as before.
2. `/onboarding`: identical four-step flow; Continue/Back/Start
   tracking show icons, not text arrows; units sit inside the
   fields without overlapping typed values; progress segments +
   "Step X of 4" text.
3. `/profile`: PageHeader title; same sections, options, and save
   flow; every change still logs its decision; long names wrap.
4. Today: every card link reads the same label with an arrow icon
   (no text-arrow characters anywhere); Decisions card matches its siblings.
5. `/progress`: status chips read Improving/Steady/Declining/More
   data needed with trend icons; all cross-links icon-form; exercise
   detail's back link and "Vs. previous session" line glyph-free.
6. `/weigh-in`: confidence line shows a check icon + text; saving
   shows "Weigh-in saved." on success tokens.
7. Workout exercise cards: ProgressBadge reads Improved/Declined/
   Same/New exercise with trend icons.

## Exclusions and stop boundary

No Suggested Routine, StrengthLog import, community publishing,
upvotes/ranking, pace trends, milestone badges, consistency
percentages, streaks/scores/awards/projections, upcoming-run
scheduling, muscle-mass/waist metrics, invented Coach
recommendations, dashboard-customization persistence changes, Coach
hideability, pinch-zoom changes, theme toggle, wordmark redesign,
`max-w-7xl` densification, new behavior, new analytics, or UI-8. No
migration 023; no API/library/schema/RLS/dependency/env-meaning
change; no Supabase/Vercel contact. UI-7 stops uncommitted on
`main` for ChatGPT review; the roadmap then moves to the final
full-app QA/closeout pass.
