# weight_time five-entry endgame: local preparation report (W14-E)

STATUS: LOCAL PREPARATION COMPLETE. CORRECTED ONCE AFTER INDEPENDENT REVIEW (section 12). FROZEN FOR A
DELTA REVIEW. NOTHING HOSTED WAS TOUCHED.

> **Correction round C1 (2026-09-12).** Sections 1 to 11 below are the original W14-E report, kept as
> history. Where they describe a five-only delivery run (section 3 items I and J, section 6's stage-6
> vector, section 7, section 9's figures) they are SUPERSEDED by section 12, which records the
> cumulative run required by review finding R-E1, the content corrections, the new artifact tip and
> its re-measured gates, and the new blocking finding **F-E8**.

Every figure in this report is attributed to the named commit it was measured at. A report cannot
state its own hash or the tip it will be committed into, so the **final candidate tip, the SHA-256 of
this file, and the re-measured gates at that tip live in the package manifest**
`forgefit-weight-time-five-entry-endgame-manifest.txt`, generated last, outside the repository.

## 1. Boundary statement

- NO hosted Supabase contact. NO Supabase CLI invocation, for any subcommand. NO Vercel contact.
- NO push. NO tag. NO amend, rebase, squash or merge: plain forward commits only.
- NO human approval given, inferred or prefilled. Every human decision leaf in the three forms is null.
- NO production review, admission, publication or delivery performed. The only executions of any
  package were on disposable local PostgreSQL clusters, under synthetic decisions marked TEST-ONLY
  that the generator refuses to write into the repository.
- Migration 028 is byte-frozen (37,162 B, sha256 `9b7d3a52…`). No migration 029 exists or is
  authorized. Zero paths under `src/` or `supabase/` changed. The deferred F2-family maintenance sites
  were not touched. The frozen W14-P verifier and the W14 closeout verifier are byte-identical.

## 2. Base and candidate

| | commit | tree |
| --- | --- | --- |
| production base = published `origin/main` | `54a9d128bca659ec89d3ae149d47450e74a2ad2e` | `0b438079693867fd1757cec383a2bc986b1c905c` |
| artifact tip (every figure below measured here) | `6a79460a5ab64b3c7d1ebc4eea5112e6b209687c` | `c3e5b48b92c6bd9abb9395337d03ab7840d7ce4d` |
| final candidate tip (this report added) | see the package manifest | see the package manifest |

Chain above the base at the artifact tip, oldest first, each with exactly one parent, zero merges:

1. `fa27291864a66e8098f3319a7662cf2d3454b91b` discovery matrix, blank forms, content carrier, dependency document
2. `d74722fc9ce4e5ba51a79a434c285ba9e2f40915` lifecycle manifest, package generator, seven templates, human review page, probe, runbook
3. `6a79460a5ab64b3c7d1ebc4eea5112e6b209687c` static and disposable-PostgreSQL verifiers

Changed paths base to artifact tip: 21 additions, nothing else. Branch `feature/weight-time`, unpublished.

## 3. What the preparation contains (the bootstrap's items A to N)

| Item | Deliverable |
| --- | --- |
| A deterministic lifecycle manifest | `docs/weight-time-five-entry-lifecycle-manifest.json`, regenerated from the corrected carrier (content ids …0104 to …0108); `--check` byte-exact |
| B deterministic post-human-decision generator | `scripts/generate-weight-time-five-entry-packages.ts`: from COMPLETED forms it renders the executable packages and precomputes the admission fingerprints; from BLANK forms it renders non-executable templates; `--check` byte-exact |
| C snapshot-review package | `docs/weight-time-five-entry-packages/01-snapshot-review.sql` (family A; direct owner UPDATE ×5, no controlled function exists) |
| D content-draft load package | `02-content-draft-load.sql` (loader authority, five predeclared content ids) |
| E content-review package | `03-content-review.sql` (family B; `apply_content_review` ×5) |
| F content-admission package | `04-content-admission.sql` (`admit_catalog_content` ×5 with the carrier digest; fingerprints pinned) |
| G content-publication package | `05-content-publication.sql` (`publish_catalog_content` ×5; retired NULL, projected 0) |
| H relationship projection package | not required: publication swaps the projection atomically and every expected set is empty; the relationships table does not change |
| I run creation/membership package | `06-run-staging.sql` (family C; direct owner INSERTs, no controlled function exists; exactly five exercise members) |
| J run readiness/seal package | `07-run-seal.sql` (`exlib_approve_and_seal_run`, one call, one-use, irreversible) |
| K future Vercel run-key instructions | `docs/weight-time-five-entry-operator-runbook.md` section 6 and `docs/weight-time-five-entry-delivery-configuration-dependency.md`; the change IS required and was NOT performed |
| L tenant delivery instructions | runbook section 7; delivery proven locally for a fixture user |
| M ambiguity / READ STATE FIRST | `docs/weight-time-five-entry-read-state.sql` (READ ONLY probe) and runbook sections 2 and 3 |
| N spent/replay per transition | runbook section 4; proven live for all seven stages |
| Human review page | `docs/weight-time-five-entry-human-review.md` (generated; all five exercises, every field, every decision, eight reviewer questions) |
| Verifiers | `scripts/verify-weight-time-five-entry-endgame.ts` (static) and `scripts/verify-weight-time-five-entry-endgame-live.sh` (disposable PostgreSQL) |

## 4. The five

| line | canonical name | logical id | content id (v1) | content payload fingerprint |
| --- | --- | --- | --- | --- |
| 132 | Plate-weighted plank | `…0004` | `…0104` | `7008e7faa08908d3aad56a76ab9dd600a47cd0b098b409b57ed54798ac362bb0` |
| 133 | Weighted vest plank | `…0005` | `…0105` | `9ca1a52048ed2f8d3ab51453c6684a1dfb5007541101edecea1c6dc458009694` |
| 137 | Weighted dead hang | `…0006` | `…0106` | `6bb9d0783c669fdf36a86229fcdbe3b9c34c4093fbb1ee1870872d80bc074fea` |
| 138 | Weighted wall sit | `…0007` | `…0107` | `e7c49468df9de0c5c6ab26b0acfc1a20256a167a928d2da8ce7cb059213e1c39` |
| 139 | Weighted vest wall sit | `…0008` | `…0108` | `98ffeb222d2514a8c338ba85bae4cbb9b67769a0760261a756c1d399647573cd` |

All ids share the prefix `e21b2c00-0000-4000-a000-0000000`. Carrier `docs/weight-time-five-entry-content.jsonl`:
12,870 B, sha256 `fb13ea5283e7ab13953471bb323e8fe9df9ce707e718751c477495068fea2921` (recomputed locally; this is
the `admitted_source_sha256` every admission call records). The three carries (134, 135, 136) appear
nowhere except in exclusion assertions.

## 5. The human decisions still required (all blank)

| Family | Form | Leaves |
| --- | --- | --- |
| A snapshot review | `docs/weight-time-five-entry-snapshot-review-form.json` | per identity ×5: `decision` (APPROVE / REJECT / CORRECT), `reviewer`, `reviewer_role_or_credential`, `reviewed_at` (with offset), `rationale`; optional `evidence` |
| B content review | `docs/weight-time-five-entry-content-review-form.json` | per identity ×5: `decision` (approved / revised / rejected), `reviewer`, `reviewer_role_or_credential`, `reviewed_at`, `rationale`, seven `needs_human_judgment_confirmations`; optional `evidence` |
| C run authority | `docs/weight-time-five-entry-run-authority-form.json` | once: `run_key_literal`, product approver + `product_approved_at`, legal approver + `legal_approved_at`, `approval_rationale`, `run_membership` (the one choice ALL_FIVE_WEIGHT_TIME_IDENTITIES) |

**Reviewer-role requirement, surfaced not resolved (RQ-4).** The database enforces only a non-blank
reviewer string. The promoted convention, inherited verbatim from the one content review this
repository has performed, requires family B to be completed by a **named human specialist, never AI**;
that review was performed by an external personal trainer, not by the operator. Families A and C were
decided by the operator for the plank release. Who completes family B is a decision to make before the
sitting. Timestamps must carry an explicit offset and at most millisecond precision (the admission
fingerprint binds the review instant as an epoch the generator reproduces exactly).

## 6. Exact future hosted package order

Seven packages, each ONE-USE, each preceded by the READ ONLY probe as its spent-check, each under its
own one-use instruction, executed only by Joseph/ChatGPT on ShredOS `ttybyljytiwntvorugcv`:

1. `01-snapshot-review.sql`, 2. `02-content-draft-load.sql`, 3. `03-content-review.sql`,
4. `04-content-admission.sql`, 5. `05-content-publication.sql`, 6. `06-run-staging.sql`,
7. `07-run-seal.sql`; then 8. the Vercel run-key repoint (operator act; see below).

Stages 3, 4, 5 and 7 are load-bearing separations enforced by the database. The eleven-term vector
moves `8/8/10/3/11/1/2/2/1/6/3` → `…/1/6/8` (stage 1) → `8/8/10/3/11/6/2/2/1/6/8` (stage 2) → unchanged
(3, 4, 5) → `8/8/10/3/11/6/2/2/2/11/8` (stage 6) → unchanged (7). The starting vector is
OPERATOR-SUPPLIED from the W14-C record; the disposable proof rebuilds it by replaying the nine spent
packages. Before the packages can run, the completed forms must be regenerated into executable
packages by the same generator, committed and independently reviewed.

## 7. Run key and the Vercel dependency

- Proposed NEW run key: `w14e-weight-time-release1-staged-v1`, derived segment for segment from the
  promoted `exlib2u-plank-release1-staged-v1` (a proposal; `run_key_literal` is blank).
- The historical key `exlib2u-plank-release1-staged-v1` MUST NOT be reused: refused by the generator,
  by stage 6's gate, and by the UNIQUE index.
- **A production configuration change IS required**: `src/lib/supabase/deliver-catalog.ts` reads one
  scalar run key and `run_key` is UNIQUE, so exactly one run is deliverable per deployment. Only
  `CATALOG_DELIVERY_RUN_KEY` changes; the enablement variable (fragments `CATALOG` + `_DELIVERY` +
  `_ENABLED`) stays `true`. Repointing DE-SELECTS the plank release for users who have not received it;
  the affected count is UNKNOWN until re-measured hosted. Claude did not and will not perform this.

## 8. Findings surfaced for the reviewer

- **F-E1 (adjudication needed, same class as the accepted F-1).** The frozen W14 closeout verifier
  `scripts/verify-weight-time-w14-closeout.ts` exits 1 at every descendant tip on exactly two checks,
  X5a and X5d, both change-surface allowlists of the W14-C surface. Its other 110 checks (every byte
  pin, ancestry and posture check) pass. It passes 112/0 at its own tip `54a9d128` in a detached
  worktree (`evidence/03b`). It was NOT modified, widened or retargeted. The frozen W14-P verifier
  behaves as F-1 predicted: 211/1 (B8) here, 212/0 at `361bca01` (`evidence/05`).
- **F-E2 (handled, disclosed).** `scripts/verify-exlib2t.ts` B1 runs a repository-wide census of the
  enablement variable's literal name and requires exactly four carriers. The prior session's dependency
  document carried the literal and would have broken that pin on commit. The EXLIB-3A fragment
  convention was applied instead; the static verifier's B13 keeps it so. No pin was retargeted.
- **F-E3 (capability, proven).** The discovery matrix said the admission fingerprint cannot be computed
  before the human decision. Correct, and after the decision it CAN: the generator reimplements
  migration 027's manifest v2 and pins each expected fingerprint in stages 4 and 5. The disposable proof
  reads the five fingerprints back from `exlib_content_admission_fingerprint` and they equal the pins
  (`E4.3`), and a perturbed pin is refused (`I12`).
- **F-E4 (scope limit stated plainly).** Publication is NOT a database precondition of delivery; a
  sealed run delivers regardless. The sequence enforces it: stage 6 refuses to stage a run whose content
  is not published, admitted and fingerprint-fresh (`H4`). Likewise a wrong carrier digest at admission
  commits (the database validates only its format) and is caught by stage 5's provenance pin (`J3`).
- **F-E5 (design correction during the build).** Instructional prose legitimately uses the verb
  "carry" (entry 137 does), so the "no carry" checks bind names and identities, never prose.
- **F-E6 (gate precedence, documented).** Several refusals fire at the vector gate before the more
  specific gate (a missing or extra member changes the item count first). The count-camouflaged swap
  variant (`I15b`) proves the membership gate is live on its own.
- **F-E7 (build cache).** The sanitized build's `.next/cache/.tsbuildinfo` lists every compiled
  source path, including the five-entry scripts, because `tsconfig.json` includes `**/*.ts`. It is
  TypeScript's incremental cache, not a served asset; the served-asset scan (`.next/static`,
  `.next/server`) shows zero five-entry mentions, zero hosted refs, zero hosted hosts.

