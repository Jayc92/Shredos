# EXLIB-3A OPTION A — controlled S6 activation runbook

Recorded 2026-09-09 (UTC); ROUND-1 CORRECTED under the independent
Codex review disposition CORRECT (the activation architecture was
accepted; five precision/sequencing corrections were applied — see
the preparation record). ACTIVATION-PACKAGE PREPARATION ONLY: this
runbook defines the exact future protected act; it performs
nothing. No Vercel contact, no Supabase contact, no environment
change, no deployment, no delivery, no revocation, no restore, no
push, no tag. S6 remains STOPPED; the TWO future human
authorizations of section 12 (AUTHORIZATION A — PRODUCTION
ACTIVATION; AUTHORIZATION M — POST-ACTIVATION READ-ONLY
MEASUREMENT) are each PREPARED — NOT ISSUED — DELIBERATELY UNSENT,
and neither grant can authorize itself.

## 0. Inherited baseline (the accepted Option-B evidence)

The Codex-approved Option-B hosted measurement evidence at
d4703187e1f52cdeda17d003023f8eb14e654480 (over the durable
production base main = origin/main =
5ed6fd84ea81ce1b4ca768b44e036432d26c3ab8) established, at
2026-09-09 02:27:31.8287+00: ZERO persistent delivery-associated
tenant state on every measured provenance surface (delivered
exercises/aliases total and target-run-scoped, corrections, and the
corrected-in-place split all exactly 0 — not proof the RPC was
never invoked); the target run exactly the sealed state (surrogate
6669ba78-8e75-4042-ac2a-14082a9e5940, run key
exlib2u-plank-release1-staged-v1, dry_run false, approved true,
sealed_at 2026-09-08 21:24:23.744781+00, unrevoked, membership
6 = 3 + 3); catalog vector 3/3/5/3/6/1/2/2/1/6/3; tenants 84/0;
delivery_predicate_rows 1; claims 0/0; and the security advisor at
20 = 13+2+1+3+1 with deliver_catalog_exercises, rls_auto_enable,
and rollback_catalog_delivery in the authenticated SECURITY DEFINER
set. The one-use Option-B authorization is SPENT. The historical S5
post-COMMIT gaps remain historical. That baseline is the ONLY state
this runbook is valid against (STOP conditions, section 7).

## 1. The exact hosted configuration act

The activation act sets EXACTLY TWO application configuration
variables in the hosted platform. Their names are re-derived
mechanically from repository bytes (the single delivery runtime
module src/lib/supabase/deliver-catalog.ts reads exactly three
process.env names; the third is the operational timeout knob and is
NOT part of activation). NAMING CONVENTION: this corpus spells the
two names in FRAGMENTS because the promoted EXLIB-2T census pins an
exact four-file carrier set for the contiguous enablement name; the
static verifier derives each name from the module bytes and proves
the fragment concatenation equals it.

- ENABLEMENT VARIABLE: the concatenation of the fragments
  CATALOG + _DELIVERY + _ENABLED (read by isCatalogDeliveryEnabled;
  the module enables delivery ONLY when the value is exactly the
  string "true" — any other value, absence included, is OFF).
  INTENDED VALUE, exact: true
- RUN-KEY VARIABLE: the concatenation of the fragments
  CATALOG + _DELIVERY + _RUN_KEY (read by catalogDeliveryRunKey; a
  missing or blank value with the flag ON fails closed BEFORE any
  database call).
  INTENDED VALUE, exact: exlib2u-plank-release1-staged-v1

No other variable, secret, or hosted configuration of any kind is
part of the act. The TIMEOUT variable is untouched (its committed
default of 10,000 ms applies).

## 2. Environment scope: PRODUCTION ONLY

