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
  const { WeightTrendChart } = await import('../src/components/dashboard/WeightTrendChart')
  const { Flame } = await import('lucide-react')

  // ── 1. Widget contract (S1–S6) ─────────────────────────────────────
  console.log('\n1. Widget contract')
  {
    check('S1: all prior widget ids unchanged',
      ['workout', 'nutrition', 'weight', 'steps', 'fasting', 'decisions', 'energy']
        .every((id) => widget.includes(`'${id}'`) && page.includes(`<TodayWidget id="${id}">`)))
    check('S2: every rendered widget id is unique per branch', (() => {
      // decisions/coach render in exactly one branch of the fasting
      // conditional; every other id appears exactly once.
      const count = (id: string) => (page.match(new RegExp(`<TodayWidget id="${id}">`, 'g')) || []).length
      return ['workout', 'nutrition', 'weight', 'steps', 'fasting', 'energy', 'calories', 'protein']
        .every((id) => count(id) === 1) && count('decisions') === 2 && count('coach') === 2 &&
        page.includes('profile.fasting_enabled ? (') && page.includes('{!profile.fasting_enabled && (')
    })())
    check('S3: coach id is stable, documented, and in the union',
      widget.includes("| 'coach'") && widget.includes('UI-2') &&
      page.includes('<TodayWidget id="coach">'))
    check('S4: fixed default order is deterministic (static JSX, no runtime ordering)',
      !pageCode.includes('sort(') && !pageCode.includes('Math.random') &&
      page.indexOf('id="calories"') < page.indexOf('id="protein"') &&
      page.indexOf('id="protein"') < page.indexOf('id="steps"') &&
      page.indexOf('id="steps"') < page.indexOf('id="weight"'))
    check('S5: no dashboard preference persistence exists',
      CHANGED.every((f) => !f.includes('localStorage') && !f.includes('dashboard_prefs') &&
        !stripComments(f).includes('widget_settings')))
    check('S6: no Edit Layout control exposed yet',
      !page.toLowerCase().includes('edit layout') && !page.includes('Customize'))
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
    check('greeting supporting line is the real local date (existing helper)',
      page.includes('formatDateFull(new Date())') && page.includes('description={todayLabel}'))
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
    check('nutrition detail preserved (warnings, footer, completion, links)',
      ['Log food →', 'loggedDaysLast7', 'low_carb_warning', 'primaryNudge',
        'No nutrition targets set.', 'No food logged yet today.']
        .every((x) => nutrition.includes(x)))
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
      fasting.includes('Manage fast →') && fasting.includes('Start a fast →') &&
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
    check('S27: energy is NOT in a one-child three-column row',
      !page.includes('lg:grid-cols-3">\n        <TodayWidget id="energy">') &&
      (() => {
        const energyAt = page.indexOf('<TodayWidget id="energy">')
        return page.slice(page.lastIndexOf('<div', energyAt), energyAt).includes('lg:col-span-6')
      })())
    check('S28: no structural permanent two-column vacancy in any grid', (() => {
      // Every lg:col-span-6 region pairs with another in the same
      // conditional branch; the 12-col grid rows sum to 12.
      const spans6 = (branch: string) => (branch.match(/lg:col-span-6/g) || []).length
      const enabled = page.slice(page.indexOf('profile.fasting_enabled ? ('), page.indexOf(') : ('))
      const disabled = page.slice(page.indexOf(') : ('))
      return spans6(enabled) === 3 && spans6(disabled) >= 1 &&
        page.includes('lg:col-span-8') && page.includes('lg:col-span-4')
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
    check('S35: no intentional horizontal scroller at 320px (single-column base, no fixed widths)',
      page.includes('grid grid-cols-1 gap-4 sm:grid-cols-3') &&
      !pageCode.includes('overflow-x') && !pageCode.includes('w-[') &&
      !tile.includes('w-[') && !chart.includes('overflow-x'))
    check('S36: tablet pairs are deliberate (sm spans; decisions full-row in the rail)',
      page.includes('sm:col-span-2 sm:grid-cols-2') &&
      page.includes('sm:col-span-1 lg:col-span-6') &&
      page.includes('<div className="sm:col-span-2 lg:col-span-1">'))
    check('S37: deliberate xl density (gap + spacing tiers)',
      page.includes('xl:gap-5') && page.includes('xl:space-y-5'))
    check('S38: large-desktop width increases deliberately (max-w-7xl)',
      page.includes('max-w-7xl') && !page.includes('max-w-6xl'))
    check('S39: loading skeleton mirrors the new major regions',
      loading.includes('max-w-7xl') && loading.includes('sm:grid-cols-3') &&
      loading.includes('lg:grid-cols-12') && loading.includes('lg:col-span-8') &&
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
    check('S46: NO migration 020 (exactly 19)',
      readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).length === 19 &&
      !readdirSync('supabase/migrations').some((f) => f.startsWith('020')))
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
    check('C1b: rail grid opts out too (tablet pairs share the defect class)',
      page.includes('content-start items-start sm:col-span-2 sm:grid-cols-2'))
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
    check('C8: no min-h equalization on the paired cards',
      !pageCode.includes('min-h') &&
      [read('src/components/dashboard/EnergyBalanceCard.tsx'), fasting, coach, decisions]
        .every((f) => !stripComments(f).includes('min-h-')))
    check('C9: no JS measurement/layout API introduced',
      CHANGED.every((f) => !stripComments(f).includes('getBoundingClientRect') &&
        !stripComments(f).includes('ResizeObserver') && !stripComments(f).includes('offsetHeight')))
    check('C10: no masonry/CSS-columns layout introduced',
      CHANGED.every((f) => !stripComments(f).includes('columns-') &&
        !stripComments(f).includes('masonry')))
    check('C11: fasting-on widget order unchanged', (() => {
      const tern = page.indexOf('profile.fasting_enabled ? (')
      const on = page.slice(0, tern).replace(/\{!profile\.fasting_enabled && \([\s\S]*?\)\}/, '') +
        page.slice(tern, page.indexOf(') : ('))
      const ids = (on.match(/<TodayWidget id="(\w+)">/g) || []).map((m) => m.slice(17, -2))
      return ids.join(',') ===
        'calories,protein,steps,weight,nutrition,workout,energy,fasting,coach,decisions'
    })())
    check('C12: fasting-off widget order unchanged', (() => {
      const tern = page.indexOf('profile.fasting_enabled ? (')
      const off = page.slice(0, tern) + page.slice(page.indexOf(') : ('))
      const ids = (off.match(/<TodayWidget id="(\w+)">/g) || []).map((m) => m.slice(17, -2))
      return ids.join(',') ===
        'calories,protein,steps,weight,nutrition,workout,decisions,energy,coach'
    })())
    check('C13: mobile single-column behavior remains (grid-cols-1 base everywhere)',
      page.includes('grid grid-cols-1 gap-4 sm:grid-cols-3') &&
      page.includes('grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12'))
    check('C14: tablet/desktop spans unchanged (8/4 + 6/6 pairs)',
      page.includes('sm:col-span-2 lg:col-span-8') &&
      (page.match(/sm:col-span-1 lg:col-span-6/g) || []).length === 5 &&
      page.includes('lg:col-span-4'))
    check('C15: loading skeleton mirrors the corrected alignment',
      loading.includes('lg:grid-cols-12 xl:gap-5 items-start') &&
      loading.includes('content-start items-start'))
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
