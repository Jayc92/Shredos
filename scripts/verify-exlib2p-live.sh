#!/bin/bash
# EXLIB-2P LIVE verification: the prepared Plank DATABASE
# CONTENT-REVIEW package, proven against disposable local PostgreSQL
# clusters ONLY (unix socket, no TCP, no hosted contact of any kind).
#
# What this proves, end to end, on a real cluster:
#   - migrations 001-027 apply in the hosted-compatible role shape
#     (bootstrap superuser supabase_admin; NON-superuser operator
#     postgres applies every migration; anon/authenticated/
#     service_role exist), and BOTH lifecycle roles carry exactly the
#     implicit-creator baseline membership;
#   - the committed SPENT EXLIB-2K and EXLIB-2O packages executed
#     once each reproduce the EXACT hosted pre-state this package
#     demands (vector 3/3/5/3/6/1/2/0/0/0/0, Plank content pending/
#     draft/unadmitted with NULL review evidence, both target
#     snapshots bound and unswapped);
#   - the happy path performs EXACTLY ONE content review carrying the
#     EXLIB-2I human tuple, with every package-owned postcondition,
#     byte-exact authority restoration, an UNCHANGED eleven-table
#     vector, and ZERO review events (SNAPSHOT-scoped by schema;
#     a content review writes none BY DESIGN);
#   - the package is ONE-USE, not idempotent: a second run refuses
#     fail-closed at the content-pending gate BEFORE any authority
#     change (the vector alone cannot catch it - a review changes no
#     count - which is exactly why the content gate exists);
#   - a NINE-variant refusal matrix (swapped/inactive/missing target
#     snapshots, mutated Plank payload, wrong human-review binding,
#     pre-existing review event, already-reviewed, already-admitted,
#     already-published), plus wrong-invoker and widened-authority
#     refusals, each on a FRESH pre-state copy, each with
#     whole-transaction rollback and byte-exact restoration proven;
#   - two SIMULTANEOUS executions serialize on the real table locks:
#     exactly one commits, the loser refuses at the content gate;
#   - a SEARCH_PATH DECOY with the review function's exact signature
#     placed AHEAD of public cannot hijack the SCHEMA-QUALIFIED call
#     (durable pg_stat_user_functions counts under track_functions=all
#     prove which schema's function ran), while an UNQUALIFIED copy of
#     the same package IS hijacked and rolls back whole.
#
# Every counterfactual mutation is applied through surgery(), which
# FAILS LOUDLY if the mutation does not land: a silently rejected
# surgery would leave the pre-state pristine and turn a refusal test
# into a false pass. No pipefail-swallowed exit codes anywhere: every
# psql invocation's status is checked explicitly.
set -u
cd "$(dirname "$0")/.."

PACKAGE="docs/exlib2p-plank-database-review-package.sql"
PKG2K="docs/exlib2k-plank-catalog-load-package.sql"
PKG2O="docs/exlib2o-target-snapshot-load-package.sql"
ARTIFACT="docs/exlib2g-plank-content.jsonl"
FORM="docs/exlib2h-plank-content-review-form-completed.json"

PASS=0
FAIL=0
ok()  { PASS=$((PASS+1)); printf '  PASS  %s\n' "$1"; }
bad() { FAIL=$((FAIL+1)); printf '  FAIL  %s\n' "$1"; [ -n "${2:-}" ] && printf '        %s\n' "$2"; return 0; }

TMP="$(mktemp -d /tmp/exlib2p-pg.XXXXXX)"
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
Q()   { psql -h "$SOCK" -U postgres -d "${2:-postgres}" -X -v ON_ERROR_STOP=1 -qtA -c "$1"; }
QQ()  { psql -h "$SOCK" -U postgres -d "${2:-postgres}" -X -v ON_ERROR_STOP=1 -qtA -c "$1" 2>&1; }
QA()  { psql -h "$SOCK" -U supabase_admin -d "${2:-postgres}" -X -v ON_ERROR_STOP=1 -qtA -c "$1"; }
QQA() { psql -h "$SOCK" -U supabase_admin -d "${2:-postgres}" -X -v ON_ERROR_STOP=1 -qtA -c "$1" 2>&1; }

