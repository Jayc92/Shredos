# weight_time five-entry endgame: operator runbook

STATUS: PREPARED. Nothing in this runbook has been performed. **The three human decision forms are now
COMPLETE** (W14-E, governing decision timestamp `2026-09-13T18:25:13-04:00`; see
`docs/weight-time-five-entry-human-decision-record.md`), so the seven packages named below are EXECUTABLE
and UNRUN and the hosted acts can be run in the right order with a spent-check before every one. **Claude performs none of the acts below.** Every hosted act is
Joseph/ChatGPT's, against the Supabase project ShredOS ref `ttybyljytiwntvorugcv` only, as the
non-superuser operator role `postgres`, under its own one-use instruction. Claude never contacts hosted
Supabase, never invokes the Supabase CLI, and never contacts Vercel.

## 0. Before anything: what must already be true

1. The three forms are COMPLETED by the right humans (family A snapshot review, family B content
   review, family C run authority). **DONE in W14-E** - family A and family C by Joseph Carfagno
   (ForgeFitOS operator), family B by Nick Tkacz (Physical Trainer), all at
   `2026-09-13T18:25:13-04:00`; the completed tuples, their form hashes and the derived admission
   fingerprints are bound in `docs/weight-time-five-entry-human-decision-record.md`. RQ-4 (who may
   lawfully complete family B: the promoted precedent was a named external specialist, not the
   operator) was answered by that named specialist review. `docs/weight-time-five-entry-human-review.md`
   remains the five exercises and the reviewer questions as the reviewers saw them.
2. The same generator that produced the committed templates has been re-run on the completed forms
   and the SEVEN EXECUTABLE packages have been committed and independently reviewed:

   ```bash
   npx tsx scripts/generate-weight-time-five-entry-packages.ts
   ```

   The generator refuses partial decisions, refuses any decision other than APPROVE / approved,
   refuses the historical run key, and refuses synthetic markers in a real form. While any form was
   still incomplete the committed packages were NON-EXECUTABLE TEMPLATES (every human leaf an unquoted
   `<<UNRESOLVED:...>>` token, and the first statement after BEGIN a deliberate syntax error); that
   blank-form rendering is preserved as the committed blob of `9bf9e6c861c226fd12b67e2dcd72dd7d4cdbafa8`
   and both endgame verifiers re-derive it from that commit on every run.
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
| 6 | `docs/weight-time-five-entry-packages/06-run-staging.sql` | C | -> `8/8/10/3/11/6/2/2/2/17/8` |
| 7 | `docs/weight-time-five-entry-packages/07-run-seal.sql` | (A, B, C gated) | unchanged |

Stage 6 creates a CUMULATIVE run (independent review finding R-E1): the SIX membership rows of the
sealed historical plank run `exlib2u-plank-release1-staged-v1` are COPIED forward from that run's own
rows (3 exercise + 3 alias members) and the five weight_time identities are added, so the new run has
8 exercise + 3 alias = 11 membership rows and the seal reports `exercise_members 8, alias_members 3`.
The historical run is never mutated, revoked or edited.

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

- The new run is sealed, approved, non-dry, unrevoked, with exactly eight exercise members (the
  historical Plank, Dead bug and Ab wheel rollout carried forward, plus the five) and three alias
  members (Front plank, Forearm plank, Ab roller rollout). Its membership is PERMANENT. The seal cannot be undone; the only later transition is
  the one-way `exlib_revoke_run_delivery`, which stops delivery from that run and reopens nothing.
- `deliver_catalog_exercises(<new key>)` is now REACHABLE by any authenticated caller that names the
  key, into that caller's own tenant. Nothing calls it yet: the application delivers only the
  configured run key, which still names the plank release.
- The plank release run is untouched and still deliverable under its own key; its membership is
  carried forward in the new run, so the plank release's effects stay reachable for future users
  through the new key.
- **Nothing has been delivered to any user.** Delivery is stage 8, below, and is gated on a
  production configuration change that is a separate operator act.

## 5a. Migration 029: where it sits in the hosted order

Migration 029 is a ONE-USE hosted database act of its own (Joseph/ChatGPT, ShredOS
`ttybyljytiwntvorugcv`, the hosted migration path used for 028), under its own one-use instruction with
a spent-check first. Dependency, determined mechanically:

- **Not a precondition of stages 1 to 7.** None of the seven packages calls `exlib_plank_link_valid`;
  the disposable proof runs all seven with 029 applied first and with 029 applied after, to identical
  results. The least coupled safe order is therefore: stages 1 to 7 and 029 in either order.
- **Strictly before stage 8.** 029 MUST be live and verified before `CATALOG_DELIVERY_RUN_KEY` is
  repointed to the cumulative run and before any user receives it.

Spent-check and READ STATE FIRST: run the probe; the row `migration_029_plank_cross_run_idempotency`
reads `APPLIED` (the live helper carries the exact-snapshot prior-run clause), `NOT_APPLIED` (it still
carries the strict clause), or `MIXED` (neither shape: STOP and report). 029 is one transaction, so an
ambiguous apply is resolved by reading that row, never by re-running blind. Its bytes must be
re-measured against the reviewed SHA-256 immediately before execution.

