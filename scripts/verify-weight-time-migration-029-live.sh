#!/bin/bash
# ============================================================
# ForgeFitOS - migration 029 (Plank cross-run idempotency): DISPOSABLE PostgreSQL proof.
#
# Applies migrations 001-028 to a disposable local cluster (unix socket only,
# destroyed on exit), builds a minimal plank world (the committed 2K and 2O
# loads, snapshots approved with TEST-ONLY tuples, runs created as the owner
# exactly as the promoted staging package does), reads the migration-028 helper
# definition, then applies 029 exactly once and proves, calling the shared
# helper DIRECTLY and through deliver_catalog_exercises:
#   - the current-run exact provenance still validates;
#   - a PRIOR run that is approved, non-dry, sealed, unrevoked and carries
#     EXACTLY p_cat_id validates (the positive control);
#   - every forbidden prior-run posture is refused: nonexistent, unapproved/
#     unsealed, dry, revoked, unrelated sealed run without p_cat_id, and a
#     sealed run carrying only a DIFFERENT snapshot of the same Plank identity;
#   - every retained non-provenance failure still fails (anatomy, mode,
#     exercise_type, catalog_id, logical_id, name/claim);
#   - the defect is reproduced on a pre-029 clone and fixed after 029;
#   - a sabotaged 029 rolls back and leaves the 028 helper intact;
#   - the internal-only posture is unchanged; the migration count is 29.
# Never contacts Supabase, Vercel or any remote service; never invokes the
# Supabase CLI. Every human-looking string is a TEST-ONLY fixture value.
# Run from the repository root:
#   bash scripts/verify-weight-time-migration-029-live.sh
# ============================================================
set -uo pipefail
export LC_ALL=C LANG=C
M029='supabase/migrations/029_exlib_plank_cross_run_idempotency.sql'
PKG2K="docs/exlib2k-plank-catalog-load-package.sql"
PKG2O="docs/exlib2o-target-snapshot-load-package.sql"
LP='e21b2c00-0000-4000-a000-000000000001'
LD='e21b2c00-0000-4000-a000-000000000002'
SIG='public.exlib_plank_link_valid(uuid,public.exercises,uuid,uuid,text,uuid)'
PASS=0; FAIL=0
ok()  { PASS=$((PASS+1)); printf '  PASS  %s\n' "$1"; }
bad() { FAIL=$((FAIL+1)); printf '  FAIL  %s\n' "$1"; [ -n "${2:-}" ] && printf '        %s\n' "$2"; return 0; }
TMP="$(mktemp -d /tmp/w14e-m029-pg.XXXXXX)"; PGDATA="$TMP/pgdata"; SOCK="$TMP"
cleanup() { pg_ctl -D "$PGDATA" stop -m immediate >/dev/null 2>&1 || true; rm -rf "$TMP"; }
trap cleanup EXIT
Q()  { psql -h "$SOCK" -U postgres -d "${DB:-postgres}" -X -v ON_ERROR_STOP=1 -qtA -c "$1" 2>&1; }
QD() { psql -h "$SOCK" -U postgres -d "$1" -X -v ON_ERROR_STOP=1 -qtA -c "$2" 2>&1; }
QA() { psql -h "$SOCK" -U supabase_admin -d postgres -X -v ON_ERROR_STOP=1 -qtA -c "$1"; }
QT() { psql -h "$SOCK" -U postgres -d template1 -X -v ON_ERROR_STOP=1 -qtA -c "$1"; }
expect_eq() { local got; got=$(QD "${4:-postgres}" "$2"); if [ "$got" = "$3" ]; then ok "$1"; else bad "$1" "expected [$3], got [$got]"; fi; }
DEF_SQL="SELECT pg_get_functiondef('$SIG'::regprocedure)"
POSTURE_SQL="SELECT has_function_privilege('anon','$SIG','EXECUTE')::text||'/'||has_function_privilege('authenticated','$SIG','EXECUTE')::text||'/'||has_function_privilege('service_role','$SIG','EXECUTE')::text||'/'||(SELECT prosecdef::text FROM pg_proc WHERE oid='$SIG'::regprocedure)||'/'||(SELECT provolatile::text FROM pg_proc WHERE oid='$SIG'::regprocedure)||'/'||(SELECT pg_get_function_identity_arguments(oid) FROM pg_proc WHERE oid='$SIG'::regprocedure)"
POSTURE_OK="false/false/false/true/v/p_uid uuid, p_link exercises, p_cat_id uuid, p_logical uuid, p_canonical text, p_run_id uuid"

