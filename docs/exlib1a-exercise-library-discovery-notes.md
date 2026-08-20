# EXLIB-1A — Exercise Library Discovery, Deduplication, and Import Manifest

Research, audit, and planning phase only (recorded 2026-08-20).
Nothing was imported; no migration was created; no Supabase or
product-behavior change occurred. Starting state: `main` =
`a74293ca29a65926f066a441c95e440e5b77ff2e`
(`ui-overhaul-closeout-stable`), migrations exactly 001–022.

## Part 1 — Existing ForgeFitOS library audit (read-only)

**Schema (`exercises`, migration 003 + 011 + 018).** Per-user rows:
`id` UUID PK; `user_id` NOT NULL FK `auth.users` (there is NO global
exercise table — every user owns private copies); `name` TEXT
(max 100 enforced in `src/lib/exercise-validation.ts`); `category`
enum `compound|isolation|cardio|mobility|other`; `primary_muscle`
25-value canonical vocabulary (018: chest, lats, upper_back,
lower_back, traps, front_delts, side_delts, rear_delts, biceps,
triceps, forearms, quads, hamstrings, glutes, calves, hip_flexors,
adductors, abductors, abs, obliques, plus retained broad back/
shoulders/core, full_body, other); `secondary_muscles` JSONB
(DEPRECATED since 5A.6B — read-only rollback insurance, never
written); `equipment` enum `barbell|dumbbell|cable|machine|
bodyweight|resistance_band|kettlebell|other`; `exercise_type`
(legacy, derived from tracking mode); `tracking_mode`
`weight_reps|bodyweight|cardio|timed` (011 — source of truth);
`unilateral` BOOLEAN (no alternating value); `notes`; `is_active`;
`is_system`; timestamps. Unique index `(user_id, lower(name))`.

**Anatomy relationships (`exercise_muscles`, 018).** Normalized
secondary/tertiary roles only (primary stays on the exercise row —
exactly-one-primary structurally guaranteed); no contribution
weights by design.

**Name rules.** Trimmed, ≤100 chars, uniqueness is case-insensitive
per user via `lower(name)`. **There is no alias structure anywhere**
— an alias capability does not exist in schema, code, or docs.

