# EXLIB-1C0 — Human-Review Guide (48 pending records)

**ZERO APPROVALS EXIST.** Every checkbox below is unchecked and must
stay unchecked in this document — decisions are recorded by humans
against the proposals workbook
(`docs/exlib1c0-human-review-proposals.jsonl`) and, ultimately, the
authoritative ledger (`docs/exlib1b1-review-ledger.jsonl`), which
this phase does not modify. Claude's recommendations are inputs, not
decisions. Every record is additionally blocked on BOTH independent
dataset-level gates — the qualified counsel determination (Gate L1)
and Joseph's separate product decision (Gate L2) — regardless of
what happens below.

**Truncation rule:** recommendation cells marked "(summary only)"
are NOT decision-complete. Before recording any decision, the
reviewer MUST consult the exact proposal row in the workbook, found
by the ledger_id shown in every row. No decision may be based only
on truncated text.

## Summary counts

- 48 records total (1:1 with the authoritative pending ledger).
- Specialist input required: 38. Records with no S&C flag currently
  recorded: 10.
- Blocked on the two dataset-level gates (L1 counsel + L2 product)
  regardless of anatomy resolution: ALL 48.
- Eligibility-recommendation distribution (each record's FIRST
  blocker; many have several — see blocking_questions): specialist
  28, equipment 9 (the 8 unknowns + the Weighted Plank
  contradiction), vocabulary 8, tracking 1, naming 2.
- Overlap arithmetic (mechanical): 48 unique records appear 56 times
  across the nine batches = 8 extra appearances from exactly 7
  records — Farmers Walk (3 appearances: tracking, laterality,
  carries = 2 extra), Weighted Plank (2: tracking, carries),
  Heel Walk (2: vocabulary/tibialis, laterality), Jumping Lunge
  (2: Olympic, laterality), Wall Walk (2: contested, laterality),
  Jefferson Curl (2: equipment, contested), Ground to Overhead
  (2: equipment, Olympic). 2+1+1+1+1+1+1 = 8.

**Records with no S&C flag currently recorded (10):**
Bayesian Curl, Donkey Calf Raise, Dragon Flag, Farmers Walk, Hammer Curl, Lying Leg Curl, Seated Leg Curl, Standing Calf Raise, Standing Hip Flexor Raise, Weighted Plank.
These records remain BLOCKED on both dataset-level gates and their
own product decisions; the absence of an S&C flag is not validation
— their carried-forward values are candidates, not verified facts.

**Records blocked on specialist input (38):** all others — every
neck, tibialis, rotator-cuff, Olympic/full-body, and contested-
anatomy record.

## Batch 1 — Naming/collision (2) — decides: Joseph (product owner)

Shared decision: both source variants collide conceptually with the
seeded generic "Leg curl" (machine). Import them as DISTINCT
canonical names, never renaming, merging, or aliasing the seed?
Per-user collision semantics already protect users.

| Exercise | ledger_id (exact proposal row) | Recommendation | Confidence | Decision (unchecked) |
|---|---|---|---|---|
| Lying Leg Curl | https://www.strengthlog.com/lying-leg-curl/ | adopt the source name 'Lying Leg Curl' as a DISTINCT canonical name; do NOT rename or replace the se... (summary only) | medium | [ ] accept  [ ] revise  [ ] reject  [ ] defer |
| Seated Leg Curl | https://www.strengthlog.com/seated-leg-curl/ | adopt the source name 'Seated Leg Curl' as a DISTINCT canonical name; do NOT rename or replace the s... (summary only) | medium | [ ] accept  [ ] revise  [ ] reject  [ ] defer |

## Batch 2 — Anatomy vocabulary gaps (8) — decides: Joseph + optional S&C input

Shared decision: the 25-value muscle vocabulary has no neck and no
tibialis value; the manifest mapped these to 'other'. Either extend
the vocabulary (a separately reviewed schema/product change — NOT
part of this phase) or permanently accept 'other'.

Neck (4):