echo; echo "=== A. Cluster, migrations 001-028, plank world"
initdb -D "$PGDATA" -U supabase_admin --no-locale -E UTF8 >/dev/null 2>&1
pg_ctl -D "$PGDATA" -o "-c listen_addresses='' -c unix_socket_directories='$SOCK'" -l "$TMP/pg.log" start >/dev/null 2>&1
QA "SELECT 1" >/dev/null 2>&1 && ok "A1: cluster up (unix socket only; no hosted contact)" || { bad "A1: cluster failed"; exit 1; }
QA "CREATE ROLE postgres LOGIN NOSUPERUSER CREATEDB CREATEROLE; CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN; ALTER DATABASE postgres OWNER TO postgres;" >/dev/null
Q "CREATE SCHEMA auth; CREATE TABLE auth.users (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email TEXT); CREATE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql STABLE AS \$\$SELECT nullif(current_setting('app.uid', true), '')::uuid\$\$;" >/dev/null
APPLIED=0
for f in supabase/migrations/0*.sql; do
  case "$(basename "$f")" in 029_*) continue;; esac
  psql -h "$SOCK" -U postgres -d postgres -X -v ON_ERROR_STOP=1 -q -f "$f" >/dev/null 2>"$TMP/err.log" || { bad "A2: migration failed: $f" "$(head -2 "$TMP/err.log")"; exit 1; }
  APPLIED=$((APPLIED+1))
done
[ "$APPLIED" = "28" ] && ok "A2: migrations 001-028 applied in order (029 deliberately held back)" || bad "A2: applied $APPLIED"
[ "$(ls supabase/migrations | grep -c '^029')" = "1" ] && [ "$(ls supabase/migrations/*.sql | wc -l | tr -d ' ')" = "29" ] && ok "A3: exactly one 029 exists and the committed inventory is 29 files" || bad "A3: inventory wrong"
psql -h "$SOCK" -U postgres -d postgres -X -v ON_ERROR_STOP=1 -q -f "$PKG2K" >/dev/null 2>&1 && psql -h "$SOCK" -U postgres -d postgres -X -v ON_ERROR_STOP=1 -q -f "$PKG2O" >/dev/null 2>&1 && ok "A4: the committed 2K and 2O loads gave Plank, Dead bug and Ab wheel rollout snapshots" || { bad "A4: plank world load failed"; exit 1; }
Q "UPDATE public.exercise_catalog SET review_status='approved', reviewed_by='TEST-ONLY fixture reviewer', reviewed_at=now(), review_rationale='TEST-ONLY fixture approval for the disposable 029 proof only' WHERE is_active" >/dev/null && ok "A5: the three snapshots approved with TEST-ONLY fixture tuples (needed only so runs can seal)" || bad "A5: approval failed"
SP=$(Q "SELECT id FROM public.exercise_catalog WHERE logical_id='$LP' AND is_active"); SD=$(Q "SELECT id FROM public.exercise_catalog WHERE logical_id='$LD' AND is_active")
mkrun() { # KEY members(space-separated catalog ids) [dry]
  local key="$1" members="$2" dry="${3:-false}"
  Q "INSERT INTO public.exercise_catalog_import_runs (run_key, dry_run, product_approved_by, product_approved_at, legal_approved_by, legal_approved_at, approval_rationale) VALUES ('$key', $dry, 'TEST-ONLY product', now(), 'TEST-ONLY legal', now(), 'TEST-ONLY fixture run for the disposable 029 proof') RETURNING id" 
}
addmember() { Q "INSERT INTO public.exercise_catalog_run_items (run_id, catalog_id) VALUES ('$1','$2')" >/dev/null; }
R_PRIOR=$(mkrun m029-prior-sealed-with-plank "x"); addmember "$R_PRIOR" "$SP"; addmember "$R_PRIOR" "$SD"; Q "SELECT public.exlib_approve_and_seal_run('m029-prior-sealed-with-plank')" >/dev/null
R_CUR=$(mkrun m029-current-cumulative "x"); addmember "$R_CUR" "$SP"; addmember "$R_CUR" "$SD"; Q "SELECT public.exlib_approve_and_seal_run('m029-current-cumulative')" >/dev/null
R_UNSEALED=$(mkrun m029-unsealed-with-plank "x"); addmember "$R_UNSEALED" "$SP"
R_DRY=$(mkrun m029-dry-with-plank "x" true); addmember "$R_DRY" "$SP"
R_REVOKED=$(mkrun m029-revoked-with-plank "x"); addmember "$R_REVOKED" "$SP"; Q "SELECT public.exlib_approve_and_seal_run('m029-revoked-with-plank')" >/dev/null; Q "SELECT public.exlib_revoke_run_delivery('m029-revoked-with-plank')" >/dev/null
R_UNRELATED=$(mkrun m029-unrelated-sealed-no-plank "x"); addmember "$R_UNRELATED" "$SD"; Q "SELECT public.exlib_approve_and_seal_run('m029-unrelated-sealed-no-plank')" >/dev/null
expect_eq "A6: fixture runs in place - prior (sealed, carries Plank), current (sealed, carries Plank), unsealed, dry, revoked, unrelated-sealed-without-Plank" \
  "SELECT string_agg(run_key||':'||approved_for_delivery::text||':'||dry_run::text||':'||(sealed_at IS NOT NULL)::text||':'||(revoked_at IS NOT NULL)::text||':'||(SELECT count(*) FROM public.exercise_catalog_run_items ri WHERE ri.run_id=r.id AND ri.catalog_id='$SP')::text, ' ' ORDER BY run_key) FROM public.exercise_catalog_import_runs r" \
  "m029-current-cumulative:true:false:true:false:1 m029-dry-with-plank:false:true:false:false:1 m029-prior-sealed-with-plank:true:false:true:false:1 m029-revoked-with-plank:true:false:true:true:1 m029-unrelated-sealed-no-plank:true:false:true:false:0 m029-unsealed-with-plank:false:false:false:false:1"
