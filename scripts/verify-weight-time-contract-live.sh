#!/bin/bash
# ============================================================
# ForgeFitOS — weight_time CONTRACT proof on a DISPOSABLE local database.
#
# W5: RED-first. Authored BEFORE migration 028, to demonstrate that the
#     CURRENT committed migrations cannot express, or actively reject, the
#     approved weight_time contract, and that no tracking-mode history
#     guard exists at the database boundary.
# W6: the SAME suite is migration 028's disposable-DB test. It must go
#     GREEN with no assertion weakened, and its structural section then
#     also proves 028's shape (CHECK names/definitions, the trigger, the
#     two explicit deliver_catalog_exercises arms, atomicity, controls).
# (docs/weight-time-coordinated-implementation-plan.md §5.4, §12.1, §16.)
#
# This script NEVER contacts Supabase, Vercel, or any remote service. It
# runs a throwaway PostgreSQL cluster in a temp directory (unix socket
# only, no TCP, torn down on exit) and applies EVERY committed migration
# under supabase/migrations/ in order — 001-027 today, 001-028 once W6
# lands — so the verdict always describes the committed tree.
#
# HOW TO READ THE RESULT
#   Every check asserts the APPROVED CONTRACT. PASS = the contract holds on
#   the committed migrations; FAIL = it does not (yet). At W5 the
#   weight_time and guard sections are expected to FAIL; the legacy-mode
#   regression section must PASS at every step. Exit 1 while any check
#   fails.
#
# AUTHORITY MODEL ON THE DISPOSABLE CLUSTER
#   The roles anon/authenticated/service_role exist; auth.uid() is stubbed
#   to read the session GUC app.uid, so a statement run as
#     SET ROLE authenticated; SET app.uid = '<uuid>';
#   executes under the REAL row-level-security policies of the migrations
#   (003 grants the four workout tables to authenticated). That is the
#   local equivalent of a Data API call and is how every "as user" step
#   below is issued.
#
# Run from anywhere:
#   bash scripts/verify-weight-time-contract-live.sh
# ============================================================
set -uo pipefail
export LC_ALL=C LANG=C

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PASS=0
FAIL=0
ok()  { PASS=$((PASS+1)); printf '  PASS  %s\n' "$1"; }
bad() { FAIL=$((FAIL+1)); printf '  FAIL  %s\n' "$1"; }
now() { perl -MTime::HiRes=time -e 'printf "%.3f\n", time'; }

TMP="$(mktemp -d /tmp/wt-contract-pg.XXXXXX)"
PGDATA="$TMP/pgdata"
SOCK="$TMP"
cleanup() {
  pg_ctl -D "$PGDATA" stop -m immediate >/dev/null 2>&1 || true
  rm -rf "$TMP"
}
trap cleanup EXIT

# Q <db> <sql>            : as the cluster superuser (fixtures, catalog reads)
# AS_USER <db> <uid> <sql>: as the authenticated role for that user, under RLS
Q()       { psql -h "$SOCK" -U postgres -d "$1" -X -v ON_ERROR_STOP=1 -qtA -c "$2"; }
AS_USER() { psql -h "$SOCK" -U postgres -d "$1" -X -v ON_ERROR_STOP=1 -qtA -c "SET ROLE authenticated; SET app.uid = '$2'; $3"; }

# expect_ok  <name> <cmd...>          : the statement must succeed
# expect_err <name> <token> <cmd...>  : the statement must fail AND mention <token>
expect_ok()  { local name="$1"; shift; local out; out="$("$@" 2>&1)"; local code=$?; if [ $code -eq 0 ]; then ok "$name"; else bad "$name — got exit=$code: $(printf '%s' "$out" | head -1)"; fi; }
expect_err() { local name="$1" token="$2"; shift 2; local out; out="$("$@" 2>&1)"; local code=$?; if [ $code -ne 0 ] && printf '%s' "$out" | grep -q "$token"; then ok "$name"; else bad "$name — expected error containing '$token', got exit=$code: $(printf '%s' "$out" | head -1)"; fi; }

echo
echo "Repository state"
HEAD_SHA="$(git -C "$ROOT" rev-parse HEAD)"
echo "  root=$ROOT"
echo "  HEAD=$HEAD_SHA"
MIGS=(supabase/migrations/0*.sql)
MIG_COUNT=${#MIGS[@]}
MIG028=""
for f in "${MIGS[@]}"; do case "$(basename "$f")" in 028_*) MIG028="$f";; esac; done
echo "  committed migrations: $MIG_COUNT (last: $(basename "${MIGS[$((MIG_COUNT-1))]}")); 028 present: $([ -n "$MIG028" ] && echo yes || echo no)"

