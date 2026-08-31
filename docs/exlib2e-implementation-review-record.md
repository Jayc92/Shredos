# EXLIB-2E — migration-026 implementation proposal review record

Prepared 2026-08-31. IMPLEMENTATION PROPOSAL ONLY — NOT APPLIED.
The proposed SQL lives at docs/exlib2e-migration-026-proposal.sql,
deliberately OUTSIDE supabase/migrations/, because it has not been
approved for application: every promoted verifier's "migration 026
absent" boundary stays true, and moving the file into
supabase/migrations/ is a later, explicitly authorized phase. Only
Joseph/ChatGPT may ever apply migrations, and only to the ShredOS
project. This phase edits no seed code, authors no Plank content,
changes no inventory/eligibility/ledger state, loads nothing, and
contacts no hosted service.

## 1. Source state

- Base: the Codex-APPROVED EXLIB-2D design at
  99991d7b07386c089bebf3c15a7ae98c10cde39b (branch
  exlib2d-plank-reconciliation-design, four review rounds closed),
  on promoted main cdba699ab68ba9cee2fd9331962b8b2060099862.
- Contract sources: docs/exlib2d-plank-seed-reconciliation-record.md
  and docs/exlib2d-plank-reconciliation-matrix.md (corrected4
  state). This proposal implements that contract exactly; no
  architectural decision is reopened.

## 2. Construction method (mechanical, reviewable)

The two CREATE OR REPLACE bodies were built by extracting the
migration-023 function texts VERBATIM and splicing in only the
marked EXLIB-2D additions:

- deliver_catalog_exercises(p_run_key TEXT): four splices — (1)
  DECLARE additions for Plank state; (2) a one-time resolution of
  the run's Plank logical identity after the run gate; (3) the
  Plank dispatch block immediately after the eligible counter,
  guarded by `v_cat.logical_id = v_plank_logical` so every other
  identity falls through to the byte-carried generic path; (4) one
  ADDITIVE report key, plank_disposition. Everything else —
  authorization (auth.uid), SECURITY DEFINER + pinned search_path,
  the per-user advisory lock (hashtextextended(uid, 8231)),
  sealed/approved/unrevoked run gating, the
  (user_id, catalog_logical_id) idempotency skip, the canonical
  claim precheck, the generic insert with its raced-unique-violation
  dispositions, the alias phase, and the 13 existing JSONB keys —
  is the unmodified 023 text.
- rollback_catalog_delivery(p_run_key TEXT): the 023 text with one
  exclusion predicate added to each of the three exercise queries
  (found-count, lock/dependent-alias set, deactivation sweep):
  `NOT EXISTS (... exercise_catalog_corrections ...)`. Deactivate-
  only semantics, tenant/run scoping, alias handling, and the
  existing report keys are unchanged; excluding corrected rows from
  the found-count preserves the existing meaning of found (rows the
  run INSERTED).

No second public delivery entrypoint exists: the proposal contains
the two CREATE OR REPLACE delivery/rollback statements, the
correction table, and ONE internal validation helper
(exlib_plank_link_valid — client execution revoked, never a
delivery entrypoint); CREATE OR REPLACE preserves the existing 023
ACLs (REVOKE from PUBLIC/anon; EXECUTE granted to authenticated).

## 3. Schema design: exercise_catalog_corrections

- Columns: user_id, exercise_id, import_run_id, catalog_logical_id,
  corrected_at (DEFAULT NOW()).
- PRIMARY KEY (user_id, exercise_id) — one correction per tenant
  row, tenant-scoped by construction.
- FKs, all ON DELETE RESTRICT: composite (user_id, exercise_id) ->
  exercises (user_id, id); import_run_id ->
  exercise_catalog_import_runs; catalog_logical_id ->
  exercise_catalog_logical. RESTRICT keeps provenance durable — no
  referenced entity can be deleted out from under the record, and
  the exercises delete gate independently blocks physical deletion
  of the corrected row itself (proven in the live matrix).
- Access posture, matching migration 023's machinery tables: RLS
  ENABLED with NO client policies (deny-by-default) and REVOKE ALL
  from PUBLIC/anon/authenticated. Ordinary authenticated clients can
  neither read, forge, mutate, nor delete correction provenance
  (all four denials proven executably); only the SECURITY DEFINER
  delivery/rollback functions touch the table.
