# W14-E — Production fresh-account delivery runtime evidence record

STATUS: the W14-E hosted delivery lifecycle HAS RUN against Production and
its first-delivery and second-initialization behaviour has been observed.
This document is the durable, reviewable record of that runtime act. It is
LOCAL-ONLY: it is committed to `feature/weight-time` and is not published,
pushed or tagged.

This record does not authorize anything. It does not re-run anything. It
does not repoint any alias. It is evidence, held at the bytes that describe
the thing it witnesses.

---

## 1. Provenance classes — declared, and kept distinct

Every factual claim below carries exactly one of these labels. The labels
are the point of the document: an unlabelled hosted figure in a record like
this one is indistinguishable from a guess.

| Label | What it means | Who observed it |
|---|---|---|
| **OPERATOR-SUPPLIED** | Observed by the Joseph/ChatGPT operator path on the Vercel side of the system: deployment identity, configuration change, request timings, HTTP status, browser-visible behaviour. Supplied to this record as text. | the operator path |
| **INDEPENDENT READBACK** | Read out of hosted Supabase PERSISTED STATE, out of band from the application's own report. "Independent" means independent OF THE APPLICATION'S RETURN VALUE — the row counts and identity sets were read from the tables, not taken from what the delivery function said it did. It does NOT mean independent of the operator. | the operator path |
| **LOCAL BYTES** | Derived from this repository's committed bytes and git objects, and re-derived on every run by the verifier named in section 11. This is the only class that was independently established without hosted contact. | Claude |
| **NOT CAPTURED** | Named explicitly so that nobody later mistakes its absence for a value. See section 8. | nobody |

Both OPERATOR-SUPPLIED and INDEPENDENT READBACK are hosted observations,
and neither was ever seen by Claude. No hosted system was contacted while
this record was written: no hosted Supabase, no Supabase CLI, no Vercel, no
SQL, no RPC. The standing rule that hosted acts belong to the
Joseph/ChatGPT operator path alone was not relaxed for this round.

---

## 2. Deployment identity

| Fact | Value | Provenance |
|---|---|---|
| Production deployment source SHA, before and after the corrective redeploy | `54a9d128bca659ec89d3ae149d47450e74a2ad2e` | OPERATOR-SUPPLIED |
| that commit's tree, as this repository resolves it | `0b438079693867fd1757cec383a2bc986b1c905c` | LOCAL BYTES |
| corrective deployment id | `dpl_By4VrKEjDkNTh4x7XDvAKNVEj5mu` | OPERATOR-SUPPLIED |
| corrective deployment state | observed READY, and serving the Production aliases | OPERATOR-SUPPLIED |
| local review-freeze tip at the time this record was written | `0532ffde309f0e548d6e1aa544d88107ccb50b58`, tree `9a848dbbb19f1826232400d9f0327515b7d29823` | LOCAL BYTES |

The source SHA did not move. The corrective redeploy carried the SAME
source bytes with a corrected environment variable, which is why this
record can bind the runtime behaviour to bytes that are still readable
here: the deployed source commit is an ancestor of the local tip, and the
two files that produced the observed failure text are the same git blobs at
both commits.

The local branch `feature/weight-time` remains unpushed and untagged. The
seven executable lifecycle packages under
`docs/weight-time-five-entry-packages/` exist here as reviewed bytes.
Whether the hosted stages executed THOSE EXACT BYTES is not observable from
this repository, and this record does not assert it. Section 9 states
precisely what the agreement between the hosted figures and these bytes
does and does not establish.

---

## 3. The first attempt failed closed

| Fact | Value | Provenance |
|---|---|---|
| route exercised | `/workouts` | OPERATOR-SUPPLIED |
| observed failure text | `delivery rejected: deliver_catalog_exercises: no sealed, approved, unrevoked delivery run for this key` | OPERATOR-SUPPLIED |
| tenant rows the failed attempt inserted | 0 exercises, 0 aliases | INDEPENDENT READBACK |

This is the fail-closed law behaving exactly as designed, and the observed
string is reproducible from the deployed bytes without contacting anything.
It is the composition of two halves:

- `src/lib/supabase/deliver-catalog.ts` builds the prefix
  `delivery rejected: ` from the database error message when the RPC
  returns an error (13036 B, sha256
  `5143e7996efac7e428a5e7b06a3d204d802730bb2400e0e222b5cd2090a70049`; git
  blob `b44368a994731979b3261b07b4a63a0d9a5b7508` at BOTH the deployed
  source commit and the local tip).