echo
echo "Disposable cluster"
initdb -D "$PGDATA" -U postgres --no-locale -E UTF8 >/dev/null 2>&1
pg_ctl -D "$PGDATA" -o "-c listen_addresses='' -c unix_socket_directories='$SOCK'" -l "$TMP/pg.log" start >/dev/null 2>&1
ok "cluster up at $SOCK (unix socket only; no TCP; no Supabase); PostgreSQL $(Q postgres 'SHOW server_version')"

ROLE_STUBS='
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN;'
DB_STUBS="
CREATE SCHEMA auth;
CREATE TABLE auth.users (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email TEXT);
CREATE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql STABLE
  AS \$\$SELECT nullif(current_setting('app.uid', true), '')::uuid\$\$;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated, service_role;"

# apply_all <db> [<capture-pre-028>]: applies every committed migration in
# order; when asked, captures the live function definitions right before 028.
PRE_DELIVER=""; PRE_APPEND=""
apply_all() {
  local db="$1" capture="${2:-}"
  for f in "${MIGS[@]}"; do
    if [ -n "$capture" ] && [ "$f" = "$MIG028" ]; then
      PRE_DELIVER="$(Q "$db" "SELECT pg_get_functiondef('public.deliver_catalog_exercises(text)'::regprocedure);")"
      PRE_APPEND="$(Q "$db" "SELECT pg_get_functiondef('public.append_workout_set(uuid,smallint,numeric,numeric,integer,numeric,boolean,boolean,text)'::regprocedure);")"
    fi
    psql -h "$SOCK" -U postgres -d "$db" -X -v ON_ERROR_STOP=1 -q -f "$f" >/dev/null 2>"$TMP/apply-err.log" \
      || { bad "migration failed in $db: $f"; sed -n '1,5p' "$TMP/apply-err.log"; return 1; }
  done
}
fresh_db() { Q postgres "CREATE DATABASE $1;" >/dev/null && Q "$1" "$DB_STUBS" >/dev/null; }

echo
echo "Apply roles, auth stubs and EVERY committed migration in order"
Q postgres "$ROLE_STUBS" >/dev/null
Q postgres "$DB_STUBS" >/dev/null
apply_all postgres capture && ok "all $MIG_COUNT committed migrations applied cleanly in order"
[ -n "$MIG028" ] || { PRE_DELIVER="$(Q postgres "SELECT pg_get_functiondef('public.deliver_catalog_exercises(text)'::regprocedure);")"; PRE_APPEND="$(Q postgres "SELECT pg_get_functiondef('public.append_workout_set(uuid,smallint,numeric,numeric,integer,numeric,boolean,boolean,text)'::regprocedure);")"; }
POST_DELIVER="$(Q postgres "SELECT pg_get_functiondef('public.deliver_catalog_exercises(text)'::regprocedure);")"
POST_APPEND="$(Q postgres "SELECT pg_get_functiondef('public.append_workout_set(uuid,smallint,numeric,numeric,integer,numeric,boolean,boolean,text)'::regprocedure);")"

# ── Fixtures (as superuser; RLS is exercised by the AS_USER steps) ─────
U1='11111111-1111-4111-8111-111111111111'
U2='22222222-2222-4222-8222-222222222222'
Q postgres "INSERT INTO auth.users (id) VALUES ('$U1'), ('$U2');" >/dev/null
mk_exercise() { # <uid> <name> <mode> -> prints id or empty on failure
  Q postgres "INSERT INTO public.exercises (user_id, name, category, primary_muscle, equipment, exercise_type, tracking_mode) VALUES ('$1', '$2', 'compound', 'chest', 'bodyweight', 'strength', '$3') RETURNING id;" 2>/dev/null
}
# A completed session must carry completed_duration_seconds (009's CHECK); the timestamps make it a realistic finished workout.
mk_session()  { if [ "$2" = "completed" ]; then Q postgres "INSERT INTO public.workout_sessions (user_id, status, workout_date, start_time, end_time, completed_duration_seconds) VALUES ('$1', 'completed', CURRENT_DATE, NOW() - interval '1 hour', NOW(), 3600) RETURNING id;"; else Q postgres "INSERT INTO public.workout_sessions (user_id, status, workout_date) VALUES ('$1', '$2', CURRENT_DATE) RETURNING id;"; fi; }
mk_we()       { Q postgres "INSERT INTO public.workout_exercises (workout_session_id, exercise_id) VALUES ('$1', '$2') RETURNING id;"; }
mk_set()      { Q postgres "INSERT INTO public.workout_sets (workout_exercise_id, set_number, reps, weight_kg, completed) VALUES ('$1', $2, $3, $4, $5) RETURNING id;"; }

