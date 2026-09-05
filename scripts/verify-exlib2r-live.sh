#!/bin/bash
# EXLIB-2R LIVE verification: the prepared Plank PUBLICATION package,
# proven against disposable local PostgreSQL clusters ONLY (unix
# socket, no TCP, no hosted contact of any kind).
#
# What this proves, end to end, on a real cluster:
#   - migrations 001-027 apply in the hosted-compatible role shape and
#     ALL FOUR lifecycle roles carry exactly the implicit-creator
#     baseline membership (loader, reviewer, admission, admin);
#   - the committed SPENT EXLIB-2K, 2O, 2P, AND 2Q packages executed
#     once each reproduce the EXACT hosted pre-state this package
#     demands (vector 3/3/5/3/6/1/2/0/0/0/0, Plank content APPROVED
#     with the exact human tuple, ADMITTED with the complete admission
#     surface, draft, zero projected relationships) — INCLUDING the
#     FINGERPRINT-PORTABILITY proof: the fixture's database-computed
#     admission fingerprint equals the promoted hosted literal
#     23976eed... exactly, because migration 027's manifest binds only
#     portable state (this is what makes the package's fingerprint
#     literal a lawful precondition, unlike hosted surrogate UUIDs);
#   - the happy path performs EXACTLY ONE publication whose
#     relationship projection is ATOMIC with it: publication_status
#     draft -> published with every other content field unchanged, the
#     protected projection becomes EXACTLY the expected set (two rows:
#     progression -> ...0003, substitution -> ...0002), the vector
#     moves EXACTLY 3/3/5/3/6/1/2/0/0/0/0 -> 3/3/5/3/6/1/2/2/0/0/0,
#     the admission surface stays byte-identical and STILL FRESH, the
#     asserted JSONB notice is echoed, byte-exact authority
#     restoration, ZERO review events (SNAPSHOT-scoped by schema), and
#     the client-denial posture holds (database publication is NOT
#     product delivery);
#   - the package is ONE-USE, not idempotent: a second run refuses
#     fail-closed at the VECTOR gate (a publication changes the count
#     vector — the projected rows are visible — unlike the review and
#     admission packages whose one-use only the content gate could
#     catch);
#   - an EIGHTEEN-variant refusal matrix (swapped/inactive/missing
#     target snapshots, mutated payload, drifted review tuple,
#     not-approved content, unadmitted content, stale admission
#     fingerprint, wrong admitted source sha, already-published,
#     pre-existing projected relationship, expected-relationship
#     drift, foreign review event, foreign import run, wrong invoker,
#     widened authority baseline, WRONG-GRANTOR baseline, and a
#     drifted-argument package copy refused INSIDE the function with
#     whole-transaction rollback), each on a FRESH pre-state copy,
#     each with rollback + byte-exact restoration proven, with durable
#     pg_stat_user_functions zero-invocation proofs for pre-call
#     refusals;
#   - two SIMULTANEOUS executions serialize on the real table locks:
#     exactly one commits, the loser refuses at the vector gate;
#   - a SEARCH_PATH DECOY with the publication function's exact
#     signature placed AHEAD of public cannot hijack the
#     SCHEMA-QUALIFIED call, while an UNQUALIFIED copy of the same
#     package IS hijacked and refused by the call block's own exact
#     JSONB assertion, rolling back whole;
#   - cluster-wide role state is restored after every variant that
#     touches it (pg_auth_members is a SHARED catalog), and the run
#     leaves no fixture behind.
#
# Every counterfactual mutation is applied through surgery(), which
# FAILS LOUDLY if the mutation does not land: a silently rejected
# surgery would leave the pre-state pristine and turn a refusal test
# into a false pass. No pipefail-swallowed exit codes anywhere: every
# psql invocation's status is checked explicitly.
set -u
cd "$(dirname "$0")/.."

PACKAGE="docs/exlib2r-plank-publication-package.sql"
PKG2Q="docs/exlib2q-plank-import-admission-package.sql"
PKG2P="docs/exlib2p-plank-database-review-package.sql"
PKG2K="docs/exlib2k-plank-catalog-load-package.sql"
PKG2O="docs/exlib2o-target-snapshot-load-package.sql"
ARTIFACT="docs/exlib2g-plank-content.jsonl"
FORM="docs/exlib2h-plank-content-review-form-completed.json"

PASS=0
FAIL=0
ok()  { PASS=$((PASS+1)); printf '  PASS  %s\n' "$1"; }
bad() { FAIL=$((FAIL+1)); printf '  FAIL  %s\n' "$1"; [ -n "${2:-}" ] && printf '        %s\n' "$2"; return 0; }

TMP="$(mktemp -d /tmp/exlib2r-pg.XXXXXX)"
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

