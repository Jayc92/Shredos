# EXLIB-2N — Ab wheel rollout target-snapshot human review packet

Prepared 2026-09-03. THIS PACKET GRANTS NO APPROVAL. It prepares an
evidence-backed review for TWO distinct HUMAN decisions that have not
happened: (1) specialist review of the authored Ab wheel rollout
exercise record, and (2) selection of the database snapshot CATEGORY,
for which NO committed evidence exists anywhere in the repository.
Blank, null, or missing NEVER reads as approval. Only an authorized
human reviewer may fill the decision, identity, role/credential,
timestamp, evidence, rationale, and category fields (in the companion
form docs/exlib2n-ab-wheel-rollout-target-snapshot-review-form.json),
and even a filled form changes nothing mechanically: applying any
decision to the authored record is a separate, separately reviewed
milestone. This packet cannot mutate the authored record, cannot flip
import_eligible, cannot load a snapshot, and cannot satisfy the
hosted target-snapshot gate.

## 1. Exact subject and source

- Authored record: line 5 of
  docs/exlib2c-release1-batch04-content.jsonl (29 records; file
  frozen at 54,781 bytes, SHA-256
  e7def375e9b9560863796bff90746dc6ff2b2f7c4bd7735a3d53fc2cc9750568;
  the record line itself, newline excluded, is 2,178 bytes, SHA-256
  475870776e6dd309c6646f05b33b9a3050d7fbacd653e245dc3534d288981a8b).
  Any byte change to the record or its containing file voids this
  packet and the companion form.
- Inventory identity: the docs/exlib2b-release1-inventory.jsonl row
  with proposed_canonical_name "Ab wheel rollout" (line 115), which
  agrees with the authored record EXACTLY on all nine shared
  classification fields (mechanically verified: primary_muscle,
  muscle_targets, equipment, tracking_mode, laterality,
  movement_pattern, training_role, difficulty, availability).
  Inventory-only facts: specialist_review_required = true;
  import_eligible = false; deferred = false;
  collision_classification = "distinct";
  name_matches_manifest_entry = false (NO external discovery
  manifest entry exists for this exercise);
  exercise_type_derived = "strength" (the TENANT
  exercises.exercise_type axis — NOT the catalog snapshot category).
- Intended logical UUID: e21b2c00-0000-4000-a000-000000000003.
  Authority for the intended assignment: the admitted Plank artifact
  (docs/exlib2g-plank-content.jsonl, 2,928 B, SHA-256 d82078490efa9e
  f13e128e7b7b742fbda8ea9e74e32382252d96c326c679d752 — progression
  target "Ab wheel rollout"), the promoted EXLIB-2K
  load-preparation record, and the promoted hosted-load application
  record. Hosted state carries this UUID as a BARE identity only;
  nothing in the database yet proves the name — that proof is the
  still-open target-snapshot gate this review chain exists to
  satisfy.
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
EXCLUDES category by design, the inventory omits it, the Plank
'isolation' derivation chain was seed-specific
(corresponds_to_seed = null here, so it cannot apply), and — unlike
Dead bug — this exercise has NO external discovery manifest entry
either. Category is NOT NULL on exercise_catalog with a five-value
vocabulary, so no target snapshot can ever be prepared without an
INDEPENDENT human category decision carried in completed review
evidence.

## 3. The frozen record, rendered readably

- Identity: Ab wheel rollout; aliases ["Ab roller rollout"];
  equipment other; tracking_mode weight_reps; laterality bilateral;
  movement_pattern core_anti_extension; training_role core;
  difficulty advanced; availability minimal.
- Anatomy: primary_muscle abs; muscle_targets exactly
  {(lats, tertiary), (obliques, secondary)}.
- Setup steps (3):
  1. "Kneel on a folded mat with the ab wheel on the floor in front
     of your knees."
  2. "Grip both handles with straight wrists and stack your
     shoulders over the wheel."
  3. "Tuck your pelvis slightly and brace before the first roll."
