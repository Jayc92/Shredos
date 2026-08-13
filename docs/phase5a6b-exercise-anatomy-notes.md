# Phase 5A.6B — Exercise Anatomy + Multi-Muscle Targeting Notes

Second half of the approved Phase 5A.6 split, from checkpoint `a8531cd` / `phase5a6a-default-three-sets-stable`. Migration **018** upgrades ForgeFitOS from a coarse single-muscle model to a durable anatomy model: one primary muscle, zero or more secondary targets, zero or more tertiary targets, over a canonical 25-value vocabulary.

## The old model (audited)

`exercises.primary_muscle` carried a 13-value TEXT CHECK (`chest, back, shoulders, biceps, triceps, forearms, core, quads, hamstrings, glutes, calves, full_body, other`). The dormant discovery: **`secondary_muscles JSONB DEFAULT '[]'` had existed since Phase 1C**, was validated app-side and populated by 10 of 15 seeds, but had zero analytical consumers and no UI — the multi-muscle idea was half-built and never wired. There was no thigh/lower-body specificity (no adductors/abductors/hip flexors), no back split (lats/upper/lower/traps), no delt heads, no obliques.

## The canonical 25 (approved taxonomy)

Upper: chest, lats, upper_back, lower_back, traps, front_delts, side_delts, rear_delts, biceps, triceps, forearms. Lower: quads, hamstrings, glutes, calves, hip_flexors, adductors, abductors. Core: abs, obliques. **Retained broad values: back, shoulders, core** — existing rows are honestly broad and are NEVER guess-mapped to specifics; users refine per exercise when they choose. Other: full_body, other. Deliberately absent: `thigh` (anatomically ambiguous — quads/hamstrings/adductors are the useful groups), `cardio` (a category/tracking concept, not a muscle), `upper_chest`/`lower_chest` (variation concepts). The old 13 values are a strict subset, so the CHECK widening rewrites zero rows. Code-level `MUSCLE_LABELS` (friendly names) and `MUSCLE_REGIONS` (upper/lower/core/other grouping for filtering/future analytics — deliberately not a DB column) live in exercise-validation.

## The role model

`exercise_muscles (id, user_id, exercise_id, muscle, role, created_at)` with `role IN ('secondary','tertiary')` and `UNIQUE (exercise_id, muscle)` — the same muscle can never appear twice on one exercise, in any role. **Primary rows never live in this table**: `exercises.primary_muscle` keeps exactly-one-primary structurally guaranteed and every existing consumer working. **No contribution weights are stored** — the future Coach defines weights centrally (illustrative-only: primary ~1.0, secondary ~0.5, tertiary ~0.25, none locked) so re-tuning never rewrites relationship rows. No `contribution_weight` column exists. Rows use replace-not-update semantics (no updated_at; edits are a safe delete+insert of the set).

## Migration 018

(1) drop and recreate `exercises_primary_muscle_check` with the 25-value vocabulary (pure widening); (2) create `exercise_muscles` with FK cascades to both `auth.users` and `exercises`; (3) own-row RLS with the four per-operation policies; (4) `GRANT SELECT, INSERT, UPDATE, DELETE … TO authenticated` — the 015/016 lesson, nothing to anon, no service role; (5) backfill; PostgREST reload. **Index decision (audit-driven):** no separate `exercise_muscles_exercise_idx` was created — the `UNIQUE (exercise_id, muscle)` constraint's backing btree leads on `exercise_id` and therefore already serves every query shape in the app (embedded reads and the edit-time delete are both keyed on exercise_id); a second index would be pure duplication, so the smallest-useful-index principle wins.

## Backfill

Every existing JSONB secondary entry becomes one `exercise_muscles` row with `role='secondary'`, preserving the owning exercise's `user_id` and `exercise_id` and the muscle value verbatim (broad values preserved; no tertiary roles fabricated; empty arrays produce no rows; `ON CONFLICT DO NOTHING` guards duplicate entries inside a single legacy array). Example: `["glutes","hamstrings"]` → two secondary rows.

## Deprecated JSONB — retained (the approved safety rule)

**`exercises.secondary_muscles` is NOT dropped.** It remains physically present as rollback insurance only: after 5A.6B the app never writes it (new rows get the DB default `'[]'`), never reads it as authoritative, and there is **no dual-write** — drift would defeat the safety purpose. `exercise_muscles` is the single authoritative relationship source. A later cleanup migration may drop the deprecated column only after one stable checkpoint and physical QA prove the join-table model.

## API contract (approved D6 — explicit roles)

Create/edit moved to `muscle_targets: [{ muscle, role }, …]` with `primary_muscle` a separate field; `secondary_muscles` is **no longer an accepted field** on either route. `validateMuscleTargets` rejects: non-array payloads, non-object entries, extra keys, unknown muscles, unknown roles, `role: 'primary'` in the array, the same muscle twice (any roles — secondary+tertiary collisions included), and any target equal to the primary. Collisions are **rejected, never silently dropped** — a deliberate contract change from 2P's skip/dedupe behavior, flagged. The PATCH route completes the primary-collision rule against the **stored** primary when the payload carries targets without a primary. POST inserts the exercise then the relationship rows (compensating delete on failure — never a half-created exercise); PATCH replaces the exercise's relationship set via delete+insert scoped to the owner's rows (`user_id` filtered on every statement, RLS backstopping); a targets-only PATCH is legal. Ownership: another user's relationship rows are structurally unreachable.

