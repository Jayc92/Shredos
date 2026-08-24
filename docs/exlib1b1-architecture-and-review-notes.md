# EXLIB-1B1 — Exercise Library Canonical Architecture and Human-Review Contract

Architecture/review-tooling phase only (recorded 2026-08-20).
No migration 023 was authored; no SQL exists in this document or
this phase; no product behavior changed; no exercise was imported;
no Supabase or Vercel contact occurred; no review entry was
approved. Starting state: `main` =
`34c8a665c2b976c34096b80391756c1d36858fa4`
(`exlib1a-exercise-library-discovery-stable`), migrations exactly
001–022, EXLIB-1A manifest byte-identical (SHA-256
`336cd4253f747cdb3ba73ffa2af5a63e255c7c87cc452d4c43ed59a654673dfa`,
395 records, dispositions 7/7/2/379/0, confidence 125/222/48,
eligibility 333/10/14/38).

## Part 2 — Complete current-architecture consumer inventory

### Direct `from('exercises')` readers/writers (8 files)

| File | Contract |
|---|---|
| `src/app/api/exercises/route.ts` | GET list (user-scoped), POST create (validated; `is_system: false`; inserts `exercise_muscles` targets; rolls back on relationship failure) |
| `src/app/api/exercises/[id]/route.ts` | PATCH (metadata edit; logs `exercise_deactivated` decision on the active->inactive transition only), DELETE (RESTRICT-aware) |
| `src/app/(app)/workouts/exercises/page.tsx` | library page (user-scoped list + `exercise_muscles`) |
| `src/app/(app)/workouts/[id]/page.tsx` | execution page reads |
| `src/app/(app)/workouts/routines/[id]/page.tsx` | routine-detail reads |
| `src/app/(app)/progress/exercises/[id]/page.tsx` | history/trend detail |
| `src/lib/strength-records.ts` | progress aggregate scans |
| `src/lib/supabase/seed-exercises.ts` | per-user seeding (15 rows, `is_system: true`) |

### Embedded-join consumers (`exercise:exercises(...)`)

`src/app/(app)/workouts/page.tsx` (hub: `primary_muscle` join for
muscle coverage); `api/workouts/[id]` (full embed);
`api/workouts/[id]/exercises`; `api/routines`, `api/routines/[id]`,
`api/routines/[id]/exercises`, `api/routines/[id]/start`
(reads `id, name, unilateral`); `api/workout-sets/[id]`,
`api/workout-exercises/[id]/sets`,
`api/workout-exercises/[id]/apply-first-set` (all read
`tracking_mode` to validate set payloads); `lib/weekly-review.ts`
(workout_exercises joins); `lib/supabase/server.ts`;
`WorkoutsSubNav`.

### `exercise_muscles` consumers (8)

Library page, both `api/exercises*` routes, `ExerciseForm`,
`ExerciseListItem`, `lib/exercise-validation.ts` (vocabulary +
roles), the seeder, `types/database.ts`.

### Domain migrations

003 (tables + RLS), 004 (routine FK), 006 (routine-aware targets),
010 (tracking modes), 011 (tracking-aware entry), 018
(exercise_muscles + 25-muscle vocabulary), 021 (transactional
ordering RPCs), 022 (`create_routine_from_workout`,
`repeat_workout_as_new_session` — both COPY `exercise_id` values
into new rows, so identity continuity is load-bearing inside
SECURITY INVOKER SQL).

### Established facts (each verified in source this turn)

- **Coexistence:** system and user-created exercises live in ONE
  per-user table; `is_system` is display-only (badge in
  `ExerciseListItem`) — no behavioral gating.
- **Uniqueness:** names are unique per user via
  `exercises_user_name_unique_idx (user_id, lower(name))`.
- **History identity:** `workout_exercises.exercise_id` and
  `workout_routine_exercises.exercise_id` FK `exercises(id)`
  `ON DELETE RESTRICT`; the 021/022 RPCs copy those ids.
- **Metadata mutability:** PATCH can change metadata after use;
  history joins re-read current metadata by id (tracking-mode edits
  are validated by `exercise-validation`); name edits propagate to
  history displays (accepted current behavior).
- **Existing-user delivery of new defaults:** NONE exists. Seeding
  runs only when the user has zero exercises — adding a 16th seed
  would reach only brand-new users.
- **New-user provisioning:** `seedExercisesIfNeeded` on first
  `/workouts` visit; idempotent by count; 23505-tolerant.
- **user_id assumption:** EVERY read path is user-scoped; RLS
  `exercises_all FOR ALL USING (user_id = auth.uid()) WITH CHECK
  (user_id = auth.uid())` makes any global (user-less) row invisible
  to every existing query.
- **Ownership on writes:** POST/PATCH/DELETE derive the user from
  `auth.getUser()`; RLS enforces it independently.
- **Inactive exercises:** `is_active=false` hides from
  pickers/library; history keeps reading them by id (RESTRICT keeps
  the row).
- **What a global-catalog design would displace:** the
  `exercises_all` RLS policy; the per-user unique index semantics;
  POST collision handling; the library/picker queries; the seeder;
  `is_system` semantics; both 022 RPC ownership assumptions; and
  every one of the 14 user-scoped read sites — this displacement
  list is what the Part 3 scoring is grounded in.

## Part 3 — Architecture options and decision matrix

### Option A — replicated per-user defaults (status quo extended)

Every canonical default is inserted into each user's `exercises`
rows. Storage duplicates (395+ rows x users — trivial at current
scale); catalog metadata fixes do NOT propagate (each user's copy
is theirs — good for user control, bad for corrections); backfill
for existing users must insert per user and skip collisions with
their own creations; idempotency must key on something stable per
user; RLS/queries/history/RPCs/seeder all unchanged; user edits are
naturally isolated; aliases must be per-user.

### Option A+ — Option A delivery + a global canonical CATALOG
source-of-truth (recommended variant; materially distinct)

Product tables and every consumer stay EXACTLY as today (per-user
delivery rows). A new global `exercise_catalog` table (closed by
default — no product, authenticated, or anon access; see Part 4.3)
is the importer's canonical source: catalog versioning, provenance, review
status, and idempotency live ONCE globally; per-user delivery rows
carry a `catalog_id` provenance pointer (nullable — user-created
rows have none). Consumers never query the catalog; only the
importer and review tooling do. This isolates ALL new complexity in
new tables while product queries, RLS, history, and the 47-suite
pin surface stay byte-stable.

### Option B — global canonical catalog + user-created overlay

Users read global rows (`user_id IS NULL`) unioned with their own.
Displaces everything in the displacement list above: RLS must gain
a global-read policy; `exercises.user_id NOT NULL` must be relaxed
(schema surgery on the hottest table); the per-user unique index no
longer prevents user-vs-global name collisions; POST collision
handling, pickers, library, seeder, and `is_system` semantics all
change; both 022 RPCs must be re-audited for user-less rows;
per-user customization of a global exercise needs a shadow/override
mechanism anyway. Central updates and zero duplication are real
wins, but they buy nothing the current scale needs.

### Option C — global catalog + per-user identity/projection rows

Global metadata rows plus thin per-user identity rows referencing
them; custom exercises stay user-owned. History/RLS/FKs stay stable
(identity rows carry user_id), but every consumer that reads
`name/primary_muscle/equipment/tracking_mode` directly off
`exercises` (14+ sites, all the embedded joins, the 022 RPCs, the
set-validation reads) must either join through the projection or
rely on duplicated columns that can drift. Provisioning still has
to create per-user rows, so the per-user row count is NOT avoided —
only the metadata is deduplicated, at the price of a join or a
drift risk on the app's most-read table.

### Decision matrix (weights reflect ForgeFitOS's actual consumers)

Criteria (weight): consumer compatibility (5) — 14+ user-scoped
read sites, embedded joins, two SECURITY INVOKER RPCs, and a
47-suite pin surface; history stability (5) — RESTRICT FKs and
copied ids are load-bearing; RLS simplicity (4); import idempotency
(3); catalog updatability (2); storage efficiency (1); operational
complexity (3); user customization (3). Scores 1–5:

| Criterion (weight) | A | A+ | B | C |
|---|---|---|---|---|
| Consumer compatibility (5) | 5 | 5 | 1 | 3 |
| History stability (5) | 5 | 5 | 3 | 5 |
| RLS simplicity (4) | 5 | 5 | 2 | 4 |
| Import idempotency (3) | 3 | 5 | 5 | 4 |
| Catalog updatability (2) | 2 | 3 | 5 | 4 |
| Storage efficiency (1) | 2 | 2 | 5 | 3 |
| Operational complexity (3) | 4 | 4 | 2 | 2 |
| User customization (3) | 5 | 5 | 3 | 4 |
| **Weighted total (max 130)** | **112** | **120** | **73** | **97** |

### Recommendation — PROPOSED, NOT APPROVED

**Option A+** is proposed. It wins because ForgeFitOS's entire read
surface is user-scoped by RLS and by 14+ query sites; because
history identity (RESTRICT FKs + RPC-copied ids) must not move;
and because the only genuine gaps in plain Option A — global
idempotency, catalog versioning, and provenance — are exactly what
a non-product-facing catalog table adds without touching one
existing consumer. Options B and C optimize storage and central
updates that current scale does not need, at the cost of the app's
most load-bearing invariants. This recommendation is derived from
the consumer inventory above, not database preference, and it
awaits explicit approval before any schema work.

## Part 4 — Proposed data contract (documentation only; no SQL)

Revised after the EXLIB-1B1 architecture review (Option A+
provisionally accepted). Four review gates are closed below; the
contract remains PROPOSED and migration 023 remains unauthored.

