# W14-P preparation report — five-entry catalog admission

**Status: LOCAL PREPARATION COMPLETE. W14 HOSTED APPLICATION HAS NOT OCCURRED.**

Nothing in this candidate has been applied, pushed, deployed, or delivered.
The prepared SQL package has been executed exactly once per proof run against a
disposable local PostgreSQL cluster and nowhere else.

This report is the evidence index for independent review. Every number in it
was read from a command's exit status or output, not carried from a summary.

---

## 1. Identity of the candidate

| | |
|---|---|
| Production base commit | `a54a30c25b1427aee24d00c37bd6a4aec69dd3d0` |
| Production base tree | `e4838dea0c2ad66a894969ab1c20982d28a6af29` |
| `origin/main` at the time of this report | `a54a30c25b1427aee24d00c37bd6a4aec69dd3d0` (**unmoved**) |
| Candidate branch | `feature/weight-time` (local only, unpublished) |
| Candidate tip | `dd24dd655d8652fa0a57cc64338068aebe84804b` |
| Candidate tree | `2a355a5a93ccb5e9ae95afa65afb24156fd8c87c` |
| Ahead / behind `origin/main` | 3 / 0 |
| Working tree | 0 porcelain lines |

The report's own commit is a fourth plain forward commit on the same line; the
accompanying package manifest records the resulting tip and this file's bytes
and SHA-256, which cannot appear inside the file itself.

### 1.1 Commit chain, and the zero-merge proof

```
f125308e0a22d935c889691452477b5ac9138f83  tree b0dffb78d83770fdd2ad182630bf5d211470fa15
    parent a54a30c25b1427aee24d00c37bd6a4aec69dd3d0
    W14-P: operator field decisions for the five-entry catalog admission

5daba8e729c3999a1db57db68d9507918f2f4b21  tree 2495990e622f06ab4e5e08cf1ed98036cce701f8
    parent f125308e0a22d935c889691452477b5ac9138f83
    W14-P: correct 133's external source binding to committed EXLIB-1C0A evidence

dd24dd655d8652fa0a57cc64338068aebe84804b  tree 2a355a5a93ccb5e9ae95afa65afb24156fd8c87c
    parent 5daba8e729c3999a1db57db68d9507918f2f4b21
    W14-P: five-entry catalog admission package, manifest, and both verifiers
```

- `git rev-list --count a54a30c2..HEAD` = **3**
- `git rev-list --count --merges a54a30c2..HEAD` = **0**
- `git merge-base --is-ancestor a54a30c2 HEAD` exits **0**
- Every commit has exactly one parent. No amend, no rebase, no squash, no merge.

Both facts are also asserted mechanically by `scripts/verify-weight-time-w14.ts`
(B6, B7).

### 1.2 Changed-path list, base → candidate tip

Six files, all additions. Zero modifications, zero deletions, zero renames.

```
A  docs/weight-time-w14-catalog-field-decisions.md
A  docs/weight-time-w14-admission-manifest.json
A  docs/weight-time-w14-catalog-admission.sql
A  scripts/generate-weight-time-w14-package.ts
A  scripts/verify-weight-time-w14.ts
A  scripts/verify-weight-time-w14-live.sh
```

`git diff --name-only a54a30c2 HEAD -- src supabase` returns **0 lines**: no
application code and no migration was touched.

---

## 2. The admission set

Exactly five entries, in manifest order `132, 133, 137, 138, 139`. All five
carry `tracking_mode = weight_time`, `laterality = bilateral`, and
`aliases = []`.

| Inv. line | Logical UUID (frozen) | Canonical name | Category | Equipment | Movement pattern | Provenance |
|---|---|---|---|---|---|---|
| 132 | `e21b2c00-0000-4000-a000-000000000004` | Plate-weighted plank | isolation | weight_plate | core_anti_extension | external_source_derived |
| 133 | `e21b2c00-0000-4000-a000-000000000005` | Weighted vest plank | isolation | weighted_vest | core_anti_extension | external_source_derived |
| 137 | `e21b2c00-0000-4000-a000-000000000006` | Weighted dead hang | isolation | weight_plate | grip_forearm | forgefitos_original |
| 138 | `e21b2c00-0000-4000-a000-000000000007` | Weighted wall sit | compound | weight_plate | squat | forgefitos_original |
| 139 | `e21b2c00-0000-4000-a000-000000000008` | Weighted vest wall sit | compound | weighted_vest | squat | forgefitos_original |

The UUIDs are deterministic and were frozen before any execution, following the
repository's existing `e21b2c00-0000-4000-a000-…` catalog-identity convention.
They are reviewable in advance precisely because they are not runtime-random.

### 2.1 Payload fingerprints

