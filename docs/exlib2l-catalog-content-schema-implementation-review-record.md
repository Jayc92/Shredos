# EXLIB-2L — implementation review record (proposal hardening)

Recorded 2026-09-02 (UTC); CORRECTED REVISION C. This is Claude's
OWN implementation review of
docs/exlib2l-catalog-content-schema-proposal.sql — a self-review
performed before submission for Codex re-review. It is NOT a
specialist, human, or Codex approval, and it approves nothing: the
proposal remains an UNAPPLIED draft in docs/ awaiting Codex
re-review, and only Joseph/ChatGPT may ever apply migrations. No
hosted service was contacted at any point in this milestone; every
live check ran on DISPOSABLE local PostgreSQL 16.15 clusters
(unix-socket only, no TCP, created and destroyed by the harness).

## 1. What was reviewed, against what

The corrected proposal (final bytes: 78,468 B, SHA-256
9a0505c8f2fea3f4330e7c80e22ffd8bc6867760b335a7468ea4587f0bd70553)
was checked line-by-line against:

- the two blocking Codex round-2 findings (the corrective
  instruction of 2026-09-02), with round 2's confirmation that the
  four round-1 findings are corrected and its acceptance of the five
  residual judgment items as documented;
- the four Codex round-1 findings and their accepted corrections
  (which must not regress);
- the promoted EXLIB-2A architecture record (pseudocode,
  vocabularies, RLS/ACL posture, publication lifecycle, freeze
  conventions);
- migration 023's committed bytes (the tables/triggers it extends,
  the review-audit CHECK pattern, the single-transaction policy, the
  Revision-G lock pattern, the one-active-snapshot partial unique
  index, the house naming convention);
- migrations 024-026 (nothing they define may change);
- the EXLIB-2I/2J contracts (complete non-blank review evidence
  BEFORE a later, separately authorized fingerprint-bound
  admission);
- the EXLIB-2L instruction's schema requirements and prohibited
  list.

## 2. The two Codex round-2 findings and their corrections

1. PUBLISHED-VERSION MUTATION WINDOW (round-2 finding 1): revision
   B's identity-wide live relationship table required moving the
   live rows from set A to set B before version 2 could be admitted,
   silently changing still-published version 1's observable
   relationship meaning and leaving it published-but-stale until a
   later publication attempt. CORRECTED with design shape B
   (expected/staged relationships + atomic publication projection):
   the version-owned expected set is the reviewed/admitted source of
   truth; admission binds it through the v2 manifest and never
   touches the live surface; exercise_catalog_relationships is now a
   TRIGGER-PROTECTED PROJECTION that always equals the currently
   published version's expected set and changes ONLY inside
   publish_catalog_content's single transaction (retire prior ->
   delete projection -> insert new expected set -> publish) under
   the logical-identity lock and a transaction-local sentinel.
   Direct INSERT/UPDATE/DELETE fails closed for every caller
   including the table owner; the content freeze trigger
   additionally re-verifies projected-set equality and manifest
   freshness at the moment any row becomes published, so even
   sentinel-abusing break-glass writes cannot pair a published
   version with a wrong set. The invariant is structural and
   transactional — live-proven end to end: version 1 published with
   set A stays published, observably unchanged, AND manifest-fresh
   while version 2 is staged, reviewed, and admitted with set B; a
   failed version-2 publication leaves version 1/A byte-exact; a
   successful one atomically retires version 1 and activates exactly
   B. The manifest format was bumped to
   'EXLIB-ADMISSION-MANIFEST v2' for this change (v1's live-surface
   section removed; the version-owned expected set is the bound
   relationship truth), exercising the versioned-manifest
   discipline.
