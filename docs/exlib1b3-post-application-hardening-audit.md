# EXLIB-1B3A — Post-application hardening audit (audit only)

**MIGRATION 024: DRAFT at review time; promoted at `f42eb43...`;
APPLIED by ChatGPT on 2026-08-24** — see the production-application
record in section 10. The migration file's internal review-status
header is preserved as historical reviewed-artifact text; this
document plus the Supabase migration history are authoritative for
applied status. Sections 1-6
are the EXLIB-1B3A audit that determined the justified scope (they
predate the draft and contain no executable SQL; their statements
about migration 024 not existing describe the audit-time starting
state). Section 7 records the EXLIB-1B3B draft authored after the
scope was approved. Nothing here changes database state or the
review ledger. The audit was revised per the EXLIB-1B3A review
correction: the search_path form is RESOLVED, the run-membership
growth model is corrected, and every parent-delete FK path is traced
under the reviewer's disposition rules.

## 1. Starting-state proof (2026-08-24)

- Branch `main`; local main = origin/main =
  `4c1f39513aa47adf8809f07e31ab98322ab0a2e9`; tag
  `exlib1b2-migration-023-application-record-stable` dereferences to
  the same commit locally and remotely; nothing staged; the worktree
  holds exactly the declared EXLIB-1B3A paths.
- Migration 023 (applied artifact) frozen at exactly 92,806 bytes,
  SHA-256
  `0991448c39a558385431c78cef6d6063df208312a3f53866756ba730066c42f2`;
  applied migrations documented as exactly 001-023 (Supabase history
  entry `20260824135804_exlib_catalog_and_delivery_contract_revision_h`).
- No migration 024 exists. Review ledger: 48/48 pending with null
  reviewer fields. No dev server running. Supabase/Vercel not
  contacted this turn.
- Repo-side content-data check: the only statement writing a catalog
  table anywhere in committed SQL or product source is the
  trigger-body event append inside the snapshot review-transition
  function (audit machinery, executes only on privileged review
  transitions; recorded post-application count = 0). No committed
  content data exists.

## 2. Current-guidance sources (retrieved 2026-08-24)

Documented guidance, kept separate from repo-specific conclusions:

1. Supabase lint 0011 `function_search_path_mutable` —
   https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable
   Detects functions without a pinned `search_path`; applies to ALL
   functions regardless of SECURITY INVOKER/DEFINER; recommends
   pinning to the empty string, forcing fully qualified references.
2. Supabase lint 0001 `unindexed_foreign_keys` —
   https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys
   INFO severity; explicitly notes small/empty tables gain nothing
   and Postgres prefers sequential scans until row counts tip the
   trade-off.
3. Supabase lint 0008 `rls_enabled_no_policy` —
   https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy
   INFO severity; zero-policy RLS is explicitly recognized as a
   deliberate deny-all pattern; an explicit rejection policy is a
   documentation option, not a requirement.
4. Supabase database functions guide —
   https://supabase.com/docs/guides/database/functions
   SECURITY INVOKER is best practice/default; SECURITY DEFINER
   functions MUST pin `search_path`; the documented best-practice
   snippet pins the empty string.
5. PostgreSQL current docs, constraints —
   https://www.postgresql.org/docs/current/ddl-constraints.html
   Foreign-key declaration does NOT auto-create referencing-side
   indexes because "this is not always needed"; such indexes matter
   chiefly when the REFERENCED table sees DELETEs or key UPDATEs
   (each such operation scans the referencing table).
6. Supabase changelog index — https://supabase.com/changelog
   Nothing recent affecting advisors, function security, or
   migration semantics (most recent entries: read-replica settings
   move 2026-08-21, backup scheduling fix 2026-08-12, extension
   version-pinning deprecation 2026-07-22 — none applicable here).

## 3. Two-function search_path audit (mechanical, from the applied
Revision H bytes)

### 3.1 public.exlib_verify_catalog_claims()

- Signature: `exlib_verify_catalog_claims()` returning
  `TABLE (orphaned_claims BIGINT, unclaimed_bearers BIGINT)`;
  LANGUAGE sql, STABLE.
- Security model: SECURITY INVOKER (no DEFINER clause) — matches
  current best-practice default.
