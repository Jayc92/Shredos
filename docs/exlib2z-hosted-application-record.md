# EXLIB-2Z — hosted S5 seal application record

Recorded 2026-09-08 (UTC). The reviewed, Codex-approved EXLIB-2Z S5
seal package WAS EXECUTED ONCE against the hosted Supabase project
ShredOS (ref ttybyljytiwntvorugcv) by the operator path
(ChatGPT/Codex) under the operator's explicit one-use section-17
authorization, issued with the delivery-activation consequence
explicitly accepted. THE ONE-USE S5 AUTHORIZATION IS CONSUMED AND
SPENT — DO NOT RERUN THE SEAL PACKAGE. Claude performed no hosted
contact: every hosted fact below is operator-supplied evidence from
the executor's preflight, execution, and post-COMMIT observation,
cross-checked mechanically against the repository bytes by
scripts/verify-exlib2z-application.ts. This record approves nothing
further: the sealed run is NOT revoked and NOT delivered by any
operator action, and delivery configuration (S6), revocation, and
every later act all remain separately gated.

## 1. What was executed (source identity and transport provenance)

- Package: docs/exlib2z-s5-seal-package.sql, 42,012 bytes, sha256
  701302cb3baa36a510f96163ca5393ac63475d78463607757b02bd46b5015e6a,
  at the corrected candidate
  3969a98fc809cf69fb8a19c411de63d919db3ef7 (the Codex round-1
  corrected tip; preparation history preserved:
  290f9bbbfea84ac6bcd2cefb59f7bed2247e2021 ->
  dc3e83a89f086e636e7fe3aefc086872dbfefcb5 -> 3969a98f...).
  SOURCE IDENTITY IS MECHANICAL: the reviewed local file and the
  candidate-tip Git blob are byte-exact at that fingerprint, and
  the operator reports mechanically reverifying the uploaded file's
  size and hash immediately before execution.
- TRANSPORT PROVENANCE IS BOUNDED (round-1 correction): the
  Supabase execution interface accepted a raw SQL string and
  returned NO byte-for-byte echo and NO hash of the submitted
  transport payload, so exact raw transport-payload byte identity
  is not independently mechanically preserved post hoc — hashing
  the local file does not, by itself, mechanically prove the byte
  identity of the actual connector payload. What the evidence
  establishes is: the operator submitted the S5 SQL through the
  raw-SQL execution path intending the reviewed package, and the
  successful COMMIT with the surfaced EXLIB-2Z SEALED row
  establishes that the submitted transaction performed the reviewed
  S5 transition and passed its included fail-closed preconditions,
  four-field function-result validation, and postconditions. This
  is an evidence-provenance limitation only; it does not invalidate
  the hosted seal.
- Executed exactly once; no retry occurred after any outcome. The
  one-use authorization is consumed by the attempt and is SPENT.

## 2. Pre-execution facts (operator-path evidence)

- Project ShredOS ref ttybyljytiwntvorugcv observed ACTIVE_HEALTHY;
  executor posture observed current_user = postgres before
  execution.
- Spent-check immediately before execution read the staged posture
  exactly: approved_for_delivery = false, sealed_at NULL,
  revoked_at NULL.
- The preserved hosted run surrogate and identity matched exactly:
  id 6669ba78-8e75-4042-ac2a-14082a9e5940, run_key
  exlib2u-plank-release1-staged-v1, database-created instant
  2026-09-08T05:26:09.940165Z — the literals the promoted EXLIB-2U
  hosted-application record preserved.
- Immediately observed preflight member counts: 3 exercise / 3
  alias. Preflight delivery predicate rows: 0. Preflight delivered
  tenant rows: 0. Preflight tenant aliases: 0.
- A current PHYSICAL backup was HUMAN-OBSERVED in the Supabase
  Dashboard: 2026-09-08 13:07:48 +0000, with prior daily physical
  backups also visible (see the rewind-horizon note in section 6).

## 3. The execution and the surfaced transport row

Exactly ONE hosted S5 package attempt occurred, and it SUCCEEDED.
The transport surfaced the package's final result row:

