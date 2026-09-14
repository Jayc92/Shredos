# W14-E executable-package review bundle (FROZEN, local only)

STATUS: the three governing human decision families are COMPLETE, the seven packages are EXECUTABLE and
UNRUN, and this bundle is the frozen local review record for them. It authorizes nothing. No hosted
lifecycle stage ran, no Vercel repoint happened, no tenant row was delivered, nothing was pushed or tagged.

This bundle is a review record, not a generated artifact: the machine values in section 2 were copied
by script out of the GENERATED `docs/weight-time-five-entry-human-decision-record.md`, which itself reads
them from the bytes it names. They were not retyped. Section 11 is the gate ledger, measured this round and
recorded with the exit code that produced each verdict.

## 1. Candidate identity

| Item | Value |
| --- | --- |
| final candidate SHA (every gate in section 3 was measured here) | `f14683ea7f86f515d8388ca6483d7fce938f5b57` |
| final candidate tree | `b69ac9427bebd77cea86ef6919434372288f7d27` |
| this bundle's own commit | the next plain-forward commit after `f14683e`, and a document cannot state its own SHA; that commit's ONLY change is this file, which `git show --stat` proves and the change-surface census (endgame static B6) admits by name |
| branch | `feature/weight-time` (local only, NOT pushed, NOT tagged) |
| required starting commit | `9bf9e6c861c226fd12b67e2dcd72dd7d4cdbafa8` (tree `c9ead021907af098a1467b6cc7bad7a2eabdcf79`) - confirmed ancestor |
| commits added over the required starting commit | 4 gated commits plus this freeze commit, plain forward only: `5f0255b` (forms), `8abf870` (generator + rendered packages + decision record), `8f6b46c` (static and live verification), `f14683e` (operator-facing status documents) |
| history operations used | none: no amend, no rebase, no squash, no merge, no push, no tag |
| change surface | 19 paths, all under `docs/weight-time-five-entry-*` and `scripts/*five-entry*`; 0 paths under `src/`; 0 paths under `supabase/` |

Migrations 026, 027, 028 and 029 are byte-identical to the pre-decision commit (blob ids
`96a8b070b77b`, `48722966736e`, `8a1964609cf9`, `8f96f3384daf`); 026, 027 and 028 are additionally
byte-identical to the published base `54a9d128`, and 029 does not exist at that base, which is why it is
the one migration this arc adds.

## 2. The recorded decisions, copied verbatim from the generated decision record

Every table below was extracted by script from `docs/weight-time-five-entry-human-decision-record.md` at the
final candidate commit. Nothing in it was retyped, and any drift between this bundle and that record is a
STOP.

### Governing decision timestamp

- `2026-09-13T18:25:13-04:00` - carried by every family A decision, every family B decision, and both family C approvals

### The three completed forms, bound by bytes

| Family | Form | Bytes | sha256 |
| --- | --- | --- | --- |
| A | `docs/weight-time-five-entry-snapshot-review-form.json` | 11203 | `599032a870d0bc663d3b5193b9038caa5a7c2f3b05f8cdd73961255c871ee22e` |
| B | `docs/weight-time-five-entry-content-review-form.json` | 12387 | `9e5e4087c5124295b98eca7b47edbfb371ef7095dd4045d491d39e336cb50420` |
| C | `docs/weight-time-five-entry-run-authority-form.json` | 10684 | `13e7b43e2af7f1e70ce306bdfd968fc825bc80a9a89ea2ae5a130dc15ac4c12f` |

### Family A - snapshot review, one decision per identity

| Line | Identity | decision | reviewer | credential | reviewed_at | evidence |
| --- | --- | --- | --- | --- | --- | --- |
| 132 | `e21b2c00-0000-4000-a000-000000000004` | APPROVE | Joseph Carfagno | ForgeFitOS operator | 2026-09-13T18:25:13-04:00 | (null - optional) |
| 133 | `e21b2c00-0000-4000-a000-000000000005` | APPROVE | Joseph Carfagno | ForgeFitOS operator | 2026-09-13T18:25:13-04:00 | (null - optional) |
| 137 | `e21b2c00-0000-4000-a000-000000000006` | APPROVE | Joseph Carfagno | ForgeFitOS operator | 2026-09-13T18:25:13-04:00 | (null - optional) |
| 138 | `e21b2c00-0000-4000-a000-000000000007` | APPROVE | Joseph Carfagno | ForgeFitOS operator | 2026-09-13T18:25:13-04:00 | (null - optional) |
| 139 | `e21b2c00-0000-4000-a000-000000000008` | APPROVE | Joseph Carfagno | ForgeFitOS operator | 2026-09-13T18:25:13-04:00 | (null - optional) |

