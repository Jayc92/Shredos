#!/usr/bin/env bash
# ============================================================
# EXLIB-2Z LIVE verifier — the S5 seal package, proven against
# disposable local PostgreSQL ONLY.
#
# Boots a throwaway socket-only cluster (no TCP; no hosted contact;
# torn down on exit), reproduces the hosted role posture (bootstrap
# superuser supabase_admin as platform substrate; NON-SUPERUSER
# postgres as the working operator), applies migrations 001-027
# exactly once, seeds the representative 84-exercise tenant fixture,
# executes the COMMITTED, SPENT EXLIB-2K + 2O + 2P + 2Q + 2R + 2Y
# packages AND the COMMITTED, SPENT EXLIB-2U staging package once
# each to produce the EXACT post-2U hosted pre-state (vector
# 3/3/5/3/6/1/2/2/1/6/3: one staged run, six members, unapproved,
# unsealed), and then proves the EXLIB-2Z S5 seal package:
#   D. the happy path — the seal call succeeds exactly once, the
#      vector moves NOWHERE, the run row flips to approved + sealed
#      (sealed_at bound to the package transaction) with every
#      immutable evidence field byte-identical, the six membership
#      rows whole-row byte-identical, every snapshot/event/
#      unrelated/tenant/authority surface digest-identical, the
#      delivery predicate NOW matches exactly one row (the intended
#      irreversible effect) while delivery itself provably did NOT
#      run (zero tenant rows carry an import_run_id), and the
#      structural REACHABILITY fact is measured (authenticated holds
#      EXECUTE on the delivery function);
#   P. the promoted post-seal contract, probed directly on the
#      sealed database: every approval-bound field UPDATE refuses,
#      membership INSERT/DELETE/UPDATE refuse, a second direct seal
#      call refuses, and the operational-field CONTRAST (started_at
#      is documented-mutable) succeeds and is reverted;
#   E. ONE-USE — the second package execution refuses at the SPENT
#      posture gate with zero drift (sealed_at instant unchanged);
#   F. a refusal matrix, each variant on a FRESH post-2U staged
#      template copy with rollback proven after every refusal:
#      missing run, foreign second run, COUNT-CAMOUFLAGED key
#      substitution (run_key renamed in place — lawful pre-seal — so
#      the vector reads baseline and the reserved-key gate itself
#      fires), dry_run flip, drifted approver identity, drifted
#      evidence instant, drifted rationale, BLANK evidence,
#      membership removal, COUNT-CAMOUFLAGED membership repoint
#      (full F5-style camouflage: duplicate active Plank row swapped
#      for the Dead bug row with pad anatomy + forged pad event,
#      membership item repointed via trigger-off surgery — the
#      membership-surface gate itself fires), drifted approval tuple
#      (the world gate), a DISABLED run-row freeze trigger, a
#      DECOY-REBOUND membership freeze trigger, three
#      COUNT-PRESERVING authority substitutions (member, admin
#      option, grantor — each restored to the exact five-field
#      baseline afterwards, restoration asserted), wrong executor
#      authority, a tampered COPY calling the seal with a WRONG key
#      (mid-package function failure; whole-transaction rollback),
#      and a tampered COPY whose postcondition cannot hold (the
#      SEAL ITSELF is proven rolled back — the run stays unsealed);
#   G. a REAL two-session concurrency race proving exactly one
#      sealer and a single seal instant.
#
# DELIBERATE OMISSIONS (flagged for Codex, not oversights):
#   - exlib_revoke_run_delivery is NEVER called, not even here on
#     the disposable cluster: the governing instruction says "do not
#     authorize or execute revocation in this milestone", and this
#     suite reads that fail-closed. Its one-way semantics are
#     documented from the committed bytes in the preparation record.
#   - NO successful delivery is performed post-seal, not even here:
#     the instruction authorizes no delivery call. Post-seal
#     delivery REACHABILITY is proven structurally instead (the
#     predicate match plus the measured authenticated EXECUTE
#     privilege), never by delivering.
#
# Every counterfactual mutation is applied through surgery(), which
# FAILS LOUDLY if the mutation does not land. Tampered variants are
# awk-derived COPIES under the throwaway directory; the repository
# package is never modified.
#
# Run from the repository root:
#   bash scripts/verify-exlib2z-live.sh
# ============================================================
set -u
cd "$(dirname "$0")/.."

SEALPKG="docs/exlib2z-s5-seal-package.sql"
PKG2K="docs/exlib2k-plank-catalog-load-package.sql"
PKG2O="docs/exlib2o-target-snapshot-load-package.sql"
PKG2P="docs/exlib2p-plank-database-review-package.sql"
PKG2Q="docs/exlib2q-plank-import-admission-package.sql"
PKG2R="docs/exlib2r-plank-publication-package.sql"
PKG2Y="docs/exlib2y-snapshot-review-application-package.sql"
PKG2U="docs/exlib2u-staged-run-package.sql"
AUTH_FORM="docs/exlib2v-s4-authority-inputs-form-completed.json"

PASS=0
FAIL=0
ok()  { PASS=$((PASS+1)); printf '  PASS  %s\n' "$1"; }
bad() { FAIL=$((FAIL+1)); printf '  FAIL  %s\n' "$1"; [ -n "${2:-}" ] && printf '        %s\n' "$2"; return 0; }

TMP="$(mktemp -d /tmp/exlib2z-pg.XXXXXX)"
PGDATA="$TMP/pgdata"
SOCK="$TMP"
cleanup() {
  pg_ctl -D "$PGDATA" stop -m immediate >/dev/null 2>&1 || true
  rm -rf "$TMP"
}
trap cleanup EXIT

Q()   { psql -h "$SOCK" -U postgres -d "${2:-postgres}" -X -v ON_ERROR_STOP=1 -qtA -c "$1"; }
QQ()  { psql -h "$SOCK" -U postgres -d "${2:-postgres}" -X -v ON_ERROR_STOP=1 -qtA -c "$1" 2>&1; }
QA()  { psql -h "$SOCK" -U supabase_admin -d "${2:-postgres}" -X -v ON_ERROR_STOP=1 -qtA -c "$1"; }
QQA() { psql -h "$SOCK" -U supabase_admin -d "${2:-postgres}" -X -v ON_ERROR_STOP=1 -qtA -c "$1" 2>&1; }

