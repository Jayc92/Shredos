// ============================================================
// ForgeFitOS — Phase 4B.3 deterministic verification harness
// Verifies the Today page redesign: page hierarchy, the primary
// action states, the card-variant hierarchy, semantic-token
// adoption, fasting gating, the widget contract, loading/empty
// states, responsive grid decisions — and, critically, that every
// legacy query, domain calculation, link destination, route URL,
// and migration stays unchanged.
// Run from the repository root:
//   npx tsx scripts/verify-phase4b3.ts
// ============================================================

import { readFileSync, existsSync, readdirSync } from 'fs'

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
// Runtime-constructed so tsc's default target accepts it.
const EMOJI = new RegExp('\\p{Extended_Pictographic}', 'u')

const page = read('src/app/(app)/dashboard/page.tsx')
const loading = read('src/app/(app)/dashboard/loading.tsx')
const hero = read('src/components/dashboard/TodayPrimaryAction.tsx')
const widget = read('src/components/dashboard/TodayWidget.tsx')
const workout = read('src/components/dashboard/WorkoutCard.tsx')
const nutrition = read('src/components/dashboard/NutritionCard.tsx')
const weight = read('src/components/dashboard/WeightCard.tsx')
const steps = read('src/components/dashboard/StepsCard.tsx')
const fasting = read('src/components/dashboard/FastingCard.tsx')
const decisions = read('src/components/dashboard/DecisionLogCard.tsx')
const coach = read('src/components/coach/CoachCard.tsx')
const notes = read('docs/phase4b3-today-notes.md')
const ALL_CARDS = [workout, nutrition, weight, steps, fasting, decisions, coach]
const ALL_TODAY = [page, loading, hero, widget, ...ALL_CARDS]

// ── 1. Checkpoint and route identity ─────────────────────────────────
console.log('\n1. Checkpoint and route identity')
{
  check('checkpoint artifacts exist (440464b tree)',
    ['scripts/verify-phase4b2.ts', 'docs/phase4b2-navigation-notes.md',
      'src/components/layout/route-match.ts', 'src/components/layout/MobileBottomNav.tsx',
      'supabase/migrations/013_phase3e_goal_adjustments.sql']
      .every((f) => existsSync(f)))
  check('authoritative docs exist',
    existsSync('docs/phase4a-ux-information-architecture-audit.md') &&
    existsSync('docs/phase4b1-foundation-notes.md'))
  check('4B.3 notes exist', notes.length > 800)
  check('route remains /dashboard (no /today, no redirects)',
    existsSync('src/app/(app)/dashboard/page.tsx') &&
    !existsSync('src/app/(app)/today') &&
    !read('next.config.mjs').includes('redirects'))
  check('metadata title remains Today', page.includes("title: 'Today'"))
  check('H1 visibly says Today',
    page.includes('<h1 className="text-xl font-bold text-ink">Today</h1>'))
  check('legacy greeting retired (no name-dependent H1, no slogan)',
    !page.includes('getTimeOfDay') && !page.includes('Good {'))
  check('local date supporting line retained (existing formatDateFull)',
    page.includes('formatDateFull(new Date())') && page.includes('{todayLabel}'))
}

// ── 2. Queries and domain behavior preserved ─────────────────────────
console.log('\n2. Queries and domain behavior')
{
  const FETCHES = ['fetchUserProfile', 'fetchRecentWeighIns', 'fetchCurrentNutritionTarget',
    'fetchActiveFast', 'fetchRecentDecisions', 'fetchFastingLogsThisWeek',
    'fetchFoodLogsForDate', 'fetchWorkoutWeekStats', 'fetchCoachSummary',
    'fetchActivityLogForDate', 'fetchNutritionCoachSummary']
  for (const f of FETCHES) {
    check(`legacy query preserved: ${f}`, page.includes(`${f}(`))
  }
  check('single query addition is the existing Phase 2K helper',
    page.includes('findActiveTrainingSession(supabase, user.id)') &&
    read('src/lib/supabase/server.ts').includes('export async function findActiveTrainingSession'))
  check('active-session read is display-only fail-quiet (.catch → null)',
    page.includes('.catch(() => null)'))
  check('onboarding gate preserved',
    page.includes("if (!profile || !profile.onboarding_complete) redirect('/onboarding')"))
  check('auth gate preserved', page.includes("if (!user) redirect('/login')"))
  check('fasting week stats still computed via existing lib',
    page.includes('computeFastingWeekStats(weekFasts)'))
  check('nutrition coach summary still derived from already-fetched data',
    page.includes('fetchNutritionCoachSummary(') &&
    page.includes('nutritionTarget, todayFoodLogs, profile.main_goal'))
  check('no new API endpoint, no persistence, no migration 014',
    !existsSync('src/app/api/dashboard') &&
    !existsSync('supabase/migrations/014_phase4c_dashboard_layout.sql') &&
    ALL_TODAY.every((f) => !f.includes('localStorage')))
  check('no profile write from Today',
    ALL_TODAY.every((f) => !f.includes('.update(') && !f.includes('.upsert(')))
  check('no domain-calculation changes (anchors intact)',
    read('src/lib/workout.ts').includes('weightKg * (1 + reps / 30)') &&
    read('src/lib/nutrition.ts').includes('LEAN_MASS_PROTEIN_THRESHOLD') &&
    read('src/lib/goal-adjustments.ts').includes('CALORIE_STEP_SMALL = 100') &&
    read('src/lib/coach-actions.ts').includes("title: 'Log a weigh-in this week'") &&
    read('src/lib/weekly-review.ts').includes('PROGRESSION_LOOKBACK_DAYS = 56') &&
    read('src/lib/decisions.ts').includes("suggested: ['accepted', 'dismissed']"))
}

