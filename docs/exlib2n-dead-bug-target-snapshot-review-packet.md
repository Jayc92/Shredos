# EXLIB-2N — Dead bug target-snapshot human review packet

Prepared 2026-09-03. THIS PACKET GRANTS NO APPROVAL. It prepares an
evidence-backed review for TWO distinct HUMAN decisions that have not
happened: (1) specialist review of the authored Dead bug exercise
record, and (2) selection of the database snapshot CATEGORY, which no
committed source carries. Blank, null, or missing NEVER reads as
approval. Only an authorized human reviewer may fill the decision,
identity, role/credential, timestamp, evidence, rationale, and
category fields (in the companion form
docs/exlib2n-dead-bug-target-snapshot-review-form.json), and even a
filled form changes nothing mechanically: applying any decision to
the authored record is a separate, separately reviewed milestone.
This packet cannot mutate the authored record, cannot flip
import_eligible, cannot load a snapshot, and cannot satisfy the
hosted target-snapshot gate.

## 1. Exact subject and source

- Authored record: line 12 of
  docs/exlib2c-release1-batch02-content.jsonl (29 records; file
  frozen at 51,496 bytes, SHA-256
  1ddc3ab0bd92d60ef33960d82a8e0c8a2fdea1cb828d15fc9bf6a82c34305d48;
  the record line itself, newline excluded, is 1,900 bytes, SHA-256
  3dbd0384542bdf6feb96d84a61d2d50b5c6ca0fdc057fcafded67aeb631a8796).
  Any byte change to the record or its containing file voids this
  packet and the companion form.
- Inventory identity: the docs/exlib2b-release1-inventory.jsonl row
  with proposed_canonical_name "Dead bug" (line 114), which agrees
  with the authored record EXACTLY on all nine shared classification
  fields (mechanically verified: primary_muscle, muscle_targets,
  equipment, tracking_mode, laterality, movement_pattern,
  training_role, difficulty, availability). Inventory-only facts:
  specialist_review_required = true; import_eligible = false;
  deferred = false; collision_classification =
  "name_matches_prior_artifact" (a name match against the external
  discovery manifest, not a catalog claim collision);
  exercise_type_derived = "bodyweight" (the TENANT
  exercises.exercise_type axis — NOT the catalog snapshot category).
- Intended logical UUID: e21b2c00-0000-4000-a000-000000000002.
  Authority for the intended assignment: the admitted Plank artifact
  (docs/exlib2g-plank-content.jsonl, 2,928 B, SHA-256 d82078490efa9e
  f13e128e7b7b742fbda8ea9e74e32382252d96c326c679d752 — substitution
  target "Dead bug"), the promoted EXLIB-2K load-preparation record,
  and the promoted hosted-load application record. Hosted state
  carries this UUID as a BARE identity only; nothing in the database
  yet proves the name — that proof is the still-open target-snapshot
  gate this review chain exists to satisfy.
- Source state: main = 9c73f3c484c79d97cc31ef0a6b2fcae76fa334fc
  (tree cc880929e26ba3954eff7e444e033c8793f2368d), tag
  exlib2k-hosted-load-application-evidence-stable (tag object
  81c0954f2cb2971a79e1f139122e08bdca05acd0).
- Authorship: provenance forgefitos_original; authored_by
  "ForgeFitOS content program (AI-drafted original prose; pending
  human specialist review)"; authored_at 2026-08-28. Under the
  applied migration-027 conditional constraint, all four external
  discovery fields (source_url, source_page, retrieved_at,
  import_confidence) must be NULL for this provenance.

## 2. The review contract (two distinct human decisions)

DECISION 1 — content review of the authored record (the EXLIB-2H/2I
precedent, applied to this record):

1. WHO MAY REVIEW: a HUMAN reviewer with a non-blank recorded
   identity. The inventory row carries specialist_review_required =
   true; the record itself declares "pending human specialist
   review". The repository defines NO credential registry: selecting
   and validating the qualified human specialist is an operator
   (Joseph) act at decision time, recorded in the form's reviewer
   and reviewer_role_or_credential fields. AI (Claude or ChatGPT)
   may prepare and validate the form but may NEVER fill or fabricate
   the human fields.
