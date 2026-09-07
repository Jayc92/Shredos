# EXLIB-2W — completed human-decision artifacts record

Recorded 2026-09-07 (UTC). LOCAL-ONLY milestone, TRANSCRIPTION ONLY:
this phase records the three completed hosted-snapshot review
decisions and the completed S4 authority inputs, each supplied
verbatim by the human decision-maker under explicit operator
instruction, into completed decision artifacts. It performs NO
database application of any kind: no snapshot review is applied, no
review event is created, no S4 run is created, nothing is approved
or sealed database-side, nothing is delivered, published, pushed,
promoted, tagged, or deployed, and no Supabase or Vercel endpoint
was contacted. The completed artifacts are HUMAN EVIDENCE, not
database state, and they authorize no execution by themselves. The
next lawful milestone is a separately reviewed, ONE-USE hosted
snapshot-review APPLICATION package; S4 remains blocked until that
application milestone is completed and evidenced.

## 1. Authoritative source and provenance

- Promoted source: main = origin/main =
  0d4dad415a40c8b4baf042651e3f748f3c8c9f5e (tree
  badf189368c74cf4d47bcd251c8bcefe5cc1fd80), carrying the annotated
  stable tag exlib2v-snapshot-review-decision-prep-stable (tag
  object 2ad1b44fc20af79d3aa5d9674a0ecc6502386da7, peels to the
  source commit; 114-byte annotation "EXLIB-2V hosted
  snapshot-review decision packets and S4 authority inputs —
  PREPARED — HUMAN DECISIONS PENDING" plus exactly one trailing
  newline, byte-verified).
- The four promoted BLANK templates (three snapshot-review forms
  and the S4 authority-inputs form) are UNTOUCHED by this phase:
  each remains byte-identical to promoted main, every human and
  requested value in them still null.
- The reserved exlib2u-staged-run-prep branch is untouched (zero
  commits of its own; it predates the current main and any S4
  resumption will take a fresh branch from the then-promoted tip —
  never a rewrite).
- Naming: exlib2w appears nowhere in tracked paths, tags, local
  branches, or fresh remote refs; EXLIB-2W is the next free
  namespace (2u stays reserved for the staged run, 2v is the
  preparation milestone). Branch:
  exlib2w-human-decision-artifacts, forked from promoted main.

## 2. Chronology (proven mechanically)

The human decision timestamp is 2026-09-07T11:05:00-04:00 (Eastern
daylight time), preserved in that EDT representation in every
completed form. Its equivalent UTC instant is 2026-09-07T15:05:00Z
(proven by timezone conversion, not assumed). That instant is AFTER
the EXLIB-2V stable-tag publication: 217 seconds after the recorded
push-completion instant 2026-09-07T15:01:23Z, and mechanically
after the tag object's own tagger instant 2026-09-07T15:01:04Z
(read from the raw tag object). The human therefore decided on the
PROMOTED, TAGGED templates.

## 3. The completed snapshot-review decisions (supplied verbatim)

Each completed form is a NEW tracked file (the EXLIB-2N
completed-form naming precedent), differing from its promoted blank
template at EXACTLY the six human_fields leaves and nowhere else —
the lawful completion transition the templates themselves define.
All three decisions are APPROVE. Reviewer for all three: Joseph
Carfagno, Product owner (human-supplied; reviewed_at
2026-09-07T11:05:00-04:00):

- docs/exlib2v-plank-snapshot-review-form-completed.json —
  APPROVE; rationale "Approved as an accurate timed, bilateral
  bodyweight core exercise."; evidence "Reviewed the complete
  EXLIB-2V Plank snapshot-review packet."
- docs/exlib2v-dead-bug-snapshot-review-form-completed.json —
  APPROVE; rationale "Approved as an accurate alternating
  bodyweight core and mobility exercise."; evidence "Reviewed the
  complete EXLIB-2V Dead bug snapshot-review packet."
