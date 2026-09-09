# EXLIB-3A OPTION A — activation-package preparation record

Recorded 2026-09-09 (UTC); ROUND-1 CORRECTED the same day under the
independent Codex review disposition CORRECT. This milestone
AUTHORED, locally and only locally, the controlled S6 activation
runbook (docs/exlib3a-option-a-activation-runbook.md) under the
operator's OPTION A governance disposition, which authorizes
PACKAGE AUTHORING AND LOCAL VALIDATION ONLY. Nothing was enabled
anywhere: no Vercel contact, no Supabase contact, no
environment-variable change, no deployment, no activation, no
delivery, no revocation, no restore, no push, no tag, no EXLIB-2S
work. S6 remains STOPPED and BOTH of the runbook's section-12
grants (AUTHORIZATION A — PRODUCTION ACTIVATION; AUTHORIZATION M —
POST-ACTIVATION READ-ONLY MEASUREMENT) are PREPARED — NOT ISSUED —
DELIBERATELY UNSENT.

## 1. What was prepared and where it stands

- The runbook: the exact future protected act (the two variables
  and their exact intended values, Production-only scope with the
  Preview/Development database posture honestly UNOBSERVED, the
  key-first ordering with its safety rationale, the at-scale
  acceptance, the three OBSERVABLE post-activation states and their
  instruments, the full STOP matrix, the four-mechanism rollback
  with the recommended bounded emergency flag-OFF
  pre-authorization, the direct-RPC posture, the A0-A6/F1-F2 state
  machine with preflight-before-authorization chronology, and the
  TWO drafted-unsent one-use grants).
- Authored on the local-only branch exlib3a-s6-delivery-governance:
  the round-0 package as ONE plain forward commit
  5d286889c7a6f9a5b663d92d61073d7207464736 over the Codex-approved
  Option-B evidence tip d4703187e1f52cdeda17d003023f8eb14e654480,
  and the round-1 correction as ONE further plain forward commit
  touching exactly the three authorized Option-A paths (chain
  5ed6fd84... -> 548849c0... -> 872e19ef... -> ba6a6ca6... ->
  3442c8f0... -> d4703187... -> 5d286889... -> correction; the
  durable production base main = origin/main = 5ed6fd84... is
  untouched).

## 2. Mechanical derivations this preparation rests on (repository
bytes at the current tree)

- THE TWO VARIABLES: the single delivery runtime module
  src/lib/supabase/deliver-catalog.ts reads exactly THREE
  process.env names; the enablement and run-key names are the two
  the runbook spells in fragments (the third is the operational
  timeout knob, excluded from activation). The static verifier
  derives the names from the module bytes and proves the runbook's
  fragment concatenations equal them — the names were re-derived,
  not recalled, and no governance file carries either contiguous
  name (the promoted 2T census's exact four-file carrier set is
  preserved).
