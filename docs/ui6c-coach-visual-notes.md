# UI-6C — Coach, Weekly Review, and Decisions Visual Rebuild

Presentation-only rebuild of the Coach pillar (`/coach`, `/check-in`,
`/decisions` + their loading states) plus the pre-existing
workout-signal badge visibility correction across its three
consumers. Starting state: `main` at
`3c35b85f2505720a8df8ffbdb3ac4e39f78914e9` (UI-6B stable), migrations
001–022.

## Route composition

- **/coach** — `max-w-6xl` (unchanged); PageHeader owns the title
  with the same rule-based support copy; CoachSubNav in place; the
  three distinct page states preserved (insufficient-evidence Notice,
  no-actions status card, primary + secondary ActionCards);
  MuscleReadinessPanel and the Progress cross-link unchanged in
  placement. Action links became 44px inline-flex controls with
  aria-hidden ArrowRight icons.
- **/check-in** — `max-w-6xl` (unchanged); PageHeader with the
  completed-week support copy verbatim; explicit `?week` navigation
  preserved with ChevronLeft/ChevronRight 44px links; the domain grid
  and mobile DOM order unchanged; STATUS_META replaces the glyph
  labels — TrendingUp "Improving", MoveRight "Steady", TrendingDown
  "Declining", "More data needed" (no icon) — icons aria-hidden, text
  always present; all fourteen cross-links converted to 44px
  ArrowRight controls with identical labels and destinations.
- **/decisions** — **widened from the previously documented
  `max-w-3xl` readable-width decision to the app-wide `max-w-6xl`**
  (explicitly approved in the UI-6C contract, superseding the 4B.4
  note); PageHeader with the grounded pending count in the action
  slot; the lifecycle explainer keeps its exact vocabulary
  (Suggested, Accepted or Applied, Follow-through, Review outcome)
  with aria-hidden ArrowRight separators; DecisionList renders one
  column below `lg` and two columns at `lg` (`items-start`, natural
  independent card heights, `min-w-0` cards, stable keys, newest-first
  data order preserved — row-major reading order).

## Workout-signal badge correction (pre-existing defect)

Root cause: `src/lib/workout.ts` `progressColor(signal)` returns
legacy literal palette composites, but Tailwind's content globs scan
only `src/app`, `src/components`, and `src/pages` — never `src/lib` —
so the composite utilities were never emitted into the compiled
stylesheet, and every signal chip (workout ProgressBadge, Progress
overview StatusBadge, Weekly Review StatusBadge) rendered colored
text over a transparent background with an uncolored border.

Correction (the proven UI-6A macro-fill pattern; `lib/workout.ts`
byte-untouched, helper calls kept verbatim): each scanned consumer
maps the helper result to compiled semantic tokens keyed on the hue
word — green -> `bg-success-subtle text-success border-success/20`,
red -> `bg-critical-subtle text-critical border-critical/20`, blue ->
`bg-info-subtle text-info border-info/20`, secondary/same ->
`bg-surface-sunken text-ink-muted border-edge` — with the visible
fallback `bg-surface-sunken text-ink border-edge`. The mapping is
exhaustive over all four possible returns; no dead literal appears
anywhere in scanned source (comments included); every badge keeps its
visible text label (`progressLabel` untouched), so no state is ever
color-only.

## Protected behavior (unchanged)

`buildCoachActions` selection/priority/thresholds and every action's
title/reason/next step/link/decision-recording wiring; the three
Coach page states; MuscleReadinessPanel calculations and alphabetical
presentation; `fetchWeeklyReviewSummary` completed-week-only
boundary, explicit `?week` navigation semantics, confidence meaning
(data-completeness only), domain aggregations, fasting flag gating,
focus items, and missing-data states; decision lifecycle vocabulary,
every DecisionCard mutation/status transition/review-date rule/
confirm boundary/refresh, and the `/api/decisions` payloads;
newest-first uncapped decisions read with the grounded pending count;
local-date anchors on coach and check-in; RLS/session-derived users;
missing-vs-zero everywhere. Claims/safety audit outcome: the existing
language is appropriately cautious (rule-based framing, evidence-
coverage states, data-completeness confidence, no medical or
guarantee language) — nothing was rewritten.

## Accessibility and responsive contract

One PageHeader title per route; aria-hidden decorative icons with
text always present; preserved aria-labels (week navigation,
DecisionCard controls); 44px minimum targets on every touched
action/link (including the DecisionCard expand, follow-through,
and review-date controls); no color-only information; loading states
mirror the rebuilt geometry with no fake recommendations, statuses,
confidence, or controls.

### Measured responsive empirics (all six approved widths)

