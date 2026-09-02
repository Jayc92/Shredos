# EXLIB-2L — catalog-content and relationship schema: design record

Recorded 2026-09-02 (UTC). LOCAL-ONLY design milestone. This record
documents the design of docs/exlib2l-catalog-content-schema-proposal.sql
(33,213 B, SHA-256
df98e085eab21fd6e4074531efea5d9ae54daff603cde52da0e33e2b621a0639), an
UNAPPROVED implementation proposal that lives in docs/ and is NOT a
migration. Nothing here creates supabase/migrations/027, applies
anything to any hosted or persistent database, loads catalog content,
approves, seals, publishes, revokes, or delivers anything, or changes
the Plank content, its relationships, the seed, eligibility, review
evidence, or the ledger. Migrations remain exactly 001-026. This
record APPROVES NOTHING; it is Claude-authored and awaits Codex
review, and only Joseph/ChatGPT may ever apply migrations.

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

## 2. Authoritative contract derivation

Sources, in the precedence used (each byte-frozen on promoted main,
tip 2a0465e8be5ec2e33a41fde8f30d5fcd5a2de738):

- The EXLIB-2L instruction (operator-supplied, most specific and
  latest).
- docs/exlib2a-catalog-architecture-record.md (25,471 B,
  de825ddf18260a877651e426c8436709257c9100e3dfcbd994e3b9e2496191d8)
  — the promoted catalog architecture: content model pseudocode,
  vocabularies, RLS/ACL posture, freeze conventions, and the
  publish_catalog_content lifecycle.
- supabase/migrations/023_exlib_catalog_and_delivery_contract.sql
  (92,806 B, 0991448c39a558385431c78cef6d6063df208312a3f53866756ba7
  30066c42f2, REVISION H, APPLIED to hosted 2026-08-24) — the
  committed catalog tables, triggers, and review contract this
  proposal extends; also migrations 024-026 for the delivery
  surface that must remain untouched.
- docs/exlib2c-authoring-schema.json (dddb872c7725c591e6d056e0dc73
  167d3c822f6245ebd2c759a045fecbd43c6e) — the authored-content field
  contract (names, types, vocabularies, R6).
- docs/exlib2g-plank-content.jsonl and the EXLIB-2I/2J records — the
  one existing authored record and the human-review and
  fingerprint-bound-admission contracts the schema must be able to
  represent without loss or invention.
- docs/exlib2f-migration-026-application-record.md — hosted-state
  evidence: "No catalog snapshot, import run, run item, or
  correction row exists," which is what makes the NOT NULL metadata
  additions exact (zero existing rows to backfill).

CONTRADICTION HANDLING (the instruction's fail-closed clause): the
clause requires stopping before authoring SQL "if the promoted
artifacts contradict each other materially or leave a
security/lifecycle choice unresolved." One candidate contradiction
was found and adjudicated rather than stopped on, because it is NOT
a contradiction between promoted artifacts: promoted 2A is
internally consistent in making both 'approved' and 'revised'
publishable, and the resolution is supplied by the instruction
itself plus migration 023's committed semantics. See section 4 (the
one disclosed deviation). No promoted artifact contradicts another
promoted artifact materially, and no security or lifecycle choice
was left unresolved; therefore authoring proceeded.

## 3. Field-by-field mapping

Every authored field in docs/exlib2c-authoring-schema.json is mapped
below. "Data API" means reachable by client roles (anon/
authenticated) through Supabase's PostgREST surface: for every row
below the answer is NO for the new objects — RLS is ENABLED with
ZERO policies and ALL privileges are REVOKEd from PUBLIC, anon, and
authenticated — and UNCHANGED for the 023 objects (already closed;
delivery happens only through the reviewed 026 function).

### 3a. Fields already migrated (exercise_catalog and satellites, 023)

Shared attributes: source artifact = migration 023 (applied);
lifecycle owner = the 023 snapshot/claim/review contracts; write
authority = owner-role programs only (the reviewed load path);
read authority = owner-role only; compatibility = untouched by this
proposal.

