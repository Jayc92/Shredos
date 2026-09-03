#!/bin/bash
# ============================================================
# ForgeFitOS - EXLIB-2K Plank catalog-load preparation LIVE proof.
#
# Applies migrations 001-027 FROM supabase/migrations exactly once to
# a DISPOSABLE LOCAL PostgreSQL cluster (unix-socket only, no TCP,
# torn down on exit), seeds a REPRESENTATIVE tenant fixture (84
# exercises across four users, each with a seeded Plank), executes
# the PREPARED docs load package exactly once under the loader role,
# and proves the exact resulting state against the admitted Plank
# artifact BYTE BY BYTE. It then proves the fail-closed properties:
# admission-before-review refused, publication refused, no live
# projection, no run/seal/delivery/exercise/seed effect, one-use
# second-execution refusal, whole-transaction rollback for every
# meaningful malformed or incomplete package variant (each on a
# fresh scratch database) including a claim-corruption variant that
# trips the package's OWN three-claim postcondition, and a REAL
# two-session concurrency race proving the lock-serialized fresh-load
# gate admits exactly one execution. This script NEVER contacts Supabase,
# Vercel, or any remote service; the package remains PREPARED - NOT
# EXECUTED against any hosted or persistent database, and no
# persistent local database is left behind.
#
# HOSTED-SHAPE FIXTURE (authority correction): the cluster boots with
# a bootstrap superuser named supabase_admin used ONLY as platform
# substrate and harness probe authority; the working role is a
# recreated NON-SUPERUSER postgres (LOGIN, CREATEDB, CREATEROLE) - the
# hosted operator posture. Migrations apply AS postgres, so migration
# 027's CREATE ROLE statements natively produce the implicit creator
# memberships ADMIN TRUE / INHERIT FALSE / SET FALSE - the exact
# posture reported from the failed hosted attempt. The suite proves:
# the PROMOTED package bytes reproduce the exact hosted 42501 refusal
# on this fixture; the corrected package's transaction-contained
# elevation restores the baseline membership exactly on success AND
# on every failure path; and no client/service/PUBLIC authority ever
# widens.
#
# The package's loaded content IS derived from the real admitted
# Plank artifact - that is this milestone's purpose - but it is
# loaded ONLY into the disposable cluster, left pending/draft/
# unadmitted, and destroyed with the cluster.
#
# Run from the repository root:
#   bash scripts/verify-exlib2k-live.sh
# ============================================================
set -uo pipefail
export LC_ALL=C LANG=C

PACKAGE="docs/exlib2k-plank-catalog-load-package.sql"
ARTIFACT="docs/exlib2g-plank-content.jsonl"

PASS=0
FAIL=0
ok()  { PASS=$((PASS+1)); printf '  PASS  %s\n' "$1"; }
bad() { FAIL=$((FAIL+1)); printf '  FAIL  %s\n' "$1"; [ -n "${2:-}" ] && printf '        %s\n' "$2"; return 0; }

TMP="$(mktemp -d /tmp/exlib2k-pg.XXXXXX)"
PGDATA="$TMP/pgdata"
SOCK="$TMP"
export SOCK
cleanup() {
  pg_ctl -D "$PGDATA" stop -m immediate >/dev/null 2>&1 || true
  rm -rf "$TMP"
}
trap cleanup EXIT

DB=postgres
# Q/QQ run as the NON-SUPERUSER working role postgres (the hosted
# operator posture); QA/QQA run as the bootstrap superuser
# supabase_admin - platform substrate and harness PROBE authority only,
# never product authority.
Q()   { psql -h "$SOCK" -U postgres -d "$DB" -X -v ON_ERROR_STOP=1 -qtA -c "$1"; }
QQ()  { psql -h "$SOCK" -U postgres -d "$DB" -X -v ON_ERROR_STOP=1 -qtA -c "$1" 2>&1; }
QA()  { psql -h "$SOCK" -U supabase_admin -d "$DB" -X -v ON_ERROR_STOP=1 -qtA -c "$1"; }
QQA() { psql -h "$SOCK" -U supabase_admin -d "$DB" -X -v ON_ERROR_STOP=1 -qtA -c "$1" 2>&1; }
expect_err() { # NAME SQL PATTERN
  local out; out=$(QQ "$2")
  if [ $? -eq 0 ]; then
    bad "$1" "expected fail-closed rejection, statement SUCCEEDED"
  elif printf '%s' "$out" | grep -qF "$3"; then ok "$1"
  else bad "$1" "rejected, but not by the expected rule ($3): $(printf '%s' "$out" | head -2 | tr '\n' ' ')"; fi
}
expect_eq() { # NAME SQL EXPECTED
  local got; got=$(QQ "$2")
  if [ "$got" = "$3" ]; then ok "$1"; else bad "$1" "expected [$3], got [$got]"; fi
}
expect_err_admin() { # NAME SQL PATTERN - via supabase_admin PROBE authority
  local out; out=$(QQA "$2")
  if [ $? -eq 0 ]; then
    bad "$1" "expected fail-closed rejection, statement SUCCEEDED"
  elif printf '%s' "$out" | grep -qF "$3"; then ok "$1"
  else bad "$1" "rejected, but not by the expected rule ($3): $(printf '%s' "$out" | head -2 | tr '\n' ' ')"; fi
}
# Membership-baseline assertion, GRANTOR INCLUDED: the loader role
# must carry EXACTLY one membership - the supabase_admin-granted row
# for postgres with ADMIN TRUE, INHERIT FALSE, SET FALSE (the exact
# hosted row ChatGPT's read-only review query established).
BASELINE_SQL="SELECT (SELECT count(*) FROM pg_auth_members am JOIN pg_roles r ON r.oid=am.roleid WHERE r.rolname='exlib_catalog_loader')::text || '/' || (SELECT g.rolname||'>'||m.rolname||':'||am.admin_option::text||':'||am.inherit_option::text||':'||am.set_option::text FROM pg_auth_members am JOIN pg_roles r ON r.oid=am.roleid JOIN pg_roles m ON m.oid=am.member JOIN pg_roles g ON g.oid=am.grantor WHERE r.rolname='exlib_catalog_loader' AND m.rolname='postgres')"
BASELINE_OK="1/supabase_admin>postgres:true:false:false"
# BASELINE_SQL asserts the ONE exact row and errors on any other count;
# these two tolerate zero-row and multi-row postures, for the grantor
# impossibility proofs in F4.
MEMROWS_SQL="SELECT count(*)::text FROM pg_auth_members am JOIN pg_roles r ON r.oid=am.roleid WHERE r.rolname='exlib_catalog_loader'"
MEMSET_SQL="SELECT coalesce(string_agg(g.rolname||'>'||m.rolname||':'||am.admin_option::text||':'||am.inherit_option::text||':'||am.set_option::text, ' + ' ORDER BY g.rolname), '<none>') FROM pg_auth_members am JOIN pg_roles r ON r.oid=am.roleid JOIN pg_roles m ON m.oid=am.member JOIN pg_roles g ON g.oid=am.grantor WHERE r.rolname='exlib_catalog_loader'"

