# UI-5B1B — Transactional Exercise/Set Ordering and Set Replication

## Scope

The second UI-5B slice (after 5B1A's visual pass; before 5B2's
save-as-routine/repeat-workout):

1. Transactional exercise reordering in live AND completed workouts.
2. Routine exercise reordering migrated to the same transactional
   integrity model (replacing the two-independent-PATCH sequence).
3. Atomic set deletion with contiguous resequencing — the hosted-QA
   defect (deleting Set 1 of 1,2,3 left 2,3 and Add Set produced
   2,3,4) is corrected: deletion yields 1,2 and Add Set yields 1,2,3.
4. Add Set numbering computed inside the same database lock, so
   add/delete can never race into duplicate or gapped numbers.
5. Explicit blank-only "Apply to remaining sets".
6. Both broad body-spread exercise PATCH routes closed with strict
   allowlists.

## Migration 021 (APPLIED by Joseph)

`supabase/migrations/021_ui5b_transactional_ordering.sql` defines four
SECURITY INVOKER functions on the migration 013 house pattern —
`auth.uid()` guard, explicit owner checks on top of RLS, fixed
`search_path = public`, per-domain `pg_advisory_xact_lock`, RAISE
aborts everything with machine-mappable errors (`not_authenticated`,
`not_found`, `invalid_input`, `stale_exercise_list`,
`workout_completed`), execution revoked from PUBLIC/anon and granted
only to `authenticated`, no service role anywhere:

- `reorder_workout_exercises(p_session_id, p_ordered_ids)` /
  `reorder_routine_exercises(p_routine_id, p_ordered_ids)` — exact-set
  validation with explicit `unnest(p_ordered_ids) AS supplied(id)`
  aliases (count match, no nulls, no duplicates, no unknown or
  omitted ids), then ONE UPDATE writing contiguous zero-based
  `order_index` and nothing else. The workout variant is deliberately
  valid for completed sessions: it is structurally incapable of
  touching logged evidence.
- `delete_workout_set_and_resequence(p_set_id)` — ownership through
  the set -> exercise -> session chain, completed workouts rejected
  fail-closed, then (under the numbering lock) delete the one set and
  renumber the remainder to contiguous 1..N ordered deterministically
  by prior `(set_number, id)`. Writes `set_number` only; every
  remaining set keeps its id, values, nulls, completion, warmup, and
  notes. Deleting the last set stays valid. No partial
  delete-without-resequence state can ever commit.
- `append_workout_set(p_workout_exercise_id, p_reps, p_weight_kg,
  p_rpe, p_duration_seconds, p_distance_meters, p_completed,
  p_is_warmup, p_notes)` — justified fourth function: `workout_sets`
  has NO unique constraint on `(workout_exercise_id, set_number)`
  (003), and the old route computed MAX+1 outside any lock, so Add
  Set could race delete-and-resequence into duplicates. Numbering
  now happens only inside the SAME `workout_set_numbering` advisory
  lock the delete function takes. **Security-review rewrite:** the
  function takes explicit TYPED parameters (no JSONB blob) and is
  fully self-validating for direct authenticated RPC callers —
  ownership + completed-workout rejection, tracking mode read from
  the caller's OWN exercise row (never from arguments), per-mode
  field gating identical to the route, type/range validation
  (reps 0..1000, rpe 1..10, weight_kg 0<..1000 — already the
  internal metric unit, so pounds can never bypass conversion;
  duration 1..86400, distance 0<..1000000, notes <=10000 chars),
  and the same per-mode completion requirements. Identity, foreign
  keys, timestamps, and set_number are not parameters at all. Typed
  parameters mean malformed argument types die at PostgREST before
  the body runs — no uncontrolled cast errors. The reorder functions
  additionally bound `p_ordered_ids` at 500 entries.

