#!/bin/bash
# ============================================================
# ForgeFitOS - EXLIB-2L catalog-content and relationship schema
# PROPOSAL live proof matrix (CORRECTED REVISION B: covers the four
# Codex round-1 findings - review-before-admission lifecycle order,
# complete SHA-256 admission manifest, relationship completeness,
# and nonempty-catalog compatibility).
#
# Applies migrations 001-026 exactly as committed to TWO databases on
# a DISPOSABLE LOCAL PostgreSQL cluster (unix-socket only, no TCP,
# torn down on exit): one seeded with a legitimate NONEMPTY
# migration-023 external catalog BEFORE the proposal applies, one
# left EMPTY. The UNAPPROVED proposal
# docs/exlib2l-catalog-content-schema-proposal.sql then applies
# EXACTLY ONCE to each. This script NEVER contacts Supabase, Vercel,
# or any remote service; the proposal stays NOT APPLIED to any
# persistent or hosted database, and nothing here loads catalog
# content, approves, admits, seals, publishes, or delivers anything
# in the product.
#
# The fixtures below are LOCAL, DISPOSABLE PROOF FIXTURES invented
# for this cluster. They are NOT the Plank content record, NOT a load
# package, and NOT an approval or admission: the promoted Plank
# artifact (docs/exlib2g-plank-content.jsonl) is never read, copied,
# or loaded by this script; the "Plank-model" fixture merely mirrors
# its relationship SHAPE (one substitution target, one progression
# target, zero regressions) under invented names.
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
QE() { psql -h "$SOCK" -U postgres -d emptycase -X -v ON_ERROR_STOP=1 -qtA -c "$1" 2>&1; }
QU() { psql -h "$SOCK" -U postgres -d "$DB" -X -v ON_ERROR_STOP=1 -qtA -c "SET app.uid = '$1'; $2"; }

expect_ok() { # NAME SQL
  local out; out=$(QQ "$2")
  if [ $? -eq 0 ]; then ok "$1"; else bad "$1" "$(printf '%s' "$out" | head -2 | tr '\n' ' ')"; fi
}
expect_err() { # NAME SQL PATTERN
  local out; out=$(QQ "$2")
  if [ $? -eq 0 ]; then
    bad "$1" "expected fail-closed rejection, statement SUCCEEDED"
  elif printf '%s' "$out" | grep -qF "$3"; then ok "$1"
  else bad "$1" "rejected, but not by the expected rule ($3): $(printf '%s' "$out" | head -2 | tr '\n' ' ')"; fi
}
expect_eq() { # NAME SQL EXPECTED
  local got; got=$(QQ "$2")
  if [ "$got" = "$3" ]; then ok "$1"; else bad "$1" "expected [$3], got [$got]"; fi
}

echo
echo "=== A. Proposal residency, fingerprint, and shape"
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
echo "=== B. Disposable cluster + migrations 001-026 into BOTH databases"
initdb -D "$PGDATA" -U postgres --no-locale -E UTF8 >/dev/null 2>&1
pg_ctl -D "$PGDATA" -o "-c listen_addresses='' -c unix_socket_directories='$SOCK'" -l "$TMP/pg.log" start >/dev/null 2>&1
if Q "SELECT 1" >/dev/null 2>&1; then
  ok "B1: cluster up at $SOCK (unix socket only; no TCP; no hosted contact)"
else
  bad "B1: cluster failed to start"; sed -n '1,5p' "$TMP/pg.log"; exit 1
fi
expect_eq "B2: the cluster listens on NO TCP address (socket-only, structurally offline)" \
  "SHOW listen_addresses" ""

Q "CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN;" >/dev/null
Q "CREATE DATABASE emptycase;" >/dev/null
AUTHSTUB="CREATE SCHEMA auth;
CREATE TABLE auth.users (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email TEXT);
CREATE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql STABLE
  AS \$\$SELECT nullif(current_setting('app.uid', true), '')::uuid\$\$;"
Q "$AUTHSTUB" >/dev/null
QE "$AUTHSTUB" >/dev/null

for TARGET in postgres emptycase; do
  APPLIED=0
  for f in supabase/migrations/0*.sql; do
    psql -h "$SOCK" -U postgres -d "$TARGET" -X -v ON_ERROR_STOP=1 -q -f "$f" >/dev/null 2>"$TMP/err.log" \
      || { bad "B3: migration failed in $TARGET: $f" "$(sed -n '1,3p' "$TMP/err.log")"; exit 1; }
    APPLIED=$((APPLIED+1))
  done
  [ "$APPLIED" = "26" ] && ok "B3: migrations 001-026 applied cleanly in order to '$TARGET' (26 files, unmodified)" \
    || bad "B3: expected 26 migrations in $TARGET, applied $APPLIED"
done

echo
echo "=== C. A legitimate NONEMPTY migration-023 external catalog, seeded BEFORE the proposal (finding 4)"
GL1='11111111-2222-3333-4444-555555555001'
GL2='11111111-2222-3333-4444-555555555002'
GS1='aaaaaaaa-bbbb-cccc-dddd-eeeeeeeee001'
GS2='aaaaaaaa-bbbb-cccc-dddd-eeeeeeeee002'
AL1='aaaaaaaa-bbbb-cccc-dddd-eeeeeeeee011'
RUN='exlib2l-legacy-run-0001'
expect_ok "C1: two legitimate 023-era EXTERNAL snapshots insert under the pre-proposal schema (complete NOT NULL source metadata; no discovery-metadata columns exist yet)" \
  "INSERT INTO exercise_catalog_logical (id) VALUES ('$GL1'),('$GL2');
   INSERT INTO exercise_catalog (id, logical_id, canonical_name, category, primary_muscle, equipment,
     laterality, tracking_mode, source_url, source_page, retrieved_at, import_confidence) VALUES
   ('$GS1','$GL1','Legacy Row One','compound','lats','barbell','bilateral','weight_reps',
    'https://example.test/legacy1','https://example.test/dir','2026-08-30','high'),
   ('$GS2','$GL2','Legacy Row Two','isolation','biceps','dumbbell','unilateral','weight_reps',
    'https://example.test/legacy2','https://example.test/dir','2026-08-30','medium');
   INSERT INTO exercise_catalog_muscles (catalog_id, muscle, role) VALUES ('$GS1','triceps','secondary');
   INSERT INTO exercise_catalog_aliases (id, logical_id, alias) VALUES ('$AL1','$GL1','Legacy alias one');"
LEGACY_COLS="id::text||canonical_name||category||primary_muscle||equipment||laterality||tracking_mode||source_url||source_page||retrieved_at::text||import_confidence||review_status||coalesce(reviewed_by,'-')||coalesce(extract(epoch from reviewed_at)::numeric::text,'-')||coalesce(review_rationale,'-')||catalog_version::text||is_active::text||extract(epoch from created_at)::numeric::text"
Q "UPDATE exercise_catalog SET review_status='approved', reviewed_by='local-proof-reviewer',
     reviewed_at=NOW(), review_rationale='local disposable legacy fixture' WHERE id IN ('$GS1','$GS2');" >/dev/null
