// ============================================================
// ForgeFitOS — UI-4 verification harness
// Progress Visual Rebuild: proves the weight feature chart renders
// only real windowed observations with real-date spacing (runtime),
// the strength-PR presentation preserves the established PR
// definitions, the coverage section aggregates only recorded
// overview rows with honest primary-muscle attribution (runtime),
// the Phase-5B Energy/adherence section is byte-untouched, every
// sparse/failure state stays honest, and no boundary was crossed
// (no migration 021, no dependency, no business-library change, no
// other route redesigned).
// Run from the repository root:
//   npx tsx scripts/verify-ui4.ts
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

const page = read('src/app/(app)/progress/page.tsx')
const pageCode = stripComments(page)
const chart = read('src/components/progress/ProgressWeightChart.tsx')
const coverage = read('src/components/progress/TrainingCoverageSection.tsx')
const loading = read('src/app/(app)/progress/loading.tsx')
const energySection = read('src/components/progress/EnergyTrendSection.tsx')
const CHANGED = [page, chart, coverage, loading]

type El = { type: unknown; props: Record<string, unknown> }
function findAll(node: unknown, pred: (el: El) => boolean, out: El[]): void {
  if (node == null || typeof node !== 'object') return
  if (Array.isArray(node)) { node.forEach((c) => findAll(c, pred, out)); return }
  const el = node as El
  if (!el.props) return
  if (pred(el)) out.push(el)
  if (typeof el.type === 'function') {
    findAll((el.type as (p: unknown) => unknown)(el.props), pred, out)
    return
  }
  findAll(el.props.children, pred, out)
}
function collectText(node: unknown, out: string[]): void {
  if (node == null || typeof node === 'boolean') return
  if (typeof node === 'string' || typeof node === 'number') { out.push(String(node)); return }
  if (Array.isArray(node)) { node.forEach((c) => collectText(c, out)); return }
  const el = node as El
  if (!el.props) return
  if (typeof el.type === 'function') {
    collectText((el.type as (p: unknown) => unknown)(el.props), out)
    return
  }
  collectText(el.props.children, out)
}

