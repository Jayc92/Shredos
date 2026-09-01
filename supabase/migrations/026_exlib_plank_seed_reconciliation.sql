-- ============================================================
-- EXLIB-2F APPLY-PREP CANDIDATE: migration 026
-- Plank seed reconciliation implementation
--
-- STATUS: PREPARED FOR LATER EXPLICIT APPLICATION - NOT APPLIED.
-- This file was NOT applied to any hosted or persistent database
-- during the EXLIB-2F phase; it exists so a later, explicitly
-- authorized application step has a real migration candidate.
-- Hosted application remains Joseph/ChatGPT-only, and only against
-- the ShredOS Supabase project, never performed by Claude.
--
-- Reviewed source: the EXLIB-2E implementation proposal promoted at
-- commit 7fed0eed6f18c1752e15d3ba76b6e0c7adeaacf3 (annotated tag
-- exlib2e-migration-026-proposal-reviewed-unapplied), preserved
-- unchanged at docs/exlib2e-migration-026-proposal.sql with
-- SHA-256 a6696066d178ced7e53bf81e7106cce64a87e2c73d9b342464d930a2fe3c2108
-- (32,500 bytes). Everything below this header block is
-- byte-identical to that reviewed proposal's executable SQL; only
-- this leading status commentary differs, because the proposal
-- truthfully describes itself as a docs/-resident draft.
--
-- Still separately gated (NOT authorized by this file's existence):
-- the seed module edit, Plank instructional content authoring, the
-- inventory seed_link_compatible flip, catalog loading, and any
-- delivery to users.
--
-- Contract source: docs/exlib2d-plank-seed-reconciliation-record.md
-- and docs/exlib2d-plank-reconciliation-matrix.md (approved design).
-- The two CREATE OR REPLACE bodies below carry the migration-023
-- function text VERBATIM except for the marked EXLIB-2D splices, so
-- every non-Plank identity's authorization, selection, mutation,
-- collision, idempotency, alias, provenance, and rollback semantics
-- remain unchanged, and all 13 existing JSONB report keys keep
-- their names, types, and meanings (one additive key:
-- plank_disposition).
-- ============================================================

-- ── 1. P2 correction provenance (structural, tenant-scoped) ──────
-- Delivered inserts also carry is_system=true, so no existing
-- column can distinguish a corrected preexisting seed row from a
-- run-inserted row; this record is the structural discriminator.
-- Durability: rows are never deleted or mutated by any 026 path;
-- RESTRICT FKs prevent referenced-entity deletion out from under
-- the record, and the exercises delete gate independently blocks
-- physical deletion of the corrected row itself.
CREATE TABLE exercise_catalog_corrections (
  user_id            UUID NOT NULL,
  exercise_id        UUID NOT NULL,
  import_run_id      UUID NOT NULL
    REFERENCES exercise_catalog_import_runs (id) ON DELETE RESTRICT,
  catalog_logical_id UUID NOT NULL
    REFERENCES exercise_catalog_logical (id) ON DELETE RESTRICT,
  corrected_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, exercise_id),
  CONSTRAINT exercise_catalog_corrections_exercise_fk
    FOREIGN KEY (user_id, exercise_id)
    REFERENCES exercises (user_id, id) ON DELETE RESTRICT
);

CREATE INDEX exercise_catalog_corrections_run_idx
  ON exercise_catalog_corrections (import_run_id);

-- Ordinary authenticated clients can never forge, mutate, or delete
-- correction provenance: RLS is enabled with NO client policies
-- (deny-by-default) and every table privilege is revoked; only the
-- SECURITY DEFINER delivery/rollback functions (owner access) touch
-- it — the same posture migration 023 uses for its machinery.
ALTER TABLE exercise_catalog_corrections ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE exercise_catalog_corrections
  FROM PUBLIC, anon, authenticated;

