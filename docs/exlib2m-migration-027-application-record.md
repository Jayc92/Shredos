# EXLIB-2M — migration-027 hosted-application record

Recorded 2026-09-02 (UTC). APPLICATION EVIDENCE ONLY — this record
documents that migration 027 WAS APPLIED to the hosted ShredOS
Supabase project by the authorized operator path, and preserves the
operator-confirmed post-application proof. The hosted application and
every hosted check were performed by ChatGPT, NOT by Claude: Claude
made no hosted contact in this phase and never applies migrations.
This record itself approves NOTHING further: catalog loading, run
creation, content review, eligibility admission, publication,
sealing, revocation, delivery, the seed module edit, and the
inventory seed_link_compatible flip all remain separately gated.

## 1. Application facts

- Applied by: ChatGPT (the Joseph/ChatGPT-only application path;
  never by Claude), to the ShredOS Supabase project
  ttybyljytiwntvorugcv ONLY.
- Hosted migration history entry, verbatim:
  20260902194541_exlib_catalog_content_schema_027
- Applied at: 2026-09-02 19:45:41 UTC = 2026-09-02 15:45:41 Eastern
  (EDT).
- Pre-application physical recovery point: 2026-09-01 13:09:47 UTC
  (recorded operator fact; recovery remains a separate operator
  capability, never an automatic act).
- Applied artifact: the promoted EXLIB-2M candidate
  supabase/migrations/027_exlib_catalog_content_schema.sql at
  main = 66905d7464d3f9cc84bb07a3dc8f2062ac6b7745 (tag
  exlib2m-migration-027-apply-prep-reviewed-not-applied, tag object
  51965199307b1d8d7db3920736d559d2ecab5ae5), 65,455 bytes, SHA-256
  90d53aaf8fd341dd99bab22b7d1ca280ec24b8ccee2a28efca6e835e0585a14f;
  its executable SQL is byte-identical to the Codex-reviewed,
  promoted EXLIB-2L proposal
  docs/exlib2l-catalog-content-schema-proposal.sql (78,468 bytes,
  SHA-256
  9a0505c8f2fea3f4330e7c80e22ffd8bc6867760b335a7468ea4587f0bd70553;
  shared executable body 63,180 bytes, SHA-256
  ba28780f9544b1d3169938116d9babcc58bbcbe05218989e44bfae347793544f).
  The candidate file remains byte-identical after application; any
  byte change would void the reviewed/applied status.
- Repository vs hosted history, precisely distinguished: the
  REPOSITORY schema/migration sequence effective on hosted ShredOS
  is now 001-027 (all twenty-seven numbered repository migrations
  are in effect). Supabase's hosted migration-history TABLE is a
  different object with its own entry names; the operator-provided
  proof establishes the new entry verbatim above, which joins the
  five entries evidenced verbatim in the promoted EXLIB-2F
  application record (20260813034632_phase5b2_nutrition_day_status,
  20260824135804_exlib_catalog_and_delivery_contract_revision_h,
  20260824174252_exlib_post_application_hardening,
  20260826203154_exlib_equipment_vocabulary_support,
  20260901032229_exlib_plank_seed_reconciliation_026) — six entries
  in total, derived from that committed evidence plus this
  operator-provided entry.

## 2. Operator-confirmed hosted proof (post-application)

The following facts were confirmed against the hosted database by
ChatGPT's post-application proof accompanying the application.
Claude did not contact the hosted database; the STRUCTURAL facts
below are additionally cross-checked mechanically against the
applied candidate's SQL by scripts/verify-exlib2m-application.ts,
and the DATA-STATE facts are recorded on ChatGPT's operator-path
authority.

Structural (also derivable from the applied SQL):
- All four operational roles exist and are NOLOGIN:
  exlib_catalog_loader, exlib_catalog_reviewer,
  exlib_catalog_admission, exlib_catalog_admin.
- All six operational functions (load_catalog_identity,
  load_catalog_snapshot, load_catalog_content_draft,
  apply_content_review, admit_catalog_content,
  publish_catalog_content) have the exact intended authority
  grants — each executable by exactly its one owning role.
- The ACL matrix had 0 mismatches across 42 function/role
  combinations.
- All six functions are SECURITY DEFINER with fixed
  search_path = public, pg_temp.
- exercise_catalog_content,
  exercise_catalog_content_expected_relationships, and
  exercise_catalog_relationships exist with Row Level Security
  ENABLED and ZERO policies (deny-by-default; clients hold no DML
  privileges — REVOKE ALL FROM PUBLIC, anon, authenticated).

