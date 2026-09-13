# weight_time five-entry release: human decision record

STATUS: DECISIONS RECORDED. The three governing human decision families are COMPLETE. This record BINDS them;
it does not make them, and it authorizes nothing on its own. The completed forms below are the approval, and
every one of the seven packages is EXECUTABLE and UNRUN.

GENERATED FILE. Do not edit by hand - regenerate with
`npx tsx scripts/generate-weight-time-five-entry-packages.ts`. Every value is read from the bytes named here
(the three forms, the lifecycle manifest, and the seven renderings this same run produced) and never retyped.

The pre-decision review surface is NOT rewritten away: the blank-form rendering of
`docs/weight-time-five-entry-human-review.md` is preserved as the committed blob of the pre-decision commit, and the
endgame verifier re-derives it from that commit's blank forms on every run, so the wording the reviewers saw
stays checkable after this record exists.

## Governing decision timestamp

- `2026-09-13T18:25:13-04:00` - carried by every family A decision, every family B decision, and both family C approvals

## The three completed forms, bound by bytes

| Family | Form | Bytes | sha256 |
| --- | --- | --- | --- |
| A | `docs/weight-time-five-entry-snapshot-review-form.json` | 11203 | `599032a870d0bc663d3b5193b9038caa5a7c2f3b05f8cdd73961255c871ee22e` |
| B | `docs/weight-time-five-entry-content-review-form.json` | 12387 | `9e5e4087c5124295b98eca7b47edbfb371ef7095dd4045d491d39e336cb50420` |
| C | `docs/weight-time-five-entry-run-authority-form.json` | 10684 | `13e7b43e2af7f1e70ce306bdfd968fc825bc80a9a89ea2ae5a130dc15ac4c12f` |

## Family A - snapshot review, one decision per identity

| Line | Identity | decision | reviewer | credential | reviewed_at | evidence |
| --- | --- | --- | --- | --- | --- | --- |
| 132 | `e21b2c00-0000-4000-a000-000000000004` | APPROVE | Joseph Carfagno | ForgeFitOS operator | 2026-09-13T18:25:13-04:00 | (null - optional) |
| 133 | `e21b2c00-0000-4000-a000-000000000005` | APPROVE | Joseph Carfagno | ForgeFitOS operator | 2026-09-13T18:25:13-04:00 | (null - optional) |
| 137 | `e21b2c00-0000-4000-a000-000000000006` | APPROVE | Joseph Carfagno | ForgeFitOS operator | 2026-09-13T18:25:13-04:00 | (null - optional) |
| 138 | `e21b2c00-0000-4000-a000-000000000007` | APPROVE | Joseph Carfagno | ForgeFitOS operator | 2026-09-13T18:25:13-04:00 | (null - optional) |
| 139 | `e21b2c00-0000-4000-a000-000000000008` | APPROVE | Joseph Carfagno | ForgeFitOS operator | 2026-09-13T18:25:13-04:00 | (null - optional) |

Rationale, identical for all five: "I approve all five catalog snapshots as accurate for release."

## Family B - content review, one decision per identity

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

## Family C - delivery run authority, once for the run

| Leaf | Recorded value |
| --- | --- |
| run_key_literal | `w14e-weight-time-release1-staged-v1` |
| product approver | Joseph Carfagno at 2026-09-13T18:25:13-04:00 |
| legal approver | Joseph Carfagno at 2026-09-13T18:25:13-04:00 |
| run_membership | `CUMULATIVE_HISTORICAL_SIX_PLUS_FIVE_WEIGHT_TIME_IDENTITIES` |
| forbidden run key (never written) | `exlib2u-plank-release1-staged-v1` |

approval_rationale, verbatim: "I approve `w14e-weight-time-release1-staged-v1` with the cumulative historical six plus five weight_time membership because it preserves the existing release while adding the five reviewed exercises; this approval does not itself enable production delivery."

## The five content payload fingerprints - UNCHANGED by these decisions

| Line | Content payload fingerprint (sha256) |
| --- | --- |
| 132 | `fb04c3e93b3dc09e0b64879c9fb9c6141f511a32fc0586119b4399259dee43a8` |
| 133 | `454c9158bb79a07bb203f336d147ce6b6efab1cd373c7fb463fe92f4654efe1f` |
| 137 | `0ab5a7048fc6a1619299281b9a200a9323c7793c91e89d6fea854b54a88e21a3` |
| 138 | `f3606f4aeef436e7c0b90fbc6585d6845bfb32024d47707eeb813138de018f98` |
| 139 | `552dc5810ff446ec219304e19adab0429f560323090fd3651ae57c0241362f45` |

Carrier bound by the content form and the manifest: `8fa1d3402a3ca9beef8b1cbb7ba58692bea0d28c11926d6db33da72877f2afdb`.

## The five admission fingerprints, DERIVED from the family B tuple

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

## The seven EXECUTABLE packages rendered from these decisions

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

## Cumulative run membership

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

## Migration 029 hosted status - OPERATOR-SUPPLIED

- status: APPLIED hosted (OPERATOR-SUPPLIED, never Claude-observed); also applied on every disposable local cluster by the two proofs that exercise it
- provenance: OPERATOR-SUPPLIED by the Joseph/ChatGPT operator path
- hosted migration record: `20260912181551_exlib_plank_cross_run_idempotency_029`
- post-apply read-state probe: `migration_029_plank_cross_run_idempotency = APPLIED`
- Claude observed hosted state: NO; Claude applied it: NO

This is the operator's fact, restated. Claude did not contact hosted Supabase in the round that produced
this record, and nothing here may be read as Claude-observed hosted state.

## What these decisions do NOT authorize

- they do not run any package: all seven are prepared, unrun, and operator-only;
- they do not enable production delivery: the run-key configuration change is a separate operator act;
- they do not repoint Vercel, deploy anything, or deliver a single tenant row.