baseline_sql() { # ROLE
  printf "SELECT (SELECT count(*) FROM pg_auth_members am JOIN pg_roles r ON r.oid=am.roleid WHERE r.rolname='%s')::text || '/' || (SELECT g.rolname||'>'||m.rolname||':'||am.admin_option::text||':'||am.inherit_option::text||':'||am.set_option::text FROM pg_auth_members am JOIN pg_roles r ON r.oid=am.roleid JOIN pg_roles m ON m.oid=am.member JOIN pg_roles g ON g.oid=am.grantor WHERE r.rolname='%s' AND m.rolname='postgres')" "$1" "$1"
}
ADMIN_BASELINE_SQL=$(baseline_sql exlib_catalog_admin)
ADM_BASELINE_SQL=$(baseline_sql exlib_catalog_admission)
REV_BASELINE_SQL=$(baseline_sql exlib_catalog_reviewer)
LDR_BASELINE_SQL=$(baseline_sql exlib_catalog_loader)
BASELINE_OK="1/supabase_admin>postgres:true:false:false"
COUNTS_SQL="SELECT (SELECT count(*) FROM exercise_catalog_logical)::text||'/'||(SELECT count(*) FROM exercise_catalog)::text||'/'||(SELECT count(*) FROM exercise_catalog_muscles)::text||'/'||(SELECT count(*) FROM exercise_catalog_aliases)::text||'/'||(SELECT count(*) FROM exercise_catalog_name_claims)::text||'/'||(SELECT count(*) FROM exercise_catalog_content)::text||'/'||(SELECT count(*) FROM exercise_catalog_content_expected_relationships)::text||'/'||(SELECT count(*) FROM exercise_catalog_relationships)::text||'/'||(SELECT count(*) FROM exercise_catalog_import_runs)::text||'/'||(SELECT count(*) FROM exercise_catalog_run_items)::text||'/'||(SELECT count(*) FROM exercise_catalog_review_events)::text"
# UNLIKE the review and admission packages, a publication MOVES the
# vector: the projection adds exactly the two Plank relationship rows.
STATE_VECTOR="3/3/5/3/6/1/2/0/0/0/0"
POST_VECTOR="3/3/5/3/6/1/2/2/0/0/0"
PL='e21b2c00-0000-4000-a000-000000000001'
CV='e21b2c00-0000-4000-a000-000000000101'
DBU='e21b2c00-0000-4000-a000-000000000002'
AWU='e21b2c00-0000-4000-a000-000000000003'
# the content row's review + lifecycle surface, one deterministic line
CONTENT_SQL="SELECT c.content_status||'|'||coalesce(c.reviewed_by,'<null>')||'|'||coalesce(to_char(c.reviewed_at AT TIME ZONE 'UTC', 'YYYY-MM-DD\"T\"HH24:MI:SS\"Z\"'),'<null>')||'|'||coalesce(c.review_rationale,'<null>')||'|'||c.publication_status||'|'||c.import_admitted::text FROM exercise_catalog_content c WHERE c.id='$CV'"
# post-EXLIB-2Q pre-state: approved with the exact human tuple, draft,
# ADMITTED (2026-09-01T20:35:00-04:00 == 2026-09-02T00:35:00Z)
CONTENT_PRE="approved|Nick Tkacz|2026-09-02T00:35:00Z|Everything looks correct|draft|true"
CONTENT_POST="approved|Nick Tkacz|2026-09-02T00:35:00Z|Everything looks correct|published|true"
ART_SHA="d82078490efa9ef13e128e7b7b742fbda8ea9e74e32382252d96c326c679d752"
HOSTED_FP="23976eedf2d59b66cdfa05cd660a414430feabef8906e1936cb24f541040de9e"
# the complete admission surface, read back as one deterministic line:
# import_admitted | source-sha-exact | fingerprint = the promoted
# hosted literal | fingerprint fresh-recompute equality | admitted_at
# present (execution-date-dependent; never pinned to a calendar day)
ADMIT_SQL="SELECT c.import_admitted::text||'|'||(c.admitted_source_sha256 = '$ART_SHA')::text||'|'||(c.admitted_fingerprint = '$HOSTED_FP')::text||'|'||(c.admitted_fingerprint = public.exlib_content_admission_fingerprint(c.id))::text||'|'||(c.admitted_at IS NOT NULL)::text FROM exercise_catalog_content c WHERE c.id='$CV'"
ADMIT_OK="true|true|true|true|true"
# the projected live set for Plank, one deterministic line
PROJ_SQL="SELECT coalesce((SELECT string_agg(r.relation||'>'||r.to_logical_id::text, ',' ORDER BY r.relation) FROM exercise_catalog_relationships r WHERE r.from_logical_id='$PL'),'<none>') || '#' || (SELECT count(*) FROM exercise_catalog_relationships)::text"
PROJ_PRE="<none>#0"
PROJ_POST="progression>$AWU,substitution>$DBU#2"
# every surface the publication must NOT change, digested as one line
# (content and relationships are deliberately absent: they are the
# two surfaces publication lawfully changes, bound by exact reads)
NEUTRAL_SQL="SELECT md5((SELECT coalesce(string_agg(e::text,'|' ORDER BY e.logical_id),'-') FROM exercise_catalog e) || (SELECT coalesce(string_agg(m::text,'|' ORDER BY m.catalog_id, m.muscle),'-') FROM exercise_catalog_muscles m) || (SELECT coalesce(string_agg(a::text,'|' ORDER BY a.logical_id, a.alias),'-') FROM exercise_catalog_aliases a) || (SELECT coalesce(string_agg(n::text,'|' ORDER BY n.normalized_name),'-') FROM exercise_catalog_name_claims n) || (SELECT coalesce(string_agg(x::text,'|' ORDER BY x.relation, x.to_logical_id),'-') FROM exercise_catalog_content_expected_relationships x))"
TENANT_DIGEST_SQL="SELECT count(*)::text || ':' || md5(coalesce(string_agg(t::text,'|' ORDER BY t.id),'-')) FROM exercises t"
# durable per-function invocation counts (NON-transactional): the
# instrument that proves which schema's function actually ran and that
# refused runs never reached the publication function at all
CALLS_PUB="SELECT coalesce((SELECT sum(s.calls) FROM pg_stat_user_functions s JOIN pg_proc p ON p.oid=s.funcid JOIN pg_namespace n ON n.oid=p.pronamespace WHERE p.proname='publish_catalog_content' AND n.nspname='public'),0)::text"
CALLS_DEC="SELECT coalesce((SELECT sum(s.calls) FROM pg_stat_user_functions s JOIN pg_proc p ON p.oid=s.funcid JOIN pg_namespace n ON n.oid=p.pronamespace WHERE p.proname='publish_catalog_content' AND n.nspname='exlib2r_decoy'),0)::text"
CALLS_PROBE="SELECT coalesce((SELECT sum(s.calls) FROM pg_stat_user_functions s JOIN pg_proc p ON p.oid=s.funcid WHERE p.proname='exlib2r_stat_probe'),0)::text"
TRACKFN_SQL="SELECT current_setting('track_functions')"
PUB_SIG="uuid,uuid"

echo
echo "=== A. Package identity and source bindings"
[ -f "$PACKAGE" ] && ok "A1: the prepared package exists at $PACKAGE (docs-only, never under supabase/migrations/)" \
  || { bad "A1: package missing"; exit 1; }
for spec in "$ARTIFACT:2928:d82078490efa9ef13e128e7b7b742fbda8ea9e74e32382252d96c326c679d752" \
            "$FORM:2389:59ad2668790b6d0b135c8c453a702c45774f905ece8749a6112881b1df7e5b98" \
            "$PKG2K:29760:a1b6dd55850c5d544e2f484d1ce4833b41deec7f3dd4d4c2373cb3b50daaccf0" \
            "$PKG2O:39230:4c0d74f942da4e92efab5923a435512c750c6d794077804ffeee8c0c305c966d" \
            "$PKG2P:37702:76d1d67d6ec2bafc49ef43a6312700559cd9eeee4b8b9433868de9daf95dc666" \
            "$PKG2Q:39382:b15b9313db5efe679ca0d13cd0d9b9d97fd9316ec1d66d99c5bba6ca47529e57"; do
  f="${spec%%:*}"; rest="${spec#*:}"; want_b="${rest%%:*}"; want_s="${rest#*:}"
  got_b=$(wc -c < "$f" | tr -d ' '); got_s=$(shasum -a 256 "$f" | awk '{print $1}')
  [ "$got_b/$got_s" = "$want_b/$want_s" ] \
    && ok "A2: $f holds its exact promoted fingerprint" \
    || { bad "A2: $f drifted ($got_b/$got_s)"; exit 1; }
done
PSHA=$(shasum -a 256 "$PACKAGE" | awk '{print $1}')
PBYTES=$(wc -c < "$PACKAGE" | tr -d ' ')
ok "A3: package under test: $PBYTES bytes, sha256 $PSHA (the fingerprint the record pins; verified again before every execution below by executing exactly this file)"
grep -q 'PREPARED — NOT EXECUTED' "$PACKAGE" && grep -q 'ttybyljytiwntvorugcv' "$PACKAGE" \
  && grep -q 'never' "$PACKAGE" \
  && ok "A4: the package is labeled PREPARED - NOT EXECUTED and names the only eventual hosted target and executor path" \
  || bad "A4: labels missing"
PUB_CALLS=$(grep -c 'v_result := public\.publish_catalog_content($' "$PACKAGE")
UNQUAL=$(grep -cE '(^|[^.[:alnum:]_])publish_catalog_content[[:space:]]*\(' "$PACKAGE" || true)
ADMIT_CALLS=$(grep -cE 'admit_catalog_content[[:space:]]*\(' "$PACKAGE" || true)
REVIEW_CALLS=$(grep -cE 'apply_content_review[[:space:]]*\(' "$PACKAGE" || true)
[ "$PUB_CALLS/$UNQUAL/$ADMIT_CALLS/$REVIEW_CALLS" = "1/0/0/0" ] \
  && ok "A5: exactly ONE SCHEMA-QUALIFIED public.publish_catalog_content call (captured into v_result), ZERO unqualified call sites, and ZERO admission or review call sites anywhere in the package" \
  || bad "A5: call shape wrong (qualified=$PUB_CALLS unqualified=$UNQUAL admit=$ADMIT_CALLS review=$REVIEW_CALLS)"