baseline_sql() {
  printf "SELECT (SELECT count(*) FROM pg_auth_members am JOIN pg_roles r ON r.oid=am.roleid WHERE r.rolname='%s')::text || '/' || (SELECT g.rolname||'>'||m.rolname||':'||am.admin_option::text||':'||am.inherit_option::text||':'||am.set_option::text FROM pg_auth_members am JOIN pg_roles r ON r.oid=am.roleid JOIN pg_roles m ON m.oid=am.member JOIN pg_roles g ON g.oid=am.grantor WHERE r.rolname='%s' AND m.rolname='postgres')" "$1" "$1"
}
LDR_B=$(baseline_sql exlib_catalog_loader)
REV_B=$(baseline_sql exlib_catalog_reviewer)
ADM_B=$(baseline_sql exlib_catalog_admission)
PUB_B=$(baseline_sql exlib_catalog_admin)
BASELINE_OK="1/supabase_admin>postgres:true:false:false"
COUNTS_SQL="SELECT (SELECT count(*) FROM exercise_catalog_logical)::text||'/'||(SELECT count(*) FROM exercise_catalog)::text||'/'||(SELECT count(*) FROM exercise_catalog_muscles)::text||'/'||(SELECT count(*) FROM exercise_catalog_aliases)::text||'/'||(SELECT count(*) FROM exercise_catalog_name_claims)::text||'/'||(SELECT count(*) FROM exercise_catalog_content)::text||'/'||(SELECT count(*) FROM exercise_catalog_content_expected_relationships)::text||'/'||(SELECT count(*) FROM exercise_catalog_relationships)::text||'/'||(SELECT count(*) FROM exercise_catalog_import_runs)::text||'/'||(SELECT count(*) FROM exercise_catalog_run_items)::text||'/'||(SELECT count(*) FROM exercise_catalog_review_events)::text"
STAGED_VECTOR="3/3/5/3/6/1/2/2/1/6/3"
PL='e21b2c00-0000-4000-a000-000000000001'
DBU='e21b2c00-0000-4000-a000-000000000002'
AWU='e21b2c00-0000-4000-a000-000000000003'
TS="2026-09-07T19:06:00-04:00"
RUN_KEY='exlib2u-plank-release1-staged-v1'
RATIONALE='Approved for staged delivery validation of Plank and its reviewed progression and substitution targets. This does not authorize sealing, production delivery, or enabling the delivery flag; those remain separately gated.'
RUN_SQL="SELECT coalesce((SELECT r.run_key||'#'||r.dry_run::text||'#'||r.approved_for_delivery::text||'#'||(r.sealed_at IS NOT NULL)::text||'#'||(r.revoked_at IS NULL)::text||'#'||(r.started_at IS NULL AND r.completed_at IS NULL AND r.result_counts IS NULL)::text||'#'||(r.created_at IS NOT NULL)::text||'#'||r.product_approved_by||'#'||(r.product_approved_at = TIMESTAMPTZ '2026-09-07T11:05:00-04:00')::text||'#'||r.legal_approved_by||'#'||(r.legal_approved_at = TIMESTAMPTZ '2026-09-07T11:05:00-04:00')::text||'#'||(r.approval_rationale = '$RATIONALE')::text FROM exercise_catalog_import_runs r WHERE r.run_key = '$RUN_KEY'), '<none>')"
RUN_STAGED="$RUN_KEY#false#false#false#true#true#true#Joseph Carfagno#true#Joseph Carfagno#true#true"
RUN_SEALED="$RUN_KEY#false#true#true#true#true#true#Joseph Carfagno#true#Joseph Carfagno#true#true"
MEMBERS_SQL="SELECT coalesce(string_agg(x.member, E'\n' ORDER BY x.member), '<none>') FROM (SELECT 'exercise#'||c.logical_id::text AS member FROM exercise_catalog_run_items ri JOIN exercise_catalog c ON c.id = ri.catalog_id WHERE ri.catalog_id IS NOT NULL UNION ALL SELECT 'alias#'||a.logical_id::text||'#'||a.alias FROM exercise_catalog_run_items ri JOIN exercise_catalog_aliases a ON a.id = ri.catalog_alias_id WHERE ri.catalog_alias_id IS NOT NULL) x"
MEMBERS_STAGED="alias#$PL#Forearm plank
alias#$PL#Front plank
alias#$AWU#Ab roller rollout
exercise#$PL
exercise#$DBU
exercise#$AWU"
CATALOG_SQL="SELECT md5((SELECT coalesce(string_agg(c::text,'|' ORDER BY c.logical_id, c.catalog_version),'-') FROM exercise_catalog c) || (SELECT coalesce(string_agg(e::text,'|' ORDER BY e.catalog_id, e.created_at),'-') FROM exercise_catalog_review_events e))"
NEUTRAL_SQL="SELECT md5((SELECT coalesce(string_agg(m::text,'|' ORDER BY m.catalog_id, m.muscle),'-') FROM exercise_catalog_muscles m) || (SELECT coalesce(string_agg(a::text,'|' ORDER BY a.logical_id, a.alias),'-') FROM exercise_catalog_aliases a) || (SELECT coalesce(string_agg(n::text,'|' ORDER BY n.normalized_name),'-') FROM exercise_catalog_name_claims n) || (SELECT coalesce(string_agg(c::text,'|' ORDER BY c.id),'-') FROM exercise_catalog_content c) || (SELECT coalesce(string_agg(x::text,'|' ORDER BY x.relation, x.to_logical_id),'-') FROM exercise_catalog_content_expected_relationships x) || (SELECT coalesce(string_agg(r::text,'|' ORDER BY r.relation, r.to_logical_id),'-') FROM exercise_catalog_relationships r))"
TENANT_SQL="SELECT (SELECT count(*)::text||':'||md5(coalesce(string_agg(t::text,'|' ORDER BY t.id),'-')) FROM exercises t) || '+' || (SELECT count(*)::text||':'||md5(coalesce(string_agg(t::text,'|' ORDER BY t.id),'-')) FROM exercise_aliases t)"
ITEMS_SQL="SELECT md5(coalesce(string_agg(ri::text,'|' ORDER BY ri.id),'-')) FROM exercise_catalog_run_items ri"
DELIVER_PRED_SQL="SELECT count(*) FROM exercise_catalog_import_runs r WHERE r.run_key = '$RUN_KEY' AND r.approved_for_delivery = true AND r.dry_run = false AND r.sealed_at IS NOT NULL AND r.revoked_at IS NULL"
DELIVERED_SQL="SELECT count(*) FROM exercises WHERE import_run_id IS NOT NULL"
SEALED_AT_SQL="SELECT coalesce((SELECT r.sealed_at::text FROM exercise_catalog_import_runs r WHERE r.run_key='$RUN_KEY'), '<null>')"
TRIG_SQL="SELECT (SELECT count(*) FROM pg_catalog.pg_trigger t WHERE t.tgrelid='public.exercise_catalog_import_runs'::regclass AND t.tgname='exercise_catalog_import_runs_freeze_trigger' AND t.tgfoid='public.exlib_freeze_run_row()'::regprocedure AND t.tgtype=23 AND t.tgenabled='O')::text || '/' || (SELECT count(*) FROM pg_catalog.pg_trigger t WHERE t.tgrelid='public.exercise_catalog_import_runs'::regclass AND NOT t.tgisinternal)::text || '/' || (SELECT count(*) FROM pg_catalog.pg_trigger t WHERE t.tgrelid='public.exercise_catalog_run_items'::regclass AND t.tgname='exercise_catalog_run_items_freeze_trigger' AND t.tgfoid='public.exlib_freeze_run_membership()'::regprocedure AND t.tgtype=31 AND t.tgenabled='O')::text || '/' || (SELECT count(*) FROM pg_catalog.pg_trigger t WHERE t.tgrelid='public.exercise_catalog_run_items'::regclass AND NOT t.tgisinternal)::text"
TRIG_OK="1/1/1/1"
AUTH_PIN_SQL="SELECT string_agg(g.rolname||'>'||m.rolname||'@'||gr.rolname||':'||am.admin_option::text||':'||am.inherit_option::text||':'||am.set_option::text, E'\n' ORDER BY g.rolname, m.rolname, gr.rolname) FROM pg_catalog.pg_auth_members am JOIN pg_roles g ON g.oid=am.roleid JOIN pg_roles m ON m.oid=am.member JOIN pg_roles gr ON gr.oid=am.grantor WHERE g.rolname IN ('exlib_catalog_loader','exlib_catalog_reviewer','exlib_catalog_admission','exlib_catalog_admin')"
AUTH_PIN_OK="exlib_catalog_admin>postgres@supabase_admin:true:false:false
exlib_catalog_admission>postgres@supabase_admin:true:false:false
exlib_catalog_loader>postgres@supabase_admin:true:false:false
exlib_catalog_reviewer>postgres@supabase_admin:true:false:false"

echo
echo "=== A. Package identity, provenance, and shape"
[ -f "$SEALPKG" ] && ok "A1: the prepared package exists at $SEALPKG (docs-only, never under supabase/migrations/)" \
  || { bad "A1: package missing"; exit 1; }
for spec in "$AUTH_FORM:3416:6cf77759f7a8ddf89d32b2fd225bcbe0eddaf09587dcc9d01a657752b9adeeae" \
            "$PKG2K:29760:a1b6dd55850c5d544e2f484d1ce4833b41deec7f3dd4d4c2373cb3b50daaccf0" \
            "$PKG2O:39230:4c0d74f942da4e92efab5923a435512c750c6d794077804ffeee8c0c305c966d" \
            "$PKG2P:37702:76d1d67d6ec2bafc49ef43a6312700559cd9eeee4b8b9433868de9daf95dc666" \
            "$PKG2Q:39382:b15b9313db5efe679ca0d13cd0d9b9d97fd9316ec1d66d99c5bba6ca47529e57" \
            "$PKG2R:48913:96ade4887320df83a3032fbb3afcf9566ecc4436276ebe6a54e2af07727f68de" \
            "$PKG2Y:25193:74934419d027b477933f01bcbd2f4984700b34c6416ecd9c43c64bbd528757e0" \
            "$PKG2U:38582:ceb4964f3537f49ef987e77876c3106917abc3edf2fc9bff3991fb644c90722f"; do
  f="${spec%%:*}"; rest="${spec#*:}"; want_b="${rest%%:*}"; want_s="${rest#*:}"
  got_b=$(wc -c < "$f" | tr -d ' '); got_s=$(shasum -a 256 "$f" | awk '{print $1}')
  [ "$got_b/$got_s" = "$want_b/$want_s" ] \
    && ok "A2: $f holds its exact promoted fingerprint" \
    || { bad "A2: $f drifted ($got_b/$got_s)"; exit 1; }
done
PSHA=$(shasum -a 256 "$SEALPKG" | awk '{print $1}')
PBYTES=$(wc -c < "$SEALPKG" | tr -d ' ')
ok "A3: package under test: $PBYTES bytes, sha256 $PSHA (executed as exactly this file everywhere below)"
grep -q 'PREPARED — NOT EXECUTED — NOT AUTHORIZED' "$SEALPKG" && grep -q 'ttybyljytiwntvorugcv' "$SEALPKG" \
  && grep -q 'ONE-USE, NOT idempotent, and MATERIALLY IRREVERSIBLE' "$SEALPKG" && grep -q 'never by Claude and never by any automated pipeline' "$SEALPKG" \
  && grep -q 'RISK ELEVATION' "$SEALPKG" \
  && ok "A4: the package is labeled PREPARED / NOT AUTHORIZED / ONE-USE / MATERIALLY IRREVERSIBLE, names the only eventual hosted target and executor boundary, and states the delivery-reachability risk elevation" \
  || bad "A4: labels missing"
