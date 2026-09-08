#!/usr/bin/env bash
# ============================================================
# EXLIB-2U LIVE verifier — the S4 staged-run package, proven
# against disposable local PostgreSQL ONLY.
#
# Boots a throwaway socket-only cluster (no TCP; no hosted contact;
# torn down on exit), reproduces the hosted role posture (bootstrap
# superuser supabase_admin as platform substrate; NON-SUPERUSER
# postgres as the working operator), applies migrations 001-027
# exactly once, seeds the representative 84-exercise tenant fixture,
# executes the COMMITTED, SPENT EXLIB-2K + 2O + 2P + 2Q + 2R + 2Y
# packages once each to produce the EXACT post-2Y hosted pre-state
# (vector 3/3/5/3/6/1/2/2/0/0/3, three APPROVED snapshots carrying
# the applied human tuples, three immutable review events, ZERO runs
# and ZERO run items), and then proves the EXLIB-2U package:
#   D. the happy path — exactly ONE staged run born in the selected
#      Design-S4 posture (dry_run=false, unapproved, unsealed,
#      unrevoked, operational fields NULL, the reserved evidence
#      values exact) plus exactly SIX membership rows, the vector
#      moving in exactly two positions (runs 0->1, items 0->6),
#      every snapshot/event/unrelated surface digest-identical,
#      authority untouched, claims intact — AND the instructed LIVE
#      non-deliverability proof: an AUTHENTICATED direct
#      deliver_catalog_exercises call on this disposable cluster
#      refuses the staged run with zero state change;
#   E. ONE-USE — the second execution refuses at the vector gate;
#   F. a refusal matrix, each variant on a FRESH pre-state copy with
#      whole-transaction rollback proven after every refusal:
#      pre-existing reserved-key run (vector manifestation), drifted
#      approval tuple, drifted governed field, missing identity,
#      COUNT-CAMOUFLAGED duplicate identity (with a forged pad event
#      so the whole vector reads baseline), tampered event surface
#      (count-camouflaged tuple drift), alias drift, wrong
#      authority, PARTIAL-STAGING atomicity (tampered copy dropping
#      one exercise member), tampered reserved evidence (tampered
#      copy changing the rationale the act writes), a DISABLED
#      run-row freeze trigger, a DECOY-REBOUND membership freeze
#      trigger (same name and events, different function), and three
#      COUNT-PRESERVING authority substitutions (member, admin
#      option, grantor — each restored to the exact five-field
#      baseline afterward, restoration asserted);
#   G. a REAL two-session concurrency race proving exactly one
#      committer.
#
# Every counterfactual mutation is applied through surgery(), which
# FAILS LOUDLY if the mutation does not land. Tampered variants are
# awk-derived COPIES under the throwaway directory; the repository
# package is never modified.
#
# Run from the repository root:
#   bash scripts/verify-exlib2u-live.sh
# ============================================================
set -u
cd "$(dirname "$0")/.."

PACKAGE="docs/exlib2u-staged-run-package.sql"
PKG2K="docs/exlib2k-plank-catalog-load-package.sql"
PKG2O="docs/exlib2o-target-snapshot-load-package.sql"
PKG2P="docs/exlib2p-plank-database-review-package.sql"
PKG2Q="docs/exlib2q-plank-import-admission-package.sql"
PKG2R="docs/exlib2r-plank-publication-package.sql"
PKG2Y="docs/exlib2y-snapshot-review-application-package.sql"
AUTH_FORM="docs/exlib2v-s4-authority-inputs-form-completed.json"
DEC_PL="docs/exlib2w-plank-snapshot-review-form-v2-completed.json"
DEC_DB="docs/exlib2w-dead-bug-snapshot-review-form-v2-completed.json"
DEC_AW="docs/exlib2w-ab-wheel-rollout-snapshot-review-form-v2-completed.json"

PASS=0
FAIL=0
ok()  { PASS=$((PASS+1)); printf '  PASS  %s\n' "$1"; }
bad() { FAIL=$((FAIL+1)); printf '  FAIL  %s\n' "$1"; [ -n "${2:-}" ] && printf '        %s\n' "$2"; return 0; }

