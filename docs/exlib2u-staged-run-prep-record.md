# EXLIB-2U — S4 staged-run package preparation record

Recorded 2026-09-08 (UTC). This milestone AUTHORED AND VALIDATED,
locally and only locally, the one-use S4 staged-run package
docs/exlib2u-staged-run-package.sql. The package is PREPARED — NOT
EXECUTED: no staged run was created anywhere outside the disposable
verification clusters, no seal or delivery act of any kind was
performed or simulated, and the hosted ShredOS database was not
contacted. No hosted contact by Claude occurred at any point.
Executing the package remains a later, separately gated, one-use
hosted act by Joseph/ChatGPT after Codex review — never by Claude.

## 1. What was prepared (the exact bytes)

- Package: docs/exlib2u-staged-run-package.sql, 38,582 bytes,
  sha256
  ceb4964f3537f49ef987e77876c3106917abc3edf2fc9bff3991fb644c90722f
  (the round-1 corrected bytes; the round-0 candidate's package was
  35,139 B, sha256 5f64e1eb..., superseded by section 11), authored
  on the fresh branch exlib2u-s4-staged-run-prep created at
  promoted main 5fd7890233df728167a8a838a329ff14c04f0044 (the
  EXLIB-2Y hosted-application evidence tip, tag
  exlib2y-hosted-application-evidence-stable, object
  cf20360fa94cb1c28b1cd6bf9dbefe4d9dad7692, 86-byte annotation
  byte-verified).
- The package performs the single lawful S4 act of the promoted
  activation design: ONE INSERT creating the staged import run in
  the Design-S4 SELECTED posture (dry_run = false,
  approved_for_delivery = false, sealed_at NULL, revoked_at NULL,
  operational fields NULL, complete product + legal approval
  evidence populated as pre-seal staging values) and TWO INSERTs
  creating its SIX membership rows (three exercise members, three
  alias members). It contains no UPDATE, no DELETE, no seal, no
  revoke, no delivery, and no lifecycle-function call.

## 2. The reserved authority inputs (transcribed, never invented)

Every human value the run row carries is the reserved authority
artifact's, character-for-character:

- Artifact: docs/exlib2v-s4-authority-inputs-form-completed.json,
  3,416 bytes, sha256
  6cf77759f7a8ddf89d32b2fd225bcbe0eddaf09587dcc9d01a657752b9adeeae,
  byte-identical to its promoted blob (any byte change voids the
  package).
- run_key: exlib2u-plank-release1-staged-v1 (32 characters, lawful
  under the schema's 8..200 btrim CHECK; UNIQUE forever; the same
  string a later S5 seal call and the S6 delivery configuration
  would bind).
- Membership: ALL_THREE_IDENTITIES — exercise members Plank, Dead
  bug, Ab wheel rollout plus all three catalog aliases (Front
  plank, Forearm plank, Ab roller rollout) as alias members.
- product_approved_by = legal_approved_by = Joseph Carfagno;
  product_approved_at = legal_approved_at = the authority instant
  2026-09-07T11:05:00-04:00; approval_rationale = the artifact's
  exact staged-validation string, which itself states that it does
  not authorize sealing, production delivery, or enabling the
  delivery flag.

CHRONOLOGY OF THE TWO DECISION FAMILIES: 2026-09-07T11:05:00-04:00
(= 15:05Z) is the AUTHORITY-decision instant — the operator
supplied the run-evidence values on the round-0 authority form,
which every subsequent Codex ruling kept byte-frozen, reserved, and
standing while the snapshot-review forms were corrected and
renewed. The SNAPSHOT approvals are the SEPARATE renewed human
decisions at 2026-09-07T19:06:00-04:00 (= 2026-09-07T23:06:00Z),
applied hosted by the spent EXLIB-2Y package at
2026-09-08T02:17:02Z. The package binds each instant to its own
family — the 11:05 instant appears only in the run-evidence
columns it stages, the 19:06 instant only in the approval-tuple and
event gates it verifies — and its static verifier proves by parse
that the two instants are distinct and never substituted for each
other.

## 3. The derived lawful creation surface (from committed bytes)

