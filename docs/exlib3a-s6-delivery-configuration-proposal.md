# EXLIB-3A — S6 delivery-configuration governance and proposal

Recorded 2026-09-08 (UTC). DISCOVERY AND PROPOSAL ONLY: this
milestone changes no environment variable, enables no flag, calls
no delivery, revokes nothing, restores nothing, contacts neither
Supabase nor Vercel, pushes nothing, tags nothing, and modifies no
hosted state. Every architectural claim below is grounded in
repository bytes at the durable base commit. The milestone
identifier EXLIB-3A was selected by census: the exlib2 letter
namespace is exhausted (2a-2z all used, with 2s reserved/forbidden
and never to be reused), and no exlib3 artifact exists.

## 1. Durable starting point

- Base: main = origin/main =
  5ed6fd84ea81ce1b4ca768b44e036432d26c3ab8, the durably closed
  EXLIB-2Z tip, carried by the annotated stable tag
  exlib2z-hosted-application-evidence-stable (81-byte annotation),
  which peels exactly to that commit.
- This proposal is authored on the local-only branch
  exlib3a-s6-delivery-governance created from fresh origin/main at
  exactly that commit.

## 2. Inherited S5 facts (closed history; never reopened here)

- Hosted run: exlib2u-plank-release1-staged-v1, hosted surrogate
  6669ba78-8e75-4042-ac2a-14082a9e5940.
- S5 sealed exactly once; the S5 authorization is SPENT — DO NOT
  RERUN. approved_for_delivery = true through the successful S5
  transaction; sealed_at = 2026-09-08T21:24:23.744781Z; the run was
  unrevoked as of the S5 transaction proof.
- The delivery predicate matched exactly one row through COMMIT;
  delivered tenant rows were exactly ZERO through COMMIT; no
  operator delivery call has occurred; no S6 action has occurred;
  no revocation or restore has occurred; no manual Vercel action
  has occurred.

## 3. Inherited historical evidence gaps (inherit, never "fix")

Two post-COMMIT observations were unavailable because the raw SQL
endpoint was blocked after S5:

1. the exact post-COMMIT delivered-row predicate (the count of
   public.exercises rows WHERE import_run_id IS NOT NULL) was NOT
   successfully re-observed;
2. the exact post-COMMIT table cardinalities were NOT successfully
   re-observed — the Supabase MCP list_tables rows values available
   after COMMIT were live_rows_estimate-backed estimates only.

These are HISTORICAL gaps. A later measurement cannot retroactively
prove what happened in the original post-COMMIT interval. Nothing
in this proposal claims otherwise; option B below is framed
strictly as current-state assurance.

## 4. Current delivery architecture (repository bytes at the base)

- ONE runtime module owns delivery:
  src/lib/supabase/deliver-catalog.ts (the EXLIB-2T runtime). It is
  the single initialization entry point; every former direct seed
  call site routes through initializeExercisesIfNeeded.
- The ENABLEMENT VARIABLE (the exact-string flag; its read is the
  single comparison at deliver-catalog.ts, isCatalogDeliveryEnabled)
  turns delivery on ONLY when the value is exactly the string
  "true"; absent, empty, "false", "1", "TRUE", "yes" — anything
  else — means OFF. The verified 2T census proves NO tracked file
  assigns the variable, and the repository's environment files
  (.env.example; the untracked local env file) carry NO delivery
  variables at all (verified live in this discovery: zero
  delivery-variable names in either).
- The RUN-KEY VARIABLE (read by catalogDeliveryRunKey) supplies the
  p_run_key argument; a missing/blank key with the flag ON fails
  closed BEFORE any database call. The TIMEOUT VARIABLE is an
  operational knob only (default 10,000 ms; invalid values fall
  back to the default).
- THREE entry points call initializeExercisesIfNeeded, each
  server-side only (none carries a use-client directive) and each
  authenticates FIRST (supabase.auth.getUser with redirect/401
  before initialization):
  1. src/app/(app)/workouts/page.tsx (the /workouts server page);
  2. src/app/(app)/workouts/exercises/page.tsx;
  3. src/app/api/exercises/route.ts (GET /api/exercises).