SEAL_CALLS=$(grep -c "public\.exlib_approve_and_seal_run('" "$SEALPKG" || true)
OTHER_CALLS=$(grep -cE "exlib_revoke_run_delivery\('|deliver_catalog_exercises\('|rollback_catalog_delivery\('" "$SEALPKG" || true)
INSERTS=$(grep -c '^INSERT INTO' "$SEALPKG" || true)
UPDATES=$(grep -c '^UPDATE ' "$SEALPKG" || true)
DELETES=$(grep -c '^DELETE ' "$SEALPKG" || true)
BEGINS=$(grep -c '^BEGIN;$' "$SEALPKG" || true)
COMMITS=$(grep -c '^COMMIT;$' "$SEALPKG" || true)
DOS=$(grep -c '^DO \$' "$SEALPKG" || true)
[ "$SEAL_CALLS/$OTHER_CALLS/$INSERTS/$UPDATES/$DELETES/$BEGINS/$COMMITS/$DOS" = "1/0/0/0/0/1/1/3" ] \
  && ok "A5: package shape exact - exactly ONE seal call bearing the reserved key, ZERO revoke/deliver/rollback calls, ZERO direct INSERT/UPDATE/DELETE statements, ONE BEGIN, ONE COMMIT, THREE DO blocks (pre, act, post)" \
  || bad "A5: shape wrong ($SEAL_CALLS/$OTHER_CALLS/$INSERTS/$UPDATES/$DELETES/$BEGINS/$COMMITS/$DOS)"
SNAP_UUIDS=$(grep -cE 'ca566325-8d0d-4152-a15d-63baa065ac1d|1ce09c1f-c13d-4231-8e12-6f35cfd761b5|c715d840-944b-4019-b984-1687accffcf4|33e180fb|4d01df9d|081f696a|6669ba78' "$SEALPKG" || true)
[ "$SNAP_UUIDS" = "0" ] \
  && ok "A6: NO hosted surrogate UUID anywhere (snapshots, events, or the staged run's own hosted id) - the run resolves by its reserved key, members by governed identity; the hosted surrogate pin lives in the operator preflight of the preparation record" \
  || bad "A6: a hosted surrogate literal appears ($SNAP_UUIDS)"
PRE_RAISES=$(awk '/^DO \$pre\$/,/^\$pre\$;/' "$SEALPKG" | grep -c 'RAISE EXCEPTION' || true)
PRE_STOPS=$(awk '/^DO \$pre\$/,/^\$pre\$;/' "$SEALPKG" | grep -c 'STOP / DO NOT SEAL' || true)
POST_RAISES=$(awk '/^DO \$post\$/,/^\$post\$;/' "$SEALPKG" | grep -c 'RAISE EXCEPTION' || true)
POST_SURVIVE=$(awk '/^DO \$post\$/,/^\$post\$;/' "$SEALPKG" | grep -c 'does not survive' || true)
[ "$PRE_RAISES" = "$PRE_STOPS" ] && [ "$PRE_RAISES" -ge 20 ] && [ "$POST_RAISES" = "$POST_SURVIVE" ] && [ "$POST_RAISES" -ge 8 ] \
  && ok "A7: abort language complete - every precondition refusal ($PRE_RAISES) carries STOP / DO NOT SEAL and every postcondition refusal ($POST_RAISES) states the attempted seal does not survive" \
  || bad "A7: abort language incomplete ($PRE_RAISES/$PRE_STOPS pre, $POST_RAISES/$POST_SURVIVE post)"
TRIG_BLOCK_START='IF (SELECT count(*) FROM pg_catalog.pg_trigger t'
grep -qF "$TRIG_BLOCK_START" "$SEALPKG" && grep -qF "AND t.tgtype = 23" "$SEALPKG" && grep -qF "AND t.tgtype = 31" "$SEALPKG" \
  && grep -qF "'exlib_catalog_admin>postgres@supabase_admin:true:false:false'" "$SEALPKG" \
  && ok "A8: the inherited strengthened gates are present (exact enabled trigger bindings with the measured tgtype masks; the absolute four-role authority pin)" \
  || bad "A8: inherited gates missing"

echo
echo "=== B. Disposable cluster + migrations 001-027 + tenant fixture + hosted posture"
initdb -D "$PGDATA" -U supabase_admin --no-locale -E UTF8 >/dev/null 2>&1
pg_ctl -D "$PGDATA" -o "-c listen_addresses='' -c unix_socket_directories='$SOCK'" -l "$TMP/pg.log" start >/dev/null 2>&1
if QA "SELECT 1" >/dev/null 2>&1; then
  ok "B1: cluster up at $SOCK (unix socket only; no TCP; no hosted contact; bootstrap superuser = supabase_admin, platform substrate only)"
else
  bad "B1: cluster failed to start"; sed -n '1,5p' "$TMP/pg.log"; exit 1
fi
QA "CREATE ROLE postgres LOGIN NOSUPERUSER CREATEDB CREATEROLE;
    CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN;
    ALTER DATABASE postgres OWNER TO postgres;" >/dev/null
Q "CREATE SCHEMA auth;
   CREATE TABLE auth.users (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email TEXT);
   CREATE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql STABLE
     AS \$\$SELECT nullif(current_setting('app.uid', true), '')::uuid\$\$;" >/dev/null
APPLIED=0
for f in supabase/migrations/0*.sql; do
  psql -h "$SOCK" -U postgres -d postgres -X -v ON_ERROR_STOP=1 -q -f "$f" >/dev/null 2>"$TMP/err.log" \
    || { bad "B2: migration failed: $f" "$(sed -n '1,3p' "$TMP/err.log")"; exit 1; }
  APPLIED=$((APPLIED+1))
done
[ "$APPLIED" = "27" ] && ok "B2: migrations 001-027 applied exactly once in order (27 files, ALL as the non-superuser postgres)" \
  || bad "B2: expected 27 migrations, applied $APPLIED"
[ "$(Q "$LDR_B")" = "$BASELINE_OK" ] && [ "$(Q "$REV_B")" = "$BASELINE_OK" ] && [ "$(Q "$ADM_B")" = "$BASELINE_OK" ] && [ "$(Q "$PUB_B")" = "$BASELINE_OK" ] \
  && ok "B3: all four catalog-role memberships carry EXACTLY the hosted baseline shape" \
  || bad "B3: role baseline wrong"
FIRST_UID=""
for u in 1 2 3 4; do
  UID_U=$(Q "INSERT INTO auth.users DEFAULT VALUES RETURNING id;")
  [ "$u" = "1" ] && FIRST_UID="$UID_U"
  Q "INSERT INTO public.exercises (user_id, name, category, primary_muscle, equipment, exercise_type, tracking_mode, unilateral, is_system, is_active)
     SELECT '$UID_U', 'Fixture Exercise U$u N' || g, 'compound', 'lats', 'barbell', 'strength', 'weight_reps', false, true, true
     FROM generate_series(1, 20) g;" >/dev/null
  Q "INSERT INTO public.exercises (user_id, name, category, primary_muscle, equipment, exercise_type, tracking_mode, unilateral, is_system, is_active)
     VALUES ('$UID_U', 'Plank', 'isolation', 'abs', 'bodyweight', 'bodyweight', 'bodyweight', false, true, true);" >/dev/null
done
[ "$(Q 'SELECT count(*) FROM exercises')" = "84" ] && [ -n "$FIRST_UID" ] \
  && ok "B4: representative tenant fixture in place - exactly 84 exercises across four users, each with a seeded Plank" \
  || bad "B4: fixture wrong"

echo
echo "=== C. The COMMITTED chain (2K..2Y) plus the SPENT 2U staging build the EXACT post-2U pre-state"
for step in "2k:$PKG2K" "2o:$PKG2O" "2p:$PKG2P" "2q:$PKG2Q" "2r:$PKG2R" "2y:$PKG2Y" "2u:$PKG2U"; do
  nm="${step%%:*}"; f="${step#*:}"
  psql -h "$SOCK" -U postgres -d postgres -X -v ON_ERROR_STOP=1 -q -f "$f" > "$TMP/$nm.out" 2>&1 \
    && ok "C1-$nm: the committed $nm package executed once" \
    || { bad "C1-$nm: package failed" "$(tail -3 "$TMP/$nm.out" | tr '\n' ' ')"; exit 1; }
done
[ "$(Q "$COUNTS_SQL")" = "$STAGED_VECTOR" ] \
  && ok "C2: the pre-state is EXACTLY the post-EXLIB-2U staged surface ($STAGED_VECTOR - one staged run, six members)" \
  || bad "C2: pre-state vector wrong ($(Q "$COUNTS_SQL"))"
[ "$(Q "$RUN_SQL")" = "$RUN_STAGED" ] && [ "$(Q "$MEMBERS_SQL")" = "$MEMBERS_STAGED" ] \
  && ok "C3: the staged run is EXACTLY the Design-S4 SELECTED posture (unapproved, unsealed, reserved evidence verbatim) with the six ALL_THREE_IDENTITIES members" \
  || bad "C3: staged run/membership wrong"