**Ownership.** "Default" exercises are the 15 `SEED_EXERCISES` in
`src/lib/supabase/seed-exercises.ts`, inserted PER USER
(`is_system: true`, the user's own `user_id`) on first `/workouts`
visit; idempotent by count with 23505 tolerance. User-created
exercises are the same table with `is_system: false`.

**History identity.** `workout_exercises.exercise_id` and
`routine_exercises.exercise_id` both FK `exercises(id)` with
`ON DELETE RESTRICT` — history and routines depend on exercise IDs;
deletion is restricted and the product deactivates (`is_active`)
with a logged decision instead.

**Create/edit paths (complete list).** `POST /api/exercises`
(validated insert + `exercise_muscles` targets), `PATCH
/api/exercises/[id]`, `DELETE /api/exercises/[id]`
(restrict-aware), and `seedExercisesIfNeeded`. No other write path
exists; there is no import path today.

**Current canonical library (15 seeds).** Bench press, Incline
dumbbell press, Chest fly, Lat pulldown, Seated cable row, Shoulder
press, Lateral raise, Squat, Romanian deadlift, Leg press, Leg
curl, Leg extension, Biceps curl, Triceps pushdown, Plank — all
`weight_reps` except Plank (`bodyweight`); anatomy per the 5A.6B
refinement table in the seed file. **No duplicate or likely-duplicate
clusters exist within the seed set** (15 distinct normalized names).
Per-user database rows cannot be audited this turn (no Supabase
access) and are out of scope; the repo-defined seed set is the
canonical comparison target.

**Missing schema capabilities for a safe expansion** (facts, not
proposals — proposals are Part 6): no alias table; no provenance
fields (source URL, retrieval date, import run); no
review/confidence status; no `alternating` laterality; no global
catalog versioning (per-user seeding means "expansion" must define
both new-user seeds AND an existing-user backfill policy); muscle
vocabulary lacks neck and tibialis anterior values (surfaced by
real source entries).

## Part 2 — Research boundary and access outcome

Source: the public StrengthLog Exercise Directory
(https://www.strengthlog.com/exercise-directory/), retrieved
2026-08-20 over normal public HTTP. `robots.txt` allows all paths
(`User-agent: * / Disallow:` empty). One directory page was
fetched; **no per-exercise pages were scraped**, and no
descriptions, instructions, cues, safety text, images, or videos
were read, copied, or stored. Only factual data was collected:
exercise name, directory category placement, and canonical URL —
plus ForgeFitOS-authored research annotations (equipment,
laterality, category, tracking mode, anatomy candidates), which are
our own classification work, not source content. Every record
carries `source_url`, `source_page`, and `retrieved_at`.

**Licensing and access boundary (binding on all EXLIB phases):**

- `robots.txt` permission governs CRAWLER ACCESS ONLY. It conveys
  nothing about copyright, database rights, licensing, endorsement,
  or commercial reuse, and this phase claims none of those.
- The discovery manifest is an internal research/review artifact
  only — **not for external redistribution**. Its presence in this
  repository does not approve redistribution, production import, or
  commercial use of the dataset.
- Any EXLIB-1C import into the product requires a prior explicit
  legal/product approval of BOTH the factual dataset and the
  provenance approach — the manifest existing is not that approval.
- StrengthLog prose, instructions, descriptions, coaching cues,
  images, and videos remain prohibited from copying in every future
  phase; ForgeFitOS content will be authored originally (Part 5).
- StrengthLog is a research/discovery source only; it
  does not endorse ForgeFitOS.

Coverage: all 13 publicly listed directory categories (Chest 43,
Shoulders 57, Biceps 24, Triceps 17, Legs 74, Back 77, Glutes 29,
Abs 46, Calves 8, Forearm Flexors & Grip 12, Forearm Extensors 2,
Neck 4, Cardio Exercises & Equipment 2) = **395 entries**.

### Provenance record (pinned by verify-exlib1a)

- Canonical source page: https://www.strengthlog.com/exercise-directory/
- Retrieval timestamp: 2026-08-20 (UTC date; single GET over public HTTP)
- HTTP status: 200; response size: 228,473 bytes
- SHA-256 of the exact fetched directory-page response bytes:
  `d7e461feec89903baac1ac05a9521420217ef5fe40634127de7363856c39c3bf`
- Category counts: Chest Exercises 43; Shoulder Exercises 57; Bicep
  Exercises 24; Triceps Exercises 17; Leg Exercises 74; Back
  Exercises 77; Glute Exercises 29; Ab Exercises 46; Calves
  Exercises 8; Forearm Flexors & Grip Exercises 12; Forearm
  Extensor Exercises 2; Neck Exercises 4; Cardio Exercises &
  Equipment 2 — total 395.
- Name normalization algorithm `exlib1a-norm-v1`: Unicode NFKD;
  typographic apostrophe -> ASCII; lowercase; every character
  outside [a-z0-9 ] replaced with a space; whitespace collapsed and
  trimmed.
- Deterministic ordering rule: records sorted lexicographically by
  (source_category, source_name); one JSON object per line with
  sorted keys.
- Comparison target: the 15 canonical `SEED_EXERCISES`
  (name/category/primary_muscle/equipment/tracking_mode/unilateral),
  canonically serialized as compact JSON sorted by name with sorted
  keys; SHA-256
  `a93a83cc0b492906a077a015cc8345b8f9d1f0da502831fc360bbbcadbca28e3`.
- Matching rules: EXACT = normalized-name equality with a seed;
  ALIAS = explicit curated equipment-synonym/word-order rule mapping
  a source name onto one seed; AMBIGUOUS COLLISION = two or more
  source variants contending for one generic seed (held for human
  naming review, never auto-aliased); ADDITION = everything else;
  EXCLUSION = only with a recorded reason (none were needed). Every
  record belongs to exactly one disposition.
- The fetched HTML and the builder pipeline live outside the
  repository (`/tmp`) and are NOT committed; the manifest is the
  deterministic reviewable artifact, reproducible from the recorded
  page bytes (verified by the SHA above) plus the rules in this
  section.

## Parts 3–4 — Discovery inventory and deduplication

Artifacts:

- `docs/exlib1a-discovery-manifest.jsonl` — 395 records, one JSON
  object per line, deterministically sorted by (source_category,
  source_name), fields per the EXLIB-1A contract (source name,
  proposed name, category, URL, retrieval date, equipment,
  laterality bilateral/unilateral/alternating, compound/isolation,
  tracking mode, primary/secondary/tertiary candidates, exact match,
  likely match, alias proposal, confidence, review notes,
  eligibility).
- `docs/exlib1a-human-review-queue.md` — the 48 records that cannot
  be classified deterministically.

**Deduplication model** (deterministic, run against the 15 seeds):
case-insensitive normalization (lowercase, punctuation/hyphens ->
spaces, whitespace collapse, unicode NFKD), explicit equipment-
synonym and word-order alias rules, laterality-variant awareness,
and movement-family review notes. Results:

1. **Exact existing matches — 7:** Bench Press, Incline Dumbbell
   Press, Squat, Romanian Deadlift, Leg Press, Leg Extension, Plank.
2. **Alias candidates for existing exercises — 7:** Dumbbell
   Shoulder Press -> Shoulder press; Dumbbell Lateral Raise ->
   Lateral raise; Dumbbell Curl -> Biceps curl; Standing Cable Chest
   Fly -> Chest fly; Lat Pulldown With Pronated Grip -> Lat pulldown;
   Cable Close Grip Seated Row -> Seated cable row; Tricep Pushdown
   With Bar -> Triceps pushdown.
3. **Genuine likely additions — 379** (333 fully classified
   `ready_for_review` + 46 held for anatomy/naming review).
4. **Ambiguous collisions requiring human review — 2:** Lying Leg
   Curl and Seated Leg Curl both collide with the generic ForgeFitOS
   "Leg curl" (machine); a human must pick which variant the
   canonical exercise aliases, keeping the other as an addition.
5. **Excluded source entries — 0** (every directory entry is a real
   loggable exercise; nothing warranted exclusion — recorded
   honestly rather than inventing exclusions).

Confidence totals: **high 125, medium 222, human_review_required
48**. Major ambiguity groups in the review queue: neck exercises
(4 — vocabulary lacks a neck value), tibialis/heel-walk entries
(4 — vocabulary lacks tibialis anterior), olympic-lift and
full-body movements (get-ups, jerks, ground-to-overhead, thrusters,
jumps — contested anatomy), rotator-cuff rotations (broad
`shoulders` pending a vocabulary decision), load-bearing timed
holds (Weighted Plank, Farmers Walk — tracking-mode mismatch), the
two leg-curl collisions, and entries whose equipment cannot be
inferred from the name.

**Identity/history rules (binding on any future import):** existing
ForgeFitOS exercise IDs remain authoritative; an import never
replaces an existing exercise because an external name looks
cleaner; aliases resolve to the canonical exercise without
fragmenting workout history; user-created exercises are never
overwritten, converted to defaults, or silently merged; re-running
an import is idempotent.

## Part 5 — Original-content plan (future authoring template)

Every genuine addition that ships will carry ForgeFitOS-owned
content authored from scratch (never source text): (1) a one-to-two
sentence original summary; (2) original setup instructions;
(3) original execution steps; (4) original coaching cues;
(5) original common mistakes; (6) original safety considerations;
(7) original, commissioned, generated, or properly licensed
demonstration media. EXLIB-1A deliberately writes none of these.
Specialized human review before authoring: the olympic-lift family
(technique-dense), Nordic/GHR eccentrics and loaded spinal flexion
(Jefferson Curl) for safety framing, neck training (safety
exclusions), and behind-the-neck movements (shoulder-mobility
caveats).

## Part 6 — Proposed implementation contract (NOT authored; nothing
here is approved or scheduled by this document)

- **Aliases:** a new `exercise_aliases` table (alias text, canonical
  `exercise_id`, per-user uniqueness on `lower(alias)`) — the
  existing unique index on `exercises(user_id, lower(name))` cannot
  represent alias->canonical resolution without overloading `name`.
- **Provenance:** `source_url`, `source_page`, `retrieved_at`,
  `import_run_id`, `import_confidence`, `review_status` on imported
  rows (or a companion `exercise_import_records` table keyed by
  exercise_id — preferred, keeps the hot table narrow).
- **Idempotency:** a stable natural key per manifest record
  (source_url) + `import_run_id`; re-runs upsert by that key and
  never touch rows whose `review_status` a human has changed.
- **Default protection:** imports only ever insert `is_system=true`
  rows for the catalog path and never modify an existing row's
  name/anatomy; existing-user backfill is opt-in and additive.
- **User protection:** rows with `is_system=false` are untouchable
  by the importer; name collisions with a user exercise leave the
  user row canonical and record the import candidate as its alias
  or skip it (human decision).
- **Anatomy review:** every `human_review_required` and `medium`
  anatomy mapping goes through a review UI/checklist before import;
  `high` may be batch-approved.
- **History preservation:** imports never delete or re-point
  `exercise_id` references; aliases are additive; RESTRICT FKs stay.
- **Rollback:** every import run tags its rows with `import_run_id`;
  rollback = deactivate (`is_active=false`) rows from a run that
  have zero workout/routine references, and only deactivate (never
  delete) referenced ones.
- **Candidate migration:** 023 (exercise_aliases + import
  provenance) — **explicitly unapproved and not authored**; Joseph/
  ChatGPT apply migrations, never Claude.
- **Future phases:** EXLIB-1B schema + review tooling; EXLIB-1C
  approved-manifest import; EXLIB-1D original instructional
  content; EXLIB-1E media.

## Executive summary

| Metric | Count |
|---|---|
| Source entries discovered (13 categories) | 395 |
| Current ForgeFitOS canonical exercises | 15 |
| Exact existing matches | 7 |
| Alias candidates | 7 |
| Genuine likely additions | 379 |
| Ambiguous collisions | 2 |
| Excluded entries | 0 |
| Confidence high / medium / human review | 125 / 222 / 48 |
| Human-review queue | 48 |

## Stop boundary

EXLIB-1A stops uncommitted on `main` for ChatGPT review. No branch,
commit, push, tag, Supabase contact, migration 023, product/API
code, database rows, copied prose/media, or work on Coach Suggested
Routine, community publishing, fasting reminders, running plans, or
OCR nutrition.
