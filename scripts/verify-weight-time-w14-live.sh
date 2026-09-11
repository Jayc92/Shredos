#!/bin/bash
# ============================================================
# ForgeFitOS - weight_time W14 five-entry catalog admission LIVE proof.
#
# Applies migrations 001-028 FROM supabase/migrations exactly once to a
# DISPOSABLE LOCAL PostgreSQL cluster (unix-socket only, no TCP, torn
# down on exit), builds a NON-EMPTY baseline that mirrors the hosted
# shape - a representative tenant fixture of 84 exercises across four
# users PLUS the already-committed EXLIB-2K catalog load, so the
# catalog, content and tenant surfaces all start non-empty - then
# executes the PREPARED W14 package exactly once and proves the exact
# resulting state BY DATABASE READBACK against the machine manifest.
#
# It then proves the fail-closed properties: the superseded same-source-
# URL binding is refused by the committed unique index leaving zero
# partial state; malformed, substituted and additive variants each roll
# back whole; a sabotaged FINAL postcondition rolls back whole; a second
# execution is refused rather than silently succeeding; and no tenant
# delivery, content, review, admission or publication act occurs.
#
# Every variant under test is GENERATED THROUGH THE REAL DERIVATION
# PATH (scripts/generate-weight-time-w14-package.ts with W14_VARIANT),
# not by editing generated SQL with sed. A control therefore exercises
# the same code that produces the governed package, and a control that
# stopped being a control - because the generator changed - shows up as
# a control that no longer fails.
#
# This script NEVER contacts Supabase, Vercel, or any remote service.
# It NEVER invokes the Supabase CLI. The W14 package remains PREPARED -
# NOT EXECUTED against any hosted or persistent database: the only
# execution it receives is on the disposable cluster created and
# destroyed here.
#
# HOSTED-SHAPE FIXTURE: the cluster boots with a bootstrap superuser
# named supabase_admin used ONLY as platform substrate and harness
# probe authority; the working role is a recreated NON-SUPERUSER
# postgres (LOGIN, CREATEDB, CREATEROLE) - the hosted operator posture.
# Migrations apply AS postgres, so migration 027's CREATE ROLE
# statements natively produce the implicit creator memberships ADMIN
# TRUE / INHERIT FALSE / SET FALSE that hosted actually has.
#
# Run from the repository root:
#   bash scripts/verify-weight-time-w14-live.sh
# ============================================================
set -uo pipefail
export LC_ALL=C LANG=C

PACKAGE="docs/weight-time-w14-catalog-admission.sql"
MANIFEST="docs/weight-time-w14-admission-manifest.json"
DECISIONS="docs/weight-time-w14-catalog-field-decisions.md"
GENERATOR="scripts/generate-weight-time-w14-package.ts"
PKG2K="docs/exlib2k-plank-catalog-load-package.sql"

# Migration 028 is the structural prerequisite for every weight_time
# load. Pinned by exact identity so a later migration cannot be
# silently absorbed: 029+ fails this gate loudly.
M028='supabase/migrations/028_weight_time_tracking_mode.sql'
M028_SHA='9b7d3a52dc0b75f129745bec51a4c972aa284bb5cb0d6159e0cbbb981e463fb3'
M028_BYTES=37162

# The five predeclared logical identities (decision document section 7).
U132='e21b2c00-0000-4000-a000-000000000004'
U133='e21b2c00-0000-4000-a000-000000000005'
U137='e21b2c00-0000-4000-a000-000000000006'
U138='e21b2c00-0000-4000-a000-000000000007'
U139='e21b2c00-0000-4000-a000-000000000008'
FIVE="'$U132','$U133','$U137','$U138','$U139'"

PASS=0
FAIL=0
ok()  { PASS=$((PASS+1)); printf '  PASS  %s\n' "$1"; }
bad() { FAIL=$((FAIL+1)); printf '  FAIL  %s\n' "$1"; [ -n "${2:-}" ] && printf '        %s\n' "$2"; return 0; }

TMP="$(mktemp -d /tmp/w14-live-pg.XXXXXX)"
PGDATA="$TMP/pgdata"
SOCK="$TMP"
cleanup() {
  pg_ctl -D "$PGDATA" stop -m immediate >/dev/null 2>&1 || true
  rm -rf "$TMP"
}
trap cleanup EXIT

DB=postgres
# Q/QQ run as the NON-SUPERUSER working role postgres (the hosted
# operator posture). QA/QQA run as the bootstrap superuser
# supabase_admin - platform substrate and harness PROBE authority only,
# never product authority. QT runs against template1, so cloning the
# scratch databases never holds a connection to the template.
Q()   { psql -h "$SOCK" -U postgres -d "$DB" -X -v ON_ERROR_STOP=1 -qtA -c "$1"; }
QQ()  { psql -h "$SOCK" -U postgres -d "$DB" -X -v ON_ERROR_STOP=1 -qtA -c "$1" 2>&1; }
QD()  { psql -h "$SOCK" -U postgres -d "$1" -X -v ON_ERROR_STOP=1 -qtA -c "$2"; }
QA()  { psql -h "$SOCK" -U supabase_admin -d "$DB" -X -v ON_ERROR_STOP=1 -qtA -c "$1"; }
QT()  { psql -h "$SOCK" -U postgres -d template1 -X -v ON_ERROR_STOP=1 -qtA -c "$1"; }
expect_eq() { # NAME SQL EXPECTED
  local got; got=$(QQ "$2")
  if [ "$got" = "$3" ]; then ok "$1"; else bad "$1" "expected [$3], got [$got]"; fi
}

BASELINE_SQL="SELECT (SELECT count(*) FROM pg_auth_members am JOIN pg_roles r ON r.oid=am.roleid WHERE r.rolname='exlib_catalog_loader')::text || '/' || (SELECT g.rolname||'>'||m.rolname||':'||am.admin_option::text||':'||am.inherit_option::text||':'||am.set_option::text FROM pg_auth_members am JOIN pg_roles r ON r.oid=am.roleid JOIN pg_roles m ON m.oid=am.member JOIN pg_roles g ON g.oid=am.grantor WHERE r.rolname='exlib_catalog_loader' AND m.rolname='postgres')"
BASELINE_OK="1/supabase_admin>postgres:true:false:false"

# The HARNESS's own surface digest, deliberately written as a DIFFERENT
# expression from the package's internal one: an independent oracle, not
# a restatement of the thing under test.
SURFACE_SQL="SELECT md5(
   coalesce((SELECT string_agg(s::text,'|' ORDER BY s.id) FROM public.exercise_catalog s WHERE s.logical_id NOT IN ($FIVE)),'-')
|| coalesce((SELECT string_agg(l::text,'|' ORDER BY l.id) FROM public.exercise_catalog_logical l WHERE l.id NOT IN ($FIVE)),'-')
|| coalesce((SELECT string_agg(m.catalog_id::text||m.muscle||m.role,'|' ORDER BY m.catalog_id,m.muscle,m.role) FROM public.exercise_catalog_muscles m JOIN public.exercise_catalog s2 ON s2.id=m.catalog_id WHERE s2.logical_id NOT IN ($FIVE)),'-')
|| coalesce((SELECT string_agg(n::text,'|' ORDER BY n.normalized_name) FROM public.exercise_catalog_name_claims n WHERE n.logical_id NOT IN ($FIVE)),'-')
|| coalesce((SELECT string_agg(a::text,'|' ORDER BY a.logical_id,a.alias) FROM public.exercise_catalog_aliases a WHERE a.logical_id NOT IN ($FIVE)),'-'))"
CONTENT_SQL="SELECT md5(
   coalesce((SELECT string_agg(c::text,'|' ORDER BY c.id) FROM public.exercise_catalog_content c),'-')
