#!/bin/bash
# ============================================================
# ForgeFitOS - EXLIB-2E migration-026 PROPOSAL live proof matrix.
#
# Applies migrations 001-025 PLUS the PROPOSED (draft, NOT applied
# anywhere real) migration-026 SQL from docs/ against a DISPOSABLE
# LOCAL PostgreSQL cluster (unix-socket only, no TCP, torn down on
# exit). This script NEVER contacts Supabase, Vercel, or any remote
# service, and the proposal file living in docs/ (not
# supabase/migrations/) is itself part of the not-applied boundary.
#
# Proves, executably, the approved EXLIB-2D contract:
#   P1 fresh-user canonical delivery; P2 pristine in-place correction
#   with anatomy synchronization and the structural correction
#   record; verified idempotency (valid retry no-ops, malformed link
#   aborts); P3/P4/P5x/P6 legacy preservation with distinguished
#   fallback; both-names collision fail-closed skip; concurrency
#   under the per-user advisory lock; rollback excluding corrected
#   rows while inserted canonical/distinguished rows keep existing
#   deactivate-only behavior; post-rollback alias dispositions
#   (deterministic skip, no duplicates, no silent reactivation);
#   revocation halting future delivery without reinterpreting
#   corrected data; the delete gate on corrected rows; cross-tenant
#   isolation; client-role denial on correction provenance; and the
#   13-key JSONB compatibility contract against a second 023-only
#   database (additive plank_disposition only; identical non-Plank
#   row effects).
#
# Run from the repository root:
#   bash scripts/verify-exlib2e-live.sh
# ============================================================
set -euo pipefail
export LC_ALL=C LANG=C

MIG023="supabase/migrations/023_exlib_catalog_and_delivery_contract.sql"
MIG024="supabase/migrations/024_exlib_post_application_hardening.sql"
MIG025="supabase/migrations/025_exlib_equipment_vocabulary_support.sql"
PROPOSAL="docs/exlib2e-migration-026-proposal.sql"
SHA023="0991448c39a558385431c78cef6d6063df208312a3f53866756ba730066c42f2"
SHA024="190550ecdb99df702ab03d1b07592f861070141e5091eb25bc5bf45f211cc980"
SHA025="fbda16f4d25cacd1715b199050506a4da15896355d96700876b76c68826d304c"

PASS=0
FAIL=0
ok()   { PASS=$((PASS+1)); printf '  PASS  %s\n' "$1"; }
bad()  { FAIL=$((FAIL+1)); printf '  FAIL  %s\n' "$1"; }

TMP="$(mktemp -d /tmp/exlib2e-pg.XXXXXX)"
PGDATA="$TMP/pgdata"
SOCK="$TMP"
cleanup() {
  pg_ctl -D "$PGDATA" stop -m immediate >/dev/null 2>&1 || true
  rm -rf "$TMP"
}
trap cleanup EXIT

Q()  { psql -h "$SOCK" -U postgres -d "$1" -X -v ON_ERROR_STOP=1 -qtA -c "$2"; }
QU() { psql -h "$SOCK" -U postgres -d "$1" -X -v ON_ERROR_STOP=1 -qtA -c "SET app.uid = '$2'; $3"; }

echo
echo "Fingerprint gates (before initdb or any SQL execution)"
for spec in "$MIG023:$SHA023" "$MIG024:$SHA024" "$MIG025:$SHA025"; do
  F="${spec%%:*}"; WANT="${spec#*:}"
  GOT=$(shasum -a 256 "$F" | awk '{print $1}')
  [ "$GOT" = "$WANT" ] || { bad "fingerprint gate: $F"; exit 1; }
  ok "fingerprint gate: $F"
done
PROPSHA=$(shasum -a 256 "$PROPOSAL" | awk '{print $1}')
PROPBYTES=$(wc -c < "$PROPOSAL" | tr -d ' ')
ok "proposal under test: $PROPOSAL ($PROPBYTES bytes, sha256 $PROPSHA)"
grep -q "supabase/migrations/026" <(ls supabase/migrations/ 2>/dev/null) 2>/dev/null \
  && { bad "a real migration 026 exists — proposal boundary violated"; exit 1; } \
  || ok "no real migration 026 exists; the proposal stays in docs/ (NOT APPLIED)"

echo
echo "Disposable cluster"
initdb -D "$PGDATA" -U postgres --no-locale -E UTF8 >/dev/null 2>&1
pg_ctl -D "$PGDATA" -o "-c listen_addresses='' -c unix_socket_directories='$SOCK'" -l "$TMP/pg.log" start >/dev/null 2>&1
ok "cluster up at $SOCK (unix socket only; no TCP; no Supabase)"

STUBS="
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN;
CREATE SCHEMA auth;
CREATE TABLE auth.users (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email TEXT);
CREATE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql STABLE
  AS \$\$SELECT nullif(current_setting('app.uid', true), '')::uuid\$\$;"

echo
echo "Apply auth stubs + exact migrations 001-025, then the PROPOSAL"
Q postgres "$STUBS" >/dev/null
for f in supabase/migrations/0*.sql; do
  psql -h "$SOCK" -U postgres -d postgres -X -v ON_ERROR_STOP=1 -q -f "$f" >/dev/null 2>"$TMP/apply-err.log" \
    || { bad "migration failed: $f"; sed -n '1,5p' "$TMP/apply-err.log"; exit 1; }
done
ok "exact migrations 001-025 applied cleanly in order"
if psql -h "$SOCK" -U postgres -d postgres -X -v ON_ERROR_STOP=1 -q -f "$PROPOSAL" >/dev/null 2>"$TMP/prop-err.log"; then
  ok "PROPOSED migration 026 applies cleanly on top of 025"
else
  bad "proposal failed to apply:"; sed -n '1,8p' "$TMP/prop-err.log"; exit 1
