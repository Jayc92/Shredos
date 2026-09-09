# EXLIB-3A OPTION A — activation-package preparation record

Recorded 2026-09-09 (UTC). This milestone AUTHORED, locally and
only locally, the controlled S6 activation runbook
(docs/exlib3a-option-a-activation-runbook.md) under the operator's
OPTION A governance disposition, which authorizes PACKAGE AUTHORING
AND LOCAL VALIDATION ONLY. Nothing was enabled anywhere: no Vercel
contact, no Supabase contact, no environment-variable change, no
deployment, no activation, no delivery, no revocation, no restore,
no push, no tag, no EXLIB-2S work. S6 remains STOPPED and the
runbook's section-12 authorization is PREPARED — NOT ISSUED —
DELIBERATELY UNSENT.

## 1. What was prepared and where it stands

- The runbook: the exact future protected act (the two variables
  and their exact intended values, Production-only scope, the
  key-first ordering with its safety rationale, the at-scale
  acceptance, the three-state post-activation observation plan, the
  full STOP matrix, the four-mechanism rollback with the
  recommended bounded emergency flag-OFF pre-authorization, the
  direct-RPC posture, the A0-A6/F1-F2 state machine, and the
  drafted-unsent authorization).
- Authored on the local-only branch exlib3a-s6-delivery-governance
  over the Codex-approved Option-B evidence tip
  d4703187e1f52cdeda17d003023f8eb14e654480 (chain 5ed6fd84... ->
  548849c0... -> 872e19ef... -> ba6a6ca6... -> 3442c8f0... ->
  d4703187...; the durable production base main = origin/main =
  5ed6fd84... is untouched).

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
- CANARY CENSUS: a repository-wide search for tenant-gating
  identifiers (allowlist, feature flag, canary and their variants)
  returns exactly TWO hits, both unrelated PATCH field-validation
  allowlists (workout-exercises and routine-exercises id routes) —
  no user/tenant allowlist, no per-account flag, no route gating,
  no test-user path scopes the flag-ON behavior. Hence the
  runbook's determination: NO EXISTING APPLICATION-LEVEL
  SINGLE-TENANT CANARY.
- PREVIEW/DEVELOPMENT NON-ISOLATION: every environment of this
  application targets the same hosted Supabase project (one URL
  variable family in the environment template; no per-environment
  database indirection exists in the repository), so a
  Preview/Development "canary" would act on the production sealed
  run and database — the runbook prohibits it as an activation
  shortcut.
- NO PLATFORM CONFIG IN BYTES: no vercel.json and no framework
  binding of the delivery variables exists in the repository, so
  every platform fact (project identity, current variable posture,
  redeploy semantics, promoted deployment) is classed
  platform-operational and assigned to the future READ-ONLY
  operator preflight; none is claimed now.

## 3. Verifier lifecycle for this milestone

scripts/verify-exlib3a-option-a.ts (new, static, in the battery)
proves: the inherited Option-B baseline (the zero provenance
surfaces, the sealed posture instants, and the vector
CROSS-EXTRACTED from the promoted evidence-record bytes, never
restated); the variable derivation (module-byte extraction equals
the fragment concatenations; exactly three env reads with the
timeout excluded; no phase file carries a contiguous name); the
exact intended values (the enablement string and the reserved run
key equal to the byte-frozen authority artifact's literal); the
Production-only scope with the multi-environment prohibition and
the preview-canary prohibition; the three fact classes with the
six-item operator preflight and the no-Vercel-contact-now boundary;
the key-first ordering (required pins plus the flag-first
rejection) grounded in the module's missing-key fail-closed line;
the at-scale acceptance and the NO-CANARY determination; the
three-state post-activation observation plan including the re-use
of the reviewed Option-B measurement instrument under a NEW
authorization; the activation-versus-delivery evidence separation;
the STOP matrix (representatives of all three phases plus the STOP
semantics); the rollback section (four mechanisms, the primary
flag-OFF limits, the recommended bounded pre-authorization, and the
unconditional exclusion of database rollback and revocation from
it); the direct-RPC posture (activation does not create the
privilege; no DB-grant change proposed); the section-12 draft
inspected IN ITS OWN SLICE (UNSENT, one-use consumed-by-attempt,
the binding list, the explicit at-scale acceptance, the bounded
rollback scope, the negative boundary, and the
must-not-authorize-itself statement); the state machine (all nine
labels and the no-implicit-transition rule); hygiene; and topology
including the labeled completed-phase retarget of section 4.

## 4. Stale-claim sweep and battery reconciliation

The sweep against a simulated commit built from the intended phase
paths (before the retarget; measured 103 suites / 7,279 checks / 2
failures) enumerated exactly ONE stale historical check —
verify-exlib3a-option-b-application V12's completed-phase topology
(its committed branch pinned exactly one commit over 3442c8f0...,
true until this milestone's own commit; its uncommitted branch
could not describe this milestone's authoring state) — the
recurring completed-phase pattern (fifteenth instance), retargeted
count-neutral under the exact label `RETARGET (EXLIB-3A OPTION A
activation preparation)` to anchor at that phase's own accepted
evidence tip d4703187e1f52cdeda17d003023f8eb14e654480, where the
chain and inventories held and hold forever. The only other red was
this milestone's OWN new verifier holding its retarget-coverage
check red until the retarget landed — the guard authored before the
repair. With the retarget in place the simulated-commit battery,
the committed battery, and the fresh-clone battery all read 103
suites / 7,279 checks / 0 failures — the prior baseline 102/7,263
plus exactly this milestone's new 16-check static suite and nothing
else.

## 5. What did NOT happen (the boundary)

No Vercel contact (no preflight was performed — the runbook only
DEFINES it), no Supabase contact, no SQL execution, no
environment-variable change anywhere, no deployment or
redeployment, no activation, no delivery, no revocation, no
rollback execution, no restore, no push, no tag, no EXLIB-2S act.
The hosted run remains SEALED and SPENT; the Option-B evidence and
its SPENT authorization are unchanged; the historical gaps remain
historical; main = origin/main = 5ed6fd84... untouched.

## 6. Stop condition

This milestone stops LOCAL-ONLY on its branch for Codex review of
the exact activation plan. The next gated steps, in order, each
separate: Codex review of this package; the operator's read-only
Vercel preflight (section 3.B of the runbook — gathered by the
operator, never by Claude); the operator's one-use section-12
activation authorization (issued only by the operator, binding the
reviewed commit, the re-measured runbook fingerprint, and the
preflight-established project identity); the operator's execution
of the activation sequence; the post-activation observation and its
evidence record. S6 activation remains STOPPED until that
authorization is issued and executed.