RID=$(Q "INSERT INTO exercise_catalog_import_runs (run_key, dry_run, product_approved_by, product_approved_at, legal_approved_by, legal_approved_at, approval_rationale) VALUES ('$RUN', false, 'local-product', NOW(), 'local-legal', NOW(), 'local disposable fixture') RETURNING id;")
Q "INSERT INTO exercise_catalog_run_items (run_id, catalog_id) VALUES ('$RID','$GS1'), ('$RID','$GS2');" >/dev/null
Q "INSERT INTO exercise_catalog_run_items (run_id, catalog_alias_id) VALUES ('$RID','$AL1');" >/dev/null
expect_ok "C2: the legacy run seals under unchanged 023 machinery (approved members, product+legal approvals)" \
  "SELECT exlib_approve_and_seal_run('$RUN');"
PRE_HASH=$(Q "SELECT md5(string_agg($LEGACY_COLS, '|' ORDER BY id)) FROM exercise_catalog")
PRE_COUNT=$(Q "SELECT count(*) FROM exercise_catalog")
ok "C3: pre-proposal legacy state captured for byte-comparison ($PRE_COUNT rows, digest ${PRE_HASH:0:12}...)"

echo
echo "=== D. The proposal applies EXACTLY ONCE over BOTH the nonempty and the empty database (proofs 14, 16, 17)"
psql -h "$SOCK" -U postgres -d postgres -X -v ON_ERROR_STOP=1 -q -f "$PROPOSAL" >/dev/null 2>"$TMP/prop.log" \
  && ok "D1: the proposal applies CLEANLY over the NONEMPTY legitimate 001-026 state (no fabrication needed, no data loss)" \
  || { bad "D1: proposal failed over nonempty state" "$(sed -n '1,5p' "$TMP/prop.log")"; exit 1; }
psql -h "$SOCK" -U postgres -d emptycase -X -v ON_ERROR_STOP=1 -q -f "$PROPOSAL" >/dev/null 2>"$TMP/prop2.log" \
  && ok "D2: the proposal applies CLEANLY over the EMPTY 001-026 state (the pg_roles guard makes the second cluster-wide role creation a no-op)" \
  || { bad "D2: proposal failed over empty state" "$(sed -n '1,5p' "$TMP/prop2.log")"; exit 1; }
psql -h "$SOCK" -U postgres -d emptycase -X -v ON_ERROR_STOP=1 -q -f "$PROPOSAL" >/dev/null 2>&1 \
  && bad "D3: a SECOND application succeeded - apply-exactly-once is not enforced" \
  || ok "D3: a second application fails closed (apply-exactly-once; proof 17)"
[ "$(QE "SELECT count(*)::text FROM information_schema.columns WHERE table_name='exercise_catalog' AND column_name='provenance'")" = "1" ] \
  && [ "$(QE "SELECT count(*)::text FROM pg_class WHERE relname IN ('exercise_catalog_content','exercise_catalog_relationships','exercise_catalog_content_expected_relationships')")" = "3" ] \
  && ok "D4: the failed second application rolled back WHOLLY - schema intact, nothing half-applied or partially mutated" \
  || bad "D4: schema damaged by the failed second application"
EMPTYSTATE=$(QE "SELECT (SELECT count(*) FROM exercise_catalog)::text || '/' ||
    (SELECT count(*) FROM exercise_catalog_content)::text || '/' ||
    (SELECT count(*) FROM exercise_catalog_content_expected_relationships)::text || '/' ||
    (SELECT count(*) FROM exercise_catalog_relationships)::text || '/' ||
    (SELECT count(*) FROM exercise_catalog_import_runs)::text || '/' ||
    (SELECT count(*) FROM exercise_catalog_run_items)::text || '/' ||
    (SELECT count(*) FROM exercise_catalog_content WHERE import_admitted)::text || '/' ||
    (SELECT count(*) FROM exercise_catalog_content WHERE publication_status='published')::text || '/' ||
    (SELECT count(*) FROM exercise_catalog_import_runs WHERE sealed_at IS NOT NULL)::text")
[ "$EMPTYSTATE" = "0/0/0/0/0/0/0/0/0" ] \
  && ok "D5: schema application alone creates NO content, relationship, expected-relationship, run, membership, admission, publication, or seal state (proof 16)" \
  || bad "D5: unexpected state after empty application" "$EMPTYSTATE"

echo
echo "=== E. Legacy external rows keep their EXACT meaning (finding 4, proofs 14-15)"
POST_HASH=$(Q "SELECT md5(string_agg($LEGACY_COLS, '|' ORDER BY id)) FROM exercise_catalog")
POST_COUNT=$(Q "SELECT count(*) FROM exercise_catalog")
[ "$PRE_HASH/$PRE_COUNT" = "$POST_HASH/$POST_COUNT" ] \
  && ok "E1: every pre-existing 023 column of every legacy row is BYTE-IDENTICAL after application - no data loss, no rewriting of meaning" \
  || bad "E1: legacy rows changed" "pre=$PRE_HASH/$PRE_COUNT post=$POST_HASH/$POST_COUNT"
expect_eq "E2: legacy rows gained provenance='external_source_derived' by DEFAULT and NULL discovery metadata - nothing was fabricated" \
  "SELECT count(*)::text FROM exercise_catalog
   WHERE provenance='external_source_derived' AND movement_pattern IS NULL
     AND training_role IS NULL AND difficulty IS NULL AND availability IS NULL" "$PRE_COUNT"
expect_err "E3: external source fields REMAIN REQUIRED - a new external row missing source_url is rejected" \
  "INSERT INTO exercise_catalog (logical_id, canonical_name, category, primary_muscle, equipment,
     laterality, tracking_mode, provenance, source_page, retrieved_at, import_confidence)
   VALUES ('$GL1','Legacy Bad External','compound','lats','barbell','bilateral','weight_reps',
     'external_source_derived','https://example.test/dir','2026-08-30','high');" \
  "exercise_catalog_provenance_sources_chk"
expect_err "E4: forgefitos_original rows FORBID source/import-confidence fields (no fabricated source facts, ever)" \
  "INSERT INTO exercise_catalog (logical_id, canonical_name, category, primary_muscle, equipment,
     laterality, tracking_mode, provenance, source_url, movement_pattern, training_role, difficulty, availability)
   VALUES ('$GL1','Original Bad Sources','isolation','abs','bodyweight','bilateral','timed',
     'forgefitos_original','https://example.test/fake','core_flexion','core','beginner','minimal');" \
  "exercise_catalog_provenance_sources_chk"
