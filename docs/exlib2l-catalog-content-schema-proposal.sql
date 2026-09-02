-- ============================================================
-- EXLIB-2L PROPOSAL: catalog-content and relationship schema
-- (DRAFT - NOT APPLIED - NOT A MIGRATION)
-- CORRECTED REVISION C: applies the two blocking Codex round-2
-- findings on top of the accepted round-1 corrections:
--   round-2 finding 1 - the identity-wide live relationship table is
--     now a PROTECTED PROJECTION of the currently published version's
--     expected set, swapped ATOMICALLY inside publication, so a
--     reviewed future version can be staged and admitted without
--     changing anything visible for the currently published version
--     (no mutation window, structural/transactional, not procedural);
--   round-2 finding 2 - FOUR real operational authorities exist as
--     separate NOLOGIN roles with narrow SECURITY DEFINER functions:
--     loading/authoring, human-review application, eligibility
--     admission, and publication; no operational role can perform
--     another authority's act or touch tables directly.
--
-- STATUS: IMPLEMENTATION PROPOSAL ONLY. This file lives in docs/,
-- NOT in supabase/migrations/, because it has NOT been approved for
-- application. It must never be applied to any hosted environment;
-- only Joseph/ChatGPT may ever apply migrations, and only after this
-- proposal passes review and is moved into supabase/migrations/ by an
-- explicitly authorized later phase.
--
-- Implements the promoted EXLIB-2A catalog architecture
-- (docs/exlib2a-catalog-architecture-record.md sections 1-4):
--   1. provenance discriminator on exercise_catalog with
--      fail-closed conditional source requirements, the four
--      discovery-metadata columns (NULLABLE for legitimate nonempty
--      023 catalogs; required for originals and at workflow entry),
--      and the verbatim-carried snapshot freeze trigger extended to
--      keep the new columns immutable;
--   2. exercise_catalog_content - the versioned, logical-identity-
--      keyed content model with its own review-audit lifecycle, an
--      orthogonal draft/published/retired publication lifecycle, the
--      zero-or-one-published invariant, decided-version immutability,
--      and fingerprint-bound one-time import admission;
--   3. exercise_catalog_relationships - logical-identity-keyed,
--      self-reference-free, deterministic-unique - now a PROTECTED
--      PROJECTION owned by the publication transition, derived from
--      the per-version EXPECTED relationship set that is the
--      reviewed, admitted source of truth;
--   4. four role-restricted lifecycle functions (load identity,
--      load snapshot, load content draft; apply review; admit;
--      publish).
--
-- THE ENFORCED LIFECYCLE ORDER (accepted round-1 correction,
-- preserved): born pending/draft/UNADMITTED -> pending prose and the
-- version-owned expected relationship set editable -> the
-- human-review transition freezes the reviewed payload (prose,
-- authorship, expected set) -> a later, separately authorized
-- ONE-TIME admission of the approved, draft, unadmitted version
-- (travels alone; one-way; never pending/revised/rejected/published/
-- retired) -> publication still later and separate. Corrections
-- require a NEW version, new review, new admission.
--
-- THE PUBLICATION PROJECTION (round-2 finding 1, design shape B):
--   - exercise_catalog_content_expected_relationships (version-owned,
--     review-frozen) is the reviewed/admitted SOURCE OF TRUTH for a
--     version's relationship set;
--   - exercise_catalog_relationships is the PUBLIC LIVE SURFACE:
--     consumers resolve it as before (the promoted identity-keyed
--     target model is preserved verbatim in shape), and it always
--     equals the CURRENTLY PUBLISHED version's expected set;
--   - admission binds the version-owned expected set WITHOUT touching
--     the live surface, so version 2 can be reviewed AND admitted
--     with set B while version 1 stays published with set A and stays
--     manifest-fresh - no window in which version 1 is published with
--     version 2's relationships, and nothing about version 1 changes
--     until the atomic switch;
--   - publish_catalog_content, under the logical-identity lock and in
--     ONE transaction, retires the prior published version, DELETEs
--     the identity's projection rows, re-INSERTs the new version's
--     expected set, and marks the new version published; a failure
--     anywhere rolls the whole transaction back, leaving the prior
--     version and its set intact;
--   - the projection is TRIGGER-PROTECTED: INSERT/DELETE on
--     exercise_catalog_relationships succeed only while
--     publish_catalog_content holds its transaction-local sentinel
--     (set_config('exlib.relationship_projection_identity', ...,
--     is_local => true)) for that identity; UPDATE is never allowed.
--     Direct mutation outside the protected publication path fails
--     closed for EVERY role - including the table owner - because
--     BEFORE triggers fire regardless of privilege;
--   - the content freeze trigger's publication branch STILL verifies
--     live == expected and manifest freshness at the moment a row
--     becomes published, so even a break-glass actor who manually
--     sets the sentinel cannot mark a version published against the
--     wrong relationship set;
--   - a published version can therefore never remain published while
--     its effective relationship set is stale: the effective set can
--     only change in the same transaction that retires it.
--
-- FOUR DISTINCT OPERATIONAL AUTHORITIES (round-2 finding 2), each a
-- NOLOGIN role holding EXECUTE on exactly its own narrow SECURITY
-- DEFINER function(s) and NO table privileges:
--   1. exlib_catalog_loader - load_catalog_identity,
--      load_catalog_snapshot (snapshot + anatomy + aliases where the
--      separately authorized load package supplies them),
--      load_catalog_content_draft (pending draft + its version-owned
--      expected relationships). Creation only; every write lands as
--      born-pending/born-active/unadmitted state enforced by the
--      triggers; the loader can approve, admit, publish, retire, or
--      alter nothing.
--   2. exlib_catalog_reviewer - apply_content_review: exactly one
--      legal pending -> approved|revised|rejected transition per
--      call, with a complete non-blank reviewer/timestamp/rationale
--      tuple; it can touch payload, expected relationships,
--      admission, publication, snapshots, anatomy, aliases, and
--      delivery state in no way. Post-decision transitions
--      (approved -> revised|rejected) are deliberately NOT an
--      operational authority in this proposal.
--   3. exlib_catalog_admission - admit_catalog_content: admits only
--      an already-approved immutable draft, COMPUTES the normalized
--      SHA-256 manifest from database state, records the separately
--      supplied source-artifact SHA-256, and never loads, reviews,
--      publishes, or touches the live relationship surface.
--   4. exlib_catalog_admin - publish_catalog_content: publishes only
--      an approved, admitted, fingerprint-fresh draft, atomically
--      switches the effective relationship set, retires the prior
--      published version, and never loads, reviews, or admits.
-- No role is granted another role's function; ordinary
-- anon/authenticated clients hold none of the four. Snapshot REVIEW
-- (exercise_catalog.review_status) remains the promoted 023 delivery
-- lifecycle, outside these four content authorities. HONEST
-- BREAK-GLASS NOTE: the database superuser / table owner can always
-- mutate rows directly; that power is NOT an operational authority,
-- it is disclosed break-glass capability, and every freeze trigger
-- and structural CHECK in this proposal still binds it (triggers
-- fire for the owner too; only ALTER TABLE ... DISABLE TRIGGER
-- could bypass them, which no operational role can execute).
--
-- ADMISSION MANIFEST (accepted round-1 correction, revised to v2 for
-- round-2 finding 1): admission and publication are bound to a
-- versioned, canonical, deterministic manifest (leading literal
-- 'EXLIB-ADMISSION-MANIFEST v2') computed FROM DATABASE STATE -
-- never accepted as a caller-supplied hash - and hashed with SHA-256
-- (not MD5). v2 removes v1's live-relationship section and binds the
-- VERSION-OWNED expected relationship set as the version's
-- relationship truth, because the live surface is now a projection
-- that belongs to whichever version is published (binding it would
-- couple one version's manifest to another version's publication
-- state - exactly the round-2 finding-1 defect). The manifest binds:
--     logical identity; the single ACTIVE catalog snapshot's
--     canonical classification, tracking metadata, provenance,
--     discovery metadata, and source fields (uniqueness of the
--     active snapshot is guaranteed by migration 023's
--     exercise_catalog_one_active_logical_idx); anatomy rows of that
--     snapshot; alias rows of the identity; the authored
--     instructional content; authorship; the review-bound content
--     version with its complete review evidence; and the version's
--     EXPECTED relationship set.
--   Determinism: every variable text field is hex-encoded from UTF8
--   bytes (unambiguous under any content, both clusters run UTF8);
--   JSONB fields serialize through jsonb's own canonical form (key
--   order normalized, duplicates removed); DATE values are integer
--   day offsets from 1970-01-01 (never date::text - date_out is only
--   STABLE and DateStyle really changes it); TIMESTAMPTZ values are
--   numeric epoch seconds (timezone- and DateStyle-independent); row
--   sets are aggregated under explicit ORDER BY pinned to COLLATE
--   "C" byte order (never locale/collation order). DateStyle,
--   locale, JSON key ordering, row ordering, and relationship
--   ordering therefore cannot change the hash. The manifest
--   functions are STABLE (they read database state; an IMMUTABLE
--   marking would be untruthful).
--   Two fingerprints are stored DISTINCTLY on the admitted row:
--   admitted_fingerprint (the database-normalized manifest SHA-256,
--   COMPUTED by the admission path and INDEPENDENTLY RECOMPUTED by
--   the freeze trigger) and admitted_source_sha256 (the exact
--   repository source artifact SHA-256, recorded as provenance
--   evidence and format-validated; the database cannot see
--   repository bytes, so its truthfulness is proven by the
--   repository-side verifiers that document the artifact-to-database
--   mapping).
--   HONEST CORRECTION NOTE (preserved): revision A's
--   exlib_content_fingerprint was MD5 over selected instructional
--   fields ONLY. It did NOT cover the complete EXLIB-2J admitted
--   artifact (2,928 bytes, SHA-256 d82078490efa9ef13e128e7b7b742fbd
--   a8ea9e74e32382252d96c326c679d752); no such claim is made or
--   preserved. It was REPLACED, not renamed.
--
-- RELATIONSHIP COMPLETENESS (accepted round-1 correction, preserved
-- and strengthened): each content version owns an EXPECTED
-- relationship set, authored while pending and frozen by the review
-- transition (rows immutable, PK-deterministic, RESTRICT FKs to real
-- logical identities, self-expectation refused). The published live
-- surface ALWAYS equals the published version's expected set - now
-- by construction (projection) plus the trigger's publication-time
-- equality verification, not merely by function-path checks. The
-- Plank model therefore publishes with EXACTLY substitution ->
-- "Dead bug"-model target and progression -> "Ab wheel
-- rollout"-model target, while those target identities need no
-- snapshot, no content, no admission, and no publication of their
-- own. Expected sets are version-owned, so versions' relationship
-- rows can never collide or overwrite one another, and staging or
-- admitting one version changes NOTHING visible for another.
--
-- NONEMPTY-CATALOG COMPATIBILITY (accepted round-1 correction,
-- preserved): the four discovery-metadata columns are NULLABLE with
-- NULL-permitting vocabulary CHECKs, so this proposal applies safely
-- to a legitimate NONEMPTY 001-026 database without fabricating
-- metadata and without data loss. forgefitos_original snapshots MUST
-- carry all four discovery fields
-- (exercise_catalog_discovery_metadata_chk) and MUST NOT carry any
-- source/import-confidence field
-- (exercise_catalog_provenance_sources_chk); external snapshots keep
-- their exact 023 meaning with all four source fields REQUIRED;
-- legacy rows' discovery metadata stays NULL rather than invented,
-- and the admission manifest fails closed on a NULL discovery field,
-- so no incomplete row can enter the new workflow. "Hosted currently
-- has zero rows" is treated as evidence for the hosted instance
-- only, NOT as generic migration compatibility.
--
-- DISCLOSED DEVIATIONS AND EXTENSIONS vs PROMOTED EXLIB-2A (all need
-- reviewer adjudication; nothing is applied by this file):
--   1. PRESERVED NARROWING (adjudicated round 1: keep): only
--      content_status = 'approved' may publish; pending, revised,
--      and rejected are never publishable; 'revised' remains
--      terminal (migration 023: "re-approval impossible") and
--      requires a new version and new approval.
--   2. EXTENSION: the publication CHECK additionally requires
--      import_admitted for published rows (published implies
--      approved AND admitted) - structural, not function-only.
--   3. EXTENSION: exercise_catalog_content_expected_relationships
--      and the admission-manifest model; 2A had no completeness
--      ownership and an instructional-fields-only fingerprint
--      sketch.
--   4. EXTENSION (round 2): exercise_catalog_relationships is a
--      trigger-protected projection owned by the publication
--      transition. Its shape, keying, and consumer-facing meaning
--      are 2A-verbatim; only its WRITE PATH narrows.
--   5. EXTENSION (round 2): four operational authorities as NOLOGIN
--      roles + narrow SECURITY DEFINER functions (2A named only the
--      publication boundary role exlib_catalog_admin, preserved
--      verbatim for publication).
--   6. COMPATIBILITY DEVIATION: the four discovery-metadata columns
--      are NULLABLE (round-1 finding 4); required-ness is enforced
--      for forgefitos_original rows and at workflow entry instead.
--
-- Applying this schema loads NOTHING: it creates no catalog row, no
-- content row, no relationship, no expected relationship, no run, no
-- membership, no approval, no review decision, no admission, no
-- seal, no publication, and no delivery. Migrations 001-026 are not
-- modified; every 023-026 function, trigger, ACL, and behavior is
-- preserved (the one CREATE OR REPLACE below carries the 023 trigger
-- body verbatim except the marked immutable-list splice).
-- ============================================================