- `supabase/migrations/028_weight_time_tracking_mode.sql` raises
  `deliver_catalog_exercises: no sealed, approved, unrevoked delivery run for this key`
  when the delivery predicate finds no sealed, approved, unrevoked run for
  the supplied key (37162 B, sha256
  `9b7d3a52dc0b75f129745bec51a4c972aa284bb5cb0d6159e0cbbb981e463fb3`; git
  blob `8a1964609cf9b3a45d0d9dd06105e348601b8738` at BOTH commits).

That composition is LOCAL BYTES. The fact that this particular string was
seen in Production is OPERATOR-SUPPLIED. The two agree, which is the useful
thing: the failure was a CONFIGURATION failure — the run key presented by
the application did not name a sealed run — and not a defect in the
delivery contract, a partial write, or a silent fallback to the seed path.
Zero inserted rows is the fail-closed guarantee holding: the delivery path
never seeds.

### What the initial failure does and does not establish about its cause

The initial attempt establishes exactly one thing about causality: the key
that reached `deliver_catalog_exercises` did not identify a sealed, approved,
unrevoked delivery run. It does not establish WHY that key failed to identify
one.

- The exact bytes — the exact configured value — of Production
  `CATALOG_DELIVERY_RUN_KEY` as it stood at the time of the failed attempt
  were **NOT CAPTURED**. No transcript of that value before the correction
  exists in this record or in any local artifact.
- Whether leading or trailing whitespace in that configured value caused the
  mismatch is therefore **NOT ESTABLISHED / NOT CAPTURED**. Whitespace is one
  candidate cause among several — a different literal, a typo, a stale value
  from an earlier release, a variable scoped to the wrong environment — and
  this record selects none of them. It is neither asserted nor ruled out.
- What is recorded is the remedy and its effect: re-entering the exact
  intended literal and redeploying resolved the mismatch.
- The `return key` versus `return key.trim()` behavior of
  `catalogDeliveryRunKey()` (section 10) is consequently a DEFERRED HARDENING
  observation about future configurations, outside runtime acceptance. It is
  not offered as the diagnosis of this failure.

### The correction

| Fact | Value | Provenance |
|---|---|---|
| Production `CATALOG_DELIVERY_RUN_KEY` corrected to exactly | `w14e-weight-time-release1-staged-v1` | OPERATOR-SUPPLIED |
| corrective Production redeploys performed | exactly one | OPERATOR-SUPPLIED |

That literal is the run key this lifecycle was designed around. It appears
in `docs/weight-time-five-entry-lifecycle-manifest.json` as the derived
run key for this release (86953 B, sha256
`360379cce7975ef83a7349f29e4d818f36a8abf6c7a34c1f28023b62ba9529c9`), it is
35 characters, and it is NOT the forbidden historical key
`exlib2u-plank-release1-staged-v1`, which identifies the plank release and
is unique forever.

---

## 4. First initialization: baseline, then delivery

| Fact | Value | Provenance |
|---|---|---|
| a fresh Production account was created and completed onboarding | yes | OPERATOR-SUPPLIED |
| immediate pre-delivery persisted baseline | `exercise_rows=0`, `alias_rows=0`, `new_run_exercises=0`, `new_run_aliases=0` | INDEPENDENT READBACK |
| first successful delivery transaction created all 11 tenant rows at | `2026-09-14T15:25:02.898777Z` | INDEPENDENT READBACK |

The baseline matters more than it looks. A post-state of 8 exercises means
nothing on its own — it is consistent with a tenant that already had eight
rows and a delivery that did nothing. The measured `0/0/0/0` immediately
before delivery is what makes the post-state attributable to the delivery
transaction, and it is why the eleven rows are recorded as CREATED rather
than merely PRESENT.

No actual test-account identifier, email address, password or other
credential material appears in the CONTENTS of the four paths this round
changed. That is the exact scope the verifier proves: it scans the file
contents of all four paths — this record, its verifier, the endgame verifier
and the executable-package review bundle — with an email-shaped pattern, and
its own synthetic negative-control fixture is assembled from fragments at
runtime so that no email-shaped string exists in the verifier source either.
The scope is file contents only. It does not extend to Git author or
committer metadata, nor to any artifact assembled outside the repository
(for example an external review package or ZIP prepared for review).

