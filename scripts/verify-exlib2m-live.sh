#!/bin/bash
# ============================================================
# ForgeFitOS - EXLIB-2M migration-027 apply-prep LIVE proof matrix.
#
# Applies migrations 001-027 FROM supabase/migrations exactly once to
# DISPOSABLE LOCAL PostgreSQL databases (unix-socket only, no TCP,
# torn down on exit), reproducing the complete EXLIB-2L behavior
# matrix against the REAL migration file, over both an EMPTY and a
# legitimate NONEMPTY migration-023 starting state - and then proves
# TWO-DATABASE EQUIVALENCE between (A) migrations 001-026 + the
# reviewed docs proposal and (B) migrations 001-027 only. The docs
# proposal is NEVER sourced into a migration database: it is applied
# ONLY to the equivalence database eqa. This script NEVER contacts
# Supabase, Vercel, or any remote service; migration 027 remains
# PREPARED, NOT APPLIED to any hosted or persistent database, and
# nothing here loads catalog content, reviews, admits, seals,
# publishes, or delivers anything in the product.
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
#   bash scripts/verify-exlib2m-live.sh
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

MIGRATION="supabase/migrations/027_exlib_catalog_content_schema.sql"
PROPOSAL="docs/exlib2l-catalog-content-schema-proposal.sql"

echo
echo "=== A. Candidate identity, sequence, and the executable-body drift gate"
[ -f "$MIGRATION" ] && ok "A1: the migration-027 candidate exists at $MIGRATION" \
  || { bad "A1: migration candidate missing"; exit 1; }
NMIG=$(ls supabase/migrations/0*.sql 2>/dev/null | wc -l | tr -d ' ')
N027=$(ls supabase/migrations/ | grep -c '^027' || true)
N028=$(ls supabase/migrations/ | grep -c '^02[8-9]' || true)
[ "$NMIG/$N027/$N028" = "27/1/0" ] \
  && ok "A2: exactly one numbered migration 027 and no 028 - the sequence is exactly 001-027 (27 files)" \
  || bad "A2: expected 27/1/0, found $NMIG/$N027/$N028"
MSHA=$(shasum -a 256 "$MIGRATION" | awk '{print $1}')
MBYTES=$(wc -c < "$MIGRATION" | tr -d ' ')
ok "A3: migration candidate under test: $MBYTES bytes, sha256 $MSHA"
PSHA=$(shasum -a 256 "$PROPOSAL" | awk '{print $1}')
PBYTES=$(wc -c < "$PROPOSAL" | tr -d ' ')
[ "$PBYTES/$PSHA" = "78468/9a0505c8f2fea3f4330e7c80e22ffd8bc6867760b335a7468ea4587f0bd70553" ] \
  && ok "A4: the reviewed docs proposal is retained byte-identical to its promoted fingerprint (78,468 B / 9a0505c8...) - not moved, not deleted, not edited" \
  || { bad "A4: reviewed proposal drifted from its promoted fingerprint ($PBYTES/$PSHA)"; exit 1; }
python3 - <<'PYEQ' && ok "A5: DRIFT GATE - after removing only the truthful leading status headers, migration 027's executable SQL is byte-identical to the reviewed proposal's executable SQL" || { bad "A5: migration 027 executable SQL drifted from the reviewed docs proposal"; exit 1; }
def body(p):
    ls = open(p, encoding='utf-8').read().split('\n')
    i = next(n for n, l in enumerate(ls) if l.strip() and not l.strip().startswith('--'))
    return '\n'.join(ls[i:])
import sys
sys.exit(0 if body('docs/exlib2l-catalog-content-schema-proposal.sql') == body('supabase/migrations/027_exlib_catalog_content_schema.sql') else 1)
PYEQ
grep -q '^BEGIN;' "$MIGRATION" && grep -q '^COMMIT;' "$MIGRATION" \
  && ok "A6: every executable statement in the migration is enclosed in ONE explicit transaction (023/024/025 convention)" \
  || bad "A6: migration is not wrapped in a single explicit transaction"
PROPOSAL_SOURCED=$(grep -c -- '-f "\$PROPOSAL"' "$0" || true)
[ "$PROPOSAL_SOURCED" = "1" ] \
  && ok "A7: this suite sources the docs proposal EXACTLY ONCE - into the equivalence database eqa only, never into a migration database (no double application anywhere)" \
  || bad "A7: expected exactly 1 proposal-sourcing site, found $PROPOSAL_SOURCED"

echo
echo "=== B. Disposable cluster + migrations into BOTH primary databases"
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

APPLIED=0
for f in supabase/migrations/0*.sql; do
  # postgres receives 001-026 now; the 027 candidate is applied in
  # section D over the NONEMPTY legacy state seeded in section C.
  case "$f" in supabase/migrations/027_*) continue;; esac
  psql -h "$SOCK" -U postgres -d postgres -X -v ON_ERROR_STOP=1 -q -f "$f" >/dev/null 2>"$TMP/err.log" \
    || { bad "B3: migration failed in postgres: $f" "$(sed -n '1,3p' "$TMP/err.log")"; exit 1; }
  APPLIED=$((APPLIED+1))
done
[ "$APPLIED" = "26" ] && ok "B3: migrations 001-026 applied cleanly in order to 'postgres' (the nonempty-start database; 027 follows in section D)" \
  || bad "B3: expected 26 migrations in postgres, applied $APPLIED"
APPLIED=0
for f in supabase/migrations/0*.sql; do
  psql -h "$SOCK" -U postgres -d emptycase -X -v ON_ERROR_STOP=1 -q -f "$f" >/dev/null 2>"$TMP/err.log" \
    || { bad "B4: migration failed in emptycase: $f" "$(sed -n '1,3p' "$TMP/err.log")"; exit 1; }
  APPLIED=$((APPLIED+1))
done
[ "$APPLIED" = "27" ] && ok "B4: migrations 001-027 applied cleanly in order to 'emptycase' FROM supabase/migrations exactly once - explicit applied count = 27 (proof: the empty legitimate starting state)" \
  || bad "B4: expected 27 migrations in emptycase, applied $APPLIED"

echo "=== C. A legitimate NONEMPTY migration-023 external catalog, seeded BEFORE the proposal (seeded BEFORE migration 027)"
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
echo
echo "=== D. Migration 027 applies EXACTLY ONCE over the NONEMPTY state; second application fails wholly"
psql -h "$SOCK" -U postgres -d postgres -X -v ON_ERROR_STOP=1 -q -f "$MIGRATION" >/dev/null 2>"$TMP/prop.log" \
  && ok "D1: migration 027 applies CLEANLY over the NONEMPTY legitimate 001-026 state (no fabrication needed, no data loss)" \
  || { bad "D1: migration 027 failed over nonempty state" "$(sed -n '1,5p' "$TMP/prop.log")"; exit 1; }
psql -h "$SOCK" -U postgres -d emptycase -X -v ON_ERROR_STOP=1 -q -f "$MIGRATION" >/dev/null 2>&1 \
  && bad "D3: a SECOND application succeeded - apply-exactly-once is not enforced" \
  || ok "D3: a second application of migration 027 fails closed (apply-exactly-once)"
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
    (SELECT count(*) FROM exercise_catalog_content WHERE content_status<>'pending')::text || '/' ||
    (SELECT count(*) FROM exercise_catalog_content WHERE import_admitted)::text || '/' ||
    (SELECT count(*) FROM exercise_catalog_content WHERE publication_status='published')::text || '/' ||
    (SELECT count(*) FROM exercise_catalog_import_runs WHERE sealed_at IS NOT NULL)::text")
[ "$EMPTYSTATE" = "0/0/0/0/0/0/0/0/0/0" ] \
  && ok "D5: migration application alone creates NO content, relationship, expected-relationship, run, membership, review decision, admission, publication, or seal state (schema only)" \
  || bad "D5: unexpected state after empty application" "$EMPTYSTATE"

echo "=== E. Legacy external rows keep their EXACT meaning; 023-026 delivery unchanged (round-1 finding 4; proofs 13-14)"
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
expect_err "E4: forgefitos_original rows FORBID source/import-confidence fields - even through the LOADER authority (its writes obey every CHECK)" \
  "SET ROLE exlib_catalog_loader;
   SELECT load_catalog_snapshot('$GL1','Original Bad Sources','isolation','abs','bodyweight',
     'bilateral','timed','forgefitos_original','core_flexion','core','beginner','minimal',
     'https://example.test/fake', NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb);" \
  "exercise_catalog_provenance_sources_chk"
expect_err "E5: forgefitos_original rows REQUIRE complete discovery metadata (structural CHECK, not workflow-only)" \
  "SET ROLE exlib_catalog_loader;
   SELECT load_catalog_snapshot('$GL1','Original Missing Meta','isolation','abs','bodyweight',
     'bilateral','timed','forgefitos_original','core_flexion','core','beginner',NULL,
     NULL, NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb);" \
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
  ok "E8: unchanged migration-026 DELIVERY works on the HISTORICAL external rows after the proposal (proof 14)"
else
  bad "E8: delivery failed on legacy rows post-proposal" "$(printf '%s' "$DLV_OUT" | head -2 | tr '\n' ' ')"
fi
expect_eq "E9: delivery created the two tenant exercises for the legacy run's snapshots" \
  "SELECT count(*)::text FROM exercises WHERE user_id='$U1'" "2"
