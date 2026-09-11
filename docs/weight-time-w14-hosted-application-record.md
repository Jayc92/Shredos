# weight_time W14 — hosted catalog-application record

Recorded 2026-09-11 (UTC). APPLICATION EVIDENCE ONLY. The reviewed,
approved W14-P one-use catalog-admission package WAS EXECUTED ONCE
against the hosted Supabase project ShredOS (ref `ttybyljytiwntvorugcv`)
by the operator path (Joseph/ChatGPT) under the operator's explicit
one-use authorization. **THE ONE-USE W14 AUTHORIZATION IS CONSUMED AND
SPENT — DO NOT RERUN THE PACKAGE.**

Claude performed no hosted contact in this phase or any earlier phase of
W14: **every hosted fact in section B below is OPERATOR-SUPPLIED evidence
from the executor's execution and post-commit readback.** Claude did not
query hosted Supabase, did not invoke the Supabase CLI, and did not
contact Vercel. Where a hosted figure is cross-checked here, the check
compares the operator's reported value against the reviewed repository
bytes — it is never a second hosted reading.

This record approves nothing further. Content draft creation, content
review, import admission, publication, relationship projection, delivery
activation, and tenant delivery all remain **separately gated** acts that
have **not** begun.

---

## Provenance classes — never conflated

Every fact below is labelled with exactly one class.

| class | meaning | who established it |
|---|---|---|
| **A — REVIEWED PREP FACT** | a property of the frozen, independently reviewed W14-P candidate | Claude, mechanically, during W14-P; re-verified at closeout |
| **B — OPERATOR-SUPPLIED HOSTED FACT** | a reading taken from the hosted database or the hosted execution | Joseph/ChatGPT only; **never Claude, never independently verified by Claude** |
| **C — CLAUDE-VERIFIED LOCAL FACT** | a property of local repository bytes and local git objects | Claude, mechanically, at closeout, with no network access |

A statement carrying class **B** is reported **as supplied**. It is not
evidence that Claude observed the hosted database, and it must never be
restated as if Claude had queried Supabase.

---

## A. Reviewed prep facts — what was authorized to run

**A1 — the W14-P candidate.** Commit
`361bca0149ae289dd7b010b94fb70d0d141b861e`, tree
`7e48ba6646425609dabc0a70882171b835e684a2`, on the local unpublished
branch `feature/weight-time`, six single-parent commits above the W13
production base `a54a30c25b1427aee24d00c37bd6a4aec69dd3d0` (tree
`e4838dea0c2ad66a894969ab1c20982d28a6af29`). This is the candidate the
independent review approved and froze.

**A2 — the executed package.** `docs/weight-time-w14-catalog-admission.sql`,
**64,653 bytes**, SHA-256
`a928b045cc1397e4145b21a0504d4e7364a37c90b88c1dd85d8df36fb27413cd`.
The package file remains byte-identical after execution; **any byte change
would void its reviewed/executed status.** Its machine companion
`docs/weight-time-w14-admission-manifest.json` (16,537 bytes, SHA-256
`8951f3cf6a808113b9a5d99f3e0c1f0db50e59ef953a55a539bb8b7c4cce4f49`) is
likewise unchanged.

**A3 — the five governed logical identities**, in the manifest's frozen
order. These UUIDs were allocated deterministically and frozen during
W14-P precisely so the target identities would be reviewable *before* the
hosted act rather than being five runtime-random values.

| inventory line | canonical name | logical UUID | payload fingerprint (SHA-256) |
|---|---|---|---|
| 132 | Plate-weighted plank | `e21b2c00-0000-4000-a000-000000000004` | `f1f2843950c1426c5b5b615b50ec97d168e632b7e1c8946f98f5178efd5e1216` |
| 133 | Weighted vest plank | `e21b2c00-0000-4000-a000-000000000005` | `42f26ff9b4265544bcde194ea1e77c38652abf1b4b0bbee7055e0911fc53fa1e` |
| 137 | Weighted dead hang | `e21b2c00-0000-4000-a000-000000000006` | `ed584b1c2a8b224f2367642d8d32e67ee26214abac7e380dabba384a3de9922e` |
| 138 | Weighted wall sit | `e21b2c00-0000-4000-a000-000000000007` | `b17b5b6be91df93a4aa17c18aa8384bd61515e4e9f43072d0d41d7c3af10db1e` |
| 139 | Weighted vest wall sit | `e21b2c00-0000-4000-a000-000000000008` | `0366906db6e0399a2993b2c34841fe025293cbc166ea8f90e24b20bc77034d00` |

