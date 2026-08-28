# EXLIB-1C0B5 — weight_time RPE/warmup subdecision (decision overlay)

**PRODUCT-DECISION RECORD ONLY.** Decided explicitly by Joseph
Carfagno on 2026-08-28. This overlay documents product definition;
it implements nothing and authorizes no implementation, migration,
deployment, hosted QA, catalog loading, or EXLIB-1C loading.

## Status

- The RPE/warmup field-contract subdecision for `weight_time`:
  **CLOSED/APPROVED** (2026-08-28).
- Product-definition approval only. Implementation remains **NOT
  AUTHORIZED**. Migration 026 remains **NOT AUTHORED and NOT
  AUTHORIZED**. The next engineering step remains a separately
  reviewed coordinated `weight_time` implementation plan before any
  migration or runtime work.
- Decisions 1-4 of EXLIB-1C0B4 are **unchanged** by this overlay.
- No catalog loading. The authoritative review ledger remains 48/48
  pending-null. All 26 canonical candidates remain
  `import_eligible: false`. No EXLIB-1C loading authorization.

## Supersession scope (narrow)

The stable EXLIB-1C0B4 record
(`docs/exlib1c0b4-weight-time-product-decisions.md`, 5,973 bytes,
SHA-256
`12fe23d37ee075c66c62dc1ad11b18fadf29ccd907525b2b9dabf7055feaa4aa`,
committed at `9b22947699529a2cb07af4c34cf53ebfee9646b8`, tag
`exlib1c0b4-weight-time-product-decisions-stable`) intentionally
left this subdecision open: it states that whether `rpe` or a
warmup flag are permitted for `weight_time` "remains an OPEN PRODUCT
DECISION, exactly as before and unresolved by this record." That
was deliberate scoping, not an omission.

This overlay supersedes ONLY that open RPE/warmup subdecision
(EXLIB-1C0B1 product-contract analysis item 4's remaining
sub-question). It changes nothing else. The EXLIB-1C0B4 record is
preserved byte-for-byte; any byte change to an approved artifact
voids its approval.

## The approved contract (Joseph, 2026-08-28)

- `workout_sets.rpe` is permitted for `weight_time`.
- `workout_sets.is_warmup` is permitted for `weight_time`.
- Both reuse the existing columns; add no new columns.
- `rpe` is optional/nullable and retains its existing valid range
  and semantics.
- `is_warmup` remains optional with its existing default of
  `false`.
- Neither field is required for completion.
- Neither changes the core completed-set contract:
  - `weight_kg >= 0`;
  - `duration_seconds > 0`;
  - both values must be present;
  - zero weight is a valid intentional baseline;
  - zero duration is invalid.
- RPE is metadata only. It does not participate in longest-hold,
  heaviest-hold, Pareto/frontier PR, progression, ranking, or any
  combined score.
- Warmup `weight_time` sets remain visible in history but are
  excluded from:
  - longest-hold records;
  - heaviest-hold records;
  - Pareto/frontier PRs;
  - progression baselines;
  - working-set volume/readiness calculations wherever warmups are
    already excluded.
- A completed warmup set must satisfy the same weight-and-duration
  validation as a completed working set.
- Changing a set between warmup and working status must trigger
  recalculation of affected records, summaries, and progression
  inputs.
- The two-dimensional model remains unchanged: no scalar weight x
  time score and no RPE-adjusted score.

## Baseline anchors

- Decided against main = origin/main =
  `9b22947699529a2cb07af4c34cf53ebfee9646b8`.
- Companion current-state audit:
  `docs/bootstrap-audit-2026-08-27.md` (revised with a dated
  supersession pointer to this overlay).