**Joseph applied the approved 22,930-byte SQL (sha256
916e1665fdb1d4e9705b23300d258db63d690cd2422a09c12a63df068510eac0)
to the ShredOS project; the SQL Editor returned "Success. No rows
returned."** Post-application verification (read-only anon REST
probes, no writes): all four functions exist in the deployed schema
(each returns 42501 "permission denied for function ..." while a
nonexistent-function control probe returns PGRST202 "Could not find
the function"), anon execution is revoked exactly per the grants,
and append_workout_set resolves a defaults-only call — matching only
the final typed nine-parameter signature. Authenticated end-to-end
behavior is exercised by hosted QA on the Preview.

## API routes

- `PUT /api/workouts/[id]/exercise-order` and
  `PUT /api/routines/[id]/exercise-order`: authenticated; body must be
  exactly `{ ordered_ids: string[] }` (unreadable JSON, unknown keys,
  empty arrays, non-UUID entries, and duplicates all 400 before the
  RPC); one RPC call; distinct mapping for auth (401),
  ownership/not-found (404), stale membership (409), invalid input
  (400), and database failure (500); no client user id, no service
  role.
- `PATCH /api/workout-exercises/[id]`: strict allowlist
  (`target_sets`, `target_reps_min`, `target_reps_max`,
  `target_weight_lbs` -> server-converted kg, `notes`), unknown keys
  400, empty update 400, typed/range validation, `order_index`
  forbidden, completed guard intact.
- `PATCH /api/routine-exercises/[id]`: equivalent allowlist for the
  seven prescription fields + notes RoutineExerciseRow edits;
  `order_index` forbidden now that reordering has its own route.
- `DELETE /api/workout-sets/[id]`: calls
  `delete_workout_set_and_resequence`; success returns only after the
  delete AND resequence committed; guard intact.
- `POST /api/workout-exercises/[id]/sets`: validation unchanged;
  insert goes through `append_workout_set`.
- `POST /api/workout-exercises/[id]/apply-first-set`: reads the
  CURRENT persisted sets at execution, selects the template
  deterministically (first non-warmup by `set_number`, then `id`),
  and fills ONLY blank copyable fields on later, non-warmup,
  incomplete sets. **Write-time blank protection:** every field is
  written with its own `IS NULL` predicate (plus `completed = false`),
  so a value the user enters between the route's read and its write
  can never be overwritten — the update matches zero rows and is
  skipped honestly;
  completed sets and nonblank values never touched; set notes never
  copied; absent template values omitted entirely (blank never
  becomes zero); per-mode fields: weight_reps -> reps/weight/RPE,
  bodyweight -> reps/added-weight-when-present/RPE, cardio ->
  duration/distance, timed -> duration/RPE. Sequential per-set
  updates with honest partial reporting (`applied`/`eligible`/
  `failed`) — approved because blank-only application is idempotent:
  a retry affects only fields still blank.

## UI

- **Workout reordering:** real named Move up / Move down buttons
  (44x44, keyboard/touch/AT-equivalent, no drag anywhere), first/last
  disabled, moves interlocked while saving; optimistic ID-order
  overlay in WorkoutDetailClient with snapshot restore, accessible
  error, and refresh on failure; the RPC is the integrity authority.
  Available on completed workouts (presentation order only).
- **Routine reordering:** RoutineDetailClient keeps its visible
  order, labels, disabled logic, optimistic swap, and snapshot
  rollback — persistence is now one transactional exercise-order
  call.
- **Blur-race correction (security review):** clicking Apply blurs
  the focused set input, which STARTS a blur save; without
  coordination the Apply request could reach the server before that
  save commits and copy the OLD first-set values into blank sets
  (unrepairable by blank-only retry). Every SetRow save now registers
  with a deterministic save coordinator
  (`set-save-coordinator.ts`, keyed by workout exercise), and Apply
  awaits the ENTIRE pending pool — including saves that start
  mid-wait — before its request exists. If any awaited save failed,
  Apply never runs and shows an accessible error. No timeouts, no
  delays, no request-ordering assumptions; `setApplying(true)` runs
  synchronously before any await, so double-clicks cannot start
  duplicate operations. Runtime-proven (verify-ui5b1b C1-C10).
- **Apply to remaining sets:** explicit 44px action beside Add set,
  never automatic, disabled with an honest reason until the first
  working set's required values are saved
  (weight_reps: reps + weight; bodyweight: reps; cardio/timed:
  duration) and at least one blank target exists; accessible
  saving/success/partial-failure feedback
  ("Applied to X of Y sets. Try again for the remaining sets.");
  refresh after completion or failure.

## Retargets (all labeled `RETARGET (UI-5B1B)`)

1. `verify-phase5a6a` "Add set route unchanged" — server-controlled
   numbering re-anchored from the route's MAX+1 line to the
   `append_workout_set` call (numbering now decided inside the lock).
2. `verify-phase5a6a` "Delete set route unchanged" — re-anchored to
   the transactional RPC; the user-control boundary (any set may be
   deleted; no minimum) unchanged.
3. `verify-phase4b6b` "empty-exercises card sits before blocks" —
   re-anchored to `orderedExercises.map` (old anchor would have
   compared against indexOf -1).
4. `verify-ui5a` B11 — routine-detail fetch surface is now exactly 5
   calls with the transactional order endpoint replacing the two
   PATCHes.
5. `verify-ui5a` X1/X2 — the approved UI-5B1B file set admitted;
   remaining exclusions unchanged.
6. `verify-ui5b1a` H11 — the block gained exactly one approved fetch
   (apply-first-set); every other count unchanged.
7. `verify-ui5b1a` X1/X2 — approved UI-5B1B inventory admitted.
8. `verify-ui5b1a` X4 — reorder/apply are now the approved
   implementation; the surviving boundary is that UI-5B2 features
   stay absent.
9. `verify-ui5b1a` X5 + migration-count pins in verify-ui5a (G1),
   verify-ui4 (S2, S47), verify-ui3 (S19, S71), verify-ui2 (S46),
   verify-ui1b (S25), verify-ui1a, verify-phase5b3, verify-phase5b4,
   verify-phase5b5, and verify-food-log-ux (S36) — exactly 21
   migrations with `021_ui5b_transactional_ordering.sql` as the sole
   approved addition (same mechanical pattern as the UI-3 020
   retargets).

## Concurrency review (second correction)

- **Completion races closed:** append and delete decide the
  completed-workout question ONLY on a `FOR UPDATE` re-read of the
  session row taken AFTER the numbering advisory lock. Completion's
  `UPDATE workout_sessions` conflicts with that row lock: if
  completion commits first, the re-read observes `completed` (READ
  COMMITTED re-reads the latest committed row after a lock wait) and
  the mutation rejects; if append/delete lock first, completion waits
  for the set mutation to commit. The initial ownership lookup only
  resolves the lock domain and is never trusted for authorization.
- **Duplicate-delete honesty:** the delete is
  `DELETE ... RETURNING id`; a concurrent duplicate that lost the
  lock race finds no row and gets a controlled `not_found` — never a
  false `deleted: true`. The transaction aborts atomically.
- **Reorder membership freeze:** both reorder functions lock the
  parent row `FOR UPDATE` (a child INSERT takes an FK `FOR KEY SHARE`
  lock on that exact parent row, and FOR UPDATE conflicts with KEY
  SHARE — so Add Exercise blocks; parent deletion blocks too), then
  lock every current child row `FOR UPDATE` (so Remove Exercise
  blocks), then validate the exact set against that frozen
  membership, then update. A membership change that committed first
  is observed and rejected as `stale_exercise_list`; success can only
  commit against the exact validated list. The existing Add/Remove
  membership routes therefore conflict correctly without
  modification.
- **Tracking-mode race (final review):** tracking_mode is MUTABLE —
  the exercises PATCH route supports changing it after use, direct
  Data API callers can update their own rows under RLS + the
  authenticated UPDATE grant, and no database mechanism freezes it
  (seeded "default" exercises are per-user copies, so every
  referenced row is caller-owned and lockable). append_workout_set
  therefore resolves only IDs pre-lock, then — after the advisory and
  session locks — reads tracking_mode from the exercises row UNDER
  FOR UPDATE and runs every mode-dependent validation strictly after
  that locked read. A mode edit either commits first (append
  validates against the new mode) or waits until the insert commits;
  no payload valid only for the old mode can commit against the new
  mode. No other 021 function locks exercises rows and the edit path
  takes only that single row lock, so no deadlock cycle exists.
- **Global lock order** everywhere in the migration: advisory lock,
  then parent/session row, then exercise row, then child rows — no
  ordering cycles.
- Proven by SQL source pins (K1-K6) plus a deterministic lock-model
  execution of all ten orderings (L1-L10) that mirrors PostgreSQL's
  documented conflict semantics; real database execution still
  awaits Joseph applying 021.

## Append parity vs the pre-UI-5B1B Add Set route

Byte-parity items: mode field gating, completion requirements
(bodyweight reps; cardio/timed duration > 0), null behavior (nulls
stay null, never zero), warmup eligibility (the route still coerces
warmup to false for cardio/timed before calling; the function rejects
rather than coerces for direct callers), carry-forward (route-side,
unchanged), lbs->kg conversion (route-side, unchanged; the function
accepts only the internal kg column with range checks).
**Zero handling:** weight_lbs <= 0 still becomes NULL in the route
(zero weight was never stored via the standard path — unchanged);
stored `duration_seconds = 0` and `distance_meters = 0` (reachable
via the PATCH route) remain appendable — the function allows >= 0 for
both so carry-forward cannot regress. Reps 0 remains valid.
**Intentional tightenings for approval** (the old route inserted these
unvalidated): reps capped at 1000; RPE bounded 1-10 (the UI already
enforced this); weight_kg bounded 0 < kg <= 1000 (an explicit
zero-or-negative kg — previously possible only through the internal
weight_kg override no client uses — now rejects); duration capped at
86400 s; distance capped at 1,000,000 m; notes capped at 10,000
chars; reorder id arrays bounded at 500 entries.

## Error safety

Every in-scope route returns only reviewed error tokens; unknown
database failures map to generic 500 copy and never expose raw
database messages (a security-review sweep also closed pre-existing
`error.message` leaks in the set/exercise routes this slice touches).

## Honest limitations

Migration 021 is now applied (see above); authenticated end-to-end
execution of the reordering, delete/resequence, locked Add Set, and
apply flows is validated by hosted QA on the Preview. The set-numbering
regression is proven here at the algorithm level (a deterministic
simulation mirroring the SQL exactly) plus full source contracts; the
database-level proof lands in hosted QA after 021 is applied. Local
unauthenticated smoke covers only the reachable surface.