grep -q 'ONE-USE, NOT idempotent' "$PACKAGE" \
  && grep -qF "\$p_fp\$${HOSTED_FP}\$p_fp\$" "$PACKAGE" \
  && grep -qF "\$q_fp\$${HOSTED_FP}\$q_fp\$" "$PACKAGE" \
  && grep -qF "\$p_src\$${ART_SHA}\$p_src\$" "$PACKAGE" \
  && grep -q "3/3/5/3/6/1/2/2/0/0/0" "$PACKAGE" \
  && ok "A6: the package classifies itself ONE-USE NOT idempotent, pins the promoted admission fingerprint and source sha in BOTH gates, and pins the moved post-vector (the projection is the only count change)" \
  || bad "A6: one-use label, fingerprint/source pins, or post-vector missing"

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
[ "$(Q "$ADMIN_BASELINE_SQL")" = "$BASELINE_OK" ] \
  && ok "B3: the ADMIN-role membership is EXACTLY the hosted baseline row (implicit creator membership: grantor supabase_admin -> postgres, ADMIN TRUE / INHERIT FALSE / SET FALSE) - the authority this package elevates through" \
  || bad "B3: admin baseline wrong ($(Q "$ADMIN_BASELINE_SQL"))"
[ "$(Q "$ADM_BASELINE_SQL")" = "$BASELINE_OK" ] && [ "$(Q "$REV_BASELINE_SQL")" = "$BASELINE_OK" ] && [ "$(Q "$LDR_BASELINE_SQL")" = "$BASELINE_OK" ] \
  && ok "B4: the ADMISSION, REVIEWER, and LOADER role memberships carry the same baseline shape (needed by the EXLIB-2K/2O/2P/2Q pre-state builders below)" \
  || bad "B4: admission/reviewer/loader baseline wrong"
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
echo "=== C. The COMMITTED, SPENT EXLIB-2K + 2O + 2P + 2Q packages build the EXACT hosted pre-state"
psql -h "$SOCK" -U postgres -d postgres -X -v ON_ERROR_STOP=1 -q -f "$PKG2K" > "$TMP/2k.out" 2>&1 \
  && ok "C1: the EXLIB-2K package executed once (Plank load reproduced)" \
  || { bad "C1: 2K package failed" "$(tail -3 "$TMP/2k.out" | tr '\n' ' ')"; exit 1; }
psql -h "$SOCK" -U postgres -d postgres -X -v ON_ERROR_STOP=1 -q -f "$PKG2O" > "$TMP/2o.out" 2>&1 \
  && ok "C2: the EXLIB-2O package executed once (target snapshots reproduced)" \
  || { bad "C2: 2O package failed" "$(tail -3 "$TMP/2o.out" | tr '\n' ' ')"; exit 1; }
psql -h "$SOCK" -U postgres -d postgres -X -v ON_ERROR_STOP=1 -q -f "$PKG2P" > "$TMP/2p.out" 2>&1 \
  && ok "C3: the EXLIB-2P package executed once (the hosted database review reproduced)" \
  || { bad "C3: 2P package failed" "$(tail -3 "$TMP/2p.out" | tr '\n' ' ')"; exit 1; }
psql -h "$SOCK" -U postgres -d postgres -X -v ON_ERROR_STOP=1 -q -f "$PKG2Q" > "$TMP/2q.out" 2>&1 \
  && ok "C4: the EXLIB-2Q package executed once (the hosted import admission reproduced)" \
  || { bad "C4: 2Q package failed" "$(tail -3 "$TMP/2q.out" | tr '\n' ' ')"; exit 1; }
[ "$(Q "$COUNTS_SQL")" = "$STATE_VECTOR" ] \
  && ok "C5: the pre-state is EXACTLY the post-EXLIB-2Q hosted surface ($STATE_VECTOR) - the vector the EXLIB-2R gate demands" \
  || bad "C5: pre-state vector wrong ($(Q "$COUNTS_SQL"))"
[ "$(Q "$CONTENT_SQL")" = "$CONTENT_PRE" ] \
  && ok "C6: the Plank content row is APPROVED with the exact human tuple, draft, and ADMITTED - exactly the promoted EXLIB-2Q evidence state" \
  || bad "C6: content pre-state wrong ($(Q "$CONTENT_SQL"))"
FIXTURE_FP=$(Q "SELECT c.admitted_fingerprint FROM exercise_catalog_content c WHERE c.id='$CV'")
[ "$FIXTURE_FP" = "$HOSTED_FP" ] \
  && ok "C7: FINGERPRINT PORTABILITY PROVEN - the fixture's database-computed admission fingerprint equals the promoted hosted literal $HOSTED_FP exactly (the manifest binds only portable state), so the package's fingerprint literal is a lawful, fixture-reproducible precondition" \
  || { bad "C7: fixture fingerprint differs from the promoted hosted value ($FIXTURE_FP) - the package's pinned literal would be fixture-unsafe"; exit 1; }
[ "$(Q "$ADMIT_SQL")" = "$ADMIT_OK" ] \
  && ok "C8: the COMPLETE admission surface is exact at the pre-state - source sha equals the promoted artifact fingerprint, the fingerprint equals the promoted literal AND a fresh recomputation, admitted_at present" \
  || bad "C8: admission pre-state wrong ($(Q "$ADMIT_SQL"))"
[ "$(Q "$PROJ_SQL")" = "$PROJ_PRE" ] \
  && ok "C9: ZERO projected relationships at the pre-state (publication has not happened)" \
  || bad "C9: projection pre-state wrong ($(Q "$PROJ_SQL"))"
NEUTRAL_PRE=$(Q "$NEUTRAL_SQL")
TENANT_PRE=$(Q "$TENANT_DIGEST_SQL")
[ "$(Q "SELECT orphaned_claims::text||'/'||unclaimed_bearers::text FROM exlib_verify_catalog_claims()")" = "0/0" ] \
  && ok "C10: the catalog claims invariant holds at the pre-state (0/0)" \
  || bad "C10: claims invariant broken at pre-state"
QA "CREATE DATABASE exlib2r_prestate TEMPLATE postgres OWNER postgres" >/dev/null 2>&1 \
  && ok "C11: pre-state TEMPLATE captured (every refusal variant gets a byte-identical fresh copy)" \
  || bad "C11: template capture failed"

echo
echo "=== D. Happy path: EXACTLY ONE publication with its ATOMIC relationship projection"
psql -h "$SOCK" -U postgres -d postgres -X -v ON_ERROR_STOP=1 -q -f "$PACKAGE" > "$TMP/2r.out" 2>&1 \
  && ok "D1: the EXLIB-2R package executed cleanly (one transaction; every package-internal pre/auth/call/post condition satisfied)" \
  || { bad "D1: package failed" "$(tail -3 "$TMP/2r.out" | tr '\n' ' ')"; exit 1; }
[ "$(Q "$ADMIN_BASELINE_SQL")" = "$BASELINE_OK" ] \
  && ok "D2: ADMIN authority restored byte-for-byte after success (exactly the supabase_admin-granted baseline row; nothing left behind)" \
  || bad "D2: admin authority not restored ($(Q "$ADMIN_BASELINE_SQL"))"
D3OUT=$(QQ "SET ROLE exlib_catalog_admin;")
printf '%s' "$D3OUT" | grep -q 'permission denied to set role' \
  && ok "D3: SET ROLE exlib_catalog_admin is denied again after the publication - no standing SET authority survives COMMIT" \
  || bad "D3: standing SET authority survived" "$D3OUT"
[ "$(Q "$COUNTS_SQL")" = "$POST_VECTOR" ] \
  && ok "D4: the eleven-table vector moved EXACTLY as a publication moves it ($STATE_VECTOR -> $POST_VECTOR): the atomic projection added exactly the two Plank relationship rows and NOTHING else anywhere" \
  || bad "D4: vector wrong ($(Q "$COUNTS_SQL"))"
[ "$(Q "$CONTENT_SQL")" = "$CONTENT_POST" ] \
  && ok "D5: the content row is PUBLISHED with the exact human tuple intact and admission intact - the publication transition traveled alone" \
  || bad "D5: content post-state wrong ($(Q "$CONTENT_SQL"))"
