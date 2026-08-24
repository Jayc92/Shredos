#!/bin/bash
# ============================================================
# ForgeFitOS - EXLIB-1B3B migration-024 LIVE verification.
#
# Runs the EXACT migration artifacts (023 then 024) against a
# DISPOSABLE LOCAL PostgreSQL cluster created in a temp directory
# (unix-socket only, no TCP, torn down on exit). This script NEVER
# contacts Supabase, Vercel, or any remote service. It is separate
# from, and does not weaken or repurpose, the approved migration-023
# concurrency script (verify-exlib1b2-live-concurrency.sh).
#
# Proves, executably:
#   * both fingerprints gate the run BEFORE initdb;
#   * migration 024 applies cleanly after 023;
#   * for both verify functions, ONLY proconfig changes
#     (prosrc/signature/result/security/volatility/parallel/owner/
#     ACL byte-identical before vs after) and the new setting is
#     exactly the empty-string search_path;
#   * exactly the four approved indexes exist afterward, with the
#     exact table, column, partial predicate, btree method, and
#     non-unique flag;
#   * the four indexes are ELIGIBLE for the intended referential
#     lookups (EXPLAIN with sequential scans disabled);
#   * both verifier functions return byte-identical output before
#     and after 024;
#   * 024 is ATOMIC: in a second database where one index name is
#     pre-created, 024 fails closed and leaves NOTHING behind.
#
# Run from the repository root:
#   bash scripts/verify-exlib1b3-live.sh
# ============================================================
set -euo pipefail

export LC_ALL=C LANG=C

MIG023="supabase/migrations/023_exlib_catalog_and_delivery_contract.sql"
MIG024="supabase/migrations/024_exlib_post_application_hardening.sql"
SHA023="0991448c39a558385431c78cef6d6063df208312a3f53866756ba730066c42f2"
BYTES023=92806
SHA024="190550ecdb99df702ab03d1b07592f861070141e5091eb25bc5bf45f211cc980"
BYTES024=3726

PASS=0
FAIL=0
ok()   { PASS=$((PASS+1)); printf '  PASS  %s\n' "$1"; }
bad()  { FAIL=$((FAIL+1)); printf '  FAIL  %s\n' "$1"; }

TMP="$(mktemp -d /tmp/exlib1b3-pg.XXXXXX)"
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
for spec in "$MIG023:$SHA023:$BYTES023" "$MIG024:$SHA024:$BYTES024"; do
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

ROLES='
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;'
STUBS='
CREATE SCHEMA auth;
CREATE TABLE auth.users (id UUID PRIMARY KEY);
CREATE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql STABLE AS $$SELECT NULL::uuid$$;
CREATE FUNCTION update_updated_at_column() RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, category TEXT NOT NULL, primary_muscle TEXT NOT NULL,
  equipment TEXT, exercise_type TEXT NOT NULL, tracking_mode TEXT NOT NULL,
  unilateral BOOLEAN NOT NULL DEFAULT false, notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true, is_system BOOLEAN NOT NULL DEFAULT false
);
CREATE UNIQUE INDEX exercises_user_name_unique_idx ON exercises (user_id, lower(name));
CREATE TABLE exercise_muscles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  muscle TEXT NOT NULL, role TEXT NOT NULL,
  UNIQUE (exercise_id, muscle)
);'

echo
echo "Apply stubs + exact 023 + snapshot + exact 024"
Q postgres "$ROLES" >/dev/null
Q postgres "$STUBS" >/dev/null
psql -h "$SOCK" -U postgres -d postgres -X -v ON_ERROR_STOP=1 -q -f "$MIG023" >/dev/null
ok "stubs + migration 023 applied"

FN_IDENTITY="SELECT p.proname || '|' || md5(p.prosrc) || '|' || pg_get_function_identity_arguments(p.oid) || '|' || pg_get_function_result(p.oid) || '|' || p.prosecdef::text || '|' || p.provolatile::text || '|' || p.proparallel::text || '|' || pg_get_userbyid(p.proowner) || '|' || COALESCE(p.proacl::text,'(null)') FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname IN ('exlib_verify_catalog_claims','exlib_verify_alias_lifecycle') ORDER BY p.proname;"
FN_CONFIG="SELECT p.proname || '|' || COALESCE(p.proconfig::text,'(null)') FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname IN ('exlib_verify_catalog_claims','exlib_verify_alias_lifecycle') ORDER BY p.proname;"

