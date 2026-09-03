# EXLIB-2N — target-snapshot human-review preparation record

Recorded 2026-09-03 (UTC). LOCAL-ONLY preparation milestone: this
phase prepares the evidence packets and DELIBERATELY UNFILLED human
decision forms needed to resolve the two adjudicated EXLIB-2N
blockers for the Dead bug and Ab wheel rollout target snapshots. It
performs NO review decision, fills NO form field, modifies NO
authored exercise record, flips NO eligibility, creates NO load
package, and contacts NO hosted service. This record APPROVES
NOTHING; it awaits Codex review.

## 1. The original fail-closed discovery (adjudicated correct)

EXLIB-2N first ran as target-snapshot load preparation and FAILED
CLOSED at its mandatory derivation gate with zero edits, on two
independent blockers, both derived from committed bytes only:

1. SNAPSHOT CATEGORY MISSING OR AMBIGUOUS. load_catalog_snapshot's
   p_category feeds exercise_catalog.category — NOT NULL with the
   exact vocabulary compound | isolation | cardio | mobility |
   other (migration 023). The authoring schema
   (docs/exlib2c-authoring-schema.json, additionalProperties:
   false) EXCLUDES category by design, so no authored artifact can
   carry it; the release inventory omits it from every row; the
   promoted Plank derivation ('isolation') was a seed-specific
   four-link chain that cannot apply to either target
   (corresponds_to_seed = null for both). For Ab wheel rollout NO
   committed source exists at all (name_matches_manifest_entry =
   false). For Dead bug the ONLY committed value is the EXTERNAL
   discovery manifest entry (StrengthLog, confidence medium,
   category "isolation"), which no promoted contract adopts as
   authoritative for a forgefitos_original release snapshot —
   ambiguous, not authoritative.
2. NO AUTHORIZED SOURCE ARTIFACT. Both authored records
   (batch02 line 12; batch04 line 5) are content_review.status =
   "pending" with null reviewer, review_status = "proposed", and
   import_eligible = false; both inventory rows carry
   specialist_review_required = true. The promoted EXLIB-2K
   load-preparation record rules that loading without a separately
   approved and eligible source artifact is FORBIDDEN and that the
   target-snapshot gate demands SEPARATELY REVIEWED target
   snapshots.

Codex adjudicated the fail-closed stop correct and reframed
EXLIB-2N as this human-review preparation.

## 2. Source gate

- main = origin/main = 9c73f3c484c79d97cc31ef0a6b2fcae76fa334fc
  (tree cc880929e26ba3954eff7e444e033c8793f2368d); annotated tag
  exlib2k-hosted-load-application-evidence-stable (tag object
  81c0954f2cb2971a79e1f139122e08bdca05acd0) peeling exactly to
  main; annotation byte-exact.
- Work branch exlib2n-target-snapshot-prep, taken from main with
  zero commits before this phase's work.
- Migrations exactly 001-027 with no 028; battery 77 suites /
  6,769 / 0; build and tsc clean; clean worktree/index/stash; no
  hosted contact.
- Frozen subjects (any byte change voids the packets and forms):
  - docs/exlib2c-release1-batch02-content.jsonl — 51,496 B, SHA-256
    1ddc3ab0bd92d60ef33960d82a8e0c8a2fdea1cb828d15fc9bf6a82c343
    05d48; Dead bug record = line 12 (1,900 B newline-excluded,
    SHA-256 3dbd0384542bdf6feb96d84a61d2d50b5c6ca0fdc057fcafded67ae
    b631a8796).
  - docs/exlib2c-release1-batch04-content.jsonl — 54,781 B, SHA-256
    e7def375e9b9560863796bff90746dc6ff2b2f7c4bd7735a3d53fc2cc975
    0568; Ab wheel rollout record = line 5 (2,178 B
    newline-excluded, SHA-256 475870776e6dd309c6646f05b33b9a3050d7f
    bacd653e245dc3534d288981a8b).
  - The admitted Plank artifact (2,928 B / d82078490efa9ef13e128e7b
    7b742fbda8ea9e74e32382252d96c326c679d752) and the SPENT
    EXLIB-2K load package (29,760 B / a1b6dd55850c5d544e2f484d1ce48
    33b41deec7f3dd4d4c2373cb3b50daaccf0) remain byte-frozen.