Data state (ChatGPT-confirmed; unchanged by the migration):
- exercise_catalog_content,
  exercise_catalog_content_expected_relationships, and
  exercise_catalog_relationships contain ZERO rows.
- Logical-identity, snapshot, import-run, and run-item counts remain
  ZERO.
- exercises remains exactly 84.
- Nothing was loaded, reviewed, admitted, published, sealed,
  delivered, revoked, or otherwise lifecycle-mutated — the migration
  created schema and lifecycle authorities only, exactly as its
  header states.

Hosted advisors (run by ChatGPT, never Claude; evidence-precision
correction — an earlier revision of this record wrongly deferred
this to a later operator action):
- BOTH hosted advisor classes — the Supabase SECURITY advisor and
  the Supabase PERFORMANCE advisor — were run by ChatGPT immediately
  after applying migration 027.
- NEITHER advisor returned an ERROR or migration-blocking finding.
  This is stated precisely; neither advisor result is claimed to be
  globally clean.
- SECURITY reported RLS-enabled-with-no-policy INFO notices for the
  three new tables (exercise_catalog_content,
  exercise_catalog_content_expected_relationships,
  exercise_catalog_relationships). That posture is INTENTIONAL
  deny-by-default: RLS is enabled, zero policies exist, and client
  DML privileges are revoked — exactly the reviewed design.
- PERFORMANCE reported expected unused-index INFO notices on the
  new, empty catalog structures, including
  exercise_catalog_content_logical_idx,
  exercise_catalog_content_expected_relationships_target_idx, and
  exercise_catalog_relationships_to_idx — expected for freshly
  created indexes on zero-row tables.
- The advisor output also contained broader project notices outside
  this evidence milestone. Those are NOT claimed to be fixed, NOT
  introduced by migration 027, and NOT adjudicated here.

## 3. What the application did NOT do

No catalog identity, snapshot, anatomy row, alias, content version,
expected relationship, live relationship, import run, run item,
review decision, admission, publication, seal, revocation, or
delivery exists or occurred. The seed module is byte-unchanged; the
inventory's Plank seed_link_compatible remains false; the review
ledger remains 48/48 pending with null reviewers; all 26 legacy
candidates remain import_eligible: false; the admitted Plank
authoring artifact remains byte-frozen (2,928 B / d82078490efa9ef13e
128e7b7b742fbda8ea9e74e32382252d96c326c679d752) with its human
review and R6 eligibility admission untouched. EXLIB-2K (the Plank
catalog LOAD) remains DEFERRED: the schema it was blocked on now
exists on hosted, but loading is its own separately gated, reviewed
milestone.

## 4. Verifier lifecycle for this milestone

- scripts/verify-exlib2m.ts carried the apply-prep phase's
  prepared-not-applied posture. It is revised under the explicit
  label `RETARGET (EXLIB-2M application record)`: that posture is
  anchored to the apply-prep tip
  66905d7464d3f9cc84bb07a3dc8f2062ac6b7745 (whose tree provably
  contains no application record), while this record now
  legitimately exists in the live tree. The migration header's
  "NOT APPLIED during EXLIB-2M" statement and the apply-prep
  record's statements are byte-frozen history that remain true AS
  WRITTEN of their own phase; no historical proof was weakened, and
  the suite's totals are unchanged (20/0).
- scripts/verify-exlib2m-application.ts (new) owns the
  applied-state posture from this milestone forward: application
  facts pinned verbatim with ChatGPT attribution, structural proof
  cross-checked against the applied SQL, data-state facts pinned
  with attribution, source fingerprints held, boundaries re-proven,
  and the lifecycle two-state check (no application record at the
  apply-prep tip; exactly this one in the live tree).

## 5. Dependency map (later, explicitly gated)

1. Codex review of this evidence milestone; push/promotion/tag are
   separate explicit gates.
2. EXLIB-2K resumption — the Plank catalog LOAD against the now-
   applied schema — requires its own reviewed load package and
   explicit operator instruction (loader-authority invocation is
   procedurally gated).
3. Content review, admission, and publication of any loaded content
   remain their own authority-gated acts.
4. The seed module edit and the inventory seed_link_compatible flip
   remain facts of the later coordinated delivery-activation
   release.
5. Hosted advisors: ALREADY RUN by ChatGPT immediately after this
   application (see the advisor evidence in section 2) — no ERROR or
   application-blocking finding; the broader project notices outside
   this milestone remain unadjudicated and belong to their own future
   operator decisions. (The local EXLIB-2L/2M reviews' statements
   that advisors could not run in those LOCAL-ONLY phases remain
   byte-frozen history, true as written of their own phases.)
