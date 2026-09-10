# Coordinated `weight_time` Implementation — PLAN (planning only)

**STATUS: APPROVED PLAN (operator review, 2026-09-09). THIS DOCUMENT
ITSELF AUTHORIZES NOTHING.** Each execution step is authorized only by
the operator's explicit instruction: **W1–W3 are authorized; W4
onward is not yet.** No migration is authored by this document. No
schema is changed. No Supabase contact, no hosted application, no
deployment, no tag, no push is proposed or performed by this document.
Hosted application remains Joseph/ChatGPT-only, on the ShredOS project
alone, under its own future explicit instruction.

**This document carries no phase identifier.** Phase ids in this repo
are operator-assigned; inventing one here would fabricate an
authorization anchor. Rename on assignment.

**REVISION 2 — incorporates the operator's planning review.** The
review accepted revision 1 directionally and issued five required
corrections, all applied here:

1. **O1 resolved** — carries do **not** ship under `weight_time` in
   this milestone; admission is **five** entries (§1, §15).
2. **Mode-transition policy added** as a data-integrity rule, and the
   destructive PATCH self-heal is scheduled for removal (**new §5**).
3. **Records-polarity fix reordered** to land *before* the union is
   widened (W3 before W4 — §13, §16).
4. **Migration number replaced** by the placeholder
   `TBD_NEXT_MIGRATION_AFTER_HOSTED_BOUNDARY_CONFIRMATION` (§10).
5. **Six named findings preserved**, with the verifier retargets now
   additionally constrained to be **count-neutral** (§13, §16).

Sections renumbered from revision 1 by the insertion of §5; every
internal cross-reference was updated with it.

**REVISION 3 — APPROVED, with the operator's final decisions.** All
remaining product decisions are now closed except O9, which is open by
design:

- **O4 CLOSED** — no retroactive guidance this release (§7, §15.1).
- **O5 CLOSED** — copy, zero rendering, unilateral (§4.1).
- **O6 CLOSED** — two-dimensional frontier display (§4.2, §6).
- **O7 RESOLVED from durable repository evidence** — the committed
  EXLIB-2M application record establishes hosted = 001–027, so the
  next migration is **028** (§10.1). The placeholder is retired.
- **O8 CLOSED, option (b)** — the mode-transition invariant is enforced
  at the database boundary in 028, in its refined "zero CURRENT
  `workout_sets` rows" form, with a mandatory seven-point DB proof and
  a mandatory two-interleaving concurrency proof (§5.4, §12.1).
- **Migration 028 scope CONFIRMED**, including the
  `deliver_catalog_exercises` replacement (§10.2).
- **O9 OPEN BY DESIGN** — carries stay deferred; no carry mode is
  named (§15.2).
- **W0 is therefore complete.** Execution is authorized through **W3
  only**; W4+ waits for the implementation checkpoint.

---

## 0. Anchors, and what was actually inspected

Written against local `HEAD = a39ba5f` on branch `chore/lint-baseline`
(two commits ahead of `origin/main = 59e443ba`: the lint baseline
`0e10d7b` and the next-config documentation commit `a39ba5f`). Neither
commit touched `docs/`, `src/`, or `supabase/`, so every source claim
below still reads true at `a39ba5f`; the three anchor fingerprints were
re-verified byte-for-byte at this HEAD and are unchanged.

Closed product decisions this plan implements — nothing here reopens,
narrows, or re-decides any of them:

| Record | Bytes | SHA-256 |
|---|---|---|
| `docs/exlib1c0b4-weight-time-product-decisions.md` (D1–D4, CLOSED 2026-08-27) | 5,973 | `12fe23d37ee075c66c62dc1ad11b18fadf29ccd907525b2b9dabf7055feaa4aa` |
| `docs/exlib1c0b5-weight-time-rpe-warmup-decision.md` (D5, CLOSED 2026-08-28) | 3,458 | `0d5efdc70d968c0301f817cb5a9ac4feedf56e1f129bf03c23f5d6180f1009e3` |
| `docs/exlib1c0b-schema-vocabulary-impact-audit.md` (S1–S15, C1–C24) | 31,922 | `0d4447142735b29c987e792a8ed3331f19b38c4ae9eb5225d77e7fcf5cff6c5e` |

**The audit was written when the newest migration was 024.** Every
schema and consumer claim below was re-derived from the tree at this
HEAD, not carried from the audit. One material drift was found (§17).

**The hosted applied-migration boundary IS known — from durable
repository evidence, not from hosted contact.** The committed record
`docs/exlib2m-migration-027-application-record.md` documents that
migration 027 WAS APPLIED to hosted ShredOS by ChatGPT on 2026-09-02
19:45:41 UTC (hosted history entry
`20260902194541_exlib_catalog_content_schema_027`) and states that
"the REPOSITORY schema/migration sequence effective on hosted ShredOS
is now 001-027 (all twenty-seven numbered repository migrations are in
effect)". Therefore the **next migration is 028** (§10.1). Migration
027's own header still reads "PREPARED FOR A LATER EXPLICIT HOSTED
APPLICATION and is NOT APPLIED during EXLIB-2M"; that is phase-local
historical prose, true as written of its own phase and **superseded by
the later application record** — the record's own §4 says exactly this
of the header. It is not current hosted state, and 027 is not edited
to say otherwise. No Supabase contact is made to rediscover a fact the
repository already preserves.

---

## 1. The user-facing problem `weight_time` solves

A **weighted hold** has two independent performance dimensions: the
external load added, and how long it was held. Today the app can store
only one of them, and the choice is destructive.

The four existing modes each refuse one half:

- `timed` forbids weight outright. `append_workout_set` raises
  `invalid_input` if `p_weight_kg IS NOT NULL` for a timed exercise
  (`supabase/migrations/021_ui5b_transactional_ordering.sql:506-510`),
  and the set PATCH route nulls any surviving `weight_kg` on the next
  edit (`src/app/api/workout-sets/[id]/route.ts:117`).
- `weight_reps` forbids duration symmetrically
  (`021:497-500`), and every summary drops it.
- `cardio` forbids weight *and* RPE *and* warmups (`021:501-505`).

So a user with a 45 lb plate on their back for 90 seconds must pick
which fact to throw away. Neither choice is recoverable later: the
discarded number was never written.

This is not hypothetical. **Eight catalog entries in the approved
Release 1 inventory were deferred for exactly this reason**, each
carrying `"deferred_reason": "weight_time tracking mode is
product-defined (EXLIB-1C0B4/B5) but not implemented; deferred until
it ships"` (`docs/exlib2b-release1-inventory.jsonl`, lines 132–139;
`docs/exlib2b-release1-coverage-matrix.md:19-23`).

### 1.1 Admission scope for this milestone — FIVE entries

**Resolved by the operator's planning review.** The `weight_time`
field contract (weight + duration, `distance_meters` absent) is right
for weighted timed **isometrics** and too restrictive for **carries**.
Admission for this milestone is therefore the five holds; the three
carries stay deferred.

**ADMITTED — ships with this milestone (five):**

| Inventory line | Proposed canonical name | Equipment | Laterality | Pattern |
|---|---|---|---|---|
| 132 | Plate-weighted plank | weight_plate | bilateral | core_anti_extension |
| 133 | Weighted vest plank | weighted_vest | bilateral | core_anti_extension |
| 137 | Weighted dead hang | weight_plate | bilateral | grip_forearm |
| 138 | Weighted wall sit | weight_plate | bilateral | squat |
| 139 | Weighted vest wall sit | weighted_vest | bilateral | squat |

**STILL DEFERRED — carries (three):**

| Inventory line | Proposed canonical name | Equipment | Laterality | Pattern |
|---|---|---|---|---|
| 134 | Farmer's carry | dumbbell | bilateral | carry |
| 135 | Suitcase carry | kettlebell | **unilateral** | carry |
| 136 | Sandbag bear-hug carry | sandbag | bilateral | carry |

**Carry tracking is a separate, later product decision, and this plan
deliberately does not name a mode for it.** A carry may reasonably be
prescribed by load × distance, by load × duration, or by both, and
choosing among those is a product decision — not something to settle
as a side effect of shipping weighted holds. No future mode name is
invented, reserved, or implied here.

**The historical approval facts are preserved, not rewritten.** The
coverage matrix's "**8 explicitly deferred weight_time entries**"
(`docs/exlib2b-release1-coverage-matrix.md:21-22`) remains true as
written: eight *were* deferred, and eight still carry
`deferred: true` / `import_eligible: false`. What this milestone
changes is only that **admission is a documented five-entry subset of
that eight** — so the matrix needs no correction, labelled or
otherwise, and the inventory's three carry rows are simply not part of
the W14 admission act.

**Carries are deferred from the catalog, not forbidden in the
product.** `unilateral` is a user-settable boolean on the tenant
`exercises` table (`003_phase1c_workout_logging.sql:32`, accepted by
both create and update validation at
`src/lib/exercise-validation.ts:184,189,372-375,454-457`), so once
`weight_time` ships a user can hand-create their own weighted carry —
including a unilateral one — and log it as weight + duration. The
implementation must therefore still behave correctly for a unilateral
`weight_time` exercise even though no *admitted* entry is unilateral
(§6, §9).

Separately, the Plank seed reconciliation had to record `weight_time`
as *unsupported with a null schema value*
(`scripts/verify-exlib1c0a.ts:281`) — the vocabulary gap is already
written into shipped evidence.

## 2. Existing schema and data sources involved

Everything `weight_time` needs to *store* already exists. The audit's
S14 conclusion holds at this HEAD: `workout_sets` already permits a
row with both `weight_kg` and `duration_seconds` populated, because
the two columns are independent and nullable with no cross-column
constraint.

**Vocabulary (two CHECKs, both must move together):**

| # | Object | Location | Current definition |
|---|---|---|---|
| S3 | `exercises.tracking_mode` (tenant) | `010_phase2r_exercise_tracking_modes.sql:26-28` | `CHECK (tracking_mode IN ('weight_reps', 'bodyweight', 'cardio', 'timed'))` |
| — | `exercise_catalog.tracking_mode` (catalog) | `023_exlib_catalog_and_delivery_contract.sql:384-385` | `CHECK (tracking_mode IN ('weight_reps','bodyweight','cardio','timed'))` |

**Both are unnamed inline constraints in the committed SQL.** Their
installed names are *not* in the tree and must be discovered
mechanically from `pg_constraint` on a disposable database before any
`DROP CONSTRAINT` can be written. Migration 025 set this precedent
exactly (`docs/exlib1c0b3-coordinated-equipment-implementation.md:32-36`
— "Installed names discovered mechanically from pg_constraint").

**Value storage (no change required):**

| Column | Definition | Origin |
|---|---|---|
| `weight_kg` | `NUMERIC(6,2)` nullable, **no CHECK at all** | `003_phase1c_workout_logging.sql` |
| `reps` | `SMALLINT` nullable, no CHECK | `003` |
| `rpe` | `NUMERIC(3,1) CHECK (rpe BETWEEN 1 AND 10)` | `003` |
| `duration_seconds` | `INTEGER CHECK (duration_seconds >= 0)` | `011_phase2s_tracking_aware_set_entry.sql:17-18` |
| `distance_meters` | `NUMERIC(10,2) CHECK (>= 0)` | `011:19-20` |
| `completed`, `is_warmup` | `BOOLEAN NOT NULL DEFAULT false` | `003` |

Note `duration_seconds >= 0` permits zero at the column level, and
`weight_kg` has no lower bound at all. D2's "duration must be > 0"
and "negatives invalid" are therefore **not** column-enforced for any
mode today; they are enforced in the write paths. `weight_time` must
follow that same layering, not introduce a new one.

**Write paths:**

- `append_workout_set` (`021`) — the **only** DB-guarded write path.
  Self-validating for direct authenticated RPC callers: ownership,
  completed-lock, tracking mode re-read under `FOR UPDATE`, per-mode
  field gating, type/range checks. Its per-mode gate ends in
  `ELSE RAISE EXCEPTION 'invalid_input'` (`021:511-513`) — **fail
  closed**, so an unknown mode cannot insert anything.
- `POST /api/workout-exercises/[id]/sets` — validates, then delegates
  to that RPC.
- `PATCH /api/workout-sets/[id]` — **no DB function and no trigger.**
  Confirmed: `workout_sets` has only an index, an RLS policy and
  grants; no trigger exists on it anywhere in `001`–`027`. The
  TypeScript route is the *sole* validator of edits.
- `repeat_workout` (`022:388-398`) copies sets with **every value
  field NULL**, mode-agnostic. Needs no change (see §11).

