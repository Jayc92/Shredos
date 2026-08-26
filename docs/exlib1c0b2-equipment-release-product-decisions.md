# EXLIB-1C0B2 — Equipment-Release Product Decisions (decision record)

**This is a product-decision record. It is NOT an implementation
authorization and NOT a loading authorization.** Nothing in this
document changes the applied schema, product code, catalog data, the
authoritative ledger, or any migration byte.

## 1. Anchors (immutable)

- Promoted EXLIB-1C0B1 analysis commit:
  `1021b337e6016f97674c1e4a5d84f397d234795d`
- Stable tag: `exlib1c0b1-schema-vocabulary-impact-audit-stable`
  (peels to that exact commit).
- Promoted audit `docs/exlib1c0b-schema-vocabulary-impact-audit.md`:
  31,922 bytes, SHA-256
  `0d4447142735b29c987e792a8ed3331f19b38c4ae9eb5225d77e7fcf5cff6c5e`.
- Promoted verifier `scripts/verify-exlib1c0b.ts`: 25,347 bytes,
  SHA-256
  `2e1a2098ede95742ad18499a5af857044a003f6bb13a8215bfdf3a071f25cfee`.

EXLIB-1C0B1 is preserved byte-for-byte as the pre-decision analysis
record. This record supersedes only the decision STATE of items 5-7
and the Option B direction going forward; it does not retroactively
change what the audit truthfully recorded when promoted (all seven
decisions OPEN, Option B PROPOSED and not approved).

## 2. Decisions

Decision-maker: **Joseph Carfagno** (product owner).
Date: **2026-08-25**.
Relayed for recording via the reviewed EXLIB-1C0B2 phase instruction.

### Decision 5 — user-created exercise selectability: CLOSED/APPROVED

> APPROVED — expose all four future equipment values to users
> wherever equipment can be selected for a user-created exercise:
> weight_plate, weighted_vest, smith_machine, sandbag.

### Decision 6 — Smith Machine progression behavior: CLOSED/APPROVED

> APPROVED — do not assume or recommend a fixed +5 lb increment. Use
> neutral "next available increment/setting" semantics because
> Smith-machine loading, plate increments, and counterbalancing vary
> by machine. This decision defines product behavior only;
> implementation is not authorized in this phase.

### Decision 7 — display labels: CLOSED/APPROVED

> APPROVED exactly as:
> - weight_plate -> Weight Plate
> - weighted_vest -> Weighted Vest
> - smith_machine -> Smith Machine
> - sandbag -> Sandbag

### Decisions 1-4 — weight_time: OPEN, deferred

The four tracking decisions remain OPEN and are deferred to the
later dedicated `weight_time` feature phase, exactly as scoped by
the EXLIB-1C0B1 audit (sections 4.4, 4.5, 4.7, 4.8):

1. weight_time field contract (required/permitted/forbidden fields)
   — OPEN.
2. Completion/zero semantics — OPEN.
3. Legacy exercise_type derivation branch for weight_time — OPEN.
4. Records/PR participation model — OPEN.

Nothing in this record decides, defaults, or narrows any
`weight_time` issue. Under the approved Option B direction, these
open items do not block the equipment-only path.

## 3. Option B direction

Option B (split delivery) is **APPROVED as product direction for the
equipment-only path**: equipment-only support may proceed
independently from `weight_time`. Its implementation remains
separately unauthorized. The EXLIB-1C0B1 audit's historical
"PROPOSED — NOT APPROVED" label is superseded by this record going
forward, not rewritten.

## 4. Exact status separation

| Item | Status |
|---|---|
| Product direction (Option B, equipment-only path) | APPROVED |
| Decisions 5, 6, 7 (equipment release) | CLOSED/APPROVED |
| Decisions 1-4 (weight_time) | OPEN, deferred |
| Implementation (schema/product/API/UI) | NOT YET AUTHORIZED |
| Migration 025 | NOT AUTHORED and NOT AUTHORIZED |
| Catalog loading | NOT AUTHORIZED |
| EXLIB-1C | NOT BEGUN |
| Public/commercial dataset clearance | UNCHANGED/OPEN |
| Full-record and specialist review | UNCHANGED/PENDING (ledger 48/48 pending) |

All 26 equipment candidates in
`docs/exlib1c0a-equipment-resolution.jsonl` remain
`import_eligible: false`. The four future equipment values
(`weight_plate`, `weighted_vest`, `smith_machine`, `sandbag`) remain
absent from the applied schema until a separately reviewed
coordinated implementation is approved.

## 5. Future coordinated implementation boundary (defined, not implemented)

When separately authorized, the equipment release must land as ONE
reviewed, coordinated implementation containing at least:

- schema CHECK updates (both the tenant `exercises` and catalog
  `exercise_catalog` equipment CHECKs, replaced in one transaction,
  with installed constraint names first discovered mechanically on a
  disposable database);
- generated TypeScript/database unions;
- UI/API validation and selectors (per Decision 5);
- display labels (per Decision 7);
- Smith-machine progression behavior (per Decision 6, neutral "next
  available increment/setting" semantics);
- labeled verifier retargets for every suite that pins the current
  eight-value vocabulary;
- migration and disposable local-Postgres live tests;
- rollback analysis per the EXLIB-1C0B1 boundaries.

A schema-only release or a bare CHECK expansion is PROHIBITED: the
database must never accept values the product cannot represent, and
no CHECK may ship without its coordinated non-schema support in the
same reviewed release.
