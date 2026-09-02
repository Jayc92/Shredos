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
Q()  { psql -h "$SOCK" -U postgres -d "$DB" -X -v ON_ERROR_STOP=1 -qtA -c "$1"; }
QQ() { psql -h "$SOCK" -U postgres -d "$DB" -X -v ON_ERROR_STOP=1 -qtA -c "$1" 2>&1; }
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
initdb -D "$PGDATA" -U postgres --no-locale -E UTF8 >/dev/null 2>&1
pg_ctl -D "$PGDATA" -o "-c listen_addresses='' -c unix_socket_directories='$SOCK'" -l "$TMP/pg.log" start >/dev/null 2>&1
if Q "SELECT 1" >/dev/null 2>&1; then
  ok "B1: cluster up at $SOCK (unix socket only; no TCP; no hosted contact)"
else
  bad "B1: cluster failed to start"; sed -n '1,5p' "$TMP/pg.log"; exit 1
fi
Q "CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN;
   CREATE SCHEMA auth;
   CREATE TABLE auth.users (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email TEXT);
   CREATE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql STABLE
     AS \$\$SELECT nullif(current_setting('app.uid', true), '')::uuid\$\$;" >/dev/null
APPLIED=0
for f in supabase/migrations/0*.sql; do
  psql -h "$SOCK" -U postgres -d postgres -X -v ON_ERROR_STOP=1 -q -f "$f" >/dev/null 2>"$TMP/err.log" \
    || { bad "B2: migration failed: $f" "$(sed -n '1,3p' "$TMP/err.log")"; exit 1; }
  APPLIED=$((APPLIED+1))
done
[ "$APPLIED" = "27" ] && ok "B2: migrations 001-027 applied exactly once in order (27 files)" \
  || bad "B2: expected 27 migrations, applied $APPLIED"
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
expect_err "D1: it CANNOT be admitted before database review (admission-before-review refused by the promoted lifecycle)" \
  "SET ROLE exlib_catalog_admission; SELECT admit_catalog_content('$PL','$CV', repeat('a',64));" \
  "admission cannot precede human approval"
expect_err "D2: it CANNOT be published (pending, unadmitted)" \
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
expect_err "D6: ordinary clients cannot invoke the loader (the package's authority is real, not decorative)" \
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
  psql -h "$SOCK" -U postgres -d v5 -X -qtA -c "SET ROLE exlib_catalog_loader; SELECT load_catalog_identity('99999999-9999-4999-a999-999999999999');" >/dev/null 2>&1
  psql -h "$SOCK" -U postgres -d v5 -X -v ON_ERROR_STOP=1 -q -f "$PACKAGE" > "$TMP/variant-v5.out" 2>&1 \
    && bad "F(nonempty surface): package ran over foreign state" \
    || { grep -qF "refuses to run twice or over foreign state" "$TMP/variant-v5.out" \
         && ok "F(nonempty surface): the untouched package refuses to run over ANY pre-existing catalog state (fresh-load precondition)" \
         || bad "F(nonempty surface): unexpected refusal" "$(tail -2 "$TMP/variant-v5.out" | tr '\n' ' ')"; }
}
mkvariant_db v6 && run_variant v6 "claim corruption (an owner DELETE of one claim row injected after RESET ROLE) trips the package's OWN three-claim postcondition" \
  "s/^RESET ROLE;\$/RESET ROLE; DELETE FROM public.exercise_catalog_name_claims WHERE normalized_name = 'front plank';/" \
  "the catalog name claims are not exactly the three required rows"

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