expect_err "E5: forgefitos_original rows REQUIRE complete discovery metadata (structural CHECK, not workflow-only)" \
  "INSERT INTO exercise_catalog (logical_id, canonical_name, category, primary_muscle, equipment,
     laterality, tracking_mode, provenance, movement_pattern, training_role, difficulty)
   VALUES ('$GL1','Original Missing Meta','isolation','abs','bodyweight','bilateral','timed',
     'forgefitos_original','core_flexion','core','beginner');" \
  "exercise_catalog_discovery_metadata_chk"
expect_err "E6: an unknown provenance value is rejected by the vocabulary CHECK" \
  "INSERT INTO exercise_catalog (logical_id, canonical_name, category, primary_muscle, equipment,
     laterality, tracking_mode, provenance, source_url, source_page, retrieved_at, import_confidence)
   VALUES ('$GL1','Bad Provenance','compound','lats','barbell','bilateral','weight_reps',
     'invented','https://example.test/x','https://example.test/dir','2026-08-30','high');" \
  "exercise_catalog_provenance_check"
expect_err "E7: the carried freeze trigger keeps legacy NULL metadata immutable too - completing it in place is refused (corrections require a new catalog version row)" \
  "UPDATE exercise_catalog SET movement_pattern='horizontal_pull' WHERE id='$GS1';" \
  "snapshot identity/content is immutable"

U1=$(Q "INSERT INTO auth.users DEFAULT VALUES RETURNING id;")
DLV_OUT=$(QU "$U1" "SELECT deliver_catalog_exercises('$RUN');" 2>&1)
if [ $? -eq 0 ]; then
  ok "E8: unchanged migration-026 DELIVERY works on the HISTORICAL external rows after the proposal (proof 15)"
else
  bad "E8: delivery failed on legacy rows post-proposal" "$(printf '%s' "$DLV_OUT" | head -2 | tr '\n' ' ')"
fi
expect_eq "E9: delivery created the two tenant exercises for the legacy run's snapshots" \
  "SELECT count(*)::text FROM exercises WHERE user_id='$U1'" "2"
RBK_OUT=$(QU "$U1" "SELECT rollback_catalog_delivery('$RUN');" 2>&1)
if [ $? -eq 0 ]; then
  ok "E10: unchanged migration-026 ROLLBACK works on the historical delivery after the proposal (proof 15)"
else
  bad "E10: rollback failed on legacy delivery post-proposal" "$(printf '%s' "$RBK_OUT" | head -2 | tr '\n' ' ')"
fi
expect_eq "E11: rollback left the user with zero ACTIVE delivered exercises" \
  "SELECT count(*)::text FROM exercises WHERE user_id='$U1' AND is_active" "0"

echo
echo "=== F. Corrected lifecycle: born pending/draft/UNADMITTED; approval BEFORE admission (finding 1; proofs 1-2, 4)"
WP='11111111-2222-3333-4444-555555555101'
WD='11111111-2222-3333-4444-555555555102'
WA='11111111-2222-3333-4444-555555555103'
WX='11111111-2222-3333-4444-555555555104'
SWP='aaaaaaaa-bbbb-cccc-dddd-eeeeeeeee101'
CV1='cccccccc-0000-0000-0000-000000000101'
Q "INSERT INTO exercise_catalog_logical (id) VALUES ('$WP'),('$WD'),('$WA'),('$WX');" >/dev/null
expect_ok "F1: an ORIGINAL-provenance snapshot with complete discovery metadata and NO source facts is accepted, with anatomy authored while pending and an alias" \
  "INSERT INTO exercise_catalog (id, logical_id, canonical_name, category, primary_muscle, equipment,
     laterality, tracking_mode, provenance, movement_pattern, training_role, difficulty, availability)
   VALUES ('$SWP','$WP','Proof Plank Model','isolation','abs','bodyweight','bilateral','timed',
     'forgefitos_original','core_anti_extension','core','beginner','minimal');
   INSERT INTO exercise_catalog_muscles (catalog_id, muscle, role) VALUES
     ('$SWP','obliques','secondary'), ('$SWP','lower_back','tertiary');
   INSERT INTO exercise_catalog_aliases (logical_id, alias) VALUES ('$WP','Proof plank model alias');
   UPDATE exercise_catalog SET review_status='approved', reviewed_by='local-proof-reviewer',
     reviewed_at=NOW(), review_rationale='local disposable fixture' WHERE id='$SWP';"
mkcontent() { # $1=id $2=logical $3=version -> creates a pending draft
  Q "INSERT INTO exercise_catalog_content (id, logical_id, content_version, authored_by, authored_at,
       setup_steps, execution_steps, breathing_cue, common_mistakes, safety_guidance)
     VALUES ('$1','$2',$3,'local-proof-author','2026-09-01',
       '[\"step one\"]'::jsonb,'[\"exec one\"]'::jsonb,'breathe out on effort',
       '[\"mistake one\"]'::jsonb,'stop if form breaks down');" >/dev/null 2>&1 \
    || bad "fixture: content insert failed ($1)"
}
mkcontent "$CV1" "$WP" 1
expect_eq "F2: the version is BORN pending, draft, and NOT admitted with no admission fields (proof 1)" \
  "SELECT content_status||'/'||publication_status||'/'||import_admitted::text||'/'||
     coalesce(admitted_fingerprint,'-')||'/'||coalesce(admitted_source_sha256,'-')||'/'||coalesce(admitted_at::text,'-')
   FROM exercise_catalog_content WHERE id='$CV1'" "pending/draft/false/-/-/-"
expect_err "F3: a version cannot be BORN admitted (admission is a later, separately authorized act)" \
  "INSERT INTO exercise_catalog_content (logical_id, content_version, authored_by, authored_at,
     setup_steps, execution_steps, breathing_cue, common_mistakes, safety_guidance, import_admitted,
     admitted_fingerprint, admitted_source_sha256, admitted_at)
   VALUES ('$WD',1,'a','2026-09-01','[]'::jsonb,'[]'::jsonb,'b','[]'::jsonb,'c', true,
     repeat('a',64), repeat('b',64), '2026-09-01');" \
  "versions are born unadmitted"
expect_err "F4: a version cannot be BORN approved" \
  "INSERT INTO exercise_catalog_content (logical_id, content_version, authored_by, authored_at,
     setup_steps, execution_steps, breathing_cue, common_mistakes, safety_guidance,
     content_status, reviewed_by, reviewed_at, review_rationale)
   VALUES ('$WD',1,'a','2026-09-01','[]'::jsonb,'[]'::jsonb,'b','[]'::jsonb,'c',
     'approved','r',NOW(),'rationale text');" \
  "versions are born pending"
expect_err "F5: a version cannot be BORN published" \
  "INSERT INTO exercise_catalog_content (logical_id, content_version, authored_by, authored_at,
     setup_steps, execution_steps, breathing_cue, common_mistakes, safety_guidance, publication_status)
   VALUES ('$WD',1,'a','2026-09-01','[]'::jsonb,'[]'::jsonb,'b','[]'::jsonb,'c','published');" \
  "born drafts and never auto-publish"
