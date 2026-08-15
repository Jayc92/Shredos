// ============================================================
// ForgeFitOS — Phase 4B.6B deterministic verification harness
// Verifies the active-workout-detail redesign (/workouts/[id]):
// state-driven session header, exercise blocks, notes, completion
// summary, add-exercise, loading geometry — and, critically, that
// every execution behavior (set entry, tracking modes, warm-up,
// complete/skip/reopen, conflict guard, API calls) is byte-anchored
// unchanged, with SetRow deliberately untouched.
// Run from the repository root:
//   npx tsx scripts/verify-phase4b6b.ts
// ============================================================

import { readFileSync, existsSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

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

const page = read('src/app/(app)/workouts/[id]/page.tsx')
const loading = read('src/app/(app)/workouts/[id]/loading.tsx')
const client = read('src/components/workout/WorkoutDetailClient.tsx')
const header = read('src/components/workout/SessionHeader.tsx')
const block = read('src/components/workout/WorkoutExerciseBlock.tsx')
const setRow = read('src/components/workout/SetRow.tsx')
const sessionNotes = read('src/components/workout/WorkoutSessionNotes.tsx')
const summaryCard = read('src/components/workout/WorkoutCompletionSummaryCard.tsx')
const addSection = read('src/components/workout/AddExerciseSection.tsx')
const picker = read('src/components/workout/ExercisePicker.tsx')
const conflictModal = read('src/components/workout/ActiveWorkoutConflictModal.tsx')
const historyRows = read('src/components/workout/ExerciseHistoryRows.tsx')
const notes = read('docs/phase4b6b-active-workout-notes.md')

const CHANGED = [page, loading, client, header, block, sessionNotes, summaryCard, addSection]

// ── 1. Checkpoint and route ──────────────────────────────────────────
console.log('\n1. Checkpoint and route')
{
  check('checkpoint artifacts exist (139930e tree)',
    ['scripts/verify-phase4b6a.ts', 'docs/phase4b6a-train-hubs-notes.md',
      'src/components/workout/WorkoutsSubNav.tsx',
      'supabase/migrations/013_phase3e_goal_adjustments.sql']
      .every((f) => existsSync(f)))
  check('all prior notes exist',
    ['phase4a-ux-information-architecture-audit', 'phase4b1-foundation-notes',
      'phase4b2-navigation-notes', 'phase4b3-today-notes', 'phase4b4-coach-pillar-notes',
      'phase4b5-progress-pillar-notes', 'phase4b6a-train-hubs-notes']
      .every((f) => existsSync(`docs/${f}.md`)))
  check('4B.6B notes exist', notes.length > 1500)
  check('route retained', existsSync('src/app/(app)/workouts/[id]/page.tsx'))
  check('no aliases/redirects',
    !existsSync('src/app/(app)/workout') && !read('next.config.mjs').includes('redirects'))
  check('auth gate preserved', page.includes("redirect('/login')"))
  check('onboarding gate preserved', page.includes("redirect('/onboarding')"))
  check('ownership + notFound preserved',
    page.includes('fetchSessionWithDetails(supabase, user.id, params.id)') &&
    page.includes('if (!session) notFound()'))
  check('metadata unchanged', page.includes("title: 'Workout' }"))
  check('one H1 (the workout title in SessionHeader)',
    (header.match(/<h1/g) || []).length === 2 && // done + view branches
    !page.includes('<h1') && !client.includes('<h1') && !loading.includes('<h1'))
}

// ── 2. Route contract ────────────────────────────────────────────────
console.log('\n2. Route contract')
{
  const FETCHES = ['fetchPreviousBests(supabase, user.id, exerciseIds, params.id)',
    'fetchExerciseTrends(supabase, user.id, exerciseIds)',
    'fetchExerciseHistory(supabase, user.id, exerciseIds, params.id)',
    'fetchExercisePRBaseline(supabase, user.id, exerciseIds, params.id)']
  for (const f of FETCHES) {
    check(`parallel fetch preserved: ${f.split('(')[0]}`, page.includes(f))
  }
  check('active-exercise list query unchanged',
    page.includes(".eq('is_active', true)") &&
    page.includes(".order('primary_muscle')"))
  check('server page remains server-rendered', !page.includes("'use client'"))
  check('client island unchanged (props contract)',
    page.includes('<WorkoutDetailClient') &&
    ['session={session}', 'exercises={exercises}', 'previousBests={previousBests}',
      'exerciseTrends={exerciseTrends}', 'prBaseline={prBaseline}']
      .every((prop) => page.includes(prop)))
  check('Train subnav rendered; Workouts stays active (route-aware matcher)',
    page.includes('<WorkoutsSubNav />') &&
    read('src/components/workout/WorkoutsSubNav.tsx').includes("pathname.startsWith(href + '/')"))
  // RETARGET (UI-5B1A): the text-glyph arrow became a decorative
  // lucide ChevronLeft; the back link itself (real Link to /workouts)
  // is unchanged and now also pinned by icon + label.
  check('back link retained (lucide chevron, real link)',
    page.includes('href="/workouts"') &&
    page.includes('<ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />') &&
    !page.includes('\u2190 Workouts'))
  check('no writes on the server page', !page.includes('.insert(') && !page.includes('.update('))
}

// ── 3. Workout states ────────────────────────────────────────────────
console.log('\n3. Workout states')
{
  check('state flags derived exactly as before',
    header.includes("session.status === 'in_progress'") &&
    header.includes("session.status === 'completed'"))
  check('state-driven header variant (action/elevated/subtle)',
    header.includes("variant={isActive ? 'action' : isDone ? 'elevated' : 'subtle'}"))
  check('status pill text via the shared provenance-aware helper (never color-only)',
    header.includes('{workoutStatusLabel(session)}'))
  check('status pill semantic tokens',
    header.includes('bg-success-subtle text-success') &&
    header.includes('bg-caution-subtle text-caution') &&
    header.includes('bg-surface-sunken text-ink-muted'))
  check('read-only lock derived exactly as before',
    client.includes("const readOnly = session.status === 'completed'"))
  check('completion summary computed only for completed',
    client.includes("session.status === 'completed' ? summarizeWorkout(exercises, prBaseline ?? {}) : null"))
  check('add-exercise hidden when read-only',
    client.includes('{!readOnly && <AddExerciseSection'))
  check('complete endpoint unchanged',
    header.includes('`/api/workouts/${session.id}/complete`'))
  check('reopen endpoint + confirm unchanged',
    header.includes('`/api/workouts/${session.id}/reopen`') &&
    header.includes('Reopen this workout for editing?'))
  check('delete confirm copy per state unchanged',
    header.includes('Delete this in-progress workout?') &&
    header.includes('Delete this workout? This cannot be undone.'))
  check('Complete is primary brand, 44px, not celebratory',
    header.includes('bg-brand text-brand-foreground') && header.includes('min-h-11') &&
    header.includes("'Complete workout'") && !/great job|well done/i.test(header))
  check('Reopen is bordered neutral, 44px',
    header.includes('border border-edge text-ink-muted') &&
    header.includes("'Reopen workout'"))
  check('deleted state card + redirect preserved',
    client.includes('Workout deleted.') && client.includes("router.replace('/workouts')"))
  check('no state conflation (skip stays distinct from completed)',
    header.includes("isDone ? 'elevated' : 'subtle'"))
}

// ── 4. Set contract (SetRow deliberately untouched) ──────────────────
console.log('\n4. Set contract')
{
  check('SetRow untouched: PATCH endpoint',
    setRow.includes('`/api/workout-sets/${set.id}`'))
  check('SetRow untouched: completion + warm-up state',
    setRow.includes('useState(set.completed)') && setRow.includes('useState(set.is_warmup)'))
  check('SetRow untouched: duration minutes/seconds derivation',
    setRow.includes('Math.floor(set.duration_seconds / 60)') &&
    setRow.includes('set.duration_seconds % 60'))
  check('SetRow untouched: distance meters↔miles conversion',
    setRow.includes('METERS_PER_MILE'))
  check('SetRow untouched: duration-clear semantics',
    setRow.includes('await patch({ duration_seconds: null })'))
  check('SetRow untouched: no new auto-advance or gestures',
    !setRow.includes('onSwipe') && !setRow.includes('autoAdvance') &&
    !setRow.includes('focusNext'))
  check('SetRow presentation deferral documented',
    notes.includes('SetRow') && notes.includes('deliberately not touched'))
  check('add-set flow unchanged in the block',
    block.includes('async function handleAddSet') &&
    block.includes('`/api/workout-exercises/${we.id}/sets`'))
  check('remove-exercise flow unchanged',
    block.includes('`/api/workout-exercises/${we.id}`, { method: \'DELETE\' }'))
}

// ── 5. Exercise block contract ───────────────────────────────────────
console.log('\n5. Exercise block')
{
  check('block is one default Card per exercise',
    block.includes('variant="default"'))
  check('expand/collapse header preserved',
    block.includes('onClick={() => setOpen(!open)}') &&
    block.includes('<ChevronDown') && block.includes('<ChevronRight'))
  check('trend labels via existing lib maps (untouched classes)',
    block.includes('TREND_LABEL') && block.includes('TREND_CLS'))
  check('metadata line preserved (muscle · equipment · sets done)',
    block.includes('we.exercise.primary_muscle.charAt(0).toUpperCase()') &&
    block.includes('sets done'))
  check('per-side suffix preserved', block.includes('(per side)'))
  check('long names handled (min-w-0 truncation context)',
    block.includes('min-w-0'))
  check('no giant tinted fills on the block',
    !block.includes('variant="action"') && !block.includes('bg-brand '))
  check('no card-as-button wrapper (expand button is inside)',
    !block.match(/<Card[^>]*onClick/))
  check('history context subordinate (ExerciseHistoryRows untouched)',
    historyRows.includes('ExerciseHistoryRows') &&
    block.includes('ExerciseHistoryRows'))
}

// ── 6. Notes contract ────────────────────────────────────────────────
console.log('\n6. Notes contract')
{
  check('manual save/cancel semantics unchanged (no autosave)',
    sessionNotes.includes('Manual Save/Cancel only') &&
    !sessionNotes.includes('debounce') && !sessionNotes.includes('setInterval'))
  check('PATCH endpoint unchanged',
    sessionNotes.includes('`/api/workouts/${sessionId}`'))
  check('editable only in progress',
    sessionNotes.includes("const isEditable = status === 'in_progress'"))
  check('2000-char limit + live counter preserved',
    sessionNotes.includes('NOTES_MAX_LENGTH = 2000') &&
    sessionNotes.includes('{draft.length} / {NOTES_MAX_LENGTH}') &&
    sessionNotes.includes('aria-live="polite"'))
  check('empty read-only renders nothing',
    sessionNotes.includes('return null'))
  check('textarea labeled', sessionNotes.includes('htmlFor="workout-notes-textarea"'))
  check('error retention preserved',
    sessionNotes.includes('Could not save workout notes. Please try again.'))
  check('three states in default Cards, no shred-card',
    (sessionNotes.match(/variant="default"/g) || []).length === 3 &&
    !sessionNotes.includes('shred-card'))
}

// ── 7. Completion summary ────────────────────────────────────────────
console.log('\n7. Completion summary')
{
  check('renders precomputed summary only (no fetch/eval)',
    !summaryCard.includes('fetch(') && summaryCard.includes('WorkoutCompletionSummary'))
  check('values unchanged (exercises, working sets, PR sets)',
    summaryCard.includes('{summary.completedExerciseCount} of {summary.exerciseCount} exercises') &&
    summaryCard.includes('{summary.workingSetCount} working sets') &&
    summaryCard.includes('PR set'))
  check('target execution + effort sections preserved',
    summaryCard.includes('Target execution') && summaryCard.includes('Average RPE'))
  check('highlights/attention lists preserved',
    summaryCard.includes('summary.highlights.map') && summaryCard.includes('summary.attention.map'))
  check('elevated Card, factual heading, no celebration framing',
    summaryCard.includes('variant="elevated"') &&
    summaryCard.includes('Workout complete') &&
    !/congratulations|amazing|crushed/i.test(summaryCard))
  check('no invented metrics (no calories/score/rank/streak)',
    !/calorie|score|rank|streak/i.test(stripComments(summaryCard)))
}

// ── 8. Add exercise + picker + conflict modal ────────────────────────
console.log('\n8. Add exercise, picker, conflict modal')
{
  check('POST endpoint unchanged',
    addSection.includes('`/api/workouts/${workoutId}/exercises`'))
  check('open/close toggle preserved',
    addSection.includes('useState(false)') && addSection.includes('onClose={() => setOpen(false)}'))
  check('dashed 44px affordance (no shred-card)',
    addSection.includes('border-dashed') && addSection.includes('min-h-11') &&
    !addSection.includes('shred-card'))
  check('picker migration preserved unmodified (4B.6A state)',
    picker.includes('variant="default"') && picker.includes('max-h-60 overflow-y-auto') &&
    !picker.includes('fetch('))
  check('conflict modal untouched: dialog semantics + choices',
    conflictModal.includes('role="dialog"') &&
    conflictModal.includes('onDiscardAndRetry') &&
    conflictModal.includes('Discard existing workout and start new'))
  check('conflict copy preserved',
    conflictModal.includes('Resume it, or discard it to start a new one.'))
}

// ── 9. Legacy style removal ──────────────────────────────────────────
console.log('\n9. Legacy style removal')
{
  check('zero shred-card in active 4B.6B route scope',
    CHANGED.every((f) => !stripComments(f).includes('shred-card')))
  check('global alias retained', read('src/app/globals.css').includes('.shred-card'))
  check('semantic tokens adopted',
    [client, header, block, sessionNotes, summaryCard].every((f) =>
      f.includes('text-ink-muted')))
  check('remaining occurrences are future-scope only (Fuel/Profile/Onboarding)',
    (() => {
      const offenders: string[] = []
      const walk = (dir: string) => {
        for (const entry of readdirSync(dir)) {
          const full = join(dir, entry)
          if (statSync(full).isDirectory()) { walk(full); continue }
          if (!/\.(tsx|ts)$/.test(entry)) continue
          if (stripComments(read(full)).includes('shred-card')) offenders.push(full)
        }
      }
      walk('src/app')
      walk('src/components')
      return offenders.every((f) =>
        f.includes('/food/') || f.includes('/nutrition/') || f.includes('profile') ||
        f.includes('onboarding'))
    })())
}

// ── 10. Loading state ────────────────────────────────────────────────
console.log('\n10. Loading state')
{
  check('loading file exists', existsSync('src/app/(app)/workouts/[id]/loading.tsx'))
  check('skeleton primitives', loading.includes("from '@/components/ui/skeleton'"))
  check('geometry: back link + subnav + header + two blocks + notes + add strip',
    loading.includes('w-24') && loading.includes('h-9 w-72') &&
    (loading.match(/h-40/g) || []).length === 2 &&
    loading.includes('h-12 w-full rounded-xl'))
  check('no spinner/fake text/shred-card',
    !loading.includes('animate-spin') && !loading.includes('Loading...') &&
    !loading.includes('shred-card'))
  check('aria-hidden + width matches page',
    loading.includes('aria-hidden="true"') && loading.includes('max-w-3xl'))
  check('no viewport traps or nested scrollers',
    !loading.includes('h-screen') && !loading.includes('overflow-y'))
}

// ── 11. Responsive and scroll ownership ──────────────────────────────
console.log('\n11. Responsive')
{
  check('no md: shell leakage', CHANGED.every((f) => !stripComments(f).includes('md:')))
  check('page padding aligned with shell', page.includes('p-4 lg:p-6'))
  check('one-column route (no multi-column grid introduced)',
    !page.includes('lg:grid-cols') && !client.includes('lg:grid-cols'))
  check('controls wrap (header meta + summary rows)',
    header.includes('flex-wrap') && summaryCard.includes('flex-wrap'))
  check('no fixed-width traps introduced',
    CHANGED.every((f) => !f.match(/w-\[\d+px\]/)))
  check('no route-level scrollers (picker bounded list is the only one)',
    CHANGED.every((f) => !stripComments(f).includes('overflow-y')) &&
    picker.includes('max-h-60 overflow-y-auto'))
  check('shell remains sole main scroll owner',
    read('src/app/(app)/layout.tsx').includes('<main className="flex-1 overflow-y-auto'))
  check('no absolute core layout',
    [page, client].every((f) => !stripComments(f).includes('absolute')))
}

// ── 12. Accessibility ────────────────────────────────────────────────
console.log('\n12. Accessibility')
{
  check('section headings are h2 (notes/summary)',
    sessionNotes.includes('<h2') && summaryCard.includes('<h2'))
  check('title editor keeps its label + counter + live region',
    header.includes('aria-label="Workout title"') &&
    header.includes('{title.length} / {TITLE_MAX_LENGTH}'))
  check('icon-only controls labeled',
    header.includes('aria-label="Delete workout session"') &&
    header.includes('aria-label="Save title"') &&
    header.includes('aria-label="Cancel editing title"'))
  check('links remain links, buttons remain buttons',
    CHANGED.every((f) => !f.match(/<div[^>]*onClick/)))
  check('no tabindex hacks', CHANGED.every((f) => !f.toLowerCase().includes('tabindex')))
  check('warm-up/completed conveyed by SetRow text (untouched)',
    setRow.includes('Warm-up') || setRow.includes('warm'))
  check('no focus suppression added',
    [page, client, addSection].every((f) => !f.includes('outline-none')))
  check('no fake WCAG claim',
    !/WCAG\s+2[.\d]*\s+(AA\s+)?compliant/i.test(notes) &&
    notes.includes('Not a WCAG claim'))
}

// ── 13. Language and icons ───────────────────────────────────────────
console.log('\n13. Language and icons')
{
  check('no emoji in scope', CHANGED.every((f) => !EMOJI.test(f)))
  check('no emoji anywhere in src',
    (() => {
      const offenders: string[] = []
      const walk = (dir: string) => {
        for (const entry of readdirSync(dir)) {
          const full = join(dir, entry)
          if (statSync(full).isDirectory()) { walk(full); continue }
          if (!/\.(tsx|ts|css)$/.test(entry)) continue
          if (EMOJI.test(read(full))) offenders.push(full)
        }
      }
      walk('src')
      return offenders.length === 0
    })())
  check('no Sparkles', CHANGED.every((f) => !stripComments(f).includes('Sparkles')))
  check('lucide only', CHANGED.every((f) => !f.includes('heroicons') && !f.includes('react-icons')))
  check('no guilt/beast/celebration language',
    CHANGED.every((f) => !/beast mode|no excuses|crush|you failed|perfect workout|torched/i.test(f)))
  check('no medical/causal claims',
    CHANGED.every((f) => !/metabolic|hormon|because you/i.test(stripComments(f))))
  check('approved copy present',
    header.includes('Complete workout') && header.includes('Reopen workout') &&
    sessionNotes.includes('Session notes') && addSection.includes('Add exercise'))
}

// ── 14. Phase boundary ───────────────────────────────────────────────
console.log('\n14. Phase boundary')
{
  check('4B.6A routes unchanged (hub anchors)',
    read('src/app/(app)/workouts/page.tsx').includes('findActiveTrainingSession(supabase, user.id).catch(() => null)') &&
    read('src/components/routine/RoutineDetailClient.tsx').includes('<WorkoutsSubNav />'))
  check('Fuel/Profile behavior anchors intact (migrated by 4B.6C)',
    read('src/app/(app)/profile/page.tsx').includes('main_goal_changed') &&
    read('src/app/(app)/nutrition/page.tsx').includes('GoalAdjustmentReviewCard') &&
    read('src/components/food/MealSection.tsx').includes('MealSection'))
  check('Onboarding behavior anchors intact (presentation migrated by 4B.6D)',
    read('src/components/onboarding/OnboardingWizard.tsx').includes('onboarding_complete: true'))
  check('shell + navigation unchanged',
    read('src/components/layout/route-match.ts').includes('LONGEST matching href wins') &&
    read('src/app/(app)/layout.tsx').includes("select('fasting_enabled')") &&
    read('src/components/layout/Sidebar.tsx').includes('hidden lg:flex'))
  check('4B.6B added no migration (schema through 013 intact)',
    readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql') && f < '014').length === 13)
  check('workout API routes unchanged (anchors)',
    read('src/app/api/workouts/route.ts').includes('findActiveTrainingSession') &&
    read('src/app/api/workout-sets/[id]/route.ts').length > 500)
  check('no package changes',
    JSON.parse(read('package.json')).name === 'shredos' &&
    Object.keys(JSON.parse(read('package.json')).dependencies).length === 22)
  check('domain libs unchanged',
    read('src/lib/workout.ts').includes('weightKg * (1 + reps / 30)') &&
    read('src/lib/workout.ts').includes('summarizeWorkout'))
  check('dead progress-summary path untouched',
    read('src/lib/progress-summary.ts').includes("select('duration_minutes, ended_at')"))
  check('no .DS_Store', !existsSync('.DS_Store') && !existsSync('src/.DS_Store'))
}

// ── 15. Session header deep contract ─────────────────────────────────
console.log('\n15. Session header detail')
{
  check('title PATCH endpoint unchanged',
    header.includes('`/api/workouts/${session.id}`') &&
    header.includes("body: JSON.stringify({ title: trimmed })"))
  check('title length rule unchanged (100 + defensive guard)',
    header.includes('TITLE_MAX_LENGTH = 100') &&
    header.includes('trimmed.length > TITLE_MAX_LENGTH'))
  check('unchanged/empty title early-return preserved',
    header.includes("if (!trimmed || trimmed === session.title)"))
  check('Enter/Escape keyboard handling preserved',
    header.includes("if (e.key === 'Enter') saveTitle()") &&
    header.includes("if (e.key === 'Escape') handleTitleCancel()"))
  check('defensive isDone guards preserved (save + click)',
    (header.match(/if \(isDone\) return/g) || []).length === 2)
  // RETARGET (UI-5B1A): the trailing text-glyph arrow became a
  // decorative lucide ChevronRight; the origin link, copy, and href
  // are unchanged.
  check('routine-origin link preserved',
    header.includes('From: {routineName}') &&
    !header.includes('{routineName} \u2192') &&
    header.includes('`/workouts/routines/${routineId}`') &&
    header.includes('<ChevronRight className="h-3 w-3" aria-hidden="true" />'))
  check('date/duration formatting unchanged',
    header.includes("format(parseISO(session.workout_date), 'EEEE, MMMM d')") &&
    header.includes('formatWorkoutDuration(session.start_time, session.end_time, session.completed_duration_seconds)'))
  check('title edit affordance hidden when done',
    header.includes('isDone ? (') && header.includes('handleTitleClick'))
  check('error copies preserved',
    header.includes('Could not save workout title. Please try again.') &&
    header.includes('Could not save. Try again.') &&
    header.includes('Could not reopen. Try again.') &&
    header.includes('Delete failed — please try again.'))
}

// ── 16. SetRow field inventory (all byte-anchored untouched) ─────────
console.log('\n16. SetRow field inventory')
{
  check('reps state + change-only PATCH',
    setRow.includes("useState(set.reps      !== null ? String(set.reps)      : '')") &&
    setRow.includes('if (!isNaN(n) && n !== set.reps) await patch({ reps: n })'))
  check('weight display/storage split unchanged',
    setRow.includes('String(displayWeight(set.weight_kg))') &&
    setRow.includes('await patch({ weight_lbs: n })'))
  check('bodyweight added-weight collapse behavior unchanged',
    setRow.includes('addedWeightExpanded') &&
    setRow.includes('useState(set.weight_kg !== null)'))
  check('warm-up toggle PATCH unchanged',
    setRow.includes('await patch({ is_warmup: next })'))
  check('warm-up toggle shown only for weight modes',
    setRow.includes("const showWarmupToggle = trackingMode === 'weight_reps' || trackingMode === 'bodyweight'"))
  check('per-side suffix unchanged',
    setRow.includes("const weightSuffix = isUnilateral ? 'per side' : 'lbs'"))
  check('cardio distance conversion + clear semantics unchanged',
    setRow.includes('METERS_PER_MILE') &&
    setRow.includes('await patch({ distance_meters: null })'))
  check('timed duration split fields unchanged',
    setRow.includes('Math.floor(set.duration_seconds / 60)'))
  check('PR label map unchanged',
    setRow.includes("weight: 'Weight PR'") && setRow.includes("bodyweight_reps: 'Rep PR'"))
}

// ── 17. Block deep contract ──────────────────────────────────────────
console.log('\n17. Exercise block detail')
{
  check('previous-best formatting via existing lib',
    block.includes('formatPreviousBest(previousBest, we.exercise.tracking_mode)'))
  check('signal selection unchanged (tracking-aware vs legacy)',
    block.includes('trackingAwareProgressSignal(curBest, previousBest, we.exercise.tracking_mode)') &&
    block.includes('progressSignal(curBest, previousBest)'))
  check('lib evaluators untouched imports',
    ['bestSet', 'suggestNextTarget', 'evaluateSetPRs', 'evaluateSetTargetFeedback',
      'pickRepresentativeCardioSet'].every((f) => block.includes(f)))
  check('adding-set busy state preserved',
    block.includes('const [addingSet, setAddingSet] = useState(false)') &&
    block.includes('disabled={addingSet}'))
  check('readOnly prop threaded to the block', client.includes('readOnly={readOnly}') &&
    block.includes('readOnly = false'))
}

// ── 18. DOM order ────────────────────────────────────────────────────
console.log('\n18. DOM order')
{
  // RETARGET (UI-5B1A): order re-anchored on the new back-link markup
  // (the old anchor would have passed vacuously at indexOf -1).
  check('page order: back link → subnav → client',
    page.indexOf('<ChevronLeft') > 0 &&
    page.indexOf('<ChevronLeft') < page.indexOf('<WorkoutsSubNav />') &&
    page.indexOf('<WorkoutsSubNav />') < page.indexOf('<WorkoutDetailClient'))
  check('client child order preserved: summary → header → notes → blocks → add',
    client.indexOf('<WorkoutCompletionSummaryCard') < client.indexOf('<SessionHeader') &&
    client.indexOf('<SessionHeader') < client.indexOf('<WorkoutSessionNotes') &&
    client.indexOf('<WorkoutSessionNotes') < client.indexOf('<WorkoutExerciseBlock') &&
    client.indexOf('<WorkoutExerciseBlock') < client.indexOf('<AddExerciseSection'))
  check('empty-exercises card sits before blocks',
    client.indexOf('No exercises yet.') < client.indexOf('exercises.map'))
}

// ── 19. Copy anchors ─────────────────────────────────────────────────
console.log('\n19. Copy anchors')
{
  const COPIES: Array<[string, string]> = [
    ['deleted state', 'Workout deleted.'],
    ['empty exercises', 'No exercises yet. Add your first exercise below.'],
    ['notes placeholder', 'Energy, pain, substitutions, or anything to remember next time.'],
    ['notes add prompt', '+ Add session notes'],
    ['notes edit', 'Edit notes'],
    ['add exercise', 'Add exercise'],
    ['summary heading', 'Workout complete'],
  ]
  const ALLTEXT = client + sessionNotes + addSection + summaryCard
  for (const [name, copy] of COPIES) {
    check(`copy: ${name}`, ALLTEXT.includes(copy))
  }
  check('saving labels preserved',
    header.includes("'Saving…'") && sessionNotes.includes("'Saving…'") &&
    header.includes("'Reopening…'"))
  check('target-execution wording preserved',
    summaryCard.includes('below ·') && summaryCard.includes('in range'))
}

// ── 20. Collaborator detail (untouched files, deeper anchors) ────────
console.log('\n20. Collaborator detail')
{
  check('conflict modal busy state preserved',
    conflictModal.includes("busy ? 'Working…'"))
  check('conflict modal resume choice preserved',
    conflictModal.includes('Resume') && conflictModal.includes('onDiscardAndRetry'))
  check('history rows renderer untouched (presentational only)',
    !historyRows.includes('fetch(') && historyRows.length > 200)
  check('picker close/library affordances preserved',
    picker.includes('onClick={onClose}') && picker.includes('Manage exercise library →'))
  check('add-section refresh convention preserved',
    addSection.includes('router.refresh()'))
  check('notes cancel restores persisted value',
    sessionNotes.includes('setDraft(notes ?? \'\')'))
  check('block trend map values preserved',
    block.includes('TREND_LABEL') && block.includes('improving'))
  check('loading: exactly four card regions + two strips',
    (loading.match(/<SkeletonCard/g) || []).length === 4 &&
    (loading.match(/<Skeleton /g) || []).length === 2)
  check('loading carries no interactive elements or copy',
    !loading.includes('<Link') && !loading.includes('<button') &&
    !loading.match(/>[A-Z][a-z]+ /))
  check('summary card renders duration via existing formatter',
    summaryCard.includes('formatWorkoutDuration(startTime, endTime, completedDurationSeconds)'))
  check('summary omits empty sections (no fake zeros)',
    summaryCard.includes('targetCounts.evaluated > 0') &&
    summaryCard.includes('effort.loggedRpeCount > 0 || effort.missingRpeCount > 0'))
  check('deferral inventory documented for 4B.6D',
    notes.includes('ExerciseHistoryRows') && notes.includes('ActiveWorkoutConflictModal') &&
    notes.includes('4B.6D'))
}

// ── Result ───────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) {
  process.exit(1)
}
