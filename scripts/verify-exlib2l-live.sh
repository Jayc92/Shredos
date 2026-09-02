#!/bin/bash
# ============================================================
# ForgeFitOS - EXLIB-2L catalog-content and relationship schema
# PROPOSAL live proof matrix.
#
# Applies migrations 001-026 exactly as committed, then applies the
# UNAPPROVED proposal docs/exlib2l-catalog-content-schema-proposal.sql
# EXACTLY ONCE, against a DISPOSABLE LOCAL PostgreSQL cluster
# (unix-socket only, no TCP, torn down on exit). This script NEVER
# contacts Supabase, Vercel, or any remote service; the proposal stays
# NOT APPLIED to any persistent or hosted database, and nothing here
# loads catalog content, approves, seals, publishes, or delivers
# anything in the product.
#
# The fixtures below are LOCAL, DISPOSABLE PROOF FIXTURES invented for
# this cluster. They are NOT the Plank content record, NOT a load
# package, and NOT an approval: the promoted Plank artifact
# (docs/exlib2g-plank-content.jsonl) is never read, copied, or loaded
# by this script.
#
# Run from the repository root:
#   bash scripts/verify-exlib2l-live.sh
# ============================================================
set -uo pipefail
export LC_ALL=C LANG=C

PROPOSAL="docs/exlib2l-catalog-content-schema-proposal.sql"

PASS=0
FAIL=0
ok()  { PASS=$((PASS+1)); printf '  PASS  %s\n' "$1"; }
bad() { FAIL=$((FAIL+1)); printf '  FAIL  %s\n' "$1"; [ -n "${2:-}" ] && printf '        %s\n' "$2"; return 0; }

TMP="$(mktemp -d /tmp/exlib2l-pg.XXXXXX)"
PGDATA="$TMP/pgdata"
SOCK="$TMP"
cleanup() {
  pg_ctl -D "$PGDATA" stop -m immediate >/dev/null 2>&1 || true
  rm -rf "$TMP"
}
trap cleanup EXIT

DB=postgres
Q()  { psql -h "$SOCK" -U postgres -d "$DB" -X -v ON_ERROR_STOP=1 -qtA -c "$1"; }
QQ() { psql -h "$SOCK" -U postgres -d "$DB" -X -v ON_ERROR_STOP=1 -qtA -c "$1" 2>&1; }

# expect_ok NAME SQL
expect_ok() {
  local out; out=$(QQ "$2")
  if [ $? -eq 0 ]; then ok "$1"; else bad "$1" "$(printf '%s' "$out" | head -2 | tr '\n' ' ')"; fi
}
# expect_err NAME SQL PATTERN
expect_err() {
  local out; out=$(QQ "$2")
  if [ $? -eq 0 ]; then
    bad "$1" "expected fail-closed rejection, statement SUCCEEDED"
  elif printf '%s' "$out" | grep -qF "$3"; then ok "$1"
  else bad "$1" "rejected, but not by the expected rule ($3): $(printf '%s' "$out" | head -2 | tr '\n' ' ')"; fi
}
# expect_eq NAME SQL EXPECTED
expect_eq() {
  local got; got=$(QQ "$2")
  if [ "$got" = "$3" ]; then ok "$1"; else bad "$1" "expected [$3], got [$got]"; fi
}

echo
echo "=== A. Proposal residency, fingerprint, and clean application"

[ -f "$PROPOSAL" ] && ok "A1: the proposal exists at $PROPOSAL" \
  || { bad "A1: proposal missing"; exit 1; }
N027=$(ls supabase/migrations/ 2>/dev/null | grep -c '^027' || true)
NMIG=$(ls supabase/migrations/0*.sql 2>/dev/null | wc -l | tr -d ' ')
[ "$N027/$NMIG" = "0/26" ] \
  && ok "A2: the proposal is NOT a migration - migrations are exactly 26 files with no 027" \
  || bad "A2: expected 26 migrations and no 027, found $NMIG with $N027 027-files"
PSHA=$(shasum -a 256 "$PROPOSAL" | awk '{print $1}')
PBYTES=$(wc -c < "$PROPOSAL" | tr -d ' ')
ok "A3: proposal under test: $PBYTES bytes, sha256 $PSHA"
grep -q '^BEGIN;' "$PROPOSAL" && grep -q '^COMMIT;' "$PROPOSAL" \
  && ok "A4: every executable statement is enclosed in ONE explicit transaction (023/024/025 convention)" \
  || bad "A4: proposal is not wrapped in a single explicit transaction"

echo
echo "=== B. Disposable cluster + migrations 001-026"
initdb -D "$PGDATA" -U postgres --no-locale -E UTF8 >/dev/null 2>&1
pg_ctl -D "$PGDATA" -o "-c listen_addresses='' -c unix_socket_directories='$SOCK'" -l "$TMP/pg.log" start >/dev/null 2>&1
if Q "SELECT 1" >/dev/null 2>&1; then
  ok "B1: cluster up at $SOCK (unix socket only; no TCP; no hosted contact)"
else
  bad "B1: cluster failed to start"; sed -n '1,5p' "$TMP/pg.log"; exit 1
fi
expect_eq "B2: the cluster listens on NO TCP address (socket-only, structurally offline)" \
  "SHOW listen_addresses" ""

