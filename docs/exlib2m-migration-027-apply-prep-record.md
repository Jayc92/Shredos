# EXLIB-2M — migration-027 apply-preparation record

Recorded 2026-09-02 (UTC). LOCAL-ONLY apply-preparation milestone:
this phase creates and validates the REAL migration-027 candidate
locally and DOES NOT apply it to hosted Supabase or any persistent
project database. Migration 027 is PREPARED, NOT APPLIED; hosted
application remains Joseph/ChatGPT-only under its own future explicit
instruction and evidence trail. No hosted service was contacted at
any point in this milestone; every live check ran on DISPOSABLE local
PostgreSQL 16.15 clusters (unix-socket only, no TCP, created and
destroyed by the harness). This record APPROVES NOTHING; it awaits
Codex review.

## 1. Source refs, tag object, and fingerprints (the strict gate)

Verified after a fresh fetch, all exact:

- main = origin/main = 8289de5ef2f557fced97b9db88647b776a94b1bc,
  tree 3ef8c20908a708ea3c777f88a04e530f0ea9f071;
- annotated tag
  exlib2l-catalog-content-schema-proposal-reviewed-unapplied:
  TAG OBJECT 6301083c9d95caf46e3fe6bb61db9537ae04f1d1 (local and
  remote identical; a true annotated tag), peeling exactly to main,
  annotation byte-exact "EXLIB-2L catalog content schema proposal
  reviewed — NOT APPLIED";
- clean worktree/index/stash at the gate; migrations exactly 001-026
  with no 027 before this phase; the reviewed proposal only under
  docs/;
- reviewed proposal 78,468 B / 9a0505c8f2fea3f4330e7c80e22ffd8bc686
  7760b335a7468ea4587f0bd70553; design record 27,813 B / 7b19dc0f...;
  implementation review record 12,419 B / 2be533a6...;
- gate validation: EXLIB-2L static 40/0, EXLIB-2L live 135/0,
  complete battery exactly 73 suites / 6,688 / 0, production build
  clean (exit 0), tsc clean, no hosted contact.

Work branch: exlib2m-migration-027-apply-prep (created from main).

## 2. The proposal-to-migration transformation

Created exactly supabase/migrations/027_exlib_catalog_content_schema.sql
(65,455 B, SHA-256
90d53aaf8fd341dd99bab22b7d1ca280ec24b8ccee2a28efca6e835e0585a14f).
The reviewed proposal docs/exlib2l-catalog-content-schema-proposal.sql
is RETAINED UNCHANGED at its promoted fingerprint — not moved, not
deleted, not edited.

Transformation, mechanically defined and mechanically proven:

- the proposal's leading status/header commentary (exactly its first
  253 lines, all comments/blank, ending immediately before the first
  executable line) is REPLACED by the truthful EXLIB-2M candidate
  header;
- the EXECUTABLE BODY — everything from the first executable line
  (BEGIN;) through end-of-file, including every inline and trailing
  comment — is BYTE-IDENTICAL between the two files: 63,180 bytes,
  SHA-256
  ba28780f9544b1d3169938116d9babcc58bbcbe05218989e44bfae347793544f
  on both sides. No executable statement, constraint, function body,
  trigger, role, grant, revoke, manifest field, vocabulary,
  projection rule, lifecycle transition, or rollback boundary was
  changed, including for formatting. (The body's trailing commentary
  retains the reviewed proposal's own wording verbatim — including
  the word "proposal" — preserved by the byte-equivalence mandate
  and disclosed in the candidate header.)

The candidate header states truthfully: EXLIB-2M MIGRATION-027
APPLY-PREP CANDIDATE; reviewed source commit 8289de5...; reviewed
proposal SHA-256 9a0505c8...; prepared for a later explicit hosted
application; NOT APPLIED during EXLIB-2M; hosted application remains
Joseph/ChatGPT-only; migration 027 creates schema and lifecycle
authorities only; it loads no identities, snapshots, anatomy,
aliases, content, relationships, runs, or membership; it performs no
human review, admission, publication, approval, seal, revocation,
delivery, seed edit, or inventory flip; EXLIB-2K remains deferred
until migration 027 is reviewed, applied, and evidenced; and the
023/024/025 single-transaction policy carried from the reviewed
header.

## 3. Historical-verifier lifecycle (every hit, classified)