Rationale, identical for all five: "I approve all five catalog snapshots as accurate for release."

### Family B - content review, one decision per identity

| Line | Content id | decision | reviewer | credential | reviewed_at | judgment confirmations |
| --- | --- | --- | --- | --- | --- | --- |
| 132 | `e21b2c00-0000-4000-a000-000000000104` | approved | Nick Tkacz | Physical Trainer | 2026-09-13T18:25:13-04:00 | 7 keys, ALL true |
| 133 | `e21b2c00-0000-4000-a000-000000000105` | approved | Nick Tkacz | Physical Trainer | 2026-09-13T18:25:13-04:00 | 7 keys, ALL true |
| 137 | `e21b2c00-0000-4000-a000-000000000106` | approved | Nick Tkacz | Physical Trainer | 2026-09-13T18:25:13-04:00 | 7 keys, ALL true |
| 138 | `e21b2c00-0000-4000-a000-000000000107` | approved | Nick Tkacz | Physical Trainer | 2026-09-13T18:25:13-04:00 | 8 keys, ALL true |
| 139 | `e21b2c00-0000-4000-a000-000000000108` | approved | Nick Tkacz | Physical Trainer | 2026-09-13T18:25:13-04:00 | 8 keys, ALL true |

Rationale, identical for all five: "I, Nick Tkacz, Physical Trainer, reviewed all five exercises. I approve all five as written and confirm all listed judgment items for each exercise."

The database stores a reviewer STRING, not a credential column (migration 027 `apply_content_review` takes
six arguments and no role). The credential above is recorded in the form and in this record; the packages
pass the reviewer string, which is what the admission fingerprint then binds.

### Family C - delivery run authority, once for the run

| Leaf | Recorded value |
| --- | --- |
| run_key_literal | `w14e-weight-time-release1-staged-v1` |
| product approver | Joseph Carfagno at 2026-09-13T18:25:13-04:00 |
| legal approver | Joseph Carfagno at 2026-09-13T18:25:13-04:00 |
| run_membership | `CUMULATIVE_HISTORICAL_SIX_PLUS_FIVE_WEIGHT_TIME_IDENTITIES` |
| forbidden run key (never written) | `exlib2u-plank-release1-staged-v1` |

approval_rationale, verbatim: "I approve `w14e-weight-time-release1-staged-v1` with the cumulative historical six plus five weight_time membership because it preserves the existing release while adding the five reviewed exercises; this approval does not itself enable production delivery."

### The five content payload fingerprints - UNCHANGED by these decisions

| Line | Content payload fingerprint (sha256) |
| --- | --- |
| 132 | `fb04c3e93b3dc09e0b64879c9fb9c6141f511a32fc0586119b4399259dee43a8` |
| 133 | `454c9158bb79a07bb203f336d147ce6b6efab1cd373c7fb463fe92f4654efe1f` |
| 137 | `0ab5a7048fc6a1619299281b9a200a9323c7793c91e89d6fea854b54a88e21a3` |
| 138 | `f3606f4aeef436e7c0b90fbc6585d6845bfb32024d47707eeb813138de018f98` |
| 139 | `552dc5810ff446ec219304e19adab0429f560323090fd3651ae57c0241362f45` |

Carrier bound by the content form and the manifest: `8fa1d3402a3ca9beef8b1cbb7ba58692bea0d28c11926d6db33da72877f2afdb`.

### The five admission fingerprints, DERIVED from the family B tuple

Each is sha256 over migration 027's `exlib_content_admission_manifest` v2 canonical form, whose `review`
line is `approved`, the family B reviewer, the reviewed_at epoch and the rationale. Change any of those and
every fingerprint below changes; the database recomputes it at stage 4 and the packages pin it.

