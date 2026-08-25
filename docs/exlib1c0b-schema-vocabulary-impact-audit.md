# EXLIB-1C0B — Schema-Vocabulary and Tracking-Mode Displacement Audit

**ANALYSIS ONLY.**
**MIGRATION 025 NOT AUTHORED.**
**NO SCHEMA OR PRODUCT CHANGE APPROVED.**
**NO CATALOG LOADING AUTHORIZED.**
**ALL 26 CANDIDATES REMAIN IMPORT-INELIGIBLE.**

Scope: determine the exact safe implementation boundary for the five
desired future vocabulary values recorded by EXLIB-1C0A —
equipment `weight_plate`, `weighted_vest`, `smith_machine`,
`sandbag`; tracking `weight_time` — before any migration is drafted.
Baseline: main = tag `exlib1c0a-private-use-equipment-decisions-stable`
= `55fa7610b61d711c51a2e5d10a00c1608830d151`; migrations exactly
001-024 applied; catalog content tables 0/0/0/0 per the recorded
applied-state boundary (EXLIB-1B3 audit section 10).

## 1. Current official guidance (retrieved 2026-08-25)

Tooling inspected locally: `supabase --version` = **2.105.0**;
`supabase migration --help` and `supabase db --help` inspected before
relying on any syntax. No Supabase or Vercel connection was made; the
hosted ShredOS project was not contacted.

Primary official sources retrieved:

| Source | URL | Used for |
|---|---|---|
| Supabase changelog | https://supabase.com/changelog | breaking-change scan |
| Supabase migrations guide | https://supabase.com/docs/guides/deployment/database-migrations | migration new / migration up / db reset / db push workflow |
| PostgreSQL ALTER TABLE | https://www.postgresql.org/docs/current/sql-altertable.html | CHECK add/drop locks, NOT VALID/VALIDATE, transactional DDL |
| PostgreSQL constraints | https://www.postgresql.org/docs/current/ddl-constraints.html | CHECK semantics, naming, modify-in-place impossibility |

Documentation-derived conclusions (vs repository inspection, which
covers everything in sections 2-4):

- Changelog scan found NO entry affecting this scope. Noted for
  operators: Postgres 14 support ends 2026-07-01 (auto-upgrade);
  realtime/auth/storage schema lockdowns do not touch `public`.
- A CHECK constraint CANNOT be modified in place; the documented
  path is DROP CONSTRAINT then ADD CONSTRAINT (re-checking all
  rows). Unnamed inline CHECKs receive system-chosen names.
- `ALTER TABLE ... ADD CONSTRAINT CHECK` takes ACCESS EXCLUSIVE and
  scans (no rewrite); `NOT VALID` skips the scan and `VALIDATE
  CONSTRAINT` later takes only SHARE UPDATE EXCLUSIVE; `DROP
  CONSTRAINT` takes ACCESS EXCLUSIVE. All are transactional, so a
  future 025 can keep the house single-BEGIN/COMMIT atomic-install
  rule. At current row counts (single-tenant, empty catalog) the
  plain validated ADD is proportionate; NOT VALID staging is not
  needed.
- Official CLI workflow for the eventual draft: `supabase migration
  new` -> edit SQL -> `supabase migration up` -> `supabase db reset`
  validation -> single-operator `supabase db push` (application
  remains Joseph/ChatGPT-only per standing rule).

## 2. Exact schema inventory (mechanical, migrations 001-024)

Grep basis: every migration file containing `equipment`,
`tracking_mode`, or `exercise_type` is exactly
`003_phase1c_workout_logging.sql`,
`010_phase2r_exercise_tracking_modes.sql`,
`021_ui5b_transactional_ordering.sql`,
`023_exlib_catalog_and_delivery_contract.sql`. Migration 024 touches
none of the three columns (two `ALTER FUNCTION ... SET search_path`
pins and four partial FK indexes on catalog_id/catalog_alias_id —
no vocabulary interaction). No views exist in any migration. Set
storage columns come from 003 (`weight_kg NUMERIC(6,2)` NULL, `reps
SMALLINT` NULL, `rpe NUMERIC(3,1)` CHECK 1-10) and 011
(`duration_seconds INTEGER CHECK (duration_seconds >= 0)`,
`distance_meters NUMERIC(10,2)` — both NULL).

