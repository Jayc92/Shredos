# EXLIB-2L — catalog-content and relationship schema: design record

Recorded 2026-09-02 (UTC); CORRECTED REVISION C applying the two
blocking Codex round-2 findings on top of the accepted round-1
corrections (Codex round 2 confirmed the original four findings
corrected and accepted the five residual judgment items as
documented). LOCAL-ONLY design milestone. This record documents the
design of docs/exlib2l-catalog-content-schema-proposal.sql
(78,468 B, SHA-256
9a0505c8f2fea3f4330e7c80e22ffd8bc6867760b335a7468ea4587f0bd70553),
an UNAPPROVED implementation proposal that lives in docs/ and is NOT
a migration. Nothing here creates supabase/migrations/027, applies
anything to any hosted or persistent database, loads catalog
content, reviews, approves, admits, seals, publishes, revokes, or
delivers anything, or changes the Plank content, its human review,
its eligibility, the seed, the inventory, or the ledger. Migrations
remain exactly 001-026. This record APPROVES NOTHING; it is
Claude-authored and awaits Codex re-review, and only Joseph/ChatGPT
may ever apply migrations.

## 1. The preserved EXLIB-2K feasibility finding (deferred, NOT failed)

EXLIB-2K (Plank catalog-load feasibility) stopped fail-closed, and
Codex adjudicated the stop as correct: do not weaken the Plank
content, remove its relationships, fabricate source metadata, or
build a partial loader against an incapable schema. EXLIB-2K remains
DEFERRED — not failed permanently — until the missing catalog-content
schema is reviewed and applied. The three blockers, stated exactly
and without overstatement:

1. NO CONTENT DESTINATION: no migrated table holds the authored
   instructional content (setup_steps, execution_steps,
   breathing_cue, common_mistakes, safety_guidance, equipment_setup,
   accessibility_alternative, authorship) and no publication
   lifecycle exists, so the human-approved, import-admitted Plank
   content (2,928 B, SHA-256 d82078490efa9ef13e128e7b7b742fbda8ea9e
   74e32382252d96c326c679d752) has nowhere truthful to load.
2. NO RELATIONSHIP TARGET: no migrated table represents the
   regression/progression/substitution relationships, so the Plank
   record's authored relationships (substitution "Dead bug",
   progression "Ab wheel rollout") have no resolver target and would
   have to be silently dropped — forbidden.
3. UNTRUTHFUL PROVENANCE SHAPE: exercise_catalog (migration 023)
   declares source_url, source_page, retrieved_at, and
   import_confidence NOT NULL — external-import discovery metadata
   that has NO truthful value for forgefitos_original content
   (fabricating any value is forbidden) — and it lacks the
   provenance, movement_pattern, training_role, difficulty, and
   availability columns the promoted architecture and the authored
   record carry.

These are schema gaps, not content defects: the Plank content itself
remains human-approved (EXLIB-2I) and import-admitted under R6
(EXLIB-2J), byte-frozen at the fingerprint above. This proposal
addresses exactly these three gaps and nothing else.

## 2. The publication projection (round-2 finding 1, design shape B)

Round 2 found that revision B's identity-wide live relationship
table created a MUTATION WINDOW: admitting version 2 required moving
the live rows from set A to set B while version 1 was still
published, silently changing version 1's observable relationship
meaning and leaving it published-but-manifest-stale until a later
publication attempt. Revision C adopts design shape B
(expected/staged relationships + atomic publication projection),
chosen over shape A (version-owned live rows) because it preserves
the promoted 2A consumer surface EXACTLY — an identity-keyed
exercise_catalog_relationships table with the same columns, keys,
and read semantics — while narrowing only its write path:

- exercise_catalog_content_expected_relationships (version-owned,
  authored while pending, frozen at review) is the reviewed and
  admitted SOURCE OF TRUTH for each version's relationship set;
- exercise_catalog_relationships is the PUBLIC LIVE SURFACE and is a
  PROTECTED PROJECTION: its rows always equal the currently
  published version's expected set, and consumers resolve only that;
- ADMISSION binds the version-owned expected set (through the v2
  manifest) and never reads or writes the live surface — so version
  2 is reviewed AND admitted with set B while version 1 stays
  published with set A, stays observably unchanged, and stays
  manifest-FRESH (live-proven: after v2's admission, v1's live set,
  publication status, and recomputed fingerprint are all unchanged);
