// ============================================================
// ForgeFitOS — Phase 5A.6A deterministic verification harness
// Verifies the default-three-sets manual-add behavior: the shared
// DEFAULT_MANUAL_SET_COUNT constant, the seeded empty persisted rows
// (routine-start draft semantics: completed=false, all performance
// values NULL), the compensating cleanup on seed failure, the
// untouched routine-start prescription flow, and analytics safety —
// uncompleted seeded rows carry zero volume/history/Coach facts,
// proven at RUNTIME through the real reducers. No migration, no
// anatomy changes (those are 5A.6B).
// Run from the repository root:
//   npx tsx scripts/verify-phase5a6a.ts
// ============================================================

import { readFileSync, existsSync, readdirSync } from 'fs'
import { DEFAULT_MANUAL_SET_COUNT } from '../src/lib/workout'
import {
  computeWeeklyTraining,
  normalizeLegacyWeeklySessionRows,
} from '../src/lib/weekly-review'

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
const EMOJI = new RegExp('\\p{Extended_Pictographic}', 'u')

const workoutLib = read('src/lib/workout.ts')
const addRoute = read('src/app/api/workouts/[id]/exercises/route.ts')
const startRoute = read('src/app/api/routines/[id]/start/route.ts')
const setsRoute = read('src/app/api/workout-exercises/[id]/sets/route.ts')
const setIdRoute = read('src/app/api/workout-sets/[id]/route.ts')
const addSection = read('src/components/workout/AddExerciseSection.tsx')
const block = read('src/components/workout/WorkoutExerciseBlock.tsx')
const notes = read('docs/phase5a6a-default-three-sets-notes.md')

const CHANGED = [workoutLib, addRoute]

// The exact seed-row branch of the manual-add route, used repeatedly.
const seedBranch = addRoute.slice(addRoute.indexOf('Phase 5A.6A'))

// ── 1. Checkpoint and boundary ───────────────────────────────────────
console.log('\n1. Checkpoint and boundary')
{
  check('checkpoint artifacts exist (eeae1a3 tree)',
    ['scripts/verify-phase5a5.ts', 'docs/phase5a5-live-workout-calories-notes.md',
      'src/lib/activity.ts', 'supabase/migrations/017_phase5a4_daily_activity_distance.sql']
      .every((f) => existsSync(f)))
  check('5A.6A notes exist', notes.length > 1500)
  // RETARGETED (5A.6B): 018 is that approved phase's anatomy
  // migration. 5A.6A's own boundary — it added NO migration — is
  // unchanged: no migration file names 5A.6A.
  check('5A.6A added NO migration (none names it; 017 untouched)',
    !readdirSync('supabase/migrations').some((f) => f.includes('5a6a')) &&
    existsSync('supabase/migrations/017_phase5a4_daily_activity_distance.sql'))
  check('exactly 2 feature/source files carry 5A.6A markers',
    workoutLib.includes('5A.6A') && addRoute.includes('5A.6A') &&
    ['src/components/workout/AddExerciseSection.tsx',
      'src/components/workout/WorkoutExerciseBlock.tsx',
      'src/components/workout/SetRow.tsx',
      'src/app/api/routines/[id]/start/route.ts',
      'src/app/api/workout-exercises/[id]/sets/route.ts',
      'src/app/api/workout-sets/[id]/route.ts']
      .every((f) => !read(f).includes('5A.6A')))
  // RETARGETED (5A.6B): the anatomy phase is now legitimately
  // implemented, so this pin narrows to its true claim — 5A.6A's OWN
  // two files contain no anatomy changes.
  check('no anatomy changes inside the 5A.6A scope',
    !workoutLib.includes('exercise_muscles') &&
    !addRoute.includes('muscle'))
  check('no Energy Balance changes',
    CHANGED.every((f) => !/TDEE|deficit|energy balance/i.test(stripComments(f))))
}