PL='e21b2c00-0000-4000-a000-000000000001'
DBU='e21b2c00-0000-4000-a000-000000000002'
AW='e21b2c00-0000-4000-a000-000000000003'
CV='e21b2c00-0000-4000-a000-000000000101'

echo
echo "=== A. Package identity and bindings"
[ -f "$PACKAGE" ] && ok "A1: the prepared load package exists at $PACKAGE (under docs/, not supabase/migrations/)" \
  || { bad "A1: package missing"; exit 1; }
ASHA=$(shasum -a 256 "$ARTIFACT" | awk '{print $1}')
ABYTES=$(wc -c < "$ARTIFACT" | tr -d ' ')
[ "$ABYTES/$ASHA" = "2928/d82078490efa9ef13e128e7b7b742fbda8ea9e74e32382252d96c326c679d752" ] \
  && ok "A2: the admitted Plank artifact holds its exact promoted fingerprint (2,928 B / d8207849...)" \
  || { bad "A2: admitted artifact drifted ($ABYTES/$ASHA)"; exit 1; }
MSHA=$(shasum -a 256 supabase/migrations/027_exlib_catalog_content_schema.sql | awk '{print $1}')
[ "$MSHA" = "90d53aaf8fd341dd99bab22b7d1ca280ec24b8ccee2a28efca6e835e0585a14f" ] \
  && ok "A3: applied migration 027 is byte-unchanged (90d53aaf...)" \
  || { bad "A3: migration 027 drifted"; exit 1; }
PSHA=$(shasum -a 256 "$PACKAGE" | awk '{print $1}')
PBYTES=$(wc -c < "$PACKAGE" | tr -d ' ')
ok "A4: package under test: $PBYTES bytes, sha256 $PSHA"
grep -q 'PREPARED — NOT EXECUTED' "$PACKAGE" && grep -q 'ttybyljytiwntvorugcv' "$PACKAGE" \
  && grep -q "$ASHA" "$PACKAGE" && grep -q "$MSHA" "$PACKAGE" \
  && ok "A5: the package is labeled PREPARED - NOT EXECUTED, names the only eventual target, and binds both fingerprints" \
  || bad "A5: package labeling/bindings incomplete"
[ "$(grep -c '^BEGIN;' "$PACKAGE")/$(grep -c '^COMMIT;' "$PACKAGE")" = "1/1" ] \
  && ok "A6: exactly one explicit transaction encloses the package" \
  || bad "A6: transaction shape wrong"
LOADER_CALLS=$(grep -cE '^SELECT load_catalog_(identity|snapshot|content_draft)\(' "$PACKAGE")
OTHER_AUTH=$(grep -cE 'apply_content_review|admit_catalog_content|publish_catalog_content|exlib_approve_and_seal_run|deliver_catalog_exercises|rollback_catalog_delivery|exlib_revoke_run_delivery' "$PACKAGE" || true)
[ "$LOADER_CALLS/$OTHER_AUTH" = "5/0" ] \
  && ok "A7: exactly five loader-function calls and ZERO reviewer/admission/publication/run/seal/delivery authority calls" \
  || bad "A7: authority usage wrong ($LOADER_CALLS/$OTHER_AUTH)"
grep -q '^SET ROLE exlib_catalog_loader;' "$PACKAGE" && grep -q '^RESET ROLE;' "$PACKAGE" \
  && ok "A8: the load itself runs under SET ROLE exlib_catalog_loader (preconditions/postconditions are owner-role reads only)" \
  || bad "A8: loader-role framing missing"

echo
echo "=== B. Disposable cluster + migrations 001-027 + representative tenant fixture"
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
expect_eq "B1b: the working role reproduces the hosted operator posture - postgres is LOGIN, NOSUPERUSER, CREATEDB, CREATEROLE (platform roles created by supabase_admin, as Supabase provisions them)" \
  "SELECT rolcanlogin::text||'/'||rolsuper::text||'/'||rolcreatedb::text||'/'||rolcreaterole::text FROM pg_roles WHERE rolname='postgres'" \
  "true/false/true/true"
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
expect_eq "B2b: HOSTED MEMBERSHIP SEMANTICS (dedicated check) - migration 027's CREATE ROLE, executed by the non-superuser postgres, natively yields the implicit creator membership ADMIN TRUE / INHERIT FALSE / SET FALSE on ALL FOUR catalog authorities, exactly one membership each - the exact posture reported from the failed hosted attempt" \
  "SELECT string_agg(r.rolname||'='||g.rolname||'>'||m.rolname||':'||am.admin_option::text||':'||am.inherit_option::text||':'||am.set_option::text, ' | ' ORDER BY r.rolname) || ' rows=' || count(*)::text FROM pg_auth_members am JOIN pg_roles r ON r.oid=am.roleid JOIN pg_roles m ON m.oid=am.member JOIN pg_roles g ON g.oid=am.grantor WHERE r.rolname LIKE 'exlib_catalog_%'" \
  "exlib_catalog_admin=supabase_admin>postgres:true:false:false | exlib_catalog_admission=supabase_admin>postgres:true:false:false | exlib_catalog_loader=supabase_admin>postgres:true:false:false | exlib_catalog_reviewer=supabase_admin>postgres:true:false:false rows=4"
expect_eq "B2d: DEDICATED baseline-grantor proof - the loader membership is EXACTLY the hosted row: grantor supabase_admin -> member postgres, ADMIN TRUE / INHERIT FALSE / SET FALSE, one row, grantor included" \
  "$BASELINE_SQL" "$BASELINE_OK"
expect_err "B2c: SET ROLE exlib_catalog_loader as postgres is CORRECTLY denied at baseline - the fixture reproduces the hosted 42501 semantics" \
  "SET ROLE exlib_catalog_loader;" \
  "permission denied to set role \"exlib_catalog_loader\""

echo
echo "=== AU. Dedicated grantor-mechanics proofs (instrumented; rolled back; package untouched)"
# One instrumented transaction AS postgres proves the exact two-row
# shape immediately after the temporary GRANT and that the
# grantor-scoped REVOKE removes ONLY the postgres-granted row - then
# rolls everything back.
AUOUT=$(psql -h "$SOCK" -U postgres -d "$DB" -X -qtA <<'AUSQL' 2>&1
BEGIN;
GRANT exlib_catalog_loader TO postgres WITH SET TRUE, INHERIT FALSE;
SELECT 'AFTER-GRANT=' || (SELECT count(*) FROM pg_auth_members am JOIN pg_roles r ON r.oid=am.roleid WHERE r.rolname='exlib_catalog_loader')::text || '[' || (SELECT string_agg(g.rolname||'>'||m.rolname||':'||am.admin_option::text||':'||am.inherit_option::text||':'||am.set_option::text, ' + ' ORDER BY g.rolname) FROM pg_auth_members am JOIN pg_roles r ON r.oid=am.roleid JOIN pg_roles m ON m.oid=am.member JOIN pg_roles g ON g.oid=am.grantor WHERE r.rolname='exlib_catalog_loader') || ']';
REVOKE exlib_catalog_loader FROM postgres GRANTED BY postgres;
SELECT 'AFTER-REVOKE=' || (SELECT count(*) FROM pg_auth_members am JOIN pg_roles r ON r.oid=am.roleid WHERE r.rolname='exlib_catalog_loader')::text || '[' || (SELECT string_agg(g.rolname||'>'||m.rolname||':'||am.admin_option::text||':'||am.inherit_option::text||':'||am.set_option::text, ' + ' ORDER BY g.rolname) FROM pg_auth_members am JOIN pg_roles r ON r.oid=am.roleid JOIN pg_roles m ON m.oid=am.member JOIN pg_roles g ON g.oid=am.grantor WHERE r.rolname='exlib_catalog_loader') || ']';
ROLLBACK;
AUSQL
)
printf '%s' "$AUOUT" | grep -qF 'AFTER-GRANT=2[postgres>postgres:false:false:true + supabase_admin>postgres:true:false:false]' \
  && ok "AU1: EXACT two-row shape immediately after the temporary GRANT - the supabase_admin baseline row untouched PLUS the postgres-granted SET row (distinct grantor-keyed rows)" \
  || bad "AU1: two-row shape wrong" "$AUOUT"