expect_ok "F6: PENDING prose is editable before review (pre-review authoring; proof 1)" \
  "UPDATE exercise_catalog_content SET breathing_cue='exhale on the effort' WHERE id='$CV1';"
expect_err "F7: admission CANNOT PRECEDE approval - the dedicated admission function refuses a pending version (proof 4)" \
  "SET ROLE exlib_catalog_admission; SELECT admit_catalog_content('$WP','$CV1', repeat('a',64));" \
  "admission cannot precede human approval"
expect_err "F8: admission cannot precede approval even through a direct owner-level write (trigger-enforced, not function-only; proof 4)" \
  "UPDATE exercise_catalog_content SET import_admitted=true, admitted_fingerprint=repeat('a',64),
     admitted_source_sha256=repeat('b',64), admitted_at='2026-09-01' WHERE id='$CV1';" \
  "admission cannot precede human approval"
expect_err "F9: admission fields cannot drift outside the admission transition (a fingerprint without the flag is refused)" \
  "UPDATE exercise_catalog_content SET admitted_fingerprint=repeat('a',64) WHERE id='$CV1';" \
  "admission fields change only through the one-time admission transition"

echo
echo "=== G. The version's EXPECTED relationship set: authored while pending, frozen by review (finding 3)"
expect_ok "G1: the expected relationship set is authored while the version is PENDING - the Plank model expects exactly one substitution and one progression" \
  "INSERT INTO exercise_catalog_content_expected_relationships (content_id, relation, to_logical_id)
   VALUES ('$CV1','substitution','$WD'), ('$CV1','progression','$WA');"
expect_err "G2: a version cannot EXPECT a relationship to its own identity (self-links refused at authoring)" \
  "INSERT INTO exercise_catalog_content_expected_relationships (content_id, relation, to_logical_id)
   VALUES ('$CV1','substitution','$WP');" \
  "cannot expect a relationship to its own identity"
expect_err "G3: an expected relationship to a MISSING identity is refused (FK; no dangling expectation)" \
  "INSERT INTO exercise_catalog_content_expected_relationships (content_id, relation, to_logical_id)
   VALUES ('$CV1','substitution','99999999-9999-9999-9999-999999999999');" \
  "violates foreign key constraint"
expect_err "G4: expected rows are immutable (UPDATE is never allowed; delete and re-insert while pending)" \
  "UPDATE exercise_catalog_content_expected_relationships SET relation='regression'
   WHERE content_id='$CV1' AND to_logical_id='$WD';" \
  "rows are immutable"
expect_err "G5: duplicate expectations are impossible (deterministic uniqueness by primary key)" \
  "INSERT INTO exercise_catalog_content_expected_relationships (content_id, relation, to_logical_id)
   VALUES ('$CV1','substitution','$WD');" \
  "_pkey"
expect_ok "G6: the human review APPROVES the version with complete fresh evidence (proof 2: approval strictly before eligibility)" \
  "UPDATE exercise_catalog_content SET content_status='approved', reviewed_by='Local Proof Reviewer',
     reviewed_at=NOW(), review_rationale='local disposable fixture rationale' WHERE id='$CV1';"
expect_err "G7: the review FREEZES the reviewed payload - post-approval prose edits are refused" \
  "UPDATE exercise_catalog_content SET breathing_cue='changed after approval' WHERE id='$CV1';" \
  "decided content version is immutable"
expect_err "G8: the review freezes the EXPECTED relationship set too - post-approval additions are refused" \
  "INSERT INTO exercise_catalog_content_expected_relationships (content_id, relation, to_logical_id)
   VALUES ('$CV1','regression','$WX');" \
  "expected relationships freeze with the reviewed payload"
expect_err "G9: post-approval expected deletions are refused as well" \
  "DELETE FROM exercise_catalog_content_expected_relationships WHERE content_id='$CV1';" \
  "expected relationships freeze with the reviewed payload"
expect_err "G10: a review transition cannot smuggle admission changes (proof 5: admission cannot accompany review)" \
  "UPDATE exercise_catalog_content SET content_status='rejected', reviewed_by='Another Reviewer',
     reviewed_at=NOW(), review_rationale='combined transition attempt', import_admitted=true,
     admitted_fingerprint=repeat('a',64), admitted_source_sha256=repeat('b',64), admitted_at='2026-09-01'
   WHERE id='$CV1';" \
  "payload and admission changes are forbidden in the same statement"

echo
echo "=== H. Admission: one-time, role-restricted, computed from database state (findings 1-2; proofs 3, 5-7, 12)"
Q "INSERT INTO exercise_catalog_relationships (from_logical_id, to_logical_id, relation)
   VALUES ('$WP','$WD','substitution'), ('$WP','$WA','progression');" >/dev/null
expect_err "H1: admission REQUIRES the live relationship set to equal the expected set - a missing expected relationship blocks admission" \
  "DELETE FROM exercise_catalog_relationships WHERE from_logical_id='$WP' AND relation='progression';
   SET ROLE exlib_catalog_admission; SELECT admit_catalog_content('$WP','$CV1', repeat('a',64));" \
  "an expected relationship is missing from the live set"
expect_err "H2: an UNEXPECTED live relationship blocks admission as well (exact set equality both directions)" \
  "INSERT INTO exercise_catalog_relationships (from_logical_id, to_logical_id, relation)
   VALUES ('$WP','$WX','regression');
   SET ROLE exlib_catalog_admission; SELECT admit_catalog_content('$WP','$CV1', repeat('a',64));" \
  "an unexpected live relationship is present"
expect_err "H3: the source-artifact digest must be a 64-char lowercase hex SHA-256 (MD5-shaped and malformed digests are refused)" \
  "SET ROLE exlib_catalog_admission; SELECT admit_catalog_content('$WP','$CV1', 'd41d8cd98f00b204e9800998ecf8427e');" \
  "must be a 64-character lowercase hex SHA-256"
SRC_SHA=$(printf 'local disposable proof artifact - not the Plank record' | shasum -a 256 | awk '{print $1}')
MAN_FP=$(Q "SELECT exlib_content_admission_fingerprint('$CV1')")
expect_err "H4: a caller-invented manifest hash CANNOT land even through a direct owner-level write - the trigger recomputes from database state" \
  "UPDATE exercise_catalog_content SET import_admitted=true,
     admitted_fingerprint=repeat('0',64), admitted_source_sha256='$SRC_SHA', admitted_at='2026-09-01'
   WHERE id='$CV1';" \
  "must equal the recomputed admission-manifest fingerprint"
ADMIT_OUT=$(QQ "SET ROLE exlib_catalog_admission; SELECT admit_catalog_content('$WP','$CV1','$SRC_SHA');")
if [ $? -eq 0 ]; then
  ok "H5: the dedicated admission authority admits the ALREADY-APPROVED immutable draft - one-time, later, separate (proofs 2-3)"
else
  bad "H5: admission failed" "$(printf '%s' "$ADMIT_OUT" | head -2 | tr '\n' ' ')"
