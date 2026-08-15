# UI-5A — Train Discovery and Management Visual Rebuild

## Scope

Recomposes the four Train **discovery/management** routes onto the
UI-1 token system and UI-1B presentation primitives, at the approved
width, preserving every behavior and data semantic byte-for-byte:

- `/workouts` (hub) + loading
- `/workouts/routines` + loading
- `/workouts/routines/[id]` + loading
- `/workouts/exercises` + loading

**UI-5B (later, explicitly excluded here):** `/workouts/[id]` and the
entire live/completed session execution surface — `WorkoutDetailClient`,
`SessionHeader`, `WorkoutExerciseBlock`, `SetRow`, `AddExerciseSection`,
`WorkoutCompletionSummaryCard`, `WorkoutSessionNotes`, plus every
component used only by execution. None of these files changed in UI-5A
(proved by `verify-ui5a` X1–X5).

## Approved decisions applied

- UI-5 is Train, split into 5A (discovery/management) and 5B (execution).
- Routes may widen responsively **up to `max-w-6xl`** (previously
  `max-w-3xl`); mobile remains single-column.
- The live workout execution surface is untouched.

## Architecture

**Workouts hub** — `PageHeader`, then Train subnav, then the
resume-active card (unchanged behavior, brand CTA), then week
summary + create, then the log-past disclosure, then the body grid:
at `lg+` a session column (`lg:col-span-7 xl:col-span-8`: Today,
then Recent sessions, then empty state) beside a supporting rail
(`lg:col-span-5 xl:col-span-4`: muscle readiness, then routines
entry, then weekly muscle volume). `lg:items-start`
keeps natural independent heights (the UI-2 stretch lesson). Below
`lg` everything renders as one column, sessions first.

**Routines list** — `PageHeader` (title, honest saved count, 44px New
action), then the responsive routine-card grid
(`sm:grid-cols-2 xl:grid-cols-3`, single column on mobile). Create
form bounded to `max-w-2xl` so widening never stretches form controls.
Empty state moved onto `EmptyState` with byte-identical copy.

**Routine detail** — widened container used only where content
benefits: identity/management column (meta card, edit form, start
button — `lg:col-span-5 xl:col-span-4`) beside the exercise list
(`lg:col-span-7 xl:col-span-8`). Forms stay bounded to the identity
column. All CRUD, reorder, delete/409, start/conflict flows untouched.

**Exercise library** — `PageHeader` + 44px search (`min-h-11`) +
unchanged muscle filter pills, then the two-column exercise grid at `lg+`
(`lg:grid-cols-2`), single column on mobile. Inline edit forms expand
within their grid cell. Filter semantics, CRUD, and the 5A.6B stored
anatomy display are unchanged.

**Loading states** — each mirrors its rebuilt route's real geometry
(same container width, same grid classes, same column spans), remains
`aria-hidden`, and shows no fake values.

## Presentation details

- Long routine names and session titles now **wrap**
  (`min-w-0 break-words`) instead of truncating — hosted QA raised
  real long names as a risk. Exercise names already wrapped.
- Text glyphs removed from touched presentation: the right-arrow
  U+2192 (routines entry copy), the single-right-angle U+203A (hub +
  routine card chevrons), the left-arrow U+2190 (detail back link),
  and the tilde-operator U+223C (duration chip) became lucide
  `ChevronRight`/`ChevronLeft` and plain
  `~`. Untouched files keep their existing characters (UI-7 scope).
- 44px principal controls: resume CTA, New (routines + library),
  library search, add-exercise.
- No color-only state, no fixed widths, no `md:` (shell discipline),
  no equal-height stretching (`lg:items-start` on every grid).

## Retargets (verify-phase4b6a)

All retargets replace **presentation literals** displaced by the
approved composition; every behavior pin is untouched. Each is flagged
`RETARGET (UI-5A)` in the suite:

1. Hub/clients single-H1 pins re-anchored to `PageHeader` (default h1, no `as=`),
   detail keeps its literal `<h1`; one-H1-per-page boundary unchanged.
2. Routines-entry copy: trailing right-arrow (U+2192) removed; both entry states +
   link + lucide chevron now pinned.