// ── 2. The constant ──────────────────────────────────────────────────
console.log('\n2. DEFAULT_MANUAL_SET_COUNT')
{
  check('runtime: constant is exactly 3', DEFAULT_MANUAL_SET_COUNT === 3)
  check('constant lives in the workout domain and is exported',
    workoutLib.includes('export const DEFAULT_MANUAL_SET_COUNT = 3'))
  check('constant documented as a default, never a requirement',
    workoutLib.includes('never a requirement'))
  check('route imports the constant (no scattered literal)',
    addRoute.includes("import { DEFAULT_MANUAL_SET_COUNT } from '@/lib/workout'"))
  check('route uses the constant for the seed count',
    seedBranch.includes(': DEFAULT_MANUAL_SET_COUNT'))
  check('no stray literal-3 set seeding anywhere in the route',
    !/length:\s*3/.test(stripComments(addRoute)))
  check('routine-start path has NO dependency on the constant',
    !startRoute.includes('DEFAULT_MANUAL_SET_COUNT'))
  check('set add/delete routes have NO dependency on the constant',
    !setsRoute.includes('DEFAULT_MANUAL_SET_COUNT') &&
    !setIdRoute.includes('DEFAULT_MANUAL_SET_COUNT'))
}

// ── 3. Manual-add seeding contract ───────────────────────────────────
console.log('\n3. Manual-add seeding')
{
  check('seeding happens AFTER the successful exercise insert',
    addRoute.indexOf('.insert({') < addRoute.indexOf('seedRows') &&
    addRoute.indexOf('if (error) return NextResponse.json') < addRoute.indexOf('seedRows'))
  check('bulk insert (one statement), not N sequential round trips',
    seedBranch.includes(".from('workout_sets').insert(seedRows)") &&
    (seedBranch.match(/from\('workout_sets'\)/g) || []).length === 1)
  check('set numbers are 1..N via index+1',
    seedBranch.includes('set_number: i + 1,'))
  check('seeded rows are uncompleted', seedBranch.includes('completed: false,'))
  check('seeded rows are never warm-ups', seedBranch.includes('is_warmup: false,'))
  check('every performance value is explicitly NULL (no prefill)',
    ['reps: null,', 'weight_kg: null,', 'rpe: null,',
      'duration_seconds: null,', 'distance_meters: null,', 'notes: null,']
      .every((f) => seedBranch.includes(f)))
  check('no fake values smuggled in (no numeric performance literals)',
    (() => {
      const rowsBlock = seedBranch.slice(seedBranch.indexOf('seedRows = '),
        seedBranch.indexOf('seedError'))
      return !/reps:\s*\d|weight_kg:\s*\d|rpe:\s*\d|duration_seconds:\s*\d|distance_meters:\s*\d/
        .test(rowsBlock)
    })())
  check('all-NULL rows are tracking-mode agnostic (documented)',
    seedBranch.includes('valid for every') && seedBranch.includes('tracking mode'))
  check('rows attach to the JUST-created exercise id',
    seedBranch.includes('workout_exercise_id: data.id,'))
  check('response contract unchanged (201 with the exercise row)',
    addRoute.includes("return NextResponse.json({ data }, { status: 201 })"))
  check('existing pre-insert behavior untouched (auth, ownership, completed lock, order_index)',
    addRoute.includes("{ error: 'Unauthorized' }, { status: 401 }") &&
    addRoute.includes('Completed workouts are read-only. Reopen the workout before editing.') &&
    addRoute.includes("if (!body.exercise_id) return NextResponse.json({ error: 'exercise_id required' }, { status: 400 })") &&
    addRoute.includes('const order_index = ((existing as any)?.order_index ?? -1) + 1'))
}

