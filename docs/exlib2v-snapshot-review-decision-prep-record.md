# EXLIB-2V — hosted snapshot-review decision preparation record

Recorded 2026-09-07 (UTC). LOCAL-ONLY milestone, DOCUMENTS AND
VERIFIER ONLY: this phase prepares the HUMAN-DECISION packets the S4
prerequisite requires — three hosted snapshot-review forms and one
S4 authority-inputs form — plus this record and a dedicated static
verifier. It contains NO SQL execution package, NO database
mutation of any kind, NO hosted contact, applies NO review, creates
NO review event, creates NO run, approves and seals NOTHING, calls
NO delivery function, configures NO flag or run key, edits NO seed
or inventory, and changes NOTHING about EXLIB-2S or the reserved
empty EXLIB-2U branch. Nothing here is approved by its own
existence; every decision field is null and blank NEVER reads as
approval.

## 1. Authoritative source and the preserved S4 stop

- Promoted source: main = origin/main =
  fc3e6cce5afcf03f0552d65a2de7e7c796646a25 (tree
  6a27b94167884d6fefb4555028257ccf40413738), carrying the annotated
  S3 tag exlib2t-delivery-runtime-s3-deployed-flag-off (tag object
  ef570b3c9834e346f80c14ca65fe3efbf4486ca9, peels to the source
  commit; 75-byte annotation, byte-verified). S3 is complete: the
  delivery runtime is deployed to production BEHIND THE OFF FLAG
  (both delivery variables absent from every hosted scope per the
  operator's verified evidence), so the runtime is behaviorally
  inert and every initialization still runs the seed path.
- The EXLIB-2U staged-run preparation stopped FAIL-CLOSED at its
  Part 2 (the design/instruction/hosted-state contradiction) and its
  branch exlib2u-staged-run-prep is PRESERVED EMPTY at the same
  promoted commit (zero commits over main). Codex accepted the stop
  and chose Option A with a tightening: complete the prerequisite
  snapshot-review chain first, and NEVER reuse the EXLIB-2N or
  EXLIB-2I decisions across reviewed-object classes without
  byte-level proof of equivalence.
- Hosted snapshot-review application evidence does NOT yet exist
  (no such record, no such tag; the EXLIB-2R application record's
  post-publication eleven-table vector 3/3/5/3/6/1/2/2/0/0/0 pins
  exercise_catalog_review_events = 0).

## 2. Naming derivation (mechanical)

The EXLIB-2 series mechanically enumerates a through u across tags,
branches, and tracked paths (2s exists only as the parked
exlib2s-plank-delivery-activation-prep branch; 2u only as the
reserved empty staged-run branch). exlib2v appears NOWHERE (tracked
paths, local tags, local branches, fresh remote refs), so EXLIB-2V
is the correct unused continuation, and EXLIB-2U remains reserved
for the staged-run preparation itself. Disclosed non-conflict: an
OLD phase-2 app-series tag phase2u-cardio-timed-progression-stable
exists in the separate phase2X namespace; it collides with nothing
in the exlib2X series.

## 3. The snapshot-review contract (derived from promoted bytes)

From migration 023 (schema, grants) and migration 027 (the
OPERATIVE, replaced exlib_freeze_catalog_snapshot trigger function):

- THE TRANSITION SURFACE: there is NO dedicated snapshot-review
  function and NO role grant reaching public.exercise_catalog
  (023 section 11 revokes ALL from PUBLIC/anon/authenticated and
  grants nothing back; the four 027 NOLOGIN roles hold EXECUTE on
  content-lifecycle functions only — load, content review,
  admission, publication). The lawful act is ONE direct privileged
  UPDATE in the hosted operator context setting review_status AND
  the complete audit tuple (reviewed_by, reviewed_at,
  review_rationale) in the SAME statement.
- THE TRIGGER ENFORCES THE MACHINE ON EVERY WRITE PATH: snapshots
  are born pending/active with NULL audit fields; the
  identity/content field set (logical_id, canonical_name, category,
  primary_muscle, equipment, laterality, tracking_mode, source_url,
  source_page, retrieved_at, import_confidence, provenance,
  movement_pattern, training_role, difficulty, availability,
  catalog_version, created_at) is IMMUTABLE — corrections require a
  NEW catalog version row; allowed status transitions are
  pending -> approved|revised|rejected and
  approved -> revised|rejected, with revised/rejected TERMINAL and
  no path back to pending; EVERY transition demands a complete,
  non-blank, FRESH audit tuple (evidence reuse and status-only
  flips fail); audit fields can never change without an allowed
  transition; the trigger itself appends the immutable
  exercise_catalog_review_events row (hence that table's guard
  accepting inserts only at trigger depth >= 2); snapshot
  reactivation is forbidden outright.
- EVENT-ROW BEHAVIOR: one exercise_catalog_review_events row per
  transition (catalog_id, from_status, to_status, and the fresh
  tuple), append-only forever.
- ONE-WAY / ONE-USE: the status machine plus the fresh-tuple rule;
  a rejected or revised row can never be re-approved — delivering
  corrected content requires a new catalog version row and its own
  review.
- SEAL SCOPE (what actually blocks S4/S5): the run-seal validation
  demands only that the RUN'S MEMBERS are approved, active, and
  fully review-audited (and membership non-empty). Snapshots
  outside the membership never block sealing.
- WHAT THE HUMAN DECISION GOVERNS: exactly the frozen snapshot row
  content enumerated above. The transition writes ONLY
  review_status plus the fresh audit tuple. Anatomy, aliases, name
  claims, and expected/projected relationships are separate
  surfaces under their own freeze triggers and contracts; the
  review transition does not read or write them, so the forms
  display them only as an explicit not-governed scope statement.
  (Delivery-time context, not review scope: migration 026
  additionally pins the Plank MEMBER's anatomy multiset inside
  deliver_catalog_exercises.)

## 4. Reuse evaluation of the existing human decisions

Per the Codex tightening, each existing decision was evaluated
independently against the hosted snapshot row's reviewed-object
class and governed field set. Classifications:

- A. Dead bug — NOT REUSABLE. The EXLIB-2N completed decision's own
  bytes bind it to the AUTHORED ARTIFACT: its voiding rule names
  docs/exlib2c-release1-batch02-content.jsonl record line 12 (file
  and record-line SHA-256 fingerprints), its gate_effect,
  loading_effect, and import_eligible_effect all read none, and its
  no-effect statement says a filled approved form changes nothing
  hosted. The EXLIB-2N review-decision application record states
  the decisions were applied to "the two authored exercise
  records' schema-defined content_review fields" — the authored
  records, not any hosted row — and the EXLIB-2O load record shows
  the hosted Dead bug snapshot was loaded LATER, born pending with
  every reviewer field null. Different reviewed-object class,
  different governed field set; reuse fails the tightening's proof
  requirement.
- B. Ab wheel rollout — NOT REUSABLE, by the same independent proof
  shape on its own completed form (authored-artifact voiding rule,
  none-effects, no-effect statement) and the same application-record
  and load-record statements.
- C. Plank — NOT REUSABLE. The EXLIB-2I decision record states the
  decision belongs to the content lifecycle ("no catalog snapshot"
  is involved), and the EXLIB-2P hosted application record shows
  the applied fields were content_status / reviewed_by /
  reviewed_at / review_rationale on the exercise_catalog_content
  row while the SNAPSHOT stayed pending with NULL reviewer fields
  and exercise_catalog_review_events stayed 0. Content row and
  snapshot row are different reviewed-object classes; equivalence
  is not proven anywhere; reuse is refused.

No classification was AMBIGUOUS: every existing decision carries
explicit self-scoping bytes, so each classifies cleanly as NOT
REUSABLE for the hosted snapshot review. Consequently ALL THREE
snapshots require new snapshot-scoped human decisions, and this
milestone prepares all three forms. No hosted contact was made or
needed for these classifications.

## 5. The three snapshot-review forms (prepared blank)

docs/exlib2v-plank-snapshot-review-form.json,
docs/exlib2v-dead-bug-snapshot-review-form.json, and
docs/exlib2v-ab-wheel-rollout-snapshot-review-form.json each
present: the reviewed-object class (the hosted snapshot ROW,
explicitly distinguished from the 2N and 2I object classes); the
intended logical UUID (a promoted package literal); the hosted
snapshot UUID exactly as promoted evidence preserves it (Dead bug
1ce09c1f-c13d-4231-8e12-6f35cfd761b5 and Ab wheel rollout
c715d840-944b-4019-b984-1687accffcf4 from the EXLIB-2O application
record; for Plank the hosted surrogate was never preserved, the
form says so, and the later application package must resolve the
row by logical_id + is_active under the one-active-row-per-logical
unique index); EVERY governed snapshot field verbatim with its
source (dollar-quoted load-package literals; NULL source fields
lawful under 027's conditional provenance CHECK for
forgefitos_original; schema defaults; created_at marked as a
hosted-generated fact promoted evidence does not preserve); the
category and discovery posture (category, movement_pattern,
training_role, difficulty, availability, provenance — all governed
row fields); the explicit not-governed scope statement (anatomy,
aliases, claims, expected/projected relationships); the current
pending/NULL-audit state with record citations; the derived review
contract; the proposed transition with explicit APPROVE / REJECT /
CORRECT semantics mapped to the trigger's machine (approve ->
approved; reject -> rejected, terminal; correct -> revised,
terminal, with the correction requiring a NEW catalog version row);
completely NULL human fields (decision, reviewer, credential,
timestamp, rationale, evidence); the applicable
prior-decision-not-reused classification; the no-effect,
preparer-boundary, and byte-change-voiding statements; and git
blob-SHA fingerprints (at the promoted source commit) of every
promoted file the form displays values from. NOTHING is
preselected; NO reviewer, timestamp, or rationale exists anywhere
in the forms.

