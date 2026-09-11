# weight_time W14 — operator field decisions for the five-entry catalog admission

Recorded 2026-09-11 (UTC). LOCAL-ONLY governance artifact. **This
document is the authoritative carrier for the
`load_catalog_snapshot` loader fields that were ABSENT from the
historical planning inventory** — `category`, `provenance`,
`source_url`, `source_page`, `retrieved_at`, `import_confidence`,
`aliases`, and the logical identity UUID.

It exists because those fields have no carrier anywhere in the
committed corpus, and `exercise_catalog.category` and
`exercise_catalog.provenance` are both `NOT NULL`. A W14 admission
package cannot be authored without them, and no committed artifact
supplies them for these five entries. The preparation therefore
STOPPED before authoring rather than filling in plausible values,
and the operator closed each field by explicit decision. Those
decisions are recorded here.

**These decisions did NOT previously exist.** They are not present
in `docs/exlib2b-release1-inventory.jsonl`, in
`docs/exlib2b-release1-coverage-matrix.md`, in
`docs/exlib1a-discovery-manifest.jsonl`, in
`docs/exlib1c0a-equipment-resolution.jsonl`, or in
`docs/weight-time-coordinated-implementation-plan.md`. Nothing in
this document may be read as a restatement of a pre-existing
inventory value, and no historical file was edited to encode any of
it. The two historical Release-1 artifacts remain byte-identical:
they are preserved approval evidence, and the eight entries they
record as deferred are still recorded as deferred there.

No hosted Supabase contact, no Supabase CLI invocation, no Vercel
contact, no push, no deployment, and no hosted mutation occurred in
producing this document. **The W14 hosted application has NOT
occurred.**

## 1. Scope — exactly five entries

The admission set is exactly five entries, identified by FILE LINE
in `docs/exlib2b-release1-inventory.jsonl` (the file carries four
leading comment lines, so record ordinal = file line − 4):

| inv line | `proposed_canonical_name` | equipment | movement_pattern |
|---|---|---|---|
| 132 | Plate-weighted plank | `weight_plate` | `core_anti_extension` |
| 133 | Weighted vest plank | `weighted_vest` | `core_anti_extension` |
| 137 | Weighted dead hang | `weight_plate` | `grip_forearm` |
| 138 | Weighted wall sit | `weight_plate` | `squat` |
| 139 | Weighted vest wall sit | `weighted_vest` | `squat` |

