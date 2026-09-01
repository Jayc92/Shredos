#!/bin/bash
# ============================================================
# ForgeFitOS - EXLIB-1C0B3 migration-025 LIVE verification.
#
# Runs the EXACT migration artifacts (full sequence 001-025) against
# a DISPOSABLE LOCAL PostgreSQL cluster created in a temp directory
# (unix-socket only, no TCP, torn down on exit). This script NEVER
# contacts Supabase, Vercel, or any remote service.
#
# Proves, executably:
#   * the 023, 024, and 025 fingerprints gate the run BEFORE initdb;
#   * exact migrations 001-025 apply cleanly in order (025 after 024);
#   * pg_constraint afterwards shows BOTH expanded equipment CHECKs
#     with their exact stable names and exact 12-value definitions;
#   * every legacy value and all four new values INSERT successfully
#     on the tenant table; an unknown value fails closed;
#   * the catalog CHECK accepts all four new values (definition
#     equality; the closed catalog tables take no direct inserts);
#   * migration 024's four indexes and both verify-function pins are
#     unaffected;
#   * 025 is ATOMIC: in a second database where the second targeted
#     constraint is pre-dropped, 025 fails closed and the FIRST
#     table's CHECK is left byte-identical (nothing half-applied);
#   * no content rows and no ledger approvals were added.
#
# Run from the repository root:
#   bash scripts/verify-exlib1c0b3-live.sh
# ============================================================
set -euo pipefail

export LC_ALL=C LANG=C

MIG023="supabase/migrations/023_exlib_catalog_and_delivery_contract.sql"
MIG024="supabase/migrations/024_exlib_post_application_hardening.sql"
MIG025="supabase/migrations/025_exlib_equipment_vocabulary_support.sql"
SHA023="0991448c39a558385431c78cef6d6063df208312a3f53866756ba730066c42f2"
BYTES023=92806
SHA024="190550ecdb99df702ab03d1b07592f861070141e5091eb25bc5bf45f211cc980"
BYTES024=3726
# Within-phase correction (EXLIB-1C0B3 direct review): NOTIFY
# removed from 025; fingerprint advanced to the corrected bytes.
SHA025="fbda16f4d25cacd1715b199050506a4da15896355d96700876b76c68826d304c"
BYTES025=3587

PASS=0
FAIL=0
ok()   { PASS=$((PASS+1)); printf '  PASS  %s\n' "$1"; }
bad()  { FAIL=$((FAIL+1)); printf '  FAIL  %s\n' "$1"; }

TMP="$(mktemp -d /tmp/exlib1c0b3-pg.XXXXXX)"
PGDATA="$TMP/pgdata"
SOCK="$TMP"
cleanup() {
  pg_ctl -D "$PGDATA" stop -m immediate >/dev/null 2>&1 || true
  rm -rf "$TMP"
}
trap cleanup EXIT

Q() { psql -h "$SOCK" -U postgres -d "$1" -X -v ON_ERROR_STOP=1 -qtA -c "$2"; }

echo
echo "Fingerprint gates (before initdb or any SQL execution)"
for spec in "$MIG023:$SHA023:$BYTES023" "$MIG024:$SHA024:$BYTES024" "$MIG025:$SHA025:$BYTES025"; do
  F="${spec%%:*}"; rest="${spec#*:}"; WANT_SHA="${rest%%:*}"; WANT_BYTES="${rest#*:}"
  GOT_SHA=$(shasum -a 256 "$F" | awk '{print $1}')
  GOT_BYTES=$(wc -c < "$F" | tr -d ' ')
  if [ "$GOT_SHA" != "$WANT_SHA" ] || [ "$GOT_BYTES" != "$WANT_BYTES" ]; then
    bad "fingerprint gate: $F expected $WANT_SHA/$WANT_BYTES got $GOT_SHA/$GOT_BYTES"
    exit 1
  fi
  ok "fingerprint gate: $F ($WANT_BYTES bytes, sha256 $GOT_SHA)"
done