-- Following migrations 023/024/025 (023: "ONE explicit top-level
-- transaction encloses every executable statement below. Do not rely
-- on any client to batch."), every executable statement in this
-- proposal is enclosed in one transaction, so a partial failure can
-- never leave a half-applied schema.
BEGIN;

-- ── 1. exercise_catalog: provenance + discovery metadata ─────────
-- Promoted 2A section 2, with import metadata made
-- provenance-conditional per the EXLIB-2L instruction (the 2K
-- feasibility finding: external discovery fields have no truthful
-- forgefitos_original value; fabricating one is forbidden).
ALTER TABLE exercise_catalog
  ADD COLUMN provenance TEXT NOT NULL DEFAULT 'external_source_derived'
    CHECK (provenance IN ('forgefitos_original','external_source_derived'));
ALTER TABLE exercise_catalog ALTER COLUMN source_url  DROP NOT NULL;
ALTER TABLE exercise_catalog ALTER COLUMN source_page DROP NOT NULL;
ALTER TABLE exercise_catalog ALTER COLUMN retrieved_at DROP NOT NULL;
ALTER TABLE exercise_catalog ALTER COLUMN import_confidence DROP NOT NULL;
-- Named distinctly from the column's own auto-named vocabulary CHECK
-- (exercise_catalog_provenance_check): the EXLIB-1C0B1 audit found
-- that near-identical constraint names defeat name discovery during
-- rollback, so the conditional source rule carries its own explicit,
-- unambiguous name. Every pre-existing row is external with complete
-- NOT NULL source fields (023 declared them NOT NULL), so this
-- constraint validates cleanly on any legitimate nonempty 001-026
-- database.
ALTER TABLE exercise_catalog
  ADD CONSTRAINT exercise_catalog_provenance_sources_chk CHECK (
    (provenance = 'external_source_derived'
      AND source_url IS NOT NULL AND source_page IS NOT NULL
      AND retrieved_at IS NOT NULL AND import_confidence IS NOT NULL)
    OR
    (provenance = 'forgefitos_original'
      AND source_url IS NULL AND source_page IS NULL
      AND retrieved_at IS NULL AND import_confidence IS NULL)
  );
-- NULLABLE by design (round-1 finding 4): a legitimate nonempty 023
-- catalog cannot truthfully supply these values for its existing
-- external rows, and inventing placeholders is forbidden. The bare
-- IN (...) vocabulary CHECKs permit NULL by SQL CHECK semantics (a
-- NULL predicate does not violate a CHECK); that is deliberate and
-- relied upon here. Completeness is enforced fail-closed where
-- required: forgefitos_original rows must carry all four (constraint
-- below), and the admission manifest refuses any snapshot missing
-- one, so no incomplete row can enter the new
-- content/admission/publication workflow.
ALTER TABLE exercise_catalog
  ADD COLUMN movement_pattern TEXT CHECK (movement_pattern IN (
    'horizontal_push','incline_push','vertical_push','dip_push',
    'horizontal_pull','vertical_pull','pullover','fly_adduction',
    'shrug','shoulder_raise','elbow_flexion','elbow_extension',
    'grip_forearm','squat','hinge','lunge','leg_extension',
    'leg_curl','calf_raise','hip_extension','hip_abduction',
    'hip_adduction','core_flexion','core_rotation',
    'core_anti_extension','core_anti_rotation','core_lateral','carry',
    'cyclic_cardio','locomotion','jump','ground_to_standing',
    'mobility_flow','static_stretch','spinal_articulation')),
  ADD COLUMN training_role TEXT CHECK (training_role IN (
    'compound','isolation','accessory','core','conditioning','mobility')),
  ADD COLUMN difficulty TEXT CHECK (difficulty IN (
    'beginner','intermediate','advanced')),
  ADD COLUMN availability TEXT CHECK (availability IN (
    'minimal','home_gym','commercial_gym'));
ALTER TABLE exercise_catalog
  ADD CONSTRAINT exercise_catalog_discovery_metadata_chk CHECK (
    provenance <> 'forgefitos_original'
    OR (movement_pattern IS NOT NULL AND training_role IS NOT NULL
        AND difficulty IS NOT NULL AND availability IS NOT NULL)
  );

-- The 023 snapshot freeze trigger, carried VERBATIM except the
-- marked EXLIB-2L splice adding the new columns to the immutable
-- list. Snapshot review-audit, one-way transitions, fresh-evidence
-- demands, the review-events log write, and one-way deactivation are
-- byte-preserved. Legacy rows' NULL discovery metadata is immutable
-- like every other snapshot value: completing it requires a new
-- catalog version row.
CREATE OR REPLACE FUNCTION exlib_freeze_catalog_snapshot()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.review_status <> 'pending' THEN
      RAISE EXCEPTION
        'exercise_catalog: snapshots are born pending; review decisions are recorded by UPDATE with their own audit';
    END IF;
    IF NOT NEW.is_active THEN
      RAISE EXCEPTION
        'exercise_catalog: snapshots are born active; deactivation is one-way and later';
    END IF;
    -- Revision G, finding 2: evidence exists exactly when a decision
    -- does (the CHECK enforces this too; the trigger message is the
    -- friendlier failure).
    IF NEW.reviewed_by IS NOT NULL
       OR NEW.reviewed_at IS NOT NULL
       OR NEW.review_rationale IS NOT NULL THEN
      RAISE EXCEPTION
        'exercise_catalog: snapshots are born with NULL review-audit fields; evidence arrives only with a review transition';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.logical_id        IS DISTINCT FROM OLD.logical_id
     OR NEW.canonical_name IS DISTINCT FROM OLD.canonical_name
     OR NEW.category       IS DISTINCT FROM OLD.category
     OR NEW.primary_muscle IS DISTINCT FROM OLD.primary_muscle
     OR NEW.equipment      IS DISTINCT FROM OLD.equipment
     OR NEW.laterality     IS DISTINCT FROM OLD.laterality
     OR NEW.tracking_mode  IS DISTINCT FROM OLD.tracking_mode
     OR NEW.source_url     IS DISTINCT FROM OLD.source_url
     OR NEW.source_page    IS DISTINCT FROM OLD.source_page
     OR NEW.retrieved_at   IS DISTINCT FROM OLD.retrieved_at
     OR NEW.import_confidence IS DISTINCT FROM OLD.import_confidence
     -- EXLIB-2L splice: the provenance discriminator and the four
     -- discovery-metadata columns join the immutable snapshot list;
     -- corrections still require a new catalog version row.
     OR NEW.provenance        IS DISTINCT FROM OLD.provenance
     OR NEW.movement_pattern  IS DISTINCT FROM OLD.movement_pattern
     OR NEW.training_role     IS DISTINCT FROM OLD.training_role
     OR NEW.difficulty        IS DISTINCT FROM OLD.difficulty
     OR NEW.availability      IS DISTINCT FROM OLD.availability
     OR NEW.catalog_version   IS DISTINCT FROM OLD.catalog_version
     OR NEW.created_at        IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION
      'exercise_catalog: snapshot identity/content is immutable; corrections require a new catalog version row';
  END IF;

  IF NEW.review_status IS DISTINCT FROM OLD.review_status THEN
    IF NOT ((OLD.review_status = 'pending'
             AND NEW.review_status IN ('approved','revised','rejected'))
            OR (OLD.review_status = 'approved'
                AND NEW.review_status IN ('revised','rejected'))) THEN
      RAISE EXCEPTION
        'exercise_catalog: review_status is one-way (pending -> approved|revised|rejected; approved -> revised|rejected; revised/rejected terminal); it can never return to pending and re-approval requires a new catalog version row';
    END IF;
    -- Revision G, finding 2: EVERY transition carries a complete,
    -- FRESH audit tuple. Reusing the prior decision's evidence
    -- (e.g. approved -> rejected keeping the approval evidence) is
    -- misattribution and fails; a status-only flip therefore fails.
    IF NEW.reviewed_by IS NULL
       OR char_length(btrim(NEW.reviewed_by)) = 0
       OR NEW.reviewed_at IS NULL
       OR NEW.review_rationale IS NULL
       OR char_length(btrim(NEW.review_rationale)) = 0 THEN
      RAISE EXCEPTION
        'exercise_catalog: every review transition requires a complete, non-blank audit tuple (reviewer, timestamp, rationale)';
    END IF;
    IF NEW.reviewed_by IS NOT DISTINCT FROM OLD.reviewed_by
       AND NEW.reviewed_at IS NOT DISTINCT FROM OLD.reviewed_at
       AND NEW.review_rationale IS NOT DISTINCT FROM OLD.review_rationale THEN
      RAISE EXCEPTION
        'exercise_catalog: a review transition must carry FRESH evidence; the audit tuple must differ from the prior decision''s tuple';
    END IF;
    -- Append the decision to the immutable evidence log. The
    -- snapshot row keeps only the CURRENT decision's evidence; the
    -- full history lives in exercise_catalog_review_events.
    INSERT INTO public.exercise_catalog_review_events
      (catalog_id, from_status, to_status,
       reviewed_by, reviewed_at, review_rationale)
    VALUES
      (NEW.id, OLD.review_status, NEW.review_status,
       NEW.reviewed_by, NEW.reviewed_at, NEW.review_rationale);
  ELSE
    IF NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by
       OR NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at
       OR NEW.review_rationale IS DISTINCT FROM OLD.review_rationale THEN
      RAISE EXCEPTION
        'exercise_catalog: review-audit fields may change only together with an allowed review_status transition';
    END IF;
  END IF;

  IF NOT OLD.is_active AND NEW.is_active THEN
    RAISE EXCEPTION
      'exercise_catalog: snapshot reactivation is not permitted; restoring deliverability requires a new catalog version row and a new sealed run';
  END IF;

  RETURN NEW;
END;
$$;

-- ── 2. exercise_catalog_content ──────────────────────────────────
CREATE TABLE exercise_catalog_content (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  logical_id         UUID NOT NULL
                     REFERENCES exercise_catalog_logical(id)
                     ON DELETE RESTRICT,
  content_version    INTEGER NOT NULL CHECK (content_version > 0),
  authored_by        TEXT NOT NULL
                     CHECK (char_length(btrim(authored_by)) > 0),
  authored_at        DATE NOT NULL,
  setup_steps        JSONB NOT NULL
                     CHECK (jsonb_typeof(setup_steps) = 'array'),
  execution_steps    JSONB NOT NULL
                     CHECK (jsonb_typeof(execution_steps) = 'array'),
  breathing_cue      TEXT NOT NULL
                     CHECK (char_length(btrim(breathing_cue)) > 0),
  common_mistakes    JSONB NOT NULL
                     CHECK (jsonb_typeof(common_mistakes) = 'array'),
  safety_guidance    TEXT NOT NULL
                     CHECK (char_length(btrim(safety_guidance)) > 0),
  equipment_setup    TEXT,
  accessibility_alternative TEXT,
  content_status     TEXT NOT NULL DEFAULT 'pending' CHECK
                     (content_status IN
                      ('pending','approved','revised','rejected')),
  reviewed_by        TEXT,
  reviewed_at        TIMESTAMPTZ,
  review_rationale   TEXT,
  publication_status TEXT NOT NULL DEFAULT 'draft' CHECK
                     (publication_status IN
                      ('draft','published','retired')),
  -- Import admission (EXLIB-2J contract, round-1 corrected order):
  -- admission is a LATER, SEPARATELY AUTHORIZED one-time act on an
  -- ALREADY APPROVED immutable version. Two fingerprints are stored
  -- DISTINCTLY: admitted_fingerprint is the database-normalized
  -- admission-manifest SHA-256 (computed from database state, never
  -- caller-supplied); admitted_source_sha256 is the exact repository
  -- source artifact SHA-256 (recorded provenance evidence). Blank or
  -- partial admission can never read as admitted.
  import_admitted        BOOLEAN NOT NULL DEFAULT false,
  admitted_fingerprint   TEXT,
  admitted_source_sha256 TEXT,
  admitted_at            DATE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (logical_id, content_version),
  -- PRESERVED NARROWING + DISCLOSED EXTENSION (see the header):
  -- published requires approved (2A said approved OR revised;
  -- migration 023 defines revised as TERMINAL with "re-approval
  -- impossible") AND requires a completed admission (published
  -- implies admitted, structurally). This also makes it impossible
  -- to flip a PUBLISHED row to 'revised' in place: retire it first,
  -- then record the revision decision on a new version.
  CONSTRAINT exercise_catalog_content_publication_chk CHECK (
    publication_status <> 'published'
    OR (content_status = 'approved' AND import_admitted)
  ),
  CONSTRAINT exercise_catalog_content_review_audit_chk CHECK (
    (content_status = 'pending'
     AND reviewed_by IS NULL
     AND reviewed_at IS NULL
     AND review_rationale IS NULL)
    OR (content_status <> 'pending'
        AND reviewed_by IS NOT NULL
        AND char_length(btrim(reviewed_by)) > 0
        AND reviewed_at IS NOT NULL
        AND review_rationale IS NOT NULL
        AND char_length(btrim(review_rationale)) > 0)
  ),
  -- All-or-nothing admission record with SHA-256 shape: both hex
  -- digests present and well-formed exactly when admitted.
  CONSTRAINT exercise_catalog_content_admission_chk CHECK (
    (import_admitted = false
     AND admitted_fingerprint IS NULL
     AND admitted_source_sha256 IS NULL
     AND admitted_at IS NULL)
    OR (import_admitted = true
        AND admitted_fingerprint ~ '^[0-9a-f]{64}$'
        AND admitted_source_sha256 ~ '^[0-9a-f]{64}$'
        AND admitted_at IS NOT NULL)
  ),
  -- Structural lifecycle order: a pending version can NEVER be
  -- admitted (human approval strictly precedes eligibility).
  CONSTRAINT exercise_catalog_content_admission_order_chk CHECK (
    NOT import_admitted OR content_status <> 'pending'
  )
);

-- Exactly ZERO or ONE published content version per logical identity.
CREATE UNIQUE INDEX exercise_catalog_content_one_published_idx
  ON exercise_catalog_content (logical_id)
  WHERE publication_status = 'published';
CREATE INDEX exercise_catalog_content_logical_idx
  ON exercise_catalog_content (logical_id);

CREATE TRIGGER exercise_catalog_content_updated_at
  BEFORE UPDATE ON exercise_catalog_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── 2b. Per-version EXPECTED relationship set (round-1 finding 3;
--        the reviewed, admitted SOURCE OF TRUTH) ──────────────────
-- The authored artifact declares the version's required
-- relationships (Plank: substitutions ["Dead bug"], progressions
-- ["Ab wheel rollout"], regressions []). The loader writes them here
-- while the version is pending; the review transition freezes them
-- with the rest of the reviewed payload. Deterministic uniqueness by
-- primary key; targets are real logical identities (RESTRICT FKs);
-- self-links are refused by the freeze trigger below. Version-owned
-- rows can never collide with another version's rows (content_id is
-- part of the key), and multiplicities are structurally 0-or-1 per
-- (relation, target) in BOTH the expected and the projected live
-- table, so exact set equality is exact multiset equality.
CREATE TABLE exercise_catalog_content_expected_relationships (
  content_id    UUID NOT NULL
                REFERENCES exercise_catalog_content(id) ON DELETE RESTRICT,
  relation      TEXT NOT NULL CHECK (relation IN
                ('regression','progression','substitution')),
  to_logical_id UUID NOT NULL
                REFERENCES exercise_catalog_logical(id) ON DELETE RESTRICT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (content_id, relation, to_logical_id)
);
CREATE INDEX exercise_catalog_content_expected_relationships_target_idx
  ON exercise_catalog_content_expected_relationships (to_logical_id);