- docs/exlib2v-ab-wheel-rollout-snapshot-review-form-completed.json
  — APPROVE; rationale "Approved as an accurate advanced bilateral
  weighted-repetition core exercise."; evidence "Reviewed the
  complete EXLIB-2V Ab wheel rollout snapshot-review packet."

Everything else in each completed copy — reviewed-object
identities, all eighteen governed fields including the created_at
UNKNOWN sentinel, verbatim scope, review contract, lifecycle rules,
classifications, and source fingerprints — is IDENTICAL to the
approved template. Per the templates' own lifecycle, any further
byte change to a completed form voids that decision.

NON-OPERATIVE (Codex round 1): exactly BECAUSE the lifecycle bytes
are identical to the template's, each round-0 completed copy still
DECLARES the present-tense fixed state "PREPARED_BLANK_TEMPLATE -
this prepared blank form is an approved template, NOT a decision"
while carrying a populated APPROVE decision — a semantic
self-contradiction. The three round-0 completed snapshot forms are
therefore NON-OPERATIVE: they record the transcription faithfully
as history, but NO VALID SNAPSHOT DECISION IS CURRENTLY CLAIMED by
this repository. Their own contract forbids repairing them in
place (only the initial six-field completion transition is lawful,
and any subsequent byte change voids the decision), so the
correction supersedes them with fresh v2 blank templates — see
section 7a — and a FRESH human review with a NEW timestamp is
required. The completed S4 AUTHORITY-INPUTS form is UNAFFECTED by
this finding (its blank template never carried a fixed
state declaration), remains byte-identical to its round-0
transcription, and stays RESERVED EVIDENCE ONLY.

## 4. The completed S4 authority inputs (supplied verbatim)

docs/exlib2v-s4-authority-inputs-form-completed.json differs from
its promoted blank template at EXACTLY the seven authorized value
leaves:

- product_approver_identity.value = Joseph Carfagno;
  product_approved_at = 2026-09-07T11:05:00-04:00.
- legal_approver_identity.value = Joseph Carfagno;
  legal_approved_at = 2026-09-07T11:05:00-04:00.
- approval_rationale.value = "Approved for staged delivery
  validation of Plank and its reviewed progression and substitution
  targets. This does not authorize sealing, production delivery, or
  enabling the delivery flag; those remain separately gated."
- run_key_literal.value = exlib2u-plank-release1-staged-v1
  (32 characters after btrim — inside the schema's 8-200 rule;
  absent from all promoted repository history and hosted evidence
  records, so it is fresh and unique-by-construction until the S4
  run itself binds it).
- run_membership.value = ALL_THREE_IDENTITIES.

Recorded explicitly: Joseph Carfagno HUMAN-SUPPLIED both authority
identities — they were not inferred by any machine or preparer.
The schema does not require distinct product and legal approvers
(both identities and timestamps are independent columns validated
only for non-blank completeness at the seal). ALL_THREE_IDENTITIES
was the human product decision; it means Plank, Dead bug, AND Ab
wheel rollout must all be successfully applied as approved hosted
snapshots before S5 sealing can succeed (the seal validation
rejects any non-approved member). Completing this authority form
creates NO run and authorizes NO execution by itself; the run key
and membership choice are RESERVED INPUTS ONLY for the later,
separately instructed EXLIB-2U staged-run package.

## 5. What has NOT happened (the application boundary)

No hosted snapshot review has been applied: all three hosted
snapshot rows remain review_status = pending with NULL audit
fields, exactly as the promoted EXLIB-2K/2O/2P/2R records pin them,
and exercise_catalog_review_events remains at its promoted
pre-application value of ZERO. No S4 run exists (import runs and
run items remain ZERO per the same promoted evidence). Delivery,
sealing, publication-state changes, flag or run-key environment
configuration: none occurred and none is authorized here. The next
lawful milestone is the separately reviewed, one-use hosted
snapshot-review APPLICATION package (prepared local-only, Codex
reviewed, executed hosted exactly once by Joseph/ChatGPT — never by
Claude — then evidenced).

## 6. Verifier lifecycle for this milestone