- Durability: no 026 code path deletes or mutates a correction
  record; rows persist across rollback, re-delivery, and revocation
  (proven in the live matrix).

## 4. Plank dispatch semantics (as proven, per the approved matrix)

- Verified idempotency first: an existing (user_id,
  catalog_logical_id) link is locked with SELECT ... FOR UPDATE and
  validated by the ONE shared validation shape
  (exlib_plank_link_valid) against the full invariant set:
  timed/mobility, the active approved snapshot, STRICT run
  provenance (import_run_id must equal EXACTLY the delivering
  authorized run's id — a different, revoked, dry-run, unapproved,
  or unrelated run never validates), the exact catalog anatomy
  multiset, and the canonical-or-distinguished name with the
  matching claim held by that row; it no-ops ONLY if every invariant
  passes (already_valid_idempotent), otherwise the entire delivery
  aborts with the inconsistent-prior-reconciliation exception — no
  silent repair, relink, anatomy overwrite, or rename (proven: a
  corrupted link, a link carrying a different existing run's id, and
  a link pointing at a dry-run/unsealed run all abort and stay
  untouched). The raced logical-index path uses the SAME shared
  shape: when a direct client write (which does not share the
  advisory lock) wins the (user_id, catalog_logical_id) race, the
  winning row is locked and fully validated before any no-op — a
  completely valid winner no-ops, and any malformed winner aborts
  fail-closed (both proven with autonomously committed competing
  rows via dblink, simulating the real cross-session race).
- P2: the nine-part pristine predicate re-verified under FOR UPDATE
  (zero workout_exercises — structurally zero sets; zero
  workout_routine_exercises; exact scalar tuple including
  exercise_type='bodyweight'; catalog_id/catalog_logical_id/
  import_run_id all NULL; zero attached exercise_aliases; exact
  anatomy multiset {(obliques, secondary)}; 'plank' claim held by
  the row with claim_source='exercise'). On success: one UPDATE
  (tracking_mode/exercise_type/provenance), atomic anatomy
  replacement to the exact catalog snapshot, and the correction
  record — all in the delivery transaction. The correction is not
  counted in the existing inserted key (meaning preserved).
- Catalog snapshot gate: before ANY Plank correction or delivery,
  the run's active approved Plank snapshot itself must match the
  promoted contract — timed tracking (deriving the mobility tenant
  type) and the exact approved anatomy multiset — or the whole
  delivery fails closed; a bodyweight or malformed snapshot can
  never produce a timed disposition or a tenant row whose mode
  disagrees with its catalog provenance (both malformed variants
  proven to abort with tenant data fully unchanged).
- Locking contract (review 2): direct client UPDATE/DELETE of
  exercise_muscles does not take the parent exercises row lock, so
  locking the parent alone cannot serialize a concurrent anatomy
  customization. Every anatomy signature is therefore read only
  after locking, in strict parent-then-child order: the parent
  exercises row FOR UPDATE first (the existing-link, raced-winner,
  and P2 seed paths all already did this), then that row's existing
  exercise_muscles rows FOR UPDATE in deterministic primary-key
  order — inside the shared helper for both link-validation paths,
  and inside the P2 predicate before the seed anatomy comparison and
  the delete-and-replace synchronization. The helper is VOLATILE
  (row locking is not permitted in a STABLE function) and stays
  internal, SECURITY DEFINER with a pinned search_path, and
  EXECUTE-revoked from PUBLIC/anon/authenticated. NEW child anatomy
  inserts are serialized by the FK's key-share lock against the
  parent FOR UPDATE — proven against PostgreSQL in the live matrix
  (the blocked insert's context shows the RI trigger's FOR KEY SHARE
  wait), not merely documented. A client anatomy write holds no
  parent lock, so the strict parent-then-child order admits no lock
  cycle (also proven). The per-user advisory lock is preserved
  unchanged, and the P2 correction UPDATE is defensively
  tenant-scoped (id AND user_id) on top of the tenant-scoped
  transaction.
- Otherwise: canonical delivery when 'plank' is free; the
  deterministic 'Plank (timed)' fallback when only canonical is
  claimed (disposition distinguishes a failed-predicate preserved
  legacy from a no-seed alias-claim case); fail-closed retryable
  skip when both names are claimed. The fallback is constructed
  only as canonical_name || ' (timed)' inside the Plank branch —
  the proposal contains no UPDATE of any exercises.name, so no
  rename mechanism exists at all.