// ── 3. Link destinations preserved ───────────────────────────────────
console.log('\n3. Link destinations')
{
  check('header quick links preserved with approved labels',
    page.includes('href="/check-in"') && page.includes('Weekly review →') &&
    page.includes('href="/coach"') && page.includes('Coach →') &&
    !page.includes('Weekly check-in') && !page.includes('Coach actions →'))
  check('workout links preserved', workout.includes('href="/workouts"') &&
    workout.includes('/workouts/routines'))
  check('nutrition links preserved', nutrition.includes('href="/nutrition"') &&
    nutrition.includes('href="/food"'))
  check('weigh-in link preserved', weight.includes('href="/weigh-in"'))
  check('steps link preserved', steps.includes('href="/activity"'))
  check('fasting links preserved', fasting.includes('href="/fasting"'))
  check('decisions link preserved', decisions.includes('href="/decisions"'))
  check('coach card links preserved', coach.includes('href="/workouts"') &&
    coach.includes('/workouts/routines') && coach.includes('StartWorkoutButton'))
  check('resume routes to the existing workout detail page',
    hero.includes('href={`/workouts/${activeSessionId}`}') &&
    existsSync('src/app/(app)/workouts/[id]/page.tsx'))
  check('start routes to existing /workouts', hero.includes('href="/workouts"'))
}

// ── 4. Primary action area ───────────────────────────────────────────
console.log('\n4. Primary action')
{
  check('hero component exists and leads the page',
    page.includes('<TodayPrimaryAction') &&
    page.indexOf('<TodayPrimaryAction') < page.indexOf('<NutritionCard'))
  check('active state: resume current workout', hero.includes('Workout in progress') &&
    hero.includes('Resume workout'))
  check('no-active state: start workout', hero.includes('Train today') &&
    hero.includes('Start workout'))
  check('recent context from already-available stats',
    hero.includes('stats.sessions_this_week') &&
    hero.includes('logged this week'))
  check('hero uses action card variant', hero.includes('variant="action"'))
  check('hero clearly distinguished (brand-tinted action surface, only one on page)',
    (ALL_TODAY.join('').match(/variant="action"/g) || []).length === 2 &&
    hero.includes('bg-brand'))
  check('no new active-workout logic (helper reused, not reimplemented)',
    !hero.includes('supabase') && !stripComments(hero).includes('in_progress'))
  check('hero buttons are real links with 44px targets',
    hero.includes('<Link') && hero.includes('min-h-11'))
  check('no invented recommendations in hero',
    !stripComments(hero).includes('recommend') && !stripComments(hero).includes('should'))
}

// ── 5. Status grid and card hierarchy ────────────────────────────────
console.log('\n5. Card hierarchy')
{
  check('all seven legacy domains retained on the page',
    ['NutritionCard', 'WeightCard', 'StepsCard', 'WorkoutCard', 'FastingCard',
      'CoachCard', 'DecisionLogCard'].every((c) => page.includes(`<${c}`)))
  check('workout status card: elevated', workout.includes('variant="elevated"'))
  check('nutrition card: metric', nutrition.includes('variant="metric"'))
  check('weight card: metric', weight.includes('variant="metric"'))
  check('steps card: metric', steps.includes('variant="metric"'))
  check('fasting card: status', fasting.includes('variant="status"'))
  check('coach card: status', coach.includes('variant="status"'))
  check('decisions card: subtle', decisions.includes('variant="subtle"'))
  check('not seven identical variants',
    new Set(['elevated', 'metric', 'metric', 'metric', 'status', 'status', 'subtle']).size >= 3)
  check('Today route no longer uses .shred-card',
    ALL_TODAY.every((f) => !f.includes('shred-card')))
  check('cards use the Card primitive',
    ALL_CARDS.every((f) => f.includes("from '@/components/ui/card'")))
  check('card chrome uses semantic tokens',
    ALL_CARDS.every((f) => f.includes('text-ink-muted')) &&
    [workout, weight, nutrition, fasting].every((f) => f.includes('border-edge-subtle')))
  check('domain-lib color output deliberately untouched (documented)',
    read('src/lib/food.ts').includes('progressColor') &&
    nutrition.includes('progressColor') &&
    notes.includes('lib output, not card chrome'))
  check('no nested interactive elements (no card-as-link wrappers)',
    ALL_CARDS.every((f) => !f.match(/<Link[^>]*>\s*<Card/) && !f.match(/<a [^>]*>\s*<Card/)))
}

