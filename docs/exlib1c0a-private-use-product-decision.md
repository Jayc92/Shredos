# EXLIB-1C0A — Private-Use Product Decision (decision overlay)

**Versioned decision overlay.** This record is separately versioned
from the promoted EXLIB-1C0 packet and changes no promoted byte.

## 1. Relationship to the stable EXLIB-1C0 packet

- EXLIB-1C0 (tag `exlib1c0-legal-human-review-packet-stable`,
  peeled target `45b290c3639833010f7faf7d6c313ddcc3ee61aa`) remains
  the stable record of the pre-decision review state.
- This EXLIB-1C0A record supersedes only the private-use
  product-direction interpretation going forward.
- It does not retroactively change what the packet truthfully
  recorded when promoted: at promotion, all seventeen guide gates
  were OPEN, zero were CLOSED, zero decisions were checked, and both
  dataset-level gates (L1 counsel, L2 product) were open and unmade.
- The authoritative 48-row ledger
  (`docs/exlib1b1-review-ledger.jsonl`) remains pending because
  resolving one dimension does not constitute full-record approval.

## 2. Source boundary

- The EXLIB-1A StrengthLog manifest
  (`docs/exlib1a-discovery-manifest.jsonl`, 395 records) is internal
  research/discovery provenance only.
- It is not the production import payload.
- ForgeFitOS is not importing StrengthLog workouts, programs,
  instructions, descriptions, cues, images, videos, muscle maps,
  branding, or other expressive content.
- StrengthLog URLs and source category placements are not
  production-facing catalog content.
- Each production exercise must receive independently determined
  ForgeFitOS:
  - canonical identity;
  - display name;
  - aliases;
  - anatomy;
  - equipment;
  - laterality;
  - tracking mode;
  - eligibility;
  - future original description/media.
- Common exercise names may be used as exercise terminology, but the
  final catalog must not represent itself as a copy or
  redistribution of StrengthLog's compiled directory.

## 3. Joseph's private-use product decision

Decision-maker: **Joseph Carfagno** (product owner).
Date: **2026-08-24**.
Relayed for recording via the reviewed EXLIB-1C0A phase instruction.

> ForgeFitOS may use the EXLIB-1A manifest solely as an internal
> research and discovery artifact to construct an independently
> reviewed ForgeFitOS exercise catalog for private personal use. No
> StrengthLog prose, instructions, programs, images, videos,
> branding, or source-specific expressive content may be imported.
> Production records must use independently determined ForgeFitOS
> metadata. Public or commercial release requires a separate review
> of the final ForgeFitOS catalog and product.

### Classification of this decision

- Private-use product decision: CLOSED/APPROVED by Joseph.
- Public/commercial product decision: OPEN.
- Formal legal clearance: not claimed.
- StrengthLog permission: not claimed.
- This does not authorize catalog loading.
- This does not approve any of the 48 full exercise records.
- This does not begin EXLIB-1C.

Neither ChatGPT nor Claude is legal counsel, and nothing in this
record is a legal determination. This record makes no claim about
the presence or absence of legal risk; it records a product-owner
decision about a private personal-use product direction only.

### Joseph's product-vocabulary decision (equipment)

Decision-maker: **Joseph Carfagno** (product owner).
Date: **2026-08-24**.
Recorded after direct review of the equipment-resolution overlay.

> ForgeFitOS should preserve equipment-specific exercise identities.
> The future catalog vocabulary should add `weight_plate`,
> `weighted_vest`, `smith_machine`, and `sandbag` rather than
> collapse those identities into `other` or generic `machine`. This
> approves the product vocabulary direction only; it does not
> authorize migration 025, schema implementation, catalog loading,
> or any exercise's full-record eligibility.

#### Classification of the vocabulary decision

- Vocabulary direction: CLOSED/APPROVED by Joseph.
- Schema implementation: NOT AUTHORIZED.
- Migration 025: NOT AUTHORED/NOT APPROVED.
- All four affected candidates (Plate-Weighted Plank, Weighted-Vest
  Plank, Smith-Machine Standing Calf Raise, Sandbag Ground to
  Overhead) remain import-ineligible until the schema/product
  implementation is separately reviewed and applied.
- The applied schema's equipment vocabulary is unchanged; the
  overlay continues to record `schema_supported: false` with a null
  schema value for these candidates until an implementation exists.

## 4. Gate reconciliation (before/after)

| Gate | Historical packet state (at promotion) | EXLIB-1C0A state |
|---|---|---|
| L2 — product decision | OPEN | CLOSED for PRIVATE USE by Joseph's explicit dated decision (section 3); the public/commercial product decision remains OPEN |
| L1 — formal external legal clearance | OPEN | remains OPEN for public/commercial release; not claimed for private use |
| Controlling technical boundary (private development) | source-dataset use under the packet's dataset gates | production payload independence replaces source-dataset copying as the controlling technical boundary: every production record must carry independently determined ForgeFitOS metadata (section 2) |
| Human review (48 ledger resolutions) | OPEN | OPEN |
| Specialist (S&C) sign-off | OPEN | OPEN |
| Data/import gates (dry-run design, run membership freeze, review-audit completeness, no-unresolved-record) | OPEN | OPEN, except where already technically established by applied migrations 023-024 (closed catalog tables, sealed-run machinery, review-audit CHECKs) |
| Rollback rehearsal | OPEN | OPEN |
| Hosted QA plan | OPEN | OPEN |
| Catalog loading (any payload, including private use) | prohibited | remains prohibited until a separately approved exact catalog payload exists |

## 5. Scope confirmation

This overlay authors no SQL, no migration 025, no catalog data, no
EXLIB-1C importer work, and no ledger mutation. The companion
equipment-resolution overlay
(`docs/exlib1c0a-equipment-resolution.jsonl`) resolves the equipment
DIMENSION of nine ambiguous records into canonical ForgeFitOS
candidates; anatomy and full-record eligibility for every record
remain pending, and every candidate remains `import_eligible:
false`.