printf '%s' "$AUOUT" | grep -qF 'AFTER-REVOKE=1[supabase_admin>postgres:true:false:false]' \
  && ok "AU2: the grantor-scoped REVOKE ... GRANTED BY postgres removes ONLY the postgres-granted temporary row - the supabase_admin-granted baseline row is neither removed nor altered (mechanical grantor-separation proof)" \
  || bad "AU2: grantor-scoped revoke touched the wrong row(s)" "$AUOUT"
expect_eq "AU3: the instrumented probe rolled back completely - the baseline grantor row is exact again" \
  "$BASELINE_SQL" "$BASELINE_OK"
ZERO=$(Q "SELECT (SELECT count(*) FROM exercise_catalog_logical) + (SELECT count(*) FROM exercise_catalog)
  + (SELECT count(*) FROM exercise_catalog_content) + (SELECT count(*) FROM exercise_catalog_content_expected_relationships)
  + (SELECT count(*) FROM exercise_catalog_relationships) + (SELECT count(*) FROM exercise_catalog_import_runs)")
[ "$ZERO" = "0" ] && ok "B3: the database begins with ZERO catalog/content state" \
  || bad "B3: unexpected pre-load state ($ZERO rows)"
for u in 1 2 3 4; do
  UID_U=$(Q "INSERT INTO auth.users DEFAULT VALUES RETURNING id;")
  Q "INSERT INTO public.exercises (user_id, name, category, primary_muscle, equipment, exercise_type, tracking_mode, unilateral, is_system, is_active)
     SELECT '$UID_U', 'Fixture Exercise U$u N' || g, 'compound', 'lats', 'barbell', 'strength', 'weight_reps', false, true, true
     FROM generate_series(1, 20) g;" >/dev/null
  Q "INSERT INTO public.exercises (user_id, name, category, primary_muscle, equipment, exercise_type, tracking_mode, unilateral, is_system, is_active)
     VALUES ('$UID_U', 'Plank', 'isolation', 'abs', 'bodyweight', 'bodyweight', 'bodyweight', false, true, true);" >/dev/null
done
EX_BEFORE=$(Q "SELECT count(*) FROM exercises")
EX_DIGEST_BEFORE=$(Q "SELECT md5(string_agg(id::text||user_id::text||name||category||coalesce(tracking_mode,'-')||is_active::text, '|' ORDER BY id)) FROM exercises")
[ "$EX_BEFORE" = "84" ] && ok "B4: representative tenant fixture in place - exactly 84 exercises across four users, each with a seeded Plank" \
  || bad "B4: fixture wrong ($EX_BEFORE)"

echo
echo "=== C. Execute the prepared package EXACTLY ONCE"
psql -h "$SOCK" -U postgres -d postgres -X -v ON_ERROR_STOP=1 -q -f "$PACKAGE" > "$TMP/pkg.out" 2>&1 \
  && ok "C1: the package executed cleanly (one transaction, loader authority, all postconditions internally satisfied)" \
  || { bad "C1: package failed" "$(tail -3 "$TMP/pkg.out" | tr '\n' ' ')"; exit 1; }
expect_eq "C1b: AUTHORITY RESTORED after success - EXACTLY the original supabase_admin-granted baseline row remains (grantor included: supabase_admin -> postgres, ADMIN TRUE / INHERIT FALSE / SET FALSE); the temporary in-transaction elevation left nothing behind" \
  "$BASELINE_SQL" "$BASELINE_OK"
expect_err "C1c: SET ROLE exlib_catalog_loader as postgres is denied AGAIN after the successful load - no standing SET authority survives COMMIT" \
  "SET ROLE exlib_catalog_loader;" \
  "permission denied to set role \"exlib_catalog_loader\""
expect_eq "C2: exact resulting identities and snapshots - 3 logical identities, 1 active pending Plank snapshot, 2 anatomy rows, 2 aliases, 3 catalog claims (canonical plank + two alias claims), and ZERO target snapshots" \
  "SELECT (SELECT count(*) FROM exercise_catalog_logical)::text || '/' ||
     (SELECT count(*) FROM exercise_catalog)::text || '/' ||
     (SELECT count(*) FROM exercise_catalog_muscles)::text || '/' ||
     (SELECT count(*) FROM exercise_catalog_aliases)::text || '/' ||
     (SELECT count(*) FROM exercise_catalog_name_claims)::text || '/' ||
     (SELECT count(*) FROM exercise_catalog WHERE logical_id IN ('$DBU','$AW'))::text" \
  "3/1/2/2/3/0"
expect_eq "C2b: the three claims are EXACTLY the required rows - canonical 'plank' plus alias 'forearm plank' and alias 'front plank', every one owned by the Plank identity" \
  "SELECT string_agg(normalized_name||':'||claim_source||':'||logical_id::text, ' | ' ORDER BY normalized_name) FROM exercise_catalog_name_claims" \
  "forearm plank:alias:$PL | front plank:alias:$PL | plank:canonical:$PL"
expect_eq "C2c: migration-023's bidirectional claim invariant is clean after the load (0 orphaned claims, 0 unclaimed bearers)" \
  "SELECT orphaned_claims::text||'/'||unclaimed_bearers::text FROM exlib_verify_catalog_claims()" \
  "0/0"
expect_eq "C3: exactly ONE Plank content version exists - version 1, PENDING, DRAFT, UNADMITTED, with zero review evidence and zero admission fields" \
  "SELECT (SELECT count(*) FROM exercise_catalog_content)::text || '/' ||
     (SELECT content_status||':'||publication_status||':'||import_admitted::text||':'||content_version::text
      FROM exercise_catalog_content WHERE id='$CV') || '/' ||
     (SELECT (reviewed_by IS NULL AND reviewed_at IS NULL AND review_rationale IS NULL
              AND admitted_fingerprint IS NULL AND admitted_source_sha256 IS NULL AND admitted_at IS NULL)::text
      FROM exercise_catalog_content WHERE id='$CV')" \
  "1/pending:draft:false:1/true"
PYOUT=$(python3 - <<'PYEOF'
import json, subprocess, sys
rec = [json.loads(l) for l in open('docs/exlib2g-plank-content.jsonl') if l.strip() and not l.strip().startswith('#')][0]
def q(sql):
    r = subprocess.run(['psql','-h',__import__('os').environ['SOCK'],'-U','postgres','-d','postgres','-X','-qtA','-c',sql],capture_output=True,text=True)
    return r.stdout.rstrip('\n')
import os
bad = []
CV = 'e21b2c00-0000-4000-a000-000000000101'
pairs = [
  ('authored_by', "SELECT authored_by FROM exercise_catalog_content WHERE id='%s'" % CV, rec['authored_by']),
  ('authored_at', "SELECT authored_at::text FROM exercise_catalog_content WHERE id='%s'" % CV, rec['authored_at']),
  ('breathing_cue', "SELECT breathing_cue FROM exercise_catalog_content WHERE id='%s'" % CV, rec['breathing_cue']),
  ('safety_guidance', "SELECT safety_guidance FROM exercise_catalog_content WHERE id='%s'" % CV, rec['safety_guidance']),
  ('equipment_setup', "SELECT equipment_setup FROM exercise_catalog_content WHERE id='%s'" % CV, rec['equipment_setup']),
  ('accessibility_alternative', "SELECT accessibility_alternative FROM exercise_catalog_content WHERE id='%s'" % CV, rec['accessibility_alternative']),
]
for name, sql, want in pairs:
    got = q(sql)
    if got != want: bad.append(f'{name}: [{got[:60]}] != [{want[:60]}]')
for name in ('setup_steps','execution_steps','common_mistakes'):
    got = json.loads(q(f"SELECT {name}::text FROM exercise_catalog_content WHERE id='{CV}'"))
    if got != rec[name]: bad.append(f'{name} jsonb mismatch')
anat = q("SELECT string_agg(muscle||':'||role, ',' ORDER BY muscle) FROM exercise_catalog_muscles")
want_anat = ','.join(f"{m['muscle']}:{m['role']}" for m in sorted(rec['muscle_targets'], key=lambda x: x['muscle']))
if anat != want_anat: bad.append(f'anatomy: {anat} != {want_anat}')
ali = q("SELECT string_agg(alias, ',' ORDER BY alias) FROM exercise_catalog_aliases")
if ali != ','.join(sorted(rec['aliases'])): bad.append('aliases mismatch')
exp = q("SELECT string_agg(relation||'>'||to_logical_id::text, ',' ORDER BY relation) FROM exercise_catalog_content_expected_relationships")
want_exp = 'progression>e21b2c00-0000-4000-a000-000000000003,substitution>e21b2c00-0000-4000-a000-000000000002'
if exp != want_exp: bad.append(f'expected set: {exp}')
snap = q("SELECT canonical_name||'|'||category||'|'||primary_muscle||'|'||equipment||'|'||laterality||'|'||tracking_mode||'|'||provenance||'|'||movement_pattern||'|'||training_role||'|'||difficulty||'|'||availability FROM exercise_catalog")
want_snap = '|'.join([rec['proposed_canonical_name'],'isolation',rec['primary_muscle'],rec['equipment'],rec['laterality'],rec['tracking_mode'],rec['provenance'],rec['movement_pattern'],rec['training_role'],rec['difficulty'],rec['availability']])
if snap != want_snap: bad.append(f'snapshot fields: {snap}')
print('ARTIFACT-MATCH-OK' if not bad else 'MISMATCH: ' + '; '.join(bad[:3]))
PYEOF
)
case "$PYOUT" in ARTIFACT-MATCH-OK) ok "C4: EVERY loaded value equals the admitted artifact byte for byte - payload (all nine fields), authorship, anatomy pair, alias pair, snapshot classification (with the derived category 'isolation'), and the exact two-row expected relationship set";; *) bad "C4: artifact/database mismatch" "$PYOUT";; esac

