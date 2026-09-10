#!/bin/bash
# ============================================================
# ForgeFitOS — W2: installed tracking-mode CHECK constraint-name
# discovery on a DISPOSABLE local database.
# (docs/weight-time-coordinated-implementation-plan.md §2, §10.3(1),
#  §16 W2.)
#
# Both tracking_mode CHECK constraints are UNNAMED inline constraints
# in the committed SQL:
#   010_phase2r_exercise_tracking_modes.sql:26-28      (public.exercises)
#   023_exlib_catalog_and_delivery_contract.sql:384-385 (public.exercise_catalog)
# PostgreSQL assigns their installed names at CREATE time, so the names
# migration 028 must DROP are not in the tree. This script derives them
# MECHANICALLY, the way migration 025 did for the equipment CHECKs
# (docs/exlib1c0b3-coordinated-equipment-implementation.md §2): it
# applies the exact committed migrations 001-027 — the sequence the
# EXLIB-2M application record documents as in effect on hosted ShredOS
# — to a disposable local PostgreSQL cluster (temp dir, unix socket
# only, no TCP, torn down on exit) and reads pg_constraint.
#
# This script NEVER contacts Supabase, Vercel, or any remote service.
#
# Proves, executably:
#   * supabase/migrations is clean in git, so what is applied is exactly
#     the committed bytes at the printed HEAD;
#   * the repository holds exactly the 27 numbered migrations 001-027
#     (a 028 appearing would make this discovery stale => fail closed);
#   * migrations 001-027 apply cleanly in order;
#   * exactly two CHECK constraints mention tracking_mode, one per
#     table, and both carry the exact 4-value definition the tree
#     implies — the baseline that 028 will replace;
#   * the installed names, printed verbatim for the W2 record.
#
# Run from anywhere (the script resolves the repository root itself):
#   bash scripts/discover-tracking-mode-constraint-names-live.sh
# ============================================================
set -euo pipefail

export LC_ALL=C LANG=C

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PASS=0
FAIL=0
ok()   { PASS=$((PASS+1)); printf '  PASS  %s\n' "$1"; }
bad()  { FAIL=$((FAIL+1)); printf '  FAIL  %s\n' "$1"; }

TMP="$(mktemp -d /tmp/wt-w2-pg.XXXXXX)"
PGDATA="$TMP/pgdata"
SOCK="$TMP"
cleanup() {
  pg_ctl -D "$PGDATA" stop -m immediate >/dev/null 2>&1 || true
  rm -rf "$TMP"
}
trap cleanup EXIT

Q() { psql -h "$SOCK" -U postgres -d "$1" -X -v ON_ERROR_STOP=1 -qtA -c "$2"; }

echo
echo "Repository state (what will be applied)"
HEAD_SHA="$(git -C "$ROOT" rev-parse HEAD)"
echo "  root=$ROOT"
echo "  HEAD=$HEAD_SHA"
DIRTY="$(git -C "$ROOT" status --porcelain -- supabase/migrations)"
if [ -z "$DIRTY" ]; then
  ok "supabase/migrations is clean in git (applied bytes = committed bytes at HEAD)"
else
  bad "supabase/migrations has uncommitted changes — refusing to derive names from an uncommitted tree:"
  echo "$DIRTY"
  exit 1
