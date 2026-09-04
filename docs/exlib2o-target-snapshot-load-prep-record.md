# EXLIB-2O — Dead bug + Ab wheel rollout target-snapshot load-package preparation record

Recorded 2026-09-03 (UTC). LOCAL-ONLY preparation milestone: one
exact, one-use, fail-closed hosted load package is PREPARED — NOT
EXECUTED. The only database it may ever run against is Supabase
project "ShredOS" (ref ttybyljytiwntvorugcv), and only by
Joseph/ChatGPT over the established hosted-execution path — never by
Claude. No hosted service was contacted in this milestone; the
package was exercised exclusively inside disposable, socket-only
local PostgreSQL fixtures that are destroyed by the live verifier.
ChatGPT and Claude did NOT perform, influence, or fabricate the
human reviews or category decisions this package carries.

## 1. Authoritative sources (all promoted, all byte-frozen)

- Promoted source commit: main = 4e4a6e6c06ad3eaab234697cbc11725650f
  1a09f (tag exlib2n-r6-eligibility-admission-stable, object
  7106b05fa1308fef03b9e0942572b662435c3259, annotation "EXLIB-2N
  target-snapshot R6 eligibility admissions stable — ELIGIBLE — NOT
  LOADED OR PUBLISHED").
- R6-admitted authored records (the ONLY loadable payloads; both
  human-approved and import-eligible):
  - Dead bug = docs/exlib2c-release1-batch02-content.jsonl line 12
    (file 52,123 B / ebca1c01ffa66c78bdc42fc2972cfd328a75d2d6c273587
    8f9445617c15743cc; line 1,962 B / 3fbbaccd7bdd152f86c8b4f46f4293
    e012494cdb5704b67d3762ec715d3dcf55).
  - Ab wheel rollout = docs/exlib2c-release1-batch04-content.jsonl
    line 5 (file 55,442 B / c8a63ccbd7cc2913265926050480535f5d4adff5
    85f1d462f9b2c2d30406fcf2; line 2,267 B / 4d09e2f9d9bef60bf01b00b
    1c84ea76563783c32995847a8e9dfde0ee740baa2).
- Completed human-review forms (the category-decision carriers):
  - Dead bug: 5,604 B / ce555650a643077be099b9e65490e36d8731ce9c40ad
    0e3aa0e80065152cdbeb — category **mobility**.
  - Ab wheel rollout: 5,754 B / efed7f1f59a040014dd6ca5df1276997de2f
    7410a186da10532fe987558181b5 (EDT-corrected revision) — category
    **other**.
- Identity bindings (promoted forms + EXLIB-2K hosted evidence;
  never swapped): Dead bug = e21b2c00-0000-4000-a000-000000000002;
  Ab wheel rollout = e21b2c00-0000-4000-a000-000000000003. Both
  exist on hosted ShredOS as BARE identities (zero snapshots, zero
  aliases, zero claims), created by the executed EXLIB-2K package
  (SPENT; 29,760 B / a1b6dd55850c5d544e2f484d1ce4833b41deec7f3dd4d4
  c2373cb3b50daaccf0; never reused).
- Applied migration 027 (byte-frozen): 90d53aaf8fd341dd99bab22b7d1c
  a280ec24b8ccee2a28efca6e835e0585a14f.

## 2. The prepared package

docs/exlib2o-target-snapshot-load-package.sql — 35,468 B, SHA-256
e106c9dda06a7279cf37f23647dfe37c88c5c2e5315eb0886cea034ad8d52527.
PREPARED — NOT EXECUTED. One transaction; SHARE ROW EXCLUSIVE locks
on all ELEVEN catalog tables (alphabetical, one statement —
exercise_catalog_review_events included, the boundary correction
recorded in section 9) serialize the fresh-state gate against
concurrent executions and unrelated writers before any gated read.

WHAT IT CREATES, EXACTLY: two born-active, born-pending catalog
snapshots — one per existing target identity — plus only their
loader-carried supporting rows (Dead bug: one anatomy row
hip_flexors/secondary, zero aliases; Ab wheel rollout: two anatomy
rows lats/tertiary + obliques/secondary, one alias "Ab roller
rollout") and the trigger-derived name claims (canonical "dead bug";
canonical "ab wheel rollout" + alias "ab roller rollout").

FIELD DERIVATION, per exercise: canonical_name, primary_muscle,
equipment, laterality, tracking_mode, provenance, movement_pattern,
training_role, difficulty, availability, anatomy, and aliases are
copied VERBATIM from the R6-admitted authored record; category is
the HUMAN decision from the completed form (mobility / other) —
category exists in NO authored record and is deliberately carried
only by the forms, the promoted application record, and this
package; source_url, source_page, retrieved_at, and
import_confidence were NEVER AUTHORED (the keys are absent from both
records, which never carried discovery sources) and are passed as
SQL NULL exactly as exercise_catalog_provenance_sources_chk requires
for forgefitos_original. CONSTRUCTED VALUES: NONE — snapshot row ids are
the table's gen_random_uuid() defaults; catalog_version (1),
review_status ('pending' with NULL audit), and is_active (true) are
the migration-023 born-state defaults; no content id or version
exists because no content is loaded.

EXPECTED PRE-STATE (the exact surface the executed EXLIB-2K package
left on hosted ShredOS, demanded fail-closed): eleven-table count
vector 3/1/2/2/3/1/2/0/0/0/0 (logical/catalog/muscles/aliases/
claims/content/expected-relationships/relationships/import-runs/
run-items/review-events — the same eleven tables the transaction
locks); exactly the three EXLIB-2K identities; both targets BARE;
the names "dead bug", "ab wheel rollout", "ab roller rollout"
unclaimed; claims invariant 0/0; and the AUTHORITATIVE FIELD-LEVEL
PLANK GATE, which pins the pre-state itself rather than inferring it:
every semantic column of the ...0001 snapshot (category,
primary_muscle, equipment, laterality, tracking_mode, provenance,
movement_pattern, training_role, difficulty, availability), all four
discovery fields NULL, review_status pending with NULL audit,
catalog_version 1, is_active; the exact anatomy set
"lower_back:tertiary,obliques:secondary"; the exact alias set
"Forearm plank,Front plank"; the exact claim set; the complete
...0101 content payload pinned field by field (six md5 digests plus
the empty equipment_setup), its authored_at date, and its whole
pending/draft/unadmitted lifecycle with every review and admission
field NULL. This gate runs BEFORE the authority grant, so a drifted
Plank surface is refused with no write and no elevation (correction
recorded in section 9).

EXPECTED POST-STATE (package-internal postconditions; any mismatch
rolls back everything): count vector 3/3/5/3/6/1/2/0/0/0/0 — the
eleventh term proving this package writes NO review event; each
target binding proven INDEPENDENTLY (every snapshot field including
category, the exact anatomy set, the exact alias set, the exact
claim set); the CROSS no-swap proof in both directions (each name
resolves to exactly its UUID; each UUID carries exactly its name and
category); zero content versions for either target; claims
invariant exactly 0/0; the loader function still not executable by
anon/authenticated/service_role; and TRANSITION NEUTRALITY — the
Plank whole-row surface and the whole-row tenant exercises digest
identical to the values captured in-transaction after the gates and
before the first loader call. Those two digests prove only that
EXLIB-2O changed nothing DURING execution; they are NOT a pre-state
authority, and the package labels them so (section 9).

AUTHORITY: the narrowest migration-027 operational authority capable
of the work — exlib_catalog_loader via exactly TWO
load_catalog_snapshot calls (zero load_catalog_identity, zero
load_catalog_content_draft, zero review/admission/publication/seal/
delivery calls). The hosted non-superuser posture proven during
EXLIB-2K is demanded before any write: current_user AND session_user
= postgres, non-superuser, and the loader role carrying EXACTLY one
membership — postgres granted BY supabase_admin, ADMIN TRUE /
INHERIT FALSE / SET FALSE (grantor included). Elevation is
transaction-contained (GRANT ... WITH SET TRUE, INHERIT FALSE),
structurally proven as the exact two-grantor shape BEFORE SET ROLE,
and restored byte-for-byte with a grantor-scoped REVOKE ... GRANTED
BY postgres; the postconditions verify the restored baseline and
zero standing SET capability. Any failure anywhere rolls back the
grant with the rest of the transaction.

ONE-USE SEMANTICS: after this package commits, the pre-state gate
(the exact count vector and bare targets) can never hold again, so a
second execution refuses BEFORE any write or authority change — no
partial effects, no drift. Unrelated pre-existing state fails the
same gate (foreign-state refusal). FAILURE SEMANTICS: every failed
precondition, loader call, restoration check, or postcondition
raises inside the single transaction and rolls back EVERYTHING.

## 3. Target no-swap proof

The UUID/name/category triples are bound in three independent
layers: (1) each loader call carries its UUID, name, and category in
the same statement, copied from fingerprinted sources; (2) the
package postconditions prove each triple independently AND
cross-prove both directions (name -> UUID, UUID -> name+category),
so swapped calls roll back; (3) the live verifier executes a
deliberately UUID-swapped package variant and proves it rolls back
with zero state change. The intended mapping is stated everywhere as
Dead bug = ...0002 = mobility and Ab wheel rollout = ...0003 =
other, and nowhere else reversed.

## 4. Distinctions and later milestones (explicitly out of scope)

TARGET-SNAPSHOT LOADING (this package) is NOT content loading: no
authored instructional prose moves anywhere; both targets remain
content-less in the catalog after execution. Database review events,
content authoring/loading for the targets, content admission,
publication, relationship projection, the Plank database content
review/admission/publication/release, import runs, delivery, seed
edits, and seed_link_compatible activation are ALL later, separately
gated milestones. Executing this package satisfies the hosted
target-snapshot gate's SUBSTANCE (active canonical snapshots named
Dead bug and Ab wheel rollout at their exact UUIDs), but the gate is
only SATISFIED by the separate hosted proof milestone after
Joseph/ChatGPT execute the package; until then the gate remains
OPEN and Plank review/admission/publication remain blocked.