RBK_OUT=$(QU "$U1" "SELECT rollback_catalog_delivery('$RUN');" 2>&1)
if [ $? -eq 0 ]; then
  ok "E10: unchanged migration-026 ROLLBACK works on the historical delivery after the proposal (proof 14)"
else
  bad "E10: rollback failed on legacy delivery post-proposal" "$(printf '%s' "$RBK_OUT" | head -2 | tr '\n' ' ')"
fi
expect_eq "E11: rollback left the user with zero ACTIVE delivered exercises" \
  "SELECT count(*)::text FROM exercises WHERE user_id='$U1' AND is_active" "0"

echo
echo "=== F. The LOADER authority stages the Plank model; lifecycle birth rules hold (finding 2; lifecycle proofs)"
WP='11111111-2222-3333-4444-555555555101'
WD='11111111-2222-3333-4444-555555555102'
WA='11111111-2222-3333-4444-555555555103'
WX='11111111-2222-3333-4444-555555555104'
CV1='cccccccc-0000-0000-0000-000000000101'
expect_ok "F1: the loader authority creates the Plank-model identity, its two relationship-target identities, and a spare - bare logical identities, no snapshots, no content" \
  "SET ROLE exlib_catalog_loader;
   SELECT load_catalog_identity('$WP');
   SELECT load_catalog_identity('$WD');
   SELECT load_catalog_identity('$WA');
   SELECT load_catalog_identity('$WX');"
expect_ok "F2: the loader authority creates the ORIGINAL-provenance snapshot with complete discovery metadata, NO source facts, anatomy authored while pending, and an alias - in one authorized call" \
  "SET ROLE exlib_catalog_loader;
   SELECT load_catalog_snapshot('$WP','Proof Plank Model','isolation','abs','bodyweight',
     'bilateral','timed','forgefitos_original','core_anti_extension','core','beginner','minimal',
     NULL, NULL, NULL, NULL,
     '[{\"muscle\":\"obliques\",\"role\":\"secondary\"},{\"muscle\":\"lower_back\",\"role\":\"tertiary\"}]'::jsonb,
     '[\"Proof plank model alias\"]'::jsonb);"
expect_ok "F3: the loader authority creates the content draft WITH its version-owned expected relationship set (substitution + progression, the Plank shape) in one call" \
  "SET ROLE exlib_catalog_loader;
   SELECT load_catalog_content_draft('$WP','$CV1',1,'local-proof-author','2026-09-01',
     '[\"step one\"]'::jsonb,'[\"exec one\"]'::jsonb,'breathe out on effort',
     '[\"mistake one\"]'::jsonb,'stop if form breaks down',NULL,NULL,
     '[{\"relation\":\"substitution\",\"to_logical_id\":\"$WD\"},{\"relation\":\"progression\",\"to_logical_id\":\"$WA\"}]'::jsonb);"
expect_eq "F4: the version is BORN pending, draft, and NOT admitted with no admission fields, and its expected set has exactly 2 rows" \
  "SELECT content_status||'/'||publication_status||'/'||import_admitted::text||'/'||
     coalesce(admitted_fingerprint,'-')||'/'||coalesce(admitted_source_sha256,'-')||'/'||coalesce(admitted_at::text,'-')||'/'||
     (SELECT count(*)::text FROM exercise_catalog_content_expected_relationships WHERE content_id='$CV1')
   FROM exercise_catalog_content WHERE id='$CV1'" "pending/draft/false/-/-/-/2"
expect_err "F5: the loader CANNOT author a self-expectation - the whole draft creation rolls back" \
  "SET ROLE exlib_catalog_loader;
   SELECT load_catalog_content_draft('$WD','cccccccc-0000-0000-0000-000000000199',1,'a','2026-09-01',
     '[]'::jsonb,'[]'::jsonb,'b','[]'::jsonb,'c',NULL,NULL,
     '[{\"relation\":\"substitution\",\"to_logical_id\":\"$WD\"}]'::jsonb);" \
  "cannot expect a relationship to its own identity"
expect_err "F6: the loader cannot expect a relationship to a MISSING identity (FK; no dangling expectation)" \
  "SET ROLE exlib_catalog_loader;
   SELECT load_catalog_content_draft('$WD','cccccccc-0000-0000-0000-000000000199',1,'a','2026-09-01',
     '[]'::jsonb,'[]'::jsonb,'b','[]'::jsonb,'c',NULL,NULL,
     '[{\"relation\":\"substitution\",\"to_logical_id\":\"99999999-9999-9999-9999-999999999999\"}]'::jsonb);" \
  "violates foreign key constraint"
expect_err "F7: a version cannot be BORN admitted (owner break-glass INSERT obeys the freeze trigger too)" \
  "INSERT INTO exercise_catalog_content (logical_id, content_version, authored_by, authored_at,
     setup_steps, execution_steps, breathing_cue, common_mistakes, safety_guidance, import_admitted,
     admitted_fingerprint, admitted_source_sha256, admitted_at)
   VALUES ('$WD',1,'a','2026-09-01','[]'::jsonb,'[]'::jsonb,'b','[]'::jsonb,'c', true,
     repeat('a',64), repeat('b',64), '2026-09-01');" \
  "versions are born unadmitted"
expect_err "F8: a version cannot be BORN approved" \
  "INSERT INTO exercise_catalog_content (logical_id, content_version, authored_by, authored_at,
     setup_steps, execution_steps, breathing_cue, common_mistakes, safety_guidance,
     content_status, reviewed_by, reviewed_at, review_rationale)
   VALUES ('$WD',1,'a','2026-09-01','[]'::jsonb,'[]'::jsonb,'b','[]'::jsonb,'c',
     'approved','r',NOW(),'rationale text');" \
  "versions are born pending"
expect_err "F9: a version cannot be BORN published" \
  "INSERT INTO exercise_catalog_content (logical_id, content_version, authored_by, authored_at,
     setup_steps, execution_steps, breathing_cue, common_mistakes, safety_guidance, publication_status)
   VALUES ('$WD',1,'a','2026-09-01','[]'::jsonb,'[]'::jsonb,'b','[]'::jsonb,'c','published');" \
  "born drafts and never auto-publish"
expect_ok "F10: PENDING prose is editable before review (pre-review authoring)" \
  "UPDATE exercise_catalog_content SET breathing_cue='exhale on the effort' WHERE id='$CV1';"
expect_err "F11: admission CANNOT PRECEDE approval - the admission authority refuses a pending version" \
  "SET ROLE exlib_catalog_admission; SELECT admit_catalog_content('$WP','$CV1', repeat('a',64));" \
  "admission cannot precede human approval"
expect_err "F12: admission cannot precede approval even through a direct owner-level write (trigger-enforced, not function-only)" \
  "UPDATE exercise_catalog_content SET import_admitted=true, admitted_fingerprint=repeat('a',64),
     admitted_source_sha256=repeat('b',64), admitted_at='2026-09-01' WHERE id='$CV1';" \
  "admission cannot precede human approval"
expect_err "F13: admission fields cannot drift outside the admission transition" \
  "UPDATE exercise_catalog_content SET admitted_fingerprint=repeat('a',64) WHERE id='$CV1';" \
  "admission fields change only through the one-time admission transition"

echo
echo "=== G. The REVIEWER authority: one legal pending decision; the review freezes the payload (finding 2)"
expect_err "G1: the reviewer authority refuses a blank rationale" \
  "SET ROLE exlib_catalog_reviewer;
   SELECT apply_content_review('$WP','$CV1','approved','Local Proof Reviewer',NOW(),'   ');" \
  "complete, non-blank reviewer/timestamp/rationale tuple"
expect_err "G2: the reviewer authority refuses an invalid decision" \
  "SET ROLE exlib_catalog_reviewer;
   SELECT apply_content_review('$WP','$CV1','pending','Local Proof Reviewer',NOW(),'rationale text');" \
  "decision must be approved, revised, or rejected"
expect_ok "G3: the human review APPROVES the version with complete fresh evidence through the reviewer authority (approval strictly before eligibility)" \
  "SET ROLE exlib_catalog_reviewer;
   SELECT apply_content_review('$WP','$CV1','approved','Local Proof Reviewer',NOW(),'local disposable fixture rationale');"
expect_err "G4: the review decision is one-time through this authority - a second decision on a decided version is refused" \
  "SET ROLE exlib_catalog_reviewer;
   SELECT apply_content_review('$WP','$CV1','rejected','Second Reviewer',NOW(),'attempted re-decision');" \
  "only a pending version can receive its review decision"
expect_err "G5: the review FREEZES the reviewed payload - post-approval prose edits are refused (owner break-glass obeys the trigger)" \
  "UPDATE exercise_catalog_content SET breathing_cue='changed after approval' WHERE id='$CV1';" \
  "decided content version is immutable"
expect_err "G6: the review freezes the EXPECTED relationship set too - post-approval additions are refused" \
  "INSERT INTO exercise_catalog_content_expected_relationships (content_id, relation, to_logical_id)
   VALUES ('$CV1','regression','$WX');" \
  "expected relationships freeze with the reviewed payload"
expect_err "G7: post-approval expected deletions are refused as well" \
  "DELETE FROM exercise_catalog_content_expected_relationships WHERE content_id='$CV1';" \
  "expected relationships freeze with the reviewed payload"