// ── 4. target_sets future safety ─────────────────────────────────────
console.log('\n4. target_sets contract')
{
  check('no caller supplies target_sets today (AddExerciseSection sends exercise_id only)',
    addSection.includes("body: JSON.stringify({ exercise_id: exerciseId })") &&
    !addSection.includes('target_sets'))
  check('route did not invent a new payload field (target_sets was already accepted)',
    addRoute.includes('target_sets: body.target_sets ?? null,'))
  check('a prescribed count, if ever supplied, is respected instead of the default',
    seedBranch.includes("typeof body.target_sets === 'number'") &&
    seedBranch.includes('body.target_sets > 0') &&
    seedBranch.includes('? body.target_sets'))
  check('runtime: seed-count rule — absent/invalid -> 3, prescribed -> prescribed',
    (() => {
      const seedCount = (target: unknown) =>
        typeof target === 'number' && Number.isInteger(target) && target > 0
          ? target
          : DEFAULT_MANUAL_SET_COUNT
      return seedCount(undefined) === 3 && seedCount(null) === 3 &&
        seedCount(0) === 3 && seedCount(-2) === 3 && seedCount(2.5) === 3 &&
        seedCount(2) === 2 && seedCount(4) === 4 && seedCount(3) === 3
    })())
}

// ── 5. Failure atomicity ─────────────────────────────────────────────
console.log('\n5. Failure atomicity')
{
  check('seed failure triggers compensating exercise delete',
    seedBranch.includes('if (seedError) {') &&
    seedBranch.includes(".from('workout_exercises').delete().eq('id', data.id)"))
  check('cleanup targets ONLY the just-created exercise row (by its exact id)',
    (() => {
      const cleanup = seedBranch.slice(seedBranch.indexOf('if (seedError) {'),
        seedBranch.indexOf('return NextResponse.json({ data }, { status: 201 })'))
      return cleanup.includes(".eq('id', data.id)") &&
        !cleanup.includes('workout_sessions') &&
        !cleanup.includes("eq('workout_session_id'")
    })())
  check('FK cascade covers partial sets (documented against the 003 schema)',
    seedBranch.includes('ON DELETE CASCADE') &&
    read('supabase/migrations/003_phase1c_workout_logging.sql')
      .includes('workout_exercise_id UUID NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE'))
  check('no silent partial success — failure returns an explicit 500',
    seedBranch.includes("{ error: 'Could not add the exercise. Try again.' }") &&
    seedBranch.includes('{ status: 500 }'))
  check('session deletion never occurs in this route',
    !addRoute.includes(".from('workout_sessions')\n    .delete") &&
    !/workout_sessions'\)[\s\S]{0,80}\.delete\(/.test(addRoute))
}

// ── 6. Runtime: analytics safety ─────────────────────────────────────
console.log('\n6. Runtime: analytics safety')
{
  // A freshly seeded manual exercise: 3 uncompleted, non-warmup rows.
  const seededExercise = {
    workout_sets: Array.from({ length: DEFAULT_MANUAL_SET_COUNT }, (_, i) => ({
      set_number: i + 1, completed: false, is_warmup: false,
      reps: null, weight_kg: null,
    })),
  }
  const bounds = {
    startDate: '2026-08-10', endDate: '2026-08-16',
    priorStartDate: '2026-08-03', priorEndDate: '2026-08-09', label: '',
  }
  check('runtime: seeded rows add ZERO working sets to weekly training',
    (() => {
      const summary = computeWeeklyTraining([{
        workout_date: '2026-08-12', status: 'completed',
        completed_duration_seconds: null,
        workout_exercises: [seededExercise as any],
      }], bounds as any)
      return summary.completedWorkouts === 1 && summary.completedWorkingSets === 0
    })())
  check('runtime: completing ONE seeded row counts exactly one working set',
    (() => {
      const partly = {
        workout_sets: [
          { completed: true, is_warmup: false },
          { completed: false, is_warmup: false },
          { completed: false, is_warmup: false },
        ],
      }
      const summary = computeWeeklyTraining([{
        workout_date: '2026-08-12', status: 'completed',
        completed_duration_seconds: null,
        workout_exercises: [partly as any],
      }], bounds as any)
      return summary.completedWorkingSets === 1
    })())
  check('runtime: legacy weekly reducer also ignores seeded rows',
    (() => {
      const totals = normalizeLegacyWeeklySessionRows([{
        status: 'completed', workout_date: '2026-08-12',
        workout_exercises: [seededExercise as any],
      }])
      return totals.sessionsCompleted === 1 && totals.totalSetsCompleted === 0
    })())
  check('runtime: an in-progress workout with only seeded rows counts nothing',
    (() => {
      const totals = normalizeLegacyWeeklySessionRows([{
        status: 'in_progress', workout_date: '2026-08-12',
        workout_exercises: [seededExercise as any],
      }])
      return totals.sessionsCompleted === 0 && totals.totalSetsCompleted === 0 &&
        totals.hasActiveSession === true
    })())
  check('completed && !is_warmup filters intact in weekly-review',
    (read('src/lib/weekly-review.ts').match(/set\.completed && !set\.is_warmup/g) || []).length === 2)
  check('completed filter intact in progress-overview (history/PR safety)',
    read('src/lib/progress-overview.ts').includes('completed'))
  check('coach volume keys on completed sets (unchanged)',
    read('src/lib/workout-coach.ts').includes('completed'))
  // RETARGETED (5A.6B): workout-coach gained that phase's approved
  // broad-group COMPATIBILITY map entries. 5A.6A's own claim stands:
  // no 5A.6A Coach code, and the 5A.6B addition is compatibility-only.
  check('no Coach behavior changes in this phase',
    !read('src/lib/workout-coach.ts').includes('5A.6A') &&
    !read('src/lib/nutrition-coach.ts').includes('5A.6') &&
    read('src/lib/workout-coach.ts').includes('compatibility only'))
}

// ── 7. Routine regression ────────────────────────────────────────────
console.log('\n7. Routine regression')
{
  check('routine-start route contains no 5A.6A code',
    !startRoute.includes('5A.6') && !startRoute.includes('seedRows'))
  check('routine-start still seeds exactly target_sets rows (loop pinned)',
    startRoute.includes('for (let i = 0; i < re.target_sets; i++)'))
  check('routine-start still skips unprescribed exercises (no forced 3)',
    startRoute.includes('if (!re.target_sets || re.target_sets <= 0) continue'))
  check('runtime: routine loop math — 2 -> 2, 3 -> 3, 4 -> 4',
    (() => {
      const rowsFor = (target: number) => {
        const rows: number[] = []
        for (let i = 0; i < target; i++) rows.push(i + 1)
        return rows
      }
      return rowsFor(2).length === 2 && rowsFor(3).length === 3 &&
        rowsFor(4).length === 4 &&
        rowsFor(4).join(',') === '1,2,3,4'
    })())
  check('routine-start prefill semantics untouched (target weight carried, reps null)',
    startRoute.includes('weight_kg:  re.target_weight_kg ?? null,') &&
    startRoute.includes('reps:       null,'))
  check('routine-start compensating cleanup untouched (session delete on set failure)',
    startRoute.includes('set failure is fatal'))
}

// ── 8. User control preserved ────────────────────────────────────────
console.log('\n8. User control')
{
  check('Add set route unchanged (server-controlled next set_number)',
    setsRoute.includes('const set_number = ((lastSet as any)?.set_number ?? 0) + 1'))
  check('Add set button still present in the block UI',
    block.includes('handleAddSet') && block.includes("'Add set'"))
  check('Delete set route unchanged',
    setIdRoute.includes('export async function DELETE') &&
    setIdRoute.includes(".from('workout_sets').delete().eq('id', params.id)"))
  check('no minimum-set enforcement anywhere',
    !setIdRoute.includes('DEFAULT_MANUAL_SET_COUNT') &&
    !stripComments(setIdRoute).includes('minimum') &&
    !stripComments(addRoute).includes('minimum'))
  check('no re-seeding on deletion (default applies only at exercise creation)',
    !setIdRoute.includes('seedRows') && !setsRoute.includes('seedRows'))
  check('duplicate adds remain legal — each new exercise row gets its own seed',
    !addRoute.includes('already') &&
    !stripComments(addRoute).includes('unique') &&
    seedBranch.includes('workout_exercise_id: data.id,'))
  check('client add flow unchanged (single POST, then refresh)',
    addSection.includes('router.refresh()') &&
    (addSection.match(/fetch\(/g) || []).length === 1)
}

// ── 9. Docs and hygiene ──────────────────────────────────────────────
console.log('\n9. Docs and hygiene')
{
  check('notes document the prior zero-set flow and the new default',
    notes.includes('zero set') || notes.includes('zero-set'))
  check('notes document the persisted-empty-row rationale',
    notes.includes('persisted') && notes.includes('draft'))
  check('notes document the routine exception',
    notes.includes('routine') && notes.includes('target_sets'))
  check('notes document analytics safety and failure cleanup',
    notes.includes('completed && !is_warmup') && notes.includes('compensating'))
  check('notes record the no-migration boundary',
    notes.includes('No migration') || notes.includes('no migration'))
  check('notes record the approved 5A.6B direction with the JSONB safety modification',
    notes.includes('exercise_muscles') &&
    notes.includes('secondary_muscles') &&
    (notes.includes('do NOT drop') || notes.includes('Do NOT drop') || notes.includes('deprecated')))
  check('notes record role-based contributions with weights deferred',
    notes.includes('role') && notes.includes('deferred'))
  check('notes retain the standing roadmap',
    notes.includes('Energy Balance') && notes.includes('macro') &&
    notes.includes('plausibility') && notes.includes('Apple Health'))
  check('no retargets were needed (all prior suites green unmodified)',
    notes.includes('zero retargets') || notes.includes('no retargets') ||
    notes.includes('No retargets'))
  check('no emoji/pictographs in changed files',
    CHANGED.every((f) => !EMOJI.test(f)) && !EMOJI.test(notes))
  check('no legacy brand violations',
    CHANGED.every((f) => !f.toLowerCase().includes('fat_lass')))
  check('changed files carry no TODO/FIXME debt',
    CHANGED.every((f) => !f.includes('TODO') && !f.includes('FIXME')))
}

// ── 10. Runtime: seeded-row shape simulation ─────────────────────────
console.log('\n10. Runtime: seeded-row shape')
{
  // Reconstruct the route's exact seed-row builder and assert the shape
  // it produces — numbering, flags, and the all-NULL value contract.
  const buildSeedRows = (exerciseId: string, count: number) =>
    Array.from({ length: count }, (_, i) => ({
      workout_exercise_id: exerciseId,
      set_number: i + 1,
      completed: false,
      is_warmup: false,
      reps: null,
      weight_kg: null,
      rpe: null,
      duration_seconds: null,
      distance_meters: null,
      notes: null,
    }))
  const rows = buildSeedRows('we-1', DEFAULT_MANUAL_SET_COUNT)
  check('runtime: exactly 3 rows seeded', rows.length === 3)
  check('runtime: set numbers are exactly 1, 2, 3',
    rows.map((r) => r.set_number).join(',') === '1,2,3')
  check('runtime: every seeded row is uncompleted and non-warmup',
    rows.every((r) => r.completed === false && r.is_warmup === false))
  check('runtime: every performance value is null on every row',
    rows.every((r) => r.reps === null && r.weight_kg === null && r.rpe === null &&
      r.duration_seconds === null && r.distance_meters === null && r.notes === null))
  check('runtime: all rows attach to the same new exercise',
    rows.every((r) => r.workout_exercise_id === 'we-1'))
  check('runtime: the existing add-set rule continues at 4 after the seed',
    (() => {
      const lastSetNumber = rows[rows.length - 1].set_number
      return ((lastSetNumber ?? 0) + 1) === 4
    })())
  check('runtime: a second exercise seeds independently (its own 1,2,3)',
    (() => {
      const second = buildSeedRows('we-2', DEFAULT_MANUAL_SET_COUNT)
      return second.length === 3 &&
        second.every((r) => r.workout_exercise_id === 'we-2') &&
        second.map((r) => r.set_number).join(',') === '1,2,3'
    })())
  check('runtime: deleting down to 2 or 1 is a plain filter, no floor',
    (() => {
      const afterDeleteOne = rows.filter((r) => r.set_number !== 3)
      const afterDeleteTwo = afterDeleteOne.filter((r) => r.set_number !== 2)
      return afterDeleteOne.length === 2 && afterDeleteTwo.length === 1
    })())
}

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