- proconfig as expressed by the migration: NONE — no
  `search_path` setting (this is exactly what lint 0011 flags).
- References: `public.exercise_catalog`,
  `public.exercise_catalog_aliases`,
  `public.exercise_catalog_name_claims`, plus the function-local CTE
  `bearers` (not schema-resolved) and built-ins `count`, `lower`
  (resolved via `pg_catalog`, which Postgres searches implicitly
  first unless explicitly demoted).
- Schema qualification: every table reference is schema-qualified.
- Grants: REVOKEd from PUBLIC, anon, AND authenticated; no EXECUTE
  grant exists — anon/authenticated/PUBLIC cannot execute it.
- Tenant data: none — reads closed catalog tables only.
- Caller-controlled identity: none (no parameters).
- Behavior change from adding a pinned `search_path`: NONE — all
  object references are already qualified and built-ins resolve via
  the implicit `pg_catalog`-first rule.
- Conclusion: hardening is **DEFENSE-IN-DEPTH, not necessary** —
  the function is unreachable by clients, INVOKER, and fully
  qualified. Recommended for migration 024: zero behavior change and
  legitimate (not cosmetic) closure of lint 0011, which applies to
  all functions.

### 3.2 public.exlib_verify_alias_lifecycle()

- Signature: `exlib_verify_alias_lifecycle()` returning
  `TABLE (active_aliases_on_inactive_exercises BIGINT)`;
  LANGUAGE sql, STABLE.
- Security model: SECURITY INVOKER.
- proconfig as expressed by the migration: NONE (lint 0011 target).
- References: `public.exercise_aliases`, `public.exercises`
  (schema-qualified), built-in `count` via implicit `pg_catalog`.
- Grants: REVOKEd from PUBLIC, anon, AND authenticated; no grant —
  not executable by any client role.
- Tenant data: YES — it joins tenant tables across all users. Under
  SECURITY INVOKER this is safe by construction: a hypothetical
  unprivileged caller would be stopped first by the missing EXECUTE
  grant, and even then RLS on both tables would apply to them; the
  intended maintenance caller already holds table access.
- Caller-controlled identity: none.
- Behavior change from pinning `search_path`: NONE (same reasoning
  as 3.1).
- Conclusion: **DEFENSE-IN-DEPTH, not necessary; recommended for
  migration 024** with the same rationale as 3.1.

### 3.3 RESOLVED form for both functions

**Chosen form: `SET search_path = ''`** — exactly, for both
functions. Reasons: every relation reference in both bodies is
already schema-qualified; `pg_catalog` remains implicitly available
for built-ins; both functions are SECURITY INVOKER and revoked from
every client role; the empty string is the strongest current
Supabase recommendation (lint 0011 and the functions guide); and the
change is defense-in-depth plus lint closure with no intended
behavior change.

The established Revision-H house pattern `public, pg_temp` (used by
the sixteen already-pinned functions) was considered and REJECTED
for these two functions: these bodies need no schema resolution at
all, so the weaker form would keep an unnecessary resolution surface
purely for stylistic consistency. This choice is final for the 024
draft; it is not presented as an open alternative.

## 4. Complete migration-023 FK/index audit (revised)

Migration 023 declares exactly 15 foreign-key references (14 on new
objects + 3 added to `exercises`, counting the composite tenant-alias
ownership FK once; mechanically: 15 `REFERENCES` occurrences). All
are ON DELETE RESTRICT except the two tenant-alias ownership FKs
(CASCADE) — and none declares ON UPDATE actions (parents have
immutable UUID keys). `exercise_name_claims.exercise_id` and
`.alias_id` are deliberately NOT foreign keys (trigger-maintained
claims machinery) and are assessed separately in row 16.

Leading-column rule applied throughout: an index "covers" an FK only
if the FK column(s) are its LEADING columns; trailing appearances do
not count. For partial indexes the predicate must be implied by the
referential-integrity lookup (`col = value` implies
`col IS NOT NULL`, so a `WHERE col IS NOT NULL` partial index is
usable for RI lookups — but if the FK column is not leading, use
means scanning that entire partial index rather than seeking).

### 4.1 Run-membership growth model (corrected)

`exercise_catalog_run_items` is NOT small by design — it is a
cumulative, append-only audit structure:

- one row is added per EXERCISE member per run, and one row per
  ALIAS member per run, at membership-binding time;
