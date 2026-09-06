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
# restoration), the refusal matrix — SIXTEEN counterfactual variants,
# each on a fresh scratch database copied from a pre-state template
# with whole-transaction rollback and restored authority proven after
# EVERY one, plus the second-execution (one-use) refusal proven on the
# loaded database: missing identity, foreign target claim, claimed
# name, unexpected pre-existing snapshot, malformed category, swapped
# UUIDs, tampered anatomy payload, omitted loader call, widened
# authority baseline, the five Codex round-2 additions (pre-existing
# review event, mutated Plank content payload, reviewed+admitted Plank
# lifecycle, repointed Plank expected relationship, drifted Plank
# snapshot field), the round-3 JSONB payload drift, and the round-3
# search_path HIJACK of an unqualified loader call — a REAL two-session
# serialization RACE proving exactly one committer, and a REAL
# three-session lock proof that a review-events writer is excluded
# from the package's gated interval.
#
# Codex round-3 additions (§H and the two payload counterfactuals):
# the cluster runs with track_functions=all, so per-function call
# counts are available from pg_stat_user_functions. Those counts are
# NON-TRANSACTIONAL — they survive a rollback — which makes them the
# right instrument for proving what a REFUSED run did not do. §H
# builds a REAL same-signature decoy load_catalog_snapshot in a schema
# placed AHEAD of public in the database's search_path and proves the
# qualified call in the package still reaches public.load_catalog_snapshot
# exactly twice while the decoy is never invoked; the teeth of that
# test are proven by running a sed-derived UNQUALIFIED copy of the
# same package against the same decoy, which IS hijacked.
#
# Every counterfactual mutation is applied through surgery(), which
# fails loudly if the mutation does not land: a silently rejected
# surgery would leave the pre-state pristine and turn a refusal test
# into a test of nothing.
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
COUNTS_SQL="SELECT (SELECT count(*) FROM exercise_catalog_logical)::text||'/'||(SELECT count(*) FROM exercise_catalog)::text||'/'||(SELECT count(*) FROM exercise_catalog_muscles)::text||'/'||(SELECT count(*) FROM exercise_catalog_aliases)::text||'/'||(SELECT count(*) FROM exercise_catalog_name_claims)::text||'/'||(SELECT count(*) FROM exercise_catalog_content)::text||'/'||(SELECT count(*) FROM exercise_catalog_content_expected_relationships)::text||'/'||(SELECT count(*) FROM exercise_catalog_relationships)::text||'/'||(SELECT count(*) FROM exercise_catalog_import_runs)::text||'/'||(SELECT count(*) FROM exercise_catalog_run_items)::text||'/'||(SELECT count(*) FROM exercise_catalog_review_events)::text"
PRE_VECTOR="3/1/2/2/3/1/2/0/0/0/0"
POST_VECTOR="3/3/5/3/6/1/2/0/0/0/0"
PLANK_DIGEST_SQL="SELECT md5((SELECT coalesce(string_agg(e::text,'|' ORDER BY e.id),'-') FROM exercise_catalog e WHERE e.logical_id='e21b2c00-0000-4000-a000-000000000001') || (SELECT coalesce(string_agg(c::text,'|' ORDER BY c.id),'-') FROM exercise_catalog_content c WHERE c.logical_id='e21b2c00-0000-4000-a000-000000000001') || (SELECT coalesce(string_agg(a::text,'|' ORDER BY a.alias),'-') FROM exercise_catalog_aliases a WHERE a.logical_id='e21b2c00-0000-4000-a000-000000000001') || (SELECT coalesce(string_agg(n::text,'|' ORDER BY n.normalized_name),'-') FROM exercise_catalog_name_claims n WHERE n.logical_id='e21b2c00-0000-4000-a000-000000000001') || (SELECT coalesce(string_agg(x::text,'|' ORDER BY x.relation, x.to_logical_id),'-') FROM exercise_catalog_content_expected_relationships x))"
TENANT_DIGEST_SQL="SELECT count(*)::text || ':' || md5(coalesce(string_agg(t::text,'|' ORDER BY t.id),'-')) FROM exercises t"
# Codex round-3 instrument: per-function invocation counts. These are
# NON-TRANSACTIONAL - PostgreSQL does not roll back statistics - so a
# zero here is durable evidence that a REFUSED run never reached the
# loader, and a two is durable evidence about which schema's function
# actually ran. pg_stat_user_functions is per-database, and every
# variant database is freshly created (a new database oid), so each
# variant starts from zero with no inherited counts.
CALLS_PUB="SELECT coalesce((SELECT sum(s.calls) FROM pg_stat_user_functions s JOIN pg_proc p ON p.oid=s.funcid JOIN pg_namespace n ON n.oid=p.pronamespace WHERE p.proname='load_catalog_snapshot' AND n.nspname='public'),0)::text"
CALLS_DEC="SELECT coalesce((SELECT sum(s.calls) FROM pg_stat_user_functions s JOIN pg_proc p ON p.oid=s.funcid JOIN pg_namespace n ON n.oid=p.pronamespace WHERE p.proname='load_catalog_snapshot' AND n.nspname='exlib2o_decoy'),0)::text"
CALLS_PROBE="SELECT coalesce((SELECT sum(s.calls) FROM pg_stat_user_functions s JOIN pg_proc p ON p.oid=s.funcid WHERE p.proname='exlib2o_stat_probe'),0)::text"
TRACKFN_SQL="SELECT current_setting('track_functions')"
# the exact 18-argument signature of the migration-027 loader, used to
# build a same-signature decoy and to probe unqualified resolution
LOADER_SIG="uuid,text,text,text,text,text,text,text,text,text,text,text,text,text,date,text,jsonb,jsonb"
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
# Codex round-3: the loader calls must be SCHEMA-QUALIFIED, so the
# function the package's precondition proves to exist
# (to_regprocedure('public.load_catalog_snapshot(...)')) is the exact
# function the package invokes, whatever search_path happens to be.
# UNQUAL counts call sites of the bare name anywhere in the package -
# it must be zero. (The bare name still appears in prose and in the
# precondition's own error text, which is why the pattern requires the
# opening parenthesis of a call.)
SNAP_CALLS=$(grep -c '^SELECT public\.load_catalog_snapshot(' "$PACKAGE")
UNQUAL=$(grep -cE '(^|[^.[:alnum:]_])load_catalog_snapshot[[:space:]]*\(' "$PACKAGE" || true)
IDENT_CALLS=$(grep -c 'load_catalog_identity(' "$PACKAGE" || true)
DRAFT_CALLS=$(grep -cE "^SELECT load_catalog_content_draft\(" "$PACKAGE" || true)
[ "$SNAP_CALLS/$UNQUAL/$IDENT_CALLS/$DRAFT_CALLS" = "2/0/0/0" ] \
  && ok "A5: exactly TWO SCHEMA-QUALIFIED public.load_catalog_snapshot calls and ZERO unqualified call sites; zero identity or content-draft calls (targets already exist; no content loads)" \
  || bad "A5: loader-call shape wrong (qualified=$SNAP_CALLS unqualified=$UNQUAL identity=$IDENT_CALLS draft=$DRAFT_CALLS)"

