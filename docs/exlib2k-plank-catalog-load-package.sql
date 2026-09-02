-- ============================================================
-- EXLIB-2K PLANK CATALOG-LOAD PACKAGE
-- docs/exlib2k-plank-catalog-load-package.sql
-- STATUS: PREPARED — NOT EXECUTED
--
-- This package is a reviewable, deterministic, ONE-USE SQL load for
-- the single admitted Plank content record and the minimum identities
-- it requires. It lives under docs/, NOT under supabase/migrations/,
-- and has NOT been executed against any hosted or persistent
-- database. Its only eventual target is the ShredOS Supabase project
-- ttybyljytiwntvorugcv, and ONLY under a later explicit operator
-- instruction through the authorized Joseph/ChatGPT path; Claude
-- never executes it against hosted.
--
-- BINDINGS (this package is valid only against exactly these bytes):
--   - applied migration 027 (schema + loader authority):
--     supabase/migrations/027_exlib_catalog_content_schema.sql
--     65,455 bytes, SHA-256
--     90d53aaf8fd341dd99bab22b7d1ca280ec24b8ccee2a28efca6e835e0585a14f
--   - admitted Plank source artifact (human-approved by Nick Tkacz,
--     Personal Trainer; import_eligible=true under the consumed R6
--     admission; review_status remains the authoring-pipeline value
--     "proposed"; NO publication state exists in the artifact):
--     docs/exlib2g-plank-content.jsonl
--     2,928 bytes, SHA-256
--     d82078490efa9ef13e128e7b7b742fbda8ea9e74e32382252d96c326c679d752
--   Any byte change to either bound artifact voids this package.
--
-- AUTHORITY: uses ONLY migration-027's loader authority
-- (exlib_catalog_loader) and its three approved loader functions
-- (load_catalog_identity, load_catalog_snapshot,
-- load_catalog_content_draft). It performs NO review transition, NO
-- admission, NO publication, NO approval, NO sealing, NO revocation,
-- NO delivery, NO import-run or run-membership creation (the
-- promoted 023/026 contracts bind runs to DELIVERY, not to content
-- loading), NO seed edit, and NO inventory flip. The loaded content
-- version is left exactly PENDING, DRAFT, and UNADMITTED.
--
-- DETERMINISTIC PREDECLARED IDENTIFIERS (assigned by this package;
-- no committed UUIDs exist for a not-yet-loaded catalog, so the
-- package declares them and the record documents them):
--   Plank logical identity ............ e21b2c00-0000-4000-a000-000000000001
--   Dead bug logical identity ......... e21b2c00-0000-4000-a000-000000000002
--   Ab wheel rollout logical identity . e21b2c00-0000-4000-a000-000000000003
--   Plank content version 1 id ........ e21b2c00-0000-4000-a000-000000000101
-- The Dead bug and Ab wheel rollout rows are IDENTITY-ONLY stubs:
-- migration 027's relationship model keys on
-- exercise_catalog_logical, so bare identities satisfy Plank's
-- version-owned expected relationship set. Both names come verbatim
-- from the admitted artifact's substitutions/progressions arrays and
-- both exist in the promoted release-1 inventory; NEITHER receives a
-- snapshot, content, review, eligibility, publication, or delivery
-- state here (no separately approved and eligible source artifact
-- exists for them).
--
-- INTENDED vs DATABASE-PROVEN TARGET IDENTITY (semantic precision):
-- the admitted artifact and this reviewed package ASSIGN the intended
-- target-name-to-UUID mapping above. After this load the database
-- stores only the bare logical UUIDs; it does not yet carry
-- canonical-name evidence for either target, and NO claim is made
-- that hosted database state independently proves those names after
-- this load. Identity-only staging is acceptable in THIS milestone
-- only because Plank remains pending, draft, unadmitted, and
-- unpublished. Database review, admission, and publication of Plank
-- MUST all remain blocked until separately reviewed target snapshots
-- exist and a fail-closed gate proves that
-- e21b2c00-0000-4000-a000-000000000002 bears the active canonical
-- snapshot 'Dead bug' and e21b2c00-0000-4000-a000-000000000003 bears
-- the active canonical snapshot 'Ab wheel rollout', with neither
-- mapping swapped, missing, inactive, or ambiguous.
--
-- FIELD DERIVATION: every loaded value is verbatim from the admitted
-- artifact except (a) the four predeclared UUIDs above, (b)
-- content_version = 1 (the deterministic first version under a fresh
-- identity), and (c) the snapshot category 'isolation', which is
-- DERIVED FROM COMMITTED CONTRACT, not from general knowledge: the
-- artifact and inventory carry no catalog category; the promoted
-- product definition of Plank's category is 'isolation' (the seed
-- module's Plank row; the 2D pristine-seed predicate; the APPLIED
-- migration 026 gate v_seed.category = 'isolation'); 026's link path
-- deliberately leaves the matched row's category untouched while its
-- fresh-delivery path copies the CATALOG category into new tenant
-- rows - so 'isolation' is the unique value under which both applied
-- delivery paths agree, per 2D's the-linked-row-never-disagrees
-- principle. This derivation is disclosed for review in the
-- preparation record.
--
-- ONE-USE / RERUN BEHAVIOR: the preconditions require a completely
-- EMPTY catalog surface. The promoted loader functions are
-- deliberately not idempotent (their inserts hit primary keys and
-- claims), so a second execution fails closed at the preconditions
-- before any write. This is a ONE-USE package by design.
--
-- ATOMICITY: ONE explicit transaction encloses every statement;
-- any precondition failure, loader refusal, constraint violation, or
-- postcondition mismatch rolls back the WHOLE package.
-- ============================================================