Migration 023 REVOKEs ALL on exercise_catalog_import_runs and
exercise_catalog_run_items from PUBLIC, anon, and authenticated and
grants nothing back; no committed function INSERTs into either
table (exlib_approve_and_seal_run only UPDATEs an existing run, and
the migration-027 NOLOGIN roles hold EXECUTE on content-lifecycle
functions only). A direct owner INSERT in the hosted operator
context is therefore the ONLY lawful creation surface. The
exlib_freeze_run_row INSERT branch requires runs to be BORN
unsealed, unapproved, and unrevoked — approval evidence and
dry_run are writable pre-seal staging fields, and the
approval_audit_chk CHECK binds evidence completeness only when
approved_for_delivery becomes true — so the Design-S4 posture is
exactly what the schema admits at INSERT. Membership rows insert
only while the parent run is unsealed (exlib_freeze_run_membership,
parent row locked FOR UPDATE). Members are resolved through their
governed identities only: snapshots by logical_id + is_active =
true (unique under exercise_catalog_one_active_logical_idx),
aliases by (logical_id, alias text). No hosted snapshot, event, or
alias surrogate UUID appears anywhere in the package.

## 4. The staged posture and its two structural proofs

- STRUCTURALLY NON-DELIVERABLE: the postconditions evaluate the
  delivery gate's own five-conjunct predicate (run_key match AND
  approved_for_delivery AND NOT dry_run AND sealed AND unrevoked,
  from the committed deliver_catalog_exercises bytes) and demand
  ZERO matching rows. The package never calls the delivery
  function; the live suite additionally proves the runtime refusal
  by calling it directly (section 6).
- DIRECTLY S5-PROMOTABLE: the postconditions evaluate the seal
  validation's own member query (from the committed
  exlib_freeze_run_row bytes) and demand a NON-EMPTY membership of
  exactly 3 exercise + 3 alias members with ZERO unready exercise
  members. Nothing performs, calls, or simulates the seal: one
  later, separately gated exlib_approve_and_seal_run call is what
  S5 would be.

EXACT ENABLED TRIGGER BINDINGS (round-1): the machinery gate never
asks whether "some non-internal trigger exists" — it demands, for
each of the two freeze triggers, the exact enabled bindings: the
promoted trigger name on the promoted table executing the promoted
function (extracted from the committed migration bytes) over the
promoted BEFORE-ROW event set (tgtype 23 for the run-row trigger,
31 for the membership trigger), tgenabled = 'O', and each the SOLE
non-internal trigger on its table — so a missing, disabled,
decoy-rebound (same name and events, different function),
event-narrowed, or shadow-supplemented trigger all refuse.

ABSOLUTE AUTHORITY BASELINE (round-1): the authority gate never
reduces to role=count — the precondition pins all four catalog-role
memberships as complete tuples (member postgres, grantor
supabase_admin, ADMIN TRUE, INHERIT FALSE, SET FALSE; exactly four
rows in total), the exact reviewed hosted shape the EXLIB-2K/2O
application records preserved — so a count-preserving member,
grantor, or option substitution refuses — and the postcondition
additionally captures-and-compares the WHOLE membership rows
(member, grantor, and every option column) across the gated
interval. The records observed INHERIT/SET hosted, so the option
columns exist on the hosted major version.

ONE-USE GATE PAIR, WITH A SHADOWING DISCLOSURE: the precondition
pins the post-EXLIB-2Y baseline vector 3/3/5/3/6/1/2/2/0/0/3 —
zero runs and zero run items — and separately refuses if the
reserved run key already exists. Because ANY run row moves the runs
count off zero, the run-key gate can never be the first to fire
while the vector gate stands: it is deliberately retained as
shadowed defense-in-depth (it would become operative only if the
vector gate were ever edited), and the live suite's pre-existing-
key variant accordingly proves the refusal at the vector gate. The
postcondition pins 3/3/5/3/6/1/2/2/1/6/3 — the vector moves in
exactly the two run positions and nothing else anywhere; every
snapshot, event, anatomy, alias, claims, content, relationship,
logical, tenant, and authority surface is captured before the act
and demanded digest-identical after it.

## 5. Membership derivation (mechanical)