- result = EXLIB-2Z SEALED
- runs = 1
- run_items = 6
- approved_for_delivery = true
- sealed_at = 2026-09-08 21:24:23.744781+00 (the same instant as
  2026-09-08T21:24:23.744781Z, proven by parse)
- unrevoked = true
- delivery_predicate_rows = 1
- delivered_tenant_rows = 0

Because the complete SQL query returned successfully through
COMMIT, every in-package precondition, the exact four-field
function-result validation, and every postcondition passed — a
failure of ANY of them would have raised and rolled the whole
transaction back, seal included (the reviewed package's proven
fail-closed shape).

EVIDENCE PRECISION (preserve this distinction): the inner JSONB
returned by exlib_approve_and_seal_run ({run_key, sealed true,
exercise_members 3, alias_members 3}) was validated INSIDE the
package against the exact expected four-field object; it was NOT
separately surfaced by the transport and is NOT represented here as
independently transport-observed. The transport-observed evidence
is the EXLIB-2Z SEALED row above; the four-field validation is
in-package transaction proof.

## 4. Post-COMMIT observation (observe-not-assume, as the corrected
preparation record requires)

After the successful execution, the SQL-query endpoint's safety
layer blocked further raw SELECTs — including a harmless SELECT
now(). That block is a connector-side safety behavior AFTER the
irreversible action, NOT a database failure; it was correctly not
treated as ambiguity, the seal was NOT retried, and the blocked
observations were NOT filled in by any other actor (Claude
performed no hosted contact and did not attempt to).

Read-only Supabase TABLE METADATA remained available immediately
after COMMIT and observed:

- exercise_catalog_logical = 3; exercise_catalog = 3;
  exercise_catalog_muscles = 5; exercise_catalog_aliases = 3;
  exercise_catalog_name_claims = 6; exercise_catalog_content = 1;
  exercise_catalog_content_expected_relationships = 2;
  exercise_catalog_relationships = 2;
  exercise_catalog_import_runs = 1;
  exercise_catalog_run_items = 6;
  exercise_catalog_review_events = 3
- therefore the post-COMMIT observed state vector is EXACTLY
  3/3/5/3/6/1/2/2/1/6/3 — identical to the staged baseline; the
  seal moved no counts anywhere.
- tenant TOTAL counts OBSERVED immediately after COMMIT:
  public.exercises = 84; public.exercise_aliases = 0.

WHAT THE POST-COMMIT OBSERVATION ESTABLISHES, PRECISELY (round-1
correction): no total-count movement was observed on the AVAILABLE
surfaces — the catalog metadata vector and the 84/0 tenant totals.
But the specific post-COMMIT delivered-row predicate — the count of
public.exercises rows WHERE import_run_id IS NOT NULL — was NOT
successfully re-observed, because the raw SQL that measures it was
blocked. The 84/0 total counts MUST NOT be read as equivalent to
that measurement: the promoted migration-026
deliver_catalog_exercises implementation contains a guarded
in-place Plank reconciliation path that UPDATEs an existing
public.exercises row and sets import_run_id = v_run.id, so total
counts can remain unchanged even if a delivery transition occurred
after COMMIT. The in-transaction proof stands (the S5 package
performed no delivery through COMMIT; surfaced
delivered_tenant_rows = 0) and no OPERATOR delivery call occurred —
but the historical post-COMMIT delivered-row state is an EXPLICIT
EVIDENCE GAP: not filled, not inferred away, and not silently
converted into a zero. A later read-only observation cannot
retroactively prove that nothing happened during the original
post-COMMIT interval, so the gap is preserved as historical fact.
The corrected preparation record's STOP-and-report branch was
accordingly neither triggered NOR definitively cleared — the
observation it needs was unavailable. CONSEQUENCE: S6 remains
STOPPED pending a separate governance decision on this gap.

## 5. Advisors (observed, not modified)

The executor observed both hosted advisor classes immediately after
execution and changed nothing. The exact hosted observations,
enumerated completely:

- Security, observed at approximately 2026-09-08T21:25:17.662Z:
  20 security notices (13 RLS-enabled/no-policy; 2 mutable search
  paths; 1 anonymous SECURITY DEFINER exposure; 3 authenticated
  SECURITY DEFINER exposures; 1 leaked-password-protection
  warning).
