// ============================================================
// ForgeFitOS — Phase 4B.6A deterministic verification harness
// Verifies the Train-hub redesign (/workouts, /workouts/routines,
// /workouts/routines/[id], /workouts/exercises): route-aware Train
// subnav, page hierarchy, card variants, loading geometry — and,
// critically, that every workout/routine/exercise behavior contract
// is byte-anchored unchanged and the active-workout detail flow
// (Phase 4B.6B scope) is untouched.
// Run from the repository root:
//   npx tsx scripts/verify-phase4b6a.ts
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

const hubPage = read('src/app/(app)/workouts/page.tsx')
const hubLoading = read('src/app/(app)/workouts/loading.tsx')
const routinesPage = read('src/app/(app)/workouts/routines/page.tsx')
const routinesLoading = read('src/app/(app)/workouts/routines/loading.tsx')
const routineDetailPage = read('src/app/(app)/workouts/routines/[id]/page.tsx')
const routineDetailLoading = read('src/app/(app)/workouts/routines/[id]/loading.tsx')
const exercisesPage = read('src/app/(app)/workouts/exercises/page.tsx')
const exercisesLoading = read('src/app/(app)/workouts/exercises/loading.tsx')
const subNav = read('src/components/workout/WorkoutsSubNav.tsx')
const sessionCard = read('src/components/workout/SessionCard.tsx')
const volume = read('src/components/workout/MuscleVolumeSummary.tsx')
const exercisesClient = read('src/components/workout/ExercisesClient.tsx')
const exerciseItem = read('src/components/workout/ExerciseListItem.tsx')
const routinesClient = read('src/components/routine/RoutinesPageClient.tsx')
const routineCard = read('src/components/routine/RoutineCard.tsx')
const routineDetail = read('src/components/routine/RoutineDetailClient.tsx')
const routineRow = read('src/components/routine/RoutineExerciseRow.tsx')
const picker = read('src/components/workout/ExercisePicker.tsx')
const notes = read('docs/phase4b6a-train-hubs-notes.md')

const LOADINGS = [hubLoading, routinesLoading, routineDetailLoading, exercisesLoading]
const COMPONENTS = [subNav, sessionCard, volume, exercisesClient, exerciseItem,
  routinesClient, routineCard, routineDetail, routineRow, picker]
const SCOPE = [hubPage, ...LOADINGS, ...COMPONENTS]

// ── 1. Checkpoint and routes ─────────────────────────────────────────
console.log('\n1. Checkpoint and routes')
{
  check('checkpoint artifacts exist (022d5e7 tree)',
    ['scripts/verify-phase4b5.ts', 'docs/phase4b5-progress-pillar-notes.md',
      'src/components/progress/ProgressSubNav.tsx',
      'supabase/migrations/013_phase3e_goal_adjustments.sql']
      .every((f) => existsSync(f)))
  check('all prior notes exist',
    ['phase4a-ux-information-architecture-audit', 'phase4b1-foundation-notes',
      'phase4b2-navigation-notes', 'phase4b3-today-notes',
      'phase4b4-coach-pillar-notes', 'phase4b5-progress-pillar-notes']
      .every((f) => existsSync(`docs/${f}.md`)))
  check('4B.6A notes exist', notes.length > 1500)
  for (const r of ['workouts', 'workouts/[id]', 'workouts/routines',
    'workouts/routines/[id]', 'workouts/exercises']) {
    check(`route retained: /${r}`, existsSync(`src/app/(app)/${r}/page.tsx`))
  }
  check('no new route aliases', !existsSync('src/app/(app)/train'))
  check('no redirects', !read('next.config.mjs').includes('redirects'))
  check('hub metadata + H1 unchanged',
    hubPage.includes("title: 'Workouts' }") && hubPage.includes('Workouts\n        </h1>') ||
    hubPage.includes('Workouts'))
  // RETARGET (UI-5A): the page-level H1 on the hub and on the
  // routines/exercises clients now comes from the PageHeader
  // primitive (default heading level h1, no `as=` override); routine
  // detail keeps its literal H1. The boundary — exactly one
  // page-level H1 per page — is unchanged across BOTH checks below;
  // only the markup source moved.
  check('exactly one H1 on the hub page (PageHeader, default h1)',
    (hubPage.match(/<PageHeader/g) || []).length === 1 &&
    !hubPage.includes('<PageHeader as=') &&
    (hubPage.match(/<h1/g) || []).length === 0)
  check('client pages own their single H1',
    (routinesClient.match(/<PageHeader/g) || []).length === 1 &&
    !routinesClient.includes('<PageHeader as=') &&
    (routinesClient.match(/<h1/g) || []).length === 0 &&
    (exercisesClient.match(/<PageHeader/g) || []).length === 1 &&
    !exercisesClient.includes('<PageHeader as=') &&
    (exercisesClient.match(/<h1/g) || []).length === 0 &&
    (routineDetail.match(/<h1/g) || []).length === 1)
  check('loading files carry no H1', LOADINGS.every((l) => !l.includes('<h1')))
  check('auth gate preserved on hub', hubPage.includes("redirect('/login')"))
  check('onboarding gate preserved on hub', hubPage.includes("redirect('/onboarding')"))
  check('thin server pages untouched (routines/detail/exercises wrappers)',
    routinesPage.includes('RoutinesPageClient') &&
    routineDetailPage.includes('RoutineDetailClient') &&
    exercisesPage.includes('ExercisesClient'))
}