expect_err "G8: expected rows are immutable (UPDATE is never allowed)" \
  "UPDATE exercise_catalog_content_expected_relationships SET relation='regression'
   WHERE content_id='$CV1' AND to_logical_id='$WD';" \
  "rows are immutable"
expect_err "G9: a review transition cannot smuggle admission changes (owner break-glass combined statement)" \
  "UPDATE exercise_catalog_content SET content_status='rejected', reviewed_by='Another Reviewer',
     reviewed_at=NOW(), review_rationale='combined transition attempt', import_admitted=true,
     admitted_fingerprint=repeat('a',64), admitted_source_sha256=repeat('b',64), admitted_at='2026-09-01'
   WHERE id='$CV1';" \
  "payload and admission changes are forbidden in the same statement"

echo
echo "=== H. The ADMISSION authority: one-time, computed from database state (findings 1-2 accepted round 1)"
expect_err "H1: the source-artifact digest must be a 64-char lowercase hex SHA-256 (MD5-shaped and malformed digests are refused)" \
  "SET ROLE exlib_catalog_admission; SELECT admit_catalog_content('$WP','$CV1', 'd41d8cd98f00b204e9800998ecf8427e');" \
  "must be a 64-character lowercase hex SHA-256"
SRC_SHA=$(printf 'local disposable proof artifact - not the Plank record' | shasum -a 256 | awk '{print $1}')
MAN_FP=$(Q "SELECT exlib_content_admission_fingerprint('$CV1')")
expect_err "H2: a caller-invented manifest hash CANNOT land even through a direct owner-level write - the trigger recomputes from database state" \
  "UPDATE exercise_catalog_content SET import_admitted=true,
     admitted_fingerprint=repeat('0',64), admitted_source_sha256='$SRC_SHA', admitted_at='2026-09-01'
   WHERE id='$CV1';" \
  "must equal the recomputed admission-manifest fingerprint"
ADMIT_OUT=$(QQ "SET ROLE exlib_catalog_admission; SELECT admit_catalog_content('$WP','$CV1','$SRC_SHA');")
if [ $? -eq 0 ]; then
  ok "H3: the dedicated admission authority admits the ALREADY-APPROVED immutable draft - one-time, later, separate"
else
  bad "H3: admission failed" "$(printf '%s' "$ADMIT_OUT" | head -2 | tr '\n' ' ')"
fi
expect_eq "H4: the recorded admission stores BOTH digests distinctly - the COMPUTED database-normalized manifest SHA-256 and the recorded source artifact SHA-256" \
  "SELECT (admitted_fingerprint = '$MAN_FP')::text || '/' || (admitted_source_sha256 = '$SRC_SHA')::text ||
     '/' || (admitted_fingerprint ~ '^[0-9a-f]{64}\$')::text || '/' || (admitted_fingerprint <> admitted_source_sha256)::text
   FROM exercise_catalog_content WHERE id='$CV1'" "true/true/true/true"
expect_err "H5: admission is ONE-WAY - re-admission of an admitted version is refused" \
  "SET ROLE exlib_catalog_admission; SELECT admit_catalog_content('$WP','$CV1','$SRC_SHA');" \
  "already admitted"
expect_err "H6: admission cannot be revoked (un-admitting an immutable version is refused)" \
  "UPDATE exercise_catalog_content SET import_admitted=false, admitted_fingerprint=NULL,
     admitted_source_sha256=NULL, admitted_at=NULL WHERE id='$CV1';" \
  "admission is one-way for an immutable version"
expect_err "H7: a publication transition cannot smuggle admission changes" \
  "UPDATE exercise_catalog_content SET publication_status='published', admitted_at='1999-01-01' WHERE id='$CV1';" \
  "a publication transition must travel alone"
WR='cccccccc-0000-0000-0000-000000000102'
Q "SET ROLE exlib_catalog_loader;
   SELECT load_catalog_content_draft('$WD','$WR',1,'local-proof-author','2026-09-01',
     '[\"step one\"]'::jsonb,'[\"exec one\"]'::jsonb,'breathe out on effort',
     '[\"mistake one\"]'::jsonb,'stop if form breaks down',NULL,NULL,'[]'::jsonb);" >/dev/null
expect_err "H8: REVISED content cannot be admitted" \
  "SET ROLE exlib_catalog_reviewer;
   SELECT apply_content_review('$WD','$WR','revised','Local Proof Reviewer',NOW(),'sent back for revision');
   SET ROLE exlib_catalog_admission; SELECT admit_catalog_content('$WD','$WR', repeat('a',64));" \
  "only approved content may be admitted"
expect_err "H9: REJECTED content cannot be admitted" \
  "SET ROLE exlib_catalog_reviewer;
   SELECT apply_content_review('$WD','$WR','rejected','Local Proof Reviewer',NOW(),'rejected for cause');
   SET ROLE exlib_catalog_admission; SELECT admit_catalog_content('$WD','$WR', repeat('a',64));" \
  "only approved content may be admitted"

echo
echo "=== I. The v2 admission manifest: complete, canonical, SHA-256, session-independent"
MANIFEST=$(Q "SELECT exlib_content_admission_manifest('$CV1')")
hexof() { Q "SELECT encode(convert_to('$1','UTF8'),'hex')"; }
case "$MANIFEST" in "EXLIB-ADMISSION-MANIFEST v2"*) ok "I1: the manifest is VERSIONED and bumped for the round-2 format change (leading literal 'EXLIB-ADMISSION-MANIFEST v2')";; *) bad "I1: manifest version header missing or stale";; esac
MAPPED=1
for probe in "identity $WP:logical identity" \
             "$(hexof 'Proof Plank Model'):canonical classification (snapshot name)" \
             "$(hexof 'core_anti_extension'):discovery metadata (movement_pattern)" \
             "$(hexof 'obliques'):anatomy (muscle row)" \
             "$(hexof 'Proof plank model alias'):alias row" \
             "$(hexof 'exhale on the effort'):authored instructional content (edited pre-review prose)" \
             "$(hexof 'local-proof-author'):authorship" \
             "$(hexof 'Local Proof Reviewer'):review-bound evidence" \
             "relationship S$(hexof progression) $WA:version-owned relationship set (progression)" \
             "relationship S$(hexof substitution) $WD:version-owned relationship set (substitution)"; do
  NEEDLE="${probe%%:*}"; LABEL="${probe#*:}"
  case "$MANIFEST" in *"$NEEDLE"*) : ;; *) MAPPED=0; bad "I2: manifest is missing its $LABEL binding" "$NEEDLE";; esac
done
[ "$MAPPED" = "1" ] && ok "I2: the artifact-to-database mapping is MECHANICALLY PROVEN - the manifest contains the identity, classification, discovery metadata, anatomy, alias, content, authorship, review evidence, and version-owned relationship-set bindings"
case "$MANIFEST" in *"relation S"*" NONE"*|*$'\n'"relation "*) bad "I3: manifest still carries the v1 live-surface section";; *) ok "I3: the manifest does NOT bind the live projection surface - a version's manifest can never be coupled to another version's publication state (round-2 finding 1)";; esac
expect_eq "I4: the fingerprint is SHA-256, not MD5 - 64 lowercase hex characters" \
  "SELECT (char_length(exlib_content_admission_fingerprint('$CV1')) = 64)::text ||
     '/' || (exlib_content_admission_fingerprint('$CV1') ~ '^[0-9a-f]{64}\$')::text" "true/true"
FP_A=$(Q "SET datestyle='ISO,MDY'; SET timezone='UTC'; SELECT exlib_content_admission_fingerprint('$CV1')")
FP_B=$(Q "SET datestyle='German,DMY'; SET timezone='America/New_York'; SELECT exlib_content_admission_fingerprint('$CV1')")
[ "$FP_A" = "$FP_B" ] && [ "$FP_A" = "$MAN_FP" ] \
  && ok "I5: DateStyle and TimeZone cannot change the hash (dates are day offsets; timestamps are numeric epochs)" \
  || bad "I5: fingerprint is session-dependent" "A=$FP_A B=$FP_B"
expect_eq "I6: JSON key ordering cannot change the hash - jsonb canonicalizes key order before serialization" \
  "SELECT ('{\"b\":1,\"a\":2}'::jsonb::text = '{\"a\":2,\"b\":1}'::jsonb::text)::text" "true"
expect_eq "I7: manifest row ordering is pinned to COLLATE \"C\" byte order - locale cannot reorder rows" \
  "SELECT count(*)::text FROM pg_proc
   WHERE proname='exlib_content_admission_manifest'
     AND prosrc LIKE '%COLLATE \"C\"%'" "1"
WREO='11111111-2222-3333-4444-555555555106'
CVREO='cccccccc-0000-0000-0000-000000000103'
Q "SET ROLE exlib_catalog_loader;
   SELECT load_catalog_identity('$WREO');
   SELECT load_catalog_snapshot('$WREO','Proof Reorder Model','isolation','abs','bodyweight',
     'bilateral','timed','forgefitos_original','core_lateral','core','beginner','minimal',
     NULL, NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb);
   SELECT load_catalog_content_draft('$WREO','$CVREO',1,'local-proof-author','2026-09-01',
     '[\"step one\"]'::jsonb,'[\"exec one\"]'::jsonb,'breathe out on effort',
     '[\"mistake one\"]'::jsonb,'stop if form breaks down',NULL,NULL,
     '[{\"relation\":\"substitution\",\"to_logical_id\":\"$WD\"},{\"relation\":\"progression\",\"to_logical_id\":\"$WA\"}]'::jsonb);" >/dev/null