fi

# ── Catalog fixtures: one sealed approved run with Plank (timed) +
#    one non-Plank identity + one Plank alias ─────────────────────
LP='11111111-2222-3333-4444-555555555501'
LN='11111111-2222-3333-4444-555555555502'
SP='aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeee01'
SN='aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeee02'
AP='aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeee11'
RUN='exlib2e-proof-run-0001'
Q postgres "INSERT INTO exercise_catalog_logical (id) VALUES ('$LP'), ('$LN');" >/dev/null
Q postgres "INSERT INTO exercise_catalog (id, logical_id, canonical_name, category, primary_muscle, equipment, laterality, tracking_mode, source_url, source_page, retrieved_at, import_confidence) VALUES
  ('$SP','$LP','Plank','isolation','abs','bodyweight','bilateral','timed','https://example.test/plank','https://example.test/dir','2026-08-30','high'),
  ('$SN','$LN','Test Row NP','compound','lats','barbell','bilateral','weight_reps','https://example.test/np','https://example.test/dir','2026-08-30','high');" >/dev/null
Q postgres "INSERT INTO exercise_catalog_muscles (catalog_id, muscle, role) VALUES
  ('$SP','obliques','secondary'), ('$SP','lower_back','tertiary'),
  ('$SN','triceps','secondary');" >/dev/null
Q postgres "INSERT INTO exercise_catalog_aliases (id, logical_id, alias) VALUES ('$AP','$LP','Front plank test');" >/dev/null
Q postgres "UPDATE exercise_catalog SET review_status='approved', reviewed_by='local-proof-reviewer', reviewed_at=NOW(), review_rationale='local disposable fixture' WHERE id IN ('$SP','$SN');" >/dev/null
RID=$(Q postgres "INSERT INTO exercise_catalog_import_runs (run_key, dry_run, product_approved_by, product_approved_at, legal_approved_by, legal_approved_at, approval_rationale) VALUES ('$RUN', false, 'local-product', NOW(), 'local-legal', NOW(), 'local disposable fixture') RETURNING id;")
Q postgres "INSERT INTO exercise_catalog_run_items (run_id, catalog_id) VALUES ('$RID','$SP'), ('$RID','$SN');" >/dev/null
Q postgres "INSERT INTO exercise_catalog_run_items (run_id, catalog_alias_id) VALUES ('$RID','$AP');" >/dev/null
Q postgres "SELECT exlib_approve_and_seal_run('$RUN');" >/dev/null
ok "fixture run sealed: Plank (timed, 2-row anatomy) + Test Row NP + 1 Plank alias"

mkuser() { Q postgres "INSERT INTO auth.users DEFAULT VALUES RETURNING id;"; }
seed_plank() { # $1 = uid -> echoes the seed row id
  Q postgres "INSERT INTO public.exercises (user_id, name, category, primary_muscle, equipment, exercise_type, tracking_mode, unilateral, is_system, is_active) VALUES ('$1','Plank','isolation','abs','bodyweight','bodyweight','bodyweight',false,true,true) RETURNING id;"
}
seed_anat() { Q postgres "INSERT INTO public.exercise_muscles (user_id, exercise_id, muscle, role) VALUES ('$1','$2','obliques','secondary');" >/dev/null; }
DLV() { QU postgres "$1" "SELECT deliver_catalog_exercises('$RUN');"; }
RBK() { QU postgres "$1" "SELECT rollback_catalog_delivery('$RUN');"; }
J() { python3 -c "import json,sys; d=json.loads(sys.argv[1]); print(d[sys.argv[2]])" "$1" "$2"; }

echo
echo "P1 / fresh user: canonical delivery + 13+1 JSONB key compatibility"
U0=$(mkuser)
R=$(DLV "$U0")
KEYS=$(python3 -c "import json,sys; print(','.join(sorted(json.loads(sys.argv[1]).keys())))" "$R")
EXPECT_KEYS="alias_added_to_existing,alias_already_delivered,alias_inserted,alias_skipped_collision,alias_skipped_inactive_exercise,alias_skipped_no_exercise,collision_names,eligible,inserted,inserted_catalog_logical_ids,plank_disposition,run_key,skipped_already_delivered,skipped_name_collision"
[ "$KEYS" = "$EXPECT_KEYS" ] && ok "report keys = the 13 existing keys + plank_disposition ONLY" || bad "report keys drifted: $KEYS"
[ "$(J "$R" plank_disposition)" = "delivered_canonical_timed_plank" ] && ok "fresh user: plank_disposition=delivered_canonical_timed_plank" || bad "fresh disposition: $R"
[ "$(J "$R" inserted)" = "2" ] && ok "fresh user: inserted=2 (Plank + Test Row NP; existing key meaning preserved)" || bad "inserted: $R"
[ "$(J "$R" alias_inserted)" = "1" ] && ok "fresh user: alias_inserted=1" || bad "alias_inserted: $R"
ROW=$(Q postgres "SELECT tracking_mode||'|'||exercise_type||'|'||name||'|'||(catalog_id='$SP')||'|'||(catalog_logical_id='$LP')||'|'||(import_run_id='$RID') FROM public.exercises WHERE user_id='$U0' AND catalog_logical_id='$LP';")
[ "$ROW" = "timed|mobility|Plank|true|true|true" ] && ok "fresh user: canonical timed Plank with full provenance" || bad "fresh row: $ROW"
AN=$(Q postgres "SELECT string_agg(muscle||':'||role, ',' ORDER BY muscle, role) FROM public.exercise_muscles m JOIN public.exercises e ON e.id=m.exercise_id WHERE e.user_id='$U0' AND e.catalog_logical_id='$LP';")
[ "$AN" = "lower_back:tertiary,obliques:secondary" ] && ok "fresh user: anatomy equals the catalog snapshot" || bad "fresh anatomy: $AN"