- Performance, observed at approximately 2026-09-08T21:25:18.103Z:
  48 performance notices (6 unindexed foreign keys; 32 RLS
  initialization-plan warnings; 9 unused indexes; 1 absolute Auth
  connection-strategy notice).

These per-class counts and totals are UNCHANGED from the advisor
posture the promoted EXLIB-2U hosted-application record preserved.
All were observed only and not modified; none was introduced by
this execution and none gates it. The security advisor's
authenticated SECURITY DEFINER findings include
public.deliver_catalog_exercises(p_run_key text) — an independent
hosted observation of exactly the post-S5 authenticated direct-RPC
reachability the issued authorization explicitly accepted.

## 6. What this changed and what it does not

The hosted run is now SEALED: approved_for_delivery = true,
sealed_at = 2026-09-08T21:24:23.744781Z, unrevoked, with its
six-member ALL_THREE_IDENTITIES membership and its approval
evidence permanently frozen by the promoted contract. This is the
intended, materially irreversible S5 transition — the protected
DELIVERY-ACTIVATION event the authorization accepted: the run now
satisfies the database delivery predicate (transport-observed
delivery_predicate_rows = 1), and an authenticated caller that
invokes deliver_catalog_exercises with the run key can deliver the
six members into that caller's own tenant, independently of the
application's delivery flag. Delivery was NOT performed by the
S5 transaction — the in-package proof through COMMIT
(delivered_tenant_rows = 0 in the surfaced row) — and no operator
delivery call occurred; the immediate post-COMMIT observation read
TOTAL counts of 84 exercises / 0 tenant aliases with no total-count
movement on the available surfaces, while the specific post-COMMIT
delivered-row predicate was NOT re-observed (section 4's explicit
gap; total-count stability is not equivalent to that measurement,
per the migration-026 in-place reconciliation path). Nothing else changed: the
state vector is count-identical, no snapshot, event, content,
publication, projection, claims, anatomy, alias, tenant, authority,
or environment surface moved, and the advisor posture is unchanged.
No operator delivery call, no revocation, no delivery-variable or
environment change, no runtime activation, no S6 action, no
EXLIB-2S action, no Git push or tag, and no manual Vercel action
occurred.

BACKUP REWIND HORIZON: the newest PHYSICAL backup HUMAN-OBSERVED at
execution time is 2026-09-08 13:07:48 +0000 — 8h 16m 35.744781s
BEFORE the seal instant (the operator's rough figure: about 8h 16m
36s). A restore to that backup is AVAILABLE, NOT AUTHORIZED — and
its horizon is asymmetric: it would UNDO THE SEAL (21:24:23.744781Z
> the backup instant) while PRESERVING the staged run itself (the
staging instant 2026-09-08T05:26:09.940165Z precedes the backup),
returning the run to the staged-unsealed posture and rewinding
roughly eight and a quarter hours of ALL other database activity
with it. Any restore consideration is its own separately gated
operator decision. Recorded so the backup's true rewind horizon is
not misread later.

## 7. Evidence provenance map (six classes, never conflated)

1. IN-PACKAGE TRANSACTION PROOF: the preconditions, the four-field
   function-result validation, and the postconditions — proven by
   the successful COMMIT of the reviewed fail-closed package; not
   individually surfaced.
2. SURFACED TRANSPORT RESULT: the EXLIB-2Z SEALED row of section 3
   — the execution's directly observed output.
3. HUMAN-OBSERVED BACKUP UI: the 13:07:48Z PHYSICAL backup and the
   visible prior dailies, read from the Supabase Dashboard by the
   operator.
4. POST-COMMIT TABLE-METADATA OBSERVATION: the section 4 counts
   (the vector and the 84/0 tenant TOTALS — totals only, never the
   delivered-row predicate), read from Supabase table metadata
   after the SQL endpoint's safety layer blocked raw SELECTs.
5. ADVISOR OBSERVATION: the section 5 enumerations at their
   approximate instants, observed only.