- Flag OFF (the strict default): the pre-existing seed path runs
  byte-for-byte unchanged (seedExercisesIfNeeded — idempotent,
  count-guarded: returns early when the user already has exercise
  rows).
- Flag ON: delivery-first under the FAIL-CLOSED LAW — the flag-ON
  path structurally cannot reach the seed (the seed identifier
  appears nowhere below the module's FAIL-CLOSED REGION marker,
  proven mechanically by verify-exlib2t.ts and behaviorally by
  verify-exlib2t-runtime.ts for every failure class: rejected run,
  database error, timeout, malformed response, missing key,
  unexpected exception). There is deliberately NO client-side count
  guard on the flag-ON path: existing seeded tenants MUST reach the
  database function, which owns idempotence
  (skipped_already_delivered), per-user collision handling, and
  migration 026's pristine-Plank in-place reconciliation.
- The RPC call is public.deliver_catalog_exercises(p_run_key) over
  the AUTHENTICATED USER'S OWN connection. The module's own header
  states the boundary honestly: EXECUTE is granted to
  authenticated, and the database's sealed/approved/unrevoked run
  predicate — not this flag — is the security boundary.
- The delivery summary is validated against the COMPLETE
  migration-026 contract (exactly fourteen keys; counter
  arithmetic including the single P2 in-place-correction offset;
  UUID-checked inserted ids); anything malformed fails closed.
- TIMEOUT AMBIGUITY is inherited from supabase-js (no supported
  cancellation): a timeout abandons the WAIT, not the database
  transaction — classified unknownDeliveryOutcome: true, never
  proof of non-delivery. The timed-out request never seeds; the
  next attempt reconciles because the function is idempotent per
  user.
- Governing migrations: 023 (the run/seal/delivery contract, the
  authority REVOKEs/GRANTs, revocation) and 026 (the CURRENT
  deliver_catalog_exercises and rollback_catalog_delivery
  definitions; ACLs retained from 023 because CREATE OR REPLACE
  preserves them). Migrations 024/025/027 do not touch the delivery
  machinery.
- Existing tests: verify-exlib2t.ts (16/0 at the base) and
  verify-exlib2t-runtime.ts (13/0 at the base), both in the
  battery, pin the module bytes and every runtime failure class.

## 5. What flag activation actually does (the key runtime fact)

Changing environment variables ALONE invokes nothing by itself —
there is no boot-time delivery, no job, no hook. But once the
enablement variable is exactly "true" AND the run-key variable is
configured in the running deployment, delivery happens
AUTOMATICALLY, per authenticated user, on that user's next request
to ANY of the three entry points. S6 activation is therefore NOT an
operator-invoked single call: it is an at-scale, per-user,
automatic delivery rollout to every active authenticated user, and
to every future signup, gated only by their ordinary page/API
traffic. Client code cannot influence the run key through the app
path (the RPC argument comes from server environment, never from
request input), and neither variable is client-inlined (neither
carries the framework's public prefix; the module is imported only
by server files).

REDEPLOY SEMANTICS, bounded to repository evidence: the accessors
read process.env at call time in server code; nothing in the
repository inlines these values at build time. Whether changing a
hosted environment variable requires a redeploy to take effect for
already-deployed serverless functions is a PLATFORM-operational
fact not derivable from repository bytes; any future activation
plan must state it from platform knowledge and must not assume a
live flag flip without a deploy event. No Vercel contact was made
to answer this.

## 6. The direct-RPC reachability distinction (S6 is NOT the
security boundary)

Because S5 sealed the run, the database delivery predicate is
already satisfied, and deliver_catalog_exercises is SECURITY
DEFINER with EXECUTE granted to authenticated. Authenticated
direct-RPC delivery is therefore ALREADY technically reachable to
any caller that knows the run key, independently of the
application's delivery flag. S6 must never be described as making
delivery technically reachable for the first time — it concerns
the APPLICATION path and its governance only.