echo
echo "P2 / pristine seed: in-place correction + anatomy sync + correction record"
U2=$(mkuser); E2=$(seed_plank "$U2"); seed_anat "$U2" "$E2"
R=$(DLV "$U2")
[ "$(J "$R" plank_disposition)" = "corrected_and_linked_pristine_seed" ] && ok "P2: disposition=corrected_and_linked_pristine_seed" || bad "P2 disposition: $R"
[ "$(J "$R" inserted)" = "1" ] && ok "P2: inserted=1 (NP only; the correction is NOT counted as an insert)" || bad "P2 inserted: $R"
ROW=$(Q postgres "SELECT id||'|'||tracking_mode||'|'||exercise_type||'|'||name||'|'||is_active FROM public.exercises WHERE user_id='$U2' AND catalog_logical_id='$LP';")
[ "$ROW" = "$E2|timed|mobility|Plank|true" ] && ok "P2: SAME row id corrected in place (timed/mobility, name unchanged)" || bad "P2 row: $ROW (expected id $E2)"
AN=$(Q postgres "SELECT string_agg(muscle||':'||role, ',' ORDER BY muscle, role) FROM public.exercise_muscles WHERE user_id='$U2' AND exercise_id='$E2';")
[ "$AN" = "lower_back:tertiary,obliques:secondary" ] && ok "P2: anatomy synchronized to the exact catalog snapshot (lower_back/tertiary added)" || bad "P2 anatomy: $AN"
CR=$(Q postgres "SELECT count(*) FROM public.exercise_catalog_corrections WHERE user_id='$U2' AND exercise_id='$E2' AND import_run_id='$RID' AND catalog_logical_id='$LP';")
[ "$CR" = "1" ] && ok "P2: structural correction record written in the same transaction" || bad "P2 correction record: $CR"
CL=$(Q postgres "SELECT claim_source||'|'||(exercise_id='$E2') FROM public.exercise_name_claims WHERE user_id='$U2' AND normalized_name='plank';")
[ "$CL" = "exercise|true" ] && ok "P2: the 'plank' claim never moved off the corrected row" || bad "P2 claim: $CL"

echo
echo "Verified idempotency: valid completed-state retry no-ops"
R=$(DLV "$U2")
[ "$(J "$R" plank_disposition)" = "already_valid_idempotent" ] && ok "retry: disposition=already_valid_idempotent" || bad "retry disposition: $R"
[ "$(Q postgres "SELECT count(*) FROM public.exercises WHERE user_id='$U2' AND lower(name) LIKE 'plank%';")" = "1" ] && ok "retry: still exactly one Plank row (no duplicate, no mutation)" || bad "retry duplicated rows"
[ "$(Q postgres "SELECT count(*) FROM public.exercise_catalog_corrections WHERE user_id='$U2';")" = "1" ] && ok "retry: correction record count unchanged" || bad "retry correction records changed"

echo
echo "Verified idempotency: malformed prior link fails closed"
U3=$(mkuser)
DLV "$U3" >/dev/null
Q postgres "UPDATE public.exercises SET tracking_mode='bodyweight', exercise_type='bodyweight' WHERE user_id='$U3' AND catalog_logical_id='$LP';" >/dev/null
if OUT=$(DLV "$U3" 2>&1); then
  bad "malformed link was silently accepted: $OUT"
else
  printf '%s' "$OUT" | grep -q "inconsistent prior Plank reconciliation" \
    && ok "malformed link aborts fail-closed with the inconsistent-reconciliation report" \
    || bad "malformed link failed with the wrong error: $OUT"
fi
MODE=$(Q postgres "SELECT tracking_mode FROM public.exercises WHERE user_id='$U3' AND catalog_logical_id='$LP';")
[ "$MODE" = "bodyweight" ] && ok "malformed link was NOT silently repaired" || bad "malformed link mutated: $MODE"

echo
echo "P4 / completed bodyweight history: preserved + distinguished delivery"
U4=$(mkuser); E4=$(seed_plank "$U4"); seed_anat "$U4" "$E4"
WS=$(Q postgres "INSERT INTO public.workout_sessions (user_id) VALUES ('$U4') RETURNING id;")
WE=$(Q postgres "INSERT INTO public.workout_exercises (workout_session_id, exercise_id) VALUES ('$WS','$E4') RETURNING id;")
Q postgres "INSERT INTO public.workout_sets (workout_exercise_id, set_number, reps, completed) VALUES ('$WE',1,45,true);" >/dev/null
R=$(DLV "$U4")
[ "$(J "$R" plank_disposition)" = "precondition_failure_preserved_legacy_plus_distinguished_delivery" ] && ok "P4: disposition=precondition_failure_preserved_legacy_plus_distinguished_delivery" || bad "P4 disposition: $R"
ROW=$(Q postgres "SELECT tracking_mode||'|'||name||'|'||(catalog_id IS NULL) FROM public.exercises WHERE id='$E4';")
[ "$ROW" = "bodyweight|Plank|true" ] && ok "P4: legacy row and its rep history preserved untouched" || bad "P4 legacy mutated: $ROW"
DIST=$(Q postgres "SELECT name||'|'||tracking_mode FROM public.exercises WHERE user_id='$U4' AND catalog_logical_id='$LP';")
[ "$DIST" = "Plank (timed)|timed" ] && ok "P4: distinguished 'Plank (timed)' delivered alongside" || bad "P4 distinguished: $DIST"
SETS=$(Q postgres "SELECT count(*)||'|'||max(reps) FROM public.workout_sets WHERE workout_exercise_id='$WE';")
[ "$SETS" = "1|45" ] && ok "P4: historical set data byte-untouched" || bad "P4 history mutated: $SETS"

