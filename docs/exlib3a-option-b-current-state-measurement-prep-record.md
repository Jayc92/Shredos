# EXLIB-3A OPTION B — current-state measurement package
# preparation record

Recorded 2026-09-08 (UTC). This milestone AUTHORED AND LOCALLY
VALIDATED, and only that, the read-only OPTION B measurement
package the approved EXLIB-3A governance proposal recommends. The
package is PREPARED — NOT EXECUTED: no hosted contact of any kind
occurred, no measurement has been performed against ShredOS, the
proposal's section-16 human authorization remains PREPARED — NOT
ISSUED — DELIBERATELY UNSENT, and S6 activation remains STOPPED.
Executing the package remains a later, separately gated, one-use
hosted act by Joseph/ChatGPT after Codex review of these exact
bytes — never by Claude.

## 1. What was prepared (the exact bytes)

- Package: docs/exlib3a-option-b-current-state-measurement.sql,
  14,101 bytes, sha256
  1e9a60eca9f83b13ab603600272dd3ac3f532cf38d304259c7a584e47fd296ea
  (the round-1 corrected bytes; the round-0 fingerprint 13,684 B
  323764cb... is superseded by a comment-only header correction —
  the comment-stripped executable SQL is byte-identical across the
  correction, sha256
  08613dbd44dcea73a16e9272dcab4d33aaeb47bd7f30f935e37fe9bad77cf597
  both before and after),
  authored on the local-only branch exlib3a-s6-delivery-governance
  over the Codex-accepted proposal candidate
  872e19eff3a618015a6dfea7d83c00a241c37aca (chain
  5ed6fd84... -> 548849c0... -> 872e19ef...; the durable production
  base main = origin/main = 5ed6fd84... is untouched).
- Shape: ONE explicit BEGIN TRANSACTION READ ONLY; exactly ONE
  top-level SELECT producing a single (metric, value) result set of
  FIFTY rows; COMMIT. Zero INSERT/UPDATE/DELETE/MERGE/TRUNCATE,
  zero DDL, zero GRANT/REVOKE, zero advisory or table locks, zero
  delivery/rollback/revocation invocation. The only function calls
  are now(), aggregate functions (count, string_agg), md5,
  coalesce, and public.exlib_verify_catalog_claims().

## 2. Why one result set (the transport-shape design rule)

The hosted SQL transport surfaces the LAST result set of a script.
A measurement whose evidence spans multiple SELECTs could silently
lose everything but the final one — so this package emits its
COMPLETE evidence as ONE SELECT of fifty (metric, value) rows.
One execution therefore yields the entire measurement; no
operational flow requires, or is permitted, a second query after
the package returns.

## 3. What the package measures (the required surfaces, mapped)

1. OBSERVATION IDENTITY: observed_at (PostgreSQL's
   TRANSACTION-START timestamp returned by now() — temporal context
   for the measurement, round-1 corrected: it is NOT the exact MVCC
   snapshot-acquisition instant, which is not separately surfaced,
   and observed_at must never be represented as that instant; the
   data values are nonetheless mutually coherent because all fifty
   metrics are produced by the single top-level SELECT and share
   one statement snapshot) and executor (current_user).
2. IMPORT-RUN CENSUS AND TARGET POSTURE: runs_total; the reserved
   key echoed; target_run_found; the target run's id (the hosted
   surrogate, surfaced for comparison with the preserved
   6669ba78-8e75-4042-ac2a-14082a9e5940 — surfaced, never assumed),
   created_at, dry_run, approved_for_delivery, sealed_at,
   revoked_at, started_at, completed_at, result_counts, both
   approver identities and instants, and the approval rationale's
   md5 (exact for contradiction detection; the reserved rationale's
   md5 is ca1acc7c1ef7c5a47ee7e7e286620dc5, reproduced from the
   reserved bytes during local validation).
3. TARGET-RUN MEMBERSHIP: run_items_total, target_run_items,
   exercise members, alias members, items outside the target run,
   and the full governed-identity member surface (semicolon-joined,
   deterministic ordering).
4. CURRENT PERSISTENT DELIVERY-ASSOCIATED TENANT STATE (exact,
   never estimated): delivered_exercises_total and
   delivered_aliases_total (import_run_id IS NOT NULL), each also
   scoped to the target run's id; PLUS the migration-026
   corrected-in-place distinguisher — corrections_total
   (public.exercise_catalog_corrections),
   delivered_exercises_corrected_in_place (provenance-linked rows
   with a corrections record), and
   delivered_exercises_not_corrected_in_place — because the P2
   Plank reconciliation lawfully UPDATEs an existing tenant row
   (no count movement) while recording a corrections row, these
   three exact counts separate corrected-in-place state from
   inserted delivery state, which materially improves the A-vs-C
   decision.
5. EXACT CATALOG CARDINALITIES: the eleven closed-S5 vector tables
   as individual exact counts plus the derived vector_string.
6. EXACT TENANT CARDINALITIES: public.exercises and
   public.exercise_aliases.