| Exercise | ledger_id (exact proposal row) | Recommendation | Confidence | Decision (unchecked) |
|---|---|---|---|---|
| Lying Neck Curl | https://www.strengthlog.com/lying-neck-curl/ | unresolved - vocabulary gap: decide whether to add a 'neck' value to the 25-value muscle vocabulary ... (summary only) | low | [ ] accept  [ ] revise  [ ] reject  [ ] defer |
| Lying Neck Extension | https://www.strengthlog.com/lying-neck-extension/ | unresolved - vocabulary gap: decide whether to add a 'neck' value to the 25-value muscle vocabulary ... (summary only) | low | [ ] accept  [ ] revise  [ ] reject  [ ] defer |
| Prone Neck Bridge | https://www.strengthlog.com/prone-neck-bridge/ | unresolved - vocabulary gap: decide whether to add a 'neck' value to the 25-value muscle vocabulary ... (summary only) | low | [ ] accept  [ ] revise  [ ] reject  [ ] defer |
| Supine Neck Bridge | https://www.strengthlog.com/supine-neck-bridge/ | unresolved - vocabulary gap: decide whether to add a 'neck' value to the 25-value muscle vocabulary ... (summary only) | low | [ ] accept  [ ] revise  [ ] reject  [ ] defer |

Tibialis (4):

| Exercise | ledger_id (exact proposal row) | Recommendation | Confidence | Decision (unchecked) |
|---|---|---|---|---|
| Heel Walk | https://www.strengthlog.com/heel-walks/ | unresolved - vocabulary gap: decide whether to add a tibialis/shin value to the muscle vocabulary or... (summary only) | low | [ ] accept  [ ] revise  [ ] reject  [ ] defer |
| Kettlebell Tibialis Raise | https://www.strengthlog.com/kettlebell-tibialis-raise/ | unresolved - vocabulary gap: decide whether to add a tibialis/shin value to the muscle vocabulary or... (summary only) | low | [ ] accept  [ ] revise  [ ] reject  [ ] defer |
| Tibialis Band Pull | https://www.strengthlog.com/tibialis-band-pull/ | unresolved - vocabulary gap: decide whether to add a tibialis/shin value to the muscle vocabulary or... (summary only) | low | [ ] accept  [ ] revise  [ ] reject  [ ] defer |
| Tibialis Raise | https://www.strengthlog.com/tibialis-raise/ | unresolved - vocabulary gap: decide whether to add a tibialis/shin value to the muscle vocabulary or... (summary only) | low | [ ] accept  [ ] revise  [ ] reject  [ ] defer |

## Batch 3 — Tracking-mode questions (2) — decides: Joseph

Shared decision: loaded holds/carries are unrepresentable in the
four current modes without losing either load or duration/distance.
Options per record: pick a lossy mode, or defer the record.

| Exercise | ledger_id (exact proposal row) | Recommendation | Confidence | Decision (unchecked) |
|---|---|---|---|---|
| Farmers Walk | https://www.strengthlog.com/farmers-walk/ | unresolved - product decision: 'weight_reps' (reps as carries) is lossy and no distance/time-under-l... (summary only) | low | [ ] accept  [ ] revise  [ ] reject  [ ] defer |
| Weighted Plank | https://www.strengthlog.com/weighted-plank/ | unresolved - product decision: 'timed' loses the external load, 'weight_reps' loses the hold duratio... (summary only) | low | [ ] accept  [ ] revise  [ ] reject  [ ] defer |

## Batch 4 — Laterality questions (4) — decides: Joseph

Shared decision: 'alternating' movements deliver to the tenant
schema as unilateral=true (the committed delivery mapping). Confirm
or change that product behavior.

| Exercise | ledger_id (exact proposal row) | Recommendation | Confidence | Decision (unchecked) |
|---|---|---|---|---|
| Farmers Walk | https://www.strengthlog.com/farmers-walk/ | keep 'alternating' in the catalog; confirm the committed tenant mapping (alternating -> unilateral=t... (summary only) | medium | [ ] accept  [ ] revise  [ ] reject  [ ] defer |
| Heel Walk | https://www.strengthlog.com/heel-walks/ | keep 'alternating' in the catalog; confirm the committed tenant mapping (alternating -> unilateral=t... (summary only) | medium | [ ] accept  [ ] revise  [ ] reject  [ ] defer |
| Jumping Lunge | https://www.strengthlog.com/jumping-lunges/ | keep 'alternating' in the catalog; confirm the committed tenant mapping (alternating -> unilateral=t... (summary only) | medium | [ ] accept  [ ] revise  [ ] reject  [ ] defer |
| Wall Walk | https://www.strengthlog.com/wall-walk/ | keep 'alternating' in the catalog; confirm the committed tenant mapping (alternating -> unilateral=t... (summary only) | medium | [ ] accept  [ ] revise  [ ] reject  [ ] defer |