## 5. Byte-change invalidation

This preparation is approved (if approved) for EXACTLY the artifact
fingerprints in sections 1-2. ANY byte change to either admitted
authored record, either completed form, either category decision,
either UUID binding, or the package itself VOIDS the preparation
approval: the changed artifact is a new payload requiring renewed
review and a new, separately approved preparation. The package's own
fresh-state gate additionally refuses any hosted surface that
drifted from the expected pre-state.

## 6. Verifier lifecycle for this milestone

- scripts/verify-exlib2o.ts (new, static): re-derives every
  dollar-quoted loader literal from the admitted records and the
  completed forms (field by field, including the NULL discovery
  quadruples and the human categories), and proves the package
  structure (one transaction, the exact eleven-table lock list in
  alphabetical order, exactly two snapshot calls and zero other
  authority calls, the eleven-term pre/post count vectors, the
  no-swap postconditions, the invariant calls, the restoration
  block, the one-use language), the record bindings, the source
  refs, and the phase topology/inventory. FIVE checks added in the
  correction round (B8-B12) bind the two corrected findings
  mechanically: the locked set and the counted set are the SAME
  eleven tables, with eleven terms in both vector constants; the
  zero-review-event claim is enforced inside that locked boundary;
  the authoritative Plank gate carries every pinned field, ordered
  before both the GRANT and the first loader call, and pins no
  mutable timestamp column; the two whole-row digests are labelled
  transition-neutrality only and are captured after the gates; and
  the tenant digest stays a whole-row digest, counted twice, with no
  narrowed column list. G4 additionally proves the preserved-commit
  topology: 2f8f135's tree is unrewritten and the correction is
  exactly one plain single-parent commit over exactly four paths.