U=$(Q "INSERT INTO auth.users DEFAULT VALUES RETURNING id")
Q "SET app.uid='$U'; SELECT public.deliver_catalog_exercises('m029-prior-sealed-with-plank')" >/dev/null
E=$(Q "SELECT id FROM public.exercises WHERE user_id='$U' AND catalog_logical_id='$LP'")
expect_eq "A7: the user holds ONE Plank row delivered by the PRIOR run (canonical timed Plank, import_run_id = prior run, catalog anatomy)" \
  "SELECT (SELECT count(*) FROM public.exercises WHERE user_id='$U' AND catalog_logical_id='$LP')::text||'/'||(SELECT (e.import_run_id='$R_PRIOR')::text||'/'||e.name||'/'||e.tracking_mode||'/'||e.exercise_type FROM public.exercises e WHERE e.id='$E')" "1/true/Plank/timed/mobility"
DEF028=$(Q "$DEF_SQL"); POST028=$(Q "$POSTURE_SQL")
echo "$DEF028" | grep -qF 'AND p_link.import_run_id = p_run_id' && ! echo "$DEF028" | grep -qF 'pr.approved_for_delivery' && ok "A8: the LIVE 028 helper carries the strict current-run clause and no prior-run clause (read back from pg_get_functiondef)" || bad "A8: unexpected 028 helper body"
[ "$POST028" = "$POSTURE_OK" ] && ok "A9: 028 helper posture: no client EXECUTE (anon/authenticated/service_role), SECURITY DEFINER, VOLATILE, identity signature unchanged" || bad "A9: posture $POST028"
QT "CREATE DATABASE pre029 TEMPLATE postgres OWNER postgres" >/dev/null 2>&1 && ok "A10: pre-029 template captured" || bad "A10: template failed"

echo; echo "=== B. The DEFECT, reproduced on the pre-029 world"
B1=$(QD pre029 "SET app.uid='$U'; SELECT public.deliver_catalog_exercises('m029-current-cumulative')" | head -1)
[ "$B1" = "ERROR:  deliver_catalog_exercises: inconsistent prior Plank reconciliation requires separate investigation (no silent repair, relink, anatomy overwrite, or rename)" ] && ok "B1 (F-E8 reproduced): under 028 the CURRENT run refuses a user whose valid Plank row came from the PRIOR sealed run: '$B1'" || bad "B1: expected the strict-provenance refusal" "$B1"
expect_eq "B2: on the pre-029 clone the helper returns FALSE for the prior-run row against the current run, TRUE against its own run" \
  "SELECT public.exlib_plank_link_valid('$U', e, '$SP', '$LP', 'Plank', '$R_CUR')::text||'/'||public.exlib_plank_link_valid('$U', e, '$SP', '$LP', 'Plank', '$R_PRIOR')::text FROM public.exercises e WHERE e.id='$E'" "false/true" pre029

