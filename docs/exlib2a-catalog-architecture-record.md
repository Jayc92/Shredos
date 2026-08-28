# EXLIB-2A — Extensive-library catalog architecture record

**DESIGN RECORD ONLY.** Prepared 2026-08-28 on the EXLIB-2A/2B design
milestone under Joseph's standing autonomy contract and his
2026-08-28 extensive-library direction. It authorizes no migration,
no catalog loading, no ledger change, and no runtime code change.
Migration numbering and application stay downstream of independent
review. Baseline: main = `c42ce05ac085ccf78b570aba8b81fd3d1060ea93`
(EXLIB-1C0B5 stable), migrations exactly 001-025, catalog tables
empty, ledger 48/48 pending-null, 26 legacy candidates
import-ineligible.

Every decision below follows the standing decision rule: Joseph's
explicit direction first, then stable committed records, then
repository conventions, then the safest reversible option. Where the
repository already implements a mechanism, this record reuses it
rather than inventing a parallel one.

## 1. Where versioned ForgeFitOS-authored instructional content lives

**Decision: a companion versioned content table,
`exercise_catalog_content`, keyed by catalog snapshot row — not new
columns on `exercise_catalog`.**

Repository evidence: `exercise_catalog` (migration 023) is a
versioned identity/tracking-metadata table with freeze triggers
(`exlib_freeze_catalog_snapshot`) that make approved snapshots
immutable, and a review-audit CHECK that binds review evidence to the
whole row. Authored guidance is long-form, iterates on a different
cadence than tracking metadata, and should be reviewable/correctable
without forging new tracking-metadata versions. A companion table
preserves the existing freeze/approval machinery untouched and keeps
identity/tracking metadata separate from prose, per the preferred
architectural direction.

SQL-shape (pseudocode — NOT a migration):

    CREATE TABLE exercise_catalog_content (
      id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      catalog_id         UUID NOT NULL REFERENCES exercise_catalog(id)
                         ON DELETE RESTRICT,
      content_version    INTEGER NOT NULL CHECK (content_version > 0),
      setup_steps        JSONB NOT NULL,      -- array of short strings
      execution_steps    JSONB NOT NULL,
      breathing_cue      TEXT NOT NULL,
      common_mistakes    JSONB NOT NULL,
      safety_guidance    TEXT NOT NULL,       -- technique-framed, never medical advice
      equipment_setup    TEXT,
      substitutions      JSONB NOT NULL DEFAULT '[]',
      regressions        JSONB NOT NULL DEFAULT '[]',
      progressions       JSONB NOT NULL DEFAULT '[]',
      accessibility_alternative TEXT,
      is_active          BOOLEAN NOT NULL DEFAULT true,
      created_at/updated_at ...,
      UNIQUE (catalog_id, content_version)
      -- one active content row per catalog_id (partial unique index,
      -- same pattern as exercise_catalog_one_active_logical_idx)
    );
    -- RLS: closed like all catalog tables (ENABLE RLS, zero client
    -- policies, REVOKE ALL FROM PUBLIC/anon/authenticated); content
    -- reaches clients only through a SECURITY DEFINER read path
    -- (section 5) or delivered tenant columns — decided at
    -- implementation review.
    -- Freeze trigger: content rows freeze once their catalog row's
    -- review_status is approved, matching exlib_freeze_* conventions;
    -- corrections create content_version+1 (section 5).

Structured steps use constrained JSONB arrays validated by the
authoring pipeline (docs/exlib2c-authoring-schema.json) BEFORE load
and by CHECKs on array element type/length at implementation review —
JSONB here holds ordered prose lists, not behavior-critical metadata
(section 3 keeps behavior-critical fields relational/enumerated).

## 2. Original-content provenance coexisting with source-derived provenance

**Decision: an explicit `provenance` discriminator with conditional
source-field requirements.**

Repository evidence: `exercise_catalog.source_url/source_page/
retrieved_at` are NOT NULL today because migration 023 was designed
for the legacy source-derived manifest era. The new corpus is
ForgeFitOS-original, so those semantics must become conditional
without weakening the legacy path.

SQL-shape (pseudocode):

    ALTER TABLE exercise_catalog
      ADD COLUMN provenance TEXT NOT NULL DEFAULT 'external_source_derived'
        CHECK (provenance IN ('forgefitos_original','external_source_derived')),
      ADD COLUMN authored_by TEXT,
      ADD COLUMN authored_at DATE,
      ALTER COLUMN source_url  DROP NOT NULL,
      ALTER COLUMN source_page DROP NOT NULL,
      ALTER COLUMN retrieved_at DROP NOT NULL,
      ADD CONSTRAINT exercise_catalog_provenance_chk CHECK (
        (provenance = 'external_source_derived'
          AND source_url IS NOT NULL AND source_page IS NOT NULL
          AND retrieved_at IS NOT NULL)
        OR
        (provenance = 'forgefitos_original'
          AND source_url IS NULL AND source_page IS NULL
          AND retrieved_at IS NULL
          AND authored_by IS NOT NULL
          AND char_length(btrim(authored_by)) > 0
          AND authored_at IS NOT NULL)
      );

