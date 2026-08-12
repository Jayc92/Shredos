# Phase 5A.6A — Default Three Sets Notes

First half of the approved Phase 5A.6 split (D1), from checkpoint `eeae1a3` / `phase5a5-live-workout-calories-stable`. **No migration** — the directory stays exactly through 017; the anatomy work (5A.6B) owns any future migration 018.

## The prior zero-set manual flow

`AddExerciseSection` posted `{ exercise_id }` to `POST /api/workouts/[id]/exercises`, which inserted one `workout_exercises` row and **zero set rows** — every set then cost a separate "Add set" tap (`POST /api/workout-exercises/[id]/sets`). A typical 3-set exercise took three extra taps before any entry could begin. The routine-start flow (`POST /api/routines/[id]/start`) never had this problem: it has always bulk-inserted real persisted rows for the prescribed `target_sets` count.

## The new default-three behavior (D2)

After the manual-add route successfully creates the `workout_exercises` row, it bulk-inserts `DEFAULT_MANUAL_SET_COUNT = 3` (one exported constant in `lib/workout.ts`, no scattered literals) empty `workout_sets` rows: `set_number` 1/2/3, `completed: false`, `is_warmup: false`, and **every performance value explicitly NULL** (reps, weight, RPE, duration, distance, notes) — all-NULL is valid for every tracking mode, so nothing is prefilled and no mode-specific branching is needed at seed time. Three is a **default, never a requirement**: the existing set routes still delete down to 2/1/0 and add 4/5/… (the server-controlled `set_number = last + 1` naturally produces Set 4), no minimum is enforced anywhere, no re-seeding occurs on deletion, and duplicate adds of the same exercise remain legal with each new exercise row getting its own independent seed.

## Persisted-empty-row rationale

Persisted uncompleted rows ARE this app's draft abstraction — the routine flow has shipped exactly these semantics since Phase 1D, and no client-side draft layer exists. Seeding through the same model keeps one set lifecycle instead of two.

## The routine exception

The routine-start route is **byte-untouched** and has no dependency on the new constant: a 2-set prescription starts as exactly 2 rows, 4 as exactly 4, unprescribed routine exercises still seed nothing (`if (!re.target_sets || re.target_sets <= 0) continue`). The separation is structural — the two flows use different routes and never share the seeding code. Future safety: the manual-add route already accepted an (unused) `target_sets` payload field; if a caller ever supplies a positive integer there, that prescribed count is respected instead of the default — the route's contract was not broadened, no new field was invented.

## Analytics safety

Seeded rows carry **zero** completed volume, weekly volume, Coach facts, progress, PRs, or history until the user completes them: every analytical consumer filters `completed && !is_warmup` (pinned since 3A/3B and re-pinned here), and the harness proves at runtime through the real reducers that a seeded exercise contributes 0 working sets, a partly-completed one contributes exactly the completed count, and an in-progress workout holding only seeded rows counts nothing.

## Failure cleanup (compensating, narrow)

If the exercise insert succeeds but the seed bulk-insert fails, the route deletes the just-created `workout_exercises` row by its exact id (the 003 `ON DELETE CASCADE` FK removes any partially inserted sets) and returns an explicit 500 — never a half-created exercise, never a silent partial success, and never any touch of the session, other exercises, or other sets (unlike routine-start, whose all-or-nothing session delete is correct for its own contract and is untouched).

## Files changed (2 feature/source, the approved cap)

lib/workout.ts (constant) · api/workouts/[id]/exercises/route.ts (seed + cleanup). Plus the 5A.6A harness, this doc, and the apply script (uncounted). **No retargets were needed** — all 24 prior suites passed unmodified after the change.

## Approved 5A.6B direction (recorded, NOT implemented)

Expanded canonical muscle taxonomy (~25 values: specifics like lats/upper_back/lower_back/traps, delt heads, hip_flexors/adductors/abductors, abs/obliques, with broad back/shoulders/core retained as honest values — anatomical groups instead of a generic "thigh" label); **primary + secondary + tertiary targeting** via a new `exercise_muscles` join table (primary stays on `exercises.primary_muscle`); **role-based contributions** with exact weights deferred to a central map in the future Coach phase.

**APPROVED SAFETY MODIFICATION (supersedes the original design's drop-in-one-migration):** migration 018 must **NOT drop `exercises.secondary_muscles` JSONB**. The approved anatomy migration strategy is: (1) create `exercise_muscles`, (2) backfill the JSONB secondary values into it, (3) switch application reads/writes to the join table, (4) leave `secondary_muscles` deprecated/read-only for one stable checkpoint — a later cleanup migration may drop it only after physical QA proves the relationship model.

## Roadmap (retained)

**Energy Balance + Adaptive Coach** (aggregate-vs-session energy reconciliation, no eat-back, conservative confidence-weighted adjustments) · **Apple Health / Watch / HealthKit imports** and Strava/Runna/Garmin/Fitbit (map-or-create exercise flow receives the same muscle targeting) · **activity plausibility warnings** (overridable, never hard caps) · **macro progress bars** for Calories/Protein/Carbs/Fat · multi-muscle weighted volume for sets-per-muscle-per-week, neglected-muscle detection, and recovery signals.