echo
echo "=== B. Disposable cluster + migrations 001-027 + tenant fixture + hosted posture"
initdb -D "$PGDATA" -U supabase_admin --no-locale -E UTF8 >/dev/null 2>&1
# track_functions=all arms the per-function call counters used by the
# round-3 checks (§F11/§F15 zero-invocation proofs and §H's
# which-function-actually-ran proof). It is an observation setting only:
# it changes no name resolution, no privilege and no result.
pg_ctl -D "$PGDATA" -o "-c listen_addresses='' -c unix_socket_directories='$SOCK' -c track_functions=all" -l "$TMP/pg.log" start >/dev/null 2>&1
if QA "SELECT 1" >/dev/null 2>&1 && [ "$(QA "$TRACKFN_SQL")" = "all" ]; then
  ok "B1: cluster up at $SOCK (unix socket only; no TCP; no hosted contact; bootstrap superuser = supabase_admin, platform substrate only; track_functions=all so per-function invocation counts are armed)"
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
  && ok "D4: EXACT two-snapshot result - the ELEVEN-table vector is $POST_VECTOR (+2 snapshots, +3 anatomy rows, +1 alias, +3 claims; nothing else anywhere, review events included)" \
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
  && ok "D13: the tenant exercises table is count + WHOLE-ROW digest identical (every persisted column, deterministic row::text ordered by id) - zero product change" \
  || bad "D13: tenant exercises changed"
[ "$(Q "SELECT count(*) FROM exercise_catalog_content c WHERE c.logical_id IN ('$DBU','$AWU')")" = "0" ] \
  && ok "D14: NO content versions exist for either target (this package loads snapshots, never content)" \
  || bad "D14: target content appeared"
[ "$(Q "SELECT (SELECT count(*) FROM exercise_catalog_relationships)::text||'/'||(SELECT count(*) FROM exercise_catalog_import_runs)::text||'/'||(SELECT count(*) FROM exercise_catalog_run_items)::text||'/'||(SELECT count(*) FROM exercise_catalog_review_events)::text")" = "0/0/0/0" ] \
  && ok "D15: zero relationship projection, zero import runs, zero run items, zero review events - external defense-in-depth over the same facts the package now proves internally" \
  || bad "D15: forbidden state appeared"
