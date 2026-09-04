#!/usr/bin/env bash
# ============================================================
# EXLIB-2O LIVE verifier — Dead bug + Ab wheel rollout
# target-snapshot load package, proven against disposable local
# PostgreSQL ONLY.
#
# Boots a throwaway socket-only cluster (no TCP; no hosted contact;
# torn down on exit), reproduces the hosted role posture (bootstrap
# superuser supabase_admin as platform substrate; NON-SUPERUSER
# postgres as the working operator), applies migrations 001-027
# exactly once, seeds the representative 84-exercise tenant fixture,
# executes the COMMITTED EXLIB-2K package once to produce the EXACT
# expected hosted pre-state, and then proves the EXLIB-2O package:
# the happy path (exact post-state, independent and cross bindings,
# untouched-surface digests, claims invariant, byte-exact authority
# restoration), the full refusal matrix (second execution, missing
# identity, foreign target claim, claimed name, malformed category,
# swapped UUIDs, tampered anatomy payload, omitted loader call,
# widened authority baseline) each on a fresh scratch database
# copied from a pre-state template with whole-transaction rollback
# and restored authority proven after EVERY variant, and a REAL
# two-session serialization RACE proving exactly one committer.
#
# Tampered variants are sed-derived COPIES under the throwaway
# directory; the repository package is never modified.
#
# Run from the repository root:
#   bash scripts/verify-exlib2o-live.sh
# ============================================================
set -uo pipefail
export LC_ALL=C LANG=C

PACKAGE="docs/exlib2o-target-snapshot-load-package.sql"
PKG2K="docs/exlib2k-plank-catalog-load-package.sql"
B02="docs/exlib2c-release1-batch02-content.jsonl"
B04="docs/exlib2c-release1-batch04-content.jsonl"

PASS=0
FAIL=0
ok()  { PASS=$((PASS+1)); printf '  PASS  %s\n' "$1"; }
bad() { FAIL=$((FAIL+1)); printf '  FAIL  %s\n' "$1"; [ -n "${2:-}" ] && printf '        %s\n' "$2"; return 0; }

TMP="$(mktemp -d /tmp/exlib2o-pg.XXXXXX)"
PGDATA="$TMP/pgdata"
SOCK="$TMP"
cleanup() {
  pg_ctl -D "$PGDATA" stop -m immediate >/dev/null 2>&1 || true
  rm -rf "$TMP"
}
trap cleanup EXIT

# Q/QQ: the NON-SUPERUSER working role postgres (hosted operator
# posture). QA/QQA: the bootstrap superuser supabase_admin — platform
# substrate and harness PROBE authority only, never product authority.
# All helpers take an optional database name as $2 (default postgres).
Q()   { psql -h "$SOCK" -U postgres -d "${2:-postgres}" -X -v ON_ERROR_STOP=1 -qtA -c "$1"; }
QQ()  { psql -h "$SOCK" -U postgres -d "${2:-postgres}" -X -v ON_ERROR_STOP=1 -qtA -c "$1" 2>&1; }
QA()  { psql -h "$SOCK" -U supabase_admin -d "${2:-postgres}" -X -v ON_ERROR_STOP=1 -qtA -c "$1"; }
QQA() { psql -h "$SOCK" -U supabase_admin -d "${2:-postgres}" -X -v ON_ERROR_STOP=1 -qtA -c "$1" 2>&1; }