E_WR=$(mk_exercise "$U1" 'Bench press' weight_reps)
E_BW=$(mk_exercise "$U1" 'Pull-up' bodyweight)
E_CD=$(mk_exercise "$U1" 'Run' cardio)
E_TD=$(mk_exercise "$U1" 'Plank' timed)
E_M1=$(mk_exercise "$U1" 'M1 no sets' weight_reps)
E_M2=$(mk_exercise "$U1" 'M2 incomplete set' weight_reps)
E_M3=$(mk_exercise "$U1" 'M3 completed history' weight_reps)
E_M8=$(mk_exercise "$U1" 'M8 rls independence' weight_reps)
E_A=$(mk_exercise "$U1" 'Race A' weight_reps)
E_B=$(mk_exercise "$U1" 'Race B' weight_reps)
S1=$(mk_session "$U1" in_progress)
S3=$(mk_session "$U1" completed)
SU2=$(mk_session "$U2" in_progress)
WE_WR=$(mk_we "$S1" "$E_WR"); WE_BW=$(mk_we "$S1" "$E_BW"); WE_CD=$(mk_we "$S1" "$E_CD"); WE_TD=$(mk_we "$S1" "$E_TD")
WE_M2=$(mk_we "$S1" "$E_M2"); WE_M3=$(mk_we "$S3" "$E_M3"); WE_A=$(mk_we "$S1" "$E_A"); WE_B=$(mk_we "$S1" "$E_B")
WE_M8_U2=$(mk_we "$SU2" "$E_M8")   # U2's workout references U1's exercise: invisible to U1 under RLS
SET_M2=$(mk_set "$WE_M2" 1 5 100 false)
SET_M3=$(mk_set "$WE_M3" 1 5 100 true)
SET_M8=$(mk_set "$WE_M8_U2" 1 5 100 false)

# Every argument is cast to the function's declared parameter type, exactly
# as PostgREST does for a JSON body — bare SQL integer literals would not
# resolve against SMALLINT/NUMERIC parameters.
APPEND_SQL() { # <we_id> <reps> <weight> <rpe> <duration> <distance> <completed> <warmup> -> SQL text
  printf "SELECT append_workout_set('%s'::uuid, (%s)::smallint, (%s)::numeric, (%s)::numeric, (%s)::integer, (%s)::numeric, (%s)::boolean, (%s)::boolean, NULL::text);" "$1" "$2" "$3" "$4" "$5" "$6" "$7" "$8"
}
APPEND() { AS_USER postgres "$U1" "$(APPEND_SQL "$@")"; }

echo
echo "L. Legacy-mode regression — the four shipped modes must behave identically before and after 028"
expect_ok  "L1: weight_reps accepts reps 5 @ 100 kg"                          APPEND "$WE_WR" 5 100 8 NULL NULL true false
expect_err "L2: weight_reps still REJECTS weight 0 (zero is not a legal weight_reps load)" invalid_input APPEND "$WE_WR" 5 0 NULL NULL NULL true false
expect_err "L3: weight_reps rejects a negative weight"                          invalid_input APPEND "$WE_WR" 5 -1 NULL NULL NULL true false
expect_err "L4: weight_reps rejects duration_seconds (field gate)"              invalid_input APPEND "$WE_WR" 5 100 NULL 30 NULL true false
expect_err "L5: bodyweight cannot complete a non-warmup set without reps"       invalid_input APPEND "$WE_BW" NULL NULL NULL NULL NULL true false
expect_ok  "L6: bodyweight accepts reps 10"                                     APPEND "$WE_BW" 10 NULL NULL NULL NULL true false
expect_err "L7a: cardio rejects a weight"                                       invalid_input APPEND "$WE_CD" NULL 10 NULL 600 NULL true false
expect_err "L7b: cardio rejects is_warmup"                                      invalid_input APPEND "$WE_CD" NULL NULL NULL 600 NULL true true
expect_ok  "L8a: cardio accepts duration 600 + distance 1000"                   APPEND "$WE_CD" NULL NULL NULL 600 1000 true false
expect_err "L8b: cardio cannot complete with duration 0"                        invalid_input APPEND "$WE_CD" NULL NULL NULL 0 NULL true false
expect_err "L9a: timed rejects is_warmup"                                       invalid_input APPEND "$WE_TD" NULL NULL NULL 60 NULL true true
expect_err "L9b: timed rejects a weight"                                        invalid_input APPEND "$WE_TD" NULL 10 NULL 60 NULL true false
expect_ok  "L10: timed accepts duration 60 + rpe 7"                             APPEND "$WE_TD" NULL NULL 7 60 NULL true false