# RETARGET (EXLIB-2S delivery-activation preparation): the seed is
# anchored at the promoted EXLIB-2R evidence tip (the
# delivery-activation predecessor), where this milestone's claim was
# and remains true; EXLIB-2S later edits the seed as its own
# reviewed act.
SEED_REF=$(git show 5f7e182f3027b3640514e06d642693f4018c03e2:src/lib/supabase/seed-exercises.ts 2>/dev/null | grep -c 'seed_link_compatible.*true' || true)
[ "$SEED_REF" = "0" ] \
  && ok "D16: no seed or compatibility change through this milestone (anchored at the delivery predecessor; the package touches no repository file and seed_link_compatible stayed false there)" \
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
# surgery: a harness PROBE mutation that MUST land. Checked because a
# silently failing counterfactual leaves the pre-state PRISTINE, and a
# refusal test over pristine state proves nothing about the gate it
# claims to exercise. psql -c runs the whole surgery as one implicit
# transaction, so a rejected statement also rolls back its own
# DISABLE TRIGGER. Failures are reported, never swallowed.
surgery() { # LABEL SQL   (operates on $V)
  local out rc
  out=$(QQA "$2" "$V"); rc=$?
  if [ "$rc" != "0" ]; then
    bad "HARNESS SURGERY FAILED [$1] - the counterfactual was never built, so the variant below would have tested PRISTINE state" \
        "$(printf '%s' "$out" | tr '\n' ' ' | cut -c1-240)"
    return 1
  fi
  return 0
}
await_calls() { # SQL WANT [TRIES] -> echoes the observed count; rc 1 if it never matched
  local i out=""
  for i in $(seq 1 "${3:-20}"); do
    out=$(Q "$1" "$V" 2>/dev/null)
    [ "$out" = "$2" ] && { printf '%s' "$out"; return 0; }
    sleep 0.25
  done
  printf '%s' "${out:-?}"; return 1
}
# loader_never_invoked: durable proof that a REFUSED run never reached
# the loader calls. Function-call statistics are NOT rolled back, so a
# zero here cannot be an artifact of the aborted transaction - it means
# the invocation never happened. The liveness probe that follows is a
# CONTROL in the same database: it creates and calls a throwaway
# function and requires the counter to register it, so a zero above can
# never be a dead instrument reading. DISCLOSED: the probe leaves one
# throwaway function behind in a scratch variant database, created
# AFTER the measurement, touching no product table and no authority.
loader_never_invoked() { # LABEL   (operates on $V)
  local calls track probe
  calls=$(Q "$CALLS_PUB" "$V"); track=$(Q "$TRACKFN_SQL" "$V")
  QA "CREATE FUNCTION public.exlib2o_stat_probe() RETURNS int LANGUAGE plpgsql AS \$fn\$BEGIN RETURN 1; END\$fn\$;" "$V" >/dev/null 2>&1
  QA "SELECT public.exlib2o_stat_probe()" "$V" >/dev/null 2>&1
  probe=$(await_calls "$CALLS_PROBE" "1")
  { [ "$calls" = "0" ] && [ "$track" = "all" ] && [ "$probe" = "1" ]; } \
    && ok "$1" \
    || bad "$1" "public.load_catalog_snapshot calls=$calls track_functions=$track liveness-probe calls=$probe"
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
surgery "F1 missing identity" "ALTER TABLE exercise_catalog_content_expected_relationships DISABLE TRIGGER ALL;
    UPDATE exercise_catalog_content_expected_relationships SET to_logical_id='$PL' WHERE to_logical_id='$AWU';
    ALTER TABLE exercise_catalog_content_expected_relationships ENABLE TRIGGER ALL;
    DELETE FROM exercise_catalog_logical WHERE id='$AWU';
    INSERT INTO exercise_catalog_logical (id) VALUES ('e21b2c00-0000-4000-a000-00000000dead');"
expect_pkg_refusal "F1: MISSING IDENTITY refused - counts intact but ...0003 absent hits the identity-existence gate" \
  "$V" "$PACKAGE" 'an expected logical identity is missing' "$TMP/f1.out"
assert_rolled_back "F1b: rollback + authority exact after the missing-identity refusal" "$V"

# F2 foreign target claim (counts-neutral: repoint a Plank claim at a target)
# HARNESS SURGERY, DISCLOSED: the claims-maintenance trigger owns
# this table in production; the harness repoints one claim row under
# superuser PROBE authority to build the counterfactual.
new_variant
surgery "F2 foreign target claim" "UPDATE exercise_catalog_name_claims SET logical_id='$DBU' WHERE normalized_name='front plank';"
expect_pkg_refusal "F2: UNEXPECTED PRE-EXISTING TARGET STATE refused - a claim pointing at ...0002 hits the bare-target gate" \
  "$V" "$PACKAGE" 'a target identity already carries snapshot/alias/claim state' "$TMP/f2.out"
[ "$(Q "$BASELINE_SQL" "$V")" = "$BASELINE_OK" ] && ok "F2b: authority baseline exact after refusal" || bad "F2b: baseline drifted"

# F3 claimed intended name (counts-neutral: rename an existing claim to 'dead bug')
new_variant
surgery "F3 claimed intended name" "UPDATE exercise_catalog_name_claims SET normalized_name='dead bug' WHERE normalized_name='front plank';"
expect_pkg_refusal "F3: CLAIMED/RENAMED NAME refused - 'dead bug' already claimed elsewhere hits the unclaimed-names gate" \
  "$V" "$PACKAGE" 'an intended catalog name is already claimed' "$TMP/f3.out"
[ "$(Q "$BASELINE_SQL" "$V")" = "$BASELINE_OK" ] && ok "F3b: authority baseline exact after refusal" || bad "F3b: baseline drifted"

# F4 unexpected pre-existing snapshot on a target (counts change too; the
# vector gate is the outermost net and must catch it BEFORE any write)
new_variant
surgery "F4 foreign snapshot on a target" "INSERT INTO exercise_catalog (logical_id, canonical_name, category, primary_muscle, equipment, laterality, tracking_mode, provenance, movement_pattern, training_role, difficulty, availability)
    VALUES ('$DBU', 'Foreign Squat', 'compound', 'quads', 'barbell', 'bilateral', 'weight_reps', 'forgefitos_original', 'squat', 'accessory', 'beginner', 'minimal');"
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
awk '/^SELECT public\.load_catalog_snapshot\(/{n++} n==2 && !done { if (/\);$/) {done=1}; next } {print}' "$PACKAGE" > "$TMP/pkg-omit.sql"
[ "$(grep -c '^SELECT public\.load_catalog_snapshot(' "$TMP/pkg-omit.sql")" = "1" ] || bad "F8-setup: omission failed"
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
surgery "F9 widened authority baseline" "CREATE ROLE exlib2o_widen NOLOGIN; GRANT exlib_catalog_loader TO exlib2o_widen;"
expect_pkg_refusal "F9: AUTHORITY-BASELINE MISMATCH refused - a widened standing membership fails the grantor-included baseline gate before any write" \
  "$V" "$PACKAGE" 'membership posture is not the exact hosted baseline' "$TMP/f9.out"
QA "REVOKE exlib_catalog_loader FROM exlib2o_widen; DROP ROLE exlib2o_widen;" "$V" >/dev/null
[ "$(Q "$COUNTS_SQL" "$V")" = "$PRE_VECTOR" ] && [ "$(Q "$BASELINE_SQL" "$V")" = "$BASELINE_OK" ] \
  && ok "F9b: no state change from the refused run; the baseline row untouched throughout" || bad "F9b: state drifted"

# ── Codex round-2 variants: each mutation is a LEGAL value the OLD
#    package would have accepted, proving the corrected gates close
#    real gaps. All mutations are disclosed harness surgery under
#    superuser PROBE authority with the guarding triggers disabled
#    for exactly the surgical statement, then re-enabled.

# F10 pre-existing review event (was OUTSIDE the old vector/locks)
new_variant
surgery "F10 pre-existing review event" "ALTER TABLE exercise_catalog_review_events DISABLE TRIGGER ALL;
    INSERT INTO exercise_catalog_review_events (id, catalog_id, from_status, to_status, reviewed_by, reviewed_at, review_rationale, created_at)
    SELECT gen_random_uuid(), e.id, 'pending', 'approved', 'drifted-reviewer', now(), 'pre-existing event', now() FROM exercise_catalog e LIMIT 1;
    ALTER TABLE exercise_catalog_review_events ENABLE TRIGGER ALL;"
expect_pkg_refusal "F10: PRE-EXISTING REVIEW EVENT refused - the ELEVEN-term vector gate counts review events and refuses before any write (the old ten-term gate would have passed)" \
  "$V" "$PACKAGE" 'refuses to run twice, over foreign state, or over an ambiguous surface' "$TMP/f10.out"
[ "$(Q "$BASELINE_SQL" "$V")" = "$BASELINE_OK" ] && ok "F10b: authority baseline exact after refusal" || bad "F10b: baseline drifted"

# F11 mutated Plank content payload - SCALAR field (round-2 variant,
# re-pointed by round 3 at the corrected gate). The round-2 gate bound
# this field with an md5 digest; the corrected gate compares it to a
# dollar-quoted literal re-derived from the promoted admitted artifact,
# so the refusal below is now an exact-value refusal with no hash in it.
new_variant
surgery "F11 mutated Plank content payload (scalar safety_guidance)" "ALTER TABLE exercise_catalog_content DISABLE TRIGGER ALL;
    UPDATE exercise_catalog_content SET safety_guidance = safety_guidance || ' Drifted sentence.' WHERE id='e21b2c00-0000-4000-a000-000000000101';
    ALTER TABLE exercise_catalog_content ENABLE TRIGGER ALL;"
expect_pkg_refusal "F11: MUTATED PLANK CONTENT PAYLOAD refused - SCALAR payload field (safety_guidance) drifted; the corrected gate compares it by EXACT VALUE to the dollar-quoted literal re-derived from the admitted artifact - no md5, no digest of any kind" \
  "$V" "$PACKAGE" 'the Plank content draft is not the exact promoted EXLIB-2K state' "$TMP/f11.out"
assert_rolled_back "F11b: no state written; authority exact after refusal" "$V"
loader_never_invoked "F11c: the scalar-payload refusal happened BEFORE the loader calls - durable NON-TRANSACTIONAL function statistics record ZERO public.load_catalog_snapshot invocations in this database (a liveness probe on the same counter registers 1, so the zero is a live observation), and the raised message is the pre-state gate's, which the static verifier pins textually ahead of the GRANT"

# F12 altered Plank content lifecycle (reviewed AND admitted).
# DISCLOSED: migration 027 makes a lone admission flag impossible -
# admission_order_chk forbids admitting a 'pending' version,
# review_audit_chk requires complete review evidence once the status
# leaves 'pending', and admission_chk requires both 64-hex digests
# plus admitted_at. So the counterfactual moves the whole lifecycle
# set together, which is exactly the point: this is a FULLY
# SCHEMA-LEGAL approved+admitted draft that the old gate (which read
# only id, logical_id and content_version) would have accepted.
new_variant
surgery "F12 reviewed+admitted Plank content" "ALTER TABLE exercise_catalog_content DISABLE TRIGGER ALL;
    UPDATE exercise_catalog_content SET
      content_status = 'approved',
      reviewed_by = 'drifted-specialist',
      reviewed_at = now(),
      review_rationale = 'drifted approval that never happened',
      import_admitted = true,
      admitted_fingerprint = repeat('a',64),
      admitted_source_sha256 = repeat('b',64),
      admitted_at = DATE '2026-09-03'
    WHERE id='e21b2c00-0000-4000-a000-000000000101';
    ALTER TABLE exercise_catalog_content ENABLE TRIGGER ALL;"
[ "$(Q "SELECT content_status||'/'||import_admitted::text||'/'||publication_status FROM exercise_catalog_content WHERE id='e21b2c00-0000-4000-a000-000000000101'" "$V")" = "approved/true/draft" ] \
  && ok "F12-setup: the counterfactual is present and SCHEMA-LEGAL - the draft now reads approved/admitted/draft, satisfying every migration-027 lifecycle CHECK" \
  || bad "F12-setup: the reviewed+admitted counterfactual did not land" "$(Q "SELECT content_status||'/'||import_admitted::text||'/'||publication_status FROM exercise_catalog_content WHERE id='e21b2c00-0000-4000-a000-000000000101'" "$V")"
expect_pkg_refusal "F12: ALTERED PLANK LIFECYCLE refused - a schema-legal approved+admitted draft fails the authoritative pending/unadmitted/draft gate before any authority change (the old content gate read only id/logical_id/content_version and would have accepted it)" \
  "$V" "$PACKAGE" 'the Plank content draft is not the exact promoted EXLIB-2K state' "$TMP/f12.out"
[ "$(Q "$BASELINE_SQL" "$V")" = "$BASELINE_OK" ] && ok "F12b: authority baseline exact after refusal" || bad "F12b: baseline drifted"

# F13 altered Plank expected relationship (repointed, count-neutral)
new_variant
surgery "F13 repointed expected relationship" "ALTER TABLE exercise_catalog_content_expected_relationships DISABLE TRIGGER ALL;
    UPDATE exercise_catalog_content_expected_relationships SET to_logical_id='$PL' WHERE relation='substitution';
    ALTER TABLE exercise_catalog_content_expected_relationships ENABLE TRIGGER ALL;"
expect_pkg_refusal "F13: ALTERED EXPECTED RELATIONSHIP refused - the exact relation set gate catches a repointed row the old count-only view accepted" \
  "$V" "$PACKAGE" 'the Plank expected-relationship set is not the exact promoted EXLIB-2K state' "$TMP/f13.out"
[ "$(Q "$BASELINE_SQL" "$V")" = "$BASELINE_OK" ] && ok "F13b: authority baseline exact after refusal" || bad "F13b: baseline drifted"

# F14 altered Plank snapshot semantic field (legal vocabulary value)
new_variant
surgery "F14 drifted Plank difficulty" "ALTER TABLE exercise_catalog DISABLE TRIGGER ALL;
    UPDATE exercise_catalog SET difficulty='intermediate' WHERE logical_id='$PL';
    ALTER TABLE exercise_catalog ENABLE TRIGGER ALL;"
expect_pkg_refusal "F14: ALTERED PLANK SNAPSHOT FIELD refused - a vocabulary-legal difficulty drift fails the complete snapshot gate (the old gate checked only name/active/pending/v1)" \
  "$V" "$PACKAGE" 'the Plank snapshot is not the exact promoted EXLIB-2K state' "$TMP/f14.out"
[ "$(Q "$BASELINE_SQL" "$V")" = "$BASELINE_OK" ] && ok "F14b: authority baseline exact after refusal" || bad "F14b: baseline drifted"

# ── Codex round-3 variant: the JSONB half of the payload counterfactual
#    (F11 above is the SCALAR half, re-pointed at the corrected gate).
# F15 mutated Plank content payload - JSONB field.
# DISCLOSED HONESTLY: jsonb canonicalizes on input (whitespace stripped,
# object keys sorted), so a representation-only drift of a jsonb column
# is not constructible - there is no such state to test, and the round-2
# md5-over-text binding was therefore never exposed to formatting drift.
# What IS constructible, and what an md5 binding could only ever prove
# by collision resistance, is a VALUE drift: this variant rewrites one
# array element, and the corrected gate compares the whole column to an
# authoritative jsonb literal by JSONB EQUALITY.
new_variant
surgery "F15 mutated Plank content payload (jsonb setup_steps)" "ALTER TABLE exercise_catalog_content DISABLE TRIGGER ALL;
    UPDATE exercise_catalog_content SET setup_steps = jsonb_set(setup_steps, '{0}', to_jsonb('Drifted first setup step.'::text)) WHERE id='e21b2c00-0000-4000-a000-000000000101';
    ALTER TABLE exercise_catalog_content ENABLE TRIGGER ALL;"
[ "$(Q "SELECT setup_steps->>0 FROM exercise_catalog_content WHERE id='e21b2c00-0000-4000-a000-000000000101'" "$V")" = "Drifted first setup step." ] \
  && ok "F15-setup: the jsonb payload drift is present and VALUE-level (element 0 of setup_steps rewritten - jsonb equality, not text formatting, is what the gate must catch)" \
  || bad "F15-setup: the jsonb drift did not land" "$(Q "SELECT setup_steps->>0 FROM exercise_catalog_content WHERE id='e21b2c00-0000-4000-a000-000000000101'" "$V")"
expect_pkg_refusal "F15: MUTATED PLANK CONTENT PAYLOAD refused - JSONB payload field (setup_steps) drifted; the corrected gate compares the column to an authoritative jsonb literal by JSONB EQUALITY re-derived from the admitted artifact, with no md5 anywhere in the gate" \
  "$V" "$PACKAGE" 'the Plank content draft is not the exact promoted EXLIB-2K state' "$TMP/f15.out"
assert_rolled_back "F15b: no state written; authority exact after the jsonb-payload refusal" "$V"
loader_never_invoked "F15c: the jsonb-payload refusal happened BEFORE the loader calls - durable NON-TRANSACTIONAL function statistics record ZERO public.load_catalog_snapshot invocations in this database (liveness probe on the same counter registers 1)"

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
echo "=== G5. Review-events writer is EXCLUDED from the package's gated interval (real two-session lock proof)"
# A holder session pins run_items (the LAST table in the package's
# alphabetical lock list) so the package session provably HOLDS the
# review_events lock while blocked on run_items; a writer session
# then attempts a review-event INSERT and must WAIT behind the
# package's SHARE ROW EXCLUSIVE lock. Observed via pg_locks while
# both are queued. After the holder releases: the package commits
# clean, and the unblocked writer is rejected by the review-events
# guard trigger - so no review event can enter either during OR
# after the gated interval by direct write.
# Each stage is proven STRUCTURALLY from pg_locks (relation, lock
# mode, granted flag, holder pid) rather than by counting sessions in
# a 'Lock' wait state: a count proves only that somebody waited, and
# a sampled count can miss the window entirely. Every stage also
# blocks until its precondition is observed and reports loudly if it
# never is, so a collapsed premise can never read as a pass.
new_variant
LKPID_HELD="SELECT coalesce((SELECT l.pid FROM pg_locks l JOIN pg_class c ON c.oid = l.relation WHERE l.locktype = 'relation' AND c.relname = 'exercise_catalog_review_events' AND l.mode = 'ShareRowExclusiveLock' AND l.granted LIMIT 1), 0)"
LKPID_WAIT_RUNITEMS="SELECT coalesce((SELECT l.pid FROM pg_locks l JOIN pg_class c ON c.oid = l.relation WHERE l.locktype = 'relation' AND c.relname = 'exercise_catalog_run_items' AND l.mode = 'ShareRowExclusiveLock' AND NOT l.granted LIMIT 1), 0)"
LKPID_WAIT_EVENTS="SELECT coalesce((SELECT l.pid FROM pg_locks l JOIN pg_class c ON c.oid = l.relation WHERE l.locktype = 'relation' AND c.relname = 'exercise_catalog_review_events' AND l.mode = 'RowExclusiveLock' AND NOT l.granted LIMIT 1), 0)"
HOLDER_HELD="SELECT coalesce((SELECT l.pid FROM pg_locks l JOIN pg_class c ON c.oid = l.relation WHERE l.locktype = 'relation' AND c.relname = 'exercise_catalog_run_items' AND l.mode = 'ShareRowExclusiveLock' AND l.granted LIMIT 1), 0)"
await_pid() { # SQL TRIES -> echoes the observed pid; rc 1 if it never appeared
  local i out=0
  for i in $(seq 1 "${2:-40}"); do
    out=$(Q "$1" "$V" 2>/dev/null)
    case "$out" in [1-9]*) printf '%s' "$out"; return 0 ;; esac
    sleep 0.25
  done
  printf '%s' "${out:-0}"; return 1
}
ACTIVITY="SELECT coalesce(string_agg(coalesce(a.usename,'?')||':'||coalesce(a.state,'?')||':'||coalesce(a.wait_event_type,'-')||':'||left(regexp_replace(coalesce(a.query,''),'\s+',' ','g'),48), ' | '), '<no sessions>') FROM pg_stat_activity a WHERE a.datname = '$V' AND a.pid <> pg_backend_pid()"