echo
echo "Disposable cluster"
initdb -D "$PGDATA" -U postgres --no-locale -E UTF8 >/dev/null 2>&1
pg_ctl -D "$PGDATA" -o "-c listen_addresses='' -c unix_socket_directories='$SOCK'" -l "$TMP/pg.log" start >/dev/null 2>&1
ok "cluster up at $SOCK (unix socket only; no TCP; no Supabase)"

STUBS='
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN;
CREATE SCHEMA auth;
CREATE TABLE auth.users (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email TEXT);
CREATE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql STABLE AS $$SELECT NULL::uuid$$;'

echo
echo "Apply auth stubs + exact migrations 001-025 in order"
Q postgres "$STUBS" >/dev/null
for f in supabase/migrations/0*.sql; do
  # RETARGET (EXLIB-2F): migration 026 now exists as the reviewed
  # apply-prep candidate (PREPARED, NOT APPLIED); this suite's claim
  # stays exactly "migrations 001-025", so 026+ is excluded here and
  # the 026 candidate is proven by scripts/verify-exlib2f-live.sh.
  case "$f" in supabase/migrations/02[6-9]_*) continue;; esac
  psql -h "$SOCK" -U postgres -d postgres -X -v ON_ERROR_STOP=1 -q -f "$f" >/dev/null 2>"$TMP/apply-err.log" \
    || { bad "migration failed: $f"; sed -n '1,5p' "$TMP/apply-err.log"; exit 1; }
done
ok "exact migrations 001-025 applied cleanly in order on PostgreSQL $(Q postgres 'SHOW server_version')"

echo
echo "Installed constraint definitions after 025"
EXPECT_DEF="CHECK ((equipment = ANY (ARRAY['barbell'::text, 'dumbbell'::text, 'cable'::text, 'machine'::text, 'bodyweight'::text, 'resistance_band'::text, 'kettlebell'::text, 'other'::text, 'weight_plate'::text, 'weighted_vest'::text, 'smith_machine'::text, 'sandbag'::text])))"
CONDEF_SQL="SELECT n.nspname || '.' || t.relname || '|' || c.conname || '|' || pg_get_constraintdef(c.oid) FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid JOIN pg_namespace n ON n.oid=t.relnamespace WHERE c.contype='c' AND pg_get_constraintdef(c.oid) ILIKE '%equipment%' ORDER BY 1;"
Q postgres "$CONDEF_SQL" > "$TMP/condefs.txt"
[ "$(wc -l < "$TMP/condefs.txt" | tr -d ' ')" = "2" ] \
  && ok "exactly two equipment CHECK constraints exist" \
  || { bad "unexpected equipment constraint count:"; cat "$TMP/condefs.txt"; }
grep -qF "public.exercises|exercises_equipment_check|$EXPECT_DEF" "$TMP/condefs.txt" \
  && ok "public.exercises: exercises_equipment_check has the exact 12-value definition" \
  || bad "tenant constraint mismatch: $(grep 'public.exercises' "$TMP/condefs.txt")"
grep -qF "public.exercise_catalog|exercise_catalog_equipment_check|$EXPECT_DEF" "$TMP/condefs.txt" \
  && ok "public.exercise_catalog: exercise_catalog_equipment_check has the exact 12-value definition" \
  || bad "catalog constraint mismatch: $(grep 'public.exercise_catalog' "$TMP/condefs.txt")"

echo
echo "Value acceptance on the tenant table"
TESTUID=$(Q postgres "INSERT INTO auth.users DEFAULT VALUES RETURNING id;")
i=0
for v in barbell dumbbell cable machine bodyweight resistance_band kettlebell other weight_plate weighted_vest smith_machine sandbag; do
  i=$((i+1))
  Q postgres "INSERT INTO public.exercises (user_id, name, category, primary_muscle, equipment, exercise_type, tracking_mode) VALUES ('$TESTUID', 'b3 live test $i', 'compound', 'chest', '$v', 'strength', 'weight_reps');" >/dev/null \
    && ok "equipment '$v' accepted" \
    || bad "equipment '$v' rejected"
done
if Q postgres "INSERT INTO public.exercises (user_id, name, category, primary_muscle, equipment, exercise_type, tracking_mode) VALUES ('$TESTUID', 'b3 live bad', 'compound', 'chest', 'trampoline', 'strength', 'weight_reps');" >/dev/null 2>&1; then
  bad "unknown equipment 'trampoline' was ACCEPTED"
