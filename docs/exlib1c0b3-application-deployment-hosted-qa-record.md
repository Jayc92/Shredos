# EXLIB-1C0B3 — Application, deployment, and hosted-QA record

Durable factual record, prepared 2026-08-27 from the exact promoted
state. This document records what happened; it authorizes NOTHING.
Catalog loading and EXLIB-1C loading remain unauthorized. The
authoritative review ledger remains 48/48 pending-null and all 26
canonical candidates remain `import_eligible: false`.

## 1. Source promotion (2026-08-26)

- main = origin/main = `f20ab59b0e4375e6ec7d80c90583585d2c0bf9c0`
  (fast-forward from `360ccd24ac1529c910fc58744be71b3bf9838af3`).
- Stable source tag: `exlib1c0b3-coordinated-equipment-support-stable`,
  annotated tag object `f6c20450c6a4f1b919b177bb212d7e2d112d6f0b`,
  peeled target `f20ab59b0e4375e6ec7d80c90583585d2c0bf9c0` local and
  remote.
- Source tree: `436ea1b7b43aef4f4b350cedef49ce1f3c8ac880`.
- Promoted artifact fingerprints (bytes / SHA-256):
  - migration 025: 3,587 /
    `fbda16f4d25cacd1715b199050506a4da15896355d96700876b76c68826d304c`
  - live suite: 9,748 /
    `e576d4298e799041befb716186d10d8433a94d3734225596ce8b6966a858d0f1`
  - guard: 5,352 /
    `f5fcda9ef95b4743f8e4009d5a1330289e046d20cc524e944a8d2e91c53b06a4`
  - verifier: 95,005 /
    `29aa42146a132d4ab7be3be110df21095e5c0ee90b2311be9b84fc7803674a3d`
  - implementation record: 7,055 /
    `da5e42379ace7ef199f73a23a230b32a97c52ccc972118837535abdb1a1ed1eb`

## 2. Migration application (2026-08-26)

- Applied by ChatGPT under Joseph's 2026-08-26 authorization —
  never by Claude — to Supabase project ShredOS
  (`ttybyljytiwntvorugcv`).
- Applied bytes: 3,587; SHA-256
  `fbda16f4d25cacd1715b199050506a4da15896355d96700876b76c68826d304c`
  (byte-identical to the promoted source artifact).
- Supabase migration history entry:
  `20260826203154_exlib_equipment_vocabulary_support`.
- Read-only verification: both equipment CHECK constraints
  (`exercises_equipment_check`, `exercise_catalog_equipment_check`)
  were verified as validated, non-deferrable, and containing exactly
  all 12 accepted values.
- Migration 025's committed internal "STATUS: DRAFT — NOT APPLIED"
  header remains unchanged historical artifact text from the
  reviewed draft; it is deliberately NOT rewritten, because any byte
  change to an approved artifact voids the approval. This record is
  the durable statement that the migration has been applied.

## 3. Automatic deployment

- Vercel project: `shredos`, project ID
  `prj_wmJg53QOXs4HI4hYhdBwH8VcH8RC`.
- Production deployment: `dpl_HAHnk2W2YcnZn9tSaieQvm5Y7BAb`,
  status READY.
- Deployed Git SHA: `f20ab59b0e4375e6ec7d80c90583585d2c0bf9c0`
  (exactly the promoted main).
- Production alias tested: `https://shredos-pi.vercel.app`.
- The deployment was the normal automatic result of pushing main;
  no manual Vercel deployment or configuration operation occurred.

## 4. Authenticated hosted QA (ChatGPT, 2026-08-27)

- The authenticated production dashboard loaded successfully.
- The production exercise selector displayed all four new labels:
  Weight Plate, Weighted Vest, Smith Machine, Sandbag.
- Four temporary exercises were created:
  - QA EXLIB Weight Plate 2026-08-27
  - QA EXLIB Weighted Vest 2026-08-27
  - QA EXLIB Smith Machine 2026-08-27
  - QA EXLIB Sandbag 2026-08-27
- Persisted equipment values verified: `weight_plate`,
  `weighted_vest`, `smith_machine`, `sandbag`.
- The edit flow passed for each record; each persisted the notes
  text "Hosted QA edit verified".
- The deployed production workout bundle contained the exact Smith
  Machine guidance "next available increment/setting".
- Exercises temporarily rose from 84 to 88.

## 5. Temporary record lifecycle and complete cleanup

- Cleanup preflight confirmed zero workout and routine references
  to the four QA exercises.
- Guarded cleanup removed exactly four `exercise_name_claim` rows
  and exactly four QA exercises.
- Final counts: exercises 84; exercise_name_claims 84; remaining QA
  exercises 0.
- Tenant rows using the four new values: 0. Catalog rows using the
  four new values: 0.
- Catalog content remained zero throughout.
- Post-QA Vercel runtime-error query found no errors; the post-QA
  warning/error log query found no matching logs.

## 6. Evidence layers and catalog-loading prohibition

- Hosted facts in sections 2-5 (application history entry,
  constraint verification, deployment identifiers, QA row counts,
  cleanup counts, log queries) come from ChatGPT's authenticated
  hosted application, deployment, and QA session reports as relayed
  by Joseph. Claude performed no Supabase or Vercel contact.
- The review ledger is a COMMITTED SOURCE ARTIFACT
  (`docs/exlib1b1-review-ledger.jsonl`); its 48/48 pending-null
  status is verified from the repository, not by querying any
  hosted ledger table. The same applies to the 26/26
  `import_eligible: false` state in
  `docs/exlib1c0a-equipment-resolution.jsonl`.
- Catalog loading remains UNAUTHORIZED. EXLIB-1C loading remains
  UNAUTHORIZED. Nothing in this record approves any ledger record,
  changes any candidate's eligibility, or begins the catalog import
  phase.