echo
echo "C. weight_time CONTRACT (items 1-8): permitted fields, forbidden fields, completion, zero"
E_WT=$(mk_exercise "$U1" 'Plate-weighted plank' weight_time)
if [ -n "$E_WT" ]; then
  ok "C1: a weight_time exercise can be created (the tracking_mode CHECK admits the value)"
  WE_WT=$(mk_we "$S1" "$E_WT")
  expect_ok  "C2: weight_time permits weight 20 kg + duration 60 s + rpe 8, completed"            APPEND "$WE_WT" NULL 20 8 60 NULL true false
  expect_err "C3a: weight_time FORBIDS reps"                                                       invalid_input APPEND "$WE_WT" 5 20 NULL 60 NULL true false
  expect_err "C3b: weight_time FORBIDS distance_meters"                                            invalid_input APPEND "$WE_WT" NULL 20 NULL 60 100 true false
  expect_err "C4a: completed weight_time REQUIRES a weight (null weight is not zero weight)"       invalid_input APPEND "$WE_WT" NULL NULL NULL 60 NULL true false
  expect_ok  "C4b: completed weight_time with LEGAL ZERO weight + duration 60 is accepted"         APPEND "$WE_WT" NULL 0 NULL 60 NULL true false
  STORED="$(Q postgres "SELECT weight_kg || '|' || (weight_kg IS NOT NULL) || '|' || pg_typeof(weight_kg) || '|' || duration_seconds FROM public.workout_sets WHERE workout_exercise_id='$WE_WT' AND weight_kg = 0 ORDER BY set_number DESC LIMIT 1;")"
  [ "$STORED" = "0.00|t|numeric|60" ] && ok "C4c: the zero is STORED as numeric 0.00 (IS NOT NULL), duration 60 — never collapsed to null" || bad "C4c: stored zero-weight row reads '$STORED', expected '0.00|t|numeric|60'"
  expect_err "C5: weight_time rejects a NEGATIVE weight"                                            invalid_input APPEND "$WE_WT" NULL -1 NULL 60 NULL true false
  expect_err "C6a: completed weight_time cannot have duration 0"                                    invalid_input APPEND "$WE_WT" NULL 20 NULL 0 NULL true false
  expect_err "C6b: completed weight_time cannot have a negative duration"                           invalid_input APPEND "$WE_WT" NULL 20 NULL -5 NULL true false
  expect_err "C6c: completed weight_time cannot have a NULL duration"                               invalid_input APPEND "$WE_WT" NULL 20 NULL NULL NULL true false
  expect_ok  "C7: an INCOMPLETE weight_time set may exist with no values yet"                       APPEND "$WE_WT" NULL NULL NULL NULL NULL false false
  expect_ok  "C8a: a completed WARMUP weight_time set is permitted (is_warmup true)"                APPEND "$WE_WT" NULL 10 NULL 30 NULL true true
  expect_err "C8b: a completed WARMUP still needs weight+duration (warmup does not waive the rule)" invalid_input APPEND "$WE_WT" NULL 10 NULL NULL NULL true true
  expect_err "C8c: weight_time rejects weight above the shared 1000 kg ceiling"                     invalid_input APPEND "$WE_WT" NULL 1001 NULL 60 NULL true false
else
  bad "C1: a weight_time exercise can be created — the committed tracking_mode CHECK rejects the value (migration 028 absent)"
  for id in "C2: weight_time permits weight+duration+rpe" "C3a: weight_time forbids reps" "C3b: weight_time forbids distance_meters" "C4a: completed weight_time requires a weight" "C4b: legal zero weight completes" "C4c: zero stored as numeric 0.00" "C5: negative weight rejected" "C6a: duration 0 cannot complete" "C6b: negative duration cannot complete" "C6c: null duration cannot complete" "C7: incomplete set may exist" "C8a: completed warmup permitted" "C8b: warmup obeys the completion rule" "C8c: 1000 kg ceiling"; do
    bad "$id — UNSATISFIABLE on this tree: no weight_time exercise can exist"
  done
  echo "  diagnosis (pre-028): with the CHECK bypassed in a scratch database, append_workout_set itself has no weight_time branch:"
  fresh_db diag >/dev/null; apply_all diag >/dev/null
  Q diag "INSERT INTO auth.users (id) VALUES ('$U1');" >/dev/null
  Q diag "ALTER TABLE public.exercises DROP CONSTRAINT exercises_tracking_mode_check;" >/dev/null
  DE=$(Q diag "INSERT INTO public.exercises (user_id, name, category, primary_muscle, equipment, exercise_type, tracking_mode) VALUES ('$U1','diag','compound','chest','bodyweight','strength','weight_time') RETURNING id;")
  DS=$(Q diag "INSERT INTO public.workout_sessions (user_id, status) VALUES ('$U1','in_progress') RETURNING id;")
  DWE=$(Q diag "INSERT INTO public.workout_exercises (workout_session_id, exercise_id) VALUES ('$DS','$DE') RETURNING id;")
  OUT="$(AS_USER diag "$U1" "$(APPEND_SQL "$DWE" NULL 20 NULL 60 NULL true false)" 2>&1)"
  echo "    weight 20 + duration 60 => $(printf '%s' "$OUT" | grep -oE 'invalid_input|not_found|permission denied[^\n]*|\{.*' | head -1) (the per-mode gate's ELSE RAISE 'invalid_input' — fail-closed, no weight_time arm)"
  OUT="$(AS_USER diag "$U1" "$(APPEND_SQL "$DWE" NULL 0 NULL 60 NULL true false)" 2>&1)"
  echo "    weight 0 + duration 60  => $(printf '%s' "$OUT" | grep -oE 'invalid_input|permission denied[^\n]*|\{.*' | head -1) (rejected PRE-lock by the mode-independent p_weight_kg <= 0 rule)"