- rows are deletable ONLY while the run is unsealed; the moment a
  run seals, its membership is PERMANENT (immutable rows; add and
  remove both raise forever, by trigger);
- sealed-run membership is durable audit history — it is never
  deleted, and sealed runs themselves are structurally undeletable
  (their membership rows RESTRICT the run row);
- every later catalog version delivered through a new run re-binds
  its members: a full-catalog run at current manifest scale binds
  roughly four hundred exercise members plus alias members in one
  run, and version upgrades, alias additions, and periodic
  re-approvals each add a further membership generation.

Classification: **potentially cumulative and unbounded** — the
schema enforces NO bound on membership rows. Growth is bounded only
by curation activity (runs times members), not by any constraint.
Every disposition below treats it accordingly; no disposition rests
on the table being small, and the prior tiny-table reasoning from
the first draft of this audit is withdrawn.

### 4.2 Parent-delete FK path traces

**A. Deleting an unreferenced `exercise_catalog_aliases` row.**
EXPLICITLY SUPPORTED by the applied contract — the documented
correction rule is "catalog aliases are immutable; corrections use
delete-while-unreferenced plus insert". Determining "unreferenced"
IS the RESTRICT check: Postgres must inspect BOTH children on every
such delete, successful or not, while holding the parent row lock:

- `exercise_aliases.catalog_alias_id` — child grows with tenant
  adoption (delivered aliases times users; unbounded). Existing
  access: the partial unique `(user_id, catalog_alias_id)` is usable
  (predicate implied) but NOT leading, so the check scans the ENTIRE
  delivered-alias partial index. Post-delivery, corrections pay that
  full scan just to receive the RESTRICT error.
- `exercise_catalog_run_items.catalog_alias_id` — child is the
  cumulative membership audit (4.1; unbounded). Existing access: the
  partial unique `(run_id, catalog_alias_id)` is usable-not-leading:
  full scan of all alias-membership rows.

Operational consequence: an unindexed RESTRICT check inside the
delete transaction extends the parent-row lock for the duration of
two growing scans and blocks the importer correction flow; the
operation is expected BEFORE delivery for any given alias, but the
tables scanned accumulate across ALL aliases and runs, so the cost
grows regardless of the target row's own state.

**B. Deleting an eligible unreferenced `exercise_catalog` snapshot.**
ALLOWED and documented by the applied contract for never-reviewed
pending rows only ("only never-reviewed pending rows without other
references can be removed" — the importer's pre-review correction
path; reviewed rows are permanently pinned by their decision
history). Children inspected on every such delete:

- `exercises.catalog_id` — NO index of any kind exists: the check is
  a FULL HEAP SCAN of the largest tenant table, which grows with
  users independently of catalog activity (every user-created and
  seeded exercise is a row). A pending snapshot can never actually
  be referenced (delivery requires an approved member of a sealed
  run), so the scan always finds nothing — but Postgres cannot know
  that without scanning.
- `exercise_catalog_run_items.catalog_id` — cumulative membership
  audit (4.1); partial unique `(run_id, catalog_id)` is
  usable-not-leading: full scan of all exercise-membership rows.
- `exercise_catalog_muscles.catalog_id` — dedicated leading index:
  indexed seek; adequate.
- `exercise_catalog_review_events.catalog_id` — dedicated leading
  index: indexed seek; adequate (and a pending snapshot has no
  events by construction).

Operational consequence: each pending-snapshot correction pays a
heap scan of `exercises` plus a membership-index scan inside its
delete transaction — unbounded lock-duration growth with adoption.

**C. Deleting an import run.** NOT a supported lifecycle operation:
sealed runs are STRUCTURALLY UNDELETABLE (permanent membership rows
RESTRICT the run forever), and an unsealed run can be deleted only
after deliberately emptying its membership while unsealed — a
deliberate, undocumented housekeeping act, not a reviewed flow;
abandoned unsealed runs are inert and may simply remain. An unsealed
run has zero deliveries (the delivery gate requires the seal), so
the RI checks on `exercises.import_run_id` and
`exercise_aliases.import_run_id` can never find rows; the scans
still execute (heap scan for `exercises`; leading
`(user_id, import_run_id)` index available for `exercise_aliases`
via user-prefix only — full partial scan for a bare run-id lookup),
but only on this unsupported, rare, privileged act.
`exercise_catalog_run_items.run_id` is leading-covered.