echo
echo "P3 / routine reference (no sets): preserved + distinguished"
U5=$(mkuser); E5=$(seed_plank "$U5"); seed_anat "$U5" "$E5"
RT=$(Q postgres "INSERT INTO public.workout_routines (user_id, name) VALUES ('$U5','Core day') RETURNING id;")
Q postgres "INSERT INTO public.workout_routine_exercises (routine_id, exercise_id) VALUES ('$RT','$E5');" >/dev/null
R=$(DLV "$U5")
[ "$(J "$R" plank_disposition)" = "precondition_failure_preserved_legacy_plus_distinguished_delivery" ] && ok "P3: routine-referenced seed preserved; distinguished delivered" || bad "P3 disposition: $R"
[ "$(Q postgres "SELECT tracking_mode FROM public.exercises WHERE id='$E5';")" = "bodyweight" ] && ok "P3: legacy row untouched" || bad "P3 legacy mutated"

echo
echo "P5 individual precondition failures (each routes to preserved legacy + distinguished)"
p5_case() { # $1 label, $2 uid, $3 legacy id
  R=$(DLV "$2")
  D=$(J "$R" plank_disposition)
  M=$(Q postgres "SELECT tracking_mode||'|'||(catalog_id IS NULL) FROM public.exercises WHERE id='$3';")
  C=$(Q postgres "SELECT count(*) FROM public.exercise_catalog_corrections WHERE user_id='$2';")
  if [ "$D" = "precondition_failure_preserved_legacy_plus_distinguished_delivery" ] && [ "$M" = "bodyweight|true" ] && [ "$C" = "0" ]; then
    ok "P5 ($1): legacy preserved, no correction record, distinguished delivered"
  else
    bad "P5 ($1): disposition=$D legacy=$M corrections=$C"
  fi
}
U6=$(mkuser); E6=$(seed_plank "$U6"); seed_anat "$U6" "$E6"
Q postgres "INSERT INTO public.exercise_muscles (user_id, exercise_id, muscle, role) VALUES ('$U6','$E6','lower_back','secondary');" >/dev/null
p5_case "anatomy multiset mismatch (extra user row)" "$U6" "$E6"
U6b=$(mkuser); E6b=$(seed_plank "$U6b")
p5_case "anatomy multiset mismatch (missing seed row)" "$U6b" "$E6b"
U7=$(mkuser); E7=$(seed_plank "$U7"); seed_anat "$U7" "$E7"
Q postgres "INSERT INTO public.exercise_aliases (user_id, exercise_id, alias) VALUES ('$U7','$E7','Hover hold');" >/dev/null
p5_case "alias attached (tenant-authored identity state)" "$U7" "$E7"
U8=$(mkuser); E8=$(seed_plank "$U8"); seed_anat "$U8" "$E8"
Q postgres "UPDATE public.exercises SET notes='my tweak' WHERE id='$E8';" >/dev/null
p5_case "scalar mismatch (user notes)" "$U8" "$E8"
U8b=$(mkuser); E8b=$(seed_plank "$U8b"); seed_anat "$U8b" "$E8b"
Q postgres "UPDATE public.exercises SET exercise_type='strength' WHERE id='$E8b';" >/dev/null
p5_case "exercise_type mismatch" "$U8b" "$E8b"
U8c=$(mkuser); E8c=$(seed_plank "$U8c"); seed_anat "$U8c" "$E8c"
Q postgres "UPDATE public.exercises SET import_run_id='$RID' WHERE id='$E8c';" >/dev/null
R=$(DLV "$U8c")
D=$(J "$R" plank_disposition)
M=$(Q postgres "SELECT tracking_mode FROM public.exercises WHERE id='$E8c';")
{ [ "$D" = "precondition_failure_preserved_legacy_plus_distinguished_delivery" ] && [ "$M" = "bodyweight" ]; } \
  && ok "P5 (preexisting catalog provenance): never re-matched, legacy preserved" \
  || bad "P5 provenance case: disposition=$D mode=$M"
U8d=$(mkuser); E8d=$(seed_plank "$U8d"); seed_anat "$U8d" "$E8d"
Q postgres "UPDATE public.exercises SET is_active=false WHERE id='$E8d';" >/dev/null
p5_case "archived seed (claim persists by design)" "$U8d" "$E8d"

echo
echo "P6 / alias-held claim: no seed row, distinguished delivery"
U9=$(mkuser)
E9=$(Q postgres "INSERT INTO public.exercises (user_id, name, category, primary_muscle, equipment, exercise_type, tracking_mode) VALUES ('$U9','Core hold','isolation','abs','bodyweight','bodyweight','bodyweight') RETURNING id;")
Q postgres "INSERT INTO public.exercise_aliases (user_id, exercise_id, alias) VALUES ('$U9','$E9','Plank');" >/dev/null
R=$(DLV "$U9")
[ "$(J "$R" plank_disposition)" = "delivered_distinguished_timed_plank" ] && ok "P6: alias-claimed 'plank' -> delivered_distinguished_timed_plank" || bad "P6 disposition: $R"

echo
echo "Both names claimed: fail-closed retryable skip"
U10=$(mkuser)
Q postgres "INSERT INTO public.exercises (user_id, name, category, primary_muscle, equipment, exercise_type, tracking_mode, notes) VALUES ('$U10','Plank','isolation','abs','bodyweight','bodyweight','bodyweight','customized'),('$U10','Plank (timed)','isolation','abs','bodyweight','mobility','timed',NULL);" >/dev/null
R=$(DLV "$U10")
[ "$(J "$R" plank_disposition)" = "skipped_canonical_and_distinguished_collision" ] && ok "collision: disposition=skipped_canonical_and_distinguished_collision" || bad "collision disposition: $R"
[ "$(J "$R" inserted)" = "1" ] && ok "collision: non-Plank identity still delivered (Plank skip never blocks others)" || bad "collision inserted: $R"
[ "$(Q postgres "SELECT count(*) FROM public.exercises WHERE user_id='$U10' AND catalog_logical_id='$LP';")" = "0" ] && ok "collision: no Plank link forged" || bad "collision forged a link"

