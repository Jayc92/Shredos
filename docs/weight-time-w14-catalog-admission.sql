-- ============================================================
-- WEIGHT_TIME W14 FIVE-ENTRY CATALOG ADMISSION PACKAGE
-- docs/weight-time-w14-catalog-admission.sql
-- STATUS: PREPARED - NOT EXECUTED
--
-- GENERATED FILE. Do not edit by hand - regenerate:
--   npx tsx scripts/generate-weight-time-w14-package.ts
-- Every value below is derived from two committed carriers: the
-- historical release-1 inventory (ten class-A fields per entry, read
-- verbatim at the named FILE LINE) and the operator's field decisions
-- (the eight fields the inventory never held). A hand edit here would
-- break that derivation silently; scripts/verify-weight-time-w14.ts
-- recomputes it and fails if this file and the manifest disagree.
--
-- This package is a reviewable, deterministic, ONE-USE SQL load of
-- EXACTLY FIVE weight_time catalog identities and their five canonical
-- snapshots. It lives under docs/, NOT under supabase/migrations/, and
-- has NOT been executed against any hosted or persistent database. It
-- has also never been executed against the operator's local hosted
-- session: the only execution it has ever received is on a disposable
-- initdb cluster created and destroyed by
-- scripts/verify-weight-time-w14-live.sh.
--
-- Its only eventual target is the ShredOS Supabase project
-- ttybyljytiwntvorugcv, and ONLY under a later explicit one-use
-- operator instruction through the authorized Joseph/ChatGPT path.
-- Claude never executes it against hosted, and Claude has made no
-- hosted Supabase contact, no Supabase CLI invocation, and no Vercel
-- contact while preparing it.
--
-- SCOPE - EXACTLY FIVE, IN THIS ORDER (inventory file line -> identity):
--   132  Plate-weighted plank ....... e21b2c00-0000-4000-a000-000000000004
--   133  Weighted vest plank ........ e21b2c00-0000-4000-a000-000000000005
--   137  Weighted dead hang ......... e21b2c00-0000-4000-a000-000000000006
--   138  Weighted wall sit .......... e21b2c00-0000-4000-a000-000000000007
--   139  Weighted vest wall sit ..... e21b2c00-0000-4000-a000-000000000008
-- DELIBERATELY EXCLUDED - the three carries remain DEFERRED and are
-- not admitted, not renamed, not reinterpreted, and given no tracking
-- mode by this package: inventory lines 134 (Farmer's carry), 135
-- (Suitcase carry), 136 (Sandbag bear-hug carry). Carry tracking is a
-- separate, later product decision. The postconditions below prove
-- fail-closed that none of the three landed.
--
-- BINDINGS (this package is valid only against exactly these bytes):
--   - docs/exlib2b-release1-inventory.jsonl
--     103,933 bytes, SHA-256
--     d349110f22700a822eb427fc1dcce3e6dbcfd264b6d48ed84936b07b1ca256f5
--   - docs/exlib2b-release1-coverage-matrix.md
--     10,027 bytes, SHA-256
--     c32b7b9e9d3aafab39a9a6d77db09349dd604457274767fe4c880c6bf1fb2fb0
--   - docs/weight-time-coordinated-implementation-plan.md
--     101,661 bytes, SHA-256
--     b6ef2584c29e66c62e9f5e198d1791610ab17ceabd687af19bc3d352af04ecb6
--   - docs/exlib1a-discovery-manifest.jsonl
--     261,526 bytes, SHA-256
--     336cd4253f747cdb3ba73ffa2af5a63e255c7c87cc452d4c43ed59a654673dfa
--   - docs/exlib1c0a-equipment-resolution.jsonl
--     23,078 bytes, SHA-256
--     f9e7a98db6b519e650d5f2b8a231308c0fd76ccb23e1685f497100812fbd2fb4
--   - docs/weight-time-w14-catalog-field-decisions.md
--     29,662 bytes, SHA-256
--     e111c738f2801f058e9f27136d731f6136401745541baf60ceaa26dbd2cf12d4
--   - docs/exlib2k-plank-catalog-load-package.sql
--     29,760 bytes, SHA-256
--     a1b6dd55850c5d544e2f484d1ce4833b41deec7f3dd4d4c2373cb3b50daaccf0
--   - supabase/migrations/023_exlib_catalog_and_delivery_contract.sql
--     92,806 bytes, SHA-256
--     0991448c39a558385431c78cef6d6063df208312a3f53866756ba730066c42f2
--   - supabase/migrations/025_exlib_equipment_vocabulary_support.sql
--     3,587 bytes, SHA-256
--     fbda16f4d25cacd1715b199050506a4da15896355d96700876b76c68826d304c
--   - supabase/migrations/027_exlib_catalog_content_schema.sql
--     65,455 bytes, SHA-256
--     90d53aaf8fd341dd99bab22b7d1ca280ec24b8ccee2a28efca6e835e0585a14f
--   - supabase/migrations/028_weight_time_tracking_mode.sql
--     37,162 bytes, SHA-256
--     9b7d3a52dc0b75f129745bec51a4c972aa284bb5cb0d6159e0cbbb981e463fb3
--   Any byte change to a bound artifact voids this package.
--   scripts/verify-weight-time-w14.ts recomputes the manifest bindings
--   and proves this file consumes the manifest's exact values.
--
-- STRUCTURAL PREREQUISITE: migration 028 must already be applied, or
-- exercise_catalog_tracking_mode_check rejects 'weight_time' and all
-- five loads fail. 028 was applied to hosted ShredOS under W13-A
-- (operator-executed; hosted history version 20260911034422). This
-- package neither modifies nor re-applies it; the preflight only
-- OBSERVES that the literal is admitted, and refuses otherwise.
--
-- AUTHORITY: uses ONLY migration-027's loader authority
-- (exlib_catalog_loader) through exactly TWO of its approved loader
-- functions - load_catalog_identity and load_catalog_snapshot - both
-- SCHEMA-QUALIFIED at every call site, so the verified function is the
-- invoked function regardless of search_path. It issues NO INSERT,
-- UPDATE or DELETE against any catalog table: every write goes through
-- the loader boundary.
--   DELIBERATELY NOT CALLED, anywhere in this file:
--     load_catalog_content_draft ..... no prose content version
--     apply_content_review ........... no review transition
--     admit_catalog_content .......... no import_admitted mutation
--     publish_catalog_content ........ no publication
--     deliver_catalog_exercises ...... no tenant delivery
--     exlib_content_admission_manifest / _fingerprint
--                                      no admission evidence
-- Loading is not approval. The five snapshots land born-pending and
-- born-active, exactly as migration 027's carried freeze trigger
-- guarantees; database review, admission, publication and delivery all
-- remain separately gated authorities that this package does not touch.
--
-- DETERMINISTIC PREDECLARED IDENTIFIERS: the five UUIDs above are
-- allocated in docs/weight-time-w14-catalog-field-decisions.md section
-- 7 and frozen there. They continue the committed e21b2c00-0000-4000-
-- a000-0000000000NN family (…0001 Plank, …0002 Dead bug, …0003 Ab
-- wheel rollout) at the next free block, …0004 through …0008. No
-- runtime-random UUID is used: load_catalog_identity takes the
-- identity explicitly, so every logical identity is knowable, and
-- reviewable, BEFORE the hosted act.
--
-- FIELD DERIVATION: ten of the eighteen loader arguments per entry are
-- read verbatim from the historical release-1 inventory record at the
-- named file line (canonical_name, primary_muscle, equipment,
-- laterality, tracking_mode, movement_pattern, training_role,
-- difficulty, availability, anatomy). The remaining eight -
-- logical_id, category, provenance, source_url, source_page,
-- retrieved_at, import_confidence, aliases - were ABSENT from that
-- inventory and are carried by the operator's field decisions in
-- docs/weight-time-w14-catalog-field-decisions.md. Nothing here is
-- guessed, and no value is derived from general knowledge.
--
-- MIXED PROVENANCE IS INTENTIONAL: 132 and 133 are
-- external_source_derived and carry all four discovery-source fields;
-- 137, 138 and 139 are forgefitos_original and carry all four as NULL.
-- exercise_catalog_provenance_sources_chk enforces exactly that split
-- in both directions, and exercise_catalog_discovery_metadata_chk
-- additionally requires the four discovery-taxonomy fields on every
-- forgefitos_original row. Do not normalize the five to one
-- provenance value; the postconditions assert the split per entry.
--
-- TWO EXTERNAL ROWS, TWO DISTINCT SOURCE URLS (Correction 1): 132 and
-- 133 are both external_source_derived and their source_url values
-- MUST DIFFER. An earlier ruling bound both to one URL; disposable
-- execution proved that impossible, because
-- exercise_catalog_source_url_version_unique_idx (migration 023) is a
-- NON-PARTIAL unique index on (source_url, catalog_version) and
-- load_catalog_snapshot's INSERT omits catalog_version, so every new
-- snapshot is born at the DEFAULT of 1. 133 therefore binds to the
-- second real external evidence record already committed in
-- docs/exlib1c0a-equipment-resolution.jsonl (resolution
-- exlib1c0a-eq-02, independent_evidence). No provenance was changed to
-- satisfy the index, and the index is NOT relaxed, dropped or
-- partialized by this package or by any migration. A negative control
-- in scripts/verify-weight-time-w14-live.sh restores the shared URL
-- and proves this package fails closed on that index, leaving zero
-- partial W14 state.
--
-- NON-EMPTY BASELINE, MEASURED AS DELTAS (a deliberate deviation from
-- the EXLIB-2K precedent, disclosed for review): 2K could demand a
-- completely EMPTY catalog surface, because it was the first load. W14
-- cannot. The hosted catalog is already non-empty, and its exact
-- current row vector is not something the preparer of this package
-- has - or is permitted to obtain. So instead of pinning absolute
-- counts, this package captures the pre-state INSIDE the transaction
-- and asserts EXACT DELTAS. That is strictly stronger about
-- non-interference than an absolute vector would be: it proves this
-- transaction added exactly five identities, five snapshots, five
-- anatomy rows, five canonical name claims and NOTHING else, whatever
-- the baseline happened to be. It also holds two whole-surface md5
-- digests - the catalog surface OUTSIDE the five identities, and the
-- content/review surface - and requires both to be byte-identical
-- before and after.
--   The transaction runs at REPEATABLE READ so that "pre" and "post"
--   are the same MVCC snapshot plus this transaction's own effects.
--   Without it, a concurrent commit by an unrelated writer could shift
--   a delta and either mask an error or abort a correct run. System
--   catalogs are read with a fresh snapshot regardless, so the
--   authority-posture gates below still see current reality.
--
-- ONE-USE / RERUN BEHAVIOR: the preflight refuses, before any write,
-- in four distinct classes, each with its own message:
--   W14-PRE-STRUCT   a structural prerequisite is missing (loader
--                    functions, loader role, 028's tracking_mode
--                    literal, 025's equipment literals, 027's
--                    provenance/discovery constraints)
--   W14-PRE-TARGET   one of the five logical identities already exists
--   W14-PRE-SNAPSHOT a snapshot already exists for one of the five
--   W14-PRE-NAME     the canonical name, or its normalized claim, is
--                    already claimed by any identity
-- A SECOND EXECUTION THEREFORE FAILS CLOSED at W14-PRE-TARGET and is
-- NOT a normal success. The package is deliberately not made
-- "idempotent" by silently accepting a pre-existing target: an
-- unexpected target is an error, not a no-op, because it could equally
-- be someone else's identity, a partial state, or a different payload.
-- After ONE successful COMMIT this package is SPENT.
--   If a future execution's transport or result is ambiguous - a
--   dropped connection, an unreadable error, a timeout - READ STATE
--   FIRST and never blindly re-run. The five identities either exist
--   with the five governed payloads, or they do not exist at all;
--   there is no partial outcome to repair.
--
-- HOSTED AUTHORITY POSTURE: on hosted, current_user = session_user =
-- postgres; postgres is NOT a superuser; and migration 027's CREATE
-- ROLE left postgres the implicit creator membership in
-- exlib_catalog_loader - grantor supabase_admin, ADMIN TRUE, INHERIT
-- FALSE, SET FALSE. SET ROLE requires the SET option, so this package
-- uses the same TRANSACTION-CONTAINED elevation the 2K package
-- established: prove the exact baseline posture before any write,
-- grant WITH SET TRUE / INHERIT FALSE, prove the resulting two-grantor
-- shape BEFORE SET ROLE, load, RESET ROLE, REVOKE ... GRANTED BY
-- postgres, then postcondition-prove the baseline row - grantor
-- included - is exactly what remains. Role membership changes are
-- transactional, so a failure anywhere rolls back both the data and
-- the authority change. No standing privilege is widened by success or
-- by failure.
--
-- ATOMICITY: ONE explicit transaction encloses every statement. Any
-- preflight refusal, loader exception, constraint violation, or
-- postcondition mismatch - including the LAST postcondition in the
-- file - rolls back the WHOLE package, leaving no identity, no
-- snapshot, no anatomy row and no name claim behind.
-- ============================================================

BEGIN;

-- ── Snapshot discipline (see NON-EMPTY BASELINE above) ────────────
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;

-- ── Fresh-state gate serialization ───────────────────────────────
-- Two concurrent executions must never both observe an absent target
-- and both proceed. Before the pre-state read, the transaction takes
-- SHARE ROW EXCLUSIVE locks on every catalog table the delta vector
-- covers, in ONE statement, in ONE documented order: ALPHABETICAL by
-- table name. SHARE ROW EXCLUSIVE conflicts with itself and with ROW
-- EXCLUSIVE, so any concurrent execution of this package - or any
-- unrelated direct catalog writer - blocks here until this
-- transaction ends, while ordinary reads stay unblocked. These are
-- REAL table locks, not advisory ones, so non-cooperating writers are
-- bound too. A queued second execution proceeds only after this one
-- commits, and then fails closed at W14-PRE-TARGET.
--   The two TENANT tables (exercises, exercise_aliases) are
--   DELIBERATELY NOT LOCKED. This package writes nothing to them, and
--   locking a live user-facing table would block ordinary workout
--   writes for the duration of the transaction. Their zero-delta
--   proof does not need a lock: under REPEATABLE READ the pre and
--   post reads share one snapshot, so the measured delta is this
--   transaction's own effect and nothing else.
LOCK TABLE
  public.exercise_catalog,
  public.exercise_catalog_aliases,
  public.exercise_catalog_content,
  public.exercise_catalog_content_expected_relationships,
  public.exercise_catalog_corrections,
  public.exercise_catalog_import_runs,
  public.exercise_catalog_logical,
  public.exercise_catalog_muscles,
  public.exercise_catalog_name_claims,
  public.exercise_catalog_relationships,
  public.exercise_catalog_review_events,
  public.exercise_catalog_run_items
  IN SHARE ROW EXCLUSIVE MODE;

-- ── Pre-state capture (dropped at COMMIT; never persists) ────────
CREATE TEMP TABLE w14_txn_pre (
  n_logical BIGINT NOT NULL,
  n_catalog BIGINT NOT NULL,
  n_muscles BIGINT NOT NULL,
  n_aliases BIGINT NOT NULL,
  n_claims BIGINT NOT NULL,
  n_content BIGINT NOT NULL,
  n_expected BIGINT NOT NULL,
  n_relationship BIGINT NOT NULL,
  n_runs BIGINT NOT NULL,
  n_runitems BIGINT NOT NULL,
  n_reviewev BIGINT NOT NULL,
  n_correct BIGINT NOT NULL,
  n_tenant_ex BIGINT NOT NULL,
  n_tenant_alias BIGINT NOT NULL,
  d_surface TEXT NOT NULL,
  d_content TEXT NOT NULL,
  d_tenant  TEXT NOT NULL
) ON COMMIT DROP;

INSERT INTO w14_txn_pre
  SELECT
    (SELECT count(*) FROM public.exercise_catalog_logical),
    (SELECT count(*) FROM public.exercise_catalog),
    (SELECT count(*) FROM public.exercise_catalog_muscles),
    (SELECT count(*) FROM public.exercise_catalog_aliases),
    (SELECT count(*) FROM public.exercise_catalog_name_claims),
    (SELECT count(*) FROM public.exercise_catalog_content),
    (SELECT count(*) FROM public.exercise_catalog_content_expected_relationships),
    (SELECT count(*) FROM public.exercise_catalog_relationships),
    (SELECT count(*) FROM public.exercise_catalog_import_runs),
    (SELECT count(*) FROM public.exercise_catalog_run_items),
    (SELECT count(*) FROM public.exercise_catalog_review_events),
    (SELECT count(*) FROM public.exercise_catalog_corrections),
    (SELECT count(*) FROM public.exercises),
    (SELECT count(*) FROM public.exercise_aliases),
    md5(
      (SELECT coalesce(string_agg(s::text, '|' ORDER BY s.id), '-')
         FROM public.exercise_catalog s
        WHERE s.logical_id NOT IN ('e21b2c00-0000-4000-a000-000000000004', 'e21b2c00-0000-4000-a000-000000000005', 'e21b2c00-0000-4000-a000-000000000006', 'e21b2c00-0000-4000-a000-000000000007', 'e21b2c00-0000-4000-a000-000000000008'))
   || (SELECT coalesce(string_agg(m::text, '|' ORDER BY m.catalog_id, m.muscle), '-')
         FROM public.exercise_catalog_muscles m
        WHERE NOT EXISTS (SELECT 1 FROM public.exercise_catalog s
                           WHERE s.id = m.catalog_id
                             AND s.logical_id IN ('e21b2c00-0000-4000-a000-000000000004', 'e21b2c00-0000-4000-a000-000000000005', 'e21b2c00-0000-4000-a000-000000000006', 'e21b2c00-0000-4000-a000-000000000007', 'e21b2c00-0000-4000-a000-000000000008')))
   || (SELECT coalesce(string_agg(a::text, '|' ORDER BY a.logical_id, a.alias), '-')
         FROM public.exercise_catalog_aliases a
        WHERE a.logical_id NOT IN ('e21b2c00-0000-4000-a000-000000000004', 'e21b2c00-0000-4000-a000-000000000005', 'e21b2c00-0000-4000-a000-000000000006', 'e21b2c00-0000-4000-a000-000000000007', 'e21b2c00-0000-4000-a000-000000000008'))
   || (SELECT coalesce(string_agg(n::text, '|' ORDER BY n.normalized_name), '-')
         FROM public.exercise_catalog_name_claims n
        WHERE n.logical_id NOT IN ('e21b2c00-0000-4000-a000-000000000004', 'e21b2c00-0000-4000-a000-000000000005', 'e21b2c00-0000-4000-a000-000000000006', 'e21b2c00-0000-4000-a000-000000000007', 'e21b2c00-0000-4000-a000-000000000008'))
   || (SELECT coalesce(string_agg(l::text, '|' ORDER BY l.id), '-')
         FROM public.exercise_catalog_logical l
        WHERE l.id NOT IN ('e21b2c00-0000-4000-a000-000000000004', 'e21b2c00-0000-4000-a000-000000000005', 'e21b2c00-0000-4000-a000-000000000006', 'e21b2c00-0000-4000-a000-000000000007', 'e21b2c00-0000-4000-a000-000000000008'))),
    md5(
      (SELECT coalesce(string_agg(c::text, '|' ORDER BY c.id), '-')
         FROM public.exercise_catalog_content c)
   || (SELECT coalesce(string_agg(x::text, '|' ORDER BY x.content_id, x.relation, x.to_logical_id), '-')
         FROM public.exercise_catalog_content_expected_relationships x)
   || (SELECT coalesce(string_agg(v::text, '|' ORDER BY v.id), '-')
         FROM public.exercise_catalog_review_events v)),
    md5(
      (SELECT coalesce(string_agg(t::text, '|' ORDER BY t.id), '-')
         FROM public.exercises t)
   || (SELECT coalesce(string_agg(a::text, '|' ORDER BY a.id), '-')
         FROM public.exercise_aliases a));

-- ── Preflight (runs as the invoking operator role, BEFORE the loader
--    role is assumed and BEFORE any authority change) ─────────────
DO $pre$
DECLARE
  v_n BIGINT;
  v_name TEXT;
BEGIN
  -- W14-PRE-STRUCT: the loader boundary must be exactly migration
  -- 027's, by exact signature.
  IF to_regprocedure('public.load_catalog_identity(uuid)') IS NULL
     OR to_regprocedure('public.load_catalog_snapshot(uuid,text,text,text,text,text,text,text,text,text,text,text,text,text,date,text,jsonb,jsonb)') IS NULL THEN
    RAISE EXCEPTION 'W14-PRE-STRUCT: the migration-027 loader functions are missing at their exact signatures; wrong or unmigrated database';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'exlib_catalog_loader') THEN
    RAISE EXCEPTION 'W14-PRE-STRUCT: the exlib_catalog_loader role is missing';
  END IF;
  -- W14-PRE-STRUCT: migration 028 must be applied, or every one of
  -- the five loads would fail on the tracking_mode CHECK. This
  -- OBSERVES the applied literal; it does not create or alter it.
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'exercise_catalog_tracking_mode_check'
       AND conrelid = 'public.exercise_catalog'::regclass
       AND pg_get_constraintdef(oid) LIKE '%''weight_time''%') THEN
    RAISE EXCEPTION 'W14-PRE-STRUCT: exercise_catalog_tracking_mode_check does not admit weight_time; migration 028 is not applied to this database';
  END IF;
  -- W14-PRE-STRUCT: migration 025's equipment vocabulary must admit
  -- both loaded equipment values.
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'exercise_catalog_equipment_check'
       AND conrelid = 'public.exercise_catalog'::regclass
       AND pg_get_constraintdef(oid) LIKE '%''weight_plate''%'
       AND pg_get_constraintdef(oid) LIKE '%''weighted_vest''%') THEN
    RAISE EXCEPTION 'W14-PRE-STRUCT: exercise_catalog_equipment_check does not admit weight_plate and weighted_vest; migration 025 is not applied to this database';
  END IF;
  -- W14-PRE-STRUCT: the unique index that makes two distinct external
  -- source URLs REQUIRED must be present and NON-PARTIAL. Correction 1
  -- depends on it, and a database where it had been relaxed would
  -- silently accept the superseded same-URL binding.
  IF NOT EXISTS (
    SELECT 1 FROM pg_index i
      JOIN pg_class c ON c.oid = i.indexrelid
     WHERE c.relname = 'exercise_catalog_source_url_version_unique_idx'
       AND i.indrelid = 'public.exercise_catalog'::regclass
       AND i.indisunique
       AND i.indpred IS NULL) THEN
    RAISE EXCEPTION 'W14-PRE-STRUCT: exercise_catalog_source_url_version_unique_idx is absent, non-unique or partial; the source-URL uniqueness this package is built around is not in force';
  END IF;
  -- W14-PRE-STRUCT: the two migration-027 constraints that enforce
  -- the mixed-provenance split must both be present. Without them the
  -- five payloads would load unchecked.
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
                  WHERE conname = 'exercise_catalog_provenance_sources_chk'
                    AND conrelid = 'public.exercise_catalog'::regclass)
     OR NOT EXISTS (SELECT 1 FROM pg_constraint
                     WHERE conname = 'exercise_catalog_discovery_metadata_chk'
                       AND conrelid = 'public.exercise_catalog'::regclass)
     OR NOT EXISTS (SELECT 1 FROM pg_constraint
                     WHERE conname = 'exercise_catalog_review_audit_chk'
                       AND conrelid = 'public.exercise_catalog'::regclass) THEN
    RAISE EXCEPTION 'W14-PRE-STRUCT: a required exercise_catalog governance constraint is absent (provenance_sources / discovery_metadata / review_audit)';
  END IF;
  -- The claims invariant must already hold; this package must not be
  -- the transaction that "fixes" or masks a pre-existing violation.
  IF EXISTS (SELECT 1 FROM public.exlib_verify_catalog_claims() v
              WHERE v.orphaned_claims <> 0 OR v.unclaimed_bearers <> 0) THEN
    RAISE EXCEPTION 'W14-PRE-STRUCT: the bidirectional catalog name-claim invariant is already violated at the pre-state; refusing to load into an inconsistent surface';
  END IF;

  -- W14-PRE-TARGET: none of the five logical identities may exist.
  -- This is what makes a second execution fail closed.
  SELECT count(*) INTO v_n FROM public.exercise_catalog_logical l
   WHERE l.id IN (
    'e21b2c00-0000-4000-a000-000000000004',
    'e21b2c00-0000-4000-a000-000000000005',
    'e21b2c00-0000-4000-a000-000000000006',
    'e21b2c00-0000-4000-a000-000000000007',
    'e21b2c00-0000-4000-a000-000000000008');
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'W14-PRE-TARGET: % of the five W14 logical identities already exist. This package is ONE-USE and is SPENT once committed. Do not re-run it: READ STATE FIRST. An unexpected pre-existing target is an error, never a no-op.', v_n;
  END IF;

  -- W14-PRE-SNAPSHOT: no snapshot may already reference one of the
  -- five identities. (Implied by the identity gate under the 023
  -- foreign key, asserted separately so the failure class is legible.)
  IF EXISTS (SELECT 1 FROM public.exercise_catalog s
              WHERE s.logical_id IN (
    'e21b2c00-0000-4000-a000-000000000004',
    'e21b2c00-0000-4000-a000-000000000005',
    'e21b2c00-0000-4000-a000-000000000006',
    'e21b2c00-0000-4000-a000-000000000007',
    'e21b2c00-0000-4000-a000-000000000008')) THEN
    RAISE EXCEPTION 'W14-PRE-SNAPSHOT: a snapshot already exists for one of the five W14 identities';
  END IF;

  -- W14-PRE-NAME: neither the canonical name nor its normalized claim
  -- may be held by ANY identity. A conflicting claim is a governance
  -- collision, not something to load over.
  SELECT c.normalized_name INTO v_name
    FROM public.exercise_catalog_name_claims c
   WHERE c.normalized_name IN (
    'plate-weighted plank',
    'weighted vest plank',
    'weighted dead hang',
    'weighted wall sit',
    'weighted vest wall sit')
   LIMIT 1;
  IF v_name IS NOT NULL THEN
    RAISE EXCEPTION 'W14-PRE-NAME: the normalized name % is already claimed in exercise_catalog_name_claims', v_name;
  END IF;
  SELECT s.canonical_name INTO v_name
    FROM public.exercise_catalog s
   WHERE lower(s.canonical_name) IN (
    'plate-weighted plank',
    'weighted vest plank',
    'weighted dead hang',
    'weighted wall sit',
    'weighted vest wall sit')
   LIMIT 1;
  IF v_name IS NOT NULL THEN
    RAISE EXCEPTION 'W14-PRE-NAME: the canonical name % is already borne by an existing snapshot', v_name;
  END IF;