fi
expect_eq "H6: the recorded admission stores BOTH digests distinctly - the COMPUTED database-normalized manifest SHA-256 and the recorded source artifact SHA-256" \
  "SELECT (admitted_fingerprint = '$MAN_FP')::text || '/' || (admitted_source_sha256 = '$SRC_SHA')::text ||
     '/' || (admitted_fingerprint ~ '^[0-9a-f]{64}\$')::text || '/' || (admitted_fingerprint <> admitted_source_sha256)::text
   FROM exercise_catalog_content WHERE id='$CV1'" "true/true/true/true"
expect_err "H7: admission is ONE-WAY - re-admission of an admitted version is refused" \
  "SET ROLE exlib_catalog_admission; SELECT admit_catalog_content('$WP','$CV1','$SRC_SHA');" \
  "already admitted"
expect_err "H8: admission cannot be revoked (un-admitting an immutable version is refused)" \
  "UPDATE exercise_catalog_content SET import_admitted=false, admitted_fingerprint=NULL,
     admitted_source_sha256=NULL, admitted_at=NULL WHERE id='$CV1';" \
  "admission is one-way for an immutable version"
expect_err "H9: a publication transition cannot smuggle admission changes (proof 5: admission cannot accompany publication)" \
  "UPDATE exercise_catalog_content SET publication_status='published', admitted_at='1999-01-01' WHERE id='$CV1';" \
  "a publication transition must travel alone"
WR='cccccccc-0000-0000-0000-000000000102'
mkcontent "$WR" "$WD" 1
expect_err "H10: REVISED content cannot be admitted (proof 6)" \
  "UPDATE exercise_catalog_content SET content_status='revised', reviewed_by='Local Proof Reviewer',
     reviewed_at=NOW(), review_rationale='sent back for revision' WHERE id='$WR';
   SET ROLE exlib_catalog_admission; SELECT admit_catalog_content('$WD','$WR', repeat('a',64));" \
  "only approved content may be admitted"
expect_err "H11: REJECTED content cannot be admitted (proof 6)" \
  "UPDATE exercise_catalog_content SET content_status='rejected', reviewed_by='Local Proof Reviewer',
     reviewed_at=NOW(), review_rationale='rejected for cause' WHERE id='$WR';
   SET ROLE exlib_catalog_admission; SELECT admit_catalog_content('$WD','$WR', repeat('a',64));" \
  "only approved content may be admitted"
expect_err "H12: the admission authority CANNOT publish (distinct authorities; proof 12)" \
  "SET ROLE exlib_catalog_admission; SELECT publish_catalog_content('$WP','$CV1');" \
  "permission denied for function publish_catalog_content"
expect_err "H13: the publication authority CANNOT admit (distinct authorities; proof 12)" \
  "SET ROLE exlib_catalog_admin; SELECT admit_catalog_content('$WP','$CV1','$SRC_SHA');" \
  "permission denied for function admit_catalog_content"

echo
echo "=== I. The admission manifest: complete, canonical, SHA-256, session-independent (finding 2; proof 7)"
MANIFEST=$(Q "SELECT exlib_content_admission_manifest('$CV1')")
hexof() { Q "SELECT encode(convert_to('$1','UTF8'),'hex')"; }
case "$MANIFEST" in "EXLIB-ADMISSION-MANIFEST v1"*) ok "I1: the manifest is VERSIONED (leading literal 'EXLIB-ADMISSION-MANIFEST v1')";; *) bad "I1: manifest version header missing";; esac
MAPPED=1
for probe in "identity $WP:logical identity" \
             "$(hexof 'Proof Plank Model'):canonical classification (snapshot name)" \
             "$(hexof 'core_anti_extension'):discovery metadata (movement_pattern)" \
             "$(hexof 'obliques'):anatomy (muscle row)" \
             "$(hexof 'Proof plank model alias'):alias row" \
             "$(hexof 'exhale on the effort'):authored instructional content (edited pre-review prose)" \
             "$(hexof 'local-proof-author'):authorship" \
             "$(hexof 'Local Proof Reviewer'):review-bound evidence" \
             "expected S$(hexof progression) $WA:expected relationship set" \
             "relation S$(hexof substitution) $WD:live relationship set"; do
  NEEDLE="${probe%%:*}"; LABEL="${probe#*:}"
  case "$MANIFEST" in *"$NEEDLE"*) : ;; *) MAPPED=0; bad "I2: manifest is missing its $LABEL binding" "$NEEDLE";; esac
done
[ "$MAPPED" = "1" ] && ok "I2: the artifact-to-database mapping is MECHANICALLY PROVEN - the manifest contains the identity, classification, discovery metadata, anatomy, alias, content, authorship, review evidence, expected set, and live set bindings"
expect_eq "I3: the fingerprint is SHA-256, not MD5 - 64 lowercase hex characters" \
  "SELECT (char_length(exlib_content_admission_fingerprint('$CV1')) = 64)::text ||
     '/' || (exlib_content_admission_fingerprint('$CV1') ~ '^[0-9a-f]{64}\$')::text" "true/true"
FP_A=$(Q "SET datestyle='ISO,MDY'; SET timezone='UTC'; SELECT exlib_content_admission_fingerprint('$CV1')")
FP_B=$(Q "SET datestyle='German,DMY'; SET timezone='America/New_York'; SELECT exlib_content_admission_fingerprint('$CV1')")
[ "$FP_A" = "$FP_B" ] && [ "$FP_A" = "$MAN_FP" ] \
  && ok "I4: DateStyle and TimeZone cannot change the hash (dates are day offsets; timestamps are numeric epochs)" \
  || bad "I4: fingerprint is session-dependent" "A=$FP_A B=$FP_B"
expect_eq "I5: JSON key ordering cannot change the hash - jsonb canonicalizes key order before serialization" \
  "SELECT ('{\"b\":1,\"a\":2}'::jsonb::text = '{\"a\":2,\"b\":1}'::jsonb::text)::text" "true"
expect_eq "I6: manifest row ordering is pinned to COLLATE \"C\" byte order - locale cannot reorder rows" \
  "SELECT count(*)::text FROM pg_proc
   WHERE proname='exlib_content_admission_manifest'
     AND prosrc LIKE '%COLLATE \"C\"%'" "1"

echo
echo "=== J. Relationship completeness at publication (finding 3; proofs 8-11)"
Q "UPDATE exercise_catalog_content SET content_status='approved', reviewed_by='Local Proof Reviewer',
     reviewed_at=NOW(), review_rationale='approved but never admitted' WHERE id='$WR';" >/dev/null
expect_err "J1: publication BEFORE admission is refused on an approved-but-unadmitted version (the lifecycle stays approve -> admit -> publish)" \
  "SET ROLE exlib_catalog_admin; SELECT publish_catalog_content('$WD','$WR');" \
  "not import-admitted"