## 6. The S4 authority-inputs form and the membership consequences

docs/exlib2v-s4-authority-inputs-form.json requests, with all
values null: the product approver identity (+ timestamp), the legal
approver identity (+ timestamp), the approval rationale, the stable
run-key literal (8-200 characters after btrim, permanently UNIQUE,
later bound by the S5 seal call and the S6 runtime delivery
configuration), and the run membership choice.

MEMBERSHIP CONSEQUENCES, derived from the delivery/seal/relationship
bytes (the choice itself is a human product decision — the schema
and the promoted design do NOT determine it unambiguously, so no
recommendation is made):

- PLANK_ONLY (exercise member: the Plank snapshot; alias members:
  Front plank, Forearm plank):
  - Seal gate: ONLY the Plank snapshot must be approved, active,
    and fully review-audited for the S5 seal; the two target
    snapshots' review state would not block sealing (they would,
    however, remain undeliverable content).
  - Delivery: each user receives the timed Plank (fresh insert,
    P2 in-place correction of a pristine bodyweight seed, or the
    distinguished/collision dispositions) plus the two Plank
    aliases; eligible = 1 per delivery summary.
  - Relationships: the two projected catalog-level rows
    (progression -> Ab wheel rollout, substitution -> Dead bug)
    keep existing; run scoping means content bound to another (or
    no) run is invisible to this run, so no tenant receives Ab
    wheel rollout or Dead bug exercises from this run — any
    tenant-level resolution of those relationship targets finds no
    tenant exercise until some FUTURE run delivers them.