BASELINE_SQL="SELECT (SELECT count(*) FROM pg_auth_members am JOIN pg_roles r ON r.oid=am.roleid WHERE r.rolname='exlib_catalog_loader')::text || '/' || (SELECT g.rolname||'>'||m.rolname||':'||am.admin_option::text||':'||am.inherit_option::text||':'||am.set_option::text FROM pg_auth_members am JOIN pg_roles r ON r.oid=am.roleid JOIN pg_roles m ON m.oid=am.member JOIN pg_roles g ON g.oid=am.grantor WHERE r.rolname='exlib_catalog_loader' AND m.rolname='postgres')"
BASELINE_OK="1/supabase_admin>postgres:true:false:false"
COUNTS_SQL="SELECT (SELECT count(*) FROM exercise_catalog_logical)::text||'/'||(SELECT count(*) FROM exercise_catalog)::text||'/'||(SELECT count(*) FROM exercise_catalog_muscles)::text||'/'||(SELECT count(*) FROM exercise_catalog_aliases)::text||'/'||(SELECT count(*) FROM exercise_catalog_name_claims)::text||'/'||(SELECT count(*) FROM exercise_catalog_content)::text||'/'||(SELECT count(*) FROM exercise_catalog_content_expected_relationships)::text||'/'||(SELECT count(*) FROM exercise_catalog_relationships)::text||'/'||(SELECT count(*) FROM exercise_catalog_import_runs)::text||'/'||(SELECT count(*) FROM exercise_catalog_run_items)::text"
PRE_VECTOR="3/1/2/2/3/1/2/0/0/0"
POST_VECTOR="3/3/5/3/6/1/2/0/0/0"
PLANK_DIGEST_SQL="SELECT md5((SELECT coalesce(string_agg(e::text,'|' ORDER BY e.id),'-') FROM exercise_catalog e WHERE e.logical_id='e21b2c00-0000-4000-a000-000000000001') || (SELECT coalesce(string_agg(c::text,'|' ORDER BY c.id),'-') FROM exercise_catalog_content c WHERE c.logical_id='e21b2c00-0000-4000-a000-000000000001') || (SELECT coalesce(string_agg(a::text,'|' ORDER BY a.alias),'-') FROM exercise_catalog_aliases a WHERE a.logical_id='e21b2c00-0000-4000-a000-000000000001') || (SELECT coalesce(string_agg(n::text,'|' ORDER BY n.normalized_name),'-') FROM exercise_catalog_name_claims n WHERE n.logical_id='e21b2c00-0000-4000-a000-000000000001') || (SELECT coalesce(string_agg(x::text,'|' ORDER BY x.relation, x.to_logical_id),'-') FROM exercise_catalog_content_expected_relationships x))"
TENANT_DIGEST_SQL="SELECT count(*)::text || ':' || md5(coalesce(string_agg(t.id::text||t.user_id::text||t.name||t.is_active::text,'|' ORDER BY t.id),'-')) FROM exercises t"
DBU='e21b2c00-0000-4000-a000-000000000002'
AWU='e21b2c00-0000-4000-a000-000000000003'
PL='e21b2c00-0000-4000-a000-000000000001'

echo
echo "=== A. Package identity and source bindings"
[ -f "$PACKAGE" ] && ok "A1: the prepared package exists at $PACKAGE (docs-only, never under supabase/migrations/)" \
  || { bad "A1: package missing"; exit 1; }
for spec in "$B02:52123:ebca1c01ffa66c78bdc42fc2972cfd328a75d2d6c2735878f9445617c15743cc" \
            "$B04:55442:c8a63ccbd7cc2913265926050480535f5d4adff585f1d462f9b2c2d30406fcf2" \
            "$PKG2K:29760:a1b6dd55850c5d544e2f484d1ce4833b41deec7f3dd4d4c2373cb3b50daaccf0"; do
  f="${spec%%:*}"; rest="${spec#*:}"; want_b="${rest%%:*}"; want_s="${rest#*:}"
  got_b=$(wc -c < "$f" | tr -d ' '); got_s=$(shasum -a 256 "$f" | awk '{print $1}')
  [ "$got_b/$got_s" = "$want_b/$want_s" ] \
    && ok "A2: $f holds its exact promoted fingerprint" \
    || { bad "A2: $f drifted ($got_b/$got_s)"; exit 1; }
