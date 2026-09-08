# EXLIB-2Y — hosted snapshot-review application-package preparation record

Recorded 2026-09-08 (UTC). LOCAL-ONLY milestone: this phase PREPARES
the ONE-USE hosted snapshot-review application package and proves it
behaviorally on disposable local PostgreSQL — it does NOT execute it
anywhere hosted. The package is PREPARED — NOT EXECUTED: exactly one
hosted execution is authorized after Codex review, against the
Supabase project ShredOS ref ttybyljytiwntvorugcv only, by
Joseph/ChatGPT only, never by Claude and never by any automated
pipeline. No Supabase or Vercel endpoint was contacted in this
milestone; No hosted snapshot review has been applied, no review
event exists beyond the promoted zero baseline, No S4 run exists,
nothing is approved or sealed database-side, nothing is delivered,
and no environment variable, seed, or inventory changed.

## 1. Sources (all promoted, all immutable inputs)

- Promoted source: main = origin/main =
  06d99e2cb3a678836a05a0078cc4f916d30cf462 (tree 28efad62), carrying
  the annotated tag exlib2x-v2-decisions-transcribed-stable (object
  0e98d6fe, 94-byte annotation, byte-verified).
- The three completed v2 decision artifacts are the package's
  IMMUTABLE inputs (pinned inside the package by exact byte size and
  sha256; any byte change voids the package):
  docs/exlib2w-plank-snapshot-review-form-v2-completed.json,
  docs/exlib2w-dead-bug-snapshot-review-form-v2-completed.json,
  docs/exlib2w-ab-wheel-rollout-snapshot-review-form-v2-completed.json
  — all APPROVE, all by Joseph Carfagno (Product owner), all at
  2026-09-07T19:06:00-04:00 (= 2026-09-07T23:06:00Z), each a coherent
  COMPLETED_HUMAN_DECISION under the v2 derived-state rule.
- The package under review:
  docs/exlib2y-snapshot-review-application-package.sql,
  25193 bytes, sha256
  74934419d027b477933f01bcbd2f4984700b34c6416ecd9c43c64bbd528757e0.

## 2. The derived lawful transition and the audit-tuple mapping

From the committed migration bytes (023 grants nothing on
exercise_catalog to any role; the four 027 NOLOGIN roles hold
EXECUTE on content-lifecycle functions only): the ONLY lawful
transition surface is a direct owner UPDATE setting review_status
AND the complete audit tuple in the SAME statement; the operative
exlib_freeze_catalog_snapshot trigger validates the one-way machine,
demands the complete non-blank FRESH tuple, forbids any
governed-content change, and itself appends the immutable
exercise_catalog_review_events row (that table's guard accepts
inserts only at trigger depth >= 2, so the trigger is the only
lawful event writer — the package inserts NO event directly).

The snapshot row carries exactly THREE audit columns, so the mapping
is: reviewed_by takes the decision's reviewer; reviewed_at takes the
decision's timestamp instant; review_rationale takes the decision's
rationale. The decision's reviewer_role_or_credential and evidence
fields remain in the promoted artifacts — no snapshot column exists
for them.

## 3. What the package does and refuses (fail-closed)

One transaction; SHARE ROW EXCLUSIVE locks over the eleven gated
catalog tables before any gated read. Preconditions (each RAISE
rolls back everything): operator posture (current_user = postgres);
the operative trigger present; per-identity gates FIRST — each of
the three governed logical identities resolves to EXACTLY ONE active
row (never through a hosted snapshot UUID; the Plank surrogate was
never preserved and is not invented — the package contains exactly
the three logical UUID literals and no other UUID), each row still
PENDING with a NULL audit tuple, each row's LIVE created_at IS NOT
NULL (verified at application time, never pretended preserved), and
every preserved governed field equal to the decision packet — a
drifted row makes that decision VOID and refuses; then the
preservation surfaces — the exact post-EXLIB-2R evidence baseline
vector 3/3/5/3/6/1/2/2/0/0/0 with ZERO review events (the ONE-USE
gate: a second execution refuses here), the published + admitted +
fingerprint-fresh Plank content, the exact two projected
relationships, and the claims invariant. Then EXACTLY the three
human transitions. Postconditions (each RAISE rolls back
everything): the vector moved in exactly one position (3/3/5/3/6/1/2/2/0/0/3);
the three rows approved with the exact tuples and UNCHANGED
created_at (capture-and-compare); the three trigger-created events
exact; every unrelated catalog surface digest-identical; the tenant
surfaces digest-identical (captured-and-compared inside the
transaction, never pinned to absolute counts — production signups
lawfully change them); the four catalog-role authority shapes
unchanged (this package changes NO authority); claims invariant
intact. A partial application cannot commit.