2. STATUSES AND LEGAL TRANSITIONS: content_review.status is exactly
   one of pending | approved | revised | rejected
   (docs/exlib2c-authoring-schema.json). The ONLY legal transition
   is pending -> approved | revised | rejected, decided once: a
   pending record carries NO review evidence and a decided record
   carries ALL of it (reviewer non-blank >= 3 chars; reviewed_at a
   valid offset date-time; rationale non-blank >= 10 chars). A
   different later decision requires a NEW content version, never an
   edit of a decided one.
3. DISTINCT AXES — never conflated: content_review (the authoring
   review axis above); review_status (authoring-pipeline state,
   currently "proposed" — moves separately); import_eligible (locked
   false; only a later, separately approved R6-style act on an exact
   fingerprinted payload can flip it — the EXLIB-2J precedent);
   snapshot CATEGORY (a database column no authoring field carries —
   Decision 2 below); DATABASE snapshot review
   (exercise_catalog.review_status is born 'pending' on load by the
   027 birth contract, with the migration-023 audit constraint and
   exercise_catalog_review_events log — a separate, later, hosted
   lifecycle); publication (a database-side content lifecycle,
   draft/published/retired — later still); relationship PROJECTION
   (exercise_catalog_relationships stays empty until its own
   separately gated publication act).
4. EVIDENCE: the required, structurally bound evidence is internal —
   reviewer identity, decision timestamp, rationale. Optional
   supporting evidence may be attached and may be null; it never
   substitutes for the required fields.

DECISION 2 — snapshot category selection (new in EXLIB-2N; see
section 5): the authoring schema (additionalProperties: false)
EXCLUDES category by design, the inventory omits it, and the Plank
'isolation' derivation chain was seed-specific
(corresponds_to_seed = null here, so it cannot apply). Category is
NOT NULL on exercise_catalog with a five-value vocabulary, so no
target snapshot can ever be prepared without a human category
decision carried in completed review evidence.

## 3. The frozen record, rendered readably

- Identity: Dead bug; aliases [] (none authored); equipment
  bodyweight; tracking_mode bodyweight; laterality alternating;
  movement_pattern core_anti_extension; training_role core;
  difficulty beginner; availability minimal.
- Anatomy: primary_muscle abs; muscle_targets exactly
  {(hip_flexors, secondary)}.
- Setup steps (3):
  1. "Lie on your back with arms reaching straight up over your
     shoulders."
  2. "Lift your legs so hips and knees are bent to 90 degrees."
  3. "Press your lower back gently into the floor and keep it
     there."
- Execution steps (4):
  1. "Lower one arm overhead and the opposite leg toward the floor
     at the same time."
  2. "Stop just before the lower back would lift, then return to
     the start."
  3. "Alternate sides with a slow, even rhythm for the whole set."
  4. "Move only as far as you can while the back stays pressed
     down."
- Breathing cue: "Exhale slowly as the arm and leg lower; inhale as
  they return to the top."
- Common mistakes (3): arching the lower back as the leg reaches
  away; rushing the alternation so the trunk rocks side to side;
  holding the reach position instead of returning smoothly.
- Safety guidance: "Range is earned by control; if the lower back
  keeps lifting, shorten the reach or lower only the leg until the
  position stays quiet."
- Equipment setup: "" (bodyweight; permitted empty).
- Relationships: substitutions []; regressions []; progressions []
  (all deliberately empty — legal under R3, which forbids
  unresolvable targets; note that the ADMITTED Plank artifact names
  Dead bug as ITS substitution target, which imposes no reciprocal
  requirement on this record).
- Accessibility alternative: "Lower one limb at a time — just an
  arm or just a leg — before combining opposite pairs."
- Review state: content_review pending with reviewer/reviewed_at/
  rationale null; review_status proposed; import_eligible false;
  deferred false (reason null); no publication key.

## 4. Independent mechanical assessment (per dimension)

Permitted classifications: PASS, NEEDS HUMAN JUDGMENT, CORRECTION
REQUIRED, BLOCKED BY GOVERNANCE. Nothing was rewritten to make a
finding pass; the authored record is byte-untouched by this
milestone.

A. Identity and classification consistency
- Batch record and inventory identity agree EXACTLY on all nine
  shared classification fields (mechanically verified): PASS.