THE RUN KEY IS NOT A SECRET AND MUST NOT BE TREATED AS AN
ACCESS-CONTROL MECHANISM: the reserved key literal appears in
sixteen committed repository files at the base (packages, records,
forms — by design; the authority form chose it as "a permanent,
meaningful release identifier"). The only security boundary is the
database predicate (sealed + approved + unrevoked) plus per-user
scoping (auth.uid()): an authenticated caller can deliver only
into that caller's OWN tenant, idempotently. This was accepted
explicitly in the issued S5 authorization.

## 7. Threat and risk analysis

- AUTHENTICATED CALLER LEARNS/GUESSES THE RUN KEY: assumed true by
  design (sixteen committed carriers; not a secret). Consequence:
  that caller can import the six catalog members into their OWN
  tenant via direct RPC, today, flag OFF. Severity: LOW-BY-DESIGN
  content-wise (the six members are the reviewed, sealed release
  content — exactly what delivery is FOR); the harm is governance
  (delivery occurring before the operator's intended rollout) and
  evidence (delivered-row state drifting outside operator action).
- DIRECT RPC BYPASSES THE APP FLAG: true and standing (section 6).
  The app flag mitigates ONLY the automatic at-scale app path; it
  does NOT mitigate direct RPC, and nothing app-side can.
- RUN-KEY EXPOSURE THROUGH SOURCE/LOGS/CLIENT
  BUNDLES/ERRORS/RESPONSES/CONFIG: source — sixteen committed docs
  carriers (by design); client bundles — no client import of the
  module and no public-prefix variable, so the runtime value is
  never inlined client-side; logs/errors — the module's failClosed
  logs reasons server-side; the missing-key message names the
  variable, not a value; the delivery summary echoes run_key
  server-side only (the three call sites discard the outcome
  object; no entry point returns it to the client); config — no
  repository file assigns either variable (2T census, re-verified).
- UNAUTHORIZED TENANT IMPORTING THE SIX MEMBERS: possible today
  via direct RPC for that tenant only; per-user advisory lock +
  unique indexes + name-claim collision handling bound the effect
  to the caller's own rows.
- DUPLICATE/IDEMPOTENT BEHAVIOR: the database function is
  idempotent per user (skipped_already_delivered; partial unique
  (user_id, catalog_logical_id); collision skip-and-report;
  subtransactions catch only unique_violation; the P2 in-place
  correction is the single accounting offset). Repeat calls
  converge; the app's timeout ambiguity is reconciled by the same
  idempotence.
- WHAT THE APP FLAG MITIGATES AND WHAT IT DOES NOT: it gates the
  automatic at-scale rollout (every authenticated user's next
  visit) and nothing else. It is a rollout throttle and an
  official-path switch, not a security control.
- CONSEQUENCES OF LEAVING THE SEALED RUN UNREVOKED: direct-RPC
  reachability persists indefinitely (until revocation, which is
  one-way and separately gated). Ongoing low-rate risk that
  individual tenants self-deliver ahead of the official rollout,
  further drifting the delivered-row state relative to the
  historical gaps.
- DOES S6 INCREASE BLAST RADIUS? Materially yes in SCALE, not in
  privilege: activation converts one-off per-tenant reachability
  into automatic delivery for the entire authenticated user base
  through three high-traffic surfaces, and makes the delivery
  outcome part of every affected request's critical path
  (fail-closed = those users' exercise initialization pauses on
  any delivery failure until a later attempt succeeds). No new
  privilege is created (the DB grant already exists).
- PRODUCTION REDEPLOY: see section 5 — a deploy event must be
  assumed necessary by the future activation plan; the platform
  question is flagged, not answered, from repository bytes.
- VERCEL-SPECIFIC OPERATIONAL RISK (repository evidence only): the
  repository shows no Vercel configuration files binding these
  variables (no vercel.json; no framework config assigning them),
  so any activation is a dashboard/platform act by the operator —
  outside the repository, requiring its own explicit one-use
  authorization and its own evidence capture. Nothing more can be
  said from bytes, and no Vercel contact was made.

## 8. Disposition options

OPTION A — PROCEED TOWARD CONTROLLED S6 ACTIVATION.
Define and review an activation package BEFORE any change:
required evidence and controls, at minimum — (1) a CURRENT-STATE
hosted measurement (option B's read-only package) executed first,
so activation decisions rest on measured present facts (delivered
rows now, run posture now, revocation state now), correctly framed
as unable to close the historical gaps; (2) an activation runbook
naming the exact variables, values (the enablement string and the
reserved run key), the deploy event, and the observation protocol
immediately after activation (per-request outcomes are server-side;
what the operator will read, where, and what values are
STOP-worthy); (3) explicit acceptance that activation is automatic
and at-scale (section 5) and that fail-closed pauses affected
users' initialization on delivery failure; (4) the rollback
runbook (section 15) accepted, including that flag-OFF stops ONLY
the app path; (5) a one-use human authorization drafted for the
activation act itself, separate from B's. Residual risk: the
historical gaps remain historical; activation proceeds on
current-state assurance plus the in-transaction S5 proofs.

OPTION B — REQUIRE A FRESH CURRENT-STATE MEASUREMENT BEFORE ANY S6
DECISION (RECOMMENDED as the immediate next act).
One read-only hosted measurement package, operator-executed under
its own one-use authorization, measuring AS OF NOW: (1) exact
count of public.exercises WHERE import_run_id IS NOT NULL, and the
same for public.exercise_aliases (delivered-row state today); (2)
the run row posture (approved/sealed/revoked/operational fields)
and that exactly one run exists; (3) exact COUNT(*) cardinalities
of the eleven catalog tables and both tenant tables; (4) the
delivery predicate row count; (5) advisor snapshot (observed
only). FRAMING, mandatory and explicit: these are CURRENT-STATE
facts. They provide assurance about NOW (e.g., "zero delivered
rows exist today" would prove no delivery has occurred to date,
which SUBSUMES the practical worry behind the historical gaps
without claiming to observe the past); they CANNOT retroactively
prove what happened inside the original post-COMMIT interval, and
the historical gaps remain recorded exactly as closed out. WHY
THIS FIRST: it is cheap, read-only, reversible, uses the exact
governed evidence pattern, and produces precisely the facts that
make A-versus-C decidable (nonzero delivered rows today would
change the activation conversation entirely; zero delivered rows
today plus intact posture makes controlled activation
well-grounded). This proposal DRAFTS the authorization (section
16) and executes nothing.

OPTION C — HOLD S6 INDEFINITELY.
Operational consequences: the app keeps seeding new users with the
legacy 15-exercise bodyweight seed (including the bodyweight Plank
that migration 026's reconciliation exists to correct); the
reviewed catalog release reaches no one through the official path;
the sealed run remains deliverable via direct RPC to any
authenticated tenant that uses the non-secret key, indefinitely,
so tenant-state divergence can grow without any operator act; the
delivered-row state remains unmeasured (unless B runs anyway,
which this option also benefits from); and the S5 seal's purpose
(the release) is deferred without a defined revisit trigger.
Revocation is NOT recommended here and is discussed only as the
separately gated one-way emergency option it is (section 15) — it
would permanently kill this sealed run and force a whole new
S4-then-S5 pipeline for any future release of this content.

## 9. Recommendation

OPTION B first, as its own small, separately authorized, read-only
milestone; then re-decide A versus C with current facts on the
table. Technical justification: (1) the single decision-relevant
unknown — whether ANY delivery has occurred to date through the
standing direct-RPC reachability — is answerable exactly, cheaply,
and without risk; (2) activation (A) is automatic and at-scale the
moment the variables land in a deployment, so it should not be
initiated while the present delivered-row state is unknown even as
a current fact; (3) holding (C) without measuring leaves a
growing, unmeasured divergence window; B bounds it. B's framing
discipline (current-state assurance, never retroactive proof)
preserves the historical record exactly as the operator and Codex
closed it.

## 10. The proposed next protected act (exact; nothing here
executes it)

Under the recommendation, the next protected act is OPTION B's
read-only hosted measurement, operator-executed. Its package would
be a SELECT-only script (no BEGIN required beyond a read-only
transaction; no locks beyond reads; zero writes) over: the two
delivered-row predicates, the run-row posture, the thirteen exact
COUNT(*) cardinalities, and the delivery-predicate count — plus
the operator's advisor observation. Its evidence lands in an
EXLIB-3A application record on the established pattern,
provenance-labeled (exact COUNT(*) results this time, from the SQL
editor, not connector metadata). The eventual OPTION A activation
act — setting the two variables in the hosted platform and
deploying — is sketched in section 8/A and is NOT proposed for
authorization in this milestone.

## 11. Preconditions (for the recommended measurement act)

- The durable base and tag of section 1 unchanged; EXLIB-3A
  proposal reviewed and approved by Codex; the operator's explicit
  one-use authorization (section 16) issued.
- Spent-check first: no prior attempt of the measurement under
  that authorization.
- Executor: Joseph/ChatGPT in the hosted SQL editor as the
  operator role — never Claude, never a pipeline.
- The script byte-verified against its reviewed fingerprint at the
  gate.

## 12. Postconditions (for the measurement act)

- Zero writes: the hosted state after equals the hosted state
  before (SELECT-only; nothing else is lawful under it).
- A complete captured result set: every query answered with exact
  values, or the attempt classified per section 14.
- The evidence record authored locally afterward with exact-count
  provenance labeling, then reviewed on the established pattern.

## 13. Refusal / STOP conditions

- Any spent/preflight mismatch: STOP — report exactly; no repair,
  retry, or substitution.
- The measurement finds the run row missing, a second run, a
  revoked posture, or any posture contradicting the closed S5
  record: STOP / DO NOT PROCEED TOWARD ACTIVATION — report as
  state movement; the governance decision returns to the operator.
- NONZERO delivered rows today: NOT an error to be fixed —
  STOP-and-report as post-activation-era delivery having occurred
  via the standing reachability; do not attribute a mechanism, do
  not revoke, do not continue toward A under any existing text.

## 14. Ambiguity protocol (for the measurement act)

Read-only, so ambiguity is cheap: an interrupted or blocked query
is simply re-run — EXCEPT that the operator must never substitute
estimate-backed metadata for a blocked exact count (the round-2
lesson: the instrument's semantics are part of the evidence). If
the SQL endpoint blocks exact counts again, the attempt is
reported exactly so, the gap is recorded as a gap, and no estimate
is presented as a count. The authorization is consumed by the
attempt regardless of outcome.

## 15. Rollback and shutdown semantics (four distinct paths, never
conflated)

1. APP FLAG OFF (or variables removed) + deploy event: REVERSIBLE.
   Stops the AUTOMATIC app path only; the seed path resumes for
   uninitialized users; direct RPC reachability is UNTOUCHED.
2. rollback_catalog_delivery(run_key): authenticated-granted,
   PER-CALLING-USER, deactivate-only (sets is_active = false on
   that user's delivered exercises and aliases; reference-guarded).
   It un-delivers content for ONE tenant reversibly-in-effect (rows
   deactivated, not deleted); it is NOT a global rollback and NOT
   an operator kill switch.
3. exlib_revoke_run_delivery(run_key): operator-only (no client
   grant), ONE-WAY, PERMANENT. Blocks ALL future delivery of this
   run — app path and direct RPC alike — and never reopens
   membership or approval. This is the only true global shutdown
   short of restore, and it is irreversible: a future release of
   this content would require a whole new run through S4 then S5.
4. PHYSICAL RESTORE: rewinds the entire database to the backup
   instant, destroying everything after it (including the seal,
   depending on the instant). A catastrophic-only operator
   decision, separately gated, never a delivery-management tool.

## 16. Drafted human authorization for the recommended OPTION B
measurement (PREPARED — NOT ISSUED — DELIBERATELY UNSENT)

The following is the COMPLETE text the operator would send, only
after Codex approves this proposal and only as their own one-use
decision. Nothing in this milestone issues, requests, or
pre-consumes it; Claude never issues authorizations.

    Authorize the EXLIB-3A read-only current-state measurement
    exactly as reviewed:
    * spent-check FIRST: confirm no prior attempt under this
      authorization;
    * verify the reviewed measurement script's sha256 at the gate;
    * execute it exactly once against ShredOS ref
      ttybyljytiwntvorugcv as the operator, read-only;
    * capture every result exactly (exact COUNT(*) values; never
      estimate-backed metadata as a substitute — if an exact count
      is blocked, record the block itself);
    * on any refusal or state contradiction: STOP and report
      exactly; no repair, no retry beyond re-running a read-only
      query, no substitution;
    * report the complete result set for the EXLIB-3A evidence
      record;
    * then stop.
    This authorization is ONE-USE and is consumed by the attempt.
    It is CURRENT-STATE ASSURANCE ONLY: its results cannot and do
    not retroactively close the historical post-COMMIT observation
    gaps, which remain recorded exactly as closed out. It permits
    no write of any kind, no delivery, no revocation, no restore,
    no environment or delivery-variable change, no S6 activation,
    no EXLIB-2S work, no Git push or tag, and no manual Vercel
    action.

## 17. Negative boundary of THIS milestone

This milestone performed and permits: read-only repository
discovery at the base commit, this proposal, its verifier, the
labeled completed-phase retarget of section 19, local commits on
the local branch, and the review export. It performed and permits
NO: Supabase contact; Vercel contact; delivery call; revocation;
restore; S5 rerun; environment or delivery-variable change; flag
enablement; S6 activation; EXLIB-2S work; push; tag; hosted or
production modification of any kind. The hosted run remains SEALED
and SPENT; the historical gaps remain exactly as recorded; S6
remains STOPPED pending the operator's disposition of sections
8-9.

## 18. Verifier lifecycle for this milestone

scripts/verify-exlib3a.ts (new, static, read-only, in the battery)
proves: the durable base and tag pins; the inherited S5 facts and
gap language CROSS-EXTRACTED from the promoted EXLIB-2Z records
(never restated by hand); the architecture claims bound to module
bytes (the exact-string flag read, the null-key fail-closed, the
FAIL-CLOSED REGION marker, the single RPC call site) and to the
three entry points (server-side, authenticated-before-initialize,
unconditional initialize call); the environment-file census (no
delivery variables anywhere; needles constructed, never carried
contiguously — this milestone's files must not join the 2T flag
census's exact carrier set); the automatic-at-scale statement; the
not-a-secret run-key fact (a committed-file census at the base);
the rollback/revocation semantics bound to migration bytes
(per-user deactivate-only versus one-way permanent); the presence
and framing of options A/B/C, the threat-model items, and the
OPTION B recommendation with its cannot-close-historical-gaps
discipline; the section-16 authorization inspected IN ITS OWN
SLICE, marked PREPARED — NOT ISSUED — DELIBERATELY UNSENT with the
consumed-by-attempt, exact-counts-only, and full negative-boundary
language; hygiene; and topology.

## 19. Stale-claim sweep and battery reconciliation

The sweep against a simulated commit built from the intended phase
paths (before the retarget; measured 100 suites / 7,237 checks / 2
failures) enumerated exactly ONE stale historical check —
verify-exlib2z-application S12's completed-phase topology (its
committed branch pinned exactly three commits over 3969a98f...,
true until this milestone's own successor commit; its uncommitted
branch could not describe this milestone's authoring state) — the
recurring completed-phase pattern (twelfth instance), retargeted
count-neutral under the exact label `RETARGET (EXLIB-3A S6
delivery governance)` to anchor at that phase's own durably closed
tip 5ed6fd84ea81ce1b4ca768b44e036432d26c3ab8 (the stable-tagged
EXLIB-2Z closeout), where the chain and inventories held and hold
forever. The only other red was this milestone's OWN new verifier
holding its retarget-coverage check red until the retarget landed
— the guard authored before the repair, its output the worklist.
With the retarget in place the simulated-commit battery, the
committed battery, and the fresh-clone battery all read 100 suites
/ 7,237 checks / 0 failures — the prior baseline 99/7,223 plus
exactly this milestone's new 14-check static suite and nothing
else.

## 20. Stop condition

This milestone stops LOCAL-ONLY on its branch for Codex review.
Not pushed, not promoted, not tagged; no hosted contact of any
kind occurred. The next gated steps, in order, each separately
instructed: Codex review of this proposal; the operator's
disposition among options A/B/C; if B, the measurement package
milestone (authoring, review, and the section-16 authorization —
issued only by the operator); and only after measured
current-state facts, any reconsideration of A or C. S6 activation
remains STOPPED throughout.