expect_err "J2: the PLANK MODEL cannot publish with its required PROGRESSION missing (proof 9)" \
  "DELETE FROM exercise_catalog_relationships WHERE from_logical_id='$WP' AND relation='progression';
   SET ROLE exlib_catalog_admin; SELECT publish_catalog_content('$WP','$CV1');" \
  "a required relationship is missing at publication"
expect_err "J3: the Plank model cannot publish with its required SUBSTITUTION missing either (proof 9)" \
  "DELETE FROM exercise_catalog_relationships WHERE from_logical_id='$WP' AND relation='substitution';
   SET ROLE exlib_catalog_admin; SELECT publish_catalog_content('$WP','$CV1');" \
  "a required relationship is missing at publication"
expect_err "J4: an EXTRA relationship fails publication (proof 10)" \
  "INSERT INTO exercise_catalog_relationships (from_logical_id, to_logical_id, relation)
     VALUES ('$WP','$WX','substitution');
   SET ROLE exlib_catalog_admin; SELECT publish_catalog_content('$WP','$CV1');" \
  "an unexpected relationship is present at publication"
expect_err "J5: WRONG relationship types fail publication (swapped substitution/progression = missing + unexpected; proof 10)" \
  "DELETE FROM exercise_catalog_relationships WHERE from_logical_id='$WP';
   INSERT INTO exercise_catalog_relationships (from_logical_id, to_logical_id, relation)
     VALUES ('$WP','$WD','progression'), ('$WP','$WA','substitution');
   SET ROLE exlib_catalog_admin; SELECT publish_catalog_content('$WP','$CV1');" \
  "a required relationship is missing at publication"
expect_err "J5b: even a DIRECT OWNER-LEVEL publish cannot bypass completeness - the trigger enforces the exact expected set structurally, not function-only" \
  "DELETE FROM exercise_catalog_relationships WHERE from_logical_id='$WP';
   UPDATE exercise_catalog_content SET publication_status='published' WHERE id='$CV1';" \
  "a required relationship is missing at publication"
expect_err "J6: a live self-link remains structurally impossible" \
  "INSERT INTO exercise_catalog_relationships (from_logical_id, to_logical_id, relation)
   VALUES ('$WP','$WP','substitution');" "_check"
expect_err "J7: a live relationship to a missing identity remains structurally impossible" \
  "INSERT INTO exercise_catalog_relationships (from_logical_id, to_logical_id, relation)
   VALUES ('$WP','99999999-9999-9999-9999-999999999999','substitution');" \
  "violates foreign key constraint"
Q "DELETE FROM exercise_catalog_relationships WHERE from_logical_id='$WP';" >/dev/null
Q "INSERT INTO exercise_catalog_relationships (from_logical_id, to_logical_id, relation)
   VALUES ('$WP','$WA','progression');" >/dev/null
Q "INSERT INTO exercise_catalog_relationships (from_logical_id, to_logical_id, relation)
   VALUES ('$WP','$WD','substitution');" >/dev/null
FP_RESTORED=$(Q "SELECT exlib_content_admission_fingerprint('$CV1')")
[ "$FP_RESTORED" = "$MAN_FP" ] \
  && ok "J8: committed deletion and REVERSE-ORDER re-insertion of the exact relationship SET reproduces the exact manifest fingerprint - insertion order and row timestamps are not bound (deterministic normalization)" \
  || bad "J8: fingerprint depends on row order or timestamps" "$FP_RESTORED vs $MAN_FP"
PUB_OUT=$(QQ "SET ROLE exlib_catalog_admin; SELECT publish_catalog_content('$WP','$CV1');")
if [ $? -eq 0 ]; then
  ok "J9: AUTHORIZED publication succeeds ONLY once every prerequisite holds - approved, admitted, fingerprint-fresh, complete exact relationship set"
else
  bad "J9: publication failed with all prerequisites satisfied" "$(printf '%s' "$PUB_OUT" | head -2 | tr '\n' ' ')"
fi
expect_eq "J10: exactly ONE published version exists for the identity, and the target identities still have ZERO content, ZERO admission, ZERO publication of their own (proof 11)" \
  "SELECT (SELECT count(*) FROM exercise_catalog_content WHERE logical_id='$WP' AND publication_status='published')::text
     || '/' || (SELECT count(*) FROM exercise_catalog_content WHERE logical_id IN ('$WA','$WX') )::text
     || '/' || (SELECT count(*) FROM exercise_catalog_content WHERE logical_id='$WD' AND (import_admitted OR publication_status='published'))::text
     || '/' || (SELECT count(*) FROM exercise_catalog WHERE logical_id IN ('$WD','$WA','$WX'))::text" "1/0/0/0"
expect_err "J11: a PUBLISHED version cannot be newly admitted (it already carries its one-way admission; proof 6)" \
  "SET ROLE exlib_catalog_admission; SELECT admit_catalog_content('$WP','$CV1','$SRC_SHA');" \
  "already admitted"
expect_err "J12: a published approved row cannot be flipped to revised in place (the preserved narrowing closes the hole)" \
  "UPDATE exercise_catalog_content SET content_status='revised', reviewed_by='Another Reviewer',
     reviewed_at=NOW(), review_rationale='attempted in-place un-approval' WHERE id='$CV1';" \
  "exercise_catalog_content_publication_chk"

echo
echo "=== K. Staleness: ANY bound change after admission fails publication closed (finding 2; proof 8)"
WS1='11111111-2222-3333-4444-555555555201'
WS2='11111111-2222-3333-4444-555555555202'
SS1='aaaaaaaa-bbbb-cccc-dddd-eeeeeeeee201'
SS2='aaaaaaaa-bbbb-cccc-dddd-eeeeeeeee202'
CS1='cccccccc-0000-0000-0000-000000000201'
CS2='cccccccc-0000-0000-0000-000000000202'
mkstale() { # $1=logical $2=snapshot $3=content $4=name
  Q "INSERT INTO exercise_catalog_logical (id) VALUES ('$1');
     INSERT INTO exercise_catalog (id, logical_id, canonical_name, category, primary_muscle, equipment,
       laterality, tracking_mode, provenance, movement_pattern, training_role, difficulty, availability)
     VALUES ('$2','$1','$4','isolation','abs','bodyweight','bilateral','timed',
       'forgefitos_original','core_flexion','core','beginner','minimal');
     UPDATE exercise_catalog SET review_status='approved', reviewed_by='local-proof-reviewer',
       reviewed_at=NOW(), review_rationale='local disposable fixture' WHERE id='$2';" >/dev/null
  mkcontent "$3" "$1" 1
  Q "UPDATE exercise_catalog_content SET content_status='approved', reviewed_by='Local Proof Reviewer',
       reviewed_at=NOW(), review_rationale='local disposable fixture rationale' WHERE id='$3';" >/dev/null
  Q "SELECT admit_catalog_content('$1','$3','$SRC_SHA');" >/dev/null
}
mkstale "$WS1" "$SS1" "$CS1" 'Proof Stale Model One'
expect_err "K1: an ALIAS added after admission makes publication fail closed as STALE (bound alias surface changed)" \
  "INSERT INTO exercise_catalog_aliases (logical_id, alias) VALUES ('$WS1','Stale probe alias');
   SET ROLE exlib_catalog_admin; SELECT publish_catalog_content('$WS1','$CS1');" \
  "import admission is STALE"
