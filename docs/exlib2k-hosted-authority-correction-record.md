# EXLIB-2K — Hosted-authority compatibility correction record

Recorded 2026-09-02 (UTC). LOCAL-ONLY correction milestone on branch
exlib2k-hosted-authority-correction from promoted main
56488527889858243b1fd701dc3944a8c0f4fc7b. No hosted service was
contacted in this phase; no catalog load and no lifecycle transition
was performed anywhere but disposable local clusters. This record
APPROVES NOTHING; it awaits Codex review. The corrected package is
PREPARED — NOT EXECUTED.

## 1. The failed hosted attempt (evidence, preserved exactly)

One hosted execution of the PROMOTED load package revision was
attempted by ChatGPT (the authorized Joseph/ChatGPT path — performed
by ChatGPT, not Claude) against the ShredOS Supabase project
ttybyljytiwntvorugcv on 2026-09-02:

- Package revision attempted: exactly the promoted bytes, 20,116 B,
  SHA-256
  78cff34a39239c62391f322138e7e4085191fb4f26fc0e87c17c6474915e21a7
  (tag exlib2k-plank-catalog-load-prep-reviewed-not-executed, peeling
  to 56488527889858243b1fd701dc3944a8c0f4fc7b, where those bytes
  remain preserved).
- Exact hosted error:
  ERROR 42501: permission denied to set role "exlib_catalog_loader"
- The failure occurred at the package's SET ROLE statement — BEFORE
  any loader call and before loading any data.
- The single enclosing transaction rolled back.
- ChatGPT's immediate rollback proof confirmed ALL TEN catalog tables
  remained exactly zero rows.
- No partial state and no lifecycle effect exists on hosted; the
  hosted catalog surface is byte-for-byte what it was before the
  attempt.

Hosted role facts (reported from the attempt, treated as ground
truth):

- current_user = postgres; session_user = postgres
- postgres is NOT a superuser
- postgres has membership in exlib_catalog_loader with options
  ADMIN TRUE, INHERIT FALSE, SET FALSE
- therefore SET ROLE exlib_catalog_loader is CORRECTLY denied

The failure is a compatibility defect in the package's assumptions
about the hosted execution posture, not a defect in migration 027's
authority model and not misbehavior by PostgreSQL.

## 2. Fail-closed derivation from PostgreSQL role semantics and the applied 027 contract

Since PostgreSQL 16 (model unchanged in 17), role memberships are
grantor-tracked rows carrying three per-grant options: ADMIN, INHERIT,
SET. `SET ROLE r` requires the invoker to hold a membership in r whose
SET option is true (superusers bypass this; hosted postgres is not
one). When a NON-superuser CREATEROLE role creates a role, PostgreSQL
records an implicit creator membership with ADMIN TRUE, INHERIT FALSE,
SET FALSE. Migration 027's four `CREATE ROLE ... NOLOGIN` statements
were executed on hosted BY postgres, so postgres holds exactly that
implicit membership on each of the four catalog authorities — which
matches the reported hosted facts bit for bit and explains the 42501.

ADMIN TRUE is the operative fact: a role holding ADMIN OPTION on r may
grant and revoke membership in r — including granting membership (with
the SET option) to itself. Role membership changes are ordinary
transactional catalog updates: they become visible to the granting
transaction immediately, are invisible to other sessions until COMMIT,
and revert completely on ROLLBACK.

Every claim above was verified empirically on a disposable local
cluster rebuilt to the EXACT hosted shape (section 5) rather than
assumed from superuser behavior: the implicit creator membership
options match the hosted report exactly; SET ROLE fails with exactly
`permission denied to set role ...` (42501); an in-transaction
`GRANT <role> TO postgres WITH SET TRUE, INHERIT FALSE` enables SET
ROLE within the same transaction; `REVOKE <role> FROM postgres GRANTED
BY postgres` removes exactly the temporary grant while leaving the
implicit creator membership (a different grantor) untouched; and both
COMMIT-after-restore and mid-transaction failure leave the membership
byte-identical to the baseline. Honest version note: the local
clusters run PostgreSQL 16.15 while hosted runs PostgreSQL 17; the
grantor-tracked membership model is the PG16 model, unchanged in 17,
and the hosted attempt's own observed behavior (the 42501 and the
reported membership options) confirms hosted PostgreSQL behaves per
this model.

## 3. Correction shapes evaluated (and what was deliberately NOT done)

A. Standing hosted operator membership — a separately reviewed hosted
   ACL act (`GRANT exlib_catalog_loader TO postgres WITH SET TRUE`)
   making the promoted package runnable as-is. REJECTED: it leaves a
   PERSISTENT widening of postgres's standing posture (SET at any
   time, outside any package boundary), requires a second hosted
   authority act with its own review and evidence trail, and its
   residual state would then fail any exact-baseline posture check
   forever after.

B. Package-contained transaction-safe elevation with exact
   restoration. SELECTED — smallest correct design: zero residual
   authority change on success OR failure (proven, not assumed);
   contained entirely within the already-reviewed package boundary
   and its one transaction; the load still runs UNDER SET ROLE
   exlib_catalog_loader, so authority isolation is preserved
   literally, not merely argued equivalent; the exact baseline is
   proven before any write and proven restored before COMMIT.