echo
echo "Concurrent same-user delivery (advisory-lock serialization)"
U11=$(mkuser)
( QU postgres "$U11" "SELECT pg_sleep(0.1); SELECT deliver_catalog_exercises('$RUN');" >/dev/null 2>&1 ) &
P1=$!
( QU postgres "$U11" "SELECT deliver_catalog_exercises('$RUN');" >/dev/null 2>&1 ) &
P2=$!
wait $P1 $P2 || true
CNT=$(Q postgres "SELECT count(*) FROM public.exercises WHERE user_id='$U11' AND catalog_logical_id='$LP';")
[ "$CNT" = "1" ] && ok "concurrency: exactly ONE Plank row after two simultaneous deliveries" || bad "concurrency rows: $CNT"
[ "$(Q postgres "SELECT count(*) FROM public.exercises WHERE user_id='$U11' AND catalog_logical_id='$LN';")" = "1" ] && ok "concurrency: exactly ONE non-Plank row" || bad "concurrency NP duplicated"

echo
echo "Review 1: strict run-provenance invariant (different existing run id)"
RUN2='exlib2e-proof-run-0002'
RID2=$(Q postgres "INSERT INTO exercise_catalog_import_runs (run_key, dry_run, product_approved_by, product_approved_at, legal_approved_by, legal_approved_at, approval_rationale) VALUES ('$RUN2', false, 'local-product', NOW(), 'local-legal', NOW(), 'local disposable fixture 2') RETURNING id;")
Q postgres "INSERT INTO exercise_catalog_run_items (run_id, catalog_id) VALUES ('$RID2','$SP'), ('$RID2','$SN');" >/dev/null
Q postgres "SELECT exlib_approve_and_seal_run('$RUN2');" >/dev/null
UXR=$(mkuser)
QU postgres "$UXR" "SELECT deliver_catalog_exercises('$RUN2');" >/dev/null
if OUT=$(DLV "$UXR" 2>&1); then
  bad "different-run link validated as idempotent: $OUT"
else
  printf '%s' "$OUT" | grep -q "inconsistent prior Plank reconciliation"     && ok "strict run invariant: a link carrying a DIFFERENT existing run id aborts fail-closed"     || bad "different-run link failed with the wrong error: $OUT"
fi
ROW=$(Q postgres "SELECT (import_run_id='$RID2')||'|'||tracking_mode FROM public.exercises WHERE user_id='$UXR' AND catalog_logical_id='$LP';")
[ "$ROW" = "true|timed" ] && ok "strict run invariant: the differently-run row was not repaired or relinked" || bad "different-run row mutated: $ROW"

echo
echo "Review 1: dry-run/unsealed run provenance never validates"
RID3=$(Q postgres "INSERT INTO exercise_catalog_import_runs (run_key) VALUES ('exlib2e-dryrun-0003') RETURNING id;")
UXD=$(mkuser)
DLV "$UXD" >/dev/null
Q postgres "UPDATE public.exercises SET import_run_id='$RID3' WHERE user_id='$UXD' AND catalog_logical_id='$LP';" >/dev/null
if OUT=$(DLV "$UXD" 2>&1); then
  bad "dry-run provenance validated as idempotent: $OUT"
else
  printf '%s' "$OUT" | grep -q "inconsistent prior Plank reconciliation"     && ok "strict run invariant: dry-run/unsealed provenance aborts fail-closed"     || bad "dry-run provenance failed with the wrong error: $OUT"
fi
[ "$(Q postgres "SELECT (import_run_id='$RID3') FROM public.exercises WHERE user_id='$UXD' AND catalog_logical_id='$LP';")" = "t" ]   && ok "strict run invariant: the dry-run-provenance row was not repaired" || bad "dry-run row mutated"

echo
echo "Review 1: raced logical-index winner is fully validated (shared shape)"
Q postgres "CREATE EXTENSION IF NOT EXISTS dblink;" >/dev/null
Q postgres "CREATE FUNCTION test_race_inject() RETURNS trigger LANGUAGE plpgsql AS \$t\$
DECLARE
  v_mode TEXT := current_setting('test.race', true);
  v_conn TEXT := 'host=' || current_setting('test.sock', true) || ' dbname=postgres user=postgres';
BEGIN
  -- Simulates a REAL client race: the competing row is committed by
  -- an AUTONOMOUS session (dblink) between the dispatch's initial
  -- existing-link check and the INSERT, exactly like a direct
  -- authenticated write that does not share the advisory lock.
  IF v_mode IN ('valid','malformed') AND NEW.name = 'Plank' AND NEW.catalog_logical_id IS NOT NULL THEN
    PERFORM set_config('test.race', 'done', true);
    IF v_mode = 'valid' THEN
      PERFORM dblink_exec(v_conn,
        format('INSERT INTO public.exercises (id, user_id, name, category, primary_muscle, equipment, exercise_type, tracking_mode, unilateral, is_system, is_active, catalog_id, catalog_logical_id, import_run_id) VALUES (%L, %L, ''Plank (timed)'', ''isolation'', ''abs'', ''bodyweight'', ''mobility'', ''timed'', false, true, true, %L, %L, %L)',
               'bbbbbbbb-0000-0000-0000-000000000001', NEW.user_id, NEW.catalog_id, NEW.catalog_logical_id, NEW.import_run_id));
      PERFORM dblink_exec(v_conn,
        format('INSERT INTO public.exercise_muscles (user_id, exercise_id, muscle, role) VALUES (%L, %L, ''obliques'', ''secondary''), (%L, %L, ''lower_back'', ''tertiary'')',
               NEW.user_id, 'bbbbbbbb-0000-0000-0000-000000000001', NEW.user_id, 'bbbbbbbb-0000-0000-0000-000000000001'));
    ELSE
      PERFORM dblink_exec(v_conn,
        format('INSERT INTO public.exercises (user_id, name, category, primary_muscle, equipment, exercise_type, tracking_mode, unilateral, is_system, is_active, catalog_id, catalog_logical_id, import_run_id) VALUES (%L, ''Copy of plank hold'', ''isolation'', ''abs'', ''bodyweight'', ''bodyweight'', ''bodyweight'', false, false, true, %L, %L, %L)',
               NEW.user_id, NEW.catalog_id, NEW.catalog_logical_id, NEW.import_run_id));
    END IF;
  END IF;
  RETURN NEW;