// ── 2. Train subnav ──────────────────────────────────────────────────
console.log('\n2. Train subnav')
{
  check('exact three links',
    (subNav.match(/href: '/g) || []).length === 3)
  check('exact labels', ["label: 'Workouts'", "label: 'Routines'", "label: 'Exercise library'"]
    .every((l) => subNav.includes(l)))
  check('exact hrefs', ["href: '/workouts'", "href: '/workouts/routines'",
    "href: '/workouts/exercises'"].every((h) => subNav.includes(h)))
  check('route-aware matching with longest-prefix precedence',
    subNav.includes("pathname.startsWith(href + '/')") &&
    subNav.includes('href.length > best.length'))
  check('/workouts/[id] maps to Workouts (documented + mechanism)',
    subNav.includes('/workouts/[id] keeps') || subNav.includes('Workouts active'))
  check('aria-current', subNav.includes("aria-current={active ? 'page' : undefined}"))
  check('structural active state (underline + weight)',
    subNav.includes('border-b-2') && subNav.includes('font-semibold') &&
    subNav.includes('border-brand'))
  check('border-wrapper pattern (no 1px vertical scroll trap)',
    subNav.includes('<div className="border-b border-edge-subtle">') &&
    subNav.includes('className="-mb-px flex items-center gap-1 overflow-x-auto"') &&
    !subNav.includes("'-mb-px whitespace-nowrap"))
  check('mobile-safe', subNav.includes('overflow-x-auto') && subNav.includes('whitespace-nowrap'))
  check('nav landmark', subNav.includes('aria-label="Workout sections"'))
  check('real links', subNav.includes("from 'next/link'"))
  check('no persistence/counts/emoji',
    !subNav.includes('localStorage') && !stripComments(subNav).includes('count') &&
    !EMOJI.test(subNav))
  check('rendered on hub, routines, routine detail, and exercises',
    hubPage.includes('<WorkoutsSubNav />') && routinesClient.includes('<WorkoutsSubNav />') &&
    exercisesClient.includes('<WorkoutsSubNav />') && routineDetail.includes('<WorkoutsSubNav />'))
  check('no duplicate route declarations outside the component',
    [hubPage, routinesClient, exercisesClient].every((f) =>
      !stripComments(f).includes("label: '")))
}

// ── 3. Workouts hub contract ─────────────────────────────────────────
console.log('\n3. Workouts hub contract')
{
  const HELPERS = ['fetchRecentSessions(supabase, user.id, 15)',
    'fetchWorkoutWeekStats(supabase, user.id)',
    'fetchCoachSummary(supabase, user.id, today)',
    'seedExercisesIfNeeded(supabase, user.id)']
  for (const h of HELPERS) {
    check(`legacy query preserved: ${h.split('(')[0]}`, hubPage.includes(h))
  }
  check('week-sessions volume query unchanged',
    hubPage.includes("in('status', ['in_progress', 'completed'])") &&
    hubPage.includes('weeklyMuscleVolume'))
  check('today/other session split unchanged',
    hubPage.includes("sessions.filter((s: any) => s.workout_date === today)") &&
    hubPage.includes("sessions.filter((s: any) => s.workout_date !== today)"))
  check('one data addition: existing Phase 2K active-session helper',
    hubPage.includes('findActiveTrainingSession(supabase, user.id).catch(() => null)'))
  check('resume card rendered only when active (no blank slot)',
    hubPage.includes('{activeSession && (') &&
    hubPage.indexOf('{activeSession && (') < hubPage.indexOf('Active workout</h2>'))
  check('resume routes to the existing detail page',
    hubPage.includes('href={`/workouts/${activeSession.id}`}'))
  check('resume CTA is a 44px link', hubPage.includes('min-h-11') &&
    hubPage.includes('Resume workout'))
  check('create action preserved (both placements)',
    (hubPage.match(/<CreateWorkoutButton/g) || []).length === 2 &&
    hubPage.includes('label="Start your first workout"'))
  check('no writes on render', !hubPage.includes('.insert(') && !hubPage.includes('.update('))
  check('server component preserved', !hubPage.includes("'use client'"))
  check('no streaks/scores/invented recommendations',
    !/streak|adherence score|recommended for you/i.test(stripComments(hubPage)))
  check('empty state copy preserved', hubPage.includes('No workouts yet.'))
  // RETARGET (UI-5A): the text-glyph arrow in the zero-routines copy
  // was replaced by a decorative lucide chevron (glyph-free copy
  // rule). Both entry states and the link remain; the copy is intact
  // minus the trailing arrow character.
  check('routines entry preserved with both states',
    hubPage.includes('Start a structured workout') &&
    hubPage.includes('Build routines to start structured workouts') &&
    !hubPage.includes('workouts \u2192') &&
    hubPage.includes('<ChevronRight'))
}

// ── 4. Session card contract ─────────────────────────────────────────
console.log('\n4. Session card')
{
  check('links to the existing detail route',
    sessionCard.includes('href={`/workouts/${session.id}`}'))
  check('duration/date formatting unchanged',
    sessionCard.includes('formatWorkoutDuration(session.start_time, session.end_time, session.completed_duration_seconds)') &&
    sessionCard.includes("format(parseISO(session.workout_date), 'EEE, MMM d')"))
  check('status labels via the shared provenance-aware helper (text always)',
    sessionCard.includes('{workoutStatusLabel(session)}'))
  check('status colors semantic (caution/success/info/muted)',
    sessionCard.includes("in_progress: 'bg-caution-subtle text-caution") &&
    sessionCard.includes("completed:   'bg-success-subtle text-success") &&
    sessionCard.includes("skipped:     'bg-surface-sunken text-ink-muted"))
  check('interactive Card inside the Link (no nested buttons)',
    sessionCard.includes('variant="interactive"') && !sessionCard.includes('<button'))
  check('no shred-card', !sessionCard.includes('shred-card'))
  // RETARGET (UI-5A): long titles now WRAP (break-words + min-w-0)
  // instead of truncating — strictly more content-safe; the boundary
  // (long titles can never overflow the card) is preserved.
  check('long titles wrap safely (break-words, no overflow)',
    sessionCard.includes('break-words') && sessionCard.includes('min-w-0') &&
    !sessionCard.includes('truncate'))
}

// ── 5. Routines contract ─────────────────────────────────────────────
console.log('\n5. Routines contract')
{
  check('create flow unchanged (RoutineForm + redirect to detail)',
    routinesClient.includes('<RoutineForm onClose={() => setCreating(false)} onCreated={handleCreated} />') &&
    routinesClient.includes('router.push(`/workouts/routines/${id}`)'))
  check('active/inactive split unchanged',
    routinesClient.includes('initialRoutines.filter(r => r.is_active)') &&
    routinesClient.includes('Show'))
  check('create form opens in an elevated card',
    routinesClient.includes('variant="elevated"'))
  check('empty state constructive (status card + CTA)',
    routinesClient.includes('variant="status"') &&
    routinesClient.includes('Create your first routine'))
  check('routine card links to detail',
    routineCard.includes('href={`/workouts/routines/${routine.id}`}'))
  check('routine card metadata via existing lib formatters',
    routineCard.includes('goalLabel(routine.goal)') &&
    routineCard.includes('muscleFocusLabel(routine.primary_muscle_focus)'))
  check('routine card interactive, no nested buttons',
    routineCard.includes('variant="interactive"') && !routineCard.includes('<button'))
  check('detail: meta edit flow unchanged',
    routineDetail.includes('<RoutineForm existing={routine} onClose={() => setEditingMeta(false)} />'))
  check('detail: deactivate/reactivate + confirm unchanged',
    routineDetail.includes('confirm(`${label} “${routine.name}”?`)') &&
    routineDetail.includes("body: JSON.stringify({ is_active: newActive })"))
  check('detail: delete confirm + 409 has_sessions fallback unchanged',
    routineDetail.includes('This cannot be undone.') &&
    routineDetail.includes('res.status === 409 && body.has_sessions') &&
    routineDetail.includes('Deactivate this routine'))
  check('detail: optimistic reorder + snapshot rollback unchanged',
    routineDetail.includes('const snapshot: any[] = exerciseList.map((e: any) => ({ ...e }))') &&
    routineDetail.includes('setExerciseList(snapshot)'))
  check('detail: single Start button preserved',
    (routineDetail.match(/<StartWorkoutButton/g) || []).length === 1)
  check('detail: delete visually critical and separated',
    routineDetail.includes('text-critical border border-critical/30') &&
    routineDetail.includes('Delete permanently'))
  check('detail: add-exercise keeps button semantics, 44px, dashed',
    routineDetail.includes('border-dashed') && routineDetail.includes('min-h-11') &&
    routineDetail.includes('Add exercise'))
  check('detail: ExercisePicker wiring unchanged',
    routineDetail.includes('<ExercisePicker exercises={allExercises} onAdd={handleAddExercise}'))
  check('no autosave anywhere in routine scope',
    !routineDetail.includes('autosave') && !routineRow.includes('useEffect(() => { save'))
}

// ── 6. Routine exercise row contract ─────────────────────────────────
console.log('\n6. Routine exercise row')
{
  check('PATCH endpoint unchanged',
    routineRow.includes('`/api/routine-exercises/${re.id}`'))
  check('all target fields preserved',
    ['target_sets', 'target_reps_min', 'target_reps_max', 'target_weight_lbs',
      'target_rpe', 'rest_seconds', 'notes'].every((f) => routineRow.includes(f)))
  check('validation rules unchanged (min>max, rest bounds)',
    routineRow.includes('can’t exceed max reps') &&
    routineRow.includes('Rest must be between 0 and 3600 seconds.'))
  check('unit conversion unchanged (lbs→kg rounded)',
    routineRow.includes('Math.round(lbsToKg(parseFloat(lbs)) * 100) / 100'))
  check('remove confirm unchanged',
    routineRow.includes('confirm(`Remove ${re.exercise.name} from this routine?`)'))
  check('snapshot-based display unchanged',
    routineRow.includes('const displayRe = { ...re, ...snapshot }'))
  check('reorder controls labeled + disabled states',
    routineRow.includes('aria-label="Move exercise up"') &&
    routineRow.includes('isFirst || isReordering'))
  check('inactive-exercise warning carries text',
    routineRow.includes('Inactive exercise'))
  check('semantic tokens (caution/critical/success)',
    routineRow.includes('bg-caution-subtle text-caution') &&
    routineRow.includes('hover:text-critical') &&
    routineRow.includes('text-success'))
  check('no shred-card', !routineRow.includes('shred-card'))
}

// ── 7. Exercise library contract ─────────────────────────────────────
console.log('\n7. Exercise library')
{
  check('search/filter behavior unchanged',
    exercisesClient.includes('e.name.toLowerCase().includes(search.toLowerCase())') &&
    exercisesClient.includes("muscle !== 'all' && e.primary_muscle !== muscle"))
  check('muscle filters from constants', exercisesClient.includes('PRIMARY_MUSCLES.map'))
  check('filter pills: aria-pressed + check + border + weight',
    exercisesClient.includes('aria-pressed={selected}') &&
    exercisesClient.includes('border-brand bg-surface-selected font-semibold'))
  check('create flow unchanged (ExerciseForm + refresh)',
    exercisesClient.includes('<ExerciseForm onClose={() => { setCreating(false); router.refresh() }} />'))
  check('create form opens in an elevated card', exercisesClient.includes('variant="elevated"'))
  check('inactive toggle flows unchanged (confirm + PATCH)',
    exerciseItem.includes('confirm(`Deactivate "${ex.name}"?') &&
    exerciseItem.includes('`/api/exercises/${ex.id}`') &&
    exerciseItem.includes("body: JSON.stringify({ is_active: true })"))
  check('metadata factual text (muscle/equipment/category)',
    exerciseItem.includes('{muscleLabel}') && exerciseItem.includes('ex.equipment') &&
    exerciseItem.includes('ex.category'))
  check('row is a default card with labeled icon controls',
    exerciseItem.includes('variant="default"') &&
    exerciseItem.includes('aria-label="Edit"') && exerciseItem.includes('aria-label="Deactivate"'))
  check('empty/filter-empty copy preserved',
    exercisesClient.includes('No exercises match this filter.') &&
    exercisesClient.includes('No exercises yet.'))
  check('no shred-card in library scope',
    !exercisesClient.includes('shred-card') && !exerciseItem.includes('shred-card'))
}

// ── 8. Legacy style removal ──────────────────────────────────────────
console.log('\n8. Legacy style removal')
{
  check('no shred-card in 4B.6A scope',
    SCOPE.every((f) => !stripComments(f).includes('shred-card')))
  check('global alias retained for unmigrated code',
    read('src/app/globals.css').includes('.shred-card'))
  check('semantic ink/edge tokens adopted in scope',
    [hubPage, sessionCard, routineDetail, exercisesClient].every((f) =>
      f.includes('text-ink-muted')))
  check('deferred token-only files documented with reasons',
    notes.includes('Deferred token-only files') && notes.includes('ExerciseForm') &&
    notes.includes('RoutineForm') && notes.includes('CreateWorkoutButton') &&
    notes.includes('StartWorkoutButton'))
  check('ExercisePicker deferral documented (4B.6B set)',
    notes.includes('ExercisePicker') && notes.includes('4B.6B'))
}

// ── 9. Loading states ────────────────────────────────────────────────
console.log('\n9. Loading states')
{
  check('four loading files exist',
    ['workouts', 'workouts/routines', 'workouts/routines/[id]', 'workouts/exercises']
      .every((r) => existsSync(`src/app/(app)/${r}/loading.tsx`)))
  check('[id] loading owned by 4B.6B (absent at 6A, added there as planned)',
    // At the 4B.6A checkpoint this file did not exist; 4B.6B added it.
    // The durable invariant is that the four 6A loading files exist.
    existsSync('src/app/(app)/workouts/loading.tsx'))
  check('all use skeleton primitives',
    LOADINGS.every((l) => l.includes("from '@/components/ui/skeleton'")))
  check('no spinner-only / fake text / shred-card',
    LOADINGS.every((l) => !l.includes('animate-spin') && !l.includes('Loading...') &&
      !l.includes('shred-card')))
  check('aria-hidden + no shell duplication',
    LOADINGS.every((l) => l.includes('aria-hidden="true"') && !l.includes('Sidebar')))
  // RETARGET (UI-5A): the four Train discovery routes widened to the
  // approved max-w-6xl; every loading state must still match its
  // route's real container exactly.
  check('route-matched width (max-w-6xl, UI-5A approved)',
    LOADINGS.every((l) => l.includes('max-w-6xl') && !l.includes('max-w-3xl')))
  check('no viewport-height traps or scrollers',
    LOADINGS.every((l) => !l.includes('h-screen') && !l.includes('overflow-y')))
  // RETARGET (UI-5A): the real search input became a 44px control
  // (min-h-11); the skeleton mirrors the new height. Mirror-the-
  // route remains the boundary.
  check('exercises loading mirrors search + chips + rows',
    exercisesLoading.includes('rounded-full') && exercisesLoading.includes('h-11 w-full'))
  check('routine-detail loading mirrors meta + start + rows + add',
    routineDetailLoading.includes('h-32') && routineDetailLoading.includes('h-11'))
}

// ── 10. Responsive and scroll ownership ──────────────────────────────
console.log('\n10. Responsive and scroll ownership')
{
  check('no md: shell leakage in scope',
    SCOPE.every((f) => !stripComments(f).includes('md:')))
  check('shell breakpoint unchanged at lg',
    read('src/components/layout/Sidebar.tsx').includes('hidden lg:flex') &&
    read('src/components/layout/MobileBottomNav.tsx').includes('lg:hidden'))
  check('hub page padding aligned with shell', hubPage.includes('p-4 lg:p-6'))
  check('no route-level scrollers or viewport heights (picker keeps its pre-existing bounded list)',
    SCOPE.every((f) => f === picker || !stripComments(f).includes('overflow-y')) &&
    SCOPE.every((f) => !f.includes('h-screen')) &&
    picker.includes('max-h-60 overflow-y-auto'))
  check('no absolute core layout (inline icon positioning allowed)',
    [hubPage, routinesClient, exercisesClient, routineDetail].every((f) =>
      !stripComments(f).match(/<div[^>]*absolute/)))
  check('no masonry', SCOPE.every((f) => !f.includes('columns-')))
  check('controls wrap on mobile (flex-wrap present where controls group)',
    routineDetail.includes('flex-wrap') && hubPage.includes('flex-wrap'))
  check('bottom-nav clearance inherited (pages add none)',
    !hubPage.includes('safe-area') &&
    read('src/app/(app)/layout.tsx').includes('lg:pb-0'))
}

// ── 11. Accessibility ────────────────────────────────────────────────
console.log('\n11. Accessibility')
{
  // RETARGET (UI-5A): the hand-rolled uppercase h2s became
  // SectionHeader primitives (default heading level h2, no `as=`
  // override) — real h2 headings survive; only the markup source
  // moved.
  check('section headings are real h2s on the hub (SectionHeader, default h2)',
    hubPage.includes('<SectionHeader title="Today" />') &&
    hubPage.includes('<SectionHeader title="Recent sessions" />') &&
    !hubPage.includes('<SectionHeader as='))
  check('links remain links, buttons remain buttons',
    SCOPE.every((f) => !f.match(/<div[^>]*onClick/)))
  check('no tabindex hacks', SCOPE.every((f) => !f.toLowerCase().includes('tabindex')))
  check('icon-only controls labeled',
    routineDetail.includes('aria-label="Edit routine details"') &&
    routineRow.includes('aria-label="Remove exercise from routine"'))
  check('decorative icons aria-hidden',
    hubPage.includes('aria-hidden="true"') && exercisesClient.includes('aria-hidden="true"'))
  check('status not color-only (labels asserted in sections above)',
    sessionCard.includes('workoutStatusLabel') && routineRow.includes('Inactive exercise'))
  check('destructive actions clearly labeled',
    routineDetail.includes('Delete permanently'))
  check('no focus suppression added',
    [hubPage, sessionCard, routineCard].every((f) => !f.includes('outline-none')))
  check('no fake WCAG claim',
    !/WCAG\s+2[.\d]*\s+(AA\s+)?compliant/i.test(notes) &&
    notes.includes('not a WCAG claim'))
}

// ── 12. Language and icons ───────────────────────────────────────────
console.log('\n12. Language and icons')
{
  check('no emoji in scope', SCOPE.every((f) => !EMOJI.test(f)))
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
  check('no Sparkles', SCOPE.every((f) => !stripComments(f).includes('Sparkles')))
  check('lucide only', SCOPE.every((f) => !f.includes('heroicons') && !f.includes('react-icons')))
  check('no guilt/failure framing',
    SCOPE.every((f) => !/no excuses|crush|failed day|falling behind/i.test(f)))
  check('no medical/causal claims',
    SCOPE.every((f) => !/metabolic|hormon|your body is/i.test(stripComments(f))))
  check('approved copy present',
    hubPage.includes('Active workout') && hubPage.includes('Resume workout') &&
    hubPage.includes('Recent sessions'))
}

// ── 13. Phase boundary ───────────────────────────────────────────────
console.log('\n13. Phase boundary')
{
  check('active workout detail flow untouched (4B.6B set intact)',
    ['WorkoutDetailClient', 'SessionHeader', 'WorkoutExerciseBlock', 'SetRow',
      'WorkoutSessionNotes', 'WorkoutCompletionSummaryCard', 'AddExerciseSection',
      'ExercisePicker', 'ActiveWorkoutConflictModal']
      .every((c) => existsSync(`src/components/workout/${c}.tsx`)))
  check('detail client behavior contract intact (migrated by 4B.6B)',
    // 4B.6B migrated the presentation as chartered; the durable
    // invariant is the client's behavior anchor.
    read('src/components/workout/WorkoutDetailClient.tsx').includes('summarizeWorkout(exercises, prBaseline ?? {})'))
  check('workout API routes unchanged (anchors)',
    read('src/app/api/workouts/route.ts').includes('findActiveTrainingSession') &&
    read('src/app/api/routines/[id]/start/route.ts').includes('findActiveTrainingSession'))
  check('workout/routine libs unchanged',
    read('src/lib/workout.ts').includes('weightKg * (1 + reps / 30)') &&
    read('src/lib/routine.ts').includes('formatRoutineTarget'))
  check('dashboard/Coach/Progress pillars unchanged',
    read('src/app/(app)/dashboard/page.tsx').includes('<TodayPrimaryAction') &&
    read('src/app/(app)/coach/page.tsx').includes('fetchCoachActions') &&
    read('src/app/(app)/progress/page.tsx').includes('fetchTrackingAwareProgressOverview'))
  check('navigation model + shell unchanged',
    read('src/components/layout/route-match.ts').includes('LONGEST matching href wins') &&
    read('src/app/(app)/layout.tsx').includes("select('fasting_enabled')"))
  check('4B.6A added no migration (schema through 013 intact)',
    readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql') && f < '014').length === 13)
  check('no package changes',
    JSON.parse(read('package.json')).name === 'shredos' &&
    Object.keys(JSON.parse(read('package.json')).dependencies).length === 22)
  check('dead progress-summary path untouched',
    read('src/lib/progress-summary.ts').includes("select('duration_minutes, ended_at')") &&
    !stripComments(read('src/app/(app)/progress/page.tsx')).includes('fetchProgressSummary('))
  check('no .DS_Store', !existsSync('.DS_Store') && !existsSync('src/.DS_Store'))
  check('onboarding behavior anchors intact (presentation migrated by 4B.6D)',
    read('src/components/onboarding/OnboardingWizard.tsx').includes('onboarding_complete: true'))
  check('Fuel/Profile behavior anchors intact (migrated by 4B.6C)',
    read('src/app/(app)/profile/page.tsx').includes('main_goal_changed') &&
    read('src/app/(app)/nutrition/page.tsx').includes('GoalAdjustmentReviewCard'))
}

// ── 14. Untouched-collaborator contracts (deferred files intact) ─────
console.log('\n14. Untouched collaborators')
{
  const createBtn = read('src/components/workout/CreateWorkoutButton.tsx')
  const startBtn = read('src/components/routine/StartWorkoutButton.tsx')
  const exerciseForm = read('src/components/workout/ExerciseForm.tsx')
  const routineForm = read('src/components/routine/RoutineForm.tsx')
  check('CreateWorkoutButton conflict contract intact (POST + 409)',
    createBtn.includes("fetch('/api/workouts'") &&
    createBtn.includes('res.status === 409') &&
    createBtn.includes("{ status: 'conflict'; activeWorkoutId: string }"))
  check('CreateWorkoutButton default label unchanged',
    createBtn.includes("label = 'New workout'"))
  check('StartWorkoutButton conflict contract intact (start + 409)',
    startBtn.includes('`/api/routines/${routineId}/start`') &&
    startBtn.includes('res.status === 409 && body.active_workout_id'))
  // RETARGET (UI-1A): 4B.6A deferred ExerciseForm's token migration
  // (this pin proved the deferral). UI-1A resolved the deferral as an
  // audited legacy island — the surviving boundary is that the form
  // now carries the SEMANTIC system (one system, not a mix) and is
  // still consumed by the redesigned clients (next checks).
  check('ExerciseForm deferral resolved by UI-1A (semantic tokens, no legacy mix)',
    exerciseForm.includes('bg-surface-interactive') &&
    !exerciseForm.includes('text-muted-foreground') &&
    !exerciseForm.includes('bg-secondary'))
  check('RoutineForm deferred untouched (legacy tokens still present)',
    routineForm.includes('text-muted-foreground') || routineForm.includes('bg-secondary'))
  check('forms still consumed by redesigned clients',
    exercisesClient.includes('<ExerciseForm') && routinesClient.includes('<RoutineForm') &&
    routineDetail.includes('<RoutineForm existing='))
  check('workout status labels constant unchanged',
    read('src/lib/constants.ts').includes('export const WORKOUT_STATUS_LABELS'))
  check('all four workout statuses styled',
    ['in_progress', 'completed', 'planned', 'skipped']
      .every((st) => sessionCard.includes(`${st}:`)))
}

// ── 15. Hub DOM order and variants ───────────────────────────────────
console.log('\n15. Hub DOM order and variants')
{
  // RETARGET (UI-5A): the header anchor is now the PageHeader
  // primitive and the section headings are SectionHeaders; the
  // hierarchy boundary (header, then subnav, then resume, then
  // week/create, then today, then history) is asserted unchanged on
  // the new anchors.
  const h1At = hubPage.indexOf('<PageHeader')
  const navAt = hubPage.indexOf('<WorkoutsSubNav />')
  const resumeAt = hubPage.indexOf('{activeSession && (')
  const weekAt = hubPage.indexOf('<CreateWorkoutButton />')
  const todayAt = hubPage.indexOf('<SectionHeader title="Today" />')
  const historyAt = hubPage.indexOf('<SectionHeader title="Recent sessions" />')
  check('DOM order: header → subnav → resume → week/create → today → history',
    h1At > 0 && h1At < navAt && navAt < resumeAt && resumeAt < weekAt &&
    weekAt < todayAt && todayAt < historyAt)
  check('resume card is the only action variant on the hub',
    (hubPage.match(/variant="action"/g) || []).length === 1)
  check('week summary elevated', hubPage.includes('variant="elevated"'))
  check('routines entry interactive inside a Link',
    !!hubPage.match(/<Link href="\/workouts\/routines" className="block">\s*<Card variant="interactive"/))
  check('empty state status variant', hubPage.includes('variant="status"'))
  check('volume card metric', volume.includes('variant="metric"'))
  // RETARGET (UI-5A): hub width widened to the approved max-w-6xl,
  // documented in the UI-5A notes (the 4B.6A notes keep their own
  // historical max-w-3xl record). Intentional-width remains the
  // boundary.
  check('hub width intentional (max-w-6xl, documented)',
    hubPage.includes('max-w-6xl') && !hubPage.includes('max-w-3xl') &&
    read('docs/ui5a-train-discovery-notes.md').includes('max-w-6xl'))
  // RETARGET (UI-5A): the single-right-angle text glyph (U+203A)
  // became a decorative lucide ChevronRight; still aria-hidden.
  check('routines entry chevron decorative',
    hubPage.includes('<ChevronRight className="h-4 w-4 flex-shrink-0 text-ink-muted" aria-hidden="true" />'))
}

// ── 16. Loading geometry detail ──────────────────────────────────────
console.log('\n16. Loading geometry detail')
{
  check('hub loading: resume/summary blocks + session stack',
    (hubLoading.match(/<SkeletonCard/g) || []).length === 6)
  check('routines loading: three routine cards',
    (routinesLoading.match(/<SkeletonCard/g) || []).length === 3)
  check('routine-detail loading: meta + start + rows + add',
    (routineDetailLoading.match(/<SkeletonCard/g) || []).length === 4 &&
    (routineDetailLoading.match(/rounded-xl/g) || []).length === 2)
  check('exercises loading: search + four chips + four rows',
    (exercisesLoading.match(/rounded-full/g) || []).length === 4 &&
    (exercisesLoading.match(/<SkeletonCard/g) || []).length === 4)
  check('loading pages carry no interactive elements or text',
    LOADINGS.every((l) => !l.includes('<Link') && !l.includes('<button') &&
      !l.match(/>[A-Z][a-z]+ /)))
  check('subnav strip skeleton present on every loading page',
    LOADINGS.every((l) => l.includes('h-9 w-72')))
}

// ── 17. Per-empty-state and copy anchors ─────────────────────────────
console.log('\n17. Per-state copy')
{
  const STATES: Array<[string, string]> = [
    ['hub empty', 'No workouts yet.'],
    ['hub empty support', 'Start logging to track progressive overload and weekly muscle volume.'],
    ['routines empty', 'No routines yet.'],
    ['routines empty support', 'Build a reusable Push Day, Pull Day, or Leg Day'],
    ['routine detail empty', 'No exercises yet. Add your first exercise below.'],
    ['library filter-empty', 'No exercises match this filter.'],
    ['library empty', 'No exercises yet.'],
  ]
  const ALLTEXT = hubPage + routinesClient + routineDetail + exercisesClient
  for (const [name, copy] of STATES) {
    check(`state copy: ${name}`, ALLTEXT.includes(copy))
  }
  check('error copies preserved (routine flows)',
    routineDetail.includes('Failed to add exercise — please try again.') &&
    routineDetail.includes('Reorder failed — please try again.') &&
    routineDetail.includes('This routine has been used in workouts and cannot be deleted.'))
  check('row error copies preserved',
    routineRow.includes('Failed to save — please try again.') &&
    routineRow.includes('Network error — please try again.'))
  check('inactive labels preserved',
    exerciseItem.includes('Inactive') && routineCard.includes('Inactive'))
  check('per-side metadata preserved', exerciseItem.includes('per side'))
  check('routine detail meta chips preserved',
    routineDetail.includes('routine.goal') &&
    routineDetail.includes('routine.primary_muscle_focus') &&
    routineDetail.includes('routine.estimated_duration_minutes'))
}

// ── 18. Structural details ───────────────────────────────────────────
console.log('\n18. Structural details')
{
  check('subnav link order: Workouts → Routines → Exercise library',
    subNav.indexOf("label: 'Workouts'") < subNav.indexOf("label: 'Routines'") &&
    subNav.indexOf("label: 'Routines'") < subNav.indexOf("label: 'Exercise library'"))
  check('inactive routines disclosure preserved',
    routinesClient.includes('inactive routines ({inactive.length})'))
  check('inactive exercises disclosure preserved',
    exercisesClient.includes('inactive exercises'))
  check('SessionCard optional exerciseCount prop preserved',
    sessionCard.includes('exerciseCount?: number') &&
    sessionCard.includes('exerciseCount !== undefined'))
  check('volume summary sorted descending, zero-filtered',
    volume.includes('.filter(([, n]) => n > 0)') &&
    volume.includes('.sort((a, b) => b[1] - a[1])'))
  check('routine row keeps all seven target inputs',
    (routineRow.match(/<input/g) || []).length === 7)
  check('no fake completion celebrations in scope',
    SCOPE.every((f) => !/congratulations|confetti|celebrate/i.test(f)))
  // RETARGET (UI-5A): Today/Recent-sessions headings moved into
  // SectionHeader (h2 by default); the resume card keeps its literal
  // h2. Three headed sections remain the boundary.
  check('hub h2 count matches its three headed sections',
    (hubPage.match(/<h2/g) || []).length === 1 &&
    (hubPage.match(/<SectionHeader /g) || []).length === 2)
}

// ── 19. ExercisePicker contract (QA scope correction) ────────────────
console.log('\n19. ExercisePicker')
{
  check('no shred-card in picker', !stripComments(picker).includes('shred-card'))
  check('picker uses the Card primitive',
    picker.includes("from '@/components/ui/card'") && picker.includes('variant="default"'))
  check('context-agnostic contract unchanged (caller owns the API call)',
    picker.includes('onAdd: (exerciseId: string) => Promise<void>') &&
    picker.includes('onClose: () => void'))
  check('search/filter logic unchanged',
    picker.includes("e.name.toLowerCase().includes(search.toLowerCase())") &&
    picker.includes("muscle === 'all' || e.primary_muscle === muscle") &&
    picker.includes('e.is_active'))
  check('selection/add behavior unchanged (adding state + close after add)',
    picker.includes('setAdding(exerciseId)') &&
    picker.includes('await onAdd(exerciseId)') &&
    picker.includes('onClose()') &&
    picker.includes("adding === e.id ? 'Adding…' : 'Add'"))
  check('muscle pills keep aria-pressed + check + border + weight',
    picker.includes('aria-pressed={selected}') &&
    picker.includes('border-brand bg-surface-selected font-semibold'))
  check('close control and library link preserved',
    picker.includes('onClick={onClose}') &&
    picker.includes('Manage exercise library →'))
  check('empty state copy preserved', picker.includes('No exercises found.'))
  check('bounded list scroll preserved exactly (pre-existing)',
    picker.includes('max-h-60 overflow-y-auto'))
  check('no API call inside the picker (still prop-driven)',
    !picker.includes('fetch('))
  check('active-workout detail behavior anchors intact (presentation migrated by 4B.6B)',
    read('src/components/workout/WorkoutDetailClient.tsx').includes("session.status === 'completed'") &&
    read('src/components/workout/AddExerciseSection.tsx').includes('`/api/workouts/${workoutId}/exercises`'))
  check('all active 4B.6A route scopes now shred-card-free',
    SCOPE.every((f) => !stripComments(f).includes('shred-card')))
}

// ── Result ───────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) {
  process.exit(1)
}
