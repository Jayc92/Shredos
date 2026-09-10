#!/usr/bin/env bash
# ============================================================
# EXLIB-2Y LIVE verifier — the hosted snapshot-review APPLICATION
# package, proven against disposable local PostgreSQL ONLY.
#
# Boots a throwaway socket-only cluster (no TCP; no hosted contact;
# torn down on exit), reproduces the hosted role posture (bootstrap
# superuser supabase_admin as platform substrate; NON-SUPERUSER
# postgres as the working operator), applies migrations 001-027
# exactly once, seeds the representative 84-exercise tenant fixture,
# executes the COMMITTED, SPENT EXLIB-2K + 2O + 2P + 2Q + 2R
# packages once each to produce the EXACT post-publication hosted
# pre-state (vector 3/3/5/3/6/1/2/2/0/0/0, published+admitted Plank
# content, the two projected relationships, ZERO review events),
# and then proves the EXLIB-2Y package:
#   D. the happy path — exactly three pending->approved transitions
#      carrying the exact renewed human tuples, the trigger-created
#      immutable events, the vector moving in exactly one position
#      (events 0 -> 3), every unrelated surface digest-identical,
#      authority shape untouched, claims invariant intact;
#   E. ONE-USE — the second execution refuses at the vector gate;
#   F. a refusal matrix, each variant on a FRESH pre-state copy with
#      whole-transaction rollback proven after every refusal:
#      drifted governed field, missing identity, duplicate identity
#      (index-corruption simulation), stale review state, foreign
#      review event (guard-bypass simulation), wrong authority,
#      PARTIAL-APPLICATION atomicity (tampered third target), and
#      swapped identities in the write section (tampered copy);
#   G. a REAL two-session concurrency race proving exactly one
#      committer.
#
# Every counterfactual mutation is applied through surgery(), which
# FAILS LOUDLY if the mutation does not land. Tampered variants are
# sed/awk-derived COPIES under the throwaway directory; the
# repository package is never modified.
#
# Run from the repository root:
#   bash scripts/verify-exlib2y-live.sh
# ============================================================
set -u
cd "$(dirname "$0")/.."

PACKAGE="docs/exlib2y-snapshot-review-application-package.sql"
PKG2K="docs/exlib2k-plank-catalog-load-package.sql"
PKG2O="docs/exlib2o-target-snapshot-load-package.sql"
PKG2P="docs/exlib2p-plank-database-review-package.sql"
PKG2Q="docs/exlib2q-plank-import-admission-package.sql"
PKG2R="docs/exlib2r-plank-publication-package.sql"
DEC_PL="docs/exlib2w-plank-snapshot-review-form-v2-completed.json"
DEC_DB="docs/exlib2w-dead-bug-snapshot-review-form-v2-completed.json"
DEC_AW="docs/exlib2w-ab-wheel-rollout-snapshot-review-form-v2-completed.json"

PASS=0
FAIL=0
ok()  { PASS=$((PASS+1)); printf '  PASS  %s\n' "$1"; }
bad() { FAIL=$((FAIL+1)); printf '  FAIL  %s\n' "$1"; [ -n "${2:-}" ] && printf '        %s\n' "$2"; return 0; }

# ── W11-LIVE (weight_time milestone, 2026-09-10): historical anchors ──
# Migration 028_weight_time_tracking_mode.sql was admitted to this repository
# AFTER this suite's migration-inventory claims were authored, so those claims
# went stale for exactly one reason: the legitimate weight_time milestone.
# Each retargeted gate below KEEPS its historical assertion and ANDs in the
# EXACT current-state identity of 028, so the retarget can never silently
# absorb a further migration — 029+ still fails the gate loudly. No other
# assertion in this suite is changed, added, or removed.
W11_M028='supabase/migrations/028_weight_time_tracking_mode.sql'
W11_M028_SHA='9b7d3a52dc0b75f129745bec51a4c972aa284bb5cb0d6159e0cbbb981e463fb3'
W11_M028_BYTES=37162
w11_m028_pinned() {
  local n028 n029 bytes sha
  n028=$(ls supabase/migrations/ | grep -c '^028' || true)
  n029=$(ls supabase/migrations/ | grep -c '^029' || true)
  [ -f "$W11_M028" ] || return 1
  bytes=$(wc -c < "$W11_M028" | tr -d ' ')
  sha=$(shasum -a 256 "$W11_M028" | awk '{print $1}')
  [ "$n028/$n029/$bytes/$sha" = "1/0/$W11_M028_BYTES/$W11_M028_SHA" ]
}

