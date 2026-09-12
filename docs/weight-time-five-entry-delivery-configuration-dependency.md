# Delivery configuration dependency for the weight_time five-entry release

STATUS: ANALYSIS AND PREPARATION. Nothing here has been performed.

**Claude has had no Vercel contact of any kind, has invoked no Vercel CLI, has changed no environment
variable, and has triggered no deployment.** Every production figure in this document is
OPERATOR-SUPPLIED from a prior record and is not a Claude-verified observation. The analysis of what
the code does is derived from committed bytes and is verifiable in the repository.

## 1. The question this answers

The governing instruction required a proof either way: is a production configuration change actually
required to deliver this release, or is it not? It also required that if one IS required, the
dependency be surfaced rather than hidden, and not performed.

**Answer: a configuration change IS required.** Here is the derivation.

## 2. Why, from committed code

`src/lib/supabase/deliver-catalog.ts` selects the run to deliver from exactly one scalar:

```ts
export function catalogDeliveryRunKey(): string | null {
  const key = process.env.CATALOG_DELIVERY_RUN_KEY
  if (typeof key !== "string" || key.trim().length === 0) return null
  return key
}
```

That single value is passed straight through to the RPC:

```ts
supabase.rpc("deliver_catalog_exercises", { p_run_key: runKey })
```

And `run_key` is declared `TEXT NOT NULL UNIQUE` on `exercise_catalog_import_runs` in migration 023.

Three facts compose into the conclusion:

1. the application reads **one** run key, not a list;
2. `run_key` is **unique**, so one key names at most one run;
3. `deliver_catalog_exercises` accepts exactly one `p_run_key`.

Therefore **exactly one delivery run is reachable per deployment**. A second sealed run is inert
until the configured key names it. No application change, migration, or run-side act can make two
runs deliverable at once.

## 3. What is configured in production now

OPERATOR-SUPPLIED. The intended values are stated in `docs/exlib3a-option-a-activation-runbook.md`
section 1 and the Production-only scope is attested in `docs/exlib3a-option-a-hosted-activation-record.md`
section 3, which also records that the exact hosted values rest on operator attestation and were never
independently read by Claude. Re-verify before acting.

The enablement variable is written below as fragments, `CATALOG` + `_DELIVERY` + `_ENABLED`, following
the convention the EXLIB-3A records use: `scripts/verify-exlib2t.ts` B1 runs a repository-wide census of
that literal and requires exactly the four files that lawfully carry it, so no later document may spell
it out.

| Variable | Value | Scope |
| --- | --- | --- |
| the enablement variable (fragments `CATALOG` + `_DELIVERY` + `_ENABLED`) | `true` | Production only |
| `CATALOG_DELIVERY_RUN_KEY` | `exlib2u-plank-release1-staged-v1` | Production only |

The flag is already ON. That matters more than it looks: the fail-closed region documents that the
flag-ON path carries **no client-side count guard**, so existing users traverse the delivery path too,
not only brand-new signups. Repointing the key therefore changes what **every** user receives on their
next initialization, not only new accounts.

## 4. The exact future configuration value

Only one variable changes. The enablement variable (fragments `CATALOG` + `_DELIVERY` + `_ENABLED`) stays `true` and must not be touched.

| Variable | From | To |
| --- | --- | --- |
| `CATALOG_DELIVERY_RUN_KEY` | `exlib2u-plank-release1-staged-v1` | the family C `run_key_literal`, once chosen |

The proposed literal is `w14e-weight-time-release1-staged-v1`, derived segment for segment from the
promoted precedent. **It is a proposal, not a decision**: `run_key_literal` is a blank human leaf in
`docs/weight-time-five-entry-run-authority-form.json`, and the value written to production must be
byte-identical to the one the run was actually created and sealed with.

The string appears in exactly three places and all three must match exactly:

1. the run `INSERT` (`run_key`), at stage 6;
2. the seal call `exlib_approve_and_seal_run(run_key)`, at stage 7;
3. this environment variable.