### 4.3 Disposition matrix (revised under the review's rules)

Rules applied: REQUIRED when a reviewed/supported parent delete path
causes an unbounded child scan (or a real query path lacks adequate
leading access) and the index cost is proportionate; DEFER when a
real path exists but current access is plausibly adequate, with an
exact measurement plan; NOT JUSTIFIED only for structural
impossibility, existing leading coverage, or no reviewed path.
"Currently empty/small" is never used as a reason — EXLIB-1C is
expected to create data.

| # | Child.column -> Parent | Action | Null | Leading index? | Real paths | Disposition | Evidence |
|---|---|---|---|---|---|---|---|
| 1 | exercise_catalog.logical_id -> exercise_catalog_logical(id) | RESTRICT | NOT NULL | YES — logical/version unique (non-partial, leading) | versioning, one-active checks | NOT JUSTIFIED | already covered by a leading non-partial index |
| 2 | exercise_catalog_muscles.catalog_id -> exercise_catalog(id) | RESTRICT | NOT NULL | YES — dedicated index + unique (catalog_id, muscle) | anatomy copy at delivery; RI on supported pending-snapshot delete | NOT JUSTIFIED | already covered leading by the dedicated catalog_id index and the (catalog_id, muscle) unique |
| 3 | exercise_catalog_aliases.logical_id -> exercise_catalog_logical(id) | RESTRICT | NOT NULL | YES — dedicated index | alias continuity | NOT JUSTIFIED | already covered leading by the dedicated logical_id index |
| 4 | exercise_catalog_name_claims.logical_id -> exercise_catalog_logical(id) | RESTRICT | NOT NULL | YES — dedicated index | claim maintenance | NOT JUSTIFIED | already covered leading by the dedicated logical_id index |
| 5 | exercise_catalog_run_items.run_id -> exercise_catalog_import_runs(id) | RESTRICT | NOT NULL | YES — dedicated index + run-leading partial uniques | both delivery loops; seal validation | NOT JUSTIFIED | already covered leading by the dedicated run_id index plus both run-leading partial uniques |
| 6 | exercise_catalog_run_items.catalog_id -> exercise_catalog(id) | RESTRICT | nullable | NO (trailing in partial unique; usable-not-seekable) | RI on the SUPPORTED pending-snapshot correction delete (trace B) | REQUIRED IN 024 | supported parent path scans the cumulative, unbounded membership audit (4.1) with no leading access; a partial leading index over exercise-member rows is importer-write-only, trivially proportionate |
| 7 | exercise_catalog_run_items.catalog_alias_id -> exercise_catalog_aliases(id) | RESTRICT | nullable | NO (trailing in partial unique; usable-not-seekable) | RI on the SUPPORTED alias delete-while-unreferenced correction (trace A) | REQUIRED IN 024 | the documented correction rule's "unreferenced" test scans the unbounded membership audit on every attempt; partial leading index is importer-write-only, proportionate |
| 8 | exercise_catalog_review_events.catalog_id -> exercise_catalog(id) | RESTRICT | NOT NULL | YES — dedicated index | decision-history reads; RI pinning reviewed snapshots | NOT JUSTIFIED | already covered leading by the dedicated catalog_id index |
| 9 | exercise_aliases.user_id -> auth.users(id) | CASCADE | NOT NULL | YES — (user_id, exercise_id) non-partial, leading user_id | every tenant path | NOT JUSTIFIED | already covered leading by the non-partial (user_id, exercise_id) index |
| 10 | exercise_aliases (user_id, exercise_id) -> exercises(user_id, id) | CASCADE | NOT NULL | YES — exact-match index | dependent-alias cascade; ownership RI | NOT JUSTIFIED | already covered exactly by the (user_id, exercise_id) index matching the composite key |
| 11 | exercise_aliases.catalog_alias_id -> exercise_catalog_aliases(id) | RESTRICT | nullable | NO leading (user-leading partial unique is usable-not-seekable for RI) | delivery idempotency pre-check exact-covered; RI on the SUPPORTED alias delete-while-unreferenced correction (trace A) | REQUIRED IN 024 | the documented correction path's referenced-check scans the entire delivered-alias partial index, which grows unboundedly with tenant adoption; a partial leading index maintained only on delivered-alias writes is proportionate |
| 12 | exercise_aliases.import_run_id -> exercise_catalog_import_runs(id) | RESTRICT | nullable | Real path (user_id, import_run_id) exactly covered leading | rollback direct pass; RI only on the UNSUPPORTED unsealed-run delete (trace C) | NOT JUSTIFIED | the only real path is exactly covered leading; run deletion is not a reviewed flow, sealed runs are structurally undeletable, and unsealed runs have zero deliveries |
| 13 | exercises.catalog_id -> exercise_catalog(id) | RESTRICT | nullable | NO index of any kind | RI on the SUPPORTED pending-snapshot correction delete (trace B); no app query filters exercises by catalog_id | REQUIRED IN 024 | the supported correction path has NO fallback at all — a full heap scan of the largest, adoption-growing tenant table inside the delete transaction; a partial leading index over delivered rows only is trivially proportionate |
| 14 | exercises.catalog_logical_id -> exercise_catalog_logical(id) | RESTRICT | nullable | Trailing in the user-leading partial unique (usable-not-seekable for RI); the REAL path (user_id, catalog_logical_id) is exactly covered | delivery pre-check exact-covered; RI on logical-row delete | NOT JUSTIFIED | no reviewed path deletes logical rows (RESTRICT children pin every used identity; orphan cleanup is not a documented flow) and the delivered-rows partial index provides a usable fallback |
| 15 | exercises.import_run_id -> exercise_catalog_import_runs(id) | RESTRICT | nullable | NO leading index; rollback path (user_id, import_run_id) served by user-leading prefix scans then filtering within one user's rows | rollback found/lock/update passes; RI only on the UNSUPPORTED unsealed-run delete (trace C) | JUSTIFIED BUT DEFER UNTIL MEASURED | real rollback path exists and per-user prefix access is plausibly adequate; exact measurement plan in section 4.4 — if it trips, the right shape is a user-leading composite mirroring the alias-side index |
| 16 | exercise_name_claims.alias_id (and .exercise_id) — NOT AN FK | n/a | nullable/NOT NULL | exercise_id has a dedicated index; alias_id none | claim triggers delete by the per-user claims PK (leading) — never by alias_id alone; no RI lookups exist because there is no constraint | NOT JUSTIFIED | not a foreign key; zero referential-integrity path; all real predicates are PK-leading |