### Post-first-initialization persisted state

| Measurement | Value | Provenance |
|---|---|---|
| tenant exercises | 8 | INDEPENDENT READBACK |
| tenant aliases | 3 | INDEPENDENT READBACK |
| successor-run exercises | 8 | INDEPENDENT READBACK |
| successor-run aliases | 3 | INDEPENDENT READBACK |
| distinct catalog logical IDs | 8 | INDEPENDENT READBACK |
| distinct catalog alias IDs | 3 | INDEPENDENT READBACK |

Eight rows carrying eight DISTINCT logical IDs is a stronger statement than
a count of eight: it forecloses a duplicate-delivery shape in which the
cardinality is right and the identity set is not. It is a statement about
CARDINALITY — six numbers. Those queries counted rows and counted distinct
identifiers; they did not enumerate WHICH identifiers were present. The
enumeration arrives later and separately, from the review-time readback
recorded under section 6.

---

## 5. What was delivered

The eight delivered exercises are the CUMULATIVE membership — the five
W14 additions are additive, not a replacement, and the three historical
identities were carried forward from the sealed historical run:

Plank, Dead bug, Ab wheel rollout, Plate-weighted plank, Weighted vest
plank, Weighted dead hang, Weighted wall sit, Weighted vest wall sit.

Provenance: the delivered membership is INDEPENDENT READBACK. The names and
identities are LOCAL BYTES — the historical trio is declared in
`docs/exlib2k-plank-catalog-load-package.sql` (29760 B, sha256
`a1b6dd55850c5d544e2f484d1ce4833b41deec7f3dd4d4c2373cb3b50daaccf0`) and the
five additions are governed by
`docs/weight-time-w14-admission-manifest.json` (16537 B, sha256
`8951f3cf6a808113b9a5d99f3e0c1f0db50e59ef953a55a539bb8b7c4cce4f49`).

### The five W14 additions, as observed

Each was observed with `tracking_mode` = `weight_time` and its approved
equipment mapping (INDEPENDENT READBACK). Each row below matches the
governing manifest byte for byte (LOCAL BYTES):

| Logical ID | Canonical name | tracking_mode | equipment |
|---|---|---|---|
| `e21b2c00-0000-4000-a000-000000000004` | Plate-weighted plank | `weight_time` | `weight_plate` |
| `e21b2c00-0000-4000-a000-000000000005` | Weighted vest plank | `weight_time` | `weighted_vest` |
| `e21b2c00-0000-4000-a000-000000000006` | Weighted dead hang | `weight_time` | `weight_plate` |
| `e21b2c00-0000-4000-a000-000000000007` | Weighted wall sit | `weight_time` | `weight_plate` |
| `e21b2c00-0000-4000-a000-000000000008` | Weighted vest wall sit | `weight_time` | `weighted_vest` |

### The three delivered aliases

| Alias | Resolves to | Logical ID of the target |
|---|---|---|
| Forearm plank | Plank | `e21b2c00-0000-4000-a000-000000000001` |
| Front plank | Plank | `e21b2c00-0000-4000-a000-000000000001` |
| Ab roller rollout | Ab wheel rollout | `e21b2c00-0000-4000-a000-000000000003` |

Provenance: delivery of these three rows is INDEPENDENT READBACK; the alias
strings and their targets are LOCAL BYTES, frozen in the lifecycle
manifest's carried-forward membership lines
(`alias#<logical_id>#<alias>`) before the run.

---

## 6. Controlled post-delivery refresh: the idempotency observation

| Fact | Value | Provenance |
|---|---|---|
| `/workouts` refreshed for the controlled post-delivery refresh | exactly once | OPERATOR-SUPPLIED |
| Vercel observed that controlled `/workouts` request at | `2026-09-14T15:32:35Z`, HTTP 200 | OPERATOR-SUPPLIED |
| persisted state after the controlled later initialization | 8 exercises / 3 aliases / 8 distinct logical IDs / 3 distinct alias IDs | INDEPENDENT READBACK |
| tenant catalog rows carrying a creation timestamp later than the delivery transaction | none | INDEPENDENT READBACK |
| `/workouts` runtime errors observed after the controlled later initialization | none | OPERATOR-SUPPLIED |