scripts/verify-exlib2w.ts (new, static, LOCAL-ONLY) proves the
fifteen instructed families: W1 blank templates byte-identical to
promoted main; W2 each completed snapshot form differs from its
template at exactly the six human_fields leaves (structural
leaf-walk, not a text diff); W3 no completed human field null or
blank; W4 every supplied value character-exact; W5 all three
decisions APPROVE; W6 the timestamp parses and equals the UTC
instant 2026-09-07T15:05:00Z; W7 the decision instant follows the
stable-tag publication (both the recorded push instant and the
mechanical tag-object tagger instant); W8 reviewed-object
identities, governed fields, fingerprints, lifecycle rules, and the
created_at sentinel unchanged from the approved templates
(subsumed by the leaf-walk and re-asserted on key spots); W9 the
completed authority form differs at exactly the seven authorized
leaves; W10 the run key satisfies the 8-200 rule and is absent
from the promoted tree (repository history and hosted evidence
records at the source commit); W11 membership exactly
ALL_THREE_IDENTITIES; W12 no SQL, RPC, hosted endpoint,
environment-variable assignment, seed edit, inventory edit, or
executable lifecycle action introduced; W13 this record claims no
snapshot review, review event, S4 staging, approval, sealing, or
delivery occurred (the not-yet statements present, no
contrary claim); W14 topology and inventory exact; W15 hygiene and
credential boundaries; and W16 (Codex round 1) derives each form's
status MECHANICALLY from its six human fields (all null =
PREPARED_BLANK_TEMPLATE; all non-null = COMPLETED_HUMAN_DECISION;
mixed = INVALID) and rejects any form whose declared lifecycle
semantics conflict with that derived status — the three enumerated
round-0 completed forms are the only tolerated incoherent
artifacts, and only because this record declares them
non-operative. Each of the six instructed NEGATIVE CONTROLS
was run before committing: a scratch mutation (altered non-human
template field; a re-nulled human field; a changed decision; an
incorrect timestamp; an unauthorized authority-form field change; a
different membership choice) made the targeted check fail alone,
and the corrected bytes were restored byte-exact and re-verified.

## 7. Stale-claim sweep and battery reconciliation

The full historical battery was swept against a temporary
never-referenced simulated commit carrying this phase. The stale
set was enumerated MECHANICALLY: exactly TWO checks in ONE suite
failed; nothing else did. verify-exlib2v A3 (the naming-derivation
census: "exlib2v appears in no tag" and a letters census over all
tags) was falsified NOT by this phase but by the EXLIB-2V
milestone's OWN closure — its stable tag now exists, which is
exactly the recurring completed-phase pattern this repository has
seen before (a finished milestone's own artifacts falsify its
authoring-time self-censuses). The retarget, under the label
`RETARGET (EXLIB-2W human-decision artifacts)`, anchors the
derivation claim historically: the census now excludes the
milestone's own post-closure stable-tag namespace, exactly as the
claim was true at derivation time and remains true of every OTHER
namespace. verify-exlib2v B1 (every human field null in the three
review forms it reads) stays TRUE because it reads the BLANK
template paths, which this phase never modifies — no retarget
needed there. With the retarget in place the round-0
simulated-commit battery and committed battery both read 92 suites
/ 7,128 checks / 0 failures — the promoted baseline 91/7,113 plus
the then-15-check static suite, count-neutral everywhere. After the
Codex round-1 correction added W16, the corrected simulated-commit
battery and committed battery both read 92 suites / 7,129 checks /
0 failures — the same baseline plus exactly this milestone's
16-check static suite and nothing else.

## 7a. Codex round-1 correction (2026-09-07)