# Stage 1: a holder session pins run_items - the LAST table in the
# package's alphabetical lock list - so the package must stop INSIDE
# its own LOCK TABLE statement, after taking review_events.
psql -h "$SOCK" -U postgres -d "$V" -X -qtA -c "BEGIN; LOCK TABLE public.exercise_catalog_run_items IN SHARE ROW EXCLUSIVE MODE; SELECT pg_sleep(15); COMMIT;" > "$TMP/g5-holder.out" 2>&1 &
HOLDER_PID=$!
HOLDER_LOCK_PID=$(await_pid "$HOLDER_HELD" 40)
if [ "$HOLDER_LOCK_PID" = "0" ]; then
  bad "G5a: the holder never acquired run_items, so the gated interval was never established (premise collapsed; nothing below would mean anything)" \
      "holder: $(tr '\n' ' ' < "$TMP/g5-holder.out" | cut -c1-200) activity: $(Q "$ACTIVITY" "$V")"
else
  ok "G5a: holder session pid $HOLDER_LOCK_PID holds a GRANTED ShareRowExclusiveLock on exercise_catalog_run_items - the package's last lock is pinned"
fi

# Stage 2: the package now blocks mid-LOCK, holding review_events.
run_pkg "$V" "$PACKAGE" "$TMP/g5-pkg.out" &
PKG_PID=$!
PKG_HOLDS_EVENTS=$(await_pid "$LKPID_HELD" 40)
PKG_WAITS_RUNITEMS=$(Q "$LKPID_WAIT_RUNITEMS" "$V")
if [ "$PKG_HOLDS_EVENTS" != "0" ] && [ "$PKG_HOLDS_EVENTS" = "$PKG_WAITS_RUNITEMS" ]; then
  ok "G5b: the package session (pid $PKG_HOLDS_EVENTS) simultaneously HOLDS a granted ShareRowExclusiveLock on exercise_catalog_review_events and WAITS ungranted on exercise_catalog_run_items - review events are provably INSIDE its serialized boundary"