## 4. The live behavioral proof (disposable cluster only)

scripts/verify-exlib2y-live.sh boots a throwaway socket-only
cluster, reproduces the hosted role posture, applies migrations
001-027, seeds the 84-exercise tenant fixture, executes the
COMMITTED, SPENT EXLIB-2K + 2O + 2P + 2Q + 2R packages once each to
produce the EXACT post-publication hosted pre-state, and proves:
the happy path (the three transitions, the trigger-created events,
one-position vector movement, every unrelated surface
digest-identical, authority untouched); ONE-USE (the second
execution refuses at the vector gate); a refusal matrix on fresh
template copies with rollback proven every time — drifted governed
field, missing identity, COUNT-CAMOUFLAGED duplicate identity
(both one-active unique indexes dropped, the vector held at
baseline, proving the package's own per-identity gate fires
independently of the indexes AND the vector gate), stale review
state, foreign review event (guard-bypass simulation), wrong
authority, PARTIAL-APPLICATION atomicity (a tampered copy whose
third target does not exist: two transitions succeed
in-transaction, the postcondition counts 2 events, and EVERYTHING
rolls back to pristine), and swapped-identity writes (a tampered
copy that swaps identities in the write section only; the
postcondition per-row comparison catches the wrong tuples and rolls
back); and a REAL two-session race with exactly one committer.
Result: 64 passed, 0 failed. The live suite runs on demand
(bash scripts/verify-exlib2y-live.sh) and is deliberately outside
the TS battery, as every live suite in this repository is.

## 5. Verifier lifecycle and the boundary

scripts/verify-exlib2y.ts (new, static, in the battery) proves
Y1-Y14: source and decision-artifact integrity, package labels and
statement shape, MECHANICAL value binding (every audit literal
extracted from the artifact bytes and matched against the package),
governed-field precondition binding, created_at truthfulness,
logical-identity-only resolution, the one-use vector gates, this
record's truthfulness including the MEASURED live totals, live-suite
coverage, topology, the boundary (the package lives under docs/,
never supabase/migrations/; no delivery environment-variable
literal anywhere in the phase), hygiene, and chronology (the
package's timestamp equals the artifacts' instant; the round-0
11:05 instant appears nowhere).

## 6. Stale-claim sweep and battery reconciliation

The full historical battery was swept against a temporary
never-referenced simulated commit built from the intended phase
paths EXPLICITLY. The stale set was enumerated MECHANICALLY:
exactly ONE check in ONE suite failed — verify-exlib2x X14's
HEAD-relative completed-phase topology, the same recurring pattern
as every predecessor phase — and it is retargeted under the exact
label `RETARGET (EXLIB-2Y snapshot-review application preparation)`
to anchor at that phase's own promoted tip
06d99e2cb3a678836a05a0078cc4f916d30cf462, count-neutral and
strength-preserving. With it in place the simulated-commit battery
and the committed battery both read 94 suites / 7,159 checks /
0 failures — the promoted baseline 93/7,145 plus exactly this
milestone's new 14-check static suite and nothing else.

## 7. Stop condition and the next lawful acts

This milestone stops LOCAL-ONLY on its branch for Codex review (the
retained risky-gate sequence: this preparation -> ONE review -> the package
executed hosted exactly once by Joseph/ChatGPT -> the evidence record -> then
EXLIB-2U S4 staged-run preparation on a fresh branch, whose reserved
inputs — run key exlib2u-plank-release1-staged-v1 and membership
ALL_THREE_IDENTITIES — stand byte-frozen in the promoted S4
authority artifact). Not pushed, not promoted, not tagged, not
merged, not deployed; the package executed ONLY against disposable
local clusters; no hosted contact of any kind; the quarantine
untouched; EXLIB-2S untouched.