TMP="$(mktemp -d /tmp/exlib2u-pg.XXXXXX)"
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
PRE_VECTOR="3/3/5/3/6/1/2/2/0/0/3"
POST_VECTOR="3/3/5/3/6/1/2/2/1/6/3"
PL='e21b2c00-0000-4000-a000-000000000001'
DBU='e21b2c00-0000-4000-a000-000000000002'
AWU='e21b2c00-0000-4000-a000-000000000003'
TS="2026-09-07T19:06:00-04:00"
RUN_KEY='exlib2u-plank-release1-staged-v1'
RATIONALE='Approved for staged delivery validation of Plank and its reviewed progression and substitution targets. This does not authorize sealing, production delivery, or enabling the delivery flag; those remain separately gated.'
ROWS_SQL="SELECT string_agg(c.logical_id::text||'#'||c.review_status||'#'||coalesce(c.reviewed_by,'<null>')||'#'||coalesce((c.reviewed_at = TIMESTAMPTZ '$TS')::text,'<null>')||'#'||coalesce(c.review_rationale,'<null>'), E'\n' ORDER BY c.logical_id) FROM exercise_catalog c WHERE c.is_active = true"
ROWS_APPROVED="$PL#approved#Joseph Carfagno#true#Approved as an accurate timed, bilateral bodyweight core exercise.
$DBU#approved#Joseph Carfagno#true#Approved as an accurate alternating bodyweight core and mobility exercise.
$AWU#approved#Joseph Carfagno#true#Approved as an accurate advanced bilateral weighted-repetition core exercise."
EV_SQL="SELECT coalesce(string_agg(c.logical_id::text||'#'||e.from_status||'>'||e.to_status||'#'||e.reviewed_by||'#'||(e.reviewed_at = TIMESTAMPTZ '$TS')::text, E'\n' ORDER BY c.logical_id),'<none>') FROM exercise_catalog_review_events e JOIN exercise_catalog c ON c.id = e.catalog_id"
EV_APPLIED="$PL#pending>approved#Joseph Carfagno#true
$DBU#pending>approved#Joseph Carfagno#true
$AWU#pending>approved#Joseph Carfagno#true"
RUN_SQL="SELECT coalesce((SELECT r.run_key||'#'||r.dry_run::text||'#'||r.approved_for_delivery::text||'#'||(r.sealed_at IS NULL)::text||'#'||(r.revoked_at IS NULL)::text||'#'||(r.started_at IS NULL AND r.completed_at IS NULL AND r.result_counts IS NULL)::text||'#'||(r.created_at IS NOT NULL)::text||'#'||r.product_approved_by||'#'||(r.product_approved_at = TIMESTAMPTZ '2026-09-07T11:05:00-04:00')::text||'#'||r.legal_approved_by||'#'||(r.legal_approved_at = TIMESTAMPTZ '2026-09-07T11:05:00-04:00')::text||'#'||(r.approval_rationale = '$RATIONALE')::text FROM exercise_catalog_import_runs r WHERE r.run_key = '$RUN_KEY'), '<none>')"
RUN_STAGED="$RUN_KEY#false#false#true#true#true#true#Joseph Carfagno#true#Joseph Carfagno#true#true"
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
DELIVER_PRED_SQL="SELECT count(*) FROM exercise_catalog_import_runs r WHERE r.run_key = '$RUN_KEY' AND r.approved_for_delivery = true AND r.dry_run = false AND r.sealed_at IS NOT NULL AND r.revoked_at IS NULL"
UNREADY_SQL="SELECT count(*) FROM exercise_catalog_run_items ri JOIN exercise_catalog c ON c.id = ri.catalog_id WHERE ri.run_id = (SELECT id FROM exercise_catalog_import_runs WHERE run_key='$RUN_KEY') AND (c.review_status <> 'approved' OR c.is_active = false OR c.reviewed_by IS NULL OR char_length(btrim(c.reviewed_by)) = 0 OR c.review_rationale IS NULL OR char_length(btrim(c.review_rationale)) = 0)"
TRIG_SQL="SELECT (SELECT count(*) FROM pg_catalog.pg_trigger t WHERE t.tgrelid='public.exercise_catalog_import_runs'::regclass AND t.tgname='exercise_catalog_import_runs_freeze_trigger' AND t.tgfoid='public.exlib_freeze_run_row()'::regprocedure AND t.tgtype=23 AND t.tgenabled='O')::text || '/' || (SELECT count(*) FROM pg_catalog.pg_trigger t WHERE t.tgrelid='public.exercise_catalog_import_runs'::regclass AND NOT t.tgisinternal)::text || '/' || (SELECT count(*) FROM pg_catalog.pg_trigger t WHERE t.tgrelid='public.exercise_catalog_run_items'::regclass AND t.tgname='exercise_catalog_run_items_freeze_trigger' AND t.tgfoid='public.exlib_freeze_run_membership()'::regprocedure AND t.tgtype=31 AND t.tgenabled='O')::text || '/' || (SELECT count(*) FROM pg_catalog.pg_trigger t WHERE t.tgrelid='public.exercise_catalog_run_items'::regclass AND NOT t.tgisinternal)::text"
TRIG_OK="1/1/1/1"
AUTH_PIN_SQL="SELECT string_agg(g.rolname||'>'||m.rolname||'@'||gr.rolname||':'||am.admin_option::text||':'||am.inherit_option::text||':'||am.set_option::text, E'\n' ORDER BY g.rolname, m.rolname, gr.rolname) FROM pg_catalog.pg_auth_members am JOIN pg_roles g ON g.oid=am.roleid JOIN pg_roles m ON m.oid=am.member JOIN pg_roles gr ON gr.oid=am.grantor WHERE g.rolname IN ('exlib_catalog_loader','exlib_catalog_reviewer','exlib_catalog_admission','exlib_catalog_admin')"
AUTH_PIN_OK="exlib_catalog_admin>postgres@supabase_admin:true:false:false
exlib_catalog_admission>postgres@supabase_admin:true:false:false
exlib_catalog_loader>postgres@supabase_admin:true:false:false
exlib_catalog_reviewer>postgres@supabase_admin:true:false:false"

echo
echo "=== A. Package identity, provenance, and shape"
[ -f "$PACKAGE" ] && ok "A1: the prepared package exists at $PACKAGE (docs-only, never under supabase/migrations/)" \
  || { bad "A1: package missing"; exit 1; }
for spec in "$AUTH_FORM:3416:6cf77759f7a8ddf89d32b2fd225bcbe0eddaf09587dcc9d01a657752b9adeeae" \
            "$DEC_PL:14505:eec41ded250147da0f24749b0709474897043c7e385e4dc3072576daaa500fba" \
            "$DEC_DB:14463:def64ac383703fa89160478726e395db8b1187ad7d0b5aabf7cd0d8206c503c6" \
            "$DEC_AW:14516:dee585f9470b8816e6df706f8c0c081ebf22efc5842d5802a4ecd8daaea2cba9" \
            "$PKG2K:29760:a1b6dd55850c5d544e2f484d1ce4833b41deec7f3dd4d4c2373cb3b50daaccf0" \
            "$PKG2O:39230:4c0d74f942da4e92efab5923a435512c750c6d794077804ffeee8c0c305c966d" \
            "$PKG2P:37702:76d1d67d6ec2bafc49ef43a6312700559cd9eeee4b8b9433868de9daf95dc666" \
            "$PKG2Q:39382:b15b9313db5efe679ca0d13cd0d9b9d97fd9316ec1d66d99c5bba6ca47529e57" \
            "$PKG2R:48913:96ade4887320df83a3032fbb3afcf9566ecc4436276ebe6a54e2af07727f68de" \
            "$PKG2Y:25193:74934419d027b477933f01bcbd2f4984700b34c6416ecd9c43c64bbd528757e0"; do
  f="${spec%%:*}"; rest="${spec#*:}"; want_b="${rest%%:*}"; want_s="${rest#*:}"
  got_b=$(wc -c < "$f" | tr -d ' '); got_s=$(shasum -a 256 "$f" | awk '{print $1}')
  [ "$got_b/$got_s" = "$want_b/$want_s" ] \
    && ok "A2: $f holds its exact promoted fingerprint" \
    || { bad "A2: $f drifted ($got_b/$got_s)"; exit 1; }
done
PSHA=$(shasum -a 256 "$PACKAGE" | awk '{print $1}')
PBYTES=$(wc -c < "$PACKAGE" | tr -d ' ')
ok "A3: package under test: $PBYTES bytes, sha256 $PSHA (executed as exactly this file everywhere below)"
grep -q 'PREPARED — NOT EXECUTED' "$PACKAGE" && grep -q 'ttybyljytiwntvorugcv' "$PACKAGE" \
  && grep -q 'ONE-USE, NOT idempotent' "$PACKAGE" && grep -q 'Claude and never by any automated pipeline' "$PACKAGE" \
  && ok "A4: the package is labeled PREPARED - NOT EXECUTED / ONE-USE and names the only eventual hosted target and executor boundary" \
  || bad "A4: labels missing"
