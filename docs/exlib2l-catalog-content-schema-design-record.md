# EXLIB-2L — catalog-content and relationship schema: design record

Recorded 2026-09-02 (UTC); CORRECTED REVISION B applying the four
blocking Codex round-1 findings. LOCAL-ONLY design milestone. This
record documents the design of
docs/exlib2l-catalog-content-schema-proposal.sql (63,231 B, SHA-256
e42e08f259eda16173db06048b0e930056e0e7631895fa8382768cf68999b0de),
an UNAPPROVED implementation proposal that lives in docs/ and is NOT
a migration. Nothing here creates supabase/migrations/027, applies
anything to any hosted or persistent database, loads catalog
content, approves, admits, seals, publishes, revokes, or delivers
anything, or changes the Plank content, its human review, its
eligibility, the seed, the inventory, or the ledger. Migrations
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

## 2. The corrected lifecycle (Codex round-1 finding 1)

Revision A's trigger required admission WHILE PENDING and froze
admission fields at the review decision — the REVERSE of the promoted
lifecycle actually executed in EXLIB-2I (human approval of the exact
payload) then EXLIB-2J (a later, separately authorized R6 admission
of that exact approved payload). Revision B enforces the true order,
in the trigger AND in structural CHECKs AND in the dedicated
functions:

1. AUTHORING: a version is born pending, draft, NOT admitted
   (born-unadmitted is trigger-enforced at INSERT; a pending version
   can never be admitted — exercise_catalog_content_admission_order_chk).
   Pending prose and the version's EXPECTED relationship set are
   editable.
2. HUMAN REVIEW: the review transition (one-way, complete fresh
   non-blank evidence) freezes the reviewed payload — prose,
   authorship, AND the expected relationship set (its own freeze
   trigger refuses insert/delete once the owner is decided; UPDATE
   is never allowed). A review transition cannot smuggle payload or
   admission changes.
3. ADMISSION (later, separate, one-time): only an APPROVED, DRAFT,
   currently-UNADMITTED version may receive its admission. The
   transition travels alone (nothing else may change), cannot
   precede approval, cannot target pending/revised/rejected/
   published/retired content (published and retired versions already
   carry their one-way admission, so "newly admitted" is doubly
   impossible for them), and is ONE-WAY: it can be neither revoked
   nor re-recorded, and admission fields never change outside this
   single transition.
4. PUBLICATION (still later, separate): one-way
   draft -> published -> retired, traveling alone, with structural
   completeness and freshness gates (sections 3-4).

Any content correction requires a NEW content version, new human
review, and new admission — proven live (payload frozen at decision;
admission one-way; version identity immutable).

AUTHORITIES: loading (row insertion) and human-review application
remain owner-role reviewed-program acts with no function grants and
no client grants of any kind; eligibility admission belongs
EXCLUSIVELY to the new NOLOGIN role exlib_catalog_admission through
admit_catalog_content; publication belongs EXCLUSIVELY to the
promoted 2A role exlib_catalog_admin through publish_catalog_content.
Neither role holds the other's function (live-proven both
directions), neither holds any table privilege, and ordinary
anon/authenticated clients hold none of the four authorities and no
table access at all.

## 3. The admission manifest (Codex round-1 finding 2)

HONEST CORRECTION: revision A's exlib_content_fingerprint was MD5
over selected instructional fields ONLY. It did NOT bind the
complete EXLIB-2J admitted artifact, and no claim to the contrary is
made or preserved. It is REPLACED by a versioned canonical manifest.

exlib_content_admission_manifest(content_id) builds the canonical
text (leading literal 'EXLIB-ADMISSION-MANIFEST v1') FROM DATABASE
STATE, and exlib_content_admission_fingerprint(content_id) returns
its SHA-256 (lowercase hex; never MD5 — live-proven no md5 call
exists in any new function). Bound surfaces, one manifest section
each:

| Manifest line | Binds | Source rows |
|---|---|---|
| identity | the logical identity UUID | exercise_catalog_logical via content.logical_id |
| snapshot | catalog_version, canonical_name, category, primary_muscle, equipment, laterality, tracking_mode, provenance, movement_pattern, training_role, difficulty, availability, source_url, source_page, retrieved_at, import_confidence | THE single ACTIVE exercise_catalog snapshot (uniqueness guaranteed by 023's exercise_catalog_one_active_logical_idx; the manifest RAISES on zero or duplicate actives and on NULL discovery metadata) |
| anatomy | (muscle, role) rows | exercise_catalog_muscles of that snapshot, ordered by muscle COLLATE "C" |
| alias | alias rows | exercise_catalog_aliases of the identity, ordered by alias COLLATE "C" |
| content | content_version, authored_by, authored_at, all seven authored payload fields | the content row (the review-bound version) |
| review | content_status + complete review evidence | the content row |
| expected | the version-owned expected relationship set | exercise_catalog_content_expected_relationships, ordered by (relation COLLATE "C", to_logical_id) |
| relation | the identity's LIVE relationship set | exercise_catalog_relationships, same ordering |

DETERMINISM RULES (each live-proven): every variable text field is
hex-encoded from UTF8 bytes ('S'+hex, or 'N' for NULL — no value can
inject a delimiter); JSONB serializes through jsonb's canonical form
(key order normalized — live-proven with a reordered-keys equality);
DATE values are integer day offsets from 1970-01-01 (date_out is
only STABLE and DateStyle really changes it); TIMESTAMPTZ values are
numeric epoch seconds (timezone-independent); row aggregation is
pinned to COLLATE "C" byte order so locale cannot reorder rows; the
fingerprint is identical under different DateStyle and TimeZone GUCs
and under committed reverse-order relationship re-insertion. The
manifest functions are STABLE, not IMMUTABLE (they read database
state; revision A's IMMUTABLE-marked, session-dependent date::text
fingerprint was one of its corrected defects).

TWO DISTINCT DIGESTS are stored on the admitted row:
- admitted_fingerprint: the database-normalized manifest SHA-256,
  COMPUTED by admit_catalog_content and INDEPENDENTLY RECOMPUTED by
  the freeze trigger at the admission transition — a caller-invented
  hash cannot land even through a direct owner-level write
  (live-proven).
- admitted_source_sha256: the exact repository source artifact
  SHA-256 (for the real Plank act: the 2,928-byte artifact digest
  d8207849...), recorded as provenance evidence and format-validated
  (64 lowercase hex; MD5-shaped digests are refused). The database
  cannot read repository bytes, so this digest is a RECORDED FACT,
  not a computed one — disclosed plainly; the artifact-to-database
  mapping is documented in the table above and MECHANICALLY PROVEN
  by the live suite (the manifest of a fixture contains the exact
  hex encoding of every surface's authored values: identity,
  classification, discovery metadata, anatomy, alias, content,
  authorship, review evidence, expected set, live set).

Publication recomputes the complete manifest fingerprint and fails
closed on ANY bound change or omission: a post-admission alias
insert (STALE), a post-admission review flip (refused by status and
stale by manifest), and a deactivated bound snapshot (the manifest
itself RAISES — a MISSING bound surface, not merely a changed one)
are each live-proven. A stale or partial admission can never
publish, through the function OR through a direct owner-level write
(the trigger enforces the same gate structurally).

## 4. Relationship completeness (Codex round-1 finding 3)

Revision A's publication check only rejected malformed relationship
rows — conditions the FKs and self-link CHECK already make
impossible — so an entirely OMITTED required relationship was
invisible. Revision B makes completeness provable by giving each
content version an EXPECTED relationship set
(exercise_catalog_content_expected_relationships):

- authored while the version is pending (the loader will write it
  from the authored artifact's substitutions/regressions/
  progressions arrays); frozen by the review decision; rows
  immutable, PK-deterministic, RESTRICT FKs to real logical
  identities, self-expectation refused;
- ADMISSION requires the identity's LIVE set to equal the version's
  expected set EXACTLY (missing expected relationship and unexpected
  live relationship each refused, both directions live-proven) and
  binds BOTH sets into the manifest;
- PUBLICATION re-proves exact equality (precise missing/unexpected
  errors) AND recomputes the manifest — in the FUNCTION and,
  structurally, in the TRIGGER's publication branch, so a direct
  owner-level publish cannot bypass completeness or freshness;
- the Plank model therefore publishes ONLY with exactly
  substitution -> "Dead bug"-model target and progression ->
  "Ab wheel rollout"-model target present: either one missing, an
  extra one, or swapped types each fail publication (live-proven);
  the target identities need NO snapshot, NO content, NO admission,
  and NO publication of their own (live-proven zeros);
- removing or changing a relationship after admission makes the
  admission STALE (manifest) and the set unequal (completeness) —
  publication fails closed on both;
- multiplicities: both tables are PK-sets, so per-(relation, target)
  multiplicity is structurally 0-or-1 and exact set equality IS
  exact multiset equality;
- VERSION ISOLATION: expected sets are owned per content version, so
  a live-set change that serves a newer version makes every other
  admitted version's publication fail CLOSED (missing-relationship +
  stale manifest, live-proven) instead of silently altering its
  meaning.