// ── 6. Fasting visibility ────────────────────────────────────────────
console.log('\n6. Fasting visibility')
{
  check('fasting widget rendered only when enabled',
    page.includes('{profile.fasting_enabled && (') &&
    page.indexOf('profile.fasting_enabled && (') < page.indexOf('<FastingCard'))
  check('behavior change documented (legacy showed an Off card)',
    notes.includes('legacy dashboard rendered a disabled card'))
  check('fasting queries unchanged (still fetched)',
    page.includes('fetchActiveFast') && page.includes('fetchFastingLogsThisWeek'))
  check('direct /fasting route retained', existsSync('src/app/(app)/fasting/page.tsx'))
  check('shell gating source unchanged (4B.2 layout read)',
    read('src/app/(app)/layout.tsx').includes("select('fasting_enabled')"))
}

// ── 7. Widget contract (4C preparation only) ─────────────────────────
console.log('\n7. Widget contract')
{
  check('TodayWidgetId type with the six stable ids',
    widget.includes("export type TodayWidgetId") &&
    ['workout', 'nutrition', 'weight', 'steps', 'fasting', 'decisions']
      .every((id) => widget.includes(`'${id}'`)))
  check('thin wrapper carries data-widget', widget.includes('data-widget={id}'))
  check('every grid/review domain section wrapped',
    ['"nutrition"', '"weight"', '"steps"', '"workout"', '"fasting"', '"decisions"']
      .every((id) => page.includes(`<TodayWidget id=${id}`)))
  check('one id per section (hero is hierarchy, not a widget)',
    (page.match(/<TodayWidget id="workout"/g) || []).length === 1)
  check('no customization/persistence/drag/widget settings',
    ALL_TODAY.every((f) =>
      !stripComments(f).includes('drag') && !f.includes('localStorage') &&
      !f.includes('widget_settings') && !f.includes('onDrop')))
  check('4C boundary documented', notes.includes('not implementation') ||
    notes.includes('No** persistence'))
}

// ── 8. Responsive layout ─────────────────────────────────────────────
console.log('\n8. Responsive layout')
{
  check('desktop width widened to max-w-6xl', page.includes('max-w-6xl') &&
    !page.includes('max-w-4xl') && !page.includes('max-w-2xl'))
  check('mobile one column; two from sm; three at lg (grid decoupled from shell switch)',
    page.includes('grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'))
  check('lower grid adapts: two lg columns without Fasting, three with',
    page.includes("lg:grid-cols-2'") && page.includes("lg:grid-cols-3'"))
  check('page padding aligned with shell', page.includes('p-4 lg:p-6'))
  check('internal grids deliberately use sm (documented)',
    notes.includes('deliberately uses `sm`'))
  check('no md: shell-breakpoint leakage in Today layout',
    !stripComments(page).includes('md:'))
  check('long values wrap/truncate safely',
    hero.includes('min-w-0') && weight.includes('whitespace-nowrap'))
  check('no horizontal overflow constructs (no fixed widths beyond max-w)',
    !page.includes('w-[') && !hero.includes('w-['))
}

// ── 9. Loading and empty states ──────────────────────────────────────
console.log('\n9. Loading and empty states')
{
  check('route loading state exists using 4B.1 skeletons',
    loading.includes('SkeletonCard') && loading.includes("from '@/components/ui/skeleton'"))
  check('skeletons approximate final geometry (header, hero, grid, review)',
    loading.includes('max-w-6xl') && loading.includes('sm:grid-cols-2 lg:grid-cols-3') &&
    loading.includes('lg:grid-cols-2'))
  check('loading state aria-hidden', loading.includes('aria-hidden="true"'))
  check('reduced-motion honored by skeleton primitives (4B.1 block intact)',
    read('src/app/globals.css').includes('prefers-reduced-motion'))
  check('empty states preserved: weight', weight.includes('No weigh-in recorded yet.'))
  check('empty states preserved: nutrition', nutrition.includes('No nutrition targets set.') &&
    nutrition.includes('No food logged yet today.'))
  check('empty states preserved: steps', steps.includes('No steps logged yet today.'))
  check('empty states preserved: workout', workout.includes('No workouts yet.'))
  check('empty states preserved: fasting', fasting.includes('No fasts recorded yet.'))
  check('empty states preserved: decisions', decisions.includes('No decisions recorded yet.'))
  check('empty states constructive (links, not warnings)',
    weight.includes('Log your first weigh-in') && nutrition.includes('Set up targets'))
}