The DEFAULT keeps any pre-existing row semantics identical (all zero
rows today, but the default documents intent); the CHECK makes it
structurally impossible for source-derived data to masquerade as
original (and vice versa) — the same fail-closed style as the
review-audit CHECK. Authoring metadata is recorded honestly:
`authored_by`/`authored_at` state who wrote the ForgeFitOS prose and
when; they claim no specialist, legal, or medical approval (that
lives exclusively in the review fields).

## 3. Difficulty, movement pattern, training role, availability

**Decision: constrained enumerated columns on `exercise_catalog`,
not a free-form tags bag.**

These drive discovery/filtering behavior, so they follow the
repository's behavior-critical convention (CHECK-constrained TEXT,
exactly like category/laterality/tracking_mode):

    ALTER TABLE exercise_catalog
      ADD COLUMN movement_pattern TEXT NOT NULL CHECK (movement_pattern IN (
        'horizontal_push','incline_push','vertical_push','dip_push',
        'horizontal_pull','vertical_pull','pullover','fly_adduction',
        'shrug','shoulder_raise','elbow_flexion','elbow_extension',
        'grip_forearm','squat','hinge','lunge','leg_extension',
        'leg_curl','calf_raise','hip_extension','hip_abduction',
        'hip_adduction','core_flexion','core_rotation',
        'core_anti_extension','core_anti_rotation','core_lateral','carry')),
      ADD COLUMN training_role TEXT NOT NULL CHECK (training_role IN (
        'compound','isolation','accessory','core','conditioning','mobility')),
      ADD COLUMN difficulty TEXT NOT NULL CHECK (difficulty IN (
        'beginner','intermediate','advanced')),
      ADD COLUMN availability TEXT NOT NULL CHECK (availability IN (
        'minimal','home_gym','commercial_gym'));

These are catalog-layer discovery metadata; they do NOT need to be
copied onto tenant `exercises` rows in release 1 (the tenant row
keeps its current shape; discovery/filter UI reads catalog metadata
through the delivered `catalog_id` join or a read function — an
implementation-review choice that does not change this record's
contract). Vocabularies are fixed here and mirrored in
docs/exlib2c-authoring-schema.json; extending them later is a
reviewed vocabulary change exactly like EXLIB-1C0B1->B3 was for
equipment.

## 4. Regressions, progressions, substitutions, aliases, synonyms

**Decision: reuse the existing alias machinery unchanged; represent
exercise-to-exercise relationships as a new closed relational table
keyed by catalog logical identity.**

Repository evidence: `exercise_catalog_aliases` +
`exercise_aliases` + the claim functions already implement
fail-closed alias delivery and search synonyms — nothing new needed
for aliases. Relationships must survive versioning, so they bind
logical ids (stable identity), not snapshot ids:

    CREATE TABLE exercise_catalog_relationships (
      from_logical_id UUID NOT NULL REFERENCES exercise_catalog_logical(id),
      to_logical_id   UUID NOT NULL REFERENCES exercise_catalog_logical(id),
      relation        TEXT NOT NULL CHECK (relation IN
                      ('regression','progression','substitution')),
      PRIMARY KEY (from_logical_id, to_logical_id, relation),
      CHECK (from_logical_id <> to_logical_id)
      -- closed RLS + REVOKE ALL, same as every catalog table
    );

In authoring files (EXLIB-2C), relationships are expressed by
canonical name and resolved to logical ids at load time,
failing closed on any unresolved name.

## 5. Corrections and new versions propagating to tenant copies

**Decision: catalog corrections mint a new content version (prose)
or a new catalog version (metadata), and a refresh function updates
ONLY catalog-controlled fields on delivered tenant rows — never
user-owned fields, never historical rows.**

Repository evidence: delivered tenant rows already carry
`catalog_id`, `catalog_logical_id`, `import_run_id` (migration 023),
so "which rows came from the catalog" is already recorded per row.
Refresh shape (pseudocode):

    FUNCTION refresh_catalog_exercises() SECURITY DEFINER
      -- for the CALLING user (auth.uid()), for each tenant exercise
      -- with catalog_logical_id whose active catalog version is newer
      -- than the delivered catalog_id:
      --   update ONLY catalog-controlled fields (name*, category,
      --   primary_muscle, equipment, tracking metadata if compatible)
      --   and repoint catalog_id to the new version;
      --   NEVER touch user-owned notes, is_active, or any
      --   workout/history row; name updates go through the
      --   normalized-name claim check and are SKIPPED (not forced)
      --   on collision, exactly like delivery.

Tenant `id` is untouched, so every historical `workout_exercises`
reference stays valid (section 6). Prose content corrections are
pure catalog-side version bumps; tenant rows hold no prose.

## 6. Stable IDs and historical references

**Decision: unchanged — the existing model already guarantees it.**

Tenant `exercises.id` is the only id workouts/routines reference
(`workout_exercises`, `workout_routine_exercises` FK to it, verified
in migrations 003/004); delivery inserts tenant copies once and
refresh never re-creates them; hard deletes of delivered rows are
already trigger-blocked (`exlib_block_delivered_exercise_delete`).
History is therefore stable by construction.