echo; echo "=== C. Apply migration 029 EXACTLY ONCE (one transaction) and read the helper back"
psql -h "$SOCK" -U postgres -d postgres -X -v ON_ERROR_STOP=1 -q -f "$M029" > "$TMP/m029.out" 2>&1 && ok "C1: migration 029 applied (exit 0) as the non-superuser postgres" || { bad "C1: 029 failed" "$(head -3 "$TMP/m029.out")"; exit 1; }
DEF029=$(Q "$DEF_SQL")
echo "$DEF029" | grep -qF 'pr.approved_for_delivery = true' && echo "$DEF029" | grep -qF 'pri.catalog_id = p_cat_id' && ok "C2: the LIVE helper now carries the prior-run clause pinned on exact p_cat_id membership" || bad "C2: 029 clause absent"
# The before/after LIVE definitions must differ ONLY in the provenance clause:
# strip comment lines, remove the OLD clause from the 028 text and the NEW clause
# from the 029 text, and require the remainders to be byte-identical.
python3 - "$DEF028" "$DEF029" <<'PY' > "$TMP/c3.out" 2>&1
import sys, re
old, new = sys.argv[1], sys.argv[2]
strip = lambda t: "\n".join(l for l in t.split("\n") if not l.strip().startswith("--"))
o, n = strip(old), strip(new)
OLD = "    AND p_link.import_run_id = p_run_id\n"
NEW = ("    AND p_link.import_run_id IS NOT NULL\n    AND (\n      p_link.import_run_id = p_run_id\n      OR EXISTS (\n        SELECT 1\n"
       "        FROM public.exercise_catalog_import_runs pr\n        JOIN public.exercise_catalog_run_items pri ON pri.run_id = pr.id\n"
       "        WHERE pr.id = p_link.import_run_id\n          AND pr.approved_for_delivery = true\n          AND pr.dry_run = false\n"
       "          AND pr.sealed_at IS NOT NULL\n          AND pr.revoked_at IS NULL\n          AND pri.catalog_id = p_cat_id\n      )\n    )\n")
print("old_has_old", o.count(OLD), "old_has_new", o.count(NEW), "new_has_old", n.count(OLD), "new_has_new", n.count(NEW), "rest_equal", o.replace(OLD, "", 1) == n.replace(NEW, "", 1))
PY
[ "$(cat "$TMP/c3.out")" = "old_has_old 1 old_has_new 0 new_has_old 0 new_has_new 1 rest_equal True" ] && ok "C3: the LIVE before/after definitions differ ONLY in the provenance clause: the 028 body carries the strict clause once, the 029 body carries the new clause once, and with those removed the two bodies are byte-identical" || bad "C3: unexpected body differences" "$(cat "$TMP/c3.out")"
expect_eq "C4: posture unchanged after 029 - no client EXECUTE, SECURITY DEFINER, VOLATILE, identity signature identical" "$POSTURE_SQL" "$POSTURE_OK"
expect_eq "C5: 029 changed no other function, table, trigger or grant: the catalog function set is unchanged and deliver_catalog_exercises has ONE definition" \
  "SELECT (SELECT count(*) FROM pg_proc WHERE proname='deliver_catalog_exercises')::text||'/'||(SELECT count(*) FROM pg_proc WHERE proname='exlib_plank_link_valid')::text||'/'||(SELECT count(*) FROM pg_trigger WHERE NOT tgisinternal AND tgrelid IN ('public.exercises'::regclass,'public.exercise_catalog_import_runs'::regclass,'public.exercise_catalog_run_items'::regclass))::text" "1/1/$(QD pre029 "SELECT count(*) FROM pg_trigger WHERE NOT tgisinternal AND tgrelid IN ('public.exercises'::regclass,'public.exercise_catalog_import_runs'::regclass,'public.exercise_catalog_run_items'::regclass)")"

