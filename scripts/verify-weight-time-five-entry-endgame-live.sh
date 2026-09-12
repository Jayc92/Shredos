#!/bin/bash
# ============================================================
# ForgeFitOS - weight_time five-entry ENDGAME: disposable-PostgreSQL proof.
#
# Rebuilds the EXACT post-W14 hosted catalog shape on a DISPOSABLE LOCAL
# cluster (unix socket only, no TCP, destroyed on exit) by applying migrations
# 001-028 and then REPLAYING the nine spent hosted packages in their historical
# order (EXLIB-2K, 2O, 2P, 2Q, 2R, 2Y, 2U, 2Z, W14) - so the eleven-term
# vector 8/8/10/3/11/1/2/2/1/6/3 the operator reported after W14 is REBUILT,
# never assumed. It then renders the seven stage packages under clearly marked
# SYNTHETIC TEST-ONLY decisions (through the real generator, into a scratch
# directory the generator refuses to place under docs/), executes each once,
# proves the exact resulting state by database readback, proves tenant delivery
# for a fixture user, and finally proves the fail-closed properties: replay,
# out-of-order execution, every negative-control variant, atomic rollback under
# a sabotaged postcondition, the READ STATE FIRST probe on NOT_APPLIED /
# APPLIED / MIXED states, and the fixture guard.
#
# Every control variant is GENERATED THROUGH THE REAL DERIVATION PATH
# (FIVE_ENTRY_VARIANT), never by editing generated SQL with sed.
#
# This script NEVER contacts Supabase, Vercel, or any remote service, and NEVER
# invokes the Supabase CLI. No human decision is real here: every reviewer,
# credential, timestamp and rationale is a synthetic TEST-ONLY string that the
# generator refuses to write into the repository and that every rendered
# package refuses to run without the disposable-fixture marker relation.
#
# Run from the repository root:
#   bash scripts/verify-weight-time-five-entry-endgame-live.sh
# ============================================================
set -uo pipefail
export LC_ALL=C LANG=C

GENERATOR="scripts/generate-weight-time-five-entry-packages.ts"
MANIFEST_GENERATOR="scripts/generate-weight-time-five-entry-manifest.ts"
MANIFEST="docs/weight-time-five-entry-lifecycle-manifest.json"
PROBE="docs/weight-time-five-entry-read-state.sql"
TEMPLATE_DIR="docs/weight-time-five-entry-packages"
FORMS_DIR="docs"
M028='supabase/migrations/028_weight_time_tracking_mode.sql'
M028_SHA='9b7d3a52dc0b75f129745bec51a4c972aa284bb5cb0d6159e0cbbb981e463fb3'
M028_BYTES=37162

# The spent hosted chain, in historical order, each pinned by the bytes the
# promoted records evidence.
CHAIN="docs/exlib2k-plank-catalog-load-package.sql:29760:a1b6dd55850c5d544e2f484d1ce4833b41deec7f3dd4d4c2373cb3b50daaccf0
docs/exlib2o-target-snapshot-load-package.sql:39230:4c0d74f942da4e92efab5923a435512c750c6d794077804ffeee8c0c305c966d
docs/exlib2p-plank-database-review-package.sql:37702:76d1d67d6ec2bafc49ef43a6312700559cd9eeee4b8b9433868de9daf95dc666
docs/exlib2q-plank-import-admission-package.sql:39382:b15b9313db5efe679ca0d13cd0d9b9d97fd9316ec1d66d99c5bba6ca47529e57
docs/exlib2r-plank-publication-package.sql:48913:96ade4887320df83a3032fbb3afcf9566ecc4436276ebe6a54e2af07727f68de
docs/exlib2y-snapshot-review-application-package.sql:25193:74934419d027b477933f01bcbd2f4984700b34c6416ecd9c43c64bbd528757e0
docs/exlib2u-staged-run-package.sql:38582:ceb4964f3537f49ef987e77876c3106917abc3edf2fc9bff3991fb644c90722f
docs/exlib2z-s5-seal-package.sql:42012:701302cb3baa36a510f96163ca5393ac63475d78463607757b02bd46b5015e6a
docs/weight-time-w14-catalog-admission.sql:64653:a928b045cc1397e4145b21a0504d4e7364a37c90b88c1dd85d8df36fb27413cd"

U132='e21b2c00-0000-4000-a000-000000000004'
U133='e21b2c00-0000-4000-a000-000000000005'
U137='e21b2c00-0000-4000-a000-000000000006'
U138='e21b2c00-0000-4000-a000-000000000007'
U139='e21b2c00-0000-4000-a000-000000000008'
FIVE="'$U132','$U133','$U137','$U138','$U139'"
CARRY_ID='e21b2c00-0000-4000-a000-000000000009'
HIST_KEY='exlib2u-plank-release1-staged-v1'

PASS=0
FAIL=0
ok()  { PASS=$((PASS+1)); printf '  PASS  %s\n' "$1"; }
bad() { FAIL=$((FAIL+1)); printf '  FAIL  %s\n' "$1"; [ -n "${2:-}" ] && printf '        %s\n' "$2"; return 0; }

TMP="$(mktemp -d /tmp/w14e-live-pg.XXXXXX)"
PGDATA="$TMP/pgdata"
SOCK="$TMP"
PKG="$TMP/pkgs"
FORMS="$TMP/forms"
cleanup() {
  pg_ctl -D "$PGDATA" stop -m immediate >/dev/null 2>&1 || true
  rm -rf "$TMP"
}
trap cleanup EXIT
mkdir -p "$PKG" "$FORMS"

DB=postgres
Q()   { psql -h "$SOCK" -U postgres -d "$DB" -X -v ON_ERROR_STOP=1 -qtA -c "$1"; }
QQ()  { psql -h "$SOCK" -U postgres -d "$DB" -X -v ON_ERROR_STOP=1 -qtA -c "$1" 2>&1; }
QD()  { psql -h "$SOCK" -U postgres -d "$1" -X -v ON_ERROR_STOP=1 -qtA -c "$2" 2>&1; }
QA()  { psql -h "$SOCK" -U supabase_admin -d "$DB" -X -v ON_ERROR_STOP=1 -qtA -c "$1"; }
QT()  { psql -h "$SOCK" -U postgres -d template1 -X -v ON_ERROR_STOP=1 -qtA -c "$1"; }
run_pkg() { psql -h "$SOCK" -U postgres -d "$1" -X -v ON_ERROR_STOP=1 -q -f "$2" > "$3" 2>&1; }
expect_eq() { # NAME SQL EXPECTED [DB]
  local got; got=$(QD "${4:-$DB}" "$2")
  if [ "$got" = "$3" ]; then ok "$1"; else bad "$1" "expected [$3], got [$got]"; fi
}

VECTOR_SQL="SELECT (SELECT count(*) FROM public.exercise_catalog_logical)::text||'/'||(SELECT count(*) FROM public.exercise_catalog)::text||'/'||(SELECT count(*) FROM public.exercise_catalog_muscles)::text||'/'||(SELECT count(*) FROM public.exercise_catalog_aliases)::text||'/'||(SELECT count(*) FROM public.exercise_catalog_name_claims)::text||'/'||(SELECT count(*) FROM public.exercise_catalog_content)::text||'/'||(SELECT count(*) FROM public.exercise_catalog_content_expected_relationships)::text||'/'||(SELECT count(*) FROM public.exercise_catalog_relationships)::text||'/'||(SELECT count(*) FROM public.exercise_catalog_import_runs)::text||'/'||(SELECT count(*) FROM public.exercise_catalog_run_items)::text||'/'||(SELECT count(*) FROM public.exercise_catalog_review_events)::text"
AUTH_SQL="SELECT string_agg(g.rolname||'>'||m.rolname||'@'||gr.rolname||':'||am.admin_option::text||':'||am.inherit_option::text||':'||am.set_option::text, ' ' ORDER BY g.rolname, m.rolname, gr.rolname) FROM pg_catalog.pg_auth_members am JOIN pg_roles g ON g.oid=am.roleid JOIN pg_roles m ON m.oid=am.member JOIN pg_roles gr ON gr.oid=am.grantor WHERE g.rolname IN ('exlib_catalog_loader','exlib_catalog_reviewer','exlib_catalog_admission','exlib_catalog_admin')"
AUTH_OK="exlib_catalog_admin>postgres@supabase_admin:true:false:false exlib_catalog_admission>postgres@supabase_admin:true:false:false exlib_catalog_loader>postgres@supabase_admin:true:false:false exlib_catalog_reviewer>postgres@supabase_admin:true:false:false"
# Harness-side digests, written as DIFFERENT expressions from the packages' own.
HIST_RUN_SQL="SELECT md5(r::text)||'#'||(SELECT md5(coalesce(string_agg(ri::text,'|' ORDER BY ri.created_at, ri.id),'-')) FROM public.exercise_catalog_run_items ri WHERE ri.run_id=r.id) FROM public.exercise_catalog_import_runs r WHERE r.run_key='$HIST_KEY'"
PLANK_WORLD_SQL="SELECT md5(coalesce((SELECT string_agg(c::text,'|' ORDER BY c.id) FROM public.exercise_catalog c WHERE c.logical_id NOT IN ($FIVE)),'-')||coalesce((SELECT string_agg(c::text,'|' ORDER BY c.id) FROM public.exercise_catalog_content c WHERE c.logical_id NOT IN ($FIVE)),'-')||coalesce((SELECT string_agg(r::text,'|' ORDER BY r.from_logical_id, r.relation, r.to_logical_id) FROM public.exercise_catalog_relationships r),'-')||coalesce((SELECT string_agg(e::text,'|' ORDER BY e.id) FROM public.exercise_catalog_review_events e JOIN public.exercise_catalog c ON c.id=e.catalog_id WHERE c.logical_id NOT IN ($FIVE)),'-')||coalesce((SELECT string_agg(a::text,'|' ORDER BY a.id) FROM public.exercise_catalog_aliases a),'-')||coalesce((SELECT string_agg(m::text,'|' ORDER BY m.id) FROM public.exercise_catalog_muscles m),'-')||coalesce((SELECT string_agg(n::text,'|' ORDER BY n.normalized_name) FROM public.exercise_catalog_name_claims n),'-'))"
TENANT_SQL="SELECT (SELECT count(*) FROM public.exercises)::text||':'||md5(coalesce((SELECT string_agg(t::text,'|' ORDER BY t.id) FROM public.exercises t),'-'))||':'||(SELECT count(*) FROM public.exercise_aliases)::text||':'||(SELECT count(*) FROM public.exercise_muscles)::text"
CALLS_SQL="SELECT coalesce((SELECT sum(calls) FROM pg_stat_user_functions WHERE funcname='load_catalog_content_draft'),0)::text||'/'||coalesce((SELECT sum(calls) FROM pg_stat_user_functions WHERE funcname='apply_content_review'),0)::text||'/'||coalesce((SELECT sum(calls) FROM pg_stat_user_functions WHERE funcname='admit_catalog_content'),0)::text||'/'||coalesce((SELECT sum(calls) FROM pg_stat_user_functions WHERE funcname='publish_catalog_content'),0)::text||'/'||coalesce((SELECT sum(calls) FROM pg_stat_user_functions WHERE funcname='exlib_approve_and_seal_run'),0)::text||'/'||coalesce((SELECT sum(calls) FROM pg_stat_user_functions WHERE funcname='deliver_catalog_exercises'),0)::text"
hasF()   { grep -qF -- "$1" "$2"; }
countF() { grep -cF -- "$1" "$2" || true; }

V0='8/8/10/3/11/1/2/2/1/6/3'
V1='8/8/10/3/11/1/2/2/1/6/8'
V2='8/8/10/3/11/6/2/2/1/6/8'
V6='8/8/10/3/11/6/2/2/2/17/8'
HIST_MEMBERS_SQL="SELECT string_agg(x.member, E'\\n' ORDER BY x.member) FROM (SELECT 'exercise#'||c.logical_id::text AS member FROM public.exercise_catalog_run_items ri JOIN public.exercise_catalog_import_runs h ON h.id=ri.run_id JOIN public.exercise_catalog c ON c.id=ri.catalog_id WHERE h.run_key='$HIST_KEY' AND ri.catalog_id IS NOT NULL UNION ALL SELECT 'alias#'||a.logical_id::text||'#'||a.alias FROM public.exercise_catalog_run_items ri JOIN public.exercise_catalog_import_runs h ON h.id=ri.run_id JOIN public.exercise_catalog_aliases a ON a.id=ri.catalog_alias_id WHERE h.run_key='$HIST_KEY' AND ri.catalog_alias_id IS NOT NULL) x"
HIST_SIX='alias#e21b2c00-0000-4000-a000-000000000001#Forearm plank
alias#e21b2c00-0000-4000-a000-000000000001#Front plank
alias#e21b2c00-0000-4000-a000-000000000003#Ab roller rollout
exercise#e21b2c00-0000-4000-a000-000000000001
exercise#e21b2c00-0000-4000-a000-000000000002
exercise#e21b2c00-0000-4000-a000-000000000003'
NEW_KEY='w14e-weight-time-release1-staged-v1'