CATALOG_PRE=$(Q "$CATALOG_SQL"); NEUTRAL_PRE=$(Q "$NEUTRAL_SQL"); TENANT_PRE=$(Q "$TENANT_SQL"); ITEMS_PRE=$(Q "$ITEMS_SQL")
[ -n "$CATALOG_PRE" ] && [ -n "$NEUTRAL_PRE" ] && [ -n "$TENANT_PRE" ] && [ -n "$ITEMS_PRE" ] \
  && ok "C4: pre-state digests captured (snapshots+events, unrelated catalog surfaces, tenant, and the six membership rows whole-row)" \
  || bad "C4: digest capture failed"
[ "$(Q "$DELIVER_PRED_SQL")" = "0" ] && [ "$(Q "$DELIVERED_SQL")" = "0" ] \
  && ok "C5: pre-seal the delivery predicate matches ZERO rows and delivery has never run (zero tenant rows carry an import_run_id)" \
  || bad "C5: pre-seal deliverability wrong"
QA "CREATE DATABASE exlib2z_prestate TEMPLATE postgres OWNER postgres" >/dev/null 2>&1 \
  && ok "C6: post-2U staged pre-state TEMPLATE captured (every refusal variant gets a byte-identical fresh copy)" \
  || bad "C6: template capture failed"

echo
echo "=== D. Happy path: the seal succeeds exactly once, moving nothing but the two seal columns"
psql -h "$SOCK" -U postgres -d postgres -X -v ON_ERROR_STOP=1 -q -f "$SEALPKG" > "$TMP/2z.out" 2>&1 \
  && ok "D1: the EXLIB-2Z package executed cleanly (one transaction; every precondition and postcondition satisfied)" \
  || { bad "D1: package failed" "$(tail -3 "$TMP/2z.out" | tr '\n' ' ')"; exit 1; }
[ "$(Q "$COUNTS_SQL")" = "$STAGED_VECTOR" ] \
  && ok "D2: the vector moved NOWHERE ($STAGED_VECTOR before and after) - the seal creates and deletes nothing" \
  || bad "D2: vector wrong ($(Q "$COUNTS_SQL"))"
[ "$(Q "$RUN_SQL")" = "$RUN_SEALED" ] \
  && ok "D3: the run row is EXACTLY the sealed posture - approved_for_delivery=true, sealed_at set, unrevoked, operational fields still NULL, and the reserved evidence values verbatim" \
  || bad "D3: run row wrong ($(Q "$RUN_SQL"))"
SEALED_AT=$(Q "$SEALED_AT_SQL")
[ "$SEALED_AT" != "<null>" ] && [ -n "$SEALED_AT" ] \
  && ok "D4: the database-generated seal instant is captured for the rest of this suite ($SEALED_AT)" \
  || bad "D4: seal instant missing"
[ "$(Q "$ITEMS_SQL")" = "$ITEMS_PRE" ] && [ "$(Q "$MEMBERS_SQL")" = "$MEMBERS_STAGED" ] \
  && ok "D5: the six membership rows are WHOLE-ROW byte-identical across the seal (frozen exactly as staged)" \
  || bad "D5: membership changed across the seal"
[ "$(Q "$CATALOG_SQL")" = "$CATALOG_PRE" ] && [ "$(Q "$NEUTRAL_SQL")" = "$NEUTRAL_PRE" ] \
  && ok "D6: the snapshot/event surfaces and every unrelated catalog surface are digest-identical" \
  || bad "D6: an unrelated surface changed"
[ "$(Q "$TENANT_SQL")" = "$TENANT_PRE" ] && [ "$(Q "$DELIVERED_SQL")" = "0" ] \
  && ok "D7: both tenant tables are count + whole-row digest identical and zero tenant rows carry an import_run_id - SEALING IS NOT DELIVERY; zero product change" \
  || bad "D7: tenant surface changed"
[ "$(Q "$LDR_B")" = "$BASELINE_OK" ] && [ "$(Q "$REV_B")" = "$BASELINE_OK" ] && [ "$(Q "$ADM_B")" = "$BASELINE_OK" ] && [ "$(Q "$PUB_B")" = "$BASELINE_OK" ] \
  && ok "D8: all four authority baselines byte-identical - this package changes NO authority" \
  || bad "D8: authority drifted"
[ "$(Q "$DELIVER_PRED_SQL")" = "1" ] \
  && ok "D9: THE INTENDED IRREVERSIBLE EFFECT - the delivery gate's own five-conjunct predicate NOW matches exactly one row for the reserved key" \
  || bad "D9: delivery predicate rows wrong ($(Q "$DELIVER_PRED_SQL"))"
[ "$(Q "SELECT has_function_privilege('authenticated', 'public.deliver_catalog_exercises(text)', 'EXECUTE')")" = "t" ] \
  && [ "$(Q "SELECT has_function_privilege('authenticated', 'public.exlib_approve_and_seal_run(text)', 'EXECUTE')")" = "f" ] \
  && [ "$(Q "SELECT has_function_privilege('anon', 'public.deliver_catalog_exercises(text)', 'EXECUTE')")" = "f" ] \
  && ok "D10: REACHABILITY measured structurally, never exercised - authenticated holds EXECUTE on the delivery function (the risk elevation the record states), anon does not, and the seal function itself is NOT client-callable" \
  || bad "D10: privilege posture wrong"
grep -q 'EXLIB-2Z SEALED' "$TMP/2z.out" \
  && ok "D11: the package surfaced its result line (EXLIB-2Z SEALED with the predicate and delivered-rows evidence) - display evidence; the rows above are the binding proof" \
  || bad "D11: result line missing"
[ "$(Q "SELECT orphaned_claims::text||'/'||unclaimed_bearers::text FROM exlib_verify_catalog_claims()")" = "0/0" ] \
  && ok "D12: the catalog claims invariant holds after sealing (0/0)" \
  || bad "D12: claims invariant broken"
[ "$(Q "$TRIG_SQL")" = "$TRIG_OK" ] && [ "$(Q "$AUTH_PIN_SQL")" = "$AUTH_PIN_OK" ] \
  && ok "D13: the strengthened gates hold on the REAL post-seal database - both freeze triggers exactly bound and enabled; the four-role authority baseline exact" \
  || bad "D13: strengthened-gate surfaces wrong"

echo
echo "=== P. The promoted post-seal contract, probed directly on the sealed database"
P1_OUT=$(QQ "UPDATE exercise_catalog_import_runs SET run_key = 'exlib2z-renamed' WHERE run_key = '$RUN_KEY';")
printf '%s' "$P1_OUT" | grep -q 'approval-bound fields' \
  && ok "P1: post-seal run_key UPDATE refused by the freeze trigger (approval-bound fields are immutable)" \
  || bad "P1: run_key update did not refuse" "$(printf '%s' "$P1_OUT" | tr '\n' ' ' | cut -c1-140)"
P2_OUT=$(QQ "UPDATE exercise_catalog_import_runs SET product_approved_by = 'Somebody Else' WHERE run_key = '$RUN_KEY';")
printf '%s' "$P2_OUT" | grep -q 'approval-bound fields' \
  && ok "P2: post-seal approver-identity UPDATE refused (the approval evidence is frozen forever)" \
  || bad "P2: evidence update did not refuse" "$(printf '%s' "$P2_OUT" | tr '\n' ' ' | cut -c1-140)"
P3_OUT=$(QQ "UPDATE exercise_catalog_import_runs SET sealed_at = NULL, approved_for_delivery = false WHERE run_key = '$RUN_KEY';")
printf '%s' "$P3_OUT" | grep -q 'approval-bound fields' \
  && ok "P3: post-seal UNSEAL attempt refused (sealed_at and approved_for_delivery can never be cleared - no unseal exists)" \
  || bad "P3: unseal attempt did not refuse" "$(printf '%s' "$P3_OUT" | tr '\n' ' ' | cut -c1-140)"
P4_OUT=$(QQ "UPDATE exercise_catalog_import_runs SET dry_run = true WHERE run_key = '$RUN_KEY';")
printf '%s' "$P4_OUT" | grep -q 'approval-bound fields' \
  && ok "P4: post-seal dry_run UPDATE refused (frozen with the approval)" \
  || bad "P4: dry_run update did not refuse" "$(printf '%s' "$P4_OUT" | tr '\n' ' ' | cut -c1-140)"
P5_OUT=$(QQ "INSERT INTO exercise_catalog_run_items (run_id, catalog_id) SELECT r.id, c.id FROM exercise_catalog_import_runs r, exercise_catalog c WHERE r.run_key = '$RUN_KEY' AND c.logical_id = '$PL' AND c.is_active;")
printf '%s' "$P5_OUT" | grep -q 'membership is PERMANENT' \
  && ok "P5: post-seal membership INSERT refused (a sealed run's membership is PERMANENT)" \
  || bad "P5: membership insert did not refuse" "$(printf '%s' "$P5_OUT" | tr '\n' ' ' | cut -c1-140)"
P6_OUT=$(QQ "DELETE FROM exercise_catalog_run_items WHERE run_id = (SELECT id FROM exercise_catalog_import_runs WHERE run_key = '$RUN_KEY');")
printf '%s' "$P6_OUT" | grep -q 'membership is PERMANENT' \
  && ok "P6: post-seal membership DELETE refused (permanent means permanent)" \
  || bad "P6: membership delete did not refuse" "$(printf '%s' "$P6_OUT" | tr '\n' ' ' | cut -c1-140)"