else
  bad "G5b: the package was not observed holding review_events while waiting on run_items (holds=$PKG_HOLDS_EVENTS waits=$PKG_WAITS_RUNITEMS)" \
      "pkg: $(tr '\n' ' ' < "$TMP/g5-pkg.out" | cut -c1-200) activity: $(Q "$ACTIVITY" "$V")"
fi

# Stage 3: a writer now attempts a direct review-event INSERT and must
# queue behind the package's table lock.
psql -h "$SOCK" -U supabase_admin -d "$V" -X -qtA -c "INSERT INTO exercise_catalog_review_events (id, catalog_id, from_status, to_status, reviewed_by, reviewed_at, review_rationale, created_at) SELECT gen_random_uuid(), e.id, 'pending', 'approved', 'concurrent-writer', now(), 'gated-interval probe', now() FROM exercise_catalog e LIMIT 1;" > "$TMP/g5-writer.out" 2>&1 &
WRITER_PID=$!
WRITER_WAIT_PID=$(await_pid "$LKPID_WAIT_EVENTS" 40)
if [ "$WRITER_WAIT_PID" != "0" ] && [ "$WRITER_WAIT_PID" != "$PKG_HOLDS_EVENTS" ]; then
  ok "G5c: the review-events writer (pid $WRITER_WAIT_PID, a DIFFERENT session from the package's $PKG_HOLDS_EVENTS) is BLOCKED on an ungranted RowExclusiveLock on exercise_catalog_review_events - observed waiting, not merely serialized after the fact"