[ "$(Q "$ADMIT_SQL")" = "$ADMIT_OK" ] \
  && ok "D6: the COMPLETE admission surface is byte-identical after publication AND the fingerprint is STILL FRESH (equal to a recomputation over the published state) - publication froze nothing loose" \
  || bad "D6: admission surface drifted ($(Q "$ADMIT_SQL"))"
[ "$(Q "$PROJ_SQL")" = "$PROJ_POST" ] \
  && ok "D7: the ATOMIC PROJECTION is exact - the live relationship set for Plank is exactly {progression -> ...0003, substitution -> ...0002} and the whole table holds exactly those two rows" \
  || bad "D7: projection wrong ($(Q "$PROJ_SQL"))"
[ "$(Q "SELECT count(*) FROM exercise_catalog_content_expected_relationships e WHERE e.content_id='$CV' AND NOT EXISTS (SELECT 1 FROM exercise_catalog_relationships r WHERE r.from_logical_id='$PL' AND r.relation=e.relation AND r.to_logical_id=e.to_logical_id)")" = "0" ] \
  && [ "$(Q "SELECT count(*) FROM exercise_catalog_relationships r WHERE r.from_logical_id='$PL' AND NOT EXISTS (SELECT 1 FROM exercise_catalog_content_expected_relationships e WHERE e.content_id='$CV' AND e.relation=r.relation AND e.to_logical_id=r.to_logical_id)")" = "0" ] \
  && ok "D8: projected-set equality holds in BOTH directions (no missing, no unexpected) - the same equality the freeze trigger verified structurally at the transition" \
  || bad "D8: projected-set equality broken"
[ "$(Q "SELECT count(*) FROM exercise_catalog_review_events")" = "0" ] \
  && ok "D9: ZERO review events - the SNAPSHOT-scoped log stays empty under a publication BY SCHEMA DESIGN; the publication audit is the one-way status machine plus the protected projection itself" \
  || bad "D9: a review event appeared"
[ "$(Q "$NEUTRAL_SQL")" = "$NEUTRAL_PRE" ] \
  && ok "D10: every untouched surface is digest-identical - all three snapshot families, anatomy, aliases, claims, and expected relationships" \
  || bad "D10: an untouched surface changed"
[ "$(Q "$TENANT_DIGEST_SQL")" = "$TENANT_PRE" ] \
  && ok "D11: the tenant exercises table is count + WHOLE-ROW digest identical - DATABASE PUBLICATION IS NOT PRODUCT DELIVERY; zero product change" \
  || bad "D11: tenant exercises changed"
[ "$(Q "SELECT orphaned_claims::text||'/'||unclaimed_bearers::text FROM exlib_verify_catalog_claims()")" = "0/0" ] \
  && ok "D12: the catalog claims invariant holds EXACTLY (0/0) after the publication" \
  || bad "D12: claims invariant broken"
[ "$(Q "SELECT (SELECT count(*) FROM exercise_catalog_import_runs)::text||'/'||(SELECT count(*) FROM exercise_catalog_run_items)::text")" = "0/0" ] \
  && ok "D13: zero import runs and zero run items - no run or delivery act occurred" \
  || bad "D13: forbidden run state appeared"
PRIV=$(Q "SELECT has_function_privilege('anon','public.publish_catalog_content($PUB_SIG)','EXECUTE')::text||'/'||has_function_privilege('authenticated','public.publish_catalog_content($PUB_SIG)','EXECUTE')::text||'/'||has_function_privilege('service_role','public.publish_catalog_content($PUB_SIG)','EXECUTE')::text||'/'||has_table_privilege('anon','public.exercise_catalog_relationships','SELECT')::text||'/'||has_table_privilege('authenticated','public.exercise_catalog_relationships','SELECT')::text")
[ "$PRIV" = "false/false/false/false/false" ] \
  && ok "D14: the publication function AND the protected projection table remain locked away from every ordinary client role - a published version is still invisible to clients (delivery is a separate, later act)" \
  || bad "D14: client posture wrong ($PRIV)"
grep -q 'exlib2r publication result:' "$TMP/2r.out" \
  && grep -q '"projected_relationships"[[:space:]]*:[[:space:]]*2' "$TMP/2r.out" \
  && grep -q '"retired"[[:space:]]*:[[:space:]]*null' "$TMP/2r.out" \
  && ok "D15: the call block echoed the asserted JSONB via RAISE NOTICE (published + retired null + projected_relationships 2) - display evidence; the in-block equality assertion and the row postconditions are the binding proof" \
  || bad "D15: JSONB notice missing from the execution output"
[ "$(Q "SELECT e.canonical_name||':'||e.category FROM exercise_catalog e WHERE e.logical_id='$DBU'")" = "Dead bug:mobility" ] \
  && [ "$(Q "SELECT e.canonical_name||':'||e.category FROM exercise_catalog e WHERE e.logical_id='$AWU'")" = "Ab wheel rollout:other" ] \
  && ok "D16: both projection targets remain bound and unswapped after the publication (Dead bug/mobility at ...0002; Ab wheel rollout/other at ...0003)" \
  || bad "D16: target snapshot drifted"

echo
echo "=== E. One-use: the second execution refuses BEFORE any write or authority change"
psql -h "$SOCK" -U postgres -d postgres -X -v ON_ERROR_STOP=1 -q -f "$PACKAGE" > "$TMP/2r-second.out" 2>&1 \
  && bad "E1: the second execution SUCCEEDED (it must refuse)" \
  || { grep -q 'not the exact post-EXLIB-2Q hosted pre-state' "$TMP/2r-second.out" \
    && ok "E1: the second execution refused fail-closed at the VECTOR gate (one-use) - a publication changes the count vector (the projected rows are visible), so the vector itself catches a re-run, unlike the review and admission packages" \
    || bad "E1: refused, but not by the vector gate" "$(tail -2 "$TMP/2r-second.out" | tr '\n' ' ')"; }
[ "$(Q "$COUNTS_SQL")" = "$POST_VECTOR" ] && [ "$(Q "$PROJ_SQL")" = "$PROJ_POST" ] && [ "$(Q "$CONTENT_SQL")" = "$CONTENT_POST" ] && [ "$(Q "$ADMIN_BASELINE_SQL")" = "$BASELINE_OK" ] \
  && ok "E2: the refused second execution changed NOTHING - vector, projection, published content line, and authority baseline exactly as after the single publication" \
  || bad "E2: second execution left drift"