**A4 — the carry exclusion.** Inventory lines **134 (Farmer's carry), 135
(Suitcase carry), 136 (Sandbag bear-hug carry)** were deliberately
excluded. No carry mode was named, invented, or reinterpreted. The three
remain **DEFERRED**.

**A5 — the approved field decisions.** The authoritative carrier is
`docs/weight-time-w14-catalog-field-decisions.md`. Its rulings that bind
the executed payloads:

- **Provenance is MIXED 2/3 by design and must not be normalized** —
  132/133 `external_source_derived` with all four discovery-source fields
  non-NULL; 137/138/139 `forgefitos_original` with all four NULL.
- **The two external `source_url` values must DIFFER.** 132 carries the
  StrengthLog weighted-plank URL with the StrengthLog exercise-directory
  page and `retrieved_at 2026-08-20`; 133 carries the committed
  EXLIB-1C0A Marathon Handbook evidence URL as **both** `source_url` and
  `source_page`, with `retrieved_at 2026-08-24`. The identity of 133's
  two URL fields is deliberate: a standalone evidence article is its own
  source page, and attaching the StrengthLog directory to it would
  misrepresent the source family.
- Both external rows carry `import_confidence = human_review_required`,
  which for 133 is an **explicit operator decision** — Marathon Handbook
  is not credited with supplying that vocabulary value.
- `aliases` is exactly `[]` for all five. No alias claim is preferable to
  an unsupported name claim.
- Categories are operator decisions, not derived from `training_role`.

**A6 — why the URL rule is load-bearing, not cosmetic.**
`exercise_catalog_source_url_version_unique_idx`
(`supabase/migrations/023_exlib_catalog_and_delivery_contract.sql`) is a
**non-partial** UNIQUE index on `(source_url, catalog_version)`, and
`load_catalog_snapshot` has no `catalog_version` argument, so every newly
loaded snapshot is born at the column default `1`. Two rows sharing a
`source_url` therefore collide at version 1. A superseded first ruling
bound 132 and 133 to one URL; disposable execution proved that
impossible, the package rolled back correctly, and Correction 1 remedied
it with real committed evidence rather than by relaxing the index or
falsifying provenance.

**A7 — loading is not approval.** The package uses only the migration-027
loader boundary (`load_catalog_identity`, `load_catalog_snapshot`) and
issues no direct DML against any catalog table. It deliberately does not
call `load_catalog_content_draft`, `apply_content_review`,
`admit_catalog_content`, `publish_catalog_content`, or
`deliver_catalog_exercises`.

---

## B. Operator-supplied hosted facts

**Everything in this section was supplied by the operator. Claude did not
observe any of it.**

### B1 — Execution facts (operator-supplied)

- Executed by: **Joseph/ChatGPT** — the operator-only execution path.
  Never by Claude.
- Hosted target: Supabase project **ShredOS**, project ref
  **`ttybyljytiwntvorugcv`**, and no other project.
- Result: **SUCCESS / COMMITTED / SPENT.**
- All five target snapshots share `created_at`
  **`2026-09-11 20:23:46.107515+00`**.
- Post-commit hosted readback: **`2026-09-11T20:24:12.171477+00:00`**.
- Final spent-gate readback: **`2026-09-11T20:24:43.772439+00:00`**.

The three instants above order correctly and are the **operator's
evidence window**: creation precedes the post-commit readback, which
precedes the final spent-gate readback. They are the operator's reported
instants, not a transaction commit timestamp Claude observed.

### B2 — The five hosted identities (operator-supplied)

The operator reports that hosted state now contains exactly these five
new logical identities and snapshots, and that all five read back as:

```
tracking_mode    = weight_time
laterality       = bilateral
review_status    = pending
is_active        = true
catalog_version  = 1
reviewed_by      = NULL
reviewed_at      = NULL
review_rationale = NULL
```

No aliases were loaded for any of the five.

That born state is exactly the reviewed born-pending/born-active
semantics: the migration-027 freeze trigger guarantees it, and it is the
mechanical proof that **loading did not smuggle in approval**.

### B3 — Hosted payload readback (operator-supplied)

| field | 132 | 133 | 137 | 138 | 139 |
|---|---|---|---|---|---|
| category | isolation | isolation | isolation | compound | compound |
| primary_muscle | abs | abs | forearms | quads | quads |
| equipment | weight_plate | weighted_vest | weight_plate | weight_plate | weighted_vest |
| provenance | external_source_derived | external_source_derived | forgefitos_original | forgefitos_original | forgefitos_original |
| movement_pattern | core_anti_extension | core_anti_extension | grip_forearm | squat | squat |
| training_role | core | core | accessory | accessory | accessory |
| difficulty | intermediate | intermediate | intermediate | beginner | beginner |
| availability | home_gym | home_gym | home_gym | minimal | home_gym |
| source_url | `https://www.strengthlog.com/weighted-plank/` | `https://marathonhandbook.com/weighted-plank/` | NULL | NULL | NULL |
| source_page | `https://www.strengthlog.com/exercise-directory/` | `https://marathonhandbook.com/weighted-plank/` | NULL | NULL | NULL |
| retrieved_at | 2026-08-20 | 2026-08-24 | NULL | NULL | NULL |
| import_confidence | human_review_required | human_review_required | NULL | NULL | NULL |
| anatomy | obliques / secondary | obliques / secondary | lats / secondary | glutes / secondary | glutes / secondary |

### B4 — Hosted count deltas (operator-supplied)

| surface | before | after | delta |
|---|---|---|---|
| logical identities | 3 | 8 | **+5** |
| snapshots | 3 | 8 | **+5** |
| muscles (anatomy rows) | 5 | 10 | **+5** |
| claims | 6 | 11 | **+5** |
| catalog aliases | 3 | 3 | 0 |
| content | 1 | 1 | 0 |
| expected rels | 2 | 2 | 0 |
| relationships | 2 | 2 | 0 |
| runs | 1 | 1 | 0 |
| run items | 6 | 6 | 0 |
| review events | 3 | 3 | 0 |
| corrections | 0 | 0 | 0 |
| tenant exercises | 84 | 84 | 0 |
| tenant aliases | 0 | 0 | 0 |

### B5 — Carry exclusion and delivery boundary (operator-supplied)

Hosted readback proved **carry snapshots = 0** and **carry claims = 0**
for 134, 135 and 136. The carries remain DEFERRED.

For the five W14 targets, hosted readback proved **content versions = 0,
review events = 0, run items = 0, tenant exercises = 0, tenant delivery
aliases = 0**. No review, no content admission, no publication, and no
delivery occurred, and **`deliver_catalog_exercises` was NOT invoked.**

### B6 — Claim invariant and authority posture (operator-supplied)

After commit, the catalog claim invariant held: **orphaned_claims = 0**
and **unclaimed_bearers = 0**.

Loader role membership was restored to exactly
`grantor supabase_admin > member postgres : ADMIN TRUE, INHERIT FALSE,
SET FALSE`. **No residual temporary SET-enabled grant remained** — the
transaction-contained authority elevation closed behind itself.

Client loader execution posture remained closed: PUBLIC, `anon`,
`authenticated` and `service_role` loader access all **false**.

### B7 — Spent-state proof (operator-supplied)

Final hosted readback proved **target logical count = 5**, **target
snapshot count = 5**, and
**`would_second_run_fail_pre_target = true`**.

> **W14 HOSTED APPLICATION PACKAGE = SPENT. DO NOT RERUN.**
>
> If any future observer is uncertain whether the W14 package ran:
> **READ STATE FIRST. Never retry this package.** A second application is
> not a normal success — the package's own preflight is designed to fail
> closed on an already-existing target identity.

### B8 — Migration, Git and deployment boundaries (operator-supplied)

Supabase migration history after W14 is unchanged: latest migration
remains **`20260911034422 weight_time_tracking_mode_028`**. No migration
029 exists. **W14 was a controlled catalog data load, not a migration.**

Remote Git `main` remained `a54a30c25b1427aee24d00c37bd6a4aec69dd3d0`.
No W14 Git candidate was pushed during the hosted act, no Vercel contact
occurred during it, and no deployment occurred because of W14.

---

## C. Claude-verified local facts

Every fact in this section was read from local repository bytes or local
git objects at closeout, with **no network access of any kind**.

**C1 — the executed package is byte-identical to the reviewed one.**
`docs/weight-time-w14-catalog-admission.sql` is **64,653 bytes**, SHA-256
`a928b045cc1397e4145b21a0504d4e7364a37c90b88c1dd85d8df36fb27413cd`, on
disk **and** as the committed blob at
`361bca0149ae289dd7b010b94fb70d0d141b861e`. The machine manifest is
likewise unchanged at 16,537 bytes / `8951f3cf…`.

**C2 — the W14-P candidate ancestry is a plain forward line.**
`a54a30c25b1427aee24d00c37bd6a4aec69dd3d0` is an ancestor of
`361bca0149ae289dd7b010b94fb70d0d141b861e`; six commits separate them;
**zero merges**; and **zero commits have a parent count other than one**.

**C3 — migration 028 is unchanged.** Blob
`8a1964609cf9b3a45d0d9dd06105e348601b8738` at the production base **and**
at the candidate; 37,162 bytes, SHA-256
`9b7d3a52dc0b75f129745bec51a4c972aa284bb5cb0d6159e0cbbb981e463fb3`.
28 numbered migrations; **no migration 029 exists locally.**

**C4 — historical evidence is byte-identical, by blob identity.**

| blob | file |
|---|---|
| `529a2c0e5c733730b1a173abc093bdffbc9f47db` | `docs/exlib2b-release1-inventory.jsonl` |
| `3459dbf70a734b7bca2b816a41bbd46da6937f83` | `docs/exlib2b-release1-coverage-matrix.md` |
| `950f5ea17aace39ae319cf992bbbccd622a67aa0` | `docs/exlib1c0a-equipment-resolution.jsonl` |

The eight historical deferred inventory rows were never rewritten to make
the five admitted entries look pre-approved, and the coverage matrix's
"eight explicitly deferred" statement stands untouched.

**C5 — all eleven bound source artifacts still match.** Every entry in
the manifest's `source_bindings` was re-verified at the candidate commit:
**11/11 match their recorded bytes and SHA-256, 0 mismatch.**

**C6 — remote `main` per the local tracking ref.**
`refs/remotes/origin/main` resolves to
`a54a30c25b1427aee24d00c37bd6a4aec69dd3d0`, the old production base.
**This is a LOCAL ref read, not a query to the remote** — no `ls-remote`
and no network operation was performed during W14-C, so this records what
the local tracking ref says and nothing stronger.

**C7 — the reviewed artifacts' own status labels are deliberately
unchanged.** The manifest still reads `status: "PREPARED - NOT APPLIED"`
and `hosted_application_has_occurred: false`, and the SQL still carries
its `PREPARED - NOT EXECUTED` banner. **These are frozen labels of the
reviewed artifact, not current claims about the world.** The repository's
own convention — stated in
`docs/exlib2q-hosted-admission-application-record.md` — is that the
package file remains byte-identical after execution and that any byte
change would void its reviewed/executed status. Post-execution truth
therefore lives **here**, in this record, and not by editing the frozen
artifacts.

**C8 — one annotation was considered and declined, and this is the note at
the line.** `docs/weight-time-w14-catalog-field-decisions.md` §11.4
contains a statement that is no longer current:

> - **The W14 hosted application still has NOT occurred** and is not
>   authorized. No hosted Supabase contact, no Supabase CLI
>   invocation, no Vercel contact, no push, no deployment.

**That sentence is SUPERSEDED as of 2026-09-11 by this record.** The
hosted application HAS since occurred, exactly once, executed by the
operator path. The sentence's other clauses remain true **of Claude**:
Claude made no hosted Supabase contact, no Supabase CLI invocation, no
Vercel contact, no push and no deployment in W14-P or W14-C.

**The file was deliberately NOT annotated, for a mechanically verified
reason.** That document is not incidental prose — it is one of the
**eleven hashed `source_bindings`** inside the frozen admission manifest,
pinned at **29,662 bytes / `e111c738f2801f058e9f27136d731f6136401745541baf60ceaa26dbd2cf12d4`**.
The frozen static verifier's check **B13** requires every binding to match
its recorded bytes and SHA-256 **both as committed and on disk**, and its
checks **M2/M3** require this exact path to be the manifest's bound
`carrier_for_operator_ruled` — which is what makes "no loader argument was
guessed" a checkable property instead of an assertion. A single byte of
annotation would break the executed package's own provenance binding, and
the pin cannot be corrected because the manifest is itself byte-frozen.

Verified at closeout: the file is still 29,662 bytes and still hashes to
`e111c738…`, matching the pin exactly.

---

## D. Cross-checks of the operator's figures against repository bytes

These are **not** hosted readings. Each compares an operator-supplied
value against the reviewed bytes already in the repository.

**D1 — every hosted payload field equals the reviewed manifest.** All
fifteen governed fields of all five entries — logical UUID, canonical
name, category, primary_muscle, equipment, provenance, movement_pattern,
training_role, difficulty, availability, source_url, source_page,
retrieved_at, import_confidence, anatomy — were compared to
`docs/weight-time-w14-admission-manifest.json`:
**75 comparisons, 75 MATCH, 0 MISMATCH.**

**D2 — every reported count delta equals the reviewed expectation.** The
operator's before/after counts were differenced and compared to the
manifest's `expected_effect`:
**13 fields, 13 MATCH, 0 MISMATCH.**

| manifest `expected_effect` key | expected | operator delta |
|---|---|---|
| `logical_identities_created` | 5 | +5 |
| `snapshots_created` | 5 | +5 |
| `anatomy_rows_created` | 5 | +5 |
| `name_claim_rows_created` | 5 | +5 |
| `alias_rows_created` | 0 | 0 |
| `content_versions_created` | 0 | 0 |
| `review_events_created` | 0 | 0 |
| `relationship_rows_created` | 0 | 0 |
| `import_runs_created` | 0 | 0 |
| `run_items_created` | 0 | 0 |
| `corrections_created` | 0 | 0 |
| `tenant_exercises_created` | 0 | 0 |
| `tenant_delivery_aliases_created` | 0 | 0 |

The operator additionally reported "expected rels" unchanged at 2. The
manifest has no counterpart key for that surface, so it is recorded as
supplied and is not cross-checked.

**D3 — the two external URLs differ, as the index requires.** The
manifest's 132 and 133 `source_url` values are distinct while both rows
remain `external_source_derived`, matching the operator's hosted readback
and satisfying `exercise_catalog_source_url_version_unique_idx` at
`catalog_version = 1`.

**D4 — the born state the operator read back is the reviewed born
state.** `review_status=pending`, `is_active=true`,
`catalog_version=1`, and all three review fields NULL is exactly what the
manifest's `expected_effect.born_state` declares.

**Limit of these cross-checks, stated plainly:** they establish that the
operator's reported values agree with the approved bytes. They do **not**
independently establish hosted state. Only the operator observed hosted
state, and any future doubt about it must be resolved by reading hosted
state — never by rerunning this package.

---

## E. What this record does NOT do

- It does **not** claim Claude verified any hosted fact.
- It does **not** approve content draft creation, content review, import
  admission, publication, relationship projection, delivery activation,
  or tenant delivery. All remain separately gated and **have not begun**.
- It does **not** authorize a rerun of the W14 package. The package is
  **SPENT**.
- It does **not** authorize a push. The W14 governance and evidence
  commits remain local and unpublished; publication to `main` is a
  separate, later operator authorization.
- It does **not** modify the executed SQL package, the machine manifest,
  the field-decisions document, migration 028, any other migration, any
  file under `src/`, the historical Release-1 inventory or coverage
  matrix, or the deferred F2/F2a/F2b/F3/F4 maintenance sites.
- It does **not** create migration 029.

**What the closeout phase DOES change, stated plainly.** Two files are
added — this record and `scripts/verify-weight-time-w14-closeout.ts` — and
exactly one existing file is annotated:
`docs/weight-time-w14-prep-report.md`, which gains a dated supersession
notice and `[W14-C]`-marked annotations and is **not** a bound source
artifact. No other tracked file changes. The prep report's own SHA-256
therefore moves from `82452841587789ba7df9848750d4c39126ad7c54b28d084ca0d817f9c7cb471b`
(39,484 bytes, the W14-P bytes recorded in the frozen W14-P review
package's manifest) to its W14-C value, which the closeout manifest
records. The W14-P figure remains correct for the committed blob at
`361bca01…` and for the copy inside the frozen review package; it is not
wrong, it is dated.

---

## F. Standing disclosure carried forward

The earlier W12-R1/R2 rounds carry a standing disclosure of an accidental
`npx supabase projects list`: an unauthorized hosted-management API
attempt; no mutation observed; no output or hosted project data entered
the work product; the command was killed; no remedial hosted action was
authorized or required. **R1/R2 must never be described as having had "no
hosted contact."** The clean no-hosted-contact statements in this record
are scoped to **W14-P and W14-C only**.

Claude's self-imposed rule stands: **never invoke the `supabase` CLI, for
any subcommand.**

---

## G. Stop condition

W14 hosted application is **COMPLETE / PASSED / SPENT**.

The next act — hosted catalog **review** of these five pending snapshots,
and everything downstream of it — is a separate authority that has not
been granted. Publication of these local governance commits to `main` is
likewise a separate authorization.