END
$pre$;

-- ── Transaction-contained elevation, posture-gated ───────────────
DO $posture$
BEGIN
  IF current_user <> 'postgres' OR session_user <> 'postgres' THEN
    RAISE EXCEPTION 'W14-PRE-STRUCT: BOTH execution identities must be the hosted operator role postgres (got current_user=%, session_user=%); refusing before any write or authority change', current_user, session_user;
  END IF;
  IF (SELECT rolsuper FROM pg_roles WHERE rolname = current_user) THEN
    RAISE EXCEPTION 'W14-PRE-STRUCT: the invoker is a superuser; this package is bound to the hosted non-superuser postgres posture';
  END IF;
  IF (SELECT count(*) FROM pg_catalog.pg_auth_members am
        JOIN pg_roles r ON r.oid = am.roleid
       WHERE r.rolname = 'exlib_catalog_loader') <> 1
     OR NOT EXISTS (
       SELECT 1 FROM pg_catalog.pg_auth_members am
         JOIN pg_roles r ON r.oid = am.roleid
         JOIN pg_roles m ON m.oid = am.member
         JOIN pg_roles g ON g.oid = am.grantor
        WHERE r.rolname = 'exlib_catalog_loader' AND m.rolname = 'postgres'
          AND g.rolname = 'supabase_admin'
          AND am.admin_option AND NOT am.inherit_option AND NOT am.set_option) THEN
    RAISE EXCEPTION 'W14-PRE-STRUCT: the loader-role membership posture is not the exact hosted baseline (exactly one membership: postgres granted BY supabase_admin with ADMIN TRUE, INHERIT FALSE, SET FALSE - grantor included); refusing before any write or authority change';
  END IF;