6. BLOCKED RAW SQL: further raw SELECTs (including SELECT now())
   were blocked by the connector safety layer AFTER the successful
   execution — a disclosed observation gap, not a failure, not
   retried, and not filled in. The materially blocked measurement
   is the delivered-row predicate (public.exercises WHERE
   import_run_id IS NOT NULL) — the standing gap sections 4 and 6
   preserve.

## 8. Chronology (every instant parses and orders)

The staged run's database-created instant (2026-09-08T05:26:09.940165Z,
preserved by the EXLIB-2U record) PRECEDES the human-observed
backup instant (13:07:48Z), which precedes the seal instant
(21:24:23.744781Z), which precedes both advisor observations
(approximately 21:25:17.662Z and 21:25:18.103Z). The transport form
2026-09-08 21:24:23.744781+00 and the ISO form
2026-09-08T21:24:23.744781Z are the same instant by parse.

## 9. Verifier lifecycle for this milestone

scripts/verify-exlib2z-application.ts (new, static, read-only, in
the battery; NO hosted contact — every hosted fact is cross-checked
for internal and cross-record consistency, never re-observed)
proves: the SPENT posture and the SOURCE byte identity (live file
AND candidate-tip blob against the reviewed fingerprint) TOGETHER
WITH the record's transport-byte provenance limitation — the
source hash is never represented as mechanical proof of the
connector payload's bytes, and the check rejects the overstated
form (round-1 strengthened); the preserved preparation chain
(290f9bbb -> dc3e83a8 -> 3969a98f, single-parent, inventories
exact); the
authority binding (the run key from the byte-frozen authority
artifact; the surrogate and staging instant extracted from the
promoted EXLIB-2U record bytes, never restated); the transport-row
consistency with the package's own surfaced SELECT shape and the
instant-equality of the transport and ISO forms; the
EVIDENCE-PRECISION separation (the in-package four-field validation
is never represented as transport-observed; the six provenance
classes are all present); the post-COMMIT evidence WITH its
explicit gap (round-1 strengthened: the metadata vector re-derived
from the record's own eleven counts; the 84/0 TOTAL-count
observation; the safety-layer disclosure; the requirement that the
delivered-row predicate is stated NOT re-observed; the rejection of
any claim that the delivered-row state was observed after COMMIT,
that 84/0 proves no post-COMMIT delivery, or that the STOP branch
was definitively cleared; and the mechanical grounding of WHY total
counts are insufficient — the migration-026 in-place Plank
reconciliation UPDATE that sets import_run_id on an existing row,
located in the migration bytes); the
chronology; the backup rewind horizon INCLUDING its asymmetry (seal
undone, staging preserved) proven by parse arithmetic; the complete
advisor enumeration with per-class counts summing to the stated
totals AND per-class equality with the enumeration preserved in the
promoted EXLIB-2U record (extracted from those bytes); the
reachability consequence's consistency (the advisor's
deliver_catalog_exercises exposure, the accepted authorization, the
migration grant); the boundary claims; hygiene; and topology.

## 10. Stale-claim sweep and battery reconciliation

The sweep against a simulated commit built from the intended phase
paths (before the retarget; measured 99 suites / 7,223 checks / 2
failures) enumerated exactly ONE stale historical check —
verify-exlib2z Z16's completed-phase topology (its committed branch
pinned exactly two commits over 290f9bbb..., true until this
evidence milestone's own commit; its uncommitted branch could not
describe this milestone's authoring state). The only other red was
this milestone's OWN new verifier holding its retarget-coverage
check (S12) red until the retarget landed — the guard authored
before the repair, its output the worklist, by design not a stale
claim. The stale check is the same recurring completed-phase
pattern (eleventh instance), retargeted
count-neutral under the exact label `RETARGET (EXLIB-2Z
hosted-application evidence)` to anchor at that phase's own
candidate tip 3969a98fc809cf69fb8a19c411de63d919db3ef7, where the
chain and both inventories held and hold forever. With it in place
the simulated-commit battery, the committed battery, and the
fresh-clone battery all read 99 suites / 7,223 checks / 0 failures
— the prior baseline 98/7,211 plus exactly this milestone's new
12-check static suite and nothing else.

## 11. What did NOT happen (the boundary)

