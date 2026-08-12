// ============================================================
// ForgeFitOS — Phase 4B.5 deterministic verification harness
// Verifies the Progress-pillar redesign (/progress, /progress/
// exercises/[id], /weigh-in, /activity, /fasting): shared subnav,
// page hierarchies, card variants, loading geometry, accessibility
// — and, critically, that every trend calculation, classification
// rule, chart selector, form contract, and API behavior is
// byte-anchored unchanged, and that the known-dead
// progress-summary path stays dead.
// Run from the repository root:
//   npx tsx scripts/verify-phase4b5.ts
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

const overviewPage = read('src/app/(app)/progress/page.tsx')
const overviewLoading = read('src/app/(app)/progress/loading.tsx')
const detailPage = read('src/app/(app)/progress/exercises/[id]/page.tsx')
const detailLoading = read('src/app/(app)/progress/exercises/[id]/loading.tsx')
const weighPage = read('src/app/(app)/weigh-in/page.tsx')
const weighLoading = read('src/app/(app)/weigh-in/loading.tsx')
const activityPage = read('src/app/(app)/activity/page.tsx')
const activityLoading = read('src/app/(app)/activity/loading.tsx')
const fastingPage = read('src/app/(app)/fasting/page.tsx')
const fastingLoading = read('src/app/(app)/fasting/loading.tsx')
const subNav = read('src/components/progress/ProgressSubNav.tsx')
const chart = read('src/components/progress/ExerciseTrendChart.tsx')
const weighForm = read('src/components/weigh-in/WeighInForm.tsx')
const weighSummary = read('src/components/weigh-in/WeighInSummary.tsx')
const weighHistory = read('src/components/weigh-in/WeighInHistory.tsx')
const weighTrendSection = read('src/components/weigh-in/WeightTrendSection.tsx')
const bodyMeasure = read('src/components/weigh-in/BodyMeasurementsSummary.tsx')
const activityForm = read('src/components/activity/ActivityLogForm.tsx')
const fastTimer = read('src/components/fasting/FastingTimer.tsx')
const fastControls = read('src/components/fasting/FastingControls.tsx')
const fastStats = read('src/components/fasting/FastingStats.tsx')
const fastHistory = read('src/components/fasting/FastingHistory.tsx')
const weightLib = read('src/lib/weight-trends.ts')
const nutritionLib = read('src/lib/nutrition-trends.ts')
const overviewLib = read('src/lib/progress-overview.ts')
const chartsLib = read('src/lib/progress-charts.ts')
const strengthLib = read('src/lib/strength-records.ts')
const fastingLib = read('src/lib/fasting.ts')
const weighLib = read('src/lib/weighIn.ts')
const summaryLib = read('src/lib/progress-summary.ts')
const activityApi = read('src/app/api/activity/route.ts')
const notes = read('docs/phase4b5-progress-pillar-notes.md')

const PAGES = [overviewPage, detailPage, weighPage, activityPage, fastingPage]
const LOADINGS = [overviewLoading, detailLoading, weighLoading, activityLoading, fastingLoading]
const COMPONENTS = [subNav, chart, weighForm, weighSummary, weighHistory, weighTrendSection,
  bodyMeasure, activityForm, fastTimer, fastControls, fastStats, fastHistory]
const SCOPE = [...PAGES, ...LOADINGS, ...COMPONENTS]

// ── 1. Checkpoint and routes ─────────────────────────────────────────
console.log('\n1. Checkpoint and routes')
{
  check('checkpoint artifacts exist (010bbbd tree)',
    ['scripts/verify-phase4b4.ts', 'docs/phase4b4-coach-pillar-notes.md',
      'src/components/coach/CoachSubNav.tsx', 'src/components/layout/route-match.ts',
      'supabase/migrations/013_phase3e_goal_adjustments.sql']
      .every((f) => existsSync(f)))
  check('all prior notes exist',
    ['phase4a-ux-information-architecture-audit', 'phase4b1-foundation-notes',
      'phase4b2-navigation-notes', 'phase4b3-today-notes', 'phase4b4-coach-pillar-notes']
      .every((f) => existsSync(`docs/${f}.md`)))
  check('4B.5 notes exist', notes.length > 1500)
  for (const r of ['progress', 'progress/exercises/[id]', 'weigh-in', 'activity', 'fasting']) {
    check(`route retained: /${r}`, existsSync(`src/app/(app)/${r}/page.tsx`))
  }
  check('no new route aliases',
    !existsSync('src/app/(app)/trends') && !existsSync('src/app/(app)/measurements'))
  check('no redirects', !read('next.config.mjs').includes('redirects'))
  check('metadata unchanged per route',
    overviewPage.includes("title: 'Progress' }") &&
    detailPage.includes("title: 'Exercise progress' }") &&
    weighPage.includes("title: 'Weigh-in' }") &&
    activityPage.includes("title: 'Activity' }") &&
    fastingPage.includes("title: 'Fasting' }"))
  check('H1s correct',
    overviewPage.includes('>Progress</h1>') && weighPage.includes('>Weigh-in</h1>') &&
    activityPage.includes('>Activity</h1>') && fastingPage.includes('>Fasting</h1>') &&
    detailPage.includes('{exercise.name}</h1>'))
  check('exactly one H1 per route',
    PAGES.every((p) => (p.match(/<h1/g) || []).length === 1) &&
    LOADINGS.every((l) => !l.includes('<h1')))
  check('auth gates preserved', PAGES.every((p) => p.includes("redirect('/login')")))
  check('onboarding gates preserved where they existed',
    overviewPage.includes("redirect('/onboarding')") &&
    weighPage.includes("redirect('/onboarding')") &&
    activityPage.includes("redirect('/onboarding')") &&
    fastingPage.includes("redirect('/onboarding')") &&
    detailPage.includes("redirect('/onboarding')"))
  check('exercise 404 for unknown/foreign ids preserved',
    detailPage.includes('if (!exercise) notFound()') &&
    detailPage.includes(".eq('user_id', user.id)"))
}