**Catalog → tenant delivery:** `deliver_catalog_exercises`, current
definition in `026_exlib_plank_seed_reconciliation.sql:146`. See §17.

**Dates:** the only date is
`workout_sessions.workout_date DATE NOT NULL DEFAULT CURRENT_DATE`
(`003_phase1c_workout_logging.sql:58`).

## 3. Current behavior and gaps

`weight_time` appears **zero times anywhere in `src/`** (verified by
direct `git grep`; also asserted by eleven committed verifiers, §13).
So "current behavior" means: what happens the instant a
`weight_time` value can exist.

**CURRENT STATE (errata, 2026-09-09): the W1 census is the
authoritative implementation scope — 58 decision sites across 14
files** (`scripts/verify-tracking-mode-census.ts`, committed at
`fa5a359b`, measured at `14a36567` after W3: OK 1, MISSING 57). It
supersedes the earlier hand-grep estimate below for every
implementation purpose; the census counts *decision sites* (a switch,
an else-if chain, an object literal, a type union, a JSX expression)
rather than individual comparisons, and it reaches type declarations,
Record keys and option lists that a comparison grep cannot. The table
that follows is retained as **what the earlier grep observed at its
own commit (`0e10d7b`)**: 53 mode-literal comparison sites across 9
files.

**CONSERVATION (errata, 2026-09-10, W7.5-A).** The original W1
implementation census — **58 sites / 14 files** at `795fe1ff` — is the
conserved baseline: `scripts/tracking-mode-census-ledger.json` carries
all 58 with stable identities, and every census run resolves each of
them to exactly one lifecycle state (HANDLES_WEIGHT_TIME /
EXCLUDES_WEIGHT_TIME_INTENTIONALLY / ELIMINATED_BY_REFACTOR / PENDING)
with totals that must equal 58. After W7: **5 handled + 2 intentionally
excluded + 12 eliminated by refactor + 39 pending = 58** — the 12
eliminations are the three route-local `TrackingMode` aliases replaced
by the shared type at W4 (`50e7451c`) and the nine set-route maps and
branches moved into `src/lib/workout-set-contract.ts` at W7
(`c22be37c`), each recorded with its eliminating commit, replacement
executable owner and preservation reason. The **live syntactic census**
after W7 is **53 sites / 13 files** (HANDLES 11, EXCLUDES 3, PENDING
39); it is reported separately and can never shrink the conserved
worklist silently.

| File | Sites |
|---|---|
| `src/lib/workout.ts` | 13 |
| `src/components/workout/WorkoutExerciseBlock.tsx` | 10 |
| `src/components/workout/SetRow.tsx` | 8 |
| `src/app/api/workout-exercises/[id]/sets/route.ts` | 6 |
| `src/app/api/workout-sets/[id]/route.ts` | 5 |
| `src/lib/progress-overview.ts` | 4 |
| `src/app/(app)/progress/exercises/[id]/page.tsx` | 3 |
| `src/lib/supabase/server.ts` | 2 |
| `src/lib/strength-records.ts` | 2 |

### 3.1 The single most important engineering fact

**Widening the union breaks the build in exactly one place.**

```ts
// src/lib/exercise-validation.ts:306-313
export function deriveLegacyExerciseType(trackingMode: TrackingMode): ExerciseTypeValue {
  switch (trackingMode) {
    case 'bodyweight': return 'bodyweight'
    case 'cardio': return 'cardio'
    case 'timed': return 'mobility'
    case 'weight_reps': return 'strength'
  }
}
```

An exhaustive `switch` with no `default` and a non-optional return
type: adding a fifth member makes this fail to compile. That is the
*only* compiler-enforced coordination point, and it happens to be
precisely where D3 must be honoured. Every other site fails silently
or at runtime:

- Three `Record<TrackingMode, …>` lookups become `undefined` and
  **throw**, because the type says they cannot be:
  `src/app/api/workout-exercises/[id]/sets/route.ts:13`,
  `src/app/api/workout-sets/[id]/route.ts:11`,
  `src/app/api/workout-exercises/[id]/apply-first-set/route.ts:21`.
  Adding the key satisfies the compiler; *forgetting* it is a
  compile error, so these three are safe-by-construction **only if
  the `Record` type is used** — which it is. Good.
- `VALID_MODE_FILTERS: readonly TrackingMode[]`
  (`src/lib/progress-overview.ts:96-101`) is a hand-written array
  typed as a *list of* the union, not a total map. Adding a union
  member does **not** break it. Silent.
- Every equality / else-if / JSX comparison site in the census keeps
  compiling. Silent.

**Consequence for the plan, and it is the reason W1 exists:**
`deriveLegacyExerciseType`'s exhaustive switch **is not the worklist**.
The type system will not find this work for us. The decomposition in
§16 therefore front-loads a mechanical census and a guard rather than
relying on `tsc`.

### 3.2 Failure class A — hard 500s

| Route | Line | Failure |
|---|---|---|
| `POST /api/workout-exercises/[id]/sets` | 13, then `Array.from(MODE_ALLOWED_FIELDS[trackingMode])` | `TypeError`, unhandled → 500 |
| `PATCH /api/workout-sets/[id]` | 11, then `:50` | `TypeError` → 500 |
| `POST /api/workout-exercises/[id]/apply-first-set` | 21, then `MODE_COPY_FIELDS[trackingMode].filter(...)` | `TypeError` → 500. The **client** guards this with `?? []` (`WorkoutExerciseBlock.tsx`); the server does not. |

### 3.3 Failure class B — silent corruption (the real hazard)

The two all-time records readers use **opposite** guard polarity, and
that asymmetry is the whole problem:

- `src/lib/supabase/server.ts:851` — **allowlist**:
  `if (ex.tracking_mode !== 'cardio' && ex.tracking_mode !== 'timed') continue`.
  `weight_time` is safely *excluded*.
- `src/lib/strength-records.ts:286` — **denylist**:
  `if (ex.tracking_mode === 'cardio' || ex.tracking_mode === 'timed') continue`,
  and again at `:320`
  `.filter(([, meta]) => meta.trackingMode !== 'cardio' && meta.trackingMode !== 'timed')`.
  `weight_time` **leaks in**.

So without a change, a weighted plank would be silently enrolled in
the strength/1RM PR model. **`weight_time` must not leak into the
existing strength/1RM record model** — that is a hard requirement, and
the denylist form is what would violate it by default. Compounding it:

- `isQualifyingSet` (`strength-records.ts:113-117`) is
  `completed && !is_warmup && (weight_kg > 0 || reps > 0)`. A valid
  **zero-added-weight** baseline hold (explicitly legal per D2)
  qualifies for **nothing** — it is not a warmup, it is not
  incomplete, it simply vanishes.
- `RawSet` does not even select `duration_seconds`. **Both** queries
  in the file select
  `workout_sets ( set_number, reps, weight_kg, rpe, is_warmup, completed )`
  — `strength-records.ts:241` (all-time records) and `:384` (the
  per-exercise detail) — so the strength path is structurally blind to
  the second dimension, not merely unaware of it.
- `processExerciseSession` emits only
  `'weight' | 'estimated_1rm' | 'bodyweight_reps'` PR kinds.

