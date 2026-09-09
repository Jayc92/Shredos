# EXLIB-3A OPTION A — hosted activation and post-activation
observation record

Recorded 2026-09-09 (UTC). The reviewed OPTION A production S6
activation WAS EXECUTED by the operator path under the operator's
explicit one-use AUTHORIZATION A, and the reviewed post-activation
read-only observation WAS EXECUTED ONCE under the operator's
explicit one-use AUTHORIZATION M. BOTH AUTHORIZATIONS WERE CONSUMED
BY THEIR RESPECTIVE ATTEMPTS AND ARE SPENT; their spent states are
recorded separately and are NEVER merged. Claude performed no
hosted contact of any kind: no Vercel contact in any mode, no
Supabase contact, no SQL, no environment change, no deployment or
redeployment, no rollback, no revocation, no restore. Every hosted
fact below is operator-supplied evidence, cross-checked mechanically
against repository bytes and the promoted records by
scripts/verify-exlib3a-option-a-application.ts.

THE EXECUTION DEVIATED FROM THE REVIEWED ACT IN ONE RESPECT: TWO
Production redeploys occurred where the reviewed act specified
exactly ONE intended activation deployment event. The deviation is
recorded as executed in section 2 and is NOT reconciled, merged, or
rewritten into a single deployment event anywhere in this record.

THE EXECUTION ALSO PRODUCED A MATERIAL GOVERNANCE EVENT THAT THIS
RECORD STATES EXPLICITLY RATHER THAN SMOOTHING INTO A CLEAN RUN: A
DURING-ACTIVATION STOP WAS DECLARED IN REAL TIME while the second
redeploy was still unresolved, and the bounded read-only
post-activation observation became permissible only under a
SEPARATE OPERATOR RECOVERY APPROVAL issued after that STOP.
Sections 1, 2, and 7 carry that sequence in full.

THIS RECORD AUTHORIZES NO NEW PROTECTED ACTION.

## 1. Authorization posture and source identity

- AUTHORIZATION A — PRODUCTION ACTIVATION: issued by the operator,
  exercised by the operator path, and CONSUMED BY THE ACTIVATION
  ATTEMPT REGARDLESS OF OUTCOME — it is SPENT. The two Production
  redeploys of section 2 occurred WITHIN that single activation
  attempt; the second redeploy created no additional authorization
  and none is claimed here. No further deployment event is
  authorized. AUTHORIZATION A WAS ALREADY SPENT AT THE MOMENT THE
  OPERATOR STOP OF SECTION 2 WAS DECLARED, and nothing that happened
  after that STOP reset it, re-authorized it, or restored any
  unspent portion of it.
- AUTHORIZATION M — POST-ACTIVATION READ-ONLY MEASUREMENT: issued
  by the operator BEFORE the activation attempt began and therefore
  STILL UNCONSUMED AT THE MOMENT THAT STOP WAS DECLARED, exercised
  after the deployment state had settled, EXECUTED EXACTLY ONCE, and
  INDEPENDENTLY CONSUMED BY THAT OBSERVATION ATTEMPT — it is SPENT.
  No retry occurred. Its spent state is not merged with
  Authorization A's.
- THE SEPARATE OPERATOR RECOVERY APPROVAL — A THIRD GOVERNANCE
  EVENT, RECORDED IN ITS OWN RIGHT AND NOT FOLDED INTO EITHER GRANT:
  after the STOP, and after the second deployment had settled, the
  reviewer path (Codex) presented a RECOVERY GATE SCOPED TO
  READ-ONLY OBSERVATION ONLY, whose exact purpose was to permit
  consumption of the ALREADY-ISSUED Authorization M despite the
  duplicate-redeploy deviation. The operator replied approve. That
  recovery approval is bounded exactly as follows, and every bound
  is recorded as a negative:
  - it AUTHORIZED NO MUTATION of any kind;
  - it AUTHORIZED NO ADDITIONAL DEPLOYMENT, and in particular it did
    NOT authorize, ratify, or retroactively license the second
    redeploy, which had already occurred before the approval
    existed;
  - it DID NOT RESET OR RE-AUTHORIZE AUTHORIZATION A, which remained
    SPENT throughout;
  - it DID NOT CREATE A SECOND GRANT OF AUTHORIZATION M — there has
    only ever been ONE Authorization M, issued once;
  - it DID NOT MERGE the two grants' spent states.
  It was a bounded ONE-USE exception permitting the already-issued
  Authorization M to be consumed for the reviewed read-only
  observation once the deployment state had settled. IT WAS CONSUMED
  BY THAT OBSERVATION AND IS NOT REUSABLE.
- Measurement source package: docs/exlib3a-option-b-current-state-measurement.sql,
  14,101 bytes, sha256
  1e9a60eca9f83b13ab603600272dd3ac3f532cf38d304259c7a584e47fd296ea
  — the exact reviewed Option-B package that Authorization M
  designated for re-use, byte-identical live, at the Option-B
  candidate, and at the reviewed Option-A activation candidate
  73a2bc8c44c6260c096517e66090014f6af8ebc0.