**Terminology, deliberately not an ordinal.** This is recorded as a
CONTROLLED POST-DELIVERY REFRESH — a controlled later initialization — and
NOT as "the second initialization". The ordinal invocation count is NOT
ESTABLISHED: Production logs around the first successful delivery contained
multiple `/workouts` requests before the tenant rows were committed, so how
many times initialization had already run by then is unknown. What is
supported is that the operator refreshed `/workouts` exactly once for this
controlled idempotency check, that Vercel observed that request at
`2026-09-14T15:32:35Z` with HTTP 200, and that persisted tenant state was
unchanged afterward. The acceptance condition needs a LATER initialization
to create nothing; it does not need that initialization to have been
invocation number two.

**How the idempotency proof actually works, and where it stops.** The
successful RPC response was NOT captured (section 8). The idempotency
conclusion therefore does not rest on any returned counter. It rests on
PERSISTED STATE, twice measured: the cardinality was unchanged at 8/3, and
the DISTINCT IDENTITY SETS were unchanged at 8 logical IDs and 3 alias IDs.
Cardinality alone would permit a delete-and-reinsert shape; unchanged
distinct identities alongside unchanged cardinality, with no new rows
created, is the property that was wanted.

What that immediate post-refresh readback established, precisely, is six
numbers plus one absence: 8 exercise rows, 3 alias rows, 8 distinct catalog
logical IDs, 3 distinct catalog alias IDs, and no tenant catalog row carrying
a creation timestamp later than the delivery transaction. It did NOT
enumerate the identity sets themselves; that query counted distinct values,
it did not list them.

### Review-time readback — separate, later, and NOT the original query

After commit `66548fd` was presented for review, a further READ-ONLY
Production review readback was performed on the operator path and its results
supplied for the record. It is a distinct observation with its own timing, and
it is recorded as REVIEW-TIME READBACK (an INDEPENDENT READBACK supplied
through the operator path; never observed by Claude). It must not be read as
the immediate post-refresh query above.

| Measurement | Value | Provenance |
|---|---|---|
| successor run key | `w14e-weight-time-release1-staged-v1` | REVIEW-TIME READBACK |
| rows still present | exactly 8 exercise rows and 3 alias rows | REVIEW-TIME READBACK |
| creation timestamp on all 11 rows | `created_at = 2026-09-14T15:25:02.898777Z` | REVIEW-TIME READBACK |
| import run id on all 11 rows | `29fa5437-7e5b-4241-ad82-58b5851ffe95` | REVIEW-TIME READBACK |

Exercise logical IDs remain exactly the eight:

- `e21b2c00-0000-4000-a000-000000000001`
- `e21b2c00-0000-4000-a000-000000000002`
- `e21b2c00-0000-4000-a000-000000000003`
- `e21b2c00-0000-4000-a000-000000000004`
- `e21b2c00-0000-4000-a000-000000000005`
- `e21b2c00-0000-4000-a000-000000000006`
- `e21b2c00-0000-4000-a000-000000000007`
- `e21b2c00-0000-4000-a000-000000000008`

Aliases remain exactly the three:

| Alias | Catalog alias id |
|---|---|
| `Ab roller rollout` | `57c46595-38c5-435f-b6de-dd5092cf1b8a` |
| `Forearm plank` | `af7df99a-77af-42bc-96a7-dbdc56992f52` |
| `Front plank` | `fcb74ce1-b74f-453e-a7e5-ed39e6ee16d1` |

This enumeration CORROBORATES the persisted idempotency conclusion: the
identities that were only counted at the time are, later, exactly the eight
and the three the frozen membership requires, all still stamped with the
single delivery transaction's timestamp and one import run id. It is
corroboration of a conclusion already carried by the earlier readback, not
the readback that carried it, and not a re-run of anything.

**What HTTP 200 does not prove.** `/workouts` returns 200 whether delivery
succeeds or fails closed. The fail-closed path in
`src/lib/supabase/deliver-catalog.ts` logs to `console.error` and RETURNS an
outcome — it does not throw, and it does not change the response status.
That is exactly why the first attempt's failure was visible in logs and not
as an error page. So the controlled request's 200 establishes that the
request completed and rendered; it does not by itself establish that the RPC
succeeded. The persisted-state readback is what carries the idempotency
claim, and the absence of runtime errors is corroboration, not the proof.

---