- CANARY CENSUS (path AND content pinned): the repository-wide
  search for tenant-gating identifiers (allowlist, feature flag,
  canary and their variants) returns exactly TWO hits, both comment
  lines above unrelated PATCH field-validation logic —
  src/app/api/workout-exercises/[id]/route.ts ("enforces a strict
  prescription/annotation allowlist: unknown keys") and
  src/app/api/routine-exercises/[id]/route.ts ("enforces a strict
  prescription/notes allowlist (exactly the fields") — no
  user/tenant allowlist, no per-account flag, no route gating, no
  test-user path scopes the flag-ON behavior. The verifier pins
  both hits by path and content, so converting either into a real
  tenant/feature gate cannot hide behind an unchanged count. Hence
  the runbook's determination: NO EXISTING APPLICATION-LEVEL
  SINGLE-TENANT CANARY.
- PREVIEW/DEVELOPMENT DATABASE POSTURE (UNOBSERVED): repository
  bytes prove only that every environment's build reads the same
  Supabase URL/key variable FAMILY with no per-environment database
  indirection in code. The hosted VALUES assigned per environment
  are platform facts — the platform supports distinct
  per-environment values — and remain UNOBSERVED until the
  read-only Vercel preflight, so non-production database isolation
  CANNOT BE ASSUMED in either direction, and a Preview/Development
  canary is NOT AUTHORIZED as an activation shortcut (runbook
  section 2 records both follow-ups: an observed shared-project
  fact would be recorded and canary use would remain prohibited;
  observed isolation still would not expand the Production-only
  authorization).
- TELEMETRY LIMIT: the delivery module's ONLY console call is the
  fail-closed console.error line; the repository contains NO
  success-telemetry instrument that mechanically proves a
  successful app-path delivery invocation, so the observation plan
  claims none.
- NO PLATFORM CONFIG IN BYTES: no vercel.json and no framework
  binding of the delivery variables exists in the repository, so
  every platform fact (project identity, current variable posture,
  redeploy semantics, promoted deployment) is classed
  platform-operational and assigned to the future READ-ONLY
  operator preflight; none is claimed now.

## 3. The pinned runbook fingerprint (the binding target of
AUTHORIZATION A)

The FINAL corrected runbook
docs/exlib3a-option-a-activation-runbook.md is exactly 25001 bytes,
sha256
5e0a8b9c66af81ddc4a3c6119c5fd2e2106049077f469bebefe181dc3ffa7464.
The drafted AUTHORIZATION A binds this exact fingerprint (its
placeholder resolves to this committed value), re-measured at the
gate; any byte change to the runbook voids the pin and this record
must be re-issued with the new value. The static verifier
recomputes the runbook's SHA-256 from bytes on every run and fails
if this record's pinned value drifts.

## 4. Round-1 correction (Codex disposition CORRECT; architecture
accepted)

Five precision/sequencing corrections were applied in the round-1
commit, none touching the accepted V12 retarget:
1. The claim that non-production environments definitively share
   the production Supabase project was removed as unobserved;
   section 2 now derives the same Production-only policy from the
   honest ground that isolation is UNOBSERVED until the preflight,
   and the preflight's item 3 now also captures the per-environment
   database-target posture.
2. The state machine chronology was corrected: A0 no longer claims
   hosted variable absence; A1 completes the read-only preflight
   with BOTH grants still UNISSUED; A2 is entered only after
   AUTHORIZATION A is issued and unspent.
3. The post-activation states were renamed to what instruments
   observe: zero counts are never translated into request history,
   nonzero persistent state is never attributed to a mechanism
   (standing direct-RPC reachability is a competing possible
   writer), and the no-success-telemetry limit is stated from
   bytes.
4. The eventual human gate was split into TWO one-use grants —
   AUTHORIZATION A (activation) and AUTHORIZATION M (post-activation
   read-only measurement, usable only after state A4) — issuable
   together only after the accepted preflight, spent separately,
   never merged; M is not an investigation license for a
   pre-A4 failure.
5. The corrected runbook's exact byte count and SHA-256 are pinned
   in this committed record (section 3) and bound by the
   AUTHORIZATION A draft.

## 5. Verifier lifecycle for this milestone

scripts/verify-exlib3a-option-a.ts (static, in the battery, exactly
SIXTEEN checks before and after the correction) proves: the
inherited Option-B baseline (cross-extracted from the promoted
evidence-record bytes, never restated); the variable derivation
(module-byte extraction equals the fragment concatenations; exactly
three env reads with the timeout excluded; no phase file carries a
contiguous name); the exact intended values (the enablement string
and the reserved run key equal to the byte-frozen authority
artifact's literal); the Production-only scope WITH the unobserved
Preview/Development database posture (rejecting any unobserved
same-project assertion in either document); the three fact classes
with the six-item operator preflight including the database-target
posture item; the key-first ordering grounded in the module's
missing-key fail-closed line; the at-scale acceptance and the
NO-CANARY determination with the census pinned by path AND content;
the observable-state observation plan (three states, the
no-request-history and no-mechanism-attribution laws, the
telemetry limit checked against the module's single console call,
AUTHORIZATION M scope); the STOP matrix; the rollback section with
the unconditional database-rollback/revocation exclusion; the
direct-RPC posture; the TWO drafted grants inspected in their own
slice (separately named, separately one-use, separately spent,
UNSENT, the runbook-fingerprint binding recomputed from bytes
against section 3 of this record); the corrected state-machine
chronology (A0 UNOBSERVED, A1 UNISSUED, A2 gated on AUTHORIZATION
A, A5 under AUTHORIZATION M); the evidence-family separation with
the persistent-state-attribution prohibition; hygiene; and topology
(the round-0 commit plus the round-1 correction touching exactly
the three authorized paths, with the accepted V12 retarget
byte-unchanged).

## 6. Stale-claim sweep, battery reconciliation, and adversarial
controls

Round 0: the sweep against a simulated commit built from the
intended phase paths (before the V12 retarget; measured 103 suites
/ 7,279 checks / 2 failures) enumerated exactly ONE stale
historical check — verify-exlib3a-option-b-application V12's
completed-phase topology — the recurring completed-phase pattern
(fifteenth instance), retargeted count-neutral under the exact
label `RETARGET (EXLIB-3A OPTION A activation preparation)` to
anchor at that phase's own accepted evidence tip
d4703187e1f52cdeda17d003023f8eb14e654480; the only other red was
this milestone's OWN new verifier holding its retarget-coverage
check red until the retarget landed — the guard authored before the
repair.

Round 1: the correction touches only the three Option-A paths, so
no predecessor check goes stale (V12 and every earlier retarget are
anchored at their own tips, not at HEAD); the only topology that
moved was this milestone's own A16, updated within its own
milestone to pin the round-0-plus-correction chain. The
simulated-commit battery, the committed battery, and the
fresh-clone battery all read 103 suites / 7,279 checks / 0 failures
— the pre-milestone baseline 102/7,263 plus exactly this
milestone's 16-check static suite and nothing else, count-neutral
across the correction. Adversarial controls (isolated scratch
copies, each embodying one defect, each required to turn the suite
RED on the targeted check): round 0 ran seven (flag-first ordering;
single-user delivery claim; reachability-creation claim; at-scale
acceptance omitted; database revocation in automatic rollback;
authorization marked issued; Production/Preview scope ambiguity);
round 1 ran the eight mandated controls (reintroducing the
unobserved same-project assertion; reintroducing the hosted-absence
baseline claim; requiring an issued activation authorization at A1;
translating zero counts into request history; attributing nonzero
state to the app path by timeline; merging the two grants' spent
states; removing the runbook-fingerprint binding; converting a
census hit into a real tenant canary at an unchanged count).

## 7. What did NOT happen (the boundary)

No Vercel contact (no preflight was performed — the runbook only
DEFINES it), no Supabase contact, no SQL execution, no
environment-variable change anywhere, no deployment or
redeployment, no activation, no delivery, no revocation, no
rollback execution, no restore, no push, no tag, no EXLIB-2S act.
The hosted run remains SEALED and SPENT; the Option-B evidence and
its SPENT authorization are unchanged; the historical gaps remain
historical; main = origin/main = 5ed6fd84... untouched.

## 8. Stop condition

This milestone stops LOCAL-ONLY on its branch for Codex re-review
of the corrected activation package. The next gated steps, in
order, each separate: Codex re-review of the correction; the
operator's read-only Vercel preflight (section 3.B of the runbook —
gathered by the operator, never by Claude); the operator's issuance
of the two section-12 one-use grants (only after the preflight is
accepted; AUTHORIZATION A binding the reviewed commit, the pinned
runbook fingerprint re-measured at the gate, and the
preflight-established project identity; AUTHORIZATION M usable only
after state A4); the operator's execution of the activation
sequence under A; the post-activation observation under M and its
evidence record. S6 activation remains STOPPED until AUTHORIZATION
A is issued and executed.