- Execution steps (4):
  1. "Roll the wheel forward slowly, reaching your arms out as your
     body lengthens."
  2. "Go only as far as you can keep the lower back from arching."
  3. "Pull the wheel back to the start by driving your hips
     backward and pressing through the handles."
  4. "Re-set the brace at the top before the next roll."
- Breathing cue: "Inhale as the wheel rolls out; exhale forcefully
  as you pull it back to the start."
- Common mistakes (3): letting the hips sag so the lower back
  arches mid-roll; reaching farther than the brace can support;
  bending the elbows to yank the wheel back.
- Safety guidance: "Progress distance gradually: roll out only to
  the point where the trunk stays rigid, and end the set as soon as
  the hips drop or the lower back starts to arch rather than
  forcing a longer roll."
- Equipment setup: "Use an ab wheel with intact, non-slip handles
  on a floor surface that will not slide; kneel on padding for
  comfort."
- Relationships: substitutions []; regressions []; progressions []
  (all deliberately empty — legal under R3, which forbids
  unresolvable targets; note that the ADMITTED Plank artifact names
  Ab wheel rollout as ITS progression target, which imposes no
  reciprocal requirement on this record).
- Accessibility alternative: "Shorten the rollout to a small range,
  or roll the wheel up a wall from a standing position for a
  gentler angle."
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
- Canonical name "Ab wheel rollout" and alias "Ab roller rollout"
  satisfy the authoring-schema name pattern; normalized forms
  collide with NO existing catalog claim (current claims: plank,
  front plank, forearm plank), not with each other, and not with
  the other EXLIB-2N subject (dead bug): PASS.
- equipment 'other': the applied vocabulary has no ab-wheel value,
  so 'other' is the only mechanical fit; whether 'other' (vs a
  future vocabulary extension) is the right product posture is a
  judgment: NEEDS HUMAN JUDGMENT (carried in the form as
  equipment_other_appropriate). Mechanically legal: PASS.
- tracking_mode 'weight_reps' with a rep-based rolling movement:
  mechanically consistent pair; appropriateness (vs 'bodyweight')
  is a specialist call: NEEDS HUMAN JUDGMENT.
- difficulty 'advanced': consistent with the record's own
  progressive-distance safety framing; defensibility is a
  judgment: NEEDS HUMAN JUDGMENT.
- availability 'minimal' WITH a required ab wheel device: the
  inventory and the authored record agree with each other, but
  whether a movement requiring a wheel is truthfully 'minimal'
  availability is a real consistency question this packet
  deliberately surfaces rather than resolves: NEEDS HUMAN JUDGMENT
  (carried in the form as
  availability_minimal_with_required_device_defensible). Nothing
  was rewritten; the authored value stands for the reviewer to
  judge.
- exercise_type_derived "strength" is the TENANT axis, not the
  snapshot category; it decides nothing here: noted to prevent
  conflation.

B. Anatomy consistency
- primary_muscle abs; exactly {(lats, tertiary),
  (obliques, secondary)}; every muscle and role is a member of the
  applied migration-023 vocabulary; exact agreement with the
  inventory identity (mechanical): PASS.
- Physiological defensibility (lats as tertiary in a rollout;
  obliques secondary; no hip_flexors entry) is a specialist call:
  NEEDS HUMAN JUDGMENT.

C. Instruction quality and positional coherence
- Physical walk-through: kneeling start on padding, wheel in front
  of knees; grip with straight wrists, shoulders stacked over the
  wheel; pelvic tuck and brace before movement; slow forward roll
  with lengthening reach; range capped where the lumbar would
  arch; return driven by hips backward with pressure through the
  handles; re-brace between rolls. No positional conflicts found
  between the kneeling base, shoulder-over-wheel start, the
  anti-extension range cap, and the hip-driven return (all
  consistent with movement_pattern core_anti_extension): PASS
  (mechanical/analytical); final coaching-quality signoff: NEEDS
  HUMAN JUDGMENT.
- Breathing cue assigns exhale to the effortful pull-back and does
  not instruct breath-holding: PASS.
- Common mistakes are specific and correctable: PASS.
- Equipment setup is present and non-empty, matching equipment
  'other' (a device is required and described): PASS.