**Matrix totals: REQUIRED IN 024 = 4 (rows 6, 7, 11, 13); JUSTIFIED
BUT DEFER UNTIL MEASURED = 1 (row 15); NOT JUSTIFIED = 11.** No
disposition relies on "index every foreign key" reasoning, and no
index is proposed merely to clear the INFO-level advisor notice:
every disposition cites the traced lifecycle support, concrete access
path, growth model, existing coverage, or proportionate-cost
analysis, and none cites current emptiness.

### 4.4 Measurement plan for the single DEFER (row 15,
exercises.import_run_id)

- Exact SQL measured: the three rollback statements that filter
  `public.exercises` by `user_id = $1 AND import_run_id = $2` (the
  found-count, the FOR UPDATE lock select, and the deactivation
  update inside `rollback_catalog_delivery`).
- Representative rows: seed a DISPOSABLE local cluster (the existing
  live-suite harness pattern; never Supabase) with 100k-1M total
  exercises rows across 1k-10k synthetic users at 100-500 rows per
  user, of which one delivered run contributes 50-400 rows for the
  measured user.
- Method: EXPLAIN (ANALYZE, BUFFERS) on each statement shape.
- Acceptable threshold: each statement completes in under 50 ms at
  the representative scale, with shared-buffer reads on the same
  order as the measured user's row count (not the table's); a
  user-prefix index scan plan (any user_id-leading index) is
  acceptable, a sequential scan plan is an automatic trip.
- Lock-time concern: rollback holds the per-user advisory lock and
  FOR UPDATE row locks while these statements run — slow scans
  extend a user-facing operation, so the threshold is strict.
- Roadmap point: MUST be measured during EXLIB-1C pre-launch QA
  (first realistic delivery volumes, before any production run is
  sealed), and re-checked before any runbook adopts unsealed-run
  deletion housekeeping.