REV_BASELINE_SQL="SELECT (SELECT count(*) FROM pg_auth_members am JOIN pg_roles r ON r.oid=am.roleid WHERE r.rolname='exlib_catalog_reviewer')::text || '/' || (SELECT g.rolname||'>'||m.rolname||':'||am.admin_option::text||':'||am.inherit_option::text||':'||am.set_option::text FROM pg_auth_members am JOIN pg_roles r ON r.oid=am.roleid JOIN pg_roles m ON m.oid=am.member JOIN pg_roles g ON g.oid=am.grantor WHERE r.rolname='exlib_catalog_reviewer' AND m.rolname='postgres')"
LDR_BASELINE_SQL="SELECT (SELECT count(*) FROM pg_auth_members am JOIN pg_roles r ON r.oid=am.roleid WHERE r.rolname='exlib_catalog_loader')::text || '/' || (SELECT g.rolname||'>'||m.rolname||':'||am.admin_option::text||':'||am.inherit_option::text||':'||am.set_option::text FROM pg_auth_members am JOIN pg_roles r ON r.oid=am.roleid JOIN pg_roles m ON m.oid=am.member JOIN pg_roles g ON g.oid=am.grantor WHERE r.rolname='exlib_catalog_loader' AND m.rolname='postgres')"
BASELINE_OK="1/supabase_admin>postgres:true:false:false"
COUNTS_SQL="SELECT (SELECT count(*) FROM exercise_catalog_logical)::text||'/'||(SELECT count(*) FROM exercise_catalog)::text||'/'||(SELECT count(*) FROM exercise_catalog_muscles)::text||'/'||(SELECT count(*) FROM exercise_catalog_aliases)::text||'/'||(SELECT count(*) FROM exercise_catalog_name_claims)::text||'/'||(SELECT count(*) FROM exercise_catalog_content)::text||'/'||(SELECT count(*) FROM exercise_catalog_content_expected_relationships)::text||'/'||(SELECT count(*) FROM exercise_catalog_relationships)::text||'/'||(SELECT count(*) FROM exercise_catalog_import_runs)::text||'/'||(SELECT count(*) FROM exercise_catalog_run_items)::text||'/'||(SELECT count(*) FROM exercise_catalog_review_events)::text"
# a content review changes NO count: the pre- and post-state vectors
# are the SAME eleven-term value (the post-EXLIB-2O hosted surface)
STATE_VECTOR="3/3/5/3/6/1/2/0/0/0/0"
PL='e21b2c00-0000-4000-a000-000000000001'
CV='e21b2c00-0000-4000-a000-000000000101'
DBU='e21b2c00-0000-4000-a000-000000000002'
AWU='e21b2c00-0000-4000-a000-000000000003'
# the content row's review surface, read back as one deterministic line
CONTENT_SQL="SELECT c.content_status||'|'||coalesce(c.reviewed_by,'<null>')||'|'||coalesce(to_char(c.reviewed_at AT TIME ZONE 'UTC', 'YYYY-MM-DD\"T\"HH24:MI:SS\"Z\"'),'<null>')||'|'||coalesce(c.review_rationale,'<null>')||'|'||c.publication_status||'|'||c.import_admitted::text FROM exercise_catalog_content c WHERE c.id='$CV'"
CONTENT_PRE="pending|<null>|<null>|<null>|draft|false"
# 2026-09-01T20:35:00-04:00 == 2026-09-02T00:35:00Z (instant equality)
CONTENT_POST="approved|Nick Tkacz|2026-09-02T00:35:00Z|Everything looks correct|draft|false"
# every surface the review must NOT change, digested as one line
NEUTRAL_SQL="SELECT md5((SELECT coalesce(string_agg(e::text,'|' ORDER BY e.logical_id),'-') FROM exercise_catalog e) || (SELECT coalesce(string_agg(m::text,'|' ORDER BY m.catalog_id, m.muscle),'-') FROM exercise_catalog_muscles m) || (SELECT coalesce(string_agg(a::text,'|' ORDER BY a.logical_id, a.alias),'-') FROM exercise_catalog_aliases a) || (SELECT coalesce(string_agg(n::text,'|' ORDER BY n.normalized_name),'-') FROM exercise_catalog_name_claims n) || (SELECT coalesce(string_agg(x::text,'|' ORDER BY x.relation, x.to_logical_id),'-') FROM exercise_catalog_content_expected_relationships x))"
TENANT_DIGEST_SQL="SELECT count(*)::text || ':' || md5(coalesce(string_agg(t::text,'|' ORDER BY t.id),'-')) FROM exercises t"
# durable per-function invocation counts (NON-transactional): the
# instrument that proves which schema's function actually ran and that
# refused runs never reached the review function at all
CALLS_PUB="SELECT coalesce((SELECT sum(s.calls) FROM pg_stat_user_functions s JOIN pg_proc p ON p.oid=s.funcid JOIN pg_namespace n ON n.oid=p.pronamespace WHERE p.proname='apply_content_review' AND n.nspname='public'),0)::text"
CALLS_DEC="SELECT coalesce((SELECT sum(s.calls) FROM pg_stat_user_functions s JOIN pg_proc p ON p.oid=s.funcid JOIN pg_namespace n ON n.oid=p.pronamespace WHERE p.proname='apply_content_review' AND n.nspname='exlib2p_decoy'),0)::text"
CALLS_PROBE="SELECT coalesce((SELECT sum(s.calls) FROM pg_stat_user_functions s JOIN pg_proc p ON p.oid=s.funcid WHERE p.proname='exlib2p_stat_probe'),0)::text"
TRACKFN_SQL="SELECT current_setting('track_functions')"
REVIEW_SIG="uuid,uuid,text,text,timestamptz,text"

echo
echo "=== A. Package identity and source bindings"
[ -f "$PACKAGE" ] && ok "A1: the prepared package exists at $PACKAGE (docs-only, never under supabase/migrations/)" \
  || { bad "A1: package missing"; exit 1; }
for spec in "$ARTIFACT:2928:d82078490efa9ef13e128e7b7b742fbda8ea9e74e32382252d96c326c679d752" \
            "$FORM:2389:59ad2668790b6d0b135c8c453a702c45774f905ece8749a6112881b1df7e5b98" \
            "$PKG2K:29760:a1b6dd55850c5d544e2f484d1ce4833b41deec7f3dd4d4c2373cb3b50daaccf0" \
            "$PKG2O:39230:4c0d74f942da4e92efab5923a435512c750c6d794077804ffeee8c0c305c966d"; do
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
  && grep -q 'never' "$PACKAGE" \
  && ok "A4: the package is labeled PREPARED - NOT EXECUTED and names the only eventual hosted target and executor path" \
  || bad "A4: labels missing"
REV_CALLS=$(grep -c '^SELECT public\.apply_content_review(' "$PACKAGE")
UNQUAL=$(grep -cE '(^|[^.[:alnum:]_])apply_content_review[[:space:]]*\(' "$PACKAGE" || true)
ADMIT_CALLS=$(grep -cE 'admit_catalog_content[[:space:]]*\(' "$PACKAGE" || true)
PUBLISH_CALLS=$(grep -cE 'publish_catalog_content[[:space:]]*\(' "$PACKAGE" || true)
[ "$REV_CALLS/$UNQUAL/$ADMIT_CALLS/$PUBLISH_CALLS" = "1/0/0/0" ] \
  && ok "A5: exactly ONE SCHEMA-QUALIFIED public.apply_content_review call, ZERO unqualified call sites, and ZERO admission or publication call sites anywhere in the package" \
  || bad "A5: call shape wrong (qualified=$REV_CALLS unqualified=$UNQUAL admit=$ADMIT_CALLS publish=$PUBLISH_CALLS)"
grep -q 'ONE-USE, NOT idempotent' "$PACKAGE" \
  && ok "A6: the package classifies itself honestly as ONE-USE, NOT idempotent (no idempotency claim anywhere)" \
  || bad "A6: one-use honesty label missing"

