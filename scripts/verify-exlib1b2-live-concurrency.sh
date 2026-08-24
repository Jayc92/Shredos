#!/bin/bash
# ============================================================
# ForgeFitOS - EXLIB-1B2 migration-023 LIVE concurrency and
# review-evidence regression proofs (Revision G).
#
# Runs the EXACT migration artifact
# (supabase/migrations/023_exlib_catalog_and_delivery_contract.sql)
# against a DISPOSABLE LOCAL PostgreSQL cluster created in a temp
# directory (unix-socket only, no TCP, torn down on exit). This
# script NEVER contacts Supabase, Vercel, or any remote service.
#
# Proves, executably:
#   Finding 1 (anatomy/review race):
#     I1. anatomy locks the parent snapshot first -> a concurrent
#         review approval BLOCKS and proceeds only after the anatomy
#         transaction commits;
#     I2. approval locks the parent snapshot first -> a concurrent
#         anatomy INSERT BLOCKS, then observes the non-pending
#         status and FAILS (anatomy stays exactly the reviewed set).
#   Finding 2 (fresh, complete, append-only review evidence):
#     E1-E9 single-session cases listed inline below.
#
# Run from the repository root:
#   bash scripts/verify-exlib1b2-live-concurrency.sh
# Requires: initdb / pg_ctl / psql on PATH (Homebrew postgresql@16).
# NOT part of the deterministic offline battery (shell script, run
# on demand; the offline battery stays scripts/verify-*.ts).
# ============================================================
set -uo pipefail

# macOS: without a concrete locale the postmaster aborts with
# "postmaster became multithreaded during startup".
export LC_ALL=C LANG=C

MIG="supabase/migrations/023_exlib_catalog_and_delivery_contract.sql"

# The ONLY artifact this suite may exercise is the exact reviewed and
# approved Revision G migration. Verified below BEFORE initdb or any
# SQL execution; anything else fails closed immediately.
APPROVED_SHA256="7653b4c87835b0318f8a298855571ddcfe2ffef4ed00fa8e9178f252491e9f92"
APPROVED_BYTES=91382
TMP="$(mktemp -d /tmp/exlib1b2-pg.XXXXXX)"
PGDATA="$TMP/pgdata"
SOCK="$TMP"
PSQL=(psql -h "$SOCK" -U postgres -d postgres -X -v ON_ERROR_STOP=1 -qtA)

PASS=0
FAIL=0
note() { printf '  %s\n' "$1"; }
ok()   { PASS=$((PASS+1)); printf '  PASS  %s\n' "$1"; }
bad()  { FAIL=$((FAIL+1)); printf '  FAIL  %s\n' "$1"; }

cleanup() {
  pg_ctl -D "$PGDATA" stop -m immediate >/dev/null 2>&1 || true
  rm -rf "$TMP"
}
trap cleanup EXIT

now_ms() { python3 -c 'import time; print(int(time.time()*1000))'; }

echo
echo "Approved-fingerprint gate (before initdb or any SQL execution)"
ACTUAL_SHA256=$(shasum -a 256 "$MIG" | awk '{print $1}')
ACTUAL_BYTES=$(wc -c < "$MIG" | tr -d ' ')
if [ "$ACTUAL_SHA256" != "$APPROVED_SHA256" ] || [ "$ACTUAL_BYTES" != "$APPROVED_BYTES" ]; then
  printf '  FAIL  fingerprint gate: %s is NOT the approved Revision G artifact\n' "$MIG"
  printf '        expected sha256=%s bytes=%s\n' "$APPROVED_SHA256" "$APPROVED_BYTES"
  printf '        actual   sha256=%s bytes=%s\n' "$ACTUAL_SHA256" "$ACTUAL_BYTES"
  exit 1
fi
ok "fingerprint gate: $MIG matches approved Revision G ($APPROVED_BYTES bytes, sha256 $ACTUAL_SHA256)"

# expect_ok "name" "sql"
expect_ok() {
  if OUT=$("${PSQL[@]}" -c "$2" 2>&1); then ok "$1"; else bad "$1 - unexpected error: $OUT"; fi
}
# expect_fail "name" "required error substring" "sql"
expect_fail() {
  if OUT=$("${PSQL[@]}" -c "$3" 2>&1); then
    bad "$1 - unexpectedly succeeded"
  elif printf '%s' "$OUT" | grep -qF "$2"; then
    ok "$1"
  else
    bad "$1 - failed with the WRONG error: $OUT"
  fi
}

echo
echo "Disposable cluster"
initdb -D "$PGDATA" -U postgres --no-locale -E UTF8 >/dev/null 2>&1 || { echo "initdb failed"; exit 1; }
pg_ctl -D "$PGDATA" -o "-c listen_addresses='' -c unix_socket_directories='$SOCK'" -l "$TMP/pg.log" start >/dev/null 2>&1 \
  || { echo "pg_ctl start failed"; cat "$TMP/pg.log"; exit 1; }
note "cluster up at $SOCK (unix socket only; no TCP; no Supabase)"