## 9. Validation at the artifact tip `6a79460a`

| Gate | Result |
| --- | --- |
| static endgame verifier | 162 passed, 0 failed, exit 0 (32 negative controls, each rejected by its named assertion) |
| disposable-PostgreSQL endgame verifier | 151 passed, 0 failed, exit 0 (seven stages once each; delivery; replay ×7; order ×6; 19 variant controls; 3 ablations; probe NOT_APPLIED/APPLIED/MIXED; fixture guard; template non-executability) |
| W14 closeout verifier | 110/2 at this tip (X5a, X5d; F-E1); 112/0 at its own tip `54a9d128` |
| frozen W14-P verifier | 211/1 at this tip (B8; F-1 accepted); 212/0 at its own tip `361bca01` |
| full `scripts/verify-*.ts` matrix (118 scripts) | 116 exit 0; the 2 non-zero are the two frozen verifiers above; 8,169 checks passed, 3 failed (B8, X5a, X5d) |
| all 17 `scripts/verify-*-live.sh` suites (`LC_ALL=C`, W14P-C1 unchanged) | 17 exit 0; 1,557 checks passed, 0 failed |
| `npm run type-check` | exit 0 |
| `npm run lint` | exit 0; 0 errors; 124 warnings, all `@typescript-eslint/no-explicit-any`, none naming a five-entry path (unchanged from W14-C) |
| targeted ESLint on the three new TypeScript files | exit 0, 0 bytes of output (0 errors, 0 warnings) |
| sanitized production build (detached worktree, synthetic env) | exit 0; served assets: 0 five-entry mentions, 0 hosted refs, 0 real hosted hosts; placeholder URL in 19 files (positive control) |
| ancestry | base is ancestor; 3 commits; 0 merges; 0 commits with parent count ≠ 1; 0 tags on the chain; HEAD not an ancestor of `origin/main` (nothing pushed) |