Result: heavier-but-shorter would read as a PR and longer-but-lighter
would read as nothing — the exact claim D4 forbids ("Never claim that
a heavier but dramatically shorter hold is universally better").

`fetchExerciseProgressDetail` (`strength-records.ts:363`) applies **no
mode filter at all** — it selects `tracking_mode` and never branches
on it; the caller decides
(`src/app/(app)/progress/exercises/[id]/page.tsx:123`, `isCardioTimed`).

In `src/lib/workout.ts`:

- `formatTrackingAwareSetSummary` falls through to the `weight_reps`
  branch → **duration silently dropped from every summary string**.
- `setScore` returns raw weight when `reps` is null and `0` when
  weight is 0 → duration ignored entirely, and the zero-weight
  baseline scores 0.
- `bestSet`'s filter structurally excludes duration-only sets.
- `pickRepresentativeCardioSet` would send a non-`'timed'` mode down
  the **cardio pace** branch; it accidentally degrades to
  longest-duration only because `distance_meters` is always null.
- `trackingAwareProgressSignal` computes `currHasPace` only when
  `mode === 'cardio'`, so `weight_time` would be judged on
  **duration alone**: 60 s at 0 kg would report "improved" over 30 s
  at 20 kg. Direct D4 violation.
- `buildIncreaseSuggestion`, `evaluateSetTargetFeedback` and
  `suggestNextTarget` all gate on `=== 'cardio' || === 'timed'`, so
  `weight_time` takes strength paths.
- `evaluateSetPRs` takes **no tracking mode argument at all** — its
  caller must gate it.

### 3.4 Failure class C — dead UI

- `SetRow.tsx`: 8 `===` branches, no `else` → a `weight_time` row
  renders **no input fields**. Silent dead UI, no error.
- `WorkoutExerciseBlock.tsx:501-527`: the column-header block is four
  `===` tests with no `else` → **no headers**.
- `handleAddSet`'s final `} else { // timed` is an **accidental else
  fallback**: `weight_time` would be classified as timed.
- `applyRequiredReady` (`:273-279`) is a ternary chain whose final
  branch requires only `duration_seconds !== null` — it would consider
  a weight-*less* weight_time set ready to apply.
- `APPLY_COPY_FIELDS` (`:266`) is typed `Record<string, readonly
  string[]>`, **not** `Record<TrackingMode, …>`, so the compiler gives
  no help at all here; the `?? []` at `:280` then makes Apply silently
  copy nothing rather than crash. This is the mirror image of the
  server route at §3.2 — same data, opposite failure mode, neither one
  caught by `tsc`.
- `/progress` renders filter pills by mapping `TRACKING_MODES` from
  `src/lib/constants.ts:233`
  (`src/app/(app)/progress/page.tsx:309`), while
  `parseTrackingModeFilter` validates against the *separate*
  `VALID_MODE_FILTERS` list. Extend one without the other and you get
  a visible pill whose `?mode=weight_time` link silently falls back
  to "All".

### 3.5 Direct conflicts with the closed decisions

These are not gaps to fill; they are existing rules that
**contradict** D1–D5 and must be resolved deliberately.

**G1 — zero added weight is currently unstorable.**
`append_workout_set` rejects it *mode-independently, pre-lock*:

```sql
-- 021_ui5b_transactional_ordering.sql:437
OR (p_weight_kg IS NOT NULL AND (p_weight_kg <= 0 OR p_weight_kg > 1000))
```

D2 rules `weight_kg >= 0` with zero a *valid intentional unweighted
baseline*. The `<= 0` must become mode-dependent (`> 0` for
weight_reps, `>= 0` for weight_time), which means moving the *lower*
bound out of the documented "Mode-INDEPENDENT type/range validation
may run pre-lock" block (`021:432-434`) and after the locked mode
read. The upper bound can stay pre-lock. This is behaviour-preserving
for all four existing modes and must be proven so.

**G2 — the API layer collapses 0 lbs to null before the DB ever sees
it.** Both set routes do
`incomingWeightKg = body.weight_lbs > 0 ? convert : null`
(`workout-sets/[id]/route.ts:65`; same shape in `sets/route.ts`). So
even with G1 fixed, a 0 lb baseline entered through the UI arrives as
`null`, not `0`. **Zero weight is a valid intentional weight_time
baseline and must survive API conversion as `0`, never collapse to
`null`** — `null` weight is not zero weight (D2). Two layers, both
required.

**G3 — the PATCH self-heal will destroy `weight_kg`, deferred.** The
self-heal (`workout-sets/[id]/route.ts:90-120`) rewrites stale fields
to match the exercise's *current* mode on every successful set PATCH.
It fires on edit, not at mode change — so switching an exercise
`weight_time → timed` leaves the weights in the DB until the next
edit of each row, at which point `:117` nulls `weight_kg`. Silent,
delayed, irreversible. **§5 rules this behaviour out entirely rather
than extending it to a fifth mode.** The route also has **no `else`**
after `:113`, so once the `Record` key is added a `weight_time` PATCH
that sends only value fields reaches `:122` and returns
*400 "No valid fields to update."*

**G4 — `weight_time` is not "timed plus weight".** Both `cardio` and
`timed` **forbid `is_warmup`** at the DB level (`021:503`, `021:508`).
D5 explicitly **permits** warmups for `weight_time`. So `weight_time`
requires its own `ELSIF` branch; it cannot be folded into the timed
branch, and no existing branch is a superset of it.

**G5 — `tracking_mode` is freely mutable with no history guard.**
`PATCH /api/exercises/[id]` accepts a new `tracking_mode` and
re-derives the legacy column
(`src/app/api/exercises/[id]/route.ts:59-62`) with no check for
existing logged sets. Combined with G3 this is the data-loss path.
Resolved by §5.

## 4. Desired behavior

Straight from the closed decisions; nothing invented here.

**Field contract (D1, Option A).** A distinct fifth mode
`weight_time`. It **reuses** `weight_kg` (external/added weight, not
bodyweight) and `duration_seconds` (the completed hold). `reps` is not
part of the contract and stays `null`. Labels: **"Added weight"** and
**"Duration"**. No combined weight-time value is ever stored.

**Completion and zero (D2, Option A).** Both values must be present
to complete. `weight_kg >= 0`; `duration_seconds > 0`. Zero added
weight is a valid intentional unweighted baseline; zero duration is
invalid; negatives are invalid; `null` weight is **not** zero weight.
A partial entry must not count as completed. Completion attempts with
invalid values fail closed. Editing a completed set must cause
affected record status to be re-evaluated.

**Legacy classification (D3, Option A).** `weight_time` derives
`exercise_type = 'strength'` as an **intentional explicit branch, not
an accidental CASE fallback**. Specialized behavior continues to
branch on the tracking mode, never on the legacy type. No new
`hybrid` legacy type.

**Records and progression (D4, Option C).** A **two-dimensional**
weight/duration record model. **No combined scalar score.** Preserve:
longest hold (displaying its weight), heaviest hold (displaying its
duration), and a weight-time PR when a performance improves the 2-D
frontier. Frontier-improving means no prior performance is equal or
better in **both** dimensions; a tie in one dimension requires strict
improvement in the other. Progression guidance generally changes one
dimension at a time and uses neutral strings.

**RPE and warmups (D5).** Both permitted, reusing existing columns,
**adding no new columns**. Both optional; neither required for
completion. RPE is metadata only — it participates in no record,
progression, ranking or score. Warmup weight_time sets remain visible
in history but are excluded from longest-hold, heaviest-hold,
frontier PRs, progression baselines, and working-set
volume/readiness. A completed warmup must satisfy the same
weight+duration validation. Changing warmup↔working must trigger
recalculation of affected records, summaries and progression inputs.

### 4.1 Copy, zero, and unilateral (O5 — CLOSED)

- The user-facing field name is exactly **"Added weight"**. `weight_kg`
  represents **external load**; it is never relabelled "Bodyweight".
- A stored `0` is intentional and **renders as a real zero**, never
  blank and never as `null`. In history/summary prose it reads
  **"0 lb added"** (or the user's metric equivalent).
- Progression guidance uses the already-approved neutral strings,
  verbatim: **"Try holding this weight slightly longer."** and **"When
  this duration feels controlled, try the next available weight."**
- For unilateral *user-created* weight_time exercises, the
  application's existing **"per side"** semantics are preserved
  (`SetRow.tsx:202`). This milestone does not redesign existing
  unilateral copy.

### 4.2 Two-dimensional frontier display (O6 — CLOSED)

Pareto/frontier model. A completed non-warmup performance **A
dominates B** iff `A.weight_kg >= B.weight_kg AND A.duration_seconds
>= B.duration_seconds AND at least one dimension is strictly greater`.

Consequences:

- exact ties do **not** create a PR;
- a heavier/shorter and a lighter/longer pair may **both** remain
  records;
- a new set is a **"Weight-time PR"** only when no prior qualifying set
  dominates it;
- when a new point dominates prior frontier points, those older points
  **leave the CURRENT frontier but remain in workout history**;
- warmups never participate; RPE remains metadata only.

UI records, exactly three:

1. **Longest hold** — show duration, with its associated added weight.
2. **Heaviest hold** — show added weight, with its associated duration.
3. **Weight-time PR frontier** — a compact list of the current
   non-dominated weight/duration pairs, **sorted by added weight**,
   with **no scalar ranking** between incomparable pairs.

Never created: a weight × time score; an RPE-adjusted score; a
1RM-equivalent score; a single up/down trend derived by collapsing the
two dimensions.

## 5. Mode-transition policy — a DATA-INTEGRITY rule

**Added by the operator's planning review. This is a data-integrity
rule, not UI validation**, and it applies to **all five** tracking
modes, not only `weight_time`.

### 5.1 The rule

1. `tracking_mode` may change **only when ZERO CURRENT `workout_sets`
   rows reference that exercise**. This is deliberately *not* "a set
   has never existed": setup/draft sets may be deleted and the
   mistaken mode then corrected; completed workout history is
   read-only and therefore remains present, so real historical use
   permanently blocks the change; and no audit/history column or table
   is needed to express the rule.
2. While any `workout_sets` row references the exercise, changing
   `tracking_mode` is **rejected — atomically, at the database
   boundary** (§5.4). The Next.js route performs the same check first
   as a friendly precheck and returns 409, but the route is UX, not
   the integrity boundary.
3. **No route may silently null** `weight_kg`, `duration_seconds`,
   `reps`, `distance_meters`, `rpe`, `is_warmup`, or any other stored
   historical dimension as a consequence of a later exercise-mode
   edit.
4. Existing history is **preserved exactly**, never "self-healed"
   into the new mode.

### 5.2 What must be removed

The destructive behaviour named in G3 —
`src/app/api/workout-sets/[id]/route.ts:90-120`, whose own comment
says it "self-heals any stale field left over from a prior
tracking_mode on this row — even if this specific PATCH never touched
it" — **is removed when this feature ships**, and the §5.1 history
guard replaces it. Concretely, these lines exist only to serve the
self-heal and go away with it:

| Lines | Currently nulls / forces | Mode branch |
|---|---|---|
| `:104-105` | `duration_seconds`, `distance_meters` → NULL | weight_reps / bodyweight |
| `:109-112` | `reps`, `weight_kg`, `rpe` → NULL; `is_warmup` → false | cardio |
| `:116-119` | `reps`, `weight_kg`, `distance_meters` → NULL; `is_warmup` → false | timed |

**This is a change to already-shipped behaviour for all four existing
modes, not a weight_time-only change**, and it is the third such
change in this plan (with G1 and the W3 polarity flip). It therefore
gets its own isolated commit and its own before/after proof inside W7
(§16). Two consequences to prove rather than assume:

- With the guard in place, a row can no longer *become* stale, so the
  self-heal has nothing left to repair. Any row that is already stale
  today (from a pre-guard mode switch) keeps its values instead of
  being silently cleaned — which is the intended reading of §5.1(4),
  and is strictly less destructive than today.
- The `Object.keys(update).length === 0` check at `:122-124` currently
  returns *400 "No valid fields to update."* Once the self-heal
  assignments are gone, that branch becomes reachable in cases where
  it previously was not (a PATCH whose only effect was the self-heal).
  The 400 shape must be re-examined against real request bodies, not
  assumed harmless.

### 5.3 Where the guard goes, and the precedent it follows

The **same route file already implements this exact shape** in its
DELETE half (`src/app/api/exercises/[id]/route.ts:150-159`):

```ts
// Check for workout_exercises referencing this exercise
const { count } = await supabase
  .from('workout_exercises').select('id', { count: 'exact', head: true })
  .eq('exercise_id', params.id)
if (count && count > 0) {
  return NextResponse.json(
    { error: 'This exercise has workout history. Deactivate it instead of deleting.' },
    { status: 409 }
  )
}
```

The mode-transition guard should follow it: same file, same 409, same
message idiom. One deliberate difference: DELETE counts
**`workout_exercises`** (the exercise having been *added* to a
workout), while §5.1 says **workout sets**. Those are different
populations — an exercise can sit in an in-progress workout with zero
sets logged — and the narrower predicate is the correct one here,
because it is what lets a user fix a mis-chosen mode during setup. The
divergence is intentional and should be commented as such so a later
reader does not "harmonize" the two.

The route also maps the database guard's controlled error
(`tracking_mode_has_workout_history`, §5.4) to the same 409, so a
change that slips past the precheck and is rejected by the trigger
reaches the user as the same message rather than a generic 500.

### 5.4 Why a route-level guard is necessary but **not sufficient** — and the DB enforcement that closes it (O8, option (b))

Two limits, both established from the tree rather than assumed:

**(a) It is bypassable.** Migration 021's own final-review comment
states it plainly (`021:472-477`):

> `tracking_mode` is MUTABLE — the exercises PATCH route supports
> changing it after use, and RLS + the authenticated UPDATE grant let
> a direct Data API caller change it too (every exercise row,
> including seeded defaults, is a per-user row owned by the caller…)

So an authenticated client can `UPDATE exercises SET tracking_mode`
through the Data API without ever touching the Next.js route, and a
route-only guard never runs.

**(b) It races.** The guard reads a count with no lock and then
issues the UPDATE. `append_workout_set` takes `FOR UPDATE` on the
exercises row *before* validating (`021:487-490`; the rationale is the
comment at `021:472-486`). Both interleavings lose:

- append commits between the guard's count and the mode UPDATE → the
  guard saw zero sets, the UPDATE proceeds, and a set validated
  against the **old** mode now hangs off the **new** mode;
- append is still in flight holding the row lock → the mode UPDATE
  waits, then commits after it — same end state.

`append_workout_set` is correct for its own concern (it always
validates against the authoritative locked mode); the race is on the
*other* side, and only the mode-changing statement can close it.

**RESOLVED (O8, option (b)): the invariant is enforced at the
database boundary in migration 028.** The trigger's contract, in the
operator's words:

```
OLD.tracking_mode IS DISTINCT FROM NEW.tracking_mode
AND extant workout_sets exist for this exercise
=> reject atomically
```

Design as planned (authored in W6, not here): a `BEFORE UPDATE OF
tracking_mode ON exercises FOR EACH ROW` trigger, firing only `WHEN
(OLD.tracking_mode IS DISTINCT FROM NEW.tracking_mode)`, whose function
tests `EXISTS (SELECT 1 FROM workout_sets ws JOIN workout_exercises we
ON we.id = ws.workout_exercise_id WHERE we.exercise_id = NEW.id)` and
raises the **controlled, machine-mappable error
`tracking_mode_has_workout_history`**, which the route maps to HTTP
409. No new history table, column, or audit structure is added to make
this work.

**The DB proof (W6, on the disposable cluster) must include all
seven:**

1. an authenticated direct Data API `UPDATE` cannot bypass the guard
   (locally: a direct SQL `UPDATE` as the `authenticated` role, the
   disposable-cluster equivalent of a Data API call);
2. an exercise with no sets can change mode;
3. an exercise with an extant *incomplete* set cannot change mode;
4. an exercise with completed historical sets cannot change mode;
5. after all permissible draft/setup sets are deleted, the mode change
   is allowed again;
6. a same-mode `UPDATE` remains allowed;
7. an unrelated exercise-field `UPDATE` remains allowed.

**Concurrency proof is REQUIRED — exercised, not assumed.**
`append_workout_set` locks the authoritative `exercises` row `FOR
UPDATE` before its mode-dependent validation and insert
(`021:487-490`). Both interleavings must be driven on the disposable
database with two real sessions:

- **A. The mode change obtains the row first:** it sees zero sets and
  commits; append waits on the row lock; append then re-reads the
  **new** mode and validates/inserts against it.
- **B. Append obtains the row first:** append inserts while holding the
  exercise-row lock; the mode `UPDATE` waits; after append commits, the
  mode `UPDATE` **must observe the new set and reject**.

The mechanism by which B is *expected* to hold: a `BEFORE ROW UPDATE`
trigger acquires the tuple lock before it fires, so the waiting
`UPDATE` proceeds only after append's commit; the trigger function is
`VOLATILE`, so under READ COMMITTED its `EXISTS` takes a fresh snapshot
and sees the committed set. **That expectation is not evidence.** If
the proposed trigger cannot prove B on the disposable database, **STOP
and redesign the locking boundary before continuing** — do not weaken
the assertion and do not proceed to W7.

### 5.5 Why this matters more once `weight_time` exists

A fifth mode adds four new switch directions. One of them,
`weight_time → timed`, destroys the weight that is the entire reason
the mode exists (G3) — silently, and later than the action that caused
it. `timed → weight_time` is harmless. `weight_reps → weight_time`
would, under today's self-heal, null `reps` per D1. Under §5 none of
these transitions is reachable on an exercise with history at all,
which is why the policy replaces the per-direction analysis instead of
extending it.

## 6. Calculation and time-zone semantics

**No time zone applies to the measurement.** `duration_seconds` is an
`INTEGER` count of elapsed seconds — a scalar duration, not an
instant. There is no timestamp in the weight_time contract, so no
conversion, no DST edge, no locale. Range enforced at `021:438`:
`0 <= duration_seconds <= 86400`.

**The only date is inherited, unchanged.**
`workout_sessions.workout_date` is a bare `DATE NOT NULL DEFAULT
CURRENT_DATE` (`003:58`) — i.e. the *Postgres server's* current date
when the row is created, not the user's local date. Records order and
date by that column as an ISO string
(`strength-records.ts:246`, `:390`). This is pre-existing for all
four modes. **weight_time must inherit it verbatim and must not
introduce a second dating convention.** Any change to date semantics
is a separate concern affecting every mode and is explicitly out of
scope here.

**Weight units.** Stored as `weight_kg NUMERIC(6,2)`. The UI
transacts lbs and converts with `Math.round(lbsToKg(x) * 100) / 100`
(`workout-sets/[id]/route.ts:65`). weight_time reuses this
unchanged — except for the zero case (G2), where the existing
`> 0` truthiness guard is wrong for this mode.

**The 2-D frontier, precisely (O6).** A working performance is the
pair `(weight_kg, duration_seconds)`. A completed non-warmup
performance `A` **dominates** `B` iff `A.weight_kg >= B.weight_kg AND
A.duration_seconds >= B.duration_seconds` and at least one dimension is
strictly greater. A new set is a **Weight-time PR** iff no prior
qualifying set dominates it; an exact tie is therefore never a PR, and
a tie in one dimension requires strict improvement in the other (D4).
The **current frontier** is the set of non-dominated pairs; a point
that becomes dominated leaves the current frontier but stays in
workout history. Display rules are fixed in §4.2.

- **No scalar.** No `weight × duration`, no "weighted seconds", no
  normalization. This is a hard D4 prohibition and the single easiest
  thing to accidentally reintroduce (`setScore` in `workout.ts` is
  exactly such a scalar for other modes).
- **Three derived quantities** per exercise, all-time: longest hold
  (max duration, carrying its weight for display), heaviest hold (max
  weight, carrying its duration), and the frontier itself.
- **Aggregation window:** all-time, matching both existing record
  modules.
- **Set-level, not session-representative.** Following the Phase 2V
  precedent (`src/lib/supabase/server.ts:714-891`), whose own header
  states it scans "every qualifying historical set" rather than one
  representative per session precisely because "the all-time best
  distance, longest duration, and best pace may each come from
  DIFFERENT sets" (`server.ts:716-721`). The same reasoning applies
  with more force to a two-dimensional frontier.
- **Warmups excluded** from all three (D5) but retained in history.
- **RPE excluded** from all three (D5).
- **Zero-weight holds participate.** A `(0, 120)` performance is a
  legitimate frontier point and can be the longest hold.
- **Unilateral: no admitted entry needs it, but the path stays
  reachable.** All five admitted entries are bilateral (§1.1) — the
  one unilateral weight_time candidate, Suitcase carry, is a deferred
  carry. But `unilateral` is user-settable, so a hand-created
  unilateral weighted hold must still render and label correctly;
  `SetRow.tsx:202` (`weightSuffix = isUnilateral ? 'per side' : 'lbs'`)
  is the concrete site. This is a **correction to revision 1**, which
  claimed the unilateral machinery would have a weight_time consumer
  from day one; with carries deferred it has none in the *catalog*,
  only in user-created exercises.

## 7. Historical-data implications

**No backfill, and no reinterpretation of any existing row. No
successful `weight_time` implementation is allowed to reinterpret old
workout history.** Zero rows can currently be `weight_time` because
both CHECKs forbid the value, so there is no historical population to
migrate. This mirrors migration 011's own reasoning verbatim ("No
backfill: these values were never previously capturable in any form,
for any exercise", `011:10-13`).

**But there is unrecoverable historical loss, and the plan must not
pretend otherwise.** Users who already logged weighted holds had to
pick a lossy mode:

- logged as `timed` → the weight was **never stored** (`021:507`
  rejected it outright);
- logged as `weight_reps` → the duration was **never stored**
  (`021:498` rejected it).

No migration can recover a number that was never written. **O4 is
CLOSED: no retroactive guidance this release.** The implementation
does not reinterpret or migrate historical strength/timed sets, does
not infer that any prior hold was mis-logged, and adds no
migration/backfill/banner behaviour; existing history remains
byte/data-preserved. A later *diagnostic* may be considered only if
actual data demonstrates a need — and that would be its own decision.

**Mode-switch history was the live risk; §5 closes it.** Revision 1
identified this as the strongest argument for a history guard, and the
review has now ruled it. The residual exposure is the bypass and race
in §5.4, tracked as O8.

## 8. API and service changes

### 8.1 Types and vocabulary (must move as one set)

| File | Change | Silent if missed? |
|---|---|---|
| `src/types/database.ts:343` | add `\| 'weight_time'` to `TrackingMode` | no — breaks `deriveLegacyExerciseType` |
| `src/lib/exercise-validation.ts:134` | add to `TRACKING_MODES` const (drives `validateTrackingMode` at `:290`) | **yes** |
| `src/lib/exercise-validation.ts:306` | explicit `case 'weight_time': return 'strength'` (D3) | no — compile error |
| `src/lib/constants.ts:233` | add label option | **yes** |
| `src/lib/progress-overview.ts:96` | add to `VALID_MODE_FILTERS` | **yes** |

`validateTrackingMode` already fails closed on unknown values via
membership testing; no logic change, only the vocabulary.

**The pill/parse pair is asymmetric, and the ordering exploits that.**
A visible pill with no parser silently filters to "All" (a real bug); a
parser with no pill is an unreachable URL that would correctly show an
empty mode. So `VALID_MODE_FILTERS` may safely land early (W4) while
the user-visible `constants.ts` label lands with the UI (W10). See
§16's ordering note.

### 8.2 `POST /api/workout-exercises/[id]/sets`

Add the `MODE_ALLOWED_FIELDS` key: `weight_kg`, `weight_lbs`,
`duration_seconds`, `rpe`, `is_warmup` — **not** `reps`, **not**
`distance_meters` (D1). Add the explicit per-mode insert branch. Fix
the lbs→kg zero collapse (G2). Add the completion requirement: both
present, `weight_kg >= 0`, `duration_seconds > 0`.

### 8.3 `PATCH /api/workout-sets/[id]`

Add the `MODE_ALLOWED_FIELDS` key. **Remove the self-heal entirely
per §5.2** rather than adding a fifth self-heal branch — the
`weight_time` arm applies `weight_kg`, `duration_seconds`, `rpe`,
`is_warmup` when sent and touches nothing else. Add completion
validation against the final merged state, matching the existing shape
at `:79-88`. Fix the zero collapse (G2). Re-examine the `:122-124`
400 (§5.2). Trigger record re-evaluation on edit and on
warmup↔working change (D2, D5).

### 8.4 `POST /api/workout-exercises/[id]/apply-first-set`

Add the `MODE_COPY_FIELDS` key (`weight_kg`, `duration_seconds`;
`rpe` per the existing pattern for other modes). Consider guarding
the server-side lookup (`:60`) the way the client already does —
currently an unknown mode is an unhandled 500 rather than a 400.

The **client** half must move with it, and gets no compiler help:
`APPLY_COPY_FIELDS` in `WorkoutExerciseBlock.tsx:266` needs the same
key, and `applyRequiredReady` (`:273-279`) needs a weight_time branch
requiring **both** values, not just duration.

### 8.5 `PATCH /api/exercises/[id]` — the history guard

New: the §5.1 precheck, before the `updatePayload` is built
(`src/app/api/exercises/[id]/route.ts:59-62`). Reject a
`tracking_mode` change with 409 when any `workout_sets` row references
the exercise; leave every other field's behaviour untouched, including
the `deriveLegacyExerciseType` refresh for the permitted (no-set)
case. Also map the trigger's `tracking_mode_has_workout_history` error
to the same 409 (§5.3). The route is UX; the integrity boundary is the
028 trigger (§5.4).

### 8.6 `append_workout_set` (migration 028)

- New `ELSIF v_tracking_mode = 'weight_time'` field gate: reject
  non-null `reps` and `distance_meters`; permit `weight_kg`, `rpe`,
  `is_warmup` (G4 — **warmups permitted**, unlike cardio/timed).
- New completion requirement inside the existing `IF v_completed`
  block (`021:515-524`): both values present, `duration_seconds > 0`.
- **Relax the weight lower bound mode-dependently (G1)** — the one
  change that touches shared, already-shipped validation. Must be
  proven behaviour-identical for `weight_reps`/`bodyweight`.
- No signature change: all parameters already exist.
- The `ELSE RAISE EXCEPTION 'invalid_input'` stays as the fail-closed
  floor.

### 8.7 Records service — a third parallel module

Do **not** extend `strength-records.ts`. The Phase 2V block's own
header records the rule: the cardio/timed reader "Lives here (not
strength-records.ts) because strength-records.ts is intentionally
strength-only" (`src/lib/supabase/server.ts:720-721`).

The precedent is explicit: add a **third** reader alongside
`fetchCardioTimedRecords`, scanning every qualifying set, emitting a
2-D frontier plus longest/heaviest holds. Concretely:

- **Flip `strength-records.ts:286` and `:320` from denylist to
  allowlist** — scheduled as **W3, before the union is widened**
  (§16). It is a *correctness fix independent of weight_time*: the
  denylist form means every future mode leaks in by default.
- `evaluateSetPRs` takes no mode argument; its caller must gate it.
- The new module needs `duration_seconds` in its select — the
  strength `RawSet` shape does not have it.

### 8.8 `src/lib/workout.ts` — 13 sites

Explicit `weight_time` branches in `formatTrackingAwareSetSummary`
(must render both dimensions), the representative-set picker (must
**not** reach the cardio pace branch), `trackingAwareProgressSignal`
(must apply 2-D dominance, never duration-only — this is where the
D4 violation would land), `buildIncreaseSuggestion`,
`evaluateSetTargetFeedback` and `suggestNextTarget` (neutral,
one-dimension-at-a-time guidance). `setScore` and `bestSet` must
either gain a weight_time path or be explicitly excluded — and
excluding them is preferable, because `setScore` *is* the forbidden
scalar.

### 8.9 `deliver_catalog_exercises` (migration 028)

Both `tracking_mode → exercise_type` CASEs in the live body
(`026:393-398` and `026:476-481`) gain an explicit
`WHEN 'weight_time' THEN 'strength'` ahead of the `ELSE` (D3; §17).
No signature change; no behaviour change for the four existing values,
which must be proven, not assumed. This is SQL, so it lands in **W6**
as part of the migration (§10.2) — it cannot land with the UI.

### 8.10 `exercises` tracking-mode history guard (migration 028)

The O8 trigger of §5.4, raising `tracking_mode_has_workout_history`,
with its seven-point proof and the A/B concurrency proof. Authored in
W6; nothing here is SQL.

## 9. UI surfaces affected

| Surface | File | Required |
|---|---|---|
| Set entry row | `src/components/workout/SetRow.tsx` (8 sites) | new branch rendering **Added weight** + **Duration** (+ optional RPE, warmup toggle). Without it: no inputs at all. Includes the `isUnilateral` weight suffix at `:202` (§6) |
| Exercise block | `src/components/workout/WorkoutExerciseBlock.tsx` (10 sites) | column headers (`:501-527`, no `else` today); `isCardioOrTimed` (`:112`) representative-set/signal choice; `handleAddSet`'s accidental `else // timed`; `applyRequiredReady`'s final branch must require **both** values |
| Exercise create/edit form | `ExerciseForm` PillGroup via `constants.ts:233` | new selectable mode with its label — **the gate that makes weight_time user-reachable**, hence W10 |
| Progress filter pills | `src/app/(app)/progress/page.tsx:309` + `progress-overview.ts:96` | both lists agree by W10; the parser may land earlier (§8.1) |
| Exercise progress detail | `src/app/(app)/progress/exercises/[id]/page.tsx:123` (`isCardioTimed`) | must route weight_time to the new 2-D view, not the strength charts |
| Records/PR surfaces | wherever `StrengthRecord` / cardio-timed aggregates render | exactly the three O6 records (§4.2): longest hold with its added weight, heaviest hold with its duration, and the compact current-frontier list sorted by added weight; never a single ranked number |
| Exercise edit — mode change | `ExerciseForm` + `PATCH /api/exercises/[id]` | surface the §5 rejection as a clear message, not a generic 409 |
| Check-in label | via `constants.ts` | inherits |

## 10. Migration need — conclusion

**A migration IS required, and its scope is exactly two CHECK
constraint replacements plus the `append_workout_set` changes.**

### 10.1 Migration identity — 028, resolved from durable evidence

**The next migration is `028`.** This is taken from the committed
EXLIB-2M application record
(`docs/exlib2m-migration-027-application-record.md`), which documents
that 027 was applied to hosted ShredOS on 2026-09-02 19:45:41 UTC and
that "the REPOSITORY schema/migration sequence effective on hosted
ShredOS is now 001-027". No Supabase contact was made or is needed to
rediscover this preserved fact.

**Why 027's own header does not contradict this.** The migration file
still says "NOT APPLIED during EXLIB-2M". That statement is phase-local
historical prose — true as written of the apply-prep phase, and
byte-frozen because any byte change to 027 would void its
reviewed/applied status. The later application record supersedes it as
a statement of *current hosted state*, and says so itself (its §4:
"byte-frozen history that remain true AS WRITTEN of their own phase").
**027 is not renamed, edited, or annotated.**

**028 is not authored by this plan.** Revision 1 guessed `028`;
revision 2 replaced the guess with a placeholder pending confirmation;
revision 3 records the confirmed number. Authoring waits for its own
instruction after the W1–W3 checkpoint.

### 10.2 Scope — CONFIRMED by the operator

Required because the value is rejected by two CHECKs
(`010:26-28`, `023:384-385`) and by `append_workout_set`'s per-mode
gate. **Migration 028 is authorized in the PLAN to contain exactly:**

- the tracking-mode CHECK widening(s) — both constraints, by their
  installed names (W2);
- the `append_workout_set` `weight_time` branch (the G4-aware field
  gate: warmups permitted, `reps`/`distance_meters` rejected);
- mode-dependent zero-weight validation (G1: `>= 0` for weight_time,
  `> 0` preserved for `weight_reps`/`bodyweight`);
- `weight_time` completion semantics (both values present,
  `duration_seconds > 0`);
- the DB-level `tracking_mode` history guard from O8 (§5.4, §8.10);
- `CREATE OR REPLACE deliver_catalog_exercises` so **both**
  migration-026 CASE sites explicitly map `weight_time` to legacy
  `strength` (§8.9, §17). **Explicitly IN SCOPE by operator decision**
  — revision 2's scope note is resolved. 027 does not redefine this
  function, so the change is **not coupled to 027 ordering**.

Explicitly **NOT** in scope:

- **no new `workout_sets` columns** (D5: "add no new columns");
- **no combined score column** (D4);
- **no carry-distance change** (O9);
- **no catalog admission** in this migration (W14 is its own act);
- **no cross-column CHECK** on `workout_sets` unless later evidence
  demonstrates it is necessary — completion rules live in the write
  paths for every existing mode and weight_time must not invent a
  second enforcement layer;
- no trigger on `workout_sets` (none exists today; the O8 trigger is
  on `exercises`);
- no new index, no new table, no new history/audit table (S14, O8).

### 10.3 Preconditions before a single line of SQL is written

1. Discover both installed constraint names mechanically from
   `pg_constraint` on a disposable database (**W2**). They are unnamed
   inline in the committed SQL. Re-add with the same, now-explicit
   stable names — the 025 precedent. The `DROP CONSTRAINT` by
   discovered name is itself fail-closed: if hosted carries a
   different name, the transaction aborts and nothing is half-applied.
2. Hosted applied-migration boundary — **DONE**: 001–027 in effect,
   next = 028 (§10.1).
3. 027 ordering — **moot**: 027 is applied. It does not redefine
   `deliver_catalog_exercises` (§17). Its manifest-digest binding of
   `tracking_mode` (`027:475`) and its immutability trigger (`027:151`)
   matter only when a `weight_time` *catalog* row is loaded, i.e. at
   W14, not in 028.

**Per B2's standing prohibition, a schema-only or bare-CHECK
expansion is not acceptable.** The migration and full product support
must land as one coordinated release — the same rule that shaped 025
(`docs/exlib1c0b3-coordinated-equipment-implementation.md:21-23`).

## 11. Backward compatibility

**Safe by construction:**

- No existing row changes. No column changes. No backfill.
- Every existing CHECK value is preserved; the constraints are only
  widened.
- `validateTrackingMode` keeps failing closed on genuinely unknown
  values.
- `append_workout_set`'s `ELSE RAISE EXCEPTION 'invalid_input'` floor
  is untouched.
- `repeat_workout` (`022:388-398`) copies sets with every value field
  NULL, mode-agnostic — **needs no change**.
- `load_catalog_snapshot` is value-agnostic.
- The four existing modes' UI and records paths are untouched *if*
  every new branch is additive.

**Requires proof, not assertion — the four changes to shipped
behaviour:**

- **W3, the denylist→allowlist flip** changes what
  `fetchStrengthRecords` collects. For the four existing modes the
  result must be identical. Landing it *before* the union is widened
  makes this provable by exhaustion over a closed 4-value vocabulary
  (§16).
- **G1, the mode-dependent weight lower bound.** Moving the
  `weight_kg` lower bound after the locked mode read must be shown
  behaviour-identical for `weight_reps` and `bodyweight`, including
  that `0` and negative weights are still rejected for them and that
  the pre-lock cheap-rejection property is relaxed for that one bound
  only.
- **§5.2, removing the PATCH self-heal.** This changes edit behaviour
  for all four existing modes: a row that is stale today keeps its
  values instead of being silently cleaned. Strictly less destructive,
  but a behaviour change, and the `:122-124` 400 path must be
  re-examined.
- **§5.4, the 028 history-guard trigger.** Today a `tracking_mode`
  change is accepted regardless of logged sets; after 028 it is
  rejected whenever any `workout_sets` row references the exercise.
  That is a deliberate restriction of shipped behaviour for all four
  existing modes, proven by the seven-point DB proof and the A/B
  concurrency proof (§12.1).

**Not compatibility breaks, but they will go red:** the **eleven**
inverting boundary assertions (§13) each need a deliberate,
count-neutral retarget.

**Forward-only risk:** once any user has a weight_time row, the CHECK
cannot be contracted (audit §7). Rollback becomes forward-only from
first adoption, not from application.

## 12. Testing strategy

There is **no `test` script** in `package.json` — only `dev`,
`build`, `start`, `lint`, `type-check`. Verification in this repo is
the 120 files in `scripts/`: `verify-*.ts` run under `tsx`, plus 15
`verify-*-live.sh` suites against a disposable local Postgres. The
plan must follow that, not introduce a new framework.

**1. Disposable live SQL suite** — modelled directly on
`scripts/verify-exlib1c0b3-live.sh` (fingerprint-gated *before*
`initdb`, unix-socket only, no TCP, torn down on exit, never contacts
Supabase/Vercel). Must prove:

- exact migrations `001..N` apply cleanly in order;
- **both** widened CHECK definitions read back from `pg_constraint`
  with their exact stable names and exact 5-value definitions;
- all four legacy values still insert; `weight_time` inserts; an
  unknown value **fails closed**;
- `append_workout_set` accepts a valid weight_time set; rejects
  non-null `reps`; rejects non-null `distance_meters`; **accepts
  `weight_kg = 0`**; rejects `duration_seconds = 0` when completing;
  rejects negatives; **accepts `is_warmup = true`** (G4);
- **negative controls, classified** — not just deletions. A DELETE
  control only proves text is required. Include SUBSTITUTE (swap a
  value in the CHECK list) and ADD (append a contradictory clause
  *beside* intact text) controls, and reproduce each defect before
  claiming the control is red;
- **behaviour-preservation controls for G1**: `weight_reps` with
  `weight_kg = 0` still rejected; with `-1` still rejected; with
  `1001` still rejected pre-lock;
- the live `deliver_catalog_exercises` body, read back via
  `pg_get_functiondef`, contains the explicit `weight_time` branch in
  **both** CASEs (§8.9) — a single-occurrence fix must fail this;
- atomicity: with the second targeted constraint pre-dropped, the
  migration fails closed and the first CHECK is left byte-identical.

**Mode-transition guard proof (O8), same disposable cluster, W6:**
all seven points of §5.4 (a direct SQL `UPDATE` as the `authenticated`
role cannot bypass; a no-set exercise may change; an extant incomplete
set blocks; completed history blocks; deleting all draft sets
re-permits; a same-mode `UPDATE` is allowed; an unrelated-field
`UPDATE` is allowed), the error raised is exactly
`tracking_mode_has_workout_history`, **and both concurrency
interleavings A and B driven with two real sessions** — not inferred
from PostgreSQL semantics. B failing to reject is a **STOP and
redesign**, not a finding to explain away.

**2. Deterministic verifier** (`verify-*.ts`) — the vocabulary set in
all five source-of-truth locations (§8.1) is exactly the same
5-value set; `deriveLegacyExerciseType` returns `'strength'` for
`weight_time` via an explicit case; **`constants.ts` and
`VALID_MODE_FILTERS` agree** (the pill/parse pair); no scalar
weight×duration expression exists anywhere in the new records module;
**both** migration-026 CASEs carry an explicit `weight_time` branch
(§17).

**3. Runtime behaviour proof, executing the real code** — the 025
precedent ("Runtime progression proof (executing the real
`suggestNextTarget` code)"). Feed constructed set arrays through the
actual functions and assert:

- 2-D dominance: `(20,30)` then `(0,60)` → **not** an improvement
  claim in either direction (the D4 case);
- ties: `(20,60)` after `(20,60)` → no PR; `(20,61)` → PR;
- zero-weight baseline `(0,120)` is the longest hold and is not
  dropped by any qualifying filter;
- warmups excluded from all three derived quantities but present in
  history (D5);
- RPE changes never alter any record or suggestion (D5);
- O6 frontier cases: an exact tie `(20,60)` after `(20,60)` → no PR;
  `(20,30)` and `(0,60)` → both remain on the current frontier
  (incomparable); `(25,70)` after both → a PR that removes both from
  the current frontier while they stay in history; the frontier list
  is sorted by added weight and carries no scalar rank;
- O5 rendering: a stored `0` renders as `0` / "0 lb added" in the real
  formatter, never blank, never `null`, never "Bodyweight";
- the four existing modes produce byte-identical output before and
  after — for W3, for G1, and for the §5.2 self-heal removal.

**4. Guard before repair.** Write the census/guard **first** (W1) and
let its output be the worklist: a script that enumerates every
mode-literal branch site and every `Record<TrackingMode, …>` and
fails if any lacks a `weight_time` arm. Written after a hand cleanup
it could only be demonstrated on a corpus with no defects left. The
W1 census (58 decision sites / 14 files at `14a36567`) is the
authoritative worklist; §3's older 53/9 grep table is historical.

**5. Mode-transition route tests (§5.3, UX layer)** — an exercise with
any referencing `workout_sets` row gets 409 from the precheck; a
no-set exercise is permitted and still refreshes the legacy type; a
permitted change nulls nothing; a rejected change writes nothing at
all (including no partial `updatePayload` write); and the trigger's
`tracking_mode_has_workout_history` error, when it is the one that
fires, is mapped to the same 409. The **integrity** proof is the DB
proof in §12.1 — the route tests do not substitute for it.

**6. Real-UI verification against a LOCAL stack only**, behind
`scripts/verify-exlib1c0b3-guard.sh` (or its successor) — the
mandatory pre-browser assertion from the 2026-08-26 boundary
incident. Start the local stack first, materialize local-only
overrides, resolve the *effective* `NEXT_PUBLIC_SUPABASE_URL` the dev
server would see, reject any non-loopback host, and only then launch
a browser. Fail closed before browser launch otherwise.

**7. `npm run lint` and `npm run type-check` must both exit 0.** Read
`$?`; do not grep output to establish a verdict. **"Lint 0" means zero
ERRORS, not zero warnings** (corrected 2026-09-10, W12-A): the repo
carries an accepted ratchet of **125** `@typescript-eslint/no-explicit-any`
warnings — a backlog that predates this milestone (139 at the
lint-baseline commit `0e10d7b`, 125 at the pre-W8 tip `bf3bc020`) and
that the rule is deliberately set to `warn` to keep visible. The gate is
therefore: exit 0, **0 errors**, `no-explicit-any` still `warn`, warning
count **≤ 125**, and **no warning rule ID other than
`@typescript-eslint/no-explicit-any`**. Reducing real warnings is
allowed; making them disappear by editing the config, the plugin
registration, the rule severity, the lint scope or an ignore file is
**not** — that is a STOP, not a pass.

## 13. Rollout sequence

One coordinated release (B2 prohibition), sequenced so that nothing
observable changes until everything is ready. The stage numbers are
the W-steps of §16.

| W | Stage | Gate |
|---|---|---|
| W0 | **DONE 2026-09-09** — operator review closed O4–O8 and confirmed 028's scope; O9 open by design | operator only |
| W1 | Census + guard script (fails on today's tree; output is the worklist) | local |
| W2 | Discover both installed constraint names from `pg_constraint` on a disposable DB | local |
| W3 | **strength-records denylist → explicit allowlist**, isolated, proven equivalent for all shipped modes | local runtime proof |
| W4 | Tracking-mode vocabulary + exhaustive-switch work (`constants.ts` label held for W10) | local, `tsc` + guard |
| W5 | Mode-dependent zero-weight validation / persistence semantics — specified and proven red first | local (controls fail) |
| W6 | Migration 028: two CHECK widenings, `append_workout_set` contract changes (incl. G1), the O8 history-guard trigger with its seven-point + A/B proof, `deliver_catalog_exercises` CASE branches | local live suite |
| W7 | API routes: zero-preservation, history-guard precheck + 409 error mapping, self-heal removal | local, route tests |
| W8 | Dedicated 2-D weight_time records logic | local runtime proof |
| W9 | Workout-domain integration (`workout.ts`, 13 sites) | local runtime proof |
| W10 | UI, including the selectable mode label | local UI verification behind the loopback guard |
| W10.5 | Stabilisation: the seven design calls as ruled (no scalar direction for a trade-off, `representativeHold`, duration-only guidance, Recent-PR merge with its preservation proof), lint discrepancy explained | local runtime proof + machine-readable lint audit |
| W11 | Historical verifier retargets per the GENERATED ledger `docs/weight-time-w11-failure-ledger.json` (its own totals are the scope — never restated here) — labelled, historical claims preserved against their tips, **count-neutral** | full suite green |
| W12 | **Local review / release-package preparation ONLY — NO PUSH.** Full suite green (113 TS + 15 live shell); lint exit 0 with 0 errors and ≤ 125 `no-explicit-any` warnings and no other rule ID; type-check 0; 028 line-by-line release review; application diff + end-to-end trace review; local sanitized production build; local UI QA (or a recorded blocker); frozen candidate + verified review bundle for independent review | local only |
| W13 | **Coordinated DB-first / app-second hosted release — Joseph/ChatGPT only**, ShredOS (`ttybyljytiwntvorugcv`) only, under its own explicit one-use instruction, in this exact order: (1) apply the exact reviewed migration 028; (2) verify hosted DB state; (3) promote/push the exact independently-reviewed application tip; (4) allow the Git-linked Production deployment; (5) observe READY and perform bounded hosted QA | operator |
| W14 | Catalog admission of the **five** entries — separate authorization | operator |

**W11 SCOPE (errata, 2026-09-10, W7.5-C).** The eleven suites below
remain part of W11 but are **no longer its extent**. W11's exact scope
is the generated, machine-readable failure ledger
`docs/weight-time-w11-failure-ledger.json` (twin `.md`), produced by
`scripts/generate-weight-time-w11-ledger.ts` from a clean worktree of
the committed tree and bisected across the W-step commits: **55 suites /
65 failing checks caused by W4–W7** — 45 MIGRATION_INVENTORY_RETARGET
(first red at W6: phase claims of "migrations exactly 001-0NN / no 028"
that must be preserved against their historical commits and admit the
reviewed 028 by exact filename), 15 WEIGHT_TIME_BOUNDARY_RETARGET
(first red at W4: preserve the zero-weight_time boundary against the
historical tip and add the reviewed current-state admission), 2
ROUTE_TEXT_RETARGET (first red at W7: `verify-phase5a6b` "PATCH fetches
the stored primary", `verify-ui5b1b` S4), 2 AUDIT_COMPLETENESS_RETARGET
(`verify-exlib1c0b` C1 and D1 — the byte-frozen audit cannot name
post-audit artifacts; admit by name with proof of absence at the
closeout tip, the pattern that file already applies), and 1
OTHER_REQUIRES_REVIEW (`verify-exlib2f` C1 "no product change", a
HEAD-relative product-boundary pin, first red at W4 — operator review
before any retarget). The ledger is regenerated, never hand-edited.
**Outside W11:** the three verifiers that were red BEFORE W4
(`verify-exlib1c0b` D2, `verify-exlib3a-option-a` A7,
`verify-exlib3a-option-a-application` C14) were lifecycle pins stale
after normal post-closeout development and were retargeted in W7.5-B.

**W8–W10 DONE; W11 SCOPE REGENERATED (errata, 2026-09-10).** W8
`dc8f10b7`, W9 `69b7c7c9`, W10 `97442e22` landed as three plain forward
commits (§16 rows). The census reached its exit condition: **0 pending**,
59 live sites (HANDLES 32 / EXCLUDES 27), conservation of the accepted 58
= 8 HANDLES + 17 EXCLUDES + 33 ELIMINATED_BY_REFACTOR + 0 PENDING, every
elimination naming a decided live owner (six at W9: exhaustive switches
and executable mode sets; fifteen at W10: hoisted SetRow predicates, the
`COLUMN_HEADERS` map, the shared Apply contract). The ledger generator
(`c4dcb325`) now bisects PRE_W4 → W4 … → W10 and applies two rulings by
deterministic pattern: **HISTORICAL_PRODUCT_BOUNDARY_RETARGET** for
`verify-exlib2f` C1 "no product change" (the operator's W7.5-checkpoint
ruling — EXLIB-2F's claim remains true of its own tip, W4 is a legitimate
later product boundary; W11 owns the retarget, nothing retargeted yet) and
**UI_SURFACE_RETARGET** for the W10 user-facing pins. The W7 figure of
55 / 65 was a baseline only. **The regenerated ledger (generator
`c3e72478`, measured from a clean worktree of that tree, JSON sha256
`fea8ee0590cd6e4b84a0bef81a1922d36dd59fb4c1e49ab0a9cb6e25fbe7c181`)
is W11's exact scope: 59 suites / 74 failing checks caused by W4–W10 —
45 MIGRATION_INVENTORY_RETARGET, 15 WEIGHT_TIME_BOUNDARY_RETARGET, 2
ROUTE_TEXT_RETARGET, 2 AUDIT_COMPLETENESS_RETARGET (`verify-exlib1c0b`
C1 and D1; D1 first red at W9 because `workout-coach.ts` now names
`tracking_mode`), 1 HISTORICAL_PRODUCT_BOUNDARY_RETARGET (`verify-exlib2f`
C1), 9 UI_SURFACE_RETARGET (first red at W10: `verify-phase4b5` summary
tiles, `verify-phase4b6a` detail-client contract, `verify-phase4b6b`
completion summary + warm-up toggle, `verify-phase5a2` summary/PR
pipeline, `verify-ui5a` X4, `verify-ui5b1a` S7, `verify-ui5b1b` A2 and
A9), 0 OTHER_REQUIRES_REVIEW; pre-existing at PRE_W4 0, unattributed 0,
crashed 0, 53 suites green.** These totals supersede every count in this
section and in the §16 W11 row. Own-suite retargets made during
W8–W10, all labelled and count-neutral: `verify-exlib1c0b` D2 (the W8–W10
suite names admitted under the existing absent-at-closeout proof),
`verify-exlib3a-option-a` A7 (census-marker comment lines admitted in any
src file), `verify-weight-time-w4-vocabulary` C1/C2 (label now present,
evaluated against the W4 tip; copy list lives in the contract),
`verify-weight-time-contract` E4 (copy set proven in the contract module).

**W10.5 DONE (errata, 2026-09-10).** Stabilisation under the W8–W10
checkpoint disposition, in five plain forward commits: `69aa1a8`
(the seven design calls), `e5f8735` and `92cfec6` (generator: the W10.5
bisect step, three Recent-PR page-text pins classified
`UI_SURFACE_RETARGET`), `a247013` (a comment reworded because the word
"allowlist" in a new header re-tripped the `verify-exlib3a-option-a` A7
keyword grep), `72c81ac` (the regenerated W10.5 ledger).

- **A1 `representativeHold`** — the longest qualifying hold (tie →
  heavier → deterministic historical order) is a **display selection**,
  named `representativeHold` / `pickRepresentativeHold` everywhere; no
  weight_time code path names a "best", "top" or "leading set", and it
  feeds no scalar, no progression and no trend.
- **A2** first-ever qualifying hold IS a Weight-time PR — preserved.
- **A3 no scalar label for an incomparable pair.** `compareWeightTimeHolds`
  / `compareWeightTimeSets` return the **dimensional change** —
  `heavier_shorter` or `lighter_longer` — never `same`/`improved`/
  `declined` for a trade-off. The one typed surface that needs a
  category (`OverviewStatus`) gained a non-ranking `mixed` that sorts in
  the `same` band, renders in neutral (not red/green) colour, is never
  selected as a notable exercise, and always carries the dimensional
  `statusDetail` text beside it. No scalar trend score exists for
  weight_time: `trackingAwareProgressSignal` and `signalFor` **throw**
  when handed the mode rather than returning a direction.
- **A4 guidance** — only `WEIGHT_TIME_HOLD_LONGER_GUIDANCE` ("Try
  holding this weight slightly longer.") is ever emitted. The
  next-weight sentence exists as an exported constant but is emitted
  nowhere, because this milestone has no truthful representation of
  "the intended duration criterion has been met consistently" (§15.2,
  O9). RPE remains irrelevant to the choice.
- **A5** no trend chart — preserved.
- **A6 Recent PRs** — the merge moved into `src/lib/recent-pr-tiles.ts`:
  a stable chronological two-list merge (equal date → strength first),
  model-prefixed keys so double-counting is impossible in principle,
  one explicit `RECENT_PR_TILE_CAP`, and the **preservation proof** — with
  zero weight_time events the output is identical to the pre-W8 list,
  which the verifier proves both by fixture and by finding the pre-W8
  page expressions verbatim at `bf3bc020`.
- **A7** local completion refusal kept; server and DB remain authoritative.

**Lint (W10.5-B): outcome C — the earlier "0 warnings" was a
measurement error, not a fixed or weakened rule.** `npm run lint` at
`97442e22` and at every commit since exits 0 with **125**
`@typescript-eslint/no-explicit-any` warnings and 0 errors; the W10
report said 0 because it counted lowercase `warning` while the Next
formatter prints `Warning:`. Machine-readable confirmation
(`eslint --format json` over `src`): 254 files examined, 125 warnings,
0 errors, every one that rule; `eslint --print-config` reports its
severity as `["warn"]`; the plugin registration, the rule severity, the
lint scope and `.eslintrc`/`next.config` are byte-identical to the
lint-baseline commit. Nothing was disabled, narrowed or scoped away.

**W11 DONE (errata, 2026-09-10).** Three plain forward commits grouped
by category — `76bfffc` (MIGRATION_INVENTORY, 34 suites), `a2bf3f5`
(WEIGHT_TIME_BOUNDARY / HISTORICAL_PRODUCT_BOUNDARY /
AUDIT_COMPLETENESS, 16 suites), `7323022` (ROUTE_TEXT / UI_SURFACE, 9
suites) — retargeting the **whole** W10.5 ledger (59 suites / 77 checks)
with no blanket regex and no global "allow 028/weight_time" escape
hatch. Every retarget is labelled `W11 (weight_time milestone,
2026-09-10)`, anchors its historical claim to an immutable commit object
(`git ls-tree` / `git show` / `git grep <sha>` at the pinned tip, most
often the closeout tip `59e443ba`), and admits the later reviewed change
separately by exact identity — migration 028 by filename, byte count
**37 162** and sha256 `9b7d3a52…`; the EXLIB-2F product boundary by
commit id `50e7451c`; each UI change by its exact expression. Every
suite reports its **exact prior check count**, verified pre/post.
Regenerated from a clean worktree of `7323022` the ledger is **empty**:
0 red suites, 0 failing checks, 0 crashed, 0 unattributed, 113 green
(JSON sha256 `67dc257e…`).

**W11 in detail — eleven committed verifiers assert that
`weight_time` is ABSENT and will go red the moment it ships:**

`verify-exlib1c0b4.ts`, `verify-exlib1c0b5.ts`,
`verify-exlib2c-batch01.ts` … `batch06.ts`, `verify-exlib2d.ts`,
`verify-exlib2e.ts`, `verify-exlib2g.ts`.

Their assertions take the form
`check('A2: planning-only boundary — … zero weight_time in src …')`,
implemented as
`execSync("grep -rl 'weight_time' src/ || true") !== ''`
(`verify-exlib2c-batch01.ts:95`) and, in the strictest case, a
fail-closed recursive read with no grep at all
(`verify-exlib1c0b4.ts:165-175`). These are *correct* assertions
about a historical boundary. They must be **retargeted with labelled
corrections** — the 025 precedent ("Labeled RETARGET/ADMISSION
corrections across the committed verifier suites") — never silently
deleted, and never by weakening the check.

**The retarget must be count-neutral.** Measured at this HEAD, all
eleven are green with these check counts:

| Suite | Checks | Suite | Checks |
|---|---|---|---|
| `verify-exlib1c0b4.ts` | 12 | `verify-exlib2c-batch05.ts` | 16 |
| `verify-exlib1c0b5.ts` | 12 | `verify-exlib2c-batch06.ts` | 17 |
| `verify-exlib2c-batch01.ts` | 19 | `verify-exlib2d.ts` | 14 |
| `verify-exlib2c-batch02.ts` | 19 | `verify-exlib2e.ts` | 13 |
| `verify-exlib2c-batch03.ts` | 15 | `verify-exlib2g.ts` | 15 |
| `verify-exlib2c-batch04.ts` | 16 | **Total** | **168** |

Each suite must still report **exactly** its number above after the
retarget, with 0 failed. Count-neutrality is what distinguishes a
retarget from a deletion: a boundary assertion is **replaced** by an
equally strong post-boundary assertion (e.g. "weight_time appears in
`src/` only in the five sanctioned locations", or "the planning-only
boundary held through commit X"), never dropped and never loosened
into a tautology. A suite that comes back with fewer checks has lost
coverage regardless of its exit code.

Separately, `verify-exlib1c0a.ts:287` asserts
`!SCHEMA_TRACKING.includes('weight_time')` as part of a *tracking
honesty* claim about the Plank seed; and `verify-exlib1c0b3.ts:187`
forbids `weight_time` inside migration 025's segments. Both are
historical statements about specific artifacts and should be examined
individually — the second is about 025's bytes and should stay true
forever. Neither is one of the eleven.

Also note `verify-exlib2c-batch01.ts:95` uses
`grep -rl 'weight_time' src/` with a relative path and ambient cwd.
Any retarget should take the opportunity to make the path explicit,
per the standing form rule.

### 13.1 W12 gate and the W13 release order (sequencing correction, 2026-09-10)

**W12 IS LOCAL REVIEW / RELEASE-PACKAGE PREPARATION ONLY. W12 DOES NOT
PUSH.** The reason is a real ordering hazard created by W10: the mode is
now user-selectable ("Weight + Time" in `constants.ts`), while hosted
ShredOS does not yet have migration 028. Pushing `main` before the
migration is applied would let the Git-linked Production deployment ship
a UI/API boundary **ahead of its database contract** — a user could
select a mode the database still rejects. The W4→W6 closed-window
argument (§16) protected exactly this invariant locally; W12/W13 must
protect it hosted.

**The W12 gate, exactly:**

- `npm run lint` **exits 0**;
- lint reports **zero errors**;
- `@typescript-eslint/no-explicit-any` remains **`warn`** (verified from
  `eslint --print-config`, not assumed);
- the warning count **may not exceed the accepted ratchet of 125**;
- **no additional warning rule ID is accepted** — 125 warnings, all of
  them that one rule;
- reducing legitimate existing warnings is allowed; **hiding** them via
  config, plugin registration, severity, lint scope or an ignore file is
  a STOP, not a pass;
- `npm run type-check` exits 0;
- all 113 tracked `scripts/verify-*.ts` suites and all 15 tracked
  `scripts/verify-*-live.sh` suites are green, live suites on
  **local/disposable Postgres only**;
- **W12 does not push, does not apply 028, and makes no hosted contact.**

At the frozen implementation boundary the expected lint result is
**125 warnings / 0 errors / all 125
`@typescript-eslint/no-explicit-any`**. Unrelated `any` cleanup merely to
lower that number is **out of scope for W12**.

**W13 is a coordinated DB-first / app-second hosted release** —
Joseph/ChatGPT only, ShredOS only, under its own explicit one-use
instruction, in this order:

1. apply the exact reviewed migration 028;
2. verify hosted DB state;
3. promote/push the exact independently-reviewed application tip;
4. allow the Git-linked Production deployment;
5. observe READY and perform bounded hosted QA.

**W14** remains the separate five-entry catalog admission (§1.1). Neither
W13 nor W14 is authorized by the W12 instruction.

## 14. Failure and rollback considerations

**Before first adoption** — the migration is reversible: drop the
widened CHECKs, re-add the 4-value versions, revert the code. Nothing
to lose.

**After first adoption — rollback is forward-only.** A CHECK
contraction is possible only while zero rows use the value. Once any
user has logged one weight_time set, contracting the constraint fails
(or, worse, would require deleting their data). This is the audit's
§7 conclusion and it holds unchanged. **The remedy is forward: fix
forward, never contract.** This must be stated in the migration
header itself, not only here.

**Highest-risk failure modes, ranked:**

1. **A scalar sneaks in.** Any `weight × duration` — or reusing
   `setScore` — silently violates D4 and produces confidently wrong
   coaching ("heavier but shorter is better"). Mitigation: the
   verifier in §12.2 asserts no such expression exists; `setScore`
   and `bestSet` are explicitly excluded rather than extended.
2. **G1 regresses shared validation.** Relaxing `p_weight_kg <= 0`
   too broadly would permit 0 kg `weight_reps` sets — a silent
   behaviour change to a shipped mode. Mitigation: mode-dependent
   placement plus explicit preservation controls (§12.1).
3. **The denylist→allowlist flip changes existing PRs.** Mitigation:
   W3 lands first, against a closed 4-value vocabulary, with a
   before/after identity proof (§16).
4. **The self-heal removal changes edit behaviour.** Mitigation:
   isolated commit inside W7, before/after proof for all four modes,
   and explicit re-examination of the `:122-124` 400 path (§5.2).
5. **Partial vocabulary widening.** Extending `constants.ts` without
   `VALID_MODE_FILTERS` yields a visible pill that silently filters
   to "All"; extending `TRACKING_MODES` without the `Record` keys
   yields 500s. Mitigation: the §12.4 guard fails on any incomplete
   set, and the label is deliberately held to W10 (§8.1).
6. **The mode-transition guard is bypassed or raced.** A direct Data
   API `UPDATE` never runs the route precheck, and the precheck's own
   count→update sequence is not atomic (§5.4). Mitigation: the 028
   trigger is the integrity boundary; its seven-point proof and the
   two-interleaving concurrency proof are mandatory, and an unprovable
   interleaving B is a STOP-and-redesign, never a caveat.
7. **Boundary verifiers weakened instead of retargeted.**
   Mitigation: labelled corrections plus the count-neutrality
   requirement (§13), reviewed as such.

**Non-risk, explicitly:** no user-visible change occurs before W10;
the migration alone is invisible until the UI can select the mode; all
eight catalog entries stay `import_eligible: false` until W14's own
separate authorization, which admits five of them.

## 15. Open product decisions

### 15.1 Resolved by the planning review

- **O1 — Do carries belong in `weight_time`?** **RESOLVED: no, not in
  this milestone.** The contract (weight + duration, `distance_meters`
  absent) fits weighted timed isometrics and is too restrictive for
  carries. Admission is the **five** holds (§1.1); the three carries
  stay deferred; the approved inventory history is preserved. **No
  future carry mode name is invented or locked.**
- **O2 — Which of the eight ship first?** **CLOSED by O1.** The
  admission set is exactly the five in §1.1, and the coverage
  matrix needs **no** correction: "8 explicitly deferred" remains a
  true historical approval fact, and admission is a documented subset
  of it. Revision 1's suggestion that the matrix needed a labelled
  correction is withdrawn.
- **O3 — Block mode switches on exercises with history?** **RESOLVED:
  yes**, and promoted from an open question to the data-integrity rule
  in **§5**, with the destructive self-heal scheduled for removal.
- **O4 — In-app guidance for mis-logged holds?** **CLOSED: none this
  release** (§7). No reinterpretation, no inference of mis-logging, no
  backfill or banner; a later diagnostic only if data demonstrates a
  need.
- **O5 — Copy / zero / unilateral.** **CLOSED** (§4.1): "Added weight";
  stored 0 renders as a real zero and reads "0 lb added" (or metric);
  never "Bodyweight"; the two approved neutral progression strings;
  existing "per side" semantics preserved for unilateral user-created
  exercises.
- **O6 — Frontier display.** **CLOSED** (§4.2): dominance as defined;
  longest hold, heaviest hold, and a compact non-dominated frontier
  list sorted by added weight; no scalar of any kind.
- **O7 — Migration identity / 027 ordering.** **RESOLVED from durable
  repository evidence**: 028 (§10.1); 027 ordering moot (§10.3).
- **O8 — DB enforcement of the history guard?** **CLOSED: option (b)**
  — enforced at the database boundary in 028, in the refined
  "zero CURRENT `workout_sets` rows" form, with the seven-point proof
  and the mandatory A/B concurrency proof (§5.4).
- **Revision 2's §10.2 scope note** (the `deliver_catalog_exercises`
  replacement) — **RESOLVED: explicitly IN SCOPE.**
- **Seed module local union** (`src/lib/supabase/seed-exercises.ts:44`,
  the W4 deviation) — **RULED 2026-09-10: EXCLUDES_WEIGHT_TIME_INTENTIONALLY,
  not PENDING.** The local four-value type is intentionally narrower than
  the global `TrackingMode`: the module contains no weight_time seed and
  is not the vocabulary authority; twenty-two evidence suites pin it
  blob-identical to promoted tips, so it is never edited and no marker
  is added to it. Recorded in the census ledger as an external
  exclusion, outside the frozen module.

### 15.2 Open by design

- **O9 — How should carries be tracked?** **OPEN BY DESIGN.** Farmer's
  carry, Suitcase carry, and Sandbag bear-hug carry remain deferred.
  No carry tracking-mode name or contract is invented in this
  milestone; distance vs duration vs both is a separate product
  decision (`distance_meters` already exists on the row, which is why
  the decision is real). Deferral is from the *catalog*, not the
  product: a user can hand-create a weighted carry as a `weight_time`
  exercise once this ships (§1.1). Blocks nothing here.

## 16. Recommended implementation decomposition — W0…W14

**Ordering principle, from the review:** the denylist→allowlist
polarity fix lands **before** `weight_time` can enter the union.
Against the current closed 4-value vocabulary, the flip is provably
behaviour-equivalent for every shipped mode — `allowlist(weight_reps,
bodyweight)` and `¬denylist(cardio, timed)` are the same predicate by
exhaustion over a 4-element set. Once a fifth member exists, that
proof is no longer a total-case argument and the change becomes
entangled with new feature behaviour.

Second principle, from §3.1: the type system finds only one of the 58
census sites, so the census and guard come **first** and produce the
worklist.

Third: each of the four changes to already-shipped behaviour (W3, G1
in W5/W6, the O8 trigger in W6, the self-heal removal in W7) is
isolated with its own preservation or restriction proof. Bundling any
of them into a larger step would make its proof unreadable.

| Step | Scope | Touches shipped behaviour? | Proof |
|---|---|---|---|
| **W0** | **DONE 2026-09-09.** Operator review closed O4–O8 (028 from the EXLIB-2M record; DB enforcement, option (b)) and confirmed 028's scope including the `deliver_catalog_exercises` replacement; O9 open by design (§15) | — | decisions recorded in this revision |
| **W1** | **Census + guard worklist.** Enumerates every mode-literal branch and every `Record<TrackingMode,…>`; fails on any missing `weight_time` arm. Red on today's tree; its output *is* the worklist. `deriveLegacyExerciseType`'s exhaustive switch is **not** the worklist | no | guard red now, green at W10 |
| **W2** | **Installed constraint-name discovery** on a disposable DB; record both names (025 precedent) | no | `pg_constraint` readback |
| **W3** | **strength-records denylist → explicit allowlist**, `:286` and `:320`, **alone** | **yes** | before/after behavioural equivalence for all currently shipped modes, exhaustive over the closed 4-value vocabulary |
| **W4** | **Vocabulary + exhaustive switch**: `database.ts` union, `TRACKING_MODES`, D3's explicit `case 'weight_time': return 'strength'`, `VALID_MODE_FILTERS`. **Holds `constants.ts`'s label for W10** so the mode stays unselectable while the DB still rejects it (§8.1) | no (additive) | `tsc`, guard, vocabulary verifier |
| **W5** | **Zero-weight validation / persistence semantics, specified and proven red.** Write the failing live controls and the API-level zero-preservation spec *before* the SQL exists: `weight_kg = 0` must persist as `0`, never `null` (G2) | — (spec only) | controls demonstrably red against today's code |
| **W6** | **Migration 028 + `append_workout_set`**: two CHECK widenings using W2's names; the `weight_time` `ELSIF` gate (warmups permitted, G4); the completion rule; **G1**'s mode-dependent lower bound; the **O8 history-guard trigger** raising `tracking_mode_has_workout_history`; `deliver_catalog_exercises` replaced so **both** 026 CASEs carry an explicit `weight_time` branch (§8.9, §17). Scope fixed by §10.2 | **yes** (G1, trigger) | live suite, classified negative controls, G1 preservation controls, the seven-point guard proof, **A/B concurrency proof with two real sessions (B unprovable ⇒ STOP)**, `pg_get_functiondef` readback, atomicity |
| **W7** | **API routes**: three `Record` keys; G2 zero-preservation in both set routes; the §5.3 precheck in `PATCH /api/exercises/[id]` plus mapping of `tracking_mode_has_workout_history` to 409; **removal of the destructive self-heal** — that removal as its own commit inside W7 | **yes** (self-heal) | route tests, §12.5 route tests, before/after proof for all four modes |
| **W7.5** | **DONE 2026-09-10 — stabilisation after the accepted W4–W7 checkpoint.** A: the 58-site W1 census conserved by ledger (§3). B: three verifiers red BEFORE W4 — `verify-exlib1c0b` D2 (first red at W1 `fa5a359b`), `verify-exlib3a-option-a` A7 (W3 `14a36567`), `verify-exlib3a-option-a-application` C14 (`0e10d7b`, the first post-closeout commit) — diagnosed as historical lifecycle/topology pins stale after normal post-closeout development, not regressions, and retargeted with labels against their historical tips, count-neutral; **they are outside W11**. C: the exact W11 failure ledger generated (`docs/weight-time-w11-failure-ledger.json`) | verifier-only | conservation 58 = 58; the three suites green on a clean tree; ledger unattributed = 0 |
| **W8** | **DONE 2026-09-10 (`dc8f10b7`) — 2-D records module** `src/lib/weight-time-records.ts` (Phase 2V shape), `duration_seconds` in its select; `evaluateSetPRs` gated at its callers (W9/W10); `strength-records.ts` never extended. Deterministic chronology `workout_date → session created_at → session id → order_index → set_number → set id`; the first-ever qualifying hold IS a Weight-time PR (nothing earlier dominates it — a deliberate divergence from the strength model's silent first baseline); the frontier collapses exact repeats to the earliest representative | no | `scripts/verify-weight-time-records.ts` 59/0: dominance, ties, zero-weight, warmups, RPE-neutrality, chronology, historical PR after later domination, fetchers over a fake client |
| **W9** | **DONE 2026-09-10 (`69b7c7c9`) — `workout.ts` 13 sites + `progress-overview.ts` 4 + `server.ts` 2 + `workout-coach.ts`**: summaries ("1:30 · 0 lb added"), representative set = longest qualifying hold (tie → heavier → lower set_number; a DISPLAY choice, not a record), `trackingAwareProgressSignal` applies 2-D dominance (incomparable = `same`), guidance = the two approved strings verbatim with RPE never consulted (D5) — **both superseded by W10.5: the signal function now throws for the mode, an incomparable pair returns the dimensional change, and only the duration sentence is emitted** — reps-only target model = intentional exclusion, `summarizeWorkout` scores holds with the 2-D model only. Executable mode sets `RPE_LOGGABLE_MODES` / `STRENGTH_SCORING_MODES` / `CARDIO_TIMED_MODES`; `fetchExercisePRBaseline`, the history 1RM and `fetchExerciseTrends` gated by mode. `setScore`/`bestSet`/`epley1RM`/`evaluateSetPRs` **excluded, not extended** | additive per mode | `scripts/verify-weight-time-w9-integration.ts` 53/0; census pin 39 → 20; six baseline sites eliminated by refactor, recorded |
| **W10** | **DONE 2026-09-10 (`97442e22`) — UI**: `constants.ts` label **"Weight + Time"** (the step that makes the mode user-reachable), `WeightTimeSetInputs` (Added weight / Duration — minutes / Duration — seconds / RPE; never reps or distance; a stored 0 renders "0"), warm-up toggle from the shared `WARMUP_FORBIDDEN_MODES`, completion refused locally with the contract's own message (`role="alert"`), "Weight-time PR" badges from the 2-D model, Add-set copies 0 as 0, shared Apply contract (`MODE_COPY_FIELDS` / `MODE_APPLY_REQUIRED_FIELDS`, route AND client), exhaustive `COLUMN_HEADERS`, `WeightTimeSections` (longest hold + its weight, heaviest hold + its duration, the frontier as a compact list sorted by added weight with no rank, "Weight-time PR" history; **no trend chart** — no scalar to plot), Weight-time PR events in /progress Recent PRs. Mode-change rejection copy was already surfaced by W7 (409 → `TRACKING_MODE_HISTORY_409_COPY`) | additive | `scripts/verify-weight-time-w10-ui.ts` 53/0 (react-dom/server renders of the two pure components over fixtures + source checks); census **0 pending, 58 = 8 + 17 + 33 + 0** (exit condition met). Browser verification was NOT performed: the app needs an authenticated hosted session and hosted contact is forbidden to Claude |
| **W10.5** | **DONE 2026-09-10 (`69aa1a8`, `e5f8735`, `a247013`, `92cfec6`, `72c81ac`) — stabilisation under the W8–W10 checkpoint disposition (§13):** the seven design calls resolved as ruled — `representativeHold` is a display selection and no weight_time path names a "best"; an incomparable pair returns the **dimensional** change (`heavier_shorter` / `lighter_longer`), never a scalar direction, with the non-ranking `mixed` status where a typed surface needs a category and `trackingAwareProgressSignal` / `signalFor` **throwing** for the mode; guidance emits the duration sentence only (the next-weight sentence has no truthful trigger yet); Recent PRs merged in `src/lib/recent-pr-tiles.ts` with a zero-weight_time preservation proof against the pre-W8 page text. Lint investigated: **outcome C** — the "0 warnings" claim in the W10 report was a counting error, the 125 `no-explicit-any` warnings are unchanged and the rule is still `warn` | no (corrections to W8–W10 only) | `scripts/verify-weight-time-w10-5-stabilization.ts` 38/0 (incl. a 400-pair grid proving no incomparable pair maps to a scalar, and the zero-weight_time Recent-PR identity); census 0 pending; machine-readable ESLint audit |
| **W11** | **DONE 2026-09-10 (`76bfffc`, `a2bf3f5`, `7323022`) — retargeted every check in the generated ledger** `docs/weight-time-w11-failure-ledger.json` (the W10.5 ledger: 59 suites / 77 checks — 45 migration-inventory, 15 weight_time-boundary incl. the eleven, 12 UI-surface, 2 route-text, 2 audit-completeness, 1 historical product boundary, 0 requires review — §13) with labelled corrections: every historical claim evaluated against an immutable commit object at its own tip, the reviewed 028 / weight_time state admitted separately by exact identity, no blanket regex, **count-neutral** | no | every ledger check green, every suite at its exact prior check count, ledger regenerated **empty** (0 red / 0 unattributed / 0 crashed, 113 green) |
| **W12** | **Local review / release-package preparation ONLY. W12 DOES NOT PUSH** (sequencing correction, 2026-09-10 — see §13): W10 made "Weight + Time" user-selectable, so pushing `main` before 028 is applied would deploy a UI/API boundary ahead of its database contract. Scope: plan gate corrections; the full local review matrix; all 15 live shell verifiers on disposable Postgres; 028's line-by-line release review; the whole `origin/main..HEAD` application diff with end-to-end weight_time traces; a sanitized local production build; local UI QA or a recorded blocker; a frozen candidate and a verified `git bundle` review package | no | local only — every gate read from `$?` |
| **W13** | **Coordinated DB-first / app-second hosted release — Joseph/ChatGPT only**, ShredOS only, separate one-use authorization, in order: apply exact reviewed 028 → verify hosted DB state → promote/push the exact independently-reviewed application tip → allow the Git-linked Production deployment → observe READY → bounded hosted QA | — | operator |
| **W14** | **Catalog admission of the five entries** (§1.1) — separate authorization | — | operator |

**Two dependency notes where this plan interprets the review's
ordering rather than reordering it:**

- **W5/W6 overlap by necessity.** G1 lives *inside*
  `append_workout_set`, which is SQL, so the zero-weight *semantics*
  can be specified and proven red at W5 but can only be *implemented*
  in W6. W5 is therefore the guard-before-repair step for G1, not a
  separate code change. The API half of zero-preservation (G2) is
  likewise specified at W5 and implemented at W7.
- **W4 deliberately leaves a closed window.** Between W4 and W6 the
  TypeScript union admits `weight_time` while both DB CHECKs still
  reject it. That window is safe **only** because no user-reachable
  path can select the mode — which is exactly why `constants.ts`'s
  label is held back to W10. The pill/parse asymmetry (§8.1) makes
  this safe in the parser direction but not the pill direction.

## 17. Drift found versus the migration-024-era audit

The audit's S9 recorded the delivery CASE with its accidental
`ELSE 'strength'` as a single site in migration 023. **At this HEAD
that CASE appears twice** in the current live definition of
`deliver_catalog_exercises`, which was replaced by
`026_exlib_plank_seed_reconciliation.sql:146`
(`CREATE OR REPLACE FUNCTION`), at `026:393-398` (the Plank branch)
and `026:476-481` (the general branch) — the `ELSE 'strength'` lines
themselves being `026:397` and `026:480`. Both CASEs are otherwise
identical: `bodyweight → bodyweight`, `cardio → cardio`,
`timed → mobility`, everything else → `strength`.

**Both occurrences must be replaced by explicit `weight_time`
handling.** D3's wording is precise — an intentional branch, *not* an
accidental CASE fallback — so leaving either one to fall through the
`ELSE` would satisfy the output value while violating the decision.
Anyone working from the audit alone would fix one and miss the other,
which is why §12.2's deterministic verifier asserts on **both**.

**Where the fix lands.** The CASEs are inside a SQL function, so the
replacement is a `CREATE OR REPLACE FUNCTION deliver_catalog_exercises`
in the migration (W6, §8.9, §10.2) — the same shape 026 used to replace
023's definition (`023:1584` → `026:146`) — not application code.
`027` does **not** redefine this function (verified: no
`deliver_catalog_exercises` reference anywhere in 027), so the function
body is the same whether or not 027 is applied — and 027 *is* applied
on hosted (§10.1) — so this replacement is not coupled to 027 ordering
in any way. The manifest-digest note in §10.3 concerns W14, not 028.

Two further post-024 facts the audit could not contain:

- Migration `027` binds `tracking_mode` into the catalog manifest
  digest (`027:475`) and into a column-immutability trigger
  (`027:151`), and is **not applied** (§10).
- Migration `025` shipped the `weight_plate`, `weighted_vest`,
  `smith_machine` and `sandbag` equipment values that the deferred
  weight_time entries depend on. For the five admitted entries the
  dependency is `weight_plate` and `weighted_vest` only — both
  shipped, so it is already satisfied. (`sandbag` was needed by a
  now-deferred carry; `smith_machine` by neither.)

## 18. What this plan deliberately does not do

- Migration 028 is **not authored** by this plan. No SQL is written.
  Its number comes from the committed EXLIB-2M application record, not
  from hosted contact.
- No rename of, or modification to, the existing `027`.
- No schema change, no Supabase contact, no hosted application.
- No Vercel contact in any mode, including read-only.
- No deployment, no push, no tag, no branch promotion.
- No code change to `src/`.
- No reopening of D1–D5, and no defaulting of the open decisions in
  §15.2.
- No change to any of the eight catalog entries' `import_eligible:
  false`, and no rewriting of the approved inventory or coverage-matrix
  history.
- **No future carry tracking-mode name invented, reserved, or
  implied.**
- No hosted-state claim beyond what the committed EXLIB-2M application
  record states (001–027 in effect).
- No new `workout_sets` column, no combined score column, no
  carry-distance change, no catalog admission in 028.
- No new phase identifier.
