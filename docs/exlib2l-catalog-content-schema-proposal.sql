-- ============================================================
-- EXLIB-2L PROPOSAL: catalog-content and relationship schema
-- (DRAFT - NOT APPLIED - NOT A MIGRATION)
--
-- STATUS: IMPLEMENTATION PROPOSAL ONLY. This file lives in docs/,
-- NOT in supabase/migrations/, because it has NOT been approved for
-- application. It must never be applied to any hosted environment;
-- only Joseph/ChatGPT may ever apply migrations, and only after this
-- proposal passes review and is moved into supabase/migrations/ by an
-- explicitly authorized later phase.
--
-- Implements the promoted EXLIB-2A catalog architecture exactly
-- (docs/exlib2a-catalog-architecture-record.md sections 1-4):
--   1. provenance discriminator on exercise_catalog with
--      fail-closed conditional source requirements (section 2), the
--      four discovery-metadata columns (section 3), and the
--      verbatim-carried snapshot freeze trigger extended to keep the
--      new columns immutable;
--   2. exercise_catalog_content - the versioned, logical-identity-
--      keyed content model with its own review-audit lifecycle, an
--      orthogonal draft/published/retired publication lifecycle, the
--      zero-or-one-published invariant, decided-version immutability,
--      and the EXLIB-2J-mandated fingerprint-bound import-admission
--      binding (staleness fails publication closed);
--   3. exercise_catalog_relationships - logical-identity-keyed,
--      self-reference-free, deterministic-unique, fail-closed;
--   4. publish_catalog_content - the role-restricted atomic
--      publication function (validations a-d + admission-fingerprint
--      and relationship revalidation; retire-then-publish under the
--      logical row lock).
--
-- ONE DISCLOSED DEVIATION FROM PROMOTED EXLIB-2A (needs reviewer
-- adjudication; nothing is applied by this file):
--   2A's section-1 pseudocode makes BOTH 'approved' and 'revised'
--   publishable (CHECK ... content_status IN ('approved','revised'),
--   restated five times in that record). This proposal narrows the
--   publishable set to 'approved' ALONE, in both the CHECK and the
--   publication function, because:
--     a. the EXLIB-2L instruction requires it three separate times
--        (Part 4.B "structural prevention of publishing pending,
--        revised, rejected"; Part 4.D "prevent pending/revised/
--        rejected content from publication"; Part 5's live proof
--        "prove pending/rejected/revised content cannot publish");
--     b. migration 023's own committed bytes define 'revised' as a
--        TERMINAL outcome with "re-approval impossible" (line 106)
--        and pair it with 'rejected' in every transition rule
--        (approved -> revised|rejected), so a 'revised' version is a
--        sent-back version, NOT an accepted one - publishing it would
--        ship content a reviewer terminally rejected for revision;
--     c. the narrowing is strictly MORE fail-closed and removes
--        nothing that is needed: the admitted Plank record is
--        'approved', and it additionally closes a real hole where a
--        PUBLISHED 'approved' row could be flipped to 'revised' in
--        place and stay published.
--   Nothing else departs from 2A, and 2A's four-value review
--   vocabulary is preserved exactly; only PUBLISHABILITY narrows. If
--   review prefers 2A's literal wording, this is a one-line change in
--   two places (the CHECK and validation 2c) - but it should then be
--   accompanied by a rule preventing published rows from being flipped
--   to 'revised'.
--
-- Applying this schema loads NOTHING: it creates no catalog row, no
-- content row, no relationship, no run, no membership, no approval,
-- no seal, no publication, and no delivery. Migrations 001-026 are
-- not modified; every 023-026 function, trigger, ACL, and behavior
-- is preserved (the one CREATE OR REPLACE below carries the 023
-- trigger body verbatim except the marked immutable-list splice).
-- ============================================================

