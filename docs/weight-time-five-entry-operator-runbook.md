# weight_time five-entry endgame: operator runbook

STATUS: PREPARED. Nothing in this runbook has been performed. It exists so that, once the three human
decision forms are complete and independently reviewed, the hosted acts can be run in the right order
with a spent-check before every one. **Claude performs none of the acts below.** Every hosted act is
Joseph/ChatGPT's, against the Supabase project ShredOS ref `ttybyljytiwntvorugcv` only, as the
non-superuser operator role `postgres`, under its own one-use instruction. Claude never contacts hosted
Supabase, never invokes the Supabase CLI, and never contacts Vercel.

## 0. Before anything: what must already be true

1. The three forms are COMPLETED by the right humans (family A snapshot review, family B content
   review, family C run authority). See `docs/weight-time-five-entry-human-review.md` for the five
   exercises and the eight open reviewer questions, including **RQ-4** (who may lawfully complete
   family B: the promoted precedent was a named external specialist, not the operator).
2. The same generator that produced the committed templates has been re-run on the completed forms
   and the SEVEN EXECUTABLE packages have been committed and independently reviewed:

   ```bash
   npx tsx scripts/generate-weight-time-five-entry-packages.ts
   ```

   The generator refuses partial decisions, refuses any decision other than APPROVE / approved,
   refuses the historical run key, and refuses synthetic markers in a real form. Until the forms are
   complete, the committed packages are NON-EXECUTABLE TEMPLATES (every human leaf is an unquoted
   `<<UNRESOLVED:...>>` token, and the first statement after BEGIN is a deliberate syntax error).
3. `scripts/verify-weight-time-five-entry-endgame.ts` (static) and
   `scripts/verify-weight-time-five-entry-endgame-live.sh` (disposable local PostgreSQL) both exit 0
   at the commit the executable packages were rendered from.
4. Each package file's SHA-256 is re-measured immediately before execution and equals the reviewed
   digest. A byte change voids the review.

## 1. The seven hosted packages, in order

Run each EXACTLY ONCE, in this order, each under its own one-use instruction. Never run a package
a second time: every package refuses on replay, but the refusal is a safety net, not a plan.

| Stage | Package | Human family it consumes | Vector before -> after |
| --- | --- | --- | --- |
| 1 | `docs/weight-time-five-entry-packages/01-snapshot-review.sql` | A | `8/8/10/3/11/1/2/2/1/6/3` -> `8/8/10/3/11/1/2/2/1/6/8` |
| 2 | `docs/weight-time-five-entry-packages/02-content-draft-load.sql` | (A gated) | -> `8/8/10/3/11/6/2/2/1/6/8` |
| 3 | `docs/weight-time-five-entry-packages/03-content-review.sql` | B | unchanged |
| 4 | `docs/weight-time-five-entry-packages/04-content-admission.sql` | (A, B gated) | unchanged |
| 5 | `docs/weight-time-five-entry-packages/05-content-publication.sql` | (A, B gated) | unchanged |
| 6 | `docs/weight-time-five-entry-packages/06-run-staging.sql` | C | -> `8/8/10/3/11/6/2/2/2/11/8` |
| 7 | `docs/weight-time-five-entry-packages/07-run-seal.sql` | (A, B, C gated) | unchanged |

The eleven vector terms are, in order: logical identities / snapshots / muscles / aliases / name
claims / content versions / expected relationships / projected relationships / import runs / run items
/ review events. The starting vector is the OPERATOR-SUPPLIED post-W14 hosted state; the disposable
proof rebuilds it locally by replaying the nine spent packages, which is how it was checked.

Stages 3, 4, 5 and 7 are LOAD-BEARING separations: the database refuses a review decision, an
admission, a publication or a seal that travels with any other change. They must not be merged.
There is no separate relationship-projection package: publication swaps the projection atomically,
and every five-entry expected set is empty, so the relationships table does not change.

## 2. The spent-check, before EVERY package

Run the read-only probe first, every time:

```bash
psql "<hosted connection as postgres>" -X -v ON_ERROR_STOP=1 -f docs/weight-time-five-entry-read-state.sql
```

It writes nothing (`SET TRANSACTION READ ONLY`, ends in `ROLLBACK`). Read its rows:

- Stage N reads `NOT_APPLIED` and every earlier stage reads `APPLIED` (stage 7 reads `ABSENT` until
  stage 6 has run): stage N is the next lawful act.
- Stage N reads `APPLIED`: it is SPENT. Do not run it. Move to N+1's spent-check.
- Any stage reads `MIXED`: STOP. Do not run any package. Record the exact probe rows and report. A
  retry will not fix a MIXED state; it needs a fresh human decision about what happened.

Then execute the package:

```bash
psql "<hosted connection as postgres>" -X -v ON_ERROR_STOP=1 -f docs/weight-time-five-entry-packages/0N-....sql
```

Record: the UTC start and finish instants, the final `SELECT 'W14E-N ...' AS result` row, and the
probe output run again immediately afterwards (stage N must now read `APPLIED`).

## 3. READ STATE FIRST: the ambiguity rule

If an execution's transport or result is ambiguous - a dropped connection, a timeout, an unreadable
error, a client that stopped listening - **never blindly re-run the package**. Run the probe.

- The stage reads `APPLIED`: the transaction committed. The package is spent. Proceed to the next
  spent-check. Do not run it again.
- The stage reads `NOT_APPLIED` and the vector is exactly the stage's before-vector: the transaction
  did not commit. Running the package once more is the correct next act.
- Anything else, including `MIXED`: STOP and report the probe rows verbatim.