The negative controls are listed by name in the two verifier transcripts (`evidence/01`, `evidence/02`).
The live proof additionally proves: exactly five identities; no carries; exact content payloads read
back and re-fingerprinted from the database; exact review-event behaviour (five trigger-appended
events, none from content review); exact run membership; the historical run byte-identical across all
seven stages and still deliverable; no unexpected tenant mutation; the expected five tenant delivery
effects and idempotent re-delivery; authority restored after every elevation; replay refused seven
times; atomic rollback with proven real work; READ STATE FIRST classifications.

## 10. What was deliberately not done

Hosted readback (not authorized). Supabase CLI (standing prohibition). Vercel (standing prohibition).
Push, tag (section 17 stop). Any edit to the F2/F2a/F2b/F3/F4 maintenance sites, to the frozen W14-P
verifier, to the W14 closeout verifier, or to any migration. Any human decision.

## 11. Next

1. One independent review of this package.
2. The three forms are completed by the right humans (RQ-4 decides who completes family B).
3. The same generator renders the executable packages; a new commit; a second independent review.
4. Seven one-use hosted acts, each with a spent-check first, by Joseph/ChatGPT only; then the separate
   Vercel run-key act. Claude performs none of them.

## 12. Correction round C1 (independent review of `9acd869f`)