- ALL_THREE_IDENTITIES (exercise members: Plank, Dead bug, Ab wheel
  rollout; alias members: Front plank, Forearm plank, Ab roller
  rollout):
  - Seal gate: all three snapshots must be approved, active, and
    fully review-audited at the seal (the trigger counts unready
    members and fails the transition otherwise) — all three forms
    in this milestone must come back APPROVED and be applied before
    S5 could seal such a run.
  - Delivery: each user receives all three exercises (Dead bug
    bodyweight-tracked, Ab wheel rollout weight_reps-tracked, Plank
    timed with its reconciliation dispositions) and all three
    aliases; eligible = 3.
  - Relationships: both projected relationship targets then exist
    as tenant exercises for delivered users, making the
    catalog-level relationships resolvable tenant-side.
- Either way: the staged S4 run remains structurally non-deliverable
  until the separate S5 approval/seal transition, and the S3
  deployed runtime remains inert until the separate S6 flag event.

## 7. Verifier lifecycle for this milestone

scripts/verify-exlib2v.ts (new, static, LOCAL-ONLY) proves: the
promoted source and preserved-stop posture (source refs; the S3 tag
annotation bytes; the reserved EXLIB-2U branch empty at the source
commit when present locally); the naming derivation (no exlib2v
artifact predates this phase; the phase2u tag belongs to the other
namespace); that every governed value displayed by the three forms
re-derives from the promoted bytes (the load-package dollar-quoted
literals parsed mechanically from the packages at the source
commit; the preserved hosted snapshot UUIDs equal the 2O record's
strings; the Plank form preserves NO hosted surrogate); that the
review-contract statements match the operative 027 trigger bytes
(transition sets, fresh-tuple rule, event insert, immutable field
list); that the reuse classifications' quoted evidence exists
byte-for-byte in the promoted artifacts (the 2N forms' voiding
rules and none-effects, the 2N application record's
authored-records sentence, the 2I no-catalog-snapshot line, the 2P
content-row scope and zero-events vector); that NO approval is
preselected and NO identity, timestamp, rationale, run key, or
membership choice is fabricated (every human field in all four
forms is null); that the phase contains NO SQL package and NO
database-mutation surface (all six phase paths are documents or
the verifier; none is .sql; no transaction, table-locking, role-
switching, or statement-head package markers appear in any of
them);
that the S3/S4 boundary is stated truthfully (S3 tag bytes; the
zero-runs hosted pins quoted from the 2P/2R records); phase
topology (ONE plain commit: exactly SIX added paths plus the TWO
labeled retargeted suites as modifications); and hygiene (no
hosted endpoint or credential material; ASCII-only forms; record
non-ASCII limited to the em-dash).