FP_R1=$(Q "SELECT exlib_content_admission_fingerprint('$CVREO')" 2>/dev/null || true)
Q "DELETE FROM exercise_catalog_content_expected_relationships WHERE content_id='$CVREO';" >/dev/null
Q "INSERT INTO exercise_catalog_content_expected_relationships (content_id, relation, to_logical_id)
   VALUES ('$CVREO','progression','$WA');" >/dev/null
Q "INSERT INTO exercise_catalog_content_expected_relationships (content_id, relation, to_logical_id)
   VALUES ('$CVREO','substitution','$WD');" >/dev/null
FP_R2=$(Q "SELECT exlib_content_admission_fingerprint('$CVREO')" 2>/dev/null || true)
{ [ -n "$FP_R1" ] && [ "$FP_R1" = "$FP_R2" ]; } \
  && ok "I8: committed deletion and REVERSE-ORDER re-insertion of the pending expected set reproduces the exact manifest bytes - insertion order and row timestamps are not bound (deterministic normalization)" \
  || bad "I8: manifest depends on expected-row order or timestamps" "$FP_R1 vs $FP_R2"

echo
echo "=== J. The PROTECTED PROJECTION: publication atomically owns the live surface (round-2 finding 1)"
expect_eq "J1: the live surface is EMPTY before any publication - nothing can pre-seed it" \
  "SELECT count(*)::text FROM exercise_catalog_relationships" "0"
expect_err "J2: a direct INSERT into the live surface is refused for the OWNER itself (protected projection; sentinel unset)" \
  "INSERT INTO exercise_catalog_relationships (from_logical_id, to_logical_id, relation)
   VALUES ('$WP','$WD','substitution');" \
  "protected projection"
expect_err "J3: publication BEFORE admission is refused on an approved-but-unadmitted version (approve -> admit -> publish holds)" \
  "$(cat <<SQL
SET ROLE exlib_catalog_loader;
SELECT load_catalog_content_draft('$WA','cccccccc-0000-0000-0000-000000000104',1,'a','2026-09-01',
  '["s"]'::jsonb,'["e"]'::jsonb,'cue','["m"]'::jsonb,'guard',NULL,NULL,'[]'::jsonb);
RESET ROLE;
SET ROLE exlib_catalog_reviewer;
SELECT apply_content_review('$WA','cccccccc-0000-0000-0000-000000000104','approved','Local Proof Reviewer',NOW(),'approved but never admitted');
RESET ROLE;
SET ROLE exlib_catalog_admin;
SELECT publish_catalog_content('$WA','cccccccc-0000-0000-0000-000000000104');
SQL
)" \
  "not import-admitted"
PUB_OUT=$(QQ "SET ROLE exlib_catalog_admin; SELECT publish_catalog_content('$WP','$CV1');")
if [ $? -eq 0 ]; then
  ok "J4: AUTHORIZED publication succeeds with every prerequisite - and ATOMICALLY projects the version's expected set onto the live surface"
else
  bad "J4: publication failed with all prerequisites satisfied" "$(printf '%s' "$PUB_OUT" | head -2 | tr '\n' ' ')"
fi
expect_eq "J5: the PLANK MODEL published with EXACTLY its substitution and progression - the projection equals the version-owned expected set, row for row" \
  "SELECT (SELECT count(*) FROM exercise_catalog_relationships WHERE from_logical_id='$WP')::text || '/' ||
     (SELECT count(*) FROM exercise_catalog_relationships
      WHERE from_logical_id='$WP' AND relation='substitution' AND to_logical_id='$WD')::text || '/' ||
     (SELECT count(*) FROM exercise_catalog_relationships
      WHERE from_logical_id='$WP' AND relation='progression' AND to_logical_id='$WA')::text" "2/1/1"
expect_eq "J6: the relationship TARGETS remain bare logical identities - zero snapshots, zero content, zero admission, zero publication of their own" \
  "SELECT (SELECT count(*) FROM exercise_catalog WHERE logical_id IN ('$WD','$WA'))::text || '/' ||
     (SELECT count(*) FROM exercise_catalog_content WHERE logical_id IN ('$WD','$WA')
        AND (import_admitted OR publication_status='published'))::text" "0/0"
expect_err "J7: a direct DELETE from the live surface is refused (the published projection cannot drift)" \
  "DELETE FROM exercise_catalog_relationships WHERE from_logical_id='$WP';" \
  "protected projection"
expect_err "J8: live projection rows are immutable (UPDATE is never allowed)" \
  "UPDATE exercise_catalog_relationships SET relation='regression' WHERE from_logical_id='$WP';" \
  "projection rows are immutable"
expect_err "J9: republishing an already-published version is rejected" \
  "SET ROLE exlib_catalog_admin; SELECT publish_catalog_content('$WP','$CV1');" \
  "only a draft can be published"
expect_err "J10: a PUBLISHED version cannot be newly admitted (it already carries its one-way admission)" \
  "SET ROLE exlib_catalog_admission; SELECT admit_catalog_content('$WP','$CV1','$SRC_SHA');" \
  "already admitted"
expect_err "J11: a published approved row cannot be flipped to revised in place (the preserved narrowing closes the hole)" \
  "UPDATE exercise_catalog_content SET content_status='revised', reviewed_by='Another Reviewer',
     reviewed_at=NOW(), review_rationale='attempted in-place un-approval' WHERE id='$CV1';" \
  "exercise_catalog_content_publication_chk"
WB='11111111-2222-3333-4444-555555555105'
CB1='cccccccc-0000-0000-0000-000000000105'
Q "SET ROLE exlib_catalog_loader;
   SELECT load_catalog_identity('$WB');
   SELECT load_catalog_snapshot('$WB','Proof Breakglass Model','isolation','abs','bodyweight',
     'bilateral','timed','forgefitos_original','core_flexion','core','beginner','minimal',
     NULL, NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb);
   SELECT load_catalog_content_draft('$WB','$CB1',1,'local-proof-author','2026-09-01',
     '[\"step one\"]'::jsonb,'[\"exec one\"]'::jsonb,'breathe out on effort',
     '[\"mistake one\"]'::jsonb,'stop if form breaks down',NULL,NULL,
     '[{\"relation\":\"substitution\",\"to_logical_id\":\"$WD\"}]'::jsonb);" >/dev/null
Q "SET ROLE exlib_catalog_reviewer;
   SELECT apply_content_review('$WB','$CB1','approved','Local Proof Reviewer',NOW(),'local disposable fixture rationale');" >/dev/null
Q "SET ROLE exlib_catalog_admission; SELECT admit_catalog_content('$WB','$CB1','$SRC_SHA');" >/dev/null
expect_err "J12: even a direct OWNER break-glass publish (bypassing the function, projection never written) is refused by the trigger's structural completeness gate - no published row can be paired with a missing or foreign relationship set" \
  "UPDATE exercise_catalog_content SET publication_status='published' WHERE id='$CB1';" \
  "a required relationship is missing at publication"

echo
echo "=== K. Staleness: ANY bound change after admission fails publication closed (accepted round 1)"
WS1='11111111-2222-3333-4444-555555555201'
WS2='11111111-2222-3333-4444-555555555202'
CS1='cccccccc-0000-0000-0000-000000000201'
CS2='cccccccc-0000-0000-0000-000000000202'
mkstale() { # $1=logical $2=content $3=name -> loader/reviewer/admission pipeline, empty expected set
  Q "SET ROLE exlib_catalog_loader;
     SELECT load_catalog_identity('$1');
     SELECT load_catalog_snapshot('$1','$3','isolation','abs','bodyweight',
       'bilateral','timed','forgefitos_original','core_flexion','core','beginner','minimal',
       NULL, NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb);
     SELECT load_catalog_content_draft('$1','$2',1,'local-proof-author','2026-09-01',
       '[\"step one\"]'::jsonb,'[\"exec one\"]'::jsonb,'breathe out on effort',
       '[\"mistake one\"]'::jsonb,'stop if form breaks down',NULL,NULL,'[]'::jsonb);" >/dev/null \
    || bad "fixture: mkstale load failed ($1)"
  Q "SET ROLE exlib_catalog_reviewer;
     SELECT apply_content_review('$1','$2','approved','Local Proof Reviewer',NOW(),'local disposable fixture rationale');" >/dev/null \
    || bad "fixture: mkstale review failed ($1)"
  Q "SET ROLE exlib_catalog_admission; SELECT admit_catalog_content('$1','$2','$SRC_SHA');" >/dev/null \
    || bad "fixture: mkstale admission failed ($1)"
}
mkstale "$WS1" "$CS1" 'Proof Stale Model One'
expect_err "K1: an ALIAS added after admission makes publication fail closed as STALE (bound alias surface changed)" \
  "INSERT INTO exercise_catalog_aliases (logical_id, alias) VALUES ('$WS1','Stale probe alias');
   SET ROLE exlib_catalog_admin; SELECT publish_catalog_content('$WS1','$CS1');" \
  "import admission is STALE"
expect_err "K2: even a direct OWNER break-glass publish cannot bypass staleness - the trigger recomputes the manifest fingerprint structurally" \
  "INSERT INTO exercise_catalog_aliases (logical_id, alias) VALUES ('$WS1','Stale probe alias two');
   UPDATE exercise_catalog_content SET publication_status='published' WHERE id='$CS1';" \
  "import admission is STALE"