- publish_catalog_content performs the ATOMIC SWITCH in one
  transaction under the logical-identity lock: retire the prior
  published version, DELETE the identity's projection rows, INSERT
  the new version's expected set, publish the new version. A failure
  anywhere rolls the whole transaction back (live-proven: a failed
  v2 publication leaves v1 published with set A byte-exact); a
  success is observed only as v1-retired + exactly-set-B + v2-
  published (live-proven). No externally observable state pairs a
  published version with another version's relationship set;
- the projection trigger
  (exlib_protect_relationship_projection) refuses INSERT/DELETE
  unless publish_catalog_content's transaction-local sentinel
  (set_config('exlib.relationship_projection_identity',
  <identity>, is_local => true)) covers that exact identity, and
  refuses UPDATE always. This binds EVERY caller, including the
  table owner (BEFORE triggers fire regardless of privilege) —
  direct mutation outside the protected path fails closed
  (live-proven for INSERT, DELETE, and UPDATE as the owner);
- defense in depth: even a break-glass actor who manually sets the
  sentinel or bypasses the function cannot MARK A VERSION PUBLISHED
  against a wrong set — the content freeze trigger's publication
  branch structurally re-verifies projected-set equality (both
  directions) and manifest freshness at the moment any row becomes
  published (live-proven: a direct owner publish with an unprojected
  expected set is refused);
- a published version can therefore never remain published while its
  effective relationship set is stale: the effective set changes
  only in the transaction that retires it. The invariant is
  structural/transactional — no window, no ordering promise, no
  future-verifier reliance.

Versions' relationship rows cannot collide: expected rows are keyed
by (content_id, relation, to_logical_id) and coexist (live-proven);
the projection holds exactly one version's set at a time.

## 3. Four distinct operational authorities (round-2 finding 2)

Revision B claimed four authorities but implemented two. Revision C
implements all four as NOLOGIN roles, each holding EXECUTE on
exactly its own narrow SECURITY DEFINER function(s), no table
privileges, and nothing else:

| Authority | Role | Function(s) | May | May never |
|---|---|---|---|---|
| Loading/authoring | exlib_catalog_loader | load_catalog_identity, load_catalog_snapshot, load_catalog_content_draft | create logical identities; create a pending snapshot with its anatomy and aliases where the separately authorized load package supplies them; create a pending draft version with its authored payload and its version-owned expected relationships | approve, admit, publish, retire, or alter a decided version — its functions only INSERT, and the freeze triggers force everything born pending/active/unadmitted |
| Human-review application | exlib_catalog_reviewer | apply_content_review | apply exactly ONE legal pending -> approved/revised/rejected transition per call, with a complete non-blank reviewer/timestamp/rationale tuple | modify payload, expected relationships, admission, publication, snapshots, anatomy, aliases, or live delivery state (it updates only the four review fields; the trigger re-validates) |
| Eligibility admission | exlib_catalog_admission | admit_catalog_content | admit only an already-approved immutable draft; COMPUTE the normalized SHA-256 manifest from database state; record the separately supplied source-artifact SHA-256 | load, review, publish, or alter relationship meaning for a currently published version (admission never touches the live surface) |
| Publication | exlib_catalog_admin (the promoted 2A boundary role) | publish_catalog_content | publish only an approved, admitted, fingerprint-fresh draft; atomically switch the effective relationship set; retire the prior published version | load, review, or admit |