echo
echo "=== D. The loaded version cannot advance without its separately gated authorities"
expect_err_admin "D1: it CANNOT be admitted before database review (admission-before-review refused by the promoted lifecycle) [role assumed via the harness's supabase_admin superuser PROBE authority - the non-superuser postgres cannot SET ROLE into any catalog authority at baseline]" \
  "SET ROLE exlib_catalog_admission; SELECT admit_catalog_content('$PL','$CV', repeat('a',64));" \
  "admission cannot precede human approval"
expect_err_admin "D2: it CANNOT be published (pending, unadmitted) [supabase_admin PROBE authority]" \
  "SET ROLE exlib_catalog_admin; SELECT publish_catalog_content('$PL','$CV');" \
  "only approved content can be published"
expect_eq "D3: NO live relationship projection exists before publication" \
  "SELECT count(*)::text FROM exercise_catalog_relationships" "0"
expect_eq "D4: no import run, run item, approval, seal, revocation, or delivery state exists" \
  "SELECT (SELECT count(*) FROM exercise_catalog_import_runs)::text || '/' ||
     (SELECT count(*) FROM exercise_catalog_run_items)::text || '/' ||
     (SELECT count(*) FROM exercise_catalog_import_runs WHERE approved_for_delivery OR sealed_at IS NOT NULL OR revoked_at IS NOT NULL)::text" \
  "0/0/0"
EX_AFTER=$(Q "SELECT count(*) FROM exercises")
EX_DIGEST_AFTER=$(Q "SELECT md5(string_agg(id::text||user_id::text||name||category||coalesce(tracking_mode,'-')||is_active::text, '|' ORDER BY id)) FROM exercises")
{ [ "$EX_AFTER" = "84" ] && [ "$EX_DIGEST_AFTER" = "$EX_DIGEST_BEFORE" ]; } \
  && ok "D5: exercises remains EXACTLY 84 and byte-identical - the load mutated no tenant exercise, seed, or delivery state" \
  || bad "D5: tenant exercises changed" "$EX_BEFORE->$EX_AFTER"
expect_err_admin "D6: ordinary clients cannot invoke the loader (the package's authority is real, not decorative) [client role assumed via supabase_admin PROBE authority]" \
  "SET ROLE authenticated; SELECT load_catalog_identity(NULL);" \
  "permission denied for function load_catalog_identity"

echo
echo "=== E. One-use behavior, honestly"
psql -h "$SOCK" -U postgres -d postgres -X -v ON_ERROR_STOP=1 -q -f "$PACKAGE" > "$TMP/pkg2.out" 2>&1 \
  && bad "E1: a SECOND execution succeeded - the one-use contract is false" \
  || ok "E1: a second execution fails closed at the empty-surface precondition (ONE-USE, exactly as documented)"
grep -q 'ONE-USE fresh-load package and refuses to run twice' "$TMP/pkg2.out" \
  && ok "E2: the second-execution refusal is the package's own documented precondition message" \
  || bad "E2: unexpected refusal path" "$(tail -2 "$TMP/pkg2.out" | tr '\n' ' ')"