## 5. Alias interaction (023 semantics unchanged, tested)

The alias phase is byte-carried from 023 and resolves its target
independently through the logical identity, so aliases attach to a
corrected P2 row exactly as to a delivered row. Proven executably:
after rollback, the corrected P2 exercise remains ACTIVE while the
run-delivered alias row is deactivated (existing behavior); a
subsequent delivery reports the rolled-back alias as the
deterministic already-delivered skip, creates no duplicate, and
does NOT silently reactivate it. No 023 alias-reactivation semantic
was changed.

## 6. Compatibility proof

- Report keys: the 023 RETURN carries exactly 13 keys; the proposal
  carries the same 13 (names, types, order, and meanings unchanged)
  plus the single additive plank_disposition. Proven both
  statically (key extraction from both texts) and executably
  (023-only database returns the 13; the proposal database returns
  13 + 1).
- Non-Plank effects: a second disposable database with migrations
  001-025 ONLY delivered the same non-Plank fixture; the delivered
  row's full column tuple is IDENTICAL to the proposal database's
  (proven in the live matrix). Non-Plank selection, mutation,
  collision, idempotency, alias, provenance, and rollback behavior
  is the byte-carried 023 code.
- Repository consumers, rescanned 2026-08-31: no application code
  under src/ calls deliver_catalog_exercises or
  rollback_catalog_delivery today; the only repository references
  are frozen verification suites pinning the migration SQL text.
  This is recorded as a dated fact, not a permanent architectural
  invariant — the additive-only rule exists precisely so future
  callers are protected.

## 7. Local disposable-DB proof matrix (verify-exlib2e-live.sh)

94 checks, 94/0 on a socket-only disposable cluster (no hosted
contact): fingerprint gates; 001-025 + proposal apply cleanly;
fresh-user canonical delivery with full provenance and catalog
anatomy; P2 in-place correction (same row id, name unchanged,
anatomy synchronized, correction record, claim never moved, not
counted as an insert); valid-retry no-op; malformed-link fail-closed
abort without repair; P4 history preservation with byte-untouched
sets; P3 routine preservation; SEVEN individual P5 precondition
failures (anatomy extra, anatomy missing, alias attached, scalar
notes, exercise_type mismatch, preexisting provenance, archived) —
each preserving the legacy row with no correction record; P6
alias-claim distinguished delivery; both-names fail-closed skip that
never blocks non-Plank delivery; concurrent same-user delivery
serialized to exactly one row; rollback excluding the corrected row
(and its found-count) while inserted canonical/distinguished rows
deactivate per existing behavior and the legacy row stays untouched;
post-rollback re-delivery with exact alias dispositions (no
duplicates, no silent reactivation); the delete gate on the
corrected row; four client-role denials on correction provenance;
cross-tenant isolation; revocation halting future delivery while
the corrected row is never reinterpreted; the two-database
compatibility proof; and the review-1 additions — a link carrying a
DIFFERENT existing run id aborting fail-closed without repair,
dry-run/unsealed provenance aborting, a raced VALID competing
winner (autonomously committed via dblink) accepted only after the
full shared-shape validation, a raced MALFORMED winner aborting the
delivery transaction completely while the independently committed
malformed row stays untouched, and both malformed-snapshot variants
(bodyweight tracking; timed with the wrong anatomy multiset)
failing the entire delivery closed with tenant data unchanged.

Review-2 additions (14 checks): a controlling session holding
EXACTLY the delivery's lock set proves a concurrent anatomy UPDATE
and DELETE from autonomous dblink sessions WAIT (statement_timeout
probes) and that the SAME writes succeed once the holder commits —
the "delivery obtains the child locks first" side of the contract;
a NEW child anatomy INSERT blocks against the parent FOR UPDATE
alone (the FK RI trigger's FOR KEY SHARE, proven against
PostgreSQL); a client anatomy write holds no parent lock (FOR
UPDATE NOWAIT succeeds beside it), so no lock cycle exists; a
mid-flight race where an autonomous session takes the child lock
FIRST with a pending customization shows delivery blocking at the
child locks, observing the committed customization, and routing to
preserved-legacy + distinguished delivery with the customization
kept VERBATIM (no overwrite, no partial anatomy replacement, no
correction record) — the "customization wins" side; autonomously
committed anatomy DELETE and INSERT before delivery route to P5
with the legacy anatomy untouched (no phantom escapes the
signature); existing-link re-delivery over concurrently customized
anatomy ABORTS (never already_valid_idempotent) with no silent
repair; and the P2 user's corrected row and synchronized anatomy
are byte-stable across every review-2 scenario (no cross-tenant
mutation).