Plain forward commits over the reviewed tip `9acd869f9ff875a0310bf42841339d0608228c70` (tree
`12161a985e993f2c0ce482a9294c2970f4f8c188`), which is an UNAMENDED ancestor of the correction tip:

1. `ac41ba7216abed900d54597b3620274fefce0022` content corrections, cumulative-run authority form, corrected documents
2. `2cdb010ca12387715c1f958c7f017c82c036f7fb` (tree `099c2267841cb59272e799ae3dfdd55cd9ba1e01`) cumulative stage 6/7, regenerated manifest and templates, probe, both verifiers

Every figure in this section was measured at `2cdb010c`. The final tip (this section's commit) and its
re-measured gates are in the correction package manifest
`~/Downloads/forgefit-weight-time-five-entry-endgame-c1/forgefit-weight-time-five-entry-endgame-manifest.txt`.
The prior package `~/Downloads/forgefit-weight-time-five-entry-endgame/` is unchanged historical evidence.

### 12.1 R-E1: the delivery run is now CUMULATIVE

The five-only run was rejected as a replacement of the plank release. Stage 6 now creates one run whose
membership is the SIX membership rows of the sealed historical run `exlib2u-plank-release1-staged-v1`
(3 exercise + 3 alias members) COPIED from that run's own rows, plus the five weight_time identities:
8 exercise + 3 alias = 11 rows. The six lines are DERIVED, not retyped: the manifest generator parses
them from the promoted `docs/exlib2u-staged-run-package.sql` (bound by bytes), the static verifier
parses them independently from the same package and requires agreement (M14, F6, T6.i, T7.h), and the
stage-6 package refuses unless the live historical run still resolves, through governed identity, to
exactly those six lines and is sealed, approved, non-dry and unrevoked. The historical run is never
mutated, revoked or edited; its row and its six membership rows are proven byte-identical after every
stage and after every delivery.

Vectors: stage 6 `8/8/10/3/11/6/2/2/1/6/8` -> `8/8/10/3/11/6/2/2/2/17/8`; stage 7 unchanged; the seal
returns `exercise_members 8, alias_members 3`. Family C's one offered membership choice is now
`CUMULATIVE_HISTORICAL_SIX_PLUS_FIVE_WEIGHT_TIME_IDENTITIES`; every decision leaf is still null.

### 12.2 Delivery, measured for three user histories (the database is the oracle)

| history | measured result |
| --- | --- |
| CASE A, fresh user with zero rows | eligible 8, inserted 8, alias_inserted 3, every other counter 0, `plank_disposition = delivered_canonical_timed_plank`; Plank timed/mobility with the catalog anatomy, the five weight_time/strength; a second and third delivery: skipped_already_delivered 8, alias_already_delivered 3, `already_valid_idempotent`; 8 exercises, 3 aliases, 10 anatomy rows (the catalog's own count) after three deliveries |
| CASE A2, legacy user with the pristine bodyweight Plank seed | migration 026's in-place correction: eligible 8, inserted 7 (accounting offset 1), `corrected_and_linked_pristine_seed`, alias_inserted 1, alias_added_to_existing 2; the seed row becomes timed/mobility linked to the Plank snapshot and the NEW run, anatomy replaced in place, one correction record |
| CASE B, user who received the plank release through the historical run | **REFUSED** (finding F-E8 below): `deliver_catalog_exercises: inconsistent prior Plank reconciliation requires separate investigation`; nothing changes for the user (the five are not added either); the refusal repeats identically; the user's historical delivery stays intact and idempotent under the historical key |

The historical run still delivers under its own key, and the delivery predicate matches exactly the two
sealed runs.

### 12.3 F-E8, a BLOCKING finding outside this round's authority

`exlib_plank_link_valid` (migration 026) validates an existing Plank link with STRICT run provenance:
`p_link.import_run_id = p_run_id`, the DELIVERING run. A Plank row delivered by the historical run
therefore never validates against the cumulative run, and the existing-link path raises rather than
skipping. Consequence, stated precisely: after a repoint of `CATALOG_DELIVERY_RUN_KEY` to the cumulative
run, every user who already received the plank release would fail exercise initialization on every
request (the application's fail-closed law), and none of them would receive the five. Fresh users and
pristine-seed users receive the cumulative release correctly. The number of affected users is UNKNOWN
until re-measured hosted.

CASE B as specified by the review ("exactly the five new exercises are added") therefore CANNOT be
satisfied by any package in this round. Resolving it needs a migration (a cross-run idempotency rule for
the Plank link) or an application change (for example delivering the historical key first for such
users); both are outside this round (no migration 029, no `src/` change). The proof pins the refusal so
the finding is mechanical, not narrative (live checks FC1 to FC5). **The Vercel repoint must not proceed
until F-E8 is adjudicated**; the runbook and the dependency document say so.

### 12.4 Content corrections (carrier now 13,155 B, sha256 `8fa1d3402a3ca9beef8b1cbb7ba58692bea0d28c11926d6db33da72877f2afdb`)

132 and 133: the half-unweighted-time heuristic is replaced by light-load / stable-position / gradual
progression; breathing cues are steady continuous breathing while keeping the brace, without
deterministic claims; partner placement and the no-neck / no-lower-back rule are kept. 137: the
dipping belt is the sole recommended loading method (the between-the-feet plate is removed from setup,
equipment and safety); the full-minute prerequisite becomes a stable, controlled unweighted hang. 138
and 139: standardized foot placement (shins roughly vertical at the target depth, whole foot planted)
replaces the knees-past-toes language, and the mistake cue becomes feet too close to the wall lightening
the heels. 139: the vest is described by hands-free / torso load distribution. `authored_at` is
2026-09-12 for all five; nothing is reviewed or approved.

| line | content payload fingerprint (C1) |
| --- | --- |
| 132 | `fb04c3e93b3dc09e0b64879c9fb9c6141f511a32fc0586119b4399259dee43a8` |
| 133 | `454c9158bb79a07bb203f336d147ce6b6efab1cd373c7fb463fe92f4654efe1f` |
| 137 | `0ab5a7048fc6a1619299281b9a200a9323c7793c91e89d6fea854b54a88e21a3` |
| 138 | `f3606f4aeef436e7c0b90fbc6585d6845bfb32024d47707eeb813138de018f98` |
| 139 | `552dc5810ff446ec219304e19adab0429f560323090fd3651ae57c0241362f45` |

Family B form version 2: confirmation keys renamed to match (132 load guidance, 137 dipping belt as the
sole loading method, 139 hands-free / torso distribution) and a foot-placement confirmation added for 138
and 139; the carrier digest is re-bound. Family B's reviewer-role question RQ-4 stands.

### 12.5 New negative controls (all named in the transcripts)

Live: missing historical exercise member, missing historical alias member, duplicate historical
membership, substituted historical member (count-camouflaged; refused by the unique index), only-the-five
membership, historical run mutation inside the package, historical run revocation inside the package
(the run stays unrevoked on the clone), wrong historical source key, wrong new key at the seal, sealing
over a five-only run (refused before sealing), direct edits/deletes/inserts on the historical run
(trigger-refused), and stage 6 over a revoked historical run (refused). Static: form and manifest
historical-six drift, five-only manifest membership, carry-forward INSERT removed or re-sourced, a
promoted historical line dropped from the gate, the five-only seal shape.

### 12.6 Validation at `2cdb010c`

| gate | result |
| --- | --- |
| static endgame verifier | 170/0, exit 0 |
| disposable-PostgreSQL endgame verifier | 180/0, exit 0 (three delivery histories; CASE B refusal measured) |
| W14 closeout verifier | 110/2 (X5a, X5d; F-E1 CLOSED AS DESIGNED by the review); 112/0 at its own tip |
| frozen W14-P verifier | 211/1 (B8; F-1 accepted); 212/0 at its own tip |
| full `verify-*.ts` matrix (118) | 116 exit 0; the 2 non-zero are the two frozen verifiers; 8,177 passed / 3 failed |
| all 17 `verify-*-live.sh` suites | 17 exit 0; 1,586 passed / 0 failed |
| type-check / lint / targeted ESLint | 0 / 0 errors, 124 pre-existing warnings, none naming five-entry / 0 bytes |
| sanitized production build | exit 0; served assets 0 five-entry, 0 hosted ref, 0 hosted host; placeholder in 19 files; the one cache mention is `.next/cache/.tsbuildinfo` (F-E7) |
| ancestry | base and `9acd869f` are ancestors; 0 merges; 0 commits with parent count ≠ 1; nothing pushed |

### 12.7 Unchanged

Snapshot-review mechanism, the migration-027 controlled functions, the seven-stage separation, READ STATE
FIRST, authority elevation and restoration, sealing semantics, migration 028 (byte-frozen; no 029), the
frozen W14-P and W14 closeout verifiers, F2/F2a/F2b/F3/F4, the carries. No `src/` change. No hosted
Supabase contact, no Supabase CLI, no Vercel contact, no push, no tag, no human decision.

## 13. F-E8 remediation: migration 029 (authorized after independent review of `4684874a`)

Plain forward commits over the C1 tip `4684874a1cb39c4bdaa82d64a1050efae4481d0e`, which is an
UNAMENDED ancestor of this section's commit; the production base `54a9d128` and the reviewed tip
`9acd869f` remain ancestors too:

1. `e527b8f` migration 029 and its two focused verifiers
2. `833ed54f3a5c36ace6f89590d10d33a2ae478f94` (tree `5cfe83a2c56d0331c313ccefa57c607ca9d5a452`) W14-E reintegration

Every figure in this section was measured at `833ed54f`. The final tip (this section's commit) and its
re-measured gates are in the remediation package manifest
`~/Downloads/forgefit-weight-time-five-entry-endgame-m029/forgefit-weight-time-five-entry-endgame-manifest.txt`.
The prior packages (`…-endgame/`, `…-endgame-c1/`) are unchanged historical evidence.

### 13.1 What 029 is

`supabase/migrations/029_exlib_plank_cross_run_idempotency.sql` (9,102 B, sha256
`23bbd3aa187cb2e2c54c1ad22790d00e962738a5afe6317c5f96bdf07058abfc`) is ONE transaction containing
exactly a `CREATE OR REPLACE FUNCTION exlib_plank_link_valid(...)` with the existing six-parameter
signature and a re-assertion of the internal-only EXECUTE posture. The body is migration 026's body with
ONE clause replaced (evidence `20-helper-before-after.diff`):

| | provenance clause |
| --- | --- |
| before (026) | `p_link.import_run_id = p_run_id` |
| after (029) | `import_run_id IS NOT NULL` AND (`= p_run_id` OR EXISTS a run `pr` with `pr.id = import_run_id`, `approved_for_delivery = true`, `dry_run = false`, `sealed_at IS NOT NULL`, `revoked_at IS NULL`, joined to a `exercise_catalog_run_items` row with `catalog_id = p_cat_id`) |

Everything else is carried verbatim: ownership, `timed`, `mobility`, exact `catalog_id`, exact
`catalog_logical_id`, exact anatomy (with the same `FOR UPDATE` row lock), exact canonical or "(timed)"
name with its claim. The exact catalog snapshot is the compatibility boundary: a prior run that carries
only a different snapshot of the same logical identity does not qualify. Nothing is mutated. A NULL
`import_run_id` now returns FALSE explicitly; under 026 the comparison was SQL unknown and only the
caller's `IF` made it fail closed. `deliver_catalog_exercises` is not redefined: 028's body calls the
helper from the existing-link path and from the raced logical-index recovery path, and both gain the rule
through the helper (static C1 pins exactly two call sites passing `v_run.id`). Migrations 026, 027 and 028
are byte-identical; no `src/` change was needed, so none was made.

### 13.2 Delivery, re-measured with 029 (the database is the oracle)

| history | measured result |
| --- | --- |
| CASE A, fresh user | unchanged from C1: eligible 8, inserted 8, alias_inserted 3, `delivered_canonical_timed_plank`; 2nd/3rd delivery idempotent |
| CASE A2, pristine bodyweight Plank seed | unchanged from C1: 026's in-place correction, `corrected_and_linked_pristine_seed`; idempotent |
| CASE B, existing historical plank user, BEFORE 029 (clone) | still REFUSED: `inconsistent prior Plank reconciliation requires separate investigation` (FC1: the defect reproduced) |
| CASE B, the same user, WITH 029 | **eligible 8, inserted 5 (exactly the five), skipped_already_delivered 3, alias_already_delivered 3, `plank_disposition = already_valid_idempotent`**; the three historical exercise rows and three alias rows byte-identical with their HISTORICAL `import_run_id`; the historical anatomy rows byte-identical; no duplicate (one row per identity); the user grew by exactly five, all five carrying the NEW run id; 2nd and 3rd delivery: skipped 8 / alias_already 3 / inserted 0; the historical key still idempotent under its own name (FC2 to FC8) |
| CASE C, raced logical-index path | a REAL two-session race: a second session commits a prior-run 'Plank (timed)' row inside the delivery window (a fixture BEFORE INSERT trigger blocks on a transaction-scoped advisory lock the competitor holds until commit). With 029: the INSERT collides on the logical index, the raced branch locks the committed winner and the shared helper accepts it: eligible 8, inserted 7 (never Plank), skipped_already_delivered 1, aliases 1 inserted + 2 added to the existing Plank, `already_valid_idempotent`; the winner keeps its historical run id; the second delivery is idempotent (FE1, FE2, FE2b). The IDENTICAL race on the pre-029 clone raises the F-E8 refusal and rolls back completely (FE3, FE3b). A same-transaction trigger simulation was tried first and cannot work: the function's BEGIN/EXCEPTION block is a subtransaction whose rollback also undoes what a trigger inserted; the harness now validates the planted competitor against the helper directly (FE0b) so the race tests the path, not a malformed competitor |

Order: the harness applies 001 to 028, runs the seven stages on that exact hosted 028 world, and applies
029 once afterwards (E12: nothing in the catalog moves, the posture is unchanged). Section N applies 029
to the untouched pre-state FIRST and runs all seven stages to the same vector, historical run and
authority baseline: none of the seven packages calls the helper, so 029 is not a precondition of stages
1 to 7. It IS a strict precondition of stage 8 (the run-key repoint) and of any cumulative delivery. A
sabotaged 029 (a failing statement before COMMIT) exits non-zero and leaves the helper definition
byte-identical to 028's, with the F-E8 refusal still present (N4 to N6).

### 13.3 Negative controls (focused live verifier, direct helper matrix, all named)

Prior run nonexistent (in-memory composite; the FK forbids a stored row), unapproved, dry, unsealed,
revoked, unrelated-sealed-without-the-snapshot, different-snapshot-same-logical (a cloned catalog world
with a Plank v2), NULL run: all FALSE. Anatomy drift, `tracking_mode` drift, `exercise_type` drift,
`catalog_id` drift, `catalog_logical_id` drift, name-claim drift: all FALSE. Positive controls: current
run exact provenance TRUE (unchanged semantics), exact-snapshot prior run TRUE (the new rule). Through
`deliver_catalog_exercises`: the pre-029 refusal, the post-029 fix, idempotency. Static: 026 and 028
byte-pinned, 029 once and last, one transaction with exactly the two statements, signature and posture
unchanged, body equality with the clause removed, the new clause exactly once, no mutation, lock
discipline, two call sites, hosted-order statement.

### 13.4 Validation at `833ed54f`

| gate | result |
| --- | --- |
| focused 029 static verifier | 17/0, exit 0 |
| focused 029 disposable-PostgreSQL verifier | 48/0, exit 0 |
| static endgame verifier | 174/0, exit 0 (29 migrations, 029 byte-bound and the only `supabase/` change) |
| disposable-PostgreSQL endgame verifier | 202/0, exit 0 (CASE A, A2, B before and after 029, C raced; order independence; sabotage rollback) |
| manifest generator `--check` / package generator `--check` | 0 / 0 (byte-deterministic; C1 templates unchanged) |
| type-check / lint | 0 / 0 errors |
| full `verify-*.ts` matrix (119) | 64 exit 0; 55 non-zero; 8,137 passed / 64 failed |
| all 18 `verify-*-live.sh` suites | 6 exit 0; 12 non-zero; 1,542 passed / 14 failed |
| inventory-pin census of every failing check | 79 failing checks in 67 suites; **79 INVENTORY-GATE, 0 UNCLASSIFIED** |

The census (evidence `19-inventory-pin-census.txt`) classifies every one of the 79 failing checks by its
own text: "exactly 22 / 24 / 25 / 26 / 27 / 28 migrations", "no 023 / 025 / 026 / 028 / 029", the
W14-P B8 and W14 closeout X4b/X4c/X5a/X5c/X5d change-surface allowlists, or "nothing under
supabase/". Not one names a behavioural check. These are the same pre-existing inventory pins that
migration 028 tripped in W11 and W12-C, where they were retargeted under their own authorizations
(`MIGRATION_INVENTORY_RETARGET`); this round did NOT retarget any of them (STOP-and-report rule for
pre-existing verifiers). Two consequences to note: `verify-exlib2f-live.sh` exits at its fingerprint
gate before it boots a cluster, so its "Review 1: strict run-provenance invariant (different existing
run id)" check did not run at all; when its inventory pin is retargeted, that check will fail
SEMANTICALLY under 029 if its "different existing run" fixture is a sealed run carrying the Plank
snapshot, because that is now exactly the authorized behaviour. The frozen W14-P verifier's B8 (F-1) and
the W14 closeout verifier's X5a/X5d (F-E1) remain accepted as designed; neither was modified.

### 13.5 Unchanged

The five content payload fingerprints are exactly C1's (132 `fb04c3e9…`, 133 `454c9158…`, 137
`0ab5a704…`, 138 `f3606f4a…`, 139 `552dc581…`; carrier 13,155 B, sha256 `8fa1d340…`). The cumulative
membership is exactly C1's: the historical six carried forward plus the five, 8 exercise + 3 alias = 11;
stage 6 `8/8/10/3/11/6/2/2/1/6/8 -> 8/8/10/3/11/6/2/2/2/17/8`. The seven templates are byte-identical.
Every human decision leaf is still null. Snapshot review, the 027 controlled functions, the seven-stage
separation, READ STATE FIRST, authority elevation and restoration, sealing semantics, migrations
026/027/028, the frozen W14-P and W14 closeout verifiers, F2/F2a/F2b/F3/F4, the carries: untouched.

### 13.6 Hosted order, stated once

Stages 1 to 7 and migration 029 may be executed in either order relative to each other; 029 MUST read
`APPLIED` in the probe row `migration_029_plank_cross_run_idempotency` before the Vercel run-key repoint
(stage 8) and before any user receives the cumulative run. 029 is a one-use hosted act with its own
instruction and a spent-check first (READ STATE FIRST; `MIXED` is a STOP). Nothing hosted was touched by
this round: no hosted Supabase contact, no Supabase CLI, no Vercel contact, no push, no tag, no human
decision, no production review, publication or delivery; 029 was applied ONLY to disposable local
clusters destroyed on exit. The next authorization decision is the W11-style migration-inventory
retarget of the historical verifiers for 029.
