#!/bin/bash
# ============================================================
# ForgeFitOS - EXLIB-2F migration-026 APPLY-PREP live proof matrix.
#
# Applies the ACTUAL migration candidate
# supabase/migrations/026_exlib_plank_seed_reconciliation.sql as part
# of the ordinary numbered sequence 001-026 - exactly once, never
# additionally sourcing the docs proposal - against a DISPOSABLE
# LOCAL PostgreSQL cluster (unix-socket only, no TCP, torn down on
# exit). This script NEVER contacts Supabase, Vercel, or any remote
# service; the candidate stays NOT APPLIED to any persistent or
# hosted database.
#
# Reproduces the complete promoted EXLIB-2E proof matrix (94
# behavior checks, including the review-1 strict-run/raced-winner/
# snapshot-gate cases and the review-2 locking and concurrency
# proofs) against the migration file instead of the docs proposal,
# and finishes with a two-database equivalence proof:
#   Database A: migrations 001-025 + the reviewed docs proposal.
#   Database B: migrations 001-026 only.
# comparing normalized schema (correction-table columns,
# constraints, indexes, RLS and ACLs; all three function
# definitions and ACLs) and behavior (delivery report keys,
# dispositions, and rollback) - no semantic difference may be
# attributable to apply-prep.
#
# Run from the repository root:
#   bash scripts/verify-exlib2f-live.sh
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
CANDIDATE="supabase/migrations/026_exlib_plank_seed_reconciliation.sql"
PROPSHA=$(shasum -a 256 "$PROPOSAL" | awk '{print $1}')
PROPBYTES=$(wc -c < "$PROPOSAL" | tr -d ' ')
[ "$PROPBYTES/$PROPSHA" = "32500/a6696066d178ced7e53bf81e7106cce64a87e2c73d9b342464d930a2fe3c2108" ] \
  || { bad "reviewed docs proposal drifted from its promoted fingerprint"; exit 1; }
ok "reviewed docs proposal unchanged: $PROPOSAL ($PROPBYTES bytes, sha256 $PROPSHA)"
CANDSHA=$(shasum -a 256 "$CANDIDATE" | awk '{print $1}')
CANDBYTES=$(wc -c < "$CANDIDATE" | tr -d ' ')
ok "candidate under test: $CANDIDATE ($CANDBYTES bytes, sha256 $CANDSHA)"
CAND_COUNT=$(ls supabase/migrations/ | grep -c '^026' || true)
N027=$(ls supabase/migrations/ | grep -c '^027' || true)
[ "$CAND_COUNT/$N027" = "1/0" ] || { bad "expected exactly one 026 candidate and no 027, found $CAND_COUNT/$N027"; exit 1; }
python3 - <<'PYEQ' && ok "exactly one 026 candidate, no 027; its executable SQL is byte-identical to the reviewed docs proposal (only the leading status header differs)" || { bad "026 candidate executable SQL drifted from the reviewed docs proposal"; exit 1; }
def body(p):
    ls = open(p, encoding='utf-8').read().splitlines(keepends=True)
    i = 0
    while i < len(ls) and (not ls[i].strip() or ls[i].lstrip().startswith('--')):
        i += 1
    return ''.join(ls[i:])
import sys
sys.exit(0 if body('docs/exlib2e-migration-026-proposal.sql') == body('supabase/migrations/026_exlib_plank_seed_reconciliation.sql') else 1)
PYEQ

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
echo "Apply auth stubs + the exact numbered migrations 001-026 (the candidate applies ONCE, from supabase/migrations; the docs proposal is never sourced)"
Q postgres "$STUBS" >/dev/null
APPLIED=0
for f in supabase/migrations/0*.sql; do
  psql -h "$SOCK" -U postgres -d postgres -X -v ON_ERROR_STOP=1 -q -f "$f" >/dev/null 2>"$TMP/apply-err.log" \
    || { bad "migration failed: $f"; sed -n '1,5p' "$TMP/apply-err.log"; exit 1; }
  APPLIED=$((APPLIED+1))