| Authored field | Existing column / table | Nullability and constraints (023, unchanged) |
|---|---|---|
| proposed_canonical_name | exercise_catalog.canonical_name | NOT NULL, length 1-100, name-claim trigger |
| aliases | exercise_catalog_aliases | 023 alias lifecycle, claim triggers |
| primary_muscle | exercise_catalog.primary_muscle | NOT NULL, 25-value vocabulary CHECK |
| muscle_targets | exercise_catalog_muscles | 023 anatomy freeze contract |
| equipment | exercise_catalog.equipment | NOT NULL, 8-value vocabulary CHECK |
| tracking_mode | exercise_catalog.tracking_mode | NOT NULL, 4-value vocabulary CHECK |
| laterality | exercise_catalog.laterality | NOT NULL, 3-value vocabulary CHECK |

### 3b. New columns on exercise_catalog (proposal section 1)

Shared attributes: source artifact = 2A sections 2-3 (vocabularies
verbatim) + the EXLIB-2L instruction (provenance-conditional
metadata); lifecycle owner = the 023 snapshot freeze contract,
extended — the carried trigger adds all five columns to the
immutable list, so corrections require a new catalog version row;
write authority = owner-role load programs only (none exists yet);
read authority = owner-role only; Data API = no change (catalog was
already closed to clients).

| Authored field | New column | Nullability / default | Constraints |
|---|---|---|---|
| provenance | exercise_catalog.provenance | NOT NULL DEFAULT 'external_source_derived' | 2-value vocabulary CHECK (auto-named exercise_catalog_provenance_check) |
| movement_pattern | exercise_catalog.movement_pattern | NOT NULL, no default | 35-value vocabulary CHECK, 2A-verbatim |
| training_role | exercise_catalog.training_role | NOT NULL, no default | 6-value vocabulary CHECK |
| difficulty | exercise_catalog.difficulty | NOT NULL, no default | 3-value vocabulary CHECK |
| availability | exercise_catalog.availability | NOT NULL, no default | 3-value vocabulary CHECK |
| source_url (existing) | — becomes NULLable | NOT NULL dropped | governed by exercise_catalog_provenance_sources_chk |
| source_page (existing) | — becomes NULLable | NOT NULL dropped | same conditional constraint |
| retrieved_at (existing) | — becomes NULLable | NOT NULL dropped | same conditional constraint |
| import_confidence (existing) | — becomes NULLable | NOT NULL dropped | same conditional constraint; 023 vocabulary CHECK retained |

The conditional constraint exercise_catalog_provenance_sources_chk
requires ALL FOUR discovery fields for external_source_derived rows
and ALL FOUR NULL for forgefitos_original rows: external provenance
is not weakened, and original provenance can never carry fabricated
sources. The name is deliberately distinct from the auto-named
vocabulary CHECK because the EXLIB-1C0B1 audit found near-identical
constraint names defeat name discovery during rollback.

COMPATIBILITY FOR EXISTING EXTERNAL-IMPORT ROWS: the hosted catalog
holds ZERO rows (2F application evidence), so no backfill occurs and
the no-default NOT NULL additions are exact. If rows unexpectedly
existed, application would fail closed (ADD COLUMN NOT NULL without
default errors) rather than fabricate values. Hypothetical future
external rows are fully compatible: provenance defaults to
external_source_derived and complete source metadata satisfies the
conditional CHECK unchanged — proven live (suite items F3/F6).

### 3c. New table exercise_catalog_content (proposal section 2)

Shared attributes: source artifact = 2A section 1 pseudocode
(carried verbatim in shape) + exlib2c field contract + the EXLIB-2I
review-evidence contract + the EXLIB-2J fingerprint-bound admission
contract; write authority = owner-role programs only, and even those
are constrained by the freeze trigger; read authority = owner-role
only; Data API = NO (RLS enabled, zero policies, REVOKE ALL from
PUBLIC/anon/authenticated); compatibility = new table, no existing
rows anywhere.