echo; echo "=== D. The helper, called DIRECTLY: current run, positive prior-run control, every forbidden posture"
H() { Q "SELECT public.exlib_plank_link_valid('$U', $1, '$SP', '$LP', 'Plank', '$R_CUR')::text FROM public.exercises e WHERE e.id='$E'"; }
row_with() { echo "jsonb_populate_record(e, jsonb_build_object($1))"; }
expect_eq "D1: CURRENT-RUN exact provenance still validates (row.import_run_id = delivering run)" "SELECT public.exlib_plank_link_valid('$U', e, '$SP', '$LP', 'Plank', '$R_PRIOR')::text FROM public.exercises e WHERE e.id='$E'" "true"
expect_eq "D2 (POSITIVE CONTROL): prior run != current run, prior run carries EXACTLY p_cat_id and is approved/non-dry/sealed/unrevoked -> VALIDATES" "SELECT public.exlib_plank_link_valid('$U', e, '$SP', '$LP', 'Plank', '$R_CUR')::text FROM public.exercises e WHERE e.id='$E'" "true"
[ "$(H "$(row_with "'import_run_id','00000000-0000-4000-a000-00000000dead'")")" = "false" ] && ok "D3: NONEXISTENT run -> false (a stored row cannot even hold one: the FK forbids it; tested through an in-memory composite)" || bad "D3: nonexistent run validated"
[ "$(H "$(row_with "'import_run_id',null")")" = "false" ] && ok "D3b: NULL import_run_id -> FALSE explicitly (under 026 the comparison was unknown and only the caller's IF made it fail closed)" || bad "D3b: NULL run did not return false" "$(H "$(row_with "'import_run_id',null")")"
[ "$(H "$(row_with "'import_run_id','$R_UNSEALED'")")" = "false" ] && ok "D4: UNAPPROVED / UNSEALED run carrying Plank -> false (approval and seal move together, so unapproved and unsealed are the same posture)" || bad "D4: unsealed run validated"
[ "$(H "$(row_with "'import_run_id','$R_DRY'")")" = "false" ] && ok "D5: DRY run carrying Plank -> false" || bad "D5: dry run validated"
[ "$(H "$(row_with "'import_run_id','$R_REVOKED'")")" = "false" ] && ok "D6: REVOKED (previously sealed) run carrying Plank -> false" || bad "D6: revoked run validated"
[ "$(H "$(row_with "'import_run_id','$R_UNRELATED'")")" = "false" ] && ok "D7: UNRELATED sealed run WITHOUT the Plank snapshot -> false (a legitimate run is not enough; the exact snapshot membership is)" || bad "D7: unrelated run validated"
echo "--- D8: a sealed run carrying a DIFFERENT catalog snapshot of the SAME Plank logical identity (on a clone) ---"
QT "CREATE DATABASE diffsnap TEMPLATE postgres OWNER postgres" >/dev/null 2>&1
QD diffsnap "UPDATE public.exercise_catalog SET is_active=false WHERE id='$SP'" >/dev/null
SP2=$(QD diffsnap "INSERT INTO public.exercise_catalog (logical_id, canonical_name, category, primary_muscle, equipment, laterality, tracking_mode, provenance, movement_pattern, training_role, difficulty, availability, catalog_version) SELECT logical_id, canonical_name, category, primary_muscle, equipment, laterality, tracking_mode, provenance, movement_pattern, training_role, difficulty, availability, 2 FROM public.exercise_catalog WHERE id='$SP' RETURNING id")
QD diffsnap "INSERT INTO public.exercise_catalog_muscles (catalog_id, muscle, role) SELECT '$SP2', muscle, role FROM public.exercise_catalog_muscles WHERE catalog_id='$SP'; UPDATE public.exercise_catalog SET review_status='approved', reviewed_by='TEST-ONLY fixture reviewer', reviewed_at=now(), review_rationale='TEST-ONLY fixture approval of a second Plank snapshot' WHERE id='$SP2'" >/dev/null
R_V2=$(QD diffsnap "INSERT INTO public.exercise_catalog_import_runs (run_key, dry_run, product_approved_by, product_approved_at, legal_approved_by, legal_approved_at, approval_rationale) VALUES ('m029-sealed-with-plank-v2', false, 'TEST-ONLY product', now(), 'TEST-ONLY legal', now(), 'TEST-ONLY fixture run carrying Plank catalog version 2') RETURNING id")
QD diffsnap "INSERT INTO public.exercise_catalog_run_items (run_id, catalog_id) VALUES ('$R_V2','$SP2'); SELECT public.exlib_approve_and_seal_run('m029-sealed-with-plank-v2')" >/dev/null
expect_eq "D8-setup: on the clone, Plank v1 is inactive, Plank v2 (same logical, different snapshot id) is active and approved, and run v2 is SEALED carrying ONLY v2" \
  "SELECT (SELECT count(*) FROM public.exercise_catalog WHERE logical_id='$LP')::text||'/'||(SELECT (is_active AND review_status='approved')::text FROM public.exercise_catalog WHERE id='$SP2')||'/'||(SELECT (approved_for_delivery AND sealed_at IS NOT NULL)::text FROM public.exercise_catalog_import_runs WHERE id='$R_V2')||'/'||(SELECT count(*) FROM public.exercise_catalog_run_items WHERE run_id='$R_V2' AND catalog_id='$SP')::text" "2/true/true/0" diffsnap
