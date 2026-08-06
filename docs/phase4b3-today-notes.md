# Phase 4B.3 — Today Page Redesign Notes

Companion to `docs/phase4a-ux-information-architecture-audit.md`, `docs/phase4b1-foundation-notes.md`, and `docs/phase4b2-navigation-notes.md`. This is the **first full route redesign**: `/dashboard` becomes the ForgeFitOS Today experience on the 4B.1 design system and 4B.2 shell. Route URL, metadata title (`Today`), queries, domain calculations, and link destinations are preserved.

## Page hierarchy

1. **Header** — H1 "Today" (the legacy time-of-day greeting is retired; the H1 now matches the shell label and metadata title), supporting line = full local date. The legacy header quick links survive with approved terminology: "Weekly review →" (/check-in) and "Coach →" (/coach).
2. **Primary action** — `TodayPrimaryAction` (Card `action` variant, full width). Two deterministic states from existing authoritative data: a *true active workout* exists (`findActiveTrainingSession`, the Phase 2K helper the workout APIs already use) → "Workout in progress" + **Resume workout** → `/workouts/[id]`; otherwise → "Train today" + **Start workout** → `/workouts`, with sessions-this-week context from the already-fetched week stats. No recommendation engine, no new prioritization rules, no plan changes.
3. **Upper status grid** — `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`, always exactly three lg columns: Nutrition (metric), Weight (metric), and a stacked column of Steps (metric) + Workout week status (elevated). No conditional card lives here, so no row can orphan (desktop-QA correction — Fasting originally sat here and left a blank middle row when enabled).
4. **Lower utility/review grid** — the conditional Fasting widget integrates here and the lg column count adapts with it: **three columns when Fasting renders** (Fasting status / Training coach / Latest decision) and **two when it does not** (Training coach / Latest decision). The hidden state never reserves a blank slot; the enabled state never orphans a row. DOM/keyboard order stays header → hero → status widgets → Fasting → Coach → Decisions. CoachCard is the retained seventh card (fixed advisory, see widget contract); DecisionLogCard keeps its "View all" link. The loading skeleton approximates the lower grid with the fasting-agnostic two-column geometry (it cannot know the profile).

## Card hierarchy (no more seven identical boxes)

| Domain | Variant | Rationale |
|---|---|---|
| Primary action | `action` | the one brand-tinted, raised surface on the page |
| Workout (week status) | `elevated` | training is the product's center of gravity |
| Nutrition / Weight / Steps | `metric` | quiet numeric surfaces |
| Fasting | `status` | stateful (live timer when a fast is active) |
| Coach | `status` | review/guidance surface |
| Decisions | `subtle` | quietest — a log pointer, not a daily task |

All seven cards moved off `.shred-card` onto the Card primitive, and their static chrome classes moved to semantic tokens (`text-ink`/`text-ink-muted`/`border-edge-subtle`/`bg-surface-sunken`/`text-brand`). Classes computed by domain libraries (`progressColor`, `remainingColor`, confidence colors, decision status colors) are deliberately untouched — they are lib output, not card chrome, and repainting them is a later, separate decision.

## Behavior notes (the only two changes beyond presentation)

- **Fasting card is hidden when fasting is disabled** — aligned with the 4B.2 navigation gating ("Fasting when enabled"). The legacy dashboard rendered a disabled card with an "Off" pill. `/fasting` remains reachable by direct URL; the fasting queries still run unchanged.
- **`findActiveTrainingSession` is now called by the page** (the one query addition, reusing the existing helper). It throws on query failure by design for creation paths; here it is display-only and wrapped in `.catch(() => null)` — a failed read hides the resume banner and falls back to the Start state. Workout creation keeps its own authoritative guard in the API routes.

## Responsive behavior

Mobile/tablet (< lg): one column; primary action first; both grids become two columns from `sm` (640px) — internal card layout deliberately uses `sm`, not the shell's `lg` switch. Content bottom padding comes from the 4B.2 shell. Desktop (lg+): `max-w-6xl` (up from the legacy `max-w-4xl`), three status columns, two review columns; the action buttons are ≥44px targets; long values truncate/wrap inside cards.

## Loading and empty states

`loading.tsx` renders geometry-matched 4B.1 skeletons during route transitions (server page = data arrives with HTML, so skeletons appear only while navigating; reduced-motion honored). Empty states are the cards' existing ones (no weigh-in yet, no targets set, no food logged, no fasts, no decisions) — all preserved verbatim, all with a constructive link and no guilt language.

## Widget contract (Phase 4C preparation — not implementation)

There are exactly **six future configurable widget IDs**:
`TodayWidgetId = 'workout' | 'nutrition' | 'weight' | 'steps' | 'fasting' | 'decisions'`.
Each of those six domain sections is wrapped in `<TodayWidget id>` → `<div data-widget="…">`, one id per section, ids unique on the page.

Two rendered sections are deliberately **outside** the widget contract:

- **The workout hero (`TodayPrimaryAction`) is fixed page hierarchy**, not a configurable widget. The `workout` id belongs to the week-status card in the grid, so 4C's mapping is one-id-per-section with no ambiguity.
- **`CoachCard` is a fixed review/advisory section for Phase 4B.3.** It intentionally has **no widget identity in this phase** — no seventh id was silently added. **Phase 4C must explicitly decide** whether Coach becomes a configurable widget (and if so, assign its id then) or remains fixed advisory chrome.

**No persistence or layout controls exist yet** — no settings, no hide/reorder/resize, no drag-and-drop, no stored layout, no migration 014.

## Deferred to 4B.4+

Coach/Weekly review/Decisions route redesigns; repainting domain-lib status colors onto semantic state tokens; `.shred-card` removal on remaining routes; dashboard customization + persistence (4C); any widget sizing controls.