else
  bad "G5c: the writer was not observed waiting on the package's review-events lock (waiter=$WRITER_WAIT_PID pkg=$PKG_HOLDS_EVENTS)" \
      "writer: $(tr '\n' ' ' < "$TMP/g5-writer.out" | cut -c1-200) activity: $(Q "$ACTIVITY" "$V")"
fi

# Stage 4: read the gated interval from an independent third session
# while both are still queued.
GATED_EVENTS=$(Q "SELECT count(*) FROM exercise_catalog_review_events" "$V")
GATED_STILL_HELD=$(Q "$LKPID_HELD" "$V")
if [ "$GATED_EVENTS" = "0" ] && [ "$GATED_STILL_HELD" = "$PKG_HOLDS_EVENTS" ] && [ "$GATED_STILL_HELD" != "0" ]; then
  ok "G5d: INSIDE the gated interval (package still holding review_events, writer still queued) an independent session reads ZERO review events - the writer cannot introduce one while the package's boundary is held"
else
  bad "G5d: gated-interval read wrong (events=$GATED_EVENTS holder-now=$GATED_STILL_HELD pkg=$PKG_HOLDS_EVENTS)"
fi

wait $HOLDER_PID
wait $PKG_PID; PKG_RC=$?
wait $WRITER_PID; WRITER_RC=$?
[ "$PKG_RC" = "0" ] \
  && ok "G5e: the package committed clean AFTER the holder released - the writer never entered its gated interval" \
  || bad "G5e: package failed under the writer race" "$(tail -2 "$TMP/g5-pkg.out" | tr '\n' ' ')"
