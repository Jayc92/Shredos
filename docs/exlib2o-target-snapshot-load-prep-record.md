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

docs/exlib2o-target-snapshot-load-package.sql — 30,164 B, SHA-256
c92993061d7d68b6a2061516dea5bc9e2642cecf7a30e8142728ea3833b6d0c5.
PREPARED — NOT EXECUTED. One transaction; SHARE ROW EXCLUSIVE locks
on all ten catalog tables (alphabetical, one statement) serialize
the fresh-state gate against concurrent executions and unrelated
writers before any gated read.

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
left on hosted ShredOS, demanded fail-closed): ten-table count
vector 3/1/2/2/3/1/2/0/0/0 (logical/catalog/muscles/aliases/claims/
content/expected-relationships/relationships/import-runs/run-items);
exactly the three EXLIB-2K identities; both targets BARE; the names
"dead bug", "ab wheel rollout", "ab roller rollout" unclaimed; the
Plank surface exactly the loaded shape (active pending v1 snapshot
on ...0001; draft content ...0101 v1); claims invariant 0/0.

EXPECTED POST-STATE (package-internal postconditions; any mismatch
rolls back everything): count vector 3/3/5/3/6/1/2/0/0/0; each
target binding proven INDEPENDENTLY (every snapshot field including
category, the exact anatomy set, the exact alias set, the exact
claim set); the CROSS no-swap proof in both directions (each name
resolves to exactly its UUID; each UUID carries exactly its name and
category); zero content versions for either target; the Plank
surface and the tenant exercises table digest-identical to the
pre-state (captured in-transaction before the load); claims
invariant exactly 0/0; the loader function still not executable by
anon/authenticated/service_role.

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
  structure (one transaction, the exact ten-table lock list, exactly
  two snapshot calls and zero other authority calls, the pre/post
  count vectors, the no-swap postconditions, the invariant calls,
  the restoration block, the one-use language), the record bindings,
  the source refs, and the phase topology/inventory.
- scripts/verify-exlib2o-live.sh (new, live): disposable socket-only
  PostgreSQL cluster; migrations 001-027 applied exactly once by the
  non-superuser postgres on the supabase_admin-bootstrapped fixture;
  the 84-exercise tenant fixture; the committed EXLIB-2K package
  executed once to produce the exact expected pre-state; then the
  EXLIB-2O package proven on the happy path (exact post-state,
  bindings, digests, invariant, restoration) and against the full
  refusal matrix (second execution, missing identity, foreign target
  claim, claimed name, malformed category, swapped UUIDs, tampered
  anatomy payload, omitted loader call, widened authority baseline)
  with whole-transaction rollback and byte-exact authority
  restoration proven after every variant, plus a REAL two-session
  serialization race proving exactly one committer.
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
  file, so no second-order retarget exists.

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
