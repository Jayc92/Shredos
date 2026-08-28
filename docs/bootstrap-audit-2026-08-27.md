# ForgeFitOS — Repository Bootstrap and Current-State Audit

Prepared 2026-08-27, revised same day per director correction, then
revised again the same day: after the orchestrator loop failed
mid-review, this document was independently re-verified claim-by-claim
against the repository and corrected per the Codex review findings
(EXLIB gate wording, RLS policy shapes, Zustand status, and a fresh
first-hand verification inventory in section 6).
Audit-and-documentation turn only: no product code, schema,
migration, dependency, or configuration file was changed. Baseline:
`main` = `9b22947` ("EXLIB-1C0B4: approve weight-time product
decisions"), working tree clean apart from this document.

This document answers the nine required questions from direct
repository inspection (file reads and greps against the actual
worktree — not from narrative summaries in other docs). Where an
earlier memory/session record described this same audit as already
written, that record was inaccurate: no such file existed in the
repository before this one; this is the first copy. This revision
corrects several inventory errors and omissions from that first copy,
identified by director review — see section 7.

## 1. What exists today?

- **Stack**: Next.js 14.2.13 (App Router) + React 18 + TypeScript 5 +
  Supabase (`@supabase/ssr`, `@supabase/supabase-js`) + TanStack Query
  5 + Tailwind 3 + Radix UI primitives (`package.json`).
  Zustand 5 is **installed as a dependency but currently has zero
  `src/` consumers** (confirmed by recursive grep) — it is not part
  of the active application state-management architecture and should
  not be described as such; actual client state today is TanStack
  Query plus local React state.
  Dev server runs on port 3010 (`next dev -p 3010`) — **not** port
  3000 (see the stale `README.md` finding in section 7).
- **App surface** (`src/app/**/page.tsx`, **22 routes**, including
  the root `src/app/page.tsx` redirect): root redirect, dashboard (+
  customize), onboarding, login, workouts (+ routines, routine
  detail, exercises library, per-workout detail), food (+ saved),
  nutrition, fasting, activity, check-in, coach, decisions, progress
  (+ per-exercise detail), weigh-in, profile.
- **Domain modules** under `src/lib/`: nutrition, food, fasting,
  activity, workouts/routines, weigh-in, weight-trends,
  nutrition-trends, strength-records, progress-summary/overview/
  charts, weekly-review, coach-actions/constants, decisions, units,
  drinks, dates/local-time.
- **Auth/middleware**: `src/middleware.ts` gates protected routes via
  `isProtectedRoute`, refreshes the Supabase session every request,
  and redirects unauthenticated users to `/login` (preserving the
  intended destination) and authenticated users away from `/login`.
  Session state is carried entirely via Supabase's cookie-bound SSR
  client (`@supabase/ssr`'s `createServerClient`, see section 4) —
  there is no separate token store or header-based auth scheme.
- **Database**: 25 applied-and-committed migrations
  (`supabase/migrations/001`–`025`), spanning phase1 (core schema,
  food/workout/routine logging) through phase5b (energy/coach
  integration) and the EXLIB exercise-library-expansion program
  (023–025).
- **Documentation**: `docs/` is the primary dated decision-record
  layer, but it is **not the only documentation in the repository** —
  a root `README.md` also exists (see sections 5 and 7 for its
  status). `docs/` itself contains, as of this revision, 49 `.md` +
  4 `.jsonl` + 5 `.sql` = 58 files total; the pre-audit baseline (before
  this document was added) was 48 `.md` + 4 `.jsonl` + 5 `.sql` = 57.
  It is a dated, versioned decision-record system (phase notes,
  UI-overhaul notes, EXLIB decision/audit records), where later
  records supersede earlier ones only via explicit dated
  "Supersession" sections that cite exact byte fingerprints —
  historical docs are never rewritten in place.
- **Verification infrastructure**: `scripts/verify-*` totals **60
  files — 56 `.ts` (run via `npx tsx`) and 4 `.sh`**
  (`verify-exlib1b2-live-concurrency.sh`, `verify-exlib1b3-live.sh`,
  `verify-exlib1c0b3-guard.sh`, `verify-exlib1c0b3-live.sh`). There is
  no separate unit-test framework (no jest/vitest config, no
  `__tests__` directories, no `*.test.ts` files under `src/` or
  `scripts/`) — the project's entire automated-verification layer is
  these bespoke `tsx` verifier scripts, one per shipped phase, each
  asserting fine-grained, often byte/SHA-256-pinned, claims about
  code, docs, and migration state.

## 2. What is complete?

- **UI-1 through UI-7 dark-theme overhaul**: fully shipped per
  `docs/ui-overhaul-closeout.md` (recorded 2026-08-17, all 14
  UI-series stable tags promoted to `main`, final manual auth/
  onboarding QA confirmed complete). The closeout doc itself records
  an accepted, non-blocking residual: 23 files (~152 occurrences)
  still use legacy pre-dark-theme alias tokens (9 shadcn base
  primitives + 14 never-rebuilt feature surfaces), rendering correctly
  through retained compatibility variables — flagged as
  post-closeout polish, not a defect (see section 6 of this document
  for full deferred-work detail).
- **EXLIB equipment-vocabulary support (EXLIB-1C0B3)**: per
  `docs/exlib1c0b3-application-deployment-hosted-qa-record.md`,
  migration 025 is applied to the hosted Supabase project and
  deployed to production. That document is the repository-
  authoritative record of this claim, but its hosted-side facts
  (migration application, Vercel deployment status, production alias
  QA) are Joseph's/ChatGPT's relayed authenticated-session reports,
  not something this audit independently live-verified — this audit
  had no Supabase/Vercel session and did not contact either hosted
  system. What *is* independently confirmed by direct local
  inspection is the repository-side evidence: migration 025's file
  contents/fingerprint and the matching type change described next.
  Confirmed directly in `src/types/database.ts:327-333`:
  `ExerciseEquipment` now includes `weight_plate`, `weighted_vest`,
  `smith_machine`, `sandbag` alongside the original 8 values, and the
  same 12-value set is enforced in migration 025's two `CHECK`
  constraints (`exercises_equipment_check`,
  `exercise_catalog_equipment_check`).
- **EXLIB-1C0B4 weight_time product decisions (1-4)**: CLOSED and
  APPROVED as a product-decision record only
  (`docs/exlib1c0b4-weight-time-product-decisions.md`), covering the
  tracking-field contract, completion/zero semantics, legacy
  `exercise_type` classification, and the two-dimensional
  records/progression model. This is a decision, not an
  implementation — the record is explicit that "Implementation" and
  "Migration 026" are both **NOT AUTHORIZED** (see sections 3 and 8).
- **Product-decision gates for equipment display** (EXLIB-1C0B2,
  decisions 5-7): user-created-exercise selectability, Smith-Machine
  progression semantics, and display labels are all CLOSED/APPROVED.
- **Product areas with shipped, working behavior** (see section 4 for
  the architecture underneath each): workouts/exercises (live
  session lifecycle, sets by tracking mode, routines, PRs/strength
  records, cardio/timed records, muscle-anatomy targeting), food/
  nutrition (logging, saved meals, targets, label calculator), body
  metrics (weigh-ins, trends, BMI), fasting (start/end, one-active
  constraint, milestones), activity (passive daily steps +
  intentional activity sessions), coaching/decisions (decision log
  lifecycle, coach actions), and authentication/onboarding.

## 3. What is incomplete or intentionally deferred?

- **`weight_time` implementation**: NOT built. Confirmed directly —
  `src/types/database.ts:343` still defines `TrackingMode` as exactly
  `'weight_reps' | 'bodyweight' | 'cardio' | 'timed'` (4 values, no
  `weight_time`), and a recursive search of `src/` for the literal
  string `weight_time` returns zero matches. No migration 026 exists
  (`supabase/migrations/` ends at `025_exlib_equipment_vocabulary_support.sql`).
  This is explicitly by design — `docs/exlib1c0b4-weight-time-product-decisions.md`
  states "Implementation: NOT AUTHORIZED" and "Migration 026: NOT
  AUTHORED and NOT AUTHORIZED," and requires a single coordinated,
  separately reviewed release (schema + types + validation + API +
  UI + records/progression together), not a schema-only migration.
- **The one narrow sub-question inside weight_time's own scope —
  historically open, NOW RESOLVED (dated supersession)**: whether an
  `rpe` value and/or a warmup flag are permitted on a `weight_time`
  set. Note this is not a question of adding new columns:
  `workout_sets.rpe` and `workout_sets.is_warmup` already exist as
  columns (confirmed directly in
  `supabase/migrations/003_phase1c_workout_logging.sql`) and are used
  by every existing tracking mode today. What was undecided was the
  **permitted field contract for `weight_time` specifically** —
  whether a `weight_time` set is allowed to populate those
  already-existing columns at all — plus the coordinated
  RPC/API/UI/validation behavior that follows from that contract
  choice. **Historical truth**: this was deliberately *not* resolved
  by EXLIB-1C0B4 (its Decision 1 explicitly excludes RPE/warmup from
  scope) and traces back to EXLIB-1C0B1 audit item 4 — that
  statement about EXLIB-1C0B4 remains accurate as written.
  **Current truth (supersession, 2026-08-28)**: Joseph resolved this
  subdecision in `docs/exlib1c0b5-weight-time-rpe-warmup-decision.md`
  — both fields are permitted (existing columns reused, no new
  columns), both optional, neither required for completion, RPE is
  metadata only (no record/PR/progression/score participation), and
  warmup sets are history-visible but excluded from
  records/PRs/progression baselines/working-set calculations. That
  overlay is product definition only; implementation and migration
  026 remain unauthorized, so `weight_time` remains unbuilt (all the
  direct code confirmations above still hold).
- **EXLIB exercise-catalog content**: entirely blocked, at 0%.
  Confirmed directly: `docs/exlib1b1-review-ledger.jsonl` has exactly
  48 records, all with `"pending"` status (48/48 pending, matched by
  direct grep). `docs/exlib1c0a-equipment-resolution.jsonl` resolves
  9 source movements into 26 canonical candidates (per its own header
  comment), every one carrying `"import_eligible":false` (verified by
  direct read of the file's first records and its declared header).
  No importer code exists (no `scripts/exlib1c-import.ts`, no
  `src/lib/catalog-import.ts`). The blocking structure has two
  distinct layers (per `docs/exlib1c0a-private-use-product-decision.md`'s
  gate-reconciliation table, which supersedes the original packet's
  framing for the private path):
  - **Public/commercial release** is blocked by Gate L1 (qualified
    legal counsel determination — `docs/exlib1c0-legal-product-approval-packet.md`
    states Joseph cannot supply this himself, and flags a
    "Terms-of-Service evidence gap" as a fail-closed blocker) AND by
    Gate L2's public/commercial product decision, which remains OPEN.
  - **Private-use loading** is NOT gated on L1 — the EXLIB-1C0A
    record is explicit that L1 "remains OPEN for public/commercial
    release; not claimed for private use," and Joseph's private-use
    L2 decision is CLOSED/APPROVED. Private catalog loading is
    nevertheless **still unauthorized**, because the remaining
    concrete gates are unresolved: no separately approved exact
    catalog payload exists, the human-review ledger is 48/48
    pending (no record approved), the specialist/eligibility/review
    completeness gates are open, all 26 candidates remain
    `import_eligible: false`, and the rollout/dry-run/run-membership
    machinery has never been exercised with an approved payload —
    "Catalog loading (any payload, including private use) ...
    remains prohibited until a separately approved exact catalog
    payload exists."
- **Material deferred product work recorded in phase notes/closeout**
  (roadmap commitments — recorded in-repo, not yet implemented, and
  distinguished below from mere future ideas):
  - **Coach Suggested Routine** — a suggestion-only, explained,
    editable/dismissible routine recommendation, never
    auto-activated. Canonical record: `docs/ui5a-train-discovery-notes.md`.
  - **Community exercise/workout publishing** — publishing,
    following, discovery, upvotes, moderation, ownership/provenance,
    privacy, versioning, deduplication, history preservation.
    Canonical record: `docs/ui6a-fuel-visual-notes.md`. Flagged there
    as the largest deferred phase, requiring new schema + RLS design.
  - **Fasting schedules/reminders/windows** — flexible schedules,
    optional notifications, user-defined windows, coach
    interpretation, safety onboarding. Canonical record:
    `docs/ui6b-fasting-visual-notes.md`.
  - **Wearable/import integrations** — Apple Health/Watch, Garmin,
    Fitbit, Strava, Runna, and generic CSV/JSON import, plus the
    import-layer dedup/provider-column work and the live
    Start/Stop activity timer (`source='live'` is reserved but
    unused). Canonical record: `docs/phase5a3-activity-sessions-notes.md`
    ("Deferred" section) — explicitly kept additive rather than
    blocking manual logging.
  - **Activity plausibility warnings** — activity-type-aware
    speed/pace plausibility as an overridable warning (never a hard
    limit), motivated by a QA case (a 180-mile/54-minute walk).
    Canonical record: `docs/phase5a4-daily-aggregate-distance-notes.md`
    ("Deferred plausibility warning").
  - **Deferred activity-session consumers** — no 7-day distance
    average/total/tile, no distance facts on `/progress`, and no
    Coach or Energy Balance consumption of activity-session data yet;
    `daily_activity_logs` and `activity_sessions` remain deliberately
    non-cross-writing. Canonical record:
    `docs/phase5a4-daily-aggregate-distance-notes.md` ("No automatic
    aggregation").
  - **Exercise-anatomy cleanup migration** — dropping the deprecated
    `exercises.secondary_muscles` JSONB column (retained today only as
    rollback insurance; the app never reads or writes it as
    authoritative) once the `exercise_muscles` join-table model
    survives a stable checkpoint and physical QA. Canonical record:
    `docs/phase5a6b-exercise-anatomy-notes.md` ("Future").
  - **Effective-set analytics** — weekly sets per muscle (completed
    working sets x a central role weight, summed across primary +
    secondary/tertiary relationship rows) to power neglected-muscle
    detection, balance, recovery, and volume-progression guidance in
    a future Energy Balance + Adaptive Coach era. Explicitly recorded
    as "not implemented" — no weighting logic or effective-set math
    exists in code today. Canonical record:
    `docs/phase5a6b-exercise-anatomy-notes.md` ("Future").
  - **Running and race-plan expansion** — narrower than "no running
    schema": migration 015's `activity_sessions.activity_type` CHECK
    already includes `'run'` (confirmed directly in
    `supabase/migrations/015_phase5a3_activity_sessions.sql`), so a
    user can log a run today as a generic intentional activity session
    (duration, distance, calories) through the same `/activity`
    surface as a walk. What is actually absent is a **dedicated
    running/race-plan requirements document, a training-plan data
    model, and running-specific schema/behavior** (paces/splits,
    race goals, structured training plans, run-specific coaching).
    `docs/ui-overhaul-closeout.md`'s backlog is explicit that only the
    unrelated `running` main-*goal* enum value (a profile/onboarding
    field, not the activity-logging schema) exists beyond that, with
    no requirements document. This whole item is listed there as a
    **future candidate mentioned during planning, NOT an approved
    roadmap commitment** — distinct from the committed items above.
  - **OCR/photo nutrition entry** — zero code, no in-repo requirements
    note; the nutrition-label calculator is manual-entry only. Also
    explicitly listed as a **not-yet-approved future candidate**, not
    a roadmap commitment.
- **Test coverage**: there is no conventional unit/integration test
  suite (no jest/vitest, no `__tests__`, no `*.test.ts`). Verification
  relies entirely on the bespoke per-phase `verify-*.ts`/`.sh`
  scripts. This is a structural characteristic of the project, not a
  newly discovered gap, but it is worth naming as a constraint: any
  new phase is expected to ship its own verifier script following the
  established pattern rather than relying on a shared test runner.

## 4. Architectural patterns and constraints already established

### Cross-cutting patterns

- **Migration discipline**: migrations are numbered sequentially and
  each scoped to one phase, but the single top-level `BEGIN`/`COMMIT`
  transaction wrapper is **not** universal — direct inspection shows
  only migrations **023, 024, and 025** (the EXLIB program) use an
  explicit `BEGIN;`/`COMMIT;` pair; migrations 001–022 contain neither
  keyword and rely on Postgres's implicit per-statement (or
  session/tool-level) transaction behavior instead. Applied migrations
  are treated as immutable once applied — their internal
  "STATUS: DRAFT" review-status header text is preserved verbatim
  even after real-world application, with a separate, dated
  "application record" doc serving as the authoritative statement of
  applied status (e.g.
  `docs/exlib1c0b3-application-deployment-hosted-qa-record.md`).
  Superseded/rejected migration drafts are kept verbatim under
  `docs/` (e.g. the five `exlib1b1-migration-023-revision-*-review-copy.sql`
  files) rather than deleted or edited.
- **Byte/SHA-256 fingerprint pinning**: decision records and their
  verifiers repeatedly pin exact byte counts and SHA-256 hashes of
  both prior approved docs and applied migration files (e.g.
  `scripts/verify-exlib1c0b4.ts` hardcodes the SHA-256 of migration
  025 and of the EXLIB-1C0B2 decision record) — this is the
  project's core mechanism for guaranteeing an approved artifact was
  not silently reworded.
- **Claude/ChatGPT/Joseph separation of duties**: Claude drafts SQL
  and code; Joseph or ChatGPT apply migrations to the hosted Supabase
  project and production Vercel deployment, only after an
  exact-fingerprint review/approval cycle. This is stated repeatedly
  across EXLIB docs and is treated as a hard security boundary, not a
  style preference.
- **Legacy/tracking-mode branching discipline**: new tracking methods
  (e.g. the planned `weight_time`) are required to derive legacy
  `exercise_type` values via an explicit, intentional branch — never
  an accidental `CASE` fallback — and consumer code must branch on
  the specific `tracking_type`/`tracking_mode` rather than assuming
  uniform shape within a legacy category (see Decision 3 in
  `docs/exlib1c0b4-weight-time-product-decisions.md`).
- **Local-dev/production isolation guard**: `scripts/verify-exlib1c0b3-guard.sh`
  is a mandatory pre-browser-QA guard that fails closed unless the
  effective Supabase URL resolves to `localhost`/`127.0.0.1` and does
  not contain the hosted ShredOS project ref — a direct response to a
  documented earlier incident where a local dev server reached the
  hosted Supabase auth endpoint.

### Authentication and authorization

- **Cookie-bound Supabase SSR auth**: `src/lib/supabase/server.ts`'s
  `createClient()` builds a `@supabase/ssr` `createServerClient` whose
  `cookies.getAll()`/`setAll()` are backed directly by Next.js's
  `cookies()` — there is no custom JWT handling or bearer-token
  scheme; the session lives entirely in Supabase's own auth cookies.
  `src/middleware.ts` calls the matching `updateSession()` helper on
  every non-static request to keep that cookie session fresh.
- **API-route authorization is a layered pattern, not one uniform
  rule** — confirmed by reading multiple routes directly rather than
  assuming a single pattern generalizes:
  - **App-layout/page gates**: `src/middleware.ts` blocks
    unauthenticated access to protected route paths before any page
    or API code runs.
  - **Route-level authentication**: most data routes (e.g.
    `src/app/api/workouts/[id]/route.ts`) call
    `supabase.auth.getUser()` at the top of each handler and reject
    with 401 if there is no user. This is not universal, though: the
    signout route (`src/app/api/auth/signout/route.ts`) calls only
    `supabase.auth.signOut()` and never calls `getUser()` — it has no
    identity check to make, since signing out an already-anonymous
    session is harmless.
  - **Explicit ownership filters, where implemented**: many routes
    add `.eq('user_id', user.id)` (or the equivalent column) to every
    query on top of authentication, giving defense-in-depth beyond
    RLS. This is also not universal — `src/app/api/routine-exercises/[id]/route.ts`'s
    `PATCH`/`DELETE` handlers confirm the user is authenticated via
    `getUser()`, but then update/delete `workout_routine_exercises`
    filtered only by `.eq('id', params.id)`, with no explicit
    `user_id`/ownership predicate in the application query at all —
    ownership enforcement for that route is delegated entirely to RLS
    after authentication succeeds.
  - **Authenticated RPC ownership checks**: some flows (e.g. review-
    transition triggers/functions referenced in the EXLIB catalog
    schema) push ownership/authorization logic into a database
    function that runs under the authenticated role rather than in
    the route handler.
  - **RLS as the final backstop in every case**: regardless of how
    much ownership filtering a given route performs itself, per-table
    RLS (see below) is what actually prevents cross-user access if an
    application-level filter is ever missing, as in the
    routine-exercises case above.
- **Row Level Security as the data-layer backstop — three distinct
  policy shapes, not one universal rule** (confirmed by reading the
  migration SQL directly):
  - **Direct user-owned tables** generally compare `user_id` to
    `auth.uid()` (e.g. migration 003's `workout_sessions`/
    `workout_exercises` `FOR ALL USING (user_id = auth.uid()) WITH
    CHECK (user_id = auth.uid())`; migration 018's `exercise_muscles`
    follows the same "own-row RLS ... per-operation pattern" per its
    own comment).
  - **Child tables may enforce ownership through parent joins**
    rather than carrying their own `user_id` — e.g. migration 003's
    `workout_sets` policy scopes rows via `workout_exercise_id IN
    (SELECT we.id FROM workout_exercises we JOIN workout_sessions ws
    ... WHERE ws.user_id = auth.uid())`.
  - **Catalog/internal tables use closed/restricted RLS, not
    universal direct `user_id` policies**: migration 023 enables RLS
    on all nine `exercise_catalog*`/`exercise_name_claims` tables
    with ZERO client-facing policies and `REVOKE ALL ... FROM
    PUBLIC, anon, authenticated` — they are reachable only through
    the SECURITY DEFINER delivery function — while `exercise_aliases`
    gets a single restricted `SELECT`-only own-row policy.

  `GRANT` statements consistently target `authenticated` only
  (column-scoped on `exercises`), explicitly never `anon` and never
  a `service_role` grant.
- **No service-role usage**: a recursive search of `src/` for
  `service_role`/`SERVICE_ROLE` returns zero matches. The only
  Supabase credential used anywhere in application code is the public
  anon key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`), consistent with RLS
  being the actual data-isolation guarantee rather than a
  privileged-key bypass. `docs/ui-overhaul-closeout.md`'s closeout
  validation independently states "RLS/session-derived identity with
  zero `service_role` usage" as a re-proven behavioral contract.

### Product-area boundaries (as currently implemented)

- **Workouts/exercises**: `workout_sessions` (structured strength
  training, live+historical lifecycle, one true-active-session guard)
  -> `workout_exercises` -> `workout_sets`, with per-set behavior
  branching on the exercise's `tracking_mode` (`weight_reps`,
  `bodyweight`, `cardio`, `timed`). Records/PRs, cardio/timed
  all-time aggregates, and multi-muscle targeting
  (`exercise_muscles`, 25-value canonical vocabulary layered over a
  single required `primary_muscle`) are all live and read-scoped to
  `user_id`.
  - **Legacy JSONB rollback insurance**: `exercises.secondary_muscles`
    still exists physically but is dead — no code writes or reads it
    as authoritative any more (superseded by `exercise_muscles`); it
    is deliberately not dropped yet (see section 3).
- **Food/nutrition**: `food_logs`/`saved_meals` logging, per-date
  fetch helpers, sex-aware `calculateNutritionTargets()`, and a
  manual nutrition-label calculator — no OCR/photo entry.
- **Body metrics**: `body_metrics` weigh-ins with trend-confidence
  tiers, BMI computed in application code (never a generated DB
  column), imperial display over metric storage.
- **Fasting**: `fasting_logs` with a DB-level `UNIQUE` partial index
  enforcing one active fast per user (`ended_at IS NULL`),
  app-calculated (not stored) duration, milestone messaging.
- **Activity/running sessions**: a strict three-table boundary —
  `workout_sessions` (strength), `activity_sessions` (intentional
  non-strength activity, e.g. walk/run/cycle — "many per day, no
  lifecycle, no reopen"), and `daily_activity_logs` (passive per-day
  step/distance aggregate). Explicitly documented as never
  cross-writing, with reconciliation between session distance and the
  daily aggregate handled as a one-way, non-blocking informational
  comparison. There is no dedicated running/race-plan feature yet
  (see section 3).
- **Coaching/decisions**: `decision_logs` records every target/goal
  change with a `suggested -> accepted/dismissed -> applied/reversed`
  lifecycle; coach actions and decision recording are live, but the
  "Coach Suggested Routine" auto-recommendation feature is deferred
  (see section 3).
- **UI/design system**: the UI-1 through UI-7 dark-theme overhaul
  (see section 2) established the current shared visual language
  (dark charcoal/glass background, mint/green accents, Radix-based
  primitives under `src/components/ui/`) with 22 routes, a bottom-nav
  mobile shell, and a documented accepted residue of legacy alias
  tokens in 23 files (see section 2) rather than a hard defect.

## 5. Authoritative documentation — topic-specific hierarchy

There is no single blanket source of truth; different questions are
authoritative from different places:

- **Current code and schema behavior** — the worktree itself
  (`src/`, `supabase/migrations/`) is authoritative for what the
  application actually does and what schema is committed. Docs
  describe intent and history; they do not override what the code and
  migrations actually contain.
- **Structured ledgers (live data, not narrative)** — two `.jsonl`
  files must be read directly, never trusted via another doc's
  summary of their counts: `docs/exlib1b1-review-ledger.jsonl`
  (per-record review status) and `docs/exlib1c0a-equipment-resolution.jsonl`
  (per-candidate import eligibility).
- **Dated decision records** — `docs/*-product-decision*.md` and
  `docs/exlibNxNy-*-decisions.md` files are authoritative for what
  Joseph has actually approved, and only for the exact bullets they
  close; later records supersede earlier ones only via their own
  explicit, dated "Supersession" section citing exact byte
  fingerprints, never by silent rewrite.
- **Application/deployment records** — docs such as
  `docs/exlib1c0b3-application-deployment-hosted-qa-record.md` are
  authoritative for what was actually applied to the hosted Supabase
  project and production Vercel deployment, overriding a migration
  file's own internal (frozen, historical) "STATUS: DRAFT" header
  text.
- **Historical/superseded documents** — earlier phase notes and
  earlier decision records remain byte-identical and are still the
  accurate record of what was true/decided *at that time*; they are
  read for provenance, not as current status, once a later document
  explicitly supersedes a specific statement in them.
- **`README.md` — stale, historical only** (see section 7): despite
  being the repository's most prominent file, it is **not**
  authoritative for current status. It documents itself as such in
  its own "Current status (Phase 1V)" section.
- `docs/ui-overhaul-closeout.md` is the best single entry point for
  UI-program history; this document is the best current entry point
  for overall repository state as of 2026-08-27.
- The EXLIB decision chain must be read in dated order —
  `exlib1c0b-*` (audit) -> `exlib1c0b2-*` (equipment decisions) ->
  `exlib1c0b3-*` (implementation + application record) ->
  `exlib1c0b4-*` (weight_time decisions) — for the same
  narrow-supersession reason given above.

## 6. Verification infrastructure

- 60 `scripts/verify-*` files: **56 `.ts`** (run via `npx tsx`) and
  **4 `.sh`**, one roughly per shipped phase, each independently
  runnable and named for its phase (`verify-phase*`, `verify-ui*`,
  `verify-exlib*`).
- Several EXLIB verifiers (e.g. `verify-exlib1c0b4.ts`) encode
  fail-closed, line-exact diff checks and full SHA-256 pins against
  prior artifacts, so that a later phase's own verifier will fail if
  it detects any byte drift in a document it depends on.
- No shared test runner or CI config was found in this pass (no
  `jest.config`, no `vitest.config`, no `.github/workflows` observed
  under the non-`node_modules` tree during this audit).
- `package.json` scripts: `dev`, `build`, `start`, `lint`,
  `type-check` (`tsc --noEmit`). These plus the per-phase verifiers
  are the full verification surface.
- **This audit's actual verification results** (all commands re-run
  directly against the current worktree on 2026-08-27, from
  `main` = `9b22947` with this document as the only uncommitted
  file):
  - `npx tsc --noEmit` — **passed**.
  - `npm run build` (production build) — **passed** ("Compiled
    successfully").
  - `git diff --check` — **passed** (clean).
  - **Full `.ts` battery**: all 56 suites executed via `npx tsx`;
    **6,396 individual checks passed, 12 failed; 44 suites fully
    green, 12 suites with exactly one failing check each**. Every
    one of the 12 failures is the suite's worktree-inventory/scope
    check — `verify-exlib1a` D3, `verify-exlib1b1` E4,
    `verify-exlib1b3` E6, `verify-exlib1c0` E2, `verify-exlib1c0a`
    D1, `verify-exlib1c0b` G2, `verify-exlib1c0b2` G1,
    `verify-exlib1c0b3` G1, `verify-ui5b1b` B6, `verify-ui5b2` S4,
    `verify-ui6c` A1b, `verify-ui7` A1 — each of which pins the
    exact expected set of worktree changes and correctly flags this
    new, not-yet-admitted audit document as an unexpected untracked
    file. Zero functional/behavioral checks failed; the identical
    12-check delta disappears once this document is either admitted
    (labeled, per the established convention) or committed. (Dated
    note, 2026-08-28: the EXLIB-1C0B5 record phase subsequently
    added exactly those labeled admissions, so the full battery is
    green again with this document present — see that phase's own
    verifier for the post-admission totals.)
  - **Disposable-Postgres live suites — run this time**:
    `verify-exlib1c0b3-live.sh` **27/0**,
    `verify-exlib1b2-live-concurrency.sh` **24/0**,
    `verify-exlib1b3-live.sh` **22/0** (socket-only local Postgres;
    no hosted contact).
  - **Local-only guard** (`verify-exlib1c0b3-guard.sh`) — executed
    with no local Supabase stack present; it correctly **failed
    closed** ("effective URL references the HOSTED ShredOS project
    (source: .env.local)", exit 1), which is its designed behavior
    outside a properly configured local-stack session, and is
    reported here as a demonstration of the guard working, not as a
    verification failure.

## 7. Material inconsistencies or stale records found this turn

- **`README.md` is stale historical documentation and should not be
  used for current status.** It exists at repo root (missed by the
  first version of this audit, which incorrectly stated no README
  exists — corrected here) and is explicit about its own staleness in
  a "Current status (Phase 1V)" banner: it was "originally written
  for Phase 1A," and its file-tree, RLS-policy summary, deferred-
  features table, and Phase 1A testing checklist are all named there
  as unrefreshed historical sections. Concretely stale/incorrect
  points found by direct inspection:
  - **Port mismatch**: README instructs `http://localhost:3000` and
    `NEXT_PUBLIC_APP_URL=http://localhost:3000` throughout, but
    `package.json`'s actual `dev` script is `next dev -p 3010`.
  - **Removed env var still documented**: README's environment-
    variable block still lists `NEXT_PUBLIC_APP_NAME=ShredOS`, but
    `docs/ui-overhaul-closeout.md` records this variable as removed
    in UI-7 "with zero-reference proofs."
  - **Old branding**: the README's Roadmap section frames "ShredOS ->
    ForgeFit" renaming as a still-open future evaluation ("Evaluate
    renaming... Preferred direction: ForgeFit"), but the UI overhaul
    closeout confirms the ForgeFitOS/ForgeFit visual identity has
    already fully shipped (UI-1 through UI-7) — the rename is
    already-done history, not an open roadmap item.
  - **Already-shipped features still listed as "Deferred features
    (Phase 1B and beyond)"**: the README's deferred-features table
    lists food logging, workout planner + lift log, exercise library,
    and progress charts as not-yet-built — all of these are confirmed
    shipped and in active use today (food logging, workouts/routines,
    `/progress` are all live app routes per section 1/4). The
    README's remaining deferred-features row, "Claude API coaching,"
    is **still accurate as literally written**: a recursive search of
    `src/` found no Anthropic/Claude SDK dependency and no external
    AI-model integration anywhere in the codebase. What *is* shipped
    and live is a deterministic, rule-based coaching/decision system
    (`src/lib/coach-actions.ts`, `src/lib/coach-constants.ts`,
    `decision_logs` lifecycle, `/coach` and `/decisions` routes) —
    this is a materially different feature from the README's original
    "Claude API coaching" item (an LLM-driven coach), not a shipped
    superset of it. The README item should be read as "still
    unimplemented," while the shipped rule-based Coach surfaces should
    not be conflated with it.
  - **Migration/tree summary frozen at Phase 1A**: the README's "File
    tree summary" and "Supabase setup" sections still describe a
    single `supabase/migrations/001_phase1a_schema.sql` file and a
    5-table RLS summary, while the repository actually has 25
    migrations and dozens of tables.
  - The README itself already flags most of this under "Watch list
    before wider testing" ("README needs a full documentation
    refresh... Deferred until after buddy testing settles") — so this
    is a known, self-acknowledged staleness, not a newly discovered
    defect, but it is a real current-state hazard for anyone who
    reads the README instead of `docs/`.
- **This document's own inventory corrections** (director-identified,
  applied in this revision): route count is 22 (not 21 — the root
  redirect page was previously undercounted); `docs/` totals are 49
  `.md`/58 files after adding this audit document, against a 48/57
  pre-audit baseline (the first version conflated the two); verifier
  scripts total 60 (56 `.ts` + 4 `.sh`), not 57; migrations 001–022
  do not use an explicit top-level `BEGIN`/`COMMIT` transaction — only
  023–025 do (the first version incorrectly generalized the EXLIB
  pattern to all 25 migrations).
- A prior session's memory record claimed this exact audit document
  already existed at this path, written "this turn" on 2026-08-27.
  It did not exist in the repository (confirmed by `Glob` before
  writing this file). The memory was either describing an uncommitted
  write that was lost, or was simply incorrect. This document is the
  first actual copy; the stale memory should be corrected to point
  here without assuming continuity with a prior draft.
- No other repository-content inconsistency was found: every count
  cited in existing memory (25 migrations, no 026, 48/48 pending
  ledger, 26/26 import-ineligible candidates, 4-value `TrackingMode`)
  was independently re-verified directly against the current worktree
  in this pass and found accurate.

## 8. Recommended next engineering milestone

**Not** "draft migration 026." EXLIB-1C0B4 is explicit that both
"Implementation" and "Migration 026" are **NOT AUTHORIZED**, and that
weight_time requires "a separately reviewed coordinated plan (schema +
types + validation + API + UI + records/progression in one reviewed
release)" — a schema-first migration draft would jump ahead of that
required coordinated plan.

The correct sequencing is:

1. **Immediate gate (Joseph, product decision, not engineering) —
   NOW SATISFIED (2026-08-28)**: the one open sub-question — whether
   `rpe` and/or a warmup flag are permitted on a `weight_time` set
   (section 3, section 9) — was resolved by Joseph on 2026-08-28 in
   `docs/exlib1c0b5-weight-time-rpe-warmup-decision.md`. It fixed
   the permitted field contract (both already-existing
   `workout_sets.rpe`/`is_warmup` columns are permitted, optional,
   metadata/exclusion semantics pinned there) that the coordinated
   plan must design around — not a new-column question. As written
   at audit time this gate was open; this dated note records its
   closure without rewriting that history.
2. **Next engineering milestone, now that (1) is answered — still
   NOT started and NOT authorized by the overlay**: produce a
   **separately reviewed weight_time coordinated-implementation
   plan** — the single planning artifact (not yet a migration draft)
   that lays out the `TrackingMode` type change, the field contract,
   validation rules, API contract, UI behavior, and
   records/progression logic together, per EXLIB-1C0B4's explicit
   requirement that these ship as one coordinated, reviewed release.
   Migration 026 itself is downstream of that plan, not the milestone
   itself, and per the schema audit (`docs/exlib1c0b-schema-vocabulary-impact-audit.md`)
   would primarily need **vocabulary/`CHECK`-constraint changes**
   (adding `weight_time` to the tracking-mode vocabulary, the same
   drop/re-add `CHECK` pattern migration 025 already used for
   equipment) **and supporting function changes** (e.g. the
   legacy-`exercise_type`-derivation branch required by Decision 3) —
   not new columns, since the decided field contract reuses
   `weight_kg`/`duration_seconds` and permits the optional existing
   `rpe`/`is_warmup` fields under the EXLIB-1C0B5 contract, all of
   which already exist.

The EXLIB catalog-content program (importing actual exercises) is
**not** a viable next milestone either. Its public/commercial path
is blocked on Gate L1 (qualified legal counsel, which no engineering
agent can supply) and the unresolved public/commercial Gate L2
question; its already-approved private-use path is separately still
unauthorized because no approved exact payload exists, the review
ledger is 48/48 pending, all 26 candidates remain import-ineligible,
and the specialist/eligibility/rollout gates are unresolved (see
section 3).

## 9. Open product questions requiring Joseph's judgment

**The single immediate product gate that was blocking the
recommended weight_time planning milestone — resolved 2026-08-28:**

1. **RPE/warmup field contract for `weight_time` — CLOSED
   (2026-08-28, dated supersession)**: whether a `weight_time` set
   may use the already-existing `workout_sets.rpe` value and/or
   `is_warmup` flag. This was the one sub-question EXLIB-1C0B4
   explicitly left open (carried from EXLIB-1C0B1 item 4); at the
   time this audit was written it was the only Joseph product
   question blocking section 8's recommended next milestone. Joseph
   answered it on 2026-08-28 — see
   `docs/exlib1c0b5-weight-time-rpe-warmup-decision.md` for the full
   pinned contract. No Joseph product question now blocks starting
   the coordinated-implementation *plan*; the plan itself still
   requires separate review before any migration/runtime work.

**Related but separately-classified items — not the same kind of
gate as (1), and not blocking engineering from continuing on other
work:**

2. **EXLIB catalog Gate L1 (external-counsel dependency, not a
   product-judgment question for Joseph)**: closing this gate
   requires sourcing qualified outside legal counsel to produce an
   affirmative, dated, attributable, scoped determination on the
   StrengthLog-derived manifest (including the flagged
   Terms-of-Service evidence gap). Per
   `docs/exlib1c0-legal-product-approval-packet.md`, Joseph explicitly
   *cannot* supply this gate himself — "a product-owner choice is not
   a legal determination" — so this is not listed as a Joseph
   decision point at all, only as a standing external dependency. It
   gates **public/commercial release specifically**; it is not
   claimed as a private-use gate (see section 3), so the private-use
   path's own blockers (approved payload, ledger review, specialist,
   eligibility, rollout) are what keep private loading unauthorized
   regardless of L1.
3. **EXLIB catalog Gate L2 (public/commercial use) — sequenced after
   Gate L1, per the approval packet**: only the private-use case is
   currently approved (`docs/exlib1c0a-private-use-product-decision.md`).
   The approval packet's own two-gate structure requires Gate L1 to
   close first; Joseph's public/commercial product decision is real
   future Joseph judgment, but it cannot be exercised meaningfully
   until counsel's determination exists to decide within, so it is
   not an active blocking question right now either.
4. **README refresh timing — documentation debt, not a product
   decision required before engineering can continue**: the README
   already self-flags as needing a full documentation refresh
   "deferred until after buddy testing settles." No action is proposed
   here beyond naming it, per this task's instruction not to rewrite
   or supersede historical records as part of this audit. This is
   listed only for completeness; it does not require Joseph's
   judgment before any engineering milestone can proceed.

No product decision beyond item (1) was required to proceed with the
recommended next milestone, and item (1) closed on 2026-08-28 (see
above); this audit itself required no schema, code, or migration
change. Migration 026 remains nonexistent and unauthorized.