else
  ok "unknown equipment 'trampoline' fails closed"
fi

echo
echo "Migration 024 unaffected"
IDX=$(Q postgres "SELECT count(*) FROM pg_indexes WHERE schemaname='public' AND indexname IN ('exercises_catalog_id_idx','exercise_aliases_catalog_alias_id_idx','exercise_catalog_run_items_catalog_id_idx','exercise_catalog_run_items_catalog_alias_id_idx');")
[ "$IDX" = "4" ] && ok "the four 024 indexes still exist" || bad "024 indexes missing: $IDX"
CFG=$(Q postgres "SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname IN ('exlib_verify_catalog_claims','exlib_verify_alias_lifecycle') AND p.proconfig::text = '{\"search_path=\\\"\\\"\"}';")
[ "$CFG" = "2" ] && ok "both 024 search_path pins intact" || bad "024 proconfig drifted: $CFG"

echo
echo "No content data and no ledger state in the database"
CATROWS=$(Q postgres "SELECT (SELECT count(*) FROM public.exercise_catalog) + (SELECT count(*) FROM public.exercise_catalog_aliases) + (SELECT count(*) FROM public.exercise_catalog_run_items) + (SELECT count(*) FROM public.exercise_catalog_review_events);")
[ "$CATROWS" = "0" ] && ok "catalog content tables remain 0/0/0/0" || bad "catalog rows appeared: $CATROWS"

echo
echo "Atomicity: second database with a forced mid-transaction failure"
# Build the schema fresh: apply 001-024 exactly, then sabotage.
# (Roles are cluster-wide and already exist from the first database.)
Q postgres "CREATE DATABASE atomic_test;" >/dev/null
Q atomic_test "CREATE SCHEMA auth; CREATE TABLE auth.users (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email TEXT); CREATE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql STABLE AS \$\$SELECT NULL::uuid\$\$;" >/dev/null
for f in supabase/migrations/0*.sql; do
  # RETARGET (EXLIB-2F): 026+ excluded (see the main loop's note).
  case "$f" in *025_*|supabase/migrations/02[6-9]_*) continue;; esac
  psql -h "$SOCK" -U postgres -d atomic_test -X -v ON_ERROR_STOP=1 -q -f "$f" >/dev/null 2>&1 \
    || { bad "atomic-test setup migration failed: $f"; exit 1; }
done
# Sabotage: drop the SECOND targeted constraint so 025's second DROP
# fails after the first replacement has already run in-transaction.
Q atomic_test "ALTER TABLE public.exercise_catalog DROP CONSTRAINT exercise_catalog_equipment_check;" >/dev/null
BEFORE_TENANT=$(Q atomic_test "SELECT pg_get_constraintdef(c.oid) FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid WHERE t.relname='exercises' AND c.conname='exercises_equipment_check';")
if psql -h "$SOCK" -U postgres -d atomic_test -X -v ON_ERROR_STOP=1 -q -f "$MIG025" >/dev/null 2>&1; then
  bad "sabotaged 025 unexpectedly SUCCEEDED"
else
  ok "sabotaged 025 failed closed (second DROP CONSTRAINT missing)"
fi
AFTER_TENANT=$(Q atomic_test "SELECT pg_get_constraintdef(c.oid) FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid WHERE t.relname='exercises' AND c.conname='exercises_equipment_check';")
[ "$BEFORE_TENANT" = "$AFTER_TENANT" ] \
  && ok "tenant CHECK byte-identical after failed 025 (atomic: first replacement rolled back)" \
  || bad "tenant CHECK drifted after failed 025"
case "$AFTER_TENANT" in
  *weight_plate*) bad "tenant CHECK gained new values despite rollback";;
  *) ok "tenant CHECK still the original 8-value definition (no half-application)";;
esac

echo
if [ "$FAIL" -eq 0 ]; then
  echo "$PASS passed, 0 failed"
else
  echo "$PASS passed, $FAIL failed"
  exit 1
fi