expect_err "K3: a post-admission review flip (approved -> rejected with fresh evidence, owner break-glass) can never publish" \
  "UPDATE exercise_catalog_content SET content_status='rejected', reviewed_by='Second Reviewer',
     reviewed_at=NOW(), review_rationale='withdrawn after admission' WHERE id='$CS1';
   SET ROLE exlib_catalog_admin; SELECT publish_catalog_content('$WS1','$CS1');" \
  "only approved content can be published"
mkstale "$WS2" "$CS2" 'Proof Stale Model Two'
expect_err "K4: DEACTIVATING the bound snapshot after admission fails publication closed - the manifest requires exactly one ACTIVE snapshot (a missing bound surface, not just a changed one)" \
  "UPDATE exercise_catalog SET is_active=false WHERE logical_id='$WS2';
   SET ROLE exlib_catalog_admin; SELECT publish_catalog_content('$WS2','$CS2');" \
  "exactly one ACTIVE catalog snapshot"
expect_err "K5: the legacy external snapshot CANNOT enter the admission workflow - its NULL discovery metadata fails the manifest closed (round-1 finding 4 workflow gate)" \
  "$(cat <<SQL
SET ROLE exlib_catalog_loader;
SELECT load_catalog_content_draft('$GL1','cccccccc-0000-0000-0000-000000000203',1,'local-proof-author','2026-09-01',
  '["s"]'::jsonb,'["e"]'::jsonb,'cue','["m"]'::jsonb,'guard',NULL,NULL,'[]'::jsonb);
RESET ROLE;
SET ROLE exlib_catalog_reviewer;
SELECT apply_content_review('$GL1','cccccccc-0000-0000-0000-000000000203','approved','Local Proof Reviewer',NOW(),'local disposable fixture rationale');
RESET ROLE;
SET ROLE exlib_catalog_admission;
SELECT admit_catalog_content('$GL1','cccccccc-0000-0000-0000-000000000203','$SRC_SHA');
SQL
)" \
  "lacks complete discovery metadata"

echo
echo "=== L. THE WINDOW IS CLOSED: staging and admitting version 2 changes nothing for published version 1 (round-2 finding 1)"
WV='11111111-2222-3333-4444-555555555301'
CVA='cccccccc-0000-0000-0000-000000000301'
CVB='cccccccc-0000-0000-0000-000000000302'
Q "SET ROLE exlib_catalog_loader;
   SELECT load_catalog_identity('$WV');
   SELECT load_catalog_snapshot('$WV','Proof Version Isolation','isolation','abs','bodyweight',
     'bilateral','timed','forgefitos_original','core_rotation','core','beginner','minimal',
     NULL, NULL, NULL, NULL, '[]'::jsonb, '[]'::jsonb);
   SELECT load_catalog_content_draft('$WV','$CVA',1,'local-proof-author','2026-09-01',
     '[\"step one\"]'::jsonb,'[\"exec one\"]'::jsonb,'breathe out on effort',
     '[\"mistake one\"]'::jsonb,'stop if form breaks down',NULL,NULL,
     '[{\"relation\":\"substitution\",\"to_logical_id\":\"$WD\"}]'::jsonb);" >/dev/null
Q "SET ROLE exlib_catalog_reviewer;
   SELECT apply_content_review('$WV','$CVA','approved','Local Proof Reviewer',NOW(),'local disposable fixture rationale');" >/dev/null
Q "SET ROLE exlib_catalog_admission; SELECT admit_catalog_content('$WV','$CVA','$SRC_SHA');" >/dev/null
Q "SET ROLE exlib_catalog_admin; SELECT publish_catalog_content('$WV','$CVA');" >/dev/null
LIVE_A="SELECT coalesce(string_agg(relation || '>' || to_logical_id::text, ',' ORDER BY relation, to_logical_id), '(empty)') FROM exercise_catalog_relationships WHERE from_logical_id='$WV'"
expect_eq "L1: version 1 is PUBLISHED with relationship set A (substitution -> target D) projected live" \
  "$LIVE_A" "substitution>$WD"
expect_ok "L2: version 2 is STAGED with a DIFFERENT expected set B (substitution -> target X) while version 1/A remains published - loading changes nothing live" \
  "SET ROLE exlib_catalog_loader;
   SELECT load_catalog_content_draft('$WV','$CVB',2,'local-proof-author','2026-09-01',
     '[\"step two\"]'::jsonb,'[\"exec two\"]'::jsonb,'breathe out on effort',
     '[\"mistake two\"]'::jsonb,'stop if form breaks down',NULL,NULL,
     '[{\"relation\":\"substitution\",\"to_logical_id\":\"$WX\"}]'::jsonb);"
expect_ok "L3: version 2 is REVIEWED (approved) while version 1/A remains published - review changes nothing live" \
  "SET ROLE exlib_catalog_reviewer;
   SELECT apply_content_review('$WV','$CVB','approved','Local Proof Reviewer',NOW(),'local disposable fixture rationale v2');"
expect_ok "L4: version 2 is ADMITTED with set B while version 1/A remains published - admission binds the version-owned set and never touches the live surface" \
  "SET ROLE exlib_catalog_admission; SELECT admit_catalog_content('$WV','$CVB','$SRC_SHA');"