Q postgres "$FN_IDENTITY" > "$TMP/fn-before.txt"
Q postgres "$FN_CONFIG" > "$TMP/cfg-before.txt"
OUT_CLAIMS_BEFORE=$(Q postgres "SELECT * FROM public.exlib_verify_catalog_claims();")
OUT_LIFE_BEFORE=$(Q postgres "SELECT * FROM public.exlib_verify_alias_lifecycle();")
PRE_IDX=$(Q postgres "SELECT count(*) FROM pg_indexes WHERE schemaname='public' AND indexname IN ('exercises_catalog_id_idx','exercise_aliases_catalog_alias_id_idx','exercise_catalog_run_items_catalog_id_idx','exercise_catalog_run_items_catalog_alias_id_idx');")
[ "$PRE_IDX" = "0" ] && ok "the four proposed index names do not exist before 024" \
                     || bad "unexpected pre-existing index names: $PRE_IDX"

psql -h "$SOCK" -U postgres -d postgres -X -v ON_ERROR_STOP=1 -q -f "$MIG024" >/dev/null
ok "migration 024 applied cleanly on vanilla PostgreSQL $(Q postgres 'SHOW server_version')"

echo
echo "Function identity: only proconfig changes"
Q postgres "$FN_IDENTITY" > "$TMP/fn-after.txt"
Q postgres "$FN_CONFIG" > "$TMP/cfg-after.txt"
if diff -q "$TMP/fn-before.txt" "$TMP/fn-after.txt" >/dev/null; then
  ok "prosrc/signature/result/security/volatility/parallel/owner/ACL byte-identical before vs after"
else
  bad "function identity drifted:"; diff "$TMP/fn-before.txt" "$TMP/fn-after.txt" || true
fi
grep -q 'exlib_verify_catalog_claims|(null)' "$TMP/cfg-before.txt" \
  && grep -q 'exlib_verify_alias_lifecycle|(null)' "$TMP/cfg-before.txt" \
  && ok "proconfig before: unset for both (the lint-0011 state)" \
  || bad "unexpected proconfig before: $(cat "$TMP/cfg-before.txt")"
EXPECTED_CFG='{"search_path=\"\""}'
if [ "$(grep -cF "|${EXPECTED_CFG}" "$TMP/cfg-after.txt")" = "2" ]; then
  ok "proconfig after: exactly the empty-string search_path pin on both"
else
  bad "unexpected proconfig after: $(cat "$TMP/cfg-after.txt")"
fi
[ "$(Q postgres "SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname LIKE 'exlib_%' AND p.proconfig IS NULL;")" = "0" ] \
  && ok "zero exlib functions remain without a pinned search_path" \
  || bad "some exlib functions still lack a pinned search_path"

echo
echo "Verifier behavior identical before/after"
OUT_CLAIMS_AFTER=$(Q postgres "SELECT * FROM public.exlib_verify_catalog_claims();")
OUT_LIFE_AFTER=$(Q postgres "SELECT * FROM public.exlib_verify_alias_lifecycle();")
[ "$OUT_CLAIMS_BEFORE" = "$OUT_CLAIMS_AFTER" ] && [ "$OUT_LIFE_BEFORE" = "$OUT_LIFE_AFTER" ] \
  && ok "outputs byte-identical (claims '$OUT_CLAIMS_AFTER'; lifecycle '$OUT_LIFE_AFTER')" \
  || bad "outputs drifted: claims '$OUT_CLAIMS_BEFORE'->'$OUT_CLAIMS_AFTER' lifecycle '$OUT_LIFE_BEFORE'->'$OUT_LIFE_AFTER'"

echo
echo "Index shape verification"
check_index() {
  local name="$1" expected="$2"
  local def uniq
  def=$(Q postgres "SELECT indexdef FROM pg_indexes WHERE schemaname='public' AND indexname='$name';")
  uniq=$(Q postgres "SELECT i.indisunique FROM pg_index i JOIN pg_class c ON c.oid=i.indexrelid WHERE c.relname='$name';")
  if [ "$def" = "$expected" ] && [ "$uniq" = "f" ]; then
    ok "$name: exact definition, btree, partial, non-unique"
  else
    bad "$name: def='$def' unique='$uniq'"
  fi
}
check_index exercises_catalog_id_idx \
  "CREATE INDEX exercises_catalog_id_idx ON public.exercises USING btree (catalog_id) WHERE (catalog_id IS NOT NULL)"