- scripts/verify-exlib2o-live.sh (new, live): disposable socket-only
  PostgreSQL cluster; migrations 001-027 applied exactly once by the
  non-superuser postgres on the supabase_admin-bootstrapped fixture;
  the 84-exercise tenant fixture; the committed EXLIB-2K package
  executed once to produce the exact expected pre-state; then the
  EXLIB-2O package proven on the happy path (exact post-state,
  bindings, digests, invariant, restoration) and against a FOURTEEN-
  variant refusal matrix (second execution; missing identity; foreign
  target claim; claimed intended name; foreign snapshot on a target;
  malformed category; swapped UUIDs; tampered anatomy payload;
  omitted loader call; widened authority baseline; and the five
  correction-round additions — pre-existing review event, mutated
  Plank content payload, schema-legal reviewed+admitted Plank
  content, repointed expected relationship, drifted Plank difficulty)
  with whole-transaction rollback and byte-exact authority
  restoration proven after every variant. Each counterfactual is
  built through a checked surgery helper that FAILS LOUDLY if the
  mutation does not land, because a silently rejected mutation would
  leave pristine state and make its refusal test prove nothing — the
  defect that produced a false pass in the first correction pass, and
  the reason F12 now moves the whole migration-027 lifecycle set
  together into a fully schema-legal approved+admitted row. G5 is a
  THREE-SESSION structural lock proof over pg_locks (replacing a
  count-sampled proxy that could not distinguish which lock a session
  held): the package session is observed simultaneously HOLDING a
  granted SHARE ROW EXCLUSIVE lock on exercise_catalog_review_events
  while WAITING ungranted on the next locked table, a separate
  review-event writer is observed blocked ungranted in ROW EXCLUSIVE
  behind it, and an independent third session reads ZERO review
  events inside the gated interval — with the exact final vector,
  the guard trigger's rejection of direct writes, and the byte-exact
  authority baseline proven afterwards.