SHA-256 over the eighteen `load_catalog_snapshot` arguments in migration-027
declaration order, each rendered `<parameter_name>=<value>\n`; NULL renders as
`\N`; anatomy renders as **fully compact** JSON with sorted keys ordered by
`(muscle, role)`; aliases as compact JSON.

| Inv. line | Payload fingerprint (SHA-256) |
|---|---|
| 132 | `f1f2843950c1426c5b5b615b50ec97d168e632b7e1c8946f98f5178efd5e1216` |
| 133 | `42f26ff9b4265544bcde194ea1e77c38652abf1b4b0bbee7055e0911fc53fa1e` |
| 137 | `ed584b1c2a8b224f2367642d8d32e67ee26214abac7e380dabba384a3de9922e` |
| 138 | `b17b5b6be91df93a4aa17c18aa8384bd61515e4e9f43072d0d41d7c3af10db1e` |
| 139 | `0366906db6e0399a2993b2c34841fe025293cbc166ea8f90e24b20bc77034d00` |

The SQL call sites deliberately emit a **spaced** `jsonb` literal for anatomy
(`[{"muscle": "obliques", "role": "secondary"}]`) while the fingerprint input is
the compact form. The two renderings are not unified on purpose, and the static
verifier compares anatomy as parsed JSON rather than as text so the difference
cannot hide a real drift.

Each fingerprint is recomputed twice, independently: once in
`scripts/verify-weight-time-w14.ts` (S10) from the manifest, and once in
`scripts/verify-weight-time-w14-live.sh` (P14) from the **database readback**
after the package has run. P14's oracle is the row in PostgreSQL, never the
package's text.

### 2.2 Carry exclusion