7. DELIVERY-PREDICATE COUNT for the reserved run (the five
   conjuncts of the promoted gate).
8. CLAIMS INVARIANT: claims_orphaned and claims_unclaimed_bearers
   via public.exlib_verify_catalog_claims() — included because the
   committed migration bytes prove the function is LANGUAGE sql
   STABLE with ZERO mutation statements (the static verifier
   re-proves this mechanically), and the READ ONLY transaction is
   the enforcement belt: any write attempt by anything the package
   touches errors the whole package closed.

NO approximate instrumentation appears anywhere: no connector
table-metadata tool, no live-row estimates, no statistics views —
every cardinality is an exact SQL COUNT(*).

## 4. Predeclared interpretation (fixed BEFORE any execution)

- ZERO current provenance-linked rows: no persistent
  delivery-associated tenant state is present NOW on the measured
  surfaces. NOT proof that deliver_catalog_exercises was never
  invoked or attempted — the promoted function's lawful idempotent,
  collision, and skip outcomes leave no new provenance-linked rows.
- NONZERO current provenance-linked rows: persistent
  delivery-associated tenant state exists NOW. STOP and report;
  never infer who invoked anything, when any state arose, or by
  which path; do not revoke and do not repair.
- TARGET RUN MISSING, a duplicate run, a revoked posture, a changed
  seal/approval posture, unexpected membership, or a contradictory
  delivery-predicate count: STOP and report; no repair and no
  activation progression.
- The historical S5 post-COMMIT observation gaps remain HISTORICAL
  regardless of these results; nothing here claims to close them.

## 5. The exact-once execution law (one contract, no exceptions)

The hosted package will be executed EXACTLY ONCE under the
operator's separate one-use OPTION B authorization (the EXLIB-3A
proposal's section 16 — PREPARED — NOT ISSUED — DELIBERATELY
UNSENT), and that authorization is consumed by the attempt
regardless of outcome. The single-result-set design of section 2
exists so one execution is COMPLETE by construction. If any query
or result is blocked, rejected, incomplete, interrupted, or
ambiguous: STOP; record the unavailable measurement as a gap; do
NOT manually re-run an individual SELECT under the spent
authorization; do NOT substitute connector table metadata or
live-row estimates for any exact count. A later attempt requires a
fresh operator decision and, if the package bytes differ, fresh
review.

## 6. Operator preflight (read-only, immediately before execution)

1. The SQL editor session is connected to ShredOS ref
   ttybyljytiwntvorugcv.
2. The package file's sha256, re-measured at the gate, equals the
   section-1 fingerprint (any byte change voids the review and the
   authorization).
3. The target run key in the package is the reserved
   exlib2u-plank-release1-staged-v1.
4. The one-use OPTION B authorization is unspent (no prior attempt
   of any outcome).

DELIBERATELY NO HOSTED-BACKUP PRECONDITION: this act is SELECT-only
inside a READ ONLY transaction; it can change nothing, so it does
not inherit the mutation-only backup prerequisite of the S4/S5
packages. (The instruction authorizing this preparation directed
exactly this unless the repository requires otherwise; nothing in
the repository does.)

## 7. The advisor observation (outside the SQL package)

The SQL package does not emulate Supabase advisors. As the approved
proposal already provides, the eventual authorized evidence capture
includes exactly ONE read-only advisor observation alongside the
package's result set, part of the same one-use authorization. No
advisor remediation is authorized by it.

## 8. Local validation performed (all local; the measurement itself
remains unexecuted anywhere hosted)