expect_eq "E3: the failed second execution changed NOTHING (still exactly one content version, three identities, zero projections)" \
  "SELECT (SELECT count(*) FROM exercise_catalog_content)::text || '/' ||
     (SELECT count(*) FROM exercise_catalog_logical)::text || '/' ||
     (SELECT count(*) FROM exercise_catalog_relationships)::text" "1/3/0"
expect_eq "E3b: the failed second execution also left the authority baseline untouched (no elevation residue from the refused run)" \
  "$BASELINE_SQL" "$BASELINE_OK"

echo
echo "=== F. Whole-transaction rollback for malformed/incomplete variants (fresh scratch database each)"
mkvariant_db() { # $1 = dbname
  Q "CREATE DATABASE $1;" >/dev/null
  psql -h "$SOCK" -U postgres -d "$1" -X -v ON_ERROR_STOP=1 -q -c "CREATE SCHEMA auth; CREATE TABLE auth.users (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email TEXT); CREATE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql STABLE AS \$\$SELECT nullif(current_setting('app.uid', true), '')::uuid\$\$;" >/dev/null
  for f in supabase/migrations/0*.sql; do
    psql -h "$SOCK" -U postgres -d "$1" -X -v ON_ERROR_STOP=1 -q -f "$f" >/dev/null 2>&1 || { bad "variant db $1 migration failed: $f"; return 1; }
  done
}
run_variant() { # $1=db $2=name $3=sedexpr $4=expected-pattern
  local V="$TMP/variant-$1.sql"
  sed "$3" "$PACKAGE" > "$V"
  if cmp -s "$V" "$PACKAGE"; then bad "F($2): variant mutation did not change the package"; return; fi
  psql -h "$SOCK" -U postgres -d "$1" -X -v ON_ERROR_STOP=1 -q -f "$V" > "$TMP/variant-$1.out" 2>&1 \
    && { bad "F($2): malformed variant SUCCEEDED"; return; }
  grep -qF "$4" "$TMP/variant-$1.out" || { bad "F($2): failed for an unexpected reason" "$(tail -2 "$TMP/variant-$1.out" | tr '\n' ' ')"; return; }
  local Z; Z=$(psql -h "$SOCK" -U postgres -d "$1" -X -qtA -c "SELECT (SELECT count(*) FROM exercise_catalog_logical) + (SELECT count(*) FROM exercise_catalog) + (SELECT count(*) FROM exercise_catalog_content) + (SELECT count(*) FROM exercise_catalog_content_expected_relationships) + (SELECT count(*) FROM exercise_catalog_name_claims)")
  [ "$Z" = "0" ] && ok "F($2): the variant failed closed AND the WHOLE transaction rolled back - zero rows persisted" \
    || bad "F($2): partial state leaked ($Z rows)"
  local MB; MB=$(psql -h "$SOCK" -U postgres -d "$1" -X -qtA -c "$BASELINE_SQL")
  [ "$MB" = "$BASELINE_OK" ] && ok "F($2): the temporary authority elevation ALSO rolled back - loader membership is exactly the hosted baseline" \
    || bad "F($2): authority residue after rollback ($MB)"
}
echo
echo "=== F0. The PROMOTED package bytes reproduce the EXACT hosted refusal on the hosted-shape fixture"
mkvariant_db rp && {
  git show 56488527889858243b1fd701dc3944a8c0f4fc7b:docs/exlib2k-plank-catalog-load-package.sql > "$TMP/promoted-pkg.sql"
  RSHA=$(shasum -a 256 "$TMP/promoted-pkg.sql" | awk '{print $1}')
  RB=$(wc -c < "$TMP/promoted-pkg.sql" | tr -d ' ')
  [ "$RB/$RSHA" = "20116/78cff34a39239c62391f322138e7e4085191fb4f26fc0e87c17c6474915e21a7" ] \
    && ok "F0a: the promoted package bytes are fingerprint-verified from git (20,116 B / 78cff34a..., the exact revision ChatGPT attempted on hosted)" \
    || bad "F0a: promoted bytes drifted ($RB/$RSHA)"
  psql -h "$SOCK" -U postgres -d rp -X -v ON_ERROR_STOP=1 -q -f "$TMP/promoted-pkg.sql" > "$TMP/oldpkg.out" 2>&1 \
    && bad "F0b: the promoted package SUCCEEDED on the hosted-shape fixture (it must not)" \
    || { grep -qF 'permission denied to set role "exlib_catalog_loader"' "$TMP/oldpkg.out" \
         && ok "F0b: the promoted package fails with EXACTLY the hosted error - permission denied to set role \"exlib_catalog_loader\" (42501 at SET ROLE, before any loader call)" \
         || bad "F0b: failed for an unexpected reason" "$(tail -2 "$TMP/oldpkg.out" | tr '\n' ' ')"; }
  Z0=$(psql -h "$SOCK" -U postgres -d rp -X -qtA -c "SELECT (SELECT count(*) FROM exercise_catalog_logical)+(SELECT count(*) FROM exercise_catalog)+(SELECT count(*) FROM exercise_catalog_muscles)+(SELECT count(*) FROM exercise_catalog_aliases)+(SELECT count(*) FROM exercise_catalog_name_claims)+(SELECT count(*) FROM exercise_catalog_content)+(SELECT count(*) FROM exercise_catalog_content_expected_relationships)+(SELECT count(*) FROM exercise_catalog_relationships)+(SELECT count(*) FROM exercise_catalog_import_runs)+(SELECT count(*) FROM exercise_catalog_run_items)")
  [ "$Z0" = "0" ] && ok "F0c: all TEN catalog tables remain exactly zero rows after the reproduced failure - matching ChatGPT's hosted rollback proof" \
    || bad "F0c: rows leaked ($Z0)"
  MB0=$(psql -h "$SOCK" -U postgres -d rp -X -qtA -c "$BASELINE_SQL")
  [ "$MB0" = "$BASELINE_OK" ] && ok "F0d: the membership baseline is untouched by the reproduced failure" \
    || bad "F0d: membership changed ($MB0)"
}

mkvariant_db v1 && run_variant v1 "invalid expected relation type" \
  "s/\"relation\": \"substitution\"/\"relation\": \"sideways\"/" \
  "violates check constraint"
mkvariant_db v2 && run_variant v2 "self-referential expected target" \
  "s/e21b2c00-0000-4000-a000-000000000002\"}, /e21b2c00-0000-4000-a000-000000000001\"}, /" \
  "cannot expect a relationship to its own identity"
mkvariant_db v3 && run_variant v3 "missing loader call (content draft removed) trips the postconditions" \
  "/^SELECT load_catalog_content_draft(\$/,/^  \$expx\$.*::jsonb);\$/d" \
  "exlib2k post:"
mkvariant_db v4 && run_variant v4 "tampered payload (one word) trips the byte-equality postcondition" \
  "s/\\\$br\\\$Breathe steadily/\\\$br\\\$Breathe rapidly/" \
  "the authored payload does not match the admitted artifact exactly"