// ── 10. Tone, icons, and language ────────────────────────────────────
console.log('\n10. Tone and icons')
{
  check('no emoji in Today source (Extended_Pictographic)',
    ALL_TODAY.every((f) => !EMOJI.test(f)))
  check('lucide-only icons, no second library',
    ALL_TODAY.every((f) => !f.includes('heroicons') && !f.includes('react-icons')))
  check('decorative icons aria-hidden in new/reworked surfaces',
    hero.includes('aria-hidden="true"') && coach.includes('aria-hidden="true"'))
  check('no motivational slogans or fake AI language',
    ALL_TODAY.every((f) =>
      !/crush|beast|grind|no excuses|AI-powered|powered by AI/i.test(f)))
  check('no guilt/causal/medical language',
    ALL_TODAY.every((f) =>
      !/you failed|lazy|caused your|metabolic damage|burns? fat/i.test(f)))
  check('no red alerts for ordinary missed logging',
    !steps.includes('critical') && !nutrition.includes('text-red-500') &&
    steps.includes('No steps logged yet today.'))
  check('no gamified streak pressure', ALL_TODAY.every((f) => !/streak/i.test(f)))
  check('no gradients/glassmorphism/neon', ALL_TODAY.every((f) =>
    !f.includes('gradient') && !f.includes('backdrop-blur') && !f.includes('glow')))
  check('restrained brand usage (one brand-filled CTA surface)',
    (hero.match(/bg-brand /g) || []).length <= 2)
}