Exactly one S5 package attempt occurred, hosted, by the operator
path; it succeeded; the authorization is SPENT; no retry. No
operator delivery call, no revocation, no delivery-variable or
environment change, no runtime activation, no S6 act, no EXLIB-2S
act, no Git push or tag, no manual Vercel action. No hosted contact
by Claude at any point, including after the safety layer blocked
raw SELECTs — the observation gap was disclosed, not filled. The
seal package remains byte-identical and must never be executed
again.

## 12. Stop condition

This milestone stops LOCAL-ONLY on its branch for Codex review. Not
pushed, not promoted, not tagged; the executed package and the live
suite byte-untouched; the only modified committed file is the
labeled verify-exlib2z Z16 retarget of section 10. The next gated
milestones, in order and each separately instructed: Codex review
of this evidence record, the consolidated EXLIB-2Z closeout
(publish/promote/tag under its own one-use authorization), and only
then any S6 delivery-configuration consideration — its own
proposal, review, and authorization chain, which additionally
remains STOPPED pending the operator's separate governance
resolution of the section 4 delivered-row observation gap.

## 13. Correction disclosure (2026-09-08, round 1)

Codex reviewed the round-0 evidence commit
be9b94aa999e4a4a4e155c4745b77c07315f6934 and returned CORRECT: the
hosted S5 seal itself STANDS VALID (do not rerun, revoke, or
restore), the bundle, chain, inventories, and all three verifier
results were independently reproduced, and adversarial mutations of
the tenant count, the advisor enumeration, and the JSONB provenance
distinction each failed the intended check. Two material
evidence-provenance defects were corrected in ONE plain forward
commit touching exactly this record and its application verifier:

- The post-COMMIT delivered-row state was NOT actually observed.
  The round-0 record said the delivered-row and tenant state were
  OBSERVED and the STOP branch was NOT triggered; the actual
  observations were TOTAL counts (84/0 and the catalog metadata
  vector), while the raw SQL measuring public.exercises WHERE
  import_run_id IS NOT NULL was blocked after COMMIT. Those are not
  equivalent measurements: the promoted migration-026
  deliver_catalog_exercises contains a guarded in-place Plank
  reconciliation path that UPDATEs an existing public.exercises row
  and sets import_run_id = v_run.id, so totals can hold at 84 even
  if a delivery transition occurred after COMMIT. Sections 4, 6, 7,
  9, and 12 now state precisely: the S5 package performed no
  delivery through COMMIT; no operator delivery call occurred; no
  total-count movement was observed on the available surfaces; the
  post-COMMIT delivered-row predicate was NOT successfully
  re-observed; that gap is explicit, historical, and cannot be
  retroactively erased by a later observation; the STOP branch was
  neither triggered nor definitively cleared; and S6 remains
  STOPPED pending a separate governance decision. The gap was not
  filled by any hosted contact in this correction.
- Exact transport-payload byte identity was overstated. Section 1
  now distinguishes the MECHANICAL source identity (local file and
  candidate-tip blob byte-exact at 701302cb...) from the BOUNDED
  transport provenance: the connector accepted a raw SQL string and
  returned no byte echo or hash, so the payload's byte identity is
  not independently mechanically preserved post hoc; the seal's
  validity rests on the successful COMMIT of the fail-closed
  transaction and its surfaced result, not on a transport hash.
- scripts/verify-exlib2z-application.ts was strengthened
  COUNT-NEUTRALLY (still exactly twelve checks): S1 requires the
  transport-provenance limitation and rejects the overstated form;
  S7 requires the delivered-row-not-re-observed statement, rejects
  the three overstated claims, and mechanically locates the
  migration-026 in-place reconciliation UPDATE in the migration
  bytes as the grounds; S12's completed-phase topology is anchored
  for the round-0-plus-correction chain. Negative controls were run
  and each intended check failed on the reintroduced overstatement.

No Supabase or Vercel contact, no S5 rerun, no revocation, no
restore, no delivery, no S6 action, no push, and no tag occurred in
this correction. The operational state is unchanged: S5 sealed and
SPENT; delivery not performed by the transaction or the operator;
the post-COMMIT delivered-row predicate an explicit observation
gap; S6 STOPPED.