echo
echo "=== B. Disposable cluster + migrations 001-027 + tenant fixture + hosted posture"
initdb -D "$PGDATA" -U supabase_admin --no-locale -E UTF8 >/dev/null 2>&1
pg_ctl -D "$PGDATA" -o "-c listen_addresses='' -c unix_socket_directories='$SOCK' -c track_functions=all" -l "$TMP/pg.log" start >/dev/null 2>&1
if QA "SELECT 1" >/dev/null 2>&1 && [ "$(QA "$TRACKFN_SQL")" = "all" ]; then
  ok "B1: cluster up at $SOCK (unix socket only; no TCP; no hosted contact; bootstrap superuser = supabase_admin, platform substrate only; track_functions=all arms the invocation counters)"
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
[ "$(Q "$REV_BASELINE_SQL")" = "$BASELINE_OK" ] \
  && ok "B3: the REVIEWER-role membership is EXACTLY the hosted baseline row (implicit creator membership: grantor supabase_admin -> postgres, ADMIN TRUE / INHERIT FALSE / SET FALSE)" \
  || bad "B3: reviewer baseline wrong ($(Q "$REV_BASELINE_SQL"))"
[ "$(Q "$LDR_BASELINE_SQL")" = "$BASELINE_OK" ] \
  && ok "B4: the LOADER-role membership carries the same baseline shape (needed by the EXLIB-2K/2O pre-state builders below)" \
  || bad "B4: loader baseline wrong"
for u in 1 2 3 4; do
  UID_U=$(Q "INSERT INTO auth.users DEFAULT VALUES RETURNING id;")
  Q "INSERT INTO public.exercises (user_id, name, category, primary_muscle, equipment, exercise_type, tracking_mode, unilateral, is_system, is_active)
     SELECT '$UID_U', 'Fixture Exercise U$u N' || g, 'compound', 'lats', 'barbell', 'strength', 'weight_reps', false, true, true
     FROM generate_series(1, 20) g;" >/dev/null
  Q "INSERT INTO public.exercises (user_id, name, category, primary_muscle, equipment, exercise_type, tracking_mode, unilateral, is_system, is_active)
     VALUES ('$UID_U', 'Plank', 'isolation', 'abs', 'bodyweight', 'bodyweight', 'bodyweight', false, true, true);" >/dev/null
done
[ "$(Q 'SELECT count(*) FROM exercises')" = "84" ] \
  && ok "B5: representative tenant fixture in place - exactly 84 exercises across four users, each with a seeded Plank" \
  || bad "B5: fixture wrong"

echo
echo "=== C. The COMMITTED, SPENT EXLIB-2K + EXLIB-2O packages build the EXACT hosted pre-state"
psql -h "$SOCK" -U postgres -d postgres -X -v ON_ERROR_STOP=1 -q -f "$PKG2K" > "$TMP/2k.out" 2>&1 \
  && ok "C1: the EXLIB-2K package executed once (Plank load reproduced)" \
  || { bad "C1: 2K package failed" "$(tail -3 "$TMP/2k.out" | tr '\n' ' ')"; exit 1; }
psql -h "$SOCK" -U postgres -d postgres -X -v ON_ERROR_STOP=1 -q -f "$PKG2O" > "$TMP/2o.out" 2>&1 \
  && ok "C2: the EXLIB-2O package executed once (target snapshots reproduced)" \
  || { bad "C2: 2O package failed" "$(tail -3 "$TMP/2o.out" | tr '\n' ' ')"; exit 1; }
[ "$(Q "$COUNTS_SQL")" = "$STATE_VECTOR" ] \
  && ok "C3: the pre-state is EXACTLY the post-EXLIB-2O hosted surface ($STATE_VECTOR) - the vector the EXLIB-2P gate demands" \
  || bad "C3: pre-state vector wrong ($(Q "$COUNTS_SQL"))"
[ "$(Q "$CONTENT_SQL")" = "$CONTENT_PRE" ] \
  && ok "C4: the Plank content row is pending/draft/unadmitted with NULL review evidence - exactly what the package is authorized to change and nothing more" \
  || bad "C4: content pre-state wrong ($(Q "$CONTENT_SQL"))"
NEUTRAL_PRE=$(Q "$NEUTRAL_SQL")
TENANT_PRE=$(Q "$TENANT_DIGEST_SQL")
[ "$(Q "SELECT orphaned_claims::text||'/'||unclaimed_bearers::text FROM exlib_verify_catalog_claims()")" = "0/0" ] \
  && ok "C5: the catalog claims invariant holds at the pre-state (0/0)" \
  || bad "C5: claims invariant broken at pre-state"
QA "CREATE DATABASE exlib2p_prestate TEMPLATE postgres OWNER postgres" >/dev/null 2>&1 \
  && ok "C6: pre-state TEMPLATE captured (every refusal variant gets a byte-identical fresh copy)" \
  || bad "C6: template capture failed"

echo
echo "=== D. Happy path: EXACTLY ONE database content review with the EXLIB-2I human tuple"
psql -h "$SOCK" -U postgres -d postgres -X -v ON_ERROR_STOP=1 -q -f "$PACKAGE" > "$TMP/2p.out" 2>&1 \
  && ok "D1: the EXLIB-2P package executed cleanly (one transaction; every package-internal pre/auth/post condition satisfied)" \
  || { bad "D1: package failed" "$(tail -3 "$TMP/2p.out" | tr '\n' ' ')"; exit 1; }
[ "$(Q "$REV_BASELINE_SQL")" = "$BASELINE_OK" ] \
  && ok "D2: REVIEWER authority restored byte-for-byte after success (exactly the supabase_admin-granted baseline row; nothing left behind)" \
  || bad "D2: reviewer authority not restored ($(Q "$REV_BASELINE_SQL"))"
D3OUT=$(QQ "SET ROLE exlib_catalog_reviewer;")
printf '%s' "$D3OUT" | grep -q 'permission denied to set role' \
  && ok "D3: SET ROLE exlib_catalog_reviewer is denied again after the review - no standing SET authority survives COMMIT" \
  || bad "D3: standing SET authority survived" "$D3OUT"
[ "$(Q "$COUNTS_SQL")" = "$STATE_VECTOR" ] \
  && ok "D4: the eleven-table vector is UNCHANGED ($STATE_VECTOR) - a content review updates one row in place and creates NOTHING" \
  || bad "D4: vector changed ($(Q "$COUNTS_SQL"))"
[ "$(Q "$CONTENT_SQL")" = "$CONTENT_POST" ] \
  && ok "D5: the content row carries the EXACT human decision - approved, Nick Tkacz, the 2026-09-01T20:35:00-04:00 instant, 'Everything looks correct' - with publication still draft and admission still absent" \
  || bad "D5: content post-state wrong ($(Q "$CONTENT_SQL"))"