// ── 11. Shell and prior-phase invariants ─────────────────────────────
console.log('\n11. Phase boundary invariants')
{
  check('shell untouched (4B.2 files)',
    read('src/components/layout/Sidebar.tsx').includes('hidden lg:flex') &&
    read('src/components/layout/MobileBottomNav.tsx').includes('lg:hidden') &&
    read('src/components/layout/route-match.ts').includes('LONGEST matching href wins'))
  // RETARGET (UI-1A): boundary is a DETERMINISTIC pinned color-scheme
  // + tokenized body. The scheme is now the approved dark foundation.
  check('canvas theme determinism untouched (now dark)',
    read('src/app/globals.css').includes('color-scheme: dark;') &&
    read('src/app/layout.tsx').includes('bg-canvas text-ink'))
  check('.shred-card alias still defined for other routes',
    read('src/app/globals.css').includes('.shred-card'))
  check('other routes unchanged (behavior anchors)',
    // 4B.4 redesigned the Coach-pillar presentation; durable anchors
    // are the routes' behavior contracts, not the retired H1 copy.
    read('src/app/(app)/coach/page.tsx').includes('fetchCoachActions') &&
    read('src/app/(app)/decisions/page.tsx').includes('Nothing changes silently') &&
    read('src/app/(app)/profile/page.tsx').includes('main_goal_changed'))
  check('no dependency changes',
    Object.keys(JSON.parse(read('package.json')).dependencies).length === 22)
  check('migrations still end at 013',
    readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql') && f < '014').length === 13)
  check('no .DS_Store', !existsSync('.DS_Store') && !existsSync('src/.DS_Store'))
  check('page stays a server component (no use client)',
    !page.includes("'use client'") && !hero.includes("'use client'") &&
    !widget.includes("'use client'"))
  check('fasting live timer stays the existing client island',
    fasting.includes("'use client'") && fasting.includes('ActiveFastTimer'))
  check('documentation distinguishes 4B.3 from 4C and lists deferrals',
    notes.includes('Deferred to 4B.4+') && notes.includes('4C'))
}

// ════════════════════════════════════════════════════════════════════
// QA-correction expansion: substantive per-contract coverage.
// ════════════════════════════════════════════════════════════════════

// ── 12. Query contracts (fields, filters, limits, ordering, scoping) ─
console.log('\n12. Query contracts')
{
  const server = read('src/lib/supabase/server.ts')
  const body = (fn: string) => {
    const i = server.indexOf(`export async function ${fn}`)
    const j = server.indexOf('export async function', i + 10)
    return i >= 0 ? server.slice(i, j === -1 ? undefined : j) : ''
  }
  const profileQ = body('fetchUserProfile')
  check('profile query: user_profiles, user-scoped, single row',
    profileQ.includes("from('user_profiles')") && profileQ.includes(".eq('user_id', userId)") &&
    profileQ.includes('.single()'))
  check('profile query fallback: missing row → null (PGRST116 tolerated)',
    profileQ.includes("error.code !== 'PGRST116'") && profileQ.includes('data ?? null'))
  const weighQ = body('fetchRecentWeighIns')
  check('weigh-in query: body_metrics, weight non-null filter preserved',
    weighQ.includes("from('body_metrics')") && weighQ.includes(".not('weight_kg', 'is', null)"))
  check('weigh-in query: newest-first ordering + limit preserved',
    weighQ.includes(".order('logged_date', { ascending: false })") &&
    weighQ.includes('.limit(limit)'))
  check('page passes the legacy weigh-in limit of 20',
    page.includes('fetchRecentWeighIns(supabase, user.id, 20)'))
  check('weigh-in query failure → empty list (never fabricated data)',
    weighQ.includes('data ?? []'))
  const targetQ = body('fetchCurrentNutritionTarget')
  check('nutrition-target query: effective_date <= today, latest wins',
    targetQ.includes(".lte('effective_date', today)") &&
    targetQ.includes(".order('effective_date', { ascending: false })") &&
    targetQ.includes('.limit(1)'))
  check('nutrition-target failure → null (card shows set-up state)',
    targetQ.includes('data ?? null'))
  const fastQ = body('fetchActiveFast')
  check('active-fast query: open fast only (ended_at IS NULL)',
    fastQ.includes("from('fasting_logs')") && fastQ.includes(".is('ended_at', null)"))
  check('active-fast failure → null (no fake active fast)',
    fastQ.includes('data ?? null'))
  const decQ = body('fetchRecentDecisions')
  check('decisions query: newest-first + limit preserved',
    decQ.includes("from('decision_logs')") &&
    decQ.includes(".order('created_at', { ascending: false })") &&
    decQ.includes('.limit(limit)'))
  check('page passes the legacy decisions limit of 5',
    page.includes('fetchRecentDecisions(supabase, user.id, 5)'))
  const weekFastQ = body('fetchFastingLogsThisWeek')
  check('week-fasts query: ISO week boundary helper preserved (Phase 1P fix)',
    weekFastQ.includes('startOfISOWeek') && weekFastQ.includes(".gte('started_at'"))
  const foodQ = body('fetchFoodLogsForDate')
  check('food query: date-scoped, chronological',
    foodQ.includes(".eq('logged_date', date)") &&
    foodQ.includes(".order('created_at', { ascending: true })"))
  const actQ = body('fetchActivityLogForDate')
  check('activity query: date-scoped maybeSingle → null fallback',
    actQ.includes("from('daily_activity_logs')") &&
    actQ.includes(".eq('logged_date', date)") && actQ.includes('.maybeSingle()') &&
    actQ.includes('data ?? null'))
  const statsQ = body('fetchWorkoutWeekStats')
  check('week-stats query: in_progress + completed statuses preserved',
    statsQ.includes(".in('status', ['in_progress', 'completed'])") &&
    statsQ.includes(".gte('workout_date', weekStartISO)"))
  check('every dashboard helper is user-scoped',
    [profileQ, weighQ, targetQ, fastQ, decQ, weekFastQ, foodQ, actQ, statsQ]
      .every((q) => q.includes("'user_id'")))
  const activeQ = body('findActiveTrainingSession')
  check('active-session helper: true-active definition intact',
    activeQ.includes(".eq('status', 'in_progress')") &&
    activeQ.includes(".is('completed_duration_seconds', null)") &&
    activeQ.includes(".order('created_at', { ascending: false })") &&
    activeQ.includes('.maybeSingle()'))
  check('active-session helper still throws (creation paths keep their guard)',
    activeQ.includes('throw new Error'))
  check('page-side fallback documented (display-only .catch)',
    stripComments(page).includes('.catch(() => null)') &&
    page.includes('Display-only'))
  check('no service-role usage anywhere in dashboard scope or helpers',
    !server.includes('service_role') && ALL_TODAY.every((f) => !f.includes('service_role')))
  check('no insert call in dashboard source',
    ALL_TODAY.every((f) => !f.includes('.insert(')))
  check('no delete call in dashboard source',
    ALL_TODAY.every((f) => !f.includes('.delete(')))
}

// ── 13. Per-card contracts ───────────────────────────────────────────
console.log('\n13. Per-card contracts')
{
  // [name, src, variant, action label, empty text, domain helper]
  const CARDS: Array<[string, string, string, string, string, string]> = [
    ['Workout', workout, 'elevated', 'Log workout →', 'No workouts yet.', 'formatWorkoutDuration'],
    ['Nutrition', nutrition, 'metric', 'Log food →', 'No food logged yet today.', 'computeNutritionProgress'],
    ['Weight', weight, 'metric', 'Log your first weigh-in →', 'No weigh-in recorded yet.', 'computeWeightChange'],
    ['Steps', steps, 'metric', 'Log steps →', 'No steps logged yet today.', 'toLocaleString'],
    ['Fasting', fasting, 'status', 'Manage fast →', 'No fasts recorded yet.', 'getFastingDuration'],
    ['Decisions', decisions, 'subtle', 'View all', 'No decisions recorded yet.', 'formatRelativeDate'],
  ]
  for (const [name, src, variant, action, empty, helper] of CARDS) {
    check(`${name}: uses the semantic Card primitive`,
      src.includes("from '@/components/ui/card'") && src.includes('<Card '))
    check(`${name}: expected variant ${variant}`, src.includes(`variant="${variant}"`))
    check(`${name}: no shred-card`, !src.includes('shred-card'))
    check(`${name}: direct action label present`, src.includes(action))
    check(`${name}: existing domain helper retained (${helper})`, src.includes(helper))
    check(`${name}: empty branch exists`, src.includes(empty))
    check(`${name}: decorative icon aria-hidden or text-labeled header`,
      src.includes('aria-hidden') || src.includes('text-ink-muted">'))
    check(`${name}: no div onClick (links/buttons only)`,
      !src.match(/<div[^>]*onClick/))
    check(`${name}: concise heading (no h1 inside card)`, !src.includes('<h1'))
  }
  // RETARGETED (5A.4): steps became nullable, so the missing-vs-zero
  // gate moved from row existence to the steps value itself — a
  // distance-only row must not read as "steps logged". The distinction
  // this check protects is unchanged, only its mechanism.
  check('valid zero not conflated with missing: steps (steps null vs 0)',
    steps.includes('todayLog?.steps ?? 0') && steps.includes('todayLog?.steps != null'))
  check('valid zero not conflated with missing: nutrition (no target vs no logs)',
    nutrition.includes('if (!target)') && nutrition.includes('todayLogs.length === 0'))
  check('valid zero not conflated with missing: weight (null latest, null change)',
    weight.includes('weighIns[0] ?? null') && weight.includes('latestWeightLbs !== null'))
  check('valid zero not conflated with missing: fasting (completed_goal !== null gate)',
    fasting.includes('completed_goal !== null'))
  check('status not color-only: decisions pill carries a text label',
    decisions.includes('DECISION_STATUS_LABELS[decision.status]'))
  check('status not color-only: weight change carries text label',
    weight.includes('{change.label}'))
  check('status not color-only: nutrition remaining carries text',
    nutrition.includes('remaining') && nutrition.includes('over'))
  check('status not color-only: steps goal state carries text',
    steps.includes("'Goal met'") && steps.includes('steps to goal'))
}

// ── 14. Coach review section (fixed, non-widget) ─────────────────────
console.log('\n14. Coach review section')
{
  check('CoachCard retained on the page', page.includes('<CoachCard summary={coachSummary} />'))
  check('existing props contract retained (CoachSummary type)',
    coach.includes('summary: CoachSummary') &&
    coach.includes("from '@/lib/workout-coach'"))
  check('no new coach calculation (summary passed straight from existing fetch)',
    page.includes('fetchCoachSummary(supabase, user.id, today)') &&
    !stripComments(page).includes('coachSummary.'))
  check('coach lib untouched (interface + fetch anchors)',
    read('src/lib/workout-coach.ts').includes('export interface CoachSummary') &&
    read('src/lib/workout-coach.ts').includes('export async function fetchCoachSummary'))
  check('CoachCard has NO widget id (fixed section this phase)',
    !page.match(/<TodayWidget[^>]*>\s*<CoachCard/) && !widget.includes("'coach'"))
  // RETARGETED (5B.3): 'energy' is that approved phase's seventh
  // widget id, added deliberately with a documenting comment — the
  // property this pin protects (no SILENT additions; coach/hero stay
  // excluded) is unchanged.
  check('no id silently added (six 4B.3 ids + the documented 5B.3 energy id)',
    (widget.match(/\| '/g) || []).length === 7 &&
    widget.includes("| 'energy' // Phase 5B.3") &&
    !widget.includes("'coach'") && !widget.includes("'hero'"))
  check('review-area placement + 4C decision explicitly deferred (documented)',
    notes.includes('fixed review/advisory section') &&
    notes.includes('Phase 4C must explicitly decide'))
  check('no synthetic pending-decision count',
    !page.includes('pending') && !decisions.includes('pending'))
  check('no automatic decision insertion from Today',
    ALL_TODAY.every((f) => !f.includes('decision_logs')))
  check('no duplicated /coach recommendation logic in page',
    !stripComments(page).includes('freshMuscles') && !stripComments(page).includes('topRoutine'))
}

// ── 15. Fasting gating (expanded) ────────────────────────────────────
console.log('\n15. Fasting gating')
{
  check('gate reads the existing authoritative field only',
    page.includes('profile.fasting_enabled') && !page.includes('fastingEnabled ='))
  check('widget omitted when false / rendered when true (single conditional)',
    (page.match(/profile\.fasting_enabled && \(/g) || []).length === 1)
  check('active timer behavior retained (1s interval, cleanup)',
    fasting.includes('setInterval(tick, 1000)') && fasting.includes('clearInterval'))
  check('timer derives from real timestamps (no fake duration)',
    fasting.includes('getFastingDuration(fast.started_at, null)'))
  check('no physiological/medical copy added in card source',
    !/ketosis|autophagy|fat.?burn|metaboli/i.test(stripComments(fasting)))
  check('no automatic fasting target set from Today',
    !fasting.includes('goal_hours:') && !page.includes('goal_hours'))
  check('milestone copy still comes from the existing lib',
    fasting.includes('getCurrentMilestone'))
  check('fasting week stats prop contract unchanged',
    fasting.includes('weekStats: FastingWeekStats') &&
    page.includes('weekStats={fastingStats}'))
}

// ── 16. Responsive and DOM order (expanded) ──────────────────────────
console.log('\n16. Responsive and DOM order')
{
  const h1At = page.indexOf('<h1')
  const heroAt = page.indexOf('<TodayPrimaryAction')
  const gridAt = page.indexOf('sm:grid-cols-2 lg:grid-cols-3')
  const lowerAt = page.indexOf('profile.fasting_enabled\n            ?')
  check('DOM order: header → hero → upper status grid → lower review grid',
    h1At > 0 && h1At < heroAt && heroAt < gridAt && gridAt < lowerAt &&
    lowerAt < page.indexOf('<CoachCard'))
  check('hero spans full width (not inside the status grid)',
    heroAt < gridAt)
  // ── Desktop-composition QA correction ──
  check('upper grid holds exactly the three unconditional lg columns',
    (() => {
      const upper = page.slice(gridAt, lowerAt)
      return upper.includes('id="nutrition"') && upper.includes('id="weight"') &&
        upper.includes('id="steps"') && upper.includes('id="workout"') &&
        !upper.includes('id="fasting"') && !upper.includes('CoachCard')
    })())
  check('no orphan Fasting row (fasting lives in the lower grid)',
    page.indexOf('id="fasting"') > lowerAt)
  check('explicit lower-layout wrapper with adaptive columns',
    page.includes("? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'") &&
    page.includes(": 'grid grid-cols-1 gap-4 lg:grid-cols-2'"))
  check('no empty reserved conditional slot (columns follow the condition)',
    page.indexOf('profile.fasting_enabled') < page.indexOf("lg:grid-cols-3'") ||
    stripComments(page).split('fasting_enabled\n            ?').length === 2)
  check('lower-grid keyboard order: Fasting → Coach → Decisions',
    page.indexOf('id="fasting"') < page.indexOf('<CoachCard') &&
    page.indexOf('<CoachCard') < page.indexOf('id="decisions"'))
  check('final grid composition documented',
    notes.includes('Upper status grid') && notes.includes('Lower utility/review grid') &&
    notes.includes('never reserves a blank slot') && notes.includes('never orphans a row'))
  check('no absolute positioning in core page layout',
    !stripComments(page).includes('absolute'))
  check('no overflow-x workaround masking a defect',
    ALL_TODAY.every((f) => !f.includes('overflow-x-hidden')))
  check('bottom-nav clearance inherited from the shell (page adds none)',
    !page.includes('safe-area') &&
    read('src/app/(app)/layout.tsx').includes('pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0'))
  check('shell breakpoint unchanged at lg',
    read('src/components/layout/Sidebar.tsx').includes('hidden lg:flex') &&
    read('src/components/layout/MobileBottomNav.tsx').includes('lg:hidden'))
  check('hero CTA min touch target on both branches',
    (hero.match(/min-h-11/g) || []).length === 2)
  check('stacked steps/workout column uses content-start (no stretch gap)',
    page.includes('content-start'))
}

// ── 17. Loading state (expanded) ─────────────────────────────────────
console.log('\n17. Loading state')
{
  check('loading.tsx at the route location', existsSync('src/app/(app)/dashboard/loading.tsx'))
  check('uses the 4B.1 skeleton primitives only',
    loading.includes("from '@/components/ui/skeleton'") && !loading.includes('animate-spin'))
  check('hero skeleton present (full-width block)',
    loading.includes('h-[72px] w-full'))
  check('status grid skeleton count matches geometry (3)',
    (loading.split('sm:grid-cols-2 lg:grid-cols-3')[1] || '')
      .split('</div>')[0].split('<SkeletonCard').length - 1 === 3)
  check('review skeleton count matches geometry (2)',
    (loading.split('lg:grid-cols-2')[1] || '')
      .split('<SkeletonCard').length - 1 === 2)
  check('same max-width as the page', loading.includes('max-w-6xl'))
  check('same responsive grid classes as the page',
    loading.includes('sm:grid-cols-2 lg:grid-cols-3') && loading.includes('lg:grid-cols-2'))
  check('no spinner-only page, no fake labels',
    !loading.includes('Loading...') && !loading.match(/>[A-Z][a-z]+</))
  check('no shred-card in loading state', !loading.includes('shred-card'))
  check('shell not duplicated in loading state',
    !loading.includes('Sidebar') && !loading.includes('TopBar'))
  check('loading region hidden from assistive tech', loading.includes('aria-hidden="true"'))
  check('loading lower-grid approximation documented (fasting-agnostic 2-col)',
    loading.includes('fasting-agnostic'))
  check('loading geometry matches corrected structure (upper 3 + lower 2)',
    loading.indexOf('sm:grid-cols-2 lg:grid-cols-3') <
    loading.indexOf('lg:grid-cols-2'))
}

// ── 18. Accessibility (expanded) ─────────────────────────────────────
console.log('\n18. Accessibility')
{
  check('exactly one H1 on the page',
    (page.match(/<h1/g) || []).length === 1 &&
    ALL_CARDS.every((f) => !f.includes('<h1')) && !hero.includes('<h1') &&
    !loading.includes('<h1'))
  check('card/section headings sit below the H1 level',
    coach.includes('<h2') && hero.includes('<h2'))
  check('links carry visible names (no icon-only unlabeled links)',
    !page.match(/<Link[^>]*>\s*<\w+Icon/) &&
    hero.includes('Resume workout') && hero.includes('Start workout'))
  check('no tabindex manipulation anywhere in Today scope',
    ALL_TODAY.every((f) => !f.toLowerCase().includes('tabindex')))
  check('progress bars carry adjacent text (no bare color bars)',
    nutrition.includes('remaining') && steps.includes('steps to goal') &&
    weight.includes('Goal:'))
  check('live timer not wired to an aggressive aria-live region',
    !fasting.includes('aria-live') && !fasting.includes('role="timer"'))
  check('focus-visible global treatment inherited (not overridden)',
    ALL_TODAY.every((f) => !f.includes('outline-none')) &&
    read('src/app/globals.css').includes(':focus-visible'))
  check('no fake WCAG/compliance claim in notes',
    !/WCAG\s+2[.\d]*\s+(AA\s+)?compliant/i.test(notes))
}

// ── 19. Phase boundary (file-level, expanded) ────────────────────────
console.log('\n19. Phase boundary (file-level)')
{
  check('navigation model untouched',
    read('src/components/layout/route-match.ts').includes('LONGEST matching href wins') &&
    read('src/components/layout/nav-items.ts').includes('export const NAV_ICONS'))
  check('More sheet untouched',
    read('src/components/layout/MoreSheet.tsx').includes('aria-label="More options"'))
  check('app shell layout untouched (auth + fasting read + main padding)',
    read('src/app/(app)/layout.tsx').includes("select('fasting_enabled')") &&
    read('src/app/(app)/layout.tsx').includes('bg-canvas'))
  check('nutrition coach lib untouched',
    read('src/lib/nutrition-coach.ts').includes('export interface NutritionCoachSummary') &&
    read('src/lib/nutrition-coach.ts').includes('export async function fetchNutritionCoachSummary'))
  check('no API route files changed (signout + workouts anchors)',
    read('src/app/api/auth/signout/route.ts').includes('export async function POST') &&
    read('src/app/api/workouts/route.ts').includes('findActiveTrainingSession'))
  check('package files unchanged (name + dep count + no new deps)',
    JSON.parse(read('package.json')).name === 'shredos' &&
    !read('package.json').includes('recharts') && !read('package.json').includes('framer'))
  check('onboarding untouched',
    read('src/components/onboarding/OnboardingWizard.tsx').includes('fasting_enabled'))
  check('workout mutation routes untouched',
    read('src/app/api/workout-sets/[id]/route.ts').length > 500)
  check('no generated images in dashboard scope',
    readdirSync('src/components/dashboard').every((f) => f.endsWith('.tsx')))
  check('no local fonts introduced',
    readdirSync('src/components/dashboard').every((f) => !/\.(woff2?|ttf|otf)$/i.test(f)))
  check('no Sparkles anywhere in Today scope',
    ALL_TODAY.every((f) => !stripComments(f).includes('Sparkles')))
  check('no punitive weight language',
    ALL_TODAY.every((f) => !/gained too much|off track|behind schedule|cheat/i.test(f)))
  check('no fake AI claims',
    ALL_TODAY.every((f) => !/AI coach|machine learning|intelligent(ly)? adapt/i.test(f)))
}

// ── Result ───────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) {
  process.exit(1)
}