-- Following migrations 023/024/025 (023: "ONE explicit top-level
-- transaction encloses every executable statement below. Do not rely
-- on any client to batch."), every executable statement in this
-- proposal is enclosed in one transaction, so a partial failure can
-- never leave a half-applied schema.
BEGIN;

-- ── 1. exercise_catalog: provenance + discovery metadata ─────────
-- Promoted 2A section 2 pseudocode, plus import_confidence made
-- provenance-conditional per the EXLIB-2L instruction (the 2K
-- feasibility finding: it has no truthful original-content value;
-- fabricating one is forbidden). The hosted catalog holds ZERO rows
-- (promoted EXLIB-2F application evidence), so the NOT NULL metadata
-- additions are exact; if rows unexpectedly existed, application
-- fails closed rather than fabricating values.
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
-- unambiguous name.
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
ALTER TABLE exercise_catalog
  ADD COLUMN movement_pattern TEXT NOT NULL CHECK (movement_pattern IN (
    'horizontal_push','incline_push','vertical_push','dip_push',
    'horizontal_pull','vertical_pull','pullover','fly_adduction',
    'shrug','shoulder_raise','elbow_flexion','elbow_extension',
    'grip_forearm','squat','hinge','lunge','leg_extension',
    'leg_curl','calf_raise','hip_extension','hip_abduction',
    'hip_adduction','core_flexion','core_rotation',
    'core_anti_extension','core_anti_rotation','core_lateral','carry',
    'cyclic_cardio','locomotion','jump','ground_to_standing',
    'mobility_flow','static_stretch','spinal_articulation')),
  ADD COLUMN training_role TEXT NOT NULL CHECK (training_role IN (
    'compound','isolation','accessory','core','conditioning','mobility')),
  ADD COLUMN difficulty TEXT NOT NULL CHECK (difficulty IN (
    'beginner','intermediate','advanced')),
  ADD COLUMN availability TEXT NOT NULL CHECK (availability IN (
    'minimal','home_gym','commercial_gym'));

-- The 023 snapshot freeze trigger, carried VERBATIM except the
-- marked EXLIB-2L splice adding the new columns to the immutable
-- list. Snapshot review-audit, one-way transitions, fresh-evidence
-- demands, the review-events log write, and one-way deactivation are
-- byte-preserved.
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

-- ── 2. exercise_catalog_content (2A section 1, verbatim model) ───
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
  -- EXLIB-2J import-admission binding: eligibility is an explicit,
  -- fingerprint-bound fact. Blank/false never reads as admitted, and
  -- the publication function rejects a fingerprint that no longer
  -- matches the row's current content (stale admission fails
  -- closed).
  import_admitted      BOOLEAN NOT NULL DEFAULT false,
  admitted_fingerprint TEXT,
  admitted_at          DATE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (logical_id, content_version),
  -- DELIBERATE, DISCLOSED NARROWING vs promoted 2A (see the header
  -- note): 'approved' is the ONLY publishable review state. 2A's
  -- pseudocode says IN ('approved','revised'); migration 023's own
  -- bytes call revised TERMINAL with "re-approval impossible" and
  -- group it with rejected in every transition rule, so publishing a
  -- 'revised' version would ship content a reviewer terminally sent
  -- back. This CHECK also makes it impossible to flip a PUBLISHED
  -- row to 'revised' in place: retire it first, then record the
  -- revision decision (the EXLIB-2G safe-rollback ordering).
  CONSTRAINT exercise_catalog_content_publication_chk CHECK (
    publication_status <> 'published'
    OR content_status = 'approved'
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
  CONSTRAINT exercise_catalog_content_admission_chk CHECK (
    (import_admitted = false
     AND admitted_fingerprint IS NULL
     AND admitted_at IS NULL)
    OR (import_admitted = true
        AND admitted_fingerprint IS NOT NULL
        AND char_length(btrim(admitted_fingerprint)) > 0
        AND admitted_at IS NOT NULL)
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

-- Deterministic content fingerprint over the authored payload. Field
-- values are joined with an ASCII unit separator; NULLs are encoded
-- distinctly so shape changes always change the fingerprint.
--
-- authored_at is folded in as an INTEGER day offset from 1970-01-01,
-- never as date::text: date_out is only STABLE, and DateStyle really
-- does change its output (2026-09-01 / 09/01/2026 / 01.09.2026), so a
-- text cast would make the same payload hash differently per session
-- and spuriously fail a valid publication as STALE. date_mi and
-- int4out are both immutable, so this form is genuinely
-- session-independent and the IMMUTABLE marking is truthful.
CREATE OR REPLACE FUNCTION exlib_content_fingerprint(
  p_setup JSONB, p_execution JSONB, p_breathing TEXT, p_mistakes JSONB,
  p_safety TEXT, p_equipment_setup TEXT, p_accessibility TEXT,
  p_authored_by TEXT, p_authored_at DATE
) RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
  SELECT md5(
    p_setup::text        || chr(31) ||
    p_execution::text    || chr(31) ||
    p_breathing          || chr(31) ||
    p_mistakes::text     || chr(31) ||
    p_safety             || chr(31) ||
    COALESCE('S:' || p_equipment_setup, 'N') || chr(31) ||
    COALESCE('S:' || p_accessibility,   'N') || chr(31) ||
    p_authored_by        || chr(31) ||
    (p_authored_at - DATE '1970-01-01')::text
  );
$$;
REVOKE ALL ON FUNCTION exlib_content_fingerprint(JSONB, JSONB, TEXT, JSONB, TEXT, TEXT, TEXT, TEXT, DATE)
  FROM PUBLIC, anon, authenticated;

-- Content-version lifecycle trigger (2A section 1 freeze
-- conventions): versions are born pending drafts with no review
-- evidence and no publication; a PENDING draft's prose may still be
-- edited (pre-review authoring), but once DECIDED the authored
-- payload, authorship, version identity, and review evidence are
-- immutable - the ONLY permitted post-decision mutations are the
-- one-way publication transitions (draft -> published -> retired)
-- and they never travel with any other change. Review transitions
-- are one-way with complete fresh evidence, mirroring the catalog
-- snapshot contract. Admission fields never change after a decision
-- and may never change together with a publication transition.
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
    RETURN NEW;
  END IF;

  -- version identity and authorship are immutable from birth
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
       OR NEW.admitted_at IS DISTINCT FROM OLD.admitted_at THEN
      RAISE EXCEPTION
        'exercise_catalog_content: a publication transition must travel alone';
    END IF;
    RETURN NEW;
  END IF;

  -- review transitions: one-way, complete fresh evidence
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
    -- the decided payload freezes at the decision: the transition may
    -- not smuggle prose or admission changes
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
       OR NEW.admitted_at IS DISTINCT FROM OLD.admitted_at THEN
      RAISE EXCEPTION
        'exercise_catalog_content: a review transition carries evidence only; payload and admission changes are separate pre-decision edits';
    END IF;
    RETURN NEW;
  END IF;

  -- no transition: pending drafts may edit prose/admission (pre-review
  -- authoring and admission recording); decided versions are frozen
  IF OLD.content_status <> 'pending' THEN
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
       OR NEW.admitted_at IS DISTINCT FROM OLD.admitted_at THEN
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

-- ── 3. exercise_catalog_relationships (2A section 4, verbatim) ───
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

ALTER TABLE exercise_catalog_relationships ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE exercise_catalog_relationships
  FROM PUBLIC, anon, authenticated;

-- ── 4. Role and publication function (2A section 1, verbatim
--       lifecycle; EXLIB-2J admission validation added per the
--       promoted eligibility contract) ───────────────────────────
DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'exlib_catalog_admin') THEN
    CREATE ROLE exlib_catalog_admin NOLOGIN;
  END IF;
END
$do$;

CREATE OR REPLACE FUNCTION publish_catalog_content(
  p_logical_id UUID,
  p_content_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_target   public.exercise_catalog_content%ROWTYPE;
  v_current  UUID;
  v_computed TEXT;
  v_bad_rel  INTEGER;
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

  -- 2e. EXLIB-2J admission: eligibility must be present and bound to
  -- EXACTLY the current content payload; stale admission fails closed
  IF NOT v_target.import_admitted THEN
    RAISE EXCEPTION 'publish_catalog_content: content is not import-admitted; eligibility is a separate, explicitly approved act';
  END IF;
  v_computed := public.exlib_content_fingerprint(
    v_target.setup_steps, v_target.execution_steps, v_target.breathing_cue,
    v_target.common_mistakes, v_target.safety_guidance,
    v_target.equipment_setup, v_target.accessibility_alternative,
    v_target.authored_by, v_target.authored_at);
  IF v_target.admitted_fingerprint IS DISTINCT FROM v_computed THEN
    RAISE EXCEPTION 'publish_catalog_content: import admission is STALE - the content changed after admission; re-review and re-admission are required';
  END IF;

  -- 2f. relationships fail-closed revalidation (FKs make orphans
  -- structurally impossible; revalidated here so a publication can
  -- never proceed past a broken resolver state)
  SELECT count(*) INTO v_bad_rel
  FROM public.exercise_catalog_relationships r
  WHERE (r.from_logical_id = p_logical_id OR r.to_logical_id = p_logical_id)
    AND (NOT EXISTS (SELECT 1 FROM public.exercise_catalog_logical l2 WHERE l2.id = r.from_logical_id)
         OR NOT EXISTS (SELECT 1 FROM public.exercise_catalog_logical l3 WHERE l3.id = r.to_logical_id)
         OR r.from_logical_id = r.to_logical_id);
  IF v_bad_rel > 0 THEN
    RAISE EXCEPTION 'publish_catalog_content: % unresolved or impermissible relationship target(s)', v_bad_rel;
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

  -- 4. publish the replacement
  UPDATE public.exercise_catalog_content
  SET publication_status = 'published'
  WHERE id = p_content_id;

  RETURN jsonb_build_object(
    'logical_id',      p_logical_id,
    'published',       p_content_id,
    'retired',         v_current,
    'content_version', v_target.content_version
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION publish_catalog_content(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION publish_catalog_content(UUID, UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION publish_catalog_content(UUID, UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION publish_catalog_content(UUID, UUID) TO exlib_catalog_admin;

COMMIT;

-- ── 5. Rollback boundary and compatibility (documentation) ───────
-- PRE-USE ROLLBACK ONLY (before any content/relationship row or any
-- original-provenance snapshot exists):
--   DROP FUNCTION publish_catalog_content(UUID, UUID);
--   DROP TRIGGER exercise_catalog_content_freeze_trigger ON exercise_catalog_content;
--   DROP FUNCTION exlib_freeze_content_version();
--   DROP FUNCTION exlib_content_fingerprint(JSONB, JSONB, TEXT, JSONB, TEXT, TEXT, TEXT, TEXT, DATE);
--   DROP TABLE exercise_catalog_relationships;
--   DROP TABLE exercise_catalog_content;
--   ALTER TABLE exercise_catalog
--     DROP CONSTRAINT exercise_catalog_provenance_sources_chk,
--     DROP COLUMN provenance, DROP COLUMN movement_pattern,
--     DROP COLUMN training_role, DROP COLUMN difficulty,
--     DROP COLUMN availability;
--   (restore the 023 NOT NULLs and freeze trigger from the 023 bytes)
-- Once ANY dependent row exists, rollback is a reviewed data
-- operation, not a schema drop. Applying this proposal twice fails
-- closed (duplicate objects), matching the repository's
-- apply-exactly-once migration model; because every statement is
-- inside the single transaction above, that second attempt rolls back
-- WHOLLY - it can neither half-apply nor partially mutate anything.
-- The proposal is therefore NOT idempotent by design (no IF NOT
-- EXISTS shortcuts on the schema objects): a duplicate application is
-- an operator error that must surface loudly, not be silently
-- absorbed. The one exception is the role, which is guarded by a
-- pg_roles existence check because a cluster may legitimately already
-- define exlib_catalog_admin. Existing external-import rows
-- (zero on hosted) remain valid: provenance defaults to
-- external_source_derived and their source fields already satisfy
-- the conditional CHECK. Migration 026 behavior is untouched: no 026
-- object is modified, and deliver/rollback read explicit columns or
-- adapt via %ROWTYPE. Applying this schema performs NO load,
-- approval, seal, publication, or delivery.