## 6. Stage 8: the Vercel run-key repoint (operator act; Claude never performs it)

Proven from `src/lib/supabase/deliver-catalog.ts`: the application reads ONE scalar run key and
passes it straight to the RPC, and `run_key` is UNIQUE, so exactly one run is deliverable per
deployment. Delivering the five therefore REQUIRES changing the production run-key variable. Because
the new run is CUMULATIVE, repointing no longer de-selects the plank release's effects for FUTURE
users: the historical six are carried forward, and the disposable proof shows a fresh user receives
the complete cumulative release (eligible 8, inserted 8, alias_inserted 3) idempotently.

**FINDING F-E8 AND ITS REMEDIATION (read before any repoint).** Under migrations 026/028, a user who
ALREADY received the plank release through `exlib2u-plank-release1-staged-v1` is REFUSED the
cumulative run: the existing Plank link carries the historical run id and `exlib_plank_link_valid`
demanded the delivering run's own id. The independent review adjudicated this a database-contract
defect and authorized **migration 029** (`supabase/migrations/029_exlib_plank_cross_run_idempotency.sql`;
**APPLIED hosted by the operator path - OPERATOR-SUPPLIED, never Claude-observed**: hosted migration record
`20260912181551_exlib_plank_cross_run_idempotency_029`, post-apply probe
`migration_029_plank_cross_run_idempotency = APPLIED`), which replaces only that helper so a prior approved, non-dry, sealed,
unrevoked run carrying EXACTLY the same catalog snapshot also validates. With 029 live, such a user
receives exactly the five new identities (measured: eligible 8, inserted 5, skipped 3,
alias_already_delivered 3, `already_valid_idempotent`, historical rows and provenance untouched).
**Do not repoint until migration 029 reads APPLIED in the probe.** See
`docs/weight-time-five-entry-delivery-configuration-dependency.md` sections 5b and 5c.

The enablement variable is written here as fragments, `CATALOG` + `_DELIVERY` + `_ENABLED`, following
the EXLIB-3A records (a committed verifier censuses that literal). The run-key variable is
`CATALOG_DELIVERY_RUN_KEY`.

Exact operator sequence, once and only once, after stage 7 is APPLIED and migration 029 is APPLIED
and verified:

1. Re-measure delivered counts hosted (read-only), and confirm with the probe that the row
   `migration_029_plank_cross_run_idempotency` reads APPLIED. Do not continue while it reads
   NOT_APPLIED or MIXED: every existing plank user would be refused initialization (F-E8).
2. Confirm the enablement variable (`CATALOG` + `_DELIVERY` + `_ENABLED`) is still exactly `true` and
   Production-scoped. Do not touch it.
3. Confirm hosted, with the probe, that stage 7 reads `APPLIED` and the new run's key is exactly the
   family C `run_key_literal`.
4. In the Vercel project `shredos`, Production scope ONLY, set `CATALOG_DELIVERY_RUN_KEY` to the new
   run key literal, byte for byte: no whitespace, no quotes, no case change. Do not create a second
   variable and do not widen the scope.
5. Perform exactly ONE Production redeploy (the EXLIB-3A activation recorded a duplicate redeploy as a
   disclosed deviation; avoid repeating it). Record the deployment id and the SHA it serves.
6. Verify delivery for ONE FRESH account and compare the returned summary with the manifest's
   expectation: `eligible 8, inserted 8, alias_inserted 3`, every other counter 0, eight
   `inserted_catalog_logical_ids`, `plank_disposition = 'delivered_canonical_timed_plank'`, accounting
   offset 0. A second initialization for the same account must read `skipped_already_delivered 8,
   alias_already_delivered 3, inserted 0`.
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
and `import_run_id`. For the carried-forward historical members it behaves exactly as it did for the
plank release, including migration 026's Plank reconciliation (a pristine legacy seed is corrected in
place; a fresh user receives Plank canonical and timed) and the three alias behaviours. It is
idempotent per user by `catalog_logical_id`; with migration 029 live an existing Plank link delivered by
a prior approved, sealed run carrying the same snapshot is skipped as already delivered (before 029 it
was refused: F-E8). The disposable proof performs the cumulative delivery for a fresh user, a
pristine-seed user, an existing plank user (refused on the pre-029 world, served after 029) and a raced
logical-index scenario, and checks every one of those facts; nothing hosted has been delivered.

## 8. What this runbook does not authorize

No push, no tag, no deployment, no hosted SQL, no hosted migration apply by Claude (029 was applied by the
Joseph/ChatGPT operator path, and its APPLIED status here is OPERATOR-SUPPLIED), no configuration change, no
delivery, no content review, admission or publication. The three human decisions were made by the named
humans and recorded in the forms; Claude made none of them and rendered them only into unrun packages.
Each hosted act above needs its own one-use instruction with a spent-check first. Claude performs none
of them.