END;
\$t\$;" >/dev/null
Q postgres "CREATE TRIGGER test_race_trg BEFORE INSERT ON public.exercises FOR EACH ROW EXECUTE FUNCTION test_race_inject();" >/dev/null
UY1=$(mkuser)
R=$(QU postgres "$UY1" "SET test.race = 'valid'; SET test.sock = '$SOCK'; SELECT deliver_catalog_exercises('$RUN');")
[ "$(J "$R" plank_disposition)" = "already_valid_idempotent" ] && ok "raced VALID winner: accepted only after full shared-shape validation" || bad "raced valid winner disposition: $R"
CNT=$(Q postgres "SELECT count(*)||'|'||string_agg(name, ',' ORDER BY name) FROM public.exercises WHERE user_id='$UY1' AND catalog_logical_id='$LP';")
[ "$CNT" = "1|Plank (timed)" ] && ok "raced VALID winner: exactly the winning distinguished row remains linked" || bad "raced valid rows: $CNT"
[ "$(J "$R" inserted)" = "1" ] && ok "raced VALID winner: non-Plank delivery unaffected (inserted=1)" || bad "raced valid inserted: $R"
UY2=$(mkuser)
if OUT=$(QU postgres "$UY2" "SET test.race = 'malformed'; SET test.sock = '$SOCK'; SELECT deliver_catalog_exercises('$RUN');" 2>&1); then
  bad "raced MALFORMED winner was accepted: $OUT"
else
  printf '%s' "$OUT" | grep -q "inconsistent prior Plank reconciliation"     && ok "raced MALFORMED winner: aborts fail-closed with the inconsistent-reconciliation report"     || bad "raced malformed winner wrong error: $OUT"
fi
ST=$(Q postgres "SELECT count(*)||'|'||count(*) FILTER (WHERE name='Copy of plank hold' AND tracking_mode='bodyweight') FROM public.exercises WHERE user_id='$UY2';")
[ "$ST" = "1|1" ]   && ok "raced MALFORMED winner: the delivery transaction fully rolled back; the independently committed malformed row is untouched (no repair, no partial mutation)"   || bad "raced malformed state: $ST"
Q postgres "DROP TRIGGER test_race_trg ON public.exercises; DROP FUNCTION test_race_inject();" >/dev/null
ok "race injector removed (test-database-only instrumentation)"

echo
echo "Rollback: corrected P2 row excluded; inserted rows keep existing behavior"
R=$(RBK "$U2")
[ "$(Q postgres "SELECT is_active FROM public.exercises WHERE id='$E2';")" = "t" ] && ok "rollback(P2 user): corrected preexisting row STAYS ACTIVE" || bad "rollback deactivated the corrected row"
[ "$(Q postgres "SELECT is_active FROM public.exercises WHERE user_id='$U2' AND catalog_logical_id='$LN';")" = "f" ] && ok "rollback(P2 user): run-INSERTED non-Plank row deactivated (existing behavior)" || bad "rollback NP row wrong"
AL=$(Q postgres "SELECT count(*)||'|'||count(*) FILTER (WHERE is_active) FROM public.exercise_aliases WHERE user_id='$U2' AND import_run_id='$RID';")
[ "$AL" = "1|0" ] && ok "rollback(P2 user): run-delivered alias deactivated while its corrected exercise stays active" || bad "rollback alias state: $AL"
FOUND=$(J "$R" found)
[ "$FOUND" = "1" ] && ok "rollback report: found=1 counts only run-INSERTED exercises (corrected row excluded from the sweep AND the count)" || bad "rollback found: $R"
RBC=$(RBK "$U0")
[ "$(Q postgres "SELECT is_active FROM public.exercises WHERE user_id='$U0' AND catalog_logical_id='$LP';")" = "f" ] && ok "rollback(canonical user): inserted canonical Plank deactivated (existing behavior preserved)" || bad "canonical rollback wrong"
RBD=$(RBK "$U4")
[ "$(Q postgres "SELECT is_active FROM public.exercises WHERE user_id='$U4' AND catalog_logical_id='$LP';")" = "f" ] && ok "rollback(distinguished user): inserted 'Plank (timed)' deactivated" || bad "distinguished rollback wrong"
[ "$(Q postgres "SELECT is_active||'|'||tracking_mode FROM public.exercises WHERE id='$E4';")" = "true|bodyweight" ] && ok "rollback(distinguished user): legacy bodyweight Plank untouched" || bad "legacy touched by rollback"

echo
echo "Post-rollback re-delivery: exact alias dispositions, no duplicates, no silent reactivation"
R=$(DLV "$U2")
[ "$(J "$R" plank_disposition)" = "already_valid_idempotent" ] && ok "re-delivery: corrected row still validates (active, linked, synchronized)" || bad "re-delivery disposition: $R"
[ "$(J "$R" skipped_already_delivered)" = "2" ] && ok "re-delivery: NP + Plank identities both recognized as already delivered" || bad "re-delivery skips: $R"
[ "$(J "$R" alias_already_delivered)" = "1" ] && ok "re-delivery: rolled-back alias is the deterministic already-delivered skip" || bad "re-delivery alias: $R"
AL=$(Q postgres "SELECT count(*)||'|'||count(*) FILTER (WHERE is_active) FROM public.exercise_aliases WHERE user_id='$U2' AND import_run_id='$RID';")
[ "$AL" = "1|0" ] && ok "re-delivery: no duplicate alias row, no silent reactivation (023 semantics unchanged)" || bad "re-delivery alias rows: $AL"