mkvariant_db v5 && {
  # foreign-state pre-seed via supabase_admin PROBE authority (the
  # non-superuser postgres correctly cannot SET ROLE at baseline)
  psql -h "$SOCK" -U supabase_admin -d v5 -X -qtA -c "SET ROLE exlib_catalog_loader; SELECT load_catalog_identity('99999999-9999-4999-a999-999999999999');" >/dev/null 2>&1
  psql -h "$SOCK" -U postgres -d v5 -X -v ON_ERROR_STOP=1 -q -f "$PACKAGE" > "$TMP/variant-v5.out" 2>&1 \
    && bad "F(nonempty surface): package ran over foreign state" \
    || { grep -qF "refuses to run twice or over foreign state" "$TMP/variant-v5.out" \
         && ok "F(nonempty surface): the untouched package refuses to run over ANY pre-existing catalog state (fresh-load precondition)" \
         || bad "F(nonempty surface): unexpected refusal" "$(tail -2 "$TMP/variant-v5.out" | tr '\n' ' ')"; }
}
mkvariant_db v6 && run_variant v6 "claim corruption (an owner DELETE of one claim row injected after RESET ROLE) trips the package's OWN three-claim postcondition" \
  "s/^RESET ROLE;\$/RESET ROLE; DELETE FROM public.exercise_catalog_name_claims WHERE normalized_name = 'front plank';/" \
  "the catalog name claims are not exactly the three required rows"
mkvariant_db v7 && run_variant v7 "restoration removed (the REVOKE ... GRANTED BY line deleted) trips the package's OWN authority-restoration postcondition" \
  "/^REVOKE exlib_catalog_loader FROM postgres GRANTED BY postgres;\$/d" \
  "the temporary loader elevation was not exactly restored"
mkvariant_db v8 && run_variant v8 "elevation removed (the GRANT line deleted) - the structural two-grantor check aborts BEFORE SET ROLE and before any loader call (loading only happens after the two-row proof)" \
  "/^GRANT exlib_catalog_loader TO postgres WITH SET TRUE, INHERIT FALSE;\$/d" \
  "the two-grantor membership shape after the temporary grant is not exact"

echo
echo "=== F2. REAL two-session concurrency - the lock-serialized gate admits exactly one execution"
# Both sessions run against the SAME fresh empty database. Session A
# is the package with ONLY a pg_sleep injected AFTER the empty-state
# gate passes (holding the window open deterministically while the
# SRE locks are held); session B is the UNTOUCHED package. The lock
# gate must let exactly one commit; the loser must wait on the table
# lock and then fail at the package's own nonempty precondition.
mkvariant_db cc
sed 's/^\$pre\$;$/\$pre\$; SELECT pg_sleep(6);/' "$PACKAGE" > "$TMP/cc-A.sql"
if cmp -s "$TMP/cc-A.sql" "$PACKAGE"; then
  bad "CC0: the session-A sleep injection did not change the package (cannot stage the race)"
else
  ok "CC0: session A staged - the untouched package plus ONLY a pg_sleep after the empty-state gate; session B is the byte-untouched package"
fi
( psql -h "$SOCK" -U postgres -d cc -X -v ON_ERROR_STOP=1 -q -f "$TMP/cc-A.sql" > "$TMP/cc-A.out" 2>&1; echo $? > "$TMP/cc-A.rc" ) &
A_JOB=$!
AHOLD=0
for _ in $(seq 1 100); do
  AHOLD=$(psql -h "$SOCK" -U postgres -d cc -X -qtA -c "SELECT count(*) FROM pg_locks l JOIN pg_class c ON c.oid = l.relation WHERE c.relname = 'exercise_catalog_logical' AND l.mode = 'ShareRowExclusiveLock' AND l.granted" 2>/dev/null || echo 0)
  [ "${AHOLD:-0}" -ge 1 ] && break; sleep 0.1
done
[ "${AHOLD:-0}" -ge 1 ] \
  && ok "CC1: session A holds a GRANTED ShareRowExclusiveLock on the gate tables (it passed the empty-state read and sits inside the load window)" \
  || bad "CC1: never observed session A holding the gate lock"
( psql -h "$SOCK" -U postgres -d cc -X -v ON_ERROR_STOP=1 -q -f "$PACKAGE" > "$TMP/cc-B.out" 2>&1; echo $? > "$TMP/cc-B.rc" ) &
B_JOB=$!
BWAIT=0
for _ in $(seq 1 100); do
  BWAIT=$(psql -h "$SOCK" -U postgres -d cc -X -qtA -c "SELECT count(*) FROM pg_locks l JOIN pg_class c ON c.oid = l.relation WHERE c.relname LIKE 'exercise_catalog%' AND l.mode = 'ShareRowExclusiveLock' AND NOT l.granted" 2>/dev/null || echo 0)
  [ "${BWAIT:-0}" -ge 1 ] && break; sleep 0.1
done
[ "${BWAIT:-0}" -ge 1 ] \
  && ok "CC2: session B is genuinely WAITING on the table lock (an ungranted ShareRowExclusiveLock request) - it cannot reach the empty-state read while A holds the gate" \
  || bad "CC2: never observed session B waiting on the gate lock"
wait "$A_JOB" 2>/dev/null
wait "$B_JOB" 2>/dev/null
ARC=$(cat "$TMP/cc-A.rc")
BRC=$(cat "$TMP/cc-B.rc")
if [ "$ARC" = "0" ] && [ "$BRC" != "0" ] && grep -qF 'ONE-USE fresh-load package and refuses to run twice or over foreign state' "$TMP/cc-B.out"; then
  ok "CC3: EXACTLY ONE execution succeeded - session A committed; session B unblocked only after A's COMMIT and then failed closed at the package's OWN nonempty one-use precondition"
else
  bad "CC3: race outcome wrong (A rc=$ARC, B rc=$BRC)" "$(tail -2 "$TMP/cc-B.out" | tr '\n' ' ')"
fi
CCSTATE=$(psql -h "$SOCK" -U postgres -d cc -X -qtA -c "SELECT (SELECT count(*) FROM exercise_catalog_logical)::text||'/'||(SELECT count(*) FROM exercise_catalog)::text||'/'||(SELECT count(*) FROM exercise_catalog_content)::text||'/'||(SELECT count(*) FROM exercise_catalog_name_claims)::text||'/'||(SELECT count(*) FROM exercise_catalog_content_expected_relationships)::text")
[ "$CCSTATE" = "3/1/1/3/2" ] \
  && ok "CC4: the final database holds EXACTLY ONE valid load result (3 identities / 1 snapshot / 1 content / 3 claims / 2 expected rows) - no duplicated, mixed, or partial state from the losing session" \
  || bad "CC4: final state wrong ($CCSTATE)"
CCMB=$(psql -h "$SOCK" -U postgres -d cc -X -qtA -c "$BASELINE_SQL")
[ "$CCMB" = "$BASELINE_OK" ] \
  && ok "CC5: after the race the authority baseline is exact - the winner restored its elevation, the loser never held one" \
  || bad "CC5: authority residue after race ($CCMB)"