| Line | Admission fingerprint (sha256) |
| --- | --- |
| 132 | `9cbc10c9284f3e23f1123b647f17ee6bc05e8e452f5aa821b9a99256c9ddae7c` |
| 133 | `bb705be0318c34b7fd2ecd51039a665ad087be8f69fc227cf44a53ddbb06f1a5` |
| 137 | `e10369c291030ed61ddc48eda0c5c8759e0f3a7c68229a19a9b7c09792fe2008` |
| 138 | `05ca70e920ac098f291c9928210f724ba15044bab7fac588591026b3d9d2b932` |
| 139 | `8a7a94b2ede86cae694cde02fa5652154204a2093562f45c54778d0c2ff68c65` |

### The seven EXECUTABLE packages rendered from these decisions

| Stage | File | Bytes | sha256 |
| --- | --- | --- | --- |
| 1 | `docs/weight-time-five-entry-packages/01-snapshot-review.sql` | 47849 | `666a0933f16ee004e7abe0885e4a0cc4969dfbcbf3b326463a4707f7f58bd9ba` |
| 2 | `docs/weight-time-five-entry-packages/02-content-draft-load.sql` | 74583 | `4257c8486ea447797146506a6d39f5f3b59b94f9f37840b7081cc0467c07d4f4` |
| 3 | `docs/weight-time-five-entry-packages/03-content-review.sql` | 65438 | `79a7497c70fc84c79a5956c94bad49d4b43fd44ad2c88bf9f40ca6b065e8c2f3` |
| 4 | `docs/weight-time-five-entry-packages/04-content-admission.sql` | 80641 | `13250d1fd3615d8ff9545ef691cfc68bddf94a3c801bddb314af6ad520308bb7` |
| 5 | `docs/weight-time-five-entry-packages/05-content-publication.sql` | 74416 | `418a046b92f6baa466aa65bad75b0ea4a650b33deeeab4f35fcfaea4225ec9e0` |
| 6 | `docs/weight-time-five-entry-packages/06-run-staging.sql` | 49847 | `d6a054f2c6c17d5640285a8842ead2948739898756e40d0b146f8c7d38ad71c0` |
| 7 | `docs/weight-time-five-entry-packages/07-run-seal.sql` | 53951 | `2b8457a21d06831da7e46f2457600d8d799ad14eb4b95be323282c02862dfc25` |

Every one is UNRUN. Each carries its own pre-state and post-state vector gate, is one-use, and is executed
by the operator path only - never by Claude, and never twice.

### Cumulative run membership

- 8 exercise members + 3 alias members = 11 membership rows
- carried forward from the sealed historical run `exlib2u-plank-release1-staged-v1` (its own six rows, COPIED by id, never retyped):
  - `alias#e21b2c00-0000-4000-a000-000000000001#Forearm plank`
  - `alias#e21b2c00-0000-4000-a000-000000000001#Front plank`
  - `alias#e21b2c00-0000-4000-a000-000000000003#Ab roller rollout`
  - `exercise#e21b2c00-0000-4000-a000-000000000001`
  - `exercise#e21b2c00-0000-4000-a000-000000000002`
  - `exercise#e21b2c00-0000-4000-a000-000000000003`
- added by this release, the five reviewed identities:
  - `exercise#e21b2c00-0000-4000-a000-000000000004` (line 132, Plate-weighted plank)
  - `exercise#e21b2c00-0000-4000-a000-000000000005` (line 133, Weighted vest plank)
  - `exercise#e21b2c00-0000-4000-a000-000000000006` (line 137, Weighted dead hang)
  - `exercise#e21b2c00-0000-4000-a000-000000000007` (line 138, Weighted wall sit)
  - `exercise#e21b2c00-0000-4000-a000-000000000008` (line 139, Weighted vest wall sit)

### Migration 029 hosted status - OPERATOR-SUPPLIED

