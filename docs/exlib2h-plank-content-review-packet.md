# EXLIB-2H — Plank instructional-content human review packet

Prepared 2026-09-01. THIS PACKET GRANTS NO APPROVAL. It prepares an
evidence-backed review for a HUMAN specialist decision that has not
happened. Blank, null, or missing NEVER reads as approval. Only an
authorized human reviewer may fill the decision, identity,
role/credential, timestamp, evidence, and rationale fields (in the
companion form docs/exlib2h-plank-content-review-form.json), and
even a filled form changes nothing mechanically: applying any
decision to the content artifact is a separate, separately reviewed
milestone. This packet cannot mutate the content record and cannot
authorize catalog loading; loading remains blocked until an
authorized review decision is recorded AND that application is
itself separately reviewed.

## 1. Exact subject and source

- Content artifact: docs/exlib2g-plank-content.jsonl — exactly ONE
  record, canonical name Plank. Frozen fingerprint: 2,729 bytes,
  SHA-256
  a8cb6a5ed54bfa20f296d0624ccd29b20936f1f5b1c48ae201c4c44c2914a30a.
  Any byte change to the artifact voids this packet.
- Source state: promoted main =
  b9af2a40607c23ee57c04cdbdb9581b01a4f4f9a (tree ea7c2e36...), tag
  exlib2g-plank-content-activation-design-stable (tag object
  435816da3cd019cd5965eab52c0ad52b2227c889). EXLIB-2G design record
  139a097d..., verifier acb8b80c... (both byte-frozen).
- Authorship: forgefitos_original; authored_by "ForgeFitOS content
  program (AI-drafted original prose; pending human specialist
  review)"; authored_at 2026-09-01. No source fields (provenance
  cross-check R8 satisfied).

## 2. The review contract (derived from committed repository evidence)

1. WHO MAY REVIEW: a HUMAN reviewer with a non-blank recorded
   identity. Every release-1 inventory identity carries
   specialist_review_required: true (docs/
   exlib2b-release1-inventory.jsonl, all 135 rows), the content
   record itself declares "pending human specialist review", and the
   promoted review-guide precedent (docs/exlib1c0-human-review-guide
   .md) names the deciding pattern "a qualified
   strength-and-conditioning reviewer + Joseph" for exercise
   classification questions. The repository defines NO credential
   registry: selecting/validating the qualified human specialist is
   an operator (Joseph) act at decision time, recorded in the form's
   reviewer and reviewer_role_or_credential fields.
2. HUMAN REQUIRED - ALWAYS: an AI-authored record may NEVER be
   approved without a distinct human reviewer. The authoring schema
   states "Specialist/legal/medical approval is never implied by any
   default"; the standing repository rule is that reviewer
   identities/approvals are never fabricated and blank never means
   approval.
3. STATUSES AND LEGAL TRANSITIONS: content_review.status is exactly
   one of pending | approved | revised | rejected
   (docs/exlib2c-authoring-schema.json). The ONLY legal transition
   is pending -> approved | revised | rejected, decided once: a
   pending record carries NO review evidence (reviewer, reviewed_at,
   rationale all null) and a decided record carries ALL of it
   (reviewer non-blank >= 3 chars; reviewed_at date-time; rationale
   non-blank >= 10 chars). This mirrors the applied
   exercise_catalog_review_audit_chk (migration 023 lines 406-417)
   and the promoted exercise_catalog_content lifecycle
   (docs/exlib2a-catalog-architecture-record.md section 1 -
   pseudocode; honest note: that content table is NOT yet a
   migration, so the authoring-record contract plus the applied
   metadata-snapshot CHECK are the binding shapes today). A
   different later decision requires a NEW content version, never an
   edit of a decided one.
4. EVIDENCE: the required, structurally bound evidence is internal -
   the reviewer identity, the decision timestamp, and the rationale.
   No external URL evidence is required by the content-review
   contract (unlike the 1C0A equipment resolutions). Supporting
   materials are optional and reviewer-supplied; they never
   substitute for the three required fields.
5. RATIONALE: a non-blank string of at least 10 characters, written
   by the reviewer, specific to this content version.
