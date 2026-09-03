# EXLIB-2N — review-decision application record

Recorded 2026-09-03 (UTC). LOCAL-ONLY milestone: the two completed,
validated EXLIB-2N human reviews are preserved as committed evidence
and their APPROVED decisions are applied to the two authored exercise
records' schema-defined content_review fields — nothing else. ChatGPT
and Claude did NOT perform, influence, or fabricate the human
reviews; Claude is only recording and applying the supplied human
decisions under explicit operator instruction. This application
changes neither import eligibility nor publication nor hosted catalog
state; the hosted target-snapshot gate remains OPEN. This record
APPROVES NOTHING further; it awaits Codex review.

## 1. The human reviews (supplied facts, recorded verbatim)

Both reviews were performed by the operator-selected human
specialist, on the deliberately unfilled forms promoted at the
EXLIB-2N preparation tip (tag
exlib2n-target-snapshot-review-prep-stable, object
59c853c12455d1ac00522c479a2d5aad86b6c6ab -> main =
c9c1afd7df35f2870430da3a8d1295ff7e48e11d, tree
c645439460601d44b9c889e2ac4e83cb624ea48d):

1. Dead bug — decision APPROVED; reviewer Nick Tkacz; credential
   personal trainer (operator-confirmed); reviewed_at
   2026-09-03T15:47:00-04:00 (Eastern daylight time); review
   rationale "matches my training and schooling"; snapshot category
   decision **mobility** with rationale "works out your core"; all
   NINE needs-human-judgment confirmations true; optional evidence
   null. Independently validated 12/12 against the promoted blank
   form and packet, including the safeguard proof that the external
   StrengthLog "isolation" manifest value stayed evidence-only,
   non-authoritative, and UNSELECTED — the human independently chose
   mobility.
2. Ab wheel rollout — decision APPROVED; reviewer Nick Tkacz;
   credential personal trainer (operator-confirmed); reviewed_at
   2026-09-03T15:26:00-04:00 (Eastern daylight time); review
   rationale "my training and schooling agrees with whats been done
   so far"; snapshot category decision **other** with rationale "it
   impacts a multitude of things"; all TEN needs-human-judgment
   confirmations true; optional evidence null. Independently
   validated 11/11 against the promoted blank form and packet.
   Timestamp provenance, disclosed precisely: the reviewer first
   recorded offset -05:00; the operator supplied the physical-locale
   fact (Philadelphia, Eastern daylight time on 2026-09-03) and
   directed a single-byte offset correction to -04:00, applied and
   re-validated 11/11 before this milestone; the superseded -05:00
   file (SHA-256 6e9d965d4df983955b24e13f933e26c436e108d2dfff8d0dc8
   cf49a4ab08eb12) is retained outside the repository.

## 2. Committed completed-form evidence (byte-exact copies)

The promoted BLANK forms are preserved byte-unchanged at their
original paths as historical evidence
(docs/exlib2n-dead-bug-target-snapshot-review-form.json, 5,499 B,
2e6f41fff5103cb9537a224bac4277f79d1b08f4530cb218bdc9db59eb714fa8;
docs/exlib2n-ab-wheel-rollout-target-snapshot-review-form.json,
5,612 B, 312e78558fd42387870dc686b7b48d3ea3b1434ea24165973667623897a
795e6). The completed forms are committed as byte-exact copies at
NEW paths:

- docs/exlib2n-dead-bug-target-snapshot-review-form-completed.json —
  5,604 B, SHA-256
  ce555650a643077be099b9e65490e36d8731ce9c40ad0e3aa0e80065152cdbeb.
- docs/exlib2n-ab-wheel-rollout-target-snapshot-review-form-completed
  .json — 5,754 B, SHA-256
  efed7f1f59a040014dd6ca5df1276997de2f7410a186da10532fe987558181b5
  (the corrected-timestamp revision; supersession history in
  section 1).

Both completed forms carry every protected field byte-identical to
their blank forms (23 protected fields each, verified), so the
packet bindings, fingerprints, UUIDs, vocabulary, and no-effect
statements are carried forward unweakened.

## 3. The applied transitions (minimal by proof)