done
PSHA=$(shasum -a 256 "$PACKAGE" | awk '{print $1}')
PBYTES=$(wc -c < "$PACKAGE" | tr -d ' ')
ok "A3: package under test: $PBYTES bytes, sha256 $PSHA"
grep -q 'PREPARED — NOT EXECUTED' "$PACKAGE" && grep -q 'ttybyljytiwntvorugcv' "$PACKAGE" \
  && ok "A4: the package is labeled PREPARED - NOT EXECUTED and names the only eventual hosted target" \
  || bad "A4: labels missing"
SNAP_CALLS=$(grep -c '^SELECT load_catalog_snapshot(' "$PACKAGE")
IDENT_CALLS=$(grep -c 'load_catalog_identity(' "$PACKAGE" || true)
DRAFT_CALLS=$(grep -cE "^SELECT load_catalog_content_draft\(" "$PACKAGE" || true)
[ "$SNAP_CALLS/$IDENT_CALLS/$DRAFT_CALLS" = "2/0/0" ] \
  && ok "A5: exactly TWO load_catalog_snapshot calls; zero identity or content-draft calls (targets already exist; no content loads)" \
  || bad "A5: loader-call shape wrong ($SNAP_CALLS/$IDENT_CALLS/$DRAFT_CALLS)"

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
[ "$(Q "$BASELINE_SQL")" = "$BASELINE_OK" ] \
  && ok "B3: the loader membership is EXACTLY the hosted baseline row (grantor supabase_admin -> postgres, ADMIN TRUE / INHERIT FALSE / SET FALSE)" \
  || bad "B3: baseline wrong ($(Q "$BASELINE_SQL"))"
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
echo "=== C. The COMMITTED EXLIB-2K package builds the EXACT expected hosted pre-state"
psql -h "$SOCK" -U postgres -d postgres -X -v ON_ERROR_STOP=1 -q -f "$PKG2K" > "$TMP/2k.out" 2>&1 \
  && ok "C1: the committed (SPENT-on-hosted) EXLIB-2K package executed once on the fixture, reproducing the hosted load" \
  || { bad "C1: 2K package failed" "$(tail -3 "$TMP/2k.out" | tr '\n' ' ')"; exit 1; }
[ "$(Q "$COUNTS_SQL")" = "$PRE_VECTOR" ] \
  && ok "C2: the pre-state is EXACTLY the expected hosted surface ($PRE_VECTOR) - the vector the EXLIB-2O gate demands" \
  || bad "C2: pre-state vector wrong ($(Q "$COUNTS_SQL"))"
[ "$(Q "SELECT count(*) FROM exercise_catalog e WHERE e.logical_id IN ('$DBU','$AWU')")" = "0" ] \
  && ok "C3: both target identities are BARE (zero snapshots) exactly as on hosted ShredOS" \
  || bad "C3: targets not bare"
PLANK_PRE=$(Q "$PLANK_DIGEST_SQL")
TENANT_PRE=$(Q "$TENANT_DIGEST_SQL")
[ "$(Q "SELECT orphaned_claims::text||'/'||unclaimed_bearers::text FROM exlib_verify_catalog_claims()")" = "0/0" ] \
  && ok "C4: the catalog claims invariant holds at the pre-state (0/0)" \
  || bad "C4: claims invariant broken at pre-state"
QA "CREATE DATABASE exlib2o_prestate TEMPLATE postgres OWNER postgres" >/dev/null 2>&1 \
  && ok "C5: pre-state TEMPLATE captured (every refusal variant gets a byte-identical fresh copy)" \
  || bad "C5: template capture failed"

echo
echo "=== D. Happy path: the package executes EXACTLY ONCE with the exact result"
psql -h "$SOCK" -U postgres -d postgres -X -v ON_ERROR_STOP=1 -q -f "$PACKAGE" > "$TMP/2o.out" 2>&1 \
  && ok "D1: the EXLIB-2O package executed cleanly (one transaction; every package-internal pre/auth/post condition satisfied)" \
  || { bad "D1: package failed" "$(tail -3 "$TMP/2o.out" | tr '\n' ' ')"; exit 1; }