## 5. Advisor findings classification

**A. RLS enabled with zero policies (closed catalog tables).**
INTENTIONAL fail-closed design, exactly as documented in the reviewed
architecture: RLS enabled + zero policies + REVOKE ALL from every
client role on all nine closed tables. Supabase lint 0008 (INFO)
explicitly recognizes deliberate deny-all designs; its optional
suggestion of an explicit rejection policy is NOT adopted because the
reviewed contract pins exactly one policy in migration 023 (the
owner-scoped alias SELECT), REVOKE ALL already denies at the grant
layer before RLS is even consulted, and adding nine cosmetic policies
would churn a reviewed, applied artifact for zero security gain. NO
code change warranted.

**B. authenticated EXECUTE on deliver_catalog_exercises(TEXT) and
rollback_catalog_delivery(TEXT).** INTENTIONAL — re-audited from the
applied bytes: both are SECURITY DEFINER with fixed
`search_path = public, pg_temp`; every object reference is
schema-qualified; identity derives solely from `auth.uid()` with a
NULL-check abort; neither accepts any caller-supplied user id; both
REVOKEd from PUBLIC and anon with exactly two EXECUTE grants to
authenticated (the designed tenant surface); RLS bypass under DEFINER
is confined by construction — every statement in both bodies is
scoped to `v_uid`-owned rows, catalog reads are limited to
sealed/approved/unrevoked run membership, and the per-user advisory
lock serializes re-entry. Exposure remains intentional; NO change
warranted.

**C. Pre-existing unrelated advisor findings.** Any advisor finding
not among the four EXLIB-1B2-specific items above is EXCLUDED from
EXLIB-1B3 by instruction. They were not enumerated in the relayed
post-application advisor output, and enumerating them would require
the Supabase dashboard, which Claude does not access; they are
excluded wholesale, by category of exclusion rather than by
fabricated listing, and must not be altered by this phase.

## 6. Recommended migration 024 scope (prose only — NO SQL AUTHORED)

1. Pin `search_path` on `public.exlib_verify_catalog_claims()` and
   `public.exlib_verify_alias_lifecycle()` using EXACTLY
   `SET search_path = ''` (section 3.3; the house pattern was
   considered and rejected for these two functions). Otherwise-
   identical function replacements; defense-in-depth with zero
   behavior change; closes lint 0011 legitimately.
2. Add FOUR partial leading indexes, each described in prose (no
   DDL here), each on the FK column alone with the predicate
   "column is not null", each maintained only on catalog-linked
   writes:
   - on `exercises` over `catalog_id` (row 13);
   - on `exercise_aliases` over `catalog_alias_id` (row 11);
   - on `exercise_catalog_run_items` over `catalog_id` (row 6);
   - on `exercise_catalog_run_items` over `catalog_alias_id`
     (row 7).
   All four protect reviewed, documented correction paths (traces A
   and B) whose RESTRICT checks otherwise scan unbounded children.
3. NOTHING ELSE. Zero policy changes. Zero grant changes. Zero
   table or trigger changes. Zero product code.

**Rejected/deferred candidates and reasons:** rows 1-5, 8-10, 12, 14,
16 (not justified, each with cited coverage or structural evidence);
row 15 deferred with the exact measurement plan in 4.4; plus the
lint-0008 rejection-policy suggestion (rejected: reviewed
single-policy contract, REVOKE-ALL-first denial, no security gain).

**Rollback and verification plan for the future migration 024:**
single top-level transaction (same atomic-install pattern as
Revision H); operations are two function replacements and four
index additions; rollback is the inverse (restore the exact
Revision H function text — byte-recoverable from the frozen
migration 023 — and remove the four named indexes); verification =
the standard fingerprint protocol (exact byte count/SHA-256, review
copy, ChatGPT approval before application by Joseph/ChatGPT — never
Claude), a `pg_proc.proconfig` read-only check confirming both
functions carry the empty-string path and the other sixteen are
unchanged, catalog-of-indexes read-only check for the four new
names, re-run of the disposable-cluster live suite against the
post-024 schema, and the full deterministic battery with a
migration-boundary retarget (exactly-23 to exactly-24, pinned
filename) applied across committed suites at drafting time.