expect_eq "D8: the user's row (linked to snapshot v1) with import_run_id = the sealed v2 run -> FALSE: a sealed run carrying a DIFFERENT snapshot of the SAME logical identity does NOT qualify (the exact snapshot is the boundary)" \
  "SELECT public.exlib_plank_link_valid('$U', jsonb_populate_record(e, jsonb_build_object('import_run_id','$R_V2')), '$SP', '$LP', 'Plank', '$R_CUR')::text FROM public.exercises e WHERE e.id='$E'" "false" diffsnap
expect_eq "D8b: and the same row validated against the v2 snapshot id fails on the exact catalog_id invariant (row.catalog_id = v1)" \
  "SELECT public.exlib_plank_link_valid('$U', jsonb_populate_record(e, jsonb_build_object('import_run_id','$R_V2')), '$SP2', '$LP', 'Plank', '$R_CUR')::text FROM public.exercises e WHERE e.id='$E'" "false" diffsnap
echo "--- D9: retained non-provenance failures (prior-run provenance held valid, one invariant broken at a time) ---"
[ "$(H "$(row_with "'tracking_mode','bodyweight'")")" = "false" ] && ok "D9a: MODE drift (bodyweight) -> false" || bad "D9a"
[ "$(H "$(row_with "'exercise_type','strength'")")" = "false" ] && ok "D9b: EXERCISE_TYPE drift (strength) -> false" || bad "D9b"
[ "$(H "$(row_with "'catalog_id','$SD'")")" = "false" ] && ok "D9c: CATALOG_ID mismatch -> false" || bad "D9c"
[ "$(H "$(row_with "'catalog_logical_id','$LD'")")" = "false" ] && ok "D9d: LOGICAL_ID mismatch -> false" || bad "D9d"
[ "$(H "$(row_with "'name','Plank X'")")" = "false" ] && ok "D9e: NAME posture drift ('Plank X' claims nothing) -> false" || bad "D9e"
[ "$(H "$(row_with "'user_id','$(Q "INSERT INTO auth.users DEFAULT VALUES RETURNING id")'")")" = "false" ] && ok "D9f: USER ownership mismatch -> false" || bad "D9f"
QT "CREATE DATABASE anat TEMPLATE postgres OWNER postgres" >/dev/null 2>&1
QD anat "INSERT INTO public.exercise_muscles (user_id, exercise_id, muscle, role) VALUES ('$U','$E','traps','tertiary')" >/dev/null
expect_eq "D9g: ANATOMY drift (an extra tenant anatomy row) -> false, on a clone" "SELECT public.exlib_plank_link_valid('$U', e, '$SP', '$LP', 'Plank', '$R_CUR')::text FROM public.exercises e WHERE e.id='$E'" "false" anat
expect_eq "D10: the direct-call matrix mutated nothing: the row still carries the PRIOR run id and its original name/mode" \
  "SELECT (import_run_id='$R_PRIOR')::text||'/'||name||'/'||tracking_mode FROM public.exercises WHERE id='$E'" "true/Plank/timed"