### 4.1 Tables and identity

**`exercise_catalog`** (global; the importer's canonical source;
CLOSED to the product — see 4.3): `id` UUID PK; `canonical_name`
text <=100, unique on lower(canonical_name); `category`
(compound|isolation|cardio|mobility|other); `primary_muscle`
(25-value vocabulary plus any review-approved additions);
`secondary_muscles`/`tertiary_muscles` (text[] over the same
vocabulary); `equipment` (existing 8-value enum); `laterality`
(bilateral|unilateral|alternating — three-value enum in the catalog
ONLY; `exercises.unilateral` stays untouched and delivery maps
alternating to unilateral=true until a product decision widens it);
`tracking_mode` (existing 4 values); `source_url` unique;
`source_page`; `retrieved_at`; `import_confidence`;
`review_status` (pending|approved|revised|rejected); `reviewed_by`,
`reviewed_at`, `review_rationale` (nullable); `catalog_version`
int; `is_active` boolean; timestamps. **Catalog rows are immutable
once delivered from and versioned thereafter: corrections create a
new `catalog_version` row; catalog rows are deactivated, NEVER
deleted, so no delivered row can be orphaned and audit history
survives (see 4.5).**

**`exercise_catalog_import_runs`:** `id` UUID PK; `run_key` text
unique (manifest SHA-256 + catalog version); `started_at`,
`completed_at`; `dry_run` boolean; `result_counts` jsonb
(inserted/skipped/collision/error + stable identifiers). Run rows
are never deleted (RESTRICT-protected by delivered rows; 4.5).

### 4.2 Gate 1 — tenant-safe alias ownership (declarative)

- `exercises` gains a UNIQUE candidate key on `(user_id, id)` —
  additive; the existing PK on `id` and every existing FK stay
  untouched.
- **`exercise_aliases`**: `id` UUID PK; `user_id` UUID NOT NULL;
  `exercise_id` UUID NOT NULL; `alias` text <=100; unique
  `(user_id, lower(alias))`; **composite foreign key
  `(user_id, exercise_id)` REFERENCES `exercises(user_id, id)`
  ON DELETE CASCADE** — the database itself makes it impossible for
  one user's alias to reference another user's exercise, even if
  application logic, RLS, or a client-supplied user id were wrong.
  No trigger or route check is the enforcement mechanism; the
  composite FK is.
- An alias must also not equal any of the SAME user's exercise
  names (write-time validation + dry-run verification; the two
  namespaces are checked together at resolution time).
- RLS: owner-only, per operation — SELECT USING
  (user_id = auth.uid()); INSERT WITH CHECK (user_id = auth.uid());
  UPDATE USING+WITH CHECK (user_id = auth.uid()); DELETE USING
  (user_id = auth.uid()).
- Aliases are pure lookup rows: nothing (history, routines, sets,
  progress) ever references `exercise_aliases.id`; pickers/search
  resolve an alias to its canonical `exercises.id`, so a second
  exercise/history identity can never exist.

### 4.3 Gate 2 — catalog access and write authority (closed by
default, least privilege)

- `exercise_catalog` and `exercise_catalog_import_runs`: RLS
  ENABLED with **zero policies for `authenticated` and zero for
  `anon`** — closed by default. No product route reads them; the
  current product continues reading ONLY user-owned `exercises`
  (the Part 2 inventory is unchanged by this contract).
- Grants (least privilege, stated precisely): REVOKE ALL from
  PUBLIC and `anon` on both tables; NO INSERT/UPDATE/DELETE and NO
  SELECT grants to `authenticated`; table owner (`postgres` via
  Joseph-applied migrations) retains DDL/DML for import operations.
- Any future user-facing catalog read surface (e.g. browsing
  not-yet-delivered exercises) is a SEPARATE, separately reviewed
  contract — it is not implied or pre-authorized here.
- The importer is an explicitly authorized database function or a
  Joseph-run migration/import operation — never a browser client,
  and never a new `service_role` dependency in product source
  (repository source keeps zero `service_role` references).
- If any function is SECURITY DEFINER (the delivery function in 4.4
  is), it MUST: set a fixed `search_path` (e.g. `public,
  pg_temp`); derive the acting user exclusively from `auth.uid()`
  with explicit ownership checks on every write; be REVOKEd from
  PUBLIC and `anon`; and be granted EXECUTE only to
  `authenticated` (delivery) or to no runtime role at all
  (import/maintenance functions run only by Joseph).

### 4.4 Gate 3 — atomic, resumable delivery (never the client
seeder pattern)

Delivering hundreds of defaults through independent client requests
would permit partial libraries; that path is rejected. The
contract:

- **One transactional delivery operation per user per import run**
  — a single database function (`deliver_catalog_exercises`-style;
  SECURITY DEFINER under the 4.3 discipline) that inserts every
  approved, active catalog row for the calling user inside ONE
  transaction. Interruption rolls the whole delivery back; there is
  no partially delivered state.
- **Idempotency:** a **partial unique index on
  `exercises(user_id, catalog_id) WHERE catalog_id IS NOT NULL`**
  makes redelivery a no-op per row; the function also records
  `run_key` in `exercise_catalog_import_runs`, so retry after
  interruption produces zero duplicates and the same stable result.
- **Inserts only.** The function NEVER updates, renames, retargets,
  reactivates, or deletes any existing `exercises` row — delivered,
  seeded, or user-created.
- **Collisions:** if the user already owns ANY exercise (or alias)
  whose lower(name) equals a catalog row's name, that row is
  SKIPPED and reported — never overwritten, never merged.
- **Result:** the operation returns
  inserted/skipped/collision/error counts plus the stable
  identifiers (`run_key`, inserted `catalog_id`s) for the run
  report.
- **Existing-user backfill** is explicit and opt-in, batched per
  user, using this same function — never automatic on page load.
- **New-user provisioning** calls the SAME authoritative function
  (the current seeder becomes a thin trigger point that invokes it)
  — no second, behaviorally divergent delivery loop.
- **Rollback:** deactivate (`is_active=false`) ONLY rows whose
  `import_run_id` matches the specified run AND that have zero
  workout/routine references; referenced rows are never deleted and
  user-created rows are never touched.

**Coexistence with the current 15-seed behavior during rollout:**
the legacy 15 seeds keep `catalog_id NULL` (they predate the
catalog). Catalog delivery skips any name collision with them (and
with user-created rows), and the per-user unique index on
`(user_id, lower(name))` plus single-transaction delivery makes a
duplicate or mixed partial seed/catalog state structurally
impossible: a user has either their pre-rollout library, or that
library plus one atomic delivery. Whether the 15 legacy seeds are
later LINKED to their catalog equivalents (setting `catalog_id` on
exact matches) is a separate, explicitly approved backfill decision
— never an implicit side effect.

### 4.5 Gate 4 — delivered-copy mutability semantics and
provenance integrity

- **`exercise_catalog` is the immutable, versioned canonical
  source.** A delivered `exercises` row is a USER-OWNED SNAPSHOT:
  it keeps the app's current edit/deactivate behavior exactly
  (PATCH metadata, deactivate with decision log, RESTRICT-protected
  deletion).
- Catalog updates NEVER silently rewrite a delivered snapshot;
  delivering corrections is a new catalog version plus a separate,
  explicitly approved operation that still only INSERTS new rows
  (a corrected variant a user already has by name is skipped).
- User edits never alter catalog records or any other user's rows
  (RLS + the closed catalog make this structural).
- **Provenance is stable across user edits:** `catalog_id` and
  `import_run_id` never change after insert — a rename or metadata
  edit keeps the provenance pointer. Enforcement is declarative:
  column-level privileges (UPDATE granted to `authenticated` only
  on the editable columns; NO UPDATE privilege on `catalog_id`,
  `import_run_id`, `user_id`, or `is_system`), so even a crafted
  PATCH cannot rewrite provenance or ownership.
- An importer never "repairs" or overwrites a user-edited delivered
  row: the partial unique index makes the row invisible to
  redelivery, and the function is inserts-only by contract.
- **Reactivation:** the user may reactivate their own deactivated
  row at any time; the importer only deactivates within its own
  run's rollback boundary and never reactivates.
- **Rename collisions:** a user rename that hits an existing name
  (or one of their aliases) is rejected by the existing unique
  index semantics — current behavior, unchanged.
- **Subsequent catalog versions:** deliver only catalog rows whose
  `catalog_id` the user does not already have; prior deliveries are
  untouched.
- **Foreign keys:** `exercises.catalog_id` REFERENCES
  `exercise_catalog(id)` **ON DELETE RESTRICT**;
  `exercises.import_run_id` REFERENCES
  `exercise_catalog_import_runs(id)` **ON DELETE RESTRICT** — no
  catalog or run deletion can orphan delivered rows or destroy
  auditability (and both tables are deactivate-only by policy
  anyway).
- `is_system=false` rows remain fully protected from import
  mutation: the importer's insert path sets `is_system=true` on its
  own rows and its queries never write to any pre-existing row.

## Part 5 — Human-review tooling contract

`docs/exlib1b1-review-ledger.jsonl` — one JSON record per line,
**exactly the 48** `human_review_required` records from the
committed manifest, sorted by (category, name), keyed by
`ledger_id` = source URL. Each record separates `source_facts`
(name, category, URL, retrieval date — from the public source) from
`forgefit_proposed` (our research judgments, prefilled ONLY as
recommendations) and carries `unresolved_decisions` with SEVEN
explicitly null fields (anatomy, equipment, laterality,
tracking_mode, naming, alias_or_collision, eligibility), plus
`reviewer: null`, `reviewed_at: null`, `decision_rationale: null`,
`status: "pending"`. Rules (pinned by verify-exlib1b1): a
blank/null field is NEVER approval; `pending -> approved | revised
| rejected` only; any non-pending status REQUIRES reviewer +
reviewed_at + decision_rationale; medium and human-review records
are never promoted automatically; no reviewer identity or approval
is fabricated — all 48 ship pending with null reviewer fields.