RUN_INS=$(grep -c '^INSERT INTO public\.exercise_catalog_import_runs$' "$PACKAGE" || true)
ITEM_INS=$(grep -c '^INSERT INTO public\.exercise_catalog_run_items' "$PACKAGE" || true)
ALL_INS=$(grep -c '^INSERT INTO' "$PACKAGE" || true)
UPDATES=$(grep -c '^UPDATE ' "$PACKAGE" || true)
DELETES=$(grep -c '^DELETE ' "$PACKAGE" || true)
SEAL_CALLS=$(grep -cE "exlib_approve_and_seal_run\('|PERFORM[[:space:]]+.*exlib_approve_and_seal_run|exlib_revoke_run_delivery\('" "$PACKAGE" || true)
DELIVER_CALLS=$(grep -cE "deliver_catalog_exercises\('|rollback_catalog_delivery\('|PERFORM[[:space:]]+.*deliver_catalog_exercises" "$PACKAGE" || true)
SET_FORBIDDEN=$(grep -cE '^[[:space:]]*(approved_for_delivery|sealed_at|revoked_at|started_at|completed_at|result_counts|created_at)[[:space:]]*,?[[:space:]]*$' "$PACKAGE" || true)
BEGINS=$(grep -c '^BEGIN;$' "$PACKAGE" || true)
COMMITS=$(grep -c '^COMMIT;$' "$PACKAGE" || true)
[ "$RUN_INS/$ITEM_INS/$ALL_INS/$UPDATES/$DELETES/$SEAL_CALLS/$DELIVER_CALLS/$SET_FORBIDDEN/$BEGINS/$COMMITS" = "1/2/3/0/0/0/0/0/1/1" ] \
  && ok "A5: package shape exact - exactly ONE run INSERT + TWO run-item INSERTs (three INSERTs total), ZERO UPDATE/DELETE statements, ZERO seal/revoke/deliver/rollback calls, the run INSERT column list never names a seal/approval-state or operational column, ONE BEGIN and ONE COMMIT" \
  || bad "A5: shape wrong ($RUN_INS/$ITEM_INS/$ALL_INS/$UPDATES/$DELETES/$SEAL_CALLS/$DELIVER_CALLS/$SET_FORBIDDEN/$BEGINS/$COMMITS)"
SNAP_UUIDS=$(grep -cE 'ca566325-8d0d-4152-a15d-63baa065ac1d|1ce09c1f-c13d-4231-8e12-6f35cfd761b5|c715d840-944b-4019-b984-1687accffcf4|33e180fb|4d01df9d|081f696a' "$PACKAGE" || true)
[ "$SNAP_UUIDS" = "0" ] \
  && ok "A6: NO hosted snapshot or event surrogate UUID anywhere - members resolve through governed logical identity + is_active and (logical_id, alias) pairs only" \
  || bad "A6: a hosted surrogate literal appears ($SNAP_UUIDS)"
grep -q "run_key = '$RUN_KEY'" "$PACKAGE" \
  && [ "$(printf '%s' "$RUN_KEY" | wc -c | tr -d ' ')" = "32" ] \
  && ok "A7: the reserved run key is bound verbatim (32 chars, lawful under the 8..200 btrim CHECK)" \
  || bad "A7: run-key binding wrong"

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
  && ok "B4: representative tenant fixture in place - exactly 84 exercises across four users, each with a seeded Plank (first user's id captured for the live delivery-refusal probe)" \
  || bad "B4: fixture wrong"

echo
echo "=== C. The COMMITTED 2K+2O+2P+2Q+2R+2Y packages build the EXACT post-2Y hosted pre-state"
for step in "2k:$PKG2K" "2o:$PKG2O" "2p:$PKG2P" "2q:$PKG2Q" "2r:$PKG2R" "2y:$PKG2Y"; do
  nm="${step%%:*}"; f="${step#*:}"
  psql -h "$SOCK" -U postgres -d postgres -X -v ON_ERROR_STOP=1 -q -f "$f" > "$TMP/$nm.out" 2>&1 \
    && ok "C1-$nm: the committed $nm package executed once" \
    || { bad "C1-$nm: package failed" "$(tail -3 "$TMP/$nm.out" | tr '\n' ' ')"; exit 1; }
done
[ "$(Q "$COUNTS_SQL")" = "$PRE_VECTOR" ] \
  && ok "C2: the pre-state is EXACTLY the post-EXLIB-2Y hosted surface ($PRE_VECTOR - three review events, ZERO runs, ZERO run items)" \
  || bad "C2: pre-state vector wrong ($(Q "$COUNTS_SQL"))"
[ "$(Q "$ROWS_SQL")" = "$ROWS_APPROVED" ] && [ "$(Q "$EV_SQL")" = "$EV_APPLIED" ] \
  && ok "C3: all three snapshots are APPROVED carrying the applied EXLIB-2Y tuples with their three immutable events - exactly the state the reserved membership decision names" \
  || bad "C3: rows/events pre-state wrong"
CATALOG_PRE=$(Q "$CATALOG_SQL"); NEUTRAL_PRE=$(Q "$NEUTRAL_SQL"); TENANT_PRE=$(Q "$TENANT_SQL")
[ -n "$CATALOG_PRE" ] && [ -n "$NEUTRAL_PRE" ] && [ -n "$TENANT_PRE" ] \
  && ok "C4: pre-state digests captured (snapshots+events, unrelated catalog surfaces, tenant)" \
  || bad "C4: digest capture failed"
[ "$(Q "SELECT orphaned_claims::text||'/'||unclaimed_bearers::text FROM exlib_verify_catalog_claims()")" = "0/0" ] \
  && ok "C5: the catalog claims invariant holds at the pre-state (0/0)" \
  || bad "C5: claims invariant broken at pre-state"
QA "CREATE DATABASE exlib2u_prestate TEMPLATE postgres OWNER postgres" >/dev/null 2>&1 \
  && ok "C6: pre-state TEMPLATE captured (every refusal variant gets a byte-identical fresh copy)" \
  || bad "C6: template capture failed"

echo
echo "=== D. Happy path: EXACTLY one staged run + six members, structurally non-deliverable, S5-promotable"
psql -h "$SOCK" -U postgres -d postgres -X -v ON_ERROR_STOP=1 -q -f "$PACKAGE" > "$TMP/2u.out" 2>&1 \
  && ok "D1: the EXLIB-2U package executed cleanly (one transaction; every precondition and postcondition satisfied)" \
  || { bad "D1: package failed" "$(tail -3 "$TMP/2u.out" | tr '\n' ' ')"; exit 1; }
[ "$(Q "$COUNTS_SQL")" = "$POST_VECTOR" ] \
  && ok "D2: the vector moved in EXACTLY two positions ($PRE_VECTOR -> $POST_VECTOR): one run, six run items, and NOTHING else anywhere" \
  || bad "D2: vector wrong ($(Q "$COUNTS_SQL"))"
[ "$(Q "$RUN_SQL")" = "$RUN_STAGED" ] \
  && ok "D3: the run row is EXACTLY the Design-S4 SELECTED posture - dry_run=false, unapproved, unsealed, unrevoked, operational fields NULL, and the reserved evidence values verbatim (Joseph Carfagno twice at the 11:05 EDT authority instant + the exact rationale)" \
  || bad "D3: run row wrong ($(Q "$RUN_SQL"))"
[ "$(Q "$MEMBERS_SQL")" = "$MEMBERS_STAGED" ] \
  && ok "D4: the six membership rows are EXACTLY ALL_THREE_IDENTITIES - three exercise members by logical identity plus the three catalog aliases" \
  || bad "D4: membership wrong ($(Q "$MEMBERS_SQL"))"