END
$posture$;

GRANT exlib_catalog_loader TO postgres WITH SET TRUE, INHERIT FALSE;

-- ── Structural two-grantor proof, BEFORE SET ROLE or any loader
--    call: exactly two membership rows must now exist - the untouched
--    supabase_admin-granted baseline plus the postgres-granted
--    temporary SET row. Grantor keys make them DISTINCT rows, which
--    is precisely why the grantor-scoped REVOKE below can remove only
--    the temporary one. ─────────────────────────────────────────────
DO $auth$
BEGIN
  IF (SELECT count(*) FROM pg_catalog.pg_auth_members am
        JOIN pg_roles r ON r.oid = am.roleid
       WHERE r.rolname = 'exlib_catalog_loader') <> 2
     OR NOT EXISTS (
       SELECT 1 FROM pg_catalog.pg_auth_members am
         JOIN pg_roles r ON r.oid = am.roleid
         JOIN pg_roles m ON m.oid = am.member
         JOIN pg_roles g ON g.oid = am.grantor
        WHERE r.rolname = 'exlib_catalog_loader' AND m.rolname = 'postgres'
          AND g.rolname = 'supabase_admin'
          AND am.admin_option AND NOT am.inherit_option AND NOT am.set_option)
     OR NOT EXISTS (
       SELECT 1 FROM pg_catalog.pg_auth_members am
         JOIN pg_roles r ON r.oid = am.roleid
         JOIN pg_roles m ON m.oid = am.member
         JOIN pg_roles g ON g.oid = am.grantor
        WHERE r.rolname = 'exlib_catalog_loader' AND m.rolname = 'postgres'
          AND g.rolname = 'postgres'
          AND NOT am.admin_option AND NOT am.inherit_option AND am.set_option) THEN
    RAISE EXCEPTION 'W14-AUTH: the two-grantor membership shape after the temporary grant is not exact (supabase_admin-granted baseline plus postgres-granted SET row); aborting before SET ROLE and before any loader call';
  END IF;