**Specialist-review list** (tag counts across the 48): neck 4;
tibialis 4; olympic/full-body movements 13; rotator-cuff rotations
8; loaded carries/holds 2 (also the 2 tracking-mode mismatches);
naming collisions 2 (the leg-curl pair); equipment-unknown 8;
contested anatomy 30 (tags overlap; every record carries at least
one).

## Part 6 — Staged rollout plan (all future; every gate blocks the
steps after it)

1. **Architecture approval** of Part 3/4 (BLOCKER for 2+).
2. Migration 023 SQL drafting + static verification (BLOCKER for 3;
   023 remains unapproved and unauthored in EXLIB-1B1).
3. **Joseph applies the exact approved SQL** (never Claude)
   (BLOCKER for 4+).
4. Read-only deployment verification (BLOCKER for 8).
5. Review-ledger approval — all 48 resolved by a real reviewer
   (BLOCKER for 7/8 for those records; unresolved records are
   excluded from import, never defaulted in).
6. **Legal/product approval of the factual dataset + provenance
   approach** (BLOCKER for 7/8 — per the EXLIB-1A boundary).
7. Dry-run import report (counts, collisions, skips) (BLOCKER for 8).
8. EXLIB-1C controlled idempotent import.
9. Product-query/UI integration if required (aliases in
   pickers/search).
10. Hosted QA.
11. Rollback/deactivation procedure verified (documented in Part 4).

## Migration 023 draft — SUPERSEDED (Revision A below)

The original draft fingerprint
`8c90b88924ce46737499bed97227435387cef423ade9f0ecf1f3d3584e50af6a`
(20,704 bytes) was reviewed and NOT approved — **DO NOT APPLY** that
fingerprint. Its record is retained below for audit; Revision A
replaces it.

### Original (superseded) draft record