|| coalesce((SELECT string_agg(x::text,'|' ORDER BY x.content_id,x.relation,x.to_logical_id) FROM public.exercise_catalog_content_expected_relationships x),'-')
|| coalesce((SELECT string_agg(v::text,'|' ORDER BY v.id) FROM public.exercise_catalog_review_events v),'-'))"
TENANT_SQL="SELECT md5(
   coalesce((SELECT string_agg(t.id::text||t.user_id::text||t.name||coalesce(t.tracking_mode,'-')||coalesce(t.catalog_logical_id::text,'-')||coalesce(t.catalog_id::text,'-')||t.is_active::text,'|' ORDER BY t.id) FROM public.exercises t),'-')
|| coalesce((SELECT string_agg(a.id::text||a.alias||coalesce(a.catalog_alias_id::text,'-'),'|' ORDER BY a.id) FROM public.exercise_aliases a),'-'))"
# The five-target residue probe: any control that leaves ANY W14 state
# behind fails this, whatever else it did.
# Claims are counted by LOGICAL IDENTITY, never by a guessed normalized
# name: the harness must not encode its own theory of migration 023's
# name normalization, or it would silently stop counting.
RESIDUE_SQL="SELECT (SELECT count(*) FROM public.exercise_catalog_logical WHERE id IN ($FIVE))::text||'/'||(SELECT count(*) FROM public.exercise_catalog WHERE logical_id IN ($FIVE))::text||'/'||(SELECT count(*) FROM public.exercise_catalog_name_claims WHERE logical_id IN ($FIVE))::text||'/'||(SELECT count(*) FROM public.exercise_catalog_muscles m JOIN public.exercise_catalog s ON s.id=m.catalog_id WHERE s.logical_id IN ($FIVE))::text"
COUNTS_SQL="SELECT (SELECT count(*) FROM public.exercise_catalog_logical)::text||'/'||(SELECT count(*) FROM public.exercise_catalog)::text||'/'||(SELECT count(*) FROM public.exercise_catalog_muscles)::text||'/'||(SELECT count(*) FROM public.exercise_catalog_aliases)::text||'/'||(SELECT count(*) FROM public.exercise_catalog_name_claims)::text||'/'||(SELECT count(*) FROM public.exercise_catalog_content)::text||'/'||(SELECT count(*) FROM public.exercises)::text||'/'||(SELECT count(*) FROM public.exercise_aliases)::text"

echo
echo "=== A. Artifact identity, bindings, and static package shape"
[ -f "$PACKAGE" ] || { bad "A1: the prepared W14 package is missing at $PACKAGE"; exit 1; }
[ -f "$MANIFEST" ] || { bad "A1: the W14 admission manifest is missing at $MANIFEST"; exit 1; }
ok "A1: the prepared package and machine manifest both exist under docs/ (not supabase/migrations/)"
PBYTES=$(wc -c < "$PACKAGE" | tr -d ' ')
PSHA=$(shasum -a 256 "$PACKAGE" | awk '{print $1}')
MBYTES=$(wc -c < "$MANIFEST" | tr -d ' ')
MSHA=$(shasum -a 256 "$MANIFEST" | awk '{print $1}')
ok "A2: package under test: $PBYTES bytes, sha256 $PSHA"
ok "A2b: manifest under test: $MBYTES bytes, sha256 $MSHA"

# P10 - migration 028 byte-identical, and no 029 has appeared.
N028=$(ls supabase/migrations/ | grep -c '^028' || true)
N029=$(ls supabase/migrations/ | grep -c '^029' || true)
B028=$(wc -c < "$M028" | tr -d ' ')
S028=$(shasum -a 256 "$M028" | awk '{print $1}')
[ "$N028/$N029/$B028/$S028" = "1/0/$M028_BYTES/$M028_SHA" ] \
  && ok "P10: migration 028 is byte-identical at its pinned identity ($M028_BYTES B / ${M028_SHA:0:8}...) and NO migration 029 exists - this work adds no numbered migration and modifies none" \
  || bad "P10: the 028 pin failed ($N028/$N029/$B028/$S028)"

# ── Static reading is done with awk and with grep -F, NEVER with a bare
# BRE. On this machine `grep` resolves to ugrep, which treats a `$` in
# mid-pattern as an anchor, so a pattern like `-h "$SOCK"` silently
# matches NOTHING and a -v filter silently passes EVERYTHING. A gate
# whose verdict depends on which grep is on PATH is not a gate. awk's
# ERE and index() behave identically everywhere, and hasF()/countF()
# below force fixed-string matching.
hasF()   { grep -qF -- "$1" "$2"; }
countF() { grep -cF -- "$1" "$2" || true; }