## UI behavior

ExerciseForm gains Secondary and Tertiary multi-select pill groups beside the existing primary single-select (all driven by the shared 25-value constants — no comma-separated text anywhere). One role per muscle is structural: the primary is hidden from both target groups, a secondary pick is unavailable as tertiary and vice versa, and changing primary evicts that muscle from both lists. Edit prefills from the embedded `exercise_muscles` rows. The library list shows a restrained second line — `Secondary: X, Y · Tertiary: Z` — only when targets exist. **WorkoutExerciseBlock deliberately keeps showing primary only** (set-entry cards stay uncluttered; detailed targets belong to the library).

**Physical-QA correction (pre-checkpoint, presentation only):** rendering both 25-pill target groups permanently made the form needlessly tall. Secondary and Tertiary now sit behind collapsible disclosure rows — real `<button>` triggers with `aria-expanded`/`aria-controls` (keyboard-activatable, no clickable divs), a rotating lucide ChevronDown, and a live summary (`Optional · N selected` / `Optional · lighter involvement · N selected`). Both default to **collapsed** on create AND edit — existing selections never auto-expand, the count surfaces them instead. Disclosure state is pure presentation: collapsing hides pills without clearing anything, edit-prefill is independent of open state, the submitted payload is byte-identical regardless of disclosure state, and every collision rule is untouched. Primary stays always-visible. One feature file (ExerciseForm.tsx); taxonomy, contract, schema, migration 018, JSONB deprecation, library display, Coach compatibility, and seeds all unchanged.

## Coach compatibility (no new behavior)

`MUSCLE_GROUP_MAP` extended so specifics roll into the existing six display groups: lats/upper_back/lower_back/traps → back; front/side/rear_delts → shoulders; hip_flexors/adductors/abductors → legs; abs/obliques → core. Retained broad values pass through unmapped exactly as before. No weighting logic, no effective-set math, no new Coach features — compatibility only.

## Seed refinements (NEW users only; existing rows never rewritten)

Documented per exercise: Bench/Incline press — secondary `shoulders` → `front_delts`; Lat pulldown — primary `back` → `lats`; Seated cable row — primary `back` → `upper_back`, secondary `lats` added; Shoulder press — primary `shoulders` → `front_delts`, secondary `side_delts` added; Lateral raise — primary `shoulders` → `side_delts`; Squat — tertiary `lower_back` added (isometric support); Romanian deadlift — secondary `back` → tertiary `lower_back` (the approved example); Plank — primary `core` → `abs`, secondary `obliques` added. Chest fly, Leg press, Leg curl, Leg extension, Biceps curl, Triceps pushdown unchanged — no fabricated precision. Seeds write relationship rows to `exercise_muscles`, never to the deprecated JSONB.

## History and custom exercises

Workout history resolves anatomy through `exercise_id` exactly as before — no workout_sessions/workout_exercises changes, exercise IDs preserved, historical workouts render unchanged. All exercises are per-user rows (custom exercises have existed since 1C, `is_system` marks seeds), so the anatomy model applies uniformly to seeded and user-created exercises through the same form and routes — no separate custom path. Future imports slot in: map-or-create produces a normal exercise that receives the same targeting.

## Future (recorded, not implemented)

**Cleanup migration** dropping the deprecated JSONB after this model survives a stable checkpoint + physical QA. **Effective-set analytics**: weekly sets per muscle = completed working sets × central role weight, summed across primary + relationship rows — powering neglected-muscle detection ("chest volume on target, direct hamstring work low"), balance, recovery, and volume progression in the Energy Balance + Adaptive Coach era. Standing roadmap retained: Energy Balance + Adaptive Coach (no eat-back), Apple Health/Watch + Strava/Runna/Garmin/Fitbit imports, aggregate-vs-session energy reconciliation, activity plausibility warnings, macro progress bars.

## Files changed (10 feature/source, at the approved cap)

exercise-validation.ts · constants.ts · types/database.ts · ExerciseForm.tsx · ExerciseListItem.tsx · api/exercises/route.ts · api/exercises/[id]/route.ts · workout-coach.ts · seed-exercises.ts · workouts/exercises/page.tsx (the library page's own select must embed the join rows for display/prefill). Plus migration 018, the 5A.6B harness, this doc, and the apply script (uncounted). The dead `useExercises` hook (zero consumers) stays byte-untouched per the standing dead-path rule.

## Flagged retargets (no coverage deleted)

- **5A.4** migration-boundary pin — from "exactly 17, no 018" to "5A.4 added exactly 017" (018 is this approved phase; same retarget class as the earlier 5A.2/5A.3 boundary pins).
- **5A.5** migration pin — from a total count to "5A.5 added no migration; 017 untouched".
- **5A.6A** migration pin, anatomy-boundary pin (narrowed to 5A.6A's own two files), and Coach pin (workout-coach now carries the approved 5A.6B compatibility map; still zero 5A.6A Coach code).
- **Contract change (D6, flagged):** target collisions are rejected instead of 2P's silent skip/dedupe; `secondary_muscles` is no longer an accepted API field.

## Migration stop protocol

Implemented and validated locally; **migration 018 must be applied to Supabase project ShredOS (ref `ttybyljytiwntvorugcv`) before any migration-dependent browser QA** — until then the live schema has no exercise_muscles table and the old 13-value CHECK, so exercise create/edit with new values or targets would fail. The apply script never touches Supabase.