-- ── 2a. Shared verified-idempotency validation (EXLIB-2E review 1) ──
-- ONE validation shape used by BOTH the existing-link path and the
-- raced logical-index path, so the two can never drift. STRICT run
-- provenance: the linked row must carry EXACTLY the delivering
-- authorized run's id — a different, revoked, dry-run, unapproved,
-- or unrelated run never validates as idempotent. Internal helper
-- only (client execution revoked); NOT a delivery entrypoint.
CREATE OR REPLACE FUNCTION exlib_plank_link_valid(
  p_uid       UUID,
  p_link      public.exercises,
  p_cat_id    UUID,
  p_logical   UUID,
  p_canonical TEXT,
  p_run_id    UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $helper$
DECLARE
  v_row_anat TEXT;
  v_cat_anat TEXT;
BEGIN
  -- EXLIB-2E (review 2) locking contract: the CALLER has already
  -- locked the parent exercises row FOR UPDATE; lock the child
  -- anatomy rows here, parent-first then children in deterministic
  -- primary-key order, BEFORE reading the signature. Direct client
  -- UPDATE/DELETE of exercise_muscles does not take the parent lock,
  -- so without this a concurrent customization could race the
  -- validation; with it, existing child rows are serialized here and
  -- NEW child inserts are serialized by the FK's key-share lock
  -- against the caller's parent FOR UPDATE. VOLATILE because row
  -- locking is not permitted in a STABLE function.
  PERFORM 1 FROM public.exercise_muscles m
  WHERE m.user_id = p_uid AND m.exercise_id = p_link.id
  ORDER BY m.id
  FOR UPDATE;
  SELECT COALESCE(string_agg(m.muscle || ':' || m.role, ',' ORDER BY m.muscle, m.role), '')
    INTO v_row_anat FROM public.exercise_muscles m
    WHERE m.user_id = p_uid AND m.exercise_id = p_link.id;
  SELECT COALESCE(string_agg(m.muscle || ':' || m.role, ',' ORDER BY m.muscle, m.role), '')
    INTO v_cat_anat FROM public.exercise_catalog_muscles m
    WHERE m.catalog_id = p_cat_id;
  RETURN p_link.user_id = p_uid
    AND p_link.tracking_mode = 'timed'
    AND p_link.exercise_type = 'mobility'
    AND p_link.catalog_id = p_cat_id
    AND p_link.catalog_logical_id = p_logical
    AND p_link.import_run_id = p_run_id
    AND v_row_anat = v_cat_anat
    AND (
      (lower(p_link.name) = lower(p_canonical)
       AND EXISTS (SELECT 1 FROM public.exercise_name_claims n
                   WHERE n.user_id = p_uid
                     AND n.normalized_name = lower(p_canonical)
                     AND n.claim_source = 'exercise'
                     AND n.exercise_id = p_link.id))
      OR
      (lower(p_link.name) = lower(p_canonical || ' (timed)')
       AND EXISTS (SELECT 1 FROM public.exercise_name_claims n
                   WHERE n.user_id = p_uid
                     AND n.normalized_name = lower(p_canonical || ' (timed)')
                     AND n.claim_source = 'exercise'
                     AND n.exercise_id = p_link.id))
    );
END;
$helper$;

REVOKE ALL ON FUNCTION exlib_plank_link_valid(UUID, public.exercises, UUID, UUID, TEXT, UUID)
  FROM PUBLIC, anon, authenticated;

-- ── 2b. deliver_catalog_exercises: CREATE OR REPLACE (the ONE
--      public tenant delivery entrypoint; no second entrypoint) ──
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
  -- EXLIB-2D (proposed migration 026): Plank reconciliation state.
  v_plank_logical     UUID;
  v_plank_disposition TEXT    := 'not_in_run';
  v_plank_name        TEXT;
  v_linked            public.exercises%ROWTYPE;
  v_seed              public.exercises%ROWTYPE;
  v_seed_found        BOOLEAN := false;
  v_p2_ok             BOOLEAN := false;
  v_row_anat          TEXT;
  v_cat_anat          TEXT;
  v_claim_source      TEXT;
  v_claim_exercise    UUID;
  v_snap_mode         TEXT;
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

  -- EXLIB-2D: resolve this run's Plank logical identity once (NULL
  -- when the run has no approved active Plank member).
  SELECT c.logical_id INTO v_plank_logical
  FROM public.exercise_catalog c
  JOIN public.exercise_catalog_run_items ri
    ON ri.run_id = v_run.id AND ri.catalog_id = c.id
  WHERE c.review_status = 'approved'
    AND c.is_active = true
    AND lower(c.canonical_name) = 'plank'
  LIMIT 1;

  -- EXLIB-2E (review 1) catalog snapshot gate: before ANY Plank
  -- correction or delivery, the run's active approved Plank snapshot
  -- itself must match the promoted contract — timed tracking (which
  -- derives the mobility tenant type) and the exact approved anatomy
  -- multiset. A bodyweight or malformed snapshot fails the whole
  -- delivery closed; it can never produce a timed disposition or a
  -- tenant row whose mode disagrees with its catalog provenance.
  IF v_plank_logical IS NOT NULL THEN
    SELECT c.tracking_mode,
           COALESCE((SELECT string_agg(m.muscle || ':' || m.role, ',' ORDER BY m.muscle, m.role)
                     FROM public.exercise_catalog_muscles m
                     WHERE m.catalog_id = c.id), '')
      INTO v_snap_mode, v_cat_anat
    FROM public.exercise_catalog c
    JOIN public.exercise_catalog_run_items ri
      ON ri.run_id = v_run.id AND ri.catalog_id = c.id
    WHERE c.logical_id = v_plank_logical
      AND c.review_status = 'approved'
      AND c.is_active = true
    LIMIT 1;
    IF v_snap_mode IS DISTINCT FROM 'timed'
       OR v_cat_anat <> 'lower_back:tertiary,obliques:secondary' THEN
      RAISE EXCEPTION 'deliver_catalog_exercises: malformed Plank catalog snapshot (expected timed tracking and the approved anatomy multiset); delivery fails closed';
    END IF;
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

    -- ── EXLIB-2D Plank dispatch (this logical identity ONLY; every
    -- other identity falls through to the unchanged generic path
    -- below). All work stays inside the same transaction and the
    -- same per-user advisory-lock domain as ordinary delivery. ──
    IF v_plank_logical IS NOT NULL AND v_cat.logical_id = v_plank_logical THEN
      -- Verified idempotency: an existing link is locked and fully
      -- validated; it may no-op ONLY if every invariant passes.
      SELECT e.* INTO v_linked FROM public.exercises e
      WHERE e.user_id = v_uid AND e.catalog_logical_id = v_cat.logical_id
      FOR UPDATE;
      IF FOUND THEN
        -- EXLIB-2E (review 1): shared validation shape; strict run
        -- provenance (import_run_id must equal THIS authorized run).
        IF exlib_plank_link_valid(v_uid, v_linked, v_cat.id, v_cat.logical_id,
                                  v_cat.canonical_name, v_run.id) THEN
          v_skipped_existing := v_skipped_existing + 1;
          v_plank_disposition := 'already_valid_idempotent';
          CONTINUE;
        END IF;
        RAISE EXCEPTION 'deliver_catalog_exercises: inconsistent prior Plank reconciliation requires separate investigation (no silent repair, relink, anatomy overwrite, or rename)';
      END IF;

      -- P2: guarded in-place correction of a provably pristine,
      -- unused, uncustomized seed row (nine preconditions, all
      -- re-verified here under SELECT ... FOR UPDATE).
      v_seed_found := false;
      v_p2_ok := false;
      SELECT n.claim_source, n.exercise_id INTO v_claim_source, v_claim_exercise
      FROM public.exercise_name_claims n
      WHERE n.user_id = v_uid AND n.normalized_name = lower(v_cat.canonical_name);
      IF v_claim_source = 'exercise' THEN
        SELECT e.* INTO v_seed FROM public.exercises e
        WHERE e.user_id = v_uid AND e.id = v_claim_exercise
        FOR UPDATE;
        IF FOUND THEN
          v_seed_found := true;
          IF v_seed.name = 'Plank'
             AND v_seed.is_system = true AND v_seed.is_active = true
             AND v_seed.notes IS NULL
             AND v_seed.equipment = 'bodyweight'
             AND v_seed.tracking_mode = 'bodyweight'
             AND v_seed.exercise_type = 'bodyweight'
             AND v_seed.category = 'isolation'
             AND v_seed.primary_muscle = 'abs'
             AND v_seed.unilateral = false
             AND v_seed.catalog_id IS NULL
             AND v_seed.catalog_logical_id IS NULL
             AND v_seed.import_run_id IS NULL
             AND NOT EXISTS (SELECT 1 FROM public.workout_exercises w
                             WHERE w.exercise_id = v_seed.id)
             AND NOT EXISTS (SELECT 1 FROM public.workout_routine_exercises w
                             WHERE w.exercise_id = v_seed.id)
             AND NOT EXISTS (SELECT 1 FROM public.exercise_aliases a
                             WHERE a.user_id = v_uid AND a.exercise_id = v_seed.id)
          THEN
            -- EXLIB-2E (review 2): lock the seed row's child anatomy
            -- rows (parent already locked above; children in
            -- deterministic primary-key order) BEFORE reading the
            -- signature and before the delete-and-replace, so a
            -- concurrent customization can never be overwritten as a
            -- pristine correction.
            PERFORM 1 FROM public.exercise_muscles m
            WHERE m.user_id = v_uid AND m.exercise_id = v_seed.id
            ORDER BY m.id
            FOR UPDATE;
            SELECT COALESCE(string_agg(m.muscle || ':' || m.role, ',' ORDER BY m.muscle, m.role), '')
              INTO v_row_anat FROM public.exercise_muscles m
              WHERE m.user_id = v_uid AND m.exercise_id = v_seed.id;
            IF v_row_anat = 'obliques:secondary' THEN
              v_p2_ok := true;
            END IF;
          END IF;
        END IF;
      END IF;

      IF v_p2_ok THEN
        -- Atomic: scalar + provenance update, anatomy replacement to
        -- the exact active approved catalog snapshot, and the
        -- correction record — all or nothing with the delivery txn.
        UPDATE public.exercises SET
          tracking_mode      = 'timed',
          exercise_type      = 'mobility',
          catalog_id         = v_cat.id,
          catalog_logical_id = v_cat.logical_id,
          import_run_id      = v_run.id
        WHERE id = v_seed.id AND user_id = v_uid;
        DELETE FROM public.exercise_muscles
        WHERE user_id = v_uid AND exercise_id = v_seed.id;
        INSERT INTO public.exercise_muscles (user_id, exercise_id, muscle, role)
        SELECT v_uid, v_seed.id, m.muscle, m.role
        FROM public.exercise_catalog_muscles m
        WHERE m.catalog_id = v_cat.id;
        INSERT INTO public.exercise_catalog_corrections
          (user_id, exercise_id, import_run_id, catalog_logical_id)
        VALUES (v_uid, v_seed.id, v_run.id, v_cat.logical_id);
        v_plank_disposition := 'corrected_and_linked_pristine_seed';
        CONTINUE;
      END IF;

      -- Collision-safe delivery: canonical when the claim is free,
      -- the deterministic distinguished fallback when only the
      -- canonical is claimed, otherwise a fail-closed retryable
      -- skip. Never a rename of any existing row.
      IF NOT EXISTS (SELECT 1 FROM public.exercise_name_claims n
                     WHERE n.user_id = v_uid
                       AND n.normalized_name = lower(v_cat.canonical_name)) THEN
        v_plank_name := v_cat.canonical_name;
        v_plank_disposition := 'delivered_canonical_timed_plank';
      ELSIF NOT EXISTS (SELECT 1 FROM public.exercise_name_claims n
                        WHERE n.user_id = v_uid
                          AND n.normalized_name = lower(v_cat.canonical_name || ' (timed)')) THEN
        v_plank_name := v_cat.canonical_name || ' (timed)';
        IF v_seed_found THEN
          v_plank_disposition := 'precondition_failure_preserved_legacy_plus_distinguished_delivery';
        ELSE
          v_plank_disposition := 'delivered_distinguished_timed_plank';
        END IF;
      ELSE
        v_skipped_collision := v_skipped_collision + 1;
        v_collision_names   := array_append(v_collision_names, v_cat.canonical_name);
        v_plank_disposition := 'skipped_canonical_and_distinguished_collision';
        CONTINUE;
      END IF;

      BEGIN
        INSERT INTO public.exercises (
          user_id, name, category, primary_muscle, equipment,
          exercise_type, tracking_mode, unilateral,
          is_active, is_system, catalog_id, catalog_logical_id, import_run_id
        ) VALUES (
          v_uid, v_plank_name, v_cat.category, v_cat.primary_muscle,
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
            -- A client create/rename raced the pre-check: honest
            -- fail-closed skip, retryable later (no second fallback
            -- attempt inside a race).
            v_skipped_collision := v_skipped_collision + 1;
            v_collision_names   := array_append(v_collision_names, v_plank_name);
            v_plank_disposition := 'skipped_canonical_and_distinguished_collision';
            CONTINUE;
          ELSIF v_constraint = 'exercises_user_catalog_logical_unique_idx' THEN
            -- EXLIB-2E (review 1): a direct write raced the logical
            -- index (client writes do not share the advisory lock).
            -- The winning row is locked and FULLY validated with the
            -- same shared shape as the existing-link path; only a
            -- completely valid winner may no-op, and any malformed
            -- winner aborts fail-closed with no repair or partial
            -- mutation.
            SELECT e.* INTO v_linked FROM public.exercises e
            WHERE e.user_id = v_uid AND e.catalog_logical_id = v_cat.logical_id
            FOR UPDATE;
            IF FOUND AND exlib_plank_link_valid(v_uid, v_linked, v_cat.id, v_cat.logical_id,
                                                v_cat.canonical_name, v_run.id) THEN
              v_skipped_existing := v_skipped_existing + 1;
              v_plank_disposition := 'already_valid_idempotent';
              CONTINUE;
            END IF;
            RAISE EXCEPTION 'deliver_catalog_exercises: inconsistent prior Plank reconciliation requires separate investigation (no silent repair, relink, anatomy overwrite, or rename)';
          ELSE
            RAISE;
          END IF;
      END;

      v_inserted         := v_inserted + 1;
      v_inserted_logical := array_append(v_inserted_logical, v_cat.logical_id);
      CONTINUE;
    END IF;

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
    'inserted_catalog_logical_ids', to_jsonb(v_inserted_logical),
    'plank_disposition',      v_plank_disposition
  );