fi

echo
echo "M. Tracking-mode history guard at the DATABASE boundary (item 11; O8 option (b))"
GUARD="tracking_mode_has_workout_history"
expect_ok  "M1: an exercise with NO sets may change tracking_mode (weight_reps -> bodyweight)"      AS_USER postgres "$U1" "UPDATE public.exercises SET tracking_mode='bodyweight' WHERE id='$E_M1';"
expect_err "M2: an exercise with an EXTANT INCOMPLETE set is rejected ($GUARD)"                       "$GUARD" AS_USER postgres "$U1" "UPDATE public.exercises SET tracking_mode='bodyweight' WHERE id='$E_M2';"
expect_err "M3: an exercise with COMPLETED historical sets is rejected ($GUARD)"                      "$GUARD" AS_USER postgres "$U1" "UPDATE public.exercises SET tracking_mode='bodyweight' WHERE id='$E_M3';"
MODE_M3="$(Q postgres "SELECT tracking_mode FROM public.exercises WHERE id='$E_M3';")"
[ "$MODE_M3" = "weight_reps" ] && ok "M3b: the rejected change left the mode untouched (still weight_reps)" || bad "M3b: mode after rejected change is '$MODE_M3' — the change was applied"
expect_ok  "M4a: the user deletes the permissible draft set"                                          AS_USER postgres "$U1" "DELETE FROM public.workout_sets WHERE id='$SET_M2';"
expect_ok  "M4b: with zero current sets the change is allowed again"                                  AS_USER postgres "$U1" "UPDATE public.exercises SET tracking_mode='bodyweight' WHERE id='$E_M2';"
expect_ok  "M5: a SAME-MODE update on an exercise with sets remains allowed"                          AS_USER postgres "$U1" "UPDATE public.exercises SET tracking_mode='$MODE_M3' WHERE id='$E_M3';"
expect_ok  "M6: an UNRELATED field update on an exercise with sets remains allowed"                   AS_USER postgres "$U1" "UPDATE public.exercises SET name='M3 renamed' WHERE id='$E_M3';"
expect_err "M7: a direct Data-API-style UPDATE (authenticated role, no route) cannot bypass the guard" "$GUARD" AS_USER postgres "$U1" "UPDATE public.exercises SET tracking_mode='timed' WHERE id='$E_M3';"
expect_err "M8: RLS cannot hide the sets from the guard — a set U1 cannot see (in U2's workout) still blocks U1's mode change" "$GUARD" AS_USER postgres "$U1" "UPDATE public.exercises SET tracking_mode='timed' WHERE id='$E_M8';"
VIS="$(AS_USER postgres "$U1" "SELECT count(*) FROM public.workout_sets WHERE id='$SET_M8';")"
[ "$VIS" = "0" ] && ok "M8b: (precondition) under RLS, U1 indeed sees 0 of those sets — so M8 proves the guard reads independently of the caller's RLS view" || bad "M8b: precondition failed — U1 sees $VIS set(s); the RLS-independence test is not meaningful"

echo
echo "R. Concurrency — both interleavings driven with two real sessions"
# A: the mode UPDATE obtains the exercise row first; append must wait, then validate against the NEW mode.
psql -h "$SOCK" -U postgres -d postgres -X -qtA -c "SET ROLE authenticated; SET app.uid = '$U1'; BEGIN; UPDATE public.exercises SET tracking_mode='timed' WHERE id='$E_A'; SELECT pg_sleep(3); COMMIT;" >"$TMP/raceA.out" 2>&1 &
BG=$!
sleep 1.2
T0=$(now)
OUT_A="$(APPEND "$WE_A" 5 100 NULL NULL NULL true false 2>&1)"; CODE_A=$?
T1=$(now); wait $BG
EL_A=$(perl -e "printf '%.2f', $T1 - $T0")
MODE_A="$(Q postgres "SELECT tracking_mode FROM public.exercises WHERE id='$E_A';")"
if [ $CODE_A -ne 0 ] && printf '%s' "$OUT_A" | grep -q invalid_input && perl -e "exit(($EL_A >= 1.5) ? 0 : 1)"; then
  ok "RA1: interleaving A — append WAITED ${EL_A}s on the row lock, then validated the reps/weight payload against the NEW mode ('$MODE_A') and rejected it (invalid_input)"