# Authority surface, counted by awk so the numbers are tool-independent.
SHAPE=$(awk '
  /^SELECT public\.load_catalog_identity\(/          {id++}
  /^SELECT public\.load_catalog_snapshot\($/         {snap++}
  /^[[:space:]]*(SELECT|PERFORM|CALL)[^-]*(apply_content_review|admit_catalog_content|publish_catalog_content|load_catalog_content_draft|deliver_catalog_exercises|rollback_catalog_delivery|exlib_approve_and_seal_run|exlib_revoke_run_delivery|exlib_content_admission_manifest)/ {other++}
  /^[[:space:]]*(INSERT INTO|UPDATE|DELETE FROM)[[:space:]]+(public\.)?exercise/ {dml++}
  /^BEGIN;$/ {b++} /^COMMIT;$/ {c++} /^[Rr][Oo][Ll][Ll][Bb][Aa][Cc][Kk]/ {rb++}
  /^SET ROLE exlib_catalog_loader;$/ {sr++} /^RESET ROLE;$/ {rr++}
  /^REVOKE exlib_catalog_loader FROM postgres GRANTED BY postgres;$/ {rv++}
  END {printf "%d/%d/%d/%d/%d/%d/%d/%d/%d/%d", id,snap,other,dml,b,c,rb,sr,rr,rv}' "$PACKAGE")
[ "$SHAPE" = "5/5/0/0/1/1/0/1/1/1" ] \
  && ok "A3: package shape is exact - five load_catalog_identity calls, five load_catalog_snapshot calls, ZERO review / admission / publication / content-draft / run-seal / DELIVERY authority calls, ZERO direct DML against any exercise* table (every write goes through the migration-027 loader boundary), one BEGIN, one COMMIT, no in-file ROLLBACK, and exactly one SET ROLE / RESET ROLE / grantor-scoped REVOKE triple" \
  || bad "A3: package shape wrong" "id/snap/otherauth/dml/BEGIN/COMMIT/ROLLBACK/SETROLE/RESETROLE/REVOKE = $SHAPE, expected 5/5/0/0/1/1/0/1/1/1"
# A synthetic positive control: the same awk program must actually FIRE on
# a hand-built line of each forbidden class. Without this, "0 forbidden
# statements" is indistinguishable from "the detector never matches".
SYNTH=$(printf '%s\n' \
  'SELECT deliver_catalog_exercises(1);' \
  'INSERT INTO public.exercise_catalog (id) VALUES (1);' \
  'ROLLBACK;' \
  | awk '
  /^[[:space:]]*(SELECT|PERFORM|CALL)[^-]*(apply_content_review|admit_catalog_content|publish_catalog_content|load_catalog_content_draft|deliver_catalog_exercises|rollback_catalog_delivery|exlib_approve_and_seal_run|exlib_revoke_run_delivery|exlib_content_admission_manifest)/ {other++}
  /^[[:space:]]*(INSERT INTO|UPDATE|DELETE FROM)[[:space:]]+(public\.)?exercise/ {dml++}
  /^[Rr][Oo][Ll][Ll][Bb][Aa][Cc][Kk]/ {rb++}
  END {printf "%d/%d/%d", other,dml,rb}')
[ "$SYNTH" = "1/1/1" ] \
  && ok "A3b: POSITIVE CONTROL - the same detector fires on a synthetic delivery call, a synthetic direct INSERT, and a synthetic ROLLBACK, so A3's zeros mean absence rather than a dead pattern" \
  || bad "A3b: the forbidden-statement detector does NOT fire on synthetic positives ($SYNTH, expected 1/1/1) - A3's zeros are meaningless"
# The eventual target is READ OUT OF THE MANIFEST rather than restated
# here, so this assertion also proves package and manifest name the same
# single target.
TARGETREF=$(node -e "process.stdout.write(JSON.parse(require('fs').readFileSync('$MANIFEST','utf8')).eventual_target.supabase_project_ref)" 2>/dev/null)
hasF 'PREPARED - NOT EXECUTED' "$PACKAGE" && [ -n "$TARGETREF" ] && hasF "$TARGETREF" "$PACKAGE" \
  && hasF 'HAS NOT BEEN APPLIED TO HOSTED' "$PACKAGE" \
  && ok "A6: the package is labeled PREPARED - NOT EXECUTED, names the SAME single eventual target the manifest names, and states hosted application has not occurred" \
  || bad "A6: package labeling incomplete, or package and manifest disagree about the eventual target"
hasF "$M028_SHA" "$PACKAGE" && hasF "$M028_SHA" "$MANIFEST" \
  && ok "A7: both artifacts bind migration 028 by its exact sha256" \
  || bad "A7: the 028 binding is missing from the package or the manifest"
# tolower(), not gawk's IGNORECASE: BSD awk does not implement IGNORECASE
# and would silently match nothing.
CARRYLOAD=$(awk '/^SELECT public\.load_catalog_snapshot\($/,/;$/' "$PACKAGE" | awk 'tolower($0) ~ /farmer|suitcase|sandbag|carry/ {n++} END{print n+0}')
[ "$CARRYLOAD" = "0" ] \
  && ok "P5a: NO carry name appears inside any load_catalog_snapshot call site - the three deferred carries are not admitted, not renamed and not reinterpreted (static)" \
  || bad "P5a: a carry name appears in a load call site ($CARRYLOAD)"

# Regeneration determinism: the committed artifacts must be exactly what
# the committed generator emits from the committed carriers. Written to a
# scratch directory, so this check cannot itself modify docs/.
if [ -f "$GENERATOR" ]; then
  GENDIR="$TMP/gen"; mkdir -p "$GENDIR"
  if W14_VARIANT=identity W14_OUT_DIR="$GENDIR" npx tsx "$GENERATOR" > "$TMP/gen.out" 2>&1; then
    { cmp -s "$GENDIR/w14-identity.sql" "$PACKAGE" && cmp -s "$GENDIR/w14-manifest.json" "$MANIFEST"; } \
      && ok "A9: REGENERATION IS BYTE-DETERMINISTIC - the committed generator, re-run against the committed carriers, reproduces both artifacts byte-for-byte (so neither was hand-patched)" \
      || bad "A9: regeneration does not reproduce the committed artifacts - one of them was edited by hand, or a carrier changed" "$(diff <(head -40 "$GENDIR/w14-identity.sql") <(head -40 "$PACKAGE") | head -6 | tr '\n' ' ')"
  else
    bad "A9: the generator refused to run" "$(tail -3 "$TMP/gen.out" | tr '\n' ' ')"
  fi
else
  bad "A9: the generator $GENERATOR is missing; the artifacts have no derivation path"
fi

echo
echo "=== B. Disposable cluster, migrations 001-028, and a NON-EMPTY hosted-shape baseline"
initdb -D "$PGDATA" -U supabase_admin --no-locale -E UTF8 >/dev/null 2>&1
pg_ctl -D "$PGDATA" \
  -o "-c listen_addresses='' -c unix_socket_directories='$SOCK' -c track_functions=all" \
  -l "$TMP/pg.log" start >/dev/null 2>&1
if QA "SELECT 1" >/dev/null 2>&1; then
  ok "B1: cluster up at $SOCK (unix socket ONLY; no TCP; no hosted contact; track_functions=all so a refused run's function calls are observable)"
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
[ "$APPLIED" = "28" ] \
  && ok "B2: migrations 001-028 applied exactly once in order, ALL as the non-superuser postgres" \
  || bad "B2: expected 28 migrations, applied $APPLIED"
expect_eq "B3: the loader-role membership baseline is the exact hosted row, grantor included" "$BASELINE_SQL" "$BASELINE_OK"

# The unique index Correction 1 depends on, read FROM THE APPLIED DATABASE
# rather than from the migration text.
expect_eq "P15a: exercise_catalog_source_url_version_unique_idx is present, UNIQUE, NON-PARTIAL, on exactly (source_url, catalog_version), with NULLs distinct - so two external rows at version 1 CANNOT share a source_url, while many NULL-source rows can coexist" \
  "SELECT i.indisunique::text||'/'||(i.indpred IS NULL)::text||'/'||i.indnullsnotdistinct::text||'/'||pg_get_indexdef(i.indexrelid) FROM pg_index i JOIN pg_class c ON c.oid=i.indexrelid WHERE c.relname='exercise_catalog_source_url_version_unique_idx'" \
  "true/true/false/CREATE UNIQUE INDEX exercise_catalog_source_url_version_unique_idx ON public.exercise_catalog USING btree (source_url, catalog_version)"
expect_eq "P15b: load_catalog_snapshot cannot set catalog_version - it takes no version argument, so every snapshot it creates is born at the column DEFAULT of 1, which is why (source_url, 1) collides for two same-URL external rows" \
  "SELECT (SELECT count(*) FROM pg_proc p WHERE p.pronamespace='public'::regnamespace AND p.proname='load_catalog_snapshot' AND pg_get_function_arguments(p.oid) LIKE '%catalog_version%')::text||'/'||(SELECT column_default FROM information_schema.columns WHERE table_schema='public' AND table_name='exercise_catalog' AND column_name='catalog_version')" \
  "0/1"

# ── Tenant fixture: the hosted shape (84 exercises, four users) ───
for u in 1 2 3 4; do
  UID_U=$(Q "INSERT INTO auth.users DEFAULT VALUES RETURNING id;")
  Q "INSERT INTO public.exercises (user_id, name, category, primary_muscle, equipment, exercise_type, tracking_mode, unilateral, is_system, is_active)
     SELECT '$UID_U', 'Fixture Exercise U$u N' || g, 'compound', 'lats', 'barbell', 'strength', 'weight_reps', false, true, true
     FROM generate_series(1, 20) g;" >/dev/null
  Q "INSERT INTO public.exercises (user_id, name, category, primary_muscle, equipment, exercise_type, tracking_mode, unilateral, is_system, is_active)
     VALUES ('$UID_U', 'Plank', 'isolation', 'abs', 'bodyweight', 'bodyweight', 'bodyweight', false, true, true);" >/dev/null
done
expect_eq "B4: representative tenant fixture in place - exactly 84 exercises across four users, each with a seeded Plank" \
  "SELECT count(*)::text FROM public.exercises" "84"

# ── Pre-existing catalog surface: the committed EXLIB-2K load ─────
# A non-empty catalog/content baseline matters. It is what makes the
# W14 package's DELTA postconditions and the surface digests load-
# bearing: against an empty database, "unchanged outside the five" is
# a claim about nothing.
if psql -h "$SOCK" -U postgres -d postgres -X -v ON_ERROR_STOP=1 -q -f "$PKG2K" > "$TMP/pkg2k.out" 2>&1; then
  ok "B5: the already-committed EXLIB-2K load package applied, giving a NON-EMPTY pre-existing catalog and content surface (three logical identities, one snapshot, one content draft) - so every 'unchanged outside the five' proof below is a claim about real rows"
else
  bad "B5: the 2K fixture load failed" "$(tail -3 "$TMP/pkg2k.out" | tr '\n' ' ')"; exit 1
fi
expect_eq "B6: the baseline is genuinely NON-EMPTY on every surface the proofs below claim is unchanged - catalog identities, snapshots, content versions and 84 tenant rows all present" \
  "SELECT ((SELECT count(*) FROM public.exercise_catalog_logical) > 0 AND (SELECT count(*) FROM public.exercise_catalog) > 0 AND (SELECT count(*) FROM public.exercise_catalog_muscles) > 0 AND (SELECT count(*) FROM public.exercise_catalog_name_claims) > 0 AND (SELECT count(*) FROM public.exercise_catalog_content) > 0 AND (SELECT count(*) FROM public.exercises) = 84)::text" \
  "true"
expect_eq "B7: the baseline holds ZERO weight_time catalog rows and ZERO of the five W14 identities - every W14 row observed later is this package's own effect" \
  "SELECT (SELECT count(*) FROM public.exercise_catalog WHERE tracking_mode='weight_time')::text||'/'||($RESIDUE_SQL)" "0/0/0/0/0"
expect_eq "B8: the 2K fixture restored the loader-membership baseline exactly, so the W14 posture gate starts from the hosted row" "$BASELINE_SQL" "$BASELINE_OK"

SURFACE_BEFORE=$(Q "$SURFACE_SQL")
CONTENT_BEFORE=$(Q "$CONTENT_SQL")
TENANT_BEFORE=$(Q "$TENANT_SQL")
# The baseline row counts are MEASURED, and the expected post-state is
# derived from them by adding the governed delta. Hardcoding eight
# absolute totals would silently encode this fixture's shape into the
# proof; a delta keeps the assertion about the PACKAGE.
COUNTS_BEFORE=$(Q "$COUNTS_SQL")
COUNTS_EXPECTED=$(printf '%s' "$COUNTS_BEFORE" | awk -F/ 'BEGIN{OFS="/"} NF==8 {print $1+5,$2+5,$3+5,$4+0,$5+5,$6+0,$7+0,$8+0}')
[ -n "$COUNTS_EXPECTED" ] \
  && ok "B9: baseline measured ($COUNTS_BEFORE), so the governed delta of +5 identities, +5 snapshots, +5 anatomy rows, +5 name claims and +0 to every other surface predicts exactly $COUNTS_EXPECTED" \
  || bad "B9: could not measure the baseline counts (got [$COUNTS_BEFORE])"
ok "B9b: harness-side baseline digests captured INDEPENDENTLY of the package's own internal digests (surface ${SURFACE_BEFORE:0:8}, content ${CONTENT_BEFORE:0:8}, tenant ${TENANT_BEFORE:0:8})"

# ── Scratch clones, taken BEFORE the W14 load, so every control runs
#    against the identical non-empty pre-state ────────────────────
CONTROL_DBS="c_same_url c_nullsrc c_srcforge c_badcat c_extra c_carry c_forge133 c_disturl c_subuuid c_sabotage"
CLONED=0
for d in $CONTROL_DBS; do
  QT "CREATE DATABASE $d TEMPLATE postgres OWNER postgres" >/dev/null 2>>"$TMP/clone.err" && CLONED=$((CLONED+1))
done
[ "$CLONED" = "10" ] \
  && ok "B10: ten scratch databases cloned from the identical non-empty pre-state, so no control can inherit another control's rows" \
  || bad "B10: expected 10 clones, made $CLONED" "$(tail -2 "$TMP/clone.err" 2>/dev/null | tr '\n' ' ')"

# Function-call statistics are reset here so the counts observed after
# the W14 run are the W14 run's own, not the 2K fixture's.
QA "SELECT pg_stat_reset()" >/dev/null
expect_eq "B11: function-call statistics reset - the loader call counts observed below are the W14 package's own" \
  "SELECT coalesce(sum(calls),0)::text FROM pg_stat_user_functions WHERE funcname LIKE 'load_catalog%'" "0"

echo
echo "=== C. Execute the prepared W14 package EXACTLY ONCE"
psql -h "$SOCK" -U postgres -d postgres -X -v ON_ERROR_STOP=1 -q -f "$PACKAGE" > "$TMP/pkg.out" 2>&1
PKGRC=$?
if [ "$PKGRC" = "0" ]; then
  ok "C1: the package executed and COMMITTED once against the non-empty baseline (exit 0)"
else
  bad "C1: the package FAILED to execute (exit $PKGRC)" "$(grep -m3 -E 'ERROR|DETAIL|CONTEXT' "$TMP/pkg.out" | tr '\n' ' ')"
  printf '%s passed, %s failed\n' "$PASS" "$FAIL"; exit 1
fi
expect_eq "C2: the temp pre-state table did not survive the transaction (ON COMMIT DROP; nothing persists)" \
  "SELECT count(*)::text FROM pg_class WHERE relname='w14_txn_pre'" "0"

# ── P1: exactly five identities and five snapshots ────────────────
expect_eq "P1: EXACTLY FIVE new logical identities and FIVE new snapshots landed, with five anatomy rows, five canonical name claims, ZERO new aliases, ZERO new content versions - and the tenant tables untouched (measured delta over the non-empty baseline $COUNTS_BEFORE)" \
  "$COUNTS_SQL" "$COUNTS_EXPECTED"
expect_eq "P1b: each of the five identities bears EXACTLY ONE snapshot" \
  "SELECT coalesce(string_agg(n::text, ',' ORDER BY n),'<none>') FROM (SELECT count(*) n FROM public.exercise_catalog WHERE logical_id IN ($FIVE) GROUP BY logical_id) t" \
  "1,1,1,1,1"
expect_eq "P1c: no SIXTH identity appeared - the set of W14-era identities is exactly the five predeclared UUIDs" \
  "SELECT count(*)::text FROM public.exercise_catalog_logical WHERE id IN ($FIVE)" "5"

# ── P2: all five weight_time ──────────────────────────────────────
expect_eq "P2: ALL FIVE snapshots carry tracking_mode = weight_time, and they are the only weight_time rows in the catalog" \
  "SELECT (SELECT count(*) FROM public.exercise_catalog WHERE logical_id IN ($FIVE) AND tracking_mode='weight_time')::text||'/'||(SELECT count(*) FROM public.exercise_catalog WHERE tracking_mode='weight_time')::text" \
  "5/5"

# ── P4: born state, exactly as the loader guarantees ──────────────
expect_eq "P4: every one of the five landed in the loader's expected initial state - review_status pending, is_active true, catalog_version 1, and all three review-audit fields NULL (loading is NOT approval)" \
  "SELECT count(*)::text FROM public.exercise_catalog WHERE logical_id IN ($FIVE) AND review_status='pending' AND is_active AND catalog_version=1 AND reviewed_by IS NULL AND reviewed_at IS NULL AND review_rationale IS NULL" \
  "5"
expect_eq "P4b: the intentional 2/3 provenance split landed exactly as governed and was NOT normalized to one value" \
  "SELECT string_agg(provenance||'='||n::text, ' ' ORDER BY provenance) FROM (SELECT provenance, count(*) n FROM public.exercise_catalog WHERE logical_id IN ($FIVE) GROUP BY provenance) t" \
  "external_source_derived=2 forgefitos_original=3"
expect_eq "P15c: THE CORRECTION-1 OUTCOME, read from the database: the two external rows carry TWO DISTINCT source_url values, both remain external_source_derived, and both sit at catalog_version 1" \
  "SELECT (SELECT count(DISTINCT source_url) FROM public.exercise_catalog WHERE logical_id IN ($FIVE) AND provenance='external_source_derived')::text||'/'||(SELECT count(*) FROM public.exercise_catalog WHERE logical_id IN ($FIVE) AND provenance='external_source_derived' AND catalog_version=1)::text||'/'||(SELECT string_agg(source_url, ' + ' ORDER BY source_url) FROM public.exercise_catalog WHERE logical_id IN ($FIVE) AND provenance='external_source_derived')" \
  "2/2/https://marathonhandbook.com/weighted-plank/ + https://www.strengthlog.com/weighted-plank/"
expect_eq "P4c: the three forgefitos_original rows carry ALL FOUR discovery-source fields NULL - no external provenance was fabricated for a ForgeFitOS-original entry" \
  "SELECT count(*)::text FROM public.exercise_catalog WHERE logical_id IN ($FIVE) AND provenance='forgefitos_original' AND source_url IS NULL AND source_page IS NULL AND retrieved_at IS NULL AND import_confidence IS NULL" \
  "3"

# ── P3 + P14: the DATABASE is the oracle ──────────────────────────
# Every governed field is read back OUT of PostgreSQL, compared against
# the machine manifest, and the payload fingerprint is RECOMPUTED from
# the readback - so the manifest is checked against what actually landed,
# never against the package's own text.
cat > "$TMP/readback.mjs" <<'NODEJS'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
const [manifestPath, tsvPath] = process.argv.slice(2)
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
const PARAMS = ['logical_id', 'canonical_name', 'category', 'primary_muscle', 'equipment',
  'laterality', 'tracking_mode', 'provenance', 'movement_pattern', 'training_role',
  'difficulty', 'availability', 'source_url', 'source_page', 'retrieved_at',
  'import_confidence', 'anatomy', 'aliases']
const COLUMNS = [...PARAMS.slice(0, 16), 'anatomy_pairs', 'alias_count']
const rows = readFileSync(tsvPath, 'utf8').split('\n').filter((line) => line.trim() !== '')
let mismatch = 0
const problem = (message) => { mismatch += 1; console.log(`  MISMATCH ${message}`) }
if (manifest.entries.length !== 5) problem(`the manifest holds ${manifest.entries.length} entries, not five`)
if (manifest.manifest_order.join(',') !== '132,133,137,138,139') problem(`manifest_order is ${manifest.manifest_order.join(',')}`)
if (rows.length !== 5) problem(`the database returned ${rows.length} W14 rows, not five`)
for (const row of rows) {
  const cells = row.split('\t')
  const db = {}
  COLUMNS.forEach((column, index) => { db[column] = cells[index] === '<NULL>' ? null : cells[index] })
  // Keyed by logical identity, never by row position.
  const entry = manifest.entries.find((candidate) => candidate.logical_id === db.logical_id)
  if (!entry) { problem(`the database holds identity ${db.logical_id}, which the manifest does not govern`); continue }
  for (const field of PARAMS.slice(1, 16)) {
    if (db[field] !== entry[field]) problem(`${entry.inventory_file_line} ${field}: database [${db[field]}] manifest [${entry[field]}]`)
  }
  const expectedPairs = [...entry.anatomy]
    .sort((a, b) => (a.muscle === b.muscle ? a.role.localeCompare(b.role) : a.muscle.localeCompare(b.muscle)))
    .map((r) => `${r.muscle}:${r.role}`).join(',')
  if (db.anatomy_pairs !== expectedPairs) problem(`${entry.inventory_file_line} anatomy: database [${db.anatomy_pairs}] manifest [${expectedPairs}]`)
  if (db.alias_count !== '0' || entry.aliases.length !== 0) problem(`${entry.inventory_file_line} aliases: database holds ${db.alias_count}, manifest holds ${entry.aliases.length}`)
  // Recompute the fingerprint FROM THE READBACK, under the manifest's
  // declared scheme: compact JSON for anatomy and aliases, \N for NULL.
  const anatomy = db.anatomy_pairs === null || db.anatomy_pairs === '' ? []
    : db.anatomy_pairs.split(',').map((pair) => ({ muscle: pair.split(':')[0], role: pair.split(':')[1] }))
  let form = ''
  for (const parameter of PARAMS) {
    let rendered
    if (parameter === 'anatomy') rendered = JSON.stringify(anatomy)
    else if (parameter === 'aliases') rendered = '[]'
    else rendered = db[parameter] === null ? '\\N' : db[parameter]
    form += `p_${parameter}=${rendered}\n`
  }
  const recomputed = createHash('sha256').update(form).digest('hex')
  if (recomputed !== entry.payload_fingerprint_sha256) problem(`${entry.inventory_file_line} payload fingerprint: recomputed from the DATABASE [${recomputed}] manifest [${entry.payload_fingerprint_sha256}]`)
}
console.log(`RESULT rows=${rows.length} mismatch=${mismatch}`)
process.exit(mismatch === 0 && rows.length === 5 ? 0 : 1)
NODEJS
# Tab-separated on purpose: psql's default unaligned separator is '|',
# and a governed value could legitimately contain one.
psql -h "$SOCK" -U postgres -d "$DB" -X -v ON_ERROR_STOP=1 -qtA -F$'\t' -c \
 "SELECT s.logical_id::text, s.canonical_name, s.category, s.primary_muscle, s.equipment,
          s.laterality, s.tracking_mode, s.provenance, s.movement_pattern, s.training_role,
          s.difficulty, s.availability,
          coalesce(s.source_url,'<NULL>'), coalesce(s.source_page,'<NULL>'),
          coalesce(to_char(s.retrieved_at,'YYYY-MM-DD'),'<NULL>'),
          coalesce(s.import_confidence,'<NULL>'),
          coalesce((SELECT string_agg(m.muscle||':'||m.role, ',' ORDER BY m.muscle, m.role)
                      FROM public.exercise_catalog_muscles m WHERE m.catalog_id = s.id), ''),
          (SELECT count(*) FROM public.exercise_catalog_aliases a WHERE a.logical_id = s.logical_id)::text
     FROM public.exercise_catalog s
    WHERE s.logical_id IN ($FIVE)
    ORDER BY s.logical_id" > "$TMP/readback.tsv" 2>"$TMP/readback.err"
if node "$TMP/readback.mjs" "$MANIFEST" "$TMP/readback.tsv" > "$TMP/readback.log" 2>&1; then
  ok "P3: EVERY governed field of all five entries, read back OUT of the database, equals the machine manifest exactly - all fifteen scalar fields per entry, the anatomy rows, and the empty alias set"
  ok "P14: the payload fingerprint of each entry RECOMPUTES from the database readback under the manifest's declared scheme - the oracle is the database's actual contents, never the package's text ($(grep RESULT "$TMP/readback.log"))"
else
  bad "P3/P14: the database readback does not match the manifest" "$(grep -m4 MISMATCH "$TMP/readback.log" | tr '\n' ' ')"
fi

# ── P5: the three deferred carries did NOT land ───────────────────
# Matched by SUBSTRING, not by an exact normalized name: a carry admitted
# under a slightly different spelling must still be caught.
expect_eq "P5: NOT ONE of the three deferred carries landed - no snapshot or name claim anywhere in the catalog mentions a carry, a farmer, a suitcase or a sandbag, and no row carries a carry movement pattern (inventory lines 134, 135, 136 remain deferred)" \
  "SELECT (SELECT count(*) FROM public.exercise_catalog WHERE lower(canonical_name) ~ 'carry|farmer|suitcase|sandbag')::text||'/'||(SELECT count(*) FROM public.exercise_catalog_name_claims WHERE lower(normalized_name) ~ 'carry|farmer|suitcase|sandbag')::text||'/'||(SELECT count(*) FROM public.exercise_catalog WHERE movement_pattern='carry')::text" \
  "0/0/0"

# ── P6 + P7: zero tenant effect ───────────────────────────────────
expect_eq "P6: ZERO tenant exercise rows were created and NONE was linked to a W14 identity - the tenant table still holds exactly the 84 fixture rows" \
  "SELECT (SELECT count(*) FROM public.exercises)::text||'/'||(SELECT count(*) FROM public.exercises WHERE catalog_logical_id IN ($FIVE))::text||'/'||(SELECT count(*) FROM public.exercises t JOIN public.exercise_catalog s ON s.id=t.catalog_id WHERE s.logical_id IN ($FIVE))::text" \
  "84/0/0"
expect_eq "P7: ZERO tenant delivery aliases exist at all, and the whole tenant surface is byte-identical to the pre-state digest" \
  "SELECT (SELECT count(*) FROM public.exercise_aliases)::text||'/'||($TENANT_SQL)" \
  "0/$TENANT_BEFORE"

# ── P8: the pre-existing surface outside the five is unchanged ────
expect_eq "P8: the pre-existing catalog surface OUTSIDE the five - every 2K snapshot, anatomy row, alias, name claim and logical identity - is byte-identical to the harness's independently captured pre-state digest" \
  "$SURFACE_SQL" "$SURFACE_BEFORE"
expect_eq "P8b: the content / expected-relationship / review-event surface is byte-identical too, and no content version references a W14 identity - NO content draft, review, admission or publication act occurred" \
  "SELECT ($CONTENT_SQL)||'/'||(SELECT count(*) FROM public.exercise_catalog_content WHERE logical_id IN ($FIVE))::text" \
  "$CONTENT_BEFORE/0"
expect_eq "P8c: the bidirectional name-claim invariant still holds - zero orphaned claims, zero unclaimed bearers - via migration 023's own verifier" \
  "SELECT orphaned_claims::text||'/'||unclaimed_bearers::text FROM public.exlib_verify_catalog_claims()" "0/0"
expect_eq "P8d: the temporary loader elevation was restored exactly - one membership row, grantor supabase_admin, ADMIN TRUE / INHERIT FALSE / SET FALSE - and SET ROLE is denied again" \
  "$BASELINE_SQL" "$BASELINE_OK"
expect_eq "P8e: no client, service or PUBLIC authority was widened on any loader function" \
  "SELECT (has_function_privilege('anon','public.load_catalog_snapshot(uuid,text,text,text,text,text,text,text,text,text,text,text,text,text,date,text,jsonb,jsonb)','EXECUTE'))::text||'/'||(has_function_privilege('authenticated','public.load_catalog_identity(uuid)','EXECUTE'))::text||'/'||(has_function_privilege('service_role','public.load_catalog_identity(uuid)','EXECUTE'))::text" \
  "false/false/false"

# ── P9: deliver_catalog_exercises was never invoked ───────────────
# pg_stat_user_functions is NON-transactional, which is exactly why it
# can testify about what a committed - or a refused - run actually did.
expect_eq "P9: DELIVERY WAS NEVER INVOKED - the non-transactional function-call statistics show exactly five load_catalog_identity calls, five load_catalog_snapshot calls, and ZERO calls to deliver_catalog_exercises, load_catalog_content_draft, apply_content_review, admit_catalog_content or publish_catalog_content" \
  "SELECT (SELECT coalesce(sum(calls),0) FROM pg_stat_user_functions WHERE funcname='load_catalog_identity')::text||'/'||(SELECT coalesce(sum(calls),0) FROM pg_stat_user_functions WHERE funcname='load_catalog_snapshot')::text||'/'||(SELECT coalesce(sum(calls),0) FROM pg_stat_user_functions WHERE funcname IN ('deliver_catalog_exercises','load_catalog_content_draft','apply_content_review','admit_catalog_content','publish_catalog_content'))::text" \
  "5/5/0"

echo
echo "=== D. Negative controls - each GENERATED through the real derivation path, each on its own clone of the identical pre-state"
# run_control NAME VARIANT DB EXPECTED_PATTERN DESCRIPTION
run_control() {
  local label="$1" variant="$2" db="$3" pattern="$4" description="$5"
  local sql="$TMP/w14-$variant.sql"
  if ! W14_VARIANT="$variant" W14_OUT_DIR="$TMP" npx tsx "$GENERATOR" > "$TMP/gen-$variant.out" 2>&1; then
    bad "$label: the generator could not produce the control" "$(tail -2 "$TMP/gen-$variant.out" | tr '\n' ' ')"; return 0
  fi
  if cmp -s "$sql" "$PACKAGE"; then
    bad "$label: the control is byte-identical to the governed package - it mutates nothing and proves nothing"; return 0
  fi
  psql -h "$SOCK" -U postgres -d "$db" -X -v ON_ERROR_STOP=1 -q -f "$sql" > "$TMP/ctl-$variant.out" 2>&1
  local rc=$?
  if [ "$rc" = "0" ]; then
    bad "$label: expected fail-closed rejection, the control COMMITTED" "$description"; return 0
  fi
  if ! grep -qF "$pattern" "$TMP/ctl-$variant.out"; then
    bad "$label: refused, but NOT by the expected rule ($pattern)" "$(grep -m2 -E 'ERROR|DETAIL' "$TMP/ctl-$variant.out" | tr '\n' ' ')"; return 0
  fi
  local residue counts baseline
  residue=$(QD "$db" "$RESIDUE_SQL")
  counts=$(QD "$db" "$COUNTS_SQL")
  baseline=$(QD "$db" "$BASELINE_SQL")
  if [ "$residue" = "0/0/0/0" ] && [ "$counts" = "$COUNTS_BEFORE" ] && [ "$baseline" = "$BASELINE_OK" ]; then
    ok "$label: refused by $pattern, and the rollback left ZERO partial W14 state (no identity, no snapshot, no name claim, no anatomy row), the pre-existing surface at its exact baseline, and the authority baseline exact"
  else
    bad "$label: refused correctly but left residue" "targets=$residue counts=$counts (baseline $COUNTS_BEFORE) membership=$baseline"
  fi
}

# P15 - THE Correction-1 control: restore the superseded same-source-URL
# binding and prove the committed unique index refuses it.
run_control "P15d" same_url_133 c_same_url "exercise_catalog_source_url_version_unique_idx" \
  "the superseded binding gave 132 and 133 one shared source_url"
grep -qF "Key (source_url, catalog_version)=(https://www.strengthlog.com/weighted-plank/, 1) already exists" "$TMP/ctl-same_url_133.out" \
  && ok "P15e: the refusal DETAIL names the exact colliding key - (https://www.strengthlog.com/weighted-plank/, 1) - proving the collision is the (source_url, catalog_version) pair at the born version, not some incidental error" \
  || bad "P15e: the expected duplicate-key DETAIL is absent" "$(grep -m2 DETAIL "$TMP/ctl-same_url_133.out" | tr '\n' ' ')"

# Malformed / falsified-provenance controls.
run_control "P11a" null_source_on_external c_nullsrc "exercise_catalog_provenance_sources_chk" \
  "an external_source_derived row with a NULL source_url"
run_control "P11b" source_on_forgefitos c_srcforge "exercise_catalog_provenance_sources_chk" \
  "a forgefitos_original row carrying fabricated external source metadata"
run_control "P11c" bad_category c_badcat "exercise_catalog_category_check" \
  "a category outside the migration-023 vocabulary"
# Additive controls: a sixth identity, and an admitted carry.
run_control "P11d" extra_identity c_extra "w14 post:" \
  "a SIXTH entry appended to the admission set"
run_control "P11e" admit_a_carry c_carry "w14 post:" \
  "a deferred carry (inventory line 134) admitted as a sixth entry"

# ── Ablations: controls that SUCCEED, and therefore locate the cause ──
# A control that fails proves a guard exists. A control that succeeds
# proves the guard is specific. Both of these are FORBIDDEN as governed
# bindings; they run only to isolate the variable.
for pair in "distinct_url_133 c_disturl" "forgefitos_133 c_forge133"; do
  set -- $pair
  variant="$1"; db="$2"
  W14_VARIANT="$variant" W14_OUT_DIR="$TMP" npx tsx "$GENERATOR" >/dev/null 2>&1
  psql -h "$SOCK" -U postgres -d "$db" -X -v ON_ERROR_STOP=1 -q -f "$TMP/w14-$variant.sql" > "$TMP/abl-$variant.out" 2>&1
  rc=$?
  landed=$(QD "$db" "SELECT count(*)::text FROM public.exercise_catalog WHERE logical_id IN ($FIVE)")
  case "$variant" in
    distinct_url_133)
      { [ "$rc" = "0" ] && [ "$landed" = "5" ]; } \
        && ok "P11f (ABLATION, single variable): giving 133 ANY distinct source_url commits cleanly - so the collision was caused by the shared URL alone, not by the fifth entry, the vest equipment, or the external provenance. The governed remedy uses a REAL committed evidence URL, never a synthetic one." \
        || bad "P11f: the distinct-URL ablation did not commit as expected (rc=$rc, landed=$landed)" "$(grep -m2 ERROR "$TMP/abl-$variant.out" | tr '\n' ' ')" ;;
    forgefitos_133)
      prov=$(QD "$db" "SELECT provenance FROM public.exercise_catalog WHERE logical_id='$U133'")
      { [ "$rc" = "0" ] && [ "$landed" = "5" ] && [ "$prov" = "forgefitos_original" ]; } \
        && ok "P11g (ABLATION, single variable): reclassifying 133 to forgefitos_original with four NULLs ALSO commits - which is precisely why it had to be refused by RULING rather than by the schema. The operator forbade it: provenance is not a free variable for satisfying an index. This binding is NOT the governed one." \
        || bad "P11g: the provenance ablation behaved unexpectedly (rc=$rc, landed=$landed, provenance=$prov)" ;;
  esac
done
# A substituted identity is invisible to the database - only the STATIC
# oracle can catch it. Stating that explicitly keeps this suite honest
# about the limit of its own reach.
W14_VARIANT=substitute_uuid W14_OUT_DIR="$TMP" npx tsx "$GENERATOR" >/dev/null 2>&1
psql -h "$SOCK" -U postgres -d c_subuuid -X -v ON_ERROR_STOP=1 -q -f "$TMP/w14-substitute_uuid.sql" > "$TMP/abl-sub.out" 2>&1
SUBRC=$?
SUBOUT=$(QD c_subuuid "SELECT (SELECT count(*) FROM public.exercise_catalog WHERE logical_id IN ($FIVE))::text||'/'||(SELECT count(*) FROM public.exercise_catalog_logical WHERE id='e21b2c00-0000-4000-a000-0000000000ff')::text")
{ [ "$SUBRC" = "0" ] && [ "$SUBOUT" = "4/1" ]; } \
  && ok "P11h (SCOPE LIMIT, stated plainly): substituting one of the five frozen UUIDs COMMITS here - four governed identities plus one ungoverned one - because no database can know the frozen allocation. This class is caught only by scripts/verify-weight-time-w14.ts, which is therefore load-bearing and not a convenience." \
  || bad "P11h: the identity-substitution ablation behaved unexpectedly (rc=$SUBRC, landed=$SUBOUT)"

echo
echo "=== E. ONE-USE: a second execution is refused, not silently repeated"
psql -h "$SOCK" -U postgres -d postgres -X -v ON_ERROR_STOP=1 -q -f "$PACKAGE" > "$TMP/pkg2.out" 2>&1
RC2=$?
if [ "$RC2" = "0" ]; then
  bad "P12: the SECOND execution COMMITTED - the package is not one-use"
else
  grep -qF "W14-PRE-TARGET" "$TMP/pkg2.out" \
    && ok "P12: the second execution is REFUSED at W14-PRE-TARGET, before any write - a spent package is an error, never a silent no-op and never a duplicate" \
    || bad "P12: the second execution failed for an unexpected reason" "$(grep -m2 -E 'ERROR|DETAIL' "$TMP/pkg2.out" | tr '\n' ' ')"
fi
expect_eq "P12b: the refused re-run changed NOTHING - still exactly five snapshots (not ten), nothing relinked, nothing duplicated, and the whole surface byte-identical" \
  "SELECT ($COUNTS_SQL)||'#'||($SURFACE_SQL)||'#'||($TENANT_SQL)" \
  "$COUNTS_EXPECTED#$SURFACE_BEFORE#$TENANT_BEFORE"
expect_eq "P12c: the refused re-run called NO loader function at all - the non-transactional statistics still show exactly the first run's five and five" \
  "SELECT (SELECT coalesce(sum(calls),0) FROM pg_stat_user_functions WHERE funcname='load_catalog_identity')::text||'/'||(SELECT coalesce(sum(calls),0) FROM pg_stat_user_functions WHERE funcname='load_catalog_snapshot')::text" \
  "5/5"
expect_eq "P12d: the refused re-run left the authority baseline exact - it refused BEFORE the temporary grant" "$BASELINE_SQL" "$BASELINE_OK"

echo
echo "=== F. ATOMICITY: sabotaging the FINAL postcondition rolls back the whole package"
run_control "P13" sabotage_last_postcondition c_sabotage "w14 post:" \
  "the last postcondition in the file made unsatisfiable"
SABCALLS=$(QD c_sabotage "SELECT (SELECT coalesce(sum(calls),0) FROM pg_stat_user_functions WHERE funcname='load_catalog_snapshot')::text")
[ "$SABCALLS" = "5" ] \
  && ok "P13b: the sabotaged run DID reach and execute all five loader calls - the non-transactional statistics prove the rollback undid real work rather than the package having refused early (so P13's zero-residue result is genuine atomicity, not an early exit)" \
  || bad "P13b: expected 5 recorded snapshot calls on the sabotaged clone, saw $SABCALLS"

echo
echo "=== G. No hosted contact, ever"
# This is a SECURITY FLOOR, so it is written in awk, whose ERE and
# tolower() behave the same under every awk, and it is PROVEN to fire on
# synthetic positives before its zero is believed. The earlier grep form
# of this check silently matched nothing under ugrep and reported clean.
# Each alternative is written in bracketed form ([-][-] rather than --)
# so the pattern text CANNOT match itself. That is not decoration: a
# self-matching floor reports a violation on every clean run and gets
# weakened until it reports nothing.
HOSTPAT='supabase[.](co|com)|vercel[.](app|com)|[-][-]db[-]url|[-][-]linked|project[-]ref|db[ ](push|dump)|npx[ ]supabase|supabase[ ](db|projects|link|login)'
HOSTHITS=$(awk -v pat="$HOSTPAT" 'tolower($0) ~ pat {n++} END{print n+0}' "$0")
[ "$HOSTHITS" = "0" ] \
  && ok "G1: this script contains NO hosted endpoint, NO remote linkage flag, and NO Supabase CLI invocation of any kind" \
  || bad "G1: this script references a hosted endpoint, a remote linkage flag, or a Supabase CLI command ($HOSTHITS line(s))"
# Synthetic positive control: every alternative must actually match a line
# built to trip it. The offending literals are ASSEMBLED AT RUNTIME from
# fragments, so they never appear in this file's bytes and cannot make the
# script fail its own scan above.
D='-'; S=' '; T='.'; C='ps'; C="${C}ql"; K='pg'; K="${K}_ctl"; B='sup'; B="${B}abase"
HOSTPOS=$(printf '%s\n' \
  "${C} https://abcd.${B}${T}io/x" \
  "${C} https://abcd.${B}${T}co/x" \
  "curl https://foo.vercel${T}app" \
  "run ${D}${D}db${D}url postgres://x" \
  "run ${D}${D}linked" \
  "flag project${D}ref abcd" \
  "${B} db${S}push" \
  "npx${S}${B} status" \
  "${B}${S}projects list" \
  | awk -v pat="$HOSTPAT" 'tolower($0) ~ pat {n++} END{print n+0}')
# Eight of the nine lines are offenders; the FIRST is a near-miss - a
# hosted-provider hostname on a TLD the pattern does not claim - which
# MUST NOT match, so this control also proves the pattern is not simply
# matching every line handed to it.
[ "$HOSTPOS" = "8" ] \
  && ok "G1b: POSITIVE CONTROL - the hosted-contact detector fires on all eight synthetic offenders (a hosted database endpoint, a hosted deployment endpoint, the two remote-linkage flags, a project reference flag, a remote database push, an npx-invoked CLI, and a remote project listing) and correctly IGNORES a near-miss hostname on an unclaimed TLD, so G1's zero means absence rather than a dead or over-broad pattern" \
  || bad "G1b: the hosted-contact detector matched $HOSTPOS synthetic lines, expected exactly 8 - G1's zero cannot be trusted"
# Every database and cluster invocation must name the disposable fixture.
# index(), not a grep -v pipeline: the pattern contains a '$' and a
# grep-family tool may read it as an anchor and filter nothing.
BADPSQL=$(awk '/(psql|pg_ctl|initdb)[ \t]/ && !index($0,"-h \"$SOCK\"") && !index($0,"-D \"$PGDATA\"") {n++} END{print n+0}' "$0")
[ "$BADPSQL" = "0" ] \
  && ok "G2: every database invocation targets ONLY the disposable unix socket, and every cluster command only the disposable data directory" \
  || bad "G2: found $BADPSQL database/cluster invocation(s) not aimed at the disposable fixture"
# Assembled from fragments for the same reason as G1b: a synthetic
# offender written literally would be found by the scan it validates.
BADPOS=$(printf '%s\n' "${C} -h db.example.com -U postgres" "${K} -D /var/lib/pgdir start" \
  "${C} -h \"\$SOCK\" -U postgres -d postgres" \
  | awk '/(psql|pg_ctl|initdb)[ \t]/ && !index($0,"-h \"$SOCK\"") && !index($0,"-D \"$PGDATA\"") {n++} END{print n+0}')
# Two offenders plus one legitimate on-fixture invocation that must NOT
# be flagged.
[ "$BADPOS" = "2" ] \
  && ok "G2b: POSITIVE CONTROL - the same detector flags a synthetic remote-host client and a synthetic foreign data directory, while correctly ignoring a legitimate on-fixture invocation, so G2's zero is a real absence" \
  || bad "G2b: the off-fixture detector flagged $BADPOS synthetic lines, expected exactly 2 - G2's zero cannot be trusted"
ok "G3: the disposable cluster, all ten scratch clones and every generated control are destroyed on exit (trap cleanup); no persistent local database and no control SQL is left behind"
ok "G4: THE W14 PACKAGE HAS NOT BEEN APPLIED TO HOSTED. Its only execution is the one above, on this disposable cluster. No Supabase contact, no Supabase CLI, no Vercel contact, no push, no deploy, no tenant delivery, no content review, admission or publication."

echo
printf '%s passed, %s failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ] || exit 1