The eventual act proposes to modify the PRODUCTION environment of
the hosted Vercel project ONLY. Preview and Development receive NO
activation variables: nothing in the repository or roadmap
justifies them. PREVIEW/DEVELOPMENT DATABASE POSTURE IS UNOBSERVED:
repository bytes prove only that every environment's build of this
application reads the same Supabase URL/key variable FAMILY with no
per-environment database indirection in code; the hosted VALUES
assigned to those variables in Preview and Development are platform
facts (the platform supports distinct per-environment values) and
remain UNOBSERVED until the read-only Vercel preflight of section
3.B, so database isolation of the non-production environments
CANNOT BE ASSUMED in either direction. A Preview or Development
canary is therefore NOT AUTHORIZED as an activation shortcut:
isolation has not been established. If the preflight later proves
that either non-production environment points at the production
ShredOS Supabase project, that observed fact must be recorded and
using that environment as a canary remains PROHIBITED; if the
preflight instead proves isolation, that still does NOT expand this
Production-only authorization — a non-production canary would be a
separate governance decision with its own review and authorization.
ACCIDENTAL MULTI-ENVIRONMENT PROPAGATION IS PROHIBITED: when the
platform's variable editor offers to apply a variable to multiple
environments, the operator must select Production alone, and the
preflight and post-activation evidence must record the
Preview/Development posture (expected: the two variables ABSENT
there).

## 3. Fact classes and the future read-only Vercel preflight

A. REPOSITORY-PROVEN FACTS (held now): the module's exact-string
enablement and fail-closed law; the three authenticated server-only
entry points; the automatic-at-scale consequence; no tracked file
assigns either variable; accessors read process.env at call time in
server code (nothing inlines them at build time).
B. PLATFORM-OPERATIONAL FACTS (NOT derivable from repository bytes;
must be established by a later READ-ONLY operator preflight of the
Vercel project — no Vercel contact occurs in this milestone, and no
toolchain in this repository encodes a deterministic Vercel
preflight, so the operator gathers these manually and captures them
as screenshots/values in the activation evidence):
  1. the correct Vercel project identity (name and project id) for
     this repository's production deployment;
  2. the CURRENT presence/values of the two delivery variables in
     Production (expected: ABSENT — any existing value is a STOP);
  3. the Preview/Development posture for both delivery variables
     (expected: ABSENT), AND the database-target posture of the
     Supabase URL variable family across Production, Preview, and
     Development (recorded as hosted-project identity only, never
     secret values) — establishing whether the non-production
     environments are database-isolated (section 2);
  4. whether applying the Production variable change requires a
     redeploy or automatically causes one, on this project's
     current platform behavior;
  5. the exact currently promoted Production deployment (id and
     created-at) BEFORE activation;
  6. the exact deployment event that will carry activation (a new
     deploy or a redeploy of the promoted build), chosen so exactly
     ONE intended deployment activates the configuration.
C. PROTECTED HOSTED MUTATION ACTS (only under AUTHORIZATION A of
section 12 once issued): setting the two variables in Production;
the single activation deployment event; nothing else.

## 4. Activation order (fail-closed; no partially enabled state)

ORDER, exact:
1. RUN KEY FIRST: stage the run-key variable in Production while
   the enablement flag remains OFF (absent). A staged key with the
   flag OFF is INERT by the module's committed logic — the flag-OFF
   branch never reads it — so an intermediate deployment in this
   state (if the platform forces one) is safe.
2. VERIFY the run-key variable's presence and exact value in
   Production before proceeding.
3. THEN stage the enablement variable at exactly true.
4. THEN perform the single intended activation deployment event
   (section 3.B.6), which is the moment activation becomes live.

WHY FLAG-FIRST IS UNSAFE: with the flag ON and the key missing or
wrong, every qualifying authenticated request enters the fail-closed
branch — by design it never seeds and never delivers, so affected
users' exercise initialization is impaired until corrected. The
committed module refuses exactly this way (the missing-key
failClosed before any database call). Key-first ordering makes that
state unreachable. NEVER deploy with the flag ON while the key is
absent; NEVER leave the configuration half-staged across an
unattended gap.

