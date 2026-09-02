# EXLIB-2L — implementation review record (proposal hardening)

Recorded 2026-09-02 (UTC). This is Claude's OWN implementation
review of docs/exlib2l-catalog-content-schema-proposal.sql — a
self-review performed before submission. It is NOT a specialist,
human, or Codex approval, and it approves nothing: the proposal
remains an UNAPPLIED draft in docs/ awaiting Codex review, and only
Joseph/ChatGPT may ever apply migrations. No hosted service was
contacted at any point in this milestone; every live check ran on a
DISPOSABLE local PostgreSQL 16.15 cluster (unix-socket only, no TCP,
created and destroyed by the harness).

## 1. What was reviewed, against what

The proposal (final bytes: 33,213 B, SHA-256
df98e085eab21fd6e4074531efea5d9ae54daff603cde52da0e33e2b621a0639)
was checked line-by-line against:

- the promoted EXLIB-2A architecture record (pseudocode, vocabularies,
  RLS/ACL posture, publication lifecycle, freeze conventions);
- migration 023's committed bytes (the tables/triggers it extends,
  the review-audit CHECK pattern, the single-transaction policy, the
  house naming convention: inline unnamed CHECKs for single-column
  vocabularies, explicit ..._chk names for multi-column table
  constraints);
- migrations 024-026 (nothing they define may change);
- the EXLIB-2I/2J contracts (complete non-blank review evidence;
  fingerprint-bound, all-or-nothing import admission);
- the EXLIB-2L instruction's schema requirements and prohibited list.

## 2. Verbatim-carry proof (the one CREATE OR REPLACE of a 023 object)

The proposal replaces exactly one committed function,
exlib_freeze_catalog_snapshot(), to extend its immutable-column
list. Proven numerically before submission: outside the marked
8-line/518-byte "EXLIB-2L splice" block, the carried body is
byte-identical to the 023 bytes (4,607 B exact match, measured from
the CREATE OR REPLACE line through the closing $$; delimiter). The
splice
adds only the five new columns to the immutable list; every review
transition rule, evidence demand, review-events log write, and
one-way deactivation rule is byte-preserved. No other 023-026
object is redefined.

## 3. Defects found by this review, and their forward fixes

Three real defects were found in the draft proposal and fixed
forward (the proposal is uncommitted; these are pre-submission
corrections, not history rewrites):

1. UNTRUTHFUL IMMUTABLE MARKING (correctness, would have caused
   spurious fail-closed publication failures):
   exlib_content_fingerprint was declared IMMUTABLE while folding
   authored_at in as date::text. Live probes proved date_out has
   provolatile 's' (STABLE) and that DateStyle really changes its
   output ('2026-09-01' / '09/01/2026' / '01.09.2026'), so the same
   payload would hash differently per session and a valid
   publication could be rejected as STALE. FIX: authored_at is now
   folded in as (authored_at - DATE '1970-01-01')::text — an integer
   day offset; date_mi and int4out are both provolatile 'i', so the
   IMMUTABLE marking is truthful and the hash is
   session-independent. Proven live: identical fingerprints under
   DateStyle ISO and German (suite items I4/I5).
2. NEAR-IDENTICAL CONSTRAINT NAMES (the exact EXLIB-1C0B1 audit
   hazard): the draft named the conditional source constraint
   exercise_catalog_provenance_chk alongside the auto-named
   vocabulary CHECK exercise_catalog_provenance_check — names that
   defeat name discovery during rollback. FIX: renamed to
   exercise_catalog_provenance_sources_chk, with the rollback
   sequence updated and a comment citing the audit.
3. MISSING SINGLE-TRANSACTION WRAPPER (023/024/025 house policy:
   "Do not rely on any client to batch"): the draft had no explicit
   transaction, so a mid-file failure could have left a half-applied
   schema. FIX: one explicit BEGIN;/COMMIT; now encloses every
   executable statement. Proven live: a second application fails
   closed and rolls back WHOLLY, leaving the schema intact (suite
   items C2/C3).

One contract contradiction was adjudicated (not a defect in the
proposal, but found while reviewing it): promoted 2A makes
'approved' AND 'revised' publishable; the EXLIB-2L instruction and
migration 023's terminal-'revised' semantics require 'approved'
alone. Resolution: the stricter rule is implemented and the
deviation is DISCLOSED in the proposal header for reviewer
adjudication (design record, section 4). The instruction's
fail-closed stop was not triggered because the promoted artifacts do
not contradict EACH OTHER — 2A is internally consistent, and the
instruction itself supplies the resolution.