[ "$(Q "$CATALOG_SQL")" = "$CATALOG_PRE" ] \
  && ok "D5: the snapshot AND review-event surfaces are digest-identical - the S4 act reads the approved world and touches none of it (created_at instants ride inside the digests)" \
  || bad "D5: snapshot/event surface changed"
[ "$(Q "$NEUTRAL_SQL")" = "$NEUTRAL_PRE" ] \
  && ok "D6: every unrelated catalog surface is digest-identical (anatomy, aliases, claims, content, expected relationships, projection)" \
  || bad "D6: an unrelated surface changed"
[ "$(Q "$TENANT_SQL")" = "$TENANT_PRE" ] \
  && ok "D7: both tenant tables are count + whole-row digest identical - STAGING IS NOT DELIVERY; zero product change" \
  || bad "D7: tenant surface changed"
[ "$(Q "$LDR_B")" = "$BASELINE_OK" ] && [ "$(Q "$REV_B")" = "$BASELINE_OK" ] && [ "$(Q "$ADM_B")" = "$BASELINE_OK" ] && [ "$(Q "$PUB_B")" = "$BASELINE_OK" ] \
  && ok "D8: all four authority baselines byte-identical - this package changes NO authority" \
  || bad "D8: authority drifted"
[ "$(Q "$DELIVER_PRED_SQL")" = "0" ] \
  && ok "D9: STRUCTURAL non-deliverability - the delivery gate's own five-conjunct predicate matches ZERO rows for the reserved key" \
  || bad "D9: the staged run satisfies the delivery predicate"
DELIVER_OUT=$(QQ "SET app.uid = '$FIRST_UID'; SELECT deliver_catalog_exercises('$RUN_KEY');")
if printf '%s' "$DELIVER_OUT" | grep -q 'no sealed, approved, unrevoked delivery run for this key'; then
  ok "D10: LIVE non-deliverability - an AUTHENTICATED direct deliver_catalog_exercises call on this DISPOSABLE cluster refuses the staged run with the exact committed message (the auth gate passed first; the run gate refused)"
else
  bad "D10: delivery did not refuse as expected" "$(printf '%s' "$DELIVER_OUT" | tr '\n' ' ' | cut -c1-160)"
fi
[ "$(Q "$COUNTS_SQL")" = "$POST_VECTOR" ] && [ "$(Q "$TENANT_SQL")" = "$TENANT_PRE" ] \
  && ok "D11: the refused delivery attempt changed NOTHING (vector and both tenant digests identical)" \
  || bad "D11: the refused delivery attempt drifted state"
[ "$(Q "$UNREADY_SQL")" = "0" ] \
  && [ "$(Q "SELECT (count(*) FILTER (WHERE catalog_id IS NOT NULL))::text||'/'||(count(*) FILTER (WHERE catalog_alias_id IS NOT NULL))::text FROM exercise_catalog_run_items")" = "3/3" ] \
  && ok "D12: STRUCTURAL S5-promotability - the seal validation's own member query finds a NON-EMPTY membership (3 exercise + 3 alias members) with ZERO unready members; no seal was performed or simulated" \
  || bad "D12: seal-readiness shape wrong"
[ "$(Q "SELECT (approved_for_delivery = false AND sealed_at IS NULL) FROM exercise_catalog_import_runs WHERE run_key='$RUN_KEY'")" = "t" ] \
  && ok "D13: the run remains UNAPPROVED and UNSEALED after every probe - S5 belongs to a later, separately gated instruction" \
  || bad "D13: forbidden seal/approval state appeared"
[ "$(Q "SELECT orphaned_claims::text||'/'||unclaimed_bearers::text FROM exlib_verify_catalog_claims()")" = "0/0" ] \
  && ok "D14: the catalog claims invariant holds after staging (0/0)" \
  || bad "D14: claims invariant broken"
grep -q 'EXLIB-2U STAGED' "$TMP/2u.out" \
  && ok "D15: the package surfaced its result line (EXLIB-2U STAGED / 1 run / 6 items / staged_non_deliverable) - display evidence; the rows above are the binding proof" \
  || bad "D15: result line missing"
[ "$(Q "$TRIG_SQL")" = "$TRIG_OK" ] && [ "$(Q "$AUTH_PIN_SQL")" = "$AUTH_PIN_OK" ] \
  && ok "D16: the strengthened gates hold on the REAL post-migration database - both freeze triggers are EXACT enabled bindings (promoted name/table/function/event-set, sole non-internal trigger each) and the four-role authority baseline reads exactly member postgres @ grantor supabase_admin with ADMIN TRUE, INHERIT FALSE, SET FALSE" \
  || bad "D16: strengthened-gate surfaces wrong (trig=$(Q "$TRIG_SQL"))"

echo
echo "=== E. ONE-USE: the second execution refuses fail-closed"
psql -h "$SOCK" -U postgres -d postgres -X -v ON_ERROR_STOP=1 -q -f "$PACKAGE" > "$TMP/2u-second.out" 2>&1 \
  && bad "E1: the second execution SUCCEEDED (it must refuse)" \
  || { grep -q 'ONE-USE and its baseline is gone' "$TMP/2u-second.out" \
    && ok "E1: the second execution refused at the VECTOR gate (the staged run is visible; the zero-run baseline is gone) - ONE-USE proven on the staged database" \
    || bad "E1: refused by an unexpected gate" "$(tail -2 "$TMP/2u-second.out" | tr '\n' ' ')"; }
[ "$(Q "$COUNTS_SQL")" = "$POST_VECTOR" ] && [ "$(Q "$RUN_SQL")" = "$RUN_STAGED" ] && [ "$(Q "$MEMBERS_SQL")" = "$MEMBERS_STAGED" ] \
  && ok "E2: the refused re-run changed NOTHING (vector, run row, and membership all exactly the single staging)" \
  || bad "E2: the refused re-run drifted state"