[ "$(Q "$BASELINE_SQL")" = "$BASELINE_OK" ] \
  && ok "D2: AUTHORITY RESTORED byte-for-byte after success (exactly the supabase_admin-granted baseline row; nothing left behind)" \
  || bad "D2: authority not restored ($(Q "$BASELINE_SQL"))"
D3OUT=$(QQ "SET ROLE exlib_catalog_loader;")
printf '%s' "$D3OUT" | grep -q 'permission denied to set role' \
  && ok "D3: SET ROLE exlib_catalog_loader is denied again after the load - no standing SET authority survives COMMIT" \
  || bad "D3: standing SET authority survived" "$D3OUT"
[ "$(Q "$COUNTS_SQL")" = "$POST_VECTOR" ] \
  && ok "D4: EXACT two-snapshot result - the ten-table vector is $POST_VECTOR (+2 snapshots, +3 anatomy rows, +1 alias, +3 claims; nothing else anywhere)" \
  || bad "D4: post vector wrong ($(Q "$COUNTS_SQL"))"
[ "$(Q "SELECT e.canonical_name||':'||e.category||':'||e.review_status||':'||e.is_active::text||':'||e.catalog_version::text FROM exercise_catalog e WHERE e.logical_id='$DBU'")" = "Dead bug:mobility:pending:true:1" ] \
  && ok "D5: Dead bug binding exact - ...0002 carries canonical 'Dead bug', HUMAN category mobility, born pending+active v1" \
  || bad "D5: Dead bug binding wrong"
[ "$(Q "SELECT e.canonical_name||':'||e.category||':'||e.review_status||':'||e.is_active::text||':'||e.catalog_version::text FROM exercise_catalog e WHERE e.logical_id='$AWU'")" = "Ab wheel rollout:other:pending:true:1" ] \
  && ok "D6: Ab wheel rollout binding exact - ...0003 carries canonical 'Ab wheel rollout', HUMAN category other, born pending+active v1" \
  || bad "D6: Ab wheel binding wrong"
[ "$(Q "SELECT coalesce(string_agg(m.muscle||':'||m.role, ',' ORDER BY m.muscle), '-') FROM exercise_catalog_muscles m JOIN exercise_catalog e ON e.id=m.catalog_id WHERE e.logical_id='$DBU'")" = "hip_flexors:secondary" ] \
  && ok "D7: Dead bug anatomy exact (hip_flexors/secondary, verbatim from the admitted record)" \
  || bad "D7: Dead bug anatomy wrong"
[ "$(Q "SELECT coalesce(string_agg(m.muscle||':'||m.role, ',' ORDER BY m.muscle), '-') FROM exercise_catalog_muscles m JOIN exercise_catalog e ON e.id=m.catalog_id WHERE e.logical_id='$AWU'")" = "lats:tertiary,obliques:secondary" ] \
  && ok "D8: Ab wheel rollout anatomy exact (lats/tertiary + obliques/secondary, verbatim)" \
  || bad "D8: Ab wheel anatomy wrong"
[ "$(Q "SELECT coalesce((SELECT string_agg(a.alias, ',') FROM exercise_catalog_aliases a WHERE a.logical_id='$DBU'), '-') || '|' || coalesce((SELECT string_agg(a.alias, ',') FROM exercise_catalog_aliases a WHERE a.logical_id='$AWU'), '-')")" = "-|Ab roller rollout" ] \
  && ok "D9: aliases exact - Dead bug none, Ab wheel rollout exactly 'Ab roller rollout' (verbatim)" \
  || bad "D9: aliases wrong"
[ "$(Q "SELECT string_agg(c.normalized_name||'='||c.claim_source||'>'||c.logical_id::text, ' | ' ORDER BY c.normalized_name) FROM exercise_catalog_name_claims c WHERE c.logical_id IN ('$DBU','$AWU')")" = "ab roller rollout=alias>$AWU | ab wheel rollout=canonical>$AWU | dead bug=canonical>$DBU" ] \
  && ok "D10: claims exact and UNSWAPPED - dead bug canonical to ...0002; ab wheel rollout canonical + ab roller rollout alias to ...0003" \
  || bad "D10: claims wrong"