else
  bad "RA1: interleaving A — expected a wait >= 1.5s and invalid_input against the new mode; got exit=$CODE_A after ${EL_A}s, mode now '$MODE_A': $(printf '%s' "$OUT_A" | head -1)"
fi
expect_ok "RA2: interleaving A — a payload valid for the NEW mode (duration 60) is then accepted" APPEND "$WE_A" NULL NULL NULL 60 NULL true false

# B: append obtains the exercise row first (FOR UPDATE inside the function) and inserts; the mode UPDATE must wait,
#    then OBSERVE the now-extant set and reject.
psql -h "$SOCK" -U postgres -d postgres -X -qtA -c "SET ROLE authenticated; SET app.uid = '$U1'; BEGIN; $(APPEND_SQL "$WE_B" 5 100 NULL NULL NULL false false) SELECT pg_sleep(3); COMMIT;" >"$TMP/raceB.out" 2>&1 &
BG=$!
sleep 1.2
T0=$(now)
OUT_B="$(AS_USER postgres "$U1" "UPDATE public.exercises SET tracking_mode='timed' WHERE id='$E_B';" 2>&1)"; CODE_B=$?
T1=$(now); wait $BG
EL_B=$(perl -e "printf '%.2f', $T1 - $T0")
MODE_B="$(Q postgres "SELECT tracking_mode FROM public.exercises WHERE id='$E_B';")"
SETS_B="$(Q postgres "SELECT count(*) FROM public.workout_sets WHERE workout_exercise_id='$WE_B';")"
if [ $CODE_B -ne 0 ] && printf '%s' "$OUT_B" | grep -q "$GUARD" && perl -e "exit(($EL_B >= 1.5) ? 0 : 1)" && [ "$MODE_B" = "weight_reps" ] && [ "$SETS_B" = "1" ]; then
  ok "RB1: interleaving B — the mode UPDATE WAITED ${EL_B}s for append's lock, then observed the committed set and was rejected ($GUARD); mode still weight_reps, 1 set present"
else
  bad "RB1: interleaving B — expected a wait >= 1.5s then $GUARD with mode unchanged; got exit=$CODE_B after ${EL_B}s, mode now '$MODE_B', sets=$SETS_B: $(printf '%s' "$OUT_B" | head -1)"
fi

echo
echo "S. Migration 028 structure (W6) — read back from the catalog, never assumed"
EXPECT5="CHECK ((tracking_mode = ANY (ARRAY['weight_reps'::text, 'bodyweight'::text, 'cardio'::text, 'timed'::text, 'weight_time'::text])))"
if [ -z "$MIG028" ]; then
  bad "S1: exactly one 028_*.sql migration exists — none is committed yet"
  for id in "S2: both tracking_mode CHECKs read back by their W2 names with the exact 5-value definition" "S3: append_workout_set carries an explicit weight_time branch and a mode-aware weight lower bound" "S4: the history-guard trigger exists (BEFORE UPDATE OF tracking_mode, WHEN OLD IS DISTINCT FROM NEW; SECURITY DEFINER; fixed search_path; EXECUTE revoked from clients)" "S5: deliver_catalog_exercises differs from the 027 definition ONLY by two explicit WHEN 'weight_time' THEN 'strength' arms" "S6: 028 is atomic (a sabotaged second constraint fails closed and leaves the first CHECK, the function and the trigger untouched)" "S7: negative controls — the suite detects a missing trigger (DELETE), a re-narrowed catalog CHECK (SUBSTITUTE) and a contradictory added CHECK (ADD)"; do
    bad "$id — 028 absent"
  done