## Batch 5 — Equipment uncertainty (8) — decides: Joseph

Shared decision: no implement could be reliably inferred from these
names, and inventing one is forbidden. The catalog schema requires a
non-null equipment value, so each record needs an explicit
product-owner assignment (or deferral). (The Weighted Plank
equipment CONTRADICTION is handled in Batch 3/8 via its proposal
row; its equipment is also unresolved.)

| Exercise | ledger_id (exact proposal row) | Recommendation | Confidence | Decision (unchecked) |
|---|---|---|---|---|
| Bayesian Curl | https://www.strengthlog.com/bayesian-curl/ | unresolved - DO NOT infer an implement from the name; the catalog schema requires a non-null equipme... (summary only) | low | [ ] accept  [ ] revise  [ ] reject  [ ] defer |
| Donkey Calf Raise | https://www.strengthlog.com/donkey-calf-raises/ | unresolved - DO NOT infer an implement from the name; the catalog schema requires a non-null equipme... (summary only) | low | [ ] accept  [ ] revise  [ ] reject  [ ] defer |
| Dragon Flag | https://www.strengthlog.com/dragon-flag/ | unresolved - DO NOT infer an implement from the name; the catalog schema requires a non-null equipme... (summary only) | low | [ ] accept  [ ] revise  [ ] reject  [ ] defer |
| Ground to Overhead | https://www.strengthlog.com/ground-to-overhead/ | unresolved - DO NOT infer an implement from the name; the catalog schema requires a non-null equipme... (summary only) | low | [ ] accept  [ ] revise  [ ] reject  [ ] defer |
| Hammer Curl | https://www.strengthlog.com/hammer-curl/ | unresolved - DO NOT infer an implement from the name; the catalog schema requires a non-null equipme... (summary only) | low | [ ] accept  [ ] revise  [ ] reject  [ ] defer |
| Jefferson Curl | https://www.strengthlog.com/jefferson-curl/ | unresolved - DO NOT infer an implement from the name; the catalog schema requires a non-null equipme... (summary only) | low | [ ] accept  [ ] revise  [ ] reject  [ ] defer |
| Standing Calf Raise | https://www.strengthlog.com/standing-calf-raise/ | unresolved - DO NOT infer an implement from the name; the catalog schema requires a non-null equipme... (summary only) | low | [ ] accept  [ ] revise  [ ] reject  [ ] defer |
| Standing Hip Flexor Raise | https://www.strengthlog.com/standing-hip-flexor-raise/ | unresolved - DO NOT infer an implement from the name; the catalog schema requires a non-null equipme... (summary only) | low | [ ] accept  [ ] revise  [ ] reject  [ ] defer |

## Batch 6 — Olympic/full-body classification (13) — decides: qualified S&C reviewer + Joseph

Shared decision: explosive/Olympic-derived movements recruit
broadly; the manifest's primary/secondary mappings are flagged
carried-forward candidates. A qualified strength-and-conditioning
reviewer must confirm or correct each mapping.