- Canonical name "Dead bug" satisfies the authoring-schema name
  pattern; normalized form 'dead bug' collides with NO existing
  catalog claim (current claims: plank, front plank, forearm plank)
  and not with the other EXLIB-2N subject (ab wheel rollout / ab
  roller rollout): PASS.
- laterality 'alternating' matches the authored alternating
  execution; tracking_mode 'bodyweight' matches the unloaded,
  set/rhythm-based execution: PASS (mechanical consistency);
  classification appropriateness signoff: NEEDS HUMAN JUDGMENT.
- difficulty beginner / availability minimal: consistent with a
  no-equipment floor movement; defensibility is a judgment: NEEDS
  HUMAN JUDGMENT.
- exercise_type_derived "bodyweight" is the TENANT axis, not the
  snapshot category; it decides nothing here: noted to prevent
  conflation.

B. Anatomy consistency
- primary_muscle abs; exactly {(hip_flexors, secondary)}; every
  muscle and role is a member of the applied migration-023
  vocabulary; exact agreement with the inventory identity
  (mechanical): PASS.
- Physiological defensibility — notably the absence of obliques or
  lower_back entries that the Plank contract carries — is a
  specialist call: NEEDS HUMAN JUDGMENT.

C. Instruction quality and positional coherence
- Physical walk-through: supine start, arms vertical over
  shoulders; hips and knees at 90/90; lumbar pressed down before
  movement; contralateral arm-overhead + opposite-leg lower; stop
  before the lumbar lifts; alternating, slow rhythm; range capped
  by control. No positional conflicts found between the supine
  base, the 90/90 start, the contralateral reach, and the
  anti-extension cue (back pressed down throughout — consistent
  with movement_pattern core_anti_extension): PASS
  (mechanical/analytical); final coaching-quality signoff: NEEDS
  HUMAN JUDGMENT.
- Alternating language ("Alternate sides") is present and
  consistent with laterality: PASS.
- Breathing cue pairs exhale with the lowering (exertion) phase and
  does not instruct breath-holding: PASS.
- Common mistakes are specific and correctable: PASS.
- Prose is concise, professional, non-promotional, ASCII-safe:
  PASS.

D. Safety and claims (mechanical scans + reading)
- No diagnosis/treatment/rehabilitation/prescription language:
  PASS.
- No spot-reduction, toning, slimming, or calorie claims: PASS.
- No unsupported benefit claims: PASS.
- No instruction to continue through pain; loss of position routes
  to shortening the movement ("shorten the reach or lower only the
  leg"): PASS.
- No absolute safety guarantee; no population-specific medical
  claim: PASS.
- Final safety adequacy signoff: NEEDS HUMAN JUDGMENT (this is
  precisely what the specialist review exists for).

E. Alias collisions
- The authored alias list is EMPTY. Mechanically there is nothing
  to collide: PASS. Whether common synonyms (if any) SHOULD be
  authored as aliases is a content judgment for the reviewer —
  their absence is legal: NEEDS HUMAN JUDGMENT.

F. Relationship validity
- substitutions, regressions, and progressions are all empty —
  legal under R3 (no unresolvable targets exist because none are
  named): PASS.
- The admitted Plank artifact's expected substitution points AT
  this identity (Plank -> Dead bug). Whether this exercise, as
  authored, SUITS that substitution role: NEEDS HUMAN JUDGMENT
  (carried in the form as plank_substitution_target_suitability).

G. Schema validity
- Every required authoring-schema field is present with legal
  vocabulary and shape; the pending review state carries exactly
  null evidence; import_eligible is the locked false; deferred is
  false with a null reason (mechanical; the promoted batch02
  verifier also validates this file continuously in the battery):
  PASS.

H. Database vocabulary compatibility (applied migrations 023/025/
   026/027)
- equipment 'bodyweight' — legal CHECK member: PASS.
- laterality 'alternating' — legal CHECK member: PASS.
- tracking_mode 'bodyweight' — legal CHECK member: PASS.
- primary_muscle 'abs', anatomy muscle 'hip_flexors', role
  'secondary' — legal CHECK members: PASS.
- movement_pattern 'core_anti_extension', training_role 'core',
  difficulty 'beginner', availability 'minimal' — legal CHECK
  members, and all four are REQUIRED (NOT NULL by the 027
  discovery-metadata constraint for forgefitos_original) and
  present: PASS.
- provenance 'forgefitos_original' — legal, and the four external
  source fields will be NULL exactly as the 027 conditional
  constraint requires: PASS.
- CATEGORY — required NOT NULL by migration 023, carried by NO
  committed source for this exercise: NEEDS HUMAN JUDGMENT
  (Decision 2, section 5). Until that decision exists in completed
  review evidence, any snapshot load package for this identity is
  BLOCKED BY GOVERNANCE.
- import_eligible = false; R6 eligibility admission not performed:
  BLOCKED BY GOVERNANCE (correctly so — admission is a later,
  separate milestone and is NOT part of this review).

SUMMARY: zero CORRECTION REQUIRED findings. The two BLOCKED BY
GOVERNANCE items are the deliberate later-milestone gates (category
decision application and R6 admission), not record defects. Every
mechanical dimension is PASS, with the enumerated NEEDS HUMAN
JUDGMENT confirmations reserved for the specialist — exactly as the
contract requires for an AI-authored record.

## 5. Category decision (the second human decision)

The database snapshot category is REQUIRED (NOT NULL, migration 023)
and PRODUCT-VISIBLE: applied migration 026's delivery paths copy the
catalog snapshot's category into tenant exercises rows (v_cat.
category), so this value reaches user-facing product state whenever
delivery later occurs.

