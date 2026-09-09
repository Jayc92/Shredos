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

THIS RECORD AUTHORIZES NO NEW PROTECTED ACTION.

## 1. Authorization posture and source identity

- AUTHORIZATION A — PRODUCTION ACTIVATION: issued by the operator,
  exercised by the operator path, and CONSUMED BY THE ACTIVATION
  ATTEMPT REGARDLESS OF OUTCOME — it is SPENT. The two Production
  redeploys of section 2 occurred WITHIN that single activation
  attempt; the second redeploy created no additional authorization
  and none is claimed here. No further deployment event is
  authorized.
- AUTHORIZATION M — POST-ACTIVATION READ-ONLY MEASUREMENT: issued
  by the operator, exercised after the activation deployment,
  EXECUTED EXACTLY ONCE, and INDEPENDENTLY CONSUMED BY THAT
  OBSERVATION ATTEMPT — it is SPENT. No retry occurred. Its spent
  state is not merged with Authorization A's.
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

- FIRST redeploy: dpl_9mMrn1CeQyESkKSVBA5DBYzEx9hh — READY, source
  main, SHA 5ed6fd84ea81ce1b4ca768b44e036432d26c3ab8.
- SECOND redeploy, and the CURRENT Production deployment:
  dpl_2cB4gsmgrqEBDjqQ48hedQDExurr — READY, Production, source
  main, SHA 5ed6fd84ea81ce1b4ca768b44e036432d26c3ab8.

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
  (runbook section 3.B.5) was not restated in the handoff, so the
  section 6 observation-1 before-and-after comparison rests on the
  two named post-activation deployments only, not on a captured
  pre-activation identity.

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

THE DEVIATION AND THE DURING-ACTIVATION CONDITIONS: the reviewed
during-activation condition nearest the deviation is an ambiguous
deployment result or a promoted Production deployment not
corresponding to the intended configuration. On the attested facts
that condition is NOT TRIGGERED — both deployments reported READY,
and the current promoted deployment is attested to carry the
intended configuration. The deviation is a COUNT deviation from the
reviewed act, which the reviewed STOP matrix did not enumerate as a
condition of its own. THIS RECORD DOES NOT SELF-ADJUDICATE THE
DEVIATION: it is recorded exactly as executed and disclosed for the
reviewer's judgment.

NO ROLLBACK WAS EXECUTED: the failure branch was not entered (no
F1, no F2). The bounded emergency flag-OFF pre-authorization
(mechanism 1) went unexercised and, with Authorization A spent, is
now moot; database rollback, revocation, and restore were excluded
unconditionally and none occurred.

## 8. Evidence provenance map (kept distinct)

1. MECHANICALLY VERIFIED SOURCE: the measurement package's
   fingerprint, live and at the reviewed candidate (section 1), and
   the repository-derived telemetry limit (section 4).
2. HOSTED TRANSPORT RETURN: the section 5 measurement values — the
   execution's directly returned output, with observed_at as
   transaction-start temporal context.
3. OPERATOR-SUPPLIED PLATFORM OBSERVATION: the deployment
   identities and statuses, the variable scope and its screenshots,
   the Supabase target posture of Production and Preview, and the
   log and error-cluster counts of section 4 — gathered by the
   operator, never by Claude.
4. OPERATOR ATTESTATION AGAINST A QUOTED EXPECTATION: the
   target_run_member_surface value (section 5), recorded as an
   attestation against the governed six-member expectation and
   NEVER as a verbatim capture.
5. OPERATOR-ENTERED VALUES NOT INDEPENDENTLY EXPOSED: the exact
   hosted variable values (section 3).
6. NOT OBSERVED: the Development database posture; the
   pre-activation promoted deployment identity; the reason for the
   second redeploy; the intra-variable creation order and the
   step-2 verification (sections 2 and 3).
7. BOUNDED TRANSPORT-PAYLOAD IDENTITY: section 1's standing
   limitation.
8. HISTORICAL GAPS: unchanged and untouched.

## 9. Chronology (every supplied instant parses and orders)

The staged run's creation (2026-09-08T05:26:09.940165Z) precedes
the seal (2026-09-08T21:24:23.744781Z), which precedes the
pre-activation Option-B measurement's transaction start
(2026-09-09T02:27:31.8287Z), which precedes its advisor observation
(2026-09-09T02:27:38.675Z), which precedes this post-activation
measurement's transaction start (2026-09-09T15:54:55.316459Z). The
returned sealed_at equals the instant preserved by the promoted
EXLIB-2Z record and the target run's surrogate equals the promoted
EXLIB-2U record's hosted id, both proven by parse and by
cross-record comparison.

DEPLOYMENT INSTANTS WERE NOT SUPPLIED: no created-at was restated
for either redeploy, so the ordering of the activation deployment
before this measurement — Authorization M's precondition that state
A4 has been reached — rests on the operator's sequence attestation
and is NOT proven by parse in this record.

## 10. Decision implication (bounded)

The current evidence SUPPORTS ACCEPTING THE ACTIVATION
OPERATIONALLY WITH NO ROLLBACK: the configuration is recorded live
on a READY Production deployment built from the durable production
base, the environment scope held to Production, no fail-closed
lines or runtime error clusters appeared over the observed window,
no persistent delivery state moved on any measured surface, the run
posture is exactly the sealed state, and the claims invariant is
clean.

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
observation was taken in this milestone. No Preview or Development
environment change occurred. No application code entered production
(both deployments carry the durable base SHA), and the local
EXLIB-3A governance chain remains UNPUSHED with main = origin/main
unchanged. The hosted run remains SEALED; the historical S5
post-COMMIT gaps remain exactly as recorded.

## 12. Verifier lifecycle for this milestone

scripts/verify-exlib3a-option-a-application.ts (new, static,
read-only, in the battery; no hosted contact — nothing
re-observed) proves: both authorizations recorded SPENT with
separate spent states and one attempt each; the measurement
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
the no-rollback record, and the bounded decision implication with
the no-new-authorization statement; the boundary; hygiene (no
contiguous delivery or Supabase variable name, no hosted endpoint,
no credential material); and topology, anchored at the reviewed
Option-A candidate.

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
checks. No other predecessor check went stale: every earlier
retarget is anchored at its own tip rather than at HEAD. The only
other red in the sweep was this milestone's OWN new verifier
holding its retarget-coverage check red until the retarget landed —
the guard authored before the repair. With the retarget in place
the simulated-commit battery, the committed battery, and the
fresh-clone battery all read 104 suites / 7,293 checks / 0 failures
— the pre-milestone baseline 103 / 7,279 plus exactly this
milestone's new 14-check static suite and nothing else.

## 14. Stop condition

This milestone stops LOCAL-ONLY on its branch for Codex review of
this activation and observation evidence, with the section 2
deviation disclosed for that review. No push, no tag. The next
steps are separate decisions: Codex review of this record; the
operator's operational acceptance decision on the activation
including how the deployment-count deviation bears on it; and, only
under its own new one-use human authorization, any further
protected act. Both Authorization A and Authorization M are SPENT
and neither can be re-used.
