# EXLIB-2N — R6 import-eligibility admission record (Dead bug, Ab wheel rollout)

Recorded 2026-09-03 (UTC). LOCAL-ONLY eligibility milestone: the two
human-approved authored records are admitted as import-eligible under
the R6 contract, each bound to its exact fingerprinted payload. This
admission authorizes NO catalog snapshot, NO load package, NO
loading, NO database review event, NO publication, NO relationship
projection, NO delivery, NO run, NO runtime activation, NO hosted
contact, NO seed edit, and NO seed_link_compatible flip. ChatGPT and
Claude did NOT perform, influence, or fabricate the human reviews;
this admission applies the operator-instructed, Codex-approved
eligibility act to the already-approved payloads.

## 1. The authoritative R6 contract (committed bytes)

- Validator rule R6, verbatim from docs/exlib2c-authoring-schema.json
  (x_mandatory_validator_rules): "R6: no record in any EXLIB-2C
  authoring batch may carry import_eligible true; the validator
  hard-fails the batch if the key is not literal false."
- The import_eligible property, verbatim: {"const": false,
  "$comment": "Locked false for the entire authoring milestone;
  flipping to true is a later, separately approved EXLIB-2F act on
  an exact fingerprinted payload."} — the EXLIB-2J record already
  disclosed the honest label note: the schema's "EXLIB-2F" phase
  label predates the phase renumbering; the act the schema
  describes is an R6-style admission like this one.
- SCOPE DETERMINATION (differs from EXLIB-2J's, disclosed
  precisely): the Plank admission relied additionally on the Plank
  record living OUTSIDE the EXLIB-2C batches. The two records
  admitted here live INSIDE batch02/batch04, so R6's batch language
  is directly implicated and must be construed. The promoted
  contract construes it as the AUTHORING-MILESTONE lock, on four
  committed carriers read together: (1) the import_eligible
  $comment — written INSIDE the batch schema, governing exactly
  these records — prescribes the later flip lifecycle ("Locked
  false for the entire authoring milestone; flipping to true is a
  later, separately approved act on an exact fingerprinted
  payload"), which would be meaningless if batch records could
  never flip; (2) the EXLIB-2J precedent's R6 prerequisites (later
  than authoring, separately approved, exact fingerprinted payload,
  human approval present) — all satisfied here; (3) the promoted
  EXLIB-2N application record, section 5 axis 3: the R6-style
  eligibility admissions are "a later, separately approved act on
  an exact fingerprinted payload (the EXLIB-2J precedent)"; and (4)
  the same record's section 8 item 2, which schedules exactly "The
  two R6-style eligibility admissions (separate milestone,
  separately approved, on the exact approved-record fingerprints in
  section 3)" — fingerprints that ARE the batch02 line-12 and
  batch04 line-5 payloads. R6's hard-fail clause binds the
  AUTHORING validator over authoring-milestone bytes; every
  committed historical verifier that asserts the all-ineligible
  batch state remains anchored to the exact promoted commits where
  that state was true, so the historical proofs are unweakened.
- AUTHORITY DETERMINATION (the EXLIB-2J principle, unchanged):
  import eligibility for this act belongs to each CONTENT record's
  own import_eligible field — the field R6 and the schema comment
  govern and the field a future load package will read. The
  release-1 inventory's import_eligible=false is a PLANNING-TIME
  fact frozen at authoring (byte-frozen, d349110f...), a promoted
  historical record and not a live eligibility ledger; editing it
  is forbidden in this milestone and it is untouched. The 26 legacy
  candidates (exlib1c0a) are a different, untouched population.

## 2. R6 prerequisites, proven separately for each exercise

1. LATER THAN AUTHORING: the EXLIB-2C authoring milestone is closed
   and promoted (batches byte-frozen through every later tag); the
   EXLIB-2N human-review preparation (c9c1afd, tag 59c853c1...) and
   the decision application (d48a554, tag
   exlib2n-review-decision-application-stable = 0802c029...) are
   promoted and tagged. This admission is later than all of them.
2. HUMAN CONTENT REVIEW APPROVED (recorded without embellishment):
   - Dead bug — content_review.status approved; reviewer Nick
     Tkacz; credential personal trainer (operator-confirmed, carried
     in the completed form and the application record, never in the
     authored record); reviewed_at 2026-09-03T15:47:00-04:00;
     rationale "matches my training and schooling".
   - Ab wheel rollout — content_review.status approved; reviewer
     Nick Tkacz; credential personal trainer; reviewed_at
     2026-09-03T15:26:00-04:00 (the operator-directed EDT
     correction); rationale "my training and schooling agrees with
     whats been done so far".
3. DISTINCT ACT: the human-review decision application (EXLIB-2N,
   promoted d48a554) recorded the approvals and DELIBERATELY did
   not admit; this admission is its own operator-instructed,
   separately Codex-approved milestone. Approval alone never flips
   eligibility.
4. EXACT PRE-ADMISSION PAYLOADS (the promoted application bytes,
   reconfirmed byte-for-byte immediately before the transition):
   - batch02 51,979 B / c5679b103af90be8210c35ad1e76424d49696bd3316ed8fd73522f2096773726; Dead bug line 12 (newline excluded)
     1,963 B / 8fb7bbd7361451440a004d73f932f5651d69fda59d45c0c5d26e41a5415cf294.
   - batch04 55,298 B / aaae85036135600e9fc27f8684f4b21aac7bc07c7cc69872e9932eeb73c1e9fb; Ab wheel rollout line 5 (newline
     excluded) 2,268 B / 6257d16d40213358d7900f7a76b4d3a6ebc42dc22b8d966909c567cce55639e0.
5. EXACT COMPLETED HUMAN-REVIEW FORMS (committed, byte-frozen):
   - Dead bug: 5,604 B / ce555650a643077be099b9e65490e36d8731ce9c40ad0e3aa0e80065152cdbeb.
   - Ab wheel rollout: 5,754 B / efed7f1f59a040014dd6ca5df1276997de2f7410a186da10532fe987558181b5 (the corrected-timestamp
     revision).
6. BYTE-CHANGE INVALIDATION: any later change to either record's
   content bytes INVALIDATES its eligibility; a changed record is a
   new payload requiring renewed human review (or re-review) and a
   new, separately approved admission (section 4).
7. AUTHORITATIVE FIELD: import_eligible within each authored record
   is the authoritative carrier of this lifecycle act (section 1).
8. SEPARATE AXES: review_status, snapshot category, database
   snapshot state, database review, loading, publication, and
   relationship projection are distinct axes, none of them moved by
   this admission (section 5).

## 3. The precise authorized transitions

ONE-FIELD JSON TRANSITIONS (proven independently per key: identical
key sets and order; the only differing key is import_eligible):

- Dead bug (batch02 line 12): import_eligible false -> true. Every
  other key and value is byte-identical: content_review (approved,
  Nick Tkacz, 2026-09-03T15:47:00-04:00, "matches my training and
  schooling") value-identical; review_status remains "proposed";
  deferred remains false; no category field inserted; no
  publication field exists. Resulting line (newline excluded)
  1,962 B / 3fbbaccd7bdd152f86c8b4f46f4293e012494cdb5704b67d3762ec715d3dcf55.
- Ab wheel rollout (batch04 line 5): import_eligible false -> true.
  content_review (approved, Nick Tkacz, 2026-09-03T15:26:00-04:00,
  "my training and schooling agrees with whats been done so far")
  value-identical; review_status "proposed"; deferred false; no
  category or publication field. Resulting line (newline excluded)
  2,267 B / 4d09e2f9d9bef60bf01b00b1c84ea76563783c32995847a8e9dfde0ee740baa2.

HEADER COMMENTARY (disclosed separately from the JSON transitions):
each batch's COMPLETE four-line '#' header block is rewritten
truthful, because the promoted headers said every record was
import_eligible=false — now false for the admitted record. The
corrected headers state: the named record is human-approved AND
import-eligible; every other record remains pending with null
review evidence; every other record remains import-ineligible;
review_status remains proposed for every record; no publication
state exists; and eligibility does NOT mean loaded, published,
projected, or delivered. All four lines begin with '#', are dropped
by every parser in the repository, and per-file record counts are
unchanged (25 and 25).

EXACT CHANGED-LINE SETS vs the promoted source (mechanically proven
at edit time and re-proven by the admission verifier): batch02 =
header commentary {1, 2, 3, 4} plus JSON transition {12};
batch04 = header commentary {1, 2, 3, 4} plus JSON transition
{5}. Every other line in each file is byte-identical.

RESULTING ADMITTED BATCH FINGERPRINTS:

- batch02: 52,123 B / ebca1c01ffa66c78bdc42fc2972cfd328a75d2d6c2735878f9445617c15743cc.
- batch04: 55,442 B / c8a63ccbd7cc2913265926050480535f5d4adff585f1d462f9b2c2d30406fcf2.

## 4. Binding and invalidation

Each admission applies ONLY to the exact resulting record line and
batch fingerprints above, which differ from the reviewed and
approved payloads (section 2 item 4) in exactly the import_eligible
field plus the disclosed header commentary. ANY later change to
either record's content bytes INVALIDATES that record's admission:
a changed record is a new payload that requires human review (or
re-review) and a new, separately approved eligibility admission
before it may be treated as import-eligible.

## 5. Explicit separations (unchanged by this admission)

1. Human content approval — already decided (EXLIB-2N application,
   promoted d48a554); untouched here; content_review value-identical.
2. Import eligibility — THIS milestone; now true for exactly these
   two fingerprinted payloads and no others.
3. Snapshot category — the human decisions (Dead bug = mobility,
   "works out your core"; Ab wheel rollout = other, "it impacts a
   multitude of things") remain carried ONLY by the committed
   completed forms and the promoted application record; the
   authoring schema has no category field and none was inserted.
4. review_status — an independent authoring-pipeline axis; remains
   "proposed" for every record including the admitted two (the
   EXLIB-2I/2J precedent); the schema requires no coupled
   transition and none was inferred.
5. Database snapshot state — both intended UUIDs (Dead bug =
   e21b2c00-0000-4000-a000-000000000002, Ab wheel rollout =
   e21b2c00-0000-4000-a000-000000000003, never swapped) remain BARE
   identities on hosted ShredOS; no snapshot exists or is created;
   the hosted target-snapshot gate remains OPEN; no hosted service
   was contacted.
6. Database review, publication, projection — no database review
   event, no publication state, and no relationship projection
   exists or is implied for either record; the loaded Plank content
   remains pending/draft/unadmitted/unpublished.
7. Delivery, runs, seed — no run, no delivery, no seed edit;
   seed_link_compatible remains false everywhere it is recorded.

## 6. Verifier lifecycle for this milestone

- scripts/verify-exlib2n-r6-admission.ts (new) owns the admitted
  posture: exact promoted source and tag; exact completed forms;
  exact pre-admission payloads; the one-field JSON deltas proven
  per key; the truthful headers with stale-claim rejection; the
  126-record eligibility sweep (exactly the two admitted records
  eligible); categories evidence-only and outside the schema; no
  UUID swap; no snapshot or load package; no publication or
  projection; no hosted-state claim; the lifecycle boundaries; and
  the branch topology with the exact five-path inventory.
- scripts/verify-exlib2n-application.ts is retargeted under
  `RETARGET (EXLIB-2N R6 eligibility admission)`, anchored to the
  promoted application tip d48a554... where its phase claims were
  and remain true: the post-transition batch bytes (C1-C4, F2), the
  126-record sweep (D1), the range boundary (D2), the nineteen-path
  inventory (E2, E3), and the G replacement-branch topology
  (G1-G4). Its claims over files this admission does not touch stay
  live. Assertion strength is preserved: every anchored check still
  binds the exact same bytes and topology over a named promoted
  commit.
- The thirteen suites retargeted by the application milestone remain
  anchored to c9c1afd... and are untouched byte-for-byte.
- SECOND-ORDER SWEEP: for every file changed by this milestone, its
  promoted-source fingerprint was resolved and the whole scripts/
  tree grepped for it; no committed verifier pins the bytes of any
  file this milestone changes, so no second-order retarget exists
  (the round-1 verify-exlib2g pin binds verify-exlib2f-application
  at the 2N tip via sha256At2N and is unaffected).

## 7. What this milestone did NOT do

No target snapshot, load package, SQL artifact, or loader
invocation; no database review event, admission, publication, seal,
revocation, or relationship projection; no run, delivery, or
runtime change; no review_status move; no seed edit; no
seed_link_compatible flip; no inventory or ledger edit; no
dependency, API, UI, or configuration change; no hosted contact of
any kind. The admitted Plank artifact (2,928 B / d8207849...), the
SPENT EXLIB-2K load package (29,760 B / a1b6dd55...), both blank
forms, both completed forms, both packets, the preparation record,
and the application record are byte-unchanged.

## 8. Dependency map (later, explicitly gated)

1. Codex review of this milestone; push/promotion/tag are separate
   explicit gates.
2. Target-snapshot load-package preparation binding the two admitted
   payloads (section 3 fingerprints) and the two category decisions
   (mobility, other) — a new one-use, fail-closed package; the
   spent Plank package is never reused.
3. Hosted snapshot loading — Joseph/ChatGPT only, never Claude.
4. The hosted target-snapshot gate proof (active canonical "Dead
   bug" at ...0002 and "Ab wheel rollout" at ...0003, never
   swapped, missing, inactive, or ambiguous).
5. Only then: Plank database content review, eligibility admission,
   and publication — each its own authority-gated act.