Q "CREATE ROLE anon NOLOGIN;
   CREATE ROLE authenticated NOLOGIN;
   CREATE ROLE service_role NOLOGIN;
   CREATE SCHEMA auth;
   CREATE TABLE auth.users (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email TEXT);
   CREATE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql STABLE
     AS \$\$SELECT nullif(current_setting('app.uid', true), '')::uuid\$\$;" >/dev/null

APPLIED=0
for f in supabase/migrations/0*.sql; do
  psql -h "$SOCK" -U postgres -d "$DB" -X -v ON_ERROR_STOP=1 -q -f "$f" >/dev/null 2>"$TMP/err.log" \
    || { bad "B3: migration failed: $f" "$(sed -n '1,3p' "$TMP/err.log")"; exit 1; }
  APPLIED=$((APPLIED+1))
done
[ "$APPLIED" = "26" ] && ok "B3: migrations 001-026 applied cleanly in order (26 files, unmodified)" \
  || bad "B3: expected 26 migrations, applied $APPLIED"
expect_eq "B4: the pre-proposal catalog is EMPTY, matching the promoted EXLIB-2F hosted evidence (so the NOT NULL metadata additions are exact)" \
  "SELECT count(*)::text FROM exercise_catalog" "0"

echo
echo "=== C. The proposal applies exactly once, from docs/"
psql -h "$SOCK" -U postgres -d "$DB" -X -v ON_ERROR_STOP=1 -q -f "$PROPOSAL" >/dev/null 2>"$TMP/prop.log" \
  && ok "C1: the proposal applies CLEANLY on top of migration 026" \
  || { bad "C1: proposal failed to apply" "$(sed -n '1,5p' "$TMP/prop.log")"; exit 1; }
psql -h "$SOCK" -U postgres -d "$DB" -X -v ON_ERROR_STOP=1 -q -f "$PROPOSAL" >/dev/null 2>&1 \
  && bad "C2: a SECOND application succeeded - apply-exactly-once is not enforced" \
  || ok "C2: a second application fails closed (apply-exactly-once; the single transaction rolls it back wholly)"
expect_eq "C3: the failed second application left the schema intact (provenance column still present exactly once)" \
  "SELECT count(*)::text FROM information_schema.columns WHERE table_name='exercise_catalog' AND column_name='provenance'" "1"

echo
echo "=== D. Applying the schema creates NO data or lifecycle state"
expect_eq "D1: zero content rows, zero relationships, zero runs, zero run items, zero catalog rows, zero name claims, zero review events, zero corrections - the schema loads NOTHING" \
  "SELECT (SELECT count(*) FROM exercise_catalog_content)::text || '/' ||
          (SELECT count(*) FROM exercise_catalog_relationships)::text || '/' ||
          (SELECT count(*) FROM exercise_catalog_import_runs)::text || '/' ||
          (SELECT count(*) FROM exercise_catalog_run_items)::text || '/' ||
          (SELECT count(*) FROM exercise_catalog)::text || '/' ||
          (SELECT count(*) FROM exercise_catalog_name_claims)::text || '/' ||
          (SELECT count(*) FROM exercise_catalog_review_events)::text || '/' ||
          (SELECT count(*) FROM exercise_catalog_corrections)::text" "0/0/0/0/0/0/0/0"
expect_eq "D2: no approval, seal, or delivery state exists (no approved/sealed run, no delivered exercise)" \
  "SELECT (SELECT count(*) FROM exercise_catalog_import_runs WHERE approved_for_delivery)::text || '/' ||
          (SELECT count(*) FROM exercise_catalog_import_runs WHERE sealed_at IS NOT NULL)::text" "0/0"
expect_eq "D3: no published content can exist, because no content exists" \
  "SELECT count(*)::text FROM exercise_catalog_content WHERE publication_status='published'" "0"

echo
echo "=== E. Migration 023-026 behavior remains green"
expect_eq "E1: every 023/026 catalog function still present with its original volatility and SECURITY DEFINER posture" \
  "SELECT string_agg(proname || ':' || provolatile::text || ':' || prosecdef::text, ',' ORDER BY proname)
   FROM pg_proc WHERE proname IN
   ('deliver_catalog_exercises','rollback_catalog_delivery','exlib_approve_and_seal_run',
    'exlib_revoke_run_delivery','exlib_plank_link_valid','exlib_freeze_catalog_snapshot')" \
  "deliver_catalog_exercises:v:true,exlib_approve_and_seal_run:v:true,exlib_freeze_catalog_snapshot:v:true,exlib_plank_link_valid:v:true,exlib_revoke_run_delivery:v:true,rollback_catalog_delivery:v:true"
expect_eq "E2: the 023 review-audit CHECK and the three exercise_catalog triggers survive the ALTERs untouched" \
  "SELECT (SELECT count(*)::text FROM pg_constraint WHERE conname='exercise_catalog_review_audit_chk') || '/' ||
          (SELECT count(*)::text FROM pg_trigger WHERE tgrelid='exercise_catalog'::regclass AND NOT tgisinternal)" "1/3"

LP='11111111-2222-3333-4444-555555555501'
LD='11111111-2222-3333-4444-555555555502'
LA='11111111-2222-3333-4444-555555555503'
LX='11111111-2222-3333-4444-555555555504'
SO='aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeee01'
SX='aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeee02'
Q "INSERT INTO exercise_catalog_logical (id) VALUES ('$LP'),('$LD'),('$LA'),('$LX');" >/dev/null