echo
echo "=== F. Refusal matrix - each variant on a FRESH pre-state copy; rollback + restoration proven every time"
VN=0
V=""
new_variant() {
  VN=$((VN+1))
  V="exlib2r_v$VN"
  QA "DROP DATABASE IF EXISTS $V" >/dev/null 2>&1
  QA "CREATE DATABASE $V TEMPLATE exlib2r_prestate OWNER postgres" >/dev/null
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
assert_rolled_back() { # NAME DB
  [ "$(Q "$COUNTS_SQL" "$2")" = "$STATE_VECTOR" ] && [ "$(Q "$CONTENT_SQL" "$2")" = "$CONTENT_PRE" ] && [ "$(Q "$PROJ_SQL" "$2")" = "$PROJ_PRE" ] && [ "$(Q "$ADMIN_BASELINE_SQL" "$2")" = "$BASELINE_OK" ] \
    && ok "$1" \
    || bad "$1" "counts=$(Q "$COUNTS_SQL" "$2") content=$(Q "$CONTENT_SQL" "$2") proj=$(Q "$PROJ_SQL" "$2") baseline=$(Q "$ADMIN_BASELINE_SQL" "$2")"
}
surgery() { # LABEL SQL   (operates on $V) - FAILS LOUDLY if the mutation is rejected
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
publication_never_invoked() { # LABEL   (operates on $V)
  local calls track probe
  calls=$(Q "$CALLS_PUB" "$V"); track=$(Q "$TRACKFN_SQL" "$V")
  QA "CREATE FUNCTION public.exlib2r_stat_probe() RETURNS int LANGUAGE plpgsql AS \$fn\$BEGIN RETURN 1; END\$fn\$;" "$V" >/dev/null 2>&1
  QA "SELECT public.exlib2r_stat_probe()" "$V" >/dev/null 2>&1
  probe=$(await_calls "$CALLS_PROBE" "1")
  { [ "$calls" = "0" ] && [ "$track" = "all" ] && [ "$probe" = "1" ]; } \
    && ok "$1" \
    || bad "$1" "public.publish_catalog_content calls=$calls track_functions=$track liveness-probe calls=$probe"
}

# F1 SWAPPED target snapshots (count-neutral, via a temporary name -
# the unique active-name index forbids a direct cross-update).
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
publication_never_invoked "F1b: the refusal happened BEFORE the publication call (durable zero-invocation proof; liveness probe registers 1)"

# F2 INACTIVE target snapshot, COUNT-CAMOUFLAGED (trigger-off flag
# flip; the schema-legal path also releases claims and is caught by
# the vector gate - this isolates the target gate's own clause).
new_variant
surgery "F2 inactive target behind exact counts" "ALTER TABLE exercise_catalog DISABLE TRIGGER USER;
    UPDATE exercise_catalog SET is_active=false WHERE logical_id='$AWU';
    ALTER TABLE exercise_catalog ENABLE TRIGGER USER;" \
  && [ "$(Q "SELECT e.is_active::text FROM exercise_catalog e WHERE e.logical_id='$AWU'" "$V")" = "false" ] \
  && [ "$(Q "$COUNTS_SQL" "$V")" = "$STATE_VECTOR" ] \
  && ok "F2-setup: the Ab wheel rollout snapshot is deactivated while every count stays exact" \
  || bad "F2-setup: deactivation not landed or counts moved"
expect_pkg_refusal "F2: INACTIVE TARGET SNAPSHOT refused behind EXACT counts - the forward target gate demands is_active" \
  "$V" "$PACKAGE" "Ab wheel rollout target snapshot is missing, inactive, re-versioned, reviewed, or re-bound" "$TMP/f2.out"
publication_never_invoked "F2b: the refusal happened BEFORE the publication call (durable zero-invocation proof; liveness probe registers 1)"

# F3 MISSING target snapshot behind EXACT counts (decoy snapshot at
# catalog_version 2 under the Plank identity keeps every count).
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
  && ok "F3-setup: the Ab wheel snapshot is GONE while the eleven-term vector still reads $STATE_VECTOR" \
  || bad "F3-setup: camouflage not exact ($(Q "$COUNTS_SQL" "$V"))"
expect_pkg_refusal "F3: MISSING TARGET SNAPSHOT refused behind EXACT counts - the forward target gate demands exactly one ...0003 snapshot" \
  "$V" "$PACKAGE" "Ab wheel rollout target snapshot is missing, inactive, re-versioned, reviewed, or re-bound" "$TMP/f3.out"
publication_never_invoked "F3b: the refusal happened BEFORE the publication call (durable zero-invocation proof; liveness probe registers 1)"

# F4 MUTATED Plank payload: a scalar drift only the exact-literal
# content gate can refuse (it ALSO stales the manifest, so the same
# gate's freshness clause would fire one line later).
new_variant
surgery "F4 payload drift" "ALTER TABLE exercise_catalog_content DISABLE TRIGGER USER;
    UPDATE exercise_catalog_content SET safety_guidance='Drifted guidance that is perfectly plausible prose.' WHERE id='$CV';
    ALTER TABLE exercise_catalog_content ENABLE TRIGGER USER;" \
  && [ "$(Q "SELECT c.safety_guidance FROM exercise_catalog_content c WHERE c.id='$CV'" "$V")" = "Drifted guidance that is perfectly plausible prose." ] \
  && ok "F4-setup: the scalar payload drift is present and REAL" \
  || bad "F4-setup: drift not landed"
expect_pkg_refusal "F4: MUTATED PLANK PAYLOAD refused - the exact-value content gate (no hashes) catches the drifted safety_guidance BEFORE any write or authority change" \
  "$V" "$PACKAGE" "not the exact admitted pre-publication state" "$TMP/f4.out"
publication_never_invoked "F4b: the refusal happened BEFORE the publication call (durable zero-invocation proof; liveness probe registers 1)"

# F5 DRIFTED REVIEW TUPLE: the applied human evidence must be exact.
new_variant
surgery "F5 review-tuple drift" "ALTER TABLE exercise_catalog_content DISABLE TRIGGER USER;
    UPDATE exercise_catalog_content SET reviewed_by='Someone Else' WHERE id='$CV';
    ALTER TABLE exercise_catalog_content ENABLE TRIGGER USER;" \
  && [ "$(Q "SELECT c.reviewed_by FROM exercise_catalog_content c WHERE c.id='$CV'" "$V")" = "Someone Else" ] \
  && ok "F5-setup: the drifted reviewer identity is present and REAL" \
  || bad "F5-setup: drift not landed"
expect_pkg_refusal "F5: DRIFTED REVIEW TUPLE refused - the content gate pins the exact applied human tuple, not merely 'approved'" \
  "$V" "$PACKAGE" "not the exact admitted pre-publication state" "$TMP/f5.out"
publication_never_invoked "F5b: the refusal happened BEFORE the publication call (durable zero-invocation proof; liveness probe registers 1)"

# F6 CONTENT NOT APPROVED: reverted to pending with NULL evidence.
# The admission_order_chk CHECK forbids a pending ADMITTED row, so
# the surgery must strip the admission too - a coherent
# never-reviewed shape; the content gate refuses it wholesale.
new_variant
surgery "F6 not approved (coherent unreviewed shape)" "ALTER TABLE exercise_catalog_content DISABLE TRIGGER USER;
    UPDATE exercise_catalog_content SET content_status='pending', reviewed_by=NULL, reviewed_at=NULL, review_rationale=NULL, import_admitted=false, admitted_fingerprint=NULL, admitted_source_sha256=NULL, admitted_at=NULL WHERE id='$CV';
    ALTER TABLE exercise_catalog_content ENABLE TRIGGER USER;" \
  && [ "$(Q "SELECT c.content_status||'/'||c.import_admitted::text FROM exercise_catalog_content c WHERE c.id='$CV'" "$V")" = "pending/false" ] \
  && ok "F6-setup: the content row reads as never reviewed and never admitted (pending, NULL evidence, NULL admission)" \
  || bad "F6-setup: revert not landed"
expect_pkg_refusal "F6: NOT-APPROVED CONTENT refused - publication cannot precede the evidenced hosted review and admission" \
  "$V" "$PACKAGE" "not the exact admitted pre-publication state" "$TMP/f6.out"
publication_never_invoked "F6b: the refusal happened BEFORE the publication call (durable zero-invocation proof; liveness probe registers 1)"

# F7 UNADMITTED CONTENT: approved with the exact tuple, admission
# stripped (the all-or-nothing admission CHECK keeps this legal).
new_variant
surgery "F7 unadmitted content" "ALTER TABLE exercise_catalog_content DISABLE TRIGGER USER;
    UPDATE exercise_catalog_content SET import_admitted=false, admitted_fingerprint=NULL, admitted_source_sha256=NULL, admitted_at=NULL WHERE id='$CV';
    ALTER TABLE exercise_catalog_content ENABLE TRIGGER USER;" \
  && [ "$(Q "SELECT c.content_status||'/'||c.import_admitted::text FROM exercise_catalog_content c WHERE c.id='$CV'" "$V")" = "approved/false" ] \
  && ok "F7-setup: the content row is approved but UNADMITTED with the NULL trio" \
  || bad "F7-setup: strip not landed"
expect_pkg_refusal "F7: UNADMITTED CONTENT refused - publication requires the completed, evidenced admission surface" \
  "$V" "$PACKAGE" "not the exact admitted pre-publication state" "$TMP/f7.out"
publication_never_invoked "F7b: the refusal happened BEFORE the publication call (durable zero-invocation proof; liveness probe registers 1)"

# F8 STALE/MISMATCHED ADMISSION FINGERPRINT: a format-valid wrong
# 64-hex value (satisfies the CHECK shape; fails BOTH the promoted
# literal pin and the fresh-recompute clause of the content gate).
new_variant
surgery "F8 stale admission fingerprint" "ALTER TABLE exercise_catalog_content DISABLE TRIGGER USER;
    UPDATE exercise_catalog_content SET admitted_fingerprint=repeat('a',64) WHERE id='$CV';
    ALTER TABLE exercise_catalog_content ENABLE TRIGGER USER;" \
  && [ "$(Q "SELECT c.admitted_fingerprint = repeat('a',64) FROM exercise_catalog_content c WHERE c.id='$CV'" "$V")" = "t" ] \
  && ok "F8-setup: the stored admission fingerprint is a format-valid WRONG value" \
  || bad "F8-setup: fingerprint rewrite not landed"
expect_pkg_refusal "F8: STALE ADMISSION FINGERPRINT refused - the content gate pins the promoted literal AND demands fresh-recompute equality, exactly the staleness publication must never build on" \
  "$V" "$PACKAGE" "not the exact admitted pre-publication state" "$TMP/f8.out"
publication_never_invoked "F8b: the refusal happened BEFORE the publication call (durable zero-invocation proof; liveness probe registers 1)"

# F9 WRONG ADMITTED SOURCE SHA: format-valid wrong provenance.
new_variant
surgery "F9 wrong admitted source sha" "ALTER TABLE exercise_catalog_content DISABLE TRIGGER USER;
    UPDATE exercise_catalog_content SET admitted_source_sha256=repeat('b',64) WHERE id='$CV';
    ALTER TABLE exercise_catalog_content ENABLE TRIGGER USER;" \
  && [ "$(Q "SELECT c.admitted_source_sha256 = repeat('b',64) FROM exercise_catalog_content c WHERE c.id='$CV'" "$V")" = "t" ] \
  && ok "F9-setup: the stored admitted source sha is a format-valid WRONG value" \
  || bad "F9-setup: source-sha rewrite not landed"
expect_pkg_refusal "F9: WRONG ADMITTED SOURCE SHA refused - the content gate pins the promoted artifact fingerprint as the only lawful provenance" \
  "$V" "$PACKAGE" "not the exact admitted pre-publication state" "$TMP/f9.out"
publication_never_invoked "F9b: the refusal happened BEFORE the publication call (durable zero-invocation proof; liveness probe registers 1)"

# F10 ALREADY PUBLISHED behind EXACT counts: only publication_status
# flipped (legal against the publication CHECK because the row IS
# approved+admitted; no projection rows created, so the vector still
# reads the pre-state and ONLY the draft clause can refuse).
new_variant
surgery "F10 already published behind exact counts" "ALTER TABLE exercise_catalog_content DISABLE TRIGGER USER;
    UPDATE exercise_catalog_content SET publication_status='published' WHERE id='$CV';
    ALTER TABLE exercise_catalog_content ENABLE TRIGGER USER;" \
  && [ "$(Q "SELECT c.publication_status FROM exercise_catalog_content c WHERE c.id='$CV'" "$V")" = "published" ] \
  && [ "$(Q "$COUNTS_SQL" "$V")" = "$STATE_VECTOR" ] \
  && ok "F10-setup: the content row reads as published while every count stays exact (the draft clause is the only gate that can fire)" \
  || bad "F10-setup: publication flip not landed or counts moved"
expect_pkg_refusal "F10: ALREADY-PUBLISHED refused behind EXACT counts - the draft-lifecycle clause of the content gate enforces one-way publication before any write or authority change" \
  "$V" "$PACKAGE" "not the exact admitted pre-publication state" "$TMP/f10.out"
publication_never_invoked "F10b: the refusal happened BEFORE the publication call (durable zero-invocation proof; liveness probe registers 1)"

# F11 PRE-EXISTING PROJECTED RELATIONSHIP: a foreign projection row
# (protection trigger bypassed by superuser surgery) moves the
# vector's eighth term - the vector gate refuses first.
new_variant
surgery "F11 foreign projected relationship" "ALTER TABLE exercise_catalog_relationships DISABLE TRIGGER USER;
    INSERT INTO exercise_catalog_relationships (from_logical_id, to_logical_id, relation) VALUES ('$PL', '$DBU', 'regression');
    ALTER TABLE exercise_catalog_relationships ENABLE TRIGGER USER;" \
  && [ "$(Q "SELECT count(*) FROM exercise_catalog_relationships" "$V")" = "1" ] \
  && ok "F11-setup: one foreign projection row is present and REAL" \
  || bad "F11-setup: row not landed"
expect_pkg_refusal "F11: PRE-EXISTING PROJECTED RELATIONSHIP refused - the eleven-term vector's relationships term catches foreign projection state BEFORE any write (the dedicated zero-projection gate stands behind it)" \
  "$V" "$PACKAGE" "not the exact post-EXLIB-2Q hosted pre-state" "$TMP/f11.out"
publication_never_invoked "F11b: the refusal happened BEFORE the publication call (durable zero-invocation proof; liveness probe registers 1)"

# F12 EXPECTED-RELATIONSHIP DRIFT: the manifest binds the expected
# set, so the drift STALES the stored admission fingerprint - the
# content gate's freshness clause refuses first; the dedicated
# expected-set gate is structural defense-in-depth behind it (a
# drift can never outrun the manifest).
new_variant
surgery "F12 expected-relationship drift" "ALTER TABLE exercise_catalog_content_expected_relationships DISABLE TRIGGER USER;
    UPDATE exercise_catalog_content_expected_relationships SET relation='regression' WHERE relation='progression';
    ALTER TABLE exercise_catalog_content_expected_relationships ENABLE TRIGGER USER;" \
  && [ "$(Q "SELECT count(*) FROM exercise_catalog_content_expected_relationships WHERE relation='regression'" "$V")" = "1" ] \
  && ok "F12-setup: the expected-relationship drift is present and REAL (progression rewritten to regression)" \
  || bad "F12-setup: drift not landed"
expect_pkg_refusal "F12: EXPECTED-RELATIONSHIP DRIFT refused - the drift stales the admission manifest, so the content gate's fingerprint-freshness clause fires (the drifted set could never be projected off a stale admission)" \
  "$V" "$PACKAGE" "not the exact admitted pre-publication state" "$TMP/f12.out"
publication_never_invoked "F12b: the refusal happened BEFORE the publication call (durable zero-invocation proof; liveness probe registers 1)"

# F13 FOREIGN REVIEW EVENT: caught by the vector's eleventh term.
new_variant
surgery "F13 foreign review event" "ALTER TABLE exercise_catalog_review_events DISABLE TRIGGER USER;
    INSERT INTO exercise_catalog_review_events (catalog_id, from_status, to_status, reviewed_by, reviewed_at, review_rationale)
    SELECT e.id, 'pending', 'approved', 'Foreign Writer', now(), 'foreign snapshot review event' FROM exercise_catalog e WHERE e.logical_id='$PL';
    ALTER TABLE exercise_catalog_review_events ENABLE TRIGGER USER;" \
  && [ "$(Q "SELECT count(*) FROM exercise_catalog_review_events" "$V")" = "1" ] \
  && ok "F13-setup: one foreign snapshot review event is present and REAL" \
  || bad "F13-setup: event not landed"
expect_pkg_refusal "F13: PRE-EXISTING REVIEW EVENT refused - the eleven-term vector's review-events term catches foreign review activity BEFORE any write" \
  "$V" "$PACKAGE" "not the exact post-EXLIB-2Q hosted pre-state" "$TMP/f13.out"
publication_never_invoked "F13b: the refusal happened BEFORE the publication call (durable zero-invocation proof; liveness probe registers 1)"

# F14 FOREIGN IMPORT RUN: a run row where the gate demands none -
# caught by the vector's ninth term.
new_variant
surgery "F14 foreign import run" "ALTER TABLE exercise_catalog_import_runs DISABLE TRIGGER USER;
    INSERT INTO exercise_catalog_import_runs (run_key) VALUES ('foreign-run-0001');
    ALTER TABLE exercise_catalog_import_runs ENABLE TRIGGER USER;" \
  && [ "$(Q "SELECT count(*) FROM exercise_catalog_import_runs" "$V")" = "1" ] \
  && ok "F14-setup: one foreign import run is present and REAL" \
  || bad "F14-setup: run not landed"
expect_pkg_refusal "F14: FOREIGN IMPORT RUN refused - the eleven-term vector's import-runs term catches foreign run state BEFORE any write" \
  "$V" "$PACKAGE" "not the exact post-EXLIB-2Q hosted pre-state" "$TMP/f14.out"
publication_never_invoked "F14b: the refusal happened BEFORE the publication call (durable zero-invocation proof; liveness probe registers 1)"

# F15 WRONG INVOKER: the superuser bootstrap role.
new_variant
if psql -h "$SOCK" -U supabase_admin -d "$V" -X -v ON_ERROR_STOP=1 -q -f "$PACKAGE" > "$TMP/f15.out" 2>&1; then
  bad "F15: the superuser execution SUCCEEDED (it must refuse)"
else
  grep -q 'BOTH execution identities must be the hosted operator role postgres' "$TMP/f15.out" \
    && ok "F15: WRONG INVOKER refused - the dual-identity gate rejects a non-postgres session BEFORE any write or authority change" \
    || bad "F15: refused, but not by the identity gate" "$(tail -2 "$TMP/f15.out" | tr '\n' ' ')"
fi
publication_never_invoked "F15b: the refusal happened BEFORE the publication call (durable zero-invocation proof; liveness probe registers 1)"

# F16 WIDENED AUTHORITY BASELINE (cluster-wide; torn down after).
new_variant
surgery "F16 widened baseline" "CREATE ROLE exlib2r_widen NOLOGIN; GRANT exlib_catalog_admin TO exlib2r_widen;" \
  && [ "$(Q "SELECT count(*) FROM pg_auth_members am JOIN pg_roles r ON r.oid=am.roleid WHERE r.rolname='exlib_catalog_admin'" "$V")" = "2" ] \
  && ok "F16-setup: a second admin membership exists (the widened posture is real)" \
  || bad "F16-setup: widening not landed"
expect_pkg_refusal "F16: WIDENED AUTHORITY BASELINE refused - the grantor-included baseline gate demands exactly the one supabase_admin-granted row" \
  "$V" "$PACKAGE" "admin-role membership posture is not the exact hosted baseline" "$TMP/f16.out"
publication_never_invoked "F16b: the refusal happened BEFORE the publication call (durable zero-invocation proof; liveness probe registers 1)"
# ROLE MEMBERSHIPS ARE CLUSTER-WIDE (pg_auth_members is shared): tear
# the widening down and assert the restored cluster-wide baseline.
QA "DROP ROLE exlib2r_widen" >/dev/null 2>&1
[ "$(Q "$ADMIN_BASELINE_SQL" "$V")" = "$BASELINE_OK" ] && [ "$(Q "$ADMIN_BASELINE_SQL")" = "$BASELINE_OK" ] \
  && ok "F16c: the cluster-wide widening is torn down and the shared baseline reads exactly one supabase_admin-granted row again (checked in the variant AND the main database)" \
  || bad "F16c: cluster-wide baseline not restored"

# F17 WRONG-GRANTOR BASELINE: the membership row's grantor is
# rewritten to postgres by DIRECT shared-catalog surgery (superuser
# probe authority; the EXLIB-2K-proven technique - a postgres-granted
# BASELINE row is not constructible through GRANT). Cluster-wide;
# restored and asserted afterward.
new_variant
QA "UPDATE pg_auth_members SET grantor=(SELECT oid FROM pg_roles WHERE rolname='postgres') WHERE roleid=(SELECT oid FROM pg_roles WHERE rolname='exlib_catalog_admin') AND member=(SELECT oid FROM pg_roles WHERE rolname='postgres')" "$V" >/dev/null 2>&1 \
  && [ "$(Q "$ADMIN_BASELINE_SQL" "$V")" = "1/postgres>postgres:true:false:false" ] \
  && ok "F17-setup: the baseline row's grantor now reads postgres (wrong grantor, same count - only the grantor clause can refuse)" \
  || bad "F17-setup: grantor rewrite not landed ($(Q "$ADMIN_BASELINE_SQL" "$V"))"
expect_pkg_refusal "F17: WRONG-GRANTOR BASELINE refused - the baseline gate is GRANTOR-INCLUDED, so a same-shape row granted by the wrong authority fails before any write" \
  "$V" "$PACKAGE" "admin-role membership posture is not the exact hosted baseline" "$TMP/f17.out"
QA "UPDATE pg_auth_members SET grantor=(SELECT oid FROM pg_roles WHERE rolname='supabase_admin') WHERE roleid=(SELECT oid FROM pg_roles WHERE rolname='exlib_catalog_admin') AND member=(SELECT oid FROM pg_roles WHERE rolname='postgres')" "$V" >/dev/null 2>&1
[ "$(Q "$ADMIN_BASELINE_SQL" "$V")" = "$BASELINE_OK" ] && [ "$(Q "$ADMIN_BASELINE_SQL")" = "$BASELINE_OK" ] \
  && ok "F17b: the cluster-wide grantor is restored to supabase_admin and the shared baseline is exact again (variant AND main database)" \
  || bad "F17b: grantor not restored"

# F18 DRIFTED PACKAGE ARGUMENTS: a sed-derived package COPY whose
# content-UUID argument is rewritten to a nonexistent version. Every
# package pre-gate passes (they check the real rows), the function
# itself refuses INSIDE the transaction, and everything rolls back.
new_variant
sed "s/'e21b2c00-0000-4000-a000-000000000101');/'e21b2c00-0000-4000-a000-000000000102');/" "$PACKAGE" > "$TMP/pkg-f18.sql"
grep -q "000000000102');" "$TMP/pkg-f18.sql" \
  && [ "$(grep -c "000000000101" "$TMP/pkg-f18.sql")" != "0" ] \
  && ok "F18-setup: the drifted-argument copy is built (the call now names a nonexistent content version; every gate still checks the real rows; repository package untouched)" \
  || bad "F18-setup: copy not built"
expect_pkg_refusal "F18: DRIFTED CALL ARGUMENTS refused INSIDE the function - publish_catalog_content rejects the unknown content version and the WHOLE transaction rolls back" \
  "$V" "$TMP/pkg-f18.sql" "content row not found under that logical identity" "$TMP/f18.out"
assert_rolled_back "F18b: WHOLE-TRANSACTION rollback - vector, draft content line, empty projection, and authority baseline all exactly the pre-state; nothing persisted" "$V"

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
grep -q 'not the exact post-EXLIB-2Q hosted pre-state' "$LOSER_OUT" \
  && ok "G2: the losing session refused at the VECTOR gate AFTER waiting on the winner's lock (the winner's projected rows are visible; never a partial write)" \
  || bad "G2: loser refused by the wrong gate" "$(tail -2 "$LOSER_OUT" | tr '\n' ' ')"
[ "$(Q "$COUNTS_SQL" "$V")" = "$POST_VECTOR" ] && [ "$(Q "$PROJ_SQL" "$V")" = "$PROJ_POST" ] && [ "$(Q "$CONTENT_SQL" "$V")" = "$CONTENT_POST" ] \
  && ok "G3: the raced database holds EXACTLY one applied publication (the moved vector once; the exact projection once; the published line once)" \
  || bad "G3: raced state wrong"
[ "$(Q "$ADMIN_BASELINE_SQL" "$V")" = "$BASELINE_OK" ] \
  && ok "G4: authority baseline exact after the race" \
  || bad "G4: baseline drift after race"

echo
echo "=== H. SEARCH_PATH DECOY: the schema-qualified publication call cannot be hijacked"
build_decoy() { # operates on $V
  surgery "H same-signature decoy publisher ahead of public" "CREATE SCHEMA exlib2r_decoy;
      CREATE TABLE exlib2r_decoy.invocations (at timestamptz NOT NULL DEFAULT now());
      CREATE FUNCTION exlib2r_decoy.publish_catalog_content($PUB_SIG) RETURNS JSONB
        LANGUAGE plpgsql SECURITY DEFINER AS \$decoy\$
        BEGIN
          INSERT INTO exlib2r_decoy.invocations DEFAULT VALUES;
          RETURN jsonb_build_object('hijacked', true);
        END \$decoy\$;
      GRANT USAGE ON SCHEMA exlib2r_decoy TO PUBLIC;
      ALTER DATABASE $V SET search_path = exlib2r_decoy, public;"
}
new_variant
build_decoy && ok "H0: decoy built (same-signature exlib2r_decoy.publish_catalog_content, schema USAGE granted to PUBLIC, database search_path = exlib2r_decoy, public)" \
  || bad "H0: decoy build failed"
H1=$(QA "SET ROLE exlib_catalog_admin; SELECT n.nspname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE p.oid = to_regprocedure('publish_catalog_content($PUB_SIG)');" "$V" 2>/dev/null)
H1B=$(QA "SHOW search_path" "$V" 2>/dev/null)
{ [ "$H1" = "exlib2r_decoy" ] && printf '%s' "$H1B" | grep -q 'exlib2r_decoy'; } \
  && ok "H1: the decoy has TEETH - in the ADMIN ROLE's own resolution context the unqualified name publish_catalog_content resolves to schema exlib2r_decoy (search_path = $H1B), while public.publish_catalog_content still exists unchanged" \
  || bad "H1: decoy has no teeth (resolved=$H1 path=$H1B)"
run_pkg "$V" "$PACKAGE" "$TMP/h2.out" \
  && ok "H2: the package executed cleanly with the decoy sitting ahead of public in search_path - qualification proves no name in the package depends on search_path" \
  || bad "H2: package failed under decoy" "$(tail -2 "$TMP/h2.out" | tr '\n' ' ')"
CP=$(await_calls "$CALLS_PUB" "1"); CD=$(Q "$CALLS_DEC" "$V")
[ "$CP" = "1" ] && [ "$CD" = "0" ] \
  && ok "H3: durable per-function statistics show public.publish_catalog_content invoked EXACTLY ONCE and the decoy ZERO times (the zero rides the same statistics flush as the one, so it is a live observation)" \
  || bad "H3: invocation counts wrong (public=$CP decoy=$CD)"
[ "$(QA "SELECT count(*) FROM exlib2r_decoy.invocations" "$V")" = "0" ] \
  && ok "H4: second, independent witness - the decoy's own marker table is EMPTY after a COMMITTED run, so no decoy invocation was even attempted" \
  || bad "H4: decoy marker rows present"
[ "$(Q "$PROJ_SQL" "$V")" = "$PROJ_POST" ] && [ "$(Q "$CONTENT_SQL" "$V")" = "$CONTENT_POST" ] \
  && ok "H5: the EXACT expected post-state was produced under the decoy - the real migration-027 publication function did the work" \
  || bad "H5: post-state wrong under decoy"
[ "$(Q "$ADMIN_BASELINE_SQL" "$V")" = "$BASELINE_OK" ] \
  && ok "H6: authority RESTORED byte-for-byte after the decoy run" \
  || bad "H6: authority drift under decoy"
new_variant
build_decoy >/dev/null
sed 's/v_result := public\.publish_catalog_content($/v_result := publish_catalog_content(/' "$PACKAGE" > "$TMP/pkg-unqual.sql"
[ "$(grep -c 'v_result := publish_catalog_content($' "$TMP/pkg-unqual.sql")" = "1" ] \
  && ok "H7-setup: an UNQUALIFIED copy is built (the call stripped of its public. qualification, nothing else changed; the repository package is never modified)" \
  || bad "H7-setup: unqualified copy not built"
if run_pkg "$V" "$TMP/pkg-unqual.sql" "$TMP/h7.out"; then
  bad "H7: the unqualified copy SUCCEEDED under the decoy (the hijack should divert it into refusal)"
else
  grep -q 'the returned JSONB is not the exact derivable result' "$TMP/h7.out" \
    && ok "H7: the UNQUALIFIED call shape IS hijacked - the decoy returns {hijacked: true}, the call block's own exact JSONB assertion refuses it IMMEDIATELY, and the whole transaction rolls back" \
    || bad "H7: refused, but not by the call block's JSONB assertion" "$(tail -2 "$TMP/h7.out" | tr '\n' ' ')"
fi
CP2=$(Q "$CALLS_PUB" "$V"); CD2=$(await_calls "$CALLS_DEC" "1")
[ "$CP2" = "0" ] && [ "$CD2" = "1" ] \
  && ok "H8: the hijack is REAL and the instrument is SENSITIVE - the DECOY was invoked exactly once and public.publish_catalog_content zero times, which is what makes H3's zero a measurement rather than an assumption" \
  || bad "H8: hijack counts wrong (public=$CP2 decoy=$CD2)"
assert_rolled_back "H9: WHOLE-TRANSACTION rollback after the hijacked run - draft content line, empty projection, and authority baseline exact, so even a hijacked publisher could not leave state behind" "$V"
[ "$(QA "SELECT count(*) FROM exlib2r_decoy.invocations" "$V")" = "0" ] \
  && ok "H10: DISCLOSED - the decoy's marker rows rolled back WITH the aborted transaction (0 rows), which is exactly why the durable non-transactional function counter in H8, not the marker table, is the instrument that proves the hijack occurred" \
  || bad "H10: marker rows unexpectedly persisted"

echo
echo "=== I. Cluster-wide restoration and fixture containment"
[ "$(Q "$ADMIN_BASELINE_SQL")" = "$BASELINE_OK" ] && [ "$(Q "$ADM_BASELINE_SQL")" = "$BASELINE_OK" ] && [ "$(Q "$REV_BASELINE_SQL")" = "$BASELINE_OK" ] && [ "$(Q "$LDR_BASELINE_SQL")" = "$BASELINE_OK" ] \
  && ok "I1: ALL FOUR cluster-wide role baselines read exactly one supabase_admin-granted row each after every variant (pg_auth_members is shared - nothing leaked)" \
  || bad "I1: a cluster-wide baseline drifted"
OWN_DIRS=$(ls -d /tmp/exlib2r-pg.* 2>/dev/null | grep -vc "^$TMP\$" || true)
[ "$OWN_DIRS" = "0" ] \
  && ok "I2: no foreign exlib2r fixture directories exist besides this run's own (which the EXIT trap removes, postmaster included)" \
  || bad "I2: $OWN_DIRS foreign fixture dir(s) present"

echo
printf '%s passed, %s failed\n' "$PASS" "$FAIL"
[ "$FAIL" = "0" ] || exit 1