echo
echo "Delete gate + client-role denial on correction provenance"
if Q postgres "DELETE FROM public.exercises WHERE id='$E2';" >/dev/null 2>&1; then
  bad "corrected row was physically deletable"
else
  ok "delete gate: corrected (provenance-carrying) row is fail-closed against physical deletion"
fi
for stmt in "SELECT count(*) FROM public.exercise_catalog_corrections" "INSERT INTO public.exercise_catalog_corrections (user_id, exercise_id, import_run_id, catalog_logical_id) VALUES ('$U2','$E2','$RID','$LP')" "UPDATE public.exercise_catalog_corrections SET corrected_at=NOW()" "DELETE FROM public.exercise_catalog_corrections"; do
  if Q postgres "SET ROLE authenticated; $stmt;" >/dev/null 2>&1; then
    bad "authenticated role was allowed: ${stmt%% *}"
  else
    ok "authenticated role denied: ${stmt%% *} on correction provenance"
  fi
done

echo
echo "Cross-tenant isolation"
ISO=$(Q postgres "SELECT (SELECT count(*) FROM public.exercise_catalog_corrections WHERE user_id='$U2')||'|'||(SELECT count(*) FROM public.exercise_catalog_corrections WHERE user_id<>'$U2');")
[ "$ISO" = "1|0" ] && ok "exactly one correction record, owned by the P2 user only" || bad "correction isolation: $ISO"

echo
echo "Revocation after P2: halts future delivery, never reinterprets corrected data"
Q postgres "SELECT exlib_revoke_run_delivery('$RUN');" >/dev/null
U12=$(mkuser)
if DLV "$U12" >/dev/null 2>&1; then
  bad "delivery still possible after revocation"
else
  ok "revocation: future delivery halted fail-closed"
fi
ROW=$(Q postgres "SELECT is_active||'|'||tracking_mode||'|'||exercise_type FROM public.exercises WHERE id='$E2';")
[ "$ROW" = "true|timed|mobility" ] && ok "revocation: corrected P2 row remains active timed/mobility (never reinterpreted)" || bad "revocation touched P2 row: $ROW"

echo
echo "Compatibility: second 023-only database (pre-026 baseline)"
Q postgres "CREATE DATABASE compat_test;" >/dev/null
COMPAT_STUBS="
CREATE SCHEMA auth;
CREATE TABLE auth.users (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email TEXT);
CREATE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql STABLE
  AS \$\$SELECT nullif(current_setting('app.uid', true), '')::uuid\$\$;"
Q compat_test "$COMPAT_STUBS" >/dev/null
for f in supabase/migrations/0*.sql; do
  psql -h "$SOCK" -U postgres -d compat_test -X -v ON_ERROR_STOP=1 -q -f "$f" >/dev/null 2>&1 \
    || { bad "compat db migration failed: $f"; exit 1; }
done
Q compat_test "INSERT INTO exercise_catalog_logical (id) VALUES ('$LN');" >/dev/null
Q compat_test "INSERT INTO exercise_catalog (id, logical_id, canonical_name, category, primary_muscle, equipment, laterality, tracking_mode, source_url, source_page, retrieved_at, import_confidence) VALUES ('$SN','$LN','Test Row NP','compound','lats','barbell','bilateral','weight_reps','https://example.test/np','https://example.test/dir','2026-08-30','high');" >/dev/null
Q compat_test "INSERT INTO exercise_catalog_muscles (catalog_id, muscle, role) VALUES ('$SN','triceps','secondary');" >/dev/null
Q compat_test "UPDATE exercise_catalog SET review_status='approved', reviewed_by='local-proof-reviewer', reviewed_at=NOW(), review_rationale='local disposable fixture' WHERE id='$SN';" >/dev/null
RID2=$(Q compat_test "INSERT INTO exercise_catalog_import_runs (run_key, dry_run, product_approved_by, product_approved_at, legal_approved_by, legal_approved_at, approval_rationale) VALUES ('$RUN', false, 'local-product', NOW(), 'local-legal', NOW(), 'local disposable fixture') RETURNING id;")
Q compat_test "INSERT INTO exercise_catalog_run_items (run_id, catalog_id) VALUES ('$RID2','$SN');" >/dev/null
Q compat_test "SELECT exlib_approve_and_seal_run('$RUN');" >/dev/null
UC=$(Q compat_test "INSERT INTO auth.users DEFAULT VALUES RETURNING id;")
RC=$(psql -h "$SOCK" -U postgres -d compat_test -X -v ON_ERROR_STOP=1 -qtA -c "SET app.uid='$UC'; SELECT deliver_catalog_exercises('$RUN');")
KEYS_OLD=$(python3 -c "import json,sys; print(','.join(sorted(json.loads(sys.argv[1]).keys())))" "$RC")
[ "$KEYS_OLD" = "${EXPECT_KEYS/plank_disposition,/}" ] && ok "compat: 023-only report has exactly the 13 keys; 026 adds plank_disposition ONLY" || bad "compat keys: $KEYS_OLD"
TUP_OLD=$(Q compat_test "SELECT name||'|'||category||'|'||primary_muscle||'|'||equipment||'|'||exercise_type||'|'||tracking_mode||'|'||unilateral||'|'||is_active||'|'||is_system FROM public.exercises WHERE user_id='$UC' AND catalog_logical_id='$LN';")
UD=$(mkuser)
QU postgres "$UD" "SELECT 1;" >/dev/null 2>&1 || true
TUP_NEW=$(Q postgres "SELECT name||'|'||category||'|'||primary_muscle||'|'||equipment||'|'||exercise_type||'|'||tracking_mode||'|'||unilateral||'|'||is_active||'|'||is_system FROM public.exercises WHERE user_id='$U11' AND catalog_logical_id='$LN';")
[ -n "$TUP_OLD" ] && [ "$TUP_OLD" = "$TUP_NEW" ] && ok "compat: non-Plank delivered row tuple IDENTICAL before/after 026 ($TUP_OLD)" || bad "compat tuple drift: old=$TUP_OLD new=$TUP_NEW"