TMP="$(mktemp -d /tmp/exlib2y-pg.XXXXXX)"
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
STATE_VECTOR="3/3/5/3/6/1/2/2/0/0/0"
POST_VECTOR="3/3/5/3/6/1/2/2/0/0/3"
PL='e21b2c00-0000-4000-a000-000000000001'
DBU='e21b2c00-0000-4000-a000-000000000002'
AWU='e21b2c00-0000-4000-a000-000000000003'
TS="2026-09-07T19:06:00-04:00"
ROWS_SQL="SELECT string_agg(c.logical_id::text||'#'||c.review_status||'#'||coalesce(c.reviewed_by,'<null>')||'#'||coalesce((c.reviewed_at = TIMESTAMPTZ '$TS')::text,'<null>')||'#'||coalesce(c.review_rationale,'<null>'), E'\n' ORDER BY c.logical_id) FROM exercise_catalog c WHERE c.is_active = true"
ROWS_PRE="$PL#pending#<null>#<null>#<null>
$DBU#pending#<null>#<null>#<null>
$AWU#pending#<null>#<null>#<null>"
ROWS_POST="$PL#approved#Joseph Carfagno#true#Approved as an accurate timed, bilateral bodyweight core exercise.
$DBU#approved#Joseph Carfagno#true#Approved as an accurate alternating bodyweight core and mobility exercise.
$AWU#approved#Joseph Carfagno#true#Approved as an accurate advanced bilateral weighted-repetition core exercise."
EV_SQL="SELECT coalesce(string_agg(c.logical_id::text||'#'||e.from_status||'>'||e.to_status||'#'||e.reviewed_by||'#'||(e.reviewed_at = TIMESTAMPTZ '$TS')::text, E'\n' ORDER BY c.logical_id),'<none>') FROM exercise_catalog_review_events e JOIN exercise_catalog c ON c.id = e.catalog_id"
EV_POST="$PL#pending>approved#Joseph Carfagno#true
$DBU#pending>approved#Joseph Carfagno#true
$AWU#pending>approved#Joseph Carfagno#true"
NEUTRAL_SQL="SELECT md5((SELECT coalesce(string_agg(m::text,'|' ORDER BY m.catalog_id, m.muscle),'-') FROM exercise_catalog_muscles m) || (SELECT coalesce(string_agg(a::text,'|' ORDER BY a.logical_id, a.alias),'-') FROM exercise_catalog_aliases a) || (SELECT coalesce(string_agg(n::text,'|' ORDER BY n.normalized_name),'-') FROM exercise_catalog_name_claims n) || (SELECT coalesce(string_agg(c::text,'|' ORDER BY c.id),'-') FROM exercise_catalog_content c) || (SELECT coalesce(string_agg(x::text,'|' ORDER BY x.relation, x.to_logical_id),'-') FROM exercise_catalog_content_expected_relationships x) || (SELECT coalesce(string_agg(r::text,'|' ORDER BY r.relation, r.to_logical_id),'-') FROM exercise_catalog_relationships r))"
TENANT_SQL="SELECT count(*)::text || ':' || md5(coalesce(string_agg(t::text,'|' ORDER BY t.id),'-')) FROM exercises t"
CREATED_SQL="SELECT string_agg(c.logical_id::text||'@'||to_char(c.created_at AT TIME ZONE 'UTC','YYYY-MM-DD HH24:MI:SS.US'), ',' ORDER BY c.logical_id) FROM exercise_catalog c WHERE c.is_active = true"

echo
echo "=== A. Package identity, decision provenance, and shape"
[ -f "$PACKAGE" ] && ok "A1: the prepared package exists at $PACKAGE (docs-only, never under supabase/migrations/)" \
  || { bad "A1: package missing"; exit 1; }