## 3. What this phase prepared

Exactly six paths:

1. docs/exlib2n-dead-bug-target-snapshot-review-packet.md —
   evidence packet: frozen record rendered readably, full
   provenance, the two-decision review contract, an independent
   mechanical assessment per dimension (labels: PASS / CORRECTION
   REQUIRED / NEEDS HUMAN JUDGMENT / BLOCKED BY GOVERNANCE; zero
   CORRECTION REQUIRED found; nothing rewritten), and the category
   decision section.
2. docs/exlib2n-ab-wheel-rollout-target-snapshot-review-packet.md —
   the same for Ab wheel rollout, including the honestly surfaced
   judgment questions (equipment 'other', availability 'minimal'
   with a required device, tracking_mode weight_reps) — surfaced,
   not resolved, and nothing rewritten to pass.
3. docs/exlib2n-dead-bug-target-snapshot-review-form.json —
   deliberately unfilled decision form; every human-controlled
   field null.
4. docs/exlib2n-ab-wheel-rollout-target-snapshot-review-form.json —
   deliberately unfilled decision form; every human-controlled
   field null.
5. docs/exlib2n-target-snapshot-review-preparation-record.md — this
   record.
6. scripts/verify-exlib2n.ts — the dedicated static verifier.

## 4. Why category needs a distinct decision carrier

The authoring schema is a closed contract (additionalProperties:
false) that deliberately does not model the database snapshot
category, so a completed authoring review alone can never supply
it. The inventory omits it. The seed chain is inapplicable. The
manifest is external evidence at best (Dead bug) or absent (Ab
wheel rollout). Category is therefore carried as an EXPLICIT HUMAN
PRODUCT DECISION inside the completed review evidence: the form's
snapshot_category_decision (exactly one of the five legal values)
plus snapshot_category_rationale (>= 10 non-blank characters).
Category is product-visible because applied migration 026's
delivery paths copy the catalog snapshot's category into tenant
exercises rows (v_cat.category), so the decision reaches user-facing
state whenever delivery later occurs — a human product decision,
never an AI inference.

## 5. Why no schema migration is presently required

Every value both authored records carry is already legal under the
APPLIED vocabulary CHECKs: equipment 'other' and 'bodyweight',
laterality 'alternating' and 'bilateral', tracking_mode
'bodyweight' and 'weight_reps', every muscle and role, movement
pattern 'core_anti_extension', training_role 'core', difficulties
'beginner'/'advanced', availability 'minimal', provenance
'forgefitos_original' with its conditional NULL source fields — and
all five category values are already in 023's CHECK. What is
missing is a DECISION, not a column: the schema can already store
any legal outcome of the human review. The decision carrier is the
review form (repository evidence), exactly as the completed 2H/2I
evidence carried Plank's review; no ALTER TABLE, no new migration,
and no vocabulary change are needed for this preparation or for the
later load that consumes its completed evidence. (If the reviewer's
DECISIONS ever demanded a new vocabulary value — for example a
dedicated ab-wheel equipment value instead of 'other' — that would
be a separate, later, reviewed migration milestone; nothing in this
phase requires or performs one.)

## 6. Why the forms are evidence carriers, not executable authority

The forms bind exact fingerprints (source commit, tag object, batch
file bytes/SHA-256, record line bytes/SHA-256, intended logical
UUIDs) so a later milestone can prove WHAT was reviewed. They carry
the decision fields as data. Nothing reads them mechanically to
change state: an approved form does not modify the authored
artifact, does not flip import_eligible, does not load a snapshot,
does not satisfy the hosted target-snapshot gate, and does not
publish or project anything. Claude and ChatGPT may prepare and
validate the forms but may never fill or fabricate the human
fields; blank or null never reads as approval; any byte change to a
reviewed authored artifact voids its form. Every one of those
statements is pinned inside each form itself.

## 7. The complete later lifecycle (each step separately gated)

1. REVIEW PREPARATION — this milestone: packets + deliberately
   unfilled forms. Nothing decided.