NAME_TO_UUID=$(Q "SELECT (SELECT e.logical_id::text FROM exercise_catalog e WHERE e.canonical_name='Dead bug')||'|'||(SELECT e.logical_id::text FROM exercise_catalog e WHERE e.canonical_name='Ab wheel rollout')")
[ "$NAME_TO_UUID" = "$DBU|$AWU" ] \
  && ok "D11: CROSS no-swap proof in the reverse direction - each canonical name resolves to exactly its intended UUID" \
  || bad "D11: name->UUID resolution swapped ($NAME_TO_UUID)"
[ "$(Q "$PLANK_DIGEST_SQL")" = "$PLANK_PRE" ] \
  && ok "D12: the ENTIRE Plank surface (snapshot, content, aliases, claims, expected relationships) is digest-identical to the pre-state - byte/value untouched" \
  || bad "D12: Plank surface changed"
[ "$(Q "$TENANT_DIGEST_SQL")" = "$TENANT_PRE" ] \
  && ok "D13: the tenant exercises table is count+digest identical - zero product-visible change" \
  || bad "D13: tenant exercises changed"
[ "$(Q "SELECT count(*) FROM exercise_catalog_content c WHERE c.logical_id IN ('$DBU','$AWU')")" = "0" ] \
  && ok "D14: NO content versions exist for either target (this package loads snapshots, never content)" \
  || bad "D14: target content appeared"
[ "$(Q "SELECT (SELECT count(*) FROM exercise_catalog_relationships)::text||'/'||(SELECT count(*) FROM exercise_catalog_import_runs)::text||'/'||(SELECT count(*) FROM exercise_catalog_run_items)::text||'/'||(SELECT count(*) FROM exercise_catalog_review_events)::text")" = "0/0/0/0" ] \
  && ok "D15: zero relationship projection, zero import runs, zero run items, zero review events - no run, delivery, publication, or review state anywhere" \
  || bad "D15: forbidden state appeared"
SEED_REF=$(grep -c 'seed_link_compatible.*true' src/lib/supabase/seed-exercises.ts 2>/dev/null || true)
[ "$SEED_REF" = "0" ] \
  && ok "D16: no seed or compatibility change (the package touches no repository file; seed_link_compatible stays false in the frozen inventory)" \
  || bad "D16: unexpected seed reference"
[ "$(Q "SELECT orphaned_claims::text||'/'||unclaimed_bearers::text FROM exlib_verify_catalog_claims()")" = "0/0" ] \
  && ok "D17: the catalog claims invariant holds EXACTLY (0/0) after the load" \
  || bad "D17: claims invariant broken"

echo
echo "=== E. One-use: the second execution refuses BEFORE writing"
psql -h "$SOCK" -U postgres -d postgres -X -v ON_ERROR_STOP=1 -q -f "$PACKAGE" > "$TMP/2o-second.out" 2>&1 \
  && bad "E1: the second execution SUCCEEDED (it must refuse)" \
  || grep -q 'refuses to run twice, over foreign state, or over an ambiguous surface' "$TMP/2o-second.out" \
    && ok "E1: the second execution refused fail-closed at the pre-state gate (one-use), before any write or authority change" \
    || bad "E1: refused, but not by the one-use gate" "$(tail -2 "$TMP/2o-second.out" | tr '\n' ' ')"
[ "$(Q "$COUNTS_SQL")" = "$POST_VECTOR" ] && [ "$(Q "$BASELINE_SQL")" = "$BASELINE_OK" ] \
  && ok "E2: the refused second execution changed NOTHING - post vector and authority baseline are exactly as after the single load" \
  || bad "E2: second execution left state or authority drift"