fi
MIGS=(supabase/migrations/0*.sql)
COUNT=${#MIGS[@]}
LAST="$(basename "${MIGS[$((COUNT-1))]}")"
if [ "$COUNT" = "27" ] && [ "${LAST:0:3}" = "027" ]; then
  ok "exactly 27 numbered migrations present, last = $LAST"
else
  bad "expected exactly 27 migrations ending at 027, found $COUNT ending at $LAST — this discovery would be stale"
  exit 1
fi
for f in "${MIGS[@]}"; do
  printf '%s  %s\n' "$(shasum -a 256 "$f" | awk '{print $1}')" "$f"
done > "$TMP/manifest.txt"
echo "  applied-file manifest (sha256 of each file, in order) digest: $(shasum -a 256 "$TMP/manifest.txt" | awk '{print $1}')"

echo
echo "Disposable cluster"
initdb -D "$PGDATA" -U postgres --no-locale -E UTF8 >/dev/null 2>&1
pg_ctl -D "$PGDATA" -o "-c listen_addresses='' -c unix_socket_directories='$SOCK'" -l "$TMP/pg.log" start >/dev/null 2>&1
ok "cluster up at $SOCK (unix socket only; no TCP; no Supabase); PostgreSQL $(Q postgres 'SHOW server_version')"

STUBS='
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN;
CREATE SCHEMA auth;
CREATE TABLE auth.users (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email TEXT);
CREATE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql STABLE AS $$SELECT NULL::uuid$$;'

echo
echo "Apply auth stubs + exact migrations 001-027 in order"
Q postgres "$STUBS" >/dev/null
for f in "${MIGS[@]}"; do
  psql -h "$SOCK" -U postgres -d postgres -X -v ON_ERROR_STOP=1 -q -f "$f" >/dev/null 2>"$TMP/apply-err.log" \
    || { bad "migration failed: $f"; sed -n '1,5p' "$TMP/apply-err.log"; exit 1; }
done
ok "exact migrations 001-027 applied cleanly in order"

echo
echo "Installed CHECK constraints mentioning tracking_mode (pg_constraint, verbatim: schema.table|conname|definition)"
EXPECT_DEF="CHECK ((tracking_mode = ANY (ARRAY['weight_reps'::text, 'bodyweight'::text, 'cardio'::text, 'timed'::text])))"
CONDEF_SQL="SELECT n.nspname || '.' || t.relname || '|' || c.conname || '|' || pg_get_constraintdef(c.oid) FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid JOIN pg_namespace n ON n.oid=t.relnamespace WHERE c.contype='c' AND pg_get_constraintdef(c.oid) ILIKE '%tracking_mode%' ORDER BY 1;"
Q postgres "$CONDEF_SQL" > "$TMP/condefs.txt"
sed 's/^/  /' "$TMP/condefs.txt"
if [ "$(wc -l < "$TMP/condefs.txt" | tr -d ' ')" = "2" ]; then
  ok "exactly two CHECK constraints mention tracking_mode"
else
  bad "unexpected number of tracking_mode CHECK constraints"
fi
TENANT_ROW="$(awk -F'|' '$1=="public.exercises"' "$TMP/condefs.txt")"
CATALOG_ROW="$(awk -F'|' '$1=="public.exercise_catalog"' "$TMP/condefs.txt")"
TENANT_NAME="$(printf '%s' "$TENANT_ROW" | cut -d'|' -f2)"
CATALOG_NAME="$(printf '%s' "$CATALOG_ROW" | cut -d'|' -f2)"
TENANT_DEF="$(printf '%s' "$TENANT_ROW" | cut -d'|' -f3-)"
CATALOG_DEF="$(printf '%s' "$CATALOG_ROW" | cut -d'|' -f3-)"
[ -n "$TENANT_NAME" ] && ok "public.exercises carries a tracking_mode CHECK named '$TENANT_NAME'" || bad "no tracking_mode CHECK found on public.exercises"
[ -n "$CATALOG_NAME" ] && ok "public.exercise_catalog carries a tracking_mode CHECK named '$CATALOG_NAME'" || bad "no tracking_mode CHECK found on public.exercise_catalog"
[ "$TENANT_DEF" = "$EXPECT_DEF" ] && ok "public.exercises definition is the exact 4-value baseline" || bad "public.exercises definition differs from the expected 4-value baseline: $TENANT_DEF"
[ "$CATALOG_DEF" = "$EXPECT_DEF" ] && ok "public.exercise_catalog definition is the exact 4-value baseline" || bad "public.exercise_catalog definition differs from the expected 4-value baseline: $CATALOG_DEF"

# The names are read, not assumed. For the record: PostgreSQL names an
# inline column CHECK <table>_<column>_check unless that name is taken;
# the read below is what settles it, not that rule.
echo
echo "DISCOVERED INSTALLED NAMES (what migration 028's DROP CONSTRAINT must target)"
echo "  public.exercises.tracking_mode         => $TENANT_NAME"
echo "  public.exercise_catalog.tracking_mode  => $CATALOG_NAME"

echo
if [ "$FAIL" -eq 0 ]; then
  echo "$PASS passed, 0 failed"
else
  echo "$PASS passed, $FAIL failed"
  exit 1
fi