echo
echo "=== F3. A pre-widened baseline is refused BEFORE any write or authority change (run last; membership is cluster-wide)"
mkvariant_db wd && {
  QA "GRANT exlib_catalog_loader TO postgres WITH SET TRUE;" >/dev/null
  WD0=$(Q "$BASELINE_SQL")
  [ "$WD0" = "1/supabase_admin>postgres:true:false:true" ] \
    && ok "F3a: the harness pre-widened the baseline via supabase_admin (SET TRUE now present) to simulate a non-baseline hosted posture" \
    || bad "F3a: unexpected widened shape ($WD0)"
  psql -h "$SOCK" -U postgres -d wd -X -v ON_ERROR_STOP=1 -q -f "$PACKAGE" > "$TMP/wd.out" 2>&1 \
    && bad "F3b: the package RAN over a non-baseline posture (it must refuse)" \
    || { grep -qF 'the loader-role membership posture is not the exact hosted baseline' "$TMP/wd.out" \
         && ok "F3b: the untouched package refuses the widened posture at its OWN posture gate, before any write or authority change" \
         || bad "F3b: refused for an unexpected reason" "$(tail -2 "$TMP/wd.out" | tr '\n' ' ')"; }
  WZ=$(psql -h "$SOCK" -U postgres -d wd -X -qtA -c "SELECT (SELECT count(*) FROM exercise_catalog_logical)+(SELECT count(*) FROM exercise_catalog)+(SELECT count(*) FROM exercise_catalog_content)+(SELECT count(*) FROM exercise_catalog_name_claims)")
  WD1=$(Q "$BASELINE_SQL")
  { [ "$WZ" = "0" ] && [ "$WD1" = "1/supabase_admin>postgres:true:false:true" ]; } \
    && ok "F3c: the refusal wrote nothing and did NOT touch the pre-existing (widened) membership - the package never modifies a posture it did not verify" \
    || bad "F3c: refusal side effects (rows=$WZ, membership=$WD1)"
  QA "REVOKE SET OPTION FOR exlib_catalog_loader FROM postgres;" >/dev/null
  WD2=$(Q "$BASELINE_SQL")
  [ "$WD2" = "$BASELINE_OK" ] \
    && ok "F3d: the harness restored the exact baseline via supabase_admin (cluster-wide membership back to ADMIN TRUE / INHERIT FALSE / SET FALSE)" \
    || bad "F3d: baseline not restored ($WD2)"
}

echo
echo "=== F4. GRANTOR BINDING: a wrong-grantor baseline is refused, and PostgreSQL itself forbids every postgres-granted baseline"
mkvariant_db wg && {
  # The grantor clause has to be proven ISOLATED - a posture satisfying
  # every OTHER baseline condition (exactly one row, member postgres,
  # ADMIN TRUE / INHERIT FALSE / SET FALSE) and differing ONLY in the
  # grantor. PostgreSQL cannot build that through GRANT at all (F4e-F4g
  # prove why: a non-bootstrap grantor must derive ADMIN from its own
  # membership row on the same role, so any legitimately granted
  # wrong-grantor row implies a SECOND row, which the exactly-one-row
  # clause would reject on its own and leave the grantor clause
  # unproven). So the harness rewrites the shared catalog's grantor
  # column DIRECTLY under the disclosed bootstrap-superuser PROBE
  # authority. This is disposable-fixture surgery: no product code
  # path, no package statement, and nothing hosted ever does it.
  QA "CREATE ROLE exlib_alt_admin NOLOGIN NOSUPERUSER;" >/dev/null
  QA "UPDATE pg_catalog.pg_auth_members SET grantor = (SELECT oid FROM pg_roles WHERE rolname='exlib_alt_admin') WHERE roleid = (SELECT oid FROM pg_roles WHERE rolname='exlib_catalog_loader') AND member = (SELECT oid FROM pg_roles WHERE rolname='postgres')" >/dev/null
  WG0=$(Q "$BASELINE_SQL")
  [ "$WG0" = "1/exlib_alt_admin>postgres:true:false:false" ] \
    && ok "F4a: the harness constructed a GRANTOR-ISOLATED counterfactual baseline - exactly one row, member postgres, ADMIN TRUE / INHERIT FALSE / SET FALSE, and ONLY the grantor differs (exlib_alt_admin instead of supabase_admin)" \
    || bad "F4a: unexpected surgical shape ($WG0)"
  psql -h "$SOCK" -U postgres -d wg -X -v ON_ERROR_STOP=1 -q -f "$PACKAGE" > "$TMP/wg.out" 2>&1 \
    && bad "F4b: the package RAN over a wrong-grantor baseline (it must refuse)" \
    || { grep -qF 'granted BY supabase_admin with ADMIN TRUE, INHERIT FALSE, SET FALSE - grantor included' "$TMP/wg.out" \
         && ok "F4b: the package refuses a baseline whose ONLY defect is the grantor - the grantor clause is load-bearing, and the refusal lands at its own posture gate before any write or authority change" \
         || bad "F4b: refused for an unexpected reason" "$(tail -2 "$TMP/wg.out" | tr '\n' ' ')"; }
  WGZ=$(psql -h "$SOCK" -U postgres -d wg -X -qtA -c "SELECT (SELECT count(*) FROM exercise_catalog_logical)+(SELECT count(*) FROM exercise_catalog)+(SELECT count(*) FROM exercise_catalog_content)+(SELECT count(*) FROM exercise_catalog_name_claims)")
  WG1=$(Q "$BASELINE_SQL")
  { [ "$WGZ" = "0" ] && [ "$WG1" = "1/exlib_alt_admin>postgres:true:false:false" ]; } \
    && ok "F4c: the refusal wrote ZERO catalog rows and did not touch the (wrong-grantor) pre-existing membership" \
    || bad "F4c: refusal side effects (rows=$WGZ, membership=$WG1)"
  QA "UPDATE pg_catalog.pg_auth_members SET grantor = (SELECT oid FROM pg_roles WHERE rolname='supabase_admin') WHERE roleid = (SELECT oid FROM pg_roles WHERE rolname='exlib_catalog_loader') AND member = (SELECT oid FROM pg_roles WHERE rolname='postgres')" >/dev/null
  QA "DROP ROLE exlib_alt_admin;" >/dev/null
  WG2=$(Q "$BASELINE_SQL")
  [ "$WG2" = "$BASELINE_OK" ] \
    && ok "F4d: the harness restored the exact supabase_admin-granted baseline row (no fixture residue)" \
    || bad "F4d: baseline not restored ($WG2)"
  # F4e-F4g: PostgreSQL's OWN refusals, which is why a postgres-granted
  # BASELINE row cannot exist at all and why the temporary row can never
  # outlive the row it depends on.
  QA "REVOKE exlib_catalog_loader FROM postgres GRANTED BY supabase_admin;" >/dev/null
  E1=$(QQ "GRANT exlib_catalog_loader TO postgres WITH ADMIN TRUE, INHERIT FALSE, SET FALSE;")
  E2=$(QQA "GRANT exlib_catalog_loader TO postgres WITH ADMIN TRUE, INHERIT FALSE, SET FALSE GRANTED BY postgres;")
  ER=$(QA "$MEMROWS_SQL")
  { printf '%s' "$E1" | grep -qF 'permission denied to grant role "exlib_catalog_loader"' \
    && printf '%s' "$E2" | grep -qF 'permission denied to grant privileges as role "postgres"' \
    && [ "$ER" = "0" ]; } \
    && ok "F4e: with no baseline row present, a postgres-granted membership CANNOT be created - postgres holds no ADMIN option to grant with, and even a bootstrap superuser's GRANTED BY postgres is refused (the grantor must itself hold ADMIN), so the loader membership stays at zero rows" \
    || bad "F4e: postgres-granted row was constructible or errors differ (rows=$ER)" "$(printf '%s | %s' "$(printf '%s' "$E1" | head -1)" "$(printf '%s' "$E2" | head -1)")"
  QA "GRANT exlib_catalog_loader TO postgres WITH ADMIN TRUE, INHERIT FALSE, SET FALSE;" >/dev/null
  Q "GRANT exlib_catalog_loader TO postgres WITH SET TRUE, INHERIT FALSE;" >/dev/null
  E3=$(QQA "REVOKE exlib_catalog_loader FROM postgres GRANTED BY supabase_admin;")
  E3S=$(QA "$MEMSET_SQL")
  { printf '%s' "$E3" | grep -qF 'dependent privileges exist' \
    && [ "$E3S" = "postgres>postgres:false:false:true + supabase_admin>postgres:true:false:false" ]; } \
    && ok "F4f: while the temporary postgres-granted row exists, PostgreSQL REFUSES to remove the supabase_admin-granted baseline row it depends on ('dependent privileges exist') - the temporary row can never outlive its baseline, and no grantor-scoped revoke can silently strand it" \
    || bad "F4f: dependency refusal missing (membership=$E3S)" "$(printf '%s' "$E3" | head -2 | tr '\n' ' ')"
  Q "REVOKE exlib_catalog_loader FROM postgres GRANTED BY postgres;" >/dev/null
  E4=$(QQ "GRANT exlib_catalog_loader TO postgres WITH ADMIN TRUE, INHERIT FALSE, SET FALSE;")
  E4S=$(Q "$BASELINE_SQL")
  { printf '%s' "$E4" | grep -qF 'ADMIN option cannot be granted back to your own grantor' \
    && [ "$E4S" = "$BASELINE_OK" ]; } \
    && ok "F4g: postgres cannot even recreate the baseline row under its own grantor ('ADMIN option cannot be granted back to your own grantor'), and the exact baseline row survives every attempt above" \
    || bad "F4g: self-grantor ADMIN refusal missing (membership=$E4S)" "$(printf '%s' "$E4" | head -1)"
  Q "CREATE ROLE exlib_grantor_probe NOLOGIN;" >/dev/null
  E5=$(QA "SELECT g.rolname||'>'||m.rolname||':'||am.admin_option::text||':'||am.inherit_option::text||':'||am.set_option::text FROM pg_auth_members am JOIN pg_roles r ON r.oid=am.roleid JOIN pg_roles m ON m.oid=am.member JOIN pg_roles g ON g.oid=am.grantor WHERE r.rolname='exlib_grantor_probe'")
  Q "DROP ROLE exlib_grantor_probe;" >/dev/null
  E5R=$(QA "SELECT count(*)::text FROM pg_roles WHERE rolname='exlib_grantor_probe'")
  { [ "$E5" = "supabase_admin>postgres:true:false:false" ] && [ "$E5R" = "0" ]; } \
    && ok "F4h: a role created by the NON-SUPERUSER postgres records its implicit creator membership with the BOOTSTRAP superuser as grantor, not the creator - which is exactly why the hosted row reads grantor supabase_admin, and why the fixture reproduces that identity by name" \
    || bad "F4h: creator-membership grantor origin unexpected ($E5, residue=$E5R)"
}

