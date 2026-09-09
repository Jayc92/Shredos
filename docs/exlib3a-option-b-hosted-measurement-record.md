# EXLIB-3A OPTION B — hosted current-state measurement record

Recorded 2026-09-09 (UTC). The reviewed, Codex-approved OPTION B
read-only measurement package WAS EXECUTED ONCE against the hosted
Supabase project ShredOS (ref ttybyljytiwntvorugcv) by the operator
path under the operator's explicit one-use OPTION B authorization,
followed by the single permitted read-only SECURITY advisor
observation. No retry occurred. THE ONE-USE OPTION B AUTHORIZATION
WAS CONSUMED BY THAT ATTEMPT AND IS SPENT — no further hosted query
may be run under it. Claude performed no hosted contact: every
hosted fact below is operator-supplied evidence, cross-checked
mechanically against repository bytes by
scripts/verify-exlib3a-option-b-application.ts. This record
approves nothing: the OPTION A decision and any activation
authorization remain separate gates, and S6 activation remains
STOPPED.

## 1. Source identity and transport provenance

- Source package: docs/exlib3a-option-b-current-state-measurement.sql,
  14,101 bytes, sha256
  1e9a60eca9f83b13ab603600272dd3ac3f532cf38d304259c7a584e47fd296ea
  — mechanically verified by the operator immediately before
  submission, and byte-identical live and at the reviewed candidate
  3442c8f0f53f70ca367bfe10876dd3cd79fc8456 (chain 5ed6fd84... ->
  548849c0... -> 872e19ef... -> ba6a6ca6... -> 3442c8f0...).
- TRANSPORT PROVENANCE IS BOUNDED (the standing distinction): the
  Supabase execution transport returned NO complete byte-for-byte
  echo and NO hash of the submitted raw SQL payload, so exact
  transport-payload byte identity is not independently preserved
  post hoc. SOURCE identity is mechanical; the successful COMPLETE
  fifty-row result set establishes execution of the intended
  read-only measurement shape.

## 2. The gate checks (green immediately before execution)

Project ref ttybyljytiwntvorugcv; project ShredOS observed
ACTIVE_HEALTHY; the reviewed source package fingerprint re-measured
at the gate (section 1); run key
exlib2u-plank-release1-staged-v1; the one-use authorization
unspent immediately before the attempt.

## 3. The complete returned result set (operator-supplied; one
result set, fifty rows)

- package = exlib3a-option-b-current-state-measurement-v1 (the
  package's constant self-identity row; its value is fixed by the
  fingerprint-verified source bytes and returned as part of the
  attested complete fifty-row set)
- observed_at = 2026-09-09 02:27:31.8287+00 (PostgreSQL's
  TRANSACTION-START timestamp — temporal context; the data rows
  share the single SELECT's statement snapshot; the exact MVCC
  snapshot-acquisition instant is not surfaced)
- executor = postgres
- runs_total = 1
- target_run_key = exlib2u-plank-release1-staged-v1
- target_run_found = 1
- target_run_id = 6669ba78-8e75-4042-ac2a-14082a9e5940
- target_run_created_at = 2026-09-08 05:26:09.940165+00
- target_run_dry_run = false
- target_run_approved_for_delivery = true
- target_run_sealed_at = 2026-09-08 21:24:23.744781+00
- target_run_revoked_at = <null-or-absent>
- target_run_started_at = <null-or-absent>
- target_run_completed_at = <null-or-absent>
- target_run_result_counts = <null-or-absent>
- target_run_product_approved_by = Joseph Carfagno
- target_run_product_approved_at = 2026-09-07 15:05:00+00
- target_run_legal_approved_by = Joseph Carfagno
- target_run_legal_approved_at = 2026-09-07 15:05:00+00
- target_run_approval_rationale_md5 =
  ca1acc7c1ef7c5a47ee7e7e286620dc5
- run_items_total = 6
- target_run_items = 6
- target_run_exercise_members = 3
- target_run_alias_members = 3
- items_outside_target_run = 0
- target_run_member_surface: OPERATOR-ATTESTED AS RETURNED EXACTLY
  AS EXPECTED (provenance note, section 5): the verbatim returned
  string was not restated in the operator handoff; the EXPECTED
  surface it was attested against is the governed six-member
  surface reserved since EXLIB-2U, semicolon-joined in the
  package's deterministic ordering:
  alias#e21b2c00-0000-4000-a000-000000000001#Forearm plank;
  alias#e21b2c00-0000-4000-a000-000000000001#Front plank;
  alias#e21b2c00-0000-4000-a000-000000000003#Ab roller rollout;
  exercise#e21b2c00-0000-4000-a000-000000000001;
  exercise#e21b2c00-0000-4000-a000-000000000002;
  exercise#e21b2c00-0000-4000-a000-000000000003