for spec in "$DEC_PL:14505:eec41ded250147da0f24749b0709474897043c7e385e4dc3072576daaa500fba" \
            "$DEC_DB:14463:def64ac383703fa89160478726e395db8b1187ad7d0b5aabf7cd0d8206c503c6" \
            "$DEC_AW:14516:dee585f9470b8816e6df706f8c0c081ebf22efc5842d5802a4ecd8daaea2cba9" \
            "$PKG2K:29760:a1b6dd55850c5d544e2f484d1ce4833b41deec7f3dd4d4c2373cb3b50daaccf0" \
            "$PKG2O:39230:4c0d74f942da4e92efab5923a435512c750c6d794077804ffeee8c0c305c966d" \
            "$PKG2P:37702:76d1d67d6ec2bafc49ef43a6312700559cd9eeee4b8b9433868de9daf95dc666" \
            "$PKG2Q:39382:b15b9313db5efe679ca0d13cd0d9b9d97fd9316ec1d66d99c5bba6ca47529e57" \
            "$PKG2R:48913:96ade4887320df83a3032fbb3afcf9566ecc4436276ebe6a54e2af07727f68de"; do
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
UPDATES=$(grep -c "^UPDATE public\.exercise_catalog\$" "$PACKAGE")
APPROVES=$(grep -c "review_status    = 'approved'" "$PACKAGE")
DELIVER=$(grep -cE 'deliver_catalog_exercises|rollback_catalog_delivery' "$PACKAGE" || true)
SEALS=$(grep -cE 'exlib_approve_and_seal_run|exlib_revoke_run_delivery|approved_for_delivery|sealed_at' "$PACKAGE" || true)
RUNS=$(grep -cE 'INSERT INTO[[:space:]]+public\.exercise_catalog_import_runs|INSERT INTO[[:space:]]+public\.exercise_catalog_run_items' "$PACKAGE" || true)
PUBL=$(grep -cE 'publish_catalog_content|admit_catalog_content|apply_content_review|load_catalog_' "$PACKAGE" || true)
EV_INS=$(grep -cE 'INSERT INTO[[:space:]]+public\.exercise_catalog_review_events' "$PACKAGE" || true)
[ "$UPDATES/$APPROVES/$DELIVER/$SEALS/$RUNS/$PUBL/$EV_INS" = "3/3/0/0/0/0/0" ] \
  && ok "A5: package shape exact - exactly THREE schema-qualified exercise_catalog UPDATEs setting review_status='approved', ZERO delivery/seal/run/publication/lifecycle-function statements, and ZERO direct review-event inserts (the trigger is the only event writer)" \
  || bad "A5: shape wrong (updates=$UPDATES approves=$APPROVES deliver=$DELIVER seal=$SEALS runs=$RUNS publ=$PUBL ev=$EV_INS)"
SNAP_UUIDS=$(grep -cE '1ce09c1f-c13d-4231-8e12-6f35cfd761b5|c715d840-944b-4019-b984-1687accffcf4' "$PACKAGE" || true)
[ "$SNAP_UUIDS" = "0" ] \
  && ok "A6: NO hosted snapshot UUID literal anywhere - every row resolves through its governed logical identity + is_active (the Plank surrogate was never preserved and is not invented)" \
  || bad "A6: a hosted snapshot UUID literal appears ($SNAP_UUIDS)"
grep -q "created_at IS NULL" "$PACKAGE" && grep -q "created_at_map" "$PACKAGE" \
  && ok "A7: created_at is verified LIVE (non-null at application time) and captured-and-compared across the transition - never pretended preserved" \
  || bad "A7: created_at handling missing"

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
# W11-LIVE RETARGET: the committed chain is 001-028 now. The weight_time
# milestone is applied WITH the chain — which is what proves it composes —
# and is pinned by exact identity, so this gate is strictly stronger than
# the 27-file version it replaces.
[ "$APPLIED" = "28" ] && w11_m028_pinned && ok "B2: migrations 001-028 applied exactly once in order (28 files = the 27 historical migrations + the weight_time milestone 028 at its pinned 37162 bytes/sha256, ALL as the non-superuser postgres)" \
  || bad "B2: expected 28 migrations (001-027 + the pinned weight_time 028), applied $APPLIED"
[ "$(Q "$LDR_B")" = "$BASELINE_OK" ] && [ "$(Q "$REV_B")" = "$BASELINE_OK" ] && [ "$(Q "$ADM_B")" = "$BASELINE_OK" ] && [ "$(Q "$PUB_B")" = "$BASELINE_OK" ] \
  && ok "B3: all four catalog-role memberships carry EXACTLY the hosted baseline shape" \
  || bad "B3: role baseline wrong"