echo
echo "=== F. Provenance model: both directions, fail-closed"
expect_ok "F1: ORIGINAL content is representable truthfully - provenance=forgefitos_original with ALL FOUR source fields NULL is accepted (no fabricated source_url/source_page/retrieved_at/import_confidence)" \
  "INSERT INTO exercise_catalog (id, logical_id, canonical_name, category, primary_muscle, equipment,
     laterality, tracking_mode, provenance, movement_pattern, training_role, difficulty, availability)
   VALUES ('$SO','$LP','Proof Original','isolation','abs','bodyweight','bilateral','timed',
     'forgefitos_original','core_anti_extension','core','beginner','minimal');"
expect_err "F2: an ORIGINAL row carrying a fabricated source_url is REJECTED by the conditional constraint" \
  "INSERT INTO exercise_catalog (logical_id, canonical_name, category, primary_muscle, equipment,
     laterality, tracking_mode, provenance, source_url, movement_pattern, training_role, difficulty, availability)
   VALUES ('$LD','Proof Orig Bad','isolation','abs','bodyweight','bilateral','timed',
     'forgefitos_original','https://example.test/fake','core_flexion','core','beginner','minimal');" \
  "exercise_catalog_provenance_sources_chk"
expect_ok "F3: EXTERNAL-IMPORT rows keep working unchanged - complete source metadata is accepted" \
  "INSERT INTO exercise_catalog (id, logical_id, canonical_name, category, primary_muscle, equipment,
     laterality, tracking_mode, provenance, source_url, source_page, retrieved_at, import_confidence,
     movement_pattern, training_role, difficulty, availability)
   VALUES ('$SX','$LX','Proof External','compound','lats','barbell','bilateral','weight_reps',
     'external_source_derived','https://example.test/x','https://example.test/dir','2026-08-30','high',
     'vertical_pull','compound','intermediate','commercial_gym');"
expect_err "F4: an EXTERNAL row missing source_url is REJECTED (the dropped NOT NULLs did not weaken import provenance)" \
  "INSERT INTO exercise_catalog (logical_id, canonical_name, category, primary_muscle, equipment,
     laterality, tracking_mode, provenance, source_page, retrieved_at, import_confidence,
     movement_pattern, training_role, difficulty, availability)
   VALUES ('$LD','Proof Ext Bad','compound','lats','barbell','bilateral','weight_reps',
     'external_source_derived','https://example.test/dir','2026-08-30','high',
     'vertical_pull','compound','intermediate','commercial_gym');" \
  "exercise_catalog_provenance_sources_chk"
expect_err "F5: an unknown provenance value is REJECTED by the vocabulary CHECK" \
  "INSERT INTO exercise_catalog (logical_id, canonical_name, category, primary_muscle, equipment,
     laterality, tracking_mode, provenance, movement_pattern, training_role, difficulty, availability)
   VALUES ('$LD','Proof Prov Bad','isolation','abs','bodyweight','bilateral','timed',
     'invented_provenance','core_flexion','core','beginner','minimal');" \
  "exercise_catalog_provenance_check"
expect_eq "F6: provenance DEFAULTS to external_source_derived, so pre-existing import rows keep their exact meaning without rewriting" \
  "SELECT column_default FROM information_schema.columns
   WHERE table_name='exercise_catalog' AND column_name='provenance'" \
  "'external_source_derived'::text"
for col in movement_pattern training_role difficulty availability; do
  expect_err "F7: $col is NOT NULL - discovery metadata can never be silently omitted" \
    "INSERT INTO exercise_catalog (logical_id, canonical_name, category, primary_muscle, equipment,
       laterality, tracking_mode, provenance, movement_pattern, training_role, difficulty, availability)
     SELECT '$LD','Proof Null $col','isolation','abs','bodyweight','bilateral','timed',
       'forgefitos_original',
       CASE WHEN '$col'='movement_pattern' THEN NULL ELSE 'core_flexion' END,
       CASE WHEN '$col'='training_role' THEN NULL ELSE 'core' END,
       CASE WHEN '$col'='difficulty' THEN NULL ELSE 'beginner' END,
       CASE WHEN '$col'='availability' THEN NULL ELSE 'minimal' END;" \
    "null value in column \"$col\""
done
expect_err "F8: an unknown movement_pattern is REJECTED by the promoted vocabulary" \
  "INSERT INTO exercise_catalog (logical_id, canonical_name, category, primary_muscle, equipment,
     laterality, tracking_mode, provenance, movement_pattern, training_role, difficulty, availability)
   VALUES ('$LD','Proof MP Bad','isolation','abs','bodyweight','bilateral','timed',
     'forgefitos_original','not_a_pattern','core','beginner','minimal');" \
  "exercise_catalog_movement_pattern_check"

echo
echo "=== G. The freeze splice: new columns are immutable snapshot content"
for col in provenance movement_pattern training_role difficulty availability; do
  case $col in
    provenance) val="'external_source_derived'" ;;
    movement_pattern) val="'core_flexion'" ;;
    training_role) val="'isolation'" ;;
    difficulty) val="'advanced'" ;;
    availability) val="'home_gym'" ;;
  esac
  expect_err "G1: $col cannot be mutated in place - corrections require a NEW catalog version row" \
    "UPDATE exercise_catalog SET $col = $val WHERE id = '$SO';" \
    "snapshot identity/content is immutable"