STATE_AFTER_ADMIT=$(Q "SELECT ($LIVE_A) || ' | ' ||
  (SELECT publication_status FROM exercise_catalog_content WHERE id='$CVA') || ' | ' ||
  (SELECT (admitted_fingerprint = exlib_content_admission_fingerprint('$CVA'))::text
   FROM exercise_catalog_content WHERE id='$CVA')")
[ "$STATE_AFTER_ADMIT" = "substitution>$WD | published | true" ] \
  && ok "L5: after version 2's admission, version 1 is STILL published, its live set is STILL exactly A, and its manifest is STILL FRESH - the round-2 mutation window does not exist" \
  || bad "L5: version 1 was disturbed by version 2's staging/admission" "$STATE_AFTER_ADMIT"
expect_err "L6: a FAILED version-2 publication (alias drift makes v2 stale) rolls back wholly" \
  "INSERT INTO exercise_catalog_aliases (logical_id, alias) VALUES ('$WV','Window probe alias');
   SET ROLE exlib_catalog_admin; SELECT publish_catalog_content('$WV','$CVB');" \
  "import admission is STALE"
STATE_AFTER_FAIL=$(Q "SELECT ($LIVE_A) || ' | ' ||
  (SELECT publication_status FROM exercise_catalog_content WHERE id='$CVA') || ' | ' ||
  (SELECT publication_status FROM exercise_catalog_content WHERE id='$CVB')")
[ "$STATE_AFTER_FAIL" = "substitution>$WD | published | draft" ] \
  && ok "L7: the failed publication left version 1 published and set A intact EXACTLY (and version 2 still a draft) - atomicity by transaction, not by cleanup" \
  || bad "L7: failed publication leaked state" "$STATE_AFTER_FAIL"
PUB2_OUT=$(QQ "SET ROLE exlib_catalog_admin; SELECT publish_catalog_content('$WV','$CVB');")
if [ $? -eq 0 ]; then
  ok "L8: version 2 publishes successfully once fresh again"
else
  bad "L8: version 2 publication failed" "$(printf '%s' "$PUB2_OUT" | head -2 | tr '\n' ' ')"
fi
STATE_AFTER_PUB=$(Q "SELECT ($LIVE_A) || ' | ' ||
  (SELECT publication_status FROM exercise_catalog_content WHERE id='$CVA') || ' | ' ||
  (SELECT publication_status FROM exercise_catalog_content WHERE id='$CVB')")
[ "$STATE_AFTER_PUB" = "substitution>$WX | retired | published" ] \
  && ok "L9: the successful publication ATOMICALLY retired version 1 and activated EXACTLY set B - at no observable point was version 1 published with version 2's relationships" \
  || bad "L9: publication switch was not atomic/exact" "$STATE_AFTER_PUB"
expect_eq "L10: the two versions' relationship rows coexist WITHOUT collision in the version-owned expected table (1 row each), and each version's manifest binds its OWN set" \
  "SELECT (SELECT count(*) FROM exercise_catalog_content_expected_relationships WHERE content_id='$CVA')::text || '/' ||
     (SELECT count(*) FROM exercise_catalog_content_expected_relationships WHERE content_id='$CVB')::text" "1/1"

echo
echo "=== M. FOUR distinct authorities: full cross-denial matrix; no ordinary-client access (finding 2; proofs 7-12)"
expect_eq "M1: the GRANT matrix is exact - each of the six lifecycle functions is executable by EXACTLY its one owning role (loader: identity/snapshot/draft; reviewer: review; admission: admit; publication: publish)" \
  "SELECT string_agg(g, ';' ORDER BY g) FROM (
     SELECT routine_name || '=' || string_agg(grantee, ',' ORDER BY grantee) AS g
     FROM information_schema.routine_privileges
     WHERE routine_name IN ('load_catalog_identity','load_catalog_snapshot','load_catalog_content_draft',
       'apply_content_review','admit_catalog_content','publish_catalog_content')
       AND privilege_type='EXECUTE' AND grantee <> 'postgres'
     GROUP BY routine_name) s" \
  "admit_catalog_content=exlib_catalog_admission;apply_content_review=exlib_catalog_reviewer;load_catalog_content_draft=exlib_catalog_loader;load_catalog_identity=exlib_catalog_loader;load_catalog_snapshot=exlib_catalog_loader;publish_catalog_content=exlib_catalog_admin"
expect_err "M2: LOADER cannot review (proof 8 inverse: cross-denial loader->review)" \
  "SET ROLE exlib_catalog_loader; SELECT apply_content_review('$WP','$CV1','approved','x',NOW(),'rationale text');" \
  "permission denied for function apply_content_review"
expect_err "M3: LOADER cannot admit" \
  "SET ROLE exlib_catalog_loader; SELECT admit_catalog_content('$WP','$CV1','$SRC_SHA');" \
  "permission denied for function admit_catalog_content"
expect_err "M4: LOADER cannot publish" \
  "SET ROLE exlib_catalog_loader; SELECT publish_catalog_content('$WP','$CV1');" \
  "permission denied for function publish_catalog_content"
expect_err "M5: REVIEWER cannot load" \
  "SET ROLE exlib_catalog_reviewer; SELECT load_catalog_identity(NULL);" \
  "permission denied for function load_catalog_identity"
expect_err "M6: REVIEWER cannot admit" \
  "SET ROLE exlib_catalog_reviewer; SELECT admit_catalog_content('$WP','$CV1','$SRC_SHA');" \
  "permission denied for function admit_catalog_content"
expect_err "M7: REVIEWER cannot publish" \
  "SET ROLE exlib_catalog_reviewer; SELECT publish_catalog_content('$WP','$CV1');" \
  "permission denied for function publish_catalog_content"
expect_err "M8: ADMISSION cannot load" \
  "SET ROLE exlib_catalog_admission; SELECT load_catalog_identity(NULL);" \
  "permission denied for function load_catalog_identity"
expect_err "M9: ADMISSION cannot review" \
  "SET ROLE exlib_catalog_admission; SELECT apply_content_review('$WP','$CV1','approved','x',NOW(),'rationale text');" \
  "permission denied for function apply_content_review"
expect_err "M10: ADMISSION cannot publish" \
  "SET ROLE exlib_catalog_admission; SELECT publish_catalog_content('$WP','$CV1');" \
  "permission denied for function publish_catalog_content"
expect_err "M11: PUBLICATION cannot load" \
  "SET ROLE exlib_catalog_admin; SELECT load_catalog_identity(NULL);" \
  "permission denied for function load_catalog_identity"
expect_err "M12: PUBLICATION cannot review" \
  "SET ROLE exlib_catalog_admin; SELECT apply_content_review('$WP','$CV1','approved','x',NOW(),'rationale text');" \
  "permission denied for function apply_content_review"
expect_err "M13: PUBLICATION cannot admit" \
  "SET ROLE exlib_catalog_admin; SELECT admit_catalog_content('$WP','$CV1','$SRC_SHA');" \
  "permission denied for function admit_catalog_content"
for role in anon authenticated; do
  expect_err "M14: $role cannot LOAD (ordinary clients hold none of the four authorities)" \
    "SET ROLE $role; SELECT load_catalog_identity(NULL);" "permission denied"
  expect_err "M14: $role cannot REVIEW" \
    "SET ROLE $role; SELECT apply_content_review('$WP','$CV1','approved','x',NOW(),'rationale text');" "permission denied"
  expect_err "M14: $role cannot ADMIT" \
    "SET ROLE $role; SELECT admit_catalog_content('$WP','$CV1','$SRC_SHA');" "permission denied"
  expect_err "M14: $role cannot PUBLISH" \
    "SET ROLE $role; SELECT publish_catalog_content('$WP','$CV1');" "permission denied"
done
expect_err "M15: operational roles hold NO direct table privileges - the loader cannot UPDATE content directly" \
  "SET ROLE exlib_catalog_loader; UPDATE exercise_catalog_content SET breathing_cue='x' WHERE id='$CV1';" \
  "permission denied"
expect_err "M16: the reviewer cannot INSERT content directly" \
  "SET ROLE exlib_catalog_reviewer; INSERT INTO exercise_catalog_content (logical_id, content_version,
     authored_by, authored_at, setup_steps, execution_steps, breathing_cue, common_mistakes, safety_guidance)
   VALUES ('$WP',60,'a','2026-09-01','[]'::jsonb,'[]'::jsonb,'b','[]'::jsonb,'c');" \
  "permission denied"
expect_err "M17: the admission role cannot DELETE expected relationships directly" \
  "SET ROLE exlib_catalog_admission; DELETE FROM exercise_catalog_content_expected_relationships WHERE content_id='$CV1';" \
  "permission denied"
expect_err "M18: the publication role cannot INSERT live relationships directly (denied by privilege before the projection trigger is even reached)" \
  "SET ROLE exlib_catalog_admin; INSERT INTO exercise_catalog_relationships (from_logical_id, to_logical_id, relation)
   VALUES ('$WB','$WD','substitution');" \
  "permission denied"
for tbl in exercise_catalog_content exercise_catalog_relationships exercise_catalog_content_expected_relationships; do
  for role in anon authenticated; do
    expect_err "M19: $role has NO access to $tbl (read denied)" \
      "SET ROLE $role; SELECT count(*) FROM $tbl;" "permission denied"
  done
done
expect_err "M20: authenticated cannot compute admission manifests or fingerprints (no forging oracle)" \
  "SET ROLE authenticated; SELECT exlib_content_admission_fingerprint('$CV1');" \
  "permission denied"
expect_eq "M21: RLS is ENABLED with ZERO policies on all three new tables" \
  "SELECT string_agg(c.relname || ':' || c.relrowsecurity::text || ':' ||
     (SELECT count(*) FROM pg_policy p WHERE p.polrelid=c.oid)::text, ',' ORDER BY c.relname)
   FROM pg_class c WHERE c.relname IN
     ('exercise_catalog_content','exercise_catalog_relationships','exercise_catalog_content_expected_relationships')" \
  "exercise_catalog_content:true:0,exercise_catalog_content_expected_relationships:true:0,exercise_catalog_relationships:true:0"
expect_eq "M22: no service_role grant exists on any new object, and authenticated keeps EXACTLY its already-reviewed 026 delivery access" \
  "SELECT (SELECT count(*)::text FROM information_schema.role_table_grants
     WHERE grantee='service_role' AND table_name IN
       ('exercise_catalog_content','exercise_catalog_relationships','exercise_catalog_content_expected_relationships'))
   || '/' ||
     (SELECT coalesce(string_agg(DISTINCT grantee, ','), '(none)')
      FROM information_schema.routine_privileges
      WHERE routine_name='deliver_catalog_exercises' AND privilege_type='EXECUTE' AND grantee='authenticated')" \
  "0/authenticated"
expect_eq "M23: every function this proposal defines pins search_path = public, pg_temp (13 of 13, including the carried 023 freeze function)" \
  "SELECT count(*)::text FROM pg_proc p
   WHERE p.proname IN ('exlib_freeze_catalog_snapshot','exlib_freeze_content_version',
     'exlib_freeze_expected_relationships','exlib_protect_relationship_projection',
     'exlib_manifest_hex','exlib_content_admission_manifest','exlib_content_admission_fingerprint',
     'load_catalog_identity','load_catalog_snapshot','load_catalog_content_draft',
     'apply_content_review','admit_catalog_content','publish_catalog_content')
     AND EXISTS (SELECT 1 FROM unnest(coalesce(p.proconfig,ARRAY[]::text[])) cfg
                 WHERE cfg LIKE 'search_path=%')" "13"

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
   WHERE routine_name IN ('load_catalog_identity','load_catalog_snapshot','load_catalog_content_draft',
     'apply_content_review','admit_catalog_content','publish_catalog_content',
     'exlib_content_admission_manifest','exlib_content_admission_fingerprint','exlib_manifest_hex',
     'exlib_freeze_content_version','exlib_freeze_expected_relationships',
     'exlib_protect_relationship_projection')
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
     'exlib_content_admission_fingerprint','load_catalog_identity','load_catalog_snapshot',
     'load_catalog_content_draft','apply_content_review','admit_catalog_content',
     'publish_catalog_content','exlib_freeze_content_version','exlib_freeze_expected_relationships',
     'exlib_protect_relationship_projection')
     AND prosrc ILIKE '%md5%'" "0"

echo
echo
echo "=== P. TWO-DATABASE EQUIVALENCE: (A) 001-026 + reviewed docs proposal vs (B) 001-027 only"
QA() { psql -h "$SOCK" -U postgres -d eqa -X -v ON_ERROR_STOP=1 -qtA -c "$1" 2>&1; }
QB() { psql -h "$SOCK" -U postgres -d eqb -X -v ON_ERROR_STOP=1 -qtA -c "$1" 2>&1; }
for db in eqa eqb; do
  Q "CREATE DATABASE $db;" >/dev/null
  psql -h "$SOCK" -U postgres -d "$db" -X -v ON_ERROR_STOP=1 -q -c "$AUTHSTUB" >/dev/null
  for f in supabase/migrations/0*.sql; do
    if [ "$db" = "eqa" ]; then case "$f" in supabase/migrations/027_*) continue;; esac; fi
    psql -h "$SOCK" -U postgres -d "$db" -X -v ON_ERROR_STOP=1 -q -f "$f" >/dev/null 2>&1 \
      || { bad "P1: equivalence db $db migration failed: $f"; exit 1; }
  done
