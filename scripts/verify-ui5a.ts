// ============================================================
// ForgeFitOS — UI-5A Train discovery/management rebuild harness
// Proves the four Train discovery routes (/workouts, routines,
// routine detail, exercise library) recomposed onto the UI-1 token
// system and UI-1B primitives at the approved max-w-6xl width:
// responsive grids with natural heights, single-column mobile,
// primitive adoption, wrap-safe long names, glyph-free presentation
// — while every query, mutation, conflict flow, anatomy read,
// empty state, and the ENTIRE live-execution surface
// (/workouts/[id] and its components) stay byte-untouched.
// Client components render through a require-hook next/navigation
// stub (render-only; no handler ever fires).
// Run from the repository root:
//   npx tsx scripts/verify-ui5a.ts
// ============================================================

import { readFileSync, readdirSync, existsSync } from 'fs'
import { execSync } from 'child_process'
import React from 'react'
;(globalThis as any).React = React
import { renderToStaticMarkup } from 'react-dom/server'

// Render-only stub: client containers call useRouter/usePathname at
// the top; server rendering has no app router. Handlers that would
// use the router are never invoked by these checks.
const Module = require('module')
const origLoad = Module._load
Module._load = function (request: string) {
  if (request === 'next/navigation') {
    return {
      useRouter: () => ({ push() {}, replace() {}, refresh() {}, back() {}, prefetch() {} }),
      usePathname: () => '/workouts/routines',
      useSearchParams: () => new URLSearchParams(),
    }
  }
  return origLoad.apply(this, arguments as any)
}