| Exercise | ledger_id (exact proposal row) | Recommendation | Confidence | Decision (unchecked) |
|---|---|---|---|---|
| Box Jump | https://www.strengthlog.com/box-jump/ | unresolved - retain the manifest mapping (primary 'quads', secondary ['calves', 'glutes']) ONLY if a... (summary only) | low | [ ] accept  [ ] revise  [ ] reject  [ ] defer |
| Depth Jump | https://www.strengthlog.com/depth-jump/ | unresolved - retain the manifest mapping (primary 'quads', secondary ['calves', 'glutes']) ONLY if a... (summary only) | low | [ ] accept  [ ] revise  [ ] reject  [ ] defer |
| Devils Press | https://www.strengthlog.com/devils-press/ | unresolved - retain the manifest mapping (primary 'full_body', secondary []) ONLY if a qualified str... (summary only) | low | [ ] accept  [ ] revise  [ ] reject  [ ] defer |
| Ground to Overhead | https://www.strengthlog.com/ground-to-overhead/ | unresolved - retain the manifest mapping (primary 'quads', secondary ['calves', 'glutes']) ONLY if a... (summary only) | low | [ ] accept  [ ] revise  [ ] reject  [ ] defer |
| Jerk | https://www.strengthlog.com/jerk/ | unresolved - retain the manifest mapping (primary 'full_body', secondary []) ONLY if a qualified str... (summary only) | low | [ ] accept  [ ] revise  [ ] reject  [ ] defer |
| Jump Squat | https://www.strengthlog.com/jump-squat/ | unresolved - retain the manifest mapping (primary 'quads', secondary ['calves', 'glutes']) ONLY if a... (summary only) | low | [ ] accept  [ ] revise  [ ] reject  [ ] defer |
| Jumping Lunge | https://www.strengthlog.com/jumping-lunges/ | unresolved - retain the manifest mapping (primary 'quads', secondary ['calves', 'glutes']) ONLY if a... (summary only) | low | [ ] accept  [ ] revise  [ ] reject  [ ] defer |
| Kettlebell Thrusters | https://www.strengthlog.com/kettlebell-thrusters/ | unresolved - retain the manifest mapping (primary 'quads', secondary ['calves', 'glutes']) ONLY if a... (summary only) | low | [ ] accept  [ ] revise  [ ] reject  [ ] defer |
| Lateral Bound | https://www.strengthlog.com/lateral-bound/ | unresolved - retain the manifest mapping (primary 'quads', secondary ['calves', 'glutes']) ONLY if a... (summary only) | low | [ ] accept  [ ] revise  [ ] reject  [ ] defer |
| Power Jerk | https://www.strengthlog.com/power-jerk/ | unresolved - retain the manifest mapping (primary 'full_body', secondary []) ONLY if a qualified str... (summary only) | low | [ ] accept  [ ] revise  [ ] reject  [ ] defer |
| Split Jerk | https://www.strengthlog.com/split-jerk/ | unresolved - retain the manifest mapping (primary 'full_body', secondary []) ONLY if a qualified str... (summary only) | low | [ ] accept  [ ] revise  [ ] reject  [ ] defer |
| Squat Jerk | https://www.strengthlog.com/squat-jerk/ | unresolved - retain the manifest mapping (primary 'full_body', secondary []) ONLY if a qualified str... (summary only) | low | [ ] accept  [ ] revise  [ ] reject  [ ] defer |
| Turkish Get-Up | https://www.strengthlog.com/turkish-get-up/ | unresolved - retain the manifest mapping (primary 'full_body', secondary []) ONLY if a qualified str... (summary only) | low | [ ] accept  [ ] revise  [ ] reject  [ ] defer |

## Batch 7 — Rotator-cuff classification (8) — decides: qualified S&C reviewer + Joseph

Shared decision: the vocabulary has no rotator-cuff value;
'shoulders' is the least-wrong supported primary. Confirm it, or
route into the vocabulary decision.

