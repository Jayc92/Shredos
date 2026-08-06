# Phase 4B.6A — Train Hubs, Routines, and Exercise Library Notes

Companion to the 4A audit and 4B.1–4B.5 notes. First subphase of the approved 4B.6 split: `/workouts`, `/workouts/routines`, `/workouts/routines/[id]`, and `/workouts/exercises` move onto the ForgeFitOS design system. **The active workout detail flow (`/workouts/[id]` and its nine components) is explicitly untouched — Phase 4B.6B.** Presentation and hierarchy only; every query, mutation, validation, conflict guard, and URL is unchanged.

## Train contextual navigation

`WorkoutsSubNav` (Phase 2Q) aligned with the corrected pattern from 4B.4/4B.5: the full-width border moved to a non-scrolling wrapper (`overflow-x-auto` forces computed `overflow-y: auto`, so the old `-mb-px` link overhang would create the 1px scroll trap), and matching is now **route-aware with longest-prefix precedence** instead of exact-only: `/workouts/routines(/**)` → Routines, `/workouts/exercises(/**)` → Exercise library, any other `/workouts(/**)` → Workouts. Previously `/workouts/[id]` and `/workouts/routines/[id]` highlighted nothing; they now map to Workouts and Routines respectively (including the not-yet-redesigned detail route). Active = brand underline + weight + `aria-current`. `RoutineDetailClient` now renders the subnav (it previously had only a back link).

## /workouts hierarchy

Header → subnav → **Active workout resume card** (`action` variant; rendered only when a true active session exists, so no conditional blank space) → week summary + `CreateWorkoutButton` (`elevated`) → muscle readiness (existing panel) → routines entry (`interactive` link card, both states inside one link) → Today sessions → weekly muscle volume (`metric`) → recent sessions → empty state (`status`). `max-w-3xl` — session rows are single-column lists; a 6xl grid isn't justified by this content. The one data addition: `findActiveTrainingSession` — the same existing Phase 2K helper used by the Today page and workout APIs, display-only with `.catch(() => null)`. Section labels ("Today", "Recent sessions") became real `h2` headings.

## Session and routine cards

`SessionCard`: `interactive` Card inside its Link (no nested buttons, so card-as-link is safe); status pills moved to semantic state tokens (in-progress = caution, completed = success, planned = info, skipped = muted) with the same `WORKOUT_STATUS_LABELS` text. `RoutineCard`: same pattern. `RoutineExerciseRow`: `default` Card; reorder/edit/remove controls, validation, optimistic reorder + snapshot rollback all byte-preserved; destructive remove keeps its critical hover. `RoutineDetailClient`: meta card `default`, empty state `status`, delete stays visually critical and separated below the meta actions; the add-exercise affordance keeps button semantics (dashed border, now ≥44px). `RoutinesPageClient`/`ExercisesClient`: create forms open inside `elevated` Cards; empty states are `status` Cards; muscle filter pills moved to the FilterChip visual language (check + border + weight via `aria-pressed`; they remain client-state buttons as before).

## Deferred token-only files (safe to defer)

`ExerciseForm`, `RoutineForm`, `CreateWorkoutButton`, `StartWorkoutButton` contain legacy tokens but no `.shred-card`. They render consistently on the light theme today (the broken legacy tokens fail uniformly app-wide), create no overflow, no contrast failure, no undersized targets, and no hierarchy violation — and each already sits inside a redesigned Card container after this subphase. Deferred to 4B.6D's final legacy-token audit.

**Scope correction (QA):** `ExercisePicker` renders on `/workouts/routines/[id]` — a 4B.6A route — so it received the narrow presentation migration in this subphase after all (Card primitive + chrome tokens + FilterChip-language pills; every prop, filter rule, selection flow, and its prop-driven no-fetch contract byte-preserved; its pre-existing bounded `max-h-60` list scroll kept). Because the component is shared, `/workouts/[id]`'s add-exercise flow will naturally show the same card surface before its 4B.6B redesign — no other 4B.6B surface was touched, and the active-workout components (`WorkoutDetailClient`, `AddExerciseSection`, …) still carry their pre-migration markers.

## Loading, responsive, boundaries

Four new `loading.tsx` files (workouts, routines, routines/[id], exercises) with route-matched geometry; `/workouts/[id]` gets its loading state in 4B.6B. All routes `max-w-3xl`, one-column mobile, `sm`/`lg`-keyed only, no route-level scrollers, shell untouched. Server/client split unchanged: `/workouts` stays a server page; the routines/exercises client components remain the interactive islands. A11y: one H1 per route, labeled subnav landmark with `aria-current`, real links/buttons, labeled icon-only controls (already present), text-carrying statuses — not a WCAG claim.

## Deferred to 4B.6B/C/D

4B.6B: `/workouts/[id]` + WorkoutDetailClient, SessionHeader, WorkoutExerciseBlock, SetRow, WorkoutSessionNotes, WorkoutCompletionSummaryCard, AddExerciseSection, ActiveWorkoutConflictModal + its loading file (ExercisePicker's presentation already migrated here per the QA scope correction). 4B.6C: Fuel + Profile. 4B.6D: onboarding + final `.shred-card`/legacy-token inventory.