- delivered_exercises_total = 0
- delivered_exercises_target_run = 0
- delivered_aliases_total = 0
- delivered_aliases_target_run = 0
- corrections_total = 0
- delivered_exercises_corrected_in_place = 0
- delivered_exercises_not_corrected_in_place = 0
- cat_logical = 3
- cat_snapshots = 3
- cat_muscles = 5
- cat_aliases = 3
- cat_name_claims = 6
- cat_content = 1
- cat_expected_relationships = 2
- cat_relationships = 2
- cat_import_runs = 1
- cat_run_items = 6
- cat_review_events = 3
- vector_string = 3/3/5/3/6/1/2/2/1/6/3
- tenant_exercises = 84
- tenant_exercise_aliases = 0
- delivery_predicate_rows = 1
- claims_orphaned = 0
- claims_unclaimed_bearers = 0

## 4. Interpretation applied (exactly as predeclared; nothing new
decided here)

- ZERO provenance-linked rows on every measured surface
  (delivered_exercises_total, delivered_exercises_target_run,
  delivered_aliases_total, delivered_aliases_target_run,
  corrections_total, and both corrected-in-place split counts all
  exactly 0): NO PERSISTENT DELIVERY-ASSOCIATED TENANT STATE EXISTS
  AT THE MEASUREMENT SNAPSHOT on the measured provenance surfaces.
  This does NOT prove the delivery RPC was never invoked or
  attempted, and it identifies no who, no when, and no path — the
  promoted function's lawful idempotent, collision, and skip
  outcomes leave no new provenance-linked rows.
- The HISTORICAL S5 post-COMMIT observation gaps remain HISTORICAL
  and are NOT retroactively closed by this measurement. These are
  new current-state facts with exact-COUNT(*) provenance — the
  instrument the round-2 EXLIB-2Z correction required — not a
  rewrite of the earlier record.
- RUN POSTURE INTACT, cross-checked against the promoted records:
  exactly one run; the preserved hosted surrogate and its creation
  instant exact; dry_run false; approved and sealed at exactly the
  preserved seal instant; unrevoked; all operational fields null;
  both approver identities and the 15:05Z authority instant exact;
  the approval-rationale md5 equal to the md5 of the reserved
  rationale recomputed from the byte-frozen authority artifact.
  Membership exactly 6 = 3 + 3 with zero items outside the run;
  the catalog vector, tenant cardinalities, delivery predicate
  (1 — the sealed run remains delivery-eligible), and claims
  invariant (0/0) all exactly the closed-S5 state.
- NO STOP CONDITION WAS TRIGGERED: no nonzero provenance rows, no
  missing or duplicate run, no revoked or contradictory posture,
  no unexpected membership, no predicate contradiction.

## 5. Evidence provenance map (kept distinct)

1. MECHANICALLY VERIFIED SOURCE: the package fingerprint at the
   gate and in the repository (section 1).
2. HOSTED TRANSPORT RETURN: the single fifty-row result set of
   section 3 — the execution's directly returned output, with
   observed_at as transaction-start temporal context.
3. OPERATOR ATTESTATION: the target_run_member_surface value —
   attested "returned exactly as expected" in the handoff without
   the verbatim string being restated; recorded here as an
   attestation against the quoted governed expectation, NEVER as a
   verbatim capture. Every other section 3 value was supplied
   explicitly in the handoff.
4. ADVISOR OBSERVATION: section 6, observed only.
5. BOUNDED TRANSPORT-PAYLOAD IDENTITY: section 1's standing
   limitation — no byte echo/hash of the submitted payload.
6. HISTORICAL GAPS: unchanged and untouched (section 4).

## 6. The single permitted advisor observation (SECURITY class;
observed only, zero remediation)

Observed at approximately 2026-09-09T02:27:38.675Z: 20 security
notices, distributed exactly as 13 RLS-enabled/no-policy; 2 mutable
function search paths; 1 anonymous-callable SECURITY DEFINER
function; 3 authenticated-callable SECURITY DEFINER functions; 1
leaked-password-protection notice. The authenticated SECURITY
DEFINER set includes deliver_catalog_exercises, rls_auto_enable,
and rollback_catalog_delivery — independently re-confirming the
standing authenticated direct-RPC delivery reachability that the
application flag does not control. No advisor setting or finding
was modified. PROVENANCE NOTE: the one permitted observation was
spent on the SECURITY class as most relevant to the S6 decision;
the performance class was NOT observed by this capture.

## 7. Chronology (every instant parses and orders)