### 2.1 Schema matrix

| # | Object | Column/function | Current allowed values / transformation | Constraint/object name | Migration | Read/write path | Accepts proposed values now? | Exact displacement if changed |
|---|---|---|---|---|---|---|---|---|
| S1 | public.exercises | equipment (TEXT NULL) | CHECK IN ('barbell','dumbbell','cable','machine','bodyweight','resistance_band','kettlebell','other') | UNNAMED inline CHECK in committed SQL; system-generated name (documented default pattern `exercises_equipment_check`) — MUST be confirmed from pg_constraint on a disposable install before any DROP is drafted | 003 | user create/edit (API routes), catalog delivery INSERT | weight_plate/weighted_vest/smith_machine/sandbag REJECTED | DROP + re-ADD CHECK with the 12-value list |
| S2 | public.exercises | exercise_type (TEXT NOT NULL DEFAULT 'strength') | CHECK IN ('strength','bodyweight','machine','cable','dumbbell','barbell','cardio','mobility'); legacy, write-only, derived from tracking_mode | UNNAMED inline CHECK; system name pattern `exercises_exercise_type_check` (confirm live) | 003 | written on create/edit and by delivery; never read for behavior | n/a directly; weight_time needs a derivation target inside the EXISTING legacy set | no CHECK change needed if derivation maps into the existing 8 values; the derivation itself must gain an explicit branch |
| S3 | public.exercises | tracking_mode (TEXT, NOT NULL + DEFAULT 'weight_reps' set later in 010) | CHECK IN ('weight_reps','bodyweight','cardio','timed') added via ADD COLUMN inline CHECK | UNNAMED inline CHECK; system name pattern `exercises_tracking_mode_check` (confirm live) | 010 | authoritative source of ALL logging behavior | weight_time REJECTED | DROP + re-ADD CHECK with 5-value list — ONLY safe with full product support (section 4) |
| S4 | public.exercises | 010 backfill CASE exercise_type->tracking_mode (strength/machine/cable/dumbbell/barbell->weight_reps; bodyweight->bodyweight; cardio->cardio; mobility->timed) | historical one-time backfill, already applied | n/a | 010 | applied once | n/a | none — historical record only |
| S5 | public.exercise_catalog | equipment (TEXT NOT NULL) | CHECK IN (same 8 values) | UNNAMED inline CHECK; system name pattern `exercise_catalog_equipment_check` (confirm live) | 023 | importer INSERT (none yet), deliver_catalog_exercises SELECT | REJECTED | DROP + re-ADD CHECK; snapshot rows are immutable so existing rows (none yet) could never be edited to new values — only new snapshot version rows |
| S6 | public.exercise_catalog | tracking_mode (TEXT NOT NULL) | CHECK IN (same 4 modes) | UNNAMED inline CHECK; system name pattern `exercise_catalog_tracking_mode_check` (confirm live) | 023 | same as S5 | weight_time REJECTED | DROP + re-ADD CHECK |
| S7 | public.exercise_catalog | laterality / import_confidence CHECKs | adjacent inline CHECKs on the same table | unnamed inline | 023 | importer | unaffected | none |
| S8 | exercise_catalog_freeze_trigger (+ guard function) | blocks post-insert changes to logical_id, canonical_name, category, primary_muscle, equipment, laterality, tracking_mode, source fields, import_confidence, catalog_version, created_at | immutable-snapshot contract: corrections require a NEW catalog version row | trigger at 023:563; equipment at 023:497, tracking_mode at 023:499 | 023 | every catalog UPDATE | value-agnostic (blocks ALL changes) | none from adding CHECK values; means vocabulary mistakes in loaded rows are fixed by NEW version rows, never in place |
| S9 | deliver_catalog_exercises(TEXT) | INSERT INTO exercises(..., equipment, exercise_type, tracking_mode, ...) with equipment passed through verbatim and exercise_type derived by CASE v_cat.tracking_mode: bodyweight->bodyweight, cardio->cardio, timed->'mobility', ELSE->'strength' | SECURITY DEFINER, 023:1584 | 023 | catalog->tenant delivery | new equipment values would pass through and then FAIL the tenant exercises CHECK (S1) — delivery aborts; weight_time would silently fall into the ELSE branch and derive exercise_type='strength' (the ELSE predates weight_time — an ACCIDENTAL mapping, not a decision) | tenant CHECK must be extended in the SAME migration as the catalog CHECK; the CASE needs an EXPLICIT weight_time branch before any weight_time snapshot exists |
| S10 | rollback_catalog_delivery(TEXT) | deletes/audits delivered rows by run membership | 023:1862 | 023 | rollback path | value-agnostic (no equipment/tracking branch in its body) | none |
| S11 | append_workout_set(...) | per-mode field gating: weight_reps/bodyweight forbid duration/distance; cardio forbids reps/weight/rpe/warmup; timed forbids reps/weight/distance/warmup; ELSE RAISE 'invalid_input'; completion: bodyweight requires reps, cardio/timed require duration>0 | 021:380 (gating 021:497-524) | 021 | authoritative server-side set append | weight_time hits the ELSE -> fail-closed REJECTION (good) | needs an explicit weight_time branch defining required/forbidden fields — blocked on the product field contract (section 4) |
| S12 | reorder_workout_exercises / reorder_routine_exercises / delete_workout_set_and_resequence (021), create_routine_from_workout / repeat_workout (022) | no equipment/tracking_mode/exercise_type branches (mechanical grep: 022 contains none of the three; 021's only references are inside append_workout_set and comments) | 021/022 | ordering/reuse | unaffected | none |
| S13 | 023 GRANT INSERT/UPDATE column lists (exercises: ..., equipment, exercise_type, tracking_mode, ...) | column-level grants, value-agnostic | 023:1510-1515 | 023 | privilege surface | unaffected | none |
| S14 | public.workout_sets | weight_kg NUMERIC(6,2) NULL (003), reps SMALLINT NULL (003), rpe CHECK 1-10 (003), duration_seconds INTEGER CHECK >=0 (011), distance_meters NUMERIC(10,2) (011) | no cross-column constraint ties weight to reps or forbids weight+duration together | inline CHECKs (rpe, duration>=0) | 003/011 | all set storage | PHYSICALLY, a row holding weight_kg AND duration_seconds simultaneously is already storable — only the validation layers (S11 + API routes) forbid it | none at storage layer for weight_time |
| S15 | migration 024 objects | search_path pins on the two verify fns; 4 partial FK indexes | exact applied fingerprints frozen | 024 | verification/RI | unaffected | none |

Constraint-name honesty: every affected CHECK is UNNAMED in the
committed SQL. The system-generated names follow the documented
default pattern, but a fail-closed 025 draft MUST derive the exact
names from `pg_constraint` on a disposable local install (the
existing live-suite pattern) rather than assuming the pattern —
recorded here as a mandatory pre-draft step, not inferred as fact.

## 3. Complete consumer inventory (mechanical, src/)

Grep basis (mechanically reproducible; the verifier re-runs these):
every src/ file matching `equipment` (15 files), `tracking_mode|
trackingMode` (21 files), `exercise_type|exerciseType` (9 files).
Union: 24 files, every one accounted for below.

| # | Consumer | Role | Current exhaustive assumption | Effect of 4 equipment additions | Effect of weight_time | Required change | Schema-only rollout safe? |
|---|---|---|---|---|---|---|---|
| C1 | src/lib/exercise-validation.ts | validate/derive (API authority) | EQUIPMENT_TYPES (8), TRACKING_MODES (4), EXERCISE_TYPES (8), EquipmentType/TrackingMode unions, deriveLegacyExerciseType exhaustive switch, CREATE/PATCH field allowlists | new values REJECTED fail-closed ('Invalid equipment value.') | REJECTED fail-closed ('Invalid tracking mode.'); deriveLegacyExerciseType has NO case (TS switch would no longer compile once the union grows — build-time protection) | extend EQUIPMENT_TYPES / TRACKING_MODES / derivation branch | equipment: NO user writes until extended (fail-closed, acceptable); weight_time: NO |
| C2 | src/types/database.ts | types | ExerciseEquipment (8), TrackingMode (4), ExerciseType (8) unions | values not representable — casts/compile errors | same | extend unions in the same release as the schema | equipment: rows readable at runtime (TS types are erased) but every typed consumer is lying; extend together |
| C3 | src/lib/constants.ts | UI labels | EXERCISE_EQUIPMENT (8 labeled), TRACKING_MODES (4 labeled), EXERCISE_TYPES (legacy) | new values have NO label entry | no label entry | add label entries | see C7-C12 fallbacks |
| C4 | src/app/api/exercises/route.ts + src/app/api/exercises/[id]/route.ts | write validation | delegates to C1 | fail-closed reject | fail-closed reject | none beyond C1 | fail-closed |
| C5 | src/app/api/workout-exercises/[id]/sets/route.ts | set-create validation | local `TrackingMode` 4-union + MODE_FIELDS Record keyed by the 4 modes | n/a | `MODE_FIELDS[mode]` is UNDEFINED -> runtime TypeError/500 on any set write for a weight_time exercise | explicit weight_time entry + rules | NO |
| C6 | src/app/api/workout-sets/[id]/route.ts | set-edit validation | same pattern as C5 | n/a | same undefined-lookup failure | same | NO |
| C7 | src/app/api/workout-exercises/[id]/apply-first-set/route.ts | target copy | MODE_COPY_FIELDS Record keyed by the 4 modes | n/a | `copyFields` UNDEFINED -> runtime failure | explicit entry | NO |
| C8 | src/components/workout/SetRow.tsx | set entry UI | renders inputs by mode: weight_reps/bodyweight -> reps/weight; cardio/timed -> duration(+distance for cardio); timed extra branch | n/a | NO branch matches -> a weight_time set row renders NO input fields (silent dead UI) | dedicated weight+duration entry UI | NO |
| C9 | src/components/workout/WorkoutExerciseBlock.tsx | execution UI, timers, target copy | isCardioOrTimed flag; MODE field map; timer only for 'timed'; weight_reps-only affordances | n/a | treated as neither timed nor weight_reps: no timer, wrong affordances | explicit branches | NO |
| C10 | src/components/workout/ExerciseForm.tsx | create/edit UI | PillGroup over EXERCISE_EQUIPMENT and TRACKING_MODES | new values unselectable; an EXISTING row carrying one renders with no equipment pill highlighted and a save can silently downgrade the field | same for tracking pill | extend constants (C3) before rows exist | risky for rows created by delivery |
| C11 | src/components/workout/ExercisePicker.tsx + src/components/workout/ExerciseListItem.tsx | list rendering | renders raw equipment string (`· ${e.equipment}`) | cosmetic: raw `weight_plate` style tokens render | n/a (mode not rendered here) | label polish only | tolerable cosmetically |
| C12 | src/app/(app)/progress/page.tsx + src/app/(app)/progress/exercises/[id]/page.tsx | progress rendering | optionLabel() returns null for unknown values -> label gracefully omitted | equipment label silently omitted | mode label omitted; per-mode chart/format branches (via lib) misclassify | extend labels; gate charts | degraded but non-crashing |
| C13 | src/components/workout/ExerciseHistoryRows.tsx | history rendering | formats via lib/workout by mode | n/a | falls to weight_reps-style formatting (silent misformat) | explicit branch | NO |
| C14 | src/app/(app)/check-in/page.tsx | review rendering | TRACKING_MODES.find() label | n/a | undefined modeLabel (omitted) | label entry | degraded |
| C15 | src/lib/workout.ts | summaries, next-target suggestions, PR typing | cardio/timed excluded from strength suggestions/PRs; equipment 'machine'/'cable' get "next setting", all else +5 lbs; else-branches assume weight_reps | smith_machine/sandbag/weight_plate/weighted_vest take the +5 lbs default branch (plausible; product may prefer "next setting" for smith_machine — open decision) | NOT excluded from strength paths -> weight_time sets would enter rep/weight PR and suggestion logic with reps NULL -> silent misclassification | explicit weight_time handling everywhere cardio/timed are branched | equipment: acceptable; weight_time: NO |
| C16 | src/lib/strength-records.ts | records engine | selects tracking_mode+equipment; PR model keyed to reps/weight and bodyweight_reps | equipment is descriptive only here | weight_time rows enter the weight-PR model with NULL reps — misclassification; a distinct load-x-duration performance model is an OPEN PRODUCT DECISION | gate until modeled | NO |
| C17 | src/lib/progress-overview.ts | overview aggregation | equipment/tracking selected; per-mode formatting | label omission only | misformat risk as C15 | gate/extend | equipment OK |
| C18 | src/lib/weekly-review.ts + src/lib/goal-adjustments.ts | coaching queries | select equipment/tracking_mode pass-through | none (pass-through) | pass-through, but downstream formatting shares C15 | none direct | equipment OK |
| C19 | src/lib/supabase/server.ts | timed/cardio summary extraction | filters `tracking_mode !== 'cardio' && !== 'timed'` skip | n/a | weight_time rows skipped from duration summaries (silent omission of duration data) | include when contract defined | NO for fidelity |
| C20 | src/lib/supabase/seed-exercises.ts | seeder | literal 4-mode union + 8-equipment literals on seed rows | unaffected (no seed uses new values) | unaffected | none until seeds want new values | safe |
| C21 | src/hooks/useExercises.ts | client fetch typing | loose `equipment?: string | null`, `exercise_type: string` | tolerant | tolerant | none | safe |
| C22 | Duration/weight/reps field storage consumers (C5/C6/C8/C9/C13/C15/C16 above) reading workout_sets | storage already permits weight+duration coexistence (S14) | validation layers forbid the combination | n/a | the combination weight_time needs is FORBIDDEN only by C1/C5/C6/S11, not by storage | see section 4 | n/a |
| C23 | Verifier suites pinning exact vocabularies: verify-phase2x (7 refs), verify-phase3a (5), verify-phase4b6b (1), verify-phase5a6b (7), verify-ui4 (1), verify-ui5a (4), verify-ui5b1a (5), verify-ui5b1b (8), verify-ui5b2 (2), verify-ui6c (1), verify-exlib1a (2), plus verify-exlib1c0a (parses migration 023's CHECK lists as SCHEMA_EQUIPMENT/SCHEMA_TRACKING and asserts the five desired values are absent from THEM) | deterministic harnesses | assertions pin today's vocabularies and 023's frozen text | any implementation phase must ship LABELED retargets for the affected assertions (023's text itself never changes — verify-exlib1c0a's parse of 023 stays true, but its 'weight_time is unsupported' framing must be retargeted to read the post-025 authoritative constraint state) | same | labeled `RETARGET (<implementation phase>)` entries, reported separately | n/a |
| C24 | verify-phase2w / verify-phase4b5 | matched the filename grep but contain 0 vocabulary references (mechanical count) | none | none | none | none | n/a |

No repository consumer outside this table matches the mechanical
searches; the verifier re-executes the searches and fails closed if
any file with a match is missing from this document.

## 4. The true weight_time contract (from real schema and consumers)

1. **Simultaneous weight + duration storage:** already physically
   possible — workout_sets has independent nullable `weight_kg` and
   `duration_seconds` with no cross-column constraint (S14). Every
   prohibition is in validation (C1/C5/C6/S11), not storage. No new
   set columns are required.
2. **Reps nullability/validation:** `reps` is nullable at storage.
   Current per-mode rules: weight_reps/bodyweight accept reps and
   forbid duration/distance; bodyweight requires reps when a
   non-warmup set completes; cardio/timed forbid reps and require
   duration>0 on completion; cardio additionally forbids
   weight/rpe/warmup; timed forbids weight/distance/warmup.
3. **Representation readiness:** timers render only for 'timed'
   (C9); summaries/history/PR/records/suggestions/RPC all branch on
   the four literals; NONE can currently represent combined
   load+duration. The RPC fails closed (S11); the API routes fail
   UNSAFELY (undefined Record lookups, C5-C7); rendering silently
   misformats (C8/C13/C15).
4. **Field contract (OPEN PRODUCT DECISION — not chosen here):**
   the natural candidate is REQUIRES weight_kg + duration_seconds,
   PERMITS rpe and is_warmup(?), FORBIDS reps + distance_meters —
   but whether rpe/warmup are permitted, and whether weight is
   required or optional-with-bodyweight-fallback, are product calls.
5. **Empty/zero/partial semantics (OPEN PRODUCT DECISION):**
   completion likely requires duration_seconds > 0; whether
   weight_kg must be > 0 (a vest row might record total added load
   only) is a product call. Today zero/empty behavior is mode-
   specific and enforced at completion only.
6. **Units:** existing conventions cover it — weight stored in kg
   (NUMERIC(6,2)) with lbs conversion in UI (kgToLbs), duration in
   integer seconds. No new unit machinery required.
7. **Legacy exercise_type derivation (OPEN PRODUCT DECISION):**
   deriveLegacyExerciseType has no weight_time case (build-breaking
   once the union grows — good); the DB delivery CASE's ELSE would
   silently emit 'strength' (S9) — that ELSE predates weight_time
   and must become an explicit branch. 'strength' is the plausible
   target (load-bearing hold) but it is a decision, not a default.
8. **Records participation (OPEN PRODUCT DECISION):** weight_time
   does not fit the reps/weight or bodyweight_reps PR models
   (C15/C16). Either it is excluded from records initially or a
   distinct load-x-duration performance model is designed. Silent
   inclusion is the current failure mode and must be prevented.
9. **Exhaustive-switch misbehavior:** confirmed concretely —
   Record lookups return undefined (C5/C6/C7 runtime failures);
   else-branches classify weight_time as weight_reps-like
   (C13/C15/C16 silent misclassification); the RPC alone is
   fail-closed. A schema-only weight_time value therefore CAN
   corrupt derived behavior even before any UI exists.
10. **Delivered rows before product support:** a delivered
    weight_time exercise would be visible but unusable (no set
    entry UI, RPC rejects, API routes 500) and would pollute
    records/summaries if any set ever landed. Delivery of
    weight_time rows MUST wait for full product support; the two
    weighted-plank candidates stay import-ineligible regardless.

## 5. Equipment-value impact (per EXLIB-1C0A decision — distinct values; no `other`/`machine` mapping)

- **Database:** S1 + S5 CHECKs need DROP + re-ADD with the four new
  values appended (exact live-derived constraint names first). Both
  tables in the SAME migration so delivery can never race a
  half-extended pair. Laterality/tracking CHECKs untouched.
- **TypeScript/API:** C1 EQUIPMENT_TYPES, C2 ExerciseEquipment, C3
  EXERCISE_EQUIPMENT labels — one small, mechanical extension each.
- **UI behavior:** with labels shipped, pickers/forms work
  unchanged; without labels, list rows render raw tokens (C11) and
  progress labels are omitted (C12) — degraded but non-crashing;
  the real hazard is C10: editing a row that carries a new value
  before the constants ship can silently downgrade the field.
- **Fallbacks:** generic fallback rendering exists (raw string /
  null label). No code maps unknown equipment onto `machine` or
  `other` — Joseph's no-collapse decision is not violated anywhere.
- **Exact-count assumptions:** none in product code (all checks are
  membership allowlists that extend safely); the pinned-vocabulary
  verifier assertions (C23) are the only exact-set dependents.
- **Catalog delivery before UI support:** technically safe ONLY
  after both CHECKs and the API vocab are extended; recommended to
  ship labels in the same release (trivial cost) to avoid C10/C11.
- **User-created exercises selecting new values (OPEN PRODUCT
  DECISION):** default expectation yes, once C1/C3 ship; may be
  deferred by simply not extending the UI options while extending
  the API — decision recorded, not made.
- **Icons/display assets:** none required — equipment is rendered
  as text labels only; no icon set exists per equipment value.
- **Rollback/downgrade:** once ANY row (tenant or catalog) uses a
  new value, re-contracting the CHECK fails validation against
  existing rows; catalog snapshots are immutable (S8) and delivered
  tenant copies are independent per-user rows. Realistic rollback is
  therefore: forward corrective migration, data normalization with
  explicit product sign-off, or deactivation — never silent CHECK
  contraction. Before any row uses a value, rollback is a trivial
  constraint re-contraction.

## 6. Implementation options and recommendation

| Criterion | A: combined release (4 equipment + weight_time + full product) | B: split — equipment first, weight_time as its own feature | C: schema-first (DB accepts all five before consumers) | D: orthogonal metric-capability model |
|---|---|---|---|---|
| Historical data integrity | good | good | equipment good; weight_time at risk (C15/C16 misclassification) | good long-term |
| Silent data loss prevention | good | good | FAILS for weight_time (undefined Record lookups, silent formats) | good |
| Catalog-delivery safety | good but delayed | good | delivery of weight_time rows unusable (section 4.10) | good |
| Rollback safety | large blast radius | small per stage | schema rollback trivial until rows exist, but risk window open | large migration risk |
| Consumer displacement | everything at once | equipment: C1/C2/C3 (+C23 retargets); weight_time later: C5-C9, C13-C17, C19, S9, S11 | none now, all later under pressure | largest (sets model, RPCs, UI, records) |
| Complexity | high | low then medium | lowest now, highest hidden | highest |
| Testability | one huge phase | two focused phases with existing harness patterns | weak (nothing exercises the new values) | new harness territory |
| Immutable snapshot/run compatibility | fine | fine | fine (no rows exist) | fine |
| Keeps all 26 candidates import-ineligible until support complete | yes | yes | yes only by policy (schema would ACCEPT rows early) | yes |

**PROPOSED — NOT APPROVED:** Option B (split delivery).
Migration 025, when separately authorized, should contain the FOUR
EQUIPMENT VALUES ONLY (both CHECKs, S1+S5, one transaction), released
atomically with the small product extension (C1 vocab, C2 unions, C3
labels) and labeled verifier retargets (C23). `weight_time` ships
later as a dedicated tracking feature whose schema change and full
product support (S3+S6+S9+S11 branches, C5-C9, C13-C17, C19, records
model) land atomically after its open product decisions close.

Explicit answers:

- **Can the four equipment values ship independently?** YES —
  fail-closed everywhere today; extension is additive; blast radius
  is three small vocab surfaces plus labeled verifier retargets.
- **Can weight_time ship as a schema-only value?** NO — the RPC is
  fail-closed but the API set routes fail unsafely (undefined
  lookups), rendering misformats silently, and records/suggestions
  would misclassify; delivered rows would be unusable (section 4).
- **Should migration 025 contain equipment only, tracking only,
  both, or neither?** EQUIPMENT ONLY (proposed), and only after its
  own authorization; tracking waits for its feature phase.
- **Exact product decisions remaining before drafting SQL:**
  (1) weight_time field contract — required/permitted/forbidden
  fields (4.4); (2) completion/zero semantics (4.5); (3) legacy
  exercise_type derivation branch for weight_time (4.7);
  (4) records/PR participation model (4.8); (5) whether user-created
  exercises may select the four new equipment values at launch
  (section 5); (6) smith_machine progression suggestion — "next
  setting" vs default +5 lbs (C15); (7) display label strings for
  the four new equipment values (C3).
  Decisions (1)-(4) gate the weight_time feature only. Decisions
  (5)-(7) are ALL unresolved product decisions for the coordinated
  equipment release: none may be silently defaulted, and none of the
  three (display labels included) is singled out as the only
  blocker. Migration 025 drafting may begin only after Joseph
  explicitly closes all three, unless Joseph explicitly approves a
  documented deferred behavior for a specific decision. The proposed
  atomic release remains both CHECK replacements + C1/C2/C3 product
  support + verifier retargets, and all 26 candidates remain
  import-ineligible throughout.
- **What must be released atomically?** Equipment: both CHECKs +
  C1/C2/C3 + verifier retargets in one reviewed release. Weight_time:
  its schema CHECKs + S9/S11 branches + C5-C9/C13-C17/C19 + records
  decision in one reviewed release. Never a bare CHECK first.

## 7. Proposed rollout and rollback boundaries (fail-closed, staged)

1. Architecture/product decision turn: close open decisions
   (section 6) — nothing drafted until then.
2. Product/type/API work required BEFORE schema acceptance:
   equipment labels + vocab + unions prepared in the same candidate
   as the migration (never merged separately ahead of it).
3. Migration 025 draft (equipment-only per the proposal) with exact
   live-derived constraint names; fingerprint recorded; reviewed
   against this audit; REVIEW APPROVAL OF THE FINGERPRINT ONLY.
4. Disposable local-Postgres verification (existing live-suite
   pattern): assert old rows still valid, new values accepted, both
   tables extended, constraint names exact, single-transaction
   atomicity (colliding-object abort test), delivery function
   unaffected for the existing four modes.
5. Candidate preparation and promotion under the standing QA
   protocol (harness, battery, TREE_MATCH, exports).
6. Explicit Supabase application authorization (Joseph/ChatGPT only;
   exact fingerprint; Claude never applies).
7. Read-only post-application verification recorded in notes
   (constraint definitions, no data change, advisors).
8. Catalog candidate eligibility review — the four equipment-blocked
   candidates (and every other candidate) remain import-ineligible
   until the FULL EXLIB-1C review chain closes; this stage only
   re-evaluates their equipment blocker.
9. Dry-run payload review (no loading).
10. Explicit loading authorization (separate, fingerprint-scoped).
11. Import (EXLIB-1C implementation phase, separately authorized).
12. Rollback rehearsal on a disposable cluster against the real
    payload (rollback_catalog_delivery + constraint-contraction
    tests both before and after simulated adoption).
13. Hosted QA.

Rollback analysis:

- **CHECK contraction after adoption:** re-adding the old 8-value
  CHECK fails its full-table validation scan the moment one row uses
  a new value — contraction is only possible while zero rows use the
  values; after that, rollback is forward-only.
- **Value removal with dependent rows:** impossible without first
  normalizing or deleting dependent rows; any such normalization is
  itself a product decision (EXLIB-1C0A forbids silent remapping to
  `other`/`machine`).
- **Catalog snapshots / delivered tenant copies:** snapshots are
  immutable (S8) — a bad value is corrected by a NEW catalog version
  row, and delivered per-user copies are either rolled back through
  rollback_catalog_delivery (run-scoped) or individually corrected
  as user rows; the sealed-run contract keeps membership auditable
  throughout.
- **What rollback means here:** code rollback for product surfaces;
  forward corrective migration for schema; explicit normalization or
  deactivation for data — never constraint contraction over live
  values.
- **Why catalog records stay ineligible during this phase:** the
  schema cannot yet accept four of the candidates' equipment values
  or the planks' tracking value, the review chain (Gates, 48-record
  resolutions, specialist sign-off, payload fingerprint, loading
  authorization) is open, and eligibility before support would
  invite exactly the silent-misclassification failures this audit
  exists to prevent.

## 8. Scope confirmation

This audit authors no SQL, no migration 025, no schema or product
change, no catalog payload, and no importer. The authoritative
ledger remains 48/48 pending-null; the equipment overlay remains 9
resolutions / 26 candidates, all import-ineligible; migrations
remain exactly 001-024.