## 7a. Codex review 1 — corrections applied (2026-08-31, honest log)

Three blocking findings, all corrected forward-only:
1. The verified-idempotency run invariant had been implemented
   permissively (any existing non-null run id); it now requires
   import_run_id to equal EXACTLY the delivering authorized run
   (v_run.id), per the approved contract.
2. The Plank insert's raced logical-index handler had reported
   already_valid_idempotent without validating the winning row; the
   winner is now locked and validated with the same shared shape
   (exlib_plank_link_valid) as the existing-link path, so the two
   paths cannot drift; only a fully valid winner no-ops.
3. A catalog snapshot gate was added: a bodyweight or
   anatomy-malformed Plank snapshot now fails the whole delivery
   closed before any Plank work.
Test-instrumentation note, recorded honestly: the first race
fixture injected the competing row from a BEFORE trigger inside the
delivering statement, which the exception handler correctly could
NOT see (the injected row was part of the aborted subtransaction) —
itself a useful confirmation of the rollback semantics; the fixture
was rewritten to commit the competing row from an autonomous dblink
session, which is what a real client race is.

## 7b. Codex review 2 — corrections applied (2026-08-31, honest log)

One blocking finding, corrected forward-only: locking
public.exercises does NOT serialize existing exercise_muscles
UPDATE/DELETE — authenticated tenants hold direct UPDATE/DELETE
privileges on exercise_muscles and those statements never take the
parent row lock, so a concurrent anatomy customization could race
both the P2 pristine predicate and the shared link validation, and
P2 could have overwritten a real customization after reading a
stale signature (a P2/P5 boundary violation). Corrected by locking
each validated exercise's existing child anatomy rows with
SELECT ... FOR UPDATE in deterministic primary-key order, strictly
AFTER the parent row lock and strictly BEFORE any signature read,
in BOTH the shared existing/raced-link validation helper and the
P2 pristine predicate (before the seed anatomy comparison and the
delete-and-replace). The helper's volatility was revised from
STABLE to VOLATILE because PostgreSQL forbids row locking in a
STABLE function; it remains internal, SECURITY DEFINER with a
pinned search_path, and EXECUTE-revoked. The assumption that NEW
child inserts are serialized by the parent FK/row lock was proven
against PostgreSQL (the probe's error context shows the RI
trigger's FOR KEY SHARE wait behind the parent FOR UPDATE) instead
of being documented. The P2 correction UPDATE was tightened to
scope by id AND user_id — defensively, not as a substitute for the
child locking. Test-instrumentation note, recorded honestly: the
first lock probes failed not because blocking was absent (the
error contexts already showed the competing writes waiting) but
because plpgsql's WHEN OTHERS deliberately excludes QUERY_CANCELED
(SQLSTATE 57014), which is exactly what the probes' remote
statement_timeout propagates as; the handlers were rewritten to
catch query_canceled explicitly.

## 8. Implementation dependency map (later, explicitly gated)

1. Codex review of this package; any contract deviation found here
   reopens EXLIB-2D only if it is a genuinely new architectural
   contradiction.
2. Apply-prep phase: move the byte-identical proposal into
   supabase/migrations/026_exlib_plank_reconciliation.sql with the
   labeled verifier retargets that the "026 absent" boundary checks
   require, plus final fingerprint records. NOT this phase.
3. Application by Joseph/ChatGPT ONLY, to the ShredOS project only,
   with the standard application record.
4. Seed module edit (tracking_mode AND anatomy) in the SAME atomic
   release as delivery enablement, per the approved sequencing; the
   inventory seed_link_compatible flip is a global artifact fact in
   that coordinated state.
5. Plank instructional content authoring and its review lifecycle.

## 9. Boundaries

This package approves NOTHING and applies NOTHING. Migration 026
does not exist in supabase/migrations/. The seed module, inventory,
review ledger, legacy-candidate eligibility, and all 126 pending
content records are byte-unchanged. No push, promotion, tag, or
hosted contact occurred.