## 8. Stale-claim sweep and battery reconciliation

The full historical battery was swept against a temporary
never-referenced simulated commit carrying this phase. The stale
set was enumerated MECHANICALLY: exactly THREE checks across TWO
suites failed; nothing else did. Each received the smallest
strength-preserving, count-neutral retarget under the exact label
`RETARGET (EXLIB-2V snapshot-review decision preparation)`:

- verify-exlib1c0b D2 (the byte-frozen schema-vocabulary impact
  audit's must-be-named suite census): this phase's new suite
  carries a vocabulary literal because it compares
  promoted-byte-anchored load-package values against the blank
  review forms — both sides anchored at the promoted tip, so a
  future vocabulary change cannot stale it — and, post-dating the
  frozen audit, it is excluded from the must-be-named set BY NAME,
  exactly the precedent the suite already carried for the
  EXLIB-1C0B3 implementation suites.
- verify-exlib2t E1 and E2 (the completed S3 runtime phase's
  HEAD-relative topology and inventory): that phase is finished —
  reviewed twice, accepted, promoted, production-deployed, and
  tagged — so its three-commit topology and twenty-three-path
  inventory claims are now ANCHORED at the phase's own promoted tip
  fc3e6cce5afcf03f0552d65a2de7e7c796646a25, where they held and
  hold forever; the HEAD-relative form goes stale the moment ANY
  successor phase commits, and this is the first successor.

Assertion strength is unchanged everywhere, and the retargets are
count-neutral: with them in place the simulated-commit battery and
the committed battery both read 91 suites / 7,111 checks /
0 failures — the promoted baseline 90/7,092 plus exactly this
milestone's new 19-check static suite and nothing else.

## 9. Stop condition

This milestone stops LOCAL-ONLY on its branch for Codex review and
the HUMAN decisions (three snapshot reviews + four S4 authority
inputs). Not pushed, not promoted, not tagged, not merged, not
deployed. No Supabase or Vercel contact; no snapshot review
applied; no review event created; no run created; no approval or
seal; no delivery call; no flag or run-key configuration; no seed
or inventory edit; no EXLIB-2S change; and the reserved EXLIB-2U
branch remains empty and untouched. After the human decisions come
back, the NEXT milestones (each separately instructed) are: the
snapshot-review APPLICATION package (prepare, review, hosted
execution by Joseph/ChatGPT, evidence), then the EXLIB-2U
staged-run S4 preparation resumes on its reserved branch.
