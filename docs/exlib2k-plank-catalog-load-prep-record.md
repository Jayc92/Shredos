# EXLIB-2K — Plank catalog-load preparation record

Recorded 2026-09-02 (UTC). LOCAL-ONLY load-preparation milestone:
this phase prepares and validates the exact Plank loading package and
DOES NOT execute it against hosted Supabase, and does not execute any
hosted loader, reviewer, admission, publication, run, seal,
revocation, or delivery authority. The package is PREPARED — NOT
EXECUTED; its only eventual target is the ShredOS Supabase project
ttybyljytiwntvorugcv, under a later explicit operator instruction
through the authorized Joseph/ChatGPT path. No hosted service was
contacted in this phase. This record APPROVES NOTHING; it awaits
Codex review.

Correction (2026-09-02, this same pre-review phase, one plain
forward commit; commit 2d00f57b649f3025470f3095ce832b8fa247f42f is
preserved unrewritten): three Codex findings are applied. (1) The
fresh-load gate is LOCK-SERIALIZED - the transaction acquires SHARE
ROW EXCLUSIVE locks on all ten gate tables (one statement, documented
alphabetical order) BEFORE the empty-state read, so two concurrent
executions can never both pass the gate. (2) The three catalog name
claims are now part of the package's OWN fail-closed postconditions
(exactly three rows plus migration-023's bidirectional claim
invariant), and an earlier trailing-comment description that
miscounted the result as "two catalog name/alias claims machinery
entries" is corrected - the true result is THREE claim rows: one
canonical plus two aliases. (3) Intended vs database-proven target
identity is stated precisely below, with database review, admission,
and publication of Plank blocked until a fail-closed target-snapshot
gate exists.

## 1. Source gate (all exact, after a fresh fetch)

- main = origin/main = 3a1ac3b0bf2706ae9d1d03cc55a443b8bd4a1876,
  tree 36f43034b1efa111cfaf2854acd3c06bc416b750;
- annotated tag exlib2m-migration-027-application-evidence-stable,
  tag object 8a4ee8a8395e21aabe2ccc7bc2138ddb5eafe280, peeling
  exactly to main;
- clean worktree/index/stash; migrations exactly 001-027 with no
  028; migration 027 exactly 65,455 B / 90d53aaf8fd341dd99bab22b7d1c
  a280ec24b8ccee2a28efca6e835e0585a14f (applied to hosted and
  evidenced; unchanged);
- migration-027 application-evidence verifier 13/0; complete battery
  75 suites / 6,721 / 0; production build and tsc clean; no hosted
  contact.
- Work branch: exlib2k-plank-catalog-load-prep.

## 2. The authoritative source artifact (preserved exactly)

docs/exlib2g-plank-content.jsonl at exactly 2,928 bytes, SHA-256
d82078490efa9ef13e128e7b7b742fbda8ea9e74e32382252d96c326c679d752 —
byte-identical throughout this phase. Preserved facts: human
approval by Nick Tkacz / Personal Trainer (2026-09-01T20:35:00-04:00,
"Everything looks correct"); content_review.status approved;
import_eligible = true (the consumed EXLIB-2J R6 admission);
review_status = "proposed" (an authoring-pipeline axis; the DATABASE
version is born 'pending' by the 027 birth contract, and this
package performs no review transition); NO publication state exists
in the artifact; the inventory's Plank seed_link_compatible remains
false; the seed remains the old bodyweight definition. Nothing in
this phase rewrites, weakens, or re-reviews any of it.

## 3. Fail-closed loader-contract derivation (field by field)

Loader surface (migration 027, the only authority this package
uses): load_catalog_identity(uuid),
load_catalog_snapshot(18 parameters),
load_catalog_content_draft(13 parameters) — all granted exclusively
to exlib_catalog_loader.

