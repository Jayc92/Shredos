# UI-6A — Fuel Visual Rebuild

Presentation-only rebuild of the Fuel pillar: `/food`, `/food/saved`,
and `/nutrition` (plus their loading states and the fifteen food/
nutrition components those routes compose). Fasting and Coach are
NOT part of this slice.

## Visual architecture

- **/food** — approved wide-route composition (`max-w-6xl`). The
  meal-entry workflow is the feature column; the daily macro summary,
  nutrition coaching panel, and the two collapsed disclosures (saved
  meals, recently logged foods) form a naturally sized rail at `lg`
  (`items-start`, no equal-height forcing). The rail renders first in
  the DOM so the mobile single column keeps the established 4B.6C
  sequence: macro summary and shortcuts ahead of the meal sections.
  Date navigation stays full-width above both columns.
- **/food/saved** — `max-w-6xl`, PageHeader with the New-meal action
  slot, SectionHeader group titles, and a 1/2/3-column responsive
  card grid so the list never floats as one narrow column.
- **/nutrition** — `max-w-6xl`, two-column desktop grid
  (`3fr/2fr`, `items-start`): the authoritative current target, the
  goal-adjustment review, and the override form are the primary
  column; the calculated suggestion and the trend section form the
  second. Mobile stacks primary column first, so suggestion surfaces
  still never sit above the authoritative target.

## Design-system adoption

PageHeader owns each route title (one per page, no handwritten h1);
SectionHeader for the saved-meal groups; every legacy alias
(`text-muted-foreground`, `text-foreground`, `bg-secondary`,
`bg-card`, `bg-background`, `bg-muted`, `border-border`,
`border-input`, `text-destructive`, `bg-destructive/*`) and every raw
palette class (green/amber/blue/red/yellow/orange-N) in the seventeen
touched files migrated to the semantic tokens (surface/
surface-sunken/surface-interactive/surface-selected, edge/
edge-subtle, ink/ink-muted, success/caution/critical/info + their
subtle pairs). Text arrow/checkmark/down-arrow glyph affordances became Lucide
ArrowRight/CheckCircle2/ArrowDown on 44px-minimum controls. Loading states
mirror the rebuilt geometry (width, header, subnav, column split,
card regions) with no fake values or interactive elements.

## Protected semantics (unchanged, byte- or behavior-anchored)

Calorie/macro calculations and remaining/over thresholds
(`lib/food.ts`); missing-vs-zero copy; the local-calendar contract
(cookie-resolved today, pure string DateNav, future blocking,
explicit `?date`, LocalDateSync self-heal, user-local meal-pacing
hour); the 14-day/60-row/dedup/max-10 recent-foods contract and both
independent collapsed disclosures; day-complete semantics; every
mutation payload (`/api/food-logs*`, `/api/saved-meals*`,
`quick-add`, `/api/goal-adjustment`, day-status); the versioned
`effective_date` target upsert, its validation and the
`decision_logs` side effect; adjustment-review decision flow; no
eat-back or burn-credit arithmetic anywhere.

**Binding architecture decision:** `/food/saved` and `/nutrition`
retain their existing direct browser-Supabase reads/writes (RLS is
the guard). No API routes or server mutations were added in UI-6A.

## Roadmap-only: community exercise and workout publishing

Recorded 2026-08-16 as an approved FUTURE feature. **Nothing about
this feature is implemented, schema-designed, or migrated in UI-6A**;
this entry exists so the requirements cannot be lost.

- Users may publish exercises and workouts for others to discover.
- Users may follow or add published items to their own routines.
- Public exercises and workouts may receive upvotes.
- Higher-voted items may gain more discovery visibility.
- Future design must include moderation, ownership/provenance,
  privacy, abuse prevention, versioning, deduplication, and
  preserving user history when a public source changes.

Related roadmap-only items recorded elsewhere: Coach Suggested
Routine and the Future Exercise Library Expansion (StrengthLog as a
research/discovery source, original ForgeFitOS instructional copy and
media) — both in `docs/ui5a-train-discovery-notes.md`, both still
unimplemented.