## 5. Blast-radius acceptance (the consequence the human gate must
accept)

AFTER THE FLAG AND KEY ARE LIVE IN THE PRODUCTION DEPLOYMENT, EVERY
AUTHENTICATED USER'S NEXT QUALIFYING REQUEST TO ANY OF THE THREE
ENTRY POINTS (/workouts, /workouts/exercises, GET /api/exercises)
MAY ATTEMPT DELIVERY AUTOMATICALLY — an at-scale, per-user,
traffic-driven rollout to the entire authenticated user base and
every future signup. This is NOT a single-user event and NOT an
operator-invoked delivery call.

CANARY DETERMINATION (from repository bytes): NO EXISTING
APPLICATION-LEVEL SINGLE-TENANT CANARY. There is no user or tenant
allowlist, no per-account feature flag, no route gating, and no
manual test-user path that scopes the flag-ON behavior (the only
"allowlist" hits in src are the two unrelated PATCH field-validation
comment lines pinned in the preparation record). A
Preview/Development canary is not authorized (section 2: database
isolation unobserved). Creating canary architecture is out of scope
for this preparation and is not proposed. The later human activation
gate must therefore EXPLICITLY ACCEPT the at-scale rollout as
stated.

## 6. Immediate post-activation observation plan

Delivery is traffic-triggered, direct authenticated RPC
reachability stands throughout, and the promoted function's lawful
idempotent, collision, and skip outcomes leave no new
provenance-linked rows — so post-activation evidence is limited to
what the instruments actually observe. TELEMETRY LIMIT (from
repository bytes): the committed module's only log line is the
fail-closed console.error; NO success-telemetry line exists that
would mechanically prove a successful app-path delivery invocation,
and none is claimed or invented. The evidence therefore
distinguishes THREE observable states:
- ACTIVATION CONFIG LIVE / NO PERSISTENT DELIVERY STATE OBSERVED:
  the intended Production deployment and both variables are proven
  live, and the persistent delivery-provenance counts still read
  zero. NO claim is made about whether a qualifying request
  occurred, whether the delivery RPC was invoked, or whether any
  invocation ended idempotent, collision, skip, or fail-closed —
  request history and invocation history are unknown.
- ACTIVATION CONFIG LIVE / PERSISTENT DELIVERY STATE OBSERVED:
  persistent delivery-associated tenant state exists after the
  pre-activation baseline. Mechanism, identity, exact time, and
  path are NEVER inferred from persistent state alone: standing
  direct-RPC reachability remains a competing possible mechanism
  for any observed row, and no request-history or
  invocation-history claim is derivable from state.
