-- ============================================================
-- ForgeFitOS EXLIB-1B2 — Exercise Catalog + Delivery Contract
-- 023_exlib_catalog_and_delivery_contract.sql   (REVISION G)
-- ============================================================
-- STATUS: DRAFT — NOT APPLIED. Joseph must not apply ANY version of
-- migration 023 until ChatGPT reviews the SQL line by line and
-- explicitly approves the exact revised fingerprint recorded in
-- docs/exlib1b1-architecture-and-review-notes.md.
-- SUPERSEDED fingerprints — DO NOT APPLY:
--   Revision F (REJECTED in review):
--               77ddadff1f3cc8a5b718d82432e912280ad5f1504ca612ddf2f65e3ce65ca00b
--   Revision E (REJECTED in review):
--               8b155d4709c595b7ea15f847eaf7d9bac6c893696d71bf8ccc8e7954d615df16
--   Revision D: 4d27e0e79693d396b75e3a8a8db09567f29e7c2e4f9c44d3756fe5d58a08de22
--   Revision C: 5923075e67392d5d63db949ead11162a4400b1aa8a62be20b823f227b415ec63
--   Revision B: 730899c7b533676cb2045c522ecb367913428eaa2c04e5af0f80c2d3bcf13c37
--   Revision A: 944c2186504fa007a32c2b5ec39f63cf275c75c1685d0ab2f3d824f699dee232
--   Original:   8c90b88924ce46737499bed97227435387cef423ade9f0ecf1f3d3584e50af6a
-- Run AFTER 022.
--
-- Revision G findings closed (on top of every A/B/C/D/E/F
-- protection):
--   (G1) THE ANATOMY/REVIEW RACE IS CLOSED: the anatomy mutation
--        trigger now SELECTs the parent exercise_catalog row
--        FOR UPDATE BEFORE evaluating review_status, and every
--        review-status transition is an UPDATE of that same row —
--        so anatomy mutation and review transition serialize on the
--        parent snapshot's row lock. Whichever transaction locks
--        first wins; the loser waits and then sees the committed
--        state (a waiting anatomy write observes the non-pending
--        status and fails; a waiting approval proceeds against the
--        completed anatomy). The permanent anatomy seal at the
--        first transition out of pending is unchanged. Two-session
--        interleaving tests run on a DISPOSABLE LOCAL PostgreSQL
--        cluster (scripts/verify-exlib1b2-live-concurrency.sh) —
--        never on Supabase.
--   (G2) REVIEW EVIDENCE IS FRESH, COMPLETE, AND APPEND-ONLY:
--        snapshots are born pending with ALL review-audit fields
--        NULL (CHECK-enforced). EVERY status transition must carry
--        a complete, non-blank audit tuple (reviewer, timestamp,
--        rationale) that DIFFERS from the prior tuple — a
--        status-only flip (e.g. approved -> rejected reusing the
--        approval evidence) fails, and same-status audit rewriting
--        still fails. Each allowed transition APPENDS a row to the
--        new closed exercise_catalog_review_events table (immutable
--        log: UPDATE/DELETE always raise; INSERT is possible only
--        from inside the snapshot trigger via a trigger-depth
--        guard), so the full decision history is preserved while
--        the snapshot row stores only the CURRENT decision's
--        evidence.
--
-- Revision F findings closed (on top of every A/B/C/D/E protection):
--   (F1) RUN MEMBERSHIP IS PERMANENTLY SEALED. Runs gain an
--        immutable sealed_at: the FIRST valid approval — performed
--        only through exlib_approve_and_seal_run(), which locks the
--        run row FOR UPDATE, validates the approval evidence,
--        validates the membership, sets sealed_at, and enables
--        delivery in ONE atomic transition (a BEFORE trigger
--        revalidates the identical transition, so no direct-UPDATE
--        path can seal without the same validation) — freezes the
--        membership FOREVER. A sealed run's membership can never be
--        inserted, updated, or deleted, even after delivery is
--        disabled: changed membership always requires a NEW run.
--        approved_for_delivery can never reopen editing (the
--        membership freeze keys EXCLUSIVELY on sealed_at, and a
--        CHECK couples approved_for_delivery = true to
--        sealed_at IS NOT NULL, both frozen after sealing).
--        Emergency shutdown is the separate ONE-WAY revoked_at
--        (settable only on sealed runs, never clearable, never a
--        reopening mechanism). Membership INSERT/DELETE locks the
--        parent run row FOR UPDATE — the same lock the approval
--        takes — closing the approval/edit race. Once sealed,
--        run_key, dry_run, membership, both approver identities and
--        timestamps, the approval rationale, approved_for_delivery,
--        sealed_at, and created_at are immutable; ONLY the
--        documented operational fields (started_at, completed_at,
--        result_counts) and the one-way revoked_at remain mutable.
--   (F2) THE DELIVERABLE SET CAN NEVER EXPAND AFTER APPROVAL.
--        Sealing REQUIRES every exercise member to already be
--        review_status='approved', is_active=true, and fully
--        review-audited (non-blank reviewer + rationale); an empty
--        membership cannot seal. After sealing, no member can newly
--        become deliverable: snapshots are born pending+active,
--        review_status is ONE-WAY (pending -> approved|revised|
--        rejected; approved -> revised|rejected; revised/rejected
--        terminal; NEVER back to pending; re-approval impossible),
--        and is_active is ONE-WAY (true -> false only). The
--        delivery-time member gates are therefore provably
--        SHRINK-ONLY: emergency withdrawal (deactivate or reject a
--        snapshot) removes it from FUTURE delivery of every sealed
--        run, and restoring it requires a NEW catalog version row
--        and a NEW sealed run — never reuse of old approval
--        evidence. Alias-only later runs are preserved and each
--        requires its own sealed membership and its own product +
--        legal approval. DISABLING AN ALREADY-DELIVERED SNAPSHOT:
--        delivered tenant rows are the user's owned copies with
--        immutable provenance — they are NEVER mutated, deactivated,
--        or deleted by catalog-side disabling; per-user rollback of
--        the run (and the user's own deactivation controls) remain
--        the only tenant-side deactivation paths, and re-delivery
--        stays an idempotent skip on the logical key.
--   (F3) ANATOMY SEALING IS IRREVERSIBLE. Because review_status can
--        NEVER return to 'pending' (one-way machine above), the
--        anatomy gate (INSERT/DELETE only while the snapshot is
--        pending; UPDATE never) is now a PERMANENT seal at the first
--        transition out of pending, regardless of any later status
--        change. Review-audit fields can change only together with
--        an allowed status transition, so a recorded review decision
--        cannot be silently rewritten. Corrections require a new
--        catalog version row with its own anatomy and its own
--        review; rejection (approved -> rejected) and deactivation
--        remain available as operational disable paths that never
--        reopen content editing.
--
-- Revision E findings closed (on top of every A/B/C/D protection):
--   (E1) RUN MEMBERSHIP IS BOUND AND FROZEN: the new
--        exercise_catalog_run_items table binds each import run to
--        the EXACT catalog snapshots (exercises + their anatomy via
--        the immutable snapshot) and catalog aliases it may deliver.
--        Delivery joins ONLY the requested run's membership
--        (ri.run_id = v_run.id in BOTH loops) — an old approved run
--        can never deliver later-added or later-modified content.
--        Membership rows are immutable, and INSERT/DELETE raise
--        while the run is approved (exlib_freeze_run_membership);
--        revoking approval reopens editing but disables delivery
--        (fail-closed in both directions). Explicitly approved
--        later-run alias delivery is preserved: an alias-only run
--        delivers exactly its own approved alias members, resolving
--        targets by logical identity.
--   (E2) approval and review identities/rationales must be REAL at
--        the CHECK boundary: product_approved_by, legal_approved_by,
--        approval_rationale, reviewed_by, and review_rationale all
--        require char_length(btrim(x)) > 0 alongside IS NOT NULL —
--        empty and whitespace-only values fail the constraint.
--   (E3) catalog snapshot identity/content is IMMUTABLE after
--        insertion (exlib_freeze_catalog_snapshot raises on any
--        change to logical_id, canonical_name, classification,
--        provenance, or version columns): corrections are NEW
--        version rows. Anatomy rows are immutable and sealed once
--        their snapshot leaves pending review
--        (exlib_freeze_catalog_anatomy). Catalog alias rows are
--        immutable (exlib_freeze_catalog_alias). Claim ownership can
--        therefore never go stale through logical_id mutation, and
--        an approved run's contents are sealed against every
--        post-approval content mutation.
--   (E4) tenant alias SELECT policy tightened:
--        TO authenticated USING ((SELECT auth.uid()) = user_id).
--
-- Revision D findings closed (on top of every A/B/C protection):
--   (D1) EXERCISE DEACTIVATION CASCADES TO ALIASES, database-
--        enforced: any true -> false transition of
--        exercises.is_active fires
--        exlib_deactivate_exercise_aliases() (AFTER UPDATE OF
--        is_active), which deactivates every ACTIVE alias attached
--        to that exercise — rows and provenance preserved, active
--        namespace claims released by the alias claim trigger. This
--        covers catalog rollback, the product PATCH route, and every
--        future authorized deactivation path; no route or function
--        has to remember a second update. The contract that active
--        aliases resolve only to active exercises is now structural.
--   (D2) rollback reporting stays provenance-precise: aliases
--        DIRECTLY delivered by the run (a.import_run_id = run id,
--        wherever attached) are reported as alias_found /
--        alias_newly_deactivated / alias_already_inactive; DEPENDENT
--        aliases (other runs' or user-authored) deactivated only
--        because their target exercise is being deactivated are
--        counted separately as alias_dependent_deactivated and are
--        NEVER attributed to the run's own deliveries. The run's
--        active exercises are locked FOR UPDATE before the dependent
--        set is counted, and clients hold no exercise_aliases write
--        grant, so the count exactly matches the cascade.
--   (D3) alias delivery is BLOCKED for inactive target exercises: a
--        later run that meets an already-delivered logical whose
--        tenant exercise is inactive inserts NOTHING for its
--        not-yet-delivered aliases and reports them as
--        alias_skipped_inactive_exercise (deterministic; retries
--        idempotent; an active-but-nonresolving alias can never be
--        created). Already-delivered aliases still report
--        alias_already_delivered.
--   (D4) delivered-row DELETION is fail-closed pending an explicit
--        product decision: exlib_block_delivered_exercise_delete()
--        (BEFORE DELETE) rejects physical deletion of any exercise
--        carrying catalog provenance. User-created rows
--        (catalog_id/catalog_logical_id/import_run_id all NULL) keep
--        today's DELETE behavior exactly. No delivered row can exist
--        before an approved run, so current product behavior is
--        unchanged.
--   (D5) exlib_verify_alias_lifecycle() provides the read-only
--        lookup-safety invariant: zero ACTIVE aliases attached to
--        INACTIVE exercises.
--
-- Revision C findings closed (on top of every Revision A/B protection):
--   (C1) the PRE-EXISTING exercises_user_name_unique_idx (migration
--        003, (user_id, lower(name))) fires BEFORE the AFTER claim
--        trigger, so it joins the exercise-block allowlist mapped to
--        skipped_name_collision. The complete expected-collision set
--        for a delivered exercise INSERT is exactly:
--        exercises_user_name_unique_idx, exercise_name_claims_pkey,
--        exercises_user_catalog_logical_unique_idx. Unknown names
--        stay fail-closed.
--   (C2) delivered-alias provenance + lifecycle: exercise_aliases
--        gains import_run_id (RESTRICT FK) alongside catalog_alias_id;
--        declarative alias idempotency via the partial unique
--        (user_id, catalog_alias_id) — inactive audit rows can never
--        multiply on retries. POLICY: a later approved run MAY add
--        newly approved catalog aliases to an already-delivered
--        exercise; those inserts carry the LATER run's id, are
--        reported separately (alias_added_to_existing), and rollback
--        of that run DIRECTLY deactivates precisely the aliases whose
--        import_run_id matches. (Revision D refines the lifecycle:
--        deactivating an exercise additionally cascades to its
--        remaining active aliases as DEPENDENT deactivations,
--        reported separately — see D1/D2 above.)
--        A deactivated delivered alias encountered again is
--        a deterministic idempotency skip (alias_already_delivered);
--        reactivation stays an explicit future operation. Provenance
--        is immutable to clients (exercise_aliases has NO
--        authenticated mutation grant at all).
--   (C3) catalog claim release is race-free by PROHIBITING multiple
--        active bearers per normalized claim: the one-active-per-name
--        and one-active-per-logical unique indexes plus the claims PK
--        guarantee EXACTLY ONE bearer (one active snapshot OR one
--        alias row) per normalized name, so the departing bearer's
--        trigger releases unconditionally — no check-then-delete
--        window exists. exlib_verify_catalog_claims() provides the
--        bidirectional invariant query for future read-only
--        verification. The tenant side shares the property: the
--        non-partial per-user exercises name index and the partial
--        active-alias index each allow at most one bearer per
--        (user, name), and the tenant claims PK excludes coexistence.
--
-- Revision B findings closed (on top of every Revision A protection):
--   (1) unique_violation handling now inspects
--       GET STACKED DIAGNOSTICS ... CONSTRAINT_NAME against an
--       explicit allowlist and RE-RAISES every unknown constraint;
--       each allowed constraint feeds its own counter (identity/
--       provenance conflicts are never labeled name collisions).
--   (2) ONE GLOBAL catalog namespace: exercise_catalog_name_claims
--       (PK normalized_name) covers ACTIVE canonical names AND
--       canonical aliases together — an alias equal to another
--       logical exercise's active name fails at the constraint
--       boundary; version snapshots of the SAME logical identity
--       re-using their name are a permitted no-op.
--   (3) complete rollback: tenant aliases gain is_active; rollback
--       deactivates the run's exercises AND their aliases, releasing
--       the aliases' ACTIVE namespace claims while keeping every row
--       for audit. Exercise-name claims deliberately survive
--       deactivation because the PRE-EXISTING exercises unique index
--       (user_id, lower(name)) is not partial — an inactive exercise
--       already reserves its name today; mirroring that is required
--       for consistency, not a rollback gap. Alias claims are
--       active-only, and the per-user alias unique index is partial
--       (WHERE is_active) so released alias names are reusable.
--   (4) advisory lock upgraded to the 64-bit
--       pg_advisory_xact_lock(hashtextextended(v_uid::text, 8231))
--       in BOTH functions (identical derivation). Hash collisions
--       between different users are theoretically possible: the
--       SAFETY property is serialization (a colliding pair merely
--       serializes); per-user concurrency separation is best-effort;
--       unique constraints remain the correctness backstop.
--
-- CONTAINS NO CONTENT DATA. No catalog rows, manifest records,
-- catalog aliases, or approvals are inserted. The ONLY inserted
-- rows are exercise_name_claims derived from the user's OWN
-- existing exercise names (index-like machinery required for the
-- cross-table uniqueness constraint to hold; no external content).
-- The current 15 per-user seeds are not rewritten. No product
-- route or seeder changes ship with this migration.
-- ============================================================

-- ── 1. Import runs (auditable approval gate) ─────────────────────
CREATE TABLE exercise_catalog_import_runs (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_key                TEXT NOT NULL UNIQUE
                         CHECK (char_length(btrim(run_key)) BETWEEN 8 AND 200),
  dry_run                BOOLEAN NOT NULL DEFAULT true,
  approved_for_delivery  BOOLEAN NOT NULL DEFAULT false,
  product_approved_by    TEXT,
  product_approved_at    TIMESTAMPTZ,
  legal_approved_by      TEXT,
  legal_approved_at      TIMESTAMPTZ,
  approval_rationale     TEXT,
  -- Revision F, finding 1: the PERMANENT seal. Set exactly once by
  -- the validated approval transition; never cleared; freezes the
  -- membership and every approval-bound field forever.
  sealed_at              TIMESTAMPTZ,
  -- Revision F, finding 1: ONE-WAY emergency delivery shutdown.
  -- Settable only on sealed runs, never cleared, and NEVER a
  -- mechanism to reopen membership or approval editing.
  revoked_at             TIMESTAMPTZ,
  -- Operational result fields (documented mutable; Revision F,
  -- finding 1 item 10): progress/outcome bookkeeping only — they
  -- carry no approval-decision content.
  started_at             TIMESTAMPTZ,
  completed_at           TIMESTAMPTZ,
  result_counts          JSONB,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- A run can NEVER become deliverable with blank approval
  -- identities, missing timestamps, missing rationale, or as a dry
  -- run. This is the database-enforced review/legal gate; nothing
  -- here populates or approves anything.
  -- Revision E, finding 2: identities and rationale must be REAL —
  -- NULL, empty, and whitespace-only values all fail. The IS NOT
  -- NULL guards are kept explicit so no branch of the OR can pass
  -- through an unknown (NULL) result.
  CONSTRAINT exercise_catalog_import_runs_approval_audit_chk CHECK (
    approved_for_delivery = false
    OR (product_approved_by IS NOT NULL
        AND char_length(btrim(product_approved_by)) > 0
        AND product_approved_at IS NOT NULL
        AND legal_approved_by IS NOT NULL
        AND char_length(btrim(legal_approved_by)) > 0
        AND legal_approved_at IS NOT NULL
        AND approval_rationale IS NOT NULL
        AND char_length(btrim(approval_rationale)) > 0
        AND dry_run = false)
  ),
  -- Revision F, finding 1: approval and the permanent seal are ONE
  -- state — neither can exist without the other.
  CONSTRAINT exercise_catalog_import_runs_seal_coupling_chk CHECK (
    (approved_for_delivery = true AND sealed_at IS NOT NULL)
    OR (approved_for_delivery = false AND sealed_at IS NULL)
  ),
  -- Revision F, finding 1: revocation exists only for sealed runs.
  CONSTRAINT exercise_catalog_import_runs_revoke_after_seal_chk CHECK (
    revoked_at IS NULL OR sealed_at IS NOT NULL
  )
);

-- ── 2. Stable logical catalog identity ───────────────────────────
CREATE TABLE exercise_catalog_logical (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3. Versioned catalog snapshots ───────────────────────────────
CREATE TABLE exercise_catalog (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  logical_id        UUID NOT NULL
                    REFERENCES exercise_catalog_logical(id) ON DELETE RESTRICT,
  canonical_name    TEXT NOT NULL
                    CHECK (char_length(btrim(canonical_name)) BETWEEN 1 AND 100),
  category          TEXT NOT NULL CHECK (category IN
                    ('compound','isolation','cardio','mobility','other')),
  primary_muscle    TEXT NOT NULL CHECK (primary_muscle IN (
    'chest','lats','upper_back','lower_back','traps',
    'front_delts','side_delts','rear_delts',
    'biceps','triceps','forearms',
    'quads','hamstrings','glutes','calves',
    'hip_flexors','adductors','abductors',
    'abs','obliques',
    'back','shoulders','core',
    'full_body','other'
  )),
  equipment         TEXT NOT NULL CHECK (equipment IN (
                    'barbell','dumbbell','cable','machine',
                    'bodyweight','resistance_band','kettlebell','other')),
  laterality        TEXT NOT NULL CHECK (laterality IN
                    ('bilateral','unilateral','alternating')),
  tracking_mode     TEXT NOT NULL CHECK (tracking_mode IN
                    ('weight_reps','bodyweight','cardio','timed')),
  source_url        TEXT NOT NULL,
  source_page       TEXT NOT NULL,
  retrieved_at      DATE NOT NULL,
  import_confidence TEXT NOT NULL CHECK (import_confidence IN
                    ('high','medium','human_review_required')),
  review_status     TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN
                    ('pending','approved','revised','rejected')),
  reviewed_by       TEXT,
  reviewed_at       TIMESTAMPTZ,
  review_rationale  TEXT,
  catalog_version   INTEGER NOT NULL DEFAULT 1 CHECK (catalog_version > 0),
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- A non-pending review decision must carry a real reviewer audit;
  -- blank fields can never read as approval.
  -- Revision E, finding 2: blank/whitespace reviewer identities and
  -- rationales fail at the constraint boundary.
  -- Revision G, finding 2: a PENDING snapshot must carry NO audit
  -- evidence at all — evidence exists exactly when a decision does.
  CONSTRAINT exercise_catalog_review_audit_chk CHECK (
    (review_status = 'pending'
     AND reviewed_by IS NULL
     AND reviewed_at IS NULL
     AND review_rationale IS NULL)
    OR (review_status <> 'pending'
        AND reviewed_by IS NOT NULL
        AND char_length(btrim(reviewed_by)) > 0
        AND reviewed_at IS NOT NULL
        AND review_rationale IS NOT NULL
        AND char_length(btrim(review_rationale)) > 0)
  )
);

CREATE TRIGGER exercise_catalog_updated_at
  BEFORE UPDATE ON exercise_catalog
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE UNIQUE INDEX exercise_catalog_logical_version_unique_idx
  ON exercise_catalog (logical_id, catalog_version);
CREATE UNIQUE INDEX exercise_catalog_one_active_logical_idx
  ON exercise_catalog (logical_id)
  WHERE is_active = true;
CREATE UNIQUE INDEX exercise_catalog_one_active_name_idx
  ON exercise_catalog (lower(canonical_name))
  WHERE is_active = true;
CREATE UNIQUE INDEX exercise_catalog_source_url_version_unique_idx
  ON exercise_catalog (source_url, catalog_version);
CREATE INDEX exercise_catalog_deliverable_idx
  ON exercise_catalog (logical_id)
  WHERE review_status = 'approved' AND is_active = true;

-- Snapshot immutability (Revision E, finding 3) + one-way lifecycle
-- (Revision F, findings 2-3). Identity, content, classification,
-- provenance, and version columns are FROZEN after insertion —
-- corrections are represented by NEW version rows of the same
-- logical identity, never by editing a snapshot in place. Freezing
-- logical_id also makes stale claim ownership structurally
-- impossible: the claim triggers key on (normalized_name,
-- claim_source, logical_id), and neither component can drift
-- underneath them.
--
-- Revision F adds the ONE-WAY lifecycle machine:
--   * snapshots are BORN pending + active;
--   * review_status: pending -> approved | revised | rejected;
--     approved -> revised | rejected; revised and rejected are
--     TERMINAL. It can NEVER return to pending and a decided row can
--     never be re-approved — so the anatomy seal (section 4) is
--     permanent and no member can newly become deliverable under a
--     sealed run;
--   * review-audit fields may change ONLY together with an allowed
--     status transition (each decision carries its own audit; a
--     recorded decision cannot be silently rewritten);
--   * is_active: true -> false ONLY. Reactivation requires a new
--     catalog version row and a new sealed run — deactivation is the
--     shrink-only emergency withdrawal path.
-- Deliverability of a snapshot is therefore MONOTONE NON-INCREASING
-- after its review decision: the delivery-time gates can only ever
-- shrink a sealed run's set, never expand it.
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

CREATE TRIGGER exercise_catalog_freeze_trigger
  BEFORE INSERT OR UPDATE ON exercise_catalog
  FOR EACH ROW EXECUTE FUNCTION exlib_freeze_catalog_snapshot();

-- ── 3B. Append-only review evidence log (Revision G, finding 2) ──
-- One row per review-status transition, written ONLY by the
-- snapshot freeze trigger above. UPDATE and DELETE always raise;
-- direct INSERT raises via the trigger-depth guard — so the log is
-- exactly the transition history, immutable, and complete. The
-- RESTRICT FK also makes any reviewed snapshot physically
-- undeletable (its decision history pins it); only never-reviewed
-- pending rows without other references can be removed.
CREATE TABLE exercise_catalog_review_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_id        UUID NOT NULL
                    REFERENCES exercise_catalog(id) ON DELETE RESTRICT,
  from_status       TEXT NOT NULL CHECK (from_status IN ('pending','approved')),
  to_status         TEXT NOT NULL CHECK (to_status IN ('approved','revised','rejected')),
  reviewed_by       TEXT NOT NULL CHECK (char_length(btrim(reviewed_by)) > 0),
  reviewed_at       TIMESTAMPTZ NOT NULL,
  review_rationale  TEXT NOT NULL CHECK (char_length(btrim(review_rationale)) > 0),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Mirrors the one-way review machine exactly.
  CONSTRAINT exercise_catalog_review_events_transition_chk CHECK (
    (from_status = 'pending' AND to_status IN ('approved','revised','rejected'))
    OR (from_status = 'approved' AND to_status IN ('revised','rejected'))
  )
);

CREATE INDEX exercise_catalog_review_events_catalog_idx
  ON exercise_catalog_review_events (catalog_id);

CREATE OR REPLACE FUNCTION exlib_freeze_review_events()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP IN ('UPDATE','DELETE') THEN
    RAISE EXCEPTION
      'exercise_catalog_review_events: the review-evidence log is append-only';
  END IF;
  -- Depth 2 = this INSERT was issued from inside another trigger
  -- (the snapshot review transition). Depth 1 = a direct INSERT.
  IF pg_trigger_depth() < 2 THEN
    RAISE EXCEPTION
      'exercise_catalog_review_events: events are written only by the snapshot review transition trigger';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER exercise_catalog_review_events_guard_trigger
  BEFORE INSERT OR UPDATE OR DELETE ON exercise_catalog_review_events
  FOR EACH ROW EXECUTE FUNCTION exlib_freeze_review_events();

-- ── 4. Canonical anatomy (per version snapshot) ──────────────────
CREATE TABLE exercise_catalog_muscles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_id  UUID NOT NULL REFERENCES exercise_catalog(id) ON DELETE RESTRICT,
  muscle      TEXT NOT NULL CHECK (muscle IN (
    'chest','lats','upper_back','lower_back','traps',
    'front_delts','side_delts','rear_delts',
    'biceps','triceps','forearms',
    'quads','hamstrings','glutes','calves',
    'hip_flexors','adductors','abductors',
    'abs','obliques',
    'back','shoulders','core',
    'full_body','other'
  )),
  role        TEXT NOT NULL CHECK (role IN ('secondary','tertiary')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT exercise_catalog_muscles_unique UNIQUE (catalog_id, muscle)
);

CREATE INDEX exercise_catalog_muscles_catalog_idx
  ON exercise_catalog_muscles (catalog_id);

-- Anatomy immutability + sealing (Revision E, finding 3; made
-- PERMANENT by Revision F, finding 3). Anatomy rows are never edited
-- in place, and the anatomy SET of a snapshot is sealed the moment
-- the snapshot leaves pending review: what the reviewer approved is
-- exactly what every run can ever deliver. Because review_status can
-- NEVER return to pending (one-way machine, section 3), the
-- current-status gate below IS a permanent seal — the first
-- transition out of pending closes anatomy editing forever,
-- regardless of any later status change. Anatomy corrections, like
-- every other content correction, are a new catalog version row with
-- its own anatomy and its own review.
CREATE OR REPLACE FUNCTION exlib_freeze_catalog_anatomy()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_review_status TEXT;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION
      'exercise_catalog_muscles: anatomy rows are immutable; corrections require a new catalog version row';
  END IF;
  -- Revision G, finding 1: LOCK the parent snapshot row BEFORE
  -- evaluating its review state. Every review-status transition is
  -- an UPDATE of this same row (holding this same lock), so anatomy
  -- mutation and review transition SERIALIZE: whichever locks first
  -- wins, and the waiter then sees the committed state — a waiting
  -- anatomy write observes the non-pending status and fails; a
  -- waiting review transition proceeds against completed anatomy.
  SELECT c.review_status INTO v_review_status
  FROM public.exercise_catalog c
  WHERE c.id = COALESCE(NEW.catalog_id, OLD.catalog_id)
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION
      'exercise_catalog_muscles: unknown parent snapshot';
  END IF;
  IF v_review_status <> 'pending' THEN
    RAISE EXCEPTION
      'exercise_catalog_muscles: anatomy is sealed once its snapshot leaves pending review';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER exercise_catalog_muscles_freeze_trigger
  BEFORE INSERT OR UPDATE OR DELETE ON exercise_catalog_muscles
  FOR EACH ROW EXECUTE FUNCTION exlib_freeze_catalog_anatomy();

-- ── 5. Canonical alias source (per LOGICAL identity) ─────────────
CREATE TABLE exercise_catalog_aliases (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  logical_id  UUID NOT NULL
              REFERENCES exercise_catalog_logical(id) ON DELETE RESTRICT,
  alias       TEXT NOT NULL
              CHECK (char_length(btrim(alias)) BETWEEN 1 AND 100),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX exercise_catalog_aliases_unique_idx
  ON exercise_catalog_aliases (lower(alias));
CREATE INDEX exercise_catalog_aliases_logical_idx
  ON exercise_catalog_aliases (logical_id);

-- Catalog alias immutability (Revision E, finding 3). Alias rows are
-- frozen after insertion: neither the alias text nor its logical_id
-- can change, so the claim a row registered can never go stale
-- underneath the claim trigger, and an approved run's alias members
-- can never be rewritten into different content. Corrections: delete
-- the row while it is unreferenced (the claim trigger releases its
-- namespace claim; RESTRICT FKs block deletion once any tenant row
-- or run membership references it) and insert a new alias row.
CREATE OR REPLACE FUNCTION exlib_freeze_catalog_alias()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RAISE EXCEPTION
    'exercise_catalog_aliases: alias rows are immutable; delete (while unreferenced) and insert a new row instead';
END;
$$;

CREATE TRIGGER exercise_catalog_aliases_freeze_trigger
  BEFORE UPDATE ON exercise_catalog_aliases
  FOR EACH ROW EXECUTE FUNCTION exlib_freeze_catalog_alias();

-- ── 5B. Frozen run membership (Revision E, finding 1) ────────────
-- Each import run is BOUND to the exact catalog snapshots and
-- catalog aliases it may deliver. Delivery reads ONLY this table
-- (joined on the requested run's id), so an old approved run can
-- never deliver later-added or later-modified content: new content
-- requires a NEW run with its own membership and its own product +
-- legal approval. Snapshot members carry their anatomy implicitly
-- (anatomy is sealed to the immutable snapshot, section 4).
-- Membership rows are immutable; rows can be added or removed ONLY
-- while the run is unapproved, and delivery requires approval — so
-- membership editing and deliverability are mutually exclusive,
-- fail-closed in both directions.
CREATE TABLE exercise_catalog_run_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id            UUID NOT NULL
                    REFERENCES exercise_catalog_import_runs(id) ON DELETE RESTRICT,
  catalog_id        UUID REFERENCES exercise_catalog(id) ON DELETE RESTRICT,
  catalog_alias_id  UUID REFERENCES exercise_catalog_aliases(id) ON DELETE RESTRICT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Exactly ONE membership kind per row.
  CONSTRAINT exercise_catalog_run_items_kind_chk CHECK (
    (catalog_id IS NULL) <> (catalog_alias_id IS NULL)
  )
);

CREATE UNIQUE INDEX exercise_catalog_run_items_exercise_unique_idx
  ON exercise_catalog_run_items (run_id, catalog_id)
  WHERE catalog_id IS NOT NULL;
CREATE UNIQUE INDEX exercise_catalog_run_items_alias_unique_idx
  ON exercise_catalog_run_items (run_id, catalog_alias_id)
  WHERE catalog_alias_id IS NOT NULL;
CREATE INDEX exercise_catalog_run_items_run_idx
  ON exercise_catalog_run_items (run_id);

-- Revision F, finding 1: the freeze keys EXCLUSIVELY on sealed_at
-- (never on approved_for_delivery or revoked_at — neither delivery
-- disablement nor anything else ever reopens editing), and it locks
-- the PARENT RUN ROW with FOR UPDATE so membership INSERT/DELETE
-- serializes against the approval transition on the same lock: no
-- membership change can slip past a concurrent sealing.
CREATE OR REPLACE FUNCTION exlib_freeze_run_membership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_sealed_at TIMESTAMPTZ;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION
      'exercise_catalog_run_items: membership rows are immutable; add or remove rows only before the run is sealed';
  END IF;
  SELECT r.sealed_at INTO v_sealed_at
  FROM public.exercise_catalog_import_runs r
  WHERE r.id = COALESCE(NEW.run_id, OLD.run_id)
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION
      'exercise_catalog_run_items: unknown parent run';
  END IF;
  IF v_sealed_at IS NOT NULL THEN
    RAISE EXCEPTION
      'exercise_catalog_run_items: a sealed run''s membership is PERMANENT; changed membership requires a NEW run (delivery disablement and revocation never reopen editing)';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER exercise_catalog_run_items_freeze_trigger
  BEFORE INSERT OR UPDATE OR DELETE ON exercise_catalog_run_items
  FOR EACH ROW EXECUTE FUNCTION exlib_freeze_run_membership();

-- ── 5C. Run sealing lifecycle (Revision F, finding 1) ────────────
-- Runs are BORN unsealed, unapproved, and unrevoked. The ONLY legal
-- state transitions are:
--   unsealed -> sealed        exactly once, atomically, with FULL
--                             validation (evidence + membership),
--                             setting approved_for_delivery = true
--                             in the same statement;
--   sealed   -> sealed+revoked  one-way emergency shutdown.
-- Once sealed: run_key, dry_run, approved_for_delivery, both
-- approver identities and timestamps, the approval rationale,
-- sealed_at, and created_at are IMMUTABLE. Only the documented
-- operational fields (started_at, completed_at, result_counts) and
-- the one-way revoked_at remain writable. The trigger enforces the
-- machine on EVERY write path, so even a direct privileged UPDATE
-- cannot seal without the identical validation the controlled
-- operation performs.
CREATE OR REPLACE FUNCTION exlib_freeze_run_row()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_exercise_members INTEGER;
  v_alias_members    INTEGER;
  v_unready_members  INTEGER;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.sealed_at IS NOT NULL
       OR NEW.approved_for_delivery = true
       OR NEW.revoked_at IS NOT NULL THEN
      RAISE EXCEPTION
        'exercise_catalog_import_runs: runs are born unsealed, unapproved, and unrevoked; sealing happens only through the validated approval transition';
    END IF;
    RETURN NEW;
  END IF;

  -- revoked_at is ONE-WAY: NULL -> non-null on a sealed run, never
  -- cleared, never changed.
  IF OLD.revoked_at IS NOT NULL
     AND NEW.revoked_at IS DISTINCT FROM OLD.revoked_at THEN
    RAISE EXCEPTION
      'exercise_catalog_import_runs: revocation is one-way and permanent';
  END IF;

  IF OLD.sealed_at IS NOT NULL THEN
    -- SEALED: every approval-bound field is immutable.
    IF NEW.sealed_at             IS DISTINCT FROM OLD.sealed_at
       OR NEW.run_key            IS DISTINCT FROM OLD.run_key
       OR NEW.dry_run            IS DISTINCT FROM OLD.dry_run
       OR NEW.approved_for_delivery IS DISTINCT FROM OLD.approved_for_delivery
       OR NEW.product_approved_by   IS DISTINCT FROM OLD.product_approved_by
       OR NEW.product_approved_at   IS DISTINCT FROM OLD.product_approved_at
       OR NEW.legal_approved_by     IS DISTINCT FROM OLD.legal_approved_by
       OR NEW.legal_approved_at     IS DISTINCT FROM OLD.legal_approved_at
       OR NEW.approval_rationale    IS DISTINCT FROM OLD.approval_rationale
       OR NEW.created_at            IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION
        'exercise_catalog_import_runs: a sealed run''s approval-bound fields (run_key, dry_run, approval evidence, seal) are immutable; a different approval decision requires a NEW run';
    END IF;
    RETURN NEW;
  END IF;

  -- UNSEALED: revocation does not exist yet, and the ONLY way to
  -- gain approval/seal state is the single validated transition.
  IF NEW.revoked_at IS DISTINCT FROM OLD.revoked_at THEN
    RAISE EXCEPTION
      'exercise_catalog_import_runs: only sealed runs can be revoked';
  END IF;
  IF NEW.sealed_at IS DISTINCT FROM OLD.sealed_at
     OR NEW.approved_for_delivery IS DISTINCT FROM OLD.approved_for_delivery THEN
    IF NOT (OLD.sealed_at IS NULL AND NEW.sealed_at IS NOT NULL
            AND OLD.approved_for_delivery = false
            AND NEW.approved_for_delivery = true) THEN
      RAISE EXCEPTION
        'exercise_catalog_import_runs: approval and the seal move together in ONE atomic unsealed -> sealed transition';
    END IF;
    IF NEW.dry_run THEN
      RAISE EXCEPTION
        'exercise_catalog_import_runs: dry runs cannot be sealed';
    END IF;
    IF NEW.product_approved_by IS NULL
       OR char_length(btrim(NEW.product_approved_by)) = 0
       OR NEW.product_approved_at IS NULL
       OR NEW.legal_approved_by IS NULL
       OR char_length(btrim(NEW.legal_approved_by)) = 0
       OR NEW.legal_approved_at IS NULL
       OR NEW.approval_rationale IS NULL
       OR char_length(btrim(NEW.approval_rationale)) = 0 THEN
      RAISE EXCEPTION
        'exercise_catalog_import_runs: sealing requires complete, non-blank product + legal approval evidence';
    END IF;
    -- Membership validation (Revision F, finding 2): the sealed set
    -- must be entirely deliverable AT the seal, so the approval
    -- evidence binds exactly what can ever deliver. The row being
    -- updated is already row-locked by this UPDATE, and membership
    -- writes take the same lock FOR UPDATE, so this validation
    -- cannot race a membership change.
    SELECT count(*) FILTER (WHERE ri.catalog_id IS NOT NULL),
           count(*) FILTER (WHERE ri.catalog_alias_id IS NOT NULL)
      INTO v_exercise_members, v_alias_members
    FROM public.exercise_catalog_run_items ri
    WHERE ri.run_id = NEW.id;
    IF COALESCE(v_exercise_members, 0) + COALESCE(v_alias_members, 0) = 0 THEN
      RAISE EXCEPTION
        'exercise_catalog_import_runs: an empty membership cannot be sealed';
    END IF;
    SELECT count(*) INTO v_unready_members
    FROM public.exercise_catalog_run_items ri
    JOIN public.exercise_catalog c ON c.id = ri.catalog_id
    WHERE ri.run_id = NEW.id
      AND (c.review_status <> 'approved'
           OR c.is_active = false
           OR c.reviewed_by IS NULL
           OR char_length(btrim(c.reviewed_by)) = 0
           OR c.review_rationale IS NULL
           OR char_length(btrim(c.review_rationale)) = 0);
    IF v_unready_members > 0 THEN
      RAISE EXCEPTION
        'exercise_catalog_import_runs: cannot seal — % exercise member(s) are not approved, active, and fully review-audited',
        v_unready_members;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER exercise_catalog_import_runs_freeze_trigger
  BEFORE INSERT OR UPDATE ON exercise_catalog_import_runs
  FOR EACH ROW EXECUTE FUNCTION exlib_freeze_run_row();

-- The controlled approval operation (Revision F, finding 1 item 8):
-- locks the run FOR UPDATE, validates the approval evidence,
-- validates the membership, sets the permanent seal, and enables
-- delivery — atomically. The BEFORE trigger above revalidates the
-- identical transition, so this function is the convenient front
-- door of a database-enforced gate, not the only guard. It is NOT
-- client-callable (revoked from PUBLIC, anon, AND authenticated in
-- section 14; no EXECUTE grant): approval is a reviewed operator
-- action in a privileged context, never a product-surface call, and
-- it takes no user identity at all.
CREATE OR REPLACE FUNCTION exlib_approve_and_seal_run(p_run_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_run               public.exercise_catalog_import_runs%ROWTYPE;
  v_exercise_members  INTEGER;
  v_alias_members     INTEGER;
BEGIN
  SELECT * INTO v_run
  FROM public.exercise_catalog_import_runs
  WHERE run_key = p_run_key
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'exlib_approve_and_seal_run: unknown run key';
  END IF;
  IF v_run.sealed_at IS NOT NULL THEN
    RAISE EXCEPTION 'exlib_approve_and_seal_run: run is already sealed; a different approval decision requires a NEW run';
  END IF;

  -- The UPDATE below performs the single validated unsealed ->
  -- sealed transition; exlib_freeze_run_row() enforces every
  -- evidence and membership requirement inside the same statement.
  UPDATE public.exercise_catalog_import_runs
  SET approved_for_delivery = true,
      sealed_at             = NOW()
  WHERE id = v_run.id;

  SELECT count(*) FILTER (WHERE ri.catalog_id IS NOT NULL),
         count(*) FILTER (WHERE ri.catalog_alias_id IS NOT NULL)
    INTO v_exercise_members, v_alias_members
  FROM public.exercise_catalog_run_items ri
  WHERE ri.run_id = v_run.id;

  RETURN jsonb_build_object(
    'run_key',           p_run_key,
    'sealed',            true,
    'exercise_members',  v_exercise_members,
    'alias_members',     v_alias_members
  );
END;
$$;

-- One-way emergency shutdown (Revision F, finding 1 item 6). Marks
-- a SEALED run revoked: delivery refuses it forever after; the seal,
-- the membership, and the approval evidence stay frozen exactly as
-- approved — revocation NEVER reopens editing. Idempotent: revoking
-- an already-revoked run reports the original revocation. Not
-- client-callable (revoked in section 14; no grant).
CREATE OR REPLACE FUNCTION exlib_revoke_run_delivery(p_run_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_run public.exercise_catalog_import_runs%ROWTYPE;
BEGIN
  SELECT * INTO v_run
  FROM public.exercise_catalog_import_runs
  WHERE run_key = p_run_key
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'exlib_revoke_run_delivery: unknown run key';
  END IF;
  IF v_run.sealed_at IS NULL THEN
    RAISE EXCEPTION 'exlib_revoke_run_delivery: only sealed runs can be revoked';
  END IF;
  IF v_run.revoked_at IS NOT NULL THEN
    RETURN jsonb_build_object(
      'run_key',         p_run_key,
      'revoked',         true,
      'already_revoked', true
    );
  END IF;

  UPDATE public.exercise_catalog_import_runs
  SET revoked_at = NOW()
  WHERE id = v_run.id;

  RETURN jsonb_build_object(
    'run_key',         p_run_key,
    'revoked',         true,
    'already_revoked', false
  );
END;
$$;

-- ── 6. ONE GLOBAL catalog namespace (Revision B, finding 2) ──────
-- Covers ACTIVE canonical names AND canonical aliases together with
-- one PRIMARY KEY: an alias equal to ANOTHER logical exercise's
-- active canonical name (or vice versa, or alias-vs-alias) fails at
-- the constraint boundary. Normalization is EXACTLY lower(text) —
-- the same rule as every other namespace in this contract. Version
-- snapshots of the SAME logical identity re-using their name are a
-- permitted no-op (the claim is already owned by that logical id).
-- The catalog is empty at migration time, so no backfill is needed;
-- triggers + the PK are concurrency-safe from the first row.
CREATE TABLE exercise_catalog_name_claims (
  normalized_name  TEXT PRIMARY KEY,
  claim_source     TEXT NOT NULL CHECK (claim_source IN ('canonical','alias')),
  logical_id       UUID NOT NULL
                   REFERENCES exercise_catalog_logical(id) ON DELETE RESTRICT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX exercise_catalog_name_claims_logical_idx
  ON exercise_catalog_name_claims (logical_id);

CREATE OR REPLACE FUNCTION exlib_claim_catalog_name()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.is_active THEN
      -- Same-logical continuity: a new version snapshot re-using the
      -- logical identity's existing canonical claim is a no-op; any
      -- OTHER claimant fails on the PK.
      IF NOT EXISTS (
        SELECT 1 FROM public.exercise_catalog_name_claims c
        WHERE c.normalized_name = lower(NEW.canonical_name)
          AND c.claim_source = 'canonical'
          AND c.logical_id = NEW.logical_id
      ) THEN
        INSERT INTO public.exercise_catalog_name_claims (normalized_name, claim_source, logical_id)
        VALUES (lower(NEW.canonical_name), 'canonical', NEW.logical_id);
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Release the old claim when this row stops being the active
    -- bearer of its name (deactivation or rename), then claim the
    -- new name if the row is (still) active.
    -- Release is UNCONDITIONAL: the one-active-per-name and
    -- one-active-per-logical unique indexes guarantee this departing
    -- row was the claim's ONLY bearer, so there is no
    -- check-then-delete race window (Revision C, finding 3).
    IF OLD.is_active AND (NOT NEW.is_active
        OR lower(NEW.canonical_name) IS DISTINCT FROM lower(OLD.canonical_name)) THEN
      DELETE FROM public.exercise_catalog_name_claims c
      WHERE c.normalized_name = lower(OLD.canonical_name)
        AND c.claim_source = 'canonical'
        AND c.logical_id = OLD.logical_id;
    END IF;
    IF NEW.is_active AND (NOT OLD.is_active
        OR lower(NEW.canonical_name) IS DISTINCT FROM lower(OLD.canonical_name)) THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.exercise_catalog_name_claims c
        WHERE c.normalized_name = lower(NEW.canonical_name)
          AND c.claim_source = 'canonical'
          AND c.logical_id = NEW.logical_id
      ) THEN
        INSERT INTO public.exercise_catalog_name_claims (normalized_name, claim_source, logical_id)
        VALUES (lower(NEW.canonical_name), 'canonical', NEW.logical_id);
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.is_active THEN
      DELETE FROM public.exercise_catalog_name_claims c
      WHERE c.normalized_name = lower(OLD.canonical_name)
        AND c.claim_source = 'canonical'
        AND c.logical_id = OLD.logical_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION exlib_claim_catalog_alias()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.exercise_catalog_name_claims (normalized_name, claim_source, logical_id)
    VALUES (lower(NEW.alias), 'alias', NEW.logical_id);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF lower(NEW.alias) IS DISTINCT FROM lower(OLD.alias) THEN
      DELETE FROM public.exercise_catalog_name_claims c
      WHERE c.normalized_name = lower(OLD.alias)
        AND c.claim_source = 'alias'
        AND c.logical_id = OLD.logical_id;
      INSERT INTO public.exercise_catalog_name_claims (normalized_name, claim_source, logical_id)
      VALUES (lower(NEW.alias), 'alias', NEW.logical_id);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.exercise_catalog_name_claims c
    WHERE c.normalized_name = lower(OLD.alias)
      AND c.claim_source = 'alias'
      AND c.logical_id = OLD.logical_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER exercise_catalog_name_claim_trigger
  AFTER INSERT OR UPDATE OF canonical_name, is_active OR DELETE ON exercise_catalog
  FOR EACH ROW EXECUTE FUNCTION exlib_claim_catalog_name();

CREATE TRIGGER exercise_catalog_alias_claim_trigger
  AFTER INSERT OR UPDATE OF alias OR DELETE ON exercise_catalog_aliases
  FOR EACH ROW EXECUTE FUNCTION exlib_claim_catalog_alias();

-- Read-only bidirectional invariant check (Revision C, finding 3):
-- (a) every claim row has its bearer (an ACTIVE snapshot carrying
--     that canonical name for claim_source='canonical', or an alias
--     row for claim_source='alias'), and
-- (b) every bearer's normalized name has its claim row.
-- MULTIPLE active bearers per claim are structurally impossible:
-- exercise_catalog_active_name_unique_idx allows one active snapshot
-- per lower(canonical_name), exercise_catalog_aliases_unique_idx
-- allows one alias row per lower(alias), and the claims PRIMARY KEY
-- (normalized_name) bars a canonical bearer and an alias bearer from
-- coexisting on the same normalized name — so both counts returning
-- zero proves EXACTLY-ONE-bearer holds. SECURITY INVOKER on purpose:
-- maintenance contexts with direct catalog access only; revoked from
-- every client role in section 14. Never called by product code.
CREATE OR REPLACE FUNCTION exlib_verify_catalog_claims()
RETURNS TABLE (
  orphaned_claims    BIGINT,
  unclaimed_bearers  BIGINT
)
LANGUAGE sql
STABLE
AS $$
  WITH bearers AS (
    SELECT lower(e.canonical_name) AS normalized_name,
           e.logical_id,
           'canonical'::text AS claim_source
    FROM public.exercise_catalog e
    WHERE e.is_active = true
    UNION ALL
    SELECT lower(a.alias), a.logical_id, 'alias'::text
    FROM public.exercise_catalog_aliases a
  )
  SELECT
    (SELECT count(*) FROM public.exercise_catalog_name_claims c
     WHERE NOT EXISTS (
       SELECT 1 FROM bearers b
       WHERE b.normalized_name = c.normalized_name
         AND b.logical_id = c.logical_id
         AND b.claim_source = c.claim_source)),
    (SELECT count(*) FROM bearers b
     WHERE NOT EXISTS (
       SELECT 1 FROM public.exercise_catalog_name_claims c
       WHERE c.normalized_name = b.normalized_name
         AND c.logical_id = b.logical_id
         AND c.claim_source = b.claim_source))
$$;

-- ── 7. Provenance + tenant candidate key on exercises ────────────
ALTER TABLE exercises
  ADD CONSTRAINT exercises_user_id_id_unique UNIQUE (user_id, id);

ALTER TABLE exercises
  ADD COLUMN catalog_id UUID
    REFERENCES exercise_catalog(id) ON DELETE RESTRICT,
  ADD COLUMN catalog_logical_id UUID
    REFERENCES exercise_catalog_logical(id) ON DELETE RESTRICT,
  ADD COLUMN import_run_id UUID
    REFERENCES exercise_catalog_import_runs(id) ON DELETE RESTRICT;

CREATE UNIQUE INDEX exercises_user_catalog_logical_unique_idx
  ON exercises (user_id, catalog_logical_id)
  WHERE catalog_logical_id IS NOT NULL;

-- ── 8. Tenant-owned aliases (audit-preserving active state) ──────
CREATE TABLE exercise_aliases (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id  UUID NOT NULL,
  alias        TEXT NOT NULL
               CHECK (char_length(btrim(alias)) BETWEEN 1 AND 100),
  is_active    BOOLEAN NOT NULL DEFAULT true,
  catalog_alias_id UUID REFERENCES exercise_catalog_aliases(id) ON DELETE RESTRICT,
  import_run_id    UUID REFERENCES exercise_catalog_import_runs(id) ON DELETE RESTRICT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT exercise_aliases_owner_fk
    FOREIGN KEY (user_id, exercise_id)
    REFERENCES exercises (user_id, id) ON DELETE CASCADE
);

-- ACTIVE aliases are unique per user (partial: deactivated audit
-- rows never block name reuse). Alias LOOKUP semantics: a resolver
-- must join aliases WHERE is_active to exercises WHERE is_active —
-- active aliases resolve to active exercises only.
CREATE UNIQUE INDEX exercise_aliases_user_alias_unique_idx
  ON exercise_aliases (user_id, lower(alias))
  WHERE is_active = true;
-- Declarative delivered-alias idempotency: one tenant row per
-- catalog alias per user, ACTIVE OR INACTIVE — retries and later
-- runs can never multiply audit rows, independent of the
-- active-name partial index above.
CREATE UNIQUE INDEX exercise_aliases_user_catalog_alias_unique_idx
  ON exercise_aliases (user_id, catalog_alias_id)
  WHERE catalog_alias_id IS NOT NULL;
CREATE INDEX exercise_aliases_user_exercise_idx
  ON exercise_aliases (user_id, exercise_id);
CREATE INDEX exercise_aliases_import_run_idx
  ON exercise_aliases (user_id, import_run_id);

-- ── 9. ONE normalized per-user name/alias namespace ──────────────
-- Exercise-name claims mirror the PRE-EXISTING non-partial unique
-- index (user_id, lower(name)): an inactive exercise already
-- reserves its name today, so exercise claims survive deactivation
-- (consistency, not a rollback gap). Alias claims are ACTIVE-ONLY:
-- deactivating an alias releases its claim while the audit row
-- remains. Normalization is EXACTLY lower(text).
CREATE TABLE exercise_name_claims (
  user_id          UUID NOT NULL,
  normalized_name  TEXT NOT NULL,
  claim_source     TEXT NOT NULL CHECK (claim_source IN ('exercise','alias')),
  exercise_id      UUID NOT NULL,
  alias_id         UUID,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, normalized_name),
  CONSTRAINT exercise_name_claims_alias_chk CHECK (
    (claim_source = 'alias') = (alias_id IS NOT NULL)
  )
);

CREATE INDEX exercise_name_claims_exercise_idx
  ON exercise_name_claims (exercise_id);

-- Derived machinery backfill: claim every EXISTING exercise name.
-- No external content; the existing per-user unique index
-- guarantees this backfill cannot collide with itself.
INSERT INTO exercise_name_claims (user_id, normalized_name, claim_source, exercise_id)
SELECT e.user_id, lower(e.name), 'exercise', e.id
FROM exercises e;

CREATE OR REPLACE FUNCTION exlib_claim_exercise_name()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.exercise_name_claims (user_id, normalized_name, claim_source, exercise_id)
    VALUES (NEW.user_id, lower(NEW.name), 'exercise', NEW.id);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF lower(NEW.name) IS DISTINCT FROM lower(OLD.name) THEN
      DELETE FROM public.exercise_name_claims
      WHERE user_id = OLD.user_id
        AND normalized_name = lower(OLD.name)
        AND claim_source = 'exercise'
        AND exercise_id = OLD.id;
      INSERT INTO public.exercise_name_claims (user_id, normalized_name, claim_source, exercise_id)
      VALUES (NEW.user_id, lower(NEW.name), 'exercise', NEW.id);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.exercise_name_claims
    WHERE user_id = OLD.user_id
      AND normalized_name = lower(OLD.name)
      AND claim_source = 'exercise'
      AND exercise_id = OLD.id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION exlib_claim_alias_name()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.is_active THEN
      INSERT INTO public.exercise_name_claims (user_id, normalized_name, claim_source, exercise_id, alias_id)
      VALUES (NEW.user_id, lower(NEW.alias), 'alias', NEW.exercise_id, NEW.id);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_active AND (NOT NEW.is_active
        OR lower(NEW.alias) IS DISTINCT FROM lower(OLD.alias)) THEN
      DELETE FROM public.exercise_name_claims
      WHERE user_id = OLD.user_id
        AND normalized_name = lower(OLD.alias)
        AND claim_source = 'alias'
        AND alias_id = OLD.id;
    END IF;
    IF NEW.is_active AND (NOT OLD.is_active
        OR lower(NEW.alias) IS DISTINCT FROM lower(OLD.alias)) THEN
      INSERT INTO public.exercise_name_claims (user_id, normalized_name, claim_source, exercise_id, alias_id)
      VALUES (NEW.user_id, lower(NEW.alias), 'alias', NEW.exercise_id, NEW.id);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.is_active THEN
      DELETE FROM public.exercise_name_claims
      WHERE user_id = OLD.user_id
        AND normalized_name = lower(OLD.alias)
        AND claim_source = 'alias'
        AND alias_id = OLD.id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER exercises_name_claim_trigger
  AFTER INSERT OR UPDATE OF name OR DELETE ON exercises
  FOR EACH ROW EXECUTE FUNCTION exlib_claim_exercise_name();

CREATE TRIGGER exercise_aliases_name_claim_trigger
  AFTER INSERT OR UPDATE OF alias, is_active OR DELETE ON exercise_aliases
  FOR EACH ROW EXECUTE FUNCTION exlib_claim_alias_name();

-- ── 9B. Dependent alias lifecycle (Revision D) ─────────────────
-- An ACTIVE alias must always resolve to an ACTIVE exercise. That
-- rule is enforced HERE, at the database, not by asking every
-- deactivation path to remember a second update:
--
--   * ANY true -> false transition of exercises.is_active (catalog
--     rollback, the product PATCH route, every future authorized
--     path) deactivates EVERY active alias attached to that
--     exercise. Alias rows and their provenance
--     (catalog_alias_id, import_run_id) are preserved untouched;
--     their active namespace claims are released by the existing
--     alias claim trigger, which fires on the is_active change.
--   * Reactivating an exercise (false -> true) does NOT silently
--     reactivate old aliases: the trigger acts only on the
--     true -> false edge. Alias reactivation remains an explicit
--     future reviewed operation, and the declarative catalog-alias
--     identity key guarantees retries cannot create replacement
--     inactive rows in the meantime.
--
-- DEFINER rights are REQUIRED here, not a convenience: the cascade
-- must succeed when fired by the product PATCH route, whose
-- authenticated role holds NO write grant on exercise_aliases.
-- Scope comes solely from the transitioning row (NEW.user_id,
-- NEW.id); there is no caller-controlled user id.
CREATE OR REPLACE FUNCTION exlib_deactivate_exercise_aliases()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF OLD.is_active AND NOT NEW.is_active THEN
    UPDATE public.exercise_aliases a
    SET is_active = false
    WHERE a.user_id = NEW.user_id
      AND a.exercise_id = NEW.id
      AND a.is_active = true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER exercises_dependent_alias_trigger
  AFTER UPDATE OF is_active ON exercises
  FOR EACH ROW EXECUTE FUNCTION exlib_deactivate_exercise_aliases();

-- Fail-closed delivered-row deletion gate (Revision D, finding 6).
-- The current product DELETE route physically removes an
-- unreferenced user exercise (RESTRICT FKs from workout history are
-- the backstop). For a DELIVERED exercise, physical deletion would
-- cascade-destroy its tenant alias rows (audit + provenance) and
-- would free the logical idempotency key so a later run silently
-- re-creates the exercise. Whether delivered rows may EVER be
-- hard-deleted is an UNRESOLVED PRODUCT DECISION (recorded in
-- docs/exlib1b1-architecture-and-review-notes.md); until it is
-- explicitly made, this gate blocks the case that cannot happen
-- today anyway (no delivered rows exist before an approved run), so
-- existing product behavior for user-created exercises is unchanged:
-- their deletion still cascades their own alias rows and the claim
-- triggers release the freed names.
CREATE OR REPLACE FUNCTION exlib_block_delivered_exercise_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF OLD.catalog_id IS NOT NULL
     OR OLD.catalog_logical_id IS NOT NULL
     OR OLD.import_run_id IS NOT NULL THEN
    RAISE EXCEPTION
      'exercises: catalog-delivered rows are fail-closed against physical deletion; deactivate instead (pending product decision)';
  END IF;
  RETURN OLD;
END;
$$;

CREATE TRIGGER exercises_delivered_delete_gate_trigger
  BEFORE DELETE ON exercises
  FOR EACH ROW EXECUTE FUNCTION exlib_block_delivered_exercise_delete();

-- Read-only lookup-safety invariant (Revision D, finding 5). The
-- future alias lookup contract requires BOTH
-- exercise_aliases.is_active = true AND the target
-- exercises.is_active = true; with the cascade above and the
-- inactive-target delivery block, zero rows can violate it. SECURITY
-- INVOKER on purpose (maintenance contexts with direct table access
-- only); revoked from every client role in section 14.
CREATE OR REPLACE FUNCTION exlib_verify_alias_lifecycle()
RETURNS TABLE (
  active_aliases_on_inactive_exercises  BIGINT
)
LANGUAGE sql
STABLE
AS $$
  SELECT count(*)
  FROM public.exercise_aliases a
  JOIN public.exercises e
    ON e.id = a.exercise_id AND e.user_id = a.user_id
  WHERE a.is_active = true
    AND e.is_active = false
$$;

-- ── 10. RLS ──────────────────────────────────────────────────────
ALTER TABLE exercise_catalog_import_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_catalog_logical     ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_catalog             ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_catalog_muscles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_catalog_aliases     ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_catalog_name_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_catalog_run_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_catalog_review_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_name_claims         ENABLE ROW LEVEL SECURITY;

ALTER TABLE exercise_aliases ENABLE ROW LEVEL SECURITY;
-- Revision E, finding 4: explicit role targeting + initplan-stable
-- (SELECT auth.uid()) form.
CREATE POLICY exercise_aliases_select_own
  ON exercise_aliases FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ── 11. Grants (least privilege) ─────────────────────────────────
REVOKE ALL ON exercise_catalog_import_runs FROM PUBLIC, anon, authenticated;
REVOKE ALL ON exercise_catalog_logical     FROM PUBLIC, anon, authenticated;
REVOKE ALL ON exercise_catalog             FROM PUBLIC, anon, authenticated;
REVOKE ALL ON exercise_catalog_muscles     FROM PUBLIC, anon, authenticated;
REVOKE ALL ON exercise_catalog_aliases     FROM PUBLIC, anon, authenticated;
REVOKE ALL ON exercise_catalog_name_claims FROM PUBLIC, anon, authenticated;
REVOKE ALL ON exercise_catalog_run_items   FROM PUBLIC, anon, authenticated;
REVOKE ALL ON exercise_catalog_review_events FROM PUBLIC, anon, authenticated;
REVOKE ALL ON exercise_name_claims         FROM PUBLIC, anon, authenticated;

REVOKE ALL ON exercise_aliases FROM PUBLIC, anon, authenticated;
GRANT SELECT ON exercise_aliases TO authenticated;

REVOKE INSERT, UPDATE ON exercises FROM PUBLIC, anon, authenticated;
GRANT INSERT (user_id, name, category, primary_muscle, equipment,
              exercise_type, tracking_mode, unilateral, notes,
              is_active, is_system)
  ON exercises TO authenticated;
GRANT UPDATE (name, category, primary_muscle, equipment,
              exercise_type, tracking_mode, unilateral, notes,
              is_active)
  ON exercises TO authenticated;

-- ── 12. Delivery function ────────────────────────────────────────
-- ONE transactional, idempotent, inserts-only delivery for the
-- CALLING user (auth.uid(); no user parameter). Fail-closed run and
-- row eligibility gates as in Revision A.
--
-- RUN SCOPING (Revision E, finding 1): BOTH delivery loops join
-- exercise_catalog_run_items ON ri.run_id = v_run.id — the function
-- can only ever read the requested run's frozen, approval-sealed
-- membership. Content approved later, or bound to another run,
-- is invisible to this run. Anatomy follows the member snapshot
-- (immutable and sealed, sections 3-4). Alias members deliver in a
-- separate second phase so an alias-only later run (zero exercise
-- members) still delivers exactly its own approved aliases; each
-- alias resolves its target exercise by logical identity and keeps
-- every Revision D disposition, plus the new
-- alias_skipped_no_exercise for members whose logical has no
-- delivered exercise for this user (never delivered, or its
-- exercise member was collision-skipped).
--
-- Concurrency: the 64-bit per-user advisory lock
-- pg_advisory_xact_lock(hashtextextended(v_uid::text, 8231))
-- serializes this user's delivery/rollback (identical derivation in
-- both functions). Hash collisions between different users are
-- theoretically possible; a colliding pair merely SERIALIZES (the
-- safety property), while per-user separation is best-effort. The
-- unique constraints remain the correctness backstop.
--
-- Failure semantics: unique_violation is inspected via
-- GET STACKED DIAGNOSTICS CONSTRAINT_NAME against an explicit
-- allowlist; every unknown constraint RE-RAISES and aborts the
-- entire delivery. Allowed constraints map to their own counters:
--   exercises_user_name_unique_idx (exercise block)
--                                                -> name collision
--   exercise_name_claims_pkey (exercise block)   -> name collision
--   exercises_user_catalog_logical_unique_idx    -> already delivered
--   exercise_aliases_user_catalog_alias_unique_idx (alias block)
--                                                -> alias already delivered
--   exercise_name_claims_pkey (alias block)      -> alias collision
--   exercise_aliases_user_alias_unique_idx (alias block)
--                                                -> alias collision
-- An anatomy, provenance, or any other constraint failure is NOT
-- an expected disposition and aborts everything.
--
-- STATIC COLLISION PROOF (Revision C, finding 1): the exercise +
-- anatomy subtransaction can raise unique_violation ONLY from:
--   * exercises_user_name_unique_idx (migration 003, PRE-EXISTING,
--     (user_id, lower(name)), NOT partial) — fires when the user
--     already has ANY exercise (active or inactive) with that name.
--     Row-level BEFORE/statement checks and this index fire before
--     the AFTER claim trigger, so a pre-existing name surfaces HERE,
--     not at the claims PK: an honest per-candidate skip, never an
--     abort.
--   * exercise_name_claims_pkey — the per-user claims backfill made
--     both barriers equivalent at rest; under a concurrent rename
--     race either can win, and both map to the SAME counter.
--   * exercises_user_catalog_logical_unique_idx — concurrent
--     duplicate delivery of the same logical identity.
-- Every other unique constraint reachable by the subtransaction is
-- a defect, never a disposition, hence RAISE:
--   * exercises_pkey / exercises_user_id_id_unique take
--     gen_random_uuid() ids;
--   * exercise_muscles ids are gen_random_uuid() and its
--     (exercise_id, muscle) key inserts against a FRESH exercise id
--     from rows already unique per (catalog_id, muscle) via
--     exercise_catalog_muscles_unique.
CREATE OR REPLACE FUNCTION deliver_catalog_exercises(p_run_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid               UUID := auth.uid();
  v_run               public.exercise_catalog_import_runs%ROWTYPE;
  v_cat               RECORD;
  v_alias             RECORD;
  v_new_id            UUID;
  v_target_id         UUID;
  v_target_active     BOOLEAN;
  v_constraint        TEXT;
  v_eligible          INTEGER := 0;
  v_inserted          INTEGER := 0;
  v_skipped_existing  INTEGER := 0;
  v_skipped_collision INTEGER := 0;
  v_alias_inserted    INTEGER := 0;
  v_alias_added_existing   INTEGER := 0;
  v_alias_already_delivered INTEGER := 0;
  v_alias_no_exercise       INTEGER := 0;
  v_alias_skipped_inactive  INTEGER := 0;
  v_alias_skipped     INTEGER := 0;
  v_inserted_logical  UUID[]  := '{}';
  v_collision_names   TEXT[]  := '{}';
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'deliver_catalog_exercises: not authenticated';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_uid::text, 8231));

  -- Revision F, finding 1: delivery requires the PERMANENT seal and
  -- refuses revoked runs. sealed_at/approved_for_delivery are frozen
  -- after sealing and membership is permanently frozen, so the set
  -- this gate admits was fixed at the moment of approval.
  SELECT * INTO v_run
  FROM public.exercise_catalog_import_runs
  WHERE run_key = p_run_key
    AND approved_for_delivery = true
    AND dry_run = false
    AND sealed_at IS NOT NULL
    AND revoked_at IS NULL;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'deliver_catalog_exercises: no sealed, approved, unrevoked delivery run for this key';
  END IF;

  -- ── Phase 1: the requested run's EXERCISE members ──────────────
  -- Scoped to v_run.id via the frozen membership table (Revision E,
  -- finding 1). Row gates (approved + active) remain as additional
  -- fail-closed conditions: post-approval state changes can only
  -- remove a member from delivery, never alter or add content.
  FOR v_cat IN
    SELECT c.*
    FROM public.exercise_catalog c
    JOIN public.exercise_catalog_run_items ri
      ON ri.run_id = v_run.id AND ri.catalog_id = c.id
    WHERE c.review_status = 'approved'
      AND c.is_active = true
    ORDER BY lower(c.canonical_name)
  LOOP
    v_eligible := v_eligible + 1;

    IF EXISTS (
      SELECT 1 FROM public.exercises e
      WHERE e.user_id = v_uid AND e.catalog_logical_id = v_cat.logical_id
    ) THEN
      v_skipped_existing := v_skipped_existing + 1;
      CONTINUE;
    END IF;

    IF EXISTS (
      SELECT 1 FROM public.exercise_name_claims n
      WHERE n.user_id = v_uid
        AND n.normalized_name = lower(v_cat.canonical_name)
    ) THEN
      v_skipped_collision := v_skipped_collision + 1;
      v_collision_names   := array_append(v_collision_names, v_cat.canonical_name);
      CONTINUE;
    END IF;

    -- Exercise + anatomy subtransaction. Expected race constraints
    -- ONLY; everything else re-raises and aborts the delivery.
    BEGIN
      INSERT INTO public.exercises (
        user_id, name, category, primary_muscle, equipment,
        exercise_type, tracking_mode, unilateral,
        is_active, is_system, catalog_id, catalog_logical_id, import_run_id
      ) VALUES (
        v_uid, v_cat.canonical_name, v_cat.category, v_cat.primary_muscle,
        v_cat.equipment,
        CASE v_cat.tracking_mode
          WHEN 'bodyweight' THEN 'bodyweight'
          WHEN 'cardio'     THEN 'cardio'
          WHEN 'timed'      THEN 'mobility'
          ELSE 'strength'
        END,
        v_cat.tracking_mode,
        (v_cat.laterality <> 'bilateral'),
        true, true, v_cat.id, v_cat.logical_id, v_run.id
      ) RETURNING id INTO v_new_id;

      INSERT INTO public.exercise_muscles (user_id, exercise_id, muscle, role)
      SELECT v_uid, v_new_id, m.muscle, m.role
      FROM public.exercise_catalog_muscles m
      WHERE m.catalog_id = v_cat.id;
    EXCEPTION
      WHEN unique_violation THEN
        GET STACKED DIAGNOSTICS v_constraint = CONSTRAINT_NAME;
        IF v_constraint IN ('exercises_user_name_unique_idx',
                            'exercise_name_claims_pkey') THEN
          -- The user already holds this name (the PRE-EXISTING
          -- non-partial exercises index counts inactive rows) or a
          -- concurrent create/rename raced the pre-check: an honest
          -- name collision that SKIPS this candidate only — never
          -- an abort (Revision C, finding 1).
          v_skipped_collision := v_skipped_collision + 1;
          v_collision_names   := array_append(v_collision_names, v_cat.canonical_name);
          CONTINUE;
        ELSIF v_constraint = 'exercises_user_catalog_logical_unique_idx' THEN
          -- Concurrent duplicate delivery: already delivered. The
          -- alias phase below resolves its target independently.
          v_skipped_existing := v_skipped_existing + 1;
          CONTINUE;
        ELSE
          -- Anatomy/provenance/unknown uniqueness failure is a
          -- defect, never a disposition: abort everything.
          RAISE;
        END IF;
    END;

    v_inserted         := v_inserted + 1;
    v_inserted_logical := array_append(v_inserted_logical, v_cat.logical_id);
  END LOOP;

  -- ── Phase 2: the requested run's ALIAS members ──────────────────
  -- One unified phase preserves every Revision D disposition while
  -- serving both cases: aliases of exercises inserted by phase 1 of
  -- THIS call (alias_inserted) and this run's newly approved aliases
  -- for exercises delivered by EARLIER runs (alias_added_to_existing
  -- — the LATER-RUN ALIAS POLICY of Revision C, finding 2, preserved
  -- and still approval-gated: an alias-only run delivers only after
  -- ITS OWN product + legal approval). Idempotency is DECLARATIVE
  -- (Revision C, finding 2): the partial unique
  -- (user_id, catalog_alias_id) makes re-delivery of the same
  -- catalog alias impossible whether its tenant row is active OR
  -- inactive — retries can never create duplicate audit rows, and
  -- a rolled-back (deactivated) alias stays a deterministic skip
  -- until an explicit future reactivation operation.
  -- Revision D, finding 3 (preserved): an INACTIVE target exercise
  -- blocks the insert (alias_skipped_inactive_exercise) — an
  -- active-but-nonresolving alias can never be created.
  -- Revision E: a member whose logical has NO delivered exercise for
  -- this user (never delivered here, or its exercise member was
  -- collision-skipped) reports alias_skipped_no_exercise.
  FOR v_alias IN
    SELECT a.id, a.alias, a.logical_id
    FROM public.exercise_catalog_aliases a
    JOIN public.exercise_catalog_run_items ri
      ON ri.run_id = v_run.id AND ri.catalog_alias_id = a.id
    ORDER BY lower(a.alias)
  LOOP
    IF EXISTS (
      SELECT 1 FROM public.exercise_aliases t
      WHERE t.user_id = v_uid AND t.catalog_alias_id = v_alias.id
    ) THEN
      v_alias_already_delivered := v_alias_already_delivered + 1;
      CONTINUE;
    END IF;

    v_target_id     := NULL;
    v_target_active := false;
    SELECT e.id, e.is_active INTO v_target_id, v_target_active
    FROM public.exercises e
    WHERE e.user_id = v_uid AND e.catalog_logical_id = v_alias.logical_id;

    IF v_target_id IS NULL THEN
      v_alias_no_exercise := v_alias_no_exercise + 1;
      CONTINUE;
    END IF;
    IF NOT v_target_active THEN
      -- Revision D, finding 3: the target exercise is inactive —
      -- insert nothing; never create an active alias that cannot
      -- resolve. Deterministic on retry.
      v_alias_skipped_inactive := v_alias_skipped_inactive + 1;
      CONTINUE;
    END IF;
    IF EXISTS (
      SELECT 1 FROM public.exercise_name_claims n
      WHERE n.user_id = v_uid
        AND n.normalized_name = lower(v_alias.alias)
    ) THEN
      v_alias_skipped := v_alias_skipped + 1;
      CONTINUE;
    END IF;

    BEGIN
      INSERT INTO public.exercise_aliases
        (user_id, exercise_id, alias, catalog_alias_id, import_run_id)
      VALUES (v_uid, v_target_id, v_alias.alias, v_alias.id, v_run.id);
      IF v_alias.logical_id = ANY(v_inserted_logical) THEN
        v_alias_inserted := v_alias_inserted + 1;
      ELSE
        v_alias_added_existing := v_alias_added_existing + 1;
      END IF;
    EXCEPTION
      WHEN unique_violation THEN
        GET STACKED DIAGNOSTICS v_constraint = CONSTRAINT_NAME;
        IF v_constraint = 'exercise_aliases_user_catalog_alias_unique_idx' THEN
          -- Raced idempotency: this catalog alias already has its
          -- tenant row for this user.
          v_alias_already_delivered := v_alias_already_delivered + 1;
        ELSIF v_constraint IN ('exercise_name_claims_pkey',
                            'exercise_aliases_user_alias_unique_idx') THEN
          v_alias_skipped := v_alias_skipped + 1;
        ELSE
          RAISE;
        END IF;
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'run_key',                p_run_key,
    'eligible',               v_eligible,
    'inserted',               v_inserted,
    'skipped_already_delivered', v_skipped_existing,
    'skipped_name_collision', v_skipped_collision,
    'collision_names',        to_jsonb(v_collision_names),
    'alias_inserted',         v_alias_inserted,
    'alias_added_to_existing', v_alias_added_existing,
    'alias_already_delivered', v_alias_already_delivered,
    'alias_skipped_no_exercise', v_alias_no_exercise,
    'alias_skipped_inactive_exercise', v_alias_skipped_inactive,
    'alias_skipped_collision', v_alias_skipped,
    'inserted_catalog_logical_ids', to_jsonb(v_inserted_logical)
  );