else
  N028=$(ls supabase/migrations/028_*.sql | wc -l | tr -d ' ')
  [ "$N028" = "1" ] && [ "$MIG_COUNT" = "28" ] && ok "S1: exactly one 028 migration, 28 committed migrations in total ($(basename "$MIG028"))" || bad "S1: expected exactly one 028 and 28 migrations, found $N028 / $MIG_COUNT"
  CONDEF_SQL="SELECT t.relname || '|' || c.conname || '|' || pg_get_constraintdef(c.oid) FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid WHERE c.contype='c' AND pg_get_constraintdef(c.oid) ILIKE '%tracking_mode%' ORDER BY 1;"
  Q postgres "$CONDEF_SQL" > "$TMP/condefs.txt"
  grep -qF "exercises|exercises_tracking_mode_check|$EXPECT5" "$TMP/condefs.txt" && grep -qF "exercise_catalog|exercise_catalog_tracking_mode_check|$EXPECT5" "$TMP/condefs.txt" && [ "$(wc -l < "$TMP/condefs.txt" | tr -d ' ')" = "2" ] \
    && ok "S2: both tracking_mode CHECKs read back by their W2 names with the exact 5-value definition (and no third constraint)" \
    || { bad "S2: constraint readback differs:"; sed 's/^/        /' "$TMP/condefs.txt"; }
  printf '%s' "$POST_APPEND" | grep -q "v_tracking_mode = 'weight_time'" && ! printf '%s' "$POST_APPEND" | grep -q 'p_weight_kg <= 0 OR p_weight_kg > 1000' && printf '%s' "$POST_APPEND" | grep -q 'p_weight_kg < 0' \
    && ok "S3: append_workout_set carries an explicit weight_time branch; the pre-lock rule now rejects only NEGATIVE weight, and the <= 0 rule is mode-aware after the locked read" \
    || bad "S3: append_workout_set definition does not show the expected weight_time branch / mode-aware lower bound"
  TRG="$(Q postgres "SELECT pg_get_triggerdef(t.oid) FROM pg_trigger t WHERE t.tgrelid='public.exercises'::regclass AND NOT t.tgisinternal AND t.tgname='exercises_tracking_mode_history_guard';")"
  FN="$(Q postgres "SELECT p.prosecdef || '|' || coalesce(array_to_string(p.proconfig, ','), '') || '|' || has_function_privilege('authenticated', p.oid, 'EXECUTE') || '|' || has_function_privilege('anon', p.oid, 'EXECUTE') FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='exercises_guard_tracking_mode_history';")"
  if printf '%s' "$TRG" | grep -q 'BEFORE UPDATE OF tracking_mode ON public.exercises FOR EACH ROW WHEN ((old.tracking_mode IS DISTINCT FROM new.tracking_mode)) EXECUTE FUNCTION' && printf '%s' "$TRG" | grep -q 'exercises_guard_tracking_mode_history()' && [ "$FN" = "t|search_path=public, pg_temp|f|f" ]; then
    ok "S4: trigger exercises_tracking_mode_history_guard is BEFORE UPDATE OF tracking_mode, row-level, WHEN OLD IS DISTINCT FROM NEW; its function is SECURITY DEFINER with search_path=public, pg_temp and EXECUTE revoked from authenticated and anon"
  else
    bad "S4: trigger/function shape differs — trigger: '$TRG'; function: '$FN'"
  fi
  diff <(printf '%s\n' "$PRE_DELIVER") <(printf '%s\n' "$POST_DELIVER") > "$TMP/deliver.diff"
  ADDED_N=$(grep -c '^> ' "$TMP/deliver.diff" || true); REMOVED_N=$(grep -c '^< ' "$TMP/deliver.diff" || true)
  ARMS_N=$(grep '^> ' "$TMP/deliver.diff" | grep -cE "WHEN 'weight_time'[[:space:]]+THEN 'strength'" || true)
  TOTAL_ARMS=$(printf '%s' "$POST_DELIVER" | grep -cE "WHEN 'weight_time'[[:space:]]+THEN 'strength'" || true)
  ELSE_N=$(printf '%s' "$POST_DELIVER" | grep -c "ELSE 'strength'" || true)
  if [ "$REMOVED_N" = "0" ] && [ "$ADDED_N" = "2" ] && [ "$ARMS_N" = "2" ] && [ "$TOTAL_ARMS" = "2" ] && [ "$ELSE_N" = "2" ]; then
    ok "S5: deliver_catalog_exercises differs from its 027 definition by EXACTLY two added lines, both explicit WHEN 'weight_time' THEN 'strength' arms (one per CASE); every other line — and both ELSE 'strength' catch-alls for unknown values — is byte-identical"
  else
    bad "S5: deliver_catalog_exercises diff is not exactly the two arms — added=$ADDED_N removed=$REMOVED_N weight_time arms in diff=$ARMS_N total arms=$TOTAL_ARMS ELSE count=$ELSE_N"; sed 's/^/        /' "$TMP/deliver.diff" | head -12
  fi
  # S6 atomicity
  fresh_db atomic_test >/dev/null
  MIGS_NO_028=(); for f in "${MIGS[@]}"; do [ "$f" = "$MIG028" ] || MIGS_NO_028+=("$f"); done
  for f in "${MIGS_NO_028[@]}"; do psql -h "$SOCK" -U postgres -d atomic_test -X -v ON_ERROR_STOP=1 -q -f "$f" >/dev/null 2>&1 || { bad "S6: atomic_test setup failed at $f"; break; }; done
  Q atomic_test "ALTER TABLE public.exercise_catalog DROP CONSTRAINT exercise_catalog_tracking_mode_check;" >/dev/null
  BEFORE_T="$(Q atomic_test "SELECT pg_get_constraintdef(c.oid) FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid WHERE t.relname='exercises' AND c.conname='exercises_tracking_mode_check';")"
  BEFORE_F="$(Q atomic_test "SELECT pg_get_functiondef('public.append_workout_set(uuid,smallint,numeric,numeric,integer,numeric,boolean,boolean,text)'::regprocedure);")"
  if psql -h "$SOCK" -U postgres -d atomic_test -X -v ON_ERROR_STOP=1 -q -f "$MIG028" >/dev/null 2>&1; then
    bad "S6: sabotaged 028 (second constraint pre-dropped) unexpectedly SUCCEEDED"
  else
    AFTER_T="$(Q atomic_test "SELECT pg_get_constraintdef(c.oid) FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid WHERE t.relname='exercises' AND c.conname='exercises_tracking_mode_check';")"
    AFTER_F="$(Q atomic_test "SELECT pg_get_functiondef('public.append_workout_set(uuid,smallint,numeric,numeric,integer,numeric,boolean,boolean,text)'::regprocedure);")"
    TRG_N="$(Q atomic_test "SELECT count(*) FROM pg_trigger WHERE tgname='exercises_tracking_mode_history_guard';")"
    [ "$BEFORE_T" = "$AFTER_T" ] && [ "$BEFORE_F" = "$AFTER_F" ] && [ "$TRG_N" = "0" ] && ! printf '%s' "$AFTER_T" | grep -q weight_time \
      && ok "S6: 028 is ATOMIC — with the second constraint pre-dropped it fails closed; the exercises CHECK, append_workout_set and the absence of the trigger are all byte-identical to before" \
      || bad "S6: after the failed 028 something changed — CHECK same: $([ "$BEFORE_T" = "$AFTER_T" ] && echo yes || echo NO); function same: $([ "$BEFORE_F" = "$AFTER_F" ] && echo yes || echo NO); triggers: $TRG_N"
  fi
  # S7 negative controls (classified) — post-hoc sabotage of the APPLIED state in a scratch database; each must be DETECTED
  fresh_db nc >/dev/null; apply_all nc >/dev/null
  Q nc "INSERT INTO auth.users (id) VALUES ('$U1');" >/dev/null
  NE=$(Q nc "INSERT INTO public.exercises (user_id, name, category, primary_muscle, equipment, exercise_type, tracking_mode) VALUES ('$U1','nc','compound','chest','bodyweight','strength','weight_reps') RETURNING id;")
  NS=$(Q nc "INSERT INTO public.workout_sessions (user_id, status) VALUES ('$U1','in_progress') RETURNING id;")
  NWE=$(Q nc "INSERT INTO public.workout_exercises (workout_session_id, exercise_id) VALUES ('$NS','$NE') RETURNING id;")
  Q nc "INSERT INTO public.workout_sets (workout_exercise_id, set_number, reps, weight_kg) VALUES ('$NWE', 1, 5, 100);" >/dev/null
  Q nc "DROP TRIGGER exercises_tracking_mode_history_guard ON public.exercises;" >/dev/null
  if AS_USER nc "$U1" "UPDATE public.exercises SET tracking_mode='timed' WHERE id='$NE';" >/dev/null 2>&1; then ok "S7a (DELETE control): with the trigger removed, the M2-shaped change SUCCEEDS — the guard checks would detect a missing trigger"; else bad "S7a (DELETE control): the change was still rejected without the trigger — the guard checks are not measuring the trigger"; fi
  Q nc "ALTER TABLE public.exercise_catalog DROP CONSTRAINT exercise_catalog_tracking_mode_check; ALTER TABLE public.exercise_catalog ADD CONSTRAINT exercise_catalog_tracking_mode_check CHECK (tracking_mode IN ('weight_reps','bodyweight','cardio','timed'));" >/dev/null
  Q nc "$CONDEF_SQL" > "$TMP/nc-condefs.txt"
  if ! grep -qF "exercise_catalog|exercise_catalog_tracking_mode_check|$EXPECT5" "$TMP/nc-condefs.txt"; then ok "S7b (SUBSTITUTE control): a catalog CHECK re-narrowed to four values is DETECTED by the S2 readback"; else bad "S7b (SUBSTITUTE control): the S2 readback did not notice a four-value catalog CHECK"; fi
  Q nc "ALTER TABLE public.exercises ADD CONSTRAINT nc3_contradiction CHECK (tracking_mode <> 'weight_time');" >/dev/null
  if ! Q nc "INSERT INTO public.exercises (user_id, name, category, primary_muscle, equipment, exercise_type, tracking_mode) VALUES ('$U1','nc3','compound','chest','bodyweight','strength','weight_time');" >/dev/null 2>&1; then ok "S7c (ADD control): a contradictory CHECK added BESIDE the intact widened CHECK is DETECTED by C1's real insert"; else bad "S7c (ADD control): the weight_time insert succeeded despite a contradictory CHECK — C1 is not exercising the constraint path"; fi
fi

echo
if [ "$FAIL" -eq 0 ]; then
  echo "$PASS passed, 0 failed  (GREEN: the weight_time contract holds on the committed migrations)"
else
  echo "$PASS passed, $FAIL failed  (RED: the contract does not hold on the committed migrations)"
  exit 1
fi