- TRANSPORT PROVENANCE IS BOUNDED (the standing distinction,
  unchanged): the execution transport returned no complete
  byte-for-byte echo and no hash of the submitted raw SQL payload,
  so exact transport-payload byte identity is not independently
  preserved post hoc. SOURCE identity is mechanical.

## 2. The activation sequence as executed, and the deviation

WHAT THE REVIEWED ACT SPECIFIED: the runbook's section 3.B.6
required the deployment event to be chosen so that exactly ONE
intended deployment activates the configuration; section 4 step 4
specified performing "the single intended activation deployment
event"; state A4 of section 10 defined the activation-live state as
that single intended Production deployment event completed with its
identity captured.

WHAT OCCURRED: the two delivery variables were operator-created
with Production-only scope BEFORE the redeploy sequence, and then
TWO Production redeploys occurred.

- PRE-ACTIVATION promoted Production deployment — the state the
  activation started from, supplied as operator evidence in the
  round-1 review handoff: dpl_J9sNp6qgV2CwGN7hLZyE1vUB8HnU —
  created 2026-09-09T00:16:38.370Z, READY, source main, SHA
  5ed6fd84ea81ce1b4ca768b44e036432d26c3ab8.
- FIRST redeploy: dpl_9mMrn1CeQyESkKSVBA5DBYzEx9hh — created
  2026-09-09T15:42:29.872Z, READY, source main, SHA
  5ed6fd84ea81ce1b4ca768b44e036432d26c3ab8.
- SECOND redeploy, and the CURRENT Production deployment:
  dpl_2cB4gsmgrqEBDjqQ48hedQDExurr — created
  2026-09-09T15:43:04.789Z, Production, source main, SHA
  5ed6fd84ea81ce1b4ca768b44e036432d26c3ab8. It was STILL BUILDING
  at first observation and reported READY only after the operator
  STOP and wait recorded below.

THE OPERATOR STOP AND THE RECOVERY, RECORDED AS THE SEQUENCE
ACTUALLY RAN. This is a material operator event; it is stated here
in order and is not omitted, reordered, or smoothed away.

1. Authorization A and Authorization M had BOTH been issued before
   the activation attempt began.
2. Production configuration was mutated and the activation attempt
   began. Authorization A became SPENT at that point.
3. TWO Production redeploys were then observed: the first
   dpl_9mMrn1CeQyESkKSVBA5DBYzEx9hh reporting READY, and the second
   dpl_2cB4gsmgrqEBDjqQ48hedQDExurr STILL BUILDING at first
   observation.
4. A STOP WAS EXPLICITLY DECLARED IN REAL TIME, DURING THE
   ACTIVATION, by the reviewer path (Codex), because the reviewed
   act allowed exactly ONE Production deployment and reviewed state
   A4 was OPERATIONALLY AMBIGUOUS while the second deployment was
   unresolved. AT THAT STOP: Authorization A was SPENT;
   Authorization M was UNCONSUMED; NO rollback was executed; NO
   further mutation was permitted; and the operator was instructed
   to let the in-flight deployment settle.
5. The second deployment SUBSEQUENTLY SETTLED READY, and both
   deployments then reported READY on the same source SHA. THE
   OPERATIONAL AMBIGUITY WAS RESOLVED BY THAT SETTLEMENT; THE
   TWO-VERSUS-ONE GOVERNANCE DEVIATION REMAINED and is not cured by
   it.
6. A SEPARATE RECOVERY GATE SCOPED TO READ-ONLY OBSERVATION ONLY
   was then presented, and the operator replied approve. Its five
   negative bounds are recorded in section 1.
7. Authorization M was then consumed EXACTLY ONCE, by the
   post-activation observation of section 5.

DEVIATION, RECORDED AS EXECUTED: the deployment-event count was TWO
where the reviewed act specified ONE. This record does not rewrite
the sequence as a single deployment, does not select one of the two
as "the" reviewed event, and does not treat the reviewed
single-deployment property as satisfied. Both deployments are named
above with their reported status and source.

WHAT THE DEVIATION DOES NOT CHANGE (each independently attested):
- ENVIRONMENT SCOPE: Production only; Preview was not modified
  (section 3).
- SOURCE IDENTITY: both deployments built the same source, main at
  SHA 5ed6fd84ea81ce1b4ca768b44e036432d26c3ab8 — the durable
  production base of this whole EXLIB-3A chain — so no application
  code change entered production with either redeploy, and the
  local governance chain remains unpushed and uninvolved.
- THE DATABASE: no SQL mutation, no delivery call by the operator,
  no revocation, no restore (section 11).
- THE ACCEPTED CONSEQUENCE: the at-scale, per-user, traffic-driven
  rollout that Authorization A explicitly accepted is unchanged in
  kind by the extra redeploy.
- AUTHORIZATION ARITHMETIC: Authorization A remains ONE-USE and
  SPENT (section 1).

WHAT THE DEVIATION COSTS, STATED PLAINLY:
- The reviewed "exactly ONE intended deployment" property was NOT
  satisfied as written, so this record cannot and does not claim
  that the runbook's section 4 was executed exactly as reviewed.
