# EXLIB-2I — Plank human-review decision recorded and applied

Recorded 2026-09-01 (UTC). LOCAL-ONLY milestone: the completed human
review of the Plank instructional content is preserved as evidence
and its APPROVED decision is applied to the content record's
schema-defined review fields — nothing else. ChatGPT and Claude did
NOT perform, influence, or fabricate the human review; Claude is
only recording the supplied human decision. This approval changes
neither import eligibility nor publication nor hosted catalog state.

## 1. The human review (supplied facts, recorded verbatim)

- Decision: approved
- Reviewer: Nick Tkacz — a named human reviewer.
- Reviewer role/credential: Personal Trainer — exactly as stated;
  Joseph has operator-validated Nick Tkacz's stated role as
  Personal Trainer. Nothing was inferred, embellished, renamed, or
  added.
- Reviewed at: 2026-09-01T20:35:00-04:00 (a valid offset
  date-time).
- Evidence: null — accepted; the derived contract makes supporting
  evidence optional and never a substitute for the required fields.
- Rationale: "Everything looks correct" (24 characters, non-blank,
  meets the >= 10 contract).
- All seven needs_human_judgment_confirmations: true
  (aliases_are_true_synonyms,
  difficulty_and_availability_defensible,
  instruction_coaching_quality, easier_alternatives_appropriate,
  safety_adequacy, dead_bug_substitution_reasonable,
  ab_wheel_rollout_progression_reasonable).

## 2. Evidence lifecycle (fingerprints)

- Reviewed source content (what Nick Tkacz reviewed): the promoted
  Plank record at main = e6a98f2ccc531ca3976e91c53b9f30b09f8ae193
  (EXLIB-2H tag object 3a8a1a2769c136962add7d1d877a4672a7e80292),
  exactly 2,729 bytes, SHA-256
  a8cb6a5ed54bfa20f296d0624ccd29b20936f1f5b1c48ae201c4c44c2914a30a
  — the completed form pins this same fingerprint, so the decision
  binds to exactly those bytes.
- Completed form (permanent evidence):
  docs/exlib2h-plank-content-review-form-completed.json, exactly
  2,389 bytes, SHA-256
  59ad2668790b6d0b135c8c453a702c45774f905ece8749a6112881b1df7e5b98,
  copied byte-exact from the operator-supplied file. It differs
  from the promoted blank form ONLY in the authorized review fields
  (decision, reviewer, reviewer_role_or_credential, reviewed_at,
  rationale, and the seven confirmations; evidence stayed null);
  every protected legal/no-effect statement is byte-exact from the
  blank form.
- Historical blank form: docs/exlib2h-plank-content-review-form.json
  is retained UNCHANGED (2,316 bytes, SHA-256 42215b1d...) as the
  promoted evidence that the review was prepared unfilled.
- Updated content record: docs/exlib2g-plank-content.jsonl is now
  2,848 bytes, SHA-256
  4191659387d0d42303feb486b0dd7d7a1a72407d5c97b492db062350033a68fe.

## 3. Exactly what changed in the content record

Only the schema-defined review-decision surface:

- content_review.status: "pending" -> "approved"
- content_review.reviewer: null -> "Nick Tkacz"
- content_review.reviewed_at: null -> "2026-09-01T20:35:00-04:00"
- content_review.rationale: null -> "Everything looks correct"
- The artifact's leading status comment line was updated so the
  file does not contradict itself: it no longer says "AUTHORED
  PENDING REVIEW"/"no approval ... expressed or implied" and now
  truthfully names the approval while restating that
  import_eligible stays false and that publication, loading, and
  delivery remain separately gated. This is disclosed here
  explicitly; it is commentary, not a schema field.

Everything else is byte-identical within the record line:
instructional content, anatomy, identity, aliases, relationships,
classification, safety language, provenance, authored_by (its
"pending human specialist review" phrase is an authorship-time
declaration and stays frozen), authored_at, review_status
(still "proposed" — the pipeline axis is distinct by schema
declaration and is not required to transition together),
import_eligible (still the literal false), deferred/deferred_reason,
and the absence of any publication key. The schema represents the
decision without any invented mapping: the reviewer role lives in
the completed form and this record because content_review has no
role field (additionalProperties: false), exactly per the derived
contract.

## 4. What this approval does NOT do (fail-closed lifecycle)

Approval alone authorizes NOTHING further: import_eligible remains
false (flipping it is a later, separately approved act on an exact
fingerprinted payload — validator rule R6); publication remains a
separate database-side lifecycle; no catalog snapshot, load
payload, run, seal, or delivery exists or is authorized; the seed
and inventory are byte-unchanged and seed_link_compatible remains
false; no runtime, migration (still 001-026, no 027), ledger,
eligibility, API, UI, dependency, or configuration change exists;
and no hosted service was contacted in this milestone.

## 5. Verifier lifecycle

- scripts/verify-exlib2i.ts (new) owns the decided-state posture:
  it proves the completed-form fingerprint and its exact diff
  against the blank form, the applied review fields, the
  otherwise-identical record, and every boundary above.
- Historical verifiers that pinned the live pending-review state
  are retargeted narrowly under the label
  `RETARGET (EXLIB-2I human review decision)`: their
  pending-review and content-byte claims are anchored to the
  promoted tips where they were true (EXLIB-2G's at
  b9af2a40607c23ee57c04cdbdb9581b01a4f4f9a, EXLIB-2H's at
  e6a98f2ccc531ca3976e91c53b9f30b09f8ae193) via git blob reads —
  the historical claims are preserved exactly, never weakened, and
  the live decided-state claims move to verify-exlib2i.ts.