## 7. W14-E production runtime acceptance

The runtime acceptance condition is MET, on these three legs and nothing
else:

1. The delivery path FAILED CLOSED on a wrong run key, inserting zero rows
   and never falling back to the seed path.
2. After the configuration correction, the first initialization created
   exactly the frozen expected membership — 11 tenant rows, 8 exercises
   with 8 distinct logical IDs and 3 aliases with 3 distinct alias IDs —
   from a measured `0/0/0/0` baseline.
3. A controlled later initialization created nothing: same cardinality, same
   distinct identities, no row with a later creation timestamp, no runtime
   errors. This leg requires a LATER initialization to create nothing; it
   does not require, and this record does not claim, that it was the literal
   second invocation of initialization.

The deferred hardening observation in section 10 is explicitly NOT part of
this acceptance condition and did not gate it.

---

## 8. NOT CAPTURED — stated so its absence cannot be misread

The successful delivery RPC's own response was NOT CAPTURED. Consequently
this record does NOT claim a directly observed value for any of:

- `skipped_already_delivered`
- `alias_already_delivered`
- the complete returned delivery-summary JSON

Nothing in this document should be read as reporting those values. Where
idempotency is asserted, it is asserted from persisted-state cardinality
and distinct identities, per section 6.

Two further values are NOT CAPTURED and are named here so no later reading
can quietly supply them:

- The exact configured value of Production `CATALOG_DELIVERY_RUN_KEY` at the
  time of the failed attempt. Whether whitespace caused that mismatch is NOT
  ESTABLISHED (section 3).
- The ordinal invocation count of initialization. Multiple `/workouts`
  requests appear in Production logs around the first successful delivery,
  before the tenant rows were committed, so the controlled refresh at
  `2026-09-14T15:32:35Z` is not claimed to be invocation number two
  (section 6).

Two further limits, recorded so the boundary of this evidence stays
visible:

- Claude never observed an authenticated Production session. The only
  Production browser evidence Claude gathered in this round ended at a
  FAILED password grant on `/login` — three HTTP 400 responses from the
  auth token endpoint — before the operator path resolved authentication.
  That observation says nothing about the later successful run and is not
  evidence for or against any figure above.
- The hosted figures were not verified by Claude and were not re-read here.
  They are the operator path's observations, recorded as supplied.

---

## 9. What the agreement between hosted figures and local bytes establishes

The independently read hosted numbers match numbers that were frozen in
these local bytes BEFORE the run:

- `docs/weight-time-five-entry-lifecycle-manifest.json` pins the expected
  membership as `exercise_members` 8, `alias_members` 3, `total_items` 11,
  with all eleven expected member lines enumerated.
- `docs/weight-time-five-entry-packages/07-run-seal.sql` (53951 B, sha256
  `2b8457a21d06831da7e46f2457600d8d799ad14eb4b95be323282c02862dfc25`)
  REFUSES and rolls back unless the seal-shape counts are exactly 8
  exercise members and 3 alias members.
- `docs/weight-time-five-entry-packages/06-run-staging.sql` (49847 B,
  sha256
  `d6a054f2c6c17d5640285a8842ead2948739898756e40d0b146f8c7d38ad71c0`)
  stages the run under the same key and carries forward the historical
  run's own membership rows rather than retyping identifiers.

This agreement is CORROBORATION. It shows the hosted result has the shape
the reviewed design requires, and it would have surfaced a mismatch loudly.
It is NOT proof that the hosted stages executed these exact bytes, and this
record does not claim that. Byte-level proof of what ran hosted would
require hosted contact, which did not occur.

Migration 029 is recorded hosted as
`20260912181551_exlib_plank_cross_run_idempotency_029`, supplied as APPLIED
by the operator path (OPERATOR-SUPPLIED; never read by Claude). Its local
counterpart `supabase/migrations/029_exlib_plank_cross_run_idempotency.sql`
(9102 B, sha256
`23bbd3aa187cb2e2c54c1ad22790d00e962738a5afe6317c5f96bdf07058abfc`) still
carries the frozen header label `STATUS: PREPARED — NOT APPLIED`. That
label is an ARTIFACT LABEL describing the file as reviewed, not a statement
of current hosted world state, and it is deliberately left unedited: the
reviewed bytes are not rewritten to flatter a later round. Migration 029
replaces exactly one function, the shared verified-idempotency helper
`exlib_plank_link_valid`; the delivery function body live hosted is
migration 028's, which is why section 3's failure text is bound to 028.

