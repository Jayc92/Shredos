# EXLIB-2K — hosted-load application record

Recorded 2026-09-03 (UTC). APPLICATION EVIDENCE ONLY — this record
documents that the reviewed EXLIB-2K Plank catalog-load package WAS
EXECUTED ONCE against the hosted ShredOS Supabase project by the
authorized operator path, and preserves the operator-confirmed proof.
The hosted execution and every hosted check were performed by ChatGPT,
NOT by Claude: Claude made no hosted contact in this phase and never
executes load packages. This record itself approves NOTHING further:
database content review, eligibility admission, publication, sealing,
revocation, delivery, run creation, the seed module edit, and the
inventory seed_link_compatible flip all remain separately gated — and
review, admission, and publication are additionally BLOCKED by the
target-snapshot gate in section 5.

## 1. Execution facts

- Executed by: ChatGPT (the Joseph/ChatGPT-only execution path; never
  by Claude), against the ShredOS Supabase project ttybyljytiwntvorugcv
  ONLY.
- Executed package: docs/exlib2k-plank-catalog-load-package.sql at
  main = 2d80603bfcf6568da8ab79457e5745a77b7fafd6 (tag
  exlib2k-hosted-authority-correction-reviewed-not-executed, tag
  object fb096db737816b23c581e8dd5561cad4fdc1d789), 29,760 bytes,
  SHA-256
  a1b6dd55850c5d544e2f484d1ce4833b41deec7f3dd4d4c2373cb3b50daaccf0.
  The package file remains byte-identical after execution; any byte
  change would void its reviewed status.
- The exact promoted package executed ONCE and COMMITTED successfully.
- Hosted creation timestamp: 2026-09-03 04:40:12.816865 UTC
  = 2026-09-03 00:40:12.816865 Eastern (EDT).
- This is a DATA-LOAD package: it creates NO migration-history entry.
  The hosted migration-history table still contains exactly the
  established six entries evidenced by the promoted EXLIB-2F and
  EXLIB-2M application records
  (20260813034632_phase5b2_nutrition_day_status,
  20260824135804_exlib_catalog_and_delivery_contract_revision_h,
  20260824174252_exlib_post_application_hardening,
  20260826203154_exlib_equipment_vocabulary_support,
  20260901032229_exlib_plank_seed_reconciliation_026,
  20260902194541_exlib_catalog_content_schema_027). The REPOSITORY
  migration sequence in effect on hosted remains exactly 001-027.
- The package is ONE-USE by design and is now SPENT on this project:
  its ten-table empty-surface precondition means a second execution
  fails closed before any write, exactly as documented and as proven
  by the promoted live-harness one-use checks.

## 2. Pre-execution gates (operator-confirmed by ChatGPT)

- Project identity exact — ShredOS, ttybyljytiwntvorugcv — and status
  ACTIVE_HEALTHY.
- PostgreSQL 17.6.
- Repository migrations 001-027 are in effect; the migration-history
  table contains the six entries above and nothing newer.
- current_user = postgres AND session_user = postgres (the package's
  dual-identity gate).
- postgres is NOT a superuser.
- Exact initial loader membership — GRANTOR INCLUDED — was the
  reviewed hosted baseline: exactly one row, supabase_admin ->
  postgres, ADMIN TRUE, INHERIT FALSE, SET FALSE.
- All TEN catalog tables were empty (the one-use fresh-load gate).
- Existing exercises count was 84.

## 3. Operator-confirmed hosted proof (post-execution)

The following facts were confirmed against the hosted database by
ChatGPT's post-execution proof. Claude did not contact the hosted
database; the EXPECTED-STATE facts below are additionally
cross-checked mechanically against the executed package's own
postconditions and the admitted authoring artifact by
scripts/verify-exlib2k-application.ts, and the HOSTED-STATE facts are
recorded on ChatGPT's operator-path authority.

Loader returns:

- Content UUID: e21b2c00-0000-4000-a000-000000000101
- Logical UUID: e21b2c00-0000-4000-a000-000000000001
- Content version: 1
- Expected relationships: 2

Exact post-execution counts (matching the package's own fail-closed
postconditions row for row):

- exercise_catalog_logical: 3
- exercise_catalog: 1
- exercise_catalog_muscles: 2
- exercise_catalog_aliases: 2
- exercise_catalog_name_claims: 3
- exercise_catalog_content: 1
- exercise_catalog_content_expected_relationships: 2
- exercise_catalog_relationships: 0
- exercise_catalog_import_runs: 0
- exercise_catalog_run_items: 0
- exercises: 84, unchanged.

Exact loaded state (byte-equal to the admitted artifact and the
reviewed package arguments):

- The Plank snapshot is active, with canonical_name = Plank,
  category = isolation, primary_muscle = abs, equipment = bodyweight,
  laterality = bilateral, tracking_mode = timed,
  provenance = forgefitos_original,
  movement_pattern = core_anti_extension, training_role = core,
  difficulty = beginner, availability = minimal, and snapshot
  review_status = pending.
- Content lifecycle: content_status = pending,
  publication_status = draft, import_admitted = false; the admitted
  fingerprint, admitted source SHA, and admitted timestamp are all
  null; the reviewer identity, review timestamp, and review rationale
  are all null; NO publication projection exists.
- Name claims (normalized): plank / canonical, front plank / alias,
  forearm plank / alias — all three owned by the Plank logical UUID.
  exlib_verify_catalog_claims() returned orphaned_claims = 0 and
  unclaimed_bearers = 0.
