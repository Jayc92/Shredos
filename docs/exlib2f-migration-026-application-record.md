# EXLIB-2F — migration-026 hosted-application record

Recorded 2026-09-01 (UTC). APPLICATION EVIDENCE ONLY — this record
documents that migration 026 WAS APPLIED to the hosted ShredOS
Supabase project by the authorized operator path, and preserves the
operator-confirmed post-application proof. This record itself
approves NOTHING further: the seed module edit, Plank instructional
content authoring, the inventory seed_link_compatible flip, catalog
loading, content approval or publication, and every eligibility or
review-ledger change all remain separately gated. Claude made no
hosted contact in this phase and never applies migrations.

## 1. Application facts

- Applied by: ChatGPT (the Joseph/ChatGPT-only application path;
  never by Claude), to the ShredOS Supabase project
  ttybyljytiwntvorugcv ONLY.
- Hosted migration history entry, verbatim:
  20260901032229_exlib_plank_seed_reconciliation_026
- Applied at: 2026-09-01 03:22:29 UTC = 2026-08-31 23:22:29 Eastern
  (EDT) — August 31 Eastern / September 1 UTC.
- Applied artifact: the promoted EXLIB-2F candidate
  supabase/migrations/026_exlib_plank_seed_reconciliation.sql at
  main = bc8a5e20343aa1f83832627f78891632ee61f897 (tag
  exlib2f-migration-026-apply-prep-reviewed-not-applied, tag object
  55c3005b40858aa30030e036ddbb1bf2d43409d6), 33,294 bytes, SHA-256
  620185b62c589c55fb30a237589589f46002a9d6c391b9ab936e07a6641cf4bc;
  its executable SQL is byte-identical to the Codex-reviewed
  proposal docs/exlib2e-migration-026-proposal.sql (32,500 bytes,
  SHA-256
  a6696066d178ced7e53bf81e7106cce64a87e2c73d9b342464d930a2fe3c2108).
  The candidate file remains byte-identical after application; any
  byte change would void the reviewed/applied status.
- Hosted migrations now applied: 001-026 (023 applied 2026-08-24 as
  20260824135804, 024 applied 2026-08-24 as 20260824174252, 026
  applied as above).

## 2. Operator-confirmed hosted proof (post-application)

The following facts were confirmed against the hosted database by
the operator-provided proof accompanying the application. Claude did
not contact the hosted database; the structural facts below are
additionally cross-checked mechanically against the applied
candidate's SQL by scripts/verify-exlib2f-application.ts, and the
data-state facts are recorded on operator authority.

Structural (also derivable from the applied SQL):
- exercise_catalog_corrections exists with exactly 5 columns
  (user_id, exercise_id, import_run_id, catalog_logical_id,
  corrected_at), 4 constraints (the tenant-scoped PRIMARY KEY
  (user_id, exercise_id) plus three FOREIGN KEYs), and 2 indexes
  (the primary-key index plus
  exercise_catalog_corrections_run_idx on import_run_id).
- All three foreign keys are ON DELETE RESTRICT: the composite
  (user_id, exercise_id) -> exercises (user_id, id),
  import_run_id -> exercise_catalog_import_runs (id), and
  catalog_logical_id -> exercise_catalog_logical (id).
- Row Level Security is ENABLED on the correction table with ZERO
  policies (deny-by-default), and clients hold NO DML privileges
  (REVOKE ALL FROM PUBLIC, anon, authenticated).
- exlib_plank_link_valid is VOLATILE, SECURITY DEFINER, with the
  fixed search_path (public, pg_temp), and client EXECUTE is
  revoked (PUBLIC, anon, authenticated).
- deliver_catalog_exercises and rollback_catalog_delivery retain
  authenticated-only execution: the candidate issues no GRANT or
  REVOKE on either function, so CREATE OR REPLACE preserved the
  migration-023 ACLs (REVOKE from PUBLIC/anon; EXECUTE granted to
  authenticated).

Data state (operator-confirmed; unchanged by the migration):
- exercises count remains 84.
- exercise_catalog, exercise_catalog_import_runs,
  exercise_catalog_run_items, and exercise_catalog_corrections
  counts all remain ZERO — the migration performed no delivery, no
  correction, and no data mutation, exactly as designed: it only
  created the correction table and replaced the two function
  bodies (plus the new internal helper).

## 3. What the application did NOT do

No catalog snapshot, import run, run item, or correction row exists.
No delivery to any user occurred and none is authorized. The seed
module is byte-unchanged; no Plank instructional content exists; the
inventory's Plank seed_link_compatible remains false (the flip is a
coordinated later release fact); the review ledger remains 48/48
pending with null reviewers; all 26 legacy candidates remain
import_eligible: false; all 126 authored release-1 records remain
pending/evidence-null/import-ineligible/unpublished. weight_time
remains unimplemented.

## 4. Verifier lifecycle for this milestone

- scripts/verify-exlib2f.ts C2 carried the live claim "no
  application record exists for 026" — true throughout the
  apply-prep phase and now superseded by this authorized milestone.
  It is revised under the explicit label
  `RETARGET (EXLIB-2F application record)`: the
  prepared-not-applied posture of the apply-prep PHASE is anchored
  to the apply-prep tip bc8a5e2 (whose tree provably contains no
  application record), while this record now legitimately exists in
  the live tree. The candidate-header and apply-prep-record pins are
  unchanged — those artifacts are byte-frozen history whose
  statements were true when written.
- scripts/verify-exlib2f-application.ts (new) owns the
  applied-state posture from this milestone forward: application
  facts pinned verbatim, structural proof cross-checked against the
  applied SQL, operator-attributed data facts pinned with
  attribution, source fingerprints held, boundaries re-proven, and
  the lifecycle two-state check.

## 5. Dependency map (later, explicitly gated)

1. Codex review of this evidence milestone; push/promotion/tag are
   separate explicit gates.
2. Seed module edit (Plank tracking_mode AND anatomy) in the SAME
   atomic release as delivery enablement, per the approved
   sequencing; the inventory seed_link_compatible flip is a global
   artifact fact of that coordinated state.
3. Plank instructional content authoring and its review lifecycle.
4. Any catalog snapshot/run creation, approval, sealing, loading, or
   delivery — all remain unauthorized.