echo
echo "=== F. Refusal matrix - each variant on a FRESH pre-state copy; rollback proven every time"
VN=0
V=""
new_variant() {
  VN=$((VN+1))
  V="exlib2u_v$VN"
  QA "DROP DATABASE IF EXISTS $V" >/dev/null 2>&1
  QA "CREATE DATABASE $V TEMPLATE exlib2u_prestate OWNER postgres" >/dev/null
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
no_staging() { # NAME DB - the refusal must have staged NOTHING for the reserved key
  [ "$(Q "SELECT count(*) FROM exercise_catalog_run_items" "$2")" = "0" ] \
    && [ "$(Q "SELECT count(*) FROM exercise_catalog_import_runs WHERE run_key='$RUN_KEY'" "$2")" = "0" ] \
    && ok "$1" || bad "$1" "staging leaked"
}
rolled_back_pristine() { # NAME DB - full pre-state (for variants whose surgery is not state-visible)
  [ "$(Q "$COUNTS_SQL" "$2")" = "$PRE_VECTOR" ] && [ "$(Q "$ROWS_SQL" "$2")" = "$ROWS_APPROVED" ] \
    && [ "$(Q "SELECT count(*) FROM exercise_catalog_import_runs" "$2")" = "0" ] \
    && ok "$1" || bad "$1" "counts=$(Q "$COUNTS_SQL" "$2")"
}

# F1 PRE-EXISTING RESERVED-KEY RUN: someone already created a run
# under the reserved key (a lawful born-unsealed INSERT). ANY run
# row moves the vector off the zero-run baseline, so the ONE-USE
# VECTOR gate refuses first — the package's separate run-key gate is
# provably SHADOWED defense-in-depth (a key can never exist while
# runs reads 0), and the record documents that.
new_variant
surgery "F1 reserved key pre-exists" "INSERT INTO exercise_catalog_import_runs (run_key, dry_run) VALUES ('$RUN_KEY', true);" \
  && [ "$(Q "SELECT count(*) FROM exercise_catalog_import_runs WHERE run_key='$RUN_KEY'" "$V")" = "1" ] \
  && ok "F1-setup: a foreign run already holds the reserved key (born unsealed, dry_run=true - a lawful direct INSERT)" \
  || bad "F1-setup: pre-existing run not landed"
expect_refusal "F1: PRE-EXISTING RESERVED-KEY RUN refused - the zero-run baseline is gone (the vector gate fires; the run-key gate stands behind it as shadowed defense-in-depth)" \
  "$V" "$PACKAGE" "ONE-USE and its baseline is gone" "$TMP/f1.out"
[ "$(Q "SELECT count(*) FROM exercise_catalog_import_runs" "$V")" = "1" ] && [ "$(Q "SELECT count(*) FROM exercise_catalog_run_items" "$V")" = "0" ] \
  && ok "F1b: the refusal wrote NOTHING (still exactly the one foreign run, zero items)" || bad "F1b: refusal drifted state"

# F2 DRIFTED APPROVAL TUPLE: Dead bug's reviewer rewritten (trigger-
# off harness corruption; the freeze trigger forbids this lawfully).
new_variant
surgery "F2 tuple drift" "ALTER TABLE exercise_catalog DISABLE TRIGGER USER;
  UPDATE exercise_catalog SET reviewed_by='Somebody Else' WHERE logical_id='$DBU' AND is_active;
  ALTER TABLE exercise_catalog ENABLE TRIGGER USER;" \
  && [ "$(Q "SELECT reviewed_by FROM exercise_catalog WHERE logical_id='$DBU' AND is_active" "$V")" = "Somebody Else" ] \
  && ok "F2-setup: the Dead bug approval tuple is drifted and REAL (reviewed_by no longer the applied human)" \
  || bad "F2-setup: drift not landed"
expect_refusal "F2: DRIFTED APPROVAL TUPLE refused - the Dead bug row no longer carries the applied EXLIB-2Y approval tuple the reserved membership decision names" \
  "$V" "$PACKAGE" "Dead bug snapshot does not carry the applied EXLIB-2Y approval tuple" "$TMP/f2.out"
no_staging "F2b: the refusal staged NOTHING (zero runs for the reserved key, zero items)" "$V"

# F3 DRIFTED GOVERNED FIELD: Ab wheel rollout difficulty flipped.
new_variant
surgery "F3 governed drift" "ALTER TABLE exercise_catalog DISABLE TRIGGER USER;
  UPDATE exercise_catalog SET difficulty='beginner' WHERE logical_id='$AWU' AND is_active;
  ALTER TABLE exercise_catalog ENABLE TRIGGER USER;" \
  && [ "$(Q "SELECT difficulty FROM exercise_catalog WHERE logical_id='$AWU' AND is_active" "$V")" = "beginner" ] \
  && ok "F3-setup: the governed drift is present and REAL (...0003 difficulty now reads beginner)" \
  || bad "F3-setup: drift not landed"
expect_refusal "F3: DRIFTED GOVERNED FIELD refused - the live Ab wheel rollout row no longer matches the promoted decision packet, so the reserved membership decision is VOID for that row" \
  "$V" "$PACKAGE" "Ab wheel rollout snapshot governed fields differ" "$TMP/f3.out"
no_staging "F3b: the refusal staged NOTHING" "$V"

# F4 MISSING IDENTITY: the Plank snapshot deactivated.
new_variant
surgery "F4 missing identity" "ALTER TABLE exercise_catalog DISABLE TRIGGER USER;
  UPDATE exercise_catalog SET is_active=false WHERE logical_id='$PL';
  ALTER TABLE exercise_catalog ENABLE TRIGGER USER;" \
  && [ "$(Q "SELECT count(*) FROM exercise_catalog WHERE logical_id='$PL' AND is_active" "$V")" = "0" ] \
  && ok "F4-setup: the Plank snapshot is deactivated (no active row at the governed identity)" \
  || bad "F4-setup: deactivation not landed"
expect_refusal "F4: MISSING IDENTITY refused - zero active rows at the Plank logical identity" \
  "$V" "$PACKAGE" "expected exactly one active Plank snapshot by logical identity, found 0" "$TMP/f4.out"
no_staging "F4b: the refusal staged NOTHING" "$V"

# F5 DUPLICATE IDENTITY, COUNT-CAMOUFLAGED: a second active Plank
# row (index-corruption simulation - both one-active unique indexes
# dropped; a REAL hosted database enforces them) with the Dead bug
# row, its anatomy row, and its review event removed, one pad
# anatomy row and one forged pad event added - so the whole state
# VECTOR stays exactly the baseline. This isolates the package's own
# per-identity one-active-row gate, which fires FIRST (identity
# gates precede the event-surface gate) independently of the
# indexes, the vector gate, and the now-corrupt event surface.
new_variant
surgery "F5 duplicate identity" "DROP INDEX exercise_catalog_one_active_logical_idx;
  DROP INDEX exercise_catalog_one_active_name_idx;
  ALTER TABLE exercise_catalog DISABLE TRIGGER USER;
  ALTER TABLE exercise_catalog_muscles DISABLE TRIGGER USER;
  ALTER TABLE exercise_catalog_review_events DISABLE TRIGGER USER;
  DELETE FROM exercise_catalog_review_events WHERE catalog_id = (SELECT id FROM exercise_catalog WHERE logical_id='$DBU');
  DELETE FROM exercise_catalog_muscles WHERE catalog_id = (SELECT id FROM exercise_catalog WHERE logical_id='$DBU');
  DELETE FROM exercise_catalog WHERE logical_id='$DBU';
  INSERT INTO exercise_catalog (logical_id, canonical_name, category, primary_muscle, equipment, laterality, tracking_mode, provenance, movement_pattern, training_role, difficulty, availability, review_status, reviewed_by, reviewed_at, review_rationale, is_active, catalog_version)
  SELECT logical_id, canonical_name, category, primary_muscle, equipment, laterality, tracking_mode, provenance, movement_pattern, training_role, difficulty, availability, review_status, reviewed_by, reviewed_at, review_rationale, true, 2
  FROM exercise_catalog WHERE logical_id='$PL' AND is_active;
  INSERT INTO exercise_catalog_muscles (catalog_id, muscle, role)
  SELECT id, 'obliques', 'secondary' FROM exercise_catalog WHERE logical_id='$PL' AND catalog_version=2;
  INSERT INTO exercise_catalog_review_events (catalog_id, from_status, to_status, reviewed_by, reviewed_at, review_rationale)
  SELECT id, 'pending', 'approved', 'Camouflage', TIMESTAMPTZ '$TS', 'pad event' FROM exercise_catalog WHERE logical_id='$PL' AND catalog_version=2;
  ALTER TABLE exercise_catalog_review_events ENABLE TRIGGER USER;
  ALTER TABLE exercise_catalog_muscles ENABLE TRIGGER USER;
  ALTER TABLE exercise_catalog ENABLE TRIGGER USER;" \
  && [ "$(Q "SELECT count(*) FROM exercise_catalog WHERE logical_id='$PL' AND is_active" "$V")" = "2" ] \
  && [ "$(Q "$COUNTS_SQL" "$V")" = "$PRE_VECTOR" ] \
  && ok "F5-setup: TWO active rows at the Plank logical identity while the vector reads EXACTLY the baseline (camouflage real: Dead bug row+muscle+event swapped for dup+pad+forged event)" \
  || bad "F5-setup: duplicate/camouflage not landed ($(Q "$COUNTS_SQL" "$V"))"
expect_refusal "F5: DUPLICATE IDENTITY refused - the package's own per-identity one-active-row gate fires ('found 2') independently of both unique indexes AND the vector gate AND the corrupted event surface behind it" \
  "$V" "$PACKAGE" "found 2" "$TMP/f5.out"
no_staging "F5b: the refusal staged NOTHING" "$V"

# F6 TAMPERED EVENT SURFACE, COUNT-CAMOUFLAGED: one event's reviewer
# rewritten in place (the events guard forbids UPDATE lawfully;
# trigger-off harness corruption). The vector still reads baseline
# and every snapshot row is intact, so the EVENT-SURFACE gate is the
# one that fires.
new_variant
surgery "F6 event tamper" "ALTER TABLE exercise_catalog_review_events DISABLE TRIGGER USER;
  UPDATE exercise_catalog_review_events SET reviewed_by='Nobody'
   WHERE catalog_id = (SELECT id FROM exercise_catalog WHERE logical_id='$AWU' AND is_active);
  ALTER TABLE exercise_catalog_review_events ENABLE TRIGGER USER;" \
  && [ "$(Q "SELECT count(*) FROM exercise_catalog_review_events WHERE reviewed_by='Nobody'" "$V")" = "1" ] \
  && [ "$(Q "$COUNTS_SQL" "$V")" = "$PRE_VECTOR" ] \
  && ok "F6-setup: one immutable event carries a foreign reviewer while the vector reads EXACTLY the baseline (guard-bypass simulation)" \
  || bad "F6-setup: event tamper not landed"
expect_refusal "F6: TAMPERED EVENT SURFACE refused - the event set is no longer exactly the three applied EXLIB-2Y events (count-camouflaged, so the event-surface gate itself fires)" \
  "$V" "$PACKAGE" "review-event surface is not exactly the three applied EXLIB-2Y events" "$TMP/f6.out"
no_staging "F6b: the refusal staged NOTHING" "$V"

# F7 ALIAS DRIFT: one catalog alias renamed in place (alias rows are
# immutable lawfully; trigger-off harness corruption, claims trigger
# disabled too so the claims count stays camouflaged).
new_variant
surgery "F7 alias drift" "ALTER TABLE exercise_catalog_aliases DISABLE TRIGGER USER;
  UPDATE exercise_catalog_aliases SET alias='Front plankX' WHERE alias='Front plank';
  ALTER TABLE exercise_catalog_aliases ENABLE TRIGGER USER;" \
  && [ "$(Q "SELECT count(*) FROM exercise_catalog_aliases WHERE alias='Front plankX'" "$V")" = "1" ] \
  && [ "$(Q "$COUNTS_SQL" "$V")" = "$PRE_VECTOR" ] \
  && ok "F7-setup: one alias renamed in place while the vector reads EXACTLY the baseline (the alias-member source no longer matches the promoted set)" \
  || bad "F7-setup: alias drift not landed"
expect_refusal "F7: ALIAS DRIFT refused - the alias surface is not exactly the three promoted aliases the reserved ALL_THREE_IDENTITIES membership binds" \
  "$V" "$PACKAGE" "catalog alias surface is not exactly the three promoted aliases" "$TMP/f7.out"
no_staging "F7b: the refusal staged NOTHING" "$V"

# F8 WRONG AUTHORITY: executed by a non-operator login role.
new_variant
QA "CREATE ROLE exlib2u_intruder LOGIN" >/dev/null 2>&1
if psql -h "$SOCK" -U exlib2u_intruder -d "$V" -X -v ON_ERROR_STOP=1 -q -f "$PACKAGE" > "$TMP/f8.out" 2>&1; then
  bad "F8: WRONG AUTHORITY SUCCEEDED (it must refuse)"
else
  grep -qE 'must run as the hosted operator role postgres|permission denied' "$TMP/f8.out" \
    && ok "F8: WRONG AUTHORITY refused - a non-operator role cannot execute the package (explicit posture gate and table privileges both stand)" \
    || bad "F8: refused by an unexpected gate" "$(tail -2 "$TMP/f8.out" | tr '\n' ' ')"
fi
rolled_back_pristine "F8b: the wrong-authority attempt wrote NOTHING (pristine pre-state)" "$V"
QA "DROP ROLE exlib2u_intruder" >/dev/null 2>&1

# F9 PARTIAL-STAGING ATOMICITY: a tampered COPY whose exercise-
# member INSERT drops the Dead bug identity (rewritten to a
# nonexistent logical) - the run row and five items insert inside
# the transaction, the postcondition vector sees 5 items instead of
# 6, and EVERYTHING rolls back including the run row.
new_variant
TAMPERED="$TMP/exlib2u-tampered-member.sql"
awk -v from="$DBU" -v to="e21b2c00-0000-4000-a000-000000000009" '
  /THE S4 ACT/ { inw=1 }
  /Postconditions \(ANY mismatch rolls back EVERYTHING\)/ { inw=0 }
  { if (inw && $0 ~ from) gsub(from, to); print }' "$PACKAGE" > "$TAMPERED"
grep -q 'e21b2c00-0000-4000-a000-000000000009' "$TAMPERED" \
  && [ "$(grep -c 'e21b2c00-0000-4000-a000-000000000009' "$TAMPERED")" = "1" ] \
  && ok "F9-setup: tampered COPY built (the act's exercise-member list now names a nonexistent identity; preconditions and postconditions untouched; repository package untouched)" \
  || bad "F9-setup: tamper failed"
expect_refusal "F9: PARTIAL STAGING impossible - the run and five members insert in-transaction, the postcondition sees 5 items instead of 6, and the WHOLE transaction rolls back" \
  "$V" "$TAMPERED" "post-state vector is" "$TMP/f9.out"
rolled_back_pristine "F9b: ATOMICITY PROVEN - after the failed partial staging, zero runs and zero items exist (nothing survived, not even the run row)" "$V"

# F10 TAMPERED RESERVED EVIDENCE: a tampered COPY whose act writes a
# DIFFERENT rationale than the reserved authority artifact's - the
# postcondition run-row comparison (which still carries the true
# reserved literal) refuses and everything rolls back.
new_variant
EVIDENCE_TAMPERED="$TMP/exlib2u-tampered-evidence.sql"
awk '
  /THE S4 ACT/ { inw=1 }
  /Postconditions \(ANY mismatch rolls back EVERYTHING\)/ { inw=0 }
  { line=$0
    if (inw) gsub(/Approved for staged delivery validation/, "Tampered for staged delivery validation", line)
    print line }' "$PACKAGE" > "$EVIDENCE_TAMPERED"
grep -q 'Tampered for staged delivery validation' "$EVIDENCE_TAMPERED" \
  && [ "$(grep -c 'Approved for staged delivery validation' "$EVIDENCE_TAMPERED")" = "$(( $(grep -c 'Approved for staged delivery validation' "$PACKAGE") - 1 ))" ] \
  && ok "F10-setup: tampered COPY built (the act now writes a NON-RESERVED rationale; the postcondition's reserved literal untouched; repository package untouched)" \
  || bad "F10-setup: evidence tamper failed"
expect_refusal "F10: TAMPERED RESERVED EVIDENCE refused - the staged row would carry a rationale the authority artifact never reserved; the postcondition run-row gate catches it and rolls back everything" \
  "$V" "$EVIDENCE_TAMPERED" "not exactly the selected staged posture with the reserved evidence" "$TMP/f10.out"
rolled_back_pristine "F10b: rollback proven - zero runs and zero items after the refused evidence-tampered run" "$V"

# F11 DISABLED FREEZE TRIGGER: the run-row freeze trigger exists
# with its exact promoted binding but is DISABLED (per-database
# state; the variant is discarded afterwards). The old "some
# non-internal trigger exists" shape would have PASSED this - the
# exact-binding gate demands tgenabled='O' and refuses.
new_variant
surgery "F11 trigger disabled" "ALTER TABLE exercise_catalog_import_runs DISABLE TRIGGER exercise_catalog_import_runs_freeze_trigger;" \
  && [ "$(Q "SELECT tgenabled FROM pg_trigger WHERE tgname='exercise_catalog_import_runs_freeze_trigger'" "$V")" = "D" ] \
  && ok "F11-setup: the run-row freeze trigger is DISABLED in place (exists, correct binding, tgenabled='D')" \
  || bad "F11-setup: disable not landed"
expect_refusal "F11: DISABLED FREEZE TRIGGER refused - the exact-binding gate demands the ENABLED promoted binding, not mere trigger existence" \
  "$V" "$PACKAGE" "not EXACTLY bound and enabled" "$TMP/f11.out"
no_staging "F11b: the refusal staged NOTHING" "$V"

# F12 DECOY-REBOUND FREEZE TRIGGER: the membership freeze trigger is
# dropped and recreated with the SAME name and SAME event set but
# executing an inert decoy function. Name-existence and even
# name+events checks would PASS this - the gate's tgfoid function
# binding refuses.
new_variant
surgery "F12 decoy rebind" "CREATE FUNCTION exlib2u_decoy() RETURNS trigger LANGUAGE plpgsql AS \$d\$BEGIN RETURN COALESCE(NEW, OLD); END\$d\$;
  DROP TRIGGER exercise_catalog_run_items_freeze_trigger ON exercise_catalog_run_items;
  CREATE TRIGGER exercise_catalog_run_items_freeze_trigger
    BEFORE INSERT OR UPDATE OR DELETE ON exercise_catalog_run_items
    FOR EACH ROW EXECUTE FUNCTION exlib2u_decoy();" \
  && [ "$(Q "SELECT count(*) FROM pg_trigger t WHERE t.tgname='exercise_catalog_run_items_freeze_trigger' AND t.tgfoid='exlib2u_decoy()'::regprocedure AND t.tgtype=31 AND t.tgenabled='O'" "$V")" = "1" ] \
  && ok "F12-setup: the membership freeze trigger is REBOUND to an inert decoy (same name, same BEFORE-ROW event set, enabled - only the function differs)" \
  || bad "F12-setup: decoy rebind not landed"
expect_refusal "F12: DECOY-REBOUND FREEZE TRIGGER refused - the exact-binding gate binds the promoted FUNCTION (tgfoid), not the trigger name or event set" \
  "$V" "$PACKAGE" "not EXACTLY bound and enabled" "$TMP/f12.out"
no_staging "F12b: the refusal staged NOTHING" "$V"

# F13 COUNT-PRESERVING MEMBER SUBSTITUTION (cluster-wide catalog
# surgery; restored to the exact five-field baseline afterwards):
# exlib_catalog_loader revoked from postgres and granted to an
# impostor - the per-role membership COUNT stays exactly 1, so the
# old role=count shape would have PASSED; the absolute baseline pin
# refuses on the member identity.
new_variant
surgery "F13 member substitution" "REVOKE exlib_catalog_loader FROM postgres;
  CREATE ROLE exlib2u_impostor NOLOGIN;
  GRANT exlib_catalog_loader TO exlib2u_impostor WITH ADMIN TRUE, INHERIT FALSE, SET FALSE;" \
  && [ "$(Q "SELECT count(*) FROM pg_auth_members am JOIN pg_roles g ON g.oid=am.roleid WHERE g.rolname='exlib_catalog_loader'")" = "1" ] \
  && [ "$(Q "SELECT m.rolname FROM pg_auth_members am JOIN pg_roles g ON g.oid=am.roleid JOIN pg_roles m ON m.oid=am.member WHERE g.rolname='exlib_catalog_loader'")" = "exlib2u_impostor" ] \
  && ok "F13-setup: exlib_catalog_loader now held by an IMPOSTOR with identical count, grantor, and options (member is the ONLY differing field)" \
  || bad "F13-setup: member substitution not landed"
expect_refusal "F13: COUNT-PRESERVING MEMBER SUBSTITUTION refused - the absolute authority baseline pin binds the member identity, not the membership count" \
  "$V" "$PACKAGE" "catalog authority baseline is not exactly the promoted shape" "$TMP/f13.out"
no_staging "F13b: the refusal staged NOTHING" "$V"
surgery "F13 restore" "REVOKE exlib_catalog_loader FROM exlib2u_impostor;
  DROP ROLE exlib2u_impostor;
  GRANT exlib_catalog_loader TO postgres WITH ADMIN TRUE, INHERIT FALSE, SET FALSE;" \
  && [ "$(Q "$LDR_B")" = "$BASELINE_OK" ] \
  && ok "F13c: the loader membership RESTORED to the exact five-field baseline (asserted, not assumed)" \
  || bad "F13c: restoration failed"

# F14 COUNT-PRESERVING ADMIN-OPTION FLIP (cluster-wide; restored):
# only the reviewer grant's ADMIN option flips - count, member, and
# grantor all identical; the absolute pin refuses on the option.
new_variant
surgery "F14 admin-option flip" "REVOKE ADMIN OPTION FOR exlib_catalog_reviewer FROM postgres;" \
  && [ "$(Q "SELECT count(*)::text||'/'||bool_and(am.admin_option)::text FROM pg_auth_members am JOIN pg_roles g ON g.oid=am.roleid WHERE g.rolname='exlib_catalog_reviewer'")" = "1/false" ] \
  && ok "F14-setup: the reviewer grant's ADMIN option is flipped in place (count 1, member postgres, grantor supabase_admin - the option is the ONLY differing field)" \
  || bad "F14-setup: option flip not landed"
expect_refusal "F14: COUNT-PRESERVING ADMIN-OPTION FLIP refused - the absolute authority baseline pin binds every option column" \
  "$V" "$PACKAGE" "catalog authority baseline is not exactly the promoted shape" "$TMP/f14.out"
no_staging "F14b: the refusal staged NOTHING" "$V"
surgery "F14 restore" "GRANT exlib_catalog_reviewer TO postgres WITH ADMIN TRUE, INHERIT FALSE, SET FALSE;" \
  && [ "$(Q "$REV_B")" = "$BASELINE_OK" ] \
  && ok "F14c: the reviewer membership RESTORED to the exact five-field baseline (asserted, not assumed)" \
  || bad "F14c: restoration failed"

# F15 COUNT-PRESERVING GRANTOR SUBSTITUTION (cluster-wide;
# restored): only the admission grant's recorded GRANTOR differs -
# member, count, and every option identical. PG16 records any
# superuser-without-ADMIN grant as the bootstrap superuser's, so a
# real GRANT cannot produce this state; it is SIMULATED by direct
# shared-catalog surgery (the established corruption-simulation
# precedent - exactly the tamper class the pin must catch).
new_variant
surgery "F15 grantor substitution" "CREATE ROLE exlib2u_grantor2 SUPERUSER;
  UPDATE pg_auth_members SET grantor = (SELECT oid FROM pg_roles WHERE rolname='exlib2u_grantor2')
   WHERE roleid = (SELECT oid FROM pg_roles WHERE rolname='exlib_catalog_admission')
     AND member = (SELECT oid FROM pg_roles WHERE rolname='postgres');" \
  && [ "$(Q "SELECT g.rolname||'>'||m.rolname||'@'||gr.rolname||':'||am.admin_option::text||':'||am.inherit_option::text||':'||am.set_option::text FROM pg_auth_members am JOIN pg_roles g ON g.oid=am.roleid JOIN pg_roles m ON m.oid=am.member JOIN pg_roles gr ON gr.oid=am.grantor WHERE g.rolname='exlib_catalog_admission'")" = "exlib_catalog_admission>postgres@exlib2u_grantor2:true:false:false" ] \
  && ok "F15-setup: the admission grant's recorded grantor is SUBSTITUTED in place (count 1, member postgres, options identical - grantor is the ONLY differing field)" \
  || bad "F15-setup: grantor substitution not landed"
expect_refusal "F15: COUNT-PRESERVING GRANTOR SUBSTITUTION refused - the absolute authority baseline pin binds the grantor identity" \
  "$V" "$PACKAGE" "catalog authority baseline is not exactly the promoted shape" "$TMP/f15.out"
no_staging "F15b: the refusal staged NOTHING" "$V"
surgery "F15 restore" "UPDATE pg_auth_members SET grantor = (SELECT oid FROM pg_roles WHERE rolname='supabase_admin')
   WHERE roleid = (SELECT oid FROM pg_roles WHERE rolname='exlib_catalog_admission')
     AND member = (SELECT oid FROM pg_roles WHERE rolname='postgres');
  DROP ROLE exlib2u_grantor2;" \
  && [ "$(Q "$ADM_B")" = "$BASELINE_OK" ] \
  && ok "F15c: the admission membership RESTORED to the exact five-field baseline (asserted, not assumed)" \
  || bad "F15c: restoration failed"

echo
echo "=== G. Concurrency: two simultaneous executions - exactly ONE commits"
new_variant
( run_pkg "$V" "$PACKAGE" "$TMP/g1.out"; echo $? > "$TMP/g1.rc" ) &
( run_pkg "$V" "$PACKAGE" "$TMP/g2.out"; echo $? > "$TMP/g2.rc" ) &
wait
RC1=$(cat "$TMP/g1.rc"); RC2=$(cat "$TMP/g2.rc")
if { [ "$RC1" = "0" ] && [ "$RC2" != "0" ]; } || { [ "$RC1" != "0" ] && [ "$RC2" = "0" ]; }; then
  ok "G1: the race has exactly ONE committer (rc pair $RC1/$RC2) - the SHARE ROW EXCLUSIVE locks serialize the two runs and the loser refuses at the ONE-USE gate"
else
  bad "G1: race outcome wrong (rc pair $RC1/$RC2)"
fi
[ "$(Q "$COUNTS_SQL" "$V")" = "$POST_VECTOR" ] && [ "$(Q "$RUN_SQL" "$V")" = "$RUN_STAGED" ] && [ "$(Q "$MEMBERS_SQL" "$V")" = "$MEMBERS_STAGED" ] \
  && ok "G2: the raced database holds EXACTLY one staging (post vector, the staged run row, the six members - no double-write anywhere)" \
  || bad "G2: raced state wrong"

echo
echo "=== H. Harness cleanup check"
for i in $(seq 1 "$VN"); do QA "DROP DATABASE IF EXISTS exlib2u_v$i" >/dev/null 2>&1; done
QA "DROP DATABASE IF EXISTS exlib2u_prestate" >/dev/null 2>&1
[ "$(QA "SELECT count(*) FROM pg_database WHERE datname LIKE 'exlib2u%'")" = "0" ] \
  && ok "H1: zero leftover fixture databases" \
  || bad "H1: leftover databases remain"
[ "$(Q "$LDR_B")" = "$BASELINE_OK" ] && [ "$(Q "$REV_B")" = "$BASELINE_OK" ] && [ "$(Q "$ADM_B")" = "$BASELINE_OK" ] && [ "$(Q "$PUB_B")" = "$BASELINE_OK" ] \
  && [ "$(Q "$AUTH_PIN_SQL")" = "$AUTH_PIN_OK" ] \
  && [ "$(QA "SELECT count(*) FROM pg_roles WHERE rolname IN ('exlib2u_impostor','exlib2u_grantor2','exlib2u_intruder')")" = "0" ] \
  && ok "H2: the cluster-wide authority baseline is byte-identical after every authority control (all three substitutions restored to the exact five-field shape; zero harness roles remain)" \
  || bad "H2: authority baseline not restored"

echo
printf '%s passed, %s failed\n' "$PASS" "$FAIL"
[ "$FAIL" = "0" ] || exit 1