END
$auth$;

-- ── The load, under the loader authority ONLY ────────────────────
SET ROLE exlib_catalog_loader;

-- 5 identities, in manifest order. Explicit UUIDs, never
-- gen_random_uuid(): load_catalog_identity's p_id parameter exists
-- exactly so the identity is reviewable before the act.
SELECT public.load_catalog_identity('e21b2c00-0000-4000-a000-000000000004');
SELECT public.load_catalog_identity('e21b2c00-0000-4000-a000-000000000005');
SELECT public.load_catalog_identity('e21b2c00-0000-4000-a000-000000000006');
SELECT public.load_catalog_identity('e21b2c00-0000-4000-a000-000000000007');
SELECT public.load_catalog_identity('e21b2c00-0000-4000-a000-000000000008');

-- 5 canonical snapshots, in manifest order 132, 133, 137, 138, 139.
-- inventory line 132 — Plate-weighted plank
--   payload fingerprint f1f2843950c1426c5b5b615b50ec97d168e632b7e1c8946f98f5178efd5e1216
SELECT public.load_catalog_snapshot(
  'e21b2c00-0000-4000-a000-000000000004',
  $nm132$Plate-weighted plank$nm132$,
  $cat132$isolation$cat132$,
  $pm132$abs$pm132$,
  $eq132$weight_plate$eq132$,
  $lat132$bilateral$lat132$,
  $tm132$weight_time$tm132$,
  $prov132$external_source_derived$prov132$,
  $mp132$core_anti_extension$mp132$,
  $tr132$core$tr132$,
  $dif132$intermediate$dif132$,
  $av132$home_gym$av132$,
  $su132$https://www.strengthlog.com/weighted-plank/$su132$,
  $sp132$https://www.strengthlog.com/exercise-directory/$sp132$,
  $ra132$2026-08-20$ra132$::date,
  $ic132$human_review_required$ic132$,
  $anat132$[{"muscle": "obliques", "role": "secondary"}]$anat132$::jsonb,
  $alia132$[]$alia132$::jsonb);

-- inventory line 133 — Weighted vest plank
--   payload fingerprint 42f26ff9b4265544bcde194ea1e77c38652abf1b4b0bbee7055e0911fc53fa1e
SELECT public.load_catalog_snapshot(
  'e21b2c00-0000-4000-a000-000000000005',
  $nm133$Weighted vest plank$nm133$,
  $cat133$isolation$cat133$,
  $pm133$abs$pm133$,
  $eq133$weighted_vest$eq133$,
  $lat133$bilateral$lat133$,
  $tm133$weight_time$tm133$,
  $prov133$external_source_derived$prov133$,
  $mp133$core_anti_extension$mp133$,
  $tr133$core$tr133$,
  $dif133$intermediate$dif133$,
  $av133$home_gym$av133$,
  $su133$https://marathonhandbook.com/weighted-plank/$su133$,
  $sp133$https://marathonhandbook.com/weighted-plank/$sp133$,
  $ra133$2026-08-24$ra133$::date,
  $ic133$human_review_required$ic133$,
  $anat133$[{"muscle": "obliques", "role": "secondary"}]$anat133$::jsonb,
  $alia133$[]$alia133$::jsonb);

-- inventory line 137 — Weighted dead hang
--   payload fingerprint ed584b1c2a8b224f2367642d8d32e67ee26214abac7e380dabba384a3de9922e
SELECT public.load_catalog_snapshot(
  'e21b2c00-0000-4000-a000-000000000006',
  $nm137$Weighted dead hang$nm137$,
  $cat137$isolation$cat137$,
  $pm137$forearms$pm137$,
  $eq137$weight_plate$eq137$,
  $lat137$bilateral$lat137$,
  $tm137$weight_time$tm137$,
  $prov137$forgefitos_original$prov137$,
  $mp137$grip_forearm$mp137$,
  $tr137$accessory$tr137$,
  $dif137$intermediate$dif137$,
  $av137$home_gym$av137$,
  NULL, NULL, NULL, NULL,   -- forgefitos_original: all four discovery-source fields NULL,
                            -- as exercise_catalog_provenance_sources_chk requires
  $anat137$[{"muscle": "lats", "role": "secondary"}]$anat137$::jsonb,
  $alia137$[]$alia137$::jsonb);

-- inventory line 138 — Weighted wall sit
--   payload fingerprint b17b5b6be91df93a4aa17c18aa8384bd61515e4e9f43072d0d41d7c3af10db1e
SELECT public.load_catalog_snapshot(
  'e21b2c00-0000-4000-a000-000000000007',
  $nm138$Weighted wall sit$nm138$,
  $cat138$compound$cat138$,
  $pm138$quads$pm138$,
  $eq138$weight_plate$eq138$,
  $lat138$bilateral$lat138$,
  $tm138$weight_time$tm138$,
  $prov138$forgefitos_original$prov138$,
  $mp138$squat$mp138$,
  $tr138$accessory$tr138$,
  $dif138$beginner$dif138$,
  $av138$minimal$av138$,
  NULL, NULL, NULL, NULL,   -- forgefitos_original: all four discovery-source fields NULL,
                            -- as exercise_catalog_provenance_sources_chk requires
  $anat138$[{"muscle": "glutes", "role": "secondary"}]$anat138$::jsonb,
  $alia138$[]$alia138$::jsonb);