[ "$(Q "SELECT (c.reviewed_at = TIMESTAMPTZ '2026-09-01T20:35:00-04:00')::text FROM exercise_catalog_content c WHERE c.id='$CV'")" = "true" ] \
  && ok "D6: reviewed_at equals the human decision's exact timestamptz INSTANT (offset preserved as a point in time, display-timezone-independent)" \
  || bad "D6: reviewed_at instant wrong"
[ "$(Q "SELECT count(*) FROM exercise_catalog_review_events")" = "0" ] \
  && ok "D7: ZERO review events - the SNAPSHOT-scoped log stays empty under a content review BY SCHEMA DESIGN (its guard trigger accepts only snapshot-transition rows); the audit evidence lives on the content row" \
  || bad "D7: a review event appeared"
[ "$(Q "$NEUTRAL_SQL")" = "$NEUTRAL_PRE" ] \
  && ok "D8: every untouched surface is digest-identical - all three snapshot families, anatomy, aliases, claims, and expected relationships" \
  || bad "D8: an untouched surface changed"
[ "$(Q "$TENANT_DIGEST_SQL")" = "$TENANT_PRE" ] \
  && ok "D9: the tenant exercises table is count + WHOLE-ROW digest identical - zero product change" \
  || bad "D9: tenant exercises changed"
[ "$(Q "SELECT orphaned_claims::text||'/'||unclaimed_bearers::text FROM exlib_verify_catalog_claims()")" = "0/0" ] \
  && ok "D10: the catalog claims invariant holds EXACTLY (0/0) after the review" \
  || bad "D10: claims invariant broken"
[ "$(Q "SELECT (SELECT count(*) FROM exercise_catalog_relationships)::text||'/'||(SELECT count(*) FROM exercise_catalog_import_runs)::text||'/'||(SELECT count(*) FROM exercise_catalog_run_items)::text")" = "0/0/0" ] \
  && ok "D11: zero relationship projection, zero import runs, zero run items - no admission, publication, projection, run, or delivery act occurred" \
  || bad "D11: forbidden state appeared"
PRIV=$(Q "SELECT has_function_privilege('anon','public.apply_content_review($REVIEW_SIG)','EXECUTE')::text||'/'||has_function_privilege('authenticated','public.apply_content_review($REVIEW_SIG)','EXECUTE')::text||'/'||has_function_privilege('service_role','public.apply_content_review($REVIEW_SIG)','EXECUTE')::text")
[ "$PRIV" = "false/false/false" ] \
  && ok "D12: the review function remains locked away from every ordinary client role (anon/authenticated/service_role all denied)" \
  || bad "D12: client can execute the review function ($PRIV)"
grep -q '"decision"[[:space:]]*:[[:space:]]*"approved"' "$TMP/2p.out" \
  && ok "D13: the SELECT echoed the function's JSONB return (decision approved) - display-only evidence; the row postconditions above are the binding proof" \
  || bad "D13: JSONB echo missing from the execution output"
[ "$(Q "SELECT e.canonical_name||':'||e.category FROM exercise_catalog e WHERE e.logical_id='$DBU'")" = "Dead bug:mobility" ] \
  && [ "$(Q "SELECT e.canonical_name||':'||e.category FROM exercise_catalog e WHERE e.logical_id='$AWU'")" = "Ab wheel rollout:other" ] \
  && ok "D14: both target snapshots remain bound and unswapped after the review (Dead bug/mobility at ...0002; Ab wheel rollout/other at ...0003)" \
  || bad "D14: target snapshot drifted"

echo
echo "=== E. One-use: the second execution refuses BEFORE any write or authority change"
psql -h "$SOCK" -U postgres -d postgres -X -v ON_ERROR_STOP=1 -q -f "$PACKAGE" > "$TMP/2p-second.out" 2>&1 \
  && bad "E1: the second execution SUCCEEDED (it must refuse)" \
  || grep -q 'not the exact loaded pre-review state' "$TMP/2p-second.out" \
    && ok "E1: the second execution refused fail-closed at the CONTENT-PENDING gate (one-use) - the vector alone cannot catch a re-run because a review changes no count, which is exactly why the content gate exists" \
    || bad "E1: refused, but not by the content gate" "$(tail -2 "$TMP/2p-second.out" | tr '\n' ' ')"
[ "$(Q "$COUNTS_SQL")" = "$STATE_VECTOR" ] && [ "$(Q "$CONTENT_SQL")" = "$CONTENT_POST" ] && [ "$(Q "$REV_BASELINE_SQL")" = "$BASELINE_OK" ] \
  && ok "E2: the refused second execution changed NOTHING - vector, reviewed content row, and authority baseline exactly as after the single review" \
  || bad "E2: second execution left drift"