- RETARGET (EXLIB-2O target-snapshot load prep):
  scripts/verify-exlib2n-r6-admission.ts — its committed-topology
  G1-G3 proofs and its F1 phase-range scan are anchored to the
  promoted R6 tip 4e4a6e6..., where they were and remain true
  (EXLIB-2O legitimately adds a docs-only .sql package after that
  tip). Count-neutral; assertion strength preserved (the same exact
  proofs over a named promoted commit).
- SECOND-ORDER SWEEP: for every file this milestone changes, its
  promoted-source fingerprint was resolved and the whole scripts/
  tree grepped; no committed verifier pins the bytes of any changed
  file, so no second-order retarget exists. RE-RUN exhaustively for
  the correction round over its four changed paths. All four are
  ADDITIONS after the promoted tip, so no promoted-tip bytes of them
  exist to pin; the sweep therefore used their pre-correction blobs
  at 2f8f135 (the four fingerprints are listed in section 9) and
  grepped every path in the repository for each one, plus every
  64-hex constant in the corrected verifiers. Nothing pins any of the
  four: the only references to these paths are the EXLIB-2O suites
  reading them, which re-derive their content rather than pinning
  their bytes. The correction adds NO retarget, and the single
  EXLIB-2O retarget above is preserved unchanged.

## 7. What this milestone did NOT do

No hosted contact of any kind; no execution of this package against
any non-disposable database; no push, promotion, or tag; no database
review event, admission, publication, seal, revocation, or
relationship projection; no import run, run item, or delivery; no
seed edit; no seed_link_compatible flip; no change to any authored
record, form, packet, inventory, ledger, migration, runtime, API,
UI, dependency, or configuration. The admitted Plank artifact, the
SPENT EXLIB-2K package, both batch files, and both completed forms
are byte-unchanged.

## 8. Dependency map (later, explicitly gated)

1. Codex review of this preparation; push/promotion/tag are separate
   explicit gates.