| Exercise | ledger_id (exact proposal row) | Recommendation | Confidence | Decision (unchecked) |
|---|---|---|---|---|
| Band External Shoulder Rotation | https://www.strengthlog.com/band-external-shoulder-rotation/ | unresolved - keep 'shoulders' (closest supported value) ONLY if a qualified strength-and-conditionin... (summary only) | low | [ ] accept  [ ] revise  [ ] reject  [ ] defer |
| Band Internal Shoulder Rotation | https://www.strengthlog.com/band-internal-shoulder-rotation/ | unresolved - keep 'shoulders' (closest supported value) ONLY if a qualified strength-and-conditionin... (summary only) | low | [ ] accept  [ ] revise  [ ] reject  [ ] defer |
| Cable External Shoulder Rotation | https://www.strengthlog.com/cable-external-shoulder-rotation/ | unresolved - keep 'shoulders' (closest supported value) ONLY if a qualified strength-and-conditionin... (summary only) | low | [ ] accept  [ ] revise  [ ] reject  [ ] defer |
| Cable Internal Shoulder Rotation | https://www.strengthlog.com/internal-shoulder-rotations/ | unresolved - keep 'shoulders' (closest supported value) ONLY if a qualified strength-and-conditionin... (summary only) | low | [ ] accept  [ ] revise  [ ] reject  [ ] defer |
| Dumbbell Horizontal External Shoulder Rotation | https://www.strengthlog.com/dumbbell-horizontal-external-shoulder-rotation/ | unresolved - keep 'shoulders' (closest supported value) ONLY if a qualified strength-and-conditionin... (summary only) | low | [ ] accept  [ ] revise  [ ] reject  [ ] defer |
| Dumbbell Horizontal Internal Shoulder Rotation | https://www.strengthlog.com/dumbbell-horizontal-internal-shoulder-rotation/ | unresolved - keep 'shoulders' (closest supported value) ONLY if a qualified strength-and-conditionin... (summary only) | low | [ ] accept  [ ] revise  [ ] reject  [ ] defer |
| Lying Dumbbell External Shoulder Rotation | https://www.strengthlog.com/lying-dumbbell-external-shoulder-rotation/ | unresolved - keep 'shoulders' (closest supported value) ONLY if a qualified strength-and-conditionin... (summary only) | low | [ ] accept  [ ] revise  [ ] reject  [ ] defer |
| Lying Dumbbell Internal Shoulder Rotation | https://www.strengthlog.com/lying-dumbbell-internal-shoulder-rotation/ | unresolved - keep 'shoulders' (closest supported value) ONLY if a qualified strength-and-conditionin... (summary only) | low | [ ] accept  [ ] revise  [ ] reject  [ ] defer |

## Batch 8 — Loaded carries/holds (2) — decides: Joseph (overlaps Batch 3)

Same two records as Batch 3, viewed as a movement-pattern question:
should loaded carries/holds enter the catalog at all before a
tracking mode exists that fits them? (Weighted Plank additionally
carries the equipment contradiction — see its proposal row.)

| Exercise | ledger_id (exact proposal row) | Recommendation | Confidence | Decision (unchecked) |
|---|---|---|---|---|
| Farmers Walk | https://www.strengthlog.com/farmers-walk/ | blocked until: tracking-mode decision; and BOTH independent dataset-level gates (qualified counsel d... (summary only) | high | [ ] accept  [ ] revise  [ ] reject  [ ] defer |
| Weighted Plank | https://www.strengthlog.com/weighted-plank/ | blocked until: equipment decision; tracking-mode decision; and BOTH independent dataset-level gates ... (summary only) | high | [ ] accept  [ ] revise  [ ] reject  [ ] defer |

## Batch 9 — Other contested anatomy (9) — decides: qualified S&C reviewer + Joseph

Shared decision: each movement's mapping is individually contested
(EXLIB-1A review notes). Per-record S&C confirmation required.

| Exercise | ledger_id (exact proposal row) | Recommendation | Confidence | Decision (unchecked) |
|---|---|---|---|---|
| Cossack Squat | https://www.strengthlog.com/cossack-squat/ | unresolved - requires qualified strength-and-conditioning review of the manifest mapping (primary 'g... (summary only) | low | [ ] accept  [ ] revise  [ ] reject  [ ] defer |
| Cuban Press | https://www.strengthlog.com/cuban-press/ | unresolved - requires qualified strength-and-conditioning review of the manifest mapping (primary 's... (summary only) | low | [ ] accept  [ ] revise  [ ] reject  [ ] defer |
| Dumbbell Pullover | https://www.strengthlog.com/dumbbell-pullover/ | unresolved - requires qualified strength-and-conditioning review of the manifest mapping (primary 'c... (summary only) | low | [ ] accept  [ ] revise  [ ] reject  [ ] defer |
| Jefferson Curl | https://www.strengthlog.com/jefferson-curl/ | unresolved - requires qualified strength-and-conditioning review of the manifest mapping (primary 'l... (summary only) | low | [ ] accept  [ ] revise  [ ] reject  [ ] defer |
| Kettlebell Halo | https://www.strengthlog.com/kettlebell-halo/ | unresolved - requires qualified strength-and-conditioning review of the manifest mapping (primary 's... (summary only) | low | [ ] accept  [ ] revise  [ ] reject  [ ] defer |
| Kettlebell Windmill | https://www.strengthlog.com/kettlebell-windmill/ | unresolved - requires qualified strength-and-conditioning review of the manifest mapping (primary 'g... (summary only) | low | [ ] accept  [ ] revise  [ ] reject  [ ] defer |
| Poliquin Raise | https://www.strengthlog.com/poliquin-raise/ | unresolved - requires qualified strength-and-conditioning review of the manifest mapping (primary 's... (summary only) | low | [ ] accept  [ ] revise  [ ] reject  [ ] defer |
| Rack Pull | https://www.strengthlog.com/rack-pull/ | unresolved - requires qualified strength-and-conditioning review of the manifest mapping (primary 'u... (summary only) | low | [ ] accept  [ ] revise  [ ] reject  [ ] defer |
| Wall Walk | https://www.strengthlog.com/wall-walk/ | unresolved - requires qualified strength-and-conditioning review of the manifest mapping (primary 's... (summary only) | low | [ ] accept  [ ] revise  [ ] reject  [ ] defer |