-- Expected rows exist exactly while their owner authorizes them:
-- INSERT and DELETE only while the owning version is PENDING (the
-- Revision-G lock pattern serializes with the owner's review
-- transition); UPDATE is never allowed; decided versions' expected
-- sets are frozen forever.
CREATE OR REPLACE FUNCTION exlib_freeze_expected_relationships()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_owner public.exercise_catalog_content%ROWTYPE;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION
      'exercise_catalog_content_expected_relationships: rows are immutable; delete and re-insert while the version is pending';
  END IF;
  SELECT c.* INTO v_owner
  FROM public.exercise_catalog_content c
  WHERE c.id = COALESCE(NEW.content_id, OLD.content_id)
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION
      'exercise_catalog_content_expected_relationships: unknown owner content version';
  END IF;
  IF v_owner.content_status <> 'pending' THEN
    RAISE EXCEPTION
      'exercise_catalog_content_expected_relationships: expected relationships freeze with the reviewed payload; corrections require a new content version';
  END IF;
  IF TG_OP = 'INSERT' AND NEW.to_logical_id = v_owner.logical_id THEN
    RAISE EXCEPTION
      'exercise_catalog_content_expected_relationships: a content version cannot expect a relationship to its own identity';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;
REVOKE ALL ON FUNCTION exlib_freeze_expected_relationships() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER exercise_catalog_content_expected_relationships_freeze_trigger
  BEFORE INSERT OR UPDATE OR DELETE
  ON exercise_catalog_content_expected_relationships
  FOR EACH ROW EXECUTE FUNCTION exlib_freeze_expected_relationships();