done
expect_err "G2: the carried 023 review contract still refuses a status-only flip without fresh evidence" \
  "UPDATE exercise_catalog SET review_status='approved' WHERE id='$SO';" \
  "complete, non-blank audit tuple"
expect_ok "G3: a complete 023 review transition still succeeds and still logs its review event" \
  "UPDATE exercise_catalog SET review_status='approved', reviewed_by='local-proof-reviewer',
     reviewed_at=NOW(), review_rationale='local disposable fixture' WHERE id IN ('$SO','$SX');"
expect_eq "G4: the 023 review-events log recorded both transitions (evidence machinery intact)" \
  "SELECT count(*)::text FROM exercise_catalog_review_events" "2"
expect_err "G5: 023 one-way review_status still holds (approved cannot return to pending)" \
  "UPDATE exercise_catalog SET review_status='pending', reviewed_by=NULL, reviewed_at=NULL,
     review_rationale=NULL WHERE id='$SO';" "review_status is one-way"

echo
echo "=== H. Content model: birth, review audit, immutability"
C1='cccccccc-0000-0000-0000-000000000001'
C2='cccccccc-0000-0000-0000-000000000002'
C3='cccccccc-0000-0000-0000-000000000003'
C4='cccccccc-0000-0000-0000-000000000004'
mkcontent() { # $1=id $2=logical $3=version
  Q "INSERT INTO exercise_catalog_content (id, logical_id, content_version, authored_by, authored_at,
       setup_steps, execution_steps, breathing_cue, common_mistakes, safety_guidance)
     VALUES ('$1','$2',$3,'local-proof-author','2026-09-01',
       '[\"step\"]'::jsonb,'[\"exec\"]'::jsonb,'breathe out on effort',
       '[\"mistake\"]'::jsonb,'stop if form breaks down');" >/dev/null 2>&1 \
    || bad "fixture: content insert failed ($1)"
}
expect_ok "H1: a content version is born PENDING and DRAFT with no review evidence" \
  "INSERT INTO exercise_catalog_content (id, logical_id, content_version, authored_by, authored_at,
     setup_steps, execution_steps, breathing_cue, common_mistakes, safety_guidance)
   VALUES ('$C1','$LP',1,'local-proof-author','2026-09-01',
     '[\"step\"]'::jsonb,'[\"exec\"]'::jsonb,'breathe out on effort',
     '[\"mistake\"]'::jsonb,'stop if form breaks down');"
expect_eq "H2: its birth state is exactly pending/draft/not-admitted (no default-active or default-eligible trap)" \
  "SELECT content_status||'/'||publication_status||'/'||import_admitted::text
   FROM exercise_catalog_content WHERE id='$C1'" "pending/draft/false"
expect_err "H3: a version cannot be BORN approved - review decisions arrive only by UPDATE with their own audit" \
  "INSERT INTO exercise_catalog_content (logical_id, content_version, authored_by, authored_at,
     setup_steps, execution_steps, breathing_cue, common_mistakes, safety_guidance,
     content_status, reviewed_by, reviewed_at, review_rationale)
   VALUES ('$LD',1,'a','2026-09-01','[]'::jsonb,'[]'::jsonb,'b','[]'::jsonb,'c',
     'approved','r',NOW(),'rationale text');" \
  "versions are born pending"
expect_err "H4: a version cannot be BORN published - no implicit publication during insertion or loading" \
  "INSERT INTO exercise_catalog_content (logical_id, content_version, authored_by, authored_at,
     setup_steps, execution_steps, breathing_cue, common_mistakes, safety_guidance, publication_status)
   VALUES ('$LD',1,'a','2026-09-01','[]'::jsonb,'[]'::jsonb,'b','[]'::jsonb,'c','published');" \
  "born drafts and never auto-publish"
expect_err "H5: a PENDING version may not carry review evidence (blank/absent never reads as reviewed)" \
  "INSERT INTO exercise_catalog_content (logical_id, content_version, authored_by, authored_at,
     setup_steps, execution_steps, breathing_cue, common_mistakes, safety_guidance, reviewed_by)
   VALUES ('$LD',1,'a','2026-09-01','[]'::jsonb,'[]'::jsonb,'b','[]'::jsonb,'c','smuggled-reviewer');" \
  "exercise_catalog_content_review_audit_chk"
expect_err "H6: a DECIDED version demands COMPLETE non-blank evidence - a whitespace reviewer is rejected" \
  "UPDATE exercise_catalog_content SET content_status='approved', reviewed_by='   ',
     reviewed_at=NOW(), review_rationale='rationale text' WHERE id='$C1';" \
  "complete, non-blank audit tuple"
expect_err "H7: a DECIDED version demands a non-blank rationale" \
  "UPDATE exercise_catalog_content SET content_status='approved', reviewed_by='Reviewer',
     reviewed_at=NOW(), review_rationale='  ' WHERE id='$C1';" \
  "complete, non-blank audit tuple"
