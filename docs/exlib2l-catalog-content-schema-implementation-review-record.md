# EXLIB-2L — implementation review record (proposal hardening)

Recorded 2026-09-02 (UTC); CORRECTED REVISION B. This is Claude's
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

The corrected proposal (final bytes: 63,231 B, SHA-256
e42e08f259eda16173db06048b0e930056e0e7631895fa8382768cf68999b0de)
was checked line-by-line against:

- the four blocking Codex round-1 findings (the corrective
  instruction of 2026-09-02);
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

## 2. The four Codex round-1 findings and their corrections

1. REVERSED REVIEW/ADMISSION ORDER (finding 1): revision A required
   admission while pending and froze admission fields at the review
   decision — the reverse of the promoted EXLIB-2I -> EXLIB-2J
   lifecycle. CORRECTED: versions are born pending/draft/UNADMITTED
   (trigger-enforced at INSERT); pending prose is editable; the
   review transition freezes the reviewed payload including the
   version's expected relationship set; ONLY an approved, draft,
   unpublished, currently-unadmitted version may receive its
   one-time admission; the admission transition travels alone,
   cannot precede approval (trigger + structural
   admission-order CHECK + function), cannot accompany review or
   publication changes, cannot target pending/revised/rejected/
   published/retired content, and is one-way; corrections require a
   new version, new review, new admission. A DEDICATED admission
   authority was added (NOLOGIN role exlib_catalog_admission +
   admit_catalog_content) so admission no longer rides on table
   owner access; loading, review application, admission, and
   publication are four distinct authorities and ordinary clients
   hold none (all live-proven, including both cross-denials).
2. INCOMPLETE MD5 FINGERPRINT (finding 2): revision A's
   exlib_content_fingerprint was MD5 over selected instructional
   fields only — it did NOT cover the complete EXLIB-2J artifact,
   and that is stated plainly rather than papered over. REPLACED by
   the versioned canonical admission manifest
   ('EXLIB-ADMISSION-MANIFEST v1', SHA-256, computed FROM DATABASE
   STATE) binding identity, the single active snapshot's
   classification/tracking/provenance/discovery/source fields,
   anatomy, aliases, authored content, authorship, the review-bound
   version with its evidence, the expected relationship set, and
   the live relationship set. Two digests are stored distinctly
   (computed manifest fingerprint; recorded source artifact
   SHA-256, format-validated). The freeze trigger independently
   recomputes the fingerprint at the admission transition, so an
   arbitrary caller hash cannot land even through direct owner
   writes. Determinism: hex-encoded UTF8 text fields, jsonb
   canonical form, day-offset dates, numeric-epoch timestamps, and
   COLLATE "C" row ordering — DateStyle, TimeZone, JSON key order,
   row order, and relationship order are all live-proven unable to
   change the hash. The manifest functions are STABLE (truthful,
   unlike revision A's IMMUTABLE marking on a session-dependent
   expression, which was itself a corrected revision-A defect).
3. UNPROVABLE RELATIONSHIP COMPLETENESS (finding 3): revision A's
   publication check only rejected conditions the FKs already made
   impossible, so an omitted required relationship was invisible.
   CORRECTED with the per-version EXPECTED relationship set
   (authored while pending, frozen at review, immutable rows,
   PK-deterministic, RESTRICT FKs, no self-expectation): admission
   and publication both require the live set to equal the expected
   set EXACTLY, with precise missing/unexpected errors, and the
   manifest binds both sets. The Plank model publishes only with
   exactly its substitution and progression present; either missing,
   extras, and swapped types each fail closed; target identities
   need no content of their own; version isolation is live-proven
   (a live-set move to a newer version's expectations fails the
   older version's publication closed rather than silently altering
   it).
4. NONEMPTY-023 INCOMPATIBILITY (finding 4): revision A's NOT NULL
   metadata additions succeeded only because the catalogs held zero
   rows. CORRECTED: the four discovery columns are NULLABLE with
   NULL-permitting vocabulary CHECKs; forgefitos_original rows must
   carry all four (new exercise_catalog_discovery_metadata_chk) and
   no source fields; external rows keep sources REQUIRED and their
   exact 023 meaning; the admission manifest refuses NULL discovery
   metadata, so legacy rows cannot enter the new workflow without a
   complete new snapshot version; nothing is backfilled or invented.
   The live suite now seeds a legitimate NONEMPTY 023 catalog
   (complete sources, anatomy, alias, approved SEALED run) BEFORE
   applying the proposal and proves byte-identical legacy rows,
   defaulted provenance, NULL (not fabricated) metadata, still-
   required sources, the workflow gate, and unchanged 026 delivery
   AND rollback on the historical rows after application.

PRESERVED DECISION (adjudicated): only content_status = 'approved'
may publish; pending, revised, and rejected never publish; revised
remains terminal.

## 3. Defects found by THIS review round, and their forward fixes