| Authored field | Column | Nullability / default | Constraints / lifecycle owner |
|---|---|---|---|
| (identity) | id | UUID PK, gen_random_uuid() | immutable from birth (trigger) |
| (identity) | logical_id | NOT NULL, FK exercise_catalog_logical ON DELETE RESTRICT | immutable; indexed |
| (identity) | content_version | INTEGER NOT NULL > 0 | immutable; UNIQUE (logical_id, content_version) |
| authored_by | authored_by | TEXT NOT NULL, non-blank CHECK | frozen once decided |
| authored_at | authored_at | DATE NOT NULL | frozen once decided |
| setup_steps | setup_steps | JSONB NOT NULL | jsonb_typeof = 'array'; editable only while pending |
| execution_steps | execution_steps | JSONB NOT NULL | array CHECK; editable only while pending |
| breathing_cue | breathing_cue | TEXT NOT NULL, non-blank | editable only while pending |
| common_mistakes | common_mistakes | JSONB NOT NULL | array CHECK; editable only while pending |
| safety_guidance | safety_guidance | TEXT NOT NULL, non-blank | editable only while pending |
| equipment_setup | equipment_setup | TEXT NULL (optional) | editable only while pending |
| accessibility_alternative | accessibility_alternative | TEXT NULL (optional) | editable only while pending |
| content_review.status | content_status | NOT NULL DEFAULT 'pending', 4-value CHECK | human review owns it; one-way transitions (pending -> approved/revised/rejected; approved -> revised/rejected), trigger-enforced |
| content_review.reviewer | reviewed_by | NULL until decided | review-audit CHECK: complete non-blank evidence exactly when decided (the 023 pattern, byte-for-byte logic) |
| content_review.reviewed_at | reviewed_at | NULL until decided | same CHECK |
| content_review.rationale | review_rationale | NULL until decided | same CHECK |
| import_eligible | import_admitted + admitted_fingerprint + admitted_at | NOT NULL DEFAULT false / NULL / NULL | admission CHECK: all-or-nothing (a bare boolean can never read as admitted); EXLIB-2J-style separately approved act owns it; frozen once decided |
| (no authored counterpart) | publication_status | NOT NULL DEFAULT 'draft', 3-value CHECK | publication function owns it; one-way draft -> published -> retired; publication_chk (only approved publishes); partial unique index: at most ONE published per logical identity |
| (bookkeeping) | created_at / updated_at | NOT NULL DEFAULT NOW() | created_at immutable; updated_at trigger (001 helper) |

The import_eligible mapping is deliberately richer than a boolean:
EXLIB-2J bound eligibility to an exact payload fingerprint, so the
schema stores the admitted fingerprint and date, and
publish_catalog_content recomputes the fingerprint
(exlib_content_fingerprint, IMMUTABLE, DateStyle-independent by
folding authored_at in as a day offset — never date::text, whose
output is only STABLE) and fails closed on any drift (STALE
admission). Content edited after admission cannot publish.

### 3d. New table exercise_catalog_relationships (proposal section 3)

Shared attributes: source artifact = 2A section 4 (verbatim shape)
+ exlib2c relationship arrays; lifecycle owner = the reviewed load
path (rows are inserted only by owner-role programs after name ->
logical-identity resolution); write/read authority = owner-role
only; Data API = NO (RLS enabled, zero policies, REVOKE ALL);
compatibility = new table.

| Authored field | Representation | Constraints |
|---|---|---|
| substitutions[] | one row per target: (from_logical_id, to_logical_id, 'substitution') | both FKs -> exercise_catalog_logical ON DELETE RESTRICT; PK (from, to, relation) makes rows deterministic-unique; CHECK from <> to |
| regressions[] | rows with relation 'regression' | same |
| progressions[] | rows with relation 'progression' | same |

Authored relationships are NAME strings; the schema is keyed by
LOGICAL IDENTITY. Resolution (name -> logical_id) is a load-time
concern that fails closed by construction: a missing target has no
logical_id to reference, and the FK rejects fabrication. The Plank
model (substitution "Dead bug", progression "Ab wheel rollout",
zero regressions) is representable the moment those two logical
identities exist, WITHOUT loading, approving, admitting, or
publishing their content — target content state is structurally
independent (proven live, suite item L7). This is NOT an
identity-only stub shortcut: exercise_catalog_logical is the
promoted 023 first-class identity object (snapshots, corrections,
and content all key on it, and identities are born before and
independently of any snapshot), so referencing a real logical
identity row IS the promoted architecture's own mechanism — nothing
weaker was invented, and no target content is approved, admitted,
loaded, or published merely to satisfy the foreign keys.

