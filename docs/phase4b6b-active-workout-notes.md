# Phase 4B.6B — Active Workout Detail Notes

Companion to the 4A audit and 4B.1–4B.6A notes. Second subphase of the approved 4B.6 split: `/workouts/[id]` — the active/completed/skipped workout execution and review experience — moves onto the ForgeFitOS design system. **Presentation, hierarchy, responsiveness, and accessibility only**: every lookup, guard, mutation, tracking-mode rule, confirmation flow, and API call is byte-anchored unchanged.

## Scope (8 feature/source files — under the 16-file stop rule)

Modified: `workouts/[id]/page.tsx` (container alignment + Train subnav + back link tokens), `WorkoutDetailClient` (two state cards), `SessionHeader`, `WorkoutExerciseBlock` (root wrapper + chrome tokens only), `WorkoutSessionNotes`, `WorkoutCompletionSummaryCard`, `AddExerciseSection`. New: `workouts/[id]/loading.tsx`.

**Deferred token-only files (safe to defer, 4B.6D audit):** `SetRow` — the highest-risk data-flow surface; zero `.shred-card`, legacy tokens render uniformly, its full-width grid inputs create no overflow or undersized-target defect at 375px, so per the token-only rule it was deliberately not touched. Same for `ExerciseHistoryRows` (subordinate display) and `ActiveWorkoutConflictModal` (already correct dialog semantics — `role="dialog"`, explicit three-choice buttons). `ProgressBadge` is clean. `ExercisePicker` retains its 4B.6A migration unmodified.

## Hierarchy and state treatment

Page order preserved exactly (behavior-neutral additions only): back link → **Train subnav** (new here; Workouts stays active via the 4B.6A route-aware matcher) → completion summary (completed only) → session header → session notes → exercise blocks → add-exercise (hidden when read-only). The pre-existing DOM order of client children was not changed.

**SessionHeader carries the state hierarchy** via a status-driven Card variant: `in_progress` → `action` (the page's primary surface), `completed` → `elevated` (settled), `skipped`/other → `subtle`. The status pill uses the same semantic mapping as SessionCard (caution/success/muted) with unchanged `WORKOUT_STATUS_LABELS` text — never color alone. **Complete workout** is the brand-filled primary button (≥44px, not celebratory); **Reopen workout** is a bordered neutral button (≥44px, behind its existing confirm); delete keeps its trash control with critical hover and existing per-state confirm copy. Title editing (edit/save/cancel, length counter, `aria-live` errors) is byte-preserved.

**Completed = read-only**: the existing `readOnly` gating (set fields disabled, add-exercise hidden) is untouched; the completion summary (`elevated` Card) renders the same computed values — factual, no celebration language. **Skipped** stays distinct: subtle header, no completed styling, notes read-only per the existing `isEditable` rule.

## Exercise blocks, sets, notes, add-exercise

`WorkoutExerciseBlock`: one `default` Card per exercise; expand/collapse header, trend labels (existing `TREND_LABEL`/`TREND_CLS` lib-driven classes untouched), metadata line, set list, add-set, remove — all behavior byte-preserved; only the wrapper and static chrome tokens changed. **SetRow untouched** (see deferrals) — all tracking-mode fields, warm-up toggle, completion control, conversions, and PATCH flows are exactly the Phase 2S/2V code. `WorkoutSessionNotes`: three render states each in a `default` Card; manual Save/Cancel semantics, 2000-char limit + `aria-live` counter, error retention — unchanged (no autosave introduced). `AddExerciseSection`: dashed ≥44px button (same treatment as routine detail) opening the already-migrated picker; POST endpoint unchanged.

## Loading, responsive, accessibility

New `loading.tsx`: back-link line + subnav strip + header region + **two exercise-block skeletons** + notes region + add strip; aria-hidden; no fake values; `max-w-3xl` matching the page. Route stays one-column at all widths (375/600/800/1280), controls wrap (`flex-wrap` preserved), no fixed-width traps introduced, shell remains the sole scroll owner (the picker's bounded list is the only sanctioned nested scroll). One H1 (the workout title in SessionHeader — unchanged), notes label/textarea association preserved, icon-only controls labeled (existing), statuses text-carrying. Not a WCAG claim.

## Deferred to 4B.6C/D

4B.6C: Fuel + Profile routes and components. 4B.6D: onboarding; final `.shred-card` inventory; legacy-token audit incl. `SetRow`, `ExerciseHistoryRows`, `ActiveWorkoutConflictModal`, `ExerciseForm`, `RoutineForm`, `CreateWorkoutButton`, `StartWorkoutButton`.
