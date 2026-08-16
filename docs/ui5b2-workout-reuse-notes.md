# UI-5B2 — Workout reuse (save-as-routine + repeat)

## Migration 022 status

**APPLIED by Joseph** on 2026-08-16 via the Supabase SQL Editor
("Success. No rows returned"), after four ChatGPT review rounds. The
applied text is the Round-4 revision:

- File: `supabase/migrations/022_ui5b2_workout_reuse.sql`
- Bytes: 19,112
- SHA-256: `1432692f700b1686243aa8219ea4af3146e2bec30b228b3f9138d60e072e1241`

Superseded drafts that must never be applied: 14,381 bytes
(`d6b83408...`), 16,854 bytes (`96dd03ba...`), 18,197 bytes
(`632fe3e0...`).

## Read-only deployment verification (anon REST probes; nothing executed or mutated)

| Probe | Result | Meaning |
|---|---|---|
| `rpc/create_routine_from_workout` (all 3 named params) | HTTP 401 / `42501` permission denied | exists; anon revoked |
| `rpc/create_routine_from_workout` (2 params; `p_description` defaulted) | HTTP 401 / `42501` permission denied | the (UUID, TEXT, TEXT DEFAULT NULL) signature resolves |
| `rpc/repeat_workout` (`p_workout_session_id`, `p_workout_date`) | HTTP 401 / `42501` permission denied | exists with the (UUID, DATE) signature; anon revoked |
| `rpc/repeat_workout` (wrong param name) | HTTP 404 / `PGRST202` no matching function | signature resolution is exact, not name-only |
| `rpc/nonexistent_function_control_ui5b2` | HTTP 404 / `PGRST202` | validates the exists-vs-missing discriminator |

Authenticated behavior (owner scoping, locking, copy matrices,
conflict payloads) is exercised in hosted QA once the product slice
ships; no test credentials were created.

## Approved product decisions (binding)

- Save as routine: live + completed sources; structure only; explicit
  prescription columns only; `target_sets` may fall back to the
  frozen non-warmup set count; no notes, no RPE/rest derivation; name
  dialog with duplicate-name feedback via the existing
  case-insensitive unique index.
- Repeat workout: completed sources only; source title reused;
  `routine_id = NULL`; dense 1..N set numbering (normalized via
  ROW_NUMBER over `(set_number, id)`, never copied verbatim); warmup
  identity preserved; every new set value NULL, `completed = false`,
  notes NULL; history appears only through the Last/Recent reference
  UI; existing single-active-workout conflict modal.
- Both RPCs: SECURITY INVOKER, `search_path = public, pg_temp`,
  `auth.uid()` + explicit owner checks, three-step source locking
  (parent session FOR UPDATE, exercise rows FOR UPDATE in id order,
  set rows FOR UPDATE in id order — the 021 parent-before-children
  order), bounds (500 exercises / 5,000 sets) counted after the
  freeze, one transaction, no compensating cleanup, signature-exact
  revoke/grant pairs.

## Product slice (implemented after the database gate closed)

- `POST /api/workouts/[id]/save-as-routine` — validates JSON shape,
  allowed fields ({name, description?}), trimmed name (1-120),
  description (max 2000), and the workout id; calls ONLY
  `create_routine_from_workout`; maps not_authenticated 401 /
  invalid 400 / not_found 404 (existence never leaked) /
  duplicate_name 409 / unexpected 500; fails closed as 500 unless
  the RPC returns a real routine_id; 201 on success.
- `POST /api/workouts/[id]/repeat` — accepts NO body (non-empty
  payloads rejected 400), no client user id or date; the workout
  date is the user-local day via `localTodayFromCookies()`; calls
  ONLY `repeat_workout`; maps `active_workout_exists` to the
  modal-consumable 409 with `active_workout_id`; fails closed as
  500 unless the RPC returns a real session_id; 201 on success.
- `SaveAsRoutineButton` — live + completed workouts; 44px control;
  accessible dialog (required name prefilled from the workout title,
  optional description, honest copy summary); duplicate-name 409 as
  inline feedback; failures preserve the dialog contents; synchronous
  pendingRef double-submit guard; success navigates to
  `/workouts/routines/{routine_id}` for review/editing.
- `RepeatWorkoutButton` — completed workouts only (gated at the
  WorkoutDetailClient mount on `readOnly`); 44px control; success
  navigates to `/workouts/{session_id}`; 409 reuses
  `ActiveWorkoutConflictModal` (Resume routes to the active workout;
  Discard skips it via the existing `/skip` route and retries exactly
  once — a second conflict re-renders the modal, never loops).
- Mount: one flex row in `WorkoutDetailClient` directly under
  `SessionHeader`; execution internals, routine components, and
  business libraries untouched.

## Boundaries

Coach "Suggested routine" and the Future Exercise Library Expansion
remain roadmap-only entries in `docs/ui5a-train-discovery-notes.md`.