- The operator handoff did not state WHY the second redeploy
  occurred. This record makes NO inference about the reason, and it
  does NOT claim which of the two deployments first carried the
  activation configuration live.
- The pre-activation promoted Production deployment identity
  (runbook section 3.B.5) was NOT restated in the original
  activation handoff. IT WAS SUPPLIED LATER, as operator evidence in
  the round-1 review handoff, and it is recorded above with its
  creation instant, so the before-and-after comparison now does rest
  on a captured pre-activation identity and section 9 orders all
  three deployment creation instants by parse. What the operator
  evidence still does not supply is a READY-SETTLEMENT INSTANT for
  any of the three deployments; none is stated and none is invented
  (section 9).

ORDERING WITHIN SECTION 4, HONESTLY SPLIT:
- NOT ESTABLISHED by the handoff: the intra-variable creation order
  (whether the run-key variable was created before the enablement
  variable) and the section 4 step 2 intermediate verification of
  the run key's presence and exact value before the enablement
  variable was created.
- ESTABLISHED by the attested sequence: BOTH variables were created
  before ANY redeploy, so no deployment event intervened between
  the two variable creations. By the reviewed runbook's own model —
  the deployment event is "the moment activation becomes live"
  (section 4 step 4) — the unsafe state that key-first ordering
  exists to prevent (a live deployment carrying the enablement flag
  ON while the run key is absent, driving every qualifying
  authenticated request into the fail-closed branch) was NEVER
  carried live by any deployment event in this sequence.
- Therefore the SAFETY PROPERTY of section 4 held, while the
  LITERAL step sequence and its intermediate verification are
  recorded as NOT ESTABLISHED rather than as performed.

## 3. Environment evidence (activation-state evidence)

- The two delivery variables (the enablement variable, the
  fragments CATALOG + _DELIVERY + _ENABLED, and the run-key
  variable, the fragments CATALOG + _DELIVERY + _RUN_KEY) were
  OPERATOR-CREATED WITH PRODUCTION-ONLY SCOPE before the redeploy
  sequence. The operator's variable-scope screenshots show the new
  CATALOG-prefixed variables scoped to Production only.