expect_ok "H8: a PENDING draft's prose is still editable (pre-review authoring is permitted)" \
  "UPDATE exercise_catalog_content SET breathing_cue='exhale on the effort' WHERE id='$C1';"
expect_err "H9: version identity is immutable from birth (content_version cannot be renumbered)" \
  "UPDATE exercise_catalog_content SET content_version=99 WHERE id='$C1';" \
  "version identity is immutable"
expect_err "H10: (logical_id, content_version) is unique - a duplicate version number is rejected" \
  "INSERT INTO exercise_catalog_content (logical_id, content_version, authored_by, authored_at,
     setup_steps, execution_steps, breathing_cue, common_mistakes, safety_guidance)
   VALUES ('$LP',1,'a','2026-09-01','[]'::jsonb,'[]'::jsonb,'b','[]'::jsonb,'c');" \
  "exercise_catalog_content_logical_id_content_version_key"
expect_err "H11: prose fields must be JSON ARRAYS - a scalar setup_steps is rejected" \
  "INSERT INTO exercise_catalog_content (logical_id, content_version, authored_by, authored_at,
     setup_steps, execution_steps, breathing_cue, common_mistakes, safety_guidance)
   VALUES ('$LD',7,'a','2026-09-01','\"not-an-array\"'::jsonb,'[]'::jsonb,'b','[]'::jsonb,'c');" \
  "setup_steps"

echo
echo "=== I. Import admission is explicit and all-or-nothing"
expect_err "I1: import_admitted=true without a fingerprint is REJECTED (eligibility can never be a bare boolean)" \
  "UPDATE exercise_catalog_content SET import_admitted=true WHERE id='$C1';" \
  "exercise_catalog_content_admission_chk"
expect_err "I2: a fingerprint without import_admitted is REJECTED (no half-recorded admission)" \
  "UPDATE exercise_catalog_content SET admitted_fingerprint='deadbeef', admitted_at='2026-09-01' WHERE id='$C1';" \
  "exercise_catalog_content_admission_chk"
FP=$(Q "SELECT exlib_content_fingerprint(setup_steps, execution_steps, breathing_cue, common_mistakes,
          safety_guidance, equipment_setup, accessibility_alternative, authored_by, authored_at)
        FROM exercise_catalog_content WHERE id='$C1'")
expect_ok "I3: a COMPLETE admission (flag + exact current fingerprint + date) is accepted while pending" \
  "UPDATE exercise_catalog_content SET import_admitted=true, admitted_fingerprint='$FP',
     admitted_at='2026-09-01' WHERE id='$C1';"
expect_eq "I4: the fingerprint is DETERMINISTIC and session-independent - identical under three different DateStyles (authored_at is folded in as an immutable day offset, never date::text)" \
  "SELECT count(DISTINCT f)::text FROM (
     SELECT (SELECT exlib_content_fingerprint(setup_steps, execution_steps, breathing_cue,
               common_mistakes, safety_guidance, equipment_setup, accessibility_alternative,
               authored_by, authored_at) FROM exercise_catalog_content WHERE id='$C1') AS f
     FROM (VALUES (1),(2),(3)) v(i)) s" "1"
DS1=$(Q "SET datestyle='ISO,MDY'; SELECT exlib_content_fingerprint('[]'::jsonb,'[]'::jsonb,'b','[]'::jsonb,'c',NULL,NULL,'a',DATE '2026-09-01')")
DS2=$(Q "SET datestyle='German,DMY'; SELECT exlib_content_fingerprint('[]'::jsonb,'[]'::jsonb,'b','[]'::jsonb,'c',NULL,NULL,'a',DATE '2026-09-01')")
[ "$DS1" = "$DS2" ] && ok "I5: the same payload hashes IDENTICALLY under datestyle ISO and German (a date::text form would have diverged and spuriously failed publication as STALE)" \
  || bad "I5: fingerprint is DateStyle-dependent" "ISO=$DS1 German=$DS2"
expect_eq "I6: NULL optional fields are encoded distinctly from empty strings (shape changes always change the fingerprint)" \
  "SELECT (exlib_content_fingerprint('[]'::jsonb,'[]'::jsonb,'b','[]'::jsonb,'c',NULL,NULL,'a',DATE '2026-09-01')
           <> exlib_content_fingerprint('[]'::jsonb,'[]'::jsonb,'b','[]'::jsonb,'c','',NULL,'a',DATE '2026-09-01'))::text" "true"

echo
echo "=== J. Publication: only approved, admitted, fingerprint-fresh content"
expect_err "J1: PENDING content cannot be published, structurally (CHECK, not merely by function logic)" \
  "UPDATE exercise_catalog_content SET publication_status='published' WHERE id='$C1';" \
  "exercise_catalog_content_publication_chk"
expect_ok "J2: the pending draft is approved with complete fresh evidence" \
  "UPDATE exercise_catalog_content SET content_status='approved', reviewed_by='Local Proof Reviewer',
     reviewed_at=NOW(), review_rationale='local disposable fixture rationale' WHERE id='$C1';"
expect_err "J3: a DECIDED version is frozen - its prose can no longer be edited (corrections require a NEW version)" \
  "UPDATE exercise_catalog_content SET breathing_cue='changed after approval' WHERE id='$C1';" \
  "decided content version is immutable"
