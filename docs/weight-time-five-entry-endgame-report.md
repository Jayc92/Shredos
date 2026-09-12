# weight_time five-entry endgame: local preparation report (W14-E)

STATUS: LOCAL PREPARATION COMPLETE. FROZEN FOR ONE INDEPENDENT REVIEW. NOTHING HOSTED WAS TOUCHED.

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