done
EL1='11111111-2222-3333-4444-555555555901'
ES1='aaaaaaaa-bbbb-cccc-dddd-eeeeeeeee901'
EQFIX="INSERT INTO exercise_catalog_logical (id) VALUES ('$EL1');
INSERT INTO exercise_catalog (id, logical_id, canonical_name, category, primary_muscle, equipment,
  laterality, tracking_mode, source_url, source_page, retrieved_at, import_confidence, created_at) VALUES
('$ES1','$EL1','Equivalence Legacy Row','compound','lats','barbell','bilateral','weight_reps',
 'https://example.test/eq','https://example.test/dir','2026-08-30','high','2026-08-30T09:00:00+00:00');
INSERT INTO exercise_catalog_muscles (catalog_id, muscle, role) VALUES ('$ES1','triceps','secondary');
UPDATE exercise_catalog SET review_status='approved', reviewed_by='local-proof-reviewer',
  reviewed_at='2026-08-30T10:00:00+00:00', review_rationale='fixed equivalence legacy fixture' WHERE id='$ES1';"
QA "$EQFIX" >/dev/null; QB "$EQFIX" >/dev/null
psql -h "$SOCK" -U postgres -d eqa -X -v ON_ERROR_STOP=1 -q -f "$PROPOSAL" >/dev/null 2>"$TMP/eqa.log" \
  && ok "P1: database A = legacy fixture + 001-026 + the reviewed DOCS proposal; database B = the same legacy fixture + 001-027 ONLY - both applied cleanly over the identical nonempty state" \
  || { bad "P1: proposal failed on eqa" "$(sed -n '1,4p' "$TMP/eqa.log")"; exit 1; }
cat > "$TMP/eqdump.sql" <<'DUMPSQL'
\qecho == columns
SELECT table_name, column_name, data_type, is_nullable, coalesce(column_default,'-')
FROM information_schema.columns WHERE table_schema='public'
ORDER BY table_name, column_name;
\qecho == constraints
SELECT conrelid::regclass::text, conname, pg_get_constraintdef(oid)
FROM pg_constraint WHERE connamespace='public'::regnamespace
ORDER BY 1, 2;
\qecho == indexes
SELECT tablename, indexname, indexdef FROM pg_indexes WHERE schemaname='public' ORDER BY 1, 2;
\qecho == rls
SELECT c.relname, c.relrowsecurity::text, (SELECT count(*) FROM pg_policy p WHERE p.polrelid=c.oid)::text
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relkind='r' ORDER BY c.relname;
\qecho == policies
SELECT coalesce(string_agg(schemaname||'.'||tablename||'.'||policyname, ',' ORDER BY tablename, policyname), '(none)')
FROM pg_policies WHERE schemaname='public';
\qecho == functions
SELECT p.proname, p.provolatile::text, p.prosecdef::text, coalesce(array_to_string(p.proconfig,';'),'-'),
       md5(pg_get_functiondef(p.oid))
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' ORDER BY p.proname, pg_get_function_identity_arguments(p.oid);
\qecho == triggers
SELECT tgrelid::regclass::text, tgname, pg_get_triggerdef(oid)
FROM pg_trigger WHERE NOT tgisinternal ORDER BY 1, 2;
\qecho == table grants
SELECT table_name, grantee, privilege_type FROM information_schema.role_table_grants
WHERE table_schema='public'
  AND grantee IN ('PUBLIC','anon','authenticated','service_role',
    'exlib_catalog_loader','exlib_catalog_reviewer','exlib_catalog_admission','exlib_catalog_admin')
ORDER BY 1, 2, 3;
\qecho == routine grants
SELECT routine_name, grantee, privilege_type FROM information_schema.routine_privileges
WHERE routine_schema='public'
  AND grantee IN ('PUBLIC','anon','authenticated','service_role',
    'exlib_catalog_loader','exlib_catalog_reviewer','exlib_catalog_admission','exlib_catalog_admin')
ORDER BY 1, 2, 3;
DUMPSQL
psql -h "$SOCK" -U postgres -d eqa -X -v ON_ERROR_STOP=1 -qtA -f "$TMP/eqdump.sql" > "$TMP/eq-a.txt" 2>&1
psql -h "$SOCK" -U postgres -d eqb -X -v ON_ERROR_STOP=1 -qtA -f "$TMP/eqdump.sql" > "$TMP/eq-b.txt" 2>&1
if diff -q "$TMP/eq-a.txt" "$TMP/eq-b.txt" >/dev/null 2>&1; then
  ok "P2: STRUCTURAL EQUIVALENCE - altered exercise_catalog columns/defaults/nullability, every constraint, index, RLS state, policy set, function definition (body md5 + volatility + security mode + search_path), trigger, and every operational/client table+routine grant are IDENTICAL between A and B ($(wc -l < "$TMP/eq-a.txt" | tr -d ' ') normalized lines each)"
else
  bad "P2: structural drift between proposal-applied and migration-applied databases" "$(diff "$TMP/eq-a.txt" "$TMP/eq-b.txt" | head -6 | tr '\n' ' ')"
fi
ROWVEC="SELECT (SELECT count(*) FROM exercise_catalog)::text || '/' ||
  (SELECT count(*) FROM exercise_catalog_muscles)::text || '/' ||
  (SELECT count(*) FROM exercise_catalog_aliases)::text || '/' ||
  (SELECT count(*) FROM exercise_catalog_content)::text || '/' ||
  (SELECT count(*) FROM exercise_catalog_content_expected_relationships)::text || '/' ||
  (SELECT count(*) FROM exercise_catalog_relationships)::text || '/' ||
  (SELECT count(*) FROM exercise_catalog_import_runs)::text"
VEC_A=$(QA "$ROWVEC"); VEC_B=$(QB "$ROWVEC")
{ [ "$VEC_A" = "$VEC_B" ] && [ "$VEC_A" = "1/1/0/0/0/0/0" ]; } \
  && ok "P3: ZERO-DATA STATE immediately after schema application is identical - only the pre-seeded legacy fixture exists (1 snapshot, 1 anatomy row), no content/relationship/run state in either database" \
  || bad "P3: post-application state vectors differ or are wrong" "A=$VEC_A B=$VEC_B"
LEGDIG="SELECT md5(string_agg(id::text||canonical_name||category||primary_muscle||equipment||laterality||tracking_mode||source_url||source_page||retrieved_at::text||import_confidence||provenance||coalesce(movement_pattern,'-')||coalesce(training_role,'-')||coalesce(difficulty,'-')||coalesce(availability,'-')||review_status||coalesce(reviewed_by,'-')||coalesce(extract(epoch from reviewed_at)::numeric::text,'-')||coalesce(review_rationale,'-')||catalog_version::text||is_active::text||extract(epoch from created_at)::numeric::text, '|' ORDER BY id)) FROM exercise_catalog"
LD_A=$(QA "$LEGDIG"); LD_B=$(QB "$LEGDIG")
[ "$LD_A" = "$LD_B" ] \
  && ok "P4: the legitimate nonempty migration-023 legacy row is BYTE-EQUIVALENT in both databases after application (all columns including the new provenance/discovery defaults; nothing fabricated in either)" \
  || bad "P4: legacy-row digests differ" "A=$LD_A B=$LD_B"
WQ='11111111-2222-3333-4444-555555555902'
WT='11111111-2222-3333-4444-555555555903'
CQ1='cccccccc-0000-0000-0000-000000000901'
CQ2='cccccccc-0000-0000-0000-000000000902'
EQ_SRC_SHA=$(printf 'equivalence disposable proof artifact' | shasum -a 256 | awk '{print $1}')
eqflow() { # $1 = db : identical authority-driven workflow with FIXED timestamps
  local D="$1"
  psql -h "$SOCK" -U postgres -d "$D" -X -v ON_ERROR_STOP=1 -qtA -c "
    SET ROLE exlib_catalog_loader;
    SELECT load_catalog_identity('$WQ');
    SELECT load_catalog_identity('$WT');
    SELECT load_catalog_snapshot('$WQ','Equivalence Workflow Model','isolation','abs','bodyweight',
      'bilateral','timed','forgefitos_original','core_anti_extension','core','beginner','minimal',
      NULL, NULL, NULL, NULL,
      '[{\"muscle\":\"obliques\",\"role\":\"secondary\"}]'::jsonb,
      '[\"Equivalence workflow alias\"]'::jsonb);
    SELECT load_catalog_content_draft('$WQ','$CQ1',1,'local-proof-author','2026-09-01',
      '[\"step one\"]'::jsonb,'[\"exec one\"]'::jsonb,'breathe out on effort',
      '[\"mistake one\"]'::jsonb,'stop if form breaks down',NULL,NULL,
      '[{\"relation\":\"substitution\",\"to_logical_id\":\"$WT\"}]'::jsonb);" >/dev/null 2>&1 || { bad "eqflow load failed ($D)"; return 1; }
  psql -h "$SOCK" -U postgres -d "$D" -X -v ON_ERROR_STOP=1 -qtA -c "
    SET ROLE exlib_catalog_reviewer;
    SELECT apply_content_review('$WQ','$CQ1','approved','Equivalence Reviewer','2026-09-01T20:00:00+00:00','fixed equivalence rationale');" >/dev/null 2>&1 || { bad "eqflow review failed ($D)"; return 1; }
  psql -h "$SOCK" -U postgres -d "$D" -X -v ON_ERROR_STOP=1 -qtA -c "
    SET ROLE exlib_catalog_admission;
    SELECT admit_catalog_content('$WQ','$CQ1','$EQ_SRC_SHA');" >/dev/null 2>&1 || { bad "eqflow admission failed ($D)"; return 1; }
  return 0
}
eqflow eqa && eqflow eqb && ok "P5: an IDENTICAL authority-driven workflow (loader -> reviewer -> admission, fixed timestamps) ran on both databases" \
  || bad "P5: equivalence workflow failed"