for u in 1 2 3 4; do
  UID_U=$(Q "INSERT INTO auth.users DEFAULT VALUES RETURNING id;")
  Q "INSERT INTO public.exercises (user_id, name, category, primary_muscle, equipment, exercise_type, tracking_mode, unilateral, is_system, is_active)
     SELECT '$UID_U', 'Fixture Exercise U$u N' || g, 'compound', 'lats', 'barbell', 'strength', 'weight_reps', false, true, true
     FROM generate_series(1, 20) g;" >/dev/null
  Q "INSERT INTO public.exercises (user_id, name, category, primary_muscle, equipment, exercise_type, tracking_mode, unilateral, is_system, is_active)
     VALUES ('$UID_U', 'Plank', 'isolation', 'abs', 'bodyweight', 'bodyweight', 'bodyweight', false, true, true);" >/dev/null
done
[ "$(Q 'SELECT count(*) FROM exercises')" = "84" ] \
  && ok "B4: representative tenant fixture in place - exactly 84 exercises across four users, each with a seeded Plank" \
  || bad "B4: fixture wrong"

echo
echo "=== C. The COMMITTED, SPENT 2K+2O+2P+2Q+2R packages build the EXACT post-publication hosted pre-state"
for step in "2k:$PKG2K" "2o:$PKG2O" "2p:$PKG2P" "2q:$PKG2Q" "2r:$PKG2R"; do
  nm="${step%%:*}"; f="${step#*:}"
  psql -h "$SOCK" -U postgres -d postgres -X -v ON_ERROR_STOP=1 -q -f "$f" > "$TMP/$nm.out" 2>&1 \
    && ok "C1-$nm: the committed $nm package executed once" \
    || { bad "C1-$nm: package failed" "$(tail -3 "$TMP/$nm.out" | tr '\n' ' ')"; exit 1; }
done
[ "$(Q "$COUNTS_SQL")" = "$STATE_VECTOR" ] \
  && ok "C2: the pre-state is EXACTLY the post-EXLIB-2R hosted surface ($STATE_VECTOR - published projection present, ZERO review events)" \
  || bad "C2: pre-state vector wrong ($(Q "$COUNTS_SQL"))"
[ "$(Q "$ROWS_SQL")" = "$ROWS_PRE" ] \
  && ok "C3: all three snapshots are PENDING with NULL audit tuples - exactly the state the renewed decisions reviewed" \
  || bad "C3: rows pre-state wrong"
NEUTRAL_PRE=$(Q "$NEUTRAL_SQL"); TENANT_PRE=$(Q "$TENANT_SQL"); CREATED_PRE=$(Q "$CREATED_SQL")
[ -n "$CREATED_PRE" ] \
  && ok "C4: the three live created_at instants captured for the cross-transition comparison (all non-null by read)" \
  || bad "C4: created_at capture failed"
[ "$(Q "SELECT orphaned_claims::text||'/'||unclaimed_bearers::text FROM exlib_verify_catalog_claims()")" = "0/0" ] \
  && ok "C5: the catalog claims invariant holds at the pre-state (0/0)" \
  || bad "C5: claims invariant broken at pre-state"
QA "CREATE DATABASE exlib2y_prestate TEMPLATE postgres OWNER postgres" >/dev/null 2>&1 \
  && ok "C6: pre-state TEMPLATE captured (every refusal variant gets a byte-identical fresh copy)" \
  || bad "C6: template capture failed"

echo
echo "=== D. Happy path: EXACTLY the three human transitions and their trigger-created events"
psql -h "$SOCK" -U postgres -d postgres -X -v ON_ERROR_STOP=1 -q -f "$PACKAGE" > "$TMP/2y.out" 2>&1 \
  && ok "D1: the EXLIB-2Y package executed cleanly (one transaction; every precondition and postcondition satisfied)" \
  || { bad "D1: package failed" "$(tail -3 "$TMP/2y.out" | tr '\n' ' ')"; exit 1; }
[ "$(Q "$COUNTS_SQL")" = "$POST_VECTOR" ] \
  && ok "D2: the vector moved in EXACTLY one position ($STATE_VECTOR -> $POST_VECTOR): three review events and NOTHING else anywhere" \
  || bad "D2: vector wrong ($(Q "$COUNTS_SQL"))"