2. Hosted package execution — Joseph/ChatGPT only, never Claude,
   only against ttybyljytiwntvorugcv, exactly once.
3. The hosted target-snapshot gate proof (active canonical "Dead
   bug" at ...0002/mobility and "Ab wheel rollout" at ...0003/other,
   never swapped, missing, inactive, or ambiguous) — a separate
   evidence milestone.
4. Only then: Plank database content review, eligibility admission,
   and publication — each its own authority-gated act; target
   content authoring/loading remains its own later program.

## 9. Codex correction round (2026-09-04) — supersession disclosure

Codex reviewed the prepared package at commit 2f8f135fd97812c4a5a6a4
98796ee85f9d7df556 and required two release-blocking fail-closed
corrections before branch publication. Nothing from the first round
is rewritten or hidden: 2f8f135 is PRESERVED untouched as the first
commit on this branch — its tree 816d6a24d5fab3b3ae70450f3347d6bcf4d
b3d4d and its parent (promoted main 4e4a6e6) are asserted unrewritten
by the static verifier's G4 — and the correction is exactly ONE plain
single-parent forward commit on top of it, changing exactly four
paths: the package, this record, and the two verifiers. No amend,
squash, rebase, deletion, push, promotion, tag, or hosted contact.

### 9.1 Superseded claim 1 — the serialized boundary was incomplete

SUPERSEDED: "SHARE ROW EXCLUSIVE locks on all ten catalog tables",
with pre/post count vectors 3/1/2/2/3/1/2/0/0/0 and
3/3/5/3/6/1/2/0/0/0. exercise_catalog_review_events — the table
migration 027 writes review transitions into — was neither locked nor
counted. The package's "nothing else anywhere changed" proof
therefore had a hole exactly where a concurrent review transition
would land: an event written between the gate and the commit was
invisible to every postcondition, so the fail-closed guarantee was
weaker than the claim.

CORRECTED: the single LOCK statement covers ELEVEN tables in
alphabetical order, with public.exercise_catalog_review_events
between _relationships and _run_items, and both count vectors carry
an eleventh term — 3/1/2/2/3/1/2/0/0/0/0 pre, 3/3/5/3/6/1/2/0/0/0/0
post. That term is an enforced zero-review-event claim, taken inside
the locked boundary, at both ends of the transaction.

The boundary is proven STRUCTURALLY rather than by sampling, because
a count of waiting sessions cannot say which lock a session holds.
PostgreSQL takes multi-table LOCK entries in listed order and HOLDS
the earlier ones while it blocks on a later one, and ROW EXCLUSIVE
(INSERT) conflicts with SHARE ROW EXCLUSIVE, so a review-event writer
must queue. The live suite's G5 therefore observes, over three
concurrent sessions and pg_locks directly: the package session
simultaneously holding a GRANTED SHARE ROW EXCLUSIVE lock on
exercise_catalog_review_events while WAITING ungranted on the next
locked table; a different pid blocked UNGRANTED in ROW EXCLUSIVE on
review_events behind it; and an independent third session reading
ZERO review events inside that gated interval — followed by the clean
commit, the guard trigger's rejection of any direct event write, the
exact eleven-term final vector, and the byte-exact authority
baseline.

### 9.2 Superseded claim 2 — the Plank pre-state was underconstrained

SUPERSEDED: "the Plank surface exactly the loaded shape (active
pending v1 snapshot on ...0001; draft content ...0101 v1)", backed by
"the Plank surface and the tenant exercises table digest-identical to
the pre-state (captured in-transaction before the load)". Two
distinct defects sat behind that wording.

First, the gate read only identity-and-shape columns — the snapshot's
name, is_active, review_status and catalog_version; the content row's
id, logical_id and content_version. A Plank surface whose SEMANTIC
fields had drifted satisfied it: a changed difficulty, a rewritten
instruction payload, a retargeted expected relationship, even a
fully schema-legal approved-and-admitted content lifecycle. Second,
the digest pair could not close that hole, because both digests are
captured INSIDE the same transaction. They prove only that EXLIB-2O
changed nothing DURING execution — a drifted pre-state is compared
against itself and passes perfectly.