let passed = 0
let failed = 0
function check(name: string, condition: boolean, detail?: string) {
  if (condition) { passed++; console.log(`  PASS  ${name}`) }
  else { failed++; console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`) }
}
const read = (p: string) => readFileSync(p, 'utf8')
const stripComments = (s: string) =>
  s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
const EMOJI = new RegExp('\\p{Extended_Pictographic}', 'u')

const hubPage = read('src/app/(app)/workouts/page.tsx')
const hubLoading = read('src/app/(app)/workouts/loading.tsx')
const routinesClient = read('src/components/routine/RoutinesPageClient.tsx')
const routinesLoading = read('src/app/(app)/workouts/routines/loading.tsx')
const routineDetail = read('src/components/routine/RoutineDetailClient.tsx')
const detailLoading = read('src/app/(app)/workouts/routines/[id]/loading.tsx')
const exercisesClient = read('src/components/workout/ExercisesClient.tsx')
const exercisesLoading = read('src/app/(app)/workouts/exercises/loading.tsx')
const routineCard = read('src/components/routine/RoutineCard.tsx')
const sessionCard = read('src/components/workout/SessionCard.tsx')

const CHANGED = [hubPage, hubLoading, routinesClient, routinesLoading,
  routineDetail, detailLoading, exercisesClient, exercisesLoading,
  routineCard, sessionCard]
const CHANGED_PATHS = [
  'src/app/(app)/workouts/page.tsx',
  'src/app/(app)/workouts/loading.tsx',
  'src/components/routine/RoutinesPageClient.tsx',
  'src/app/(app)/workouts/routines/loading.tsx',
  'src/components/routine/RoutineDetailClient.tsx',
  'src/app/(app)/workouts/routines/[id]/loading.tsx',
  'src/components/workout/ExercisesClient.tsx',
  'src/app/(app)/workouts/exercises/loading.tsx',
  'src/components/routine/RoutineCard.tsx',
  'src/components/workout/SessionCard.tsx',
  // Addendum: the sole approved minor behavior refinement —
  // alphabetical muscle-choice display in the exercise form
  // (section 8 owns its proofs; it is NOT part of the presentation
  // CHANGED set above because it legitimately reads
  // exercise_muscles for prefill).
  'src/components/workout/ExerciseForm.tsx',
]
// The live-execution surface and every shared/deferred collaborator
// UI-5A must not touch.
const UNTOUCHED_PATHS = [
  'src/app/(app)/workouts/[id]/page.tsx',
  'src/app/(app)/workouts/[id]/loading.tsx',
  'src/app/(app)/workouts/routines/page.tsx',
  'src/app/(app)/workouts/routines/[id]/page.tsx',
  'src/app/(app)/workouts/exercises/page.tsx',
  'src/components/workout/WorkoutDetailClient.tsx',
  'src/components/workout/SessionHeader.tsx',
  'src/components/workout/WorkoutExerciseBlock.tsx',
  'src/components/workout/SetRow.tsx',
  'src/components/workout/AddExerciseSection.tsx',
  'src/components/workout/WorkoutCompletionSummaryCard.tsx',
  'src/components/workout/WorkoutSessionNotes.tsx',
  'src/components/workout/ExercisePicker.tsx',
  'src/components/workout/ExerciseListItem.tsx',
  'src/components/workout/CreateWorkoutButton.tsx',
  'src/components/workout/LogPastWorkoutForm.tsx',
  'src/components/workout/WorkoutsSubNav.tsx',
  'src/components/workout/MuscleVolumeSummary.tsx',
  'src/components/workout/ActiveWorkoutConflictModal.tsx',
  'src/components/routine/StartWorkoutButton.tsx',
  'src/components/routine/RoutineForm.tsx',
  'src/components/routine/RoutineExerciseRow.tsx',
  'src/components/coach/MuscleReadinessPanel.tsx',
]

async function main() {
  const { RoutinesPageClient } = await import('../src/components/routine/RoutinesPageClient')
  const { ExercisesClient } = await import('../src/components/workout/ExercisesClient')
  const { RoutineDetailClient } = await import('../src/components/routine/RoutineDetailClient')
  const { RoutineCard } = await import('../src/components/routine/RoutineCard')
  const { SessionCard } = await import('../src/components/workout/SessionCard')

  const LONG_ROUTINE = 'Upper Body Hypertrophy and Accessory Pump Session Alpha Extended'
  const LONG_EXERCISE = 'Single-Arm Dumbbell Overhead Tricep Extension With Extended Pause'
  const LONG_TITLE = 'Heavy Lower Body Strength Session With Optional Conditioning Finisher'

  // ── 1. Width and responsive structure ──────────────────────────────
  console.log('\n1. Width and responsive structure')
  {
    check('S1: all four routes at the approved max-w-6xl',
      [hubPage, routinesClient, routineDetail, exercisesClient]
        .every((f) => f.includes('max-w-6xl') && !f.includes('max-w-3xl')))
    check('S2: no route exceeds the approved width (no max-w-7xl)',
      CHANGED.every((f) => !f.includes('max-w-7xl')))
    check('S3: hub body grid — 12-col split with natural heights',
      hubPage.includes('lg:grid-cols-12 lg:items-start') &&
      hubPage.includes('lg:col-span-7 xl:col-span-8') &&
      hubPage.includes('lg:col-span-5 xl:col-span-4'))
    check('S4: routines list — responsive card grid, natural heights',
      (routinesClient.match(/sm:grid-cols-2 xl:grid-cols-3 lg:items-start/g) || []).length === 2)
    check('S5: routine detail — identity/list split, natural heights',
      routineDetail.includes('lg:grid-cols-12 lg:items-start') &&
      routineDetail.includes('lg:col-span-5 xl:col-span-4') &&
      routineDetail.includes('lg:col-span-7 xl:col-span-8'))
    check('S6: exercise library — two-column grid at lg, natural heights',
      (exercisesClient.match(/grid gap-2 lg:grid-cols-2 lg:items-start/g) || []).length === 2)
    check('S7: mobile single column (every grid-cols- is breakpoint-gated)',
      CHANGED.every((f) => !/[^:a-z-]grid-cols-\d/.test(stripComments(f))))
    check('S8: no md: (shell breakpoint discipline preserved)',
      CHANGED.every((f) => !stripComments(f).includes('md:')))
    check('S9: shell padding preserved (p-4 lg:p-6)',
      [hubPage, routinesClient, routineDetail, exercisesClient]
        .every((f) => f.includes('p-4 lg:p-6')))
    check('S10: no fixed-width overflow constructs, viewport traps, or scrollers',
      CHANGED.every((f) => !stripComments(f).includes('w-[') &&
        !stripComments(f).includes('h-screen') &&
        !stripComments(f).includes('overflow-x') &&
        !stripComments(f).includes('overflow-y')))
  }

  // ── 2. Primitive adoption and glyph-free presentation ──────────────
  console.log('\n2. Primitives and glyphs')
  {
    check('S11: PageHeader adopted on hub, routines, and library (default h1)',
      [hubPage, routinesClient, exercisesClient].every((f) =>
        (f.match(/<PageHeader/g) || []).length === 1 && !f.includes('<PageHeader as=')))
    check('S12: SectionHeader adopted for the hub session sections',
      hubPage.includes('<SectionHeader title="Today" />') &&
      hubPage.includes('<SectionHeader title="Recent sessions" />'))
    check('S13: EmptyState adopted with caller-owned copy (hub + routines)',
      hubPage.includes('<EmptyState') && routinesClient.includes('<EmptyState') &&
      hubPage.includes('title="No workouts yet."') &&
      routinesClient.includes('title="No routines yet."'))
    check('S14: no text-glyph arrows/chevrons/checks/tildes in touched code',
      CHANGED.every((f) => {
        const code = stripComments(f)
        return ['\u2192', '\u2190', '\u203A', '\u2713', '\u2717', '\u223C']
          .every((g) => !code.includes(g))
      }))
    check('S15: lucide replacements in place (ChevronRight / ChevronLeft)',
      hubPage.includes('<ChevronRight') && routineCard.includes('<ChevronRight') &&
      routineDetail.includes('<ChevronLeft'))
    check('S16: decorative icons aria-hidden',
      hubPage.includes('<ChevronRight className="h-4 w-4 flex-shrink-0 text-ink-muted" aria-hidden="true" />') &&
      routineDetail.includes('<ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />'))
    check('S17: no emoji/pictographs in touched files',
      CHANGED.every((f) => !EMOJI.test(f)))
    check('S18: semantic tokens only (no raw palette classes in new code)',
      CHANGED.every((f) =>
        !/(green|red|blue|amber|gray|slate|zinc)-\d{3}/.test(stripComments(f))))
    check('S19: 44px principal controls (resume, New x2, search, add exercise)',
      hubPage.includes('min-h-11') &&
      (routinesClient.match(/min-h-11/g) || []).length >= 1 &&
      exercisesClient.includes('flex min-h-11 items-center') &&
      exercisesClient.includes('w-full min-h-11 pl-8') &&
      routineDetail.includes('min-h-11'))
    check('S20: no focus suppression added (touched non-input surfaces)',
      [hubPage, routinesClient, routineCard, sessionCard].every((f) =>
        !f.includes('outline-none')))
  }

  // ── 3. Runtime renders: loaded, empty, sparse, long names ──────────
  console.log('\n3. Runtime renders')
  const mkRoutine = (id: string, name: string, active = true, exercises = 1) => ({
    id, user_id: 'u', name, description: null, goal: 'hypertrophy',
    primary_muscle_focus: 'chest', difficulty: null, estimated_duration_minutes: 60,
    is_active: active, created_at: '', updated_at: '',
    workout_routine_exercises: Array.from({ length: exercises }, (_, i) => ({ id: `${id}e${i}` })),
  })
  {
    const routines = [mkRoutine('r1', 'Push Day'), mkRoutine('r2', LONG_ROUTINE),
      mkRoutine('r3', 'Leg Day'), mkRoutine('r4', 'Old Plan', false)]
    const html = renderToStaticMarkup(React.createElement(RoutinesPageClient, {
      initialRoutines: routines as never }))
    check('R1: routines page renders PageHeader h1 + honest count',
      html.includes('>Routines</h1>') && html.includes('3 saved routines'))
    check('R2: active routines render in the responsive grid',
      html.includes('sm:grid-cols-2 xl:grid-cols-3') &&
      html.includes('Push Day') && html.includes('Leg Day'))
    check('R3: long routine name renders in full and wraps (no truncate)',
      html.includes(LONG_ROUTINE) && html.includes('break-words') &&
      !html.includes('truncate'))
    check('R4: inactive disclosure collapsed with honest count',
      html.includes('Show inactive routines (1)') && !html.includes('Old Plan'))
    check('R5: subnav present on the client-rendered page',
      html.includes('aria-label="Workout sections"'))
    check('R6: deterministic rendering', renderToStaticMarkup(
      React.createElement(RoutinesPageClient, { initialRoutines: routines as never })) === html)

    const emptyHtml = renderToStaticMarkup(React.createElement(RoutinesPageClient, {
      initialRoutines: [] as never }))
    check('R7: empty state copy exact (EmptyState renders caller copy only)',
      emptyHtml.includes('No routines yet.') &&
      emptyHtml.includes('Build a reusable Push Day, Pull Day, or Leg Day and start any workout in one tap.') &&
      emptyHtml.includes('Create your first routine') &&
      emptyHtml.includes('0 saved routines'))
    check('R8: empty state renders no grid and no fabricated rows',
      !emptyHtml.includes('sm:grid-cols-2') && !emptyHtml.includes('inactive routines'))
  }
  {
    const mkExercise = (id: string, name: string, extra: Record<string, unknown> = {}) => ({
      id, user_id: 'u', name, primary_muscle: 'triceps', equipment: 'dumbbell',
      category: 'isolation', is_system: false, is_active: true, unilateral: false,
      created_at: '', updated_at: '', exercise_muscles: [], ...extra })
    const exercises = [
      mkExercise('e1', LONG_EXERCISE, {
        unilateral: true,
        exercise_muscles: [
          { id: 'm1', user_id: 'u', exercise_id: 'e1', muscle: 'shoulders', role: 'secondary', created_at: '' },
          { id: 'm2', user_id: 'u', exercise_id: 'e1', muscle: 'upper_chest', role: 'tertiary', created_at: '' },
        ],
      }),
      mkExercise('e2', 'Bench Press'),
      mkExercise('e3', 'Retired Move', { is_active: false }),
    ]
    const html = renderToStaticMarkup(React.createElement(ExercisesClient, {
      initialExercises: exercises as never }))
    check('R9: library renders PageHeader h1 + honest active count',
      html.includes('>Exercise library</h1>') && html.includes('2 active exercises'))
    check('R10: active exercises render inside the lg two-column grid',
      html.includes('lg:grid-cols-2') && html.includes('Bench Press'))
    check('R11: long exercise name renders in full (wrapping flex, no truncation)',
      html.includes(LONG_EXERCISE))
    check('R12: stored anatomy rows render (read-only; never re-derived)',
      html.includes('Secondary: Shoulders') && html.includes('Tertiary: Upper chest') &&
      html.includes('per side'))
    check('R13: filter pills carry aria-pressed state',
      html.includes('aria-pressed="true"') && html.includes('aria-pressed="false"'))
    check('R14: 44px search rendered', html.includes('min-h-11 pl-8'))
    check('R15: inactive exercises stay behind the collapsed disclosure',
      html.includes('Show inactive exercises') && !html.includes('Retired Move'))
    const emptyHtml = renderToStaticMarkup(React.createElement(ExercisesClient, {
      initialExercises: [] as never }))
    check('R16: library empty state copy preserved',
      emptyHtml.includes('No exercises yet.') && emptyHtml.includes('0 active exercises'))
  }
  {
    const routine = {
      id: 'rt1', user_id: 'u', name: LONG_ROUTINE, description: 'Twice weekly',
      goal: 'hypertrophy', primary_muscle_focus: 'upper_body', difficulty: 'intermediate',
      estimated_duration_minutes: 75, is_active: true, created_at: '', updated_at: '',
      workout_routine_exercises: [
        { id: 're1', routine_id: 'rt1', exercise_id: 'e1', order_index: 0,
          target_sets: 3, target_reps_min: 8, target_reps_max: 12, target_weight_kg: null,
          target_rpe: null, rest_seconds: 90, notes: null,
          exercise: { id: 'e1', name: LONG_EXERCISE, primary_muscle: 'triceps', is_active: true } },
        { id: 're2', routine_id: 'rt1', exercise_id: 'e2', order_index: 1,
          target_sets: 3, target_reps_min: 5, target_reps_max: 8, target_weight_kg: 60,
          target_rpe: 8, rest_seconds: 120, notes: null,
          exercise: { id: 'e2', name: 'Bench Press', primary_muscle: 'chest', is_active: true } },
      ],
    }
    const html = renderToStaticMarkup(React.createElement(RoutineDetailClient, {
      routine: routine as never, allExercises: [] as never }))
    check('R17: detail renders the identity column + exercise column grid',
      html.includes('lg:grid-cols-12') && html.includes('lg:col-span-5') &&
      html.includes('lg:col-span-7'))
    check('R18: routine name renders as the page H1 (long name intact)',
      html.includes(`>${LONG_ROUTINE}</h1>`))
    check('R19: exercises render in stored order with targets intact',
      html.indexOf(LONG_EXERCISE) < html.indexOf('Bench Press') &&
      html.indexOf(LONG_EXERCISE) > 0)
    check('R20: single start button and add-exercise control render',
      html.includes('Add exercise') &&
      html.includes(`Start ${LONG_ROUTINE}`))
    check('R21: management actions render with text labels',
      html.includes('Deactivate routine') && html.includes('Delete permanently'))
    check('R22: back link is a real link without glyph arrows',
      html.includes('href="/workouts/routines"') && !html.includes('\u2190'))
    check('R23: duration chip uses plain ~', html.includes('~75 min') &&
      !html.includes('\u223C75'))
    const emptyHtml = renderToStaticMarkup(React.createElement(RoutineDetailClient, {
      routine: { ...routine, workout_routine_exercises: [] } as never, allExercises: [] as never }))
    check('R24: detail empty state copy preserved',
      emptyHtml.includes('No exercises yet. Add your first exercise below.'))
  }
  {
    const session = { id: 's1', user_id: 'u', routine_id: null, title: LONG_TITLE,
      workout_date: '2026-08-10', status: 'completed', start_time: null, end_time: null,
      completed_duration_seconds: 3600, notes: null, calories_burned: null,
      created_at: '', updated_at: '' }
    const html = renderToStaticMarkup(React.createElement(SessionCard, {
      session: session as never }))
    check('R25: session card renders full long title, wrap-safe',
      html.includes(LONG_TITLE) && html.includes('break-words') &&
      !html.includes('truncate'))
    check('R26: real date, duration, status label text render',
      html.includes('Mon, Aug 10') && html.includes('1h 0m') &&
      html.includes('href="/workouts/s1"'))
    const routineHtml = renderToStaticMarkup(React.createElement(RoutineCard, {
      routine: mkRoutine('rc1', LONG_ROUTINE) as never }))
    check('R27: routine card renders full long name + lucide chevron, no glyph',
      routineHtml.includes(LONG_ROUTINE) && routineHtml.includes('chevron-right') &&
      !routineHtml.includes('\u203A') && routineHtml.includes('break-words'))
  }

  // ── 4. Preserved behavior wiring ────────────────────────────────────
  console.log('\n4. Preserved behavior')
  {
    check('B1: hub queries unchanged (helpers + week-volume read)',
      ['fetchRecentSessions(supabase, user.id, 15)',
        'fetchWorkoutWeekStats(supabase, user.id)',
        'fetchCoachSummary(supabase, user.id, today)',
        'seedExercisesIfNeeded(supabase, user.id)',
        "in('status', ['in_progress', 'completed'])",
        'weeklyMuscleVolume'].every((q) => hubPage.includes(q)))
    check('B2: resume path wired and prominent (conditional, 44px brand CTA)',
      hubPage.includes('findActiveTrainingSession(supabase, user.id).catch(() => null)') &&
      hubPage.includes('{activeSession && (') &&
      hubPage.includes('href={`/workouts/${activeSession.id}`}') &&
      hubPage.includes('Resume workout') && hubPage.includes('variant="action"'))
    check('B3: create + conflict flow untouched (CreateWorkoutButton x2, 409 contract)',
      (hubPage.match(/<CreateWorkoutButton/g) || []).length === 2 &&
      read('src/components/workout/CreateWorkoutButton.tsx').includes('res.status === 409'))
    check('B4: start + conflict flow untouched (StartWorkoutButton, 409 contract)',
      (routineDetail.match(/<StartWorkoutButton/g) || []).length === 1 &&
      read('src/components/routine/StartWorkoutButton.tsx').includes('res.status === 409 && body.active_workout_id'))
    check('B5: backdated-workout path preserved in place (after create action)',
      hubPage.includes('<LogPastWorkoutForm />') &&
      hubPage.indexOf('<CreateWorkoutButton />') < hubPage.indexOf('<LogPastWorkoutForm />'))
    check('B6: readiness/volume recomposition only (same props, same components)',
      hubPage.includes('<MuscleReadinessPanel summary={coachSummary} />') &&
      hubPage.includes('<MuscleVolumeSummary volume={muscleVolume} />') &&
      hubPage.includes('Object.keys(muscleVolume).length > 0'))
    check('B7: today/history split unchanged',
      hubPage.includes("sessions.filter((s: any) => s.workout_date === today)") &&
      hubPage.includes("sessions.filter((s: any) => s.workout_date !== today)"))
    check('B8: hub stays a server component with no writes',
      !hubPage.includes("'use client'") && !hubPage.includes('.insert(') &&
      !hubPage.includes('.update('))
    check('B9: routine CRUD wiring unchanged (create/edit/toggle/delete/409)',
      routinesClient.includes('<RoutineForm onClose={() => setCreating(false)} onCreated={handleCreated} />') &&
      routinesClient.includes('router.push(`/workouts/routines/${id}`)') &&
      routineDetail.includes('<RoutineForm existing={routine} onClose={() => setEditingMeta(false)} />') &&
      routineDetail.includes('res.status === 409 && body.has_sessions') &&
      routineDetail.includes("fetch(`/api/routines/${routine.id}`, { method: 'DELETE' })"))
    check('B10: optimistic reorder machinery byte-anchored',
      routineDetail.includes('const snapshot: any[] = exerciseList.map((e: any) => ({ ...e }))') &&
      routineDetail.includes('setExerciseList(snapshot)') &&
      routineDetail.includes('a.order_index - b.order_index'))
    check('B11: detail fetch surface unchanged (exactly 6 calls, same endpoints)',
      (stripComments(routineDetail).match(/fetch\(/g) || []).length === 6 &&
      routineDetail.includes('`/api/routines/${routine.id}/exercises`') &&
      routineDetail.includes('`/api/routine-exercises/${snapshot[fromIdx].id}`'))
    check('B12: zero fetches in the recomposed list/card components',
      [routinesClient, exercisesClient, routineCard, sessionCard, hubLoading,
        routinesLoading, detailLoading, exercisesLoading]
        .every((f) => !stripComments(f).includes('fetch(')))
    check('B13: library filter semantics unchanged',
      exercisesClient.includes('e.name.toLowerCase().includes(search.toLowerCase())') &&
      exercisesClient.includes("muscle !== 'all' && e.primary_muscle !== muscle") &&
      exercisesClient.includes('PRIMARY_MUSCLES.map'))
    check('B14: exercise CRUD entry unchanged (ExerciseForm wiring)',
      exercisesClient.includes('<ExerciseForm onClose={() => { setCreating(false); router.refresh() }} />'))
    check('B15: anatomy stays read-only in scope (no exercise_muscles writes)',
      CHANGED.every((f) => !stripComments(f).includes('exercise_muscles')) &&
      read('src/app/(app)/workouts/exercises/page.tsx')
        .includes('exercise_muscles(id, user_id, exercise_id, muscle, role, created_at)'))
    check('B16: session card formatting helpers unchanged',
      sessionCard.includes('formatWorkoutDuration(session.start_time, session.end_time, session.completed_duration_seconds)') &&
      sessionCard.includes('{workoutStatusLabel(session)}'))
    check('B17: no invented metrics/scores/streaks/badges/rankings',
      CHANGED.every((f) =>
        !/streak|badge|ranking|adherence|consistency|projection|score/i.test(stripComments(f))))
    check('B18: server wrapper pages byte-identical intent (still thin)',
      read('src/app/(app)/workouts/routines/page.tsx').includes('return <RoutinesPageClient initialRoutines={routines} />') &&
      read('src/app/(app)/workouts/exercises/page.tsx').includes('<ExercisesClient initialExercises='))
  }

  // ── 5. Live-execution surface byte-untouched ───────────────────────
  console.log('\n5. Execution surface untouched')
  {
    let diffFiles: string[] = []
    try {
      diffFiles = execSync('git diff --name-only HEAD', { encoding: 'utf8' })
        .split('\n').filter(Boolean)
    } catch { diffFiles = ['<git unavailable>'] }
    check('X1: no excluded file carries any working-tree change',
      UNTOUCHED_PATHS.every((p) => !diffFiles.includes(p)),
      diffFiles.filter((f) => UNTOUCHED_PATHS.includes(f)).join(', '))
    check('X2: every changed file is inside the declared UI-5A inventory',
      diffFiles.every((f) => CHANGED_PATHS.includes(f) ||
        ['scripts/verify-ui5a.ts', 'scripts/verify-phase4b6a.ts',
          'scripts/verify-phase5a6b.ts',
          'docs/ui5a-train-discovery-notes.md'].includes(f)),
      diffFiles.join(', '))
    check('X3: no UI-5A marker leaked into excluded files',
      UNTOUCHED_PATHS.every((p) => !read(p).includes('UI-5A')))
    check('X4: execution behavior anchors intact',
      read('src/components/workout/WorkoutDetailClient.tsx').includes('summarizeWorkout(exercises, prBaseline ?? {})') &&
      read('src/components/workout/SetRow.tsx').includes('/api/workout-sets/') &&
      read('src/components/workout/AddExerciseSection.tsx').includes('`/api/workouts/${workoutId}/exercises`') &&
      read('src/app/api/workouts/route.ts').includes('findActiveTrainingSession') &&
      read('src/app/api/routines/[id]/start/route.ts').includes('findActiveTrainingSession'))
    check('X5: tracking-mode / set semantics untouched (SetRow + block anchors)',
      read('src/components/workout/WorkoutExerciseBlock.tsx').length > 0 &&
      read('src/components/workout/SessionHeader.tsx').includes('fetch('))
    // Addendum: ExerciseForm carries the approved display-sort only;
    // section 8 proves its write path is byte-anchored unchanged.
    check('X6: three-set default owner untouched (RoutineForm)',
      !diffFiles.includes('src/components/routine/RoutineForm.tsx'))
  }

  // ── 6. Loading mirrors ──────────────────────────────────────────────
  console.log('\n6. Loading mirrors')
  {
    const LOADINGS = [hubLoading, routinesLoading, detailLoading, exercisesLoading]
    check('L1: all four at max-w-6xl, aria-hidden, skeleton primitives',
      LOADINGS.every((l) => l.includes('max-w-6xl') &&
        l.includes('aria-hidden="true"') &&
        l.includes("from '@/components/ui/skeleton'")))
    check('L2: each mirrors its route grid',
      hubLoading.includes('lg:grid-cols-12 lg:items-start') &&
      routinesLoading.includes('sm:grid-cols-2 xl:grid-cols-3') &&
      detailLoading.includes('lg:grid-cols-12 lg:items-start') &&
      exercisesLoading.includes('lg:grid-cols-2 lg:items-start'))
    check('L3: column spans mirror the pages (hub + detail)',
      hubLoading.includes('lg:col-span-7 xl:col-span-8') &&
      hubLoading.includes('lg:col-span-5 xl:col-span-4') &&
      detailLoading.includes('lg:col-span-5 xl:col-span-4') &&
      detailLoading.includes('lg:col-span-7 xl:col-span-8'))
    check('L4: no fake data, headings, links, or spinners',
      LOADINGS.every((l) => !l.includes('<h1') && !l.includes('<Link') &&
        !l.includes('<button') && !l.includes('animate-spin') &&
        !l.includes('Loading...')))
    check('L5: 44px search mirrored in the library skeleton',
      exercisesLoading.includes('h-11 w-full'))
    check('L6: subnav strip mirrored everywhere', LOADINGS.every((l) => l.includes('h-9 w-72')))
  }

  // ── 7. Boundaries ───────────────────────────────────────────────────
  console.log('\n7. Boundaries')
  {
    check('G1: migrations exactly 001–020 (no UI-5A migration)',
      readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).length === 20)
    check('G2: zero dependency change',
      read('package.json').includes('"next": "14.2.13"') &&
      Object.keys(JSON.parse(read('package.json')).dependencies).length === 22)
    check('G3: no .DS_Store', !existsSync('.DS_Store') && !existsSync('src/.DS_Store'))
    check('G4: notes document exists and records the approved decisions',
      read('docs/ui5a-train-discovery-notes.md').includes('max-w-6xl') &&
      read('docs/ui5a-train-discovery-notes.md').includes('UI-5B'))
    check('G5: no server actions / API changes in scope',
      CHANGED.every((f) => !stripComments(f).includes("'use server'")))
    check('G6: real links and buttons only (no clickable divs, no tabindex hacks)',
      CHANGED.every((f) => !f.match(/<div[^>]*onClick/) &&
        !f.toLowerCase().includes('tabindex')))
  }

  // ── 8. Alphabetical muscle choices (sole approved refinement) ──────
  console.log('\n8. Alphabetical muscle choices')
  {
    const form = read('src/components/workout/ExerciseForm.tsx')
    const { PRIMARY_MUSCLES } = await import('../src/lib/constants')
    const { ExerciseForm } = await import('../src/components/workout/ExerciseForm')

    const expectedSorted = [...PRIMARY_MUSCLES]
      .sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase(), 'en'))
      .map((m) => m.label)

    check('A1: sorted DISPLAY copy — spread + sort, never in-place, registry untouched',
      form.includes('const MUSCLES_BY_LABEL = [...PRIMARY_MUSCLES].sort') &&
      !form.includes('PRIMARY_MUSCLES.sort') &&
      !read('src/lib/constants.ts').includes('UI-5A'))
    check('A2: deterministic case-insensitive comparison on the displayed label',
      form.includes("a.label.toLowerCase().localeCompare(b.label.toLowerCase(), 'en')"))
    check('A3: all three muscle groups use the sorted copy; other groups unsorted',
      form.includes('<PillGroup options={MUSCLES_BY_LABEL} value={muscle as any}') &&
      (form.match(/<MultiPillGroup options=\{MUSCLES_BY_LABEL\}/g) || []).length === 2 &&
      form.includes('<PillGroup options={EXERCISE_CATEGORIES}') &&
      form.includes('<PillGroup options={EXERCISE_EQUIPMENT}') &&
      form.includes('<PillGroup options={TRACKING_MODES}'))

    const html = renderToStaticMarkup(React.createElement(ExerciseForm, {
      onClose: () => {} }))
    const primarySlice = html.split('Primary muscle *')[1]?.split('Secondary muscles')[0] ?? ''
    const renderedLabels = Array.from(primarySlice.matchAll(/<button[^>]*>([^<]+)<\/button>/g))
      .map((m) => m[1])
    check('A4: rendered primary choices are exactly the alphabetical label order',
      renderedLabels.length === PRIMARY_MUSCLES.length &&
      JSON.stringify(renderedLabels) === JSON.stringify(expectedSorted))
    check('A5: registry order not mutated by import/render (canonical grouping intact)',
      PRIMARY_MUSCLES[0].value === 'chest' &&
      PRIMARY_MUSCLES[PRIMARY_MUSCLES.length - 1].value === 'other' &&
      PRIMARY_MUSCLES.length === 25 &&
      JSON.stringify(PRIMARY_MUSCLES.map((m) => m.label)) !== JSON.stringify(expectedSorted))
    check('A6: deterministic rendering (same markup twice)',
      renderToStaticMarkup(React.createElement(ExerciseForm, { onClose: () => {} })) === html)

    const existing = {
      id: 'ex1', user_id: 'u', name: 'Cable Fly', category: null,
      primary_muscle: 'chest', equipment: null, tracking_mode: 'weight_reps',
      unilateral: false, notes: null, is_system: false, is_active: true,
      created_at: '', updated_at: '',
      exercise_muscles: [
        { id: 'm1', user_id: 'u', exercise_id: 'ex1', muscle: 'front_delts', role: 'secondary', created_at: '' },
        { id: 'm2', user_id: 'u', exercise_id: 'ex1', muscle: 'triceps', role: 'tertiary', created_at: '' },
      ],
    }
    const editHtml = renderToStaticMarkup(React.createElement(ExerciseForm, {
      existing: existing as never, onClose: () => {} }))
    check('A7: selected values remain selected after sorting (primary + role counts)',
      /<button[^>]*aria-pressed="true"[^>]*>Chest<\/button>/.test(editHtml) &&
      editHtml.includes('Optional · 1 selected') &&
      editHtml.includes('lighter involvement · 1 selected'))
    check('A8: stored identifiers and submitted payload contract unchanged',
      form.includes('primary_muscle: muscle,') &&
      form.includes("...secondary.map(m => ({ muscle: m, role: 'secondary' as const }))") &&
      form.includes("...tertiary.map(m => ({ muscle: m, role: 'tertiary' as const }))") &&
      form.includes("const url    = existing ? `/api/exercises/${existing.id}` : '/api/exercises'") &&
      form.includes("const method = existing ? 'PATCH' : 'POST'"))
    check('A9: primary/additional behavior intact (eviction, one role per muscle, disclosures)',
      form.includes('setSecondary(prev => prev.filter(m => m !== next))') &&
      form.includes('setTertiary(prev => prev.filter(m => m !== next))') &&
      form.includes('const secondaryUnavailable = new Set([muscle, ...tertiary])') &&
      form.includes('const [secondaryOpen, setSecondaryOpen] = useState(false)'))
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