**Remaining unresolved decision:** none — the search_path form is
resolved (empty string) and every index candidate carries exactly
one evidence-backed disposition. The only open item is ChatGPT's
approval of this scope before migration 024 drafting begins.

## 7. EXLIB-1B3B — migration 024 DRAFT (clearly separated from the
audit above; authored AFTER the audit scope was approved)

**STATUS: DRAFT — NOT APPLIED.**

- File: `supabase/migrations/024_exlib_post_application_hardening.sql`
  (created through the Supabase CLI migration workflow, then
  conformed to the repository's sequential naming convention)
- Size: 3,726 bytes
- SHA-256:
  `190550ecdb99df702ab03d1b07592f861070141e5091eb25bc5bf45f211cc980`

**Exact six-operation inventory** (one top-level transaction
encloses all of them; nothing executable sits outside it):

1. Two ALTER FUNCTION statements, one per verify function, each
   setting exactly the empty-string search_path — on
   `public.exlib_verify_catalog_claims()` and
   `public.exlib_verify_alias_lifecycle()` (exactly one applicable
   signature each, proven against the applied 023: one niladic
   definition per function, zero overloads).
2. Four CREATE INDEX statements — non-unique, btree, single FK
   column, partial with exactly the column-is-not-null predicate,
   schema-qualified, created normally inside the transaction (no
   CONCURRENTLY; no IF NOT EXISTS — a collision fails the whole
   migration closed):

| Index name | Table | Column | Predicate | Justification |
|---|---|---|---|---|
| exercises_catalog_id_idx | public.exercises | catalog_id | catalog_id IS NOT NULL | audit row 13: supported pending-snapshot correction otherwise heap-scans the largest tenant table |
| exercise_aliases_catalog_alias_id_idx | public.exercise_aliases | catalog_alias_id | catalog_alias_id IS NOT NULL | audit row 11: documented alias delete-while-unreferenced check otherwise scans all delivered aliases |
| exercise_catalog_run_items_catalog_id_idx | public.exercise_catalog_run_items | catalog_id | catalog_id IS NOT NULL | audit row 6: same correction path over the cumulative, unbounded membership audit |
| exercise_catalog_run_items_catalog_alias_id_idx | public.exercise_catalog_run_items | catalog_alias_id | catalog_alias_id IS NOT NULL | audit row 7: same correction path, alias membership side |

All four names are mechanically proven absent from migrations
001-023.

**Why ALTER FUNCTION rather than function replacement:** ALTER
changes ONLY `proconfig` by construction — the body (prosrc),
signature, return type, SECURITY INVOKER model, volatility, parallel
setting, owner, and ACL are structurally untouched, which the live
suite proves byte-identical before/after. A replacement would
re-author the entire body text and reopen review surface for zero
gain.

**Explicit zero-change list:** no table, no column, no trigger, no
policy, no grant, no revoke, no function body, no data row, no
product/API/library/dependency change, and no change of any kind to
migration 023 or its historical application record.

**Rollback contract:** reset the two functions' search_path setting
back to the exact pre-024 state (unset — the applied Revision H
proconfig is NULL for both), and drop exactly the four indexes named
above. Nothing else exists to roll back.

**Application boundary:** migration 024 may be applied ONLY by
Joseph/ChatGPT, only to Supabase project ShredOS
(`ttybyljytiwntvorugcv`), and only after ChatGPT approves this exact
fingerprint. Claude never applies SQL. This section grants NO
EXLIB-1C authorization: catalog data loading remains blocked pending
explicit legal and product approval.

**Live verification:** `scripts/verify-exlib1b3-live.sh` (separate
from the approved migration-023 concurrency script, which is
untouched) gates on BOTH exact fingerprints before initdb, applies
stubs + 023 + 024 to a disposable socket-only local cluster, proves
from pg_proc that only proconfig changed (all other function
identity byte-identical) and equals the empty-string pin, proves the
four indexes' exact shape and non-uniqueness from pg_indexes and
pg_class, proves EXPLAIN eligibility of each index for its
referential lookup, proves both verifier functions return
byte-identical output before/after, and proves atomicity by
pre-creating a colliding index name in a second database and
verifying the failed 024 run leaves nothing behind. Result: 22
passed, 0 failed. Supabase is never contacted.

## 8. Boundaries

MIGRATION 024 was drafted, fingerprint-approved for candidate
preparation (section 9), promoted, and then APPLIED by ChatGPT on
2026-08-24 (section 10). Application does not change any other
boundary in this section. EXLIB-1C (catalog data
loading) remains blocked pending explicit legal and product approval
and its own phase instruction; the 48 review-ledger records remain
pending with null reviewer fields and MUST NOT be approved, edited,
or fabricated by this phase; no Supabase or Vercel contact occurred
during this audit; migration 023's bytes remain frozen.

## 9. Candidate-preparation approval record (2026-08-24)

- ChatGPT completed a direct byte-level review of the attached
  migration and live-test artifacts
  (`024_exlib_post_application_hardening.sql` and
  `verify-exlib1b3-live.sh`, exported byte-identical from this
  worktree).
- Fingerprint
  `190550ecdb99df702ab03d1b07592f861070141e5091eb25bc5bf45f211cc980`
  (3,726 bytes) is **approved for candidate preparation ONLY**.
- This does NOT authorize application. Migration 024 remains
  DRAFT — NOT APPLIED.
- Joseph/ChatGPT must SEPARATELY authorize application of this exact
  fingerprint, and only after the candidate is committed,
  independently verified, promoted, and recorded.
- ANY byte change to the migration voids this approval.

## 10. Migration 024 — production-application record (2026-08-24)

**Authoritative application facts:**

- Applied by: ChatGPT — Claude did NOT apply the migration and did
  NOT contact Supabase (standing security boundary: Supabase
  migrations are applied only by Joseph or ChatGPT, never Claude).
- Date: 2026-08-24.
- Project: ShredOS (`ttybyljytiwntvorugcv`).
- File: `supabase/migrations/024_exlib_post_application_hardening.sql`.
- Exact applied size: 3,726 bytes.
- Exact applied SHA-256:
  `190550ecdb99df702ab03d1b07592f861070141e5091eb25bc5bf45f211cc980`
  (identical to the fingerprint approved for candidate preparation
  and promoted to main at commit `f42eb43b1dabd29560ff0771f562d46063eda7c0`).
- Supabase history entry:
  `20260824174252_exlib_post_application_hardening`.
- **Migrations applied to ShredOS are now exactly 001-024.**

**Read-only verification results (all as expected):**

| Check | Result |
|---|---|
| exlib_verify_catalog_claims proconfig | the empty-string search_path pin |
| exlib_verify_alias_lifecycle proconfig | the empty-string search_path pin |
| both functions' source MD5, niladic signature, result type, SECURITY INVOKER, stable volatility, unsafe parallel setting, postgres owner, ACL | unchanged from pre-application |
| exercises_catalog_id_idx / exercise_aliases_catalog_alias_id_idx / exercise_catalog_run_items_catalog_id_idx / exercise_catalog_run_items_catalog_alias_id_idx | all present; each non-unique btree on its single FK column with the exact column-is-not-null partial predicate |
| exlib_verify_catalog_claims() | orphaned_claims = 0, unclaimed_bearers = 0 |
| exlib_verify_alias_lifecycle() | active aliases on inactive exercises = 0 |
| exercise_catalog / exercise_catalog_aliases / exercise_catalog_run_items / exercise_catalog_review_events | 0 / 0 / 0 / 0 — no content data was loaded |
| review ledger | 48/48 pending with null review fields — no ledger approval occurred |
| the four targeted unindexed-FK advisor notices | gone |
| unused-index INFO notices | expected and accepted for now: no catalog delivery activity exists yet, so the four new indexes have no scans to show |

**Status wording:** the review-time status lines
"MIGRATION 024: DRAFT — NOT APPLIED — NOT APPROVED FOR APPLICATION"
and "MIGRATION 024 IS A DRAFT — NOT APPLIED — NOT APPROVED FOR
APPLICATION", and the migration file's internal
review-status header, are preserved verbatim as historical
reviewed-artifact text; they described the artifact during review
and are deliberately not rewritten. The applied status is carried by
this section and the Supabase migration history.

**Boundary:** application of migration 024 does NOT authorize
EXLIB-1C. Catalog data loading remains blocked pending explicit
legal and product approval and its own phase instruction; the 48
review-ledger records remain pending and untouched.