echo
echo "=== F. Refusal matrix - each variant on a FRESH pre-state copy; rollback + restoration proven every time"
VN=0
V=""
new_variant() { # creates a fresh scratch db from the template into $V
  VN=$((VN+1))
  V="exlib2o_v$VN"
  QA "DROP DATABASE IF EXISTS $V" >/dev/null 2>&1
  QA "CREATE DATABASE $V TEMPLATE exlib2o_prestate OWNER postgres" >/dev/null
}
run_pkg() { # DB FILE OUTFILE -> exit status of psql
  psql -h "$SOCK" -U postgres -d "$1" -X -v ON_ERROR_STOP=1 -q -f "$2" > "$3" 2>&1
}
expect_pkg_refusal() { # NAME DB FILE PATTERN OUTFILE
  if run_pkg "$2" "$3" "$5"; then
    bad "$1" "the package SUCCEEDED (it must refuse)"
  elif grep -q "$4" "$5"; then
    ok "$1"
  else
    bad "$1" "refused, but not by the expected gate: $(tail -2 "$5" | tr '\n' ' ')"
  fi
}
assert_rolled_back() { # NAME DB [expected-vector]
  local want="${3:-$PRE_VECTOR}"
  [ "$(Q "$COUNTS_SQL" "$2")" = "$want" ] && [ "$(Q "$BASELINE_SQL" "$2")" = "$BASELINE_OK" ] \
    && ok "$1" \
    || bad "$1" "counts=$(Q "$COUNTS_SQL" "$2") baseline=$(Q "$BASELINE_SQL" "$2")"
}

# F1 missing identity (counts-neutral: replace ...0003 with a decoy).
# HARNESS SURGERY, DISCLOSED: the Plank draft's expected relationships
# reference both targets by FK, and the expected-relationships freeze
# trigger forbids edits - both protections working exactly as
# designed. To build the counterfactual the harness (superuser PROBE
# authority only) disables that table's triggers, repoints the one
# row that references ...0003 at the Plank identity, deletes the
# identity, inserts a decoy to keep the count vector exact, and
# re-enables the triggers. The package under test is untouched.
new_variant
QA "ALTER TABLE exercise_catalog_content_expected_relationships DISABLE TRIGGER ALL;
    UPDATE exercise_catalog_content_expected_relationships SET to_logical_id='$PL' WHERE to_logical_id='$AWU';
    ALTER TABLE exercise_catalog_content_expected_relationships ENABLE TRIGGER ALL;
    DELETE FROM exercise_catalog_logical WHERE id='$AWU';
    INSERT INTO exercise_catalog_logical (id) VALUES ('e21b2c00-0000-4000-a000-00000000dead');" "$V" >/dev/null
expect_pkg_refusal "F1: MISSING IDENTITY refused - counts intact but ...0003 absent hits the identity-existence gate" \
  "$V" "$PACKAGE" 'an expected logical identity is missing' "$TMP/f1.out"
assert_rolled_back "F1b: rollback + authority exact after the missing-identity refusal" "$V"

# F2 foreign target claim (counts-neutral: repoint a Plank claim at a target)
# HARNESS SURGERY, DISCLOSED: the claims-maintenance trigger owns
# this table in production; the harness repoints one claim row under
# superuser PROBE authority to build the counterfactual.
new_variant
QA "UPDATE exercise_catalog_name_claims SET logical_id='$DBU' WHERE normalized_name='front plank';" "$V" >/dev/null
expect_pkg_refusal "F2: UNEXPECTED PRE-EXISTING TARGET STATE refused - a claim pointing at ...0002 hits the bare-target gate" \
  "$V" "$PACKAGE" 'a target identity already carries snapshot/alias/claim state' "$TMP/f2.out"
[ "$(Q "$BASELINE_SQL" "$V")" = "$BASELINE_OK" ] && ok "F2b: authority baseline exact after refusal" || bad "F2b: baseline drifted"

# F3 claimed intended name (counts-neutral: rename an existing claim to 'dead bug')
new_variant
QA "UPDATE exercise_catalog_name_claims SET normalized_name='dead bug' WHERE normalized_name='front plank';" "$V" >/dev/null
expect_pkg_refusal "F3: CLAIMED/RENAMED NAME refused - 'dead bug' already claimed elsewhere hits the unclaimed-names gate" \
  "$V" "$PACKAGE" 'an intended catalog name is already claimed' "$TMP/f3.out"
