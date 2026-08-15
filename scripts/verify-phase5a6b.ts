// ============================================================
// ForgeFitOS — Phase 5A.6B deterministic verification harness
// Verifies the exercise anatomy upgrade: migration 018 (widened
// 25-value CHECK + the exercise_muscles relationship table with RLS,
// grant, and backfill), the canonical taxonomy with labels/regions,
// the explicit-roles API contract (validateMuscleTargets and both
// normalize entry points execute at RUNTIME), the role-collision
// rules, the form/list UI, Coach broad-group
// compatibility, refined seeds — and the safety rules: the
// deprecated secondary_muscles JSONB is retained but never written
// (no dual-write), no contribution weights exist anywhere, primary
// stays on exercises.primary_muscle, and workout history resolves
// through exercise_id untouched.
// Run from the repository root:
//   npx tsx scripts/verify-phase5a6b.ts
// ============================================================

import { readFileSync, existsSync, readdirSync } from 'fs'
import {
  MUSCLE_GROUPS,
  MUSCLE_LABELS,
  MUSCLE_REGIONS,
  MUSCLE_ROLES,
  validateMuscleTargets,
  normalizeExerciseCreatePayload,
  normalizeExercisePatchPayload,
} from '../src/lib/exercise-validation'
import type { MuscleGroup } from '../src/lib/exercise-validation'
import { PRIMARY_MUSCLES } from '../src/lib/constants'
import { SEED_EXERCISES } from '../src/lib/supabase/seed-exercises'

let passed = 0
let failed = 0