VERBATIM from the admitted artifact (no transformation):
| Loader input | Artifact field |
|---|---|
| canonical_name 'Plank' | proposed_canonical_name |
| primary_muscle 'abs' | primary_muscle |
| equipment 'bodyweight' | equipment |
| laterality 'bilateral' | laterality |
| tracking_mode 'timed' | tracking_mode (2D: "The catalog Plank KEEPS tracking_mode=timed") |
| provenance 'forgefitos_original' | provenance (sources therefore NULL, per the 027 conditional constraint) |
| movement_pattern 'core_anti_extension' | movement_pattern |
| training_role 'core' | training_role |
| difficulty 'beginner' | difficulty |
| availability 'minimal' | availability |
| anatomy [{obliques,secondary},{lower_back,tertiary}] | muscle_targets (also pinned verbatim in the promoted 2D record) |
| aliases ["Front plank","Forearm plank"] | aliases |
| authored_by / authored_at | authored_by / authored_at |
| setup_steps, execution_steps, breathing_cue, common_mistakes, safety_guidance, equipment_setup (empty string, not NULL), accessibility_alternative | the seven authored payload fields, byte-preserved |
| expected substitution target name "Dead bug" | substitutions[0] |
| expected progression target name "Ab wheel rollout" | progressions[0] |
| (no regression rows) | regressions = [] |

The inventory row for Plank corroborates every classification field
identically (movement_pattern, training_role, difficulty,
availability, primary_muscle, equipment, laterality, tracking_mode).

DERIVED BY COMMITTED CONTRACT (disclosed for adjudication — the one
field with no verbatim source): snapshot category = 'isolation'.
Neither the artifact nor the inventory carries a catalog category
(the inventory's exercise_type_derived = "mobility" is the TENANT
exercises.exercise_type value used by 026's link contract, a
different column and axis). The derivation chain, every link
committed bytes: (1) the seed module's Plank row declares
category: "isolation" (src/lib/supabase/seed-exercises.ts line 76);
(2) the promoted 2D record's pristine-seed predicate pins
category='isolation' for the linkable Plank row; (3) APPLIED
migration 026 gates its Plank link path on
v_seed.category = 'isolation' and deliberately leaves the linked
row's category UNTOUCHED, while its fresh-delivery paths copy
v_cat.category (the CATALOG category) into newly delivered rows;
(4) 2D's principle "the linked row never disagrees with its catalog
snapshot". 'isolation' is therefore the unique value under which
both applied delivery paths produce the same product state;
'mobility' is uniquely EXCLUDED because 2D derives
exercise_type='mobility' as a separate field while preserving
category='isolation' on the same row. This is a derivation from the
promoted contract, not from general exercise knowledge.

DETERMINISTIC BY CONSTRUCTION: content_version = 1 (the first
version under a fresh identity); the four predeclared UUIDs (Plank
identity e21b2c00-...-0001, Dead bug identity ...-0002, Ab wheel
rollout identity ...-0003, Plank content v1 ...-0101) — no committed
UUIDs can exist for a not-yet-loaded catalog, so the package
declares them deterministically and this record documents them.

RELATIONSHIP-TARGET DETERMINATION: Plank requires exactly
substitution -> Dead bug and progression -> Ab wheel rollout
(artifact-verbatim; neither weakened nor deleted). Both names exist
in the promoted release-1 inventory. Migration 027's relationship
model keys expected rows on exercise_catalog_logical, so BOTH
targets are constructible as IDENTITY-ONLY STUBS entirely from
promoted data — permitted because 027 supports them (RESTRICT FKs to
the logical table; the promoted live proofs publish against bare
target identities) and every required field (a UUID) is supplied by
the package's predeclared identifiers. NEITHER target receives a
snapshot, content, review, eligibility, publication, or delivery
state: their authored batch content records exist but remain
pending/evidence-null/import-ineligible — no separately approved and
eligible source artifact exists, so loading their content is
forbidden and not performed.