[ "$(Q "$ROWS_SQL")" = "$ROWS_POST" ] \
  && ok "D3: all three snapshots are APPROVED carrying the EXACT renewed human tuples (reviewer, the 19:06 EDT instant, the three verbatim rationales)" \
  || bad "D3: rows post-state wrong ($(Q "$ROWS_SQL"))"
[ "$(Q "$EV_SQL")" = "$EV_POST" ] \
  && ok "D4: the TRIGGER-created immutable events are exactly three pending->approved rows carrying the same tuples (schema law wrote them, not the package)" \
  || bad "D4: events wrong ($(Q "$EV_SQL"))"
[ "$(Q "$CREATED_SQL")" = "$CREATED_PRE" ] \
  && ok "D5: every created_at instant is UNCHANGED across the transition (live capture-and-compare; never a pretended preserved value)" \
  || bad "D5: created_at drifted"
[ "$(Q "$NEUTRAL_SQL")" = "$NEUTRAL_PRE" ] \
  && ok "D6: every unrelated catalog surface is digest-identical (anatomy, aliases, claims, content, expected relationships, projection)" \
  || bad "D6: an unrelated surface changed"
[ "$(Q "$TENANT_SQL")" = "$TENANT_PRE" ] \
  && ok "D7: the tenant exercises table is count + whole-row digest identical - REVIEW APPLICATION IS NOT DELIVERY; zero product change" \
  || bad "D7: tenant surface changed"
[ "$(Q "$LDR_B")" = "$BASELINE_OK" ] && [ "$(Q "$REV_B")" = "$BASELINE_OK" ] && [ "$(Q "$ADM_B")" = "$BASELINE_OK" ] && [ "$(Q "$PUB_B")" = "$BASELINE_OK" ] \
  && ok "D8: all four authority baselines byte-identical - this package changes NO authority" \
  || bad "D8: authority drifted"
[ "$(Q "SELECT (SELECT count(*) FROM exercise_catalog_import_runs)::text||'/'||(SELECT count(*) FROM exercise_catalog_run_items)::text")" = "0/0" ] \
  && ok "D9: zero import runs and zero run items - no S4 act occurred" \
  || bad "D9: forbidden run state appeared"
[ "$(Q "SELECT orphaned_claims::text||'/'||unclaimed_bearers::text FROM exlib_verify_catalog_claims()")" = "0/0" ] \
  && ok "D10: the catalog claims invariant holds after application (0/0)" \
  || bad "D10: claims invariant broken"
grep -q 'EXLIB-2Y APPLIED' "$TMP/2y.out" && grep -qE '3.*3' "$TMP/2y.out" \
  && ok "D11: the package surfaced its result line (3 approved snapshots / 3 review events) - display evidence; the rows above are the binding proof" \
  || bad "D11: result line missing"

echo
echo "=== E. ONE-USE: the second execution refuses fail-closed"
psql -h "$SOCK" -U postgres -d postgres -X -v ON_ERROR_STOP=1 -q -f "$PACKAGE" > "$TMP/2y-second.out" 2>&1 \
  && bad "E1: the second execution SUCCEEDED (it must refuse)" \
  || { grep -q 'ONE-USE and its baseline is gone' "$TMP/2y-second.out" \
    && ok "E1: the second execution refused at the VECTOR gate (the three events are visible; the baseline is gone) - ONE-USE proven on the applied database" \
    || bad "E1: refused by an unexpected gate" "$(tail -2 "$TMP/2y-second.out" | tr '\n' ' ')"; }
[ "$(Q "$COUNTS_SQL")" = "$POST_VECTOR" ] && [ "$(Q "$ROWS_SQL")" = "$ROWS_POST" ] && [ "$(Q "$EV_SQL")" = "$EV_POST" ] \
  && ok "E2: the refused re-run changed NOTHING (vector, rows, and events all exactly the single application)" \
  || bad "E2: the refused re-run drifted state"