P7_OUT=$(QQ "UPDATE exercise_catalog_run_items SET catalog_id = catalog_id WHERE run_id = (SELECT id FROM exercise_catalog_import_runs WHERE run_key = '$RUN_KEY');")
printf '%s' "$P7_OUT" | grep -q 'membership rows are immutable' \
  && ok "P7: membership UPDATE refused unconditionally (rows are immutable in every run state)" \
  || bad "P7: membership update did not refuse" "$(printf '%s' "$P7_OUT" | tr '\n' ' ' | cut -c1-140)"
P8_OUT=$(QQ "SELECT exlib_approve_and_seal_run('$RUN_KEY');")
printf '%s' "$P8_OUT" | grep -q 'run is already sealed; a different approval decision requires a NEW run' \
  && ok "P8: a second DIRECT seal call refused with the exact committed message - the function itself is one-shot per run" \
  || bad "P8: second direct seal did not refuse" "$(printf '%s' "$P8_OUT" | tr '\n' ' ' | cut -c1-140)"
Q "UPDATE exercise_catalog_import_runs SET started_at = now() WHERE run_key = '$RUN_KEY';" >/dev/null 2>&1 \
  && [ "$(Q "SELECT (started_at IS NOT NULL)::text FROM exercise_catalog_import_runs WHERE run_key='$RUN_KEY'")" = "true" ] \
  && Q "UPDATE exercise_catalog_import_runs SET started_at = NULL WHERE run_key = '$RUN_KEY';" >/dev/null 2>&1 \
  && [ "$(Q "SELECT (started_at IS NULL)::text FROM exercise_catalog_import_runs WHERE run_key='$RUN_KEY'")" = "true" ] \
  && ok "P9: the operational-field CONTRAST proven - started_at (documented mutable, carrying no approval content) updates and reverts cleanly on the sealed run" \
  || bad "P9: operational-field contrast failed"
[ "$(Q "$RUN_SQL")" = "$RUN_SEALED" ] && [ "$(Q "$SEALED_AT_SQL")" = "$SEALED_AT" ] && [ "$(Q "$ITEMS_SQL")" = "$ITEMS_PRE" ] && [ "$(Q "$COUNTS_SQL")" = "$STAGED_VECTOR" ] \
  && ok "P10: after every probe the sealed state is EXACTLY intact (posture, the original seal instant, whole-row membership, vector)" \
  || bad "P10: a probe drifted state"

echo
echo "=== E. ONE-USE: the second package execution refuses fail-closed"
psql -h "$SOCK" -U postgres -d postgres -X -v ON_ERROR_STOP=1 -q -f "$SEALPKG" > "$TMP/2z-second.out" 2>&1 \
  && bad "E1: the second execution SUCCEEDED (it must refuse)" \
  || { grep -q 'ONE-USE and this database shows it SPENT' "$TMP/2z-second.out" \
    && ok "E1: the second execution refused at the SPENT posture gate (the run is already sealed) - ONE-USE proven on the sealed database" \
    || bad "E1: refused by an unexpected gate" "$(tail -2 "$TMP/2z-second.out" | tr '\n' ' ')"; }
[ "$(Q "$RUN_SQL")" = "$RUN_SEALED" ] && [ "$(Q "$SEALED_AT_SQL")" = "$SEALED_AT" ] && [ "$(Q "$COUNTS_SQL")" = "$STAGED_VECTOR" ] \
  && ok "E2: the refused re-run changed NOTHING (sealed posture, the ORIGINAL seal instant, and the vector all exactly the single seal)" \
  || bad "E2: the refused re-run drifted state"

echo
echo "=== F. Refusal matrix - each variant on a FRESH post-2U staged copy; rollback proven every time"
VN=0
V=""
new_variant() {
  VN=$((VN+1))
  V="exlib2z_v$VN"
  QA "DROP DATABASE IF EXISTS $V" >/dev/null 2>&1
  QA "CREATE DATABASE $V TEMPLATE exlib2z_prestate OWNER postgres" >/dev/null
}
run_pkg() { psql -h "$SOCK" -U postgres -d "$1" -X -v ON_ERROR_STOP=1 -q -f "$2" > "$3" 2>&1; }
expect_refusal() { # NAME DB FILE PATTERN OUTFILE
  if run_pkg "$2" "$3" "$5"; then
    bad "$1" "the package SUCCEEDED (it must refuse)"
  elif grep -q "$4" "$5"; then
    ok "$1"
  else
    bad "$1" "refused, but not by the expected gate: $(tail -2 "$5" | tr '\n' ' ')"
  fi
}
surgery() { # LABEL SQL (on $V) - FAILS LOUDLY if rejected
  local out rc
  out=$(QQA "$2" "$V"); rc=$?
  if [ "$rc" != "0" ]; then
    bad "HARNESS SURGERY FAILED [$1] - the counterfactual was never built" "$(printf '%s' "$out" | tr '\n' ' ' | cut -c1-200)"
    return 1
  fi
  return 0
}
still_unsealed() { # NAME DB - the refusal must have sealed NOTHING
  [ "$(Q "SELECT count(*) FROM exercise_catalog_import_runs WHERE sealed_at IS NOT NULL OR approved_for_delivery = true" "$2")" = "0" ] \
    && ok "$1" || bad "$1" "a seal or approval leaked"
}

# F1 MISSING RUN: the staged run and its items removed (items delete
# lawfully pre-seal; the run row follows once unreferenced). The
# vector reads the zero-run world and the front-line gate refuses.
new_variant
surgery "F1 missing run" "DELETE FROM exercise_catalog_run_items;
  DELETE FROM exercise_catalog_import_runs WHERE run_key = '$RUN_KEY';" \
  && [ "$(Q "SELECT count(*) FROM exercise_catalog_import_runs" "$V")" = "0" ] \
  && ok "F1-setup: the staged run is gone (zero runs, zero items - a lawful pre-seal teardown)" \
  || bad "F1-setup: teardown not landed"
expect_refusal "F1: MISSING RUN refused at the front-line vector gate (the staged baseline is gone)" \
  "$V" "$SEALPKG" "expected the post-EXLIB-2U staged baseline" "$TMP/f1.out"
still_unsealed "F1b: nothing sealed anywhere" "$V"

# F2 FOREIGN SECOND RUN: another born-unsealed run appears - the
# runs count moves 1 -> 2 and the vector gate refuses (the deeper
# run gates stand behind it as disclosed defense-in-depth).
new_variant
surgery "F2 foreign second run" "INSERT INTO exercise_catalog_import_runs (run_key, dry_run) VALUES ('exlib2z-foreign-run-key', true);" \
  && [ "$(Q "SELECT count(*) FROM exercise_catalog_import_runs" "$V")" = "2" ] \
  && ok "F2-setup: a second foreign run exists (born unsealed, dry_run=true - a lawful direct INSERT)" \
  || bad "F2-setup: foreign run not landed"
expect_refusal "F2: FOREIGN SECOND RUN refused at the vector gate ('exactly one target run' enforced by the runs count)" \
  "$V" "$SEALPKG" "expected the post-EXLIB-2U staged baseline" "$TMP/f2.out"
still_unsealed "F2b: nothing sealed anywhere" "$V"

# F3 COUNT-CAMOUFLAGED KEY SUBSTITUTION: the staged run's key is
# renamed IN PLACE (run_key is writable pre-seal, so this is a
# lawful UPDATE - no trigger surgery). The vector still reads the
# staged baseline (1 run / 6 items), so this ISOLATES the
# reserved-key gate: the one counted run is not the reserved run.
new_variant
surgery "F3 key substitution" "UPDATE exercise_catalog_import_runs SET run_key = 'exlib2z-not-the-reserved-key' WHERE run_key = '$RUN_KEY';" \
  && [ "$(Q "$COUNTS_SQL" "$V")" = "$STAGED_VECTOR" ] \
  && [ "$(Q "SELECT count(*) FROM exercise_catalog_import_runs WHERE run_key='$RUN_KEY'" "$V")" = "0" ] \
  && ok "F3-setup: the run's key is substituted in place while the vector reads EXACTLY the staged baseline" \
  || bad "F3-setup: key substitution not landed"
expect_refusal "F3: COUNT-CAMOUFLAGED KEY SUBSTITUTION refused - the reserved-key gate itself fires (the vector reads one run but it is not the reserved staged run)" \
  "$V" "$SEALPKG" "the reserved key is missing" "$TMP/f3.out"
still_unsealed "F3b: nothing sealed anywhere" "$V"

# F4 DRY-RUN FLIP: dry_run is writable pre-seal, so this is a lawful
# UPDATE; the package's posture gate refuses BEFORE the seal call
# (the freeze trigger would also refuse inside the transition -
# disclosed defense-in-depth behind this gate).
new_variant
surgery "F4 dry-run flip" "UPDATE exercise_catalog_import_runs SET dry_run = true WHERE run_key = '$RUN_KEY';" \
  && [ "$(Q "SELECT dry_run::text FROM exercise_catalog_import_runs WHERE run_key='$RUN_KEY'" "$V")" = "true" ] \
  && ok "F4-setup: the staged run now reads dry_run=true (lawful pre-seal UPDATE)" \
  || bad "F4-setup: flip not landed"