- Prose is concise, professional, non-promotional, ASCII-safe:
  PASS.

D. Safety and claims (mechanical scans + reading)
- No diagnosis/treatment/rehabilitation/prescription language:
  PASS.
- No spot-reduction, toning, slimming, or calorie claims: PASS.
- No unsupported benefit claims: PASS.
- No instruction to continue through pain; form loss routes to
  ending the set ("end the set as soon as the hips drop or the
  lower back starts to arch"): PASS.
- No absolute safety guarantee; no population-specific medical
  claim: PASS.
- Final safety adequacy signoff for an ADVANCED movement: NEEDS
  HUMAN JUDGMENT (this is precisely what the specialist review
  exists for).

E. Alias collisions
- "Ab roller rollout" normalizes collision-free against every
  existing catalog claim, the canonical name itself, and the other
  EXLIB-2N subject (mechanical): PASS. Whether it is a TRUE synonym
  of this movement: NEEDS HUMAN JUDGMENT (carried in the form as
  alias_ab_roller_rollout_true_synonym).

F. Relationship validity
- substitutions, regressions, and progressions are all empty —
  legal under R3 (no unresolvable targets exist because none are
  named): PASS.
- The admitted Plank artifact's expected progression points AT this
  identity (Plank -> Ab wheel rollout). Whether this exercise, as
  authored, SUITS that progression role: NEEDS HUMAN JUDGMENT
  (carried in the form as plank_progression_target_suitability).

G. Schema validity
- Every required authoring-schema field is present with legal
  vocabulary and shape; the pending review state carries exactly
  null evidence; import_eligible is the locked false; deferred is
  false with a null reason (mechanical; the promoted batch04
  verifier also validates this file continuously in the battery):
  PASS.

H. Database vocabulary compatibility (applied migrations 023/025/
   026/027)
- equipment 'other' — legal CHECK member: PASS.
- laterality 'bilateral' — legal CHECK member: PASS.
- tracking_mode 'weight_reps' — legal CHECK member: PASS.
- primary_muscle 'abs', anatomy muscles 'lats'/'obliques', roles
  'tertiary'/'secondary' — legal CHECK members: PASS.
- movement_pattern 'core_anti_extension', training_role 'core',
  difficulty 'advanced', availability 'minimal' — legal CHECK
  members, and all four are REQUIRED (NOT NULL by the 027
  discovery-metadata constraint for forgefitos_original) and
  present: PASS.
- provenance 'forgefitos_original' — legal, and the four external
  source fields will be NULL exactly as the 027 conditional
  constraint requires: PASS.
- CATEGORY — required NOT NULL by migration 023, and NO COMMITTED
  CATEGORY EVIDENCE EXISTS ANYWHERE for this exercise: NEEDS HUMAN
  JUDGMENT (Decision 2, section 5). Until that decision exists in
  completed review evidence, any snapshot load package for this
  identity is BLOCKED BY GOVERNANCE.
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
catalog snapshot's category into tenant exercises rows
(v_cat.category), so this value reaches user-facing product state
whenever delivery later occurs.

The legal database vocabulary, exactly and completely:

- compound
- isolation
- cardio
- mobility
- other

The human reviewer must select EXACTLY ONE category and provide a
category rationale of at least 10 non-blank characters in the
companion form.

NO COMMITTED CATEGORY EVIDENCE EXISTS for Ab wheel rollout: the
authoring schema excludes category; the release inventory omits it;
there is NO external discovery manifest entry
(name_matches_manifest_entry = false); the exercise corresponds to
no seed row; and no promoted record, selection, editorial note, or
code path assigns one. The category decision is therefore an
INDEPENDENT human decision. This packet deliberately does NOT infer
a category from the movement pattern, the equipment, the
difficulty, the tenant exercise_type_derived axis, or general
exercise knowledge, and nothing is preselected.

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
- REJECT (status = rejected): this record is dead; any future Ab
  wheel rollout content is a NEW version; the bare hosted identity
  remains bare and the target-snapshot gate remains unsatisfied.
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