[ "$(Q "$BASELINE_SQL" "$V")" = "$BASELINE_OK" ] && ok "F3b: authority baseline exact after refusal" || bad "F3b: baseline drifted"

# F4 unexpected pre-existing snapshot on a target (counts change too; the
# vector gate is the outermost net and must catch it BEFORE any write)
new_variant
QA "INSERT INTO exercise_catalog (logical_id, canonical_name, category, primary_muscle, equipment, laterality, tracking_mode, provenance, movement_pattern, training_role, difficulty, availability)
    VALUES ('$DBU', 'Foreign Squat', 'compound', 'quads', 'barbell', 'bilateral', 'weight_reps', 'forgefitos_original', 'squat', 'accessory', 'beginner', 'minimal');" "$V" >/dev/null
expect_pkg_refusal "F4: UNEXPECTED PRE-EXISTING SNAPSHOT refused at the outermost exact-surface vector gate, before any write" \
  "$V" "$PACKAGE" 'refuses to run twice, over foreign state, or over an ambiguous surface' "$TMP/f4.out"
[ "$(Q "$BASELINE_SQL" "$V")" = "$BASELINE_OK" ] && ok "F4b: authority baseline exact after refusal" || bad "F4b: baseline drifted"

# F5 malformed category (sed a COPY; illegal vocabulary word)
new_variant
sed 's/\$cat1\$mobility\$cat1\$/\$cat1\$stretching\$cat1\$/' "$PACKAGE" > "$TMP/pkg-badcat.sql"
grep -q 'stretching' "$TMP/pkg-badcat.sql" || bad "F5-setup: tamper failed"
expect_pkg_refusal "F5: MALFORMED CATEGORY refused by the table vocabulary CHECK inside the loader call - the whole transaction aborts" \
  "$V" "$TMP/pkg-badcat.sql" 'violates check constraint' "$TMP/f5.out"
assert_rolled_back "F5b: WHOLE-TRANSACTION rollback after the mid-load failure - pre-state vector and baseline exact" "$V"

# F6 swapped UUIDs between the two calls (post-binding must catch it)
new_variant
sed -e "s/'$DBU',\$/'SWAP_TMP',/" -e "s/'$AWU',\$/'$DBU',/" -e "s/'SWAP_TMP',\$/'$AWU',/" "$PACKAGE" > "$TMP/pkg-swap.sql"
[ "$(grep -c "'$DBU',\$" "$TMP/pkg-swap.sql")" = "1" ] || bad "F6-setup: swap failed"
expect_pkg_refusal "F6: SWAPPED UUID/NAME refused by the independent per-target binding postcondition - the load itself succeeded mechanically and was rolled back whole" \
  "$V" "$TMP/pkg-swap.sql" 'snapshot binding is not exact' "$TMP/f6.out"
assert_rolled_back "F6b: WHOLE-TRANSACTION rollback after the swapped load - nothing persisted" "$V"

# F7 tampered anatomy payload (legal vocabulary, wrong value)
new_variant
sed 's/"muscle": "hip_flexors"/"muscle": "abs"/' "$PACKAGE" > "$TMP/pkg-anat.sql"
expect_pkg_refusal "F7: TAMPERED PAYLOAD refused - a vocabulary-legal but non-verbatim anatomy value fails the exact-anatomy postcondition and rolls back whole" \
  "$V" "$TMP/pkg-anat.sql" 'anatomy rows are not exact' "$TMP/f7.out"
assert_rolled_back "F7b: WHOLE-TRANSACTION rollback after the tampered load" "$V"