INTENDED vs DATABASE-PROVEN TARGET IDENTITY (semantic precision,
correction finding 3): the two target logical rows are BARE UUIDs.
The admitted artifact and the reviewed package ASSIGN the intended
mapping (e21b2c00-0000-4000-a000-000000000002 = Dead bug;
e21b2c00-0000-4000-a000-000000000003 = Ab wheel rollout); after the
load the database stores only the bare UUIDs and carries no
canonical-name evidence for either target, so NO claim is made that
hosted database state independently proves those names. Identity-only
staging is acceptable in THIS milestone only because Plank remains
pending, draft, unadmitted, and unpublished. Database review,
admission, and publication of Plank MUST all remain blocked until
separately reviewed target snapshots exist and a fail-closed gate
proves that e21b2c00-0000-4000-a000-000000000002 bears the active
canonical snapshot "Dead bug" and
e21b2c00-0000-4000-a000-000000000003 bears the active canonical
snapshot "Ab wheel rollout", with neither mapping swapped, missing,
inactive, or ambiguous. No target snapshot is created here (no
authorized source artifact exists), and neither expected relationship
is weakened or removed.

NO IMPORT RUN OR MEMBERSHIP: the promoted 023/026 contracts bind
import runs, run items, sealing, and revocation to the DELIVERY
lifecycle (deliver_catalog_exercises consumes a sealed approved
run); migration 027's content lifecycle (load -> review -> admit ->
publish) has no run linkage anywhere in its bytes. Run creation is
therefore NOT part of this load stage and the package creates none.

NAMESPACE SAFETY: catalog name claims
(exercise_catalog_name_claims) are catalog-scoped; tenant exercises
use the separate per-user exercise_name_claims table. Loading a
catalog snapshot named 'Plank' cannot collide with tenant Plank
rows; tenant collisions are handled at DELIVERY by 026's
collision-safe machinery. Proven live with a representative
84-exercise tenant fixture.

NO BLOCKER: every required UUID, canonical identity, classification,
anatomy, alias, provenance, discovery field, authorship field,
timestamp, and relationship target is uniquely and truthfully
derived as above; the fail-closed stop was not triggered.

## 4. The prepared load package

docs/exlib2k-plank-catalog-load-package.sql — 20,116 bytes, SHA-256
78cff34a39239c62391f322138e7e4085191fb4f26fc0e87c17c6474915e21a7
(as corrected; the pre-correction package was 16,099 bytes /
d53e90c0fa9c55ca7074cf2f3fef47956464861afaa4222e6c9d867d0a17d6e1,
superseded by this correction commit).
Resident under docs/, NOT under supabase/migrations/. Labeled
PREPARED — NOT EXECUTED; names ttybyljytiwntvorugcv as the only
eventual target; binds the exact migration-027 and admitted-content
fingerprints (any byte change to either voids it).

Shape: ONE explicit transaction. First, the LOCK-SERIALIZED gate:
one LOCK statement takes SHARE ROW EXCLUSIVE on all ten gate tables
in documented alphabetical order - SRE conflicts with itself and
with writers while leaving ordinary reads unblocked, never blocks
the transaction's own loader calls, and is held through every loader
call, every postcondition, and COMMIT; it is a real table-lock
design, not advisory-only, so non-cooperating writers are bound too.
Then owner-role PRECONDITIONS (loader
holds no table privileges): the three loader functions and the
loader role must exist, and the ENTIRE catalog surface (ten tables
including claims, runs, and items) must be EMPTY — the fresh-load
precondition that makes the package ONE-USE. Then SET ROLE
exlib_catalog_loader and exactly five loader calls: three
load_catalog_identity (predeclared UUIDs), one load_catalog_snapshot
(Plank only), one load_catalog_content_draft (payload verbatim +
the two-row expected set). Then RESET ROLE and owner-role
POSTCONDITIONS asserting the exact resulting state (3 identities;
1 pending active Plank snapshot with every field pinned including
category and the NULL sources; the exact anatomy and alias pairs;
exactly one PENDING/DRAFT/UNADMITTED content version 1 with every
payload byte equal to the artifact; exactly the two expected rows;
EXACTLY the three catalog name claims - canonical 'plank' plus alias
'front plank' and alias 'forearm plank', all owned by the Plank
identity - with migration-023's bidirectional claim invariant clean
(exlib_verify_catalog_claims() returns 0/0; the function is STABLE
and read-only, so it is safe from the owner postcondition context);
zero live relationships, runs, items; zero target snapshots or
content). ANY mismatch raises and rolls back the WHOLE package.