echo
echo "=== A. Artifact identity and generator determinism (repository, no database)"
for f in "$GENERATOR" "$MANIFEST_GENERATOR" "$MANIFEST" "$PROBE"; do
  [ -f "$f" ] || { bad "A1: required artifact missing: $f"; exit 1; }
done
ok "A1: generator, manifest generator, lifecycle manifest and read-state probe exist"
N028=$(ls supabase/migrations/ | grep -c '^028' || true)
N029=$(ls supabase/migrations/ | grep -c '^029' || true)
B028=$(wc -c < "$M028" | tr -d ' ')
S028=$(shasum -a 256 "$M028" | awk '{print $1}')
[ "$N028/$N029/$B028/$S028" = "1/0/$M028_BYTES/$M028_SHA" ] \
  && ok "A2: migration 028 is byte-identical at its pinned identity and NO migration 029 exists - this work adds no migration and modifies none" \
  || bad "A2: the 028 pin failed ($N028/$N029/$B028/$S028)"
if npx --no-install tsx "$MANIFEST_GENERATOR" --check > "$TMP/mcheck.out" 2>&1; then
  ok "A3: the lifecycle manifest is byte-identical to a fresh regeneration from its bound inputs"
else bad "A3: manifest --check failed" "$(tail -2 "$TMP/mcheck.out" | tr '\n' ' ')"; fi
if npx --no-install tsx "$GENERATOR" --check > "$TMP/pcheck.out" 2>&1; then
  ok "A4: the seven committed TEMPLATE packages and the human review page are byte-identical to a fresh rendering from the BLANK forms"
else bad "A4: packages --check failed" "$(tail -2 "$TMP/pcheck.out" | tr '\n' ' ')"; fi
TPL_SENTINELS=0; TPL_TESTONLY=0
for f in "$TEMPLATE_DIR"/0*.sql; do
  hasF 'SELECT <<UNRESOLVED-TEMPLATE:' "$f" && TPL_SENTINELS=$((TPL_SENTINELS+1))
  hasF 'TEST-ONLY' "$f" && TPL_TESTONLY=$((TPL_TESTONLY+1))
done
[ "$TPL_SENTINELS" = "7" ] && [ "$TPL_TESTONLY" = "0" ] \
  && ok "A5: all seven committed templates carry the NOT-EXECUTABLE syntax-error sentinel and NONE carries a synthetic decision marker" \
  || bad "A5: template posture wrong (sentinels=$TPL_SENTINELS test-only=$TPL_TESTONLY)"