# F8 omitted loader call (delete the second SELECT block)
new_variant
awk '/^SELECT load_catalog_snapshot\(/{n++} n==2 && !done { if (/\);$/) {done=1}; next } {print}' "$PACKAGE" > "$TMP/pkg-omit.sql"
[ "$(grep -c '^SELECT load_catalog_snapshot(' "$TMP/pkg-omit.sql")" = "1" ] || bad "F8-setup: omission failed"
expect_pkg_refusal "F8: OMITTED LOADER CALL refused - the exact post-state vector postcondition catches the missing snapshot and rolls back whole" \
  "$V" "$TMP/pkg-omit.sql" 'post-state counts are not exact' "$TMP/f8.out"
assert_rolled_back "F8b: WHOLE-TRANSACTION rollback after the incomplete load" "$V"

# F9 widened authority baseline (extra standing membership row).
# The widening member is a THROWAWAY role: PostgreSQL keys membership
# rows by (role, member, grantor), so granting to postgres again from
# supabase_admin would MODIFY the baseline row rather than add one,
# and revoking it would DESTROY the baseline cluster-wide (roles are
# cluster-level). A separate member role widens the membership COUNT
# without touching the baseline row at all.
new_variant
QA "CREATE ROLE exlib2o_widen NOLOGIN; GRANT exlib_catalog_loader TO exlib2o_widen;" "$V" >/dev/null
expect_pkg_refusal "F9: AUTHORITY-BASELINE MISMATCH refused - a widened standing membership fails the grantor-included baseline gate before any write" \
  "$V" "$PACKAGE" 'membership posture is not the exact hosted baseline' "$TMP/f9.out"
QA "REVOKE exlib_catalog_loader FROM exlib2o_widen; DROP ROLE exlib2o_widen;" "$V" >/dev/null
[ "$(Q "$COUNTS_SQL" "$V")" = "$PRE_VECTOR" ] && [ "$(Q "$BASELINE_SQL" "$V")" = "$BASELINE_OK" ] \
  && ok "F9b: no state change from the refused run; the baseline row untouched throughout" || bad "F9b: state drifted"

echo
echo "=== G. RACE: two simultaneous sessions - exactly one committer"
new_variant
[ "$(Q "$BASELINE_SQL" "$V")" = "$BASELINE_OK" ] \
  && ok "G0: cluster-wide authority baseline exact entering the race (harness left no pollution)" \
  || bad "G0: baseline polluted before the race ($(Q "$BASELINE_SQL" "$V"))"
run_pkg "$V" "$PACKAGE" "$TMP/race-a.out" &
PID_A=$!
run_pkg "$V" "$PACKAGE" "$TMP/race-b.out" &
PID_B=$!
wait $PID_A; RA=$?
wait $PID_B; RB=$?
WINS=0
[ $RA -eq 0 ] && WINS=$((WINS+1))
[ $RB -eq 0 ] && WINS=$((WINS+1))
if [ "$WINS" = "1" ]; then
  ok "G1: exactly one committer - the SHARE ROW EXCLUSIVE lock serialized the two simultaneous executions (statuses: A=$RA B=$RB)"
else
  bad "G1: expected exactly one committer, got $WINS (A=$RA B=$RB)"
fi
grep -q 'refuses to run twice, over foreign state, or over an ambiguous surface' "$TMP/race-a.out" "$TMP/race-b.out" \
  && ok "G2: the losing session refused at the one-use pre-state gate AFTER waiting on the winner's lock (never a partial write)" \
  || bad "G2: loser refusal message missing"
[ "$(Q "$COUNTS_SQL" "$V")" = "$POST_VECTOR" ] \
  && ok "G3: the raced database holds EXACTLY one application of the package ($POST_VECTOR)" \
  || bad "G3: raced state wrong ($(Q "$COUNTS_SQL" "$V"))"
[ "$(Q "$BASELINE_SQL" "$V")" = "$BASELINE_OK" ] \
  && ok "G4: authority baseline exact after the race" \
  || bad "G4: baseline drifted after the race"

echo
printf '%d passed, %d failed\n' "$PASS" "$FAIL"
[ "$FAIL" = "0" ] || exit 1