- ACTIVATION INEFFECTIVE OR FAILING CLOSED: the deployment or
  variables did not take effect, or delivery attempts fail closed —
  supported by deployment, environment-variable, and log evidence
  (the module's deliverCatalog failed closed lines in the
  production server logs; users' exercise initialization pausing),
  never by counts alone.

OBSERVATIONS (executed only under AUTHORIZATION M of section 12
once issued — never under Authorization A, and only after state A4
is reached):
1. the hosted deployment identity: the promoted Production
   deployment id/created-at AFTER activation, compared to the
   section 3.B.5 pre-activation identity;
2. exact hosted presence/value proof for the two delivery variables
   in Production (and their ABSENCE in Preview/Development),
   captured without exposing any unrelated secret;
3. the persistent delivery-state measurement: RE-USE the reviewed
   Option-B measurement package
   (docs/exlib3a-option-b-current-state-measurement.sql, fingerprint
   re-measured at the gate) under AUTHORIZATION M — it already
   returns the exact delivered counts (total and target-run-scoped),
   the corrected-in-place versus inserted split, total tenant
   counts, run posture, predicate, and claims in one result set;
4. application/server error evidence relevant to delivery
   initialization: the presence or absence of the module's
   fail-closed log lines in the production server logs for the
   observation window;
5. the run posture re-read (within the same measurement): still
   sealed/approved/unrevoked; delivery_predicate_rows still 1.

## 7. Fail-closed STOP conditions

PRE-ACTIVATION (any one is a STOP; do not begin):
- the Option-B evidence at d4703187... is no longer the accepted
  baseline, or the run posture is known to have moved since it;
- the target run is revoked, missing, or duplicated;
- the staged run key does not equal
  exlib2u-plank-release1-staged-v1 exactly;
- the Vercel project identity is ambiguous, or either delivery
  variable ALREADY EXISTS in any environment (conflicts with the
  expected absent state);
- the environment scope cannot be limited to Production alone;
- the ordering of section 4 cannot be proven safe on the platform's
  actual behavior (section 3.B.4 unresolved);
- the reviewed runbook/package fingerprint re-measured at the gate
  mismatches;
- AUTHORIZATION A is already spent.

DURING ACTIVATION (any one is a STOP at the failing step):
- the run-key update fails, or its presence/value cannot be
  confirmed before the flag step;
- the enablement update partially succeeds or its result is
  ambiguous;
- the deployment/redeployment result is ambiguous, or the promoted
  Production deployment does not correspond to the intended
  configuration;
- any environment other than Production is modified.

POST-ACTIVATION (any one is a STOP-and-report):
- delivery initialization errors beyond the designed fail-closed
  classes, or persistent fail-closed failures across the window;
- unexpected persistent delivery-state movement (report the
  observation exactly; mechanism, identity, and path are not
  inferable from persistent state alone), unexpected run posture,
  claims invariant nonzero, unexpected tenant-count movement, or
  correction semantics inconsistent with migration 026;
- the evidence cannot distinguish whether the Production activation
  took effect.

STOP MEANS: report exactly; perform NO unrelated repair, NO
revocation, NO restore, and NO additional protected step — except
the tightly bounded emergency flag-OFF rollback of section 8, and
only if its preconditions hold.

## 8. Rollback and shutdown runbook (four mechanisms, never
conflated)

1. APPLICATION FLAG OFF (the PRIMARY, reversible, app-level
   rollback): set the enablement variable OFF (remove it or any
   non-true value) in Production, deploy/redeploy as the platform
   requires, and VERIFY the production app path is OFF (the seed
   path resumes; fail-closed lines cease). Flag OFF stops ONLY the
   automatic app path; it does NOT remove direct authenticated RPC
   reachability, and it does NOT undo tenant state already
   delivered (delivered rows persist per user).
2. rollback_catalog_delivery: per-calling-user, deactivate-only —
   NOT an operator kill switch; NOT part of this runbook's act.
3. exlib_revoke_run_delivery: operator-only, ONE-WAY, permanent —
   kills the run for app path AND direct RPC forever; NOT part of
   this runbook's act.
4. Physical restore: catastrophic-only; NOT part of this runbook's
   act.

EMERGENCY ROLLBACK PRE-AUTHORIZATION — RECOMMENDATION:
AUTHORIZATION A (section 12) SHOULD pre-authorize the bounded
emergency flag-OFF rollback (mechanism 1 ONLY) within the same
one-use sequence, exercisable ONLY IF (a) activation has already
mutated the Production configuration AND (b) an immediate
fail-closed STOP condition of section 7 occurs before the sequence
completes. JUSTIFICATION: mechanism 1 is reversible and
app-path-only; without the pre-authorization, a mid-sequence STOP
would strand production in a half-activated or failing-closed state
(paused initializations for affected users) while a second human
gate is convened — the one situation where waiting is strictly
worse than the bounded undo. The pre-authorization changes nothing
about the database: DATABASE ROLLBACK AND REVOCATION ARE EXCLUDED
FROM THIS PRE-AUTHORIZATION, unconditionally; they remain separate
protected decisions with their own gates.

