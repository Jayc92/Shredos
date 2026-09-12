# weight_time five-entry endgame: lifecycle discovery matrix

STATUS: DISCOVERY RECORD. Read-only derivation. No hosted contact, no execution, no decision.

> **Correction, 2026-09-12 (independent review finding R-E1; a labelled later correction, not a rewrite).**
> Rows F, G and H below and section 7 describe the run as carrying ONLY the five weight_time
> identities. That design was REJECTED by the independent review: the five are additive, not a
> replacement. The prepared run is now CUMULATIVE: it carries forward all six membership rows of the
> sealed historical plank run `exlib2u-plank-release1-staged-v1` (3 exercise + 3 alias members, copied
> from that run's own rows, never retyped) PLUS the five, so stage 6 creates 11 membership rows
> (8 exercise + 3 alias), the stage-6 vector becomes `8/8/10/3/11/6/2/2/2/17/8`, the seal reports
> `exercise_members 8, alias_members 3`, and the Plank reconciliation dispatch of migration 026 IS
> armed for the new run. Row H's "derived expected effect" therefore no longer applies; the
> measured effects for three user histories are in `docs/weight-time-five-entry-endgame-report.md`,
> including finding **F-E8**: the committed delivery function REFUSES the cumulative run for a user
> who already received Plank from the historical run (`exlib_plank_link_valid` demands the delivering
> run's own id). Everything else in this record stands.
>
> **Correction, 2026-09-12, F-E8 remediation (a labelled later correction).** Independent review
> adjudicated F-E8 a confirmed database-contract defect and authorized exactly one new migration,
> `supabase/migrations/029_exlib_plank_cross_run_idempotency.sql`: it replaces ONLY the shared helper
> `exlib_plank_link_valid` (existing signature) so that an existing Plank link is valid when its
> `import_run_id` is the delivering run OR a PRIOR run that is approved, non-dry, sealed, unrevoked
> and carries EXACTLY the same catalog snapshot in its membership. Row H's delivery contract for an
> existing plank user therefore becomes: eligible 8, inserted 5, skipped_already_delivered 3,
> alias_already_delivered 3, `already_valid_idempotent` (measured; see the report). 029 is PREPARED,
> NOT APPLIED hosted; it must be live before the run-key repoint and is not a precondition of stages
> 1 to 7. Migrations 026, 027 and 028 are untouched.

## What this is

The required discovery deliverable for the post-W14 five-entry lifecycle endgame. Every row was
derived by reading committed migration bytes, not from prior prose or from the instruction's own
naming. Where the instruction's names and the committed signatures disagree, **the committed bytes
win and the disagreement is recorded explicitly** in section 8.

Sources read, with the bytes they were read at (all at tree `0b438079693867fd1757cec383a2bc986b1c905c`):

| Path | Bytes | Role in this matrix |
| --- | --- | --- |
| `supabase/migrations/023_exlib_catalog_and_delivery_contract.sql` | 92806 | catalog table, run/run-item contract, seal, GRANT posture |
| `supabase/migrations/027_exlib_catalog_content_schema.sql` | 65455 | content table, the five content functions, freeze triggers, admission manifest |
| `supabase/migrations/028_weight_time_tracking_mode.sql` | 37162 | `weight_time` mode, and the current definition of `deliver_catalog_exercises` |
| `src/lib/supabase/deliver-catalog.ts` | (tracked) | how a run is selected at runtime, and the fail-closed posture |

## 1. The matrix

Columns are exactly as required: state -> permitted action -> resulting state -> authority ->
immutable/frozen fields -> human fields -> one-use/replay behaviour.

### Row A. Snapshot review (the five are here now)

| Column | Value |
| --- | --- |
| **From state** | `exercise_catalog` row, `review_status = 'pending'`, `is_active = true`, `reviewed_by / reviewed_at / review_rationale` all NULL |
| **Permitted action** | **Direct owner `UPDATE` on `public.exercise_catalog`.** There is NO controlled function for snapshot review; see section 3 for the proof |
| **To state** | `review_status = 'approved'` with a complete non-blank audit tuple, plus ONE trigger-appended row in `exercise_catalog_review_events` |
| **Authority** | table owner (`postgres`) in the hosted operator context. None of the four 027 NOLOGIN roles can do this |
| **Immutable / frozen** | `id`, `logical_id`, `catalog_version`, and every governed descriptive field (canonical_name, category, primary_muscle, equipment, laterality, tracking_mode, provenance, movement_pattern, training_role, difficulty, availability, the four source/discovery fields). The appended review event is insert-only and only accepted at trigger depth >= 2 |
| **Human fields** | **FAMILY A**, per identity: `decision`, `reviewer`, `reviewer_role_or_credential`, `reviewed_at`, `rationale`, `evidence` |
| **One-use / replay** | The review transition is one-way (`pending -> approved`). A second application does not silently succeed: the package's own pre-state assertion (`review_status = 'pending'` and all three audit fields NULL) fails closed. Ambiguous execution => READ STATE FIRST, never blind retry |

**Two named constraints that explain the shape of the five snapshots.** Migration 027 drops the 023
`NOT NULL` on all four discovery columns (line 57 for `import_confidence`) and replaces it with a
provenance coupling:

- `exercise_catalog_provenance_sources_chk`: `external_source_derived` requires all four of
  `source_url`, `source_page`, `retrieved_at`, `import_confidence` to be non-null;
  `forgefitos_original` requires all four to be NULL.
- `exercise_catalog_discovery_metadata_chk`: `forgefitos_original` additionally requires
  `movement_pattern`, `training_role`, `difficulty` and `availability` to be non-null.

This is why 132 and 133 carry four source values while 137, 138 and 139 carry four NULLs: it is
constraint-enforced, not conventional, and the packages assert both constraints by name rather than
assuming the shape. The migration's own comment records why fabricating a placeholder confidence for
an original entry is forbidden.

**Load-bearing detail.** `review_rationale` must be non-blank, and not only because this row says so:
the *seal* in Row G re-checks `reviewed_by` and `review_rationale` on every exercise member. A blank
rationale here therefore blocks the seal four stages later. (The seal does **not** check
`reviewed_at`; the review-audit CHECK on the catalog row does.)

### Row B. Content draft load

| Column | Value |
| --- | --- |
| **From state** | approved snapshot; no `exercise_catalog_content` row for the identity |
| **Permitted action** | `load_catalog_content_draft(p_logical_id, p_content_id, p_content_version, p_authored_by, p_authored_at, p_setup_steps, p_execution_steps, p_breathing_cue, p_common_mistakes, p_safety_guidance, p_equipment_setup, p_accessibility_alternative, p_expected_relationships)` |
| **To state** | content version born `content_status = 'pending'`, `publication_status = 'draft'`, `import_admitted = false`, all three review-audit fields NULL, all three admission fields NULL; plus zero or more rows in `exercise_catalog_content_expected_relationships` |
| **Authority** | `exlib_catalog_loader` |
| **Immutable / frozen** | born-state is enforced by `exlib_freeze_content_version()`: a version may not be born approved, published, or admitted. `logical_id` and `content_version` are identity and immutable thereafter; `UNIQUE (logical_id, content_version)` |
| **Human fields** | none. Drafting is machine work; `authored_by` discloses AI drafting |
| **One-use / replay** | Re-loading the same `(logical_id, content_version)` violates the UNIQUE constraint and fails closed. `p_content_id` is `COALESCE(p_content_id, gen_random_uuid())`, so content UUIDs are **predeclarable** and every downstream package can bind them by value |

### Row C. Content review

| Column | Value |
| --- | --- |
| **From state** | content version `content_status = 'pending'`, audit fields NULL |
| **Permitted action** | `apply_content_review(p_logical_id, p_content_id, p_decision, p_reviewer, p_reviewed_at, p_rationale)` |
| **To state** | `content_status IN ('approved','revised','rejected')` with a complete non-blank `(reviewed_by, reviewed_at, review_rationale)` tuple |
| **Authority** | `exlib_catalog_reviewer` |
| **Immutable / frozen** | the freeze trigger forbids any payload change or admission change in the SAME statement as a review decision: the decision must travel alone. Allowed edges are `pending -> approved|revised|rejected` and `approved -> revised|rejected`; a decided version's payload is immutable |
| **Human fields** | **FAMILY B**, per identity: `decision`, `reviewer`, `reviewer_role_or_credential`, `reviewed_at`, `rationale`, plus the promoted `needs_human_judgment_confirmations` set. Optional `evidence` never substitutes for the required four |
| **One-use / replay** | Re-applying against an already-decided version fails closed on the one-way edge set. `pending` is reachable only at birth and never again |

**Precedent note, surfaced rather than decided.** The one promoted content review in this repo
(`docs/exlib2g-plank-content.jsonl`, approved under EXLIB-2I) was performed by a **named external
specialist with a credential** (a personal trainer), not by the repository operator, and the promoted
form's own decision requirements say "named human specialist, never AI". The database only requires
non-blank strings, so it does not itself force a specialist. This is a real dependency and is raised
as a reviewer question rather than resolved here: see the human-review document.

### Row D. Content admission

| Column | Value |
| --- | --- |
| **From state** | content version `content_status = 'approved'`, `publication_status = 'draft'`, `import_admitted = false` |
| **Permitted action** | `admit_catalog_content(p_logical_id, p_content_id, p_source_artifact_sha256)` |
| **To state** | `import_admitted = true`, `admitted_source_sha256` = the caller-supplied carrier digest, `admitted_fingerprint` = `exlib_content_admission_fingerprint(content_id)` recomputed from live database state |
| **Authority** | `exlib_catalog_admission` |
| **Immutable / frozen** | admission travels alone; requires approved + draft + unadmitted; the stored `admitted_fingerprint` must equal the recomputed value, so **arbitrary hashes are rejected**. Both admission digests are constrained to `^[0-9a-f]{64}$`, and admission is all-or-nothing across the three fields. `_admission_order_chk` independently forbids admitting a still-pending version |
| **Human fields** | none directly. But see the next paragraph: the fingerprint *contains* the human review tuple |
| **One-use / replay** | One-way. A second admission fails closed on `import_admitted = false` |

**Why one required manifest value cannot be precomputed.** `exlib_content_admission_manifest`
includes a `review` line binding `content_status`, `reviewed_by`, `reviewed_at` as an epoch, and
`review_rationale`. The admission fingerprint is therefore **not computable before the human content
decision exists**. Consequences, both honoured by the manifest in this round:

- the fingerprint published *now* must be a **payload** fingerprint over the candidate content bytes;
- `admitted_source_sha256` (the carrier digest) IS knowable now, and is pinned;
- real admission fingerprints appear only in the disposable local proof, under clearly-marked
  synthetic reviewer decisions that must never reach a governing production artifact.

### Row E. Content publication

| Column | Value |
| --- | --- |
| **From state** | approved + admitted + `publication_status = 'draft'` |
| **Permitted action** | `publish_catalog_content(p_logical_id, p_content_id)` |
| **To state** | `publication_status = 'published'`, and `exercise_catalog_relationships` for that identity replaced by the version's expected set |
| **Authority** | `exlib_catalog_admin` |
| **Immutable / frozen** | publication is one-way (`draft -> published -> retired`) and must travel alone. `_publication_chk` requires approved AND admitted. `exercise_catalog_content_one_published_idx` permits at most ONE published version per logical identity. The trigger additionally re-checks **fingerprint freshness** (`OLD.admitted_fingerprint = exlib_content_admission_fingerprint(OLD.id)`), so a version whose bound state drifted after admission cannot be published |
| **Human fields** | none |
| **One-use / replay** | One-way; a second publication fails closed on `publication_status = 'draft'`. The projection swap is atomic inside the function: a session sentinel is set, the identity's outgoing relationships are deleted, the expected set is re-inserted, the sentinel is cleared. Structural bidirectional set equality is asserted |

### Row F. Delivery run creation and membership

| Column | Value |
| --- | --- |
| **From state** | no run with the chosen `run_key` |
| **Permitted action** | **Direct owner `INSERT`** into `exercise_catalog_import_runs`, then direct owner `INSERT`s into `exercise_catalog_run_items`. There is NO controlled function for run creation; see section 3 |
| **To state** | an unsealed, unapproved, unrevoked run (enforced at birth by `exlib_freeze_run_row`) with exactly the intended membership |
| **Authority** | table owner (`postgres`) in the hosted operator context |
| **Immutable / frozen** | `exlib_freeze_run_membership()` raises on ANY `UPDATE` of a membership row ("membership rows are immutable"), and refuses insertion or deletion once the parent run is sealed ("a sealed run's membership is PERMANENT; changed membership requires a NEW run"). It locks the parent run `FOR UPDATE`. `run_key` is globally UNIQUE, forever. Each item is exactly one of catalog member or alias member |
| **Human fields** | **FAMILY C**, once for the run: `run_key_literal`, `product_approved_by` + `product_approved_at`, `legal_approved_by` + `legal_approved_at`, `approval_rationale`, `run_membership` |
| **One-use / replay** | The UNIQUE `run_key` makes creation inherently one-use: a second creation with the same key fails closed. A membership fix after sealing is structurally impossible and requires a NEW run with a NEW key |

### Row G. Seal

| Column | Value |
| --- | --- |
| **From state** | unsealed run, non-empty membership, every exercise member approved/active/review-audited |
| **Permitted action** | `exlib_approve_and_seal_run(p_run_key)`. This is the ONE controlled function on the run surface |
| **To state** | `approved_for_delivery = true`, `sealed_at = NOW()`; returns `{run_key, sealed, exercise_members, alias_members}` |
| **Authority** | SECURITY DEFINER function; invoked in the hosted operator context |
| **Immutable / frozen** | `sealed_at` is set exactly once and NEVER cleared. On a sealed run, `run_key`, `dry_run`, `approved_for_delivery`, both approval evidence pairs, `sealed_at` and `created_at` are all immutable. Approval and seal must move together atomically. Dry runs cannot be sealed. Revocation is a ONE-WAY shutdown and only on a sealed run. The seal refuses an empty membership, and refuses if any exercise member is not `approved` + active + non-blank `reviewed_by` + non-blank `review_rationale` |
| **Human fields** | none at call time: the function *validates* the Family C evidence, it never populates it. The evidence must already be in the row, which is why Family C is consumed at Row F |
| **One-use / replay** | Explicitly one-use: the function refuses an unknown key and refuses an already-sealed run |

### Row H. Delivery (prepared, NOT triggered)

| Column | Value |
| --- | --- |
| **From state** | a sealed, approved, non-dry, unrevoked run; a signed-in tenant user |
| **Permitted action** | `deliver_catalog_exercises(p_run_key)` as redefined by migration 028 section D |
| **To state** | per-user rows in `public.exercises` (+ `exercise_muscles`), returning a 14-key JSONB summary |
| **Authority** | SECURITY DEFINER, but gated on `auth.uid()`: it is a **per-user tenant RPC**, not an operator batch. It raises if unauthenticated, and takes a per-user advisory transaction lock |
| **Immutable / frozen** | the run predicate is exact: `approved_for_delivery = true AND dry_run = false AND sealed_at IS NOT NULL AND revoked_at IS NULL`, else the whole delivery fails closed. Pre-checks skip an identity already delivered (`skipped_already_delivered`) or blocked by a name claim (`skipped_name_collision`) |
| **Human fields** | none |
| **One-use / replay** | Idempotent per user by `catalog_logical_id`: a second delivery skips rather than duplicates |

**Derived expected effect for these five.** No target's `lower(canonical_name)` equals `'plank'`
(they are `plate-weighted plank` and `weighted vest plank`), so the Plank snapshot gate is not armed:
`plank_disposition = 'not_in_run'`. All five take the generic insert path, which for
`tracking_mode = 'weight_time'` maps `exercise_type = 'strength'` via the explicit arm added by 028,
carries `tracking_mode = 'weight_time'` through, and sets `unilateral = (laterality <> 'bilateral')`
= false for all five. Expected fresh-user summary: `eligible 5, inserted 5`, every other counter 0,
five `inserted_catalog_logical_ids`, accounting offset 0, zero alias members.

## 2. The three human-decision families

The lifecycle needs human input at exactly three places, and they are NOT interchangeable.

| Family | Where consumed | Cardinality | Blank form |
| --- | --- | --- | --- |
| **A** snapshot review | Row A | once per identity (5) | `docs/weight-time-five-entry-snapshot-review-form.json` |
| **B** content review | Row C | once per identity (5) | `docs/weight-time-five-entry-content-review-form.json` |
| **C** run authority | Row F | once for the run | `docs/weight-time-five-entry-run-authority-form.json` |

All three ship blank. Blank or null NEVER reads as approval. No reviewer identity, timestamp or
rationale is invented, and no artifact says an approval happened that has not happened.

## 3. Two places where "use the controlled function" has no function to use

The governing instruction says: no direct table DML where a promoted controlled function exists. Two
transitions have **no** such function, so the promoted direct-owner path is the lawful mechanism.
This was proven from GRANT bytes, not assumed:

1. **Snapshot review.** Migration 023 grants nothing on `exercise_catalog` to any of the four roles,
   and the 027 roles hold EXECUTE on the content-lifecycle functions only. No function anywhere
   writes `exercise_catalog.review_status`. A direct owner `UPDATE` is therefore the only lawful
   surface, and it is exactly the mechanism promoted and executed for the plank release.
2. **Run and run-item creation.** Only `exlib_approve_and_seal_run` writes a run row, and it only
   `UPDATE`s a run that already exists. Nothing creates runs or run items. The promoted staged-run
   package states the same conclusion in its own header.

In both cases the *audit* is still enforced by triggers, not by trust: the review event is appended
by the freeze trigger, and membership immutability plus the seal preconditions are trigger-enforced.

## 4. The delivery-configuration dependency, stated plainly

`src/lib/supabase/deliver-catalog.ts` reads ONE scalar, `CATALOG_DELIVERY_RUN_KEY`, and passes it
straight to the RPC. `run_key` is UNIQUE. Therefore **exactly one run is deliverable per
deployment**, and delivering this five-entry release REQUIRES a production configuration change.
That is proven from committed code rather than assumed, which is what the instruction demanded.

Everything that follows from it, including the fact that repointing the key de-selects the plank
release for any user who has not already received it, and the fact that serving both releases
concurrently would require an application-code change (a dependency to REPORT, never to implement in
this round), is set out in `docs/weight-time-five-entry-delivery-configuration-dependency.md`.

## 5. Frozen fields across the whole lifecycle, in one place

Never written by any package in this round: the five `logical_id`s; `catalog_version`; every governed
descriptive and discovery field on the five snapshots; the three carry identities (134, 135, 136);
any other catalog identity; any already-published content; any run other than the new one; any tenant
row before delivery; the authority grant shape; migration 028 and every earlier migration; and
`scripts/verify-weight-time-w14.ts`.

## 6. One-use behaviour, summarised

Every stage fails closed on replay, by four different mechanisms, which is why no stage needs an
external "already done?" ledger:

- **UNIQUE constraints**: `run_key`; `(logical_id, content_version)`; one active logical row; one
  published content version per identity.
- **One-way trigger edges**: review status, publication status, admission, seal, revocation.
- **Exact pre-state assertions** inside each package's `DO $pre$` block, which refuse a second
  application before any mutation is attempted.
- **Recomputed digests**: the admission fingerprint must equal what the database recomputes, and
  publication re-checks that freshness.

## 7. Sequence, with what may not be merged

Seven packages, in order. The separations marked LOAD-BEARING exist because a database rule enforces
them, so they must not be combined to save time:

1. snapshot review (Row A) - 5 identities in one transaction
2. content draft load (Row B) - 5 versions in one transaction
3. content review (Row C) - **LOAD-BEARING**: a review decision may not travel with a payload change
4. content admission (Row D) - **LOAD-BEARING**: admission must travel alone
5. content publication (Row E) - **LOAD-BEARING**: publication must travel alone
6. run staging (Row F) - creation + membership
7. seal (Row G) - **LOAD-BEARING**: membership is permanent after this point

Delivery (Row H) is NOT a package in this round. It is a per-user runtime RPC behind a configuration
change, and it is prepared and documented, not triggered.

## 8. Where the committed bytes disagree with the instruction's naming

Recorded because the instruction directed that committed signatures win over remembered names:

- There is **no `cues` field**. The schema field is `breathing_cue`, singular.
- Snapshot review has **no controlled function**, so it cannot be "the promoted function for
  pending -> approved". See section 3.
- Run creation has **no controlled function** either. Only the seal does.
- The content-review function is `apply_content_review`, and it takes `p_decision` plus a three-part
  audit tuple; the stored columns are `content_status`, `reviewed_by`, `reviewed_at`,
  `review_rationale`.
- `admit_catalog_content` takes the **carrier** digest as its only caller-supplied hash; the
  admission fingerprint is computed by the database and cannot be supplied.