The six membership rows derive from promoted bytes alone: the three
exercise members are the three decision artifacts' governed logical
identities (docs/exlib2w-*-snapshot-review-form-v2-completed.json,
fingerprints pinned inside the package), resolved live by
logical_id + is_active; the three alias members are the three
aliases the authority artifact's membership constraint names,
resolved live by (logical_id, alias) against the promoted alias
surface, which a precondition first proves is EXACTLY those three
rows. The per-identity gates demand each member still carries the
applied EXLIB-2Y approval tuple (Joseph Carfagno at the 19:06 EDT
instant with each artifact's verbatim rationale) and every governed
field of the decision packet — eleven populated values, the four
NULL provenance fields, catalog_version 1 — so any drift voids the
staging fail-closed.

## 6. Validation performed (all local; measured, not asserted)

- LIVE (scripts/verify-exlib2u-live.sh, disposable socket-only
  cluster; deliberately outside the TS battery like every live
  suite): 100 passed, 0 failed. It proves, on the exact chain-built
  post-2Y pre-state (2K+2O+2P+2Q+2R+2Y executed once each over the
  84-exercise tenant fixture): the happy path (the staged run row
  verbatim, the six members, the vector's exact two-position move,
  snapshots/events/unrelated/tenant/authority all digest-identical,
  plus both strengthened surfaces read back exactly on the real
  post-migration database); the AUTHENTICATED LIVE delivery refusal
  — deliver_catalog_exercises called directly on the DISPOSABLE
  cluster refuses the staged run with the exact committed message
  and zero state change; the structural S5 member-readiness (3/3,
  zero unready) with the run still unapproved and unsealed after
  every probe; ONE-USE (the second execution refuses; nothing
  drifts); a fifteen-variant refusal matrix on fresh template
  copies — pre-existing reserved-key run, drifted approval tuple,
  drifted governed field, missing identity, COUNT-CAMOUFLAGED
  duplicate identity (both unique indexes dropped, the vector fully
  camouflaged including a forged pad event; the package's own
  per-identity gate still fires 'found 2'), tampered event surface
  (count-camouflaged), alias drift, wrong authority, PARTIAL-STAGING
  atomicity (a tampered copy drops one exercise member; the run row
  and five items roll back whole), tampered reserved evidence (a
  tampered copy writes a non-reserved rationale; the postcondition
  refuses), a DISABLED run-row freeze trigger (exists, correct
  binding, tgenabled='D' — the old existence shape would have
  passed), a DECOY-REBOUND membership freeze trigger (same name,
  same event set, enabled, different function — caught by the
  tgfoid binding), and three COUNT-PRESERVING authority
  substitutions (member, admin option, grantor — each leaving the
  per-role count at exactly 1, each refused by the absolute
  baseline pin, and each RESTORED to the exact five-field baseline
  with the restoration asserted; the grantor case is simulated by
  direct shared-catalog surgery because PG16 records any
  superuser-without-ADMIN grant as the bootstrap superuser's, so no
  real GRANT can produce it) — with the staged-nothing / rollback
  proof after every refusal; the two-session race with exactly one
  committer; and the final cluster-wide proof that all four
  authority baselines read byte-identical after every control with
  zero harness roles remaining.
- STATIC (scripts/verify-exlib2u.ts, joins the battery): sixteen
  proofs U1-U16 as described in section 7.
- The package under test in every run above was byte-identical to
  the fingerprint in section 1.

## 7. Verifier lifecycle for this milestone

scripts/verify-exlib2u.ts (new, static, in the battery) proves: the
promoted sources (tag bytes, tree pin, artifact blob identity); the
package labels and fingerprint pins; the statement shape (one run
INSERT, two item INSERTs, nothing else; the eleven-table lock set);
the MECHANICAL authority binding (run key, identities, instants,
rationale — extracted from the artifact bytes, never restated);
the membership derivation and its internal consistency; the
per-identity approval-tuple and governed-field gate binding
(extracted from the decision artifacts); governed-identity-only
resolution (exactly the three logical UUIDs; no hosted surrogate
anywhere); the one-use gate pair; the structural non-deliverability
and S5-promotability shape (including the exact seven-column INSERT
list — no seal, approval-state, operational, or created_at column
is ever written); this record's truthfulness; live-suite presence
and coverage; topology (the round-0 candidate plus the one plain
forward round-1 correction commit, chain and per-commit inventories
both pinned); boundary and hygiene; the two-family chronology; the
exact enabled trigger bindings with names and functions extracted
from the committed migration bytes (U15); and the strengthened
absolute authority baseline verified against the promoted 2K/2O
record bytes, with the old role=count shape proven absent (U16).

## 8. Stale-claim sweep and battery reconciliation

The sweep against a simulated commit built from the intended phase
paths enumerated exactly TWO stale historical checks, both the
recurring completed-phase pattern and both retargeted count-neutral
under the exact label `RETARGET (EXLIB-2U S4 staged-run
preparation)`:

- verify-exlib2y-application A9's HEAD-relative completed-phase
  topology (seventh instance of the pattern), anchored at that
  phase's own promoted tip
  5fd7890233df728167a8a838a329ff14c04f0044;
- verify-exlib2v A2's live no-exlib2u-path census — an
  authoring-time self-census of the 2V reservation phase that this
  milestone's own lawful exlib2u-named artifacts falsify (eighth
  instance; a finished milestone's claim falsified by its
  successor's lawful artifacts) — anchored as a tree census at that
  phase's own promoted tip
  0d4dad415a40c8b4baf042651e3f748f3c8c9f5e; the reserved-branch
  stop-position clause it also carries is unaffected and still
  checked live.

With both in place the simulated-commit battery and the committed
battery both read 96 suites / 7,184 checks / 0 failures — the
promoted baseline 95/7,168 plus exactly this milestone's new
16-check static suite and nothing else.

## 9. What did NOT happen (the boundary)

No staged run exists anywhere outside the disposable clusters: the
hosted runs and run-items tables still read zero, exactly as the
EXLIB-2Y evidence record left them. No seal, no approval flip, no
revocation, no delivery, no delivery-flag or environment change, no
seed, no inventory change, no EXLIB-2S act, no quarantine change.
No hosted contact by Claude at any point; the hosted execution of
this package, when and if authorized after Codex review, follows
the standing rule — executed hosted exactly once by Joseph/ChatGPT
under its own explicit one-use instruction, with S5 sealing a
further separately gated instruction after that.

## 10. Stop condition

This milestone stops LOCAL-ONLY on its branch for Codex review. Not
pushed, not promoted, not tagged; the reserved authority artifact
and the three decision artifacts byte-untouched; the spent EXLIB-2Y
package byte-untouched.

## 11. Round-1 correction (Codex verdict applied)

Codex reviewed the round-0 candidate
04654173f1cf393177b857966aa5e30560001285 and did NOT approve it,
with this correction verdict: replace the loose "some non-internal
trigger exists" checks with exact, enabled trigger bindings for the
run-row and membership freeze triggers; strengthen the authority
proof beyond role=count so a count-preserving member, grantor, or
option substitution cannot pass; add the corresponding live
negative controls; update the record, static verifier, live
verifier, and topology proof in one plain forward correction
commit; keep everything local-only with a corrected
reconstruction-proven bundle. No publication, promotion, tag, or
execution of the round-0 candidate occurred, and no authorization
was consumed.

Applied, all in ONE plain forward correction commit over the
round-0 candidate (four files: the package, this record, the static
verifier, the live suite; the two round-0 retargets untouched):

- The machinery gate now demands the exact enabled bindings
  described in section 4 (trigger name + table + function + event
  set extracted from migration 023's bytes, tgenabled='O', sole
  non-internal trigger per table). The trigger event-set masks
  (tgtype 23 and 31) were MEASURED on a scratch cluster before
  being pinned, not derived on paper.
- The authority proof now pins the absolute four-role baseline
  (member, grantor, and all three option columns, quoted from the
  promoted EXLIB-2K/2O hosted application records) and
  captures-and-compares whole membership rows across the gated
  interval; the role=count shape is gone from the package entirely.
- Five live negative controls were added (F11-F15; section 6) plus
  the happy-path strengthened-surface readback (D16) and the final
  cluster-wide restoration proof (H2). A finding worth preserving:
  PG16 records any superuser-without-ADMIN grant as the bootstrap
  superuser's, so a REAL count-preserving grantor substitution
  cannot be produced through GRANT — the first F15 attempt
  reproduced the baseline exactly and the package rightly
  succeeded; the control therefore simulates the substitution by
  direct shared-catalog surgery, the same corruption-simulation
  precedent as the dropped unique indexes.
- The static verifier gained U15/U16 and the two-commit topology
  proof (U12); every measured total in this record was re-measured
  after the correction.