CORRECTED: an AUTHORITATIVE FIELD-LEVEL PRE-STATE GATE now pins the
Plank surface before any authority change and before any write —
every semantic snapshot column, all four discovery fields NULL,
review_status pending with NULL audit, catalog_version 1, is_active;
the exact anatomy set; the exact alias set; the exact claim set; the
exact expected-relationship set; and the content row's full payload
field by field against md5 digests re-derived from the admitted
EXLIB-2K artifact, its authored_at date, and its complete
pending/draft/unadmitted lifecycle with every review and admission
field NULL. Mutable timestamps (created_at, updated_at) are
deliberately NOT pinned, and the static verifier asserts their
absence so the gate cannot become spuriously unsatisfiable by the
passage of time.

The two whole-row digests are KEPT, because they remain the only
proof that execution itself is neutral — but they are relabelled in
the package as TRANSITION-NEUTRALITY EVIDENCE, explicitly "not a
pre-state authority", captured after the gates and before the first
loader call, and the static verifier binds both that label and that
ordering. Five new refusal variants exercise the corrected gate
against pre-execution drift: a pre-existing review event, a mutated
content payload, a schema-legal reviewed+admitted content lifecycle,
a repointed expected relationship, and a drifted snapshot difficulty
— each refused before any write, and the first two before any
authority change.

### 9.3 Harness defects found and closed (disclosed: false PASSES)

Both are disclosed precisely because they produced false passes, not
false failures.

1. NINE refusal counterfactuals discarded the mutation's output and
   exit status. When one was rejected by a migration-027 CHECK, the
   fixture stayed PRISTINE and the package then correctly succeeded
   over pristine state, so the "refusal" test proved nothing about
   the gate it named. This actually fired: the reviewed+admitted
   variant violated admission_order_chk (a 'pending' version cannot
   be admitted). Every counterfactual now runs through a surgery
   helper that reports and fails loudly on rejection, and that
   variant moves the whole migration-027 lifecycle set together into
   a fully schema-legal approved+admitted row with an explicit
   read-back assertion — which is the stronger test, since that row
   is exactly what the old gate would have accepted.
2. The static verifier chose its authoritative bytes from commit
   distance alone, so during a CORRECTION round it graded the
   corrected files against the already-committed, pre-correction
   blobs. Bytes are now authoritative from the worktree whenever the
   worktree holds any uncommitted change, and from HEAD only when the
   worktree is clean; the topology checks take their authoring branch
   the same way.

### 9.4 Superseded fingerprints (valid only at 2f8f135)

The pre-correction blobs, retained for the preserved commit and used
as the sources of the section-6 second-order sweep:

- docs/exlib2o-target-snapshot-load-package.sql — 30,164 B /
  c92993061d7d68b6a2061516dea5bc9e2642cecf7a30e8142728ea3833b6d0c5.
- docs/exlib2o-target-snapshot-load-prep-record.md — 12,536 B /
  a4f1c63b91bfec2a58dcd3e446aed1be4efa35b3dd28c937dd62e20566dde36e.
- scripts/verify-exlib2o.ts — 22,277 B /
  869decb90e3be4966ceee4456d36175cb58d0958b699f31a1c4ba4e6a75f6cd6.
- scripts/verify-exlib2o-live.sh — 27,089 B /
  12b155f2aab41b67289b15b5db716ad766f4602fc1fb220f0ef7deae2d68c6a4.

The corrected package fingerprint in section 2 is authoritative. What
the correction did NOT change: both admitted authored records, both
completed forms, both UUID bindings, both human category decisions,
the EXLIB-2K spent package, migration 027, the single EXLIB-2O
retarget, and every promoted commit — all byte-unchanged. No approval
is claimed or implied by this section; the milestone remains
LOCAL-ONLY and awaits Codex re-review.
