# EXLIB-2F — migration-026 apply-preparation record

Prepared 2026-08-31. APPLY-PREP ONLY — the candidate is PREPARED and
NOT APPLIED. This phase created the real migration candidate
supabase/migrations/026_exlib_plank_seed_reconciliation.sql from the
reviewed EXLIB-2E proposal and proved it locally on disposable
databases; it applied NOTHING to any hosted or persistent project
database and contacted no hosted service. Hosted application remains
Joseph/ChatGPT-only, against the ShredOS Supabase project only, and
is a separate explicitly authorized step. The seed module edit, Plank
instructional content authoring, the inventory seed_link_compatible
flip, catalog loading, and any delivery to users all remain
separately gated.

## 1. Source state

- Base: promoted main = the EXLIB-2E proposal milestone at
  7fed0eed6f18c1752e15d3ba76b6e0c7adeaacf3 (tree a7c1ec0b...), tag
  exlib2e-migration-026-proposal-reviewed-unapplied (tag object
  5d20d33ec275b7764d629d429b6b8a17655857d0), verified by fresh fetch
  before branching; migrations were exactly 001-025 with no 026.
- Reviewed proposal: docs/exlib2e-migration-026-proposal.sql,
  32,500 B, SHA-256
  a6696066d178ced7e53bf81e7106cce64a87e2c73d9b342464d930a2fe3c2108 —
  retained byte-identical as the durable reviewed artifact (not
  moved, not deleted, not edited).

## 2. Candidate construction (mechanical, truthful)

The candidate was built as: a NEW leading status header + the
proposal's bytes from its first body line onward, byte-for-byte. The
executable-SQL equivalence is defined mechanically: strip the maximal
leading prefix of blank/`--` lines from BOTH files; the remainders
must be byte-identical (proven statically in verify-exlib2f.ts A4 and
live in the verify-exlib2e-live.sh drift gate). No executable
statement, identifier, function body, constraint, ACL, lock order,
report key, or rollback predicate was altered — not even formatting.

The replaced leading header truthfully states: EXLIB-2F APPLY-PREP
CANDIDATE; reviewed source commit 7fed0ee... and the reviewed
proposal SHA-256; PREPARED FOR LATER EXPLICIT APPLICATION — NOT
APPLIED during this phase; hosted application Joseph/ChatGPT-only,
never performed by Claude; and the separately gated follow-ups (seed
edit, Plank content, inventory flip, catalog loading, delivery).

Honest carry-over note: the proposal's interior commentary is part of
the byte-identical body, including the trailing "4. Boundaries" block
that begins "This proposal does NOT: ..." — every claim in that block
is equally true of the candidate, and the word "proposal" there is a
deliberate residue of the reviewed bytes, not an error. Candidate
fingerprint: 33,294 B, SHA-256
620185b62c589c55fb30a237589589f46002a9d6c391b9ab936e07a6641cf4bc.

## 3. Historical-verifier lifecycle (mechanical sweep)

Identification was mechanical: with the candidate present and HEAD
still at the promoted tip, the full battery was run; every failure is
by construction a live "exactly 001-025 / no 026" assumption (checks
that read the live migrations directory), because every suite passed
at 7fed0ee and anchored-range checks were still clean. Classification
of every hit:

- Live migration-set boundaries superseded by EXLIB-2F (38 .ts
  verifier checks across 37 files): revised under the explicit label
  `RETARGET (EXLIB-2F migration 026 apply-prep candidate)` following
  the repository's established precedent from the 023/024/025
  landings — the boundary moves from exactly-25 to exactly-26 with
  the candidate filename pinned and (where the shape checks
  sequences or positions) no gap, no duplicate, and no 027+. Files:
  exlib1a, exlib1b1, exlib1b2, exlib1b3, exlib1c0, exlib1c0a,
  exlib1c0b, exlib1c0b2, exlib1c0b3, exlib1c0b4, exlib1c0b5,
  exlib2a2b, exlib2c-batch01..06, exlib2d (A2), food-log-ux,
  phase5b3, phase5b4, phase5b5, ui1a, ui1b, ui2, ui3, ui4 (two
  sites), ui5a, ui5b1a, ui5b1b, ui5b2, ui6a, ui6b, ui6c, ui7.