END;
$$;

-- ── 13. Rollback function (deactivate-only, self-scoped) ─────────
-- Deactivates EVERY active exercise the named run delivered to the
-- CALLER, and every active alias CARRYING THIS RUN'S PROVENANCE
-- (a.import_run_id = run id; Revision C, finding 2) — releasing the
-- aliases' ACTIVE namespace claims (via the alias claim trigger)
-- while keeping every row for audit and historical rendering.
-- Two precisely separated alias populations (Revision D, finding 2):
--   * DIRECT: aliases this run itself delivered
--     (a.import_run_id = run id), INCLUDING aliases attached to an
--     EARLIER run's exercise — reported as alias_found /
--     alias_newly_deactivated / alias_already_inactive;
--   * DEPENDENT: other runs' aliases and user-authored aliases
--     attached to an exercise THIS run delivered — deactivated by
--     the exercises_dependent_alias_trigger cascade when that
--     exercise goes inactive (an active alias must never target an
--     inactive exercise) and reported separately as
--     alias_dependent_deactivated, NEVER as this run's deliveries.
-- Aliases on exercises this run did not deliver, and every
-- unrelated row, are NEVER touched. The dependent count is exact:
-- the run's still-active exercises are locked FOR UPDATE before
-- counting, clients hold no exercise_aliases write grant, and every
-- other DEFINER writer serializes on the same advisory lock.
-- Exercise-name claims survive deactivation because the
-- pre-existing exercises unique index is not partial (an inactive
-- exercise reserves its name today; unchanged semantics). Deletes
-- nothing; idempotent; honest per-kind counts — the STABLE result
-- contract is exactly seven counters: found / newly_deactivated /
-- already_inactive for the run's exercises, alias_found /
-- alias_newly_deactivated / alias_already_inactive for the run's
-- DIRECT aliases (by provenance), and alias_dependent_deactivated
-- for the cascade. Re-delivery after rollback is a no-op for
-- exercises (logical idempotency key) AND aliases: already-delivered
-- aliases report alias_already_delivered (catalog-alias idempotency
-- key, active or inactive — no duplicate audit rows), and
-- not-yet-delivered aliases of the now-inactive exercise report
-- alias_skipped_inactive_exercise (Revision D, finding 3);
-- reactivation is a future explicit operation, never implicit.
CREATE OR REPLACE FUNCTION rollback_catalog_delivery(p_run_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid                 UUID := auth.uid();
  v_run                 public.exercise_catalog_import_runs%ROWTYPE;
  v_found               INTEGER := 0;
  v_deactivated         INTEGER := 0;
  v_alias_found         INTEGER := 0;
  v_alias_deactivated   INTEGER := 0;
  v_alias_dependent     INTEGER := 0;
  v_active_ids          UUID[]  := '{}';
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'rollback_catalog_delivery: not authenticated';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_uid::text, 8231));

  SELECT * INTO v_run
  FROM public.exercise_catalog_import_runs
  WHERE run_key = p_run_key;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'rollback_catalog_delivery: unknown run key';
  END IF;

  SELECT count(*) INTO v_found
  FROM public.exercises e
  WHERE e.user_id = v_uid AND e.import_run_id = v_run.id;

  SELECT count(*) INTO v_alias_found
  FROM public.exercise_aliases a
  WHERE a.user_id = v_uid
    AND a.import_run_id = v_run.id;

  -- Aliases first: their claim release is trigger-driven. Scoped by
  -- THIS run's provenance only.
  WITH updated_aliases AS (
    UPDATE public.exercise_aliases a
    SET is_active = false
    WHERE a.user_id = v_uid
      AND a.is_active = true
      AND a.import_run_id = v_run.id
    RETURNING a.id
  )
  SELECT count(*) INTO v_alias_deactivated FROM updated_aliases;

  -- Lock the run's still-active exercises BEFORE counting the
  -- dependent aliases the deactivation cascade will touch. Clients
  -- hold no exercise_aliases write grant and every other DEFINER
  -- writer serializes on this user's advisory lock, so the count
  -- below exactly matches what exercises_dependent_alias_trigger
  -- deactivates when the UPDATE fires it.
  SELECT COALESCE(array_agg(locked.id), '{}') INTO v_active_ids
  FROM (
    SELECT e.id
    FROM public.exercises e
    WHERE e.user_id = v_uid
      AND e.import_run_id = v_run.id
      AND e.is_active = true
    FOR UPDATE
  ) locked;

  -- DEPENDENT aliases: still-active aliases on those exercises that
  -- this run did NOT deliver (other runs' and user-authored rows;
  -- this run's own aliases are already inactive from the direct
  -- pass above). Reported separately, never as this run's
  -- deliveries.
  SELECT count(*) INTO v_alias_dependent
  FROM public.exercise_aliases a
  WHERE a.user_id = v_uid
    AND a.is_active = true
    AND a.import_run_id IS DISTINCT FROM v_run.id
    AND a.exercise_id = ANY(v_active_ids);

  WITH updated AS (
    UPDATE public.exercises e
    SET is_active = false
    WHERE e.user_id = v_uid
      AND e.import_run_id = v_run.id
      AND e.is_active = true
    RETURNING e.id
  )
  SELECT count(*) INTO v_deactivated FROM updated;

  RETURN jsonb_build_object(
    'run_key',                   p_run_key,
    'found',                     v_found,
    'newly_deactivated',         v_deactivated,
    'already_inactive',          v_found - v_deactivated,
    'alias_found',               v_alias_found,
    'alias_newly_deactivated',   v_alias_deactivated,
    'alias_already_inactive',    v_alias_found - v_alias_deactivated,
    'alias_dependent_deactivated', v_alias_dependent
  );
END;
$$;

-- ── 14. Function privileges ──────────────────────────────────────
REVOKE ALL ON FUNCTION deliver_catalog_exercises(TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION rollback_catalog_delivery(TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION exlib_claim_exercise_name() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION exlib_claim_alias_name() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION exlib_claim_catalog_name() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION exlib_claim_catalog_alias() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION exlib_verify_catalog_claims() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION exlib_deactivate_exercise_aliases() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION exlib_block_delivered_exercise_delete() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION exlib_verify_alias_lifecycle() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION exlib_freeze_catalog_snapshot() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION exlib_freeze_catalog_anatomy() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION exlib_freeze_catalog_alias() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION exlib_freeze_run_membership() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION exlib_freeze_review_events() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION exlib_freeze_run_row() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION exlib_approve_and_seal_run(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION exlib_revoke_run_delivery(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION deliver_catalog_exercises(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION rollback_catalog_delivery(TEXT) TO authenticated;