1. FUNCTION-ONLY PUBLICATION GATE (correctness, found by the
   corrected live suite's own smuggle probe): the first revision-B
   draft enforced relationship completeness and manifest freshness
   only inside publish_catalog_content. The travel-alone probe
   (whose smuggled admitted_at accidentally equaled the stored
   CURRENT_DATE value and therefore "traveled alone") published a
   version through a DIRECT owner-level UPDATE, bypassing both
   gates. FIX: the freeze trigger's publication branch now enforces
   exact expected/live set equality AND recomputes the manifest
   fingerprint structurally for every draft -> published transition,
   so direct owner-level publishes cannot bypass completeness or
   staleness either. Two dedicated live checks now prove the
   trigger-level gate (J5b, K1b), and the probe uses an
   unambiguously different date.
2. COLLATION-DEPENDENT MANIFEST ORDERING (determinism): the first
   manifest draft ordered rows with bare text ORDER BY, which is
   collation-dependent (glibc/ICU order underscores and spaces
   differently than byte order), so the same rows could hash
   differently across clusters. FIX: every text ORDER BY in the
   manifest is pinned to COLLATE "C" byte order, with a live check
   asserting the pin exists in the function body.

Carried from revision A (already fixed there, still true): the
verbatim-carry proof of the one replaced 023 function,
exlib_freeze_catalog_snapshot — outside the marked 8-line/518-byte
"EXLIB-2L splice" block, the carried body is byte-identical to the
023 bytes (4,607 B exact match, measured from the CREATE OR REPLACE
line through the closing $$; delimiter); the
exercise_catalog_provenance_sources_chk naming (the EXLIB-1C0B1
near-name hazard); and the single-transaction wrapper.

## 4. Live verification (scripts/verify-exlib2l-live.sh)

Final result: 111 passed, 0 failed, on a fresh disposable cluster
with TWO databases (nonempty legacy + empty). Coverage, mapped to
the corrective instruction's 17 required proofs:

1. Pending draft authoring (F2, F6).
2. Human approval BEFORE eligibility (G6, then H5).
3. One-time admission of an already-approved immutable draft (H5,
   H6).
4. Admission cannot precede approval — function AND direct-write
   paths (F7, F8).
5. Admission cannot accompany review or publication (G10, H9).
6. Admission cannot target revised/rejected/published/retired
   content (H10, H11, J11; published/retired versions already carry
   their one-way admission, so re-admission is refused as such).
7. Complete SHA-256 binding across metadata, anatomy, aliases,
   content, authorship, review evidence, and the exact relationship
   multiset (I1-I6: versioned manifest, ten mechanical
   artifact-to-database mapping probes, 64-hex SHA-256 shape,
   DateStyle/TimeZone invariance, jsonb key-order canonicalization,
   COLLATE "C" row ordering; H4: arbitrary hashes rejected by
   recomputation; J8: committed reverse-order re-insertion
   reproduces the exact fingerprint).
8. Any bound change or omission fails publication closed (K1 alias
   drift; K1b direct-write staleness; K2 review flip; K3 deactivated
   snapshot = MISSING bound surface, the manifest itself raises).
9. The Plank model cannot publish with either required relationship
   missing (J2, J3).
10. Extra or wrong relationships fail publication (J4, J5, J5b).
11. Target identities need no target-content approval, admission,
    publication, or even snapshots (J10).
12. Distinct loading, review, admission, and publication
    authorities (M1; H12/H13 cross-denials; admission role holds
    admit only, publication role holds publish only).
13. No ordinary client access (M2-M9: read/load/review/admit/
    publish/expected-write/fingerprint-oracle all denied for anon
    and authenticated).
14. Safe application over BOTH empty and nonempty legitimate
    001-026 states (D1, D2; C1-C3 seed the nonempty state first).
15. Existing 023-026 delivery/rollback behavior unchanged on
    historical external rows AFTER application (E8-E11, C2).
16. Schema application creates no content, relationship, run,
    membership, approval, admission, seal, publication, or delivery
    state (D5, on the empty database).
17. A second application fails and rolls back wholly (D3, D4).

Plus finding-4 specifics (E1 byte-identical legacy rows; E2 nothing
fabricated; E3 sources still required; E4 originals forbid sources;
E5 originals require discovery metadata; E7 legacy NULLs immutable
in place; K4 the legacy workflow gate) and the advisor-equivalent
block (N1-N4, including "no md5 anywhere in the new functions").

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

1. The manifest binds the snapshot's classification but NOT the
   snapshot's own review_status/review evidence (023's snapshot
   review axis is delivery's gate, and the finding's bound-surface
   list does not include it); the deactivation case is still fail-
   closed because the manifest requires exactly one ACTIVE snapshot.
   Confirm this boundary is the intended one.
2. admitted_source_sha256 is a RECORDED provenance fact
   (format-validated 64-hex): the database cannot read repository
   bytes, so its truthfulness is established by the repository-side
   verifiers and the operator's admission procedure, not by the
   database. Disclosed plainly; confirm acceptability.
3. The two NOLOGIN roles are created idempotently
   (pg_roles-guarded) because roles are cluster-scoped; the guard is
   live-proven by the second database's clean application. Confirm
   the desired posture for the hosted cluster.
4. exercise_catalog_content.reviewed_at is TIMESTAMPTZ (matching
   023's snapshot review evidence) while the authored artifact
   records an ISO-8601 string with offset; no conversion happens in
   this milestone.
5. Expected relationship sets are keyed by content version and
   frozen at review; if a future milestone needs to amend an
   expected set after approval, that is deliberately impossible
   without a new content version — confirm this is the intended
   rigidity.