echo; echo "=== E. Through deliver_catalog_exercises: the fix, idempotent"
E1=$(Q "SET app.uid='$U'; SELECT public.deliver_catalog_exercises('m029-current-cumulative')")
echo "$E1" | grep -qF '"skipped_already_delivered": 2' && echo "$E1" | grep -qF '"plank_disposition": "already_valid_idempotent"' && echo "$E1" | grep -qF '"inserted": 0' && ok "E1 (THE FIX): after 029 the CURRENT run delivers to the prior-run user: Plank validated as already_valid_idempotent, both members skipped, nothing inserted" || bad "E1: unexpected summary" "$E1"
expect_eq "E2: the Plank row is preserved - import_run_id STILL the PRIOR run (historical provenance untouched), no duplicate Plank row, name/mode unchanged" \
  "SELECT (SELECT count(*) FROM public.exercises WHERE user_id='$U' AND catalog_logical_id='$LP')::text||'/'||(SELECT (import_run_id='$R_PRIOR')::text||'/'||name||'/'||tracking_mode FROM public.exercises WHERE id='$E')||'/'||(SELECT count(*) FROM public.exercise_catalog_corrections WHERE user_id='$U')::text" "1/true/Plank/timed/0"
E3=$(Q "SET app.uid='$U'; SELECT public.deliver_catalog_exercises('m029-current-cumulative')")
[ "$E3" = "$E1" ] && ok "E3: a repeat delivery returns the identical summary (idempotent)" || bad "E3: repeat differs" "$E3"
E4=$(Q "SET app.uid='$U'; SELECT public.deliver_catalog_exercises('m029-prior-sealed-with-plank')")
echo "$E4" | grep -qF '"plank_disposition": "already_valid_idempotent"' && echo "$E4" | grep -qF '"inserted": 0' && ok "E4: the PRIOR run itself still delivers idempotently to its own user" || bad "E4" "$E4"

echo; echo "=== F. Atomicity: a sabotaged 029 rolls back and leaves the 028 helper intact"
sed 's/^COMMIT;$/SELECT 1\/0;\nCOMMIT;/' "$M029" > "$TMP/m029-sabotaged.sql"
grep -q 'SELECT 1/0;' "$TMP/m029-sabotaged.sql" && ok "F0: sabotaged copy carries a failing statement before COMMIT" || bad "F0"
QT "CREATE DATABASE sabotage TEMPLATE pre029 OWNER postgres" >/dev/null 2>&1
if psql -h "$SOCK" -U postgres -d sabotage -X -v ON_ERROR_STOP=1 -q -f "$TMP/m029-sabotaged.sql" > "$TMP/sab.out" 2>&1; then bad "F1: the sabotaged 029 COMMITTED"; else ok "F1: the sabotaged 029 failed (exit non-zero: $(grep -m1 ERROR "$TMP/sab.out"))"; fi
[ "$(QD sabotage "$DEF_SQL")" = "$DEF028" ] && ok "F2: the helper definition on the sabotaged clone is BYTE-IDENTICAL to the 028 definition - the CREATE OR REPLACE rolled back with the transaction" || bad "F2: helper changed despite rollback"
F3=$(QD sabotage "SET app.uid='$U'; SELECT public.deliver_catalog_exercises('m029-current-cumulative')" | head -1)
echo "$F3" | grep -qF 'inconsistent prior Plank reconciliation' && ok "F3: and the defect is still present there (028 behaviour intact after rollback)" || bad "F3" "$F3"
expect_eq "F4: on the sabotaged clone the posture is the 028 posture, unchanged" "$POSTURE_SQL" "$POSTURE_OK" sabotage

echo; echo "=== G. No hosted contact"
HOSTPAT='supabase[.](co|com)|vercel[.](app|com)|[-][-]db[-]url|[-][-]linked|project[-]ref|db[ ](push|dump)|npx[ ]supabase|supabase[ ](db|projects|link|login)'
[ "$(awk -v pat="$HOSTPAT" 'tolower($0) ~ pat {n++} END{print n+0}' "$0")" = "0" ] && ok "G1: this script names no hosted endpoint, remote linkage flag, or Supabase CLI command" || bad "G1"
[ "$(awk '/(psql|pg_ctl|initdb)[ \t]/ && !index($0,"-h \"$SOCK\"") && !index($0,"-D \"$PGDATA\"") {n++} END{print n+0}' "$0")" = "0" ] && ok "G2: every database invocation targets the disposable socket only" || bad "G2"
ok "G3: MIGRATION 029 HAS NOT BEEN APPLIED TO HOSTED; its only executions are on this disposable cluster, destroyed on exit"
echo; printf '%s passed, %s failed\n' "$PASS" "$FAIL"; [ "$FAIL" -eq 0 ]