3. SessionCard `truncate` replaced by `break-words min-w-0` (strictly more
   content-safe; no-overflow boundary preserved).
4. Loading width `max-w-3xl` widened to `max-w-6xl` (mirror-the-route
   boundary unchanged).
5. Library loading search `h-9 w-full` raised to `h-11 w-full` (mirrors the
   44px control).
6. Hub section headings: hand-rolled `<h2>` replaced by `SectionHeader`
   (default h2); real-h2 boundary asserted on the new anchors.
7. Hub DOM-order pin re-anchored (`<PageHeader`/`<SectionHeader`),
   asserting the same hierarchy: header, then subnav, then resume,
   then week/create, then today, then history.
8. Hub width `max-w-3xl` widened to `max-w-6xl`, documented here.
9. Routines-entry single-right-angle (U+203A) span replaced by `ChevronRight` aria-hidden.
10. Hub h2 count: 1 literal (resume card) + 2 `SectionHeader`s —
    three headed sections preserved.

## Sole approved minor behavior refinement (addendum)

**Alphabetical body-part choices in the exercise form.** When creating
or editing an exercise, all three muscle/body-part choice groups
(primary, secondary, tertiary) display in alphabetical order of the
displayed label — a deterministic, case-insensitive
`localeCompare(…, 'en')` over a **spread copy** (`MUSCLES_BY_LABEL`)
of `PRIMARY_MUSCLES`. The canonical registry keeps its grouped order
(constants untouched); stored identifiers, grouping semantics,
database values, the `muscle_targets` payload, and all write behavior
are byte-identical. Selections are value-keyed, so selected values
remain selected regardless of display order (runtime-proven,
verify-ui5a A1–A9). This is the only behavior refinement approved for
UI-5A; everything else in the pass is presentation-only.
Category/equipment/tracking groups keep their curated registry order
(not muscle choices; out of the addendum's scope).

## UI-5B approved requirements

Recorded here so they cannot be lost. **Neither item is implemented in
UI-5A**; `/workouts/[id]` and the execution components remain
untouched (verify-ui5a X1–X5).

### 1. Workout exercise reordering

Users must be able to reorganize exercises after adding them to a
workout — e.g. moving any of eight entered exercises up or down.

- Real, named **Move up** / **Move down** buttons for keyboard, touch,
  and assistive-technology equivalence.
- Do not rely exclusively on drag-and-drop.
- Disable Move up on the first exercise and Move down on the last.
- Persist the new order durably.
- Preserve every exercise, set, value, note, completion state, and
  exercise identity during reordering.
- Reordering must not duplicate, delete, or reset any exercise or set.
- Audit whether the same ordering capability should apply to routine
  construction and active workout sessions, and implement consistently
  where supported by the data model.

### 2. Apply the first set to remaining sets

After the user enters weight and repetitions for the first set,
provide an explicit option to copy those values to the remaining sets.

- Clearly named action such as `Apply to remaining sets`.
- No silent auto-population merely because the first set was entered.
- Respect the exercise's tracking mode; copy only fields applicable to
  that mode.
- By default, fill only remaining eligible **blank** sets.
- Never overwrite completed sets.
- If replacing already-entered incomplete values is supported, require
  a deliberate confirmation stating what will be replaced.
- Preserve set IDs, order, completion state, notes, and unrelated
  fields.
- Allow users to edit any populated set afterward.
- Handle partial first-set data honestly; disable or explain the
  action until all required values exist.
- Prove missing values remain missing rather than becoming zero.
- Include mobile, keyboard, saving, failure, and refresh-persistence
  QA.

## Honesty and protected semantics

No new fetches, metrics, scores, streaks, badges, rankings, or
projections. All hub queries, `findActiveTrainingSession` resume
wiring, create/start conflict (409) flows, routine/exercise CRUD,
optimistic reorder with snapshot rollback, stored `exercise_muscles`
anatomy (read-only), three-set defaults (owner files untouched),
backdated-workout entry, muscle readiness/volume calculations, empty
and error states, and missing-vs-zero distinctions are preserved —
pinned by `verify-ui5a` (B1–B18, X1–X6) plus all prior suites.

This is a presentation rebuild; it makes **no WCAG conformance claim**
(not a WCAG claim), only the specific structural assertions in the
harness.