Codex re-review found, and verification against the committed
candidate 28ec4aebc4796317bb2a3fde663fc80b859773cd confirmed, that
all three round-0 completed snapshot forms declare the fixed
present-tense PREPARED_BLANK_TEMPLATE / NOT-a-decision state while
holding complete APPROVE decisions, and that verify-exlib2w proved
the six-leaf structural difference without ever proving
lifecycle-state coherence (its W8 in fact REQUIRED the completed
lifecycle bytes to equal the blank template's, locking the
contradiction in). The completed forms were NOT repaired in place
and their wording was NOT reinterpreted: their own contract permits
only the initial six-field completion transition and voids any
later byte change, and the 2026-09-07T11:05:00-04:00 timestamp was
NOT reused. Instead, ONE plain forward correction commit (the
round-0 candidate and all earlier commits preserved, history never
rewritten) adds three superseding BLANK v2 templates —
docs/exlib2w-plank-snapshot-review-form-v2.json,
docs/exlib2w-dead-bug-snapshot-review-form-v2.json,
docs/exlib2w-ab-wheel-rollout-snapshot-review-form-v2.json — that
copy the governed snapshot facts and the seventeen preserved values
EXACTLY from the accepted EXLIB-2V forms (created_at sentinel and
truthful scope preserved), keep all six human fields null, keep the
six-fields-only completion rule, post-completion immutability, and
every independent source/hosted-state voiding rule, and REPLACE the
fixed state declaration with the state-neutral mechanical rule
(all six null = PREPARED_BLANK_TEMPLATE, not a decision; all six
non-null human-supplied in the single lawful transition =
COMPLETED_HUMAN_DECISION; any mixed state = INVALID). NO completed
v2 forms were created and NO former human values were copied
forward: fresh human review with a new timestamp is required after
these corrected templates are themselves reviewed. The dedicated
W16 coherence check was added with a negative control (a populated
scratch copy carrying the old fixed blank-only declaration made
W16 fail alone, and the corrected bytes were restored byte-exact).
No review application, event, run, approval, seal, or delivery act
occurred, and the correction was made without hosted contact.

## 7b. Worktree-contamination disclosure and quarantine (2026-09-07)

While the round-1 correction was in progress (authored but not yet
committed), an EXTERNAL actor — not this preparation session; the
folder is also open in another session, and both round-0 sweeps and
the round-0 committed battery had been clean minutes earlier —
moved 748 loose files (250,459,899 bytes; old scratch sources,
historical exlib export sets, review bundles, and even this
milestone's own round-0 export set) from the Downloads folder into
the repository root, with timestamps preserved. The contamination
touched NO tracked byte (HEAD stayed at the round-0 candidate, the
index and stash stayed empty, and the only tracked modifications
remained this record and the verifier), but it invalidated
worktree-scanning checks and simulated-commit sweeps until removed.
Under explicit operator instruction the 748 mechanically classified
foreign files — every one a plain file at the repository root,
overlapping no tracked path and no authorized correction path —
were RELOCATED (never deleted, never overwritten, git clean never
used) into the non-overwriting quarantine directory
shredos-repo-contamination-quarantine-20260907 in the Downloads
folder, preserving relative paths and metadata. Complete source and
destination inventories (relative path, byte size, SHA-256) are
retained inside the quarantine; every file arrived byte-identical,
source and destination counts are both exactly 748, the total bytes
reconcile exactly, none of those paths remains inside the
repository, and the repository afterward contained exactly the five
authorized correction changes. The prior round-0 export paths
reported for review are therefore STALE (the round-0 exports now
live in the quarantine); this correction ships a fresh
non-overwriting export set. The simulated-commit sweep for this
correction builds its probe tree from the intended phase paths
EXPLICITLY rather than a blanket add, so a recurrence of external
contamination cannot silently enter a probe tree.

## 8. Stop condition

This milestone stops LOCAL-ONLY on its branch for Codex review. Not
pushed, not promoted, not tagged, not merged, not deployed; the four
promoted blank templates unmodified; no value beyond the supplied
ones filled or changed; no Supabase or Vercel contact; no snapshot
review applied; no review event; no application package authored or
executed; no S4 run; no approval or sealing; no delivery; no flag
or run-key configuration; no seed or inventory edit; no EXLIB-2S
change; EXLIB-2U untouched and reserved.