BEGIN;

-- ── Fresh-load gate serialization (concurrency correction) ───────
-- Two concurrent executions of this package must never BOTH observe
-- an empty surface and BOTH commit. Before the empty-state read, the
-- transaction acquires SHARE ROW EXCLUSIVE locks on EVERY table the
-- gate covers, in ONE deterministic, documented order: ALPHABETICAL
-- by table name, in a single LOCK statement. SHARE ROW EXCLUSIVE
-- conflicts with itself and with ROW EXCLUSIVE, so any concurrent
-- package execution (or any unrelated direct writer) blocks here
-- until this transaction ends, while ordinary reads stay unblocked.
-- The same transaction's own loader calls are unaffected (a
-- transaction does not conflict with its own locks). The locks are
-- transaction-scoped, so they remain held through every loader call,
-- every postcondition, and COMMIT. These are REAL table locks - no
-- advisory-lock-only design - so non-cooperating writers are bound
-- too. A queued second execution proceeds only after this one
-- commits, then fails closed at the nonempty one-use precondition.
LOCK TABLE
  public.exercise_catalog,
  public.exercise_catalog_aliases,
  public.exercise_catalog_content,
  public.exercise_catalog_content_expected_relationships,
  public.exercise_catalog_import_runs,
  public.exercise_catalog_logical,
  public.exercise_catalog_muscles,
  public.exercise_catalog_name_claims,
  public.exercise_catalog_relationships,
  public.exercise_catalog_run_items
  IN SHARE ROW EXCLUSIVE MODE;

-- ── Preconditions (run as the invoking operator role, BEFORE the
--    loader role is assumed; the loader holds no table privileges) ─
DO $pre$
DECLARE
  v_n BIGINT;
BEGIN
  IF to_regprocedure('public.load_catalog_identity(uuid)') IS NULL
     OR to_regprocedure('public.load_catalog_snapshot(uuid,text,text,text,text,text,text,text,text,text,text,text,text,text,date,text,jsonb,jsonb)') IS NULL
     OR to_regprocedure('public.load_catalog_content_draft(uuid,uuid,integer,text,date,jsonb,jsonb,text,jsonb,text,text,text,jsonb)') IS NULL THEN
    RAISE EXCEPTION 'exlib2k load: migration-027 loader functions are missing; wrong or unmigrated database';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'exlib_catalog_loader') THEN
    RAISE EXCEPTION 'exlib2k load: loader role missing';
  END IF;
  SELECT (SELECT count(*) FROM public.exercise_catalog_logical)
       + (SELECT count(*) FROM public.exercise_catalog)
       + (SELECT count(*) FROM public.exercise_catalog_muscles)
       + (SELECT count(*) FROM public.exercise_catalog_aliases)
       + (SELECT count(*) FROM public.exercise_catalog_name_claims)
       + (SELECT count(*) FROM public.exercise_catalog_content)
       + (SELECT count(*) FROM public.exercise_catalog_content_expected_relationships)
       + (SELECT count(*) FROM public.exercise_catalog_relationships)
       + (SELECT count(*) FROM public.exercise_catalog_import_runs)
       + (SELECT count(*) FROM public.exercise_catalog_run_items)
    INTO v_n;
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'exlib2k load: catalog surface is not empty (% rows); this is a ONE-USE fresh-load package and refuses to run twice or over foreign state', v_n;
  END IF;