- Anatomy: obliques / secondary, lower_back / tertiary.
- Expected relationships: substitution ->
  e21b2c00-0000-4000-a000-000000000002 and progression ->
  e21b2c00-0000-4000-a000-000000000003.

## 4. Authority restoration (operator-confirmed)

- Exactly ONE exlib_catalog_loader membership remains for postgres.
- Its grantor is supabase_admin, with ADMIN TRUE, INHERIT FALSE,
  SET FALSE — the exact reviewed baseline, grantor included.
- The temporary postgres-granted SET membership is ABSENT.
- pg_has_role(postgres, exlib_catalog_loader, 'SET') = false.
- No persistent authority widening occurred: the package's
  transaction-contained elevation was created and exactly restored
  inside the single committed transaction, precisely as reviewed.

## 5. The evidence distinction (target-snapshot gate — still open)

The two expected-relationship rows carry INTENDED assignments from the
reviewed package: substitution -> Dead bug
(e21b2c00-0000-4000-a000-000000000002) and progression ->
Ab wheel rollout (e21b2c00-0000-4000-a000-000000000003) are the
package's documented intent, sourced from the admitted artifact.
Hosted state currently contains BARE IDENTITY UUIDs ONLY for those two
targets: it does NOT yet independently prove that the target UUIDs
have active canonical snapshots named Dead bug and Ab wheel rollout.
That proof is the separate, fail-closed TARGET-SNAPSHOT GATE
established in the promoted load-preparation record. Database content
review, eligibility admission, and publication remain BLOCKED until
that gate is separately satisfied; this record neither performs nor
waives it.

## 6. Hosted advisors (run by ChatGPT, never Claude)

- BOTH hosted advisor classes — the Supabase SECURITY advisor and the
  Supabase PERFORMANCE advisor — were run by ChatGPT after this
  execution.
- NEITHER advisor result is claimed to be globally clean. This record
  states only what was established: NO package-specific ERROR and NO
  migration-blocking result was identified.
- SECURITY's RLS-enabled-with-no-policy INFO notices on the catalog
  tables reflect the INTENTIONAL deny-by-default posture: RLS enabled,
  zero policies, client DML revoked — exactly the reviewed design.
- Broader existing project notices were NOT introduced, NOT fixed, and
  NOT adjudicated in this milestone; they belong to their own future
  operator decisions.

## 7. Verification honesty note

Two initial post-execution verification queries used incorrect
INFERRED table/column names and failed READ-ONLY. They performed no
mutation of any kind. The corrected verification queries were derived
from the committed package and migration-027 schema and passed; the
facts in sections 3 and 4 are from the corrected, passing queries.

## 8. What this execution did NOT do

No database content review, eligibility admission, publication, seal,
revocation, delivery, import run, or run item exists or occurred (the
import-run and run-item counts are ZERO by design — runs bind to
DELIVERY, not loading). The seed module is byte-unchanged; the
inventory's Plank seed_link_compatible remains false; the review
ledger remains 48/48 pending with null reviewers; all 26 legacy
candidates remain import_eligible: false; the admitted Plank authoring
artifact remains byte-frozen (2,928 B / d82078490efa9ef13e128e7b7b742f
bda8ea9e74e32382252d96c326c679d752). exercises remains exactly 84 and
untouched — nothing in the runtime, API, UI, dependencies, or
configuration changed.

## 9. Verifier lifecycle for this milestone

- scripts/verify-exlib2k.ts carried the load-preparation phases'
  PREPARED — NOT EXECUTED posture. It is revised under the explicit
  label `RETARGET (EXLIB-2K hosted-load application record)`: that
  posture is anchored to the promoted correction tip
  2d80603bfcf6568da8ab79457e5745a77b7fafd6 (whose tree provably
  contains no application record), while this record now legitimately
  exists in the live tree. The package header's PREPARED — NOT
  EXECUTED status, the load-preparation record's not-executed
  statements, the hosted-authority correction record's
  future-execution statement, and the promoted tag annotation are all
  byte-frozen history that remain true AS WRITTEN of their own phases;
  no historical proof was weakened, and the suite's totals are
  unchanged (27/0).
- scripts/verify-exlib2k-application.ts (new) owns the executed-state
  posture from this milestone forward: execution facts pinned verbatim
  with ChatGPT attribution, the expected-state facts cross-checked
  against the executed package's own postconditions and the admitted
  artifact, the target-snapshot-gate distinction held open, authority
  restoration pinned grantor-included, advisor precision enforced, the
  honesty note pinned, boundaries re-proven, and the lifecycle
  two-state check (no application record at the promoted correction
  tip; exactly this one in the live tree).

## 10. Dependency map (later, explicitly gated)

1. Codex review of this evidence milestone; push/promotion/tag are
   separate explicit gates.
2. The TARGET-SNAPSHOT GATE: hosted proof that
   e21b2c00-0000-4000-a000-000000000002 and
   e21b2c00-0000-4000-a000-000000000003 carry active canonical
   snapshots named Dead bug and Ab wheel rollout — never swapped,
   missing, inactive, or ambiguous — before any review, admission, or
   publication of the loaded Plank content.
3. Database content review, eligibility admission, and publication of
   the loaded content remain their own authority-gated acts
   (exlib_catalog_reviewer / exlib_catalog_admission /
   exlib_catalog_admin), each requiring explicit instruction.
4. The seed module edit and the inventory seed_link_compatible flip
   remain facts of the later coordinated delivery-activation release.
5. Any future catalog loading beyond Plank requires its own authored,
   reviewed, and admitted artifacts and its own reviewed load package;
   this package is spent.