The legal database vocabulary, exactly and completely:

- compound
- isolation
- cardio
- mobility
- other

The human reviewer must select EXACTLY ONE category and provide a
category rationale of at least 10 non-blank characters in the
companion form.

EVIDENCE (evidence only — NOT authoritative, NOT preselected): the
external discovery manifest (docs/exlib1a-discovery-manifest.jsonl)
contains an entry proposed_name "Dead Bug" from StrengthLog
(source_url https://www.strengthlog.com/dead-bugs/, retrieved
2026-08-20, confidence medium) whose category field reads
"isolation". That manifest entry is EXTERNAL-SOURCE discovery data:
no promoted contract adopts it as authoritative for a
forgefitos_original release snapshot, the release inventory
deliberately did not carry it forward, and this packet does NOT
preselect it. The reviewer is free to select any of the five legal
values; nothing here implies that isolation must be chosen.

## 6. The decision (for the authorized human reviewer ONLY)

Options and exact consequences:
- APPROVE (content_review.status = approved) WITH a category
  selection: this record plus the category decision become the
  evidence a LATER milestone applies. Approval does NOT modify the
  authored artifact, does NOT flip import_eligible (separate
  R6-style fingerprinted act), does NOT load a snapshot, does NOT
  satisfy the hosted target-snapshot gate, and does NOT publish or
  project anything.
- REVISE (status = revised): the reviewer supplies corrected
  direction; a NEW record version is authored and re-reviewed; this
  record keeps its decided state permanently.
- REJECT (status = rejected): this record is dead; any future Dead
  bug content is a NEW version; the bare hosted identity remains
  bare and the target-snapshot gate remains unsatisfied.
- Every decision requires, together and at the same time: reviewer
  (named human specialist, never AI, >= 3 non-blank chars),
  reviewer_role_or_credential (operator-validated), reviewed_at (a
  valid offset date-time), rationale (>= 10 non-blank chars), and —
  for approval — snapshot_category_decision (exactly one legal
  value), snapshot_category_rationale (>= 10 non-blank chars), and
  every needs-human-judgment confirmation explicitly true. Optional
  evidence may be null and never substitutes for required fields.
- Recording the decision in the companion form is itself inert:
  applying it to the authored record is a separate, separately
  reviewed milestone with its own fingerprint gates, followed by
  the separate R6 eligibility admission, the target-snapshot
  load-package preparation, the hosted load, and the hosted
  target-snapshot proof — only then may Plank database
  review/admission/publication resume.

## 7. Boundaries

This packet and its form change nothing: the authored record, batch
file, inventory, ledger, seed, migrations (exactly 001-027, no 028),
runtime, and every eligibility artifact are byte-unchanged. No load
package exists in this phase. No hosted service was contacted.
Nothing here approves, rejects, publishes, loads, projects, seals,
delivers, or changes eligibility.