Rerun behavior, honestly: the promoted loader functions are
deliberately non-idempotent (primary keys and claims), so the
package does not pretend to be rerun-safe — a second execution fails
closed at the empty-surface precondition BEFORE any write. One-use
by design, documented in the package header. Concurrent execution is
serialized by the lock gate: two simultaneous executions can never
both pass the empty-surface read - the loser blocks on the table
locks until the winner commits, then fails closed at the same
nonempty precondition. Proven live with a REAL two-session race.

What it never does: no review transition, no admission, no
publication, no approval/seal/revocation/delivery, no import run or
membership, no seed edit, no inventory flip, no exercises mutation.
The loaded version is left exactly pending, draft, and unadmitted.

## 5. Verifier lifecycle for this milestone

Mechanical sweep: the new docs-only package contains the substring
"load-package", which two historical verifiers scan the LIVE docs
directory for. Classification per the three classes:

- HISTORICAL PHASE CLAIMS requiring an exact promoted-tip anchor
  (revised under RETARGET (EXLIB-2K catalog-load preparation)):
  verify-exlib2i.ts C2 and verify-exlib2j.ts C2 each carried the
  live claim "no load-payload/load-package artifact exists in
  docs/". That was true throughout their phases and through
  EXLIB-2M; it is now anchored to each suite's exact promoted tip
  (73231e9 for 2I, 2a0465e for 2J) via git ls-tree, where the claim
  was and remains true. Totals unchanged (14/0, 12/0).
- CURRENT BOUNDARIES requiring a narrow labeled admission: none —
  no other live boundary rejects a docs-resident SQL package (the
  proposal-residency checks in the 2L/2M suites match only
  exlib2l/migration paths).
- UNRELATED TEXT: all other grep hits are check names or comments
  in the retargeted files themselves; untouched elsewhere.

New verifiers: scripts/verify-exlib2k.ts (static, the 13
instruction proofs plus the three correction findings: lock coverage
and order, package-internal claim postconditions with the corrected
three-claim wording, and the intended-vs-proven target-identity
semantics with the mandatory target-snapshot gate) and
scripts/verify-exlib2k-live.sh (disposable-cluster live proof,
including the REAL two-session concurrency race and the
claim-corruption rollback variant; totals in the review export).

## 6. Prepared-not-executed posture (explicit)

The load package exists ONLY as a reviewed local file. It has NOT
been executed against hosted Supabase or any persistent database,
and is NOT claimed as executed anywhere. Executing it on hosted
ShredOS is a separate, future, explicitly instructed act
(Joseph/ChatGPT path), with its own approval and evidence trail —
followed by the separately gated database review, admission, and
publication authorities. The Plank artifact, its human review, its
R6 eligibility admission, the seed, seed_link_compatible, the
inventory, the ledger, runtime, APIs, UI, dependencies, and
configuration are all byte-unchanged in this phase.

## 7. Addendum — hosted execution attempt and authority correction (2026-09-02, post-promotion)

The promoted package revision (20,116 B / 78cff34a...) was attempted
ONCE on hosted by ChatGPT and FAILED SAFELY at SET ROLE with
ERROR 42501 (permission denied to set role "exlib_catalog_loader");
the transaction rolled back and all ten catalog tables remained
exactly zero rows — no partial state, no lifecycle effect. The
promoted bytes remain preserved at the tag
exlib2k-plank-catalog-load-prep-reviewed-not-executed. A
hosted-authority compatibility correction supersedes that revision
for any future execution — the corrected package (revision B after the
Codex grantor/session findings: 29,760 B /
a1b6dd55850c5d544e2f484d1ce4833b41deec7f3dd4d4c2373cb3b50daaccf0)
and its full evidence, derivation, design selection, and fixture
redesign are recorded in
docs/exlib2k-hosted-authority-correction-record.md. This addendum
adds history only; nothing above it is rewritten.