The package's syntax, transaction mode, and result shape were
validated on a DISPOSABLE socket-only local PostgreSQL cluster (the
established validation method for every hosted-lifecycle package;
no hosted contact): migrations 001-027, the 84-exercise tenant
fixture, the committed 2K+2O+2P+2Q+2R+2Y chain, the SPENT EXLIB-2U
staging package, and the SPENT EXLIB-2Z seal package were executed
once each to reproduce the sealed world, and this package then ran
EXACTLY ONCE against it: exit 0, ONE result set of exactly FIFTY
(metric, value) rows, observed_at returned as the transaction-start
timestamp (temporal context only; the data rows share the single
SELECT's statement snapshot — round-1 corrected),
the sealed posture read back exactly (approved true / sealed set /
unrevoked / operational fields null), the six-member surface exact,
vector_string 3/3/5/3/6/1/2/2/1/6/3, tenants 84/0, delivery
predicate 1, all delivery-provenance and corrections counts 0, and
claims 0/0. The reserved rationale's md5 reproduced as
ca1acc7c1ef7c5a47ee7e7e286620dc5. This validates the instrument;
it asserts nothing about the hosted database's current values.

## 9. Verifier lifecycle for this milestone

scripts/verify-exlib3a-option-b.ts (new, static, read-only, in the
battery) proves: the package fingerprint against this record; the
transactional READ ONLY shape (one BEGIN TRANSACTION READ ONLY,
one COMMIT, exactly ONE top-level SELECT); ZERO mutation, DDL,
lock, and lifecycle-invocation statements (comment-stripped
censuses; the delivery, rollback, and revocation function names
appear nowhere); exact-COUNT(*) instrumentation with NO
approximate-metadata references; the claims function's read-only
proof re-derived from the committed migration bytes (LANGUAGE sql
STABLE, zero mutation keywords) as the condition for its single
permitted call; the reserved run identity; the COMPLETE required
metric census (all fifty metric keys present exactly once each,
including the corrected-in-place distinguisher trio); the
predeclared persistent-state-versus-invocation-history framing and
STOP rules of section 4; the exact-once/no-manual-re-run law of
section 5; the preflight of section 6 including the justified
absence of a backup precondition; the proposal inheritance (the
section-16 authorization named as the sole issuance path, UNSENT);
the negative boundary; hygiene; and topology, including the
labeled completed-phase retarget of section 10.

## 10. Stale-claim sweep and battery reconciliation

The sweep against a simulated commit built from the intended phase
paths (before the retarget; measured 101 suites / 7,251 checks / 3
failures) enumerated exactly TWO stale historical checks, both in
verify-exlib3a and both retargeted count-neutral under the exact
label `RETARGET (EXLIB-3A OPTION B measurement preparation)`:

- X14's completed-phase topology (its committed branch pinned
  exactly two commits over 5ed6fd84..., true until this milestone's
  own successor commit; its uncommitted branch could not describe
  this milestone's authoring state) — the recurring completed-phase
  pattern (thirteenth instance), anchored at that phase's own
  accepted candidate 872e19eff3a618015a6dfea7d83c00a241c37aca,
  where the chain and inventories held and hold forever;
- X1's live-worktree exlib3 namespace self-census — an
  authoring-time claim falsified by this milestone's own lawful
  exlib3a-option-b artifacts (the same
  finished-claim-falsified-by-successor class as the earlier 2V
  census retarget), anchored as a tree census at the same accepted
  candidate. The only other red was this
milestone's OWN new verifier holding its retarget-coverage check
red until the retarget landed — the guard authored before the
repair, its output the worklist. With the retarget in place the
simulated-commit battery, the committed battery, and the
fresh-clone battery all read 101 suites / 7,251 checks / 0
failures — the prior baseline 100/7,237 plus exactly this
milestone's new 14-check static suite and nothing else.

## 11. What did NOT happen (the boundary)

No Supabase contact, no Vercel contact, no hosted SQL execution,
no measurement against ShredOS, no delivery call, no revocation,
no restore, no environment or delivery-variable change, no S6
activation, no EXLIB-2S act, no push, no tag. The hosted run
remains SEALED and SPENT exactly as closed out; the two historical
post-COMMIT observation gaps remain exactly as recorded; the
section-16 authorization remains UNSENT; S6 remains STOPPED.

## 12. Stop condition

This milestone stops LOCAL-ONLY on its branch for Codex review of
the exact SQL bytes. The next gated steps, in order, each separate:
Codex review of this package; the operator's one-use OPTION B
authorization (the proposal's section 16, issued only by the
operator, naming this package's re-measured fingerprint); the
operator's single hosted execution; the EXLIB-3A current-state
evidence record authored from the returned result set (with
exact-count provenance labeling); and only then the A-versus-C
reconsideration. S6 activation remains STOPPED throughout.

## 13. Correction disclosure (2026-09-08, round 1)

Codex reviewed the round-0 candidate
ba6a6ca6cf39d8fdc60a822e93413dd5cf7d1c1a and returned CORRECT: the
measurement architecture, read-only shape, fifty-metric census,
persistent-state framing, exact-once law, and the disposable
local-cluster validation were ACCEPTED (the local execution ruled
instrument validation only, consuming nothing), with ONE narrow
evidence-provenance defect: the round-0 package header and this
record equated the transaction's now() with "the snapshot instant."
PostgreSQL defines now() as the START TIME OF THE CURRENT
TRANSACTION — not the MVCC snapshot-acquisition instant, which this
package does not separately surface. Corrected in ONE plain forward
commit touching exactly the package header, this record, and the
Option-B verifier (the accepted verify-exlib3a retarget is
byte-unchanged): observed_at is now stated as the transaction-start
timestamp providing temporal context, never the exact snapshot
instant; the data metrics' mutual coherence is preserved and stated
on its true basis — all fifty values are produced by exactly ONE
top-level SELECT and share that single statement's MVCC snapshot.
No executable SQL changed: the comment-stripped code is
byte-identical across the correction (section 1 pins both
fingerprints). B2 was strengthened count-neutrally to require the
corrected provenance and to reject the equating language from the
factual sections; B14 pins the round-0-plus-correction chain. No
hosted contact, no measurement, no delivery, no revocation, no S6
action, no push, and no tag occurred in this correction; the
section-16 authorization remains UNSENT and S6 remains STOPPED.