echo
echo "=== F5. A DIFFERENT session_user that switched current_user to postgres is refused before elevation and writes"
mkvariant_db si && {
  QA "CREATE ROLE exlib_intruder LOGIN; GRANT postgres TO exlib_intruder WITH SET TRUE, INHERIT FALSE;" >/dev/null
  psql -h "$SOCK" -U exlib_intruder -d si -X -v ON_ERROR_STOP=1 -q -c "SET ROLE postgres;" -f "$PACKAGE" > "$TMP/si.out" 2>&1 \
    && bad "F5a: the package RAN for a non-postgres session_user (it must refuse)" \
    || { grep -qF 'BOTH execution identities must be the hosted operator role postgres' "$TMP/si.out" \
         && grep -qF 'session_user=exlib_intruder' "$TMP/si.out" \
         && ok "F5a: the package refuses when session_user=exlib_intruder has switched current_user to postgres - rejection at the identity gate, BEFORE elevation and writes" \
         || bad "F5a: refused for an unexpected reason" "$(tail -2 "$TMP/si.out" | tr '\n' ' ')"; }
  SIZ=$(psql -h "$SOCK" -U postgres -d si -X -qtA -c "SELECT (SELECT count(*) FROM exercise_catalog_logical)+(SELECT count(*) FROM exercise_catalog)+(SELECT count(*) FROM exercise_catalog_content)+(SELECT count(*) FROM exercise_catalog_name_claims)")
  SI1=$(Q "$BASELINE_SQL")
  { [ "$SIZ" = "0" ] && [ "$SI1" = "$BASELINE_OK" ]; } \
    && ok "F5b: the identity refusal wrote ZERO catalog rows and left the authority baseline exact" \
    || bad "F5b: refusal side effects (rows=$SIZ, membership=$SI1)"
  QA "REVOKE postgres FROM exlib_intruder; DROP ROLE exlib_intruder;" >/dev/null
  QA "SELECT count(*) FROM pg_roles WHERE rolname='exlib_intruder'" | grep -qx 0 \
    && ok "F5c: the harness intruder role is fully removed (no fixture residue)" \
    || bad "F5c: intruder role residue"
}

echo
echo "=== G. No hosted contact, ever"
HOSTPAT='supabase[.](co|com)|vercel[.](app|com)|[-][-]db[-]url|[-][-]linked|project[-]ref|db[ ](push|dump)'
if grep -qiE "$HOSTPAT" "$0"; then
  bad "G1: this script references a hosted endpoint, a project reference flag, or a Supabase CLI remote command"
else
  ok "G1: this script contains NO hosted endpoint, NO project reference flag, and NO Supabase CLI push/dump/remote-URL command"
fi
BADPSQL=$(grep -E 'psql[[:space:]]' "$0" | grep -cv -- '-h "\$SOCK"' || true)
[ "$BADPSQL" = "0" ] \
  && ok "G2: every psql/database invocation targets ONLY the disposable unix socket" \
  || bad "G2: found $BADPSQL database invocation(s) not aimed at the disposable socket"
ok "G3: the disposable cluster and every scratch database are destroyed on exit (trap cleanup); no persistent local database is left behind"

echo
printf '%s passed, %s failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ] || exit 1