done
[ "$APPLIED" = "26" ] || { bad "expected to apply exactly 26 migrations, applied $APPLIED"; exit 1; }
ok "exact migrations 001-026 applied cleanly in order (26 files; candidate applied exactly once)"
ok "migration 026 candidate applies cleanly on top of 025 from supabase/migrations"

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
echo "Review 2: locking contract - the delivery's parent-then-child lock set serializes direct anatomy writes"
CONN="host=$SOCK dbname=postgres user=postgres"
ULK=$(mkuser); ELK=$(seed_plank "$ULK"); seed_anat "$ULK" "$ELK"
# A controlling session takes EXACTLY the delivery's lock set (parent
# exercises row FOR UPDATE, then the child exercise_muscles rows FOR
# UPDATE in primary-key order) and probes competing writes from
# AUTONOMOUS dblink sessions under a short statement_timeout: blocked
# means the competing write waits until the delivery transaction
# completes.
OUT=$(Q postgres "BEGIN;
SELECT 1 FROM public.exercises WHERE id='$ELK' FOR UPDATE;
SELECT 1 FROM public.exercise_muscles m WHERE m.user_id='$ULK' AND m.exercise_id='$ELK' ORDER BY m.id FOR UPDATE;
DO \$p\$
BEGIN
  PERFORM dblink_exec('$CONN', 'SET statement_timeout = 400; UPDATE public.exercise_muscles SET role = ''tertiary'' WHERE exercise_id = ''$ELK'' AND muscle = ''obliques''');
  RAISE EXCEPTION 'PROBE_UPDATE_NOT_BLOCKED';
EXCEPTION WHEN query_canceled THEN
  -- the remote statement_timeout propagates as SQLSTATE 57014,
  -- which WHEN OTHERS deliberately excludes
  RAISE NOTICE 'PROBE_UPDATE_BLOCKED_OK';
END
\$p\$;
DO \$p\$
BEGIN
  PERFORM dblink_exec('$CONN', 'SET statement_timeout = 400; DELETE FROM public.exercise_muscles WHERE exercise_id = ''$ELK''');
  RAISE EXCEPTION 'PROBE_DELETE_NOT_BLOCKED';
EXCEPTION WHEN query_canceled THEN
  -- the remote statement_timeout propagates as SQLSTATE 57014,
  -- which WHEN OTHERS deliberately excludes
  RAISE NOTICE 'PROBE_DELETE_BLOCKED_OK';
END
\$p\$;
COMMIT;" 2>&1) || true
printf '%s' "$OUT" | grep -q "PROBE_UPDATE_BLOCKED_OK" && ok "child-lock probe: a concurrent anatomy UPDATE waits while the delivery lock set is held (cannot race the signature)" || bad "concurrent UPDATE was not blocked: $OUT"
printf '%s' "$OUT" | grep -q "PROBE_DELETE_BLOCKED_OK" && ok "child-lock probe: a concurrent anatomy DELETE waits while the delivery lock set is held" || bad "concurrent DELETE was not blocked: $OUT"
Q postgres "SELECT dblink_exec('$CONN', 'UPDATE public.exercise_muscles SET role = ''tertiary'' WHERE exercise_id = ''$ELK'' AND muscle = ''obliques''');" >/dev/null
[ "$(Q postgres "SELECT role FROM public.exercise_muscles WHERE exercise_id='$ELK' AND muscle='obliques';")" = "tertiary" ] && ok "child-lock probe: after the lock holder commits, the SAME competing write succeeds (blocking was the row lock, not a privilege)" || bad "post-release UPDATE failed"
Q postgres "UPDATE public.exercise_muscles SET role='secondary' WHERE exercise_id='$ELK' AND muscle='obliques';" >/dev/null
OUT=$(Q postgres "BEGIN;
SELECT 1 FROM public.exercises WHERE id='$ELK' FOR UPDATE;
DO \$p\$
BEGIN
  PERFORM dblink_exec('$CONN', 'SET statement_timeout = 400; INSERT INTO public.exercise_muscles (user_id, exercise_id, muscle, role) VALUES (''$ULK'', ''$ELK'', ''quads'', ''tertiary'')');
  RAISE EXCEPTION 'PROBE_INSERT_NOT_BLOCKED';
EXCEPTION WHEN query_canceled THEN
  -- the remote statement_timeout propagates as SQLSTATE 57014,
  -- which WHEN OTHERS deliberately excludes
  RAISE NOTICE 'PROBE_INSERT_BLOCKED_OK';
END
\$p\$;
COMMIT;" 2>&1) || true
printf '%s' "$OUT" | grep -q "PROBE_INSERT_BLOCKED_OK" && ok "parent-lock probe: a NEW child anatomy INSERT is serialized by the FK key-share against the parent FOR UPDATE alone (proven against PostgreSQL, not documented) - no phantom row can escape the validated signature" || bad "concurrent INSERT was not blocked by the parent lock: $OUT"
Q postgres "SELECT dblink_exec('$CONN', 'INSERT INTO public.exercise_muscles (user_id, exercise_id, muscle, role) VALUES (''$ULK'', ''$ELK'', ''quads'', ''tertiary'')');" >/dev/null
[ "$(Q postgres "SELECT count(*) FROM public.exercise_muscles WHERE exercise_id='$ELK';")" = "2" ] && ok "parent-lock probe: the same INSERT succeeds once the parent lock is released" || bad "post-release INSERT failed"
Q postgres "DELETE FROM public.exercise_muscles WHERE exercise_id='$ELK' AND muscle='quads';" >/dev/null
OUT=$(Q postgres "SELECT dblink_connect('c2', '$CONN');
SELECT dblink_exec('c2', 'BEGIN');
SELECT dblink_exec('c2', 'UPDATE public.exercise_muscles SET role = role WHERE exercise_id = ''$ELK''');
BEGIN;
SELECT 1 FROM public.exercises WHERE id='$ELK' FOR UPDATE NOWAIT;
ROLLBACK;
SELECT dblink_exec('c2', 'ROLLBACK');
SELECT dblink_disconnect('c2');
SELECT 'TOPOLOGY_OK';" 2>&1) || true
printf '%s' "$OUT" | grep -q "TOPOLOGY_OK" && ok "no-deadlock topology: a client anatomy write holds NO parent exercises lock (FOR UPDATE NOWAIT succeeds beside it), so delivery's strict parent-then-child order admits no lock cycle" || bad "topology probe failed: $OUT"

echo
echo "Review 2: a concurrent anatomy customization can never be overwritten as a pristine correction"
UPB=$(mkuser); EPB=$(seed_plank "$UPB"); seed_anat "$UPB" "$EPB"
# An autonomous session takes the child row lock FIRST with a pending
# customization; delivery starts while it is held, blocks at the
# child locks, and must OBSERVE the committed customization.
psql -h "$SOCK" -U postgres -d postgres -X -q -c "BEGIN; UPDATE public.exercise_muscles SET role='tertiary' WHERE exercise_id='$EPB'; SELECT pg_sleep(1.5); COMMIT;" >/dev/null 2>&1 &
BLKPID=$!
sleep 0.4
R=$(DLV "$UPB")
wait "$BLKPID"
[ "$(J "$R" plank_disposition)" = "precondition_failure_preserved_legacy_plus_distinguished_delivery" ] && ok "mid-flight customization: delivery WAITED on the competing child lock, observed the committed customization, and routed to preserved-legacy (never a pristine correction)" || bad "mid-flight disposition: $R"
ROW=$(Q postgres "SELECT tracking_mode||'|'||exercise_type||'|'||(catalog_id IS NULL)||'|'||(SELECT string_agg(muscle||':'||role, ',' ORDER BY muscle, role) FROM public.exercise_muscles WHERE exercise_id='$EPB') FROM public.exercises WHERE id='$EPB';")
[ "$ROW" = "bodyweight|bodyweight|true|obliques:tertiary" ] && ok "mid-flight customization: the legacy row keeps the customization VERBATIM (no overwrite, no partial anatomy replacement, no provenance)" || bad "mid-flight legacy row: $ROW"
DIST=$(Q postgres "SELECT count(*) FROM public.exercises WHERE user_id='$UPB' AND name='Plank (timed)' AND catalog_logical_id='$LP';")
CRPB=$(Q postgres "SELECT count(*) FROM public.exercise_catalog_corrections WHERE user_id='$UPB';")
[ "$DIST|$CRPB" = "1|0" ] && ok "mid-flight customization: distinguished 'Plank (timed)' delivered alongside, with ZERO correction records for that user" || bad "mid-flight dist/corr: $DIST|$CRPB"
UPD=$(mkuser); EPD=$(seed_plank "$UPD"); seed_anat "$UPD" "$EPD"
Q postgres "SELECT dblink_exec('$CONN', 'DELETE FROM public.exercise_muscles WHERE exercise_id = ''$EPD''');" >/dev/null
R=$(DLV "$UPD")
[ "$(J "$R" plank_disposition)" = "precondition_failure_preserved_legacy_plus_distinguished_delivery" ] && [ "$(Q postgres "SELECT tracking_mode FROM public.exercises WHERE id='$EPD';")" = "bodyweight" ] && ok "autonomously committed anatomy DELETE: delivery observes the emptied anatomy and preserves the legacy row (P5 routing)" || bad "autonomous DELETE case: $R"
UPI=$(mkuser); EPI=$(seed_plank "$UPI"); seed_anat "$UPI" "$EPI"
Q postgres "SELECT dblink_exec('$CONN', 'INSERT INTO public.exercise_muscles (user_id, exercise_id, muscle, role) VALUES (''$UPI'', ''$EPI'', ''quads'', ''tertiary'')');" >/dev/null
R=$(DLV "$UPI")
AN=$(Q postgres "SELECT string_agg(muscle||':'||role, ',' ORDER BY muscle, role) FROM public.exercise_muscles WHERE exercise_id='$EPI';")
[ "$(J "$R" plank_disposition)" = "precondition_failure_preserved_legacy_plus_distinguished_delivery" ] && [ "$AN" = "obliques:secondary,quads:tertiary" ] && ok "autonomously committed anatomy INSERT: the extra row is observed (no phantom escapes the signature) and the legacy anatomy is preserved untouched" || bad "autonomous INSERT case: $R / $AN"

echo
echo "Review 2: existing-link validation can never return valid over concurrently changed anatomy"
ULV=$(mkuser)
DLV "$ULV" >/dev/null
Q postgres "SELECT dblink_exec('$CONN', 'UPDATE public.exercise_muscles SET role = ''secondary'' WHERE muscle = ''lower_back'' AND exercise_id IN (SELECT id FROM public.exercises WHERE user_id = ''$ULV'' AND catalog_logical_id = ''$LP'')');" >/dev/null
if OUT=$(DLV "$ULV" 2>&1); then
  bad "existing-link validated over customized anatomy: $OUT"
else
  printf '%s' "$OUT" | grep -q "inconsistent prior Plank reconciliation" && ok "existing-link validation: a concurrently customized anatomy signature is read under the child locks and ABORTS (never already_valid_idempotent)" || bad "existing-link wrong error: $OUT"
fi
AN=$(Q postgres "SELECT string_agg(m.muscle||':'||m.role, ',' ORDER BY m.muscle, m.role) FROM public.exercise_muscles m JOIN public.exercises e ON e.id=m.exercise_id WHERE e.user_id='$ULV' AND e.catalog_logical_id='$LP';")
[ "$AN" = "lower_back:secondary,obliques:secondary" ] && ok "existing-link validation: the customized anatomy is left untouched - no silent repair back to the catalog multiset" || bad "existing-link anatomy mutated: $AN"
ROW=$(Q postgres "SELECT (tracking_mode='timed')||'|'||is_active FROM public.exercises WHERE user_id='$U2' AND id='$E2';")
AN2=$(Q postgres "SELECT string_agg(muscle||':'||role, ',' ORDER BY muscle, role) FROM public.exercise_muscles WHERE exercise_id='$E2';")
[ "$ROW|$AN2" = "true|true|lower_back:tertiary,obliques:secondary" ] && ok "cross-tenant: the P2 user's corrected row and synchronized anatomy are byte-stable across every review-2 concurrency scenario" || bad "cross-tenant drift: $ROW|$AN2"

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
  # pre-026 baseline: 026 deliberately excluded from this database
  case "$f" in supabase/migrations/02[6-9]_*) continue;; esac
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
echo "Two-database equivalence: A = 001-025 + reviewed docs proposal; B = 001-026 only"
EQ_STUBS="
CREATE SCHEMA auth;
CREATE TABLE auth.users (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email TEXT);
CREATE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql STABLE
  AS \$\$SELECT nullif(current_setting('app.uid', true), '')::uuid\$\$;"
for db in eqa eqb; do
  Q postgres "CREATE DATABASE $db;" >/dev/null
  Q "$db" "$EQ_STUBS" >/dev/null
  for f in supabase/migrations/0*.sql; do
    if [ "$db" = "eqa" ]; then case "$f" in supabase/migrations/02[6-9]_*) continue;; esac; fi
    psql -h "$SOCK" -U postgres -d "$db" -X -v ON_ERROR_STOP=1 -q -f "$f" >/dev/null 2>&1 \
      || { bad "equivalence db $db migration failed: $f"; exit 1; }
  done
done
psql -h "$SOCK" -U postgres -d eqa -X -v ON_ERROR_STOP=1 -q -f "$PROPOSAL" >/dev/null 2>&1 \
  || { bad "equivalence db eqa: docs proposal failed to apply"; exit 1; }
ok "equivalence databases built: eqa (001-025 + docs proposal), eqb (001-026 only)"

SCHEMA_SQL="
SELECT 'col|'||column_name||'|'||data_type||'|'||is_nullable||'|'||COALESCE(column_default,'-')
  FROM information_schema.columns WHERE table_schema='public' AND table_name='exercise_catalog_corrections' ORDER BY ordinal_position;
SELECT 'con|'||conname||'|'||contype::text||'|'||pg_get_constraintdef(oid)
  FROM pg_constraint WHERE conrelid='public.exercise_catalog_corrections'::regclass ORDER BY conname;
SELECT 'idx|'||indexname||'|'||indexdef FROM pg_indexes
  WHERE schemaname='public' AND tablename='exercise_catalog_corrections' ORDER BY indexname;
SELECT 'rls|'||relrowsecurity||'|'||relforcerowsecurity||'|'||COALESCE(relacl::text,'-')
  FROM pg_class WHERE oid='public.exercise_catalog_corrections'::regclass;
SELECT 'pol|'||count(*) FROM pg_policies WHERE schemaname='public' AND tablename='exercise_catalog_corrections';
SELECT 'fn|'||md5(pg_get_functiondef(oid))||'|'||proname||'|'||provolatile::text||'|'||prosecdef||'|'||COALESCE(proacl::text,'-')||'|'||COALESCE(array_to_string(proconfig,';'),'-')
  FROM pg_proc WHERE proname IN ('exlib_plank_link_valid','deliver_catalog_exercises','rollback_catalog_delivery')
  AND pronamespace='public'::regnamespace ORDER BY proname;"
Q eqa "$SCHEMA_SQL" > "$TMP/eq-a.txt" 2>&1 || { bad "schema dump failed (eqa):"; tail -3 "$TMP/eq-a.txt"; exit 1; }
Q eqb "$SCHEMA_SQL" > "$TMP/eq-b.txt" 2>&1 || { bad "schema dump failed (eqb):"; tail -3 "$TMP/eq-b.txt"; exit 1; }
if diff -q "$TMP/eq-a.txt" "$TMP/eq-b.txt" >/dev/null; then
  ok "normalized schema IDENTICAL: correction-table columns/constraints/indexes/RLS/ACLs + all three function definitions (md5), volatility, security, ACLs, and search_path config"
else
  bad "schema divergence between proposal-applied and candidate-applied databases:"; diff "$TMP/eq-a.txt" "$TMP/eq-b.txt" | head -10
fi
grep -q "^fn|" "$TMP/eq-a.txt" && [ "$(grep -c '^fn|' "$TMP/eq-a.txt")" = "3" ] \
  && ok "equivalence dumps are non-vacuous: exactly three functions captured per database" \
  || bad "equivalence dump vacuous: $(grep -c '^fn|' "$TMP/eq-a.txt") functions"

# identical behavior fixtures in both, then compare user-id-free outputs
EQ_FIX="
INSERT INTO exercise_catalog_logical (id) VALUES ('$LP'), ('$LN');
INSERT INTO exercise_catalog (id, logical_id, canonical_name, category, primary_muscle, equipment, laterality, tracking_mode, source_url, source_page, retrieved_at, import_confidence) VALUES
  ('$SP','$LP','Plank','isolation','abs','bodyweight','bilateral','timed','https://example.test/plank','https://example.test/dir','2026-08-30','high'),
  ('$SN','$LN','Test Row NP','compound','lats','barbell','bilateral','weight_reps','https://example.test/np','https://example.test/dir','2026-08-30','high');
INSERT INTO exercise_catalog_muscles (catalog_id, muscle, role) VALUES
  ('$SP','obliques','secondary'), ('$SP','lower_back','tertiary'), ('$SN','triceps','secondary');
INSERT INTO exercise_catalog_aliases (id, logical_id, alias) VALUES ('$AP','$LP','Front plank test');
UPDATE exercise_catalog SET review_status='approved', reviewed_by='local-proof-reviewer', reviewed_at=NOW(), review_rationale='local disposable fixture' WHERE id IN ('$SP','$SN');
INSERT INTO exercise_catalog_import_runs (run_key, dry_run, product_approved_by, product_approved_at, legal_approved_by, legal_approved_at, approval_rationale) VALUES ('eq-run-1', false, 'local-product', NOW(), 'local-legal', NOW(), 'local disposable fixture');
INSERT INTO exercise_catalog_run_items (run_id, catalog_id) SELECT id, unnest(ARRAY['$SP'::uuid,'$SN'::uuid]) FROM exercise_catalog_import_runs WHERE run_key='eq-run-1';
INSERT INTO exercise_catalog_run_items (run_id, catalog_alias_id) SELECT id, '$AP' FROM exercise_catalog_import_runs WHERE run_key='eq-run-1';
SELECT exlib_approve_and_seal_run('eq-run-1');"
for db in eqa eqb; do
  Q "$db" "$EQ_FIX" >/dev/null
done
eqrun() { # $1 db  -> canonical delivery + P2 correction + retry + rollback behavior dump
  local db="$1"
  local U1 U2 E2 R
  U1=$(Q "$db" "INSERT INTO auth.users DEFAULT VALUES RETURNING id;")
  R=$(QU "$db" "$U1" "SELECT deliver_catalog_exercises('eq-run-1');")
  python3 -c "import json,sys; d=json.loads(sys.argv[1]); print('keys|'+','.join(sorted(d.keys()))); print('fresh|'+str(d['plank_disposition'])+'|'+str(d['inserted'])+'|'+str(d['alias_inserted'])+'|'+str(d['eligible']))" "$R"
  Q "$db" "SELECT 'freshrow|'||tracking_mode||'|'||exercise_type||'|'||name||'|'||is_system||'|'||(import_run_id IS NOT NULL) FROM public.exercises WHERE user_id='$U1' AND catalog_logical_id='$LP';"
  U2=$(Q "$db" "INSERT INTO auth.users DEFAULT VALUES RETURNING id;")
  E2=$(Q "$db" "INSERT INTO public.exercises (user_id, name, category, primary_muscle, equipment, exercise_type, tracking_mode, unilateral, is_system, is_active) VALUES ('$U2','Plank','isolation','abs','bodyweight','bodyweight','bodyweight',false,true,true) RETURNING id;")
  Q "$db" "INSERT INTO public.exercise_muscles (user_id, exercise_id, muscle, role) VALUES ('$U2','$E2','obliques','secondary');" >/dev/null
  R=$(QU "$db" "$U2" "SELECT deliver_catalog_exercises('eq-run-1');")
  python3 -c "import json,sys; d=json.loads(sys.argv[1]); print('p2|'+str(d['plank_disposition'])+'|'+str(d['inserted']))" "$R"
  Q "$db" "SELECT 'p2row|'||tracking_mode||'|'||exercise_type||'|'||name||'|'||(id='$E2')||'|'||(SELECT string_agg(muscle||':'||role, ',' ORDER BY muscle, role) FROM public.exercise_muscles WHERE exercise_id='$E2') FROM public.exercises WHERE user_id='$U2' AND catalog_logical_id='$LP';"
  Q "$db" "SELECT 'p2corr|'||count(*) FROM public.exercise_catalog_corrections WHERE user_id='$U2' AND exercise_id='$E2';"
  R=$(QU "$db" "$U2" "SELECT deliver_catalog_exercises('eq-run-1');")
  python3 -c "import json,sys; d=json.loads(sys.argv[1]); print('retry|'+str(d['plank_disposition'])+'|'+str(d['skipped_already_delivered']))" "$R"
  R=$(QU "$db" "$U2" "SELECT rollback_catalog_delivery('eq-run-1');")
  python3 -c "import json,sys; d=json.loads(sys.argv[1]); print('rbk|'+str(d['found'])+'|'+str(d['newly_deactivated'])+'|'+str(d['alias_found']))" "$R"
  Q "$db" "SELECT 'postrbk|'||is_active||'|'||tracking_mode FROM public.exercises WHERE id='$E2';"
  Q "$db" "SELECT 'postrbknp|'||count(*) FILTER (WHERE is_active) FROM public.exercises WHERE user_id='$U2' AND catalog_logical_id='$LN';"
}
eqrun eqa > "$TMP/eq-beh-a.txt" 2>&1 || { bad "behavior run failed (eqa):"; tail -3 "$TMP/eq-beh-a.txt"; exit 1; }
eqrun eqb > "$TMP/eq-beh-b.txt" 2>&1 || { bad "behavior run failed (eqb):"; tail -3 "$TMP/eq-beh-b.txt"; exit 1; }
if diff -q "$TMP/eq-beh-a.txt" "$TMP/eq-beh-b.txt" >/dev/null; then
  ok "behavior IDENTICAL: report keys, canonical delivery, P2 correction + record, verified-idempotency retry, rollback report and exclusion, tuple for tuple"
else
  bad "behavior divergence between proposal-applied and candidate-applied databases:"; diff "$TMP/eq-beh-a.txt" "$TMP/eq-beh-b.txt" | head -12
fi
grep -q "^p2|corrected_and_linked_pristine_seed" "$TMP/eq-beh-a.txt" \
  && grep -q "^rbk|" "$TMP/eq-beh-a.txt" \
  && ok "behavior dumps are non-vacuous: P2 correction and rollback actually exercised in both databases" \
  || bad "behavior dump vacuous or P2 route missing"

echo
printf '%d passed, %d failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ] || exit 1
