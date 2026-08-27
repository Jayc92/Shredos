# EXLIB-1C0B4 — weight_time product decisions (decisions 1-4)

**PRODUCT-DECISION RECORD ONLY.** Decided explicitly by Joseph
Carfagno on 2026-08-27. This record documents product direction; it
implements nothing and authorizes no implementation.

## Status

- Decisions 1-4: **CLOSED** (2026-08-27).
- Product direction: **APPROVED** as recorded below.
- Implementation: **NOT AUTHORIZED**.
- Migration 026: **NOT AUTHORED and NOT AUTHORIZED**.
- Exact implementation still requires a separately reviewed
  coordinated plan (schema + types + validation + API + UI +
  records/progression in one reviewed release, per the EXLIB-1C0B1
  audit's schema-only prohibition for `weight_time`).
- No catalog loading. The authoritative review ledger remains
  48/48 pending-null. All 26 canonical candidates remain
  `import_eligible: false`. No EXLIB-1C loading authorization.

## Supersession of prior OPEN statements

Dated supersession pointer (2026-08-27): the following committed
historical statements that decisions 1-4 are OPEN are superseded by
this record and are intentionally left byte-identical, because any
byte change to an approved artifact voids its approval:

- `docs/exlib1c0b2-equipment-release-product-decisions.md`:
  - section "Decisions 1-4 — weight_time: OPEN, deferred"
    (statement dated 2026-08-25);
  - status row "| Decisions 1-4 (weight_time) | OPEN, deferred |".
- `docs/exlib1c0b-schema-vocabulary-impact-audit.md`: its
  "OPEN PRODUCT DECISION" markers for empty/zero/partial semantics,
  legacy exercise_type derivation, and records participation
  (product-contract analysis items 5, 7 and 8, and consumer row C16)
  are superseded in full. Its item 4 (field contract) is superseded
  ONLY for the narrow sub-question Decision 1 below actually
  answers — that `weight_time` reuses `weight_kg` and
  `duration_seconds` and excludes `reps` — and remains OPEN,
  unchanged and unresolved, for whether `rpe`, a warmup flag, or any
  other field is permitted; that sub-question is NOT superseded.

Those documents' consumer audits and hazard findings (including the
EXLIB-1C0B1 sections on S9/S11 accidental-fallback hazards and
consumers C1-C15) remain accurate and are preserved unchanged; only
the specific sub-questions decisions 1-4 actually answer have their
OPEN status superseded — item 4's RPE/warmup permission sub-question
is explicitly excluded from supersession and remains OPEN.

## Baseline anchors

- Decided against main = `13a8d82330709338c86e5697250de8fa7fd0fa77`
  (tree `43c094b2c550aed7453a23d3b85880f7e8858478`).
- EXLIB-1C0B2 decision record (5,131 bytes, SHA-256
  `6b9e813ad625cb21a8be5a4992d94da7d45f149f3e824388190bb0292da1e64d`)
  deferred these decisions; this record closes them.

## Decision 1 — tracking-field contract: OPTION A (CLOSED)

- Add a distinct `weight_time` tracking method.
- Reuse existing `weight_kg` and `duration_seconds` storage fields.
- `weight_kg` represents external/added weight, not the user's body
  weight.
- `duration_seconds` represents completed hold duration.
- `reps` is not part of this tracking method and remains
  null/absent.
- User-facing labels are "Added weight" and "Duration."
- No combined weight-time storage score is authorized.

The bullets above are the entirety of Decision 1, and only they are
CLOSED. Any field not named above — including RPE, a warmup flag,
distance, or any other optional field — is OUTSIDE Decision 1's
scope: this record does not decide, permit, or forbid such a field.
Per the EXLIB-1C0B1 audit's product-contract analysis item 4,
whether `rpe` or a warmup flag are permitted for `weight_time`
remains an OPEN PRODUCT DECISION, exactly as before and unresolved
by this record.

## Decision 2 — completion and zero semantics: OPTION A (CLOSED)

- A completed set requires both values to be present.
- `weight_kg >= 0`.
- `duration_seconds > 0`.
- Zero added weight is valid and means an intentional unweighted
  baseline.
- Zero duration is invalid.
- Negative values are invalid.
- Null/omitted weight is not equivalent to zero.
- Null/omitted duration is incomplete.
- Partially entered information must not count as a completed set.
- Completion attempts with invalid or incomplete values must fail
  closed.
- Editing a completed set must cause affected record status to be
  reevaluated.

## Decision 3 — legacy classification: OPTION A (CLOSED)

- `weight_time` exercises explicitly derive broad legacy
  `exercise_type='strength'`.
- This must be an intentional branch, not an accidental CASE
  fallback.
- Specialized input, rendering, completion, record and progression
  behavior must continue to branch on `tracking_type='weight_time'`.
- Consumers must not assume every strength exercise uses weight and
  reps.
- No new `hybrid` exercise type is approved.

## Decision 4 — records and progression: OPTION C (CLOSED)

- Use a two-dimensional weight/duration record model.
- Do not create or display one combined scalar score such as
  weight x time.
- Preserve contextual achievements including:
  - longest hold, displaying its associated weight;
  - heaviest hold, displaying its associated duration;
  - a weight-time PR when a performance improves the
    two-dimensional record frontier.
- A performance is frontier-improving only when no prior
  performance is equal or better in both weight and duration.
- Ties require an improvement in the other dimension.
- Progression should generally change one dimension at a time.
- At the same weight, recognize increased duration.
- After the intended duration range is achieved consistently,
  progression may recommend the next available weight with a
  conservative duration reset.
- Without an explicit target range, use neutral guidance such as:
  - "Try holding this weight slightly longer."
  - "When this duration feels controlled, try the next available
    weight."
- Never claim that a heavier but dramatically shorter hold is
  universally better.