echo
echo "Prerequisite stubs (roles, auth schema, pre-023 objects)"
"${PSQL[@]}" >/dev/null <<'SQL' || { echo "prerequisite setup failed"; exit 1; }
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE SCHEMA auth;
CREATE TABLE auth.users (id UUID PRIMARY KEY);
CREATE FUNCTION auth.uid() RETURNS UUID
  LANGUAGE sql STABLE AS 'SELECT NULL::uuid';
CREATE FUNCTION update_updated_at_column() RETURNS TRIGGER
  LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;
-- Minimal faithful pre-023 tenant tables (shapes 023 depends on).
CREATE TABLE exercises (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  category       TEXT NOT NULL,
  primary_muscle TEXT NOT NULL,
  equipment      TEXT,
  exercise_type  TEXT NOT NULL,
  tracking_mode  TEXT NOT NULL,
  unilateral     BOOLEAN NOT NULL DEFAULT false,
  notes          TEXT,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  is_system      BOOLEAN NOT NULL DEFAULT false
);
CREATE UNIQUE INDEX exercises_user_name_unique_idx
  ON exercises (user_id, lower(name));
CREATE TABLE exercise_muscles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  muscle      TEXT NOT NULL,
  role        TEXT NOT NULL,
  UNIQUE (exercise_id, muscle)
);
SQL
ok "stubs created"

echo
echo "Apply the EXACT migration artifact"
if "${PSQL[@]}" -f "$MIG" >/dev/null 2>"$TMP/apply.err"; then
  ok "023 applied cleanly on vanilla PostgreSQL $(psql -h "$SOCK" -U postgres -d postgres -qtAX -c 'SHOW server_version')"
else
  bad "023 failed to apply:"; cat "$TMP/apply.err"; exit 1
fi

L1='11111111-1111-1111-1111-111111111111'
L2='11111111-1111-1111-1111-111111111112'
L3='11111111-1111-1111-1111-111111111113'
S1='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'
S2='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'
S3='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3'
SNAP="INSERT INTO exercise_catalog (id, logical_id, canonical_name, category, primary_muscle, equipment, laterality, tracking_mode, source_url, source_page, retrieved_at, import_confidence)"

echo
echo "Finding 2 - fresh, complete, append-only review evidence"
expect_ok "seed: logical identities" \
  "INSERT INTO exercise_catalog_logical (id) VALUES ('$L1'), ('$L2'), ('$L3');"
expect_fail "E1: a snapshot inserted WITH audit evidence fails (born pending + NULL audit)" \
  "review" \
  "$SNAP, reviewed_by VALUES ('$S1','$L1','Test Row A','compound','lats','barbell','bilateral','weight_reps','https://example.test/a','https://example.test/dir','2026-08-20','high','someone');"
expect_ok "E2: a clean pending snapshot (NULL audit) inserts" \
  "$SNAP VALUES ('$S1','$L1','Test Row A','compound','lats','barbell','bilateral','weight_reps','https://example.test/a','https://example.test/dir','2026-08-20','high');"
expect_fail "E3: pending -> approved WITHOUT an audit tuple fails" \
  "complete, non-blank audit tuple" \
  "UPDATE exercise_catalog SET review_status='approved' WHERE id='$S1';"
expect_fail "E4: pending -> approved with a BLANK reviewer fails" \
  "audit" \
  "UPDATE exercise_catalog SET review_status='approved', reviewed_by='   ', reviewed_at=NOW(), review_rationale='looks right' WHERE id='$S1';"
expect_ok "E5: pending -> approved with a complete fresh tuple succeeds" \
  "UPDATE exercise_catalog SET review_status='approved', reviewed_by='reviewer-one', reviewed_at=NOW(), review_rationale='anatomy and naming verified' WHERE id='$S1';"
expect_fail "E6: same-status audit rewriting fails" \
  "only together with an allowed review_status transition" \
  "UPDATE exercise_catalog SET review_rationale='rewritten later' WHERE id='$S1';"
expect_fail "E7: approved -> rejected REUSING the approval tuple fails (stale/misattributed evidence)" \
  "FRESH evidence" \
  "UPDATE exercise_catalog SET review_status='rejected' WHERE id='$S1';"
expect_ok "E7b: approved -> rejected WITH a fresh rejection tuple succeeds" \
  "UPDATE exercise_catalog SET review_status='rejected', reviewed_by='reviewer-two', reviewed_at=NOW(), review_rationale='withdrawn after complaint' WHERE id='$S1';"
expect_fail "E8: rejected is terminal (and pending is unreachable)" \
  "one-way" \
  "UPDATE exercise_catalog SET review_status='pending', reviewed_by=NULL, reviewed_at=NULL, review_rationale=NULL WHERE id='$S1';"
EV=$("${PSQL[@]}" -c "SELECT count(*) || ':' || string_agg(from_status || '>' || to_status, ',' ORDER BY created_at) FROM exercise_catalog_review_events WHERE catalog_id='$S1';" 2>&1)
if [ "$EV" = "2:pending>approved,approved>rejected" ]; then
  ok "E9: the evidence log holds exactly the two decisions in order ($EV)"