echo
echo "=== F. Refusal matrix - each variant on a FRESH pre-state copy; rollback + restoration proven every time"
VN=0
V=""
new_variant() {
  VN=$((VN+1))
  V="exlib2p_v$VN"
  QA "DROP DATABASE IF EXISTS $V" >/dev/null 2>&1
  QA "CREATE DATABASE $V TEMPLATE exlib2p_prestate OWNER postgres" >/dev/null
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
assert_rolled_back() { # NAME DB [expected-content-line]
  local wantc="${3:-$CONTENT_PRE}"
  [ "$(Q "$COUNTS_SQL" "$2")" = "$STATE_VECTOR" ] && [ "$(Q "$CONTENT_SQL" "$2")" = "$wantc" ] && [ "$(Q "$REV_BASELINE_SQL" "$2")" = "$BASELINE_OK" ] \
    && ok "$1" \
    || bad "$1" "counts=$(Q "$COUNTS_SQL" "$2") content=$(Q "$CONTENT_SQL" "$2") baseline=$(Q "$REV_BASELINE_SQL" "$2")"
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
await_calls() { # SQL WANT [TRIES]
  local i out=""
  for i in $(seq 1 "${3:-20}"); do
    out=$(Q "$1" "$V" 2>/dev/null)
    [ "$out" = "$2" ] && { printf '%s' "$out"; return 0; }
    sleep 0.25
  done
  printf '%s' "${out:-?}"; return 1
}
review_never_invoked() { # LABEL   (operates on $V)
  local calls track probe
  calls=$(Q "$CALLS_PUB" "$V"); track=$(Q "$TRACKFN_SQL" "$V")
  QA "CREATE FUNCTION public.exlib2p_stat_probe() RETURNS int LANGUAGE plpgsql AS \$fn\$BEGIN RETURN 1; END\$fn\$;" "$V" >/dev/null 2>&1
  QA "SELECT public.exlib2p_stat_probe()" "$V" >/dev/null 2>&1
  probe=$(await_calls "$CALLS_PROBE" "1")
  { [ "$calls" = "0" ] && [ "$track" = "all" ] && [ "$probe" = "1" ]; } \
    && ok "$1" \
    || bad "$1" "public.apply_content_review calls=$calls track_functions=$track liveness-probe calls=$probe"
}

# F1 SWAPPED target snapshots (count-neutral): the two snapshots'
# names and categories are crossed via trigger-disabled surgery. The
# unique active-name index forbids a direct cross-update, so the swap
# walks through a temporary name inside the one surgery transaction.
new_variant
surgery "F1 swapped targets" "ALTER TABLE exercise_catalog DISABLE TRIGGER USER;
    UPDATE exercise_catalog SET canonical_name='zz swap temp' WHERE logical_id='$DBU';
    UPDATE exercise_catalog SET canonical_name='Dead bug', category='mobility' WHERE logical_id='$AWU';
    UPDATE exercise_catalog SET canonical_name='Ab wheel rollout', category='other' WHERE logical_id='$DBU';
    ALTER TABLE exercise_catalog ENABLE TRIGGER USER;" \
  && [ "$(Q "SELECT e.canonical_name FROM exercise_catalog e WHERE e.logical_id='$DBU'" "$V")" = "Ab wheel rollout" ] \
  && ok "F1-setup: the swap is present and REAL (...0002 now reads Ab wheel rollout)" \
  || bad "F1-setup: swap not landed"
expect_pkg_refusal "F1: SWAPPED TARGET SNAPSHOTS refused - the forward target gate catches ...0002 no longer carrying Dead bug/mobility, BEFORE any write or authority change" \
  "$V" "$PACKAGE" "Dead bug target snapshot is missing, inactive, re-versioned, reviewed, or re-bound" "$TMP/f1.out"
review_never_invoked "F1b: the refusal happened BEFORE the review call - durable NON-TRANSACTIONAL function statistics record ZERO public.apply_content_review invocations (liveness probe registers 1)"

# F2 INACTIVE target snapshot, COUNT-CAMOUFLAGED: the schema-legal
# deactivation path also releases the snapshot's name claims, which
# the eleven-term vector catches at the outermost gate - so to
# exercise the target gate's OWN is_active clause the surgery flips
# only the flag with triggers disabled, leaving every count exact.
new_variant
surgery "F2 inactive target behind exact counts" "ALTER TABLE exercise_catalog DISABLE TRIGGER USER;
    UPDATE exercise_catalog SET is_active=false WHERE logical_id='$AWU';
    ALTER TABLE exercise_catalog ENABLE TRIGGER USER;" \
  && [ "$(Q "SELECT e.is_active::text FROM exercise_catalog e WHERE e.logical_id='$AWU'" "$V")" = "false" ] \
  && [ "$(Q "$COUNTS_SQL" "$V")" = "$STATE_VECTOR" ] \
  && ok "F2-setup: the Ab wheel rollout snapshot is deactivated while every count stays exact - only the target gate's is_active clause can refuse" \
  || bad "F2-setup: deactivation not landed or counts moved"
expect_pkg_refusal "F2: INACTIVE TARGET SNAPSHOT refused behind EXACT counts - the forward target gate demands is_active" \
  "$V" "$PACKAGE" "Ab wheel rollout target snapshot is missing, inactive, re-versioned, reviewed, or re-bound" "$TMP/f2.out"
review_never_invoked "F2b: the refusal happened BEFORE the review call (durable zero-invocation proof; liveness probe registers 1)"

# F3 MISSING target snapshot (count-camouflaged): the Ab wheel
# snapshot and its two anatomy rows are deleted, and a decoy snapshot
# with two anatomy rows is inserted under the PLANK identity so the
# eleven-term vector stays EXACT - only the target gate can refuse.
new_variant
surgery "F3 missing target behind exact counts" "ALTER TABLE exercise_catalog DISABLE TRIGGER USER;
    ALTER TABLE exercise_catalog_muscles DISABLE TRIGGER USER;
    ALTER TABLE exercise_catalog_aliases DISABLE TRIGGER USER;
    ALTER TABLE exercise_catalog_name_claims DISABLE TRIGGER USER;
    DELETE FROM exercise_catalog_muscles m USING exercise_catalog e WHERE m.catalog_id=e.id AND e.logical_id='$AWU';
    DELETE FROM exercise_catalog_aliases WHERE logical_id='$AWU';
    DELETE FROM exercise_catalog_name_claims WHERE logical_id='$AWU';
    DELETE FROM exercise_catalog WHERE logical_id='$AWU';
    INSERT INTO exercise_catalog (logical_id, canonical_name, category, primary_muscle, equipment, laterality, tracking_mode, provenance, movement_pattern, training_role, difficulty, availability, is_active, catalog_version)
    VALUES ('$PL', 'Decoy plank variant', 'isolation', 'abs', 'bodyweight', 'bilateral', 'timed', 'forgefitos_original', 'core_anti_extension', 'core', 'beginner', 'minimal', false, 2);
    INSERT INTO exercise_catalog_muscles (catalog_id, muscle, role) SELECT e.id, 'obliques', 'secondary' FROM exercise_catalog e WHERE e.canonical_name='Decoy plank variant';
    INSERT INTO exercise_catalog_muscles (catalog_id, muscle, role) SELECT e.id, 'lower_back', 'tertiary' FROM exercise_catalog e WHERE e.canonical_name='Decoy plank variant';
    INSERT INTO exercise_catalog_aliases (logical_id, alias) VALUES ('$PL', 'Decoy alias');
    INSERT INTO exercise_catalog_name_claims (logical_id, normalized_name, claim_source) VALUES ('$PL', 'decoy plank variant', 'alias'), ('$PL', 'decoy alias', 'alias');
    ALTER TABLE exercise_catalog ENABLE TRIGGER USER;
    ALTER TABLE exercise_catalog_muscles ENABLE TRIGGER USER;
    ALTER TABLE exercise_catalog_aliases ENABLE TRIGGER USER;
    ALTER TABLE exercise_catalog_name_claims ENABLE TRIGGER USER;" \
  && [ "$(Q "$COUNTS_SQL" "$V")" = "$STATE_VECTOR" ] \
  && [ "$(Q "SELECT count(*) FROM exercise_catalog WHERE logical_id='$AWU'" "$V")" = "0" ] \
  && ok "F3-setup: the Ab wheel snapshot is GONE while the eleven-term vector still reads $STATE_VECTOR - only a target-shape gate can catch this" \
  || bad "F3-setup: camouflage not exact ($(Q "$COUNTS_SQL" "$V"))"
expect_pkg_refusal "F3: MISSING TARGET SNAPSHOT refused behind EXACT counts - the forward target gate demands exactly one ...0003 snapshot" \
  "$V" "$PACKAGE" "Ab wheel rollout target snapshot is missing, inactive, re-versioned, reviewed, or re-bound" "$TMP/f3.out"
review_never_invoked "F3b: the refusal happened BEFORE the review call (durable zero-invocation proof; liveness probe registers 1)"

# F4 MUTATED Plank payload: a vocabulary-legal scalar drift in
# safety_guidance - only the exact-literal content gate can refuse.
new_variant
surgery "F4 payload drift" "ALTER TABLE exercise_catalog_content DISABLE TRIGGER USER;
    UPDATE exercise_catalog_content SET safety_guidance='Drifted guidance that is perfectly plausible prose.' WHERE id='$CV';
    ALTER TABLE exercise_catalog_content ENABLE TRIGGER USER;" \
  && [ "$(Q "SELECT c.safety_guidance FROM exercise_catalog_content c WHERE c.id='$CV'" "$V")" = "Drifted guidance that is perfectly plausible prose." ] \
  && ok "F4-setup: the scalar payload drift is present and REAL" \
  || bad "F4-setup: drift not landed"
expect_pkg_refusal "F4: MUTATED PLANK PAYLOAD refused - the exact-value content gate (no hashes) catches the drifted safety_guidance BEFORE any write or authority change" \
  "$V" "$PACKAGE" "not the exact loaded pre-review state" "$TMP/f4.out"
review_never_invoked "F4b: the refusal happened BEFORE the review call (durable zero-invocation proof; liveness probe registers 1)"

# F5 WRONG HUMAN-REVIEW BINDING: a sed-derived package COPY whose
# CALL argument carries a drifted reviewer, while the postcondition
# still pins the true human tuple. The call succeeds mechanically;
# the package's own posticondition refuses and the WHOLE transaction
# rolls back - proving a binding drift can never commit.
new_variant
sed 's/$rev$Nick Tkacz$rev$,/$rev$Drifted Reviewer$rev$,/' "$PACKAGE" > "$TMP/pkg-f5.sql"
grep -q 'Drifted Reviewer' "$TMP/pkg-f5.sql" \
  && [ "$(grep -c 'Nick Tkacz' "$TMP/pkg-f5.sql")" != "0" ] \
  && ok "F5-setup: the drifted-call copy is built (call argument drifted; postcondition still pins the true human tuple; repository package untouched)" \
  || bad "F5-setup: copy not built"
expect_pkg_refusal "F5: WRONG HUMAN-REVIEW BINDING refused - the review itself succeeded mechanically with the drifted reviewer and the package's own exact-tuple postcondition rolled the WHOLE transaction back" \
  "$V" "$TMP/pkg-f5.sql" "reviewed content row is not exact" "$TMP/f5.out"
assert_rolled_back "F5b: WHOLE-TRANSACTION rollback - the content row is back to pending with NULL evidence; nothing persisted" "$V"

# F6 PRE-EXISTING REVIEW EVENT: the guard trigger forbids direct
# inserts (depth < 2), so the surgery disables it - and the vector's
# eleventh term catches the foreign event before anything else.
new_variant
surgery "F6 foreign review event" "ALTER TABLE exercise_catalog_review_events DISABLE TRIGGER USER;
    INSERT INTO exercise_catalog_review_events (catalog_id, from_status, to_status, reviewed_by, reviewed_at, review_rationale)
    SELECT e.id, 'pending', 'approved', 'Foreign Writer', now(), 'foreign snapshot review event' FROM exercise_catalog e WHERE e.logical_id='$PL';
    ALTER TABLE exercise_catalog_review_events ENABLE TRIGGER USER;" \
  && [ "$(Q "SELECT count(*) FROM exercise_catalog_review_events" "$V")" = "1" ] \
  && ok "F6-setup: one foreign snapshot review event is present and REAL" \
  || bad "F6-setup: event not landed"
expect_pkg_refusal "F6: PRE-EXISTING REVIEW EVENT refused - the eleven-term vector's review-events term catches foreign review activity BEFORE any write" \
  "$V" "$PACKAGE" "not the exact post-EXLIB-2O hosted pre-state" "$TMP/f6.out"
review_never_invoked "F6b: the refusal happened BEFORE the review call (durable zero-invocation proof; liveness probe registers 1)"

# F7 ALREADY REVIEWED: schema-legal surgery (triggers ON) - the
# gate must catch a state the schema itself permits.
new_variant
surgery "F7 already reviewed" "UPDATE exercise_catalog_content SET content_status='approved', reviewed_by='Prior Reviewer', reviewed_at=now(), review_rationale='prior decision on this version' WHERE id='$CV';" \
  && [ "$(Q "SELECT c.content_status FROM exercise_catalog_content c WHERE c.id='$CV'" "$V")" = "approved" ] \
  && ok "F7-setup: the content row is already approved (a fully schema-legal review transition)" \
  || bad "F7-setup: prior review not landed"
expect_pkg_refusal "F7: ALREADY-REVIEWED refused - the content-pending gate refuses to re-review a decided version (decisions are one-time; corrections need a NEW version)" \
  "$V" "$PACKAGE" "not the exact loaded pre-review state" "$TMP/f7.out"
review_never_invoked "F7b: the refusal happened BEFORE the review call (durable zero-invocation proof; liveness probe registers 1)"

# F8 ALREADY ADMITTED: import_admitted and its evidence trio are set
# by trigger-disabled surgery (the real admission path demands an
# approved version first; the gate must refuse the state itself).
new_variant
surgery "F8 already admitted" "ALTER TABLE exercise_catalog_content DISABLE TRIGGER USER;
    UPDATE exercise_catalog_content SET content_status='approved', reviewed_by='Prior Reviewer', reviewed_at=now(), review_rationale='prior decision', import_admitted=true, admitted_fingerprint=repeat('a',64), admitted_source_sha256=repeat('b',64), admitted_at=now() WHERE id='$CV';
    ALTER TABLE exercise_catalog_content ENABLE TRIGGER USER;" \
  && [ "$(Q "SELECT c.import_admitted::text FROM exercise_catalog_content c WHERE c.id='$CV'" "$V")" = "true" ] \
  && ok "F8-setup: the content row reads as already admitted" \
  || bad "F8-setup: admission not landed"
expect_pkg_refusal "F8: ALREADY-ADMITTED refused - the unadmitted-lifecycle gate refuses before any write or authority change" \
  "$V" "$PACKAGE" "not the exact loaded pre-review state" "$TMP/f8.out"
review_never_invoked "F8b: the refusal happened BEFORE the review call (durable zero-invocation proof; liveness probe registers 1)"

# F9 ALREADY PUBLISHED: publication_status flipped by
# trigger-disabled surgery (real publication demands approval +
# admission first; again the gate must refuse the state itself).
new_variant
surgery "F9 already published" "ALTER TABLE exercise_catalog_content DISABLE TRIGGER USER;
    UPDATE exercise_catalog_content SET content_status='approved', reviewed_by='Prior Reviewer', reviewed_at=now(), review_rationale='prior decision', import_admitted=true, admitted_fingerprint=repeat('a',64), admitted_source_sha256=repeat('b',64), admitted_at=now(), publication_status='published' WHERE id='$CV';
    ALTER TABLE exercise_catalog_content ENABLE TRIGGER USER;" \
  && [ "$(Q "SELECT c.publication_status FROM exercise_catalog_content c WHERE c.id='$CV'" "$V")" = "published" ] \
  && ok "F9-setup: the content row reads as already published" \
  || bad "F9-setup: publication not landed"
expect_pkg_refusal "F9: ALREADY-PUBLISHED refused - the draft-lifecycle gate refuses before any write or authority change" \
  "$V" "$PACKAGE" "not the exact loaded pre-review state" "$TMP/f9.out"
review_never_invoked "F9b: the refusal happened BEFORE the review call (durable zero-invocation proof; liveness probe registers 1)"

# F10 WRONG INVOKER: the package run by the SUPERUSER bootstrap role
# (the wrong authority posture in both identity and superuser-ness).
new_variant
if psql -h "$SOCK" -U supabase_admin -d "$V" -X -v ON_ERROR_STOP=1 -q -f "$PACKAGE" > "$TMP/f10.out" 2>&1; then
  bad "F10: the superuser execution SUCCEEDED (it must refuse)"
else
  grep -q 'BOTH execution identities must be the hosted operator role postgres' "$TMP/f10.out" \
    && ok "F10: WRONG INVOKER refused - the dual-identity gate rejects a non-postgres session BEFORE any write or authority change" \
    || bad "F10: refused, but not by the identity gate" "$(tail -2 "$TMP/f10.out" | tr '\n' ' ')"
fi
review_never_invoked "F10b: the refusal happened BEFORE the review call (durable zero-invocation proof; liveness probe registers 1)"

# F11 WIDENED AUTHORITY BASELINE: a second reviewer-role membership.
new_variant
surgery "F11 widened baseline" "CREATE ROLE exlib2p_widen NOLOGIN; GRANT exlib_catalog_reviewer TO exlib2p_widen;" \
  && [ "$(Q "SELECT count(*) FROM pg_auth_members am JOIN pg_roles r ON r.oid=am.roleid WHERE r.rolname='exlib_catalog_reviewer'" "$V")" = "2" ] \
  && ok "F11-setup: a second reviewer membership exists (the widened posture is real)" \
  || bad "F11-setup: widening not landed"
expect_pkg_refusal "F11: WIDENED AUTHORITY BASELINE refused - the grantor-included baseline gate demands exactly the one supabase_admin-granted row" \
  "$V" "$PACKAGE" "reviewer-role membership posture is not the exact hosted baseline" "$TMP/f11.out"
review_never_invoked "F11b: the refusal happened BEFORE the review call (durable zero-invocation proof; liveness probe registers 1)"
# ROLE MEMBERSHIPS ARE CLUSTER-WIDE (pg_auth_members is a shared
# catalog): the widening above is visible in EVERY database, so it is
# torn down here and the restored cluster-wide baseline is asserted -
# otherwise every later variant would refuse at the baseline gate for
# the wrong reason.
QA "DROP ROLE exlib2p_widen" >/dev/null 2>&1
[ "$(Q "$REV_BASELINE_SQL" "$V")" = "$BASELINE_OK" ] \
  && ok "F11c: the cluster-wide widening is torn down (dropping the role removes its membership) and the shared baseline reads exactly one supabase_admin-granted row again" \
  || bad "F11c: cluster-wide baseline not restored ($(Q "$REV_BASELINE_SQL" "$V"))"

echo
echo "=== G. RACE: two simultaneous executions - exactly one committer"
new_variant
run_pkg "$V" "$PACKAGE" "$TMP/race-a.out" & RA=$!
run_pkg "$V" "$PACKAGE" "$TMP/race-b.out" & RB=$!
wait $RA; SA=$?
wait $RB; SB=$?
if { [ "$SA" = "0" ] && [ "$SB" != "0" ]; } || { [ "$SA" != "0" ] && [ "$SB" = "0" ]; }; then
  ok "G1: exactly one committer - the SHARE ROW EXCLUSIVE locks serialized the two simultaneous executions (statuses: A=$SA B=$SB)"
else
  bad "G1: race outcome wrong (A=$SA B=$SB)"
fi
LOSER_OUT="$TMP/race-a.out"; [ "$SA" = "0" ] && LOSER_OUT="$TMP/race-b.out"
grep -q 'not the exact loaded pre-review state' "$LOSER_OUT" \
  && ok "G2: the losing session refused at the content-pending gate AFTER waiting on the winner's lock (never a partial write)" \
  || bad "G2: loser refused by the wrong gate" "$(tail -2 "$LOSER_OUT" | tr '\n' ' ')"
[ "$(Q "$COUNTS_SQL" "$V")" = "$STATE_VECTOR" ] && [ "$(Q "$CONTENT_SQL" "$V")" = "$CONTENT_POST" ] \
  && ok "G3: the raced database holds EXACTLY one applied review (unchanged vector; the exact human tuple once)" \
  || bad "G3: raced state wrong"
[ "$(Q "$REV_BASELINE_SQL" "$V")" = "$BASELINE_OK" ] \
  && ok "G4: authority baseline exact after the race" \
  || bad "G4: baseline drift after race"

echo
echo "=== H. SEARCH_PATH DECOY: the schema-qualified review call cannot be hijacked"
build_decoy() { # operates on $V
  surgery "H same-signature decoy reviewer ahead of public" "CREATE SCHEMA exlib2p_decoy;
      CREATE TABLE exlib2p_decoy.invocations (at timestamptz NOT NULL DEFAULT now());
      CREATE FUNCTION exlib2p_decoy.apply_content_review($REVIEW_SIG) RETURNS JSONB
        LANGUAGE plpgsql SECURITY DEFINER AS \$decoy\$
        BEGIN
          INSERT INTO exlib2p_decoy.invocations DEFAULT VALUES;
          RETURN jsonb_build_object('hijacked', true);
        END \$decoy\$;
      GRANT USAGE ON SCHEMA exlib2p_decoy TO PUBLIC;
      ALTER DATABASE $V SET search_path = exlib2p_decoy, public;"
}
new_variant
build_decoy && ok "H0: decoy built (same-signature exlib2p_decoy.apply_content_review, schema USAGE granted to PUBLIC, database search_path = exlib2p_decoy, public)" \
  || bad "H0: decoy build failed"
H1=$(QA "SET ROLE exlib_catalog_reviewer; SELECT n.nspname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE p.oid = to_regprocedure('apply_content_review($REVIEW_SIG)');" "$V" 2>/dev/null)
H1B=$(QA "SHOW search_path" "$V" 2>/dev/null)
{ [ "$H1" = "exlib2p_decoy" ] && printf '%s' "$H1B" | grep -q 'exlib2p_decoy'; } \
  && ok "H1: the decoy has TEETH - in the REVIEWER ROLE's own resolution context the unqualified name apply_content_review resolves to schema exlib2p_decoy (search_path = $H1B), while public.apply_content_review still exists unchanged" \
  || bad "H1: decoy has no teeth (resolved=$H1 path=$H1B)"
run_pkg "$V" "$PACKAGE" "$TMP/h2.out" \
  && ok "H2: the package executed cleanly with the decoy sitting ahead of public in search_path - qualification proves no name in the package depends on search_path" \
  || bad "H2: package failed under decoy" "$(tail -2 "$TMP/h2.out" | tr '\n' ' ')"
CP=$(await_calls "$CALLS_PUB" "1"); CD=$(Q "$CALLS_DEC" "$V")
[ "$CP" = "1" ] && [ "$CD" = "0" ] \
  && ok "H3: durable per-function statistics show public.apply_content_review invoked EXACTLY ONCE and the decoy ZERO times (the zero rides the same statistics flush as the one, so it is a live observation)" \
  || bad "H3: invocation counts wrong (public=$CP decoy=$CD)"
[ "$(QA "SELECT count(*) FROM exlib2p_decoy.invocations" "$V")" = "0" ] \
  && ok "H4: second, independent witness - the decoy's own marker table is EMPTY after a COMMITTED run, so no decoy invocation was even attempted" \
  || bad "H4: decoy marker rows present"
[ "$(Q "$CONTENT_SQL" "$V")" = "$CONTENT_POST" ] \
  && ok "H5: the EXACT expected post-state was produced under the decoy - the real migration-027 review function did the work" \
  || bad "H5: post-state wrong under decoy"
[ "$(Q "$REV_BASELINE_SQL" "$V")" = "$BASELINE_OK" ] \
  && ok "H6: authority RESTORED byte-for-byte after the decoy run" \
  || bad "H6: authority drift under decoy"
new_variant
build_decoy >/dev/null
sed 's/^SELECT public\.apply_content_review(/SELECT apply_content_review(/' "$PACKAGE" > "$TMP/pkg-unqual.sql"
[ "$(grep -c '^SELECT apply_content_review(' "$TMP/pkg-unqual.sql")" = "1" ] \
  && ok "H7-setup: an UNQUALIFIED copy is built (the call stripped of its public. qualification, nothing else changed; the repository package is never modified)" \
  || bad "H7-setup: unqualified copy not built"
if run_pkg "$V" "$TMP/pkg-unqual.sql" "$TMP/h7.out"; then
  bad "H7: the unqualified copy SUCCEEDED under the decoy (the hijack should divert it into refusal)"
else
  grep -q 'reviewed content row is not exact' "$TMP/h7.out" \
    && ok "H7: the UNQUALIFIED call shape IS hijacked - the decoy returns without reviewing anything, so the package's own exact post-state gate catches the unreviewed row and rolls the whole transaction back" \
    || bad "H7: refused, but not by the post-state gate" "$(tail -2 "$TMP/h7.out" | tr '\n' ' ')"
fi
CP2=$(Q "$CALLS_PUB" "$V"); CD2=$(await_calls "$CALLS_DEC" "1")
[ "$CP2" = "0" ] && [ "$CD2" = "1" ] \
  && ok "H8: the hijack is REAL and the instrument is SENSITIVE - the DECOY was invoked exactly once and public.apply_content_review zero times, which is what makes H3's zero a measurement rather than an assumption" \
  || bad "H8: hijack counts wrong (public=$CP2 decoy=$CD2)"
assert_rolled_back "H9: WHOLE-TRANSACTION rollback after the hijacked run - pre-state content line and authority baseline exact, so even a hijacked reviewer could not leave state behind" "$V"
[ "$(QA "SELECT count(*) FROM exlib2p_decoy.invocations" "$V")" = "0" ] \
  && ok "H10: DISCLOSED - the decoy's marker rows rolled back WITH the aborted transaction (0 rows), which is exactly why the durable non-transactional function counter in H8, not the marker table, is the instrument that proves the hijack occurred" \
  || bad "H10: marker rows unexpectedly persisted"

echo
printf '%s passed, %s failed\n' "$PASS" "$FAIL"
[ "$FAIL" = "0" ] || exit 1