Method (reproducible): production build (`npm run build`), local
`next start` on port 3012, unauthenticated `/login` page (real
compiled stylesheet), a structural fixture injected with the exact
class strings shipped by the three routes (`mx-auto max-w-6xl
space-y-5 p-4 lg:p-6` container; `grid grid-cols-1 gap-4
lg:grid-cols-2` coach/review grids with two `lg:col-span-2` wides;
`grid grid-cols-1 gap-3 lg:grid-cols-2 lg:items-start` decisions
grid with `min-w-0` cards of deliberately unequal content; the
`flex flex-wrap` lifecycle strip with three inline arrow icons; all
four badge token composites; a 92-character wrapping card title).
Each width was measured only after the resize settled
(`window.innerWidth` equal to the target). `clientWidth` differs
from the viewport by the 15px scrollbar; Tailwind's `lg:` media
query keys on viewport width, so 1024 correctly renders two-column.

| Width | clientWidth | scrollWidth | H-overflow | Coach grid | Review grid | Decisions grid | Lifecycle/badges/long-title contained | Console errors |
|------|------|------|------|------|------|------|------|------|
| 320  | 320  | 320  | none | 1 col | 1 col | 1 col | yes | 0 |
| 375  | 375  | 375  | none | 1 col | 1 col | 1 col | yes | 0 |
| 768  | 753  | 753  | none | 1 col | 1 col | 1 col | yes | 0 |
| 1024 | 1009 | 1009 | none | 2 cols | 2 cols (wides span 2) | 2 cols | yes | 0 |
| 1440 | 1425 | 1425 | none | 2 cols | 2 cols | 2 cols | yes | 0 |
| 1920 | 1905 | 1905 | none | 2 cols | 2 cols | 2 cols | yes | 0 |

At 1440 and 1920 the container measured exactly 1152px
(`max-w-6xl`) and was horizontally centered (offset < 2px). At 1920
the three decisions cards measured 58/106/58px tall — proof of
`items-start` natural, independent heights. The `lg:col-span-2`
wide sections computed `grid-column: span 2 / span 2` at 1024+.

## Hosted-QA correction — human-readable decision diffs

Hosted QA rejected the expanded DecisionCard's raw JSON "Before"/
"After" boxes (braces, quoted keys, internal names like `protein_g`)
as the default presentation. Presentation-only correction: the new
colocated `DecisionValueChanges` component (with its pure
`buildDecisionDiff` formatter) renders the SAME stored audit
payloads as a concise change list — only fields whose values
actually changed, friendly labels (Calorie target, Protein target,
Carbohydrate target, Fat target, Weigh-in schedule, Step goal,
Fasting goal, Main goal — every key any repository code path writes
today), formatted values (`2,100 cal`, `90 g`, `Weekly`,
`Every two weeks`), `Not set` for null/absent, sr-only Before/After
labels with an aria-hidden ArrowRight, flex-wrap/break-words/min-w-0
mobile-safe rows. Identical snapshots say
"No value changes were recorded." Any DIFFERING content the registry
cannot translate confidently (unknown key, nested object, unexpected
type) keeps the untouched raw JSON available behind a collapsed
"Technical details" disclosure — raw JSON is never the default and
nothing is silently omitted or invented. Stored payloads, endpoints,
mutations, lifecycle transitions, pending count, ordering, and every
DecisionCard control are byte-preserved.

Empirics (same production-build fixture method as the main table,
expanded card with a long label, a long wrapping value, a
deliberately unbroken 60-character value token, and an open
Technical details JSON block): no horizontal overflow and zero
out-of-viewport elements at 320/375/768/1024/1440/1920; decisions
grid one column below `lg`, two at `lg`+; shell 1152px centered at
1440/1920; card heights stay natural (58/330-432/58 — the expanded
card alone grows). One real defect was caught and fixed by the 320px
measurement: `overflow-wrap: break-word` does not constrain a flex
item's intrinsic min-content width, so an unbroken long value forced
471px scroll width; the value spans now use `overflow-wrap: anywhere`
(pinned by the harness), which does.

## Exclusions and stop boundary

No Suggested Routine implementation (roadmap-only, recorded in the
canonical Train notes); no StrengthLog Exercise Library Expansion
(roadmap-only, same record); no community exercise/workout publishing
(roadmap-only, recorded in the UI-6A notes); no new scoring, grades,
streaks, rankings, consistency percentages, projections, or
gamification; no calculation/threshold/API/schema/migration/
dependency changes; no Supabase/Vercel operation; no UI-7 work.
UI-6C stops uncommitted on `main` for ChatGPT review.