---

## 10. Deferred hardening observation — NOT part of acceptance

`catalogDeliveryRunKey()` in `src/lib/supabase/deliver-catalog.ts`
currently validates `key.trim()` for emptiness but returns the UNTRIMMED
original string:

```ts
export function catalogDeliveryRunKey(): string | null {
  const key = process.env.CATALOG_DELIVERY_RUN_KEY
  if (typeof key !== "string" || key.trim().length === 0) return null
  return key
}
```

A configured value carrying leading or trailing whitespace would therefore
pass the emptiness check and be sent to the RPC verbatim, where it could not
match the sealed run key and would produce a failure of exactly the section 3
shape — one whose origin is invisible in the message text. That is a statement
about the mechanism, not a claim about what happened in this run (section 3).
A future maintenance change should return `key.trim()`.

This is DEFERRED HARDENING, and its relationship to the section 3 failure is
UNRESOLVED, not settled in either direction: the initially configured value
was not captured, so this record neither asserts nor denies that whitespace
caused that mismatch (section 3). It is NOT part of the W14-E runtime
acceptance condition in section 7, and it requires its own instruction: no application code was modified in the round
that produced this record. The verifier asserts that the untrimmed return
is still what the bytes say, so that if the hardening lands, this section
must be corrected forward rather than left stale.

---

## 11. Rules that survive this record

- **DO NOT RERUN the lifecycle packages.** The run
  `w14e-weight-time-release1-staged-v1` is sealed, and the seal is one-use
  and irreversible.
- **READ STATE FIRST.** Any future ambiguity about hosted state is resolved
  by reading hosted state through the operator path, never by re-running a
  package to see what happens.
- **Hosted acts stay on the operator path.** Nothing in this record
  authorizes hosted contact, and it was written without any.
- **This record is local-only.** It is not pushed, not tagged, not
  published. Publication is a separate authorization.
- The static verifier for this record is
  `scripts/verify-weight-time-w14e-production-runtime-record.ts`. It reads
  bytes and git objects only, spawns no command but `git`, and re-derives
  every TREE-DERIVABLE value above — sizes, digests, blob identities, the
  frozen membership, the derived run key — from the tree on every run.
  Operator-supplied values (the deployment id, the timestamps, the hosted
  readback figures) are pinned as literals so transcription drift is caught,
  but a git-only verifier cannot independently confirm them and does not
  claim to.

---

## 12. This round's own change surface — four paths, and why it is not two

Writing this record touched **four paths**, not two. LOCAL BYTES throughout;
no application code, no migration, nothing under `src/` or `supabase/`.

| Path | Why it changed |
| --- | --- |
| `docs/weight-time-w14e-production-runtime-evidence-record.md` | this record — added |
| `scripts/verify-weight-time-w14e-production-runtime-record.ts` | its static verifier — added |
| `scripts/verify-weight-time-five-entry-endgame.ts` | its B6 change-surface census measures the whole worktree from the production base, so **any** new file turns it red |
| `docs/weight-time-five-entry-executable-package-review-bundle.md` | its change-surface row asserted that every successor stays inside the frozen 20-path set, which this round makes false |

The last two are consequences of adding an artifact at all, and both were
handled in the open rather than quietly:

- **The endgame census was widened BY NAME**, admitting exactly these two
  runtime-evidence paths and nothing else. **Nothing was removed** — the diff
  against the parent commit is pure addition, so no pre-existing allowlist
  entry was dropped and the census is no weaker than it was. The alternative
  was to leave B6 red, which is worse: a genuinely stray path would then hide
  inside an already-failing check. The widening carries its reasoning as a
  labelled comment at the exact lines that had to change.
- **The review bundle's row was corrected forward.** Its claim was derived,
  not observed, and it stopped being true the moment this round added a path.
  The corrected invariant is not that the set never grows, but that it only
  ever grows by named paths B6 enforces against its allowlist on every run —
  still with zero paths under `src/`. No commit or tree identity in the bundle
  was touched; the set of 40-hex object names in it is unchanged.

This record's verifier pins all of it: the four-path surface, the additions-only
endgame diff, the unchanged object-name set in the bundle, and that the endgame
allowlist really does name both new paths.