Every package is ONE transaction, so its effects move together. That is why `MIXED` is impossible by
design and, if ever seen, is a fact about the world that a retry cannot repair.

## 4. Replay and spent behaviour, per transition

Every stage refuses a second execution before any write, by a different mechanism:

- Stage 1: the per-identity gate demands `review_status = 'pending'` with NULL audit fields; the
  vector gate demands review events = 3. The database's one-way review machine also refuses
  `approved -> approved`.
- Stage 2: the gate demands zero content rows for the five and that the predeclared content ids
  `…0104` to `…0108` are free; `UNIQUE (logical_id, content_version)` refuses regardless.
- Stage 3: `apply_content_review` itself refuses a non-pending version; the gate demands pending.
- Stage 4: `admit_catalog_content` itself refuses an admitted version; the gate demands unadmitted.
- Stage 5: `publish_catalog_content` itself refuses a non-draft version; the gate demands draft.
- Stage 6: `run_key` is UNIQUE forever; the gate refuses if the chosen key already exists.
- Stage 7: `exlib_approve_and_seal_run` refuses a sealed run; the gate refuses sealed, approved or
  revoked.

The historical plank run key `exlib2u-plank-release1-staged-v1` must never be the new run key. The
generator refuses it in the form; stage 6 refuses it at the gate; the database refuses it by UNIQUE.

## 5. After stage 7: what is true and what is not

- The new run is sealed, approved, non-dry, unrevoked, with exactly five exercise members and zero
  alias members. Its membership is PERMANENT. The seal cannot be undone; the only later transition is
  the one-way `exlib_revoke_run_delivery`, which stops delivery from that run and reopens nothing.
- `deliver_catalog_exercises(<new key>)` is now REACHABLE by any authenticated caller that names the
  key, into that caller's own tenant. Nothing calls it yet: the application delivers only the
  configured run key, which still names the plank release.
- The plank release run is untouched and still deliverable.
- **Nothing has been delivered to any user.** Delivery is stage 8, below, and is gated on a
  production configuration change that is a separate operator act.

## 6. Stage 8: the Vercel run-key repoint (operator act; Claude never performs it)

Proven from `src/lib/supabase/deliver-catalog.ts`: the application reads ONE scalar run key and
passes it straight to the RPC, and `run_key` is UNIQUE, so exactly one run is deliverable per
deployment. Delivering the five therefore REQUIRES changing the production run-key variable. Read
`docs/weight-time-five-entry-delivery-configuration-dependency.md` first: repointing the key
DE-SELECTS the plank release for every user who has not yet received it, and the number of such
users is UNKNOWN until re-measured hosted.

The enablement variable is written here as fragments, `CATALOG` + `_DELIVERY` + `_ENABLED`, following
the EXLIB-3A records (a committed verifier censuses that literal). The run-key variable is
`CATALOG_DELIVERY_RUN_KEY`.

Exact operator sequence, once and only once, after stage 7 is APPLIED and a decision on the
de-selection consequence has been made:

1. Re-measure delivered counts hosted (read-only) and decide whether de-selecting the plank release is
   acceptable now.
2. Confirm the enablement variable (`CATALOG` + `_DELIVERY` + `_ENABLED`) is still exactly `true` and
   Production-scoped. Do not touch it.
3. Confirm hosted, with the probe, that stage 7 reads `APPLIED` and the new run's key is exactly the
   family C `run_key_literal`.
4. In the Vercel project `shredos`, Production scope ONLY, set `CATALOG_DELIVERY_RUN_KEY` to the new
   run key literal, byte for byte: no whitespace, no quotes, no case change. Do not create a second
   variable and do not widen the scope.
5. Perform exactly ONE Production redeploy (the EXLIB-3A activation recorded a duplicate redeploy as a
   disclosed deviation; avoid repeating it). Record the deployment id and the SHA it serves.
6. Verify delivery for ONE account and compare the returned summary with the manifest's expectation:
   `eligible 5, inserted 5`, every other counter 0, five `inserted_catalog_logical_ids`,
   `plank_disposition = 'not_in_run'`, accounting offset 0. A second initialization for the same
   account must read `skipped_already_delivered 5, inserted 0`.
7. Record everything observed in a durable record marked OPERATOR-SUPPLIED.

If anything disagrees, STOP and read state. A timeout means the eventual delivery outcome is UNKNOWN,
never that delivery did not occur; the runtime returns `unknownDeliveryOutcome: true` for exactly that
reason. Never blind-retry the configuration change or the deployment.

Rollback of the configuration (repointing back to `exlib2u-plank-release1-staged-v1` and redeploying)
restores the SELECTION, never the STATE: rows already delivered stay delivered.

## 7. Tenant delivery: what the runtime does per user

Delivery is `public.deliver_catalog_exercises(p_run_key)` over the signed-in user's own connection,
gated on `auth.uid()`; it raises when unauthenticated, takes a per-user advisory lock, requires the
run to be sealed/approved/non-dry/unrevoked, and inserts one `public.exercises` row (plus its
`exercise_muscles` rows) per approved active member the user has not received yet. For the five:
`exercise_type = 'strength'` (migration 028's explicit `weight_time` arm), `tracking_mode =
'weight_time'`, `unilateral = false`, `is_system = true`, linked by `catalog_id`, `catalog_logical_id`
and `import_run_id`. It is idempotent per user by `catalog_logical_id`. The disposable proof performs
exactly this delivery for a fixture user and checks every one of those facts; nothing hosted has been
delivered.

## 8. What this runbook does not authorize

No push, no tag, no deployment, no hosted SQL, no configuration change, no delivery, no content
review, admission or publication, no human decision. Each hosted act above needs its own one-use
instruction with a spent-check first. Claude performs none of them.