2. COMPLETED HUMAN DECISION — a qualified human specialist
   (selected and credential-validated by the operator, never AI)
   fills each form: decision, reviewer, role/credential, offset
   date-time, rationale (>= 10 non-blank chars), the category
   selection (exactly one legal value) with its rationale (>= 10
   non-blank chars), and every needs-human-judgment confirmation
   explicitly true for approval.
3. SEPARATELY REVIEWED APPLICATION of that decision to the authored
   record — its own milestone (the EXLIB-2I precedent): the decided
   content_review fields are applied to the batch record under
   fresh fingerprint gates (the application changes the record's
   bytes, so it supersedes this phase's frozen fingerprints by an
   explicit, reviewed, recorded transition — never silently).
4. SEPARATE R6 ELIGIBILITY ADMISSION — its own milestone (the
   EXLIB-2J precedent): import_eligible may become true only
   through a separately approved act on an exact fingerprinted
   payload.
5. TARGET-SNAPSHOT LOAD-PACKAGE PREPARATION — a new one-use,
   fail-closed package (the EXLIB-2K precedent) binding the
   approved artifacts and the completed category decisions; the
   spent Plank package is never reused or modified.
6. HOSTED SNAPSHOT LOADING — executed only by the authorized
   Joseph/ChatGPT path against ShredOS ttybyljytiwntvorugcv, never
   by Claude.
7. HOSTED TARGET-SNAPSHOT PROOF — the fail-closed gate: hosted
   proof that e21b2c00-0000-4000-a000-000000000002 bears the active
   canonical snapshot "Dead bug" and
   e21b2c00-0000-4000-a000-000000000003 bears the active canonical
   snapshot "Ab wheel rollout", with neither mapping swapped,
   missing, inactive, or ambiguous.
8. ONLY THEN may Plank database content review, eligibility
   admission, and publication resume — each its own
   authority-gated act (exlib_catalog_reviewer /
   exlib_catalog_admission / exlib_catalog_admin), each requiring
   explicit instruction.

Axes never conflated anywhere in this chain: content_review (the
authoring review); review_status (authoring pipeline);
import_eligible (R6 admission); snapshot category (database column,
the Decision-2 carrier); DATABASE snapshot review
(exercise_catalog.review_status, born pending on load, 023 audit
constraint + exercise_catalog_review_events); publication
(database-side content lifecycle); relationship projection
(exercise_catalog_relationships, empty until its own gated act).

## 8. Verifier lifecycle for this milestone

- scripts/verify-exlib2n.ts (new) proves: exact source refs and
  fingerprints; exactly two packets and two unfilled forms; correct
  artifact and UUID binding with no swap; every human-controlled
  field null; the exact category vocabulary (cross-checked against
  the live migration-023 CHECK bytes); Dead bug's external evidence
  marked non-authoritative and unselected; Ab wheel rollout's
  category evidence explicitly nonexistent with no fabricated
  value; both authored records byte-identical and still
  pending/proposed/import-ineligible; no load package in this
  phase; no database/runtime/seed/inventory/ledger change; no
  hosted endpoint, credential, or execution command; and the exact
  phase inventory and lifecycle posture.
- RETARGETS: NONE. The mechanical sweep found no historical
  verifier whose live claims match this phase's additions — the
  only live docs-directory scans are extension checks (images/
  html/py/dumps) and the 2K-application record-name filter, none of
  which match these five docs files; the load-package absence
  claims in the 2I/2J suites are already anchored to their promoted
  tips. The full battery confirms this empirically with zero
  modifications to any existing suite.

## 9. Boundaries

This phase changed exactly the six paths in section 3 — nothing
else. The authored exercise records, batch files, inventory,
ledger, seed, seed_link_compatible, migrations (exactly 001-027, no
028), runtime, APIs, UI, dependencies, and configuration are all
byte-unchanged. No form field was filled; no review decision was
performed, applied, or implied; import_eligible remains false
everywhere it was false; no load package was created or executed;
no snapshot, review, admission, publication, projection, run, seal,
revocation, or delivery exists or occurred; the hosted
target-snapshot gate remains OPEN; no hosted service was contacted.