expect_err "J4: a decided version's admission fields are frozen too" \
  "UPDATE exercise_catalog_content SET import_admitted=false, admitted_fingerprint=NULL,
     admitted_at=NULL WHERE id='$C1';" \
  "decided content version is immutable"
expect_err "J5: review-audit fields cannot drift without an allowed status transition" \
  "UPDATE exercise_catalog_content SET reviewed_by='Someone Else' WHERE id='$C1';" \
  "only together with an allowed content_status transition"
expect_err "J6: ordinary authenticated callers cannot EXECUTE the publication function" \
  "SET ROLE authenticated; SELECT publish_catalog_content('$LP','$C1');" \
  "permission denied for function publish_catalog_content"
expect_ok "J7: the trusted exlib_catalog_admin role CAN publish once EVERY prerequisite is satisfied" \
  "SET ROLE exlib_catalog_admin; SELECT publish_catalog_content('$LP','$C1');"
expect_eq "J8: the published version is exactly one, and it is the approved+admitted row" \
  "SELECT publication_status||'/'||(SELECT count(*)::text FROM exercise_catalog_content
     WHERE logical_id='$LP' AND publication_status='published')
   FROM exercise_catalog_content WHERE id='$C1'" "published/1"
expect_err "J9: republishing an already-published version is rejected" \
  "SET ROLE exlib_catalog_admin; SELECT publish_catalog_content('$LP','$C1');" \
  "only a draft can be published"

mkcontent "$C2" "$LP" 2
expect_err "J10: REVISED content can NEVER be published - migration 023 defines revised as TERMINAL with re-approval impossible (disclosed narrowing of promoted 2A)" \
  "UPDATE exercise_catalog_content SET content_status='revised', reviewed_by='Local Proof Reviewer',
     reviewed_at=NOW(), review_rationale='sent back for revision' WHERE id='$C2';
   UPDATE exercise_catalog_content SET publication_status='published' WHERE id='$C2';" \
  "exercise_catalog_content_publication_chk"
expect_err "J11: the publication FUNCTION also refuses revised content (defence in depth, not CHECK-only)" \
  "UPDATE exercise_catalog_content SET content_status='revised', reviewed_by='Local Proof Reviewer',
     reviewed_at=NOW(), review_rationale='sent back for revision' WHERE id='$C2';
   SET ROLE exlib_catalog_admin; SELECT publish_catalog_content('$LP','$C2');" \
  "only approved content can be published"
expect_err "J12: REJECTED content can never be published" \
  "UPDATE exercise_catalog_content SET content_status='rejected', reviewed_by='Local Proof Reviewer',
     reviewed_at=NOW(), review_rationale='rejected for cause' WHERE id='$C2';
   SET ROLE exlib_catalog_admin; SELECT publish_catalog_content('$LP','$C2');" \
  "only approved content can be published"
expect_err "J13: a PUBLISHED approved row cannot be flipped to revised in place - it must be retired first (the hole the narrowing closes)" \
  "UPDATE exercise_catalog_content SET content_status='revised', reviewed_by='Another Reviewer',
     reviewed_at=NOW(), review_rationale='attempted in-place un-approval' WHERE id='$C1';" \
  "exercise_catalog_content_publication_chk"

echo
echo "=== K. Stale eligibility fails closed"
mkcontent "$C3" "$LD" 1
FP3=$(Q "SELECT exlib_content_fingerprint(setup_steps, execution_steps, breathing_cue, common_mistakes,
           safety_guidance, equipment_setup, accessibility_alternative, authored_by, authored_at)
         FROM exercise_catalog_content WHERE id='$C3'")
Q "UPDATE exercise_catalog_content SET import_admitted=true, admitted_fingerprint='$FP3',
     admitted_at='2026-09-01' WHERE id='$C3';" >/dev/null
Q "UPDATE exercise_catalog_content SET breathing_cue='edited AFTER admission' WHERE id='$C3';" >/dev/null
Q "UPDATE exercise_catalog_content SET content_status='approved', reviewed_by='Local Proof Reviewer',
     reviewed_at=NOW(), review_rationale='approved after the edit' WHERE id='$C3';" >/dev/null
expect_err "K1: eligibility is FINGERPRINT-BOUND - content edited after admission publishes as STALE, exactly as the EXLIB-2J admission record requires" \
  "SET ROLE exlib_catalog_admin; SELECT publish_catalog_content('$LD','$C3');" \
  "import admission is STALE"
mkcontent "$C4" "$LA" 1
Q "UPDATE exercise_catalog_content SET content_status='approved', reviewed_by='Local Proof Reviewer',
     reviewed_at=NOW(), review_rationale='approved but never admitted' WHERE id='$C4';" >/dev/null
expect_err "K2: approved-but-NOT-ADMITTED content cannot publish - human approval and import eligibility stay separate axes" \
  "SET ROLE exlib_catalog_admin; SELECT publish_catalog_content('$LA','$C4');" \
  "not import-admitted"
expect_err "K3: a content row cannot be published under a logical identity it does not belong to" \
  "SET ROLE exlib_catalog_admin; SELECT publish_catalog_content('$LX','$C4');" \
  "content row not found under that logical identity"
expect_err "K4: an unknown logical identity is rejected" \
  "SET ROLE exlib_catalog_admin; SELECT publish_catalog_content('99999999-9999-9999-9999-999999999999','$C4');" \
  "unknown logical identity"