Authored under the explicit EXLIB-1B2 approval ("Option A+ is
approved for schema drafting"; drafting only). **Joseph must NOT
apply this migration until ChatGPT reviews the SQL line by line and
explicitly approves the exact fingerprint below.**

- File: `supabase/migrations/023_exlib_catalog_and_delivery_contract.sql`
- Size: 20,704 bytes
- SHA-256:
  `8c90b88924ce46737499bed97227435387cef423ade9f0ecf1f3d3584e50af6a`
- Status: **DRAFT — NOT APPLIED** (not run against any database;
  contains zero data rows).

**SQL object inventory:** tables `exercise_catalog_import_runs`
(fail-closed defaults: `dry_run=true`,
`approved_for_delivery=false`), `exercise_catalog` (immutable/
versioned; review-audit CHECK — a non-pending `review_status`
REQUIRES reviewer + timestamp + rationale; unique
(lower(name), version); at most one ACTIVE row per name),
`exercise_catalog_muscles` (secondary/tertiary; unique per
catalog+muscle), `exercise_catalog_aliases` (globally unique
lower(alias) — cross-catalog ambiguity is declaratively
impossible), `exercise_aliases` (tenant-owned; composite
`(user_id, exercise_id)` FK to `exercises(user_id, id)`); on
`exercises`: UNIQUE `(user_id, id)` candidate key, nullable
`catalog_id`/`import_run_id` with ON DELETE RESTRICT FKs, partial
unique `(user_id, catalog_id) WHERE catalog_id IS NOT NULL`.

**Function signatures:**
- `deliver_catalog_exercises(p_run_key TEXT) RETURNS JSONB` —
  SECURITY DEFINER, `SET search_path = public, pg_temp`; derives the
  user solely from `auth.uid()` (no user parameter); fail-closed on
  missing/unapproved/dry-run keys; eligibility enforced in the WHERE
  clause (`review_status = 'approved' AND is_active`); one
  transaction delivering exercise snapshot + anatomy + aliases
  atomically; idempotent via the partial unique index and
  per-row existence checks; collisions skipped and reported; returns
  inserted/skipped_existing/skipped_collision/collision_names/
  alias_inserted/alias_skipped/inserted_catalog_ids.
- `rollback_catalog_delivery(p_run_key TEXT) RETURNS JSONB` —
  SECURITY DEFINER, same discipline; deactivate-only
  (`is_active=false`) for the CALLER's rows from the named run with
  zero workout/routine references; deletes nothing; returns
  deactivated/retained counts.

**Security/grant summary:** the four catalog-side tables have RLS
enabled with ZERO policies and `REVOKE ALL ... FROM PUBLIC, anon,
authenticated`; `exercise_aliases` has owner-only policies for all
four operations with standard grants; on `exercises`, table-level
INSERT/UPDATE are REVOKED from PUBLIC/anon/authenticated and
re-granted to `authenticated` as exact column lists — INSERT
(user_id, name, category, primary_muscle, equipment, exercise_type,
tracking_mode, unilateral, notes, is_active, is_system), UPDATE
(name, category, primary_muscle, equipment, exercise_type,
tracking_mode, unilateral, notes, is_active) — the complete sets the
product writes today (POST/PATCH routes + seeder verified in
source), so every existing mutation keeps its privileges while
clients can never write `id`, `user_id`, `catalog_id`,
`import_run_id`, `is_system` (update), deprecated
`secondary_muscles`, or timestamps. Both functions are REVOKEd from
PUBLIC/anon and granted EXECUTE to `authenticated` only
(each is safe because every row it touches is scoped to
`auth.uid()`).

**Static verification:** `scripts/verify-exlib1b2.ts` (results
recorded in the phase report; the suite pins the fingerprint above,
the closed grants, the column-list privilege model, the composite
tenant FK, the eligibility boundary, atomic delivery, idempotency,
collision reporting, deactivate-only rollback, and zero data
insertion).

## Migration 023 — Revision A — SUPERSEDED — DO NOT APPLY

Revision A fingerprint
`944c2186504fa007a32c2b5ec39f63cf275c75c1685d0ab2f3d824f699dee232`
(29,036 bytes) was reviewed and superseded by Revision B below —
**DO NOT APPLY** that fingerprint. Record retained for audit.

### Revision A record (superseded)

**Joseph must NOT apply this migration until ChatGPT reviews the
revised SQL line by line and explicitly approves the exact
fingerprint below.**

- File: `supabase/migrations/023_exlib_catalog_and_delivery_contract.sql`
- Size: 29,036 bytes
- SHA-256:
  `944c2186504fa007a32c2b5ec39f63cf275c75c1685d0ab2f3d824f699dee232`
- Status: **DRAFT — NOT APPLIED** (never run against any database;
  contains zero content data — the only inserted rows are
  `exercise_name_claims` derived from each user's own existing
  exercise names, index-like machinery for the namespace
  constraint).

**Object/function/grant changes vs the superseded draft:**

1. **Rollback (finding 1):** `rollback_catalog_delivery` now
   deactivates EVERY active exercise the run delivered to the
   caller — the history-reference skip logic is removed (references
   justify not-DELETING, never staying active). Deletes nothing;
   aliases/anatomy/provenance are preserved for audit; idempotent;
   returns `found` / `newly_deactivated` / `already_inactive`.
2. **One namespace (finding 2):** new `exercise_name_claims`
   table — PRIMARY KEY `(user_id, normalized_name)` — maintained by
   SECURITY DEFINER trigger functions on `exercises`
   (INSERT/UPDATE OF name/DELETE) and `exercise_aliases`
   (INSERT/UPDATE OF alias/DELETE), with a backfill of existing
   exercise names. The DATABASE now rejects any alias-vs-name or
   rename-vs-alias collision (same 23505 SQLSTATE the routes already
   handle). Normalization is EXACTLY `lower(text)` — identical to
   the existing uniqueness semantics; no silent change.
   `exercise_aliases` is now SELECT-only for authenticated (single
   owner SELECT policy; no mutation grants or policies — no alias
   UI exists; a future alias-management surface needs separate
   review).
3. **Stable logical identity (finding 3):** new
   `exercise_catalog_logical` registry; catalog snapshots carry
   `logical_id` with unique `(logical_id, catalog_version)`, one
   ACTIVE snapshot per logical identity and per canonical name;
   canonical aliases attach to `logical_id` (continuity across
   versions, no re-insertion, no global-uniqueness collisions);
   `exercises` gains `catalog_logical_id` and the delivery
   idempotency key is now the partial unique
   `(user_id, catalog_logical_id)` — a new version can never
   deliver a duplicate; `catalog_id` still records exactly which
   version snapshot was delivered.
4. **Concurrency (finding 4):**
   `pg_advisory_xact_lock(8231, hashtext(user_id))` in BOTH
   functions — the same user's delivery/rollback calls serialize;
   unrelated users hash to different keys and proceed concurrently;
   the claims PK and partial unique index are the constraint
   backstop for races with the user's own concurrent create/rename.
5. **Failure semantics (finding 5):** the only caught exception is
   `unique_violation`, per candidate row, inside a subtransaction
   (an expected race disposition counted as a collision with the
   candidate's work fully rolled back). No `WHEN OTHERS`; any other
   failure aborts the entire delivery and raises. The result schema
   (`eligible`, `inserted`, `skipped_already_delivered`,
   `skipped_name_collision`, `collision_names`, `alias_inserted`,
   `alias_skipped_collision`, `inserted_catalog_logical_ids`)
   contains no error count.
6. **Approval auditability (finding 6):** the runs table gains
   `product_approved_by/at`, `legal_approved_by/at`,
   `approval_rationale`, and a CHECK making
   `approved_for_delivery=true` impossible without ALL approval
   identities, timestamps, rationale, and `dry_run=false`; the
   catalog row keeps its reviewer-audit CHECK; the delivery WHERE
   clauses filter exclusively through that state. Nothing is
   populated or approved.
7. **Privileges (finding 7):** unchanged column-list INSERT/UPDATE
   model on `exercises` (now also excluding `catalog_logical_id`);
   all function references schema-qualified under the fixed
   `search_path = public, pg_temp`; claim-trigger functions REVOKEd
   from PUBLIC/anon/authenticated; the two callable functions
   remain the only authenticated EXECUTE grants; `auth.uid()`-only
   identity, no user parameter anywhere.

**Static verification:** `scripts/verify-exlib1b2.ts` rewritten for
Revision A (results in the phase report).

## Migration 023 — Revision B — SUPERSEDED — DO NOT APPLY

Revision B
(`730899c7b533676cb2045c522ecb367913428eaa2c04e5af0f80c2d3bcf13c37`):
SUPERSEDED — DO NOT APPLY. Review found four further findings
(pre-existing name-index handling, delivered-alias provenance and
lifecycle, catalog claim release concurrency, rollback result
contract), closed by Revision C below. Revision B was 33,548 bytes;
its record is retained verbatim below for audit. Also still
superseded — DO NOT APPLY: Revision A `944c2186...699dee232`;
original `8c90b889...4e50af6a`.

**Changes vs Revision A (all Revision A protections retained):**

1. **Constraint-name allowlist (finding 1):** both
   `unique_violation` handlers now run
   `GET STACKED DIAGNOSTICS v_constraint = CONSTRAINT_NAME` and
   handle ONLY: `exercise_name_claims_pkey` (exercise block ->
   `skipped_name_collision`; alias block ->
   `alias_skipped_collision`),
   `exercises_user_catalog_logical_unique_idx`
   (-> `skipped_already_delivered`), and
   `exercise_aliases_user_alias_unique_idx`
   (-> `alias_skipped_collision`). EVERY other unique violation —
   anatomy, provenance, unknown — RE-RAISES and aborts the entire
   delivery. Identity/provenance conflicts can never be labeled
   name collisions.
2. **Global catalog namespace (finding 2):** new
   `exercise_catalog_name_claims` (PK `normalized_name`,
   `claim_source` canonical|alias, `logical_id`), maintained by two
   new DEFINER trigger functions on `exercise_catalog`
   (INSERT / UPDATE OF canonical_name, is_active / DELETE) and
   `exercise_catalog_aliases` (INSERT / UPDATE OF alias / DELETE).
   ACTIVE canonical names and aliases share one namespace: an alias
   equal to another logical exercise's active name fails on the PK;
   version snapshots of the SAME logical identity re-using their
   name are a permitted no-op; deactivation/rename releases the
   claim only when no other active bearer of that logical remains.
   Normalization: exactly `lower(text)`. The catalog is empty at
   migration time, so no catalog backfill exists; triggers + PK are
   concurrency-safe from the first row.
3. **Complete rollback (finding 3):** tenant `exercise_aliases`
   gains `is_active` (default true); the per-user alias unique index
   is now PARTIAL (`WHERE is_active = true`) so released alias names
   are reusable; the tenant claims trigger keeps alias claims
   ACTIVE-ONLY (releases on deactivation, restores on reactivation).
   Rollback now deactivates the run's exercises AND every active
   alias attached to them, releasing alias claims via the trigger,
   keeping all rows for audit, and returning separate counts
   (`found` / `newly_deactivated` / `already_inactive` +
   `alias_found` / `alias_newly_deactivated` /
   `alias_already_inactive`). State transitions: exercise
   active->inactive (name claim deliberately SURVIVES — the
   pre-existing non-partial `exercises (user_id, lower(name))`
   unique index means an inactive exercise already reserves its name
   today; mirroring that is consistency, not a gap); alias
   active->inactive (claim released); re-delivery after rollback is
   a no-op (logical idempotency key still matches); reactivation is
   a future explicit operation. Alias lookup contract: active
   aliases resolve to active exercises only.
4. **64-bit advisory lock (finding 4):** both functions now use
   `pg_advisory_xact_lock(hashtextextended(v_uid::text, 8231))`
   (identical derivation). Hash collisions between different users
   are theoretically possible: the safety property is SERIALIZATION
   (a colliding pair merely serializes); per-user separation is
   best-effort; unique constraints remain the correctness backstop.

**Security review (all six DEFINER functions):** fixed
`search_path = public, pg_temp`; all object references
schema-qualified; the four claim-trigger helpers are REVOKEd from
PUBLIC, anon, AND authenticated (not directly callable); the two
callable functions are REVOKEd from PUBLIC/anon and granted EXECUTE
to authenticated only; identity derives solely from `auth.uid()`;
no user-id argument anywhere; catalog tables remain closed to
anon/authenticated; tenant alias SELECT remains owner-scoped via the
single RLS policy.

**Static verification:** `scripts/verify-exlib1b2.ts` extended for
Revision B (results in the phase report).

## Migration 023 — Revision C — SUPERSEDED — DO NOT APPLY

Revision C
(`5923075e67392d5d63db949ead11162a4400b1aa8a62be20b823f227b415ec63`):
SUPERSEDED — DO NOT APPLY. Review found an alias lifecycle
consistency gap: rolling back an exercise's own run (or manually
deactivating an exercise) could leave ACTIVE aliases — later-run or
user-authored — attached to an INACTIVE exercise, violating the
contract that active aliases resolve only to active exercises.
Closed by Revision D below. Revision C was 43,502 bytes; its record
is retained verbatim below for audit. Also still superseded — DO NOT
APPLY: Revision B `730899c7...bf13c37`; Revision A
`944c2186...699dee232`; original `8c90b889...4e50af6a`.

**Changes vs Revision B (all Revision A/B protections retained):**

1. **Pre-existing name index in the allowlist (finding 1).** The
   committed name was resolved from migration 003 (never renamed by
   004-022): `exercises_user_name_unique_idx` on
   `exercises (user_id, lower(name))`, NOT partial. It joins the
   exercise-block allowlist mapped ONLY to `skipped_name_collision`.
   The SQL now carries a STATIC COLLISION PROOF enumerating the
   complete expected-collision set for the exercise+anatomy
   subtransaction — exactly `exercises_user_name_unique_idx`,
   `exercise_name_claims_pkey`, and
   `exercises_user_catalog_logical_unique_idx` — and shows every
   other reachable unique constraint (`exercises_pkey` /
   `exercises_user_id_id_unique` on generated UUIDs;
   `exercise_muscles` keys fed from a fresh exercise id and
   `exercise_catalog_muscles_unique`-deduplicated source rows) is a
   defect that RAISES. A user who already owns a candidate's name
   (active OR inactive — the index is not partial) produces an
   honest per-candidate skip, never an abort.
2. **Delivered-alias provenance and lifecycle (finding 2).**
   `exercise_aliases` gains `import_run_id UUID REFERENCES
   exercise_catalog_import_runs(id) ON DELETE RESTRICT` alongside
   the existing `catalog_alias_id` RESTRICT FK — every delivered
   alias immutably records WHAT catalog alias it delivers and WHICH
   run delivered it. Both are immutable to clients: `authenticated`
   holds SELECT-only on `exercise_aliases` (no UPDATE grant on any
   column). Alias idempotency is now DECLARATIVE and independent of
   the active-name partial index: the new partial unique
   `exercise_aliases_user_catalog_alias_unique_idx` on
   `(user_id, catalog_alias_id) WHERE catalog_alias_id IS NOT NULL`
   admits at most one tenant row per catalog alias per user, active
   OR inactive — retries can never create duplicate inactive audit
   rows. LATER-RUN POLICY (explicit): a later approved run MAY add
   newly approved catalog aliases to an already-delivered exercise;
   the delivery loop no longer short-circuits on
   `skipped_already_delivered` but fetches the existing exercise id
   and delivers this run's new aliases against it, carrying the
   LATER run's `import_run_id` and reported separately as
   `alias_added_to_existing` (never mixed into `alias_inserted`).
   An alias whose catalog identity already has its tenant row —
   active or rolled-back-inactive — is a deterministic
   `alias_already_delivered` skip; reactivation stays an explicit
   future operation.
3. **Catalog claim release concurrency (finding 3).** Revision C
   PROHIBITS multiple active bearers per normalized claim instead of
   re-checking at release time: `exercise_catalog_active_name_unique_idx`
   allows one active snapshot per name,
   `exercise_catalog_aliases_unique_idx` allows one alias row per
   name, and the claims PK bars a canonical bearer and an alias
   bearer from coexisting — so the departing bearer is provably the
   claim's ONLY bearer and the release DELETE is UNCONDITIONAL. The
   Revision B `AND NOT EXISTS (... e.id <> OLD.id)` check-then-delete
   re-check (a race window under concurrent rename/deactivate of
   sibling snapshots, and dead code besides) is REMOVED. A new
   read-only `exlib_verify_catalog_claims()` (SECURITY INVOKER,
   schema-qualified references, REVOKEd from PUBLIC/anon/
   authenticated, no EXECUTE grant) returns `orphaned_claims` and
   `unclaimed_bearers` — both zero proves the bidirectional
   exactly-one-bearer invariant. The tenant claims are NOT
   susceptible to the analogous race for the same structural reason:
   the pre-existing non-partial `exercises_user_name_unique_idx`,
   the partial active-alias unique index, and the tenant claims PK
   `(user_id, normalized_name)` each admit at most one active bearer
   per user and name, and the tenant claim triggers release only the
   departing row's own claim.
4. **Stable rollback result contract (finding 4).** Rollback aliases
   are keyed by RUN PROVENANCE (`a.import_run_id = v_run.id`), not
   exercise linkage: rolling back a run deactivates precisely that
   run's aliases even when they sit on an EARLIER run's exercise,
   and leaves other runs' aliases and user-authored aliases
   (`import_run_id IS NULL`) untouched. The result schema is exactly
   six counters plus `run_key`: `found` / `newly_deactivated` /
   `already_inactive` (the run's exercises) and `alias_found` /
   `alias_newly_deactivated` / `alias_already_inactive` (the run's
   aliases by provenance).

**Delivery state transitions (Revision C):**

| Candidate state before delivery | Exercise outcome | Alias outcome (per catalog alias of the logical) |
|---|---|---|
| Not delivered, name free | insert (`inserted`) | insert with this run's provenance (`alias_inserted`), unless claim collision (`alias_skipped_collision`) |
| Not delivered, user already owns the name (active or inactive; `exercises_user_name_unique_idx` / `exercise_name_claims_pkey`) | skip (`skipped_name_collision` + name in `collision_names`) | none — no delivered exercise to attach to |
| Already delivered (pre-check or `exercises_user_catalog_logical_unique_idx` race) | skip (`skipped_already_delivered`) | NEW catalog aliases insert with THIS run's provenance (`alias_added_to_existing`); aliases whose catalog identity already has a tenant row, active or inactive, skip (`alias_already_delivered`); claim collisions skip (`alias_skipped_collision`) |
| Any other unique violation | ABORT (RAISE — entire delivery rolls back) | ABORT |

**Rollback state transitions (Revision C):**

| Row state before rollback of run R | After rollback of run R |
|---|---|
| Exercise delivered by R, active | inactive (`newly_deactivated`); name claim deliberately survives (non-partial index semantics) |
| Exercise delivered by R, already inactive | unchanged (`already_inactive`) |
| Alias with `import_run_id = R`, active (on R's OR an earlier run's exercise) | inactive (`alias_newly_deactivated`); active claim released by trigger |
| Alias with `import_run_id = R`, already inactive | unchanged (`alias_already_inactive`); no duplicate audit row possible (declarative idempotency key) |
| Alias of another run on R's exercise | UNTOUCHED (surfaces in that run's own rollback) |
| User-authored alias (`import_run_id IS NULL`) / any unrelated row | UNTOUCHED |

**Security review delta:** the six SECURITY DEFINER functions are
unchanged in identity and discipline (fixed `search_path`,
schema-qualified, client-revoked helpers, `auth.uid()`-only callable
pair). The new `exlib_verify_catalog_claims()` is deliberately
SECURITY INVOKER (it grants nothing and reads closed tables only for
maintenance contexts that already hold access), uses only
schema-qualified references, and is REVOKEd from every client role
with no EXECUTE grant.

**Static verification:** `scripts/verify-exlib1b2.ts` extended for
Revision C (new section M; revised checks A3, G3b, G5, H1, L4 are
labeled `REVISED (EXLIB-1B2 Revision C, finding N)` inline; results
in the phase report).

## Migration 023 — Revision D — SUPERSEDED — DO NOT APPLY

Revision D
(`4d27e0e79693d396b75e3a8a8db09567f29e7c2e4f9c44d3756fe5d58a08de22`):
SUPERSEDED — DO NOT APPLY. Review found three blocking findings —
run contents were not bound/frozen (any approved run could deliver
later-approved catalog content), approval/reviewer identities and
rationales accepted empty or whitespace-only values at the CHECK
boundary, and catalog snapshot/alias content (including logical_id)
was mutable after insertion, which could strand claim ownership and
rewrite an approved run's contents. Closed by Revision E below.
Revision D was 53,909 bytes; its record is retained verbatim below
for audit, and `docs/exlib1b1-migration-023-revision-d-review-copy.sql`
remains its byte-exact historical artifact. Also still superseded —
DO NOT APPLY: Revision C `5923075e...a12e153`; Revision B
`730899c7...bf13c37`; Revision A `944c2186...699dee232`; original
`8c90b889...4e50af6a`.

**Changes vs Revision C (every A/B/C protection retained):**

1. **Dependent alias lifecycle, database-enforced (finding 1).** New
   section 9B. `exlib_deactivate_exercise_aliases()` (SECURITY
   DEFINER, fixed `search_path`, schema-qualified, REVOKEd from
   PUBLIC/anon/authenticated, scope solely from the transitioning
   row — no caller-controlled user id) fires from the new
   `exercises_dependent_alias_trigger` (`AFTER UPDATE OF is_active
   ON exercises`): any true -> false transition deactivates every
   ACTIVE alias attached to that exercise. Rows and provenance are
   preserved (the function sets ONLY `is_active`); active namespace
   claims are released by the existing alias claim trigger. DEFINER
   rights are load-bearing: the product PATCH route's authenticated
   role holds no `exercise_aliases` write grant, yet its
   deactivations must cascade. Covers catalog rollback, the PATCH
   route, and every future authorized path — no route or function
   performs a second update.
2. **Provenance-precise rollback reporting (finding 2).** DIRECT
   aliases (delivered by the run, `a.import_run_id = run id`,
   wherever attached) keep `alias_found` /
   `alias_newly_deactivated` / `alias_already_inactive`. DEPENDENT
   aliases (other runs' or user-authored rows on an exercise this
   run delivered, deactivated by the cascade) are counted
   separately as `alias_dependent_deactivated` and are never
   attributed to the run's deliveries. Exactness argument: the
   run's still-active exercises are locked `FOR UPDATE` before the
   dependent count; clients hold no `exercise_aliases` write grant;
   every other DEFINER writer serializes on the same per-user
   advisory lock — so the pre-counted set is precisely what the
   cascade deactivates.
3. **Alias delivery blocked for inactive targets (finding 3).** The
   delivery loop reads `e.is_active` with the target id (both the
   pre-check and the raced re-select). An inactive already-delivered
   target inserts NO aliases: not-yet-delivered aliases report the
   new deterministic `alias_skipped_inactive_exercise`;
   already-delivered ones keep `alias_already_delivered`. An
   active-but-nonresolving alias can never be created; retries are
   STATE-idempotent — no insert ever occurs against an inactive
   target, so no duplicate rows or repeated mutations; each
   attempt's counters describe its dispositions against current
   state and are not guaranteed identical across attempts.
4. **Manual deactivation/reactivation semantics (finding 4).**
   Pinned in SQL comments and here: manual PATCH deactivation
   cascades exactly like rollback (claims released); reactivating
   the exercise does NOT silently reactivate old aliases (the
   trigger acts only on the true -> false edge); alias reactivation
   remains an explicit future reviewed operation; inactive audit
   rows and immutable provenance are preserved; the declarative
   catalog-alias identity key prevents retries from creating
   replacement inactive rows.
5. **Lookup safety proven (finding 5).** The future alias lookup
   contract requires BOTH `exercise_aliases.is_active = true` AND
   target `exercises.is_active = true`. New read-only
   `exlib_verify_alias_lifecycle()` (SECURITY INVOKER,
   schema-qualified, REVOKEd from every client role, no EXECUTE
   grant) returns `active_aliases_on_inactive_exercises` — zero
   proves the invariant. With the cascade (D1) and the inactive-
   target block (D3), no code path can create a violating row.
6. **Deletion behavior reconciled (finding 6).** Audit of the
   committed DELETE route
   (`src/app/api/exercises/[id]/route.ts`): it pre-checks only
   `workout_exercises` references (409 "This exercise has workout
   history. Deactivate it instead of deleting."), then physically
   deletes the user's row; `workout_routine_exercises`' RESTRICT FK
   is the uncovered backstop (a referenced routine surfaces as a
   500). After 023, deleting a user-created exercise cascades its
   own alias rows (composite FK) and the claim triggers release the
   freed names — TODAY'S BEHAVIOR, UNCHANGED. For a DELIVERED
   exercise, physical deletion would cascade-destroy delivered alias
   audit rows and provenance AND free the logical idempotency key,
   letting a later run silently re-create the exercise. Whether that
   is ever acceptable is an UNRESOLVED PRODUCT DECISION — not made
   here. Migration 023 is fail-closed around it: new
   `exlib_block_delivered_exercise_delete()` +
   `exercises_delivered_delete_gate_trigger` (BEFORE DELETE) reject
   deletion of any row carrying catalog provenance. No delivered
   row can exist before an approved run, so current product
   behavior is not changed by this gate.

**Delivery result schema (Revision D):** `run_key`, `eligible`,
`inserted`, `skipped_already_delivered`, `skipped_name_collision`,
`collision_names`, `alias_inserted`, `alias_added_to_existing`,
`alias_already_delivered`, `alias_skipped_inactive_exercise`,
`alias_skipped_collision`, `inserted_catalog_logical_ids`.

**Rollback result schema (Revision D):** `run_key`, `found`,
`newly_deactivated`, `already_inactive`, `alias_found`,
`alias_newly_deactivated`, `alias_already_inactive`,
`alias_dependent_deactivated`.

**Constraint-name allowlist (retained from Revision C, unchanged):**

| Constraint (block) | Counter |
|---|---|
| `exercises_user_name_unique_idx` (exercise) | `skipped_name_collision` |
| `exercise_name_claims_pkey` (exercise) | `skipped_name_collision` |
| `exercises_user_catalog_logical_unique_idx` (exercise) | `skipped_already_delivered` |
| `exercise_aliases_user_catalog_alias_unique_idx` (alias) | `alias_already_delivered` |
| `exercise_name_claims_pkey` (alias) | `alias_skipped_collision` |
| `exercise_aliases_user_alias_unique_idx` (alias) | `alias_skipped_collision` |
| any other constraint | `RAISE;` — delivery aborts |

(`alias_skipped_inactive_exercise` is a deterministic pre-insert
disposition, not a constraint mapping: no insert is attempted
against an inactive target.)

**State-transition matrix (Revision D).** E = exercise delivered by
run A; B1 = alias delivered by run B onto E.

| Scenario | Exercises | Direct aliases | Dependent aliases |
|---|---|---|---|
| original-run rollback (rollback A; no later runs) | E active -> inactive (`newly_deactivated`) | A's aliases -> inactive (`alias_newly_deactivated`); claims released | user-authored aliases on E -> inactive (`alias_dependent_deactivated`) |
| later alias-only run rollback (rollback B; E stays active) | none of B's (B delivered no exercises): `found` 0 | B1 -> inactive (`alias_newly_deactivated`); claim released | 0 — no exercise transitions, cascade does not fire |
| original-run rollback after later aliases (rollback A while B1 active) | E -> inactive (`newly_deactivated`) | A's own aliases (`alias_newly_deactivated`) | B1 -> inactive via cascade (`alias_dependent_deactivated`) — counted for A's rollback, never as A's delivery; B's later rollback then reports B1 as `alias_already_inactive` |
| manual exercise deactivation (product PATCH `is_active: false`) | E -> inactive (route-visible; decision log unchanged) | n/a (no run context) | ALL active aliases on E -> inactive via cascade; claims released |
| inactive exercise encountered by a later run (deliver run C targeting inactive E) | `skipped_already_delivered` | no inserts: new aliases -> `alias_skipped_inactive_exercise`; already-delivered -> `alias_already_delivered` | none |
| exercise reactivation (PATCH `is_active: true`) | E -> active | aliases STAY inactive (no silent revival) | none |

Retry after every scenario produces the same durable database
state: no duplicate rows, no repeated mutations. The logical
idempotency key, the catalog-alias identity key, and the
`is_active` guards make re-execution state-idempotent — a retried
delivery inserts nothing already delivered, and a retried rollback
deactivates nothing already inactive. Disposition counters are NOT
claimed to be identical across attempts: rows a first attempt
inserted or deactivated report as already-delivered /
already-inactive on the retry (e.g. `inserted` N then 0 with
`skipped_already_delivered` N; `alias_newly_deactivated` N then 0
with `alias_already_inactive` N; `alias_dependent_deactivated`
drops to 0 once the cascade has run), and counts can also shift
when other authorized activity changes state between attempts. Each
attempt's counters honestly describe that attempt's dispositions;
the invariant is the state, not the numbers.

**Security review delta:** now EIGHT SECURITY DEFINER functions (the
six from Revision B/C plus `exlib_deactivate_exercise_aliases` and
`exlib_block_delivered_exercise_delete`), all with fixed
`search_path = public, pg_temp`, schema-qualified references, and
client-role revocation for the non-callable helpers; the callable
pair is unchanged (`auth.uid()`-only, EXECUTE granted to
authenticated only — still exactly 2 grants). The two verify
functions (`exlib_verify_catalog_claims`,
`exlib_verify_alias_lifecycle`) are deliberately SECURITY INVOKER,
schema-qualified, REVOKEd from every client role, with no EXECUTE
grant.

**Static verification:** `scripts/verify-exlib1b2.ts` extended for
Revision D (new section O; revised checks A3, B4, G5, H2, L8, M7,
M8, M11 and the `triggerFns` slice boundary are labeled
`REVISED (EXLIB-1B2 Revision D, ...)` inline; results in the phase
report).

## Migration 023 — Revision E — REJECTED — SUPERSEDED — DO NOT APPLY

Revision E
(`8b155d4709c595b7ea15f847eaf7d9bac6c893696d71bf8ccc8e7954d615df16`):
REJECTED — SUPERSEDED — DO NOT APPLY. The review verified the exact
artifact at 65,288 bytes and rejected it for three approval-binding
defects: run membership was not PERMANENTLY sealed (an approved run
could be unapproved, edited, and reapproved on old evidence, with an
approval/edit race besides), the deliverable set could EXPAND after
approval (delivery filtered members by current state, so a member
pending or inactive at approval time could later become deliverable
under old evidence), and anatomy sealing was reversible (a snapshot
could return to pending, reopen its anatomy, and be reapproved).
Closed by Revision F below. Revision E's record is retained verbatim
below for audit, and
`docs/exlib1b1-migration-023-revision-e-review-copy.sql` remains its
byte-exact historical artifact. Also still superseded — DO NOT
APPLY: Revision D `4d27e0e7...08de22`; Revision C
`5923075e...a12e153`; Revision B `730899c7...bf13c37`; Revision A
`944c2186...699dee232`; original `8c90b889...4e50af6a`.

**Changes vs Revision D (every accepted D lifecycle, rollback,
collision, grant, and security behavior retained):**

1. **Bound, frozen run membership (finding 1).** New closed table
   `exercise_catalog_run_items` (new section 5B) binds each run to
   the exact catalog snapshots and catalog aliases it may deliver:
   one kind per row (`CHECK (catalog_id IS NULL) <>
   (catalog_alias_id IS NULL)`), RESTRICT FKs, per-run uniqueness on
   each member kind. `exlib_freeze_run_membership()` (BEFORE
   INSERT/UPDATE/DELETE) makes membership rows immutable and blocks
   add/remove while the run is approved — membership editing and
   deliverability are mutually exclusive: revoking approval reopens
   editing but delivery requires `approved_for_delivery = true`.
   BOTH delivery loops now join the membership
   (`ri.run_id = v_run.id`); the run's anatomy follows its member
   snapshots, which are immutable and sealed (see finding 3). An old
   approved run therefore cannot deliver later-added or
   later-modified content. Later-run alias delivery is preserved
   and stays approval-gated: an alias-only run delivers exactly its
   own approved alias members in the unified alias phase, resolving
   targets by logical identity.
2. **Non-blank approval/review identities (finding 2).** The runs
   approval CHECK now requires `char_length(btrim(x)) > 0` (with
   the explicit `IS NOT NULL` guards retained so no OR branch can
   pass on an unknown result) for `product_approved_by`,
   `legal_approved_by`, and `approval_rationale`; the catalog
   review CHECK does the same for `reviewed_by` and
   `review_rationale`. Empty and whitespace-only values fail at the
   database boundary.
3. **Immutable catalog content (finding 3, immutable-snapshots
   option).** `exlib_freeze_catalog_snapshot()` (BEFORE UPDATE on
   `exercise_catalog`) raises on any change to `logical_id`,
   `canonical_name`, classification (category/primary_muscle/
   equipment/laterality/tracking_mode), provenance (source_url/
   source_page/retrieved_at/import_confidence), `catalog_version`,
   or `created_at` — corrections are NEW version rows. Only the
   review workflow columns, `is_active`, and `updated_at` stay
   mutable, and those can only gate a member OUT of delivery, never
   alter or add content. `exlib_freeze_catalog_anatomy()` makes
   anatomy rows immutable and seals a snapshot's anatomy set once
   it leaves pending review. `exlib_freeze_catalog_alias()` makes
   catalog alias rows fully immutable (corrections: delete while
   unreferenced — claim released by trigger, RESTRICT FKs block
   once referenced — then insert anew). Because `logical_id` and
   the claimed text can never drift under the claim triggers,
   catalog claim ownership can never become stale through
   `logical_id` mutation; the existing claim-trigger rename paths
   remain as defense in depth.
4. **Alias SELECT policy (finding 4).** Now
   `TO authenticated USING ((SELECT auth.uid()) = user_id)` —
   explicit role targeting, initplan-stable form; still the single
   policy in the migration, still SELECT-only.

**Delivery result schema (Revision E):** `run_key`, `eligible`,
`inserted`, `skipped_already_delivered`, `skipped_name_collision`,
`collision_names`, `alias_inserted`, `alias_added_to_existing`,
`alias_already_delivered`, `alias_skipped_no_exercise`,
`alias_skipped_inactive_exercise`, `alias_skipped_collision`,
`inserted_catalog_logical_ids`. The one addition,
`alias_skipped_no_exercise`, reports alias members whose logical has
no delivered exercise for this user (never delivered here, or its
exercise member was collision-skipped) — in Revision D those aliases
were silently unattempted; now they are counted. `eligible` now
counts the run's exercise members passing the row gates.

**Rollback result schema:** unchanged from Revision D (`run_key` +
seven counters); rollback behavior is untouched by Revision E.

**Constraint-name allowlist:** retained from Revision C/D unchanged
(both blocks, same counters, unknown constraints re-raise).
`alias_skipped_no_exercise` and `alias_skipped_inactive_exercise`
are deterministic pre-insert dispositions, not constraint mappings.

**Security review delta:** now TWELVE SECURITY DEFINER functions —
the eight from Revision D plus the four freeze helpers
(`exlib_freeze_catalog_snapshot`, `exlib_freeze_catalog_anatomy`,
`exlib_freeze_catalog_alias`, `exlib_freeze_run_membership`), all
fixed `search_path = public, pg_temp`, schema-qualified, REVOKEd
from PUBLIC/anon/authenticated, none callable by clients, none
taking a caller-controlled user id. The callable pair and its two
EXECUTE grants are unchanged. `exercise_catalog_run_items` joins
the closed-table set: RLS enabled, zero policies, REVOKE ALL from
every client role. The two verify functions remain SECURITY
INVOKER and client-revoked.

**Static verification:** `scripts/verify-exlib1b2.ts` extended for
Revision E (new section P with the six required fail-closed proofs;
revised checks A3, B1, C1, C2, C3, F5, G3b, I1, I2, J2, L8, M4, M7,
O4, O8, O10, O11 are labeled `REVISED (EXLIB-1B2 Revision E, ...)`
inline; results in the phase report).

## Migration 023 — Revision F — REJECTED — SUPERSEDED — DO NOT APPLY

Revision F
(`77ddadff1f3cc8a5b718d82432e912280ad5f1504ca612ddf2f65e3ce65ca00b`):
REJECTED — SUPERSEDED — DO NOT APPLY. The review verified the exact
artifact at 83,969 bytes, confirmed the run-sealing and membership
findings closed, and rejected it for two remaining blockers: the
anatomy trigger read the parent snapshot's review_status WITHOUT
locking that row (a concurrent anatomy INSERT/DELETE could observe
pending while another transaction approved the snapshot, letting
anatomy land outside the reviewed set), and the review-evidence
contract permitted stale/misattributed audit (a pending snapshot
could be inserted with audit fields set, and a status flip such as
approved -> rejected could reuse the prior decision's reviewer,
timestamp, and rationale). Closed by Revision G below. Revision F's
record is retained verbatim below for audit, and
`docs/exlib1b1-migration-023-revision-f-review-copy.sql` remains its
byte-exact historical artifact. Also still superseded — DO NOT
APPLY: Revision E (REJECTED) `8b155d47...15df16`; Revision D
`4d27e0e7...08de22`; Revision C `5923075e...a12e153`; Revision B
`730899c7...bf13c37`; Revision A `944c2186...699dee232`; original
`8c90b889...4e50af6a`.

**Object/function/trigger/policy/grant delta from Revision E:**

- `exercise_catalog_import_runs` gains `sealed_at` (permanent seal)
  and `revoked_at` (one-way shutdown) columns and two CHECKs:
  `exercise_catalog_import_runs_seal_coupling_chk`
  (`approved_for_delivery = true` if and only if
  `sealed_at IS NOT NULL`) and
  `exercise_catalog_import_runs_revoke_after_seal_chk`
  (`revoked_at` only on sealed runs).
- New trigger function `exlib_freeze_run_row()` + trigger
  `exercise_catalog_import_runs_freeze_trigger`
  (BEFORE INSERT OR UPDATE): runs are born unsealed/unapproved/
  unrevoked; the ONLY approval path is the single validated
  unsealed -> sealed transition (evidence + membership validated in
  the same statement); once sealed, `run_key`, `dry_run`,
  `approved_for_delivery`, both approver identities and timestamps,
  the rationale, `sealed_at`, and `created_at` are immutable;
  `revoked_at` is one-way; only `started_at`, `completed_at`, and
  `result_counts` remain mutable (documented operational fields).
- New controlled operations (SECURITY DEFINER, fixed search_path,
  schema-qualified, REVOKEd from PUBLIC/anon/authenticated, NO
  EXECUTE grant, no user identity): `exlib_approve_and_seal_run(TEXT)`
  (locks the run FOR UPDATE, performs the sealing UPDATE that the
  trigger fully revalidates, returns member counts) and
  `exlib_revoke_run_delivery(TEXT)` (one-way revocation of a sealed
  run; idempotent).
- `exlib_freeze_run_membership()` reworked: keys EXCLUSIVELY on
  `sealed_at` (never `approved_for_delivery`/`revoked_at`), locks
  the parent run row FOR UPDATE (same lock as approval), and its
  sealed-run message states membership is PERMANENT.
- `exlib_freeze_catalog_snapshot()` extended to BEFORE INSERT OR
  UPDATE: snapshots born pending + active; one-way review machine
  (`pending -> approved|revised|rejected`;
  `approved -> revised|rejected`; `revised`/`rejected` terminal;
  never back to `pending`; no re-approval); review-audit fields
  change only with an allowed transition; `is_active` one-way
  (true -> false).
- Delivery run gate now requires `sealed_at IS NOT NULL AND
  revoked_at IS NULL` in addition to
  `approved_for_delivery = true AND dry_run = false`.
- Section 14 adds three REVOKEs (`exlib_freeze_run_row()`,
  `exlib_approve_and_seal_run(TEXT)`,
  `exlib_revoke_run_delivery(TEXT)`). Policies and table grants are
  unchanged from Revision E; GRANT EXECUTE remains exactly the two
  tenant-callable functions.
- Unchanged: both delivery loops' membership scoping, the delivery
  and rollback result schemas, the constraint-name allowlists, the
  advisory-lock derivation, the dependent-alias lifecycle, the
  delivered-row deletion gate, and every tenant-side contract.

**How each finding is closed:**

1. **Permanent sealing (finding 1).** The first valid approval sets
   the immutable `sealed_at`; the membership freeze keys only on it,
   so neither `approved_for_delivery = false`, revocation, nor any
   other state can ever reopen membership — changed membership
   requires a NEW run. Membership INSERT/DELETE takes the parent run
   row lock FOR UPDATE; the approval transition holds the same row
   lock (explicitly in `exlib_approve_and_seal_run`, and inherently
   in the sealing UPDATE), closing the race. Approval-bound fields
   and `run_key` are frozen by the sealed branch of
   `exlib_freeze_run_row()`; the two CHECKs make approval and seal
   one state. Emergency shutdown is the separate one-way
   `revoked_at`, which disables delivery and reopens nothing.
2. **No post-approval expansion (finding 2).** Sealing validates
   that EVERY exercise member is `approved`, `is_active`, and fully
   review-audited (non-blank reviewer + rationale) and that the
   membership is non-empty — the evidence binds exactly the
   deliverable set. Afterward no member can newly become
   deliverable: snapshots are born pending, `review_status` can
   never return to `pending` or re-approve, and `is_active` can
   never return to true — so the delivery-time gates are provably
   SHRINK-ONLY. Withdrawal (deactivate/reject) removes a member from
   future delivery of every sealed run; restoration requires a new
   catalog version row and a new sealed run. Alias-only later runs
   still work, each under its own sealed membership and its own
   product/legal approval. Disabling an already-delivered snapshot
   is pinned: delivered tenant rows are user-owned copies with
   immutable provenance and are never touched by catalog-side
   disabling; per-user run rollback (and the user's own controls)
   remain the only tenant deactivation paths, and re-delivery stays
   an idempotent skip.
3. **Irreversible anatomy sealing (finding 3).** `review_status`
   can never return to `pending`, so the anatomy gate (INSERT/DELETE
   only while pending; UPDATE never) is permanent from the first
   transition out of pending, regardless of later status changes.
   Review-audit fields cannot be rewritten without an allowed
   transition, preventing status cycling from rewriting a recorded
   decision. Corrections are new catalog version rows with their own
   anatomy and review; `approved -> rejected` and deactivation stay
   available as operational disable paths that never reopen content.

**State-transition table — run membership / approval / delivery
disablement (Revision F):**

| From | Action | Result |
|---|---|---|
| born (unsealed, unapproved, unrevoked) | INSERT with seal/approval/revocation preset | REJECTED (born-unsealed trigger + CHECKs) |
| unsealed | membership INSERT/DELETE | allowed; takes parent run row lock FOR UPDATE |
| unsealed | membership UPDATE | REJECTED (rows immutable) |
| unsealed | edit run_key / evidence / operational fields | allowed (pre-approval drafting) |
| unsealed | revoke | REJECTED (only sealed runs) |
| unsealed | `exlib_approve_and_seal_run` with complete non-blank evidence AND non-empty membership AND every exercise member approved+active+audited | SEALED: `sealed_at` set + `approved_for_delivery = true` atomically; membership and approval-bound fields frozen forever |
| unsealed | same, but any validation fails | REJECTED; run stays unsealed and undeliverable |
| sealed | membership INSERT/UPDATE/DELETE | REJECTED — PERMANENT (regardless of any later state) |
| sealed | edit run_key/dry_run/evidence/seal/approved_for_delivery/created_at | REJECTED (immutable) |
| sealed | edit started_at/completed_at/result_counts | allowed (documented operational fields) |
| sealed | `exlib_revoke_run_delivery` | `revoked_at` set once; delivery refuses the run forever; NOTHING reopens |
| sealed+revoked | any un-revoke / re-seal / membership edit | REJECTED |
| sealed (any) | delivery call | runs only if sealed, approved, `dry_run = false`, and NOT revoked |

**State-transition table — catalog review + anatomy sealing
(Revision F):**

| From | Action | Result |
|---|---|---|
| (new snapshot) | INSERT | must be `pending` + `is_active = true`; anatomy INSERT open |
| pending | anatomy INSERT/DELETE | allowed (UPDATE never) |
| pending | -> approved / revised / rejected (with non-blank audit) | allowed; anatomy PERMANENTLY sealed at this first transition |
| approved | -> revised / rejected (with its own audit) | allowed (operational disable); content/anatomy stay sealed |
| approved/revised/rejected | -> pending | REJECTED (one-way machine) |
| revised / rejected | -> anything | REJECTED (terminal) |
| any non-pending | anatomy INSERT/UPDATE/DELETE | REJECTED forever |
| any | audit-field change without an allowed status transition | REJECTED |
| active | deactivate (`is_active` -> false) | allowed (shrink-only withdrawal) |
| inactive | reactivate | REJECTED — new catalog version row + new sealed run required |
| any | content/identity/provenance/version column change | REJECTED (Revision E freeze, retained) |

**Delivery and rollback state transitions:** unchanged from the
Revision D/E tables (retained above) except the run gate: delivery
now requires the requested run to be SEALED, approved, non-dry, and
NOT revoked; every member disposition, counter, and the rollback
contract are byte-for-byte identical to Revision E.

**Security and concurrency re-audit (Revision F):** fifteen
SECURITY DEFINER functions, all with fixed
`search_path = public, pg_temp` and schema-qualified references; no
function takes a caller-supplied user identity (the two
tenant-callable functions derive identity solely from `auth.uid()`;
the run-lifecycle operations take only a run key and are not
client-callable); PUBLIC and anon hold no EXECUTE anywhere; the
eleven trigger/verify/lifecycle helpers are REVOKEd from
authenticated as well (13 niladic revokes + the 2 run-lifecycle TEXT
revokes); only `deliver_catalog_exercises` and
`rollback_catalog_delivery` are granted to authenticated; catalog
and run tables remain closed (RLS enabled, zero policies) except the
approved owner-scoped alias SELECT policy
(`TO authenticated USING ((SELECT auth.uid()) = user_id)`); no
`service_role` anywhere. Constraint-name allowlists, unknown
unique_violation re-raise, the 64-bit advisory-lock derivation,
alias-only later-run delivery, rollback provenance and its
seven-counter contract, delivered-row deletion protection, tenant
and global claim invariants, and the column-level `exercises` grants
are all unchanged and re-verified by the existing suite sections.
Migration 023 still inserts no data rows and approves nothing — the
only INSERT remains the derived per-user name-claims backfill.

**Static verification:** `scripts/verify-exlib1b2.ts` extended for
Revision F (new section Q with the thirteen required fail-closed
regression proofs; revised checks A3, B4, I3, I4, L8, O10, O11, P2,
P3, P5, P8 are labeled `REVISED (EXLIB-1B2 Revision F, ...)` inline;
results in the phase report).

## Migration 023 — REVISION G — DRAFT — NOT APPLIED

**Joseph must NOT apply ANY version of migration 023 until ChatGPT
reviews Revision G line by line and explicitly approves the exact
fingerprint below.**

- File: `supabase/migrations/023_exlib_catalog_and_delivery_contract.sql`
- Review artifact (byte-identical mechanical copy for line-by-line
  review; the migrations file remains the single authoritative
  draft): `docs/exlib1b1-migration-023-revision-g-review-copy.sql`
- Size: 91,382 bytes
- SHA-256:
  `7653b4c87835b0318f8a298855571ddcfe2ffef4ed00fa8e9178f252491e9f92`
- Status: **DRAFT — NOT APPLIED**. **APPROVED FOR CANDIDATE
  PREPARATION** by ChatGPT at exactly this fingerprint (91,382
  bytes, `7653b4c8...91e9f92`): approved for committing to a QA
  candidate; Joseph must NOT apply migration 023 until the candidate
  is committed, independently verified, and ChatGPT gives the
  explicit application instruction for this same fingerprint.
  Superseded — DO NOT APPLY:
  Revision F (REJECTED) `77ddadff...ca00b`; Revision E (REJECTED)
  `8b155d47...15df16`; Revision D `4d27e0e7...08de22`; Revision C
  `5923075e...a12e153`; Revision B `730899c7...bf13c37`; Revision A
  `944c2186...699dee232`; original `8c90b889...4e50af6a`.

**Exact diff from Revision F (every F protection retained):**

1. `exlib_freeze_catalog_anatomy()` (finding 1): the unlocked
   `IF EXISTS (...)` status probe is replaced by
   `SELECT c.review_status INTO v_review_status ... FOR UPDATE` on
   the parent `exercise_catalog` row BEFORE the status is evaluated,
   plus an explicit unknown-parent error. Every review-status
   transition is an UPDATE of that same row, so anatomy mutation and
   review transitions serialize on one row lock; the permanent seal
   at the first transition out of pending is unchanged.
2. `exercise_catalog_review_audit_chk` (finding 2): rewritten so a
   PENDING snapshot must have ALL THREE audit fields NULL, and a
   decided snapshot must have the complete non-blank tuple (the
   Revision E non-blank guards retained verbatim on that side).
3. `exlib_freeze_catalog_snapshot()` (finding 2): the INSERT branch
   also rejects any preset audit field; every allowed status
   transition must carry a complete, non-blank audit tuple that
   DIFFERS from the prior tuple (status-only flips such as
   `approved -> rejected` on stale approval evidence fail); the
   same-status audit-rewrite guard is retained verbatim; each
   allowed transition APPENDS one row to the new evidence log.
4. New closed table `exercise_catalog_review_events` (finding 2,
   preferred design) + `exlib_freeze_review_events()` guard trigger:
   one row per transition (`from_status`/`to_status` CHECK mirrors
   the one-way machine; non-blank reviewer/rationale CHECKs;
   RESTRICT FK — a reviewed snapshot becomes physically
   undeletable); UPDATE/DELETE always raise (append-only); INSERT
   raises unless issued from inside the snapshot trigger
   (`pg_trigger_depth() < 2` guard). The snapshot row stores only
   the CURRENT decision's evidence; the full history is the log.
5. Sections 10/11/14: RLS + REVOKE ALL for the events table; REVOKE
   for the guard function. Nothing else changed: run sealing,
   membership, delivery, rollback, claims, grants, policies, and
   both callable functions are byte-for-byte identical to F.

**Lifecycle tables (Revision G):**

Review state + audit evidence:

| From | Action | Result |
|---|---|---|
| (new) | INSERT with any audit field set | REJECTED (CHECK + trigger) |
| (new) | INSERT pending, NULL audit, active | allowed |
| pending | -> approved/revised/rejected with complete fresh tuple | allowed; one event row appended |
| pending | -> any status with missing/blank tuple | REJECTED |
| approved | -> revised/rejected with complete FRESH tuple | allowed; event appended |
| approved | -> revised/rejected reusing the prior tuple (status-only flip) | REJECTED (stale/misattributed evidence) |
| any | same-status audit rewrite | REJECTED |
| any decided | -> pending | REJECTED (one-way) |
| events log | UPDATE / DELETE / direct INSERT | REJECTED (append-only; trigger-written only) |

Anatomy locking (two-session semantics, proven live):

| Interleaving | Outcome |
|---|---|
| anatomy locks parent first; review transition arrives | transition BLOCKS; proceeds only after the anatomy transaction completes; approved set includes that anatomy |
| review transition locks parent first; anatomy arrives | anatomy BLOCKS; then sees the committed non-pending status and FAILS; approved set gains nothing |
| any anatomy write after first decision (no concurrency) | REJECTED (permanent seal) |

Run membership/approval/disablement and delivery/rollback tables:
unchanged from Revision F (retained above).

**Live concurrency + evidence proofs:**
`scripts/verify-exlib1b2-live-concurrency.sh` creates a DISPOSABLE
local PostgreSQL cluster (initdb into mktemp dir, unix socket only,
no TCP, torn down on exit — Supabase is never contacted), stubs the
pre-023 objects (auth schema, roles, minimal exercises tables),
applies the EXACT migration artifact byte-for-byte, and runs 24
executable assertions: an approved-fingerprint gate (the script
refuses to run — before initdb or any SQL execution — unless the
migration hashes to the approved Revision G SHA-256 and byte size),
plus the 15 finding-2 evidence cases (born-NULL
audit, complete/fresh tuple requirements, status-only flip failure,
same-status rewrite failure, terminal states, exact event-log
contents and ordering, append-only + trigger-context-only guards,
anatomy seal) and the two finding-1 interleavings with MEASURED
blocking (approval blocked ~2s behind an open anatomy transaction
then proceeded; late anatomy blocked ~2s behind an open approval
then failed with the seal error; anatomy row counts verified both
ways). Result: 24 passed, 0 failed on vanilla PostgreSQL 16.15.
The script is run on demand and is deliberately NOT part of the
deterministic offline battery.

**Security re-audit (Revision G):** sixteen SECURITY DEFINER
functions, all fixed `search_path = public, pg_temp`, all
schema-qualified; 14 niladic helpers + the 2 run-lifecycle
operations REVOKEd from every client role; only the two
`auth.uid()`-scoped tenant functions granted EXECUTE; no
caller-controlled tenant identity anywhere; parent-row locking now
covers the anatomy trigger, the membership trigger, and both run
lifecycle operations; no broad exception handlers (the only
EXCEPTION blocks remain the two constraint-name-allowlisted
unique_violation handlers in delivery); no new policy (the single
owner-scoped alias SELECT policy is unchanged); catalog/run/event
tables closed; no `service_role`; the migration still inserts no
data rows and approves nothing.

**Static verification:** `scripts/verify-exlib1b2.ts` extended for
Revision G (new section R with nine fail-closed proofs; revised
checks A3, C1, J2, L8, O10, O11, P8, Q9 are labeled
`REVISED (EXLIB-1B2 Revision G, ...)` inline; results in the phase
report).

## Deliverables and boundary

This phase adds exactly: these notes, the review ledger, and
`scripts/verify-exlib1b1.ts`, plus labeled mechanical worktree
admissions in the suites that pin documentation scope. Migration
023 was not authored; no SQL exists in this phase; nothing was
imported; no review entry was approved; the EXLIB-1A manifest and
its licensing boundary are byte-unchanged. EXLIB-1B1 stops
uncommitted on `main` for ChatGPT review.
