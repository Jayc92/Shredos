# Phase 5A.5 — Live Workout Calories Parity Notes

Fifth subphase of Phase 5A, from checkpoint `bfbcc93` / `phase5a4-daily-aggregate-distance-stable`. Closes the workout-calorie parity gap: historical/manual workouts (5A.2) and intentional activity sessions (5A.3) could record `calories_burned`, but live workouts — whose rows have carried the column since migration 014 — had no write path and no UI. **No migration**: 014's `calories_burned INTEGER CHECK (>= 0)` already applies to every source; grants (003) and RLS cover the column; the harness pins "exactly 17 migrations, no 018."

## The parity gap (audited)

The only calories write path was the `manual_metadata` PATCH mode, correctly gated `source === 'manual'` because it also rewrites date/start/duration — loosening that gate would have exposed timestamp correction for live rows. The only display was SessionHeader's completed-only line. Coach, dashboard, weekly-review, and progress-summary have zero calorie consumers, so parity is purely capture/edit/display.

## New PATCH mode: `workout_calories` (D1)

`PATCH /api/workouts/[id]` with body exactly `{ mode: 'workout_calories', caloriesBurned }` — unknown keys rejected explicitly (2M convention). Auth → ownership (404) → eligibility → shared validation → update. **Eligibility:** source in `live`/`manual` (legacy has unknowable provenance; imported is reserved), status in `in_progress`/`completed` (a reopened live row is in_progress and stays eligible; skipped/planned rejected — audit confirmed `planned` has zero writers anywhere, it exists only in the type vocabulary). The branch sits after `manual_metadata` and **before** `blockIfSessionCompleted`, so a completed workout corrects calories **without reopening** — the generic completed-row lock is untouched and still guards title/notes. The update payload is structurally `{ calories_burned }` only: id, user_id, source, status, workout_date, start/end_time, completed_duration_seconds, title, notes, routine_id, exercises, and sets are unreachable (pinned by payload inspection).

## Live-only UI clarification (D6)

The API accepts live + manual, but the new SessionHeader control renders **live-only** (`source === 'live'` AND in_progress/completed): manual rows already edit calories inside "Edit workout details" and must never get a second calories control. Labels: `Log calories` when NULL, `Edit calories` when recorded, `Close calories` while open; one "Calories burned (optional)" field, placeholder "Not recorded", explicit Save changes/Cancel, no autosave. The button re-seeds the field from the stored row on every open. Legacy/imported/skipped/planned rows render no editor — `caloriesEligible` is the single render gate.

## NULL-vs-0 and the shared validator (D3)

`validateWorkoutCalories` in `lib/workout.ts` is now the ONE workout-calorie validator. The authoritative rule, same as 014/5A.4: **NULL = not recorded, 0 = explicitly recorded zero.** Blank/whitespace/null/absent → NULL (never coerced to zero); 0 → explicit recorded zero; positive integer → exact value; reject negative, decimal, NaN, Infinity, malformed strings, and — the hostile-coercion tightening — **booleans, arrays, and objects**, which previously slipped through the 5A.2 manual path via `Number()` (`Number(true)===1`, `Number([])===0`). `validateManualWorkoutMetadata` now delegates its calories block to it — **APPROVED RETARGET**: legitimate blank/0/positive historical behavior is byte-identical (runtime equivalence matrix pinned across 18 fixtures), only the coercion holes closed. Upper bound: `WORKOUT_CALORIES_MAX = 2147483647`, the PostgreSQL INTEGER storage ceiling — a storage bound with a "too large to store" error, NOT a product-level plausibility cap; no workout-calorie maximum exists below it.

## Display-gate change (D2)

The completed-only gate is gone: `calories_burned != null` now displays "Calories burned N" during in_progress AND completed — a value entered mid-workout appears immediately after save (router.refresh). NULL renders nothing; explicit 0 renders "Calories burned 0". One flagged 5A.2 retarget (the old `isDone &&` pin); a second flagged 5A.2 retarget updates the Safari layout-class occurrence counts (the new field uses the same `min-w-0` safe pattern, moving 4→5 and 6→7 — the manual editor's grids remain exactly 2).

## Provenance preservation

Entering calories manually on a live workout is metadata, not a capture-source change: the mode cannot carry `source`, so the row stays `source='live'`, and **"Logged manually" remains tied exclusively to `source='manual'`** (single render site, pinned). Manual rows stay `source='manual'`. No `calories_source` column — imported-calorie provenance belongs to the future Health/import design.

## Completed live workouts

Calories correction on a completed row changes nothing else: status stays completed, frozen duration and start/end timestamps untouched, sets/exercises read-only, title/notes still under their existing completed-row rules, no reopen occurs. The reopen route remains the only status transition.

## No completion prompt (D4)

The Complete workout flow is byte-untouched — no modal, no intermediate prompt, no forced entry. Calories are ordinary optional metadata, correctable after the fact (device data usually arrives post-completion).

## No downstream consumption

Dashboard, Coach, Weekly Review, Progress overview, nutrition targets, food logs, daily activity, and activity sessions are all untouched (pinned). Recorded workout calories are **evidence/components of daily energy expenditure** — in the future Energy Balance + Adaptive Coach phase they reconcile against (never sum on top of) aggregate active energy: Apple Health 850 kcal active energy with 520 kcal of workout calories must never read as 1,370 kcal. No eat-back, ever.

## Files changed (3 feature/source, the approved cap)

lib/workout.ts · api/workouts/[id]/route.ts · SessionHeader.tsx. Plus the 5A.5 harness, this doc, and the apply script (uncounted). No migration file.

## Flagged harness retargets (no coverage deleted)

- **5A.2** "calories rendered factually, only when recorded" — the completed-only display gate became always-when-recorded (approved D2); NULL-renders-nothing protection unchanged.
- **5A.2** "SessionHeader editor gets the identical fix" — layout-class occurrence counts moved 4→5 / 6→7 because the new calories field uses the same Safari-safe pattern; the manual editor's grids remain exactly 2.
- **D3 tightening** (runtime behavior, flagged in source): boolean/array/object calorie inputs on the manual path are now rejected instead of coerced.

## Roadmap (retained)

**Energy Balance + Adaptive Coach** (calories consumed, workout + intentional-activity calories, passive movement, aggregate active-energy reconciliation, weight trend, estimated TDEE, conservative 100–200 kcal confidence-weighted adjustments, no eat-back) · aggregate active-energy reconciliation rule (component-within-aggregate, never summed) · **multi-muscle exercise targeting** (primary/secondary/tertiary weighted contribution) · **macro progress bars** (Protein/Carbs/Fat with the restrained Calories treatment) · **plausibility warnings** (activity-type-aware speed/pace/calorie sanity as overridable warnings, never hard caps) · **Apple Health/import layer** (imported provenance, dedup, calorie/distance source confidence).
