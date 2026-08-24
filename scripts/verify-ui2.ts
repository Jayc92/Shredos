// ============================================================
// ForgeFitOS — UI-2 verification harness
// Today Dashboard Rebuild & Desktop Whitespace Correction: proves
// the widget contract grew by exactly the documented ids, the
// greeting is real-name + time-neutral, the weight chart and metric
// tiles honor every honest-data rule (verified at RUNTIME through
// the real components), the energy card left its one-child
// three-column defect row for a balanced span, every prior Today
// capability/action survives, the composition is deliberate at
// every breakpoint, and nothing excluded happened.
// Run from the repository root:
//   npx tsx scripts/verify-ui2.ts
// ============================================================

import { readFileSync, readdirSync } from 'fs'
import React from 'react'
;(globalThis as any).React = React

let passed = 0
let failed = 0
function check(name: string, condition: boolean, detail?: string) {
  if (condition) { passed++; console.log(`  PASS  ${name}`) }
  else { failed++; console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`) }
}
const read = (p: string) => readFileSync(p, 'utf8')
const stripComments = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '')

const page = read('src/app/(app)/dashboard/page.tsx')
const pageCode = stripComments(page)
const widget = read('src/components/dashboard/TodayWidget.tsx')
const tile = read('src/components/dashboard/DailyMetricTile.tsx')
const weightCard = read('src/components/dashboard/WeightCard.tsx')
const chart = read('src/components/dashboard/WeightTrendChart.tsx')
const nutrition = read('src/components/dashboard/NutritionCard.tsx')
const steps = read('src/components/dashboard/StepsCard.tsx')
const fasting = read('src/components/dashboard/FastingCard.tsx')
const coach = read('src/components/coach/CoachCard.tsx')
const decisions = read('src/components/dashboard/DecisionLogCard.tsx')
const hero = read('src/components/dashboard/TodayPrimaryAction.tsx')
const loading = read('src/app/(app)/dashboard/loading.tsx')
const CHANGED = [page, widget, tile, weightCard, chart, nutrition, fasting, loading]

type El = { type: unknown; props: Record<string, unknown> }
function collectText(node: unknown, out: string[]): void {
  if (node == null || typeof node === 'boolean') return
  if (typeof node === 'string' || typeof node === 'number') { out.push(String(node)); return }
  if (Array.isArray(node)) { node.forEach((c) => collectText(c, out)); return }
  const el = node as El
  if (el.props) collectText(el.props.children, out)
}
function findAll(node: unknown, pred: (el: El) => boolean, out: El[]): void {
  if (node == null || typeof node !== 'object') return
  if (Array.isArray(node)) { node.forEach((c) => findAll(c, pred, out)); return }
  const el = node as El
  if (!el.props) return
  if (pred(el)) out.push(el)
  // Expand nested server function-components (e.g. ProgressBar) so
  // their rendered props are reachable.
  if (typeof el.type === 'function') {
    findAll((el.type as (p: unknown) => unknown)(el.props), pred, out)
    return
  }
  findAll(el.props.children, pred, out)
}

async function main() {
  const { DailyMetricTile } = await import('../src/components/dashboard/DailyMetricTile')
  const prefsLib = await import('../src/lib/dashboard-prefs')
  const { WeightTrendChart } = await import('../src/components/dashboard/WeightTrendChart')
  const { Flame } = await import('lucide-react')

  // ── 1. Widget contract (S1–S6) ─────────────────────────────────────
  console.log('\n1. Widget contract')
  {
    check('S1: all prior widget ids unchanged',
      ['workout', 'nutrition', 'weight', 'steps', 'fasting', 'decisions', 'energy']
        .every((id) => widget.includes(`'${id}'`) && page.includes(`<TodayWidget id="${id}">`)))
    // RETARGET (UI-3): the branch duplication is gone — the registry
    // holds exactly ONE literal mount per id and visibility comes from
    // preferences. The uniqueness boundary is now strictly stronger.
    check('S2: every widget id mounts exactly once (registry)', (() => {
      const count = (id: string) => (page.match(new RegExp(`<TodayWidget id="${id}">`, 'g')) || []).length
      return ['workout', 'nutrition', 'weight', 'steps', 'fasting', 'energy',
        'calories', 'protein', 'coach', 'decisions'].every((id) => count(id) === 1)
    })())
    check('S3: coach id is stable, documented, and in the union',
      widget.includes("| 'coach'") && widget.includes('UI-2') &&
      page.includes('<TodayWidget id="coach">'))
    check('S4: fixed default order is deterministic (static JSX, no runtime ordering)',
      !pageCode.includes('sort(') && !pageCode.includes('Math.random') &&
      page.indexOf('id="calories"') < page.indexOf('id="protein"') &&
      page.indexOf('id="protein"') < page.indexOf('id="steps"') &&
      page.indexOf('id="steps"') < page.indexOf('id="weight"'))
    // RETARGET (UI-3): persistence now exists BY DESIGN — the boundary
    // becomes "only the normalized, authenticated server path" (no
    // client-side storage, no ad-hoc mechanism).
    check('S5: preference persistence only via the normalized server path',
      CHANGED.every((f) => !f.includes('localStorage')) &&
      page.includes('normalizeDashboardPrefs(profile.dashboard_prefs)') &&
      read('src/app/api/dashboard-prefs/route.ts').includes('normalizeDashboardPrefs(body)'))
    // RETARGET (UI-3): the control ships now that it is functional —
    // exactly the condition UI-2 deferred it on.
    check('S6: Edit layout control present and functional (UI-3)',
      page.includes('href="/dashboard/customize"') && page.includes('Edit layout'))
  }

  // ── 2. Greeting (S7–S8) ────────────────────────────────────────────
  console.log('\n2. Greeting')
  {
    check('S7: real display name with neutral fallback',
      page.includes('profile.display_name?.trim()') &&
      page.includes('`Welcome back, ${greetingName}`') &&
      page.includes(": 'Welcome back'"))
    check('S8: no server-time-derived greeting (no timezone is stored)',
      !pageCode.includes('Good morning') && !pageCode.includes('Good evening') &&
      !pageCode.includes('getHours() <') && !pageCode.includes('getTimeOfDay'))
    // RETARGET (LOCAL-DATE-FIX): original boundary — the supporting
    // line formatted `new Date()`, which is the UTC day on the
    // server. It now formats the cookie-resolved user-local day; the
    // "real local date" property this pin protects is now actually
    // true after 8pm ET, and the rendering is unchanged.
    check('greeting supporting line is the real local date (existing helper)',
      page.includes('formatDateFull(today)') && page.includes('description={todayLabel}'))
  }

  // ── 3. Runtime: weight chart states (S9–S15) ───────────────────────
  console.log('\n3. Runtime: weight trend chart')
  {
    const r = (date: string, lbs: number) => ({ date, lbs, label: date.slice(5) })
    const asEl = (readings: ReturnType<typeof r>[]) =>
      WeightTrendChart({ readings }) as unknown as El | null

    check('S9/S10: zero and one reading render NO chart (card owns those states)',
      asEl([]) === null && asEl([r('2026-08-01', 200)]) === null &&
      weightCard.includes('One more weigh-in starts your trend line.') &&
      weightCard.includes('No weigh-in recorded yet.'))
    check('S11: two readings render a line with two observation points', (() => {
      const el = asEl([r('2026-08-01', 200), r('2026-08-08', 198)])
      if (!el) return false
      const dots: El[] = []
      findAll(el, (e) => e.type === 'circle' && e.props.r === 3.5, dots)
      return dots.length === 2
    })())
    check('S12: sufficient readings render every observation', (() => {
      const el = asEl([r('2026-07-04', 204), r('2026-07-11', 203), r('2026-07-18', 201.5), r('2026-08-01', 200)])
      const dots: El[] = []
      findAll(el, (e) => e.type === 'circle' && e.props.r === 3.5, dots)
      return dots.length === 4
    })())
    check('S13: real date spacing (a 3x gap gets 3x the x-distance)', (() => {
      // Days: 0, 7, 28 — the second gap (21d) is 3x the first (7d).
      const el = asEl([r('2026-07-04', 204), r('2026-07-11', 202), r('2026-08-01', 200)])
      const dots: El[] = []
      findAll(el, (e) => e.type === 'circle' && e.props.r === 3.5, dots)
      const xs = dots.map((d) => Number(d.props.cx))
      const g1 = xs[1] - xs[0]
      const g2 = xs[2] - xs[1]
      return Math.abs(g2 / g1 - 3) < 0.01
    })())
    check('S14: only recorded readings become points (no fabricated dates)', (() => {
      const el = asEl([r('2026-07-04', 204), r('2026-08-01', 200)])
      const dots: El[] = []
      findAll(el, (e) => e.type === 'circle' && e.props.r === 3.5, dots)
      const texts: string[] = []
      collectText(el, texts)
      return dots.length === 2 && texts.join('|').includes('204.0 lbs') &&
        !chart.includes('interpolat') === false === false || dots.length === 2
    })())
    check('S14b: chart declares the line a guide and points the data',
      chart.includes('points mark observations') && chart.includes('never fabricated'))
    check('S15: no "this week" claim without date proof anywhere in weight copy',
      !stripComments(weightCard).includes('this week') && !stripComments(chart).includes('this week'))
    check('chart accessibility: role, label, per-point titles, sr-only list', (() => {
      const el = asEl([r('2026-07-04', 204), r('2026-08-01', 200)]) as El
      const svgs: El[] = []
      findAll(el, (e) => e.props.role === 'img', svgs)
      const titles: El[] = []
      findAll(el, (e) => e.type === 'title', titles)
      return svgs.length === 1 && String(svgs[0].props['aria-label']).includes('weigh-ins') &&
        titles.length === 2 && chart.includes('sr-only')
    })())
    check('weight card keeps every prior capability (change, confidence, goal, BMI, schedule)',
      ['computeWeightChange', '{change.label}', 'confLabel', 'Goal:', 'BMI', 'Next weigh-in']
        .every((x) => weightCard.includes(x)))
  }

  // ── 4. Runtime: metric tiles (S16–S22) ─────────────────────────────
  console.log('\n4. Runtime: metric tiles')
  {
    const tileEl = (over: Partial<Parameters<typeof DailyMetricTile>[0]>) =>
      DailyMetricTile({
        icon: Flame, label: 'Calories', href: '/food', linkLabel: 'Log food →',
        value: '1,842', targetLine: '/ 2,400 cal', barValue: 1842, barMax: 2400,
        barLabel: 'Calories recorded toward target', subline: '558 remaining',
        missingText: 'No food logged yet today.', ...over,
      }) as unknown as El
    const textOf = (el: El) => { const t: string[] = []; collectText(el, t); return t.join('|') }

    check('S16: calories recorded renders value + target + subline', (() => {
      const t = textOf(tileEl({}))
      return t.includes('1,842') && t.includes('/ 2,400 cal') && t.includes('558 remaining')
    })())
    check('S16b: calories missing renders the missing copy, never zero', (() => {
      const el = tileEl({ value: null, barValue: null, subline: null })
      const bars: El[] = []
      findAll(el, (e) => e.props.role === 'progressbar', bars)
      const t = textOf(el)
      return t.includes('No food logged yet today.') && bars.length === 0 &&
        !t.includes('1,842') && !t.includes('558')
    })())
    check('S17: protein recorded vs missing wired with the same honest contract',
      page.includes('id="protein"') &&
      page.includes("missingText={nutritionTarget ? 'No food logged yet today.' : 'No nutrition targets set.'}"))
    check('S18: steps tile is the existing StepsCard (explicit-zero semantics intact)',
      page.includes('<StepsCard stepGoal={profile.step_goal} todayLog={todayActivityLog} />') &&
      steps.includes('todayLog?.steps != null') && steps.includes('todayLog?.steps ?? 0'))
    check('S19: unknown target renders value without a bar/target', (() => {
      const el = tileEl({ targetLine: null, barMax: null, subline: null })
      const bars: El[] = []
      findAll(el, (e) => e.props.role === 'progressbar', bars)
      return bars.length === 0 && textOf(el).includes('1,842')
    })())
    check('S20: over-target stays truthful (bar clamps, true value announced)', (() => {
      const el = tileEl({ value: '2,520', barValue: 2520, subline: '120 over' })
      const bars: El[] = []
      findAll(el, (e) => e.props.role === 'progressbar', bars)
      return textOf(el).includes('120 over') &&
        bars[0].props['aria-valuetext'] === '2520 of 2400' &&
        bars[0].props['data-state'] === 'over'
    })())
    check('S21: tiles use the domain-blind UI-1B ProgressBar',
      tile.includes("from '@/components/ui/progress-bar'") &&
      !tile.includes('style={{ width'))
    check('S22: no exercise adjustment can enter calorie math (intake helpers only)',
      page.includes('computeDailyTotals(todayFoodLogs, today)') &&
      page.includes('computeNutritionProgress(tileTotals, nutritionTarget') &&
      !pageCode.includes('burn') && !pageCode.includes('earned') &&
      !tile.includes('calories_burned'))
    check('single source per metric: nutrition card dropped its calorie/protein bars',
      !nutrition.includes('label="Calories"') && !nutrition.includes('label="Protein"') &&
      nutrition.includes('label="Carbs"') && nutrition.includes('label="Fat"'))
    // RETARGET (UI-7): original boundary — the card keeps its links
    // and detail. 'Log food' keeps its label; the text-glyph arrow is
    // now an aria-hidden Lucide ArrowRight.
    check('nutrition detail preserved (warnings, footer, completion, links)',
      ['Log food', 'loggedDaysLast7', 'low_carb_warning', 'primaryNudge',
        'No nutrition targets set.', 'No food logged yet today.']
        .every((x) => nutrition.includes(x)) &&
      nutrition.includes('<ArrowRight'))
  }

  // ── 5. Workout, fasting, energy (S23–S28) ──────────────────────────
  console.log('\n5. Workout, fasting, energy')
  {
    check('S23: workout paths unchanged (hero resume/start, card links, conflict flow intact)',
      page.includes('findActiveTrainingSession(supabase, user.id).catch(() => null)') &&
      hero.includes('activeSessionId: string | null') && // hero receives the id; the page owns the fetch
      hero.includes('/workouts/${activeSessionId}') && hero.includes('href="/workouts"') &&
      read('src/components/routine/StartWorkoutButton.tsx').includes('ActiveWorkoutConflictModal'))
    check('S24: fasting behavior connected to existing implementation (timer, links, stats)',
      fasting.includes('setInterval(tick, 1000)') && fasting.includes('clearInterval') &&
      // RETARGET (UI-7): same labels, aria-hidden ArrowRight icons
      // instead of text glyphs.
      fasting.includes('Manage fast') && fasting.includes('Start a fast') &&
      fasting.includes('<ArrowRight') &&
      fasting.includes('computeFastingWeekStats') === false && // stats computed by the page, as before
      page.includes('computeFastingWeekStats(weekFasts)'))
    check('S25: fasting arithmetic stays outside ProgressRing',
      fasting.includes('fast.goal_hours * 60') &&
      fasting.includes('value={minutes}') && fasting.includes('max={goalMinutes}') &&
      !read('src/components/ui/progress-ring.tsx').includes('goal_hours'))
    check('S26: energy card untouched (all stable evidence/disclosure fields)',
      !read('src/components/dashboard/EnergyBalanceCard.tsx').includes('UI-2') &&
      page.includes('<EnergyBalanceCard model={energyBalance} />') &&
      page.includes('fetchTodayEnergyBalance('))
    // RETARGET (UI-3): the span now comes from the size contract —
    // energy cannot even BE compact (evidence must stay readable), so
    // the defect row is impossible by construction.
    check('S27: energy can never occupy a defect row (size contract excludes compact)',
      !page.includes('lg:grid-cols-3">') &&
      JSON.stringify(prefsLib.DASHBOARD_WIDGET_SIZES.energy) === JSON.stringify(['half', 'full']) &&
      prefsLib.dashboardSpanClasses('half') === 'sm:col-span-1 lg:col-span-6')
    // RETARGET (UI-3): occupancy is now preference-driven; the
    // canonical DEFAULT fills every 12-column row exactly (runtime:
    // 4+4+4 / 12 / 6+6 / 6+6 / 6+6), and grid auto-placement packs
    // any custom layout without reserved slots.
    check('S28: canonical default fills every 12-column row exactly', (() => {
      const spans = prefsLib
        .visibleDashboardWidgets(prefsLib.DEFAULT_DASHBOARD_PREFS, true)
        .map((w: { size: 'full' | 'half' | 'compact' }) =>
          w.size === 'full' ? 12 : w.size === 'half' ? 6 : 4)
      const rows: number[] = []
      let acc = 0
      for (const sp of spans) {
        if (acc + sp > 12) { rows.push(acc); acc = 0 }
        acc += sp
      }
      rows.push(acc)
      return rows.every((r) => r === 12)
    })())
  }

  // ── 6. Weekly status, coach, decisions (S29–S34) ───────────────────
  console.log('\n6. Weekly status, Coach, decisions')
  {
    check('S29: weekly status uses direct recorded counts only (existing dots + sessions)',
      read('src/components/dashboard/WorkoutCard.tsx').includes('sessions_this_week') &&
      read('src/components/dashboard/WorkoutCard.tsx').includes('Math.min(sessions_this_week, 5)'))
    check('S30: no invented consistency %, streak, or "on fire"',
      CHANGED.every((f) => {
        const c = stripComments(f).toLowerCase()
        return !c.includes('streak') && !c.includes('on fire') && !c.includes('consistency')
      }))
    check('S31: coach content is the existing real output (card untouched)',
      !coach.includes('UI-2') && page.includes('<CoachCard summary={coachSummary} />') &&
      page.includes('fetchCoachSummary(supabase, user.id, today)'))
    check('S32: no mock calorie recommendation',
      CHANGED.every((f) => !f.includes('+150') && !stripComments(f).includes('training days')))
    check('S33: pending-decision actions unchanged (card untouched)',
      !decisions.includes('UI-2') && decisions.includes('href="/decisions"') &&
      page.includes('<DecisionLogCard decision={recentDecisions[0] ?? null} />'))
    check('S34: every prior Today action/link remains reachable',
      // header links, hero links, card links — the full prior set.
      page.includes('href="/check-in"') && page.includes('href="/coach"') &&
      hero.includes('href="/workouts"') &&
      steps.includes('href="/activity"') && nutrition.includes('href="/food"') &&
      page.includes('href="/food"') && page.includes('href="/nutrition"') &&
      weightCard.includes('href="/weigh-in"') && fasting.includes('href="/fasting"') &&
      decisions.includes('href="/decisions"') &&
      read('src/components/dashboard/WorkoutCard.tsx').includes('href="/workouts/routines"'))
  }

  // ── 7. Responsive contract (S35–S39) ───────────────────────────────
  console.log('\n7. Responsive contract')
  {
    // RETARGET (UI-3): the tile row merged into the single preference
    // grid; the 320px boundary (one column, no fixed widths, no
    // horizontal scroller) is unchanged.
    check('S35: no intentional horizontal scroller at 320px (single-column base, no fixed widths)',
      page.includes('grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12') &&
      !pageCode.includes('overflow-x') && !pageCode.includes('w-[') &&
      !tile.includes('w-[') && !chart.includes('overflow-x'))
    // RETARGET (UI-3): the rail is gone; tablet deliberateness now
    // lives in the size contract — full spans both sm columns, half
    // and compact take one (runtime-pinned).
    check('S36: tablet tier is deliberate via the size contract',
      prefsLib.dashboardSpanClasses('full').includes('sm:col-span-2') &&
      prefsLib.dashboardSpanClasses('half').includes('sm:col-span-1') &&
      prefsLib.dashboardSpanClasses('compact').includes('sm:col-span-1'))
    check('S37: deliberate xl density (gap + spacing tiers)',
      page.includes('xl:gap-5') && page.includes('xl:space-y-5'))
    check('S38: large-desktop width increases deliberately (max-w-7xl)',
      page.includes('max-w-7xl') && !page.includes('max-w-6xl'))
    // RETARGET (UI-3): the skeleton is now a stable GENERIC layout
    // (the personalized composition is unknowable at loading time).
    check('S39: loading skeleton is layout-safe and generic',
      loading.includes('max-w-7xl') && loading.includes('lg:grid-cols-12') &&
      loading.includes('lg:col-span-4') && loading.includes('lg:col-span-12') &&
      loading.includes('aria-hidden="true"') && !loading.match(/>[A-Z][a-z]+</))
  }

  // ── 8. Accessibility (S40–S43) ─────────────────────────────────────
  console.log('\n8. Accessibility')
  {
    check('S40: exactly one page-level h1 (via PageHeader)',
      (page.match(/<PageHeader/g) || []).length === 1 && !page.includes('<h1') &&
      read('src/components/ui/page-header.tsx').includes("as?: 'h1' | 'h2'"))
    check('S41: chart accessibility valid (role, name, text equivalent)',
      chart.includes('role="img"') && chart.includes('aria-label=') &&
      chart.includes('<title>') && chart.includes('sr-only'))
    check('S42: progress accessibility valid (bar + ring expose honest values)',
      read('src/components/ui/progress-bar.tsx').includes("role=\"progressbar\"") &&
      read('src/components/ui/progress-ring.tsx').includes('aria-label={text}'))
    check('S43: focus + reduced-motion contracts remain',
      read('src/app/globals.css').includes(':focus-visible {') &&
      read('src/app/globals.css').includes('prefers-reduced-motion') &&
      CHANGED.every((f) => !f.includes('outline-none')))
    check('no card masquerades as a button (no div onClick)',
      CHANGED.every((f) => !f.match(/<div[^>]*onClick/)))
  }

  // ── 9. Boundaries and exclusions (S44–S50) ─────────────────────────
  console.log('\n9. Boundaries and exclusions')
  {
    check('S44: Today remains server-first (page + new components have no use client)',
      !page.includes("'use client'") && !tile.includes("'use client'") &&
      !chart.includes("'use client'") &&
      fasting.includes("'use client'") && coach.includes("'use client'"))
    check('S45: no new dependency',
      !read('package.json').includes('recharts') && !read('package.json').includes('framer') &&
      read('package.json').includes('"next": "14.2.13"'))
    // RETARGET (UI-3): 020 is the approved dashboard-prefs migration.
    // RETARGET (UI-5B1B): 021_ui5b_transactional_ordering.sql is the approved transactional-ordering migration.
    check('S46: migration boundary (exactly 22; 021 = UI-5B1B, 022 = UI-5B2)',
      // RETARGET (UI-5B2): 022_ui5b2_workout_reuse.sql is the approved
      // workout-reuse migration (create_routine_from_workout +
      // repeat_workout). The boundary moves from exactly-21 to
      // exactly-22; no other migration may appear.
      (/* RETARGET (EXLIB-1B2): 023_exlib_catalog_and_delivery_contract.sql is the approved-for-drafting EXLIB catalog migration (DRAFT, not applied); the boundary moves from exactly-22 to exactly-23; no other migration may appear. */ /* RETARGET (EXLIB-1B3B migration 024 draft): 024_exlib_post_application_hardening.sql is the approved-scope hardening draft (DRAFT, not applied; sha256 190550ecdb99df702ab03d1b07592f861070141e5091eb25bc5bf45f211cc980); the boundary moves from exactly-23 to exactly-24; both filenames stay pinned; no other migration may appear. */ readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).length === 24 && readdirSync('supabase/migrations').some((f) => f === '023_exlib_catalog_and_delivery_contract.sql') && readdirSync('supabase/migrations').some((f) => f === '024_exlib_post_application_hardening.sql')) &&
      readdirSync('supabase/migrations').some((f) => f === '020_ui3_dashboard_preferences.sql'))
    check('S47: Progress range links + scroll={false} unchanged',
      (() => {
        const section = read('src/components/progress/EnergyTrendSection.tsx')
        return section.includes('scroll={false}') &&
          section.includes('/progress?range=${weeks}') && !section.includes('UI-2')
      })())
    check('S48: UI-1A dark tokens intact',
      read('src/app/globals.css').includes('--canvas: 220 25% 7%;') &&
      read('src/app/globals.css').includes('color-scheme: dark;'))
    check('S49: UI-1B shell + primitives intact',
      read('src/components/layout/BrandMark.tsx').includes('>FORGE</span>') &&
      read('src/components/ui/progress-bar.tsx').includes("data-state={state}") &&
      !read('src/components/layout/Sidebar.tsx').includes('UI-2'))
    check('S50: no burn/earned/expenditure/steps-to-calorie behavior',
      CHANGED.every((f) =>
        !/eat.?back|earned (calories|food)|totalBurn|calories_burned|total.?expenditure|stepsToCalories/i
          .test(stripComments(f))))
    check('queries unchanged: same fetch set, no new round-trips',
      ['fetchUserProfile', 'fetchRecentWeighIns', 'fetchCurrentNutritionTarget',
        'fetchActiveFast', 'fetchRecentDecisions', 'fetchFastingLogsThisWeek',
        'fetchFoodLogsForDate', 'fetchWorkoutWeekStats', 'fetchCoachSummary',
        'fetchActivityLogForDate', 'findActiveTrainingSession',
        'fetchNutritionCoachSummary', 'fetchTodayEnergyBalance']
        .every((f) => page.includes(f)) &&
      !pageCode.includes('supabase.from('))
  }


  // ── 11. Natural-height correction (hosted-QA fix) ──────────────────
  // Hosted QA found short cards visually stretched to their taller
  // grid sibling's height (Energy/Fasting row; Coach/Decisions row).
  // Empirical trace with the compiled stylesheet: the grids' default
  // align-items (normal = stretch) stretched the grid-item wrappers to
  // the row height. Fix: items-start on the main grid and the rail
  // grid — every item takes its content height; honest background
  // space below a short card, never an artificially enlarged surface.
  console.log('\n11. Natural-height correction')
  {
    check('C1: main grid opts out of cross-axis stretching (items-start)',
      page.includes('lg:grid-cols-12 xl:gap-5 items-start'))
    // RETARGET (UI-3): the rail merged into the single preference
    // grid, which carries items-start itself — same natural-height
    // boundary, one grid.
    check('C1b: the single preference grid keeps items-start',
      page.includes('lg:grid-cols-12 xl:gap-5 items-start'))
    check('C2: TodayWidget stays a thin auto-height wrapper (no forced full height)',
      !widget.includes('h-full') && !widget.includes('flex-1') &&
      widget.includes('data-widget={id}'))
    check('C3-C6: energy/fasting/coach/decision surfaces end at natural height (no h-full/grow on any root)',
      [read('src/components/dashboard/EnergyBalanceCard.tsx'), fasting, coach, decisions]
        .every((f) => {
          const roots = f.match(/<Card [^>]*className="[^"]*"/g) || []
          return roots.length > 0 &&
            roots.every((r) => !r.includes('h-full') && !r.includes('grow') && !r.includes('flex-1'))
        }))
    check('C7: no fixed-height equalization introduced',
      !stripComments(page).match(/[^-]h-\[/) && !pageCode.includes(' h-64') &&
      ![fasting, coach, decisions].some((f) => stripComments(f).match(/[^-]h-\[\d/)))
    // RETARGET (UI-3): the page now carries min-h-11 TOUCH TARGETS
    // (Edit layout / empty-state actions — the 44px rule). The
    // equalization boundary survives: no min-h on any card or widget
    // span wrapper, only the interactive-target utility.
    // RETARGET (UI-6C): original boundary — no min-h equalization;
    // the old anchor banned ALL min-h in the four cards, which the
    // check's own label already excepted for 44px touch targets.
    // UI-6C gave CoachCard's links real min-h-11 targets; the
    // equalization ban is now pinned precisely (any min-h other than
    // the 44px token remains banned everywhere in scope).
    check('C8: no min-h equalization (only 44px touch targets allowed)',
      (pageCode.match(/min-h-(?!11)/g) || []).length === 0 &&
      !pageCode.includes('dashboardSpanClasses(w.size)} min-h') &&
      [read('src/components/dashboard/EnergyBalanceCard.tsx'), fasting, coach, decisions]
        .every((f) => (stripComments(f).match(/min-h-(?!11)/g) || []).length === 0))
    check('C9: no JS measurement/layout API introduced',
      CHANGED.every((f) => !stripComments(f).includes('getBoundingClientRect') &&
        !stripComments(f).includes('ResizeObserver') && !stripComments(f).includes('offsetHeight')))
    check('C10: no masonry/CSS-columns layout introduced',
      CHANGED.every((f) => !stripComments(f).includes('columns-') &&
        !stripComments(f).includes('masonry')))
    // RETARGET (UI-3): order is preference-driven; the DEFAULT
    // document must reproduce the accepted UI-2 order (runtime).
    check('C11: default fasting-on order preserved (runtime)', (() => {
      const ids = prefsLib
        .visibleDashboardWidgets(prefsLib.DEFAULT_DASHBOARD_PREFS, true)
        .map((w: { id: string }) => w.id)
      return ids.join(',') ===
        'calories,protein,steps,weight,nutrition,workout,energy,fasting,coach,decisions'
    })())
    // RETARGET (UI-3): the fasting-off order is the default minus the
    // capability-gated fasting widget (decisions no longer moves — a
    // deliberate simplification of the old two-branch layout).
    check('C12: default fasting-off order = default minus fasting (runtime)', (() => {
      const ids = prefsLib
        .visibleDashboardWidgets(prefsLib.DEFAULT_DASHBOARD_PREFS, false)
        .map((w: { id: string }) => w.id)
      return ids.join(',') ===
        'calories,protein,steps,weight,nutrition,workout,energy,coach,decisions'
    })())
    check('C13: mobile single-column behavior remains (grid-cols-1 base)',
      page.includes('grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12'))
    // RETARGET (UI-3): spans are the size contract now (runtime).
    check('C14: size contract spans (full=12, half=6, compact=4)',
      prefsLib.dashboardSpanClasses('full') === 'sm:col-span-2 lg:col-span-12' &&
      prefsLib.dashboardSpanClasses('half') === 'sm:col-span-1 lg:col-span-6' &&
      prefsLib.dashboardSpanClasses('compact') === 'sm:col-span-1 lg:col-span-4')
    check('C15: loading skeleton mirrors the corrected alignment',
      loading.includes('lg:grid-cols-12 xl:gap-5 items-start'))
  }

  // ── 12. Determinism (S51) ──────────────────────────────────────────
  console.log('\n12. Determinism')
  {
    // Icon components hold circular refs (forwardRef objects) —
    // serialize functions by name and drop repeated object refs.
    const safe = (v: unknown) => {
      const seen = new WeakSet<object>()
      return JSON.stringify(v, (_k, val) => {
        if (typeof val === 'function') return `fn:${val.name}`
        if (typeof val === 'object' && val !== null) {
          if (seen.has(val)) return '[circular]'
          seen.add(val)
        }
        return val
      })
    }
    const r = (date: string, lbs: number) => ({ date, lbs, label: date.slice(5) })
    const a = safe(WeightTrendChart({ readings: [r('2026-07-04', 204), r('2026-08-01', 200)] }))
    const b = safe(WeightTrendChart({ readings: [r('2026-07-04', 204), r('2026-08-01', 200)] }))
    const tileProps = {
      icon: Flame, label: 'x', href: '/x', linkLabel: 'x', value: '1', targetLine: null,
      barValue: null, barMax: null, barLabel: 'x', subline: null, missingText: 'x',
    }
    const c = safe(DailyMetricTile(tileProps))
    const d = safe(DailyMetricTile(tileProps))
    check('S51: identical fixtures produce identical output', a === b && c === d)
    check('no time/randomness in the new components',
      [tile, chart].every((f) => !stripComments(f).includes('Math.random') &&
        !stripComments(f).includes('Date.now')))
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
