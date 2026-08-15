# UI-5B1A — Train Execution Visual Modernization and Accessibility

## Scope

Presentation and accessibility only, for `/workouts/[id]` — the first
slice of the approved UI-5B sequence (5B1A, then 5B1B transactional
reordering + apply-to-remaining, then 5B2 save-as-routine +
repeat-workout). No API, library, migration, Supabase, mutation,
lifecycle, tracking-mode, or calculation change of any kind; every
handler, endpoint, payload rule, and refresh convention is
byte-anchored by `verify-ui5b1a` (H1-H11) and the prior suites.

Changed product files (5): `[id]/page.tsx`, `SessionHeader.tsx`,
`WorkoutExerciseBlock.tsx`, `SetRow.tsx`, `WorkoutSessionNotes.tsx`.

Intentionally untouched despite being in the expected surface:
`[id]/loading.tsx` (the page-level geometry did not change, so the
existing mirror stays honest byte-for-byte) and
`WorkoutCompletionSummaryCard.tsx` (already fully on the semantic
token system with no glyphs and no interactive controls). Both are
pinned untouched by verify-ui5b1a X3.

## Width strategy

**The execution page stays `max-w-3xl` and is deliberately NOT
widened.** It is a phone-first data-entry surface; set rows are dense
horizontal input groups that gain nothing from a wider desktop
container. Pinned by G6.

## Visual modernization

- Text glyphs removed from touched presentation: the back-link
  left-arrow and the routine-origin trailing arrow became lucide
  `ChevronLeft`/`ChevronRight`; the set-complete check glyph became a
  lucide `Check`; the trend up/right/down arrows became lucide
  `TrendingUp`/`MoveRight`/`TrendingDown` beside plain labels.
- Raw palette classes removed: the complete-toggle green-500 fill
  became `border-success bg-success-subtle text-success`; the trend
  chips' green/amber literals became the semantic
  success/caution/sunken state tokens.
- Legacy token aliases in touched files migrated to the UI-1 system:
  `bg-secondary`/`bg-background`/`border-input` inputs became
  `bg-surface-interactive border-edge`; `text-muted-foreground` became
  `text-ink-muted`; `text-destructive` became `text-critical`;
  `border-border/40` row separators became `border-edge-subtle`.
- Information architecture unchanged: summary, then session header
  (the session title remains the page's only H1), then notes, then
  exercise blocks, then add-exercise. Long session titles now wrap
  (`min-w-0 break-words`) instead of truncating.
- No decorative metrics, scores, badges, streaks, projections, or
  invented visuals (G7).

## Accessibility corrections (44px targets)

The audit found the set-row controls at 28px and under. Corrections:

- **Set rows (complete, warmup, delete): REAL 44x44 CSS boxes
  (`h-11 w-11` / `h-11 min-w-11`), with no pseudo-element hit-slop
  anywhere** (a hosted-review correction replaced the earlier
  `after:-inset-1` approach, which allowed ambiguous overlapping
  pointer regions). Below `sm:` the row wraps into a two-row
  composition: set number left and the action group right on the
  first row, the tracking inputs full-width on the second
  (`flex-wrap` + `order-last w-full` on the inputs group + `ml-auto`
  on the action group — pure CSS; every control exists exactly once
  in the DOM). From `sm:` the original single-row composition
  returns with the same real 44px boxes. The sets area is full-width
  on phones (`pl-0 sm:pl-6`) and the header shows only the input
  labels at base (`sm:`-only set-number and action columns).

  Final measurements against the compiled stylesheet, real markup:
  - 320px: warmup/complete/delete each 44x44 actual boxes, 8px gaps,
    zero overlap, no `::after` positioning; inputs Reps 97px /
    Weight 97px / RPE 48px, duration 56px each, distance 124px;
    card 288px, sets content 254px; no card or document horizontal
    overflow.
  - 375px: inputs 125/125/48, duration 70px each, distance 152px;
    same 44x44 boxes; no overflow.
  - 640px (`sm:`): single 44px-tall row, inputs 155/155/48, buttons
    44x44, no overflow.
- **Session header (delete, save-title, cancel-title):** real
  `h-11 w-11` (44px) buttons.
- **Remove exercise:** real `h-11 w-11` button.
- **Add set / title edit / disclosure rows:** `min-h-11`.
- Completion and warmup state are never color-only: `aria-pressed`,
  the `Check` icon, the `WU` text, and label changes carry the state.
- Every icon-only control keeps a meaningful `aria-label`; decorative
  icons are `aria-hidden`; existing `aria-live` save/error feedback,
  disabled/busy states, and keyboard operation (Enter/Escape title
  handling, real buttons everywhere) are unchanged.

## Retargets

All labeled in-suite and individually reported:

- `verify-phase4b6b` (3, labeled `RETARGET (UI-5B1A)`): back-link
  glyph pin re-anchored to ChevronLeft + href; routine-origin arrow
  pin re-anchored to copy + href + ChevronRight; the page DOM-order
  pin re-anchored on the new back-link markup (the old anchor would
  have passed vacuously at indexOf -1).
- `verify-ui5a` (2, labeled `RETARGET (UI-5B1A)`): the UI-5A
  execution-exclusion pins (X1/X2) now admit exactly the approved
  UI-5B1A file set; every remaining exclusion stays byte-untouched
  and the behavioral anchors (X4/X5) are unchanged, so the protection
  is re-scoped, not weakened.

## Hosted-QA focus

Real phone data entry in every tracking mode; complete/warmup/delete
tap accuracy at the new sizes; 320px rows without horizontal overflow;
completed/read-only lock; reopen/complete round trip; title edit;
session and exercise notes; trend chips and PR labels rendering.