- Historical phase-bound claims anchored to the exact promoted
  commit where they were true:
  - verify-exlib2e.ts A2 (`RETARGET (EXLIB-2F)`): its proposal-only
    claims (migrations exactly 001-025 with NO 026; the proposal in
    docs/) are now proven against the promoted EXLIB-2E tip's tree
    via `git ls-tree 7fed0ee...`, and its phase-range claim is
    anchored tip-to-tip (99991d7..7fed0ee), never weakened. The
    suite remains capable of proving the promoted milestone forever.
  - verify-exlib2d.ts D1 (`RETARGET (EXLIB-2F)`): the mechanical
    exercises.id dependency-inventory reproduction stays scoped to
    the pre-026 migration set the design analyzed; the candidate
    intentionally ADDS exercise_catalog_corrections as a fifth
    RESTRICT FK referencer per the approved design.
- Live-suite apply loops that would silently have applied the
  candidate (current safety boundaries superseded): the
  verify-exlib2e-live.sh migration loops now exclude 026+ (the suite
  still proves the DOCS proposal against exactly 001-025 and remains
  at its full check count), its former "no real migration 026" gate
  is replaced by a fail-closed drift gate (exactly one 026 whose
  header-stripped executable SQL is byte-identical to the docs
  proposal), and verify-exlib1c0b3-live.sh's two loops exclude 026+
  so its "exactly 001-025" claim stays true. verify-exlib1b3-live.sh
  and verify-exlib1b2-live-concurrency.sh apply fixed files and
  needed no change.
- Unrelated hits left untouched: frozen LINE-EXACT historical diff
  expectations embedded in the 1C0B-era G-checks (they pin immutable
  commit ranges and were deliberately excluded from the mechanical
  edits), verify-phase5a6b.ts (its `=== 25` checks are not
  migration-directory reads; it passed throughout), and the
  transient worktree-scope failures that exist only while this
  phase's files are uncommitted (they compare porcelain state, not
  the migration set, and are re-proven green in the committed-state
  battery).

## 4. EXLIB-2F proof package

- scripts/verify-exlib2f.ts (static, 12 checks): source
  refs/fingerprints and exact 43-path phase inventory; exactly one
  026 and no 027; the docs proposal byte-identical; header-stripped
  executable byte-equivalence + truthful header; the reviewed three
  functions and correction table; helper VOLATILE/SECURITY
  DEFINER/pinned-search_path/client-revoked; strict delivering-run
  invariant, snapshot gate, shared validation, parent-then-child
  lock order, tenant-scoped P2 update, three rollback exclusions, no
  rename mechanism, report compatibility, byte-carried generic 023
  behavior; no seed/content/inventory/ledger/eligibility/runtime
  change; prepared-not-applied posture; and narrow labeled anchored
  retargets.
- scripts/verify-exlib2f-live.sh (100 checks, disposable socket-only
  cluster, no hosted contact): applies migrations 001-026 from
  supabase/migrations exactly once and never additionally sources
  the docs proposal into that database, and reproduces the complete promoted
  EXLIB-2E 94-check behavior against the actual migration file,
  including the review-1 strict-run/raced-winner/snapshot-gate cases
  and the review-2 locking and concurrency proofs (autonomous dblink
  sessions). It finishes with the two-database equivalence proof:
  - Database A: migrations 001-025 + the reviewed docs proposal.
  - Database B: migrations 001-026 only.
  Compared normalized results are IDENTICAL and non-vacuous:
  correction-table columns, constraints, indexes, RLS flags,
  policies, and ACLs; all three function definitions (md5 of
  pg_get_functiondef), volatility, security, ACLs, and search_path
  config; and behavior (report keys, canonical delivery, P2
  correction + record, verified-idempotency retry, rollback report
  and exclusion) — no semantic difference is attributable to
  apply-prep.

## 5. What this phase does NOT do

This record approves NOTHING and applies NOTHING. The candidate is
NOT applied to hosted Supabase and is not marked applied anywhere; no
seed edit; no Plank content authored; no seed_link_compatible or
inventory flip; no content approval or publication; no catalog
loading; no eligibility or ledger mutation; no weight_time
implementation; no push, promotion, or tagging in this phase. Only
disposable local databases were used.

## 6. Dependency map (later, explicitly gated)

1. Codex review of this apply-prep package.
2. Application by Joseph/ChatGPT ONLY, to the ShredOS project only,
   with the standard application record (a later phase records it).
3. Seed module edit (tracking_mode AND anatomy) in the SAME atomic
   release as delivery enablement, per the approved sequencing; the
   inventory seed_link_compatible flip is a global artifact fact in
   that coordinated state.
4. Plank instructional content authoring and its review lifecycle.