This preserves the promoted logical-identity target model exactly
(exercise_catalog_relationships is 2A-verbatim) and adds the minimum
version-owned expectation table needed for provable completeness —
disclosed as an extension in the proposal header.

## 5. Nonempty-catalog compatibility (Codex round-1 finding 4)

Revision A added the four discovery-metadata columns NOT NULL
without defaults — it applied only because the disposable and hosted
catalogs happened to hold zero rows. Revision B treats "hosted
currently has zero rows" as hosted-instance evidence only, NOT as
generic migration compatibility, and adopts the fail-closed
NULLABLE-legacy design:

- movement_pattern, training_role, difficulty, availability are
  added NULLABLE with NULL-permitting vocabulary CHECKs (bare
  IN-list CHECKs pass NULL by SQL semantics — deliberate and
  documented in the proposal);
- forgefitos_original rows MUST carry all four
  (exercise_catalog_discovery_metadata_chk) and MUST NOT carry any
  source/import-confidence value
  (exercise_catalog_provenance_sources_chk);
- external rows keep their EXACT 023 meaning: all four source fields
  remain REQUIRED for them (every pre-existing row already has them
  NOT NULL under 023, so the constraint validates on any legitimate
  nonempty database), and their discovery metadata stays NULL rather
  than invented — no placeholder values, no deterministic backfill
  (the promoted contract supplies no unambiguous mapping from
  existing columns, so a backfill would be fabrication);
- WORKFLOW ENTRY is the fail-closed completeness gate: the admission
  manifest RAISES on NULL discovery metadata, so a legacy external
  snapshot cannot be admitted or published against until a complete
  NEW catalog version row exists (the carried freeze trigger keeps
  legacy NULLs immutable in place — corrections require a new
  version row, exactly the 023 rule);
- the live suite seeds a legitimate NONEMPTY 023 external catalog
  (complete NOT NULL sources, anatomy, alias, an approved SEALED
  run) BEFORE applying the proposal, then proves: clean application
  over BOTH the nonempty and the empty database; every pre-existing
  023 column of every legacy row BYTE-IDENTICAL (md5 digest over all
  023 columns, before vs after); metadata NULL and provenance
  defaulted, nothing fabricated; sources still required; original
  rows forbid sources and require metadata; the legacy row refused
  at the workflow gate; and unchanged 026 DELIVERY and ROLLBACK
  running successfully on the historical rows AFTER application.