END
$pre$;

-- ── The load, under the loader authority ONLY ────────────────────
SET ROLE exlib_catalog_loader;

SELECT load_catalog_identity('e21b2c00-0000-4000-a000-000000000001');
SELECT load_catalog_identity('e21b2c00-0000-4000-a000-000000000002');
SELECT load_catalog_identity('e21b2c00-0000-4000-a000-000000000003');

SELECT load_catalog_snapshot(
  'e21b2c00-0000-4000-a000-000000000001',
  $nm$Plank$nm$,
  'isolation',
  $pm$abs$pm$,
  $eq$bodyweight$eq$,
  $lat$bilateral$lat$,
  $tm$timed$tm$,
  $prov$forgefitos_original$prov$,
  $mp$core_anti_extension$mp$,
  $tr$core$tr$,
  $dif$beginner$dif$,
  $av$minimal$av$,
  NULL, NULL, NULL, NULL,
  $anat$[{"muscle": "obliques", "role": "secondary"}, {"muscle": "lower_back", "role": "tertiary"}]$anat$::jsonb,
  $alia$["Front plank", "Forearm plank"]$alia$::jsonb);

SELECT load_catalog_content_draft(
  'e21b2c00-0000-4000-a000-000000000001',
  'e21b2c00-0000-4000-a000-000000000101',
  1,
  $ab$ForgeFitOS content program (AI-drafted original prose; pending human specialist review)$ab$,
  $ad$2026-09-01$ad$::date,
  $setu$["Lie face down, then prop yourself on your forearms with your elbows stacked directly under your shoulders.", "Extend your legs behind you with your feet about hip-width apart and your toes tucked under.", "Before lifting, brace your trunk gently as if preparing for a light press against your stomach."]$setu$::jsonb,
  $exec$["Lift your hips so your body forms one straight line from the back of your head to your heels.", "Squeeze your glutes and keep your ribs drawn down so your lower back never sags toward the floor.", "Hold the position for the planned duration while keeping your neck long and your gaze at the floor.", "End the hold by lowering your knees to the floor under control, then rest fully before the next hold."]$exec$::jsonb,
  $br$Breathe steadily for the whole hold with slow inhales and full exhales; never hold your breath to stiffen the position.$br$,
  $mist$["Letting the hips sag so the lower back arches instead of staying in one straight line.", "Lifting the hips too high, which turns the hold into a rest position for the trunk.", "Grinding out extra seconds with a broken line instead of ending the hold when the position degrades."]$mist$::jsonb,
  $sf$A plank loads the trunk hardest once the hips drift, so keep the line strict rather than chasing longer times; if your lower back starts to ache or your hips sag and you cannot correct it, lower your knees and stop the hold there.$sf$,
  $es$$es$,
  $ac$Hold the position with your knees resting on the floor, or brace against a countertop at an incline for a gentler version.$ac$,
  $expx$[{"relation": "substitution", "to_logical_id": "e21b2c00-0000-4000-a000-000000000002"}, {"relation": "progression", "to_logical_id": "e21b2c00-0000-4000-a000-000000000003"}]$expx$::jsonb);

RESET ROLE;

-- ── Postconditions (owner reads; any mismatch rolls back ALL) ────
DO $post$
DECLARE
  v_c public.exercise_catalog_content%ROWTYPE;