During harness authoring, the live suite's own no-hosted-contact
self-scans (section O) initially matched their own pattern/message
text; the checks were rewritten to be non-self-matching before the
final run. This was a harness defect, not a proposal defect.

## 4. Live verification (scripts/verify-exlib2l-live.sh)

Final result: 100 passed, 0 failed, on a FRESH disposable cluster
(the earlier smoke cluster that had the pre-fix draft applied was
torn down first; the final run proves the CORRECTED bytes).
Coverage, mapped to the instruction's live-proof list:

- migrations 001-026 apply cleanly in order (26 files, unmodified),
  pre-proposal catalog EMPTY matching hosted evidence (B3/B4);
- the proposal applies EXACTLY ONCE from docs/; a second application
  fails closed and mutates nothing (C1-C3);
- schema application alone creates NO catalog run, membership,
  content, approval, seal, publication, or delivery state (D1-D3);
- existing 023-026 behavior remains green: function inventory with
  volatility/SECURITY DEFINER posture, triggers, review-audit
  contract, review-events logging, one-way review_status (E1-E2,
  G2-G5);
- provenance-conditional constraints exercised BOTH directions:
  original content truthfully representable with all four source
  fields NULL, fabricated sources rejected, external rows unchanged
  and still fully required, unknown values rejected, NOT NULL
  discovery metadata enforced (F1-F8);
- the five new columns are immutable snapshot content (G1);
- content lifecycle: born pending/draft/not-admitted; cannot be born
  approved or published; complete and incomplete human-review states
  exercised (blank reviewer/rationale rejected); decided versions
  frozen; version identity immutable (H1-H11, J2-J5);
- import eligibility is fingerprint-bound: all-or-nothing admission
  CHECK, deterministic DateStyle-independent fingerprint, and a
  post-admission content edit makes publication fail closed as
  STALE (I1-I6, K1);
- pending, revised, and rejected content cannot publish —
  structurally (CHECK) and in the function (defence in depth) — and
  a PUBLISHED row cannot be flipped to 'revised' in place (J1,
  J10-J13);
- relationship resolution rejects missing targets and self-links;
  duplicates impossible; RESTRICT prevents orphaning; the Plank
  relationship model is representable while its targets have NO
  approved, admitted, or published content (L1-L8);
- ordinary authenticated callers (and anon) cannot load, review,
  admit, publish, read, or compute admission fingerprints; EXECUTE
  on the publication function is granted ONLY to exlib_catalog_admin;
  authorized publication succeeds only with EVERY prerequisite
  satisfied (M1-M10, J6-J9, K2-K4);
- no service_role grant exists on the new objects, and 026's
  reviewed authenticated delivery grant is untouched (M11-M12);
- no hosted contact: socket-only cluster with empty
  listen_addresses, no hosted endpoint or remote CLI reference in
  the harness, every database call aimed at the disposable socket,
  and the promoted Plank artifact never read or loaded — fixtures
  are locally invented proof rows (B1-B2, O1-O3).

## 5. Advisors: honest limitation statement

Supabase's Database/Security Advisors are hosted platform features;
running them requires contacting the hosted project, which this
milestone forbids (and which Claude may never do). The Supabase
CLI's local lint requires a TCP database URL, while the standing
security rule mandates socket-only disposable clusters. LOCAL
EQUIVALENTS of the advisor rules relevant to this change were run
instead and pass (suite N1-N4): RLS enabled on every new public
table; no new function with a mutable search_path; no SECURITY
DEFINER function executable by PUBLIC/anon/authenticated; every new
foreign key covered by a leading-column index. These local checks
are NOT a substitute for the hosted advisors, which the authorized
operator must re-run after any future approved application.

## 6. Residual review items for Codex

1. The disclosed 'revised' publishability narrowing (design record
   section 4) — adjudicate against 2A's literal wording.
2. The exlib_catalog_admin role is created idempotently
   (pg_roles-guarded) because roles are cluster-scoped; confirm this
   is the desired posture for the hosted cluster.
3. The relationship table intentionally carries no
   published-content requirement on targets (identity-only FKs), so
   relationship rows may reference identities whose content is not
   yet loaded or published — deliberate (mirrors the authored
   model), but worth an explicit reviewer confirmation.
4. exercise_catalog_content.reviewed_at is TIMESTAMPTZ (matching
   023's snapshot review evidence) while the authored artifact
   records an ISO-8601 string with offset; no conversion happens in
   this milestone.