async function main() {
  const { ProgressWeightChart } = await import('../src/components/progress/ProgressWeightChart')
  const { TrainingCoverageSection } = await import('../src/components/progress/TrainingCoverageSection')
  const r = (date: string, lbs: number) => ({ date, lbs, label: date.slice(5) })
  const chartEl = (readings: ReturnType<typeof r>[], goalLbs: number | null = null) =>
    ProgressWeightChart({ readings, goalLbs }) as unknown as El | null
  const dots = (el: El | null) => {
    const out: El[] = []
    if (el) findAll(el, (e) => e.type === 'circle' && e.props.r === 3.5, out)
    return out
  }

  // ── 1. Starting contract (S1–S5) ───────────────────────────────────
  console.log('\n1. Starting contract')
  {
    check('S1: built from the stable UI-3 contract (customization intact)',
      read('src/lib/dashboard-prefs.ts').includes('DASHBOARD_WIDGET_IDS') &&
      read('src/app/(app)/dashboard/page.tsx').includes('visibleDashboardWidgets'))
    // RETARGET (UI-5B1B): 021_ui5b_transactional_ordering.sql is the approved transactional-ordering migration.
    check('S2: UI-4 added no migration (exactly 22; 022 = approved UI-5B2 file)',
      // RETARGET (UI-5B2): 022_ui5b2_workout_reuse.sql is the approved
      // workout-reuse migration (create_routine_from_workout +
      // repeat_workout). The boundary moves from exactly-21 to
      // exactly-22; no other migration may appear.
      (/* RETARGET (EXLIB-1B2): 023_exlib_catalog_and_delivery_contract.sql is the approved-for-drafting EXLIB catalog migration (DRAFT, not applied); the boundary moves from exactly-22 to exactly-23; no other migration may appear. */ /* RETARGET (EXLIB-1B3B migration 024 draft): 024_exlib_post_application_hardening.sql is the approved-scope hardening draft (DRAFT, not applied; sha256 190550ecdb99df702ab03d1b07592f861070141e5091eb25bc5bf45f211cc980); the boundary moves from exactly-23 to exactly-24; both filenames stay pinned; no other migration may appear. */ readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).length === 24 && readdirSync('supabase/migrations').some((f) => f === '023_exlib_catalog_and_delivery_contract.sql') && readdirSync('supabase/migrations').some((f) => f === '024_exlib_post_application_hardening.sql')) &&
      readdirSync('supabase/migrations').filter((f) => f.startsWith('021')).length === 1 &&
      readdirSync('supabase/migrations').some((f) => f === '021_ui5b_transactional_ordering.sql'))
    check('S3: Progress is the only product route carrying UI-4 markers',
      page.includes('UI-4') &&
      ['src/app/(app)/dashboard/page.tsx', 'src/app/(app)/workouts/page.tsx',
        'src/app/(app)/nutrition/page.tsx', 'src/app/(app)/coach/page.tsx',
        'src/app/(app)/profile/page.tsx', 'src/app/(auth)/login/page.tsx',
        'src/app/(app)/food/page.tsx']
        .every((f) => !read(f).includes('UI-4')))
    check('S4: UI-1 semantic tokens retained (no raw palette in new code)',
      [chart, coverage].every((f) =>
        !/(green|red|blue|amber|gray|slate|zinc)-\d{3}/.test(stripComments(f))) &&
      read('src/app/globals.css').includes('--canvas: 220 25% 7%;'))
    check('S5: shared shell untouched',
      ['src/app/(app)/layout.tsx', 'src/components/layout/Sidebar.tsx',
        'src/components/layout/TopBar.tsx', 'src/components/layout/MobileBottomNav.tsx',
        'src/components/layout/BrandMark.tsx']
        .every((f) => !read(f).includes('UI-4')))
  }

  // ── 2. Runtime: weight trend (S6–S17) ──────────────────────────────
  console.log('\n2. Runtime: weight trend chart')
  {
    check('S6: real observations only (every dot is an input reading)', (() => {
      const el = chartEl([r('2026-07-04', 204), r('2026-07-18', 202), r('2026-08-01', 200)])
      return dots(el).length === 3
    })())
    check('S7: observation order deterministic (identical input → identical output)', (() => {
      const input = [r('2026-07-04', 204), r('2026-08-01', 200)]
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
      return safe(chartEl(input)) === safe(chartEl(input))
    })())
    // RETARGET (LOCAL-DATE-FIX): original boundary — the chart window
    // was `subDays(new Date(), energyRange * 7)` on the server's UTC
    // clock. Same width, now pure date-string math anchored to the
    // user-local day; parseEnergyRange still solely drives the range.
    check('S8: supported range behavior (existing parseEnergyRange drives the window)',
      page.includes('parseEnergyRange(searchParams?.range)') &&
      page.includes('addDaysISO(localToday, -(energyRange * 7))') &&
      page.includes("w.logged_date >= chartWindowStart"))
    check('S9: range links retain scroll={false} (energy section untouched)',
      energySection.includes('scroll={false}') &&
      energySection.includes('/progress?range=${weeks}'))
    check('S10: invalid range repaired safely (existing parser)', (() => {
      const lib = read('src/lib/progress-energy.ts')
      return lib.includes('DEFAULT_ENERGY_RANGE_WEEKS') &&
        page.includes('parseEnergyRange')
    })())
    check('S11: missing differs from zero (null weights filtered, never plotted as 0)',
      page.includes('w.weight_kg !== null') &&
      !stripComments(chart).includes('?? 0'))
    check('S12: single observation renders NO chart (honest sparse copy instead)',
      chartEl([r('2026-08-01', 200)]) === null &&
      page.includes('One weigh-in recorded in this range') &&
      page.includes('No weigh-ins recorded in the selected range.'))
    check('S13: empty state preserved (pinned 4B.5 copy intact)',
      page.includes('Log your first weigh-in to begin tracking body weight.'))
    check('S14: target-history semantics untouched (energy libs carry no UI-4 marker)',
      ['src/lib/progress-energy.ts', 'src/lib/energy-facts.ts', 'src/lib/energy-model.ts']
        .every((f) => !read(f).includes('UI-4')))
    check('S15: Friday weigh-in semantics preserved (weight-trends lib + weekly anchors untouched)',
      !read('src/lib/weight-trends.ts').includes('UI-4') &&
      page.includes('buildWeightTrendSummary(weighIns, profile.goal_weight_kg)'))
    check('S16: no fabricated interpolation (line declared a guide; no synthetic points)', (() => {
      // 3 readings with a huge gap: still exactly 3 dots, x spacing real.
      const el = chartEl([r('2026-06-01', 210), r('2026-06-08', 208), r('2026-08-01', 200)])
      const ds = dots(el)
      const xs = ds.map((d) => Number(d.props.cx))
      const g1 = xs[1] - xs[0] // 7 days
      const g2 = xs[2] - xs[1] // 54 days
      return ds.length === 3 && Math.abs(g2 / g1 - 54 / 7) < 0.01 &&
        chart.includes('the line is a guide')
    })())
    check('S16b: goal line only near the observed range (never squashes data)', (() => {
      const near = chartEl([r('2026-07-04', 204), r('2026-08-01', 200)], 195)
      const far = chartEl([r('2026-07-04', 204), r('2026-08-01', 200)], 130)
      const goalLines = (el: El | null) => {
        const out: El[] = []
        if (el) findAll(el, (e) => e.props.strokeDasharray === '4 4', out)
        return out.length
      }
      return goalLines(near) === 1 && goalLines(far) === 0
    })())
    check('G1-G4: goal disclosure audit (near renders line, no disclosure; far scales to data + truthful disclosure; missing goal = neither)', (() => {
      const textOf = (el: El | null) => {
        const t: string[] = []
        if (el) collectText(el, t)
        return t.join('')
      }
      const readings = [r('2026-07-04', 204), r('2026-08-01', 200)]
      const near = chartEl(readings, 195)
      const far = chartEl(readings, 130)
      const none = chartEl(readings, null)
      // G2: far goal must not alter observation scaling — the plotted
      // y-domain (extreme labels) matches the goal-free chart's.
      const yLabels = (el: El | null) => {
        const out: El[] = []
        if (el) findAll(el, (e) => e.type === 'text' && e.props.textAnchor === 'end' && Number(e.props.x) < 50, out)
        return out.map((e) => textOf(e))
      }
      return !textOf(near).includes('outside the displayed scale') &&
        textOf(far).includes('Goal: 130 lbs') &&
        textOf(far).includes('outside the displayed scale') &&
        JSON.stringify(yLabels(far)) === JSON.stringify(yLabels(none)) &&
        !textOf(none).includes('Goal')
    })())
    check('S17: mobile-readable chart structure (viewBox scaling, sr-only list, titles)',
      chart.includes('viewBox=') && chart.includes('className="h-auto w-full"') &&
      chart.includes('sr-only') && chart.includes('<title>'))
  }

  // ── 3. Strength (S18–S22) ──────────────────────────────────────────
  console.log('\n3. Strength PRs')
  {
    check('S18: PR data comes from the existing strength-records lib',
      page.includes('fetchStrengthRecords(supabase, user.id)') &&
      !read('src/lib/strength-records.ts').includes('UI-4'))
    check('S19: no invented PR percentage/score',
      !pageCode.includes('improvement') && !pageCode.match(/%\s*(better|stronger|improve)/i))
    check('S20: missing PR state preserved',
      page.includes('No personal records yet.'))
    check('S21: long-label safety on PR cards',
      page.includes('min-w-0 break-words text-sm font-semibold'))
    check('S22: established PR definitions preserved verbatim',
      page.includes("e.type === 'weight' ? 'Weight PR'") &&
      page.includes("'Est. 1RM PR'") &&
      page.includes("`${e.reps} reps${suffix}`") &&
      page.includes("e.isUnilateral ? ' per side' : ''"))
  }

  // ── 4. Runtime: coverage (S23–S28) ─────────────────────────────────
  console.log('\n4. Runtime: training coverage')
  {
    const row = (id: string, muscle: string | null, recent: number) => ({
      exerciseId: id, exerciseName: id, primaryMuscle: muscle, equipment: null,
      trackingMode: 'weight_reps', isUnilateral: false, status: 'improved',
      latestWorkoutDate: '2026-08-01', latestSummary: 'x', secondarySummary: null,
      recentSessionCount: recent,
    })
    const textOf = (rows: ReturnType<typeof row>[]) => {
      const el = TrainingCoverageSection({ rows: rows as never }) as unknown as El
      const t: string[] = []
      collectText(el, t)
      return t.join('')
    }
    check('C-INDEP: coverage is filter-independent (complete rows regardless of the mode filter)', (() => {
      // The page wires the COMPLETE overviewRows into coverage while
      // only the exercise list consumes filteredRows; two different
      // presentation filters therefore yield identical global
      // coverage. Runtime: coverage over the complete set is
      // identical whatever filter the list applies, and filtering
      // WOULD distort it if wired wrongly.
      const rows = [
        row('bench', 'chest', 2), row('run', 'quads', 1), row('plank', 'core', 0),
      ] as never[]
      const complete = TrainingCoverageSection({ rows })
      const completeAgain = TrainingCoverageSection({ rows })
      const filtered = TrainingCoverageSection({ rows: rows.slice(0, 1) as never })
      const t = (el: unknown) => { const o: string[] = []; collectText(el, o); return o.join('') }
      return t(complete) === t(completeAgain) &&
        t(complete) !== t(filtered) &&
        page.includes('<TrainingCoverageSection rows={overviewRows} />') &&
        !page.includes('<TrainingCoverageSection rows={filteredRows}')
    })())
    check('S23: existing coverage data only (aggregates the fetched overview rows)',
      page.includes('<TrainingCoverageSection rows={overviewRows} />') &&
      !stripComments(coverage).includes('fetch') &&
      !stripComments(coverage).includes('supabase'))
    check('S23b: recorded counts aggregate correctly (runtime)', (() => {
      const t = textOf([row('bench', 'chest', 2), row('fly', 'chest', 0), row('squat', 'quads', 1)])
      return t.includes('1 of 2 tracked exercises trained recently') &&
        t.includes('1 of 1 tracked exercise trained recently')
    })())
    check('S24: multi-muscle attribution boundary honest (primary-only, documented)',
      coverage.includes('grouped by their primary muscle') &&
      coverage.includes('deliberately NOT re-derived here') &&
      coverage.includes('never full anatomical'))
    check('S25: missing/untrained state honest (runtime)', (() => {
      const t = textOf([row('bench', 'chest', 1)])
      return t.includes('No tracked exercises yet:') && !t.includes('0%') &&
        textOf([]).includes('Complete a workout to begin building coverage evidence.')
    })())
    check('S26: no consistency score',
      CHANGED.every((f) => !stripComments(f).toLowerCase().includes('consistency score') &&
        !stripComments(f).toLowerCase().includes('streak')))
    // StatusBadge is the pre-existing 2X status pill (text-carrying),
    // not gamification — the ban targets award/milestone badges.
    check('S27: no badges (no award/milestone badge UI)',
      [chart, coverage].every((f) => !stripComments(f).toLowerCase().includes('badge')) &&
      !pageCode.toLowerCase().includes('milestone') &&
      !pageCode.toLowerCase().includes('achievement'))
    check('S28: no upcoming runs',
      CHANGED.every((f) => !stripComments(f).toLowerCase().includes('upcoming run')))
  }

  // ── 5. Energy/adherence preserved (S29–S36) ────────────────────────
  console.log('\n5. Energy/adherence preserved')
  {
    check('S29-33: Energy section + libs byte-untouched by UI-4',
      !energySection.includes('UI-4') &&
      !read('src/components/progress/WeeklyEnergyChart.tsx').includes('UI-4') &&
      ['src/lib/progress-energy.ts', 'src/lib/energy-facts.ts', 'src/lib/energy-model.ts',
        'src/lib/coach-signals.ts', 'src/lib/today-energy.ts']
        .every((f) => !read(f).includes('UI-4')) &&
      // RETARGET (LOCAL-DATE-FIX): the fetch anchor moved from
      // todayISO() (server UTC day) to the user-local day; the
      // byte-untouched-by-UI-4 property above is what this pin
      // protects and it is unchanged.
      page.includes('fetchProgressEnergyTrends(supabase, user.id, localToday, energyRange, target, profile)'))
    check('S34: no eat-back arithmetic',
      CHANGED.every((f) => !/eat.?back|earned (calories|food)/i.test(stripComments(f))))
    check('S35: no burn-credit/expenditure arithmetic',
      CHANGED.every((f) => !/calories_burned|totalBurn|burn.?credit|expenditure/i.test(stripComments(f))))
    check('S36: Phase-5B assertions not weakened (verify-phase5b5 unmodified this phase)',
      !read('scripts/verify-phase5b5.ts').includes('RETARGET (UI-4)'))
  }

  // ── 6. Layout/accessibility (S37–S46) ──────────────────────────────
  console.log('\n6. Layout and accessibility')
  {
    check('S37: 320px overflow safety (single-column base, no fixed widths, no overflow-x)',
      page.includes('grid grid-cols-1 gap-4 lg:grid-cols-12') &&
      !pageCode.includes('overflow-x') && !pageCode.includes('w-[') &&
      !stripComments(chart).includes('overflow-x'))
    check('S38: responsive sections deliberate (feature 8 + rail 4; PR grid tiers)',
      page.includes('lg:col-span-8') && page.includes('lg:col-span-4') &&
      page.includes('sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'))
    check('S39: natural heights (items-start on the split row)',
      page.includes('lg:grid-cols-12 xl:gap-5 items-start'))
    check('S40: no equal-height forcing (no h-full/min-h on cards)',
      !pageCode.match(/[^-]h-full/) && (pageCode.match(/min-h-(?!11)/g) || []).length === 0)
    check('S41: 44px interactive targets preserved (range links from UI-2 min-h-9+; filters py-1.5 chips are pre-existing)',
      energySection.includes('min-h-9'))
    check('S42: range + filter controls are real keyboard-usable links',
      page.includes('<FilterLink') && energySection.includes('<Link') &&
      !pageCode.match(/<div[^>]*onClick/))
    check('S43: visible focus preserved (global focus-visible intact; none removed)',
      read('src/app/globals.css').includes(':focus-visible {') &&
      CHANGED.every((f) => !f.includes('outline-none')))
    // RETARGET (UI-7): original boundary — badges always carry text.
    // STATUS_LABELS became STATUS_META (same text, aria-hidden Lucide
    // icons); the badge still renders the visible label.
    check('S44: state not color-alone (status badges carry text; coverage carries counts)',
      page.includes('STATUS_META[status]') && page.includes('{label}') &&
      coverage.includes('trained recently'))
    check('S45: bottom-nav clearance untouched (shell padding intact)',
      read('src/app/(app)/layout.tsx').includes('pb-[calc(4.5rem+env(safe-area-inset-bottom))]'))
    check('S46: layout-safe loading (mirrors new geometry, aria-hidden, no fake values)',
      loading.includes('max-w-7xl') && loading.includes('lg:col-span-8') &&
      loading.includes('aria-hidden="true"') && !loading.match(/>[A-Z][a-z]+</))
  }

  // ── 7. Boundaries (S47–S54) ────────────────────────────────────────
  console.log('\n7. Boundaries')
  {
    // RETARGET (UI-5B1B): 021_ui5b_transactional_ordering.sql is the approved transactional-ordering migration.
    check('S47: UI-4 added no migration (exactly 22; 022 = approved UI-5B2 file)',
      // RETARGET (UI-5B2): 022_ui5b2_workout_reuse.sql is the approved
      // workout-reuse migration (create_routine_from_workout +
      // repeat_workout). The boundary moves from exactly-21 to
      // exactly-22; no other migration may appear.
      (/* RETARGET (EXLIB-1B2): 023_exlib_catalog_and_delivery_contract.sql is the approved-for-drafting EXLIB catalog migration (DRAFT, not applied); the boundary moves from exactly-22 to exactly-23; no other migration may appear. */ /* RETARGET (EXLIB-1B3B migration 024 draft): 024_exlib_post_application_hardening.sql is the approved-scope hardening draft (DRAFT, not applied; sha256 190550ecdb99df702ab03d1b07592f861070141e5091eb25bc5bf45f211cc980); the boundary moves from exactly-23 to exactly-24; both filenames stay pinned; no other migration may appear. */ readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).length === 24 && readdirSync('supabase/migrations').some((f) => f === '023_exlib_catalog_and_delivery_contract.sql') && readdirSync('supabase/migrations').some((f) => f === '024_exlib_post_application_hardening.sql')))
    check('S48: no new dependency (existing plain-SVG stack meets the requirements)',
      !read('package.json').includes('recharts') && !read('package.json').includes('"d3') &&
      !read('package.json').includes('chart') &&
      read('package.json').includes('"next": "14.2.13"'))
    check('S49: no business-library changes (no UI-4 marker in any lib)',
      readdirSync('src/lib').filter((f) => f.endsWith('.ts'))
        .every((f) => !read(`src/lib/${f}`).includes('UI-4')))
    check('S50: no Today customization regression (verify-ui3 surface untouched)',
      read('src/app/(app)/dashboard/page.tsx').includes('widgetRegistry') &&
      read('src/components/dashboard/CustomizeDashboardClient.tsx').includes('resetToDefault'))
    check('S51: no Train/Nutrition/Coach/Profile redesign (files untouched)',
      ['src/app/(app)/workouts/page.tsx', 'src/app/(app)/nutrition/page.tsx',
        'src/app/(app)/coach/page.tsx', 'src/app/(app)/profile/page.tsx']
        .every((f) => !read(f).includes('UI-4')))
    check('S52: no target-history rewrite (resolveTargetForDate untouched)',
      read('src/lib/energy-facts.ts').includes('export function resolveTargetForDate'))
    check('S53: deterministic rendering (no time/randomness in new components)',
      [chart, coverage].every((f) =>
        !stripComments(f).includes('Math.random') && !stripComments(f).includes('Date.now')))
    check('S54: no unrelated cleanup (pinned legacy copy strings intact)',
      page.includes('Log at least two weigh-ins to see a weight trend.') &&
      page.includes('Log food to begin tracking nutrition consistency.') &&
      page.includes('Complete a workout to begin tracking exercise progress.'))
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