function check(name: string, condition: boolean, detail?: string) {
  if (condition) {
    passed++
    console.log(`  PASS  ${name}`)
  } else {
    failed++
    console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

const read = (p: string) => readFileSync(p, 'utf8')
const stripComments = (s: string) => s.replace(/\/\/.*$|\/\*[\s\S]*?\*\//gm, '')
const stripSql = (s: string) => s.replace(/^--.*$/gm, '')
const EMOJI = new RegExp('\\p{Extended_Pictographic}', 'u')

const migration = read('supabase/migrations/018_phase5a6b_exercise_muscles.sql')
const validation = read('src/lib/exercise-validation.ts')
const constants = read('src/lib/constants.ts')
const types = read('src/types/database.ts')
const form = read('src/components/workout/ExerciseForm.tsx')
const listItem = read('src/components/workout/ExerciseListItem.tsx')
const postRoute = read('src/app/api/exercises/route.ts')
const idRoute = read('src/app/api/exercises/[id]/route.ts')
const coach = read('src/lib/workout-coach.ts')
const seeds = read('src/lib/supabase/seed-exercises.ts')
const libraryPage = read('src/app/(app)/workouts/exercises/page.tsx')
const notes = read('docs/phase5a6b-exercise-anatomy-notes.md')

const CHANGED = [validation, constants, types, form, listItem, postRoute, idRoute, coach, seeds, libraryPage]

const CANONICAL_25 = [
  'chest', 'lats', 'upper_back', 'lower_back', 'traps',
  'front_delts', 'side_delts', 'rear_delts',
  'biceps', 'triceps', 'forearms',
  'quads', 'hamstrings', 'glutes', 'calves',
  'hip_flexors', 'adductors', 'abductors',
  'abs', 'obliques',
  'back', 'shoulders', 'core',
  'full_body', 'other',
]
const OLD_13 = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
  'core', 'quads', 'hamstrings', 'glutes', 'calves', 'full_body', 'other',
]

// ── 1. Checkpoint and migration 018 schema ───────────────────────────
console.log('\n1. Checkpoint and migration 018')
{
  check('checkpoint artifacts exist (a8531cd tree)',
    ['scripts/verify-phase5a6a.ts', 'docs/phase5a6a-default-three-sets-notes.md',
      'supabase/migrations/017_phase5a4_daily_activity_distance.sql']
      .every((f) => existsSync(f)))
  check('5A.6B notes exist', notes.length > 3000)
  // RETARGETED (5B.2): 019 is that approved phase's nutrition-day-
  // status migration, so this pin narrows to its true claim — 5A.6B
  // added exactly 018 (same retarget class as every prior phase
  // boundary pin).
  check('5A.6B migration boundary: added exactly 018 (no duplicates)',
    existsSync('supabase/migrations/018_phase5a6b_exercise_muscles.sql') &&
    readdirSync('supabase/migrations').filter((f) => f.startsWith('018')).length === 1)
  check('018 drops and recreates the primary_muscle CHECK by its deterministic name',
    migration.includes('DROP CONSTRAINT exercises_primary_muscle_check') &&
    migration.includes('ADD CONSTRAINT exercises_primary_muscle_check CHECK (primary_muscle IN ('))
  check('widened CHECK contains every canonical value',
    CANONICAL_25.every((m) => migration.includes(`'${m}'`)))
  check('018 creates exercise_muscles', migration.includes('CREATE TABLE exercise_muscles ('))
  const COLUMNS = [
    'id           UUID PRIMARY KEY DEFAULT gen_random_uuid()',
    'user_id      UUID NOT NULL',
    'exercise_id  UUID NOT NULL',
    'muscle       TEXT NOT NULL',
    'role         TEXT NOT NULL',
    'created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()',
  ]
  for (const col of COLUMNS) {
    check(`column: ${col.split(/\s+/)[0]}`, migration.includes(col))
  }
  check('user FK cascades', /user_id[\s\S]{0,120}auth\.users\(id\)[\s\S]{0,40}ON DELETE CASCADE/.test(migration))
  check('exercise FK cascades', /exercise_id[\s\S]{0,120}exercises\(id\)[\s\S]{0,40}ON DELETE CASCADE/.test(migration))
  check('roles are secondary/tertiary ONLY',
    migration.includes("CHECK (role IN ('secondary', 'tertiary'))") &&
    !stripSql(migration).includes("'primary'"))
  check('unique exercise+muscle (a muscle never appears twice on one exercise)',
    migration.includes('UNIQUE (exercise_id, muscle)'))
  check('no contribution weights stored (role model, weights centralized later)',
    !stripSql(migration).includes('weight') && !stripSql(migration).includes('contribution'))
  check('no updated_at (replace-not-update semantics)',
    !stripSql(migration).includes('updated_at') && !migration.includes('CREATE TRIGGER'))
  check('RLS enabled', migration.includes('ALTER TABLE exercise_muscles ENABLE ROW LEVEL SECURITY;'))
  check('exactly four own-row policies (select/insert/update/delete)',
    (migration.match(/CREATE POLICY exercise_muscles_/g) || []).length === 4 &&
    (migration.match(/user_id = auth\.uid\(\)/g) || []).length === 5)
  check('authenticated CRUD grant present (the 015/016 lesson)',
    migration.includes('GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercise_muscles TO authenticated;'))
  check('no anon CRUD grant; no service role',
    !stripSql(migration).includes('anon') && !stripSql(migration).includes('service_role'))
  check('index decision: unique backing index covers exercise_id (no redundant second index)',
    !stripSql(migration).includes('CREATE INDEX') &&
    migration.includes('smallest useful index'))
  check('018 notifies PostgREST', migration.includes("NOTIFY pgrst, 'reload schema';"))
  check('018 contains no emoji/pictographs', !EMOJI.test(migration))
}

// ── 2. Backfill ──────────────────────────────────────────────────────
console.log('\n2. Backfill')
{
  check('backfill inserts one secondary row per JSONB entry',
    migration.includes('INSERT INTO exercise_muscles (user_id, exercise_id, muscle, role)') &&
    migration.includes("SELECT e.user_id, e.id, m.value, 'secondary'"))
  check('backfill expands the JSONB array element-wise',
    migration.includes('LATERAL jsonb_array_elements_text(e.secondary_muscles)'))
  check('backfill preserves user_id and exercise_id from the owning exercise',
    migration.includes('e.user_id, e.id'))
  check('no tertiary fabrication in the backfill',
    !/'tertiary'/.test(stripSql(migration).split('INSERT INTO')[1] ?? ''))
  check('backfill guards non-array/NULL JSONB',
    migration.includes("jsonb_typeof(e.secondary_muscles) = 'array'"))
  check('duplicate legacy entries collapse safely',
    migration.includes('ON CONFLICT (exercise_id, muscle) DO NOTHING'))
  check('no broad-value remapping anywhere (values copied verbatim)',
    !stripSql(migration).includes('CASE') && !stripSql(migration).includes('REPLACE('))
}

// ── 3. CRITICAL: deprecated JSONB retained, never written ────────────
console.log('\n3. Deprecated JSONB safety')
{
  check('018 does NOT drop secondary_muscles (the approved safety rule)',
    !stripSql(migration).includes('DROP COLUMN'))
  check('018 documents the deprecation and the later cleanup migration',
    migration.includes('NOT') && migration.includes('dropped') &&
    migration.includes('cleanup migration'))
  check('type marks the column DEPRECATED with the retention rationale',
    types.includes('DEPRECATED (5A.6B)') && types.includes('rollback insurance'))
  check('no app code writes secondary_muscles (no dual-write, drift impossible)',
    [postRoute, idRoute, seeds, form].every((f) =>
      !stripComments(f).includes('secondary_muscles:')))
  check('no app code reads secondary_muscles as authoritative',
    [form, listItem].every((f) =>
      !stripComments(f).includes('.secondary_muscles')))
  check('validation no longer accepts the secondary_muscles field',
    !validation.includes("'secondary_muscles',") &&
    (() => {
      const r = normalizeExerciseCreatePayload({
        name: 'X', primary_muscle: 'chest', tracking_mode: 'weight_reps',
        secondary_muscles: ['triceps'],
      })
      return !r.ok
    })())
  check('exercise_muscles is the authoritative read everywhere',
    postRoute.includes('exercise_muscles(id, user_id, exercise_id, muscle, role, created_at)') &&
    libraryPage.includes('exercise_muscles(id, user_id, exercise_id, muscle, role, created_at)'))
}

// ── 4. Runtime: canonical taxonomy ───────────────────────────────────
console.log('\n4. Runtime: taxonomy')
{
  check('runtime: exactly 25 canonical values', MUSCLE_GROUPS.length === 25)
  check('runtime: exact canonical set matches the approved list',
    CANONICAL_25.every((m) => (MUSCLE_GROUPS as readonly string[]).includes(m)) &&
    MUSCLE_GROUPS.every((m) => CANONICAL_25.includes(m)))
  check('runtime: the old 13 remain valid (strict subset)',
    OLD_13.every((m) => (MUSCLE_GROUPS as readonly string[]).includes(m)))
  check('runtime: thigh absent', !(MUSCLE_GROUPS as readonly string[]).includes('thigh'))
  check('runtime: cardio absent (category/tracking concept, not a muscle)',
    !(MUSCLE_GROUPS as readonly string[]).includes('cardio'))
  check('runtime: upper/lower chest absent (variation concepts)',
    !(MUSCLE_GROUPS as readonly string[]).includes('upper_chest') &&
    !(MUSCLE_GROUPS as readonly string[]).includes('lower_chest'))
  check('runtime: every canonical value has a friendly label',
    MUSCLE_GROUPS.every((m) => typeof MUSCLE_LABELS[m] === 'string' && MUSCLE_LABELS[m].length > 0))
  check('runtime: labels are human copy, not slugs',
    MUSCLE_LABELS.upper_back === 'Upper back' && MUSCLE_LABELS.front_delts === 'Front delts' &&
    MUSCLE_LABELS.hip_flexors === 'Hip flexors')
  check('runtime: every canonical value has a region',
    MUSCLE_GROUPS.every((m) => ['upper', 'lower', 'core', 'other'].includes(MUSCLE_REGIONS[m])))
  check('runtime: region spot checks (approved examples)',
    MUSCLE_REGIONS.lats === 'upper' && MUSCLE_REGIONS.traps === 'upper' &&
    MUSCLE_REGIONS.front_delts === 'upper' && MUSCLE_REGIONS.quads === 'lower' &&
    MUSCLE_REGIONS.adductors === 'lower' && MUSCLE_REGIONS.abs === 'core' &&
    MUSCLE_REGIONS.full_body === 'other')
  check('runtime: retained broad values map sensibly',
    MUSCLE_REGIONS.back === 'upper' && MUSCLE_REGIONS.shoulders === 'upper' &&
    MUSCLE_REGIONS.core === 'core')
  check('runtime: roles vocabulary is exactly secondary/tertiary',
    MUSCLE_ROLES.length === 2 && MUSCLE_ROLES[0] === 'secondary' && MUSCLE_ROLES[1] === 'tertiary')
  check('region model is code-level only (no DB column)',
    !stripSql(migration).includes('region'))
  check('constants PRIMARY_MUSCLES mirrors the canonical 25 exactly',
    PRIMARY_MUSCLES.length === 25 &&
    PRIMARY_MUSCLES.every((p) => (MUSCLE_GROUPS as readonly string[]).includes(p.value)) &&
    MUSCLE_GROUPS.every((m) => PRIMARY_MUSCLES.some((p) => p.value === m)))
  check('constants labels agree with MUSCLE_LABELS',
    PRIMARY_MUSCLES.every((p) => MUSCLE_LABELS[p.value as MuscleGroup] === p.label))
  check('migration CHECK and code vocabulary agree value-for-value',
    MUSCLE_GROUPS.every((m) => migration.includes(`'${m}'`)))
}

// ── 5. Runtime: validateMuscleTargets ────────────────────────────────
console.log('\n5. Runtime: role validation')
{
  const v = validateMuscleTargets
  check('runtime: valid secondary accepted',
    (() => {
      const r = v([{ muscle: 'glutes', role: 'secondary' }], 'quads')
      return r.ok && r.value.length === 1 && r.value[0].muscle === 'glutes'
    })())
  check('runtime: valid tertiary accepted',
    (() => {
      const r = v([{ muscle: 'lower_back', role: 'tertiary' }], 'hamstrings')
      return r.ok && r.value[0].role === 'tertiary'
    })())
  check('runtime: mixed roles accepted in one payload',
    (() => {
      const r = v([
        { muscle: 'glutes', role: 'secondary' },
        { muscle: 'hamstrings', role: 'secondary' },
        { muscle: 'lower_back', role: 'tertiary' },
      ], 'quads')
      return r.ok && r.value.length === 3
    })())
  check('runtime: undefined -> empty targets', (() => { const r = v(undefined, 'chest'); return r.ok && r.value.length === 0 })())
  check('runtime: empty array -> empty targets', (() => { const r = v([], 'chest'); return r.ok && r.value.length === 0 })())
  check('runtime: non-array rejected', !v('glutes', 'quads').ok && !v({ muscle: 'glutes' }, 'quads').ok)
  check('runtime: non-object entry rejected', !v(['glutes'], 'quads').ok)
  check('runtime: extra keys rejected',
    !v([{ muscle: 'glutes', role: 'secondary', weight: 0.5 }], 'quads').ok)
  check('runtime: unknown muscle rejected',
    (() => { const r = v([{ muscle: 'thigh', role: 'secondary' }], 'quads'); return !r.ok && r.error.includes('Unknown muscle') })())
  check('runtime: primary role in the array rejected with the exact rule',
    (() => {
      const r = v([{ muscle: 'glutes', role: 'primary' }], 'quads')
      return !r.ok && r.error.includes('set separately')
    })())
  check('runtime: unknown role rejected',
    !v([{ muscle: 'glutes', role: 'main' }], 'quads').ok &&
    !v([{ muscle: 'glutes', role: 1 as unknown }], 'quads').ok)
  check('runtime: duplicate muscle rejected (same role)',
    (() => {
      const r = v([
        { muscle: 'glutes', role: 'secondary' },
        { muscle: 'glutes', role: 'secondary' },
      ], 'quads')
      return !r.ok && r.error.includes('twice')
    })())
  check('runtime: same muscle in secondary AND tertiary rejected',
    !v([
      { muscle: 'glutes', role: 'secondary' },
      { muscle: 'glutes', role: 'tertiary' },
    ], 'quads').ok)
  check('runtime: target equal to primary rejected (not silently skipped — flagged 2P contract change)',
    (() => {
      const r = v([{ muscle: 'quads', role: 'secondary' }], 'quads')
      return !r.ok && r.error.includes('primary')
    })())
  check('runtime: without a primary the collision rule defers (route completes it)',
    (() => { const r = v([{ muscle: 'quads', role: 'secondary' }], undefined); return r.ok })())
  check('runtime: broad values are legal targets',
    (() => { const r = v([{ muscle: 'back', role: 'secondary' }], 'hamstrings'); return r.ok })())
  check('runtime: rejection never partially accepts',
    (() => {
      const r = v([
        { muscle: 'glutes', role: 'secondary' },
        { muscle: 'thigh', role: 'secondary' },
      ], 'quads')
      return !r.ok
    })())
}

// ── 6. Runtime: create/patch payload contracts ───────────────────────
console.log('\n6. Runtime: payload contracts')
{
  const base = { name: 'Back squat', primary_muscle: 'quads', tracking_mode: 'weight_reps' }
  check('runtime: full create with explicit roles normalizes',
    (() => {
      const r = normalizeExerciseCreatePayload({
        ...base,
        muscle_targets: [
          { muscle: 'glutes', role: 'secondary' },
          { muscle: 'lower_back', role: 'tertiary' },
        ],
      })
      return r.ok && r.value.primary_muscle === 'quads' &&
        r.value.muscle_targets.length === 2 &&
        r.value.muscle_targets[1].role === 'tertiary'
    })())
  check('runtime: create without targets normalizes to empty',
    (() => { const r = normalizeExerciseCreatePayload(base); return r.ok && r.value.muscle_targets.length === 0 })())
  check('runtime: create with a NEW specific primary (traps) accepted',
    (() => {
      const r = normalizeExerciseCreatePayload({
        name: 'Shoulder shrug', primary_muscle: 'traps', tracking_mode: 'weight_reps',
        muscle_targets: [{ muscle: 'upper_back', role: 'secondary' }],
      })
      return r.ok
    })())
  check('runtime: create rejects target duplicating the primary',
    !normalizeExerciseCreatePayload({
      ...base, muscle_targets: [{ muscle: 'quads', role: 'secondary' }],
    }).ok)
  check('runtime: create rejects unknown primary', !normalizeExerciseCreatePayload({ ...base, primary_muscle: 'thigh' }).ok)
  check('runtime: create rejects the legacy secondary_muscles field',
    !normalizeExerciseCreatePayload({ ...base, secondary_muscles: ['glutes'] }).ok)
  check('runtime: patch accepts a targets-only payload',
    (() => {
      const r = normalizeExercisePatchPayload({
        muscle_targets: [{ muscle: 'glutes', role: 'secondary' }],
      })
      return r.ok && r.value.muscle_targets?.length === 1
    })())
  check('runtime: patch with primary+targets enforces the collision in one pass',
    !normalizeExercisePatchPayload({
      primary_muscle: 'quads',
      muscle_targets: [{ muscle: 'quads', role: 'secondary' }],
    }).ok)
  check('runtime: patch rejects the legacy secondary_muscles field',
    !normalizeExercisePatchPayload({ secondary_muscles: [] }).ok)
  check('runtime: patch still rejects an empty payload',
    !normalizeExercisePatchPayload({}).ok)
  check('runtime: patch primary-only remains legal (relationships untouched by contract)',
    (() => { const r = normalizeExercisePatchPayload({ primary_muscle: 'lats' }); return r.ok && r.value.muscle_targets === undefined })())
}

// ── 7. API routes ────────────────────────────────────────────────────
console.log('\n7. API routes')
{
  check('POST separates targets from the exercise row insert',
    postRoute.includes('const { muscle_targets, ...exerciseFields } = result.value'))
  check('POST writes authoritative join rows with the owner user_id',
    postRoute.includes(".from('exercise_muscles')") &&
    postRoute.includes('exercise_id: data.id,') &&
    /exercise_muscles'\)[\s\S]{0,200}user_id: user\.id,/.test(postRoute))
  check('POST compensating cleanup on relationship failure',
    postRoute.includes(".from('exercises').delete().eq('id', data.id).eq('user_id', user.id)") &&
    postRoute.includes("{ error: 'Could not save the exercise. Try again.' }"))
  check('POST keeps the 2R legacy exercise_type derivation',
    postRoute.includes('exercise_type: deriveLegacyExerciseType(result.value.tracking_mode)'))
  check('PATCH fetches the stored primary for the collision rule',
    idRoute.includes(".select('is_active, primary_muscle')"))
  check('PATCH revalidates targets against the STORED primary when payload has none',
    idRoute.includes('result.value.muscle_targets !== undefined && result.value.primary_muscle === undefined') &&
    idRoute.includes('existing.primary_muscle as MuscleGroup'))
  check('PATCH replacement is authoritative delete+insert scoped to the owner',
    /exercise_muscles'\)[\s\S]{0,60}\.delete\(\)[\s\S]{0,120}\.eq\('exercise_id', params\.id\)[\s\S]{0,60}\.eq\('user_id', user\.id\)/.test(idRoute))
  check('PATCH inserts the new relationship set with the owner user_id',
    /exercise_muscles'\)[\s\S]{0,120}\.insert\(muscle_targets\.map/.test(idRoute))
  check('PATCH absent targets leave relationships untouched',
    idRoute.includes('if (muscle_targets !== undefined) {'))
  check('PATCH supports a targets-only edit (skips the empty row update)',
    idRoute.includes('if (Object.keys(updatePayload).length > 0) {'))
  check('ownership enforced on every statement (auth + user_id filters)',
    (idRoute.match(/\.eq\('user_id', user\.id\)/g) || []).length >= 5 &&
    idRoute.includes("{ error: 'Unauthorized' }, { status: 401 }"))
  check('cross-user rows unreachable (no unscoped exercise_muscles statement)',
    !/exercise_muscles'\)[\s\S]{0,160}\.delete\(\)(?![\s\S]{0,160}user_id)/.test(idRoute))
  check('unknown/unowned exercise -> 404 before any write',
    idRoute.includes("{ error: 'Exercise not found.' }, { status: 404 }"))
  check('2P deactivation decision-log behavior preserved',
    idRoute.includes("decision_type: 'exercise_deactivated'"))
  check('DELETE history guard preserved (deactivate instead of delete)',
    idRoute.includes('This exercise has workout history. Deactivate it instead of deleting.'))
  check('GET embeds the authoritative relationship rows',
    postRoute.includes("select('*, exercise_muscles(id, user_id, exercise_id, muscle, role, created_at)')"))
}

// ── 8. Form UI ───────────────────────────────────────────────────────
console.log('\n8. Form UI')
{
  // RETARGET (UI-5A): the approved alphabetical-display refinement
  // feeds the pill groups a sorted COPY (MUSCLES_BY_LABEL, spread +
  // sort — never an in-place mutation of the registry). The 5A.6B
  // boundary — primary is a single-select pill group driven by the
  // canonical 25-muscle registry — is unchanged and now also pins
  // the copy semantics.
  check('primary remains a single-select pill group (sorted display copy)',
    form.includes('<PillGroup options={MUSCLES_BY_LABEL} value={muscle as any} onChange={handlePrimaryChange as any} />') &&
    form.includes('const MUSCLES_BY_LABEL = [...PRIMARY_MUSCLES].sort'))
  check('secondary multi-select present',
    form.includes('Secondary muscles') && form.includes('selected={secondary}'))
  check('tertiary multi-select present',
    form.includes('Tertiary muscles') && form.includes('selected={tertiary}'))
  check('tertiary labeled as lighter involvement (role distinction is obvious)',
    form.includes('lighter involvement'))
  check('no comma-separated text hack anywhere',
    !form.includes('split(') && !form.includes('comma') &&
    !form.includes('type="text" value={secondary'))
  check('one role per muscle: primary evicts from both target lists',
    form.includes('setSecondary(prev => prev.filter(m => m !== next))') &&
    form.includes('setTertiary(prev => prev.filter(m => m !== next))'))
  check('secondary/tertiary mutually unavailable',
    form.includes('const secondaryUnavailable = new Set([muscle, ...tertiary])') &&
    form.includes('const tertiaryUnavailable = new Set([muscle, ...secondary])'))
  check('edit prefills from authoritative join rows',
    form.includes("existing?.exercise_muscles?.filter(m => m.role === 'secondary').map(m => m.muscle)") &&
    form.includes("existing?.exercise_muscles?.filter(m => m.role === 'tertiary').map(m => m.muscle)"))
  check('payload posts the explicit-roles contract',
    form.includes('muscle_targets: [') &&
    form.includes("...secondary.map(m => ({ muscle: m, role: 'secondary' as const }))") &&
    form.includes("...tertiary.map(m => ({ muscle: m, role: 'tertiary' as const }))"))
  check('primary never appears inside muscle_targets',
    !form.includes("role: 'primary'"))
  check('form never touches the deprecated JSONB',
    !stripComments(form).includes('secondary_muscles'))
  check('existing create/edit routing untouched',
    form.includes("const url    = existing ? `/api/exercises/${existing.id}` : '/api/exercises'"))
}

// ── 9. Library display ───────────────────────────────────────────────
console.log('\n9. Library display')
{
  check('list shows secondary/tertiary from join rows only when present',
    listItem.includes("filter(m => m.role === 'secondary')") &&
    listItem.includes("filter(m => m.role === 'tertiary')") &&
    listItem.includes('secondaryTargets.length > 0 || tertiaryTargets.length > 0'))
  check('restrained label format (Secondary: … · Tertiary: …)',
    listItem.includes('`Secondary: ${secondaryTargets.map') &&
    listItem.includes('`Tertiary: ${tertiaryTargets.map'))
  check('library page embeds join rows for display + edit prefill',
    libraryPage.includes("select('*, exercise_muscles(id, user_id, exercise_id, muscle, role, created_at)')"))
  check('WorkoutExerciseBlock deliberately unchanged (primary only, no set-entry clutter)',
    !read('src/components/workout/WorkoutExerciseBlock.tsx').includes('exercise_muscles'))
  check('ExercisePicker filter flows from shared constants unchanged',
    !read('src/components/workout/ExercisePicker.tsx').includes('exercise_muscles'))
}

// ── 10. Coach compatibility ──────────────────────────────────────────
console.log('\n10. Coach compatibility')
{
  const MAP_EXPECTED: Array<[string, string]> = [
    ['lats', 'back'], ['upper_back', 'back'], ['lower_back', 'back'], ['traps', 'back'],
    ['front_delts', 'shoulders'], ['side_delts', 'shoulders'], ['rear_delts', 'shoulders'],
    ['hip_flexors', 'legs'], ['adductors', 'legs'], ['abductors', 'legs'],
    ['abs', 'core'], ['obliques', 'core'],
  ]
  for (const [specific, broad] of MAP_EXPECTED) {
    check(`coach map: ${specific} -> ${broad}`,
      new RegExp(`${specific}:\\s*'${broad}'`).test(coach))
  }
  check('old specifics still map (arms/legs groups unchanged)',
    /biceps:\s*'arms'/.test(coach) && /quads:\s*'legs'/.test(coach))
  check('retained broad values pass through unmapped (back/shoulders/core absent from map keys)',
    !/^\s+back:\s/m.test(coach) && !/^\s+shoulders:\s/m.test(coach) && !/^\s+core:\s/m.test(coach))
  check('compatibility only — no new Coach weighting/effective-set logic',
    coach.includes('compatibility only') &&
    !coach.includes('MUSCLE_ROLE_WEIGHTS') && !coach.includes('effectiveSets') &&
    !stripComments(coach).includes('exercise_muscles'))
  check('display groups unchanged (six broad groups)',
    (coach.match(/\{ value: '\w+',\s+label: '\w+'\s+\}/g) || []).length >= 5)
}

// ── 11. Runtime: seed refinements ────────────────────────────────────
console.log('\n11. Runtime: seeds')
{
  check('runtime: still exactly 15 seeds', SEED_EXERCISES.length === 15)
  check('runtime: every seed primary is canonical',
    SEED_EXERCISES.every((s) => (MUSCLE_GROUPS as readonly string[]).includes(s.primary_muscle)))
  check('runtime: every seed target is canonical with a valid role',
    SEED_EXERCISES.every((s) => s.muscle_targets.every((t) =>
      (MUSCLE_GROUPS as readonly string[]).includes(t.muscle) &&
      (MUSCLE_ROLES as readonly string[]).includes(t.role))))
  check('runtime: no seed target duplicates its primary',
    SEED_EXERCISES.every((s) => s.muscle_targets.every((t) => t.muscle !== s.primary_muscle)))
  check('runtime: no duplicate targets within a seed',
    SEED_EXERCISES.every((s) => {
      const muscles = s.muscle_targets.map((t) => t.muscle)
      return new Set(muscles).size === muscles.length
    }))
  check('runtime: every seed validates through the real target validator',
    SEED_EXERCISES.every((s) => validateMuscleTargets(
      s.muscle_targets.map((t) => ({ ...t })), s.primary_muscle as MuscleGroup).ok))
  const seedByName = (n: string) => SEED_EXERCISES.find((s) => s.name === n)!
  check('refinement: lat pulldown primary lats',
    seedByName('Lat pulldown').primary_muscle === 'lats')
  check('refinement: seated cable row primary upper_back + lats secondary',
    seedByName('Seated cable row').primary_muscle === 'upper_back' &&
    seedByName('Seated cable row').muscle_targets.some((t) => t.muscle === 'lats' && t.role === 'secondary'))
  check('refinement: shoulder press primary front_delts',
    seedByName('Shoulder press').primary_muscle === 'front_delts')
  check('refinement: lateral raise primary side_delts',
    seedByName('Lateral raise').primary_muscle === 'side_delts')
  check('refinement: bench press front_delts secondary (was broad shoulders)',
    seedByName('Bench press').muscle_targets.some((t) => t.muscle === 'front_delts' && t.role === 'secondary'))
  check('refinement: squat gains tertiary lower_back',
    seedByName('Squat').muscle_targets.some((t) => t.muscle === 'lower_back' && t.role === 'tertiary'))
  check('refinement: Romanian deadlift — hamstrings primary, glutes secondary, lower_back tertiary (approved example)',
    (() => {
      const rdl = seedByName('Romanian deadlift')
      return rdl.primary_muscle === 'hamstrings' &&
        rdl.muscle_targets.some((t) => t.muscle === 'glutes' && t.role === 'secondary') &&
        rdl.muscle_targets.some((t) => t.muscle === 'lower_back' && t.role === 'tertiary')
    })())
  check('refinement: plank primary abs + obliques secondary',
    seedByName('Plank').primary_muscle === 'abs' &&
    seedByName('Plank').muscle_targets.some((t) => t.muscle === 'obliques'))
  check('unchanged seeds keep restrained targets (no fabricated precision)',
    seedByName('Chest fly').muscle_targets.length === 0 &&
    seedByName('Leg curl').muscle_targets.length === 0 &&
    seedByName('Biceps curl').muscle_targets.length === 0 &&
    seedByName('Triceps pushdown').muscle_targets.length === 0)
  check('seed function writes relationship rows to exercise_muscles',
    seeds.includes('.from("exercise_muscles").insert(targetRows)'))
  check('seed function never writes the deprecated JSONB',
    !stripComments(seeds).includes('secondary_muscles:'))
  check('every seed refinement documented in-file',
    seeds.includes('Every taxonomy') &&
    seeds.includes('Lat pulldown') && seeds.includes('Romanian deadlift'))
}

// ── 12. Backward compatibility ───────────────────────────────────────
console.log('\n12. Backward compatibility')
{
  check('exercise IDs preserved (no destructive recreation anywhere)',
    !stripSql(migration).includes('DROP TABLE') &&
    !stripSql(migration).includes('DELETE FROM exercises') &&
    !stripSql(migration).includes('UPDATE public.exercises SET primary_muscle') &&
    !stripSql(migration).includes('TRUNCATE'))
  check('no guess-mapping of existing broad rows (documented in-migration)',
    migration.includes('never') && migration.includes('guess-mapped'))
  check('workout history untouched (no workout table migrations)',
    !stripSql(migration).includes('workout_sessions') &&
    !stripSql(migration).includes('workout_exercises') &&
    !stripSql(migration).includes('workout_sets'))
  check('history resolves anatomy through exercise_id exactly as before',
    read('src/lib/progress-overview.ts').includes('primary_muscle') &&
    !read('src/lib/progress-overview.ts').includes('exercise_muscles'))
  check('weekly-review training query untouched',
    read('src/lib/weekly-review.ts').includes('exercise:exercises ( id, name, primary_muscle, equipment, tracking_mode, unilateral )'))
  check('dead useExercises hook untouched (zero consumers, standing rule)',
    read('src/hooks/useExercises.ts').includes('secondary_muscles?: string[]'))
  check('custom exercises share the same model (single form + routes, no separate path)',
    !existsSync('src/components/workout/CustomExerciseForm.tsx') &&
    form.includes("existing ? 'Edit exercise' : 'New exercise'"))
}

// ── 13. Boundary ─────────────────────────────────────────────────────
console.log('\n13. Boundary')
{
  check('no contribution weights anywhere in scope',
    CHANGED.every((f) => !stripComments(f).includes('contribution_weight')) &&
    !stripComments(validation).includes('0.5') &&
    !stripComments(coach).includes('MUSCLE_ROLE_WEIGHTS'))
  check('no effective-set math shipped',
    CHANGED.every((f) => !/effectiveSets|effective_sets/i.test(stripComments(f))))
  check('no Energy Balance changes',
    // ('deficit' is excluded: nutrition_targets has carried a
    // legitimate deficit column in types since Phase 1A)
    CHANGED.every((f) => !/TDEE|eat.?back|active energy/i.test(stripComments(f))))
  check('5A.6A default sets untouched',
    read('src/app/api/workouts/[id]/exercises/route.ts').includes('DEFAULT_MANUAL_SET_COUNT') &&
    !read('src/app/api/workouts/[id]/exercises/route.ts').includes('5A.6B'))
  check('5A.5 calories untouched',
    read('src/app/api/workouts/[id]/route.ts').includes("body.mode === 'workout_calories'") &&
    !read('src/app/api/workouts/[id]/route.ts').includes('5A.6B'))
  check('5A.4/5A.3 activity scope untouched',
    !read('src/lib/activity.ts').includes('5A.6') &&
    !read('src/app/api/activity/route.ts').includes('5A.6'))
  check('routines untouched (RoutineMuscleFocus stays its own broad vocabulary)',
    !read('src/components/routine/RoutineForm.tsx').includes('exercise_muscles') &&
    types.includes("export type RoutineMuscleFocus = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core' | 'full_body' | 'other'"))
  check('exactly the 10 approved feature files carry 5A.6B markers',
    ['src/lib/exercise-validation.ts', 'src/lib/constants.ts', 'src/types/database.ts',
      'src/components/workout/ExerciseForm.tsx', 'src/components/workout/ExerciseListItem.tsx',
      'src/app/api/exercises/route.ts', 'src/app/api/exercises/[id]/route.ts',
      'src/lib/workout-coach.ts', 'src/lib/supabase/seed-exercises.ts',
      'src/app/(app)/workouts/exercises/page.tsx']
      .every((f) => read(f).includes('5A.6B')))
}

// ── 14. Docs and hygiene ─────────────────────────────────────────────
console.log('\n14. Docs and hygiene')
{
  check('notes document the old 13-value taxonomy and the dormant JSONB discovery',
    notes.includes('13-value') && notes.includes('dormant'))
  check('notes document the canonical 25 and broad-value preservation',
    notes.includes('25') && /never guess-mapped/i.test(notes))
  check('notes document role model with no stored weights',
    notes.includes('No contribution weights are stored'))
  check('notes document migration 018, backfill, and JSONB retention',
    notes.includes('018') && notes.includes('Backfill') &&
    notes.includes('NOT dropped'))
  check('notes document the API roles contract and UI behavior',
    notes.includes('muscle_targets') && notes.includes('pill'))
  check('notes document Coach compatibility and seed refinements',
    notes.includes('MUSCLE_GROUP_MAP') && notes.includes('front_delts'))
  check('notes record the future cleanup migration and effective-set analytics',
    notes.includes('cleanup migration') && notes.includes('Effective-set'))
  check('notes flag every retarget', notes.includes('RETARGET') || notes.includes('retarget'))
  check('notes record the migration stop protocol',
    notes.includes('ttybyljytiwntvorugcv'))
  check('no emoji/pictographs in any changed file',
    CHANGED.every((f) => !EMOJI.test(f)) && !EMOJI.test(migration) && !EMOJI.test(notes))
  check('no legacy brand violations',
    CHANGED.every((f) => !f.toLowerCase().includes('fat_lass')))
  check('changed files carry no TODO/FIXME debt',
    CHANGED.every((f) => !f.includes('TODO') && !f.includes('FIXME')))
}

// ── 15. Runtime: full-vocabulary acceptance matrix ───────────────────
console.log('\n15. Runtime: full-vocabulary matrix')
{
  // Every canonical value must round-trip the REAL create normalizer
  // as a primary muscle — the widened CHECK is only honest if the
  // validation layer accepts the identical vocabulary.
  for (const muscle of MUSCLE_GROUPS) {
    check(`runtime: '${muscle}' accepted as primary through the create normalizer`,
      (() => {
        const r = normalizeExerciseCreatePayload({
          name: `Probe ${muscle}`, primary_muscle: muscle, tracking_mode: 'weight_reps',
        })
        return r.ok && r.value.primary_muscle === muscle
      })())
  }
  check('runtime: every non-primary canonical value is a legal secondary target',
    MUSCLE_GROUPS.filter((m) => m !== 'chest').every((m) =>
      validateMuscleTargets([{ muscle: m, role: 'secondary' }], 'chest').ok))
  check('runtime: hostile target entries rejected (null/number/boolean elements)',
    !validateMuscleTargets([null], 'chest').ok &&
    !validateMuscleTargets([42], 'chest').ok &&
    !validateMuscleTargets([true], 'chest').ok)
  check('runtime: hostile muscle/role types rejected',
    !validateMuscleTargets([{ muscle: 42, role: 'secondary' }], 'chest').ok &&
    !validateMuscleTargets([{ muscle: 'glutes', role: true }], 'chest').ok &&
    !validateMuscleTargets([{ muscle: ['glutes'], role: 'secondary' }], 'chest').ok)
  check('runtime: normalizer output is pure and repeatable',
    (() => {
      const payload = {
        name: 'Shrug', primary_muscle: 'traps', tracking_mode: 'weight_reps',
        muscle_targets: [{ muscle: 'upper_back', role: 'secondary' }],
      }
      const a = normalizeExerciseCreatePayload(payload)
      const b = normalizeExerciseCreatePayload(payload)
      return a.ok && b.ok && JSON.stringify(a.value) === JSON.stringify(b.value)
    })())
  check('runtime: target order preserved (first-seen order, no sorting surprises)',
    (() => {
      const r = validateMuscleTargets([
        { muscle: 'lower_back', role: 'tertiary' },
        { muscle: 'glutes', role: 'secondary' },
      ], 'hamstrings')
      return r.ok && r.value[0].muscle === 'lower_back' && r.value[1].muscle === 'glutes'
    })())
  check('runtime: the shrug example models correctly (traps 1°, upper_back 2°)',
    (() => {
      const r = normalizeExerciseCreatePayload({
        name: 'Shoulder shrug', primary_muscle: 'traps', tracking_mode: 'weight_reps',
        muscle_targets: [
          { muscle: 'upper_back', role: 'secondary' },
          { muscle: 'rear_delts', role: 'tertiary' },
        ],
      })
      return r.ok && r.value.muscle_targets.length === 2
    })())
  check('runtime: the back-squat example models correctly (quads 1°, glutes+hamstrings 2°)',
    (() => {
      const r = normalizeExerciseCreatePayload({
        name: 'Back squat', primary_muscle: 'quads', tracking_mode: 'weight_reps',
        muscle_targets: [
          { muscle: 'glutes', role: 'secondary' },
          { muscle: 'hamstrings', role: 'secondary' },
        ],
      })
      return r.ok && r.value.muscle_targets.every((t) => t.role === 'secondary')
    })())
}

// ── 16. Form disclosure UX (physical-QA correction) ──────────────────
console.log('\n16. Form disclosure UX')
{
  check('secondary collapsed by default (create AND edit — no auto-expand)',
    form.includes('const [secondaryOpen, setSecondaryOpen] = useState(false)'))
  check('tertiary collapsed by default',
    form.includes('const [tertiaryOpen,  setTertiaryOpen]  = useState(false)'))
  check('primary selector always visible (never behind a disclosure)',
    (() => {
      // RETARGET (UI-5A): anchor follows the sorted display copy.
      const primaryIdx = form.indexOf('<PillGroup options={MUSCLES_BY_LABEL} value={muscle as any}')
      const firstDisclosureIdx = form.indexOf('aria-controls="secondary-muscles-panel"')
      return primaryIdx > -1 && primaryIdx < firstDisclosureIdx &&
        !form.slice(0, primaryIdx).includes('aria-expanded')
    })())
  check('disclosure triggers are REAL buttons (no clickable divs)',
    (form.match(/<button type="button"\s*\n\s*onClick=\{\(\) => set(Secondary|Tertiary)Open/g) || []).length === 2 &&
    !/<div[^>]*onClick/.test(form))
  check('aria-expanded reflects state on both triggers',
    form.includes('aria-expanded={secondaryOpen}') &&
    form.includes('aria-expanded={tertiaryOpen}'))
  check('aria-controls wires trigger to panel on both',
    form.includes('aria-controls="secondary-muscles-panel"') &&
    form.includes('aria-controls="tertiary-muscles-panel"') &&
    form.includes('id="secondary-muscles-panel"') &&
    form.includes('id="tertiary-muscles-panel"'))
  check('collapsed summary surfaces the live selection count',
    form.includes('Optional · {secondary.length} selected') &&
    form.includes('Optional · lighter involvement · {tertiary.length} selected'))
  check('chevron from the existing icon library, decorative, rotating',
    form.includes("import { ChevronDown } from 'lucide-react'") &&
    (form.match(/<ChevronDown aria-hidden="true"/g) || []).length === 2 &&
    (form.match(/secondaryOpen && 'rotate-180'|tertiaryOpen && 'rotate-180'/g) || []).length === 2)
  check('toggling disclosure NEVER mutates selections (open handlers touch only open state)',
    form.includes('onClick={() => setSecondaryOpen(!secondaryOpen)}') &&
    form.includes('onClick={() => setTertiaryOpen(!tertiaryOpen)}') &&
    !/setSecondaryOpen[\s\S]{0,60}setSecondary\(/.test(form) &&
    !/setTertiaryOpen[\s\S]{0,60}setTertiary\(/.test(form))
  check('collapsing hides pills without clearing (conditional render, state independent)',
    form.includes('{secondaryOpen && (') && form.includes('{tertiaryOpen && ('))
  check('edit-prefill is independent of disclosure state (prefill never reads open flags)',
    (() => {
      const prefillBlock = form.slice(form.indexOf('const [secondary, setSecondary]'),
        form.indexOf('const [equipment'))
      return prefillBlock.includes('exercise_muscles') &&
        !prefillBlock.includes('Open')
    })())
  check('payload identical regardless of disclosure state (built from arrays only)',
    (() => {
      const payloadBlock = form.slice(form.indexOf('const payload = {'),
        form.indexOf('const url'))
      return payloadBlock.includes('...secondary.map') &&
        payloadBlock.includes('...tertiary.map') &&
        !payloadBlock.includes('Open')
    })())
  check('collision prevention untouched by the disclosure change',
    form.includes('const secondaryUnavailable = new Set([muscle, ...tertiary])') &&
    form.includes('const tertiaryUnavailable = new Set([muscle, ...secondary])') &&
    form.includes('setSecondary(prev => prev.filter(m => m !== next))'))
  check('presentation-only: taxonomy/contract/collisions files untouched by this correction',
    !validation.includes('disclosure') && !postRoute.includes('Open') &&
    !listItem.includes('ChevronDown'))
}

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