echo
echo "=== F. Refusal matrix - each variant on a FRESH pre-state copy; rollback proven every time"
VN=0
V=""
new_variant() {
  VN=$((VN+1))
  V="exlib2y_v$VN"
  QA "DROP DATABASE IF EXISTS $V" >/dev/null 2>&1
  QA "CREATE DATABASE $V TEMPLATE exlib2y_prestate OWNER postgres" >/dev/null
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
rolled_back_pristine() { # NAME DB  (for variants whose surgery is state-visible, pass expected values instead)
  [ "$(Q "$COUNTS_SQL" "$2")" = "$STATE_VECTOR" ] && [ "$(Q "$ROWS_SQL" "$2")" = "$ROWS_PRE" ] \
    && ok "$1" || bad "$1" "counts=$(Q "$COUNTS_SQL" "$2")"
}

# F1 DRIFTED GOVERNED FIELD: Dead bug category flipped (trigger-off
# harness corruption; the freeze trigger forbids this lawfully).
new_variant
surgery "F1 governed drift" "ALTER TABLE exercise_catalog DISABLE TRIGGER USER;
  UPDATE exercise_catalog SET category='other' WHERE logical_id='$DBU';
  ALTER TABLE exercise_catalog ENABLE TRIGGER USER;" \
  && [ "$(Q "SELECT category FROM exercise_catalog WHERE logical_id='$DBU'" "$V")" = "other" ] \
  && ok "F1-setup: the governed drift is present and REAL (...0002 category now reads other)" \
  || bad "F1-setup: drift not landed"
expect_refusal "F1: DRIFTED GOVERNED FIELD refused - the live Dead bug row no longer matches the promoted decision packet, so the decision is VOID for that row" \
  "$V" "$PACKAGE" "Dead bug snapshot governed fields differ" "$TMP/f1.out"
[ "$(Q "SELECT count(*) FROM exercise_catalog_review_events" "$V")" = "0" ] && [ "$(Q "$ROWS_SQL" "$V")" = "$ROWS_PRE" ] \
  && ok "F1b: the refusal wrote NOTHING (zero events; all rows still pending/NULL)" || bad "F1b: refusal drifted state"

# F2 MISSING IDENTITY: the Plank snapshot deactivated.
new_variant
surgery "F2 missing identity" "ALTER TABLE exercise_catalog DISABLE TRIGGER USER;
  UPDATE exercise_catalog SET is_active=false WHERE logical_id='$PL';
  ALTER TABLE exercise_catalog ENABLE TRIGGER USER;" \
  && [ "$(Q "SELECT count(*) FROM exercise_catalog WHERE logical_id='$PL' AND is_active" "$V")" = "0" ] \
  && ok "F2-setup: the Plank snapshot is deactivated (no active row at the governed identity)" \
  || bad "F2-setup: deactivation not landed"
expect_refusal "F2: MISSING IDENTITY refused - zero active rows at the Plank logical identity" \
  "$V" "$PACKAGE" "expected exactly one active Plank snapshot by logical identity, found 0" "$TMP/f2.out"
[ "$(Q "SELECT count(*) FROM exercise_catalog_review_events" "$V")" = "0" ] \
  && ok "F2b: the refusal wrote NOTHING (zero events)" || bad "F2b: refusal drifted state"

# F3 DUPLICATE IDENTITY, COUNT-CAMOUFLAGED: a second active Plank
# row (index-corruption simulation - both one-active unique indexes
# dropped; a REAL hosted database enforces them) with the Dead bug
# row and its anatomy removed and one pad anatomy row added so the
# whole state VECTOR stays exactly the baseline - this isolates the
# package's own per-identity one-active-row gate, which must fire
# independently of both the indexes and the vector gate.
new_variant
surgery "F3 duplicate identity" "DROP INDEX exercise_catalog_one_active_logical_idx;
  DROP INDEX exercise_catalog_one_active_name_idx;
  ALTER TABLE exercise_catalog DISABLE TRIGGER USER;
  ALTER TABLE exercise_catalog_muscles DISABLE TRIGGER USER;
  DELETE FROM exercise_catalog_muscles WHERE catalog_id = (SELECT id FROM exercise_catalog WHERE logical_id='$DBU');
  DELETE FROM exercise_catalog WHERE logical_id='$DBU';
  INSERT INTO exercise_catalog (logical_id, canonical_name, category, primary_muscle, equipment, laterality, tracking_mode, provenance, movement_pattern, training_role, difficulty, availability, review_status, is_active, catalog_version)
  SELECT logical_id, canonical_name, category, primary_muscle, equipment, laterality, tracking_mode, provenance, movement_pattern, training_role, difficulty, availability, 'pending', true, 2
  FROM exercise_catalog WHERE logical_id='$PL' AND is_active;
  INSERT INTO exercise_catalog_muscles (catalog_id, muscle, role)
  SELECT id, 'obliques', 'secondary' FROM exercise_catalog WHERE logical_id='$PL' AND catalog_version=2;
  ALTER TABLE exercise_catalog_muscles ENABLE TRIGGER USER;
  ALTER TABLE exercise_catalog ENABLE TRIGGER USER;" \
  && [ "$(Q "SELECT count(*) FROM exercise_catalog WHERE logical_id='$PL' AND is_active" "$V")" = "2" ] \
  && [ "$(Q "$COUNTS_SQL" "$V")" = "$STATE_VECTOR" ] \
  && ok "F3-setup: TWO active rows at the Plank logical identity while the vector reads EXACTLY the baseline (camouflage real)" \
  || bad "F3-setup: duplicate/camouflage not landed ($(Q "$COUNTS_SQL" "$V"))"
expect_refusal "F3: DUPLICATE IDENTITY refused - the package's own per-identity one-active-row gate fires ('found 2') independently of both unique indexes AND the vector gate" \
  "$V" "$PACKAGE" "found 2" "$TMP/f3.out"

# F4 STALE REVIEW STATE: Dead bug lawfully approved earlier with a
# DIFFERENT tuple (a legitimate transition; the event it creates
# moves the vector, so the ONE-USE vector gate refuses first).
new_variant
surgery "F4 stale review state" "UPDATE exercise_catalog SET review_status='approved', reviewed_by='Someone Else', reviewed_at=now(), review_rationale='earlier decision' WHERE logical_id='$DBU' AND is_active;" \
  && [ "$(Q "SELECT review_status FROM exercise_catalog WHERE logical_id='$DBU' AND is_active" "$V")" = "approved" ] \
  && ok "F4-setup: Dead bug already approved under a different, earlier decision (one lawful event exists)" \
  || bad "F4-setup: stale state not landed"
expect_refusal "F4: STALE REVIEW STATE refused - the baseline is no longer the promoted zero-event pre-state" \
  "$V" "$PACKAGE" "ONE-USE and its baseline is gone" "$TMP/f4.out"

# F5 FOREIGN REVIEW EVENT: a bogus event row injected past the
# depth guard (trigger-off harness corruption).
new_variant
surgery "F5 foreign event" "ALTER TABLE exercise_catalog_review_events DISABLE TRIGGER USER;
  INSERT INTO exercise_catalog_review_events (catalog_id, from_status, to_status, reviewed_by, reviewed_at, review_rationale)
  SELECT id, 'pending', 'approved', 'Nobody', now(), 'foreign event' FROM exercise_catalog WHERE logical_id='$AWU' AND is_active;
  ALTER TABLE exercise_catalog_review_events ENABLE TRIGGER USER;" \
  && [ "$(Q "SELECT count(*) FROM exercise_catalog_review_events" "$V")" = "1" ] \
  && ok "F5-setup: one FOREIGN event exists (guard-bypass simulation) while every row is still pending" \
  || bad "F5-setup: foreign event not landed"
expect_refusal "F5: FOREIGN REVIEW EVENT refused - the zero-event baseline expected by the promoted evidence is gone" \
  "$V" "$PACKAGE" "ONE-USE and its baseline is gone" "$TMP/f5.out"

# F6 WRONG AUTHORITY: executed by a non-operator login role.
new_variant
QA "CREATE ROLE exlib2y_intruder LOGIN" >/dev/null 2>&1
if psql -h "$SOCK" -U exlib2y_intruder -d "$V" -X -v ON_ERROR_STOP=1 -q -f "$PACKAGE" > "$TMP/f6.out" 2>&1; then
  bad "F6: WRONG AUTHORITY SUCCEEDED (it must refuse)"
else
  grep -qE 'must run as the hosted operator role postgres|permission denied' "$TMP/f6.out" \
    && ok "F6: WRONG AUTHORITY refused - a non-operator role cannot execute the package (explicit posture gate and table privileges both stand)" \
    || bad "F6: refused by an unexpected gate" "$(tail -2 "$TMP/f6.out" | tr '\n' ' ')"
fi
rolled_back_pristine "F6b: the wrong-authority attempt wrote NOTHING (pristine pre-state)" "$V"
QA "DROP ROLE exlib2y_intruder" >/dev/null 2>&1

# F7 PARTIAL-APPLICATION ATOMICITY: a tampered COPY whose third
# UPDATE targets a nonexistent logical identity - two transitions
# succeed inside the transaction, the postcondition counts 2 events
# instead of 3, and EVERYTHING rolls back.
new_variant
TAMPERED="$TMP/exlib2y-tampered-third.sql"
awk -v from="$AWU" -v to="e21b2c00-0000-4000-a000-000000000009" '
  /The three human-authored transitions/ { inw=1 }
  { if (inw && $0 ~ from) gsub(from, to); print }' "$PACKAGE" > "$TAMPERED"
grep -q 'e21b2c00-0000-4000-a000-000000000009' "$TAMPERED" \
  && ok "F7-setup: tampered COPY built (third UPDATE now targets a nonexistent identity; preconditions untouched; repository package untouched)" \
  || bad "F7-setup: tamper failed"
expect_refusal "F7: PARTIAL APPLICATION impossible - two transitions succeed in-transaction, the postcondition sees 2 events instead of 3, and the WHOLE transaction rolls back" \
  "$V" "$TAMPERED" "post-state vector is" "$TMP/f7.out"
rolled_back_pristine "F7b: ATOMICITY PROVEN - after the failed partial run, ALL rows are pending with NULL tuples and ZERO events (nothing survived)" "$V"

# F8 SWAPPED IDENTITIES IN THE WRITE SECTION: a tampered COPY that
# swaps Plank and Dead bug ONLY in the UPDATE section - the
# preconditions pass (they read the true rows), the writes land the
# WRONG tuples, and the postcondition line comparison rolls back.
new_variant
SWAPPED="$TMP/exlib2y-swapped-writes.sql"
awk -v a="$PL" -v b="$DBU" '
  /The three human-authored transitions/ { inw=1 }
  { line=$0
    if (inw) { gsub(a, "SWAPTMP", line); gsub(b, a, line); gsub("SWAPTMP", b, line) }
    print line }' "$PACKAGE" > "$SWAPPED"
[ "$(grep -B6 "logical_id = '$DBU'" "$SWAPPED" | grep -c 'timed, bilateral')" = "1" ] \
  && [ "$(grep -B6 "logical_id = '$DBU'" "$PACKAGE" | grep -c 'timed, bilateral')" = "0" ] \
  && ok "F8-setup: tampered COPY built and REAL (the Dead bug-targeting UPDATE now carries the Plank rationale; write section only; repository package untouched)" \
  || bad "F8-setup: swap failed"
expect_refusal "F8: SWAPPED-IDENTITY WRITES refused - each row would carry the OTHER exercise's tuple; the postcondition per-row line comparison catches it and rolls back everything" \
  "$V" "$SWAPPED" "approved rows do not carry exactly the three human tuples" "$TMP/f8.out"
rolled_back_pristine "F8b: rollback proven - pristine pending pre-state after the refused swapped-write run" "$V"

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
[ "$(Q "$COUNTS_SQL" "$V")" = "$POST_VECTOR" ] && [ "$(Q "$ROWS_SQL" "$V")" = "$ROWS_POST" ] && [ "$(Q "$EV_SQL" "$V")" = "$EV_POST" ] \
  && ok "G2: the raced database holds EXACTLY one application (post vector, the three tuples, the three events - no double-write anywhere)" \
  || bad "G2: raced state wrong"

echo
echo "=== H. Harness cleanup check"
for i in $(seq 1 "$VN"); do QA "DROP DATABASE IF EXISTS exlib2y_v$i" >/dev/null 2>&1; done
QA "DROP DATABASE IF EXISTS exlib2y_prestate" >/dev/null 2>&1
[ "$(QA "SELECT count(*) FROM pg_database WHERE datname LIKE 'exlib2y%'")" = "0" ] \
  && ok "H1: zero leftover fixture databases" \
  || bad "H1: leftover databases remain"

echo
printf '%s passed, %s failed\n' "$PASS" "$FAIL"
[ "$FAIL" = "0" ] || exit 1
