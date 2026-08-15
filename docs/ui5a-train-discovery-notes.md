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

**Alphabetical body-part choices everywhere muscles are ordinarily
selected, filtered, picked, or listed** (hosted QA extended the
original exercise-form-only scope). Deterministic, case-insensitive
`localeCompare(label, 'en')` over **copied collections** at every
site; canonical registries, stored identifiers, role semantics,
filter result sets, and all write behavior are byte-identical.
Selections are value-keyed, so selected values remain selected
regardless of display order (runtime-proven, verify-ui5a A1-A9 and
M1-M17).

Sites (audit categories 1-3):

1. Exercise form: primary + secondary + tertiary choice groups
   (`MUSCLES_BY_LABEL` in `ExerciseForm`).
2. Exercise-library muscle filter pills (`ExercisesClient`).
3. Add-exercise picker muscle filter pills (`ExercisePicker` — shared
   with `/workouts/[id]` execution and routine building; smallest
   possible change: pill display order only, all handlers, filter
   values, selection callbacks, and the exercise-list order pinned
   unchanged).
4. Routine builder muscle-focus choices (`FOCUS_BY_LABEL` in
   `RoutineForm`, over `ROUTINE_MUSCLE_FOCUS`).
5. Library role lists: secondary/tertiary names sort alphabetically
   WITHIN each role; role order stays Secondary, then Tertiary
   (`ExerciseListItem`).
6. Muscle readiness chips (`MuscleReadinessPanel`) — the prior order
   was the fixed broad-group registry order, non-semantic (chips are
   never ranked by readiness); sorted copy in the presentation layer,
   `workout-coach` calculations untouched.
7. Training coverage groups + untracked list
   (`TrainingCoverageSection`) — prior order was the registry's
   anatomical grouping, non-semantic here; counts and recorded-data
   rules unchanged.

**Ranked analytical exceptions (intentionally NOT alphabetized —
order carries meaning):**

- Weekly muscle volume (`MuscleVolumeSummary`): sorted descending by
  real logged set counts — a true ranking.
- Progress overview/PR/exercise analytics: exercise-level results
  ordered by recorded data, not muscle lists.
- Single-label muscle displays (a card's one primary-muscle label,
  routine chips, progress detail metadata) are not lists and are
  untouched.

**Untouched canonical registries/stored data:** `PRIMARY_MUSCLES` and
`ROUTINE_MUSCLE_FOCUS` (constants), `MUSCLE_GROUPS`/`MUSCLE_LABELS`/
`MUSCLE_REGIONS` (exercise-validation), `DISPLAY_MUSCLE_GROUPS` +
`MUSCLE_GROUP_MAP` (workout-coach), `exercise_muscles` rows, and the
exercises-page DB ordering.

This is the only behavior refinement approved for UI-5A; everything
else in the pass is presentation-only. Category/equipment/tracking
groups keep their curated registry order (not muscle choices; out of
scope).

## UI-5B approved requirements

Recorded here so they cannot be lost. **None of these items is
implemented in UI-5A**; `/workouts/[id]` and the execution components
remain untouched (verify-ui5a X1-X5).

### 1. Save a workout as a routine

Users must be able to turn an existing workout into a reusable
routine.

- Available from an appropriate live or completed workout surface.
- Copies exercise identities, exercise order, set structure, tracking
  modes, and reusable prescription values.
- Does NOT copy completion state, elapsed time, workout date, PR
  status, or historical session identity into the routine.
- Requires a routine name and allows review/editing before final save.
- Never mutates the source workout.
- Handles duplicate routine names honestly.
- Must preserve ownership/RLS boundaries.

### 2. Repeat/copy a past workout as a current workout

Users must be able to use a past workout as the template for a new
current workout.

- Creates a new workout/session identity.
- Copies exercises, order, set structure, and appropriate prior
  values as editable starting values.
- Does NOT mark copied sets completed.
- Does NOT copy the historical date, duration, notes, PR flags,
  completion state, or session identity unless a field is explicitly
  intended as reusable.
- Respects the single-active-workout guard; if another workout is
  active, use the existing conflict flow.
- Never modifies the historical source workout.
- The copied workout remains fully editable before or during
  execution.

### 3. Reorder exercises in routines, live workouts, and past workouts

Users must be able to move exercises up and down after entry in:
routine construction/editing; live workouts; and completed/past
workouts where historical editing is permitted.

- Real, named **Move up** / **Move down** buttons.
- Keyboard, touch, and assistive-technology equivalent.
- Do not rely only on drag-and-drop.
- Disable Move up for the first item and Move down for the last.
- Persist order durably.
- Preserve all exercise IDs, set IDs, values, notes, completion
  states, timestamps, and history.
- Never duplicate, delete, reset, or recreate exercises or sets merely
  to reorder.
- Reordering a past workout changes presentation order only; it must
  not rewrite its logged performance data.
- Audit whether current APIs/schema already support durable ordering
  before implementation.

### 4. Apply first-set values to remaining sets

After the user enters weight and repetitions for the first set,
provide an explicit option to copy those values to the remaining sets.

- Provide an explicit `Apply to remaining sets` action after required
  first-set values exist.
- Do not silently populate sets merely because set one was entered.
- Copy only tracking-mode-relevant fields.
- Default to eligible blank remaining sets only.
- Never overwrite completed sets.
- Require deliberate confirmation before replacing already-entered
  incomplete values, if replacement is supported.
- Preserve set IDs, ordering, notes, and completion state.
- Missing values must remain missing, not become zero.
- Every populated set remains editable.
- Handle partial first-set data honestly; disable or explain the
  action until all required values exist.
- Include saving, failure, refresh-persistence, mobile, and keyboard
  QA.

## Future Coach requirements

Recorded for a later planning phase; **not designed or implemented in
UI-5A or UI-5B**.

### Suggested routine

- Coach may eventually generate or recommend a suggested workout
  routine.
- It must be presented as a suggestion requiring user review and
  acceptance, never silently activated.
- Future design should consider goals, available equipment, training
  history, current routine, recovery/readiness, scheduling
  preferences, injuries/limitations, and user-selected focus.
- It must explain why the routine is being suggested.
- Users must be able to edit, save, dismiss, or decline it.
- No medical claims, forced progression, or automatic replacement of
  an existing routine.
- Detailed product rules will be expanded in a later planning phase.

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