expect_refusal "F4: DRY-RUN FLIP refused at the package posture gate before any seal call" \
  "$V" "$SEALPKG" "not in the Design-S4 SELECTED posture" "$TMP/f4.out"
still_unsealed "F4b: nothing sealed anywhere" "$V"

# F5 DRIFTED APPROVER IDENTITY (lawful pre-seal UPDATE): the seal
# would freeze a NON-RESERVED identity forever; the evidence gate
# refuses first.
new_variant
surgery "F5 approver drift" "UPDATE exercise_catalog_import_runs SET product_approved_by = 'Somebody Else' WHERE run_key = '$RUN_KEY';" \
  && [ "$(Q "SELECT product_approved_by FROM exercise_catalog_import_runs WHERE run_key='$RUN_KEY'" "$V")" = "Somebody Else" ] \
  && ok "F5-setup: the product approver identity is drifted and REAL" \
  || bad "F5-setup: drift not landed"
expect_refusal "F5: DRIFTED APPROVER IDENTITY refused - the run no longer carries the reserved approval evidence" \
  "$V" "$SEALPKG" "does not carry the reserved approval evidence" "$TMP/f5.out"
still_unsealed "F5b: nothing sealed anywhere" "$V"

# F6 DRIFTED EVIDENCE INSTANT (lawful pre-seal UPDATE): one minute
# off - the evidence gate compares the exact reserved instant.
new_variant
surgery "F6 instant drift" "UPDATE exercise_catalog_import_runs SET legal_approved_at = TIMESTAMPTZ '2026-09-07T11:06:00-04:00' WHERE run_key = '$RUN_KEY';" \
  && ok "F6-setup: the legal evidence instant is drifted by one minute" \
  || bad "F6-setup: drift not landed"
expect_refusal "F6: DRIFTED EVIDENCE INSTANT refused - the reserved authority instant is compared exactly" \
  "$V" "$SEALPKG" "does not carry the reserved approval evidence" "$TMP/f6.out"
still_unsealed "F6b: nothing sealed anywhere" "$V"

# F7 DRIFTED RATIONALE (lawful pre-seal UPDATE): a single word
# changes - character-for-character comparison refuses.
new_variant
surgery "F7 rationale drift" "UPDATE exercise_catalog_import_runs SET approval_rationale = replace(approval_rationale, 'staged delivery validation', 'staged delivery experimentation') WHERE run_key = '$RUN_KEY';" \
  && ok "F7-setup: the rationale is drifted in place" \
  || bad "F7-setup: drift not landed"
expect_refusal "F7: DRIFTED RATIONALE refused - the reserved rationale is bound character-for-character" \
  "$V" "$SEALPKG" "does not carry the reserved approval evidence" "$TMP/f7.out"
still_unsealed "F7b: nothing sealed anywhere" "$V"

# F8 BLANK EVIDENCE (lawful pre-seal UPDATE): whitespace-only
# approver - the package's evidence gate refuses BEFORE the seal
# call would (the trigger's own blank-evidence validation stands
# behind it as disclosed defense-in-depth).
new_variant
surgery "F8 blank evidence" "UPDATE exercise_catalog_import_runs SET legal_approved_by = '   ' WHERE run_key = '$RUN_KEY';" \
  && ok "F8-setup: the legal approver is whitespace-only" \
  || bad "F8-setup: blanking not landed"
expect_refusal "F8: BLANK EVIDENCE refused at the package evidence gate before any seal call" \
  "$V" "$SEALPKG" "does not carry the reserved approval evidence" "$TMP/f8.out"
still_unsealed "F8b: nothing sealed anywhere" "$V"

# F9 MEMBERSHIP REMOVAL: one item deleted (lawful pre-seal) - the
# items count moves 6 -> 5 and the vector gate refuses (the
# membership-surface gate stands behind it; F10 isolates it).
new_variant
surgery "F9 membership removal" "DELETE FROM exercise_catalog_run_items WHERE id = (SELECT ri.id FROM exercise_catalog_run_items ri JOIN exercise_catalog c ON c.id = ri.catalog_id WHERE c.logical_id = '$DBU' LIMIT 1);" \
  && [ "$(Q "SELECT count(*) FROM exercise_catalog_run_items" "$V")" = "5" ] \
  && ok "F9-setup: one exercise member removed (five items remain - a lawful pre-seal DELETE)" \
  || bad "F9-setup: removal not landed"
expect_refusal "F9: MEMBERSHIP REMOVAL refused at the vector gate (six members demanded by count before identity)" \
  "$V" "$SEALPKG" "expected the post-EXLIB-2U staged baseline" "$TMP/f9.out"
still_unsealed "F9b: nothing sealed anywhere" "$V"