### 3e. Authored fields with deliberately NO database column

| Authored field | Why no column |
|---|---|
| review_status (authoring-record axis) | an independent authoring-pipeline axis (EXLIB-2J record, section 5). Its current value "proposed" is NOT part of the 023 snapshot vocabulary (pending/approved/revised/rejected), so it does NOT map onto exercise_catalog.review_status: database snapshots are born 'pending' by the 023 birth contract regardless of the artifact's pipeline state. How a future load milestone accounts for this axis is that milestone's reviewed concern; the 2L contract requires no column for it, and nothing here loads or converts it. |
| deferred / deferred_reason | authoring-batch planning bookkeeping; never loads. |
| provenance-history comment lines | artifact commentary, not schema fields. |

## 4. The ONE disclosed deviation from promoted 2A

2A's section-1 pseudocode makes BOTH 'approved' and 'revised'
publishable. This proposal narrows publishability to 'approved'
ALONE, in both the table CHECK and the publication function,
because (a) the EXLIB-2L instruction requires it three separate
times, (b) migration 023's committed bytes define 'revised' as a
TERMINAL outcome ("re-approval impossible") grouped with 'rejected'
in every transition rule — publishing a 'revised' version would
ship content a reviewer terminally sent back — and (c) the
narrowing is strictly more fail-closed and additionally makes it
impossible to flip a PUBLISHED row to 'revised' in place (retire
first, then record the revision decision). 2A's four-value review
vocabulary is preserved exactly; only publishability narrows. The
deviation is flagged in the proposal header for reviewer
adjudication and is a two-line change if review prefers 2A's
literal wording. Everything else follows 2A verbatim, including
the exlib_catalog_admin execution boundary and validations a-d.

## 5. Coverage of the required proposal sections

- A. Provenance compatibility: section 3b above (proposal §1).
- B. exercise_catalog_content: section 3c (proposal §2) — versioned,
  identity-keyed, review/publication/admission as three separate
  axes, decided-version immutability, structural prevention of
  publishing pending/revised/rejected.
- C. exercise_catalog_relationships: section 3d (proposal §3) —
  identity-keyed, self-reference-free, deterministic-unique,
  fail-closed resolution.
- D. Publication function: publish_catalog_content (proposal §4) —
  SECURITY DEFINER with pinned search_path; row-locked
  retire-then-publish; validations: identity exists, content belongs
  to identity, draft-only, approved-only, complete evidence,
  admission present, admission fingerprint EXACTLY current
  (stale fails closed), relationship revalidation; EXECUTE revoked
  from PUBLIC/anon/authenticated and granted ONLY to
  exlib_catalog_admin (NOLOGIN, created idempotently).
- E. RLS/ACL posture: both new tables RLS-enabled with zero
  policies; REVOKE ALL from PUBLIC/anon/authenticated on tables and
  new functions; no service_role reference anywhere; 026's
  authenticated delivery grant untouched.
- F. Rollback/compatibility: proposal §5 — pre-use rollback drop
  sequence with exact constraint names; once any dependent row
  exists, rollback is a reviewed data operation; the whole proposal
  is ONE explicit transaction (the 023/024/025 convention), so a
  duplicate application rolls back WHOLLY (apply-exactly-once,
  proven live); deliberately NOT idempotent except the
  pg_roles-guarded role.

## 6. What this proposal deliberately does NOT do

No migration 027 is created; migrations 001-026 are byte-untouched.
No hosted or persistent database is contacted or changed. No catalog
content, relationship, run, membership, approval, seal, publication,
revocation, or delivery is created or authorized. The Plank content,
its relationships, the seed (bodyweight), seed_link_compatible
(false), eligibility, review evidence, and the ledger are all
byte-unchanged. No runtime, API, or UI code changes. Applying the
proposal (if later approved) still loads NOTHING — proven live: after
application, every catalog table holds zero rows and no lifecycle
state exists (suite section D).