else
  bad "E9: unexpected evidence log: $EV"
fi
expect_fail "E10: the evidence log is append-only (UPDATE fails)" \
  "append-only" \
  "UPDATE exercise_catalog_review_events SET review_rationale='x' WHERE catalog_id='$S1';"
expect_fail "E11: the evidence log is append-only (DELETE fails)" \
  "append-only" \
  "DELETE FROM exercise_catalog_review_events WHERE catalog_id='$S1';"
expect_fail "E12: direct INSERT into the evidence log fails (trigger-context only)" \
  "written only by the snapshot review transition trigger" \
  "INSERT INTO exercise_catalog_review_events (catalog_id, from_status, to_status, reviewed_by, reviewed_at, review_rationale) VALUES ('$S1','pending','approved','forger',NOW(),'fabricated');"
expect_fail "E13: anatomy INSERT on a decided (non-pending) snapshot fails" \
  "sealed once its snapshot leaves pending review" \
  "INSERT INTO exercise_catalog_muscles (catalog_id, muscle, role) VALUES ('$S1','traps','secondary');"

echo
echo "Finding 1 - two-session anatomy/review interleavings"
expect_ok "seed: pending snapshot for interleaving I1" \
  "$SNAP VALUES ('$S2','$L2','Test Row B','compound','quads','barbell','bilateral','weight_reps','https://example.test/b','https://example.test/dir','2026-08-20','high');"

# I1: anatomy takes the parent lock FIRST; approval must WAIT and
# then proceed only after the anatomy transaction completes.
"${PSQL[@]}" -c "BEGIN; INSERT INTO exercise_catalog_muscles (catalog_id, muscle, role) VALUES ('$S2','hamstrings','secondary'); SELECT pg_sleep(3); COMMIT;" >/dev/null 2>"$TMP/i1a.err" &
A_PID=$!
sleep 1
T0=$(now_ms)
if OUT=$("${PSQL[@]}" -c "UPDATE exercise_catalog SET review_status='approved', reviewed_by='reviewer-one', reviewed_at=NOW(), review_rationale='approved after anatomy landed' WHERE id='$S2';" 2>&1); then
  T1=$(now_ms); EL=$((T1-T0))
  if [ "$EL" -ge 1500 ]; then
    ok "I1: approval BLOCKED on the anatomy session's lock (${EL}ms) and proceeded only after it committed"
  else
    bad "I1: approval did NOT block (${EL}ms) - the race is open"
  fi
else
  bad "I1: approval failed unexpectedly: $OUT"
fi
wait "$A_PID" || bad "I1: anatomy session errored: $(cat "$TMP/i1a.err")"
CNT=$("${PSQL[@]}" -c "SELECT count(*) FROM exercise_catalog_muscles WHERE catalog_id='$S2';")
[ "$CNT" = "1" ] && ok "I1b: the approved snapshot's anatomy is exactly the pre-approval set (1 row)" \
                 || bad "I1b: unexpected anatomy count: $CNT"

expect_ok "seed: pending snapshot for interleaving I2" \
  "$SNAP VALUES ('$S3','$L3','Test Row C','compound','chest','barbell','bilateral','weight_reps','https://example.test/c','https://example.test/dir','2026-08-20','high');"

# I2: approval takes the parent lock FIRST; anatomy must WAIT, then
# see the committed non-pending status and FAIL.
"${PSQL[@]}" -c "BEGIN; UPDATE exercise_catalog SET review_status='approved', reviewed_by='reviewer-one', reviewed_at=NOW(), review_rationale='approved before late anatomy' WHERE id='$S3'; SELECT pg_sleep(3); COMMIT;" >/dev/null 2>"$TMP/i2a.err" &
B_PID=$!
sleep 1
T0=$(now_ms)
if OUT=$("${PSQL[@]}" -c "INSERT INTO exercise_catalog_muscles (catalog_id, muscle, role) VALUES ('$S3','triceps','secondary');" 2>&1); then
  bad "I2: late anatomy INSERT unexpectedly succeeded - the race is open"
else
  T1=$(now_ms); EL=$((T1-T0))
  if printf '%s' "$OUT" | grep -qF "sealed once its snapshot leaves pending review"; then
    if [ "$EL" -ge 1500 ]; then
      ok "I2: late anatomy BLOCKED on the approval's lock (${EL}ms), then saw non-pending and FAILED correctly"
    else
      bad "I2: anatomy failed with the right error but did not block (${EL}ms)"
    fi
  else
    bad "I2: anatomy failed with the WRONG error: $OUT"
  fi
fi
wait "$B_PID" || bad "I2: approval session errored: $(cat "$TMP/i2a.err")"
CNT=$("${PSQL[@]}" -c "SELECT count(*) FROM exercise_catalog_muscles WHERE catalog_id='$S3';")
[ "$CNT" = "0" ] && ok "I2b: the approved snapshot gained NO anatomy outside the reviewed set (0 rows)" \
                 || bad "I2b: unexpected anatomy count: $CNT"

echo
echo "$PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ] || exit 1