Mechanical identification: every scripts/verify-* file was scanned
for assumptions that migrations are exactly 001-026, that 027 is
absent, that the EXLIB-2L SQL exists only as a docs proposal, or
that the live repository has no catalog-content schema, and every
battery failure after creating 027 was diagnosed to its exact check.
Classification and action, per the four classes:

CLASS 2 — current repository boundary superseded by EXLIB-2M, revised
under the explicit label RETARGET (EXLIB-2M migration-027
apply-prep). Forty-five verifier files were touched; every one
carries the label. Three retarget shapes were used:

1. SEQUENCE EXTENSION (the established house chain, previously
   extended at 023/024/025/026): live migration-directory boundaries
   extend from exactly-26 to exactly-27 with
   027_exlib_catalog_content_schema.sql pinned (PREPARED, NOT
   APPLIED) and no 028+. Files: verify-exlib1a.ts,
   verify-exlib1b1.ts, verify-exlib1b2.ts, verify-exlib1b3.ts,
   verify-exlib1c0.ts, verify-exlib1c0a.ts, verify-exlib1c0b.ts
   (both its inventory check and its vocabulary-bearing enumeration,
   which gains 027 as the SEVENTH vocabulary-bearing migration),
   verify-exlib1c0b2.ts, verify-exlib1c0b3.ts, verify-exlib1c0b4.ts,
   verify-exlib1c0b5.ts, verify-exlib2a2b.ts,
   verify-exlib2c-batch01..06.ts, verify-exlib2d.ts,
   verify-exlib2f.ts, verify-exlib2f-application.ts,
   verify-food-log-ux.ts, verify-phase5b3.ts, verify-phase5b4.ts,
   verify-phase5b5.ts, verify-ui1a.ts, verify-ui1b.ts,
   verify-ui2.ts, verify-ui3.ts, verify-ui4.ts (two sites),
   verify-ui5a.ts, verify-ui5b1a.ts, verify-ui5b1b.ts,
   verify-ui5b2.ts, verify-ui6a.ts, verify-ui6b.ts, verify-ui6c.ts,
   verify-ui7.ts.
2. TIP ANCHORING (historical phase-bound claims re-anchored to the
   exact promoted tip where they were true): verify-exlib2g.ts (A4
   anchored to the promoted 2G tip b9af2a4; A1's byte-pin of the
   retargeted verify-exlib2f-application.ts follows those exact
   retargeted bytes under the label), verify-exlib2h.ts (A3
   inventory anchored to e6a98f2; B2's
   no-migration-defines-the-content-table claim anchored to e6a98f2
   via git grep), verify-exlib2i.ts (C2 range and inventory anchored
   to 73231e9), verify-exlib2j.ts (C2 range and inventory anchored
   to 2a0465e).