2. TWO AUTHORITIES CLAIMED AS FOUR (round-2 finding 2): revision B
   created only admission and publication roles while loading and
   review application remained owner-side. CORRECTED: four NOLOGIN
   roles now exist, each holding EXECUTE on exactly its own narrow
   SECURITY DEFINER function(s) and no table privileges:
   exlib_catalog_loader (load_catalog_identity,
   load_catalog_snapshot with anatomy/aliases,
   load_catalog_content_draft with the version-owned expected set),
   exlib_catalog_reviewer (apply_content_review: exactly one legal
   pending decision with a complete non-blank tuple),
   exlib_catalog_admission (admit_catalog_content), and
   exlib_catalog_admin (publish_catalog_content). All functions pin
   search_path, validate lifecycle state themselves, and are
   re-validated by the freeze triggers; the GRANT matrix is
   live-proven exact; ALL TWELVE authority cross-denials are
   live-proven (not only admission-vs-publication), plus
   anon/authenticated denials on all four acts, plus direct-table
   mutation denials for the operational roles. Direct owner-level
   mutation is identified honestly as database-superuser break-glass
   power outside the ordinary operational path, still bound by every
   trigger and CHECK. Post-decision review transitions
   (approved -> revised/rejected) are deliberately NOT an
   operational authority in this proposal.

NO REGRESSION of the accepted round-1 corrections (each re-proven in
the final run): approval before admission; one-time one-way
admission; the complete database-computed SHA-256 manifest with
trigger recomputation; the separate recorded repository SHA-256
(format-validated); deterministic serialization across
locale/session/order differences (hex-encoded UTF8, jsonb canonical
form, day-offset dates, numeric-epoch timestamps, COLLATE "C" row
ordering); safe nonempty migration-023 compatibility with
byte-identical legacy rows and no fabricated metadata; approved-only
publication with terminal revised/rejected; provenance-conditional
source fields; no hosted action or data creation.

## 3. Defects found by THIS review round, and their forward fixes

The revision-C schema passed its live matrix on the first complete
run; one defect was found and fixed in the HARNESS while authoring
it (disclosed for completeness): the manifest reorder-invariance
probe initially computed a manifest for a version under an identity
with no catalog snapshot, which the manifest correctly refuses
(exactly-one-active-snapshot rule) — the probe was restaged onto a
loader-created identity with a complete snapshot. This was a fixture
staging error, not a proposal defect; the manifest behaved exactly
as designed.

Carried from earlier revisions (already fixed there, still true and
still verified): the verbatim-carry proof of the one replaced 023
function, exlib_freeze_catalog_snapshot — outside the marked
8-line/518-byte "EXLIB-2L splice" block, the carried body is
byte-identical to the 023 bytes (4,607 B exact match, measured from
the CREATE OR REPLACE line through the closing $$; delimiter); the
exercise_catalog_provenance_sources_chk naming (the EXLIB-1C0B1
near-name hazard); the single-transaction wrapper; the structural
(trigger-level) publication gate; and the COLLATE "C" manifest
ordering.

## 4. Live verification (scripts/verify-exlib2l-live.sh)

Final result: 135 passed, 0 failed, on a fresh disposable cluster
with TWO databases (nonempty legacy + empty). Coverage, mapped to
the round-2 corrective instruction's 15 required proofs:

1. Version 1 published with relationship set A (L1, after the full
   loader -> reviewer -> admission -> publication pipeline).
2. Version 2 reviewed with set B while version 1/A remains effective
   (L2-L3).
3. Version 2 admitted while version 1/A remains effective — live set
   unchanged, version 1 still published, version 1's manifest STILL
   FRESH (L4-L5: the round-2 window is gone).
4. Failed version-2 publication preserves version 1/A exactly
   (L6-L7: transaction rollback, not cleanup).
5. Successful version-2 publication atomically produces version 2/B
   and retires version 1 (L8-L9).