BEGIN
  IF (SELECT count(*) FROM public.exercise_catalog_logical) <> 3 THEN
    RAISE EXCEPTION 'exlib2k post: expected exactly 3 logical identities';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog) <> 1
     OR NOT EXISTS (SELECT 1 FROM public.exercise_catalog s
       WHERE s.logical_id = 'e21b2c00-0000-4000-a000-000000000001' AND s.is_active AND s.canonical_name = 'Plank'
         AND s.category = 'isolation' AND s.primary_muscle = $pm2$abs$pm2$
         AND s.equipment = $eq2$bodyweight$eq2$ AND s.laterality = $lat2$bilateral$lat2$
         AND s.tracking_mode = $tm2$timed$tm2$
         AND s.provenance = $prov2$forgefitos_original$prov2$
         AND s.movement_pattern = $mp2$core_anti_extension$mp2$
         AND s.training_role = $tr2$core$tr2$
         AND s.difficulty = $dif2$beginner$dif2$
         AND s.availability = $av2$minimal$av2$
         AND s.source_url IS NULL AND s.source_page IS NULL
         AND s.retrieved_at IS NULL AND s.import_confidence IS NULL
         AND s.review_status = 'pending') THEN
    RAISE EXCEPTION 'exlib2k post: the single Plank snapshot does not match the bound artifact exactly';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_muscles) <> 2
     OR (SELECT string_agg(m.muscle || ':' || m.role, ',' ORDER BY m.muscle)
         FROM public.exercise_catalog_muscles m) <> 'lower_back:tertiary,obliques:secondary' THEN
    RAISE EXCEPTION 'exlib2k post: anatomy does not match the artifact pair exactly';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_aliases) <> 2
     OR (SELECT string_agg(a.alias, ',' ORDER BY a.alias)
         FROM public.exercise_catalog_aliases a WHERE a.logical_id = 'e21b2c00-0000-4000-a000-000000000001') <> 'Forearm plank,Front plank' THEN
    RAISE EXCEPTION 'exlib2k post: aliases do not match the artifact pair exactly';
  END IF;
  SELECT c.* INTO v_c FROM public.exercise_catalog_content c WHERE c.id = 'e21b2c00-0000-4000-a000-000000000101';
  IF NOT FOUND
     OR (SELECT count(*) FROM public.exercise_catalog_content) <> 1
     OR v_c.logical_id <> 'e21b2c00-0000-4000-a000-000000000001' OR v_c.content_version <> 1
     OR v_c.content_status <> 'pending' OR v_c.publication_status <> 'draft'
     OR v_c.import_admitted
     OR v_c.admitted_fingerprint IS NOT NULL
     OR v_c.admitted_source_sha256 IS NOT NULL
     OR v_c.admitted_at IS NOT NULL
     OR v_c.reviewed_by IS NOT NULL OR v_c.reviewed_at IS NOT NULL
     OR v_c.review_rationale IS NOT NULL THEN
    RAISE EXCEPTION 'exlib2k post: the content version is not exactly one pending/draft/unadmitted row';
  END IF;
  IF v_c.authored_by <> $ab2$ForgeFitOS content program (AI-drafted original prose; pending human specialist review)$ab2$
     OR v_c.authored_at <> $ad2$2026-09-01$ad2$::date
     OR v_c.setup_steps <> $setu2$["Lie face down, then prop yourself on your forearms with your elbows stacked directly under your shoulders.", "Extend your legs behind you with your feet about hip-width apart and your toes tucked under.", "Before lifting, brace your trunk gently as if preparing for a light press against your stomach."]$setu2$::jsonb
     OR v_c.execution_steps <> $exec2$["Lift your hips so your body forms one straight line from the back of your head to your heels.", "Squeeze your glutes and keep your ribs drawn down so your lower back never sags toward the floor.", "Hold the position for the planned duration while keeping your neck long and your gaze at the floor.", "End the hold by lowering your knees to the floor under control, then rest fully before the next hold."]$exec2$::jsonb
     OR v_c.breathing_cue <> $br2$Breathe steadily for the whole hold with slow inhales and full exhales; never hold your breath to stiffen the position.$br2$
     OR v_c.common_mistakes <> $mist2$["Letting the hips sag so the lower back arches instead of staying in one straight line.", "Lifting the hips too high, which turns the hold into a rest position for the trunk.", "Grinding out extra seconds with a broken line instead of ending the hold when the position degrades."]$mist2$::jsonb
     OR v_c.safety_guidance <> $sf2$A plank loads the trunk hardest once the hips drift, so keep the line strict rather than chasing longer times; if your lower back starts to ache or your hips sag and you cannot correct it, lower your knees and stop the hold there.$sf2$
     OR v_c.equipment_setup IS DISTINCT FROM $es2$$es2$
     OR v_c.accessibility_alternative IS DISTINCT FROM $ac2$Hold the position with your knees resting on the floor, or brace against a countertop at an incline for a gentler version.$ac2$ THEN
    RAISE EXCEPTION 'exlib2k post: the authored payload does not match the admitted artifact exactly';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_content_expected_relationships) <> 2
     OR NOT EXISTS (SELECT 1 FROM public.exercise_catalog_content_expected_relationships e
          WHERE e.content_id = 'e21b2c00-0000-4000-a000-000000000101' AND e.relation = 'substitution' AND e.to_logical_id = 'e21b2c00-0000-4000-a000-000000000002')
     OR NOT EXISTS (SELECT 1 FROM public.exercise_catalog_content_expected_relationships e
          WHERE e.content_id = 'e21b2c00-0000-4000-a000-000000000101' AND e.relation = 'progression' AND e.to_logical_id = 'e21b2c00-0000-4000-a000-000000000003') THEN
    RAISE EXCEPTION 'exlib2k post: the expected relationship set is not exactly substitution->Dead bug and progression->Ab wheel rollout';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_name_claims) <> 3
     OR NOT EXISTS (SELECT 1 FROM public.exercise_catalog_name_claims c
          WHERE c.normalized_name = 'plank' AND c.claim_source = 'canonical'
            AND c.logical_id = 'e21b2c00-0000-4000-a000-000000000001')
     OR NOT EXISTS (SELECT 1 FROM public.exercise_catalog_name_claims c
          WHERE c.normalized_name = 'front plank' AND c.claim_source = 'alias'
            AND c.logical_id = 'e21b2c00-0000-4000-a000-000000000001')
     OR NOT EXISTS (SELECT 1 FROM public.exercise_catalog_name_claims c
          WHERE c.normalized_name = 'forearm plank' AND c.claim_source = 'alias'
            AND c.logical_id = 'e21b2c00-0000-4000-a000-000000000001') THEN
    RAISE EXCEPTION 'exlib2k post: the catalog name claims are not exactly the three required rows (canonical plank plus the two alias claims, all owned by the Plank identity)';
  END IF;
  -- Bidirectional claim invariant, via the promoted migration-023
  -- verifier function (STABLE, read-only; safe from this owner
  -- postcondition context): zero orphaned claims AND zero unclaimed
  -- bearers.
  IF EXISTS (SELECT 1 FROM public.exlib_verify_catalog_claims() v
             WHERE v.orphaned_claims <> 0 OR v.unclaimed_bearers <> 0) THEN
    RAISE EXCEPTION 'exlib2k post: the bidirectional name-claim invariant is violated (orphaned claim or unclaimed bearer)';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_relationships) <> 0
     OR (SELECT count(*) FROM public.exercise_catalog_import_runs) <> 0
     OR (SELECT count(*) FROM public.exercise_catalog_run_items) <> 0
     OR (SELECT count(*) FROM public.exercise_catalog WHERE logical_id IN ('e21b2c00-0000-4000-a000-000000000002','e21b2c00-0000-4000-a000-000000000003')) <> 0
     OR (SELECT count(*) FROM public.exercise_catalog_content WHERE logical_id IN ('e21b2c00-0000-4000-a000-000000000002','e21b2c00-0000-4000-a000-000000000003')) <> 0 THEN
    RAISE EXCEPTION 'exlib2k post: forbidden state exists (projection, run, membership, or target snapshot/content)';
  END IF;
END
$post$;

COMMIT;

-- The transaction above is the entire package. After COMMIT the
-- database holds exactly: three logical identities; one pending
-- Plank snapshot with its two anatomy rows, two aliases, and exactly THREE
-- catalog name claims (one canonical 'plank' plus the two alias
-- claims), postcondition-verified together with migration 023's
-- bidirectional claim invariant; one PENDING, DRAFT, UNADMITTED
-- Plank content version 1
-- carrying the admitted payload verbatim; and its two-row expected
-- relationship set. Database review, admission, publication, and
-- every later act remain separately gated authorities.