-- inventory line 139 — Weighted vest wall sit
--   payload fingerprint 0366906db6e0399a2993b2c34841fe025293cbc166ea8f90e24b20bc77034d00
SELECT public.load_catalog_snapshot(
  'e21b2c00-0000-4000-a000-000000000008',
  $nm139$Weighted vest wall sit$nm139$,
  $cat139$compound$cat139$,
  $pm139$quads$pm139$,
  $eq139$weighted_vest$eq139$,
  $lat139$bilateral$lat139$,
  $tm139$weight_time$tm139$,
  $prov139$forgefitos_original$prov139$,
  $mp139$squat$mp139$,
  $tr139$accessory$tr139$,
  $dif139$beginner$dif139$,
  $av139$home_gym$av139$,
  NULL, NULL, NULL, NULL,   -- forgefitos_original: all four discovery-source fields NULL,
                            -- as exercise_catalog_provenance_sources_chk requires
  $anat139$[{"muscle": "glutes", "role": "secondary"}]$anat139$::jsonb,
  $alia139$[]$alia139$::jsonb);

RESET ROLE;

-- ── Exact restoration: remove ONLY the temporary grant this package
--    created, identified by its grantor. The implicit migration-027
--    creator membership (a different grantor) is untouched. ────────
REVOKE exlib_catalog_loader FROM postgres GRANTED BY postgres;