- status: APPLIED hosted (OPERATOR-SUPPLIED, never Claude-observed); also applied on every disposable local cluster by the two proofs that exercise it
- provenance: OPERATOR-SUPPLIED by the Joseph/ChatGPT operator path
- hosted migration record: `20260912181551_exlib_plank_cross_run_idempotency_029`
- post-apply read-state probe: `migration_029_plank_cross_run_idempotency = APPLIED`
- Claude observed hosted state: NO; Claude applied it: NO

This is the operator's fact, restated. Claude did not contact hosted Supabase in the round that produced
this record, and nothing here may be read as Claude-observed hosted state.

## 3. Gate ledger

Every verdict below was read from the process exit code, and every suite was run at the final candidate
commit `f14683e` on a clean worktree unless a row says otherwise.

### 3.1 Generators

| gate | exit | result |
| --- | --- | --- |
| `generate-weight-time-five-entry-packages.ts --check` | 0 | `PACKAGES CHECK OK  9 renderings byte-identical` (seven packages + the review page + the decision record) |
| `generate-weight-time-five-entry-manifest.ts --check` | 0 | `MANIFEST CHECK OK` - 86953 bytes, sha256 `360379cce7975ef83a7349f29e4d818f36a8abf6c7a34c1f28023b62ba9529c9` |

No generated SQL was hand-edited: `--check` re-renders from the forms and compares bytes.

### 3.2 Focused and endgame suites

| gate | exit | result |
| --- | --- | --- |
| `verify-weight-time-migration-029.ts` (static) | 0 | 17 passed, 0 failed |
| `verify-weight-time-migration-029-live.sh` | 0 | 48 passed, 0 failed |
| `verify-weight-time-five-entry-endgame.ts` (static) | 0 | **287 passed, 0 failed** (was 175/0 pre-decision; the added checks cover the resolved-form lifecycle, the executed blank-form regression, the PARTIAL-form refusal and the hosted-provenance labelling) |
| `verify-weight-time-five-entry-endgame-live.sh` | 0 | **231 passed, 0 failed** (was 202/0; the added section R is the REAL line) |

### 3.3 Full matrix

| gate | exit | result |
| --- | --- | --- |
| all non-frozen `verify-*.ts` (117 suites) | 117 x 0 | **7,990 passed, 0 failed** |
| all `verify-*-live.sh` suites (19 suites, disposable unix-socket Postgres) | 19 x 0 | **1,709 passed, 0 failed** |
| `verify-weight-time-w14.ts` (FROZEN) at this tip | 1 | 209/3: B2, B10 (029 exists / a file under `supabase/migrations/` is touched) and B8 (change surface) - the same three, by ID, as the pre-decision round |
| `verify-weight-time-w14.ts` (FROZEN) at its own tip `361bca01` | 0 | 212 passed, 0 failed |
| `verify-weight-time-w14-closeout.ts` (FROZEN) at this tip | 1 | 106/6: X4b, X4c, X5a, X5c, X5d, X5e - the same six, by ID, as the pre-decision round |
| `verify-weight-time-w14-closeout.ts` (FROZEN) at its own tip `54a9d128` | 0 | 112 passed, 0 failed |
| `verify-exlib1c0b3-guard.sh` (pre-browser guard, not a suite) | 1 | designed fail-closed with no local Supabase stack present: `effective URL references the HOSTED ShredOS project (source: .env.local)`. Recorded as the guard working, per the same treatment in `docs/bootstrap-audit-2026-08-27.md`; no browser-driven verification was attempted this round |

Neither frozen verifier was modified. Both frozen failures are the known change-surface class: any descendant
commit is outside a frozen allowlist by construction, which is why each is also run at its own tip.

### 3.4 Toolchain and build

| gate | exit | result |
| --- | --- | --- |
| `npm run type-check` | 0 | `tsc --noEmit`, no output |
| `npm run lint` | 0 | **0 errors**, 124 pre-existing `@typescript-eslint/no-explicit-any` warnings; this round adds none |
| targeted ESLint on the three changed TypeScript files | 0 | zero bytes of output |
| sanitized production build, detached worktree at `f14683e`, synthetic `.env.local` (`http://127.0.0.1:54321`), no `VERCEL*`/`SUPABASE*`/`SB_*` in the environment | 0 | see the probe table below |

Post-build scan of `.next`:

| probe | files | expected |
| --- | --- | --- |
| `five-entry` / `weight-time-five` in served assets (`.next` excluding `cache/`) | 0 | 0 - the five-entry artifacts are outside the build graph |
| the same, including `cache/` | 1 | `.next/cache/.tsbuildinfo` only - the known F-E7 build-cache mention, not a served asset |
| the hosted project ref | 0 | 0 |
| any `https://<20-char-ref>.supabase.co` host | 0 | 0 |
| `Nick Tkacz` / `Joseph Carfagno` / the run key | 0 | 0 - no human decision string is compiled in |
| the sanitized placeholder URL | 16 | non-zero, positive control that the sanitized env is what got compiled |

### 3.5 Bundle reconstruction and clean-worktree re-verification

`git bundle create` over `feature/weight-time`, `git bundle verify` (exit 0, "The bundle records a complete
history"), then a fresh `git clone` from the bundle alone:

| check | result |
| --- | --- |
| reconstructed HEAD / tree | `f14683ea7f86f515d8388ca6483d7fce938f5b57` / `b69ac9427bebd77cea86ef6919434372288f7d27` - equal to the local candidate |
| `git diff` local HEAD vs reconstructed HEAD | empty |
| `9bf9e6c` ancestry inside the reconstruction | ancestor; exactly 4 commits to HEAD |
| both generators `--check` in the reconstruction | exit 0, byte-identical |
| `verify-weight-time-five-entry-endgame.ts` in the reconstruction | exit 0, 287 passed, 0 failed |
| `verify-weight-time-migration-029.ts` in the reconstruction | exit 0, 17 passed, 0 failed |
| `verify-weight-time-five-entry-endgame-live.sh` in the reconstruction | exit 0, **231 passed, 0 failed** |

The first attempt at this re-verification FAILED B6 (change surface: `node_modules`), because the
`node_modules` needed to run anything was symlinked into the clone and a symlink does not match the
`node_modules/` ignore pattern. That is the census working, on my own scaffolding; replacing the symlink with
an ignored real directory of symlinked entries left `git status --porcelain` empty and the suite green. It is
recorded here because the first run of a clean-worktree check is exactly where setup artifacts hide.

### 3.6 The REAL line (why the live number is the point of this round)

Sections D to N of the live suite remain the CONTROL line: they run on SYNTHETIC decisions marked TEST-ONLY,
because a negative control has to be free to say anything. New section R runs the SEVEN COMMITTED PACKAGES
themselves, carrying the real human tuples, in order, on a disposable clone of the post-W14 plus
migration-029 world:

- R2.1 to R2.7 reproduce the same stage vectors as the pre-decision templates predicted: `V1`, then `V2`
  four times, then `V6` twice, ending at 8/8/10/3/11/6/2/2/2/17/8;
- R3, R4 and R6 read the family A, B and C tuples back out of the database and match them to this bundle;
- R5 requires three-way agreement between the fingerprint PINNED in each package, the fingerprint STORED by
  stage 4, and the fingerprint RECOMPUTED by `public.exlib_content_admission_fingerprint`;
- R5b is the positive result that makes R5 mean something: the CONTROL line's admission fingerprints DIFFER
  from the real ones, so the five fingerprints are a deterministic function of Nick Tkacz's exact review
  tuple, not constants baked into the packages;
- R12 shows the two independent lines nevertheless reach an identical governed catalog shape
  (`1d9480c1c57039519caef9874931ed01`);
- R7 proves membership of exactly 8 exercise rows and 3 alias rows; R10 reads eight APPLIED rows through the
  read-only probe; R11 delivers 8 plus 3 to a fresh user; R13 finds zero TEST-ONLY markers on the real line
  and a non-zero count on the control line.

### 3.7 This bundle's own check, and the freeze commit

A review record that only agreed with itself would be worthless, so the freeze commit also adds endgame
static check **D16**: it recomputes the three form digests and the seven package digests FROM THE TREE and
requires this bundle to contain them, requires the five content payload and five admission fingerprints, the
governing timestamp, all three human tuples, the run key, the 8 + 3 membership and the OPERATOR-SUPPLIED
migration-029 label with its exact hosted record and probe, and then pins the history: every 40-hex token in
this document must resolve to a real object in this repository, every stated commit must be an ancestor of
HEAD and have its tree stated here too, the pre-decision commit must be among them, and the measured
candidate is the stated ancestor commit that is not the pre-decision commit.

D16 was ablated four ways against the real bytes, each ablation reverted and the file confirmed
byte-identical afterwards:

| ablation | D16 |
| --- | --- |
| one package sha256 perturbed by a single hex digit | FAIL |
| the `OPERATOR-SUPPLIED` label reworded | FAIL |
| the measured candidate and its tree replaced with unresolvable digests | FAIL (both named as unresolvable) |
| the measured candidate replaced with a REAL ancestor commit whose tree this document does not state | FAIL (named as tree-unstated) |

The first version of the SHA clause PASSED that fourth ablation, because it accepted any stated ancestor
commit and the pre-decision commit alone satisfied it; that is why the clause is now per-token. The weakness
was found by ablating the check, not by reading it.

Two consequences follow from a document that cannot state its own SHA:

- the gate ledger in sections 3.1 to 3.6 was measured at `f14683e`, the last gated commit, and D16 was
  measured against the exact bytes staged for the freeze commit;
- the re-verification of the freeze commit itself - the static matrix, the endgame suites, type-check and
  lint at the freeze commit, re-run in a clean clone of it - is reported OUTSIDE this bundle, in the round's
  final report, because a frozen document cannot contain results measured after its own bytes were sealed.

## 4. The section 7 treatment chosen

The instruction asked for the cleanest established repository treatment and for that choice to be reported.

The generator IS explicitly intended to regenerate the human-review page, so the instruction's second clause
applies. `renderHumanReview()` is now decision-state aware and has exactly two modes:

- BLANK, when any required human leaf is unresolved: the pre-decision surface, byte-for-byte, including
  "STATUS: FOR HUMAN REVIEW. Nothing here is approved.", plus the fail-closed unresolved-template SQL;
- RECORDED, when all three families resolve: a page whose post-decision status is truthful, plus
  `docs/weight-time-five-entry-human-decision-record.md`.

A PARTIAL form set is refused rather than rendered.

Nothing historical was rewritten to achieve this:

- the pre-decision page is preserved as the committed blob of `9bf9e6c`, and BOTH endgame verifiers
  materialize that commit's blank forms, run the real generator against them, and require the pre-review
  wording back byte-for-byte on every run (the static suite executes that regression; the live suite repeats
  it and then proves the template it renders is still non-executable);
- the append-only endgame report gained section 15, which supersedes three statements as CURRENT STATE and
  leaves the historical prose intact;
- the operator runbook, which is operator-facing and not byte-bound, now states the completed status and
  retargets its pre-decision claims at `9bf9e6c` using the repository's existing
  `MIGRATION_INVENTORY_RETARGET` pattern - a preserved claim evaluated against an immutable commit object,
  never a deleted check.

Scope was deliberately NOT broadened to the two documents the lifecycle manifest binds BY BYTES -
`docs/weight-time-five-entry-endgame-discovery-matrix.md` and
`docs/weight-time-five-entry-delivery-configuration-dependency.md`. Editing either would change the manifest
digest and cascade into a package regeneration for a label change, and the repository already treats such
labels as frozen statements of the candidate they describe. They keep their pre-decision wording; section 15
of the endgame report says so explicitly and names this bundle and the decision record as the current status.

## 5. Boundary statement

Held this round, without exception:

- no hosted Supabase contact of any kind, and no Supabase CLI invocation;
- no Vercel contact and no repoint;
- no hosted package execution: all seven packages are EXECUTABLE and UNRUN;
- no run-key configuration mutation;
- no delivery of a single tenant row outside a disposable local cluster;
- no push, no tag, no amend, no rebase, no squash, no merge;
- migration 029 was NOT applied by Claude and hosted state was NOT read by Claude; its APPLIED status is
  OPERATOR-SUPPLIED, restated from the operator path, as recorded in section 2.

What the completed decisions do NOT authorize: running any package, enabling production delivery, repointing
Vercel, deploying, or delivering a tenant. Hosted stages 1 to 7 remain the operator's act.