ALTER TABLE exercise_catalog_content_expected_relationships
  ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE exercise_catalog_content_expected_relationships
  FROM PUBLIC, anon, authenticated;

-- ── 2c. Admission manifest (round-1 finding 2; v2 format) ────────
-- Canonical hex encoding of one text value: 'S' + lowercase hex of
-- the UTF8 bytes, or 'N' for NULL. Unambiguous for any content (no
-- delimiter can be injected through a value) and deterministic on a
-- UTF8 database. STABLE, not IMMUTABLE: convert_to's catalog
-- volatility is STABLE (server_encoding is fixed per database, but
-- the marking must not overclaim).
CREATE OR REPLACE FUNCTION exlib_manifest_hex(p_value TEXT)
RETURNS TEXT
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE('S' || encode(convert_to(p_value, 'UTF8'), 'hex'), 'N');
$$;
REVOKE ALL ON FUNCTION exlib_manifest_hex(TEXT) FROM PUBLIC, anon, authenticated;

-- The versioned canonical admission manifest, computed FROM DATABASE
-- STATE for one content version. Fails closed (RAISE) when the
-- bound state is incomplete: no or duplicate active snapshot
-- (uniqueness also guaranteed by 023's partial unique index), or
-- NULL discovery metadata on the bound snapshot. v2 binds: identity;
-- the active snapshot's classification, tracking, provenance,
-- discovery metadata, and sources; that snapshot's anatomy; the
-- identity's aliases; the authored payload and authorship; the
-- review-bound version and its complete evidence; and the version's
-- OWN expected relationship set (v1's live-surface section is
-- removed: the live surface is a projection owned by whichever
-- version is published, and binding it would couple this version's
-- manifest to another version's publication state). Rows aggregate
-- under explicit ORDER BY pinned to COLLATE "C" byte order; dates
-- are day offsets; timestamps are numeric epochs; JSONB is
-- jsonb-canonical.
CREATE OR REPLACE FUNCTION exlib_content_admission_manifest(p_content_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_c    public.exercise_catalog_content%ROWTYPE;
  v_s    public.exercise_catalog%ROWTYPE;
  v_n    INTEGER;
  v_txt  TEXT;
BEGIN
  SELECT c.* INTO v_c
  FROM public.exercise_catalog_content c
  WHERE c.id = p_content_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION
      'exlib_content_admission_manifest: unknown content version';
  END IF;

  SELECT count(*) INTO v_n
  FROM public.exercise_catalog s
  WHERE s.logical_id = v_c.logical_id AND s.is_active;
  IF v_n <> 1 THEN
    RAISE EXCEPTION
      'exlib_content_admission_manifest: admission requires exactly one ACTIVE catalog snapshot for the identity (found %)', v_n;
  END IF;
  SELECT s.* INTO v_s
  FROM public.exercise_catalog s
  WHERE s.logical_id = v_c.logical_id AND s.is_active;
  IF v_s.movement_pattern IS NULL OR v_s.training_role IS NULL
     OR v_s.difficulty IS NULL OR v_s.availability IS NULL THEN
    RAISE EXCEPTION
      'exlib_content_admission_manifest: the bound snapshot lacks complete discovery metadata (movement_pattern, training_role, difficulty, availability); a legacy row cannot enter the admission workflow without a complete new catalog version';
  END IF;

  v_txt :=
    'EXLIB-ADMISSION-MANIFEST v2' || chr(10) ||
    'identity ' || v_c.logical_id::text || chr(10) ||
    'snapshot ' || v_s.catalog_version::text
      || ' ' || public.exlib_manifest_hex(v_s.canonical_name)
      || ' ' || public.exlib_manifest_hex(v_s.category)
      || ' ' || public.exlib_manifest_hex(v_s.primary_muscle)
      || ' ' || public.exlib_manifest_hex(v_s.equipment)
      || ' ' || public.exlib_manifest_hex(v_s.laterality)
      || ' ' || public.exlib_manifest_hex(v_s.tracking_mode)
      || ' ' || public.exlib_manifest_hex(v_s.provenance)
      || ' ' || public.exlib_manifest_hex(v_s.movement_pattern)
      || ' ' || public.exlib_manifest_hex(v_s.training_role)
      || ' ' || public.exlib_manifest_hex(v_s.difficulty)
      || ' ' || public.exlib_manifest_hex(v_s.availability)
      || ' ' || public.exlib_manifest_hex(v_s.source_url)
      || ' ' || public.exlib_manifest_hex(v_s.source_page)
      || ' ' || COALESCE((v_s.retrieved_at - DATE '1970-01-01')::text, 'N')
      || ' ' || public.exlib_manifest_hex(v_s.import_confidence)
      || chr(10) ||
    -- every text ORDER BY below pins COLLATE "C": row order in the
    -- manifest is byte order, never locale/collation order, so the
    -- same rows hash identically on any cluster
    COALESCE((SELECT string_agg(
        'anatomy ' || public.exlib_manifest_hex(m.muscle)
                   || ' ' || public.exlib_manifest_hex(m.role),
        chr(10) ORDER BY m.muscle COLLATE "C")
      FROM public.exercise_catalog_muscles m
      WHERE m.catalog_id = v_s.id), 'anatomy NONE') || chr(10) ||
    COALESCE((SELECT string_agg(
        'alias ' || public.exlib_manifest_hex(a.alias),
        chr(10) ORDER BY a.alias COLLATE "C")
      FROM public.exercise_catalog_aliases a
      WHERE a.logical_id = v_c.logical_id), 'alias NONE') || chr(10) ||
    'content ' || v_c.content_version::text
      || ' ' || public.exlib_manifest_hex(v_c.authored_by)
      || ' ' || (v_c.authored_at - DATE '1970-01-01')::text
      || ' ' || public.exlib_manifest_hex(v_c.setup_steps::text)
      || ' ' || public.exlib_manifest_hex(v_c.execution_steps::text)
      || ' ' || public.exlib_manifest_hex(v_c.breathing_cue)
      || ' ' || public.exlib_manifest_hex(v_c.common_mistakes::text)
      || ' ' || public.exlib_manifest_hex(v_c.safety_guidance)
      || ' ' || public.exlib_manifest_hex(v_c.equipment_setup)
      || ' ' || public.exlib_manifest_hex(v_c.accessibility_alternative)
      || chr(10) ||
    'review ' || public.exlib_manifest_hex(v_c.content_status)
      || ' ' || public.exlib_manifest_hex(v_c.reviewed_by)
      || ' ' || COALESCE(extract(epoch FROM v_c.reviewed_at)::numeric::text, 'N')
      || ' ' || public.exlib_manifest_hex(v_c.review_rationale)
      || chr(10) ||
    COALESCE((SELECT string_agg(
        'relationship ' || public.exlib_manifest_hex(e.relation)
                        || ' ' || e.to_logical_id::text,
        chr(10) ORDER BY e.relation COLLATE "C", e.to_logical_id)
      FROM public.exercise_catalog_content_expected_relationships e
      WHERE e.content_id = v_c.id), 'relationship NONE');
  RETURN v_txt;
END;
$$;
REVOKE ALL ON FUNCTION exlib_content_admission_manifest(UUID) FROM PUBLIC, anon, authenticated;

-- SHA-256 (never MD5) of the canonical manifest, lowercase hex.
CREATE OR REPLACE FUNCTION exlib_content_admission_fingerprint(p_content_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT encode(sha256(convert_to(
    public.exlib_content_admission_manifest(p_content_id), 'UTF8')), 'hex');
$$;
REVOKE ALL ON FUNCTION exlib_content_admission_fingerprint(UUID) FROM PUBLIC, anon, authenticated;

-- ── 2d. Content-version lifecycle trigger ────────────────────────
-- Versions are born pending drafts, UNADMITTED, with no review
-- evidence. While PENDING: prose may be edited; admission fields may
-- NOT change (admission cannot precede approval). The REVIEW
-- transition freezes the reviewed payload and carries evidence only.
-- The ADMISSION transition is a narrow standalone one-time act on an
-- approved, draft, unadmitted version: only the four admission
-- fields change and the recorded manifest fingerprint must equal the
-- recomputed database-state fingerprint. Admission is one-way.
-- Publication transitions travel alone and remain one-way, and a
-- draft -> published transition additionally verifies (structurally,
-- for every caller including break-glass) that the projected live
-- relationship set equals the version's expected set exactly and
-- that the admission manifest is still fresh. Decided versions are
-- otherwise immutable: corrections require a NEW content version,
-- new review, and new admission.
CREATE OR REPLACE FUNCTION exlib_freeze_content_version()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.content_status <> 'pending' THEN
      RAISE EXCEPTION
        'exercise_catalog_content: versions are born pending; review decisions are recorded by UPDATE with their own audit';
    END IF;
    IF NEW.publication_status <> 'draft' THEN
      RAISE EXCEPTION
        'exercise_catalog_content: versions are born drafts and never auto-publish';
    END IF;
    IF NEW.import_admitted
       OR NEW.admitted_fingerprint IS NOT NULL
       OR NEW.admitted_source_sha256 IS NOT NULL
       OR NEW.admitted_at IS NOT NULL THEN
      RAISE EXCEPTION
        'exercise_catalog_content: versions are born unadmitted; admission is a later, separately authorized act on an approved version';
    END IF;
    RETURN NEW;
  END IF;

  -- version identity is immutable from birth
  IF NEW.logical_id IS DISTINCT FROM OLD.logical_id
     OR NEW.content_version IS DISTINCT FROM OLD.content_version
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION
      'exercise_catalog_content: version identity is immutable';
  END IF;

  -- publication transitions: one-way, and never combined with any
  -- other change
  IF NEW.publication_status IS DISTINCT FROM OLD.publication_status THEN
    IF NOT ((OLD.publication_status = 'draft' AND NEW.publication_status = 'published')
            OR (OLD.publication_status = 'published' AND NEW.publication_status = 'retired')) THEN
      RAISE EXCEPTION
        'exercise_catalog_content: publication transitions are one-way (draft -> published -> retired); a retired version never returns';
    END IF;
    IF NEW.content_status IS DISTINCT FROM OLD.content_status
       OR NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by
       OR NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at
       OR NEW.review_rationale IS DISTINCT FROM OLD.review_rationale
       OR NEW.setup_steps IS DISTINCT FROM OLD.setup_steps
       OR NEW.execution_steps IS DISTINCT FROM OLD.execution_steps
       OR NEW.breathing_cue IS DISTINCT FROM OLD.breathing_cue
       OR NEW.common_mistakes IS DISTINCT FROM OLD.common_mistakes
       OR NEW.safety_guidance IS DISTINCT FROM OLD.safety_guidance
       OR NEW.equipment_setup IS DISTINCT FROM OLD.equipment_setup
       OR NEW.accessibility_alternative IS DISTINCT FROM OLD.accessibility_alternative
       OR NEW.authored_by IS DISTINCT FROM OLD.authored_by
       OR NEW.authored_at IS DISTINCT FROM OLD.authored_at
       OR NEW.import_admitted IS DISTINCT FROM OLD.import_admitted
       OR NEW.admitted_fingerprint IS DISTINCT FROM OLD.admitted_fingerprint
       OR NEW.admitted_source_sha256 IS DISTINCT FROM OLD.admitted_source_sha256
       OR NEW.admitted_at IS DISTINCT FROM OLD.admitted_at THEN
      RAISE EXCEPTION
        'exercise_catalog_content: a publication transition must travel alone';
    END IF;
    -- STRUCTURAL publication gate: projected-set equality and
    -- manifest freshness are enforced HERE, in the trigger, not only
    -- in publish_catalog_content - a direct owner-level write (even
    -- one that manually sets the projection sentinel) cannot mark a
    -- version published against the wrong relationship set or a
    -- stale admission. The bound surfaces are unchanged in this
    -- branch (the transition travels alone), so recomputing from
    -- stored state is exact.
    IF NEW.publication_status = 'published' THEN
      IF EXISTS (
          SELECT 1 FROM public.exercise_catalog_content_expected_relationships e
          WHERE e.content_id = NEW.id
            AND NOT EXISTS (
              SELECT 1 FROM public.exercise_catalog_relationships r
              WHERE r.from_logical_id = NEW.logical_id
                AND r.relation = e.relation
                AND r.to_logical_id = e.to_logical_id)) THEN
        RAISE EXCEPTION
          'exercise_catalog_content: a required relationship is missing at publication; the version''s expected relationship set must be projected exactly';
      END IF;
      IF EXISTS (
          SELECT 1 FROM public.exercise_catalog_relationships r
          WHERE r.from_logical_id = NEW.logical_id
            AND NOT EXISTS (
              SELECT 1 FROM public.exercise_catalog_content_expected_relationships e
              WHERE e.content_id = NEW.id
                AND e.relation = r.relation
                AND e.to_logical_id = r.to_logical_id)) THEN
        RAISE EXCEPTION
          'exercise_catalog_content: an unexpected relationship is present at publication; the projected live set must equal the expected set exactly';
      END IF;
      IF OLD.admitted_fingerprint IS DISTINCT FROM
         public.exlib_content_admission_fingerprint(OLD.id) THEN
        RAISE EXCEPTION
          'exercise_catalog_content: import admission is STALE - a bound surface changed after admission; publication is refused';
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  -- review transitions: one-way, complete fresh evidence, and the
  -- reviewed payload freezes at the decision - the transition may
  -- not smuggle prose or admission changes
  IF NEW.content_status IS DISTINCT FROM OLD.content_status THEN
    IF NOT ((OLD.content_status = 'pending'
             AND NEW.content_status IN ('approved','revised','rejected'))
            OR (OLD.content_status = 'approved'
                AND NEW.content_status IN ('revised','rejected'))) THEN
      RAISE EXCEPTION
        'exercise_catalog_content: content_status is one-way (pending -> approved|revised|rejected; approved -> revised|rejected); re-approval requires a NEW content version';
    END IF;
    IF NEW.reviewed_by IS NULL
       OR char_length(btrim(NEW.reviewed_by)) = 0
       OR NEW.reviewed_at IS NULL
       OR NEW.review_rationale IS NULL
       OR char_length(btrim(NEW.review_rationale)) = 0 THEN
      RAISE EXCEPTION
        'exercise_catalog_content: every review transition requires a complete, non-blank audit tuple';
    END IF;
    IF NEW.setup_steps IS DISTINCT FROM OLD.setup_steps
       OR NEW.execution_steps IS DISTINCT FROM OLD.execution_steps
       OR NEW.breathing_cue IS DISTINCT FROM OLD.breathing_cue
       OR NEW.common_mistakes IS DISTINCT FROM OLD.common_mistakes
       OR NEW.safety_guidance IS DISTINCT FROM OLD.safety_guidance
       OR NEW.equipment_setup IS DISTINCT FROM OLD.equipment_setup
       OR NEW.accessibility_alternative IS DISTINCT FROM OLD.accessibility_alternative
       OR NEW.authored_by IS DISTINCT FROM OLD.authored_by
       OR NEW.authored_at IS DISTINCT FROM OLD.authored_at
       OR NEW.import_admitted IS DISTINCT FROM OLD.import_admitted
       OR NEW.admitted_fingerprint IS DISTINCT FROM OLD.admitted_fingerprint
       OR NEW.admitted_source_sha256 IS DISTINCT FROM OLD.admitted_source_sha256
       OR NEW.admitted_at IS DISTINCT FROM OLD.admitted_at THEN
      RAISE EXCEPTION
        'exercise_catalog_content: a review transition carries evidence only; payload and admission changes are forbidden in the same statement';
    END IF;
    RETURN NEW;
  END IF;

  -- the one-time admission transition: approved, draft, currently
  -- unadmitted; travels alone; fingerprint recomputed from database
  -- state; one-way forever after. It does NOT touch or read the live
  -- relationship surface (which belongs to the published version).
  IF NEW.import_admitted IS DISTINCT FROM OLD.import_admitted THEN
    IF OLD.import_admitted THEN
      RAISE EXCEPTION
        'exercise_catalog_content: admission is one-way for an immutable version; it can be neither revoked nor re-recorded';
    END IF;
    IF OLD.content_status = 'pending' THEN
      RAISE EXCEPTION
        'exercise_catalog_content: admission cannot precede human approval; only an approved version may be admitted';
    END IF;
    IF OLD.content_status <> 'approved' THEN
      RAISE EXCEPTION
        'exercise_catalog_content: only approved content may be admitted; revised and rejected versions require a new content version';
    END IF;
    IF OLD.publication_status <> 'draft' THEN
      RAISE EXCEPTION
        'exercise_catalog_content: only an unpublished draft may be admitted';
    END IF;
    IF NEW.setup_steps IS DISTINCT FROM OLD.setup_steps
       OR NEW.execution_steps IS DISTINCT FROM OLD.execution_steps
       OR NEW.breathing_cue IS DISTINCT FROM OLD.breathing_cue
       OR NEW.common_mistakes IS DISTINCT FROM OLD.common_mistakes
       OR NEW.safety_guidance IS DISTINCT FROM OLD.safety_guidance
       OR NEW.equipment_setup IS DISTINCT FROM OLD.equipment_setup
       OR NEW.accessibility_alternative IS DISTINCT FROM OLD.accessibility_alternative
       OR NEW.authored_by IS DISTINCT FROM OLD.authored_by
       OR NEW.authored_at IS DISTINCT FROM OLD.authored_at
       OR NEW.content_status IS DISTINCT FROM OLD.content_status
       OR NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by
       OR NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at
       OR NEW.review_rationale IS DISTINCT FROM OLD.review_rationale
       OR NEW.publication_status IS DISTINCT FROM OLD.publication_status THEN
      RAISE EXCEPTION
        'exercise_catalog_content: the admission transition must travel alone';
    END IF;
    IF NEW.admitted_fingerprint IS NULL
       OR NEW.admitted_source_sha256 IS NULL
       OR NEW.admitted_at IS NULL THEN
      RAISE EXCEPTION
        'exercise_catalog_content: admission requires the complete admission record (manifest fingerprint, source artifact SHA-256, admission date)';
    END IF;
    -- the bound surfaces are identical between OLD and NEW in this
    -- branch, so recomputing from stored state validates the NEW
    -- fingerprint exactly; a caller-invented hash cannot land even
    -- through direct owner-level writes
    IF NEW.admitted_fingerprint IS DISTINCT FROM
       public.exlib_content_admission_fingerprint(NEW.id) THEN
      RAISE EXCEPTION
        'exercise_catalog_content: admitted_fingerprint must equal the recomputed admission-manifest fingerprint; arbitrary hashes are rejected';
    END IF;
    RETURN NEW;
  END IF;

  -- no transition in this statement: admission fields are otherwise
  -- untouchable; pending drafts may edit prose (pre-review
  -- authoring); decided versions are frozen
  IF NEW.admitted_fingerprint IS DISTINCT FROM OLD.admitted_fingerprint
     OR NEW.admitted_source_sha256 IS DISTINCT FROM OLD.admitted_source_sha256
     OR NEW.admitted_at IS DISTINCT FROM OLD.admitted_at THEN
    RAISE EXCEPTION
      'exercise_catalog_content: admission fields change only through the one-time admission transition';
  END IF;
  IF OLD.content_status <> 'pending' THEN
    IF NEW.setup_steps IS DISTINCT FROM OLD.setup_steps
       OR NEW.execution_steps IS DISTINCT FROM OLD.execution_steps
       OR NEW.breathing_cue IS DISTINCT FROM OLD.breathing_cue
       OR NEW.common_mistakes IS DISTINCT FROM OLD.common_mistakes
       OR NEW.safety_guidance IS DISTINCT FROM OLD.safety_guidance
       OR NEW.equipment_setup IS DISTINCT FROM OLD.equipment_setup
       OR NEW.accessibility_alternative IS DISTINCT FROM OLD.accessibility_alternative
       OR NEW.authored_by IS DISTINCT FROM OLD.authored_by
       OR NEW.authored_at IS DISTINCT FROM OLD.authored_at THEN
      RAISE EXCEPTION
        'exercise_catalog_content: a decided content version is immutable; corrections require a NEW content version under the same logical identity';
    END IF;
  END IF;
  IF NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by
     OR NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at
     OR NEW.review_rationale IS DISTINCT FROM OLD.review_rationale THEN
    RAISE EXCEPTION
      'exercise_catalog_content: review-audit fields may change only together with an allowed content_status transition';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION exlib_freeze_content_version() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER exercise_catalog_content_freeze_trigger
  BEFORE INSERT OR UPDATE ON exercise_catalog_content
  FOR EACH ROW EXECUTE FUNCTION exlib_freeze_content_version();

ALTER TABLE exercise_catalog_content ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE exercise_catalog_content
  FROM PUBLIC, anon, authenticated;

-- ── 3. exercise_catalog_relationships: the PROTECTED PROJECTION ──
-- 2A section 4 shape, keying, and consumer meaning are verbatim; the
-- WRITE PATH narrows (round-2 finding 1): rows exist ONLY as the
-- atomic projection of the currently published version's expected
-- set, written inside publish_catalog_content under its
-- transaction-local sentinel. Everything else - including direct
-- owner-level writes - fails closed at the trigger below.
CREATE TABLE exercise_catalog_relationships (
  from_logical_id UUID NOT NULL
                  REFERENCES exercise_catalog_logical(id) ON DELETE RESTRICT,
  to_logical_id   UUID NOT NULL
                  REFERENCES exercise_catalog_logical(id) ON DELETE RESTRICT,
  relation        TEXT NOT NULL CHECK (relation IN
                  ('regression','progression','substitution')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (from_logical_id, to_logical_id, relation),
  CHECK (from_logical_id <> to_logical_id)
);
CREATE INDEX exercise_catalog_relationships_to_idx
  ON exercise_catalog_relationships (to_logical_id);

CREATE OR REPLACE FUNCTION exlib_protect_relationship_projection()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION
      'exercise_catalog_relationships: projection rows are immutable; the projection is replaced atomically inside publish_catalog_content';
  END IF;
  IF current_setting('exlib.relationship_projection_identity', true)
     IS DISTINCT FROM COALESCE(NEW.from_logical_id, OLD.from_logical_id)::text THEN
    RAISE EXCEPTION
      'exercise_catalog_relationships: this table is a protected projection of the PUBLISHED version''s expected relationship set; it changes only atomically inside publish_catalog_content';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;
REVOKE ALL ON FUNCTION exlib_protect_relationship_projection() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER exercise_catalog_relationships_projection_trigger
  BEFORE INSERT OR UPDATE OR DELETE ON exercise_catalog_relationships
  FOR EACH ROW EXECUTE FUNCTION exlib_protect_relationship_projection();

ALTER TABLE exercise_catalog_relationships ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE exercise_catalog_relationships
  FROM PUBLIC, anon, authenticated;

-- ── 4. Four distinct operational authorities ─────────────────────
DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'exlib_catalog_loader') THEN
    CREATE ROLE exlib_catalog_loader NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'exlib_catalog_reviewer') THEN
    CREATE ROLE exlib_catalog_reviewer NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'exlib_catalog_admission') THEN
    CREATE ROLE exlib_catalog_admission NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'exlib_catalog_admin') THEN
    CREATE ROLE exlib_catalog_admin NOLOGIN;
  END IF;
END
$do$;

-- 4a. LOADING/AUTHORING authority. Creation only; the freeze
-- triggers guarantee everything lands born-pending / born-active /
-- unadmitted, so the loader structurally cannot approve, admit,
-- publish, retire, or alter a decided version. Invocation of these
-- functions is itself gated procedurally by a separately authorized,
-- reviewed load package; the functions enforce schema truthfulness.
CREATE OR REPLACE FUNCTION load_catalog_identity(p_id UUID DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.exercise_catalog_logical (id)
  VALUES (COALESCE(p_id, gen_random_uuid()))
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION load_catalog_snapshot(
  p_logical_id UUID,
  p_canonical_name TEXT, p_category TEXT, p_primary_muscle TEXT,
  p_equipment TEXT, p_laterality TEXT, p_tracking_mode TEXT,
  p_provenance TEXT,
  p_movement_pattern TEXT, p_training_role TEXT,
  p_difficulty TEXT, p_availability TEXT,
  p_source_url TEXT, p_source_page TEXT,
  p_retrieved_at DATE, p_import_confidence TEXT,
  p_anatomy JSONB, p_aliases JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_snapshot_id UUID;
  v_rec         JSONB;
  v_alias       TEXT;
  v_anatomy_n   INTEGER := 0;
  v_alias_n     INTEGER := 0;
BEGIN
  PERFORM 1 FROM public.exercise_catalog_logical l
  WHERE l.id = p_logical_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'load_catalog_snapshot: unknown logical identity';
  END IF;
  IF p_anatomy IS NULL OR jsonb_typeof(p_anatomy) <> 'array'
     OR p_aliases IS NULL OR jsonb_typeof(p_aliases) <> 'array' THEN
    RAISE EXCEPTION 'load_catalog_snapshot: p_anatomy and p_aliases must be JSON arrays (possibly empty)';
  END IF;
  -- the snapshot lands born-pending/born-active; every vocabulary,
  -- provenance, and discovery rule is enforced by the table's own
  -- CHECKs and the carried freeze trigger
  INSERT INTO public.exercise_catalog
    (logical_id, canonical_name, category, primary_muscle, equipment,
     laterality, tracking_mode, provenance, movement_pattern,
     training_role, difficulty, availability, source_url, source_page,
     retrieved_at, import_confidence)
  VALUES
    (p_logical_id, p_canonical_name, p_category, p_primary_muscle,
     p_equipment, p_laterality, p_tracking_mode, p_provenance,
     p_movement_pattern, p_training_role, p_difficulty, p_availability,
     p_source_url, p_source_page, p_retrieved_at, p_import_confidence)
  RETURNING id INTO v_snapshot_id;
  FOR v_rec IN SELECT value FROM jsonb_array_elements(p_anatomy) LOOP
    IF jsonb_typeof(v_rec) <> 'object'
       OR NOT (v_rec ? 'muscle') OR NOT (v_rec ? 'role') THEN
      RAISE EXCEPTION 'load_catalog_snapshot: each anatomy entry must be an object with muscle and role';
    END IF;
    INSERT INTO public.exercise_catalog_muscles (catalog_id, muscle, role)
    VALUES (v_snapshot_id, v_rec->>'muscle', v_rec->>'role');
    v_anatomy_n := v_anatomy_n + 1;
  END LOOP;
  FOR v_alias IN SELECT value #>> '{}' FROM jsonb_array_elements(p_aliases) LOOP
    INSERT INTO public.exercise_catalog_aliases (logical_id, alias)
    VALUES (p_logical_id, v_alias);
    v_alias_n := v_alias_n + 1;
  END LOOP;
  RETURN jsonb_build_object(
    'logical_id', p_logical_id,
    'snapshot_id', v_snapshot_id,
    'anatomy_rows', v_anatomy_n,
    'alias_rows', v_alias_n
  );
END;
$$;

CREATE OR REPLACE FUNCTION load_catalog_content_draft(
  p_logical_id UUID,
  p_content_id UUID,
  p_content_version INTEGER,
  p_authored_by TEXT, p_authored_at DATE,
  p_setup_steps JSONB, p_execution_steps JSONB,
  p_breathing_cue TEXT, p_common_mistakes JSONB,
  p_safety_guidance TEXT,
  p_equipment_setup TEXT, p_accessibility_alternative TEXT,
  p_expected_relationships JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id  UUID;
  v_rec JSONB;
  v_n   INTEGER := 0;
BEGIN
  PERFORM 1 FROM public.exercise_catalog_logical l
  WHERE l.id = p_logical_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'load_catalog_content_draft: unknown logical identity';
  END IF;
  IF p_expected_relationships IS NULL
     OR jsonb_typeof(p_expected_relationships) <> 'array' THEN
    RAISE EXCEPTION 'load_catalog_content_draft: p_expected_relationships must be a JSON array (possibly empty)';
  END IF;
  -- the version lands born-pending/draft/unadmitted (trigger-enforced)
  INSERT INTO public.exercise_catalog_content
    (id, logical_id, content_version, authored_by, authored_at,
     setup_steps, execution_steps, breathing_cue, common_mistakes,
     safety_guidance, equipment_setup, accessibility_alternative)
  VALUES
    (COALESCE(p_content_id, gen_random_uuid()), p_logical_id,
     p_content_version, p_authored_by, p_authored_at, p_setup_steps,
     p_execution_steps, p_breathing_cue, p_common_mistakes,
     p_safety_guidance, p_equipment_setup, p_accessibility_alternative)
  RETURNING id INTO v_id;
  FOR v_rec IN SELECT value FROM jsonb_array_elements(p_expected_relationships) LOOP
    IF jsonb_typeof(v_rec) <> 'object'
       OR NOT (v_rec ? 'relation') OR NOT (v_rec ? 'to_logical_id') THEN
      RAISE EXCEPTION 'load_catalog_content_draft: each expected relationship must be an object with relation and to_logical_id';
    END IF;
    INSERT INTO public.exercise_catalog_content_expected_relationships
      (content_id, relation, to_logical_id)
    VALUES (v_id, v_rec->>'relation', (v_rec->>'to_logical_id')::uuid);
    v_n := v_n + 1;
  END LOOP;
  RETURN jsonb_build_object(
    'logical_id', p_logical_id,
    'content_id', v_id,
    'content_version', p_content_version,
    'expected_relationships', v_n
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION load_catalog_identity(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION load_catalog_identity(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION load_catalog_identity(UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION load_catalog_identity(UUID) TO exlib_catalog_loader;
REVOKE EXECUTE ON FUNCTION load_catalog_snapshot(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, DATE, TEXT, JSONB, JSONB) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION load_catalog_snapshot(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, DATE, TEXT, JSONB, JSONB) FROM anon;
REVOKE EXECUTE ON FUNCTION load_catalog_snapshot(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, DATE, TEXT, JSONB, JSONB) FROM authenticated;
GRANT EXECUTE ON FUNCTION load_catalog_snapshot(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, DATE, TEXT, JSONB, JSONB) TO exlib_catalog_loader;
REVOKE EXECUTE ON FUNCTION load_catalog_content_draft(UUID, UUID, INTEGER, TEXT, DATE, JSONB, JSONB, TEXT, JSONB, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION load_catalog_content_draft(UUID, UUID, INTEGER, TEXT, DATE, JSONB, JSONB, TEXT, JSONB, TEXT, TEXT, TEXT, JSONB) FROM anon;
REVOKE EXECUTE ON FUNCTION load_catalog_content_draft(UUID, UUID, INTEGER, TEXT, DATE, JSONB, JSONB, TEXT, JSONB, TEXT, TEXT, TEXT, JSONB) FROM authenticated;
GRANT EXECUTE ON FUNCTION load_catalog_content_draft(UUID, UUID, INTEGER, TEXT, DATE, JSONB, JSONB, TEXT, JSONB, TEXT, TEXT, TEXT, JSONB) TO exlib_catalog_loader;

-- 4b. HUMAN-REVIEW APPLICATION authority: exactly one legal
-- pending -> approved|revised|rejected transition per call, with a
-- complete non-blank audit tuple. It updates ONLY the four review
-- fields; the freeze trigger re-validates the transition, the frozen
-- payload, and the untouched admission/publication axes.
-- Post-decision transitions (approved -> revised|rejected) are
-- deliberately NOT an operational authority in this proposal.
CREATE OR REPLACE FUNCTION apply_content_review(
  p_logical_id UUID,
  p_content_id UUID,
  p_decision TEXT,
  p_reviewer TEXT,
  p_reviewed_at TIMESTAMPTZ,
  p_rationale TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_target public.exercise_catalog_content%ROWTYPE;
BEGIN
  PERFORM 1 FROM public.exercise_catalog_logical l
  WHERE l.id = p_logical_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'apply_content_review: unknown logical identity';
  END IF;
  SELECT c.* INTO v_target
  FROM public.exercise_catalog_content c
  WHERE c.id = p_content_id AND c.logical_id = p_logical_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'apply_content_review: content row not found under that logical identity';
  END IF;
  IF v_target.content_status <> 'pending' THEN
    RAISE EXCEPTION 'apply_content_review: only a pending version can receive its review decision through this authority; the decision is one-time and corrections require a new content version';
  END IF;
  IF p_decision IS NULL OR p_decision NOT IN ('approved','revised','rejected') THEN
    RAISE EXCEPTION 'apply_content_review: decision must be approved, revised, or rejected';
  END IF;
  IF p_reviewer IS NULL OR char_length(btrim(p_reviewer)) = 0
     OR p_reviewed_at IS NULL
     OR p_rationale IS NULL OR char_length(btrim(p_rationale)) = 0 THEN
    RAISE EXCEPTION 'apply_content_review: a complete, non-blank reviewer/timestamp/rationale tuple is required';
  END IF;
  UPDATE public.exercise_catalog_content
  SET content_status   = p_decision,
      reviewed_by      = p_reviewer,
      reviewed_at      = p_reviewed_at,
      review_rationale = p_rationale
  WHERE id = p_content_id;
  RETURN jsonb_build_object(
    'logical_id', p_logical_id,
    'content_id', p_content_id,
    'decision',   p_decision
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION apply_content_review(UUID, UUID, TEXT, TEXT, TIMESTAMPTZ, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION apply_content_review(UUID, UUID, TEXT, TEXT, TIMESTAMPTZ, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION apply_content_review(UUID, UUID, TEXT, TEXT, TIMESTAMPTZ, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION apply_content_review(UUID, UUID, TEXT, TEXT, TIMESTAMPTZ, TEXT) TO exlib_catalog_reviewer;

-- 4c. ELIGIBILITY-ADMISSION authority (accepted round-1 correction;
-- round-2: no longer reads or requires the live surface). Validates
-- the lifecycle position, COMPUTES the manifest fingerprint from
-- database state (the caller supplies no hash for it), records the
-- format-validated source-artifact SHA-256. The freeze trigger
-- re-validates everything including recomputing the fingerprint.
CREATE OR REPLACE FUNCTION admit_catalog_content(
  p_logical_id UUID,
  p_content_id UUID,
  p_source_artifact_sha256 TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_target      public.exercise_catalog_content%ROWTYPE;
  v_fingerprint TEXT;
BEGIN
  PERFORM 1 FROM public.exercise_catalog_logical l
  WHERE l.id = p_logical_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'admit_catalog_content: unknown logical identity';
  END IF;

  SELECT c.* INTO v_target
  FROM public.exercise_catalog_content c
  WHERE c.id = p_content_id AND c.logical_id = p_logical_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'admit_catalog_content: content row not found under that logical identity';
  END IF;

  IF v_target.import_admitted THEN
    RAISE EXCEPTION 'admit_catalog_content: this version is already admitted; admission is one-time and one-way';
  END IF;
  IF v_target.content_status = 'pending' THEN
    RAISE EXCEPTION 'admit_catalog_content: admission cannot precede human approval; the version is still pending review';
  END IF;
  IF v_target.content_status <> 'approved' THEN
    RAISE EXCEPTION 'admit_catalog_content: only approved content may be admitted; revised and rejected versions require a new content version';
  END IF;
  IF v_target.publication_status <> 'draft' THEN
    RAISE EXCEPTION 'admit_catalog_content: only an unpublished draft may be admitted';
  END IF;
  IF v_target.reviewed_by IS NULL
     OR char_length(btrim(v_target.reviewed_by)) = 0
     OR v_target.reviewed_at IS NULL
     OR v_target.review_rationale IS NULL
     OR char_length(btrim(v_target.review_rationale)) = 0 THEN
    RAISE EXCEPTION 'admit_catalog_content: incomplete review evidence';
  END IF;
  IF p_source_artifact_sha256 IS NULL
     OR p_source_artifact_sha256 !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'admit_catalog_content: p_source_artifact_sha256 must be a 64-character lowercase hex SHA-256 of the exact reviewed repository artifact';
  END IF;

  -- computed from database state; also raises on incomplete bound
  -- state (no/duplicate active snapshot, NULL discovery metadata)
  v_fingerprint := public.exlib_content_admission_fingerprint(p_content_id);

  UPDATE public.exercise_catalog_content
  SET import_admitted        = true,
      admitted_fingerprint   = v_fingerprint,
      admitted_source_sha256 = p_source_artifact_sha256,
      admitted_at            = CURRENT_DATE
  WHERE id = p_content_id;

  RETURN jsonb_build_object(
    'logical_id',             p_logical_id,
    'admitted',               p_content_id,
    'content_version',        v_target.content_version,
    'admitted_fingerprint',   v_fingerprint,
    'admitted_source_sha256', p_source_artifact_sha256
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION admit_catalog_content(UUID, UUID, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION admit_catalog_content(UUID, UUID, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION admit_catalog_content(UUID, UUID, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION admit_catalog_content(UUID, UUID, TEXT) TO exlib_catalog_admission;

-- 4d. PUBLICATION authority (round-2 finding 1): publishes only an
-- approved, admitted, fingerprint-fresh draft, and ATOMICALLY - in
-- one transaction under the logical-identity lock - retires the
-- prior published version, replaces the protected projection with
-- the new version's expected set, and marks the new version
-- published. A failure anywhere rolls the whole transaction back,
-- leaving the prior version and its projection intact. No externally
-- observable state can pair a published version with another
-- version's relationship set.
CREATE OR REPLACE FUNCTION publish_catalog_content(
  p_logical_id UUID,
  p_content_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_target    public.exercise_catalog_content%ROWTYPE;
  v_current   UUID;
  v_computed  TEXT;
  v_projected INTEGER;
BEGIN
  -- 1. serialize promotions per logical identity
  PERFORM 1 FROM public.exercise_catalog_logical l
  WHERE l.id = p_logical_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'publish_catalog_content: unknown logical identity';
  END IF;

  -- 2a. the content row must belong to the logical identity
  SELECT c.* INTO v_target
  FROM public.exercise_catalog_content c
  WHERE c.id = p_content_id AND c.logical_id = p_logical_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'publish_catalog_content: content row not found under that logical identity';
  END IF;

  -- 2b. only a draft can be published
  IF v_target.publication_status <> 'draft' THEN
    RAISE EXCEPTION 'publish_catalog_content: only a draft can be published; re-publishing a published or retired version is rejected';
  END IF;

  -- 2c/2d. review state and complete evidence (CHECKs enforce this
  -- structurally; revalidated here fail-closed)
  IF v_target.content_status <> 'approved' THEN
    RAISE EXCEPTION 'publish_catalog_content: only approved content can be published; pending, revised, and rejected content can never be published';
  END IF;
  IF v_target.reviewed_by IS NULL
     OR char_length(btrim(v_target.reviewed_by)) = 0
     OR v_target.reviewed_at IS NULL
     OR v_target.review_rationale IS NULL
     OR char_length(btrim(v_target.review_rationale)) = 0 THEN
    RAISE EXCEPTION 'publish_catalog_content: incomplete review evidence';
  END IF;

  -- 2e. admission must exist
  IF NOT v_target.import_admitted THEN
    RAISE EXCEPTION 'publish_catalog_content: content is not import-admitted; eligibility is a separate, explicitly approved act';
  END IF;

  -- 2f. the COMPLETE normalized manifest fingerprint must still
  -- match the admission: any bound snapshot, anatomy, alias,
  -- content, authorship, review-evidence, or expected-relationship
  -- change - or a now-missing/incomplete bound surface, which makes
  -- the manifest computation itself RAISE - fails closed
  v_computed := public.exlib_content_admission_fingerprint(p_content_id);
  IF v_target.admitted_fingerprint IS DISTINCT FROM v_computed THEN
    RAISE EXCEPTION 'publish_catalog_content: import admission is STALE - a bound surface (snapshot, anatomy, alias, content, authorship, review evidence, or expected relationship) changed after admission; a new version, new review, and new admission are required';
  END IF;

  -- 3. retire the currently published version, if one exists
  SELECT c2.id INTO v_current
  FROM public.exercise_catalog_content c2
  WHERE c2.logical_id = p_logical_id
    AND c2.publication_status = 'published'
  FOR UPDATE;
  IF FOUND THEN
    UPDATE public.exercise_catalog_content
    SET publication_status = 'retired'
    WHERE id = v_current;
  END IF;

  -- 4. ATOMIC PROJECTION SWAP under the identity lock: the protected
  -- live surface becomes exactly the new version's expected set. The
  -- transaction-local sentinel authorizes the projection trigger for
  -- THIS identity only, and is cleared immediately after.
  PERFORM set_config('exlib.relationship_projection_identity',
                     p_logical_id::text, true);
  DELETE FROM public.exercise_catalog_relationships
  WHERE from_logical_id = p_logical_id;
  INSERT INTO public.exercise_catalog_relationships
    (from_logical_id, to_logical_id, relation)
  SELECT p_logical_id, e.to_logical_id, e.relation
  FROM public.exercise_catalog_content_expected_relationships e
  WHERE e.content_id = p_content_id;
  GET DIAGNOSTICS v_projected = ROW_COUNT;
  PERFORM set_config('exlib.relationship_projection_identity', '', true);

  -- 5. publish the replacement (the freeze trigger structurally
  -- re-verifies projection equality and manifest freshness here)
  UPDATE public.exercise_catalog_content
  SET publication_status = 'published'
  WHERE id = p_content_id;

  RETURN jsonb_build_object(
    'logical_id',              p_logical_id,
    'published',               p_content_id,
    'retired',                 v_current,
    'content_version',         v_target.content_version,
    'projected_relationships', v_projected
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION publish_catalog_content(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION publish_catalog_content(UUID, UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION publish_catalog_content(UUID, UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION publish_catalog_content(UUID, UUID) TO exlib_catalog_admin;

COMMIT;

-- ── 5. Rollback boundary and compatibility (documentation) ───────
-- PRE-USE ROLLBACK ONLY (before any content, expected-relationship,
-- relationship, or original-provenance snapshot row exists):
--   DROP FUNCTION publish_catalog_content(UUID, UUID);
--   DROP FUNCTION admit_catalog_content(UUID, UUID, TEXT);
--   DROP FUNCTION apply_content_review(UUID, UUID, TEXT, TEXT, TIMESTAMPTZ, TEXT);
--   DROP FUNCTION load_catalog_content_draft(UUID, UUID, INTEGER, TEXT, DATE, JSONB, JSONB, TEXT, JSONB, TEXT, TEXT, TEXT, JSONB);
--   DROP FUNCTION load_catalog_snapshot(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, DATE, TEXT, JSONB, JSONB);
--   DROP FUNCTION load_catalog_identity(UUID);
--   DROP FUNCTION exlib_content_admission_fingerprint(UUID);
--   DROP FUNCTION exlib_content_admission_manifest(UUID);
--   DROP FUNCTION exlib_manifest_hex(TEXT);
--   DROP TRIGGER exercise_catalog_relationships_projection_trigger
--     ON exercise_catalog_relationships;
--   DROP FUNCTION exlib_protect_relationship_projection();
--   DROP TABLE exercise_catalog_relationships;
--   DROP TRIGGER exercise_catalog_content_expected_relationships_freeze_trigger
--     ON exercise_catalog_content_expected_relationships;
--   DROP FUNCTION exlib_freeze_expected_relationships();
--   DROP TABLE exercise_catalog_content_expected_relationships;
--   DROP TRIGGER exercise_catalog_content_freeze_trigger ON exercise_catalog_content;
--   DROP FUNCTION exlib_freeze_content_version();
--   DROP TABLE exercise_catalog_content;
--   ALTER TABLE exercise_catalog
--     DROP CONSTRAINT exercise_catalog_provenance_sources_chk,
--     DROP CONSTRAINT exercise_catalog_discovery_metadata_chk,
--     DROP COLUMN provenance, DROP COLUMN movement_pattern,
--     DROP COLUMN training_role, DROP COLUMN difficulty,
--     DROP COLUMN availability;
--   (restore the 023 NOT NULLs and freeze trigger from the 023 bytes;
--    the four NOLOGIN roles may be dropped only if nothing else on
--    the cluster has adopted them)
-- Once ANY dependent row exists, rollback is a reviewed data
-- operation, not a schema drop. Applying this proposal twice fails
-- closed (duplicate objects), matching the repository's
-- apply-exactly-once migration model; because every statement is
-- inside the single transaction above, that second attempt rolls back
-- WHOLLY - it can neither half-apply nor partially mutate anything.
-- The proposal is therefore NOT idempotent by design (no IF NOT
-- EXISTS shortcuts on the schema objects): a duplicate application is
-- an operator error that must surface loudly, not be silently
-- absorbed. The one exception is the set of four roles, which are
-- guarded by pg_roles existence checks because a cluster may
-- legitimately already define them. Existing external-import rows -
-- INCLUDING a legitimate nonempty 023 catalog - remain valid without
-- rewriting their meaning: provenance defaults to
-- external_source_derived, their complete source fields already
-- satisfy the conditional CHECK, their discovery metadata stays NULL
-- rather than fabricated, and unchanged 023-026 behavior (claims,
-- snapshots, anatomy seal, runs, seal/approval, delivery, rollback)
-- never reads the new columns. Migration 026 behavior is untouched:
-- no 026 object is modified, and deliver/rollback read explicit
-- columns or adapt via %ROWTYPE. Applying this schema performs NO
-- load, review decision, approval, admission, seal, publication, or
-- delivery.