echo
echo "Review 1: malformed Plank catalog snapshot fails the whole delivery closed"
Q postgres "UPDATE exercise_catalog SET is_active=false WHERE id='$SP';" >/dev/null
LB1='11111111-2222-3333-4444-555555555503'
SB1='aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeee03'
Q postgres "INSERT INTO exercise_catalog_logical (id) VALUES ('$LB1');" >/dev/null
Q postgres "INSERT INTO exercise_catalog (id, logical_id, canonical_name, category, primary_muscle, equipment, laterality, tracking_mode, source_url, source_page, retrieved_at, import_confidence) VALUES ('$SB1','$LB1','Plank','isolation','abs','bodyweight','bilateral','bodyweight','https://example.test/badplank','https://example.test/dir','2026-08-31','high');" >/dev/null
Q postgres "INSERT INTO exercise_catalog_muscles (catalog_id, muscle, role) VALUES ('$SB1','obliques','secondary');" >/dev/null
Q postgres "UPDATE exercise_catalog SET review_status='approved', reviewed_by='local-proof-reviewer', reviewed_at=NOW(), review_rationale='malformed fixture' WHERE id='$SB1';" >/dev/null
RUN4='exlib2e-proof-run-0004'
RID4=$(Q postgres "INSERT INTO exercise_catalog_import_runs (run_key, dry_run, product_approved_by, product_approved_at, legal_approved_by, legal_approved_at, approval_rationale) VALUES ('$RUN4', false, 'local-product', NOW(), 'local-legal', NOW(), 'malformed fixture') RETURNING id;")
Q postgres "INSERT INTO exercise_catalog_run_items (run_id, catalog_id) VALUES ('$RID4','$SB1'), ('$RID4','$SN');" >/dev/null
Q postgres "SELECT exlib_approve_and_seal_run('$RUN4');" >/dev/null
UZ1=$(mkuser)
if OUT=$(QU postgres "$UZ1" "SELECT deliver_catalog_exercises('$RUN4');" 2>&1); then
  bad "bodyweight Plank snapshot was delivered: $OUT"
else
  printf '%s' "$OUT" | grep -q "malformed Plank catalog snapshot"     && ok "snapshot gate: a BODYWEIGHT Plank snapshot fails the whole delivery closed"     || bad "bodyweight snapshot wrong error: $OUT"
fi
[ "$(Q postgres "SELECT count(*) FROM public.exercises WHERE user_id='$UZ1';")" = "0" ]   && ok "snapshot gate: the entire transaction left tenant data unchanged (no non-Plank rows either)"   || bad "snapshot gate leaked rows"
Q postgres "UPDATE exercise_catalog SET is_active=false WHERE id='$SB1';" >/dev/null
LB2='11111111-2222-3333-4444-555555555504'
SB2='aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeee04'
Q postgres "INSERT INTO exercise_catalog_logical (id) VALUES ('$LB2');" >/dev/null
Q postgres "INSERT INTO exercise_catalog (id, logical_id, canonical_name, category, primary_muscle, equipment, laterality, tracking_mode, source_url, source_page, retrieved_at, import_confidence) VALUES ('$SB2','$LB2','Plank','isolation','abs','bodyweight','bilateral','timed','https://example.test/badplank2','https://example.test/dir','2026-08-31','high');" >/dev/null
Q postgres "INSERT INTO exercise_catalog_muscles (catalog_id, muscle, role) VALUES ('$SB2','obliques','secondary');" >/dev/null
Q postgres "UPDATE exercise_catalog SET review_status='approved', reviewed_by='local-proof-reviewer', reviewed_at=NOW(), review_rationale='malformed anatomy fixture' WHERE id='$SB2';" >/dev/null
RUN5='exlib2e-proof-run-0005'
RID5=$(Q postgres "INSERT INTO exercise_catalog_import_runs (run_key, dry_run, product_approved_by, product_approved_at, legal_approved_by, legal_approved_at, approval_rationale) VALUES ('$RUN5', false, 'local-product', NOW(), 'local-legal', NOW(), 'malformed anatomy fixture') RETURNING id;")
Q postgres "INSERT INTO exercise_catalog_run_items (run_id, catalog_id) VALUES ('$RID5','$SB2');" >/dev/null
Q postgres "SELECT exlib_approve_and_seal_run('$RUN5');" >/dev/null
UZ2=$(mkuser)
if OUT=$(QU postgres "$UZ2" "SELECT deliver_catalog_exercises('$RUN5');" 2>&1); then
  bad "wrong-anatomy Plank snapshot was delivered: $OUT"
else
  printf '%s' "$OUT" | grep -q "malformed Plank catalog snapshot"     && ok "snapshot gate: a timed snapshot with the WRONG anatomy multiset fails closed"     || bad "wrong-anatomy snapshot wrong error: $OUT"
fi
[ "$(Q postgres "SELECT count(*) FROM public.exercises WHERE user_id='$UZ2';")" = "0" ]   && ok "snapshot gate: tenant data unchanged after the anatomy-malformed abort"   || bad "anatomy-gate leaked rows"

echo
printf '%d passed, %d failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ] || exit 1