6. content_review.status VS review_status: DISTINCT axes by schema
   declaration ("Authoring-pipeline status; distinct from
   content_review.status and from any import approval").
   review_status (proposed | in_review | content_final) is pipeline
   state and is NOT required to transition together with the review
   decision; moving it is a separate pipeline fact.
7. import_eligible: locked literal false for authoring; it may
   become true ONLY through a later, separately approved act on an
   exact fingerprinted payload (schema const-false comment;
   validator rule R6). A content approval alone NEVER flips it.
8. PUBLICATION: a separate, later, DATABASE-side lifecycle
   (draft/published/retired) promoted atomically and only for
   approved/revised versions; authoring records never carry
   publication state, a new version is born draft and never
   auto-publishes, and pending/rejected content can never be
   published structurally (2A section 1).
9. SEPARATE DIMENSIONS: names/aliases (R1-R2), relationships (R3),
   anatomy vocabulary, prose structure/style, and safety/claims (D3
   family) are distinct validated dimensions in the promoted
   standard, so this packet reports a finding per dimension.
10. The answer to "may an AI-authored record ever be approved
    without a distinct human reviewer" is NO (see 1-2).

## 3. The frozen record, rendered readably

- Identity: Plank; aliases ["Front plank", "Forearm plank"];
  equipment bodyweight; tracking_mode timed (repository-derived
  exercise_type mobility via deriveLegacyExerciseType); laterality
  bilateral; movement_pattern core_anti_extension; training_role
  core; difficulty beginner; availability minimal.
- Anatomy: primary_muscle abs; muscle_targets exactly
  {(obliques, secondary), (lower_back, tertiary)}.
- Setup steps (3):
  1. "Lie face down, then prop yourself on your forearms with your
     elbows stacked directly under your shoulders."
  2. "Extend your legs behind you with your feet about hip-width
     apart and your toes tucked under."
  3. "Before lifting, brace your trunk gently as if preparing for a
     light press against your stomach."
- Execution steps (4):
  1. "Lift your hips so your body forms one straight line from the
     back of your head to your heels."
  2. "Squeeze your glutes and keep your ribs drawn down so your
     lower back never sags toward the floor."
  3. "Hold the position for the planned duration while keeping your
     neck long and your gaze at the floor."
  4. "End the hold by lowering your knees to the floor under
     control, then rest fully before the next hold."
- Breathing cue: "Breathe steadily for the whole hold with slow
  inhales and full exhales; never hold your breath to stiffen the
  position."
- Common mistakes (3): hips sagging into an arched lower back;
  hips too high turning the hold into a rest; grinding out extra
  seconds with a broken line instead of ending the hold.
- Safety guidance: "A plank loads the trunk hardest once the hips
  drift, so keep the line strict rather than chasing longer times;
  if your lower back starts to ache or your hips sag and you cannot
  correct it, lower your knees and stop the hold there."
- Equipment setup: "" (bodyweight; permitted empty).
- Relationships: substitutions ["Dead bug"]; regressions [] (the
  knees-down regression is deliberately in
  accessibility_alternative because no such corpus identity
  exists); progressions ["Ab wheel rollout"].
- Accessibility alternative: knees-down hold or countertop incline.
- Review state: content_review pending with reviewer/reviewed_at/
  rationale null; review_status proposed; import_eligible false;
  deferred false (reason null); no publication key.

## 4. Independent review findings (per dimension)

Permitted classifications: PASS, NEEDS HUMAN JUDGMENT, CORRECTION
REQUIRED, BLOCKED BY GOVERNANCE. Nothing was rewritten to make a
finding pass; the content artifact is byte-untouched by this
milestone.

A. Identity and classification
- Canonical name Plank; equipment/tracking_mode/laterality/
  movement_pattern/training_role/difficulty/availability each equal
  the authoritative inventory identity, and the movement pattern
  and training role are members of the promoted vocabulary
  (mechanically verified): PASS.
- Derived exercise_type mobility (timed -> mobility in
  deriveLegacyExerciseType, matching migration 010's map): PASS.
- Aliases are collision-free against every corpus canonical name
  and every existing alias, normalized-unique, non-self-referring
  (mechanical): PASS. Whether "Front plank" and "Forearm plank" are
  true synonyms of THIS movement (a forearm hold) rather than
  variants: mechanically consistent with the authored execution,
  final confirmation is a specialist call: NEEDS HUMAN JUDGMENT.
- Difficulty beginner / availability minimal: consistent with a
  no-equipment bodyweight hold and with comparable promoted records;
  defensibility is a judgment: NEEDS HUMAN JUDGMENT.

B. Anatomy
- primary_muscle abs; exactly {(obliques, secondary), (lower_back,
  tertiary)}; no additional muscle or role; exact agreement with
  the promoted EXLIB-2D/2G contract and the inventory identity
  (mechanically verified, twice - the EXLIB-2G verifier pins it):
  PASS. Note for the reviewer: the anatomy multiset is a PROMOTED
  CONTRACT value; disagreeing with it physiologically would reopen
  the EXLIB-2D contract, not just this record.

C. Instruction quality
- Physical coherence walk-through: forearm support with elbows
  under shoulders; legs extended, toes tucked; brace before
  lifting; hips lifted to one straight head-to-heel line; glutes +
  ribs-down maintaining the line; neck long, gaze down (consistent
  with the straight line); controlled knees-down ending. No
  positional conflicts found between elbows/shoulders, feet, head,
  spine, hips, or trunk cues: PASS (mechanical/analytical); final
  coaching-quality signoff: NEEDS HUMAN JUDGMENT.
- Execution describes a timed isometric hold (hold/duration
  language, no rep or per-side phrasing; bilateral): PASS.
- Breathing guidance explicitly avoids breath-holding ("never hold
  your breath"): PASS.
- Bracing cue ("as if preparing for a light press against your
  stomach") is concrete and understandable: PASS (with the general
  human-judgment note above).
- Stopping guidance is explicit and actionable ("lower your knees
  and stop the hold there"): PASS.
- Common mistakes are specific and correctable: PASS.
- Knees-down and countertop-incline alternatives are standard,
  appropriate easier variants: PASS (appropriateness confirmation:
  NEEDS HUMAN JUDGMENT).
- Prose is concise, professional, non-promotional, ASCII-only, no
  emoji-style content: PASS.

D. Safety and claims (mechanical scans + reading)
- No diagnosis/treatment/rehabilitation/prescription language: PASS.
- No spot-fat-reduction, toning, slimming, or calorie claims: PASS.
- No unsupported benefit claims: PASS.
- No instruction to continue through pain; discomfort routes to
  ending the hold: PASS.
- Stop guidance specifically covers lower-back discomfort and
  uncorrectable form loss: PASS.
- No absolute safety guarantee: PASS.
- No population-specific medical claim: PASS.
- No contradiction among "straight line", ribs-down, glute squeeze,
  and spinal positioning (these are mutually consistent neutral-
  line cues): PASS; final safety adequacy signoff: NEEDS HUMAN
  JUDGMENT (this is precisely what the specialist review exists
  for).

E. Relationships (mechanical)
- "Dead bug" exists in the eligible reference corpus (inventory,
  bodyweight, non-deferred) and is in the same anti-extension
  family - a reasonable substitution: PASS (existence/family);
  substitution reasonableness confirmation: NEEDS HUMAN JUDGMENT.
- "Ab wheel rollout" exists in the eligible reference corpus
  (non-deferred) and is a harder anti-extension movement - a
  reasonable progression: PASS (existence/family); progression
  reasonableness confirmation: NEEDS HUMAN JUDGMENT.
- No relationship targets a deferred or unloadable identity (the
  weight_time plate/vest planks were deliberately excluded): PASS.
- Empty regressions is legal: the knees-down regression is in
  accessibility_alternative because no such corpus identity exists
  (R3 forbids unresolvable targets) - the promoted EXLIB-2G design
  records this choice: PASS.
- Aliases and relationship names resolve under the exact
  normalization rules (lowercase/trim; R1-R3): PASS.

SUMMARY: zero CORRECTION REQUIRED findings; zero BLOCKED BY
GOVERNANCE findings; every dimension is PASS mechanically, with the
enumerated NEEDS HUMAN JUDGMENT confirmations reserved for the
specialist - exactly as the contract requires for an AI-authored
record.

## 5. The decision (for the authorized human reviewer ONLY)

Options and exact consequences:
- APPROVE (content_review.status = approved): this content version
  becomes approvable evidence for LATER milestones. It does NOT
  flip import_eligible (separate fingerprinted approval act, R6),
  does NOT publish (separate database-side lifecycle), does NOT
  load anything, and does NOT change the seed or inventory.
- REVISE (status = revised): the reviewer supplies corrected
  direction; a NEW content version is authored and re-reviewed;
  this version's record keeps its decided state permanently.
- REJECT (status = rejected): this content version is dead; any
  future Plank content is a NEW version; nothing else changes.
- Every decision requires, together and at the same time: reviewer
  (named human specialist, never AI, >= 3 non-blank chars),
  reviewer_role_or_credential (operator-validated), reviewed_at
  (date-time), rationale (>= 10 non-blank chars). Optional
  supporting evidence may be attached; it never replaces these.
- Recording the decision in the companion form is itself inert:
  applying it to docs/exlib2g-plank-content.jsonl (and any
  review_status pipeline move) is a separate, separately reviewed
  milestone with its own fingerprint gates.

## 6. Boundaries

This milestone changed exactly three paths (this packet, the
unfilled form, the EXLIB-2H verifier). The content record, seed,
inventory, migrations (still 001-026, no 027), runtime, review
ledger, and every eligibility artifact are byte-unchanged. No
catalog snapshot or load payload exists. No hosted service was
contacted. Nothing here approves, rejects, publishes, loads, seals,
delivers, or changes eligibility.