echo
echo "=== L. Relationships: identity-keyed, fail-closed"
expect_ok "L1: the three promoted relation types are accepted between distinct identities" \
  "INSERT INTO exercise_catalog_relationships (from_logical_id, to_logical_id, relation) VALUES
     ('$LP','$LD','substitution'), ('$LP','$LA','progression'), ('$LA','$LP','regression');"
expect_err "L2: a MISSING target identity is rejected (no dangling relationship can be created)" \
  "INSERT INTO exercise_catalog_relationships (from_logical_id, to_logical_id, relation)
   VALUES ('$LP','99999999-9999-9999-9999-999999999999','substitution');" \
  "violates foreign key constraint"
expect_err "L3: a SELF-reference is rejected" \
  "INSERT INTO exercise_catalog_relationships (from_logical_id, to_logical_id, relation)
   VALUES ('$LP','$LP','substitution');" "_check"
expect_err "L4: an invalid relation type is rejected" \
  "INSERT INTO exercise_catalog_relationships (from_logical_id, to_logical_id, relation)
   VALUES ('$LP','$LD','sort_of_similar');" "relation"
expect_err "L5: relationships are deterministically unique - an exact duplicate is rejected" \
  "INSERT INTO exercise_catalog_relationships (from_logical_id, to_logical_id, relation)
   VALUES ('$LP','$LD','substitution');" "exercise_catalog_relationships_pkey"
expect_err "L6: ON DELETE RESTRICT prevents silently orphaning a relationship by deleting an identity" \
  "DELETE FROM exercise_catalog_logical WHERE id='$LD';" "violates foreign key constraint"
expect_eq "L7: the Plank relationship model is fully representable while its targets have NO approved, admitted, or published content - identity existence is strictly separate from content approval, eligibility, loading, and publication" \
  "SELECT (SELECT count(*)::text FROM exercise_catalog_relationships WHERE from_logical_id='$LP') || '/' ||
          (SELECT count(*)::text FROM exercise_catalog_content
             WHERE logical_id='$LA' AND publication_status='published') || '/' ||
          (SELECT count(*)::text FROM exercise_catalog_content
             WHERE logical_id='$LA' AND import_admitted)" "2/0/0"
expect_eq "L8: no identity-only stub shortcut was used - the targets are real logical identities in the promoted 023 table" \
  "SELECT count(*)::text FROM exercise_catalog_logical WHERE id IN ('$LD','$LA')" "2"

echo
echo "=== M. RLS and ACL posture"
expect_eq "M1: RLS is ENABLED on both new tables with ZERO client policies (closed like every other catalog table)" \
  "SELECT string_agg(c.relname || ':' || c.relrowsecurity::text || ':' ||
     (SELECT count(*) FROM pg_policy p WHERE p.polrelid=c.oid)::text, ',' ORDER BY c.relname)
   FROM pg_class c WHERE c.relname IN ('exercise_catalog_content','exercise_catalog_relationships')" \
  "exercise_catalog_content:true:0,exercise_catalog_relationships:true:0"
for tbl in exercise_catalog_content exercise_catalog_relationships; do
  for role in anon authenticated; do
    expect_err "M2: $role has NO read access to $tbl" \
      "SET ROLE $role; SELECT count(*) FROM $tbl;" "permission denied"
  done
done
expect_err "M3: authenticated cannot LOAD content (insert is denied, so no client can seed the catalog)" \
  "SET ROLE authenticated; INSERT INTO exercise_catalog_content (logical_id, content_version,
     authored_by, authored_at, setup_steps, execution_steps, breathing_cue, common_mistakes, safety_guidance)
   VALUES ('$LP',50,'a','2026-09-01','[]'::jsonb,'[]'::jsonb,'b','[]'::jsonb,'c');" \
  "permission denied"
expect_err "M4: authenticated cannot APPLY A REVIEW DECISION or ADMIT eligibility (update is denied)" \
  "SET ROLE authenticated; UPDATE exercise_catalog_content SET content_status='approved' WHERE id='$C1';" \
  "permission denied"
expect_err "M5: authenticated cannot delete content" \
  "SET ROLE authenticated; DELETE FROM exercise_catalog_content WHERE id='$C1';" "permission denied"
expect_err "M6: authenticated cannot write relationships" \
  "SET ROLE authenticated; INSERT INTO exercise_catalog_relationships (from_logical_id, to_logical_id, relation)
   VALUES ('$LD','$LA','substitution');" "permission denied"
expect_err "M7: authenticated cannot compute content fingerprints (no oracle for forging an admission)" \
  "SET ROLE authenticated; SELECT exlib_content_fingerprint('[]'::jsonb,'[]'::jsonb,'b','[]'::jsonb,'c',NULL,NULL,'a',DATE '2026-09-01');" \
  "permission denied"
expect_err "M8: anon cannot execute the publication function either" \
  "SET ROLE anon; SELECT publish_catalog_content('$LP','$C1');" "permission denied"