C. A separate migration/authority mechanism (e.g., a migration 028
   entry-point or role-option change). REJECTED: it creates a new
   standing authority surface and a new migration lifecycle for a
   problem the existing ADMIN-membership contract already solves
   transactionally; largest blast radius of the three.

Deliberately NOT done (each forbidden by instruction, and none is
present in the corrected package): SET ROLE was NOT deleted (the
loader still performs the load); privileged functions are NOT called
directly as postgres; NO client/service-role privilege is broadened;
NOTHING is granted to PUBLIC, anon, authenticated, or service_role;
local superuser behavior was NOT taken to represent hosted (the
fixture is a non-superuser replica of the hosted posture); NO hosted
ACL change was applied (no hosted contact at all this phase).

## 4. The corrected package

docs/exlib2k-plank-catalog-load-package.sql — 26,435 bytes, SHA-256
9234fee64a5729da9271b8582d78c3b0fd0cc9a76a50337ab8c3d68def35613d
(supersedes the promoted revision 20,116 B / 78cff34a... for any
future hosted execution; the promoted bytes remain preserved at their
tag; this revision requires its own review before any execution).

Order inside the single unchanged transaction:

1. BEGIN, then the ten-table SHARE ROW EXCLUSIVE lock (unchanged —
   the serialized fresh-load gate is intact).
2. Preconditions, extended with the HOSTED AUTHORITY POSTURE GATE,
   recognized BEFORE any write or authority change: invoker is
   postgres by name; invoker is NOT a superuser; the loader role
   carries EXACTLY ONE membership — postgres with ADMIN TRUE, INHERIT
   FALSE, SET FALSE. Any other posture (superuser invoker, widened
   SET, extra members) refuses fail-closed, because only the exact
   baseline makes the elevation provably restoration-exact. The
   one-use empty-surface gate follows, unchanged.
3. GRANT exlib_catalog_loader TO postgres WITH SET TRUE, INHERIT
   FALSE — the transaction-contained elevation (SET only; INHERIT
   FALSE means postgres never inherits loader privileges).
4. SET ROLE exlib_catalog_loader and the five loader calls, unchanged
   — only the loader authority performs the three loader operations.
5. RESET ROLE, then REVOKE exlib_catalog_loader FROM postgres GRANTED
   BY postgres — removing exactly the one grant the package created;
   the implicit creator membership (different grantor) is untouched.
6. Postconditions, unchanged (exact state, three claims, 0/0
   invariant, forbidden-state) PLUS the AUTHORITY RESTORATION
   postconditions: the loader membership posture equals the hosted
   baseline exactly (one row; ADMIN TRUE, INHERIT FALSE, SET FALSE),
   and anon/authenticated/service_role/PUBLIC hold zero EXECUTE on
   the three loader functions. Then COMMIT.

Failure at ANY point — posture gate, empty gate, loader refusal,
constraint, claim mismatch, restoration mismatch — rolls back the
WHOLE transaction: all data AND the temporary authority change
(memberships are transactional catalog state). Success commits the
load with the authority posture byte-identical to before execution.

## 5. The hosted-shape disposable fixture (replacing the superuser fixture)

The live harness no longer runs anything product-relevant as a
superuser. Its clusters now boot with a bootstrap superuser named
cluster_admin (initdb -U cluster_admin) used ONLY as the platform
substrate and for harness probe authority; the working role is a
recreated postgres: LOGIN, NOSUPERUSER, CREATEDB, CREATEROLE — the
hosted operator posture. The three platform roles (anon,
authenticated, service_role) are created by cluster_admin, mirroring
Supabase-provisioned platform roles. All 27 migrations apply AS the
non-superuser postgres (proven; migration 001's pgcrypto CREATE
EXTENSION succeeds under the trusted-extension mechanism as the
database owner), so migration 027's CREATE ROLE statements produce
the implicit creator memberships NATIVELY — the fixture arrives at
ADMIN TRUE, INHERIT FALSE, SET FALSE for postgres on all four catalog
authorities without any manual ACL sculpting, exactly as hosted did.
A dedicated fixture check asserts this shape (and postgres's
non-superuser status) before any package execution. The PROMOTED
package bytes (extracted from git at the promoted tip and
fingerprint-verified 78cff34a...) are executed against a fresh
hosted-shape scratch database and MUST reproduce the exact hosted
refusal — `permission denied to set role "exlib_catalog_loader"` —
with zero rows persisted and the membership baseline unchanged.
Harness probes that intentionally assume other roles (the
admission/publication refusal probes and the client-denial probe) run
under cluster_admin's superuser probe authority and are labeled as
harness probes, not product authority.

## 6. What this correction does NOT change

No migration was created or altered (supabase/migrations remains
exactly 001-027); no hosted state, seed, inventory, eligibility,
ledger, runtime, API, UI, dependency, or configuration change exists;
the artifact (2,928 B / d8207849...) and migration 027 (65,455 B /
90d53aaf...) are byte-identical to promoted main; the ten-table
serialized fresh-load gate, the three-claim postconditions with the
0/0 invariant, the two-session one-committer race, the 3/1/1/3/2
result, Plank's pending/draft/unadmitted/unpublished posture, the
intended-vs-database-proven target-identity rule with its mandatory
target-snapshot gate, and the one-use second-execution refusal are
all preserved and re-proven on the hosted-shape fixture. Hosted
execution of the corrected package remains a separate, future,
explicitly instructed Joseph/ChatGPT-path act following Codex review
of this correction.