# F10 COUNT-CAMOUFLAGED MEMBERSHIP REPOINT: full camouflage - both
# one-active unique indexes dropped, a duplicate active Plank row
# (version 2) swapped IN for the Dead bug row (its anatomy row and
# review event replaced by a pad row and a forged pad event), and
# the run's Dead bug EXERCISE membership item REPOINTED at the
# duplicate Plank row via trigger-off surgery (membership UPDATE is
# unconditionally refused lawfully; the duplicate's distinct id
# keeps the (run_id, catalog_id) unique index satisfied). Every
# vector position reads EXACTLY the staged baseline, and the
# run-focused gates come FIRST in this package - so the
# MEMBERSHIP-SURFACE gate itself fires: the six member lines resolve
# to exercise#Plank TWICE and no Dead bug member.
new_variant
surgery "F10 membership repoint" "DROP INDEX exercise_catalog_one_active_logical_idx;
  DROP INDEX exercise_catalog_one_active_name_idx;
  ALTER TABLE exercise_catalog DISABLE TRIGGER USER;
  ALTER TABLE exercise_catalog_muscles DISABLE TRIGGER USER;
  ALTER TABLE exercise_catalog_review_events DISABLE TRIGGER USER;
  ALTER TABLE exercise_catalog_run_items DISABLE TRIGGER USER;
  INSERT INTO exercise_catalog (logical_id, canonical_name, category, primary_muscle, equipment, laterality, tracking_mode, provenance, movement_pattern, training_role, difficulty, availability, review_status, reviewed_by, reviewed_at, review_rationale, is_active, catalog_version)
  SELECT logical_id, canonical_name, category, primary_muscle, equipment, laterality, tracking_mode, provenance, movement_pattern, training_role, difficulty, availability, review_status, reviewed_by, reviewed_at, review_rationale, true, 2
  FROM exercise_catalog WHERE logical_id='$PL' AND catalog_version = 1;
  UPDATE exercise_catalog_run_items SET catalog_id = (SELECT id FROM exercise_catalog WHERE logical_id='$PL' AND catalog_version=2)
   WHERE catalog_id = (SELECT id FROM exercise_catalog WHERE logical_id = '$DBU');
  DELETE FROM exercise_catalog_review_events WHERE catalog_id = (SELECT id FROM exercise_catalog WHERE logical_id='$DBU');
  DELETE FROM exercise_catalog_muscles WHERE catalog_id = (SELECT id FROM exercise_catalog WHERE logical_id='$DBU');
  DELETE FROM exercise_catalog WHERE logical_id='$DBU';
  INSERT INTO exercise_catalog_muscles (catalog_id, muscle, role)
  SELECT id, 'obliques', 'secondary' FROM exercise_catalog WHERE logical_id='$PL' AND catalog_version=2;
  INSERT INTO exercise_catalog_review_events (catalog_id, from_status, to_status, reviewed_by, reviewed_at, review_rationale)
  SELECT id, 'pending', 'approved', 'Camouflage', TIMESTAMPTZ '$TS', 'pad event' FROM exercise_catalog WHERE logical_id='$PL' AND catalog_version=2;
  ALTER TABLE exercise_catalog_run_items ENABLE TRIGGER USER;
  ALTER TABLE exercise_catalog_review_events ENABLE TRIGGER USER;
  ALTER TABLE exercise_catalog_muscles ENABLE TRIGGER USER;
  ALTER TABLE exercise_catalog ENABLE TRIGGER USER;" \
  && [ "$(Q "$COUNTS_SQL" "$V")" = "$STAGED_VECTOR" ] \
  && [ "$(Q "SELECT count(*) FROM exercise_catalog_run_items ri JOIN exercise_catalog c ON c.id = ri.catalog_id WHERE c.logical_id = '$PL'" "$V")" = "2" ] \
  && ok "F10-setup: the membership is repointed (exercise#Plank twice, no Dead bug member) while EVERY vector position reads the staged baseline (dup active Plank v2 + pad anatomy + forged pad event swapped for the Dead bug row)" \
  || bad "F10-setup: camouflage not landed ($(Q "$COUNTS_SQL" "$V"))"
expect_refusal "F10: COUNT-CAMOUFLAGED MEMBERSHIP REPOINT refused - the run-focused MEMBERSHIP-SURFACE gate itself fires (the six lines are no longer ALL_THREE_IDENTITIES), independent of the vector and ahead of the world gates" \
  "$V" "$SEALPKG" "membership is not exactly the six ALL_THREE_IDENTITIES rows" "$TMP/f10.out"
still_unsealed "F10b: nothing sealed anywhere" "$V"

# F11 DRIFTED APPROVAL TUPLE (the world gate): the Dead bug
# snapshot's reviewer rewritten (trigger-off harness corruption).
# The run-focused gates all pass; the per-identity world gate
# refuses - a seal must never freeze a membership pointing into a
# drifted world.
new_variant
surgery "F11 tuple drift" "ALTER TABLE exercise_catalog DISABLE TRIGGER USER;
  UPDATE exercise_catalog SET reviewed_by='Somebody Else' WHERE logical_id='$DBU' AND is_active;
  ALTER TABLE exercise_catalog ENABLE TRIGGER USER;" \
  && [ "$(Q "SELECT reviewed_by FROM exercise_catalog WHERE logical_id='$DBU' AND is_active" "$V")" = "Somebody Else" ] \
  && ok "F11-setup: the Dead bug approval tuple is drifted and REAL" \
  || bad "F11-setup: drift not landed"
expect_refusal "F11: DRIFTED APPROVAL TUPLE refused - the world the membership points into no longer carries the applied EXLIB-2Y tuple (this gate also shadows the seal function's own unready check, disclosed)" \
  "$V" "$SEALPKG" "Dead bug snapshot does not carry the applied EXLIB-2Y approval tuple" "$TMP/f11.out"
still_unsealed "F11b: nothing sealed anywhere" "$V"

# F12 DISABLED FREEZE TRIGGER: exists with its exact promoted
# binding but DISABLED - the exact-binding gate demands tgenabled='O'.
new_variant
surgery "F12 trigger disabled" "ALTER TABLE exercise_catalog_import_runs DISABLE TRIGGER exercise_catalog_import_runs_freeze_trigger;" \
  && [ "$(Q "SELECT tgenabled FROM pg_trigger WHERE tgname='exercise_catalog_import_runs_freeze_trigger'" "$V")" = "D" ] \
  && ok "F12-setup: the run-row freeze trigger is DISABLED in place (exists, correct binding, tgenabled='D')" \
  || bad "F12-setup: disable not landed"
expect_refusal "F12: DISABLED FREEZE TRIGGER refused - the exact-binding gate demands the ENABLED promoted binding, not mere trigger existence" \
  "$V" "$SEALPKG" "not EXACTLY bound and enabled" "$TMP/f12.out"
still_unsealed "F12b: nothing sealed anywhere" "$V"

# F13 DECOY-REBOUND FREEZE TRIGGER: same name, same event set,
# enabled - executing an inert decoy function; caught by tgfoid.
new_variant
surgery "F13 decoy rebind" "CREATE FUNCTION exlib2z_decoy() RETURNS trigger LANGUAGE plpgsql AS \$d\$BEGIN RETURN COALESCE(NEW, OLD); END\$d\$;
  DROP TRIGGER exercise_catalog_run_items_freeze_trigger ON exercise_catalog_run_items;
  CREATE TRIGGER exercise_catalog_run_items_freeze_trigger
    BEFORE INSERT OR UPDATE OR DELETE ON exercise_catalog_run_items
    FOR EACH ROW EXECUTE FUNCTION exlib2z_decoy();" \
  && [ "$(Q "SELECT count(*) FROM pg_trigger t WHERE t.tgname='exercise_catalog_run_items_freeze_trigger' AND t.tgfoid='exlib2z_decoy()'::regprocedure AND t.tgtype=31 AND t.tgenabled='O'" "$V")" = "1" ] \
  && ok "F13-setup: the membership freeze trigger is REBOUND to an inert decoy (same name, same BEFORE-ROW event set, enabled - only the function differs)" \
  || bad "F13-setup: decoy rebind not landed"
expect_refusal "F13: DECOY-REBOUND FREEZE TRIGGER refused - the exact-binding gate binds the promoted FUNCTION (tgfoid), not the trigger name or event set" \
  "$V" "$SEALPKG" "not EXACTLY bound and enabled" "$TMP/f13.out"
still_unsealed "F13b: nothing sealed anywhere" "$V"

# F14 COUNT-PRESERVING MEMBER SUBSTITUTION (cluster-wide catalog
# surgery; restored to the exact five-field baseline afterwards).
new_variant
surgery "F14 member substitution" "REVOKE exlib_catalog_loader FROM postgres;
  CREATE ROLE exlib2z_impostor NOLOGIN;
  GRANT exlib_catalog_loader TO exlib2z_impostor WITH ADMIN TRUE, INHERIT FALSE, SET FALSE;" \
  && [ "$(Q "SELECT count(*) FROM pg_auth_members am JOIN pg_roles g ON g.oid=am.roleid WHERE g.rolname='exlib_catalog_loader'")" = "1" ] \
  && [ "$(Q "SELECT m.rolname FROM pg_auth_members am JOIN pg_roles g ON g.oid=am.roleid JOIN pg_roles m ON m.oid=am.member WHERE g.rolname='exlib_catalog_loader'")" = "exlib2z_impostor" ] \
  && ok "F14-setup: exlib_catalog_loader now held by an IMPOSTOR with identical count, grantor, and options (member is the ONLY differing field)" \
  || bad "F14-setup: member substitution not landed"
expect_refusal "F14: COUNT-PRESERVING MEMBER SUBSTITUTION refused - the absolute authority baseline pin binds the member identity, not the membership count" \
  "$V" "$SEALPKG" "catalog authority baseline is not exactly the promoted shape" "$TMP/f14.out"
still_unsealed "F14b: nothing sealed anywhere" "$V"
surgery "F14 restore" "REVOKE exlib_catalog_loader FROM exlib2z_impostor;
  DROP ROLE exlib2z_impostor;
  GRANT exlib_catalog_loader TO postgres WITH ADMIN TRUE, INHERIT FALSE, SET FALSE;" \
  && [ "$(Q "$LDR_B")" = "$BASELINE_OK" ] \
  && ok "F14c: the loader membership RESTORED to the exact five-field baseline (asserted, not assumed)" \
  || bad "F14c: restoration failed"

# F15 COUNT-PRESERVING ADMIN-OPTION FLIP (cluster-wide; restored).
new_variant
surgery "F15 admin-option flip" "REVOKE ADMIN OPTION FOR exlib_catalog_reviewer FROM postgres;" \
  && [ "$(Q "SELECT count(*)::text||'/'||bool_and(am.admin_option)::text FROM pg_auth_members am JOIN pg_roles g ON g.oid=am.roleid WHERE g.rolname='exlib_catalog_reviewer'")" = "1/false" ] \
  && ok "F15-setup: the reviewer grant's ADMIN option is flipped in place (count 1, member postgres, grantor supabase_admin - the option is the ONLY differing field)" \
  || bad "F15-setup: option flip not landed"
expect_refusal "F15: COUNT-PRESERVING ADMIN-OPTION FLIP refused - the absolute authority baseline pin binds every option column" \
  "$V" "$SEALPKG" "catalog authority baseline is not exactly the promoted shape" "$TMP/f15.out"
still_unsealed "F15b: nothing sealed anywhere" "$V"
surgery "F15 restore" "GRANT exlib_catalog_reviewer TO postgres WITH ADMIN TRUE, INHERIT FALSE, SET FALSE;" \
  && [ "$(Q "$REV_B")" = "$BASELINE_OK" ] \
  && ok "F15c: the reviewer membership RESTORED to the exact five-field baseline (asserted, not assumed)" \
  || bad "F15c: restoration failed"

# F16 COUNT-PRESERVING GRANTOR SUBSTITUTION (cluster-wide; restored;
# simulated by direct shared-catalog surgery - PG16 records any
# superuser-without-ADMIN grant as the bootstrap superuser's, so no
# real GRANT can produce this state).
new_variant
surgery "F16 grantor substitution" "CREATE ROLE exlib2z_grantor2 SUPERUSER;
  UPDATE pg_auth_members SET grantor = (SELECT oid FROM pg_roles WHERE rolname='exlib2z_grantor2')
   WHERE roleid = (SELECT oid FROM pg_roles WHERE rolname='exlib_catalog_admission')
     AND member = (SELECT oid FROM pg_roles WHERE rolname='postgres');" \
  && [ "$(Q "SELECT g.rolname||'>'||m.rolname||'@'||gr.rolname||':'||am.admin_option::text||':'||am.inherit_option::text||':'||am.set_option::text FROM pg_auth_members am JOIN pg_roles g ON g.oid=am.roleid JOIN pg_roles m ON m.oid=am.member JOIN pg_roles gr ON gr.oid=am.grantor WHERE g.rolname='exlib_catalog_admission'")" = "exlib_catalog_admission>postgres@exlib2z_grantor2:true:false:false" ] \
  && ok "F16-setup: the admission grant's recorded grantor is SUBSTITUTED in place (count 1, member postgres, options identical - grantor is the ONLY differing field)" \
  || bad "F16-setup: grantor substitution not landed"
expect_refusal "F16: COUNT-PRESERVING GRANTOR SUBSTITUTION refused - the absolute authority baseline pin binds the grantor identity" \
  "$V" "$SEALPKG" "catalog authority baseline is not exactly the promoted shape" "$TMP/f16.out"
still_unsealed "F16b: nothing sealed anywhere" "$V"
surgery "F16 restore" "UPDATE pg_auth_members SET grantor = (SELECT oid FROM pg_roles WHERE rolname='supabase_admin')
   WHERE roleid = (SELECT oid FROM pg_roles WHERE rolname='exlib_catalog_admission')
     AND member = (SELECT oid FROM pg_roles WHERE rolname='postgres');
  DROP ROLE exlib2z_grantor2;" \
  && [ "$(Q "$ADM_B")" = "$BASELINE_OK" ] \
  && ok "F16c: the admission membership RESTORED to the exact five-field baseline (asserted, not assumed)" \
  || bad "F16c: restoration failed"

# F17 WRONG AUTHORITY: executed by a non-operator login role.
new_variant
QA "CREATE ROLE exlib2z_intruder LOGIN" >/dev/null 2>&1
if psql -h "$SOCK" -U exlib2z_intruder -d "$V" -X -v ON_ERROR_STOP=1 -q -f "$SEALPKG" > "$TMP/f17.out" 2>&1; then
  bad "F17: WRONG AUTHORITY SUCCEEDED (it must refuse)"
else
  grep -qE 'must run as the hosted operator role postgres|permission denied' "$TMP/f17.out" \
    && ok "F17: WRONG AUTHORITY refused - a non-operator role cannot execute the package (explicit posture gate and table privileges both stand; the seal function itself is revoked from every client role)" \
    || bad "F17: refused by an unexpected gate" "$(tail -2 "$TMP/f17.out" | tr '\n' ' ')"
fi
still_unsealed "F17b: nothing sealed anywhere" "$V"
QA "DROP ROLE exlib2z_intruder" >/dev/null 2>&1

# F18 TAMPERED COPY, WRONG KEY IN THE ACT: an awk-derived COPY whose
# act block calls the seal function with a key that exists nowhere -
# every precondition passes on the intact database, the FUNCTION
# fails mid-package ('unknown run key'), and the WHOLE transaction
# rolls back with the run left unsealed.
new_variant
TAMPERED_KEY="$TMP/exlib2z-tampered-key.sql"
awk '
  /THE S5 ACT/ { inw=1 }
  /Postconditions \(ANY mismatch rolls back EVERYTHING/ { inw=0 }
  { line=$0
    if (inw) gsub(/exlib2u-plank-release1-staged-v1/, "exlib2z-key-that-exists-nowhere", line)
    print line }' "$SEALPKG" > "$TAMPERED_KEY"
[ "$(grep -c 'exlib2z-key-that-exists-nowhere' "$TAMPERED_KEY")" = "2" ] \
  && ok "F18-setup: tampered COPY built (the act calls the seal with a nonexistent key; preconditions and postconditions untouched; repository package untouched)" \
  || bad "F18-setup: tamper failed ($(grep -c 'exlib2z-key-that-exists-nowhere' "$TAMPERED_KEY") occurrences)"
expect_refusal "F18: MID-PACKAGE FUNCTION FAILURE - the seal function itself raises 'unknown run key' after every precondition passed, and the whole transaction rolls back" \
  "$V" "$TAMPERED_KEY" "unknown run key" "$TMP/f18.out"
still_unsealed "F18b: ATOMICITY PROVEN - the run is still unsealed after the mid-package failure" "$V"
[ "$(Q "$RUN_SQL" "$V")" = "$RUN_STAGED" ] \
  && ok "F18c: the staged run is byte-posture intact (nothing about it moved)" \
  || bad "F18c: staged run drifted"

# F19 TAMPERED COPY, IMPOSSIBLE POSTCONDITION: an awk-derived COPY
# whose post-state vector literal is wrong - every precondition
# passes, THE SEAL EXECUTES inside the transaction, the
# postcondition refuses, and the ROLLBACK UNDOES THE SEAL ITSELF:
# the strongest atomicity proof this package can give.
new_variant
TAMPERED_POST="$TMP/exlib2z-tampered-post.sql"
awk '
  /Postconditions \(ANY mismatch rolls back EVERYTHING/ { inw=1 }
  { line=$0
    if (inw) gsub(/3\/3\/5\/3\/6\/1\/2\/2\/1\/6\/3/, "9/9/9/9/9/9/9/9/9/9/9", line)
    print line }' "$SEALPKG" > "$TAMPERED_POST"
[ "$(grep -c '9/9/9/9/9/9/9/9/9/9/9' "$TAMPERED_POST")" = "2" ] \
  && ok "F19-setup: tampered COPY built (the postcondition demands an impossible vector; preconditions and the act untouched; repository package untouched)" \
  || bad "F19-setup: tamper failed ($(grep -c '9/9/9/9/9/9/9/9/9/9/9' "$TAMPERED_POST") occurrences)"
expect_refusal "F19: IMPOSSIBLE POSTCONDITION - the seal EXECUTED inside the transaction and the failed postcondition rolled it back whole" \
  "$V" "$TAMPERED_POST" "the seal must move NO counts" "$TMP/f19.out"
still_unsealed "F19b: THE SEAL ITSELF WAS ROLLED BACK - the run is still unsealed and unapproved after a refusal that happened AFTER the seal call" "$V"
[ "$(Q "$RUN_SQL" "$V")" = "$RUN_STAGED" ] && [ "$(Q "$COUNTS_SQL" "$V")" = "$STAGED_VECTOR" ] \
  && ok "F19c: the staged world is exactly intact (posture and vector both the staged baseline)" \
  || bad "F19c: state drifted through the rollback"

echo
echo "=== G. Concurrency: two simultaneous executions - exactly ONE seals"
new_variant
( run_pkg "$V" "$SEALPKG" "$TMP/g1.out"; echo $? > "$TMP/g1.rc" ) &
( run_pkg "$V" "$SEALPKG" "$TMP/g2.out"; echo $? > "$TMP/g2.rc" ) &
wait
RC1=$(cat "$TMP/g1.rc"); RC2=$(cat "$TMP/g2.rc")
if { [ "$RC1" = "0" ] && [ "$RC2" != "0" ]; } || { [ "$RC1" != "0" ] && [ "$RC2" = "0" ]; }; then
  ok "G1: the race has exactly ONE sealer (rc pair $RC1/$RC2) - the SHARE ROW EXCLUSIVE locks serialize the two runs and the loser refuses at the SPENT gate"
else
  bad "G1: race outcome wrong (rc pair $RC1/$RC2)"
fi
LOSER_OUT="$TMP/g1.out"; [ "$RC1" != "0" ] || LOSER_OUT="$TMP/g2.out"
grep -q 'ONE-USE and this database shows it SPENT' "$LOSER_OUT" \
  && ok "G2: the losing session refused with the exact SPENT message" \
  || bad "G2: loser refused by an unexpected gate" "$(tail -2 "$LOSER_OUT" | tr '\n' ' ')"
[ "$(Q "$RUN_SQL" "$V")" = "$RUN_SEALED" ] && [ "$(Q "$COUNTS_SQL" "$V")" = "$STAGED_VECTOR" ] \
  && [ "$(Q "SELECT count(DISTINCT sealed_at) FROM exercise_catalog_import_runs WHERE sealed_at IS NOT NULL" "$V")" = "1" ] \
  && ok "G3: the raced database holds EXACTLY one seal (sealed posture, staged vector, a single seal instant)" \
  || bad "G3: raced state wrong"

echo
echo "=== H. Harness cleanup check"
for i in $(seq 1 "$VN"); do QA "DROP DATABASE IF EXISTS exlib2z_v$i" >/dev/null 2>&1; done
QA "DROP DATABASE IF EXISTS exlib2z_prestate" >/dev/null 2>&1
[ "$(QA "SELECT count(*) FROM pg_database WHERE datname LIKE 'exlib2z%'")" = "0" ] \
  && ok "H1: zero leftover fixture databases" \
  || bad "H1: leftover databases remain"
[ "$(Q "$LDR_B")" = "$BASELINE_OK" ] && [ "$(Q "$REV_B")" = "$BASELINE_OK" ] && [ "$(Q "$ADM_B")" = "$BASELINE_OK" ] && [ "$(Q "$PUB_B")" = "$BASELINE_OK" ] \
  && [ "$(Q "$AUTH_PIN_SQL")" = "$AUTH_PIN_OK" ] \
  && [ "$(QA "SELECT count(*) FROM pg_roles WHERE rolname IN ('exlib2z_impostor','exlib2z_grantor2','exlib2z_intruder')")" = "0" ] \
  && ok "H2: the cluster-wide authority baseline is byte-identical after every authority control (all three substitutions restored to the exact five-field shape; zero harness roles remain)" \
  || bad "H2: authority baseline not restored"

echo
printf '%s passed, %s failed\n' "$PASS" "$FAIL"
[ "$FAIL" = "0" ] || exit 1