-- ── Postconditions (owner reads; ANY mismatch rolls back ALL) ────
DO $post$
BEGIN
  -- (1) EXACT DELTAS across every catalog table and both tenant
  --     tables. Five identities, five snapshots, five anatomy rows,
  --     five canonical name claims - and zero of everything else.
  --     Zero aliases is a governed value, not an omission: the
  --     operator ruled aliases [] for all five, and an unsupported
  --     name claim is worse than no alias claim.
  IF (SELECT count(*) FROM public.exercise_catalog_logical) - (SELECT p.n_logical FROM w14_txn_pre p) <> 5 THEN
    RAISE EXCEPTION 'w14 post: the exercise_catalog_logical row delta is not exactly 5 (pre %, post %)',
      (SELECT p.n_logical FROM w14_txn_pre p), (SELECT count(*) FROM public.exercise_catalog_logical);
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog) - (SELECT p.n_catalog FROM w14_txn_pre p) <> 5 THEN
    RAISE EXCEPTION 'w14 post: the exercise_catalog row delta is not exactly 5 (pre %, post %)',
      (SELECT p.n_catalog FROM w14_txn_pre p), (SELECT count(*) FROM public.exercise_catalog);
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_muscles) - (SELECT p.n_muscles FROM w14_txn_pre p) <> 5 THEN
    RAISE EXCEPTION 'w14 post: the exercise_catalog_muscles row delta is not exactly 5 (pre %, post %)',
      (SELECT p.n_muscles FROM w14_txn_pre p), (SELECT count(*) FROM public.exercise_catalog_muscles);
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_aliases) - (SELECT p.n_aliases FROM w14_txn_pre p) <> 0 THEN
    RAISE EXCEPTION 'w14 post: the exercise_catalog_aliases row delta is not exactly 0 (pre %, post %)',
      (SELECT p.n_aliases FROM w14_txn_pre p), (SELECT count(*) FROM public.exercise_catalog_aliases);
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_name_claims) - (SELECT p.n_claims FROM w14_txn_pre p) <> 5 THEN
    RAISE EXCEPTION 'w14 post: the exercise_catalog_name_claims row delta is not exactly 5 (pre %, post %)',
      (SELECT p.n_claims FROM w14_txn_pre p), (SELECT count(*) FROM public.exercise_catalog_name_claims);
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_content) - (SELECT p.n_content FROM w14_txn_pre p) <> 0 THEN
    RAISE EXCEPTION 'w14 post: the exercise_catalog_content row delta is not exactly 0 (pre %, post %)',
      (SELECT p.n_content FROM w14_txn_pre p), (SELECT count(*) FROM public.exercise_catalog_content);
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_content_expected_relationships) - (SELECT p.n_expected FROM w14_txn_pre p) <> 0 THEN
    RAISE EXCEPTION 'w14 post: the exercise_catalog_content_expected_relationships row delta is not exactly 0 (pre %, post %)',
      (SELECT p.n_expected FROM w14_txn_pre p), (SELECT count(*) FROM public.exercise_catalog_content_expected_relationships);
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_relationships) - (SELECT p.n_relationship FROM w14_txn_pre p) <> 0 THEN
    RAISE EXCEPTION 'w14 post: the exercise_catalog_relationships row delta is not exactly 0 (pre %, post %)',
      (SELECT p.n_relationship FROM w14_txn_pre p), (SELECT count(*) FROM public.exercise_catalog_relationships);
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_import_runs) - (SELECT p.n_runs FROM w14_txn_pre p) <> 0 THEN
    RAISE EXCEPTION 'w14 post: the exercise_catalog_import_runs row delta is not exactly 0 (pre %, post %)',
      (SELECT p.n_runs FROM w14_txn_pre p), (SELECT count(*) FROM public.exercise_catalog_import_runs);
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_run_items) - (SELECT p.n_runitems FROM w14_txn_pre p) <> 0 THEN
    RAISE EXCEPTION 'w14 post: the exercise_catalog_run_items row delta is not exactly 0 (pre %, post %)',
      (SELECT p.n_runitems FROM w14_txn_pre p), (SELECT count(*) FROM public.exercise_catalog_run_items);
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_review_events) - (SELECT p.n_reviewev FROM w14_txn_pre p) <> 0 THEN
    RAISE EXCEPTION 'w14 post: the exercise_catalog_review_events row delta is not exactly 0 (pre %, post %)',
      (SELECT p.n_reviewev FROM w14_txn_pre p), (SELECT count(*) FROM public.exercise_catalog_review_events);
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_corrections) - (SELECT p.n_correct FROM w14_txn_pre p) <> 0 THEN
    RAISE EXCEPTION 'w14 post: the exercise_catalog_corrections row delta is not exactly 0 (pre %, post %)',
      (SELECT p.n_correct FROM w14_txn_pre p), (SELECT count(*) FROM public.exercise_catalog_corrections);
  END IF;
  IF (SELECT count(*) FROM public.exercises) - (SELECT p.n_tenant_ex FROM w14_txn_pre p) <> 0 THEN
    RAISE EXCEPTION 'w14 post: the exercises row delta is not exactly 0 (pre %, post %)',
      (SELECT p.n_tenant_ex FROM w14_txn_pre p), (SELECT count(*) FROM public.exercises);
  END IF;
  IF (SELECT count(*) FROM public.exercise_aliases) - (SELECT p.n_tenant_alias FROM w14_txn_pre p) <> 0 THEN
    RAISE EXCEPTION 'w14 post: the exercise_aliases row delta is not exactly 0 (pre %, post %)',
      (SELECT p.n_tenant_alias FROM w14_txn_pre p), (SELECT count(*) FROM public.exercise_aliases);
  END IF;

  -- ── inventory line 132 — Plate-weighted plank ──────────────────
  IF NOT EXISTS (
    SELECT 1 FROM public.exercise_catalog s
     WHERE s.logical_id = 'e21b2c00-0000-4000-a000-000000000004'
       AND s.canonical_name = $nm2132$Plate-weighted plank$nm2132$
       AND s.category = $cat2132$isolation$cat2132$
       AND s.primary_muscle = $pm2132$abs$pm2132$
       AND s.equipment = $eq2132$weight_plate$eq2132$
       AND s.laterality = $lat2132$bilateral$lat2132$
       AND s.tracking_mode = $tm2132$weight_time$tm2132$
       AND s.provenance = $prov2132$external_source_derived$prov2132$
       AND s.movement_pattern = $mp2132$core_anti_extension$mp2132$
       AND s.training_role = $tr2132$core$tr2132$
       AND s.difficulty = $dif2132$intermediate$dif2132$
       AND s.availability = $av2132$home_gym$av2132$
       AND s.source_url = $su2132$https://www.strengthlog.com/weighted-plank/$su2132$
       AND s.source_page = $sp2132$https://www.strengthlog.com/exercise-directory/$sp2132$
       AND s.retrieved_at = $ra2132$2026-08-20$ra2132$::date
       AND s.import_confidence = $ic2132$human_review_required$ic2132$
       AND s.review_status = 'pending'
       AND s.reviewed_by IS NULL AND s.reviewed_at IS NULL
       AND s.review_rationale IS NULL
       AND s.catalog_version = 1 AND s.is_active) THEN
    RAISE EXCEPTION 'w14 post: inventory line 132 (Plate-weighted plank) did not land with the exact governed payload (fingerprint f1f2843950c1426c5b5b615b50ec97d168e632b7e1c8946f98f5178efd5e1216)';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog s
       WHERE s.logical_id = 'e21b2c00-0000-4000-a000-000000000004') <> 1 THEN
    RAISE EXCEPTION 'w14 post: inventory line 132 does not bear EXACTLY ONE snapshot';
  END IF;
  IF (SELECT coalesce(string_agg(m.muscle || ':' || m.role, ',' ORDER BY m.muscle), '<none>')
        FROM public.exercise_catalog_muscles m
        JOIN public.exercise_catalog s ON s.id = m.catalog_id
       WHERE s.logical_id = 'e21b2c00-0000-4000-a000-000000000004') <> $an2132$obliques:secondary$an2132$ THEN
    RAISE EXCEPTION 'w14 post: inventory line 132 anatomy is not exactly obliques:secondary';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.exercise_catalog_name_claims c
     WHERE c.normalized_name = $nn2132$plate-weighted plank$nn2132$
       AND c.claim_source = 'canonical'
       AND c.logical_id = 'e21b2c00-0000-4000-a000-000000000004') THEN
    RAISE EXCEPTION 'w14 post: the canonical name claim "plate-weighted plank" is missing or owned by the wrong identity';
  END IF;

  -- ── inventory line 133 — Weighted vest plank ──────────────────
  IF NOT EXISTS (
    SELECT 1 FROM public.exercise_catalog s
     WHERE s.logical_id = 'e21b2c00-0000-4000-a000-000000000005'
       AND s.canonical_name = $nm2133$Weighted vest plank$nm2133$
       AND s.category = $cat2133$isolation$cat2133$
       AND s.primary_muscle = $pm2133$abs$pm2133$
       AND s.equipment = $eq2133$weighted_vest$eq2133$
       AND s.laterality = $lat2133$bilateral$lat2133$
       AND s.tracking_mode = $tm2133$weight_time$tm2133$
       AND s.provenance = $prov2133$external_source_derived$prov2133$
       AND s.movement_pattern = $mp2133$core_anti_extension$mp2133$
       AND s.training_role = $tr2133$core$tr2133$
       AND s.difficulty = $dif2133$intermediate$dif2133$
       AND s.availability = $av2133$home_gym$av2133$
       AND s.source_url = $su2133$https://marathonhandbook.com/weighted-plank/$su2133$
       AND s.source_page = $sp2133$https://marathonhandbook.com/weighted-plank/$sp2133$
       AND s.retrieved_at = $ra2133$2026-08-24$ra2133$::date
       AND s.import_confidence = $ic2133$human_review_required$ic2133$
       AND s.review_status = 'pending'
       AND s.reviewed_by IS NULL AND s.reviewed_at IS NULL
       AND s.review_rationale IS NULL
       AND s.catalog_version = 1 AND s.is_active) THEN
    RAISE EXCEPTION 'w14 post: inventory line 133 (Weighted vest plank) did not land with the exact governed payload (fingerprint 42f26ff9b4265544bcde194ea1e77c38652abf1b4b0bbee7055e0911fc53fa1e)';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog s
       WHERE s.logical_id = 'e21b2c00-0000-4000-a000-000000000005') <> 1 THEN
    RAISE EXCEPTION 'w14 post: inventory line 133 does not bear EXACTLY ONE snapshot';
  END IF;
  IF (SELECT coalesce(string_agg(m.muscle || ':' || m.role, ',' ORDER BY m.muscle), '<none>')
        FROM public.exercise_catalog_muscles m
        JOIN public.exercise_catalog s ON s.id = m.catalog_id
       WHERE s.logical_id = 'e21b2c00-0000-4000-a000-000000000005') <> $an2133$obliques:secondary$an2133$ THEN
    RAISE EXCEPTION 'w14 post: inventory line 133 anatomy is not exactly obliques:secondary';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.exercise_catalog_name_claims c
     WHERE c.normalized_name = $nn2133$weighted vest plank$nn2133$
       AND c.claim_source = 'canonical'
       AND c.logical_id = 'e21b2c00-0000-4000-a000-000000000005') THEN
    RAISE EXCEPTION 'w14 post: the canonical name claim "weighted vest plank" is missing or owned by the wrong identity';
  END IF;

  -- ── inventory line 137 — Weighted dead hang ──────────────────
  IF NOT EXISTS (
    SELECT 1 FROM public.exercise_catalog s
     WHERE s.logical_id = 'e21b2c00-0000-4000-a000-000000000006'
       AND s.canonical_name = $nm2137$Weighted dead hang$nm2137$
       AND s.category = $cat2137$isolation$cat2137$
       AND s.primary_muscle = $pm2137$forearms$pm2137$
       AND s.equipment = $eq2137$weight_plate$eq2137$
       AND s.laterality = $lat2137$bilateral$lat2137$
       AND s.tracking_mode = $tm2137$weight_time$tm2137$
       AND s.provenance = $prov2137$forgefitos_original$prov2137$
       AND s.movement_pattern = $mp2137$grip_forearm$mp2137$
       AND s.training_role = $tr2137$accessory$tr2137$
       AND s.difficulty = $dif2137$intermediate$dif2137$
       AND s.availability = $av2137$home_gym$av2137$
       AND s.source_url IS NULL AND s.source_page IS NULL
       AND s.retrieved_at IS NULL AND s.import_confidence IS NULL
       AND s.review_status = 'pending'
       AND s.reviewed_by IS NULL AND s.reviewed_at IS NULL
       AND s.review_rationale IS NULL
       AND s.catalog_version = 1 AND s.is_active) THEN
    RAISE EXCEPTION 'w14 post: inventory line 137 (Weighted dead hang) did not land with the exact governed payload (fingerprint ed584b1c2a8b224f2367642d8d32e67ee26214abac7e380dabba384a3de9922e)';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog s
       WHERE s.logical_id = 'e21b2c00-0000-4000-a000-000000000006') <> 1 THEN
    RAISE EXCEPTION 'w14 post: inventory line 137 does not bear EXACTLY ONE snapshot';
  END IF;
  IF (SELECT coalesce(string_agg(m.muscle || ':' || m.role, ',' ORDER BY m.muscle), '<none>')
        FROM public.exercise_catalog_muscles m
        JOIN public.exercise_catalog s ON s.id = m.catalog_id
       WHERE s.logical_id = 'e21b2c00-0000-4000-a000-000000000006') <> $an2137$lats:secondary$an2137$ THEN
    RAISE EXCEPTION 'w14 post: inventory line 137 anatomy is not exactly lats:secondary';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.exercise_catalog_name_claims c
     WHERE c.normalized_name = $nn2137$weighted dead hang$nn2137$
       AND c.claim_source = 'canonical'
       AND c.logical_id = 'e21b2c00-0000-4000-a000-000000000006') THEN
    RAISE EXCEPTION 'w14 post: the canonical name claim "weighted dead hang" is missing or owned by the wrong identity';
  END IF;

  -- ── inventory line 138 — Weighted wall sit ──────────────────
  IF NOT EXISTS (
    SELECT 1 FROM public.exercise_catalog s
     WHERE s.logical_id = 'e21b2c00-0000-4000-a000-000000000007'
       AND s.canonical_name = $nm2138$Weighted wall sit$nm2138$
       AND s.category = $cat2138$compound$cat2138$
       AND s.primary_muscle = $pm2138$quads$pm2138$
       AND s.equipment = $eq2138$weight_plate$eq2138$
       AND s.laterality = $lat2138$bilateral$lat2138$
       AND s.tracking_mode = $tm2138$weight_time$tm2138$
       AND s.provenance = $prov2138$forgefitos_original$prov2138$
       AND s.movement_pattern = $mp2138$squat$mp2138$
       AND s.training_role = $tr2138$accessory$tr2138$
       AND s.difficulty = $dif2138$beginner$dif2138$
       AND s.availability = $av2138$minimal$av2138$
       AND s.source_url IS NULL AND s.source_page IS NULL
       AND s.retrieved_at IS NULL AND s.import_confidence IS NULL
       AND s.review_status = 'pending'
       AND s.reviewed_by IS NULL AND s.reviewed_at IS NULL
       AND s.review_rationale IS NULL
       AND s.catalog_version = 1 AND s.is_active) THEN
    RAISE EXCEPTION 'w14 post: inventory line 138 (Weighted wall sit) did not land with the exact governed payload (fingerprint b17b5b6be91df93a4aa17c18aa8384bd61515e4e9f43072d0d41d7c3af10db1e)';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog s
       WHERE s.logical_id = 'e21b2c00-0000-4000-a000-000000000007') <> 1 THEN
    RAISE EXCEPTION 'w14 post: inventory line 138 does not bear EXACTLY ONE snapshot';
  END IF;
  IF (SELECT coalesce(string_agg(m.muscle || ':' || m.role, ',' ORDER BY m.muscle), '<none>')
        FROM public.exercise_catalog_muscles m
        JOIN public.exercise_catalog s ON s.id = m.catalog_id
       WHERE s.logical_id = 'e21b2c00-0000-4000-a000-000000000007') <> $an2138$glutes:secondary$an2138$ THEN
    RAISE EXCEPTION 'w14 post: inventory line 138 anatomy is not exactly glutes:secondary';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.exercise_catalog_name_claims c
     WHERE c.normalized_name = $nn2138$weighted wall sit$nn2138$
       AND c.claim_source = 'canonical'
       AND c.logical_id = 'e21b2c00-0000-4000-a000-000000000007') THEN
    RAISE EXCEPTION 'w14 post: the canonical name claim "weighted wall sit" is missing or owned by the wrong identity';
  END IF;

  -- ── inventory line 139 — Weighted vest wall sit ──────────────────
  IF NOT EXISTS (
    SELECT 1 FROM public.exercise_catalog s
     WHERE s.logical_id = 'e21b2c00-0000-4000-a000-000000000008'
       AND s.canonical_name = $nm2139$Weighted vest wall sit$nm2139$
       AND s.category = $cat2139$compound$cat2139$
       AND s.primary_muscle = $pm2139$quads$pm2139$
       AND s.equipment = $eq2139$weighted_vest$eq2139$
       AND s.laterality = $lat2139$bilateral$lat2139$
       AND s.tracking_mode = $tm2139$weight_time$tm2139$
       AND s.provenance = $prov2139$forgefitos_original$prov2139$
       AND s.movement_pattern = $mp2139$squat$mp2139$
       AND s.training_role = $tr2139$accessory$tr2139$
       AND s.difficulty = $dif2139$beginner$dif2139$
       AND s.availability = $av2139$home_gym$av2139$
       AND s.source_url IS NULL AND s.source_page IS NULL
       AND s.retrieved_at IS NULL AND s.import_confidence IS NULL
       AND s.review_status = 'pending'
       AND s.reviewed_by IS NULL AND s.reviewed_at IS NULL
       AND s.review_rationale IS NULL
       AND s.catalog_version = 1 AND s.is_active) THEN
    RAISE EXCEPTION 'w14 post: inventory line 139 (Weighted vest wall sit) did not land with the exact governed payload (fingerprint 0366906db6e0399a2993b2c34841fe025293cbc166ea8f90e24b20bc77034d00)';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog s
       WHERE s.logical_id = 'e21b2c00-0000-4000-a000-000000000008') <> 1 THEN
    RAISE EXCEPTION 'w14 post: inventory line 139 does not bear EXACTLY ONE snapshot';
  END IF;
  IF (SELECT coalesce(string_agg(m.muscle || ':' || m.role, ',' ORDER BY m.muscle), '<none>')
        FROM public.exercise_catalog_muscles m
        JOIN public.exercise_catalog s ON s.id = m.catalog_id
       WHERE s.logical_id = 'e21b2c00-0000-4000-a000-000000000008') <> $an2139$glutes:secondary$an2139$ THEN
    RAISE EXCEPTION 'w14 post: inventory line 139 anatomy is not exactly glutes:secondary';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.exercise_catalog_name_claims c
     WHERE c.normalized_name = $nn2139$weighted vest wall sit$nn2139$
       AND c.claim_source = 'canonical'
       AND c.logical_id = 'e21b2c00-0000-4000-a000-000000000008') THEN
    RAISE EXCEPTION 'w14 post: the canonical name claim "weighted vest wall sit" is missing or owned by the wrong identity';
  END IF;

  -- (2) No alias row and no alias CLAIM may exist for any of the five.
  IF (SELECT count(*) FROM public.exercise_catalog_aliases a
       WHERE a.logical_id IN (
    'e21b2c00-0000-4000-a000-000000000004',
    'e21b2c00-0000-4000-a000-000000000005',
    'e21b2c00-0000-4000-a000-000000000006',
    'e21b2c00-0000-4000-a000-000000000007',
    'e21b2c00-0000-4000-a000-000000000008')) <> 0 THEN
    RAISE EXCEPTION 'w14 post: an alias row exists for a W14 identity; the governed alias set is empty for all five';
  END IF;
  IF (SELECT count(*) FROM public.exercise_catalog_name_claims c
       WHERE c.claim_source = 'alias' AND c.logical_id IN (
    'e21b2c00-0000-4000-a000-000000000004',
    'e21b2c00-0000-4000-a000-000000000005',
    'e21b2c00-0000-4000-a000-000000000006',
    'e21b2c00-0000-4000-a000-000000000007',
    'e21b2c00-0000-4000-a000-000000000008')) <> 0 THEN
    RAISE EXCEPTION 'w14 post: an alias name claim exists for a W14 identity';
  END IF;

  -- (3) Exactly five snapshots carry tracking_mode weight_time among
  --     the five identities, and every one of the five does.
  IF (SELECT count(*) FROM public.exercise_catalog s
       WHERE s.logical_id IN (
    'e21b2c00-0000-4000-a000-000000000004',
    'e21b2c00-0000-4000-a000-000000000005',
    'e21b2c00-0000-4000-a000-000000000006',
    'e21b2c00-0000-4000-a000-000000000007',
    'e21b2c00-0000-4000-a000-000000000008')
         AND s.tracking_mode = 'weight_time') <> 5 THEN
    RAISE EXCEPTION 'w14 post: the five W14 snapshots do not all carry tracking_mode = weight_time';
  END IF;

  -- (4) The mixed-provenance split, asserted as a set: exactly two
  --     external_source_derived and exactly three forgefitos_original.
  IF (SELECT count(*) FROM public.exercise_catalog s
       WHERE s.logical_id IN (
    'e21b2c00-0000-4000-a000-000000000004',
    'e21b2c00-0000-4000-a000-000000000005',
    'e21b2c00-0000-4000-a000-000000000006',
    'e21b2c00-0000-4000-a000-000000000007',
    'e21b2c00-0000-4000-a000-000000000008')
         AND s.provenance = 'external_source_derived') <> 2
     OR (SELECT count(*) FROM public.exercise_catalog s
          WHERE s.logical_id IN (
    'e21b2c00-0000-4000-a000-000000000004',
    'e21b2c00-0000-4000-a000-000000000005',
    'e21b2c00-0000-4000-a000-000000000006',
    'e21b2c00-0000-4000-a000-000000000007',
    'e21b2c00-0000-4000-a000-000000000008')
            AND s.provenance = 'forgefitos_original') <> 3 THEN
    RAISE EXCEPTION 'w14 post: the intentional 2/3 provenance split is not exact; the five must NOT be normalized to one provenance value';
  END IF;

  -- (4a) THE TWO EXTERNAL ROWS MUST CARRY DISTINCT source_url VALUES
  --      (Correction 1). The unique index would already refuse a
  --      duplicate; this asserts the governed intent directly, so a
  --      future relaxation of the index cannot quietly re-admit the
  --      superseded same-URL binding.
  IF (SELECT count(DISTINCT s.source_url) FROM public.exercise_catalog s
       WHERE s.logical_id IN (
    'e21b2c00-0000-4000-a000-000000000004',
    'e21b2c00-0000-4000-a000-000000000005',
    'e21b2c00-0000-4000-a000-000000000006',
    'e21b2c00-0000-4000-a000-000000000007',
    'e21b2c00-0000-4000-a000-000000000008')
         AND s.provenance = 'external_source_derived') <> 2 THEN
    RAISE EXCEPTION 'w14 post: the external_source_derived W14 rows do not carry DISTINCT source_url values';
  END IF;

  -- (5) CARRY EXCLUSION. The delta of exactly five identities already
  --     forbids a sixth, but the three deferred carries are named
  --     explicitly so the proof is legible and cannot be satisfied by
  --     a renamed carry.
  IF EXISTS (SELECT 1 FROM public.exercise_catalog s
              WHERE lower(s.canonical_name) IN (
    'farmer''s carry',
    'suitcase carry',
    'sandbag bear-hug carry'))
     OR EXISTS (SELECT 1 FROM public.exercise_catalog_name_claims c
                 WHERE c.normalized_name IN (
    'farmer''s carry',
    'suitcase carry',
    'sandbag bear-hug carry')) THEN
    RAISE EXCEPTION 'w14 post: a deferred carry (inventory line 134, 135 or 136) is present; the three carries must NOT be admitted by this package';
  END IF;

  -- (6) NO TENANT DELIVERY. deliver_catalog_exercises is never called
  --     in this file; this proves no tenant row was linked to any of
  --     the five by any path, which is target-scoped and therefore
  --     independent of unrelated concurrent tenant activity.
  IF EXISTS (SELECT 1 FROM public.exercises t
              WHERE t.catalog_logical_id IN (
    'e21b2c00-0000-4000-a000-000000000004',
    'e21b2c00-0000-4000-a000-000000000005',
    'e21b2c00-0000-4000-a000-000000000006',
    'e21b2c00-0000-4000-a000-000000000007',
    'e21b2c00-0000-4000-a000-000000000008'))
     OR EXISTS (SELECT 1 FROM public.exercises t
                 JOIN public.exercise_catalog s ON s.id = t.catalog_id
                WHERE s.logical_id IN (
    'e21b2c00-0000-4000-a000-000000000004',
    'e21b2c00-0000-4000-a000-000000000005',
    'e21b2c00-0000-4000-a000-000000000006',
    'e21b2c00-0000-4000-a000-000000000007',
    'e21b2c00-0000-4000-a000-000000000008'))
     OR EXISTS (SELECT 1 FROM public.exercise_aliases a
                 JOIN public.exercise_catalog_aliases ca ON ca.id = a.catalog_alias_id
                WHERE ca.logical_id IN (
    'e21b2c00-0000-4000-a000-000000000004',
    'e21b2c00-0000-4000-a000-000000000005',
    'e21b2c00-0000-4000-a000-000000000006',
    'e21b2c00-0000-4000-a000-000000000007',
    'e21b2c00-0000-4000-a000-000000000008')) THEN
    RAISE EXCEPTION 'w14 post: a tenant exercise or tenant alias references a W14 identity; this package performs NO delivery';
  END IF;

  -- (7) NO CONTENT, REVIEW, ADMISSION or PUBLICATION ACT. Beyond the
  --     zero deltas above, the whole content/expected-relationship/
  --     review-event surface must be byte-identical to the pre-state
  --     digest, and no content row may reference one of the five.
  IF (SELECT md5(
      (SELECT coalesce(string_agg(c::text, '|' ORDER BY c.id), '-')
         FROM public.exercise_catalog_content c)
   || (SELECT coalesce(string_agg(x::text, '|' ORDER BY x.content_id, x.relation, x.to_logical_id), '-')
         FROM public.exercise_catalog_content_expected_relationships x)
   || (SELECT coalesce(string_agg(v::text, '|' ORDER BY v.id), '-')
         FROM public.exercise_catalog_review_events v))) <> (SELECT p.d_content FROM w14_txn_pre p) THEN
    RAISE EXCEPTION 'w14 post: the content / expected-relationship / review-event surface CHANGED; this package performs no content, review, admission or publication act';
  END IF;
  IF EXISTS (SELECT 1 FROM public.exercise_catalog_content c
              WHERE c.logical_id IN (
    'e21b2c00-0000-4000-a000-000000000004',
    'e21b2c00-0000-4000-a000-000000000005',
    'e21b2c00-0000-4000-a000-000000000006',
    'e21b2c00-0000-4000-a000-000000000007',
    'e21b2c00-0000-4000-a000-000000000008')) THEN
    RAISE EXCEPTION 'w14 post: a content version references a W14 identity';
  END IF;

  -- (8) THE PRE-EXISTING CATALOG SURFACE OUTSIDE THE FIVE IS
  --     UNCHANGED, byte-for-byte, including every pre-existing
  --     snapshot, anatomy row, alias, name claim and logical identity.
  IF (SELECT md5(
      (SELECT coalesce(string_agg(s::text, '|' ORDER BY s.id), '-')
         FROM public.exercise_catalog s
        WHERE s.logical_id NOT IN ('e21b2c00-0000-4000-a000-000000000004', 'e21b2c00-0000-4000-a000-000000000005', 'e21b2c00-0000-4000-a000-000000000006', 'e21b2c00-0000-4000-a000-000000000007', 'e21b2c00-0000-4000-a000-000000000008'))
   || (SELECT coalesce(string_agg(m::text, '|' ORDER BY m.catalog_id, m.muscle), '-')
         FROM public.exercise_catalog_muscles m
        WHERE NOT EXISTS (SELECT 1 FROM public.exercise_catalog s
                           WHERE s.id = m.catalog_id
                             AND s.logical_id IN ('e21b2c00-0000-4000-a000-000000000004', 'e21b2c00-0000-4000-a000-000000000005', 'e21b2c00-0000-4000-a000-000000000006', 'e21b2c00-0000-4000-a000-000000000007', 'e21b2c00-0000-4000-a000-000000000008')))
   || (SELECT coalesce(string_agg(a::text, '|' ORDER BY a.logical_id, a.alias), '-')
         FROM public.exercise_catalog_aliases a
        WHERE a.logical_id NOT IN ('e21b2c00-0000-4000-a000-000000000004', 'e21b2c00-0000-4000-a000-000000000005', 'e21b2c00-0000-4000-a000-000000000006', 'e21b2c00-0000-4000-a000-000000000007', 'e21b2c00-0000-4000-a000-000000000008'))
   || (SELECT coalesce(string_agg(n::text, '|' ORDER BY n.normalized_name), '-')
         FROM public.exercise_catalog_name_claims n
        WHERE n.logical_id NOT IN ('e21b2c00-0000-4000-a000-000000000004', 'e21b2c00-0000-4000-a000-000000000005', 'e21b2c00-0000-4000-a000-000000000006', 'e21b2c00-0000-4000-a000-000000000007', 'e21b2c00-0000-4000-a000-000000000008'))
   || (SELECT coalesce(string_agg(l::text, '|' ORDER BY l.id), '-')
         FROM public.exercise_catalog_logical l
        WHERE l.id NOT IN ('e21b2c00-0000-4000-a000-000000000004', 'e21b2c00-0000-4000-a000-000000000005', 'e21b2c00-0000-4000-a000-000000000006', 'e21b2c00-0000-4000-a000-000000000007', 'e21b2c00-0000-4000-a000-000000000008')))) <> (SELECT p.d_surface FROM w14_txn_pre p) THEN
    RAISE EXCEPTION 'w14 post: the pre-existing catalog surface outside the five W14 identities CHANGED';
  END IF;

  -- (9) THE TENANT SURFACE IS UNCHANGED, byte-for-byte.
  IF (SELECT md5(
      (SELECT coalesce(string_agg(t::text, '|' ORDER BY t.id), '-')
         FROM public.exercises t)
   || (SELECT coalesce(string_agg(a::text, '|' ORDER BY a.id), '-')
         FROM public.exercise_aliases a))) <> (SELECT p.d_tenant FROM w14_txn_pre p) THEN
    RAISE EXCEPTION 'w14 post: the tenant exercise / alias surface CHANGED; this package writes nothing to tenant tables';
  END IF;

  -- (10) The bidirectional claim invariant still holds: zero orphaned
  --      claims and zero unclaimed bearers, via migration 023's own
  --      verifier function.
  IF EXISTS (SELECT 1 FROM public.exlib_verify_catalog_claims() v
              WHERE v.orphaned_claims <> 0 OR v.unclaimed_bearers <> 0) THEN
    RAISE EXCEPTION 'w14 post: the bidirectional name-claim invariant is violated (orphaned claim or unclaimed bearer)';
  END IF;

  -- (11) AUTHORITY RESTORATION, before COMMIT: exactly the original
  --      supabase_admin-granted baseline row remains - grantor
  --      included - and no client, service or PUBLIC grant exists on
  --      any of the three loader functions.
  IF (SELECT count(*) FROM pg_catalog.pg_auth_members am
        JOIN pg_roles r ON r.oid = am.roleid
       WHERE r.rolname = 'exlib_catalog_loader') <> 1
     OR NOT EXISTS (
       SELECT 1 FROM pg_catalog.pg_auth_members am
         JOIN pg_roles r ON r.oid = am.roleid
         JOIN pg_roles m ON m.oid = am.member
         JOIN pg_roles g ON g.oid = am.grantor
        WHERE r.rolname = 'exlib_catalog_loader' AND m.rolname = 'postgres'
          AND g.rolname = 'supabase_admin'
          AND am.admin_option AND NOT am.inherit_option AND NOT am.set_option) THEN
    RAISE EXCEPTION 'w14 post: the temporary loader elevation was not exactly restored - EXACTLY the original supabase_admin-granted baseline row (grantor included) must remain';
  END IF;
  IF has_function_privilege('anon', 'public.load_catalog_identity(uuid)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.load_catalog_identity(uuid)', 'EXECUTE')
     OR has_function_privilege('service_role', 'public.load_catalog_identity(uuid)', 'EXECUTE')
     OR EXISTS (SELECT 1 FROM pg_proc p CROSS JOIN LATERAL aclexplode(p.proacl) a
                 WHERE p.pronamespace = 'public'::regnamespace
                   AND p.proname IN ('load_catalog_identity','load_catalog_snapshot','load_catalog_content_draft')
                   AND a.grantee = 0) THEN
    RAISE EXCEPTION 'w14 post: a client, service, or PUBLIC grant exists on the loader functions';
  END IF;
END
$post$;

COMMIT;

-- The transaction above is the entire package. After COMMIT the
-- database holds exactly five NEW logical identities, each bearing
-- exactly one PENDING, ACTIVE, version-1 canonical snapshot with
-- tracking_mode weight_time, its single secondary-muscle anatomy row,
-- ZERO aliases, and one canonical name claim - and nothing else
-- changed anywhere, proven by exact deltas over fourteen tables and
-- three whole-surface digests, with the temporary loader elevation
-- restored to the hosted baseline before COMMIT.
--
-- The three deferred carries (inventory lines 134, 135, 136) are NOT
-- admitted. No prose content version exists for any of the five. No
-- review, admission, publication, sealing or delivery has occurred.
-- deliver_catalog_exercises was not invoked. Every one of those
-- remains a separately gated authority.
--
-- THIS PACKAGE HAS NOT BEEN APPLIED TO HOSTED. It is ONE-USE: after a
-- successful hosted COMMIT it is SPENT and must not be re-run.
