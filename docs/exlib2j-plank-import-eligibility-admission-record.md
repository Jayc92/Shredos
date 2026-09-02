# EXLIB-2J — Plank R6 import-eligibility admission

Recorded 2026-09-02 (UTC). LOCAL-ONLY eligibility milestone: the
single human-approved Plank content record is admitted as
import-eligible under the R6 contract, bound to its exact
fingerprinted payload. This admission authorizes NO catalog
snapshot, NO load package, NO loading, NO publication, NO delivery,
NO runtime activation, NO hosted contact, NO seed edit, and NO
seed_link_compatible flip.

## 1. The authoritative R6 contract (committed bytes)

- Validator rule R6, verbatim from
  docs/exlib2c-authoring-schema.json (x_mandatory_validator_rules):
  "R6: no record in any EXLIB-2C authoring batch may carry
  import_eligible true; the validator hard-fails the batch if the
  key is not literal false."
- The import_eligible property, verbatim: {"const": false,
  "$comment": "Locked false for the entire authoring milestone;
  flipping to true is a later, separately approved EXLIB-2F act on
  an exact fingerprinted payload."} — HONEST LABEL NOTE: the
  schema's "EXLIB-2F" phase label was written before the phase
  sequence was renumbered; the migration-026 program consumed the
  EXLIB-2F name, and the act the schema describes is THIS milestone
  (EXLIB-2J). The contract's substance is unambiguous: later than
  authoring, separately approved, on an exact fingerprinted
  payload.
- The promoted review contract (docs/
  exlib2h-plank-content-review-packet.md section 2, item 7):
  import_eligible "may become true ONLY through a later, separately
  approved act on an exact fingerprinted payload (schema
  const-false comment; validator rule R6). A content approval alone
  NEVER flips it."

Scope determination: R6's prohibition is scoped to "any EXLIB-2C
authoring batch"; the Plank record lives in
docs/exlib2g-plank-content.jsonl, not in an EXLIB-2C batch, and the
six promoted batch files remain byte-frozen with every record
import_eligible=false — R6's batch prohibition is untouched. The
admitted record intentionally departs from the AUTHORING-milestone
lock (const false) by exactly this one field, exactly as the
schema's own lifecycle comment prescribes.

## 2. R6 prerequisites and their committed evidence

1. LATER THAN AUTHORING: the authoring milestone (EXLIB-2G,
   promoted b9af2a4) and its review preparation (EXLIB-2H, e6a98f2)
   are closed and tagged.
2. SEPARATELY APPROVED ACT: the human content approval (EXLIB-2I,
   promoted 73231e9, tag object 9bf4f0c7...) is a DIFFERENT act
   from this admission — approval alone never flips eligibility,
   and this admission is its own operator-instructed, separately
   Codex-reviewed milestone.
3. EXACT FINGERPRINTED PAYLOAD: the payload being admitted is the
   human-approved content at EXACTLY 2,848 bytes, SHA-256
   4191659387d0d42303feb486b0dd7d7a1a72407d5c97b492db062350033a68fe
   (the promoted EXLIB-2I bytes), reconfirmed byte-for-byte
   immediately before the transition.
4. HUMAN APPROVAL PRESENT: content_review.status=approved with all
   evidence — reviewer Nick Tkacz, role Personal Trainer
   (operator-validated; recorded without embellishment), reviewed_at
   2026-09-01T20:35:00-04:00, rationale "Everything looks correct",
   evidence null (optional), all seven
   needs_human_judgment_confirmations true — preserved in the
   byte-frozen completed form (2,389 B / 59ad2668...) and decision
   record (5,738 B / 3df13266...).

Authority determination: import eligibility for this act belongs to
the CONTENT artifact's own import_eligible field — the field R6 and
the schema comment govern, the field the review contract describes,
and the field a future load package will read. No other
authoritative artifact requires a change for R6 consistency: the
release-1 inventory (byte-frozen at d349110f...) records
import_eligible=false as a PLANNING-TIME fact from before any
content existed, exactly as it records seed_link_compatible=false
pending its own separately gated act; it is promoted frozen history,
not a live eligibility ledger, and editing it is forbidden in this
milestone. The 26 legacy candidates' import_eligible=false
(exlib1c0a) is a different, untouched population.

## 3. The precise authorized transition

- Field-level change: import_eligible: false -> true on the single
  Plank record in docs/exlib2g-plank-content.jsonl. Nothing else in
  the record changed: content_review (approved, Nick Tkacz,
  2026-09-01T20:35:00-04:00, "Everything looks correct") preserved
  exactly; review_status remains "proposed" — the schema
  mechanically requires no coupled transition and none was
  inferred; every instructional, identity, anatomy, relationship,
  classification, safety, provenance, and human-review value is
  value-identical; no publication field exists.
- The artifact's leading comment line: only the directly stale
  clause was revised (it said "import_eligible=false"; it now
  truthfully states the admission and its fingerprint binding).
  Disclosed here explicitly; commentary, not a schema field.
- Resulting content fingerprint: 2,928 bytes, SHA-256
  d82078490efa9ef13e128e7b7b742fbda8ea9e74e32382252d96c326c679d752.

## 4. Binding and invalidation

This eligibility admission applies ONLY to the exact resulting
fingerprint above, whose record body differs from the reviewed and
approved payload (2,848 B / 41916593...) in exactly the
import_eligible field plus the disclosed comment clause. ANY later
change to the content bytes INVALIDATES this admission: a changed
record is a new payload that requires human review (or re-review)
and a new, separately approved eligibility admission before it can
be treated as import-eligible.

## 5. Explicit separations (unchanged by this admission)

- Human content approval: already decided (EXLIB-2I); untouched.
- Import eligibility: THIS milestone; now true for this exact
  payload only.
- review_status: an independent authoring-pipeline axis; remains
  "proposed"; governed separately.
- seed_link_compatible: remains false; flips only in the
  coordinated activation release (EXLIB-2G design, S7).
- Catalog loading: NOT authorized; no load package or payload
  exists; loading requires its own reviewed milestone and the
  non-deliverable staged posture.
- Publication: a separate database-side lifecycle; no publication
  key exists anywhere in the authoring record.
- Delivery activation: NOT authorized; the protected
  approve-and-seal event and the runtime path remain fully gated.
- Hosted state: no hosted service was contacted in this milestone;
  nothing hosted changed.
- Seed, inventory, historical review ledger, legacy-candidate
  eligibility, migrations (still exactly 001-026, no 027), runtime,
  APIs, UI, dependencies, configuration: all byte-unchanged.