Inventory lines **134 (Farmer's carry)**, **135 (Suitcase carry)** and
**136 (Sandbag bear-hug carry)** are excluded and remain deferred. No carry mode
was invented, no carry row was reinterpreted, and no carry name reaches a call
site.

Proven three ways:

- static, manifest side — `S2a` (the exclusion list is exactly 134/135/136),
  `S2b` (no entry bears a carry line or a carry name);
- static, package side — `S2c` (no carry token inside any of the five
  `load_catalog_snapshot` call sites, each parsed as its own block);
- live, database side — `P5` (after execution, no snapshot, name claim or
  movement pattern anywhere in the catalog mentions a carry, a farmer, a
  suitcase or a sandbag) and `P5a` (the same check statically).

`A4.134/135/136` additionally re-read the historical inventory and confirm each
carry row is still `deferred=true`, `import_eligible=false`,
`review_status=proposed`.

---

## 3. Derivations — where every field came from

No field is guessed. Each of the ninety entry-argument pairs (five entries ×
eighteen loader arguments) is attributed to exactly one class, and each class
names a carrier that the machine manifest has already bound by byte size and
SHA-256. The static verifier closes this as a permanent matrix (`M1`–`M4`),
not as a one-off console session:

- **Class A — source-derived.** Ten fields per entry (`canonical_name` from
  `proposed_canonical_name`, `normalized_name`, `primary_muscle`, `equipment`,
  `tracking_mode`, `laterality`, `movement_pattern`, `training_role`,
  `difficulty`, `availability`) plus `anatomy` from `muscle_targets`. Carrier:
  `docs/exlib2b-release1-inventory.jsonl`. Verified by an **independent
  re-parse** of that file (`A1`, `A2`, `A3`), not by reusing the generator's
  parse.
- **Class B/C — operator rulings.** `category`, `provenance`, the four
  discovery-source fields, and `aliases`. Carrier:
  `docs/weight-time-w14-catalog-field-decisions.md`. The static verifier holds
  these in an `EXPECTED` table transcribed from that document; it does **not**
  learn them from the manifest under test, which would only prove the manifest
  equals itself.
- **`logical_id`** — frozen deterministic allocation, recorded in the decision
  document (D13 pins all five).

`M4` reports the matrix closed at **90 of 90** resolved pairs.

### 3.1 The provenance split is mixed by design

`external_source_derived` for 132 and 133; `forgefitos_original` for 137, 138
and 139. This is **not** normalized to a single value. The manifest records the
invariant explicitly, and `exercise_catalog_provenance_sources_chk` enforces the
structural half of it: external rows carry all four discovery-source fields
non-NULL, ForgeFitOS-original rows carry all four NULL.

Checked statically (`S7e/f/g`) and live (`P4b`, `P4c`), and both directions have
negative controls: `P11a`/`P11b` prove the check constraint refuses a mixed
quartet, and `NC-FORGEFITOS-133` proves the static verifier refuses a 133
reclassified to `forgefitos_original`.

### 3.2 Correction 1 — the source-URL collision and its remedy

The first decision version bound both plank variants to one `source_url`.
Disposable execution proved that impossible:

```sql
CREATE UNIQUE INDEX exercise_catalog_source_url_version_unique_idx
  ON exercise_catalog (source_url, catalog_version);
```

(`supabase/migrations/023_exlib_catalog_and_delivery_contract.sql:432` — a
**non-partial** unique index, NULLs distinct.) `load_catalog_snapshot` takes no
version argument, so every snapshot it creates is born at the column DEFAULT of
1. Two external rows sharing a URL therefore collide on `(source_url, 1)`. This
is a genuine constraint, not a sequencing problem, and the package correctly
rolled back.

The remedy is a second **real, already-committed** external evidence source:
`docs/exlib1c0a-equipment-resolution.jsonl`, resolution `exlib1c0a-eq-02`,
already records `https://marathonhandbook.com/weighted-plank/` retrieved
`2026-08-24`, together with the classification fact that a weighted plank is
loaded by plates on the back **or** by a weighted vest. That URL is not new, not
fetched, and not invented; no network access was used to obtain it.

Final bindings:

| | 132 | 133 |
|---|---|---|
| `provenance` | external_source_derived | external_source_derived |
| `source_url` | `https://www.strengthlog.com/weighted-plank/` | `https://marathonhandbook.com/weighted-plank/` |
| `source_page` | `https://www.strengthlog.com/exercise-directory/` | `https://marathonhandbook.com/weighted-plank/` |
| `retrieved_at` | `2026-08-20` | `2026-08-24` |
| `import_confidence` | `human_review_required` | `human_review_required` |

133's `source_page` is intentionally the same URL as its `source_url`: it is a
standalone article, not a directory listing, and attaching the StrengthLog
exercise-directory page to a Marathon Handbook source record would misrepresent
the source family. `import_confidence = human_review_required` is an explicit
operator decision for this derived weighted-vest identity, not a vocabulary
value Marathon Handbook supplied.

**No schema relaxation was made and none is authorized. No migration 029
exists. No provenance value was changed to satisfy a constraint.** The index is
now itself an explicit proof rather than an obstacle:

- static — `S8z` (the two URLs differ), `S8y` (both remain
  `external_source_derived`), `S8x` (the manifest names the enforcing index);
- live — `P15a` (the index is present, UNIQUE, non-partial, on exactly
  `(source_url, catalog_version)`, NULLs distinct), `P15b`
  (`load_catalog_snapshot` cannot set `catalog_version`), `P15c` (the two
  distinct URLs, read back out of the database, both still external, both at
  version 1);
- negative control — `P15d` restores the shared URL and proves the package fails
  closed **and leaves zero partial W14 state**; `P15e` proves the refusal detail
  names the exact colliding key
  `(https://www.strengthlog.com/weighted-plank/, 1) already exists`, so the
  collision is the pair at the born version and not some incidental error.

Two ablations isolate the cause to one variable each: `P11f` shows that giving
133 *any* distinct URL commits cleanly (so the shared URL alone caused the
collision — not the fifth entry, the vest equipment, or the external
provenance), and `P11g` shows that reclassifying 133 to `forgefitos_original`
*also* commits — which is exactly why that route had to be closed by **ruling**
rather than by the schema.

The superseded artifacts are treated as blocked evidence: their two SHA-256
values and 133's superseded fingerprint must appear in neither the manifest nor
the package (`S13a`, `S13b`), with `NC-BLOCKED-HASH` and
`NC-SUPERSEDED-MANIFEST` proving those pins are alive. The decision document
retains the original history on purpose, including the earlier STOP report's
incorrect claim that no distinct committed URL existed, labelled as a later
correction rather than erased (`D7b`).

### 3.3 Regenerated, not hand-patched

Both artifacts were regenerated from the corrected decision carrier by
`scripts/generate-weight-time-w14-package.ts`. No manual one-line URL edit was
made. `S11` reads the package structurally — by each entry's own dollar-quote
tag, so no regex can span into a neighbouring call site — and requires every
governed value the package emits to equal the manifest's, with anatomy and
aliases compared as parsed JSON.

---

## 4. File inventory — bytes and SHA-256

W14 artifacts, at the candidate tip. Every one is byte-identical on disk and as
committed.

| Bytes | SHA-256 | Path |
|---|---|---|
| 29,662 | `e111c738f2801f058e9f27136d731f6136401745541baf60ceaa26dbd2cf12d4` | `docs/weight-time-w14-catalog-field-decisions.md` |
| 16,537 | `8951f3cf6a808113b9a5d99f3e0c1f0db50e59ef953a55a539bb8b7c4cce4f49` | `docs/weight-time-w14-admission-manifest.json` |
| 64,653 | `a928b045cc1397e4145b21a0504d4e7364a37c90b88c1dd85d8df36fb27413cd` | `docs/weight-time-w14-catalog-admission.sql` |
| 79,413 | `6b1cad11c208820a92cecdbcbaeb96dacacf57a5135901a09f24f87ae5c65e5f` | `scripts/generate-weight-time-w14-package.ts` |
| 59,124 | `7462b768ecdd1c0d69f09ee50844b67b30a4dd3efbd53e6d4840cd760cfa05e6` | `scripts/verify-weight-time-w14.ts` |
| 50,553 | `68027379fd3741c8c5be7ebf609271006bc9c74d6d442f7a01757149c910b728` | `scripts/verify-weight-time-w14-live.sh` |

**The one-use hosted application package is
`docs/weight-time-w14-catalog-admission.sql`, 64,653 bytes, SHA-256
`a928b045cc1397e4145b21a0504d4e7364a37c90b88c1dd85d8df36fb27413cd`.**

### 4.1 Source artifacts bound by the manifest

All eleven are re-hashed by `B13`, both as committed at the tip and on disk.

| Bytes | SHA-256 | Path |
|---|---|---|
| 103,933 | `d349110f22700a822eb427fc1dcce3e6dbcfd264b6d48ed84936b07b1ca256f5` | `docs/exlib2b-release1-inventory.jsonl` |
| 10,027 | `c32b7b9e9d3aafab39a9a6d77db09349dd604457274767fe4c880c6bf1fb2fb0` | `docs/exlib2b-release1-coverage-matrix.md` |
| 101,661 | `b6ef2584c29e66c62e9f5e198d1791610ab17ceabd687af19bc3d352af04ecb6` | `docs/weight-time-coordinated-implementation-plan.md` |
| 261,526 | `336cd4253f747cdb3ba73ffa2af5a63e255c7c87cc452d4c43ed59a654673dfa` | `docs/exlib1a-discovery-manifest.jsonl` |
| 23,078 | `f9e7a98db6b519e650d5f2b8a231308c0fd76ccb23e1685f497100812fbd2fb4` | `docs/exlib1c0a-equipment-resolution.jsonl` |
| 29,662 | `e111c738f2801f058e9f27136d731f6136401745541baf60ceaa26dbd2cf12d4` | `docs/weight-time-w14-catalog-field-decisions.md` |
| 29,760 | `a1b6dd55850c5d544e2f484d1ce4833b41deec7f3dd4d4c2373cb3b50daaccf0` | `docs/exlib2k-plank-catalog-load-package.sql` |
| 92,806 | `0991448c39a558385431c78cef6d6063df208312a3f53866756ba730066c42f2` | `supabase/migrations/023_exlib_catalog_and_delivery_contract.sql` |
| 3,587 | `fbda16f4d25cacd1715b199050506a4da15896355d96700876b76c68826d304c` | `supabase/migrations/025_exlib_equipment_vocabulary_support.sql` |
| 65,455 | `90d53aaf8fd341dd99bab22b7d1ca280ec24b8ccee2a28efca6e835e0585a14f` | `supabase/migrations/027_exlib_catalog_content_schema.sql` |
| 37,162 | `9b7d3a52dc0b75f129745bec51a4c972aa284bb5cb0d6159e0cbbb981e463fb3` | `supabase/migrations/028_weight_time_tracking_mode.sql` |

### 4.2 Migration 028 is unchanged

| Where | Bytes | SHA-256 |
|---|---|---|
| Production base `a54a30c2` | 37,162 | `9b7d3a52dc0b75f129745bec51a4c972aa284bb5cb0d6159e0cbbb981e463fb3` |
| Candidate tip | 37,162 | `9b7d3a52dc0b75f129745bec51a4c972aa284bb5cb0d6159e0cbbb981e463fb3` |
| On disk | 37,162 | `9b7d3a52dc0b75f129745bec51a4c972aa284bb5cb0d6159e0cbbb981e463fb3` |

The migration set holds **28** numbered files and **no 029** (`B1`, `B2`
statically; `P10` live). `B4`/`B5` additionally prove that no migration in
024–028 drops, alters, reindexes or otherwise relaxes the unique index the
correction depends on.

### 4.3 Historical approval evidence is byte-identical

Compared as git blob object IDs at base and at the candidate tip:

| Path | Base blob | Tip blob | |
|---|---|---|---|
| `docs/exlib2b-release1-inventory.jsonl` | `529a2c0e5c73` | `529a2c0e5c73` | byte-identical |
| `docs/exlib2b-release1-coverage-matrix.md` | `3459dbf70a73` | `3459dbf70a73` | byte-identical |
| `docs/exlib1c0a-equipment-resolution.jsonl` | `950f5ea17aac` | `950f5ea17aac` | byte-identical |

Not one of the eight historically deferred rows was rewritten to make the five
selected entries look admitted. `import_eligible`, `deferred`,
`deferred_reason`, `review_status` and `collision_classification` are untouched;
the coverage matrix still states that eight entries were explicitly deferred
(`A6`). `A5` asserts the stronger form: all five *admitted* entries keep their
original historical rows (`deferred=true`, `import_eligible=false`,
`review_status=proposed`), because that file is approval evidence and not a live
admission ledger. `B11` re-proves blob identity against the base.

---

## 5. Verifier results

### 5.1 Static verifier — `scripts/verify-weight-time-w14.ts`

**212 passed, 0 failed. Exit 0.**

| Group | Covers |
|---|---|
| S1 | admission set, declared size, exact order, no sixth identity |
| S2 | carry exclusion, manifest side and package side |
| S3–S9 | every governed field of every entry against the independent `EXPECTED` table |
| S7e/f/g | the 2/3 provenance split and the all-four-NULL / all-four-non-NULL rule |
| S8x/y/z | the Correction-1 invariant: distinct URLs, both external, index named |
| S10 | payload fingerprints recomputed from the manifest's declared scheme |
| S11 | the package consumes the manifest's values, read structurally per call site |
| M1–M4 | the required-field matrix, closed at 90/90 entry-argument pairs |
| S12/S12x | no forbidden authority, and no direct DML bypassing the loader boundary |
| S13 | no blocked/superseded evidence survives into the artifacts |
| A1–A6 | the independent re-parse of the historical inventory |
| D1–D14 | the decision carrier retains the passages the ruling requires preserved |
| B1–B13 | boundaries: 028, the migration set, the index, the commit chain, the change surface |

**29 negative controls, each required to be rejected by the assertion it
names** — 22 over the artifacts and 7 over the decision carrier. A control that
changed nothing, or whose target assertion no longer exists, is reported as a
broken control rather than absorbed into an aggregate pass:

`NC-SUBSTITUTE`, `NC-ADD`, `NC-REORDER`, `NC-EXTRA-IDENTITY`,
`NC-ADMIT-A-CARRY`, `NC-SAME-URL`, `NC-FORGEFITOS-133`,
`NC-NULL-EXTERNAL-FIELD`, `NC-SUPERSEDED-MANIFEST`, `NC-ALIAS`, `NC-CATEGORY`,
`NC-EQUIPMENT`, `NC-TRACKING-MODE`, `NC-FINGERPRINT`, `NC-PACKAGE-DRIFT`,
`NC-DELIVERY`, `NC-CONTENT-REVIEW`, `NC-DIRECT-DML`, `NC-BLOCKED-HASH`,
`NC-UNCARRIED-FIELD`, `NC-MISCREDITED-FIELD`, `NC-UNBOUND-CARRIER`;
`NC-DECISION-ERASED`, `NC-UNSTRUCK`, `NC-STOP-ERASED`, `NC-REBOUND`,
`NC-EVIDENCE`, `NC-RELAXATION`, `NC-UUID`.

`NC-UNCARRIED-FIELD` reproduces the exact defect that caused the original §4
STOP: a loader argument left with no decision carrier.

The classes are SUBSTITUTE, ADD, REORDER and EXTRA-IDENTITY as required, plus
the four the correction ruling added (identical URLs, provenance reclassified,
an external field nulled, the superseded manifest restored).

### 5.2 Disposable-database verifier — `scripts/verify-weight-time-w14-live.sh`

**67 passed, 0 failed. Exit 0.** Stable across repeated runs.

Unix socket only, no TCP listener, no Supabase CLI, no hosted credentials, no
Vercel; the cluster, ten scratch clones and every generated control are
destroyed on exit (`G3`). `G2` asserts that every database invocation targets
only the disposable socket and every cluster command only the disposable data
directory, and `G2b` is its positive control: the same detector flags a
synthetic remote-host client and a synthetic foreign data directory while
ignoring a legitimate on-fixture invocation, so `G2`'s zero is a real absence
rather than a broken detector.

The chain 001–028 is applied to the disposable cluster and the **exact** prepared
package file is then executed once.

Measured deltas over a deliberately **non-empty** baseline —
`3 / 1 / 2 / 2 / 3 / 1 / 84 / 0` before, `8 / 6 / 7 / 2 / 8 / 1 / 84 / 0` after
(catalog identities / snapshots / anatomy rows / aliases / name claims / content
versions / tenant exercise rows / tenant delivery aliases):

| Proof | Result |
|---|---|
| P1 / P1b / P1c | exactly five new identities and five new snapshots, one snapshot each, no sixth identity |
| P2 | all five `weight_time`, and the only `weight_time` rows in the catalog |
| P3 | every governed field of all five, **read back out of the database**, equals the manifest exactly |
| P4 | born-pending: `review_status=pending`, `is_active=true`, `catalog_version=1`, all three review-audit fields NULL — loading is not approval |
| P4b / P4c | the 2/3 split landed unnormalized; the three original rows carry all four source fields NULL |
| P5 / P5a | not one of the three carries landed |
| P6 | zero tenant exercise rows created, none linked to a W14 identity; the tenant table still holds exactly its 84 fixture rows |
| P7 | zero tenant delivery aliases exist at all; the whole tenant surface byte-identical to the pre-state digest |
| P8 | the pre-existing catalog surface outside the five is byte-identical to an independently captured pre-state digest |
| P8b | the content / expected-relationship / review-event surface is byte-identical, and no content version references a W14 identity |
| P8c | the bidirectional name-claim invariant still holds, via migration 023's own verifier |
| P8d / P8e | the temporary loader elevation was restored exactly (`1/supabase_admin>postgres:true:false:false`, `SET ROLE` denied again) and no client, service or PUBLIC authority was widened |
| P9 | **delivery was never invoked** |
| P10 | 028 byte-identical at its pinned identity; no 029 |
| P11a–P11e | malformed, substituted and additive controls all fail closed with zero partial state |
| P11f / P11g | single-variable ablations isolating the collision's cause |
| P11h | stated scope limit (below) |
| P12–P12d | a second execution is refused, not repeated |
| P13 / P13b | atomicity under late-postcondition sabotage |
| P14 | fingerprints recompute from the database readback |
| P15a–P15e | the unique-index proof and its negative control |

**One-use, proven (P12).** A second execution of the same package is **refused
at `W14-PRE-TARGET`, before any write** — not treated as a normal success and
not a silent no-op. `P12b` shows the refused re-run changed nothing (still five
snapshots, not ten; nothing relinked, nothing duplicated, the whole surface
byte-identical), `P12c` shows it called no loader function at all, and `P12d`
shows it refused *before* the temporary grant.

**Atomicity, proven (P13).** With the final postcondition sabotaged, the whole
transaction rolls back: no identity, no snapshot, no name claim and no anatomy
row from that transaction remains, the pre-existing surface sits at its exact
baseline, and the authority baseline is exact. `P13b` closes the loophole that
would make that result vacuous — the non-transactional function-call statistics
prove the sabotaged run **did** reach and execute all five loader calls, so the
zero residue is genuine atomicity and not an early exit.

**Stated scope limit (P11h).** Substituting one of the five frozen UUIDs
*commits* on a disposable database — four governed identities plus one
ungoverned one — because no database can know the frozen allocation. That class
is caught only by `scripts/verify-weight-time-w14.ts`
(`NC-SUBSTITUTE` → `S7.139b`), which is therefore load-bearing rather than a
convenience. The report states this rather than implying the live proof covers
everything.

### 5.3 No tenant delivery, no content review, no publication

- `S12` scans the package with comment text removed and finds **zero**
  executable references to `deliver_catalog_exercises`,
  `rollback_catalog_delivery`, `load_catalog_content_draft`,
  `apply_content_review`, `admit_catalog_content`, `publish_catalog_content`,
  `exlib_approve_and_seal_run`, `exlib_revoke_run_delivery` or
  `exlib_content_admission_manifest`. Comment stripping is conservative by
  construction: it truncates each line at the first `--`, which can only remove
  text from consideration, and the package's header names all nine on purpose.
- `S12x` proves there is no direct catalog DML. The package's only `INSERT`
  targets its own temporary pre-state table; every catalog write goes through
  `load_catalog_identity` / `load_catalog_snapshot`.
- `P9` is the live form and uses `pg_stat_user_functions` with
  `track_functions=all` — non-transactional, so it survives rollback: exactly
  five `load_catalog_identity` calls, five `load_catalog_snapshot` calls, and
  **zero** calls to `deliver_catalog_exercises`,
  `load_catalog_content_draft`, `apply_content_review`,
  `admit_catalog_content` or `publish_catalog_content`.
- `P8b` proves the content, expected-relationship and review-event surface is
  byte-identical afterwards and that no content version references a W14
  identity: **no content draft, review, admission or publication act occurred.**
- `exercise_catalog_content.import_admitted` was not mutated. Nothing here
  smuggles approval into loading.
- `NC-DELIVERY` and `NC-CONTENT-REVIEW` prove those pins are alive by adding
  such a call and requiring `S12` to catch it.

---

## 6. Full local validation matrix

All runs on this machine, against the candidate tip, with a clean working tree.
Every verdict below is an exit status.

| Gate | Result |
|---|---|
| `scripts/verify-weight-time-w14.ts` | exit 0 — 212 passed, 0 failed |
| `scripts/verify-weight-time-w14-live.sh` | exit 0 — 67 passed, 0 failed |
| `npm run type-check` (`tsc --noEmit`) | exit 0 |
| `npm run lint` (`next lint`) | exit 0 — 0 errors |
| Machine-readable ESLint classification | exit 0 — 372 files, **0 errors**, 400 warnings, all `@typescript-eslint/no-explicit-any` |
| Full `scripts/verify-*.ts` matrix | **116 of 116 exit 0**; 7,898 reported passes, 0 reported failures |
| 15 pre-existing `scripts/verify-*-live.sh` | **15 of 15 exit 0**; 1,339 passes, 0 failures |
| Sanitized production build (`next build`) | exit 0 |

### 6.1 The weight_time deterministic suites

| Suite | Result |
|---|---|
| `verify-weight-time-w4-vocabulary` | exit 0 — 13 passed, 0 failed |
| `verify-weight-time-migration-028` | exit 0 — 25 passed, 0 failed |
| `verify-weight-time-contract` | exit 0 — 30 passed, 0 failed |
| `verify-weight-time-records` | exit 0 — 60 passed, 0 failed |
| `verify-weight-time-w9-integration` | exit 0 — 56 passed, 0 failed |
| `verify-weight-time-w10-ui` | exit 0 — 53 passed, 0 failed |
| `verify-weight-time-w10-5-stabilization` | exit 0 — 38 passed, 0 failed |
| **`verify-weight-time-w12-r1`** | exit 0 — 41 passed, 0 failed |
| **`verify-weight-time-w12-r2`** | exit 0 — 58 passed, 0 failed |
| `verify-weight-time-w14` | exit 0 — 212 passed, 0 failed |
| `verify-weight-time-contract-live` | exit 0 — 53 passed, 0 failed |

### 6.2 The pre-existing live suites

| Suite | Result |
|---|---|
| `verify-exlib1b3-live` | exit 0 — 22 passed, 0 failed |
| `verify-exlib1c0b3-live` | exit 0 — 27 passed, 0 failed |
| `verify-exlib2e-live` | exit 0 — 94 passed, 0 failed |
| `verify-exlib2f-live` | exit 0 — 100 passed, 0 failed |
| `verify-exlib2k-live` | exit 0 — 80 passed, 0 failed |
| `verify-exlib2l-live` | exit 0 — 135 passed, 0 failed |
| `verify-exlib2m-live` | exit 0 — 151 passed, 0 failed |
| `verify-exlib2o-live` | exit 0 — 93 passed, 0 failed |
| `verify-exlib2p-live` | exit 0 — 85 passed, 0 failed |
| `verify-exlib2q-live` | exit 0 — 95 passed, 0 failed |
| `verify-exlib2r-live` | exit 0 — 118 passed, 0 failed |
| `verify-exlib2u-live` | exit 0 — 100 passed, 0 failed |
| `verify-exlib2y-live` | exit 0 — 64 passed, 0 failed |
| `verify-exlib2z-live` | exit 0 — 122 passed, 0 failed |
| `verify-weight-time-contract-live` | exit 0 — 53 passed, 0 failed |

### 6.3 No verifier was retargeted or weakened

`scripts/verify-exlib1c0b.ts` sweeps `scripts/verify-*.ts` for the legacy
reps-and-load mode name and requires every hit to appear in a byte-frozen
pre-implementation audit that no later file can join. A negative control in the
new static verifier originally used that literal, which would have forced a
retarget of somebody else's frozen pin. The control was changed instead — it now
uses `timed`, the vocabulary neighbour `weight_time` is genuinely confusable
with, which is a *better* control as well as a compliant one. The comment
explaining the choice is itself self-avoiding.

Result: `verify-exlib1c0b.ts` exits 0 with 26 passed / 0 failed at both the
production base `a54a30c2` and the candidate tip, each in a clean worktree with
empty porcelain. **No pre-existing verifier was retargeted, and no pin was
weakened.** `B12` additionally asserts that the three deferred F2a maintenance
sites are not modified on account of this work.

### 6.4 ESLint delta against the base

Measured, not argued — the same command in a clean worktree at the production
base:

| | Files linted | Errors | Warnings |
|---|---|---|---|
| Base `a54a30c2` | 370 | 0 | 400 |
| Candidate tip | 372 | 0 | 400 |
| **Delta** | **+2** | **0** | **0** |

Both new TypeScript files report **0 errors, 0 warnings**. The 400 warnings are
the pre-existing `no-explicit-any` backlog the `"warn"` setting exists to keep
visible; W14 adds none, and the rule was not turned off, downgraded, or
suppressed anywhere.

### 6.5 The sanitized production build

Run in a clean detached worktree at the candidate tip with a synthetic
`.env.local` containing only non-routable placeholders
(`http://127.0.0.1:54321`). The developer's real `.env.local` was neither read,
copied, nor modified, and no `VERCEL*`, `SUPABASE*` or `SB_*` variable was
present in the environment.

`npm run build` exits **0**. Post-build scan of `.next`:

| Probe | Files | Expected |
|---|---|---|
| `weight-time-w14` anywhere in the output | 0 | 0 — the W14 artifacts are not build-visible |
| The hosted project ref | 0 | 0 |
| Any `https://<20-char-ref>.supabase.co` host | 0 | 0 |
| The sanitized placeholder URL | 16 | non-zero — positive control that the sanitized env is what got compiled in |

Eight files contain the literal `supabase.co`; inspected, every occurrence is
the `@supabase/ssr` library's own wildcard constant `"*.supabase.co"` and a
dashboard documentation URL. No credential and no hosted host is present.

The W14 artifacts live in `docs/` and `scripts/`, are imported by nothing under
`src/`, and appear in no Next configuration; the build confirms they are outside
the build graph. The single compile warning is the pre-existing
`@supabase/supabase-js` Edge-Runtime notice reached through
`src/lib/supabase/middleware.ts`; `src/` is byte-identical to the production
base in this range, so that warning is necessarily unchanged.

### 6.6 Classified, not fixed — findings encountered during this run

Neither of these was repaired. Both are recorded for a later, separately
authorized instruction.

**W14P-C1 — six pre-existing live suites depend on the caller's locale.**
`verify-exlib2p-live.sh`, `verify-exlib2q-live.sh`, `verify-exlib2r-live.sh`,
`verify-exlib2u-live.sh`, `verify-exlib2y-live.sh` and `verify-exlib2z-live.sh`
export no locale. With `LANG`/`LC_ALL` unset, `pg_ctl start` fails on macOS with
`FATAL: postmaster became multithreaded during startup` / `HINT: Set the LC_ALL
environment variable to a valid locale`, so each exits 1 at its own `B1` with no
assertion tally. The other nine live suites — and both W14 verifiers — set a
locale themselves and are unaffected.

Pre-existence proved rather than assumed: in a clean worktree at the production
base `a54a30c2`, where no W14 file exists, `verify-exlib2p-live.sh` fails
identically with a bare environment (exit 1, same FATAL) and passes 85/0 with
`LC_ALL=C`. **This is not a W14 regression**, and it is an instance of the
standing rule that a gate must never depend on ambient locale. The suites were
run with `LC_ALL=C LANG=C` exported by the caller to obtain the §12 results in
6.2; no suite file was edited.

**W14P-C2 — F2 / F2a / F2b / F3 / F4 remain deferred.** Encountered only as
neighbouring text. `verify-exlib1c0b3-live.sh`, `verify-exlib2e-live.sh` and
`verify-exlib2l-live.sh` were run and are green; none was modified. `B12`
asserts that mechanically.

No regression appeared in any previously green suite.

---

## 7. Boundary statements

**No hosted contact.** During W14-P no hosted Supabase request was made, the
Supabase CLI was not invoked for any subcommand, and Vercel was not contacted at
all — not even read-only. Every database operation in this work ran against a
disposable local PostgreSQL cluster reachable only through a unix socket in a
temporary directory, destroyed on exit.

For the avoidance of a misleading record: this clean statement covers **W14-P
only**. The earlier W12-R1/R2 rounds carry a standing disclosure of an
accidental `npx supabase projects list` — an unauthorized hosted-management API
attempt; no mutation observed; no output or hosted project data entered the work
product; the command was killed; no remedial hosted action was authorized or
required. R1/R2 must not be described as having had no hosted contact. The
self-imposed rule since then — never invoke the `supabase` CLI, for any
subcommand — was honoured throughout this round.

**No push, no deploy.** Nothing was pushed. `origin/main` is still
`a54a30c25b1427aee24d00c37bd6a4aec69dd3d0`. No branch was published, no tag was
created or pushed, no remote ref was moved, and nothing was deployed or
redeployed. The candidate exists only as local commits on `feature/weight-time`.

**No hosted application.** **W14 HOSTED APPLICATION HAS NOT OCCURRED.** The
prepared package has never been applied to hosted Supabase. It is labelled
`PREPARED - NOT EXECUTED`, states that it has not been applied to hosted, and
the machine manifest records `hosted_application_has_occurred: false` (`S13c`
asserts all three). No catalog review, approval, publication or delivery action
was begun. No tenant exercise and no tenant delivery alias was created.
`deliver_catalog_exercises` was never invoked.

**What remains gated.** The hosted W14 act is not authorized by this
preparation. When it is authorized, it is a one-use act: after a successful
commit the package is spent. If its transport or result is ever ambiguous, read
state first — never blindly rerun.

---

## 8. Reconstruction

The review package ships a git bundle carrying the three commits
`a54a30c2..dd24dd6` (plus this report's commit) with `a54a30c25b1427…` as the
prerequisite, so the candidate can be reconstructed offline from production
`main` with no network access:

```bash
git clone --no-local /path/to/shredos recovered   # or use an existing clone at a54a30c2
git -C recovered fetch /path/to/forgefit-weight-time-w14-prep.bundle 'refs/heads/*:refs/remotes/w14/*'
```

The accompanying `forgefit-weight-time-w14-prep-manifest.txt` records the bundle
and every packaged file by byte size and SHA-256, including this report, and
names the tip the bundle carries.