## Gate matrix — what must close before EXLIB-1C implementation

FAIL-CLOSED: every row must be explicitly closed, in writing, before
EXLIB-1C implementation may begin. **EXLIB-1C implementation may not
begin merely because this packet exists. Joseph and ChatGPT must
explicitly approve the legal/product outcome and the resolved
content manifest in a later turn.**

| # | Gate | Owner | Status |
|---|---|---|---|
| 1 | Gate L1 — qualified counsel determination (affirmative + dated + attributable + scoped to the manifest fingerprint and approved fields; NEVER suppliable by Joseph, ChatGPT, or Claude) | qualified legal counsel | OPEN |
| 2 | Terms-of-Service evidence for counsel (the applicable terms provided to counsel, or an explicit dated record that they could not be established) | Joseph (obtains) -> counsel (receives) | OPEN |
| 3 | Gate L2 — Joseph's separate product decision, made only AFTER reviewing counsel's result | Joseph | OPEN |
| 4 | Provenance/attribution approval (packet section 4 items 3 and 7) | Joseph (+ counsel) | OPEN |
| 5 | All 48 ledger resolutions recorded in the authoritative ledger with reviewer + timestamp + rationale | Joseph + reviewers | OPEN |
| 6 | Specialist sign-off recorded for every neck/tibialis/rotator-cuff/Olympic/contested record | qualified S&C reviewer | OPEN |
| 7 | Deterministic final canonical names and aliases fixed for all approved records | Joseph | OPEN |
| 8 | Vocabulary decisions for unsupported anatomy (neck, tibialis; rotator-cuff routing) | Joseph | OPEN |
| 9 | Tracking-mode and laterality resolutions for the flagged records (including the Weighted Plank equipment contradiction) | Joseph | OPEN |
| 10 | Dry-run importer design review (how rows enter the closed catalog + run membership; no client path) | ChatGPT review | OPEN |
| 11 | Catalog run membership freeze plan (which run(s), which members, seal procedure) | Joseph + ChatGPT | OPEN |
| 12 | Review-audit completeness (every catalog row will carry non-blank review audit per the applied CHECKs) | mechanical + review | OPEN |
| 13 | No unresolved record included (import set excludes every record without a recorded resolution) | mechanical | OPEN |
| 14 | Rollback rehearsal (rollback_catalog_delivery exercised on a disposable cluster against the real import set) | Claude (local only) + review | OPEN |
| 15 | Exact approved content manifest fingerprint (byte-pinned final import set, approved like a migration) | Joseph + ChatGPT | OPEN |
| 16 | Explicit Supabase application/loading authorization for that exact fingerprint | Joseph/ChatGPT only | OPEN |
| 17 | Hosted QA plan (post-load verification on the public site + read-only checks) | Joseph + ChatGPT | OPEN |

Seventeen gates, all OPEN.

## Zero-approval confirmation

Nothing in this guide, the packet, or the proposals workbook
approves anything. The authoritative ledger remains 48/48 pending
with null reviewer fields; all 48 proposals are unapproved with
import_eligible=false; the catalog remains empty; BOTH dataset-level
gates are unmade.