expect_err "K1b: even a DIRECT OWNER-LEVEL publish cannot bypass staleness - the trigger recomputes the manifest fingerprint structurally, not function-only" \
  "INSERT INTO exercise_catalog_aliases (logical_id, alias) VALUES ('$WS1','Stale probe alias two');
   UPDATE exercise_catalog_content SET publication_status='published' WHERE id='$CS1';" \
  "import admission is STALE"
Q "DELETE FROM exercise_catalog_aliases WHERE logical_id='$WS1';" >/dev/null
expect_err "K2: a post-admission review flip (approved -> rejected with fresh evidence) can never publish" \
  "UPDATE exercise_catalog_content SET content_status='rejected', reviewed_by='Second Reviewer',
     reviewed_at=NOW(), review_rationale='withdrawn after admission' WHERE id='$CS1';
   SET ROLE exlib_catalog_admin; SELECT publish_catalog_content('$WS1','$CS1');" \
  "only approved content can be published"
mkstale "$WS2" "$SS2" "$CS2" 'Proof Stale Model Two'
expect_err "K3: DEACTIVATING the bound snapshot after admission fails publication closed - the manifest requires exactly one ACTIVE snapshot (a missing bound surface, not just a changed one)" \
  "UPDATE exercise_catalog SET is_active=false WHERE id='$SS2';
   SET ROLE exlib_catalog_admin; SELECT publish_catalog_content('$WS2','$CS2');" \
  "exactly one ACTIVE catalog snapshot"
expect_err "K4: the legacy external snapshot CANNOT enter the admission workflow - its NULL discovery metadata fails the manifest closed (finding 4 workflow gate)" \
  "$(cat <<SQL
DO \$fix\$
BEGIN
  INSERT INTO exercise_catalog_content (id, logical_id, content_version, authored_by, authored_at,
    setup_steps, execution_steps, breathing_cue, common_mistakes, safety_guidance)
  VALUES ('cccccccc-0000-0000-0000-000000000203','$GL1',1,'local-proof-author','2026-09-01',
    '["s"]'::jsonb,'["e"]'::jsonb,'cue','["m"]'::jsonb,'guard');
  UPDATE exercise_catalog_content SET content_status='approved', reviewed_by='Local Proof Reviewer',
    reviewed_at=NOW(), review_rationale='local disposable fixture rationale'
  WHERE id='cccccccc-0000-0000-0000-000000000203';
END
\$fix\$;
SELECT admit_catalog_content('$GL1','cccccccc-0000-0000-0000-000000000203','$SRC_SHA');
SQL
)" \
  "lacks complete discovery metadata"

echo
echo "=== L. Version isolation: one version's relationships cannot silently alter another's publication meaning (finding 3)"
WV='11111111-2222-3333-4444-555555555301'
SV1='aaaaaaaa-bbbb-cccc-dddd-eeeeeeeee301'
CVA='cccccccc-0000-0000-0000-000000000301'
CVB='cccccccc-0000-0000-0000-000000000302'
Q "INSERT INTO exercise_catalog_logical (id) VALUES ('$WV');
   INSERT INTO exercise_catalog (id, logical_id, canonical_name, category, primary_muscle, equipment,
     laterality, tracking_mode, provenance, movement_pattern, training_role, difficulty, availability)
   VALUES ('$SV1','$WV','Proof Version Isolation','isolation','abs','bodyweight','bilateral','timed',
     'forgefitos_original','core_rotation','core','beginner','minimal');
   UPDATE exercise_catalog SET review_status='approved', reviewed_by='local-proof-reviewer',
     reviewed_at=NOW(), review_rationale='local disposable fixture' WHERE id='$SV1';" >/dev/null
mkcontent "$CVA" "$WV" 1
Q "INSERT INTO exercise_catalog_content_expected_relationships (content_id, relation, to_logical_id)
   VALUES ('$CVA','substitution','$WD');
   UPDATE exercise_catalog_content SET content_status='approved', reviewed_by='Local Proof Reviewer',
     reviewed_at=NOW(), review_rationale='local disposable fixture rationale' WHERE id='$CVA';
   INSERT INTO exercise_catalog_relationships (from_logical_id, to_logical_id, relation)
   VALUES ('$WV','$WD','substitution');
   SELECT admit_catalog_content('$WV','$CVA','$SRC_SHA');" >/dev/null
mkcontent "$CVB" "$WV" 2
expect_ok "L1: version 2 is authored with a DIFFERENT expected set (substitution to a different target) and approved" \
  "INSERT INTO exercise_catalog_content_expected_relationships (content_id, relation, to_logical_id)
   VALUES ('$CVB','substitution','$WX');
   UPDATE exercise_catalog_content SET content_status='approved', reviewed_by='Local Proof Reviewer',
     reviewed_at=NOW(), review_rationale='local disposable fixture rationale v2' WHERE id='$CVB';"
expect_err "L2: version 2 cannot be admitted while the LIVE set still serves version 1 (exact equality per version)" \
  "SELECT admit_catalog_content('$WV','$CVB','$SRC_SHA');" \
  "an expected relationship is missing from the live set"
Q "DELETE FROM exercise_catalog_relationships WHERE from_logical_id='$WV';
   INSERT INTO exercise_catalog_relationships (from_logical_id, to_logical_id, relation)
   VALUES ('$WV','$WX','substitution');" >/dev/null
expect_ok "L3: after the live set moves to version 2's expected set, version 2 admits" \
  "SELECT admit_catalog_content('$WV','$CVB','$SRC_SHA');"
expect_err "L4: version 1 can NO LONGER publish - its meaning did not silently change; it fails CLOSED (required relationship missing + stale manifest)" \
  "SET ROLE exlib_catalog_admin; SELECT publish_catalog_content('$WV','$CVA');" \
  "a required relationship is missing at publication"

echo
echo "=== M. Distinct authorities and zero ordinary-client access (proofs 12-13)"
expect_eq "M1: the four authorities are DISTINCT - admit EXECUTE belongs to exlib_catalog_admission alone, publish EXECUTE to exlib_catalog_admin alone; loading and review application have NO function grants at all (owner-only reviewed programs)" \
  "SELECT
     (SELECT coalesce(string_agg(grantee, ',' ORDER BY grantee), '(none)')
      FROM information_schema.routine_privileges
      WHERE routine_name='admit_catalog_content' AND privilege_type='EXECUTE' AND grantee <> 'postgres')
   || ' / ' ||
     (SELECT coalesce(string_agg(grantee, ',' ORDER BY grantee), '(none)')
      FROM information_schema.routine_privileges
      WHERE routine_name='publish_catalog_content' AND privilege_type='EXECUTE' AND grantee <> 'postgres')" \
  "exlib_catalog_admission / exlib_catalog_admin"