## 6. Authoritative contract derivation

Sources, in the precedence used (each byte-frozen on promoted main,
tip 2a0465e8be5ec2e33a41fde8f30d5fcd5a2de738): the EXLIB-2L
instruction and the Codex round-1 corrective instruction
(operator-supplied, most specific and latest);
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
evidence only, per finding 4).

CONTRADICTION HANDLING (the instruction's fail-closed clause): one
candidate contradiction was found and adjudicated rather than
stopped on — promoted 2A makes both 'approved' and 'revised'
publishable, while the EXLIB-2L instruction and 023's terminal
'revised' semantics require 'approved' alone. It is not a
contradiction BETWEEN promoted artifacts (2A is internally
consistent), the instruction itself supplies the resolution, and
Codex round 1 has now adjudicated the narrowing: PRESERVED.

## 7. Field-by-field mapping

Every authored field in docs/exlib2c-authoring-schema.json is mapped
below. "Data API" means reachable by client roles (anon/
authenticated) through Supabase's PostgREST surface: for every row
below the answer is NO for the new objects — RLS is ENABLED with
ZERO policies and ALL privileges are REVOKEd from PUBLIC, anon, and
authenticated on all three new tables and all new functions — and
UNCHANGED for the 023 objects (already closed; delivery happens only
through the reviewed 026 function, whose authenticated EXECUTE grant
is live-proven untouched).

### 7a. Fields already migrated (exercise_catalog and satellites, 023)

Shared attributes: source artifact = migration 023 (applied);
lifecycle owner = the 023 snapshot/claim/review contracts; write
authority = owner-role programs only (the reviewed load path); read
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

### 7b. New columns on exercise_catalog (proposal section 1)

Shared attributes: source artifact = 2A sections 2-3 (vocabularies
verbatim) + the EXLIB-2L instruction + Codex round-1 finding 4;
lifecycle owner = the 023 snapshot freeze contract, extended — the
carried trigger adds all five columns to the immutable list, so
corrections (including completing legacy NULLs) require a new
catalog version row; write authority = owner-role load programs only
(none exists yet); read authority = owner-role only; Data API = no
change.

| Authored field | New column | Nullability / default | Constraints |
|---|---|---|---|
| provenance | exercise_catalog.provenance | NOT NULL DEFAULT 'external_source_derived' | 2-value vocabulary CHECK (auto-named exercise_catalog_provenance_check) |
| movement_pattern | exercise_catalog.movement_pattern | NULLABLE (finding 4), no default | 35-value vocabulary CHECK, 2A-verbatim, NULL-permitting |
| training_role | exercise_catalog.training_role | NULLABLE, no default | 6-value vocabulary CHECK, NULL-permitting |
| difficulty | exercise_catalog.difficulty | NULLABLE, no default | 3-value vocabulary CHECK, NULL-permitting |
| availability | exercise_catalog.availability | NULLABLE, no default | 3-value vocabulary CHECK, NULL-permitting |
| (all four above) | — | required for originals | exercise_catalog_discovery_metadata_chk: forgefitos_original rows must carry all four; ANY row entering the admission workflow must carry all four (manifest gate) |
| source_url (existing) | — becomes NULLable | NOT NULL dropped | exercise_catalog_provenance_sources_chk: external -> all four sources present; original -> all four absent |
| source_page (existing) | — becomes NULLable | NOT NULL dropped | same conditional constraint |
| retrieved_at (existing) | — becomes NULLable | NOT NULL dropped | same conditional constraint |
| import_confidence (existing) | — becomes NULLable | NOT NULL dropped | same conditional constraint; 023 vocabulary CHECK retained |

### 7c. New table exercise_catalog_content (proposal section 2)

Shared attributes: source artifact = 2A section 1 pseudocode +
exlib2c field contract + the EXLIB-2I review-evidence contract + the
EXLIB-2J admission contract + Codex round-1 findings 1-2; write
authority = owner-role programs only, constrained by the freeze
trigger, with the admission transition additionally reachable
through the dedicated admission function; read authority =
owner-role only; Data API = NO; compatibility = new table.

| Authored field | Column | Nullability / default | Constraints / lifecycle owner |
|---|---|---|---|
| (identity) | id | UUID PK, gen_random_uuid() | immutable from birth (trigger) |
| (identity) | logical_id | NOT NULL, FK exercise_catalog_logical ON DELETE RESTRICT | immutable; indexed |
| (identity) | content_version | INTEGER NOT NULL > 0 | immutable; UNIQUE (logical_id, content_version) |
| authored_by | authored_by | TEXT NOT NULL, non-blank CHECK | frozen at the review decision |
| authored_at | authored_at | DATE NOT NULL | frozen at the review decision |
| setup_steps / execution_steps / common_mistakes | same names | JSONB NOT NULL, array CHECKs | editable only while pending; frozen at decision |
| breathing_cue / safety_guidance | same names | TEXT NOT NULL, non-blank | editable only while pending; frozen at decision |
| equipment_setup / accessibility_alternative | same names | TEXT NULL (optional) | editable only while pending; frozen at decision |
| content_review.status | content_status | NOT NULL DEFAULT 'pending', 4-value CHECK | human review owns it; one-way transitions, trigger-enforced, complete fresh evidence |
| content_review.reviewer / reviewed_at / rationale | reviewed_by / reviewed_at / review_rationale | NULL until decided | review-audit CHECK: complete non-blank evidence exactly when decided (the 023 pattern) |
| import_eligible | import_admitted + admitted_fingerprint + admitted_source_sha256 + admitted_at | NOT NULL DEFAULT false / NULL / NULL / NULL | admission CHECK: all-or-nothing with 64-hex SHA-256 shape on BOTH digests; admission-order CHECK: never while pending; one-time one-way trigger transition owned by exlib_catalog_admission; fingerprint COMPUTED from database state and trigger-reverified |
| (no authored counterpart) | publication_status | NOT NULL DEFAULT 'draft', 3-value CHECK | publication function + trigger own it; one-way draft -> published -> retired; publication CHECK: published requires approved AND admitted; at most ONE published per identity (partial unique index); structural completeness + staleness gate in the trigger |
| (bookkeeping) | created_at / updated_at | NOT NULL DEFAULT NOW() | created_at immutable; updated_at trigger (001 helper) |

### 7d. New tables for relationships (proposal sections 2b and 3)

Shared attributes: write/read authority = owner-role only; Data API
= NO (RLS enabled, zero policies, REVOKE ALL); compatibility = new
tables.

| Authored field | Representation | Constraints / lifecycle owner |
|---|---|---|
| substitutions[] / regressions[] / progressions[] (declared) | exercise_catalog_content_expected_relationships: one row per (content_id, relation, to_logical_id) | PK-deterministic; RESTRICT FKs; no self-expectation; rows immutable; insert/delete only while the owner version is pending (freeze trigger, Revision-G lock pattern); source artifact = the authored arrays |
| substitutions[] / regressions[] / progressions[] (live) | exercise_catalog_relationships: (from_logical_id, to_logical_id, relation) | 2A-verbatim: RESTRICT FKs, PK uniqueness, self-link CHECK, 3-value relation CHECK; completeness proven against the expected set at admission and publication |

Authored relationships are NAME strings; the schema is keyed by
LOGICAL IDENTITY. Resolution (name -> logical_id) is a load-time
concern that fails closed by construction: a missing target has no
logical_id to reference, and the FKs reject fabrication. This is NOT
an identity-only stub shortcut: exercise_catalog_logical is the
promoted 023 first-class identity object (snapshots, corrections,
aliases, and content all key on it, and identities are born before
and independently of any snapshot), so referencing a real logical
identity row IS the promoted architecture's own mechanism — nothing
weaker was invented, and no target content is approved, admitted,
loaded, or published merely to satisfy the foreign keys.

### 7e. Authored fields with deliberately NO database column

| Authored field | Why no column |
|---|---|
| review_status (authoring-record axis) | an independent authoring-pipeline axis (EXLIB-2J record, section 5). Its current value "proposed" is NOT part of the 023 snapshot vocabulary (pending/approved/revised/rejected), so it does NOT map onto exercise_catalog.review_status: database snapshots are born 'pending' by the 023 birth contract regardless of the artifact's pipeline state. How a future load milestone accounts for this axis is that milestone's reviewed concern; the 2L contract requires no column for it, and nothing here loads or converts it. |
| deferred / deferred_reason | authoring-batch planning bookkeeping; never loads. |
| provenance-history comment lines | artifact commentary, not schema fields. |

## 8. Disclosed deviations and extensions vs promoted 2A

1. PRESERVED NARROWING (Codex round 1: keep): only
   content_status = 'approved' may publish; pending, revised, and
   rejected are never publishable; revised remains terminal and
   requires a new version and new approval.
2. EXTENSION: the publication CHECK additionally requires
   import_admitted (published implies approved AND admitted,
   structurally).
3. EXTENSION: the expected-relationships table and the admission
   manifest (findings 2-3); 2A had no completeness ownership and an
   instructional-fields-only fingerprint sketch.
4. EXTENSION: the dedicated admission authority
   (exlib_catalog_admission + admit_catalog_content), distinct from
   2A's exlib_catalog_admin publication authority.
5. COMPATIBILITY DEVIATION: the four discovery-metadata columns are
   NULLABLE (finding 4); required-ness is enforced for
   forgefitos_original rows and at workflow entry instead.

## 9. Coverage of the required proposal sections

- A. Provenance compatibility: sections 5 and 7b (proposal §1).
- B. exercise_catalog_content: sections 2 and 7c (proposal §§2, 2d).
- C. exercise_catalog_relationships + completeness: sections 4 and
  7d (proposal §§2b, 3).
- D. Admission and publication functions: sections 2-4 (proposal
  §4) — SECURITY DEFINER with pinned search_path; row-locked;
  admission computes its fingerprint from database state;
  publication proves exact relationship completeness and manifest
  freshness; EXECUTE revoked from PUBLIC/anon/authenticated and
  granted only to the single owning role each; no user-editable JWT
  metadata is read anywhere.
- E. RLS/ACL posture: all three new tables RLS-enabled with zero
  policies; REVOKE ALL from PUBLIC/anon/authenticated on tables and
  all new functions; no service_role reference; no bare
  TO-authenticated authorization; 026's authenticated delivery grant
  untouched (live-proven).
- F. Rollback/compatibility: proposal §5 — pre-use rollback drop
  sequence naming both explicit constraints; once any dependent row
  exists, rollback is a reviewed data operation; ONE explicit
  transaction (023/024/025 convention) so a duplicate application
  rolls back WHOLLY (apply-exactly-once, live-proven on the empty
  database); deliberately NOT idempotent except the pg_roles-guarded
  role pair (the guard is live-proven by the second database's clean
  application); nonempty-catalog behavior per section 5.

## 10. What this proposal deliberately does NOT do

No migration 027 is created; migrations 001-026 are byte-untouched.
No hosted or persistent database is contacted or changed. No catalog
content, relationship, expected relationship, run, membership,
approval, admission, seal, publication, revocation, or delivery is
created or authorized. The Plank content, its human review, its
eligibility admission, the seed (bodyweight), seed_link_compatible
(false), the inventory, and the ledger are all byte-unchanged. No
runtime, API, or UI code changes. Applying the proposal (if later
approved) still loads NOTHING — live-proven: after application to
the EMPTY database, every catalog table holds zero rows and no
lifecycle state exists.