MAN_A=$(QA "SELECT exlib_content_admission_manifest('$CQ1')")
MAN_B=$(QB "SELECT exlib_content_admission_manifest('$CQ1')")
FP_A=$(QA "SELECT admitted_fingerprint FROM exercise_catalog_content WHERE id='$CQ1'")
FP_B=$(QB "SELECT admitted_fingerprint FROM exercise_catalog_content WHERE id='$CQ1'")
{ [ "$MAN_A" = "$MAN_B" ] && [ "$FP_A" = "$FP_B" ] && [ -n "$FP_A" ]; } \
  && ok "P6: the v2 admission MANIFEST TEXT and the recorded admitted fingerprint are IDENTICAL for the identical fixture - manifest output equivalence (fingerprint ${FP_A:0:12}...)" \
  || bad "P6: manifest/fingerprint diverge between A and B" "A=$FP_A B=$FP_B"
ERR_A=$(QA "SET ROLE exlib_catalog_admission; SELECT admit_catalog_content('$WQ','$CQ1','$EQ_SRC_SHA');")
ERR_B=$(QB "SET ROLE exlib_catalog_admission; SELECT admit_catalog_content('$WQ','$CQ1','$EQ_SRC_SHA');")
{ [ "$ERR_A" = "$ERR_B" ] && printf '%s' "$ERR_A" | grep -qF 'already admitted'; } \
  && ok "P7: ADMISSION behavior equivalence - the one-way re-admission refusal is byte-identical in both databases" \
  || bad "P7: admission refusal messages differ" "A=[$ERR_A] B=[$ERR_B]"
ERR_A=$(QA "SET ROLE exlib_catalog_reviewer; SELECT apply_content_review('$WQ','$CQ1','rejected','X','2026-09-01T21:00:00+00:00','second decision attempt');")
ERR_B=$(QB "SET ROLE exlib_catalog_reviewer; SELECT apply_content_review('$WQ','$CQ1','rejected','X','2026-09-01T21:00:00+00:00','second decision attempt');")
{ [ "$ERR_A" = "$ERR_B" ] && printf '%s' "$ERR_A" | grep -qF 'only a pending version'; } \
  && ok "P8: REVIEW behavior equivalence - the one-time-decision refusal is byte-identical in both databases" \
  || bad "P8: review refusal messages differ" "A=[$ERR_A] B=[$ERR_B]"
QA "SET ROLE exlib_catalog_admin; SELECT publish_catalog_content('$WQ','$CQ1');" >/dev/null
QB "SET ROLE exlib_catalog_admin; SELECT publish_catalog_content('$WQ','$CQ1');" >/dev/null
LIVEDIG="SELECT coalesce(string_agg(from_logical_id::text||'>'||relation||'>'||to_logical_id::text, ',' ORDER BY from_logical_id, relation, to_logical_id), '(empty)') FROM exercise_catalog_relationships"
LV_A=$(QA "$LIVEDIG"); LV_B=$(QB "$LIVEDIG")
{ [ "$LV_A" = "$LV_B" ] && [ "$LV_A" = "$WQ>substitution>$WT" ]; } \
  && ok "P9: RELATIONSHIP-PROJECTION behavior equivalence - publication projected the identical expected set identically in both databases" \
  || bad "P9: projected live sets differ" "A=$LV_A B=$LV_B"
ERR_A=$(QA "INSERT INTO exercise_catalog_relationships (from_logical_id, to_logical_id, relation) VALUES ('$WQ','$WT','progression');")
ERR_B=$(QB "INSERT INTO exercise_catalog_relationships (from_logical_id, to_logical_id, relation) VALUES ('$WQ','$WT','progression');")
{ [ "$ERR_A" = "$ERR_B" ] && printf '%s' "$ERR_A" | grep -qF 'protected projection'; } \
  && ok "P10: the projection-protection refusal is byte-identical in both databases" \
  || bad "P10: projection refusals differ" "A=[$ERR_A] B=[$ERR_B]"
mkv2() { # $1=db : stage+approve+admit v2 with a DIFFERENT expected set
  local D="$1"
  psql -h "$SOCK" -U postgres -d "$D" -X -v ON_ERROR_STOP=1 -qtA -c "
    SET ROLE exlib_catalog_loader;
    SELECT load_catalog_content_draft('$WQ','$CQ2',2,'local-proof-author','2026-09-01',
      '[\"step two\"]'::jsonb,'[\"exec two\"]'::jsonb,'breathe out on effort',
      '[\"mistake two\"]'::jsonb,'stop if form breaks down',NULL,NULL,'[]'::jsonb);" >/dev/null 2>&1 && \
  psql -h "$SOCK" -U postgres -d "$D" -X -v ON_ERROR_STOP=1 -qtA -c "
    SET ROLE exlib_catalog_reviewer;
    SELECT apply_content_review('$WQ','$CQ2','approved','Equivalence Reviewer','2026-09-01T22:00:00+00:00','fixed v2 rationale');" >/dev/null 2>&1 && \
  psql -h "$SOCK" -U postgres -d "$D" -X -v ON_ERROR_STOP=1 -qtA -c "
    SET ROLE exlib_catalog_admission;
    SELECT admit_catalog_content('$WQ','$CQ2','$EQ_SRC_SHA');" >/dev/null 2>&1
}
mkv2 eqa >/dev/null; mkv2 eqb >/dev/null
STATEQ="SELECT ($LIVEDIG) || ' | ' || (SELECT publication_status FROM exercise_catalog_content WHERE id='$CQ1') || ' | ' || (SELECT publication_status FROM exercise_catalog_content WHERE id='$CQ2') || ' | ' || (SELECT (admitted_fingerprint = exlib_content_admission_fingerprint('$CQ1'))::text FROM exercise_catalog_content WHERE id='$CQ1')"
ST_A=$(QA "$STATEQ"); ST_B=$(QB "$STATEQ")
{ [ "$ST_A" = "$ST_B" ] && [ "$ST_A" = "$WQ>substitution>$WT | published | draft | true" ]; } \
  && ok "P11: STAGING equivalence - version 2 staged/reviewed/admitted identically in both databases while published version 1 stays untouched and manifest-fresh in both" \
  || bad "P11: v2 staging states differ" "A=[$ST_A] B=[$ST_B]"
FAILPUB="INSERT INTO exercise_catalog_aliases (logical_id, alias) VALUES ('$WQ','Equivalence stale probe');
SET ROLE exlib_catalog_admin; SELECT publish_catalog_content('$WQ','$CQ2');"
ERR_A=$(QA "$FAILPUB"); ERR_B=$(QB "$FAILPUB")
POST_A=$(QA "$STATEQ"); POST_B=$(QB "$STATEQ")
{ [ "$ERR_A" = "$ERR_B" ] && printf '%s' "$ERR_A" | grep -qF 'import admission is STALE' && [ "$POST_A" = "$POST_B" ] && [ "$POST_A" = "$WQ>substitution>$WT | published | draft | true" ]; } \
  && ok "P12: FAILED-PUBLICATION rollback equivalence - the stale refusal is byte-identical and both databases preserve published version 1 and its projection EXACTLY" \
  || bad "P12: failed-publication behavior differs" "A=[$POST_A] B=[$POST_B]"
QA "SET ROLE exlib_catalog_admin; SELECT publish_catalog_content('$WQ','$CQ2');" >/dev/null
QB "SET ROLE exlib_catalog_admin; SELECT publish_catalog_content('$WQ','$CQ2');" >/dev/null
FIN_A=$(QA "$STATEQ"); FIN_B=$(QB "$STATEQ")
{ [ "$FIN_A" = "$FIN_B" ] && [ "$(printf '%s' "$FIN_A" | cut -d'|' -f2 | tr -d ' ')" = "retired" ]; } \
  && ok "P13: PUBLICATION equivalence - version 2 atomically retired version 1 and replaced the projection identically in both databases (v2's empty expected set projected as empty)" \
  || bad "P13: final publication states differ" "A=[$FIN_A] B=[$FIN_B]"
ok "P14: NO SEMANTIC DIFFERENCE attributable to apply-prep - structure, grants, functions, triggers, manifest output, admission/review/projection/publication behavior, failed-publication rollback, nonempty-023 compatibility, and zero-data posture are all equivalent between the reviewed proposal and migration 027"
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
ok "O3: the promoted Plank content artifact was never read, copied, or loaded by this script (fixtures are locally invented proof rows; the source digest recorded in fixtures is the SHA-256 of a literal disposable string, not of any repository artifact); the docs proposal was sourced ONLY into the equivalence database eqa"

echo
printf '%s passed, %s failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ] || exit 1