## 9. Direct-RPC security posture (unchanged by activation)

deliver_catalog_exercises remains callable directly by any
authenticated user who knows the non-secret run key — a standing
fact of the sealed run, re-confirmed by the Option-B advisor
observation. Activation does not create this privilege; it
increases SCALE and adds the official application path. The
application flag is a rollout control, not a database security
boundary (the sealed/approved/unrevoked predicate plus per-user
scoping is the boundary). No change to the database EXECUTE grant
is proposed in this activation milestone; if the operator wants
that posture revisited, it is a separately justified governance
decision.

## 10. Activation state machine (no step silently implies the next)

- A0 — BASELINE: Option-B evidence accepted; the hosted Vercel
  delivery-variable posture UNOBSERVED (no Vercel contact has
  occurred, so nothing is claimed about current variable presence
  or absence in any environment); no intentional S6 activation has
  been authorized; S6 remains STOPPED. (Now.)
- A1 — READ-ONLY HOSTED PREFLIGHT COMPLETE: every section 3.B fact
  captured; all pre-activation STOP checks green; BOTH section-12
  grants remain UNISSUED at this state.
- A2 — RUN KEY STAGED: entered ONLY after the activation package
  and the preflight evidence have been accepted AND AUTHORIZATION A
  has been issued and is unspent; the run-key variable set in
  Production; flag still OFF/absent; key presence and exact value
  verified.
- A3 — ENABLEMENT STAGED: the enablement variable set to exactly
  true in Production; not yet live if the platform requires a
  deployment event.
- A4 — ACTIVATION DEPLOYMENT LIVE: the single intended Production
  deployment event completed; its identity captured.
- A5 — POST-ACTIVATION OBSERVATION COMPLETE: the section 6
  evidence captured under AUTHORIZATION M (including which of the
  three observable states obtains).
- A6 — ACTIVATION ACCEPTED: the operator accepts the evidence; the
  milestone closes into its evidence record and review.
Failure branch (only under section 8's pre-authorization):
- F1 — EMERGENCY FLAG-OFF INITIATED: mechanism 1 executed because
  a during/post STOP fired after configuration mutation began.
- F2 — PRODUCTION APP PATH VERIFIED OFF: the rollback verified;
  then STOP — report exactly; everything further is a new human
  decision.
Every transition requires its named gate; no state is entered
implicitly.

## 11. Activation evidence versus delivery evidence (never
conflated)

Setting the variables and deploying does NOT itself prove any
tenant delivery occurred — delivery is traffic-triggered, and
persistent state does NOT identify its own mechanism (the app path
and standing direct authenticated RPC are both lawful writers).
Activation-state evidence (deployment identity, variable presence)
and delivery-state evidence (persistent provenance counts, the
split, fail-closed logs) are captured and reported SEPARATELY, the
three observable states of section 6 govern every claim, and no
request-history, invocation-history, or mechanism-attribution claim
is ever derived from persistent state alone.

## 12. The future human authorizations (TWO distinct one-use
grants — each PREPARED — NOT ISSUED — DELIBERATELY UNSENT)

The eventual human gate consists of TWO logically and evidentially
distinct one-use grants. They may be issued together in one human
message, but only AFTER Codex approves this activation package and
the section 3.B read-only preflight facts are established and
accepted. Their spent states are never merged: AUTHORIZATION A is
consumed by the activation attempt regardless of outcome, and
AUTHORIZATION M is independently consumed by its observation
attempt regardless of outcome. If activation fails before state A4,
Authorization M remains unconsumed and MUST NOT be used merely to
investigate the failure unless its own reviewed conditions permit
that exact observation. Nothing in this runbook issues, requests,
or pre-consumes either grant; neither grant can authorize itself;
Claude never issues authorizations.

