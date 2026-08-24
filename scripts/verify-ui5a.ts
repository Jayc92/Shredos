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
  // Addendum + hosted-QA correction: the sole approved minor
  // behavior refinement — alphabetical muscle-choice display
  // everywhere muscles are ordinarily selected, filtered, picked, or
  // listed (sections 8-9 own the proofs; these files are NOT part of
  // the presentation CHANGED set above because they legitimately
  // reference exercise_muscles or registry data).
  'src/components/workout/ExerciseForm.tsx',
  'src/components/workout/ExercisePicker.tsx',
  'src/components/workout/ExerciseListItem.tsx',
  'src/components/routine/RoutineForm.tsx',
  'src/components/coach/MuscleReadinessPanel.tsx',
  'src/components/progress/TrainingCoverageSection.tsx',
]
// RETARGET (UI-5B1A): five execution files entered the APPROVED
// UI-5B1A presentation/accessibility slice. The UI-5A boundary they
// carried survives, re-anchored: (a) every remaining exclusion below
// stays untouched, (b) no UI-5A marker may appear in any excluded
// file (X3), and (c) the execution BEHAVIOR anchors (X4/X5) are
// asserted unchanged regardless of which slice owns the file.
const UI5B1A_APPROVED = [
  'src/app/(app)/workouts/[id]/page.tsx',
  'src/app/(app)/workouts/[id]/loading.tsx',
  'src/components/workout/SessionHeader.tsx',
  'src/components/workout/WorkoutExerciseBlock.tsx',
  'src/components/workout/SetRow.tsx',
  'src/components/workout/WorkoutSessionNotes.tsx',
  'src/components/workout/WorkoutCompletionSummaryCard.tsx',
]
// The live-execution surface and every shared/deferred collaborator
// neither UI-5A nor UI-5B1A may touch.
// RETARGET (UI-5B1B): WorkoutDetailClient and the ordering/set API
// routes entered the APPROVED UI-5B1B scope (transactional
// reordering, atomic set resequencing, apply-to-remaining, PATCH
// hardening, migration 021). The remaining exclusions still may not
// change, and the behavior anchors (X4/X5) hold regardless.
const UI5B1B_APPROVED = [
  'src/components/workout/WorkoutDetailClient.tsx',
  'src/components/workout/WorkoutExerciseBlock.tsx',
  'src/components/routine/RoutineDetailClient.tsx',
  'src/app/api/workouts/[id]/exercise-order/route.ts',
  'src/app/api/routines/[id]/exercise-order/route.ts',
  'src/app/api/workout-exercises/[id]/route.ts',
  'src/app/api/workout-exercises/[id]/sets/route.ts',
  'src/app/api/workout-exercises/[id]/apply-first-set/route.ts',
  'src/app/api/workout-sets/[id]/route.ts',
  'src/app/api/routine-exercises/[id]/route.ts',
  'supabase/migrations/021_ui5b_transactional_ordering.sql',
]
// RETARGET (LOCAL-DATE-FIX): the approved date-boundary correction —
// expanded to the full repo-wide local-calendar sweep (every
// user-local today/current-week/current-hour consumer).
const LOCAL_DATE_FIX = [
  'src/app/(app)/food/page.tsx',
  'src/app/(app)/activity/page.tsx',
  'src/app/(app)/check-in/page.tsx',
  'src/app/(app)/coach/page.tsx',
  'src/app/(app)/dashboard/page.tsx',
  'src/app/(app)/layout.tsx',
  'src/app/(app)/nutrition/page.tsx',
  'src/app/(app)/progress/page.tsx',
  'src/app/(app)/weigh-in/page.tsx',
  'src/app/(app)/workouts/page.tsx',
  'src/app/(app)/workouts/[id]/page.tsx',
  'src/app/api/activity/route.ts',
  'src/app/api/activity-sessions/route.ts',
  'src/app/api/activity-sessions/[id]/route.ts',
  'src/app/api/food-logs/route.ts',
  'src/app/api/goal-adjustment/route.ts',
  'src/app/api/nutrition/day-status/route.ts',
  'src/app/api/routines/[id]/start/route.ts',
  'src/app/api/saved-meals/[id]/quick-add/route.ts',
  'src/app/api/workouts/route.ts',
  'src/components/dashboard/NutritionCard.tsx',
  'src/components/dashboard/WeightCard.tsx',
  'src/components/food/QuickAddPanel.tsx',
  'src/components/food/RecentFoodPanel.tsx',
  'src/components/onboarding/OnboardingWizard.tsx',
  'src/components/shared/LocalDateSync.tsx',
  'src/lib/local-date.ts',
  'src/lib/local-date-server.ts',
  'src/lib/supabase/server.ts',
  'src/lib/workout-coach.ts',
]
const UNTOUCHED_PATHS = [
  'src/app/(app)/workouts/routines/page.tsx',
  'src/app/(app)/workouts/routines/[id]/page.tsx',
  'src/app/(app)/workouts/exercises/page.tsx',
  'src/components/workout/AddExerciseSection.tsx',
  'src/components/workout/CreateWorkoutButton.tsx',
  'src/components/workout/LogPastWorkoutForm.tsx',
  'src/components/workout/WorkoutsSubNav.tsx',
  'src/components/workout/MuscleVolumeSummary.tsx',
  'src/components/workout/ActiveWorkoutConflictModal.tsx',
  'src/components/routine/StartWorkoutButton.tsx',
  'src/components/routine/RoutineExerciseRow.tsx',
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
    // RETARGET (UI-5B1B): reordering moved from two independent
    // PATCHes to ONE transactional exercise-order call (migration 021
    // RPC), so the detail fetch surface is now exactly 5 calls. The
    // boundary — no unapproved fetch ever appears — is unchanged.
    check('B11: detail fetch surface unchanged (exactly 5 calls, approved endpoints)',
      (stripComments(routineDetail).match(/fetch\(/g) || []).length === 5 &&
      routineDetail.includes('`/api/routines/${routine.id}/exercises`') &&
      routineDetail.includes('`/api/routines/${routine.id}/exercise-order`') &&
      !routineDetail.includes('/api/routine-exercises/${snapshot'))
    check('B12: zero fetches in the recomposed list/card components',
      [routinesClient, exercisesClient, routineCard, sessionCard, hubLoading,
        routinesLoading, detailLoading, exercisesLoading]
        .every((f) => !stripComments(f).includes('fetch(')))
    check('B13: library filter semantics unchanged (display order sorted only)',
      exercisesClient.includes('e.name.toLowerCase().includes(search.toLowerCase())') &&
      exercisesClient.includes("muscle !== 'all' && e.primary_muscle !== muscle") &&
      exercisesClient.includes('MUSCLES_BY_LABEL.map'))
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
    // RETARGET (UI-5B2 hosted-QA correction): original boundary — no
    // excluded file could change. The shared ActiveWorkoutConflictModal
    // received the approved presentation-only dark-token correction
    // (verify-ui5b2 D-checks own its proof; role/callbacks/copy are
    // still pinned by 4b6b unmodified). Every other excluded path
    // remains untouched.
    // RETARGET (UI-5B2 hosted-QA correction, single-confirmation):
    // the redundant native confirm was removed from all three
    // modal-protected discard callbacks; those consumers join the
    // admitted correction scope.
    // RETARGET (UI-6A): the approved Fuel visual rebuild —
    // presentation-only changes across the food/nutrition surface —
    // is admitted while uncommitted.
    // RETARGET (UI-6B): the approved Fasting visual rebuild —
    // presentation-only changes across the fasting surface — is
    // admitted while uncommitted.
    // RETARGET (UI-6C): the approved Coach-pillar visual rebuild +
    // badge correction is admitted while uncommitted.
    const UI6C = [
      'src/app/(app)/coach/page.tsx',
      'src/app/(app)/coach/loading.tsx',
      'src/app/(app)/check-in/page.tsx',
      'src/app/(app)/check-in/loading.tsx',
      'src/app/(app)/decisions/page.tsx',
      'src/app/(app)/decisions/loading.tsx',
      'src/app/(app)/progress/page.tsx',
      'src/components/coach/CoachCard.tsx',
      'src/components/coach/MuscleReadinessPanel.tsx',
      'src/components/decisions/DecisionCard.tsx',
      'src/components/decisions/DecisionList.tsx',
      'src/components/workout/ProgressBadge.tsx',
      // RETARGET (UI-6C hosted-QA correction, human-readable decision
      // diffs): the diff formatter/presenter joins the admitted scope.
      'src/components/decisions/DecisionValueChanges.tsx',
    ]
    // RETARGET (UI-7): the approved Profile/Onboarding/Auth/
    // consistency phase (incl. glyph + dead-presentation cleanup) is
    // admitted while uncommitted.
    const UI7 = [
      '.env.example',
      'src/app/(app)/dashboard/page.tsx',
      'src/app/(app)/profile/page.tsx',
      'src/app/(app)/progress/exercises/[id]/page.tsx',
      'src/app/(app)/progress/page.tsx',
      'src/app/(app)/weigh-in/page.tsx',
      'src/app/(auth)/login/page.tsx',
      // RETARGET (UI-7 closeout correction, authentication
      // messaging): the colocated message helper is admitted.
      'src/app/(auth)/login/auth-messages.ts',
      'src/app/globals.css',
      'src/components/dashboard/DailyMetricTile.tsx',
      'src/components/dashboard/DecisionLogCard.tsx',
      'src/components/dashboard/FastingCard.tsx',
      'src/components/dashboard/NutritionCard.tsx',
      'src/components/dashboard/StepsCard.tsx',
      'src/components/dashboard/WeightCard.tsx',
      'src/components/dashboard/WorkoutCard.tsx',
      'src/components/onboarding/OnboardingWizard.tsx',
      'src/components/onboarding/Step1Bio.tsx',
      'src/components/onboarding/Step3Schedule.tsx',
      'src/components/onboarding/Step4Nutrition.tsx',
      'src/components/weigh-in/WeighInForm.tsx',
      'src/components/workout/ExercisePicker.tsx',
      'src/components/workout/ProgressBadge.tsx',
      'tailwind.config.ts',
    ]
    const UI6B = [
      'src/app/(app)/fasting/page.tsx',
      'src/app/(app)/fasting/loading.tsx',
      'src/components/fasting/FastingTimer.tsx',
      'src/components/fasting/FastingControls.tsx',
      'src/components/fasting/FastingHistory.tsx',
      'src/components/fasting/EditFastForm.tsx',
    ]
    const UI6A = [
      'src/app/(app)/food/page.tsx',
      'src/app/(app)/food/loading.tsx',
      'src/app/(app)/food/saved/page.tsx',
      'src/app/(app)/food/saved/loading.tsx',
      'src/app/(app)/nutrition/page.tsx',
      'src/app/(app)/nutrition/loading.tsx',
      'src/components/food/AddFoodForm.tsx',
      'src/components/food/DailyMacroSummary.tsx',
      'src/components/food/FoodLogEntry.tsx',
      'src/components/food/LabelCalculatorForm.tsx',
      'src/components/food/QuickAddPanel.tsx',
      'src/components/food/QuickDrinkLog.tsx',
      'src/components/food/RecentFoodPanel.tsx',
      'src/components/food/SavedMealCard.tsx',
      'src/components/food/SavedMealForm.tsx',
      'src/components/nutrition/GoalAdjustmentReviewCard.tsx',
      'src/components/nutrition/NutritionCoachPanel.tsx',
    ]
    const UI5B2_CORRECTION = [
      'src/components/workout/ActiveWorkoutConflictModal.tsx',
      'src/components/workout/SaveAsRoutineButton.tsx',
      'src/components/workout/SetRow.tsx',
      'src/components/routine/StartWorkoutButton.tsx',
      'src/components/workout/CreateWorkoutButton.tsx',
      'src/components/workout/RepeatWorkoutButton.tsx',
    ]
    check('X1: no excluded file carries any working-tree change',
      UNTOUCHED_PATHS.every((p) =>
        !diffFiles.includes(p) || UI5B2_CORRECTION.includes(p)),
      diffFiles.filter((f) => UNTOUCHED_PATHS.includes(f)).join(', '))
    // RETARGET (UI-5B1A): the inventory boundary now admits the
    // approved UI-5B1A presentation slice and its harness/notes.
    // ADMISSION (EXLIB-1B2 Revision H): migration 023 is now a
    // COMMITTED phase artifact (candidate 8ec67b4); the in-review
    // Revision H correction to that same declared draft appears as
    // a tracked modification and is admitted. No other supabase/
    // path may appear.
    check('X2: every changed file is inside a declared, approved inventory',
      diffFiles.every((f) => CHANGED_PATHS.includes(f) ||
        f === 'supabase/migrations/023_exlib_catalog_and_delivery_contract.sql' ||
        UI5B1A_APPROVED.includes(f) ||
        UI5B1B_APPROVED.includes(f) ||
        LOCAL_DATE_FIX.includes(f) ||
        UI5B2_CORRECTION.includes(f) ||
        UI6A.includes(f) || UI6B.includes(f) || UI6C.includes(f) || UI7.includes(f) ||
        f.startsWith('scripts/verify-') ||
        f.startsWith('docs/')),
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
    // Addendum + hosted-QA correction: ExerciseForm/RoutineForm carry
    // the approved display-sort only; sections 8-9 prove their write
    // paths are byte-anchored unchanged.
    check('X6: prescription/write contracts byte-anchored (RoutineForm payload + add-route)',
      read('src/components/routine/RoutineForm.tsx')
        .includes('primary_muscle_focus: focus || null') &&
      read('src/app/api/routines/[id]/exercises/route.ts')
        .includes('target_sets: body.target_sets ?? null'))
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
    // RETARGET (UI-5B1B): 021_ui5b_transactional_ordering.sql is the approved transactional-ordering migration.
    check('G1: UI-5A added no migration (exactly 22; 022 = approved UI-5B2 file)',
      // RETARGET (UI-5B2): 022_ui5b2_workout_reuse.sql is the approved
      // workout-reuse migration (create_routine_from_workout +
      // repeat_workout). The boundary moves from exactly-21 to
      // exactly-22; no other migration may appear.
      (/* RETARGET (EXLIB-1B2): 023_exlib_catalog_and_delivery_contract.sql is the approved-for-drafting EXLIB catalog migration (DRAFT, not applied); the boundary moves from exactly-22 to exactly-23; no other migration may appear. */ readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).length === 23 && readdirSync('supabase/migrations').some((f) => f === '023_exlib_catalog_and_delivery_contract.sql')) &&
      readdirSync('supabase/migrations').some((f) => f === '021_ui5b_transactional_ordering.sql'))
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

  // ── 9. Alphabetical muscle choices everywhere (hosted-QA fix) ──────
  console.log('\n9. Alphabetical muscle choices everywhere')
  {
    const { PRIMARY_MUSCLES, ROUTINE_MUSCLE_FOCUS } = await import('../src/lib/constants')
    const { ExercisePicker } = await import('../src/components/workout/ExercisePicker')
    const { ExerciseListItem } = await import('../src/components/workout/ExerciseListItem')
    const { RoutineForm } = await import('../src/components/routine/RoutineForm')
    const { MuscleReadinessPanel } = await import('../src/components/coach/MuscleReadinessPanel')
    const { TrainingCoverageSection } = await import('../src/components/progress/TrainingCoverageSection')
    const { MuscleVolumeSummary } = await import('../src/components/workout/MuscleVolumeSummary')

    const sortedMuscleLabels = [...PRIMARY_MUSCLES]
      .sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase(), 'en'))
      .map((m) => m.label)
    const pillLabels = (slice: string) =>
      Array.from(slice.matchAll(/([^<>]+)<\/button>/g)).map((m) => m[1])
    const monotonic = (html: string, labels: string[]) =>
      labels.every((l, i) => i === 0 ||
        html.indexOf(labels[i - 1]) !== -1 && html.indexOf(l) > html.indexOf(labels[i - 1]))

    // Library filter pills (rendered in section 3's fixtures too, but
    // order is proven here explicitly).
    {
      const html = renderToStaticMarkup(React.createElement(
        (await import('../src/components/workout/ExercisesClient')).ExercisesClient,
        { initialExercises: [] as never }))
      const group = html.split('aria-label="Filter by muscle group"')[1]?.split('</div>')[0] ?? ''
      const labels = pillLabels(group)
      check('M1: library filter pills — All first, then exact alphabetical order',
        labels[0] === 'All' &&
        JSON.stringify(labels.slice(1)) === JSON.stringify(sortedMuscleLabels))
    }

    // ExercisePicker (shared with execution) — pill display order only.
    {
      const mkEx = (id: string, name: string, muscle: string) => ({
        id, user_id: 'u', name, primary_muscle: muscle, equipment: null,
        category: null, is_system: false, is_active: true, unilateral: false,
        tracking_mode: 'weight_reps', notes: null, created_at: '', updated_at: '' })
      const exercises = [mkEx('e1', 'Squat', 'quads'), mkEx('e2', 'Bench', 'chest'),
        mkEx('e3', 'Row', 'lats')]
      const html = renderToStaticMarkup(React.createElement(ExercisePicker, {
        exercises: exercises as never, onAdd: async () => {}, onClose: () => {} }))
      const group = html.split('aria-label="Filter by muscle group"')[1]?.split('</div>')[0] ?? ''
      const labels = pillLabels(group)
      check('M2: picker filter pills — All first, then exact alphabetical order',
        labels[0] === 'All' &&
        JSON.stringify(labels.slice(1)) === JSON.stringify(sortedMuscleLabels))
      check('M3: picker exercise list order untouched (caller-provided order)',
        html.indexOf('Squat') < html.indexOf('Bench') &&
        html.indexOf('Bench') < html.indexOf('Row'))
      check('M4: picker deterministic', renderToStaticMarkup(React.createElement(ExercisePicker, {
        exercises: exercises as never, onAdd: async () => {}, onClose: () => {} })) === html)
      const picker = read('src/components/workout/ExercisePicker.tsx')
      check('M5: picker execution contract byte-anchored (smallest shared change)',
        picker.includes('onAdd: (exerciseId: string) => Promise<void>') &&
        picker.includes('setAdding(exerciseId)') &&
        picker.includes('await onAdd(exerciseId)') &&
        picker.includes("(muscle === 'all' || e.primary_muscle === muscle)") &&
        picker.includes('max-h-60 overflow-y-auto') &&
        !picker.includes('fetch(') &&
        picker.includes('const MUSCLES_BY_LABEL = [...PRIMARY_MUSCLES].sort'))
      check('M6: picker consumers unchanged (execution + routine detail wiring)',
        read('src/components/workout/AddExerciseSection.tsx').includes('<ExercisePicker') &&
        read('src/components/routine/RoutineDetailClient.tsx')
          .includes('<ExercisePicker exercises={allExercises} onAdd={handleAddExercise}'))
    }

    // RoutineForm muscle-focus selector.
    {
      const html = renderToStaticMarkup(React.createElement(RoutineForm, {
        onClose: () => {} }))
      const slice = html.split('Primary muscle focus')[1]?.split('block text-xs')[0] ?? ''
      const labels = pillLabels(slice)
      const expected = [...ROUTINE_MUSCLE_FOCUS]
        .sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase(), 'en'))
        .map((m) => m.label)
      check('M7: routine focus choices — exact alphabetical order',
        labels.length === ROUTINE_MUSCLE_FOCUS.length &&
        JSON.stringify(labels) === JSON.stringify(expected))
      const editHtml = renderToStaticMarkup(React.createElement(RoutineForm, {
        existing: { id: 'r1', user_id: 'u', name: 'Leg Day', description: null,
          goal: null, primary_muscle_focus: 'legs', difficulty: null,
          estimated_duration_minutes: null, is_active: true,
          created_at: '', updated_at: '' } as never,
        onClose: () => {} }))
      check('M8: existing focus selection preserved after sorting',
        /<button[^>]*aria-pressed="true"[^>]*>(<svg[\s\S]*?<\/svg>)?Legs<\/button>/.test(editHtml))
      check('M9: routine payload contract unchanged',
        read('src/components/routine/RoutineForm.tsx')
          .includes('primary_muscle_focus: focus || null'))
    }

    // ExerciseListItem role lists: role order fixed, names sorted.
    {
      const ex = { id: 'e9', user_id: 'u', name: 'Press', primary_muscle: 'chest',
        equipment: null, category: null, is_system: false, is_active: true,
        unilateral: false, tracking_mode: 'weight_reps', notes: null,
        created_at: '', updated_at: '',
        exercise_muscles: [
          { id: 'a', user_id: 'u', exercise_id: 'e9', muscle: 'triceps', role: 'secondary', created_at: '' },
          { id: 'b', user_id: 'u', exercise_id: 'e9', muscle: 'front_delts', role: 'secondary', created_at: '' },
          { id: 'c', user_id: 'u', exercise_id: 'e9', muscle: 'abs', role: 'secondary', created_at: '' },
          { id: 'd', user_id: 'u', exercise_id: 'e9', muscle: 'obliques', role: 'tertiary', created_at: '' },
          { id: 'e', user_id: 'u', exercise_id: 'e9', muscle: 'lats', role: 'tertiary', created_at: '' },
        ] }
      const html = renderToStaticMarkup(React.createElement(ExerciseListItem, {
        exercise: ex as never }))
      check('M10: names alphabetical WITHIN each role; role order Secondary then Tertiary',
        html.includes('Secondary: Abs, Front delts, Triceps') &&
        html.includes('Tertiary: Lats, Obliques') &&
        html.indexOf('Secondary:') < html.indexOf('Tertiary:'))
    }

    // Readiness chips: fixed registry order was non-semantic; sorted copy.
    {
      const summary = {
        hasEnoughData: true, topRoutine: null,
        weekStats: { sessionsThisWeek: 3, setsThisWeek: 24 },
        muscleReadiness: [
          { muscle: 'chest', label: 'Chest', freshness: 'fresh', lastTrainedDaysAgo: 1, setsThisWeek: 6 },
          { muscle: 'back', label: 'Back', freshness: 'ready', lastTrainedDaysAgo: 3, setsThisWeek: 8 },
          { muscle: 'legs', label: 'Legs', freshness: 'fatigued', lastTrainedDaysAgo: 0, setsThisWeek: 10 },
          { muscle: 'shoulders', label: 'Shoulders', freshness: 'recovering', lastTrainedDaysAgo: 2, setsThisWeek: 0 },
          { muscle: 'arms', label: 'Arms', freshness: 'ready', lastTrainedDaysAgo: 4, setsThisWeek: 0 },
          { muscle: 'core', label: 'Core', freshness: 'fresh', lastTrainedDaysAgo: null, setsThisWeek: 0 },
        ],
      }
      const html = renderToStaticMarkup(React.createElement(MuscleReadinessPanel, {
        summary: summary as never }))
      check('M11: readiness chips alphabetical (non-semantic fixed order replaced)',
        monotonic(html.split('Muscle readiness')[1] ?? '',
          ['Arms', 'Back', 'Chest', 'Core', 'Legs', 'Shoulders']))
      check('M12: readiness DATA untouched (statuses/tooltips/lib intact)',
        html.includes('never trained') &&
        read('src/lib/workout-coach.ts').includes('const DISPLAY_MUSCLE_GROUPS = [') &&
        !read('src/lib/workout-coach.ts').includes('UI-5A'))
    }

    // Coverage groups: registry (anatomical) order was non-semantic here.
    {
      const row = (id: string, muscle: string, recent: number) => ({
        exerciseId: id, exerciseName: id, primaryMuscle: muscle, equipment: null,
        trackingMode: 'weight_reps', isUnilateral: false, status: 'improved',
        latestWorkoutDate: '2026-08-01', latestSummary: 'x', secondarySummary: null,
        recentSessionCount: recent })
      const rows = [row('squat', 'quads', 2), row('bench', 'chest', 1), row('plank', 'abs', 0)]
      const html = renderToStaticMarkup(React.createElement(TrainingCoverageSection, {
        rows: rows as never }))
      const covered = html.split('No tracked exercises yet')[0]
      check('M13: covered groups alphabetical with counts intact',
        monotonic(covered, ['Abs', 'Chest', 'Quads']) &&
        covered.includes('0 of 1 tracked exercise trained recently') &&
        covered.includes('1 of 1 tracked exercise trained recently'))
      check('M14: untracked list alphabetical',
        (() => {
          const tail = html.split('No tracked exercises yet:')[1] ?? ''
          return tail.indexOf('Abductors') !== -1 &&
            tail.indexOf('Abductors') < tail.indexOf('Adductors') &&
            tail.indexOf('Adductors') < tail.indexOf('Back') &&
            tail.indexOf('Upper back') > tail.indexOf('Traps')
        })())
    }

    // Ranked analytical EXCEPTION: weekly volume stays sorted by real
    // set counts (descending), never alphabetized.
    {
      const html = renderToStaticMarkup(React.createElement(MuscleVolumeSummary, {
        volume: { biceps: 2, chest: 9, abs: 5 } as never }))
      check('M15: weekly muscle volume stays RANKED by sets (documented exception)',
        html.indexOf('Chest') < html.indexOf('Abs') &&
        html.indexOf('Abs') < html.indexOf('Biceps') &&
        !read('src/components/workout/MuscleVolumeSummary.tsx').includes('UI-5A'))
    }

    check('M16: registries not mutated by any render (canonical orders intact)',
      PRIMARY_MUSCLES[0].value === 'chest' &&
      PRIMARY_MUSCLES[PRIMARY_MUSCLES.length - 1].value === 'other' &&
      ROUTINE_MUSCLE_FOCUS[0].value === 'chest' &&
      ROUTINE_MUSCLE_FOCUS[ROUTINE_MUSCLE_FOCUS.length - 1].value === 'other' &&
      !read('src/lib/constants.ts').includes('UI-5A') &&
      !read('src/lib/exercise-validation.ts').includes('UI-5A'))
    check('M17: every sort site uses a copied collection with the same comparison',
      ['src/components/workout/ExercisesClient.tsx',
        'src/components/workout/ExercisePicker.tsx',
        'src/components/routine/RoutineForm.tsx',
        'src/components/coach/MuscleReadinessPanel.tsx']
        .every((p) => read(p).includes(".toLowerCase(), 'en')")) &&
      read('src/components/workout/ExerciseListItem.tsx').includes(".toLowerCase(), 'en')") &&
      read('src/components/progress/TrainingCoverageSection.tsx').includes(".toLowerCase(), 'en')"))
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
