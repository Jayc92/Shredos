# Phase 4B.4 — Coach Pillar Redesign Notes

Companion to the 4A audit and the 4B.1–4B.3 notes. This phase redesigns the three Coach-pillar routes — `/coach`, `/check-in`, `/decisions` — into one decision-support workflow on the 4B.1 design system and 4B.2 shell. **Presentation and information hierarchy only**: every query, reducer, threshold, decision transition, filter semantic, write contract, and URL is unchanged.

## The workflow and state separation

Coach = current-week guidance · Weekly review = completed-week evidence · Decisions = user-controlled follow-through and outcomes. The five states stay visually and semantically distinct: **observed data** (readiness chips, domain metrics), **system suggestion** (action cards, suggested decisions), **user decision** (explicit Accept/Dismiss/Record controls only — nothing automatic), **follow-through** (user-marked), **later outcome** (user-reviewed).

## Shared pillar subnav

`CoachSubNav` (new, modeled on the Phase 2Q `WorkoutsSubNav` pattern): three real links — Coach `/coach`, Weekly review `/check-in`, Decisions `/decisions` — exact-match active state, `aria-current="page"`, brand underline + weight (never color alone), `overflow-x-auto` for narrow screens, no persistence, no badge counts. Rendered on all three routes. It is contextual navigation *within* the pillar; the 4B.2 global navigation is not duplicated conceptually. The old redundant footer cross-links on /coach and /check-in were removed where the subnav now covers them (Progress links kept).

## Coach — /coach

Hierarchy: header (H1 **Coach**; metadata aligned from "Coach actions") → subnav → state/primary action → secondary actions → muscle readiness → Progress link. The primary action is **the existing first action from `buildCoachActions`** — never reselected — on an `action` Card with a "Primary action" pill; secondary actions render in existing order on `default` Cards in a two-column lg grid. RecordDecisionButton behavior is byte-preserved (explicit user action → one POST → suggested decision).

**Three distinguished states:** insufficient evidence (`hasEnoughData === false`) renders an info Notice — "Evidence is still building" — a coverage statement, never a success claim; a valid week with no actions (`hasEnoughData && !primaryAction`, previously rendered nothing) gets an explicit status Card — "No suggested actions for this week. Based on this week's available data."; otherwise actions render. A query failure inside the helpers yields the insufficient-evidence path, which makes no on-track claim.

**The one data addition on this route:** `MuscleReadinessPanel` (a `components/coach` audit item that previously rendered only on `/workouts`) now also renders on `/coach` — the brief's "Muscle readiness/context" section — via the **same existing `fetchCoachSummary` helper** the dashboard and workouts pages already use. No new readiness calculation; display-only. Because the panel is shared, `/workouts` picks up the same visual refresh (Card wrapper + semantic state chips) — a wrapper-level restyle, not a redesign of that route.

## Weekly review — /check-in

Hierarchy: header (H1 **Weekly review**, completed-week wording) → subnav → **period + evidence summary** (elevated Card: review period + week navigation on the left, "Evidence coverage" — the existing confidence label/detail, reframed as coverage, never a performance score — on the right) → **domain grid** (`lg:grid-cols-2`: Weight, Nutrition, Training, Activity as metric Cards; Fasting, when enabled, spans both columns so the conditional section never leaves a blank slot) → **Exercise progression** as a full-width section below the grid (matches the brief's "notable progression as a wider section"; counts strip + notable rows preserve existing order and cap) → **Next-week focus** (status Card; existing items, order, and max) → Progress/Coach links.

All values, comparison labels, week-navigation semantics (previous always; next only when a later completed week exists; Latest link when not on it), fake-zero avoidance ("No weigh-ins this week", never 0), and the fasting-disabled omission are unchanged — `fetchWeeklyReviewSummary` and every reducer are untouched.

## Decisions — /decisions

Hierarchy: header (H1 **Decisions**, aligned from "Decision log"; pending-count pill retained — grounded, since this page loads the full uncapped list) → subnav → **lifecycle strip** (subtle Card, existing vocabulary only: "Suggested → Accepted or Applied → Follow-through → Review outcome", with the explicit caveat that not every decision follows every stage and dismissed decisions stay valid) → **FilterChip row** (same seven filters, same semantics/order, pending count via the chip's count slot; selection = check + border + weight) → decision cards → same empty-state copy per filter (generic case now reads "No decisions match this filter.").

**DecisionCard** moved onto the Card primitive with a deterministic state-driven variant: `suggested` → `action` (direct user actions available), else due-for-review → `status`, else `dismissed`/`reversed` → `subtle` (historical), else accepted/applied → `elevated` (active). Status pills moved to semantic state tokens (caution/success/info/critical + subtle backgrounds) with the same text labels. Every control renders under exactly the same conditions (`isFollowThroughEligible`, `isOutcomeEligible`, `isDueForReview`, `isReviewDateSaveable`); PATCH flow, error retention, notes limits, and plain-text rendering are unchanged. Accept stays success-toned; Dismiss stays neutral — not destructive-styled.

## Card-variant mapping (summary)

| Surface | Variant |
|---|---|
| Coach primary action | action |
| Coach secondary actions | default |
| Readiness / no-actions state / empty filter results | status |
| Coach insufficient evidence | Notice (info) |
| Review period + evidence summary | elevated |
| Review domain sections | metric |
| Exercise progression | default (wide) |
| Next-week focus | status |
| Decisions lifecycle strip | subtle |
| DecisionCard | state-driven: action / status / subtle / elevated |

## `.shred-card` removal scope

Removed from: `coach/page.tsx`, `check-in/page.tsx`, `decisions/page.tsx` (already clean), `MuscleReadinessPanel`, `DecisionList`, `DecisionCard`. The alias remains defined globally for not-yet-migrated routes (`/progress`, `/nutrition`, `/profile`, …).

## Loading, responsive, boundaries

Three new `loading.tsx` files with route-matched skeleton geometry (header → subnav → summary/hero → grids/stacks; no spinners, no fake copy, aria-hidden, reduced-motion inherited). Coach and Weekly review use `max-w-6xl`; Decisions uses `max-w-3xl` — decision cards are dense text and wider lines would hurt readability. All grids are `lg`-keyed with one-column mobile; the shell breakpoint is untouched. Server/client split unchanged: `/coach` and `/check-in` remain fully server-rendered; `/decisions` keeps its existing client islands (`DecisionList` filter state, `DecisionCard` PATCH flow); `CoachSubNav` is the only new client leaf (`usePathname`). No new endpoint, no service role, no persistence.

## Accessibility

One H1 per route; section headings are h2; subnav is a labeled nav landmark with `aria-current`; filters are real buttons with `aria-pressed` and visible focus (FilterChip primitive); form controls keep their `aria-label`s and the notes `maxLength`; status pills always carry text; decorative icons `aria-hidden`; errors render inline and persist. A foundation — **not** a WCAG conformance claim.

## Deferred to 4B.5+

Progress-pillar route redesigns (`/progress`, `/weigh-in`, `/activity`, `/fasting`); Fuel/Train routes; repainting remaining domain-lib color output; `.shred-card` removal on remaining routes; any Coach-pillar copy revisit after ChatGPT review of the "Primary action" pill wording (was "Today's focus").