END;
$$;

-- ── 3. rollback_catalog_delivery: CREATE OR REPLACE (deactivate-
--      only semantics preserved; corrected P2 rows excluded) ──
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
  WHERE e.user_id = v_uid AND e.import_run_id = v_run.id
    AND NOT EXISTS (SELECT 1 FROM public.exercise_catalog_corrections cc
                    WHERE cc.user_id = e.user_id AND cc.exercise_id = e.id);

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
      -- EXLIB-2D: corrected preexisting P2 rows are provenance-linked
      -- but were NOT inserted by the run; they are never deactivated
      -- (and can never be deleted) by generic rollback.
      AND NOT EXISTS (SELECT 1 FROM public.exercise_catalog_corrections cc
                      WHERE cc.user_id = e.user_id AND cc.exercise_id = e.id)
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
      -- EXLIB-2D: corrected preexisting P2 rows are provenance-linked
      -- but were NOT inserted by the run; they are never deactivated
      -- (and can never be deleted) by generic rollback.
      AND NOT EXISTS (SELECT 1 FROM public.exercise_catalog_corrections cc
                      WHERE cc.user_id = e.user_id AND cc.exercise_id = e.id)
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

-- ── 4. Boundaries ─────────────────────────────────────────────────
-- This proposal does NOT: edit the seed module, author Plank
-- content, mark Plank seed_link_compatible, load or publish catalog
-- data, change eligibility or the review ledger, or touch any
-- non-Plank behavior. Grants on both functions are unchanged from
-- migration 023 (REVOKE from PUBLIC/anon retained there; EXECUTE
-- remains granted to authenticated), because CREATE OR REPLACE
-- preserves existing ACLs.