if [ "$WRITER_RC" != "0" ] && grep -q 'events are written only by the snapshot review transition trigger' "$TMP/g5-writer.out"; then
  ok "G5f: once unblocked, the writer was REJECTED by the review-events guard trigger (the append path is trigger-internal only) - no direct review-event write lands before, during, or after the package"
else
  bad "G5f: writer outcome wrong (rc=$WRITER_RC)" "$(tail -2 "$TMP/g5-writer.out" | tr '\n' ' ')"
fi
[ "$(Q "$COUNTS_SQL" "$V")" = "$POST_VECTOR" ] \
  && ok "G5g: final state exact - one package application, ZERO review events ($POST_VECTOR)" \
  || bad "G5g: final state wrong ($(Q "$COUNTS_SQL" "$V"))"
[ "$(Q "$BASELINE_SQL" "$V")" = "$BASELINE_OK" ] \
  && ok "G5h: authority baseline exact after the writer race" \
  || bad "G5h: baseline drifted"

echo
echo "=== H. SEARCH_PATH DECOY: the schema-qualified loader call cannot be hijacked (Codex round-3, real same-signature decoy ahead of public)"
# A REAL load_catalog_snapshot with the IDENTICAL 18-argument signature
# is created in a decoy schema, and that schema is placed AHEAD of
# public in the database's search_path, so an UNQUALIFIED call resolves
# to the decoy. The corrected package qualifies both calls, so it must
# still reach public.load_catalog_snapshot exactly twice and never touch
# the decoy. The TEETH are proven at the end by running a sed-derived
# UNQUALIFIED copy of the same package against the same decoy: that
# copy IS hijacked - which is precisely the defect round 3 corrected.
#
# Scope discipline: the hijack is installed DATABASE-scoped (ALTER
# DATABASE ... SET search_path) on a throwaway variant, never
# role-scoped or cluster-scoped, so it cannot leak into any other
# database or any later section. USAGE on the decoy schema is granted
# to PUBLIC deliberately: name resolution SKIPS schemas the calling
# role has no USAGE on, so without that grant the decoy would be
# invisible and this section would prove nothing.
build_decoy() { # operates on $V
  surgery "H same-signature decoy loader ahead of public" "CREATE SCHEMA exlib2o_decoy;
      CREATE TABLE exlib2o_decoy.invocations (at timestamptz NOT NULL DEFAULT now());
      CREATE FUNCTION exlib2o_decoy.load_catalog_snapshot($LOADER_SIG) RETURNS JSONB
        LANGUAGE plpgsql SECURITY DEFINER AS \$decoy\$
        BEGIN
          INSERT INTO exlib2o_decoy.invocations DEFAULT VALUES;
          RETURN jsonb_build_object('hijacked', true);
        END \$decoy\$;
      GRANT USAGE ON SCHEMA exlib2o_decoy TO PUBLIC;
      ALTER DATABASE $V SET search_path = exlib2o_decoy, public;"
}
new_variant
build_decoy
DEC_NS=$(QA "SET ROLE exlib_catalog_loader; SELECT n.nspname FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE p.oid = to_regprocedure('load_catalog_snapshot($LOADER_SIG)')" "$V")
DEC_SP=$(Q "SHOW search_path" "$V")
DEC_REAL=$(Q "SELECT (to_regprocedure('public.load_catalog_snapshot($LOADER_SIG)') IS NOT NULL)::text" "$V")
if [ "$DEC_NS" = "exlib2o_decoy" ] && [ "$DEC_SP" = "exlib2o_decoy, public" ] && [ "$DEC_REAL" = "true" ]; then
  ok "H1: the decoy has TEETH - in the LOADER ROLE's own resolution context the unqualified name load_catalog_snapshot resolves to schema exlib2o_decoy (search_path = $DEC_SP), while public.load_catalog_snapshot still exists unchanged"