check_index exercise_aliases_catalog_alias_id_idx \
  "CREATE INDEX exercise_aliases_catalog_alias_id_idx ON public.exercise_aliases USING btree (catalog_alias_id) WHERE (catalog_alias_id IS NOT NULL)"
check_index exercise_catalog_run_items_catalog_id_idx \
  "CREATE INDEX exercise_catalog_run_items_catalog_id_idx ON public.exercise_catalog_run_items USING btree (catalog_id) WHERE (catalog_id IS NOT NULL)"
check_index exercise_catalog_run_items_catalog_alias_id_idx \
  "CREATE INDEX exercise_catalog_run_items_catalog_alias_id_idx ON public.exercise_catalog_run_items USING btree (catalog_alias_id) WHERE (catalog_alias_id IS NOT NULL)"
POST_IDX=$(Q postgres "SELECT count(*) FROM pg_indexes WHERE schemaname='public' AND indexname IN ('exercises_catalog_id_idx','exercise_aliases_catalog_alias_id_idx','exercise_catalog_run_items_catalog_id_idx','exercise_catalog_run_items_catalog_alias_id_idx');")
[ "$POST_IDX" = "4" ] && ok "exactly four new indexes exist" || bad "index count: $POST_IDX"

echo
echo "Referential-lookup eligibility (EXPLAIN, sequential scans disabled)"
explain_uses() {
  local name="$1" sql="$2" plan
  plan=$(Q postgres "SET enable_seqscan = off; EXPLAIN (COSTS OFF) $sql")
  if printf '%s' "$plan" | grep -q "$name"; then
    ok "$name is eligible for its referential lookup"
  else
    bad "$name not chosen; plan: $plan"
  fi
}
explain_uses exercises_catalog_id_idx \
  "SELECT 1 FROM public.exercises WHERE catalog_id = '00000000-0000-0000-0000-000000000001';"
explain_uses exercise_aliases_catalog_alias_id_idx \
  "SELECT 1 FROM public.exercise_aliases WHERE catalog_alias_id = '00000000-0000-0000-0000-000000000001';"
explain_uses exercise_catalog_run_items_catalog_id_idx \
  "SELECT 1 FROM public.exercise_catalog_run_items WHERE catalog_id = '00000000-0000-0000-0000-000000000001';"
explain_uses exercise_catalog_run_items_catalog_alias_id_idx \
  "SELECT 1 FROM public.exercise_catalog_run_items WHERE catalog_alias_id = '00000000-0000-0000-0000-000000000001';"

echo
echo "Atomicity: a colliding object fails the WHOLE migration closed"
Q postgres "CREATE DATABASE t2;" >/dev/null
Q t2 "$STUBS" >/dev/null
psql -h "$SOCK" -U postgres -d t2 -X -v ON_ERROR_STOP=1 -q -f "$MIG023" >/dev/null
Q t2 "CREATE INDEX exercises_catalog_id_idx ON public.exercises (catalog_id) WHERE catalog_id IS NOT NULL;" >/dev/null
if psql -h "$SOCK" -U postgres -d t2 -X -v ON_ERROR_STOP=1 -q -f "$MIG024" >/dev/null 2>"$TMP/atomic.err"; then
  bad "024 unexpectedly succeeded despite the colliding index"
else
  grep -q "already exists" "$TMP/atomic.err" \
    && ok "024 failed closed on the pre-existing object (no IF NOT EXISTS escape hatch)" \
    || bad "024 failed with an unexpected error: $(cat "$TMP/atomic.err")"
fi
CFG_T2=$(Q t2 "SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname IN ('exlib_verify_catalog_claims','exlib_verify_alias_lifecycle') AND p.proconfig IS NOT NULL;")
OTHERS_T2=$(Q t2 "SELECT count(*) FROM pg_indexes WHERE schemaname='public' AND indexname IN ('exercise_aliases_catalog_alias_id_idx','exercise_catalog_run_items_catalog_id_idx','exercise_catalog_run_items_catalog_alias_id_idx');")
[ "$CFG_T2" = "0" ] && [ "$OTHERS_T2" = "0" ] \
  && ok "NOTHING persisted from the failed run: proconfig unchanged, zero other indexes (atomic)" \
  || bad "failed run left residue: proconfig-set=$CFG_T2 other-indexes=$OTHERS_T2"

echo
echo "$PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ] || exit 1