3. THE EXLIB-2L SUITES (instruction-mandated anchoring, NOT
   weakened): verify-exlib2l.ts anchors its no-027/proposal-only/
   five-path claims to the exact promoted EXLIB-2L tip 8289de5 (A3
   inventory via git ls-tree at the tip with the 26 live files still
   byte-compared to the source tip; F2's genuinely-new-names claim
   reads the tip's migrations; G3's phase range anchored to
   source-tip..8289de5) and REMAINS CAPABLE of proving the promoted
   proposal-only milestone — re-proven 40/0 after the retarget.
   verify-exlib2l-live.sh keeps applying migrations 001-026 and then
   the reviewed DOCS proposal exactly once (its loop structurally
   EXCLUDES 027, and its A2 claim is anchored to the tip via git) —
   re-proven 135/0. It can never apply both 027 and the proposal.
   verify-exlib2f-live.sh similarly excludes 027 from all three of
   its loops (its claims stay exactly "001-026 + the reviewed 026
   candidate") — re-proven 100/0.

CLASS 3 — frozen embedded fixtures/historical diffs, untouched:
verify-exlib1c0b3-live.sh and verify-exlib2e-live.sh already exclude
026+ (case guards 02[6-9] from the EXLIB-2F lifecycle), so they are
structurally immune to 027 and were not modified.

CLASS 4 — unrelated text, untouched: verify-exlib1c0b.ts's
DECISION_SHA hex containing the substring "027";
verify-phase3a.ts's year-2027 date-formatting fixture.

CLASS 1 NOTE: no purely historical claim needed a NEW anchor beyond
the tip anchoring listed under shape 2/3; all older suites retain
their original semantic claims at their approved tips.

One byte-pin cascade: verify-exlib2g.ts A1 pins
verify-exlib2f-application.ts by SHA-256; because that file was
retargeted, the pin was updated to the retargeted bytes
(20d5b2e3cb897c29b624e8156528f1af9f5ab4f51fcda5c5f4774e74573db1dd)
under the same label — the standing bound-byte rule.

The remaining pre-commit battery failures during authoring were all
worktree-scope checks (porcelain/scope suites that admit only their
own phase's uncommitted paths); they pass again once the phase
commit lands, exactly as in every prior phase.

## 4. Schema, security, and lifecycle boundaries (unchanged)

Because the executable body is byte-identical to the reviewed
proposal, every reviewed boundary carries over unchanged and was
RE-PROVEN against the real migration file by the new live suite:
four distinct NOLOGIN operational authorities with the exact 6-GRANT
matrix and 27 REVOKEs; no PUBLIC/anon/authenticated/service_role
authority; 13/13 pinned search_paths (10/10 SECURITY DEFINER);
approval strictly before one-time, one-way, travel-alone admission;
the deterministic SHA-256 admission manifest v2 computed from
database state (hex-UTF8 fields, day-offset dates, numeric-epoch
timestamps, jsonb canonical form, COLLATE "C" ordering) with the
separately recorded 64-hex source-artifact digest; version-owned
expected relationships frozen at review; the live relationship table
as a trigger-protected atomic publication projection (sentinel-gated;
owner break-glass still trigger-bound); approved-only publication
with terminal revised/rejected; nonempty migration-023 compatibility
with nothing fabricated; and schema-only application (zero
catalog/content/lifecycle state created).

## 5. Validation totals

- EXLIB-2M live (scripts/verify-exlib2m-live.sh): 151/0 on a fresh
  disposable socket-only PostgreSQL 16.15 cluster — migrations
  001-027 applied FROM supabase/migrations exactly once (explicit
  applied count 27; no 028); the executable-body drift gate runs
  BEFORE any application; the docs proposal is sourced exactly once,
  into the equivalence database eqa only; the complete EXLIB-2L
  behavior matrix reproduced against the real migration file over
  both EMPTY and legitimate NONEMPTY migration-023 starting states
  (authority boundaries and all twelve cross-denials, review ->
  admission -> publication ordering, manifest determinism,
  version-owned staging, atomic projection replacement,
  failed-publication rollback, unchanged 023-026 delivery and
  rollback, zero schema-only state, second application failing
  wholly); and the TWO-DATABASE EQUIVALENCE proof (P1-P14):
  database A (001-026 + reviewed docs proposal) vs database B
  (001-027 only) with identical fixed fixtures — identical
  normalized structure (columns, defaults, nullability, constraints,
  indexes, RLS state, policies, function definitions with
  volatility/security-mode/search_path, triggers, role and routine
  grants), identical legacy-row digests, identical v2 manifest TEXT
  and admitted fingerprints, byte-identical admission/review/
  projection refusals, identical publication and failed-publication
  rollback states, and identical zero-data posture. No semantic
  difference attributable to apply-prep.
- EXLIB-2M static (scripts/verify-exlib2m.ts): totals recorded in
  the review export (run after this record is written; the static
  suite pins this record's required statements).
- Historical: EXLIB-2L static 40/0 and EXLIB-2L live 135/0 (both
  re-proven post-retarget), EXLIB-2J 12/0, EXLIB-2I 14/0, EXLIB-2H
  11/0, EXLIB-2G 15/0, EXLIB-2F static 12/0, EXLIB-2F live 100/0,
  EXLIB-2F application 9/0.
- Full battery, build, tsc, diff --check, hygiene, tree match, and
  clean worktree: run at commit time with honestly reconciled totals
  (the battery grows by the new EXLIB-2M static suite; every
  retarget is count-neutral).

## 6. Prepared-not-applied posture (explicit)

Migration 027 exists ONLY as a reviewed local candidate file. It is
NOT applied to hosted Supabase, NOT applied to any persistent
database, and NOT claimed as applied anywhere. The hosted ShredOS
project was not contacted. Applying migration 027 is a separate,
future, explicitly instructed act (Joseph/ChatGPT-only), with its own
approval, application, and evidence trail. EXLIB-2K (the Plank
catalog load) remains DEFERRED until migration 027 is reviewed,
applied, and evidenced. Plank content, its human review, its
eligibility admission, the seed, seed_link_compatible, the
inventory, the ledger, runtime, APIs, UI, dependencies, and
configuration are all byte-unchanged in this phase.