Every function pins search_path = public, pg_temp; EXECUTE is
revoked from PUBLIC, anon, and authenticated; each function is
granted to exactly one role (the GRANT matrix is live-proven exact);
every function validates lifecycle state itself AND the freeze
triggers re-validate it; all TWELVE cross-denials are live-proven
(loader/reviewer/admission/publication each denied the other three
authorities' functions), plus all four acts denied for anon and
authenticated, plus direct-table mutation denials for the
operational roles themselves. Post-decision review transitions
(approved -> revised/rejected) are deliberately NOT an operational
authority in this proposal. Snapshot REVIEW
(exercise_catalog.review_status) remains the promoted 023 delivery
lifecycle, outside these four content authorities.

HONEST BREAK-GLASS STATEMENT: the database superuser / table owner
can always mutate rows directly. That power is NOT an operational
authority; it is disclosed break-glass capability, it sits outside
the ordinary operational path, and every freeze trigger and
structural CHECK still binds it (BEFORE triggers fire for the owner
too — live-proven repeatedly; only ALTER TABLE ... DISABLE TRIGGER
could lift them, which no operational role can execute).

## 4. The admission manifest (accepted round 1; v2 format for round 2)

HONEST CORRECTION (preserved): revision A's fingerprint was MD5 over
selected instructional fields ONLY and did NOT bind the complete
EXLIB-2J admitted artifact; no claim to the contrary is made.

exlib_content_admission_manifest(content_id) builds the canonical
text (leading literal 'EXLIB-ADMISSION-MANIFEST v2') FROM DATABASE
STATE, and exlib_content_admission_fingerprint(content_id) returns
its SHA-256 (lowercase hex; live-proven no md5 call exists in any
new function). v2 REMOVES v1's live-surface section and binds the
VERSION-OWNED expected relationship set: binding the live projection
would couple one version's manifest to another version's publication
state — exactly the round-2 finding-1 defect. Bound surfaces:

| Manifest line | Binds | Source rows |
|---|---|---|
| identity | the logical identity UUID | exercise_catalog_logical via content.logical_id |
| snapshot | catalog_version, canonical_name, category, primary_muscle, equipment, laterality, tracking_mode, provenance, movement_pattern, training_role, difficulty, availability, source_url, source_page, retrieved_at, import_confidence | THE single ACTIVE exercise_catalog snapshot (uniqueness guaranteed by 023's exercise_catalog_one_active_logical_idx; the manifest RAISES on zero or duplicate actives and on NULL discovery metadata) |
| anatomy | (muscle, role) rows | exercise_catalog_muscles of that snapshot, ordered by muscle COLLATE "C" |
| alias | alias rows | exercise_catalog_aliases of the identity, ordered by alias COLLATE "C" |
| content | content_version, authored_by, authored_at, all seven authored payload fields | the content row (the review-bound version) |
| review | content_status + complete review evidence | the content row |
| relationship | the version-owned expected relationship set | exercise_catalog_content_expected_relationships, ordered by (relation COLLATE "C", to_logical_id) |

DETERMINISM RULES (each live-proven): every variable text field is
hex-encoded from UTF8 bytes ('S'+hex, or 'N' for NULL — no value can
inject a delimiter); JSONB serializes through jsonb's canonical form
(key order normalized — live-proven with a reordered-keys equality);
DATE values are integer day offsets from 1970-01-01 (date_out is
only STABLE and DateStyle really changes it); TIMESTAMPTZ values are
numeric epoch seconds (timezone-independent); row aggregation is
pinned to COLLATE "C" byte order so locale cannot reorder rows; the
fingerprint is identical under different DateStyle and TimeZone GUCs
and under committed reverse-order re-insertion of the pending
expected set. The manifest functions are STABLE, not IMMUTABLE (they
read database state).

TWO DISTINCT DIGESTS are stored on the admitted row:
- admitted_fingerprint: the database-normalized manifest SHA-256,
  COMPUTED by admit_catalog_content and INDEPENDENTLY RECOMPUTED by
  the freeze trigger at the admission transition — a caller-invented
  hash cannot land even through a direct owner-level write
  (live-proven);
- admitted_source_sha256: the exact repository source artifact
  SHA-256 (for the real Plank act: the 2,928-byte artifact digest
  d8207849...), recorded as provenance evidence and format-validated
  (64 lowercase hex; MD5-shaped digests are refused). The database
  cannot read repository bytes, so this digest is a RECORDED FACT —
  disclosed plainly (accepted round-2 as documented); the
  artifact-to-database mapping is documented in the table above and
  MECHANICALLY PROVEN by the live suite (the manifest of a fixture
  contains the exact hex encoding of every surface's authored
  values).

Publication recomputes the complete manifest fingerprint and fails
closed on ANY bound change or omission — in the function AND
structurally in the trigger: a post-admission alias insert (STALE,
both paths), a post-admission review flip (refused by status), and a
deactivated bound snapshot (the manifest itself RAISES — a MISSING
bound surface) are each live-proven. A stale or partial admission
can never publish.

## 5. Relationship completeness (accepted round 1, preserved)

Each content version owns its EXPECTED relationship set: authored
while pending (by the loader authority, in the same call that
creates the draft), frozen by the review decision, rows immutable,
PK-deterministic, RESTRICT FKs to real logical identities,
self-expectation refused, duplicates structurally impossible. The
published live surface ALWAYS equals the published version's
expected set — by projection construction plus the trigger's
publication-time equality verification. The Plank model therefore
publishes with EXACTLY substitution -> "Dead bug"-model target and
progression -> "Ab wheel rollout"-model target (live-proven row for
row), while those target identities need NO snapshot, NO content, NO
admission, and NO publication of their own (live-proven zeros).
Multiplicities are structurally 0-or-1 per (relation, target) in
both tables, so exact set equality is exact multiset equality.

## 6. Nonempty-catalog compatibility (accepted round 1, preserved)

The four discovery-metadata columns are NULLABLE with NULL-permitting
vocabulary CHECKs; forgefitos_original rows must carry all four
(exercise_catalog_discovery_metadata_chk) and no source fields
(exercise_catalog_provenance_sources_chk); external rows keep their
exact 023 meaning with all four source fields REQUIRED; legacy rows'
discovery metadata stays NULL rather than invented (no placeholder
values, no deterministic backfill — the promoted contract supplies
no unambiguous mapping, so a backfill would be fabrication); the
admission manifest RAISES on NULL discovery metadata, so a legacy
external snapshot cannot enter the workflow until a complete NEW
catalog version row exists (the carried freeze trigger keeps legacy
NULLs immutable in place). "Hosted currently has zero rows" is
hosted-instance evidence only. The live suite seeds a legitimate
NONEMPTY 023 external catalog (complete NOT NULL sources, anatomy,
alias, an approved SEALED run) BEFORE applying the proposal, then
proves: clean application over BOTH the nonempty and the empty
database; every pre-existing 023 column of every legacy row
BYTE-IDENTICAL; metadata NULL and provenance defaulted; sources
still required; original rows forbid sources and require metadata
(both proven THROUGH the loader authority, whose writes obey every
CHECK); the legacy row refused at the workflow gate; and unchanged
026 DELIVERY and ROLLBACK on the historical rows AFTER application.

## 7. Authoritative contract derivation

Sources, in the precedence used (each byte-frozen on promoted main,
tip 2a0465e8be5ec2e33a41fde8f30d5fcd5a2de738): the EXLIB-2L
instruction and the Codex round-1 and round-2 corrective
instructions (operator-supplied, most specific and latest);
docs/exlib2a-catalog-architecture-record.md (25,471 B, de825ddf1826
0a877651e426c8436709257c9100e3dfcbd994e3b9e2496191d8);
supabase/migrations/023_exlib_catalog_and_delivery_contract.sql
(92,806 B, 0991448c39a558385431c78cef6d6063df208312a3f53866756ba730
066c42f2, REVISION H, APPLIED to hosted 2026-08-24) plus migrations
024-026; docs/exlib2c-authoring-schema.json (dddb872c7725c591e6d056
e0dc73167d3c822f6245ebd2c759a045fecbd43c6e);
docs/exlib2g-plank-content.jsonl and the EXLIB-2I/2J records; and
docs/exlib2f-migration-026-application-record.md ("No catalog
snapshot, import run, run item, or correction row exists" — hosted
evidence only). Contradiction handling: the one candidate
contradiction (2A's approved+revised publishability) was adjudicated
in round 1 — PRESERVED NARROWING, approved-only.

## 8. Field-by-field mapping

Every authored field in docs/exlib2c-authoring-schema.json is mapped
below. "Data API" means reachable by client roles (anon/
authenticated) through Supabase's PostgREST surface: for every row
below the answer is NO for the new objects — RLS is ENABLED with
ZERO policies and ALL privileges are REVOKEd from PUBLIC, anon, and
authenticated on all three new tables and all thirteen functions —
and UNCHANGED for the 023 objects (already closed; delivery happens
only through the reviewed 026 function, whose authenticated EXECUTE
grant is live-proven untouched).

### 8a. Fields already migrated (exercise_catalog and satellites, 023)

Shared attributes: source artifact = migration 023 (applied);
lifecycle owner = the 023 snapshot/claim/review contracts; write
authority = the loader authority (creation, via
load_catalog_snapshot) and otherwise owner-role programs; read
authority = owner-role only; compatibility = untouched by this
proposal.

| Authored field | Existing column / table | Nullability and constraints (023, unchanged) |
|---|---|---|
| proposed_canonical_name | exercise_catalog.canonical_name | NOT NULL, length 1-100, name-claim trigger |
| aliases | exercise_catalog_aliases | 023 alias lifecycle, claim triggers, global lower(alias) uniqueness |
| primary_muscle | exercise_catalog.primary_muscle | NOT NULL, 25-value vocabulary CHECK |
| muscle_targets | exercise_catalog_muscles | 023 anatomy freeze contract (sealed once the snapshot leaves pending) |
| equipment | exercise_catalog.equipment | NOT NULL, 8-value vocabulary CHECK |
| tracking_mode | exercise_catalog.tracking_mode | NOT NULL, 4-value vocabulary CHECK |
| laterality | exercise_catalog.laterality | NOT NULL, 3-value vocabulary CHECK |

### 8b. New columns on exercise_catalog (proposal section 1)

Shared attributes: source artifact = 2A sections 2-3 (vocabularies
verbatim) + the EXLIB-2L instruction + round-1 finding 4; lifecycle
owner = the 023 snapshot freeze contract, extended — the carried
trigger adds all five columns to the immutable list; write authority
= the loader authority at creation; read authority = owner-role
only; Data API = no change.

| Authored field | New column | Nullability / default | Constraints |
|---|---|---|---|
| provenance | exercise_catalog.provenance | NOT NULL DEFAULT 'external_source_derived' | 2-value vocabulary CHECK (auto-named exercise_catalog_provenance_check) |
| movement_pattern | exercise_catalog.movement_pattern | NULLABLE (finding 4), no default | 35-value vocabulary CHECK, 2A-verbatim, NULL-permitting |
| training_role | exercise_catalog.training_role | NULLABLE, no default | 6-value vocabulary CHECK, NULL-permitting |
| difficulty | exercise_catalog.difficulty | NULLABLE, no default | 3-value vocabulary CHECK, NULL-permitting |
| availability | exercise_catalog.availability | NULLABLE, no default | 3-value vocabulary CHECK, NULL-permitting |
| (all four above) | — | required for originals | exercise_catalog_discovery_metadata_chk: forgefitos_original rows must carry all four; ANY row entering the admission workflow must carry all four (manifest gate) |
| source_url / source_page / retrieved_at / import_confidence (existing) | — become NULLable | NOT NULLs dropped | exercise_catalog_provenance_sources_chk: external -> all four present; original -> all four absent; 023 vocabulary CHECK on import_confidence retained |

### 8c. New table exercise_catalog_content (proposal section 2)

Shared attributes: source artifact = 2A section 1 pseudocode +
exlib2c field contract + the EXLIB-2I review-evidence contract + the
EXLIB-2J admission contract + round-1 findings 1-2; write authority
= loader (creation), reviewer (the one review transition), admission
(the one admission transition), publication (the publication
transitions) — each through its own function only, constrained by
the freeze trigger; read authority = owner-role only; Data API = NO;
compatibility = new table.

| Authored field | Column | Nullability / default | Constraints / lifecycle owner |
|---|---|---|---|
| (identity) | id | UUID PK | immutable from birth (trigger) |
| (identity) | logical_id | NOT NULL, FK exercise_catalog_logical ON DELETE RESTRICT | immutable; indexed |
| (identity) | content_version | INTEGER NOT NULL > 0 | immutable; UNIQUE (logical_id, content_version) |
| authored_by / authored_at | same names | TEXT NOT NULL non-blank / DATE NOT NULL | frozen at the review decision |
| setup_steps / execution_steps / common_mistakes | same names | JSONB NOT NULL, array CHECKs | editable only while pending; frozen at decision |
| breathing_cue / safety_guidance | same names | TEXT NOT NULL, non-blank | editable only while pending; frozen at decision |
| equipment_setup / accessibility_alternative | same names | TEXT NULL (optional) | editable only while pending; frozen at decision |
| content_review.status | content_status | NOT NULL DEFAULT 'pending', 4-value CHECK | the reviewer authority applies the one pending decision; one-way transitions trigger-enforced with complete fresh evidence |
| content_review.reviewer / reviewed_at / rationale | reviewed_by / reviewed_at / review_rationale | NULL until decided | review-audit CHECK: complete non-blank evidence exactly when decided (the 023 pattern) |
| import_eligible | import_admitted + admitted_fingerprint + admitted_source_sha256 + admitted_at | NOT NULL DEFAULT false / NULL x3 | admission CHECK: all-or-nothing with 64-hex SHA-256 shape on BOTH digests; admission-order CHECK: never while pending; one-time one-way transition owned by the admission authority; fingerprint COMPUTED from database state and trigger-reverified |
| (no authored counterpart) | publication_status | NOT NULL DEFAULT 'draft', 3-value CHECK | the publication authority owns it; one-way draft -> published -> retired; publication CHECK: published requires approved AND admitted; at most ONE published per identity (partial unique index); the trigger's publication branch structurally verifies projected-set equality and manifest freshness |
| (bookkeeping) | created_at / updated_at | NOT NULL DEFAULT NOW() | created_at immutable; updated_at trigger (001 helper) |

### 8d. New tables for relationships (proposal sections 2b and 3)

Shared attributes: Data API = NO (RLS enabled, zero policies, REVOKE
ALL); compatibility = new tables.

| Authored field | Representation | Constraints / lifecycle owner |
|---|---|---|
| substitutions[] / regressions[] / progressions[] (declared) | exercise_catalog_content_expected_relationships: one row per (content_id, relation, to_logical_id) | the SOURCE OF TRUTH; written by the loader authority with the draft; PK-deterministic; RESTRICT FKs; no self-expectation; rows immutable; insert/delete only while the owner version is pending (freeze trigger, Revision-G lock pattern); frozen at review |
| substitutions[] / regressions[] / progressions[] (live) | exercise_catalog_relationships: (from_logical_id, to_logical_id, relation) | the PROTECTED PROJECTION; 2A-verbatim shape, keys, and consumer meaning; rows exist only as the atomic projection of the published version's expected set, written inside publish_catalog_content under its transaction-local sentinel; every other write path (including owner break-glass) fails closed at the projection trigger |

Authored relationships are NAME strings; the schema is keyed by
LOGICAL IDENTITY. Resolution (name -> logical_id) is a load-time
concern that fails closed by construction. This is NOT an
identity-only stub shortcut: exercise_catalog_logical is the
promoted 023 first-class identity object, so referencing a real
logical identity row IS the promoted architecture's own mechanism —
and no target content is approved, admitted, loaded, or published
merely to satisfy the foreign keys.

### 8e. Authored fields with deliberately NO database column

| Authored field | Why no column |
|---|---|
| review_status (authoring-record axis) | an independent authoring-pipeline axis (EXLIB-2J record, section 5). Its current value "proposed" is NOT part of the 023 snapshot vocabulary, so it does NOT map onto exercise_catalog.review_status; database snapshots are born 'pending' by the 023 birth contract regardless. How a future load milestone accounts for this axis is that milestone's reviewed concern; nothing here loads or converts it. |
| deferred / deferred_reason | authoring-batch planning bookkeeping; never loads. |
| provenance-history comment lines | artifact commentary, not schema fields. |

## 9. Disclosed deviations and extensions vs promoted 2A

1. PRESERVED NARROWING (adjudicated round 1): only
   content_status = 'approved' may publish; revised/rejected
   terminal.
2. EXTENSION: the publication CHECK additionally requires
   import_admitted (published implies approved AND admitted).
3. EXTENSION: the expected-relationships table and the admission
   manifest (round-1 findings 2-3).
4. EXTENSION (round 2): exercise_catalog_relationships is a
   trigger-protected projection owned by the publication transition;
   shape, keying, and consumer meaning stay 2A-verbatim, only the
   write path narrows.
5. EXTENSION (round 2): four operational authorities as NOLOGIN
   roles + narrow SECURITY DEFINER functions (2A named only the
   publication boundary role, preserved verbatim for publication).
6. COMPATIBILITY DEVIATION: the four discovery-metadata columns are
   NULLABLE (round-1 finding 4); required-ness is enforced for
   forgefitos_original rows and at workflow entry instead.

## 10. What this proposal deliberately does NOT do

No migration 027 is created; migrations 001-026 are byte-untouched.
No hosted or persistent database is contacted or changed. No catalog
content, relationship, expected relationship, run, membership,
review decision, approval, admission, seal, publication, revocation,
or delivery is created or authorized. The Plank content, its human
review, its eligibility admission, the seed (bodyweight),
seed_link_compatible (false), the inventory, and the ledger are all
byte-unchanged. No runtime, API, or UI code changes. Applying the
proposal (if later approved) still loads NOTHING — live-proven:
after application to the EMPTY database, every catalog table holds
zero rows and no lifecycle state exists.