AUTHORIZATION A — PRODUCTION ACTIVATION (PREPARED — NOT ISSUED —
DELIBERATELY UNSENT). The complete text the operator would send:

    Authorize the EXLIB-3A OPTION A production S6 activation
    exactly as reviewed:
    * this authorization binds the activation-package commit
      [COMMIT — the reviewed corrected candidate], the runbook
      fingerprint [RUNBOOK SHA-256 — the exact value pinned in the
      committed preparation record] re-measured at the gate, and
      the Vercel project identity [PROJECT IDENTITY — from the
      completed read-only preflight]; any byte change voids it;
    * spent-check FIRST: this authorization is ONE-USE, consumed by
      the activation attempt regardless of outcome, and must be
      unspent;
    * scope: the named Vercel project, PRODUCTION environment ONLY;
      Preview and Development receive nothing;
    * the act: set the run-key variable (the fragments CATALOG +
      _DELIVERY + _RUN_KEY) to exactly
      exlib2u-plank-release1-staged-v1; verify its presence and
      value; then set the enablement variable (the fragments
      CATALOG + _DELIVERY + _ENABLED) to exactly true; then perform
      the single intended Production deployment event — in that
      order, never flag-first, never half-staged;
    * I EXPLICITLY ACCEPT that once live, every authenticated
      user's next qualifying request to the three entry points may
      attempt delivery automatically — an at-scale rollout with no
      application-level single-tenant canary;
    * on ANY STOP condition of the reviewed runbook: stop and
      report exactly; the ONLY pre-authorized recovery is the
      bounded emergency flag-OFF rollback (mechanism 1), and ONLY
      if the Production configuration was already mutated and an
      immediate fail-closed condition occurred; database rollback,
      revocation, and restore are NOT authorized;
    * on any ambiguous step outcome: do not retry blind; capture
      the state, report, and stop (subject only to the same bounded
      rollback);
    * this grant authorizes NO observation beyond per-step
      verification: the post-activation evidence of the reviewed
      runbook is captured only under Authorization M;
    * then stop.
    This authorization permits no Supabase mutation, no delivery
    call by the operator, no revocation, no restore, no
    Preview/Development change, no other variable or setting, no
    EXLIB-2S work, and no Git push or tag.

AUTHORIZATION M — POST-ACTIVATION READ-ONLY MEASUREMENT (PREPARED —
NOT ISSUED — DELIBERATELY UNSENT). The complete text the operator
would send:

    Authorize the EXLIB-3A OPTION A post-activation read-only
    observation exactly as reviewed:
    * usable ONLY after state A4 (activation deployment live) has
      been reached under Authorization A;
    * spent-check FIRST: this authorization is independently
      ONE-USE, consumed by the observation attempt regardless of
      outcome, and must be unspent; its spent state is never merged
      with Authorization A's;
    * the act, observation only: execute the exact reviewed
      persistent-state measurement package
      docs/exlib3a-option-b-current-state-measurement.sql
      (fingerprint re-measured at the gate) once by the operator
      path, and capture the read-only deployment-identity,
      variable-presence, and fail-closed-log observations of the
      reviewed runbook's section 6;
    * no mutation, no remediation, no advisor or setting change; on
      any ambiguous outcome: do not retry; capture the state,
      report, and stop;
    * then stop.
    This authorization permits no configuration change, no
    deployment, no delivery call, no revocation, no restore, no
    EXLIB-2S work, and no Git push or tag.

## 13. Negative boundary of THIS milestone

This milestone performed and permits: repository-grounded authoring
of this runbook, its preparation record, and its verifier; the
labeled completed-phase retarget; local commits on the local
branch; and the review export. It performed and permits NO: Vercel
contact; Supabase contact; environment-variable change; deployment
or redeployment; activation; delivery; revocation; rollback
execution; restore; production mutation of any kind; push; tag;
EXLIB-2S work. S6 remains STOPPED; BOTH section-12 grants
(Authorization A and Authorization M) are UNSENT.