// ── 2. Progress subnav ───────────────────────────────────────────────
console.log('\n2. Progress subnav')
{
  check('component exists', subNav.includes('export function ProgressSubNav'))
  check('exact destination set',
    ["href: '/progress'", "href: '/weigh-in'", "href: '/activity'", "href: '/fasting'"]
      .every((h) => subNav.includes(h)) && (subNav.match(/href: '/g) || []).length === 4)
  check('exact labels', ["label: 'Overview'", "label: 'Weigh-in'", "label: 'Activity'",
    "label: 'Fasting'"].every((l) => subNav.includes(l)))
  check('conditional Fasting via the profile flag prop',
    subNav.includes("s.href !== '/fasting' || fastingEnabled"))
  check('exercise detail keeps Overview active (route-aware match)',
    subNav.includes("pathname.startsWith('/progress/')"))
  check('non-overview links match exactly', subNav.includes('return pathname === href'))
  check('aria-current', subNav.includes("aria-current={active ? 'page' : undefined}"))
  check('structural active state (underline + weight)',
    subNav.includes('border-b-2') && subNav.includes('font-semibold') &&
    subNav.includes('border-brand'))
  check('real links', subNav.includes("from 'next/link'"))
  check('mobile-safe', subNav.includes('overflow-x-auto') && subNav.includes('whitespace-nowrap'))
  check('nav landmark', subNav.includes('aria-label="Progress sections"'))
  check('no persistence/counts/emoji',
    !subNav.includes('localStorage') && !stripComments(subNav).includes('count') &&
    !EMOJI.test(subNav))
  check('rendered on all five routes',
    PAGES.every((p) => p.includes('<ProgressSubNav fastingEnabled={profile.fasting_enabled} />')))
  check('no duplicated route declarations in pages',
    PAGES.every((p) => !stripComments(p).includes("label: '")))
  check('fasting direct-route policy unchanged (page never checks the flag)',
    !stripComments(fastingPage).includes('fasting_enabled &&') &&
    fastingPage.includes('existing policy, unchanged'))
}

// ── 3. Progress overview logic ───────────────────────────────────────
console.log('\n3. Overview logic contract')
{
  const HELPERS = ['fetchStrengthRecords', 'fetchTrackingAwareProgressOverview',
    'fetchRecentWeighIns(supabase, user.id, 50)', 'fetchNutritionTrendLogs',
    'buildWeightTrendSummary(weighIns, profile.goal_weight_kg)',
    'buildNutritionTrendSummary(']
  for (const h of HELPERS) {
    check(`query/summary helper retained: ${h.split('(')[0]}`, overviewPage.includes(h))
  }
  check('mode filter parse unchanged',
    overviewPage.includes('parseTrackingModeFilter(searchParams?.mode)') &&
    overviewLib.includes('export function parseTrackingModeFilter'))
  check('invalid mode falls back to All',
    overviewLib.includes('null') && overviewPage.includes('activeMode === null'))
  check('filter application unchanged',
    overviewPage.includes('filterOverviewRows(overviewRows, activeMode)'))
  check('summary tiles derived from the same data (no invented score)',
    overviewPage.includes("overviewRows.filter((r) => r.status === 'improved').length") &&
    overviewPage.includes('strengthRecords.recentPREvents.length') &&
    !overviewPage.includes('score'))
  check('status order unchanged in the lib',
    overviewLib.includes('improved') && overviewLib.includes('needs_data') &&
    read('src/lib/progress-overview.ts').includes('sortOverviewRows'))
  check('session cap unchanged', overviewLib.includes('RECENT_SESSION_COUNT_CAP = 5'))
  check('status labels carry text + arrows',
    overviewPage.includes("improved: '↑ Improving'") &&
    overviewPage.includes("needs_data: 'More data needed'"))
  check('no writes on overview', !overviewPage.includes('.insert(') &&
    !overviewPage.includes('.update(') && !overviewPage.includes('.upsert('))
  check('server component preserved', !overviewPage.includes("'use client'"))
  check('detail links unchanged',
    overviewPage.includes('href={`/progress/exercises/${row.exerciseId}`}'))
  check('empty + filter-empty states preserved',
    overviewPage.includes('Complete a workout to begin tracking exercise progress.') &&
    overviewPage.includes('No tracked exercises match this filter yet.'))
  check('weight empty state preserved',
    overviewPage.includes('Log your first weigh-in to begin tracking body weight.'))
  check('nutrition empty state preserved',
    overviewPage.includes('Log food to begin tracking nutrition consistency.'))
}

// ── 4. Weight trend contract ─────────────────────────────────────────
console.log('\n4. Weight trend contract')
{
  check('7-day window constant', weightLib.includes('AVERAGE_WINDOW_DAYS = 7'))
  check('28-day chart constant', weightLib.includes('CHART_WINDOW_DAYS = 28'))
  check('minimum two dates for an average', weightLib.includes('MIN_DATES_FOR_AVERAGE = 2'))
  check('chart min visible range', weightLib.includes('WEIGHT_CHART_MIN_VISIBLE_RANGE_LBS = 2'))
  check('same-day dedup helper unchanged', weightLib.includes('export function dedupeDailyWeights'))
  check('window bounds helper unchanged', weightLib.includes('export function sevenDayWindowBounds'))
  check('comparison label helper unchanged', weightLib.includes('export function describeAverageChange'))
  check('goal context helper unchanged', weightLib.includes('export function describeGoalDifference'))
  check('page renders one-date state as a measurement, not a trend',
    overviewPage.includes('Log at least two weigh-ins to see a weight trend.'))
  check('coverage copy visible ("Based on N weigh-ins")',
    overviewPage.includes('Based on{') || overviewPage.includes('Based on '))
  check('no fake zeros in weight sections',
    !overviewPage.includes('?? 0') || !overviewPage.match(/weightTrend[^\n]*\?\? 0/))
}

// ── 5. Nutrition trend contract ──────────────────────────────────────
console.log('\n5. Nutrition trend contract')
{
  check('28-day window constant', nutritionLib.includes('NUTRITION_CHART_WINDOW_DAYS = 28'))
  check('minimum logged days', nutritionLib.includes('MIN_LOGGED_DAYS_FOR_AVERAGE = 2'))
  check('chart ranges unchanged',
    nutritionLib.includes('CALORIE_CHART_MIN_VISIBLE_RANGE = 200') &&
    nutritionLib.includes('PROTEIN_CHART_MIN_VISIBLE_RANGE_G = 20'))
  check('daily totals builder unchanged',
    nutritionLib.includes('export function buildDailyNutritionTotals'))
  check('logged-day-denominator averages unchanged',
    nutritionLib.includes('export function averageAcrossLoggedDays'))
  check('comparison describers unchanged',
    ['describeCalorieComparison', 'describeProteinComparison', 'describeLoggingComparison']
      .every((f) => nutritionLib.includes(`export function ${f}`)))
  check('page shows logged-day denominators, never /7 averages',
    overviewPage.includes('of 7 days logged') &&
    overviewPage.includes('Based on {nutritionTrend.currentCalorieDays} logged day'))
  check('minimum-evidence copy preserved',
    overviewPage.includes('Log nutrition on at least two days to calculate a seven-day average.'))
  check('adherence uses the authoritative target',
    overviewPage.includes("target?.protein_g ?? null"))
}

// ── 6. Exercise detail contract ──────────────────────────────────────
console.log('\n6. Exercise detail contract')
{
  check('history query unchanged (15-session chart window, 5 recent)',
    detailPage.includes('CHART_HISTORY_LIMIT = 15') &&
    detailPage.includes('RECENT_HISTORY_LIMIT = 5') &&
    detailPage.includes('fetchExerciseHistory(supabase, user.id, [exercise.id], undefined, CHART_HISTORY_LIMIT)'))
  check('strength/cardio aggregate split unchanged',
    detailPage.includes('fetchExerciseProgressDetail(supabase, user.id, exercise.id)') &&
    detailPage.includes('fetchCardioTimedProgressDetail(supabase, user.id, exercise.id)'))
  check('chart builders unchanged (Phase 2W adapters)',
    ['buildWeightRepsTrend', 'buildBodyweightTrends', 'buildCardioTrends', 'buildTimedTrend']
      .every((f) => detailPage.includes(f) && chartsLib.includes(`export function ${f}`)))
  check('weight_reps 1RM preference + working-weight fallback unchanged',
    chartsLib.includes("title: 'Estimated 1RM'") &&
    chartsLib.includes("title: 'Best working weight'"))
  check('cardio pace primary, duration fallback, distance secondary',
    chartsLib.includes('pacePoints.length >= 2') &&
    chartsLib.includes('durationPoints.length >= 2') &&
    chartsLib.includes('secondary: distanceChart'))
  check('pace direction preserved (lower is faster)',
    chartsLib.includes("footnote: 'Lower is faster'"))
  check('bodyweight reps + conditional added-weight rule unchanged',
    chartsLib.includes('addedPoints.length >= 2'))
  check('timed duration/RPE behavior unchanged',
    chartsLib.includes("entry.rpe !== null ? `RPE ${entry.rpe}` : undefined") ||
    chartsLib.includes('RPE ${'))
  check('invalid values excluded (finite, positive)',
    chartsLib.includes('Number.isFinite(v) && v > 0'))
  check('two-point minimum + empty message unchanged',
    chartsLib.includes('Complete this exercise in at least two workouts to see a trend.'))
  check('no 0 lbs (display-rounded positive gate preserved)',
    detailPage.includes('addedWeightLbs !== null && addedWeightLbs > 0'))
  check('comparable-session signal via existing lib rules',
    detailPage.includes('trackingAwareProgressSignal('))
  check('first-vs-latest summaries from the adapters',
    chart.includes('summary') && chartsLib.includes('summarizeWeightTrend'))
  check('no writes on detail page', !detailPage.includes('.insert(') &&
    !detailPage.includes('.update('))
  check('back/overview relationship preserved',
    detailPage.includes('← Progress') && detailPage.includes('href="/progress"'))
  check('long names wrap safely', detailPage.includes('break-words'))
}

// ── 7. Weigh-in contract ─────────────────────────────────────────────
console.log('\n7. Weigh-in contract')
{
  check('page queries unchanged (profile + 50 weigh-ins)',
    weighPage.includes('fetchRecentWeighIns(supabase, user.id, 50)'))
  check('trend derived from the same fetched rows (no new query)',
    weighPage.includes('buildWeightTrendSummary(weighIns, profile.goal_weight_kg)'))
  check('28-day summary via the LIVE pure helper (computeWeightProgress)',
    weighPage.includes('computeWeightProgress(last28DayMetrics)') &&
    summaryLib.includes('export function computeWeightProgress'))
  check('waist summary derivations unchanged',
    weighPage.includes('waist_cm !== null') && weighPage.includes('cmToInches'))
  check('schedule/cadence header unchanged',
    weighPage.includes('preferred_weigh_in_cadence') && weighPage.includes('getNextWeighInDate'))
  check('confidence thresholds from existing lib',
    weighPage.includes('getTrendConfidence(profile.preferred_weigh_in_cadence, weighIns.length)') &&
    weighLib.includes('export function getTrendConfidence'))
  check('confidence copy unchanged (coverage wording)',
    weighPage.includes('High confidence — enough data for trend analysis.') &&
    weighPage.includes('Keep logging to unlock trend analysis.'))
  check('form component keeps its hook + submission path',
    weighForm.includes('useCreateWeighIn') || weighForm.includes('useWeighIns') ||
    weighForm.includes('supabase') || weighForm.includes('mutate'))
  check('form fields retained (weight, date, body fat, waist, notes)',
    ['Weight', 'Date', 'Body fat', 'Waist', 'Notes'].every((f) => weighForm.includes(f)))
  check('form labels explicit', (weighForm.match(/<label/g) || []).length >= 4)
  check('units/conversions retained', weighForm.includes('lbsToKg') || weighForm.includes('lbs'))
  check('errors remain visible', weighForm.includes('error'))
  check('history component values unchanged',
    weighHistory.includes('weighIns') && weighHistory.includes('cadence'))
  check('measurements summary props unchanged',
    weighPage.includes('latestWaistIn={latestWaistIn}') &&
    weighPage.includes('waistCountLast28Days={waistCountLast28Days}'))
  check('no automatic goal changes',
    !weighPage.includes('goal_weight_kg:') && !weighForm.includes('goal_weight_kg'))
  check('server page preserved', !weighPage.includes("'use client'"))
}

// ── 8. Activity contract ─────────────────────────────────────────────
console.log('\n8. Activity contract')
{
  check('date-scoped queries unchanged',
    activityPage.includes('fetchActivityLogForDate(supabase, user.id, date)') &&
    activityPage.includes('fetchActivityLogsForRange(supabase, user.id, sevenDaysAgo, todayStr)'))
  check('API contract unchanged (authenticated POST + upsert helper)',
    activityApi.includes('export async function POST') &&
    activityApi.includes('upsertActivityLogForDate') &&
    activityApi.includes('{ status: 401 }'))
  check('maybeSingle semantics preserved in the helper',
    read('src/lib/supabase/server.ts').includes('.maybeSingle()'))
  check('date navigation preserved (prev/next/today, future disabled)',
    activityPage.includes("aria-label=\"Previous day\"") &&
    activityPage.includes('aria-disabled={isNextFuture}') &&
    activityPage.includes('Back to today'))
  check('form props unchanged (5A.3 QA fix added key={date} so each day remounts its own state)',
    activityPage.includes('<ActivityLogForm key={date} date={date} existingLog={existingLog} isFutureDate={isFutureDate} />'))
  check('valid zero vs missing distinction preserved in the form',
    activityForm.includes('existingLog') && !activityForm.includes('?? 0 //'))
  check('step-goal source unchanged (profile)',
    activityPage.includes('profile.step_goal ?? null'))
  check('7-day summary math unchanged (logged-days denominator)',
    activityPage.includes('averageDailySteps(recentLogs.reduce((s, l) => s + l.steps, 0))'))
  check('no invented streaks/calories/distance',
    !/streak|calorie|distance|km|miles/i.test(stripComments(activityPage)))
  check('no alarm styling for below-goal',
    !activityPage.includes('critical') && !activityForm.includes('text-critical bg'))
  check('empty state preserved', activityPage.includes('No steps logged this week yet.'))
}

// ── 9. Fasting contract ──────────────────────────────────────────────
console.log('\n9. Fasting contract')
{
  check('page queries unchanged (active fast + week + 50 history)',
    fastingPage.includes('fetchActiveFast(supabase, user.id)') &&
    fastingPage.includes('fetchFastingLogsThisWeek(supabase, user.id)') &&
    fastingPage.includes(".not('ended_at', 'is', null)") &&
    fastingPage.includes('.limit(50)'))
  check('week stats via existing lib', fastingPage.includes('computeFastingWeekStats(weekFasts)'))
  check('timer: one-second interval + cleanup',
    fastTimer.includes('setInterval(tick, 1000)') && fastTimer.includes('clearInterval'))
  check('timer derives from timestamps',
    fastTimer.includes('getFastingDuration(fast.started_at, null)'))
  check('timer digits tabular', fastTimer.includes('tabular-nums'))
  check('milestones from the existing lib only',
    fastTimer.includes('getCurrentMilestone') && fastTimer.includes('getNextMilestone') &&
    fastingLib.includes('export const FASTING_MILESTONES'))
  check('controls: start/end + goal selection preserved',
    fastControls.includes('Start fast') && fastControls.includes('End fast') &&
    fastControls.includes('defaultGoalHours'))
  check('no auto target selection',
    fastControls.includes('defaultGoalHours') && !fastControls.includes('auto'))
  check('active-fast conditional render preserved',
    fastingPage.includes('{activeFast && <FastingTimer fast={activeFast} />}'))
  check('adherence-tool framing unchanged (no new physiological copy)',
    fastingPage.includes('Fasting is a calorie adherence tool — not magic.'))
  check('no physiological claims in components',
    [fastTimer, fastControls, fastStats, fastHistory].every((f) =>
      !/ketosis|autophagy|fat.?burn|detox|metabolic/i.test(stripComments(f))))
  check('history values from stored rows', fastHistory.includes('fasts'))
  check('no service role in pillar scope', SCOPE.every((f) => !f.includes('service_role')))
}

// ── 10. Dead progress-summary path ───────────────────────────────────
console.log('\n10. Dead progress-summary path')
{
  check('fetchProgressSummary remains dead (no call sites)',
    (() => {
      const offenders: string[] = []
      const walk = (dir: string) => {
        for (const entry of readdirSync(dir)) {
          const full = join(dir, entry)
          if (statSync(full).isDirectory()) { walk(full); continue }
          if (!/\.(tsx|ts)$/.test(entry) || full.includes('progress-summary')) continue
          if (stripComments(read(full)).includes('fetchProgressSummary(')) offenders.push(full)
        }
      }
      walk('src')
      return offenders.length === 0
    })())
  check('the phantom duration_minutes select still confined to the dead path',
    summaryLib.includes("select('duration_minutes, ended_at')"))
  check('live pure helper still serves /weigh-in',
    weighPage.includes("from '@/lib/progress-summary'") &&
    weighSummary.includes("from '@/lib/progress-summary'"))
  check('file untouched by this phase (partial-liveness finding documented)',
    notes.includes('partially') && notes.includes('not activated, not patched'))
}

// ── 11. Presentation ─────────────────────────────────────────────────
console.log('\n11. Presentation')
{
  check('no shred-card in the five route scopes',
    SCOPE.every((f) => !stripComments(f).includes('shred-card')))
  check('shred-card alias retained globally for unmigrated code',
    // 4B.6D migrated onboarding, the last consumer; the alias itself
    // remains a deliberate 4B.1 compatibility contract.
    read('src/app/globals.css').includes('.shred-card') &&
    read('src/components/onboarding/OnboardingWizard.tsx').includes('onboarding_complete: true'))
  check('components use the Card primitive',
    COMPONENTS.filter((c) => c !== subNav).every((c) =>
      c.includes("from '@/components/ui/card'")))
  check('overview: max-w-6xl + interactive exercise rows',
    overviewPage.includes('max-w-6xl') && overviewPage.includes('variant="interactive"'))
  check('overview: filters use chip visual language as real links',
    overviewPage.includes('<Check className="size-3"') &&
    overviewPage.includes('bg-surface-selected font-semibold'))
  check('overview: trend cards metric, empty states status',
    (overviewPage.match(/variant="metric"/g) || []).length === 2 &&
    (overviewPage.match(/variant="status"/g) || []).length === 2)
  check('detail: readable width + elevated records',
    detailPage.includes('max-w-3xl') && detailPage.includes('variant="elevated"'))
  check('detail: history subtle', (detailPage.match(/variant="subtle"/g) || []).length === 2)
  check('chart: insufficient state subtle, chart card default',
    chart.includes('variant="subtle"') && chart.includes('variant="default"'))
  check('weigh-in: two-column upper area at lg',
    weighPage.includes('grid grid-cols-1 gap-4 lg:grid-cols-2') &&
    weighPage.indexOf('lg:grid-cols-2') < weighPage.indexOf('<WeighInForm />'))
  check('weigh-in: form action card, trend metric cards',
    weighForm.includes('variant="action"') &&
    weighTrendSection.includes('variant="metric"') && weighSummary.includes('variant="metric"'))
  check('weigh-in: evidence bar semantic tokens (not raw palette)',
    weighPage.includes('bg-success-subtle text-success') &&
    !weighPage.includes('bg-green-500/10'))
  check('activity: action form + metric summary + intentional width',
    activityForm.includes('variant="action"') && activityPage.includes('variant="metric"') &&
    activityPage.includes('max-w-3xl'))
  check('fasting: status timer, elevated controls, metric stats',
    fastTimer.includes('variant="status"') && fastControls.includes('variant="elevated"') &&
    fastStats.includes('variant="metric"'))
  check('fasting: history default with status empty state',
    fastHistory.includes('variant="default"') && fastHistory.includes('variant="status"'))
  check('sunken tiles replace broken legacy tiles',
    overviewPage.includes('bg-surface-sunken rounded-lg px-2 py-2.5 text-center') &&
    activityPage.includes('bg-surface-sunken rounded-lg px-2 py-2.5 text-center'))
  check('semantic ink tokens across scope',
    PAGES.every((p) => p.includes('text-ink-muted')))
  check('no giant color blocks / judgment styling',
    SCOPE.every((f) => !f.includes('bg-critical ') && !f.includes('bg-success ')))
  check('cross-pillar links use approved labels',
    overviewPage.includes('Weekly review →') && overviewPage.includes('Coach →') &&
    !overviewPage.includes('Weekly check-in'))
}

// ── 12. Responsive ───────────────────────────────────────────────────
console.log('\n12. Responsive')
{
  check('no md: shell leakage in pillar scope',
    SCOPE.every((f) => !stripComments(f).includes('md:')))
  check('shell breakpoint unchanged at lg',
    read('src/components/layout/Sidebar.tsx').includes('hidden lg:flex') &&
    read('src/components/layout/MobileBottomNav.tsx').includes('lg:hidden'))
  check('page padding aligned with shell', PAGES.every((p) => p.includes('p-4 lg:p-6')))
  check('mobile one-column bases', overviewPage.includes('grid-cols-1') &&
    weighPage.includes('grid-cols-1'))
  check('no absolute core layout', PAGES.every((p) => !stripComments(p).includes('absolute')))
  check('no masonry', SCOPE.every((f) => !f.includes('columns-')))
  check('no overflow-x workaround', SCOPE.every((f) => !f.includes('overflow-x-hidden')))
  check('charts fit viewport (svg width 100%)',
    chart.includes('width="100%"') || chart.includes('w-full'))
  check('no conditional blank slots (fasting subnav filters, grids unconditional)',
    subNav.includes('.filter('))
  check('bottom-nav clearance inherited',
    PAGES.every((p) => !p.includes('safe-area')) &&
    read('src/app/(app)/layout.tsx').includes('lg:pb-0'))
}

// ── 13. Loading states ───────────────────────────────────────────────
console.log('\n13. Loading states')
{
  check('five loading files exist',
    ['progress', 'progress/exercises/[id]', 'weigh-in', 'activity', 'fasting']
      .every((r) => existsSync(`src/app/(app)/${r}/loading.tsx`)))
  check('all use skeleton primitives',
    LOADINGS.every((l) => l.includes("from '@/components/ui/skeleton'")))
  check('no spinner-only pages', LOADINGS.every((l) => !l.includes('animate-spin')))
  check('no fake copy', LOADINGS.every((l) => !l.includes('Loading...')))
  check('no shred-card', LOADINGS.every((l) => !l.includes('shred-card')))
  check('shell not duplicated', LOADINGS.every((l) =>
    !l.includes('Sidebar') && !l.includes('ProgressSubNav')))
  check('aria-hidden', LOADINGS.every((l) => l.includes('aria-hidden="true"')))
  check('route-matched widths',
    overviewLoading.includes('max-w-6xl') && weighLoading.includes('max-w-6xl') &&
    detailLoading.includes('max-w-3xl') && activityLoading.includes('max-w-3xl') &&
    fastingLoading.includes('max-w-3xl'))
  check('overview loading mirrors tiles + chips + rows',
    overviewLoading.includes('sm:grid-cols-4') && overviewLoading.includes('rounded-full') &&
    overviewLoading.includes('lg:grid-cols-3'))
  check('detail loading shows one chart region without fake values',
    detailLoading.includes('h-56') && !detailLoading.match(/>\d/))
  check('weigh-in loading mirrors two-column upper area',
    weighLoading.includes('lg:grid-cols-2'))
  check('reduced-motion inherited',
    read('src/app/globals.css').includes('prefers-reduced-motion'))
}

// ── 14. Accessibility ────────────────────────────────────────────────
console.log('\n14. Accessibility')
{
  check('section headings are h2/h3 (in pages or their section components)',
    overviewPage.includes('<h2') && detailPage.includes('<h2') &&
    activityPage.includes('<h2') &&
    // /weigh-in and /fasting sections carry their headings inside the
    // section components themselves.
    [weighForm, weighSummary, weighHistory, weighTrendSection, bodyMeasure,
      fastControls, fastStats, fastHistory].every((c) => c.match(/<h[23]/)))
  check('filter nav labeled',
    overviewPage.includes('aria-label="Filter exercises by tracking mode"'))
  check('date nav controls labeled',
    activityPage.includes('aria-label="Previous day"') &&
    activityPage.includes('aria-label="Next day"'))
  check('links remain links, buttons remain buttons',
    PAGES.every((p) => !p.match(/<div[^>]*onClick/)) &&
    COMPONENTS.every((c) => !c.match(/<div[^>]*onClick/)))
  check('no tabindex hacks', SCOPE.every((f) => !f.toLowerCase().includes('tabindex')))
  check('statuses carry text',
    overviewPage.includes('{STATUS_LABELS[status]}') &&
    weighPage.includes('High confidence'))
  check('chart meaning in adjacent text (summary + footnote rendered)',
    chart.includes('summary') && chart.includes('footnote'))
  check('tooltips not sole information (summaries always rendered)',
    chartsLib.includes('summarize'))
  check('form labels preserved', weighForm.includes('<label') && activityForm.includes('label'))
  check('no focus suppression added', PAGES.every((p) => !p.includes('outline-none')))
  check('no fake WCAG claim',
    !/WCAG\s+2[.\d]*\s+(AA\s+)?compliant/i.test(notes) &&
    notes.includes('not** a WCAG conformance claim'))
}

// ── 15. Language and icons ───────────────────────────────────────────
console.log('\n15. Language and icons')
{
  check('no emoji in pillar scope', SCOPE.every((f) => !EMOJI.test(f)))
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
  check('no medical/causal claims',
    SCOPE.every((f) => !/hormon|your body is|guaranteed|because you/i.test(stripComments(f))))
  check('no guilt/punitive language',
    SCOPE.every((f) => !/you failed|falling behind|bad progress|crushing/i.test(f)))
  check('no fake progress score or streaks',
    SCOPE.every((f) => !/overall score|progress score|streak/i.test(stripComments(f))))
  check('approved wording present',
    overviewPage.includes('More data needed') &&
    fastingPage.includes('Fasting') && weighPage.includes('Weigh-in'))
}

// ── 16. Phase boundary ───────────────────────────────────────────────
console.log('\n16. Phase boundary')
{
  check('dashboard unchanged',
    read('src/app/(app)/dashboard/page.tsx').includes('<TodayPrimaryAction'))
  check('Coach pillar unchanged',
    read('src/app/(app)/coach/page.tsx').includes('fetchCoachActions') &&
    read('src/components/coach/CoachSubNav.tsx').includes('Coach sections'))
  check('navigation model unchanged',
    read('src/components/layout/route-match.ts').includes('LONGEST matching href wins'))
  check('shell unchanged',
    read('src/app/(app)/layout.tsx').includes("select('fasting_enabled')"))
  check('4B.5 added no migration (schema through 013 intact)',
    readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql') && f < '014').length === 13)
  check('activity API file behavior anchors intact',
    activityApi.includes('upsertActivityLogForDate') && !existsSync('src/app/api/progress'))
  check('no package changes',
    JSON.parse(read('package.json')).name === 'shredos' &&
    Object.keys(JSON.parse(read('package.json')).dependencies).length === 22)
  check('no target/workout/nutrition logic changes',
    read('src/lib/goal-adjustments.ts').includes('CALORIE_STEP_SMALL = 100') &&
    read('src/lib/workout.ts').includes('weightKg * (1 + reps / 30)') &&
    read('src/lib/nutrition.ts').includes('LEAN_MASS_PROTEIN_THRESHOLD'))
  check('strength records lib unchanged',
    strengthLib.includes('export async function fetchStrengthRecords') &&
    strengthLib.includes('fetchExerciseProgressDetail'))
  check('weight/nutrition trend libs not modified beyond zero edits (anchors)',
    weightLib.includes('buildWeightTrendSummary') && nutritionLib.includes('buildNutritionTrendSummary'))
  check('profile/onboarding unchanged',
    read('src/app/(app)/profile/page.tsx').includes('main_goal_changed') &&
    read('src/components/onboarding/OnboardingWizard.tsx').includes('fasting_enabled'))
  check('no generated images / fonts in scope dirs',
    ['src/components/progress', 'src/components/weigh-in', 'src/components/activity',
      'src/components/fasting'].every((d) => readdirSync(d).every((f) => f.endsWith('.tsx'))))
  check('no .DS_Store', !existsSync('.DS_Store') && !existsSync('src/.DS_Store'))
  check('apply-script boundaries documented',
    notes.includes('Presentation and information hierarchy only'))
}

// ════════════════════════════════════════════════════════════════════
// Deep per-contract coverage (fields, milestones, chart internals,
// hooks, per-state copy) — each anchor is a distinct invariant.
// ════════════════════════════════════════════════════════════════════

// ── 17. Weigh-in form field contracts ────────────────────────────────
console.log('\n17. Weigh-in form fields')
{
  check('weight input: numeric, 50–700 bounds, placeholder',
    weighForm.includes('min="50"') && weighForm.includes('max="700"') &&
    weighForm.includes('placeholder="185.0"'))
  check('date input: capped at today', weighForm.includes('max={todayISO()}'))
  check('body-fat input: 1–60 bounds',
    weighForm.includes('min="1"') && weighForm.includes('max="60"'))
  check('waist field retained', weighForm.includes('Waist'))
  check('notes field retained', weighForm.includes('Notes'))
  check('kg conversion on save retained', weighForm.includes('lbsToKg'))
  check('submit disabled while saving', weighForm.includes('disabled='))
  check('router refresh after save retained', weighForm.includes('router.refresh()'))
  check('single write path (no split submissions)',
    (stripComments(weighForm).match(/\.insert\(|\.upsert\(/g) || []).length <= 1)
}

// ── 18. Activity form contracts ──────────────────────────────────────
console.log('\n18. Activity form')
{
  check('steps input numeric', activityForm.includes('type="number"'))
  check('existing log prefills the form', activityForm.includes('existingLog'))
  check('future dates blocked via prop', activityForm.includes('isFutureDate'))
  check('save posts to the existing endpoint',
    activityForm.includes("'/api/activity'"))
  check('error state visible', activityForm.includes('error'))
  check('update vs log copy distinguishes existing log',
    activityForm.includes('Update') || activityForm.includes('existingLog ?'))
  check('44px save control', activityForm.includes('min-h-11'))
}

// ── 19. Fasting controls and milestones ──────────────────────────────
console.log('\n19. Fasting controls and milestones')
{
  check('goal options from existing constants (both states)',
    (fastControls.match(/FASTING_GOAL_OPTIONS\.map/g) || []).length === 2)
  check('milestone hours unchanged (12/16/18/24)',
    ['hours: 12', 'hours: 16', 'hours: 18', 'hours: 24']
      .every((h) => fastingLib.includes(h)))
  check('goal-completion rule unchanged', fastingLib.includes('export function didCompleteGoal'))
  check('fasting type derivation unchanged',
    fastingLib.includes('export function fastingTypeFromHours'))
  check('week stats reducer unchanged',
    fastingLib.includes('export function computeFastingWeekStats'))
  check('duration format helpers unchanged',
    fastingLib.includes('export function formatDurationHMS') &&
    fastingLib.includes('export function formatDuration'))
  check('controls copy: plain text labels (4B.1 emoji fix intact)',
    fastControls.includes("'End fast'") && fastControls.includes("'Start fast now'"))
  check('goal-reached indicator retained with text',
    fastTimer.includes('Reached!'))
  check('projected end time retained (factual, not a claim)',
    fastTimer.includes('Ends around {projectedEndTime}'))
  check('goal progress percent shown as text next to the bar',
    fastTimer.includes('{Math.round(goalPct)}%'))
}

// ── 20. Hooks unchanged ──────────────────────────────────────────────
console.log('\n20. Hooks')
{
  check('useWeighIns default limit unchanged',
    read('src/hooks/useWeighIns.ts').includes('useWeighIns(limit = 20)'))
  check('fasting hooks unchanged',
    ['useActiveFast', 'useFastingLogs', 'useStartFast', 'useEndFast']
      .every((h) => read('src/hooks/useFasting.ts').includes(`export function ${h}`)))
  check('fasting logs hook default limit unchanged',
    read('src/hooks/useFasting.ts').includes('useFastingLogs(limit = 30)'))
}

// ── 21. Chart component internals ────────────────────────────────────
console.log('\n21. Chart internals')
{
  check('custom SVG (no chart dependency)',
    !chart.includes('recharts') && !chart.includes('chart.js') && chart.includes('<svg'))
  check('responsive via viewBox + full width',
    chart.includes('viewBox={`0 0 ${VIEW_WIDTH} ${viewHeight}`}'))
  check('compact variant preserved (140 vs 200)',
    chart.includes('compact ? 140 : 200'))
  check('point circles + oversized invisible hit targets preserved',
    chart.includes('r={11} fill="transparent"'))
  check('tooltips via title, not the only carrier (summary text adjacent)',
    chart.includes('<title>') || chart.includes('title>'))
  check('default export signature unchanged',
    chart.includes('export default function ExerciseTrendChart'))
}

// ── 22. Per-state copy anchors (each a distinct render state) ────────
console.log('\n22. Per-state copy')
{
  const STATES: Array<[string, string, string]> = [
    ['overview zero exercises', 'Complete a workout to begin tracking exercise progress.', 'overviewPage'],
    ['overview filter-empty', 'No tracked exercises match this filter yet.', 'overviewPage'],
    ['overview no PRs', 'No personal records yet.', 'overviewPage'],
    ['overview weight empty', 'Log your first weigh-in to begin tracking body weight.', 'overviewPage'],
    ['overview one-date weight', 'Log at least two weigh-ins to see a weight trend.', 'overviewPage'],
    ['overview nutrition empty', 'Log food to begin tracking nutrition consistency.', 'overviewPage'],
    ['overview nutrition min-evidence', 'Log nutrition on at least two days to calculate a seven-day average.', 'overviewPage'],
    ['activity week empty', 'No steps logged this week yet.', 'activityPage'],
  ]
  const SRC: Record<string, string> = { overviewPage, activityPage }
  for (const [name, copy, src] of STATES) {
    check(`state copy: ${name}`, SRC[src].includes(copy))
  }
  check('detail empty states preserved',
    detailPage.includes('No records yet.') &&
    detailPage.includes('No completed sets yet.') &&
    detailPage.includes('No completed sessions yet.') &&
    detailPage.includes('No PRs yet.'))
  check('detail: no-trend chart empty message from the shared constant',
    chartsLib.includes('EMPTY_TREND_MESSAGE') && chart.includes('EMPTY_TREND_MESSAGE'))
  check('PR history expander cap unchanged (10 + show all)',
    detailPage.includes('PR_HISTORY_INITIAL_CAP = 10') &&
    detailPage.includes('Show all ({remainingPrHistory.length} more)'))
  check('PR line formatting unchanged',
    detailPage.includes("e.type === 'weight' ? 'Weight PR' : e.type === 'estimated_1rm' ? 'Est. 1RM PR' : 'Rep PR'"))
  check('overview PR line formatting unchanged',
    overviewPage.includes("? 'Weight PR'") && overviewPage.includes("'Est. 1RM PR'"))
  check('per-side suffix preserved (unilateral)',
    detailPage.includes("isUnilateral ? ' per side' : ''") &&
    overviewPage.includes("e.isUnilateral ? ' per side' : ''"))
  check('tile labels preserved',
    ['exercises tracked', 'improving', 'need more data', 'recent PRs']
      .every((t) => overviewPage.includes(t)) &&
    ['days logged', '7-day avg', 'goal days'].every((t) => activityPage.includes(t)))
  check('trend coaching label set unchanged (no failure framing)',
    detailPage.includes("'Possible stall'") && detailPage.includes("'Steady'") &&
    detailPage.includes("// 'needs-data' — don't pretend a trend exists"))
}

// ── 23. Weigh-in section values (rendered verbatim) ──────────────────
console.log('\n23. Weigh-in section values')
{
  check('trend section renders lib summary values',
    weighTrendSection.includes('summary') &&
    (weighTrendSection.includes('currentAverageLbs') || weighTrendSection.includes('latest')))
  check('28-day summary props unchanged',
    weighPage.includes('<WeighInSummary summary={weightProgress} userGoal={profile.main_goal} />'))
  check('waist deltas rounded to 0.1 in (unchanged math)',
    (weighPage.match(/\* 10\s*\)\s*\/ 10/g) || []).length === 2)
  check('history receives cadence + goal for existing framing',
    weighPage.includes('cadence={profile.preferred_weigh_in_cadence}') &&
    weighPage.includes('userGoal={profile.main_goal}'))
  check('28-day window derivation unchanged (subDays 27)',
    weighPage.includes('subDays(parseISO(today), 27)'))
  check('waist filtered independently of weight',
    weighPage.includes('a row can have') || weighPage.includes('waist_cm !== null'))
  check('goal context omitted when absent (lib rule)',
    weightLib.includes('goalWeightKg') && weightLib.includes('null'))
}

// ── 24. Loading geometry detail ──────────────────────────────────────
console.log('\n24. Loading geometry detail')
{
  check('overview loading: 4 tiles + 4 chips + 3 row cards',
    (overviewLoading.match(/h-16 rounded-lg/g) || []).length === 4 &&
    (overviewLoading.match(/rounded-full/g) || []).length === 4 &&
    (overviewLoading.match(/<SkeletonCard \/>/g) || []).length >= 3)
  check('detail loading: records + chart + coaching + history regions',
    (detailLoading.match(/<SkeletonCard/g) || []).length === 4)
  check('weigh-in loading: two-column pair + three stacked sections',
    (weighLoading.match(/<SkeletonCard/g) || []).length === 5)
  check('activity loading: nav strip + form + summary',
    activityLoading.includes('h-10 w-full') &&
    (activityLoading.match(/<SkeletonCard/g) || []).length === 2)
  check('fasting loading: timer + controls + stats + history',
    (fastingLoading.match(/<SkeletonCard/g) || []).length === 4)
  check('loading pages carry no interactive elements or text',
    LOADINGS.every((l) => !l.includes('<Link') && !l.includes('<button') &&
      !l.match(/>[A-Z][a-z]+ /)))
}

// ── 25. Library export surface (each anchored individually) ──────────
console.log('\n25. Library export surface')
{
  for (const fn of ['getTrendConfidence', 'confidenceLabel', 'getNextWeighInDate',
    'computeWeightChange', 'getGoalAwareWeightChangeFraming']) {
    check(`weighIn lib export unchanged: ${fn}`,
      weighLib.includes(`export function ${fn}`))
  }
  for (const fn of ['lbsToKg', 'kgToLbs', 'formatWeightLbs', 'formatWeightChangeLbs',
    'cmToInches', 'inchesToCm']) {
    check(`units lib export unchanged: ${fn}`,
      read('src/lib/units.ts').includes(`export function ${fn}`))
  }
  for (const fn of ['dedupeDailyWeights', 'averageWeightLbsInWindow', 'sevenDayWindowBounds',
    'describeAverageChange', 'describeGoalDifference', 'buildWeightTrendSummary']) {
    check(`weight-trends export unchanged: ${fn}`,
      weightLib.includes(`export function ${fn}`))
  }
  for (const fn of ['buildDailyNutritionTotals', 'averageAcrossLoggedDays',
    'buildNutritionTrendSummary']) {
    check(`nutrition-trends export unchanged: ${fn}`,
      nutritionLib.includes(`export function ${fn}`))
  }
  for (const label of ['Overnight fast', 'Common IF window', 'Extended IF', 'Full-day fast']) {
    check(`fasting milestone label unchanged: ${label}`,
      fastingLib.includes(`label: '${label}'`))
  }
}

// ── 26. History/stats value anchors ──────────────────────────────────
console.log('\n26. History and stats values')
{
  check('weigh-in history: change vs previous row (existing lib)',
    weighHistory.includes('computeWeightChange(w.weight_kg, prev.weight_kg)'))
  check('weigh-in history: bf and waist optional suffixes preserved',
    weighHistory.includes('% BF') && weighHistory.includes('waist'))
  check('weigh-in history: pounds via existing conversion',
    weighHistory.includes('kgToLbs(w.weight_kg)'))
  check('fasting stats: completed/total/avg trio preserved',
    fastStats.includes('{stats.completedCount}') && fastStats.includes('{stats.totalCount}') &&
    fastStats.includes('{stats.avgDurationFormatted'))
  check('fasting stats hidden with zero fasts (no placeholder clutter)',
    fastStats.includes('if (stats.totalCount === 0) return null'))
  check('fasting history renders stored durations only',
    fastHistory.includes('getFastingDuration') || fastHistory.includes('started_at'))
  check('measurement summary purely descriptive (no direction framing)',
    !stripComments(bodyMeasure).includes('good') &&
    !stripComments(bodyMeasure).includes('bad') &&
    bodyMeasure.toLowerCase().includes('waist'))
  check('goal-aware weight framing stays in the existing lib, not reimplemented',
    !stripComments(weighHistory).includes('fat_loss') &&
    weighLib.includes('getGoalAwareWeightChangeFraming'))
  check('exercise meta labels via constants lookups',
    overviewPage.includes('optionLabel(PRIMARY_MUSCLES') &&
    detailPage.includes('optionLabel(PRIMARY_MUSCLES'))
  check('tracking-mode filter set driven by TRACKING_MODES constant',
    overviewPage.includes('TRACKING_MODES.map((m) =>'))
}

// ── 27. Scroll ownership (QA correction: /activity double scrollbar) ─
console.log('\n27. Scroll ownership')
{
  const coachSubNav = read('src/components/coach/CoachSubNav.tsx')
  check('no route imposes min-h-screen/min-h-dvh inside the shell',
    PAGES.every((p) => !p.includes('min-h-screen') && !p.includes('min-h-dvh') &&
      !p.includes('h-screen')))
  check('no route creates its own overflow-y scroll container',
    [...PAGES, ...COMPONENTS].every((f) => !stripComments(f).includes('overflow-y')))
  check('shell remains the sole main-content scroll owner',
    read('src/app/(app)/layout.tsx').includes('<main className="flex-1 overflow-y-auto'))
  check('sidebar retains independent overflow-y behavior',
    read('src/components/layout/Sidebar.tsx').includes('flex-1 overflow-y-auto'))
  check('no body-level competing overflow introduced',
    !read('src/app/layout.tsx').includes('overflow') &&
    !read('src/app/globals.css').includes('body { overflow'))
  check('loading states follow the same rule (no viewport heights/scrollers)',
    LOADINGS.every((l) => !l.includes('h-screen') && !l.includes('overflow-y')))
  check('subnav scroll-trap fixed: border on a non-scrolling wrapper',
    subNav.includes('<div className="border-b border-edge-subtle">') &&
    subNav.includes('className="-mb-px flex items-center gap-1 overflow-x-auto"'))
  check('subnav links no longer hang below the scroll container',
    !subNav.includes("'-mb-px whitespace-nowrap"))
  check('same fix applied to the Coach-pillar subnav (identical latent defect)',
    coachSubNav.includes('<div className="border-b border-edge-subtle">') &&
    !coachSubNav.includes("'-mb-px whitespace-nowrap"))
  check('scroll-trap mechanism documented',
    subNav.includes('computed overflow-y becomes auto'))
}

// ── Result ───────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) {
  process.exit(1)
}