else
  bad "H1: the decoy was not resolvable ahead of public, so nothing below would mean anything" \
      "unqualified resolves to='$DEC_NS' search_path='$DEC_SP' public loader present='$DEC_REAL'"
fi
if run_pkg "$V" "$PACKAGE" "$TMP/h-qual.out"; then
  ok "H2: the CORRECTED package executed cleanly with the decoy sitting ahead of public in search_path - qualification also proves no OTHER name in the package depends on search_path (built-ins and system views resolve through pg_catalog, which is searched ahead of every search_path entry, and its temp evidence table through the implicit pg_temp)"
else
  bad "H2: the corrected package failed with a decoy on search_path" "$(tail -3 "$TMP/h-qual.out" | tr '\n' ' ')"
fi
H_PUB=$(await_calls "$CALLS_PUB" "2")
H_DEC=$(Q "$CALLS_DEC" "$V")
{ [ "$H_PUB" = "2" ] && [ "$H_DEC" = "0" ]; } \
  && ok "H3: durable per-function statistics show public.load_catalog_snapshot invoked EXACTLY TWICE and the decoy ZERO times (the zero is read from the same statistics flush that carries the two, so it is a live observation and not a dead counter)" \
  || bad "H3: invocation counts wrong (public=$H_PUB decoy=$H_DEC)"
[ "$(QA "SELECT count(*) FROM exlib2o_decoy.invocations" "$V")" = "0" ] \
  && ok "H4: second, independent witness - the decoy's own SECURITY DEFINER marker table is EMPTY after a COMMITTED run, so no decoy invocation was even attempted" \
  || bad "H4: the decoy recorded an invocation ($(QA "SELECT count(*) FROM exlib2o_decoy.invocations" "$V") rows)"
H_BIND=$(Q "SELECT (SELECT canonical_name FROM exercise_catalog WHERE logical_id='$DBU')||'/'||(SELECT canonical_name FROM exercise_catalog WHERE logical_id='$AWU')" "$V")
{ [ "$(Q "$COUNTS_SQL" "$V")" = "$POST_VECTOR" ] && [ "$H_BIND" = "Dead bug/Ab wheel rollout" ]; } \
  && ok "H5: the EXACT expected post-state was produced under the decoy ($POST_VECTOR, bindings 'Dead bug'/'Ab wheel rollout') - the real migration-027 loader did the work" \
  || bad "H5: post-state wrong under the decoy ($(Q "$COUNTS_SQL" "$V") / $H_BIND)"
[ "$(Q "$BASELINE_SQL" "$V")" = "$BASELINE_OK" ] \
  && ok "H6: authority RESTORED byte-for-byte after the decoy run - exactly the supabase_admin-granted baseline row" \
  || bad "H6: baseline drifted after the decoy run ($(Q "$BASELINE_SQL" "$V"))"

# H7-H10: the teeth. The SAME decoy, against the round-2 call shape.
new_variant
build_decoy
sed 's/^SELECT public\.load_catalog_snapshot(/SELECT load_catalog_snapshot(/' "$PACKAGE" > "$TMP/pkg-unqual.sql"
{ [ "$(grep -c '^SELECT load_catalog_snapshot(' "$TMP/pkg-unqual.sql")" = "2" ] \
  && [ "$(grep -c '^SELECT public\.load_catalog_snapshot(' "$TMP/pkg-unqual.sql")" = "0" ]; } \
  && ok "H7-setup: a round-2-shaped UNQUALIFIED copy is built (both calls stripped of their public. qualification, nothing else changed; the repository package is never modified)" \
  || bad "H7-setup: the unqualified copy was not built"
expect_pkg_refusal "H7: the round-2 UNQUALIFIED call shape IS hijacked - the decoy returns without loading anything, so the package's own exact post-state gate catches the empty result and rolls the whole transaction back" \
  "$V" "$TMP/pkg-unqual.sql" 'post-state counts are not exact' "$TMP/h-unqual.out"
H_DEC2=$(await_calls "$CALLS_DEC" "2")
H_PUB2=$(Q "$CALLS_PUB" "$V")
{ [ "$H_DEC2" = "2" ] && [ "$H_PUB2" = "0" ]; } \
  && ok "H8: the hijack is REAL and the instrument is SENSITIVE - the DECOY was invoked exactly twice and public.load_catalog_snapshot zero times, which is what makes H3's zero a measurement rather than an assumption" \
  || bad "H8: the unqualified copy did not demonstrate the hijack (decoy=$H_DEC2 public=$H_PUB2)"
assert_rolled_back "H9: WHOLE-TRANSACTION rollback after the hijacked run - pre-state vector and authority baseline exact, so even a hijacked loader could not leave state behind" "$V"
[ "$(QA "SELECT count(*) FROM exlib2o_decoy.invocations" "$V")" = "0" ] \
  && ok "H10: DISCLOSED - the decoy's marker rows rolled back WITH the aborted transaction (0 rows), which is exactly why the durable non-transactional function counter in H8, not the marker table, is the instrument that proves the hijack occurred" \
  || bad "H10: unexpected surviving marker rows"

echo
printf '%d passed, %d failed\n' "$PASS" "$FAIL"
[ "$FAIL" = "0" ] || exit 1