6. No published row can be paired with another version's
   relationship set (J12: even a direct owner break-glass publish
   with an unprojected set is refused by the trigger's structural
   completeness gate; J2/J7/J8: the projection cannot drift; L10:
   versions' expected rows coexist without collision).
7. Loader cannot review, admit, or publish (M2-M4).
8. Reviewer cannot load, admit, or publish (M5-M7).
9. Admission role cannot load, review, or publish (M8-M10).
10. Publication role cannot load, review, or admit (M11-M13).
11. anon/authenticated cannot perform any of the four acts (M14 x8)
    nor read any new table nor compute fingerprints (M19-M20).
12. Direct non-function lifecycle mutations through operational
    roles fail (M15-M18: no table privileges at all).
13. Empty and legitimate nonempty 001-026 databases still pass
    (D1-D2 with the C-section legacy fixture seeded first; E1-E2
    byte-identical legacy rows, nothing fabricated).
14. Existing 023-026 delivery and rollback remain unchanged (C2 seal
    pre-application; E8-E11 delivery and rollback on the historical
    rows post-application).
15. A second schema application fails and rolls back wholly (D3-D4;
    D5 proves schema application alone creates no lifecycle state).

Plus the preserved round-1 matrices: lifecycle birth/order rules
(F4-F13), reviewer-authority validation and payload/expected
freezing (G1-G9), one-time computed admission with two digests
(H1-H9), the v2 manifest's mechanical artifact-to-database mapping,
SHA-256 shape, DateStyle/TimeZone/JSON-key/row-order invariance and
the absence of any live-surface binding (I1-I8), the Plank model
publishing with exactly its substitution and progression onto bare
target identities (J4-J6), staleness fail-closed through function
AND trigger paths including the missing-bound-surface case (K1-K4),
the legacy workflow gate (K5), RLS/ACL/search_path posture
(M21-M23), and the advisor-equivalent block (N1-N4).

## 5. Advisors: honest limitation statement

Supabase's Database/Security Advisors are hosted platform features;
running them requires contacting the hosted project, which this
milestone forbids (and which Claude may never do). The Supabase
CLI's local lint requires a TCP database URL, while the standing
security rule mandates socket-only disposable clusters. LOCAL
EQUIVALENTS of the advisor rules relevant to this change were run
instead and pass (suite N1-N4): RLS enabled on every new public
table; no new SECURITY DEFINER function executable by
PUBLIC/anon/authenticated; every new foreign key covered by a
leading-column index; no MD5 anywhere in the new function bodies.
These local checks are NOT a substitute for the hosted advisors,
which the authorized operator must re-run after any future approved
application.

## 6. Residual review items for Codex

1. The projection sentinel is a transaction-local GUC
   ('exlib.relationship_projection_identity'); a break-glass
   superuser can set it manually, but the content freeze trigger's
   publication-time equality and freshness checks still hold (J12
   proves the closing gate). Confirm this two-layer posture is
   acceptable, or whether the sentinel should be hardened further
   (e.g., a nonce checked between function and trigger).
2. The manifest binds the snapshot's classification but NOT the
   snapshot's own review_status/review evidence (023's snapshot
   review axis is delivery's gate); the deactivation case is still
   fail-closed via the exactly-one-active rule. Accepted round 2 as
   documented; restated for the new revision.
3. admitted_source_sha256 remains a RECORDED provenance fact
   (format-validated 64-hex). Accepted round 2 as documented.
4. The four NOLOGIN roles are created idempotently
   (pg_roles-guarded); the guard is live-proven by the second
   database's clean application. Confirm the desired posture for the
   hosted cluster.
5. Post-decision review transitions (approved -> revised|rejected)
   have NO operational authority in this proposal (the trigger
   permits them with fresh evidence, reachable only via break-glass)
   — a future milestone can add a dedicated authority if the product
   needs it operationally. Confirm this boundary.
6. apply_content_review takes the reviewer-supplied timestamp as a
   parameter (matching EXLIB-2I's exact human timestamp practice)
   rather than stamping NOW(); confirm this is the intended
   evidence model.