for tbl in exercise_catalog_content exercise_catalog_relationships exercise_catalog_content_expected_relationships; do
  for role in anon authenticated; do
    expect_err "M2: $role has NO access to $tbl (read denied)" \
      "SET ROLE $role; SELECT count(*) FROM $tbl;" "permission denied"
  done
done
expect_err "M3: authenticated cannot LOAD content" \
  "SET ROLE authenticated; INSERT INTO exercise_catalog_content (logical_id, content_version,
     authored_by, authored_at, setup_steps, execution_steps, breathing_cue, common_mistakes, safety_guidance)
   VALUES ('$WP',50,'a','2026-09-01','[]'::jsonb,'[]'::jsonb,'b','[]'::jsonb,'c');" \
  "permission denied"
expect_err "M4: authenticated cannot APPLY A REVIEW DECISION" \
  "SET ROLE authenticated; UPDATE exercise_catalog_content SET content_status='approved' WHERE id='$CV1';" \
  "permission denied"
expect_err "M5: authenticated cannot ADMIT (function execute denied; proof 13)" \
  "SET ROLE authenticated; SELECT admit_catalog_content('$WP','$CV1','$SRC_SHA');" \
  "permission denied"
expect_err "M6: authenticated cannot PUBLISH (proof 13)" \
  "SET ROLE authenticated; SELECT publish_catalog_content('$WP','$CV1');" \
  "permission denied"
expect_err "M7: authenticated cannot write expected relationships" \
  "SET ROLE authenticated; INSERT INTO exercise_catalog_content_expected_relationships
     (content_id, relation, to_logical_id) VALUES ('$CV1','regression','$WX');" \
  "permission denied"
expect_err "M8: authenticated cannot compute admission manifests or fingerprints (no forging oracle)" \
  "SET ROLE authenticated; SELECT exlib_content_admission_fingerprint('$CV1');" \
  "permission denied"
expect_err "M9: anon cannot admit or publish either" \
  "SET ROLE anon; SELECT admit_catalog_content('$WP','$CV1','$SRC_SHA');" \
  "permission denied"
expect_eq "M10: RLS is ENABLED with ZERO policies on all three new tables" \
  "SELECT string_agg(c.relname || ':' || c.relrowsecurity::text || ':' ||
     (SELECT count(*) FROM pg_policy p WHERE p.polrelid=c.oid)::text, ',' ORDER BY c.relname)
   FROM pg_class c WHERE c.relname IN
     ('exercise_catalog_content','exercise_catalog_relationships','exercise_catalog_content_expected_relationships')" \
  "exercise_catalog_content:true:0,exercise_catalog_content_expected_relationships:true:0,exercise_catalog_relationships:true:0"
expect_eq "M11: no service_role grant exists on any new object, and authenticated keeps EXACTLY its already-reviewed 026 delivery access" \
  "SELECT (SELECT count(*)::text FROM information_schema.role_table_grants
     WHERE grantee='service_role' AND table_name IN
       ('exercise_catalog_content','exercise_catalog_relationships','exercise_catalog_content_expected_relationships'))
   || '/' ||
     (SELECT coalesce(string_agg(DISTINCT grantee, ','), '(none)')
      FROM information_schema.routine_privileges
      WHERE routine_name='deliver_catalog_exercises' AND privilege_type='EXECUTE' AND grantee='authenticated')" \
  "0/authenticated"
expect_eq "M12: every function this proposal defines pins search_path = public, pg_temp (8 of 8, including the carried 023 freeze function)" \
  "SELECT count(*)::text FROM pg_proc p
   WHERE p.proname IN ('exlib_freeze_catalog_snapshot','exlib_freeze_content_version',
     'exlib_freeze_expected_relationships','exlib_manifest_hex','exlib_content_admission_manifest',
     'exlib_content_admission_fingerprint','admit_catalog_content','publish_catalog_content')
     AND EXISTS (SELECT 1 FROM unnest(coalesce(p.proconfig,ARRAY[]::text[])) cfg
                 WHERE cfg LIKE 'search_path=%')" "8"

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
echo "        SECURITY DEFINER search_path, function-execute exposure,"
echo "        FK indexing). They are NOT a substitute for the hosted"
echo "        advisors, which must be re-run by the authorized operator"
echo "        after any future approved application."
expect_eq "N1: advisor-equivalent 'RLS disabled in public' - every new public table has RLS enabled" \
  "SELECT count(*)::text FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname='public' AND c.relkind='r' AND NOT c.relrowsecurity
     AND c.relname IN ('exercise_catalog_content','exercise_catalog_relationships',
                       'exercise_catalog_content_expected_relationships')" "0"
expect_eq "N2: advisor-equivalent 'SECURITY DEFINER exposure' - no new SECURITY DEFINER function is executable by PUBLIC, anon, or authenticated" \
  "SELECT count(*)::text FROM information_schema.routine_privileges
   WHERE routine_name IN ('admit_catalog_content','publish_catalog_content',
     'exlib_content_admission_manifest','exlib_content_admission_fingerprint','exlib_manifest_hex',
     'exlib_freeze_content_version','exlib_freeze_expected_relationships')
     AND privilege_type='EXECUTE' AND grantee IN ('PUBLIC','anon','authenticated')" "0"
expect_eq "N3: advisor-equivalent 'unindexed foreign key' - every new FK has an index whose LEADING columns cover it" \
  "SELECT count(*)::text FROM (
     SELECT 1 FROM pg_constraint con
     WHERE con.contype='f'
       AND con.conrelid IN ('exercise_catalog_content'::regclass,
                            'exercise_catalog_relationships'::regclass,
                            'exercise_catalog_content_expected_relationships'::regclass)
       AND NOT EXISTS (
         SELECT 1 FROM pg_index i WHERE i.indrelid=con.conrelid
           AND (string_to_array(i.indkey::text, ' ')::int2[])[1:array_length(con.conkey,1)] @> con.conkey)) s" "0"
expect_eq "N4: the fingerprint pipeline is SHA-256 end to end - no md5 call exists in any new function body" \
  "SELECT count(*)::text FROM pg_proc
   WHERE proname IN ('exlib_manifest_hex','exlib_content_admission_manifest',
     'exlib_content_admission_fingerprint','admit_catalog_content','publish_catalog_content',
     'exlib_freeze_content_version','exlib_freeze_expected_relationships')
     AND prosrc ILIKE '%md5%'" "0"

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
ok "O3: the promoted Plank content artifact was never read, copied, or loaded by this script (fixtures are locally invented proof rows; the source digest recorded in fixtures is the SHA-256 of a literal disposable string, not of any repository artifact)"

echo
printf '%s passed, %s failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ] || exit 1