## 7. Archiving/hiding catalog exercises

**Decision: per-user `is_active = false` on the tenant copy — the
mechanism that already exists and is already the only one permitted.**

Delivered rows cannot be deleted (trigger above); the library UI
already renders an inactive section with a show/hide toggle
(`ExercisesClient`). Shared catalog content is never affected by a
user hiding their copy. No new mechanism required.

## 8. Preserving and later reconciling the 15-row seed libraries

**Decision: preserve seed rows untouched now; reconcile later by
LINKING (provenance backfill), never merging or deleting.**

All 15 seed names have catalog identities in the release-1 inventory
(mechanically proven in EXLIB-2B). The later reconciliation phase —
separately proven, per Joseph's direction — backfills
`catalog_logical_id`/`catalog_id` onto a user's existing seed row
when (a) normalized names match, (b) tracking_mode matches, and
(c) equipment matches; anything else is left unlinked and simply
coexists (the user keeps their row; delivery's claim check skips the
colliding catalog name for that user). Linked seed rows then receive
catalog metadata refreshes like any delivered row, but their ids,
history, notes, and active state never change. Unlinked-but-colliding
rows are a UI labeling concern, not a data operation.

## 9. How future accounts receive the catalog

**Decision: replace bare-15 seeding with full-catalog delivery at
first authenticated use, only after delivery is proven; curated
discovery instead of a restricted subset.**

`seedExercisesIfNeeded` (called from the exercises page and API
route) is the existing hook point. End state: for a user with zero
exercises, the server calls the delivery path for the approved
run(s) instead of inserting the 15 hardcoded rows; the full approved
catalog becomes available with discovery/filtering (difficulty,
equipment, availability, pattern — section 3 metadata) carrying the
curation load, per Joseph's direction that users get the whole
approved catalog rather than a withheld starter subset. Sequencing
guard: the seed function is retired for future accounts ONLY after
EXLIB-2G/2H prove delivery end-to-end; until then nothing changes for
anyone.

## 10. Collision handling and normalized-name claims

**Decision: unchanged — the existing fail-closed machinery is the
contract.**

`exercise_name_claims` (one normalized claim per tenant exercise,
trigger-maintained), catalog-side claims, and delivery's
skip-on-collision loop (migration 023) already implement exactly the
required semantics, proven by the 27/0 live suite. The only new rule
is procedural: release-1 authoring must keep canonical names unique
under normalization (proven mechanically now, re-proven at every
later stage).

## 11. Structural exclusion of weight_time entries

**Decision: three independent locks.**

(1) Data: deferred entries carry `deferred: true` +
`tracking_mode: "weight_time"` and are excluded from every proposed
import subset (schema rule: a non-deferred record may only use the
four supported modes). (2) Verifier: `verify-exlib2a2b.ts` fails if
any weight_time entry is non-deferred. (3) Schema: the live 4-value
tracking-mode CHECKs (exercises 010, catalog 023) physically reject
weight_time rows until the separately authorized weight_time
implementation widens them — the same DROP/re-ADD pattern migration
025 used for equipment, per the EXLIB-1C0B1 audit.

## 12. Rollback, idempotency, revocation, failed delivery

**Decision: unchanged — reuse migration 023's machinery; extensions
inherit its guarantees.**

`deliver_catalog_exercises` is transactional, idempotent (re-runs
skip existing rows), collision-safe, and run-scoped to
approval-sealed membership; `exlib_revoke_run_delivery` halts
further delivery of a run; `rollback_catalog_delivery` removes a
run's delivered-but-unused rows. The refresh function (section 5)
must meet the same bar at implementation review: transactional,
idempotent, skip-on-collision, and inert for users who never
received the run. Signup delivery failure (section 9) must fail the
seeding step closed and leave the user with zero rows and a clean
retry on next request — never a partial library plus a poisoned
state; this is achievable because delivery is idempotent.

## Proposed schema-delta inventory (for the later reviewed migration)

All downstream of independent review; no migration is authored in
this milestone:

1. `exercise_catalog_content` — new closed table (section 1).
2. `exercise_catalog` — provenance discriminator + conditional
   source-field CHECK + authored_by/authored_at (section 2).
3. `exercise_catalog` — movement_pattern / training_role /
   difficulty / availability enumerated columns (section 3).
4. `exercise_catalog_relationships` — new closed table (section 4).
5. `refresh_catalog_exercises()` — new SECURITY DEFINER function
   (section 5) with delivery-equivalent security and atomicity.
6. Signup-delivery wiring replacing bare-15 seeding for new accounts
   (section 9) — runtime change, last, only after 2G/2H proof.

Security requirements for every addition: RLS enabled with zero
client policies + REVOKE ALL on new catalog tables; SECURITY DEFINER
functions scoped to `auth.uid()` with no user parameter; no
service_role anywhere; every new CHECK named explicitly; freeze
triggers on approved content.

## Explicitly out of scope for this milestone

Instructional prose authoring (EXLIB-2C), any migration file, ledger
changes, import eligibility, hosted contact, and the weight_time
implementation (paused, next after this program's first release per
Joseph's ordering decision).