- PROVENANCE BOUND ON THE VALUES: the exact hosted variable values
  are OPERATOR-ENTERED EVIDENCE and are NOT independently exposed
  by the Vercel connector. This record therefore does NOT carry
  independent mechanical proof that the enablement value is exactly
  the string true (the module's exact-string condition) or that the
  run key equals the reserved literal; the value half of the
  activation claim rests on operator attestation, and the scope
  half rests on the attested screenshots.
- PREVIEW: not modified. The two delivery variables' absence in
  Preview follows BY CONSTRUCTION from the attested Production-only
  scope together with the attested non-modification of Preview; a
  separate enumeration of Preview's variable list was not part of
  the handoff and is not claimed as an independent observation.
  The Development delivery-variable posture was not addressed in
  the handoff and is not claimed.
- DATABASE-TARGET POSTURE, NEWLY OBSERVED IN PART: Production and
  Preview both resolve the public Supabase URL variable (the
  fragments NEXT_PUBLIC + _SUPABASE + _URL) to the SAME hosted
  project — ShredOS, ref ttybyljytiwntvorugcv. PREVIEW IS THEREFORE
  NOT DATABASE-ISOLATED FROM PRODUCTION. The runbook's section 2
  pre-committed the consequence of exactly this observation: the
  observed shared-project fact is recorded, and using Preview as a
  canary REMAINS PROHIBITED. The DEVELOPMENT database posture WAS
  NOT OBSERVED and remains UNOBSERVED, so section 2's rule
  continues to govern it unchanged, in either direction. The
  round-1 correction that reframed this posture as UNOBSERVED
  rather than asserting a shared project is what makes both halves
  of this observation recordable without contradiction.

## 4. Runtime observation on the current deployment
(activation-state evidence)

Over the observed two-hour window on the current Production
deployment dpl_2cB4gsmgrqEBDjqQ48hedQDExurr:

- deliverCatalog failed closed log lines = 0
- runtime error clusters = 0

TELEMETRY LIMITATION PRESERVED (from repository bytes, re-derived
not recalled): the committed delivery module's ONLY console call is
its fail-closed console.error line. NO success-telemetry instrument
exists that would mechanically prove a successful app-path delivery
invocation, and none is claimed or invented here. Consequently:

- The zero fail-closed count DOES rule out the observed
  failing-closed class over the window: no delivery attempt is
  recorded as having entered the module's fail-closed branch, and
  no runtime error cluster accompanied the deployment.
- The zero fail-closed count is NOT affirmative proof that the
  application path executed, and NOT proof that the configuration
  is ON: a configuration that never takes effect and a live
  configuration whose qualifying requests never failed closed both
  produce zero fail-closed lines. This is precisely why the
  reviewed runbook's third observable state requires deployment,
  environment-variable, and log evidence together and never counts
  alone.

## 5. The Authorization M persistent-state measurement
(delivery-state evidence, kept separate from section 3 and 4)

The reviewed measurement package of section 1 was EXECUTED EXACTLY
ONCE by the operator path under Authorization M. Operator-supplied
returned values:

- observed_at = 2026-09-09 15:54:55.316459+00 (PostgreSQL's
  TRANSACTION-START timestamp — temporal context; the exact MVCC
  snapshot-acquisition instant is not surfaced)
- delivered_exercises_total = 0
- delivered_exercises_target_run = 0
- delivered_aliases_total = 0
- delivered_aliases_target_run = 0
- corrections_total = 0
- delivered_exercises_corrected_in_place = 0
- delivered_exercises_not_corrected_in_place = 0

Run posture and invariants returned in the same measurement:

- runs_total = 1
- target_run_found = 1
- target_run_id = 6669ba78-8e75-4042-ac2a-14082a9e5940
- target_run_dry_run = false
- target_run_approved_for_delivery = true
- target_run_sealed_at = 2026-09-08 21:24:23.744781+00
- target_run_revoked_at = <null-or-absent>
- target_run_items = 6
- target_run_exercise_members = 3
- target_run_alias_members = 3
- items_outside_target_run = 0
- vector_string = 3/3/5/3/6/1/2/2/1/6/3
- tenant_exercises = 84
- tenant_exercise_aliases = 0
- delivery_predicate_rows = 1
- claims_orphaned = 0
- claims_unclaimed_bearers = 0
- target_run_member_surface: OPERATOR-ATTESTED AS RETURNED EXACTLY
  AS EXPECTED (provenance note, section 8): the verbatim returned
  string was not restated in the operator handoff; the EXPECTED
  surface it was attested against is the SAME governed six-member
  surface reserved since EXLIB-2U and quoted in the promoted
  Option-B record, semicolon-joined in the package's deterministic
  ordering:
  alias#e21b2c00-0000-4000-a000-000000000001#Forearm plank;
  alias#e21b2c00-0000-4000-a000-000000000001#Front plank;
  alias#e21b2c00-0000-4000-a000-000000000003#Ab roller rollout;
  exercise#e21b2c00-0000-4000-a000-000000000001;
  exercise#e21b2c00-0000-4000-a000-000000000002;
  exercise#e21b2c00-0000-4000-a000-000000000003

Values the handoff did not restate are not reproduced here: this
record carries exactly the returned values the operator supplied,
and no metric is filled in from the earlier measurement or from
expectation.

COMPARISON TO THE PRE-ACTIVATION BASELINE: the promoted Option-B
measurement at 2026-09-09 02:27:31.8287+00 returned all seven
provenance surfaces at exactly 0, and this post-activation
measurement returns all seven at exactly 0 — NO MOVEMENT on any
measured provenance surface across the activation. The run posture,
membership, catalog vector, tenant cardinalities, delivery
predicate, and claims invariant are likewise identical to that
baseline: the posture is UNCHANGED across activation, and tenant
cardinalities did not move.

THE PRE-DECLARED INTERPRETATION IS PRESERVED WITHOUT EXTENSION: zero
persistent delivery-associated tenant state on the measured
provenance surfaces DOES NOT prove the delivery RPC was never
invoked or attempted, and it identifies no who, no when, and no
path — the promoted function's lawful idempotent, collision, and
skip outcomes leave no new provenance-linked rows. The historical
S5 post-COMMIT observation gaps remain HISTORICAL and are not
retroactively closed by this measurement.

## 6. Classification

ACTIVATION CONFIG LIVE / NO PERSISTENT DELIVERY STATE OBSERVED

Recorded against the CURRENT promoted Production deployment
dpl_2cB4gsmgrqEBDjqQ48hedQDExurr, with the deployment-count
deviation of section 2 disclosed and NOT absorbed into this
classification. The activation-state half rests on the READY
Production deployment, the attested Production-only variable scope,
and the operator-attested values within the bound of section 3; the
delivery-state half rests on the section 5 measurement.

THE FOLLOWING ARE NOT INFERRED AND ARE NOT CLAIMED ANYWHERE IN THIS
RECORD:
- REQUEST HISTORY: whether any qualifying request reached any of
  the three entry points during the window is unknown.
- INVOCATION HISTORY: whether the delivery RPC was invoked, and
  whether any invocation ended idempotent, collision, skip, or
  fail-closed, is unknown.
- SUCCESSFUL APP-PATH DELIVERY: no evidence here proves a
  successful app-path delivery invocation; there is no success
  telemetry to prove it with (section 4).
- MECHANISM: no mechanism attribution is derived from persistent
  state; standing direct authenticated RPC reachability remains a
  competing lawful writer for any row that might ever be observed,
  and the application flag never controlled it (runbook section 9).

## 7. Evaluation against the reviewed STOP matrix

POST-ACTIVATION conditions (runbook section 7), each evaluated on
the attested evidence:
- Delivery initialization errors beyond the designed fail-closed
  classes, or persistent fail-closed failures across the window —
  NOT TRIGGERED: zero fail-closed lines and zero runtime error
  clusters over the observed window (with section 4's limitation on
  what that absence does and does not prove).
- Unexpected persistent delivery-state movement — NOT TRIGGERED:
  no movement at all on the measured surfaces (section 5).
- Unexpected run posture — NOT TRIGGERED: exactly the sealed,
  approved, unrevoked state, membership 6 = 3 + 3, zero items
  outside the run.
- Claims invariant nonzero — NOT TRIGGERED: 0/0.
- Unexpected tenant-count movement — NOT TRIGGERED: 84/0, equal to
  the pre-activation baseline.
- Correction semantics inconsistent with migration 026 — NOT
  TRIGGERED: corrections_total 0 with both split counts 0.
- The evidence cannot distinguish whether the Production activation
  took effect — NOT DECLARED TRIGGERED, and bounded: on the
  attested evidence the activation configuration is recorded LIVE,
  and that recording rests on operator-attested values rather than
  independently exposed hosted values (section 3) and on an absence
  of fail-closed lines that is not itself affirmative proof of
  execution (section 4). The reviewer is asked to weigh that bound
  rather than a claim of mechanical certainty.

THE DEVIATION, THE DURING-ACTIVATION CONDITIONS, AND THE STOP THAT
WAS ACTUALLY DECLARED:

A DURING-ACTIVATION STOP WAS DECLARED IN REAL TIME. The reviewed
during-activation condition nearest the deviation is an ambiguous
deployment result or a promoted Production deployment not
corresponding to the intended configuration. While the second
redeploy was STILL BUILDING and therefore unresolved, that
condition was live in the operational sense: the reviewed act
allowed exactly ONE Production deployment, reviewed state A4 was
OPERATIONALLY AMBIGUOUS, and on that basis the reviewer path
(Codex) EXPLICITLY DECLARED STOP (section 2, step 4). THIS RECORD
DOES NOT SAY THAT CONDITION WAS NEVER REACHED, and it does not
describe the STOP as hypothetical, pre-emptive, or avoided.

WHAT THE STOP DID: at the STOP, Authorization A was already SPENT,
Authorization M was UNCONSUMED, NO rollback was executed, NO
further mutation was permitted, and the operator was instructed to
let the in-flight deployment settle.

WHAT THE LATER READY SETTLEMENT DID AND DID NOT RESOLVE: the second
deployment subsequently settled READY, and both deployments then
reported READY on the same source SHA. THAT SETTLEMENT RESOLVED THE
OPERATIONAL AMBIGUITY ONLY. IT DID NOT RESOLVE, CURE, OR RETIRE THE
GOVERNANCE DEVIATION: the deployment-event count remains TWO where
the reviewed act specified ONE. The deviation is a COUNT deviation
from the reviewed act, which the reviewed STOP matrix did not
enumerate as a condition of its own. THIS RECORD DOES NOT
SELF-ADJUDICATE THE DEVIATION: it is recorded exactly as executed
and disclosed for the reviewer's judgment.

NO ROLLBACK WAS EXECUTED: the failure branch was not entered (no
F1, no F2). The bounded emergency flag-OFF pre-authorization
(mechanism 1) went unexercised — it was NOT exercised at the STOP
and has not been exercised since — and, with Authorization A spent,
is now moot; database rollback, revocation, and restore were
excluded unconditionally and none occurred.

HOW THE READ-ONLY OBSERVATION BECAME PERMISSIBLE AFTER THE STOP: a
SEPARATE OPERATOR RECOVERY APPROVAL — the recovery gate scoped to
READ-ONLY OBSERVATION ONLY, answered approve — permitted the
already-issued Authorization M to be consumed for the bounded
read-only observation once the deployment state had settled. Its
five negative bounds are in section 1: no mutation, no additional
deployment, no reset of Authorization A, no second grant of
Authorization M, no merging of spent states. THE POST-ACTIVATION
OBSERVATIONS OF SECTIONS 4 AND 5, TAKEN UNDER THAT PERMISSION, DID
NOT THEMSELVES TRIGGER ANY NEW ROLLBACK CONDITION.

THE DISPOSITION AS RECEIVED, RECORDED AND NOT ADJUDICATED HERE:
ACCEPT ACTIVATION WITH DISCLOSED DEVIATION — NO ROLLBACK. The
duplicate Production redeploy stands as a PERMANENT DISCLOSED
GOVERNANCE DEVIATION; it does not invalidate the activation and it
authorizes no mutation. That disposition is a received governance
fact (section 8, class 9), not a conclusion this record reached
about itself.

## 8. Evidence provenance map (kept distinct)

1. MECHANICALLY VERIFIED SOURCE: the measurement package's
   fingerprint, live and at the reviewed candidate (section 1), and
   the repository-derived telemetry limit (section 4).
2. HOSTED TRANSPORT RETURN: the section 5 measurement values — the
   execution's directly returned output, with observed_at as
   transaction-start temporal context.
3. OPERATOR-SUPPLIED PLATFORM OBSERVATION: the three deployment
   identities, their CREATION instants, and their statuses —
   including the PRE-ACTIVATION promoted deployment identity and
   creation instant, supplied in the round-1 review handoff rather
   than in the original activation handoff — the variable scope and
   its screenshots, the Supabase target posture of Production and
   Preview, and the log and error-cluster counts of section 4 —
   gathered by the operator, never by Claude.
4. OPERATOR ATTESTATION AGAINST A QUOTED EXPECTATION: the
   target_run_member_surface value (section 5), recorded as an
   attestation against the governed six-member expectation and
   NEVER as a verbatim capture.
5. OPERATOR-ENTERED VALUES NOT INDEPENDENTLY EXPOSED: the exact
   hosted variable values (section 3).
6. NOT OBSERVED: the Development database posture; the reason for
   the second redeploy; the READY-SETTLEMENT INSTANT of any of the
   three deployments; the intra-variable creation order and the
   step-2 verification (sections 2, 3, and 9).
7. BOUNDED TRANSPORT-PAYLOAD IDENTITY: section 1's standing
   limitation.
8. HISTORICAL GAPS: unchanged and untouched.
9. OPERATOR AND REVIEWER GOVERNANCE EVENTS, SUPPLIED IN THE ROUND-1
   REVIEW HANDOFF — a class distinct from every platform reading
   above, because these are governance facts relayed by the
   operator, not instrument output and not Claude observations: the
   real-time during-activation STOP and its stated basis; the
   instruction to let the in-flight deployment settle; the separate
   recovery gate scoped to read-only observation and the operator's
   approve reply; and the received disposition ACCEPT ACTIVATION
   WITH DISCLOSED DEVIATION — NO ROLLBACK (sections 1, 2, 7, and
   10). No reviewer identity, approval, or wording beyond what the
   operator relayed is asserted anywhere in this record, and a
   blank or absent reply is never read as approval.

## 9. Chronology (every supplied instant parses and orders)

EIGHT SUPPLIED INSTANTS IN ONE ORDER, EVERY TERM PROVEN BY PARSE.
The staged run's creation (2026-09-08T05:26:09.940165Z) precedes
the seal (2026-09-08T21:24:23.744781Z), which precedes the creation
of the PRE-ACTIVATION promoted Production deployment
(2026-09-09T00:16:38.370Z), which precedes the pre-activation
Option-B measurement's transaction start
(2026-09-09T02:27:31.8287Z), which precedes its advisor observation
(2026-09-09T02:27:38.675Z), which precedes the FIRST redeploy's
creation (2026-09-09T15:42:29.872Z), which precedes the SECOND
redeploy's creation (2026-09-09T15:43:04.789Z), which precedes this
post-activation measurement's transaction start
(2026-09-09T15:54:55.316459Z). The returned sealed_at equals the
instant preserved by the promoted EXLIB-2Z record and the target
run's surrogate equals the promoted EXLIB-2U record's hosted id,
both proven by parse and by cross-record comparison.

DEPLOYMENT CREATION INSTANTS ARE NOW PROVEN BY PARSE; READY
INSTANTS ARE NEITHER SUPPLIED NOR INVENTED. The three deployment
instants above are CREATION instants, which is precisely what the
operator evidence supplies exactly. NO READY-SETTLEMENT INSTANT was
supplied for any deployment, so none is stated here and none is
inferred. The consequence is stated rather than closed over: the
parse proves that the pre-activation deployment, then the first
redeploy, then the second redeploy were all CREATED before this
measurement's transaction start — the ordering Authorization M's
state-A4 precondition needs at the level of creation — while the
further fact that the SECOND deployment had already SETTLED READY
before the measurement was taken rests on the operator's attested
STOP-and-wait sequence of section 2, not on a parsed instant.

## 10. Decision implication (bounded)

The current evidence SUPPORTS ACCEPTING THE ACTIVATION
OPERATIONALLY WITH NO ROLLBACK: the configuration is recorded live
on a READY Production deployment built from the durable production
base, the environment scope held to Production, no fail-closed
lines or runtime error clusters appeared over the observed window,
no persistent delivery state moved on any measured surface, the run
posture is exactly the sealed state, and the claims invariant is
clean.

THE DISPOSITION AS RECEIVED, RECORDED AND NOT ADJUDICATED HERE: the
round-1 review disposition relayed by the operator is ACCEPT
ACTIVATION WITH DISCLOSED DEVIATION — NO ROLLBACK, with the
duplicate Production redeploy standing as a PERMANENT DISCLOSED
GOVERNANCE DEVIATION that does not invalidate the activation and
authorizes no mutation. It is recorded as a received governance fact
(section 8, class 9). It does not convert into an authorization: the
sentence below is unchanged by it.

THIS EVIDENCE RECORD ITSELF AUTHORIZES NO NEW PROTECTED ACTION.
Both one-use grants are SPENT, so every further protected act —
including any additional deployment, any flag change, any rollback
mechanism, any delivery call, any revocation, any restore, any
Git push or tag, and any EXLIB-2S work — requires its own new
explicit one-use human authorization. The operational acceptance
decision, and the weight to give the deployment-count deviation of
section 2 within it, are the operator's and the reviewer's, not
this record's.

## 11. What did NOT happen (the boundary)

Claude made no hosted contact at any point: no Vercel contact in
any mode including read-only, no Supabase contact, no SQL
execution, no environment-variable change, no deployment or
redeployment, no rollback execution, no revocation, no restore, no
delivery call, no push, no tag, no EXLIB-2S act. Exactly one
persistent-state measurement attempt occurred, by the operator
path, and it succeeded; no retry; no individual SELECT was re-run;
no estimate or metadata instrument was substituted. No advisor
observation was taken in this milestone. THE ROUND-1 CORRECTION
RECORDED IN SECTION 13 RE-OBSERVED NOTHING: the pre-activation
deployment identity and the three deployment creation instants came
from operator-supplied evidence, and Vercel was NOT re-contacted to
obtain them, in any mode including read-only. No Preview or
Development environment change occurred. No application code
entered production
(both deployments carry the durable base SHA), and the local
EXLIB-3A governance chain remains UNPUSHED with main = origin/main
unchanged. The hosted run remains SEALED; the historical S5
post-COMMIT gaps remain exactly as recorded.

## 12. Verifier lifecycle for this milestone

scripts/verify-exlib3a-option-a-application.ts (new, static,
read-only, in the battery; no hosted contact — nothing
re-observed) proves: both authorizations recorded SPENT with
separate spent states and one attempt each, together with the FULL
GOVERNANCE SEQUENCE — Authorization A already SPENT and
Authorization M still UNCONSUMED at the real-time operator STOP, the
SEPARATE recovery approval that permitted the already-issued
Authorization M to be consumed, and all five of its negative bounds
(no mutation, no additional deployment, no reset of A, no second
grant of M, no merged spent states) — with negative pins rejecting
any wording that would widen that recovery approval into a
deployment or a mutation, multiply the single grant of Authorization
M, or return Authorization A to an unspent state; the measurement
package's byte identity live, against the fingerprint the Option-B
preparation record pinned, and at the reviewed Option-A candidate
blob; the DEVIATION recorded as executed with both deployment ids,
both statuses, the shared source SHA pinned ANCHORED as a commit
object that is the base of exactly this seven-commit local-only
chain (never as a moving branch name, which the durable-closeout
ruling already retired once) with the no-application-code property
DERIVED from that commit range rather than read from this record's
prose, the reviewed single-deployment property named as unsatisfied,
and negative pins rejecting any single-deployment rewrite or any
claim that the second redeploy was separately authorized; the
Production-only scope with the operator-entered-value bound
declared; the newly observed Production/Preview shared Supabase
target with the canary prohibition preserved and the Development
posture still UNOBSERVED; the section 4 ordering split (safety
property held, literal step order NOT ESTABLISHED); the runtime
observation with the telemetry limit re-derived from the module's
single console call and the both-directions reading of a zero
fail-closed count; the seven zero provenance surfaces, the
no-movement comparison against the promoted baseline, and the
pre-declared interpretation preserved without extension; the run
posture and invariants cross-checked against the promoted Option-B
record and the member-surface attestation cross-checked against the
EXLIB-2U staging package's own pinned lines; the exact
classification string with all four inference prohibitions and
negative pins against the classic overclaims; the STOP evaluation,
which now requires the real-time during-activation STOP to be
present with state A4 named OPERATIONALLY AMBIGUOUS, requires the
later READY settlement to be described as resolving the operational
ambiguity ONLY and never the governance deviation, and structurally
forbids any NOT TRIGGERED verdict anywhere in the deviation half of
that section, so the erasure of the STOP cannot reappear; the
no-rollback record; the bounded decision implication with the
no-new-authorization statement, and the received ACCEPT / NO
ROLLBACK disposition recorded as a relayed governance fact rather
than a self-adjudication; the boundary; the provenance map, which
now carries a DISTINCT GOVERNANCE-EVENT class for the operator- and
reviewer-relayed facts and no longer files the pre-activation
deployment identity under NOT OBSERVED; hygiene (no contiguous
delivery or Supabase variable name, no hosted endpoint, no
credential material); the CHRONOLOGY, which now orders all EIGHT
supplied instants by parse — including the three deployment CREATION
instants — while requiring the record to keep declaring that no
READY-settlement instant was supplied or invented; and topology,
anchored at the reviewed Option-A candidate, which additionally
requires this round's correction to touch EXACTLY the two authorized
paths and requires scripts/verify-exlib3a-option-a.ts to be
BYTE-IDENTICAL to its state at the evidence commit.

## 13. Stale-claim sweep and battery reconciliation

The sweep against a simulated commit built from this milestone's
intended phase paths enumerated exactly ONE genuinely stale
historical check — verify-exlib3a-option-a A16's HEAD-relative
completed-phase topology (its committed branch pinned exactly two
commits over the accepted Option-B evidence tip with HEAD's parent
the round-0 preparation commit, true until this evidence
milestone's own commit; its uncommitted branch could not describe
this milestone's authoring worktree) — the recurring completed-phase
pattern, sixteenth instance, retargeted COUNT-NEUTRALLY under the
exact label `RETARGET (EXLIB-3A OPTION A hosted-activation
evidence)` to anchor at that phase's own reviewed candidate
73a2bc8c44c6260c096517e66090014f6af8ebc0, where its chain and
inventory held and hold forever; that suite still reports SIXTEEN
checks. No other predecessor check went stale, and that is
DEMONSTRATED rather than asserted: a control arm committing this
milestone's two phase additions WITHOUT the retarget reds exactly
two checks, one apiece — the stale A16 itself, proving the retarget
was NECESSARY rather than gratuitous, and this milestone's own
retarget-coverage check, proving the new guard detects a missing
retarget — while every one of the other 102 suites stays green.
Every earlier retarget is anchored at its own tip rather than at
HEAD.

The sweep also caught a defect in this milestone's OWN new
verifier, recorded here rather than quietly repaired. The first
sweep run red C4, because that check pinned the deployed source SHA
by resolving the local branch name main. That pin was wrong twice
over: it cannot resolve in a fresh clone, which has no local main
and which the required fresh-clone battery exercises, and it would
go stale at the eventual consolidated closeout when main advances
past this base — the exact failure the durable-closeout ruling
already retired once for the EXLIB-2U application verifier and
whose absence Z14 now enforces. C4 was repaired BEFORE the commit
to pin the deployed source as ANCHORED commit constants (the
object's type, its ancestry to the reviewed candidate, and its
position as the base of exactly this seven-commit local-only
chain), and the no-application-code property was changed from a
phrase read out of this record's prose into a property DERIVED from
that commit range. This record's claim about the deployed source is
therefore checked against git rather than against itself.

The C4 repair preceded the evidence commit, but this section's own
correction did not: the first commit's section 13 understated the
sweep by naming only one other red. Because the standing rule
forbids amend, rebase, and squash, the correction landed as a
SECOND PLAIN FORWARD commit over the evidence commit rather than a
rewrite of it, and the topology check asserts every commit in the
phase range is single-parent. The reviewer therefore sees the
understatement and its correction as two objects, not one tidied
one. No reviewed or executed artifact was touched by any commit in
this phase: the activation runbook whose fingerprint Authorization A
bound remains byte-identical at 25,001 bytes.

THE ROUND-1 REVIEW CORRECTION IS A THIRD PLAIN FORWARD COMMIT, FOR
THE SAME REASON. The round-1 review returned the evidence package
CORRECT with one narrow GOVERNANCE-PROVENANCE OMISSION: the durable
record had omitted the material operator event — the real-time
during-activation STOP and the separate recovery approval that
followed it — and, worse, section 7 had recorded the nearest
during-activation condition as NOT TRIGGERED, which erased the STOP
that was actually declared. Sections 1, 2, 7, 8, 9, 10, 11 and this
section now carry the sequence explicitly, the three deployment
CREATION instants upgrade section 9 from an attested ordering to a
parsed one, and the pre-activation deployment identity moves out of
the NOT OBSERVED class it no longer belongs in. The correction
touches EXACTLY the two authorized paths — this record and its own
verifier — and scripts/verify-exlib3a-option-a.ts is byte-identical
to its state at the evidence commit, which the topology check now
asserts directly rather than leaving to inspection.

THE ERASURE IS GUARDED, NOT MERELY REPAIRED, AND THE GUARD IS
DEMONSTRATED ON EIGHT NEGATIVE CONTROLS. Each control mutates a
committed copy of this record in one specific way and the suite must
go RED; all eight do, and the check that catches each is named:
deleting the operator-declared STOP (C12); saying Authorization M
was consumed under its original grant with no recovery approval
(C1); saying the recovery approval authorized the second redeploy
(C1); saying Authorization A became unspent or was reset (C1);
saying state A4 was unambiguous throughout (C12); removing the
recovery approval's no-mutation boundary (C1); restating the
TWO-versus-ONE deviation as conforming execution (C3); and removing
the deployment-creation chronology (C14). The C12 guard is
structural as well as textual: no NOT TRIGGERED verdict may appear
anywhere in the deviation half of section 7, so the specific erasure
the review caught cannot return by rewording.

With the retarget in place, C4 anchored, and the round-1 correction
applied, the simulated-commit battery, the committed battery, and
the fresh-clone battery all read
104 suites / 7,293 checks / 0 failures
— the pre-milestone baseline 103 / 7,279 plus exactly this
milestone's new 14-check static suite and nothing else. The
correction is COUNT-NEUTRAL: the suite still reports FOURTEEN
checks, strengthened in place rather than extended.

## 14. Stop condition

This milestone stops LOCAL-ONLY on its branch for Codex RE-REVIEW of
the round-1 correction recorded in section 13, with the section 2
deviation, the real-time during-activation STOP, and the separate
recovery approval all disclosed for that review. No push, no tag,
no closeout. The round-1 disposition ACCEPT ACTIVATION WITH
DISCLOSED DEVIATION — NO ROLLBACK is recorded (sections 7 and 10)
and authorizes nothing. The next steps remain separate decisions:
Codex re-review of this record; and, only under its own new one-use
human authorization, any further protected act, including the
eventual consolidated closeout that would push this chain. Both
Authorization A and Authorization M are SPENT and neither can be
re-used, and the recovery approval that permitted the read-only
observation was consumed by it and is not reusable either.