The staged run's creation (2026-09-08T05:26:09.940165Z) precedes
the seal (2026-09-08T21:24:23.744781Z), which precedes this
measurement's transaction start (2026-09-09T02:27:31.8287Z), which
precedes the advisor observation (2026-09-09T02:27:38.675Z). The
returned created_at and sealed_at equal the instants preserved by
the promoted EXLIB-2U and EXLIB-2Z records (proven by parse), and
the returned approval instants equal the reserved
2026-09-07T11:05:00-04:00 authority instant (= 15:05Z, proven by
parse).

## 8. Decision implication (bounded)

The measured current facts SUPPORT reconsidering OPTION A
(controlled activation preparation): no persistent
delivery-associated tenant state exists now on the measured
surfaces, the run posture is exactly the sealed state, membership
and the catalog vector are exact, tenant cardinalities are
coherent, the delivery predicate remains live, and the claims
invariant is clean. THIS AUTHORIZES NOTHING: the OPTION A decision
is the operator's, the activation package would be its own authored
and reviewed milestone, any activation act would need its own
one-use human authorization, and S6 activation remains STOPPED
throughout.

## 9. Verifier lifecycle for this milestone

scripts/verify-exlib3a-option-b-application.ts (new, static,
read-only, in the battery; no hosted contact — nothing re-observed)
proves: the SPENT posture and the executed package's byte identity
(live file AND candidate-tip blob against the fingerprint the prep
record pinned, extracted from those bytes); the source-versus-
transport provenance distinction; the COMPLETE metric census — the
metric keys extracted from the PACKAGE's own bytes must each appear
exactly once in this record with the section 3 values, including
the seven all-zero provenance surfaces, the vector re-derived from
the eleven individual cardinalities, the 84/0 tenants, predicate 1,
and claims 0/0; the cross-record posture identity (the surrogate
and creation instant against the promoted EXLIB-2U record, the seal
instant against the promoted EXLIB-2Z record, the approval instants
against the reserved authority artifact by parse, and the rationale
md5 RECOMPUTED from the artifact's rationale bytes); the
member-surface attestation honesty (the quoted expectation equal to
the packages' governed surface, the value marked ATTESTED and never
verbatim-captured); the predeclared interpretation applied without
overstatement; the advisor arithmetic (13+2+1+3+1 = 20), the three
named authenticated functions, the security-class-only disclosure,
and the zero-remediation statement; the full chronology by parse;
the bounded decision implication (supports reconsidering A;
authorizes nothing; S6 STOPPED); the boundary; hygiene; and
topology including the labeled completed-phase retarget of section
10.

## 10. Stale-claim sweep and battery reconciliation

The sweep against a simulated commit built from the intended phase
paths (before the retarget; measured 102 suites / 7,263 checks / 2
failures) enumerated exactly ONE stale historical check —
verify-exlib3a-option-b B14's completed-phase topology (its
committed branch pinned exactly two commits over 872e19ef..., true
until this evidence milestone's own commit; its uncommitted branch
could not describe this milestone's authoring state) — the
recurring completed-phase pattern (fourteenth instance), retargeted
count-neutral under the exact label `RETARGET (EXLIB-3A OPTION B
hosted-measurement evidence)` to anchor at that phase's own
corrected candidate 3442c8f0f53f70ca367bfe10876dd3cd79fc8456, where
the chain and inventories held and hold forever. The only other red
was this milestone's OWN new verifier holding its
retarget-coverage check red until the retarget landed — the guard
authored before the repair. With the retarget in place the
simulated-commit battery, the committed battery, and the
fresh-clone battery all read 102 suites / 7,263 checks / 0 failures
— the prior baseline 101/7,251 plus exactly this milestone's new
12-check static suite and nothing else.

## 11. What did NOT happen (the boundary)

Exactly one hosted measurement attempt occurred, by the operator
path, and it succeeded; the one-use authorization is SPENT; no
retry; no individual SELECT was re-run; no estimate or metadata
instrument was substituted. No delivery call, no revocation, no
restore, no environment or delivery-variable change, no S6
activation or preparation, no EXLIB-2S act, no push, no tag, no
manual Vercel action, and no advisor remediation. No hosted contact
by Claude at any point. The hosted run remains SEALED and SPENT;
the historical gaps remain exactly as recorded.

## 12. Stop condition

This milestone stops LOCAL-ONLY on its branch for Codex review. The
next gated steps, in order, each separate: Codex review of this
evidence record; the operator's formal OPTION A decision (or C);
if A, the activation-package milestone (authoring and review of the
exact activation runbook — variables, deploy event, observation
protocol, rollback — as its own proposal); and only after its own
one-use human authorization, any activation act. S6 activation
remains STOPPED throughout this record's scope.