A mismatch in the third is not a crash. It is a fail-closed refusal at runtime: no sealed, approved,
unrevoked run matches the key, so `deliver_catalog_exercises` raises and the application's delivery
path fails closed.

## 5. The consequence that needs a decision: repointing DE-SELECTS the plank release

This is the part worth reading twice.

Repointing the key does **not** add the five to what production delivers. It **replaces** what
production delivers.

- Users who have **already** received the plank release keep those rows. Nothing deletes them.
- Users who have **not** received it will now **never** receive it through this mechanism, unless the
  key is pointed back at the plank run later.
- Anything the plank run carried that the new run does not carry becomes unreachable for those users.
  That includes the plank release's three exercise members and its three alias members, and the
  `plank_disposition` reconciliation path in `deliver_catalog_exercises` that only arms when a catalog
  row named exactly `plank` is in the run.

Because the current measurement of delivered counts predates activation (see section 8), **how many
users this affects is unknown** and must be measured by the operator before the decision is made.

Serving both releases at once would require the application to read more than one run key, which is
an **application-code change**. The governing instruction forbids making one in this round, so it is
named here as a dependency and left unimplemented. If both releases must be live simultaneously, this
round's work is not sufficient and that is a genuine finding, not a gap to paper over.

## 6. Ordering: configuration activation versus delivery

The safe order is fixed by the fail-closed design, and it is the opposite of what convenience
suggests.

**The run must exist and be sealed BEFORE the configuration points at it.**

If the key is repointed first, then between the deployment and the seal every delivery attempt raises
"no sealed, approved, unrevoked delivery run for this key", and the application's delivery path fails
closed for every user in that window. Nothing is corrupted, but the window is a live outage of
exercise initialization.

Correct order:

1. stages 1 through 5 complete (snapshots approved, content drafted, reviewed, admitted, published);
2. stage 6: the run is created with its permanent key and exactly five members;
3. stage 7: the run is sealed, and the seal re-validates every member;
4. **only then** the configuration is repointed and a deployment picks it up;
5. delivery happens per user, on each user's own next initialization. There is no batch trigger and
   no operator-side "deliver now".

There is no window in which a half-prepared run is deliverable: an unsealed run fails the delivery
predicate (`approved_for_delivery = true AND dry_run = false AND sealed_at IS NOT NULL AND revoked_at
IS NULL`), which is why the staged run can be proven non-deliverable by evaluating that predicate
rather than by calling the delivery function.

## 7. Expected deployment implications

**Expectation, to be confirmed by the operator, not verified here:** an environment variable change on
Vercel does not affect running deployments; a new deployment is required for it to take effect. The
prior activation record is consistent with this, since the operator created both variables and then
redeployed.

There is a fork in the road here, and it has nothing to do with delivery:

| Path | What it changes | Blast radius |
| --- | --- | --- |
| Redeploy the current production deployment | picks up the new variable, keeps the currently deployed code | narrow: configuration only |
| Deploy from the published main | picks up the new variable **and** promotes every code change since the currently deployed SHA | wide: the whole main line since then |

OPERATOR-SUPPLIED: production currently runs SHA `5ed6fd84ea81ce1b4ca768b44e036432d26c3ab8`, while
the published main is `54a9d128bca659ec89d3ae149d47450e74a2ad2e`. **These are not the same commit.**
So the second path is not a neutral way to apply a configuration change; it is also a code promotion
that has not been separately reviewed as one. If the intent is only to repoint delivery, the first
path is the one that does only that.

The prior activation also produced a **duplicate redeploy**, which stands as a permanently disclosed
process deviation in the EXLIB-3A record. Worth avoiding a repeat: one deployment, deliberately.

## 8. Delivered counts are UNKNOWN

The only hosted measurement of delivered rows, `docs/exlib3a-option-b-hosted-measurement-record.md`,
was observed at `2026-09-09 02:27:31.8287+00` and reported:

```
delivered_exercises_total       = 0
delivered_exercises_target_run  = 0
delivered_aliases_total         = 0
delivered_aliases_target_run    = 0
```

But activation occurred later the same day: the first production redeploy is recorded at
`15:42:29.872Z`. **The measurement predates activation by about thirteen hours**, so it says only that
nothing had been delivered before delivery was switched on. It is not evidence about today.

Consequence: the number of users who have already received the plank release is **unknown**, and it
is exactly the number needed to judge section 5. Re-measuring is an operator act and a precondition
for an informed decision, not something this round can supply.

## 9. Rollback and restore posture

**Configuration rollback is easy. Its effect is not symmetric, and that asymmetry is the risk.**

Restoring `CATALOG_DELIVERY_RUN_KEY` to `exlib2u-plank-release1-staged-v1` and redeploying restores
the previous delivery selection. It does **not**:

- remove any `public.exercises` or `public.exercise_muscles` row already delivered to any user;
- unpublish any content, unadmit any version, unapprove any snapshot, or unseal the new run;
- restore the plank release to a user who initialized during the window.

So the rollback restores the *selection*, never the *state*. Every row delivered in the interim stays
delivered, and each affected user keeps whichever mixture of the two releases they happened to
receive.

What is genuinely irreversible, and should be understood before stage 7 rather than after:

| Act | Reversible? |
| --- | --- |
| repoint the configuration | yes, by repointing back and redeploying |
| deliver rows to a user | no - idempotent, but there is no undeliver |
| seal the run | no - `sealed_at` is set once and never cleared |
| the run's membership | no - permanent after the seal; a fix needs a NEW run |
| publish content | one-way to `retired`, never back to `draft` |
| approve a snapshot | one-way; a metadata change needs a new catalog version |

The only shutdown available after sealing is `revoked_at`, which is one-way and applies to a sealed
run. It stops future delivery from that run. It does not undo past delivery, and it is not prepared in
this round.

## 10. Operator checklist

Ordered. Each step is an operator act. **Claude performs none of these**, and this checklist is not an
authorization: each hosted act still needs its own one-use instruction with a spent-check first.

Before touching configuration:

1. Re-measure delivered counts hosted, replacing the stale pre-activation figures in section 8.
2. Decide section 5 knowing that number: is de-selecting the plank release acceptable?
3. Confirm the enablement variable (fragments `CATALOG` + `_DELIVERY` + `_ENABLED`) is still exactly `true` and Production-scoped.
4. Confirm the run key literal chosen in family C, and that stages 1 through 7 all completed.
5. Confirm hosted that the new run is sealed, approved, not dry, not revoked, and has exactly five
   exercise members and zero alias members.

The configuration change:

6. Update `CATALOG_DELIVERY_RUN_KEY` to the chosen literal, Production scope only. Do not create a
   second variable, and do not widen the scope.
7. Verify the stored value is byte-identical to the sealed run's `run_key`: no trailing whitespace,
   no quotes, no case difference. The application trims only for its empty check and passes the raw
   value through.
8. Choose the deployment path from section 7 deliberately, and perform exactly **one** deployment.

After:

9. Confirm which SHA production is serving, and that it is the SHA intended.
10. Verify delivery for one account, and read the returned summary against the manifest's expected
    values: `eligible 5`, `inserted 5`, every other counter `0`, `plank_disposition = 'not_in_run'`,
    accounting offset `0`.
11. Record the observed values in a durable record, marked OPERATOR-SUPPLIED.
12. If anything disagrees, **stop and read state**. A timeout in particular means the eventual
    delivery outcome is UNKNOWN, never that delivery did not occur; the code says so explicitly and
    returns `unknownDeliveryOutcome: true`. Never blind-retry.

## 11. What was not done here, stated plainly

No Vercel contact. No Vercel CLI. No environment variable created, read, or changed. No deployment
triggered. No hosted Supabase contact. No Supabase CLI invocation, for any subcommand. No delivery
called anywhere, hosted or local, outside the disposable local proof. No git push. No human decision
filled or inferred.
