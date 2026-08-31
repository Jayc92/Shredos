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
exactly the two CREATE OR REPLACE statements plus the correction
table, and CREATE OR REPLACE preserves the existing 023 ACLs
(REVOKE from PUBLIC/anon; EXECUTE granted to authenticated).

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
  validated against the full invariant set (timed/mobility, active
  approved snapshot, recorded authorized run, exact catalog anatomy
  multiset, canonical-or-distinguished name with the matching claim
  held by that row); it no-ops ONLY if every invariant passes
  (already_valid_idempotent), otherwise the entire delivery aborts
  with the inconsistent-prior-reconciliation exception — no silent
  repair, relink, anatomy overwrite, or rename (proven: a corrupted
  link aborts and stays corrupted for separate investigation).
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

66 checks, 66/0 on a socket-only disposable cluster (no hosted
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
the corrected row is never reinterpreted; and the two-database
compatibility proof.

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