Inventory lines **134 (Farmer's carry), 135 (Suitcase carry) and
136 (Sandbag bear-hug carry) are EXCLUDED and remain DEFERRED.**
Carry tracking is a separate, later product decision. No carry mode
is named, invented, or reinterpreted here, and no carry entry is
admitted. The three carry rows keep their historical deferred
disposition untouched.

## 2. Decision-provenance classes

Every value below is labeled with how it was established. The three
classes are kept distinct deliberately, so a reviewer can see
exactly which facts were read out of committed evidence and which
are new human judgment.

- **Class A — source-derived fact.** Read verbatim from a committed
  artifact. No judgment applied.
- **Class B — operator inheritance / analogy.** The operator
  extended a fact that a committed artifact carries for a RELATED
  identity (a source family, or the closest taxonomy precedent) to
  these entries. The underlying fact is committed; the extension to
  these identities is the operator's.
- **Class C — new operator decision.** No committed artifact bears
  on the value for any identity. The operator decided it.

## 3. Per-entry decisions

### 132 — Plate-weighted plank

| field | value | class |
|---|---|---|
| `category` | `isolation` | **C** (§5 ruling) |
| `provenance` | `external_source_derived` | **B** |
| `aliases` | `[]` | **C** (§4 ruling) |
| `source_url` | `https://www.strengthlog.com/weighted-plank/` | **B** |
| `source_page` | `https://www.strengthlog.com/exercise-directory/` | **B** |
| `retrieved_at` | `2026-08-20` | **B** |
| `import_confidence` | `human_review_required` | **B** |

Operator rationale, recorded as given: this entry is one branch of
the committed Weighted Plank family. `docs/exlib1a-discovery-
manifest.jsonl` line 51 carries that family as a discovery record
with `category` `isolation`, `confidence`
`human_review_required`, `source_url`
`https://www.strengthlog.com/weighted-plank/` and `retrieved_at`
`2026-08-20`; `docs/exlib1c0a-equipment-resolution.jsonl`
resolution `exlib1c0a-eq-02` carries the same source identity with
`source_page` `https://www.strengthlog.com/exercise-directory/` and
splits the one source family into two canonical ForgeFitOS
candidates, `Plate-Weighted Plank` (desired equipment
`weight_plate`) and `Weighted-Vest Plank` (desired equipment
`weighted_vest`), which became inventory lines 132 and 133. **The
split does not erase the common source lineage.** The extension of
the family's lineage to this specific split identity is the
operator's (class B); the underlying URL, page, date and confidence
values are committed facts.

This entry has the STRONGER of the two lineages: the inventory row
itself carries `name_matches_legacy_candidate:
"Plate-Weighted Plank"`, which is the eq-02 candidate name
verbatim, so the link from line 132 to the resolved source family is
committed rather than inferred.

### 133 — Weighted vest plank

> **THE FOUR SOURCE FIELDS IN THIS SUBSECTION ARE SUPERSEDED BY §11
> (Correction 1).** `category`, `provenance` and `aliases` below are
> still current. The `source_url`, `source_page`, `retrieved_at` and
> `import_confidence` values below, and the shared-URL rationale that
> follows them, were the FIRST decision version; disposable execution
> proved that binding impossible under a committed unique index. The
> original text is preserved here as decision history and must not be
> read as the current binding. **§11 is authoritative for 133's
> external source binding.**

| field | value | class |
|---|---|---|
| `category` | `isolation` | **C** (§5 ruling) |
| `provenance` | `external_source_derived` | **B** |
| `aliases` | `[]` | **C** (§4 ruling) |
| ~~`source_url`~~ | ~~`https://www.strengthlog.com/weighted-plank/`~~ | superseded → §11 |
| ~~`source_page`~~ | ~~`https://www.strengthlog.com/exercise-directory/`~~ | superseded → §11 |
| ~~`retrieved_at`~~ | ~~`2026-08-20`~~ | superseded → §11 |
| ~~`import_confidence`~~ | ~~`human_review_required`~~ | re-ruled in §11 (same value, different basis) |

Identical values to 132, for the same reason: same source family,
same classification. **It is intentional and valid for 132 and 133
to share the same external source URL while remaining distinct
catalog logical identities.** They are two equipment resolutions of
one discovered movement, and the equipment dimension — not the
source — is what distinguishes them. A reviewer seeing one URL
against two identities is seeing the resolution, not a duplicate.

One difference from 132 is recorded rather than smoothed over: this
row's `name_matches_legacy_candidate` is `null`, so its link to the
eq-02 candidate `Weighted-Vest Plank` rests on the shared source
family and the matching `weighted_vest` equipment decision, not on a
committed name match. The operator's inheritance ruling covers it;
the lineage is one step weaker than 132's and is labeled so here.

### 137 — Weighted dead hang

| field | value | class |
|---|---|---|
| `category` | `isolation` | **C** (§5 ruling) |
| `provenance` | `forgefitos_original` | **C** |
| `aliases` | `[]` | **C** (§4 ruling) |
| `source_url` | `NULL` | **C** (forced by constraint) |
| `source_page` | `NULL` | **C** (forced by constraint) |
| `retrieved_at` | `NULL` | **C** (forced by constraint) |
| `import_confidence` | `NULL` | **C** (forced by constraint) |

Operator rationale, recorded as given: the closest committed
taxonomy precedent is Bar Hang (`docs/exlib1a-discovery-
manifest.jsonl` line 208, and One-Handed Bar Hang at line 215),
both `category` `isolation`, so `isolation` is the operator's
category ruling. **However, there is no committed lineage binding
THIS weighted identity to an external discovery record** — neither
"Weighted dead hang" nor any near-name appears as a
`proposed_name` or `source_name` in the discovery manifest, and the
identity appears in none of the nine equipment resolutions.
Therefore external provenance is NOT fabricated. `provenance` is
`forgefitos_original`, and migration 027's
`exercise_catalog_provenance_sources_chk` then REQUIRES all four
discovery-source fields to be `NULL` — so the four `NULL`s are not
a choice made twice, they are the constraint's consequence of the
provenance ruling. That constraint exists for exactly this reason:
027's own comment records the 2K feasibility finding that external
discovery fields have no truthful `forgefitos_original` value and
that fabricating one is forbidden.

### 138 — Weighted wall sit

| field | value | class |
|---|---|---|
| `category` | `compound` | **C** (§5 ruling) |
| `provenance` | `forgefitos_original` | **C** |
| `aliases` | `[]` | **C** (§4 ruling) |
| `source_url` | `NULL` | **C** (forced by constraint) |
| `source_page` | `NULL` | **C** (forced by constraint) |
| `retrieved_at` | `NULL` | **C** (forced by constraint) |
| `import_confidence` | `NULL` | **C** (forced by constraint) |

Operator rationale, recorded as given: the governed
`movement_pattern` is `squat`, the primary muscle is `quads` and
`glutes` is secondary; existing ForgeFitOS discovery taxonomy
consistently classifies squat-family movements as `compound`. The
discovery manifest carries no wall-sit record of any kind, so there
is no external lineage to inherit and `forgefitos_original` is the
truthful provenance.

### 139 — Weighted vest wall sit

| field | value | class |
|---|---|---|
| `category` | `compound` | **C** (§5 ruling) |
| `provenance` | `forgefitos_original` | **C** |
| `aliases` | `[]` | **C** (§4 ruling) |
| `source_url` | `NULL` | **C** (forced by constraint) |
| `source_page` | `NULL` | **C** (forced by constraint) |
| `retrieved_at` | `NULL` | **C** (forced by constraint) |
| `import_confidence` | `NULL` | **C** (forced by constraint) |

Same taxonomy ruling as line 138. Distinct equipment identity
(`weighted_vest` rather than `weight_plate`), ForgeFitOS-original
provenance.

## 4. Provenance invariant — MIXED, and not to be normalized

**The five-entry W14 set intentionally has MIXED provenance:**

| inv line | `provenance` | four source fields |
|---|---|---|
| 132 | `external_source_derived` | ALL FOUR non-NULL, exactly the §3 values |
| 133 | `external_source_derived` | ALL FOUR non-NULL, exactly the **§11** values |
| 137 | `forgefitos_original` | ALL FOUR `NULL` |
| 138 | `forgefitos_original` | ALL FOUR `NULL` |
| 139 | `forgefitos_original` | ALL FOUR `NULL` |

**Do not normalize these to one provenance value.** Two of the five
have a real committed external source family; three have none.
Flattening in either direction would either fabricate a source that
does not exist or discard one that does. Any package or manifest
that violates this 2/3 split is wrong and must stop rather than
proceed. The split is additionally load-bearing at the database
level: `exercise_catalog_provenance_sources_chk` enforces both
directions, so a normalized package would be rejected by the
schema, not merely by review.

## 5. Alias ruling — exactly `[]` for all five

`aliases` is exactly the empty array for all five entries. No
alternate name is claimed for any of them.

**Do not invent** "Weighted plank", "Weighted bar hang", "Wall sit",
"Weighted squat hold", or any other alias merely because a name
seems useful or would read well. **No alias claim is preferable to
an unsupported name claim.** An alias is a global name claim in
`exercise_catalog_name_claims`; an invented one would permanently
occupy a name the product has not decided to own. The committed
equipment resolution `exlib1c0a-eq-02` independently carries
`aliases: []` on BOTH of its canonical candidates, so for 132 and
133 the empty array is also the only value with committed support.
For 137, 138 and 139 no committed artifact mentions the identity at
all — the discovery manifest contains no dead-hang or wall-sit
record among its 395 entries, and none of the nine equipment
resolutions names one among their 26 candidates — so there is no
alias evidence to inherit and none is manufactured.

## 6. Category ruling

| inv line | `category` |
|---|---|
| 132 | `isolation` |
| 133 | `isolation` |
| 137 | `isolation` |
| 138 | `compound` |
| 139 | `compound` |

**These are now operator decisions.** Two constraints on any
downstream use:

- **Do not derive `category` from `training_role`.** They are
  different columns with different vocabularies and they routinely
  disagree. The committed Plank load is the proof: `training_role`
  `core`, `category` `isolation`. Here, lines 138 and 139 carry
  `training_role` `accessory` while their category is `compound`,
  and 137 carries `training_role` `accessory` while its category is
  `isolation`. Any code or document that computes one from the
  other is wrong.
- **Do not change these during package generation** unless an
  actual schema incompatibility is discovered. If one is
  discovered, STOP and report it rather than substituting another
  category. For the record, no incompatibility exists: all five
  values are members of the `exercise_catalog_category_check`
  vocabulary (`compound`, `isolation`, `cardio`, `mobility`,
  `other`) established in migration 023.

## 7. Deterministic logical identity allocation

The repository has an established convention for logical identities
that do not yet exist in any database: the load package predeclares
them, and the governance record documents them. It was introduced by
`docs/exlib2k-plank-catalog-load-package.sql`, which states that "no
committed UUIDs exist for a not-yet-loaded catalog, so the package
declares them and the record documents them", and allocated
`e21b2c00-0000-4000-a000-000000000001` (Plank),
`…0002` (Dead bug) and `…0003` (Ab wheel rollout) in that form.

W14 follows that convention rather than inventing a second one, and
continues the same identity series at the next five free ordinals.
**Runtime-random UUIDs are not used.** Migration 027's
`load_catalog_identity(p_id UUID DEFAULT NULL)` resolves its
argument through `COALESCE(p_id, gen_random_uuid())`, so passing an
explicit predeclared id is a supported loader path, and the five
identities are knowable and reviewable BEFORE any hosted act.

| inv line | canonical name | logical identity UUID |
|---|---|---|
| 132 | Plate-weighted plank | `e21b2c00-0000-4000-a000-000000000004` |
| 133 | Weighted vest plank | `e21b2c00-0000-4000-a000-000000000005` |
| 137 | Weighted dead hang | `e21b2c00-0000-4000-a000-000000000006` |
| 138 | Weighted wall sit | `e21b2c00-0000-4000-a000-000000000007` |
| 139 | Weighted vest wall sit | `e21b2c00-0000-4000-a000-000000000008` |

Allocation is collision-checked against the whole committed corpus.
The `e21b2c00` family ordinals in use are `…0001`, `…0002` and
`…0003` (the three loaded identities), `…0101` (Plank content
version 1), and three values that exist ONLY as counterfactual
tamper inputs inside live verifiers and are deliberately left alone:
`…0009`, `…0102` and `…00dead`. Ordinals `…0004` through `…0008`
were unused anywhere. All five allocated values are version-4
shaped (version nibble `4`, variant nibble `a`), matching the
family and the `UUID_RE` shape the existing verifiers assert.

**Once allocated, these five UUIDs are FROZEN within this W14
review candidate.** The mapping above is authoritative; the W14
machine-readable manifest and the one-use application package carry
exactly these values in exactly this order, and neither may
reassign them.

## 8. Required-field matrix — every loader argument now has a carrier

`public.load_catalog_snapshot` takes eighteen arguments. Migration
027 declares them in this order, and the table's own CHECKs plus
the carried freeze trigger enforce every vocabulary, provenance and
discovery rule. The matrix below is the resolution of the §4 STOP:
every argument now has exactly one authoritative carrier, and none
is guessed.

| # | loader argument | carrier | class |
|---|---|---|---|
| 1 | `p_logical_id` | §7 of THIS document | C |
| 2 | `p_canonical_name` | inventory `proposed_canonical_name` | A |
| 3 | `p_category` | §6 of THIS document | C |
| 4 | `p_primary_muscle` | inventory `primary_muscle` | A |
| 5 | `p_equipment` | inventory `equipment` | A |
| 6 | `p_laterality` | inventory `laterality` | A |
| 7 | `p_tracking_mode` | inventory `tracking_mode` (`weight_time`) | A |
| 8 | `p_provenance` | §3/§4 of THIS document | B/C |
| 9 | `p_movement_pattern` | inventory `movement_pattern` | A |
| 10 | `p_training_role` | inventory `training_role` | A |
| 11 | `p_difficulty` | inventory `difficulty` | A |
| 12 | `p_availability` | inventory `availability` | A |
| 13 | `p_source_url` | §3 as corrected by §11 | A/B, or NULL by constraint |
| 14 | `p_source_page` | §3 as corrected by §11 | B/C, or NULL by constraint |
| 15 | `p_retrieved_at` | §3 as corrected by §11 | A/B, or NULL by constraint |
| 16 | `p_import_confidence` | §3 as corrected by §11 | B/C, or NULL by constraint |
| 17 | `p_anatomy` | inventory `muscle_targets` | A |
| 18 | `p_aliases` | §5 of THIS document (`[]`) | C |

Twelve arguments are class A — read verbatim out of the historical
planning inventory, which does carry them. Six had no carrier at
all until this document supplied one. `p_tracking_mode` is
`weight_time` for all five, which is admissible only because
migration 028 is applied: it is 028 that adds the literal to
`exercise_catalog_tracking_mode_check`. That is a structural
prerequisite of the W14 load, and the application package checks it
rather than assuming it.

The class-A values, verbatim from the inventory, are:

| inv line | primary_muscle | equipment | laterality | movement_pattern | training_role | difficulty | availability | anatomy |
|---|---|---|---|---|---|---|---|---|
| 132 | `abs` | `weight_plate` | `bilateral` | `core_anti_extension` | `core` | `intermediate` | `home_gym` | obliques/secondary |
| 133 | `abs` | `weighted_vest` | `bilateral` | `core_anti_extension` | `core` | `intermediate` | `home_gym` | obliques/secondary |
| 137 | `forearms` | `weight_plate` | `bilateral` | `grip_forearm` | `accessory` | `intermediate` | `home_gym` | lats/secondary |
| 138 | `quads` | `weight_plate` | `bilateral` | `squat` | `accessory` | `beginner` | `minimal` | glutes/secondary |
| 139 | `quads` | `weighted_vest` | `bilateral` | `squat` | `accessory` | `beginner` | `home_gym` | glutes/secondary |

All five are `bilateral`. All five carry exactly one secondary
anatomy row and no tertiary row.

## 9. What this document deliberately does NOT do

- It does **not** rewrite, reinterpret, or annotate
  `docs/exlib2b-release1-inventory.jsonl`. Every one of the five
  rows there still reads `import_eligible: false`,
  `review_status: "proposed"`, `deferred: true`,
  `collision_classification: "deferred_weight_time"` and the
  original `deferred_reason`. Those are historical approval facts
  and they are preserved, not corrected.
- It does **not** modify
  `docs/exlib2b-release1-coverage-matrix.md`, whose "8 explicitly
  deferred" statement remains true of the historical Release-1
  approval as recorded.
- It does **not** admit anything. It supplies field values. Loading
  is not approval: the five snapshots land born-pending and
  born-active under migration 027's freeze trigger, exactly like
  every prior load, and database review, admission, publication and
  delivery all remain separately gated authorities.
- It does **not** touch migration 028, create migration 029, change
  any `src/` application code, or alter the W13 production tree.
- It does **not** bear on `exercise_catalog_content.import_admitted`
  or any part of the 027 prose-content lifecycle. No content
  version is created, reviewed, admitted or published, and
  `load_catalog_content_draft` is not called.
- It does **not** reopen R2-2c or F1/D5, both closed, and it does
  **not** modify the files named by the deferred, non-blocking
  maintenance findings F2, F2a, F2b, F3 and F4.

## 10. Boundary

Production base for this W14 preparation candidate is
`a54a30c25b1427aee24d00c37bd6a4aec69dd3d0`, tree
`e4838dea0c2ad66a894969ab1c20982d28a6af29` — the commit that is
`main` and that Vercel Production serves.

The eventual W14 hosted application may target ONLY the Supabase
project "ShredOS" (ref `ttybyljytiwntvorugcv`), only under a later
explicit one-use operator instruction, and only through the
authorized Joseph/ChatGPT path. Claude does not execute it, does
not contact hosted Supabase, and does not contact Vercel.

## 11. Correction 1 — 133's external source binding (2026-09-11)

**This section is a later, labeled correction, not a rewrite.** §3's
133 subsection is preserved verbatim above with its original
rationale, because the reason a value changed is itself part of the
governance record. This section supersedes only 133's four external
source fields, and it is authoritative for them.

This is a plain forward correction. Commit
`f125308e0a22d935c889691452477b5ac9138f83`, which carries the first
decision version, is NOT amended.

### 11.1 What happened

1. **The first decision version bound both plank variants to one
   `source_url`** — `https://www.strengthlog.com/weighted-plank/` for
   132 and for 133 — and stated that sharing it was intentional and
   valid.
2. **Disposable execution proved that binding impossible.** The
   prepared one-use package was run against a throwaway local
   PostgreSQL cluster carrying migrations 001–028. It failed at the
   second snapshot load:

   ```
   ERROR:  duplicate key value violates unique constraint
           "exercise_catalog_source_url_version_unique_idx"
   DETAIL:  Key (source_url, catalog_version)=
            (https://www.strengthlog.com/weighted-plank/, 1) already exists.
   CONTEXT: SQL statement "INSERT INTO public.exercise_catalog … RETURNING id"
            PL/pgSQL function load_catalog_snapshot(…) line 21 at SQL statement
   ```

   The index is `supabase/migrations/023_exlib_catalog_and_delivery_
   contract.sql:432`, `ON exercise_catalog (source_url,
   catalog_version)`. Read back from the applied database it is
   **non-partial** (it covers every row), `indnullsnotdistinct` is
   `false`, and no later migration alters or drops it. Two distinct
   catalog identities therefore cannot share one non-NULL
   `source_url` at the same `catalog_version` — and
   `catalog_version` is not reachable as a variable, because
   `load_catalog_snapshot`'s INSERT omits the column and the function
   takes no version argument, so every newly loaded snapshot is born
   at the column DEFAULT of 1. Because the index is non-partial and
   permanent, this is not a sequencing problem: deferring 133 to a
   later act would not help, since 132 would hold the URL at version
   1 indefinitely.
3. **The package correctly rolled back.** The failure was a refusal,
   not damage. Post-abort readback showed zero W14 rows in every
   affected table, the catalog claims invariant intact at `0/0`
   (`exlib_verify_catalog_claims`), and the transaction's temp
   pre-state table gone. The package's fail-closed design worked
   exactly as intended; what the database rejected was the ruling it
   carried, not its machinery.
4. **Two single-variable probes on fresh template clones proved the
   shared URL was the SOLE blocker.** Probe A (a synthetic distinct
   URL for 133) and probe B (133 as `forgefitos_original`) both
   reached `5 logical / 5 snapshots / 5 anatomy / 0 aliases / 5 name
   claims` and exited 0. Every other dimension of the five-entry set
   — vocabularies, both 027 provenance/discovery CHECKs, anatomy,
   empty aliases, name claims, the fourteen deltas, the three surface
   digests, and the authority elevation and restoration — is
   schema-compatible.

### 11.2 The second external evidence carrier already exists in committed evidence

`docs/exlib1c0a-equipment-resolution.jsonl`, resolution
`exlib1c0a-eq-02` — the same committed record that splits the
Weighted Plank family into `Plate-Weighted Plank` and
`Weighted-Vest Plank` — carries an `independent_evidence` array with
one entry:

| field | committed value |
|---|---|
| `url` | `https://marathonhandbook.com/weighted-plank/` |
| `retrieved_at` | `2026-08-24` |
| `classification_fact` | "classified as an isometric plank loaded externally, typically with weight plates on the back or a weighted vest; core musculature target" |

That classification fact names **both** loading methods, which is
why the record supports two equipment identities rather than one.
**A real second external provenance carrier therefore already exists
in the committed corpus. It is not new, not fetched, and not
invented.** No network access was used to establish it; it was read
out of the HEAD blob of a file this preparation had already bound by
size and SHA-256.

**Correction to the earlier STOP report, recorded rather than
erased:** that report stated no committed evidence supplied a
distinct real URL, and offered "operator supplies a real, distinct
URL" as remedy (a) requiring outside authority. That statement was
wrong. The URL was present in `independent_evidence` of the very
record that split the family — a file already in the manifest's
source bindings. The earlier remedy analysis is otherwise unchanged
and its other conclusions stand; this one finding corrects it. The
STOP itself was correct: stopping was the required action, and the
value was closed by the operator rather than by substitution.

### 11.3 Final 133 binding — authoritative

| field | value | class |
|---|---|---|
| `category` | `isolation` | **C** (§6 ruling, unchanged) |
| `provenance` | `external_source_derived` | **B** (unchanged) |
| `aliases` | `[]` | **C** (§5 ruling, unchanged) |
| `source_url` | `https://marathonhandbook.com/weighted-plank/` | **A** |
| `source_page` | `https://marathonhandbook.com/weighted-plank/` | **C** |
| `retrieved_at` | `2026-08-24` | **A** |
| `import_confidence` | `human_review_required` | **C** |

Class attribution, stated precisely so no value is credited to a
source that did not supply it:

- **`source_url` and `retrieved_at` are class A** — read verbatim
  from `independent_evidence[0]` of `exlib1c0a-eq-02`.
- **Allocating that family-level evidence to the vest branch
  specifically is the operator's (class B in kind).** The committed
  record files the Marathon Handbook article under
  `independent_evidence` for the whole Weighted Plank family, not
  under either named candidate. The operator assigned it to 133 and
  left 132 on the record's primary `source_identity`. The URL and
  date are committed facts; the allocation is the operator's ruling.
- **`source_page` is class C, by explicit ruling.** For this
  standalone external article `source_page` is intentionally the same
  URL as `source_url`. **The StrengthLog exercise-directory page must
  NOT be attached to the Marathon Handbook source record** — mixing
  the two source families would be misleading about where the record
  came from.
- **`import_confidence` is class C, by explicit ruling.** Marathon
  Handbook did not supply that vocabulary value and must not be
  credited with it. The committed evidence supplies the external
  source and the retrieval date; W14 supplies the conservative
  catalog confidence classification for this derived weighted-vest
  identity.

### 11.4 What this correction does NOT do

- **133 remains `external_source_derived`.** It was not reclassified
  to `forgefitos_original`.
- **The five-entry provenance sequence is unchanged:**
  `external_source_derived`, `external_source_derived`,
  `forgefitos_original`, `forgefitos_original`,
  `forgefitos_original`. §4's 2/3 split stands; only 133's external
  source BINDING changed. 137, 138 and 139 keep all four source
  fields `NULL`.
- **No provenance value is changed merely to satisfy a constraint.**
  The constraint ruled out one *binding*; the fix replaced that
  binding with a different real committed source, leaving the
  provenance classification untouched. Bending `provenance` to fit
  an index would have falsified the record, and was refused.
- **No schema relaxation is needed, and none is authorized.**
  `exercise_catalog_source_url_version_unique_idx` is not weakened,
  partialized, dropped or superseded. No migration 029 exists. 028
  is untouched. With two distinct URLs the package satisfies the
  index as committed, and the index is now asserted as a positive
  protection by the W14 verifiers — including a negative control
  that restores the shared URL and requires the package to fail
  closed, leaving zero partial W14 state.
- **`132` is entirely unchanged** — StrengthLog weighted-plank URL,
  StrengthLog exercise-directory page, `2026-08-20`,
  `human_review_required`, `isolation`, `external_source_derived`,
  `[]`.
- **No historical file was edited.**
  `docs/exlib2b-release1-inventory.jsonl` and
  `docs/exlib2b-release1-coverage-matrix.md` remain byte-identical,
  and `docs/exlib1c0a-equipment-resolution.jsonl` was read only.
- **The W14 hosted application still has NOT occurred** and is not
  authorized. No hosted Supabase contact, no Supabase CLI
  invocation, no Vercel contact, no push, no deployment.