Authoritative source records, byte-frozen through the promoted 2N
tip: Dead bug = docs/exlib2c-release1-batch02-content.jsonl line 12
(file 51,496 B / 1ddc3ab0bd92d60ef33960d82a8e0c8a2fdea1cb828d15fc9bf
6a82c34305d48; line 1,900 B / 3dbd0384542bdf6feb96d84a61d2d50b5c6ca0
fdc057fcafded67aeb631a8796); Ab wheel rollout =
docs/exlib2c-release1-batch04-content.jsonl line 5 (file 54,781 B /
e7def375e9b9560863796bff90746dc6ff2b2f7c4bd7735a3d53fc2cc9750568;
line 2,178 B / 475870776e6dd309c6646f05b33b9a3050d7fbacd653e245dc353
4d288981a8b).

The exact changed-line sets, mechanically proven at edit time and
re-proven by the application verifier against the promoted 2N tip:
batch02 changed in EXACTLY lines {1, 2, 3, 4, 12}; batch04 changed
in EXACTLY lines {1, 2, 3, 4, 5}. Every other line in each file is
byte-identical to its promoted source. The two kinds of change:

1. The record line's content_review object ONLY — from
   {"status": "pending", "reviewer": null, "reviewed_at": null,
   "rationale": null} to the approved decision with the reviewer,
   offset date-time, and rationale copied verbatim from the
   completed form. Every other key and value on the line is
   byte-identical, key order preserved. This is exactly the
   schema-defined transition the EXLIB-2I Plank precedent applied:
   reviewer carries the NAME only ("Nick Tkacz"); the
   role/credential lives in the completed form and this record, and
   NO invented field was added to the authored records.
2. The COMPLETE four-line '#' header comment of each file —
   corrected as a whole so that every surviving header claim is
   truthful (Codex round-2 correction; section 9). The first
   application had updated only line 1, leaving lines 2-4 asserting
   "content_review pending", "with zero evidence", and "nothing
   here is approved or loadable" — claims now false for these two
   files. The corrected headers state precisely: the named target
   record is approved; every other record in the batch remains
   pending with null review evidence; every record (including the
   approved one) remains import_eligible=false; no publication
   state exists for any record; and human content approval does NOT
   make any record loadable. DISCLOSED AND PROVEN COMMENTARY: all
   four lines begin with '#', are excluded by every parser in the
   repository (the shared parseJsonl filter drops '#' lines), appear
   in no JSON record, are not fields of the authoring schema, and
   the per-file record counts are unchanged (25 and 25).

Resulting approved-record fingerprints (corrected; these supersede
the first-application fingerprints, which are retained in section 9):

- batch02: file 51,979 B, SHA-256
  c5679b103af90be8210c35ad1e76424d49696bd3316ed8fd73522f2096773726;
  Dead bug line 12 (newline excluded) 1,963 B, SHA-256
  8fb7bbd7361451440a004d73f932f5651d69fda59d45c0c5d26e41a5415cf294.
- batch04: file 55,298 B, SHA-256
  aaae85036135600e9fc27f8684f4b21aac7bc07c7cc69872e9932eeb73c1e9fb;
  Ab wheel rollout line 5 (newline excluded) 2,268 B, SHA-256
  6257d16d40213358d7900f7a76b4d3a6ebc42dc22b8d966909c567cce55639e0.

Both record-line fingerprints are UNCHANGED from the first
application: the round-2 correction touched only header commentary,
never a JSON record line.

## 4. The category decisions (carried here, NOT in the records)

The authoring schema (additionalProperties: false) has no category
field, so NO category was inserted into either authored record —
mechanically verified. The authoritative carriers of the two human
category decisions are the committed completed forms and this
record:

- Dead bug: snapshot category = **mobility** (rationale "works out
  your core").
- Ab wheel rollout: snapshot category = **other** (rationale "it
  impacts a multitude of things").

These values feed the LATER target-snapshot load-package milestone
(exercise_catalog.category is NOT NULL; migration 026's delivery
copies it into tenant exercises rows, so it is product-visible).
Nothing in this milestone creates, stages, or loads a snapshot.

## 5. Distinct axes (never conflated)

1. content_review — the authoring review axis: NOW approved for
   these two records (this milestone's only mutation).
2. review_status — the authoring-pipeline axis: UNCHANGED at
   "proposed" for both (the EXLIB-2H contract holds it independent;
   the 2I Plank precedent left it "proposed" at approval; no
   promoted contract requires a transition here).
3. import_eligible — the R6 admission axis: UNCHANGED at false for
   both. The R6-style eligibility admissions are DELIBERATELY NOT
   performed in this milestone; each is a later, separately approved
   act on an exact fingerprinted payload (the EXLIB-2J precedent).
4. Snapshot category — decided by the human, carried in evidence
   (section 4), applied to NO schema field.
5. Database snapshot state — both intended UUIDs
   (Dead bug = e21b2c00-0000-4000-a000-000000000002, Ab wheel
   rollout = e21b2c00-0000-4000-a000-000000000003, never swapped)
   remain BARE identities on hosted ShredOS; no snapshot was
   created, no load package exists, and the hosted target-snapshot
   gate remains OPEN. No hosted service was contacted.
6. Publication — no publication state exists or is implied for
   either record; the loaded Plank content likewise remains
   pending/draft/unadmitted/unpublished.
7. Relationship projection — exercise_catalog_relationships remains
   empty; nothing here projects anything.

## 6. Verifier lifecycle for this milestone

- scripts/verify-exlib2n-application.ts (new) owns the applied-state
  posture: completed-form authenticity and protected-field
  discipline, exact human facts and category decisions, the
  exact-transition proofs against the promoted 2N tip blobs (C1/C2
  prove the changed-line sets {1,2,3,4,12} and {1,2,3,4,5} exactly,
  with the record line differing ONLY in content_review), the
  full-header truthfulness proof (C3 validates all four leading
  header lines against the five required statements and explicitly
  rejects the three stale claims), the category-outside-schema
  proof, every downstream lock, no UUID swap, no hosted-state
  claim, the exact lifecycle history, and the replacement-branch
  topology (G1-G4: merge base and single parent = the promoted 2N
  tip, exactly 1 ahead / 0 behind, one commit and zero merges in
  the range, and the exact nineteen-path inventory).
- THIRTEEN existing suites carried live byte-frozen or pending-state
  claims over the two batch files and are retargeted under the
  label `RETARGET (EXLIB-2N review-decision application)`, each
  anchored to the promoted 2N tip c9c1afd7df35f2870430da3a8d1295ff7e
  48e11d where the claims were true, count-neutral, with every other
  file's claims kept live: verify-exlib2c-batch02/03/04/05/06
  (anchored batch02/04 parses and fingerprint pins),
  verify-exlib2d/2e/2f (anchored batch02/04 members of the
  126-record pending sweep), verify-exlib2f-application (the same
  anchored sweep members), verify-exlib2g (anchored corpus members),
  verify-exlib2j (anchored batch02/04 entries of the six-fingerprint
  set), verify-exlib2l (anchored batch02/04 frozen-vs-source
  comparisons), and verify-exlib2n itself (A2, A3, B1, B2, F1, I2
  anchored to its own promoted phase). Eleven were identified by the
  mechanical sweep; the last two (verify-exlib2f-application,
  verify-exlib2l) reference the batch files through template-built
  paths the sweep missed and were caught by the full committed-state
  battery — the binding net. No historical proof is weakened:
  batches 01/03/05/06, the ledger, the legacy candidates, the seed,
  and the inventory remain LIVE claims everywhere.
- ONE SECOND-ORDER retarget, disclosed precisely because it is not
  obvious from the two edited data files: verify-exlib2g pins the
  full-file SHA-256 of ANOTHER VERIFIER, scripts/verify-exlib2f-
  application.ts (20d5b2e3cb897c29b624e8156528f1af9f5ab4f51fcda5c5f47
  74e74573db1dd). Because that verifier is itself one of the thirteen
  retargeted suites, applying the human decisions changed its bytes
  and broke a pin that references no authored record at all. The
  battery caught it; the pin is anchored to the promoted 2N tip where
  those exact bytes were canonical. The assertion is unchanged in
  strength — still one exact full-file SHA-256, now over a named
  commit — and the retarget count stays THIRTEEN because
  verify-exlib2g was already among them. A mechanical sweep over
  every file changed in this range, resolving each one's promoted-tip
  fingerprint and grepping the whole scripts/ tree for it, confirms
  this was the ONLY cross-verifier byte pin affected.
- Phase inventory: NINETEEN paths (2 modified batch files, 4
  additions, 13 labeled retargeted suites), asserted exactly.

## 7. What this milestone did NOT do

No R6 eligibility admission (import_eligible remains false for both
records and for all other authored records); no review_status move;
no target snapshot, load package, run, or delivery; no database
review event, admission, publication, seal, revocation, or
relationship projection; no seed edit; no seed_link_compatible flip;
no inventory, ledger, runtime, API, UI, dependency, or configuration
change; no hosted contact of any kind. The admitted Plank artifact
(2,928 B / d82078490efa9ef13e128e7b7b742fbda8ea9e74e32382252d96c326c
679d752) and the SPENT EXLIB-2K load package (29,760 B / a1b6dd55850
c5d544e2f484d1ce4833b41deec7f3dd4d4c2373cb3b50daaccf0) are
byte-unchanged.

## 8. Dependency map (later, explicitly gated)

1. Codex review of this milestone; push/promotion/tag are separate
   explicit gates.
2. The two R6-style eligibility admissions (separate milestone,
   separately approved, on the exact approved-record fingerprints in
   section 3).
3. Target-snapshot load-package preparation binding the approved
   records and the section-4 category decisions (a new one-use,
   fail-closed package; the spent Plank package is never reused).
4. Hosted snapshot loading — Joseph/ChatGPT only, never Claude.
5. The hosted target-snapshot gate proof (active canonical "Dead
   bug" at ...0002 and "Ab wheel rollout" at ...0003, never swapped,
   missing, inactive, or ambiguous).
6. Only then: Plank database content review, eligibility admission,
   and publication — each its own authority-gated act.

## 9. Codex correction round (2026-09-03) — supersession disclosure

Codex reviewed the first application milestone and required two
corrections. Nothing from the first round is rewritten or hidden;
this section records the supersession precisely.

1. HEADER TRUTHFULNESS. The first application updated only line 1 of
   each batch header, leaving lines 2-4 internally contradictory
   ("content_review pending", "with zero evidence", "nothing here is
   approved or loadable" — each false once one record in the file
   was approved with populated review evidence). The correction
   rewrites ALL FOUR leading comment lines of each batch truthfully
   (section 3). The superseded first-application fingerprints, valid
   only on the preserved branch below: batch02 51,690 B / 253a65b23b
   73c42d5a5183f5b1f9bdddebeea04b38c34c6f7513094a5b6e1431; batch04
   55,009 B / 1ddbd2003f3f8a32dbcfd0b8241e4088b96d7e8796573d9b3669ad
   30bc001146. The corrected fingerprints are authoritative: batch02
   51,979 B / c5679b103af90be8210c35ad1e76424d49696bd3316ed8fd73522f
   2096773726; batch04 55,298 B / aaae85036135600e9fc27f8684f4b21aac
   7bc07c7cc69872e9932eeb73c1e9fb.
2. COMMIT TOPOLOGY. The instruction required exactly one plain
   forward commit; the first application accumulated five (c1f15b3 ->
   f0dde4b -> 65cc5ea -> 5808080 -> 2834136) through fix cycles. Per
   the correction: the five-commit branch
   exlib2n-review-decision-application (tip 2834136e758143697c2f8219
   73ed6a5c9cf62c4b) is PRESERVED untouched — never amended,
   squashed, rebased, deleted, or rewritten — as the historical
   record of the first round; the milestone is reproduced on the
   replacement branch exlib2n-review-decision-application-corrected
   as EXACTLY ONE plain single-parent commit off promoted main
   c9c1afd7df35f2870430da3a8d1295ff7e48e11d, carrying the fully
   corrected nineteen-path tree. The application verifier's new
   G-section binds this topology (merge base and sole parent = the
   promoted tip, 1 ahead / 0 behind, one commit, zero merges, exact
   inventory).

Everything accepted in the first round is preserved byte-exact in
the replacement commit: both blank forms unchanged, both completed
forms byte-exact (ce555650... and the EDT-corrected efed7f1f...),
both approved record lines byte-identical to the first application
(1,963 B / 8fb7bbd7... and 2,268 B / 6257d16d...), the category
decisions carried only by the completed forms and this record, the
thirteen labeled retargets, and the second-order verifier-bytes pin
handling inside verify-exlib2g.