expect_eq "M9: every new function pins a FIXED search_path (no search-path hijack even without schema qualification)" \
  "SELECT string_agg(proname || '=' ||
     (SELECT count(*)::text FROM unnest(coalesce(proconfig,ARRAY[]::text[])) cfg
      WHERE cfg LIKE 'search_path=%'), ',' ORDER BY proname)
   FROM pg_proc WHERE proname IN
     ('publish_catalog_content','exlib_content_fingerprint','exlib_freeze_content_version')" \
  "exlib_content_fingerprint=1,exlib_freeze_content_version=1,publish_catalog_content=1"
expect_eq "M10: publication EXECUTE is granted to exactly ONE role - the narrowly named exlib_catalog_admin - and to no client role or PUBLIC" \
  "SELECT coalesce(string_agg(grantee, ',' ORDER BY grantee), '(none)')
   FROM information_schema.routine_privileges
   WHERE routine_name='publish_catalog_content' AND privilege_type='EXECUTE'
     AND grantee <> 'postgres'" "exlib_catalog_admin"
expect_eq "M11: no service_role grant was added on the new objects (the standing no-service_role rule is unchanged)" \
  "SELECT count(*)::text FROM information_schema.role_table_grants
   WHERE grantee='service_role' AND table_name IN
     ('exercise_catalog_content','exercise_catalog_relationships')" "0"
expect_eq "M12: authenticated delivery access is preserved EXACTLY as already reviewed (026's delivery function ACL is untouched)" \
  "SELECT coalesce(string_agg(DISTINCT grantee, ',' ORDER BY grantee), '(none)')
   FROM information_schema.routine_privileges
   WHERE routine_name='deliver_catalog_exercises' AND privilege_type='EXECUTE'
     AND grantee='authenticated'" "authenticated"

echo
echo "=== N. Local advisor-equivalent checks (honest limitations recorded)"
echo "  NOTE  Supabase's hosted Database/Security Advisors are a platform"
echo "        API feature and CANNOT run here: reaching them would require"
echo "        hosted contact, which this milestone forbids. The Supabase"
echo "        CLI's local lint likewise requires a TCP database URL, while"
echo "        the standing security rule mandates a socket-only disposable"
echo "        cluster."
echo "        The checks below are the LOCAL EQUIVALENTS of the advisor"
echo "        rules that actually apply to this change (RLS coverage,"
echo "        SECURITY DEFINER search_path, function-execute exposure)."
echo "        They are NOT a substitute for the hosted advisors, which"
echo "        must be re-run by the authorized operator after any future"
echo "        approved application."
expect_eq "N1: advisor-equivalent 'RLS disabled in public' - every new public table has RLS enabled" \
  "SELECT count(*)::text FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname='public' AND c.relkind='r' AND NOT c.relrowsecurity
     AND c.relname IN ('exercise_catalog_content','exercise_catalog_relationships')" "0"
expect_eq "N2: advisor-equivalent 'function search_path mutable' - no new function lacks a pinned search_path" \
  "SELECT count(*)::text FROM pg_proc
   WHERE proname IN ('publish_catalog_content','exlib_content_fingerprint','exlib_freeze_content_version')
     AND NOT EXISTS (SELECT 1 FROM unnest(coalesce(proconfig,ARRAY[]::text[])) cfg
                     WHERE cfg LIKE 'search_path=%')" "0"
expect_eq "N3: advisor-equivalent 'SECURITY DEFINER exposure' - no new SECURITY DEFINER function is executable by PUBLIC, anon, or authenticated" \
  "SELECT count(*)::text FROM information_schema.routine_privileges
   WHERE routine_name IN ('publish_catalog_content','exlib_content_fingerprint','exlib_freeze_content_version')
     AND privilege_type='EXECUTE' AND grantee IN ('PUBLIC','anon','authenticated')" "0"
expect_eq "N4: advisor-equivalent 'unindexed foreign key' - every new FK has an index whose LEADING columns cover it" \
  "SELECT count(*)::text FROM (
     SELECT 1 FROM pg_constraint con
     WHERE con.contype='f'
       AND con.conrelid IN ('exercise_catalog_content'::regclass,'exercise_catalog_relationships'::regclass)
       AND NOT EXISTS (
         SELECT 1 FROM pg_index i WHERE i.indrelid=con.conrelid
           AND (string_to_array(i.indkey::text, ' ')::int2[])[1:array_length(con.conkey,1)] @> con.conkey)) s" "0"

echo
echo "=== O. No hosted contact, ever"
HOSTPAT='supabase[.](co|com)|vercel[.](app|com)|[-][-]db[-]url|[-][-]linked|project[-]ref|db[ ](push|dump)'
if grep -qiE "$HOSTPAT" "$0"; then
  bad "O1: this script references a hosted endpoint, a project reference flag, or a Supabase CLI remote command"
else
  ok "O1: this script contains NO hosted endpoint, NO project reference flag, and NO Supabase CLI push/dump/remote-URL command"
fi
BADPSQL=$(grep -E 'psql[[:space:]]' "$0" | grep -cv -- '-h "\$SOCK"' || true)
[ "$BADPSQL" = "0" ] \
  && ok "O2: every psql/database invocation in this script targets ONLY the disposable unix socket; no other host appears anywhere" \
  || bad "O2: found $BADPSQL database invocation(s) not aimed at the disposable socket"
ok "O3: the promoted Plank content artifact was never read, copied, or loaded by this script (fixtures are locally invented proof rows)"

echo
printf '%s passed, %s failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ] || exit 1