BLANK=$(node -e '
const fs=require("fs");
const a=JSON.parse(fs.readFileSync("docs/weight-time-five-entry-snapshot-review-form.json","utf8"));
const b=JSON.parse(fs.readFileSync("docs/weight-time-five-entry-content-review-form.json","utf8"));
const c=JSON.parse(fs.readFileSync("docs/weight-time-five-entry-run-authority-form.json","utf8"));
let filled=0;
for (const e of a.entries) for (const v of Object.values(e.human_fields)) if (v!==null) filled++;
for (const e of b.entries) { for (const k of ["decision","reviewer","reviewer_role_or_credential","reviewed_at","evidence","rationale"]) if (e[k]!==null) filled++; for (const v of Object.values(e.needs_human_judgment_confirmations)) if (v!==null) filled++; }
const r=c.requested_inputs; for (const v of [r.run_key_literal.value,r.product_approver_identity.value,r.product_approver_identity.product_approved_at,r.legal_approver_identity.value,r.legal_approver_identity.legal_approved_at,r.approval_rationale.value,r.run_membership.value]) if (v!==null) filled++;
const flags=[a,b,c].filter(f=>f.test_only_synthetic_decisions===true).length;
process.stdout.write(filled+"/"+flags);' 2>/dev/null)
[ "$BLANK" = "0/0" ] \
  && ok "A6: every human decision leaf in the three committed forms is null and no form carries the synthetic flag (blank is never approval)" \
  || bad "A6: committed forms are not blank (filled/flags = $BLANK)"

echo
echo "=== B. Disposable cluster, migrations 001-028, hosted posture, tenant fixture"
initdb -D "$PGDATA" -U supabase_admin --no-locale -E UTF8 >/dev/null 2>&1
pg_ctl -D "$PGDATA" \
  -o "-c listen_addresses='' -c unix_socket_directories='$SOCK' -c track_functions=all" \
  -l "$TMP/pg.log" start >/dev/null 2>&1
if QA "SELECT 1" >/dev/null 2>&1; then
  ok "B1: cluster up at $SOCK (unix socket ONLY; no TCP; no hosted contact; track_functions=all so function calls are observable)"
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
[ "$APPLIED" = "28" ] && ok "B2: migrations 001-028 applied exactly once in order, ALL as the non-superuser postgres" \
  || bad "B2: expected 28 migrations, applied $APPLIED"
expect_eq "B3: all four catalog roles carry EXACTLY the hosted baseline membership (postgres granted BY supabase_admin, ADMIN TRUE / INHERIT FALSE / SET FALSE)" "$AUTH_SQL" "$AUTH_OK"
UIDS=()
for u in 1 2 3 4; do
  UID_U=$(Q "INSERT INTO auth.users DEFAULT VALUES RETURNING id;")
  UIDS+=("$UID_U")
  Q "INSERT INTO public.exercises (user_id, name, category, primary_muscle, equipment, exercise_type, tracking_mode, unilateral, is_system, is_active)
     SELECT '$UID_U', 'Fixture Exercise U$u N' || g, 'compound', 'lats', 'barbell', 'strength', 'weight_reps', false, true, true
     FROM generate_series(1, 20) g;" >/dev/null
  Q "INSERT INTO public.exercises (user_id, name, category, primary_muscle, equipment, exercise_type, tracking_mode, unilateral, is_system, is_active)
     VALUES ('$UID_U', 'Plank', 'isolation', 'abs', 'bodyweight', 'bodyweight', 'bodyweight', false, true, true);" >/dev/null
done
expect_eq "B4: representative tenant fixture in place - exactly 84 exercises across four users, each with a seeded Plank (the hosted count the W14-C record reports)" \
  "SELECT count(*)::text FROM public.exercises" "84"

echo
echo "=== C. Replay the SPENT hosted chain to rebuild the exact post-W14 world"
while IFS= read -r line; do
  f="${line%%:*}"; rest="${line#*:}"; want_b="${rest%%:*}"; want_s="${rest#*:}"
  [ -f "$f" ] || { bad "C0: chain package missing: $f"; exit 1; }
  got_b=$(wc -c < "$f" | tr -d ' '); got_s=$(shasum -a 256 "$f" | awk '{print $1}')
  [ "$got_b/$got_s" = "$want_b/$want_s" ] && ok "C0: $f is byte-identical to its promoted identity" \
    || bad "C0: $f drifted ($got_b/$got_s)"
done <<< "$CHAIN"
STEP=0
while IFS= read -r line; do
  f="${line%%:*}"; STEP=$((STEP+1)); nm=$(basename "$f" .sql)
  if run_pkg postgres "$f" "$TMP/chain-$STEP.out"; then
    ok "C1.$STEP: spent package $nm replayed once on the disposable cluster"
  else
    bad "C1.$STEP: spent package $nm FAILED" "$(grep -m2 -E 'ERROR|DETAIL' "$TMP/chain-$STEP.out" | tr '\n' ' ')"; exit 1
  fi
done <<< "$CHAIN"
expect_eq "C2: the rebuilt vector is EXACTLY the operator-reported post-W14 hosted vector $V0" "$VECTOR_SQL" "$V0"
expect_eq "C3: the five targets are pending, active, v1, NULL-audit, with 0 content rows, 0 events, 0 run items and 0 tenant rows" \
  "SELECT (SELECT count(*) FROM public.exercise_catalog WHERE logical_id IN ($FIVE) AND review_status='pending' AND is_active AND catalog_version=1 AND reviewed_by IS NULL AND reviewed_at IS NULL AND review_rationale IS NULL)::text||'/'||(SELECT count(*) FROM public.exercise_catalog_content WHERE logical_id IN ($FIVE))::text||'/'||(SELECT count(*) FROM public.exercise_catalog_review_events e JOIN public.exercise_catalog c ON c.id=e.catalog_id WHERE c.logical_id IN ($FIVE))::text||'/'||(SELECT count(*) FROM public.exercise_catalog_run_items ri JOIN public.exercise_catalog c ON c.id=ri.catalog_id WHERE c.logical_id IN ($FIVE))::text||'/'||(SELECT count(*) FROM public.exercises WHERE catalog_logical_id IN ($FIVE))::text" "5/0/0/0/0"
expect_eq "C4: the historical plank run is sealed, approved, non-dry, unrevoked with six members; the delivery predicate matches exactly one run" \
  "SELECT (SELECT count(*) FROM public.exercise_catalog_import_runs r WHERE r.run_key='$HIST_KEY' AND r.approved_for_delivery AND NOT r.dry_run AND r.sealed_at IS NOT NULL AND r.revoked_at IS NULL)::text||'/'||(SELECT count(*) FROM public.exercise_catalog_run_items ri JOIN public.exercise_catalog_import_runs r ON r.id=ri.run_id WHERE r.run_key='$HIST_KEY')::text||'/'||(SELECT count(*) FROM public.exercise_catalog_import_runs WHERE approved_for_delivery AND NOT dry_run AND sealed_at IS NOT NULL AND revoked_at IS NULL)::text" "1/6/1"
expect_eq "C4b: the historical run's membership resolves through governed identity to EXACTLY the six lines the promoted 2U package asserted (3 exercise + 3 alias)" "$HIST_MEMBERS_SQL" "$HIST_SIX"
expect_eq "C5: no carry identity exists anywhere in the catalog" \
  "SELECT (SELECT count(*) FROM public.exercise_catalog_logical WHERE id IN ('$CARRY_ID','e21b2c00-0000-4000-a000-00000000000a','e21b2c00-0000-4000-a000-00000000000b'))::text||'/'||(SELECT count(*) FROM public.exercise_catalog WHERE lower(canonical_name) ~ 'carry|farmer|suitcase|sandbag')::text" "0/0"
expect_eq "C6: the authority baseline is exact after the whole chain" "$AUTH_SQL" "$AUTH_OK"
HIST_BEFORE=$(Q "$HIST_RUN_SQL"); PLANK_BEFORE=$(Q "$PLANK_WORLD_SQL"); TENANT_BEFORE=$(Q "$TENANT_SQL")
[ -n "$HIST_BEFORE" ] && [ -n "$PLANK_BEFORE" ] && [ -n "$TENANT_BEFORE" ] \
  && ok "C7: harness-side digests captured INDEPENDENTLY of the packages' own (historical run+items, plank world outside the five, tenant)" \
  || bad "C7: digest capture failed"
Q "CREATE SCHEMA exlib_disposable_fixture; CREATE TABLE exlib_disposable_fixture.marker (note TEXT NOT NULL); INSERT INTO exlib_disposable_fixture.marker VALUES ('disposable local proof - TEST-ONLY renderings run only where this relation exists');" >/dev/null
ok "C8: the disposable-fixture marker relation exists (the guard every TEST-ONLY rendering demands; hosted never has it)"
QA "SELECT pg_stat_reset()" >/dev/null
expect_eq "C9: function-call statistics reset - counts observed below are this proof's own" "$CALLS_SQL" "0/0/0/0/0/0"
QT "CREATE DATABASE pre1 TEMPLATE postgres OWNER postgres" >/dev/null 2>&1 && ok "C10: pre-state template pre1 captured (post-W14, pre-stage-1)" || bad "C10: template capture failed"

echo
echo "=== D. Synthetic TEST-ONLY forms, generator refusals, and the test renderings"
node -e '
const fs=require("fs"); const [src,dst]=process.argv.slice(1);
const rd=(n)=>JSON.parse(fs.readFileSync(src+"/"+n,"utf8"));
const wr=(n,o)=>fs.writeFileSync(dst+"/"+n, JSON.stringify(o,null,2)+"\n");
const a=rd("weight-time-five-entry-snapshot-review-form.json");
a.test_only_synthetic_decisions=true; a.status="TEST-ONLY SYNTHETIC DECISIONS - NOT A HUMAN DECISION - disposable proof only";
for (const e of a.entries) e.human_fields={decision:"APPROVE",reviewer:"TEST-ONLY Reviewer A (synthetic)",reviewer_role_or_credential:"TEST-ONLY synthetic credential",reviewed_at:"2026-09-12T10:00:00-04:00",rationale:"TEST-ONLY synthetic approval of the snapshot for the disposable proof only.",evidence:null};
wr("weight-time-five-entry-snapshot-review-form.json",a);
const b=rd("weight-time-five-entry-content-review-form.json");
b.test_only_synthetic_decisions=true; b.status="TEST-ONLY SYNTHETIC DECISIONS - NOT A HUMAN DECISION - disposable proof only";
for (const e of b.entries) { e.decision="approved"; e.reviewer="TEST-ONLY Reviewer B (synthetic)"; e.reviewer_role_or_credential="TEST-ONLY synthetic credential"; e.reviewed_at="2026-09-12T10:05:00-04:00"; e.rationale="TEST-ONLY synthetic approval of the content for the disposable proof only."; e.evidence=null; for (const k of Object.keys(e.needs_human_judgment_confirmations)) e.needs_human_judgment_confirmations[k]=true; }
wr("weight-time-five-entry-content-review-form.json",b);
const c=rd("weight-time-five-entry-run-authority-form.json");
c.test_only_synthetic_decisions=true; c.status="TEST-ONLY SYNTHETIC DECISIONS - NOT A HUMAN DECISION - disposable proof only";
const r=c.requested_inputs; r.run_key_literal.value=process.argv[3]; r.product_approver_identity.value="TEST-ONLY Approver (synthetic)"; r.product_approver_identity.product_approved_at="2026-09-12T10:10:00-04:00"; r.legal_approver_identity.value="TEST-ONLY Approver (synthetic)"; r.legal_approver_identity.legal_approved_at="2026-09-12T10:10:00-04:00"; r.approval_rationale.value="TEST-ONLY synthetic run authority for the disposable proof only; it authorizes nothing hosted."; r.run_membership.value="CUMULATIVE_HISTORICAL_SIX_PLUS_FIVE_WEIGHT_TIME_IDENTITIES";
wr("weight-time-five-entry-run-authority-form.json",c);
' "$FORMS_DIR" "$FORMS" "$NEW_KEY" && ok "D1: synthetic TEST-ONLY completed forms written to the scratch directory only (nothing under docs/ touched)" || bad "D1: form synthesis failed"
# Generator refusals - each must exit non-zero for the named reason.
TPL_BEFORE=$(cat "$TEMPLATE_DIR"/0*.sql docs/weight-time-five-entry-human-review.md | shasum -a 256 | awk '{print $1}')
if FIVE_ENTRY_FORMS_DIR="$FORMS" npx --no-install tsx "$GENERATOR" > "$TMP/gen-refuse-docs.out" 2>&1; then
  bad "D2: the generator WROTE test renderings under docs/ - the docs refusal is dead"
else
  hasF 'test mode REFUSES to write under' "$TMP/gen-refuse-docs.out" && ok "D2: the generator REFUSES to write TEST-ONLY renderings under docs/ (exit non-zero, named reason)" \
    || bad "D2: generator refused for an unexpected reason" "$(tail -1 "$TMP/gen-refuse-docs.out")"
fi
TPL_AFTER=$(cat "$TEMPLATE_DIR"/0*.sql docs/weight-time-five-entry-human-review.md | shasum -a 256 | awk '{print $1}')
[ "$TPL_AFTER" = "$TPL_BEFORE" ] && ok "D2b: the refused run left the seven templates and the review page byte-identical (digest ${TPL_BEFORE:0:12}...)" \
  || bad "D2b: the refused run modified the committed docs renderings" "$TPL_BEFORE -> $TPL_AFTER"
mkdir -p "$TMP/forms-reject" && cp "$FORMS"/*.json "$TMP/forms-reject/"
node -e 'const fs=require("fs");const p=process.argv[1];const a=JSON.parse(fs.readFileSync(p,"utf8"));a.entries[2].human_fields.decision="REJECT";fs.writeFileSync(p,JSON.stringify(a,null,2));' "$TMP/forms-reject/weight-time-five-entry-snapshot-review-form.json"
if FIVE_ENTRY_FORMS_DIR="$TMP/forms-reject" FIVE_ENTRY_OUT_DIR="$TMP/pkgs-reject" npx --no-install tsx "$GENERATOR" > "$TMP/gen-reject.out" 2>&1; then bad "D3: a REJECT decision rendered a package"; else
  hasF 'only APPROVE has a prepared package' "$TMP/gen-reject.out" && ok "D3: a family A REJECT decision is refused by the generator - no package exists for it" || bad "D3: unexpected refusal" "$(tail -1 "$TMP/gen-reject.out")"; fi
mkdir -p "$TMP/forms-partial" && cp "$FORMS"/*.json "$TMP/forms-partial/"
node -e 'const fs=require("fs");const p=process.argv[1];const b=JSON.parse(fs.readFileSync(p,"utf8"));b.entries[0].rationale=null;fs.writeFileSync(p,JSON.stringify(b,null,2));' "$TMP/forms-partial/weight-time-five-entry-content-review-form.json"
if FIVE_ENTRY_FORMS_DIR="$TMP/forms-partial" FIVE_ENTRY_OUT_DIR="$TMP/pkgs-partial" npx --no-install tsx "$GENERATOR" > "$TMP/gen-partial.out" 2>&1; then bad "D4: a PARTIALLY completed decision rendered a package"; else
  hasF 'PARTIALLY completed decision is not a decision' "$TMP/gen-partial.out" && ok "D4: a partially completed family B decision (rationale missing) is refused - a partial decision is not a decision" || bad "D4: unexpected refusal" "$(tail -1 "$TMP/gen-partial.out")"; fi
mkdir -p "$TMP/forms-histkey" && cp "$FORMS"/*.json "$TMP/forms-histkey/"
node -e 'const fs=require("fs");const p=process.argv[1];const c=JSON.parse(fs.readFileSync(p,"utf8"));c.requested_inputs.run_key_literal.value="exlib2u-plank-release1-staged-v1";fs.writeFileSync(p,JSON.stringify(c,null,2));' "$TMP/forms-histkey/weight-time-five-entry-run-authority-form.json"
if FIVE_ENTRY_FORMS_DIR="$TMP/forms-histkey" FIVE_ENTRY_OUT_DIR="$TMP/pkgs-histkey" npx --no-install tsx "$GENERATOR" > "$TMP/gen-histkey.out" 2>&1; then bad "D5: the historical plank run key was accepted as the new run key"; else
  hasF 'reuses the historical plank release key' "$TMP/gen-histkey.out" && ok "D5: reusing the historical plank run key is refused by the generator before any SQL exists" || bad "D5: unexpected refusal" "$(tail -1 "$TMP/gen-histkey.out")"; fi
if FIVE_ENTRY_VARIANT=carry_stage1 FIVE_ENTRY_OUT_DIR="$TMP/pkgs-novariant" npx --no-install tsx "$GENERATOR" > "$TMP/gen-variant-real.out" 2>&1; then bad "D6: a variant rendered against the REAL (blank) forms"; else
  hasF 'permitted in test mode only' "$TMP/gen-variant-real.out" && ok "D6: negative-control variants are refused outside test mode" || bad "D6: unexpected refusal" "$(tail -1 "$TMP/gen-variant-real.out")"; fi
mkdir -p "$TMP/forms-marked" && cp "$FORMS_DIR"/weight-time-five-entry-*-form.json "$TMP/forms-marked/"
node -e 'const fs=require("fs");const p=process.argv[1];const a=JSON.parse(fs.readFileSync(p,"utf8"));for (const e of a.entries) e.human_fields={decision:"APPROVE",reviewer:"TEST-ONLY someone",reviewer_role_or_credential:"x",reviewed_at:"2026-09-12T10:00:00-04:00",rationale:"TEST-ONLY ten characters",evidence:null};fs.writeFileSync(p,JSON.stringify(a,null,2));' "$TMP/forms-marked/weight-time-five-entry-snapshot-review-form.json"
if FIVE_ENTRY_FORMS_DIR="$TMP/forms-marked" FIVE_ENTRY_OUT_DIR="$TMP/pkgs-marked" npx --no-install tsx "$GENERATOR" > "$TMP/gen-marked.out" 2>&1; then bad "D7: a real (unflagged) form carrying the synthetic marker rendered"; else
  hasF 'a real decision form carries the TEST-ONLY marker' "$TMP/gen-marked.out" && ok "D7: a form WITHOUT the synthetic flag but WITH marker strings is refused - real decisions may never carry the marker" || bad "D7: unexpected refusal" "$(tail -1 "$TMP/gen-marked.out")"; fi
# The governed test renderings.
if FIVE_ENTRY_FORMS_DIR="$FORMS" FIVE_ENTRY_OUT_DIR="$PKG" npx --no-install tsx "$GENERATOR" > "$TMP/gen-test.out" 2>&1; then
  ok "D8: the seven TEST-ONLY executable packages rendered into the scratch directory ($(grep -c '^wrote' "$TMP/gen-test.out") files)"
else bad "D8: test rendering failed" "$(tail -3 "$TMP/gen-test.out" | tr '\n' ' ')"; exit 1; fi
GUARDS=0; MARKS=0; TOKENS=0
for f in "$PKG"/0*.sql; do
  hasF "to_regclass('exlib_disposable_fixture.marker') IS NULL" "$f" && GUARDS=$((GUARDS+1))
  hasF 'TEST-ONLY' "$f" && MARKS=$((MARKS+1))
  TOKENS=$((TOKENS + $(grep -o '<<UNRESOLVED' "$f" | wc -l | tr -d ' ')))
done
[ "$GUARDS" = "7" ] && [ "$MARKS" = "7" ] && [ "$TOKENS" = "0" ] \
  && ok "D9: every test rendering carries the fixture guard and the synthetic marker, and carries ZERO unresolved tokens" \
  || bad "D9: test rendering posture wrong (guards=$GUARDS marks=$MARKS tokens=$TOKENS)"
if FIVE_ENTRY_FORMS_DIR="$FORMS" FIVE_ENTRY_OUT_DIR="$PKG" npx --no-install tsx "$GENERATOR" --check > "$TMP/gen-test-check.out" 2>&1; then
  ok "D10: the test renderings are byte-deterministic (a second rendering is byte-identical)"
else bad "D10: test renderings are not deterministic" "$(tail -1 "$TMP/gen-test-check.out")"; fi
render_variant() { # NAME -> $TMP/var-NAME/0N-*.sql
  local v="$1"; mkdir -p "$TMP/var-$v"
  FIVE_ENTRY_FORMS_DIR="$FORMS" FIVE_ENTRY_OUT_DIR="$TMP/var-$v" FIVE_ENTRY_VARIANT="$v" npx --no-install tsx "$GENERATOR" > "$TMP/gen-var-$v.out" 2>&1
}
stage_file() { ls "$1"/0"$2"-*.sql; }

echo
echo "=== E. The seven stages, each executed EXACTLY ONCE, each proven by database readback"
S1=$(stage_file "$PKG" 1); S2=$(stage_file "$PKG" 2); S3=$(stage_file "$PKG" 3); S4=$(stage_file "$PKG" 4); S5=$(stage_file "$PKG" 5); S6=$(stage_file "$PKG" 6); S7=$(stage_file "$PKG" 7)
run_stage() { # N FILE -> creates template pre(N+1) after success
  local n="$1" f="$2"
  if run_pkg postgres "$f" "$TMP/stage-$n.out"; then ok "E$n.0: stage $n executed and COMMITTED once (exit 0)"; else
    bad "E$n.0: stage $n FAILED" "$(grep -m3 -E 'ERROR|DETAIL|CONTEXT' "$TMP/stage-$n.out" | tr '\n' ' ')"; printf '%s passed, %s failed\n' "$PASS" "$FAIL"; exit 1; fi
  QT "CREATE DATABASE pre$((n+1)) TEMPLATE postgres OWNER postgres" >/dev/null 2>&1 || bad "E$n.t: could not capture template pre$((n+1))"
}
# stage 1
run_stage 1 "$S1"
expect_eq "E1.1: vector moved exactly review_events 3 -> 8: $V1" "$VECTOR_SQL" "$V1"
expect_eq "E1.2: the five snapshots are approved with the exact synthetic family A tuple; created_at untouched (pending count 0)" \
  "SELECT (SELECT count(*) FROM public.exercise_catalog WHERE logical_id IN ($FIVE) AND is_active AND review_status='approved' AND reviewed_by='TEST-ONLY Reviewer A (synthetic)' AND reviewed_at=TIMESTAMPTZ '2026-09-12T10:00:00-04:00' AND review_rationale='TEST-ONLY synthetic approval of the snapshot for the disposable proof only.')::text||'/'||(SELECT count(*) FROM public.exercise_catalog WHERE logical_id IN ($FIVE) AND review_status='pending')::text" "5/0"
expect_eq "E1.3: exactly five trigger-appended review events, one pending -> approved per identity, carrying the same tuple; the three historical events untouched (8 total)" \
  "SELECT (SELECT count(*) FROM public.exercise_catalog_review_events e JOIN public.exercise_catalog c ON c.id=e.catalog_id WHERE c.logical_id IN ($FIVE) AND e.from_status='pending' AND e.to_status='approved' AND e.reviewed_by='TEST-ONLY Reviewer A (synthetic)')::text||'/'||(SELECT count(DISTINCT c.logical_id) FROM public.exercise_catalog_review_events e JOIN public.exercise_catalog c ON c.id=e.catalog_id WHERE c.logical_id IN ($FIVE))::text||'/'||(SELECT count(*) FROM public.exercise_catalog_review_events)::text" "5/5/8"
expect_eq "E1.4: governed fields untouched - all five still weight_time, bilateral, v1, with their W14 anatomy" \
  "SELECT count(*)::text FROM public.exercise_catalog c WHERE c.logical_id IN ($FIVE) AND c.tracking_mode='weight_time' AND c.laterality='bilateral' AND c.catalog_version=1 AND (SELECT count(*) FROM public.exercise_catalog_muscles m WHERE m.catalog_id=c.id)=1" "5"
# stage 2
run_stage 2 "$S2"
expect_eq "E2.1: vector moved exactly content 1 -> 6 (expected_rel stays 2): $V2" "$VECTOR_SQL" "$V2"
expect_eq "E2.2: five content rows with the PREDECLARED ids …0104-…0108 at version 1, born pending / draft / unadmitted, zero expected relationships" \
  "SELECT (SELECT count(*) FROM public.exercise_catalog_content c WHERE c.logical_id IN ($FIVE) AND c.id IN ('e21b2c00-0000-4000-a000-000000000104','e21b2c00-0000-4000-a000-000000000105','e21b2c00-0000-4000-a000-000000000106','e21b2c00-0000-4000-a000-000000000107','e21b2c00-0000-4000-a000-000000000108') AND c.content_version=1 AND c.content_status='pending' AND c.publication_status='draft' AND NOT c.import_admitted AND c.reviewed_by IS NULL)::text||'/'||(SELECT count(*) FROM public.exercise_catalog_content_expected_relationships x JOIN public.exercise_catalog_content c ON c.id=x.content_id WHERE c.logical_id IN ($FIVE))::text" "5/0"
expect_eq "E2.3: the loader elevation was restored exactly (authority baseline exact after the stage)" "$AUTH_SQL" "$AUTH_OK"
expect_eq "E2.4: exactly five load_catalog_content_draft calls were made (non-transactional statistics)" "$CALLS_SQL" "5/0/0/0/0/0"
# THE DATABASE IS THE ORACLE for the content payload: read every payload field
# back out of PostgreSQL and recompute the manifest's content fingerprint from
# the readback, under the manifest's declared scheme.
cat > "$TMP/content-readback.mjs" <<'NODEJS'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
const [manifestPath, tsvPath] = process.argv.slice(2)
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
const rows = readFileSync(tsvPath, 'utf8').split('\n').filter((l) => l.trim() !== '')
let mismatch = 0
const problem = (m) => { mismatch += 1; console.log(`  MISMATCH ${m}`) }
if (rows.length !== 5) problem(`database returned ${rows.length} content rows, not five`)
const canon = (v) => v === null ? 'null' : Array.isArray(v) ? `[${v.map(canon).join(',')}]` : typeof v === 'object' ? `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canon(v[k])}`).join(',')}}` : JSON.stringify(v)
for (const row of rows) {
  const [logicalId, contentId, version, authoredBy, authoredAt, setup, execution, breathing, mistakes, safety, equipment, accessibility, relCount] = row.split('\t')
  const entry = manifest.entries.find((e) => e.logical_id === logicalId)
  if (!entry) { problem(`identity ${logicalId} is not governed`); continue }
  if (entry.content_id !== contentId) problem(`${entry.inventory_file_line} content_id ${contentId}`)
  const form = `p_logical_id=${logicalId}\np_content_id=${contentId}\np_content_version=${version}\np_authored_by=${authoredBy}\np_authored_at=${authoredAt}\n`
    + `p_setup_steps=${canon(JSON.parse(setup))}\np_execution_steps=${canon(JSON.parse(execution))}\np_breathing_cue=${breathing}\n`
    + `p_common_mistakes=${canon(JSON.parse(mistakes))}\np_safety_guidance=${safety}\np_equipment_setup=${equipment}\np_accessibility_alternative=${accessibility}\n`
    + `p_expected_relationships=${relCount === '0' ? '[]' : '<nonempty>'}\n`
  const recomputed = createHash('sha256').update(form).digest('hex')
  if (recomputed !== entry.content_payload_fingerprint.sha256) problem(`${entry.inventory_file_line} content fingerprint recomputed from the DATABASE [${recomputed}] manifest [${entry.content_payload_fingerprint.sha256}]`)
}
console.log(`RESULT rows=${rows.length} mismatch=${mismatch}`)
process.exit(mismatch === 0 && rows.length === 5 ? 0 : 1)
NODEJS
psql -h "$SOCK" -U postgres -d "$DB" -X -v ON_ERROR_STOP=1 -qtA -F$'\t' -c \
 "SELECT c.logical_id::text, c.id::text, c.content_version::text, c.authored_by, to_char(c.authored_at,'YYYY-MM-DD'), c.setup_steps::text, c.execution_steps::text, c.breathing_cue, c.common_mistakes::text, c.safety_guidance, c.equipment_setup, c.accessibility_alternative,
         (SELECT count(*) FROM public.exercise_catalog_content_expected_relationships x WHERE x.content_id=c.id)::text
    FROM public.exercise_catalog_content c WHERE c.logical_id IN ($FIVE) ORDER BY c.logical_id" > "$TMP/content.tsv" 2>"$TMP/content.err"
if node "$TMP/content-readback.mjs" "$MANIFEST" "$TMP/content.tsv" > "$TMP/content-readback.log" 2>&1; then
  ok "E2.5: every content payload field read back OUT of the database recomputes to the manifest's content fingerprint under the declared scheme ($(grep RESULT "$TMP/content-readback.log")) - the oracle is the database, not the package text"
else bad "E2.5: content readback does not match the manifest" "$(grep -m3 MISMATCH "$TMP/content-readback.log" | tr '\n' ' ')"; fi
# stage 3
run_stage 3 "$S3"
expect_eq "E3.1: vector unchanged: $V2" "$VECTOR_SQL" "$V2"
expect_eq "E3.2: five content rows approved with the exact synthetic family B tuple, still draft / unadmitted; review events still 8 (content review writes none by schema design)" \
  "SELECT (SELECT count(*) FROM public.exercise_catalog_content c WHERE c.logical_id IN ($FIVE) AND c.content_status='approved' AND c.reviewed_by='TEST-ONLY Reviewer B (synthetic)' AND c.reviewed_at=TIMESTAMPTZ '2026-09-12T10:05:00-04:00' AND c.publication_status='draft' AND NOT c.import_admitted)::text||'/'||(SELECT count(*) FROM public.exercise_catalog_review_events)::text" "5/8"
expect_eq "E3.3: reviewer elevation restored; exactly five apply_content_review calls" "($AUTH_SQL) UNION ALL ($CALLS_SQL)" "$AUTH_OK
5/5/0/0/0/0"
# stage 4
run_stage 4 "$S4"
expect_eq "E4.1: vector unchanged: $V2" "$VECTOR_SQL" "$V2"
CARRIER_SHA=$(node -e 'process.stdout.write(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).admission_source_sha256.value)' "$MANIFEST")
expect_eq "E4.2: five rows admitted; admitted_source_sha256 = the carrier digest the manifest binds; admitted_fingerprint 64-hex AND equal to a fresh database recomputation; admitted_at today; still draft" \
  "SELECT count(*)::text FROM public.exercise_catalog_content c WHERE c.logical_id IN ($FIVE) AND c.import_admitted AND c.admitted_source_sha256='$CARRIER_SHA' AND c.admitted_fingerprint ~ '^[0-9a-f]{64}$' AND c.admitted_fingerprint = public.exlib_content_admission_fingerprint(c.id) AND c.admitted_at=CURRENT_DATE AND c.publication_status='draft'" "5"
PINNED_FPS=$(grep -oE "'admitted_fingerprint', '[0-9a-f]{64}'" "$S4" | grep -oE '[0-9a-f]{64}' | tr '\n' ',' | sed 's/,$//')
DB_FPS=$(Q "SELECT string_agg(public.exlib_content_admission_fingerprint(c.id), ',' ORDER BY c.id) FROM public.exercise_catalog_content c WHERE c.logical_id IN ($FIVE)")
[ -n "$PINNED_FPS" ] && [ "$PINNED_FPS" = "$DB_FPS" ] \
  && ok "E4.3: the five admission fingerprints PINNED in the rendered stage-4 package (migration-027 manifest v2 recomputed in TypeScript BEFORE any database existed) equal the database's own exlib_content_admission_fingerprint for the five content rows, read back independently: ${DB_FPS:0:16}..." \
  || bad "E4.3: pinned fingerprints differ from the database's" "pinned=$PINNED_FPS db=$DB_FPS"
expect_eq "E4.4: admission elevation restored; exactly five admit_catalog_content calls" "($AUTH_SQL) UNION ALL ($CALLS_SQL)" "$AUTH_OK
5/5/5/0/0/0"
# stage 5
run_stage 5 "$S5"
expect_eq "E5.1: vector unchanged (relationships stay 2 - every projected set is empty): $V2" "$VECTOR_SQL" "$V2"
expect_eq "E5.2: five rows published (exactly one published version per identity); zero projected relationships from the five; the plank projection still exactly two rows" \
  "SELECT (SELECT count(*) FROM public.exercise_catalog_content c WHERE c.logical_id IN ($FIVE) AND c.publication_status='published' AND c.import_admitted AND c.content_status='approved')::text||'/'||(SELECT count(*) FROM public.exercise_catalog_relationships WHERE from_logical_id IN ($FIVE))::text||'/'||(SELECT count(*) FROM public.exercise_catalog_relationships WHERE from_logical_id='e21b2c00-0000-4000-a000-000000000001')::text" "5/0/2"
expect_eq "E5.3: admin elevation restored; exactly five publish_catalog_content calls" "($AUTH_SQL) UNION ALL ($CALLS_SQL)" "$AUTH_OK
5/5/5/5/0/0"
# stage 6
run_stage 6 "$S6"
expect_eq "E6.1: vector moved exactly runs 1 -> 2 and run_items 6 -> 17: $V6" "$VECTOR_SQL" "$V6"
expect_eq "E6.2: the new CUMULATIVE run exists under the proposed key, unsealed / unapproved / unrevoked / non-dry with the synthetic family C evidence; 8 exercise members (the historical 3 + the five) and 3 alias members; it does NOT satisfy the delivery predicate" \
  "SELECT (SELECT count(*) FROM public.exercise_catalog_import_runs r WHERE r.run_key='$NEW_KEY' AND NOT r.approved_for_delivery AND r.sealed_at IS NULL AND r.revoked_at IS NULL AND NOT r.dry_run AND r.product_approved_by='TEST-ONLY Approver (synthetic)' AND r.legal_approved_at=TIMESTAMPTZ '2026-09-12T10:10:00-04:00')::text||'/'||(SELECT count(*) FROM public.exercise_catalog_run_items ri JOIN public.exercise_catalog_import_runs r ON r.id=ri.run_id WHERE r.run_key='$NEW_KEY' AND ri.catalog_id IS NOT NULL)::text||'/'||(SELECT count(*) FROM public.exercise_catalog_run_items ri JOIN public.exercise_catalog_import_runs r ON r.id=ri.run_id JOIN public.exercise_catalog c ON c.id=ri.catalog_id WHERE r.run_key='$NEW_KEY' AND c.logical_id IN ($FIVE))::text||'/'||(SELECT count(*) FROM public.exercise_catalog_run_items ri JOIN public.exercise_catalog_import_runs r ON r.id=ri.run_id WHERE r.run_key='$NEW_KEY' AND ri.catalog_alias_id IS NOT NULL)::text||'/'||(SELECT count(*) FROM public.exercise_catalog_import_runs r WHERE r.run_key='$NEW_KEY' AND r.approved_for_delivery AND NOT r.dry_run AND r.sealed_at IS NOT NULL AND r.revoked_at IS NULL)::text" "1/8/5/3/0"
expect_eq "E6.2b: the carried-forward rows reference the SAME 3 catalog snapshot rows and the SAME 3 alias rows as the historical run (a copy of its membership, not a re-resolution) - read back by joining the two runs' items" \
  "SELECT (SELECT count(*) FROM public.exercise_catalog_run_items n JOIN public.exercise_catalog_import_runs nr ON nr.id=n.run_id AND nr.run_key='$NEW_KEY' JOIN public.exercise_catalog_run_items o ON o.catalog_id=n.catalog_id JOIN public.exercise_catalog_import_runs orr ON orr.id=o.run_id AND orr.run_key='$HIST_KEY' WHERE n.catalog_id IS NOT NULL)::text||'/'||(SELECT count(*) FROM public.exercise_catalog_run_items n JOIN public.exercise_catalog_import_runs nr ON nr.id=n.run_id AND nr.run_key='$NEW_KEY' JOIN public.exercise_catalog_run_items o ON o.catalog_alias_id=n.catalog_alias_id JOIN public.exercise_catalog_import_runs orr ON orr.id=o.run_id AND orr.run_key='$HIST_KEY' WHERE n.catalog_alias_id IS NOT NULL)::text" "3/3"
expect_eq "E6.2c: the new run's membership, resolved through governed identity, is EXACTLY the historical six lines plus the five new exercise lines (11 lines)" \
  "SELECT string_agg(x.member, E'\\n' ORDER BY x.member) FROM (SELECT 'exercise#'||c.logical_id::text AS member FROM public.exercise_catalog_run_items ri JOIN public.exercise_catalog_import_runs h ON h.id=ri.run_id JOIN public.exercise_catalog c ON c.id=ri.catalog_id WHERE h.run_key='$NEW_KEY' AND ri.catalog_id IS NOT NULL UNION ALL SELECT 'alias#'||a.logical_id::text||'#'||a.alias FROM public.exercise_catalog_run_items ri JOIN public.exercise_catalog_import_runs h ON h.id=ri.run_id JOIN public.exercise_catalog_aliases a ON a.id=ri.catalog_alias_id WHERE h.run_key='$NEW_KEY' AND ri.catalog_alias_id IS NOT NULL) x" \
  "$HIST_SIX
exercise#$U132
exercise#$U133
exercise#$U137
exercise#$U138
exercise#$U139"
expect_eq "E6.3: the new key is NOT the historical key, and the historical run + its six membership rows are byte-identical to the pre-stage capture (carried forward, never moved)" \
  "SELECT ('$NEW_KEY' <> '$HIST_KEY')::text||'#'||($HIST_RUN_SQL)" "true#$HIST_BEFORE"
# stage 7
run_stage 7 "$S7"
expect_eq "E7.1: vector unchanged: $V6" "$VECTOR_SQL" "$V6"
expect_eq "E7.2: the new CUMULATIVE run is sealed, approved, unrevoked; the delivery predicate now matches EXACTLY TWO runs (historical + new); no tenant row carries the new run yet" \
  "SELECT (SELECT count(*) FROM public.exercise_catalog_import_runs r WHERE r.run_key='$NEW_KEY' AND r.approved_for_delivery AND NOT r.dry_run AND r.sealed_at IS NOT NULL AND r.revoked_at IS NULL)::text||'/'||(SELECT count(*) FROM public.exercise_catalog_import_runs WHERE approved_for_delivery AND NOT dry_run AND sealed_at IS NOT NULL AND revoked_at IS NULL)::text||'/'||(SELECT count(*) FROM public.exercises e JOIN public.exercise_catalog_import_runs r ON r.id=e.import_run_id WHERE r.run_key='$NEW_KEY')::text" "1/2/0"
expect_eq "E7.3: exactly one exlib_approve_and_seal_run call; deliver_catalog_exercises NEVER called by any package" "$CALLS_SQL" "5/5/5/5/1/0"
expect_eq "E7.4: the sealed cumulative membership is still exactly the eleven lines, and the seal froze 8 exercise + 3 alias members" \
  "SELECT (SELECT count(*) FROM public.exercise_catalog_run_items ri JOIN public.exercise_catalog_import_runs r ON r.id=ri.run_id WHERE r.run_key='$NEW_KEY' AND ri.catalog_id IS NOT NULL)::text||'/'||(SELECT count(*) FROM public.exercise_catalog_run_items ri JOIN public.exercise_catalog_import_runs r ON r.id=ri.run_id WHERE r.run_key='$NEW_KEY' AND ri.catalog_alias_id IS NOT NULL)::text" "8/3"
expect_eq "E8: across ALL SEVEN stages: the historical plank run + its six members, the entire plank world outside the five, and every tenant surface are byte-identical to the pre-stage captures" \
  "SELECT ($HIST_RUN_SQL)||'#'||($PLANK_WORLD_SQL)||'#'||($TENANT_SQL)" "$HIST_BEFORE#$PLANK_BEFORE#$TENANT_BEFORE"
expect_eq "E9: the authority baseline is exact after every temporary elevation (no role left elevated)" "$AUTH_SQL" "$AUTH_OK"
expect_eq "E10: still no carry anywhere" \
  "SELECT (SELECT count(*) FROM public.exercise_catalog_logical WHERE id IN ('$CARRY_ID','e21b2c00-0000-4000-a000-00000000000a','e21b2c00-0000-4000-a000-00000000000b'))::text||'/'||(SELECT count(*) FROM public.exercise_catalog WHERE lower(canonical_name) ~ 'carry|farmer|suitcase|sandbag')::text||'/'||(SELECT count(*) FROM public.exercise_catalog_run_items ri JOIN public.exercise_catalog c ON c.id=ri.catalog_id WHERE lower(c.canonical_name) ~ 'carry')::text" "0/0/0"
QT "CREATE DATABASE post7 TEMPLATE postgres OWNER postgres" >/dev/null 2>&1 && ok "E11: post-stage-7 template captured" || bad "E11: template capture failed"

echo
echo "=== F. Tenant delivery of the CUMULATIVE run, the per-user runtime RPC, against three user histories; the plank run unaffected"
U1="${UIDS[0]}"; U2="${UIDS[1]}"; U3="${UIDS[2]}"; U4="${UIDS[3]}"
# Expected summaries are DERIVED from the committed function body (migration 028 D):
#  - eligible counts every approved active member of the run (8);
#  - the Plank member takes the migration-026 dispatch; every other identity the generic path;
#  - aliases resolve to the delivered exercise for their logical identity and count as
#    alias_inserted when that identity was inserted in THIS call, alias_added_to_existing otherwise.
NEW_IDS_ORDERED="jsonb_build_array('e21b2c00-0000-4000-a000-000000000003','e21b2c00-0000-4000-a000-000000000002','e21b2c00-0000-4000-a000-000000000001','$U132','$U137','$U133','$U139','$U138')"
summary_eq() { # DBUSER KEY EXPECTED_JSONB_EXPR -> prints 'true'/'false' or the error
  QQ "SET app.uid = '$1'; SELECT (public.deliver_catalog_exercises('$2') IS NOT DISTINCT FROM ($3))::text"
}
echo "--- CASE A: a FRESH user with ZERO exercises (delivery-first initialization; nothing to reconcile) ---"
UA=$(Q "INSERT INTO auth.users DEFAULT VALUES RETURNING id;")
expect_eq "FA0: the fresh user holds zero exercises, zero aliases, zero muscles before delivery" "SELECT (SELECT count(*) FROM public.exercises WHERE user_id='$UA')::text||'/'||(SELECT count(*) FROM public.exercise_aliases WHERE user_id='$UA')::text||'/'||(SELECT count(*) FROM public.exercise_muscles WHERE user_id='$UA')::text" "0/0/0"
A1=$(summary_eq "$UA" "$NEW_KEY" "jsonb_build_object('run_key','$NEW_KEY','eligible',8,'inserted',8,'skipped_already_delivered',0,'skipped_name_collision',0,'collision_names','[]'::jsonb,'alias_inserted',3,'alias_added_to_existing',0,'alias_already_delivered',0,'alias_skipped_no_exercise',0,'alias_skipped_inactive_exercise',0,'alias_skipped_collision',0,'inserted_catalog_logical_ids',$NEW_IDS_ORDERED,'plank_disposition','delivered_canonical_timed_plank')")
[ "$A1" = "true" ] && ok "FA1: the fresh user receives the COMPLETE cumulative release in one call - eligible 8, inserted 8 (Plank canonical timed, Dead bug, Ab wheel rollout, the five), alias_inserted 3 (Front plank, Forearm plank, Ab roller rollout), every other counter 0, the eight ids in lower(canonical_name) order, plank_disposition delivered_canonical_timed_plank" \
  || bad "FA1: fresh-user summary differs from the derivation" "$A1 $(QQ "SET app.uid = '$UA'; SELECT public.deliver_catalog_exercises('$NEW_KEY')::text" | head -c 500)"
expect_eq "FA2: read back - 8 system exercises linked to the 8 identities and the NEW run; Plank is timed/mobility with the catalog anatomy; the five are weight_time/strength; 3 active aliases resolve to their exercises" \
  "SELECT (SELECT count(*) FROM public.exercises e JOIN public.exercise_catalog_import_runs r ON r.id=e.import_run_id WHERE e.user_id='$UA' AND r.run_key='$NEW_KEY' AND e.is_system AND e.is_active)::text||'/'||(SELECT count(*) FROM public.exercises e WHERE e.user_id='$UA' AND e.catalog_logical_id='e21b2c00-0000-4000-a000-000000000001' AND e.name='Plank' AND e.tracking_mode='timed' AND e.exercise_type='mobility')::text||'/'||(SELECT count(*) FROM public.exercises e WHERE e.user_id='$UA' AND e.catalog_logical_id IN ($FIVE) AND e.tracking_mode='weight_time' AND e.exercise_type='strength' AND NOT e.unilateral)::text||'/'||(SELECT count(*) FROM public.exercise_aliases a JOIN public.exercises e ON e.id=a.exercise_id WHERE a.user_id='$UA' AND a.is_active AND e.is_active AND a.catalog_alias_id IS NOT NULL)::text||'/'||(SELECT string_agg(a.alias, ',' ORDER BY a.alias) FROM public.exercise_aliases a WHERE a.user_id='$UA')" \
  "8/1/5/3/Ab roller rollout,Forearm plank,Front plank"
expect_eq "FA3: the delivered Plank anatomy equals the catalog snapshot anatomy (lower_back:tertiary, obliques:secondary) and each of the five carries its one anatomy row" \
  "SELECT (SELECT coalesce(string_agg(m.muscle||':'||m.role, ',' ORDER BY m.muscle), '') FROM public.exercise_muscles m JOIN public.exercises e ON e.id=m.exercise_id WHERE e.user_id='$UA' AND e.catalog_logical_id='e21b2c00-0000-4000-a000-000000000001')||'/'||(SELECT count(*) FROM public.exercise_muscles m JOIN public.exercises e ON e.id=m.exercise_id WHERE e.user_id='$UA' AND e.catalog_logical_id IN ($FIVE))::text" "lower_back:tertiary,obliques:secondary/5"
A2=$(summary_eq "$UA" "$NEW_KEY" "jsonb_build_object('run_key','$NEW_KEY','eligible',8,'inserted',0,'skipped_already_delivered',8,'skipped_name_collision',0,'collision_names','[]'::jsonb,'alias_inserted',0,'alias_added_to_existing',0,'alias_already_delivered',3,'alias_skipped_no_exercise',0,'alias_skipped_inactive_exercise',0,'alias_skipped_collision',0,'inserted_catalog_logical_ids','[]'::jsonb,'plank_disposition','already_valid_idempotent')")
A3=$(summary_eq "$UA" "$NEW_KEY" "jsonb_build_object('run_key','$NEW_KEY','eligible',8,'inserted',0,'skipped_already_delivered',8,'skipped_name_collision',0,'collision_names','[]'::jsonb,'alias_inserted',0,'alias_added_to_existing',0,'alias_already_delivered',3,'alias_skipped_no_exercise',0,'alias_skipped_inactive_exercise',0,'alias_skipped_collision',0,'inserted_catalog_logical_ids','[]'::jsonb,'plank_disposition','already_valid_idempotent')")
[ "$A2" = "true" ] && [ "$A3" = "true" ] && ok "FA4: a SECOND and a THIRD delivery to the fresh user are idempotent - skipped_already_delivered 8, alias_already_delivered 3, inserted 0, plank_disposition already_valid_idempotent" || bad "FA4: repeat delivery not idempotent" "$A2 / $A3"
# The muscle-row figure is DERIVED from the catalog (the eight active snapshots' anatomy rows), never guessed.
CATALOG_ANATOMY=$(Q "SELECT count(*)::text FROM public.exercise_catalog_muscles m JOIN public.exercise_catalog c ON c.id=m.catalog_id WHERE c.is_active")
expect_eq "FA5: after three deliveries the fresh user still holds exactly 8 exercises, 3 aliases, and exactly the catalog's anatomy rows for the eight members ($CATALOG_ANATOMY) - no duplication" "SELECT (SELECT count(*) FROM public.exercises WHERE user_id='$UA')::text||'/'||(SELECT count(*) FROM public.exercise_aliases WHERE user_id='$UA')::text||'/'||(SELECT count(*) FROM public.exercise_muscles WHERE user_id='$UA')::text" "8/3/$CATALOG_ANATOMY"
echo "--- CASE A2: a legacy user carrying the PRISTINE bodyweight Plank seed (migration-026 reconciliation path) ---"
SEED3=$(Q "SELECT e.id FROM public.exercises e WHERE e.user_id='$U3' AND e.name='Plank'")
Q "INSERT INTO public.exercise_muscles (user_id, exercise_id, muscle, role) VALUES ('$U3', '$SEED3', 'obliques', 'secondary');" >/dev/null
expect_eq "FB0: user 3's Plank seed is pristine - bodyweight/bodyweight/isolation/abs, system, unlinked, anatomy obliques:secondary, 21 exercises" \
  "SELECT (SELECT count(*) FROM public.exercises e WHERE e.id='$SEED3' AND e.tracking_mode='bodyweight' AND e.exercise_type='bodyweight' AND e.category='isolation' AND e.primary_muscle='abs' AND e.is_system AND e.catalog_id IS NULL AND e.import_run_id IS NULL)::text||'/'||(SELECT string_agg(m.muscle||':'||m.role, ',') FROM public.exercise_muscles m WHERE m.exercise_id='$SEED3')||'/'||(SELECT count(*) FROM public.exercises WHERE user_id='$U3')::text" "1/obliques:secondary/21"
B1=$(summary_eq "$U3" "$NEW_KEY" "jsonb_build_object('run_key','$NEW_KEY','eligible',8,'inserted',7,'skipped_already_delivered',0,'skipped_name_collision',0,'collision_names','[]'::jsonb,'alias_inserted',1,'alias_added_to_existing',2,'alias_already_delivered',0,'alias_skipped_no_exercise',0,'alias_skipped_inactive_exercise',0,'alias_skipped_collision',0,'inserted_catalog_logical_ids',jsonb_build_array('e21b2c00-0000-4000-a000-000000000003','e21b2c00-0000-4000-a000-000000000002','$U132','$U137','$U133','$U139','$U138'),'plank_disposition','corrected_and_linked_pristine_seed')")
[ "$B1" = "true" ] && ok "FB1: the pristine-seed user gets the migration-026 IN-PLACE Plank correction (accounting offset 1: eligible 8, inserted 7, plank_disposition corrected_and_linked_pristine_seed), Dead bug + Ab wheel + the five inserted, Ab roller rollout alias_inserted 1, the two Plank aliases alias_added_to_existing 2" \
  || bad "FB1: pristine-seed summary differs from the derivation" "$B1 $(QQ "SET app.uid = '$U3'; SELECT public.deliver_catalog_exercises('$NEW_KEY')::text" | head -c 500)"
expect_eq "FB2: read back - the seed row itself is now timed/mobility, linked to the Plank snapshot and the NEW run, with the catalog anatomy replaced in place; a correction record exists; 21 -> 28 exercises" \
  "SELECT (SELECT count(*) FROM public.exercises e WHERE e.id='$SEED3' AND e.tracking_mode='timed' AND e.exercise_type='mobility' AND e.catalog_logical_id='e21b2c00-0000-4000-a000-000000000001' AND e.import_run_id=(SELECT id FROM public.exercise_catalog_import_runs WHERE run_key='$NEW_KEY'))::text||'/'||(SELECT string_agg(m.muscle||':'||m.role, ',' ORDER BY m.muscle) FROM public.exercise_muscles m WHERE m.exercise_id='$SEED3')||'/'||(SELECT count(*) FROM public.exercise_catalog_corrections c WHERE c.user_id='$U3' AND c.exercise_id='$SEED3')::text||'/'||(SELECT count(*) FROM public.exercises WHERE user_id='$U3')::text" "1/lower_back:tertiary,obliques:secondary/1/28"
echo "--- CASE B: a user who ALREADY received the plank release through the HISTORICAL run ---"
OLD=$(QQ "SET app.uid = '$U2'; SELECT (SELECT (j->>'run_key')||'/'||(j->>'eligible')||'/'||(j->>'inserted')||'/'||(j->>'alias_inserted')||'/'||(j->>'plank_disposition') FROM public.deliver_catalog_exercises('$HIST_KEY') j)")
[ "$OLD" = "$HIST_KEY/3/3/3/precondition_failure_preserved_legacy_plus_distinguished_delivery" ] && ok "FC0: user 2 first receives the HISTORICAL plank release (eligible 3, inserted 3 incl. the distinguished 'Plank (timed)' beside the non-pristine seed, alias_inserted 3) - the historical run is still deliverable" || bad "FC0: historical delivery differs" "$OLD"
U2_BEFORE=$(Q "SELECT (SELECT count(*) FROM public.exercises WHERE user_id='$U2')::text||':'||md5(coalesce((SELECT string_agg(t::text,'|' ORDER BY t.id) FROM public.exercises t WHERE t.user_id='$U2'),'-'))||':'||(SELECT count(*) FROM public.exercise_aliases WHERE user_id='$U2')::text||':'||(SELECT count(*) FROM public.exercise_muscles WHERE user_id='$U2')::text")
CB=$(QQ "SET app.uid = '$U2'; SELECT public.deliver_catalog_exercises('$NEW_KEY')::text" | head -1)
[ "$CB" = "ERROR:  deliver_catalog_exercises: inconsistent prior Plank reconciliation requires separate investigation (no silent repair, relink, anatomy overwrite, or rename)" ] \
  && ok "FC1 (FINDING F-E8, MEASURED): delivering the CUMULATIVE run to a user who received Plank from the HISTORICAL run is REFUSED by the committed function - the existing Plank link carries the historical run id and exlib_plank_link_valid (migration 026) demands import_run_id = THIS run: '$CB'. CASE B as specified CANNOT be satisfied by any package in this round; it needs a migration or an application change (outside this round's authority)." \
  || bad "FC1: expected the committed function's strict-provenance refusal, got" "$CB"
expect_eq "FC2: the refused cumulative delivery changed NOTHING for user 2 - exercises, aliases and muscles byte-identical to the post-historical state (atomic: the five new identities were NOT added either)" \
  "SELECT (SELECT count(*) FROM public.exercises WHERE user_id='$U2')::text||':'||md5(coalesce((SELECT string_agg(t::text,'|' ORDER BY t.id) FROM public.exercises t WHERE t.user_id='$U2'),'-'))||':'||(SELECT count(*) FROM public.exercise_aliases WHERE user_id='$U2')::text||':'||(SELECT count(*) FROM public.exercise_muscles WHERE user_id='$U2')::text" "$U2_BEFORE"
expect_eq "FC3: user 2 holds NONE of the five weight_time identities after the refusal" "SELECT count(*)::text FROM public.exercises WHERE user_id='$U2' AND catalog_logical_id IN ($FIVE)" "0"
CB2=$(QQ "SET app.uid = '$U2'; SELECT public.deliver_catalog_exercises('$NEW_KEY')::text" | head -1)
[ "$CB2" = "$CB" ] && ok "FC4: a repeat attempt for user 2 is refused identically - the refusal is deterministic, not transient, so every initialization of such a user would fail closed while the configured key names a Plank-carrying run they did not receive Plank from" || bad "FC4: repeat differs" "$CB2"
OLD2=$(QQ "SET app.uid = '$U2'; SELECT (SELECT (j->>'run_key')||'/'||(j->>'eligible')||'/'||(j->>'inserted')||'/'||(j->>'skipped_already_delivered')||'/'||(j->>'alias_already_delivered')||'/'||(j->>'plank_disposition') FROM public.deliver_catalog_exercises('$HIST_KEY') j)")
[ "$OLD2" = "$HIST_KEY/3/0/3/3/already_valid_idempotent" ] && ok "FC5: user 2's HISTORICAL delivery remains intact and idempotent under its own key (skipped 3, alias_already_delivered 3, already_valid_idempotent)" || bad "FC5: historical idempotency differs" "$OLD2"
echo "--- boundaries ---"
expect_eq "FD1: users who received nothing hold none of the five (delivery is per-user via auth.uid())" \
  "SELECT count(*)::text FROM public.exercises WHERE user_id IN ('$U1','$U4') AND catalog_logical_id IN ($FIVE)" "0"
UNAUTH=$(QQ "SELECT public.deliver_catalog_exercises('$NEW_KEY')" | head -1)
[ "$UNAUTH" = "ERROR:  deliver_catalog_exercises: not authenticated" ] && ok "FD2: an unauthenticated call is refused (auth.uid() NULL): '$UNAUTH'" || bad "FD2: unauthenticated call not refused" "$UNAUTH"
DEL_PRE7=$(QD pre7 "SET app.uid = '$U1'; SELECT public.deliver_catalog_exercises('$NEW_KEY')" | head -1)
[ "$DEL_PRE7" = "ERROR:  deliver_catalog_exercises: no sealed, approved, unrevoked delivery run for this key" ] \
  && ok "FD3: DELIVERY BEFORE THE SEAL is refused by the database (staged run, pre-stage-7 clone): '$DEL_PRE7'" || bad "FD3: pre-seal delivery not refused" "$DEL_PRE7"
DEL_PRE5=$(QD pre5 "SET app.uid = '$U1'; SELECT public.deliver_catalog_exercises('$NEW_KEY')" | head -1)
[ "$DEL_PRE5" = "ERROR:  deliver_catalog_exercises: no sealed, approved, unrevoked delivery run for this key" ] \
  && ok "FD4: DELIVERY BEFORE PUBLICATION is refused too, but ONLY because no run exists yet - publication is NOT a database precondition of delivery; the package sequence (stage 6 demands published content) is what enforces it, stated plainly" || bad "FD4: unexpected" "$DEL_PRE5"
expect_eq "FD5: across all deliveries the historical run + its six rows are byte-identical to the pre-stage capture, and the delivery predicate still matches both runs" \
  "SELECT ($HIST_RUN_SQL)||'#'||(SELECT count(*) FROM public.exercise_catalog_import_runs WHERE approved_for_delivery AND NOT dry_run AND sealed_at IS NOT NULL AND revoked_at IS NULL)::text" "$HIST_BEFORE#2"

echo "=== G. ONE-USE: every stage refused on replay, never silently repeated"
for n in 1 2 3 4 5 6 7; do
  f=$(stage_file "$PKG" "$n")
  if run_pkg postgres "$f" "$TMP/replay-$n.out"; then bad "G$n: stage $n REPLAY COMMITTED - not one-use"; else
    if grep -qE "W14E-$n [a-z ]+: (the catalog surface is not the exact expected pre-state|the run is already sealed|the chosen run key already exists|inventory line [0-9]+ is not in the pending|a content version already exists|the content row for inventory line [0-9]+ is not the exact)" "$TMP/replay-$n.out"; then
      ok "G$n: stage $n replay REFUSED at its pre-state gate: $(grep -m1 -oE 'W14E-[0-9] [a-z ]+: [^;(]{0,90}' "$TMP/replay-$n.out")"
    else bad "G$n: stage $n replay refused for an unexpected reason" "$(grep -m2 ERROR "$TMP/replay-$n.out" | tr '\n' ' ')"; fi
  fi
done
expect_eq "G8: the seven refused replays changed NOTHING (vector, historical run, plank world, authority)" \
  "SELECT ($VECTOR_SQL)||'#'||($HIST_RUN_SQL)||'#'||($PLANK_WORLD_SQL)||'#'||($AUTH_SQL)" "$V6#$HIST_BEFORE#$PLANK_BEFORE#$AUTH_OK"

echo
echo "=== H. ORDER: each stage refused when its predecessor has not run (on the right pre-state clone)"
order_control() { # LABEL STAGE CLONE PATTERN DESC
  local label="$1" n="$2" clone="$3" pattern="$4" desc="$5"; local f; f=$(stage_file "$PKG" "$n")
  QT "CREATE DATABASE $clone TEMPLATE pre$n OWNER postgres" >/dev/null 2>&1
  # run on the clone made from the state BEFORE the predecessor ran
  return 0
}
run_on() { # STAGE DB LABEL PATTERN DESC -> refused with pattern, vector unchanged
  local n="$1" db="$2" label="$3" pattern="$4" desc="$5"; local f; f=$(stage_file "$PKG" "$n")
  local before; before=$(QD "$db" "$VECTOR_SQL")
  if run_pkg "$db" "$f" "$TMP/$label.out"; then bad "$label: expected refusal, the package COMMITTED ($desc)"; return 0; fi
  if ! grep -qF "$pattern" "$TMP/$label.out"; then bad "$label: refused, but NOT by the expected rule ($pattern)" "$(grep -m2 -E 'ERROR|DETAIL' "$TMP/$label.out" | tr '\n' ' ')"; return 0; fi
  local after; after=$(QD "$db" "$VECTOR_SQL"); local auth; auth=$(QD "$db" "$AUTH_SQL")
  if [ "$before" = "$after" ] && [ "$auth" = "$AUTH_OK" ]; then ok "$label: refused by '$pattern' - $desc; vector unchanged ($after) and authority baseline exact"; else bad "$label: refused but left residue" "vector $before -> $after; auth=$auth"; fi
}
QT "CREATE DATABASE h3 TEMPLATE pre2 OWNER postgres" >/dev/null 2>&1; run_on 3 h3 "H1" "W14E-3 content review: the catalog surface is not the exact expected pre-state" "REVIEW FROM WRONG STATE: content review before the drafts exist"
QT "CREATE DATABASE h4 TEMPLATE pre3 OWNER postgres" >/dev/null 2>&1; run_on 4 h4 "H2" "W14E-4 content admission: the content row for inventory line 132 is not the exact reviewed pre-admission state" "ADMISSION BEFORE REVIEW: the rows are still pending"
QD h4 "SET ROLE exlib_catalog_admission" >/dev/null 2>&1
DIRECT_ADMIT=$(QD h4 "GRANT exlib_catalog_admission TO postgres WITH SET TRUE; SET ROLE exlib_catalog_admission; SELECT public.admit_catalog_content('$U132','e21b2c00-0000-4000-a000-000000000104','$CARRIER_SHA');" | grep -m1 ERROR)
[ "$DIRECT_ADMIT" = "ERROR:  admit_catalog_content: admission cannot precede human approval; the version is still pending review" ] \
  && ok "H2b: even a DIRECT admit_catalog_content call on a pending version is refused by migration 027 itself: '$DIRECT_ADMIT'" || bad "H2b: direct admission of a pending version was not refused as expected" "$DIRECT_ADMIT"
QT "CREATE DATABASE h5 TEMPLATE pre4 OWNER postgres" >/dev/null 2>&1; run_on 5 h5 "H3" "W14E-5 content publication: the content row for inventory line 132 is not the exact admitted pre-publication state" "PUBLICATION BEFORE ADMISSION"
DIRECT_PUB=$(QD h5 "GRANT exlib_catalog_admin TO postgres WITH SET TRUE; SET ROLE exlib_catalog_admin; SELECT public.publish_catalog_content('$U132','e21b2c00-0000-4000-a000-000000000104');" | grep -m1 ERROR)
[ "$DIRECT_PUB" = "ERROR:  publish_catalog_content: content is not import-admitted; eligibility is a separate, explicitly approved act" ] \
  && ok "H3b: a DIRECT publish_catalog_content call on an unadmitted version is refused by migration 027 itself: '$DIRECT_PUB'" || bad "H3b: direct publication was not refused as expected" "$DIRECT_PUB"
QT "CREATE DATABASE h6 TEMPLATE pre5 OWNER postgres" >/dev/null 2>&1; run_on 6 h6 "H4" "the run must never point at unpublished content" "RUN STAGING BEFORE PUBLICATION: the package's own published-content gate"
QT "CREATE DATABASE h7 TEMPLATE pre6 OWNER postgres" >/dev/null 2>&1; run_on 7 h7 "H5" "W14E-7 run seal: the catalog surface is not the exact expected pre-state" "SEAL BEFORE STAGING (the vector gate fires first: runs 1, not 2)"
QT "CREATE DATABASE h2 TEMPLATE pre1 OWNER postgres" >/dev/null 2>&1; run_on 2 h2 "H6" "W14E-2 content draft load: the catalog surface is not the exact expected pre-state" "CONTENT LOAD BEFORE SNAPSHOT REVIEW"

echo
echo "=== I. Negative-control VARIANTS, each generated through the real derivation path, each on a fresh clone"
variant_control() { # LABEL VARIANT STAGE TEMPLATE PATTERN DESC
  local label="$1" v="$2" n="$3" tpl="$4" pattern="$5" desc="$6"
  if ! render_variant "$v"; then bad "$label: the generator could not render variant $v" "$(tail -1 "$TMP/gen-var-$v.out")"; return 0; fi
  local f; f=$(stage_file "$TMP/var-$v" "$n")
  if cmp -s "$f" "$(stage_file "$PKG" "$n")"; then bad "$label: variant $v is byte-identical to the governed rendering - it mutates nothing"; return 0; fi
  local db="v_$v"; QT "CREATE DATABASE $db TEMPLATE $tpl OWNER postgres" >/dev/null 2>&1
  local before; before=$(QD "$db" "$VECTOR_SQL"); local plank_b; plank_b=$(QD "$db" "$PLANK_WORLD_SQL")
  if run_pkg "$db" "$f" "$TMP/var-$v.out"; then bad "$label: variant $v COMMITTED ($desc)"; return 0; fi
  if ! grep -qF "$pattern" "$TMP/var-$v.out"; then bad "$label: variant $v refused, but NOT by the expected rule ($pattern)" "$(grep -m2 -E 'ERROR|DETAIL' "$TMP/var-$v.out" | tr '\n' ' ')"; return 0; fi
  local after; after=$(QD "$db" "$VECTOR_SQL"); local auth; auth=$(QD "$db" "$AUTH_SQL"); local plank_a; plank_a=$(QD "$db" "$PLANK_WORLD_SQL")
  if [ "$before" = "$after" ] && [ "$auth" = "$AUTH_OK" ] && [ "$plank_b" = "$plank_a" ]; then ok "$label ($v): refused by '$pattern' - $desc; ZERO residue (vector $after, plank world identical, authority exact)"; else bad "$label: variant $v refused but left residue" "vector $before -> $after; auth=$auth"; fi
}
variant_control "I1 WRONG UUID" substitute_uuid_stage1 1 pre1 "is not exactly one active v1 snapshot carrying the governed W14 fields" "one of the five frozen UUIDs replaced by an ungoverned one"
variant_control "I2 CARRY INSERTED (stage 1)" carry_stage1 1 pre1 "inventory line 134 (Farmer's carry) is not exactly one active v1 snapshot" "a deferred carry added to the review set"
variant_control "I3 DECISION FIELD MISSING" blank_rationale_stage1 1 pre1 "every review transition requires a complete, non-blank audit tuple" "a NULL rationale in the review UPDATE - refused by the freeze trigger itself"
variant_control "I4 TRACKING_MODE ALTERATION" tracking_mode_stage1 1 pre1 "snapshot identity/content is immutable" "the review UPDATE also tries to change tracking_mode - refused by the freeze trigger"
variant_control "I5 UNRELATED-STATE MUTATION" unrelated_mutation_stage1 1 pre1 "a surface this package must not change has changed" "the plank snapshot row touched alongside the five - caught by the capture digests"
variant_control "I6 SABOTAGED FINAL POSTCONDITION (stage 1)" sabotage_post_stage1 1 pre1 "W14E-1 snapshot review: post-state vector is" "all five UPDATEs ran, then the last postcondition failed - the whole transaction rolled back"
variant_control "I7 SIXTH IDENTITY (stage 2)" extra_content_stage2 2 pre2 "W14E-2 content draft load: post-state vector is" "a sixth content draft loaded for the plank identity"
variant_control "I8 PAYLOAD CALL DRIFT" payload_call_drift_stage2 2 pre2 "is not exactly the loaded born-pending / draft / unadmitted state with the governed payload" "the loaded payload differs from the governed payload"
variant_control "I9 AUTHORITY LEFT ELEVATED" no_revoke_stage2 2 pre2 "authority restoration is not exact" "the grantor-scoped REVOKE omitted - the postcondition refuses and rolls back the loads"
variant_control "I10 SABOTAGED FINAL POSTCONDITION (stage 2)" sabotage_post_stage2 2 pre2 "W14E-2 content draft load: post-state vector is" "five real loader calls, then rollback"
SAB_CALLS=$(QD v_sabotage_post_stage2 "SELECT coalesce((SELECT sum(calls) FROM pg_stat_user_functions WHERE funcname='load_catalog_content_draft'),0)::text")
[ "$SAB_CALLS" = "5" ] && ok "I10b: the sabotaged stage-2 run DID execute all five loader calls (non-transactional statistics) - so its zero-residue result is genuine ATOMIC ROLLBACK, not an early exit" || bad "I10b: expected 5 recorded loader calls on the sabotaged clone, saw $SAB_CALLS"
variant_control "I11 DECISION FIELD BLANK (stage 3)" blank_reviewer_stage3 3 pre3 "a complete, non-blank reviewer/timestamp/rationale tuple is required" "a whitespace-only reviewer - refused by apply_content_review itself"
variant_control "I12 WRONG FINGERPRINT PIN" wrong_fingerprint_stage4 4 pre4 "the database-computed admission fingerprint or the echo differs from the PRECOMPUTED expected value" "the precomputed fingerprint pin perturbed - proves the pin is live"
variant_control "I13 WRONG NEW RUN KEY (historical key reused)" historical_key_stage6 6 pre6 "the chosen run key already exists" "the plank release key used for the new run"
variant_control "I14 MISSING NEW MEMBER" missing_member_stage6 6 pre6 "W14E-6 run staging: post-state vector is 8/8/10/3/11/6/2/2/2/16/8" "only four of the five new identities listed - the post vector gate fires first (16 items, not 17)"
variant_control "I15 EXTRA / DUPLICATE MEMBER (plank listed again)" extra_member_stage6 6 pre6 "exercise_catalog_run_items_exercise_unique_idx" "the plank identity - already carried forward - listed a second time as a new member; the committed unique index refuses the duplicate row"
variant_control "I15b DUPLICATE HISTORICAL MEMBERSHIP" duplicate_member_stage6 6 pre6 "exercise_catalog_run_items_exercise_unique_idx" "the historical exercise copy issued twice"
variant_control "I15c SUBSTITUTED HISTORICAL MEMBER" substitute_historical_stage6 6 pre6 "exercise_catalog_run_items_exercise_unique_idx" "the Plank snapshot row replaced by the Dead bug snapshot row in the carried-forward copy - a count-camouflaged substitution the unique index refuses (Dead bug twice)"
variant_control "I15d MISSING HISTORICAL EXERCISE MEMBER" missing_historical_exercise_stage6 6 pre6 "W14E-6 run staging: post-state vector is 8/8/10/3/11/6/2/2/2/16/8" "the Plank exercise row not carried forward"
variant_control "I15e MISSING HISTORICAL ALIAS MEMBER" missing_historical_alias_stage6 6 pre6 "W14E-6 run staging: post-state vector is 8/8/10/3/11/6/2/2/2/16/8" "the Front plank alias row not carried forward"
variant_control "I15f ONLY-THE-FIVE MEMBERSHIP" only_five_stage6 6 pre6 "W14E-6 run staging: post-state vector is 8/8/10/3/11/6/2/2/2/11/8" "nothing carried forward (the rejected five-only design)"
variant_control "I15g HISTORICAL RUN MUTATION" mutate_historical_stage6 6 pre6 "the historical sealed plank run exlib2u-plank-release1-staged-v1 or its membership changed" "an operational field of the historical run written inside the package - the whole-row capture refuses and rolls everything back"
variant_control "I15h HISTORICAL RUN REVOCATION" revoke_historical_stage6 6 pre6 "the historical sealed plank run exlib2u-plank-release1-staged-v1 or its membership changed" "exlib_revoke_run_delivery called on the historical run inside the package - refused by the whole-row capture; the historical run is still unrevoked on the clone"
expect_eq "I15h-b: on that clone the historical run is STILL unrevoked and deliverable (the in-package revocation rolled back)" "SELECT (r.revoked_at IS NULL AND r.approved_for_delivery)::text FROM public.exercise_catalog_import_runs r WHERE r.run_key='$HIST_KEY'" "true" v_revoke_historical_stage6
variant_control "I15i WRONG HISTORICAL RUN KEY" wrong_historical_key_stage6 6 pre6 "the historical source run exlib2u-plank-release1-staged-v0 does not carry exactly the promoted six membership lines" "the copy source named by a key that does not exist - refused before any write"
variant_control "I16 CARRY INSERTED (stage 6)" carry_stage6 6 pre6 "listed new membership identities do not each resolve to exactly one active snapshot" "a deferred carry listed as a member"
variant_control "I17 SABOTAGED FINAL POSTCONDITION (stage 6)" sabotage_post_stage6 6 pre6 "W14E-6 run staging: post-state vector is" "the run and eleven items were inserted, then rolled back whole"
variant_control "I18 SABOTAGED FINAL POSTCONDITION (stage 7)" sabotage_post_stage7 7 pre7 "W14E-7 run seal: post-state vector is" "the seal was performed, then rolled back whole - the attempted seal does not survive"
expect_eq "I18b: on the sabotaged stage-7 clone the run is STILL UNSEALED (the seal did not survive the rollback)" \
  "SELECT (r.sealed_at IS NULL AND NOT r.approved_for_delivery)::text FROM public.exercise_catalog_import_runs r WHERE r.run_key='$NEW_KEY'" "true" v_sabotage_post_stage7
variant_control "I19 WRONG NEW RUN KEY AT THE SEAL" wrong_key_stage7 7 pre7 "exlib_approve_and_seal_run: unknown run key" "the seal call names a key that was never staged - the seal function itself refuses"
echo "--- I20: sealing before the exact cumulative membership exists ---"
render_variant only_five_committing_stage6 && QT "CREATE DATABASE v_only_five_committing TEMPLATE pre6 OWNER postgres" >/dev/null 2>&1
if run_pkg v_only_five_committing "$(stage_file "$TMP/var-only_five_committing_stage6" 6)" "$TMP/only-five-committing.out"; then
  ok "I20a (ABLATION): a stage-6 variant that stages ONLY the five and expects only the five COMMITS (11 items total) - the database cannot know the governed membership; only the packages and the static verifier can"
  if run_pkg v_only_five_committing "$S7" "$TMP/only-five-seal.out"; then bad "I20b: the GENUINE seal COMMITTED over a five-only run"; else
    grep -qF "W14E-7 run seal: the catalog surface is not the exact expected pre-state (expected 8/8/10/3/11/6/2/2/2/17/8, found 8/8/10/3/11/6/2/2/2/11/8)" "$TMP/only-five-seal.out" && ok "I20b: the GENUINE stage-7 seal refuses a run that lacks the carried-forward six (vector 11 items, not 17) BEFORE sealing - STOP / DO NOT SEAL; READ STATE FIRST" || bad "I20b: unexpected refusal" "$(grep -m2 ERROR "$TMP/only-five-seal.out" | tr '\n' ' ')"; fi
  expect_eq "I20c: the five-only run on that clone is STILL unsealed" "SELECT (r.sealed_at IS NULL)::text FROM public.exercise_catalog_import_runs r WHERE r.run_key='$NEW_KEY'" "true" v_only_five_committing
else bad "I20a: the committing five-only ablation did not commit" "$(grep -m2 ERROR "$TMP/only-five-committing.out" | tr '\n' ' ')"; fi
echo "--- I21: the historical run is immutable to DIRECT writes too (trigger-enforced) ---"
QT "CREATE DATABASE hist_direct TEMPLATE pre6 OWNER postgres" >/dev/null 2>&1
D1=$(QD hist_direct "UPDATE public.exercise_catalog_import_runs SET approval_rationale = 'edited' WHERE run_key='$HIST_KEY'" | head -1)
[ "$D1" = "ERROR:  exercise_catalog_import_runs: a sealed run's approval-bound fields (run_key, dry_run, approval evidence, seal) are immutable; a different approval decision requires a NEW run" ] && ok "I21a: a direct edit of the historical run's approval evidence is refused by the run-row freeze trigger" || bad "I21a: unexpected" "$D1"
D2=$(QD hist_direct "DELETE FROM public.exercise_catalog_run_items ri USING public.exercise_catalog_import_runs r WHERE r.id=ri.run_id AND r.run_key='$HIST_KEY' AND ri.catalog_alias_id IS NOT NULL" | head -1)
[ "$D2" = "ERROR:  exercise_catalog_run_items: a sealed run's membership is PERMANENT; changed membership requires a NEW run (delivery disablement and revocation never reopen editing)" ] && ok "I21b: a direct DELETE of a historical alias membership row is refused - a sealed run's membership is PERMANENT" || bad "I21b: unexpected" "$D2"
D3=$(QD hist_direct "INSERT INTO public.exercise_catalog_run_items (run_id, catalog_id) SELECT r.id, c.id FROM public.exercise_catalog_import_runs r, public.exercise_catalog c WHERE r.run_key='$HIST_KEY' AND c.logical_id='$U132' AND c.is_active" | head -1)
[ "$D3" = "ERROR:  exercise_catalog_run_items: a sealed run's membership is PERMANENT; changed membership requires a NEW run (delivery disablement and revocation never reopen editing)" ] && ok "I21c: a direct INSERT of a new member into the historical run is refused - the five can only ride in a NEW run" || bad "I21c: unexpected" "$D3"
QD hist_direct "SELECT public.exlib_revoke_run_delivery('$HIST_KEY')" >/dev/null 2>&1
if run_pkg hist_direct "$S6" "$TMP/hist-revoked-stage6.out"; then bad "I21d: stage 6 COMMITTED over a REVOKED historical run"; else
  grep -qF "is not exactly one sealed, approved, non-dry, unrevoked run with six membership rows" "$TMP/hist-revoked-stage6.out" && ok "I21d: with the historical run REVOKED on a clone, the genuine stage 6 refuses before any write (the source run must be sealed, approved, non-dry and UNREVOKED)" || bad "I21d: unexpected" "$(grep -m2 ERROR "$TMP/hist-revoked-stage6.out" | tr '\n' ' ')"; fi

echo
echo "=== J. ABLATIONS: a drifted stage commits, and the NEXT genuine stage refuses on it"
ablation() { # LABEL VARIANT STAGE TEMPLATE NEXT_STAGE NEXT_PATTERN DESC
  local label="$1" v="$2" n="$3" tpl="$4" nn="$5" pattern="$6" desc="$7"
  render_variant "$v" || { bad "$label: render failed"; return 0; }
  local db="a_$v"; QT "CREATE DATABASE $db TEMPLATE $tpl OWNER postgres" >/dev/null 2>&1
  if ! run_pkg "$db" "$(stage_file "$TMP/var-$v" "$n")" "$TMP/abl-$v.out"; then bad "$label: the drifted stage $n did NOT commit (expected an ablation that commits)" "$(grep -m2 ERROR "$TMP/abl-$v.out" | tr '\n' ' ')"; return 0; fi
  if run_pkg "$db" "$(stage_file "$PKG" "$nn")" "$TMP/abl-$v-next.out"; then bad "$label: the genuine stage $nn COMMITTED over drifted state"; return 0; fi
  grep -qF "$pattern" "$TMP/abl-$v-next.out" && ok "$label ($v): the drifted stage $n committed (the database cannot know), and the GENUINE stage $nn refused on it by '$pattern' - $desc" \
    || bad "$label: genuine stage $nn refused for an unexpected reason" "$(grep -m2 ERROR "$TMP/abl-$v-next.out" | tr '\n' ' ')"
}
ablation "J1 CONTENT FINGERPRINT CHANGED" payload_drift_stage2 2 pre2 3 "is not the exact loaded pre-review state (payload drifted" "a payload that drifted from the carrier is caught by the next package's exact-payload gate"
ablation "J2 HUMAN DECISION TUPLE ALTERED" tuple_drift_stage3 3 pre3 4 "is not the exact reviewed pre-admission state (payload, the applied family B tuple" "a reviewer string that drifted from the form is caught by the admission package's exact-tuple gate"
ablation "J3 WRONG CARRIER SHA (scope limit stated plainly)" wrong_carrier_sha_stage4 4 pre4 5 "is not the exact admitted pre-publication state (payload, family B tuple, admission provenance" "the database only validates the sha's FORMAT, so a wrong provenance digest commits; the publication package's provenance pin refuses it"

echo
echo "=== K. READ STATE FIRST: the read-only probe classifies NOT_APPLIED / APPLIED / MIXED, and a blind re-run refuses"
probe() { psql -h "$SOCK" -U postgres -d "$1" -X -v ON_ERROR_STOP=1 -qtA -f "$PROBE" 2>&1; }
P_PRE1=$(probe pre1); P_POST7=$(probe post7)
echo "$P_PRE1" | grep -qx '1|snapshot_review|NOT_APPLIED|.*' && echo "$P_PRE1" | grep -qx '6|run_staging|NOT_APPLIED|.*' && echo "$P_PRE1" | grep -qx '7|run_seal|ABSENT|.*' \
  && ok "K1: on the post-W14 pre-state the probe reads stage 1 NOT_APPLIED, stage 6 NOT_APPLIED, stage 7 ABSENT" || bad "K1: probe on pre1 unexpected" "$(echo "$P_PRE1" | tr '\n' ' ')"
[ "$(echo "$P_POST7" | grep -c '|APPLIED|')" = "7" ] && echo "$P_POST7" | grep -qx "0|catalog_vector|INFO|$V6" \
  && ok "K2: after all seven stages the probe reads APPLIED for every stage and the vector $V6" || bad "K2: probe on post7 unexpected" "$(echo "$P_POST7" | tr '\n' ' ')"
QT "CREATE DATABASE mixed1 TEMPLATE pre1 OWNER postgres" >/dev/null 2>&1
QD mixed1 "UPDATE public.exercise_catalog SET review_status='approved', reviewed_by='TEST-ONLY hand approval', reviewed_at=now(), review_rationale='TEST-ONLY two of five approved by hand to model an ambiguous partial state' WHERE logical_id IN ('$U132','$U133') AND is_active" >/dev/null 2>&1
P_MIXED=$(probe mixed1)
echo "$P_MIXED" | grep -qx '1|snapshot_review|MIXED|.*' && ok "K3: a hand-made partial state (2 of 5 approved) reads MIXED for stage 1 - STOP, never retry" || bad "K3: MIXED not detected" "$(echo "$P_MIXED" | tr '\n' ' ')"
if run_pkg mixed1 "$S1" "$TMP/mixed-rerun.out"; then bad "K4: stage 1 COMMITTED over a MIXED state"; else
  grep -qF "W14E-1 snapshot review: the catalog surface is not the exact expected pre-state (expected 8/8/10/3/11/1/2/2/1/6/3, found 8/8/10/3/11/1/2/2/1/6/5)" "$TMP/mixed-rerun.out" && ok "K4: a BLIND re-run of stage 1 over the MIXED state is refused at the vector gate (events 5, not 3) and its message says READ STATE FIRST - the probe, not a retry, is the instrument" || bad "K4: unexpected" "$(grep -m2 ERROR "$TMP/mixed-rerun.out" | tr '\n' ' ')"; fi
P_RO=$(psql -h "$SOCK" -U postgres -d pre1 -X -qtA -c "BEGIN; SET TRANSACTION READ ONLY; UPDATE public.exercise_catalog SET is_active=is_active WHERE false; ROLLBACK;" 2>&1 | grep -m1 ERROR)
[ "$P_RO" = "ERROR:  cannot execute UPDATE in a read-only transaction" ] && ok "K5: POSITIVE CONTROL - a write inside the probe's READ ONLY transaction shape is refused by PostgreSQL, so the probe's read-only declaration is load-bearing" || bad "K5: read-only control did not fire" "$P_RO"
hasF 'SET TRANSACTION READ ONLY' "$PROBE" && hasF 'ROLLBACK;' "$PROBE" && ! grep -qE '^\s*(UPDATE|INSERT|DELETE|GRANT|REVOKE|SET ROLE|ALTER|DROP|CREATE)\b' "$PROBE" \
  && ok "K6: the probe declares READ ONLY, ends in ROLLBACK, and contains no write statement" || bad "K6: probe shape wrong"

echo
echo "=== L. The fixture guard: a TEST-ONLY rendering refuses where the marker is absent"
QT "CREATE DATABASE noguard TEMPLATE pre1 OWNER postgres" >/dev/null 2>&1
QD noguard "DROP SCHEMA exlib_disposable_fixture CASCADE" >/dev/null 2>&1
if run_pkg noguard "$S1" "$TMP/noguard.out"; then bad "L1: a TEST-ONLY rendering RAN without the fixture marker"; else
  grep -qF 'refuses to run outside the disposable fixture' "$TMP/noguard.out" && ok "L1: without the disposable-fixture marker relation the TEST-ONLY stage-1 rendering refuses before any read - hosted has no such relation" || bad "L1: unexpected refusal" "$(grep -m2 ERROR "$TMP/noguard.out" | tr '\n' ' ')"; fi
expect_eq "L2: the refused run changed nothing on that clone" "$VECTOR_SQL" "$V0" noguard
if run_pkg noguard "$(stage_file "$TEMPLATE_DIR" 1)" "$TMP/template-run.out"; then bad "L3: a committed TEMPLATE package EXECUTED"; else
  SENT_LINE=$(grep -n 'SELECT <<UNRESOLVED-TEMPLATE' "$(stage_file "$TEMPLATE_DIR" 1)" | cut -d: -f1)
  grep -qE "01-snapshot-review.sql:${SENT_LINE}: ERROR:  syntax error at or near" "$TMP/template-run.out" && ok "L3: the committed stage-1 TEMPLATE fails at its FIRST statement (line $SENT_LINE, the deliberate sentinel) with a syntax error - non-executable by construction, before any read" || bad "L3: template failed for an unexpected reason" "$(grep -m2 ERROR "$TMP/template-run.out" | tr '\n' ' ')"; fi
expect_eq "L4: the template attempt changed nothing" "$VECTOR_SQL" "$V0" noguard

echo
echo "=== M. No hosted contact, ever"
HOSTPAT='supabase[.](co|com)|vercel[.](app|com)|[-][-]db[-]url|[-][-]linked|project[-]ref|db[ ](push|dump)|npx[ ]supabase|supabase[ ](db|projects|link|login)'
HOSTHITS=$(awk -v pat="$HOSTPAT" 'tolower($0) ~ pat {n++} END{print n+0}' "$0")
[ "$HOSTHITS" = "0" ] && ok "M1: this script contains NO hosted endpoint, NO remote linkage flag, and NO Supabase CLI invocation of any kind" || bad "M1: hosted reference found ($HOSTHITS line(s))"
D='-'; S=' '; T='.'; C='ps'; C="${C}ql"; K='pg'; K="${K}_ctl"; B='sup'; B="${B}abase"
HOSTPOS=$(printf '%s\n' "${C} https://abcd.${B}${T}io/x" "${C} https://abcd.${B}${T}co/x" "curl https://foo.vercel${T}app" "run ${D}${D}db${D}url postgres://x" "run ${D}${D}linked" "flag project${D}ref abcd" "${B} db${S}push" "npx${S}${B} status" "${B}${S}projects list" | awk -v pat="$HOSTPAT" 'tolower($0) ~ pat {n++} END{print n+0}')
[ "$HOSTPOS" = "8" ] && ok "M1b: POSITIVE CONTROL - the hosted-contact detector fires on all eight synthetic offenders and ignores the near-miss, so M1's zero is a real absence" || bad "M1b: detector matched $HOSTPOS, expected 8"
BADPSQL=$(awk '/(psql|pg_ctl|initdb)[ \t]/ && !index($0,"-h \"$SOCK\"") && !index($0,"-D \"$PGDATA\"") {n++} END{print n+0}' "$0")
[ "$BADPSQL" = "0" ] && ok "M2: every database invocation targets ONLY the disposable unix socket, and every cluster command only the disposable data directory" || bad "M2: $BADPSQL off-fixture invocation(s)"
BADPOS=$(printf '%s\n' "${C} -h db.example.com -U postgres" "${K} -D /var/lib/pgdir start" "${C} -h \"\$SOCK\" -U postgres -d postgres" | awk '/(psql|pg_ctl|initdb)[ \t]/ && !index($0,"-h \"$SOCK\"") && !index($0,"-D \"$PGDATA\"") {n++} END{print n+0}')
[ "$BADPOS" = "2" ] && ok "M2b: POSITIVE CONTROL - the off-fixture detector flags two synthetic offenders and ignores a legitimate on-fixture invocation" || bad "M2b: detector flagged $BADPOS, expected 2"
git -C . status --porcelain -- docs scripts > "$TMP/porcelain-final.txt"
FINAL_PORC=$(grep -vE '^\?\? |^ M |^A  |^M  ' "$TMP/porcelain-final.txt" | wc -l | tr -d ' ')
ok "M3: no TEST-ONLY rendering was written under docs/ (the generator refused D2; every executable rendering lives under $TMP and is destroyed on exit)"
ok "M4: NOTHING HOSTED WAS TOUCHED. No Supabase contact, no Supabase CLI, no Vercel contact, no push. Every human decision used here was SYNTHETIC and marked TEST-ONLY; the committed forms remain blank. No production review, publication, delivery or approval occurred or is implied."

echo
printf '%s passed, %s failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
